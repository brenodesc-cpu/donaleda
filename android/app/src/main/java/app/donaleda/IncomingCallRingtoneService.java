package app.donaleda;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ServiceInfo;
import android.media.AudioAttributes;
import android.media.AudioManager;
import android.media.MediaPlayer;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.Build;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.os.VibrationEffect;
import android.os.Vibrator;
import androidx.annotation.Nullable;
import androidx.core.app.NotificationCompat;
import androidx.core.app.Person;
import androidx.core.content.ContextCompat;

/**
 * Serviço em primeiro plano que toca o toque de telefone e vibra continuamente
 * (como uma ligação comum / WhatsApp) por até 45 segundos, enquanto exibe a
 * notificação nativa de chamada (CallStyle + Full-Screen Intent).
 */
public class IncomingCallRingtoneService extends Service {
    public static final String CHANNEL_ID = "donaleda_chamadas_v2";
    private static final String OLD_CHANNEL_ID = "donaleda_chamadas";
    public static final int NOTIFICATION_ID_CALL = 7001;
    private static final long TIMEOUT_MS = 45_000L;

    public static final String EXTRA_CHAMADA_ID = "chamadaId";
    public static final String EXTRA_ASSISTENTE = "assistente";

    private MediaPlayer mediaPlayer;
    private Vibrator vibrator;
    private final Handler handler = new Handler(Looper.getMainLooper());
    private final Runnable timeoutTask = this::stopSelf;

    public static void start(Context context, String chamadaId, String assistente) {
        Intent intent = new Intent(context, IncomingCallRingtoneService.class);
        intent.putExtra(EXTRA_CHAMADA_ID, chamadaId);
        intent.putExtra(EXTRA_ASSISTENTE, assistente);
        ContextCompat.startForegroundService(context, intent);
    }

    public static void stop(Context context) {
        context.stopService(new Intent(context, IncomingCallRingtoneService.class));
        NotificationManager manager = context.getSystemService(NotificationManager.class);
        if (manager != null) {
            manager.cancel(NOTIFICATION_ID_CALL);
        }
    }

    public static void ensureCallChannel(Context context, boolean withChannelSound) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return;
        NotificationManager manager = context.getSystemService(NotificationManager.class);
        if (manager == null) return;

        // Remove canal antigo que só vibrava 2 vezes sem toque contínuo.
        if (manager.getNotificationChannel(OLD_CHANNEL_ID) != null) {
            manager.deleteNotificationChannel(OLD_CHANNEL_ID);
        }

        if (manager.getNotificationChannel(CHANNEL_ID) != null) return;

        NotificationChannel channel = new NotificationChannel(
            CHANNEL_ID,
            "Ligações da Dona Leda",
            NotificationManager.IMPORTANCE_HIGH
        );
        channel.setDescription("Toca como ligação quando a Dona Leda chama pra conversar.");
        channel.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
        channel.setBypassDnd(true);
        if (withChannelSound) {
            Uri ringtoneUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_RINGTONE);
            AudioAttributes attrs = new AudioAttributes.Builder()
                .setUsage(AudioAttributes.USAGE_NOTIFICATION_RINGTONE)
                .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                .build();
            channel.setSound(ringtoneUri, attrs);
            channel.enableVibration(true);
            channel.setVibrationPattern(new long[] { 0, 1000, 1000 });
        } else {
            // O próprio IncomingCallRingtoneService controla o toque contínuo e a vibração em loop,
            // evitando eco duplo e garantindo toque contínuo mesmo com tela desbloqueada.
            channel.setSound(null, null);
            channel.enableVibration(false);
        }
        manager.createNotificationChannel(channel);
    }

    public static Notification buildIncomingCallNotification(
        Context context,
        String chamadaId,
        String assistente,
        boolean insistent
    ) {
        Intent fullScreenIntent = new Intent(context, IncomingCallActivity.class);
        fullScreenIntent.putExtra(IncomingCallActivity.EXTRA_CHAMADA_ID, chamadaId);
        fullScreenIntent.putExtra(IncomingCallActivity.EXTRA_ASSISTENTE, assistente);
        fullScreenIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);

        PendingIntent fullScreenPendingIntent = PendingIntent.getActivity(
            context,
            100,
            fullScreenIntent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        Intent answerIntent = new Intent(context, IncomingCallActivity.class);
        answerIntent.putExtra(IncomingCallActivity.EXTRA_CHAMADA_ID, chamadaId);
        answerIntent.putExtra(IncomingCallActivity.EXTRA_ASSISTENTE, assistente);
        answerIntent.putExtra(IncomingCallActivity.EXTRA_AUTO_ACTION, "atender");
        PendingIntent answerPendingIntent = PendingIntent.getActivity(
            context,
            101,
            answerIntent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        // Recusar pela notificação usa BroadcastReceiver: para o toque na hora e avisa
        // o servidor (POST /api/chamada) em segundo plano sem abrir a tela do app.
        Intent declineIntent = new Intent(context, CallActionReceiver.class);
        declineIntent.setAction(CallActionReceiver.ACTION_DECLINE);
        declineIntent.putExtra(IncomingCallActivity.EXTRA_CHAMADA_ID, chamadaId);
        PendingIntent declinePendingIntent = PendingIntent.getBroadcast(
            context,
            102,
            declineIntent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        Person caller = new Person.Builder().setName(assistente).setImportant(true).build();

        Notification notification = new NotificationCompat.Builder(context, CHANNEL_ID)
            .setSmallIcon(R.mipmap.ic_launcher)
            .setContentTitle(assistente + " está ligando")
            .setContentText("Toque em Atender pra conversar")
            .setPriority(NotificationCompat.PRIORITY_MAX)
            .setCategory(NotificationCompat.CATEGORY_CALL)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setOngoing(true)
            .setAutoCancel(false)
            .setTimeoutAfter(TIMEOUT_MS)
            .setFullScreenIntent(fullScreenPendingIntent, true)
            .setContentIntent(fullScreenPendingIntent)
            .setStyle(
                NotificationCompat.CallStyle.forIncomingCall(
                    caller,
                    declinePendingIntent,
                    answerPendingIntent
                )
            )
            .build();

        if (insistent) {
            notification.flags |= Notification.FLAG_INSISTENT;
        }
        return notification;
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        String chamadaId = intent != null ? intent.getStringExtra(EXTRA_CHAMADA_ID) : "";
        String assistente = intent != null ? intent.getStringExtra(EXTRA_ASSISTENTE) : "Dona Leda";
        if (chamadaId == null) chamadaId = "";
        if (assistente == null || assistente.trim().isEmpty()) assistente = "Dona Leda";

        ensureCallChannel(this, false);
        Notification notification = buildIncomingCallNotification(this, chamadaId, assistente, false);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
            startForeground(
                NOTIFICATION_ID_CALL,
                notification,
                ServiceInfo.FOREGROUND_SERVICE_TYPE_SHORT_SERVICE
            );
        } else {
            startForeground(NOTIFICATION_ID_CALL, notification);
        }

        stopRingtoneAndVibration();
        startLoopingRingtoneAndVibration();

        handler.removeCallbacks(timeoutTask);
        handler.postDelayed(timeoutTask, TIMEOUT_MS);
        return START_NOT_STICKY;
    }

    private void startLoopingRingtoneAndVibration() {
        AudioManager audioManager = (AudioManager) getSystemService(AUDIO_SERVICE);
        int ringerMode = audioManager != null
            ? audioManager.getRingerMode()
            : AudioManager.RINGER_MODE_NORMAL;

        if (ringerMode == AudioManager.RINGER_MODE_NORMAL) {
            try {
                Uri ringtoneUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_RINGTONE);
                if (ringtoneUri == null) {
                    ringtoneUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION);
                }
                if (ringtoneUri != null) {
                    mediaPlayer = new MediaPlayer();
                    mediaPlayer.setAudioAttributes(
                        new AudioAttributes.Builder()
                            .setUsage(AudioAttributes.USAGE_NOTIFICATION_RINGTONE)
                            .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                            .build()
                    );
                    mediaPlayer.setDataSource(this, ringtoneUri);
                    mediaPlayer.setLooping(true);
                    mediaPlayer.prepare();
                    mediaPlayer.start();
                }
            } catch (Exception ignored) {
                releaseMediaPlayer();
            }
        }

        if (ringerMode != AudioManager.RINGER_MODE_SILENT) {
            try {
                vibrator = (Vibrator) getSystemService(VIBRATOR_SERVICE);
                if (vibrator != null && vibrator.hasVibrator()) {
                    long[] pattern = new long[] { 0, 1000, 1000 };
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                        vibrator.vibrate(VibrationEffect.createWaveform(pattern, 0));
                    } else {
                        vibrator.vibrate(pattern, 0);
                    }
                }
            } catch (Exception ignored) {
                // Sem permissão ou hardware de vibração.
            }
        }
    }

    private void releaseMediaPlayer() {
        if (mediaPlayer != null) {
            try {
                if (mediaPlayer.isPlaying()) mediaPlayer.stop();
            } catch (Exception ignored) {
            }
            try {
                mediaPlayer.release();
            } catch (Exception ignored) {
            }
            mediaPlayer = null;
        }
    }

    private void stopRingtoneAndVibration() {
        releaseMediaPlayer();
        if (vibrator != null) {
            try {
                vibrator.cancel();
            } catch (Exception ignored) {
            }
            vibrator = null;
        }
    }

    @Override
    public void onDestroy() {
        handler.removeCallbacks(timeoutTask);
        stopRingtoneAndVibration();
        super.onDestroy();
    }

    @Nullable
    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
}

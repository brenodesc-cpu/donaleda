package app.donaleda;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Intent;
import android.media.AudioAttributes;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.Build;
import androidx.annotation.NonNull;
import androidx.core.app.NotificationCompat;
import androidx.core.app.Person;
import com.google.firebase.messaging.FirebaseMessagingService;
import com.google.firebase.messaging.RemoteMessage;
import java.util.Map;

public class DonaLedaFirebaseMessagingService extends FirebaseMessagingService {
    public static final String CHANNEL_ID = "donaleda_chamadas";
    public static final int NOTIFICATION_ID_CALL = 7001;

    @Override
    public void onNewToken(@NonNull String token) {
        super.onNewToken(token);
        DonaLedaCallPushPlugin.notifyNewToken(getApplicationContext(), token);
    }

    @Override
    public void onMessageReceived(@NonNull RemoteMessage remoteMessage) {
        super.onMessageReceived(remoteMessage);
        Map<String, String> data = remoteMessage.getData();
        if (data == null || !"chamada".equals(data.get("tipo"))) {
            return;
        }
        String chamadaId = data.get("chamadaId");
        if (chamadaId == null || chamadaId.trim().isEmpty()) {
            return;
        }
        String assistente = data.get("assistente");
        if (assistente == null || assistente.trim().isEmpty()) {
            assistente = "Dona Leda";
        }

        ensureCallChannel();
        showIncomingCallNotification(chamadaId.trim(), assistente.trim());
    }

    private void ensureCallChannel() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return;
        NotificationManager manager = getSystemService(NotificationManager.class);
        if (manager == null || manager.getNotificationChannel(CHANNEL_ID) != null) return;

        NotificationChannel channel = new NotificationChannel(
            CHANNEL_ID,
            "Ligações da Dona Leda",
            NotificationManager.IMPORTANCE_HIGH
        );
        channel.setDescription("Toca quando a Dona Leda liga pra conversar.");
        channel.enableVibration(true);
        channel.setVibrationPattern(new long[] { 0, 700, 500, 700 });
        Uri ringtoneUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_RINGTONE);
        AudioAttributes attrs = new AudioAttributes.Builder()
            .setUsage(AudioAttributes.USAGE_NOTIFICATION_RINGTONE)
            .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
            .build();
        channel.setSound(ringtoneUri, attrs);
        manager.createNotificationChannel(channel);
    }

    private void showIncomingCallNotification(String chamadaId, String assistente) {
        Intent fullScreenIntent = new Intent(this, IncomingCallActivity.class);
        fullScreenIntent.putExtra(IncomingCallActivity.EXTRA_CHAMADA_ID, chamadaId);
        fullScreenIntent.putExtra(IncomingCallActivity.EXTRA_ASSISTENTE, assistente);
        fullScreenIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);

        PendingIntent fullScreenPendingIntent = PendingIntent.getActivity(
            this,
            100,
            fullScreenIntent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        Intent answerIntent = new Intent(this, IncomingCallActivity.class);
        answerIntent.putExtra(IncomingCallActivity.EXTRA_CHAMADA_ID, chamadaId);
        answerIntent.putExtra(IncomingCallActivity.EXTRA_ASSISTENTE, assistente);
        answerIntent.putExtra(IncomingCallActivity.EXTRA_AUTO_ACTION, "atender");
        PendingIntent answerPendingIntent = PendingIntent.getActivity(
            this,
            101,
            answerIntent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        Intent declineIntent = new Intent(this, IncomingCallActivity.class);
        declineIntent.putExtra(IncomingCallActivity.EXTRA_CHAMADA_ID, chamadaId);
        declineIntent.putExtra(IncomingCallActivity.EXTRA_ASSISTENTE, assistente);
        declineIntent.putExtra(IncomingCallActivity.EXTRA_AUTO_ACTION, "recusar");
        PendingIntent declinePendingIntent = PendingIntent.getActivity(
            this,
            102,
            declineIntent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        Person caller = new Person.Builder().setName(assistente).setImportant(true).build();

        NotificationCompat.Builder builder = new NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(R.mipmap.ic_launcher)
            .setContentTitle(assistente + " está ligando")
            .setContentText("Toque em Atender pra conversar")
            .setPriority(NotificationCompat.PRIORITY_MAX)
            .setCategory(NotificationCompat.CATEGORY_CALL)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setOngoing(true)
            .setAutoCancel(true)
            .setTimeoutAfter(45_000L)
            .setFullScreenIntent(fullScreenPendingIntent, true)
            .setStyle(
                NotificationCompat.CallStyle.forIncomingCall(
                    caller,
                    declinePendingIntent,
                    answerPendingIntent
                )
            );

        NotificationManager manager = getSystemService(NotificationManager.class);
        if (manager != null) {
            manager.notify(NOTIFICATION_ID_CALL, builder.build());
        }
    }
}

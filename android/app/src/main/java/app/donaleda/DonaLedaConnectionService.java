package app.donaleda;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.media.AudioAttributes;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.telecom.Connection;
import android.telecom.ConnectionRequest;
import android.telecom.ConnectionService;
import android.telecom.DisconnectCause;
import android.telecom.PhoneAccount;
import android.telecom.PhoneAccountHandle;
import android.telecom.TelecomManager;
import androidx.core.app.NotificationCompat;
import androidx.core.app.Person;

/**
 * Integração oficial com o Android Telecom Framework (Self-Managed
 * ConnectionService,
 * mesmo padrão usado por WhatsApp, Telegram e Google Meet) +
 * NotificationCompat.CallStyle
 * com FLAG_INSISTENT (o próprio SystemUI do Android toca o toque de ligação em
 * loop
 * contínuo, sem bloqueios de áudio em segundo plano do Android 14/15/16).
 */
public class DonaLedaConnectionService extends ConnectionService {
    public static final String CHANNEL_ID = "donaleda_chamadas_v3";
    private static final String[] OLD_CHANNELS = { "donaleda_chamadas", "donaleda_chamadas_v2" };
    public static final int NOTIFICATION_ID_CALL = 7001;
    private static final String ACCOUNT_ID = "donaleda_voip_account";
    private static final long TIMEOUT_MS = 45_000L;

    public static final String EXTRA_CHAMADA_ID = "chamadaId";
    public static final String EXTRA_ASSISTENTE = "assistente";
    public static final String EXTRA_SUBTITLE = "subtitle";
    public static final String EXTRA_FAMILY_ROUTE = "familyRoute";

    private static volatile DonaLedaCallConnection activeConnection;

    public static PhoneAccountHandle getPhoneAccountHandle(Context context) {
        return new PhoneAccountHandle(
                new ComponentName(context, DonaLedaConnectionService.class),
                ACCOUNT_ID);
    }

    /**
     * Registra a conta de chamadas VoIP autogerenciada no TelecomManager do
     * Android.
     */
    public static void ensurePhoneAccount(Context context) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O)
            return;
        try {
            TelecomManager telecom = context.getSystemService(TelecomManager.class);
            if (telecom == null)
                return;
            PhoneAccountHandle handle = getPhoneAccountHandle(context);
            PhoneAccount account = PhoneAccount.builder(handle, "Dona Leda")
                    .setCapabilities(PhoneAccount.CAPABILITY_SELF_MANAGED)
                    .build();
            telecom.registerPhoneAccount(account);
        } catch (Exception ignored) {
            // Segue com fallback direto de notificação CallStyle + FLAG_INSISTENT.
        }
    }

    /**
     * Reporta uma nova chamada recebida ao TelecomManager (com fallback seguro).
     */
    public static void reportIncomingCall(Context context, String chamadaId, String assistente) {
        reportIncomingCallWithExtras(context, chamadaId, assistente, null, null);
    }

    /** Reporta chamada de emergência em tela cheia pro celular do familiar (mesmo bloqueado). */
    public static void reportEmergencyFamilyCall(
        Context context,
        String alertaId,
        String titulo,
        String mensagem,
        String familyRoute
    ) {
        reportIncomingCallWithExtras(context, alertaId, titulo, mensagem, familyRoute);
    }

    private static void reportIncomingCallWithExtras(
        Context context,
        String chamadaId,
        String assistente,
        String subtitulo,
        String familyRoute
    ) {
        ensureCallChannel(context);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            try {
                ensurePhoneAccount(context);
                TelecomManager telecom = context.getSystemService(TelecomManager.class);
                if (telecom != null) {
                    Bundle extras = new Bundle();
                    extras.putString(EXTRA_CHAMADA_ID, chamadaId);
                    extras.putString(EXTRA_ASSISTENTE, assistente);
                    if (subtitulo != null) extras.putString(EXTRA_SUBTITLE, subtitulo);
                    if (familyRoute != null) extras.putString(EXTRA_FAMILY_ROUTE, familyRoute);
                    extras.putParcelable(
                            TelecomManager.EXTRA_INCOMING_CALL_ADDRESS,
                            Uri.fromParts("sip", "donaleda@app.donaleda", null));
                    telecom.addNewIncomingCall(getPhoneAccountHandle(context), extras);
                    return;
                }
            } catch (Exception ignored) {
                // Alguns aparelhos restringem Telecom sem conta ativa: cai no fallback abaixo.
            }
        }
        showInsistentCallNotification(context, chamadaId, assistente, subtitulo, familyRoute);
    }

    /**
     * Cria o canal de chamada com toque de telefone (USAGE_NOTIFICATION_RINGTONE) e
     * apaga canais antigos.
     */
    public static void ensureCallChannel(Context context) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O)
            return;
        NotificationManager manager = context.getSystemService(NotificationManager.class);
        if (manager == null)
            return;

        for (String oldId : OLD_CHANNELS) {
            if (manager.getNotificationChannel(oldId) != null) {
                manager.deleteNotificationChannel(oldId);
            }
        }
        if (manager.getNotificationChannel(CHANNEL_ID) != null)
            return;

        NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID,
                "Ligações da Dona Leda",
                NotificationManager.IMPORTANCE_HIGH);
        channel.setDescription("Toque contínuo quando a Dona Leda liga pra conversar.");
        channel.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
        channel.setBypassDnd(true);
        channel.enableVibration(true);
        channel.setVibrationPattern(new long[] { 0, 1000, 1000 });

        Uri ringtoneUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_RINGTONE);
        if (ringtoneUri == null) {
            ringtoneUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION);
        }
        AudioAttributes attrs = new AudioAttributes.Builder()
                .setUsage(AudioAttributes.USAGE_NOTIFICATION_RINGTONE)
                .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                .build();
        channel.setSound(ringtoneUri, attrs);
        manager.createNotificationChannel(channel);
    }

    /**
     * Exibe notificação CallStyle com FLAG_INSISTENT: o próprio SystemUI do Android
     * repete o toque de telefone e a vibração em loop até o usuário atender,
     * recusar
     * ou vencer o tempo limite de 45 segundos.
     */
    public static void showInsistentCallNotification(
            Context context,
            String chamadaId,
            String assistente) {
        showInsistentCallNotification(context, chamadaId, assistente, null, null);
    }

    public static void showInsistentCallNotification(
        Context context,
        String chamadaId,
        String assistente,
        String subtitulo,
        String familyRoute
    ) {
        ensureCallChannel(context);

        boolean ehFamilia = familyRoute != null && familyRoute.startsWith("/familia");
        Intent fullScreenIntent = new Intent(context, IncomingCallActivity.class);
        fullScreenIntent.putExtra(IncomingCallActivity.EXTRA_CHAMADA_ID, chamadaId);
        fullScreenIntent.putExtra(IncomingCallActivity.EXTRA_ASSISTENTE, assistente);
        if (subtitulo != null) fullScreenIntent.putExtra(IncomingCallActivity.EXTRA_SUBTITLE, subtitulo);
        if (ehFamilia) fullScreenIntent.putExtra(IncomingCallActivity.EXTRA_FAMILY_ROUTE, familyRoute);
        fullScreenIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);

        PendingIntent fullScreenPendingIntent = PendingIntent.getActivity(
                context,
                100,
                fullScreenIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);

        Intent answerIntent = new Intent(context, IncomingCallActivity.class);
        answerIntent.putExtra(IncomingCallActivity.EXTRA_CHAMADA_ID, chamadaId);
        answerIntent.putExtra(IncomingCallActivity.EXTRA_ASSISTENTE, assistente);
        if (subtitulo != null) answerIntent.putExtra(IncomingCallActivity.EXTRA_SUBTITLE, subtitulo);
        if (ehFamilia) answerIntent.putExtra(IncomingCallActivity.EXTRA_FAMILY_ROUTE, familyRoute);
        answerIntent.putExtra(IncomingCallActivity.EXTRA_AUTO_ACTION, "atender");
        PendingIntent answerPendingIntent = PendingIntent.getActivity(
                context,
                101,
                answerIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);

        Intent declineIntent = new Intent(context, CallActionReceiver.class);
        declineIntent.setAction(CallActionReceiver.ACTION_DECLINE);
        if (!ehFamilia) {
            declineIntent.putExtra(IncomingCallActivity.EXTRA_CHAMADA_ID, chamadaId);
        }
        PendingIntent declinePendingIntent = PendingIntent.getBroadcast(
                context,
                102,
                declineIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);

        Person caller = new Person.Builder().setName(assistente).setImportant(true).build();
        Uri ringtoneUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_RINGTONE);
        String textoNotif = (subtitulo != null && !subtitulo.trim().isEmpty())
            ? subtitulo.trim()
            : "Toque em Atender pra conversar";

        Notification notification = new NotificationCompat.Builder(context, CHANNEL_ID)
            .setSmallIcon(R.mipmap.ic_launcher)
            .setContentTitle(ehFamilia ? assistente : assistente + " está ligando")
            .setContentText(textoNotif)
            .setPriority(NotificationCompat.PRIORITY_MAX)
            .setCategory(NotificationCompat.CATEGORY_CALL)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setSound(ringtoneUri)
            .setVibrate(new long[] { 0, 1000, 1000 })
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

        // FLAG_INSISTENT: faz o sistema Android repetir o toque e a vibração
        // continuamente
        // (igual ligação telefônica / WhatsApp) até cancelar, atender ou dar timeout.
        notification.flags |= Notification.FLAG_INSISTENT;

        NotificationManager manager = context.getSystemService(NotificationManager.class);
        if (manager != null) {
            manager.notify(NOTIFICATION_ID_CALL, notification);
        }
    }

    /**
     * Encerra a notificação, silencia o toque e finaliza a conexão Telecom ativa.
     */
    public static void endIncomingCall(Context context, boolean answered) {
        NotificationManager manager = context.getSystemService(NotificationManager.class);
        if (manager != null) {
            manager.cancel(NOTIFICATION_ID_CALL);
        }
        DonaLedaCallConnection conn = activeConnection;
        activeConnection = null;
        if (conn != null) {
            conn.finishFromApp(answered);
        }
    }

    @Override
    public Connection onCreateIncomingConnection(
            PhoneAccountHandle connectionManagerPhoneAccount,
            ConnectionRequest request) {
        Bundle extras = request != null ? request.getExtras() : null;
        String chamadaId = extras != null ? extras.getString(EXTRA_CHAMADA_ID, "") : "";
        String assistente = extras != null ? extras.getString(EXTRA_ASSISTENTE, "Dona Leda") : "Dona Leda";
        String subtitulo = extras != null ? extras.getString(EXTRA_SUBTITLE, null) : null;
        String familyRoute = extras != null ? extras.getString(EXTRA_FAMILY_ROUTE, null) : null;
        if (assistente == null || assistente.trim().isEmpty())
            assistente = "Dona Leda";

        DonaLedaCallConnection connection = new DonaLedaCallConnection(
            getApplicationContext(),
            chamadaId != null ? chamadaId.trim() : "",
            assistente.trim(),
            subtitulo,
            familyRoute
        );
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            connection.setConnectionProperties(Connection.PROPERTY_SELF_MANAGED);
        }
        connection.setCallerDisplayName(assistente.trim(), TelecomManager.PRESENTATION_ALLOWED);
        connection.setRinging();
        activeConnection = connection;
        return connection;
    }

    @Override
    public void onCreateIncomingConnectionFailed(
            PhoneAccountHandle connectionManagerPhoneAccount,
            ConnectionRequest request) {
        Bundle extras = request != null ? request.getExtras() : null;
        String chamadaId = extras != null ? extras.getString(EXTRA_CHAMADA_ID, "") : "";
        String assistente = extras != null ? extras.getString(EXTRA_ASSISTENTE, "Dona Leda") : "Dona Leda";
        String subtitulo = extras != null ? extras.getString(EXTRA_SUBTITLE, null) : null;
        String familyRoute = extras != null ? extras.getString(EXTRA_FAMILY_ROUTE, null) : null;
        showInsistentCallNotification(
            getApplicationContext(),
            chamadaId != null ? chamadaId.trim() : "",
            assistente != null && !assistente.trim().isEmpty() ? assistente.trim() : "Dona Leda",
            subtitulo,
            familyRoute
        );
    }

    /**
     * Conexão Telecom individual gerenciada pelo Android durante o toque da
     * ligação.
     */
    public static class DonaLedaCallConnection extends Connection {
        private final Context appContext;
        private final String chamadaId;
        private final String assistente;
        private final String subtitulo;
        private final String familyRoute;
        private final Handler handler = new Handler(Looper.getMainLooper());
        private final Runnable timeoutTask = this::handleTimeout;

        DonaLedaCallConnection(
            Context appContext,
            String chamadaId,
            String assistente,
            String subtitulo,
            String familyRoute
        ) {
            this.appContext = appContext;
            this.chamadaId = chamadaId;
            this.assistente = assistente;
            this.subtitulo = subtitulo;
            this.familyRoute = familyRoute;
        }

        private void handleTimeout() {
            NotificationManager manager = appContext.getSystemService(NotificationManager.class);
            if (manager != null)
                manager.cancel(NOTIFICATION_ID_CALL);
            setDisconnected(new DisconnectCause(DisconnectCause.MISSED));
            destroy();
            if (activeConnection == this)
                activeConnection = null;
        }

        @Override
        public void onShowIncomingCallUi() {
            super.onShowIncomingCallUi();
            showInsistentCallNotification(appContext, chamadaId, assistente, subtitulo, familyRoute);
            handler.removeCallbacks(timeoutTask);
            handler.postDelayed(timeoutTask, TIMEOUT_MS);
        }

        @Override
        public void onSilence() {
            super.onSilence();
            // Botão de volume pressionado: para o toque mantendo o aviso visual se
            // necessário.
            NotificationManager manager = appContext.getSystemService(NotificationManager.class);
            if (manager != null)
                manager.cancel(NOTIFICATION_ID_CALL);
        }

        @Override
        public void onAnswer() {
            super.onAnswer();
            finishFromApp(true);
            boolean ehFamilia = familyRoute != null && familyRoute.startsWith("/familia");
            if (ehFamilia) {
                DonaLedaCallPushPlugin.dispatchFamilyRoute(appContext, familyRoute);
            } else if (!chamadaId.isEmpty()) {
                DonaLedaCallPushPlugin.sendCallResponseAsync(appContext, "atender", chamadaId);
                DonaLedaCallPushPlugin.dispatchCallAction(appContext, "atender", chamadaId);
            }
            Intent openMain = new Intent(appContext, MainActivity.class);
            if (ehFamilia) {
                openMain.putExtra(MainActivity.EXTRA_FAMILY_ROUTE, familyRoute);
            }
            openMain.addFlags(
                    Intent.FLAG_ACTIVITY_NEW_TASK
                            | Intent.FLAG_ACTIVITY_SINGLE_TOP
                            | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            appContext.startActivity(openMain);
        }

        @Override
        public void onReject() {
            super.onReject();
            finishFromApp(false);
            boolean ehFamilia = familyRoute != null && familyRoute.startsWith("/familia");
            if (!ehFamilia && !chamadaId.isEmpty()) {
                DonaLedaCallPushPlugin.sendCallResponseAsync(appContext, "recusar", chamadaId);
                DonaLedaCallPushPlugin.notifyIfActive(appContext, "recusar", chamadaId);
            }
        }

        @Override
        public void onDisconnect() {
            super.onDisconnect();
            finishFromApp(false);
        }

        void finishFromApp(boolean answered) {
            handler.removeCallbacks(timeoutTask);
            if (answered) {
                setActive();
                // Como a WebView/Agora RTC assume o áudio da conversa, encerramos a sessão
                // Telecom de toque logo em seguida para não disputar foco de áudio com a Agora.
                setDisconnected(new DisconnectCause(DisconnectCause.LOCAL));
            } else {
                setDisconnected(new DisconnectCause(DisconnectCause.REJECTED));
            }
            destroy();
        }
    }
}

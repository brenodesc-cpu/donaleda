package app.donaleda;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import androidx.annotation.NonNull;
import androidx.core.app.NotificationCompat;
import com.google.firebase.messaging.FirebaseMessagingService;
import com.google.firebase.messaging.RemoteMessage;
import java.util.Map;

public class DonaLedaFirebaseMessagingService extends FirebaseMessagingService {
    private static final String CHANNEL_ALERTAS_URGENTES = "donaleda_alertas_urgentes_v1";
    private static final String CHANNEL_ALERTAS_FAMILIA = "donaleda_alertas_familia_v1";

    @Override
    public void onNewToken(@NonNull String token) {
        super.onNewToken(token);
        DonaLedaCallPushPlugin.notifyNewToken(getApplicationContext(), token);
    }

    @Override
    public void onMessageReceived(@NonNull RemoteMessage remoteMessage) {
        super.onMessageReceived(remoteMessage);
        Map<String, String> data = remoteMessage.getData();
        if (data == null) {
            return;
        }
        String tipo = data.get("tipo");
        if ("chamada".equals(tipo)) {
            String chamadaId = data.get("chamadaId");
            if (chamadaId == null || chamadaId.trim().isEmpty()) {
                return;
            }
            String assistente = data.get("assistente");
            if (assistente == null || assistente.trim().isEmpty()) {
                assistente = "Dona Leda";
            }

            // Reporta ao Android Telecom Framework (ConnectionService) + CallStyle FLAG_INSISTENT.
            DonaLedaConnectionService.reportIncomingCall(
                getApplicationContext(),
                chamadaId.trim(),
                assistente.trim()
            );
            return;
        }

        if ("alerta_urgente".equals(tipo) || "alerta_familia".equals(tipo)) {
            boolean urgente = "alerta_urgente".equals(tipo) || "urgente".equals(data.get("gravidade"));
            boolean entrarAoVivo = "1".equals(data.get("entrarAoVivo"));
            String titulo = data.get("titulo");
            if (titulo == null || titulo.trim().isEmpty()) {
                titulo = urgente ? "Alerta urgente — Dona Leda" : "Aviso — Dona Leda";
            }
            String mensagem = data.get("mensagem");
            if (mensagem == null || mensagem.trim().isEmpty()) {
                mensagem = "Abra o painel da família para conferir os detalhes.";
            }
            String alertaId = data.get("alertaId");
            String urlDestino = data.get("urlDestino");
            mostrarNotificacaoFamilia(
                getApplicationContext(),
                titulo.trim(),
                mensagem.trim(),
                urgente,
                entrarAoVivo,
                alertaId,
                urlDestino
            );
        }
    }

    private static void ensureFamilyChannels(Context context) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return;
        NotificationManager manager = context.getSystemService(NotificationManager.class);
        if (manager == null) return;

        NotificationChannel urgente = new NotificationChannel(
            CHANNEL_ALERTAS_URGENTES,
            "Alertas urgentes da família",
            NotificationManager.IMPORTANCE_HIGH
        );
        urgente.setDescription("Emergências, quedas, golpes e tentativas sem atendimento");
        urgente.enableVibration(true);
        urgente.setVibrationPattern(new long[] { 0, 400, 200, 400, 200, 500 });
        manager.createNotificationChannel(urgente);

        NotificationChannel normal = new NotificationChannel(
            CHANNEL_ALERTAS_FAMILIA,
            "Avisos e status do dia",
            NotificationManager.IMPORTANCE_DEFAULT
        );
        normal.setDescription("Avisos de rotina, recusas de ligação e resumos da conversa");
        manager.createNotificationChannel(normal);
    }

    private static void mostrarNotificacaoFamilia(
        Context context,
        String titulo,
        String mensagem,
        boolean urgente,
        boolean entrarAoVivo,
        String alertaId,
        String urlDestino
    ) {
        ensureFamilyChannels(context);
        NotificationManager manager = context.getSystemService(NotificationManager.class);
        if (manager == null) return;

        String rota = (urlDestino != null && urlDestino.startsWith("/familia")) ? urlDestino : "/familia";
        Intent intent = new Intent(context, MainActivity.class);
        intent.putExtra(MainActivity.EXTRA_FAMILY_ROUTE, rota);
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        int flags = PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE;
        int requestCode = (alertaId != null && !alertaId.isEmpty()) ? alertaId.hashCode() : (int) System.currentTimeMillis();
        PendingIntent pendingIntent = PendingIntent.getActivity(context, requestCode, intent, flags);

        String channelId = urgente ? CHANNEL_ALERTAS_URGENTES : CHANNEL_ALERTAS_FAMILIA;
        NotificationCompat.Builder builder = new NotificationCompat.Builder(context, channelId)
            .setSmallIcon(context.getApplicationInfo().icon)
            .setContentTitle(titulo)
            .setContentText(mensagem)
            .setStyle(new NotificationCompat.BigTextStyle().bigText(mensagem))
            .setPriority(urgente ? NotificationCompat.PRIORITY_HIGH : NotificationCompat.PRIORITY_DEFAULT)
            .setCategory(urgente ? NotificationCompat.CATEGORY_CALL : NotificationCompat.CATEGORY_STATUS)
            .setAutoCancel(true)
            .setContentIntent(pendingIntent);

        if (entrarAoVivo) {
            builder.addAction(0, "Entrar na ligação agora", pendingIntent);
        }

        int notifId = 4000 + Math.abs(requestCode % 5000);
        manager.notify(notifId, builder.build());
    }
}

package app.donaleda;

import android.app.Notification;
import android.app.NotificationManager;
import androidx.annotation.NonNull;
import com.google.firebase.messaging.FirebaseMessagingService;
import com.google.firebase.messaging.RemoteMessage;
import java.util.Map;

public class DonaLedaFirebaseMessagingService extends FirebaseMessagingService {
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

        String idLimpo = chamadaId.trim();
        String nomeLimpo = assistente.trim();

        try {
            // Toca como ligação real (toque contínuo em loop + vibração contínua + CallStyle).
            IncomingCallRingtoneService.start(getApplicationContext(), idLimpo, nomeLimpo);
        } catch (Exception ignored) {
            // Reserva caso o aparelho bloqueie ForegroundService em segundo plano:
            // notificação insistente (repete toque e vibração até atender/recusar).
            IncomingCallRingtoneService.ensureCallChannel(getApplicationContext(), true);
            Notification notification = IncomingCallRingtoneService.buildIncomingCallNotification(
                getApplicationContext(),
                idLimpo,
                nomeLimpo,
                true
            );
            NotificationManager manager = getSystemService(NotificationManager.class);
            if (manager != null) {
                manager.notify(IncomingCallRingtoneService.NOTIFICATION_ID_CALL, notification);
            }
        }
    }
}

package app.donaleda;

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

        // Reporta ao Android Telecom Framework (ConnectionService) + CallStyle FLAG_INSISTENT.
        DonaLedaConnectionService.reportIncomingCall(
            getApplicationContext(),
            chamadaId.trim(),
            assistente.trim()
        );
    }
}

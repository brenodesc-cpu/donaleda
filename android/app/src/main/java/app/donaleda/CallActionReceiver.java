package app.donaleda;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

/**
 * Recebe o toque em "Recusar / Agora não" diretamente da notificação de chamada,
 * encerra o toque/conexão Telecom na hora e avisa o servidor (POST /api/chamada)
 * mesmo com o app 100% fechado.
 */
public class CallActionReceiver extends BroadcastReceiver {
    public static final String ACTION_DECLINE = "app.donaleda.ACTION_DECLINE_CALL";

    @Override
    public void onReceive(Context context, Intent intent) {
        if (intent == null || !ACTION_DECLINE.equals(intent.getAction())) return;

        String chamadaId = intent.getStringExtra(IncomingCallActivity.EXTRA_CHAMADA_ID);
        DonaLedaConnectionService.endIncomingCall(context, false);

        if (chamadaId == null || chamadaId.trim().isEmpty()) return;
        String idLimpo = chamadaId.trim();

        DonaLedaCallPushPlugin.notifyIfActive(context, "recusar", idLimpo);

        PendingResult pending = goAsync();
        Context appContext = context.getApplicationContext();
        new Thread(() -> {
            try {
                DonaLedaCallPushPlugin.sendCallResponseSync(appContext, "recusar", idLimpo);
            } finally {
                pending.finish();
            }
        }).start();
    }
}

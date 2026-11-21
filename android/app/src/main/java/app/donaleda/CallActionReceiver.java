package app.donaleda;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

/**
 * Recebe o toque em "Recusar / Agora não" diretamente da notificação de chamada,
 * para o toque na hora e avisa o servidor (POST /api/chamada) mesmo com o app fechado.
 */
public class CallActionReceiver extends BroadcastReceiver {
    public static final String ACTION_DECLINE = "app.donaleda.ACTION_DECLINE_CALL";

    @Override
    public void onReceive(Context context, Intent intent) {
        if (intent == null || !ACTION_DECLINE.equals(intent.getAction())) return;

        String chamadaId = intent.getStringExtra(IncomingCallActivity.EXTRA_CHAMADA_ID);
        IncomingCallRingtoneService.stop(context);

        if (chamadaId == null || chamadaId.trim().isEmpty()) return;
        String idLimpo = chamadaId.trim();

        // Notifica o WebView se estiver ativo; se estiver fechado, avisa o servidor direto.
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

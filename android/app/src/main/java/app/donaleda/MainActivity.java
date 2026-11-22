package app.donaleda;

import android.content.Intent;
import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    public static final String EXTRA_FAMILY_ROUTE = "donaleda_family_route";

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(DonaLedaCallPushPlugin.class);
        super.onCreate(savedInstanceState);
        handleFamilyIntent(getIntent());
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        handleFamilyIntent(intent);
    }

    private void handleFamilyIntent(Intent intent) {
        if (intent == null) return;
        String rota = intent.getStringExtra(EXTRA_FAMILY_ROUTE);
        if (rota != null && rota.startsWith("/familia")) {
            intent.removeExtra(EXTRA_FAMILY_ROUTE);
            DonaLedaCallPushPlugin.dispatchFamilyRoute(getApplicationContext(), rota);
        }
    }
}

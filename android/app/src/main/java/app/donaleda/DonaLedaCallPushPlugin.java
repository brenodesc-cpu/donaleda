package app.donaleda;

import android.Manifest;
import android.app.NotificationManager;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;
import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;
import com.google.firebase.FirebaseApp;
import com.google.firebase.messaging.FirebaseMessaging;
import java.io.OutputStream;
import java.lang.ref.WeakReference;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import org.json.JSONObject;

@CapacitorPlugin(
    name = "DonaLedaCallPush",
    permissions = {
        @Permission(alias = "notifications", strings = { Manifest.permission.POST_NOTIFICATIONS })
    }
)
public class DonaLedaCallPushPlugin extends Plugin {
    private static final String PREFS = "donaleda_call_push";
    private static final String CAPACITOR_PREFS = "CapacitorStorage";
    private static final String CAPACITOR_APARELHO_KEY = "donaleda:aparelho";
    private static final String KEY_TOKEN = "fcm_token";
    private static final String KEY_APARELHO_TOKEN = "aparelho_token";
    private static final String KEY_SERVER_URL = "server_url";
    private static final String KEY_ASKED_FULLSCREEN = "asked_fullscreen_intent";
    private static final String KEY_PENDING_ACTION = "pending_action";
    private static final String KEY_PENDING_CALL_ID = "pending_call_id";
    private static final String KEY_PENDING_FAMILY_ROUTE = "pending_family_route";
    private static final String DEFAULT_SERVER_URL = "https://donaleda.vercel.app";

    private static WeakReference<DonaLedaCallPushPlugin> activeInstance = new WeakReference<>(null);

    @Override
    public void load() {
        super.load();
        activeInstance = new WeakReference<>(this);
        DonaLedaConnectionService.ensurePhoneAccount(getContext());
        DonaLedaConnectionService.ensureCallChannel(getContext());
    }

    @Override
    protected void handleOnDestroy() {
        if (activeInstance.get() == this) {
            activeInstance = new WeakReference<>(null);
        }
        super.handleOnDestroy();
    }

    @PluginMethod
    public void register(PluginCall call) {
        String aparelhoToken = call.getString("aparelhoToken");
        String serverUrl = call.getString("serverUrl");
        SharedPreferences.Editor editor = getContext()
            .getSharedPreferences(PREFS, Context.MODE_PRIVATE)
            .edit();
        if (aparelhoToken != null && !aparelhoToken.trim().isEmpty()) {
            editor.putString(KEY_APARELHO_TOKEN, aparelhoToken.trim());
        }
        if (serverUrl != null && (serverUrl.startsWith("https://") || serverUrl.startsWith("http://"))) {
            editor.putString(KEY_SERVER_URL, serverUrl.replaceAll("/+$", ""));
        }
        editor.apply();

        DonaLedaConnectionService.ensurePhoneAccount(getContext());
        DonaLedaConnectionService.ensureCallChannel(getContext());

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU
                && getPermissionState("notifications") != PermissionState.GRANTED) {
            requestPermissionForAlias("notifications", call, "onNotificationPermissionResult");
            return;
        }
        promptFullScreenIntentIfNeeded();
        fetchFcmToken(call);
    }

    @PermissionCallback
    private void onNotificationPermissionResult(PluginCall call) {
        promptFullScreenIntentIfNeeded();
        fetchFcmToken(call);
    }

    /**
     * Registra o celular do familiar responsável para receber alertas e status via FCM,
     * pedindo apenas POST_NOTIFICATIONS (sem tela cheia de telefone nem PhoneAccount).
     */
    @PluginMethod
    public void registerFamilyAlerts(PluginCall call) {
        DonaLedaConnectionService.ensurePhoneAccount(getContext());
        DonaLedaConnectionService.ensureCallChannel(getContext());
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU
                && getPermissionState("notifications") != PermissionState.GRANTED) {
            requestPermissionForAlias("notifications", call, "onFamilyNotificationPermissionResult");
            return;
        }
        promptFullScreenIntentIfNeeded();
        fetchFcmToken(call);
    }

    @PermissionCallback
    private void onFamilyNotificationPermissionResult(PluginCall call) {
        promptFullScreenIntentIfNeeded();
        fetchFcmToken(call);
    }

    /**
     * No Android 14+ (API 34+), USE_FULL_SCREEN_INTENT não é liberado automaticamente
     * em APKs instalados fora da Play Store. Abre o ajuste do sistema uma única vez
     * para o usuário ativar "Notificações em tela cheia" (tela de ligação sobre bloqueio).
     */
    private void promptFullScreenIntentIfNeeded() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.UPSIDE_DOWN_CAKE) return;
        try {
            NotificationManager manager = getContext().getSystemService(NotificationManager.class);
            if (manager == null || manager.canUseFullScreenIntent()) return;

            SharedPreferences prefs = getContext().getSharedPreferences(PREFS, Context.MODE_PRIVATE);
            if (prefs.getBoolean(KEY_ASKED_FULLSCREEN, false)) return;
            prefs.edit().putBoolean(KEY_ASKED_FULLSCREEN, true).apply();

            Intent intent = new Intent(Settings.ACTION_MANAGE_APP_USE_FULL_SCREEN_INTENT);
            intent.setData(Uri.parse("package:" + getContext().getPackageName()));
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(intent);
        } catch (Exception ignored) {
            // Aparelho sem essa tela de configuração: segue com a notificação CallStyle.
        }
    }

    private void fetchFcmToken(PluginCall call) {
        try {
            if (FirebaseApp.getApps(getContext()).isEmpty()) {
                call.resolve(new JSObject());
                return;
            }
            FirebaseMessaging.getInstance().getToken().addOnCompleteListener(task -> {
                JSObject result = new JSObject();
                if (task.isSuccessful() && task.getResult() != null && !task.getResult().isEmpty()) {
                    String token = task.getResult();
                    saveToken(getContext(), token);
                    result.put("token", token);
                    result.put("plataforma", "android");
                }
                call.resolve(result);
            });
        } catch (Exception ignored) {
            call.resolve(new JSObject());
        }
    }

    @PluginMethod
    public void getPendingCall(PluginCall call) {
        SharedPreferences prefs = getContext().getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        String acao = prefs.getString(KEY_PENDING_ACTION, null);
        String chamadaId = prefs.getString(KEY_PENDING_CALL_ID, null);
        prefs.edit().remove(KEY_PENDING_ACTION).remove(KEY_PENDING_CALL_ID).apply();

        JSObject result = new JSObject();
        if (acao != null && chamadaId != null) {
            result.put("acao", acao);
            result.put("chamadaId", chamadaId);
        }
        call.resolve(result);
    }

    @PluginMethod
    public void getPendingFamilyRoute(PluginCall call) {
        SharedPreferences prefs = getContext().getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        String rota = prefs.getString(KEY_PENDING_FAMILY_ROUTE, null);
        prefs.edit().remove(KEY_PENDING_FAMILY_ROUTE).apply();

        JSObject result = new JSObject();
        if (rota != null && rota.startsWith("/familia")) {
            result.put("rota", rota);
        }
        call.resolve(result);
    }

    public static void dispatchFamilyRoute(Context context, String rota) {
        if (rota == null || !rota.startsWith("/familia")) return;
        DonaLedaCallPushPlugin plugin = activeInstance.get();
        if (plugin != null) {
            JSObject data = new JSObject();
            data.put("rota", rota);
            plugin.notifyListeners("familyDeepLink", data);
            return;
        }
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
            .edit()
            .putString(KEY_PENDING_FAMILY_ROUTE, rota)
            .apply();
    }

    public static void saveToken(Context context, String token) {
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
            .edit()
            .putString(KEY_TOKEN, token)
            .apply();
    }

    public static void notifyNewToken(Context context, String token) {
        saveToken(context, token);
        DonaLedaCallPushPlugin plugin = activeInstance.get();
        if (plugin != null) {
            JSObject data = new JSObject();
            data.put("token", token);
            data.put("plataforma", "android");
            plugin.notifyListeners("tokenReceived", data);
        }
    }

    public static void notifyIfActive(Context context, String acao, String chamadaId) {
        DonaLedaCallPushPlugin plugin = activeInstance.get();
        if (plugin != null) {
            JSObject data = new JSObject();
            data.put("acao", acao);
            data.put("chamadaId", chamadaId);
            plugin.notifyListeners("callAction", data);
        }
    }

    public static void dispatchCallAction(Context context, String acao, String chamadaId) {
        DonaLedaCallPushPlugin plugin = activeInstance.get();
        if (plugin != null) {
            JSObject data = new JSObject();
            data.put("acao", acao);
            data.put("chamadaId", chamadaId);
            plugin.notifyListeners("callAction", data);
            return;
        }
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
            .edit()
            .putString(KEY_PENDING_ACTION, acao)
            .putString(KEY_PENDING_CALL_ID, chamadaId)
            .apply();
    }

    /** Lê o x-aparelho-token salvo pelo plugin ou direto do CapacitorStorage (fallback imediato). */
    private static String resolveAparelhoToken(Context context) {
        SharedPreferences prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        String token = prefs.getString(KEY_APARELHO_TOKEN, null);
        if (token != null && !token.trim().isEmpty()) {
            return token.trim();
        }
        try {
            SharedPreferences capPrefs = context.getSharedPreferences(CAPACITOR_PREFS, Context.MODE_PRIVATE);
            String raw = capPrefs.getString(CAPACITOR_APARELHO_KEY, null);
            if (raw != null && !raw.trim().isEmpty()) {
                JSONObject obj = new JSONObject(raw);
                String fromCap = obj.optString("token", "").trim();
                if (!fromCap.isEmpty()) return fromCap;
            }
        } catch (Exception ignored) {
        }
        return null;
    }

    /** Envia POST /api/chamada em thread de fundo (para recusar/atender com app fechado). */
    public static void sendCallResponseAsync(Context context, String acao, String chamadaId) {
        Context appContext = context.getApplicationContext();
        new Thread(() -> sendCallResponseSync(appContext, acao, chamadaId)).start();
    }

    /** Envia POST /api/chamada de forma síncrona (usado em BroadcastReceiver.goAsync). */
    public static void sendCallResponseSync(Context context, String acao, String chamadaId) {
        String aparelhoToken = resolveAparelhoToken(context);
        if (aparelhoToken == null || aparelhoToken.isEmpty()) {
            return;
        }
        SharedPreferences prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        String serverUrl = prefs.getString(KEY_SERVER_URL, DEFAULT_SERVER_URL);
        if (serverUrl == null || serverUrl.trim().isEmpty()) {
            serverUrl = DEFAULT_SERVER_URL;
        }

        HttpURLConnection conn = null;
        try {
            URL url = new URL(serverUrl + "/api/chamada");
            conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("POST");
            conn.setConnectTimeout(8_000);
            conn.setReadTimeout(8_000);
            conn.setDoOutput(true);
            conn.setRequestProperty("Content-Type", "application/json");
            conn.setRequestProperty("x-aparelho-token", aparelhoToken);

            JSONObject body = new JSONObject();
            body.put("acao", acao);
            body.put("chamadaId", chamadaId);
            byte[] payload = body.toString().getBytes(StandardCharsets.UTF_8);

            try (OutputStream os = conn.getOutputStream()) {
                os.write(payload);
            }
            conn.getResponseCode();
        } catch (Exception ignored) {
            // Rede indisponível no momento; fallback no servidor expira a chamada após 45s.
        } finally {
            if (conn != null) conn.disconnect();
        }
    }
}

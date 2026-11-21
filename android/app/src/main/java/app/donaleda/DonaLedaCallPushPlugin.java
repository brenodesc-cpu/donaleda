package app.donaleda;

import android.Manifest;
import android.content.Context;
import android.content.SharedPreferences;
import android.os.Build;
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
    private static final String KEY_TOKEN = "fcm_token";
    private static final String KEY_APARELHO_TOKEN = "aparelho_token";
    private static final String KEY_SERVER_URL = "server_url";
    private static final String KEY_PENDING_ACTION = "pending_action";
    private static final String KEY_PENDING_CALL_ID = "pending_call_id";
    private static final String DEFAULT_SERVER_URL = "https://donaleda.vercel.app";

    private static WeakReference<DonaLedaCallPushPlugin> activeInstance = new WeakReference<>(null);

    @Override
    public void load() {
        super.load();
        activeInstance = new WeakReference<>(this);
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

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU
                && getPermissionState("notifications") != PermissionState.GRANTED) {
            requestPermissionForAlias("notifications", call, "onNotificationPermissionResult");
            return;
        }
        fetchFcmToken(call);
    }

    @PermissionCallback
    private void onNotificationPermissionResult(PluginCall call) {
        fetchFcmToken(call);
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

    /** Envia POST /api/chamada em thread de fundo (para recusar/atender com app fechado). */
    public static void sendCallResponseAsync(Context context, String acao, String chamadaId) {
        Context appContext = context.getApplicationContext();
        new Thread(() -> sendCallResponseSync(appContext, acao, chamadaId)).start();
    }

    /** Envia POST /api/chamada de forma síncrona (usado em BroadcastReceiver.goAsync). */
    public static void sendCallResponseSync(Context context, String acao, String chamadaId) {
        SharedPreferences prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        String aparelhoToken = prefs.getString(KEY_APARELHO_TOKEN, null);
        if (aparelhoToken == null || aparelhoToken.trim().isEmpty()) {
            return;
        }
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
            conn.setRequestProperty("x-aparelho-token", aparelhoToken.trim());

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

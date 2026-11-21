package app.donaleda;

import android.app.KeyguardManager;
import android.content.Intent;
import android.graphics.Color;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.util.TypedValue;
import android.view.Gravity;
import android.view.WindowManager;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.TextView;
import androidx.appcompat.app.AppCompatActivity;

/**
 * Tela cheia de chamada recebida sobre a tela bloqueada (paleta Gema da Dona
 * Leda).
 * O toque contínuo e a vibração são controlados pelo
 * IncomingCallRingtoneService.
 */
public class IncomingCallActivity extends AppCompatActivity {
    public static final String EXTRA_CHAMADA_ID = "chamadaId";
    public static final String EXTRA_ASSISTENTE = "assistente";
    public static final String EXTRA_AUTO_ACTION = "autoAction";

    private static final long TIMEOUT_MS = 45_000L;

    private String chamadaId = "";
    private final Handler handler = new Handler(Looper.getMainLooper());
    private final Runnable timeoutTask = this::finishCallScreen;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        configureLockScreenWakeup();

        chamadaId = getIntent().getStringExtra(EXTRA_CHAMADA_ID);
        if (chamadaId == null)
            chamadaId = "";
        String assistente = getIntent().getStringExtra(EXTRA_ASSISTENTE);
        if (assistente == null || assistente.trim().isEmpty())
            assistente = "Dona Leda";

        String autoAction = getIntent().getStringExtra(EXTRA_AUTO_ACTION);
        if ("atender".equals(autoAction)) {
            onAnswerClicked();
            return;
        }
        if ("recusar".equals(autoAction)) {
            onDeclineClicked();
            return;
        }

        setContentView(buildGemaCallLayout(assistente));
        handler.postDelayed(timeoutTask, TIMEOUT_MS);
    }

    private void configureLockScreenWakeup() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
            setShowWhenLocked(true);
            setTurnScreenOn(true);
            KeyguardManager km = getSystemService(KeyguardManager.class);
            if (km != null) {
                km.requestDismissKeyguard(this, null);
            }
        } else {
            getWindow().addFlags(
                    WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED
                            | WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON
                            | WindowManager.LayoutParams.FLAG_DISMISS_KEYGUARD);
        }
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
    }

    private LinearLayout buildGemaCallLayout(String assistente) {
        // Paleta Gema: Casca #FFF8E8, Café #33200F, Atender #1B7A3D, Goiabada #B03A22
        int pad = dp(28);
        LinearLayout root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setGravity(Gravity.CENTER);
        root.setBackgroundColor(Color.parseColor("#FFF8E8"));
        root.setPadding(pad, dp(48), pad, dp(48));

        TextView subtitle = new TextView(this);
        subtitle.setText("Ligação da assistente virtual");
        subtitle.setTextColor(Color.parseColor("#6B4E35"));
        subtitle.setTextSize(TypedValue.COMPLEX_UNIT_SP, 18);
        subtitle.setGravity(Gravity.CENTER);
        root.addView(subtitle);

        TextView title = new TextView(this);
        title.setText(assistente + "\nestá ligando");
        title.setTextColor(Color.parseColor("#33200F"));
        title.setTextSize(TypedValue.COMPLEX_UNIT_SP, 34);
        title.setTypeface(Typeface.DEFAULT_BOLD);
        title.setGravity(Gravity.CENTER);
        LinearLayout.LayoutParams titleLp = new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT);
        titleLp.topMargin = dp(16);
        titleLp.bottomMargin = dp(48);
        root.addView(title, titleLp);

        Button answerBtn = makeRoundedButton("Atender", "#1B7A3D", 24, dp(76));
        answerBtn.setOnClickListener(v -> onAnswerClicked());
        LinearLayout.LayoutParams answerLp = new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                dp(76));
        answerLp.bottomMargin = dp(20);
        root.addView(answerBtn, answerLp);

        Button declineBtn = makeRoundedButton("Agora não", "#B03A22", 20, dp(64));
        declineBtn.setOnClickListener(v -> onDeclineClicked());
        LinearLayout.LayoutParams declineLp = new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                dp(64));
        root.addView(declineBtn, declineLp);

        return root;
    }

    private Button makeRoundedButton(String text, String hexColor, int textSp, int heightPx) {
        Button btn = new Button(this);
        btn.setText(text);
        btn.setAllCaps(false);
        btn.setTextColor(Color.WHITE);
        btn.setTextSize(TypedValue.COMPLEX_UNIT_SP, textSp);
        btn.setTypeface(Typeface.DEFAULT_BOLD);
        btn.setMinHeight(heightPx);

        GradientDrawable bg = new GradientDrawable();
        bg.setColor(Color.parseColor(hexColor));
        bg.setCornerRadius(dp(20));
        btn.setBackground(bg);
        return btn;
    }

    private int dp(int value) {
        return Math.round(
                TypedValue.applyDimension(
                        TypedValue.COMPLEX_UNIT_DIP,
                        value,
                        getResources().getDisplayMetrics()));
    }

    private void onAnswerClicked() {
        handler.removeCallbacks(timeoutTask);
        DonaLedaConnectionService.endIncomingCall(getApplicationContext(), true);
        if (!chamadaId.isEmpty()) {
            DonaLedaCallPushPlugin.sendCallResponseAsync(getApplicationContext(), "atender", chamadaId);
            DonaLedaCallPushPlugin.dispatchCallAction(getApplicationContext(), "atender", chamadaId);
        }
        Intent openMain = new Intent(this, MainActivity.class);
        openMain.addFlags(
                Intent.FLAG_ACTIVITY_NEW_TASK
                        | Intent.FLAG_ACTIVITY_SINGLE_TOP
                        | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        startActivity(openMain);
        finish();
    }

    private void onDeclineClicked() {
        handler.removeCallbacks(timeoutTask);
        DonaLedaConnectionService.endIncomingCall(getApplicationContext(), false);
        if (!chamadaId.isEmpty()) {
            // Avisa o servidor direto em segundo plano (funciona mesmo com o app fechado!)
            DonaLedaCallPushPlugin.sendCallResponseAsync(getApplicationContext(), "recusar", chamadaId);
            DonaLedaCallPushPlugin.notifyIfActive(getApplicationContext(), "recusar", chamadaId);
        }
        finish();
    }

    private void finishCallScreen() {
        handler.removeCallbacks(timeoutTask);
        DonaLedaConnectionService.endIncomingCall(getApplicationContext(), false);
        finish();
    }

    @Override
    protected void onDestroy() {
        handler.removeCallbacks(timeoutTask);
        super.onDestroy();
    }
}

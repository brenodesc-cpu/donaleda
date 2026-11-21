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
import android.view.View;
import android.view.WindowManager;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.TextView;
import androidx.appcompat.app.AppCompatActivity;

/**
 * Tela cheia de chamada recebida sobre a tela bloqueada (estilo ligação nativa / WhatsApp,
 * na paleta Gema da Dona Leda). O toque contínuo e a vibração são controlados pelo
 * sistema Android via DonaLedaConnectionService (TelecomManager + FLAG_INSISTENT).
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

        configureLockScreenDisplay();

        chamadaId = getIntent().getStringExtra(EXTRA_CHAMADA_ID);
        if (chamadaId == null) chamadaId = "";
        String assistente = getIntent().getStringExtra(EXTRA_ASSISTENTE);
        if (assistente == null || assistente.trim().isEmpty()) assistente = "Dona Leda";

        String autoAction = getIntent().getStringExtra(EXTRA_AUTO_ACTION);
        if ("atender".equals(autoAction)) {
            onAnswerClicked();
            return;
        }
        if ("recusar".equals(autoAction)) {
            onDeclineClicked();
            return;
        }

        setContentView(buildCallScreenLayout(assistente));
        handler.postDelayed(timeoutTask, TIMEOUT_MS);
    }

    /** Exibe a tela de ligação por cima da tela bloqueada e acende o visor (sem pedir PIN antes de atender). */
    private void configureLockScreenDisplay() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
            setShowWhenLocked(true);
            setTurnScreenOn(true);
        } else {
            getWindow().addFlags(
                WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED
                    | WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON
            );
        }
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
    }

    private LinearLayout buildCallScreenLayout(String assistente) {
        // Paleta Gema escura/quente de alto contraste para tela bloqueada:
        // Fundo Café #33200F, texto Casca #FFF8E8, destaque Gema #F7B90F,
        // Atender #1B7A3D, Recusar #C92A2A.
        LinearLayout root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setGravity(Gravity.CENTER_HORIZONTAL);
        root.setBackgroundColor(Color.parseColor("#33200F"));
        root.setPadding(dp(28), dp(64), dp(28), dp(52));

        TextView title = new TextView(this);
        title.setText(assistente);
        title.setTextColor(Color.parseColor("#FFF8E8"));
        title.setTextSize(TypedValue.COMPLEX_UNIT_SP, 34);
        title.setTypeface(Typeface.DEFAULT_BOLD);
        title.setGravity(Gravity.CENTER);
        root.addView(title);

        TextView subtitle = new TextView(this);
        subtitle.setText("Ligação da assistente virtual");
        subtitle.setTextColor(Color.parseColor("#FDEBB5"));
        subtitle.setTextSize(TypedValue.COMPLEX_UNIT_SP, 18);
        subtitle.setGravity(Gravity.CENTER);
        LinearLayout.LayoutParams subLp = new LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.MATCH_PARENT,
            LinearLayout.LayoutParams.WRAP_CONTENT
        );
        subLp.topMargin = dp(8);
        root.addView(subtitle, subLp);

        // Espaço superior flexível
        root.addView(spacer(1f));

        // Avatar central circular grande (estilo tela de ligação WhatsApp)
        LinearLayout avatarWrap = new LinearLayout(this);
        avatarWrap.setGravity(Gravity.CENTER);
        GradientDrawable ringBg = new GradientDrawable();
        ringBg.setShape(GradientDrawable.OVAL);
        ringBg.setColor(Color.parseColor("#FFF8E8"));
        ringBg.setStroke(dp(5), Color.parseColor("#F7B90F"));
        avatarWrap.setBackground(ringBg);
        int avatarSize = dp(176);
        LinearLayout.LayoutParams avatarWrapLp = new LinearLayout.LayoutParams(avatarSize, avatarSize);
        avatarWrapLp.gravity = Gravity.CENTER_HORIZONTAL;

        ImageView icon = new ImageView(this);
        icon.setImageResource(R.mipmap.ic_launcher_round);
        icon.setScaleType(ImageView.ScaleType.CENTER_CROP);
        int iconSize = dp(156);
        avatarWrap.addView(icon, new LinearLayout.LayoutParams(iconSize, iconSize));
        root.addView(avatarWrap, avatarWrapLp);

        // Espaço inferior flexível
        root.addView(spacer(1.2f));

        // Linha inferior com dois botões grandes e claros: Recusar (esquerda) e Atender (direita)
        LinearLayout actions = new LinearLayout(this);
        actions.setOrientation(LinearLayout.HORIZONTAL);
        actions.setGravity(Gravity.CENTER);
        LinearLayout.LayoutParams actionsLp = new LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.MATCH_PARENT,
            LinearLayout.LayoutParams.WRAP_CONTENT
        );
        actionsLp.bottomMargin = dp(12);

        actions.addView(
            makeCallCircleAction("Recusar", "✕", "#C92A2A", v -> onDeclineClicked()),
            new LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f)
        );
        actions.addView(
            makeCallCircleAction("Atender", "✓", "#1B7A3D", v -> onAnswerClicked()),
            new LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f)
        );
        root.addView(actions, actionsLp);

        return root;
    }

    private View spacer(float weight) {
        View v = new View(this);
        v.setLayoutParams(new LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, 0, weight));
        return v;
    }

    private LinearLayout makeCallCircleAction(
        String label,
        String symbol,
        String hexColor,
        View.OnClickListener listener
    ) {
        LinearLayout col = new LinearLayout(this);
        col.setOrientation(LinearLayout.VERTICAL);
        col.setGravity(Gravity.CENTER);
        col.setOnClickListener(listener);

        TextView circle = new TextView(this);
        circle.setText(symbol);
        circle.setTextColor(Color.WHITE);
        circle.setTextSize(TypedValue.COMPLEX_UNIT_SP, 34);
        circle.setTypeface(Typeface.DEFAULT_BOLD);
        circle.setGravity(Gravity.CENTER);
        GradientDrawable bg = new GradientDrawable();
        bg.setShape(GradientDrawable.OVAL);
        bg.setColor(Color.parseColor(hexColor));
        circle.setBackground(bg);

        int size = dp(82);
        col.addView(circle, new LinearLayout.LayoutParams(size, size));

        TextView caption = new TextView(this);
        caption.setText(label);
        caption.setTextColor(Color.parseColor("#FFF8E8"));
        caption.setTextSize(TypedValue.COMPLEX_UNIT_SP, 18);
        caption.setTypeface(Typeface.DEFAULT_BOLD);
        caption.setGravity(Gravity.CENTER);
        LinearLayout.LayoutParams capLp = new LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.WRAP_CONTENT,
            LinearLayout.LayoutParams.WRAP_CONTENT
        );
        capLp.topMargin = dp(12);
        col.addView(caption, capLp);

        return col;
    }

    private int dp(int value) {
        return Math.round(
            TypedValue.applyDimension(
                TypedValue.COMPLEX_UNIT_DIP,
                value,
                getResources().getDisplayMetrics()
            )
        );
    }

    private void onAnswerClicked() {
        handler.removeCallbacks(timeoutTask);
        DonaLedaConnectionService.endIncomingCall(getApplicationContext(), true);
        if (!chamadaId.isEmpty()) {
            DonaLedaCallPushPlugin.sendCallResponseAsync(getApplicationContext(), "atender", chamadaId);
            DonaLedaCallPushPlugin.dispatchCallAction(getApplicationContext(), "atender", chamadaId);
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            KeyguardManager km = getSystemService(KeyguardManager.class);
            if (km != null && km.isKeyguardLocked()) {
                km.requestDismissKeyguard(this, null);
            }
        }
        Intent openMain = new Intent(this, MainActivity.class);
        openMain.addFlags(
            Intent.FLAG_ACTIVITY_NEW_TASK
                | Intent.FLAG_ACTIVITY_SINGLE_TOP
                | Intent.FLAG_ACTIVITY_CLEAR_TOP
        );
        startActivity(openMain);
        finish();
    }

    private void onDeclineClicked() {
        handler.removeCallbacks(timeoutTask);
        DonaLedaConnectionService.endIncomingCall(getApplicationContext(), false);
        if (!chamadaId.isEmpty()) {
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

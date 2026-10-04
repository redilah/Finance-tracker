package com.redilah.financetracker;

import android.content.Intent;
import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
import com.redilah.financetracker.auth.CassielNativeGoogleAuthPlugin;
import com.redilah.financetracker.billing.CassielNativeBillingPlugin;
import com.redilah.financetracker.notificationtracker.NotificationTrackerPlugin;
import com.redilah.financetracker.widget.WidgetBridgePlugin;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(WidgetBridgePlugin.class);
        registerPlugin(NotificationTrackerPlugin.class);
        registerPlugin(CassielNativeBillingPlugin.class);
        registerPlugin(CassielNativeGoogleAuthPlugin.class);
        super.onCreate(savedInstanceState);
        handleWidgetIntent(getIntent());
        com.redilah.financetracker.notificationtracker.CassielUpdateReceiver.rebindListenerService(getApplicationContext());
    }

    @Override
    public void onResume() {
        super.onResume();
        com.redilah.financetracker.notificationtracker.CassielUpdateReceiver.rebindListenerService(getApplicationContext());
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        handleWidgetIntent(intent);
    }

    // Whitelist aksi widget yang diizinkan untuk mencegah injeksi JavaScript (OWASP MASVS-PLATFORM-2 / MASVS-CODE-4)
    private static final java.util.Set<String> ALLOWED_WIDGET_ACTIONS = new java.util.HashSet<>(java.util.Arrays.asList(
        "OPEN_BUDGET",
        "OPEN_STATS",
        "OPEN_ADD_MODAL",
        "OPEN_VOICE"
    ));

    private void handleWidgetIntent(Intent intent) {
        if (intent == null) return;
        String actionTarget = intent.getStringExtra("ACTION_TARGET");
        if (actionTarget == null) return;

        // Validasi ketat: hanya proses jika action ada di dalam whitelist
        if (!ALLOWED_WIDGET_ACTIONS.contains(actionTarget)) {
            android.util.Log.w("MainActivity", "Rejected unauthorized or unwhitelisted widget action: " + actionTarget);
            return;
        }

        if (getBridge() != null && getBridge().getWebView() != null) {
            String safeAction = org.json.JSONObject.quote(actionTarget);
            String js = "window.dispatchEvent(new CustomEvent('app_widget_action', { detail: { action: " + safeAction + " } }));";
            getBridge().getWebView().post(() -> getBridge().getWebView().evaluateJavascript(js, null));
        }
    }
}

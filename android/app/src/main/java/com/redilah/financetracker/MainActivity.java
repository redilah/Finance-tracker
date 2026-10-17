package com.redilah.financetracker;

import android.content.Intent;
import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
import com.redilah.financetracker.auth.CassielNativeGoogleAuthPlugin;
import com.redilah.financetracker.billing.CassielNativeBillingPlugin;
import com.redilah.financetracker.groupnotification.CassielGroupNotificationPlugin;
import com.redilah.financetracker.notificationtracker.NotificationTrackerPlugin;
import com.redilah.financetracker.widget.WidgetBridgePlugin;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(WidgetBridgePlugin.class);
        registerPlugin(NotificationTrackerPlugin.class);
        registerPlugin(CassielNativeBillingPlugin.class);
        registerPlugin(CassielNativeGoogleAuthPlugin.class);
        registerPlugin(CassielGroupNotificationPlugin.class);
        super.onCreate(savedInstanceState);
        handleWidgetIntent(getIntent());
        handleDeepLinkIntent(getIntent());
        handleChatIntent(getIntent());
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
        handleDeepLinkIntent(intent);
        handleChatIntent(intent);
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

    private void handleDeepLinkIntent(Intent intent) {
        if (intent == null) return;
        String rawCode = null;
        android.net.Uri data = intent.getData();
        if (data != null) {
            rawCode = data.getQueryParameter("g");
            if (rawCode == null || rawCode.isEmpty()) {
                rawCode = data.getQueryParameter("joinGroup");
            }
        }
        if ((rawCode == null || rawCode.isEmpty()) && intent.hasExtra("g")) {
            rawCode = intent.getStringExtra("g");
        }
        if (rawCode == null) return;

        String cleanCode = rawCode.trim().toUpperCase();
        // Validasi ketat: hanya karakter alfanumerik 3-16 karakter (OWASP MASVS-CODE-4)
        if (!cleanCode.matches("^[A-Z0-9]{3,16}$")) {
            android.util.Log.w("MainActivity", "Rejected invalid group invite code format from deep link");
            return;
        }

        // Bersihkan data intent agar tidak dieksekusi berulang saat rotasi layar
        intent.setData(null);
        intent.removeExtra("g");

        if (getBridge() != null && getBridge().getWebView() != null) {
            String safeCode = org.json.JSONObject.quote(cleanCode);
            String js = "window.__PENDING_GROUP_INVITE__ = " + safeCode + "; " +
                        "window.dispatchEvent(new CustomEvent('cassiel_join_group', { detail: { inviteCode: " + safeCode + " } }));";
            android.webkit.WebView webView = getBridge().getWebView();
            webView.post(() -> webView.evaluateJavascript(js, null));
            webView.postDelayed(() -> webView.evaluateJavascript(js, null), 1500);
        }
    }

    private void handleChatIntent(Intent intent) {
        if (intent == null) return;
        String action = intent.getAction();
        if ("ACTION_OPEN_CHAT_GROUP".equals(action) || intent.hasExtra("groupId")) {
            String groupId = intent.getStringExtra("groupId");
            String groupName = intent.getStringExtra("groupName");
            intent.setAction(null);
            intent.removeExtra("groupId");
            intent.removeExtra("groupName");
            setIntent(new Intent());
            if (groupId != null && !groupId.trim().isEmpty()) {
                if (getBridge() != null && getBridge().getWebView() != null) {
                    String safeGroupId = org.json.JSONObject.quote(groupId);
                    String safeGroupName = groupName != null ? org.json.JSONObject.quote(groupName) : "null";
                    String js = "window.__PENDING_CHAT_GROUP__ = { groupId: " + safeGroupId + ", groupName: " + safeGroupName + " }; " +
                                "window.dispatchEvent(new CustomEvent('cassiel_open_chat_group', { detail: { groupId: " + safeGroupId + ", groupName: " + safeGroupName + " } }));";
                    android.webkit.WebView webView = getBridge().getWebView();
                    webView.post(() -> webView.evaluateJavascript(js, null));
                }
            }
        }
    }
}


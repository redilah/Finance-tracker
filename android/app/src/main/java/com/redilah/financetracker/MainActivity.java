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

    private void handleWidgetIntent(Intent intent) {
        if (intent == null) return;
        String actionTarget = intent.getStringExtra("ACTION_TARGET");
        if (actionTarget != null && getBridge() != null && getBridge().getWebView() != null) {
            String js = "window.dispatchEvent(new CustomEvent('app_widget_action', { detail: { action: '" + actionTarget + "' } }));";
            getBridge().getWebView().post(() -> getBridge().getWebView().evaluateJavascript(js, null));
        }
    }
}

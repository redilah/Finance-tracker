package com.redilah.financetracker.notificationtracker;

import android.content.BroadcastReceiver;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.os.Build;
import android.util.Log;

import androidx.core.app.NotificationManagerCompat;

import java.util.Set;

/**
 * Cassiel Package & Boot Update Receiver
 *
 * Menjamin Notification Auto Tracker tetap aktif dan ter-rebind secara otomatis
 * setelah pembaruan aplikasi (.aab / .apk melalui Play Store / OS update)
 * dan saat HP baru saja dinyalakan (BOOT_COMPLETED) tanpa perlu membuka aplikasi terlebih dahulu.
 */
public class CassielUpdateReceiver extends BroadcastReceiver {

    private static final String TAG = "CassielUpdateReceiver";
    private static final String PREFS_NAME = "CassielNotifTrackerPrefs";
    private static final String KEY_ENABLED = "cassiel_notif_tracker_enabled";

    @Override
    public void onReceive(Context context, Intent intent) {
        if (context == null || intent == null) return;

        String action = intent.getAction();
        Log.d(TAG, "CassielUpdateReceiver triggered with action: " + action);

        if (Intent.ACTION_MY_PACKAGE_REPLACED.equals(action)
                || Intent.ACTION_BOOT_COMPLETED.equals(action)
                || "android.intent.action.QUICKBOOT_POWERON".equals(action)) {

            try {
                // 1. Pastikan state tracking enabled tersimpan aktif di SharedPreferences
                SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
                boolean isExplicitlyDisabled = prefs.contains(KEY_ENABLED) && !prefs.getBoolean(KEY_ENABLED, true);
                if (!isExplicitlyDisabled) {
                    prefs.edit().putBoolean(KEY_ENABLED, true).apply();
                }

                // 2. Cek apakah user telah memberikan izin Notification Access di OS
                String packageName = context.getPackageName();
                Set<String> enabledListeners = NotificationManagerCompat.getEnabledListenerPackages(context);
                boolean hasPermission = enabledListeners != null && enabledListeners.contains(packageName);

                if (hasPermission) {
                    Log.d(TAG, "Notification listener permission is granted. Rebinding listener service now...");
                    rebindListenerService(context);
                } else {
                    Log.d(TAG, "Notification listener permission is not yet granted by user.");
                }
            } catch (Throwable t) {
                Log.e(TAG, "Error in CassielUpdateReceiver handling: " + action, t);
            }
        }
    }

    /**
     * Memaksa Android OS me-rebind NotificationListenerService secara programmatic
     * menggunakan Component toggle trick & requestRebind.
     */
    public static void rebindListenerService(Context context) {
        if (context == null) return;

        try {
            ComponentName componentName = new ComponentName(context, CassielNotificationListenerService.class);
            PackageManager pm = context.getPackageManager();

            // Trik resmi Android: Toggle component disabled -> enabled untuk memaksa
            // NotificationManagerService di sistem OS menyambung ulang IPC connection.
            pm.setComponentEnabledSetting(
                    componentName,
                    PackageManager.COMPONENT_ENABLED_STATE_DISABLED,
                    PackageManager.DONT_KILL_APP
            );

            pm.setComponentEnabledSetting(
                    componentName,
                    PackageManager.COMPONENT_ENABLED_STATE_ENABLED,
                    PackageManager.DONT_KILL_APP
            );

            // Pada Android 7.0+ (Nougat ke atas), panggil juga requestRebind
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
                try {
                    CassielNotificationListenerService.requestRebind(componentName);
                } catch (Throwable rebindEx) {
                    Log.d(TAG, "requestRebind notice: " + rebindEx.getMessage());
                }
            }

            Log.i(TAG, "Cassiel NotificationListenerService successfully rebound!");
        } catch (Throwable e) {
            Log.e(TAG, "Failed to rebind NotificationListenerService", e);
        }
    }
}

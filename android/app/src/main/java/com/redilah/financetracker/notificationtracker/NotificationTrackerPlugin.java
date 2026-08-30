package com.redilah.financetracker.notificationtracker;

import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.provider.Settings;

import androidx.core.app.NotificationManagerCompat;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import org.json.JSONArray;

import java.util.Set;

@CapacitorPlugin(name = "NotificationTracker")
public class NotificationTrackerPlugin extends Plugin {

    private static final String PREFS_NAME = "CassielNotifTrackerPrefs";
    private static final String KEY_ENABLED = "cassiel_notif_tracker_enabled";
    private static final String KEY_QUEUE = "cassiel_notif_tracker_queue";

    @PluginMethod
    public void getQueuedNotifications(PluginCall call) {
        try {
            SharedPreferences prefs = getContext().getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
            
            synchronized (CassielNotificationListenerService.class) {
                String queueStr = prefs.getString(KEY_QUEUE, "[]");
                JSArray queue = new JSArray(queueStr);
                
                // Clear the queue after reading
                prefs.edit().putString(KEY_QUEUE, "[]").apply();
                
                JSObject ret = new JSObject();
                ret.put("notifications", queue);
                call.resolve(ret);
            }
        } catch (Exception e) {
            call.reject("Failed to get notifications", e);
        }
    }

    @PluginMethod
    public void isListenerEnabled(PluginCall call) {
        try {
            String packageName = getContext().getPackageName();
            Set<String> enabledListeners = NotificationManagerCompat.getEnabledListenerPackages(getContext());
            boolean isEnabled = enabledListeners.contains(packageName);
            
            JSObject ret = new JSObject();
            ret.put("enabled", isEnabled);
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("Failed to check listener status", e);
        }
    }

    @PluginMethod
    public void openNotificationAccessSettings(PluginCall call) {
        try {
            Intent intent = new Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(intent);
            call.resolve();
        } catch (Exception e) {
            call.reject("Failed to open settings", e);
        }
    }

    @PluginMethod
    public void setTrackingEnabled(PluginCall call) {
        try {
            Boolean enabled = call.getBoolean("enabled");
            if (enabled == null) {
                call.reject("Must provide 'enabled' boolean");
                return;
            }
            
            SharedPreferences prefs = getContext().getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
            prefs.edit().putBoolean(KEY_ENABLED, enabled).apply();
            
            call.resolve();
        } catch (Exception e) {
            call.reject("Failed to set tracking enabled", e);
        }
    }

    @PluginMethod
    public void isTrackingEnabled(PluginCall call) {
        try {
            SharedPreferences prefs = getContext().getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
            boolean isEnabled = prefs.getBoolean(KEY_ENABLED, false);
            
            JSObject ret = new JSObject();
            ret.put("enabled", isEnabled);
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("Failed to get tracking status", e);
        }
    }
}

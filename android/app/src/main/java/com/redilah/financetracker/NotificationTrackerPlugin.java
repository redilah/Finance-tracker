package com.redilah.financetracker;

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

@CapacitorPlugin(name = "NotificationTracker")
public class NotificationTrackerPlugin extends Plugin {

    private static final String PREF_NAME = "NotificationTrackerPrefs";
    private static final String PENDING_KEY = "pending_notifications";
    private static final String ENABLED_KEY = "auto_tracker_enabled";

    @PluginMethod
    public void checkPermission(PluginCall call) {
        Context context = getContext();
        boolean isEnabled = NotificationManagerCompat.getEnabledListenerPackages(context).contains(context.getPackageName());
        
        JSObject ret = new JSObject();
        ret.put("granted", isEnabled);
        call.resolve(ret);
    }

    @PluginMethod
    public void requestPermission(PluginCall call) {
        Context context = getContext();
        Intent intent = new Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS);
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        context.startActivity(intent);
        
        call.resolve();
    }

    @PluginMethod
    public void setAutoTrackerEnabled(PluginCall call) {
        Boolean enabled = call.getBoolean("enabled", false);
        Context context = getContext();
        SharedPreferences prefs = context.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE);
        prefs.edit().putBoolean(ENABLED_KEY, enabled).apply();
        
        JSObject ret = new JSObject();
        ret.put("success", true);
        ret.put("enabled", enabled);
        call.resolve(ret);
    }

    @PluginMethod
    public void isAutoTrackerEnabled(PluginCall call) {
        Context context = getContext();
        SharedPreferences prefs = context.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE);
        boolean enabled = prefs.getBoolean(ENABLED_KEY, false);
        
        JSObject ret = new JSObject();
        ret.put("enabled", enabled);
        call.resolve(ret);
    }

    @PluginMethod
    public void getPendingNotifications(PluginCall call) {
        Context context = getContext();
        SharedPreferences prefs = context.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE);
        
        String pendingStr = prefs.getString(PENDING_KEY, "[]");
        
        try {
            JSONArray pendingArray = new JSONArray(pendingStr);
            JSArray jsArray = new JSArray();
            for(int i = 0; i < pendingArray.length(); i++) {
                jsArray.put(pendingArray.getJSONObject(i));
            }
            
            // Clear pending queue after reading
            prefs.edit().putString(PENDING_KEY, "[]").apply();
            
            JSObject ret = new JSObject();
            ret.put("notifications", jsArray);
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("Error parsing notifications", e);
        }
    }
}

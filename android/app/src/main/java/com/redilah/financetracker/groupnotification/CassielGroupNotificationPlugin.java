package com.redilah.financetracker.groupnotification;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.SharedPreferences;
import android.os.Build;
import android.util.Log;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import org.json.JSONArray;
import org.json.JSONObject;

@CapacitorPlugin(name = "CassielGroupNotification")
public class CassielGroupNotificationPlugin extends Plugin {

    private static final String TAG = "CassielGroupNotifPlg";
    private static final String PREFS_NAME = "CassielGroupChatNotifs";

    private BroadcastReceiver replyReceiver;

    @Override
    public void load() {
        super.load();
        try {
            CassielGroupNotificationManager.createNotificationChannel(getContext());

            // Register broadcast listener for inline direct replies from notifications
            replyReceiver = new BroadcastReceiver() {
                @Override
                public void onReceive(Context context, Intent intent) {
                    if (intent != null && "com.redilah.financetracker.ACTION_NEW_DIRECT_REPLY".equals(intent.getAction())) {
                        String groupId = intent.getStringExtra("groupId");
                        String text = intent.getStringExtra("text");
                        if (groupId != null && text != null) {
                            JSObject data = new JSObject();
                            data.put("groupId", groupId);
                            data.put("text", text);
                            notifyListeners("directReplyReceived", data);
                        }
                    }
                }
            };

            IntentFilter filter = new IntentFilter("com.redilah.financetracker.ACTION_NEW_DIRECT_REPLY");
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                getContext().registerReceiver(replyReceiver, filter, Context.RECEIVER_NOT_EXPORTED);
            } else {
                getContext().registerReceiver(replyReceiver, filter);
            }
        } catch (Throwable t) {
            Log.e(TAG, "Error in load()", t);
        }
    }

    @Override
    protected void handleOnDestroy() {
        super.handleOnDestroy();
        if (replyReceiver != null) {
            try {
                getContext().unregisterReceiver(replyReceiver);
            } catch (Throwable ignored) {}
            replyReceiver = null;
        }
    }

    @PluginMethod
    public void notifyChatMessage(PluginCall call) {
        try {
            String groupId = call.getString("groupId");
            String groupName = call.getString("groupName", "Grup");
            String groupAvatar = call.getString("groupAvatar");
            String senderId = call.getString("senderId", "");
            String senderName = call.getString("senderName", "Anggota");
            String senderAvatar = call.getString("senderAvatar");
            String text = call.getString("text", "");
            
            Double tsDouble = call.getDouble("timestamp");
            long timestamp = tsDouble != null ? tsDouble.longValue() : System.currentTimeMillis();

            if (groupId == null || groupId.trim().isEmpty()) {
                call.reject("groupId is required");
                return;
            }

            CassielGroupNotificationManager.showGroupChatMessage(
                    getContext(),
                    groupId,
                    groupName,
                    groupAvatar,
                    senderId,
                    senderName,
                    senderAvatar,
                    text,
                    timestamp
            );

            call.resolve();
        } catch (Exception e) {
            Log.e(TAG, "notifyChatMessage failed", e);
            call.reject("Failed: " + e.getMessage());
        }
    }

    @PluginMethod
    public void clearGroupNotifications(PluginCall call) {
        String groupId = call.getString("groupId");
        if (groupId != null) {
            CassielGroupNotificationManager.clearGroupNotification(getContext(), groupId);
        }
        call.resolve();
    }

    @PluginMethod
    public void isGroupMuted(PluginCall call) {
        String groupId = call.getString("groupId");
        boolean muted = CassielGroupNotificationManager.isGroupMuted(getContext(), groupId);
        JSObject ret = new JSObject();
        ret.put("isMuted", muted);
        call.resolve(ret);
    }

    @PluginMethod
    public void setGroupMuted(PluginCall call) {
        String groupId = call.getString("groupId");
        Double duration = call.getDouble("durationMs");
        long durationMs = duration != null ? duration.longValue() : (8 * 60 * 60 * 1000L);
        CassielGroupNotificationManager.setGroupMuted(getContext(), groupId, durationMs);
        call.resolve();
    }

    @PluginMethod
    public void unmuteGroup(PluginCall call) {
        String groupId = call.getString("groupId");
        CassielGroupNotificationManager.unmuteGroup(getContext(), groupId);
        call.resolve();
    }

    @PluginMethod
    public void getPendingReplies(PluginCall call) {
        try {
            SharedPreferences prefs = getContext().getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
            String raw = prefs.getString("pending_outgoing_replies", "[]");
            JSArray array = new JSArray(raw);

            // Clear after reading
            prefs.edit().remove("pending_outgoing_replies").apply();

            JSObject ret = new JSObject();
            ret.put("replies", array);
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("Error fetching pending replies", e);
        }
    }
}

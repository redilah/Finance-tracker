package com.redilah.financetracker.groupnotification;

import android.app.NotificationManager;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Bundle;
import android.util.Log;
import android.widget.Toast;

import androidx.core.app.NotificationManagerCompat;
import androidx.core.app.RemoteInput;

import org.json.JSONArray;
import org.json.JSONObject;

public class CassielChatActionReceiver extends BroadcastReceiver {

    private static final String TAG = "CassielChatAction";

    public static final String ACTION_REPLY = "com.redilah.financetracker.groupnotification.ACTION_REPLY";
    public static final String ACTION_MARK_AS_READ = "com.redilah.financetracker.groupnotification.ACTION_MARK_AS_READ";
    public static final String ACTION_MUTE = "com.redilah.financetracker.groupnotification.ACTION_MUTE";

    public static final String EXTRA_GROUP_ID = "extra_group_id";
    public static final String EXTRA_GROUP_NAME = "extra_group_name";
    public static final String EXTRA_NOTIF_ID = "extra_notif_id";
    public static final String KEY_TEXT_REPLY = "key_text_reply";

    @Override
    public void onReceive(Context context, Intent intent) {
        if (context == null || intent == null) return;

        String action = intent.getAction();
        String groupId = intent.getStringExtra(EXTRA_GROUP_ID);
        String groupName = intent.getStringExtra(EXTRA_GROUP_NAME);
        int notifId = intent.getIntExtra(EXTRA_NOTIF_ID, 0);

        Log.d(TAG, "onReceive action=" + action + ", groupId=" + groupId);

        if (ACTION_REPLY.equals(action)) {
            Bundle remoteInput = RemoteInput.getResultsFromIntent(intent);
            if (remoteInput != null && groupId != null) {
                CharSequence replySequence = remoteInput.getCharSequence(KEY_TEXT_REPLY);
                if (replySequence != null) {
                    String replyText = replySequence.toString().trim();
                    if (!replyText.isEmpty()) {
                        handleDirectReply(context, groupId, groupName, replyText);
                    }
                }
            }
        } else if (ACTION_MARK_AS_READ.equals(action)) {
            if (notifId != 0) {
                NotificationManagerCompat.from(context).cancel(notifId);
            }
            if (groupId != null) {
                CassielGroupNotificationManager.clearGroupNotification(context, groupId);
            }
        } else if (ACTION_MUTE.equals(action)) {
            if (groupId != null) {
                // Default mute for 8 hours (28800000 ms)
                long eightHours = 8 * 60 * 60 * 1000L;
                CassielGroupNotificationManager.setGroupMuted(context, groupId, eightHours);
                if (notifId != 0) {
                    NotificationManagerCompat.from(context).cancel(notifId);
                }
                String msg = (groupName != null ? groupName : "Grup") + " dibisukan selama 8 jam";
                Toast.makeText(context, msg, Toast.LENGTH_SHORT).show();
            }
        }
    }

    private void handleDirectReply(Context context, String groupId, String groupName, String replyText) {
        // 1. Immediately update local notification history so user sees their sent message in the tray
        CassielGroupNotificationManager.addDirectReplyToHistory(context, groupId, replyText);

        // 2. Queue reply message into SharedPreferences so when WebView resumes / in background it syncs to Firestore
        try {
            android.content.SharedPreferences prefs = context.getSharedPreferences("CassielGroupChatNotifs", Context.MODE_PRIVATE);
            String queueRaw = prefs.getString("pending_outgoing_replies", "[]");
            JSONArray queue = new JSONArray(queueRaw);

            JSONObject item = new JSONObject();
            item.put("groupId", groupId);
            item.put("text", replyText);
            item.put("timestamp", System.currentTimeMillis());
            queue.put(item);

            prefs.edit().putString("pending_outgoing_replies", queue.toString()).apply();
            Log.d(TAG, "Queued direct reply for groupId=" + groupId);
        } catch (Exception e) {
            Log.e(TAG, "Failed to queue direct reply", e);
        }

        // 3. Broadcast intent to Capacitor WebView if active
        Intent eventIntent = new Intent("com.redilah.financetracker.ACTION_NEW_DIRECT_REPLY");
        eventIntent.putExtra("groupId", groupId);
        eventIntent.putExtra("text", replyText);
        context.sendBroadcast(eventIntent);
    }
}

package com.redilah.financetracker.groupnotification;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Canvas;
import android.graphics.Paint;
import android.graphics.PorterDuff;
import android.graphics.PorterDuffXfermode;
import android.graphics.Rect;
import android.graphics.drawable.Drawable;
import android.media.AudioAttributes;
import android.net.Uri;
import android.os.Build;
import android.util.Base64;
import android.util.Log;

import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;
import androidx.core.app.Person;
import androidx.core.app.RemoteInput;
import androidx.core.content.ContextCompat;
import androidx.core.graphics.drawable.IconCompat;

import com.redilah.financetracker.MainActivity;
import com.redilah.financetracker.R;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.HashMap;
import java.util.Map;

public class CassielGroupNotificationManager {

    private static final String TAG = "CassielGroupNotif";
    public static final String CHANNEL_ID = "cassiel_group_chat_channel";
    private static final String PREFS_NAME = "CassielGroupChatNotifs";
    private static final String KEY_MUTED_PREFIX = "muted_group_";
    private static final String KEY_HISTORY_PREFIX = "history_group_";

    // In-memory cache for avatars to avoid repeated decoding/fetching
    private static final Map<String, Bitmap> sAvatarCache = new HashMap<>();

    public static void createNotificationChannel(Context context) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationManager manager = context.getSystemService(NotificationManager.class);
            if (manager == null) return;

            NotificationChannel existing = manager.getNotificationChannel(CHANNEL_ID);
            if (existing == null) {
                NotificationChannel channel = new NotificationChannel(
                        CHANNEL_ID,
                        "Chat & Kas Grup",
                        NotificationManager.IMPORTANCE_HIGH
                );
                channel.setDescription("Notifikasi percakapan dan keuangan grup Cassiel");
                channel.enableVibration(true);
                channel.setShowBadge(true);
                channel.setLockscreenVisibility(android.app.Notification.VISIBILITY_PRIVATE);

                // Sound
                Uri soundUri = Uri.parse("android.resource://" + context.getPackageName() + "/raw/notification");
                AudioAttributes audioAttributes = new AudioAttributes.Builder()
                        .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                        .setUsage(AudioAttributes.USAGE_NOTIFICATION_COMMUNICATION_INSTANT)
                        .build();
                channel.setSound(soundUri, audioAttributes);

                manager.createNotificationChannel(channel);
            }
        }
    }

    public static boolean isGroupMuted(Context context, String groupId) {
        if (groupId == null) return false;
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        long muteUntil = prefs.getLong(KEY_MUTED_PREFIX + groupId, 0L);
        if (muteUntil == -1L) return true; // Permanently muted
        if (muteUntil > 0L) {
            if (System.currentTimeMillis() < muteUntil) {
                return true;
            } else {
                prefs.edit().remove(KEY_MUTED_PREFIX + groupId).apply();
            }
        }
        return false;
    }

    public static void setGroupMuted(Context context, String groupId, long durationMs) {
        if (groupId == null) return;
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        long muteUntil = (durationMs <= 0) ? -1L : (System.currentTimeMillis() + durationMs);
        prefs.edit().putLong(KEY_MUTED_PREFIX + groupId, muteUntil).apply();
    }

    public static void unmuteGroup(Context context, String groupId) {
        if (groupId == null) return;
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        prefs.edit().remove(KEY_MUTED_PREFIX + groupId).apply();
    }

    public static void clearGroupNotification(Context context, String groupId) {
        if (groupId == null) return;
        int notifId = getNotificationId(groupId);
        NotificationManagerCompat.from(context).cancel(notifId);

        // Clear local message history for this notification
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        prefs.edit().remove(KEY_HISTORY_PREFIX + groupId).apply();
    }

    public static int getNotificationId(String groupId) {
        if (groupId == null || groupId.isEmpty()) return 88888;
        return Math.abs(groupId.hashCode());
    }

    public static void showGroupChatMessage(
            Context context,
            String groupId,
            String groupName,
            String groupAvatar,
            String senderId,
            String senderName,
            String senderAvatar,
            String messageText,
            long timestamp
    ) {
        if (context == null || groupId == null) return;

        // Check if group is muted
        if (isGroupMuted(context, groupId)) {
            Log.d(TAG, "Group " + groupId + " is muted. Skipping alert.");
            return;
        }

        createNotificationChannel(context);

        if (timestamp <= 0) {
            timestamp = System.currentTimeMillis();
        }

        // Store new message in persistent notification history for this group
        saveMessageToHistory(context, groupId, senderId, senderName, senderAvatar, messageText, timestamp);

        // Rebuild aggregated notification using NotificationCompat.MessagingStyle
        renderNotification(context, groupId, groupName, groupAvatar);
    }

    private static void saveMessageToHistory(
            Context context,
            String groupId,
            String senderId,
            String senderName,
            String senderAvatar,
            String messageText,
            long timestamp
    ) {
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        String key = KEY_HISTORY_PREFIX + groupId;
        try {
            String raw = prefs.getString(key, "[]");
            JSONArray array = new JSONArray(raw);

            JSONObject item = new JSONObject();
            item.put("senderId", senderId != null ? senderId : "");
            item.put("senderName", senderName != null ? senderName : "Anggota");
            item.put("senderAvatar", senderAvatar != null ? senderAvatar : "");
            item.put("text", messageText != null ? messageText : "");
            item.put("time", timestamp);

            array.put(item);

            // Limit history to last 20 messages per group
            while (array.length() > 20) {
                array.remove(0);
            }

            prefs.edit().putString(key, array.toString()).apply();
        } catch (Exception e) {
            Log.e(TAG, "Failed to save message history", e);
        }
    }

    public static void addDirectReplyToHistory(Context context, String groupId, String replyText) {
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        String myName = "Anda";
        try {
            SharedPreferences userPrefs = context.getSharedPreferences("CapacitorStorage", Context.MODE_PRIVATE);
            String savedName = userPrefs.getString("user_profile_name", "");
            if (savedName != null && !savedName.trim().isEmpty() && !savedName.equals("Pengguna Cassiel")) {
                myName = savedName.trim();
            }
        } catch (Exception ignored) {}

        saveMessageToHistory(context, groupId, "current_user", myName, null, replyText, System.currentTimeMillis());
        
        // Re-render notification to display reply inline
        SharedPreferences groupPrefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        String lastGroupName = groupPrefs.getString("name_" + groupId, "Grup");
        String lastGroupAvatar = groupPrefs.getString("avatar_" + groupId, null);
        renderNotification(context, groupId, lastGroupName, lastGroupAvatar);
    }

    public static void renderNotification(Context context, String groupId, String groupName, String groupAvatar) {
        try {
            SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
            if (groupName != null) prefs.edit().putString("name_" + groupId, groupName).apply();
            if (groupAvatar != null) prefs.edit().putString("avatar_" + groupId, groupAvatar).apply();

            String effectiveGroupName = groupName != null ? groupName : prefs.getString("name_" + groupId, "Grup");
            String effectiveGroupAvatar = groupAvatar != null ? groupAvatar : prefs.getString("avatar_" + groupId, null);

            String raw = prefs.getString(KEY_HISTORY_PREFIX + groupId, "[]");
            JSONArray array = new JSONArray(raw);
            if (array.length() == 0) return;

            // Me person for direct replies
            Person userPerson = new Person.Builder()
                    .setName("Anda")
                    .setKey("current_user")
                    .build();

            // WhatsApp Style MessagingStyle for group
            NotificationCompat.MessagingStyle messagingStyle = new NotificationCompat.MessagingStyle(userPerson)
                    .setConversationTitle(effectiveGroupName)
                    .setGroupConversation(true);

            long latestTime = System.currentTimeMillis();

            for (int i = 0; i < array.length(); i++) {
                JSONObject obj = array.getJSONObject(i);
                String sId = obj.optString("senderId");
                String sName = obj.optString("senderName", "Anggota");
                String sAvatar = obj.optString("senderAvatar", null);
                String text = obj.optString("text", "");
                long time = obj.optLong("time", System.currentTimeMillis());
                latestTime = time;

                Person.Builder senderPersonBuilder = new Person.Builder()
                        .setName(sName)
                        .setKey(sId);

                Bitmap senderBitmap = resolveAvatarBitmap(context, sAvatar, false);
                if (senderBitmap != null) {
                    senderPersonBuilder.setIcon(IconCompat.createWithBitmap(senderBitmap));
                }

                messagingStyle.addMessage(text, time, senderPersonBuilder.build());
            }

            int notifId = getNotificationId(groupId);

            // Intent to open chat in app
            Intent contentIntent = new Intent(context, MainActivity.class);
            contentIntent.setAction("ACTION_OPEN_CHAT_GROUP");
            contentIntent.putExtra("groupId", groupId);
            contentIntent.putExtra("groupName", effectiveGroupName);
            contentIntent.setFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP);

            PendingIntent contentPendingIntent = PendingIntent.getActivity(
                    context,
                    notifId,
                    contentIntent,
                    PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M ? PendingIntent.FLAG_IMMUTABLE : 0)
            );

            // Action 1: Reply (RemoteInput with send arrow)
            RemoteInput remoteInput = new RemoteInput.Builder(CassielChatActionReceiver.KEY_TEXT_REPLY)
                    .setLabel("Balas...")
                    .build();

            Intent replyIntent = new Intent(context, CassielChatActionReceiver.class);
            replyIntent.setAction(CassielChatActionReceiver.ACTION_REPLY);
            replyIntent.putExtra(CassielChatActionReceiver.EXTRA_GROUP_ID, groupId);
            replyIntent.putExtra(CassielChatActionReceiver.EXTRA_GROUP_NAME, effectiveGroupName);
            replyIntent.putExtra(CassielChatActionReceiver.EXTRA_NOTIF_ID, notifId);

            PendingIntent replyPendingIntent = PendingIntent.getBroadcast(
                    context,
                    notifId + 1,
                    replyIntent,
                    PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S ? PendingIntent.FLAG_MUTABLE : 0)
            );

            NotificationCompat.Action replyAction = new NotificationCompat.Action.Builder(
                    android.R.drawable.ic_menu_send,
                    "Reply",
                    replyPendingIntent
            ).addRemoteInput(remoteInput)
             .setAllowGeneratedReplies(true)
             .build();

            // Action 2: Mark as read
            Intent readIntent = new Intent(context, CassielChatActionReceiver.class);
            readIntent.setAction(CassielChatActionReceiver.ACTION_MARK_AS_READ);
            readIntent.putExtra(CassielChatActionReceiver.EXTRA_GROUP_ID, groupId);
            readIntent.putExtra(CassielChatActionReceiver.EXTRA_NOTIF_ID, notifId);

            PendingIntent readPendingIntent = PendingIntent.getBroadcast(
                    context,
                    notifId + 2,
                    readIntent,
                    PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M ? PendingIntent.FLAG_IMMUTABLE : 0)
            );

            NotificationCompat.Action readAction = new NotificationCompat.Action.Builder(
                    0,
                    "Mark as read",
                    readPendingIntent
            ).build();

            // Action 3: Mute
            Intent muteIntent = new Intent(context, CassielChatActionReceiver.class);
            muteIntent.setAction(CassielChatActionReceiver.ACTION_MUTE);
            muteIntent.putExtra(CassielChatActionReceiver.EXTRA_GROUP_ID, groupId);
            muteIntent.putExtra(CassielChatActionReceiver.EXTRA_GROUP_NAME, effectiveGroupName);
            muteIntent.putExtra(CassielChatActionReceiver.EXTRA_NOTIF_ID, notifId);

            PendingIntent mutePendingIntent = PendingIntent.getBroadcast(
                    context,
                    notifId + 3,
                    muteIntent,
                    PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M ? PendingIntent.FLAG_IMMUTABLE : 0)
            );

            NotificationCompat.Action muteAction = new NotificationCompat.Action.Builder(
                    0,
                    "Mute",
                    mutePendingIntent
            ).build();

            // Large Icon (Group Avatar in top right/circle)
            Bitmap groupBitmap = resolveAvatarBitmap(context, effectiveGroupAvatar, true);

            NotificationCompat.Builder builder = new NotificationCompat.Builder(context, CHANNEL_ID)
                    .setSmallIcon(R.drawable.ic_stat_icon)
                    .setStyle(messagingStyle)
                    .setContentIntent(contentPendingIntent)
                    .setAutoCancel(true)
                    .setWhen(latestTime)
                    .setShowWhen(true)
                    .setPriority(NotificationCompat.PRIORITY_HIGH)
                    .setCategory(NotificationCompat.CATEGORY_MESSAGE)
                    .addAction(replyAction)
                    .addAction(readAction)
                    .addAction(muteAction);

            if (groupBitmap != null) {
                builder.setLargeIcon(groupBitmap);
            }

            NotificationManagerCompat.from(context).notify(notifId, builder.build());

        } catch (Exception e) {
            Log.e(TAG, "Error rendering group chat notification", e);
        }
    }

    public static Bitmap resolveAvatarBitmap(Context context, String avatarSource, boolean isGroup) {
        if (avatarSource != null && !avatarSource.isEmpty()) {
            if (sAvatarCache.containsKey(avatarSource)) {
                return sAvatarCache.get(avatarSource);
            }
            try {
                Bitmap decoded = null;
                if (avatarSource.startsWith("data:image")) {
                    String base64Data = avatarSource.substring(avatarSource.indexOf(",") + 1);
                    byte[] bytes = Base64.decode(base64Data, Base64.DEFAULT);
                    decoded = BitmapFactory.decodeByteArray(bytes, 0, bytes.length);
                } else if (avatarSource.startsWith("http://") || avatarSource.startsWith("https://")) {
                    // Try to load network image or fallback
                    decoded = loadBitmapFromUrl(avatarSource);
                }
                if (decoded != null) {
                    Bitmap circular = getCircularBitmap(decoded);
                    sAvatarCache.put(avatarSource, circular);
                    return circular;
                }
            } catch (Throwable t) {
                Log.w(TAG, "Failed to decode avatar bitmap: " + t.getMessage());
            }
        }

        // Fallback default avatar
        int resId = isGroup ? R.drawable.ic_default_group_avatar : R.drawable.ic_default_user_avatar;
        try {
            Drawable drawable = ContextCompat.getDrawable(context, resId);
            if (drawable != null) {
                Bitmap bitmap = Bitmap.createBitmap(128, 128, Bitmap.Config.ARGB_8888);
                Canvas canvas = new Canvas(bitmap);
                drawable.setBounds(0, 0, canvas.getWidth(), canvas.getHeight());
                drawable.draw(canvas);
                return getCircularBitmap(bitmap);
            }
        } catch (Throwable ignored) {}

        return null;
    }

    private static Bitmap loadBitmapFromUrl(String urlStr) {
        try {
            URL url = new URL(urlStr);
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setDoInput(true);
            conn.setConnectTimeout(3000);
            conn.setReadTimeout(3000);
            conn.connect();
            InputStream input = conn.getInputStream();
            return BitmapFactory.decodeStream(input);
        } catch (Exception e) {
            return null;
        }
    }

    public static Bitmap getCircularBitmap(Bitmap bitmap) {
        int width = bitmap.getWidth();
        int height = bitmap.getHeight();
        int size = Math.min(width, height);

        Bitmap output = Bitmap.createBitmap(size, size, Bitmap.Config.ARGB_8888);
        Canvas canvas = new Canvas(output);

        final Paint paint = new Paint();
        final Rect rect = new Rect((width - size) / 2, (height - size) / 2, (width + size) / 2, (height + size) / 2);
        final Rect destRect = new Rect(0, 0, size, size);

        paint.setAntiAlias(true);
        canvas.drawARGB(0, 0, 0, 0);
        canvas.drawCircle(size / 2f, size / 2f, size / 2f, paint);
        paint.setXfermode(new PorterDuffXfermode(PorterDuff.Mode.SRC_IN));
        canvas.drawBitmap(bitmap, rect, destRect, paint);

        return output;
    }
}

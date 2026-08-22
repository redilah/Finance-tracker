package com.redilah.financetracker;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;
import android.os.Bundle;
import android.service.notification.NotificationListenerService;
import android.service.notification.StatusBarNotification;
import android.util.Log;

import androidx.core.app.NotificationCompat;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class AutoExpenseListenerService extends NotificationListenerService {

    private static final String TAG = "AutoExpenseListener";
    private static final String PREF_NAME = "NotificationTrackerPrefs";
    private static final String PENDING_KEY = "pending_notifications";
    private static final String ENABLED_KEY = "auto_tracker_enabled";
    private static final String CHANNEL_ID = "cassiel_auto_tracker_channel";

    @Override
    public void onNotificationPosted(StatusBarNotification sbn) {
        if (sbn == null) return;

        SharedPreferences prefs = getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE);
        boolean isEnabled = prefs.getBoolean(ENABLED_KEY, false);
        if (!isEnabled) {
            return; // Only process if toggle is explicitly turned ON
        }
        
        String packageName = sbn.getPackageName();
        if (packageName == null) return;

        // Ignore our own notifications to avoid recursion loops
        if (packageName.equalsIgnoreCase(getPackageName())) {
            return;
        }

        if (!isFinancialApp(packageName.toLowerCase())) {
            return; // Ignore non-financial packages
        }

        Notification notification = sbn.getNotification();
        if (notification == null) return;

        Bundle extras = notification.extras;
        String title = "";
        String text = "";

        if (extras != null) {
            CharSequence titleCs = extras.getCharSequence(Notification.EXTRA_TITLE);
            if (titleCs == null) titleCs = extras.getCharSequence(Notification.EXTRA_TITLE_BIG);
            if (titleCs != null) title = titleCs.toString().trim();

            CharSequence textCs = extras.getCharSequence(Notification.EXTRA_TEXT);
            if (textCs == null) textCs = extras.getCharSequence(Notification.EXTRA_BIG_TEXT);
            if (textCs == null) textCs = extras.getCharSequence(Notification.EXTRA_SUB_TEXT);
            if (textCs == null) textCs = extras.getCharSequence(Notification.EXTRA_SUMMARY_TEXT);
            if (textCs != null) text = textCs.toString().trim();
        }

        // Fallback to tickerText if text is still empty
        if (text.isEmpty() && notification.tickerText != null) {
            text = notification.tickerText.toString().trim();
        }

        if (text.isEmpty() && title.isEmpty()) return;

        // Filter out promo, iklan, atau notifikasi non-transaksi
        if (isPromoOrNonTransaction(title, text)) {
            Log.d(TAG, "Ignored promo/marketing/non-financial notification: " + title + " | " + text);
            return;
        }

        Log.d(TAG, "Captured Financial Notification from: " + packageName + " | Title: " + title + " | Text: " + text);
        
        saveNotificationToPrefs(packageName, title, text, sbn.getPostTime());
        showLocalSuccessNotification(packageName, title, text);
    }

    private boolean isPromoOrNonTransaction(String title, String text) {
        String combined = (title + " " + text).toLowerCase();

        // 1. Blacklist kata-kata murni keamanan/OTP/login
        String[] securityKeywords = {
            "kode otp", "kode verifikasi", "rahasia jangan bagikan", "login baru", "device baru", "security alert"
        };
        for (String kw : securityKeywords) {
            if (combined.contains(kw)) return true;
        }

        // 2. Blacklist kata-kata promo & penawaran murni TANPA transaksi riil
        String[] promoKeywords = {
            "diskon hingga", "discount up to", "cashback hingga", "special offer",
            "ajukan pinjaman", "ajukan kartu kredit", "klaim voucher", "klaim reward",
            "dapatkan hadiah", "kesempatan emas", "promo hemat", "yuk pakai"
        };
        for (String kw : promoKeywords) {
            if (combined.contains(kw) && !combined.contains("berhasil") && !combined.contains("sukses") && !combined.contains("debit") && !combined.contains("kredit")) {
                return true;
            }
        }

        // 3. Cek nominal uang Rp / IDR / format ribuan
        Pattern amountPattern = Pattern.compile("(?i)(?:rp|idr|idr\\.|rp\\.)\\s*([0-9]{1,3}(?:[.,][0-9]{3})+|[0-9]+)");
        Matcher m = amountPattern.matcher(combined);
        boolean hasAmount = m.find();

        if (!hasAmount) {
            // Cek jika ada angka ribuan murni (contoh: "sebesar 50.000")
            Pattern numPattern = Pattern.compile("(?i)(?:sebesar|nominal|jumlah|total|bayar|transfer)\\s*([0-9]{1,3}(?:\\.[0-9]{3})+)");
            if (!numPattern.matcher(combined).find()) {
                return true; // Tolak jika sama sekali tidak ada angka nominal
            }
        }

        // 4. Periksa indikator transaksi yang sah (sangat luas & inklusif)
        String[] legitKeywords = {
            "berhasil", "sukses", "selesai", "debit", "kredit", "cr", "db",
            "pembayaran", "pembelian", "transfer", "terima", "terima uang",
            "top up", "topup", "qris", "tarik tunai", "terkirim", "masuk", "keluar",
            "transaksi", "paid", "payment", "received", "sent", "sebesar", "terpotong",
            "berkurang", "bertambah", "saldo", "tagihan", "dana keluar", "dana masuk"
        };
        boolean hasLegit = false;
        for (String kw : legitKeywords) {
            if (combined.contains(kw)) {
                hasLegit = true;
                break;
            }
        }

        return !hasLegit;
    }

    private boolean isFinancialApp(String pkg) {
        String p = pkg.toLowerCase();
        return p.contains("bca") ||
               p.contains("mandiri") ||
               p.contains("livin") ||
               p.contains("bri") ||
               p.contains("brimo") ||
               p.contains("bni") ||
               p.contains("wondr") ||
               p.contains("gojek") ||
               p.contains("gopay") ||
               p.contains("ovo") ||
               p.contains("dana") ||
               p.contains("shopee") ||
               p.contains("seabank") ||
               p.contains("jago") ||
               p.contains("jenius") ||
               p.contains("bsi") ||
               p.contains("bsimobile") ||
               p.contains("cimb") ||
               p.contains("octo") ||
               p.contains("permata") ||
               p.contains("danamon") ||
               p.contains("btpn") ||
               p.contains("bank") ||
               p.contains("fintech") ||
               p.contains("wallet") ||
               p.contains("pay");
    }

    private void saveNotificationToPrefs(String packageName, String title, String text, long postTime) {
        try {
            SharedPreferences prefs = getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE);
            String currentPendingStr = prefs.getString(PENDING_KEY, "[]");
            JSONArray pendingArray = new JSONArray(currentPendingStr);

            JSONObject newNotif = new JSONObject();
            newNotif.put("packageName", packageName);
            newNotif.put("title", title);
            newNotif.put("text", text);
            newNotif.put("time", postTime > 0 ? postTime : System.currentTimeMillis());

            pendingArray.put(newNotif);

            prefs.edit().putString(PENDING_KEY, pendingArray.toString()).apply();
            Log.d(TAG, "Saved notification to pending queue. Total: " + pendingArray.length());
        } catch (Exception e) {
            Log.e(TAG, "Error saving notification", e);
        }
    }

    private void showLocalSuccessNotification(String packageName, String title, String text) {
        try {
            String accountName = "E-Wallet/Bank";
            String pkgLower = packageName.toLowerCase();
            if (pkgLower.contains("gojek") || pkgLower.contains("gopay")) accountName = "GoPay";
            else if (pkgLower.contains("dana")) accountName = "DANA";
            else if (pkgLower.contains("ovo")) accountName = "OVO";
            else if (pkgLower.contains("shopee")) accountName = "ShopeePay";
            else if (pkgLower.contains("seabank")) accountName = "SeaBank";
            else if (pkgLower.contains("bca")) accountName = "BCA";
            else if (pkgLower.contains("mandiri") || pkgLower.contains("livin")) accountName = "Mandiri";
            else if (pkgLower.contains("brimo") || pkgLower.contains("bri")) accountName = "BRImo";
            else if (pkgLower.contains("wondr") || pkgLower.contains("bni")) accountName = "BNI";
            else if (pkgLower.contains("jago")) accountName = "Bank Jago";
            else if (pkgLower.contains("jenius")) accountName = "Jenius";
            else if (pkgLower.contains("bsi")) accountName = "BSI";
            else if (pkgLower.contains("cimb") || pkgLower.contains("octo")) accountName = "CIMB Niaga";
            else if (pkgLower.contains("permata")) accountName = "Permata";
            else if (pkgLower.contains("danamon")) accountName = "Danamon";

            String combined = (title + " " + text).trim();

            // 1. Extract Amount
            String amountFormatted = "";
            Pattern amountPattern = Pattern.compile("(?i)(?:rp|idr|idr\\.|rp\\.)\\s*([0-9]{1,3}(?:[.,][0-9]{3})+|[0-9]+)");
            Matcher amountMatcher = amountPattern.matcher(combined);
            if (amountMatcher.find()) {
                amountFormatted = "Rp " + amountMatcher.group(1);
            } else {
                Pattern numPattern = Pattern.compile("(?i)(?:sebesar|nominal|jumlah|total|bayar|transfer)\\s*([0-9]{1,3}(?:\\.[0-9]{3})+)");
                Matcher numMatcher = numPattern.matcher(combined);
                if (numMatcher.find()) {
                    amountFormatted = "Rp " + numMatcher.group(1);
                }
            }

            // 2. Extract Merchant / Item / Target Name
            String itemName = "";
            Pattern merchantPattern = Pattern.compile("(?i)(?:transfer ke|pembayaran ke|bayar di|merchant|qris bayar|pembayaran qris|ke|di|tujuan)\\s+([a-zA-Z0-9\\s*\\-,.]+?)(?:\\s*(?:sebesar|rp|idr|berhasil|sukses|pada|\\.|,|$))");
            Matcher merchantMatcher = merchantPattern.matcher(combined);
            if (merchantMatcher.find()) {
                itemName = merchantMatcher.group(1).trim();
            }

            // If income, look for sender
            if (itemName.isEmpty()) {
                Pattern senderPattern = Pattern.compile("(?i)(?:dari|pengirim|terima dari)\\s+([a-zA-Z0-9\\s*]+?)(?:\\s*(?:sebesar|rp|idr|berhasil|sukses|pada|\\.|,|$))");
                Matcher senderMatcher = senderPattern.matcher(combined);
                if (senderMatcher.find()) {
                    itemName = "dari " + senderMatcher.group(1).trim();
                }
            }

            // Fallback cerdas jika merchant tidak tertulis di notif
            if (itemName.isEmpty() || itemName.equalsIgnoreCase("Transaksi") || itemName.equalsIgnoreCase(accountName)) {
                if (combined.toLowerCase().contains("qris")) {
                    itemName = "QRIS " + accountName;
                } else if (combined.toLowerCase().contains("transfer")) {
                    itemName = "Transfer " + accountName;
                } else {
                    itemName = "Transaksi " + accountName;
                }
            }

            // Clean up item name length
            if (itemName.length() > 30) {
                itemName = itemName.substring(0, 30) + "...";
            }

            String notifTitle = "💳 Transaksi " + accountName + " Tercatat";
            String notifBody;
            if (!amountFormatted.isEmpty()) {
                notifBody = itemName + " (" + amountFormatted + ") berhasil disimpan otomatis ke Cassiel.";
            } else {
                notifBody = itemName + " berhasil disimpan otomatis ke Cassiel.";
            }

            NotificationManager manager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
            if (manager == null) return;

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                NotificationChannel channel = new NotificationChannel(
                        CHANNEL_ID,
                        "Auto Expense Tracker",
                        NotificationManager.IMPORTANCE_HIGH
                );
                channel.setDescription("Notifikasi saat transaksi otomatis berhasil dicatat");
                channel.enableVibration(true);
                manager.createNotificationChannel(channel);
            }

            Intent intent = new Intent(this, MainActivity.class);
            intent.addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            PendingIntent pendingIntent = PendingIntent.getActivity(
                    this,
                    (int) System.currentTimeMillis(),
                    intent,
                    PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M ? PendingIntent.FLAG_IMMUTABLE : 0)
            );

            NotificationCompat.Builder builder = new NotificationCompat.Builder(this, CHANNEL_ID)
                    .setSmallIcon(R.drawable.ic_stat_icon)
                    .setContentTitle(notifTitle)
                    .setContentText(notifBody)
                    .setStyle(new NotificationCompat.BigTextStyle().bigText(notifBody))
                    .setAutoCancel(true)
                    .setContentIntent(pendingIntent)
                    .setPriority(NotificationCompat.PRIORITY_HIGH);

            try {
                android.graphics.Bitmap largeIcon = android.graphics.BitmapFactory.decodeResource(getResources(), R.drawable.ic_large_icon);
                if (largeIcon != null) {
                    builder.setLargeIcon(largeIcon);
                }
            } catch (Exception ignored) {}

            manager.notify((int) System.currentTimeMillis(), builder.build());
            Log.d(TAG, "Success notification posted: " + notifTitle + " - " + notifBody);
        } catch (Exception e) {
            Log.e(TAG, "Failed to show local success notification", e);
        }
    }
}

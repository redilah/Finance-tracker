package com.redilah.financetracker.notificationtracker;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageManager;
import android.graphics.BitmapFactory;
import android.os.Build;
import android.os.Bundle;
import android.service.notification.NotificationListenerService;
import android.service.notification.StatusBarNotification;
import android.util.Log;

import androidx.core.app.NotificationCompat;

import com.redilah.financetracker.MainActivity;
import com.redilah.financetracker.R;

import org.json.JSONArray;
import org.json.JSONObject;

import java.text.DecimalFormat;
import java.text.DecimalFormatSymbols;
import java.util.Arrays;
import java.util.HashSet;
import java.util.Locale;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class CassielNotificationListenerService extends NotificationListenerService {

    private static final String TAG = "CassielNotifTracker";
    private static final String PREFS_NAME = "CassielNotifTrackerPrefs";
    private static final String KEY_ENABLED = "cassiel_notif_tracker_enabled";
    private static final String KEY_QUEUE = "cassiel_notif_tracker_queue";
    private static final int MAX_QUEUE_SIZE = 100;
    private static final String CHANNEL_ID = "financial_notifications";

    private static final Set<String> WHITELIST = new HashSet<>(Arrays.asList(
            "id.co.bri.brimo", "com.bca", "com.bca.mybca.mobile", "com.bca.mybca", "com.bca.klikbca",
            "com.bankmandiri.mandirionline", "com.bankmandiri.livin",
            "id.co.bni.net.banking", "id.co.bni.wondr",
            "com.bsm.activity2", "id.co.bankbsi.mobile", "id.co.bankbsi.superapp",
            "id.dana", "com.gojek.gopay", "com.gojek.app", "ovo.id",
            "com.shopee.id", "com.shopeepay.id", "com.telkom.mwallet",
            "com.seabank.id", "com.jfriau.bankjago", "com.bankjago.app", "com.btpn.dc",
            "com.cimbniaga.mobile.android", "net.myinfosys.PermataMobileX",
            "com.maybankindo.maybank2u", "id.co.bankbpd.diy.mobile", "id.co.btn.mobile",
            "id.co.btn.superapp", "bcadigital.blubybcadigital", "com.paypal.android.p2pmobile"
    ));

    @Override
    public void onNotificationPosted(StatusBarNotification sbn) {
        try {
            if (sbn == null) return;

            SharedPreferences prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
            // If user granted OS permission to Cassiel, default to true unless explicitly disabled in app settings
            boolean isExplicitlyDisabled = prefs.contains(KEY_ENABLED) && !prefs.getBoolean(KEY_ENABLED, true);
            if (isExplicitlyDisabled) {
                return;
            }

            String packageName = sbn.getPackageName();
            if (packageName == null || !WHITELIST.contains(packageName)) {
                return;
            }

            Notification notification = sbn.getNotification();
            if (notification == null) return;

            Bundle extras = notification.extras;
            if (extras == null) return;

            CharSequence titleCs = extras.getCharSequence(Notification.EXTRA_TITLE);
            String title = titleCs != null ? titleCs.toString() : "";
            CharSequence textCs = extras.getCharSequence(Notification.EXTRA_TEXT);
            String text = textCs != null ? textCs.toString() : "";
            CharSequence bigTextCs = extras.getCharSequence(Notification.EXTRA_BIG_TEXT);
            String bigText = bigTextCs != null ? bigTextCs.toString() : "";

            String appLabel = packageName;
            try {
                PackageManager pm = getPackageManager();
                ApplicationInfo ai = pm.getApplicationInfo(packageName, 0);
                CharSequence label = pm.getApplicationLabel(ai);
                if (label != null) {
                    appLabel = label.toString();
                }
            } catch (Throwable ignored) {
                // Safe fallback to package name
            }

            JSONObject notifObj = new JSONObject();
            notifObj.put("packageName", packageName);
            notifObj.put("appLabel", appLabel);
            notifObj.put("title", title);
            notifObj.put("text", text);
            notifObj.put("bigText", bigText);
            notifObj.put("postTime", sbn.getPostTime());
            notifObj.put("receivedAt", System.currentTimeMillis());

            // 1. Save to Queue with rock-solid error isolation
            synchronized (CassielNotificationListenerService.class) {
                try {
                    String queueStr = prefs.getString(KEY_QUEUE, "[]");
                    JSONArray queue;
                    try {
                        queue = new JSONArray(queueStr);
                    } catch (Exception e) {
                        queue = new JSONArray();
                    }

                    queue.put(notifObj);

                    // Enforce max size
                    if (queue.length() > MAX_QUEUE_SIZE) {
                        JSONArray newQueue = new JSONArray();
                        int start = queue.length() - MAX_QUEUE_SIZE;
                        for (int i = start; i < queue.length(); i++) {
                            newQueue.put(queue.getJSONObject(i));
                        }
                        queue = newQueue;
                    }

                    prefs.edit().putString(KEY_QUEUE, queue.toString()).apply();
                } catch (Throwable queueError) {
                    Log.e(TAG, "Failed to append to queue", queueError);
                }
            }

            // 2. Post instant confirmation notification to Android status bar
            try {
                showInstantConfirmationNotification(packageName, appLabel, title, text, bigText);
            } catch (Throwable notifError) {
                Log.e(TAG, "Failed to show instant confirmation notification", notifError);
            }

        } catch (Throwable t) {
            Log.e(TAG, "Error in onNotificationPosted", t);
        }
    }

    private void showInstantConfirmationNotification(String packageName, String appLabel, String title, String text, String bigText) {
        try {
            String fullText = (title + " " + text + " " + bigText).toLowerCase();

            // Rejection of non-transactional items (OTP, Pure Login/Security)
            if (fullText.contains("otp") || fullText.contains("kode verifikasi") || fullText.contains("login baru")
                    || fullText.contains("password baru") || fullText.contains("verifikasi perangkat")) {
                return;
            }

            // Rejection of pure promo/marketing without transaction execution
            boolean hasTransactionSignal = fullText.contains("berhasil") || fullText.contains("sukses")
                    || fullText.contains("debit") || fullText.contains("debet") || fullText.contains("kredit")
                    || fullText.contains("credit") || fullText.contains("pembayaran") || fullText.contains("dibayar")
                    || fullText.contains("transfer") || fullText.contains("belanja") || fullText.contains("terima")
                    || fullText.contains("rp") || fullText.contains("idr");

            if (!hasTransactionSignal) {
                if (fullText.contains("promo") || fullText.contains("diskon") || fullText.contains("cashback hingga")
                        || fullText.contains("voucher") || fullText.contains("kupon")) {
                    return;
                }
            }

            // Amount extraction (balance-aware)
            String formattedAmount = extractFormattedAmount(fullText);
            if (formattedAmount == null) {
                // If not a numeric transaction, skip showing notification
                return;
            }

            // Provider name resolution
            String providerName = resolveProviderName(packageName, appLabel);

            // Merchant / Item Name extraction
            String merchantOrCategory = extractMerchantOrCategory(fullText, title, text);

            // Construct exact title and body requested by user
            String notifTitle = "Transaksi " + providerName + " Berhasil Dicatat";
            String notifBody = merchantOrCategory + " • " + formattedAmount;

            // Ensure notification channel exists on Android 8.0+ (Oreo)
            NotificationManager notificationManager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                NotificationChannel channel = new NotificationChannel(
                        CHANNEL_ID,
                        "Notifikasi Finansial",
                        NotificationManager.IMPORTANCE_HIGH
                );
                channel.setDescription("Pengingat dan notifikasi transaksi otomatis");
                channel.enableVibration(true);
                if (notificationManager != null) {
                    notificationManager.createNotificationChannel(channel);
                }
            }

            // PendingIntent to launch Cassiel on notification tap
            Intent launchIntent = new Intent(this, MainActivity.class);
            launchIntent.setFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            PendingIntent pendingIntent = PendingIntent.getActivity(
                    this,
                    (int) (System.currentTimeMillis() % 100000),
                    launchIntent,
                    PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
            );

            NotificationCompat.Builder builder = new NotificationCompat.Builder(this, CHANNEL_ID)
                    .setSmallIcon(R.drawable.ic_stat_icon)
                    .setLargeIcon(BitmapFactory.decodeResource(getResources(), R.drawable.ic_large_icon))
                    .setContentTitle(notifTitle)
                    .setContentText(notifBody)
                    .setStyle(new NotificationCompat.BigTextStyle().bigText(notifBody))
                    .setPriority(NotificationCompat.PRIORITY_HIGH)
                    .setAutoCancel(true)
                    .setContentIntent(pendingIntent);

            if (notificationManager != null) {
                int notifId = (int) (System.currentTimeMillis() % Integer.MAX_VALUE);
                notificationManager.notify(notifId, builder.build());
            }

        } catch (Throwable e) {
            Log.e(TAG, "Failed to post instant confirmation notification", e);
        }
    }

    private String resolveProviderName(String packageName, String fallbackLabel) {
        if (packageName == null) return fallbackLabel != null ? fallbackLabel : "Bank";

        if (packageName.equals("id.co.bri.brimo")) return "BRImo";
        if (packageName.contains("bca")) return "BCA";
        if (packageName.contains("mandiri") || packageName.contains("livin")) return "Livin' Mandiri";
        if (packageName.contains("bni") || packageName.contains("wondr")) return "BNI";
        if (packageName.contains("bsi") || packageName.contains("bsm")) return "BSI Mobile";
        if (packageName.contains("dana")) return "DANA";
        if (packageName.contains("gopay") || packageName.contains("gojek")) return "GoPay";
        if (packageName.contains("ovo")) return "OVO";
        if (packageName.contains("shopee")) return "ShopeePay";
        if (packageName.contains("telkom") || packageName.contains("linkaja")) return "LinkAja";
        if (packageName.contains("seabank")) return "SeaBank";
        if (packageName.contains("bankjago") || packageName.contains("jfriau")) return "Bank Jago";
        if (packageName.contains("btpn") || packageName.contains("jenius")) return "Jenius";
        if (packageName.contains("cimb")) return "OCTO Mobile";
        if (packageName.contains("permata")) return "Permata";
        if (packageName.contains("maybank")) return "Maybank";
        if (packageName.contains("bankbpd") || packageName.contains("bpddiy")) return "BPD DIY";
        if (packageName.contains("btn")) return "BTN Mobile";
        if (packageName.contains("blu")) return "blu";
        if (packageName.contains("paypal")) return "PayPal";

        return fallbackLabel != null && !fallbackLabel.isEmpty() ? fallbackLabel : "Bank";
    }

    private String extractFormattedAmount(String fullText) {
        try {
            // Pattern for Rp / IDR amounts like Rp 25.000, IDR 150,000, Rp25000, Rp. 50.000
            Pattern pattern = Pattern.compile("(?:rp\\.?|idr)\\s*([0-9]+(?:[\\.,][0-9]+)*)", Pattern.CASE_INSENSITIVE);
            Matcher matcher = pattern.matcher(fullText);

            long candidateAmount = -1;

            while (matcher.find()) {
                int matchIndex = matcher.start(); // Standard Java method (anti-NoSuchMethodError)
                String rawBefore = fullText.substring(Math.max(0, matchIndex - 40), matchIndex).toLowerCase();

                // If preceded by saldo/sisa saldo/balance keywords, skip (unless accompanied by bertambah)
                boolean isBalance = (rawBefore.contains("saldo") || rawBefore.contains("sisa") || rawBefore.contains("balance") || rawBefore.contains("limit"))
                        && !rawBefore.contains("bertambah") && !rawBefore.contains("ditambahkan");

                String numStr = matcher.group(1).trim();
                // Strip trailing 1-2 decimal places (cents/sen, e.g. .00 or ,00 or .0)
                String cleanedNum = numStr.replaceAll("[,.]\\d{1,2}$", "");
                String rawNum = cleanedNum.replaceAll("[^0-9]", "");
                if (!rawNum.isEmpty()) {
                    long amount = Long.parseLong(rawNum);
                    if (amount > 0) {
                        if (!isBalance) {
                            candidateAmount = amount;
                            break; // Found preferred transaction amount!
                        } else if (candidateAmount == -1) {
                            candidateAmount = amount; // Temporary fallback
                        }
                    }
                }
            }

            // Fallback for standalone large numbers if no Rp/IDR prefix found
            if (candidateAmount <= 0) {
                Pattern rawNumPattern = Pattern.compile("\\b([0-9]{1,3}(?:[\\.,][0-9]{3})+(?:[\\.,][0-9]{1,2})?|[0-9]{4,}(?:[\\.,][0-9]{1,2})?)\\b");
                Matcher rawMatcher = rawNumPattern.matcher(fullText);
                while (rawMatcher.find()) {
                    int matchIndex = rawMatcher.start();
                    String rawBefore = fullText.substring(Math.max(0, matchIndex - 40), matchIndex).toLowerCase();
                    boolean isBalance = rawBefore.contains("saldo") || rawBefore.contains("sisa") || rawBefore.contains("balance");
                    if (!isBalance) {
                        String numStr = rawMatcher.group(1).trim();
                        String cleanedNum = numStr.replaceAll("[,.]\\d{1,2}$", "");
                        String digits = cleanedNum.replaceAll("[^0-9]", "");
                        if (!digits.isEmpty()) {
                            long amt = Long.parseLong(digits);
                            if (amt >= 1000) {
                                candidateAmount = amt;
                                break;
                            }
                        }
                    }
                }
            }

            if (candidateAmount > 0) {
                DecimalFormatSymbols symbols = new DecimalFormatSymbols(new Locale("id", "ID"));
                symbols.setGroupingSeparator('.');
                DecimalFormat df = new DecimalFormat("#,###", symbols);
                return "Rp " + df.format(candidateAmount);
            }
        } catch (Throwable ignored) {}
        return null;
    }

    private String extractMerchantOrCategory(String fullText, String title, String text) {
        try {
            // Check for merchant prefix keywords: di, ke, kepada, merchant, bayar ke
            Pattern merchantPattern = Pattern.compile("(?:di|ke|kepada|merchant|pembayaran ke|bayar ke)\\s+([a-zA-Z0-9&'\\.\\s-]{3,25})", Pattern.CASE_INSENSITIVE);
            Matcher matcher = merchantPattern.matcher(fullText);
            if (matcher.find()) {
                String candidate = matcher.group(1).trim();
                String lower = candidate.toLowerCase();
                if (!lower.contains("rekening") && !lower.contains("berhasil") && !lower.contains("sukses")
                        && !lower.contains("transaksi") && !lower.contains("pembayaran") && candidate.length() >= 3) {
                    return candidate;
                }
            }

            // Keyword to Category Fallback
            if (fullText.contains("kopi") || fullText.contains("coffee") || fullText.contains("starbucks") || fullText.contains("fore") || fullText.contains("tomoro") || fullText.contains("kenangan")) return "Coffee";
            if (fullText.contains("makan") || fullText.contains("food") || fullText.contains("nasi") || fullText.contains("resto") || fullText.contains("kfc") || fullText.contains("mcd") || fullText.contains("solaria") || fullText.contains("mie") || fullText.contains("bakso") || fullText.contains("gofood") || fullText.contains("grabfood") || fullText.contains("shopeefood")) return "Food";
            if (fullText.contains("bensin") || fullText.contains("spbu") || fullText.contains("pertamina") || fullText.contains("shell") || fullText.contains("bp") || fullText.contains("pertamax") || fullText.contains("pertalite")) return "Bensin";
            if (fullText.contains("gojek") || fullText.contains("grab") || fullText.contains("maxim") || fullText.contains("tol") || fullText.contains("parkir") || fullText.contains("krl") || fullText.contains("mrt") || fullText.contains("transjakarta") || fullText.contains("taksi")) return "Transportasi";
            if (fullText.contains("indomaret") || fullText.contains("alfamart") || fullText.contains("alfamidi") || fullText.contains("supermarket") || fullText.contains("superindo") || fullText.contains("hypermart") || fullText.contains("swalayan")) return "Supermarket";
            if (fullText.contains("pulsa") || fullText.contains("kuota") || fullText.contains("paket data") || fullText.contains("telkomsel") || fullText.contains("indosat") || fullText.contains("xl") || fullText.contains("tri") || fullText.contains("smartfren")) return "Pulsa";
            if (fullText.contains("wifi") || fullText.contains("indihome") || fullText.contains("biznet") || fullText.contains("myrepublic") || fullText.contains("internet")) return "WiFi";
            if (fullText.contains("netflix") || fullText.contains("spotify") || fullText.contains("youtube") || fullText.contains("disney") || fullText.contains("canva") || fullText.contains("chatgpt")) return "Subscription";
            if (fullText.contains("bioskop") || fullText.contains("cinema xxi") || fullText.contains("cgv") || fullText.contains("cinepolis") || fullText.contains("tix id")) return "Bioskop";
            if (fullText.contains("baju") || fullText.contains("celana") || fullText.contains("pakaian") || fullText.contains("zara") || fullText.contains("h&m") || fullText.contains("uniqlo")) return "Fashion";
            if (fullText.contains("skincare") || fullText.contains("kosmetik") || fullText.contains("makeup") || fullText.contains("sociolla") || fullText.contains("guardian") || fullText.contains("watsons")) return "Skincare";
            if (fullText.contains("admin") || fullText.contains("biaya admin") || fullText.contains("admin fee") || fullText.contains("biaya transfer")) return "Biaya Admin";
            if (fullText.contains("gaji") || fullText.contains("salary") || fullText.contains("payroll") || fullText.contains("upah")) return "Gaji";

        } catch (Throwable ignored) {}

        // Safe neutral default
        return fullText.contains("masuk") || fullText.contains("terima") || fullText.contains("kredit") || fullText.contains("credit") ? "Pemasukan" : "Pengeluaran";
    }
}

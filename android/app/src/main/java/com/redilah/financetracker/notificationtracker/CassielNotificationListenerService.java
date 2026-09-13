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
            "id.co.bri.brimo", "id.co.bri.mobile", "id.co.bri.link", "id.co.bri.internetbanking", "com.bri.brimo",
            "com.bca", "com.bca.mybca.mobile", "com.bca.mybca", "com.bca.klikbca",
            "com.bankmandiri.mandirionline", "com.bankmandiri.livin",
            "id.co.bni.net.banking", "id.co.bni.wondr",
            "com.bsm.activity2", "id.co.bankbsi.mobile", "id.co.bankbsi.superapp",
            "id.dana", "com.gojek.gopay", "com.gojek.app", "ovo.id",
            "com.shopee.id", "com.shopeepay.id", "com.telkom.mwallet",
            "com.seabank.id", "com.jfriau.bankjago", "com.bankjago.app", "com.btpn.dc",
            "com.cimbniaga.mobile.android", "net.myinfosys.PermataMobileX",
            "com.maybankindo.maybank2u", "id.co.bankbpd.diy.mobile", "id.co.btn.mobile",
            "id.co.btn.superapp", "bcadigital.blubybcadigital", "com.bnc.finance",
            "com.bankneo.mobile", "id.allobank.mobile", "com.allobank.app",
            "com.linecorp.linebank.id", "id.superbank.app", "id.co.krom.app",
            "com.astrapay.app", "com.indomarco.isaku", "com.dokuwallet.android",
            "com.paypal.android.p2pmobile"
    ));

    @Override
    public void onListenerConnected() {
        super.onListenerConnected();
        Log.i(TAG, "CassielNotificationListenerService connected to Android NotificationManager successfully!");
        try {
            SharedPreferences prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
            if (!prefs.contains(KEY_ENABLED)) {
                prefs.edit().putBoolean(KEY_ENABLED, true).apply();
            }
        } catch (Throwable ignored) {}
    }

    @Override
    public void onListenerDisconnected() {
        super.onListenerDisconnected();
        Log.w(TAG, "CassielNotificationListenerService disconnected! Attempting immediate auto rebind...");
        try {
            CassielUpdateReceiver.rebindListenerService(getApplicationContext());
        } catch (Throwable t) {
            Log.e(TAG, "Failed auto rebind onListenerDisconnected", t);
        }
    }

    @Override
    public void onNotificationPosted(StatusBarNotification sbn) {
        try {
            if (sbn == null) return;

            SharedPreferences prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
            // Default to true if user granted Notification Access
            boolean isExplicitlyDisabled = prefs.contains(KEY_ENABLED) && !prefs.getBoolean(KEY_ENABLED, true);
            if (isExplicitlyDisabled) {
                return;
            }

            String packageName = sbn.getPackageName();
            if (packageName == null) return;

            // Robust check: matches whitelist or bank/ewallet package naming
            boolean isWhitelisted = WHITELIST.contains(packageName);
            if (!isWhitelisted) {
                String pkgLower = packageName.toLowerCase();
                if (pkgLower.contains("bank") || pkgLower.contains("brimo") || pkgLower.contains("bca")
                        || pkgLower.contains("mandiri") || pkgLower.contains("wondr") || pkgLower.contains("gopay")
                        || pkgLower.contains("dana") || pkgLower.contains("shopeepay") || pkgLower.contains("seabank")
                        || pkgLower.contains("jago") || pkgLower.contains("ovo")) {
                    isWhitelisted = true;
                }
            }

            if (!isWhitelisted) {
                return;
            }

            Notification notification = sbn.getNotification();
            if (notification == null) return;

            Bundle extras = notification.extras;
            CharSequence titleCs = extras != null ? extras.getCharSequence(Notification.EXTRA_TITLE) : null;
            String title = titleCs != null ? titleCs.toString() : "";

            CharSequence textCs = extras != null ? extras.getCharSequence(Notification.EXTRA_TEXT) : null;
            String text = textCs != null ? textCs.toString() : "";

            CharSequence bigTextCs = extras != null ? extras.getCharSequence(Notification.EXTRA_BIG_TEXT) : null;
            String bigText = bigTextCs != null ? bigTextCs.toString() : "";

            CharSequence subTextCs = extras != null ? extras.getCharSequence(Notification.EXTRA_SUB_TEXT) : null;
            String subText = subTextCs != null ? subTextCs.toString() : "";

            CharSequence infoTextCs = extras != null ? extras.getCharSequence(Notification.EXTRA_INFO_TEXT) : null;
            String infoText = infoTextCs != null ? infoTextCs.toString() : "";

            CharSequence summaryTextCs = extras != null ? extras.getCharSequence(Notification.EXTRA_SUMMARY_TEXT) : null;
            String summaryText = summaryTextCs != null ? summaryTextCs.toString() : "";

            CharSequence tickerCs = notification.tickerText;
            String tickerText = tickerCs != null ? tickerCs.toString() : "";

            // Fallback: jika text kosong tapi bigText ada, atau sebaliknya
            if (text.isEmpty() && !bigText.isEmpty()) text = bigText;
            if (bigText.isEmpty() && !text.isEmpty()) bigText = text;

            String appLabel = packageName;
            try {
                PackageManager pm = getPackageManager();
                ApplicationInfo ai = pm.getApplicationInfo(packageName, 0);
                CharSequence label = pm.getApplicationLabel(ai);
                if (label != null) {
                    appLabel = label.toString();
                }
            } catch (Throwable ignored) {}

            JSONObject notifObj = new JSONObject();
            notifObj.put("packageName", packageName);
            notifObj.put("appLabel", appLabel);
            notifObj.put("title", title);
            notifObj.put("text", text);
            notifObj.put("bigText", bigText);
            notifObj.put("subText", subText);
            notifObj.put("infoText", infoText);
            notifObj.put("summaryText", summaryText);
            notifObj.put("tickerText", tickerText);
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
                    Log.i(TAG, "Notification enqueued from " + packageName + " | Title: " + title);

                    // Instantly refresh widget
                    com.redilah.financetracker.widget.CassielSmallWidgetProvider.recalculateAndRefresh(this);
                } catch (Throwable queueError) {
                    Log.e(TAG, "Failed to append to queue", queueError);
                }
            }

            // 2. Post instant confirmation notification to Android status bar
            try {
                showInstantConfirmationNotification(packageName, appLabel, title, text, bigText, subText, tickerText);
            } catch (Throwable notifError) {
                Log.e(TAG, "Failed to show instant confirmation notification", notifError);
            }

        } catch (Throwable t) {
            Log.e(TAG, "Error in onNotificationPosted", t);
        }
    }

    private void showInstantConfirmationNotification(String packageName, String appLabel, String title, String text, String bigText, String subText, String tickerText) {
        try {
            String fullText = (title + " " + text + " " + bigText + " " + subText + " " + tickerText).toLowerCase();

            // Rejection of non-transactional items (OTP, Pure Login/Security)
            if (fullText.contains("otp") || fullText.contains("kode verifikasi") || fullText.contains("login baru")
                    || fullText.contains("password baru") || fullText.contains("verifikasi perangkat")
                    || fullText.contains("kata sandi") || fullText.contains("aktivasi")) {
                return;
            }

            // Rejection of pure promo/marketing without transaction execution
            boolean hasTransactionSignal = fullText.contains("berhasil") || fullText.contains("sukses")
                    || fullText.contains("debit") || fullText.contains("debet") || fullText.contains("kredit")
                    || fullText.contains("credit") || fullText.contains("pembayaran") || fullText.contains("dibayar")
                    || fullText.contains("transfer") || fullText.contains("belanja") || fullText.contains("terima")
                    || fullText.contains("rp") || fullText.contains("idr") || fullText.contains("kirim")
                    || fullText.contains("topup") || fullText.contains("top up") || fullText.contains("keluar")
                    || fullText.contains("masuk") || fullText.contains("qris") || fullText.contains("bi-fast");

            if (!hasTransactionSignal) {
                if (fullText.contains("promo") || fullText.contains("diskon") || fullText.contains("cashback hingga")
                        || fullText.contains("voucher") || fullText.contains("kupon")) {
                    return;
                }
            }

            // Amount extraction (balance-aware)
            String formattedAmount = extractFormattedAmount(fullText);
            if (formattedAmount == null) {
                // If not a numeric transaction, skip showing confirmation notification
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

        if (packageName.contains("bri") || packageName.contains("brimo")) return "BRImo";
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

    private boolean isPhoneNumberOrIdentifier(String rawNumStr, String rawBefore, String fullText) {
        if (rawNumStr == null || rawNumStr.isEmpty()) return false;
        String digits = rawNumStr.replaceAll("[^0-9]", "");
        String cb = rawBefore != null ? rawBefore.toLowerCase() : "";
        
        // 1. Indonesian phone numbers (628xxx, 08xxx)
        if (digits.matches("^628\\d{7,12}$")) return true;
        if (digits.matches("^08\\d{8,11}$")) return true;
        if (digits.matches("^8\\d{8,11}$") && (cb.contains("ke") || cb.contains("nomor") || cb.contains("hp") || cb.contains("pulsa"))) return true;

        // 2. Bank Call Center numbers (7 digits 1500xxx or 5 digits 140xx without Rp/IDR prefix)
        if (!cb.contains("rp") && !cb.contains("idr")) {
            if (digits.matches("^(?:1500\\d{3}|140\\d{2})$")) return true;
        }

        // 3. Preceded by target/phone/identifier/call center keywords
        if (cb.endsWith("ke ") || cb.endsWith("ke") || cb.contains("tujuan") || cb.contains("nomor") || cb.contains("no.")
                || cb.contains("hp") || cb.contains("telp") || cb.contains("serial") || cb.contains("sn")
                || cb.contains("id") || cb.contains("ref") || cb.contains("order") || cb.contains("trx")
                || cb.contains("call center") || cb.contains("contact center") || cb.contains("hubungi") || cb.contains("bantuan")) {
            if (digits.length() >= 5) return true;
        }

        // 4. Serial / Order / Transaction IDs (10+ digits without Rp prefix, or 12+ digits)
        if (digits.length() >= 10 && !cb.contains("rp") && !cb.contains("idr")) {
            return true;
        }
        if (digits.length() >= 12) {
            return true;
        }

        return false;
    }

    private String extractFormattedAmount(String fullText) {
        try {
            // Pattern for Rp / IDR amounts like Rp 25.000, IDR 150,000, Rp25000, Rp. 50.000, Rp3.275
            Pattern pattern = Pattern.compile("(?:rp\\.?|idr)\\s*([0-9]+(?:[\\.,][0-9]+)*)", Pattern.CASE_INSENSITIVE);
            Matcher matcher = pattern.matcher(fullText);

            long candidateAmount = -1;

            while (matcher.find()) {
                int matchIndex = matcher.start();
                String rawBefore = fullText.substring(Math.max(0, matchIndex - 40), matchIndex).toLowerCase();

                // If preceded by saldo/sisa saldo/balance keywords, skip (unless accompanied by bertambah)
                boolean isBalance = (rawBefore.contains("saldo") || rawBefore.contains("sisa") || rawBefore.contains("balance") || rawBefore.contains("limit"))
                        && !rawBefore.contains("bertambah") && !rawBefore.contains("ditambahkan") && !rawBefore.contains("masuk");

                String numStr = matcher.group(1).trim();
                if (isPhoneNumberOrIdentifier(numStr, rawBefore, fullText)) {
                    continue;
                }

                // Strip trailing 1-2 decimal places (cents/sen, e.g. .00 or ,00 or .0)
                String cleanedNum = numStr.replaceAll("[,.]\\d{1,2}$", "");
                String rawNum = cleanedNum.replaceAll("[^0-9]", "");
                if (!rawNum.isEmpty()) {
                    long amount = Long.parseLong(rawNum);
                    if (amount > 0 && amount < 10000000000L) {
                        if (!isBalance) {
                            candidateAmount = amount;
                            break; // Found preferred transaction amount!
                        } else if (candidateAmount == -1) {
                            candidateAmount = amount; // Temporary fallback
                        }
                    }
                }
            }

            // Fallback for Pulsa / Digital Product Denominations (e.g. "SIMPATI 2.000", "Pulsa 5.000", "Telkomsel 10.000")
            if (candidateAmount <= 0) {
                Pattern pulsaPattern = Pattern.compile("(?:simpati|kartu\\s*as|telkomsel|indosat|im3|mentari|xl|axis|tri|three|smartfren|by\\.?u|pulsa)\\s+([0-9]{1,3}(?:\\.[0-9]{3})+|[0-9]{1,3}k|[0-9]{1,3}rb)\\b", Pattern.CASE_INSENSITIVE);
                Matcher pulsaMatcher = pulsaPattern.matcher(fullText);
                if (pulsaMatcher.find()) {
                    String denomStr = pulsaMatcher.group(1).toLowerCase().replace(".", "");
                    if (denomStr.endsWith("k") || denomStr.endsWith("rb")) {
                        String numPart = denomStr.replaceAll("[^0-9]", "");
                        if (!numPart.isEmpty()) {
                            candidateAmount = Long.parseLong(numPart) * 1000L;
                        }
                    } else {
                        String digits = denomStr.replaceAll("[^0-9]", "");
                        if (!digits.isEmpty()) {
                            long amt = Long.parseLong(digits);
                            if (amt >= 1000 && amt < 10000000L) {
                                candidateAmount = amt;
                            }
                        }
                    }
                }
            }

            // Fallback for standalone large numbers if no Rp/IDR prefix found (strictly excluding phone numbers & serials)
            if (candidateAmount <= 0) {
                Pattern rawNumPattern = Pattern.compile("\\b([0-9]{1,3}(?:[\\.,][0-9]{3})+(?:[\\.,][0-9]{1,2})?|[0-9]{4,}(?:[\\.,][0-9]{1,2})?)\\b");
                Matcher rawMatcher = rawNumPattern.matcher(fullText);
                while (rawMatcher.find()) {
                    int matchIndex = rawMatcher.start();
                    String rawBefore = fullText.substring(Math.max(0, matchIndex - 40), matchIndex).toLowerCase();
                    boolean isBalance = rawBefore.contains("saldo") || rawBefore.contains("sisa") || rawBefore.contains("balance");
                    if (!isBalance) {
                        String numStr = rawMatcher.group(1).trim();
                        if (isPhoneNumberOrIdentifier(numStr, rawBefore, fullText)) {
                            continue;
                        }
                        String cleanedNum = numStr.replaceAll("[,.]\\d{1,2}$", "");
                        String digits = cleanedNum.replaceAll("[^0-9]", "");
                        if (!digits.isEmpty()) {
                            long amt = Long.parseLong(digits);
                            if (amt >= 1000 && amt < 1000000000L) {
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
            // Check for Pulsa / Provider product name first
            Pattern pulsaPattern = Pattern.compile("\\b(simpati|kartu\\s*as|telkomsel|indosat|im3|mentari|xl|axis|tri|three|smartfren|by\\.?u|pulsa|paket\\s*data|token\\s*pln|pln)\\s*([0-9]{1,3}(?:\\.[0-9]{3})+|[0-9]{1,3}k|[0-9]{1,3}rb)?\\b", Pattern.CASE_INSENSITIVE);
            Matcher pulsaMatcher = pulsaPattern.matcher(fullText);
            if (pulsaMatcher.find()) {
                String brand = pulsaMatcher.group(1).toUpperCase();
                String denom = pulsaMatcher.group(2) != null ? " " + pulsaMatcher.group(2) : "";
                return (brand + denom).trim();
            }

            // Check for merchant prefix keywords: di, ke, kepada, merchant, bayar ke, transfer ke, qris
            Pattern merchantPattern = Pattern.compile("(?:di|ke|kepada|merchant|pembayaran ke|bayar ke|transfer ke|qris)\\s+([a-zA-Z0-9&'\\.\\s-]{3,35})", Pattern.CASE_INSENSITIVE);
            Matcher matcher = merchantPattern.matcher(fullText);
            if (matcher.find()) {
                String candidate = matcher.group(1).trim();
                // Strip trailing punctuation / clauses
                if (candidate.contains(",")) candidate = candidate.split(",")[0].trim();
                if (candidate.contains(".")) candidate = candidate.split("\\.")[0].trim();
                candidate = candidate.replaceAll("(?i)\\s+(?:set|kantong.*|pocket.*|rekening.*)$", "").trim();

                // Skip phone numbers or pure numbers mistaken for merchant
                String cleanDigits = candidate.replaceAll("[^0-9]", "");
                if (cleanDigits.length() < 8 && !candidate.startsWith("08") && !candidate.startsWith("628")) {
                    String lower = candidate.toLowerCase();
                    if (!lower.contains("rekening") && !lower.contains("berhasil") && !lower.contains("sukses")
                            && !lower.contains("transaksi") && !lower.contains("pembayaran") && candidate.length() >= 2) {
                        return candidate;
                    }
                }
            }

            // Keyword to Category Fallback
            if (fullText.contains("pembelian qris") || fullText.contains("transaksi qris") || fullText.contains("qris")) return "QRIS";
            if (fullText.contains("simpati") || fullText.contains("pulsa") || fullText.contains("kuota") || fullText.contains("paket data") || fullText.contains("telkomsel") || fullText.contains("indosat") || fullText.contains("xl") || fullText.contains("tri") || fullText.contains("smartfren") || fullText.contains("axis") || fullText.contains("by.u")) return "Pulsa";
            if (fullText.contains("kopi") || fullText.contains("coffee") || fullText.contains("starbucks") || fullText.contains("fore") || fullText.contains("tomoro") || fullText.contains("kenangan")) return "Coffee";
            if (fullText.contains("makan") || fullText.contains("food") || fullText.contains("nasi") || fullText.contains("resto") || fullText.contains("kfc") || fullText.contains("mcd") || fullText.contains("solaria") || fullText.contains("mie") || fullText.contains("bakso") || fullText.contains("gofood") || fullText.contains("grabfood") || fullText.contains("shopeefood")) return "Food";
            if (fullText.contains("bensin") || fullText.contains("spbu") || fullText.contains("pertamina") || fullText.contains("shell") || fullText.contains("bp") || fullText.contains("pertamax") || fullText.contains("pertalite")) return "Bensin";
            if (fullText.contains("gojek") || fullText.contains("grab") || fullText.contains("maxim") || fullText.contains("tol") || fullText.contains("parkir") || fullText.contains("krl") || fullText.contains("mrt") || fullText.contains("transjakarta") || fullText.contains("taksi")) return "Transportasi";
            if (fullText.contains("indomaret") || fullText.contains("alfamart") || fullText.contains("alfamidi") || fullText.contains("supermarket") || fullText.contains("superindo") || fullText.contains("hypermart") || fullText.contains("swalayan")) return "Supermarket";
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

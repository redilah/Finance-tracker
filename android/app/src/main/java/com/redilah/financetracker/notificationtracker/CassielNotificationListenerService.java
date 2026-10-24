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
    private static final java.util.concurrent.ConcurrentHashMap<String, String> APP_LABEL_CACHE = new java.util.concurrent.ConcurrentHashMap<>();

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
            "com.maybankindo.maybank2u", "id.co.bankbpd.diy.mobile", "id.co.btn.mobilebanking.android",
            "id.co.btn.mobile", "id.co.btn.superapp", "bcadigital.blubybcadigital", "com.bnc.finance",
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
                        || pkgLower.contains("jago") || pkgLower.contains("ovo") || pkgLower.contains("btn")
                        || pkgLower.contains("bale")) {
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

            String fullText = (title + " " + text + " " + bigText + " " + subText + " " + summaryText + " " + tickerText).toLowerCase();

            // Rejection of non-transactional items first (before PackageManager IPC) to prevent binder thread ANR
            if (isNonTransactional(fullText)) {
                Log.i(TAG, "Notification rejected (non-transactional / promo / failed) from " + packageName + " | Title: " + title);
                return;
            }

            String appLabel = APP_LABEL_CACHE.get(packageName);
            if (appLabel == null) {
                appLabel = packageName;
                try {
                    PackageManager pm = getPackageManager();
                    ApplicationInfo ai = pm.getApplicationInfo(packageName, 0);
                    CharSequence label = pm.getApplicationLabel(ai);
                    if (label != null && label.length() > 0) {
                        appLabel = label.toString();
                        APP_LABEL_CACHE.put(packageName, appLabel);
                    }
                } catch (Throwable ignored) {}
            }

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

    public static boolean isFailedOrCancelledNotification(String fullText) {
        if (fullText == null || fullText.isEmpty()) return false;
        String lower = fullText.toLowerCase();

        // 1. Explicit failure / cancellation keywords
        if (lower.contains("gagal") || lower.contains("failed") || lower.contains("unsuccessful")
                || lower.contains("declined") || lower.contains("ditolak") || lower.contains("dibatalkan")
                || lower.contains("cancelled") || lower.contains("canceled") || lower.contains("kadaluarsa")
                || lower.contains("expired") || lower.contains("batal")) {
            return true;
        }

        // 2. Failure phrases (Indonesian & English)
        if (lower.contains("gak bisa bayar") || lower.contains("tidak bisa bayar") || lower.contains("tidak berhasil")
                || lower.contains("gak bisa transfer") || lower.contains("tidak bisa transfer")
                || lower.contains("tidak dapat diproses") || lower.contains("gak bisa diproses")
                || lower.contains("saldo tidak cukup") || lower.contains("saldonya kurang")
                || lower.contains("saldo tidak mencukupi") || lower.contains("saldo kurang")
                || lower.contains("insufficient balance") || lower.contains("insufficient funds")
                || lower.contains("payment failed") || lower.contains("transaction failed")) {
            return true;
        }

        return false;
    }

    public static boolean isNonTransactional(String fullText) {
        if (fullText == null || fullText.isEmpty()) return true;
        String lower = fullText.toLowerCase();

        // 1. Explicit failure / cancellation keywords or phrases
        if (isFailedOrCancelledNotification(lower)) {
            return true;
        }

        // 2. Pure OTP / Verification / Security / Login alerts
        if (lower.contains("otp") || lower.contains("kode verifikasi") || lower.contains("verification code")
                || lower.contains("login baru") || lower.contains("password baru") || lower.contains("kata sandi")
                || lower.contains("verifikasi perangkat") || lower.contains("aktivasi") || lower.contains("keamanan akun")
                || lower.contains("security alert") || lower.contains("one time password") || lower.contains("one-time password")) {
            return true;
        }

        // 3. Marketing / Promo / Ads / Rewards / Discounts / Contest / Survey / Games / Loans / Investment
        boolean isMarketingOrPromo = false;
        if (lower.contains("promo") || lower.contains("promosi") || lower.contains("diskon") || lower.contains("discount")
                || lower.contains("voucher") || lower.contains("kupon") || lower.contains("coupon")
                || lower.contains("cashback") || lower.contains("reward") || lower.contains("rewards")
                || lower.contains("hadiah") || lower.contains("menangkan") || lower.contains("pemenang")
                || lower.contains("winner") || lower.contains("giveaway") || lower.contains("undian")
                || lower.contains("lucky draw") || lower.contains("flip card") || lower.contains("spin")
                || lower.contains("roda putar") || lower.contains("gratis") || lower.contains("free")
                || lower.contains("khusus buat kamu") || lower.contains("buat kamu") || lower.contains("penawaran")
                || lower.contains("special offer") || lower.contains("flash sale") || lower.contains("a+ rewards")
                || lower.contains("kuota terbatas") || lower.contains("jangan lewatkan") || lower.contains("kesempatan")
                || lower.contains("ajukan pinjaman") || lower.contains("pinjaman") || lower.contains("paylater")
                || lower.contains("reksa dana") || lower.contains("investasi") || lower.contains("sbr")
                || lower.contains("sukuk") || lower.contains("obligasi") || lower.contains("deposito")
                || lower.contains("potongan harga") || lower.contains("iklan") || lower.contains("advertisement")
                || lower.contains("bunga spesial")) {
            isMarketingOrPromo = true;
        }

        // 4. Definite Real Transaction Execution / Completion Signal
        Pattern definiteTxPattern = Pattern.compile(
                "(?:(?:pembayaran|transaksi|transfer|debet|debit|top\\s*up|belanja)\\s+[^!?\\n;]*?\\b(?:berhasil|sukses|selesai|dikonfirmasi)"
                + "|berhasil\\s+(?:dibayar|bayar|transfer|top\\s*up)"
                + "|kamu\\s+(?:telah\\s*membayar|berhasil\\s*bayar|menerima|telah\\s*mengirim)"
                + "|top\\s*up\\s+(?:berhasil|sukses)"
                + "|uang\\s*masuk\\s*dari|dana\\s*masuk\\s*dari"
                + "|(?:debet|debit|kredit)\\s+sebesar"
                + "|(?:pembelian|transaksi)\\s+qris\\s+[^!?\\n;]*?\\bberhasil)",
                Pattern.CASE_INSENSITIVE
        );

        boolean hasDefiniteTxExecution = definiteTxPattern.matcher(lower).find();

        // If marketing/promo is detected and NO definite transaction execution signal exists -> REJECT!
        if (isMarketingOrPromo && !hasDefiniteTxExecution) {
            return true;
        }

        // 5. Check if there is ANY legitimate transaction action signal
        // Strict ban on "rp" or "idr" as a transaction signal! Currency alone is never a transaction.
        Pattern txSignalPattern = Pattern.compile(
                "(?:\\b(?:debit|debet|kredit|credit)\\b"
                + "|\\b(?:pembayaran|bayar|membayar|dibayar|terbayar)\\b"
                + "|\\b(?:transfer|mentransfer|ditransfer|m-transfer)\\b"
                + "|\\b(?:kirim|mengirim|dikirim)\\s+(?:uang|dana|ke\\b)"
                + "|\\b(?:tarik\\s*tunai|penarikan)\\b"
                + "|\\b(?:terima|menerima|diterima)\\b"
                + "|(?:dana|uang|saldo)\\s*(?:masuk|keluar)"
                + "|(?:top\\s*up|topup|isi\\s*saldo|tambah\\s*saldo)"
                + "|\\b(?:berhasil|sukses|selesai)\\b"
                + "|\\b(?:qris|bi-fast|bifast)\\b)",
                Pattern.CASE_INSENSITIVE
        );

        if (!txSignalPattern.matcher(lower).find()) {
            return true; // No transaction signal -> Discard!
        }

        return false;
    }

    private void showInstantConfirmationNotification(String packageName, String appLabel, String title, String text, String bigText, String subText, String tickerText) {
        try {
            String fullText = (title + " " + text + " " + bigText + " " + subText + " " + tickerText).toLowerCase();

            // Rejection of non-transactional items (failed, cancelled, promo, ads, OTP)
            if (isNonTransactional(fullText)) {
                return;
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
                    .setLargeIcon(BitmapFactory.decodeResource(getResources(), R.mipmap.ic_launcher))
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
        if (packageName.contains("btn") || packageName.contains("bale")) return "bale by BTN";
        if (packageName.contains("blu")) return "blu";
        if (packageName.contains("paypal")) return "PayPal";

        return fallbackLabel != null && !fallbackLabel.isEmpty() ? fallbackLabel : "Bank";
    }

    private boolean isPhoneNumberOrIdentifier(String rawNumStr, String rawBefore, String fullText) {
        if (rawNumStr == null || rawNumStr.isEmpty()) return false;
        String digits = rawNumStr.replaceAll("[^0-9]", "");
        String cb = rawBefore != null ? rawBefore.toLowerCase().trim() : "";
        
        // 1. Indonesian phone numbers (628xxx, 08xxx)
        if (digits.matches("^628\\d{7,12}$")) return true;
        if (digits.matches("^08\\d{8,11}$")) return true;
        if (digits.matches("^8\\d{8,11}$") && (cb.endsWith("ke") || cb.endsWith("nomor") || cb.endsWith("no") || cb.endsWith("hp") || cb.endsWith("pulsa"))) return true;

        // 2. Bank Call Center numbers (7 digits 1500xxx or 5 digits 140xx without Rp/IDR prefix)
        if (!cb.contains("rp") && !cb.contains("idr")) {
            if (digits.matches("^(?:1500\\d{3}|140\\d{2})$")) return true;
        }

        // 3. Preceded immediately by phone/target/identifier/call center keywords (unless ending with amount indicators)
        if (cb.matches(".*(?:ke|tujuan|nomor|no\\.?|hp|handphone|telepon|telp|msisdn|serial|sn|id|ref|order|trx|call\\s*center|contact\\s*center|hubungi|bantuan)\\s*[:#-]?\\s*$")) {
            if (!cb.matches(".*(?:sebesar|sejumlah|nominal|total|rp|idr)\\s*$")) {
                if (digits.length() >= 5) return true;
            }
        }

        // 4. Serial / Order / Transaction IDs (10+ digits without Rp prefix, or 12+ digits)
        if (digits.length() >= 10 && !cb.contains("rp") && !cb.contains("idr")) {
            return true;
        }
        if (digits.length() >= 12 && !cb.contains("rp") && !cb.contains("idr")) {
            return true;
        }

        return false;
    }

    private String extractFormattedAmount(String fullText) {
        try {
            // Pattern for Rp / IDR amounts like Rp 25.000, IDR 150,000, Rp25000, Rp. 50.000, Rp3.275, Rp5.600.000,00
            Pattern pattern = Pattern.compile("(?:rp\\.?|idr)\\s*([0-9]+(?:[\\.,][0-9]+)*)", Pattern.CASE_INSENSITIVE);
            Matcher matcher = pattern.matcher(fullText);

            long candidateAmount = -1;

            while (matcher.find()) {
                int matchIndex = matcher.start();
                int matchEnd = matcher.end();
                String rawBefore = fullText.substring(Math.max(0, matchIndex - 40), matchIndex).toLowerCase();
                String rawAfter = fullText.substring(matchEnd, Math.min(fullText.length(), matchEnd + 20)).toLowerCase();

                // If preceded by promo/limit context (cashback, diskon, hadiah, voucher, maksimal), skip this amount!
                boolean isPromoContext = rawBefore.contains("cashback") || rawBefore.contains("hadiah")
                        || rawBefore.contains("diskon") || rawBefore.contains("voucher")
                        || rawBefore.contains("maksimal") || rawBefore.contains("maks")
                        || rawBefore.contains("s.d.") || rawBefore.contains("up to") || rawBefore.contains("hingga");
                if (isPromoContext) {
                    continue;
                }

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

                    // Check multiplier suffix (e.g. Rp 150 ribu, Rp 500 rb, Rp 1,5 juta)
                    if (rawAfter.matches("^\\s*(?:ribu|rb|k\\b).*")) {
                        amount *= 1000L;
                    } else if (rawAfter.matches("^\\s*(?:juta|jt\\b).*")) {
                        amount *= 1000000L;
                    } else if (rawAfter.matches("^\\s*(?:miliar|milyar|m\\b).*")) {
                        amount *= 1000000000L;
                    }

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

            // Fallback for standalone large numbers if no Rp/IDR prefix found (strictly excluding dates, times, years, phone numbers & serials)
            if (candidateAmount <= 0) {
                // Strip dates (DD/MM/YYYY, YYYY-MM-DD), times (HH:mm:ss), and calendar years (2020-2039)
                String textWithoutDates = fullText
                        .replaceAll("\\b\\d{1,2}[/\\-\\.]\\d{1,2}[/\\-\\.]\\d{2,4}\\b", " ")
                        .replaceAll("\\b\\d{4}[/\\-\\.]\\d{1,2}[/\\-\\.]\\d{1,2}\\b", " ")
                        .replaceAll("\\b\\d{1,2}:\\d{2}(?::\\d{2})?\\b", " ")
                        .replaceAll("\\b20[2-3]\\d\\b", " ");

                Pattern rawNumPattern = Pattern.compile("\\b([0-9]{1,3}(?:[\\.,][0-9]{3})+(?:[\\.,][0-9]{1,2})?|[0-9]{4,}(?:[\\.,][0-9]{1,2})?)\\b");
                Matcher rawMatcher = rawNumPattern.matcher(textWithoutDates);
                while (rawMatcher.find()) {
                    int matchIndex = rawMatcher.start();
                    String rawBefore = textWithoutDates.substring(Math.max(0, matchIndex - 40), matchIndex).toLowerCase();
                    boolean isBalance = rawBefore.contains("saldo") || rawBefore.contains("sisa") || rawBefore.contains("balance");
                    if (!isBalance) {
                        String numStr = rawMatcher.group(1).trim();
                        if (isPhoneNumberOrIdentifier(numStr, rawBefore, textWithoutDates)) {
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
            // 1. Check for Pulsa / Provider product name first
            Pattern pulsaPattern = Pattern.compile("\\b(simpati|kartu\\s*as|telkomsel|indosat|im3|mentari|xl|axis|tri|three|smartfren|by\\.?u|pulsa|paket\\s*data|token\\s*pln|pln)\\s*([0-9]{1,3}(?:\\.[0-9]{3})+|[0-9]{1,3}k|[0-9]{1,3}rb)?\\b", Pattern.CASE_INSENSITIVE);
            Matcher pulsaMatcher = pulsaPattern.matcher(fullText);
            if (pulsaMatcher.find()) {
                String brand = pulsaMatcher.group(1).toUpperCase();
                String denom = pulsaMatcher.group(2) != null ? " " + pulsaMatcher.group(2) : "";
                return (brand + denom).trim();
            }

            // 2. Specific Transaction Type Patterns (QRIS, Transfer, Top Up)
            if (fullText.contains("pembelian qris")) {
                // Check if there is a merchant following 'di' or 'ke'
                Pattern qrisMerchantPattern = Pattern.compile("(?:pembelian qris|qris)\\s+(?:di|ke|pada|merchant)\\s+([a-zA-Z0-9&'\\.\\s-]{2,35})", Pattern.CASE_INSENSITIVE);
                Matcher qrisMatcher = qrisMerchantPattern.matcher(fullText);
                if (qrisMatcher.find()) {
                    String candidate = cleanCandidateMerchant(qrisMatcher.group(1));
                    if (isValidMerchantCandidate(candidate)) {
                        return candidate;
                    }
                }
                return "Pembelian QRIS";
            }

            if (fullText.contains("pembayaran qris") || fullText.contains("transaksi qris")) {
                Pattern qrisMerchantPattern = Pattern.compile("(?:pembayaran qris|transaksi qris|qris)\\s+(?:di|ke|pada|merchant)\\s+([a-zA-Z0-9&'\\.\\s-]{2,35})", Pattern.CASE_INSENSITIVE);
                Matcher qrisMatcher = qrisMerchantPattern.matcher(fullText);
                if (qrisMatcher.find()) {
                    String candidate = cleanCandidateMerchant(qrisMatcher.group(1));
                    if (isValidMerchantCandidate(candidate)) {
                        return candidate;
                    }
                }
                return "Pembayaran QRIS";
            }

            // Transfer Specific Patterns
            if (fullText.contains("transfer dari") && (fullText.contains("rekening tujuan") || fullText.contains("tujuan"))) {
                Pattern briTfPattern = Pattern.compile("(?:rekening tujuan|tujuan)\\s+([a-zA-Z0-9&'\\.\\s-]{2,35})", Pattern.CASE_INSENSITIVE);
                Matcher briTfMatcher = briTfPattern.matcher(fullText);
                if (briTfMatcher.find()) {
                    String candidate = cleanCandidateMerchant(briTfMatcher.group(1));
                    if (isValidMerchantCandidate(candidate)) {
                        return "Transfer ke " + candidate;
                    }
                }
                return "Transfer";
            }

            if (fullText.contains("transfer ke") || fullText.contains("transfer antar bank ke") || fullText.contains("transfer sesama bank ke") || fullText.contains("transfer bi-fast ke") || fullText.contains("transfer online ke") || fullText.contains("transfer dana ke") || fullText.contains("kirim uang ke") || fullText.contains("kirim dana ke")) {
                Pattern tfPattern = Pattern.compile("(?:transfer(?:\\s+antar\\s+bank|\\s+sesama\\s+bank|\\s+bi-?fast|\\s+online|\\s+dana)?\\s+ke|kirim(?:\\s+dana|\\s+uang)?\\s+ke)\\s+([a-zA-Z0-9&'\\.\\s-]{2,35})", Pattern.CASE_INSENSITIVE);
                Matcher tfMatcher = tfPattern.matcher(fullText);
                if (tfMatcher.find()) {
                    String candidate = cleanCandidateMerchant(tfMatcher.group(1));
                    if (isValidMerchantCandidate(candidate)) {
                        return "Transfer ke " + candidate;
                    }
                }
                return "Transfer Keluar";
            }

            if (fullText.contains("transfer masuk") || fullText.contains("dana masuk") || fullText.contains("terima transfer") || fullText.contains("penerimaan transfer")) {
                Pattern tfInPattern = Pattern.compile("(?:dari|pengirim)\\s+([a-zA-Z0-9&'\\.\\s-]{2,35})", Pattern.CASE_INSENSITIVE);
                Matcher tfInMatcher = tfInPattern.matcher(fullText);
                if (tfInMatcher.find()) {
                    String candidate = cleanCandidateMerchant(tfInMatcher.group(1));
                    if (isValidMerchantCandidate(candidate)) {
                        return "Transfer dari " + candidate;
                    }
                }
                return "Transfer Masuk";
            }

            // 3. Check for general merchant prefix keywords: di, merchant, bayar ke, pembayaran ke, belanja di
            Pattern merchantPattern = Pattern.compile("(?:di\\s+merchant|belanja\\s+di|pembayaran\\s+ke|bayar\\s+ke|merchant|di)\\s+([a-zA-Z0-9&'\\.\\s-]{3,35})", Pattern.CASE_INSENSITIVE);
            Matcher matcher = merchantPattern.matcher(fullText);
            if (matcher.find()) {
                String candidate = cleanCandidateMerchant(matcher.group(1));
                if (isValidMerchantCandidate(candidate)) {
                    return candidate;
                }
            }

            // 4. Keyword to Category Fallback
            if (fullText.contains("qris")) return "Pembelian QRIS";
            if (fullText.contains("transfer") || fullText.contains("tranfer")) return "Tranfer";
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

    private String cleanCandidateMerchant(String candidate) {
        if (candidate == null) return "";
        String res = candidate.trim();
        if (res.contains(",")) res = res.split(",")[0].trim();
        if (res.contains(".")) res = res.split("\\.")[0].trim();
        res = res.replaceAll("(?i)\\s+(?:sebesar|sejumlah|nominal|rp|idr|berhasil|sukses|pada|tgl|tanggal|jam|waktu|set|kantong.*|pocket.*|rekening.*|call center.*|contact center.*).*$", "").trim();
        return res;
    }

    private boolean isValidMerchantCandidate(String candidate) {
        if (candidate == null || candidate.length() < 2) return false;
        String lower = candidate.toLowerCase();
        
        // Discard transition words, amounts, and system words
        if (lower.startsWith("sebesar") || lower.startsWith("sejumlah") || lower.startsWith("senilai") 
                || lower.startsWith("nominal") || lower.startsWith("rp") || lower.startsWith("idr")
                || lower.startsWith("berhasil") || lower.startsWith("sukses") || lower.startsWith("transaksi")
                || lower.startsWith("pembayaran") || lower.startsWith("pembelian") || lower.startsWith("rekening")
                || lower.startsWith("call center") || lower.startsWith("info lebih")) {
            return false;
        }

        // Discard prepositions, promo keywords, and stop words
        if (lower.equals("sini") || lower.equals("sana") || lower.equals("mana")
                || lower.startsWith("sini") || lower.startsWith("luar negeri") || lower.startsWith("dalam negeri")
                || lower.equals("merchant") || lower.equals("rekening") || lower.equals("aplikasi")
                || lower.equals("fitur") || lower.equals("semua") || lower.equals("berikut")
                || lower.equals("kantong") || lower.equals("pocket") || lower.startsWith("cashback")
                || lower.startsWith("promo") || lower.startsWith("diskon") || lower.startsWith("hadiah")
                || lower.startsWith("voucher") || lower.startsWith("kupon")) {
            return false;
        }

        // Must not be pure phone number or account number (10+ pure digits)
        String cleanDigits = candidate.replaceAll("[^0-9]", "");
        if (cleanDigits.length() >= 10 || candidate.startsWith("08") || candidate.startsWith("628")) {
            return false;
        }

        return true;
    }
}

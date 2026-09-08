package com.redilah.financetracker.assistant;

import android.Manifest;
import android.app.Dialog;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.graphics.BitmapFactory;
import android.graphics.Color;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.service.voice.VoiceInteractionSession;
import android.speech.RecognitionListener;
import android.speech.RecognizerIntent;
import android.speech.SpeechRecognizer;
import android.util.Log;
import android.view.LayoutInflater;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import androidx.core.app.NotificationCompat;
import androidx.core.content.ContextCompat;

import com.redilah.financetracker.MainActivity;
import com.redilah.financetracker.R;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.ArrayList;

/**
 * Cassiel Digital Assistant — VoiceInteractionSession
 *
 * Menangani sesi interaksi asisten saat gesture / long-press tombol power dipicu.
 * Meng-host WebView assistant.html langsung di window VoiceInteractionSession
 * (TYPE_VOICE_INTERACTION overlay) sehingga muncul INSTAN di atas layar mana pun
 * tanpa batasan Background Activity Launch (BAL) Android 10+.
 */
public class CassielVoiceInteractionSession extends VoiceInteractionSession {

    private static final String TAG = "CassielVoiceSession";
    private static final String CHANNEL_ID = "financial_notifications";
    private static final String PREFS_NAME = "CassielNotifTrackerPrefs";
    private static final String KEY_QUEUE = "cassiel_notif_tracker_queue";
    private static final int MAX_QUEUE_SIZE = 100;

    private View rootView;
    private WebView webView;
    private SpeechRecognizer speechRecognizer;
    private boolean isListening = false;
    private Handler mainHandler;

    public CassielVoiceInteractionSession(Context context) {
        super(context);
        mainHandler = new Handler(Looper.getMainLooper());
    }

    @Override
    public void onCreate() {
        super.onCreate();
        createNotificationChannel();
    }

    @Override
    public View onCreateContentView() {
        LayoutInflater inflater = (LayoutInflater) getContext().getSystemService(Context.LAYOUT_INFLATER_SERVICE);
        rootView = inflater.inflate(R.layout.activity_assistant, null);

        webView = rootView.findViewById(R.id.assistant_webview);
        setupWebView();

        // Initialize SpeechRecognizer
        if (SpeechRecognizer.isRecognitionAvailable(getContext())) {
            speechRecognizer = SpeechRecognizer.createSpeechRecognizer(getContext());
            speechRecognizer.setRecognitionListener(new SessionRecognitionListener());
        }

        return rootView;
    }

    private void setupWebView() {
        if (webView == null) return;
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setCacheMode(WebSettings.LOAD_NO_CACHE);
        settings.setUseWideViewPort(true);
        settings.setLoadWithOverviewMode(true);
        settings.setAllowFileAccess(true);

        webView.setBackgroundColor(Color.TRANSPARENT);
        webView.setLayerType(View.LAYER_TYPE_HARDWARE, null);

        // Register JavaScript bridge
        webView.addJavascriptInterface(new SessionAssistBridge(), "CassielAssistBridge");

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public void onPageFinished(WebView view, String url) {
                super.onPageFinished(view, url);
                mainHandler.post(() -> webView.evaluateJavascript(
                    "if(typeof onBridgeReady==='function')onBridgeReady();", null));
            }
        });

        webView.setWebChromeClient(new WebChromeClient());
        webView.loadUrl("file:///android_asset/public/assistant.html");
    }

    @Override
    public void onPrepareShow(Bundle args, int showFlags) {
        super.onPrepareShow(args, showFlags);
        // Pastikan UI aktif
        setUiEnabled(true);
    }

    @Override
    public void onShow(Bundle args, int showFlags) {
        super.onShow(args, showFlags);
        Log.d(TAG, "onShow triggered for Cassiel Voice Session");

        // Konfigurasi Window Session agar 100% transparan dan full screen
        try {
            Dialog dialog = getWindow();
            if (dialog != null) {
                Window window = dialog.getWindow();
                if (window != null) {
                    window.setBackgroundDrawableResource(android.R.color.transparent);
                    window.setLayout(WindowManager.LayoutParams.MATCH_PARENT, WindowManager.LayoutParams.MATCH_PARENT);
                    window.clearFlags(WindowManager.LayoutParams.FLAG_DIM_BEHIND);
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                        window.addFlags(WindowManager.LayoutParams.FLAG_DRAWS_SYSTEM_BAR_BACKGROUNDS);
                        window.setStatusBarColor(Color.TRANSPARENT);
                        window.setNavigationBarColor(Color.TRANSPARENT);
                    }
                }
            }
        } catch (Exception e) {
            Log.w(TAG, "Window configuration fallback:", e);
        }

        // Muat ulang / reset assistant webview saat ditampilkan
        if (webView != null) {
            webView.loadUrl("file:///android_asset/public/assistant.html");
        }
    }

    @Override
    public void onHide() {
        super.onHide();
        stopSpeechRecognition();
    }

    private void stopSpeechRecognition() {
        mainHandler.post(() -> {
            if (speechRecognizer != null && isListening) {
                try {
                    speechRecognizer.stopListening();
                } catch (Exception e) {}
                isListening = false;
            }
        });
    }

    private void startSpeechRecognition() {
        if (speechRecognizer == null) {
            callJs("onSpeechError('Speech recognition tidak tersedia')");
            return;
        }

        Intent intent = new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH);
        intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM);
        intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE, "id-ID");
        intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE_PREFERENCE, "id-ID");
        intent.putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, true);
        intent.putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 1);

        try {
            speechRecognizer.startListening(intent);
            isListening = true;
            callJs("onSpeechStarted()");
        } catch (Exception e) {
            Log.e(TAG, "Failed to start speech recognition", e);
            callJs("onSpeechError('Gagal memulai pengenalan suara')");
        }
    }

    private void callJs(String script) {
        mainHandler.post(() -> {
            if (webView != null) {
                webView.evaluateJavascript(script, null);
            }
        });
    }

    private String escapeJs(String str) {
        if (str == null) return "";
        return str.replace("\\", "\\\\").replace("'", "\\'").replace("\n", "\\n").replace("\r", "");
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID,
                "Notifikasi Finansial",
                NotificationManager.IMPORTANCE_HIGH
            );
            channel.setDescription("Pengingat dan notifikasi transaksi otomatis");
            channel.enableVibration(true);
            NotificationManager nm = (NotificationManager) getContext().getSystemService(Context.NOTIFICATION_SERVICE);
            if (nm != null) {
                nm.createNotificationChannel(channel);
            }
        }
    }

    private void showConfirmationNotification(String account, String note, String formattedAmount) {
        try {
            Context ctx = getContext();
            String notifTitle = "Transaksi " + account + " Berhasil Dicatat";
            String notifBody = note + " • " + formattedAmount;

            Intent launchIntent = new Intent(ctx, MainActivity.class);
            launchIntent.setFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            PendingIntent pendingIntent = PendingIntent.getActivity(
                ctx,
                (int) (System.currentTimeMillis() % 100000),
                launchIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
            );

            NotificationCompat.Builder builder = new NotificationCompat.Builder(ctx, CHANNEL_ID)
                .setSmallIcon(R.drawable.ic_stat_icon)
                .setLargeIcon(BitmapFactory.decodeResource(ctx.getResources(), R.drawable.ic_large_icon))
                .setContentTitle(notifTitle)
                .setContentText(notifBody)
                .setStyle(new NotificationCompat.BigTextStyle().bigText(notifBody))
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .setAutoCancel(true)
                .setContentIntent(pendingIntent);

            NotificationManager nm = (NotificationManager) ctx.getSystemService(Context.NOTIFICATION_SERVICE);
            if (nm != null) {
                int notifId = (int) (System.currentTimeMillis() % Integer.MAX_VALUE);
                nm.notify(notifId, builder.build());
            }
        } catch (Exception e) {
            Log.e(TAG, "Failed to show notification", e);
        }
    }

    public class SessionAssistBridge {

        @JavascriptInterface
        public void startListening() {
            mainHandler.post(() -> {
                if (isListening) return;
                if (ContextCompat.checkSelfPermission(getContext(), Manifest.permission.RECORD_AUDIO) != PackageManager.PERMISSION_GRANTED) {
                    callJs("onSpeechError('Izin mikrofon diperlukan untuk merekam suara')");
                    return;
                }
                startSpeechRecognition();
            });
        }

        @JavascriptInterface
        public void stopListening() {
            stopSpeechRecognition();
        }

        @JavascriptInterface
        public String parseTransaction(String text) {
            AssistantVoiceParser.Result result = AssistantVoiceParser.parse(text);
            return result.toJsonString();
        }

        @JavascriptInterface
        public void saveTransaction(String jsonString) {
            try {
                JSONObject tx = new JSONObject(jsonString);

                JSONObject notifObj = new JSONObject();
                notifObj.put("packageName", "com.redilah.financetracker.assistant");
                notifObj.put("appLabel", "Cassiel Assistant");

                String type = tx.optString("type", "expense");
                long amount = tx.optLong("amount", 0);
                String category = tx.optString("category", "Food");
                String categoryId = tx.optString("categoryId", "food");
                String account = tx.optString("account", "Cash");
                String note = tx.optString("note", category);
                String formattedAmount = tx.optString("formattedAmount", "Rp 0");

                String titleText = type.equals("income")
                    ? "Pemasukan " + formattedAmount + " berhasil diterima"
                    : "Pembayaran " + formattedAmount + " berhasil";
                String bodyText = note + " • " + account;

                notifObj.put("title", titleText);
                notifObj.put("text", bodyText);
                notifObj.put("bigText", bodyText);
                notifObj.put("postTime", System.currentTimeMillis());
                notifObj.put("receivedAt", System.currentTimeMillis());

                notifObj.put("assistantDirect", true);
                notifObj.put("txType", type);
                notifObj.put("txAmount", amount);
                notifObj.put("txCategory", category);
                notifObj.put("txCategoryId", categoryId);
                notifObj.put("txAccount", account);
                notifObj.put("txNote", note);
                notifObj.put("txInputMethod", "assistant");

                SharedPreferences prefs = getContext().getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
                synchronized (CassielVoiceInteractionSession.class) {
                    String queueStr = prefs.getString(KEY_QUEUE, "[]");
                    JSONArray queue;
                    try {
                        queue = new JSONArray(queueStr);
                    } catch (Exception e) {
                        queue = new JSONArray();
                    }
                    queue.put(notifObj);

                    if (queue.length() > MAX_QUEUE_SIZE) {
                        JSONArray newQueue = new JSONArray();
                        int start = queue.length() - MAX_QUEUE_SIZE;
                        for (int i = start; i < queue.length(); i++) {
                            newQueue.put(queue.getJSONObject(i));
                        }
                        queue = newQueue;
                    }
                    prefs.edit().putString(KEY_QUEUE, queue.toString()).apply();
                }

                showConfirmationNotification(account, note, formattedAmount);
                Log.d(TAG, "Transaction saved to queue from VoiceSession: " + notifObj.toString());

            } catch (Exception e) {
                Log.e(TAG, "Failed to save transaction", e);
            }
        }

        @JavascriptInterface
        public void closeAssistant() {
            mainHandler.post(() -> {
                hide();
                finish();
            });
        }
    }

    private class SessionRecognitionListener implements RecognitionListener {
        @Override
        public void onReadyForSpeech(Bundle params) {
            callJs("onSpeechReady()");
        }

        @Override
        public void onBeginningOfSpeech() {}

        @Override
        public void onRmsChanged(float rmsdB) {
            callJs("onSpeechRms(" + rmsdB + ")");
        }

        @Override
        public void onBufferReceived(byte[] buffer) {}

        @Override
        public void onEndOfSpeech() {
            isListening = false;
            callJs("onSpeechEndOfSpeech()");
        }

        @Override
        public void onError(int error) {
            isListening = false;
            String msg;
            switch (error) {
                case SpeechRecognizer.ERROR_NO_MATCH:
                case SpeechRecognizer.ERROR_SPEECH_TIMEOUT:
                    msg = "Tidak mendeteksi ucapan. Coba lagi.";
                    break;
                case SpeechRecognizer.ERROR_AUDIO:
                    msg = "Error audio mikrofon.";
                    break;
                case SpeechRecognizer.ERROR_NETWORK:
                case SpeechRecognizer.ERROR_NETWORK_TIMEOUT:
                    msg = "Koneksi internet diperlukan untuk pengenalan suara.";
                    break;
                default:
                    msg = "Error pengenalan suara (kode: " + error + ")";
            }
            callJs("onSpeechError('" + escapeJs(msg) + "')");
        }

        @Override
        public void onResults(Bundle results) {
            isListening = false;
            ArrayList<String> matches = results.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION);
            if (matches != null && !matches.isEmpty()) {
                callJs("onSpeechResult('" + escapeJs(matches.get(0)) + "')");
            } else {
                callJs("onSpeechError('Tidak ada hasil pengenalan suara')");
            }
        }

        @Override
        public void onPartialResults(Bundle partialResults) {
            ArrayList<String> partials = partialResults.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION);
            if (partials != null && !partials.isEmpty()) {
                callJs("onSpeechPartial('" + escapeJs(partials.get(0)) + "')");
            }
        }

        @Override
        public void onEvent(int eventType, Bundle params) {}
    }
}
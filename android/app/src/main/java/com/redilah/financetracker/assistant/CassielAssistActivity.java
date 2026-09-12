 package com.redilah.financetracker.assistant;
 
 import android.Manifest;
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
 import android.speech.RecognitionListener;
 import android.speech.RecognizerIntent;
 import android.speech.SpeechRecognizer;
 import android.util.Log;
 import android.view.View;
 import android.view.WindowManager;
 import android.webkit.JavascriptInterface;
 import android.webkit.WebChromeClient;
 import android.webkit.WebSettings;
 import android.webkit.WebView;
 import android.webkit.WebViewClient;
 
 import androidx.annotation.NonNull;
 import androidx.appcompat.app.AppCompatActivity;
 import androidx.core.app.ActivityCompat;
 import androidx.core.app.NotificationCompat;
 import androidx.core.content.ContextCompat;
 
 import com.redilah.financetracker.MainActivity;
 import com.redilah.financetracker.R;
 
 import org.json.JSONArray;
 import org.json.JSONObject;
 
 import java.text.DecimalFormat;
 import java.text.DecimalFormatSymbols;
 import java.util.ArrayList;
 import java.util.Locale;
 
 /**
  * Cassiel Digital Assistant — Floating Assist Activity
  *
  * Activity transparan yang muncul saat user memicu gesture Digital Assistant
  * (long-press Power / swipe sudut bawah). Menampilkan floating bottom sheet
  * berisi mini chat UI untuk input transaksi suara.
  *
  * Arsitektur:
  * - Activity transparan full-screen
  * - WebView memuat assistant.html (UI chat melayang)
  * - JavaScript bridge (CassielAssistBridge) untuk:
  *   - Speech Recognition via Android SpeechRecognizer
  *   - Transaction parsing via AssistantVoiceParser
  *   - Transaction save ke SharedPreferences queue
  *   - Notifikasi status bar konfirmasi
  *   - Dismiss activity
  */
 public class CassielAssistActivity extends AppCompatActivity {
 
     private static final String TAG = "CassielAssist";
     private static final int REQ_AUDIO_PERMISSION = 1001;
     private static final String CHANNEL_ID = "financial_notifications";
     private static final String PREFS_NAME = "CassielNotifTrackerPrefs";
     private static final String KEY_QUEUE = "cassiel_notif_tracker_queue";
     private static final int MAX_QUEUE_SIZE = 100;
 
     private WebView webView;
     private SpeechRecognizer speechRecognizer;
     private boolean isListening = false;
 
     @Override
     protected void onCreate(Bundle savedInstanceState) {
         super.onCreate(savedInstanceState);
 
         // Transparent window & lockscreen configuration
         getWindow().setBackgroundDrawableResource(android.R.color.transparent);
         if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
             setShowWhenLocked(true);
             setTurnScreenOn(true);
         } else {
             getWindow().addFlags(
                 WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED |
                 WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON
             );
         }
 
         getWindow().getDecorView().setSystemUiVisibility(
             View.SYSTEM_UI_FLAG_LAYOUT_STABLE | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
         );
 
         if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
             getWindow().setStatusBarColor(Color.TRANSPARENT);
             getWindow().setNavigationBarColor(Color.TRANSPARENT);
         }
 
         setContentView(R.layout.activity_assistant);
 
         webView = findViewById(R.id.assistant_webview);
         setupWebView();
 
         // Initialize speech recognizer
         if (SpeechRecognizer.isRecognitionAvailable(this)) {
             speechRecognizer = SpeechRecognizer.createSpeechRecognizer(this);
             speechRecognizer.setRecognitionListener(new AssistantRecognitionListener());
         }
 
         // Ensure notification channel exists
         createNotificationChannel();
     }
 
     private void setupWebView() {
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
         webView.addJavascriptInterface(new CassielAssistBridge(), "CassielAssistBridge");
 
         webView.setWebViewClient(new WebViewClient() {
             @Override
             public void onPageFinished(WebView view, String url) {
                 super.onPageFinished(view, url);
                 // Notify web UI that bridge is ready
                 runOnUiThread(() -> webView.evaluateJavascript(
                     "if(typeof onBridgeReady==='function')onBridgeReady();", null));
             }
         });
 
         webView.setWebChromeClient(new WebChromeClient());
 
         // Load assistant HTML from assets
         webView.loadUrl("file:///android_asset/public/assistant.html");
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
             NotificationManager nm = getSystemService(NotificationManager.class);
             if (nm != null) {
                 nm.createNotificationChannel(channel);
             }
         }
     }
 
     // ─── JavaScript Bridge ───
 
     /**
      * JavaScript interface exposed to the assistant WebView as `CassielAssistBridge`.
      */
     public class CassielAssistBridge {
 
         /**
          * Start speech recognition.
          * Results are sent back via onSpeechResult(text) / onSpeechPartial(text).
          */
         @JavascriptInterface
         public void startListening() {
             runOnUiThread(() -> {
                 if (isListening) return;
 
                 // Check RECORD_AUDIO permission
                 if (ContextCompat.checkSelfPermission(CassielAssistActivity.this,
                         Manifest.permission.RECORD_AUDIO) != PackageManager.PERMISSION_GRANTED) {
                     ActivityCompat.requestPermissions(CassielAssistActivity.this,
                         new String[]{Manifest.permission.RECORD_AUDIO}, REQ_AUDIO_PERMISSION);
                     return;
                 }
 
                 startSpeechRecognition();
             });
         }
 
         /**
          * Stop speech recognition.
          */
         @JavascriptInterface
         public void stopListening() {
             runOnUiThread(() -> {
                 if (speechRecognizer != null && isListening) {
                     speechRecognizer.stopListening();
                     isListening = false;
                 }
             });
         }
 
         /**
          * Parse transaction text using AssistantVoiceParser.
          * @param text Speech-to-text result
          * @return JSON string with parsed transaction data
          */
         @JavascriptInterface
         public String parseTransaction(String text) {
             AssistantVoiceParser.Result result = AssistantVoiceParser.parse(text);
             return result.toJsonString();
         }
 
         /**
          * Save a transaction to SharedPreferences queue.
          * Existing NotificationTrackerPlugin will pick it up when Cassiel app opens.
          *
          * @param jsonString JSON transaction object with fields:
          *                   type, amount, category, categoryId, account, note
          */
         @JavascriptInterface
         public void saveTransaction(String jsonString) {
             try {
                 JSONObject tx = new JSONObject(jsonString);
 
                 // Build notification queue entry (same format as CassielNotificationListenerService)
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
 
                 // Format as recognizable transaction notification text
                 String titleText = type.equals("income")
                     ? "Pemasukan " + formattedAmount + " berhasil diterima"
                     : "Pembayaran " + formattedAmount + " berhasil";
                 String bodyText = note + " • " + account;
 
                 notifObj.put("title", titleText);
                 notifObj.put("text", bodyText);
                 notifObj.put("bigText", bodyText);
                 notifObj.put("postTime", System.currentTimeMillis());
                 notifObj.put("receivedAt", System.currentTimeMillis());
 
                 // Extra fields for direct transaction creation (bypass notification parsing)
                 notifObj.put("assistantDirect", true);
                 notifObj.put("txType", type);
                 notifObj.put("txAmount", amount);
                 notifObj.put("txCategory", category);
                 notifObj.put("txCategoryId", categoryId);
                 notifObj.put("txAccount", account);
                 notifObj.put("txNote", note);
                 notifObj.put("txInputMethod", "assistant");
 
                 // Save to SharedPreferences queue
                 SharedPreferences prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
                 synchronized (CassielAssistActivity.class) {
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
                 }
 
                 // Show status bar notification
                 showConfirmationNotification(account, note, formattedAmount);
 
                 Log.d(TAG, "Transaction saved to queue: " + notifObj.toString());
 
             } catch (Exception e) {
                 Log.e(TAG, "Failed to save transaction", e);
             }
         }
 
         /**
          * Close the assistant floating UI.
          */
         @JavascriptInterface
         public void closeAssistant() {
             runOnUiThread(() -> {
                 finishAndRemoveTask();
                 overridePendingTransition(0, android.R.anim.fade_out);
             });
         }
     }
 
     // ─── Speech Recognition ───
 
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
 
     private class AssistantRecognitionListener implements RecognitionListener {
         @Override
         public void onReadyForSpeech(Bundle params) {
             callJs("onSpeechReady()");
         }
 
         @Override
         public void onBeginningOfSpeech() {}
 
         @Override
         public void onRmsChanged(float rmsdB) {
             // Send volume level to animate mic
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
                     msg = "Tidak mendeteksi ucapan. Coba lagi.";
                     break;
                 case SpeechRecognizer.ERROR_AUDIO:
                     msg = "Error audio mikrofon.";
                     break;
                 case SpeechRecognizer.ERROR_NETWORK:
                 case SpeechRecognizer.ERROR_NETWORK_TIMEOUT:
                     msg = "Koneksi internet diperlukan untuk pengenalan suara.";
                     break;
                 case SpeechRecognizer.ERROR_SPEECH_TIMEOUT:
                     msg = "Tidak mendeteksi ucapan. Coba lagi.";
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
                 String text = matches.get(0);
                 callJs("onSpeechResult('" + escapeJs(text) + "')");
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
 
     // ─── Notification ───
 
     private void showConfirmationNotification(String account, String note, String formattedAmount) {
         try {
             String notifTitle = "Transaksi " + account + " Berhasil Dicatat";
             String notifBody = note + " • " + formattedAmount;
 
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
 
             NotificationManager nm = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
             if (nm != null) {
                 int notifId = (int) (System.currentTimeMillis() % Integer.MAX_VALUE);
                 nm.notify(notifId, builder.build());
             }
         } catch (Exception e) {
             Log.e(TAG, "Failed to show notification", e);
         }
     }
 
     // ─── Permission Callback ───
 
     @Override
     public void onRequestPermissionsResult(int requestCode, @NonNull String[] permissions, @NonNull int[] grantResults) {
         super.onRequestPermissionsResult(requestCode, permissions, grantResults);
         if (requestCode == REQ_AUDIO_PERMISSION) {
             if (grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
                 startSpeechRecognition();
             } else {
                 callJs("onSpeechError('Izin mikrofon diperlukan untuk pengenalan suara')");
             }
        }
    }

    private void callJs(String script) {
        runOnUiThread(() -> {
            if (webView != null) {
                webView.evaluateJavascript(script, null);
            }
        });
    }

    private String escapeJs(String str) {
        if (str == null) return "";
        return str.replace("\\", "\\\\").replace("'", "\\'").replace("\n", "\\n").replace("\r", "");
    }


    @Override
    protected void onDestroy() {
        if (speechRecognizer != null) {
            try {
                speechRecognizer.stopListening();
                speechRecognizer.cancel();
                speechRecognizer.destroy();
            } catch (Exception e) {
                Log.e(TAG, "Error destroying speech recognizer", e);
            }
            speechRecognizer = null;
        }
        if (webView != null) {
             webView.removeJavascriptInterface("CassielAssistBridge");
             webView.destroy();
         }
         super.onDestroy();
     }
 
     @Override
     protected void onNewIntent(Intent intent) {
         super.onNewIntent(intent);
         setIntent(intent);
         if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
             setShowWhenLocked(true);
             setTurnScreenOn(true);
         }
         if (webView != null) {
             webView.loadUrl("file:///android_asset/public/assistant.html");
         }
     }
 
     @Override
     public void onBackPressed() {
         finishAndRemoveTask();
         overridePendingTransition(0, android.R.anim.fade_out);
     }
 }
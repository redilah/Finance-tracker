package com.redilah.financetracker.widget;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.widget.RemoteViews;
import android.widget.Toast;
import com.redilah.financetracker.MainActivity;
import com.redilah.financetracker.R;
import org.json.JSONArray;
import org.json.JSONObject;
import java.text.DecimalFormat;
import java.text.DecimalFormatSymbols;
import java.util.Calendar;
import java.util.Locale;

public class CassielSmallWidgetProvider extends AppWidgetProvider {

    public static final String ACTION_REFRESH_WIDGET = "com.redilah.financetracker.widget.ACTION_REFRESH";

    @Override
    public void onReceive(Context context, Intent intent) {
        super.onReceive(context, intent);
        if (intent != null && ACTION_REFRESH_WIDGET.equals(intent.getAction())) {
            recalculateAndRefresh(context);
        }
    }

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        for (int appWidgetId : appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId);
        }
    }

    public static void updateAppWidget(Context context, AppWidgetManager appWidgetManager, int appWidgetId) {
        SharedPreferences prefs = context.getSharedPreferences("CassielWidgetPrefs", Context.MODE_PRIVATE);
        String todayExpense = prefs.getString("todayExpenseAmount", "Rp 0");

        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_cassiel_small);
        views.setTextViewText(R.id.tv_small_amount, todayExpense);

        // Tap Left / Background -> Open Main App
        Intent openAppIntent = new Intent(context, MainActivity.class);
        openAppIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent piApp = PendingIntent.getActivity(
                context, 101, openAppIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
        views.setOnClickPendingIntent(R.id.widget_small_root, piApp);

        // Tap Refresh Button (Top Right) -> Recalculate and Refresh Widget Data
        Intent refreshIntent = new Intent(context, CassielSmallWidgetProvider.class);
        refreshIntent.setAction(ACTION_REFRESH_WIDGET);
        PendingIntent piRefresh = PendingIntent.getBroadcast(
                context, 103, refreshIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
        views.setOnClickPendingIntent(R.id.btn_small_refresh, piRefresh);

        // Tap CF Logo Button -> Open Floating Quick Access Assistant on Home Screen
        Intent assistIntent = new Intent(context, com.redilah.financetracker.assistant.CassielAssistActivity.class);
        assistIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        PendingIntent piAssist = PendingIntent.getActivity(
                context, 102, assistIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
        views.setOnClickPendingIntent(R.id.btn_small_cf_assistant, piAssist);

        appWidgetManager.updateAppWidget(appWidgetId, views);
    }

    public static void recalculateAndRefresh(Context context) {
        try {
            SharedPreferences widgetPrefs = context.getSharedPreferences("CassielWidgetPrefs", Context.MODE_PRIVATE);
            SharedPreferences notifPrefs = context.getSharedPreferences("CassielNotifTrackerPrefs", Context.MODE_PRIVATE);

            Calendar calNow = Calendar.getInstance();
            int nowYear = calNow.get(Calendar.YEAR);
            int nowMonth = calNow.get(Calendar.MONTH) + 1;
            int nowDay = calNow.get(Calendar.DAY_OF_MONTH);
            int nowDayOfYear = calNow.get(Calendar.DAY_OF_YEAR);
            String todayDateKey = String.format(Locale.US, "%d-%d-%d", nowYear, nowMonth, nowDay);
            String todayDateKeyPadded = String.format(Locale.US, "%04d-%02d-%02d", nowYear, nowMonth, nowDay);

            // 1. Get base today expense from widgetPrefs safely
            long baseTodayExpense = 0;
            try {
                baseTodayExpense = widgetPrefs.getLong("todayExpenseRaw", 0L);
            } catch (Exception ex) {
                try {
                    baseTodayExpense = widgetPrefs.getInt("todayExpenseRaw", 0);
                } catch (Exception ignored) {}
            }
            String existingAmountStr = widgetPrefs.getString("todayExpenseAmount", "Rp 0");
            String lastSyncedDate = widgetPrefs.getString("syncedDate", "");

            // Check if date genuinely rolled over to a new day
            boolean isNewDay = false;
            if (lastSyncedDate != null && !lastSyncedDate.isEmpty()) {
                if (!lastSyncedDate.equals(todayDateKey) && !lastSyncedDate.equals(todayDateKeyPadded)) {
                    try {
                        String[] parts = lastSyncedDate.split("-");
                        if (parts.length >= 3) {
                            int y = Integer.parseInt(parts[0]);
                            int m = Integer.parseInt(parts[1]);
                            int d = Integer.parseInt(parts[2]);
                            if (y != nowYear || m != nowMonth || d != nowDay) {
                                isNewDay = true;
                            }
                        }
                    } catch (Exception ignored) {
                        isNewDay = false;
                    }
                }
            }

            if (isNewDay) {
                baseTodayExpense = 0;
            } else {
                // Anti-Wipeout Fallback: If baseTodayExpense is 0 but existing string has valid numbers (e.g., "Rp 50.000"), extract it!
                if (baseTodayExpense <= 0 && existingAmountStr != null && !existingAmountStr.trim().isEmpty() && !existingAmountStr.equals("Rp 0")) {
                    try {
                        String digits = existingAmountStr.replaceAll("[^0-9]", "");
                        if (!digits.isEmpty()) {
                            baseTodayExpense = Long.parseLong(digits);
                        }
                    } catch (Exception ignored) {}
                }
            }

            // 2. Check pending queue in CassielNotifTrackerPrefs for un-synced today transactions
            String queueStr = notifPrefs.getString("cassiel_notif_tracker_queue", "[]");
            long queueTodayExpense = 0;
            try {
                JSONArray queue = new JSONArray(queueStr);
                for (int i = 0; i < queue.length(); i++) {
                    JSONObject obj = queue.getJSONObject(i);
                    long postTime = obj.optLong("postTime", System.currentTimeMillis());
                    Calendar calTx = Calendar.getInstance();
                    calTx.setTimeInMillis(postTime);

                    if (calTx.get(Calendar.YEAR) == nowYear && calTx.get(Calendar.DAY_OF_YEAR) == nowDayOfYear) {
                        String txType = obj.optString("txType", "expense");
                        if ("expense".equalsIgnoreCase(txType)) {
                            queueTodayExpense += obj.optLong("txAmount", 0);
                        }
                    }
                }
            } catch (Exception ignored) {}

            long totalToday = baseTodayExpense + queueTodayExpense;
            String formatted;
            if (totalToday > 0) {
                DecimalFormatSymbols symbols = new DecimalFormatSymbols(new Locale("id", "ID"));
                symbols.setGroupingSeparator('.');
                DecimalFormat df = new DecimalFormat("#,###", symbols);
                formatted = "Rp " + df.format(totalToday);
            } else if (isNewDay) {
                formatted = "Rp 0";
            } else if (existingAmountStr != null && !existingAmountStr.trim().isEmpty() && !existingAmountStr.equals("Rp 0")) {
                formatted = existingAmountStr;
            } else {
                formatted = "Rp 0";
            }

            widgetPrefs.edit()
                    .putLong("todayExpenseRaw", totalToday)
                    .putString("todayExpenseAmount", formatted)
                    .putString("syncedDate", todayDateKeyPadded)
                    .apply();

            updateAllWidgets(context);
            CassielMediumWidgetProvider.updateAllWidgets(context);
            Toast.makeText(context, "Widget Cassiel Diperbarui ✨", Toast.LENGTH_SHORT).show();
        } catch (Exception e) {
            updateAllWidgets(context);
        }
    }

    public static void updateAllWidgets(Context context) {
        AppWidgetManager appWidgetManager = AppWidgetManager.getInstance(context);
        ComponentName componentName = new ComponentName(context, CassielSmallWidgetProvider.class);
        int[] ids = appWidgetManager.getAppWidgetIds(componentName);
        for (int id : ids) {
            updateAppWidget(context, appWidgetManager, id);
        }
    }
}

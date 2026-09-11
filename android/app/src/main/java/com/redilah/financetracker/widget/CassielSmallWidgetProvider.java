package com.redilah.financetracker.widget;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.Color;
import android.widget.RemoteViews;
import com.redilah.financetracker.MainActivity;
import com.redilah.financetracker.R;

public class CassielSmallWidgetProvider extends AppWidgetProvider {

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

    public static void updateAllWidgets(Context context) {
        AppWidgetManager appWidgetManager = AppWidgetManager.getInstance(context);
        ComponentName componentName = new ComponentName(context, CassielSmallWidgetProvider.class);
        int[] ids = appWidgetManager.getAppWidgetIds(componentName);
        for (int id : ids) {
            updateAppWidget(context, appWidgetManager, id);
        }
    }
}

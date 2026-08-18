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
        String dailyAmount = prefs.getString("dailySafeBudget", "Rp 0");
        String dailyStatus = prefs.getString("dailyStatus", "Terkendali ✨");
        String statusColor = prefs.getString("statusColor", "#58B07A");

        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_cassiel_small);
        views.setTextViewText(R.id.tv_small_amount, dailyAmount);
        views.setTextViewText(R.id.tv_small_status, dailyStatus);

        try {
            views.setTextColor(R.id.tv_small_status, Color.parseColor(statusColor));
        } catch (Exception e) {
            views.setTextColor(R.id.tv_small_status, Color.parseColor("#58B07A"));
        }

        // Tap Background -> Open Budget
        Intent openAppIntent = new Intent(context, MainActivity.class);
        openAppIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        openAppIntent.putExtra("ACTION_TARGET", "OPEN_BUDGET");
        PendingIntent piApp = PendingIntent.getActivity(
                context, 101, openAppIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
        views.setOnClickPendingIntent(R.id.widget_small_root, piApp);

        // Tap Quick Add (+) Button -> Open Add Modal
        Intent addIntent = new Intent(context, MainActivity.class);
        addIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        addIntent.putExtra("ACTION_TARGET", "OPEN_ADD_MODAL");
        PendingIntent piAdd = PendingIntent.getActivity(
                context, 102, addIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
        views.setOnClickPendingIntent(R.id.btn_small_quick_add, piAdd);

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

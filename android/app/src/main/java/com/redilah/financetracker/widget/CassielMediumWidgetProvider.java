package com.redilah.financetracker.widget;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.widget.RemoteViews;
import com.redilah.financetracker.MainActivity;
import com.redilah.financetracker.R;

public class CassielMediumWidgetProvider extends AppWidgetProvider {

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        for (int appWidgetId : appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId);
        }
    }

    public static void updateAppWidget(Context context, AppWidgetManager appWidgetManager, int appWidgetId) {
        SharedPreferences prefs = context.getSharedPreferences("CassielWidgetPrefs", Context.MODE_PRIVATE);
        String monthlyRemaining = prefs.getString("monthlyRemaining", "Rp 0");
        String todayExpense = prefs.getString("todayExpense", "Hari ini: Rp 0");
        int budgetProgress = prefs.getInt("budgetProgress", 0);

        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_cassiel_medium);
        views.setTextViewText(R.id.tv_med_amount, monthlyRemaining);
        views.setTextViewText(R.id.tv_med_today_expense, todayExpense);
        views.setProgressBar(R.id.pb_med_progress, 100, budgetProgress, false);

        // Tap Background -> Open Budget
        Intent openBudgetIntent = new Intent(context, MainActivity.class);
        openBudgetIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        openBudgetIntent.putExtra("ACTION_TARGET", "OPEN_BUDGET");
        PendingIntent piBudget = PendingIntent.getActivity(
                context, 201, openBudgetIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
        views.setOnClickPendingIntent(R.id.widget_medium_root, piBudget);

        // 1. Action Voice AI Mic
        Intent voiceIntent = new Intent(context, MainActivity.class);
        voiceIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        voiceIntent.putExtra("ACTION_TARGET", "OPEN_VOICE");
        PendingIntent piVoice = PendingIntent.getActivity(
                context, 202, voiceIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
        views.setOnClickPendingIntent(R.id.btn_action_voice, piVoice);

        // 2. Action Quick Add (+)
        Intent addIntent = new Intent(context, MainActivity.class);
        addIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        addIntent.putExtra("ACTION_TARGET", "OPEN_ADD_MODAL");
        PendingIntent piAdd = PendingIntent.getActivity(
                context, 203, addIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
        views.setOnClickPendingIntent(R.id.btn_action_add, piAdd);

        // 3. Action Stats
        Intent statsIntent = new Intent(context, MainActivity.class);
        statsIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        statsIntent.putExtra("ACTION_TARGET", "OPEN_STATS");
        PendingIntent piStats = PendingIntent.getActivity(
                context, 204, statsIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
        views.setOnClickPendingIntent(R.id.btn_action_stats, piStats);

        appWidgetManager.updateAppWidget(appWidgetId, views);
    }

    public static void updateAllWidgets(Context context) {
        AppWidgetManager appWidgetManager = AppWidgetManager.getInstance(context);
        ComponentName componentName = new ComponentName(context, CassielMediumWidgetProvider.class);
        int[] ids = appWidgetManager.getAppWidgetIds(componentName);
        for (int id : ids) {
            updateAppWidget(context, appWidgetManager, id);
        }
    }
}

package com.redilah.financetracker.widget;

import android.content.Context;
import android.content.SharedPreferences;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "WidgetBridge")
public class WidgetBridgePlugin extends Plugin {

    @PluginMethod
    public void updateWidgetData(PluginCall call) {
        String dailySafeBudget = call.getString("dailySafeBudget", "Rp 0");
        String dailyStatus = call.getString("dailyStatus", "Terkendali ✨");
        String statusColor = call.getString("statusColor", "#58B07A");
        String monthlyRemaining = call.getString("monthlyRemaining", "Rp 0");
        String todayExpense = call.getString("todayExpense", "Hari ini: Rp 0");
        String todayExpenseAmount = call.getString("todayExpenseAmount", "Rp 0");
        
        // Safely extract todayExpenseRaw as long (handles Integer/Double/Long from JSON)
        Object rawObj = call.getData().opt("todayExpenseRaw");
        long todayExpenseRaw = 0L;
        if (rawObj instanceof Number) {
            todayExpenseRaw = ((Number) rawObj).longValue();
        } else if (rawObj != null) {
            try {
                todayExpenseRaw = Long.parseLong(rawObj.toString().replaceAll("[^0-9]", ""));
            } catch (Exception ignored) {}
        }

        String syncedDate = call.getString("syncedDate", "");

        // Safely extract budgetProgress as int
        Object bpObj = call.getData().opt("budgetProgress");
        int budgetProgress = 0;
        if (bpObj instanceof Number) {
            budgetProgress = ((Number) bpObj).intValue();
        }

        Context context = getContext();
        SharedPreferences prefs = context.getSharedPreferences("CassielWidgetPrefs", Context.MODE_PRIVATE);
        prefs.edit()
                .putString("dailySafeBudget", dailySafeBudget)
                .putString("dailyStatus", dailyStatus)
                .putString("statusColor", statusColor)
                .putString("monthlyRemaining", monthlyRemaining)
                .putString("todayExpense", todayExpense)
                .putString("todayExpenseAmount", todayExpenseAmount)
                .putLong("todayExpenseRaw", todayExpenseRaw)
                .putString("syncedDate", syncedDate)
                .putInt("budgetProgress", budgetProgress)
                .apply();

        // Broadcast updates to 2x2 widget immediately and ensure midnight reset is scheduled
        CassielSmallWidgetProvider.updateAllWidgets(context);
        CassielSmallWidgetProvider.scheduleMidnightReset(context);

        call.resolve();
    }
}

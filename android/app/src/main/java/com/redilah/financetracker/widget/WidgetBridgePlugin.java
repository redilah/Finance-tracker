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
        Integer budgetProgress = call.getInt("budgetProgress", 0);

        Context context = getContext();
        SharedPreferences prefs = context.getSharedPreferences("CassielWidgetPrefs", Context.MODE_PRIVATE);
        prefs.edit()
                .putString("dailySafeBudget", dailySafeBudget)
                .putString("dailyStatus", dailyStatus)
                .putString("statusColor", statusColor)
                .putString("monthlyRemaining", monthlyRemaining)
                .putString("todayExpense", todayExpense)
                .putInt("budgetProgress", budgetProgress != null ? budgetProgress : 0)
                .apply();

        // Broadcast updates to all widgets immediately
        CassielSmallWidgetProvider.updateAllWidgets(context);
        CassielMediumWidgetProvider.updateAllWidgets(context);

        call.resolve();
    }
}

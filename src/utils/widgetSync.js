import { registerPlugin, Capacitor } from '@capacitor/core';
import { formatMoney } from './currency';

const WidgetBridge = registerPlugin('WidgetBridge');

/**
 * Synchronize current financial snapshot to Android Native SharedPreferences
 * so Home Screen Widgets (2x2 & 4x2) update immediately.
 */
export async function syncWidgetData({
  transactions = [],
  categories = [],
  currency = 'IDR'
}) {
  if (!Capacitor.isNativePlatform()) return;

  try {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const todayDateStr = now.toISOString().split('T')[0];
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const remainingDays = Math.max(1, daysInMonth - now.getDate() + 1);

    // 1. Calculate Total Monthly Budget Limit
    let totalMonthlyLimit = 0;
    categories.forEach(cat => {
      if (cat.monthlyLimit && cat.monthlyLimit > 0) {
        totalMonthlyLimit += Number(cat.monthlyLimit);
      }
    });

    // 2. Calculate Monthly Expenses & Today's Expenses
    let monthlyExpenses = 0;
    let todayExpenses = 0;

    transactions.forEach(tx => {
      if (tx.type === 'Expense' || tx.type === 'expense') {
        const txDate = new Date(tx.date || tx.createdAt);
        if (txDate.getFullYear() === currentYear && txDate.getMonth() === currentMonth) {
          monthlyExpenses += Number(tx.amount || 0);
        }
        const txDateStr = (tx.date || '').split('T')[0];
        if (txDateStr === todayDateStr) {
          todayExpenses += Number(tx.amount || 0);
        }
      }
    });

    // 3. Compute Remaining Monthly & Daily Safe-to-Spend
    let remainingMonthly = totalMonthlyLimit > 0 ? Math.max(0, totalMonthlyLimit - monthlyExpenses) : Math.max(0, 5000000 - monthlyExpenses);
    let budgetProgress = totalMonthlyLimit > 0 ? Math.min(100, Math.round((monthlyExpenses / totalMonthlyLimit) * 100)) : 0;
    
    // Daily safe budget calculation (Pacing)
    let dailySafeBudgetVal = Math.round(remainingMonthly / remainingDays);
    if (totalMonthlyLimit === 0 && monthlyExpenses === 0) {
      dailySafeBudgetVal = 100000;
    }

    // Determine status & emotional validation
    let dailyStatus = 'Terkendali ✨';
    let statusColor = '#58B07A'; // Green

    if (totalMonthlyLimit > 0) {
      if (budgetProgress >= 100) {
        dailyStatus = 'Overbudget ⚠️';
        statusColor = '#D94141'; // Red
      } else if (budgetProgress >= 80) {
        dailyStatus = 'Waspada ⚡';
        statusColor = '#EAB308'; // Amber
      } else if (todayExpenses > dailySafeBudgetVal) {
        dailyStatus = 'Melebihi Jatah ⚠️';
        statusColor = '#D94141';
      }
    }

    const payload = {
      dailySafeBudget: formatMoney(dailySafeBudgetVal, currency),
      dailyStatus,
      statusColor,
      monthlyRemaining: formatMoney(remainingMonthly, currency),
      todayExpense: `Hari ini: -${formatMoney(todayExpenses, currency)}`,
      budgetProgress
    };

    await WidgetBridge.updateWidgetData(payload);
  } catch (err) {
    console.warn('Widget sync skipped/failed:', err);
  }
}

/**
 * financialInsightEngine.js
 * Logic engine terpusat untuk analisis finansial Cassiel V1.
 * 
 * Fungsi:
 * - generateFinancialInsights({ transactions, monthlyBudgetsMap, currentDate, allBudgetCategories, appLanguage, fmtMoney, getCategoryName })
 * - getHighestPriorityInsight(...)
 */

import { formatRupiah, getLastDayOfMonth } from './categoryInsightEngine.js';
import { MONTH_SHORT_I18N, MONTH_NAMES_I18N } from './i18n.js';

/**
 * Helper untuk memformat rentang hari aktif bulan ini
 * Contoh: "1-26 Agu 2026"
 */
export const formatActivePeriodRange = (currentDate, allTransactions = [], appLanguage = 'id') => {
  const targetYear = currentDate.getFullYear();
  const targetMonth = currentDate.getMonth(); // 0-indexed
  const now = new Date();
  
  const monthShortList = MONTH_SHORT_I18N[appLanguage] || MONTH_SHORT_I18N.id || ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  const monthLabel = monthShortList[targetMonth] || 'Bulan';

  const isCurrentActiveMonth = targetYear === now.getFullYear() && targetMonth === now.getMonth();
  
  // Transaksi pengeluaran bulan ini
  const monthTxs = allTransactions.filter(t => {
    if (!t.date) return false;
    const [y, m] = t.date.split('-');
    return Number(y) === targetYear && Number(m) === (targetMonth + 1) && t.type === 'expense';
  });

  if (monthTxs.length === 0) {
    if (isCurrentActiveMonth) {
      return `1-${now.getDate()} ${monthLabel} ${targetYear}`;
    }
    const lastDay = getLastDayOfMonth(targetYear, targetMonth);
    return `1-${lastDay} ${monthLabel} ${targetYear}`;
  }

  // Cari tanggal transaksi terkecil dan terbesar
  const dayNumbers = monthTxs.map(t => {
    const parts = t.date.split('-');
    return parseInt(parts[2], 10);
  }).filter(d => !isNaN(d) && d > 0);

  const minDay = dayNumbers.length > 0 ? Math.min(...dayNumbers) : 1;
  const maxDay = isCurrentActiveMonth ? Math.max(now.getDate(), ...(dayNumbers.length > 0 ? dayNumbers : [1])) : (dayNumbers.length > 0 ? Math.max(...dayNumbers) : getLastDayOfMonth(targetYear, targetMonth));

  if (minDay === maxDay) {
    return `${minDay} ${monthLabel} ${targetYear}`;
  }
  return `${minDay}-${maxDay} ${monthLabel} ${targetYear}`;
};

/**
 * Mesin Analisis Finansial Terpusat (V1)
 */
export const generateFinancialInsights = ({
  transactions = [],
  monthlyBudgetsMap = {},
  currentDate = new Date(),
  allBudgetCategories = [],
  appLanguage = 'id',
  fmtMoney = null,
  getCategoryName = null
}) => {
  const targetYear = currentDate.getFullYear();
  const targetMonth = currentDate.getMonth(); // 0-indexed (0 = Jan)
  
  const formatAmt = (amt) => (fmtMoney ? fmtMoney(amt) : formatRupiah(amt));
  const resolveCatName = (cat) => {
    if (getCategoryName) return getCategoryName(cat, appLanguage);
    if (typeof cat === 'string') return cat;
    return cat.name || cat.category || 'Kategori';
  };

  const monthKey = `${targetYear}-${String(targetMonth + 1).padStart(2, '0')}`;
  
  // Previous month calculation
  const prevDate = new Date(targetYear, targetMonth - 1, 1);
  const prevYear = prevDate.getFullYear();
  const prevMonth = prevDate.getMonth();
  const prevMonthKey = `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}`;

  // 1. Filter current & prev expenses
  const currentMonthExpensesTxs = transactions.filter(t => {
    if (!t.date) return false;
    const [y, m] = t.date.split('-');
    return Number(y) === targetYear && Number(m) === (targetMonth + 1) && t.type === 'expense';
  });

  const prevMonthExpensesTxs = transactions.filter(t => {
    if (!t.date) return false;
    const [y, m] = t.date.split('-');
    return Number(y) === prevYear && Number(m) === (prevMonth + 1) && t.type === 'expense';
  });

  const totalCurrentExpense = currentMonthExpensesTxs.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  const totalPrevExpense = prevMonthExpensesTxs.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  // Current month budget data
  const currentMonthBudgetObj = monthlyBudgetsMap[monthKey] || { main: null, categories: {} };
  const mainBudget = (typeof currentMonthBudgetObj.main === 'number' && currentMonthBudgetObj.main > 0) ? currentMonthBudgetObj.main : null;
  const categoryBudgets = currentMonthBudgetObj.categories || {};

  // Group current expenses by category (handling categoryId & category name mapping)
  const categorySpending = {}; // { catKey: { id, name, amount, count, txs: [] } }
  currentMonthExpensesTxs.forEach(t => {
    const rawId = t.categoryId || (t.category ? t.category.toLowerCase().replace(/\s+/g, '') : 'other');
    const catName = t.category || t.categoryId || 'Other';
    if (!categorySpending[rawId]) {
      categorySpending[rawId] = {
        id: rawId,
        categoryId: t.categoryId || rawId,
        name: catName,
        amount: 0,
        count: 0,
        txs: []
      };
    }
    categorySpending[rawId].amount += (Number(t.amount) || 0);
    categorySpending[rawId].count += 1;
    categorySpending[rawId].txs.push(t);
  });

  // Group prev expenses by category
  const prevCategorySpending = {};
  prevMonthExpensesTxs.forEach(t => {
    const rawId = t.categoryId || (t.category ? t.category.toLowerCase().replace(/\s+/g, '') : 'other');
    if (!prevCategorySpending[rawId]) {
      prevCategorySpending[rawId] = {
        id: rawId,
        amount: 0,
        count: 0
      };
    }
    prevCategorySpending[rawId].amount += (Number(t.amount) || 0);
    prevCategorySpending[rawId].count += 1;
  });

  const sortedCategories = Object.values(categorySpending).sort((a, b) => b.amount - a.amount);
  const topCategory = sortedCategories.length > 0 ? sortedCategories[0] : null;

  // Array untuk mengumpulkan kandidat insight dengan bobot prioritas
  const insightCandidates = [];

  // =========================================================================
  // PRIORITY 1: Significant Anomaly / Perubahan Besar Total Bulanan (MoM)
  // Bobot: 90 - 100
  // =========================================================================
  if (totalPrevExpense > 0 && totalCurrentExpense > 0) {
    const totalDiff = totalCurrentExpense - totalPrevExpense;
    const totalDiffPct = Math.round((Math.abs(totalDiff) / totalPrevExpense) * 100);

    if (totalDiff > 0 && totalDiffPct >= 20) {
      // Pengeluaran melonjak naik
      const dominantCause = topCategory ? resolveCatName(topCategory.name) : '';
      insightCandidates.push({
        id: `anomaly_surge_${topCategory?.categoryId || 'total'}_${totalDiffPct}`,
        type: 'anomaly_surge',
        priority: 95 + Math.min(totalDiffPct / 10, 5), // 95 - 100
        headline: appLanguage === 'en' 
          ? `Your spending is ${totalDiffPct}% higher than last month.`
          : `Pengeluaranmu ${totalDiffPct}% lebih tinggi dibanding bulan lalu.`,
        highlightPercent: `${totalDiffPct}%`,
        subDescription: dominantCause 
          ? (appLanguage === 'en' ? `Main contributor: ${dominantCause} category.` : `Penyebab terbesar: kategori ${dominantCause}.`)
          : (appLanguage === 'en' ? `Total spending increased by ${formatAmt(totalDiff)}.` : `Total pengeluaran bertambah ${formatAmt(totalDiff)}.`),
        category: topCategory?.name || null,
        categoryId: topCategory?.categoryId || null,
        value: totalCurrentExpense,
        comparison: {
          type: 'mom_up',
          diffAmount: totalDiff,
          percentage: totalDiffPct,
          prevAmount: totalPrevExpense
        }
      });
    } else if (totalDiff < 0 && totalDiffPct >= 20) {
      // Pengeluaran jauh lebih hemat
      insightCandidates.push({
        id: `anomaly_saving_${totalDiffPct}`,
        type: 'anomaly_saving',
        priority: 88,
        headline: appLanguage === 'en'
          ? `Great job! Your spending is ${totalDiffPct}% lower than last month.`
          : `Luar biasa! Pengeluaranmu ${totalDiffPct}% lebih hemat dibanding bulan lalu.`,
        highlightPercent: `${totalDiffPct}%`,
        subDescription: appLanguage === 'en'
          ? `You saved ${formatAmt(Math.abs(totalDiff))} compared to last month.`
          : `Kamu berhasil menghemat ${formatAmt(Math.abs(totalDiff))} dibanding bulan lalu.`,
        category: topCategory?.name || null,
        categoryId: topCategory?.categoryId || null,
        value: totalCurrentExpense,
        comparison: {
          type: 'mom_down',
          diffAmount: Math.abs(totalDiff),
          percentage: totalDiffPct,
          prevAmount: totalPrevExpense
        }
      });
    }
  }

  // =========================================================================
  // PRIORITY 2: Dominasi Kategori Ekstrem (Dominant Spending Category)
  // Bobot: 80 - 92
  // Contoh: "84% pengeluaranmu bulan ini berasal dari Party."
  // =========================================================================
  if (topCategory && totalCurrentExpense > 0) {
    const dominantPct = Math.round((topCategory.amount / totalCurrentExpense) * 100);
    const topCatName = resolveCatName(topCategory.name);

    if (dominantPct >= 40) {
      insightCandidates.push({
        id: `dominant_category_${topCategory.categoryId || topCategory.id}_${dominantPct}`,
        type: 'dominant_category',
        priority: 85 + (dominantPct >= 70 ? 7 : 0), // 85 - 92
        headline: appLanguage === 'en'
          ? `${dominantPct}% of your spending this month comes from ${topCatName}.`
          : `${dominantPct}% pengeluaranmu bulan ini berasal dari ${topCatName}.`,
        highlightPercent: `${dominantPct}%`,
        subDescription: appLanguage === 'en'
          ? `Total spent: ${formatAmt(topCategory.amount)} across ${topCategory.count} transaction(s).`
          : `Total belanja ${formatAmt(topCategory.amount)} dari ${topCategory.count} transaksi.`,
        category: topCategory.name,
        categoryId: topCategory.categoryId,
        value: topCategory.amount,
        percentage: dominantPct,
        comparison: {
          type: 'share',
          sharePercentage: dominantPct
        }
      });
    }
  }

  // =========================================================================
  // PRIORITY 3: Budget Over / Under Usage
  // Bobot: 75 - 94
  // Contoh: "Party sudah mencapai 408% dari budget."
  // =========================================================================
  sortedCategories.forEach(cat => {
    const catBudget = categoryBudgets[cat.id] || categoryBudgets[cat.categoryId];
    if (typeof catBudget === 'number' && catBudget > 0) {
      const budgetPct = Math.round((cat.amount / catBudget) * 100);
      const catName = resolveCatName(cat.name);

      if (budgetPct >= 100) {
        insightCandidates.push({
          id: `category_overbudget_${cat.categoryId || cat.id}_${budgetPct}`,
          type: 'category_overbudget',
          priority: 80 + Math.min(budgetPct / 50, 14), // 80 - 94
          headline: appLanguage === 'en'
            ? `${catName} has reached ${budgetPct}% of its allocated budget.`
            : `${catName} sudah mencapai ${budgetPct}% dari budget.`,
          highlightPercent: `${budgetPct}%`,
          subDescription: appLanguage === 'en'
            ? `Spent ${formatAmt(cat.amount)} of ${formatAmt(catBudget)} budget limit.`
            : `Terpakai ${formatAmt(cat.amount)} dari batas ${formatAmt(catBudget)}.`,
          category: cat.name,
          categoryId: cat.categoryId,
          value: cat.amount,
          budgetAmount: catBudget,
          budgetPercent: budgetPct,
          comparison: {
            type: 'budget_over',
            budgetAmount: catBudget,
            percentage: budgetPct
          }
        });
      }
    }
  });

  // Check main total budget if set
  if (mainBudget && totalCurrentExpense > 0) {
    const mainSpentPct = Math.round((totalCurrentExpense / mainBudget) * 100);
    if (mainSpentPct >= 100) {
      insightCandidates.push({
        id: `main_overbudget_${mainSpentPct}`,
        type: 'main_overbudget',
        priority: 91,
        headline: appLanguage === 'en'
          ? `Total spending has reached ${mainSpentPct}% of your monthly budget.`
          : `Total pengeluaran sudah mencapai ${mainSpentPct}% dari target budget bulanan.`,
        highlightPercent: `${mainSpentPct}%`,
        subDescription: appLanguage === 'en'
          ? `Spent ${formatAmt(totalCurrentExpense)} of ${formatAmt(mainBudget)} total limit.`
          : `Terpakai ${formatAmt(totalCurrentExpense)} dari limit total ${formatAmt(mainBudget)}.`,
        category: null,
        categoryId: null,
        value: totalCurrentExpense,
        budgetAmount: mainBudget,
        budgetPercent: mainSpentPct,
        comparison: {
          type: 'main_budget_over',
          budgetAmount: mainBudget,
          percentage: mainSpentPct
        }
      });
    }
  }

  // =========================================================================
  // PRIORITY 4: Category Trend / Spike (MoM Category Change)
  // Bobot: 65 - 78
  // Contoh: "Food naik 28% dibanding bulan lalu."
  // =========================================================================
  sortedCategories.forEach(cat => {
    const prevCat = prevCategorySpending[cat.id] || prevCategorySpending[cat.categoryId];
    if (prevCat && prevCat.amount > 0 && cat.amount > 0) {
      const catDiff = cat.amount - prevCat.amount;
      const catDiffPct = Math.round((Math.abs(catDiff) / prevCat.amount) * 100);
      const catName = resolveCatName(cat.name);

      if (catDiff > 0 && catDiffPct >= 20 && cat.amount >= 30000) {
        insightCandidates.push({
          id: `category_surge_${cat.categoryId || cat.id}_${catDiffPct}`,
          type: 'category_surge',
          priority: 70 + Math.min(catDiffPct / 10, 8), // 70 - 78
          headline: appLanguage === 'en'
            ? `${catName} increased by ${catDiffPct}% compared to last month.`
            : `${catName} naik ${catDiffPct}% dibanding bulan lalu.`,
          highlightPercent: `${catDiffPct}%`,
          subDescription: appLanguage === 'en'
            ? `Previous month: ${formatAmt(prevCat.amount)} → This month: ${formatAmt(cat.amount)}.`
            : `Bulan lalu ${formatAmt(prevCat.amount)} → Bulan ini ${formatAmt(cat.amount)}.`,
          category: cat.name,
          categoryId: cat.categoryId,
          value: cat.amount,
          comparison: {
            type: 'cat_mom_up',
            diffAmount: catDiff,
            percentage: catDiffPct,
            prevAmount: prevCat.amount
          }
        });
      }
    }
  });

  // =========================================================================
  // PRIORITY 5: Transaction Frequency & Spending Pattern
  // Bobot: 50 - 62
  // Contoh: "Food adalah kategori yang paling sering kamu gunakan."
  // =========================================================================
  const mostFrequentCat = [...sortedCategories].sort((a, b) => b.count - a.count)[0];
  if (mostFrequentCat && mostFrequentCat.count >= 3) {
    const freqCatName = resolveCatName(mostFrequentCat.name);
    insightCandidates.push({
      id: `category_frequency_${mostFrequentCat.categoryId || mostFrequentCat.id}_${mostFrequentCat.count}`,
      type: 'category_frequency',
      priority: 55,
      headline: appLanguage === 'en'
        ? `${freqCatName} is your most frequently used category.`
        : `${freqCatName} adalah kategori yang paling sering kamu gunakan.`,
      highlightPercent: `${mostFrequentCat.count}x`,
      subDescription: appLanguage === 'en'
        ? `Used ${mostFrequentCat.count} times this month, totaling ${formatAmt(mostFrequentCat.amount)}.`
        : `Dicatat ${mostFrequentCat.count} kali bulan ini dengan total ${formatAmt(mostFrequentCat.amount)}.`,
      category: mostFrequentCat.name,
      categoryId: mostFrequentCat.categoryId,
      value: mostFrequentCat.amount,
      count: mostFrequentCat.count,
      comparison: {
        type: 'frequency',
        count: mostFrequentCat.count
      }
    });
  }

  // =========================================================================
  // FALLBACK NETRAL (Jika belum ada insight kuat atau transaksi sedikit)
  // =========================================================================
  if (insightCandidates.length === 0) {
    if (totalCurrentExpense > 0 && topCategory) {
      const topCatName = resolveCatName(topCategory.name);
      const topPct = totalCurrentExpense > 0 ? Math.round((topCategory.amount / totalCurrentExpense) * 100) : 0;
      insightCandidates.push({
        id: `fallback_summary_${topCategory.categoryId || topCategory.id}_${topPct}`,
        type: 'fallback_summary',
        priority: 10,
        headline: appLanguage === 'en'
          ? `Top spending this month is in ${topCatName}.`
          : `Pengeluaran terbesar bulan ini tercatat di kategori ${topCatName}.`,
        highlightPercent: `${topPct}%`,
        subDescription: appLanguage === 'en'
          ? `Total ${formatAmt(topCategory.amount)} (${topPct}% of total spending).`
          : `Total ${formatAmt(topCategory.amount)} atau ${topPct}% dari total pengeluaran.`,
        category: topCategory.name,
        categoryId: topCategory.categoryId,
        value: topCategory.amount,
        percentage: topPct,
        comparison: {
          type: 'neutral_top',
          sharePercentage: topPct
        }
      });
    } else {
      // Belum ada transaksi sama sekali
      insightCandidates.push({
        id: 'empty_fallback',
        type: 'empty_fallback',
        priority: 1,
        headline: appLanguage === 'en'
          ? `No expenses recorded yet for this period.`
          : `Belum ada pengeluaran yang dicatat untuk periode ini.`,
        highlightPercent: `0%`,
        subDescription: appLanguage === 'en'
          ? `Start logging your expenses to see intelligent financial insights here.`
          : `Catat pengeluaranmu sekarang untuk melihat analisis keuangan otomatis di sini.`,
        category: null,
        categoryId: null,
        value: 0,
        comparison: null
      });
    }
  }

  // Sort candidates by priority descending
  insightCandidates.sort((a, b) => b.priority - a.priority);

  // Highest priority insight for Home
  const highestPriorityInsight = insightCandidates[0];

  // Quick Chips (Highlight top 3 categories with their mini status)
  const quickMetricChips = sortedCategories.slice(0, 3).map(cat => {
    const catName = resolveCatName(cat.name);
    const catBudget = categoryBudgets[cat.id] || categoryBudgets[cat.categoryId];
    const prevCat = prevCategorySpending[cat.id] || prevCategorySpending[cat.categoryId];
    
    let badgeText = '';
    let badgeType = 'neutral'; // 'up' | 'down' | 'budget_over' | 'neutral'

    if (typeof catBudget === 'number' && catBudget > 0) {
      const bPct = Math.round((cat.amount / catBudget) * 100);
      if (bPct >= 100) {
        badgeText = `↑ ${bPct}% dari budget`;
        badgeType = 'budget_over';
      }
    }

    if (!badgeText && prevCat && prevCat.amount > 0) {
      const diff = cat.amount - prevCat.amount;
      const dPct = Math.round((Math.abs(diff) / prevCat.amount) * 100);
      if (diff > 0 && dPct >= 5) {
        badgeText = `↑ ${dPct}% vs bulan lalu`;
        badgeType = 'up';
      } else if (diff < 0 && dPct >= 5) {
        badgeText = `↓ ${dPct}% vs bulan lalu`;
        badgeType = 'down';
      }
    }

    if (!badgeText) {
      badgeText = '≈ stabil';
      badgeType = 'neutral';
    }

    return {
      id: cat.id,
      categoryId: cat.categoryId,
      name: cat.name,
      displayName: catName,
      amount: cat.amount,
      count: cat.count,
      badgeText,
      badgeType
    };
  });

  // Calculate percentage breakdown for donut chart
  const donutSlices = sortedCategories.map(cat => {
    const pct = totalCurrentExpense > 0 ? Math.round((cat.amount / totalCurrentExpense) * 100) : 0;
    return {
      id: cat.id,
      categoryId: cat.categoryId,
      name: cat.name,
      displayName: resolveCatName(cat.name),
      amount: cat.amount,
      percentage: pct
    };
  });

  // Generate Deep Behavioral Story for Stats Screen (Non-Redundant)
  // Menyingkap pola di balik data mentah yang tidak tampak dari sekadar diagram pie
  let statsBehavioralInsight = null;

  if (totalCurrentExpense > 0 && topCategory) {
    const topCatName = resolveCatName(topCategory.name);
    const topPct = Math.round((topCategory.amount / totalCurrentExpense) * 100);
    const topCount = topCategory.count || 1;
    const avgPerTx = Math.round(topCategory.amount / topCount);

    // Kategori dengan transaksi terbanyak (frekuensi tinggi)
    const mostFreqCat = [...sortedCategories].sort((a, b) => b.count - a.count)[0];
    const mostFreqName = mostFreqCat ? resolveCatName(mostFreqCat.name) : '';

    // Kondisi 1: Konsentrasi Ekstrem dengan Sedikit Transaksi (misal 2 transaksi menyumbang 84%)
    if (topPct >= 40 && topCount <= 3) {
      statsBehavioralInsight = {
        title: appLanguage === 'en' ? 'Spending Breakdown Note' : 'Catatan Distribusi Pengeluaran',
        body: appLanguage === 'en'
          ? `The ${topCatName} category accounts for ${topPct}% of your total expenses this month (recorded from ${topCount} transaction${topCount > 1 ? 's' : ''}).`
          : `Kategori ${topCatName} menyumbang ${topPct}% dari total pengeluaran bulan ini (tercatat dari ${topCount} transaksi).`,
        sub: appLanguage === 'en'
          ? `Total accumulated: ${formatAmt(topCategory.amount)}.`
          : `Total akumulasi tercatat: ${formatAmt(topCategory.amount)}.`
      };
    }
    // Kondisi 2: Pengeluaran Mikro Frekuensi Tinggi (Kategori dengan banyak transaksi kecil menumpuk)
    else if (mostFreqCat && mostFreqCat.count >= 5 && mostFreqCat.id !== topCategory.id) {
      const freqPct = Math.round((mostFreqCat.amount / totalCurrentExpense) * 100);
      statsBehavioralInsight = {
        title: appLanguage === 'en' ? 'High Frequency Spending' : 'Frekuensi Pengeluaran Tertinggi',
        body: appLanguage === 'en'
          ? `${mostFreqName} has the most recorded transactions (${mostFreqCat.count} times), totaling ${formatAmt(mostFreqCat.amount)} (${freqPct}% of total).`
          : `${mostFreqName} merupakan kategori dengan catatan terbanyak (${mostFreqCat.count} kali), dengan total ${formatAmt(mostFreqCat.amount)} (${freqPct}% dari total).`,
        sub: appLanguage === 'en'
          ? `Ranked 1st by frequency of entry.`
          : `Menjadi kategori paling sering dicatat periode ini.`
      };
    }
    // Kondisi 3: Dominasi kategori dengan transaksi rutin
    else if (topPct >= 50) {
      statsBehavioralInsight = {
        title: appLanguage === 'en' ? 'Main Spending Concentration' : 'Konsentrasi Pengeluaran Utama',
        body: appLanguage === 'en'
          ? `${topCatName} represents ${topPct}% of your total spending across ${topCount} transactions.`
          : `Kategori ${topCatName} mengambil porsi ${topPct}% dari total pengeluaran melalui ${topCount} transaksi.`,
        sub: appLanguage === 'en'
          ? `Total accumulated: ${formatAmt(topCategory.amount)}.`
          : `Total akumulasi tercatat: ${formatAmt(topCategory.amount)}.`
      };
    }
    // Kondisi 4: Sebaran Kategori Seimbang / Sehat
    else if (sortedCategories.length >= 3 && topPct <= 35) {
      statsBehavioralInsight = {
        title: appLanguage === 'en' ? 'Category Spending Summary' : 'Ringkasan Sebaran Pengeluaran',
        body: appLanguage === 'en'
          ? `Your spending is distributed across ${sortedCategories.length} categories without heavy concentration on a single category.`
          : `Pengeluaranmu terdistribusi di ${sortedCategories.length} kategori tanpa pemusatan dominan pada satu kategori tunggal.`,
        sub: appLanguage === 'en'
          ? `Top category ${topCatName} contributes ${topPct}% of total spending.`
          : `Kategori terbesar (${topCatName}) menyumbang ${topPct}% dari total pengeluaran.`
      };
    }
    // Kondisi Fallback Stats
    else {
      statsBehavioralInsight = {
        title: appLanguage === 'en' ? 'Category Spending Summary' : 'Ringkasan Sebaran Pengeluaran',
        body: appLanguage === 'en'
          ? `${topCatName} is your highest expense category this month, with ${topCount} transaction${topCount > 1 ? 's' : ''} recorded.`
          : `${topCatName} merupakan kategori pengeluaran tertinggi bulan ini, tercatat dari ${topCount} transaksi.`,
        sub: appLanguage === 'en'
          ? `Total accumulated: ${formatAmt(topCategory.amount)}.`
          : `Total akumulasi tercatat: ${formatAmt(topCategory.amount)}.`
      };
    }
  }

  return {
    periodKey: monthKey,
    totalCurrentExpense,
    totalPrevExpense,
    topCategory,
    sortedCategories,
    insights: insightCandidates,
    highestPriorityInsight,
    statsBehavioralInsight,
    quickMetricChips,
    donutData: {
      topCategoryName: topCategory ? resolveCatName(topCategory.name) : '',
      topCategoryPercentage: (topCategory && totalCurrentExpense > 0) 
        ? Math.round((topCategory.amount / totalCurrentExpense) * 100) 
        : 0,
      totalExpense: totalCurrentExpense,
      slices: donutSlices
    }
  };
};

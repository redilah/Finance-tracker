/**
 * test/insightEngine.test.js
 * Comprehensive Unit Tests for Cassiel Financial Insight Engine (V1)
 *
 * Test Cases:
 * 1. Anomaly Surge (MoM >= 20%)
 * 2. Anomaly Saving (MoM <= -20%)
 * 3. Dominant Category (>= 40% of total)
 * 4. Category Overbudget (>= 100% of category budget)
 * 5. Main Overbudget (>= 100% of total monthly budget)
 * 6. Category Trend / Spike (MoM >= 20% on specific category)
 * 7. High Frequency Pattern (>= 3 entries)
 * 8. Previous Period = 0 (no previous data)
 * 9. No Transactions (empty state)
 * 10. No Budget set
 * 11. Single Category transaction
 * 12. Income only / Expense only
 * 13. Behavioral Stats non-redundant story logic
 * 14. Exact math verification (No hallucination)
 */

import { generateFinancialInsights, formatActivePeriodRange } from '../src/utils/financialInsightEngine.js';

let passedCount = 0;
let failedCount = 0;
const errors = [];

function assert(condition, testName, detail = '') {
  if (condition) {
    passedCount++;
    console.log(`  ✓ PASS: ${testName}`);
  } else {
    failedCount++;
    console.error(`  ✗ FAIL: ${testName} -> ${detail}`);
    errors.push({ testName, detail });
  }
}

function runAllInsightEngineTests() {
  console.log('====================================================');
  console.log('🧪 RUNNING COMPREHENSIVE INSIGHT ENGINE TESTS (V1)');
  console.log('====================================================');

  const aug2026 = new Date(2026, 7, 29); // August 2026

  // ----------------------------------------------------
  // TEST 1: No Transactions (Empty State)
  // ----------------------------------------------------
  console.log('\n[Group 1: Empty & Edge Cases]');
  {
    const res = generateFinancialInsights({
      transactions: [],
      monthlyBudgetsMap: {},
      currentDate: aug2026,
      appLanguage: 'id'
    });

    assert(res.totalCurrentExpense === 0, 'Empty: total current expense is 0');
    assert(res.totalPrevExpense === 0, 'Empty: total prev expense is 0');
    assert(res.highestPriorityInsight?.type === 'empty_fallback', 'Empty: highest priority is empty_fallback');
    assert(res.highestPriorityInsight?.value === 0, 'Empty: value is 0');
    assert(res.statsBehavioralInsight === null, 'Empty: statsBehavioralInsight is null when no expense');
  }

  // ----------------------------------------------------
  // TEST 2: Income Only (No Expense)
  // ----------------------------------------------------
  {
    const txs = [
      { id: '1', type: 'income', amount: 5000000, date: '2026-08-01', category: 'Gaji', categoryId: 'gaji' },
      { id: '2', type: 'income', amount: 1000000, date: '2026-08-15', category: 'Bonus', categoryId: 'bonus' }
    ];
    const res = generateFinancialInsights({
      transactions: txs,
      monthlyBudgetsMap: {},
      currentDate: aug2026,
      appLanguage: 'id'
    });

    assert(res.totalCurrentExpense === 0, 'Income Only: total current expense is 0');
    assert(res.highestPriorityInsight?.type === 'empty_fallback', 'Income Only: fallback insight used');
  }

  // ----------------------------------------------------
  // TEST 3: Single Category Expense
  // ----------------------------------------------------
  console.log('\n[Group 2: Single Category & Math Verification]');
  {
    const txs = [
      { id: '1', type: 'expense', amount: 150000, date: '2026-08-10', category: 'Food', categoryId: 'food' }
    ];
    const res = generateFinancialInsights({
      transactions: txs,
      monthlyBudgetsMap: {},
      currentDate: aug2026,
      appLanguage: 'id'
    });

    assert(res.totalCurrentExpense === 150000, 'Single Cat: exact total expense is 150.000');
    assert(res.topCategory?.name === 'Food', 'Single Cat: topCategory name is Food');
    assert(res.topCategory?.amount === 150000, 'Single Cat: topCategory amount is 150.000');
    assert(res.donutData?.topCategoryPercentage === 100, 'Single Cat: topCategory percentage is 100%');
    assert(res.highestPriorityInsight?.type === 'dominant_category', 'Single Cat: dominant_category detected (100%)');
    assert(res.statsBehavioralInsight !== null, 'Single Cat: statsBehavioralInsight generated');
  }

  // ----------------------------------------------------
  // TEST 4: Dominant Category (> 40% threshold)
  // ----------------------------------------------------
  console.log('\n[Group 3: Dominant Category & Stats Behavioral Narrative]');
  {
    const txs = [
      { id: '1', type: 'expense', amount: 840000, date: '2026-08-05', category: 'Party', categoryId: 'party' },
      { id: '2', type: 'expense', amount: 180000, date: '2026-08-10', category: 'Party', categoryId: 'party' },
      { id: '3', type: 'expense', amount: 90000, date: '2026-08-12', category: 'Food', categoryId: 'food' },
      { id: '4', type: 'expense', amount: 90000, date: '2026-08-15', category: 'Fashion', categoryId: 'fashion' }
    ];
    // Total = 840.000 + 180.000 + 90.000 + 90.000 = 1.200.000
    // Party = 1.020.000 (85% of 1.200.000)
    const res = generateFinancialInsights({
      transactions: txs,
      monthlyBudgetsMap: {},
      currentDate: aug2026,
      appLanguage: 'id'
    });

    assert(res.totalCurrentExpense === 1200000, 'Dominant: exact total is 1.200.000');
    assert(res.topCategory?.name === 'Party', 'Dominant: topCategory is Party');
    assert(res.topCategory?.amount === 1020000, 'Dominant: Party total is 1.020.000');
    assert(res.topCategory?.count === 2, 'Dominant: Party transaction count is exactly 2');
    
    // Stats behavioral story non-redundant check
    assert(res.statsBehavioralInsight?.title === 'Catatan Distribusi Pengeluaran', 'Stats story: title is respectful note');
    assert(res.statsBehavioralInsight?.body.includes('85%'), 'Stats story: includes accurate percentage');
    assert(res.statsBehavioralInsight?.body.includes('2 transaksi'), 'Stats story: includes exact transaction count');
    assert(!res.statsBehavioralInsight?.body.includes('menarik'), 'Stats story: does NOT contain condescending "menarik" word');
  }

  // ----------------------------------------------------
  // TEST 5: Anomaly Surge vs Previous Month (MoM >= 20%)
  // ----------------------------------------------------
  console.log('\n[Group 4: Month-over-Month Anomaly]');
  {
    const txs = [
      // Prev month (July 2026): 1.000.000
      { id: 'p1', type: 'expense', amount: 1000000, date: '2026-07-15', category: 'Food', categoryId: 'food' },
      // Current month (August 2026): 1.380.000 (+38%)
      { id: 'c1', type: 'expense', amount: 1000000, date: '2026-08-10', category: 'Food', categoryId: 'food' },
      { id: 'c2', type: 'expense', amount: 380000, date: '2026-08-20', category: 'Party', categoryId: 'party' }
    ];
    const res = generateFinancialInsights({
      transactions: txs,
      monthlyBudgetsMap: {},
      currentDate: aug2026,
      appLanguage: 'id'
    });

    assert(res.totalPrevExpense === 1000000, 'MoM Surge: prev month total is 1.000.000');
    assert(res.totalCurrentExpense === 1380000, 'MoM Surge: current month total is 1.380.000');
    assert(res.highestPriorityInsight?.type === 'anomaly_surge', 'MoM Surge: priority #1 is anomaly_surge');
    assert(res.highestPriorityInsight?.highlightPercent === '38%', 'MoM Surge: surge percent is exactly 38%');
  }

  // ----------------------------------------------------
  // TEST 6: Anomaly Saving vs Previous Month (MoM <= -20%)
  // ----------------------------------------------------
  {
    const txs = [
      // Prev month: 2.000.000
      { id: 'p1', type: 'expense', amount: 2000000, date: '2026-07-15', category: 'Food', categoryId: 'food' },
      // Current month: 1.000.000 (-50%)
      { id: 'c1', type: 'expense', amount: 1000000, date: '2026-08-10', category: 'Food', categoryId: 'food' }
    ];
    const res = generateFinancialInsights({
      transactions: txs,
      monthlyBudgetsMap: {},
      currentDate: aug2026,
      appLanguage: 'id'
    });

    assert(res.totalPrevExpense === 2000000, 'MoM Saving: prev month is 2.000.000');
    assert(res.totalCurrentExpense === 1000000, 'MoM Saving: current month is 1.000.000');
    const savingInsight = res.insights.find(i => i.type === 'anomaly_saving');
    assert(savingInsight !== undefined, 'MoM Saving: anomaly_saving candidate exists');
    assert(savingInsight?.highlightPercent === '50%', 'MoM Saving: saving percent is 50%');
  }

  // ----------------------------------------------------
  // TEST 7: Category Overbudget Alert
  // ----------------------------------------------------
  console.log('\n[Group 5: Budget & Limit Tests]');
  {
    const txs = [
      { id: '1', type: 'expense', amount: 500000, date: '2026-08-10', category: 'Food', categoryId: 'food' }
    ];
    const monthlyBudgetsMap = {
      '2026-08': {
        main: 2000000,
        categories: {
          food: 250000 // Budget 250.000, spent 500.000 -> 200%
        }
      }
    };
    const res = generateFinancialInsights({
      transactions: txs,
      monthlyBudgetsMap,
      currentDate: aug2026,
      appLanguage: 'id'
    });

    const overBudgetInsight = res.insights.find(i => i.type === 'category_overbudget');
    assert(overBudgetInsight !== undefined, 'Budget: category_overbudget insight is triggered');
    assert(overBudgetInsight?.budgetPercent === 200, 'Budget: Food budgetPercent is exactly 200%');
    assert(overBudgetInsight?.budgetAmount === 250000, 'Budget: target budget limit is 250.000');
  }

  // ----------------------------------------------------
  // TEST 8: Main Total Overbudget Alert
  // ----------------------------------------------------
  {
    const txs = [
      { id: '1', type: 'expense', amount: 1200000, date: '2026-08-10', category: 'Food', categoryId: 'food' }
    ];
    const monthlyBudgetsMap = {
      '2026-08': {
        main: 1000000, // Budget 1.000.000, spent 1.200.000 -> 120%
        categories: {}
      }
    };
    const res = generateFinancialInsights({
      transactions: txs,
      monthlyBudgetsMap,
      currentDate: aug2026,
      appLanguage: 'id'
    });

    const mainOverInsight = res.insights.find(i => i.type === 'main_overbudget');
    assert(mainOverInsight !== undefined, 'Budget: main_overbudget is triggered');
    assert(mainOverInsight?.budgetPercent === 120, 'Budget: main budgetPercent is exactly 120%');
  }

  // ----------------------------------------------------
  // TEST 9: Category Trend / Spike (Specific Category MoM)
  // ----------------------------------------------------
  console.log('\n[Group 6: Category Trend & Frequency Pattern]');
  {
    const txs = [
      // Prev month coffee: 100.000
      { id: 'p1', type: 'expense', amount: 100000, date: '2026-07-10', category: 'Coffee', categoryId: 'coffee' },
      // This month coffee: 200.000 (+100%)
      { id: 'c1', type: 'expense', amount: 200000, date: '2026-08-10', category: 'Coffee', categoryId: 'coffee' }
    ];
    const res = generateFinancialInsights({
      transactions: txs,
      monthlyBudgetsMap: {},
      currentDate: aug2026,
      appLanguage: 'id'
    });

    const catSurgeInsight = res.insights.find(i => i.type === 'category_surge' && (i.categoryId === 'coffee' || i.category === 'Coffee'));
    assert(catSurgeInsight !== undefined, 'Trend: category_surge insight generated for Coffee');
    assert(catSurgeInsight?.comparison?.percentage === 100, 'Trend: Coffee spike percentage is 100%');
  }

  // ----------------------------------------------------
  // TEST 10: Frequency Pattern (Most Used Category)
  // ----------------------------------------------------
  {
    const txs = [
      { id: '1', type: 'expense', amount: 20000, date: '2026-08-01', category: 'Coffee', categoryId: 'coffee' },
      { id: '2', type: 'expense', amount: 25000, date: '2026-08-02', category: 'Coffee', categoryId: 'coffee' },
      { id: '3', type: 'expense', amount: 22000, date: '2026-08-03', category: 'Coffee', categoryId: 'coffee' },
      { id: '4', type: 'expense', amount: 20000, date: '2026-08-04', category: 'Coffee', categoryId: 'coffee' },
      { id: '5', type: 'expense', amount: 500000, date: '2026-08-05', category: 'Kost', categoryId: 'kost' }
    ];
    const res = generateFinancialInsights({
      transactions: txs,
      monthlyBudgetsMap: {},
      currentDate: aug2026,
      appLanguage: 'id'
    });

    const freqInsight = res.insights.find(i => i.type === 'category_frequency');
    assert(freqInsight !== undefined, 'Pattern: category_frequency insight generated');
    assert(freqInsight?.count === 4, 'Pattern: Coffee recorded count is 4x');
    assert(freqInsight?.categoryId === 'coffee', 'Pattern: Most frequent category is coffee');
  }

  // ----------------------------------------------------
  // TEST 11: Date Period Formatting Range Helper
  // ----------------------------------------------------
  console.log('\n[Group 7: Date Range Formatter]');
  {
    const txs = [
      { id: '1', type: 'expense', amount: 50000, date: '2026-08-10', category: 'Food', categoryId: 'food' },
      { id: '2', type: 'expense', amount: 70000, date: '2026-08-25', category: 'Food', categoryId: 'food' }
    ];
    const labelId = formatActivePeriodRange(aug2026, txs, 'id');
    const labelEn = formatActivePeriodRange(aug2026, txs, 'en');

    assert(labelId.includes('Agu 2026'), 'Date Range: Indonesian label contains Agu 2026');
    assert(labelEn.includes('Aug 2026'), 'Date Range: English label contains Aug 2026');
  }

  console.log('\n====================================================');
  console.log(`TOTAL TESTS: ${passedCount + failedCount} | PASSED: ${passedCount} | FAILED: ${failedCount}`);
  console.log('====================================================');

  if (failedCount > 0) {
    process.exit(1);
  }
}

runAllInsightEngineTests();

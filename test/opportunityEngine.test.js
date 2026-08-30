/**
 * test/opportunityEngine.test.js
 * Comprehensive Unit Tests for Cassiel Opportunity Engine (Peluang Finansial)
 */

import { 
  detectOpportunities, 
  OPPORTUNITY_TYPES, 
  markOpportunityCompleted, 
  unmarkOpportunityCompleted, 
  getCompletedOpportunities 
} from '../src/utils/opportunityEngine.js';

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

export function runAllOpportunityEngineTests() {
  console.log('====================================================');
  console.log('🧪 RUNNING CASSIEL OPPORTUNITY ENGINE TESTS');
  console.log('====================================================\n');

  const currentDate = new Date(2026, 7, 29); // 29 Agu 2026

  // ----------------------------------------------------
  // TEST 1: Empty state (no transactions)
  // ----------------------------------------------------
  console.log('[Group 1: Empty Data]');
  const emptyOpps = detectOpportunities({
    transactions: [],
    monthlyBudgetsMap: {},
    currentDate
  });
  assert(Array.isArray(emptyOpps) && emptyOpps.length === 0, 'Empty transactions return 0 opportunities');

  // ----------------------------------------------------
  // TEST 2: Category Surge Detection (SAVE)
  // ----------------------------------------------------
  console.log('\n[Group 2: Category Surge]');
  const surgeTxs = [
    // Previous month: Food = 800.000
    { id: '1', date: '2026-07-10', type: 'expense', amount: 800000, category: 'Food', categoryId: 'food' },
    // Current month: Food = 1.200.000 (18 transactions)
    ...Array.from({ length: 18 }, (_, i) => ({
      id: `f_${i}`,
      date: '2026-08-15',
      type: 'expense',
      amount: 66666,
      category: 'Food',
      categoryId: 'food'
    }))
  ];

  const surgeOpps = detectOpportunities({
    transactions: surgeTxs,
    currentDate
  });

  const surgeFound = surgeOpps.find(o => o.type === OPPORTUNITY_TYPES.SAVE && o.categoryId === 'food');
  assert(surgeFound !== undefined, 'Surge opportunity found for Food');
  assert(surgeFound.potentialAmount > 0, 'Food surge has positive potentialAmount');
  assert(surgeFound.actionPlan && surgeFound.actionPlan.steps.length > 0, 'Food surge has concrete Action Plan steps');

  // ----------------------------------------------------
  // TEST 3: High Frequency Habits (SAVE)
  // ----------------------------------------------------
  console.log('\n[Group 3: High Frequency Habits]');
  const habitTxs = Array.from({ length: 12 }, (_, i) => ({
    id: `c_${i}`,
    date: '2026-08-10',
    type: 'expense',
    amount: 30000,
    category: 'Coffee',
    categoryId: 'coffee'
  }));

  const habitOpps = detectOpportunities({
    transactions: habitTxs,
    currentDate
  });

  const coffeeHabit = habitOpps.find(o => o.categoryId === 'coffee' && o.type === OPPORTUNITY_TYPES.SAVE);
  assert(coffeeHabit !== undefined, 'High-frequency habit detected for Coffee');
  assert(coffeeHabit.potentialAmount >= 40000, 'Coffee habit potential >= Rp40.000');
  assert(coffeeHabit.title.includes('hemat') || coffeeHabit.title.includes('Bisa'), 'Coffee habit title communicates savings');

  // ----------------------------------------------------
  // TEST 4: Recurring Subscriptions (SAVE)
  // ----------------------------------------------------
  console.log('\n[Group 4: Subscriptions]');
  const subTxs = [
    { id: 's1', date: '2026-08-05', type: 'expense', amount: 186000, category: 'Subscription', categoryId: 'subscription', note: 'Netflix Premium' },
    { id: 's2', date: '2026-08-12', type: 'expense', amount: 55000, category: 'Subscription', categoryId: 'subscription', note: 'Spotify Family' },
    { id: 's3', date: '2026-08-20', type: 'expense', amount: 320000, category: 'Subscription', categoryId: 'subscription', note: 'ChatGPT Plus' }
  ];

  const subOpps = detectOpportunities({
    transactions: subTxs,
    currentDate
  });

  const subFound = subOpps.find(o => o.id.startsWith('opp_subscriptions'));
  assert(subFound !== undefined, 'Recurring subscription review opportunity detected');
  assert(subFound.potentialAmount > 0, 'Subscription potential savings > 0');

  // ----------------------------------------------------
  // TEST 5: Bank Admin Fees Leaks (SAVE)
  // ----------------------------------------------------
  console.log('\n[Group 5: Bank Admin Fee Leaks]');
  const adminTxs = [
    { id: 'a1', date: '2026-08-02', type: 'expense', amount: 6500, category: 'Biaya Admin', categoryId: 'biayaadmin', note: 'Transfer bank' },
    { id: 'a2', date: '2026-08-08', type: 'expense', amount: 6500, category: 'Biaya Admin', categoryId: 'biayaadmin', note: 'Transfer bank' },
    { id: 'a3', date: '2026-08-15', type: 'expense', amount: 2500, category: 'Biaya Admin', categoryId: 'biayaadmin', note: 'Top up fee' },
    { id: 'a4', date: '2026-08-22', type: 'expense', amount: 6500, category: 'Biaya Admin', categoryId: 'biayaadmin', note: 'Transfer bank' }
  ];

  const adminOpps = detectOpportunities({
    transactions: adminTxs,
    currentDate
  });

  const adminFound = adminOpps.find(o => o.id.startsWith('opp_admin_leaks'));
  assert(adminFound !== undefined, 'Micro-leaks from bank admin fees detected');
  assert(adminFound.potentialAmount === 22000, 'Admin fee potential equals exact fee total (Rp22.000)');

  // ----------------------------------------------------
  // TEST 6: Surplus Allocation & Idle Cash (OPTIMIZE)
  // ----------------------------------------------------
  console.log('\n[Group 6: Surplus Allocation (OPTIMIZE)]');
  const surplusTxs = [
    { id: 'inc1', date: '2026-08-01', type: 'income', amount: 10000000, category: 'Gaji', categoryId: 'gaji' },
    { id: 'exp1', date: '2026-08-10', type: 'expense', amount: 4000000, category: 'Kost', categoryId: 'kost' }
  ];

  const surplusOpps = detectOpportunities({
    transactions: surplusTxs,
    currentDate
  });

  const surplusFound = surplusOpps.find(o => o.type === OPPORTUNITY_TYPES.OPTIMIZE && o.id.startsWith('opp_surplus'));
  assert(surplusFound !== undefined, 'Surplus allocation opportunity detected for positive cash flow');
  assert(surplusFound.potentialAmount > 0, 'Surplus potential allocation > 0');

  // ----------------------------------------------------
  // TEST 7: Single Income Stream Diversification (EARN)
  // ----------------------------------------------------
  console.log('\n[Group 7: Income Diversification (EARN)]');
  const earnOpps = detectOpportunities({
    transactions: surplusTxs,
    currentDate
  });

  const earnFound = earnOpps.find(o => o.type === OPPORTUNITY_TYPES.EARN);
  assert(earnFound !== undefined, 'Single income stream diversification opportunity detected');
  assert(earnFound.actionPlan.steps.length >= 3, 'EARN action plan has at least 3 concrete steps');

  // ----------------------------------------------------
  // TEST 8: Ranking & Prioritization
  // ----------------------------------------------------
  console.log('\n[Group 8: Opportunity Prioritization]');
  const combinedTxs = [...surgeTxs, ...habitTxs, ...subTxs, ...adminTxs, ...surplusTxs];
  const combinedOpps = detectOpportunities({
    transactions: combinedTxs,
    currentDate
  });

  assert(combinedOpps.length >= 4, `Multiple opportunities discovered (Found: ${combinedOpps.length})`);
  // Check that opportunities are sorted in descending order of impactScore
  let isSorted = true;
  for (let i = 0; i < combinedOpps.length - 1; i++) {
    if ((combinedOpps[i].impactScore || 0) < (combinedOpps[i + 1].impactScore || 0)) {
      isSorted = false;
      break;
    }
  }
  assert(isSorted, 'Opportunities are strictly ranked in descending order of priority/financial impact');

  console.log('\n====================================================');
  console.log(`TOTAL TESTS: ${passedCount + failedCount} | PASSED: ${passedCount} | FAILED: ${failedCount}`);
  console.log('====================================================\n');

  if (failedCount > 0) {
    process.exit(1);
  }
}

runAllOpportunityEngineTests();

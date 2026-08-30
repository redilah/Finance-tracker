/**
 * Comprehensive Unit Test Suite for Cassiel Notification Auto Tracker
 * 
 * Covers:
 * 1. Provider Detection (all 15 supported providers + variants)
 * 2. Amount Extraction & Balance Isolation (various currency formats, comma/dot variations)
 * 3. Debit vs Credit (Expense vs Income detection)
 * 4. Merchant Extraction (Indonesian phrasing, uppercase, lowercase, punctuation)
 * 5. Non-Transactional Filters (OTP, promo, bills, system notices)
 * 6. Category Auto-Resolution (Keywords to Category ID)
 * 7. Account Resolution (Bank / E-Wallet / Cash matching)
 * 8. Fingerprint Generation & Deduplication (Idempotency)
 * 9. End-to-end Single Notification Processing Pipeline
 */

import {
  detectProvider,
  extractTransactionAmount,
  detectTransactionType,
  extractMerchant,
  hasTransactionSignal,
  isNonTransactional,
  calculateConfidence,
  parseNotification,
  PROVIDER_REGISTRY
} from '../src/utils/notificationProviders.js';

import {
  normalizeNotification,
  shouldProcessNotification,
  resolveCategory,
  resolveAccount,
  generateNotificationFingerprint,
  isDuplicateAndRecord,
  isDuplicateInTransactions,
  processSingleNotification
} from '../src/utils/notificationTracker.js';

let passed = 0;
let failed = 0;
const failures = [];

function assert(description, actual, expected) {
  const isMatch = JSON.stringify(actual) === JSON.stringify(expected);
  if (isMatch) {
    passed++;
    console.log(`  ✅ PASS: ${description}`);
  } else {
    failed++;
    console.log(`  ❌ FAIL: ${description}`);
    console.log(`     Expected: ${JSON.stringify(expected)}`);
    console.log(`     Actual:   ${JSON.stringify(actual)}`);
    failures.push({ description, expected, actual });
  }
}

console.log('\n======================================================');
console.log('🧪 CASSIEL NOTIFICATION AUTO TRACKER TEST SUITE');
console.log('======================================================\n');

// ─── 1. PROVIDER DETECTION TESTS ────────────────────────────────────────────
console.log('--- 1. Provider Detection ---');
assert('Detect BRImo', detectProvider('id.co.bri.brimo')?.id, 'bri');
assert('Detect BCA Mobile', detectProvider('com.bca')?.id, 'bca');
assert('Detect myBCA mobile variant', detectProvider('com.bca.mybca.mobile')?.id, 'bca');
assert('Detect myBCA variant', detectProvider('com.bca.mybca')?.id, 'bca');
assert('Detect Livin Mandiri', detectProvider('com.bankmandiri.mandirionline')?.id, 'mandiri');
assert('Detect Livin Mandiri alt package', detectProvider('com.bankmandiri.livin')?.id, 'mandiri');
assert('Detect Wondr BNI', detectProvider('id.co.bni.wondr')?.id, 'bni');
assert('Detect BNI Mobile', detectProvider('id.co.bni.net.banking')?.id, 'bni');
assert('Detect BSI Mobile', detectProvider('com.bsm.activity2')?.id, 'bsi');
assert('Detect BSI Superapp', detectProvider('id.co.bankbsi.superapp')?.id, 'bsi');
assert('Detect DANA', detectProvider('id.dana')?.id, 'dana');
assert('Detect GoPay app', detectProvider('com.gojek.gopay')?.id, 'gopay');
assert('Detect Gojek app', detectProvider('com.gojek.app')?.id, 'gopay');
assert('Detect OVO', detectProvider('ovo.id')?.id, 'ovo');
assert('Detect Shopee', detectProvider('com.shopee.id')?.id, 'shopeepay');
assert('Detect ShopeePay standalone', detectProvider('com.shopeepay.id')?.id, 'shopeepay');
assert('Detect LinkAja', detectProvider('com.telkom.mwallet')?.id, 'linkaja');
assert('Detect SeaBank', detectProvider('com.seabank.id')?.id, 'seabank');
assert('Detect Bank Jago', detectProvider('com.jfriau.bankjago')?.id, 'jago');
assert('Detect Bank Jago app variant', detectProvider('com.bankjago.app')?.id, 'jago');
assert('Detect Jenius BTPN', detectProvider('com.btpn.dc')?.id, 'jenius');
assert('Detect CIMB Niaga OCTO', detectProvider('com.cimbniaga.mobile.android')?.id, 'cimb');
assert('Detect Permata Mobile', detectProvider('net.myinfosys.PermataMobileX')?.id, 'permata');
assert('Unknown package returns null', detectProvider('com.whatsapp'), null);

// ─── 2. AMOUNT EXTRACTION & BALANCE ISOLATION ──────────────────────────────
console.log('\n--- 2. Amount Extraction & Balance Isolation ---');
assert('Simple Rp format', extractTransactionAmount('Pembayaran berhasil Rp50.000'), 50000);
assert('Rp with dot thousand separator', extractTransactionAmount('Debet sebesar Rp 125.000 di Alfamart'), 125000);
assert('Rp with comma decimals', extractTransactionAmount('Transaksi debit Rp 75.000,00 sukses'), 75000);
assert('IDR prefix', extractTransactionAmount('Payment IDR 250.000 confirmed'), 250000);
assert('Rp with space and dash suffix', extractTransactionAmount('Pembayaran sebesar Rp. 30.000,- berhasil'), 30000);
assert('Transaction amount first, Saldo second', 
  extractTransactionAmount('INFO BRI: Debet Rp45.000 pada 27/08. Saldo akhir Rp1.500.000'), 
  45000
);
assert('Saldo first, Transaction amount second with comma separator', 
  extractTransactionAmount('Saldo Anda Rp500.000, pembayaran Rp50.000 berhasil'), 
  50000
);
assert('Balance only notification should return null', 
  extractTransactionAmount('Sisa saldo rekening Anda saat ini adalah Rp2.350.000'), 
  null
);
assert('Total saldo notification returns null', 
  extractTransactionAmount('Total saldo DANA Anda Rp150.000'), 
  null
);
assert('Multiple debits in text', 
  extractTransactionAmount('Pembayaran Rp20.000 berhasil ke Kopi Kenangan'), 
  20000
);

// ─── 3. DEBIT VS CREDIT DETECTION ──────────────────────────────────────────
console.log('\n--- 3. Debit vs Credit Detection ---');
assert('Debit is expense', detectTransactionType('Transaksi debit sebesar Rp50.000'), 'expense');
assert('Debet is expense', detectTransactionType('Debet sebesar Rp25.000'), 'expense');
assert('Pembayaran is expense', detectTransactionType('Pembayaran tagihan berhasil'), 'expense');
assert('Transfer keluar is expense', detectTransactionType('Transfer keluar ke BCA 123456'), 'expense');
assert('Tarik tunai is expense', detectTransactionType('Penarikan tunai Rp100.000 di ATM'), 'expense');
assert('Kredit is income', detectTransactionType('Kredit sebesar Rp500.000 dari PT Maju'), 'income');
assert('Transfer masuk is income', detectTransactionType('Transfer masuk dari Budi Rp100.000'), 'income');
assert('Dana masuk is income', detectTransactionType('Ada uang masuk sebesar Rp250.000'), 'income');
assert('Top up is income', detectTransactionType('Top up saldo GoPay sebesar Rp100.000 berhasil'), 'income');

// ─── 4. MERCHANT EXTRACTION ────────────────────────────────────────────────
console.log('\n--- 4. Merchant Extraction ---');
assert('Merchant with "di"', extractMerchant('Pembayaran Rp35.000 di McDonald Sarinah'), 'McDonald Sarinah');
assert('Merchant with "ke"', extractMerchant('Transfer Rp50.000 ke Solaria Plaza Blok M'), 'Solaria Plaza Blok M');
assert('Merchant with "merchant:"', extractMerchant('Transaksi berhasil. Merchant: Fore Coffee Gandaria'), 'Fore Coffee Gandaria');
assert('Merchant lowercase with "ke"', extractMerchant('Pembayaran Rp25.000 ke indomaret berhasil'), 'indomaret');
assert('Account number after "ke rekening" is NOT merchant', extractMerchant('Transfer Rp100.000 ke rekening 1234567890'), null);
assert('Bank name after "ke bank" is NOT merchant', extractMerchant('Transfer Rp50.000 ke bank bca berhasil'), null);
assert('Cut off trailing timestamps', extractMerchant('Pembayaran Rp50.000 di Starbucks Coffee pada 27/08 14:00'), 'Starbucks Coffee');

// ─── 5. NON-TRANSACTIONAL FILTER TESTS ─────────────────────────────────────
console.log('\n--- 5. Non-Transactional Filter ---');
assert('OTP is non-transactional', isNonTransactional('Kode OTP Anda 849201. Jangan berikan kepada siapapun.'), true);
assert('Kode verifikasi is non-transactional', isNonTransactional('Kode verifikasi BCA Anda adalah 459123.'), true);
assert('Promo is non-transactional', isNonTransactional('Promo diskon 50% belanja di merchant favoritmu!'), true);
assert('Billing reminder is non-transactional', isNonTransactional('Tagihan kartu kredit Anda sebesar Rp500.000 jatuh tempo besok.'), true);
assert('Real transaction with cashback promo signal remains transactional', 
  isNonTransactional('Pembayaran Rp25.000 berhasil, Anda mendapatkan cashback Rp2.000!'), 
  false
);

// ─── 6. CATEGORY AUTO-RESOLUTION ───────────────────────────────────────────
console.log('\n--- 6. Category Auto-Resolution ---');
const dummyExpenseCats = [
  { id: 'food', name: 'Makanan & Minuman', iconClass: 'food-icon' },
  { id: 'coffee', name: 'Kopi', iconClass: 'coffee-icon' },
  { id: 'bensin', name: 'Bensin', iconClass: 'bensin-icon' },
  { id: 'transport', name: 'Transportasi', iconClass: 'transport-icon' },
  { id: 'supermarket', name: 'Supermarket', iconClass: 'supermarket-icon' },
  { id: 'pulsa', name: 'Pulsa & Data', iconClass: 'pulsa-icon' },
  { id: 'sub', name: 'Langganan', iconClass: 'sub-icon' },
];
const dummyIncomeCats = [
  { id: 'gaji', name: 'Gaji', iconClass: 'gaji-icon' },
  { id: 'bonus', name: 'Bonus & THR', iconClass: 'bonus-icon' },
  { id: 'investasi', name: 'Investasi', iconClass: 'investasi-icon' }
];

assert('GoFood resolves to food', 
  resolveCategory('expense', 'GoFood', 'Pembayaran GoFood', dummyExpenseCats, dummyIncomeCats).id, 
  'food'
);
assert('Starbucks resolves to coffee', 
  resolveCategory('expense', 'Starbucks', 'Pembayaran di Starbucks', dummyExpenseCats, dummyIncomeCats).id, 
  'coffee'
);
assert('SPBU Pertamina resolves to bensin', 
  resolveCategory('expense', 'SPBU Pertamina', 'Pembayaran bensin pertalite', dummyExpenseCats, dummyIncomeCats).id, 
  'bensin'
);
assert('Indomaret resolves to supermarket', 
  resolveCategory('expense', 'Indomaret', 'Belanja di Indomaret', dummyExpenseCats, dummyIncomeCats).id, 
  'supermarket'
);
assert('Telkomsel resolves to pulsa', 
  resolveCategory('expense', 'Telkomsel', 'Beli pulsa Telkomsel', dummyExpenseCats, dummyIncomeCats).id, 
  'pulsa'
);
assert('Netflix resolves to sub', 
  resolveCategory('expense', 'Netflix', 'Langganan bulanan Netflix', dummyExpenseCats, dummyIncomeCats).id, 
  'sub'
);
assert('Payroll resolves to gaji', 
  resolveCategory('income', 'PT Jaya', 'Payroll gaji bulanan', dummyExpenseCats, dummyIncomeCats).id, 
  'gaji'
);
assert('Dividen resolves to investasi', 
  resolveCategory('income', 'Bibit', 'Dividen reksadana masuk', dummyExpenseCats, dummyIncomeCats).id, 
  'investasi'
);

// ─── 7. ACCOUNT RESOLUTION ─────────────────────────────────────────────────
console.log('\n--- 7. Account Resolution ---');
const userAccounts = ['Cash', 'GoPay', 'BRImo', 'BCA'];
const userWarehouse = ['DANA', 'OVO', "Livin' by Mandiri"];

assert('Resolve active BRImo', resolveAccount({ id: 'bri', name: 'BRImo', accountName: 'BRImo' }, userAccounts, userWarehouse), 'BRImo');
assert('Resolve active BCA', resolveAccount({ id: 'bca', name: 'BCA', accountName: 'BCA' }, userAccounts, userWarehouse), 'BCA');
assert('Resolve warehouse DANA', resolveAccount({ id: 'dana', name: 'DANA', accountName: 'DANA' }, userAccounts, userWarehouse), 'DANA');
assert('Resolve warehouse Livin', resolveAccount({ id: 'mandiri', name: "Livin' by Mandiri", accountName: "Livin' by Mandiri" }, userAccounts, userWarehouse), "Livin' by Mandiri");
assert('Resolve unlisted defaults to normalized', resolveAccount({ id: 'jago', name: 'Bank Jago', accountName: 'Jago' }, userAccounts, userWarehouse), 'Jago');

// ─── 8. DEDUPLICATION & FINGERPRINTING ─────────────────────────────────────
console.log('\n--- 8. Deduplication & Fingerprinting ---');
const now = 1724745600000; // Fixed timestamp
const fp1 = generateNotificationFingerprint('id.dana', 'expense', 35000, 'Alfamart', now, 'Pembayaran Rp35.000 ke Alfamart');
const fp2 = generateNotificationFingerprint('id.dana', 'expense', 35000, 'Alfamart', now + 30000, 'Pembayaran Rp35.000 ke Alfamart'); // +30s within 2-min window
const fpDifferent = generateNotificationFingerprint('id.dana', 'expense', 50000, 'Alfamart', now, 'Pembayaran Rp50.000 ke Alfamart');

assert('Fingerprint matches within 2-minute window', fp1, fp2);
assert('Different amounts have different fingerprints', fp1 !== fpDifferent, true);

const existingTransactions = [
  { id: 1724745600100, date: '2026-08-27', amount: 35000, type: 'expense', account: 'DANA', inputMethod: 'notification' }
];
const duplicateTx = { id: 1724745600200, date: '2026-08-27', amount: 35000, type: 'expense', account: 'DANA', inputMethod: 'notification' };
const uniqueTx = { id: 1724745600300, date: '2026-08-27', amount: 50000, type: 'expense', account: 'DANA', inputMethod: 'notification' };

assert('Detect duplicate in transaction history', isDuplicateInTransactions(duplicateTx, existingTransactions), true);
assert('Unique transaction is not flagged as duplicate', isDuplicateInTransactions(uniqueTx, existingTransactions), false);

// ─── 9. END-TO-END NOTIFICATION PROCESSING ─────────────────────────────────
console.log('\n--- 9. End-to-End Processing Pipeline ---');

// Test A: Normal DANA expense
const rawDanaNotif = {
  packageName: 'id.dana',
  title: 'Pembayaran Berhasil',
  text: 'Pembayaran sebesar Rp28.000 ke Kopi Kenangan telah berhasil',
  postTime: Date.now()
};
const processedDana = processSingleNotification(rawDanaNotif, {
  accountsList: ['DANA', 'Cash'],
  warehouseAccountsList: [],
  expenseCategories: dummyExpenseCats,
  incomeCategories: dummyIncomeCats,
  existingTransactions: []
});
assert('End-to-end DANA expense parsed', processedDana !== null, true);
assert('DANA amount is 28000', processedDana?.amount, 28000);
assert('DANA type is expense', processedDana?.type, 'expense');
assert('DANA category is coffee', processedDana?.categoryId, 'coffee');
assert('DANA account is DANA', processedDana?.account, 'DANA');
assert('DANA inputMethod is notification', processedDana?.inputMethod, 'notification');

// Test B: BRImo Credit Income
const rawBriIncome = {
  packageName: 'id.co.bri.brimo',
  title: 'INFO BRI',
  text: 'Kredit sebesar Rp3.500.000 dari PT MAJU BERSAMA pada 27/08. Saldo akhir Rp5.200.000',
  postTime: Date.now()
};
const processedBri = processSingleNotification(rawBriIncome, {
  accountsList: ['BRImo', 'Cash'],
  warehouseAccountsList: [],
  expenseCategories: dummyExpenseCats,
  incomeCategories: dummyIncomeCats,
  existingTransactions: []
});
assert('End-to-end BRImo income parsed', processedBri !== null, true);
assert('BRImo amount is 3500000 (not balance)', processedBri?.amount, 3500000);
assert('BRImo type is income', processedBri?.type, 'income');
assert('BRImo category is gaji', processedBri?.categoryId, 'gaji');
assert('BRImo account is BRImo', processedBri?.account, 'BRImo');

// Test C: OTP rejected by pipeline
const rawOtpNotif = {
  packageName: 'com.bca',
  title: 'BCA OTP',
  text: 'Kode OTP transaksi Anda: 628192. JANGAN BERIKAN KEPADA SIAPAPUN.',
  postTime: Date.now()
};
const processedOtp = processSingleNotification(rawOtpNotif, {
  accountsList: ['BCA'],
  warehouseAccountsList: [],
  expenseCategories: dummyExpenseCats,
  incomeCategories: dummyIncomeCats,
  existingTransactions: []
});
assert('OTP is completely rejected by pipeline', processedOtp, null);

// Test D: Unknown package ignored
const rawUnknownNotif = {
  packageName: 'com.random.app',
  title: 'Hello',
  text: 'Pembayaran Rp10.000',
  postTime: Date.now()
};
const processedUnknown = processSingleNotification(rawUnknownNotif, {
  accountsList: ['Cash'],
  warehouseAccountsList: [],
  expenseCategories: dummyExpenseCats,
  incomeCategories: dummyIncomeCats,
  existingTransactions: []
});
assert('Unknown package rejected', processedUnknown, null);

// ─── FINAL SUMMARY ──────────────────────────────────────────────────────────
console.log('\n======================================================');
console.log(`TOTAL TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
console.log('======================================================');

if (failed > 0) {
  console.log('\n❌ SOME TESTS FAILED:');
  failures.forEach(f => console.log(`- ${f.description}: Expected ${JSON.stringify(f.expected)} but got ${JSON.stringify(f.actual)}`));
  process.exit(1);
} else {
  console.log(`\n🎉 ALL ${passed} NOTIFICATION AUTO TRACKER TESTS PASSED WITH 100% SUCCESS! ✨\n`);
  process.exit(0);
}

import { registerPlugin } from '@capacitor/core';
import { App } from '@capacitor/app';

// Register the custom plugin
export const NotificationTracker = registerPlugin('NotificationTracker');

// Kata kunci promo & marketing non-transaksi
const PROMO_KEYWORDS = [
  'diskon', 'discount', 'promo', 'cashback', 'voucher', 'kupon',
  'hemat hingga', 'hemat s.d', 's.d.', 'up to', 'special offer', 'penawaran',
  'hadiah', 'reward', 'gratis', 'undian', 'kesempatan',
  'ajukan', 'pinjaman', 'paylater', 'kartu kredit', 'limit kredit',
  'bunga ', 'investasi', 'reksa dana', 'deposito', 'upgrade akun',
  'kode otp', 'kode verifikasi', 'rahasia', 'login baru', 'peringatan', 'keamanan'
];

const TRANSACTION_WHITELIST = [
  'berhasil', 'sukses', 'selesai', 'debit', 'kredit',
  'pembayaran', 'pembelian', 'transfer', 'terima',
  'top up', 'qris', 'tarik tunai', 'terkirim', 'masuk', 'keluar'
];

export const isPromoOrNonTransaction = (text) => {
  const t = text.toLowerCase();
  
  // 1. Cek jika mengandung pola persentase diskon (misal "DISKON 25%", "off 50%")
  if (/\b\d{1,2}%\b/.test(t) || t.includes('diskon') || t.includes('promo') || t.includes('cashback')) {
    return true;
  }

  // 2. Cek keyword blacklist
  if (PROMO_KEYWORDS.some(kw => t.includes(kw))) {
    return true;
  }

  // 3. Wajib ada setidaknya 1 kata kunci transaksi yang sah
  const hasLegitKeyword = TRANSACTION_WHITELIST.some(kw => t.includes(kw));
  if (!hasLegitKeyword) {
    return true; // Tolak jika tidak ada indikasi transaksi nyata
  }

  return false;
};

/**
 * M-Banking & E-Wallet Regex Parser
 * Extracts: Amount, Type, Source, Merchant/Target
 */
export const parseFinancialNotification = (packageName, title, text) => {
  const fullText = `${title || ''} ${text || ''}`.toLowerCase().trim();
  if (!fullText) return null;

  const pkg = (packageName || '').toLowerCase();

  // Filter out promo, iklan, atau notifikasi non-transaksi
  if (isPromoOrNonTransaction(fullText)) {
    return null;
  }
  
  // 1. Identify Source based on Package Name or text
  let source = 'E-Wallet';
  if (pkg.includes('bca') || fullText.includes('bca')) source = 'BCA';
  else if (pkg.includes('mandiri') || pkg.includes('livin') || fullText.includes('mandiri') || fullText.includes('livin')) source = 'Mandiri';
  else if (pkg.includes('bri') || pkg.includes('brimo') || fullText.includes('bri') || fullText.includes('brimo')) source = 'BRImo';
  else if (pkg.includes('bni') || pkg.includes('wondr') || fullText.includes('bni') || fullText.includes('wondr')) source = 'BNI';
  else if (pkg.includes('gojek') || pkg.includes('gopay') || fullText.includes('gopay')) source = 'GoPay';
  else if (pkg.includes('ovo') || fullText.includes('ovo')) source = 'OVO';
  else if (pkg.includes('dana') || fullText.includes('dana')) source = 'DANA';
  else if (pkg.includes('shopee') || fullText.includes('shopeepay')) source = 'ShopeePay';
  else if (pkg.includes('seabank') || fullText.includes('seabank')) source = 'SeaBank';
  else if (pkg.includes('jago') || fullText.includes('bank jago')) source = 'Bank Jago';
  else if (pkg.includes('jenius') || fullText.includes('jenius')) source = 'Jenius';
  else if (pkg.includes('bsi') || fullText.includes('bsi')) source = 'BSI';
  else if (pkg.includes('cimb') || pkg.includes('octo') || fullText.includes('octo')) source = 'CIMB Niaga';
  else if (pkg.includes('permata') || fullText.includes('permata')) source = 'Permata';
  else if (pkg.includes('danamon') || fullText.includes('danamon')) source = 'Danamon';

  // 2. Determine Transaction Type (Income vs Expense)
  let type = 'expense';
  if (
    fullText.includes('terima') || 
    fullText.includes('masuk') || 
    fullText.includes('top up') || 
    fullText.includes('topup') || 
    fullText.includes('cash in') || 
    fullText.includes('dikirim oleh') ||
    fullText.includes('transfer dari') ||
    fullText.includes('dana masuk') ||
    fullText.includes('bertambah') ||
    fullText.includes('cr')
  ) {
    if (!fullText.includes('ke instansi') && !fullText.includes('transfer ke') && !fullText.includes('bayar ke')) {
      type = 'income';
    }
  }

  // 3. Extract Amount using Regex
  let amount = 0;
  const amountRegex = /(?:rp|idr|idr\.|rp\.)\s*([0-9]{1,3}(?:[.,][0-9]{3})+|[0-9]+)/i;
  const matchAmount = fullText.match(amountRegex);
  
  if (matchAmount && matchAmount[1]) {
    amount = parseInt(matchAmount[1].replace(/[.,]/g, ''), 10);
  } else {
    // Fallback: look for amount near indicator words
    const numberRegex = /(?:sebesar|nominal|jumlah|total|bayar|transfer)\s*([0-9]{1,3}(?:\.[0-9]{3})+)/i;
    const matchNum = fullText.match(numberRegex);
    if (matchNum && matchNum[1]) {
      amount = parseInt(matchNum[1].replace(/\./g, ''), 10);
    }
  }

  if (amount <= 0) return null; // Ignore non-financial notifications

  // 4. Extract Merchant or Target Name (Heuristics)
  let merchant = '';
  const tfToRegex = /(?:transfer ke|pembayaran ke|bayar di|merchant|qris bayar|pembayaran qris|ke|di|tujuan)\s+([a-z0-9\s*\-.,]+?)(?:\s*(?:sebesar|rp|idr|berhasil|sukses|pada|\.|$))/i;
  const matchTarget = fullText.match(tfToRegex);
  if (matchTarget && matchTarget[1]) {
    merchant = matchTarget[1].trim();
    if (merchant.endsWith('sebesar')) merchant = merchant.replace('sebesar', '').trim();
  } else if (type === 'income') {
    const fromRegex = /(?:dari|pengirim|terima dari)\s+([a-z0-9\s*]+)(?:\s*(?:sebesar|rp|idr|berhasil|sukses|pada|\.|$))/i;
    const matchFrom = fullText.match(fromRegex);
    if (matchFrom && matchFrom[1]) {
      merchant = 'dari ' + matchFrom[1].trim();
      if (merchant.endsWith('sebesar')) merchant = merchant.replace('sebesar', '').trim();
    }
  }

  // Fallback nama transaksi jika merchant tidak ditemukan di teks notifikasi
  if (!merchant || merchant.toLowerCase() === 'transaksi otomatis' || merchant.toLowerCase() === source.toLowerCase()) {
    if (fullText.includes('qris')) {
      merchant = `QRIS ${source}`;
    } else if (fullText.includes('transfer')) {
      merchant = `Transfer ${source}`;
    } else if (fullText.includes('pembelian') || fullText.includes('bayar')) {
      merchant = `Pembayaran ${source}`;
    } else {
      merchant = `Transaksi ${source}`;
    }
  }
  
  // 5. Guess Category based on Merchant Name
  let guessedCategory = type === 'expense' ? 'Lainnya' : 'Bonus';
  if (type === 'expense') {
    const m = merchant.toLowerCase();
    if (m.includes('ayam') || m.includes('nasi') || m.includes('kopi') || m.includes('makan') || m.includes('warung') || m.includes('resto') || m.includes('food') || m.includes('minum') || m.includes('cafe')) {
      guessedCategory = 'Food';
    } else if (m.includes('gojek') || m.includes('grab') || m.includes('maxim') || m.includes('ojek') || m.includes('transport') || m.includes('krl') || m.includes('mrt')) {
      guessedCategory = 'Transport';
    } else if (m.includes('pulsa') || m.includes('paket data') || m.includes('kuota') || m.includes('telkomsel') || m.includes('indosat') || m.includes('xl')) {
      guessedCategory = 'Internet';
    } else if (m.includes('alfamart') || m.includes('indomaret') || m.includes('superindo') || m.includes('minimarket')) {
      guessedCategory = 'Groceries';
    } else if (m.includes('pln') || m.includes('listrik') || m.includes('pdam') || m.includes('air')) {
      guessedCategory = 'Bills';
    }
  }

  return {
    amount,
    type,
    account: source,
    category: guessedCategory,
    title: merchant.substring(0, 30),
    note: `[Auto-Track] ${title || source}`,
    date: new Date().toISOString().split('T')[0]
  };
};

/**
 * Handle Pending Notifications from Service
 */
export const processPendingNotifications = async (onNewTransactions) => {
  try {
    const permission = await NotificationTracker.checkPermission();
    if (!permission.granted) return;

    const { notifications } = await NotificationTracker.getPendingNotifications();
    if (!notifications || notifications.length === 0) return;

    const newTx = [];
    for (const notif of notifications) {
      const parsed = parseFinancialNotification(notif.packageName, notif.title, notif.text);
      if (parsed) {
        newTx.push({
          ...parsed,
          id: `auto_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          timestamp: notif.time || Date.now()
        });
      }
    }

    if (newTx.length > 0 && typeof onNewTransactions === 'function') {
      onNewTransactions(newTx);
    }
  } catch (error) {
    console.error('AutoExpense Tracker Error:', error);
  }
};

/**
 * Init background listener sync when app opens
 */
export const initAutoExpenseTracker = (onNewTransactions) => {
  // Sync on startup
  processPendingNotifications(onNewTransactions);

  // Sync whenever app comes to foreground
  App.addListener('appStateChange', ({ isActive }) => {
    if (isActive) {
      processPendingNotifications(onNewTransactions);
    }
  });
};

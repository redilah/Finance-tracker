/**
 * Cassiel Notification Auto Tracker — Provider Registry & Parsers
 * 
 * Modular provider detection and transaction parsing for Indonesian
 * banks and e-wallets. Each provider has its own parser with:
 * - Supported package names
 * - Transaction pattern rules
 * - Amount extraction with balance exclusion
 * - Debit/credit detection
 * - Merchant extraction
 * - Confidence scoring
 */

// ─── PACKAGE NAME → PROVIDER MAPPING ────────────────────────────────────────

const PROVIDER_REGISTRY = [
  {
    id: 'bri',
    name: 'BRImo',
    accountName: 'BRImo',
    packageNames: ['id.co.bri.brimo'],
  },
  {
    id: 'bca',
    name: 'BCA',
    accountName: 'BCA',
    packageNames: ['com.bca', 'com.bca.mybca.mobile', 'com.bca.mybca', 'com.bca.klikbca'],
  },
  {
    id: 'mandiri',
    name: "Livin' by Mandiri",
    accountName: "Livin' by Mandiri",
    packageNames: ['com.bankmandiri.mandirionline', 'com.bankmandiri.livin'],
  },
  {
    id: 'bni',
    name: 'Wondr by BNI',
    accountName: 'Wondr by BNI',
    packageNames: ['id.co.bni.net.banking', 'id.co.bni.wondr'],
  },
  {
    id: 'bsi',
    name: 'BSI',
    accountName: 'BSI',
    packageNames: ['com.bsm.activity2', 'id.co.bankbsi.mobile', 'id.co.bankbsi.superapp'],
  },
  {
    id: 'dana',
    name: 'DANA',
    accountName: 'DANA',
    packageNames: ['id.dana'],
  },
  {
    id: 'gopay',
    name: 'GoPay',
    accountName: 'GoPay',
    packageNames: ['com.gojek.gopay', 'com.gojek.app'],
  },
  {
    id: 'ovo',
    name: 'OVO',
    accountName: 'OVO',
    packageNames: ['ovo.id'],
  },
  {
    id: 'shopeepay',
    name: 'ShopeePay',
    accountName: 'ShopeePay',
    packageNames: ['com.shopee.id', 'com.shopeepay.id'],
  },
  {
    id: 'linkaja',
    name: 'LinkAja',
    accountName: 'LinkAja',
    packageNames: ['com.telkom.mwallet'],
  },
  {
    id: 'seabank',
    name: 'SeaBank',
    accountName: 'SeaBank',
    packageNames: ['com.seabank.id'],
  },
  {
    id: 'jago',
    name: 'Bank Jago',
    accountName: 'Jago',
    packageNames: ['com.jfriau.bankjago', 'com.bankjago.app'],
  },
  {
    id: 'jenius',
    name: 'Jenius',
    accountName: 'Jenius',
    packageNames: ['com.btpn.dc'],
  },
  {
    id: 'cimb',
    name: 'CIMB Niaga',
    accountName: 'CIMB Niaga',
    packageNames: ['com.cimbniaga.mobile.android'],
  },
  {
    id: 'permata',
    name: 'Permata',
    accountName: 'Permata',
    packageNames: ['net.myinfosys.PermataMobileX'],
  },
  {
    id: 'maybank',
    name: 'Maybank',
    accountName: 'Maybank',
    packageNames: ['com.maybankindo.maybank2u'],
  },
  {
    id: 'bpddiy',
    name: 'BPD DIY',
    accountName: 'BPD DIY',
    packageNames: ['id.co.bankbpd.diy.mobile'],
  },
  {
    id: 'btn',
    name: 'BTN Mobile',
    accountName: 'bale by btn',
    packageNames: ['id.co.btn.mobile', 'id.co.btn.superapp'],
  },
  {
    id: 'blu',
    name: 'blu',
    accountName: 'blu',
    packageNames: ['bcadigital.blubybcadigital', 'com.bcadigital.blu'],
  },
  {
    id: 'neobank',
    name: 'Neobank',
    accountName: 'Neobank',
    packageNames: ['com.bnc.finance', 'com.bankneo.mobile'],
  },
  {
    id: 'allobank',
    name: 'Allo Bank',
    accountName: 'Allo Bank',
    packageNames: ['id.allobank.mobile', 'com.allobank.app'],
  },
  {
    id: 'linebank',
    name: 'Line Bank',
    accountName: 'Line Bank',
    packageNames: ['com.linecorp.linebank.id'],
  },
  {
    id: 'superbank',
    name: 'Superbank',
    accountName: 'Superbank',
    packageNames: ['id.superbank.app', 'com.superbank.mobile'],
  },
  {
    id: 'krom',
    name: 'Krom Bank',
    accountName: 'Krom Bank',
    packageNames: ['id.co.krom.app'],
  },
  {
    id: 'astrapay',
    name: 'AstraPay',
    accountName: 'AstraPay',
    packageNames: ['com.astrapay.app'],
  },
  {
    id: 'isaku',
    name: 'i.saku',
    accountName: 'i.saku',
    packageNames: ['com.indomarco.isaku'],
  },
  {
    id: 'doku',
    name: 'DOKU',
    accountName: 'DOKU',
    packageNames: ['com.dokuwallet.android'],
  },
  {
    id: 'paypal',
    name: 'PayPal',
    accountName: 'PayPal',
    packageNames: ['com.paypal.android.p2pmobile'],
  },
];

// Build fast lookup map: packageName → provider
const PACKAGE_TO_PROVIDER = {};
for (const provider of PROVIDER_REGISTRY) {
  for (const pkg of provider.packageNames) {
    PACKAGE_TO_PROVIDER[pkg] = provider;
  }
}

/**
 * Detect provider from notification package name or app label.
 * Returns provider object or fallback financial provider.
 */
export function detectProvider(packageName, appLabel = '') {
  if (!packageName && !appLabel) return null;

  // 1. Direct package map lookup
  if (packageName && PACKAGE_TO_PROVIDER[packageName]) {
    return PACKAGE_TO_PROVIDER[packageName];
  }

  const lowerPkg = (packageName || '').toLowerCase();
  const lowerLabel = (appLabel || '').toLowerCase();

  // 2. Keyword heuristic matching against known providers
  for (const provider of PROVIDER_REGISTRY) {
    if (provider.id && (lowerPkg.includes(provider.id) || lowerLabel.includes(provider.id))) {
      return provider;
    }
    const nameLower = provider.name.toLowerCase();
    if (lowerPkg.includes(nameLower) || lowerLabel.includes(nameLower)) {
      return provider;
    }
    if (provider.accountName) {
      const accLower = provider.accountName.toLowerCase();
      if (lowerPkg.includes(accLower) || lowerLabel.includes(accLower)) {
        return provider;
      }
    }
  }

  // 3. Dynamic fallback for any bank or wallet notification
  if (
    lowerPkg.includes('bank') || lowerPkg.includes('pay') || lowerPkg.includes('wallet') ||
    lowerPkg.includes('finance') || lowerPkg.includes('money') || lowerPkg.includes('transfer') ||
    lowerLabel.includes('bank') || lowerLabel.includes('pay') || lowerLabel.includes('wallet')
  ) {
    return {
      id: 'generic_bank',
      name: appLabel || 'Bank',
      accountName: appLabel || 'Bank',
      packageNames: packageName ? [packageName] : []
    };
  }

  return null;
}

/**
 * Get all known financial package names (for native-side whitelist sync).
 */
export function getAllFinancialPackageNames() {
  return Object.keys(PACKAGE_TO_PROVIDER);
}

// ─── AMOUNT PARSING UTILITIES ───────────────────────────────────────────────

/**
 * Patterns indicating an amount is a BALANCE (should be excluded from transaction).
 */
const BALANCE_CONTEXT_PATTERNS = [
  /\bsaldo\s*(?:akhir|saat\s*ini|tersedia|sekarang|total|rekening|anda|kamu|mu)?\b/i,
  /\b(?:sisa|total)\s*saldo\b/i,
  /\ba\/c\s*balance\b/i,
  /\b(?:current|available|remaining)\s*balance\b/i,
  /\blimit\b/i,
  /\btagihan\b/i,
  /\bvoucher\b/i,
];

/**
 * Patterns indicating the notification is NOT a transaction.
 */
const NON_TRANSACTION_PATTERNS = [
  /\b(promo|diskon|voucher|kupon|coupon|reward|poin|point)\b/i,
  /\b(otp|kode\s*verifikasi|verification\s*code|one.?time.?password)\b/i,
  /\b(tagihan\s*(?:bulan|anda|kamu)|billing\s*reminder|jatuh\s*tempo)\b/i,
  /\b(limit\s*(?:kartu|kredit|harian)|daily\s*limit)\b/i,
  /\b(iklan|advertisement|penawaran\s*spesial|special\s*offer)\b/i,
  /\b(login|masuk\s*ke\s*akun|sign\s*in|verifikasi\s*perangkat)\b/i,
  /\b(update\s*aplikasi|pemeliharaan|maintenance)\b/i,
];

/**
 * Patterns indicating a real transaction signal exists.
 */
const TRANSACTION_SIGNAL_PATTERNS = [
  // Debit / Expense signals
  /(?:debit|debet|pendebetan|didebit|didebet)/i,
  /(?:pembayaran|bayar|membayar|dibayar|dibayarkan|terbayar|payment|paid|pay)/i,
  /(?:pembelian|belanja|berbelanja|purchase|beli|membeli|dibeli)/i,
  /(?:transfer|mentransfer|ditransfer|m-transfer|trsf)/i,
  /(?:tarik\s*tunai|penarikan|withdrawal|menarik|ditarik|tarik)/i,
  /(?:kirim|mengirim|dikirim|pengiriman|terkirim|sent|send)/i,
  // Credit / Income signals
  /(?:kredit|credit|pengkreditan|dikreditkan)/i,
  /(?:terima|menerima|diterima|penerimaan|received|receive)/i,
  /(?:dana\s*masuk|uang\s*masuk|saldo\s*masuk|masuk\s*ke\s*rekening|money\s*in)/i,
  /(?:dana\s*keluar|uang\s*keluar|saldo\s*keluar|terpotong|pemotongan|dipotong|money\s*out)/i,
  /(?:top\s*up|topup|isi\s*saldo|tambah\s*saldo|saldo\s*bertambah|bertambah)/i,
  // Generic execution success signals
  /(?:berhasil|sukses|success|completed|confirmed|tercatat|selesai)/i,
  /(?:transaksi\s*(?:berhasil|sukses|selesai|debit|debet|kredit|sebesar|keluar|masuk|qris|ke|dari)|\btransaksi\s+rp\b|qris|bi-fast|bifast)/i,
];

/**
 * Expense (debit) keyword patterns.
 */
const EXPENSE_PATTERNS = [
  /(?:debit|debet|pendebetan|didebit|didebet)/i,
  /(?:pembayaran|bayar|membayar|dibayar|dibayarkan|terbayar|payment|pay|paid)/i,
  /(?:pembelian|belanja|berbelanja|purchase|beli|membeli|dibeli)/i,
  /(?:transfer\s*(?:keluar|ke\b)|mentransfer|ditransfer|transfer\s*berhasil|transfer\s*sukses|m-transfer|trsf)/i,
  /(?:tarik\s*tunai|penarikan|withdrawal|menarik|ditarik|tarik)/i,
  /(?:kirim|mengirim|dikirim|pengiriman|terkirim|sent|send)/i,
  /(?:pengeluaran|uang\s*keluar|dana\s*keluar|saldo\s*keluar|terpotong|dipotong|pemotongan|potong\s*saldo)/i,
  /(?:qris|belanja\s*di|merchant|money\s*out)/i,
  /(?:kantong.*terpotong|bayar\s*ke|membayar.*ke)/i,
];

/**
 * Income (credit) keyword patterns.
 */
const INCOME_PATTERNS = [
  /(?:kredit|credit|pengkreditan|dikreditkan)/i,
  /(?:terima|menerima|diterima|penerimaan|received|receive)/i,
  /(?:transfer\s*(?:masuk|dari\b)|terima\s*transfer|ditransfer\s*dari|ditransfer\s*oleh)/i,
  /(?:dana\s*masuk|uang\s*masuk|saldo\s*masuk|masuk\s*ke\s*rekening|money\s*in)/i,
  /(?:pemasukan|pendapatan|penghasilan|gaji|payroll|salary|upah|honor|bonus|thr|komisi|affiliate)/i,
  /(?:top\s*up|topup|isi\s*saldo|tambah\s*saldo|saldo\s*bertambah|bertambah)/i,
  /(?:cashback|refund|pengembalian\s*dana|reimbursement)/i,
];

/**
 * Parse Indonesian Rupiah amount strings.
 * Handles: Rp25.000, Rp 25,000, IDR 25000, Rp1.250.000,00, etc.
 * Returns numeric amount or null.
 */
function parseRupiahAmount(text) {
  if (!text) return null;
  const matches = text.match(/(?:Rp\.?|IDR)\s*([\d.,]+)/gi);
  if (!matches) return null;

  const results = [];
  for (const match of matches) {
    const numStr = match.replace(/(?:Rp\.?|IDR)\s*/i, '').trim();
    let cleaned = numStr;
    cleaned = cleaned.replace(/[,.]\d{1,2}$/, '');
    if (/^\d{1,3}(\.\d{3})+$/.test(cleaned)) {
      cleaned = cleaned.replace(/\./g, '');
    } else if (/^\d{1,3}(,\d{3})+$/.test(cleaned)) {
      cleaned = cleaned.replace(/,/g, '');
    }
    cleaned = cleaned.replace(/[^\d]/g, '');
    const amount = parseInt(cleaned, 10);
    if (!isNaN(amount) && amount > 0) {
      results.push(amount);
    }
  }
  return results;
}

/**
 * Extract raw numeric amounts from text (fallback for notifications
 * that don't use Rp/IDR prefix).
 * Only matches standalone large numbers (>= 1000).
 */
function parseRawAmount(text) {
  if (!text) return null;
  const matches = text.match(/\b(\d{1,3}(?:[.,]\d{3})+(?:[.,]\d{1,2})?|\d{4,}(?:[.,]\d{1,2})?)\b/g);
  if (!matches) return null;
  const results = [];
  for (const match of matches) {
    let cleaned = match;
    cleaned = cleaned.replace(/[,.]\d{1,2}$/, '');
    if (/^\d{1,3}(\.\d{3})+$/.test(cleaned)) {
      cleaned = cleaned.replace(/\./g, '');
    } else if (/^\d{1,3}(,\d{3})+$/.test(cleaned)) {
      cleaned = cleaned.replace(/,/g, '');
    }
    cleaned = cleaned.replace(/[^\d]/g, '');
    const amount = parseInt(cleaned, 10);
    if (!isNaN(amount) && amount >= 1000) {
      results.push(amount);
    }
  }
  return results.length > 0 ? results : null;
}

/**
 * CRITICAL: Extract the TRANSACTION amount, excluding balance amounts.
 * 
 * Strategy:
 * 1. Find all amounts with Rp/IDR prefix
 * 2. For each amount, inspect preceding text within clause (up to preceding punctuation/separator)
 * 3. Exclude amounts preceded by balance keywords (e.g. "Saldo:", "Saldo akhir Rp...")
 * 4. Prioritize amounts preceded by transaction keywords ("Debet sebesar Rp...", "Pembayaran Rp...")
 */
export function extractTransactionAmount(fullText) {
  if (!fullText) return null;

  // Find all Rp/IDR amounts with their positions
  const amountRegex = /(?:Rp\.?|IDR)\s*([\d.,]+)/gi;
  let match;
  const candidates = [];

  while ((match = amountRegex.exec(fullText)) !== null) {
    const numStr = match[1].trim();
    let cleaned = numStr;
    cleaned = cleaned.replace(/[,.]\d{1,2}$/, '');
    if (/^\d{1,3}(\.\d{3})+$/.test(cleaned)) {
      cleaned = cleaned.replace(/\./g, '');
    } else if (/^\d{1,3}(,\d{3})+$/.test(cleaned)) {
      cleaned = cleaned.replace(/,/g, '');
    }
    cleaned = cleaned.replace(/[^\d]/g, '');
    const amount = parseInt(cleaned, 10);
    if (isNaN(amount) || amount <= 0) continue;

    // Isolate preceding clause (up to 50 characters immediately before the match, bounded by punctuation / clause boundary)
    const rawBefore = fullText.substring(Math.max(0, match.index - 50), match.index);
    // Find the last clause delimiter (. ; ! \n | or comma followed by space)
    let lastPunctuation = -1;
    for (let i = rawBefore.length - 1; i >= 0; i--) {
      const ch = rawBefore[i];
      if (ch === '.' || ch === ';' || ch === '!' || ch === '\n' || ch === '|') {
        lastPunctuation = i;
        break;
      }
      if (ch === ',' && i < rawBefore.length - 1 && /\s/.test(rawBefore[i + 1])) {
        lastPunctuation = i;
        break;
      }
    }

    const clauseBefore = (lastPunctuation !== -1 ? rawBefore.substring(lastPunctuation + 1) : rawBefore).toLowerCase().trim();

    // Check if this specific amount is preceded by balance keywords
    let isBalance = false;
    for (const pattern of BALANCE_CONTEXT_PATTERNS) {
      if (pattern.test(clauseBefore)) {
        isBalance = true;
        break;
      }
    }

    if (/bertambah|ditambahkan|masuk/i.test(clauseBefore)) {
      isBalance = false;
    }

    // Check if this specific amount is preceded by transaction keywords
    let isTransaction = false;
    if (/debit|debet|kredit|credit|bayar|membayar|dibayar|pembayaran|sebesar|nominal|total|kirim|mengirim|tarik|belanja|beli|top\s*up|bertambah|masuk|ditambahkan|ke\b/i.test(clauseBefore)) {
      isTransaction = true;
    }

    // Check sentence containing the match for general transaction signals
    const sentenceStart = Math.max(0, match.index - 60);
    const sentenceEnd = Math.min(fullText.length, match.index + match[0].length + 60);
    const sentence = fullText.substring(sentenceStart, sentenceEnd).toLowerCase();

    candidates.push({
      amount,
      position: match.index,
      isBalance,
      isTransaction,
      clauseBefore,
      sentence,
    });
  }

  if (candidates.length === 0) return null;

  // Priority 1: Non-balance amount explicitly preceded by transaction keyword
  const txAmounts = candidates.filter(c => !c.isBalance && c.isTransaction);
  if (txAmounts.length > 0) {
    return txAmounts[0].amount;
  }

  // Priority 2: Any non-balance amount
  const nonBalanceAmounts = candidates.filter(c => !c.isBalance);
  if (nonBalanceAmounts.length > 0) {
    return nonBalanceAmounts[0].amount;
  }

  // Priority 3: If ALL amounts are flagged as balance → return null (balance-only notification)
  return null;
}

// ─── TRANSACTION TYPE DETECTION ─────────────────────────────────────────────

/**
 * Detect if notification describes an expense or income.
 * Returns 'expense', 'income', or null (ambiguous).
 */
export function detectTransactionType(fullText) {
  if (!fullText) return null;
  const text = fullText.toLowerCase();

  let expenseScore = 0;
  let incomeScore = 0;

  for (const pattern of EXPENSE_PATTERNS) {
    if (pattern.test(text)) expenseScore++;
  }

  for (const pattern of INCOME_PATTERNS) {
    if (pattern.test(text)) incomeScore++;
  }

  if (expenseScore > 0 && expenseScore > incomeScore) return 'expense';
  if (incomeScore > 0 && incomeScore > expenseScore) return 'income';
  if (expenseScore > 0 && expenseScore === incomeScore) {
    // Tie-break: "debit" / "bayar" is more definitively expense
    if (/(?:debit|debet|bayar|membayar|dibayar|kirim|keluar|beli)/i.test(text)) return 'expense';
    if (/(?:kredit|credit|terima|menerima|masuk)/i.test(text)) return 'income';
  }

  return null;
}

// ─── MERCHANT EXTRACTION ────────────────────────────────────────────────────

/**
 * Attempt to extract merchant name from notification text.
 * Returns merchant string or null (NEVER guesses).
 */
export function extractMerchant(fullText) {
  if (!fullText) return null;

  // Pattern: "merchant/toko: [Merchant]" or "ke/di/pada [Merchant]"
  const merchantPatterns = [
    /(?:merchant|toko|store|outlet|merchant\s*name)[:\s]+([A-Za-z0-9\s&.'()-]{2,40})/i,
    /(?:pembayaran\s*(?:sebesar\s*[^,\n]+)?\s*ke|bayar\s*(?:sebesar\s*[^,\n]+)?\s*ke|membayar\s*(?:sebesar\s*[^,\n]+|\s*rp\s*[\d.,]+)?\s*ke|transfer\s*(?:sebesar\s*[^,\n]+|\s*rp\s*[\d.,]+)?\s*ke|kirim\s*(?:sebesar\s*[^,\n]+|\s*rp\s*[\d.,]+)?\s*ke|ke|di|pada|at|to|from|dari)\s+([A-Za-z0-9\s&.'()-]{2,40})/i,
  ];

  const falsePositives = [
    'bank', 'rekening', 'anda', 'kamu', 'saldo', 'nomor', 'no', 'tanggal',
    'berhasil', 'sukses', 'gagal', 'error', 'info', 'notifikasi', 'transaksi',
    'sesama', 'tujuan', 'lain', 'pengguna', 'kantor', 'aplikasi', 'akun',
    'bca', 'bri', 'mandiri', 'dana', 'gopay', 'ovo', 'shopeepay', 'linkaja',
    'seabank', 'jago', 'jenius', 'cimb', 'permata', 'bsi', 'bni'
  ];

  for (const pattern of merchantPatterns) {
    const match = fullText.match(pattern);
    if (match && match[1]) {
      let merchant = match[1].trim();
      // Cut off at sentence endings or trailing metadata keywords
      merchant = merchant.split(/[.,;!?\n\r]/)[0].trim();
      // Clean trailing pocket / account references (e.g. Jago pocket ", Set", ", Kantong Utama")
      merchant = merchant.replace(/\s+(?:set|kantong.*|pocket.*|rekening.*|account.*)$/i, '').trim();
      merchant = merchant.replace(/\s+(berhasil|sukses|pada|sebesar|nominal|tgl|tanggal|jam|waktu|rp|idr|butuh|silakan)\b.*$/i, '').trim();
      // Strip leading account number digits if present (e.g. "1234567890 Budi" -> "Budi")
      merchant = merchant.replace(/^\d{4,}\s+/, '').trim();

      const merchantLower = merchant.toLowerCase();
      if (falsePositives.some(fp => merchantLower === fp || merchantLower.startsWith(fp + ' '))) {
        continue;
      }
      if (merchant.length >= 2 && merchant.length <= 50) {
        return merchant;
      }
    }
  }

  return null;
}

// ─── TRANSACTION SIGNAL DETECTION ───────────────────────────────────────────

/**
 * Check if notification text contains valid transaction signals.
 * Returns true if this looks like a real transaction notification.
 */
export function hasTransactionSignal(fullText) {
  if (!fullText) return false;
  for (const pattern of TRANSACTION_SIGNAL_PATTERNS) {
    if (pattern.test(fullText)) return true;
  }
  return false;
}

/**
 * Check if notification is non-transactional (promo, OTP, etc.).
 * Returns true if the notification should be IGNORED.
 */
export function isNonTransactional(fullText) {
  if (!fullText) return true;

  // Pure OTP/verification — always ignore
  if (/(?:otp|kode\s*verifikasi|verification\s*code)/i.test(fullText)) {
    return true;
  }

  // Check non-transaction patterns
  let nonTxScore = 0;
  let txScore = 0;

  for (const pattern of NON_TRANSACTION_PATTERNS) {
    if (pattern.test(fullText)) nonTxScore++;
  }
  for (const pattern of TRANSACTION_SIGNAL_PATTERNS) {
    if (pattern.test(fullText)) txScore++;
  }

  // If strong transaction signal AND non-tx signal, transaction wins
  // (e.g., "Pembayaran berhasil, cashback Rp5.000" → transaction)
  if (txScore >= 2) return false;
  if (nonTxScore > 0 && txScore === 0) return true;

  return false;
}

// ─── CONFIDENCE SCORING ─────────────────────────────────────────────────────

/**
 * Calculate confidence score for a parsed transaction.
 * Returns 0.0–1.0.
 */
export function calculateConfidence({ amount, type, hasSignal, provider, merchant }) {
  let score = 0;

  // Has valid amount (critical)
  if (amount && amount > 0) score += 0.3;

  // Has clear transaction type
  if (type === 'expense' || type === 'income') score += 0.2;

  // Has transaction signal keywords
  if (hasSignal) score += 0.2;

  // Came from recognized provider (package name match)
  if (provider) score += 0.2;

  // Has merchant info (bonus, not required)
  if (merchant) score += 0.1;

  return Math.min(1.0, score);
}

// ─── PROVIDER-SPECIFIC PARSERS ──────────────────────────────────────────────
// Each parser adds provider-specific heuristics on top of the generic pipeline.

/**
 * Bank Jago Parser
 * Common formats:
 * - "Kamu telah membayar Rp 15.000 ke Ayam Goreng Hj Toyib, Set. Butuh bantuan? Silakan Tanya Jago di 1500 746."
 * - "Kamu telah mengirim Rp 50.000 ke [Nama/Rekening]..."
 * - "Kamu menerima Rp 100.000 dari [Nama]..."
 * - "Uang masuk Rp 100.000 dari [Nama]..."
 * - "Pembayaran QRIS Rp 25.000 ke [Merchant] berhasil"
 */
function parseJago(normalized) {
  const text = normalized.fullText;
  const amount = extractTransactionAmount(text);
  if (!amount) return null;

  let type = detectTransactionType(text);
  if (!type) {
    if (/membayar|mengirim|terpotong|debit|qris|bayar/i.test(text)) type = 'expense';
    if (/menerima|uang\s*masuk|dana\s*masuk|top\s*up|kredit/i.test(text)) type = 'income';
  }
  if (!type) return null;

  const merchant = extractMerchant(text);
  const hasSignal = hasTransactionSignal(text);
  const confidence = calculateConfidence({ amount, type, hasSignal, provider: true, merchant });

  return { amount, type, merchant, confidence: Math.max(0.9, confidence), description: normalized.title || 'Bank Jago' };
}

/**
 * SeaBank Parser
 * Common formats:
 * - "Transfer berhasil! Rp 50.000 ke [Nama]..."
 * - "Kamu menerima transfer sebesar Rp 100.000 dari [Nama]..."
 * - "Pembayaran QRIS sebesar Rp 25.000 ke [Merchant] berhasil."
 */
function parseSeaBank(normalized) {
  const text = normalized.fullText;
  const amount = extractTransactionAmount(text);
  if (!amount) return null;

  let type = detectTransactionType(text);
  if (!type) {
    if (/transfer\s*keluar|pembayaran|qris|bayar|kirim/i.test(text)) type = 'expense';
    if (/terima|masuk|top\s*up/i.test(text)) type = 'income';
  }
  if (!type) return null;

  const merchant = extractMerchant(text);
  const hasSignal = hasTransactionSignal(text);
  const confidence = calculateConfidence({ amount, type, hasSignal, provider: true, merchant });

  return { amount, type, merchant, confidence: Math.max(0.9, confidence), description: normalized.title || 'SeaBank' };
}

/**
 * blu by BCA Digital Parser
 */
function parseBlu(normalized) {
  const text = normalized.fullText;
  const amount = extractTransactionAmount(text);
  if (!amount) return null;

  let type = detectTransactionType(text);
  if (!type) {
    if (/bayar|membayar|transfer|qris/i.test(text)) type = 'expense';
    if (/masuk|terima|top\s*up/i.test(text)) type = 'income';
  }
  if (!type) return null;

  const merchant = extractMerchant(text);
  const hasSignal = hasTransactionSignal(text);
  const confidence = calculateConfidence({ amount, type, hasSignal, provider: true, merchant });

  return { amount, type, merchant, confidence: Math.max(0.9, confidence), description: normalized.title || 'blu' };
}

/**
 * Jenius Parser
 */
function parseJenius(normalized) {
  const text = normalized.fullText;
  const amount = extractTransactionAmount(text);
  if (!amount) return null;

  let type = detectTransactionType(text);
  if (!type) {
    if (/membayar|mengirim|money\s*out|debit|debet/i.test(text)) type = 'expense';
    if (/menerima|money\s*in|kredit/i.test(text)) type = 'income';
  }
  if (!type) return null;

  const merchant = extractMerchant(text);
  const hasSignal = hasTransactionSignal(text);
  const confidence = calculateConfidence({ amount, type, hasSignal, provider: true, merchant });

  return { amount, type, merchant, confidence: Math.max(0.9, confidence), description: normalized.title || 'Jenius' };
}

/**
 * BRI / BRImo Parser
 * Common format: "Nasabah Yth. Debet sebesar Rp25.000 pada DD/MM HH:MM. Saldo: Rp1.250.000"
 * Also: "INFO BRI: Debit/Kredit sebesar Rpxxx"
 */
function parseBRI(normalized) {
  const text = normalized.fullText;
  const amount = extractTransactionAmount(text);
  if (!amount) return null;

  let type = detectTransactionType(text);
  // BRI-specific: "Debet" = expense, "Kredit" = income
  if (!type) {
    if (/debet|debit/i.test(text)) type = 'expense';
    else if (/kredit|credit/i.test(text)) type = 'income';
  }
  if (!type) return null;

  const merchant = extractMerchant(text);
  const hasSignal = hasTransactionSignal(text);
  const confidence = calculateConfidence({ amount, type, hasSignal, provider: true, merchant });

  return { amount, type, merchant, confidence: Math.max(0.85, confidence), description: normalized.title || 'BRImo' };
}

/**
 * BCA Parser
 * Common format: "Transaksi [Debit/Kredit] Rp xxx berhasil"
 */
function parseBCA(normalized) {
  const text = normalized.fullText;
  const amount = extractTransactionAmount(text);
  if (!amount) return null;

  let type = detectTransactionType(text);
  if (!type) {
    if (/debit|debet|transfer\s*ke|bayar|qris|m-transfer/i.test(text)) type = 'expense';
    if (/kredit|credit|transfer\s*dari|masuk/i.test(text)) type = 'income';
  }
  if (!type) return null;

  const merchant = extractMerchant(text);
  const hasSignal = hasTransactionSignal(text);
  const confidence = calculateConfidence({ amount, type, hasSignal, provider: true, merchant });

  return { amount, type, merchant, confidence: Math.max(0.85, confidence), description: normalized.title || 'BCA' };
}

/**
 * Mandiri / Livin' Parser
 * Common format: "Transfer Berhasil Rp[Nominal] ke [Nama/Rekening]"
 */
function parseMandiri(normalized) {
  const text = normalized.fullText;
  const amount = extractTransactionAmount(text);
  if (!amount) return null;

  let type = detectTransactionType(text);
  if (!type) {
    // Mandiri: "Transfer Berhasil" without explicit debit/credit → expense (sending)
    if (/transfer\s*berhasil/i.test(text)) type = 'expense';
    if (/pembayaran\s*berhasil/i.test(text)) type = 'expense';
    if (/dana\s*masuk|terima/i.test(text)) type = 'income';
  }
  if (!type) return null;

  const merchant = extractMerchant(text);
  const hasSignal = hasTransactionSignal(text);
  const confidence = calculateConfidence({ amount, type, hasSignal, provider: true, merchant });

  return { amount, type, merchant, confidence: Math.max(0.85, confidence), description: normalized.title || "Livin'" };
}

/**
 * BNI / Wondr Parser
 */
function parseBNI(normalized) {
  const text = normalized.fullText;
  const amount = extractTransactionAmount(text);
  if (!amount) return null;

  let type = detectTransactionType(text);
  if (!type) {
    if (/debit|debet|qris|bayar|transfer\s*keluar|transfer\s*ke/i.test(text)) type = 'expense';
    if (/kredit|credit|transfer\s*masuk|masuk/i.test(text)) type = 'income';
  }
  if (!type) return null;

  const merchant = extractMerchant(text);
  const hasSignal = hasTransactionSignal(text);
  const confidence = calculateConfidence({ amount, type, hasSignal, provider: true, merchant });

  return { amount, type, merchant, confidence: Math.max(0.85, confidence), description: normalized.title || 'Wondr by BNI' };
}

/**
 * BSI Parser
 */
function parseBSI(normalized) {
  const text = normalized.fullText;
  const amount = extractTransactionAmount(text);
  if (!amount) return null;

  let type = detectTransactionType(text);
  if (!type) {
    if (/debet|debit|bayar|transfer\s*ke|qris/i.test(text)) type = 'expense';
    if (/kredit|credit|masuk/i.test(text)) type = 'income';
  }
  if (!type) return null;

  const merchant = extractMerchant(text);
  const hasSignal = hasTransactionSignal(text);
  const confidence = calculateConfidence({ amount, type, hasSignal, provider: true, merchant });

  return { amount, type, merchant, confidence: Math.max(0.85, confidence), description: normalized.title || 'BSI' };
}

/**
 * DANA Parser
 * Common format: "Pembayaran Berhasil Rp[Nominal] ke [Merchant]"
 */
function parseDANA(normalized) {
  const text = normalized.fullText;
  const amount = extractTransactionAmount(text);
  if (!amount) return null;

  let type = detectTransactionType(text);
  if (!type) {
    if (/pembayaran|bayar|kirim|membayar/i.test(text)) type = 'expense';
    if (/terima|masuk|top\s*up/i.test(text)) type = 'income';
  }
  if (!type) return null;

  const merchant = extractMerchant(text);
  const hasSignal = hasTransactionSignal(text);
  const confidence = calculateConfidence({ amount, type, hasSignal, provider: true, merchant });

  return { amount, type, merchant, confidence: Math.max(0.85, confidence), description: normalized.title || 'DANA' };
}

/**
 * GoPay Parser
 * Common format: "Berhasil dibayar Rp[Nominal]" or "Transfer sukses Rp[Nominal]"
 */
function parseGoPay(normalized) {
  const text = normalized.fullText;
  const amount = extractTransactionAmount(text);
  if (!amount) return null;

  let type = detectTransactionType(text);
  if (!type) {
    if (/dibayar|bayar|kirim|membayar/i.test(text)) type = 'expense';
    if (/terima|masuk|top\s*up/i.test(text)) type = 'income';
  }
  if (!type) return null;

  const merchant = extractMerchant(text);
  const hasSignal = hasTransactionSignal(text);
  const confidence = calculateConfidence({ amount, type, hasSignal, provider: true, merchant });

  return { amount, type, merchant, confidence: Math.max(0.85, confidence), description: normalized.title || 'GoPay' };
}

/**
 * OVO Parser
 * Common format: "Pembayaran Berhasil Rp[Nominal]"
 */
function parseOVO(normalized) {
  const text = normalized.fullText;
  const amount = extractTransactionAmount(text);
  if (!amount) return null;

  let type = detectTransactionType(text);
  if (!type) {
    if (/pembayaran|bayar|kirim|belanja|membayar/i.test(text)) type = 'expense';
    if (/terima|masuk|top\s*up/i.test(text)) type = 'income';
  }
  if (!type) return null;

  const merchant = extractMerchant(text);
  const hasSignal = hasTransactionSignal(text);
  const confidence = calculateConfidence({ amount, type, hasSignal, provider: true, merchant });

  return { amount, type, merchant, confidence: Math.max(0.85, confidence), description: normalized.title || 'OVO' };
}

/**
 * ShopeePay Parser
 * Common format: "Pembayaran Dikonfirmasi Rp[Nominal]"
 */
function parseShopeePay(normalized) {
  const text = normalized.fullText;
  const amount = extractTransactionAmount(text);
  if (!amount) return null;

  let type = detectTransactionType(text);
  if (!type) {
    if (/dikonfirmasi|pembayaran|bayar|kirim|membayar/i.test(text)) type = 'expense';
    if (/terima|masuk|top\s*up/i.test(text)) type = 'income';
  }
  if (!type) return null;

  const merchant = extractMerchant(text);
  const hasSignal = hasTransactionSignal(text);
  const confidence = calculateConfidence({ amount, type, hasSignal, provider: true, merchant });

  return { amount, type, merchant, confidence: Math.max(0.85, confidence), description: normalized.title || 'ShopeePay' };
}

/**
 * Generic Bank Parser — fallback for recognized bank providers without specific rules
 */
function parseGenericBank(normalized) {
  const text = normalized.fullText;
  const amount = extractTransactionAmount(text);
  if (!amount) return null;

  let type = detectTransactionType(text);
  if (!type) {
    if (/bayar|membayar|dibayar|kirim|keluar|beli|transfer/i.test(text)) type = 'expense';
    if (/terima|menerima|masuk|kredit|top\s*up/i.test(text)) type = 'income';
  }
  if (!type) return null;

  const merchant = extractMerchant(text);
  const hasSignal = hasTransactionSignal(text);
  const confidence = calculateConfidence({ amount, type, hasSignal, provider: true, merchant });
  const adjustedConfidence = Math.max(0.75, confidence);

  return { amount, type, merchant, confidence: adjustedConfidence, description: normalized.title || normalized.appLabel || 'Bank' };
}

/**
 * Generic E-Wallet Parser — fallback for recognized e-wallet providers
 */
function parseGenericEWallet(normalized) {
  const text = normalized.fullText;
  const amount = extractTransactionAmount(text);
  if (!amount) return null;

  let type = detectTransactionType(text);
  if (!type) {
    if (/pembayaran|bayar|membayar|dibayar|kirim|belanja|paid|pay|sent|send/i.test(text)) type = 'expense';
    if (/terima|menerima|masuk|top\s*up|received/i.test(text)) type = 'income';
  }
  if (!type) return null;

  const merchant = extractMerchant(text);
  const hasSignal = hasTransactionSignal(text);
  const confidence = calculateConfidence({ amount, type, hasSignal, provider: true, merchant });
  const adjustedConfidence = Math.max(0.75, confidence);

  return { amount, type, merchant, confidence: adjustedConfidence, description: normalized.title || normalized.appLabel || 'E-Wallet' };
}

// ─── PARSER DISPATCH ────────────────────────────────────────────────────────

const PROVIDER_PARSERS = {
  bri: parseBRI,
  bca: parseBCA,
  mandiri: parseMandiri,
  bni: parseBNI,
  bsi: parseBSI,
  dana: parseDANA,
  gopay: parseGoPay,
  ovo: parseOVO,
  shopeepay: parseShopeePay,
  linkaja: parseGenericEWallet,
  seabank: parseSeaBank,
  jago: parseJago,
  jenius: parseJenius,
  cimb: parseGenericBank,
  permata: parseGenericBank,
  maybank: parseGenericBank,
  bpddiy: parseGenericBank,
  btn: parseGenericBank,
  blu: parseBlu,
  neobank: parseGenericBank,
  allobank: parseGenericBank,
  linebank: parseGenericBank,
  superbank: parseGenericBank,
  krom: parseGenericBank,
  astrapay: parseGenericEWallet,
  isaku: parseGenericEWallet,
  doku: parseGenericEWallet,
  paypal: parseGenericEWallet,
  generic_bank: parseGenericBank,
};

/**
 * Parse notification using the appropriate provider parser.
 * @param {object} normalized - Normalized notification object
 * @param {object} provider - Provider object from detectProvider()
 * @returns {object|null} Parsed transaction data or null
 */
export function parseNotification(normalized, provider) {
  if (!normalized || !provider) return null;

  const parser = PROVIDER_PARSERS[provider.id];
  if (!parser) {
    // Fallback: try generic based on provider type
    return parseGenericBank(normalized);
  }

  try {
    return parser(normalized);
  } catch (err) {
    console.warn(`[NotifTracker] Parser error for ${provider.id}:`, err?.message);
    return null;
  }
}

// ─── EXPORTS FOR TESTING ────────────────────────────────────────────────────

/**
 * Run built-in test suite for notification parsers.
 * Returns array of { name, passed, expected, actual } results.
 */
export function runParserTests() {
  const results = [];

  function test(name, fn) {
    try {
      const result = fn();
      results.push({ name, ...result });
    } catch (err) {
      results.push({ name, passed: false, expected: 'no error', actual: err.message });
    }
  }

  // Test 1: BRI Debit with balance
  test('BRI Debit — should extract 25000, not balance 1250000', () => {
    const text = 'INFO BRI: Nasabah Yth. Debet sebesar Rp25.000 pada 27/08 14:30. Saldo akhir Rp1.250.000';
    const amount = extractTransactionAmount(text);
    const type = detectTransactionType(text);
    return {
      passed: amount === 25000 && type === 'expense',
      expected: '25000 / expense',
      actual: `${amount} / ${type}`,
    };
  });

  // Test 2: BRI Kredit
  test('BRI Kredit — should be income', () => {
    const text = 'INFO BRI: Kredit sebesar Rp500.000 pada 27/08 10:00. Saldo akhir Rp2.000.000';
    const amount = extractTransactionAmount(text);
    const type = detectTransactionType(text);
    return {
      passed: amount === 500000 && type === 'income',
      expected: '500000 / income',
      actual: `${amount} / ${type}`,
    };
  });

  // Test 2b: Amount with 2 decimal zeros (51.000.00 -> 51000)
  test('Amount with 2 trailing zero decimals (sen) — should be 51000 not 5100000', () => {
    const text1 = 'BRImo: Pembayaran berhasil Rp51.000.00 ke Toko';
    const text2 = 'BRImo: Debet sebesar Rp 51.000,00 pada 31/08';
    const amt1 = extractTransactionAmount(text1);
    const amt2 = extractTransactionAmount(text2);
    return {
      passed: amt1 === 51000 && amt2 === 51000,
      expected: '51000 & 51000',
      actual: `${amt1} & ${amt2}`,
    };
  });

  // Test 3: Balance-only notification
  test('Balance only — should be ignored', () => {
    const text = 'Saldo Anda Rp2.500.000';
    const amount = extractTransactionAmount(text);
    return {
      passed: amount === null,
      expected: 'null (ignored)',
      actual: String(amount),
    };
  });

  // Test 4: Promo notification
  test('Promo — should be non-transactional', () => {
    const text = 'Promo spesial! Diskon 50% untuk transaksi berikutnya. Gunakan kupon HEMAT50';
    const isNonTx = isNonTransactional(text);
    return {
      passed: isNonTx === true,
      expected: 'true (ignored)',
      actual: String(isNonTx),
    };
  });

  // Test 5: OTP notification
  test('OTP — should be non-transactional', () => {
    const text = 'Kode verifikasi Anda adalah 123456. Jangan bagikan kode ini.';
    const isNonTx = isNonTransactional(text);
    return {
      passed: isNonTx === true,
      expected: 'true (ignored)',
      actual: String(isNonTx),
    };
  });

  // Test 6: DANA payment
  test('DANA Payment — should parse expense', () => {
    const normalized = {
      fullText: 'Pembayaran Berhasil sebesar Rp35.000 ke Alfamart',
      title: 'Pembayaran Berhasil',
      appLabel: 'DANA',
    };
    const result = parseDANA(normalized);
    return {
      passed: result !== null && result.amount === 35000 && result.type === 'expense',
      expected: '35000 / expense',
      actual: result ? `${result.amount} / ${result.type}` : 'null',
    };
  });

  // Test 7: Billing reminder should be ignored
  test('Billing reminder — should be non-transactional', () => {
    const text = 'Tagihan bulan Agustus Anda sebesar Rp150.000 jatuh tempo tanggal 30';
    const isNonTx = isNonTransactional(text);
    return {
      passed: isNonTx === true,
      expected: 'true (ignored)',
      actual: String(isNonTx),
    };
  });

  // Test 8: Multiple amounts — transaction + balance
  test('Multiple amounts — should extract transaction, not balance', () => {
    const text = 'Debit Rp25.000 berhasil. Saldo akhir Rp1.250.000';
    const amount = extractTransactionAmount(text);
    return {
      passed: amount === 25000,
      expected: '25000',
      actual: String(amount),
    };
  });

  // Test 9: Missing merchant
  test('No merchant — should return null merchant', () => {
    const text = 'Debit sebesar Rp50.000 berhasil';
    const merchant = extractMerchant(text);
    return {
      passed: merchant === null,
      expected: 'null',
      actual: String(merchant),
    };
  });

  // Test 10: Transaction signal detection
  test('Transaction signal — pembayaran berhasil', () => {
    const text = 'Pembayaran berhasil sebesar Rp100.000';
    const hasSignal = hasTransactionSignal(text);
    return {
      passed: hasSignal === true,
      expected: 'true',
      actual: String(hasSignal),
    };
  });

  // Test 11: No transaction signal
  test('No signal — generic info', () => {
    const text = 'Selamat datang di aplikasi BRImo';
    const hasSignal = hasTransactionSignal(text);
    return {
      passed: hasSignal === false,
      expected: 'false',
      actual: String(hasSignal),
    };
  });

  // Test 12: Confidence scoring
  test('High confidence — all signals present', () => {
    const conf = calculateConfidence({
      amount: 25000,
      type: 'expense',
      hasSignal: true,
      provider: true,
      merchant: 'Alfamart',
    });
    return {
      passed: conf >= 0.9,
      expected: '>= 0.9',
      actual: String(conf),
    };
  });

  // Test 13: Low confidence — only amount
  test('Low confidence — only amount, no other signals', () => {
    const conf = calculateConfidence({
      amount: 25000,
      type: null,
      hasSignal: false,
      provider: false,
      merchant: null,
    });
    return {
      passed: conf <= 0.4,
      expected: '<= 0.4',
      actual: String(conf),
    };
  });

  // Test 14: GoPay top up (income)
  test('GoPay Top Up — should be income', () => {
    const normalized = {
      fullText: 'Top up berhasil! Saldo GoPay Anda bertambah Rp100.000',
      title: 'Top Up Berhasil',
      appLabel: 'GoPay',
    };
    const result = parseGoPay(normalized);
    return {
      passed: result !== null && result.amount === 100000 && result.type === 'income',
      expected: '100000 / income',
      actual: result ? `${result.amount} / ${result.type}` : 'null',
    };
  });

  // Test 15: BCA Mobile Debit
  test('BCA Mobile Debit — should parse expense with merchant', () => {
    const normalized = {
      fullText: 'Transaksi Debit Rp150.000 berhasil di Indomaret',
      title: 'BCA Mobile',
      appLabel: 'BCA',
    };
    const result = parseBCA(normalized);
    return {
      passed: result !== null && result.amount === 150000 && result.type === 'expense' && result.merchant === 'Indomaret',
      expected: '150000 / expense / Indomaret',
      actual: result ? `${result.amount} / ${result.type} / ${result.merchant}` : 'null',
    };
  });

  // Test 16: myBCA package detection
  test('myBCA package variant — should detect bca provider', () => {
    const p1 = detectProvider('com.bca.mybca.mobile');
    const p2 = detectProvider('com.bca.mybca');
    return {
      passed: p1?.id === 'bca' && p2?.id === 'bca',
      expected: 'bca & bca',
      actual: `${p1?.id} & ${p2?.id}`,
    };
  });

  // Test 17: Livin Mandiri Transfer
  test('Mandiri Livin — Transfer should be expense', () => {
    const normalized = {
      fullText: 'Transfer Berhasil Rp250.000 ke Budi Santoso',
      title: 'Transfer Berhasil',
      appLabel: "Livin'",
    };
    const result = parseMandiri(normalized);
    return {
      passed: result !== null && result.amount === 250000 && result.type === 'expense',
      expected: '250000 / expense',
      actual: result ? `${result.amount} / ${result.type}` : 'null',
    };
  });

  // Test 18: Wondr by BNI QRIS
  test('BNI Wondr — QRIS payment should parse expense', () => {
    const normalized = {
      fullText: 'Pembayaran QRIS Rp35.000 di Kopi Kenangan berhasil',
      title: 'Wondr by BNI',
      appLabel: 'Wondr',
    };
    const result = parseGenericBank(normalized);
    return {
      passed: result !== null && result.amount === 35000 && result.type === 'expense' && result.merchant === 'Kopi Kenangan',
      expected: '35000 / expense / Kopi Kenangan',
      actual: result ? `${result.amount} / ${result.type} / ${result.merchant}` : 'null',
    };
  });

  // Test 19: BSI Mobile Debit
  test('BSI Mobile — Debit payment should parse expense', () => {
    const normalized = {
      fullText: 'Transaksi debet sebesar Rp75.000 pada 27/08 berhasil',
      title: 'BSI Mobile',
      appLabel: 'BSI',
    };
    const result = parseGenericBank(normalized);
    return {
      passed: result !== null && result.amount === 75000 && result.type === 'expense',
      expected: '75000 / expense',
      actual: result ? `${result.amount} / ${result.type}` : 'null',
    };
  });

  // Test 20: OVO Payment with GrabFood
  test('OVO — Payment with merchant', () => {
    const normalized = {
      fullText: 'Pembayaran Berhasil Rp42.000 ke GrabFood',
      title: 'OVO',
      appLabel: 'OVO',
    };
    const result = parseOVO(normalized);
    return {
      passed: result !== null && result.amount === 42000 && result.type === 'expense' && result.merchant === 'GrabFood',
      expected: '42000 / expense / GrabFood',
      actual: result ? `${result.amount} / ${result.type} / ${result.merchant}` : 'null',
    };
  });

  // Test 21: ShopeePay Payment
  test('ShopeePay — Confirmed payment', () => {
    const normalized = {
      fullText: 'Pembayaran Dikonfirmasi Rp89.000 di Shopee',
      title: 'ShopeePay',
      appLabel: 'ShopeePay',
    };
    const result = parseShopeePay(normalized);
    return {
      passed: result !== null && result.amount === 89000 && result.type === 'expense',
      expected: '89000 / expense',
      actual: result ? `${result.amount} / ${result.type}` : 'null',
    };
  });

  // Test 22: LinkAja Payment
  test('LinkAja — Transit payment', () => {
    const normalized = {
      fullText: 'Pembayaran Rp15.000 sukses ke Transjakarta',
      title: 'LinkAja',
      appLabel: 'LinkAja',
    };
    const result = parseGenericEWallet(normalized);
    return {
      passed: result !== null && result.amount === 15000 && result.type === 'expense' && result.merchant === 'Transjakarta',
      expected: '15000 / expense / Transjakarta',
      actual: result ? `${result.amount} / ${result.type} / ${result.merchant}` : 'null',
    };
  });

  // Test 23: SeaBank Transfer Out
  test('SeaBank — Transfer keluar should be expense', () => {
    const normalized = {
      fullText: 'Transfer keluar Rp500.000 berhasil ke Rekening Bank',
      title: 'SeaBank',
      appLabel: 'SeaBank',
    };
    const result = parseGenericBank(normalized);
    return {
      passed: result !== null && result.amount === 500000 && result.type === 'expense',
      expected: '500000 / expense',
      actual: result ? `${result.amount} / ${result.type}` : 'null',
    };
  });

  // Test 24: Bank Jago Pocket Debit
  test('Bank Jago — Kantong belanja debit', () => {
    const normalized = {
      fullText: 'Pembayaran debit Rp120.000 di Solaria sukses',
      title: 'Bank Jago',
      appLabel: 'Jago',
    };
    const result = parseJago(normalized);
    return {
      passed: result !== null && result.amount === 120000 && result.type === 'expense' && result.merchant === 'Solaria',
      expected: '120000 / expense / Solaria',
      actual: result ? `${result.amount} / ${result.type} / ${result.merchant}` : 'null',
    };
  });

  // Test 24b: Bank Jago — Real screenshot format ("Kamu telah membayar Rp 15.000 ke Ayam Goreng Hj Toyib, Set...")
  test('Bank Jago — Real screenshot format (Kamu telah membayar)', () => {
    const normalized = {
      packageName: 'com.bankjago.app',
      appLabel: 'Jago',
      title: 'Jago',
      fullText: 'Jago Kamu telah membayar Rp 15.000 ke Ayam Goreng Hj Toyib, Set. Butuh bantuan? Silakan Tanya Jago di 1500 746.',
    };
    const provider = detectProvider(normalized.packageName, normalized.appLabel);
    const result = parseNotification(normalized, provider);
    return {
      passed: provider?.id === 'jago' && result !== null && result.amount === 15000 && result.type === 'expense' && result.merchant === 'Ayam Goreng Hj Toyib',
      expected: 'jago / 15000 / expense / Ayam Goreng Hj Toyib',
      actual: `${provider?.id} / ${result?.amount} / ${result?.type} / ${result?.merchant}`,
    };
  });

  // Test 25: Jenius Card Debit
  test('Jenius — m-Card debit payment', () => {
    const normalized = {
      fullText: 'Transaksi debit sebesar Rp60.000 di McDonald berhasil',
      title: 'Jenius',
      appLabel: 'Jenius',
    };
    const result = parseJenius(normalized);
    return {
      passed: result !== null && result.amount === 60000 && result.type === 'expense' && result.merchant === 'McDonald',
      expected: '60000 / expense / McDonald',
      actual: result ? `${result.amount} / ${result.type} / ${result.merchant}` : 'null',
    };
  });

  // Test 26: CIMB Niaga OCTO Debit
  test('CIMB Niaga — OCTO Mobile debit transaction', () => {
    const normalized = {
      fullText: 'Transaksi Debit Rekening Rp200.000 berhasil pada 27/08',
      title: 'OCTO Mobile',
      appLabel: 'CIMB Niaga',
    };
    const result = parseGenericBank(normalized);
    return {
      passed: result !== null && result.amount === 200000 && result.type === 'expense',
      expected: '200000 / expense',
      actual: result ? `${result.amount} / ${result.type}` : 'null',
    };
  });

  // Test 27: Permata Mobile Debit
  test('Permata Mobile — QRIS payment', () => {
    const normalized = {
      fullText: 'Pembayaran QRIS Rp45.000 di Alfamidi berhasil',
      title: 'PermataMobile X',
      appLabel: 'Permata',
    };
    const result = parseGenericBank(normalized);
    return {
      passed: result !== null && result.amount === 45000 && result.type === 'expense' && result.merchant === 'Alfamidi',
      expected: '45000 / expense / Alfamidi',
      actual: result ? `${result.amount} / ${result.type} / ${result.merchant}` : 'null',
    };
  });

  // Test 28: Decimal format with comma cents
  test('Decimal cents format (Rp 150.000,00)', () => {
    const text = 'Transaksi debit Rp 150.000,00 di Tokopedia berhasil';
    const amount = extractTransactionAmount(text);
    return {
      passed: amount === 150000,
      expected: '150000',
      actual: String(amount),
    };
  });

  // Test 29: Comma separated Saldo first, Transaksi second
  test('Saldo first, Transaksi second with comma separator', () => {
    const text = 'Saldo Anda Rp500.000, pembayaran Rp50.000 berhasil';
    const amount = extractTransactionAmount(text);
    return {
      passed: amount === 50000,
      expected: '50000',
      actual: String(amount),
    };
  });

  // Test 30: Dash suffix format (Rp. 30.000,-)
  test('Dash suffix format (Rp. 30.000,-)', () => {
    const text = 'Pembayaran sebesar Rp. 30.000,- berhasil';
    const amount = extractTransactionAmount(text);
    return {
      passed: amount === 30000,
      expected: '30000',
      actual: String(amount),
    };
  });

  // Test 31: Maybank2u Payment
  test('Maybank2u — QRIS payment should parse expense', () => {
    const p = detectProvider('com.maybankindo.maybank2u');
    const normalized = {
      fullText: 'Pembayaran QRIS Rp50.000 di Starbucks berhasil',
      title: 'M2U ID',
      appLabel: 'Maybank',
    };
    const result = parseNotification(normalized, p);
    return {
      passed: p?.id === 'maybank' && result !== null && result.amount === 50000 && result.type === 'expense',
      expected: 'maybank / 50000 / expense',
      actual: `${p?.id} / ${result?.amount} / ${result?.type}`,
    };
  });

  // Test 32: BPD DIY Mobile Debit
  test('BPD DIY Mobile — Debit transaction', () => {
    const p = detectProvider('id.co.bankbpd.diy.mobile');
    const normalized = {
      fullText: 'Transaksi debit sebesar Rp65.000 di Mirota Kampus sukses',
      title: 'BPD DIY Mobile',
      appLabel: 'BPD DIY',
    };
    const result = parseNotification(normalized, p);
    return {
      passed: p?.id === 'bpddiy' && result !== null && result.amount === 65000 && result.type === 'expense',
      expected: 'bpddiy / 65000 / expense',
      actual: `${p?.id} / ${result?.amount} / ${result?.type}`,
    };
  });

  // Test 33: BTN Mobile / bale by btn
  test('BTN Mobile — Pembayaran berhasil', () => {
    const p = detectProvider('id.co.btn.superapp');
    const normalized = {
      fullText: 'Pembayaran berhasil Rp125.000 di Indomaret',
      title: 'bale by BTN',
      appLabel: 'BTN Mobile',
    };
    const result = parseNotification(normalized, p);
    return {
      passed: p?.id === 'btn' && result !== null && result.amount === 125000 && result.type === 'expense',
      expected: 'btn / 125000 / expense',
      actual: `${p?.id} / ${result?.amount} / ${result?.type}`,
    };
  });

  // Test 34: blu by BCA Digital
  test('blu by BCA Digital — Pembayaran QRIS', () => {
    const p = detectProvider('bcadigital.blubybcadigital');
    const normalized = {
      fullText: 'Pembayaran QRIS Rp28.000 di Fore Coffee berhasil',
      title: 'blu',
      appLabel: 'blu',
    };
    const result = parseNotification(normalized, p);
    return {
      passed: p?.id === 'blu' && result !== null && result.amount === 28000 && result.type === 'expense',
      expected: 'blu / 28000 / expense',
      actual: `${p?.id} / ${result?.amount} / ${result?.type}`,
    };
  });

  // Test 35: PayPal Mobile
  test('PayPal Mobile — Payment to merchant', () => {
    const p = detectProvider('com.paypal.android.p2pmobile');
    const normalized = {
      fullText: 'You paid IDR 150000 to Steam Games',
      title: 'PayPal',
      appLabel: 'PayPal',
    };
    const result = parseNotification(normalized, p);
    return {
      passed: p?.id === 'paypal' && result !== null && result.amount === 150000 && result.type === 'expense',
      expected: 'paypal / 150000 / expense',
      actual: `${p?.id} / ${result?.amount} / ${result?.type}`,
    };
  });

  // Test 36: Cashback with actual payment transaction — should NOT be rejected
  test('Cashback with actual payment transaction — should NOT be rejected', () => {
    const text = 'Pembayaran Rp45.000 di Kopi Kenangan berhasil. Dapatkan cashback hingga Rp5.000';
    const isNonTx = isNonTransactional(text);
    const amount = extractTransactionAmount(text);
    return {
      passed: isNonTx === false && amount === 45000,
      expected: 'false (not rejected) / 45000',
      actual: `${isNonTx} / ${amount}`,
    };
  });

  return results;
}

export { PROVIDER_REGISTRY, PACKAGE_TO_PROVIDER, parseRupiahAmount, parseRawAmount };

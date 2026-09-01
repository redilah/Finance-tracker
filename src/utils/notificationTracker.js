/**
 * Cassiel Notification Auto Tracker — Processing Pipeline
 * 
 * Pipeline:
 * Notification (from Native queue)
 *    ↓
 * Normalizer
 *    ↓
 * Filter (Non-transaction / Promo / OTP rejection)
 *    ↓
 * Provider Detection
 *    ↓
 * Provider Parser (Amount extraction, Debit/Credit detection, Merchant)
 *    ↓
 * Transaction Validation & Confidence Scoring
 *    ↓
 * Account Resolution
 *    ↓
 * Category Resolution
 *    ↓
 * Duplicate Prevention (Fingerprint & Idempotency)
 *    ↓
 * Transaction Creation
 */

import { registerPlugin } from '@capacitor/core';
import { safeStorageGet, safeStorageSet } from './secureStorage';
import { normalizeAccountName, DEFAULT_ACCOUNTS } from './accountLogos';
import {
  detectProvider,
  parseNotification,
  isNonTransactional,
  hasTransactionSignal
} from './notificationProviders';
import { canAutoTrack, incrementDailyAutoTrack } from './proManager';

// Register native Capacitor plugin
export const NotificationTrackerNative = registerPlugin('NotificationTracker');

// Storage keys
const STORAGE_KEY_ENABLED = 'cassiel_notif_tracker_enabled';
const STORAGE_KEY_FINGERPRINTS = 'cassiel_notif_tracker_fingerprints';
const MAX_FINGERPRINTS = 200;

// ─── STATE & PERMISSION HELPERS ─────────────────────────────────────────────

/**
 * Check if user preference for notification tracking is enabled.
 */
export function isAutoTrackerPreferenceEnabled() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_ENABLED);
    if (saved === 'false') return false;
    return true; // Active by default when permission is granted
  } catch {
    return true;
  }
}

/**
 * Set user preference for notification tracking.
 */
export async function setAutoTrackerPreference(enabled) {
  try {
    const isBool = Boolean(enabled);
    localStorage.setItem(STORAGE_KEY_ENABLED, isBool ? 'true' : 'false');
    try {
      await NotificationTrackerNative.setTrackingEnabled({ enabled: isBool });
    } catch {
      // Native plugin might not be available on web
    }
  } catch (err) {
    console.warn('[NotifTracker] Failed to set tracking preference:', err);
  }
}

/**
 * Check if Android Notification Access permission is granted.
 */
export async function checkNotificationAccessPermission() {
  try {
    const result = await NotificationTrackerNative.isListenerEnabled();
    return Boolean(result?.enabled);
  } catch {
    // If on web or plugin fails, return false
    return false;
  }
}

/**
 * Open Android Notification Access settings.
 */
export async function openNotificationAccessSettings() {
  try {
    await NotificationTrackerNative.openNotificationAccessSettings();
    return true;
  } catch (err) {
    console.warn('[NotifTracker] Failed to open notification settings:', err);
    return false;
  }
}

// ─── 1. NORMALIZER ──────────────────────────────────────────────────────────

/**
 * Normalize incoming raw notification metadata into a clean structure.
 */
export function normalizeNotification(raw) {
  if (!raw || typeof raw !== 'object') return null;

  const packageName = (raw.packageName || '').trim();
  const appLabel = (raw.appLabel || packageName).trim();
  const title = (raw.title || '').trim();
  const text = (raw.text || '').trim();
  const bigText = (raw.bigText || '').trim();
  const postTime = Number(raw.postTime) || Number(raw.receivedAt) || Date.now();

  // Combine title, text, and bigText without redundant repetitions
  const textParts = [];
  if (title) textParts.push(title);
  if (text && text !== title) textParts.push(text);
  if (bigText && bigText !== text && bigText !== title) textParts.push(bigText);

  const rawFullText = textParts.join(' ');
  // Clean whitespace, multiple line breaks, zero-width spaces
  const fullText = rawFullText
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();

  return {
    packageName,
    appLabel,
    title,
    body: text,
    bigText,
    postTime,
    fullText
  };
}

// ─── 2. FILTER ──────────────────────────────────────────────────────────────

/**
 * Filter out invalid or non-transactional notifications.
 * Returns true if notification should be processed, false if ignored.
 */
export function shouldProcessNotification(normalized) {
  if (!normalized || !normalized.fullText) return false;

  // Filter 1: Non-transactional (OTP, promo, marketing, maintenance, billing reminder)
  if (isNonTransactional(normalized.fullText)) {
    return false;
  }

  // Filter 2: Must contain some transaction keywords/signals
  if (!hasTransactionSignal(normalized.fullText)) {
    return false;
  }

  return true;
}

// ─── 3. CATEGORY RESOLVER ───────────────────────────────────────────────────

/**
 * Keyword-to-Category heuristic mapping for auto-categorization.
 */
const EXPENSE_CATEGORY_KEYWORDS = {
  food: [
    'gofood', 'grabfood', 'shopeefood', 'mcdonald', 'kfc', 'hokben', 'solaria',
    'burger', 'pizza', 'bakso', 'mie', 'nasi', 'resto', 'warung', 'cafe', 'kafe',
    'kitchen', 'food', 'makan', 'kuliner', 'dapur', 'snack', 'bakery', 'roti',
    'kopi kenangan', 'fore', 'chatime', 'janji jiwa'
  ],
  coffee: [
    'starbucks', 'kopi', 'coffee', 'espresso', 'latte', 'cappuccino', 'point coffee',
    'tomoro', 'kopi kenangan', 'fore coffee'
  ],
  bensin: [
    'pertamina', 'spbu', 'shell', 'bp', 'bensin', 'pertalite', 'pertamax', 'solar'
  ],
  transport: [
    'gojek', 'grab', 'maxim', 'indrive', 'bluebird', 'taxi', 'taksi', 'kereta',
    'krl', 'mrt', 'lrt', 'transjakarta', 'toll', 'tol', 'parkir', 'parking'
  ],
  supermarket: [
    'indomaret', 'alfamart', 'alfamidi', 'superindo', 'hypermart', 'transmart',
    'hero', 'farmers market', 'lotte mart', 'minimarket', 'swalayan', 'toko kelontong'
  ],
  sub: [
    'netflix', 'spotify', 'youtube', 'disney', 'prime', 'icloud', 'google one',
    'chatgpt', 'openai', 'subscription', 'langganan', 'canva'
  ],
  pulsa: [
    'telkomsel', 'indosat', 'xl', 'tri', 'smartfren', 'by.u', 'pulsa', 'kuota', 'paket data'
  ],
  wifi: [
    'indihome', 'biznet', 'myrepublic', 'first media', 'wifi', 'internet'
  ],
  biayaAdmin: [
    'biaya admin', 'admin fee', 'biaya transaksi', 'biaya transfer', 'materai',
    'bunga', 'denda'
  ],
  topupGame: [
    'google play', 'steam', 'playstation', 'garena', 'unipin', 'codashop',
    'mobile legends', 'free fire', 'genshin', 'valorant', 'roblox'
  ],
  fashion: [
    'zara', 'h&m', 'uniqlo', 'pull&bear', 'matahari', 'ramayana', 'shopee',
    'tokopedia', 'baju', 'celana', 'pakaian'
  ],
  skincare: [
    'sociolla', 'guardian', 'watsons', 'skincare', 'kosmetik', 'makeup'
  ],
  bioskop: [
    'cinema xxi', 'cgv', 'cinepolis', 'tix id', 'm-tix', 'bioskop', 'nonton'
  ]
};

const INCOME_CATEGORY_KEYWORDS = {
  gaji: ['gaji', 'salary', 'payroll', 'upah', 'honor', 'remunerasi'],
  bonus: ['bonus', 'thr', 'reward', 'insentif', 'hadiah', 'cashback', 'komisi'],
  affiliate: ['affiliate', 'komisi', 'tiktok shop', 'shopee affiliate'],
  investasi: ['dividen', 'reksadana', 'saham', 'crypto', 'bunga deposito', 'yield', 'profit', 'cuan'],
  bisnis: ['omset', 'penjualan', 'toko', 'pelanggan', 'order', 'pembayaran invoice']
};

/**
 * Resolve the best category for a parsed transaction.
 */
export function resolveCategory(type, merchant, fullText, availableExpenseCategories, availableIncomeCategories) {
  const text = `${merchant || ''} ${fullText || ''}`.toLowerCase();

  if (type === 'income') {
    const activeCats = availableIncomeCategories || [];
    for (const [catId, keywords] of Object.entries(INCOME_CATEGORY_KEYWORDS)) {
      for (const kw of keywords) {
        if (text.includes(kw)) {
          const matched = activeCats.find(c => (c.id || '').toLowerCase() === catId);
          if (matched) return matched;
        }
      }
    }
    // Fallback income category: 'bonus' or first active
    return activeCats.find(c => c.id === 'bonus') || activeCats[0] || { id: 'bonus', name: 'Bonus', iconClass: 'bonus-icon' };
  }

  // Expense categorization
  const activeCats = availableExpenseCategories || [];
  for (const [catId, keywords] of Object.entries(EXPENSE_CATEGORY_KEYWORDS)) {
    for (const kw of keywords) {
      if (text.includes(kw)) {
        const matched = activeCats.find(c => (c.id || '').toLowerCase() === catId);
        if (matched) return matched;
      }
    }
  }

  // Fallback expense category: 'food' or first active
  return activeCats.find(c => c.id === 'food') || activeCats[0] || { id: 'food', name: 'Food', iconClass: 'food-icon' };
}

// ─── 4. ACCOUNT RESOLVER ────────────────────────────────────────────────────

/**
 * Resolve target account based on detected provider and user's account configuration.
 */
export function resolveAccount(provider, accountsList, warehouseAccountsList) {
  if (!provider) return 'Cash';

  const preferredName = provider.accountName || provider.name;
  const normalized = normalizeAccountName(preferredName);

  // 1. Check user's active accounts list
  if (Array.isArray(accountsList)) {
    const activeMatch = accountsList.find(acc => {
      const accNorm = normalizeAccountName(acc);
      return accNorm.toLowerCase() === normalized.toLowerCase() ||
             acc.toLowerCase() === preferredName.toLowerCase() ||
             acc.toLowerCase() === (provider.id || '').toLowerCase();
    });
    if (activeMatch) return activeMatch;
  }

  // 2. Check warehouse accounts list
  if (Array.isArray(warehouseAccountsList)) {
    const warehouseMatch = warehouseAccountsList.find(acc => {
      const accNorm = normalizeAccountName(acc);
      return accNorm.toLowerCase() === normalized.toLowerCase() ||
             acc.toLowerCase() === preferredName.toLowerCase();
    });
    if (warehouseMatch) return warehouseMatch;
  }

  // 3. Fallback to official default account name
  const defMatch = DEFAULT_ACCOUNTS.find(a => 
    a.id === provider.id ||
    normalizeAccountName(a.name).toLowerCase() === normalized.toLowerCase()
  );
  if (defMatch) return defMatch.name;

  return normalized || preferredName || 'Cash';
}

// ─── 5. DUPLICATE PREVENTION & FINGERPRINTING ────────────────────────────────

/**
 * Generate unique fingerprint string for idempotency.
 * Rounds timestamp to a 2-minute window to handle slight delays.
 */
export function generateNotificationFingerprint(packageName, type, amount, merchant, postTime, fullText) {
  const timeWindow = Math.floor(postTime / (120 * 1000)); // 2-minute block
  const cleanMerchant = (merchant || '').toLowerCase().trim();
  const cleanSnippet = (fullText || '').substring(0, 30).toLowerCase().replace(/[^a-z0-9]/g, '');
  return `${packageName}|${type}|${amount}|${cleanMerchant}|${timeWindow}|${cleanSnippet}`;
}

/**
 * Check if fingerprint already processed and mark as seen.
 */
export function isDuplicateAndRecord(fingerprint) {
  if (!fingerprint) return false;

  try {
    const stored = safeStorageGet(STORAGE_KEY_FINGERPRINTS, []);
    const fingerprints = Array.isArray(stored) ? stored : [];

    if (fingerprints.includes(fingerprint)) {
      return true; // Already processed!
    }

    // Add new fingerprint and maintain max limit
    fingerprints.unshift(fingerprint);
    if (fingerprints.length > MAX_FINGERPRINTS) {
      fingerprints.length = MAX_FINGERPRINTS;
    }

    safeStorageSet(STORAGE_KEY_FINGERPRINTS, fingerprints);
    return false;
  } catch (err) {
    console.warn('[NotifTracker] Fingerprint check error:', err);
    return false;
  }
}

/**
 * Secondary check: Check if existing transactions state already has an identical record.
 */
export function isDuplicateInTransactions(newTx, existingTransactions) {
  if (!newTx || !Array.isArray(existingTransactions) || existingTransactions.length === 0) {
    return false;
  }

  const txDate = newTx.date;
  const txAmount = Number(newTx.amount);
  const txType = newTx.type;
  const txAccount = newTx.account;

  return existingTransactions.some(t => {
    if (t.inputMethod !== 'notification') return false;
    if (t.date !== txDate) return false;
    if (Number(t.amount) !== txAmount) return false;
    if (t.type !== txType) return false;
    if (t.account !== txAccount) return false;

    // Check if created within 5 minutes of each other
    if (t.id && newTx.id && Math.abs(t.id - newTx.id) < 5 * 60 * 1000) {
      return true;
    }

    return false;
  });
}

// ─── 6. MAIN PROCESSING PIPELINE ────────────────────────────────────────────

/**
 * Process a single notification item through the entire pipeline.
 * Returns newly created transaction object or null.
 */
export function processSingleNotification(rawNotif, {
  accountsList,
  warehouseAccountsList,
  expenseCategories,
  incomeCategories,
  existingTransactions
}) {
  // Step 1: Normalize
  const normalized = normalizeNotification(rawNotif);
  if (!normalized) return null;

  // Step 2: Filter (rejection of non-transactions, OTP, promo)
  if (!shouldProcessNotification(normalized)) {
    return null;
  }

  // Step 3: Provider Detection
  const provider = detectProvider(normalized.packageName);
  if (!provider) {
    return null;
  }

  // Step 4: Provider Parser
  const parsed = parseNotification(normalized, provider);
  if (!parsed) {
    return null;
  }

  // Step 5: Validation & Confidence
  if (!parsed.amount || parsed.amount <= 0) return null;
  if (parsed.type !== 'expense' && parsed.type !== 'income') return null;
  if ((parsed.confidence || 0) < 0.5) return null;

  // Step 6: Duplicate Check (Fingerprint)
  const fingerprint = generateNotificationFingerprint(
    normalized.packageName,
    parsed.type,
    parsed.amount,
    parsed.merchant,
    normalized.postTime,
    normalized.fullText
  );

  if (isDuplicateAndRecord(fingerprint)) {
    return null; // Ignore duplicate
  }

  // Step 7: Resolve Account
  const resolvedAccount = resolveAccount(provider, accountsList, warehouseAccountsList);

  // Step 8: Resolve Category
  const resolvedCategory = resolveCategory(
    parsed.type,
    parsed.merchant,
    normalized.fullText,
    expenseCategories,
    incomeCategories
  );

  // Format ISO Date YYYY-MM-DD
  let notifDate = new Date(Number(normalized.postTime) || Date.now());
  if (isNaN(notifDate.getTime()) || notifDate.getFullYear() < 2020) {
    notifDate = new Date();
  }
  const y = notifDate.getFullYear();
  const m = String(notifDate.getMonth() + 1).padStart(2, '0');
  const d = String(notifDate.getDate()).padStart(2, '0');
  const dateStr = `${y}-${m}-${d}`;

  // Title construction: Prioritize Merchant > Meaningful Description > Category Name
  const genericPhrases = [
    'pembayaran berhasil', 'transaksi berhasil', 'transaksi sukses', 'transfer berhasil',
    'transfer sukses', 'notifikasi', 'info', 'transaksi', 'sukses', 'berhasil', 'payment'
  ];
  let customTitle = parsed.merchant;
  if (!customTitle && parsed.description) {
    const isGeneric = genericPhrases.some(gp => parsed.description.toLowerCase().trim() === gp);
    if (!isGeneric) {
      customTitle = parsed.description;
    }
  }
  let finalTitle = (customTitle || resolvedCategory.name || 'Transaksi').trim();
  finalTitle = finalTitle.replace(/\b(dan)\b/gi, '&').replace(/\s+/g, ' ').trim();

  // Step 9: Assemble Transaction Object
  const newTxId = Date.now() + Math.floor(Math.random() * 1000);
  const newTx = {
    id: newTxId,
    title: finalTitle,
    category: resolvedCategory.name,
    categoryId: resolvedCategory.id || null,
    account: resolvedAccount,
    amount: parsed.amount,
    type: parsed.type,
    iconClass: resolvedCategory.iconClass || (parsed.type === 'income' ? 'bonus-icon' : 'food-icon'),
    date: dateStr,
    inputMethod: 'notification',
    autoTracked: true,
    rawProvider: provider.name
  };

  // Step 10: Secondary Duplicate Check
  if (isDuplicateInTransactions(newTx, existingTransactions)) {
    return null;
  }

  return newTx;
}

/**
 * Drain queued notifications from native SharedPreferences and process them.
 * @param {object} context Context objects (accountsList, warehouseAccountsList, categories, transactions, onNewTransactions)
 * @returns {Promise<Array>} Array of newly created transaction objects
 */
export async function drainAndProcessQueuedNotifications({
  accountsList,
  warehouseAccountsList,
  expenseCategories,
  incomeCategories,
  transactions,
  onNewTransactions
}) {
  // Only process if user preference is ON
  if (!isAutoTrackerPreferenceEnabled()) {
    return [];
  }

  try {
    const result = await NotificationTrackerNative.getQueuedNotifications();
    const rawQueue = result?.notifications;

    if (!rawQueue || !Array.isArray(rawQueue) || rawQueue.length === 0) {
      return [];
    }

    const createdTransactions = [];
    let currentTxs = Array.isArray(transactions) ? [...transactions] : [];

    for (const rawNotif of rawQueue) {
      try {
        if (!canAutoTrack()) {
          console.log('[NotifTracker] Daily limit reached for free user');
          break;
        }

        const newTx = processSingleNotification(rawNotif, {
          accountsList,
          warehouseAccountsList,
          expenseCategories,
          incomeCategories,
          existingTransactions: currentTxs
        });

        if (newTx) {
          incrementDailyAutoTrack();
          createdTransactions.push(newTx);
          currentTxs = [newTx, ...currentTxs]; // Update memory copy to prevent batch duplicates
        }
      } catch (itemErr) {
        console.warn('[NotifTracker] Failed to process notification item:', itemErr);
        // Error isolation: continue processing other notifications
      }
    }

    if (createdTransactions.length > 0 && typeof onNewTransactions === 'function') {
      onNewTransactions(createdTransactions);
    }

    return createdTransactions;
  } catch (err) {
    // Gracefully handle if not on Android or plugin error
    return [];
  }
}

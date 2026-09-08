/**
 * Backup & Restore Utility for Cassiel Finance Tracker
 * Supports full data export (JSON / TXT) and universal import with resilient validation.
 * Compatible with Android (Google Drive), iOS (iCloud/Files), and Web.
 */

import { safeStorageGet, safeStorageSet, syncDecrypt } from './secureStorage.js';
import { Capacitor } from '@capacitor/core';
import { Share } from '@capacitor/share';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';

// Current backup format version for forward compatibility
const BACKUP_VERSION = 1;
const BACKUP_MAGIC = 'CASSIEL_BACKUP';

/**
 * Gather all application data into a single backup object.
 */
export function createBackupData({
  transactions,
  expenseCategories,
  incomeCategories,
  warehouseExpenseCategories,
  warehouseIncomeCategories,
  accountsList,
  deletedAccountsList,
  warehouseAccounts,
  accountInitialBalances,
  monthlyBudgetsMap,
  profileName,
  profileImage,
  appFont,
  appFontSize,
  appLanguage,
  appCurrency,
  groups,
  isPro,
}) {
  return {
    _magic: BACKUP_MAGIC,
    _version: BACKUP_VERSION,
    _exportedAt: new Date().toISOString(),
    _profileName: profileName || 'Pengguna',
    data: {
      transactions: transactions || safeStorageGet('user_transactions') || [],
      expenseCategories: expenseCategories || safeStorageGet('user_expense_categories') || [],
      incomeCategories: incomeCategories || safeStorageGet('user_income_categories') || [],
      warehouseExpenseCategories: warehouseExpenseCategories || safeStorageGet('user_warehouse_expense_categories') || [],
      warehouseIncomeCategories: warehouseIncomeCategories || safeStorageGet('user_warehouse_income_categories') || [],
      accountsList: accountsList || safeStorageGet('user_accounts_list') || [],
      deletedAccountsList: deletedAccountsList || safeStorageGet('user_deleted_accounts') || [],
      warehouseAccounts: warehouseAccounts || safeStorageGet('user_warehouse_accounts') || [],
      accountInitialBalances: accountInitialBalances || safeStorageGet('user_account_initial_balances') || {},
      monthlyBudgetsMap: monthlyBudgetsMap || safeStorageGet('user_monthly_budgets_map') || {},
      profileName: profileName || safeStorageGet('user_profile_name') || '',
      profileImage: safeStorageGet('user_profile_image') || profileImage || null,
      profileSetupDone: safeStorageGet('user_profile_setup_done') || 'true',
      appFont: appFont || safeStorageGet('user_app_font') || 'lora',
      appFontSize: appFontSize || safeStorageGet('user_app_font_size') || 'default',
      appLanguage: appLanguage || safeStorageGet('user_app_lang') || 'id',
      appCurrency: appCurrency || safeStorageGet('user_app_currency') || 'IDR',
      budgetNotifState: safeStorageGet('user_budget_notif_state') || {},
      lastBadgeDismissed: safeStorageGet('user_last_badge_dismissed') || false,
      hasVisitedBudgetCap: safeStorageGet('user_has_visited_budget_cap') || false,
      mainMonthlyBudget: safeStorageGet('user_main_monthly_budget') || null,
      groups: groups || safeStorageGet('cassiel_groups_data') || [],
      isPro: isPro !== undefined ? isPro : (safeStorageGet('cassiel_is_pro_user') || false),
    },
  };
}

/**
 * Export backup as a downloadable/shareable TXT file.
 * On native mobile (Capacitor), saves file to cache, resolves URI via Filesystem.getUri(),
 * and invokes native Android / iOS Share Sheet (Google Drive, iCloud, Files, WhatsApp, etc.).
 * On web browser, triggers a direct text file download.
 * @param {Object} backupObj - The backup object from createBackupData
 * @param {string} userName - User's display name for the filename
 */
export async function exportBackup(backupObj, userName = 'User') {
  const safeName = (userName || 'User').replace(/[^a-zA-Z0-9_\-\s]/g, '').trim().replace(/\s+/g, '_') || 'User';
  const dateStr = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const fileName = `Cassiel_Backup_${safeName}_${dateStr}.txt`;
  const jsonStr = JSON.stringify(backupObj, null, 2);

  // 1. Native Mobile Mode (Capacitor Android / iOS)
  if (Capacitor.isNativePlatform()) {
    try {
      // Write file into temporary Cache directory
      const writeRes = await Filesystem.writeFile({
        path: fileName,
        data: jsonStr,
        directory: Directory.Cache,
        encoding: Encoding.UTF8,
        recursive: true,
      });

      // Android 15 & Scoped Storage fix:
      // Re-resolve authoritative content/file URI using Filesystem.getUri()
      let shareUri = writeRes?.uri;
      try {
        const uriResult = await Filesystem.getUri({
          path: fileName,
          directory: Directory.Cache,
        });
        if (uriResult?.uri) {
          shareUri = uriResult.uri;
        }
      } catch (uriErr) {
        console.warn('[Backup] getUri fallback:', uriErr);
      }

      // Ensure file:// scheme is present (required by Capacitor SharePlugin on Android)
      if (shareUri && !shareUri.startsWith('file://')) {
        shareUri = 'file://' + (shareUri.startsWith('/') ? '' : '/') + shareUri;
      }

      if (!shareUri) {
        throw new Error('Gagal mendapatkan URI berkas cadangan.');
      }

      // Check if Native Share Sheet is available
      let canShare = true;
      try {
        const check = await Share.canShare();
        canShare = check?.value !== false;
      } catch (e) {
        canShare = true;
      }

      if (canShare) {
        const isIos = Capacitor.getPlatform() === 'ios';
        const lang = safeStorageGet('user_app_lang') || 'id';
        const isEn = lang === 'en';
        const dialogTitle = isIos 
          ? (isEn ? 'Save Backup to iCloud Drive / Files' : 'Simpan Cadangan ke iCloud Drive / File')
          : (isEn ? 'Save Backup to Google Drive' : 'Simpan Cadangan ke Google Drive');

        // NOTE: Omit 'text' when sharing a file so Android intent resolver treats this
        // strictly as a file document (which brings up Google Drive "Simpan ke Drive", File Manager, etc.)
        await Share.share({
          title: isEn ? 'Backup Cassiel Data' : 'Cadangkan Data Cassiel',
          files: [shareUri],
          dialogTitle: dialogTitle,
        });
      }

      return { success: true, method: 'native_share', fileName };
    } catch (err) {
      if (err.message && (err.message.includes('cancel') || err.message.includes('dismiss') || err.message.includes('Abort') || err.message.includes('canceled') || err.message.includes('Share canceled'))) {
        return { success: false, cancelled: true };
      }
      console.warn('[Backup] Native share failed, attempting fallback:', err);
    }
  }

  // 2. Web Share API (Safari iOS / supported mobile web browsers)
  const blob = new Blob([jsonStr], { type: 'text/plain;charset=utf-8' });
  if (typeof navigator !== 'undefined' && navigator.share && navigator.canShare) {
    try {
      const file = new File([blob], fileName, { type: 'text/plain' });
      const shareData = { files: [file], title: 'Cassiel Backup', text: `Data cadangan ${safeName}` };
      if (navigator.canShare(shareData)) {
        await navigator.share(shareData);
        return { success: true, method: 'web_share' };
      }
    } catch (err) {
      if (err.name === 'AbortError' || err.message?.includes('Abort')) {
        return { success: false, cancelled: true };
      }
    }
  }

  // 3. Browser Direct Download Fallback
  try {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      try {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } catch (e) {}
    }, 300);
    return { success: true, method: 'download' };
  } catch (err) {
    console.error('[Backup] Export failed:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Universal Sanitizer & Parser for Backup files.
 * Handles:
 * - UTF-8 BOM (\uFEFF)
 * - Zero-width spaces
 * - Smart / curly quotes (“” ‘’)
 * - Text header prefixes (e.g. FINANCE_TRACKER_BACKUP)
 * - Raw arrays [{ id, amount }]
 * - LocalStorage key dumps (user_transactions, user_profile_name, etc.)
 */
function safeJsonParseField(val, fallback) {
  if (val === undefined || val === null) return fallback;
  if (typeof val === 'string') {
    try {
      return JSON.parse(val);
    } catch {
      return val;
    }
  }
  return val;
}

export function normalizeBackupData(raw) {
  if (!raw || typeof raw !== 'object') return {};

  const txRaw = safeJsonParseField(raw.transactions ?? raw.user_transactions, []);
  const transactions = Array.isArray(txRaw) ? txRaw.map(t => {
    if (!t || typeof t !== 'object') return null;
    return {
      id: String(t.id || Date.now() + Math.random()),
      amount: typeof t.amount === 'number' ? t.amount : Number(String(t.amount || 0).replace(/[^0-9.-]+/g, '')) || 0,
      type: (t.type === 'Income' || t.type === 'income') ? 'Income' : 'Expense',
      category: t.category || (t.type === 'Income' || t.type === 'income' ? 'Gaji' : 'Lainnya'),
      categoryId: t.categoryId || t.category_id || t.idCategory || '',
      account: t.account || t.wallet || t.accountName || 'Cash',
      date: t.date || new Date().toISOString().slice(0, 10),
      note: t.note || t.description || '',
      icon: t.icon || '',
      ...t
    };
  }).filter(Boolean) : [];

  const expCatsRaw = safeJsonParseField(raw.expenseCategories ?? raw.user_expense_categories, null);
  const incCatsRaw = safeJsonParseField(raw.incomeCategories ?? raw.user_income_categories, null);
  const accountsRaw = safeJsonParseField(raw.accountsList ?? raw.user_accounts_list, null);
  const deletedAccsRaw = safeJsonParseField(raw.deletedAccountsList ?? raw.user_deleted_accounts, []);
  const warehouseAccountsRaw = safeJsonParseField(raw.warehouseAccounts ?? raw.user_warehouse_accounts, []);
  const warehouseExpRaw = safeJsonParseField(raw.warehouseExpenseCategories ?? raw.user_warehouse_expense_categories, []);
  const warehouseIncRaw = safeJsonParseField(raw.warehouseIncomeCategories ?? raw.user_warehouse_income_categories, []);
  const balancesRaw = safeJsonParseField(raw.accountInitialBalances ?? raw.user_account_initial_balances ?? raw.accountBalances, {});
  const budgetsMapRaw = safeJsonParseField(raw.monthlyBudgetsMap ?? raw.user_monthly_budgets_map, {});
  const groupsRaw = safeJsonParseField(raw.groups ?? raw.cassiel_groups_data, []);

  return {
    transactions,
    expenseCategories: Array.isArray(expCatsRaw) ? expCatsRaw : undefined,
    incomeCategories: Array.isArray(incCatsRaw) ? incCatsRaw : undefined,
    warehouseExpenseCategories: Array.isArray(warehouseExpRaw) ? warehouseExpRaw : [],
    warehouseIncomeCategories: Array.isArray(warehouseIncRaw) ? warehouseIncRaw : [],
    accountsList: Array.isArray(accountsRaw) ? accountsRaw : undefined,
    deletedAccountsList: Array.isArray(deletedAccsRaw) ? deletedAccsRaw : [],
    warehouseAccounts: Array.isArray(warehouseAccountsRaw) ? warehouseAccountsRaw : [],
    accountInitialBalances: typeof balancesRaw === 'object' && balancesRaw !== null ? balancesRaw : {},
    monthlyBudgetsMap: typeof budgetsMapRaw === 'object' && budgetsMapRaw !== null ? budgetsMapRaw : {},
    profileName: String(raw.profileName ?? raw.user_profile_name ?? raw._profileName ?? '').trim(),
    profileImage: raw.profileImage ?? raw.user_profile_image ?? null,
    profileSetupDone: 'true',
    appFont: String(raw.appFont ?? raw.user_app_font ?? 'lora'),
    appFontSize: String(raw.appFontSize ?? raw.user_app_font_size ?? 'default'),
    appLanguage: String(raw.appLanguage ?? raw.user_app_lang ?? 'id'),
    appCurrency: String(raw.appCurrency ?? raw.user_app_currency ?? 'IDR'),
    mainMonthlyBudget: raw.mainMonthlyBudget ?? raw.user_main_monthly_budget ?? null,
    groups: Array.isArray(groupsRaw) ? groupsRaw : [],
    isPro: Boolean(raw.isPro ?? raw.cassiel_is_pro_user ?? false),
  };
}

export function parseBackupContent(rawText) {
  if (!rawText || typeof rawText !== 'string') return null;

  let text = rawText.trim();
  // 1. Remove UTF-8 BOM if present
  if (text.charCodeAt(0) === 0xFEFF) {
    text = text.slice(1).trim();
  }
  // 2. Remove zero-width spaces and non-breaking spaces
  text = text.replace(/[\u200B-\u200D\uFEFF]/g, '');

  // 3. Replace smart / curly quotes from WhatsApp, text editors, iOS keyboard
  text = text
    .replace(/[\u201C\u201D\u201E\u201F\u00AB\u00BB]/g, '"')
    .replace(/[\u2018\u2019\u201A\u201B]/g, "'");

  // 4. If payload starts with enc:v1:, decrypt it first
  if (text.startsWith('enc:v1:')) {
    const decrypted = syncDecrypt(text);
    if (decrypted) text = decrypted.trim();
  }

  // 5. If payload has legacy header (e.g. FINANCE_TRACKER_BACKUP\n{...}), strip leading header
  if (!text.startsWith('{') && !text.startsWith('[')) {
    const firstBrace = text.indexOf('{');
    const firstBracket = text.indexOf('[');
    let startIdx = -1;
    if (firstBrace !== -1 && firstBracket !== -1) {
      startIdx = Math.min(firstBrace, firstBracket);
    } else if (firstBrace !== -1) {
      startIdx = firstBrace;
    } else if (firstBracket !== -1) {
      startIdx = firstBracket;
    }
    if (startIdx !== -1) {
      text = text.substring(startIdx).trim();
    }
  }

  // 6. Try JSON parsing with trailing-comma recovery
  let parsed = null;
  try {
    parsed = JSON.parse(text);
  } catch {
    try {
      const sanitized = text.replace(/,\s*([}\]])/g, '$1');
      parsed = JSON.parse(sanitized);
    } catch {
      return null;
    }
  }

  // 7. Handle double-stringified JSON
  if (typeof parsed === 'string') {
    try {
      parsed = JSON.parse(parsed);
    } catch {}
  }

  if (!parsed || typeof parsed !== 'object') {
    return null;
  }

  // 8. Case A: Wrapped backup format (_magic or standard data wrapper)
  if (parsed.data && typeof parsed.data === 'object') {
    return {
      _magic: BACKUP_MAGIC,
      _version: parsed._version || 1,
      _exportedAt: parsed._exportedAt || new Date().toISOString(),
      _profileName: parsed._profileName || parsed.data.profileName || 'Pengguna',
      data: normalizeBackupData(parsed.data)
    };
  }

  // 9. Case B: Array of transactions directly [ { id, amount, ... } ]
  if (Array.isArray(parsed)) {
    return {
      _magic: BACKUP_MAGIC,
      _version: 1,
      _exportedAt: new Date().toISOString(),
      _profileName: 'Pengguna',
      data: normalizeBackupData({ transactions: parsed })
    };
  }

  // 10. Case C: Raw root object dump or localStorage dump
  return {
    _magic: BACKUP_MAGIC,
    _version: 1,
    _exportedAt: parsed._exportedAt || new Date().toISOString(),
    _profileName: parsed._profileName || parsed.profileName || parsed.user_profile_name || 'Pengguna',
    data: normalizeBackupData(parsed)
  };
}

/**
 * Open a file picker and import a backup TXT or JSON file.
 * Returns the parsed backup data or null if cancelled/invalid.
 */
export function importBackup() {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.txt,text/plain,.json,application/json,*/*';
    input.style.display = 'none';

    input.addEventListener('change', (e) => {
      const file = e.target.files?.[0];
      if (!file) {
        resolve(null);
        return;
      }

      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const content = (ev.target.result || '').trim();
          const parsed = parseBackupContent(content);
          if (!parsed || !parsed.data) {
            resolve({ error: 'invalid_format' });
            return;
          }
          resolve({ success: true, backup: parsed });
        } catch {
          resolve({ error: 'parse_error' });
        }
      };
      reader.onerror = () => resolve({ error: 'read_error' });
      reader.readAsText(file);
    });

    // Handle cancel (no file selected)
    input.addEventListener('cancel', () => resolve(null));

    document.body.appendChild(input);
    input.click();
    setTimeout(() => {
      try {
        if (input.parentNode) input.parentNode.removeChild(input);
      } catch {}
    }, 60000); // Cleanup after 1 min
  });
}

/**
 * Restore all data from a validated backup object.
 * Updates React state setters AND persists to safeStorage.
 * @param {Object} backupData - The `data` property from the backup object
 * @param {Object} setters - React state setters
 */
export function restoreBackupData(backupData, {
  setTransactions,
  setExpenseCategories,
  setIncomeCategories,
  setWarehouseExpenseCategories,
  setWarehouseIncomeCategories,
  setAccountsList,
  setDeletedAccountsList,
  setWarehouseAccountsList,
  setAccountInitialBalances,
  setMonthlyBudgetsMap,
  setProfileName,
  setProfileImage,
  setAppFont,
  setAppFontSize,
  setAppLanguage,
  setAppCurrency,
  setMainMonthlyBudget,
  setIsPro,
}) {
  try {
    const d = backupData;

    // 1. Transactions
    if (Array.isArray(d.transactions) && setTransactions) {
      setTransactions(d.transactions);
      safeStorageSet('user_transactions', d.transactions);
    }

    // 2. Expense Categories (includes budget monthlyLimit)
    if (Array.isArray(d.expenseCategories) && setExpenseCategories) {
      setExpenseCategories(d.expenseCategories);
      safeStorageSet('user_expense_categories', d.expenseCategories);
    }

    // 3. Income Categories
    if (Array.isArray(d.incomeCategories) && setIncomeCategories) {
      setIncomeCategories(d.incomeCategories);
      safeStorageSet('user_income_categories', d.incomeCategories);
    }

    // 4. Warehouse Categories
    if (Array.isArray(d.warehouseExpenseCategories) && setWarehouseExpenseCategories) {
      setWarehouseExpenseCategories(d.warehouseExpenseCategories);
      safeStorageSet('user_warehouse_expense_categories', d.warehouseExpenseCategories);
    }
    if (Array.isArray(d.warehouseIncomeCategories) && setWarehouseIncomeCategories) {
      setWarehouseIncomeCategories(d.warehouseIncomeCategories);
      safeStorageSet('user_warehouse_income_categories', d.warehouseIncomeCategories);
    }

    // 5. Accounts
    if (Array.isArray(d.accountsList) && setAccountsList) {
      setAccountsList(d.accountsList);
      safeStorageSet('user_accounts_list', d.accountsList);
    }

    // 6. Deleted & Warehouse Accounts
    if (Array.isArray(d.deletedAccountsList) && setDeletedAccountsList) {
      setDeletedAccountsList(d.deletedAccountsList);
      safeStorageSet('user_deleted_accounts', d.deletedAccountsList);
    }
    if (Array.isArray(d.warehouseAccounts) && setWarehouseAccountsList) {
      setWarehouseAccountsList(d.warehouseAccounts);
      safeStorageSet('user_warehouse_accounts', d.warehouseAccounts);
    }

    // 7. Account Initial Balances
    if (d.accountInitialBalances && typeof d.accountInitialBalances === 'object') {
      if (setAccountInitialBalances) setAccountInitialBalances(d.accountInitialBalances);
      safeStorageSet('user_account_initial_balances', d.accountInitialBalances);
    }

    // 8. Monthly Budgets Map
    if (d.monthlyBudgetsMap && typeof d.monthlyBudgetsMap === 'object') {
      if (setMonthlyBudgetsMap) setMonthlyBudgetsMap(d.monthlyBudgetsMap);
      safeStorageSet('user_monthly_budgets_map', d.monthlyBudgetsMap);
    }

    // 9. Profile
    if (d.profileName !== undefined && setProfileName) {
      setProfileName(d.profileName);
      safeStorageSet('user_profile_name', d.profileName);
    }
    if (d.profileImage !== undefined && setProfileImage) {
      setProfileImage(d.profileImage);
      safeStorageSet('user_profile_image', d.profileImage);
    }
    if (d.profileSetupDone) {
      safeStorageSet('user_profile_setup_done', d.profileSetupDone);
    }

    // 10. App Preferences
    if (d.appFont) {
      if (typeof setAppFont === 'function') setAppFont(d.appFont);
      safeStorageSet('user_app_font', d.appFont);
    }
    if (d.appFontSize) {
      if (typeof setAppFontSize === 'function') setAppFontSize(d.appFontSize);
      safeStorageSet('user_app_font_size', d.appFontSize);
    }
    if (d.appLanguage && setAppLanguage) {
      setAppLanguage(d.appLanguage);
      safeStorageSet('user_app_lang', d.appLanguage);
    }
    if (d.appCurrency && setAppCurrency) {
      setAppCurrency(d.appCurrency);
      safeStorageSet('user_app_currency', d.appCurrency);
    }

    // 11. Main Budget
    if (d.mainMonthlyBudget !== undefined) {
      if (setMainMonthlyBudget) setMainMonthlyBudget(d.mainMonthlyBudget ? Number(d.mainMonthlyBudget) : null);
      if (d.mainMonthlyBudget) {
        safeStorageSet('user_main_monthly_budget', String(d.mainMonthlyBudget));
      } else {
        localStorage.removeItem('user_main_monthly_budget');
      }
    }

    // 12. Groups & Pro
    if (Array.isArray(d.groups)) {
      safeStorageSet('cassiel_groups_data', d.groups);
    }
    if (d.isPro !== undefined && setIsPro) {
      setIsPro(Boolean(d.isPro));
      safeStorageSet('cassiel_is_pro_user', Boolean(d.isPro));
    }

    return { success: true };
  } catch (err) {
    console.error('[Backup] Restore failed:', err);
    return { success: false, error: err.message };
  }
}

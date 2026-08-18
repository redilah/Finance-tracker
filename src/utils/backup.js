/**
 * Backup & Restore Utility for Cassiel Finance Tracker
 * Supports full data export (JSON) and import with validation.
 * Compatible with Android (Google Drive), iOS (iCloud/Files), and Web.
 */

import { safeStorageGet, safeStorageSet } from './secureStorage';

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
  accountsList,
  deletedAccountsList,
  profileName,
  profileImage,
  appFont,
  appLanguage,
  appCurrency,
}) {
  return {
    _magic: BACKUP_MAGIC,
    _version: BACKUP_VERSION,
    _exportedAt: new Date().toISOString(),
    _profileName: profileName || 'Pengguna',
    data: {
      transactions: transactions || [],
      expenseCategories: expenseCategories || [],
      incomeCategories: incomeCategories || [],
      accountsList: accountsList || [],
      deletedAccountsList: deletedAccountsList || [],
      profileName: profileName || '',
      profileImage: safeStorageGet('user_profile_image') || profileImage || null,
      profileSetupDone: safeStorageGet('user_profile_setup_done') || 'true',
      appFont: appFont || 'lora',
      appLanguage: appLanguage || 'id',
      appCurrency: appCurrency || 'IDR',
      budgetNotifState: safeStorageGet('user_budget_notif_state') || {},
      lastBadgeDismissed: safeStorageGet('user_last_badge_dismissed') || false,
      hasVisitedBudgetCap: safeStorageGet('user_has_visited_budget_cap') || false,
    },
  };
}

/**
 * Export backup as a downloadable JSON file.
 * On mobile (Capacitor), uses native share sheet for Google Drive / iCloud.
 * On web, triggers a file download.
 * @param {Object} backupObj - The backup object from createBackupData
 * @param {string} userName - User's display name for the filename
 */
export async function exportBackup(backupObj, userName = 'User') {
  const safeName = (userName || 'User').replace(/[^a-zA-Z0-9_\-\s]/g, '').trim().replace(/\s+/g, '_') || 'User';
  const dateStr = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const fileName = `Cassiel_Backup_${safeName}_${dateStr}.json`;
  const jsonStr = JSON.stringify(backupObj, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });

  // Try native Web Share API (works on Android WebView & Safari iOS)
  if (navigator.share && navigator.canShare) {
    try {
      const file = new File([blob], fileName, { type: 'application/json' });
      const shareData = { files: [file], title: 'Cassiel Backup', text: `Data cadangan ${safeName}` };
      if (navigator.canShare(shareData)) {
        await navigator.share(shareData);
        return { success: true, method: 'share' };
      }
    } catch (err) {
      // User cancelled share or share not supported for files — fall through to download
      if (err.name === 'AbortError') {
        return { success: false, cancelled: true };
      }
    }
  }

  // Fallback: direct download (works on web & some Android WebViews)
  try {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 200);
    return { success: true, method: 'download' };
  } catch (err) {
    console.error('[Backup] Export failed:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Open a file picker and import a backup JSON file.
 * Returns the parsed backup data or null if cancelled/invalid.
 */
export function importBackup() {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';
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
          const parsed = JSON.parse(ev.target.result);
          // Validate backup structure
          if (parsed._magic !== BACKUP_MAGIC || !parsed.data) {
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
      document.body.removeChild(input);
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
  setAccountsList,
  setDeletedAccountsList,
  setProfileName,
  setProfileImage,
  setAppFont,
  setAppLanguage,
  setAppCurrency,
}) {
  try {
    const d = backupData;

    // 1. Transactions
    if (Array.isArray(d.transactions)) {
      setTransactions(d.transactions);
      safeStorageSet('user_transactions', d.transactions);
    }

    // 2. Expense Categories (includes budget monthlyLimit)
    if (Array.isArray(d.expenseCategories)) {
      setExpenseCategories(d.expenseCategories);
      safeStorageSet('user_expense_categories', d.expenseCategories);
    }

    // 3. Income Categories
    if (Array.isArray(d.incomeCategories)) {
      setIncomeCategories(d.incomeCategories);
      safeStorageSet('user_income_categories', d.incomeCategories);
    }

    // 4. Accounts
    if (Array.isArray(d.accountsList)) {
      setAccountsList(d.accountsList);
      safeStorageSet('user_accounts_list', d.accountsList);
    }

    // 5. Deleted Accounts
    if (Array.isArray(d.deletedAccountsList)) {
      setDeletedAccountsList(d.deletedAccountsList);
      safeStorageSet('user_deleted_accounts', d.deletedAccountsList);
    }

    // 6. Profile
    if (d.profileName !== undefined) {
      setProfileName(d.profileName);
      safeStorageSet('user_profile_name', d.profileName);
    }
    if (d.profileImage !== undefined) {
      setProfileImage(d.profileImage);
      safeStorageSet('user_profile_image', d.profileImage);
    }
    if (d.profileSetupDone) {
      safeStorageSet('user_profile_setup_done', d.profileSetupDone);
    }

    // 7. App Preferences
    if (d.appFont) {
      setAppFont(d.appFont);
      safeStorageSet('user_app_font', d.appFont);
    }
    if (d.appLanguage) {
      setAppLanguage(d.appLanguage);
      safeStorageSet('user_app_lang', d.appLanguage);
    }
    if (d.appCurrency) {
      setAppCurrency(d.appCurrency);
      safeStorageSet('user_app_currency', d.appCurrency);
    }

    // 8. Minor flags
    if (d.budgetNotifState) {
      safeStorageSet('user_budget_notif_state', d.budgetNotifState);
    }
    if (d.lastBadgeDismissed !== undefined) {
      safeStorageSet('user_last_badge_dismissed', d.lastBadgeDismissed);
    }
    if (d.hasVisitedBudgetCap !== undefined) {
      safeStorageSet('user_has_visited_budget_cap', d.hasVisitedBudgetCap);
    }

    return { success: true };
  } catch (err) {
    console.error('[Backup] Restore failed:', err);
    return { success: false, error: err.message };
  }
}

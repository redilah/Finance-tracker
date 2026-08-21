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
  appFontSize,
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
      appFontSize: appFontSize || 'default',
      appLanguage: appLanguage || 'id',
      appCurrency: appCurrency || 'IDR',
      budgetNotifState: safeStorageGet('user_budget_notif_state') || {},
      lastBadgeDismissed: safeStorageGet('user_last_badge_dismissed') || false,
      hasVisitedBudgetCap: safeStorageGet('user_has_visited_budget_cap') || false,
      mainMonthlyBudget: safeStorageGet('user_main_monthly_budget') || null,
    },
  };
}

import { Capacitor } from '@capacitor/core';
import { Share } from '@capacitor/share';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';

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
        const dialogTitle = isIos 
          ? 'Simpan Cadangan ke iCloud Drive / File' 
          : 'Simpan Cadangan ke Google Drive';

        // NOTE: Omit 'text' when sharing a file so Android intent resolver treats this
        // strictly as a file document (which brings up Google Drive "Simpan ke Drive", File Manager, etc.)
        await Share.share({
          title: 'Cadangkan Data Cassiel',
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
 * Open a file picker and import a backup TXT or JSON file.
 * Returns the parsed backup data or null if cancelled/invalid.
 */
export function importBackup() {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.txt,text/plain,.json,application/json';
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
          const parsed = JSON.parse(content);
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
  setAppFontSize,
  setAppLanguage,
  setAppCurrency,
  setMainMonthlyBudget,
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
    if (d.appFontSize && setAppFontSize) {
      setAppFontSize(d.appFontSize);
      safeStorageSet('user_app_font_size', d.appFontSize);
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
    if (d.mainMonthlyBudget !== undefined) {
      if (setMainMonthlyBudget) setMainMonthlyBudget(d.mainMonthlyBudget ? Number(d.mainMonthlyBudget) : null);
      if (d.mainMonthlyBudget) {
        safeStorageSet('user_main_monthly_budget', String(d.mainMonthlyBudget));
      } else {
        localStorage.removeItem('user_main_monthly_budget');
      }
    }

    return { success: true };
  } catch (err) {
    console.error('[Backup] Restore failed:', err);
    return { success: false, error: err.message };
  }
}

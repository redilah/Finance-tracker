/**
 * Cassiel Pro & Freemium Feature Manager
 * Mengelola status Pro (dilindungi tanda tangan integritas MASVS-RESILIENCE-1),
 * kuota penggunaan Voice AI Mic, limit grup, dan kuota auto-tracker.
 */

import { computeIntegritySignature, verifyIntegritySignature } from './secureStorage';

const STORAGE_KEY_IS_PRO = 'cassiel_is_pro_user';
const STORAGE_KEY_PRO_SIG = 'cassiel_is_pro_sig';
const STORAGE_KEY_VOICE_QUOTA = 'cassiel_voice_mic_quota';
const STORAGE_KEY_DAILY_AUTO_TRACK = 'cassiel_daily_autotrack_usage';
const STORAGE_KEY_EXCEL_QUOTA = 'cassiel_excel_export_quota';
const STORAGE_KEY_EXCEL_LAST_RESET_MONTH = 'cassiel_excel_last_reset_month';

export const FREE_VOICE_QUOTA_DEFAULT = 40;
export const FREE_MAX_GROUPS = 3;
export const FREE_DAILY_AUTO_TRACK_LIMIT = 5;
export const FREE_EXCEL_QUOTA_DEFAULT = 25;
export const FREE_EXCEL_MONTHLY_RESET_QUOTA = 5;

/**
 * Cek apakah user berstatus Pro (dengan verifikasi segel integritas perangkat & auto-migrasi aman)
 */
export function isProUser() {
  if (typeof localStorage === 'undefined') return false;
  try {
    const rawPro = localStorage.getItem(STORAGE_KEY_IS_PRO);
    if (rawPro !== 'true') return false;

    const sig = localStorage.getItem(STORAGE_KEY_PRO_SIG);
    if (sig && verifyIntegritySignature(STORAGE_KEY_IS_PRO, 'true', sig)) {
      return true;
    }

    // Auto-migrasi aman untuk pengguna Pro sah yang sudah aktif sebelum sistem segel dipasang
    const hasDonationProofs = Boolean(localStorage.getItem('cassiel_user_donation_proofs'));
    const hasMigratedSig = Boolean(localStorage.getItem('cassiel_pro_sig_v1_migrated'));
    if (!sig && (!hasMigratedSig || hasDonationProofs)) {
      const newSig = computeIntegritySignature(STORAGE_KEY_IS_PRO, 'true');
      localStorage.setItem(STORAGE_KEY_PRO_SIG, newSig);
      localStorage.setItem('cassiel_pro_sig_v1_migrated', 'true');
      return true;
    }

    return false;
  } catch {
    return false;
  }
}

/**
 * Ubah status Pro (misal setelah pembelian / restore / toggle testing)
 * Menyertakan tanda tangan integritas perangkat secara otomatis.
 */
export function setProUser(status) {
  if (typeof localStorage === 'undefined') return;
  const valStr = status ? 'true' : 'false';
  localStorage.setItem(STORAGE_KEY_IS_PRO, valStr);
  localStorage.setItem(STORAGE_KEY_PRO_SIG, computeIntegritySignature(STORAGE_KEY_IS_PRO, valStr));
  localStorage.setItem('cassiel_pro_sig_v1_migrated', 'true');
  window.dispatchEvent(new CustomEvent('cassiel_pro_status_changed', { detail: { isPro: !!status } }));
}

/**
 * Dapatkan sisa kuota Voice AI Mic
 */
export function getVoiceQuota() {
  if (typeof localStorage === 'undefined') return FREE_VOICE_QUOTA_DEFAULT;
  const val = localStorage.getItem(STORAGE_KEY_VOICE_QUOTA);
  if (val === null || val === undefined) {
    localStorage.setItem(STORAGE_KEY_VOICE_QUOTA, String(FREE_VOICE_QUOTA_DEFAULT));
    return FREE_VOICE_QUOTA_DEFAULT;
  }
  const num = parseInt(val, 10);
  if (isNaN(num)) return FREE_VOICE_QUOTA_DEFAULT;
  
  // Jika kuota tersimpan masih default lama (7), migrasikan ke batas baru (40)
  if (num === 7 && !localStorage.getItem('cassiel_voice_quota_v40_migrated')) {
    localStorage.setItem(STORAGE_KEY_VOICE_QUOTA, String(FREE_VOICE_QUOTA_DEFAULT));
    localStorage.setItem('cassiel_voice_quota_v40_migrated', 'true');
    return FREE_VOICE_QUOTA_DEFAULT;
  }
  return Math.max(0, num);
}

/**
 * Cek apakah user memiliki akses menggunakan Voice Mic
 */
export function hasVoiceQuota() {
  if (isProUser()) return true;
  return getVoiceQuota() > 0;
}

/**
 * Kurangi 1 kuota Voice Mic jika user berstatus Free
 * Mengembalikan sisa kuota setelah dikurangi
 */
export function decrementVoiceQuota() {
  if (isProUser()) return Infinity;
  const current = getVoiceQuota();
  const next = Math.max(0, current - 1);
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(STORAGE_KEY_VOICE_QUOTA, String(next));
    window.dispatchEvent(new CustomEvent('cassiel_voice_quota_changed', { detail: { quota: next } }));
  }
  return next;
}

/**
 * Dapatkan sisa kuota ekspor Excel dan lakukan auto-reset bulanan jika bulan berganti
 */
export function getExcelExportQuota() {
  if (typeof localStorage === 'undefined') return FREE_EXCEL_QUOTA_DEFAULT;
  
  const currentMonth = new Date().toISOString().slice(0, 7); // Format: "YYYY-MM"
  const lastResetMonth = localStorage.getItem(STORAGE_KEY_EXCEL_LAST_RESET_MONTH);
  const rawQuota = localStorage.getItem(STORAGE_KEY_EXCEL_QUOTA);

  // Jika pertama kali / belum pernah ada catatan kuota
  if (rawQuota === null || rawQuota === undefined) {
    localStorage.setItem(STORAGE_KEY_EXCEL_QUOTA, String(FREE_EXCEL_QUOTA_DEFAULT));
    localStorage.setItem(STORAGE_KEY_EXCEL_LAST_RESET_MONTH, currentMonth);
    return FREE_EXCEL_QUOTA_DEFAULT;
  }

  let quota = parseInt(rawQuota, 10);
  if (isNaN(quota)) quota = FREE_EXCEL_QUOTA_DEFAULT;

  // Cek apakah sudah berganti bulan
  if (!lastResetMonth) {
    localStorage.setItem(STORAGE_KEY_EXCEL_LAST_RESET_MONTH, currentMonth);
  } else if (lastResetMonth !== currentMonth) {
    // Bulan baru! Reset kuota minimal 5 kali ekspor per bulan
    if (quota < FREE_EXCEL_MONTHLY_RESET_QUOTA) {
      quota = FREE_EXCEL_MONTHLY_RESET_QUOTA;
      localStorage.setItem(STORAGE_KEY_EXCEL_QUOTA, String(quota));
    }
    localStorage.setItem(STORAGE_KEY_EXCEL_LAST_RESET_MONTH, currentMonth);
  }

  return Math.max(0, quota);
}

/**
 * Cek apakah user memiliki kuota untuk mengekspor Excel
 */
export function hasExcelExportQuota() {
  if (isProUser()) return true;
  return getExcelExportQuota() > 0;
}

/**
 * Kurangi 1 kuota ekspor Excel jika user berstatus Free
 * Mengembalikan sisa kuota setelah dikurangi
 */
export function decrementExcelExportQuota() {
  if (isProUser()) return Infinity;
  const current = getExcelExportQuota();
  const next = Math.max(0, current - 1);
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(STORAGE_KEY_EXCEL_QUOTA, String(next));
    window.dispatchEvent(new CustomEvent('cassiel_excel_quota_changed', { detail: { quota: next } }));
  }
  return next;
}

/**
 * Cek apakah user boleh membuat grup baru
 */
export function canCreateGroup(currentGroupCount = 0) {
  if (isProUser()) return true;
  return currentGroupCount < FREE_MAX_GROUPS;
}

/**
 * Dapatkan data penggunaan harian Auto Tracker Notifikasi
 */
export function getDailyAutoTrackUsage() {
  if (typeof localStorage === 'undefined') return { count: 0, date: '' };
  try {
    const today = new Date().toISOString().split('T')[0];
    const raw = localStorage.getItem(STORAGE_KEY_DAILY_AUTO_TRACK);
    if (!raw) return { count: 0, date: today };
    const parsed = JSON.parse(raw);
    if (parsed.date !== today) {
      return { count: 0, date: today };
    }
    return parsed;
  } catch {
    return { count: 0, date: new Date().toISOString().split('T')[0] };
  }
}

/**
 * Cek apakah auto-tracker notifikasi masih bisa mencatat transaksi baru hari ini
 */
export function canAutoTrack() {
  if (isProUser()) return true;
  const usage = getDailyAutoTrackUsage();
  return usage.count < FREE_DAILY_AUTO_TRACK_LIMIT;
}

/**
 * Tambah counter pencatatan harian auto-tracker
 */
export function incrementDailyAutoTrack() {
  if (isProUser() || typeof localStorage === 'undefined') return;
  const today = new Date().toISOString().split('T')[0];
  const usage = getDailyAutoTrackUsage();
  const nextCount = (usage.date === today ? usage.count : 0) + 1;
  localStorage.setItem(STORAGE_KEY_DAILY_AUTO_TRACK, JSON.stringify({
    date: today,
    count: nextCount
  }));
}

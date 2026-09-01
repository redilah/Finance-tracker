/**
 * Cassiel Pro & Freemium Feature Manager
 * Mengelola status Pro, kuota penggunaan Voice AI Mic, limit grup, dan kuota auto-tracker.
 */

const STORAGE_KEY_IS_PRO = 'cassiel_is_pro_user';
const STORAGE_KEY_VOICE_QUOTA = 'cassiel_voice_mic_quota';
const STORAGE_KEY_DAILY_AUTO_TRACK = 'cassiel_daily_autotrack_usage';

export const FREE_VOICE_QUOTA_DEFAULT = 40;
export const FREE_MAX_GROUPS = 3;
export const FREE_DAILY_AUTO_TRACK_LIMIT = 5;

/**
 * Cek apakah user berstatus Pro
 */
export function isProUser() {
  if (typeof localStorage === 'undefined') return false;
  return localStorage.getItem(STORAGE_KEY_IS_PRO) === 'true';
}

/**
 * Ubah status Pro (misal setelah pembelian / restore / toggle testing)
 */
export function setProUser(status) {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(STORAGE_KEY_IS_PRO, status ? 'true' : 'false');
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

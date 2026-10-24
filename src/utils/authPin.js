import { safeStorageGet, safeStorageSet, getDeviceSalt, computeIntegritySignature, verifyIntegritySignature } from './secureStorage';

const PIN_STORAGE_KEY = 'cassiel_user_pin';
const BIOMETRIC_ENABLED_KEY = 'cassiel_biometric_enabled';
const PIN_FAILURES_KEY = 'cassiel_pin_failures_count';
const PIN_LOCKOUT_KEY = 'cassiel_pin_lockout_until';
const PIN_LOCKOUT_SIG_KEY = 'cassiel_pin_lockout_sig';
const MAX_FAILURES = 5;
const LOCKOUT_DURATION_MS = 30000; // 30 detik

// In-memory shadow state agar upaya menghapus localStorage saat sesi aktif tidak bisa membobol lockout (MASVS-AUTH-2)
let memoryPinFailures = 0;
let memoryLockoutUntil = 0;

/**
 * SHA-256 hash helper menggunakan Web Crypto API yang digabung dengan salt unik perangkat
 */
export async function hashPin(pin) {
  if (!pin) return '';
  const salt = getDeviceSalt();
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(`cassiel_pin_salt_${salt}_${pin}_2026`);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  } catch {
    // Fallback keyed hash if subtle crypto not available
    return computeIntegritySignature(PIN_STORAGE_KEY, `${salt}_${pin}`);
  }
}

/**
 * Hash helper legacy (garam statis versi lama) untuk mendukung migrasi PIN pengguna lama
 */
export async function hashPinLegacy(pin) {
  if (!pin) return '';
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(`cassiel_pin_salt_${pin}_2026`);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  } catch {
    let hash = 0;
    const str = `cassiel_pin_salt_${pin}`;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash |= 0;
    }
    return `fb_${Math.abs(hash)}`;
  }
}

/**
 * Periksa sisa durasi lockout jika pengguna salah memasukkan PIN berkali-kali
 * Dilindungi dengan in-memory shadow state & integrity signature (OWASP MASVS-AUTH-2)
 * @returns {number} sisa detik lockout (0 jika tidak terkunci)
 */
export function getPinLockoutRemainingSeconds() {
  try {
    const now = Date.now();
    const storedUntil = parseInt(localStorage.getItem(PIN_LOCKOUT_KEY) || '0', 10);
    const sig = localStorage.getItem(PIN_LOCKOUT_SIG_KEY);

    // Jika ada indikasi manipulasi tanda tangan pada lockout aktif, pertahankan lockout maksimum
    if (storedUntil > 0 && sig && !verifyIntegritySignature(PIN_LOCKOUT_KEY, String(storedUntil), sig)) {
      memoryLockoutUntil = Math.max(memoryLockoutUntil, now + LOCKOUT_DURATION_MS);
    }

    const effectiveUntil = Math.max(storedUntil, memoryLockoutUntil);
    if (effectiveUntil > now) {
      return Math.ceil((effectiveUntil - now) / 1000);
    }
    if (storedUntil > 0 || memoryLockoutUntil > 0) {
      memoryLockoutUntil = 0;
      memoryPinFailures = 0;
      localStorage.removeItem(PIN_LOCKOUT_KEY);
      localStorage.removeItem(PIN_LOCKOUT_SIG_KEY);
      localStorage.removeItem(PIN_FAILURES_KEY);
    }
    return 0;
  } catch {
    return 0;
  }
}

/**
 * Catat kegagalan input PIN. Jika mencapai batas (5x), aktifkan lockout 30 detik.
 */
export function recordFailedPinAttempt() {
  try {
    const storedFailures = parseInt(localStorage.getItem(PIN_FAILURES_KEY) || '0', 10);
    const current = Math.max(storedFailures, memoryPinFailures) + 1;
    memoryPinFailures = current;
    localStorage.setItem(PIN_FAILURES_KEY, String(current));
    if (current >= MAX_FAILURES) {
      const lockoutUntil = Date.now() + LOCKOUT_DURATION_MS;
      memoryLockoutUntil = lockoutUntil;
      const untilStr = String(lockoutUntil);
      localStorage.setItem(PIN_LOCKOUT_KEY, untilStr);
      localStorage.setItem(PIN_LOCKOUT_SIG_KEY, computeIntegritySignature(PIN_LOCKOUT_KEY, untilStr));
      return Math.ceil(LOCKOUT_DURATION_MS / 1000);
    }
    return 0;
  } catch {
    return 0;
  }
}

/**
 * Reset counter kegagalan PIN saat autentikasi sukses
 */
export function resetPinFailures() {
  try {
    memoryPinFailures = 0;
    memoryLockoutUntil = 0;
    localStorage.removeItem(PIN_FAILURES_KEY);
    localStorage.removeItem(PIN_LOCKOUT_KEY);
    localStorage.removeItem(PIN_LOCKOUT_SIG_KEY);
  } catch {
    // Ignore storage errors
  }
}

/**
 * Check if user already set a PIN.
 * Read directly from localStorage (hash is already safe via SHA-256).
 */
export function hasUserPin() {
  try {
    const raw = localStorage.getItem(PIN_STORAGE_KEY);
    return Boolean(raw && raw.length > 0);
  } catch {
    return false;
  }
}

/**
 * Save newly created PIN hash directly in localStorage
 */
export async function saveUserPin(pin) {
  if (!pin || pin.length !== 6) return false;
  const hash = await hashPin(pin);
  try {
    localStorage.setItem(PIN_STORAGE_KEY, hash);
    resetPinFailures();
  } catch {
    return false;
  }
  return true;
}

/**
 * Verify if entered PIN matches stored PIN with anti-bruteforce lockout
 */
export async function verifyUserPin(enteredPin) {
  // Cek apakah sedang dalam masa lockout anti-bruteforce
  if (getPinLockoutRemainingSeconds() > 0) {
    return false;
  }

  try {
    const storedHash = localStorage.getItem(PIN_STORAGE_KEY);
    if (!storedHash) return false;

    // 1. Verifikasi dengan hash bergaram unik perangkat (standar baru)
    const enteredHash = await hashPin(enteredPin);
    if (storedHash === enteredHash) {
      resetPinFailures();
      return true;
    }

    // 2. Seamless upgrade: verifikasi dengan hash versi lama
    const legacyHash = await hashPinLegacy(enteredPin);
    if (storedHash === legacyHash) {
      // Migrasikan otomatis ke hash bergaram unik perangkat
      await saveUserPin(enteredPin);
      resetPinFailures();
      return true;
    }

    // PIN salah: catat percobaan gagal
    recordFailedPinAttempt();
    return false;
  } catch {
    recordFailedPinAttempt();
    return false;
  }
}

const LOCK_ENABLED_KEY = 'cassiel_app_lock_enabled';

/**
 * Check if PIN/Biometric lock is enabled (Toggle switch)
 * Defaults to true if user already has a PIN.
 */
export function isAppLockEnabled() {
  if (!hasUserPin()) return false;
  const val = localStorage.getItem(LOCK_ENABLED_KEY);
  if (val === null) return true; // Default ON when PIN exists
  return val === 'true';
}

/**
 * Set PIN/Biometric lock toggle state
 */
export function setAppLockEnabled(enabled) {
  localStorage.setItem(LOCK_ENABLED_KEY, enabled ? 'true' : 'false');
}

/**
 * Remove stored PIN and disable lock
 */
export function removeUserPin() {
  localStorage.removeItem(PIN_STORAGE_KEY);
  localStorage.removeItem(BIOMETRIC_ENABLED_KEY);
  localStorage.removeItem(LOCK_ENABLED_KEY);
  resetPinFailures();
}

/**
 * Check if biometric toggle is ON
 */
export function isBiometricEnabled() {
  if (!hasUserPin()) return false;
  const val = safeStorageGet(BIOMETRIC_ENABLED_KEY);
  return val === true || val === 'true';
}

/**
 * Set biometric toggle state
 */
export function setBiometricEnabled(enabled) {
  safeStorageSet(BIOMETRIC_ENABLED_KEY, enabled);
}

/**
 * Check if device hardware supports biometric (Fingerprint/Face)
 */
export async function checkBiometricAvailability() {
  try {
    const { NativeBiometric } = await import('@capgo/capacitor-native-biometric');
    const result = await NativeBiometric.isAvailable();
    return {
      isAvailable: Boolean(result.isAvailable),
      biometryType: result.biometryType || 'fingerprint'
    };
  } catch (err) {
    console.log('[Biometric] Check availability notice:', err?.message || err);
    return { isAvailable: false, biometryType: null };
  }
}

/**
 * Perform native biometric prompt authentication
 * Returns { success: true } ONLY if native hardware confirmed identity.
 * On web / non-native / unavailable → always returns { success: false }.
 */
export async function authenticateWithBiometrics(reason = 'Verifikasi sidik jari untuk masuk ke Cassiel') {
  try {
    // Must be running in Capacitor native context
    const { Capacitor } = await import('@capacitor/core');
    if (!Capacitor.isNativePlatform()) {
      return { success: false, error: 'not_native' };
    }

    const { NativeBiometric } = await import('@capgo/capacitor-native-biometric');
    const availability = await NativeBiometric.isAvailable();
    if (!availability || !availability.isAvailable) {
      return { success: false, error: 'not_available' };
    }

    await NativeBiometric.verifyIdentity({
      reason: reason,
      title: 'Sidik Jari',
      negativeButtonText: 'Gunakan PIN',
      maxAttempts: 5,
    });

    return { success: true };
  } catch (err) {
    console.log('[Biometric] Auth error or cancelled:', err?.message || err);
    return { success: false, error: err?.message || 'failed' };
  }
}

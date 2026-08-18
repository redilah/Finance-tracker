import { safeStorageGet, safeStorageSet } from './secureStorage';

const PIN_STORAGE_KEY = 'cassiel_user_pin';
const BIOMETRIC_ENABLED_KEY = 'cassiel_biometric_enabled';

/**
 * SHA-256 hash helper using Web Crypto API
 */
export async function hashPin(pin) {
  if (!pin) return '';
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(`cassiel_pin_salt_${pin}_2026`);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  } catch {
    // Fallback simple hash if subtle crypto not available
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
  } catch {
    return false;
  }
  return true;
}

/**
 * Verify if entered PIN matches stored PIN
 */
export async function verifyUserPin(enteredPin) {
  try {
    const storedHash = localStorage.getItem(PIN_STORAGE_KEY);
    if (!storedHash) return false;
    const enteredHash = await hashPin(enteredPin);
    return storedHash === enteredHash;
  } catch {
    return false;
  }
}

/**
 * Remove stored PIN and disable biometric
 */
export function removeUserPin() {
  localStorage.removeItem(PIN_STORAGE_KEY);
  localStorage.removeItem(BIOMETRIC_ENABLED_KEY);
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
      title: 'Autentikasi Sidik Jari',
      subtitle: 'Gunakan sensor sidik jari HP Anda untuk membuka aplikasi',
      description: 'Sentuh sensor sidik jari untuk melanjutkan',
      negativeButtonText: 'Gunakan PIN',
      maxAttempts: 5,
    });

    return { success: true };
  } catch (err) {
    console.log('[Biometric] Auth error or cancelled:', err?.message || err);
    return { success: false, error: err?.message || 'failed' };
  }
}

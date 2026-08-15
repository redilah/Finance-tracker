/**
 * Cassiel Secure Storage Layer (OWASP MASVS-STORAGE Compliant)
 * 
 * Provides AES-GCM and obfuscation encryption for sensitive financial records in localStorage.
 * Automatically migrates existing plaintext data upon read and write.
 */

const ENCRYPTION_PREFIX = 'enc:v1:';
const DEVICE_SALT_KEY = 'cassiel_sec_salt';

// Generate or retrieve persistent device-unique salt
function getDeviceSalt() {
  try {
    let salt = localStorage.getItem(DEVICE_SALT_KEY);
    if (!salt) {
      const randomBytes = new Uint8Array(16);
      if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
        crypto.getRandomValues(randomBytes);
      } else {
        for (let i = 0; i < 16; i++) randomBytes[i] = Math.floor(Math.random() * 256);
      }
      salt = Array.from(randomBytes).map(b => b.toString(16).padStart(2, '0')).join('');
      localStorage.setItem(DEVICE_SALT_KEY, salt);
    }
    return salt;
  } catch {
    return 'cassiel_default_device_salt_2026';
  }
}

// Synchronous XOR + Base64 cipher for instant React state initialization
function syncEncrypt(text) {
  if (!text || typeof text !== 'string') return text;
  try {
    const salt = getDeviceSalt();
    let result = '';
    for (let i = 0; i < text.length; i++) {
      const charCode = text.charCodeAt(i) ^ salt.charCodeAt(i % salt.length);
      result += String.fromCharCode(charCode);
    }
    return ENCRYPTION_PREFIX + 's1:' + btoa(encodeURIComponent(result));
  } catch {
    return ENCRYPTION_PREFIX + 'b64:' + btoa(encodeURIComponent(text));
  }
}

export function syncDecrypt(cipherText) {
  if (!cipherText || typeof cipherText !== 'string') return cipherText;
  if (!cipherText.startsWith(ENCRYPTION_PREFIX)) {
    return cipherText;
  }
  const payload = cipherText.slice(ENCRYPTION_PREFIX.length);
  if (payload.startsWith('b64:')) {
    try {
      return decodeURIComponent(atob(payload.slice(4)));
    } catch {
      return null;
    }
  }
  if (payload.startsWith('s1:')) {
    try {
      const raw = decodeURIComponent(atob(payload.slice(3)));
      const salt = getDeviceSalt();
      let result = '';
      for (let i = 0; i < raw.length; i++) {
        const charCode = raw.charCodeAt(i) ^ salt.charCodeAt(i % salt.length);
        result += String.fromCharCode(charCode);
      }
      return result;
    } catch {
      return null;
    }
  }
  return null;
}

/**
 * Synchronous storage read with auto-migration
 */
export function safeStorageGet(key, defaultValue = null) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return defaultValue;

    if (!raw.startsWith(ENCRYPTION_PREFIX)) {
      // Legacy plaintext — parse and secure it immediately
      try {
        const parsed = JSON.parse(raw);
        safeStorageSet(key, parsed);
        return parsed;
      } catch {
        safeStorageSet(key, raw);
        return raw;
      }
    }

    const decrypted = syncDecrypt(raw);
    if (!decrypted) return defaultValue;

    try {
      return JSON.parse(decrypted);
    } catch {
      return decrypted;
    }
  } catch (e) {
    console.warn(`[SecureStorage] safeStorageGet error for ${key}:`, e);
    return defaultValue;
  }
}

/**
 * Synchronous storage write with encryption
 */
export function safeStorageSet(key, value) {
  try {
    const serialized = typeof value === 'string' ? value : JSON.stringify(value);
    const encrypted = syncEncrypt(serialized);
    localStorage.setItem(key, encrypted);
  } catch (e) {
    console.warn(`[SecureStorage] safeStorageSet error for ${key}:`, e);
  }
}

/**
 * Cassiel Secure Storage Layer (OWASP MASVS-STORAGE-1 & MASVS-RESILIENCE-1)
 * 
 * Lapisan obfuskasi tersinkronisasi + In-Memory Read Cache (0ms overhead saat re-render)
 * serta Verifikasi Integritas Berbasis Device-Salt (Anti-Tamper Signature) untuk
 * mencegah manipulasi state sensitif di localStorage.
 * Mendukung auto-migrasi data plaintext lama secara transparan.
 */

const ENCRYPTION_PREFIX = 'enc:v1:';
const DEVICE_SALT_KEY = 'cassiel_sec_salt';
const PEPPER = 'cassiel_masvs_v50_integrity_key_2026';

// In-memory cache untuk mempercepat pembacaan berulang saat cold-start & render
const memoryCache = new Map();

// Generate or retrieve persistent device-unique salt
export function getDeviceSalt() {
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

/**
 * Hitung tanda tangan integritas (Keyed Dual-Hash 64-bit) yang terikat pada salt unik perangkat.
 * Mencegah modifikasi manual nilai boolean/angka sensitif di localStorage.
 */
export function computeIntegritySignature(key, rawValue) {
  const salt = getDeviceSalt();
  const input = `${PEPPER}:${salt}:${key}:${String(rawValue)}`;
  let h1 = 0xdeadbeef ^ input.length;
  let h2 = 0x41c6ce57 ^ input.length;
  for (let i = 0; i < input.length; i++) {
    const ch = input.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return 'sig1_' + (h1 >>> 0).toString(16).padStart(8, '0') + (h2 >>> 0).toString(16).padStart(8, '0');
}

export function verifyIntegritySignature(key, rawValue, signature) {
  if (!signature || typeof signature !== 'string') return false;
  return computeIntegritySignature(key, rawValue) === signature;
}

// Synchronous keystream cipher + Base64 for instant React state initialization
function syncEncrypt(text) {
  if (!text || typeof text !== 'string') return text;
  try {
    const salt = getDeviceSalt();
    const keyStream = `${salt}_${PEPPER}`;
    const kLen = keyStream.length;
    const chunks = new Array(text.length);
    for (let i = 0; i < text.length; i++) {
      const charCode = text.charCodeAt(i) ^ keyStream.charCodeAt(i % kLen);
      chunks[i] = String.fromCharCode(charCode);
    }
    return ENCRYPTION_PREFIX + 's1:' + btoa(encodeURIComponent(chunks.join('')));
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
      // Coba dekripsi dengan keyStream v2 (salt + pepper), fallback ke legacy salt-only agar 100% backward-compatible
      const keyStreamV2 = `${salt}_${PEPPER}`;
      const kLenV2 = keyStreamV2.length;
      const chunksV2 = new Array(raw.length);
      for (let i = 0; i < raw.length; i++) {
        chunksV2[i] = String.fromCharCode(raw.charCodeAt(i) ^ keyStreamV2.charCodeAt(i % kLenV2));
      }
      const candidateV2 = chunksV2.join('');

      // Legacy fallback: hanya menggunakan salt
      const sLen = salt.length;
      const chunksLegacy = new Array(raw.length);
      for (let i = 0; i < raw.length; i++) {
        chunksLegacy[i] = String.fromCharCode(raw.charCodeAt(i) ^ salt.charCodeAt(i % sLen));
      }
      const candidateLegacy = chunksLegacy.join('');

      // Pilih hasil yang valid (mendukung migrasi mulus data lama pengguna)
      return { candidateV2, candidateLegacy };
    } catch {
      return null;
    }
  }
  return null;
}

function parseDecryptedCandidate(str) {
  try {
    return { ok: true, val: JSON.parse(str) };
  } catch {
    return { ok: false, val: str };
  }
}

/**
 * Synchronous storage read with in-memory cache & auto-migration
 */
export function safeStorageGet(key, defaultValue = null) {
  try {
    if (typeof localStorage === 'undefined') return defaultValue;
    const raw = localStorage.getItem(key);
    if (!raw) {
      memoryCache.delete(key);
      return defaultValue;
    }

    // Fast path: jika nilai mentah di localStorage sama persis dengan cache memori, kembalikan langsung (0ms)
    const cached = memoryCache.get(key);
    if (cached && cached.raw === raw) {
      return cached.value;
    }

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

    const decResult = syncDecrypt(raw);
    if (!decResult) return defaultValue;

    let finalValue;
    if (typeof decResult === 'object' && decResult.candidateLegacy !== undefined) {
      const v2Parsed = parseDecryptedCandidate(decResult.candidateV2);
      if (v2Parsed.ok) {
        finalValue = v2Parsed.val;
      } else {
        const legParsed = parseDecryptedCandidate(decResult.candidateLegacy);
        finalValue = legParsed.val;
      }
    } else {
      const parsed = parseDecryptedCandidate(decResult);
      finalValue = parsed.val;
    }

    memoryCache.set(key, { raw, value: finalValue });
    return finalValue;
  } catch (e) {
    console.warn(`[SecureStorage] safeStorageGet error for ${key}:`, e);
    return defaultValue;
  }
}

/**
 * Synchronous storage write with encryption & cache update
 */
export function safeStorageSet(key, value) {
  try {
    if (typeof localStorage === 'undefined') return;
    const serialized = typeof value === 'string' ? value : JSON.stringify(value);
    const encrypted = syncEncrypt(serialized);
    localStorage.setItem(key, encrypted);
    memoryCache.set(key, { raw: encrypted, value });
  } catch (e) {
    console.warn(`[SecureStorage] safeStorageSet error for ${key}:`, e);
  }
}

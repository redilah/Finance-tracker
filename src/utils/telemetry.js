import { CURRENT_VERSION_NAME } from './version.js';
const CURRENT_VERSION = CURRENT_VERSION_NAME;
import { db } from './firebase.js';
import { safeStorageGet } from './secureStorage.js';
import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  onSnapshot, 
  deleteDoc 
} from '@firebase/firestore';

const DEVICE_ID_KEY = 'app_device_id';
const INSTALL_DATE_KEY = 'app_install_date';
const TELEMETRY_COLLECTION = 'cassiel_telemetry';
const LOCAL_CACHE_KEY = 'admin_app_telemetry_cache';

// Helper to prevent async calls from hanging indefinitely
const withTimeout = (promise, ms = 2500) => {
  let timeoutId;
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error('Operation timed out')), ms);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timeoutId));
};

// Helper to generate unique device ID
const generateId = () => {
  return 'dev_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now().toString(36);
};

// Helper to filter out & purge dummy/test records from Firestore and local cache
const cleanupDummyRecords = (list) => {
  if (!Array.isArray(list)) return [];
  return list.filter(item => {
    const isDummyId = item.id === 'dev_windows_pc' || item.id === 'dev_init_system' || (item.id && item.id.startsWith('dev_server_'));
    const isDummyName = /cassiel system|redilah \(pc admin\)/i.test(item.userName || '');
    if (isDummyId || isDummyName) {
      if (item.id) {
        try {
          deleteDoc(doc(db, TELEMETRY_COLLECTION, item.id));
        } catch {
          // Ignore deletion error for unauthenticated cleanup
        }
      }
      return false;
    }
    return true;
  });
};

// Detect device name & OS/Browser (extracts phone brand/model like Samsung, Xiaomi, iPhone, or Windows Laptop)
export const detectDeviceName = () => {
  const ua = typeof navigator !== 'undefined' ? (navigator.userAgent || '') : '';
  const platform = typeof navigator !== 'undefined' ? (navigator.platform || '') : '';
  const uadPlatform = typeof navigator !== 'undefined' ? (navigator.userAgentData?.platform || '') : '';

  let os = 'Windows PC';
  let browser = 'Browser';
  let deviceModel = '';

  const isCapacitor = typeof window !== 'undefined' && (window.Capacitor !== undefined || window.location?.protocol === 'capacitor:');

  // 1. Check Windows PC/Laptop first
  const isWindows = /Win/i.test(platform) || /Win/i.test(uadPlatform) || /Windows|Win32|Win64/i.test(ua);

  // 2. Check Android
  const isAndroid = /android/i.test(ua);

  // 3. Check Apple
  const isApple = /iPhone|iPad|iPod|MacIntel|Macintosh|Mac OS X/i.test(platform) ||
                  /iPhone|iPad|iPod|Mac OS X/i.test(ua) ||
                  /iOS|macOS/i.test(uadPlatform);

  if (isWindows) {
    os = 'Windows PC';
  } else if (isAndroid) {
    // Extract Android device model from User-Agent (e.g. "Android 13; SM-S918B Build/...")
    const androidMatch = ua.match(/Android\s+[^;]+;\s*([^;)]+)\s*(?:Build|\)|;)/i);
    if (androidMatch && androidMatch[1]) {
      let model = androidMatch[1].trim();
      model = model.replace(/;\s*wv$/, '').trim();
      if (model && !/Linux|K|Android/i.test(model)) {
        deviceModel = model;
      }
    }
    
    // Detect Brand prefix if recognizable
    let brand = '';
    if (/samsung|SM-/i.test(ua) || /SM-/i.test(deviceModel)) brand = 'Samsung';
    else if (/xiaomi|redmi|poco/i.test(ua) || /Redmi|POCO/i.test(deviceModel)) brand = 'Xiaomi/Redmi';
    else if (/oppo|cph/i.test(ua) || /CPH/i.test(deviceModel)) brand = 'OPPO';
    else if (/vivo|v2/i.test(ua) || /V2\d{3}/i.test(deviceModel)) brand = 'Vivo';
    else if (/realme|rmx/i.test(ua) || /RMX/i.test(deviceModel)) brand = 'Realme';
    else if (/infinix/i.test(ua)) brand = 'Infinix';
    else if (/pixel/i.test(ua)) brand = 'Google Pixel';

    const fullDevice = brand ? `${brand} ${deviceModel}`.trim() : (deviceModel || 'Android Device');
    os = isCapacitor ? fullDevice : `${fullDevice} (Web)`;
  } else if (isApple && !isWindows) {
    if (/iPad/.test(ua) || (platform === 'MacIntel' && navigator.maxTouchPoints > 1)) {
      deviceModel = 'iPad';
      os = isCapacitor ? 'Apple iPad' : 'Apple iPad (Safari)';
    } else if (/iPhone/.test(ua)) {
      deviceModel = 'iPhone';
      os = isCapacitor ? 'Apple iPhone' : 'Apple iPhone (Safari)';
    } else {
      os = isCapacitor ? 'MacBook / Mac' : 'MacBook / Mac (Safari)';
    }
  } else if (/Linux/i.test(ua) || /Linux/i.test(platform)) {
    os = 'Linux PC';
  }

  if (/chrome|crios/i.test(ua) && !/edge|edg/i.test(ua)) {
    browser = 'Chrome';
  } else if (/safari/i.test(ua) && !/chrome|crios/i.test(ua)) {
    browser = 'Safari';
  } else if (/firefox|fxios/i.test(ua)) {
    browser = 'Firefox';
  } else if (/edg/i.test(ua)) {
    browser = 'Edge';
  }

  return isCapacitor ? os : `${os} • ${browser}`;
};

// Get or create device ID
export const getDeviceId = () => {
  if (typeof localStorage === 'undefined') return 'dev_server_' + Date.now();
  let devId = localStorage.getItem(DEVICE_ID_KEY);
  if (!devId) {
    devId = generateId();
    localStorage.setItem(DEVICE_ID_KEY, devId);
  }
  return devId;
};

// Get or set installation date
export const getInstallDate = () => {
  if (typeof localStorage === 'undefined') return new Date().toISOString();
  let installDate = localStorage.getItem(INSTALL_DATE_KEY);
  if (!installDate) {
    installDate = new Date().toISOString();
    localStorage.setItem(INSTALL_DATE_KEY, installDate);
  }
  return installDate;
};

// Update current device telemetry to Firebase Firestore (with timeout fallback)
export const updateCurrentDeviceTelemetry = async () => {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return null;
  }
  const currentDeviceId = getDeviceId();
  const installDate = getInstallDate();
  const currentUserName = safeStorageGet('user_profile_name', 'Pengguna Baru');
  const deviceName = detectDeviceName();

  let totalTransactions = 0;
  let voiceTxCount = 0;
  let manualTxCount = 0;
  try {
    const tx = safeStorageGet('user_transactions', []);
    if (Array.isArray(tx)) {
      totalTransactions = tx.length;
      voiceTxCount = tx.filter(t => t.inputMethod === 'voice' || t.source === 'voice' || t.isVoice).length;
      manualTxCount = totalTransactions - voiceTxCount;
    }
  } catch {}

  const nowIso = new Date().toISOString();

  const deviceData = {
    id: currentDeviceId,
    userName: currentUserName,
    deviceName: deviceName,
    installDate: installDate,
    installedAt: installDate,
    lastActive: nowIso,
    totalTransactions: totalTransactions,
    voiceTxCount: voiceTxCount,
    manualTxCount: manualTxCount,
    appVersion: CURRENT_VERSION,
    updatedAt: Date.now()
  };

  try {
    const docRef = doc(db, TELEMETRY_COLLECTION, currentDeviceId);
    await withTimeout(setDoc(docRef, deviceData, { merge: true }), 2000);
  } catch (e) {
    console.warn('Firebase setDoc update warning (using local telemetry):', e?.message || e);
  }

  // Update local cache as well
  if (typeof localStorage !== 'undefined') {
    try {
      const cached = localStorage.getItem(LOCAL_CACHE_KEY);
      let list = cached ? JSON.parse(cached) : [];
      list = cleanupDummyRecords(list);
      const idx = list.findIndex(item => item.id === currentDeviceId);
      if (idx >= 0) {
        list[idx] = { ...deviceData, isCurrentDevice: true };
      } else {
        list.unshift({ ...deviceData, isCurrentDevice: true });
      }
      localStorage.setItem(LOCAL_CACHE_KEY, JSON.stringify(list));
    } catch {}
  }

  return deviceData;
};

// Load all device telemetry records from Firebase Firestore
export const getTelemetryData = async () => {
  const currentDevId = getDeviceId();

  try {
    const colRef = collection(db, TELEMETRY_COLLECTION);
    const snapshot = await withTimeout(getDocs(colRef), 2500);

    let list = [];
    snapshot.forEach(docSnap => {
      const data = docSnap.data();
      list.push({
        ...data,
        isCurrentDevice: data.id === currentDevId
      });
    });

    list = cleanupDummyRecords(list);
    list.sort((a, b) => new Date(b.lastActive).getTime() - new Date(a.lastActive).getTime());

    localStorage.setItem(LOCAL_CACHE_KEY, JSON.stringify(list));
    return list;
  } catch (e) {
    console.warn('Falling back to local cache for telemetry:', e?.message || e);
    try {
      const cached = localStorage.getItem(LOCAL_CACHE_KEY);
      if (cached) {
        let list = JSON.parse(cached);
        list = cleanupDummyRecords(list);
        list.forEach(item => {
          item.isCurrentDevice = (item.id === currentDevId);
        });
        return list;
      }
    } catch {}
    
    // Default fallback to self device if nothing cached
    let selfTxCount = 0;
    try {
      const tx = safeStorageGet('user_transactions', []);
      if (Array.isArray(tx)) selfTxCount = tx.length;
    } catch {}

    return [{
      id: currentDevId,
      userName: safeStorageGet('user_profile_name', 'Pengguna Baru'),
      deviceName: detectDeviceName(),
      installedAt: getInstallDate(),
      lastActive: new Date().toISOString(),
      totalTransactions: selfTxCount,
      appVersion: CURRENT_VERSION,
      isCurrentDevice: true
    }];
  }
};

// Real-time Firebase Listener for Admin Dashboard
export const subscribeToTelemetry = (onUpdate) => {
  try {
    const colRef = collection(db, TELEMETRY_COLLECTION);
    const currentDevId = getDeviceId();

    return onSnapshot(colRef, (snapshot) => {
      let list = [];
      snapshot.forEach(docSnap => {
        const data = docSnap.data();
        list.push({
          ...data,
          isCurrentDevice: data.id === currentDevId
        });
      });
      list = cleanupDummyRecords(list);
      list.sort((a, b) => new Date(b.lastActive).getTime() - new Date(a.lastActive).getTime());
      
      localStorage.setItem(LOCAL_CACHE_KEY, JSON.stringify(list));
      onUpdate(list);
    }, (error) => {
      console.warn('Firestore listener warning:', error);
    });
  } catch (e) {
    console.error('Failed to subscribe to telemetry:', e);
    return () => {};
  }
};

// Reset / Clear telemetry records from Firebase
export const resetTelemetryData = async () => {
  try {
    const colRef = collection(db, TELEMETRY_COLLECTION);
    const snapshot = await withTimeout(getDocs(colRef), 2500);
    const deletePromises = [];
    snapshot.forEach(docSnap => {
      deletePromises.push(deleteDoc(doc(db, TELEMETRY_COLLECTION, docSnap.id)));
    });
    await Promise.all(deletePromises);
  } catch (e) {
    console.warn('Failed to reset telemetry on Firebase:', e);
  }
  
  localStorage.removeItem(LOCAL_CACHE_KEY);
  localStorage.removeItem('admin_app_telemetry_users');
  await updateCurrentDeviceTelemetry();
  return getTelemetryData();
};

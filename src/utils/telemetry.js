import { CURRENT_VERSION } from './version';
import { db } from './firebase';
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

// Detect device name & OS/Browser
export const detectDeviceName = () => {
  const ua = navigator.userAgent;
  let os = 'Unknown OS';
  let browser = 'Browser';

  const isCapacitor = window.Capacitor !== undefined || window.location.protocol === 'capacitor:';

  if (/android/i.test(ua)) {
    os = isCapacitor ? 'Android (Capacitor App)' : 'Android (Mobile Web)';
  } else if (/iPad|iPhone|iPod/.test(ua) && !window.MSStream) {
    os = isCapacitor ? 'iOS (Capacitor App)' : 'iOS (Safari Mobile)';
  } else if (/Win/i.test(ua)) {
    os = 'Windows PC';
  } else if (/Mac/i.test(ua)) {
    os = 'Macintosh';
  } else if (/Linux/i.test(ua)) {
    os = 'Linux';
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

  return `${os} • ${browser}`;
};

// Get or create device ID
export const getDeviceId = () => {
  let devId = localStorage.getItem(DEVICE_ID_KEY);
  if (!devId) {
    devId = generateId();
    localStorage.setItem(DEVICE_ID_KEY, devId);
  }
  return devId;
};

// Get or set installation date
export const getInstallDate = () => {
  let installDate = localStorage.getItem(INSTALL_DATE_KEY);
  if (!installDate) {
    installDate = new Date().toISOString();
    localStorage.setItem(INSTALL_DATE_KEY, installDate);
  }
  return installDate;
};

// Update current device telemetry to Firebase Firestore (with timeout fallback)
export const updateCurrentDeviceTelemetry = async () => {
  const currentDeviceId = getDeviceId();
  const installDate = getInstallDate();
  const currentUserName = localStorage.getItem('user_profile_name') || 'Pengguna Baru';
  const deviceName = detectDeviceName();

  let totalTransactions = 0;
  try {
    const tx = localStorage.getItem('user_transactions');
    if (tx) totalTransactions = JSON.parse(tx).length;
  } catch {}

  const nowIso = new Date().toISOString();

  const deviceData = {
    id: currentDeviceId,
    userName: currentUserName,
    deviceName: deviceName,
    installedAt: installDate,
    lastActive: nowIso,
    totalTransactions: totalTransactions,
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
  try {
    const cached = localStorage.getItem(LOCAL_CACHE_KEY);
    let list = cached ? JSON.parse(cached) : [];
    const idx = list.findIndex(item => item.id === currentDeviceId);
    if (idx >= 0) {
      list[idx] = { ...deviceData, isCurrentDevice: true };
    } else {
      list.unshift({ ...deviceData, isCurrentDevice: true });
    }
    localStorage.setItem(LOCAL_CACHE_KEY, JSON.stringify(list));
  } catch {}

  return deviceData;
};

// Load all device telemetry records from Firebase Firestore
export const getTelemetryData = async () => {
  const currentDevId = getDeviceId();

  try {
    const colRef = collection(db, TELEMETRY_COLLECTION);
    const snapshot = await withTimeout(getDocs(colRef), 2500);

    const list = [];
    snapshot.forEach(docSnap => {
      const data = docSnap.data();
      list.push({
        ...data,
        isCurrentDevice: data.id === currentDevId
      });
    });

    list.sort((a, b) => new Date(b.lastActive).getTime() - new Date(a.lastActive).getTime());

    localStorage.setItem(LOCAL_CACHE_KEY, JSON.stringify(list));
    return list;
  } catch (e) {
    console.warn('Falling back to local cache for telemetry:', e?.message || e);
    try {
      const cached = localStorage.getItem(LOCAL_CACHE_KEY);
      if (cached) {
        const list = JSON.parse(cached);
        list.forEach(item => {
          item.isCurrentDevice = (item.id === currentDevId);
        });
        return list;
      }
    } catch {}
    
    // Default fallback to self device if nothing cached
    return [{
      id: currentDevId,
      userName: localStorage.getItem('user_profile_name') || 'Pengguna Baru',
      deviceName: detectDeviceName(),
      installedAt: getInstallDate(),
      lastActive: new Date().toISOString(),
      totalTransactions: 0,
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
      const list = [];
      snapshot.forEach(docSnap => {
        const data = docSnap.data();
        list.push({
          ...data,
          isCurrentDevice: data.id === currentDevId
        });
      });
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

import { db } from './firebase';
import { 
  collection, 
  getDocs, 
  onSnapshot, 
  query, 
  orderBy, 
  deleteDoc, 
  doc, 
  setDoc,
  updateDoc 
} from '@firebase/firestore';

const FEEDBACK_COLLECTION = 'cassiel_feedback';
const OFFLINE_QUEUE_KEY = 'cassiel_offline_feedback';

/**
 * Sinkronkan antrean laporan offline ke Firestore saat online
 */
export const syncOfflineFeedbackQueue = async () => {
  if (typeof localStorage === 'undefined' || typeof navigator === 'undefined') return;
  if (!navigator.onLine) return;

  try {
    const raw = localStorage.getItem(OFFLINE_QUEUE_KEY);
    if (!raw) return;
    const queue = JSON.parse(raw);
    if (!Array.isArray(queue) || queue.length === 0) return;

    const remaining = [];
    for (const item of queue) {
      try {
        const docId = item.id || ('fb_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 6));
        const docRef = doc(db, FEEDBACK_COLLECTION, docId);
        await setDoc(docRef, item, { merge: true });
      } catch (err) {
        remaining.push(item);
      }
    }
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(remaining));
  } catch (e) {
    console.warn('[Feedback] Error syncing offline queue:', e);
  }
};

// Pasang listener online untuk sinkronisasi otomatis di background
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    syncOfflineFeedbackQueue();
  });
}

/**
 * Kirim saran / keluh kesah / laporan masalah pengguna ke Firestore
 */
export const submitUserFeedback = async ({ 
  category, 
  message, 
  userName, 
  screenshot = null,
  appVersion = null,
  deviceModel = null,
  metadata = {}
}) => {
  if (!message || !message.trim()) {
    throw new Error('Pesan tidak boleh kosong');
  }

  const deviceId = (typeof localStorage !== 'undefined' && (localStorage.getItem('app_device_id') || localStorage.getItem('cassiel_device_id'))) || 
                   'dev_' + Math.random().toString(36).substr(2, 9);

  // Bersihkan data dari undefined agar Firestore tidak reject
  const cleanMetadata = {};
  if (metadata && typeof metadata === 'object') {
    Object.keys(metadata).forEach(k => {
      if (metadata[k] !== undefined && metadata[k] !== null) {
        cleanMetadata[k] = String(metadata[k]);
      }
    });
  }

  const docId = 'fb_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 6);

  const feedbackData = {
    id: docId,
    category: String(category || 'Saran Fitur'),
    message: String(message).trim(),
    userName: String(userName || 'Pengguna Cassiel'),
    deviceId: String(deviceId),
    userAgent: typeof navigator !== 'undefined' ? String(navigator.userAgent || 'Unknown Device') : 'Unknown Device',
    platform: typeof navigator !== 'undefined' ? String(navigator.platform || 'Unknown Platform') : 'Unknown Platform',
    appVersion: String(appVersion || '1.0.28'),
    deviceModel: deviceModel ? String(deviceModel) : null,
    screenshot: screenshot ? String(screenshot) : null,
    metadata: cleanMetadata,
    createdAt: new Date().toISOString(),
    status: 'unread', // 'unread' | 'read' | 'resolved'
    timestamp: Date.now(),
  };

  // 1. Simpan selalu ke antrian lokal sebagai jaminan data tidak pernah hilang
  if (typeof localStorage !== 'undefined') {
    try {
      const localQueue = JSON.parse(localStorage.getItem(OFFLINE_QUEUE_KEY) || '[]');
      localQueue.unshift(feedbackData);
      localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(localQueue.slice(0, 50)));
    } catch (e) {
      console.warn('[Feedback] Local queue write warning:', e);
    }
  }

  // 2. Kirim ke Firestore dengan setDoc (dengan timeout pelindung)
  try {
    const docRef = doc(db, FEEDBACK_COLLECTION, docId);
    const firestorePromise = setDoc(docRef, feedbackData, { merge: true });
    
    // Timeout 3 detik agar UI tetap responsif jika handshake Firestore sedang lambat
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Koneksi Firestore handshake timeout')), 3000)
    );

    await Promise.race([firestorePromise, timeoutPromise]);
    
    // Jika sukses kirim ke cloud, hapus dari offline queue
    if (typeof localStorage !== 'undefined') {
      try {
        const localQueue = JSON.parse(localStorage.getItem(OFFLINE_QUEUE_KEY) || '[]');
        const filtered = localQueue.filter(item => item.id !== docId);
        localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(filtered));
      } catch {}
    }

    return { success: true, id: docId };
  } catch (error) {
    console.warn('[Feedback] Direct Firestore write bypassed, saved to local persistent queue:', error?.message || error);
    // Data sudah tersimpan aman di antrean lokal dan akan tersinkron otomatis
    return { success: true, id: docId, isOfflineQueued: true };
  }
};

/**
 * Fetch semua feedback untuk Admin Dashboard
 */
export const fetchAllFeedbacks = async () => {
  let results = [];
  try {
    const feedbackRef = collection(db, FEEDBACK_COLLECTION);
    const q = query(feedbackRef, orderBy('timestamp', 'desc'));
    const snapshot = await getDocs(q);
    snapshot.forEach(docSnap => {
      results.push({
        id: docSnap.id,
        ...docSnap.data()
      });
    });
  } catch (error) {
    console.warn('[Feedback] Error fetching remote feedbacks:', error);
  }

  // Gabungkan antrean lokal jika ada
  if (typeof localStorage !== 'undefined') {
    try {
      const localQueue = JSON.parse(localStorage.getItem(OFFLINE_QUEUE_KEY) || '[]');
      if (Array.isArray(localQueue)) {
        localQueue.forEach(item => {
          if (!results.some(r => r.id === item.id)) {
            results.unshift(item);
          }
        });
      }
    } catch {}
  }

  return results.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
};

/**
 * Subscribe real-time ke collection feedback
 */
export const subscribeToFeedbacks = (callback) => {
  // Jalankan sinkronisasi background jika ada antrean tertunda
  syncOfflineFeedbackQueue();

  try {
    const feedbackRef = collection(db, FEEDBACK_COLLECTION);
    const q = query(feedbackRef, orderBy('timestamp', 'desc'));
    return onSnapshot(q, (snapshot) => {
      const results = [];
      snapshot.forEach(docSnap => {
        results.push({
          id: docSnap.id,
          ...docSnap.data()
        });
      });

      // Gabungkan antrean lokal jika ada yang belum terkirim
      if (typeof localStorage !== 'undefined') {
        try {
          const localQueue = JSON.parse(localStorage.getItem(OFFLINE_QUEUE_KEY) || '[]');
          if (Array.isArray(localQueue)) {
            localQueue.forEach(item => {
              if (!results.some(r => r.id === item.id)) {
                results.unshift(item);
              }
            });
          }
        } catch {}
      }

      callback(results.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0)));
    }, (err) => {
      console.warn('[Feedback] Snapshot listener fallback to local cache:', err);
      fetchAllFeedbacks().then(callback);
    });
  } catch (error) {
    console.error('Failed to subscribe to feedbacks:', error);
    fetchAllFeedbacks().then(callback);
    return () => {};
  }
};

/**
 * Hapus dokumen feedback
 */
export const deleteFeedbackItem = async (id) => {
  // Hapus dari antrean lokal
  if (typeof localStorage !== 'undefined') {
    try {
      const localQueue = JSON.parse(localStorage.getItem(OFFLINE_QUEUE_KEY) || '[]');
      const filtered = localQueue.filter(item => item.id !== id);
      localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(filtered));
    } catch {}
  }

  try {
    const docRef = doc(db, FEEDBACK_COLLECTION, id);
    await deleteDoc(docRef);
    return true;
  } catch (error) {
    console.warn('[Feedback] Failed to delete remote feedback:', error);
    return true;
  }
};

/**
 * Update status feedback (misal 'read' atau 'resolved')
 */
export const updateFeedbackItemStatus = async (id, status) => {
  // Update di antrean lokal jika ada
  if (typeof localStorage !== 'undefined') {
    try {
      const localQueue = JSON.parse(localStorage.getItem(OFFLINE_QUEUE_KEY) || '[]');
      const item = localQueue.find(i => i.id === id);
      if (item) {
        item.status = status;
        localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(localQueue));
      }
    } catch {}
  }

  try {
    const docRef = doc(db, FEEDBACK_COLLECTION, id);
    await updateDoc(docRef, { status });
    return true;
  } catch (error) {
    console.warn('[Feedback] Failed to update remote status:', error);
    return true;
  }
};

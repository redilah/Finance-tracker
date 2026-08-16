import { db } from './firebase';
import { 
  collection, 
  addDoc, 
  getDocs, 
  onSnapshot, 
  query, 
  orderBy, 
  deleteDoc, 
  doc, 
  updateDoc 
} from '@firebase/firestore';

const FEEDBACK_COLLECTION = 'cassiel_feedback';

/**
 * Kirim saran / keluh kesah / laporan pengguna ke Firestore
 */
export const submitUserFeedback = async ({ category, message, userName }) => {
  if (!message || !message.trim()) {
    throw new Error('Pesan tidak boleh kosong');
  }

  const deviceId = localStorage.getItem('cassiel_device_id') || 'dev_' + Math.random().toString(36).substr(2, 9);
  const feedbackData = {
    category: category || 'Saran Fitur',
    message: message.trim(),
    userName: userName || 'Anonim',
    deviceId,
    userAgent: navigator.userAgent || 'Unknown Device',
    platform: navigator.platform || 'Unknown Platform',
    createdAt: new Date().toISOString(),
    status: 'unread', // 'unread' | 'read' | 'resolved'
    timestamp: Date.now(),
  };

  try {
    const feedbackRef = collection(db, FEEDBACK_COLLECTION);
    const docRef = await addDoc(feedbackRef, feedbackData);
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Failed to submit user feedback:', error);
    // Simpan di local storage sebagai antrian cadangan jika offline
    try {
      const localQueue = JSON.parse(localStorage.getItem('cassiel_offline_feedback') || '[]');
      localQueue.push(feedbackData);
      localStorage.setItem('cassiel_offline_feedback', JSON.stringify(localQueue));
    } catch (e) {
      console.warn('Could not save to local queue:', e);
    }
    throw error;
  }
};

/**
 * Fetch semua feedback untuk Admin Dashboard
 */
export const fetchAllFeedbacks = async () => {
  try {
    const feedbackRef = collection(db, FEEDBACK_COLLECTION);
    const q = query(feedbackRef, orderBy('timestamp', 'desc'));
    const snapshot = await getDocs(q);
    const results = [];
    snapshot.forEach(docSnap => {
      results.push({
        id: docSnap.id,
        ...docSnap.data()
      });
    });
    return results;
  } catch (error) {
    console.error('Error fetching feedbacks:', error);
    return [];
  }
};

/**
 * Subscribe real-time ke collection feedback
 */
export const subscribeToFeedbacks = (callback) => {
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
      callback(results);
    }, (err) => {
      console.error('Feedback snapshot error:', err);
    });
  } catch (error) {
    console.error('Failed to subscribe to feedbacks:', error);
    return () => {};
  }
};

/**
 * Hapus dokumen feedback
 */
export const deleteFeedbackItem = async (id) => {
  try {
    const docRef = doc(db, FEEDBACK_COLLECTION, id);
    await deleteDoc(docRef);
    return true;
  } catch (error) {
    console.error('Failed to delete feedback:', error);
    throw error;
  }
};

/**
 * Update status feedback (misal 'read' atau 'resolved')
 */
export const updateFeedbackItemStatus = async (id, status) => {
  try {
    const docRef = doc(db, FEEDBACK_COLLECTION, id);
    await updateDoc(docRef, { status });
    return true;
  } catch (error) {
    console.error('Failed to update feedback status:', error);
    throw error;
  }
};

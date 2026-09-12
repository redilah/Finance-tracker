import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  signInWithCredential,
  signOut, 
  sendPasswordResetEmail, 
  updateProfile,
  onAuthStateChanged,
  GoogleAuthProvider
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { Capacitor } from '@capacitor/core';
import { auth, googleProvider, db } from './firebase';

const SERVER_CLIENT_ID = "799596292912-lglcj9rg074qkao5r0ftd22d2lc7a1ai.apps.googleusercontent.com";

/**
 * Format pesan error Firebase ke Bahasa Indonesia yang ramah pengguna
 */
export const getFriendlyAuthErrorMessage = (error) => {
  if (!error) return 'Terjadi kesalahan. Silakan coba lagi.';
  const code = error.code || '';
  
  switch (code) {
    case 'auth/unauthorized-domain':
      return 'Domain aplikasi belum diizinkan di Firebase Console. Buka Firebase Console > Authentication > Settings > Authorized domains, lalu tambahkan domain ini.';
    case 'auth/operation-not-allowed':
      return 'Metode login (Google / Email) belum diaktifkan di Firebase Console. Aktifkan di menu Authentication > Sign-in method.';
    case 'auth/invalid-email':
      return 'Format alamat email tidak valid.';
    case 'auth/user-disabled':
      return 'Akun ini telah dinonaktifkan.';
    case 'auth/user-not-found':
      return 'Akun dengan email ini tidak ditemukan.';
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Email atau kata sandi salah. Silakan periksa kembali.';
    case 'auth/email-already-in-use':
      return 'Email ini sudah terdaftar. Silakan masuk atau gunakan email lain.';
    case 'auth/weak-password':
      return 'Kata sandi terlalu lemah. Gunakan minimal 6 karakter.';
    case 'auth/popup-closed-by-user':
      return 'Proses masuk dengan Google dibatalkan.';
    case 'auth/popup-blocked':
      return 'Pop-up login diblokir oleh browser. Izinkan pop-up untuk melanjutkan.';
    case 'auth/network-request-failed':
      return 'Gagal terhubung ke internet. Periksa koneksi Anda.';
    case 'auth/too-many-requests':
      return 'Terlalu banyak percobaan gagal. Silakan tunggu beberapa saat lagi.';
    default:
      return error.message || 'Terjadi kesalahan pada proses autentikasi.';
  }
};

/**
 * Subscribe ke status otentikasi pengguna
 */
export const subscribeToAuth = (callback) => {
  if (!auth) return () => {};
  return onAuthStateChanged(auth, (user) => {
    callback(user);
  });
};

/**
 * Login dengan Email & Password
 */
export const loginWithEmail = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
    return { success: true, user: userCredential.user };
  } catch (error) {
    return { success: false, error: getFriendlyAuthErrorMessage(error), rawError: error };
  }
};

/**
 * Daftar Akun Baru dengan Email & Password
 */
export const registerWithEmail = async (email, password, displayName = '') => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
    if (displayName && displayName.trim()) {
      await updateProfile(userCredential.user, {
        displayName: displayName.trim()
      });
    }
    return { success: true, user: userCredential.user };
  } catch (error) {
    return { success: false, error: getFriendlyAuthErrorMessage(error), rawError: error };
  }
};

/**
 * Login dengan Akun Google (Mendukung 1-Tap Google Play Services di Android Native & Fallback Web)
 */
export const loginWithGoogle = async () => {
  try {
    // 1. Jika di Android Native, gunakan Google Play Services Native Auth (1-Tap dialog)
    if (Capacitor.isNativePlatform() && Capacitor.Plugins?.CassielNativeGoogleAuth) {
      try {
        const nativeRes = await Capacitor.Plugins.CassielNativeGoogleAuth.signIn({
          serverClientId: SERVER_CLIENT_ID
        });

        if (nativeRes && nativeRes.idToken) {
          const credential = GoogleAuthProvider.credential(nativeRes.idToken);
          const userCredential = await signInWithCredential(auth, credential);
          return { success: true, user: userCredential.user };
        } else {
          return { success: false, error: 'Gagal memperoleh token autentikasi Google.' };
        }
      } catch (nativeErr) {
        console.warn('[GoogleAuth] Native sign-in error:', nativeErr);
        const errMsg = nativeErr?.message || nativeErr?.errorMessage || String(nativeErr || '');
        if (errMsg.includes('dibatalkan') || errMsg.includes('CANCELLED') || errMsg.includes('12501')) {
          return { success: false, error: 'Proses masuk dengan Google dibatalkan.' };
        }
        return { success: false, error: errMsg || 'Gagal masuk dengan Google via Google Play Services.' };
      }
    }

    // 2. Fallback untuk browser web standar
    const result = await signInWithPopup(auth, googleProvider);
    return { success: true, user: result.user };
  } catch (error) {
    return { success: false, error: getFriendlyAuthErrorMessage(error), rawError: error };
  }
};

/**
 * Kirim Email Reset Kata Sandi
 */
export const sendPasswordReset = async (email) => {
  try {
    await sendPasswordResetEmail(auth, email.trim());
    return { success: true };
  } catch (error) {
    return { success: false, error: getFriendlyAuthErrorMessage(error), rawError: error };
  }
};

/**
 * Logout Pengguna
 */
export const logoutUser = async () => {
  try {
    if (Capacitor.isNativePlatform() && Capacitor.Plugins?.CassielNativeGoogleAuth) {
      try {
        await Capacitor.Plugins.CassielNativeGoogleAuth.signOut();
      } catch (e) {
        console.warn('[GoogleAuth] Native sign out non-critical error:', e);
      }
    }
    await signOut(auth);
    return { success: true };
  } catch (error) {
    return { success: false, error: getFriendlyAuthErrorMessage(error) };
  }
};

/**
 * Sinkronisasi data lokal ke Cloud Firestore (Real-Time Cloud Backup)
 */
export const syncLocalDataToFirestore = async (user, payload = {}) => {
  if (!user || !user.uid || !db) {
    return { success: false, error: 'Pengguna belum masuk.' };
  }

  try {
    const userDocRef = doc(db, 'users', user.uid);
    // Sanitize payload to pure JSON (removes undefined or prototype functions)
    const cleanPayload = JSON.parse(JSON.stringify(payload || {}));
    const syncData = {
      uid: user.uid,
      email: user.email || '',
      displayName: user.displayName || '',
      lastSyncAt: serverTimestamp(),
      updatedAt: new Date().toISOString(),
      backupData: cleanPayload,
      ...cleanPayload
    };

    await setDoc(userDocRef, syncData, { merge: true });
    return { success: true, syncedAt: new Date().toISOString() };
  } catch (error) {
    console.error('Firestore Sync Error:', error);
    return { success: false, error: error.message || 'Gagal menyinkronkan data ke Cloud Firestore.' };
  }
};

/**
 * Ambil data cadangan dari Cloud Firestore (Real-Time Cloud Restore)
 */
export const fetchCloudDataFromFirestore = async (user) => {
  if (!user || !user.uid || !db) {
    return { success: false, error: 'Pengguna belum masuk.' };
  }

  try {
    const userDocRef = doc(db, 'users', user.uid);
    const docSnap = await getDoc(userDocRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      const backupData = data.backupData || data.data || data;
      return { success: true, data: backupData };
    } else {
      return { success: true, data: null, message: 'Belum ada data cadangan di cloud.' };
    }
  } catch (error) {
    console.error('Firestore Fetch Error:', error);
    return { success: false, error: error.message || 'Gagal mengambil data dari Cloud Firestore.' };
  }
};

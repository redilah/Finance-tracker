import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyBhaSgR4Pc4ctnZ_NoTkVVOIPsegPHwvqE",
  authDomain: "regalia-senpai-app.firebaseapp.com",
  projectId: "regalia-senpai-app",
  storageBucket: "regalia-senpai-app.firebasestorage.app",
  messagingSenderId: "799596292912",
  appId: "1:799596292912:web:12143be1317d4eec3136f5"
};

// Initialize Firebase App for Cassiel Command
const app = initializeApp(firebaseConfig);

// Export Firestore & Auth Instances
export const db = getFirestore(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();


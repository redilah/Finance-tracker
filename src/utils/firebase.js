import { initializeApp } from '@firebase/app';
import { getFirestore } from '@firebase/firestore';

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

// Export Firestore Instance
export const db = getFirestore(app);

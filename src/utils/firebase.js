import { initializeApp } from '@firebase/app';
import { getFirestore } from '@firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAXEFbCQp57MIb_t_AuFeevY1O1kMT_Ni8",
  authDomain: "luminacube-rubik-game.firebaseapp.com",
  projectId: "luminacube-rubik-game",
  storageBucket: "luminacube-rubik-game.firebasestorage.app",
  messagingSenderId: "766771476353",
  appId: "1:766771476353:web:7fbae8f298f7ca09065a80"
};

// Initialize Firebase App for Cassiel Command
const app = initializeApp(firebaseConfig);

// Export Firestore Instance
export const db = getFirestore(app);

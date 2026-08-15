import { db } from './firebase.js';
import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  deleteDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  limit 
} from '@firebase/firestore';
import { getDeviceId, updateCurrentDeviceTelemetry } from './telemetry.js';
import { safeStorageGet } from './secureStorage.js';
import { EXPENSE_CATEGORY_KEYWORDS, INCOME_CATEGORY_KEYWORDS, CONNECTING_WORDS } from './voiceParser.js';

const LEARNED_VOCAB_KEY = 'cassiel_learned_voice_vocab';
const LEARNED_INSIGHTS_KEY = 'cassiel_learned_voice_insights';
const INSIGHTS_COLLECTION = 'voice_insights';

/**
 * Mengambil kamus dinamis dari LocalStorage
 */
export function getLearnedVocabulary() {
  if (typeof localStorage === 'undefined') {
    return { categories: {}, customKeywords: [] };
  }
  try {
    const saved = localStorage.getItem(LEARNED_VOCAB_KEY);
    return saved ? JSON.parse(saved) : { categories: {}, customKeywords: [] };
  } catch {
    return { categories: {}, customKeywords: [] };
  }
}

/**
 * Menyimpan kamus dinamis ke LocalStorage
 */
export function saveLearnedVocabulary(vocab) {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(LEARNED_VOCAB_KEY, JSON.stringify(vocab));
  } catch (e) {
    console.warn('Gagal menyimpan kosakata baru:', e);
  }
}

/**
 * Mengambil catatan hasil belajar dan evaluasi penghapusan suara (Local Cache)
 */
export function getLearnedInsights() {
  if (typeof localStorage === 'undefined') return [];
  try {
    const saved = localStorage.getItem(LEARNED_INSIGHTS_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

/**
 * Mengambil data evaluasi pembelajaran langsung dari Firebase Firestore Cloud
 */
export async function fetchLearnedInsightsFromCloud() {
  try {
    const colRef = collection(db, INSIGHTS_COLLECTION);
    const q = query(colRef, orderBy('timestamp', 'desc'), limit(50));
    const snapshot = await getDocs(q);
    const results = [];
    snapshot.forEach(docSnap => {
      results.push({ id: docSnap.id, ...docSnap.data() });
    });

    if (typeof localStorage !== 'undefined' && results.length > 0) {
      localStorage.setItem(LEARNED_INSIGHTS_KEY, JSON.stringify(results));
    }
    return results;
  } catch (err) {
    console.warn('Firestore fetchLearnedInsights error, fallback to cache:', err);
    return getLearnedInsights();
  }
}

/**
 * Berlangganan (Real-time listener) ke Firebase Firestore untuk perubahan data pembelajaran
 */
export function subscribeToLearnedInsights(callback) {
  try {
    const colRef = collection(db, INSIGHTS_COLLECTION);
    const q = query(colRef, orderBy('timestamp', 'desc'), limit(50));
    return onSnapshot(q, (snapshot) => {
      const results = [];
      snapshot.forEach(docSnap => {
        results.push({ id: docSnap.id, ...docSnap.data() });
      });
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(LEARNED_INSIGHTS_KEY, JSON.stringify(results));
      }
      callback(results);
    }, (error) => {
      console.warn('Realtime subscription insights warning:', error);
      callback(getLearnedInsights());
    });
  } catch (e) {
    console.warn('Failed to subscribe to insights:', e);
    callback(getLearnedInsights());
    return () => {};
  }
}

/**
 * Reset / Menghapus seluruh catatan pembelajaran dari Firebase Firestore & Cache
 */
export async function clearLearnedInsights() {
  try {
    const colRef = collection(db, INSIGHTS_COLLECTION);
    const snapshot = await getDocs(colRef);
    const promises = [];
    snapshot.forEach(docSnap => {
      promises.push(deleteDoc(doc(db, INSIGHTS_COLLECTION, docSnap.id)));
    });
    await Promise.all(promises);
  } catch (e) {
    console.warn('Gagal menghapus insights di Firestore:', e);
  }
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem(LEARNED_INSIGHTS_KEY);
  }
  return [];
}

/**
 * Menghapus 1 catatan pembelajaran spesifik berdasarkan ID dari Firebase Firestore & Cache
 */
export async function deleteSingleLearnedInsight(id) {
  if (!id) return;
  try {
    const docRef = doc(db, INSIGHTS_COLLECTION, id);
    await deleteDoc(docRef);
  } catch (e) {
    console.warn('Gagal menghapus 1 insight di Firestore:', e);
  }
  if (typeof localStorage !== 'undefined') {
    try {
      const current = getLearnedInsights();
      const updated = current.filter(item => item.id !== id);
      localStorage.setItem(LEARNED_INSIGHTS_KEY, JSON.stringify(updated));
    } catch {}
  }
}

/**
 * Menyimpan catatan pembelajaran baru dan langsung sinkronisasi ke Firebase Firestore
 */
export async function recordLearnedInsight(insight) {
  const newEntry = {
    id: `ins_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    timestamp: Date.now(),
    deviceId: getDeviceId(),
    type: insight.type || 'DELETION', // 'DELETION' | 'NEW_VOCAB'
    ...insight
  };

  // 1. Simpan ke Local Storage Cache
  if (typeof localStorage !== 'undefined') {
    try {
      const current = getLearnedInsights();
      const updated = [newEntry, ...current].slice(0, 50);
      localStorage.setItem(LEARNED_INSIGHTS_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('Gagal menyimpan cache insight:', e);
    }
  }

  // 2. Simpan ke Firebase Firestore Cloud secara real-time
  try {
    const docRef = doc(db, INSIGHTS_COLLECTION, newEntry.id);
    await setDoc(docRef, newEntry);
  } catch (e) {
    console.warn('Gagal sync insight ke Firebase Firestore:', e);
  }

  // 3. Update telemetri perangkat terkini
  try {
    updateCurrentDeviceTelemetry();
  } catch {
    // Ignore telemetry sync error
  }

  return newEntry;
}

/**
 * Memeriksa apakah suatu kata/frasa sudah ada di kamus bawaan sistem
 */
export function isRegisteredKeyword(word = '') {
  const clean = (word || '').toLowerCase().trim();
  if (!clean || clean.length < 2) return true;

  // Cek kata hubung / perintah / filler bawaan
  if (Array.isArray(CONNECTING_WORDS) && CONNECTING_WORDS.includes(clean)) {
    return true;
  }

  // Cek kamus expense
  if (typeof EXPENSE_CATEGORY_KEYWORDS === 'object' && EXPENSE_CATEGORY_KEYWORDS !== null) {
    for (const cat in EXPENSE_CATEGORY_KEYWORDS) {
      if (Array.isArray(EXPENSE_CATEGORY_KEYWORDS[cat])) {
        if (EXPENSE_CATEGORY_KEYWORDS[cat].some(kw => kw.toLowerCase() === clean || kw.toLowerCase().includes(clean) || clean.includes(kw.toLowerCase()))) {
          return true;
        }
      }
    }
  }

  // Cek kamus income
  if (typeof INCOME_CATEGORY_KEYWORDS === 'object' && INCOME_CATEGORY_KEYWORDS !== null) {
    for (const cat in INCOME_CATEGORY_KEYWORDS) {
      if (Array.isArray(INCOME_CATEGORY_KEYWORDS[cat])) {
        if (INCOME_CATEGORY_KEYWORDS[cat].some(kw => kw.toLowerCase() === clean || kw.toLowerCase().includes(clean) || clean.includes(kw.toLowerCase()))) {
          return true;
        }
      }
    }
  }

  return false;
}

// Daftar kata partikel ragu / ralat lisan yang sering bocor ke judul
const HESITATION_WORDS = ['eh', 'bes', 'anu', 'bukan', 'maksud', 'maksudnya', 'salah', 'lah', 'kok', 'wait', 'bentar', 'duh', 'aduh', 'apa ya', 'tunggu'];

// Daftar kata instruksi / aksi pembayaran yang sering bocor ke judul
const LEAKED_WORDS = ['scan', 'barcode', 'qris', 'kris', 'transfer', 'debit', 'cash', 'tunai', 'beli', 'bayar', 'pake', 'pakai', 'harga', 'not'];

// Kamus fonetik umum salah dengar suara mikrofon di Indonesia
const PHONETIC_SLIPS = [
  { slip: 'skin tv', intended: 'Skintific', category: 'Skincare' },
  { slip: 'skintipik', intended: 'Skintific', category: 'Skincare' },
  { slip: 'kopsu', intended: 'Kopi Susu', category: 'Coffee' },
  { slip: 'sbux', intended: 'Starbucks', category: 'Coffee' },
  { slip: 'mekdi', intended: 'McDonalds', category: 'Food' },
  { slip: 'gacoan', intended: 'Mie Gacoan', category: 'Food' },
  { slip: 'indomi', intended: 'Indomie', category: 'Food' },
  { slip: 'pertalite', intended: 'Bensin Pertalite', category: 'Bensin' },
  { slip: 'pertamax', intended: 'Bensin Pertamax', category: 'Bensin' }
];

/**
 * Analisis mendalam & teliti alasan kenapa transaksi dihapus
 */
function analyzeDeletionReason(targetTx, voiceQuery = '', targetAmount = null) {
  const title = (targetTx.title || '').toLowerCase().trim();
  const cat = (targetTx.category || '').toLowerCase().trim();
  const amount = targetTx.amount || 0;
  const words = title.split(/\s+/).filter(Boolean);

  // 1. Cek koreksi nominal eksplisit
  if (targetAmount && amount !== targetAmount) {
    return `Koreksi nominal: di catatan tersimpan Rp ${amount.toLocaleString('id-ID')}, namun pengguna berniat mencatat Rp ${targetAmount.toLocaleString('id-ID')}.`;
  }

  // 2. Cek partikel keraguan / ralat lisan di tengah ucapan
  const foundHesitation = HESITATION_WORDS.find(hw => new RegExp(`\\b${hw}\\b`, 'i').test(title));
  if (foundHesitation) {
    return `Pengguna berbicara ragu atau melakukan ralat lisan saat merekam suara ('${foundHesitation}'), sehingga kata keraguan tersebut tidak sengaja terinput ke judul transaksi.`;
  }

  // 3. Cek salah klasifikasi kategori
  if (/rokok|surya|sampoerna|marlboro|esse|filter|gudang garam/i.test(title) && /food|makan|kuliner/i.test(cat)) {
    return `Ketidaksesuaian kategori: item rokok/tembakau keliru masuk ke kategori Food/Makanan, sehingga pengguna menghapusnya untuk memperbaiki klasifikasi.`;
  }

  // 4. Cek judul terlalu umum 1 kata & nominal kecil
  const isGenericSingleWord = words.length === 1 && (/^(obat|makan|minum|beli|uang|tes|test|coba|snack|jajan)$/i.test(title) || title.toLowerCase() === cat.toLowerCase());
  if (isGenericSingleWord) {
    return `Judul hanya berupa 1 kata umum ('${targetTx.title}') dengan nominal kecil (Rp ${amount.toLocaleString('id-ID')}). Kemungkinan pengguna sedang menguji coba mikrofon (testing mic) atau ingin mencatat nama brand item yang lebih spesifik.`;
  }

  // 5. Cek salah eja suara & kebocoran kata instruksi
  const leakedFound = LEAKED_WORDS.filter(w => new RegExp(`\\b${w}\\b`, 'i').test(title));
  const phoneticFound = PHONETIC_SLIPS.find(p => title.includes(p.slip));

  if (leakedFound.length > 0 && phoneticFound) {
    return `Judul salah eja akibat salah tangkap mic ('${phoneticFound.slip}' maksudnya '${phoneticFound.intended}') dan kata instruksi '${leakedFound.join(', ')}' ikut terbawa ke judul.`;
  }

  if (leakedFound.length > 0) {
    return `Instruksi aksi pembayaran / suara ('${leakedFound.join(', ')}') ikut terbawa ke judul catatan transaksi karena mikrofon mencatat seluruh kalimat tanpa memotong kata hubung.`;
  }

  if (phoneticFound) {
    return `Salah tangkap fonetik mikrofon: '${phoneticFound.slip}' kemungkinan besar maksud pengguna adalah brand '${phoneticFound.intended}'.`;
  }

  // 6. Alasan Hapus Transaksi Terakhir (Voice Deletion)
  if (voiceQuery === 'terakhir' || voiceQuery === 'barusan') {
    return `Pengguna membatalkan transaksi yang barusan dibuat ('${targetTx.title}') via perintah suara ('hapus transaksi terakhir'). Kemungkinan salah input nominal atau salah sebut keperluan.`;
  }

  // 7. Default Deletion Reason
  return `Pengguna menghapus transaksi '${targetTx.title}' (Rp ${amount.toLocaleString('id-ID')}) via suara. Kemungkinan transaksi duplikat, ralat nominal, atau koreksi catatan harian.`;
}

/**
 * Menghasilkan Poin Pembelajaran (Actionable Learning Point) yang cerdas & solutif
 */
function generateSensibleLearningPoint(targetTx, voiceQuery = '', targetAmount = null) {
  const title = (targetTx.title || '').toLowerCase().trim();
  const cat = (targetTx.category || '').toLowerCase().trim();
  const words = title.split(/\s+/).filter(Boolean);

  if (targetAmount && targetTx.amount !== targetAmount) {
    return `Terapkan algoritma pendeteksi nominal ralat: jika pengguna menyebut angka baru setelah kata 'ralat/maksudku', abaikan angka lama dan simpan angka terakhir.`;
  }

  const foundHesitation = HESITATION_WORDS.find(hw => new RegExp(`\\b${hw}\\b`, 'i').test(title));
  if (foundHesitation) {
    return `Tambahkan '${foundHesitation}' dan partikel jeda suara ke daftar stop-words pembersih note di voiceParser.js agar judul transaksi tetap bersih.`;
  }

  const leakedFound = LEAKED_WORDS.filter(w => new RegExp(`\\b${w}\\b`, 'i').test(title));
  if (leakedFound.length > 0) {
    return `Perketat regex pemotong kata aksi pembayaran ('${leakedFound.join(', ')}') agar tidak masuk ke bagian judul atau note transaksi.`;
  }

  const phoneticFound = PHONETIC_SLIPS.find(p => title.includes(p.slip));
  if (phoneticFound) {
    return `Daftarkan mapping fonetik '${phoneticFound.slip}' -> '${phoneticFound.intended}' ke kamus pintar agar mic otomatis mengoreksi ke ejaan brand yang benar.`;
  }

  if (words.length === 1) {
    return `Sistem telah mencatat kebiasaan ini: pengguna sering menggunakan voice shortcut ringkas untuk kategori ${targetTx.category || 'ini'}.`;
  }

  return `Mengoptimalkan deteksi akun pembayaran untuk pengeluaran ${cat} agar pengguna tidak perlu melakukan koreksi ulang pada transaksi serupa.`;
}

/**
 * Catat evaluasi saat user menghapus transaksi (Real Firebase Telemetri)
 */
export function recordDeletionEvaluation(targetTx, voiceQuery = '', targetAmount = null, userName = 'Pengguna') {
  if (!targetTx) return;

  const title = targetTx.title || targetTx.category || 'Transaksi';
  const amountStr = (targetTx.amount || 0).toLocaleString('id-ID');
  const accStr = targetTx.account || 'Cash';
  const finalUserName = userName && userName.trim() && !userName.startsWith('enc:v1:') 
    ? userName.trim() 
    : (safeStorageGet('user_profile_name') || 'Pengguna');

  const reason = analyzeDeletionReason(targetTx, voiceQuery, targetAmount);
  const learningPoint = generateSensibleLearningPoint(targetTx, voiceQuery, targetAmount);

  return recordLearnedInsight({
    type: 'DELETION',
    userName: finalUserName,
    deletedTx: `${title} (Rp ${amountStr}) • ${accStr}`,
    reason: reason,
    learningPoint: learningPoint
  });
}

/**
 * Belajar dari daftar kategori kustom pengguna dan riwayat transaksi (Continuous Learning)
 */
export function syncLearnerWithUserData(customCategories = [], transactions = []) {
  try {
    const currentVocab = getLearnedVocabulary();
    const categoriesMap = { ...currentVocab.categories };
    const customKeywordsSet = new Set(currentVocab.customKeywords || []);
    let newWordsDiscovered = [];

    // 1. Pelajari Kategori Baru & Kustom
    customCategories.forEach(cat => {
      if (cat && cat.id && cat.name) {
        const catNameLower = cat.name.toLowerCase().trim();
        if (!categoriesMap[cat.id]) {
          categoriesMap[cat.id] = [];
        }
        if (!categoriesMap[cat.id].includes(catNameLower)) {
          categoriesMap[cat.id].push(catNameLower);
          if (!isRegisteredKeyword(catNameLower)) {
            newWordsDiscovered.push({ word: cat.name, cat: cat.name });
          }
        }
        customKeywordsSet.add(catNameLower);
      }
    });

    // 2. Pelajari Judul-Judul Transaksi yang Sering Dipakai (Bersihkan kata perintah dulu)
    transactions.slice(0, 100).forEach(t => {
      if (t && t.title && typeof t.title === 'string') {
        let cleanTitle = t.title.toLowerCase().trim();
        // Bersihkan connecting words
        CONNECTING_WORDS.forEach(cw => {
          cleanTitle = cleanTitle.replace(new RegExp(`\\b${cw}\\b`, 'gi'), ' ');
        });
        cleanTitle = cleanTitle.replace(/\s+/g, ' ').trim();

        if (cleanTitle.length >= 3 && cleanTitle.length <= 30) {
          // Evaluasi kategori yang masuk akal secara cerdas
          let rationalCat = t.category || 'Umum';
          if (/nanas|apel|pisang|jeruk|semangka|melon|mangga|durian|duren|alpukat|anggur|pepaya|salak|rambutan|stroberi|strawberry|jambu|pear|pir|kelengkeng|lengkeng|duku|manggis|kiwi|sirsak|blewah|belimbing|nangka|cempedak|markisa|kedondong|srikaya|sawo|plum|kurma|delima|buah/i.test(cleanTitle)) {
            rationalCat = 'Buah';
          } else if (/es kacang|kacang hijau|kacang ijo|burjo|es buah|es campur|es teler|cendol|dawet|doger|cincau|selasih|tebu|kopyor|coca|sprite|fanta|pocari|teh|jus|susu|minuman|boba|matcha|yakult|cimory|wedang|bajigur|bandrek|sekoteng|jamu/i.test(cleanTitle)) {
            rationalCat = 'Minuman';
          } else if (/kopi|coffee|kopsu|espresso|latte|cappuccino|americano|starbucks|sbux|tomoro|fore|kenangan/i.test(cleanTitle)) {
            rationalCat = 'Coffee';
          } else if (/makan|nasi|ayam|mie|bakso|soto|sate|rawon|gule|bubur|martabak|gorengan|bakwan|tahu|tempe|seblak|cilok|cireng|batagor|siomay|warteg|burger|kfc|mcd|pizza|pasta|ramen|sushi|roti|kue|donat|snack|cemilan|telur dadar|telur goreng|telur ceplok/i.test(cleanTitle)) {
            rationalCat = 'Food';
          }

          if (!customKeywordsSet.has(cleanTitle)) {
            if (!isRegisteredKeyword(cleanTitle)) {
              newWordsDiscovered.push({ word: cleanTitle, cat: rationalCat });
            }
          }
          customKeywordsSet.add(cleanTitle);
          
          if (t.categoryId && categoriesMap[t.categoryId]) {
            if (!categoriesMap[t.categoryId].includes(cleanTitle)) {
              categoriesMap[t.categoryId].push(cleanTitle);
            }
          }
        }
      }
    });

    const updatedVocab = {
      categories: categoriesMap,
      customKeywords: Array.from(customKeywordsSet)
    };

    saveLearnedVocabulary(updatedVocab);

    // Jika menemukan kata baru yang benar-benar unik (bukan bawaan), simpan dengan tipe NEW_VOCAB dengan format simpel
    if (newWordsDiscovered.length > 0) {
      const topWord = newWordsDiscovered[0];
      const userName = safeStorageGet('user_profile_name') || 'Pengguna';
      recordLearnedInsight({
        type: 'NEW_VOCAB',
        userName: userName,
        vocabWord: topWord.word,
        category: topWord.cat,
        reason: `Pengguna mencatat istilah baru "${topWord.word}"`,
        learningPoint: `Kata "${topWord.word}" otomatis dikenali oleh mic.`
      });
    }

    return updatedVocab;
  } catch (err) {
    console.warn('Error syncing voice learner:', err);
    return null;
  }
}

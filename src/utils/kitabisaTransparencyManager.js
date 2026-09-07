/**
 * Kitabisa Transparency & Real-time Impact Manager
 * Mengelola tahapan penyaluran donasi ke Kitabisa, data video dokumentasi YouTube,
 * serta penyimpanan bukti resmi donasi untuk akun masing-masing pengguna.
 */

const STORAGE_KEY_DONATION_PROOFS = 'cassiel_user_donation_proofs';
const STORAGE_KEY_CURRENT_STAGE = 'cassiel_kitabisa_active_stage';

// Tahapan Real-time Penyaluran (Milestone)
export const DONATION_JOURNEY_STAGES = [
  {
    id: 1,
    iconEmoji: '🎁',
    title: 'Langganan Berhasil',
    subtitle: 'Pilihan misi kebaikanmu tersimpan di Cassiel.',
    status: 'completed',
    side: 'right' // Tahap 1 di kanan
  },
  {
    id: 2,
    iconEmoji: '🏦',
    title: 'Dana Masih di Google Play',
    subtitle: 'Dana masih di Google Play, menunggu pencairan sekitar tanggal 15.',
    status: 'completed',
    side: 'left' // Tahap 2 di kiri
  },
  {
    id: 3,
    iconEmoji: '💙',
    title: 'Donasi Disalurkan',
    subtitle: 'Dana disalurkan melalui Kitabisa ke misi pilihanmu.',
    status: 'completed',
    side: 'right' // Tahap 3 di kanan
  },
  {
    id: 4,
    iconEmoji: '🎬',
    title: 'Dokumentasi di YouTube',
    subtitle: 'Lihat dokumentasi penyaluran donasi melalui YouTube Cassiel.',
    status: 'completed',
    side: 'left' // Tahap 4 di kiri
  },
  {
    id: 5,
    iconEmoji: '✨',
    title: 'Laporan Donasi Terbit',
    subtitle: 'Riwayat penyaluran dapat dilihat kembali.',
    status: 'completed',
    side: 'right' // Tahap 5 di kanan
  }
];

// Data Video Dokumentasi YouTube Penyaluran Kitabisa
export const OFFICIAL_YOUTUBE_DOCUMENTATION = {
  videoId: 'dQw4w9WgXcQ',
  youtubeUrl: 'https://www.youtube.com',
  title: 'Dokumentasi Penyaluran Donasi Pengguna Cassiel ke Kitabisa',
  channelName: 'Cassiel Official & Social Impact',
  publishedDate: 'Update Berkala',
  description: 'Transparansi penuh penyaluran dana langganan Justice Cassiel langsung ke yayasan dan program resmi Kitabisa.'
};

/**
 * Mendapatkan ID tahap aktif saat ini (Default: Tahap 2 "Dana Masih di Google Play")
 */
export function getKitabisaCurrentActiveStage() {
  if (typeof localStorage === 'undefined') return 2;
  const val = localStorage.getItem(STORAGE_KEY_CURRENT_STAGE);
  if (!val) return 2;
  const num = parseInt(val, 10);
  return isNaN(num) ? 2 : num;
}

/**
 * Mengubah ID tahap aktif
 */
export function setKitabisaCurrentActiveStage(stageId) {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(STORAGE_KEY_CURRENT_STAGE, String(stageId));
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('cassiel_kitabisa_stage_changed', { detail: { activeStage: stageId } }));
  }
}

/**
 * Mengambil semua bukti donasi akun pengguna saat ini
 */
export function getUserDonationProofs() {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_DONATION_PROOFS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.warn('Gagal membaca bukti donasi:', e);
    return [];
  }
}

import { db } from './firebase.js';
import { getDeviceId } from './telemetry.js';
import { doc, getDoc, setDoc, runTransaction } from '@firebase/firestore';
import { Capacitor } from '@capacitor/core';

/**
 * Memeriksa apakah aplikasi berjalan di perangkat user asli (Native Android/iOS), bukan Localhost/Web Dev
 */
export function isRealUserEnvironment() {
  if (typeof window === 'undefined') return false;
  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  if (isLocalhost) return false;
  return Capacitor.isNativePlatform();
}

/**
 * Format label donatur unik 6 digit (contoh: Donatur #000001)
 */
export function formatDonorLabel(num = 1) {
  const safeNum = Math.max(1, parseInt(num, 10) || 1);
  return `Donatur #${String(safeNum).padStart(6, '0')}`;
}

/**
 * Mengambil atau menetapkan nomor donatur permanen pengguna dari LocalStorage / Cache
 */
export function getOrAssignUserDonorNumber() {
  if (typeof localStorage === 'undefined') return null;
  const existing = localStorage.getItem('cassiel_user_assigned_donor_number');
  if (existing) {
    const parsed = parseInt(existing, 10);
    if (!isNaN(parsed) && parsed > 0) return parsed;
  }
  const proofs = getUserDonationProofs();
  if (proofs && proofs.length > 0 && proofs[0].donorNumber) {
    const num = parseInt(proofs[0].donorNumber, 10);
    if (!isNaN(num) && num > 0) {
      localStorage.setItem('cassiel_user_assigned_donor_number', String(num));
      return num;
    }
  }
  return null;
}

/**
 * Sinkronisasi nomor urut donatur dengan Firebase Firestore.
 * Sifat: Permanen per Akun/Perangkat Real.
 * - Localhost TIDAK dihitung sebagai user dan tidak akan memicu nomor donatur di Firestore.
 * - Jika user real sudah punya nomor (misal #000001), tidak akan pernah bertambah/berubah meskipun langganan/donasi berulang kali.
 * - User real baru berikutnya akan mendapatkan nomor urut berikutnya (#000002, #000003, dst.).
 */
export async function syncAndAssignDonorNumberFromFirebase(userName = 'Pengguna Cassiel', donationAmount = 0) {
  if (typeof localStorage === 'undefined') return null;
  
  // Abaikan lingkungan localhost / web testing agar tidak mengotori database donatur riil
  if (!isRealUserEnvironment()) {
    return null;
  }

  const devId = getDeviceId();
  let localNum = localStorage.getItem('cassiel_user_assigned_donor_number');

  try {
    const donorDocRef = doc(db, 'cassiel_donors', devId);
    
    // 1. Jika di lokal sudah ada nomor permanen, pastikan tersimpan di Firebase
    if (localNum) {
      const parsed = parseInt(localNum, 10);
      if (!isNaN(parsed) && parsed > 0) {
        try {
          const donorSnap = await getDoc(donorDocRef);
          if (donorSnap.exists()) {
            const data = donorSnap.data();
            const currentCount = data.donationCount || 1;
            const currentTotal = data.totalDonated || 0;
            await setDoc(donorDocRef, {
              userName: userName || data.userName || 'Pengguna Cassiel',
              donationCount: currentCount + (donationAmount > 0 ? 1 : 0),
              totalDonated: currentTotal + donationAmount,
              lastDonatedAt: new Date().toISOString()
            }, { merge: true });
          } else {
            await setDoc(donorDocRef, {
              deviceId: devId,
              donorNumber: parsed,
              donorLabel: formatDonorLabel(parsed),
              userName: userName || 'Pengguna Cassiel',
              donationCount: 1,
              totalDonated: donationAmount,
              firstDonatedAt: new Date().toISOString(),
              lastDonatedAt: new Date().toISOString()
            }, { merge: true });
          }
        } catch (e) {
          console.warn('Firebase donor sync info:', e);
        }
        return parsed;
      }
    }

    // 2. Jika belum ada di lokal, periksa apakah sudah pernah terdaftar di Firestore
    const donorSnap = await getDoc(donorDocRef);
    if (donorSnap.exists()) {
      const data = donorSnap.data();
      const existingDonorNum = data.donorNumber || 1;
      localStorage.setItem('cassiel_user_assigned_donor_number', String(existingDonorNum));
      return existingDonorNum;
    }

    // 3. Hanya daftarkan nomor baru jika user benar-benar melakukan donasi / langganan (donationAmount > 0 atau ada bukti)
    const proofs = getUserDonationProofs();
    if (donationAmount <= 0 && (!proofs || proofs.length === 0)) {
      return null;
    }

    // User baru yang pertama kali donasi/langganan -> Ambil nomor urut atomik dari counter Firestore
    let assignedNumber = 1;
    const counterRef = doc(db, 'cassiel_system_counters', 'donors_registry');

    await runTransaction(db, async (transaction) => {
      const counterSnap = await transaction.get(counterRef);
      let nextNum = 1;
      if (counterSnap.exists()) {
        const cData = counterSnap.data();
        nextNum = (cData.totalDonorsCount || 0) + 1;
      }

      transaction.set(counterRef, {
        totalDonorsCount: nextNum,
        lastAssignedAt: new Date().toISOString()
      }, { merge: true });

      transaction.set(donorDocRef, {
        deviceId: devId,
        donorNumber: nextNum,
        donorLabel: formatDonorLabel(nextNum),
        userName: userName || 'Pengguna Cassiel',
        donationCount: 1,
        totalDonated: donationAmount,
        firstDonatedAt: new Date().toISOString(),
        lastDonatedAt: new Date().toISOString()
      });

      assignedNumber = nextNum;
    });

    localStorage.setItem('cassiel_user_assigned_donor_number', String(assignedNumber));
    return assignedNumber;
  } catch (err) {
    console.warn('Fallback local donor sequence:', err);
    return null;
  }
}

/**
 * Menyimpan bukti donasi baru untuk akun pengguna
 */
export function recordUserDonationProof({
  userName = 'Pengguna Cassiel',
  planTitle = 'Justice Cassiel Pro',
  planPriceText = 'Rp89.000',
  amountDonated = 68085,
  causeId = 'air_bersih_gunungkidul',
  causeTitle = 'Air Bersih Untuk Gunungkidul',
  causeOrganizer = 'Tanah Air Lestari'
}) {
  if (typeof localStorage === 'undefined') return null;
  try {
    const existing = getUserDonationProofs();
    const dateNow = new Date();
    const formattedDate = dateNow.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    const certificateId = 'CSL-KTB-' + Math.floor(100000 + Math.random() * 900000);
    const donorNumber = getOrAssignUserDonorNumber();
    const donorLabel = formatDonorLabel(donorNumber);

    const newProof = {
      id: 'proof_' + Date.now(),
      certificateNumber: certificateId,
      donorNumber,
      donorLabel,
      userName: userName || 'Pengguna Cassiel',
      planTitle,
      planPriceText,
      amountDonated,
      causeId,
      causeTitle,
      causeOrganizer,
      dateFormatted: formattedDate,
      timestamp: dateNow.toISOString(),
      status: 'TERVERIFIKASI',
      youtubeUrl: OFFICIAL_YOUTUBE_DOCUMENTATION.youtubeUrl,
      verifiedBy: 'Kitabisa & Cassiel Transparency'
    };

    const updatedList = [newProof, ...existing];
    localStorage.setItem(STORAGE_KEY_DONATION_PROOFS, JSON.stringify(updatedList));

    // Sinkronkan ke Firebase secara background
    syncAndAssignDonorNumberFromFirebase(userName, amountDonated).catch(() => {});

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('cassiel_donation_proof_added', { detail: newProof }));
    }

    return newProof;
  } catch (e) {
    console.error('Gagal mencatat bukti donasi:', e);
    return null;
  }
}

/**
 * Mendapatkan status Donatur Pioneer akun saat ini
 */
export function getUserDonorInfo() {
  if (!isRealUserEnvironment()) {
    return {
      isDonor: false,
      donorNumber: null,
      donorLabel: null
    };
  }

  const donorNumber = getOrAssignUserDonorNumber();
  if (donorNumber && !isNaN(donorNumber) && donorNumber > 0) {
    return {
      isDonor: true,
      donorNumber,
      donorLabel: formatDonorLabel(donorNumber)
    };
  }

  return {
    isDonor: false,
    donorNumber: null,
    donorLabel: null
  };
};

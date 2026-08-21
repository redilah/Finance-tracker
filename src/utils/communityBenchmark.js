/**
 * communityBenchmark.js
 * Mengambil data rata-rata pengeluaran komunitas per kategori dari Firestore telemetry
 * untuk fitur Social Proof pada narasi Insight akhir bulan.
 *
 * Mengagregasi data dari seluruh perangkat pengguna di dashboard (9 user).
 * Di-cache di localStorage dengan TTL 1 jam agar tidak spam Firestore.
 */

import { getTelemetryData, getDeviceId } from './telemetry.js';

const CACHE_KEY = 'community_benchmark_cache';
const CACHE_TTL = 60 * 60 * 1000; // 1 jam

// Normalisasi nama kategori ke bentuk kanonikal
export const normalizeCanonicalCategory = (rawName) => {
  const clean = (rawName || '').toLowerCase().trim();
  if (!clean) return 'Umum';

  if (/^(food|makan|makanan|kuliner|jajan)$/i.test(clean)) return 'Makanan';
  if (/^(coffee|kopi|kafe|cafe)$/i.test(clean)) return 'Kopi';
  if (/^(transport|transportasi|bensin|bbm|ojol|grab|gojek|taksi|kereta|bus)$/i.test(clean)) return 'Transportasi';
  if (/^(supermarket|minimarket|indomaret|alfamart|sembako|belanja)$/i.test(clean)) return 'Supermarket';
  if (/^(fashion|baju|celana|sepatu|tas|pakaian)$/i.test(clean)) return 'Fashion';
  if (/^(skincare|kosmetik|makeup|perawatan|parfum)$/i.test(clean)) return 'Skincare';
  if (/^(barber|barbershop|potong rambut|salon)$/i.test(clean)) return 'Barbershop';
  if (/^(kost|sewa|kontrakan|rumah)$/i.test(clean)) return 'Kost';
  if (/^(pulsa|kuota|paket data)$/i.test(clean)) return 'Pulsa';
  if (/^(wifi|wi-fi|indihome|biznet|first media|myrepublic|internet rumah)$/i.test(clean)) return 'WiFi';
  if (/^(hiburan|entertainment|nonton|film|cinema|game|topup|bioskop)$/i.test(clean)) return 'Hiburan';
  if (/^(edukasi|buku|kursus|les|sekolah)$/i.test(clean)) return 'Edukasi';
  if (/^(obat|dokter|rumah sakit|klinik|apotek|kesehatan)$/i.test(clean)) return 'Kesehatan';
  if (/^(donasi|sedekah|zakat|amal)$/i.test(clean)) return 'Donasi';
  if (/^(sub|subscription|langganan)$/i.test(clean)) return 'Subscription';

  return rawName.trim();
};

// Estimasi tiket rata-rata per transaksi untuk kategori (jika device lama belum kirim amounts)
const DEFAULT_AVG_TICKET = {
  Makanan: 25000,
  Kopi: 18000,
  Transportasi: 20000,
  Supermarket: 65000,
  Fashion: 85000,
  Skincare: 45000,
  Barbershop: 35000,
  Kost: 600000,
  Pulsa: 40000,
  WiFi: 250000,
  Hiburan: 35000,
  Edukasi: 50000,
  Kesehatan: 35000,
  Donasi: 20000,
  Subscription: 30000,
  Umum: 30000
};

/**
 * Fetch dan hitung rata-rata pengeluaran per kategori dari seluruh pengguna Cassiel.
 * @returns {Object} { [canonicalCat]: { avgAmount, userCount, totalAmount, allAmounts } }
 */
export const fetchCommunityBenchmark = async () => {
  // Cek cache dulu
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed._timestamp && (Date.now() - parsed._timestamp) < CACHE_TTL && parsed.data && Object.keys(parsed.data).length > 0) {
        return parsed.data;
      }
    }
  } catch {}

  const currentDeviceId = getDeviceId();
  let allDevices = [];

  try {
    allDevices = await getTelemetryData();
  } catch (e) {
    console.warn('[CommunityBenchmark] Failed to fetch telemetry:', e?.message || e);
    return {};
  }

  if (!Array.isArray(allDevices) || allDevices.length === 0) {
    return {};
  }

  // Hitung jumlah total pengguna nyata di database (selain device sendiri)
  const validDevices = allDevices.filter(d => d.id !== currentDeviceId);
  const totalOtherUsersCount = Math.max(validDevices.length, allDevices.length > 1 ? allDevices.length - 1 : 1);

  const categoryAggregates = {};

  allDevices.forEach(device => {
    // Skip device sendiri agar perbandingan fair (user vs orang lain)
    if (device.id === currentDeviceId) return;

    const amounts = device.expenseCategoryAmounts || {};
    const stats = device.expenseCategoryStats || {};

    // 1. Kumpulkan kategori dari amounts (jika ada)
    const processedCats = new Set();
    Object.keys(amounts).forEach(rawCat => {
      const amt = Number(amounts[rawCat]) || 0;
      if (amt > 0) {
        const canonical = normalizeCanonicalCategory(rawCat);
        if (!categoryAggregates[canonical]) {
          categoryAggregates[canonical] = { totalAmount: 0, userCount: 0, allAmounts: [] };
        }
        categoryAggregates[canonical].totalAmount += amt;
        categoryAggregates[canonical].userCount += 1;
        categoryAggregates[canonical].allAmounts.push(amt);
        processedCats.add(canonical);
      }
    });

    // 2. Fallback: Kumpulkan kategori dari stats transaksi (jika amounts belum terisi di device lama)
    Object.keys(stats).forEach(rawCat => {
      const canonical = normalizeCanonicalCategory(rawCat);
      if (!processedCats.has(canonical)) {
        const txCount = Number(stats[rawCat]) || 0;
        if (txCount > 0) {
          const estimatedAmt = txCount * (DEFAULT_AVG_TICKET[canonical] || DEFAULT_AVG_TICKET.Umum);
          if (!categoryAggregates[canonical]) {
            categoryAggregates[canonical] = { totalAmount: 0, userCount: 0, allAmounts: [] };
          }
          categoryAggregates[canonical].totalAmount += estimatedAmt;
          categoryAggregates[canonical].userCount += 1;
          categoryAggregates[canonical].allAmounts.push(estimatedAmt);
        }
      }
    });
  });

  // Hitung rata-rata per kategori (hanya menghitung pengguna yang benar-benar ada transaksi di kategori ini)
  const result = {};
  Object.keys(categoryAggregates).forEach(cat => {
    const agg = categoryAggregates[cat];
    const uCount = Math.max(agg.userCount, 1);
    result[cat] = {
      avgAmount: Math.round(agg.totalAmount / (agg.userCount || 1)),
      userCount: uCount,
      totalAmount: agg.totalAmount,
      allAmounts: agg.allAmounts
    };
  });

  // Simpan ke cache
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({
      _timestamp: Date.now(),
      data: result
    }));
  } catch {}

  return result;
};

/**
 * Memberikan initial benchmark secara sinkron saat mount agar langsung tampil tanpa jeda async
 * Menghitung userCount dari cache telemetry nyata yang tersimpan di perangkat (Firebase)
 */
export const getInitialCommunityBenchmark = () => {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed.data && Object.keys(parsed.data).length > 0) {
        return parsed.data;
      }
    }
  } catch {}

  // Hitung jumlah device real dari cache telemetry Firebase yang ada di dashboard
  let cachedUserCount = 9;
  try {
    const rawList = localStorage.getItem('admin_app_telemetry_cache');
    if (rawList) {
      const list = JSON.parse(rawList);
      if (Array.isArray(list) && list.length > 0) {
        cachedUserCount = list.length > 1 ? list.length - 1 : list.length;
      }
    }
  } catch {}

  return {
    Makanan: { avgAmount: 85000, userCount: cachedUserCount },
    Food: { avgAmount: 85000, userCount: cachedUserCount },
    Kopi: { avgAmount: 45000, userCount: cachedUserCount },
    Coffee: { avgAmount: 45000, userCount: cachedUserCount },
    Transportasi: { avgAmount: 60000, userCount: cachedUserCount },
    Transport: { avgAmount: 60000, userCount: cachedUserCount },
    Supermarket: { avgAmount: 120000, userCount: cachedUserCount },
    Fashion: { avgAmount: 150000, userCount: cachedUserCount },
    Skincare: { avgAmount: 75000, userCount: cachedUserCount },
    Barbershop: { avgAmount: 40000, userCount: cachedUserCount },
    Kost: { avgAmount: 650000, userCount: cachedUserCount },
    Pulsa: { avgAmount: 50000, userCount: cachedUserCount },
    Hiburan: { avgAmount: 50000, userCount: cachedUserCount },
    Donasi: { avgAmount: 30000, userCount: cachedUserCount },
    Kesehatan: { avgAmount: 50000, userCount: cachedUserCount },
    Subscription: { avgAmount: 45000, userCount: cachedUserCount },
    Umum: { avgAmount: 60000, userCount: cachedUserCount }
  };
};

/**
 * Ambil benchmark komunitas untuk 1 kategori spesifik.
 * @param {string} categoryName - Nama kategori (case-insensitive & canonical match)
 * @param {Object} benchmarkData - Hasil dari fetchCommunityBenchmark()
 * @returns {{ avgAmount: number, userCount: number } | null}
 */
export const getCommunityAverage = (categoryName, benchmarkData) => {
  const data = benchmarkData || getInitialCommunityBenchmark();
  if (!categoryName) return null;

  const canonical = normalizeCanonicalCategory(categoryName);

  // 1. Cocokkan via canonical key (e.g. 'Makanan')
  if (data[canonical]) {
    return data[canonical];
  }

  // 2. Cocokkan via exact raw key (e.g. 'Food')
  if (data[categoryName]) {
    return data[categoryName];
  }

  // 3. Case-insensitive fallback
  const lowerName = categoryName.toLowerCase();
  const matchKey = Object.keys(data).find(k => k.toLowerCase() === lowerName || normalizeCanonicalCategory(k) === canonical);
  if (matchKey) {
    return data[matchKey];
  }

  // 4. Default fallback ke Makanan / Umum
  return data['Makanan'] || data['Umum'] || null;
};


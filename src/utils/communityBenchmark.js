/**
 * communityBenchmark.js
 * Mengambil data rata-rata PORSI pengeluaran komunitas per kategori (dalam persen)
 * dari Firestore telemetry untuk fitur Social Proof pada narasi Insight akhir bulan.
 *
 * PRIVASI: Telemetri tidak lagi menyimpan nominal Rupiah per kategori. Setiap perangkat
 * hanya mengirim `expenseCategoryPercentages` (porsi % dari total pengeluaran bulan ini).
 * Benchmark ini karenanya membandingkan porsi (%), bukan nominal.
 *
 * Di-cache di localStorage dengan TTL 1 jam agar tidak spam Firestore.
 */

import { getTelemetryData, getDeviceId } from './telemetry.js';

const CACHE_KEY = 'community_benchmark_cache_v2_percent';
// Cache versi lama berisi rata-rata nominal Rupiah — dibuang agar tidak tersimpan lagi
const LEGACY_CACHE_KEY = 'community_benchmark_cache';
const CACHE_TTL = 60 * 60 * 1000; // 1 jam

const purgeLegacyCache = () => {
  try {
    localStorage.removeItem(LEGACY_CACHE_KEY);
  } catch {}
};

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
  if (/^(tiket|ticket|karcis)$/i.test(clean)) return 'Tiket';

  return rawName.trim();
};

// Gabungkan map { kategoriMentah: nilai } ke kategori kanonikal
const toCanonicalMap = (rawMap) => {
  const out = {};
  Object.keys(rawMap || {}).forEach(rawCat => {
    const val = Number(rawMap[rawCat]) || 0;
    if (val > 0) {
      const canonical = normalizeCanonicalCategory(rawCat);
      out[canonical] = (out[canonical] || 0) + val;
    }
  });
  return out;
};

// Ubah jumlah transaksi per kategori menjadi porsi persen (fallback untuk perangkat versi lama)
const countsToPercentages = (countMap) => {
  const total = Object.values(countMap).reduce((sum, v) => sum + v, 0);
  if (total <= 0) return {};
  const out = {};
  Object.keys(countMap).forEach(cat => {
    out[cat] = (countMap[cat] / total) * 100;
  });
  return out;
};

/**
 * Fetch dan hitung rata-rata porsi pengeluaran (%) per kategori dari seluruh pengguna Cassiel.
 * @returns {Object} { [canonicalCat]: { avgPercent, userCount } }
 */
export const fetchCommunityBenchmark = async () => {
  purgeLegacyCache();

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

  const categoryAggregates = {};

  allDevices.forEach(device => {
    // Skip device sendiri agar perbandingan fair (user vs orang lain)
    if (device.id === currentDeviceId) return;

    // 1. Utamakan porsi persen yang dikirim perangkat versi baru
    let percents = toCanonicalMap(device.expenseCategoryPercentages);

    // 2. Fallback: perangkat versi lama → porsi berdasarkan jumlah transaksi per kategori
    if (Object.keys(percents).length === 0) {
      percents = countsToPercentages(toCanonicalMap(device.expenseCategoryStats));
    }

    Object.keys(percents).forEach(cat => {
      if (!categoryAggregates[cat]) {
        categoryAggregates[cat] = { totalPercent: 0, userCount: 0 };
      }
      categoryAggregates[cat].totalPercent += percents[cat];
      categoryAggregates[cat].userCount += 1;
    });
  });

  // Hitung rata-rata porsi per kategori (hanya pengguna yang punya pengeluaran di kategori ini)
  const result = {};
  Object.keys(categoryAggregates).forEach(cat => {
    const agg = categoryAggregates[cat];
    result[cat] = {
      avgPercent: Math.round(agg.totalPercent / (agg.userCount || 1)),
      userCount: Math.max(agg.userCount, 1)
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
 * Memberikan benchmark dari cache secara sinkron saat mount agar langsung tampil tanpa jeda async.
 * Tidak lagi mengembalikan angka rekaan — jika belum ada cache nyata, hasilnya objek kosong.
 */
export const getInitialCommunityBenchmark = () => {
  purgeLegacyCache();
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed.data && Object.keys(parsed.data).length > 0) {
        return parsed.data;
      }
    }
  } catch {}
  return {};
};

/**
 * Ambil benchmark komunitas untuk 1 kategori spesifik.
 * @param {string} categoryName - Nama kategori (case-insensitive & canonical match)
 * @param {Object} benchmarkData - Hasil dari fetchCommunityBenchmark()
 * @returns {{ avgPercent: number, userCount: number } | null}
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

  // 4. Tidak ada data untuk kategori ini — jangan pinjam data kategori lain
  return null;
};

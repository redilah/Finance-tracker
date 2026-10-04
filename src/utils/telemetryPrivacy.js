/**
 * telemetryPrivacy.js
 * Helper murni (tanpa Firebase/DOM) untuk menjaga privasi data telemetri Cassiel.
 *
 * Aturan: nominal Rupiah per kategori TIDAK PERNAH dikirim ke server.
 * Yang dikirim hanya porsi (%) pengeluaran per kategori.
 */

// Field nominal Rupiah lama yang tidak boleh lagi disimpan/ditampilkan (privasi & Data Safety Play Store)
export const LEGACY_NOMINAL_FIELDS = ['expenseCategoryAmounts'];

// Buang field nominal lama dari record telemetri (data dari Firestore / cache lokal versi lama)
export const stripLegacyNominalFields = (item) => {
  if (!item || typeof item !== 'object') return item;
  if (!LEGACY_NOMINAL_FIELDS.some(f => f in item)) return item;
  const clean = { ...item };
  LEGACY_NOMINAL_FIELDS.forEach(f => { delete clean[f]; });
  return clean;
};

/**
 * Ubah total nominal per kategori menjadi persentase porsi (bilangan bulat, total = 100).
 * Memakai metode largest-remainder agar jumlah persen selalu tepat 100.
 * Kategori yang porsinya dibulatkan menjadi 0% tidak disertakan.
 * @param {Object<string, number>} amountsByCategory
 * @returns {Object<string, number>} { [kategori]: persen }
 */
export const toCategoryPercentages = (amountsByCategory) => {
  const entries = Object.entries(amountsByCategory || {})
    .map(([cat, amt]) => [cat, Number(amt) || 0])
    .filter(([, amt]) => Number.isFinite(amt) && amt > 0);
  const total = entries.reduce((sum, [, amt]) => sum + amt, 0);
  if (total <= 0) return {};

  const rows = entries.map(([cat, amt]) => {
    const exact = (amt / total) * 100;
    const floor = Math.floor(exact);
    return { cat, floor, remainder: exact - floor };
  });
  let leftover = 100 - rows.reduce((sum, r) => sum + r.floor, 0);
  [...rows]
    .sort((a, b) => b.remainder - a.remainder)
    .forEach(r => {
      if (leftover > 0) {
        r.floor += 1;
        leftover -= 1;
      }
    });

  const result = {};
  rows.forEach(r => {
    if (r.floor > 0) result[r.cat] = r.floor;
  });
  return result;
};

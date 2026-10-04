/**
 * Test: telemetryPrivacy.js
 * Memastikan telemetri hanya membawa porsi persen (tanpa nominal Rupiah) dan
 * field nominal lama selalu dibersihkan.
 * Jalankan: node test/telemetryPrivacy.test.js
 */
import { toCategoryPercentages, stripLegacyNominalFields, LEGACY_NOMINAL_FIELDS } from '../src/utils/telemetryPrivacy.js';

let passed = 0;
let failed = 0;
const check = (name, cond, detail = '') => {
  if (cond) {
    passed++;
    console.log(`  ✓ PASS: ${name}`);
  } else {
    failed++;
    console.error(`  ✗ FAIL: ${name} ${detail}`);
  }
};
const sum = (obj) => Object.values(obj).reduce((a, b) => a + b, 0);

console.log('\n[Group 1: toCategoryPercentages]');
{
  const r = toCategoryPercentages({ Makanan: 500000, Transport: 300000, Kopi: 200000 });
  check('Porsi sederhana 50/30/20', r.Makanan === 50 && r.Transport === 30 && r.Kopi === 20, JSON.stringify(r));
  check('Total tepat 100', sum(r) === 100);
}
{
  const r = toCategoryPercentages({ A: 1, B: 1, C: 1 });
  check('Sepertiga-sepertiga tetap berjumlah 100', sum(r) === 100, JSON.stringify(r));
  check('Nilai 33/33/34 (largest remainder)', Object.values(r).sort().join(',') === '33,33,34', JSON.stringify(r));
}
{
  const r = toCategoryPercentages({ Besar: 1000000, Kecil: 1000 });
  check('Kategori < 0,5% dibuang, total tetap 100', sum(r) === 100 && !('Kecil' in r), JSON.stringify(r));
}
{
  const r = toCategoryPercentages({ Makanan: 123457, Kost: 750000, Pulsa: 49999, Hiburan: 87654 });
  const values = Object.values(r);
  check('Semua nilai integer 0..100', values.every(v => Number.isInteger(v) && v >= 0 && v <= 100));
  check('Tidak ada nominal Rupiah yang lolos (nilai <= 100)', values.every(v => v <= 100));
  check('Total acak tetap 100', sum(r) === 100, JSON.stringify(r));
}
check('Input kosong → {}', Object.keys(toCategoryPercentages({})).length === 0);
check('Input null → {}', Object.keys(toCategoryPercentages(null)).length === 0);
check('Nominal nol/negatif/NaN diabaikan', JSON.stringify(toCategoryPercentages({ A: 0, B: -5, C: 'abc', D: 10 })) === '{"D":100}');
check('Nominal string numerik didukung', toCategoryPercentages({ A: '300', B: '100' }).A === 75);

console.log('\n[Group 2: stripLegacyNominalFields]');
{
  const legacy = { id: 'dev_1', userName: 'Budi', groups: [{ name: 'Kos Mawar' }], expenseCategoryAmounts: { Makanan: 500000 } };
  const clean = stripLegacyNominalFields(legacy);
  check('Field expenseCategoryAmounts dihapus', !('expenseCategoryAmounts' in clean));
  check('Nama pengguna dipertahankan', clean.userName === 'Budi');
  check('Nama grup dipertahankan', clean.groups[0].name === 'Kos Mawar');
  check('Objek asli tidak dimutasi', 'expenseCategoryAmounts' in legacy);
}
{
  const modern = { id: 'dev_2', expenseCategoryPercentages: { Makanan: 100 } };
  check('Record tanpa field lama dikembalikan apa adanya', stripLegacyNominalFields(modern) === modern);
}
check('Nilai non-objek aman', stripLegacyNominalFields(null) === null);
check('Daftar field lama memuat expenseCategoryAmounts', LEGACY_NOMINAL_FIELDS.includes('expenseCategoryAmounts'));

console.log('\n====================================================');
console.log(`TOTAL TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
console.log('====================================================');
if (failed > 0) process.exit(1);

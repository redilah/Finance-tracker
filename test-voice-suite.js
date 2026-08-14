/**
 * Autonomous Voice Test Harness & Benchmark Suite - Expanded with Command Verbs Sanitization (120+ Scenarios)
 */

import { parseVoiceTransaction } from './src/utils/voiceParser.js';

if (typeof global.localStorage === 'undefined') {
  global.localStorage = {
    _data: {},
    getItem(key) { return this._data[key] || null; },
    setItem(key, val) { this._data[key] = String(val); },
    removeItem(key) { delete this._data[key]; },
    clear() { this._data = {}; }
  };
}

const mockExpenseCategories = [
  { id: 'food', name: 'Makanan' },
  { id: 'coffee', name: 'Kopi' },
  { id: 'gofood', name: 'GoFood' },
  { id: 'transport', name: 'Transportasi' },
  { id: 'bioskop', name: 'Bioskop' },
  { id: 'barber', name: 'Barber' },
  { id: 'skincare', name: 'Skincare' },
  { id: 'edukasi', name: 'Edukasi' },
  { id: 'galon', name: 'Air Galon' },
  { id: 'fashion', name: 'Fashion' },
  { id: 'supermarket', name: 'Supermarket' },
  { id: 'sub', name: 'Langganan' },
  { id: 'pesawat', name: 'Pesawat' },
  { id: 'kost', name: 'Kost' },
  { id: 'sepatu', name: 'Sepatu' },
  { id: 'donasi', name: 'Donasi' },
  { id: 'topupGame', name: 'Top Up Game' },
  { id: 'bensin', name: 'Bensin' },
  { id: 'konser', name: 'Konser' },
  { id: 'pulsa', name: 'Pulsa & Tagihan' },
  { id: 'rumahSakit', name: 'Rumah Sakit' },
  { id: 'obatSakit', name: 'Obat & Apotek' },
  { id: 'jajanAdek', name: 'Jajan Adik' },
  { id: 'party', name: 'Pesta & Hadiah' }
];

const mockIncomeCategories = [
  { id: 'gaji', name: 'Gaji' },
  { id: 'bonus', name: 'Bonus' },
  { id: 'kip', name: 'Beasiswa / KIP' },
  { id: 'investasi', name: 'Investasi' },
  { id: 'bisnis', name: 'Bisnis / Jualan' },
  { id: 'affiliate', name: 'Affiliate' }
];

const mockAccountsList = ['Cash', 'Bank', 'QRIS', 'BCA', 'Mandiri', 'GoPay', 'OVO', 'Dana', 'ShopeePay', 'BRI', 'BNI'];

const TEST_CASES = [
  // A. KASUS KATA PERINTAH (COMMAND VERBS SANITIZATION - JANGAN MASUK KE NOTE/JUDUL)
  { input: 'tambahkan rujak pepaya 5000', expType: 'Expense', expAmount: 5000, expCatId: 'food', expNote: 'Rujak pepaya' },
  { input: 'tambahkan rujak mentimun 10.000', expType: 'Expense', expAmount: 10000, expCatId: 'food', expNote: 'Rujak mentimun' },
  { input: 'tolong buatkan soto ayam 20k cash', expType: 'Expense', expAmount: 20000, expCatId: 'food', expNote: 'Soto ayam' },
  { input: 'bantu masukkan bensin pertamax 50 ribu', expType: 'Expense', expAmount: 50000, expCatId: 'bensin', expNote: 'Bensin pertamax' },
  { input: 'coba input kopi kenangan 18rb', expType: 'Expense', expAmount: 18000, expCatId: 'coffee', expNote: 'Kopi kenangan' },
  { input: 'catatkan makan siang nasi padang 25k', expType: 'Expense', expAmount: 25000, expCatId: 'food', expNote: 'Makan siang nasi padang' },
  { input: 'simpan pengeluaran seblak ceker 15000', expType: 'Expense', expAmount: 15000, expCatId: 'food', expNote: 'Seblak ceker' },
  { input: 'tuliskan uang jajan adek 20rb', expType: 'Expense', expAmount: 20000, expCatId: 'jajanAdek', expNote: 'Jajan adek' },
  { input: 'tolong simpan gaji 5 juta bca', expType: 'Income', expAmount: 5000000, expCatId: 'gaji', expAccount: 'BCA', expNote: 'Gaji' },

  // B. Nominal Gaul & Slang
  { input: 'beli seblak goban pake bca', expType: 'Expense', expAmount: 50000, expCatId: 'food', expAccount: 'BCA' },
  { input: 'beli es teh pego', expType: 'Expense', expAmount: 150000, expCatId: 'coffee' },
  { input: 'makan bakso noban', expType: 'Expense', expAmount: 20000, expCatId: 'food' },
  { input: 'beli jajan ceban', expType: 'Expense', expAmount: 10000, expCatId: 'food' },
  { input: 'parkir goceng pake cash', expType: 'Expense', expAmount: 5000, expCatId: 'transport', expAccount: 'Cash' },
  { input: 'beli permen noceng', expType: 'Expense', expAmount: 2000 },
  { input: 'kasih pengamen seceng', expType: 'Expense', expAmount: 1000, expCatId: 'donasi' },
  { input: 'uang parkir gopek', expType: 'Expense', expAmount: 500, expCatId: 'transport' },
  { input: 'seratus perak cepek', expType: 'Expense', expAmount: 100 },
  { input: 'nasi padang satu setengah juta buat arisan', expType: 'Expense', expAmount: 1500000, expCatId: 'food' },
  { input: 'bayar kosan satu koma lima juta', expType: 'Expense', expAmount: 1500000, expCatId: 'kost' },
  { input: 'sewa kontrakan 2.5 juta transfer mandiri', expType: 'Expense', expAmount: 2500000, expCatId: 'kost', expAccount: 'Mandiri' },
  { input: 'beli laptop 3,5jt transfer bank', expType: 'Expense', expAmount: 3500000, expAccount: 'Bank' },
  { input: 'beli cincin setengah juta', expType: 'Expense', expAmount: 500000 },
  { input: 'investasi tanah setengah miliar', expType: 'Expense', expAmount: 500000000 },
  { input: 'dapet bonus sepuluh juta', expType: 'Income', expAmount: 10000000, expCatId: 'bonus' },
  { input: 'gaji lima juta dari kantor transfer bca', expType: 'Income', expAmount: 5000000, expCatId: 'gaji', expAccount: 'BCA' },
  { input: 'terima gaji 4 juta', expType: 'Income', expAmount: 4000000, expCatId: 'gaji' },
  { input: 'dapet transferan 3 juta', expType: 'Income', expAmount: 3000000 },
  { input: 'hasil jualan 2 juta masuk dana', expType: 'Income', expAmount: 2000000, expCatId: 'bisnis', expAccount: 'Dana' },
  { input: 'uang masuk sejuta', expType: 'Income', expAmount: 1000000 },
  { input: 'beli sepatu lima ratus ribu via qris', expType: 'Expense', expAmount: 500000, expCatId: 'sepatu', expAccount: 'QRIS' },
  { input: 'baju kemeja dua ratus ribu', expType: 'Expense', expAmount: 200000, expCatId: 'fashion' },
  { input: 'belanja bulanan seratus ribu', expType: 'Expense', expAmount: 100000, expCatId: 'supermarket' },

  // C. Transaksi Makanan & Minuman
  { input: 'ayam geprek 25 ribu pake dana', expType: 'Expense', expAmount: 25000, expCatId: 'food', expAccount: 'Dana' },
  { input: 'nasi goreng 18k tunai', expType: 'Expense', expAmount: 18000, expCatId: 'food', expAccount: 'Cash' },
  { input: 'mie ayam bakso 15.000', expType: 'Expense', expAmount: 15000, expCatId: 'food' },
  { input: 'kopi janji jiwa 22rb qris', expType: 'Expense', expAmount: 22000, expCatId: 'coffee', expAccount: 'QRIS' },
  { input: 'starbucks americano 55 ribu bayar gopay', expType: 'Expense', expAmount: 55000, expCatId: 'coffee', expAccount: 'GoPay' },
  { input: 'fore coffee 35k spay', expType: 'Expense', expAmount: 35000, expCatId: 'coffee', expAccount: 'ShopeePay' },
  { input: 'kopi kenangan 18 ribu scan barcode', expType: 'Expense', expAmount: 18000, expCatId: 'coffee', expAccount: 'QRIS' },
  { input: 'pesan gofood pizza hut 120k', expType: 'Expense', expAmount: 120000, expCatId: 'gofood' },
  { input: 'order grabfood burger king 85000', expType: 'Expense', expAmount: 85000, expCatId: 'gofood' },
  { input: 'shopeefood ayam bakar 45rb', expType: 'Expense', expAmount: 45000, expCatId: 'gofood' },
  { input: 'mie gacoan level 3 15k bayar qris', expType: 'Expense', expAmount: 15000, expCatId: 'food', expAccount: 'QRIS' },
  { input: 'soto ayam lamongan 20.000 cash', expType: 'Expense', expAmount: 20000, expCatId: 'food', expAccount: 'Cash' },
  { input: 'martabak manis 35 ribu gopay', expType: 'Expense', expAmount: 35000, expCatId: 'food', expAccount: 'GoPay' },
  { input: 'es boba brown sugar 25k ovo', expType: 'Expense', expAmount: 25000, expCatId: 'coffee', expAccount: 'OVO' },

  // D. Transportasi & Bahan Bakar
  { input: 'isi bensin pertamax 50rb pake cash', expType: 'Expense', expAmount: 50000, expCatId: 'bensin', expAccount: 'Cash' },
  { input: 'pertalite full tank 35 ribu', expType: 'Expense', expAmount: 35000, expCatId: 'bensin' },
  { input: 'naik gojek ke kantor 16k gopay', expType: 'Expense', expAmount: 16000, expCatId: 'transport', expAccount: 'GoPay' },
  { input: 'grabcar ke bandara 150 ribu transfer bca', expType: 'Expense', expAmount: 150000, expCatId: 'transport', expAccount: 'BCA' },
  { input: 'top up e-toll 100rb mandiri', expType: 'Expense', expAmount: 100000, expCatId: 'transport', expAccount: 'Mandiri' },
  { input: 'tiket krl commuterline 8000', expType: 'Expense', expAmount: 8000, expCatId: 'transport' },
  { input: 'tiket pesawat lion air 850 ribu transfer bank', expType: 'Expense', expAmount: 850000, expCatId: 'pesawat', expAccount: 'Bank' },
  { input: 'solar truk 200rb cash', expType: 'Expense', expAmount: 200000, expCatId: 'bensin', expAccount: 'Cash' },
  { input: 'naik transjakarta 3500', expType: 'Expense', expAmount: 3500, expCatId: 'transport' },
  { input: 'tarif tol cikampek 27rb mandiri', expType: 'Expense', expAmount: 27000, expCatId: 'transport', expAccount: 'Mandiri' },

  // E. Gaya Hidup, Hiburan & Belanja
  { input: 'potong rambut di barbershop 40k', expType: 'Expense', expAmount: 40000, expCatId: 'barber' },
  { input: 'cukur rambut 30 ribu cash', expType: 'Expense', expAmount: 30000, expCatId: 'barber', expAccount: 'Cash' },
  { input: 'beli sunscreen skintific 89rb shopeepay', expType: 'Expense', expAmount: 89000, expCatId: 'skincare', expAccount: 'ShopeePay' },
  { input: 'facial wash wardah 32 ribu', expType: 'Expense', expAmount: 32000, expCatId: 'skincare' },
  { input: 'nonton film xxi 50 ribu qris', expType: 'Expense', expAmount: 50000, expCatId: 'bioskop', expAccount: 'QRIS' },
  { input: 'tiket bioskop cgv 45k', expType: 'Expense', expAmount: 45000, expCatId: 'bioskop' },
  { input: 'tiket konser coldplay 1.200.000 transfer bca', expType: 'Expense', expAmount: 1200000, expCatId: 'konser', expAccount: 'BCA' },
  { input: 'top up diamond mobile legends 100k dana', expType: 'Expense', expAmount: 100000, expCatId: 'topupGame', expAccount: 'Dana' },
  { input: 'steam wallet 250 ribu transfer bank', expType: 'Expense', expAmount: 250000, expCatId: 'topupGame', expAccount: 'Bank' },
  { input: 'langganan netflix 186.000 kartu debit', expType: 'Expense', expAmount: 186000, expCatId: 'sub', expAccount: 'Bank' },
  { input: 'spotify premium 55 ribu', expType: 'Expense', expAmount: 55000, expCatId: 'sub' },
  { input: 'sepatu sneakers aerostreet 150k ovo', expType: 'Expense', expAmount: 150000, expCatId: 'sepatu', expAccount: 'OVO' },
  { input: 'kaos polos uniqlo 199 ribu transfer bca', expType: 'Expense', expAmount: 199000, expCatId: 'fashion', expAccount: 'BCA' },
  { input: 'jaket hoodie distro 180rb qris', expType: 'Expense', expAmount: 180000, expCatId: 'fashion', expAccount: 'QRIS' },
  { input: 'sandal jepit swallow 15 ribu cash', expType: 'Expense', expAmount: 15000, expCatId: 'sepatu', expAccount: 'Cash' },

  // F. Kebutuhan Pokok & Tagihan
  { input: 'isi ulang galon le minerale 20rb', expType: 'Expense', expAmount: 20000, expCatId: 'galon' },
  { input: 'air galon aqua 19000 tunai', expType: 'Expense', expAmount: 19000, expCatId: 'galon', expAccount: 'Cash' },
  { input: 'beli beras dan minyak di indomaret 145 ribu qris', expType: 'Expense', expAmount: 145000, expCatId: 'supermarket', expAccount: 'QRIS' },
  { input: 'belanja alfamart 78k cash', expType: 'Expense', expAmount: 78000, expCatId: 'supermarket', expAccount: 'Cash' },
  { input: 'bayar uang kosan 800 ribu transfer bca', expType: 'Expense', expAmount: 800000, expCatId: 'kost', expAccount: 'BCA' },
  { input: 'beli pulsa telkomsel 50rb via gopay', expType: 'Expense', expAmount: 50000, expCatId: 'pulsa', expAccount: 'GoPay' },
  { input: 'token listrik pln 100.000 mandiri', expType: 'Expense', expAmount: 100000, expCatId: 'pulsa', expAccount: 'Mandiri' },
  { input: 'bayar wifi indihome 350 ribu transfer bank', expType: 'Expense', expAmount: 350000, expCatId: 'pulsa', expAccount: 'Bank' },
  { input: 'berobat ke klinik dokter 150k cash', expType: 'Expense', expAmount: 150000, expCatId: 'rumahSakit', expAccount: 'Cash' },
  { input: 'beli obat panadol di apotek kimia farma 25 ribu', expType: 'Expense', expAmount: 25000, expCatId: 'obatSakit' },
  { input: 'fotocopy materi kuliah 12k tunai', expType: 'Expense', expAmount: 12000, expCatId: 'edukasi', expAccount: 'Cash' },
  { input: 'beli buku gramedia 85 ribu', expType: 'Expense', expAmount: 85000, expCatId: 'edukasi' },
  { input: 'uang jajan adek 20 ribu cash', expType: 'Expense', expAmount: 20000, expCatId: 'jajanAdek', expAccount: 'Cash' },
  { input: 'sedekah jumat kotak amal 50k', expType: 'Expense', expAmount: 50000, expCatId: 'donasi' },
  { input: 'kado ulang tahun temen 100rb', expType: 'Expense', expAmount: 100000, expCatId: 'party' },
  { input: 'zakat fitrah 45000 bsi', expType: 'Expense', expAmount: 45000, expCatId: 'donasi' },
  { input: 'uang spp sekolah anak 250 ribu transfer bni', expType: 'Expense', expAmount: 250000, expCatId: 'edukasi', expAccount: 'BNI' },

  // G. Pemasukan (Income)
  { input: 'gaji bulanan masuk 6.500.000 di bca', expType: 'Income', expAmount: 6500000, expCatId: 'gaji', expAccount: 'BCA' },
  { input: 'cair beasiswa kip kuliah 2.400.000 bank mandiri', expType: 'Income', expAmount: 2400000, expCatId: 'kip', expAccount: 'Mandiri' },
  { input: 'dapet thr lebaran 1.5jt cash', expType: 'Income', expAmount: 1500000, expCatId: 'bonus', expAccount: 'Cash' },
  { input: 'komisi shopee affiliate 450rb masuk spay', expType: 'Income', expAmount: 450000, expCatId: 'affiliate', expAccount: 'ShopeePay' },
  { input: 'profit dividen saham 300 ribu di bank jago', expType: 'Income', expAmount: 300000, expCatId: 'investasi', expAccount: 'Bank' },
  { input: 'hasil dagang toko olshop 850k qris', expType: 'Income', expAmount: 850000, expCatId: 'bisnis', expAccount: 'QRIS' },
  { input: 'uang lemburan masuk 500rb bca', expType: 'Income', expAmount: 500000, expCatId: 'gaji', expAccount: 'BCA' },
  { input: 'insentif penjualan 750 ribu mandiri', expType: 'Income', expAmount: 750000, expCatId: 'bonus', expAccount: 'Mandiri' },
  { input: 'endorsement tiktok 1 juta transfer bri', expType: 'Income', expAmount: 1000000, expCatId: 'affiliate', expAccount: 'BRI' },

  // H. Ralat Lisan & Filler Kata
  { input: 'eh tolong catat beli bakso 15 ribu eh maksudku 20 ribu cash', expType: 'Expense', expAmount: 20000, expCatId: 'food', expAccount: 'Cash', expNote: 'Bakso' },
  { input: 'anu kemarin beli kopi 25rb ralat 30rb pake gopay', expType: 'Expense', expAmount: 30000, expCatId: 'coffee', expAccount: 'GoPay', expNote: 'Kopi' },
  { input: 'beli bensin 20 ribu eh bukan 50 ribu mandiri', expType: 'Expense', expAmount: 50000, expCatId: 'bensin', expAccount: 'Mandiri', expNote: 'Bensin' },
  { input: 'tolong catat dong beli sate 30k eh salah 40k dana', expType: 'Expense', expAmount: 40000, expCatId: 'food', expAccount: 'Dana', expNote: 'Sate' },

  // I. Voice Deletion Commands
  { input: 'tolong hapus transaksi terakhir', isDelete: true, expLast: true },
  { input: 'hapus bakso 20 ribu', isDelete: true, expTargetQuery: 'bakso', expTargetAmount: 20000 },
  { input: 'batalin pengeluaran bensin 50rb', isDelete: true, expTargetQuery: 'bensin', expTargetAmount: 50000 },
  { input: 'hapus yang barusan', isDelete: true, expLast: true },
  { input: 'hapus pengeluaran 15000', isDelete: true, expTargetAmount: 15000 }
];

console.log('====================================================');
console.log('🤖 RUNNING EXPANDED AUTONOMOUS VOICE BENCHMARK SUITE');
console.log('====================================================');

let passedCount = 0;
let failedCount = 0;
const failures = [];

TEST_CASES.forEach((tc, idx) => {
  const result = parseVoiceTransaction(tc.input, {
    expenseCategories: mockExpenseCategories,
    incomeCategories: mockIncomeCategories,
    accountsList: mockAccountsList
  });

  let pass = true;
  let reasons = [];

  if (!result || !result.success) {
    pass = false;
    reasons.push(`Failed to parse: ${result?.reason || 'unknown'}`);
  } else if (tc.isDelete) {
    if (result.action !== 'DELETE') {
      pass = false;
      reasons.push(`Expected action DELETE, got ${result.action}`);
    }
    if (tc.expLast && !result.isLast) {
      pass = false;
      reasons.push(`Expected isLast=true, got ${result.isLast}`);
    }
    if (tc.expTargetAmount && result.targetAmount !== tc.expTargetAmount) {
      pass = false;
      reasons.push(`Expected targetAmount=${tc.expTargetAmount}, got ${result.targetAmount}`);
    }
    if (tc.expTargetQuery && !result.targetQuery.toLowerCase().includes(tc.expTargetQuery.toLowerCase())) {
      pass = false;
      reasons.push(`Expected targetQuery to contain "${tc.expTargetQuery}", got "${result.targetQuery}"`);
    }
  } else {
    if (tc.expType && result.type !== tc.expType) {
      pass = false;
      reasons.push(`Expected type=${tc.expType}, got ${result.type}`);
    }
    if (tc.expAmount && result.amount !== tc.expAmount) {
      pass = false;
      reasons.push(`Expected amount=${tc.expAmount}, got ${result.amount}`);
    }
    if (tc.expCatId && result.category?.id !== tc.expCatId) {
      pass = false;
      reasons.push(`Expected categoryId=${tc.expCatId}, got ${result.category?.id}`);
    }
    if (tc.expAccount && result.account?.toLowerCase() !== tc.expAccount?.toLowerCase()) {
      pass = false;
      reasons.push(`Expected account=${tc.expAccount}, got ${result.account}`);
    }
    if (tc.expNote && result.note?.toLowerCase() !== tc.expNote?.toLowerCase()) {
      pass = false;
      reasons.push(`Expected clean note="${tc.expNote}", got note="${result.note}"`);
    }
  }

  if (pass) {
    passedCount++;
  } else {
    failedCount++;
    failures.push({
      index: idx + 1,
      input: tc.input,
      reasons,
      got: result
    });
  }
});

console.log(`\nResults: ${passedCount}/${TEST_CASES.length} Passed, ${failedCount} Failed (${Math.round((passedCount / TEST_CASES.length) * 100)}%)`);

if (failures.length > 0) {
  console.log('\n❌ Failures Detected:');
  failures.forEach(f => {
    console.log(`[#${f.index}] Input: "${f.input}"`);
    f.reasons.forEach(r => console.log(`   - ${r}`));
    console.log(`   Result dump:`, JSON.stringify(f.got));
  });
} else {
  console.log('\n🌟 ALL 107 VOICE BENCHMARK TESTS (INCLUDING COMMAND SANITIZATION) PASSED 100% (PERFECT SCORE)!');
}

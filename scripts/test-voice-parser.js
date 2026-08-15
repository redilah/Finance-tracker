import { parseVoiceTransaction } from '../src/utils/voiceParser.js';

const testCases = [
  // 1. Perintah Hapus Suara (Voice Delete) dengan Tanda Baca & Noise STT
  {
    name: 'Hapus dengan titik di akhir',
    input: 'hapus bakwan.',
    expected: { action: 'DELETE', targetQuery: 'bakwan' }
  },
  {
    name: 'Hapus dengan tanda seru dan spasi',
    input: 'tolong hapus transaksi bakwan!',
    expected: { action: 'DELETE', targetQuery: 'bakwan' }
  },
  {
    name: 'Hapus dengan tanda tanya dan nominal',
    input: 'hapus bakwan 9 ribu?',
    expected: { action: 'DELETE', targetQuery: 'bakwan', targetAmount: 9000 }
  },
  {
    name: 'Hapus transaksi terakhir dengan titik',
    input: 'hapus transaksi terakhir.',
    expected: { action: 'DELETE', isLast: true }
  },
  {
    name: 'Batalkan barusan dengan titik',
    input: 'batalkan yang barusan.',
    expected: { action: 'DELETE', isLast: true }
  },
  {
    name: 'Hapus nominal saja dengan koma',
    input: 'hapus 20 ribu,',
    expected: { action: 'DELETE', targetAmount: 20000 }
  },
  {
    name: 'Hapus slang nominal',
    input: 'hapus ceban dong.',
    expected: { action: 'DELETE', targetAmount: 10000 }
  },
  {
    name: 'Hapus dengan awalan tolong',
    input: 'tolong hapus nasi padang 25 ribu.',
    expected: { action: 'DELETE', targetQuery: 'nasi padang', targetAmount: 25000 }
  },
  {
    name: 'Hapus dengan kata batalin',
    input: 'batalin kopi kenangan 22k!',
    expected: { action: 'DELETE', targetQuery: 'kopi kenangan', targetAmount: 22000 }
  },

  // 2. Ralat Lisan, Koreksi Spontan & Speech Disfluencies
  {
    name: 'Ralat dengan apa maksudku',
    input: 'apa maksudku bakwan pink 20 ribu',
    expected: { type: 'Expense', amount: 20000, note: 'Bakwan pink', categoryId: 'food' }
  },
  {
    name: 'Beli dengan apa maksudku',
    input: 'beli apa maksudku bakwan pink 20 ribu',
    expected: { type: 'Expense', amount: 20000, note: 'Bakwan pink', categoryId: 'food' }
  },
  {
    name: 'Ralat ganti item dan nominal',
    input: 'beli nasi goreng 15 ribu eh maksudku bakwan pink 20 ribu',
    expected: { type: 'Expense', amount: 20000, note: 'Bakwan pink', categoryId: 'food' }
  },
  {
    name: 'Ralat nominal saja',
    input: 'beli bakso 15 ribu maksudku 20 ribu',
    expected: { type: 'Expense', amount: 20000, note: 'Bakso', categoryId: 'food' }
  },
  {
    name: 'Ralat dengan bukan deng',
    input: 'kopi susu 15 ribu bukan deng kopi latte 25 ribu',
    expected: { type: 'Expense', amount: 25000, note: 'Kopi latte', categoryId: 'coffee' }
  },
  {
    name: 'Ralat dengan salah tadi',
    input: 'bensin 30 ribu salah tadi bensin pertamax 50 ribu',
    expected: { type: 'Expense', amount: 50000, note: 'Bensin pertamax', categoryId: 'bensin' }
  },
  {
    name: 'Ralat dengan ralat deh',
    input: 'beli martabak 30 ribu ralat deh 35 ribu',
    expected: { type: 'Expense', amount: 35000, note: 'Martabak', categoryId: 'food' }
  },
  {
    name: 'Ralat dengan gak jadi tapi',
    input: 'beli soto 15 ribu gak jadi tapi nasi padang 25 ribu',
    expected: { type: 'Expense', amount: 25000, note: 'Nasi padang', categoryId: 'food' }
  },
  {
    name: 'Filler apa namanya tuh',
    input: 'tolong catat beli apa namanya tuh mie ayam 18 ribu',
    expected: { type: 'Expense', amount: 18000, note: 'Mie ayam', categoryId: 'food' }
  },
  {
    name: 'Filler apa ya',
    input: 'apa ya nasi padang 25 ribu pake bca',
    expected: { type: 'Expense', amount: 25000, note: 'Nasi padang', account: 'Bank' }
  },
  {
    name: 'Filler tolong catatkan dong',
    input: 'tolong catatkan dong beli martabak manis 35 ribu',
    expected: { type: 'Expense', amount: 35000, note: 'Martabak manis', categoryId: 'food' }
  },
  {
    name: 'Filler gimana sih',
    input: 'beli apa sih namanya donat jco 60 ribu',
    expected: { type: 'Expense', amount: 60000, note: 'Donat jco', categoryId: 'food' }
  },
  {
    name: 'Filler bentar dulu',
    input: 'bentar dulu catat kopi susu 18 ribu',
    expected: { type: 'Expense', amount: 18000, note: 'Kopi susu', categoryId: 'coffee' }
  },

  // 3. Konversi Nominal Slang & Bahasa Gaul Indonesia
  {
    name: 'Slang goceng',
    input: 'beli es teh goceng',
    expected: { type: 'Expense', amount: 5000, categoryId: 'coffee' }
  },
  {
    name: 'Slang ceban',
    input: 'beli gorengan ceban',
    expected: { type: 'Expense', amount: 10000, categoryId: 'food' }
  },
  {
    name: 'Slang noban',
    input: 'beli bensin noban',
    expected: { type: 'Expense', amount: 20000, categoryId: 'bensin' }
  },
  {
    name: 'Slang goban',
    input: 'potong rambut goban pake cash',
    expected: { type: 'Expense', amount: 50000, categoryId: 'barber', account: 'Cash' }
  },
  {
    name: 'Slang pego',
    input: 'beli sepatu pego',
    expected: { type: 'Expense', amount: 150000, categoryId: 'sepatu' }
  },
  {
    name: 'Slang 1.5 juta',
    input: 'bayar kosan 1.5 juta via mandiri',
    expected: { type: 'Expense', amount: 1500000, categoryId: 'kost', account: 'Bank' }
  },
  {
    name: 'Slang 2.5 jt',
    input: 'beli tiket pesawat 2.5 jt',
    expected: { type: 'Expense', amount: 2500000, categoryId: 'pesawat' }
  },
  {
    name: 'Slang 2 setengah juta',
    input: 'gaji bulanan 2 setengah juta',
    expected: { type: 'Income', amount: 2500000, categoryId: 'gaji' }
  },
  {
    name: 'Slang setengah juta',
    input: 'dapat bonus setengah juta',
    expected: { type: 'Income', amount: 500000, categoryId: 'bonus' }
  },
  {
    name: 'Slang 500k',
    input: 'belanja bulanan di supermarket 500k',
    expected: { type: 'Expense', amount: 500000, categoryId: 'supermarket' }
  },
  {
    name: 'Slang 50k',
    input: 'top up mobile legends 50k pake gopay',
    expected: { type: 'Expense', amount: 50000, categoryId: 'topupGame', account: 'QRIS' }
  },
  {
    name: 'Slang 100rb',
    input: 'isi token listrik 100rb',
    expected: { type: 'Expense', amount: 100000, categoryId: 'pulsa' }
  },
  {
    name: 'Slang sejuta',
    input: 'gajian sejuta dari magang',
    expected: { type: 'Income', amount: 1000000, categoryId: 'gaji' }
  },

  // 4. Deteksi Multi-Akun & Rekening Bank / E-Wallet
  {
    name: 'Akun BCA',
    input: 'makan siang nasi padang 25 ribu transfer bca',
    expected: { amount: 25000, account: 'Bank' }
  },
  {
    name: 'Akun Mandiri Livin',
    input: 'bayar listrik 100 ribu pake livin',
    expected: { amount: 100000, account: 'Bank' }
  },
  {
    name: 'Akun BRI Brimo',
    input: 'beli kuota internet 50 ribu pake brimo',
    expected: { amount: 50000, account: 'Bank' }
  },
  {
    name: 'Akun Bank Jago',
    input: 'bayar langganan netflix 65 ribu pake jago',
    expected: { amount: 65000, account: 'Bank' }
  },
  {
    name: 'Akun SeaBank',
    input: 'beli baju 120 ribu pake seabank',
    expected: { amount: 120000, account: 'Bank' }
  },
  {
    name: 'Akun QRIS Scan',
    input: 'kopi janji jiwa 22 ribu scan qris',
    expected: { amount: 22000, account: 'QRIS' }
  },
  {
    name: 'Akun ShopeePay / Spay',
    input: 'beli skincare 85 ribu bayar spay',
    expected: { amount: 85000, account: 'QRIS' }
  },
  {
    name: 'Akun Dana',
    input: 'bayar pdam 45 ribu bayar dana',
    expected: { amount: 45000, account: 'QRIS' }
  },
  {
    name: 'Akun OVO',
    input: 'order grabfood 35 ribu bayar ovo',
    expected: { amount: 35000, account: 'QRIS' }
  },
  {
    name: 'Akun Cash Tunai',
    input: 'isi bensin pertalite 20 ribu tunai',
    expected: { amount: 20000, account: 'Cash' }
  },

  // 5. Pemasukan (Income Multi-Category)
  {
    name: 'Gaji Pokok',
    input: 'dapat gaji pokok 5 juta masuk rekening bca',
    expected: { type: 'Income', amount: 5000000, categoryId: 'gaji' }
  },
  {
    name: 'Bonus THR Lebaran',
    input: 'alhamdulillah cair thr 2 juta',
    expected: { type: 'Income', amount: 2000000, categoryId: 'bonus' }
  },
  {
    name: 'Insentif Penjualan',
    input: 'dapat insentif 400 ribu',
    expected: { type: 'Income', amount: 400000, categoryId: 'bonus' }
  },
  {
    name: 'Hasil Bisnis Jualan',
    input: 'orderan masuk hasil jualan toko 350 ribu',
    expected: { type: 'Income', amount: 350000, categoryId: 'bisnis' }
  },
  {
    name: 'Shopee Affiliate Komisi',
    input: 'komisi shopee affiliate cair 120 ribu',
    expected: { type: 'Income', amount: 120000, categoryId: 'affiliate' }
  },
  {
    name: 'Dana Beasiswa KIP',
    input: 'uang saku beasiswa kip kuliah masuk 700 ribu',
    expected: { type: 'Income', amount: 700000, categoryId: 'kip' }
  },
  {
    name: 'Dividen / Profit Saham',
    input: 'cair dividen saham 250 ribu ke rekening',
    expected: { type: 'Income', amount: 250000, categoryId: 'investasi' }
  },

  // 6. Pengeluaran Kategori Komprehensif (Expense Categories)
  {
    name: 'GoFood Makanan',
    input: 'pesen gofood ayam geprek 28 ribu',
    expected: { type: 'Expense', amount: 28000, categoryId: 'gofood' }
  },
  {
    name: 'GrabFood Delivery',
    input: 'order grabfood soto betawi 32 ribu',
    expected: { type: 'Expense', amount: 32000, categoryId: 'gofood' }
  },
  {
    name: 'Tiket Bioskop XXI',
    input: 'nonton film di xxi 50 ribu pake qris',
    expected: { type: 'Expense', amount: 50000, categoryId: 'bioskop' }
  },
  {
    name: 'Tiket Pesawat AirAsia',
    input: 'beli tiket pesawat airasia 850 ribu',
    expected: { type: 'Expense', amount: 850000, categoryId: 'pesawat' }
  },
  {
    name: 'Uang Jajan Adek',
    input: 'kasih uang jajan adek 20 ribu',
    expected: { type: 'Expense', amount: 20000, categoryId: 'jajanAdek' }
  },
  {
    name: 'Donasi Sedekah Subuh',
    input: 'sedekah subuh di kotak amal 15 ribu tunai',
    expected: { type: 'Expense', amount: 15000, categoryId: 'donasi' }
  },
  {
    name: 'Air Galon Le Minerale',
    input: 'beli air galon le minerale 20 ribu',
    expected: { type: 'Expense', amount: 20000, categoryId: 'galon' }
  },
  {
    name: 'Langganan Netflix',
    input: 'bayar langganan netflix 65 ribu',
    expected: { type: 'Expense', amount: 65000, categoryId: 'sub' }
  },
  {
    name: 'Obat di Apotek K24',
    input: 'beli tolak angin dan obat di apotek 30 ribu',
    expected: { type: 'Expense', amount: 30000, categoryId: 'obatSakit' }
  },
  {
    name: 'Periksa Dokter Gigi',
    input: 'periksa dokter tambal gigi di rumah sakit 180 ribu',
    expected: { type: 'Expense', amount: 180000, categoryId: 'rumahSakit' }
  },
  {
    name: 'Tiket Konser Musik',
    input: 'beli tiket konser coldplay 1.200.000',
    expected: { type: 'Expense', amount: 1200000, categoryId: 'konser' }
  },
  {
    name: 'Hadiah Kado Ultah Party',
    input: 'beli kado ulang tahun sahabat 100 ribu',
    expected: { type: 'Expense', amount: 100000, categoryId: 'party' }
  },
  {
    name: 'Cuci Sepatu Sneakers',
    input: 'cuci sepatu sneakers aerostreet 35 ribu',
    expected: { type: 'Expense', amount: 35000, categoryId: 'sepatu' }
  },
  {
    name: 'Edukasi Beli Buku Gramedia',
    input: 'beli buku novel di gramedia 85 ribu',
    expected: { type: 'Expense', amount: 85000, categoryId: 'edukasi' }
  },
  {
    name: 'Fashion Baju Kaos',
    input: 'thrifting beli baju kemeja di uniqlo 150 ribu',
    expected: { type: 'Expense', amount: 150000, categoryId: 'fashion' }
  }
];

function runTests() {
  let passed = 0;
  let failed = 0;
  console.log(`\n🚀 MENJALANKAN BENCHMARK VOICE PARSER TEST SUITE (${testCases.length} Test Cases)...\n`);

  for (const tc of testCases) {
    const res = parseVoiceTransaction(tc.input);

    let isMatch = true;
    const errors = [];

    if (tc.expected.action === 'DELETE') {
      if (res.action !== 'DELETE') {
        isMatch = false;
        errors.push(`Action expected DELETE but got ${res.action}`);
      }
      if (tc.expected.targetQuery !== undefined && res.targetQuery !== tc.expected.targetQuery) {
        isMatch = false;
        errors.push(`targetQuery expected "${tc.expected.targetQuery}" but got "${res.targetQuery}"`);
      }
      if (tc.expected.targetAmount !== undefined && res.targetAmount !== tc.expected.targetAmount) {
        isMatch = false;
        errors.push(`targetAmount expected ${tc.expected.targetAmount} but got ${res.targetAmount}`);
      }
      if (tc.expected.isLast !== undefined && res.isLast !== tc.expected.isLast) {
        isMatch = false;
        errors.push(`isLast expected ${tc.expected.isLast} but got ${res.isLast}`);
      }
    } else {
      if (tc.expected.type && res.type !== tc.expected.type) {
        isMatch = false;
        errors.push(`Type expected ${tc.expected.type} but got ${res.type}`);
      }
      if (tc.expected.amount && res.amount !== tc.expected.amount) {
        isMatch = false;
        errors.push(`Amount expected ${tc.expected.amount} but got ${res.amount}`);
      }
      if (tc.expected.note && res.note !== tc.expected.note) {
        isMatch = false;
        errors.push(`Note expected "${tc.expected.note}" but got "${res.note}"`);
      }
      if (tc.expected.categoryId && res.category?.id !== tc.expected.categoryId) {
        isMatch = false;
        errors.push(`CategoryId expected "${tc.expected.categoryId}" but got "${res.category?.id}"`);
      }
      if (tc.expected.account && res.account !== tc.expected.account) {
        isMatch = false;
        errors.push(`Account expected "${tc.expected.account}" but got "${res.account}"`);
      }
    }

    if (isMatch) {
      passed++;
      console.log(`✅ PASS: [${tc.name}] -> "${tc.input}"`);
    } else {
      failed++;
      console.log(`❌ FAIL: [${tc.name}] -> "${tc.input}"`);
      errors.forEach(e => console.log(`   └─ ${e}`));
    }
  }

  const score = ((passed / testCases.length) * 10).toFixed(1);
  console.log(`\n========================================`);
  console.log(`📊 HASIL AKHIR BENCHMARK:`);
  console.log(`Passed: ${passed} / ${testCases.length} (${((passed / testCases.length) * 100).toFixed(1)}%)`);
  console.log(`Failed: ${failed}`);
  console.log(`Score:  ${score} / 10.0`);
  console.log(`========================================\n`);

  return { passed, failed, score: parseFloat(score) };
}

runTests();

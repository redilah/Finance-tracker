import { parseVoiceTransaction } from '../src/utils/voiceParser.js';

const expenseCategories = [
  { id: 'food', name: 'Food' },
  { id: 'bioskop', name: 'Bioskop' },
  { id: 'transport', name: 'Transportasi' },
  { id: 'barber', name: 'Barbershop' },
  { id: 'skincare', name: 'Skincare' },
  { id: 'edukasi', name: 'Edukasi' },
  { id: 'galon', name: 'Air Galon' },
  { id: 'fashion', name: 'Fashion' },
  { id: 'supermarket', name: 'Supermarket' },
  { id: 'sub', name: 'Subscription' },
  { id: 'pesawat', name: 'Pesawat' },
  { id: 'kost', name: 'Kost' },
  { id: 'coffee', name: 'Coffee' },
  { id: 'gofood', name: 'GoFood' },
  { id: 'sepatu', name: 'Sepatu' },
  { id: 'donasi', name: 'Donasi' },
  { id: 'topupGame', name: 'Top Up Game' },
  { id: 'bensin', name: 'Bensin' },
  { id: 'konser', name: 'Konser' },
  { id: 'pulsa', name: 'Pulsa' },
  { id: 'rumahSakit', name: 'Rumah Sakit' },
  { id: 'obatSakit', name: 'Obat Sakit' },
  { id: 'jajanAdek', name: 'Jajan Adek' },
  { id: 'party', name: 'Party' },
  { id: 'buah', name: 'Buah' }
];

const incomeCategories = [
  { id: 'gaji', name: 'Gaji' },
  { id: 'bonus', name: 'Bonus' },
  { id: 'kip', name: 'KIP' },
  { id: 'investasi', name: 'Investasi' },
  { id: 'bisnis', name: 'Bisnis' },
  { id: 'affiliate', name: 'Affiliate' }
];

const accountsList = ['Cash', 'Bank', 'QRIS'];

const testCases = [
  {
    input: "Beli burger 65 ribu gofood pakai gopay",
    expected: { type: 'Expense', amount: 65000, categoryId: 'gofood', account: 'QRIS', note: 'Burger' }
  },
  {
    input: "Pesan gofood burger 65 ribu pakai gopay notenya burger",
    expected: { type: 'Expense', amount: 65000, categoryId: 'gofood', account: 'QRIS', note: 'Burger' }
  },
  {
    input: "Beli kopi 30 ribu eh maksudku bayar pulsa 50 ribu transfer BCA",
    expected: { type: 'Expense', amount: 50000, categoryId: 'pulsa', account: 'Bank' }
  },
  {
    input: "Beli ayam geprek 20 rb notnya ayam geprek pakai kris",
    expected: { type: 'Expense', amount: 20000, categoryId: 'food', account: 'QRIS', note: 'Ayam geprek' }
  },
  {
    input: "Beli ayam geprek 20 rb notenya ayam geprek pakai QRIS",
    expected: { type: 'Expense', amount: 20000, categoryId: 'food', account: 'QRIS', note: 'Ayam geprek' }
  },
  {
    input: "Beli kopi kenangan 25 ribu transfer BCA",
    expected: { type: 'Expense', amount: 25000, categoryId: 'coffee', account: 'Bank' }
  },
  {
    input: "Isi bensin gocap bayar kris",
    expected: { type: 'Expense', amount: 50000, categoryId: 'bensin', account: 'QRIS' }
  },
  {
    input: "Jajan cilok ceban tunai",
    expected: { type: 'Expense', amount: 10000, categoryId: 'food', account: 'Cash' }
  },
  {
    input: "Potong rambut pego mbanking mandiri",
    expected: { type: 'Expense', amount: 150000, categoryId: 'barber', account: 'Bank' }
  },
  {
    input: "Top up diamond mlbb 50k pakai gopay",
    expected: { type: 'Expense', amount: 50000, categoryId: 'topupGame', account: 'QRIS' }
  },
  {
    input: "Beli skincare serum skintific 150 ribu scan barcode",
    expected: { type: 'Expense', amount: 150000, categoryId: 'skincare', account: 'QRIS' }
  },
  {
    input: "Bayar uang kosan satu setengah juta transfer bca",
    expected: { type: 'Expense', amount: 1500000, categoryId: 'kost', account: 'Bank' }
  },
  {
    input: "Dapat gaji bulanan 5 juta masuk rekening mandiri",
    expected: { type: 'Income', amount: 5000000, categoryId: 'gaji', account: 'Bank' }
  },
  {
    input: "Cair bonus thr 2 juta transfer bca",
    expected: { type: 'Income', amount: 2000000, categoryId: 'bonus', account: 'Bank' }
  },
  {
    input: "Beli tiket bioskop xxi 45 ribu pakai shopeepay",
    expected: { type: 'Expense', amount: 45000, categoryId: 'bioskop', account: 'QRIS' }
  },
  {
    input: "Beli obat panadol goceng cash",
    expected: { type: 'Expense', amount: 5000, categoryId: 'obatSakit', account: 'Cash' }
  },
  {
    input: "Langganan netflix 186 ribu transfer bca",
    expected: { type: 'Expense', amount: 186000, categoryId: 'sub', account: 'Bank' }
  },
  {
    input: "Hapus pengeluaran burger",
    expected: { action: 'DELETE', targetQuery: 'burger', isLast: false }
  },
  {
    input: "Delete transaksi terakhir",
    expected: { action: 'DELETE', isLast: true }
  },
  {
    input: "Batalin yang barusan",
    expected: { action: 'DELETE', isLast: true }
  }
];

let passed = 0;
let failed = 0;

console.log("=== RUNNING VOICE PARSER AUTOMATED TEST SUITE ===\n");

testCases.forEach((tc, idx) => {
  const res = parseVoiceTransaction(tc.input, { expenseCategories, incomeCategories, accountsList });
  let match = true;
  const errors = [];

  if (tc.expected.action === 'DELETE') {
    if (res.action !== 'DELETE') {
      match = false;
      errors.push(`Action mismatch: got ${res.action}, expected DELETE`);
    }
    if (tc.expected.isLast !== undefined && res.isLast !== tc.expected.isLast) {
      match = false;
      errors.push(`isLast mismatch: got ${res.isLast}, expected ${tc.expected.isLast}`);
    }
    if (tc.expected.targetQuery && !res.targetQuery.includes(tc.expected.targetQuery)) {
      match = false;
      errors.push(`targetQuery mismatch: got "${res.targetQuery}", expected to include "${tc.expected.targetQuery}"`);
    }
  } else {
    if (res.type !== tc.expected.type) {
      match = false;
      errors.push(`Type mismatch: got ${res.type}, expected ${tc.expected.type}`);
    }
    if (res.amount !== tc.expected.amount) {
      match = false;
      errors.push(`Amount mismatch: got ${res.amount}, expected ${tc.expected.amount}`);
    }
    if (res.category?.id !== tc.expected.categoryId) {
      match = false;
      errors.push(`Category mismatch: got ${res.category?.id}, expected ${tc.expected.categoryId}`);
    }
    if (res.account !== tc.expected.account) {
      match = false;
      errors.push(`Account mismatch: got ${res.account}, expected ${tc.expected.account}`);
    }
    if (tc.expected.note && res.note !== tc.expected.note) {
      match = false;
      errors.push(`Note mismatch: got "${res.note}", expected "${tc.expected.note}"`);
    }
  }

  if (match) {
    passed++;
    console.log(`[PASS] Case #${idx + 1}: "${tc.input}"`);
    if (res.action === 'DELETE') {
      console.log(`       -> ACTION: DELETE | Target: "${res.targetQuery || 'terakhir'}" | isLast: ${res.isLast}`);
    } else {
      console.log(`       -> ${res.type} | Rp ${res.amount?.toLocaleString('id-ID')} | Cat: ${res.category?.name} | Acc: ${res.account} | Note: "${res.note}"`);
    }
  } else {
    failed++;
    console.log(`[FAIL] Case #${idx + 1}: "${tc.input}"`);
    errors.forEach(e => console.log(`       -> ERROR: ${e}`));
  }
});

console.log(`\n=== TEST SUMMARY: ${passed} PASSED, ${failed} FAILED ===`);
if (failed > 0) process.exit(1);

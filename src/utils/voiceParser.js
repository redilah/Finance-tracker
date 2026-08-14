import { findClosestMatch } from './fuzzyMatch.js';
import { getLearnedVocabulary } from './voiceLearner.js';

// 1. Kamus Konversi Nominal Gaul & Slang Indonesia (Urutan dari yang paling panjang ke pendek)
const SLANG_NUMBER_MAP = [
  { pattern: /\b(satu\s*setengah\s*juta|1\s*,\s*5\s*juta|1\.5\s*juta|1\s*,\s*5\s*jt|1\.5\s*jt|1\s*setengah\s*jt|1\s*setengah\s*juta)\b/gi, value: 1500000 },
  { pattern: /\b(dua\s*setengah\s*juta|2\s*,\s*5\s*juta|2\.5\s*juta|2\s*,\s*5\s*jt|2\.5\s*jt|2\s*setengah\s*jt|2\s*setengah\s*juta)\b/gi, value: 2500000 },
  { pattern: /\b(tiga\s*setengah\s*juta|3\s*,\s*5\s*juta|3\.5\s*juta|3\s*,\s*5\s*jt|3\.5\s*jt|3\s*setengah\s*jt|3\s*setengah\s*juta)\b/gi, value: 3500000 },
  { pattern: /\b(empat\s*setengah\s*juta|4\s*,\s*5\s*juta|4\.5\s*juta|4\s*,\s*5\s*jt|4\.5\s*jt)\b/gi, value: 4500000 },
  { pattern: /\b(lima\s*setengah\s*juta|5\s*,\s*5\s*juta|5\.5\s*juta|5\s*,\s*5\s*jt|5\.5\s*jt)\b/gi, value: 5500000 },
  { pattern: /\b(satu\s*koma\s*lima\s*juta|1\s*koma\s*5\s*juta|1\s*koma\s*5\s*jt)\b/gi, value: 1500000 },
  { pattern: /\b(dua\s*koma\s*lima\s*juta|2\s*koma\s*5\s*juta|2\s*koma\s*5\s*jt)\b/gi, value: 2500000 },
  { pattern: /\b(tiga\s*koma\s*lima\s*juta|3\s*koma\s*5\s*juta|3\s*koma\s*5\s*jt)\b/gi, value: 3500000 },
  { pattern: /\b(setengah\s*juta|setengah\s*jt)\b/gi, value: 500000 },
  { pattern: /\b(setengah\s*miliar|setengah\s*milyar)\b/gi, value: 500000000 },
  { pattern: /\b(sepuluh\s*juta|10\s*juta|10\s*jt)\b/gi, value: 10000000 },
  { pattern: /\b(sembilan\s*juta|9\s*juta|9\s*jt)\b/gi, value: 9000000 },
  { pattern: /\b(delapan\s*juta|8\s*juta|8\s*jt)\b/gi, value: 8000000 },
  { pattern: /\b(tujuh\s*juta|7\s*juta|7\s*jt)\b/gi, value: 7000000 },
  { pattern: /\b(enam\s*juta|6\s*juta|6\s*jt)\b/gi, value: 6000000 },
  { pattern: /\b(lima\s*juta|5\s*juta|5\s*jt)\b/gi, value: 5000000 },
  { pattern: /\b(empat\s*juta|4\s*juta|4\s*jt)\b/gi, value: 4000000 },
  { pattern: /\b(tiga\s*juta|3\s*juta|3\s*jt)\b/gi, value: 3000000 },
  { pattern: /\b(dua\s*juta|2\s*juta|2\s*jt)\b/gi, value: 2000000 },
  { pattern: /\b(satu\s*juta|se\s*juta|sejuta|1\s*juta|1\s*jt)\b/gi, value: 1000000 },
  { pattern: /\b(lima\s*ratus\s*ribu|500\s*ribu|500\s*rb|500k)\b/gi, value: 500000 },
  { pattern: /\b(dua\s*ratus\s*ribu|200\s*ribu|200\s*rb|200k)\b/gi, value: 200000 },
  { pattern: /\b(seratus\s*ribu|100\s*ribu|100\s*rb|100k|cepek\s*ceng)\b/gi, value: 100000 },
  { pattern: /\b(pego|pe\s*go|pekgo)\b/gi, value: 150000 },
  { pattern: /\b(goban|go\s*ban)\b/gi, value: 50000 },
  { pattern: /\b(gocap|go\s*cap)\b/gi, value: 50000 },
  { pattern: /\b(noban|no\s*ban)\b/gi, value: 20000 },
  { pattern: /\b(ceban|seban|ce\s*ban)\b/gi, value: 10000 },
  { pattern: /\b(goceng|go\s*ceng)\b/gi, value: 5000 },
  { pattern: /\b(noceng|no\s*ceng)\b/gi, value: 2000 },
  { pattern: /\b(seceng|sceng|se\s*ceng)\b/gi, value: 1000 },
  { pattern: /\b(gopek|go\s*pek)\b/gi, value: 500 },
  { pattern: /\b(cepek|sepek|ce\s*pek)\b/gi, value: 100 }
];

// 2. Kamus Penanda Koreksi / Ralat Spontan
const CORRECTION_MARKERS = [
  'eh maksudku', 'maksud aku', 'maksud saya', 'eh bukan', 'eh salah', 'ralat', 'bukan maksudnya', 'maksud gue', 'salah sebut'
];

// 2b. Kamus Kata Filler & Perintah Suara (Speech Fillers & Command Phrases)
const PHRASE_FILLERS = [
  'tolong tambahkan', 'tolong buatkan', 'tolong masukkan', 'tolong simpan', 'tolong input', 'tolong catat', 'tolong catatkan',
  'bantu tambahkan', 'bantu buatkan', 'bantu masukkan', 'bantu simpan', 'bantu input', 'bantu catat', 'bantu catatkan',
  'coba tambahkan', 'coba buatkan', 'coba masukkan', 'coba simpan', 'coba input', 'coba catat',
  'tambahkan dong', 'buatkan dong', 'masukkan dong', 'simpan dong', 'input dong', 'catat dong', 'tulis dong',
  'tambahkan ya', 'buatkan ya', 'masukkan ya', 'simpan ya', 'input ya', 'catat ya',
  'tambahkan transaksi', 'masukkan transaksi', 'catat transaksi', 'simpan transaksi', 'buat transaksi',
  'apa ya', 'apa itu ya', 'ini apa ya', 'gimana ya',
  'oh iya', 'oh ya', 'bentar ya',
  'bentar', 'tunggu dulu', 'tunggu sebentar', 'apa namanya', 'pokoknya'
];

const SINGLE_FILLERS = [
  'eh', 'ee', 'eee', 'aa', 'aaa', 'oh', 'ohh', 'hmm', 'hm', 'em', 'eu', 'euh', 'anu', 'apaan', 'nah', 'uh'
];

// 3. Kamus Kategori Komprehensif (24 Expense + 6 Income)
export const EXPENSE_CATEGORY_KEYWORDS = {
  food: [
    'nasi padang', 'ayam geprek', 'ayam goreng', 'ayam bakar', 'nasi goreng', 'mie ayam', 'mie instan',
    'bubur ayam', 'pecel lele', 'ikan bakar', 'mie gacoan', 'rujak buah', 'rujak pepaya', 'rujak mentimun', 'rujak',
    'makan siang', 'makan malam', 'makan', 'sarapan', 'maksi', 'dinner', 'nasi', 'geprek', 'bakso', 'mie', 'indomie',
    'soto', 'sate', 'rawon', 'gule', 'bubur', 'martabak', 'gorengan', 'tahu', 'tempe', 'seblak', 'cilok', 'cireng',
    'batagor', 'siomay', 'warteg', 'angkringan', 'kantin', 'seafood', 'burger', 'mcd', 'mekdi', 'kfc', 'hokben',
    'gacoan', 'pizza', 'pasta', 'ramen', 'sushi', 'roti', 'kue', 'donat', 'jco', 'snack', 'cemilan',
    'jajan', 'kuliner', 'bebek'
  ],
  coffee: [
    'kopi kenangan', 'janji jiwa', 'point coffee', 'kopi susu', 'starbucks', 'espresso',
    'cappuccino', 'americano', 'tomoro', 'chatime', 'es teh', 'esteh', 'ngopi', 'coffee', 'kopsu',
    'latte', 'sbux', 'kenangan', 'fore', 'kulo', 'cafe', 'kafe', 'tongkrongan', 'boba', 'teh', 'kopi'
  ],
  gofood: [
    'gofood', 'go food', 'grabfood', 'grab food', 'shopeefood', 'shopee food', 'pesan antar',
    'delivery makanan', 'pesen gofood', 'order gofood', 'order grabfood'
  ],
  transport: [
    'commuterline', 'transjakarta', 'bensin grab', 'bluebird', 'maxim', 'indrive', 'taksi', 'taxi',
    'angkot', 'busway', 'kereta', 'parkir', 'e-toll', 'etoll', 'ongkos', 'goride', 'gocar', 'grabride',
    'grabcar', 'ojek', 'ojol', 'gojek', 'grab', 'bus', 'krl', 'mrt', 'lrt', 'tol', 'tarif'
  ],
  bioskop: [
    'nonton film', 'tiket bioskop', 'popcorn bioskop', 'cinepolis', 'premiere', 'bioskop', 'nonton',
    'cinema', 'xxi', 'cgv', 'imax', 'film'
  ],
  barber: [
    'barbershop', 'potong rambut', 'pangkas rambut', 'cukur jenggot', 'creambath', 'styling rambut',
    'haircut', 'barber', 'cukur rambut', 'cukur', 'salon', 'pomade'
  ],
  skincare: [
    'sabun cuci muka', 'facial wash', 'body lotion', 'sabun mandi', 'masker wajah', 'skintific',
    'skin tv', 'skintipik', 'skintifik', 'somethinc', 'the originote', 'originote', 'scarlett',
    'skin care', 'kosmetik', 'make up', 'makeup', 'serum', 'toner', 'moisturizer', 'sunscreen',
    'lipstik', 'bedak', 'parfum', 'perfume', 'shampoo', 'deodorant', 'wardah', 'skincare'
  ],
  edukasi: [
    'alat tulis', 'sertifikasi', 'pelatihan', 'semester', 'fotocopy', 'bootcamp',
    'gramedia', 'kursus', 'bimbel', 'webinar', 'seminar', 'kuliah', 'sekolah', 'pulpen', 'ujian',
    'buku', 'novel', 'komik', 'les', 'spp', 'ukt', 'print', 'udemy'
  ],
  galon: [
    'air galon', 'aqua galon', 'isi ulang air', 'isi ulang galon', 'air minum', 'le minerale', 'air isi ulang',
    'refill galon', 'galon', 'cleo', 'vit'
  ],
  fashion: [
    'ikat pinggang', 'kaos kaki', 'thrifting', 'pakaian', 'celana', 'sweater', 'kerudung', 'distro',
    'thrift', 'uniqlo', 'erigo', 'baju', 'kaos', 'kemeja', 'jeans', 'jaket', 'hoodie', 'jas',
    'rok', 'dress', 'gamis', 'hijab', 'jilbab', 'topi', 'sabuk', 'zara', 'h&m'
  ],
  supermarket: [
    'belanja bulanan', 'minyak goreng', 'belanjaan rumah', 'supermarket', 'minimarket', 'indomaret',
    'alfamart', 'alfamidi', 'superindo', 'hypermart', 'transmart', 'sabun cuci', 'deterjen',
    'pewangi', 'sembako', 'lotte', 'beras', 'gula', 'telur', 'tissue', 'tisu'
  ],
  sub: [
    'youtube premium', 'yt premium', 'prime video', 'apple music', 'google one', 'member gym',
    'subscription', 'membership', 'netflix', 'spotify', 'disney+', 'disney', 'chatgpt', 'icloud',
    'canva', 'hbo', 'langganan', 'sub'
  ],
  pesawat: [
    'tiket pesawat', 'super air jet', 'lion air', 'citilink', 'airasia', 'batik air', 'penerbangan',
    'boarding', 'bandara', 'airport', 'pesawat', 'garuda', 'bagasi'
  ],
  kost: [
    'uang kosan', 'uang kost', 'bayar kosan', 'bayar kost', 'sewa kontrakan', 'sewa rumah',
    'sewa kamar', 'iuran kost', 'sewa apartemen', 'listrik kost', 'kosan', 'kostan', 'kontrakan',
    'apartemen', 'kost', 'kos'
  ],
  sepatu: [
    'sepatu lari', 'sepatu kerja', 'cuci sepatu', 'sepatu sneakers', 'aerostreet', 'pantofel', 'sneakers', 'converse',
    'compass', 'ventela', 'sepatu', 'sandal', 'boots', 'nike', 'adidas', 'vans'
  ],
  donasi: [
    'zakat fitrah', 'zakat maal', 'kotak amal', 'santunan', 'sedekah', 'kitabisa', 'bantuan',
    'donasi', 'infaq', 'infak', 'zakat', 'amal', 'sumbangan', 'pengamen'
  ],
  topupGame: [
    'mobile legends', 'free fire', 'steam wallet', 'voucher game', 'playstation', 'game pass',
    'skin game', 'top up', 'topup', 'diamond', 'mlbb', 'ff', 'pubg', 'genshin', 'valorant', 'steam', 'ps plus'
  ],
  bensin: [
    'pertamax turbo', 'isi bensin', 'full tank', 'pertalite', 'pertamax', 'pertamina', 'bensin',
    'solar', 'dexlite', 'spbu', 'shell', 'bp', 'vivo'
  ],
  konser: [
    'festival musik', 'tiket konser', 'live music', 'tiket festival', 'soundrenaline', 'synchronize',
    'tiket acara', 'konser', 'dwp', 'coldplay', 'gig'
  ],
  pulsa: [
    'kuota internet', 'token listrik', 'tagihan wifi', 'first media', 'paket data', 'listrik pln',
    'telkomsel', 'smartfren', 'indihome', 'pulsa', 'kuota', 'indosat', 'biznet', 'pdam', 'xl', 'tri', 'byu'
  ],
  rumahSakit: [
    'rawat inap', 'periksa dokter', 'tambal gigi', 'dokter gigi', 'rumah sakit', 'tes darah',
    'biaya lab', 'spesialis', 'puskesmas', 'rontgen', 'klinik', 'opname', 'dokter', 'rs', 'ugd'
  ],
  obatSakit: [
    'minyak kayu putih', 'kimia farma', 'resep dokter', 'tolak angin', 'paracetamol', 'panadol',
    'suplemen', 'betadine', 'promag', 'bodrex', 'vitamin', 'apotek', 'obat', 'k24', 'perban'
  ],
  jajanAdek: [
    'uang jajan adik', 'uang saku adek', 'uang jajan adek', 'uang jajan anak', 'jajanan adek',
    'jajan adek', 'jajan adik', 'jajan anak', 'saku adek', 'adek', 'adik'
  ],
  party: [
    'hadiah ultah', 'kado ulang tahun', 'ulang tahun', 'traktiran', 'perayaan', 'pesta', 'party', 'ultah', 'kado',
    'traktir', 'arisan', 'bukber', 'reuni', 'karaoke'
  ]
};

export const INCOME_CATEGORY_KEYWORDS = {
  gaji: [
    'gaji pokok', 'uang lembur', 'gaji bulanan', 'lemburan', 'gajian', 'salary', 'payroll', 'gaji', 'upah', 'honor'
  ],
  bonus: [
    'insentif penjualan', 'insentif', 'uang kaget', 'thr lebaran', 'tunjangan', 'hadiah', 'angpao', 'bonus', 'thr', 'reward', 'tip'
  ],
  kip: [
    'uang saku beasiswa', 'bantuan kuliah', 'dana beasiswa', 'kip kuliah', 'beasiswa', 'kip', 'lpdp'
  ],
  investasi: [
    'capital gain', 'hasil investasi', 'profit trading', 'cuan saham', 'reksadana', 'bunga bank',
    'dividen', 'bunga', 'saham', 'crypto', 'bitcoin', 'deposito'
  ],
  bisnis: [
    'pelanggan bayar', 'orderan masuk', 'hasil jualan', 'hasil dagang', 'penjualan toko', 'penjualan olshop', 'penjualan barang',
    'bisnis', 'jualan', 'omset', 'laba', 'profit', 'toko', 'olshop'
  ],
  affiliate: [
    'shopee affiliate', 'tiktok affiliate', 'paid promote', 'affiliate', 'afiliasi', 'komisi',
    'referral', 'endorse', 'endorsement'
  ]
};

// 4. Kamus Akun / Metode Pembayaran
const ACCOUNT_KEYWORDS = {
  'Cash': ['uang tunai', 'uang fisik', 'bayar pas', 'kontan', 'cash', 'tunai'],
  'Bank': [
    'mobile banking', 'kartu debit', 'cimb niaga', 'bca mobile', 'bank jago', 'sea bank',
    'klikbca', 'rekening mandiri', 'rekening sendiri', 'rekening', 'mandiri', 'mbanking', 'm-banking',
    'debit', 'transfer', 'livin', 'brimo', 'jago', 'seabank', 'bank', 'bca', 'bni', 'bri', 'cimb', 'blu', 'neo', 'permata', 'bsi'
  ],
  'QRIS': [
    'scan barcode', 'shopee pay', 'shopeepay', 'linkaja', 'astrapay', 'go-pay', 'isaku',
    'barcode', 'q ris', 'q-ris', 'qris', 'kris', 'keris', 'cris', 'scan', 'gopay', 'ovo', 'dana', 'spay'
  ]
};

// Aliases Akun Pengguna untuk pencocokan nama akun
const ACCOUNT_SYNONYMS = {
  'shopeepay': 'ShopeePay',
  'spay': 'ShopeePay',
  'shopee pay': 'ShopeePay',
  'gopay': 'GoPay',
  'go-pay': 'GoPay',
  'ovo': 'OVO',
  'dana': 'Dana',
  'bca': 'BCA',
  'mandiri': 'Mandiri',
  'bri': 'BRI',
  'bni': 'BNI',
  'jago': 'Bank',
  'cash': 'Cash',
  'tunai': 'Cash',
  'qris': 'QRIS'
};

// 5. Penanda Catatan (Note Boundaries & Typo Suara)
const NOTE_MARKERS = [
  'dengan catatan', 'dengan keterangan', 'catatannya', 'catetannya', 'catatan', 'catetan', 'catat',
  'notenya', 'note nya', 'notnya', 'not nya', 'not e', 'note', 'not', 'keterangannya', 'keterangan', 'alasannya', 'alasan'
];

// 6. Kata Hubung, Kata Kerja & Istilah Perintah Umum (Dibersihkan secara mutlak agar judul note murni item/keperluan)
export const CONNECTING_WORDS = [
  // A. Kata Perintah & Interaksi Suara (Voice Command Verbs & Prefixes)
  'tambahkan', 'tambah', 'masukkan', 'masukan', 'input', 'tuliskan', 'tulis', 'buatkan', 'buat',
  'simpanlah', 'simpan', 'isikan', 'isikanlah', 'catatkan', 'catat', 'rekam', 'inputkan', 'add', 'create', 'save', 'insert',
  'bantu', 'tolong', 'coba', 'silakan', 'silahkan', 'mohon', 'minta',

  // B. Kata Ganti Orang & Waktu
  'aku', 'saya', 'gue', 'gw', 'kami', 'kita', 'dia', 'nanti', 'tadi', 'kemarin', 'hari ini', 'mau', 'ini', 'itu',
  'lapar', 'laper', 'kenyang', 'haus', 'banget', 'terus', 'lalu', 'kemudian',

  // C. Kata Aksi Finansial & Transaksi
  'dengan', 'pake', 'pakai', 'harga', 'harganya', 'beli', 'membeli', 'bayar', 'membayar', 'terbayar',
  'isi', 'ngisi', 'mengisi', 'pesan', 'pesen', 'order', 'pesan antar', 'delivery',
  'belanja', 'tiket', 'kategori', 'transaksi', 'pengeluaran', 'pemasukan', 'biaya', 'ongkos', 'tarif',

  // D. Delivery Platform & Pembayaran
  'gofood', 'go-food', 'go food', 'grabfood', 'grab-food', 'grab food', 'shopeefood', 'shopee-food', 'shopee food',
  'scan', 'barcode', 'scan barcode', 'transfer', 'tf', 'debit', 'rekening', 'qris', 'kris', 'keris', 'cash', 'tunai', 'mbanking', 'm-banking',
  'bca', 'mandiri', 'bri', 'bni', 'gopay', 'ovo', 'dana', 'shopeepay', 'spay',

  // E. Preposisi & Partikel Kalimat
  'dari', 'ke', 'di', 'pada', 'yang', 'yg', 'udah', 'sudah', 'dong', 'deh', 'nih', 'ya', 'kan', 'ada',
  'buat', 'untuk', 'sebesar', 'senilai', 'nominal', 'sejumlah', 'uang', 'keluar', 'masuk', 'terima', 'dapat', 'dapet', 'oleh',
  'enggak', 'nggak', 'ngga', 'gak', 'ga'
];

/**
 * Main Voice Parser Function
 */
export function parseVoiceTransaction(rawText, { expenseCategories, incomeCategories, accountsList } = {}) {
  if (!rawText || typeof rawText !== 'string') {
    return { success: false, reason: 'empty_text' };
  }

  let text = rawText.toLowerCase().trim();

  // Simpan teks asli sebelum pemotongan ralat untuk ekstraksi kategori & konteks
  const preRalatText = text;

  // 0. Deteksi Perintah Hapus (Voice-Command Delete)
  const DELETE_KEYWORDS = [
    'tolong hapus', 'bantu hapus', 'coba hapus', 'hapusin', 'hapus dong', 'hapus deh',
    'hapus', 'delete', 'batalin', 'batalkan', 'cancel', 'buang', 'hilangkan', 'hapus transaksi'
  ];
  const LAST_KEYWORDS = [
    'terakhir dibuat', 'paling terakhir', 'yang terakhir', 'yg terakhir',
    'yang barusan', 'yg barusan', 'barusan', 'terbaru', 'terakhir',
    'yang tadi', 'yg tadi', 'tadi'
  ];

  const isDeleteIntent = DELETE_KEYWORDS.some(kw => text.includes(kw));
  if (isDeleteIntent) {
    const isLast = LAST_KEYWORDS.some(kw => text.includes(kw));

    let deleteText = text;
    for (const item of SLANG_NUMBER_MAP) {
      deleteText = deleteText.replace(item.pattern, ` ${item.value} `);
    }

    const deleteAmountRegex = /(?:rp\s*)?(\d{1,3}(?:\.\d{3})+(?:,\d+)?|\d+(?:[.,]\d+)?)\s*(ribu|rb|rebu|k|juta|jt|miliar|milyar)?(?!\w)/gi;
    const amountMatches = [...deleteText.matchAll(deleteAmountRegex)].filter(m => m[0].trim().length > 0);

    let targetAmount = null;
    if (amountMatches.length > 0) {
      const lastMatch = amountMatches[amountMatches.length - 1];
      let numStr = lastMatch[1];
      let rawNumber = 0;
      if (numStr.includes('.')) {
        rawNumber = parseFloat(numStr.replace(/\./g, ''));
      } else {
        rawNumber = parseFloat(numStr.replace(',', '.'));
      }
      const unit = (lastMatch[2] || '').toLowerCase();
      if (unit === 'ribu' || unit === 'rb' || unit === 'rebu' || unit === 'k') {
        rawNumber *= 1000;
      } else if (unit === 'juta' || unit === 'jt') {
        rawNumber *= 1000000;
      } else if (unit === 'miliar' || unit === 'milyar') {
        rawNumber *= 1000000000;
      }
      targetAmount = Math.round(rawNumber);

      const matchIdx = deleteText.lastIndexOf(lastMatch[0]);
      if (matchIdx !== -1) {
        deleteText = deleteText.substring(0, matchIdx) + ' ' + deleteText.substring(matchIdx + lastMatch[0].length);
      }
    }

    let queryText = deleteText;
    DELETE_KEYWORDS.forEach(kw => { queryText = queryText.split(kw).join(' '); });
    [
      'transaksi', 'pengeluaran', 'pemasukan', 'catatan', 'nota', 'item', 'yang', 'ini', 'itu',
      'dong', 'deh', 'tolong', 'bantu', 'coba', 'harganya', 'harga', 'sebesar', 'senilai',
      'rp', 'rupiah', 'buat', 'untuk'
    ].forEach(w => {
      queryText = queryText.split(new RegExp(`\\b${w}\\b`, 'gi')).join(' ');
    });
    LAST_KEYWORDS.forEach(kw => { queryText = queryText.split(kw).join(' '); });

    const targetQuery = queryText.replace(/\s+/g, ' ').trim();

    return {
      success: true,
      action: 'DELETE',
      isLast: isLast || (!targetQuery && !targetAmount),
      targetQuery: targetQuery || '',
      targetAmount: targetAmount || null,
      rawText
    };
  }

  // 0b. Deteksi Koreksi / Ralat Spontan (Buang kalimat yang salah sebelum kata ralat)
  let detectedCorrectionMarker = null;
  let preCorrectionText = '';
  for (const marker of CORRECTION_MARKERS) {
    const idx = text.lastIndexOf(marker);
    if (idx !== -1) {
      detectedCorrectionMarker = marker;
      preCorrectionText = text.substring(0, idx).trim();
      text = text.substring(idx + marker.length).trim();
      break;
    }
  }

  // A. Hapus Filler Frasa & Kata Tunggal
  PHRASE_FILLERS.forEach(phrase => {
    text = text.split(phrase).join(' ');
  });

  let tokens = text.split(/\s+/).filter(Boolean);
  tokens = tokens.filter(t => !SINGLE_FILLERS.includes(t));
  text = tokens.join(' ');

  // B. Konversi Nominal Slang & Bahasa Gaul
  for (const item of SLANG_NUMBER_MAP) {
    text = text.replace(item.pattern, ` ${item.value} `);
  }

  // C. Ekstraksi Nominal (Mendukung format angka bertitik seperti 1.200.000, 50.000 atau desimal 2.5jt)
  const amountRegex = /(?:rp\s*)?(\d{1,3}(?:\.\d{3})+(?:,\d+)?|\d+(?:[.,]\d+)?)\s*(ribu|rb|rebu|k|juta|jt|miliar|milyar)?(?!\w)/gi;
  const amountMatches = [...text.matchAll(amountRegex)].filter(m => m[0].trim().length > 0);

  if (amountMatches.length === 0) {
    return { success: false, reason: 'amount_not_found', text };
  }

  // Ambil match nominal terakhir (strategi koreksi ucapan)
  const lastAmountMatch = amountMatches[amountMatches.length - 1];
  let numStr = lastAmountMatch[1];
  let rawNumber = 0;
  if (numStr.includes('.')) {
    rawNumber = parseFloat(numStr.replace(/\./g, ''));
  } else {
    rawNumber = parseFloat(numStr.replace(',', '.'));
  }
  const unit = (lastAmountMatch[2] || '').toLowerCase();

  if (unit === 'ribu' || unit === 'rb' || unit === 'rebu' || unit === 'k') {
    rawNumber *= 1000;
  } else if (unit === 'juta' || unit === 'jt') {
    rawNumber *= 1000000;
  } else if (unit === 'miliar' || unit === 'milyar') {
    rawNumber *= 1000000000;
  }

  const amount = Math.round(rawNumber);
  const matchedAmountStr = lastAmountMatch[0];

  // Hapus nominal dari text
  const amountIdx = text.lastIndexOf(matchedAmountStr);
  if (amountIdx !== -1) {
    text = text.substring(0, amountIdx) + ' ' + text.substring(amountIdx + matchedAmountStr.length);
  }

  // D. Deteksi Income vs Expense Sinyal
  const INCOME_SIGNALS = [
    'dapat', 'dapet', 'terima', 'gajian', 'gaji', 'salary', 'payroll', 'upah', 'honor',
    'cair', 'masuk uang', 'transferan masuk', 'uang masuk', 'pemasukan', 'penghasilan',
    'dikirimi', 'ditransfer', 'dapat uang', 'dapat gaji', 'laba', 'profit', 'dividen',
    'komisi', 'cuan', 'bonus', 'thr', 'tunjangan', 'angpao', 'hadiah', 'uang kaget',
    'beasiswa', 'kip', 'lpdp', 'affiliate', 'afiliasi', 'endorse', 'hasil jualan', 'omset', 'omzet'
  ];

  // E. Deteksi Akun / Metode Pembayaran (Prioritas Nama Akun Pengguna / Spesifik)
  let account = 'Cash';
  let latestAccountIndex = -1;
  let accountMatchedWord = '';

  // 1. Cek Akun Kustom / Daftar Akun Pengguna DULUAN (BCA, Mandiri, GoPay, OVO, Dana, ShopeePay, BRI, BNI, dll)
  if (accountsList && Array.isArray(accountsList)) {
    for (const customAcc of accountsList) {
      const kw = customAcc.toLowerCase();
      const testWords = [kw];
      for (const [syn, mappedAcc] of Object.entries(ACCOUNT_SYNONYMS)) {
        if (mappedAcc.toLowerCase() === kw) {
          testWords.push(syn);
        }
      }

      for (const tw of testWords) {
        const regex = new RegExp(`\\b${tw}\\b`, 'i');
        const match = text.match(regex);
        if (match) {
          const idx = text.lastIndexOf(match[0]);
          if (idx !== -1 && idx >= latestAccountIndex) {
            latestAccountIndex = idx;
            account = customAcc;
            accountMatchedWord = match[0];
          }
        }
      }
    }
  }

  // 2. Jika belum cocok dengan akun spesifik, cek Akun Standar (Cash, Bank, QRIS)
  if (latestAccountIndex === -1) {
    for (const accType of Object.keys(ACCOUNT_KEYWORDS)) {
      const keywords = ACCOUNT_KEYWORDS[accType];
      for (const kw of keywords) {
        const regex = new RegExp(`\\b${kw}\\b`, 'i');
        const match = text.match(regex);
        if (match) {
          const idx = text.lastIndexOf(match[0]);
          if (idx !== -1 && idx >= latestAccountIndex) {
            latestAccountIndex = idx;
            account = accType;
            accountMatchedWord = match[0];
          }
        }
      }
    }
  }

  // F. Cek Apakah Ada Explicit Note Marker
  let explicitNote = '';
  let noteMarkerFound = false;

  for (const marker of NOTE_MARKERS) {
    const idx = text.indexOf(marker);
    if (idx !== -1) {
      let candidate = text.substring(idx + marker.length).trim();
      if (accountMatchedWord && candidate.includes(accountMatchedWord)) {
        candidate = candidate.replace(accountMatchedWord, ' ').trim();
      }
      explicitNote = candidate;
      text = text.substring(0, idx).trim();
      noteMarkerFound = true;
      break;
    }
  }

  // Hapus kata akun dari sisa text agar note bersih
  if (latestAccountIndex !== -1 && accountMatchedWord) {
    text = text.replace(new RegExp(`\\b${accountMatchedWord}\\b`, 'gi'), ' ');
  }

  // G. Deteksi Tipe (Income vs Expense) & Kategori Secara Menyeluruh
  const fullContextText = `${text} ${preRalatText}`;
  let isIncome = INCOME_SIGNALS.some(sig => fullContextText.includes(sig));

  // Cek apakah ada kecocokan eksplisit pada kategori Income
  let matchedIncomeCatId = null;
  let latestIncomeIdx = -1;
  let incomeMatchedWord = '';

  const sortedIncomeCatKeys = Object.keys(INCOME_CATEGORY_KEYWORDS).sort((a, b) => {
    return (INCOME_CATEGORY_KEYWORDS[b][0]?.length || 0) - (INCOME_CATEGORY_KEYWORDS[a][0]?.length || 0);
  });

  for (const catId of sortedIncomeCatKeys) {
    const keywords = INCOME_CATEGORY_KEYWORDS[catId];
    for (const kw of keywords) {
      const regex = new RegExp(`\\b${kw}\\b`, 'i');
      if (regex.test(text)) {
        const idx = text.lastIndexOf(kw);
        if (idx !== -1 && idx > latestIncomeIdx) {
          latestIncomeIdx = idx;
          matchedIncomeCatId = catId;
          incomeMatchedWord = kw;
        }
      } else if (regex.test(preRalatText) && latestIncomeIdx === -1) {
        matchedIncomeCatId = catId;
        incomeMatchedWord = kw;
      }
    }
  }

  // Cek apakah ada kecocokan eksplisit pada kategori Expense
  let matchedExpenseCatId = null;
  let latestExpenseIdx = -1;
  let expenseMatchedWord = '';

  // Prioritas khusus 1: Makanan Pokok Spesifik (Nasi Padang, Bakso, Seblak, Ayam, Soto, Mie, Rujak)
  if (/\b(nasi padang|ayam geprek|ayam goreng|nasi goreng|mie ayam|mie gacoan|bakso|soto|sate|rawon|seblak|rujak)\b/i.test(fullContextText)) {
    matchedExpenseCatId = 'food';
    latestExpenseIdx = 9500;
    expenseMatchedWord = 'food';
  } else if (/\b(gofood|go[- ]*food|grabfood|grab[- ]*food|shopeefood|shopee[- ]*food|pesan\s*antar)\b/i.test(fullContextText)) {
    // Prioritas khusus 2: GoFood / GrabFood / ShopeeFood
    matchedExpenseCatId = 'gofood';
    latestExpenseIdx = 9999;
    expenseMatchedWord = 'gofood';
  } else if (/\b(grabcar|goride|gocar|grabride|transjakarta|commuterline|krl|mrt|lrt|e-toll|etoll|angkot|busway)\b/i.test(fullContextText)) {
    // Prioritas khusus 3: Transportasi
    matchedExpenseCatId = 'transport';
    latestExpenseIdx = 9000;
    expenseMatchedWord = 'transport';
  } else if (/\b(barbershop|pangkas rambut|potong rambut|cukur rambut|cukur jenggot)\b/i.test(fullContextText)) {
    // Prioritas khusus 4: Barber
    matchedExpenseCatId = 'barber';
    latestExpenseIdx = 9000;
    expenseMatchedWord = 'barbershop';
  } else {
    const sortedExpenseCatKeys = Object.keys(EXPENSE_CATEGORY_KEYWORDS).sort((a, b) => {
      return (EXPENSE_CATEGORY_KEYWORDS[b][0]?.length || 0) - (EXPENSE_CATEGORY_KEYWORDS[a][0]?.length || 0);
    });

    for (const catId of sortedExpenseCatKeys) {
      const keywords = EXPENSE_CATEGORY_KEYWORDS[catId];
      for (const kw of keywords) {
        const regex = new RegExp(`\\b${kw}\\b`, 'i');
        if (regex.test(text)) {
          const idx = text.lastIndexOf(kw);
          if (idx !== -1 && idx > latestExpenseIdx) {
            latestExpenseIdx = idx;
            matchedExpenseCatId = catId;
            expenseMatchedWord = kw;
          }
        } else if (regex.test(preRalatText) && latestExpenseIdx === -1) {
          matchedExpenseCatId = catId;
          expenseMatchedWord = kw;
        }
      }
    }
  }

  // Gabungkan kosakata hasil belajar mandiri lokal
  const learnedVocab = getLearnedVocabulary();
  if (learnedVocab && learnedVocab.categories) {
    Object.keys(learnedVocab.categories).forEach(catId => {
      const kws = learnedVocab.categories[catId];
      for (const kw of kws) {
        const regex = new RegExp(`\\b${kw}\\b`, 'i');
        if (regex.test(text) || regex.test(preRalatText)) {
          const idx = text.lastIndexOf(kw);
          if (incomeCategories && incomeCategories.some(c => c.id === catId)) {
            if (idx > latestIncomeIdx) {
              latestIncomeIdx = idx;
              matchedIncomeCatId = catId;
              incomeMatchedWord = kw;
            }
          } else {
            if (idx > latestExpenseIdx) {
              latestExpenseIdx = idx;
              matchedExpenseCatId = catId;
              expenseMatchedWord = kw;
            }
          }
        }
      }
    });
  }

  // Tentukan apakah Income atau Expense berdasarkan sinyal dan posisi kategori
  if (matchedIncomeCatId && (!matchedExpenseCatId || latestIncomeIdx >= latestExpenseIdx || isIncome)) {
    isIncome = true;
  } else if (matchedExpenseCatId && !isIncome) {
    isIncome = false;
  }

  const type = isIncome ? 'Income' : 'Expense';
  const activeCategoryList = isIncome ? (incomeCategories || []) : (expenseCategories || []);

  let foundCategoryId = isIncome ? matchedIncomeCatId : matchedExpenseCatId;
  let categoryMatchedWord = isIncome ? incomeMatchedWord : expenseMatchedWord;

  // Fallback Cerdas: Fuzzy Matching untuk toleransi typo suara / logat daerah ringan
  if (!foundCategoryId) {
    const targetDict = isIncome ? INCOME_CATEGORY_KEYWORDS : EXPENSE_CATEGORY_KEYWORDS;
    const textWords = text.split(/\s+/).filter(w => w.length >= 3 && !CONNECTING_WORDS.includes(w));
    for (const word of textWords) {
      for (const catId of Object.keys(targetDict)) {
        if (activeCategoryList.length === 0 || activeCategoryList.some(c => c.id === catId)) {
          const matchedKw = findClosestMatch(word, targetDict[catId], 1);
          if (matchedKw) {
            foundCategoryId = catId;
            categoryMatchedWord = word;
            break;
          }
        }
      }
      if (foundCategoryId) break;
    }
  }

  let categoryObj = null;
  if (foundCategoryId) {
    categoryObj = activeCategoryList.find(c => c.id === foundCategoryId) || { id: foundCategoryId, name: foundCategoryId };
  } else {
    categoryObj = activeCategoryList[0] || { id: isIncome ? 'gaji' : 'food', name: isIncome ? 'Gaji' : 'Food' };
  }

  // H. Penyusunan Catatan Akhir (Final Note)
  let finalNoteString = '';

  // 1. Ekstraksi token dari teks hasil ralat
  let itemTokens = text.split(/\s+/).filter(Boolean);
  itemTokens = itemTokens.filter(t => !CONNECTING_WORDS.includes(t));
  let itemName = itemTokens.join(' ').trim();

  // 2. Jika ralat hanya mengoreksi nominal (misal: "beli bakso 15rb eh maksudku 20rb"), ambil nama item dari preCorrectionText
  if (!itemName && detectedCorrectionMarker && preCorrectionText) {
    let cleanPre = preCorrectionText;
    for (const item of SLANG_NUMBER_MAP) {
      cleanPre = cleanPre.replace(item.pattern, ' ');
    }
    cleanPre = cleanPre.replace(/(?:rp\s*)?(\d{1,3}(?:\.\d{3})+(?:,\d+)?|\d+(?:[.,]\d+)?)\s*(ribu|rb|rebu|k|juta|jt|miliar|milyar)?(?!\w)/gi, ' ');
    PHRASE_FILLERS.forEach(phrase => { cleanPre = cleanPre.split(phrase).join(' '); });
    let preTokens = cleanPre.split(/\s+/).filter(Boolean);
    preTokens = preTokens.filter(t => !CONNECTING_WORDS.includes(t) && !SINGLE_FILLERS.includes(t));
    itemName = preTokens.join(' ').trim();
  }

  if (noteMarkerFound && explicitNote) {
    let explicitTokens = explicitNote.split(/\s+/).filter(Boolean);
    while (explicitTokens.length > 0 && CONNECTING_WORDS.includes(explicitTokens[explicitTokens.length - 1])) {
      explicitTokens.pop();
    }
    while (explicitTokens.length > 0 && CONNECTING_WORDS.includes(explicitTokens[0])) {
      explicitTokens.shift();
    }
    const cleanExplicit = explicitTokens.join(' ').trim();

    if (itemName) {
      finalNoteString = itemName;
    } else {
      finalNoteString = cleanExplicit;
    }
  } else {
    const deduplicated = [];
    for (let i = 0; i < itemTokens.length; i++) {
      if (i === 0 || itemTokens[i] !== itemTokens[i - 1]) {
        deduplicated.push(itemTokens[i]);
      }
    }
    finalNoteString = deduplicated.join(' ');

    if (!finalNoteString && itemName) {
      finalNoteString = itemName;
    }

    if (!finalNoteString && categoryMatchedWord && !CONNECTING_WORDS.includes(categoryMatchedWord)) {
      finalNoteString = categoryMatchedWord;
    }
  }

  let note = finalNoteString.trim();
  // Hapus tanda baca di awal/akhir kalimat (seperti titik, koma, tanda tanya, dll)
  note = note.replace(/^[.,!?:;\s]+|[.,!?:;\s]+$/g, '').trim();

  if (note.length >= 2) {
    note = note.charAt(0).toUpperCase() + note.slice(1);
  } else {
    note = categoryObj ? categoryObj.name : (isIncome ? 'Income' : 'Expense');
  }

  return {
    success: true,
    type,
    amount,
    category: categoryObj,
    account,
    note,
    rawText
  };
}

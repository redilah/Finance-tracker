import { findClosestMatch } from './fuzzyMatch.js';
import { getLearnedVocabulary } from './voiceLearner.js';
import { evaluateNoise } from './noiseFilter.js';
import { checkProhibitedContent } from './safetyGuard.js';

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

// 2. Kamus Penanda Koreksi / Ralat Spontan (Diurutkan dari frasa terpanjang)
const CORRECTION_MARKERS = [
  'apa maksudku', 'apa maksudnya', 'apa maksud saya', 'apa maksud gue',
  'eh maksudku', 'eh maksudnya', 'eh maksud saya', 'eh maksud gue',
  'maksud aku', 'maksud saya', 'maksud gue', 'maksud gua', 'maksud ane', 'maksud ana', 'maksud kulo',
  'maksudku', 'maksudnya',
  'bukan maksudnya', 'bukan maksudku', 'bukan tapi', 'bukan deng', 'bukan deh', 'bukan dong', 'bukan itu',
  'eh bukan', 'eh salah', 'salah sebut', 'salah tadi', 'salah deng', 'salah deh', 'salah maksudnya',
  'ralat ya', 'ralat dong', 'ralat deh', 'ralat',
  'gak jadi tapi', 'nggak jadi tapi', 'ga jadi tapi', 'gak jadi', 'nggak jadi', 'ga jadi'
];

// 2b. Kamus Kata Filler, Ragu-ragu & Perintah Suara
const PHRASE_FILLERS = [
  'apa ya namanya', 'apa namanya ya', 'apa namanya tuh', 'apa namanya nih', 'apa namanya',
  'apa sih namanya', 'apa tuh namanya', 'apa tadi ya', 'apa tadi', 'apaan ya', 'apa itu ya', 'ini apa ya',
  'apa ya', 'apa tuh', 'gimana ya', 'gimana sih', 'gimana tadi',
  'apa maksudku', 'apa maksudnya',

  'tolong catatkan dong', 'tolong catatkan ya', 'tolong catatkan', 'tolong catat dong', 'tolong catat ya', 'tolong catat',
  'tolong tambahkan', 'tolong buatkan', 'tolong masukkan', 'tolong masukin', 'tolong simpan', 'tolong simpen', 'tolong input',
  'bantu catatkan', 'bantu catat', 'bantu tambahkan', 'bantu buatkan', 'bantu masukkan', 'bantu masukin', 'bantu simpan', 'bantu input',
  'coba catatkan', 'coba catat', 'coba tambahkan', 'coba buatkan', 'coba masukkan', 'coba masukin', 'coba simpan', 'coba input',
  'tambahkan dong', 'buatkan dong', 'masukkan dong', 'masukin dong', 'simpan dong', 'simpen dong', 'input dong', 'catat dong', 'catatin dong', 'tulis dong', 'tulisin dong',
  'tambahkan ya', 'buatkan ya', 'masukkan ya', 'masukin ya', 'simpan ya', 'input ya', 'catat ya', 'catatin ya', 'tulis ya',
  'tambahkan transaksi', 'masukkan transaksi', 'catat transaksi', 'simpan transaksi', 'buat transaksi',

  'oh iya', 'oh ya', 'bentar ya', 'bentar dulu', 'tunggu dulu', 'tunggu sebentar', 'pokoknya'
];

const SINGLE_FILLERS = [
  'eh', 'ee', 'eee', 'aa', 'aaa', 'oh', 'ohh', 'hmm', 'hm', 'em', 'eu', 'euh',
  'anu', 'apaan', 'nah', 'uh', 'tuh', 'nih', 'sih', 'dong', 'deh', 'kan', 'loh', 'kok', 'lah', 'ya'
];

// 2c. Kamus Fonetik Bahasa Inggris & Judul Buku / Istilah Populer (Aksen Indonesia / Speech Mishearings)
export const ENGLISH_PHONETIC_AND_BOOK_MAP = [
  // Buku Best-Seller & Istilah Finansial / Self-Improvement Populer
  { pattern: /\b(?:zero|sero)\s*(?:tuan|to\s*wan|tu\s*wan|to\s*one|tu\s*one|to\s*1|tu\s*1)\b/gi, replacement: 'Zero to One' },
  { pattern: /\b(?:ifluence|infulence|influens|influen)\b/gi, replacement: 'Influence' },
  { pattern: /\b(?:atomic\s*habits?|atomik\s*habits?|atomic\s*habit)\b/gi, replacement: 'Atomic Habits' },
  { pattern: /\b(?:the\s*psychology\s*of\s*money|psychology\s*of\s*money|psikologi\s*of\s*money|psikologi\s*op\s*mani|psychology\s*of\s*mani|psikologi\s*uang)\b/gi, replacement: 'The Psychology of Money' },
  { pattern: /\b(?:rich\s*dad\s*poor\s*dad|ric\s*ded\s*pur\s*ded|ric\s*ded)\b/gi, replacement: 'Rich Dad Poor Dad' },
  { pattern: /\b(?:deep\s*work|dip\s*work|dip\s*wok)\b/gi, replacement: 'Deep Work' },
  { pattern: /\b(?:start\s*with\s*why|stat\s*with\s*why|stat\s*wit\s*why)\b/gi, replacement: 'Start with Why' },
  { pattern: /\b(?:the\s*lean\s*startup|lean\s*startup|lin\s*startup)\b/gi, replacement: 'The Lean Startup' },
  { pattern: /\b(?:show\s*your\s*work|so\s*yor\s*wok)\b/gi, replacement: 'Show Your Work' },
  { pattern: /\b(?:steal\s*like\s*an\s*artist|stil\s*laik\s*an\s*artis)\b/gi, replacement: 'Steal Like an Artist' },
  { pattern: /\b(?:good\s*to\s*great|gud\s*tu\s*grit|gud\s*to\s*great)\b/gi, replacement: 'Good to Great' },
  { pattern: /\b(?:think\s*and\s*grow\s*rich|tingken\s*grow\s*ric|tingk\s*en\s*grow\s*ric)\b/gi, replacement: 'Think and Grow Rich' },
  { pattern: /\b(?:cant\s*hurt\s*me|can't\s*hurt\s*me|ken\s*hat\s*mi)\b/gi, replacement: "Can't Hurt Me" },
  { pattern: /\b(?:essentialism|esensialism)\b/gi, replacement: 'Essentialism' },
  { pattern: /\b(?:feel\s*good\s*productivity|fil\s*gud\s*produktifiti)\b/gi, replacement: 'Feel-Good Productivity' },
  { pattern: /\b(?:surrounded\s*by\s*idiots|suroundid\s*bai\s*idiot)\b/gi, replacement: 'Surrounded by Idiots' },
  { pattern: /\b(?:the\s*subtle\s*art|subtle\s*art|sabtel\s*art)\b/gi, replacement: 'The Subtle Art' },
  { pattern: /\b(?:the\s*alchemist|alkemis)\b/gi, replacement: 'The Alchemist' },
  { pattern: /\b(?:sapiens|sapien)\b/gi, replacement: 'Sapiens' },
  { pattern: /\b(?:ikigai)\b/gi, replacement: 'Ikigai' },

  // Frasa & Istilah Umum Inggris / Logat Indo
  { pattern: /\b(?:cash\s*flow|kes\s*flo)\b/gi, replacement: 'Cash Flow' },
  { pattern: /\b(?:freelance|frilens|pri\s*lens)\b/gi, replacement: 'Freelance' },
  { pattern: /\b(?:checkout|cekout|cek\s*aut)\b/gi, replacement: 'Checkout' },
  { pattern: /\b(?:headset|hedset|hetset)\b/gi, replacement: 'Headset' },
  { pattern: /\b(?:earphone|erpon|irpon)\b/gi, replacement: 'Earphone' },
  { pattern: /\b(?:mousepad|mauspad|maus\s*ped)\b/gi, replacement: 'Mousepad' },
  { pattern: /\b(?:t-shirt|t\s*shirt|tisort|tisyet)\b/gi, replacement: 'T-Shirt' },
  { pattern: /\b(?:skincare|skin\s*ker|sekin\s*ker)\b/gi, replacement: 'Skincare' }
];

// 3. Kamus Kategori Komprehensif (24 Expense + 6 Income)
export const EXPENSE_CATEGORY_KEYWORDS = {
  gofood: [
    'gofood', 'go food', 'go-food', 'grabfood', 'grab food', 'grab-food', 'shopeefood', 'shopee food', 'shopee-food',
    'pesan antar makanan', 'pesan antar', 'delivery makanan', 'pesen gofood', 'order gofood', 'pesen grabfood', 'order grabfood'
  ],
  food: [
    'nasi padang', 'ayam geprek', 'ayam goreng', 'ayam bakar', 'nasi goreng', 'mie ayam', 'mie instan', 'bakmie',
    'bubur ayam', 'pecel lele', 'ikan bakar', 'mie gacoan', 'rujak buah', 'rujak pepaya', 'rujak mentimun', 'rujak',
    'es kacang hijau', 'es kacang ijo', 'kacang hijau', 'kacang ijo', 'bubur kacang ijo', 'burjo',
    'es campur', 'es teler', 'es buah', 'es cendol', 'es dawet', 'es doger', 'kolak',
    'telur dadar', 'telur goreng', 'telur ceplok', 'telur gulung', 'telur balado', 'telur asin',
    'telor dadar', 'telor goreng', 'telor ceplok', 'telor gulung', 'telor balado', 'telor asin',
    'makan siang', 'makan malam', 'makan', 'sarapan', 'maksi', 'dinner', 'nasi', 'geprek', 'bakso', 'mie', 'indomie',
    'soto', 'sate', 'rawon', 'gule', 'bubur', 'martabak', 'gorengan', 'bakwan', 'tahu', 'tempe', 'seblak', 'cilok', 'cireng',
    'batagor', 'siomay', 'warteg', 'angkringan', 'kantin', 'seafood', 'burger', 'mcd', 'mekdi', 'kfc', 'hokben',
    'gacoan', 'pizza', 'pasta', 'ramen', 'sushi', 'roti', 'kue', 'donat', 'jco', 'snack', 'cemilan',
    'jajan', 'kuliner', 'bebek'
  ],
  coffee: [
    'kopi kenangan', 'janji jiwa', 'point coffee', 'kopi susu', 'starbucks', 'espresso',
    'cappuccino', 'americano', 'tomoro', 'chatime', 'es teh', 'esteh', 'ngopi', 'coffee', 'kopsu',
    'latte', 'sbux', 'kenangan', 'fore', 'kulo', 'cafe', 'kafe', 'tongkrongan', 'boba', 'teh', 'kopi'
  ],
  transport: [
    'commuterline', 'transjakarta', 'bensin grab', 'bluebird', 'maxim', 'indrive', 'taksi', 'taxi',
    'angkot', 'busway', 'kereta', 'parkir', 'e-toll', 'etoll', 'ongkos', 'goride', 'gocar', 'grabride',
    'grabcar', 'ojek', 'ojol', 'gojek', 'grab', 'bus', 'krl', 'mrt', 'lrt', 'tol', 'tarif'
  ],
  bioskop: [
    'nonton film', 'tiket bioskop', 'popcorn bioskop', 'cinepolis', 'premiere', 'bioskop', 'nonton',
    'cinema', 'xxi', 'cgv', 'imax', 'film', 'movie', 'spiderman', 'spider-man', 'marvel', 'avatar',
    'oppenheimer', 'barbie', 'batman', 'avengers', 'disney', 'anime', 'cinema 21', '21'
  ],
  barber: [
    'barbershop', 'potong rambut', 'pangkas rambut', 'cukur jenggot', 'creambath', 'styling rambut',
    'haircut', 'barber', 'cukur rambut', 'cukur', 'salon', 'pomade'
  ],
  skincare: [
    // Facial Wash & Cleansers
    'sabun cuci muka', 'cuci muka', 'sabun muka', 'facial wash', 'face wash', 'facewash', 'facial foam',
    'face foam', 'facial cleanser', 'gentle cleanser', 'hydrating cleanser', 'deep cleanser', 'foam cleanser',
    'oil cleanser', 'cleansing oil', 'cleansing balm', 'micellar water', 'micelar water', 'micellar',
    'facial scrub', 'face scrub', 'cleanser', 'cleansing',

    // Toners, Essences, Serums & Ampoules
    'hydrating toner', 'exfoliating toner', 'cica toner', 'toner wajah', 'toner', 'essence', 'ampoule',
    'cica serum', 'vitamin c serum', 'retinol serum', 'brightening serum', 'face serum', 'serum wajah',
    'serum', 'booster',

    // Moisturizers, Creams & Gels
    'moisturizer', 'mosturizer', 'moisturiser', 'pelembab muka', 'pelembab wajah', 'pelembab',
    'pelembap muka', 'pelembap wajah', 'pelembap', 'day cream', 'night cream', 'krim siang', 'krim malam',
    'krim mata', 'eye cream', 'sleeping mask', 'soothing gel', 'aloe vera gel', 'petroleum jelly', 'cream',

    // Sunscreen & UV Protection
    'sunscreen', 'sunblock', 'tabir surya', 'sun screen', 'sun stick', 'sun mist', 'sun cream',
    'sanscreen', 'sunsrin',

    // Masks & Peels
    'sheet mask', 'masker wajah', 'masker muka', 'clay mask', 'peel off mask', 'mud mask', 'masker',

    // Body Care & Personal Hygiene
    'body lotion', 'body serum', 'body wash', 'body scrub', 'body mist', 'hand body', 'hand cream',
    'lotion', 'sabun mandi cair', 'sabun mandi', 'lulur mandi', 'lulur', 'deodorant', 'antiperspirant',
    'roll on', 'shampoo', 'sampo', 'conditioner', 'kondisioner', 'hair tonic', 'hair serum', 'vitamin rambut',

    // Makeup & Cosmetics
    'lip balm', 'lip tint', 'lip gloss', 'lipstik', 'lipstick', 'lip matte', 'lip velvet',
    'cushion', 'foundation', 'bb cream', 'cc cream', 'concealer', 'loose powder', 'compact powder',
    'bedak tabur', 'bedak padat', 'bedak', 'blush on', 'eyeliner', 'mascara', 'maskara',
    'pensil alis', 'eyebrow', 'eyeshadow', 'highlighter', 'contour', 'setting spray',
    'kapas wajah', 'kapas', 'cotton pad', 'minyak wangi', 'parfum', 'perfume', 'eau de parfum',
    'eau de toilette', 'cologne', 'kosmetik', 'make up', 'makeup', 'skin care', 'skincare',

    // Active Ingredients
    'retinol', 'niacinamide', 'salicylic acid', 'salicylic', 'hyaluronic acid', 'hyaluronic',
    'ceramide', 'centella asiatica', 'centella', 'cica', 'aha bha pha', 'aha bha',
    'snail mucin', 'alpha arbutin', 'bakuchiol', 'mugwort', 'peptide',

    // Brands (Indonesian & Global)
    'skintific', 'somethinc', 'the originote', 'originote', 'scarlett whitening', 'scarlett',
    'wardah', 'avoskin', 'whitelab', 'azarine', 'kahf', 'cetaphil', 'cerave', 'cosrx',
    'innisfree', 'glad2glow', 'glad 2 glow', 'facetology', 'npure', 'n pure', 'hanasui',
    'barenbliss', 'bnb', 'luxcrime', 'hada labo', 'senka', 'garnier', 'nivea', 'vaseline',
    'emina', 'make over', 'makeover', 'maybelline', 'dior', 'chanel', 'laneige', 'bioderma',
    'la roche posay', 'laroche posay', 'the ordinary', 'implora', 'dazzle me', 'madame gie',
    'focallure', 'studio tropik', 'biore',

    // Voice / STT phonetic slips
    'feis was', 'pes was', 'peswas', 'feiswash', 'sunsrin', 'sanscreen', 'mosturaizer',
    'mosturiser', 'skintipik', 'skintifik', 'skin tv', 'klad tu klo', 'klad tu glow', 'klad tuglo', 'originot'
  ],
  edukasi: [
    'alat tulis', 'sertifikasi', 'pelatihan', 'semester', 'fotocopy', 'bootcamp',
    'gramedia', 'kursus', 'bimbel', 'webinar', 'seminar', 'kuliah', 'sekolah', 'pulpen', 'ujian',
    'buku', 'novel', 'komik', 'les', 'spp', 'ukt', 'print', 'udemy',
    'zero to one', 'zero tuan', 'influence', 'ifluence', 'atomic habits', 'psychology of money',
    'rich dad poor dad', 'deep work', 'start with why', 'sapiens', 'ikigai'
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
    'pewangi', 'sembako', 'lotte', 'beras', 'gula', 'telur ayam', 'telur bebek', 'telur', 'telor', 'tissue', 'tisu'
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
  buah: [
    'buah-buahan', 'buah buahan', 'toko buah', 'tukang buah', 'pasar buah', 'jus buah', 'buah potong',
    'buah nanas', 'nanas madu', 'nanas subang', 'nanas', 'pineapple',
    'buah apel', 'apel fuji', 'apel manalagi', 'apel washington', 'apel merah', 'apel hijau', 'apel', 'apple',
    'buah pisang', 'pisang ambon', 'pisang raja', 'pisang cavendish', 'pisang kepok', 'pisang sunpride', 'pisang', 'banana',
    'buah jeruk', 'jeruk medan', 'jeruk pontianak', 'jeruk santang', 'jeruk nipis', 'jeruk purut', 'jeruk peras', 'jeruk bali', 'jeruk sunkist', 'jeruk', 'orange',
    'buah semangka', 'semangka merah', 'semangka kuning', 'semangka inul', 'semangka non biji', 'semangka', 'watermelon',
    'buah melon', 'melon hijau', 'melon kuning', 'melon madu', 'melon',
    'buah mangga', 'mangga harum manis', 'mangga arumanis', 'mangga indramayu', 'mangga gedong', 'mangga simanalagi', 'mangga', 'mango',
    'buah durian', 'durian montong', 'durian musang king', 'durian bawor', 'durian', 'duren',
    'buah alpukat', 'alpukat mentega', 'alpukat aligator', 'alpukat kocok', 'alpukat', 'avocado',
    'buah anggur', 'anggur merah', 'anggur hijau', 'anggur hitam', 'anggur shine muscat', 'anggur autumn', 'anggur', 'grape',
    'buah pepaya', 'pepaya calina', 'pepaya california', 'pepaya bangkok', 'pepaya', 'papaya',
    'buah naga', 'buah naga merah', 'buah naga putih', 'dragon fruit',
    'buah salak', 'salak pondoh', 'salak bali', 'salak madu', 'salak',
    'buah rambutan', 'rambutan rapiah', 'rambutan binjai', 'rambutan',
    'buah stroberi', 'buah strawberry', 'stroberi', 'strawberry',
    'buah jambu', 'jambu kristal', 'jambu biji', 'jambu air', 'jambu jamaika', 'jambu bol', 'jambu',
    'buah pear', 'buah pir', 'pir xiang lie', 'pir singo', 'pir century', 'pear', 'pir',
    'buah kelengkeng', 'kelengkeng bangkok', 'kelengkeng', 'lengkeng',
    'buah duku', 'duku palembang', 'duku', 'langsat',
    'buah manggis', 'manggis',
    'buah kiwi', 'kiwi gold', 'kiwi hijau', 'kiwi',
    'buah sirsak', 'sirsak',
    'buah blewah', 'blewah',
    'buah belimbing', 'belimbing madu', 'belimbing',
    'buah cempedak', 'cempedak',
    'buah nangka', 'nangka',
    'buah markisa', 'markisa',
    'buah kedondong', 'kedondong',
    'buah srikaya', 'srikaya',
    'buah sawo', 'sawo',
    'buah plum', 'plum',
    'buah kurma', 'kurma ajwa', 'kurma sukari', 'kurma medjool', 'kurma',
    'buah delima', 'delima',
    'buah kelapa', 'kelapa muda', 'degan', 'kelapa',
    'buah segar', 'buah'
  ],
  party: [
    'hadiah ultah', 'kado ulang tahun', 'ulang tahun', 'traktiran', 'perayaan', 'pesta', 'party', 'ultah', 'kado',
    'traktir', 'arisan', 'bukber', 'reuni', 'karaoke'
  ],
  minuman: [
    'es buah', 'es campur', 'es teler', 'es kacang hijau', 'es kacang ijo', 'bubur kacang ijo', 'burjo',
    'es cendol', 'es dawet', 'es doger', 'es pisang ijo', 'es cincau', 'es kuwut', 'es selasih', 'es timun suri',
    'es blewah', 'es oyen', 'es podeng', 'es tebu', 'es kopyor', 'es pleret', 'es degan', 'es kelapa muda',
    'coca cola', 'coca-cola', 'cocacola', 'coke', 'sprite', 'fanta', 'pepsi', 'big cola',
    'pocari sweat', 'pocari', 'mizone', 'isotonic', 'you c 1000', 'you c1000', 'larutan cap kaki tiga',
    'adem sari', 'ademsari', 'tebs', 'floridina', 'pulpy orange', 'minute maid', 'buavita', 'nutrisari', 'nutri sari', 'hydro coco',
    'teh botol', 'teh botol sosro', 'teh kotak', 'teh pucuk', 'teh pucuk harum', 'fruit tea',
    'ultra milk', 'susu uht', 'susu beruang', 'bear brand', 'indomilk', 'milo', 'dancow', 'susu kedelai', 'soya milk', 'soya',
    'yogurt', 'yakult', 'cimory', 'teh tarik', 'thai tea', 'green tea', 'matcha', 'boba drink', 'bubble tea',
    'jus alpukat', 'jus mangga', 'jus jeruk', 'jus buah', 'jus jambu', 'jus sirsak', 'jus apel', 'jus melon', 'jus tomat', 'jus semangka', 'jus',
    'es teh manis', 'es teh tawar', 'es teh', 'esteh', 'es jeruk', 'es lemon tea', 'lemon tea', 'liang teh',
    'wedang ronde', 'wedang jahe', 'bajigur', 'bandrek', 'sekoteng', 'jamu', 'beras kencur', 'kunyit asam', 'temulawak',
    'susu jahe', 'susu coklat', 'susu murni', 'susu sapi', 'susu kambing', 'susu',
    'minuman dingin', 'minuman segar', 'minuman kemasan', 'beli minuman', 'botol minum', 'kedai minuman', 'aneka minuman', 'minuman'
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

const ACCOUNT_SYNONYMS = {
  'cash': 'Cash',
  'tunai': 'Cash',
  'uang tunai': 'Cash',
  'bca': 'BCA',
  'bank bca': 'BCA',
  'bca mobile': 'BCA',
  'klikbca': 'BCA',
  'mandiri': 'Livin',
  'bank mandiri': 'Livin',
  'livin': 'Livin',
  'livin mandiri': 'Livin',
  'livin by mandiri': 'Livin',
  'bri': 'BRImo',
  'brimo': 'BRImo',
  'bank bri': 'BRImo',
  'bpd': 'BPD DIY',
  'bpd diy': 'BPD DIY',
  'bpddiy': 'BPD DIY',
  'bpd diy mobile': 'BPD DIY',
  'bpddiy mobile': 'BPD DIY',
  'bale by btn': 'bale by btn',
  'bale': 'bale by btn',
  'btn': 'bale by btn',
  'bank btn': 'bale by btn',
  'bale btn': 'bale by btn',
  'bni': 'Wondr',
  'bank bni': 'Wondr',
  'wondr': 'Wondr',
  'wondr bni': 'Wondr',
  'wondr by bni': 'Wondr',
  'bsi': 'BSI',
  'bank bsi': 'BSI',
  'syariah': 'BSI',
  'jago': 'Bank Jago',
  'bank jago': 'Bank Jago',
  'seabank': 'SeaBank',
  'sea bank': 'SeaBank',
  'jenius': 'Jenius',
  'blu': 'blu',
  'blu bca': 'blu',
  'cimb': 'CIMB Niaga',
  'cimb niaga': 'CIMB Niaga',
  'permata': 'Permata',
  'bank permata': 'Permata',
  'maybank': 'Maybank',
  'bank maybank': 'Maybank',
  'gopay': 'GoPay',
  'go-pay': 'GoPay',
  'ovo': 'OVO',
  'dana': 'DANA',
  'shopeepay': 'ShopeePay',
  'spay': 'ShopeePay',
  'shopee pay': 'ShopeePay',
  'linkaja': 'LinkAja',
  'link aja': 'LinkAja',
  'qris': 'QRIS',
  'paypal': 'PayPal',
  'visa': 'Visa',
  'mastercard': 'Mastercard',
  'alfamart': 'Alfamart',
  'alfa': 'Alfamart',
  'indomaret': 'Indomaret',
  'indomart': 'Indomaret'
};

// Aliases mapping old/alternative bank names to current active app names and vice versa
const ACCOUNT_INTERCHANGEABLE_ALIASES = {
  'bni': ['wondr', 'bni', 'bank bni', 'wondr by bni', 'wondr bni'],
  'wondr': ['wondr', 'bni', 'bank bni', 'wondr by bni', 'wondr bni'],
  'mandiri': ['livin', 'mandiri', 'bank mandiri', 'livin by mandiri', 'livin mandiri'],
  'livin': ['livin', 'mandiri', 'bank mandiri', 'livin by mandiri', 'livin mandiri'],
  'bri': ['brimo', 'bri', 'bank bri'],
  'brimo': ['brimo', 'bri', 'bank bri'],
  'btn': ['bale by btn', 'btn', 'bank btn', 'bale btn', 'bale'],
  'bale by btn': ['bale by btn', 'btn', 'bank btn', 'bale btn', 'bale'],
  'bpd diy': ['bpd diy', 'bpddiy', 'bpd', 'bank bpd diy'],
  'bpddiy': ['bpd diy', 'bpddiy', 'bpd', 'bank bpd diy'],
  'jago': ['bank jago', 'jago'],
  'bank jago': ['bank jago', 'jago'],
  'cimb': ['cimb niaga', 'cimb'],
  'cimb niaga': ['cimb niaga', 'cimb'],
  'shopeepay': ['shopeepay', 'spay', 'shopee pay', 'shopee'],
  'gopay': ['gopay', 'go-pay'],
  'linkaja': ['linkaja', 'link aja']
};

// 5. Penanda Catatan (Note Boundaries & Typo Suara)
const NOTE_MARKERS = [
  'dengan catatan', 'dengan keterangan', 'catatannya', 'catetannya', 'catatan', 'catetan', 'catat',
  'notenya', 'note nya', 'notnya', 'not nya', 'not e', 'note', 'not', 'keterangannya', 'keterangan', 'alasannya', 'alasan'
];

// 6. Kata Hubung, Kata Kerja & Istilah Perintah Umum
export const CONNECTING_WORDS = [
  'tambahkan', 'tambah', 'masukkan', 'masukin', 'input', 'tuliskan', 'tulisin', 'tulis', 'buatkan', 'buat',
  'simpanlah', 'simpan', 'simpen', 'isikan', 'isikanlah', 'catatkan', 'catatin', 'catat', 'rekam', 'inputkan', 'add', 'create', 'save', 'insert',
  'bantu', 'tolong', 'coba', 'silakan', 'silahkan', 'mohon', 'minta',

  'apa', 'apaan', 'maksudku', 'maksudnya', 'maksud', 'aku', 'saya', 'gue', 'gw', 'kami', 'kita', 'dia',
  'nanti', 'tadi', 'kemarin', 'hari ini', 'mau', 'ini', 'itu', 'tuh', 'nih', 'sih',
  'lapar', 'laper', 'kenyang', 'haus', 'banget', 'terus', 'lalu', 'kemudian',

  'dengan', 'pake', 'pakai', 'harga', 'harganya', 'beli', 'membeli', 'bayar', 'membayar', 'terbayar',
  'isi', 'ngisi', 'mengisi', 'pesan', 'pesen', 'order', 'pesan antar', 'delivery',
  'belanja', 'tiket', 'kategori', 'transaksi', 'pengeluaran', 'pemasukan', 'biaya', 'ongkos', 'tarif',

  'gofood', 'go-food', 'go food', 'grabfood', 'grab-food', 'grab food', 'shopeefood', 'shopee-food', 'shopee food',
  'scan', 'barcode', 'scan barcode', 'transfer', 'tf', 'debit', 'rekening', 'qris', 'kris', 'keris', 'cash', 'tunai', 'mbanking', 'm-banking',
  'bca', 'mandiri', 'bri', 'bni', 'gopay', 'ovo', 'dana', 'shopeepay', 'spay',

  'dari', 'ke', 'di', 'pada', 'yang', 'yg', 'udah', 'sudah', 'dong', 'deh', 'ya', 'kan', 'ada',
  'buat', 'untuk', 'sebesar', 'senilai', 'nominal', 'sejumlah', 'uang', 'keluar', 'masuk', 'terima', 'dapat', 'dapet', 'oleh',
  'kilo', 'kilos', 'kg', 'sekilo', 'ons', 'gram', 'gr', 'liter', 'ikat', 'biji', 'butir', 'potong', 'porsi', 'bungkus', 'pack', 'dus', 'kotak', 'keranjang', 'paket',
  'enggak', 'nggak', 'ngga', 'gak', 'ga', 'bukan', 'salah'
];

/**
 * Parser untuk 1 klausa tunggal transaksi atau perintah suara
 */
export function parseSingleVoiceTransaction(rawText, { expenseCategories, incomeCategories, accountsList } = {}) {
  if (!rawText || typeof rawText !== 'string') {
    return { success: false, reason: 'empty_text' };
  }

  // Bersihkan tanda baca di luar angka (titik desimal 1.5jt atau ribuan 50.000 tetap aman)
  let text = rawText
    .toLowerCase()
    .replace(/(?<!\d)[.,!?:;"'“”’/]+|[.,!?:;"'“”’/]+(?!\d)/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const preRalatText = text;

  // 0a. Safety Guard: Cegah Konten Terlarang (Miras, Alkohol, Narkoba, Judi, dll.)
  const isFreshFruitContext = /\b(buah anggur|anggur buah|anggur shine|anggur hijau|anggur hitam|anggur autumn|anggur manis|sekilo anggur|kilo anggur)\b/i.test(rawText);
  if (!isFreshFruitContext) {
    const safetyCheck = checkProhibitedContent(rawText);
    if (safetyCheck && safetyCheck.isProhibited) {
      return {
        success: false,
        reason: 'prohibited_content',
        prohibitedCategory: safetyCheck.category,
        message: safetyCheck.reason
      };
    }
  }

  // 0b. Filter Suara Kebisingan Lingkungan, Hewan, Musik & Benda Jatuh
  const noiseEval = evaluateNoise(rawText);
  if (noiseEval.isNoise) {
    const hasStrongTransactionIntent = /\b(beli|membeli|bayar|membayar|terbayar|gajian|gaji|dapat|dapet|terima|cair|catat|catatkan|tambah|tambahkan|masukkan|masukin|input|simpan|hapus|delete|batalin|batalkan)\b/i.test(rawText);
    if (!hasStrongTransactionIntent) {
      return {
        success: false,
        reason: 'noise_detected',
        noiseType: noiseEval.noiseType,
        message: noiseEval.reason
      };
    }
  }

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

    const targetQuery = queryText.replace(/[^a-zA-Z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();

    return {
      success: true,
      action: 'DELETE',
      isLast: isLast || (!targetQuery && !targetAmount),
      targetQuery: targetQuery || '',
      targetAmount: targetAmount || null,
      rawText
    };
  }

  // 0b. Deteksi Koreksi / Ralat Spontan
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

  // B2. Normalisasi Fonetik Bahasa Inggris & Judul Buku Populer
  for (const item of ENGLISH_PHONETIC_AND_BOOK_MAP) {
    text = text.replace(item.pattern, item.replacement);
  }

  // C. Ekstraksi Nominal
  const amountRegex = /(?:rp\s*)?(\d{1,3}(?:\.\d{3})+(?:,\d+)?|\d+(?:[.,]\d+)?)\s*(ribu|rb|rebu|k|juta|jt|miliar|milyar)?(?!\w)/gi;
  const amountMatches = [...text.matchAll(amountRegex)].filter(m => m[0].trim().length > 0);

  if (amountMatches.length === 0) {
    return { success: false, reason: 'amount_not_found', text };
  }

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

  const amountIdx = text.lastIndexOf(matchedAmountStr);
  if (amountIdx !== -1) {
    text = text.substring(0, amountIdx) + ' ' + text.substring(amountIdx + matchedAmountStr.length);
  }

  // D. Deteksi Income vs Expense Sinyal
  const INCOME_SIGNALS = [
    'dapat', 'dapet', 'terima', 'gajian', 'gaji', 'salary', 'payroll', 'upah', 'honor',
    'dana cair', 'uang cair', 'gaji cair', 'gajian cair', 'pinjaman cair', 'klaim cair',
    'masuk uang', 'transferan masuk', 'uang masuk', 'pemasukan', 'penghasilan',
    'dikirimi', 'ditransfer', 'dapat uang', 'dapat gaji', 'laba', 'profit', 'dividen',
    'komisi', 'cuan', 'bonus', 'thr', 'tunjangan', 'angpao', 'hadiah', 'uang kaget',
    'beasiswa', 'kip', 'lpdp', 'affiliate', 'afiliasi', 'endorse', 'hasil jualan', 'omset', 'omzet'
  ];

  // E. Deteksi Akun / Metode Pembayaran (Multi-Tier Scoring System)
  let account = 'Cash';
  let bestAccountScore = -1;
  let latestAccountIndex = -1;
  let accountMatchedWord = '';

  const activeAccounts = (accountsList && Array.isArray(accountsList) && accountsList.length > 0)
    ? accountsList
    : ['Cash', 'BRImo', 'BCA', 'Wondr', 'Livin', 'BSI', 'Bank Jago', 'QRIS', 'GoPay', 'DANA', 'OVO', 'ShopeePay'];

  // Tier 1 & 2: Match against active accounts and their aliases
  for (const customAcc of activeAccounts) {
    const customNorm = (customAcc || '').toLowerCase().trim();
    const testWordsSet = new Set([customNorm]);

    // Add direct synonyms
    for (const [syn, mappedAcc] of Object.entries(ACCOUNT_SYNONYMS)) {
      if (mappedAcc.toLowerCase() === customNorm || syn === customNorm) {
        testWordsSet.add(syn);
      }
    }

    // Add interchangeable aliases (e.g. bni <-> wondr, mandiri <-> livin)
    for (const [aliasKey, aliasList] of Object.entries(ACCOUNT_INTERCHANGEABLE_ALIASES)) {
      if (aliasKey === customNorm || aliasList.includes(customNorm)) {
        aliasList.forEach(a => testWordsSet.add(a));
      }
    }

    // Sort by longest string first so multi-word keywords take precedence
    const sortedTestWords = Array.from(testWordsSet).sort((a, b) => b.length - a.length);

    for (const tw of sortedTestWords) {
      const regex = new RegExp(`\\b${tw}\\b`, 'i');
      const match = text.match(regex);
      if (match) {
        const idx = text.lastIndexOf(match[0]);
        // Score based on word length and position
        const score = (tw.length * 10) + idx;
        if (score > bestAccountScore) {
          bestAccountScore = score;
          latestAccountIndex = idx;
          account = customAcc;
          accountMatchedWord = match[0];
        }
      }
    }
  }

  // Tier 3: If no active account directly matched, check global synonyms to pick best active match
  if (latestAccountIndex === -1) {
    for (const [syn, targetAccName] of Object.entries(ACCOUNT_SYNONYMS)) {
      const regex = new RegExp(`\\b${syn}\\b`, 'i');
      const match = text.match(regex);
      if (match) {
        const idx = text.lastIndexOf(match[0]);
        const matchedTarget = activeAccounts.find(a => a.toLowerCase() === targetAccName.toLowerCase()) || targetAccName;
        const score = (syn.length * 10) + idx;
        if (score > bestAccountScore) {
          bestAccountScore = score;
          latestAccountIndex = idx;
          account = matchedTarget;
          accountMatchedWord = match[0];
        }
      }
    }
  }

  // Tier 4: Fallback to generic categories (Cash, Bank, QRIS) if still no match
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

  // F. Cek Explicit Note Marker
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

  if (latestAccountIndex !== -1 && accountMatchedWord) {
    text = text.replace(new RegExp(`\\b${accountMatchedWord}\\b`, 'gi'), ' ');
  }

  // G. Deteksi Tipe & Kategori
  const fullContextText = `${text} ${preRalatText}`;
  let isIncome = INCOME_SIGNALS.some(sig => {
    if (sig === 'cair') {
      return /\bcair\b/i.test(fullContextText) && !/(?:sabun|deterjen|minyak|pewangi|susu|lem|air|obat|lotion|gel)\s+cair/i.test(fullContextText);
    }
    const regex = new RegExp(`\\b${sig}\\b`, 'i');
    return regex.test(fullContextText);
  });

  const hasExpenseVerb = /\b(beli|membeli|bayar|membayar|terbayar|pesan|pesen|order|jajan|belanja|checkout|co)\b/i.test(fullContextText);
  if (hasExpenseVerb && !/\b(gajian|gaji|dapat gaji|terima transfer|dapet transfer)\b/i.test(fullContextText)) {
    isIncome = false;
  }

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

  let matchedExpenseCatId = null;
  let latestExpenseIdx = -1;
  let expenseMatchedWord = '';

  const primaryText = (text + ' ' + (explicitNote || '')).trim() || fullContextText;

  if (/\b(gofood|go[- ]*food|grabfood|grab[- ]*food|shopeefood|shopee[- ]*food|pesan\s*antar)\b/i.test(primaryText)) {
    matchedExpenseCatId = 'gofood';
    latestExpenseIdx = 9999;
    expenseMatchedWord = 'gofood';
  } else if (/\b(sabun cuci muka|cuci muka|sabun muka|facial wash|face wash|facewash|facial foam|face foam|facial cleanser|gentle cleanser|hydrating cleanser|foam cleanser|oil cleanser|cleansing oil|cleansing balm|micellar water|micelar water|micellar|facial scrub|face scrub|cleanser|cleansing|hydrating toner|exfoliating toner|cica toner|toner wajah|toner|essence|ampoule|cica serum|vitamin c serum|retinol serum|brightening serum|face serum|serum wajah|serum|booster|moisturizer|mosturizer|moisturiser|pelembab muka|pelembab wajah|pelembab|pelembap muka|pelembap wajah|pelembap|day cream|night cream|krim siang|krim malam|krim mata|eye cream|sleeping mask|soothing gel|aloe vera gel|petroleum jelly|sunscreen|sunblock|tabir surya|sun screen|sun stick|sun mist|sun cream|sanscreen|sunsrin|sheet mask|masker wajah|masker muka|clay mask|peel off mask|mud mask|body lotion|body serum|body wash|body scrub|body mist|hand body|hand cream|sabun mandi cair|sabun mandi|lulur mandi|lulur|deodorant|antiperspirant|roll on|shampoo|sampo|conditioner|kondisioner|hair tonic|hair serum|vitamin rambut|lip balm|lip tint|lip gloss|lipstik|lipstick|lip matte|lip velvet|cushion|foundation|bb cream|cc cream|concealer|loose powder|compact powder|bedak tabur|bedak padat|bedak|blush on|eyeliner|mascara|maskara|pensil alis|eyebrow|eyeshadow|highlighter|contour|setting spray|kapas wajah|cotton pad|minyak wangi|parfum|perfume|eau de parfum|eau de toilette|cologne|kosmetik|make up|makeup|skin care|skincare|retinol|niacinamide|salicylic acid|salicylic|hyaluronic acid|hyaluronic|ceramide|centella asiatica|centella|cica|aha bha pha|aha bha|snail mucin|alpha arbutin|bakuchiol|mugwort|peptide|skintific|somethinc|the originote|originote|scarlett whitening|scarlett|wardah|avoskin|whitelab|azarine|kahf|cetaphil|cerave|cosrx|innisfree|glad2glow|glad 2 glow|facetology|npure|n pure|hanasui|barenbliss|bnb|luxcrime|hada labo|senka|garnier|nivea|vaseline|emina|make over|makeover|maybelline|dior|chanel|laneige|bioderma|la roche posay|laroche posay|the ordinary|implora|dazzle me|madame gie|focallure|studio tropik|biore|feis was|pes was|peswas|feiswash|klad tu klo|klad tu glow|klad tuglo|originot)\b/i.test(primaryText)) {
    matchedExpenseCatId = 'skincare';
    latestExpenseIdx = 9700;
    expenseMatchedWord = 'skincare';
  } else if (/\b(nonton film|tiket bioskop|popcorn bioskop|cinepolis|premiere|bioskop|nonton|cinema|xxi|cgv|imax|film|movie|spiderman|spider-man|marvel|avatar|batman|avengers|disney|anime|cinema 21)\b/i.test(primaryText)) {
    matchedExpenseCatId = 'bioskop';
    latestExpenseIdx = 9650;
    expenseMatchedWord = 'bioskop';
  } else if (/\b(nasi padang|ayam geprek|ayam goreng|nasi goreng|mie ayam|mie gacoan|bakmie|bakso|soto|sate|rawon|seblak|rujak|bakwan|telur dadar|telur goreng|telur ceplok|telur gulung|telur balado|telor dadar|telor goreng|telor ceplok)\b/i.test(primaryText)) {
    matchedExpenseCatId = 'food';
    latestExpenseIdx = 9500;
    expenseMatchedWord = 'food';
  } else if (/\b(kopi susu|kopi hitam|kopi latte|kopi kenangan|janji jiwa|point coffee|starbucks|espresso|cappuccino|americano|tomoro|chatime|ngopi|coffee|kopsu|latte|sbux|fore|kopi)\b/i.test(primaryText)) {
    matchedExpenseCatId = 'coffee';
    latestExpenseIdx = 9600;
    expenseMatchedWord = 'coffee';
  } else if (/\b(coca cola|coca-cola|cocacola|coke|sprite|fanta|pepsi|big cola|pocari sweat|pocari|mizone|you c 1000|you c1000|adem sari|ademsari|tebs|floridina|pulpy orange|minute maid|buavita|nutrisari|nutri sari|hydro coco|teh botol|teh kotak|teh pucuk|fruit tea|ultra milk|susu uht|susu beruang|bear brand|indomilk|milo|dancow|susu kedelai|soya milk|yakult|cimory|thai tea|green tea|matcha|boba drink|bubble tea|es buah|es campur|es teler|es kacang hijau|es kacang ijo|bubur kacang ijo|burjo|es cendol|es dawet|es doger|es pisang ijo|es cincau|es kuwut|es selasih|es timun suri|es blewah|es oyen|es podeng|es tebu|es kopyor|es pleret|es degan|es kelapa muda|jus alpukat|jus mangga|jus jeruk|jus buah|jus jambu|jus sirsak|jus apel|jus melon|jus tomat|jus semangka|jus|es teh manis|es teh tawar|es lemon tea|lemon tea|liang teh|wedang ronde|wedang jahe|bajigur|bandrek|sekoteng|jamu|beras kencur|kunyit asam|temulawak|susu jahe|susu coklat|susu murni|minuman dingin|minuman segar|minuman kemasan|minuman)\b/i.test(primaryText)) {
    matchedExpenseCatId = 'minuman';
    latestExpenseIdx = 9450;
    expenseMatchedWord = 'minuman';
  } else if (/\b(grabcar|goride|gocar|grabride|transjakarta|commuterline|krl|mrt|lrt|e-toll|etoll|angkot|busway)\b/i.test(primaryText)) {
    matchedExpenseCatId = 'transport';
    latestExpenseIdx = 9000;
    expenseMatchedWord = 'transport';
  } else if (/\b(barbershop|pangkas rambut|potong rambut|cukur rambut|cukur jenggot)\b/i.test(primaryText)) {
    matchedExpenseCatId = 'barber';
    latestExpenseIdx = 9000;
    expenseMatchedWord = 'barbershop';
  } else if (/\b(buah-buahan|buah buahan|toko buah|tukang buah|pasar buah|buah nanas|nanas madu|nanas|buah apel|apel fuji|apel|buah pisang|pisang ambon|pisang|buah jeruk|jeruk medan|jeruk|buah semangka|semangka|buah melon|melon|buah mangga|mangga harum manis|mangga|buah durian|durian|duren|buah alpukat|alpukat|buah anggur|anggur|buah pepaya|pepaya|buah naga|buah salak|salak|buah rambutan|rambutan|buah stroberi|buah strawberry|stroberi|strawberry|buah jambu|jambu|buah pear|buah pir|pear|pir|buah kelengkeng|kelengkeng|lengkeng|buah duku|duku|buah manggis|manggis|buah kiwi|kiwi|buah sirsak|sirsak|buah blewah|blewah|buah belimbing|belimbing|buah nangka|nangka|buah cempedak|cempedak|buah markisa|markisa|buah kedondong|kedondong|buah srikaya|srikaya|buah sawo|sawo|buah plum|plum|buah kurma|kurma|buah delima|delima|buah kelapa|kelapa muda|degan|buah)\b/i.test(primaryText)) {
    matchedExpenseCatId = 'buah';
    latestExpenseIdx = 9300;
    expenseMatchedWord = 'buah';
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

  if (matchedIncomeCatId && (!matchedExpenseCatId || latestIncomeIdx >= latestExpenseIdx || isIncome)) {
    isIncome = true;
  } else if (matchedExpenseCatId && !isIncome) {
    isIncome = false;
  }

  const type = isIncome ? 'Income' : 'Expense';
  const activeCategoryList = isIncome ? (incomeCategories || []) : (expenseCategories || []);

  let foundCategoryId = isIncome ? matchedIncomeCatId : matchedExpenseCatId;
  let categoryMatchedWord = isIncome ? incomeMatchedWord : expenseMatchedWord;

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
    // Validasi Semantik: Jika tidak ada kategori yang cocok, pastikan ada kata kerja finansial atau satuan uang
    const hasFinancialVerb = /\b(beli|membeli|bayar|membayar|terbayar|gajian|gaji|dapat|dapet|terima|cair|catat|catatkan|tambah|tambahkan|masukkan|masukin|input|simpan|sebesar|senilai|nominal|harga|harganya|ongkos|tarif|biaya|uang|rupiah|belanja|pesan|pesen|order)\b/i.test(fullContextText);
    const hasCurrencyUnit = Boolean(unit) || /rp/i.test(matchedAmountStr) || SLANG_NUMBER_MAP.some(item => item.pattern.test(rawText));

    if (!hasFinancialVerb && !hasCurrencyUnit && amount < 1000) {
      return {
        success: false,
        reason: 'non_financial_intent',
        message: 'Bukan ucapan transaksi keuangan'
      };
    }

    categoryObj = activeCategoryList[0] || { id: isIncome ? 'gaji' : 'food', name: isIncome ? 'Gaji' : 'Food' };
  }

  // H. Penyusunan Catatan Akhir (Final Note)
  let finalNoteString = '';

  let itemTokens = text.split(/\s+/).filter(Boolean);
  itemTokens = itemTokens.filter(t => !CONNECTING_WORDS.includes(t));
  let itemName = itemTokens.join(' ').trim();

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

  // Smart Redundancy & Filler Cleaner:
  // 1. If Coffee brand is detected, remove generic 'coffee' / 'kopi' / 'ngopi' / 'pesan' / 'beli'
  if (/\b(starbucks|sbux|fore|tomoro|janji\s*jiwa|point\s*coffee|kopi\s*kenangan|chatime)\b/i.test(note)) {
    note = note.replace(/\b(coffee|kopi|ngopi)\b/gi, ' ').trim();
  }

  // 2. If Barbershop activity is detected, remove redundant 'barbershop' / 'di barbershop' / 'salon'
  if (/\b(cukur\s*rambut|potong\s*rambut|pangkas\s*rambut|cukur\s*jenggot)\b/i.test(note)) {
    note = note.replace(/\b(di\s+)?(barbershop|barber|salon)\b/gi, ' ').trim();
  }

  // 3. If Income / Gaji: clean temporal and status words ('bulan ini', 'bulan', 'cair', 'cairnya', 'masuk', 'turun', 'dapat')
  if (isIncome || categoryObj?.id === 'gaji' || /\bgaji\b/i.test(note)) {
    note = note.replace(/\b(bulan\s*ini|bulan|cair|cairnya|dapat|dapet|masuk|turun)\b/gi, ' ').trim();
    if (!note || note.toLowerCase() === 'gaji') {
      note = 'Gaji';
    }
  }

  // 4. Polish English phonetic and book titles
  for (const item of ENGLISH_PHONETIC_AND_BOOK_MAP) {
    note = note.replace(item.pattern, item.replacement);
  }

  note = note.replace(/\s+/g, ' ').trim();
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

/**
 * Deteksi apakah suatu klausa memiliki potensi aksi (Hapus atau memiliki nominal)
 */
function clauseHasActionOrAmount(clause) {
  if (!clause || typeof clause !== 'string') return false;
  const lower = clause.toLowerCase();

  // 1. Cek perintah hapus
  const isDelete = /\b(hapus|delete|batalin|batalkan|buang|hilangkan)\b/i.test(lower);
  if (isDelete) return true;

  // 2. Cek apakah ada slang nominal
  for (const item of SLANG_NUMBER_MAP) {
    if (item.pattern.test(lower)) return true;
  }

  // 3. Cek apakah ada angka / nominal
  const amountRegex = /(?:rp\s*)?(\d{1,3}(?:\.\d{3})+(?:,\d+)?|\d+(?:[.,]\d+)?)\s*(ribu|rb|rebu|k|juta|jt|miliar|milyar)?(?!\w)/i;
  return amountRegex.test(lower);
}

/**
 * Multi-Intent Voice Parser:
 * Mampu mengeksekusi multi-transaksi dalam 1 kalimat ucapan sekaligus
 * (misal: "hapus bakwan tambahkan bakmie 13 ribu" atau "beli bakso 15rb dan es teh 5rb")
 */
export function parseVoiceTransaction(rawText, options = {}) {
  if (!rawText || typeof rawText !== 'string') {
    return { success: false, reason: 'empty_text' };
  }

  // 0a. Safety Guard: Cegah Konten Terlarang (Miras, Alkohol, Narkoba, Judi, dll.)
  const isFreshFruitContext = /\b(buah anggur|anggur buah|anggur shine|anggur hijau|anggur hitam|anggur autumn|anggur manis|sekilo anggur|kilo anggur)\b/i.test(rawText);
  if (!isFreshFruitContext) {
    const safetyCheck = checkProhibitedContent(rawText);
    if (safetyCheck && safetyCheck.isProhibited) {
      return {
        success: false,
        reason: 'prohibited_content',
        prohibitedCategory: safetyCheck.category,
        message: safetyCheck.reason
      };
    }
  }

  // 0b. Filter Suara Kebisingan Lingkungan, Hewan, Musik & Benda Jatuh
  const noiseEval = evaluateNoise(rawText);
  if (noiseEval.isNoise) {
    const hasStrongTransactionIntent = /\b(beli|membeli|bayar|membayar|terbayar|gajian|gaji|dapat|dapet|terima|cair|catat|catatkan|tambah|tambahkan|masukkan|masukin|input|simpan|hapus|delete|batalin|batalkan)\b/i.test(rawText);
    if (!hasStrongTransactionIntent) {
      return {
        success: false,
        reason: 'noise_detected',
        noiseType: noiseEval.noiseType,
        message: noiseEval.reason
      };
    }
  }

  // Cek apakah ada koreksi ralat (ralat memiliki prioritas penggantian, bukan multi-transaksi)
  const hasCorrection = CORRECTION_MARKERS.some(m => rawText.toLowerCase().includes(m));
  if (hasCorrection) {
    return parseSingleVoiceTransaction(rawText, options);
  }

  // Pola pembatas multi-klausa (Conjunctions & Secondary Action Openers)
  // Contoh: "... dan ...", "... lalu ...", "... kemudian ...", "... terus ...", "... sama beli ...", "... tambahkan ...", "... masukkan ..."
  const splitRegex = /\b(?:dan\s+juga|dan\s+lagi|dan|lalu|kemudian|terus|serta|sekaligus|plus|sama\s+beli|sama\s+tambah|sama\s+masuk|sama\s+isi|sama\s+catat)\b|(?<=\S)\s+(?=(?:tolong\s+|bantu\s+|coba\s+)?(?:tambahkan|tambah|masukkan|masukin|catat|catatkan|input|tulis|beli|dapat|gajian|cair|hapus|hapusin|delete|batalin|batalkan)\b)/gi;

  const rawClauses = rawText.split(splitRegex).map(c => c.trim()).filter(Boolean);

  if (rawClauses.length >= 2) {
    // Verifikasi bahwa SETIAP klausa memiliki aksi (Hapus) atau memiliki nominal transaksi
    const allClausesValid = rawClauses.every(clauseHasActionOrAmount);

    if (allClausesValid) {
      const parsedCommands = [];
      for (const clause of rawClauses) {
        const res = parseSingleVoiceTransaction(clause, options);
        if (res && res.success) {
          parsedCommands.push(res);
        }
      }

      if (parsedCommands.length === rawClauses.length) {
        return {
          success: true,
          isMultiple: true,
          commands: parsedCommands,
          rawText
        };
      }
    }
  }

  // Fallback ke single transaction
  return parseSingleVoiceTransaction(rawText, options);
}

/**
 * Cassiel Content Safety & Compliance Guard
 * Memfilter transaksi berbahaya, ilegal, asusila, narkotika, judi, alkohol, rokok/tembakau.
 */

// 1. Kamus Kata Terlarang (Restricted & Prohibited Keywords)
export const PROHIBITED_KEYWORDS = {
  // A. Narkoba & Zat Adiktif Berbahaya
  narkoba: [
    'narkoba', 'narkotika', 'sabu', 'ganja', 'weed', 'marijuana', 'heroin', 'putaw',
    'kokain', 'ekstasi', 'inex', 'pil koplo', 'tramadol', 'sinte', 'tembakau gorila',
    'kecubung', 'morfin', 'lsd', 'shabu', 'cimeng', 'ganja sintetis', 'boti'
  ],

  // B. Rokok, Tembakau & Vape
  rokok: [
    'rokok', 'sampoerna', 'surya', 'marlboro', 'esse', 'gudang garam', 'djarum',
    'djarum super', 'magnum', 'camel', 'lucky strike', 'la lights', 'dunhill',
    'vape', 'pod vape', 'liquid vape', 'vape liquid', 'cartridge pod', 'tembakau',
    'tingwe', 'cerutu', 'cigar', 'iqos', 'terea', 'juul', 'relx'
  ],

  // C. Minuman Keras & Alkohol
  alkohol: [
    'alkohol', 'miras', 'minuman keras', 'beer', 'bir', 'bintang beer', 'anker beer',
    'heineken', 'guinness', 'whiskey', 'vodka', 'soju', 'ciu', 'tuak', 'arak',
    'amer', 'anggur merah', 'cap orang tua', 'kawa kawa', 'soju chuseok', 'cocktail',
    'tequila', 'gin', 'rum', 'soju bae', 'liquor', 'brandy', 'whisky'
  ],

  // D. Judi, Slot & Taruhan
  judi: [
    'judi', 'judi online', 'judol', 'slot', 'slot gacor', 'pragmatic', 'zeus slot',
    'olympus slot', 'mahjong ways', 'togel', 'judi bola', 'sbobet', 'taruhan',
    'kasino', 'casino', 'poker uang asli', 'domino qq online', 'sabung ayam',
    'roulette online', 'baccarat online', 'bandar judi', 'depo slot', 'wd slot'
  ],

  // E. Konten Asusila & Prostitusi
  asusila: [
    'open bo', 'bo cewek', 'massage plus', 'pijat plus', 'spa plus', 'vcs', 'video call sex',
    'video bokep', 'video porno', 'beli konten 18+', 'onlyfans', 'openbo', 'prostitusi',
    'sewa cewek', 'gigolo', 'kondom pesta', 'alat bantu sex', 'sex toys', 'dildo', 'masturbasi'
  ],

  // F. Senjata & Bahan Peledak Ilegal
  senjata_ilegal: [
    'senjata api', 'senpi ilegal', 'pistol rakitan', 'peluru tajam', 'bom molotov',
    'bahan peledak', 'petasan ledak', 'airsoft tanpa izin', 'celurit tawuran'
  ],

  // G. Kata Kasar, Kotor & Makian
  kata_kasar: [
    'tai', 'taik', 'tahi', 'anjing', 'anjrit', 'anjir', 'babi', 'monyet', 'kuntul',
    'kontol', 'memek', 'jancok', 'jancuk', 'pantek', 'bangsat', 'bedebah', 'bajingan',
    'pukimak', 'pepek', 'kampang', 'asu', 'bajigur', 'tolol', 'goblok', 'bego', 'idiot'
  ]
};

// Flatten and sort by length descending for greedy matching
const ALL_PROHIBITED_ENTRIES = [];
for (const [category, keywords] of Object.entries(PROHIBITED_KEYWORDS)) {
  for (const kw of keywords) {
    ALL_PROHIBITED_ENTRIES.push({
      category,
      keyword: kw.toLowerCase().trim()
    });
  }
}
ALL_PROHIBITED_ENTRIES.sort((a, b) => b.keyword.length - a.keyword.length);

/**
 * Normalisasi teks untuk deteksi ketat
 */
function normalizeForSafetyCheck(text) {
  if (!text) return '';
  return text
    .toString()
    .toLowerCase()
    .replace(/[._\-+,/\\#@!$%^&*()~`"';:?<>={}[\]]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Memeriksa apakah teks input (judul transaksi, catatan, atau ucapan suara) mengandung konten terlarang.
 * @param {string} text - Teks yang akan diperiksa
 * @returns {{ isProhibited: boolean, category?: string, matchedKeyword?: string, reason?: string }}
 */
export function checkProhibitedContent(text, customLang) {
  if (!text || typeof text !== 'string') {
    return { isProhibited: false };
  }

  let lang = customLang;
  if (!lang) {
    try {
      lang = localStorage.getItem('user_app_lang') || 'id';
    } catch {
      lang = 'id';
    }
  }

  const cleanText = normalizeForSafetyCheck(text);
  const paddedText = ` ${cleanText} `;

  // Pengecualian Aman: tabir surya (skincare), panel surya (energi/elektronik), dll.
  if (/\b(tabir surya|panel surya|tenaga surya|listrik surya|pembangkit surya)\b/i.test(cleanText)) {
    return { isProhibited: false };
  }

  for (const entry of ALL_PROHIBITED_ENTRIES) {
    const kw = entry.keyword;
    // Cek whole word match atau phrase match
    if (paddedText.includes(` ${kw} `) || cleanText === kw) {
      let categoryLabel = 'Aktivitas Ilegal';
      if (lang === 'en') {
        categoryLabel = 'Illegal Activity';
        if (entry.category === 'rokok') categoryLabel = 'Tobacco / Smoking';
        if (entry.category === 'alkohol') categoryLabel = 'Alcohol / Liquor';
        if (entry.category === 'narkoba') categoryLabel = 'Narcotics & Drugs';
        if (entry.category === 'judi') categoryLabel = 'Gambling / Betting';
        if (entry.category === 'asusila') categoryLabel = 'Adult Content / Prostitution';
        if (entry.category === 'senjata_ilegal') categoryLabel = 'Weapons & Hazardous Materials';
        if (entry.category === 'kata_kasar') categoryLabel = 'Profanity / Inappropriate Language';
      } else {
        if (entry.category === 'rokok') categoryLabel = 'Rokok / Tembakau';
        if (entry.category === 'alkohol') categoryLabel = 'Minuman Keras / Alkohol';
        if (entry.category === 'narkoba') categoryLabel = 'Narkotika & Zat Terlarang';
        if (entry.category === 'judi') categoryLabel = 'Perjudian / Taruhan';
        if (entry.category === 'asusila') categoryLabel = 'Konten Asusila / Pornografi';
        if (entry.category === 'senjata_ilegal') categoryLabel = 'Senjata & Bahan Berbahaya';
        if (entry.category === 'kata_kasar') categoryLabel = 'Bahasa Kasar / Kotor';
      }

      const reason = lang === 'en'
        ? `Logging "${kw}" (${categoryLabel}) is prohibited in this app to maintain financial ethics and compliance.`
        : `Pencatatan "${kw}" (${categoryLabel}) tidak diizinkan di aplikasi ini demi menjaga etika dan kepatuhan finansial.`;

      return {
        isProhibited: true,
        category: entry.category,
        matchedKeyword: kw,
        categoryLabel,
        reason
      };
    }
  }

  return { isProhibited: false };
}

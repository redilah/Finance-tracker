/**
 * Noise & Environmental Sound Filter for Cassiel Voice AI
 * Mendeteksi dan membedakan ucapan manusia transaksi nyata vs:
 * 1. Suara Hewan (Kucing, Anjing, Burung, Sapi, dll.)
 * 2. Suara Musik, Nyanyian & Senandung (Lirik, Melodi, Instrumen, dll.)
 * 3. Suara Benda Jatuh, Benturan & Ketukan (Gubrak, Gedebuk, Prang, dll.)
 * 4. Obrolan Acak / Tes Mic Non-Finansial (Tes 1 2 3, Halo-halo, dll.)
 */

// 1. Pola Suara Hewan & Onomatopoeia
export const ANIMAL_SOUND_PATTERNS = [
  /\b(meong|meow|miaw|miaow|ngeong|meoo+ng|meo+w)\b/gi,
  /\b(guk\s*guk|guguk|woof|bark|menggonggong|gonggong)\b/gi,
  /\b(kukuruyuk|petok\s*petok|kotek\s*kotek|kwek\s*kwek|kuek\s*kuek|berkokok)\b/gi,
  /\b(cit\s*cit|cuit\s*cuit|cicit|kicau|kicauan)\b/gi,
  /\b(mbee|mbee+k|mbeee|moo|mooo|embek)\b/gi,
  /\b(tokek|cicak|suara\s*jangkrik|jangkrik)\b/gi,
  /\b(suara\s*(kucing|anjing|burung|ayam|hewan|binatang))\b/gi
];

// 2. Pola Suara Musik, Senandung, Nyanyian & Latar Audio
export const MUSIC_AND_SINGING_PATTERNS = [
  /\b(la\s*la\s*la|lalala|tra\s*la\s*la|na\s*na\s*na|nanana|du\s*du\s*du|dududu|da\s*da\s*da|dadada)\b/gi,
  /\b(hm\s*hm\s*hm|humming|oh\s*oh\s*oh|yeh\s*yeh|yeah\s*yeah)\b/gi,
  /\b(jreng|genjreng|jreng\s*jreng|tring|melodi|irama|instrumental|backsound|soundtrack)\b/gi,
  /\b(suara\s*(musik|lagu|radio|tv|televisi|gitar|piano|drum|trompet))\b/gi,
  /\b(nyanyi|bernyanyi|lagu\s*(favorit|terbaru|lama)|lirik\s*lagu|nada\s*dering|ringtone)\b/gi
];

// 3. Pola Suara Benda Jatuh, Benturan, Gesekan & Ketukan Fisik
export const IMPACT_AND_FALL_PATTERNS = [
  /\b(gubrak|gedubrak|gedebuk|gedebug|gedebak|gedebuk|brak|brukk|bruk|brakk|prak|pyar|pyarr|prang|klontang|kelontang|klotak|kelotak)\b/gi,
  /\b(debuk|blar|bletak|pletak|pletuk|ctar|krak|krek|krik)\b/gi,
  /\b(tok\s*tok\s*tok|tok\s*tok|tuk\s*tuk|tek\s*tek|tap\s*tap|dug\s*dug|deg\s*deg|klik\s*klik)\b/gi,
  /\b(krosok\s*krosok|sreeek|srek|krek)\b/gi,
  /\b(uhuk\s*uhuk|hacim|hachim|hachi|bersin|batuk|terbatuk)\b/gi,
  /\b(suara\s*(jatuh|benda\s*jatuh|barang\s*jatuh|benturan|kebanting|tabrakan))\b/gi,
  /\b(benda\s*jatuh|barang\s*jatuh|jatuh\s*kebanting|piring\s*pecah|gelas\s*pecah)\b/gi
];

// 4. Obrolan Acak / Tes Mic Non-Finansial
export const NON_FINANCIAL_CHATTER_PATTERNS = [
  /\b(tes\s*mic|mic\s*testing|testing\s*mic|cek\s*suara|tes\s*suara|coba\s*suara|tes\s*1\s*2\s*3|cek\s*1\s*2\s*3|one\s*two\s*three)\b/gi,
  /\b(halo\s*halo|halo\s*tes|assalamualaikum|selamat\s*(pagi|siang|sore|malam)|apa\s*kabar|lagi\s*apa)\b/gi,
  /\b(siapa\s*(disana|kamu|ini)|ada\s*orang\s*gak|woi|oi\s*oi|hey\s*hey)\b/gi,
  /\b(oke\s*google|hey\s*siri|hai\s*siri|alexa|buka\s*youtube|nyalain\s*lampu)\b/gi,
  /\b(wkwk|wkwkwk|hahaha|hehehe|hihihi|hohoho)\b/gi
];

/**
 * Memeriksa apakah teks ucapan adalah murni suara kebisingan lingkungan,
 * hewan, musik, benda jatuh, atau obrolan non-finansial.
 *
 * @param {string} text - Teks ucapan yang diterima dari Speech Recognition
 * @returns {{ isNoise: boolean, noiseType?: string, reason?: string }}
 */
export function evaluateNoise(text) {
  if (!text || typeof text !== 'string') {
    return { isNoise: true, noiseType: 'EMPTY', reason: 'Teks kosong atau tidak valid' };
  }

  const clean = text.trim().toLowerCase();

  // 1. Periksa Suara Hewan
  for (const pattern of ANIMAL_SOUND_PATTERNS) {
    if (pattern.test(clean)) {
      return {
        isNoise: true,
        noiseType: 'ANIMAL_SOUND',
        reason: 'Suara hewan terdeteksi'
      };
    }
  }

  // 2. Periksa Suara Musik & Nyanyian
  for (const pattern of MUSIC_AND_SINGING_PATTERNS) {
    if (pattern.test(clean)) {
      return {
        isNoise: true,
        noiseType: 'MUSIC_OR_SINGING',
        reason: 'Suara musik atau senandung terdeteksi'
      };
    }
  }

  // 3. Periksa Benda Jatuh & Benturan
  for (const pattern of IMPACT_AND_FALL_PATTERNS) {
    if (pattern.test(clean)) {
      return {
        isNoise: true,
        noiseType: 'IMPACT_OR_FALL',
        reason: 'Suara benda jatuh atau benturan terdeteksi'
      };
    }
  }

  // 4. Periksa Tes Mic & Obrolan Non-Finansial
  for (const pattern of NON_FINANCIAL_CHATTER_PATTERNS) {
    if (pattern.test(clean)) {
      return {
        isNoise: true,
        noiseType: 'NON_FINANCIAL_CHATTER',
        reason: 'Obrolan non-transaksi atau tes mic terdeteksi'
      };
    }
  }

  // 5. Periksa Teks Sangat Pendek yang Tidak Bermakna (misal huruf tunggal / vokal acak tanpa nominal)
  const words = clean.split(/\s+/).filter(Boolean);
  if (words.length === 1) {
    const single = words[0];
    const gibberishSyllables = ['uh', 'ah', 'um', 'umm', 'eh', 'ehh', 'sss', 'shh', 'zzz', 'brr', 'brrr', 'woy', 'hmm', 'hm'];
    if (gibberishSyllables.includes(single)) {
      return {
        isNoise: true,
        noiseType: 'GIBBERISH_SYLLABLE',
        reason: 'Vokal acak atau desah suara terdeteksi'
      };
    }
  }

  return { isNoise: false };
}

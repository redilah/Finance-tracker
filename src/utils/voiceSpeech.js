/**
 * Natural High-Definition Indonesian Speech Synthesis Engine
 * Menggunakan High-Definition Google Indonesian Natural Stream Audio (100% Gratis & Open-Source)
 * Dilengkapi Pemecah Klausa Cerdas, Normalisasi Terbilang Rupiah & Fallback SpeechSynthesis.
 */

// Active Audio Instance Tracker untuk kontrol Stop / Pause
let currentAudio = null;
let isAudioCancelled = false;

/**
 * Konversi Angka ke Terbilang Bahasa Indonesia
 */
export function numberToIndonesianWords(num) {
  if (num === 0) return 'nol';
  if (!num || isNaN(num)) return '';

  const units = ['', 'satu', 'dua', 'tiga', 'empat', 'lima', 'enam', 'tujuh', 'delapan', 'sembilan', 'sepuluh', 'sebelas'];

  function convert(n) {
    n = Math.floor(Math.abs(n));
    if (n < 12) {
      return units[n];
    } else if (n < 20) {
      return convert(n - 10) + ' belas';
    } else if (n < 100) {
      const tens = Math.floor(n / 10);
      const rem = n % 10;
      return convert(tens) + ' puluh' + (rem > 0 ? ' ' + convert(rem) : '');
    } else if (n < 200) {
      return 'seratus' + (n - 100 > 0 ? ' ' + convert(n - 100) : '');
    } else if (n < 1000) {
      const hundreds = Math.floor(n / 100);
      const rem = n % 100;
      return convert(hundreds) + ' ratus' + (rem > 0 ? ' ' + convert(rem) : '');
    } else if (n < 2000) {
      return 'seribu' + (n - 1000 > 0 ? ' ' + convert(n - 1000) : '');
    } else if (n < 1000000) {
      const thousands = Math.floor(n / 1000);
      const rem = n % 1000;
      return convert(thousands) + ' ribu' + (rem > 0 ? ' ' + convert(rem) : '');
    } else if (n < 1000000000) {
      const millions = Math.floor(n / 1000000);
      const rem = n % 1000000;
      return convert(millions) + ' juta' + (rem > 0 ? ' ' + convert(rem) : '');
    } else if (n < 1000000000000) {
      const billions = Math.floor(n / 1000000000);
      const rem = n % 1000000000;
      return convert(billions) + ' miliar' + (rem > 0 ? ' ' + convert(rem) : '');
    }
    return n.toString();
  }

  return convert(num).replace(/\s+/g, ' ').trim();
}

/**
 * Normalisasi Kalimat Finansial Menjadi Frasa Suara Alami (Anti-Robot & Anti-Aksen Asing)
 */
export function formatNaturalIndonesianSpeech(rawText) {
  if (!rawText || typeof rawText !== 'string') return '';

  let speech = rawText;

  // 1. Bersihkan Simbol, Emoji & Tanda Kurung yang memicu jeda patah-patah
  speech = speech
    .replace(/[✨🎯💰📉📈🏷️💳🏦📝📊🔄🗑️✏️❌✅👑]/gu, ' ')
    .replace(/[•\(\)\[\]\{\}\*\_~—–➔<>|#]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // 2. Format Mata Uang: "Rp 150.000" / "Rp 1.500.000" -> "seratus lima puluh ribu rupiah"
  speech = speech.replace(/(?:rp\.?|rupiah)?\s*([0-9]{1,3}(?:\.[0-9]{3})+(?:,[0-9]+)?|[0-9]+)\s*(?:rupiah)?/gi, (match, numStr) => {
    let cleanNum = 0;
    if (numStr.includes('.')) {
      cleanNum = parseFloat(numStr.replace(/\./g, ''));
    } else {
      cleanNum = parseFloat(numStr.replace(',', '.'));
    }
    if (!isNaN(cleanNum) && cleanNum > 0) {
      const words = numberToIndonesianWords(cleanNum);
      return ` ${words} rupiah `;
    }
    return match;
  });

  // 3. Format Persentase: "80%" -> "delapan puluh persen"
  speech = speech.replace(/(\d+)\s*%/g, (match, n) => {
    const num = parseInt(n, 10);
    return ` ${numberToIndonesianWords(num)} persen `;
  });

  // 4. Format Angka Transaksi / Kali: "3 transaksi" -> "tiga transaksi", "5 kali" -> "lima kali"
  speech = speech.replace(/(\d+)\s*(transaksi|kali|orang|akun|dompet|item|kategori)/gi, (match, n, unit) => {
    const num = parseInt(n, 10);
    return ` ${numberToIndonesianWords(num)} ${unit} `;
  });

  // 5. Normalisasi Fonetik Singkatan Bank & E-Wallet agar diucapkan fasih
  const PHONETIC_MAP = [
    { pattern: /\bbca\b/gi, replacement: 'B C A' },
    { pattern: /\bbrimo\b/gi, replacement: 'B R I mo' },
    { pattern: /\bbri\b/gi, replacement: 'B R I' },
    { pattern: /\bbsi\b/gi, replacement: 'B S I' },
    { pattern: /\bbni\b/gi, replacement: 'B N I' },
    { pattern: /\bqris\b/gi, replacement: 'Kris' },
    { pattern: /\bgopay\b/gi, replacement: 'Go-pay' },
    { pattern: /\bshopeepay\b/gi, replacement: 'Shopee-pay' },
    { pattern: /\bovo\b/gi, replacement: 'O-V-O' },
    { pattern: /\bdana\b/gi, replacement: 'Dana' },
    { pattern: /\bwi-?fi\b/gi, replacement: 'Wai-fai' },
    { pattern: /\blivin\b/gi, replacement: 'Livin' }
  ];

  for (const item of PHONETIC_MAP) {
    speech = speech.replace(item.pattern, item.replacement);
  }

  // 6. Bersihkan spasi ganda dan tanda baca yang berlebih
  speech = speech
    .replace(/([.,])\1+/g, '$1')
    .replace(/\s+([.,])/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();

  return speech;
}

/**
 * Pemecah Teks Menjadi Potongan Audio (Max 120 Karakter per Chunk)
 */
function splitTextIntoAudioChunks(text, maxLength = 120) {
  if (!text) return [];
  const sentences = text.split(/(?<=[.?!,])\s+/);
  const chunks = [];
  let current = '';

  for (const s of sentences) {
    if ((current + ' ' + s).trim().length <= maxLength) {
      current = (current + ' ' + s).trim();
    } else {
      if (current) chunks.push(current);
      if (s.length > maxLength) {
        const words = s.split(/\s+/);
        let wordChunk = '';
        for (const w of words) {
          if ((wordChunk + ' ' + w).trim().length <= maxLength) {
            wordChunk = (wordChunk + ' ' + w).trim();
          } else {
            if (wordChunk) chunks.push(wordChunk);
            wordChunk = w;
          }
        }
        if (wordChunk) chunks.push(wordChunk);
        current = '';
      } else {
        current = s;
      }
    }
  }
  if (current) chunks.push(current);
  return chunks.filter(Boolean);
}

/**
 * Memilih Suara Bahasa Indonesia Terbaik (Fallback Browser SpeechSynthesis)
 */
export function getBestIndonesianVoice() {
  if (typeof window === 'undefined' || !window.speechSynthesis) return null;
  const voices = window.speechSynthesis.getVoices() || [];
  if (voices.length === 0) return null;

  const premiumIdVoice = voices.find(v => {
    const lang = (v.lang || '').toLowerCase();
    const name = (v.name || '').toLowerCase();
    const isIdLang = lang.startsWith('id') || lang.startsWith('in') || lang === 'id_id' || lang === 'id-id';
    const isNatural = name.includes('google') || name.includes('indonesian') || name.includes('damayanti') || name.includes('gadis') || name.includes('natural') || name.includes('indonesia');
    return isIdLang && isNatural;
  });
  if (premiumIdVoice) return premiumIdVoice;

  const generalIdVoice = voices.find(v => {
    const lang = (v.lang || '').toLowerCase();
    return lang.startsWith('id') || lang.startsWith('in') || lang === 'id_id' || lang === 'id-id';
  });
  if (generalIdVoice) return generalIdVoice;

  return null;
}

/**
 * Hentikan Pemutaran Suara Secara Total
 */
export function stopIndonesianSpeech() {
  isAudioCancelled = true;

  if (currentAudio) {
    try {
      currentAudio.pause();
      currentAudio.currentTime = 0;
      currentAudio.src = '';
    } catch {}
    currentAudio = null;
  }

  if (typeof window !== 'undefined' && window.speechSynthesis) {
    try {
      window.speechSynthesis.cancel();
    } catch {}
  }
}

/**
 * Pemutar Suara Natural Bahasa Indonesia (Google HD Natural Voice Stream)
 */
export function speakIndonesian(rawText, { onStart, onEnd, onError } = {}) {
  stopIndonesianSpeech(); // Reset dan bersihkan pemutaran aktif
  isAudioCancelled = false;

  const naturalSpeechText = formatNaturalIndonesianSpeech(rawText);
  if (!naturalSpeechText) return;

  const chunks = splitTextIntoAudioChunks(naturalSpeechText, 140);
  if (chunks.length === 0) return;

  let currentChunkIndex = 0;

  const playChunk = (index) => {
    if (isAudioCancelled || index >= chunks.length) {
      if (!isAudioCancelled && onEnd) onEnd();
      return;
    }

    const chunkText = chunks[index];
    // Google Translate Natural Indonesian Speech Endpoint (100% Free & Open)
    const audioUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=id&client=tw-ob&q=${encodeURIComponent(chunkText)}`;

    const audio = new Audio();
    currentAudio = audio;
    audio.crossOrigin = 'anonymous';

    audio.oncanplaythrough = () => {
      if (isAudioCancelled) return;
      if (index === 0 && onStart) onStart();
      audio.play().catch(err => {
        console.warn('Audio play auto-play blocked, fallbacking to WebSpeech:', err);
        fallbackWebSpeech(naturalSpeechText, { onStart, onEnd, onError });
      });
    };

    audio.onended = () => {
      if (isAudioCancelled) return;
      currentChunkIndex++;
      playChunk(currentChunkIndex);
    };

    audio.onerror = (e) => {
      console.warn('Google TTS stream error, fallbacking to WebSpeech:', e);
      fallbackWebSpeech(naturalSpeechText, { onStart, onEnd, onError });
    };

    audio.src = audioUrl;
    audio.load();
  };

  // Fallback ke Web Speech API jika offline atau streaming gagal
  const fallbackWebSpeech = (text, callbacks = {}) => {
    if (isAudioCancelled) return;
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      if (callbacks.onError) callbacks.onError(new Error('Speech not supported'));
      return;
    }

    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'id-ID';
      utterance.rate = 0.94;
      utterance.pitch = 1.0;

      const voice = getBestIndonesianVoice();
      if (voice) utterance.voice = voice;

      if (callbacks.onStart) utterance.onstart = callbacks.onStart;
      if (callbacks.onEnd) utterance.onend = callbacks.onEnd;
      if (callbacks.onError) utterance.onerror = callbacks.onError;

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      if (callbacks.onError) callbacks.onError(err);
    }
  };

  playChunk(0);
}

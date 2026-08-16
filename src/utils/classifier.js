/**
 * Cassiel Hybrid Transaction Classifier
 * 100% offline, deterministic, explainable, and lightweight.
 *
 * Public API kept backward-compatible:
 *   - CLASSIFIER_CONFIG
 *   - isConsumptiveHybrid()
 *   - explainClassification()
 *
 * Internal pipeline:
 *   normalization -> exact/context/fuzzy signals -> Naive Bayes ->
 *   evidence aggregation -> confidence + explanation
 */

// ============================================================================
// CONFIG
// ============================================================================
export const CLASSIFIER_CONFIG = {
  NB_THRESHOLD: 0.55,
  BARBER_ESSENTIAL_MAX_AMOUNT: 50000,
  FOOD_SINGLE_CONSUMPTIVE_THRESHOLD: 50000,
  FOOD_DAILY_CONSUMPTIVE_THRESHOLD: 75000,
  COFFEE_SINGLE_CONSUMPTIVE_THRESHOLD: 20000,
  COFFEE_DAILY_CONSUMPTIVE_THRESHOLD: 20000,

  // Final score. Above this => consumptive.
  FINAL_CONSUMPTIVE_THRESHOLD: 0.52,
  HIGH_CONFIDENCE_THRESHOLD: 0.80,
  MEDIUM_CONFIDENCE_THRESHOLD: 0.60,

  // Fuzzy matching is intentionally conservative.
  FUZZY_MIN_TOKEN_LENGTH: 4,
  FUZZY_SIMILARITY_THRESHOLD: 0.84,
  FUZZY_MAX_LENGTH_DIFF: 2,

  // Signal weights. These are defaults and should eventually be tuned on real,
  // manually-labelled Cassiel transactions.
  WEIGHTS: {
    TAXONOMY: 0.62,
    STRONG_ESSENTIAL: 0.55,
    ABSOLUTE_ESSENTIAL: 1.00,
    CONTEXT_CONSUMPTIVE: 0.58,
    CONTEXT_ESSENTIAL: 0.58,
    FUZZY_CONSUMPTIVE: 0.38,
    FUZZY_ESSENTIAL: 0.38,
    CATEGORY: 0.20,
    AMOUNT: 0.10,
    NB: 0.30,
  },
};

// ============================================================================
// TAXONOMY DATA
// ============================================================================
const CONSUMPTIVE_TAXONOMY = {
  entertainment: [
    'bioskop', 'cinema', 'film', 'movie', 'konser', 'gig', 'ticket',
    'tiketing', 'tiket nonton', 'festival', 'theater', 'teater', 'karaoke',
    'party', 'pesta', 'clubbing', 'dugem', 'klub',
  ],
  gaming: [
    'game', 'games', 'topup', 'top up', 'gacha', 'diamond', 'skin', 'steam',
    'playstation', 'ps5', 'ps4', 'xbox', 'nintendo', 'voucher game',
    'mobile legend', 'mobile legends', 'pubg', 'free fire', 'valorant',
    'genshin', 'genshin impact', 'roblox', 'in-game', 'in game',
  ],
  lifestyle: [
    'barber', 'barbershop', 'salon', 'potong rambut', 'haircut', 'skincare', 'skin care',
    'face wash', 'facewash', 'facial wash', 'facial foam', 'cleanser', 'micellar water',
    'moisturizer', 'sunscreen', 'sunblock', 'serum', 'toner', 'pelembab', 'pelembap',
    'cosmetics', 'makeup', 'make up', 'spa', 'massage', 'pijat', 'creambath',
    'facial', 'treatment', 'nail art', 'manicure', 'pedicure',
  ],
  fashion: [
    'fashion', 'baju', 'celana', 'sepatu', 'sneakers', 'hoodie', 'jaket',
    'tas', 'dompet', 'aksesoris', 'outfit', 'thrifting', 'distro', 'zara',
    'h m', 'uniqlo', 'kaos', 'kemeja',
  ],
  food_beverage: [
    'coffee', 'kopi', 'gofood', 'grabfood', 'shopeefood', 'boba', 'starbucks',
    'mixue', 'nongkrong', 'cafe', 'kafe', 'dessert', 'snack', 'fastfood',
    'junkfood', 'junk food', 'jajan', 'cemilan', 'kopi kekinian',
  ],
  subscriptions: [
    'subscription', 'langganan streaming', 'netflix', 'spotify',
    'youtube premium', 'disney', 'disney plus', 'hbogo', 'hbo go', 'prime video',
    'apple music', 'patreon', 'vidio premium', 'viu',
  ],
  hobbies: [
    'action figure', 'toys', 'mainan', 'koleksi', 'photocard', 'album',
    'merch', 'merchandise', 'hobby', 'hobi', 'figma', 'gunpla', 'lego',
  ],
};

// Only phrases that are strong enough to be hard essential evidence.
const ABSOLUTE_ESSENTIAL_PATTERNS = [
  'spp', 'listrik', 'pdam', 'sewa kost', 'sewa kos', 'kontrakan',
  'cicilan rumah', 'obat resep', 'obat', 'apotek', 'rumah sakit', 'opname',
  'rawat inap', 'perawatan medis', 'beras', 'sembako', 'galon',
];

// Context-sensitive evidence. These are deliberately NOT hard overrides.
const STRONG_ESSENTIAL_PATTERNS = [
  'pulkam', 'mudik', 'pulang kampung', 'otw pulang', 'otw balik',
  'tiket dinas', 'dinas kantor', 'transport dinas', 'proyek kantor',
  'project kantor', 'bensin kerja', 'bensin harian kerja', 'service motor kerja',
  'bayar semester', 'semester kuliah', 'buku pelajaran', 'kursus wajib',
  'ujian sekolah', 'biaya berobat', 'transfer buat ibu', 'kirim uang orangtua',
  'orangtua', 'ortu', 'duka', 'musibah', 'darurat', 'emergency', 'hospital',
  'clinic', 'klinik', 'sekolah', 'kuliah',
];

// Explicit contextual rules prevent ambiguous single-word evidence from taking
// control of the entire decision.
const CONTEXT_RULES = [
  { patterns: ['obat', 'ibu'], className: 'essential', weight: 0.85, name: 'obat_untuk_keluarga' },
  { patterns: ['hadiah', 'ibu'], className: 'consumptive', weight: 0.75, name: 'hadiah_untuk_ibu' },
  { patterns: ['hadiah', 'ayah'], className: 'consumptive', weight: 0.75, name: 'hadiah_untuk_ayah' },
  { patterns: ['hadiah', 'anak'], className: 'consumptive', weight: 0.70, name: 'hadiah_untuk_anak' },
  { patterns: ['nonton', 'bioskop'], className: 'consumptive', weight: 0.90, name: 'nonton_bioskop' },
  { patterns: ['nonton', 'konser'], className: 'consumptive', weight: 0.90, name: 'nonton_konser' },
  { patterns: ['nonton', 'film'], className: 'consumptive', weight: 0.85, name: 'nonton_film' },
  { patterns: ['nonton', 'tutorial'], className: 'essential', weight: 0.55, name: 'tutorial' },
  { patterns: ['nonton', 'kuliah'], className: 'essential', weight: 0.65, name: 'materi_kuliah' },
  { patterns: ['nonton', 'belajar'], className: 'essential', weight: 0.60, name: 'materi_belajar' },
  { patterns: ['kopi', 'kerja'], className: 'essential', weight: 0.20, name: 'kopi_saat_kerja' },
];

// Lightweight aliases for common Indonesian/mobile typing variations.
const ALIASES = {
  topup: 'top up',
  nongki: 'nongkrong',
  nongkrongin: 'nongkrong',
  ngopi: 'kopi',
  ngopii: 'kopi',
  santuy: 'santai',
  starbuk: 'starbucks',
  starbuck: 'starbucks',
  netflx: 'netflix',
  gofoodd: 'gofood',
  shope: 'shopee',
  gopud: 'gofood',
  bobaah: 'boba',
  'mlbb': 'mobile legends',
  ff: 'free fire',
};

const CATEGORY_TO_GROUP = {
  entertainment: 'entertainment',
  gaming: 'gaming',
  game: 'gaming',
  lifestyle: 'lifestyle',
  fashion: 'fashion',
  subscription: 'subscriptions',
  hobby: 'hobbies',
  party: 'entertainment',
};

// ============================================================================
// TEXT UTILITIES
// ============================================================================
function normalize(text) {
  return (text || '')
    .toString()
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenize(text) {
  return normalize(text)
    .split(' ')
    .filter((token) => token.length > 1);
}

function canonicalizeText(text) {
  return tokenize(text)
    .map((token) => canonicalizeToken(token))
    .join(' ')
    .trim();
}

function pad(text) {
  return ` ${normalize(text)} `;
}

function hasKeyword(normalizedText, keyword) {
  const kw = normalize(keyword);
  return Boolean(kw) && pad(normalizedText).includes(` ${kw} `);
}

function canonicalizeToken(token) {
  const normalized = normalize(token);
  return ALIASES[normalized] || normalized;
}

function levenshtein(a, b) {
  if (a === b) return 0;
  if (!a) return b.length;
  if (!b) return a.length;

  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  let curr = new Array(b.length + 1).fill(0);

  for (let i = 1; i <= a.length; i++) {
    curr[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(
        curr[j - 1] + 1,
        prev[j] + 1,
        prev[j - 1] + cost
      );
    }
    [prev, curr] = [curr, prev];
  }

  return prev[b.length];
}

function similarity(a, b) {
  const maxLength = Math.max(a.length, b.length);
  if (maxLength === 0) return 1;
  return 1 - levenshtein(a, b) / maxLength;
}

// ============================================================================
// NAIVE BAYES ENGINE
// ============================================================================
class NaiveBayesLocalEngine {
  constructor() {
    this.vocabulary = new Set();
    this.consumptiveCount = 0;
    this.essentialCount = 0;
    this.totalConsumptiveTokens = 0;
    this.totalEssentialTokens = 0;
    this.wordFreqConsumptive = Object.create(null);
    this.wordFreqEssential = Object.create(null);
    this.feedbackKeys = new Set();
    this.trainInitialDataset();
  }

  tokenize(text) {
    return tokenize(text).map(canonicalizeToken);
  }

  train(tokensOrText, isConsumptive) {
    const tokens = Array.isArray(tokensOrText)
      ? tokensOrText.map(canonicalizeToken).filter(Boolean)
      : this.tokenize(tokensOrText);

    if (isConsumptive) this.consumptiveCount++;
    else this.essentialCount++;

    tokens.forEach((token) => {
      this.vocabulary.add(token);
      if (isConsumptive) {
        this.wordFreqConsumptive[token] = (this.wordFreqConsumptive[token] || 0) + 1;
        this.totalConsumptiveTokens++;
      } else {
        this.wordFreqEssential[token] = (this.wordFreqEssential[token] || 0) + 1;
        this.totalEssentialTokens++;
      }
    });
  }

  trainFromFeedback(text, isConsumptive) {
    const normalized = normalize(text);
    if (!normalized) return false;
    const key = `${isConsumptive ? 'c' : 'e'}:${normalized}`;
    if (this.feedbackKeys.has(key)) return false;
    this.feedbackKeys.add(key);
    this.train(normalized, isConsumptive);
    return true;
  }

  trainInitialDataset() {
    const consumptiveSamples = [
      'nongkrong boba', 'beli skin ml', 'gacha waifu', 'thrifting baju',
      'ngopi santai', 'tiket konser musik', 'staycation hotel', 'jajan dessert',
      'checkout shopee baju', 'kopi kekinian', 'creambath salon', 'nonton premiere',
      'topup diamond mlbb', 'snack mall', 'sepatu ori', 'buy merch kpop',
      'game pass xbox', 'beli baju lebaran gaya', 'streaming netflix bulanan',
      'top up free fire', 'jajan cimol kekinian', 'beli parfum niche',
      'sepatu sneakers limited', 'gacha genshin', 'bioskop midnight',
      'cabut bulu spa', 'photocard album kpop', 'preorder figma anime',
      'beli boba kekinian', 'nonton konser luar kota', 'skincare korea',
      'outfit ootd baru', 'buka puasa fancy resto', 'karaoke bareng temen',
      'checkout tas branded', 'beli mainan gunpla', 'langganan hbo max',
      'jajan mixue', 'beli voucher steam', 'gaming chair baru',
      'hadiah ibu', 'hadiah ayah', 'hadiah anak', 'nongki bareng teman',
      'checkout sepatu', 'nonton film', 'jajan malam', 'beli makeup',
    ];

    const essentialSamples = [
      'beli obat pusing', 'bayar spp sekolah', 'pulang kampung lebaran',
      'tiket dinas kantor', 'beras sembako', 'bayar listrik rumah',
      'kontrakan bulan ini', 'biaya berobat dokter', 'bensin harian kerja',
      'buku pelajaran kuliah', 'isi galon air', 'service motor kerja',
      'bayar semester kuliah', 'obat resep dokter', 'ongkos pulang kampung',
      'bayar cicilan rumah', 'beli beras 5kg', 'bayar iuran sekolah anak',
      'transport dinas luar kota', 'biaya rawat inap', 'bayar pdam bulanan',
      'kirim uang orangtua', 'beli obat keluarga sakit', 'biaya ujian sekolah',
      'bensin motor kerja', 'bayar kost bulanan', 'beli galon isi ulang',
      'transfer buat ibu', 'servis motor rutin', 'beli obat apotek',
      'bayar listrik token', 'biaya opname rumah sakit', 'beli sembako bulanan',
      'transport proyek kantor', 'bayar spp anak sekolah', 'obat ibu',
      'nonton tutorial', 'nonton materi kuliah', 'nonton untuk belajar',
      'kopi saat kerja',
    ];

    consumptiveSamples.forEach((sample) => this.train(sample, true));
    essentialSamples.forEach((sample) => this.train(sample, false));
  }

  predictScore(text) {
    const tokens = this.tokenize(text);
    if (tokens.length === 0 || this.consumptiveCount === 0 || this.essentialCount === 0) return 0.5;

    const totalDocs = this.consumptiveCount + this.essentialCount;
    let logProbConsumptive = Math.log(this.consumptiveCount / totalDocs);
    let logProbEssential = Math.log(this.essentialCount / totalDocs);
    const vocabSize = Math.max(this.vocabulary.size, 1);

    // Correct Multinomial Naive Bayes denominator: total token count per class.
    tokens.forEach((token) => {
      const countCons = this.wordFreqConsumptive[token] || 0;
      const countEss = this.wordFreqEssential[token] || 0;
      logProbConsumptive += Math.log(
        (countCons + 1) / (this.totalConsumptiveTokens + vocabSize)
      );
      logProbEssential += Math.log(
        (countEss + 1) / (this.totalEssentialTokens + vocabSize)
      );
    });

    const maxLog = Math.max(logProbConsumptive, logProbEssential);
    const probCons = Math.exp(logProbConsumptive - maxLog);
    const probEss = Math.exp(logProbEssential - maxLog);
    return probCons / (probCons + probEss);
  }
}

const nbEngine = new NaiveBayesLocalEngine();

// ============================================================================
// EXTRACTION + SIGNALS
// ============================================================================
function extractFields(txOrCategory) {
  const categoryName = (txOrCategory.category || txOrCategory.name || '').toString().toLowerCase();
  const categoryId = (txOrCategory.categoryId || txOrCategory.id || '').toString().toLowerCase();
  const title = (txOrCategory.title || '').toString().toLowerCase();
  const amount = Number(txOrCategory.amount) || 0;

  const combinedText = `${categoryName} ${categoryId} ${title}`.trim();
  const normalizedCombined = canonicalizeText(combinedText);
  const paddedText = pad(normalizedCombined);

  return { categoryName, categoryId, title, amount, combinedText, normalizedCombined, paddedText };
}

function findExactMatches(normalizedText, patterns) {
  return patterns.filter((pattern) => hasKeyword(normalizedText, pattern));
}

function findFuzzyMatches(normalizedText, patterns, className) {
  const inputTokens = tokenize(normalizedText).map(canonicalizeToken);
  const candidates = patterns
    .map(normalize)
    .filter((pattern) => pattern && !pattern.includes(' '))
    .filter((pattern) => pattern.length >= CLASSIFIER_CONFIG.FUZZY_MIN_TOKEN_LENGTH);

  const matches = [];
  const seen = new Set();

  for (const inputToken of inputTokens) {
    if (inputToken.length < CLASSIFIER_CONFIG.FUZZY_MIN_TOKEN_LENGTH) continue;
    for (const candidate of candidates) {
      if (seen.has(`${inputToken}:${candidate}`)) continue;
      if (Math.abs(inputToken.length - candidate.length) > CLASSIFIER_CONFIG.FUZZY_MAX_LENGTH_DIFF) continue;
      if (inputToken === candidate) continue;

      const score = similarity(inputToken, candidate);
      if (score >= CLASSIFIER_CONFIG.FUZZY_SIMILARITY_THRESHOLD) {
        matches.push({
          input: inputToken,
          matchedKeyword: candidate,
          similarity: Number(score.toFixed(3)),
          className,
        });
        seen.add(`${inputToken}:${candidate}`);
      }
    }
  }

  return matches;
}

function matchContextRules(normalizedText) {
  return CONTEXT_RULES.filter((rule) =>
    rule.patterns.every((pattern) => hasKeyword(normalizedText, pattern))
  );
}

function calculateAmountSignal(categoryName, categoryId, amount) {
  const normalizedCategory = normalize(`${categoryName} ${categoryId}`);
  const isBarber = hasKeyword(normalizedCategory, 'barber') || categoryId === 'barber';

  if (isBarber) {
    if (amount > 0 && amount < CLASSIFIER_CONFIG.BARBER_ESSENTIAL_MAX_AMOUNT) {
      return { score: -1, reason: 'barber_di_bawah_batas_essential' };
    }
    if (amount >= CLASSIFIER_CONFIG.BARBER_ESSENTIAL_MAX_AMOUNT) {
      return { score: 0.25, reason: 'barber_di_atas_batas' };
    }
  }

  // Small generic signal only. Amount alone never decides the class.
  if (amount <= 0) return { score: 0, reason: 'nominal_tidak_tersedia' };
  if (amount >= 500000) return { score: 0.08, reason: 'nominal_tinggi' };
  if (amount <= 25000) return { score: -0.02, reason: 'nominal_kecil' };
  return { score: 0, reason: 'nominal_netral' };
}

function fuzzyTaxonomyMatch(normalizedText) {
  const results = [];
  for (const [groupName, keywords] of Object.entries(CONSUMPTIVE_TAXONOMY)) {
    results.push(...findFuzzyMatches(normalizedText, keywords, groupName));
  }
  return results;
}

function calculateSignals(txOrCategory) {
  const { categoryId, categoryName, title, amount, normalizedCombined, paddedText } = extractFields(txOrCategory);

  const taxonomyMatches = [];
  for (const [groupName, keywords] of Object.entries(CONSUMPTIVE_TAXONOMY)) {
    const matchedKeywords = findExactMatches(normalizedCombined, keywords);
    if (matchedKeywords.length > 0) {
      taxonomyMatches.push({ group: groupName, keywords: matchedKeywords });
    }
  }

  const absoluteEssentialMatches = findExactMatches(normalizedCombined, ABSOLUTE_ESSENTIAL_PATTERNS);
  const strongEssentialMatches = findExactMatches(normalizedCombined, STRONG_ESSENTIAL_PATTERNS);
  const contextMatches = matchContextRules(normalizedCombined);
  const fuzzyMatches = fuzzyTaxonomyMatch(normalizedCombined);
  const amountSignal = calculateAmountSignal(categoryName, categoryId, amount);
  const nbScore = nbEngine.predictScore(paddedText);

  const canonicalCategory = normalize(`${categoryName} ${categoryId}`);
  const categoryGroup = Object.entries(CATEGORY_TO_GROUP).find(([key]) =>
    hasKeyword(canonicalCategory, key)
  );

  return {
    fields: { categoryId, categoryName, title, amount },
    taxonomyMatches,
    absoluteEssentialMatches,
    strongEssentialMatches,
    contextMatches,
    fuzzyMatches,
    amountSignal,
    nbScore,
    categoryGroup: categoryGroup ? categoryGroup[1] : null,
  };
}

function clamp(value, min = 0, max = 1) {
  return Math.max(min, Math.min(max, value));
}

function aggregateScore(signals) {
  let score = 0.5;
  const reasons = [];

  if (signals.taxonomyMatches.length > 0) {
    score += CLASSIFIER_CONFIG.WEIGHTS.TAXONOMY;
    reasons.push('taxonomy_exact');
  }

  if (signals.categoryGroup) {
    score += CLASSIFIER_CONFIG.WEIGHTS.CATEGORY;
    reasons.push(`category:${signals.categoryGroup}`);
  }

  if (signals.absoluteEssentialMatches.length > 0) {
    score -= CLASSIFIER_CONFIG.WEIGHTS.ABSOLUTE_ESSENTIAL;
    reasons.push('essential_absolute');
  }

  if (signals.strongEssentialMatches.length > 0) {
    score -= CLASSIFIER_CONFIG.WEIGHTS.STRONG_ESSENTIAL;
    reasons.push('essential_strong');
  }

  for (const match of signals.contextMatches) {
    if (match.className === 'consumptive') {
      score += CLASSIFIER_CONFIG.WEIGHTS.CONTEXT_CONSUMPTIVE * match.weight;
      reasons.push(`context:${match.name}`);
    } else {
      score -= CLASSIFIER_CONFIG.WEIGHTS.CONTEXT_ESSENTIAL * match.weight;
      reasons.push(`context:${match.name}`);
    }
  }

  if (signals.fuzzyMatches.length > 0) {
    // Use only the strongest fuzzy evidence to avoid stacking several near-duplicates.
    const strongest = signals.fuzzyMatches.reduce((best, item) =>
      item.similarity > best.similarity ? item : best
    );
    score += CLASSIFIER_CONFIG.WEIGHTS.FUZZY_CONSUMPTIVE * strongest.similarity;
    reasons.push(`fuzzy:${strongest.input}->${strongest.matchedKeyword}`);
  }

  score += signals.amountSignal.score * CLASSIFIER_CONFIG.WEIGHTS.AMOUNT;
  reasons.push(`amount:${signals.amountSignal.reason}`);

  // NB influences the decision, but does not overpower deterministic/contextual evidence.
  score += (signals.nbScore - 0.5) * CLASSIFIER_CONFIG.WEIGHTS.NB;
  reasons.push(`nb:${signals.nbScore.toFixed(3)}`);

  return { score: clamp(score), reasons };
}

function confidenceFromScore(score) {
  return Number((Math.abs(score - 0.5) * 2).toFixed(3));
}

function confidenceLabel(confidence) {
  if (confidence >= CLASSIFIER_CONFIG.HIGH_CONFIDENCE_THRESHOLD) return 'high';
  if (confidence >= CLASSIFIER_CONFIG.MEDIUM_CONFIDENCE_THRESHOLD) return 'medium';
  return 'low';
}

function classifyTransaction(txOrCategory, allTransactions = []) {
  if (!txOrCategory) {
    return {
      isConsumptive: false,
      classification: 'essential',
      confidence: 0,
      confidenceLevel: 'low',
      reason: 'input_kosong',
      signals: null,
    };
  }

  const signals = calculateSignals(txOrCategory);
  const barberBelowLimit = signals.amountSignal.reason === 'barber_di_bawah_batas_essential';

  if (barberBelowLimit) {
    return {
      isConsumptive: false,
      classification: 'essential',
      confidence: 1,
      confidenceLevel: 'high',
      reason: 'barber_di_bawah_batas_essential',
      signals,
    };
  }

  // Food Hybrid Threshold (Option C: Single > 50k OR Daily Accumulation > 75k)
  const catName = (txOrCategory.category || txOrCategory.name || '').toString().toLowerCase();
  const catId = (txOrCategory.categoryId || txOrCategory.id || '').toString().toLowerCase();
  const isFood = catId === 'food' || catName === 'food' || catName === 'makanan' || catName === 'kuliner';

  if (isFood && signals.absoluteEssentialMatches.length === 0) {
    const amount = Number(txOrCategory.amount) || 0;

    // Syarat 1: Single Food Transaction > Rp 50.000
    if (amount > CLASSIFIER_CONFIG.FOOD_SINGLE_CONSUMPTIVE_THRESHOLD) {
      return {
        isConsumptive: true,
        classification: 'consumptive',
        score: 1,
        confidence: 1,
        confidenceLevel: 'high',
        reason: 'food_single_transaction_exceeds_threshold',
        reasons: [`amount:${amount} > ${CLASSIFIER_CONFIG.FOOD_SINGLE_CONSUMPTIVE_THRESHOLD}`],
        signals,
      };
    }

    // Syarat 2: Daily Accumulated Food Expenditure > Rp 75.000
    if (Array.isArray(allTransactions) && allTransactions.length > 0) {
      const todayStr = new Date().toISOString().split('T')[0];
      const targetDate = txOrCategory.date || todayStr;

      const sameDayFoodTotal = allTransactions
        .filter((t) => {
          if (!t) return false;
          if (t.id === txOrCategory.id) return false;
          const tType = (t.type || '').toLowerCase();
          if (tType !== 'expense') return false;
          const tDate = (t.date || '').toString();
          if (!tDate.startsWith(targetDate)) return false;

          const tCatName = (t.category || t.name || '').toString().toLowerCase();
          const tCatId = (t.categoryId || t.id || '').toString().toLowerCase();
          return tCatId === 'food' || tCatName === 'food' || tCatName === 'makanan' || tCatName === 'kuliner';
        })
        .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

      if ((sameDayFoodTotal + amount) > CLASSIFIER_CONFIG.FOOD_DAILY_CONSUMPTIVE_THRESHOLD) {
        return {
          isConsumptive: true,
          classification: 'consumptive',
          score: 1,
          confidence: 1,
          confidenceLevel: 'high',
          reason: 'food_daily_accumulation_exceeds_threshold',
          reasons: [`daily_food_total:${sameDayFoodTotal + amount} > ${CLASSIFIER_CONFIG.FOOD_DAILY_CONSUMPTIVE_THRESHOLD}`],
          signals,
        };
      }
    }
  }

  // Coffee Hybrid Threshold (> 20k single OR > 20k daily accumulation)
  const isCoffee = catId === 'coffee' || catName === 'coffee' || catName === 'kopi' || catName.includes('coffee') || catName.includes('kopi');
  if (isCoffee && signals.absoluteEssentialMatches.length === 0) {
    const amount = Number(txOrCategory.amount) || 0;

    if (amount > CLASSIFIER_CONFIG.COFFEE_SINGLE_CONSUMPTIVE_THRESHOLD) {
      return {
        isConsumptive: true,
        classification: 'consumptive',
        score: 1,
        confidence: 1,
        confidenceLevel: 'high',
        reason: 'coffee_single_transaction_exceeds_threshold',
        reasons: [`amount:${amount} > ${CLASSIFIER_CONFIG.COFFEE_SINGLE_CONSUMPTIVE_THRESHOLD}`],
        signals,
      };
    }

    if (Array.isArray(allTransactions) && allTransactions.length > 0) {
      const todayStr = new Date().toISOString().split('T')[0];
      const targetDate = txOrCategory.date || todayStr;

      const sameDayCoffeeTotal = allTransactions
        .filter((t) => {
          if (!t) return false;
          if (t.id === txOrCategory.id) return false;
          const tType = (t.type || '').toLowerCase();
          if (tType !== 'expense') return false;
          const tDate = (t.date || '').toString();
          if (!tDate.startsWith(targetDate)) return false;

          const tCatName = (t.category || t.name || '').toString().toLowerCase();
          const tCatId = (t.categoryId || t.id || '').toString().toLowerCase();
          return tCatId === 'coffee' || tCatName === 'coffee' || tCatName === 'kopi' || tCatName.includes('coffee') || tCatName.includes('kopi');
        })
        .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

      if ((sameDayCoffeeTotal + amount) > CLASSIFIER_CONFIG.COFFEE_DAILY_CONSUMPTIVE_THRESHOLD) {
        return {
          isConsumptive: true,
          classification: 'consumptive',
          score: 1,
          confidence: 1,
          confidenceLevel: 'high',
          reason: 'coffee_daily_accumulation_exceeds_threshold',
          reasons: [`daily_coffee_total:${sameDayCoffeeTotal + amount} > ${CLASSIFIER_CONFIG.COFFEE_DAILY_CONSUMPTIVE_THRESHOLD}`],
          signals,
        };
      }
    }
  }

  const { score, reasons } = aggregateScore(signals);
  const isConsumptive = score >= CLASSIFIER_CONFIG.FINAL_CONSUMPTIVE_THRESHOLD;
  const confidence = confidenceFromScore(score);

  let reason = 'combined_evidence';
  if (signals.absoluteEssentialMatches.length > 0 && !signals.contextMatches.some((x) => x.className === 'consumptive')) {
    reason = 'essential_absolute';
  } else if (signals.taxonomyMatches.length > 0) {
    reason = `taxonomy_match:${signals.taxonomyMatches[0].group}`;
  } else if (signals.fuzzyMatches.length > 0) {
    reason = 'fuzzy_taxonomy_match';
  } else if (signals.contextMatches.length > 0) {
    reason = `context_match:${signals.contextMatches[0].name}`;
  } else {
    reason = 'naive_bayes_score';
  }

  return {
    isConsumptive,
    classification: isConsumptive ? 'consumptive' : 'essential',
    score: Number(score.toFixed(3)),
    confidence,
    confidenceLevel: confidenceLabel(confidence),
    reason,
    reasons,
    signals,
  };
}

// ============================================================================
// PUBLIC API
// ============================================================================
export const isConsumptiveHybrid = (txOrCategory, allTransactions = []) =>
  classifyTransaction(txOrCategory, allTransactions).isConsumptive;

export const explainClassification = (txOrCategory, allTransactions = []) => {
  const result = classifyTransaction(txOrCategory, allTransactions);

  if (!result.signals) {
    return {
      isConsumptive: false,
      classification: 'essential',
      confidence: 0,
      confidenceLevel: 'low',
      reason: 'input_kosong',
    };
  }

  const { signals } = result;
  const taxonomyMatch = signals.taxonomyMatches[0];
  const fuzzyMatch = signals.fuzzyMatches[0];

  return {
    isConsumptive: result.isConsumptive,
    classification: result.classification,
    score: result.score,
    confidence: result.confidence,
    confidenceLevel: result.confidenceLevel,
    reason: result.reason,
    matchedKeyword: taxonomyMatch?.keywords?.[0],
    matchedGroup: taxonomyMatch?.group,
    nbScore: Number(signals.nbScore.toFixed(3)),
    signals: {
      taxonomy: {
        matched: signals.taxonomyMatches.length > 0,
        matches: signals.taxonomyMatches,
      },
      essential: {
        absolute: signals.absoluteEssentialMatches,
        strong: signals.strongEssentialMatches,
      },
      context: signals.contextMatches,
      fuzzy: fuzzyMatch || null,
      categoryGroup: signals.categoryGroup,
      amount: signals.amountSignal,
    },
    reasons: result.reasons,
  };
};

// Export helper for aggregating consumptive transactions grouped by Category
export function getConsumptiveTransactions(transactions, currentMonthStr = '') {
  if (!Array.isArray(transactions)) return [];

  const categoryTotals = {};

  const ensureCategory = (id, name) => {
    const key = (id || name || 'other').toString().toLowerCase();
    if (!categoryTotals[key]) {
      categoryTotals[key] = {
        categoryId: id || null,
        categoryName: name || 'Lainnya',
        totalAmount: 0,
      };
    }
    return categoryTotals[key];
  };

  const foodByDate = {};
  const coffeeByDate = {};

  transactions.forEach((t) => {
    if (!t || t.type !== 'expense') return;
    const txDate = t.date || '';
    if (currentMonthStr && !txDate.startsWith(currentMonthStr)) return;

    const catName = (t.category || t.name || 'Lainnya').toString();
    const catId = (t.categoryId || t.id || '').toString();
    const lowerName = catName.toLowerCase();
    const lowerId = catId.toLowerCase();

    const isFood = lowerId === 'food' || lowerName === 'food' || lowerName === 'makanan' || lowerName === 'kuliner';
    const isCoffee = lowerId === 'coffee' || lowerName === 'coffee' || lowerName === 'kopi' || lowerName.includes('kopi') || lowerName.includes('coffee');

    if (isFood) {
      const dateKey = txDate.split('T')[0] || 'unknown';
      if (!foodByDate[dateKey]) foodByDate[dateKey] = [];
      foodByDate[dateKey].push({ t, catId: catId || 'food', catName: catName || 'Food' });
    } else if (isCoffee) {
      const dateKey = txDate.split('T')[0] || 'unknown';
      if (!coffeeByDate[dateKey]) coffeeByDate[dateKey] = [];
      coffeeByDate[dateKey].push({ t, catId: catId || 'coffee', catName: catName || 'Coffee' });
    } else {
      if (isConsumptiveHybrid(t, transactions)) {
        const cat = ensureCategory(catId, catName);
        cat.totalAmount += Number(t.amount) || 0;
      }
    }
  });

  // Calculate daily excess for Food (dailyTotal - limit)
  Object.entries(foodByDate).forEach(([_, foodItems]) => {
    const dailyTotal = foodItems.reduce((sum, item) => sum + (Number(item.t.amount) || 0), 0);
    const limit = CLASSIFIER_CONFIG.FOOD_DAILY_CONSUMPTIVE_THRESHOLD;
    if (dailyTotal > limit) {
      const excess = dailyTotal - limit;
      const cat = ensureCategory('food', 'Food');
      cat.totalAmount += excess;
    }
  });

  // Calculate daily excess/consumptive for Coffee (> 20k per day or single > 20k)
  Object.entries(coffeeByDate).forEach(([_, coffeeItems]) => {
    const dailyTotal = coffeeItems.reduce((sum, item) => sum + (Number(item.t.amount) || 0), 0);
    const limit = CLASSIFIER_CONFIG.COFFEE_DAILY_CONSUMPTIVE_THRESHOLD;
    const catName = coffeeItems[0]?.catName || 'Coffee';
    const catId = coffeeItems[0]?.catId || 'coffee';

    const processedTxIds = new Set();
    coffeeItems.forEach(({ t }) => {
      const amt = Number(t.amount) || 0;
      if (amt > CLASSIFIER_CONFIG.COFFEE_SINGLE_CONSUMPTIVE_THRESHOLD || dailyTotal > limit) {
        if (!processedTxIds.has(t.id)) {
          processedTxIds.add(t.id);
          const cat = ensureCategory(catId, catName);
          cat.totalAmount += amt;
        }
      }
    });
  });

  const result = [];
  Object.entries(categoryTotals).forEach(([key, data]) => {
    if (data.totalAmount > 0) {
      let subtext = `Total pengeluaran ${data.categoryName.toLowerCase()} konsumtif bulan ini`;
      if (key === 'food') {
        subtext = `Kelebihan Rp ${data.totalAmount.toLocaleString('id-ID')} dari limit Rp 75.000/hari`;
      }

      result.push({
        id: `cat-summary-${key}`,
        title: data.categoryName,
        category: data.categoryName,
        categoryId: data.categoryId,
        amount: data.totalAmount,
        subtext: subtext,
        type: 'expense',
        isCategoryGroup: true,
      });
    }
  });

  result.sort((a, b) => b.amount - a.amount);

  return result;
}

// Optional local feedback API. Kept offline and intentionally not persisted by this file.
export const trainClassifierFeedback = (text, isConsumptive) =>
  nbEngine.trainFromFeedback(text, Boolean(isConsumptive));

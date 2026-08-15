/**
 * Lightweight Fuzzy Matcher & Levenshtein Distance (~0.8 KB)
 * Digunakan untuk mentoleransi typo suara, logat daerah, atau perbedaan 1-2 karakter secara offline.
 */

export function levenshteinDistance(a, b) {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix = [];
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

// Blacklist pasangan kata yang sering salah cocok padahal maknanya sangat berbeda
const FALSE_POSITIVE_PAIRS = new Set([
  'hijau:hijab', 'hijab:hijau',
  'merah:murah', 'murah:merah',
  'kuning:kucing', 'kucing:kuning'
]);

/**
 * Mencari kecocokan terdekat dari daftar target
 * @param {string} word - Kata input
 * @param {string[]} candidates - Daftar kandidat kata
 * @param {number} maxDistance - Jarak toleransi maksimal (default: 2)
 * @returns {string|null} - Kata terbaik yang cocok atau null
 */
export function findClosestMatch(word, candidates, maxDistance = 2) {
  if (!word || !candidates || candidates.length === 0) return null;
  const lowerWord = word.toLowerCase().trim();
  
  let bestMatch = null;
  let minDistance = Infinity;

  for (const candidate of candidates) {
    const lowerCandidate = candidate.toLowerCase().trim();
    if (lowerWord === lowerCandidate) return candidate;

    if (FALSE_POSITIVE_PAIRS.has(`${lowerWord}:${lowerCandidate}`)) {
      continue;
    }

    // Untuk kata pendek (<= 5 huruf), batasi jarak toleransi maks 1
    const allowedDist = lowerCandidate.length <= 5 ? 1 : maxDistance;
    const dist = levenshteinDistance(lowerWord, lowerCandidate);

    if (dist <= allowedDist && dist < minDistance) {
      minDistance = dist;
      bestMatch = candidate;
    }
  }

  return bestMatch;
}

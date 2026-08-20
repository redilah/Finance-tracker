/**
 * Currency Database & Real-Time Exchange Rate Engine for Cassiel
 * Supports world currencies with official country flag assets, dynamic search, live exchange rates, and multi-currency formatting.
 */

// Comprehensive world currencies list. IDR is strictly top #1 and default (without 'default' label).
export const WORLD_CURRENCIES = [
  { code: 'IDR', displayName: 'Rupiah Indonesia', countryCode: 'id', symbol: 'Rp', country: 'Indonesia', locale: 'id-ID', defaultDecimals: 0 },
  { code: 'USD', displayName: 'US Dollar', countryCode: 'us', symbol: '$', country: 'United States', locale: 'en-US', defaultDecimals: 2 },
  { code: 'EUR', displayName: 'Euro', countryCode: 'eu', symbol: '€', country: 'European Union', locale: 'de-DE', defaultDecimals: 2 },
  { code: 'JPY', displayName: 'Japanese Yen (円)', countryCode: 'jp', symbol: '¥', country: 'Japan', locale: 'ja-JP', defaultDecimals: 0 },
  { code: 'GBP', displayName: 'British Pound', countryCode: 'gb', symbol: '£', country: 'United Kingdom', locale: 'en-GB', defaultDecimals: 2 },
  { code: 'KRW', displayName: 'South Korean Won (원)', countryCode: 'kr', symbol: '₩', country: 'South Korea', locale: 'ko-KR', defaultDecimals: 0 },
  { code: 'SGD', displayName: 'Singapore Dollar', countryCode: 'sg', symbol: 'S$', country: 'Singapore', locale: 'en-SG', defaultDecimals: 2 },
  { code: 'MYR', displayName: 'Malaysian Ringgit', countryCode: 'my', symbol: 'RM', country: 'Malaysia', locale: 'ms-MY', defaultDecimals: 2 },
  { code: 'AUD', displayName: 'Australian Dollar', countryCode: 'au', symbol: 'A$', country: 'Australia', locale: 'en-AU', defaultDecimals: 2 },
  { code: 'CAD', displayName: 'Canadian Dollar', countryCode: 'ca', symbol: 'C$', country: 'Canada', locale: 'en-CA', defaultDecimals: 2 },
  { code: 'CHF', displayName: 'Swiss Franc', countryCode: 'ch', symbol: 'CHF', country: 'Switzerland', locale: 'de-CH', defaultDecimals: 2 },
  { code: 'CNY', displayName: 'Chinese Yuan (元)', countryCode: 'cn', symbol: '¥', country: 'China', locale: 'zh-CN', defaultDecimals: 2 },
  { code: 'SAR', displayName: 'Saudi Riyal', countryCode: 'sa', symbol: '﷼', country: 'Saudi Arabia', locale: 'ar-SA', defaultDecimals: 2 },
  { code: 'AED', displayName: 'UAE Dirham', countryCode: 'ae', symbol: 'د.إ', country: 'United Arab Emirates', locale: 'ar-AE', defaultDecimals: 2 },
  { code: 'THB', displayName: 'Thai Baht', countryCode: 'th', symbol: '฿', country: 'Thailand', locale: 'th-TH', defaultDecimals: 2 },
  { code: 'PHP', displayName: 'Philippine Peso', countryCode: 'ph', symbol: '₱', country: 'Philippines', locale: 'fil-PH', defaultDecimals: 2 },
  { code: 'VND', displayName: 'Vietnamese Dong', countryCode: 'vn', symbol: '₫', country: 'Vietnam', locale: 'vi-VN', defaultDecimals: 0 },
  { code: 'INR', displayName: 'Indian Rupee', countryCode: 'in', symbol: '₹', country: 'India', locale: 'hi-IN', defaultDecimals: 2 },
  { code: 'BRL', displayName: 'Brazilian Real', countryCode: 'br', symbol: 'R$', country: 'Brazil', locale: 'pt-BR', defaultDecimals: 2 },
  { code: 'TRY', displayName: 'Turkish Lira', countryCode: 'tr', symbol: '₺', country: 'Turkey', locale: 'tr-TR', defaultDecimals: 2 },
  { code: 'RUB', displayName: 'Russian Ruble', countryCode: 'ru', symbol: '₽', country: 'Russia', locale: 'ru-RU', defaultDecimals: 2 },
  { code: 'NZD', displayName: 'New Zealand Dollar', countryCode: 'nz', symbol: 'NZ$', country: 'New Zealand', locale: 'en-NZ', defaultDecimals: 2 },
  { code: 'HKD', displayName: 'Hong Kong Dollar', countryCode: 'hk', symbol: 'HK$', country: 'Hong Kong', locale: 'zh-HK', defaultDecimals: 2 },
  { code: 'TWD', displayName: 'New Taiwan Dollar', countryCode: 'tw', symbol: 'NT$', country: 'Taiwan', locale: 'zh-TW', defaultDecimals: 2 },
  { code: 'ZAR', displayName: 'South African Rand', countryCode: 'za', symbol: 'R', country: 'South Africa', locale: 'en-ZA', defaultDecimals: 2 },
  { code: 'MXN', displayName: 'Mexican Peso', countryCode: 'mx', symbol: 'Mex$', country: 'Mexico', locale: 'es-MX', defaultDecimals: 2 },
  { code: 'SEK', displayName: 'Swedish Krona', countryCode: 'se', symbol: 'kr', country: 'Sweden', locale: 'sv-SE', defaultDecimals: 2 },
  { code: 'NOK', displayName: 'Norwegian Krone', countryCode: 'no', symbol: 'kr', country: 'Norway', locale: 'nb-NO', defaultDecimals: 2 },
  { code: 'DKK', displayName: 'Danish Krone', countryCode: 'dk', symbol: 'kr', country: 'Denmark', locale: 'da-DK', defaultDecimals: 2 },
  { code: 'PLN', displayName: 'Polish Zloty', countryCode: 'pl', symbol: 'zł', country: 'Poland', locale: 'pl-PL', defaultDecimals: 2 },
  { code: 'KWD', displayName: 'Kuwaiti Dinar', countryCode: 'kw', symbol: 'KD', country: 'Kuwait', locale: 'ar-KW', defaultDecimals: 3 },
  { code: 'QAR', displayName: 'Qatari Riyal', countryCode: 'qa', symbol: 'QR', country: 'Qatar', locale: 'ar-QA', defaultDecimals: 2 },
  { code: 'EGP', displayName: 'Egyptian Pound', countryCode: 'eg', symbol: 'E£', country: 'Egypt', locale: 'ar-EG', defaultDecimals: 2 },
  { code: 'PKR', displayName: 'Pakistani Rupee', countryCode: 'pk', symbol: 'Rs', country: 'Pakistan', locale: 'ur-PK', defaultDecimals: 2 },
  { code: 'BDT', displayName: 'Bangladeshi Taka', countryCode: 'bd', symbol: '৳', country: 'Bangladesh', locale: 'bn-BD', defaultDecimals: 2 },
  { code: 'NGN', displayName: 'Nigerian Naira', countryCode: 'ng', symbol: '₦', country: 'Nigeria', locale: 'en-NG', defaultDecimals: 2 },
  { code: 'KES', displayName: 'Kenyan Shilling', countryCode: 'ke', symbol: 'KSh', country: 'Kenya', locale: 'en-KE', defaultDecimals: 2 },
  { code: 'CLP', displayName: 'Chilean Peso', countryCode: 'cl', symbol: 'CLP$', country: 'Chile', locale: 'es-CL', defaultDecimals: 0 },
  { code: 'COP', displayName: 'Colombian Peso', countryCode: 'co', symbol: 'COL$', country: 'Colombia', locale: 'es-CO', defaultDecimals: 0 },
  { code: 'PEN', displayName: 'Peruvian Sol', countryCode: 'pe', symbol: 'S/.', country: 'Peru', locale: 'es-PE', defaultDecimals: 2 },
  { code: 'ARS', displayName: 'Argentine Peso', countryCode: 'ar', symbol: 'ARS$', country: 'Argentina', locale: 'es-AR', defaultDecimals: 2 },
  { code: 'HUF', displayName: 'Hungarian Forint', countryCode: 'hu', symbol: 'Ft', country: 'Hungary', locale: 'hu-HU', defaultDecimals: 0 },
  { code: 'CZK', displayName: 'Czech Koruna', countryCode: 'cz', symbol: 'Kč', country: 'Czech Republic', locale: 'cs-CZ', defaultDecimals: 2 },
  { code: 'ILS', displayName: 'Israeli New Shekel', countryCode: 'il', symbol: '₪', country: 'Israel', locale: 'he-IL', defaultDecimals: 2 },
  { code: 'OMR', displayName: 'Omani Rial', countryCode: 'om', symbol: 'OMR', country: 'Oman', locale: 'ar-OM', defaultDecimals: 3 },
  { code: 'BHD', displayName: 'Bahraini Dinar', countryCode: 'bh', symbol: 'BD', country: 'Bahrain', locale: 'ar-BH', defaultDecimals: 3 },
  { code: 'JOD', displayName: 'Jordanian Dinar', countryCode: 'jo', symbol: 'JD', country: 'Jordan', locale: 'ar-JO', defaultDecimals: 3 },
  { code: 'LKR', displayName: 'Sri Lankan Rupee', countryCode: 'lk', symbol: 'Rs', country: 'Sri Lanka', locale: 'si-LK', defaultDecimals: 2 },
  { code: 'MMK', displayName: 'Myanmar Kyat', countryCode: 'mm', symbol: 'K', country: 'Myanmar', locale: 'my-MM', defaultDecimals: 0 },
  { code: 'KHR', displayName: 'Cambodian Riel', countryCode: 'kh', symbol: '៛', country: 'Cambodia', locale: 'km-KH', defaultDecimals: 0 },
  { code: 'BND', displayName: 'Brunei Dollar', countryCode: 'bn', symbol: 'B$', country: 'Brunei', locale: 'ms-BN', defaultDecimals: 2 },
  { code: 'NPR', displayName: 'Nepalese Rupee', countryCode: 'np', symbol: 'Rs', country: 'Nepal', locale: 'ne-NP', defaultDecimals: 2 },
  { code: 'TND', displayName: 'Tunisian Dinar', countryCode: 'tn', symbol: 'DT', country: 'Tunisia', locale: 'ar-TN', defaultDecimals: 3 },
  { code: 'MAD', displayName: 'Moroccan Dirham', countryCode: 'ma', symbol: 'DH', country: 'Morocco', locale: 'ar-MA', defaultDecimals: 2 },
  { code: 'CRC', displayName: 'Costa Rican Colón', countryCode: 'cr', symbol: '₡', country: 'Costa Rica', locale: 'es-CR', defaultDecimals: 0 },
  { code: 'UYU', displayName: 'Uruguayan Peso', countryCode: 'uy', symbol: '$U', country: 'Uruguay', locale: 'es-UY', defaultDecimals: 2 },
  { code: 'GEL', displayName: 'Georgian Lari', countryCode: 'ge', symbol: '₾', country: 'Georgia', locale: 'ka-GE', defaultDecimals: 2 },
  { code: 'KZT', displayName: 'Kazakhstani Tenge', countryCode: 'kz', symbol: '₸', country: 'Kazakhstan', locale: 'kk-KZ', defaultDecimals: 2 },
  { code: 'UZS', displayName: 'Uzbekistani Som', countryCode: 'uz', symbol: "so'm", country: 'Uzbekistan', locale: 'uz-UZ', defaultDecimals: 0 },
  { code: 'DZD', displayName: 'Algerian Dinar', countryCode: 'dz', symbol: 'DA', country: 'Algeria', locale: 'ar-DZ', defaultDecimals: 2 },
  { code: 'IQD', displayName: 'Iraqi Dinar', countryCode: 'iq', symbol: 'IQD', country: 'Iraq', locale: 'ar-IQ', defaultDecimals: 0 }
];

// Fallback baseline exchange rates relative to 1 IDR (Offline safe)
export const FALLBACK_RATES_BASE_IDR = {
  IDR: 1,
  USD: 0.0000615,
  EUR: 0.0000570,
  JPY: 0.00945,
  GBP: 0.0000488,
  KRW: 0.0862,
  SGD: 0.0000830,
  MYR: 0.000275,
  AUD: 0.0000945,
  CAD: 0.0000855,
  CHF: 0.0000550,
  CNY: 0.000445,
  SAR: 0.000231,
  AED: 0.000226,
  THB: 0.00225,
  PHP: 0.00355,
  VND: 1.56,
  INR: 0.00520,
  BRL: 0.000340,
  TRY: 0.00205,
  RUB: 0.00550,
  NZD: 0.00103,
  HKD: 0.000481,
  TWD: 0.00200
};

const CACHE_KEY_RATES = 'cassiel_currency_rates_v1';
const CACHE_KEY_TS = 'cassiel_currency_rates_ts';
const CACHE_DURATION_MS = 30 * 60 * 1000; // 30 minutes cache

/**
 * Get country flag image URL (using high-res vector/retina flagcdn)
 */
export function getFlagUrl(countryCode = 'id') {
  if (!countryCode) return 'https://flagcdn.com/w40/id.png';
  return `https://flagcdn.com/w40/${countryCode.toLowerCase()}.png`;
}

/**
 * Fetch latest exchange rates with 1 IDR as base
 */
export async function fetchExchangeRates() {
  try {
    // 1. Check local cache first
    const cachedData = localStorage.getItem(CACHE_KEY_RATES);
    const cachedTs = Number(localStorage.getItem(CACHE_KEY_TS) || 0);
    const now = Date.now();

    if (cachedData && (now - cachedTs < CACHE_DURATION_MS)) {
      const parsed = JSON.parse(cachedData);
      if (parsed && typeof parsed === 'object') {
        return parsed;
      }
    }

    // 2. Fetch live rates from high-availability endpoint
    const response = await fetch('https://open.er-api.com/v6/latest/IDR', {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      cache: 'no-store'
    });

    if (response.ok) {
      const result = await response.json();
      if (result && result.rates) {
        const rates = { ...FALLBACK_RATES_BASE_IDR, ...result.rates };
        localStorage.setItem(CACHE_KEY_RATES, JSON.stringify(rates));
        localStorage.setItem(CACHE_KEY_TS, String(now));
        return rates;
      }
    }
  } catch (err) {
    console.warn('[Currency Engine] Live rate fetch failed, using cached/fallback rates:', err);
  }

  // 3. Fallback to cached or hardcoded rates
  try {
    const cachedData = localStorage.getItem(CACHE_KEY_RATES);
    if (cachedData) return JSON.parse(cachedData);
  } catch (e) {}

  return FALLBACK_RATES_BASE_IDR;
}

/**
 * Get active currency object from code
 */
export function getCurrency(code = 'IDR') {
  return WORLD_CURRENCIES.find(c => c.code === code) || WORLD_CURRENCIES[0];
}

/**
 * Format numerical amount using active currency code & live exchange rates.
 */
export function formatMoney(amountInBaseIdr = 0, currencyCode = 'IDR', liveRates = null, includeSymbol = true) {
  const num = Number(amountInBaseIdr) || 0;
  const currency = getCurrency(currencyCode);
  
  // Rate calculation
  let convertedAmount = num;
  if (currencyCode !== 'IDR') {
    const rates = liveRates || FALLBACK_RATES_BASE_IDR;
    const rate = rates[currencyCode] || FALLBACK_RATES_BASE_IDR[currencyCode] || 1;
    convertedAmount = num * rate;
  }

  // Format decimal / integer presentation
  let formattedNumber = '';
  if (currencyCode === 'IDR' || currencyCode === 'KRW' || currencyCode === 'JPY' || currencyCode === 'VND' || currencyCode === 'CLP') {
    // Zero-decimal currencies
    formattedNumber = Math.round(convertedAmount).toLocaleString(currency.locale || 'id-ID');
  } else {
    // 2-decimal currencies (or formatted dynamically)
    if (convertedAmount >= 1000) {
      formattedNumber = convertedAmount.toLocaleString(currency.locale || 'en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
      });
    } else {
      formattedNumber = convertedAmount.toLocaleString(currency.locale || 'en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
    }
  }

  if (!includeSymbol) return formattedNumber;
  return `${currency.symbol} ${formattedNumber}`;
}

/**
 * Format numerical amount into compact/clean tick label for chart Y-axis (e.g., 0, 250k, 500k, 1M, 1.5M, etc.)
 */
export function formatCompactMoney(amountInBaseIdr = 0, currencyCode = 'IDR', liveRates = null) {
  const num = Number(amountInBaseIdr) || 0;
  if (num === 0) return '0';
  
  const currency = getCurrency(currencyCode);
  let val = num;
  if (currencyCode !== 'IDR') {
    const rates = liveRates || FALLBACK_RATES_BASE_IDR;
    const rate = rates[currencyCode] || FALLBACK_RATES_BASE_IDR[currencyCode] || 1;
    val = num * rate;
  }

  const symbol = currency.symbol || '';
  
  if (val >= 1000000000) {
    const formatted = (val / 1000000000).toLocaleString('en-US', { maximumFractionDigits: 1 });
    return `${symbol}${formatted}B`;
  }
  if (val >= 1000000) {
    const formatted = (val / 1000000).toLocaleString('en-US', { maximumFractionDigits: 1 });
    return `${symbol}${formatted}M`;
  }
  if (val >= 1000) {
    const formatted = (val / 1000).toLocaleString('en-US', { maximumFractionDigits: 1 });
    return `${symbol}${formatted}k`;
  }
  
  return `${symbol}${Math.round(val)}`;
}

/**
 * Get live exchange rate text (e.g. "1 USD ≈ Rp 16.250")
 */
export function getExchangeRateText(currencyCode = 'USD', liveRates = null) {
  if (!currencyCode || currencyCode === 'IDR') return '';
  const rates = liveRates || FALLBACK_RATES_BASE_IDR;
  const rateToIdr = rates[currencyCode];
  
  if (!rateToIdr || rateToIdr <= 0) return '';
  const idrPerUnit = Math.round(1 / rateToIdr);
  return `1 ${currencyCode} ≈ Rp ${idrPerUnit.toLocaleString('id-ID')}`;
}

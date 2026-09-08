/**
 * Pure JS account helpers and constants
 * Separated from accountLogos.jsx for Fast Refresh compatibility and Node.js testing.
 */

export const DEFAULT_ACCOUNTS = [
  { id: 'cash', name: 'Cash', type: 'cash' },
  // Bank Resmi
  { id: 'bca', name: 'BCA', type: 'bank' },
  { id: 'bri', name: 'BRImo', type: 'bank' },
  { id: 'livin', name: "Livin' by Mandiri", type: 'bank' },
  { id: 'wondr', name: 'Wondr by BNI', type: 'bank' },
  { id: 'jago', name: 'Jago', type: 'bank' },
  { id: 'bsi', name: 'BSI Mobile', type: 'bank' },
  { id: 'cimb', name: 'OCTO Mobile (CIMB)', type: 'bank' },
  { id: 'seabank', name: 'SeaBank', type: 'bank' },
  { id: 'jenius', name: 'Jenius (BTPN)', type: 'bank' },
  { id: 'blu', name: 'blu by BCA Digital', type: 'bank' },
  { id: 'permata', name: 'PermataME', type: 'bank' },
  { id: 'danamon', name: 'D-Bank PRO (Danamon)', type: 'bank' },
  { id: 'panin', name: 'Panin Mobile', type: 'bank' },
  { id: 'maybank', name: 'M2U ID (Maybank)', type: 'bank' },
  { id: 'btn', name: 'BTN Mobile', type: 'bank' },
  { id: 'neobank', name: 'Neobank (BNC)', type: 'bank' },
  { id: 'bankdki', name: 'JakOne Mobile (Bank DKI)', type: 'bank' },
  { id: 'bankjateng', name: 'Bima Mobile (Bank Jateng)', type: 'bank' },
  { id: 'bankjatim', name: 'JConnect (Bank Jatim)', type: 'bank' },
  { id: 'bankbjb', name: 'DIGI by bjb', type: 'bank' },
  { id: 'sinarmas', name: 'SimobiPlus (Bank Sinarmas)', type: 'bank' },
  // E-Wallet Resmi
  { id: 'gopay', name: 'GoPay', type: 'ewallet' },
  { id: 'ovo', name: 'OVO', type: 'ewallet' },
  { id: 'dana', name: 'DANA', type: 'ewallet' },
  { id: 'shopeepay', name: 'ShopeePay', type: 'ewallet' },
  { id: 'linkaja', name: 'LinkAja', type: 'ewallet' },
  { id: 'isaku', name: 'i.saku', type: 'ewallet' },
  { id: 'doku', name: 'DOKU', type: 'ewallet' },
  { id: 'sakuku', name: 'Sakuku', type: 'ewallet' },
  { id: 'astrapay', name: 'AstraPay', type: 'ewallet' },
  { id: 'maxim', name: 'Maxim Wallet', type: 'ewallet' },
  { id: 'grabpay', name: 'GrabPay', type: 'ewallet' },
  { id: 'spin', name: 'MotionPay', type: 'ewallet' },
  { id: 'paytren', name: 'PayTren', type: 'ewallet' },
  { id: 'mitradarat', name: 'MitraDarat Pay', type: 'ewallet' },
  { id: 'indodax', name: 'Indodax Wallet', type: 'ewallet' },
  { id: 'plink', name: 'Plink', type: 'ewallet' },
  { id: 'toko', name: 'TokoCrypto Wallet', type: 'ewallet' },
  { id: 'rekeningku', name: 'Reku Wallet', type: 'ewallet' },
  { id: 'pintu', name: 'Pintu Wallet', type: 'ewallet' },
  { id: 'flip', name: 'Flip Saldo', type: 'ewallet' },
  { id: 'oy', name: 'OY! Indonesia', type: 'ewallet' },
  { id: 'kaspro', name: 'KasPro', type: 'ewallet' },
  { id: 'blibli', name: 'Blibli Tiket Pay', type: 'ewallet' },
  { id: 'lazada', name: 'Lazada Wallet', type: 'ewallet' },
  { id: 'bukalapak', name: 'BukaTabungan / Saldo', type: 'ewallet' },
  { id: 'pegadaian', name: 'Pegadaian Digital', type: 'ewallet' },
  { id: 'tokopedia', name: 'Tokopedia Saldo', type: 'ewallet' }
];

export const BANK_ACCOUNTS = DEFAULT_ACCOUNTS.filter(a => a.type === 'bank');
export const EWALLET_ACCOUNTS = DEFAULT_ACCOUNTS.filter(a => a.type === 'ewallet');

export const normalizeAccountName = (rawName) => {
  if (!rawName || typeof rawName !== 'string') return 'Cash';
  const clean = rawName.trim();
  const lower = clean.toLowerCase();

  // 1. BRI / BRImo
  if (/^(bri|brimo|bank\s*bri|pt\s*bank\s*rakyat\s*indonesia)$/i.test(lower)) {
    return 'BRImo';
  }

  // 2. BCA
  if (/^(bca|bank\s*bca|pt\s*bank\s*central\s*asia|halo\s*bca)$/i.test(lower)) {
    return 'BCA';
  }

  // 3. Mandiri / Livin'
  if (/^(mandiri|livin|livin'\s*by\s*mandiri|bank\s*mandiri)$/i.test(lower)) {
    return "Livin' by Mandiri";
  }

  // 4. BNI / Wondr
  if (/^(bni|wondr|wondr\s*by\s*bni|bank\s*bni|bni\s*mobile)$/i.test(lower)) {
    return 'Wondr by BNI';
  }

  // 5. Jago
  if (/^(jago|bank\s*jago)$/i.test(lower)) {
    return 'Jago';
  }

  // 6. BSI
  if (/^(bsi|bsi\s*mobile|bank\s*syariah\s*indonesia)$/i.test(lower)) {
    return 'BSI Mobile';
  }

  // 7. CIMB Niaga
  if (/^(cimb|cimb\s*niaga|octo|octo\s*mobile|octo\s*clicks)$/i.test(lower)) {
    return 'OCTO Mobile (CIMB)';
  }

  // 8. SeaBank
  if (/^(seabank|sea\s*bank)$/i.test(lower)) {
    return 'SeaBank';
  }

  // 9. Jenius / BTPN
  if (/^(jenius|btpn|jenius\s*btpn)$/i.test(lower)) {
    return 'Jenius (BTPN)';
  }

  // 10. blu by BCA Digital
  if (/^(blu|blu\s*by\s*bca|bca\s*digital)$/i.test(lower)) {
    return 'blu by BCA Digital';
  }

  // 11. GoPay
  if (/^(gopay|go-pay|gojek)$/i.test(lower)) {
    return 'GoPay';
  }

  // 12. OVO
  if (/^(ovo|ovo\s*cash)$/i.test(lower)) {
    return 'OVO';
  }

  // 13. DANA
  if (/^(dana|dompet\s*dana)$/i.test(lower)) {
    return 'DANA';
  }

  // 14. ShopeePay
  if (/^(shopeepay|shopee\s*pay|spay)$/i.test(lower)) {
    return 'ShopeePay';
  }

  // 15. LinkAja
  if (/^(linkaja|link\s*aja)$/i.test(lower)) {
    return 'LinkAja';
  }

  // 16. i.saku
  if (/^(isaku|i\.saku|indomaret)$/i.test(lower)) {
    return 'i.saku';
  }

  // 17. Permata
  if (/^(permata|permatame|bank\s*permata)$/i.test(lower)) {
    return 'PermataME';
  }

  // 18. Danamon
  if (/^(danamon|d-bank|d-bank\s*pro|bank\s*danamon)$/i.test(lower)) {
    return 'D-Bank PRO (Danamon)';
  }

  // 19. Neobank
  if (/^(neo|neobank|bank\s*neo|bnc)$/i.test(lower)) {
    return 'Neobank (BNC)';
  }

  // 20. Flip
  if (/^(flip|flip\s*saldo)$/i.test(lower)) {
    return 'Flip Saldo';
  }

  // 21. AstraPay
  if (/^(astrapay|astra\s*pay)$/i.test(lower)) {
    return 'AstraPay';
  }

  // 22. GrabPay
  if (/^(grabpay|grab\s*pay|grab)$/i.test(lower)) {
    return 'GrabPay';
  }

  // 23. E-commerce wallets
  if (/^(pegadaian|gadai|sahabat\s*pegadaian)$/i.test(lower)) {
    return 'Pegadaian';
  }
  if (/^(tokopedia|toped|tokped)$/i.test(lower)) {
    return 'Tokopedia';
  }

  // 24. Tunai / Cash
  if (/^(cash|tunai|uang\s*tunai|dompet|kas)$/i.test(lower)) {
    return 'Cash';
  }

  return clean;
};

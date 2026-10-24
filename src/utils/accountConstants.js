/**
 * Pure JS account helpers and constants (with official SVG icon references)
 * Separated from accountLogos.jsx for Fast Refresh compatibility and Node.js testing.
 */
import bcaSvg from '../assets/payment-logos/bca.svg';
import briSvg from '../assets/payment-logos/bri.svg';
import bsiSvg from '../assets/payment-logos/bsi.svg';
import cimbSvg from '../assets/payment-logos/cimbva.svg';
import permataSvg from '../assets/payment-logos/permatabank.svg';
import maybankSvg from '../assets/payment-logos/maybankva.svg';
import seabankSvg from '../assets/payment-logos/seabank.svg';
import jeniusSvg from '../assets/payment-logos/jenius.svg';
import bluSvg from '../assets/payment-logos/blu.svg';
import jagoSvg from '../assets/payment-logos/jago.svg';
import livinSvg from '../assets/payment-logos/livin.svg';
import wondrSvg from '../assets/payment-logos/wondr.svg';
import gopaySvg from '../assets/payment-logos/GopayIcon.svg';
import ovoSvg from '../assets/payment-logos/OvoIcon.svg';
import danaSvg from '../assets/payment-logos/DanaIcon.svg';
import linkajaSvg from '../assets/payment-logos/LinkAjaIcon.svg';
import shopeepaySvg from '../assets/payment-logos/ShopeePayIcon.svg';
import qrisSvg from '../assets/payment-logos/qris.svg';
import paypalSvg from '../assets/payment-logos/paypal.svg';
import visaSvg from '../assets/payment-logos/visa.svg';
import mastercardSvg from '../assets/payment-logos/mastercard.svg';
import alfamartSvg from '../assets/payment-logos/alfamart.svg';
import indomaretSvg from '../assets/payment-logos/indomaret.svg';

import bpddiySvg from '../assets/payment-logos/bpddiy.svg';
import baleByBtnSvg from '../assets/payment-logos/balebybtn.svg';
import jcbSvg from '../assets/payment-logos/jcb.svg';
import amexSvg from '../assets/payment-logos/amex.svg';
import bcaCardSvg from '../assets/payment-logos/bcacard.svg';
import tokopediaCardSvg from '../assets/payment-logos/tokopediacard.svg';
import jeniusCardSvg from '../assets/payment-logos/jeniuscard.svg';
import mandiriCardSvg from '../assets/payment-logos/mandiricard.svg';
import bniCardSvg from '../assets/payment-logos/bnicard.svg';
import briCardSvg from '../assets/payment-logos/bricard.svg';
import cimbCardSvg from '../assets/payment-logos/cimbcard.svg';

export const DEFAULT_ACCOUNTS = [
  { id: 'cash', name: 'Cash', type: 'cash' },
  // Bank Resmi
  { id: 'bca', name: 'BCA', type: 'bank', icon: bcaSvg },
  { id: 'bri', name: 'BRImo', type: 'bank', icon: briSvg },
  { id: 'livin', name: "Livin' by Mandiri", type: 'bank', icon: livinSvg },
  { id: 'wondr', name: 'Wondr by BNI', type: 'bank', icon: wondrSvg },
  { id: 'jago', name: 'Jago', type: 'bank', icon: jagoSvg },
  { id: 'bsi', name: 'BSI', type: 'bank', icon: bsiSvg },
  { id: 'cimb', name: 'CIMB Niaga', type: 'bank', icon: cimbSvg },
  { id: 'seabank', name: 'SeaBank', type: 'bank', icon: seabankSvg },
  { id: 'jenius', name: 'Jenius', type: 'bank', icon: jeniusSvg },
  { id: 'maybank', name: 'Maybank', type: 'bank', icon: maybankSvg },
  { id: 'bpddiy', name: 'BPD DIY', type: 'bank', icon: bpddiySvg },
  { id: 'bale_by_btn', name: 'bale by btn', type: 'bank', icon: baleByBtnSvg },
  { id: 'permata', name: 'Permata', type: 'bank', icon: permataSvg },
  { id: 'blu', name: 'blu', type: 'bank', icon: bluSvg },
  // E-Wallet & Payment
  { id: 'gopay', name: 'GoPay', type: 'ewallet', icon: gopaySvg },
  { id: 'ovo', name: 'OVO', type: 'ewallet', icon: ovoSvg },
  { id: 'dana', name: 'DANA', type: 'ewallet', icon: danaSvg },
  { id: 'shopeepay', name: 'ShopeePay', type: 'ewallet', icon: shopeepaySvg },
  { id: 'linkaja', name: 'LinkAja', type: 'ewallet', icon: linkajaSvg },
  { id: 'qris', name: 'QRIS', type: 'ewallet', icon: qrisSvg },
  { id: 'paypal', name: 'PayPal', type: 'ewallet', icon: paypalSvg },
  // Kartu Kredit (Credit Card)
  { id: 'bca_card', name: 'BCA Card', type: 'credit_card', icon: bcaCardSvg },
  { id: 'tokopedia_card', name: 'Tokopedia Card', type: 'credit_card', icon: tokopediaCardSvg },
  { id: 'jenius_cc', name: 'Jenius CC', type: 'credit_card', icon: jeniusCardSvg },
  { id: 'mandiri_card', name: 'Mandiri Card', type: 'credit_card', icon: mandiriCardSvg },
  { id: 'bni_card', name: 'BNI Card', type: 'credit_card', icon: bniCardSvg },
  { id: 'bri_card', name: 'BRI Touch', type: 'credit_card', icon: briCardSvg },
  { id: 'cimb_card', name: 'CIMB OCTO Card', type: 'credit_card', icon: cimbCardSvg },
  { id: 'jcb', name: 'JCB', type: 'credit_card', icon: jcbSvg },
  { id: 'amex', name: 'American Express', type: 'credit_card', icon: amexSvg },
  { id: 'visa', name: 'Visa', type: 'credit_card', icon: visaSvg },
  { id: 'mastercard', name: 'Mastercard', type: 'credit_card', icon: mastercardSvg },
  // Merchant
  { id: 'alfamart', name: 'Alfamart', type: 'merchant', icon: alfamartSvg },
  { id: 'indomaret', name: 'Indomaret', type: 'merchant', icon: indomaretSvg },
];

export const BANK_ACCOUNTS = DEFAULT_ACCOUNTS.filter(a => a.type === 'bank');
export const EWALLET_ACCOUNTS = DEFAULT_ACCOUNTS.filter(a => a.type === 'ewallet');

export const normalizeAccountName = (rawName) => {
  if (!rawName || typeof rawName !== 'string') return 'Cash';
  const clean = rawName.trim();
  const lower = clean.toLowerCase();

  // 1. BRI / BRImo
  if (/^(bri|brimo|bank\s*bri|bri\s*mo|rek\s*bri|rekening\s*bri)$/i.test(lower) || lower === 'bri' || lower === 'brimo') {
    return 'BRImo';
  }

  // 2. Mandiri / Livin
  if (/^(mandiri|livin|livin\s*by\s*mandiri|bank\s*mandiri|mandiri\s*livin|rek\s*mandiri)$/i.test(lower) || lower === 'mandiri' || lower === 'livin') {
    return 'Livin';
  }

  // 3. BNI / Wondr
  if (/^(bni|wondr|wondr\s*by\s*bni|bank\s*bni|bni\s*wondr|rek\s*bni)$/i.test(lower) || lower === 'bni' || lower === 'wondr') {
    return 'Wondr';
  }

  // 4. BTN / Bale by BTN
  if (/^(btn|bale|bale\s*by\s*btn|bank\s*btn|bale\s*btn)$/i.test(lower)) {
    return 'bale by btn';
  }

  // 5. BCA / myBCA
  if (/^(bca|mybca|my\s*bca|bank\s*bca|bca\s*mobile|klikbca|rek\s*bca)$/i.test(lower)) {
    return 'BCA';
  }

  // 6. GoPay
  if (/^(gopay|go-pay|gope|go\s*pay|gojek|gopay\s*coin)$/i.test(lower)) {
    return 'GoPay';
  }

  // 7. DANA
  if (/^(dana|dompet\s*dana)$/i.test(lower)) {
    return 'DANA';
  }

  // 8. OVO
  if (/^(ovo|dompet\s*ovo)$/i.test(lower)) {
    return 'OVO';
  }

  // 9. ShopeePay
  if (/^(shopee|shopeepay|spay|shopee\s*pay)$/i.test(lower)) {
    return 'ShopeePay';
  }

  // 10. LinkAja
  if (/^(linkaja|link\s*aja)$/i.test(lower)) {
    return 'LinkAja';
  }

  // 11. BSI
  if (/^(bsi|bank\s*syariah\s*indonesia|bsi\s*mobile|syariah)$/i.test(lower)) {
    return 'BSI';
  }

  // 12. SeaBank
  if (/^(seabank|sea\s*bank|shopee\s*bank)$/i.test(lower)) {
    return 'SeaBank';
  }

  // 13. Bank Jago
  if (/^(jago|bank\s*jago)$/i.test(lower)) {
    return 'Bank Jago';
  }

  // 14. Jenius / BTPN
  if (/^(jenius|btpn|jenius\s*btpn)$/i.test(lower)) {
    return 'Jenius';
  }

  // 15. blu / BCA Digital
  if (/^(blu|blu\s*by\s*bca|bca\s*digital)$/i.test(lower)) {
    return 'blu';
  }

  // 16. BPD DIY
  if (/^(bpddiy|bpd\s*diy|bpd\s*diy\s*mobile|bpddiy\s*mobile|bank\s*bpd\s*diy)$/i.test(lower)) {
    return 'BPD DIY';
  }

  // 17. CIMB Niaga
  if (/^(cimb|cimb\s*niaga|octo|octo\s*mobile|octo\s*clicks)$/i.test(lower)) {
    return 'CIMB Niaga';
  }

  // 18. Permata
  if (/^(permata|bank\s*permata|permata\s*me)$/i.test(lower)) {
    return 'Permata';
  }

  // 19. Cash
  if (/^(cash|tunai|uang\s*tunai|dompet|cash\s*\/\s*tunai)$/i.test(lower)) {
    return 'Cash';
  }

  // 20. QRIS
  if (/^(qris|qris\s*payment)$/i.test(lower)) {
    return 'QRIS';
  }

  // 21. BTN / bale by BTN
  if (/^(bale\s*by\s*btn|bale\s*btn|bale|btn|bank\s*btn|btn\s*mobile)$/i.test(lower)) {
    return 'bale by btn';
  }

  return clean;
};

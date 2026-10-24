/**
 * Account / Payment Method Definitions & SVG Badges for Indonesian Banks & E-Wallets
 * Menggunakan aset SVG resmi dari HendraSurya/logo-svg.
 */
import React from 'react';
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
import tokopediaSvg from '../assets/payment-logos/Tokopedia.svg';
import jcbSvg from '../assets/payment-logos/jcb.svg';
import amexSvg from '../assets/payment-logos/amex.svg';
import bcaCardSvg from '../assets/payment-logos/bcacard.svg';
import tokopediaCardSvg from '../assets/payment-logos/tokopediacard.svg';
import jeniusCardSvg from '../assets/payment-logos/jeniuscard.svg';
import mandiriCardSvg from '../assets/payment-logos/mandiricard.svg';
import bniCardSvg from '../assets/payment-logos/bnicard.svg';
import briCardSvg from '../assets/payment-logos/bricard.svg';
import cimbCardSvg from '../assets/payment-logos/cimbcard.svg';

const LOGO_MAP = {
  // Kartu Kredit Asli
  'tokopedia card': tokopediaCardSvg,
  'tokopedia cc': tokopediaCardSvg,
  'bca card': bcaCardSvg,
  'bca cc': bcaCardSvg,
  'kartu kredit bca': bcaCardSvg,
  'jenius credit card': jeniusCardSvg,
  'jenius cc': jeniusCardSvg,
  'jenius card': jeniusCardSvg,
  'mandiri card': mandiriCardSvg,
  'mandiri skyz': mandiriCardSvg,
  'mandiri cc': mandiriCardSvg,
  'kartu kredit mandiri': mandiriCardSvg,
  'bni card': bniCardSvg,
  'bni cc': bniCardSvg,
  'bni titanium': bniCardSvg,
  'kartu kredit bni': bniCardSvg,
  'bri touch': briCardSvg,
  'bri cc': briCardSvg,
  'bri card': briCardSvg,
  'kartu kredit bri': briCardSvg,
  'octo card': cimbCardSvg,
  'cimb octo card': cimbCardSvg,
  'cimb octo': cimbCardSvg,
  'cimb card': cimbCardSvg,
  'kartu kredit cimb': cimbCardSvg,
  'jcb': jcbSvg,
  'jcb card': jcbSvg,
  'amex': amexSvg,
  'american express': amexSvg,
  'amex card': amexSvg,
  'visa': visaSvg,
  'visa card': visaSvg,
  'mastercard': mastercardSvg,
  'mastercard card': mastercardSvg,

  // Bank & E-Wallet
  'livin by mandiri': livinSvg,
  "livin' by mandiri": livinSvg,
  'livin': livinSvg,
  'wondr by bni': wondrSvg,
  'wondr': wondrSvg,
  'bca': bcaSvg,
  'bri': briSvg,
  'brimo': briSvg,
  'bank bri': briSvg,
  'bpddiy': bpddiySvg,
  'bpd diy': bpddiySvg,
  'bpd diy mobile': bpddiySvg,
  'bpddiy mobile': bpddiySvg,
  'bpd': bpddiySvg,
  'bank bpd diy': bpddiySvg,
  'bale by btn': baleByBtnSvg,
  'bale': baleByBtnSvg,
  'btn': baleByBtnSvg,
  'bank btn': baleByBtnSvg,
  'bale btn': baleByBtnSvg,
  'bsi': bsiSvg,
  'syariah': bsiSvg,
  'cimb': cimbSvg,
  'cimb niaga': cimbSvg,
  'permata': permataSvg,
  'bank permata': permataSvg,
  'maybank': maybankSvg,
  'seabank': seabankSvg,
  'sea bank': seabankSvg,
  'jenius': jeniusSvg,
  'jago': jagoSvg,
  'bank jago': jagoSvg,
  'blu': bluSvg,
  'blu by bca': bluSvg,
  'gopay': gopaySvg,
  'go-pay': gopaySvg,
  'gope': gopaySvg,
  'go pay': gopaySvg,
  'ovo': ovoSvg,
  'dana': danaSvg,
  'linkaja': linkajaSvg,
  'link aja': linkajaSvg,
  'shopee': shopeepaySvg,
  'shopeepay': shopeepaySvg,
  'spay': shopeepaySvg,
  'qris': qrisSvg,
  'paypal': paypalSvg,
  'alfamart': alfamartSvg,
  'indomaret': indomaretSvg,
  'tokopedia': tokopediaSvg,
};

// Akun yang logonya sudah memiliki kotak berlatar warna sendiri (tidak butuh kotak putih & padding putih)
const STANDALONE_BADGES = [
  'linkaja', 'link aja', 
  'shopee', 'shopeepay', 'spay', 
  'dana', 'ovo', 'gopay', 'go-pay', 'gope', 'go pay',
  'livin', 'livin by mandiri', "livin' by mandiri",
  'wondr', 'wondr by bni',
  'bri', 'brimo', 'bank bri',
  'bpddiy', 'bpd diy', 'bpd diy mobile', 'bpddiy mobile', 'bank bpd diy',
  'cimb', 'cimb niaga',
  'jcb', 'amex', 'american express', 'bcacard', 'bca card', 'bca cc',
  'tokopediacard', 'tokopedia card', 'tokopedia cc',
  'jeniuscard', 'jenius cc', 'jenius card',
  'mandiricard', 'mandiri card', 'mandiri cc',
  'bnicard', 'bni card', 'bni cc', 'bni titanium',
  'bricard', 'bri card', 'bri cc', 'bri touch',
  'cimbcard', 'cimb card', 'cimb octo', 'octo card'
];

// Daftar badge kartu kredit khusus (rasio horizontal kartu kredit)
const CREDIT_CARD_BADGES = [
  'visa', 'mastercard', 'jcb', 'amex', 'american express',
  'bcacard', 'bca card', 'bca cc', 'kartu kredit bca',
  'tokopediacard', 'tokopedia card', 'tokopedia cc',
  'jeniuscard', 'jenius cc', 'jenius card', 'jenius credit card',
  'mandiricard', 'mandiri card', 'mandiri cc', 'mandiri skyz', 'kartu kredit mandiri',
  'bnicard', 'bni card', 'bni cc', 'bni titanium', 'kartu kredit bni',
  'bricard', 'bri card', 'bri cc', 'bri touch', 'kartu kredit bri',
  'cimbcard', 'cimb card', 'cimb octo', 'octo card', 'cimb octo card', 'kartu kredit cimb'
];

/**
 * Render Logo Badge SVG for each Account using official assets
 */
export const AccountIconBadge = ({ accountName, size = 30 }) => {
  const norm = (accountName || '').trim().toLowerCase();

  // 1. Cash / Tunai (Standalone without white box)
  if (norm === 'cash' || norm === 'tunai' || norm === 'uang tunai') {
    return (
      <div 
        className="account-logo-frame cash-frame standalone-frame" 
        style={{ 
          width: size, 
          height: size,
          background: 'transparent',
          boxShadow: 'none',
          padding: 0,
          border: 'none'
        }}
      >
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <rect x="2" y="5" width="20" height="14" rx="3" stroke="#10B981" strokeWidth="2.2"/>
          <circle cx="12" cy="12" r="3" fill="#10B981"/>
          <path d="M5 8.5H5.01M19 15.5H19.01" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round"/>
        </svg>
      </div>
    );
  }

  // 2. Cek apakah ada logo resmi di LOGO_MAP
  for (const [key, logoSrc] of Object.entries(LOGO_MAP)) {
    if (norm === key || norm.includes(key)) {
      const isCreditCard = CREDIT_CARD_BADGES.some(b => norm === b || norm.includes(b));
      const isStandalone = isCreditCard || STANDALONE_BADGES.some(b => norm === b || norm.includes(b));

      const frameWidth = isCreditCard ? Math.round(size * 1.34) : size;
      const frameHeight = isCreditCard ? Math.round(size * 0.92) : size;

      return (
        <div 
          className={`account-logo-frame ${isStandalone ? 'standalone-frame' : ''} ${isCreditCard ? 'credit-card-frame' : ''}`} 
          style={{ 
            width: frameWidth, 
            height: frameHeight,
            background: isStandalone ? 'transparent' : '#FFFFFF',
            padding: isStandalone ? 0 : 3,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <img 
            src={logoSrc} 
            alt={accountName} 
            className="account-logo-img" 
            style={{ 
              width: '100%',
              height: '100%',
              borderRadius: isCreditCard ? 5 : (isStandalone ? 8 : 4),
              objectFit: isCreditCard ? 'contain' : (isStandalone ? 'cover' : 'contain')
            }}
          />
        </div>
      );
    }
  }

  // 2.5 Generic Legacy Bank & E-Wallet (Kotak Merah / Oranye)
  if (norm === 'bank') {
    return (
      <div className="account-logo-frame" style={{ width: size, height: size, background: '#E11D48', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width={size * 0.6} height={size * 0.6} viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 2 7 22 7 12 2"/>
          <line x1="4" y1="21" x2="20" y2="21"/>
          <line x1="6" y1="10" x2="6" y2="18"/>
          <line x1="10" y1="10" x2="10" y2="18"/>
          <line x1="14" y1="10" x2="14" y2="18"/>
          <line x1="18" y1="10" x2="18" y2="18"/>
        </svg>
      </div>
    );
  }

  if (norm === 'e-wallet' || norm === 'ewallet' || norm === 'dompet digital') {
    return (
      <div className="account-logo-frame" style={{ width: size, height: size, background: '#4F46E5', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width={size * 0.6} height={size * 0.6} viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 12V8H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h12v4"/>
          <path d="M4 6v12a2 2 0 0 0 2 2h14v-4"/>
          <path d="M18 12a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h4v-8Z"/>
        </svg>
      </div>
    );
  }

  if (norm === 'kartu kredit' || norm === 'credit card' || norm === 'cc' || norm === 'kartu') {
    return (
      <div className="account-logo-frame" style={{ width: size, height: size, background: '#2563EB', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width={size * 0.6} height={size * 0.6} viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="5" width="20" height="14" rx="2"/>
          <line x1="2" y1="10" x2="22" y2="10"/>
        </svg>
      </div>
    );
  }

  // 3. Fallback bank modern dengan teks ringkas & warna brand akurat
  if (norm.includes('jago')) {
    return (
      <div className="account-logo-frame" style={{ width: size, height: size, background: '#FF7A00', padding: 0 }}>
        <span style={{ color: '#FFFFFF', fontWeight: 900, fontSize: size * 0.32 }}>JAGO</span>
      </div>
    );
  }

  // 4. Generic Avatar Fallback untuk akun kustom buatan user
  const initial = (accountName || 'A').charAt(0).toUpperCase();
  const colors = ['#4F46E5', '#0D9488', '#E11D48', '#D97706', '#7C3AED', '#2563EB'];
  let charCodeSum = 0;
  for (let i = 0; i < (accountName || '').length; i++) {
    charCodeSum += (accountName || '').charCodeAt(i);
  }
  const chosenColor = colors[charCodeSum % colors.length];

  return (
    <div className="account-logo-frame" style={{ width: size, height: size, background: chosenColor }}>
      <span style={{ color: '#FFFFFF', fontWeight: 800, fontSize: size * 0.45 }}>{initial}</span>
    </div>
  );
};

/**
 * Standardize bank/e-wallet names so variations (e.g. BRI vs BRImo, Mandiri vs Livin) merge cleanly into 1 entry
 */

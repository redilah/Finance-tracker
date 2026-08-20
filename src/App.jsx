import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import './App.css';
import fastFoodSvg from './assets/fast-food.svg';
import gameSvg from './assets/3d-movie.svg';
import carSvg from './assets/car.svg';
import houseSvg from './assets/house_colored.svg';
import addSvg from './assets/add.svg';
import diagramSvg from './assets/diagram.svg';
import akunSvg from './assets/akun.svg';
import budgetSvg from './assets/budget.svg';
import barberSvg from './assets/barber.svg';
import bookSvg from './assets/book.svg';
import cosmeticsSvg from './assets/cosmetics.svg';
import dispenserBottleSvg from './assets/dispenser-bottle.svg';
import shirtShoeSvg from './assets/shirt-shoe.svg';
import shoppingCartSvg from './assets/shopping-cart.svg';
import subscriptionSvg from './assets/subscription.svg';
import salarySvg from './assets/salary.svg';
import bonusSvg from './assets/bonus.svg';
import kipSvg from './assets/KIP.svg';
import pesawatSvg from './assets/Pesawat.svg';
import kostSvg from './assets/Kost.svg';
import coffeeSvg from './assets/Coffee.svg';
import gofoodSvg from './assets/GoFood.svg';
import sepatuSvg from './assets/Sepatu.svg';
import donasiSvg from './assets/Donasi.svg';
import topupGameSvg from './assets/Top up Game.svg';
import bensinSvg from './assets/Bensin.svg';
import investasiSvg from './assets/investasi.svg';
import bisnisSvg from './assets/bisnis.svg';
import affiliateSvg from './assets/Affliate.svg';
import konserSvg from './assets/Konser.svg';
import pulsaSvg from './assets/Pulsa.svg';
import rumahSakitSvg from './assets/Rumah Sakit.svg';
import obatSakitSvg from './assets/Obat Sakit.svg';
import jajanAdekSvg from './assets/Jajan adek.svg';
import partySvg from './assets/Party.svg';
import buahSvg from './assets/Buah.svg';
import minumanSvg from './assets/Minuman.svg';
import fingerprintSvg from './assets/fingerprint.svg';
import { isConsumptiveHybrid, getConsumptiveTransactions } from './utils/classifier';
import { playPositiveChime } from './utils/soundFeedback';
import { NotificationTracker, initAutoExpenseTracker } from './utils/notificationTracker';
import { scheduleV24FeatureIntroNotification } from './utils/notifications';
import { checkForAppUpdates, CURRENT_VERSION_NAME } from './utils/version';
import { safeStorageGet, safeStorageSet } from './utils/secureStorage';
import VoiceMicButton from './components/VoiceMicButton';
import CategoryInsightScreen from './components/CategoryInsightScreen';
import { isEndOfMonthOrTesting } from './utils/categoryInsightEngine';
import { getTranslation, getCategoryName, LANGUAGES, FONTS, FONT_SIZES, MONTH_NAMES_I18N, MONTH_SHORT_I18N } from './utils/i18n';
import { submitUserFeedback } from './utils/feedback';
import { DEFAULT_ACCOUNTS, AccountIconBadge } from './utils/accountLogos';
import { WORLD_CURRENCIES, getCurrency, formatMoney, formatCompactMoney, fetchExchangeRates, getExchangeRateText, getFlagUrl } from './utils/currency';
import { createBackupData, exportBackup, importBackup, restoreBackupData } from './utils/backup';
import { hasUserPin, isAppLockEnabled, setAppLockEnabled, isBiometricEnabled, setBiometricEnabled, checkBiometricAvailability } from './utils/authPin';
import PinSetupModal from './components/PinSetupModal';
import PinLockScreen from './components/PinLockScreen';
import GuidedTourModal from './components/GuidedTourModal';
import { syncWidgetData } from './utils/widgetSync';

const AdminDashboard = React.lazy(() => import('./components/admin/AdminDashboard'));
import { syncLearnerWithUserData, recordDeletionEvaluation } from './utils/voiceLearner';
import { checkProhibitedContent } from './utils/safetyGuard';
import { updateCurrentDeviceTelemetry, startActiveUsageTracking } from './utils/telemetry';
import { 
  isNotificationEnabled,
  toggleNotificationState,
  sendInstantNotification, 
  sendInstantBudgetNotification,
  sendUpdateReminderNotification,
  schedulePersonalizedNotifications,
  scheduleFeatureIntroNotification,
  scheduleNewCategoryNotification,
  scheduleV20FeatureIntroNotification,
  scheduleV23FeatureIntroNotification,
  buildBudgetNotifText,
  buildMainBudgetNotifText,
  playSound,
  playPopSound 
} from './utils/notifications';

// Categories: NO icon field stored — icons resolved at runtime via ICON_MAP
const DEFAULT_EXPENSE_CATEGORIES = [
  { id: 'food', name: 'Food', iconClass: 'food-icon' },
  { id: 'bioskop', name: 'Bioskop', iconClass: 'game-icon' },
  { id: 'transport', name: 'Transportasi', iconClass: 'car-icon' },
  { id: 'barber', name: 'Barbershop', iconClass: 'barber-icon' },
  { id: 'skincare', name: 'Skincare', iconClass: 'cosmetics-icon' },
  { id: 'edukasi', name: 'Edukasi', iconClass: 'book-icon' },
  { id: 'galon', name: 'Air Galon', iconClass: 'bottle-icon' },
  { id: 'fashion', name: 'Fashion', iconClass: 'fashion-icon' },
  { id: 'supermarket', name: 'Supermarket', iconClass: 'cart-icon' },
  { id: 'sub', name: 'Subscription', iconClass: 'sub-icon' },
  { id: 'pesawat', name: 'Pesawat', iconClass: 'pesawat-icon' },
  { id: 'kost', name: 'Kost', iconClass: 'kost-icon' },
  { id: 'coffee', name: 'Coffee', iconClass: 'coffee-icon' },
  { id: 'gofood', name: 'GoFood', iconClass: 'gofood-icon' },
  { id: 'sepatu', name: 'Sepatu', iconClass: 'sepatu-icon' },
  { id: 'donasi', name: 'Donasi', iconClass: 'donasi-icon' },
  { id: 'topupGame', name: 'Top Up Game', iconClass: 'topup-game-icon' },
  { id: 'bensin', name: 'Bensin', iconClass: 'bensin-icon' },
  { id: 'konser', name: 'Konser', iconClass: 'konser-icon' },
  { id: 'pulsa', name: 'Pulsa', iconClass: 'pulsa-icon' },
  { id: 'rumahSakit', name: 'Rumah Sakit', iconClass: 'rumah-sakit-icon' },
  { id: 'obatSakit', name: 'Obat Sakit', iconClass: 'obat-sakit-icon' },
  { id: 'jajanAdek', name: 'Jajan Adek', iconClass: 'jajan-adek-icon' },
  { id: 'party', name: 'Party', iconClass: 'party-icon' },
  { id: 'buah', name: 'Buah', iconClass: 'buah-icon' },
  { id: 'minuman', name: 'Minuman', iconClass: 'minuman-icon' },
];

const DEFAULT_INCOME_CATEGORIES = [
  { id: 'gaji', name: 'Gaji', iconClass: 'food-icon' },
  { id: 'bonus', name: 'Bonus', iconClass: 'sub-icon' },
  { id: 'kip', name: 'KIP', iconClass: 'car-icon' },
  { id: 'investasi', name: 'Investasi', iconClass: 'investasi-icon' },
  { id: 'bisnis', name: 'Bisnis', iconClass: 'bisnis-icon' },
  { id: 'affiliate', name: 'Affiliate', iconClass: 'affiliate-icon' },
];

// Runtime icon lookup — NEVER stored to localStorage, only used during render
const ICON_MAP = {
  food: fastFoodSvg,
  bioskop: gameSvg,
  transport: carSvg,
  barber: barberSvg,
  skincare: cosmeticsSvg,
  edukasi: bookSvg,
  galon: dispenserBottleSvg,
  fashion: shirtShoeSvg,
  supermarket: shoppingCartSvg,
  sub: subscriptionSvg,
  pesawat: pesawatSvg,
  kost: kostSvg,
  coffee: coffeeSvg,
  gofood: gofoodSvg,
  sepatu: sepatuSvg,
  donasi: donasiSvg,
  topupGame: topupGameSvg,
  bensin: bensinSvg,
  investasi: investasiSvg,
  bisnis: bisnisSvg,
  affiliate: affiliateSvg,
  konser: konserSvg,
  pulsa: pulsaSvg,
  rumahSakit: rumahSakitSvg,
  obatSakit: obatSakitSvg,
  jajanAdek: jajanAdekSvg,
  party: partySvg,
  buah: buahSvg,
  minuman: minumanSvg,
  gaji: salarySvg,
  bonus: bonusSvg,
  kip: kipSvg,
};

// Resolve icon SVG from category id (runtime only, not from storage)
const resolveIcon = (catOrTx) => {
  if (!catOrTx) return null;
  const id = catOrTx.categoryId || catOrTx.id || null;
  return id ? (ICON_MAP[id] || null) : null;
};

// One-time migration: strip raw SVG `icon` blobs from old stored transactions
// and derive categoryId from category name mapping
const migrateTransactions = (list) => {
  if (!Array.isArray(list)) return list;
  const nameToId = {
    'Food': 'food', 'Bioskop': 'bioskop', 'Transportasi': 'transport',
    'Barbershop': 'barber', 'Skincare': 'skincare', 'Edukasi': 'edukasi',
    'Air Galon': 'galon', 'Fashion': 'fashion', 'Supermarket': 'supermarket',
    'Subscription': 'sub', 'Pesawat': 'pesawat', 'Kost': 'kost',
    'Gaji': 'gaji', 'Bonus': 'bonus', 'KIP': 'kip',
    'Bensin': 'bensin', 'Investasi': 'investasi', 'Bisnis': 'bisnis',
    'Affiliate': 'affiliate', 'Konser': 'konser', 'Pulsa': 'pulsa',
    'Rumah Sakit': 'rumahSakit', 'Obat Sakit': 'obatSakit',
    'Jajan Adek': 'jajanAdek', 'Party': 'party', 'Buah': 'buah',
    'Minuman': 'minuman',
  };
  let changed = false;
  const migrated = list.map(tx => {
    if (tx.icon !== undefined) {
      // eslint-disable-next-line no-unused-vars
      const { icon, ...rest } = tx;
      changed = true;
      return {
        ...rest,
        categoryId: rest.categoryId || nameToId[rest.category] || null,
      };
    }
    if (!tx.categoryId && tx.category) {
      changed = true;
      return { ...tx, categoryId: nameToId[tx.category] || null };
    }
    return tx;
  });
  if (changed) {
    try { safeStorageSet('user_transactions', migrated); } catch {}
  }
  return migrated;
};

// One-time migration: strip raw SVG `icon` blobs from stored categories
const migrateCategories = (list) => {
  if (!Array.isArray(list)) return list;
  return list.map(cat => {
    // eslint-disable-next-line no-unused-vars
    const { icon, ...rest } = cat;
    return rest;
  });
};

const INITIAL_TRANSACTIONS = [];

// Instrumen investasi beserta estimasi return tahunan
const INVESTMENT_INSTRUMENTS = [
  { id: 'bigbank', name: 'Big Bank', rate: 0.10, label: '10%' },
  { id: 'emas', name: 'Emas Mulia', rate: 0.07, label: '7%' },
  { id: 'obligasi', name: 'Obligasi', rate: 0.065, label: '6.5%' },
];

function AndaiFeatureView({ transactions, resolveIcon, appLanguage = 'id', t = (k) => k, appCurrency = 'IDR', liveExchangeRates = null }) {
  const [investmentYear, setInvestmentYear] = useState(5); // 1, 3, 5, 10
  const [selectedInstrument, setSelectedInstrument] = useState(INVESTMENT_INSTRUMENTS[0]); // Big Bank (8%)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Filter transaksi konsumtif bulanan
  const now = new Date();
  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const consumptiveTransactions = getConsumptiveTransactions(transactions, currentMonthStr);

  const totalConsumptiveAmount = consumptiveTransactions.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  // Hitung Future Value: FV = P * (1 + r)^n
  const futureValue = Math.round(totalConsumptiveAmount * Math.pow(1 + selectedInstrument.rate, investmentYear));
  const gain = futureValue - totalConsumptiveAmount;

  const yearUnit = t('andaiYearUnit') || 'Thn';

  return (
    <div className="andai-container-clean">
      {/* Stat Card Ringkas */}
      <div className="andai-hero-card">
        <span className="andai-hero-label">{t('andaiHeroLabel')}</span>
        <h2 className="andai-hero-amount">{formatMoney(totalConsumptiveAmount, appCurrency, liveExchangeRates)}</h2>
        <span className="andai-hero-sub">{consumptiveTransactions.length} {t('andaiTxDetected')}</span>
      </div>

      {/* Kontrol Ringkas (Pill selector & Custom Dropdown) */}
      <div className="andai-pill-row">
        <div className="andai-pill-group">
          {[1, 3, 5, 10].map(yr => (
            <button
              key={yr}
              type="button"
              className={`andai-mini-pill ${investmentYear === yr ? 'active' : ''}`}
              onClick={() => setInvestmentYear(yr)}
            >
              {yr} {yearUnit}
            </button>
          ))}
        </div>

        {/* Custom Dropdown dengan persentase ringkas */}
        <div className="stats-dropdown-wrapper" style={{ position: 'relative' }}>
          <button
            type="button"
            className="stats-period-btn"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          >
            <span>{selectedInstrument.name} {selectedInstrument.label}</span>
            <span className={`stats-select-arrow ${isDropdownOpen ? 'open' : ''}`}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 9l6 6 6-6"/>
              </svg>
            </span>
          </button>

          {isDropdownOpen && (
            <div className="custom-dropdown-menu" style={{ right: 0, left: 'auto', minWidth: '160px' }}>
              {INVESTMENT_INSTRUMENTS.map((inst) => (
                <button
                  key={inst.id}
                  type="button"
                  className={`custom-dropdown-item ${selectedInstrument.id === inst.id ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedInstrument(inst);
                    setIsDropdownOpen(false);
                  }}
                >
                  {inst.name} {inst.label}/thn
                  {selectedInstrument.id === inst.id && <span className="check-mark">✓</span>}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Hero Visual Hasil Investment vs Hangus */}
      <div className="andai-comparison-card">
        <div className="andai-compare-item current">
          <span className="compare-lbl">{t('andaiIfBought')}</span>
          <span className="compare-val zero">{getCurrency(appCurrency).symbol} 0</span>
          <span className="compare-desc">{t('andaiBurnt')}</span>
        </div>

        <div className="andai-compare-item future">
          <span className="compare-lbl">{t('andaiIfInvested')} ({investmentYear} {yearUnit})</span>
          <span className="compare-val grow">{formatMoney(futureValue, appCurrency, liveExchangeRates)}</span>
          <span className="compare-gain">+{formatMoney(gain, appCurrency, liveExchangeRates)} (+{Math.round((gain / (totalConsumptiveAmount || 1)) * 100)}%)</span>
        </div>
      </div>

      {/* Ringkasan Transaksi Konsumtif Minimalis */}
      <div className="andai-list-clean">
        <div className="list-clean-title">{t('andaiConsumptiveTitle')}</div>
        {consumptiveTransactions.length === 0 ? (
          <div className="empty-clean-text">{t('andaiEmptyClean')}</div>
        ) : (
          consumptiveTransactions.map(item => {
            const catDisplay = getCategoryName(item.category || item.categoryId || item.title, appLanguage);
            let dynamicSub = item.subtext;
            const isFood = item.categoryId === 'food' || (item.category || '').toLowerCase() === 'food' || (item.category || '').toLowerCase() === 'makanan';
            if (isFood) {
              if (appLanguage === 'jv') {
                dynamicSub = `Kelangkungan ${formatMoney(item.amount, appCurrency, liveExchangeRates)} saking wates ${getCurrency(appCurrency).symbol} 75.000/dinten`;
              } else if (appLanguage === 'en') {
                dynamicSub = `Exceeded ${formatMoney(item.amount, appCurrency, liveExchangeRates)} from limit ${getCurrency(appCurrency).symbol} 75,000/day`;
              } else if (appLanguage === 'ko') {
                dynamicSub = `Hando ${getCurrency(appCurrency).symbol} 75.000/il eseo ${formatMoney(item.amount, appCurrency, liveExchangeRates)} chogwahwa`;
              } else {
                dynamicSub = `Kelebihan ${formatMoney(item.amount, appCurrency, liveExchangeRates)} dari limit ${getCurrency(appCurrency).symbol} 75.000/hari`;
              }
            } else {
              if (appLanguage === 'jv') {
                dynamicSub = `Gunggung pangetrapan ${catDisplay.toLowerCase()} konsumtif wulan punika`;
              } else if (appLanguage === 'en') {
                dynamicSub = `Total consumptive ${catDisplay.toLowerCase()} expenses this month`;
              } else if (appLanguage === 'ko') {
                dynamicSub = `Ibeondal ${catDisplay.toLowerCase()} sobiseong jichul chong-aek`;
              } else {
                dynamicSub = `Total pengeluaran ${catDisplay.toLowerCase()} konsumtif bulan ini`;
              }
            }

            return (
              <div className="item-clean-row" key={item.id}>
                <div className="item-clean-left">
                  <div className="item-clean-icon">
                    {resolveIcon(item) ? (
                      <img src={resolveIcon(item)} alt={catDisplay} />
                    ) : (
                      <span>🛍️</span>
                    )}
                  </div>
                  <div className="item-clean-meta">
                    <span className="item-clean-title">{catDisplay}</span>
                    <span className="item-clean-sub">{dynamicSub}</span>
                  </div>
                </div>
                <span className="item-clean-amount">-{formatMoney(item.amount, appCurrency, liveExchangeRates)}</span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function LossAversionBadge({ transactions, handleOpenAndaiModal, fmtMoney, t }) {
  const now = new Date();
  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const consumptiveTransactions = getConsumptiveTransactions(transactions, currentMonthStr);

  const totalConsumptiveAmount = consumptiveTransactions.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  if (totalConsumptiveAmount === 0) return null;

  const selectedInstrument = INVESTMENT_INSTRUMENTS[0];
  const investmentYear = 5;
  const futureValue = Math.round(totalConsumptiveAmount * Math.pow(1 + selectedInstrument.rate, investmentYear));
  const gain = futureValue - totalConsumptiveAmount;

  const warningLabel = t ? t('lossAversionWarning') : '⚠️ Peringatan Konsumtif';
  const detailLabel = t ? t('lossAversionDetail') : 'Detail ›';
  const prefix = t ? t('lossAversionPrefix') : 'Bulan ini Anda';
  const lostLabel = t ? t('lossAversionLost') : 'kehilangan potensi dana';
  const suffix = t ? t('lossAversionSuffix') : 'dalam 5 tahun akibat pengeluaran konsumtif.';
  const formattedGain = fmtMoney ? fmtMoney(gain) : `Rp ${gain.toLocaleString('id-ID')}`;

  return (
    <div 
      className="loss-aversion-badge" 
      onClick={handleOpenAndaiModal}
      style={{
        margin: '0 0 16px',
        padding: '12px 16px',
        background: 'linear-gradient(135deg, #fff0f0 0%, #ffe6e6 100%)',
        borderLeft: '4px solid #ff4d4f',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(255, 77, 79, 0.1)',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '13px', fontWeight: '600', color: '#cf1322' }}>
          ⚠️ {warningLabel.replace(/^⚠️\s*/, '')}
        </span>
        <span style={{ fontSize: '12px', color: '#ff4d4f' }}>{detailLabel}</span>
      </div>
      <span style={{ fontSize: '12px', color: '#5c0011', lineHeight: '1.4' }}>
        {prefix} <strong>{lostLabel} {formattedGain}</strong> {suffix}
      </span>
    </div>
  );
}

/**
 * Komponen Kartu Transaksi Baru Khusus Input Suara:
 * 1. Pop Timbul dari Belakang (3D Elevation Depth)
 * 2. Animasi Ketik (Typewriter) Mengalir Alami dari Kiri ke Kanan (Single Unified Timer - Anti-Stuck)
 */
function VoiceAnimatedTransactionItem({ item, resolveIcon, isDeleting, onAnimationComplete }) {
  const fullTitle = item.title || item.category || 'Transaksi';
  const fullSubtitle = `${item.category || ''} • ${item.account || 'Cash'}`;
  const prefix = item.type === 'expense' ? '-' : '+';
  const fullAmount = `${prefix}Rp ${item.amount.toLocaleString('id-ID')}`;

  const L1 = fullTitle.length;
  const L2 = fullSubtitle.length;
  const L3 = fullAmount.length;
  const totalChars = L1 + L2 + L3;

  const [charProgress, setCharProgress] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  useEffect(() => {
    let current = 0;
    let finishTimer = null;

    const interval = setInterval(() => {
      current++;
      setCharProgress(current);
      if (current >= totalChars) {
        clearInterval(interval);
        setIsFinished(true);
        // Setelah selesai mengetik, lepaskan dari state animasi agar menjadi kartu statis permanen
        finishTimer = setTimeout(() => {
          if (onAnimationComplete) {
            onAnimationComplete(item.id);
          }
        }, 500);
      }
    }, 35); // Kecepatan mengalir 35ms per karakter

    return () => {
      clearInterval(interval);
      if (finishTimer) clearTimeout(finishTimer);
    };
  }, [totalChars, item.id, onAnimationComplete]);

  // Hitung teks yang tampil berdasarkan progress saat ini
  let displayedTitle = '';
  let displayedSubtitle = '';
  let displayedAmount = '';
  let currentCursor = 'title'; // 'title' | 'sub' | 'amount' | 'none'

  if (isFinished) {
    displayedTitle = fullTitle;
    displayedSubtitle = fullSubtitle;
    displayedAmount = fullAmount;
    currentCursor = 'none';
  } else if (charProgress <= L1) {
    displayedTitle = fullTitle.slice(0, charProgress);
    currentCursor = 'title';
  } else if (charProgress <= L1 + L2) {
    displayedTitle = fullTitle;
    displayedSubtitle = fullSubtitle.slice(0, charProgress - L1);
    currentCursor = 'sub';
  } else {
    displayedTitle = fullTitle;
    displayedSubtitle = fullSubtitle;
    displayedAmount = fullAmount.slice(0, charProgress - L1 - L2);
    currentCursor = 'amount';
  }

  return (
    <div className={`transaction-item voice-card-timbul ${isDeleting ? 'deleting-sink' : ''}`} key={item.id}>
      <div className={`transaction-icon ${item.iconClass} voice-icon-pop`}>
        {resolveIcon(item) && <img src={resolveIcon(item)} alt={item.category} />}
      </div>
      <div className="transaction-details" style={{ textAlign: 'left', direction: 'ltr' }}>
        <span className="transaction-title" style={{ textAlign: 'left', direction: 'ltr', display: 'inline-flex', alignItems: 'center' }}>
          {displayedTitle}
          {currentCursor === 'title' && <span className="typewriter-cursor">|</span>}
        </span>
        <span className="transaction-category" style={{ textAlign: 'left', direction: 'ltr', display: 'inline-flex', alignItems: 'center' }}>
          {displayedSubtitle}
          {currentCursor === 'sub' && <span className="typewriter-cursor">|</span>}
        </span>
      </div>
      <div className={`transaction-amount ${item.type === 'expense' ? 'negative' : 'positive'}`} style={{ textAlign: 'left', direction: 'ltr', display: 'inline-flex', alignItems: 'center', justifyContent: 'flex-start', minWidth: '105px' }}>
        <span>{displayedAmount}</span>
        {currentCursor === 'amount' && <span className="typewriter-cursor">|</span>}
      </div>
    </div>
  );
}

function App() {
  const [activeTab, setActiveTab] = useState('home'); // 'home' | 'stats'
  const [currentDate, setCurrentDate] = useState(new Date());
  const [periodFilter, setPeriodFilter] = useState('monthly'); // 'monthly' | 'weekly' | 'yearly'
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [statsType, setStatsType] = useState('expense'); // 'expense' | 'income'
  const [statsSubTab, setStatsSubTab] = useState('pie'); // 'pie' | 'chart'
  const [selectedInsightCategory, setSelectedInsightCategory] = useState(null);
  
  // Track which category insights have been read per month
  const [insightReadMap, setInsightReadMap] = useState(() => {
    try {
      const saved = localStorage.getItem('user_category_insights_read');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const isCategoryInsightRead = (catName, year, monthIdx) => {
    const key = `${catName}_${year}_${monthIdx}`;
    return Boolean(insightReadMap[key]);
  };

  const handleOpenCategoryInsight = (cat) => {
    if (!cat) return;
    const year = currentDate.getFullYear();
    const monthIdx = currentDate.getMonth();
    const key = `${cat.name}_${year}_${monthIdx}`;
    const nextMap = { ...insightReadMap, [key]: true };
    setInsightReadMap(nextMap);
    try {
      localStorage.setItem('user_category_insights_read', JSON.stringify(nextMap));
    } catch {}
    
    // Temukan metadata lengkap kategori (termasuk iconClass, id, dll.)
    const fullCat = expenseCategories.find(c => c.name === cat.name || c.id === cat.categoryId || c.id === cat.id) ||
                    incomeCategories.find(c => c.name === cat.name || c.id === cat.categoryId || c.id === cat.id) ||
                    cat;
    setSelectedInsightCategory({ ...cat, ...fullCat });
  };
  
  // LocalStorage Persistence for Transactions
  const [transactions, setTransactions] = useState(() => {
    try {
      const saved = safeStorageGet('user_transactions');
      // Run migration to strip old SVG blobs on first load
      return saved ? migrateTransactions(saved) : INITIAL_TRANSACTIONS;
    } catch {
      return INITIAL_TRANSACTIONS;
    }
  });

  // LocalStorage Persistence for Custom Categories & Accounts
  const [expenseCategories, setExpenseCategories] = useState(() => {
    try {
      const saved = safeStorageGet('user_expense_categories');
      if (saved) {
        const loaded = migrateCategories(saved);
        const merged = [...loaded];
        DEFAULT_EXPENSE_CATEGORIES.forEach(defaultCat => {
          if (!merged.some(cat => cat.id === defaultCat.id)) {
            merged.push(defaultCat);
          }
        });
        return merged;
      }
      return DEFAULT_EXPENSE_CATEGORIES;
    } catch {
      return DEFAULT_EXPENSE_CATEGORIES;
    }
  });

  const [incomeCategories, setIncomeCategories] = useState(() => {
    try {
      const saved = safeStorageGet('user_income_categories');
      if (saved) {
        const loaded = migrateCategories(saved);
        const merged = [...loaded];
        DEFAULT_INCOME_CATEGORIES.forEach(defaultCat => {
          if (!merged.some(cat => cat.id === defaultCat.id)) {
            merged.push(defaultCat);
          }
        });
        return merged;
      }
      return DEFAULT_INCOME_CATEGORIES;
    } catch {
      return DEFAULT_INCOME_CATEGORIES;
    }
  });

  const [isAccountDeleteMode, setIsAccountDeleteMode] = useState(false);
  const [deletedAccountsHistory, setDeletedAccountsHistory] = useState([]);
  const [deletedAccountsList, setDeletedAccountsList] = useState(() => {
    try {
      const saved = safeStorageGet('user_deleted_accounts');
      return Array.isArray(saved) ? saved : [];
    } catch {
      return [];
    }
  });

  const [accountsList, setAccountsList] = useState(() => {
    const defaultList = DEFAULT_ACCOUNTS.map(a => a.name);
    try {
      const saved = safeStorageGet('user_accounts_list');
      const deleted = safeStorageGet('user_deleted_accounts') || [];
      const deletedNorm = Array.isArray(deleted) ? deleted.map(d => (d || '').toLowerCase().trim()) : [];
      const deprecated = ['bank', 'e-wallet', 'mandiri', 'bni', 'pos indonesia', 'pos', 'pegadaian'];

      if (Array.isArray(saved) && saved.length > 0) {
        const filtered = saved
          .filter(acc => {
            const n = (acc || '').toLowerCase().trim();
            return !deprecated.includes(n) && !deletedNorm.includes(n);
          })
          .map(acc => (acc && acc.toLowerCase().trim() === 'bri') ? 'BRImo' : acc);
        
        // Hanya gabungkan akun default baru yang belum ada dan belum pernah dihapus pengguna
        defaultList.forEach(item => {
          const itemNorm = item.toLowerCase().trim();
          if (!filtered.some(a => a.toLowerCase() === item.toLowerCase()) && !deletedNorm.includes(itemNorm) && !deprecated.includes(itemNorm)) {
            filtered.push(item);
          }
        });
        return filtered.length > 0 ? filtered : ['Cash', 'BRImo'];
      }
      return defaultList.filter(item => !deletedNorm.includes(item.toLowerCase().trim()));
    } catch {
      return defaultList;
    }
  });

  const [isCustomAccount, setIsCustomAccount] = useState(false);
  const [customAccountInput, setCustomAccountInput] = useState('');
  const [adjustingAccount, setAdjustingAccount] = useState(null); // Akun generik lama yang sedang disesuaikan (misal: 'Bank' / 'E-Wallet')

  // Status One-time Discovery Hint "Terakhir" untuk urutan No. 1
  const [dismissedLastBadge, setDismissedLastBadge] = useState(() => {
    return safeStorageGet('user_last_badge_dismissed') === 'true' || safeStorageGet('user_last_badge_dismissed') === true;
  });

  const handleDismissLastBadge = () => {
    if (!dismissedLastBadge) {
      setDismissedLastBadge(true);
      try {
        safeStorageSet('user_last_badge_dismissed', 'true');
      } catch {}
    }
  };

  // Smart Frequency & Recency Ranking untuk Kategori
  const sortedExpenseCategories = useMemo(() => {
    if (!transactions || transactions.length === 0) return expenseCategories;
    
    // Hitung frekuensi dan index transaksi terakhir untuk pengeluaran
    const catFreq = {};
    const catLastIdx = {};
    transactions.forEach((tx, idx) => {
      if (tx.type === 'Expense' || !tx.type) {
        const catKey = (tx.categoryId || tx.category || '').toLowerCase().trim();
        if (catKey) {
          catFreq[catKey] = (catFreq[catKey] || 0) + 1;
          if (catLastIdx[catKey] === undefined) {
            catLastIdx[catKey] = idx; // Semakin kecil index, semakin baru transaksinya
          }
        }
      }
    });

    const getScore = (cat) => {
      const idKey = (cat.id || '').toLowerCase().trim();
      const nameKey = (cat.name || '').toLowerCase().trim();
      const freq = catFreq[idKey] || catFreq[nameKey] || 0;
      const lastIdx = catLastIdx[idKey] !== undefined ? catLastIdx[idKey] : (catLastIdx[nameKey] !== undefined ? catLastIdx[nameKey] : 999999);
      return { freq, lastIdx };
    };

    return [...expenseCategories].sort((a, b) => {
      const scoreA = getScore(a);
      const scoreB = getScore(b);
      // 1. Prioritaskan frekuensi pemakaian terbanyak
      if (scoreB.freq !== scoreA.freq) {
        return scoreB.freq - scoreA.freq;
      }
      // 2. Jika frekuensi sama dan > 0, prioritaskan yang terakhir dipakai
      if (scoreA.freq > 0 && scoreA.lastIdx !== scoreB.lastIdx) {
        return scoreA.lastIdx - scoreB.lastIdx;
      }
      return 0;
    });
  }, [expenseCategories, transactions]);

  const sortedIncomeCategories = useMemo(() => {
    if (!transactions || transactions.length === 0) return incomeCategories;

    const catFreq = {};
    const catLastIdx = {};
    transactions.forEach((tx, idx) => {
      if (tx.type === 'Income') {
        const catKey = (tx.categoryId || tx.category || '').toLowerCase().trim();
        if (catKey) {
          catFreq[catKey] = (catFreq[catKey] || 0) + 1;
          if (catLastIdx[catKey] === undefined) {
            catLastIdx[catKey] = idx;
          }
        }
      }
    });

    const getScore = (cat) => {
      const idKey = (cat.id || '').toLowerCase().trim();
      const nameKey = (cat.name || '').toLowerCase().trim();
      const freq = catFreq[idKey] || catFreq[nameKey] || 0;
      const lastIdx = catLastIdx[idKey] !== undefined ? catLastIdx[idKey] : (catLastIdx[nameKey] !== undefined ? catLastIdx[nameKey] : 999999);
      return { freq, lastIdx };
    };

    return [...incomeCategories].sort((a, b) => {
      const scoreA = getScore(a);
      const scoreB = getScore(b);
      if (scoreB.freq !== scoreA.freq) {
        return scoreB.freq - scoreA.freq;
      }
      if (scoreA.freq > 0 && scoreA.lastIdx !== scoreB.lastIdx) {
        return scoreA.lastIdx - scoreB.lastIdx;
      }
      return 0;
    });
  }, [incomeCategories, transactions]);

  // Smart Frequency & Recency Ranking untuk Akun
  const sortedAccountsList = useMemo(() => {
    if (!transactions || transactions.length === 0) return accountsList;

    const accFreq = {};
    const accLastIdx = {};
    transactions.forEach((tx, idx) => {
      const accKey = (tx.account || '').toLowerCase().trim();
      if (accKey) {
        accFreq[accKey] = (accFreq[accKey] || 0) + 1;
        if (accLastIdx[accKey] === undefined) {
          accLastIdx[accKey] = idx;
        }
      }
    });

    return [...accountsList].sort((a, b) => {
      const keyA = (a || '').toLowerCase().trim();
      const keyB = (b || '').toLowerCase().trim();
      const freqA = accFreq[keyA] || 0;
      const freqB = accFreq[keyB] || 0;
      if (freqB !== freqA) {
        return freqB - freqA;
      }
      if (freqA > 0) {
        const lastA = accLastIdx[keyA] !== undefined ? accLastIdx[keyA] : 999999;
        const lastB = accLastIdx[keyB] !== undefined ? accLastIdx[keyB] : 999999;
        if (lastA !== lastB) return lastA - lastB;
      }
      return 0;
    });
  }, [accountsList, transactions]);

  // Profile State & Persistence
  const [isProfileSetupDone, setIsProfileSetupDone] = useState(() => {
    return Boolean(safeStorageGet('user_profile_setup_done'));
  });
  const isFirstTimeUser = !isProfileSetupDone;

  const [profileName, setProfileName] = useState(() => {
    return safeStorageGet('user_profile_name') || '';
  });
  const [profileImage, setProfileImage] = useState(() => {
    return safeStorageGet('user_profile_image') || null;
  });

  // Auto-open modal on first time setup
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(isFirstTimeUser);
  const [isBudgetCapModalOpen, setIsBudgetCapModalOpen] = useState(false);

  // Monthly Budgets Map: { 'YYYY-MM': { main: number | null, categories: { [catId]: number } } }
  const [monthlyBudgetsMap, setMonthlyBudgetsMap] = useState(() => {
    try {
      const saved = safeStorageGet('user_monthly_budgets_map');
      if (saved) {
        return typeof saved === 'string' ? JSON.parse(saved) : saved;
      }
    } catch {}
    // Migration: jika ada data lama user_main_monthly_budget, masukkan ke bulan saat ini
    const legacyMain = Number(safeStorageGet('user_main_monthly_budget'));
    const now = new Date();
    const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const initialMap = {};
    if (!isNaN(legacyMain) && legacyMain > 0) {
      initialMap[currentMonthKey] = { main: legacyMain, categories: {} };
    }
    return initialMap;
  });

  const activeMonthKey = useMemo(() => {
    return `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
  }, [currentDate]);

  const mainMonthlyBudget = useMemo(() => {
    const monthData = monthlyBudgetsMap[activeMonthKey];
    if (monthData && typeof monthData.main === 'number' && monthData.main > 0) {
      return monthData.main;
    }
    return null;
  }, [monthlyBudgetsMap, activeMonthKey]);

  const [isEditingMainBudget, setIsEditingMainBudget] = useState(false);
  const [mainBudgetInputValue, setMainBudgetInputValue] = useState('');
  const mainBudgetInputRef = useRef(null);
  const [isBudgetMonthPickerOpen, setIsBudgetMonthPickerOpen] = useState(false);
  const [budgetPickerYear, setBudgetPickerYear] = useState(() => new Date().getFullYear());
  const [hasVisitedBudgetCap, setHasVisitedBudgetCap] = useState(() => {
    return safeStorageGet('user_has_visited_budget_cap') === 'true' || safeStorageGet('user_has_visited_budget_cap') === true;
  });
  const [budgetFilterTab, setBudgetFilterTab] = useState('all'); // 'all' | 'active' | 'unset'
  const [isBudgetCategoriesExpanded, setIsBudgetCategoriesExpanded] = useState(false);
  const [activeBudgetCategory, setActiveBudgetCategory] = useState(null);
  const [budgetModalInputValue, setBudgetModalInputValue] = useState('');
  const [budgetSearchQuery, setBudgetSearchQuery] = useState('');

  const [accountsSubTab, setAccountsSubTab] = useState('expense'); // 'expense' | 'income'
  const accountTouchStartXRef = useRef(null);
  const accountTouchStartYRef = useRef(null);

  const handleAccountTouchStart = (e) => {
    if (e.touches && e.touches.length === 1) {
      accountTouchStartXRef.current = e.touches[0].clientX;
      accountTouchStartYRef.current = e.touches[0].clientY;
    }
  };

  const handleAccountTouchEnd = (e) => {
    if (accountTouchStartXRef.current === null) return;
    const endX = e.changedTouches ? e.changedTouches[0].clientX : e.clientX;
    const endY = e.changedTouches ? e.changedTouches[0].clientY : e.clientY;
    const diffX = accountTouchStartXRef.current - endX;
    const diffY = accountTouchStartYRef.current - endY;

    // Geser horizontal (minimal 45px, dan lebih dominan dibanding geser vertikal)
    if (Math.abs(diffX) > 45 && Math.abs(diffX) > Math.abs(diffY)) {
      if (diffX > 0 && accountsSubTab === 'expense') {
        // Geser ke kiri -> ke Income
        setAccountsSubTab('income');
      } else if (diffX < 0 && accountsSubTab === 'income') {
        // Geser ke kanan -> ke Expense
        setAccountsSubTab('expense');
      }
    }
    accountTouchStartXRef.current = null;
    accountTouchStartYRef.current = null;
  };

  const handleOpenBudgetCap = () => {
    if (!hasVisitedBudgetCap) {
      setHasVisitedBudgetCap(true);
      localStorage.setItem('user_has_visited_budget_cap', 'true');
    }
    setIsBudgetCapModalOpen(true);
  };

  // Home Transaction Type Filter ('expense' | 'income')
  const [homeTxFilter, setHomeTxFilter] = useState('expense');

  // Font, Font Size, and Language Settings
  const [appFont, setAppFont] = useState(() => safeStorageGet('user_app_font') || 'lora');
  const [tempFont, setTempFont] = useState(() => safeStorageGet('user_app_font') || 'lora');
  const [appFontSize, setAppFontSize] = useState(() => safeStorageGet('user_app_font_size') || 'default');
  const [tempFontSize, setTempFontSize] = useState(() => safeStorageGet('user_app_font_size') || 'default');
  const [appLanguage, setAppLanguage] = useState(() => {
    const savedLang = safeStorageGet('user_app_lang');
    const migratedVersion = safeStorageGet('user_lang_migrated_v19');
    // Khusus update ke versi ini (v1.0.18 / code 19), aktifkan Basa Jawa langsung jika belum pernah migrasi
    if (!migratedVersion) {
      safeStorageSet('user_lang_migrated_v19', 'done');
      safeStorageSet('user_app_lang', 'jv');
      return 'jv';
    }
    return savedLang || 'id';
  });
  const [tempLanguage, setTempLanguage] = useState(() => safeStorageGet('user_app_lang') || 'jv');
  const [isOnboardingLangOpen, setIsOnboardingLangOpen] = useState(false);
  const [isFontModalOpen, setIsFontModalOpen] = useState(false);
  const [isFontSizeModalOpen, setIsFontSizeModalOpen] = useState(false);
  const [isLangModalOpen, setIsLangModalOpen] = useState(false);
  
  // Currency State
  const [appCurrency, setAppCurrency] = useState(() => safeStorageGet('user_app_currency') || 'IDR');
  const [tempCurrency, setTempCurrency] = useState(() => safeStorageGet('user_app_currency') || 'IDR');
  const [isCurrencyModalOpen, setIsCurrencyModalOpen] = useState(false);
  const [currencySearch, setCurrencySearch] = useState('');
  const [liveExchangeRates, setLiveExchangeRates] = useState(null);

  useEffect(() => {
    fetchExchangeRates().then(rates => {
      if (rates) setLiveExchangeRates(rates);
    });
  }, []);

  const handleOpenCurrencyModal = () => {
    setTempCurrency(appCurrency);
    setCurrencySearch('');
    setIsCurrencyModalOpen(true);
  };

  const handleSelectCurrency = (curCode) => {
    setAppCurrency(curCode);
    safeStorageSet('user_app_currency', curCode);
  };

  const filteredCurrencies = useMemo(() => {
    if (!currencySearch.trim()) return WORLD_CURRENCIES;
    const q = currencySearch.toLowerCase().trim();
    return WORLD_CURRENCIES.filter(c => 
      c.code.toLowerCase().includes(q) ||
      (c.displayName && c.displayName.toLowerCase().includes(q)) ||
      (c.country && c.country.toLowerCase().includes(q)) ||
      (c.symbol && c.symbol.toLowerCase().includes(q))
    );
  }, [currencySearch]);

  const fmtMoney = useCallback((amount, includeSymbol = true) => {
    return formatMoney(amount, appCurrency, liveExchangeRates, includeSymbol);
  }, [appCurrency, liveExchangeRates]);

  // Balance Card Detail Popup (Pop to front on tap)
  const [activeBalanceDetail, setActiveBalanceDetail] = useState(null);

  // Feedback for Developer State
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [feedbackCategory, setFeedbackCategory] = useState('Saran Fitur');
  const [feedbackText, setFeedbackText] = useState('');
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);

  // Backup & Restore State
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [isBackupProcessing, setIsBackupProcessing] = useState(false);
  const [backupRestoreConfirm, setBackupRestoreConfirm] = useState(null); // holds pending restore data

  // Security / PIN / Biometric State
  const [userHasPin, setUserHasPin] = useState(() => hasUserPin());
  const [isLockEnabled, setIsLockEnabled] = useState(() => isAppLockEnabled());
  const [isBiometricActive, setIsBiometricActive] = useState(() => isBiometricEnabled());
  const [isPinSetupModalOpen, setIsPinSetupModalOpen] = useState(false);
  const [isAppLocked, setIsAppLocked] = useState(() => hasUserPin() && isAppLockEnabled());

  // Interactive Guided Tour State
  // Rule: 
  // 1. User Baru (setelah onboarding profile selesai): Wajib panduan aplikasi penuh (mode: 'full_guide')
  // 2. User Lama (yang update ke versi ini): Wajib 4-fitur utama tour (mode: 'new_user_v20')
  const [isTourOpen, setIsTourOpen] = useState(() => {
    const isSetupDone = safeStorageGet('user_profile_setup_done');
    if (!isSetupDone) {
      // User baru belum selesai setup profil, jangan buka tour dulu sampai profil disimpan
      return false;
    }
    const updateTourCompleted = safeStorageGet('cassiel_guided_tour_v20_completed');
    return updateTourCompleted !== 'true' && updateTourCompleted !== true;
  });
  const [tourMode, setTourMode] = useState('new_user_v20'); // 'new_user_v20' (4 steps) | 'full_guide' (8 steps)

  const handleCompleteTour = () => {
    try {
      safeStorageSet('cassiel_guided_tour_v20_completed', 'true');
      safeStorageSet('cassiel_guided_tour_full_completed', 'true');
    } catch {}
    setIsTourOpen(false);
  };

  const handleOpenFullGuide = () => {
    setTourMode('full_guide');
    setIsTourOpen(true);
  };

  // Translation helper
  const t = useCallback((key) => getTranslation(appLanguage, key), [appLanguage]);

  // Apply Font globally
  useEffect(() => {
    document.documentElement.setAttribute('data-font', appFont);
    const rootEl = document.getElementById('root');
    if (rootEl) {
      rootEl.setAttribute('data-font', appFont);
    }
  }, [appFont]);

  // Apply Font Size globally
  useEffect(() => {
    document.documentElement.setAttribute('data-font-size', appFontSize);
    const rootEl = document.getElementById('root');
    if (rootEl) {
      rootEl.setAttribute('data-font-size', appFontSize);
    }
    
    // Direct Global CSS Font Multiplier
    const scaleMap = {
      'default': '100%',
      '13pt': '110%',
      '14pt': '120%',
      '18pt': '135%'
    };
    const targetScale = scaleMap[appFontSize] || '100%';
    document.documentElement.style.fontSize = targetScale;
    if (rootEl) {
      rootEl.style.fontSize = targetScale;
    }
  }, [appFontSize]);

  const handleOpenFontModal = () => {
    setTempFont(appFont);
    setIsFontModalOpen(true);
  };

  const handleOpenFontSizeModal = () => {
    setTempFontSize(appFontSize);
    setIsFontSizeModalOpen(true);
  };

  const handleOpenLangModal = () => {
    setTempLanguage(appLanguage);
    setIsLangModalOpen(true);
  };

  const handleSelectFont = (fontId) => {
    setAppFont(fontId);
    safeStorageSet('user_app_font', fontId);
  };

  const handleSelectFontSize = (sizeId) => {
    setAppFontSize(sizeId);
    safeStorageSet('user_app_font_size', sizeId);
  };

  const handleSelectLanguage = (langCode) => {
    setAppLanguage(langCode);
    safeStorageSet('user_app_lang', langCode);
  };

  // === Backup & Restore Handlers ===
  const handleExportBackup = async () => {
    if (isBackupProcessing) return;
    setIsBackupProcessing(true);
    try {
      const backupObj = createBackupData({
        transactions,
        expenseCategories,
        incomeCategories,
        accountsList,
        deletedAccountsList,
        profileName,
        profileImage,
        appFont,
        appFontSize,
        appLanguage,
        appCurrency,
      });
      const result = await exportBackup(backupObj, profileName);
      if (result.success) {
        safeStorageSet('user_last_backup_time', new Date().toISOString());
        showVoiceToast(t('backupSuccess'));
      } else if (result.cancelled) {
        showVoiceToast(t('backupCancelled'));
      } else {
        showVoiceToast(t('backupFailed'));
      }
    } catch (err) {
      console.error('[Backup] Export error:', err);
      showVoiceToast(t('backupFailed'));
    } finally {
      setIsBackupProcessing(false);
    }
  };

  const handleImportBackup = async () => {
    if (isBackupProcessing) return;
    setIsBackupProcessing(true);
    try {
      const result = await importBackup();
      if (!result) {
        // User cancelled file picker
        setIsBackupProcessing(false);
        return;
      }
      if (result.error) {
        const msgMap = {
          invalid_format: t('restoreInvalidFile'),
          parse_error: t('restoreParseError'),
          read_error: t('restoreReadError'),
        };
        showVoiceToast(msgMap[result.error] || t('restoreFailed'));
        setIsBackupProcessing(false);
        return;
      }
      if (result.success && result.backup) {
        // Show confirmation before restoring
        setBackupRestoreConfirm(result.backup);
      }
    } catch (err) {
      console.error('[Backup] Import error:', err);
      showVoiceToast(t('restoreFailed'));
    } finally {
      setIsBackupProcessing(false);
    }
  };

  const handleConfirmRestore = () => {
    if (!backupRestoreConfirm) return;
    const backupData = backupRestoreConfirm.data;
    const result = restoreBackupData(backupData, {
      setTransactions,
      setExpenseCategories,
      setIncomeCategories,
      setAccountsList,
      setDeletedAccountsList,
      setProfileName,
      setProfileImage,
      setAppFont,
      setAppFontSize,
      setAppLanguage,
      setAppCurrency,
      setMainMonthlyBudget,
    });
    setBackupRestoreConfirm(null);
    if (result.success) {
      showVoiceToast(t('restoreSuccess'));
      // Reload app after short delay to apply all restored state cleanly
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } else {
      showVoiceToast(t('restoreFailed'));
    }
  };

  // Voice-Command Deletion & Feedback Toast State
  const [deletingTxId, setDeletingTxId] = useState(null);
  const [voiceAnimatingTxIds, setVoiceAnimatingTxIds] = useState(() => new Set());
  const [voiceToastMessage, setVoiceToastMessage] = useState(null);
  const toastTimerRef = useRef(null);

  const showVoiceToast = useCallback((msg) => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
      toastTimerRef.current = null;
    }
    setVoiceToastMessage(msg);
    toastTimerRef.current = setTimeout(() => {
      setVoiceToastMessage(null);
      toastTimerRef.current = null;
    }, 2800);
  }, []);

  const handleSubmitFeedback = async () => {
    if (!feedbackText.trim()) return;
    setIsSubmittingFeedback(true);
    try {
      await submitUserFeedback({
        category: feedbackCategory,
        message: feedbackText,
        userName: profileName
      });
      setFeedbackText('');
      setIsFeedbackModalOpen(false);
      showVoiceToast(t('feedbackSuccess'));
    } catch (err) {
      console.error('Feedback submit error:', err);
      showVoiceToast(t('feedbackError'));
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  const handleVoiceAnimationComplete = useCallback((txId) => {
    setVoiceAnimatingTxIds(prev => {
      if (!prev.has(txId)) return prev;
      const next = new Set(prev);
      next.delete(txId);
      return next;
    });
  }, []);

  // Reset semua animasi kartu suara jika pengguna berpindah tab dari Home
  useEffect(() => {
    if (activeTab !== 'home') {
      setVoiceAnimatingTxIds(new Set());
    }
  }, [activeTab]);

  // Safety Warning Modal State (Pencegahan transaksi ilegal / berbahaya / rokok / alkohol / asusila)
  const [safetyWarning, setSafetyWarning] = useState({ isOpen: false, categoryLabel: '', reason: '' });

  // Sync Continuous Voice Learner with User Data
  useEffect(() => {
    syncLearnerWithUserData(expenseCategories, transactions);
  }, [expenseCategories, transactions]);

  // In-App Update Check State
  const [updateInfo, setUpdateInfo] = useState(null);

  // Notification Bell State (Persisted)
  const [isNotifActive, setIsNotifActive] = useState(() => isNotificationEnabled());

  // Auto-Tracker Notification Listener Toggle State (Persisted in localStorage & SharedPreferences)
  const [isAutoTrackerActive, setIsAutoTrackerActive] = useState(() => {
    return safeStorageGet('user_auto_tracker_active') === true;
  });

  // Sync Auto-Tracker setting with native layer on startup
  useEffect(() => {
    if (isAutoTrackerActive) {
      NotificationTracker.setAutoTrackerEnabled({ enabled: true }).catch(() => {});
    } else {
      NotificationTracker.setAutoTrackerEnabled({ enabled: false }).catch(() => {});
    }
  }, [isAutoTrackerActive]);

  // Hook Auto-Tracker incoming transactions to App state
  useEffect(() => {
    if (!isAutoTrackerActive) return;
    initAutoExpenseTracker((newTransactions) => {
      if (Array.isArray(newTransactions) && newTransactions.length > 0) {
        setTransactions(prev => {
          const updated = [...newTransactions, ...prev];
          safeStorageSet('user_transactions', updated);
          return updated;
        });
        showVoiceToast(`✨ ${newTransactions.length} transaksi otomatis dicatat!`);
      }
    });
  }, [isAutoTrackerActive, showVoiceToast]);

  // Schedule 5-second post-update notification for v1.0.24 features
  useEffect(() => {
    scheduleV24FeatureIntroNotification(profileName, appLanguage);
  }, [profileName, appLanguage]);

  // Web Admin Dashboard URL detection (?admin or /admin)
  const [isAdminView, setIsAdminView] = useState(() => {
    return window.location.search.includes('admin') || window.location.pathname.startsWith('/admin');
  });

  // Hide HTML splash screen immediately on app load once React is ready
  React.useEffect(() => {
    const splash = document.getElementById('app-splash-screen');
    if (splash) {
      splash.classList.add('splash-exit');
      const timer = setTimeout(() => {
        if (splash && splash.parentNode) {
          splash.parentNode.removeChild(splash);
        }
      }, 400);
      return () => clearTimeout(timer);
    }
  }, []);

  // Track & update device telemetry on launch / profile change
  React.useEffect(() => {
    startActiveUsageTracking();
    updateCurrentDeviceTelemetry();
  }, [profileName, transactions]);

  // Adjust root container width mode for admin view
  React.useEffect(() => {
    const root = document.getElementById('root');
    if (root) {
      if (isAdminView) {
        root.classList.add('admin-mode');
      } else {
        root.classList.remove('admin-mode');
      }
    }
  }, [isAdminView]);

  // Listen to popstate for back/forward browser navigation for ?admin
  React.useEffect(() => {
    const handlePopState = () => {
      const checkAdmin = window.location.search.includes('admin') || window.location.pathname.startsWith('/admin');
      setIsAdminView(checkAdmin);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Play sound on app start if notification bell was already enabled
  React.useEffect(() => {
    if (isNotificationEnabled()) {
      playSound('app_open');
    }
  }, []);

  // Schedule 1-day feature intro notification on Android native (08:00 & 18:00)
  React.useEffect(() => {
    scheduleFeatureIntroNotification(profileName, appLanguage);
    scheduleNewCategoryNotification(profileName, appLanguage);
    scheduleV20FeatureIntroNotification(profileName, appLanguage);
    scheduleV23FeatureIntroNotification(profileName, appLanguage);
  }, [profileName, appLanguage]);

  // Schedule / sync notifications when profile name, transactions, expenseCategories, language, or main budget update
  React.useEffect(() => {
    if (isNotifActive) {
      schedulePersonalizedNotifications(profileName, transactions, expenseCategories, appLanguage, mainMonthlyBudget);
    }
  }, [isNotifActive, profileName, transactions, expenseCategories, appLanguage, mainMonthlyBudget]);

  React.useEffect(() => {
    let active = true;
    let intervalId = null;

    // Tambahkan variabel flag untuk menandai jika user secara sadar menolak (klik Nanti)
    // agar pop-up tidak muncul berulang-ulang di sesi yang sama
    const checkUpdate = () => {
      if (window.hasDismissedUpdate === true) {
        console.log('[App] Pengecekan update dibatalkan karena user telah memilih "Nanti".');
        return;
      }

      checkForAppUpdates()
        .then(info => {
          if (active && info && !window.hasDismissedUpdate) {
            console.log('[App] Update terdeteksi:', info);
            setUpdateInfo(info);
            // Picu notifikasi tray sistem Android / Web
            sendUpdateReminderNotification(info, appLanguage);
          }
        })
        .catch(err => {
          console.error('[App] Gagal memeriksa update:', err);
        });
    };

    // 1. Cek langsung saat mount aplikasi
    setTimeout(() => {
      if (active) checkUpdate();
    }, 1500); // Beri sedikit jeda agar load UI/splash screen lancar

    // 2. Set interval untuk melakukan cek update setiap 1 jam sekali (3600000 ms)
    // Mode HP/Production murni 1 jam.
    const intervalTime = 3600000;
    console.log(`[App] Scheduler update aktif setiap 1 jam`);
    
    intervalId = setInterval(() => {
      if (active) {
        console.log('[App] Scheduler: Memulai pengecekan update otomatis berkala...');
        checkUpdate();
      }
    }, intervalTime);

    // 3. Cek saat aplikasi kembali dari background (resume)
    let appStateListener;
    import('@capacitor/app')
      .then(({ App: CapApp }) => {
        CapApp.addListener('appStateChange', ({ isActive }) => {
          if (isActive && active) {
            console.log('[App] Aplikasi di-resume, cek update...');
            checkUpdate();
          }
        }).then(listener => {
          appStateListener = listener;
        });
      })
      .catch(() => {
        // Fallback Web/PWA
        const handleVisibility = () => {
          if (document.visibilityState === 'visible' && active) {
            checkUpdate();
          }
        };
        document.addEventListener('visibilitychange', handleVisibility);
        appStateListener = { remove: () => document.removeEventListener('visibilitychange', handleVisibility) };
      });

    return () => {
      active = false;
      if (intervalId) clearInterval(intervalId);
      if (appStateListener) {
        appStateListener.remove();
      }
    };
  }, []);

  // Sync states to Secure Encrypted Storage
  React.useEffect(() => {
    safeStorageSet('user_transactions', transactions);
  }, [transactions]);

  React.useEffect(() => {
    safeStorageSet('user_expense_categories', expenseCategories);
  }, [expenseCategories]);

  React.useEffect(() => {
    safeStorageSet('user_income_categories', incomeCategories);
  }, [incomeCategories]);

  React.useEffect(() => {
    safeStorageSet('user_accounts_list', accountsList);
  }, [accountsList]);

  // Note Suggestions & Modal state
  const [isNoteSuggestionsOpen, setIsNoteSuggestionsOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const [tempName, setTempName] = useState(profileName);
  const [tempProfileImage, setTempProfileImage] = useState(profileImage);
  const [isEditingName, setIsEditingName] = useState(false);

  const handleSaveInlineName = () => {
    const finalName = tempName.trim() || 'No Name';
    setProfileName(finalName);
    setTempName(finalName);
    safeStorageSet('user_profile_name', finalName);
    setIsEditingName(false);
  };

  // Image Crop & Adjustment State (Image 2 Style)
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState(null);
  const [cropRotation, setCropRotation] = useState(0);
  const [cropOffset, setCropOffset] = useState({ x: 0, y: 0 });
  const [isDraggingCrop, setIsDraggingCrop] = useState(false);
  const [cropDragStart, setCropDragStart] = useState({ x: 0, y: 0 });

  const profileFileInputRef = useRef(null);
  const cropImgRef = useRef(null);

  const handleOpenProfileModal = () => {
    setTempName(profileName);
    setTempProfileImage(profileImage);
    setIsEditingName(false);
    setIsProfileModalOpen(true);
  };

  const handleSelectFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setCropImageSrc(reader.result);
      setCropRotation(0);
      setCropOffset({ x: 0, y: 0 });
      setIsCropModalOpen(true);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleRotateCrop = () => {
    setCropRotation((prev) => (prev + 90) % 360);
  };

  const handleSaveCrop = () => {
    if (!cropImgRef.current) return;
    const img = cropImgRef.current;
    const canvas = document.createElement('canvas');
    // Reduced from 400 to 256px — visually identical for avatar, saves ~75% storage
    const size = 256;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, size, size);

    ctx.save();
    ctx.translate(size / 2, size / 2);
    ctx.rotate((cropRotation * Math.PI) / 180);

    const displayedW = cropImgRef.current.clientWidth || 300;
    const displayedH = cropImgRef.current.clientHeight || 300;
    const gridSize = Math.min(displayedW, displayedH);

    // Natural scale ratio
    const scaleRatio = img.naturalWidth / displayedW;

    // Calculate crop origin on natural image
    const cropCenterY = (displayedH / 2) + cropOffset.y;
    const cropCenterX = (displayedW / 2) + cropOffset.x;

    const sourceSize = gridSize * scaleRatio;
    const sourceX = (cropCenterX - gridSize / 2) * scaleRatio;
    const sourceY = (cropCenterY - gridSize / 2) * scaleRatio;

    ctx.drawImage(
      img,
      Math.max(0, sourceX),
      Math.max(0, sourceY),
      Math.min(img.naturalWidth, sourceSize),
      Math.min(img.naturalHeight, sourceSize),
      -size / 2,
      -size / 2,
      size,
      size
    );
    ctx.restore();

    // quality 0.75 instead of 0.9 — avatar kecil, beda kualitas tidak terlihat
    const croppedUrl = canvas.toDataURL('image/jpeg', 0.75);
    setTempProfileImage(croppedUrl);
    setProfileImage(croppedUrl);
    localStorage.setItem('user_profile_image', croppedUrl);
    setIsCropModalOpen(false);
  };

  const handleSaveProfile = async () => {
    const finalName = tempName.trim() || 'No Name';
    const isFirstTimeSetup = !safeStorageGet('user_profile_setup_done');

    setProfileName(finalName);
    setProfileImage(tempProfileImage);
    safeStorageSet('user_profile_name', finalName);
    if (tempProfileImage) {
      safeStorageSet('user_profile_image', tempProfileImage);
    } else {
      localStorage.removeItem('user_profile_image');
    }

    // Save selected language on onboarding
    if (tempLanguage) {
      setAppLanguage(tempLanguage);
      safeStorageSet('user_app_lang', tempLanguage);
    }

    safeStorageSet('user_profile_setup_done', 'true');
    setIsProfileSetupDone(true);

    // Auto activate notifications on profile save ONLY for initial onboarding setup
    if (isFirstTimeSetup) {
      if (!isNotifActive) {
        const nextState = await toggleNotificationState(false);
        setIsNotifActive(nextState);
        if (nextState) {
          sendInstantNotification(finalName, transactions, tempLanguage || appLanguage);
        }
      } else {
        sendInstantNotification(finalName, transactions, tempLanguage || appLanguage);
      }

      // Wajibkan Panduan Aplikasi (Full Guide - 8 Langkah) otomatis bagi User Baru setelah setup profil
      setTimeout(() => {
        setTourMode('full_guide');
        setIsTourOpen(true);
      }, 350);
    }

    setIsProfileModalOpen(false);
  };

  const amountInputRef = useRef(null);
  const noteInputRef = useRef(null);
  const dropdownRef = useRef(null);
  const dateInputRef = useRef(null);
  const timeInputRef = useRef(null);

  // Close custom dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Form State
  const [transType, setTransType] = useState('Expense'); // 'Income' | 'Expense' | 'Transfer'
  const [amountVal, setAmountVal] = useState('');

  // Format amount input with Indonesian thousand separators (e.g. 15000 -> 15.000)
  const formatAmountInput = (val) => {
    if (!val) return '';
    const cleanVal = val.toString().replace(/\D/g, '');
    if (!cleanVal) return '';
    return Number(cleanVal).toLocaleString('id-ID');
  };

  const handleAmountChange = (e) => {
    const rawVal = e.target.value;
    setAmountVal(formatAmountInput(rawVal));
  };
  const [selectedCategory, setSelectedCategory] = useState(DEFAULT_EXPENSE_CATEGORIES[0]);
  const [isCustomCat, setIsCustomCat] = useState(false);
  const [customCatInput, setCustomCatInput] = useState('');
  const [account, setAccount] = useState('BRImo'); // 'BRImo' | 'BCA' | 'Cash' | etc.
  const [note, setNote] = useState('');
  const [activePanel, setActivePanel] = useState('amount'); // 'amount' | 'category' | 'account' | 'note'
  
  // Date & Time picker state
  const getTodayISO = () => {
    const d = new Date();
    return d.toISOString().split('T')[0];
  };
  const getCurrentTimeHHMM = () => {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  const [selectedDateVal, setSelectedDateVal] = useState(getTodayISO());
  const [selectedTimeVal, setSelectedTimeVal] = useState(getCurrentTimeHHMM());

  const handlePrevMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const formatMonthYear = (date) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  const isCurrentMonth = (() => {
    const now = new Date();
    return currentDate.getFullYear() === now.getFullYear() && currentDate.getMonth() === now.getMonth();
  })();

  // Open Full-Page Add Form (Plus button)
  const handleOpenAddModal = () => {
    setTransType('Expense');
    setAmountVal('');
    setSelectedCategory(expenseCategories[0]);
    setIsCustomCat(false);
    setCustomCatInput('');
    setAccount('BRImo');
    setNote('');
    setActivePanel('amount');
    setIsAddModalOpen(true);
    setTimeout(() => {
      if (amountInputRef.current) {
        amountInputRef.current.focus();
      }
    }, 100);
  };

  const handleOpenAndaiModal = () => {
    setTransType('Andai');
    setAmountVal('');
    setNote('');
    setActivePanel('amount');
    setIsAddModalOpen(true);
  };

  // Auto Advance from Amount to Category
  const handleAdvanceFromAmount = () => {
    if (amountInputRef.current) amountInputRef.current.blur();
    setActivePanel('category');
  };

  // Edge-Swipe Back Gesture & Android System Back Button Handler
  const backHandlerStateRef = useRef({});
  backHandlerStateRef.current = {
    activeBalanceDetail,
    setActiveBalanceDetail,
    selectedInsightCategory,
    setSelectedInsightCategory,
    isCropModalOpen,
    setIsCropModalOpen,
    activeBudgetCategory,
    setActiveBudgetCategory,
    isBudgetCapModalOpen,
    setIsBudgetCapModalOpen,
    isBudgetMonthPickerOpen,
    setIsBudgetMonthPickerOpen,
    isEditingMainBudget,
    setIsEditingMainBudget,
    safetyWarning,
    setSafetyWarning,
    updateInfo,
    setUpdateInfo,
    isFontModalOpen,
    setIsFontModalOpen,
    isFontSizeModalOpen,
    setIsFontSizeModalOpen,
    isLangModalOpen,
    setIsLangModalOpen,
    isCurrencyModalOpen,
    setIsCurrencyModalOpen,
    isFeedbackModalOpen,
    setIsFeedbackModalOpen,
    isBackupModalOpen,
    setIsBackupModalOpen,
    backupRestoreConfirm,
    setBackupRestoreConfirm,
    adjustingAccount,
    setAdjustingAccount,
    isPinSetupModalOpen,
    setIsPinSetupModalOpen,
    isAddModalOpen,
    setIsAddModalOpen,
    isProfileModalOpen,
    setIsProfileModalOpen,
    isEditingName,
    handleSaveInlineName,
    isAdminView,
    setIsAdminView,
    activeTab,
    setActiveTab,
    isFirstTimeUser
  };

  const lastBackPressTimeRef = useRef(0);

  const handleAppBack = () => {
    const s = backHandlerStateRef.current;

    // -1. Pop-up Balance Card Detail
    if (s.activeBalanceDetail) {
      s.setActiveBalanceDetail(null);
      return;
    }

    // 0. Layar Full-Page Category Insight
    if (s.selectedInsightCategory) {
      s.setSelectedInsightCategory(null);
      return;
    }

    // 0.1 Sub-Modals di Profile / Account
    if (s.adjustingAccount) {
      s.setAdjustingAccount(null);
      return;
    }
    if (s.isPinSetupModalOpen) {
      s.setIsPinSetupModalOpen(false);
      return;
    }
    if (s.isFeedbackModalOpen) {
      s.setIsFeedbackModalOpen(false);
      return;
    }
    if (s.isCurrencyModalOpen) {
      s.setIsCurrencyModalOpen(false);
      return;
    }
    if (s.isFontModalOpen) {
      s.setIsFontModalOpen(false);
      return;
    }
    if (s.isFontSizeModalOpen) {
      s.setIsFontSizeModalOpen(false);
      return;
    }
    if (s.isLangModalOpen) {
      s.setIsLangModalOpen(false);
      return;
    }
    if (s.backupRestoreConfirm) {
      s.setBackupRestoreConfirm(null);
      return;
    }
    if (s.isBackupModalOpen) {
      s.setIsBackupModalOpen(false);
      return;
    }

    // 1. Modal Crop / Zoom Foto
    if (s.isCropModalOpen) {
      s.setIsCropModalOpen(false);
      return;
    }

    // 2. Modal Edit Budget Kategori Satuan
    if (s.activeBudgetCategory) {
      s.setActiveBudgetCategory(null);
      return;
    }

    // 2b. Modal Month/Year Picker Budget
    if (s.isBudgetMonthPickerOpen) {
      s.setIsBudgetMonthPickerOpen(false);
      return;
    }

    // 2c. Mode Edit Budget Utama
    if (s.isEditingMainBudget) {
      s.setIsEditingMainBudget(false);
      return;
    }

    // 3. Layar Penuh Budget Cap
    if (s.isBudgetCapModalOpen) {
      s.setIsBudgetCapModalOpen(false);
      return;
    }

    // 4. Modal Peringatan Keamanan Transaksi
    if (s.safetyWarning && s.safetyWarning.isOpen) {
      s.setSafetyWarning({ isOpen: false, categoryLabel: '', reason: '' });
      return;
    }

    // 5. Modal In-App Update
    if (s.updateInfo) {
      s.setUpdateInfo(null);
      return;
    }

    // 6. Form Layar Tambah Transaksi (Add Modal)
    if (s.isAddModalOpen) {
      s.setIsAddModalOpen(false);
      return;
    }

    // 7. Layar Pengaturan Profil (Hanya jika bukan setup awal)
    if (s.isProfileModalOpen) {
      if (!s.isFirstTimeUser) {
        if (s.isEditingName) s.handleSaveInlineName();
        s.setIsProfileModalOpen(false);
        return;
      }
    }

    // 8. Layar Admin Dashboard
    if (s.isAdminView) {
      s.setIsAdminView(false);
      window.history.pushState({}, '', window.location.pathname.replace(/\/admin/, '') || '/');
      return;
    }

    // 9. Tab Stats / Non-Home Tab -> Kembali ke Home Tab
    if (s.activeTab !== 'home') {
      s.setActiveTab('home');
      return;
    }

    // 10. Jika sudah di Tab Home & tidak ada modal terbuka -> Double-press to Exit
    const now = Date.now();
    if (now - lastBackPressTimeRef.current < 2000) {
      import('@capacitor/app').then(({ App: CapApp }) => {
        CapApp.exitApp();
      }).catch(() => {});
    } else {
      lastBackPressTimeRef.current = now;
      showVoiceToast('Tekan kembali sekali lagi untuk keluar');
    }
  };

  React.useEffect(() => {
    let backListener = null;

    import('@capacitor/app')
      .then(({ App: CapApp }) => {
        CapApp.addListener('backButton', () => {
          handleAppBack();
        }).then(listener => {
          backListener = listener;
        });
      })
      .catch((err) => {
        console.warn('Capacitor App backButton listener not available in this environment:', err);
      });

    return () => {
      if (backListener) {
        backListener.remove();
      }
    };
  }, []);

  // Listen for Home Screen Widget actions (Deep Link / Intent trigger)
  React.useEffect(() => {
    const handleWidgetAction = (event) => {
      const action = event.detail?.action;
      if (!action) return;

      if (action === 'OPEN_BUDGET') {
        setIsAddModalOpen(false);
        setIsProfileModalOpen(false);
        setActiveTab('budget');
      } else if (action === 'OPEN_STATS') {
        setIsAddModalOpen(false);
        setIsProfileModalOpen(false);
        setActiveTab('stats');
      } else if (action === 'OPEN_ADD_MODAL') {
        setIsProfileModalOpen(false);
        setIsAddModalOpen(true);
        setActivePanel('amount');
      } else if (action === 'OPEN_VOICE') {
        setIsAddModalOpen(false);
        setIsProfileModalOpen(false);
        setActiveTab('home');
        setTimeout(() => {
          const micBtn = document.querySelector('.tour-target-voice-btn, .voice-mic-fab');
          if (micBtn) micBtn.click();
        }, 300);
      }
    };

    window.addEventListener('app_widget_action', handleWidgetAction);
    return () => window.removeEventListener('app_widget_action', handleWidgetAction);
  }, []);

  // Auto-sync financial snapshot to Android Native AppWidget (2x2 & 4x2)
  React.useEffect(() => {
    syncWidgetData({
      transactions,
      categories: expenseCategories,
      currency: appCurrency
    });
  }, [transactions, expenseCategories, appCurrency]);

  // Add Custom Category to Dropdown List
  const handleAddCustomCategory = () => {
    const trimmed = customCatInput.trim();
    if (!trimmed) return;

    const currentList = transType === 'Expense' ? expenseCategories : incomeCategories;
    const setList = transType === 'Expense' ? setExpenseCategories : setIncomeCategories;

    const existing = currentList.find(c => c.name.toLowerCase() === trimmed.toLowerCase());
    if (existing) {
      setCustomCatInput('');
      setIsCustomCat(false);
      return;
    }

    const newCat = {
      id: `custom-${Date.now()}`,
      name: trimmed,
      icon: null, // Text only
      iconClass: ''
    };

    setList(prev => [...prev, newCat]);
    setSelectedCategory(newCat);
    setCustomCatInput('');
    setIsCustomCat(false);
  };

  // Add Custom Account to Account List
  const handleAddCustomAccount = () => {
    const trimmed = customAccountInput.trim();
    if (!trimmed) return;

    const existing = accountsList.find(a => a.toLowerCase() === trimmed.toLowerCase());
    if (existing) {
      setAccount(existing);
      setCustomAccountInput('');
      setIsCustomAccount(false);
      return;
    }

    setAccountsList(prev => [...prev, trimmed]);
    setAccount(trimmed);
    setCustomAccountInput('');
    setIsCustomAccount(false);
  };

  // Handle Delete Account (Removes from list & stores in persistent blacklist)
  const handleDeleteAccount = (accToDelete, e) => {
    if (e) e.stopPropagation();
    playPopSound('bubble_pop_2.wav');

    setAccountsList(prev => prev.filter(a => a !== accToDelete));
    setDeletedAccountsList(prev => {
      const updated = [...prev.filter(a => a !== accToDelete), accToDelete];
      try {
        safeStorageSet('user_deleted_accounts', updated);
      } catch {}
      return updated;
    });
    setDeletedAccountsHistory(prev => [...prev, accToDelete]);

    if (account === accToDelete) {
      const remaining = accountsList.filter(a => a !== accToDelete);
      setAccount(remaining.length > 0 ? remaining[0] : 'Cash');
    }
  };

  // Handle Undo Delete Account (Restores last deleted account)
  const handleUndoDeleteAccount = () => {
    if (deletedAccountsHistory.length === 0) return;

    const restoredAcc = deletedAccountsHistory[deletedAccountsHistory.length - 1];
    setDeletedAccountsHistory(prev => prev.slice(0, prev.length - 1));
    setDeletedAccountsList(prev => {
      const updated = prev.filter(a => a !== restoredAcc);
      try {
        safeStorageSet('user_deleted_accounts', updated);
      } catch {}
      return updated;
    });
    setAccountsList(prev => {
      if (!prev.includes(restoredAcc)) {
        return [...prev, restoredAcc];
      }
      return prev;
    });
  };

  // Handle Penyesuaian Akun Generik Lama (misal: 'Bank' / 'E-Wallet' -> Bank Pilihan User seperti 'BRImo', 'BCA', dll)
  const handleMigrateLegacyAccount = (oldAccName, newAccName) => {
    if (!oldAccName || !newAccName || oldAccName.toLowerCase().trim() === newAccName.toLowerCase().trim()) {
      setAdjustingAccount(null);
      return;
    }

    const oldNorm = oldAccName.toLowerCase().trim();

    // 1. Update semua transaksi yang menggunakan akun lama
    setTransactions(prevTxs => {
      if (!Array.isArray(prevTxs)) return prevTxs;
      const updated = prevTxs.map(tx => {
        const txAcc = (tx.account || 'Cash').toLowerCase().trim();
        if (txAcc === oldNorm) {
          return { ...tx, account: newAccName };
        }
        return tx;
      });
      try {
        safeStorageSet('user_transactions', updated);
      } catch {}
      return updated;
    });

    // 2. Perbarui accountsList: ganti oldAccName dengan newAccName atau gabungkan jika sudah ada
    setAccountsList(prev => {
      const filtered = prev.filter(a => (a || '').toLowerCase().trim() !== oldNorm);
      if (!filtered.some(a => (a || '').toLowerCase().trim() === newAccName.toLowerCase().trim())) {
        filtered.push(newAccName);
      }
      try {
        safeStorageSet('user_accounts_list', filtered);
      } catch {}
      return filtered;
    });

    // 3. Masukkan oldAccName ke blacklist deleted agar tidak muncul kembali
    setDeletedAccountsList(prev => {
      const updated = [...prev.filter(a => (a || '').toLowerCase().trim() !== oldNorm), oldAccName];
      try {
        safeStorageSet('user_deleted_accounts', updated);
      } catch {}
      return updated;
    });

    // 4. Jika akun aktif saat ini di form adalah akun lama, ubah ke akun baru
    if (account && account.toLowerCase().trim() === oldNorm) {
      setAccount(newAccName);
    }

    // 5. Tutup modal & tampilkan toast sukses
    setAdjustingAccount(null);
    playPopSound('bubble_pop_2.wav');
    const msg = (t('adjustAccountSuccess') || 'Akun berhasil disesuaikan ke {name}!').replace('{name}', newAccName);
    showVoiceToast(msg);
  };

  // Handle Category Select (Auto advance to Account)
  const handleSelectCategory = (cat) => {
    handleDismissLastBadge();
    setIsCustomCat(false);
    setSelectedCategory(cat);
    setActivePanel('account');
  };

  // Handle Account Select (Auto advance to Note & focus text keyboard)
  const handleSelectAccount = (acc) => {
    handleDismissLastBadge();
    setAccount(acc);
    setActivePanel('note');
    setTimeout(() => {
      if (noteInputRef.current) {
        noteInputRef.current.focus();
      }
    }, 80);
  };

  const getFilteredBudgetCategories = () => {
    const searchKeywords = {
      food: ['makan', 'makanan', 'kuliner', 'restoran', 'cafe', 'sarapan', 'malam', 'siang', 'jajan'],
      bioskop: ['film', 'nonton', 'cinema', 'xxi', 'cgv', 'movie', 'hiburan', '3d'],
      transport: ['transportasi', 'bensin', 'ojek', 'grab', 'gojek', 'angkot', 'bus', 'travel', 'mobil', 'motor'],
      barber: ['potong rambut', 'cukur', 'barbershop', 'rambut', 'salon'],
      skincare: ['perawatan', 'makeup', 'kosmetik', 'skincare', 'wajah'],
      edukasi: ['sekolah', 'kursus', 'buku', 'kuliah', 'pendidikan', 'belajar'],
      galon: ['air', 'minum', 'aqua', 'galon', 'dispenser'],
      fashion: ['baju', 'pakaian', 'celana', 'sepatu', 'baju baru', 'outfit'],
      supermarket: ['belanja', 'groceries', 'pasar', 'indomaret', 'alfamart', 'toko'],
      sub: ['langganan', 'netflix', 'spotify', 'youtube', 'patreon', 'subscription'],
      pesawat: ['tiket', 'penerbangan', 'mudik', 'liburan', 'travel', 'bandara'],
      kost: ['kontrakan', 'sewa', 'kamar', 'tempat tinggal'],
      coffee: ['kopi', 'kafe', 'espresso', 'latte', 'bobba', 'nongkrong', 'coffe'],
      gofood: ['grabfood', 'shopeefood', 'pesan makan', 'delivery', 'food delivery'],
      sepatu: ['alas kaki', 'sneakers', 'sandal', 'sepatu'],
      donasi: ['zakat', 'infaq', 'sedekah', 'amal', 'bantuan', 'donasi'],
      topupGame: ['game', 'diamond', 'voucher', 'mobile legends', 'pubg', 'steam', 'topup'],
      bensin: ['bbm', 'pertalite', 'pertamax', 'shell', 'bensin', 'spbu'],
      konser: ['musik', 'tiket konser', 'event', 'festival'],
      pulsa: ['paket data', 'kuota', 'telkomsel', 'xl', 'indosat', 'pulsa', 'hp'],
      rumahSakit: ['dokter', 'kesehatan', 'medis', 'rumah sakit'],
      obatSakit: ['farmasi', 'apotek', 'obat'],
      jajanAdek: ['uang jajan', 'keluarga', 'anak', 'adek'],
      party: ['pesta', 'nongkrong', 'klub', 'party'],
      buah: ['buah', 'nanas', 'apel', 'jeruk', 'pisang', 'mangga', 'semangka', 'alpukat', 'durian', 'melon', 'anggur', 'pepaya', 'toko buah', 'buah buahan'],
      minuman: ['minuman', 'es buah', 'es campur', 'es teler', 'coca cola', 'sprite', 'fanta', 'jus', 'susu', 'teh', 'boba', 'cendol', 'dawet', 'minuman segar', 'minuman dingin']
    };

    const q = (budgetSearchQuery || '').toLowerCase().trim();
    const currentMonthData = monthlyBudgetsMap[activeMonthKey] || { main: null, categories: {} };
    const monthCatLimits = currentMonthData.categories || {};

    let list = (expenseCategories || []).map(cat => ({
      ...cat,
      monthlyLimit: typeof monthCatLimits[cat.id] === 'number' && monthCatLimits[cat.id] > 0 
        ? monthCatLimits[cat.id] 
        : undefined
    }));

    // Hitung frekuensi penggunaan kategori pengeluaran dalam transaksi user
    const catFreqMap = {};
    (transactions || []).forEach(t => {
      if (t.type === 'expense' && t.category) {
        catFreqMap[t.category] = (catFreqMap[t.category] || 0) + 1;
      }
    });

    if (q) {
      list = list
        .map(cat => {
          const nameLower = (cat.name || '').toLowerCase();
          const idLower = (cat.id || '').toLowerCase();
          const keywords = (searchKeywords[cat.id] || []).map(k => k.toLowerCase());

          let score = 0;
          if (nameLower === q) score = 100;
          else if (nameLower.startsWith(q)) score = 80;
          else if (nameLower.includes(q)) score = 60;
          else if (idLower === q) score = 50;
          else if (idLower.includes(q)) score = 40;
          else if (keywords.some(kw => kw === q)) score = 30;
          else if (keywords.some(kw => kw.includes(q))) score = 20;

          return { cat, score };
        })
        .filter(item => item.score > 0)
        .sort((a, b) => b.score - a.score)
        .map(item => item.cat);
    } else {
      // Dynamic Smart Ranking:
      // 1. Kategori yang sering dipakai transaksi TAPI belum diatur budget-nya (paling atas, urut freq)
      // 2. Kategori yang sudah ada transaksi dan sudah diatur budget-nya (urut freq)
      // 3. Kategori yang belum pernah dipakai transaksi
      list.sort((a, b) => {
        const countA = catFreqMap[a.name] || 0;
        const countB = catFreqMap[b.name] || 0;
        const isUnsetA = !a.monthlyLimit || a.monthlyLimit <= 0;
        const isUnsetB = !b.monthlyLimit || b.monthlyLimit <= 0;

        // Grup 1: Belum diatur & pernah ada transaksi
        const isGroup1A = isUnsetA && countA > 0;
        const isGroup1B = isUnsetB && countB > 0;

        if (isGroup1A && !isGroup1B) return -1;
        if (!isGroup1A && isGroup1B) return 1;
        if (isGroup1A && isGroup1B) {
          if (countB !== countA) return countB - countA;
          return (a.name || '').localeCompare(b.name || '');
        }

        // Grup 2: Sudah diatur & pernah ada transaksi
        const isGroup2A = !isUnsetA && countA > 0;
        const isGroup2B = !isUnsetB && countB > 0;

        if (isGroup2A && !isGroup2B) return -1;
        if (!isGroup2A && isGroup2B) return 1;
        if (isGroup2A && isGroup2B) {
          if (countB !== countA) return countB - countA;
          return (a.name || '').localeCompare(b.name || '');
        }

        // Grup 3: Kategori yang belum pernah ada transaksi sama sekali
        if (isUnsetA && !isUnsetB) return -1;
        if (!isUnsetA && isUnsetB) return 1;
        return (a.name || '').localeCompare(b.name || '');
      });
    }

    if (budgetFilterTab === 'active') {
      return list.filter(c => typeof c.monthlyLimit === 'number' && c.monthlyLimit > 0);
    }
    if (budgetFilterTab === 'unset') {
      return list.filter(c => !c.monthlyLimit || c.monthlyLimit <= 0);
    }
    return list;
  };

  const handleOpenCategoryBudgetModal = (cat) => {
    setActiveBudgetCategory(cat);
    const monthCatLimits = (monthlyBudgetsMap[activeMonthKey]?.categories) || {};
    const currentLimit = typeof monthCatLimits[cat.id] === 'number' && monthCatLimits[cat.id] > 0 
      ? monthCatLimits[cat.id] 
      : (typeof cat.monthlyLimit === 'number' && cat.monthlyLimit > 0 ? cat.monthlyLimit : 0);
    setBudgetModalInputValue(currentLimit > 0 ? new Intl.NumberFormat('id-ID').format(currentLimit) : '');
  };

  const handleSaveCategoryBudget = () => {
    if (!activeBudgetCategory) return;
    const raw = budgetModalInputValue.replace(/\./g, '').replace(/[^0-9]/g, '');
    const numVal = parseInt(raw, 10) || 0;

    setMonthlyBudgetsMap(prev => {
      const monthData = prev[activeMonthKey] || { main: null, categories: {} };
      const newCatLimits = { ...(monthData.categories || {}) };
      if (numVal > 0) {
        newCatLimits[activeBudgetCategory.id] = numVal;
      } else {
        delete newCatLimits[activeBudgetCategory.id];
      }
      const updated = {
        ...prev,
        [activeMonthKey]: {
          ...monthData,
          categories: newCatLimits
        }
      };
      safeStorageSet('user_monthly_budgets_map', JSON.stringify(updated));
      return updated;
    });

    setActiveBudgetCategory(null);
    setBudgetModalInputValue('');
  };

  const handleRemoveCategoryBudget = () => {
    if (!activeBudgetCategory) return;
    setMonthlyBudgetsMap(prev => {
      const monthData = prev[activeMonthKey] || { main: null, categories: {} };
      const newCatLimits = { ...(monthData.categories || {}) };
      delete newCatLimits[activeBudgetCategory.id];
      const updated = {
        ...prev,
        [activeMonthKey]: {
          ...monthData,
          categories: newCatLimits
        }
      };
      safeStorageSet('user_monthly_budgets_map', JSON.stringify(updated));
      return updated;
    });
    setActiveBudgetCategory(null);
    setBudgetModalInputValue('');
  };

  const handleStartEditMainBudget = () => {
    setMainBudgetInputValue(mainMonthlyBudget ? new Intl.NumberFormat('id-ID').format(mainMonthlyBudget) : '');
    setIsEditingMainBudget(true);
    setTimeout(() => {
      if (mainBudgetInputRef.current) {
        mainBudgetInputRef.current.focus();
      }
    }, 50);
  };

  const handleSaveMainBudget = () => {
    const raw = mainBudgetInputValue.replace(/\./g, '').replace(/[^0-9]/g, '');
    const numVal = parseInt(raw, 10) || 0;

    setMonthlyBudgetsMap(prev => {
      const monthData = prev[activeMonthKey] || { main: null, categories: {} };
      const updated = {
        ...prev,
        [activeMonthKey]: {
          ...monthData,
          main: numVal > 0 ? numVal : null
        }
      };
      safeStorageSet('user_monthly_budgets_map', JSON.stringify(updated));
      return updated;
    });

    if (numVal > 0) {
      showVoiceToast(`${t('mainBudget')} ${fmtMoney(numVal)} berhasil disimpan`);
    } else {
      showVoiceToast('Budget utama dihapus');
    }
    setIsEditingMainBudget(false);
    setMainBudgetInputValue('');
  };

  const handleRemoveMainBudget = () => {
    setMonthlyBudgetsMap(prev => {
      const monthData = prev[activeMonthKey] || { main: null, categories: {} };
      const updated = {
        ...prev,
        [activeMonthKey]: {
          ...monthData,
          main: null
        }
      };
      safeStorageSet('user_monthly_budgets_map', JSON.stringify(updated));
      return updated;
    });
    setIsEditingMainBudget(false);
    setMainBudgetInputValue('');
    showVoiceToast('Budget utama berhasil dihapus');
  };

  const checkAndTriggerBudgetNotifications = (newTx, allTx, categories) => {
    if (newTx.type !== 'expense') return;
    
    const txDate = new Date(newTx.date || Date.now());
    const monthStr = `${txDate.getFullYear()}-${String(txDate.getMonth() + 1).padStart(2, '0')}`;
    const storageKey = 'user_budget_notif_state';
    let notifState = safeStorageGet(storageKey, {});
    let hasStateChanged = false;
    const thresholds = [40, 50, 60, 70, 80, 90, 100];

    const currentMonthExpenses = [newTx, ...allTx].filter(t => {
      if (t.type !== 'expense') return false;
      return (t.date || '').startsWith(monthStr);
    });

    // 1. Check Notifikasi Budget Utama (Main Monthly Budget)
    const monthData = monthlyBudgetsMap[monthStr] || { main: null, categories: {} };
    const mainLimit = monthData.main && monthData.main > 0 ? monthData.main : null;

    if (mainLimit && mainLimit > 0) {
      const totalMonthSpent = currentMonthExpenses.reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);
      const mainPercentage = (totalMonthSpent / mainLimit) * 100;
      const passedMainThresholds = thresholds.filter(th => mainPercentage >= th);

      if (passedMainThresholds.length > 0) {
        const mainKey = `main_${monthStr}`;
        const notifiedMain = notifState[mainKey] || [];
        const newMainThresholds = passedMainThresholds.filter(th => !notifiedMain.includes(th));

        if (newMainThresholds.length > 0) {
          notifState[mainKey] = [...notifiedMain, ...newMainThresholds];
          hasStateChanged = true;
          const highestMainTh = Math.max(...newMainThresholds);
          const { title, body } = buildMainBudgetNotifText(highestMainTh, mainLimit, totalMonthSpent, appLanguage);

          setTimeout(() => {
            sendInstantBudgetNotification(title, body);
          }, 3000);
        }
      }
    }

    // 2. Check Notifikasi Budget Kategori (Category Budget)
    if (newTx.categoryId) {
      const monthCatLimits = monthData.categories || {};
      let limit = monthCatLimits[newTx.categoryId];

      if (!limit || limit <= 0) {
        const cat = categories.find(c => c.id === newTx.categoryId);
        if (cat && cat.monthlyLimit && cat.monthlyLimit > 0) {
          limit = parseFloat(cat.monthlyLimit);
        }
      }

      if (limit && limit > 0) {
        const catExpenses = currentMonthExpenses.filter(t => 
          t.categoryId === newTx.categoryId || t.category === newTx.category
        );
        const totalCatSpent = catExpenses.reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);
        const catPercentage = (totalCatSpent / limit) * 100;
        const passedCatThresholds = thresholds.filter(th => catPercentage >= th);

        if (passedCatThresholds.length > 0) {
          const catKey = `${newTx.categoryId}_${monthStr}`;
          const notifiedCat = notifState[catKey] || [];
          const newCatThresholds = passedCatThresholds.filter(th => !notifiedCat.includes(th));

          if (newCatThresholds.length > 0) {
            notifState[catKey] = [...notifiedCat, ...newCatThresholds];
            hasStateChanged = true;
            const highestCatTh = Math.max(...newCatThresholds);
            const catObj = categories.find(c => c.id === newTx.categoryId) || { name: newTx.category || 'Kategori' };
            const { title, body } = buildBudgetNotifText(getCategoryName(catObj.name, appLanguage), highestCatTh, limit, appLanguage);

            // Jeda 4.5 detik jika ada notifikasi main budget agar berurutan santun
            setTimeout(() => {
              sendInstantBudgetNotification(title, body);
            }, 4500);
          }
        }
      }
    }

    if (hasStateChanged) {
      safeStorageSet(storageKey, notifState);
    }
  };

  // Save / Delete Voice Transaction
  const handleSaveVoiceTransaction = (result) => {
    if (!result) return;

    // Multi-Action Voice Command Execution (misal: "hapus bakwan tambahkan bakmie 13 ribu")
    if (result.isMultiple && Array.isArray(result.commands)) {
      result.commands.forEach((cmd, idx) => {
        setTimeout(() => {
          handleSaveVoiceTransaction(cmd);
        }, idx * 650);
      });
      return;
    }

    // A. Perintah Hapus Suara (Voice-Command Delete)
    if (result.action === 'DELETE') {
      if (transactions.length === 0) {
        showVoiceToast('Belum ada transaksi untuk dihapus');
        return;
      }

      let targetTx = null;

      // Robust Multi-Stage Voice Deletion Matcher
      const cleanStr = (s) => (s || '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
      const q = cleanStr(result.targetQuery);
      const qTokens = q.split(' ').filter(Boolean);

      if (result.isLast) {
        targetTx = transactions[0];
      } else if (q || result.targetAmount) {
        // Scored Relevance Matcher (Cerdas mendeteksi kecocokan sebagian kata seperti "bakwan pink" pada "Apa maksudku bakwan pink")
        let bestCandidate = null;
        let highestScore = 0;

        for (const t of transactions) {
          let score = 0;
          const ct = cleanStr(t.title);
          const cc = cleanStr(t.category);
          const cid = cleanStr(t.categoryId);

          // 1. Cocok Nominal
          const amountMatched = result.targetAmount && t.amount === result.targetAmount;
          if (amountMatched) {
            score += 500;
          }

          if (q) {
            // 2a. Judul Persis Sama
            if (ct === q) {
              score += 1000;
            }
            // 2b. Substring Match (misal user sebut "bakwan pink", cocok pada "Apa maksudku bakwan pink")
            else if (ct.includes(q)) {
              score += 600;
            }
            // 2c. Reverse Substring Match (misal user sebut "nasi goreng spesial", judul "nasi goreng")
            else if (q.includes(ct) && ct.length >= 3) {
              score += 450;
            }
            // 2d. Semua token kata pencarian ada di dalam judul
            else if (qTokens.length > 1 && qTokens.every(tok => ct.includes(tok))) {
              score += 550;
            }
            // 2e. Sebagian token kata pencarian cocok
            else {
              let matchedTokenCount = 0;
              for (const tok of qTokens) {
                if (tok.length >= 3 && ct.includes(tok)) {
                  matchedTokenCount++;
                }
              }
              if (matchedTokenCount > 0) {
                score += (matchedTokenCount / qTokens.length) * 300;
              }
            }

            // 2f. Kategori Cocok
            if (cc.includes(q) || cid.includes(q)) {
              score += 150;
            }
          }

          if (!q && amountMatched) {
            score += 500;
          }

          if (score > highestScore) {
            highestScore = score;
            bestCandidate = t;
          }
        }

        if (highestScore > 0) {
          targetTx = bestCandidate;
        }
      }

      if (!targetTx) {
        const desc = result.targetQuery && result.targetAmount
          ? `"${result.targetQuery}" Rp ${result.targetAmount.toLocaleString('id-ID')}`
          : result.targetAmount
            ? `Rp ${result.targetAmount.toLocaleString('id-ID')}`
            : `"${result.targetQuery || 'terakhir'}"`;
        showVoiceToast(`Transaksi ${desc} tidak ditemukan`);
        return;
      }

      // Catat pembelajaran & evaluasi penghapusan untuk Dashboard Admin
      recordDeletionEvaluation(targetTx, result.targetQuery, result.targetAmount, profileName);

      // Animasi 3D Sink Backwards (Tenggelam ke Belakang)
      setDeletingTxId(targetTx.id);
      playPopSound();
      showVoiceToast(`🗑️ Menghapus "${targetTx.title}"...`);

      setTimeout(() => {
        setTransactions(prev => prev.filter(t => t.id !== targetTx.id));
        setDeletingTxId(null);
        showVoiceToast(`✅ Transaksi "${targetTx.title}" berhasil dihapus`);
      }, 450);

      return;
    }

    // B. Simpan Transaksi Baru
    const catName = result.category.name;
    const catIconClass = result.category.iconClass || 'food-icon';
    const finalTitle = result.note.trim() || catName;

    // Safety Guard Check: Blokir jika terdapat kata terlarang (rokok, miras, asusila, narkoba, judi)
    const safetyCheck = checkProhibitedContent(`${finalTitle} ${result.rawText || ''}`);
    if (safetyCheck.isProhibited) {
      setSafetyWarning({
        isOpen: true,
        categoryLabel: safetyCheck.categoryLabel,
        reason: safetyCheck.reason
      });
      return;
    }

    const numericAmount = parseFloat(result.amount) || 0;
    if (numericAmount <= 0) return;

    const newTxId = Date.now() + Math.floor(Math.random() * 1000);
    const newTx = {
      id: newTxId,
      title: finalTitle,
      category: catName,
      categoryId: result.category.id || null,
      account: result.account,
      amount: numericAmount,
      type: result.type.toLowerCase(),
      iconClass: catIconClass,
      date: getTodayISO(),
      inputMethod: 'voice'
    };

    if (result.type === 'Expense') {
      const isConsumptive = isConsumptiveHybrid(newTx, transactions);
      if (!isConsumptive) {
        playPositiveChime();
      }
      checkAndTriggerBudgetNotifications(newTx, transactions, expenseCategories);
    }

    // Aktifkan efek animasi ketik & timbul dari belakang
    setVoiceAnimatingTxIds(prev => new Set(prev).add(newTxId));
    setTransactions(prev => [newTx, ...prev]);
    showVoiceToast(`✅ "${finalTitle}" Rp ${numericAmount.toLocaleString('id-ID')} tersimpan`);
  };

  // Save Transaction
  const handleSaveTransaction = () => {
    const catName = selectedCategory.name;
    const catIconClass = selectedCategory.iconClass || 'food-icon';

    const finalTitle = note.trim() || catName;

    // Safety Guard Check: Blokir jika terdapat kata terlarang (rokok, miras, asusila, narkoba, judi)
    const safetyCheck = checkProhibitedContent(finalTitle);
    if (safetyCheck.isProhibited) {
      setSafetyWarning({
        isOpen: true,
        categoryLabel: safetyCheck.categoryLabel,
        reason: safetyCheck.reason
      });
      return;
    }

    const numericAmount = parseFloat(amountVal.replace(/\./g, '')) || 0;
    if (numericAmount <= 0) {
      alert('Masukkan nominal transaksi');
      return;
    }



    const newTx = {
      id: Date.now(),
      title: finalTitle,
      category: catName,
      // Store only the category id for icon lookup — NOT the raw SVG blob
      categoryId: selectedCategory.id || null,
      account: account,
      amount: numericAmount,
      type: transType.toLowerCase(),
      iconClass: catIconClass,
      date: selectedDateVal || getTodayISO(),
      inputMethod: 'manual'
    };

    if (transType === 'Expense') {
      const isConsumptive = isConsumptiveHybrid(newTx, transactions);
      if (!isConsumptive) {
        playPositiveChime();
      }
      checkAndTriggerBudgetNotifications(newTx, transactions, expenseCategories);
    }

    setTransactions(prev => [newTx, ...prev]);
    setAmountVal('');
    setNote('');
    setActivePanel('amount');
    setIsAddModalOpen(false);
    setIsNoteSuggestionsOpen(false);
  };

  // Compute Balances
  const totalExpenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalBalance = totalIncome - totalExpenses;

  // Monthly Expenses for current navigated month
  const currentMonthExpenses = useMemo(() => {
    const targetYear = currentDate.getFullYear();
    const targetMonth = currentDate.getMonth();
    return transactions
      .filter(t => {
        if (t.type !== 'expense' || !t.date) return false;
        const [y, m] = t.date.split('-');
        return Number(y) === targetYear && Number(m) - 1 === targetMonth;
      })
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  }, [transactions, currentDate]);

  // Filter transactions according to period (monthly/weekly/yearly)
  const filteredTransactions = transactions.filter(t => {
    if (!t.date) return true;
    const [y, m] = t.date.split('-');
    const tYear = Number(y);
    const tMonth = Number(m) - 1;

    if (periodFilter === 'yearly') {
      return tYear === currentDate.getFullYear();
    }
    if (periodFilter === 'weekly') {
      return tYear === currentDate.getFullYear() && tMonth === currentDate.getMonth();
    }
    // Default 'monthly': match selected month and year
    return tYear === currentDate.getFullYear() && tMonth === currentDate.getMonth();
  });

  // Calculate Category Totals & Percentages for Stats
  const selectedTypeTxs = filteredTransactions.filter(t => t.type === statsType);
  const totalStatsAmount = selectedTypeTxs.reduce((sum, t) => sum + t.amount, 0);

  const categoryMap = {};
  selectedTypeTxs.forEach(t => {
    if (!categoryMap[t.category]) {
      categoryMap[t.category] = {
        name: t.category,
        amount: 0,
        count: 0,
        // Resolve icon at runtime from categoryId, not from stored blob
        categoryId: t.categoryId || null,
      };
    }
    categoryMap[t.category].amount += t.amount;
    categoryMap[t.category].count += 1;
  });

  const CHART_COLORS = [
    '#FF7676', '#FFB547', '#FFDC60', '#4EBE96', '#59A6FF', 
    '#A076FF', '#FF76C7', '#76D5FF', '#D883FF', '#81C784'
  ];

  const statsCategories = Object.values(categoryMap)
    .map((cat, idx) => ({
      ...cat,
      percentage: totalStatsAmount > 0 ? (cat.amount / totalStatsAmount) * 100 : 0,
      color: CHART_COLORS[idx % CHART_COLORS.length]
    }))
    .sort((a, b) => b.amount - a.amount);

  // Generate SVG Pie Slices with collision-free label positioning
  let cumulativeAngle = -Math.PI / 2;
  const radius = 56;
  const chartHeight = 260;
  const centerY = chartHeight / 2;

  // First pass: compute basic slice geometry
  const initialSlices = statsCategories.map(cat => {
    const fraction = totalStatsAmount > 0 ? cat.amount / totalStatsAmount : 0;
    const sliceAngle = fraction * 2 * Math.PI;

    const startAngle = cumulativeAngle;
    const endAngle = cumulativeAngle + sliceAngle;
    const middleAngle = startAngle + sliceAngle / 2;

    const x1 = radius * Math.cos(startAngle);
    const y1 = radius * Math.sin(startAngle);
    const x2 = radius * Math.cos(endAngle);
    const y2 = radius * Math.sin(endAngle);

    const largeArcFlag = sliceAngle > Math.PI ? 1 : 0;

    let pathData = '';
    if (statsCategories.length === 1 || fraction >= 0.999) {
      pathData = `M 0 0 M ${-radius} 0 A ${radius} ${radius} 0 1 1 ${radius} 0 A ${radius} ${radius} 0 1 1 ${-radius} 0`;
    } else {
      pathData = `M 0 0 L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;
    }

    cumulativeAngle = endAngle;

    const normAngle = (middleAngle + Math.PI * 4) % (Math.PI * 2);
    const isRight = normAngle < Math.PI / 2 || normAngle > (3 * Math.PI) / 2;

    const idealY = (radius + 32) * Math.sin(middleAngle);

    return {
      ...cat,
      percentage: fraction === 1 ? '100' : (fraction * 100).toFixed(1),
      pathData,
      middleAngle,
      isRight,
      idealY,
      fraction
    };
  });

  // Second pass: Separate into left and right groups and push y positions to prevent overlap
  const adjustYPositions = (group) => {
    group.sort((a, b) => a.idealY - b.idealY);
    const minYSpacing = 24;
    for (let i = 1; i < group.length; i++) {
      if (group[i].idealY - group[i - 1].idealY < minYSpacing) {
        group[i].idealY = group[i - 1].idealY + minYSpacing;
      }
    }
  };

  const rightGroup = initialSlices.filter(s => s.isRight);
  const leftGroup = initialSlices.filter(s => !s.isRight);

  adjustYPositions(rightGroup);
  adjustYPositions(leftGroup);

  const pieSlices = initialSlices.map(slice => {
    const isRight = slice.isRight;
    const targetY = slice.idealY;
    
    const clampedY = Math.max(-centerY + 18, Math.min(centerY - 18, targetY));

    // pInner sits slightly INSIDE the pie slice radius (underneath pie layer)
    const pInner = {
      x: (radius - 4) * Math.cos(slice.middleAngle),
      y: (radius - 4) * Math.sin(slice.middleAngle)
    };

    // Extension elbow line extending outward smoothly
    const xBreak = isRight ? radius + 28 : -(radius + 28);
    const pOuter = {
      x: xBreak,
      y: clampedY
    };
    // pLabel extends directly to touch the text anchor
    const pLabel = {
      x: isRight ? xBreak + 20 : xBreak - 20,
      y: clampedY
    };

    return {
      ...slice,
      pInner,
      pOuter,
      pLabel
    };
  });
  // Generate 12-month data for Stats Bar Chart (January - December)
  const currentYear = currentDate.getFullYear();
  const monthNamesShort = MONTH_SHORT_I18N[appLanguage] || MONTH_SHORT_I18N.id;
  const monthNamesFull = MONTH_NAMES_I18N[appLanguage] || MONTH_NAMES_I18N.id;

  const monthlyBarChartData = Array.from({ length: 12 }, (_, monthIdx) => {
    let earned = 0;
    let spend = 0;

    transactions.forEach(t => {
      if (!t.date) return;
      const [y, m] = t.date.split('-');
      if (Number(y) === currentYear && Number(m) - 1 === monthIdx) {
        if (t.type === 'income') {
          earned += t.amount;
        } else if (t.type === 'expense') {
          spend += t.amount;
        }
      }
    });

    return {
      monthIdx,
      shortName: monthNamesShort[monthIdx] || `${monthIdx + 1}`,
      fullName: monthNamesFull[monthIdx] || `${monthIdx + 1}`,
      earned,
      spend,
      isCurrentMonth: currentDate.getMonth() === monthIdx
    };
  });

  // Helper to compute a clean, human-friendly max ceiling (e.g. 500k, 1M, 1.2M, etc.)
  const rawMaxMonthly = Math.max(
    ...monthlyBarChartData.map(d => Math.max(d.earned, d.spend)),
    100000 // Minimum scale fallback
  );

  const calculateNiceMaxAmount = (val) => {
    if (val <= 0) return 100000;
    const magnitude = Math.pow(10, Math.floor(Math.log10(val)));
    const fraction = val / magnitude;
    let niceFraction;
    if (fraction <= 1) niceFraction = 1;
    else if (fraction <= 1.2) niceFraction = 1.2;
    else if (fraction <= 1.5) niceFraction = 1.5;
    else if (fraction <= 2) niceFraction = 2;
    else if (fraction <= 2.5) niceFraction = 2.5;
    else if (fraction <= 3) niceFraction = 3;
    else if (fraction <= 4) niceFraction = 4;
    else if (fraction <= 5) niceFraction = 5;
    else if (fraction <= 6) niceFraction = 6;
    else if (fraction <= 8) niceFraction = 8;
    else niceFraction = 10;
    return niceFraction * magnitude;
  };

  const maxMonthlyAmount = calculateNiceMaxAmount(rawMaxMonthly);

  // Y-axis tick values (4 steps matching 4 grid lines from top 100% to bottom 0%)
  const yAxisTicks = [
    maxMonthlyAmount,
    maxMonthlyAmount * (2 / 3),
    maxMonthlyAmount * (1 / 3),
    0
  ];

  if (isAdminView) {
    return (
      <React.Suspense fallback={<div className="admin-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', color: '#666' }}>Memuat Dashboard...</div>}>
        <AdminDashboard 
          onNavigateToApp={() => {
            window.history.pushState({}, '', window.location.pathname.replace('/admin', '/').replace(/\?admin.*/, ''));
            setIsAdminView(false);
          }}
        />
      </React.Suspense>
    );
  }

  return (
    <div className="app-container">
      {/* Active Tab View Rendering */}
      {activeTab === 'home' && (
        <div className="tab-page-transition">
          {/* Top Bar (Home) */}
          <header className="top-bar">
            <div className="month-navigator">
              <button type="button" className="month-btn" onClick={handlePrevMonth} aria-label="Previous Month">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 18l-6-6 6-6"/>
                </svg>
              </button>
              <span className="month-text">{formatMonthYear(currentDate)}</span>
              <button type="button" className="month-btn" onClick={handleNextMonth} aria-label="Next Month">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 18l6-6-6-6"/>
                </svg>
              </button>
            </div>

            <div 
              className="profile-info" 
              onClick={handleOpenProfileModal} 
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleOpenProfileModal();
                }
              }}
              style={{ cursor: 'pointer' }} 
              title="Klik untuk atur profil"
              aria-label="Profil Pengguna"
            >
              <div className="greeting">
                <span className="greeting-text">
                  {t('greeting')}
                </span>
                <span className="profile-name">{profileName || 'No Name'}</span>
              </div>
              <div className="profile-avatar">
                {profileImage ? (
                  <img src={profileImage} alt={profileName} className="profile-avatar-img" />
                ) : (
                  (profileName || 'N').trim().charAt(0).toUpperCase()
                )}
              </div>
            </div>
          </header>

          {/* Balance Cards */}
          <section className="balance-section">
            <div 
              className="balance-card expenses-card balance-card-clickable"
              onClick={() => setActiveBalanceDetail({
                type: 'expense',
                label: t('expenses'),
                amount: isCurrentMonth ? totalExpenses : 0,
                color: 'var(--card-expense-text)',
                bgColor: 'var(--card-expense-bg)',
                icon: '▼'
              })}
              role="button"
              tabIndex={0}
            >
              <span className="card-label">{t('expenses')}</span>
              <div className="amount-container">
                <span className="amount">{isCurrentMonth ? fmtMoney(totalExpenses) : fmtMoney(0)}</span>
                <span className="icon-down">▼</span>
              </div>
            </div>
            <div 
              className="balance-card income-card balance-card-clickable"
              onClick={() => setActiveBalanceDetail({
                type: 'income',
                label: t('income'),
                amount: isCurrentMonth ? totalIncome : 0,
                color: 'var(--card-income-text)',
                bgColor: 'var(--card-income-bg)',
                icon: '▲'
              })}
              role="button"
              tabIndex={0}
            >
              <span className="card-label">{t('income')}</span>
              <div className="amount-container">
                <span className="amount">{isCurrentMonth ? fmtMoney(totalIncome) : fmtMoney(0)}</span>
                <span className="icon-up">▲</span>
              </div>
            </div>
            <div 
              className="balance-card total-card balance-card-clickable"
              onClick={() => setActiveBalanceDetail({
                type: 'total',
                label: t('total'),
                amount: isCurrentMonth ? totalBalance : 0,
                color: '#2D5284',
                bgColor: '#E6EEFA',
                icon: '💰'
              })}
              role="button"
              tabIndex={0}
            >
              <span className="card-label">{t('total')}</span>
              <div className="amount-container">
                <span className="amount">{isCurrentMonth ? fmtMoney(totalBalance) : fmtMoney(0)}</span>
                <span className="icon-total font-bold">💰</span>
              </div>
            </div>
          </section>

          {isCurrentMonth && (
            <LossAversionBadge 
              transactions={transactions} 
              handleOpenAndaiModal={handleOpenAndaiModal} 
              fmtMoney={fmtMoney}
              t={t}
            />
          )}

          {/* Home Transaction Filter Tabs (Income / Expense) */}
          {isCurrentMonth && transactions.length > 0 && (
            <div className="home-tx-filter-bar">
              <div className={`home-tx-filter-indicator ${homeTxFilter === 'expense' ? 'to-expense' : 'to-income'}`} />
              <button
                type="button"
                className={`home-tx-filter-btn ${homeTxFilter === 'income' ? 'active income-active' : ''}`}
                onClick={() => setHomeTxFilter('income')}
              >
                {t('filterIncome')}
              </button>
              <button
                type="button"
                className={`home-tx-filter-btn ${homeTxFilter === 'expense' ? 'active expense-active' : ''}`}
                onClick={() => setHomeTxFilter('expense')}
              >
                {t('filterExpense')}
              </button>
            </div>
          )}

          {/* Transactions List Grouped by Date */}
          <section className="transactions-container transactions-container-animated" key={homeTxFilter}>
            {isCurrentMonth ? (
              (() => {
                const displayedHomeTransactions = transactions.filter(tx => {
                  if (homeTxFilter === 'income') return tx.type === 'income';
                  if (homeTxFilter === 'expense') return tx.type === 'expense';
                  return true;
                });

                if (displayedHomeTransactions.length === 0) {
                  return (
                    <div className="empty-transactions">
                      <span className="empty-icon">📂</span>
                      <span className="empty-title">{t('noTransactions')}</span>
                      <span className="empty-subtitle">
                        {homeTxFilter === 'income' 
                          ? t('noIncomeDesc') 
                          : homeTxFilter === 'expense' 
                          ? t('noExpenseDesc') 
                          : t('noTransactionsDesc')}
                      </span>
                    </div>
                  );
                }

                // Group transactions by date
                const groupedMap = {};
                displayedHomeTransactions.forEach(tx => {
                  const txDate = tx.date || '2026-08-09';
                  if (!groupedMap[txDate]) {
                    groupedMap[txDate] = [];
                  }
                  groupedMap[txDate].push(tx);
                });

                // Sort dates descending
                const sortedDates = Object.keys(groupedMap).sort((a, b) => b.localeCompare(a));

                return sortedDates.map(dateKey => {
                  const groupTxs = groupedMap[dateKey];
                  const [yearStr, monthStr, dayStr] = dateKey.split('-');
                  const dateObj = new Date(Number(yearStr), Number(monthStr) - 1, Number(dayStr));
                  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                  const dayName = days[dateObj.getDay()];

                  // Compute totals for this date
                  const dayIncome = groupTxs
                    .filter(t => t.type === 'income')
                    .reduce((sum, t) => sum + t.amount, 0);
                  const dayExpense = groupTxs
                    .filter(t => t.type === 'expense')
                    .reduce((sum, t) => sum + t.amount, 0);

                  return (
                    <div className="date-transaction-group" key={dateKey}>
                      {/* Date Group Header Row */}
                      <div className="date-group-header">
                        <div className="date-group-left">
                          <span className="date-day-number">{dayStr}</span>
                          <span className={`date-day-badge day-${dayName.toLowerCase()}`}>{dayName}</span>
                          <span className="date-month-year">{monthStr}.{yearStr}</span>
                        </div>
                        <div className="date-group-right">
                          <span className="day-income-amount">{fmtMoney(dayIncome)}</span>
                          <span className="day-expense-amount">{fmtMoney(dayExpense)}</span>
                        </div>
                      </div>

                      {/* Transaction Items under this date */}
                      <div className="date-group-items">
                        {groupTxs.map(item => {
                          if (voiceAnimatingTxIds.has(item.id)) {
                            return (
                              <VoiceAnimatedTransactionItem
                                key={item.id}
                                item={item}
                                resolveIcon={resolveIcon}
                                isDeleting={deletingTxId === item.id}
                                onAnimationComplete={handleVoiceAnimationComplete}
                              />
                            );
                          }

                          return (
                            <div className={`transaction-item ${deletingTxId === item.id ? 'deleting-sink' : ''}`} key={item.id}>
                              <div className={`transaction-icon ${item.iconClass}`}>
                                {resolveIcon(item) && <img src={resolveIcon(item)} alt={item.category} />}
                              </div>
                              <div className="transaction-details">
                                <span className="transaction-title">{item.title}</span>
                                <span className="transaction-category">{getCategoryName(item.category, appLanguage)} • {item.account || 'BRImo'}</span>
                              </div>
                              <div className={`transaction-amount ${item.type === 'expense' ? 'negative' : 'positive'}`}>
                                {item.type === 'expense' ? '-' : '+'}{fmtMoney(item.amount)}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                });
              })()
            ) : (
              <div className="empty-transactions">
                <span className="empty-icon">📂</span>
                <span className="empty-title">{t('noTransactions')}</span>
                <span className="empty-subtitle">{t('noTransactionsDesc')}</span>
              </div>
            )}
          </section>
        </div>
      )}

      {/* Account View (Swipeable Expense / Income Breakdown by Account) */}
      {activeTab === 'accounts' && (
        <div 
          className="accounts-page-container tab-page-transition"
          onTouchStart={handleAccountTouchStart}
          onTouchEnd={handleAccountTouchEnd}
        >
          {/* Header Row: Date Navigator (left) & Period Dropdown (right) */}
          <header className="stats-header-bar">
            <div className="stats-date-nav">
              <button type="button" className="month-btn" onClick={handlePrevMonth} aria-label="Previous Period">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 18l-6-6 6-6"/>
                </svg>
              </button>
              <span className="month-text">
                {periodFilter === 'monthly' ? formatMonthYear(currentDate) : periodFilter === 'yearly' ? `${currentDate.getFullYear()}` : formatMonthYear(currentDate)}
              </span>
              <button type="button" className="month-btn" onClick={handleNextMonth} aria-label="Next Period">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 18l6-6-6-6"/>
                </svg>
              </button>
            </div>

            <div className="stats-dropdown-wrapper" ref={dropdownRef}>
              <button
                type="button"
                className="stats-period-btn"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              >
                <span>{periodFilter === 'monthly' ? 'Monthly' : periodFilter === 'weekly' ? 'Weekly' : 'Yearly'}</span>
                <span className={`stats-select-arrow ${isDropdownOpen ? 'open' : ''}`}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 9l6 6 6-6"/>
                  </svg>
                </span>
              </button>

              {isDropdownOpen && (
                <div className="custom-dropdown-menu">
                  {[
                    { id: 'monthly', label: 'Monthly' },
                    { id: 'weekly', label: 'Weekly' },
                    { id: 'yearly', label: 'Yearly' }
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      className={`custom-dropdown-item ${periodFilter === opt.id ? 'active' : ''}`}
                      onClick={() => {
                        setPeriodFilter(opt.id);
                        setIsDropdownOpen(false);
                      }}
                    >
                      {opt.label}
                      {periodFilter === opt.id && <span className="check-mark">✓</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </header>

          {/* Accounts Summary Hero Card with Dots Indicator */}
          {(() => {
            const currentTypeTxs = filteredTransactions.filter(t => t.type === accountsSubTab);
            const totalSum = currentTypeTxs.reduce((sum, t) => sum + t.amount, 0);
            const isExpense = accountsSubTab === 'expense';

            return (
              <div className="accounts-summary-hero">
                <span className="accounts-hero-sub">
                  {isExpense ? t('expenses') : t('income')}
                </span>
                <h1 className={`accounts-hero-total ${isExpense ? 'expense-color' : 'income-color'}`}>
                  {isExpense ? '' : '+'}{fmtMoney(totalSum)}
                </h1>

                {/* Pagination indicator dots (Non-clickable visual marker) */}
                <div className="account-swipe-dots" aria-hidden="true">
                  <span className={`account-dot ${isExpense ? 'active' : ''}`} />
                  <span className={`account-dot ${!isExpense ? 'active' : ''}`} />
                </div>
              </div>
            );
          })()}

          {/* Accounts Breakdown List */}
          <div className="accounts-breakdown-list">
            {(() => {
              const currentTypeTxs = filteredTransactions.filter(t => t.type === accountsSubTab);
              const isExpense = accountsSubTab === 'expense';
              const accMap = {};

              currentTypeTxs.forEach(t => {
                const accName = t.account || 'Cash';
                if (!accMap[accName]) {
                  accMap[accName] = {
                    name: accName,
                    amount: 0,
                    count: 0,
                    transactions: []
                  };
                }
                accMap[accName].amount += t.amount;
                accMap[accName].count += 1;
                accMap[accName].transactions.push(t);
              });

              const activeAccounts = Object.values(accMap).sort((a, b) => b.amount - a.amount);
              const totalAmount = currentTypeTxs.reduce((sum, t) => sum + t.amount, 0);

              if (activeAccounts.length === 0) {
                return (
                  <div className="empty-transactions" style={{ marginTop: '20px' }}>
                    <span className="empty-icon">💳</span>
                    <span className="empty-title">{t('noTransactions')}</span>
                    <span className="empty-subtitle">
                      {isExpense ? t('noExpenseDesc') : t('noIncomeDesc')}
                    </span>
                  </div>
                );
              }

              return activeAccounts.map((item, idx) => {
                const percentage = totalAmount > 0 ? Math.round((item.amount / totalAmount) * 100) : 0;
                const normName = (item.name || '').toLowerCase().trim();
                const isLegacyGeneric = normName === 'bank' || normName === 'e-wallet' || normName === 'ewallet' || normName === 'mandiri' || normName === 'bni' || normName === 'pos indonesia' || normName === 'pegadaian';

                return (
                  <div key={idx} className="account-card-item">
                    <div className="account-card-left">
                      <div className="account-card-badge-wrap">
                        <AccountIconBadge accountName={item.name} size={32} />
                      </div>
                      <div className="account-card-info">
                        <div className="account-card-name-row" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span className="account-card-name">{item.name}</span>
                          {isLegacyGeneric && (
                            <button
                              type="button"
                              className="account-adjust-tag-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                setAdjustingAccount(item.name);
                              }}
                              title={t('adjustAccountTitle') || 'Sesuaikan Akun'}
                            >
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 20h9"/>
                                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
                              </svg>
                              <span>{t('adjustAccountBtn') || 'Sesuaikan'}</span>
                            </button>
                          )}
                        </div>
                        <span className="account-card-count">{item.count} transaksi • {percentage}%</span>
                      </div>
                    </div>
                    <div className="account-card-right">
                      <span className={`account-card-amount ${isExpense ? 'expense-color' : 'income-color'}`}>
                        {isExpense ? '-' : '+'}{fmtMoney(item.amount)}
                      </span>
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </div>
      )}

      {/* Stats / Diagram View */}
      {activeTab === 'stats' && (
        <div className="stats-page-container tab-page-transition">
          {/* Header Row: Date Navigator (left) & Period Dropdown (right) */}
          <header className="stats-header-bar">
            <div className="stats-date-nav">
              <button type="button" className="month-btn" onClick={handlePrevMonth} aria-label="Previous Period">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 18l-6-6 6-6"/>
                </svg>
              </button>
              <span className="month-text">
                {periodFilter === 'monthly' ? formatMonthYear(currentDate) : periodFilter === 'yearly' ? `${currentDate.getFullYear()}` : 'Minggu Ini'}
              </span>
              <button type="button" className="month-btn" onClick={handleNextMonth} aria-label="Next Period">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 18l6-6-6-6"/>
                </svg>
              </button>
            </div>

            <div className="stats-dropdown-wrapper" ref={dropdownRef}>
              <button
                type="button"
                className="stats-period-btn"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              >
                <span>{periodFilter === 'monthly' ? 'Monthly' : periodFilter === 'weekly' ? 'Weekly' : 'Yearly'}</span>
                <span className={`stats-select-arrow ${isDropdownOpen ? 'open' : ''}`}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 9l6 6 6-6"/>
                  </svg>
                </span>
              </button>

              {isDropdownOpen && (
                <div className="custom-dropdown-menu">
                  {[
                    { id: 'monthly', label: 'Monthly' },
                    { id: 'weekly', label: 'Weekly' },
                    { id: 'yearly', label: 'Yearly' }
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      className={`custom-dropdown-item ${periodFilter === opt.id ? 'active' : ''}`}
                      onClick={() => {
                        setPeriodFilter(opt.id);
                        setIsDropdownOpen(false);
                      }}
                    >
                      {opt.label}
                      {periodFilter === opt.id && <span className="check-mark">✓</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </header>

          {/* Type Toggle Header Row: Income vs Expenses Total */}
          <div className="stats-type-tabs">
            <button
              type="button"
              className={`stats-type-tab income ${statsType === 'income' ? 'active' : ''}`}
              onClick={() => setStatsType('income')}
            >
              <span>{t('income')}</span>
              <span className="stats-total-amount">
                {fmtMoney(filteredTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0))}
              </span>
            </button>
            <button
              type="button"
              className={`stats-type-tab expense ${statsType === 'expense' ? 'active' : ''}`}
              onClick={() => setStatsType('expense')}
            >
              <span>{t('expenses')}</span>
              <span className="stats-total-amount">
                {fmtMoney(filteredTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0))}
              </span>
            </button>
          </div>

          {/* Pie Chart Section */}
          <div className="stats-chart-card">
            {statsCategories.length > 0 ? (
              <div className="pie-chart-container">
                <svg viewBox="0 0 380 260" className="pie-chart-svg">
                  <g transform="translate(190, 130)">
                    {/* Layer 1 (Underneath): Connecting Lines */}
                    {pieSlices.map((slice, idx) => (
                      <polyline
                        key={`line-${idx}`}
                        points={`${slice.pInner.x},${slice.pInner.y} ${slice.pOuter.x},${slice.pOuter.y} ${slice.pLabel.x},${slice.pLabel.y}`}
                        fill="none"
                        stroke={slice.color}
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    ))}

                    {/* Layer 2 (Middle): SVG Pie Slices (No outer white stroke) */}
                    {pieSlices.map((slice, idx) => (
                      <path
                        key={`slice-${idx}`}
                        d={slice.pathData}
                        fill={slice.color}
                        stroke="none"
                        className="pie-slice"
                      />
                    ))}

                    {/* Layer 3 (Top): Label Texts */}
                    {pieSlices.map((slice, idx) => {
                      const textAnchor = slice.isRight ? 'start' : 'end';
                      return (
                        <g 
                          key={`label-${idx}`} 
                          className="pie-label-group"
                        >
                          <text
                            x={slice.pLabel.x + (slice.isRight ? 2 : -2)}
                            y={slice.pLabel.y - 3}
                            textAnchor={textAnchor}
                            className="pie-label-name"
                          >
                            {getCategoryName(slice.name, appLanguage)}
                          </text>
                          <text
                            x={slice.pLabel.x + (slice.isRight ? 2 : -2)}
                            y={slice.pLabel.y + 10}
                            textAnchor={textAnchor}
                            className="pie-label-percent"
                          >
                            {slice.percentage}%
                          </text>
                        </g>
                      );
                    })}
                  </g>
                </svg>
              </div>
            ) : (
              <div className="pie-chart-empty">
                <span>📊</span>
                <p>Belum ada data {statsType === 'expense' ? 'pengeluaran' : 'pemasukan'}</p>
              </div>
            )}
          </div>

          {/* Segmented Capsule Toggle: Pie Chart (Left) vs Grafik (Right) */}
          <div className="stats-view-switcher-bar">
            <div className={`stats-view-switcher-indicator ${statsSubTab === 'chart' ? 'to-chart' : 'to-pie'}`} />
            <button
              type="button"
              className={`stats-view-switcher-btn ${statsSubTab === 'pie' ? 'active' : ''}`}
              onClick={() => setStatsSubTab('pie')}
            >
              {t('statsPieChart')}
            </button>
            <button
              type="button"
              className={`stats-view-switcher-btn ${statsSubTab === 'chart' ? 'active' : ''}`}
              onClick={() => setStatsSubTab('chart')}
            >
              {t('statsBarChart')}
            </button>
          </div>

          {/* Conditional View: Pie Chart Breakdown vs Monthly Bar Chart */}
          {statsSubTab === 'pie' ? (
            /* Category Breakdown List */
            <div className="stats-breakdown-list">
              {statsCategories.map((cat, idx) => {
                const isUnlockedMonth = isEndOfMonthOrTesting(currentDate.getFullYear(), currentDate.getMonth());
                const isRead = isCategoryInsightRead(cat.name, currentDate.getFullYear(), currentDate.getMonth());
                const showPulsingCta = statsType === 'expense' && isUnlockedMonth && !isRead;

                return (
                  <div 
                    key={idx} 
                    className="stats-breakdown-item interactive"
                    onClick={() => handleOpenCategoryInsight(cat)}
                    title="Klik untuk melihat insight lengkap"
                  >
                    <div className="stats-item-left">
                      <div className="stats-percent-badge" style={{ backgroundColor: cat.color }}>
                        {Math.round(cat.percentage)}%
                      </div>
                      <div className="stats-cat-info">
                        {resolveIcon(cat) && <img src={resolveIcon(cat)} alt={cat.name} className="stats-cat-icon" />}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                          <span className="stats-cat-name">
                            {getCategoryName(cat.name, appLanguage)} <span className="stats-cat-count">({cat.count}x)</span>
                          </span>
                          {showPulsingCta && (
                            <span className="stats-insight-cta">
                              ✨ Klik lihat insight mu {profileName || 'No Name'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="stats-item-right">
                      <span className="stats-cat-amount">{fmtMoney(cat.amount)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Monthly Income vs Expense Bar Chart */
            <div className="stats-bar-chart-card">
              <div 
                className="stats-bar-chart-scroll-wrapper"
                ref={(el) => {
                  if (el && !el._hasAutoScrolled) {
                    el._hasAutoScrolled = true;
                    // Auto scroll to current month as leftmost view
                    const currentMonthIdx = currentDate.getMonth();
                    const itemWidth = el.scrollWidth / 12;
                    el.scrollLeft = Math.max(0, currentMonthIdx * itemWidth);
                  }
                }}
              >
                <div className="stats-bar-chart-grid">
                  {/* Background Reference Lines with Y-Axis Values */}
                  <div className="stats-bar-grid-lines">
                    {yAxisTicks.map((val, idx) => (
                      <div key={idx} className="stats-grid-line-wrap">
                        <span className="stats-grid-y-label">
                          {formatCompactMoney(val, appCurrency, liveExchangeRates)}
                        </span>
                        <div className="stats-grid-line" />
                      </div>
                    ))}
                  </div>

                  {/* 12 Months Columns */}
                  <div className="stats-bar-columns-row">
                    {monthlyBarChartData.map((item) => {
                      const earnedHeightPct = maxMonthlyAmount > 0 ? (item.earned / maxMonthlyAmount) * 100 : 0;
                      const spendHeightPct = maxMonthlyAmount > 0 ? (item.spend / maxMonthlyAmount) * 100 : 0;

                      return (
                        <div 
                          key={item.monthIdx} 
                          className={`stats-month-col ${item.isCurrentMonth ? 'current-month-col' : ''}`}
                          onClick={() => {
                            // Quick change month when clicked
                            const nextDate = new Date(currentDate);
                            nextDate.setMonth(item.monthIdx);
                            setCurrentDate(nextDate);
                          }}
                        >
                          <div className="stats-bar-pair-container">
                            {/* Earned / Income Bar */}
                            <div className="stats-bar-track">
                              {item.earned > 0 && (
                                <div 
                                  className="stats-bar-fill earned-bar"
                                  style={{ height: `${earnedHeightPct}%` }}
                                  title={`${item.fullName} Pemasukan: ${fmtMoney(item.earned)}`}
                                />
                              )}
                            </div>

                            {/* Spend / Expense Bar */}
                            <div className="stats-bar-track">
                              {item.spend > 0 && (
                                <div 
                                  className="stats-bar-fill spend-bar"
                                  style={{ height: `${spendHeightPct}%` }}
                                  title={`${item.fullName} Pengeluaran: ${fmtMoney(item.spend)}`}
                                />
                              )}
                            </div>
                          </div>

                          {/* Month Label */}
                          <div className={`stats-bar-month-pill ${item.isCurrentMonth ? 'active-pill' : ''}`}>
                            {item.shortName}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Legend Indicator (Earned vs Spend) */}
              <div className="stats-chart-legend-bar">
                <div className="stats-legend-item">
                  <span className="stats-legend-dot earned-dot" />
                  <span className="stats-legend-label">{t('statsEarned')}</span>
                </div>
                <div className="stats-legend-divider" />
                <div className="stats-legend-item">
                  <span className="stats-legend-dot spend-dot" />
                  <span className="stats-legend-label">{t('statsSpend')}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Budget Cap View (Bottom Nav Tab) */}
      {activeTab === 'budget' && (
        <div className="budget-page-container tab-page-transition">
          {/* Budget Hero Card (Top Main Budget Container) */}
          {(() => {
            const hasMain = typeof mainMonthlyBudget === 'number' && mainMonthlyBudget > 0;
            const spent = currentMonthExpenses;
            const remaining = hasMain ? mainMonthlyBudget - spent : 0;
            const spentPercent = hasMain ? (spent / mainMonthlyBudget) * 100 : 0;
            const isOver = hasMain && spent > mainMonthlyBudget;
            const barStatus = isOver ? 'danger' : (spentPercent >= 80 ? 'warning' : 'safe');
            const monthName = MONTH_NAMES_I18N[appLanguage] 
              ? MONTH_NAMES_I18N[appLanguage][currentDate.getMonth()] 
              : currentDate.toLocaleDateString('id-ID', { month: 'long' });

            return (
              <div className="budget-hero-card">
                {/* Top Bar inside Card: Target Badge + Month Badge (No Profile Name) */}
                <div className="budget-hero-top">
                  <div className="budget-hero-header-badge">
                    <span className="budget-hero-header-icon">🎯</span>
                    <span className="budget-hero-header-title">{t('mainBudget')}</span>
                  </div>

                  <div className="budget-hero-month-nav">
                    <button 
                      type="button" 
                      className="budget-hero-month-arrow month-btn" 
                      onClick={handlePrevMonth}
                      aria-label="Bulan Sebelumnya"
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M15 18l-6-6 6-6"/>
                      </svg>
                    </button>

                    <button 
                      type="button" 
                      className="budget-hero-badge-btn" 
                      onClick={() => {
                        setBudgetPickerYear(currentDate.getFullYear());
                        setIsBudgetMonthPickerOpen(true);
                      }}
                      title="Pilih Bulan & Tahun"
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                        <line x1="16" y1="2" x2="16" y2="6"></line>
                        <line x1="8" y1="2" x2="8" y2="6"></line>
                        <line x1="3" y1="10" x2="21" y2="10"></line>
                      </svg>
                      <span>{monthName} {currentDate.getFullYear()}</span>
                    </button>

                    <button 
                      type="button" 
                      className="budget-hero-month-arrow month-btn" 
                      onClick={handleNextMonth}
                      aria-label="Bulan Berikutnya"
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 18l6-6-6-6"/>
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Hero Middle Content */}
                <div className="budget-hero-content">
                  <div className="budget-hero-label-row">
                    <span className="budget-hero-label">
                      {hasMain ? t('mainBudgetDesc') : 'Total batas pengeluaran seluruh kategori'}
                    </span>
                    {hasMain && (
                      <span className={`budget-hero-pct-badge ${isOver ? 'danger' : (spentPercent >= 80 ? 'warning' : 'safe')}`}>
                        {isOver ? '⚡ OVER LIMIT' : `Lv. ${Math.round(spentPercent)}%`}
                      </span>
                    )}
                  </div>

                  {isEditingMainBudget ? (
                    <div className="budget-direct-amount-row">
                      <span className="budget-direct-currency-prefix">{getCurrency(appCurrency).symbol}</span>
                      <input 
                        ref={mainBudgetInputRef}
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        autoFocus
                        className="budget-direct-amount-input"
                        placeholder="0"
                        value={mainBudgetInputValue}
                        onChange={(e) => {
                          const raw = e.target.value.replace(/\./g, '').replace(/[^0-9]/g, '');
                          const formatted = raw ? new Intl.NumberFormat('id-ID').format(parseInt(raw, 10)) : '';
                          setMainBudgetInputValue(formatted);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveMainBudget();
                          if (e.key === 'Escape') setIsEditingMainBudget(false);
                        }}
                      />
                    </div>
                  ) : (
                    <div 
                      className="budget-hero-amount"
                      onClick={handleStartEditMainBudget}
                      style={{ cursor: 'pointer' }}
                      title="Sentuh untuk mengubah budget"
                    >
                      {hasMain ? fmtMoney(mainMonthlyBudget) : fmtMoney(0)}
                    </div>
                  )}

                  {/* Stats Breakdown */}
                  <div className="budget-hero-stats">
                    <div className="budget-stat-item">
                      <span className="budget-stat-label">{t('usedThisMonth')}:</span>
                      <strong className="budget-stat-val spent">{fmtMoney(spent)}</strong>
                    </div>
                    <div className={`budget-stat-item ${isOver ? 'over' : ''}`}>
                      <span className="budget-stat-label">{t('remainingBudget')}:</span>
                      <strong className="budget-stat-val remaining">
                        {hasMain ? (remaining >= 0 ? fmtMoney(remaining) : `-${fmtMoney(Math.abs(remaining))}`) : '-'}
                      </strong>
                    </div>
                  </div>

                  {/* Gaming Style HP / EXP Progress Track (Borderless) */}
                  <div className="budget-game-bar-wrapper">
                    <div className="budget-game-bar-frame borderless">
                      <div 
                        className={`budget-game-bar-fill ${barStatus}`}
                        style={{ width: `${hasMain ? Math.min(Math.max(spentPercent, 4), 100) : 0}%` }}
                      >
                        <div className="budget-game-bar-shine" />
                        <div className="budget-game-bar-stripes" />
                      </div>
                    </div>
                    <div className="budget-game-bar-meta">
                      <span className="budget-game-bar-status">
                        {hasMain 
                          ? (isOver ? '⚠️ Limit Terlampaui!' : (spentPercent >= 80 ? '⚡ Waspada Limit!' : '✨ Kondisi Aman')) 
                          : 'Budget belum diatur'}
                      </span>
                      <span className="budget-game-bar-ratio">
                        {hasMain ? `${fmtMoney(spent, false)} / ${fmtMoney(mainMonthlyBudget, false)}` : `${fmtMoney(spent, false)} / ${fmtMoney(0, false)}`}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons with Proper Interactive Logic */}
                <div className="budget-hero-actions">
                  {isEditingMainBudget ? (
                    <>
                      <button 
                        type="button" 
                        className="budget-hero-btn primary"
                        onClick={handleSaveMainBudget}
                      >
                        <span>Simpan Budget</span>
                      </button>
                      <button 
                        type="button" 
                        className="budget-hero-btn secondary"
                        onClick={() => {
                          setIsEditingMainBudget(false);
                          setMainBudgetInputValue('');
                        }}
                        title="Batal Edit"
                      >
                        <span>Batal</span>
                      </button>
                    </>
                  ) : hasMain ? (
                    <>
                      <button 
                        type="button" 
                        className="budget-hero-btn primary"
                        onClick={handleStartEditMainBudget}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                        <span>Ubah Budget</span>
                      </button>
                      <button 
                        type="button" 
                        className="budget-hero-btn secondary"
                        onClick={handleRemoveMainBudget}
                        title="Hapus Budget Bulan Ini"
                      >
                        <span>Hapus</span>
                      </button>
                    </>
                  ) : (
                    <button 
                      type="button" 
                      className="budget-hero-btn primary"
                      onClick={handleStartEditMainBudget}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="12" y1="5" x2="12" y2="19"/>
                        <line x1="5" y1="12" x2="19" y2="12"/>
                      </svg>
                      <span>Atur Budget</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })()}

          {/* Category Section Header */}
          <div className="budget-section-header">
            <h3 className="budget-section-title">{t('categoryBreakdown')}</h3>
          </div>

          {/* Search Bar */}
          <div className="budget-search-section">
            <div className="budget-search-wrapper">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/>
                <line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input 
                type="text" 
                className="budget-search-input"
                placeholder="Cari kategori (kopi, bensin, belanja)..."
                value={budgetSearchQuery}
                onChange={(e) => setBudgetSearchQuery(e.target.value)}
              />
              {budgetSearchQuery && (
                <button 
                  type="button" 
                  className="budget-search-clear"
                  onClick={() => setBudgetSearchQuery('')}
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Filter Tabs */}
          {(() => {
            const countAll = expenseCategories.length;
            const countActive = expenseCategories.filter(c => typeof c.monthlyLimit === 'number' && c.monthlyLimit > 0).length;
            const countUnset = countAll - countActive;

            return (
              <div className="budget-filter-tabs">
                <button 
                  type="button" 
                  className={`budget-tab-btn ${budgetFilterTab === 'all' ? 'active' : ''}`}
                  onClick={() => setBudgetFilterTab('all')}
                >
                  Semua ({countAll})
                </button>
                <button 
                  type="button" 
                  className={`budget-tab-btn ${budgetFilterTab === 'active' ? 'active' : ''}`}
                  onClick={() => setBudgetFilterTab('active')}
                >
                  Aktif ({countActive})
                </button>
                <button 
                  type="button" 
                  className={`budget-tab-btn ${budgetFilterTab === 'unset' ? 'active' : ''}`}
                  onClick={() => setBudgetFilterTab('unset')}
                >
                  Belum Diatur ({countUnset})
                </button>
              </div>
            );
          })()}

          {/* Category Grid (2 Kolom Compact & Pop-up on Tap) */}
          <div className="budget-grid-section">
            {(() => {
              const filtered = getFilteredBudgetCategories();
              if (filtered.length === 0) {
                return (
                  <div style={{ textAlign: 'center', padding: '40px 20px', color: '#64748B' }}>
                    <p style={{ fontSize: '14px', fontWeight: 500 }}>
                      {budgetSearchQuery ? `Kategori "${budgetSearchQuery}" tidak ditemukan` : 'Tidak ada kategori pada filter ini'}
                    </p>
                  </div>
                );
              }

              // Jika sedang searching atau list <= 6, tampilkan semua langsung. Jika tidak, batasi 6 (3 baris x 2 kolom) saat collapse
              const isSearchActive = Boolean(budgetSearchQuery && budgetSearchQuery.trim());
              const shouldShowAll = isSearchActive || isBudgetCategoriesExpanded || filtered.length <= 6;
              const displayList = shouldShowAll ? filtered : filtered.slice(0, 6);

              return (
                <>
                  <div className="budget-category-grid">
                    {displayList.map(cat => {
                      const iconPath = resolveIcon(cat);
                      const hasLimit = typeof cat.monthlyLimit === 'number' && cat.monthlyLimit > 0;

                      return (
                        <div 
                          key={cat.id} 
                          className={`budget-grid-card ${hasLimit ? 'has-limit' : ''}`}
                          onClick={() => handleOpenCategoryBudgetModal(cat)}
                        >
                          <div className="budget-grid-card-top">
                            <div className={`budget-grid-icon-box ${cat.iconClass}`}>
                              <img src={iconPath} alt={cat.name} />
                            </div>
                            {hasLimit ? (
                              <span className="budget-grid-status-dot active" title="Batas Aktif" />
                            ) : (
                              <span className="budget-grid-status-dot unset" title="Belum Diatur" />
                            )}
                          </div>

                          <div className="budget-grid-card-info">
                            <span className="budget-grid-cat-name">{getCategoryName(cat.name, appLanguage)}</span>
                            <span className="budget-grid-limit-text">
                              {hasLimit ? fmtMoney(cat.monthlyLimit) : t('tapToSet')}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Tombol Lebarkan / Tampilkan Lebih Banyak jika item lebih dari 6 */}
                  {!isSearchActive && filtered.length > 6 && (
                    <div className="budget-expand-btn-wrapper">
                      <button
                        type="button"
                        className="budget-expand-toggle-btn"
                        onClick={() => setIsBudgetCategoriesExpanded(prev => !prev)}
                      >
                        <span>
                          {isBudgetCategoriesExpanded 
                            ? 'Sembunyikan' 
                            : `Tampilkan Semua (${filtered.length})`}
                        </span>
                        <svg 
                          width="16" 
                          height="16" 
                          viewBox="0 0 24 24" 
                          fill="none" 
                          stroke="currentColor" 
                          strokeWidth="2.4" 
                          strokeLinecap="round" 
                          strokeLinejoin="round"
                          style={{ 
                            transform: isBudgetCategoriesExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                            transition: 'transform 0.25s ease'
                          }}
                        >
                          <polyline points="6 9 12 15 18 9"/>
                        </svg>
                      </button>
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        </div>
      )}

      {activeTab === 'home' && !isAddModalOpen && !isProfileModalOpen && !isBudgetCapModalOpen && (
        <VoiceMicButton
          expenseCategories={expenseCategories}
          incomeCategories={incomeCategories}
          accountsList={accountsList}
          setTransType={setTransType}
          setAmountVal={setAmountVal}
          setSelectedCategory={setSelectedCategory}
          setAccount={setAccount}
          setNote={setNote}
          handleSaveVoiceTransaction={handleSaveVoiceTransaction}
        />
      )}

      {/* Voice Feedback Toast Notification */}
      {voiceToastMessage && (
        <div className="voice-toast-notification">
          <span>{voiceToastMessage}</span>
        </div>
      )}

      {/* Bottom Nav */}
      <nav className="bottom-nav">
        <svg className="nav-bg-svg" viewBox="0 0 400 80" preserveAspectRatio="none">
          <rect x="0" y="0" width="400" height="80" rx="20" fill="rgba(248, 239, 230, 0.95)" />
          <path
            d="M 0,20 Q 0,0 20,0 L 145,0 C 165,0 172,34 200,34 C 228,34 235,0 255,0 L 380,0 Q 400,0 400,20 L 400,80 L 0,80 Z"
            fill="rgba(248, 239, 230, 0.98)"
          />
        </svg>

        <div className="nav-items-container">
          <div className="nav-group-left">
            <button
              type="button"
              className={`nav-item tour-target-home ${activeTab === 'home' ? 'active' : ''}`}
              onClick={() => setActiveTab('home')}
              aria-label={t('home')}
            >
              <img src={houseSvg} alt="Home" className="nav-icon" />
              <span className="nav-label">{t('home')}</span>
            </button>

            <button
              type="button"
              className={`nav-item tour-target-account ${activeTab === 'accounts' ? 'active' : ''}`}
              onClick={() => setActiveTab('accounts')}
              aria-label={t('accounts')}
            >
              <img src={akunSvg} alt="Account" className="nav-icon" />
              <span className="nav-label">{t('accounts')}</span>
            </button>
          </div>

          <div className="center-add-wrapper tour-target-add">
            <button
              type="button"
              className="center-add-btn"
              onClick={() => {
                playPopSound('bubble_pop_2.wav');
                handleOpenAddModal();
              }}
              aria-label="Add transaction"
            >
              <img src={addSvg} alt="Add" className="add-icon" />
            </button>
          </div>

          <div className="nav-group-right">
            <button
              type="button"
              className={`nav-item tour-target-budget ${activeTab === 'budget' ? 'active' : ''}`}
              onClick={() => setActiveTab('budget')}
              aria-label={t('budget')}
            >
              <img src={budgetSvg} alt="Budget" className="nav-icon" />
              <span className="nav-label">{t('budget')}</span>
            </button>

            <button
              type="button"
              className={`nav-item tour-target-stats ${activeTab === 'stats' ? 'active' : ''}`}
              onClick={() => setActiveTab('stats')}
              aria-label={t('stats')}
            >
              <img src={diagramSvg} alt="Stats" className="nav-icon" />
              <span className="nav-label">{t('stats')}</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Full Page Add Transaction Screen (Triggered by Plus button) */}
      {isAddModalOpen && (
        <div
          className="full-page-add-screen"
          onScroll={() => {
            if (isNoteSuggestionsOpen) setIsNoteSuggestionsOpen(false);
          }}
        >
          {/* Top Header */}
          <div className="full-page-header">
            <button type="button" className="back-btn" onClick={() => setIsAddModalOpen(false)} aria-label="Back">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 19l-7-7 7-7"/>
                <path d="M7 12h13"/>
              </svg>
            </button>
            <span className="full-page-title">
              {transType === 'Expense' 
                ? (appLanguage === 'id_id' ? 'Pengeluaran' : appLanguage === 'jv' ? 'Pangetrapan' : appLanguage === 'zh' ? 'Zhichu' : 'Expense') 
                : transType === 'Income' 
                  ? (appLanguage === 'id_id' ? 'Pemasukan' : appLanguage === 'jv' ? 'Pamasukan' : appLanguage === 'zh' ? 'Shouru' : 'Income') 
                  : (appLanguage === 'jv' ? 'Menawi' : appLanguage === 'zh' ? 'Ruguo' : appLanguage === 'en' ? 'Simulate' : 'Andai')}
            </span>
          </div>

          {/* Type Switcher Tabs */}
          <div className="type-switcher-container">
            <div className="type-switcher">
              {['Income', 'Expense', 'Andai'].map(type => (
                <button
                  key={type}
                  type="button"
                  className={`type-tab ${transType === type ? `active ${type.toLowerCase()}-tab` : ''} tour-target-tab-${type.toLowerCase()}`}
                  onClick={() => {
                    setTransType(type);
                    setActivePanel('amount');
                    setNote('');
                    setIsNoteSuggestionsOpen(false);
                    if (type === 'Income') {
                      setSelectedCategory(incomeCategories[0]);
                    } else if (type === 'Expense') {
                      setSelectedCategory(expenseCategories[0]);
                    }
                  }}
                >
                  {type === 'Expense' 
                    ? (appLanguage === 'id_id' ? 'Pengeluaran' : appLanguage === 'jv' ? 'Pangetrapan' : appLanguage === 'zh' ? 'Zhichu' : appLanguage === 'ko' ? 'Jichul' : 'Expense') 
                    : type === 'Income' 
                      ? (appLanguage === 'id_id' ? 'Pemasukan' : appLanguage === 'jv' ? 'Pamasukan' : appLanguage === 'zh' ? 'Shouru' : appLanguage === 'ko' ? 'Su-ip' : 'Income') 
                      : (appLanguage === 'jv' ? 'Menawi' : appLanguage === 'zh' ? 'Ruguo' : appLanguage === 'ko' ? 'Gajeong' : appLanguage === 'en' ? 'Simulate' : 'Andai')}
                </button>
              ))}
            </div>
          </div>

          {/* Fitur 'Andai' — Opportunity Cost & Consumptive Investment Visualizer */}
          {transType === 'Andai' ? (
            <AndaiFeatureView 
              transactions={transactions} 
              resolveIcon={resolveIcon}
              appLanguage={appLanguage}
              t={t}
              appCurrency={appCurrency}
              liveExchangeRates={liveExchangeRates}
            />
          ) : (
            /* Form Fields List for Expense & Income */
            <div className="full-page-form">
              {/* Date Row (Split Date & Time Click Triggers for Native Android/iOS Pickers) */}
              <div className="form-row date-row-container">
                <span className="field-label">{t('formDate')}</span>
                <div className="date-display-wrapper">
                  <span
                    className="field-value-date-clickable"
                    onClick={() => {
                      if (dateInputRef.current) {
                        if (typeof dateInputRef.current.showPicker === 'function') {
                          dateInputRef.current.showPicker();
                        } else {
                          dateInputRef.current.click();
                          dateInputRef.current.focus();
                        }
                      }
                    }}
                  >
                    {(() => {
                      try {
                        const [year, month, day] = selectedDateVal.split('-').map(Number);
                        const d = new Date(year, month - 1, day);
                        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                        return `${month}/${day}/${String(year).slice(-2)} (${days[d.getDay()]})`;
                      } catch {
                        return selectedDateVal;
                      }
                    })()}
                  </span>
                  <span className="date-time-spacer">&nbsp;</span>
                  <span
                    className="field-value-time-clickable"
                    onClick={() => {
                      if (timeInputRef.current) {
                        if (typeof timeInputRef.current.showPicker === 'function') {
                          timeInputRef.current.showPicker();
                        } else {
                          timeInputRef.current.click();
                          timeInputRef.current.focus();
                        }
                      }
                    }}
                  >
                    {selectedTimeVal}
                  </span>

                  {/* Hidden inputs to capture native calendar & clock dialogs */}
                  <input
                    ref={dateInputRef}
                    type="date"
                    className="hidden-picker-input"
                    value={selectedDateVal}
                    onChange={(e) => setSelectedDateVal(e.target.value)}
                    aria-label="Pilih Tanggal Transaksi"
                  />
                  <input
                    ref={timeInputRef}
                    type="time"
                    className="hidden-picker-input"
                    value={selectedTimeVal}
                    onChange={(e) => setSelectedTimeVal(e.target.value)}
                    aria-label="Pilih Waktu Transaksi"
                  />
                </div>
              </div>

              {/* Amount Row */}
              <div
                className={`form-row clickable ${activePanel === 'amount' ? 'focused' : ''}`}
                onClick={() => {
                  setActivePanel('amount');
                  if (amountInputRef.current) amountInputRef.current.focus();
                }}
              >
                <label htmlFor="transaction-amount-input" className="field-label">{t('formAmount')}</label>
                <div className="amount-input-wrapper">
                  <span className="currency-prefix">{getCurrency(appCurrency).symbol}</span>
                  <input
                    id="transaction-amount-input"
                    ref={amountInputRef}
                    type="text"
                    inputMode="numeric"
                    className="native-amount-input"
                    placeholder="0"
                    value={amountVal}
                    onChange={handleAmountChange}
                    aria-label="Jumlah Transaksi"
                    onFocus={() => setActivePanel('amount')}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAdvanceFromAmount();
                      }
                    }}
                  />
                </div>
              </div>

              {/* Category Row (Expense & Income) */}
              <div
                className={`form-row clickable ${activePanel === 'category' ? 'focused' : ''}`}
                onClick={() => {
                  setActivePanel('category');
                  if (document.activeElement) document.activeElement.blur();
                }}
              >
                <span className="field-label">{t('formCategory')}</span>
                <div className="field-value-category">
                  <div className="cat-chip">
                    {resolveIcon(selectedCategory) && (
                      <img src={resolveIcon(selectedCategory)} alt={selectedCategory.name} className="cat-chip-icon" />
                    )}
                    <span>{getCategoryName(selectedCategory, appLanguage)}</span>
                  </div>
                </div>
              </div>

              {/* Account Row */}
              <div
                className={`form-row clickable ${activePanel === 'account' ? 'focused' : ''}`}
                onClick={() => {
                  setActivePanel('account');
                  if (document.activeElement) document.activeElement.blur();
                }}
              >
                <span className="field-label">{t('formAccount')}</span>
                <div className="field-value-category">
                  <div className="cat-chip">
                    <AccountIconBadge accountName={account} size={18} />
                    <span>{account}</span>
                  </div>
                </div>
              </div>

              {/* Note Row */}
              <div
                className={`form-row input-row note-row-relative ${activePanel === 'note' ? 'focused' : ''}`}
                onClick={() => {
                  setActivePanel('note');
                  if (noteInputRef.current) noteInputRef.current.focus();
                }}
              >
                <label htmlFor="transaction-note-input" className="field-label">{t('formNote')}</label>
                <div className="note-input-wrapper">
                  <input
                    id="transaction-note-input"
                    ref={noteInputRef}
                    type="text"
                    className="note-input"
                    placeholder=""
                    value={note}
                    onChange={(e) => {
                      setNote(e.target.value);
                      setIsNoteSuggestionsOpen(e.target.value.trim().length > 0);
                    }}
                    aria-label="Catatan Transaksi"
                    onFocus={() => {
                      setActivePanel('note');
                      if (note.trim().length > 0) {
                        setIsNoteSuggestionsOpen(true);
                      }
                    }}
                    onBlur={() => {
                      // Delay closing slightly so item click event can register first
                      setTimeout(() => {
                        setIsNoteSuggestionsOpen(false);
                      }, 200);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleSaveTransaction();
                      }
                    }}
                  />
                </div>

                {/* Floating History Popover Overlay */}
                {activePanel === 'note' && isNoteSuggestionsOpen && note.trim().length > 0 && (
                  (() => {
                    const actualHistory = Array.from(
                      new Set(
                        transactions
                          .map(t => t.title)
                          .filter(title => title && title.trim().length > 0)
                      )
                    );

                    const matchingItems = actualHistory.filter(item =>
                      item.toLowerCase().includes(note.toLowerCase().trim())
                    );

                    if (matchingItems.length === 0) return null;

                    return (
                      <div className="floating-note-popover">
                        {matchingItems.slice(0, 6).map((item, idx) => {
                          const searchLower = note.toLowerCase().trim();
                          const itemLower = item.toLowerCase();
                          const matchIndex = itemLower.indexOf(searchLower);

                          let prefix = item;
                          let match = '';
                          let suffix = '';

                          if (searchLower && matchIndex !== -1) {
                            prefix = item.slice(0, matchIndex);
                            match = item.slice(matchIndex, matchIndex + searchLower.length);
                            suffix = item.slice(matchIndex + searchLower.length);
                          }

                          return (
                            <div
                              key={idx}
                              className="floating-note-item"
                              onClick={(e) => {
                                e.stopPropagation();
                                setNote(item);
                                setIsNoteSuggestionsOpen(false);
                                if (noteInputRef.current) noteInputRef.current.focus();
                              }}
                            >
                              <span>
                                {prefix}
                                <span className="highlight-match">{match}</span>
                                {suffix}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()
                )}
              </div>

              {/* Save Button for Expense & Income */}
              <div className="note-save-container">
                <button
                  type="button"
                  className={`save-btn-dynamic ${transType === 'Expense' ? 'save-red' : transType === 'Income' ? 'save-green' : 'save-blue'}`}
                  onClick={handleSaveTransaction}
                >
                  {t('formSave')}
                </button>
              </div>
            </div>
          )}

              {/* Category Selector Sheet when Category is active */}
              {activePanel === 'category' && (
                <div className="panel-category-full tour-target-form-category">
                  <div className="panel-sub-header">
                    <span className="panel-title">{t('formCategory')}</span>
                    <div className="panel-header-actions">
                      <button
                        type="button"
                        className={`header-action-btn ${isCustomCat ? 'active' : ''}`}
                        onClick={() => setIsCustomCat(!isCustomCat)}
                        title="Tulis Kategori Sendiri"
                        aria-label="Edit custom category"
                      >
                        ✏️
                      </button>
                      <button
                        type="button"
                        className="header-action-btn close-btn"
                        onClick={() => setActivePanel('account')}
                        title={t('close')}
                        aria-label="Close category panel"
                      >
                        ✕
                      </button>
                    </div>
                  </div>

                  {isCustomCat && (
                    <div className="custom-cat-wrapper">
                      <input
                        type="text"
                        className="custom-cat-input"
                        placeholder={t('formCustomCat')}
                        value={customCatInput}
                        onChange={(e) => setCustomCatInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddCustomCategory();
                          }
                        }}
                        autoFocus
                      />
                      <button type="button" className="add-cat-btn" onClick={handleAddCustomCategory}>
                        + {t('add')}
                      </button>
                    </div>
                  )}

                  <div className="category-grid">
                    {(transType === 'Expense' ? sortedExpenseCategories : sortedIncomeCategories).map((cat, idx) => {
                      const catIcon = resolveIcon(cat);
                      const showLastBadge = !dismissedLastBadge && idx === 0 && transactions && transactions.length > 0;
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          className={`cat-grid-item ${selectedCategory.id === cat.id ? 'active' : ''} ${!catIcon ? 'text-only' : ''} ${showLastBadge ? 'has-last-badge' : ''}`}
                          onClick={() => handleSelectCategory(cat)}
                        >
                          {showLastBadge && (
                            <span className="last-used-badge" title="Kategori paling sering / terakhir digunakan">
                              Terakhir
                            </span>
                          )}
                          {catIcon ? (
                            <div className={`cat-grid-icon ${cat.iconClass}`}>
                              <img src={catIcon} alt={cat.name} />
                            </div>
                          ) : null}
                          <span className="cat-grid-label">{getCategoryName(cat, appLanguage)}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Account Selector Sheet when Account is active */}
              {activePanel === 'account' && (
                <div className="panel-category-full tour-target-form-account">
                  <div className="panel-sub-header">
                    <span className="panel-title">{t('formAccount')}</span>
                    <div className="panel-header-actions">
                      <button
                        type="button"
                        className={`header-action-btn undo-btn ${deletedAccountsHistory.length > 0 ? 'enabled' : 'disabled'}`}
                        onClick={handleUndoDeleteAccount}
                        disabled={deletedAccountsHistory.length === 0}
                        title="Batalkan Hapus Akun"
                        aria-label="Undo delete account"
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                          <path d="M3 3v5h5" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        className={`header-action-btn minus-btn tour-target-form-minus ${isAccountDeleteMode ? 'active' : ''}`}
                        onClick={() => {
                          setIsAccountDeleteMode(!isAccountDeleteMode);
                          if (isCustomAccount) setIsCustomAccount(false);
                        }}
                        title={isAccountDeleteMode ? "Selesai Hapus" : "Mode Hapus Akun"}
                        aria-label="Toggle delete mode"
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                          <line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                      </button>
                  <button
                    type="button"
                    className={`header-action-btn ${isCustomAccount ? 'active' : ''}`}
                    onClick={() => {
                      setIsCustomAccount(!isCustomAccount);
                      if (isAccountDeleteMode) setIsAccountDeleteMode(false);
                    }}
                    title="Tulis Akun Sendiri"
                    aria-label="Edit custom account"
                  >
                    ✏️
                  </button>
                  <button
                    type="button"
                    className="header-action-btn close-btn"
                    onClick={() => {
                      setIsAccountDeleteMode(false);
                      setActivePanel('note');
                    }}
                    title={t('close')}
                    aria-label="Close account panel"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {isCustomAccount && (
                <div className="custom-cat-wrapper">
                  <input
                    type="text"
                    className="custom-cat-input"
                    placeholder={t('formCustomAcc')}
                    value={customAccountInput}
                    onChange={(e) => setCustomAccountInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddCustomAccount();
                      }
                    }}
                    autoFocus
                  />
                  <button type="button" className="add-cat-btn" onClick={handleAddCustomAccount}>
                    + {t('add')}
                  </button>
                </div>
              )}

              <div className="category-grid">
                {sortedAccountsList.map((acc, idx) => {
                  const showLastBadge = !dismissedLastBadge && idx === 0 && transactions && transactions.length > 0;
                  const isCash = acc.toLowerCase() === 'cash';
                  return (
                    <button
                      key={acc}
                      type="button"
                      className={`cat-grid-item account-grid-item ${account === acc ? 'active' : ''} ${showLastBadge ? 'has-last-badge' : ''} ${isAccountDeleteMode && !isCash ? 'in-delete-mode' : ''}`}
                      onClick={() => {
                        if (isAccountDeleteMode && !isCash) {
                          handleDeleteAccount(acc);
                        } else {
                          handleSelectAccount(acc);
                        }
                      }}
                    >
                      {isAccountDeleteMode && !isCash && (
                        <span 
                          className="account-delete-pill"
                          onClick={(e) => handleDeleteAccount(acc, e)}
                          title={`Hapus ${acc}`}
                          aria-label={`Hapus ${acc}`}
                        >
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="3.5" strokeLinecap="round">
                            <line x1="4" y1="12" x2="20" y2="12" />
                          </svg>
                        </span>
                      )}
                      {!isAccountDeleteMode && showLastBadge && (
                        <span className="last-used-badge" title="Akun paling sering / terakhir digunakan">
                          Terakhir
                        </span>
                      )}
                      <div className="cat-grid-icon account-badge-icon">
                        <AccountIconBadge accountName={acc} size={36} />
                      </div>
                      <span className="cat-grid-label">{acc}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Onboarding Welcome Setup Modal (Full-Page Screen untuk Pengguna Baru) */}
      {isProfileModalOpen && !isProfileSetupDone && !profileName && (
        <div className="modal-overlay profile-setup-overlay full-page-profile-screen">
          <div className="wa-profile-screen-container">
            {/* Top Bar Header (Strictly 1 Single Line) */}
            <div className="wa-profile-top-header" style={{ padding: '20px 14px 12px 14px', justifyContent: 'center' }}>
              <h3 className="onboarding-single-line-title">
                {tempName.trim() ? (
                  <>
                    <span className="onboarding-amoresa-username">
                      {tempName.trim()}
                    </span>
                    <span className="onboarding-comma-space">, </span>
                    <span className="onboarding-welcome-suffix-text">
                      {t('onboardingWelcomeSuffix')}
                    </span>
                  </>
                ) : (
                  <span className="onboarding-welcome-suffix-text">
                    {t('onboardingWelcome')}
                  </span>
                )}
              </h3>
            </div>

            <div className="wa-profile-scroll-body" style={{ gap: '22px' }}>
              {/* Avatar Picker Circle */}
              <div className="profile-avatar-picker-wrapper" style={{ marginTop: '8px' }}>
                <div
                  className="profile-avatar-picker-circle"
                  onClick={() => profileFileInputRef.current && profileFileInputRef.current.click()}
                  title="Klik untuk memilih foto profil"
                >
                  {tempProfileImage ? (
                    <img src={tempProfileImage} alt="Foto Profil" className="profile-picker-img" />
                  ) : (
                    <span className="profile-picker-initial">
                      {(tempName.trim() || 'N').charAt(0).toUpperCase()}
                    </span>
                  )}
                  <div className="profile-camera-badge">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                      <circle cx="12" cy="13" r="4"/>
                    </svg>
                  </div>
                </div>
                <span className="profile-picker-hint">Tekan foto untuk memilih dari galeri</span>
                <input
                  ref={profileFileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden-file-input"
                  onChange={handleSelectFile}
                />
              </div>

              {/* Name Input Field */}
              <div className="profile-field-group">
                <label className="profile-field-label">Nama Lengkap / Panggilan</label>
                <input
                  type="text"
                  className="profile-name-input"
                  placeholder="Ketik nama panggilan Anda..."
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && tempName.trim()) handleSaveProfile();
                  }}
                />
              </div>

              {/* Language Selection Dropdown for Beginners */}
              <div className="profile-field-group">
                <label className="profile-field-label">Pilih Bahasa Aplikasi</label>
                <div className="onboarding-lang-dropdown">
                  <div
                    className={`onboarding-lang-trigger ${isOnboardingLangOpen ? 'open' : ''}`}
                    onClick={() => setIsOnboardingLangOpen(!isOnboardingLangOpen)}
                  >
                    <span className="onboarding-lang-current-name">
                      {LANGUAGES.find(l => l.code === tempLanguage)?.nativeName || 'Bahasa Indonesia'}
                    </span>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={`onboarding-lang-chevron ${isOnboardingLangOpen ? 'open' : ''}`}>
                      <polyline points="6 9 12 15 18 9"/>
                    </svg>
                  </div>

                  {/* Dropdown Menu Options */}
                  {isOnboardingLangOpen && (
                    <div className="onboarding-lang-menu">
                      {LANGUAGES.map(l => (
                        <div
                          key={l.code}
                          className={`onboarding-lang-option ${tempLanguage === l.code ? 'active' : ''}`}
                          onClick={() => {
                            setTempLanguage(l.code);
                            setIsOnboardingLangOpen(false);
                          }}
                        >
                          <span className="onboarding-lang-opt-name">{l.nativeName}</span>
                          {tempLanguage === l.code && (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2D5284" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" className="onboarding-lang-check">
                              <polyline points="20 6 9 17 4 12"/>
                            </svg>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Submit Button (Locked if Name is Empty) */}
              <div style={{ marginTop: '10px' }}>
                <button
                  type="button"
                  className={`profile-save-btn ${!tempName.trim() ? 'disabled-btn' : ''}`}
                  onClick={() => {
                    if (tempName.trim()) handleSaveProfile();
                  }}
                  disabled={!tempName.trim()}
                >
                  {t('onboardingStartBtn') || 'Mari Mulai Bersama ✨'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Full Page WhatsApp Style Profile Screen (Untuk user terdaftar) */}
      {isProfileModalOpen && (isProfileSetupDone || Boolean(profileName)) && (
        <div className="modal-overlay profile-setup-overlay full-page-profile-screen">
          <div className="wa-profile-screen-container">
            {/* Top Bar Header */}
            <div className="wa-profile-top-header">
              <button
                type="button"
                className="back-btn"
                onClick={() => {
                  if (isEditingName) handleSaveInlineName();
                  setIsProfileModalOpen(false);
                }}
                aria-label="Kembali"
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 12H5M12 19l-7-7 7-7"/>
                </svg>
              </button>
              <h3 className="profile-modal-title">{t('profileSettings')}</h3>
              <div style={{ width: '32px' }}></div>
            </div>

            <div className="wa-profile-scroll-body">
              {/* Avatar Section */}
              <div className="wa-profile-hero-section">
                <div
                  className="wa-profile-avatar-circle"
                  onClick={() => profileFileInputRef.current && profileFileInputRef.current.click()}
                  title="Ganti Foto Profil"
                >
                  {profileImage ? (
                    <img src={profileImage} alt="Foto Profil" className="wa-avatar-img" />
                  ) : (
                    <span className="wa-avatar-initial">
                      {(profileName.trim() || 'P').charAt(0).toUpperCase()}
                    </span>
                  )}
                  <div className="wa-avatar-camera-btn">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                      <circle cx="12" cy="13" r="4"/>
                    </svg>
                  </div>
                </div>

                <input
                  ref={profileFileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden-file-input"
                  onChange={handleSelectFile}
                />

                {/* Name section with inline edit */}
                <div className="wa-name-wrapper">
                  {isEditingName ? (
                    <div className="wa-name-inline-edit">
                      <input
                        type="text"
                        className="wa-name-edit-input"
                        value={tempName}
                        onChange={(e) => setTempName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveInlineName();
                        }}
                        autoFocus
                      />
                      <button
                        type="button"
                        className="wa-name-save-icon-btn"
                        onClick={handleSaveInlineName}
                        title="Simpan Nama"
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <div className="wa-name-display-row" onClick={() => { setTempName(profileName); setIsEditingName(true); }}>
                      <span className="wa-profile-name-text">{profileName}</span>
                      <button type="button" className="wa-edit-pen-btn" title="Ubah Nama">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Direct Seamless Background Profile Menu Layout */}
              <div className="wa-settings-menu-group">

                {/* ========================================================
                    1. NOTIFIKASI (Paling Atas dengan Toggle Switch)
                   ======================================================== */}
                <h4 className="wa-profile-section-title">{t('sectionNotif') || 'NOTIFIKASI'}</h4>

                <div 
                  className="wa-menu-item"
                  onClick={async () => {
                    const nextState = await toggleNotificationState(isNotifActive);
                    setIsNotifActive(nextState);
                    if (nextState) {
                      sendInstantNotification(profileName, transactions, appLanguage);
                    }
                  }}
                >
                  <div className="wa-menu-icon-box notif-icon">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                      <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                    </svg>
                  </div>
                  <div className="wa-menu-content">
                    <div className="wa-menu-title-row">
                      <span className="wa-menu-title">{t('notifSettingTitle') || 'Notifikasi Harian'}</span>
                    </div>
                    <span className="wa-menu-subtitle">{t('notifSettingSubtitle') || 'Pengingat pencatatan & analisis'}</span>
                  </div>
                  <div className={`wa-custom-toggle-track ${isNotifActive ? 'active' : ''}`}>
                    <div className="wa-custom-toggle-thumb" />
                  </div>
                </div>

                {/* Notifikasi Auto-Tracker (M-Banking & E-Wallet) */}
                <div 
                  className="wa-menu-item tour-target-auto-tracker"
                  onClick={async () => {
                    if (!isAutoTrackerActive) {
                      // Cek izin akses notifikasi
                      try {
                        const { granted } = await NotificationTracker.checkPermission();
                        if (!granted) {
                          showVoiceToast('Buka izin akses notifikasi untuk mengaktifkan');
                          await NotificationTracker.requestPermission();
                          return;
                        }
                      } catch (err) {
                        console.warn('Native notification check failed:', err);
                      }
                      safeStorageSet('user_auto_tracker_active', true);
                      setIsAutoTrackerActive(true);
                      await NotificationTracker.setAutoTrackerEnabled({ enabled: true }).catch(() => {});
                      showVoiceToast('✨ Pelacak otomatis aktif');
                    } else {
                      safeStorageSet('user_auto_tracker_active', false);
                      setIsAutoTrackerActive(false);
                      await NotificationTracker.setAutoTrackerEnabled({ enabled: false }).catch(() => {});
                      showVoiceToast('Pelacak otomatis dinonaktifkan');
                    }
                  }}
                >
                  <div className="wa-menu-icon-box" style={{ background: '#EEF2FF', color: '#4F46E5' }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
                      <line x1="1" y1="10" x2="23" y2="10"/>
                    </svg>
                  </div>
                  <div className="wa-menu-content">
                    <div className="wa-menu-title-row">
                      <span className="wa-menu-title">{t('notifAutoTrackerTitle') || 'Notifikasi Auto-Tracker'}</span>
                    </div>
                    <span className="wa-menu-subtitle">{t('notifAutoTrackerSubtitle') || 'Pelacak transaksi M-Banking & E-Wallet'}</span>
                  </div>
                  <div className={`wa-custom-toggle-track ${isAutoTrackerActive ? 'active' : ''}`}>
                    <div className="wa-custom-toggle-thumb" />
                  </div>
                </div>

                {/* ========================================================
                    2. TAMPILAN & PREFERENSI (Posisi No. 2)
                   ======================================================== */}
                <h4 className="wa-profile-section-title">{t('sectionPrefs') || 'TAMPILAN & PREFERENSI'}</h4>

                {/* Bahasa dengan ikon karakter translate 文A */}
                <div className="wa-menu-item tour-target-language" onClick={handleOpenLangModal}>
                  <div className="wa-menu-icon-box lang-icon">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 8l6 0" />
                      <path d="M4 14l6-6 2 2-3 4" />
                      <path d="M2 5h12" />
                      <path d="M7 2h1" />
                      <path d="M22 22l-5-10-5 10" />
                      <path d="M14 18h6" />
                    </svg>
                  </div>
                  <div className="wa-menu-content">
                    <div className="wa-menu-title-row">
                      <span className="wa-menu-title">{t('langSettingTitle') || 'Bahasa'}</span>
                    </div>
                    <span className="wa-menu-subtitle">
                      {LANGUAGES.find(l => l.code === appLanguage)?.name || 'Bahasa Indonesia'}
                    </span>
                  </div>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="wa-menu-chevron">
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
                </div>

                {/* Gaya Tulisan */}
                <div className="wa-menu-item" onClick={handleOpenFontModal}>
                  <div className="wa-menu-icon-box font-icon">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="4 7 4 4 20 4 20 7"/>
                      <line x1="9" y1="20" x2="15" y2="20"/>
                      <line x1="12" y1="4" x2="12" y2="20"/>
                    </svg>
                  </div>
                  <div className="wa-menu-content">
                    <div className="wa-menu-title-row">
                      <span className="wa-menu-title">{t('fontSettingTitle') || 'Gaya Tulisan'}</span>
                    </div>
                    <span className="wa-menu-subtitle">
                      {FONTS.find(f => f.id === appFont)?.name || 'Lora'}
                    </span>
                  </div>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="wa-menu-chevron">
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
                </div>

                {/* Ukuran Font */}
                <div className="wa-menu-item" onClick={handleOpenFontSizeModal}>
                  <div className="wa-menu-icon-box font-size-icon">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 7V5h10v2" />
                      <path d="M8 5v14" />
                      <path d="M6 19h4" />
                      <path d="M15 12v-1h6v1" />
                      <path d="M18 11v8" />
                      <path d="M16 19h4" />
                    </svg>
                  </div>
                  <div className="wa-menu-content">
                    <div className="wa-menu-title-row">
                      <span className="wa-menu-title">{t('fontSizeSettingTitle') || 'Ukuran Font'}</span>
                    </div>
                    <span className="wa-menu-subtitle">
                      {(() => {
                        const currentSize = FONT_SIZES.find(s => s.id === appFontSize);
                        return currentSize ? (currentSize.id === 'default' ? 'Default' : currentSize.name) : 'Default';
                      })()}
                    </span>
                  </div>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="wa-menu-chevron">
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
                </div>

                {/* Currency / Mata Uang */}
                <div className="wa-menu-item" onClick={handleOpenCurrencyModal}>
                  <div className="wa-menu-icon-box currency-icon">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"/>
                      <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/>
                      <path d="M12 6v2"/>
                      <path d="M12 16v2"/>
                    </svg>
                  </div>
                  <div className="wa-menu-content">
                    <div className="wa-menu-title-row">
                      <span className="wa-menu-title">{t('currencySettingTitle') || 'Currency'}</span>
                    </div>
                    <span className="wa-menu-subtitle">
                      {(() => {
                        const cur = getCurrency(appCurrency);
                        return `${cur.code} (${cur.symbol}) • ${cur.displayName}`;
                      })()}
                    </span>
                  </div>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="wa-menu-chevron">
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
                </div>

                {/* ========================================================
                    3. KEAMANAN (Posisi No. 3)
                   ======================================================== */}
                <h4 className="wa-profile-section-title">{t('sectionSecurity') || 'KEAMANAN'}</h4>

                {/* Atur PIN / Ubah PIN */}
                <div className="wa-menu-item" onClick={() => setIsPinSetupModalOpen(true)}>
                  <div className="wa-menu-icon-box pin-menu-icon">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                  </div>
                  <div className="wa-menu-content">
                    <div className="wa-menu-title-row">
                      <span className="wa-menu-title">
                        {userHasPin ? t('changePinTitle') : t('setPinTitle')}
                      </span>
                    </div>
                    <span className="wa-menu-subtitle">{t('pinSettingSubtitle')}</span>
                  </div>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="wa-menu-chevron">
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
                </div>

                {/* Sidik Jari & PIN Untuk Login (Toggle Switch) */}
                <div
                  className="wa-menu-item wa-menu-item-toggle"
                  onClick={async () => {
                    if (!userHasPin) {
                      showVoiceToast(t('setPinFirstPrompt'));
                      setIsPinSetupModalOpen(true);
                      return;
                    }
                    const nextVal = !isLockEnabled;
                    setAppLockEnabled(nextVal);
                    setIsLockEnabled(nextVal);
                    setBiometricEnabled(nextVal);
                    setIsBiometricActive(nextVal);
                  }}
                >
                  <div className="wa-menu-icon-box fingerprint-menu-icon">
                    <img src={fingerprintSvg} alt="Fingerprint" width="22" height="22" style={{ objectFit: 'contain' }} />
                  </div>
                  <div className="wa-menu-content">
                    <div className="wa-menu-title-row">
                      <span className="wa-menu-title">{t('fingerprintLoginTitle')}</span>
                    </div>
                    <span className="wa-menu-subtitle">{t('fingerprintLoginSubtitle')}</span>
                  </div>
                  <div className={`wa-custom-toggle-track ${isLockEnabled ? 'active' : ''}`}>
                    <div className="wa-custom-toggle-thumb" />
                  </div>
                </div>

                {/* ========================================================
                    4. DATA & DUKUNGAN
                   ======================================================== */}
                <h4 className="wa-profile-section-title">{t('sectionDataSupport') || 'DATA & DUKUNGAN'}</h4>

                {/* Panduan Aplikasi */}
                <div className="wa-menu-item" onClick={handleOpenFullGuide}>
                  <div className="wa-menu-icon-box" style={{ background: '#EEF2FF', color: '#4F46E5' }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"/>
                      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
                      <line x1="12" y1="17" x2="12.01" y2="17"/>
                    </svg>
                  </div>
                  <div className="wa-menu-content">
                    <div className="wa-menu-title-row">
                      <span className="wa-menu-title">{t('tourAppGuideTitle') || 'Panduan Aplikasi'}</span>
                    </div>
                    <span className="wa-menu-subtitle">{t('tourAppGuideSubtitle') || 'Pelajari alur dan fitur-fitur utama Cassiel'}</span>
                  </div>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="wa-menu-chevron">
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
                </div>

                {/* Data & Cadangan */}
                <div className="wa-menu-item tour-target-backup" onClick={() => setIsBackupModalOpen(true)}>
                  <div className="wa-menu-icon-box backup-icon">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9z"/>
                      <polyline points="12 13 12 7"/>
                      <polyline points="9 10 12 7 15 10"/>
                    </svg>
                  </div>
                  <div className="wa-menu-content">
                    <div className="wa-menu-title-row">
                      <span className="wa-menu-title">{t('backupSettingTitle') || 'Data & Cadangan'}</span>
                    </div>
                    <span className="wa-menu-subtitle">{t('backupSettingSubtitle') || 'Simpan dan pulihkan catatan transaksi'}</span>
                  </div>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="wa-menu-chevron">
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
                </div>

                {/* ========================================================
                    5. LAINNYA
                   ======================================================== */}
                <h4 className="wa-profile-section-title">LAINNYA</h4>

                {/* Saran & Masukan */}
                <div className="wa-menu-item" onClick={() => setIsFeedbackModalOpen(true)}>
                  <div className="wa-menu-icon-box feedback-icon">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                    </svg>
                  </div>
                  <div className="wa-menu-content">
                    <div className="wa-menu-title-row">
                      <span className="wa-menu-title">{t('feedbackTitle') || 'Saran & Keluh Kesah'}</span>
                    </div>
                    <span className="wa-menu-subtitle">{t('feedbackSubtitle') || 'Kirim masukan untuk pengembangan Cassiel'}</span>
                  </div>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="wa-menu-chevron">
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
                </div>

                {/* FAQ */}
                <div className="wa-menu-item" onClick={() => showVoiceToast('Fitur FAQ akan segera hadir!')}>
                  <div className="wa-menu-icon-box" style={{ background: 'transparent', color: '#2D2520' }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"/>
                      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
                      <line x1="12" y1="17" x2="12.01" y2="17"/>
                    </svg>
                  </div>
                  <div className="wa-menu-content">
                    <div className="wa-menu-title-row">
                      <span className="wa-menu-title">FAQ</span>
                    </div>
                    <span className="wa-menu-subtitle">Pertanyaan umum seputar penggunaan aplikasi</span>
                  </div>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="wa-menu-chevron">
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
                </div>

                {/* Tentang Cassiel */}
                <div className="wa-menu-item" onClick={() => showVoiceToast(`Cassiel v${CURRENT_VERSION_NAME}`)}>
                  <div className="wa-menu-icon-box" style={{ background: 'transparent', color: '#2D2520' }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                    </svg>
                  </div>
                  <div className="wa-menu-content">
                    <div className="wa-menu-title-row">
                      <span className="wa-menu-title">Tentang</span>
                    </div>
                    <span className="wa-menu-subtitle">Cassiel Finance Tracker</span>
                  </div>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="wa-menu-chevron">
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
                </div>

                {/* ========================================================
                    FOOTER: SOCIAL MEDIA INSTAGRAM & APP VERSION (Batas Akhir)
                   ======================================================== */}
                <div className="profile-footer-container">
                  <div className="profile-social-row">
                    <a 
                      href="https://www.instagram.com/redii_rm/" 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="profile-social-plain-btn"
                      title="Instagram @redii_rm"
                      aria-label="Instagram"
                    >
                      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
                      </svg>
                    </a>
                  </div>
                  <div className="profile-app-version-text">
                    Cassiel App ver {CURRENT_VERSION_NAME}
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      )}

      {/* Full-Page Screen: Pilihan Custom Font */}
      {isFontModalOpen && (
        <div className="modal-overlay profile-setup-overlay full-page-profile-screen">
          <div className="wa-profile-screen-container">
            {/* Top Bar Header */}
            <div className="wa-profile-top-header">
              <button
                type="button"
                className="back-btn"
                onClick={() => setIsFontModalOpen(false)}
                aria-label="Kembali"
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 12H5M12 19l-7-7 7-7"/>
                </svg>
              </button>
              <h3 className="profile-modal-title">{t('selectFontTitle')}</h3>
              <button
                type="button"
                className="header-confirm-btn"
                onClick={() => {
                  handleSelectFont(tempFont);
                  setIsFontModalOpen(false);
                }}
                title="Konfirmasi Pilihan Font"
                aria-label="Konfirmasi"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </button>
            </div>

            <div className="full-page-sub-body">
              <div className="full-page-settings-group">
                {FONTS.map(f => (
                  <div
                    key={f.id}
                    className={`full-page-option-row ${tempFont === f.id ? 'selected' : ''}`}
                    onClick={() => setTempFont(f.id)}
                  >
                    <span className="full-page-option-title" style={{ fontFamily: f.fontFamily, fontSize: f.id === 'amoresa' ? '24px' : '16px' }}>
                      {f.name}
                    </span>
                    {tempFont === f.id && (
                      <div className="full-page-option-check">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Full-Page Screen: Pilihan Ukuran Font */}
      {isFontSizeModalOpen && (
        <div className="modal-overlay profile-setup-overlay full-page-profile-screen">
          <div className="wa-profile-screen-container">
            {/* Top Bar Header */}
            <div className="wa-profile-top-header">
              <button
                type="button"
                className="back-btn"
                onClick={() => setIsFontSizeModalOpen(false)}
                aria-label="Kembali"
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 12H5M12 19l-7-7 7-7"/>
                </svg>
              </button>
              <h3 className="profile-modal-title">{t('selectFontSizeTitle')}</h3>
              <button
                type="button"
                className="header-confirm-btn"
                onClick={() => {
                  handleSelectFontSize(tempFontSize);
                  setIsFontSizeModalOpen(false);
                }}
                title="Konfirmasi Pilihan Ukuran Font"
                aria-label="Konfirmasi"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </button>
            </div>

            <div className="full-page-sub-body">
              <div className="full-page-settings-group">
                {FONT_SIZES.map(s => (
                  <div
                    key={s.id}
                    className={`full-page-option-row ${tempFontSize === s.id ? 'selected' : ''}`}
                    onClick={() => setTempFontSize(s.id)}
                  >
                    <span className="full-page-option-title" style={{ fontSize: s.sizePt }}>
                      {s.name}
                    </span>
                    {tempFontSize === s.id && (
                      <div className="full-page-option-check">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Full-Page Screen: Pilihan Multi Bahasa */}
      {isLangModalOpen && (
        <div className="modal-overlay profile-setup-overlay full-page-profile-screen">
          <div className="wa-profile-screen-container">
            {/* Top Bar Header */}
            <div className="wa-profile-top-header">
              <button
                type="button"
                className="back-btn"
                onClick={() => setIsLangModalOpen(false)}
                aria-label="Kembali"
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 12H5M12 19l-7-7 7-7"/>
                </svg>
              </button>
              <h3 className="profile-modal-title">{t('selectLangTitle')}</h3>
              <button
                type="button"
                className="header-confirm-btn"
                onClick={() => {
                  handleSelectLanguage(tempLanguage);
                  setIsLangModalOpen(false);
                }}
                title="Konfirmasi Pilihan Bahasa"
                aria-label="Konfirmasi"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </button>
            </div>

            <div className="full-page-sub-body">
              <div className="full-page-settings-group">
                {LANGUAGES.map(l => (
                  <div
                    key={l.code}
                    className={`full-page-option-row ${tempLanguage === l.code ? 'selected' : ''}`}
                    onClick={() => setTempLanguage(l.code)}
                  >
                    <span className="full-page-option-title">
                      {l.name}
                    </span>
                    {tempLanguage === l.code && (
                      <div className="full-page-option-check">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Full-Page Screen: Pilihan Mata Uang Utama (Real-time Kurs 1 Dunia) */}
      {isCurrencyModalOpen && (
        <div className="modal-overlay profile-setup-overlay full-page-profile-screen">
          <div className="wa-profile-screen-container">
            {/* Top Bar Header */}
            <div className="wa-profile-top-header">
              <button
                type="button"
                className="back-btn"
                onClick={() => setIsCurrencyModalOpen(false)}
                aria-label="Kembali"
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 12H5M12 19l-7-7 7-7"/>
                </svg>
              </button>
              <h3 className="profile-modal-title">{t('selectCurrencyTitle')}</h3>
              <button
                type="button"
                className="header-confirm-btn"
                onClick={() => {
                  handleSelectCurrency(tempCurrency);
                  setIsCurrencyModalOpen(false);
                }}
                title="Konfirmasi Pilihan Mata Uang"
                aria-label="Konfirmasi"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </button>
            </div>

            {/* Fixed Search Bar Header (Outside Scroll Body) */}
            <div className="currency-fixed-search-header">
              <div className="currency-search-container">
                <svg className="currency-search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"/>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                <input
                  type="text"
                  className="currency-search-input"
                  placeholder={t('searchCurrencyPlaceholder')}
                  value={currencySearch}
                  onChange={(e) => setCurrencySearch(e.target.value)}
                />
                {currencySearch && (
                  <button
                    type="button"
                    className="currency-search-clear-btn"
                    onClick={() => setCurrencySearch('')}
                    aria-label="Clear Search"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18"/>
                      <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {/* Scrollable Currency List */}
            <div className="full-page-sub-body currency-scroll-body">
              <div className="full-page-settings-group">
                {filteredCurrencies.map((cur) => {
                  const isSelected = tempCurrency === cur.code;
                  const rateInfo = getExchangeRateText(cur.code, liveExchangeRates);
                  return (
                    <div
                      key={cur.code}
                      className={`full-page-option-row currency-option-row ${isSelected ? 'selected' : ''}`}
                      onClick={() => setTempCurrency(cur.code)}
                    >
                      <div className="currency-option-left">
                        <img
                          src={getFlagUrl(cur.countryCode)}
                          alt={cur.displayName}
                          className="currency-flag-img"
                          loading="lazy"
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                        <div className="currency-info-box">
                          <div className="currency-code-symbol">
                            <span>{cur.code}</span>
                            <span className="currency-symbol-tag">{cur.symbol}</span>
                          </div>
                          <span className="currency-country-name">
                            {cur.displayName}
                          </span>
                          {rateInfo && (
                            <span className="currency-rate-badge">{rateInfo}</span>
                          )}
                        </div>
                      </div>
                      {isSelected && (
                        <div className="full-page-option-check">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12"/>
                          </svg>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Full-Page Screen / Bottom Sheet: Sesuaikan Akun Generik Lama */}
      {adjustingAccount && (
        <div className="modal-overlay profile-setup-overlay full-page-profile-screen" style={{ zIndex: 1100000 }}>
          <div className="wa-profile-screen-container">
            {/* Top Bar Header */}
            <div className="wa-profile-top-header">
              <button
                type="button"
                className="back-btn"
                onClick={() => setAdjustingAccount(null)}
                aria-label="Kembali"
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 12H5M12 19l-7-7 7-7"/>
                </svg>
              </button>
              <h3 className="profile-modal-title">{t('adjustAccountTitle') || 'Sesuaikan Akun'}</h3>
            </div>

            <div className="full-page-sub-body">
              <div className="adjust-account-container">
                <div className="adjust-account-banner">
                  <div className="adjust-account-current-badge">
                    <AccountIconBadge accountName={adjustingAccount} size={38} />
                    <div>
                      <span className="adjust-account-old-name">{adjustingAccount}</span>
                      <p className="adjust-account-old-desc">{t('adjustAccountSubtitle') || 'Ubah akun lama menjadi nama Bank atau E-Wallet resmi'}</p>
                    </div>
                  </div>
                  <p className="adjust-account-prompt-text">{t('adjustAccountPrompt') || 'Pilih Bank atau E-Wallet yang sesuai untuk menggantikan akun ini secara permanen:'}</p>
                </div>

                <div className="adjust-account-grid">
                  {DEFAULT_ACCOUNTS.filter(a => a.id !== 'cash').map((accItem) => (
                    <button
                      key={accItem.id}
                      type="button"
                      className="adjust-account-grid-item"
                      onClick={() => handleMigrateLegacyAccount(adjustingAccount, accItem.name)}
                    >
                      <div className="adjust-account-icon-wrap">
                        <AccountIconBadge accountName={accItem.name} size={36} />
                      </div>
                      <span className="adjust-account-name">{accItem.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Full-Page Screen: Saran & Keluh Kesah untuk Developer */}
      {isFeedbackModalOpen && (
        <div className="modal-overlay profile-setup-overlay full-page-profile-screen">
          <div className="wa-profile-screen-container">
            {/* Top Bar Header */}
            <div className="wa-profile-top-header">
              <button
                type="button"
                className="back-btn"
                onClick={() => setIsFeedbackModalOpen(false)}
                aria-label="Kembali"
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 12H5M12 19l-7-7 7-7"/>
                </svg>
              </button>
              <h3 className="profile-modal-title">{t('feedbackHeader')}</h3>
            </div>

            <div className="full-page-sub-body">
              <div className="full-page-feedback-container">
                <p className="feedback-helper-text">
                  {t('feedbackHelperText')}
                </p>

                {/* Category Chips */}
                <div className="feedback-category-chips">
                  {[
                    { id: 'Saran Fitur', label: t('feedbackCatIdea') },
                    { id: 'Keluh Kesah', label: t('feedbackCatGripe') },
                    { id: 'Masalah', label: t('feedbackCatBug') }
                  ].map(chip => (
                    <button
                      key={chip.id}
                      type="button"
                      className={`feedback-chip ${feedbackCategory === chip.id ? 'selected' : ''}`}
                      onClick={() => setFeedbackCategory(chip.id)}
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>

                {/* Message Textarea */}
                <div className="feedback-textarea-container" style={{ minHeight: '180px' }}>
                  <textarea
                    className="feedback-textarea"
                    style={{ height: '180px' }}
                    placeholder={t('feedbackInputPlaceholder')}
                    value={feedbackText}
                    onChange={e => setFeedbackText(e.target.value)}
                    autoFocus
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="button"
                  className="feedback-submit-btn"
                  disabled={isSubmittingFeedback || !feedbackText.trim()}
                  onClick={handleSubmitFeedback}
                >
                  {isSubmittingFeedback ? t('feedbackSending') : t('feedbackSubmitBtn')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Full-Page Screen: Backup & Restore */}
      {isBackupModalOpen && (
        <div className="modal-overlay profile-setup-overlay full-page-profile-screen">
          <div className="wa-profile-screen-container">
            {/* Top Bar Header */}
            <div className="wa-profile-top-header">
              <button
                type="button"
                className="back-btn"
                onClick={() => setIsBackupModalOpen(false)}
                aria-label="Kembali"
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 12H5M12 19l-7-7 7-7"/>
                </svg>
              </button>
              <h3 className="profile-modal-title">{t('backupModalTitle')}</h3>
              <div style={{ width: 40 }} />
            </div>

            <div className="full-page-sub-body">
              <div className="backup-container">
                {/* Last Backup Info */}
                <div className="backup-info-row">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.5 }}>
                    <circle cx="12" cy="12" r="10"/>
                    <polyline points="12 6 12 12 16 14"/>
                  </svg>
                  <span className="backup-info-text">
                    {t('backupInfoLabel')}: {(() => {
                      const lastBackup = safeStorageGet('user_last_backup_time');
                      if (!lastBackup) return t('backupNever');
                      try {
                        const d = new Date(lastBackup);
                        return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
                      } catch { return t('backupNever'); }
                    })()}
                  </span>
                </div>

                {/* Export Backup Card */}
                <button
                  type="button"
                  className="backup-action-card"
                  onClick={handleExportBackup}
                  disabled={isBackupProcessing}
                >
                  <div className="backup-action-icon export-icon">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9z"/>
                      <polyline points="12 13 12 7"/>
                      <polyline points="9 10 12 7 15 10"/>
                    </svg>
                  </div>
                  <div className="backup-action-content">
                    <span className="backup-action-title">{t('backupExportBtn')}</span>
                    <span className="backup-action-desc">{t('backupExportDesc')}</span>
                  </div>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
                </button>

                {/* Import / Restore Card */}
                <button
                  type="button"
                  className="backup-action-card"
                  onClick={handleImportBackup}
                  disabled={isBackupProcessing}
                >
                  <div className="backup-action-icon import-icon">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9z"/>
                      <polyline points="12 7 12 13"/>
                      <polyline points="9 10 12 13 15 10"/>
                    </svg>
                  </div>
                  <div className="backup-action-content">
                    <span className="backup-action-title">{t('backupImportBtn')}</span>
                    <span className="backup-action-desc">{t('backupImportDesc')}</span>
                  </div>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
                </button>

                {/* Processing Indicator */}
                {isBackupProcessing && (
                  <div className="backup-processing-row">
                    <div className="backup-spinner" />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Restore Confirmation Dialog */}
      {backupRestoreConfirm && (
        <div className="modal-overlay backup-confirm-overlay" onClick={() => setBackupRestoreConfirm(null)}>
          <div className="backup-confirm-card" onClick={(e) => e.stopPropagation()}>
            <div className="backup-confirm-icon-wrapper">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9z"/>
                <polyline points="12 7 12 13"/>
                <polyline points="9 10 12 13 15 10"/>
              </svg>
            </div>
            <h3 className="backup-confirm-title">{t('restoreConfirmTitle')}</h3>
            <p className="backup-confirm-meta">
              {backupRestoreConfirm._profileName && (
                <span>{backupRestoreConfirm._profileName}</span>
              )}
              {backupRestoreConfirm._exportedAt && (
                <span> • {(() => {
                  try {
                    const d = new Date(backupRestoreConfirm._exportedAt);
                    return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
                  } catch { return ''; }
                })()}</span>
              )}
              {backupRestoreConfirm.data?.transactions && (
                <span> • {backupRestoreConfirm.data.transactions.length} transaksi</span>
              )}
            </p>
            <p className="backup-confirm-text">{t('restoreConfirm')}</p>
            <div className="backup-confirm-actions">
              <button type="button" className="backup-cancel-btn" onClick={() => setBackupRestoreConfirm(null)}>
                {t('close') || 'Batal'}
              </button>
              <button type="button" className="backup-restore-btn" onClick={handleConfirmRestore}>
                {t('backupImportBtn')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full-screen Photo Cropper Modal (Matching Image 1 Reference Design) */}
      {isCropModalOpen && cropImageSrc && (
        <div className="full-screen-cropper-overlay">
          <div className="full-screen-cropper-container">
            {/* Image Viewport */}
            <div className="cropper-viewport">
              <div className="cropper-image-wrapper">
                <img
                  ref={cropImgRef}
                  src={cropImageSrc}
                  alt="Preview Crop"
                  className="cropper-target-img"
                  style={{
                    transform: `rotate(${cropRotation}deg)`
                  }}
                  draggable={false}
                />

                {/* 3x3 Grid Overlay (Draggable Vertical Box bounded within Image) */}
                <div 
                  className="cropper-grid-box"
                  style={{
                    transform: `translate(-50%, calc(-50% + ${cropOffset.y}px))`
                  }}
                  onMouseDown={(e) => {
                    setIsDraggingCrop(true);
                    setCropDragStart({ x: e.clientX, y: e.clientY - cropOffset.y });
                  }}
                  onMouseMove={(e) => {
                    if (!isDraggingCrop || !cropImgRef.current) return;
                    const displayedH = cropImgRef.current.clientHeight || 300;
                    const displayedW = cropImgRef.current.clientWidth || 300;
                    const gridSize = Math.min(displayedW, displayedH);
                    const maxDragY = Math.max(0, (displayedH - gridSize) / 2);

                    const rawY = e.clientY - cropDragStart.y;
                    const clampedY = Math.min(Math.max(-maxDragY, rawY), maxDragY);
                    setCropOffset({ x: 0, y: clampedY });
                  }}
                  onMouseUp={() => setIsDraggingCrop(false)}
                  onMouseLeave={() => setIsDraggingCrop(false)}
                  onTouchStart={(e) => {
                    if (e.touches.length === 1) {
                      setIsDraggingCrop(true);
                      setCropDragStart({ x: e.touches[0].clientX, y: e.touches[0].clientY - cropOffset.y });
                    }
                  }}
                  onTouchMove={(e) => {
                    if (isDraggingCrop && e.touches.length === 1 && cropImgRef.current) {
                      const displayedH = cropImgRef.current.clientHeight || 300;
                      const displayedW = cropImgRef.current.clientWidth || 300;
                      const gridSize = Math.min(displayedW, displayedH);
                      const maxDragY = Math.max(0, (displayedH - gridSize) / 2);

                      const rawY = e.touches[0].clientY - cropDragStart.y;
                      const clampedY = Math.min(Math.max(-maxDragY, rawY), maxDragY);
                      setCropOffset({ x: 0, y: clampedY });
                    }
                  }}
                  onTouchEnd={() => setIsDraggingCrop(false)}
                >
                  <div className="grid-line grid-v1" />
                  <div className="grid-line grid-v2" />
                  <div className="grid-line grid-h1" />
                  <div className="grid-line grid-h2" />

                  {/* Corner Markers */}
                  <div className="corner-bracket top-left" />
                  <div className="corner-bracket top-right" />
                  <div className="corner-bracket bottom-left" />
                  <div className="corner-bracket bottom-right" />
                </div>
              </div>
            </div>

            {/* Bottom Actions Toolbar */}
            <div className="cropper-bottom-bar">
              <button
                type="button"
                className="cropper-action-btn cancel-btn"
                onClick={() => setIsCropModalOpen(false)}
              >
                Cancel
              </button>

              <button
                type="button"
                className="cropper-action-btn rotate-btn"
                onClick={handleRotateCrop}
                title="Putar 90°"
                aria-label="Rotate Image"
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
                </svg>
              </button>

              <button
                type="button"
                className="cropper-action-btn done-btn"
                onClick={handleSaveCrop}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tap-to-Edit Category Budget Modal with Quick Chips (Solusi A) */}
      {activeBudgetCategory && (
        <div className="modal-overlay" style={{ zIndex: 1000000 }} onClick={() => setActiveBudgetCategory(null)}>
          <div className="budget-sheet-card" onClick={(e) => e.stopPropagation()}>
            <div className="budget-sheet-header">
              <div className="budget-sheet-cat-summary">
                <div className={`budget-item-icon-box ${activeBudgetCategory.iconClass}`}>
                  <img src={resolveIcon(activeBudgetCategory)} alt={activeBudgetCategory.name} />
                </div>
                <div>
                  <h3 className="budget-sheet-title">{activeBudgetCategory.name}</h3>
                  <p className="budget-sheet-subtitle">Atur batas maksimal pengeluaran per bulan</p>
                </div>
              </div>
              <button 
                type="button" 
                className="budget-sheet-close"
                onClick={() => setActiveBudgetCategory(null)}
              >
                ✕
              </button>
            </div>

            <div className="budget-sheet-body">
              {/* Quick Chips */}
              <label className="budget-sheet-label">Pilihan Nominal Cepat</label>
              <div className="budget-quick-chips">
                {[
                  { label: '100 Rb', val: 100000 },
                  { label: '250 Rb', val: 250000 },
                  { label: '500 Rb', val: 500000 },
                  { label: '1 Jt', val: 1000000 },
                  { label: '2 Jt', val: 2000000 },
                  { label: '5 Jt', val: 5000000 },
                ].map(chip => (
                  <button
                    key={chip.val}
                    type="button"
                    className={`budget-chip-btn ${budgetModalInputValue.replace(/\./g, '') === String(chip.val) ? 'selected' : ''}`}
                    onClick={() => {
                      setBudgetModalInputValue(new Intl.NumberFormat('id-ID').format(chip.val));
                    }}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>

              {/* Input box */}
              <label className="budget-sheet-label" style={{ marginTop: '14px' }}>Nominal Limit</label>
              <div className="budget-modal-input-wrapper">
                <span className="budget-modal-input-prefix">{getCurrency(appCurrency).symbol}</span>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  className="budget-modal-input"
                  placeholder="0"
                  autoFocus
                  value={budgetModalInputValue}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/\./g, '').replace(/[^0-9]/g, '');
                    const formatted = raw ? new Intl.NumberFormat('id-ID').format(parseInt(raw, 10)) : '';
                    setBudgetModalInputValue(formatted);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSaveCategoryBudget();
                    }
                  }}
                />
                {budgetModalInputValue && (
                  <button 
                    type="button" 
                    className="budget-input-clear-btn"
                    onClick={() => setBudgetModalInputValue('')}
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            <div className="budget-sheet-footer">
              {activeBudgetCategory.monthlyLimit && activeBudgetCategory.monthlyLimit > 0 ? (
                <button
                  type="button"
                  className="budget-sheet-btn delete-btn"
                  onClick={handleRemoveCategoryBudget}
                >
                  Hapus Limit
                </button>
              ) : (
                <button
                  type="button"
                  className="budget-sheet-btn cancel-btn"
                  onClick={() => setActiveBudgetCategory(null)}
                >
                  Batal
                </button>
              )}
              <button
                type="button"
                className="budget-sheet-btn save-btn"
                onClick={handleSaveCategoryBudget}
              >
                Simpan Limit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Month & Year Picker Sheet for Budget */}
      {isBudgetMonthPickerOpen && (
        <div className="budget-sheet-overlay" onClick={() => setIsBudgetMonthPickerOpen(false)}>
          <div className="budget-sheet-card budget-month-picker-modal" onClick={(e) => e.stopPropagation()}>
            <div className="budget-sheet-header">
              <div>
                <h3 className="budget-sheet-title">Pilih Periode Budget</h3>
                <p className="budget-sheet-subtitle">Cek riwayat realisasi & pengeluaran bulanan</p>
              </div>
              <button 
                type="button" 
                className="budget-sheet-close"
                onClick={() => setIsBudgetMonthPickerOpen(false)}
              >
                ✕
              </button>
            </div>

            {/* Year Selector */}
            <div className="budget-picker-year-row">
              <button 
                type="button" 
                className="budget-picker-year-arrow"
                onClick={() => setBudgetPickerYear(prev => prev - 1)}
                aria-label="Tahun Sebelumnya"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 18l-6-6 6-6"/>
                </svg>
              </button>
              <span className="budget-picker-year-val">{budgetPickerYear}</span>
              <button 
                type="button" 
                className="budget-picker-year-arrow"
                onClick={() => setBudgetPickerYear(prev => prev + 1)}
                aria-label="Tahun Berikutnya"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 18l6-6-6-6"/>
                </svg>
              </button>
            </div>

            {/* 12-Month Grid */}
            <div className="budget-picker-month-grid">
              {(MONTH_SHORT_I18N[appLanguage] || MONTH_SHORT_I18N.id).map((shortName, idx) => {
                const isSelected = currentDate.getFullYear() === budgetPickerYear && currentDate.getMonth() === idx;
                const now = new Date();
                const isThisCurrentMonth = now.getFullYear() === budgetPickerYear && now.getMonth() === idx;

                return (
                  <button
                    key={shortName}
                    type="button"
                    className={`budget-picker-month-btn ${isSelected ? 'selected' : ''} ${isThisCurrentMonth ? 'today' : ''}`}
                    onClick={() => {
                      setCurrentDate(new Date(budgetPickerYear, idx, 1));
                      setIsBudgetMonthPickerOpen(false);
                    }}
                  >
                    <span>{shortName}</span>
                    {isThisCurrentMonth && <span className="budget-picker-today-dot" />}
                  </button>
                );
              })}
            </div>

            {/* Footer Quick Action */}
            <div className="budget-sheet-footer">
              <button 
                type="button"
                className="budget-sheet-btn cancel-btn"
                onClick={() => {
                  const now = new Date();
                  setCurrentDate(now);
                  setBudgetPickerYear(now.getFullYear());
                  setIsBudgetMonthPickerOpen(false);
                }}
              >
                Bulan Ini
              </button>
              <button 
                type="button"
                className="budget-sheet-btn save-btn"
                onClick={() => setIsBudgetMonthPickerOpen(false)}
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Simple App Update Pop-Up Modal */}
      {updateInfo && (
        <div className="modal-overlay update-overlay">
          <div className="update-modal-card">
            <div className="update-modal-header">
              <span className="update-modal-badge">🚀 Versi Baru Tersedia</span>
            </div>
            <div className="update-modal-body">
              <h3 className="update-version-title">Update v{updateInfo.version}</h3>
              {(() => {
                const rawChangelog = updateInfo.changelog || 'Pembaruan aplikasi telah tersedia.';
                const lines = rawChangelog.split('\n').map(l => l.trim()).filter(Boolean);
                const isBulletList = lines.some(l => l.startsWith('-') || l.startsWith('•') || l.startsWith('*'));
                
                if (!isBulletList) {
                  return <p className="update-changelog-text">{rawChangelog}</p>;
                }

                return (
                  <div className="update-changelog-container">
                    <p className="update-changelog-header">Yang baru di versi ini:</p>
                    <ul className="update-changelog-list">
                      {lines
                        .filter(line => !line.toLowerCase().startsWith('new in this update') && !line.toLowerCase().startsWith('yang baru'))
                        .slice(0, 2)
                        .map((line, idx) => {
                          const cleanText = line.replace(/^[-•*]\s*/, '').replace(/^\[New\]\s*/i, '');
                          return (
                            <li key={idx} className="update-changelog-item">
                              <span className="update-changelog-bullet">•</span>
                              <span className="update-changelog-line-text">{cleanText}</span>
                            </li>
                          );
                        })}
                    </ul>
                  </div>
                );
              })()}
            </div>
            <div className="update-modal-footer">
              <button
                type="button"
                className="update-later-btn"
                onClick={() => {
                  window.hasDismissedUpdate = true;
                  setUpdateInfo(null);
                }}
              >
                Nanti
              </button>
              <button
                type="button"
                className="update-now-btn"
                onClick={() => {
                  const targetApk = updateInfo?.apkName || (updateInfo?.isUdinApp ? 'udin.apk' : 'Cassiel.apk');
                  const rawUrl = updateInfo?.downloadUrl || `https://raw.githubusercontent.com/redilah/Finance-tracker/main/${targetApk}`;
                  const cleanUrl = rawUrl.split('?')[0] + `?t=${Date.now()}`;
                  console.log('[UpdateModal] Navigating to download URL:', cleanUrl);
                  const opened = window.open(cleanUrl, '_system');
                  if (!opened) {
                    window.location.href = cleanUrl;
                  }
                }}
              >
                Update Sekarang
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Safety Compliance Warning Modal (Pop-up Merah Transaksi Terlarang) */}
      {safetyWarning.isOpen && (
        <div className="modal-overlay safety-warning-overlay" style={{ zIndex: 2000000 }}>
          <div className="safety-warning-card">
            <div className="safety-warning-icon-standalone">
              <svg viewBox="0 0 24 24" width="56" height="56" fill="none" stroke="#e11d48" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                <line x1="12" y1="9" x2="12" y2="13"></line>
                <line x1="12" y1="17" x2="12.01" y2="17"></line>
              </svg>
            </div>
            <h3 className="safety-warning-title">Aktivitas Tidak Diizinkan</h3>
            <div className="safety-warning-tag">{safetyWarning.categoryLabel || 'Konten Berbahaya'}</div>
            <p className="safety-warning-desc">
              {safetyWarning.reason || 'Pencatatan untuk kategori berbahaya, ilegal, rokok, miras, atau asusila tidak diizinkan.'}
            </p>
            <div className="safety-warning-footer">
              <button
                type="button"
                className="safety-understand-btn"
                onClick={() => setSafetyWarning({ isOpen: false, categoryLabel: '', reason: '' })}
              >
                Saya Mengerti
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full-Page Category Insight & Monthly Wrapped Screen */}
      {selectedInsightCategory && (
        <CategoryInsightScreen
          category={selectedInsightCategory}
          initialDate={currentDate}
          allTransactions={transactions}
          userName={profileName || 'No Name'}
          resolveIcon={resolveIcon}
          appLanguage={appLanguage}
          fmtMoney={fmtMoney}
          t={t}
          getCategoryName={getCategoryName}
          onClose={() => setSelectedInsightCategory(null)}
        />
      )}

      {/* Full-Page Screen: Atur / Ubah PIN Keamanan */}
      <PinSetupModal
        isOpen={isPinSetupModalOpen}
        isChangeMode={userHasPin}
        t={t}
        onClose={() => setIsPinSetupModalOpen(false)}
        onSuccess={() => {
          const wasFirstTime = !userHasPin;
          setUserHasPin(true);
          setAppLockEnabled(true);
          setIsLockEnabled(true);
          setBiometricEnabled(true);
          setIsBiometricActive(true);
          showVoiceToast(t('pinSuccessSet') || 'PIN keamanan berhasil diatur!');
          // Jika ini pertama kali setup PIN, langsung lock app supaya user verifikasi PIN baru
          if (wasFirstTime) {
            setIsAppLocked(true);
          }
        }}
      />

      {/* Layar Kunci PIN Setelah Splash Screen */}
      {isAppLocked && userHasPin && isLockEnabled && (
        <PinLockScreen
          t={t}
          onUnlockSuccess={() => {
            setIsAppLocked(false);
          }}
        />
      )}

      {/* Pop-up Zoom Detail Card (Naik ke Depan Muka untuk Lihat Total Lengkap) */}
      {activeBalanceDetail && (
        <div 
          className="modal-overlay balance-pop-overlay"
          onClick={() => setActiveBalanceDetail(null)}
        >
          <div 
            className="balance-pop-card"
            style={{ backgroundColor: activeBalanceDetail.bgColor }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="balance-pop-header">
              <span className="balance-pop-badge" style={{ color: activeBalanceDetail.color }}>
                {activeBalanceDetail.icon} {activeBalanceDetail.label}
              </span>
              <button 
                type="button" 
                className="balance-pop-close-btn"
                onClick={() => setActiveBalanceDetail(null)}
                aria-label="Tutup"
              >
                ✕
              </button>
            </div>
            <div className="balance-pop-amount-row">
              <span 
                className="balance-pop-amount"
                style={{ color: activeBalanceDetail.color }}
              >
                {fmtMoney(activeBalanceDetail.amount)}
              </span>
            </div>
            <div className="balance-pop-subtext">
              {activeBalanceDetail.type === 'expense' && 'Total seluruh pengeluaran bulan ini'}
              {activeBalanceDetail.type === 'income' && 'Total seluruh pemasukan bulan ini'}
              {activeBalanceDetail.type === 'total' && 'Sisa saldo bersih keseluruhan bulan ini'}
            </div>
          </div>
        </div>
      )}

      {/* Guided Tour Modal */}
      <GuidedTourModal
        isOpen={isTourOpen && !isAppLocked}
        mode={tourMode}
        t={t}
        setActiveTab={setActiveTab}
        setIsProfileModalOpen={setIsProfileModalOpen}
        setIsAddModalOpen={setIsAddModalOpen}
        setActivePanel={setActivePanel}
        setTransType={setTransType}
        onComplete={handleCompleteTour}
        onClose={() => setIsTourOpen(false)}
      />
    </div>
  );
}

export default App;

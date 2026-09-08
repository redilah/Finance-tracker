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
import wifiSvg from './assets/wifi.svg';
import freelanceSvg from './assets/Freelance.svg';
import biayaAdminSvg from './assets/Biaya admin.svg';
import accessoriesSvg from './assets/Accesories.svg';
import budgetClipboardSvg from './assets/budget-clipboard.svg';
import kalenderSvg from './assets/kalender.svg';
import dompetSvg from './assets/dompet.svg';

import { playPositiveChime } from './utils/soundFeedback';
import { checkForAppUpdates, CURRENT_VERSION_NAME, CURRENT_VERSION_CODE } from './utils/version';
import { safeStorageGet, safeStorageSet } from './utils/secureStorage';
import VoiceMicButton from './components/VoiceMicButton';
import QuickTextModal from './components/QuickTextModal';
import VoiceQueryResultModal from './components/VoiceQueryResultModal';
import CategoryInsightScreen from './components/CategoryInsightScreen';
import { isEndOfMonthOrTesting } from './utils/categoryInsightEngine';
import { generateFinancialInsights, formatActivePeriodRange } from './utils/financialInsightEngine';
import { getTranslation, getCategoryName, LANGUAGES, MONTH_NAMES_I18N, MONTH_SHORT_I18N } from './utils/i18n';
import { submitUserFeedback } from './utils/feedback';
import { DEFAULT_ACCOUNTS, AccountIconBadge } from './utils/accountLogos';
import { WORLD_CURRENCIES, getCurrency, formatMoney, formatCompactMoney, fetchExchangeRates, getExchangeRateText, getFlagUrl } from './utils/currency';
import { createBackupData, exportBackup, importBackup, restoreBackupData } from './utils/backup';
import { hasUserPin, isAppLockEnabled, setAppLockEnabled, isBiometricEnabled, setBiometricEnabled, checkBiometricAvailability } from './utils/authPin';
import PinSetupModal from './components/PinSetupModal';
import PinLockScreen from './components/PinLockScreen';
import GuidedTourModal from './components/GuidedTourModal';
import GroupsHubModal from './components/groups/GroupsHubModal';
import HomeGroupTabContent from './components/HomeGroupTabContent';
import ProUpgradeModal from './components/ProUpgradeModal';
import KitabisaTransparencyModal from './components/KitabisaTransparencyModal';
import { getUserDonorInfo, syncAndAssignDonorNumberFromFirebase } from './utils/kitabisaTransparencyManager';
import kitabisaLogo from './assets/kitabisa_logo.png';
import { exportTransactionsToSpreadsheet } from './utils/excelExport';
import { isProUser, setProUser } from './utils/proManager';
import { initRevenueCat } from './utils/revenueCatManager';
import { syncWidgetData } from './utils/widgetSync';
import { FAQ_ITEMS } from './utils/faqData';

const AdminDashboard = React.lazy(() => import('./components/admin/AdminDashboard'));
import { syncLearnerWithUserData, recordDeletionEvaluation } from './utils/voiceLearner';
import { checkProhibitedContent } from './utils/safetyGuard';
import { updateCurrentDeviceTelemetry, startActiveUsageTracking, detectDeviceName, getDeviceId } from './utils/telemetry';
import { 
  isNotificationEnabled,
  toggleNotificationState,
  sendInstantNotification, 
  sendInstantBudgetNotification,
  sendUpdateReminderNotification,
  schedulePersonalizedNotifications,
  scheduleFeatureIntroNotification,
  scheduleV20FeatureIntroNotification,
  scheduleV23FeatureIntroNotification,
  scheduleV28AccountFeatureIntroNotification,
  buildBudgetNotifText,
  buildMainBudgetNotifText,
  playSound,
  playPopSound,
  requestNotificationPermission
} from './utils/notifications';
import { 
  isAutoTrackerPreferenceEnabled, 
  setAutoTrackerPreference, 
  checkNotificationAccessPermission, 
  openNotificationAccessSettings, 
  checkAssistantActive,
  openAssistantSettings,
  drainAndProcessQueuedNotifications,
  NotificationTrackerNative
} from './utils/notificationTracker';

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
  { id: 'wifi', name: 'WiFi', iconClass: 'wifi-icon' },
  { id: 'biayaAdmin', name: 'Biaya Admin', iconClass: 'biaya-admin-icon' },
  { id: 'accessories', name: 'Accessories', iconClass: 'accessories-icon' },
];

const DEFAULT_INCOME_CATEGORIES = [
  { id: 'gaji', name: 'Gaji', iconClass: 'gaji-icon' },
  { id: 'bonus', name: 'Bonus', iconClass: 'bonus-icon' },
  { id: 'kip', name: 'KIP', iconClass: 'kip-icon' },
  { id: 'investasi', name: 'Investasi', iconClass: 'investasi-icon' },
  { id: 'bisnis', name: 'Bisnis', iconClass: 'bisnis-icon' },
  { id: 'affiliate', name: 'Affiliate', iconClass: 'affiliate-icon' },
  { id: 'freelance', name: 'Freelance', iconClass: 'freelance-icon' },
];

const DEFAULT_ACTIVE_EXPENSE_CATEGORY_IDS = ['food', 'transport', 'coffee', 'bensin'];
const DEFAULT_ACTIVE_INCOME_CATEGORY_IDS = ['gaji', 'bonus', 'affiliate'];
const DEFAULT_ACTIVE_ACCOUNTS = ['Cash', 'GoPay', 'BRImo'];

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
  gofood: fastFoodSvg,
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
  wifi: wifiSvg,
  biayaAdmin: biayaAdminSvg,
  accessories: accessoriesSvg,
  gaji: salarySvg,
  bonus: bonusSvg,
  kip: bookSvg,
  freelance: freelanceSvg,
  tambahSaldo: addSvg,
};

// Resolve icon SVG from category id (runtime only, not from storage)
const resolveIcon = (catOrTx) => {
  if (!catOrTx) return null;
  const id = catOrTx.categoryId || catOrTx.id || null;
  return id ? (ICON_MAP[id] || null) : null;
};

// Resolve category-bound background card class for consistent block colors
const resolveCardBgClass = (catOrTx) => {
  if (!catOrTx) return 'cat-card-food';
  const id = catOrTx.categoryId || catOrTx.id;
  if (id) return `cat-card-${id}`;
  if (catOrTx.category) {
    const norm = (catOrTx.category || '').toLowerCase().trim();
    const allCats = [...DEFAULT_EXPENSE_CATEGORIES, ...DEFAULT_INCOME_CATEGORIES];
    const found = allCats.find(c => (c.name || '').toLowerCase() === norm || (c.id || '').toLowerCase() === norm);
    if (found) return `cat-card-${found.id}`;
  }
  if (catOrTx.iconClass) {
    return `cat-card-${catOrTx.iconClass}`;
  }
  return 'cat-card-food';
};

const CATEGORY_BG_COLORS = {
  food: '#FAE2CB',
  coffee: '#F3DBC4',
  bioskop: '#EEDCE9',
  transport: '#D9E8F1',
  barber: '#F8DECE',
  skincare: '#F7D8E4',
  edukasi: '#DAE4F5',
  galon: '#D6EFE7',
  fashion: '#E6E1F6',
  supermarket: '#F7EFC8',
  sub: '#D7ECE4',
  pesawat: '#D0E6F5',
  kost: '#F4DFD2',
  gofood: '#F8D7D7',
  sepatu: '#EBDEFA',
  donasi: '#F6DCE6',
  topupGame: '#D7F4E1',
  topupgame: '#D7F4E1',
  bensin: '#F8DFCA',
  konser: '#F6D0E3',
  pulsa: '#D4E4F8',
  rumahSakit: '#F9D8DC',
  rumahsakit: '#F9D8DC',
  obatSakit: '#DBF2E4',
  obatsakit: '#DBF2E4',
  jajanAdek: '#F7D8D8',
  jajanadek: '#F7D8D8',
  party: '#F7EAB9',
  buah: '#DCF1DB',
  minuman: '#D1E6F9',
  wifi: '#D8F1EB',
  biayaAdmin: '#EBE2F7',
  biayaadmin: '#EBE2F7',
  accessories: '#F5D7DF',
  gaji: '#D5F1DF',
  bonus: '#D8EBF9',
  kip: '#F5DFDE',
  freelance: '#EBE0F7',
  investasi: '#DCF3DC',
  bisnis: '#F8E7D1',
  affiliate: '#F9E5DC',
  tambahSaldo: '#D8ECF9',
};

const resolveIconClass = (catOrTx) => {
  if (!catOrTx) return 'food-icon';
  const id = catOrTx.categoryId || catOrTx.id;
  const allCats = [...DEFAULT_EXPENSE_CATEGORIES, ...DEFAULT_INCOME_CATEGORIES];
  if (id) {
    const found = allCats.find(c => c.id.toLowerCase() === id.toLowerCase());
    if (found && found.iconClass) return found.iconClass;
  }
  if (catOrTx.category || catOrTx.name) {
    const norm = (catOrTx.category || catOrTx.name || '').toLowerCase().trim();
    const found = allCats.find(c => (c.name || '').toLowerCase() === norm || (c.id || '').toLowerCase() === norm);
    if (found && found.iconClass) return found.iconClass;
  }
  if (catOrTx.iconClass) return catOrTx.iconClass;
  return 'food-icon';
};

const resolveCardBgColor = (catOrTx) => {
  if (!catOrTx) return '#FAE2CB';
  const id = catOrTx.categoryId || catOrTx.id;
  if (id && CATEGORY_BG_COLORS[id]) return CATEGORY_BG_COLORS[id];
  if (catOrTx.category) {
    const norm = (catOrTx.category || '').toLowerCase().trim();
    const allCats = [...DEFAULT_EXPENSE_CATEGORIES, ...DEFAULT_INCOME_CATEGORIES];
    const found = allCats.find(c => (c.name || '').toLowerCase() === norm || (c.id || '').toLowerCase() === norm);
    if (found && CATEGORY_BG_COLORS[found.id]) return CATEGORY_BG_COLORS[found.id];
  }
  return catOrTx.type === 'income' ? 'var(--card-income-bg, #E8F5E9)' : 'var(--card-expense-bg, #FBE9E7)';
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
    'Gaji': 'gaji', 'Bonus': 'bonus', 'KIP': 'kip', 'Tambah Saldo': 'tambahSaldo',
    'Bensin': 'bensin', 'Investasi': 'investasi', 'Bisnis': 'bisnis',
    'Affiliate': 'affiliate', 'Konser': 'konser', 'Pulsa': 'pulsa',
    'Rumah Sakit': 'rumahSakit', 'Obat Sakit': 'obatSakit',
    'Jajan Adek': 'jajanAdek', 'Party': 'party', 'Buah': 'buah',
    'Minuman': 'minuman', 'WiFi': 'wifi', 'Wifi': 'wifi', 'WIFI': 'wifi',
    'Biaya Admin': 'biayaAdmin', 'Accessories': 'accessories', 'Aksesoris': 'accessories', 'accesories': 'accessories', 'accessories': 'accessories',
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

// Helper to identify unedited auto-tracked transactions from Notification Tracker (Past & Present)
const isAutoTrackedTx = (tx) => Boolean(
  tx && (
    tx.autoTracked === true ||
    tx.inputMethod === 'notification' ||
    (Boolean(tx.rawProvider) && tx.inputMethod !== 'manual')
  )
);

/**
 * Komponen Kartu Transaksi Baru Khusus Input Suara:
 * 1. Pop Timbul dari Belakang (3D Elevation Depth)
 * 2. Animasi Ketik (Typewriter) Mengalir Alami dari Kiri ke Kanan (Single Unified Timer - Anti-Stuck)
 */
function VoiceAnimatedTransactionItem({ item, resolveIcon, isDeleting, onAnimationComplete, onSelectTx, onEditTx, className = '' }) {
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
    <div 
      className={`transaction-item ${resolveCardBgClass(item)} voice-card-timbul ${isDeleting ? 'deleting-sink' : ''} ${className}`} 
      key={item.id}
      onClick={() => onSelectTx && onSelectTx(item)}
      role="button"
      tabIndex={0}
    >
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
      <div className="transaction-actions-right">
        {isAutoTrackedTx(item) && (
          <button 
            type="button" 
            className="tx-edit-capsule-btn"
            onClick={(e) => {
              e.stopPropagation();
              if (onEditTx) onEditTx(item);
            }}
            title="Edit Transaksi Otomatis"
            aria-label="Edit Transaksi Otomatis"
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
            <span>Edit</span>
          </button>
        )}
        <div className={`transaction-amount ${item.type === 'expense' ? 'negative' : 'positive'}`} style={{ textAlign: 'left', direction: 'ltr', display: 'inline-flex', alignItems: 'center', justifyContent: 'flex-start', minWidth: '105px' }}>
          <span>{displayedAmount}</span>
          {currentCursor === 'amount' && <span className="typewriter-cursor">|</span>}
        </div>
      </div>
    </div>
  );
}

// Hook for cash counter / money counting machine animation
function useCashCounter(targetValue, duration = 1200) {
  const [displayValue, setDisplayValue] = useState(targetValue);
  const prevValueRef = useRef(targetValue);
  const isFirstRun = useRef(true);

  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false;
      prevValueRef.current = targetValue;
      setDisplayValue(targetValue);
      return;
    }

    const startValue = prevValueRef.current;
    const endValue = targetValue;
    if (startValue === endValue) return;

    const startTime = performance.now();
    let animFrame;

    const update = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Smooth cubic-out easing for realistic cash counter deceleration
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(startValue + (endValue - startValue) * easeProgress);

      setDisplayValue(current);

      if (progress < 1) {
        animFrame = requestAnimationFrame(update);
      } else {
        setDisplayValue(endValue);
        prevValueRef.current = endValue;
      }
    };

    animFrame = requestAnimationFrame(update);
    return () => {
      if (animFrame) cancelAnimationFrame(animFrame);
    };
  }, [targetValue, duration]);

  return displayValue;
}

function App() {
  const [activeTab, setActiveTab] = useState('home'); // 'home' | 'stats'
  const [currentDate, setCurrentDate] = useState(new Date());
  const [periodFilter, setPeriodFilter] = useState('monthly'); // 'monthly' | 'weekly' | 'yearly'
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [expenseDateFilter, setExpenseDateFilter] = useState('month'); // 'month' | 'today' | 'yesterday' | '3days' | '1week' | '2weeks'
  const [isExpenseDropdownOpen, setIsExpenseDropdownOpen] = useState(false);
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

  // LocalStorage Persistence for Custom Categories, Accounts, & Warehouse
  const [expenseCategories, setExpenseCategories] = useState(() => {
    try {
      const savedActive = safeStorageGet('user_expense_categories');
      if (Array.isArray(savedActive) && savedActive.length > 0) {
        if (!safeStorageGet('user_lean_warehouse_sync_v4')) {
          const customCats = savedActive.filter(c => !DEFAULT_EXPENSE_CATEGORIES.some(def => def.id === c.id || def.name.toLowerCase() === (c.name || '').toLowerCase()));
          const cleanActive = [
            ...DEFAULT_EXPENSE_CATEGORIES.filter(cat => DEFAULT_ACTIVE_EXPENSE_CATEGORY_IDS.includes(cat.id)),
            ...customCats
          ];
          return cleanActive;
        }
        return migrateCategories(savedActive);
      }
      return DEFAULT_EXPENSE_CATEGORIES.filter(cat => DEFAULT_ACTIVE_EXPENSE_CATEGORY_IDS.includes(cat.id));
    } catch {
      return DEFAULT_EXPENSE_CATEGORIES.filter(cat => DEFAULT_ACTIVE_EXPENSE_CATEGORY_IDS.includes(cat.id));
    }
  });

  const [warehouseExpenseCategories, setWarehouseExpenseCategories] = useState(() => {
    try {
      const isSyncNeeded = !safeStorageGet('user_lean_warehouse_sync_v4');
      const savedWarehouse = safeStorageGet('user_warehouse_expense_categories');
      const savedActive = safeStorageGet('user_expense_categories');
      
      let activeList;
      if (isSyncNeeded) {
        const customCats = Array.isArray(savedActive) ? savedActive.filter(c => !DEFAULT_EXPENSE_CATEGORIES.some(def => def.id === c.id || def.name.toLowerCase() === (c.name || '').toLowerCase())) : [];
        activeList = [
          ...DEFAULT_EXPENSE_CATEGORIES.filter(cat => DEFAULT_ACTIVE_EXPENSE_CATEGORY_IDS.includes(cat.id)),
          ...customCats
        ];
      } else {
        activeList = Array.isArray(savedActive) && savedActive.length > 0 ? migrateCategories(savedActive) : DEFAULT_EXPENSE_CATEGORIES.filter(cat => DEFAULT_ACTIVE_EXPENSE_CATEGORY_IDS.includes(cat.id));
      }
      const activeKeys = activeList.map(c => (c.id || c.name || '').toLowerCase().trim());

      const warehouseList = (!isSyncNeeded && Array.isArray(savedWarehouse)) ? migrateCategories(savedWarehouse) : [];
      const loadedWarehouse = warehouseList.filter(c => !activeKeys.includes((c.id || '').toLowerCase()) && !activeKeys.includes((c.name || '').toLowerCase()));

      DEFAULT_EXPENSE_CATEGORIES.forEach(defCat => {
        const isAlreadyActive = activeKeys.includes(defCat.id.toLowerCase()) || activeKeys.includes(defCat.name.toLowerCase());
        const isAlreadyInWarehouse = loadedWarehouse.some(c => (c.id || '').toLowerCase() === defCat.id.toLowerCase() || (c.name || '').toLowerCase() === defCat.name.toLowerCase());
        if (!isAlreadyActive && !isAlreadyInWarehouse) {
          loadedWarehouse.push(defCat);
        }
      });
      return loadedWarehouse;
    } catch {
      return DEFAULT_EXPENSE_CATEGORIES.filter(cat => !DEFAULT_ACTIVE_EXPENSE_CATEGORY_IDS.includes(cat.id));
    }
  });

  const [incomeCategories, setIncomeCategories] = useState(() => {
    try {
      const savedActive = safeStorageGet('user_income_categories');
      if (Array.isArray(savedActive) && savedActive.length > 0) {
        if (!safeStorageGet('user_lean_warehouse_sync_v4')) {
          const customCats = savedActive.filter(c => !DEFAULT_INCOME_CATEGORIES.some(def => def.id === c.id || def.name.toLowerCase() === (c.name || '').toLowerCase()));
          const cleanActive = [
            ...DEFAULT_INCOME_CATEGORIES.filter(cat => DEFAULT_ACTIVE_INCOME_CATEGORY_IDS.includes(cat.id)),
            ...customCats
          ];
          return cleanActive;
        }
        return migrateCategories(savedActive);
      }
      return DEFAULT_INCOME_CATEGORIES.filter(cat => DEFAULT_ACTIVE_INCOME_CATEGORY_IDS.includes(cat.id));
    } catch {
      return DEFAULT_INCOME_CATEGORIES.filter(cat => DEFAULT_ACTIVE_INCOME_CATEGORY_IDS.includes(cat.id));
    }
  });

  const [warehouseIncomeCategories, setWarehouseIncomeCategories] = useState(() => {
    try {
      const isSyncNeeded = !safeStorageGet('user_lean_warehouse_sync_v4');
      const savedWarehouse = safeStorageGet('user_warehouse_income_categories');
      const savedActive = safeStorageGet('user_income_categories');

      let activeList;
      if (isSyncNeeded) {
        const customCats = Array.isArray(savedActive) ? savedActive.filter(c => !DEFAULT_INCOME_CATEGORIES.some(def => def.id === c.id || def.name.toLowerCase() === (c.name || '').toLowerCase())) : [];
        activeList = [
          ...DEFAULT_INCOME_CATEGORIES.filter(cat => DEFAULT_ACTIVE_INCOME_CATEGORY_IDS.includes(cat.id)),
          ...customCats
        ];
      } else {
        activeList = Array.isArray(savedActive) && savedActive.length > 0 ? migrateCategories(savedActive) : DEFAULT_INCOME_CATEGORIES.filter(cat => DEFAULT_ACTIVE_INCOME_CATEGORY_IDS.includes(cat.id));
      }
      const activeKeys = activeList.map(c => (c.id || c.name || '').toLowerCase().trim());

      const warehouseList = (!isSyncNeeded && Array.isArray(savedWarehouse)) ? migrateCategories(savedWarehouse) : [];
      const loadedWarehouse = warehouseList.filter(c => !activeKeys.includes((c.id || '').toLowerCase()) && !activeKeys.includes((c.name || '').toLowerCase()));

      DEFAULT_INCOME_CATEGORIES.forEach(defCat => {
        const isAlreadyActive = activeKeys.includes(defCat.id.toLowerCase()) || activeKeys.includes(defCat.name.toLowerCase());
        const isAlreadyInWarehouse = loadedWarehouse.some(c => (c.id || '').toLowerCase() === defCat.id.toLowerCase() || (c.name || '').toLowerCase() === defCat.name.toLowerCase());
        if (!isAlreadyActive && !isAlreadyInWarehouse) {
          loadedWarehouse.push(defCat);
        }
      });
      return loadedWarehouse;
    } catch {
      return DEFAULT_INCOME_CATEGORIES.filter(cat => !DEFAULT_ACTIVE_INCOME_CATEGORY_IDS.includes(cat.id));
    }
  });

  const [isCategoryWarehouseOpen, setIsCategoryWarehouseOpen] = useState(false);
  const [isCategoryDeleteMode, setIsCategoryDeleteMode] = useState(false);
  const [isAccountWarehouseOpen, setIsAccountWarehouseOpen] = useState(false);
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
    try {
      const saved = safeStorageGet('user_accounts_list');
      if (Array.isArray(saved) && saved.length > 0) {
        if (!safeStorageGet('user_lean_warehouse_sync_v4')) {
          const customAccs = saved.filter(acc => !DEFAULT_ACCOUNTS.some(def => def.name.toLowerCase() === (acc || '').toLowerCase().trim()));
          return [...DEFAULT_ACTIVE_ACCOUNTS, ...customAccs];
        }
        return saved.map(acc => (acc && acc.toLowerCase().trim() === 'bri') ? 'BRImo' : acc);
      }
      return DEFAULT_ACTIVE_ACCOUNTS;
    } catch {
      return DEFAULT_ACTIVE_ACCOUNTS;
    }
  });

  const [warehouseAccountsList, setWarehouseAccountsList] = useState(() => {
    // Gudang Akun HANYA untuk Bank Resmi & E-Wallet (Bukan Kartu Kredit)
    const bankAndEwalletAccounts = DEFAULT_ACCOUNTS.filter(a => a.type === 'bank' || a.type === 'ewallet' || a.type === 'cash').map(a => a.name);
    try {
      const isSyncNeeded = !safeStorageGet('user_lean_warehouse_sync_v4');
      const savedWarehouse = safeStorageGet('user_warehouse_accounts');
      const savedActive = safeStorageGet('user_accounts_list');
      
      let activeList;
      if (isSyncNeeded) {
        const customAccs = Array.isArray(savedActive) ? savedActive.filter(acc => !DEFAULT_ACCOUNTS.some(def => def.name.toLowerCase() === (acc || '').toLowerCase().trim())) : [];
        activeList = [...DEFAULT_ACTIVE_ACCOUNTS, ...customAccs];
        // Selesaikan penandaan sinkronisasi Lean Warehouse
        safeStorageSet('user_lean_warehouse_sync_v4', 'true');
      } else {
        activeList = Array.isArray(savedActive) && savedActive.length > 0 ? savedActive.map(acc => (acc && acc.toLowerCase().trim() === 'bri') ? 'BRImo' : acc) : DEFAULT_ACTIVE_ACCOUNTS;
      }
      const activeLower = activeList.map(a => (a || '').toLowerCase().trim());

      // Filter out credit card names completely from warehouse
      const isCreditCardAccount = (name) => {
        const accObj = DEFAULT_ACCOUNTS.find(a => a.name.toLowerCase() === (name || '').toLowerCase());
        return accObj && accObj.type === 'credit_card';
      };

      const warehouseList = (!isSyncNeeded && Array.isArray(savedWarehouse)) ? savedWarehouse : [];
      const loadedWarehouse = warehouseList
        .map(acc => (acc && acc.toLowerCase().trim() === 'bri') ? 'BRImo' : acc)
        .filter(acc => !isCreditCardAccount(acc) && !activeLower.includes((acc || '').toLowerCase().trim()));

      bankAndEwalletAccounts.forEach(defAcc => {
        if (!activeLower.includes(defAcc.toLowerCase().trim()) && !loadedWarehouse.some(a => a.toLowerCase().trim() === defAcc.toLowerCase().trim())) {
          loadedWarehouse.push(defAcc);
        }
      });
      return loadedWarehouse;
    } catch {
      return bankAndEwalletAccounts.filter(acc => !DEFAULT_ACTIVE_ACCOUNTS.some(a => a.toLowerCase() === acc.toLowerCase()));
    }
  });

  // Saldo Awal per Akun (Reference Initial Balance)
  const [accountInitialBalances, setAccountInitialBalances] = useState(() => {
    try {
      const saved = safeStorageGet('user_account_initial_balances');
      return saved && typeof saved === 'object' ? saved : {};
    } catch {
      return {};
    }
  });

  const [isCustomAccount, setIsCustomAccount] = useState(false);
  const [customAccountInput, setCustomAccountInput] = useState('');
  const [adjustingAccount, setAdjustingAccount] = useState(null); // Akun generik lama yang sedang disesuaikan (misal: 'Bank' / 'E-Wallet')

  // State Modal Atur Saldo Awal / Tambah Saldo
  const [accountToSetBalance, setAccountToSetBalance] = useState(null);
  const [balanceModalInputValue, setBalanceModalInputValue] = useState('');
  const [balanceModalMode, setBalanceModalMode] = useState('add'); // 'add' | 'edit_initial'
  const [balanceModalNote, setBalanceModalNote] = useState('');

  // State Detail Akun Drawer / Screen
  const [selectedAccountDetail, setSelectedAccountDetail] = useState(null);

  // State Modal Tambah Akun Baru
  const [isAddAccountModalOpen, setIsAddAccountModalOpen] = useState(false);
  const [newAccountInput, setNewAccountInput] = useState('');
  const [addAccountCategoryTab, setAddAccountCategoryTab] = useState('all'); // 'all' | 'bank' | 'ewallet'
  const [addAccountSearchQuery, setAddAccountSearchQuery] = useState('');
  const [isCustomAddAccOpen, setIsCustomAddAccOpen] = useState(false);

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

  // Status One-time Info Banner "Saldo di Cassiel bersifat manual"
  const [dismissedAccountInfoBanner, setDismissedAccountInfoBanner] = useState(() => {
    return safeStorageGet('user_account_info_banner_dismissed') === 'true' || safeStorageGet('user_account_info_banner_dismissed') === true;
  });

  const handleDismissAccountInfoBanner = () => {
    if (!dismissedAccountInfoBanner) {
      setDismissedAccountInfoBanner(true);
      try {
        safeStorageSet('user_account_info_banner_dismissed', 'true');
      } catch {}
    }
  };

  // State Dismissal Kartu Insight Berbasis Periode & ID Insight (Living Lifecycle V1)
  const [dismissedInsightMap, setDismissedInsightMap] = useState(() => {
    try {
      const saved = safeStorageGet('user_dismissed_insights_map');
      return saved && typeof saved === 'object' ? saved : {};
    } catch {
      return {};
    }
  });

  const handleDismissInsight = (periodKey, insightId) => {
    if (!periodKey || !insightId) return;
    setDismissedInsightMap(prev => {
      const updated = {
        ...prev,
        [periodKey]: insightId
      };
      try {
        safeStorageSet('user_dismissed_insights_map', updated);
      } catch {}
      return updated;
    });
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
  const [isVoiceQueryResultOpen, setIsVoiceQueryResultOpen] = useState(false);
  const [voiceQueryData, setVoiceQueryData] = useState(null);

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
  const [isSearchingBudget, setIsSearchingBudget] = useState(false);

  const [accountsSubTab, setAccountsSubTab] = useState('expense'); // 'expense' | 'income'
  const [expandedAccountName, setExpandedAccountName] = useState(null);
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

  // Language Settings
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

  // Privacy / Hide Amounts in Home State (Menyimpan preferensi terakhir, default false/terbuka)
  const [isHomeAmountsHidden, setIsHomeAmountsHidden] = useState(() => {
    const val = safeStorageGet('cassiel_hide_home_amounts');
    return val === 'true' || val === true;
  });

  // First-Time Privacy Eye Guide Hand Pointer State (Hanya untuk user pertama kali, tidak akan muncul lagi jika sudah dilihat/ditekan)
  const [showPrivacyPointerHint, setShowPrivacyPointerHint] = useState(() => {
    const seen = safeStorageGet('cassiel_has_seen_privacy_pointer');
    return seen !== 'true' && seen !== true;
  });

  const handleToggleHideHomeAmounts = (e) => {
    if (e) e.stopPropagation();
    setIsHomeAmountsHidden(prev => {
      const next = !prev;
      safeStorageSet('cassiel_hide_home_amounts', next);
      return next;
    });

    // Sekali user menekan tombol mata, hilangkan pointer selamanya
    if (showPrivacyPointerHint) {
      setShowPrivacyPointerHint(false);
    }
    safeStorageSet('cassiel_has_seen_privacy_pointer', true);
  };

  const fmtHomeMoney = useCallback((amount, includeSymbol = true) => {
    if (isHomeAmountsHidden) {
      return '••••••';
    }
    return fmtMoney(amount, includeSymbol);
  }, [isHomeAmountsHidden, fmtMoney]);

  // Balance Card Detail Popup (Pop to front on tap)
  const [activeBalanceDetail, setActiveBalanceDetail] = useState(null);
  const [activeTxDetail, setActiveTxDetail] = useState(null);

  // Groups State
  const [isGroupsModalOpen, setIsGroupsModalOpen] = useState(false);

  // Pro Upgrade Modal State
  const [isProModalOpen, setIsProModalOpen] = useState(false);
  const [isKitabisaModalOpen, setIsKitabisaModalOpen] = useState(false);
  const [proTriggerReason, setProTriggerReason] = useState('general');
  const [isPro, setIsPro] = useState(() => isProUser());

  useEffect(() => {
    if (isPro) {
      syncAndAssignDonorNumberFromFirebase(profileName).catch(() => {});
    }
  }, [isPro, profileName]);

  const handleOpenProModal = (reason = 'general') => {
    setProTriggerReason(reason);
    setIsProModalOpen(true);
  };

  // Feedback for Developer State
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [feedbackCategory, setFeedbackCategory] = useState('Saran Fitur');
  const [feedbackText, setFeedbackText] = useState('');
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);

  // Help Center & Subpage States
  const [isHelpCenterOpen, setIsHelpCenterOpen] = useState(false);
  const [isFaqModalOpen, setIsFaqModalOpen] = useState(false);
  const [isReportIssueModalOpen, setIsReportIssueModalOpen] = useState(false);
  const [reportIssueCat, setReportIssueCat] = useState('');
  const [isReportCatDropdownOpen, setIsReportCatDropdownOpen] = useState(false);
  const [reportIssueText, setReportIssueText] = useState('');
  const [reportIssueScreenshot, setReportIssueScreenshot] = useState(null);
  const [isReportSubmittedSuccess, setIsReportSubmittedSuccess] = useState(false);
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const reportFileInputRef = useRef(null);
  const [isContactUsModalOpen, setIsContactUsModalOpen] = useState(false);
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);
  const [expandedFaqId, setExpandedFaqId] = useState(null);

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
  // Interactive Guided Tour State
  // Tour HANYA dibuka 1x setelah user baru selesai onboarding setup profil,
  // atau saat user secara manual menekan menu "Panduan Aplikasi" di Profil.
  const [isTourOpen, setIsTourOpen] = useState(false);
  const [tourMode, setTourMode] = useState('full_guide'); // 'full_guide' (5 essential steps)

  const handleCompleteTour = () => {
    try {
      safeStorageSet('cassiel_guided_tour_v20_completed', 'true');
      safeStorageSet('cassiel_guided_tour_full_completed', 'true');
    } catch {}
    setIsTourOpen(false);
  };

  const handleCloseTour = () => {
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
  const t = useCallback((key, vars) => getTranslation(appLanguage, key, vars), [appLanguage]);

  const handleOpenLangModal = () => {
    setTempLanguage(appLanguage);
    setIsLangModalOpen(true);
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
        accountInitialBalances,
        profileName,
        profileImage,
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
      setAccountInitialBalances,
      setProfileName,
      setProfileImage,
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
  const [deletingTxIds, setDeletingTxIds] = useState([]);
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

  const handleScreenshotChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showVoiceToast('Mohon pilih berkas gambar atau screenshot yang valid.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      showVoiceToast('Ukuran berkas screenshot maksimal 10 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const maxDim = 1200;

          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.8);
          setReportIssueScreenshot(compressedDataUrl);
        } catch (err) {
          console.warn('Canvas compression fallback:', err);
          setReportIssueScreenshot(event.target.result);
        }
      };
      img.onerror = () => {
        showVoiceToast('Gagal memuat berkas gambar screenshot.');
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveScreenshot = () => {
    setReportIssueScreenshot(null);
    if (reportFileInputRef.current) {
      reportFileInputRef.current.value = '';
    }
  };

  const handleCloseReportIssue = () => {
    setIsReportIssueModalOpen(false);
    setIsReportSubmittedSuccess(false);
    setReportIssueCat('');
    setIsReportCatDropdownOpen(false);
    setReportIssueText('');
    setReportIssueScreenshot(null);
    if (reportFileInputRef.current) {
      reportFileInputRef.current.value = '';
    }
  };

  const handleSubmitReportIssue = async () => {
    if (!reportIssueCat) {
      showVoiceToast('Silakan pilih jenis masalah terlebih dahulu.');
      return;
    }
    if (!reportIssueText.trim()) {
      showVoiceToast('Silakan jelaskan masalah yang terjadi.');
      return;
    }

    setIsSubmittingReport(true);
    try {
      const deviceName = detectDeviceName();
      const devId = getDeviceId();

      await submitUserFeedback({
        category: `[MASALAH] ${reportIssueCat}`,
        message: reportIssueText.trim(),
        userName: profileName || 'Pengguna Cassiel',
        screenshot: reportIssueScreenshot,
        appVersion: `v${CURRENT_VERSION_NAME} (Build ${CURRENT_VERSION_CODE})`,
        deviceModel: deviceName,
        metadata: {
          issueType: reportIssueCat,
          deviceId: devId,
          platform: typeof navigator !== 'undefined' ? (navigator.platform || 'Unknown') : 'Unknown',
          userAgent: typeof navigator !== 'undefined' ? (navigator.userAgent || 'Unknown') : 'Unknown'
        }
      });

      setIsReportSubmittedSuccess(true);
    } catch (err) {
      console.error('Report issue submit error:', err);
      showVoiceToast('Laporan belum berhasil dikirim. Periksa koneksi internet dan coba lagi.');
    } finally {
      setIsSubmittingReport(false);
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

  // Notification Auto Tracker State (Persisted)
  const [isAutoTrackerPref, setIsAutoTrackerPref] = useState(() => isAutoTrackerPreferenceEnabled());
  const [hasNotifPermission, setHasNotifPermission] = useState(false);
  const [isAssistantActive, setIsAssistantActive] = useState(false);

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
    scheduleV20FeatureIntroNotification(profileName, appLanguage);
    scheduleV23FeatureIntroNotification(profileName, appLanguage);
    scheduleV28AccountFeatureIntroNotification(profileName, appLanguage);
  }, [profileName, appLanguage]);

  // Schedule / sync notifications when profile name, transactions, expenseCategories, language, main budget, or monthly budgets map update
  React.useEffect(() => {
    if (isNotifActive) {
      schedulePersonalizedNotifications(profileName, transactions, expenseCategories, appLanguage, mainMonthlyBudget, monthlyBudgetsMap);
    }
  }, [isNotifActive, profileName, transactions, expenseCategories, appLanguage, mainMonthlyBudget, monthlyBudgetsMap]);

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
      if (active) {
        checkUpdate();
        initRevenueCat();
      }

      // Deteksi jika aplikasi dibuka melalui Link Undangan Grup (?g= atau ?joinGroup=)
      try {
        if (typeof window !== 'undefined' && window.location && window.location.search) {
          const urlParams = new URLSearchParams(window.location.search);
          const inviteG = urlParams.get('g') || urlParams.get('joinGroup');
          if (inviteG) {
            import('./utils/groupStorage').then(({ joinGroupByInviteCode }) => {
              const currentUName = safeStorageGet('user_profile_name', 'Pengguna Cassiel');
              joinGroupByInviteCode({ inviteCode: inviteG, currentUserName: currentUName })
                .then(res => {
                  if (res && res.group) {
                    showVoiceToast(`🎉 Berhasil bergabung ke grup "${res.group.name}"!`);
                    setIsGroupsModalOpen(true);
                  }
                })
                .catch(e => {
                  console.warn('Auto-join from URL failed:', e);
                });
            }).catch(() => {});
          }
        }
      } catch {}
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
    safeStorageSet('user_warehouse_expense_categories', warehouseExpenseCategories);
  }, [warehouseExpenseCategories]);

  React.useEffect(() => {
    safeStorageSet('user_income_categories', incomeCategories);
  }, [incomeCategories]);

  React.useEffect(() => {
    safeStorageSet('user_warehouse_income_categories', warehouseIncomeCategories);
  }, [warehouseIncomeCategories]);

  React.useEffect(() => {
    safeStorageSet('user_accounts_list', accountsList);
  }, [accountsList]);

  React.useEffect(() => {
    safeStorageSet('user_warehouse_accounts', warehouseAccountsList);
  }, [warehouseAccountsList]);

  React.useEffect(() => {
    safeStorageSet('user_account_initial_balances', accountInitialBalances);
  }, [accountInitialBalances]);

  // Note Suggestions & Modal state
  const [isNoteSuggestionsOpen, setIsNoteSuggestionsOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAddModalClosing, setIsAddModalClosing] = useState(false);
  const [isQuickTextModalOpen, setIsQuickTextModalOpen] = useState(false);

  const handleCloseAddModal = useCallback(() => {
    if (isAddModalClosing) return;
    setIsAddModalClosing(true);
    setTimeout(() => {
      setIsAddModalOpen(false);
      setIsAddModalClosing(false);
      setEditingTransactionId(null);
    }, 190);
  }, [isAddModalClosing]);

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
  const budgetDateInputRef = useRef(null);

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
  const [expenseAmountVal, setExpenseAmountVal] = useState('');
  const [incomeAmountVal, setIncomeAmountVal] = useState('');
  const amountVal = transType === 'Expense' ? expenseAmountVal : incomeAmountVal;

  const setAmountVal = (val) => {
    if (transType === 'Expense') {
      setExpenseAmountVal(val);
    } else {
      setIncomeAmountVal(val);
    }
  };

  // Format amount input with Indonesian thousand separators (e.g. 15000 -> 15.000)
  const formatAmountInput = (val) => {
    if (!val) return '';
    const cleanVal = val.toString().replace(/\D/g, '');
    if (!cleanVal) return '';
    return Number(cleanVal).toLocaleString('id-ID');
  };

  const handleAmountChange = (e) => {
    const rawVal = e.target.value;
    const formatted = formatAmountInput(rawVal);
    if (transType === 'Expense') {
      setExpenseAmountVal(formatted);
    } else {
      setIncomeAmountVal(formatted);
    }
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

  const [editingTransactionId, setEditingTransactionId] = useState(null);

  // Open Full-Page Add Form (Plus button)
  const handleOpenAddModal = () => {
    setEditingTransactionId(null);
    setTransType('Expense');
    setExpenseAmountVal('');
    setIncomeAmountVal('');
    setSelectedCategory(expenseCategories[0] || DEFAULT_EXPENSE_CATEGORIES[0]);
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

  // Open Full-Page Form in Edit Mode for a Transaction
  const handleEditTransaction = (tx) => {
    if (!tx) return;
    const isInc = tx.type === 'income';
    const typeLabel = isInc ? 'Income' : 'Expense';
    setEditingTransactionId(tx.id);
    setTransType(typeLabel);

    const fmtAmt = Number(tx.amount || 0).toLocaleString('id-ID');
    if (isInc) {
      setIncomeAmountVal(fmtAmt);
      setExpenseAmountVal('');
    } else {
      setExpenseAmountVal(fmtAmt);
      setIncomeAmountVal('');
    }

    const activeCatList = isInc ? incomeCategories : expenseCategories;
    const allCatList = isInc ? DEFAULT_INCOME_CATEGORIES : DEFAULT_EXPENSE_CATEGORIES;
    const norm = (tx.category || '').toLowerCase().trim();
    let found = activeCatList.find(c => (c.id && c.id === tx.categoryId) || (c.name || '').toLowerCase().trim() === norm) ||
                allCatList.find(c => (c.id && c.id === tx.categoryId) || (c.name || '').toLowerCase().trim() === norm);

    if (found) {
      setSelectedCategory(found);
      setIsCustomCat(false);
      setCustomCatInput('');
    } else {
      setSelectedCategory({ id: 'custom', name: tx.category || (isInc ? 'Gaji' : 'Food'), iconClass: tx.iconClass || 'food-icon' });
      setIsCustomCat(true);
      setCustomCatInput(tx.category || '');
    }

    setAccount(tx.account || 'BRImo');
    setNote(tx.title || '');
    setSelectedDateVal(tx.date || getTodayISO());
    setActivePanel('amount');
    setIsNoteSuggestionsOpen(false);
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
    activeTxDetail,
    setActiveTxDetail,
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
    isSearchingBudget,
    setIsSearchingBudget,
    safetyWarning,
    setSafetyWarning,
    updateInfo,
    setUpdateInfo,
    isLangModalOpen,
    setIsLangModalOpen,
    isCurrencyModalOpen,
    setIsCurrencyModalOpen,
    isFeedbackModalOpen,
    setIsFeedbackModalOpen,
    isHelpCenterOpen,
    setIsHelpCenterOpen,
    isFaqModalOpen,
    setIsFaqModalOpen,
    isReportIssueModalOpen,
    setIsReportIssueModalOpen,
    isContactUsModalOpen,
    setIsContactUsModalOpen,
    isAboutModalOpen,
    setIsAboutModalOpen,
    isPrivacyModalOpen,
    setIsPrivacyModalOpen,
    isTermsModalOpen,
    setIsTermsModalOpen,
    isBackupModalOpen,
    setIsBackupModalOpen,
    backupRestoreConfirm,
    setBackupRestoreConfirm,
    adjustingAccount,
    setAdjustingAccount,
    accountToSetBalance,
    setAccountToSetBalance,
    selectedAccountDetail,
    setSelectedAccountDetail,
    isAddAccountModalOpen,
    setIsAddAccountModalOpen,
    isPinSetupModalOpen,
    setIsPinSetupModalOpen,
    isCategoryWarehouseOpen,
    setIsCategoryWarehouseOpen,
    isCategoryDeleteMode,
    setIsCategoryDeleteMode,
    isAccountWarehouseOpen,
    setIsAccountWarehouseOpen,
    isAccountDeleteMode,
    setIsAccountDeleteMode,
    isAddModalOpen,
    setIsAddModalOpen,
    handleCloseAddModal,
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

    // -1. Pop-up Balance Card Detail & Transaction Pop-up Detail
    if (s.activeBalanceDetail) {
      s.setActiveBalanceDetail(null);
      return;
    }
    if (s.activeTxDetail) {
      s.setActiveTxDetail(null);
      return;
    }

    // -0.5 Layar Detail Akun
    if (s.selectedAccountDetail) {
      s.setSelectedAccountDetail(null);
      return;
    }

    // -0.4 Modal Atur Saldo Akun / Tambah Akun
    if (s.accountToSetBalance) {
      s.setAccountToSetBalance(null);
      return;
    }
    if (s.isAddAccountModalOpen) {
      s.setIsAddAccountModalOpen(false);
      return;
    }

    // 0. Layar Full-Page Category Insight
    if (s.selectedInsightCategory) {
      s.setSelectedInsightCategory(null);
      return;
    }

    // 0.1 Sub-Modals di Profile / Account / Help Center
    if (s.isTermsModalOpen) {
      s.setIsTermsModalOpen(false);
      return;
    }
    if (s.isPrivacyModalOpen) {
      s.setIsPrivacyModalOpen(false);
      return;
    }
    if (s.isAboutModalOpen) {
      s.setIsAboutModalOpen(false);
      return;
    }
    if (s.isContactUsModalOpen) {
      s.setIsContactUsModalOpen(false);
      return;
    }
    if (s.isReportIssueModalOpen) {
      s.setIsReportIssueModalOpen(false);
      return;
    }
    if (s.isFaqModalOpen) {
      s.setIsFaqModalOpen(false);
      return;
    }
    if (s.isHelpCenterOpen) {
      s.setIsHelpCenterOpen(false);
      return;
    }
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

    // 2d. Mode Pencarian Budget (tutup keyboard & reset state searching)
    if (s.isSearchingBudget) {
      s.setIsSearchingBudget(false);
      return;
    }

    // 3. Layar Penuh Budget Cap
    if (s.isBudgetCapModalOpen) {
      s.setIsBudgetCapModalOpen(false);
      return;
    }

    // 3b. Modal Tanya AI Finansial
    if (s.isVoiceQueryResultOpen) {
      s.setIsVoiceQueryResultOpen(false);
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
      if (s.isCategoryWarehouseOpen) {
        s.setIsCategoryWarehouseOpen(false);
        return;
      }
      if (s.isAccountWarehouseOpen) {
        s.setIsAccountWarehouseOpen(false);
        return;
      }
      if (s.isCategoryDeleteMode) {
        s.setIsCategoryDeleteMode(false);
        return;
      }
      if (s.isAccountDeleteMode) {
        s.setIsAccountDeleteMode(false);
        return;
      }
      if (s.handleCloseAddModal) {
        s.handleCloseAddModal();
      } else {
        s.setIsAddModalOpen(false);
        setEditingTransactionId(null);
      }
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

    // Cek apakah kategori ada di gudang
    if (transType === 'Expense') {
      const inWarehouse = warehouseExpenseCategories.find(c => c.name.toLowerCase() === trimmed.toLowerCase());
      if (inWarehouse) {
        handleRestoreCategoryFromWarehouse(inWarehouse);
        setSelectedCategory(inWarehouse);
        setCustomCatInput('');
        setIsCustomCat(false);
        return;
      }
    } else {
      const inWarehouse = warehouseIncomeCategories.find(c => c.name.toLowerCase() === trimmed.toLowerCase());
      if (inWarehouse) {
        handleRestoreCategoryFromWarehouse(inWarehouse);
        setSelectedCategory(inWarehouse);
        setCustomCatInput('');
        setIsCustomCat(false);
        return;
      }
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

    const inWarehouse = warehouseAccountsList.find(a => a.toLowerCase() === trimmed.toLowerCase());
    if (inWarehouse) {
      handleRestoreAccountFromWarehouse(inWarehouse);
      setAccount(inWarehouse);
      setCustomAccountInput('');
      setIsCustomAccount(false);
      return;
    }

    setAccountsList(prev => [...prev, trimmed]);
    setAccount(trimmed);
    setCustomAccountInput('');
    setIsCustomAccount(false);
  };

  // Handle Select or Add Account (dari modal Tambah Akun Baru)
  const handleSelectOrAddAccount = (accName) => {
    const trimmed = (accName || '').trim();
    if (!trimmed) return;

    // 1. Pastikan masuk ke accountsList
    setAccountsList(prev => {
      if (!prev.some(a => a.toLowerCase().trim() === trimmed.toLowerCase())) {
        const updated = [...prev, trimmed];
        try { safeStorageSet('user_accounts_list', updated); } catch {}
        return updated;
      }
      return prev;
    });

    // 2. Hapus dari gudang akun jika ada
    setWarehouseAccountsList(prev => {
      const updated = prev.filter(a => (a || '').toLowerCase().trim() !== trimmed.toLowerCase());
      try { safeStorageSet('user_warehouse_accounts', updated); } catch {}
      return updated;
    });

    // 3. Reset input kustom
    setNewAccountInput('');

    // 4. Siapkan nilai input awal dan langsung buka modal Atur Saldo Awal
    const existingInit = accountInitialBalances[trimmed];
    setBalanceModalInputValue(typeof existingInit === 'number' && !isNaN(existingInit) ? new Intl.NumberFormat('id-ID').format(existingInit) : '');
    setAccountToSetBalance(trimmed);
  };

  // Handle Move Category to Warehouse (Simpan Kategori ke Gudang)
  const handleMoveCategoryToWarehouse = (catToMove, e) => {
    if (e) e.stopPropagation();
    playPopSound('bubble_pop_2.wav');

    if (transType === 'Expense') {
      setExpenseCategories(prev => {
        const updated = prev.filter(c => c.id !== catToMove.id);
        if (selectedCategory && selectedCategory.id === catToMove.id) {
          setSelectedCategory(updated.length > 0 ? updated[0] : null);
        }
        return updated;
      });
      setWarehouseExpenseCategories(prev => {
        if (!prev.some(c => c.id === catToMove.id)) {
          return [...prev, catToMove];
        }
        return prev;
      });
    } else {
      setIncomeCategories(prev => {
        const updated = prev.filter(c => c.id !== catToMove.id);
        if (selectedCategory && selectedCategory.id === catToMove.id) {
          setSelectedCategory(updated.length > 0 ? updated[0] : null);
        }
        return updated;
      });
      setWarehouseIncomeCategories(prev => {
        if (!prev.some(c => c.id === catToMove.id)) {
          return [...prev, catToMove];
        }
        return prev;
      });
    }
  };

  // Handle Restore Category from Warehouse (Keluarkan Kategori dari Gudang ke Tampilan Utama)
  const handleRestoreCategoryFromWarehouse = (catToRestore, e) => {
    if (e) e.stopPropagation();
    playPopSound('bubble_pop_2.wav');

    if (transType === 'Expense') {
      setWarehouseExpenseCategories(prev => prev.filter(c => c.id !== catToRestore.id));
      setExpenseCategories(prev => {
        if (!prev.some(c => c.id === catToRestore.id)) {
          return [...prev, catToRestore];
        }
        return prev;
      });
    } else {
      setWarehouseIncomeCategories(prev => prev.filter(c => c.id !== catToRestore.id));
      setIncomeCategories(prev => {
        if (!prev.some(c => c.id === catToRestore.id)) {
          return [...prev, catToRestore];
        }
        return prev;
      });
    }
    if (!selectedCategory) {
      setSelectedCategory(catToRestore);
    }
  };

  // Handle Move Account to Warehouse (Simpan Akun ke Gudang)
  const handleMoveAccountToWarehouse = (accToDelete, e) => {
    if (e) e.stopPropagation();
    playPopSound('bubble_pop_2.wav');

    setAccountsList(prev => {
      const updated = prev.filter(a => a !== accToDelete);
      if (account === accToDelete) {
        setAccount(updated.length > 0 ? updated[0] : 'Cash');
      }
      return updated;
    });
    setWarehouseAccountsList(prev => {
      if (!prev.includes(accToDelete)) {
        return [...prev, accToDelete];
      }
      return prev;
    });
  };

  // Handle Restore Account from Warehouse (Keluarkan Akun dari Gudang ke Tampilan Utama)
  const handleRestoreAccountFromWarehouse = (accToRestore, e) => {
    if (e) e.stopPropagation();
    playPopSound('bubble_pop_2.wav');

    setWarehouseAccountsList(prev => prev.filter(a => a !== accToRestore));
    setAccountsList(prev => {
      if (!prev.includes(accToRestore)) {
        return [...prev, accToRestore];
      }
      return prev;
    });
  };

  // Alias for backward compatibility
  const handleDeleteAccount = handleMoveAccountToWarehouse;

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

  // Seluruh kategori pengeluaran yang tersedia (aktif + gudang + default + custom) untuk Budget
  const allBudgetCategories = useMemo(() => {
    const combined = [...(expenseCategories || []), ...(warehouseExpenseCategories || []), ...DEFAULT_EXPENSE_CATEGORIES];
    const seen = new Set();
    const result = [];
    combined.forEach(cat => {
      if (!cat) return;
      const key = (cat.id || cat.name || '').toLowerCase().trim();
      if (key && !seen.has(key)) {
        seen.add(key);
        result.push(cat);
      }
    });
    return result;
  }, [expenseCategories, warehouseExpenseCategories]);

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
      minuman: ['minuman', 'es buah', 'es campur', 'es teler', 'coca cola', 'sprite', 'fanta', 'jus', 'susu', 'teh', 'boba', 'cendol', 'dawet', 'minuman segar', 'minuman dingin'],
      wifi: ['wifi', 'internet', 'indihome', 'biznet', 'myrepublic', 'firstmedia'],
      biayaAdmin: ['admin', 'transfer', 'biaya admin', 'fee', 'pajak'],
      accessories: ['aksesori', 'accessories', 'jam', 'kacamata', 'topi', 'gelang', 'kalung']
    };

    const q = (budgetSearchQuery || '').toLowerCase().trim();
    const currentMonthData = monthlyBudgetsMap[activeMonthKey] || { main: null, categories: {} };
    const monthCatLimits = currentMonthData.categories || {};

    let list = (allBudgetCategories || []).map(cat => ({
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
      // 1. Kategori yang SUDAH diatur budget-nya (hasLimit) paling atas (diurutkan berdasarkan freq/transaksi atau nama)
      // 2. Kategori yang BELUM diatur budget-nya tapi pernah ada transaksi
      // 3. Kategori yang BELUM diatur dan belum pernah ada transaksi
      list.sort((a, b) => {
        const countA = catFreqMap[a.name] || 0;
        const countB = catFreqMap[b.name] || 0;
        const hasLimitA = typeof a.monthlyLimit === 'number' && a.monthlyLimit > 0;
        const hasLimitB = typeof b.monthlyLimit === 'number' && b.monthlyLimit > 0;

        // Prioritas 1: Kategori yang SUDAH diatur budget-nya paling atas
        if (hasLimitA && !hasLimitB) return -1;
        if (!hasLimitA && hasLimitB) return 1;
        if (hasLimitA && hasLimitB) {
          // Antara yang sama-sama sudah diatur, dahulukan yang ada transaksi terbanyak
          if (countB !== countA) return countB - countA;
          return (a.name || '').localeCompare(b.name || '');
        }

        // Prioritas 2: Belum diatur TAPI ada riwayat transaksi
        const isGroup2A = !hasLimitA && countA > 0;
        const isGroup2B = !hasLimitB && countB > 0;

        if (isGroup2A && !isGroup2B) return -1;
        if (!isGroup2A && isGroup2B) return 1;
        if (isGroup2A && isGroup2B) {
          if (countB !== countA) return countB - countA;
          return (a.name || '').localeCompare(b.name || '');
        }

        // Prioritas 3: Belum diatur & belum ada transaksi (urut abjad)
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

  // Process Queued Notifications from Android NotificationListenerService
  const processAutoTrackerQueue = useCallback(async () => {
    if (!isAutoTrackerPreferenceEnabled()) return;
    try {
      const perm = await checkNotificationAccessPermission();
      setHasNotifPermission(perm);
      if (!perm) return;

      await drainAndProcessQueuedNotifications({
        accountsList,
        warehouseAccountsList,
        expenseCategories,
        incomeCategories,
        transactions,
        onNewTransactions: (newTxs) => {
          if (!newTxs || newTxs.length === 0) return;
          playPositiveChime();
          setTransactions(prev => [...newTxs, ...prev]);
          for (const tx of newTxs) {
            if (tx.type === 'expense') {
              checkAndTriggerBudgetNotifications(tx, transactions, expenseCategories);
            }
            showVoiceToast(`⚡ Transaksi ${tx.account || 'Akun'} Berhasil Dicatat: Rp ${Number(tx.amount || 0).toLocaleString('id-ID')}`);
          }
        }
      });
    } catch (e) {
      console.warn('[App] Error in processAutoTrackerQueue:', e);
    }
  }, [accountsList, warehouseAccountsList, expenseCategories, incomeCategories, transactions]);

  // Sync Notification Access permission & Assistant status when Profile modal opens
  React.useEffect(() => {
    if (isProfileModalOpen) {
      checkNotificationAccessPermission().then(setHasNotifPermission);
      checkAssistantActive().then(setIsAssistantActive);
    }
  }, [isProfileModalOpen]);

  // Auto-drain notification queue on mount and when app resumes from background
  React.useEffect(() => {
    // Proactively sync preferences and check permission on mount
    checkNotificationAccessPermission().then(perm => {
      setHasNotifPermission(perm);
      if (perm && isAutoTrackerPreferenceEnabled()) {
        NotificationTrackerNative.setTrackingEnabled({ enabled: true }).catch(() => {});
      }
      processAutoTrackerQueue();
    }).catch(() => {
      processAutoTrackerQueue();
    });

    checkAssistantActive().then(setIsAssistantActive);

    let notifResumeListener;
    import('@capacitor/app')
      .then(({ App: CapApp }) => {
        CapApp.addListener('appStateChange', ({ isActive }) => {
          if (isActive) {
            checkAssistantActive().then(setIsAssistantActive);
            processAutoTrackerQueue();
          }
        }).then(listener => {
          notifResumeListener = listener;
        });
      })
      .catch(() => {
        const handleVisibility = () => {
          if (document.visibilityState === 'visible') {
            checkAssistantActive().then(setIsAssistantActive);
            processAutoTrackerQueue();
          }
        };
        document.addEventListener('visibilitychange', handleVisibility);
        notifResumeListener = { remove: () => document.removeEventListener('visibilitychange', handleVisibility) };
      });

    return () => {
      if (notifResumeListener) notifResumeListener.remove();
    };
  }, [processAutoTrackerQueue]);

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

      // A1. Multi-Hapus (Lebih dari 1 transaksi berdasarkan jumlah / filter / waktu)
      if (result.isMultipleDelete) {
        let targetTxs = [];

        if (result.deleteAllMatching) {
          const now = new Date();
          const todayISO = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
          const yesterday = new Date(now);
          yesterday.setDate(yesterday.getDate() - 1);
          const yesterdayISO = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

          targetTxs = (transactions || []).filter(t => {
            if (result.timeRange === 'today' && t.date !== todayISO) return false;
            if (result.timeRange === 'yesterday' && t.date !== yesterdayISO) return false;
            if (result.targetCategory) {
              const tc = (result.targetCategory || '').toLowerCase();
              const matchCat = (t.category || '').toLowerCase() === tc || (t.categoryId || '').toLowerCase() === tc;
              if (!matchCat) return false;
            }
            if (result.targetQuery) {
              const tq = (result.targetQuery || '').toLowerCase();
              const matchTitle = (t.title || '').toLowerCase().includes(tq);
              const matchAcc = (t.account || '').toLowerCase().includes(tq);
              if (!matchTitle && !matchAcc) return false;
            }
            return true;
          });
        } else if (result.deleteCount) {
          const count = result.deleteCount === 'all' ? transactions.length : Math.min(transactions.length, Number(result.deleteCount) || 1);
          targetTxs = transactions.slice(0, count);
        }

        if (targetTxs.length === 0) {
          showVoiceToast('Tidak ditemukan transaksi yang cocok untuk dihapus');
          return;
        }

        const targetIds = new Set(targetTxs.map(t => t.id));
        setDeletingTxIds(Array.from(targetIds));
        playPopSound();
        showVoiceToast(`🗑️ Menghapus ${targetTxs.length} transaksi...`);

        setTimeout(() => {
          setTransactions(prev => prev.filter(t => !targetIds.has(t.id)));
          setDeletingTxIds([]);
          const labelDesc = result.deleteAllMatching
            ? (result.targetCategory || result.targetQuery || (result.timeRange === 'today' ? 'Hari Ini' : result.timeRange === 'yesterday' ? 'Kemarin' : 'semua'))
            : `${targetTxs.length} transaksi terakhir`;
          showVoiceToast(`✅ ${targetTxs.length} transaksi (${labelDesc}) berhasil dihapus`);
        }, 450);

        return;
      }

      // A2. Hapus Tunggal (Single Target Deletion)
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

    // A2. Perintah Ubah / Edit Transaksi Terakhir via Suara (Voice-Command EDIT)
    if (result.action === 'EDIT_LAST' || result.action === 'EDIT') {
      if (!transactions || transactions.length === 0) {
        showVoiceToast('Belum ada transaksi untuk diubah');
        return;
      }

      const targetTx = transactions[0];
      const updatedTx = { ...targetTx };
      const changeDescriptions = [];

      if (result.changes?.amount) {
        updatedTx.amount = parseFloat(result.changes.amount);
        changeDescriptions.push(`Rp ${updatedTx.amount.toLocaleString('id-ID')}`);
      }
      if (result.changes?.account) {
        updatedTx.account = result.changes.account;
        changeDescriptions.push(`Akun: ${updatedTx.account}`);
      }
      if (result.changes?.category) {
        updatedTx.category = result.changes.category.name;
        updatedTx.categoryId = result.changes.category.id || null;
        if (result.changes.category.iconClass) {
          updatedTx.iconClass = result.changes.category.iconClass;
        }
        changeDescriptions.push(`Kategori: ${updatedTx.category}`);
      }
      if (result.changes?.title) {
        updatedTx.title = result.changes.title;
        changeDescriptions.push(`"${updatedTx.title}"`);
      }

      setTransactions(prev => prev.map(t => t.id === targetTx.id ? updatedTx : t));
      playPositiveChime();
      showVoiceToast(`✏️ Transaksi terakhir diubah (${changeDescriptions.join(', ') || 'Berhasil'})`);
      return;
    }

    // A3. Perintah Transfer / Pindah Saldo Antar Akun via Suara (Voice-Command TRANSFER)
    if (result.action === 'TRANSFER') {
      const numericAmount = parseFloat(result.amount) || 0;
      if (numericAmount <= 0) return;

      const fromAcc = result.fromAccount || 'BCA';
      const toAcc = result.toAccount || 'Cash';
      const transferDate = result.date || getTodayISO();

      const txExpenseId = Date.now() + Math.floor(Math.random() * 500);
      const txExpense = {
        id: txExpenseId,
        title: result.note || `Transfer ke ${toAcc}`,
        category: 'Biaya Admin',
        categoryId: 'biayaAdmin',
        account: fromAcc,
        amount: numericAmount,
        type: 'expense',
        iconClass: 'bank-icon',
        date: transferDate,
        inputMethod: 'voice'
      };

      const txIncomeId = Date.now() + 500 + Math.floor(Math.random() * 500);
      const txIncome = {
        id: txIncomeId,
        title: `Transfer dari ${fromAcc}`,
        category: 'Bonus & Hadiah',
        categoryId: 'bonus',
        account: toAcc,
        amount: numericAmount,
        type: 'income',
        iconClass: 'bank-icon',
        date: transferDate,
        inputMethod: 'voice'
      };

      setTransactions(prev => [txIncome, txExpense, ...prev]);
      playPositiveChime();
      showVoiceToast(`🔄 Transfer Rp ${numericAmount.toLocaleString('id-ID')} (${fromAcc} ➔ ${toAcc}) tersimpan`);
      return;
    }

    // A4. Pertanyaan Finansial / Asisten Suara Interaktif AI (Voice Query AI)
    if (result.action === 'QUERY') {
      const now = new Date();
      const todayISO = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayISO = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;
      
      const curMonthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      
      // Filter transaksi berdasarkan rentang waktu
      const filterTxsByTime = (range) => {
        return (transactions || []).filter(t => {
          if (!t.date) return false;
          if (range === 'today') return t.date === todayISO;
          if (range === 'yesterday') return t.date === yesterdayISO;
          return t.date.startsWith(curMonthPrefix);
        });
      };

      const timeRange = result.timeRange || 'month';
      const timeLabel = timeRange === 'today' ? 'Hari Ini' : timeRange === 'yesterday' ? 'Kemarin' : 'Bulan Ini';
      const targetTxs = filterTxsByTime(timeRange);

      let queryModalData = null;

      if (result.queryType === 'BUDGET') {
        // Query Sisa Budget
        const monthExpenses = (transactions || []).filter(t => t.date && t.date.startsWith(curMonthPrefix) && t.type === 'expense');
        const totalSpent = monthExpenses.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
        const budgetLimit = mainMonthlyBudget || 0;
        const remainingBudget = Math.max(0, budgetLimit - totalSpent);
        const spentPercent = budgetLimit > 0 ? Math.round((totalSpent / budgetLimit) * 100) : 0;
        const isOver = budgetLimit > 0 && totalSpent > budgetLimit;

        const formattedRemaining = remainingBudget.toLocaleString('id-ID');
        const formattedTotalSpent = totalSpent.toLocaleString('id-ID');
        const formattedLimit = budgetLimit.toLocaleString('id-ID');

        queryModalData = {
          icon: '🎯',
          title: 'Sisa Budget Bulanan',
          subtitle: `Periode ${MONTH_NAMES_I18N['id'] ? MONTH_NAMES_I18N['id'][now.getMonth()] : 'Bulan Ini'} ${now.getFullYear()}`,
          rawSpokenText: result.rawText,
          primaryLabel: isOver ? 'Budget Terlewati' : 'Sisa Budget Anda',
          primaryAmount: budgetLimit > 0 ? (isOver ? totalSpent - budgetLimit : remainingBudget) : 'Belum Diatur',
          badge: budgetLimit > 0 ? {
            type: isOver ? 'danger' : spentPercent >= 80 ? 'warning' : 'success',
            text: isOver ? `Lebih ${spentPercent}%` : `${spentPercent}% terpakai`
          } : { type: 'neutral', text: 'Tanpa Limit' },
          details: [
            { icon: '🏷️', label: 'Batas Limit Budget', value: budgetLimit > 0 ? budgetLimit : 'Belum diatur' },
            { icon: '📤', label: 'Total Pengeluaran', value: totalSpent, highlight: true },
            { icon: '📊', label: 'Status Penggunaan', value: `${spentPercent}% dari total limit` }
          ],
          ttsMessage: budgetLimit > 0
            ? (isOver
                ? `Pengeluaran Anda bulan ini sudah mencapai Rp ${formattedTotalSpent}, melewati batas budget sebesar Rp ${formattedLimit}.`
                : `Sisa budget Anda bulan ini adalah Rp ${formattedRemaining} dari total batas Rp ${formattedLimit}.`)
            : `Anda belum mengatur batas budget untuk bulan ini. Total pengeluaran saat ini Rp ${formattedTotalSpent}.`
        };
      } else if (result.queryType === 'BALANCE') {
        // Query Saldo Akun / Total Saldo
        const getAccountStats = (accName) => {
          const rawInit = accountInitialBalances[accName];
          const initialBalance = typeof rawInit === 'number' && !isNaN(rawInit) ? rawInit : 0;
          const accTxs = (transactions || []).filter(t => (t.account || 'Cash').toLowerCase().trim() === (accName || '').toLowerCase().trim());
          const totalInc = accTxs.filter(t => t.type === 'income').reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
          const totalExp = accTxs.filter(t => t.type === 'expense').reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
          return initialBalance + totalInc - totalExp;
        };

        if (result.targetAccount) {
          // Saldo spesifik 1 akun
          const accBalance = getAccountStats(result.targetAccount);
          const formattedBal = accBalance.toLocaleString('id-ID');

          queryModalData = {
            icon: '💳',
            title: `Saldo ${result.targetAccount}`,
            subtitle: 'Informasi Saldo Terkini',
            rawSpokenText: result.rawText,
            primaryLabel: `Total Saldo di ${result.targetAccount}`,
            primaryAmount: accBalance,
            badge: { type: accBalance >= 0 ? 'success' : 'danger', text: result.targetAccount },
            details: [
              { icon: '🏦', label: 'Nama Akun / Rekening', value: result.targetAccount },
              { icon: '💰', label: 'Saldo Aktif', value: accBalance, highlight: true }
            ],
            ttsMessage: `Saldo Anda di ${result.targetAccount} saat ini adalah Rp ${formattedBal}.`
          };
        } else {
          // Total seluruh saldo dari seluruh akun
          const allAccs = Array.from(new Set([
            ...(accountsList || []),
            ...(warehouseAccountsList || []),
            ...Object.keys(accountInitialBalances || {}),
            ...(transactions || []).map(t => t.account || 'Cash')
          ])).filter(Boolean);

          let grandTotalBalance = 0;
          const accBreakdown = [];

          allAccs.forEach(acc => {
            const bal = getAccountStats(acc);
            grandTotalBalance += bal;
            if (bal !== 0) {
              accBreakdown.push({ icon: '💳', label: acc, value: bal });
            }
          });

          const formattedGrand = grandTotalBalance.toLocaleString('id-ID');

          queryModalData = {
            icon: '💰',
            title: 'Total Saldo Keuangan',
            subtitle: `Akumulasi dari ${allAccs.length} Akun & Dompet`,
            rawSpokenText: result.rawText,
            primaryLabel: 'Total Saldo Keseluruhan',
            primaryAmount: grandTotalBalance,
            badge: { type: 'success', text: `${allAccs.length} Akun` },
            details: accBreakdown.slice(0, 5),
            ttsMessage: `Total seluruh saldo Anda saat ini adalah Rp ${formattedGrand}.`
          };
        }
      } else if (result.queryType === 'INCOME') {
        // Query Pemasukan
        const incTxs = targetTxs.filter(t => t.type === 'income');
        const totalIncome = incTxs.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
        const formattedIncome = totalIncome.toLocaleString('id-ID');

        // Kategori pemasukan teratas
        const catMap = {};
        incTxs.forEach(t => {
          const k = t.category || 'Lainnya';
          catMap[k] = (catMap[k] || 0) + (Number(t.amount) || 0);
        });
        const topCats = Object.entries(catMap)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 4)
          .map(([k, v]) => ({ icon: '📥', label: k, value: v }));

        queryModalData = {
          icon: '📈',
          title: `Pemasukan (${timeLabel})`,
          subtitle: `${incTxs.length} Transaksi Tercatat`,
          rawSpokenText: result.rawText,
          primaryLabel: `Total Pemasukan ${timeLabel}`,
          primaryAmount: totalIncome,
          badge: { type: 'success', text: `${incTxs.length} Pemasukan` },
          details: topCats.length > 0 ? topCats : [
            { icon: '📝', label: 'Jumlah Transaksi', value: `${incTxs.length} kali` }
          ],
          ttsMessage: totalIncome > 0
            ? `Total pemasukan Anda ${timeLabel.toLowerCase()} adalah Rp ${formattedIncome} dari ${incTxs.length} transaksi.`
            : `Belum ada catatan pemasukan untuk ${timeLabel.toLowerCase()}.`
        };
      } else if (result.queryType === 'CATEGORY' && result.targetCategory) {
        // Query Kategori Tertentu (misal Kopi, Bensin, Makanan)
        const catQuery = (result.targetCategory || '').toLowerCase();
        const catTxs = targetTxs.filter(t => {
          const cName = (t.category || '').toLowerCase();
          const cId = (t.categoryId || '').toLowerCase();
          const cTitle = (t.title || '').toLowerCase();
          return cName.includes(catQuery) || cId.includes(catQuery) || cTitle.includes(catQuery);
        });

        const totalCatSpent = catTxs.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
        const formattedCatSpent = totalCatSpent.toLocaleString('id-ID');

        queryModalData = {
          icon: '🏷️',
          title: `Pengeluaran ${result.targetCategory}`,
          subtitle: `Periode ${timeLabel} • ${catTxs.length} Transaksi`,
          rawSpokenText: result.rawText,
          primaryLabel: `Total Pengeluaran ${result.targetCategory}`,
          primaryAmount: totalCatSpent,
          badge: { type: totalCatSpent > 0 ? 'warning' : 'neutral', text: `${catTxs.length}x Beli` },
          details: catTxs.slice(0, 4).map(t => ({
            icon: '☕',
            label: t.title || t.category,
            value: Number(t.amount) || 0
          })),
          ttsMessage: totalCatSpent > 0
            ? `Pengeluaran untuk ${result.targetCategory} ${timeLabel.toLowerCase()} adalah Rp ${formattedCatSpent} dari ${catTxs.length} transaksi.`
            : `Belum ada pengeluaran untuk ${result.targetCategory} ${timeLabel.toLowerCase()}.`
        };
      } else {
        // Default: Query Pengeluaran (Today / Month / Yesterday)
        const expTxs = targetTxs.filter(t => t.type === 'expense');
        const totalExpense = expTxs.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
        const formattedExpense = totalExpense.toLocaleString('id-ID');

        // Kategori pengeluaran teratas
        const catMap = {};
        expTxs.forEach(t => {
          const k = t.category || 'Lainnya';
          catMap[k] = (catMap[k] || 0) + (Number(t.amount) || 0);
        });
        const topCats = Object.entries(catMap)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 4)
          .map(([k, v]) => ({ icon: '🏷️', label: k, value: v }));

        queryModalData = {
          icon: '📉',
          title: `Pengeluaran (${timeLabel})`,
          subtitle: `${expTxs.length} Transaksi Pengeluaran`,
          rawSpokenText: result.rawText,
          primaryLabel: `Total Pengeluaran ${timeLabel}`,
          primaryAmount: totalExpense,
          badge: { type: 'danger', text: `${expTxs.length} Transaksi` },
          details: topCats.length > 0 ? topCats : [
            { icon: '📝', label: 'Jumlah Transaksi', value: `${expTxs.length} kali` }
          ],
          ttsMessage: totalExpense > 0
            ? `Total pengeluaran Anda ${timeLabel.toLowerCase()} adalah Rp ${formattedExpense} dari ${expTxs.length} transaksi.`
            : `Belum ada catatan pengeluaran untuk ${timeLabel.toLowerCase()}.`
        };
      }

      setVoiceQueryData(queryModalData);
      setIsVoiceQueryResultOpen(true);
      playPositiveChime();
      return;
    }

    // B. Simpan Transaksi Baru
    const catName = result.category.name;
    const catIconClass = result.category.iconClass || 'food-icon';
    let finalTitle = (result.note || '').trim() || catName;
    finalTitle = finalTitle.replace(/\b(dan)\b/gi, '&').replace(/\s+/g, ' ').trim();

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

    const txDate = result.date || getTodayISO();
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
      date: txDate,
      inputMethod: 'voice'
    };

    if (result.type === 'Expense') {
      playPositiveChime();
      checkAndTriggerBudgetNotifications(newTx, transactions, expenseCategories);
    }

    // Aktifkan efek animasi ketik & timbul dari belakang
    setVoiceAnimatingTxIds(prev => new Set(prev).add(newTxId));
    setTransactions(prev => [newTx, ...prev]);
    
    const splitLabel = result.isSplitBill ? ` (Split ${result.splitPersonCount} org)` : '';
    const timeLabel = result.detectedTimePhrase ? ` (${result.detectedTimePhrase})` : (result.date && result.date !== getTodayISO() ? ` (${result.date})` : '');
    showVoiceToast(`✅ "${finalTitle}" Rp ${numericAmount.toLocaleString('id-ID')}${splitLabel}${timeLabel} tersimpan`);

    // Sinyal sukses ke Guided Tour jika sedang aktif
    window.dispatchEvent(new CustomEvent('cassiel_tour_voice_success', {
      detail: { result: newTx }
    }));
  };

  // Save Transaction
  const handleSaveTransaction = () => {
    const catName = selectedCategory.name;
    const catIconClass = selectedCategory.iconClass || 'food-icon';

    let finalTitle = note.trim() || catName;
    finalTitle = finalTitle.replace(/\b(dan)\b/gi, '&').replace(/\s+/g, ' ').trim();

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

    if (editingTransactionId) {
      setTransactions(prev => prev.map(t => {
        if (t.id === editingTransactionId) {
          return {
            ...t,
            title: finalTitle,
            category: catName,
            categoryId: selectedCategory.id || null,
            account: account,
            amount: numericAmount,
            type: transType.toLowerCase(),
            iconClass: catIconClass,
            date: selectedDateVal || t.date || getTodayISO(),
            autoTracked: false,
            inputMethod: 'manual'
          };
        }
        return t;
      }));
      setEditingTransactionId(null);
    } else {
      if (transType === 'Expense') {
        playPositiveChime();
        checkAndTriggerBudgetNotifications(newTx, transactions, expenseCategories);
      }
      setTransactions(prev => [newTx, ...prev]);
    }

    setExpenseAmountVal('');
    setIncomeAmountVal('');
    setNote('');
    setActivePanel('amount');
    setIsAddModalOpen(false);
    setIsNoteSuggestionsOpen(false);
  };

  // Compute Balances (All Time)
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

  // Monthly Income for current navigated month
  const currentMonthIncome = useMemo(() => {
    const targetYear = currentDate.getFullYear();
    const targetMonth = currentDate.getMonth();
    return transactions
      .filter(t => {
        if (t.type !== 'income' || !t.date) return false;
        const [y, m] = t.date.split('-');
        return Number(y) === targetYear && Number(m) - 1 === targetMonth;
      })
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  }, [transactions, currentDate]);

  // Net Balance for current navigated month
  const currentMonthBalance = currentMonthIncome - currentMonthExpenses;

  // Target Expense Amount based on active quick filter (with Cash Counter animation)
  const targetExpenseAmount = useMemo(() => {
    if (expenseDateFilter === 'month') {
      return currentMonthExpenses;
    }

    const now = new Date();
    const toDateStr = (d) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    };

    if (expenseDateFilter === 'today') {
      const todayStr = toDateStr(now);
      return transactions
        .filter(t => t.type === 'expense' && t.date === todayStr)
        .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
    }

    if (expenseDateFilter === 'yesterday') {
      const yDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
      const yStr = toDateStr(yDate);
      return transactions
        .filter(t => t.type === 'expense' && t.date === yStr)
        .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
    }

    let daysBack = 2; // 3 days: today (0), yesterday (1), 2 days ago (2)
    if (expenseDateFilter === '3days') daysBack = 2;
    else if (expenseDateFilter === '1week') daysBack = 6; // 7 days: today + past 6 days
    else if (expenseDateFilter === '2weeks') daysBack = 13; // 14 days: today + past 13 days

    const startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysBack);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    endDate.setHours(23, 59, 59, 999);

    return transactions
      .filter(t => {
        if (t.type !== 'expense' || !t.date) return false;
        const parts = t.date.split('-');
        if (parts.length < 3) return false;
        const txDate = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        return txDate >= startDate && txDate <= endDate;
      })
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  }, [transactions, currentMonthExpenses, expenseDateFilter]);

  const animatedExpenseAmount = useCashCounter(targetExpenseAmount, 1200);

  // Monthly Expenses per Category for current navigated month
  const currentMonthExpensesByCategory = useMemo(() => {
    const targetYear = currentDate.getFullYear();
    const targetMonth = currentDate.getMonth();
    const map = {};
    const monthExpenses = transactions.filter(t => {
      if (t.type !== 'expense' || !t.date) return false;
      const [y, m] = t.date.split('-');
      return Number(y) === targetYear && Number(m) - 1 === targetMonth;
    });

    (allBudgetCategories || []).forEach(cat => {
      const catTotal = monthExpenses
        .filter(t => (cat.id && t.categoryId === cat.id) || (cat.name && t.category === cat.name))
        .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
      
      map[cat.id] = catTotal;
      map[cat.name] = catTotal;
    });

    return map;
  }, [transactions, currentDate, allBudgetCategories]);

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

  // Centralized Financial Insights Data (V1 Insight Engine)
  const financialInsightsData = useMemo(() => {
    return generateFinancialInsights({
      transactions,
      monthlyBudgetsMap,
      currentDate,
      allBudgetCategories,
      appLanguage,
      fmtMoney,
      getCategoryName
    });
  }, [transactions, monthlyBudgetsMap, currentDate, allBudgetCategories, appLanguage, fmtMoney, getCategoryName]);

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
    const minYSpacing = 26;
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

            <div className="top-bar-right">
              {/* Privacy Eye Toggle Button & ML-style Pointer Guide */}
              <div className="privacy-eye-wrapper">
                <button
                  type="button"
                  className={`privacy-toggle-btn ${isHomeAmountsHidden ? 'hidden-active' : ''}`}
                  onClick={handleToggleHideHomeAmounts}
                  title={isHomeAmountsHidden ? 'Tampilkan Nominal' : 'Sembunyikan Nominal'}
                  aria-label={isHomeAmountsHidden ? 'Tampilkan Nominal' : 'Sembunyikan Nominal'}
                >
                  {isHomeAmountsHidden ? (
                    /* Eye Closed / Slashed SVG */
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    /* Eye Open SVG */
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>

                {/* First-Time User Pointer Guide (Premium Hand Tap Gesture - Zero Text) */}
                {showPrivacyPointerHint && (
                  <div className="privacy-pointer-guide-container" onClick={handleToggleHideHomeAmounts}>
                    {/* Pulsing Target Ring */}
                    <div className="privacy-target-pulse" />

                    {/* Premium Flaticon/ML Style Hand Pointer (Clean Forehand 3D Gradient Glove) */}
                    <div className="privacy-guide-hand">
                      <svg width="40" height="40" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                          {/* Rich Drop Shadow */}
                          <filter id="flaticonHandShadow" x="-20%" y="-15%" width="140%" height="145%">
                            <feDropShadow dx="0" dy="4" stdDeviation="3.5" floodColor="#1E293B" floodOpacity="0.28" />
                          </filter>
                          {/* Smooth Glove Gradient */}
                          <linearGradient id="handGloveGrad" x1="16" y1="6" x2="48" y2="58" gradientUnits="userSpaceOnUse">
                            <stop offset="0%" stopColor="#FFFFFF" />
                            <stop offset="55%" stopColor="#F8FAFC" />
                            <stop offset="100%" stopColor="#E2E8F0" />
                          </linearGradient>
                          {/* Fingertip Tap Accent Glow */}
                          <radialGradient id="tapFingerGlow" cx="25" cy="11" r="9" gradientUnits="userSpaceOnUse">
                            <stop offset="0%" stopColor="#60A5FA" stopOpacity="0.35" />
                            <stop offset="100%" stopColor="#60A5FA" stopOpacity="0" />
                          </radialGradient>
                          {/* Blue Accent Ring on Wrist */}
                          <linearGradient id="cuffGrad" x1="20" y1="52" x2="44" y2="52" gradientUnits="userSpaceOnUse">
                            <stop offset="0%" stopColor="#2D5284" />
                            <stop offset="100%" stopColor="#1E3A5F" />
                          </linearGradient>
                        </defs>
                        <g filter="url(#flaticonHandShadow)">
                          {/* Main Smooth Hand Silhouette */}
                          <path 
                            d="M25 6 C22.2 6 20 8.2 20 11 L20 30 C18.2 28.8 15.6 28.6 13.6 29.8 C10.9 31.4 10 34.8 11.6 37.5 L19.8 51.2 C22 54.8 26.2 57 30.5 57 L37 57 C45.3 57 51 51 51 43 L51 28.5 C51 26 49 24 46.5 24 C45.8 24 45.1 24.2 44.5 24.5 C43.8 22.5 42 21 39.8 21 C39 21 38.3 21.2 37.6 21.6 C36.8 19.8 35 18.5 32.8 18.5 C32.2 18.5 31.6 18.6 31 18.9 L31 11 C31 8.2 28.8 6 25 6 Z" 
                            fill="url(#handGloveGrad)" 
                            stroke="#1E293B" 
                            strokeWidth="2.8" 
                            strokeLinecap="round"
                            strokeLinejoin="round" 
                          />

                          {/* Index Finger Tap Light Glow */}
                          <circle cx="25" cy="11" r="7.5" fill="url(#tapFingerGlow)" />

                          {/* Finger Seams & Joint Creases */}
                          <path d="M25.5 14 L25.5 32" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" />
                          <path d="M31 23 L31 34" stroke="#94A3B8" strokeWidth="1.8" strokeLinecap="round" />
                          <path d="M37.5 25.5 L37.5 35" stroke="#94A3B8" strokeWidth="1.8" strokeLinecap="round" />
                          <path d="M44.5 28 L44.5 36" stroke="#94A3B8" strokeWidth="1.8" strokeLinecap="round" />

                          {/* Thumb Fold Detail */}
                          <path d="M20 32 C18.5 35 18.5 39 22 43" stroke="#CBD5E1" strokeWidth="2.2" strokeLinecap="round" fill="none" />

                          {/* Stylish Wrist Cuff */}
                          <path d="M24 55 L43 55" stroke="url(#cuffGrad)" strokeWidth="4.2" strokeLinecap="round" />
                        </g>
                      </svg>
                    </div>
                  </div>
                )}
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
            </div>
          </header>

          {/* Balance Cards */}
          <section className="balance-section">
            <div 
              className="balance-card expenses-card balance-card-clickable"
              onClick={() => setActiveBalanceDetail({
                type: 'expense',
                label: t('expenses'),
                amount: animatedExpenseAmount,
                color: 'var(--card-expense-text)',
                bgColor: 'var(--card-expense-bg)',
                icon: '▼'
              })}
              role="button"
              tabIndex={0}
            >
              <div className="card-label-row">
                <span className="card-label">{t('expenses')}</span>
                <span className="icon-down">▼</span>
              </div>
              <div className="amount-container">
                <span className="amount">{fmtHomeMoney(animatedExpenseAmount)}</span>
              </div>
            </div>
            <div 
              className="balance-card income-card balance-card-clickable"
              onClick={() => setActiveBalanceDetail({
                type: 'income',
                label: t('income'),
                amount: currentMonthIncome,
                color: 'var(--card-income-text)',
                bgColor: 'var(--card-income-bg)',
                icon: '▲'
              })}
              role="button"
              tabIndex={0}
            >
              <div className="card-label-row">
                <span className="card-label">{t('income')}</span>
                <span className="icon-up">▲</span>
              </div>
              <div className="amount-container">
                <span className="amount">{fmtHomeMoney(currentMonthIncome)}</span>
              </div>
            </div>
            <div 
              className="balance-card total-card balance-card-clickable"
              onClick={() => setActiveBalanceDetail({
                type: 'total',
                label: t('total'),
                amount: currentMonthBalance,
                color: 'var(--text-main, #333333)',
                bgColor: '#E6EEFA',
                icon: '💰'
              })}
              role="button"
              tabIndex={0}
            >
              <div className="card-label-row">
                <span className="card-label">{t('total')}</span>
                <span className="icon-total font-bold">💰</span>
              </div>
              <div className="amount-container">
                <span className="amount">{fmtHomeMoney(currentMonthBalance)}</span>
              </div>
            </div>
          </section>

          {/* 🌟 V1 Intelligent Financial Insight Card (Home - First Insight) */}
          {isCurrentMonth && financialInsightsData && financialInsightsData.highestPriorityInsight && financialInsightsData.totalCurrentExpense > 0 && dismissedInsightMap[financialInsightsData.periodKey] !== financialInsightsData.highestPriorityInsight.id && (
            <div className="home-insight-card">
              {/* 1. Header: Badge Sparkle & Date Range Pill + Dismiss Button */}
              <div className="home-insight-top-badge-row">
                <div className="home-insight-badge-left">
                  <span className="home-insight-badge-icon">✨</span>
                  <span>{t('insightThisMonth') || 'Insight Bulan Ini'}</span>
                </div>
                <div className="home-insight-top-right-group">
                  <div className="home-insight-period-pill">
                    {formatActivePeriodRange(currentDate, transactions, appLanguage)}
                  </div>
                  <button
                    type="button"
                    className="home-insight-dismiss-btn"
                    onClick={() => handleDismissInsight(financialInsightsData.periodKey, financialInsightsData.highestPriorityInsight.id)}
                    title={t('dismissInsight') || 'Tutup Insight / Sudah Dilihat'}
                    aria-label="Tutup insight"
                  >
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                </div>
              </div>

              {/* 2. Content Row: Narrative Headline & Mini Donut Chart */}
              <div className="home-insight-content-row">
                <div className="home-insight-text-col">
                  <h4 className="home-insight-headline">
                    {financialInsightsData.highestPriorityInsight.headline}
                  </h4>
                  {financialInsightsData.highestPriorityInsight.subDescription && (
                    <p className="home-insight-subdesc">
                      {financialInsightsData.highestPriorityInsight.subDescription}
                    </p>
                  )}
                </div>

                {/* Mini Ring/Donut Chart */}
                <div className="home-insight-donut-wrapper">
                  <svg viewBox="0 0 36 36" className="home-insight-donut-svg">
                    {/* Background Track */}
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="#F3ECE4"
                      strokeWidth="4.2"
                    />
                    {/* Slices */}
                    {(() => {
                      let accumulatedPct = 0;
                      const donutColors = ['#FFD166', '#06D6A0', '#118AB2', '#EF476F', '#7209B7'];
                      const slicesToRender = financialInsightsData.donutData.slices.slice(0, 4);

                      return slicesToRender.map((slice, sIdx) => {
                        const dashArray = `${slice.percentage} ${100 - slice.percentage}`;
                        const dashOffset = -accumulatedPct;
                        accumulatedPct += slice.percentage;

                        return (
                          <path
                            key={slice.id || sIdx}
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            fill="none"
                            stroke={donutColors[sIdx % donutColors.length]}
                            strokeWidth="4.2"
                            strokeDasharray={dashArray}
                            strokeDashoffset={dashOffset}
                            strokeLinecap="round"
                          />
                        );
                      });
                    })()}
                  </svg>
                  <div className="home-insight-donut-center">
                    <span className="donut-center-pct">
                      {isHomeAmountsHidden ? '••%' : `${financialInsightsData.donutData.topCategoryPercentage}%`}
                    </span>
                    <span className="donut-center-label">
                      {financialInsightsData.donutData.topCategoryName}
                    </span>
                  </div>
                </div>
              </div>

              {/* 3. Horizontal Scrollable Quick Metric Chips */}
              {financialInsightsData.quickMetricChips && financialInsightsData.quickMetricChips.length > 0 && (
                <div className="home-insight-chips-scroll">
                  {financialInsightsData.quickMetricChips.map((chip, cIdx) => (
                    <div 
                      key={chip.id || cIdx} 
                      className="home-insight-metric-chip"
                      onClick={() => handleOpenCategoryInsight(chip)}
                      style={{ cursor: 'pointer' }}
                    >
                      <div 
                        className={`metric-chip-icon-box ${resolveIconClass(chip)}`}
                      >
                        {resolveIcon(chip) ? (
                          <img src={resolveIcon(chip)} alt={chip.displayName} />
                        ) : (
                          <span>🏷️</span>
                        )}
                      </div>
                      <div className="metric-chip-info">
                        <span className="metric-chip-name">{chip.displayName}</span>
                        <span className="metric-chip-amount">{fmtHomeMoney(chip.amount)}</span>
                        <span className={`metric-chip-status ${chip.badgeType}`}>
                          {chip.badgeText}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* 4. Action Button: Navigasi ke Stats */}
              <button
                type="button"
                className="home-insight-cta-btn"
                onClick={() => setActiveTab('stats')}
              >
                <div className="home-insight-cta-left">
                  <span className="home-insight-cta-icon">📊</span>
                  <span>{t('viewFullAnalysis') || 'Lihat analisis lengkap'}</span>
                </div>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 18l6-6-6-6"/>
                </svg>
              </button>
            </div>
          )}

          {/* Home Transaction Filter Tabs (Income / Expense) */}
          {transactions.length > 0 && (
            <div 
              className="home-tx-filter-bar"
              style={{ zIndex: isExpenseDropdownOpen && homeTxFilter === 'expense' ? 1150 : 5 }}
            >
              <div className={`home-tx-filter-indicator ${homeTxFilter === 'expense' ? 'to-expense' : 'to-income'}`} />
              <button
                type="button"
                className={`home-tx-filter-btn ${homeTxFilter === 'income' ? 'active income-active' : ''}`}
                onClick={() => {
                  setHomeTxFilter('income');
                  setIsExpenseDropdownOpen(false);
                }}
              >
                <span className="home-tx-filter-btn-text">{t('filterIncome')}</span>
              </button>
              <div style={{ flex: 1, position: 'relative', display: 'flex' }}>
                <button
                  type="button"
                  className={`home-tx-filter-btn ${homeTxFilter === 'expense' ? 'active expense-active' : ''}`}
                  style={{ width: '100%' }}
                  onClick={() => {
                    if (homeTxFilter !== 'expense') {
                      setHomeTxFilter('expense');
                      setIsExpenseDropdownOpen(false);
                    }
                  }}
                >
                  <span className="home-tx-filter-btn-text">{t('filterExpense')}</span>
                  <span 
                    className={`capsule-dropdown-arrow ${isExpenseDropdownOpen && homeTxFilter === 'expense' ? 'open' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (homeTxFilter !== 'expense') {
                        setHomeTxFilter('expense');
                        setIsExpenseDropdownOpen(true);
                      } else {
                        setIsExpenseDropdownOpen(prev => !prev);
                      }
                    }}
                  >
                    <svg width="10" height="6" viewBox="0 0 10 6" fill="currentColor">
                      <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                    </svg>
                  </span>
                </button>

                {/* Dropdown Menu Filter */}
                {isExpenseDropdownOpen && homeTxFilter === 'expense' && (
                  <>
                    <div 
                      className="dropdown-backdrop-transparent" 
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsExpenseDropdownOpen(false);
                      }} 
                    />
                    <div 
                      className="expense-filter-dropdown"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {[
                        { id: 'month', label: 'Bulan Ini' },
                        { id: 'today', label: 'Hari Ini' },
                        { id: 'yesterday', label: 'Kemarin' },
                        { id: '3days', label: '3 Hari Lalu' },
                        { id: '1week', label: '1 Minggu Lalu' },
                        { id: '2weeks', label: '2 Minggu Lalu' },
                      ].map((opt) => {
                        const isActive = expenseDateFilter === opt.id;
                        return (
                          <div
                            key={opt.id}
                            className={`expense-filter-option ${isActive ? 'active' : ''}`}
                            onClick={() => {
                              setExpenseDateFilter(opt.id);
                              setIsExpenseDropdownOpen(false);
                            }}
                          >
                            <span className="expense-filter-label">{opt.label}</span>
                            {isActive && <span className="expense-filter-check">✓</span>}
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Transactions List Grouped by Date */}
          <section className="transactions-container transactions-container-animated" key={`${formatMonthYear(currentDate)}-${homeTxFilter}-${expenseDateFilter}`}>
            {(() => {
              const targetYear = currentDate.getFullYear();
              const targetMonth = currentDate.getMonth();

              const displayedHomeTransactions = transactions.filter(tx => {
                if (!tx.date) return false;
                const [y, m] = tx.date.split('-');
                const txYear = Number(y);
                const txMonth = Number(m) - 1;

                if (homeTxFilter === 'income') {
                  if (tx.type !== 'income') return false;
                  return txYear === targetYear && txMonth === targetMonth;
                }

                if (homeTxFilter === 'expense') {
                  if (tx.type !== 'expense') return false;
                  if (expenseDateFilter === 'month') {
                    return txYear === targetYear && txMonth === targetMonth;
                  }

                  const now = new Date();
                  const toDateStr = (d) => {
                    const y = d.getFullYear();
                    const m = String(d.getMonth() + 1).padStart(2, '0');
                    const day = String(d.getDate()).padStart(2, '0');
                    return `${y}-${m}-${day}`;
                  };

                  if (expenseDateFilter === 'today') {
                    const todayStr = toDateStr(now);
                    return tx.date === todayStr;
                  }

                  if (expenseDateFilter === 'yesterday') {
                    const yDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
                    return tx.date === toDateStr(yDate);
                  }

                  let daysBack = 2;
                  if (expenseDateFilter === '3days') daysBack = 2;
                  else if (expenseDateFilter === '1week') daysBack = 6;
                  else if (expenseDateFilter === '2weeks') daysBack = 13;

                  const startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysBack);
                  startDate.setHours(0, 0, 0, 0);
                  const endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                  endDate.setHours(23, 59, 59, 999);

                  const parts = tx.date.split('-');
                  if (parts.length < 3) return false;
                  const txDate = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
                  return txDate >= startDate && txDate <= endDate;
                }

                return txYear === targetYear && txMonth === targetMonth;
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
                const txDate = tx.date || getTodayISO();
                if (!groupedMap[txDate]) {
                  groupedMap[txDate] = [];
                }
                groupedMap[txDate].push(tx);
              });

              // Sort dates descending
              const sortedDates = Object.keys(groupedMap).sort((a, b) => b.localeCompare(a));

              return sortedDates.map((dateKey, dateIdx) => {
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
                        {homeTxFilter !== 'expense' && (
                          <span className="day-income-amount">{fmtHomeMoney(dayIncome)}</span>
                        )}
                        {homeTxFilter !== 'income' && (
                          <span className="day-expense-amount">{fmtHomeMoney(dayExpense)}</span>
                        )}
                      </div>
                    </div>

                    {/* Transaction Items under this date */}
                    <div className="date-group-items">
                      {groupTxs.map((item, itemIdx) => {
                        const isFirstTx = dateIdx === 0 && itemIdx === 0;
                        const firstTxClass = isFirstTx ? 'tour-target-first-tx' : '';

                        const isTxDeleting = deletingTxId === item.id || deletingTxIds.includes(item.id);

                        if (voiceAnimatingTxIds.has(item.id)) {
                          return (
                            <VoiceAnimatedTransactionItem
                              key={item.id}
                              item={item}
                              resolveIcon={resolveIcon}
                              isDeleting={isTxDeleting}
                              onAnimationComplete={handleVoiceAnimationComplete}
                              onSelectTx={setActiveTxDetail}
                              onEditTx={handleEditTransaction}
                              className={firstTxClass}
                            />
                          );
                        }

                        return (
                          <div 
                            className={`transaction-item ${resolveCardBgClass(item)} ${isTxDeleting ? 'deleting-sink' : ''} ${firstTxClass}`} 
                            key={item.id}
                            onClick={() => setActiveTxDetail(item)}
                            role="button"
                            tabIndex={0}
                          >
                            <div className={`transaction-icon ${item.iconClass}`}>
                              {resolveIcon(item) && <img src={resolveIcon(item)} alt={item.category} />}
                            </div>
                            <div className="transaction-details">
                              <span className="transaction-title">{item.title}</span>
                              <span className="transaction-category">{getCategoryName(item.category, appLanguage)} • {item.account || 'BRImo'}</span>
                            </div>
                            <div className="transaction-actions-right">
                              {isAutoTrackedTx(item) && (
                                <button 
                                  type="button" 
                                  className="tx-edit-capsule-btn"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditTransaction(item);
                                  }}
                                  title="Edit Transaksi Otomatis"
                                  aria-label="Edit Transaksi Otomatis"
                                >
                                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                  </svg>
                                  <span>Edit</span>
                                </button>
                              )}
                              <div className={`transaction-amount ${item.type === 'expense' ? 'negative' : 'positive'}`}>
                                {item.type === 'expense' ? '-' : '+'}{fmtHomeMoney(item.amount)}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              });
            })()}
          </section>
        </div>
      )}

      {/* Account View (Redesigned: Saldo Tercatat Cassiel) */}
      {activeTab === 'accounts' && (
        <div className="accounts-page-container tab-page-transition">
          {(() => {
            // Kalkulasi metrik saldo per akun
            const getAccountStats = (accName) => {
              const rawInit = accountInitialBalances[accName];
              const hasRecordedBalance = typeof rawInit === 'number' && !isNaN(rawInit);
              const initialBalance = hasRecordedBalance ? rawInit : 0;

              // Transaksi akun ini (sepanjang masa)
              const accTxs = transactions.filter(t => (t.account || 'Cash').toLowerCase().trim() === (accName || '').toLowerCase().trim());
              const totalIncome = accTxs.filter(t => t.type === 'income').reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
              const totalExpense = accTxs.filter(t => t.type === 'expense').reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
              
              const currentBalance = initialBalance + totalIncome - totalExpense;

              return {
                hasInitialBalance: hasRecordedBalance,
                hasRecordedBalance,
                initialBalance,
                totalIncome,
                totalExpense,
                currentBalance,
                txCount: accTxs.length,
                transactions: accTxs
              };
            };

            // Kumpulkan seluruh akun unik dari accountsList, warehouse, initial balances, dan transaksi
            const allPageAccountsMap = new Map();
            (accountsList || []).forEach(a => {
              if (a && a.trim()) {
                const key = a.toLowerCase().trim();
                if (!allPageAccountsMap.has(key)) allPageAccountsMap.set(key, a.trim());
              }
            });
            (warehouseAccountsList || []).forEach(a => {
              if (a && a.trim()) {
                const key = a.toLowerCase().trim();
                if (!allPageAccountsMap.has(key)) allPageAccountsMap.set(key, a.trim());
              }
            });
            Object.keys(accountInitialBalances || {}).forEach(a => {
              if (a && a.trim()) {
                const key = a.toLowerCase().trim();
                if (!allPageAccountsMap.has(key)) allPageAccountsMap.set(key, a.trim());
              }
            });
            (transactions || []).forEach(t => {
              if (t && t.account && t.account.trim()) {
                const key = t.account.toLowerCase().trim();
                if (!allPageAccountsMap.has(key)) allPageAccountsMap.set(key, t.account.trim());
              }
            });
            const allPageAccounts = Array.from(allPageAccountsMap.values());

            // Hitung total saldo tercatat dari seluruh akun dan pisahkan Rekening Bank vs E-Wallet vs Kartu Kredit (tanpa Cash)
            let totalRecordedBalance = 0;
            let totalBankBalance = 0;
            let totalEwalletBalance = 0;
            let totalCreditCardBalance = 0;

            const isCreditCardAccount = (accName) => {
              const norm = (accName || '').toLowerCase().trim();
              const def = DEFAULT_ACCOUNTS.find(a => (a.name || '').toLowerCase() === norm || (a.id || '').toLowerCase() === norm);
              if (def) {
                return def.type === 'credit_card';
              }
              return norm.includes('card') || norm.includes('kartu kredit') || norm.includes('kredit') || 
                     norm.includes(' cc') || norm.includes('credit') || norm.includes('visa') || 
                     norm.includes('mastercard') || norm.includes('jcb') || norm.includes('amex');
            };

            const isBankAccount = (accName) => {
              const norm = (accName || '').toLowerCase().trim();
              const def = DEFAULT_ACCOUNTS.find(a => (a.name || '').toLowerCase() === norm || (a.id || '').toLowerCase() === norm);
              if (def) {
                return def.type === 'bank';
              }
              return (norm.includes('bank') || norm.includes('bca') || norm.includes('bri') || norm.includes('bni') || 
                     norm.includes('mandiri') || norm.includes('bsi') || norm.includes('cimb') || norm.includes('btn') ||
                     norm.includes('jago') || norm.includes('blu') || norm.includes('jenius') || norm.includes('seabank') ||
                     norm.includes('permata') || norm.includes('maybank') || norm.includes('danamon')) &&
                     !norm.includes('card') && !norm.includes('kredit') && !norm.includes(' cc');
            };

            const isEwalletAccount = (accName) => {
              const norm = (accName || '').toLowerCase().trim();
              const def = DEFAULT_ACCOUNTS.find(a => (a.name || '').toLowerCase() === norm || (a.id || '').toLowerCase() === norm);
              if (def) {
                return def.type === 'ewallet';
              }
              return norm.includes('gopay') || norm.includes('ovo') || norm.includes('dana') || 
                     norm.includes('shopee') || norm.includes('linkaja') || norm.includes('qris') || 
                     norm.includes('paypal') || norm.includes('wallet') || norm.includes('dompet digital');
            };

            allPageAccounts.forEach(acc => {
              const stats = getAccountStats(acc);
              if (stats.hasRecordedBalance) {
                totalRecordedBalance += stats.currentBalance;
                if (isCreditCardAccount(acc)) {
                  totalCreditCardBalance += stats.currentBalance;
                } else if (isBankAccount(acc)) {
                  totalBankBalance += stats.currentBalance;
                } else if (isEwalletAccount(acc)) {
                  totalEwalletBalance += stats.currentBalance;
                }
              }
            });

            return (
              <>
                {/* 1. Hero Summary Card (Identical Gradient to Budget Hero + dompet.svg) */}
                <div className="account-hero-card floating-hero-card">
                  <div className="account-hero-top-row">
                    <div className="account-hero-title-group">
                      <span className="account-hero-subtitle-top">
                        {t('totalBalanceInCassiel') || 'Total saldo di Cassiel'}
                      </span>
                      <h1 className="account-hero-amount">
                        {fmtMoney(totalRecordedBalance)}
                      </h1>
                      <span className="account-hero-subtitle-bot">
                        {t('totalBalanceInCassielSub') || 'Saldo tercatat dari semua akun'}
                      </span>
                    </div>

                    {/* Cute Wallet Illustration from dompet.svg */}
                    <div className="account-hero-wallet-icon">
                      <img src={dompetSvg} alt="Cassiel Wallet" />
                    </div>
                  </div>

                  <div className="account-hero-dotted-divider" />

                  {/* Multi Stats Row (Rekening Bank vs E-Wallet vs Kartu Kredit) */}
                  <div className="account-hero-dual-stats">
                    <div className="account-dual-stat-col">
                      <div className="account-dual-stat-label-wrap">
                        <span className="account-dual-stat-dot bank" />
                        <span className="account-dual-stat-label">{t('bankAccounts') || 'Rekening Bank'}</span>
                      </div>
                      <span className="account-dual-stat-val bank">
                        {fmtMoney(totalBankBalance)}
                      </span>
                    </div>

                    <div className="account-dual-stat-divider" />

                    <div className="account-dual-stat-col">
                      <div className="account-dual-stat-label-wrap">
                        <span className="account-dual-stat-dot ewallet" />
                        <span className="account-dual-stat-label">{t('ewallet') || 'E-Wallet'}</span>
                      </div>
                      <span className="account-dual-stat-val ewallet">
                        {fmtMoney(totalEwalletBalance)}
                      </span>
                    </div>

                    <div className="account-dual-stat-divider" />

                    <div className="account-dual-stat-col">
                      <div className="account-dual-stat-label-wrap">
                        <span className="account-dual-stat-dot credit" />
                        <span className="account-dual-stat-label">{t('creditCard') || 'Kartu Kredit'}</span>
                      </div>
                      <span className="account-dual-stat-val credit">
                        {fmtMoney(totalCreditCardBalance)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 2. Section Header: Daftar Akun */}
                <div className="account-section-header">
                  <span className="account-section-title">{t('accountListTitle') || 'Daftar Akun'}</span>
                </div>

                {/* 3. Daftar Akun Rows (Hanya yang sudah punya transaksi atau sudah diatur saldo awal) */}
                <div className="accounts-card-list">
                  {(() => {
                    const activeAccounts = allPageAccounts.filter((accName) => {
                      const stats = getAccountStats(accName);
                      return stats.txCount > 0 || stats.hasInitialBalance;
                    });

                    if (activeAccounts.length === 0) {
                      return (
                        <div className="empty-transactions" style={{ margin: '16px 0 10px 0' }}>
                          <span className="empty-icon">💳</span>
                          <span className="empty-title">{t('noTransactions')}</span>
                          <span className="empty-subtitle">Belum ada akun yang memiliki transaksi tercatat.</span>
                        </div>
                      );
                    }

                    return activeAccounts.map((accName) => {
                      const stats = getAccountStats(accName);
                      const isNegative = stats.currentBalance < 0;

                      return (
                        <div
                          key={accName}
                          className="account-row-card"
                          onClick={() => {
                            setSelectedAccountDetail({
                              name: accName,
                              ...stats
                            });
                          }}
                          role="button"
                          tabIndex={0}
                        >
                          <div className="account-row-left">
                            <div className="account-row-icon-wrap">
                              <AccountIconBadge accountName={accName} size={36} />
                            </div>
                            <div className="account-row-details">
                              <div className="account-row-name-wrap">
                                <span className="account-row-name">{accName}</span>
                              </div>
                              <span className="account-row-meta">
                                {stats.txCount} {t('transactions') || 'transaksi'}
                              </span>
                            </div>
                          </div>

                          <div className="account-row-right">
                            {stats.hasRecordedBalance ? (
                              <div className="account-row-balance-wrap">
                                <span className={`account-row-balance-val ${isNegative ? 'negative' : ''}`}>
                                  {fmtMoney(stats.currentBalance)}
                                </span>
                                <span className="account-row-balance-sub">{t('recordedBalance') || 'Sisa saldo tercatat'}</span>
                              </div>
                            ) : (
                              <div className="account-row-balance-wrap">
                                <span className="account-row-unset-label">{t('balanceNotSet') || 'Saldo belum diatur'}</span>
                                <button
                                  type="button"
                                  className="account-row-set-btn"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setAccountToSetBalance(accName);
                                    setBalanceModalInputValue('');
                                  }}
                                >
                                  {t('setBalanceBtn') || 'Atur saldo'}
                                </button>
                              </div>
                            )}

                            <div className="account-row-chevron">
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="9 18 15 12 9 6" />
                              </svg>
                            </div>
                          </div>
                        </div>
                      );
                    });
                  })()}

                  {/* Row: Tambah Akun Baru */}
                  <div
                    className="account-row-add-new"
                    onClick={() => {
                      setIsAddAccountModalOpen(true);
                    }}
                    role="button"
                    tabIndex={0}
                  >
                    <div className="account-add-plus-icon">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                      </svg>
                    </div>
                    <div className="account-row-add-info">
                      <span className="account-row-add-title">{t('addNewAccountTitle') || 'Tambah Akun Baru'}</span>
                      <span className="account-row-add-sub">{t('addNewAccountSub') || 'Pilih bank, e-wallet, atau buat akun sendiri'}</span>
                    </div>
                    <div className="account-row-chevron">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Info Banner Manual Cassiel (One-time, bisa ditutup dengan tombol Paham) */}
                {!dismissedAccountInfoBanner && (
                  <div className="account-info-banner">
                    <div className="account-info-banner-icon">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="16" x2="12" y2="12" />
                        <line x1="12" y1="8" x2="12.01" y2="8" />
                      </svg>
                    </div>
                    <div className="account-info-banner-text">
                      <div className="account-info-banner-header">
                        <span className="account-info-banner-title">{t('accountManualInfoTitle') || 'Pantau Seluruh Saldo di Satu Tempat'}</span>
                      </div>
                      <span className="account-info-banner-desc">
                        {t('accountManualInfoDesc') || 'Tulis saldo akunmu (seperti BCA, GoPay, Tunai). Saldo di sini berupa pencatatan simulasi mandiri (tidak terhubung ke bank) yang otomatis menyesuaikan setiap transaksi yang kamu catat.'}
                      </span>
                      <div className="account-info-banner-actions">
                        <button
                          type="button"
                          className="account-info-banner-ack-btn"
                          onClick={handleDismissAccountInfoBanner}
                        >
                          {t('understand') || 'Paham'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            );
          })()}
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
                {periodFilter === 'monthly' ? formatMonthYear(currentDate) : periodFilter === 'yearly' ? `${currentDate.getFullYear()}` : (t('statsPeriodWeekly') || 'Minggu Ini')}
              </span>
              <button type="button" className="month-btn" onClick={handleNextMonth} aria-label="Next Period">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 18l6-6-6-6"/>
                </svg>
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                type="button"
                className="stats-export-btn"
                onClick={async () => {
                  if (!isPro) {
                    handleOpenProModal('export');
                    return;
                  }
                  showVoiceToast('Sedang menyiapkan berkas laporan...');
                  const res = await exportTransactionsToSpreadsheet({
                    transactions: filteredTransactions,
                    currency: appCurrency,
                    profileName
                  });
                  if (res.success) {
                    showVoiceToast(`✅ Laporan ${res.fileName} berhasil diekspor!`);
                  } else {
                    showVoiceToast(`❌ ${res.error || 'Gagal mengekspor berkas'}`);
                  }
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '6px 10px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #F59E0B, #D97706)',
                  color: '#FFFFFF',
                  border: 'none',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 2px 6px rgba(245, 158, 11, 0.25)'
                }}
                title="Ekspor Laporan Excel (.xlsx / CSV)"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="8" y1="13" x2="16" y2="13"></line>
                  <line x1="8" y1="17" x2="16" y2="17"></line>
                </svg>
                <span>Excel</span>
              </button>

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
            </div>
          </header>

          {/* 🌟 V1 Stats Header Insight: "✨ Yang menarik dari pengeluaranmu" */}
          {financialInsightsData && financialInsightsData.statsBehavioralInsight && financialInsightsData.totalCurrentExpense > 0 && (
            <div className="stats-discovery-card">
              <div className="stats-discovery-header">
                <span className="sparkle">✨</span>
                <span>{financialInsightsData.statsBehavioralInsight.title}</span>
              </div>
              <p className="stats-discovery-body">
                {financialInsightsData.statsBehavioralInsight.body}
              </p>
              {financialInsightsData.statsBehavioralInsight.sub && (
                <p className="stats-discovery-sub">
                  {financialInsightsData.statsBehavioralInsight.sub}
                </p>
              )}
            </div>
          )}

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
                        className="pie-leader-line"
                        style={{ animationDelay: `${idx * 160 + 160}ms` }}
                      />
                    ))}

                    {/* Layer 2 (Middle): SVG Pie Slices with unified continuous rotation */}
                    <g className="pie-chart-slices-group">
                      {pieSlices.map((slice, idx) => (
                        <path
                          key={`slice-${idx}`}
                          d={slice.pathData}
                          fill={slice.color}
                          stroke="none"
                          className="pie-slice"
                          style={{ animationDelay: `${idx * 120}ms` }}
                        />
                      ))}
                    </g>

                    {/* Layer 3 (Top): Label Texts */}
                    {pieSlices.map((slice, idx) => {
                      const textAnchor = slice.isRight ? 'start' : 'end';
                      const labelX = slice.pLabel.x + (slice.isRight ? 3 : -3);
                      return (
                        <g 
                          key={`label-${idx}`} 
                          className="pie-label-group"
                          style={{ animationDelay: `${idx * 160 + 200}ms` }}
                        >
                          <text
                            x={labelX}
                            y={slice.pLabel.y}
                            textAnchor={textAnchor}
                            dominantBaseline="central"
                            className="pie-label-name"
                          >
                            {getCategoryName(slice.name, appLanguage)}
                          </text>
                          <text
                            x={labelX}
                            y={slice.pLabel.y + 11.5}
                            textAnchor={textAnchor}
                            dominantBaseline="central"
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
                <p>{t('noStatsData') || 'Belum ada data'} {statsType === 'expense' ? (t('expenses') || 'pengeluaran') : (t('income') || 'pemasukan')}</p>
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
                    title={t('tapToViewInsight', { name: '' }) || 'Klik untuk melihat insight lengkap'}
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
                              {t('tapToViewInsight', { name: profileName || '' }) || `✨ Klik lihat insight mu ${profileName || 'No Name'}`}
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
                                  style={{ 
                                    height: `${earnedHeightPct}%`,
                                    animationDelay: `${item.monthIdx * 35}ms`
                                  }}
                                  title={`${item.fullName} Pemasukan: ${fmtMoney(item.earned)}`}
                                />
                              )}
                            </div>

                            {/* Spend / Expense Bar */}
                            <div className="stats-bar-track">
                              {item.spend > 0 && (
                                <div 
                                  className="stats-bar-fill spend-bar"
                                  style={{ 
                                    height: `${spendHeightPct}%`,
                                    animationDelay: `${item.monthIdx * 35 + 90}ms`
                                  }}
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
          {(() => {
            const hasMain = typeof mainMonthlyBudget === 'number' && mainMonthlyBudget > 0;
            const spent = currentMonthExpenses;
            const remaining = hasMain ? mainMonthlyBudget - spent : 0;
            const spentPercent = hasMain ? (spent / mainMonthlyBudget) * 100 : 0;
            const isOver = hasMain && spent > mainMonthlyBudget;
            const barStatus = isOver ? 'danger' : (spentPercent >= 80 ? 'warning' : 'safe');
            const monthName = MONTH_SHORT_I18N[appLanguage] 
              ? MONTH_SHORT_I18N[appLanguage][currentDate.getMonth()] 
              : (MONTH_SHORT_I18N.id?.[currentDate.getMonth()] || currentDate.toLocaleDateString('id-ID', { month: 'short' }));

            return (
              <>
                {/* 1. Standalone Top Bar (Outside Container Card) */}
                <div className="budget-standalone-top-bar">
                  <div className="budget-standalone-title-badge">
                    <span className="budget-standalone-title-icon">🎯</span>
                    <span className="budget-standalone-title-text">Budget</span>
                  </div>

                  <div className="budget-standalone-month-nav">
                    <button 
                      type="button" 
                      className="budget-hero-month-arrow month-btn" 
                      onClick={handlePrevMonth}
                      aria-label="Bulan Sebelumnya"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M15 18l-6-6 6-6"/>
                      </svg>
                    </button>

                    <button 
                      type="button" 
                      className="budget-hero-badge-btn" 
                      onClick={() => {
                        if (budgetDateInputRef.current) {
                          if (typeof budgetDateInputRef.current.showPicker === 'function') {
                            budgetDateInputRef.current.showPicker();
                          } else {
                            budgetDateInputRef.current.click();
                            budgetDateInputRef.current.focus();
                          }
                        }
                      }}
                      title="Pilih Bulan & Tahun"
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                        <line x1="16" y1="2" x2="16" y2="6"></line>
                        <line x1="8" y1="2" x2="8" y2="6"></line>
                        <line x1="3" y1="10" x2="21" y2="10"></line>
                      </svg>
                      <span className="budget-month-btn-text">{monthName} {currentDate.getFullYear()}</span>
                    </button>

                    {/* Hidden input for native OS device Month-Year picker */}
                    <input
                      ref={budgetDateInputRef}
                      type="month"
                      className="hidden-picker-input"
                      value={`${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`}
                      onChange={(e) => {
                        if (e.target.value) {
                          const [y, m] = e.target.value.split('-').map(Number);
                          if (y && m) {
                            setCurrentDate(new Date(y, m - 1, 1));
                          }
                        }
                      }}
                      aria-label="Pilih Periode Bulan & Tahun Budget"
                    />

                    <button 
                      type="button" 
                      className="budget-hero-month-arrow month-btn" 
                      onClick={handleNextMonth}
                      aria-label="Bulan Berikutnya"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 18l6-6-6-6"/>
                      </svg>
                    </button>
                  </div>
                </div>

                {/* 2. Main Floating Hero Budget Card */}
                <div className="budget-hero-card floating-hero-card">
                  <div className="budget-hero-top-row">
                    <div className="budget-hero-title-group">
                      <span className="budget-hero-subtitle">
                        {getTranslation(appLanguage, 'budgetThisMonth') || 'Budget bulan ini'}
                      </span>
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
                          {hasMain ? fmtMoney(mainMonthlyBudget) : `${getCurrency(appCurrency).symbol} 0`}
                        </div>
                      )}
                    </div>

                    {/* Cute Illustration Icon from kalender.svg */}
                    <div 
                      className="budget-hero-clipboard-icon"
                      onClick={handleStartEditMainBudget}
                      title="Atur Budget Bulan Ini"
                    >
                      <img src={kalenderSvg} alt="Budget Kalender" />
                    </div>
                  </div>

                  {/* Dotted Divider */}
                  <div className="budget-hero-dotted-divider" />

                  {/* Stats Breakdown (Terpakai vs Sisa with Vertical Line) */}
                  <div className="budget-hero-dual-stats">
                    <div className="budget-dual-stat-col">
                      <span className="budget-dual-stat-label">{t('usedThisMonth') || 'Terpakai'}</span>
                      <strong className="budget-dual-stat-val spent">{fmtMoney(spent)}</strong>
                    </div>
                    <div className="budget-dual-stat-divider" />
                    <div className={`budget-dual-stat-col ${isOver ? 'over' : ''}`}>
                      <span className="budget-dual-stat-label">{t('remainingBudget') || 'Sisa'}</span>
                      <strong className="budget-dual-stat-val remaining">
                        {hasMain ? (remaining >= 0 ? fmtMoney(remaining) : `-${fmtMoney(Math.abs(remaining))}`) : '-'}
                      </strong>
                    </div>
                  </div>

                  {/* Main Progress Bar */}
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
                          ? (isOver ? (t('budgetLimitExceeded') || '⚠️ Limit Terlampaui!') : (spentPercent >= 80 ? (t('budgetNearLimit') || '⚡ Waspada Limit!') : (t('budgetSafeZone') || '✨ Kondisi Aman'))) 
                          : (t('budgetNotSet') || 'Budget belum diatur')}
                      </span>
                      <span className="budget-game-bar-ratio">
                        {hasMain ? `${Math.round(spentPercent)}% / 100%` : '0% / 100%'}
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="budget-hero-actions">
                    {isEditingMainBudget ? (
                      <>
                        <button 
                          type="button" 
                          className="budget-hero-btn primary"
                          onClick={handleSaveMainBudget}
                        >
                          <span>{t('saveBudget') || 'Simpan Budget'}</span>
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
                          <span>{t('editBudget') || 'Ubah Budget'}</span>
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
                        <span>{t('setBudget') || 'Atur Budget'}</span>
                      </button>
                    )}
                  </div>
                </div>
              </>
            );
          })()}

          {/* 3. Category Section Header */}
          <div className="budget-section-header">
            <h3 className="budget-section-title">{t('categoryBreakdown') || 'Budget per Kategori'}</h3>
          </div>

          {/* 4. Search Bar */}
          <div className="budget-search-section">
            <div className="budget-search-wrapper">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/>
                <line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input 
                type="text" 
                className="budget-search-input"
                placeholder={t('searchCategoryPlaceholder') || 'Cari kategori...'}
                value={budgetSearchQuery}
                onFocus={() => setIsSearchingBudget(true)}
                onBlur={() => {
                  if (!budgetSearchQuery.trim()) {
                    setIsSearchingBudget(false);
                  }
                }}
                onChange={(e) => setBudgetSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === 'Escape') {
                    e.currentTarget.blur();
                    if (e.key === 'Escape') {
                      setBudgetSearchQuery('');
                      setIsSearchingBudget(false);
                    }
                  }
                }}
              />
              {budgetSearchQuery && (
                <button 
                  type="button" 
                  className="budget-search-clear"
                  onClick={() => {
                    setBudgetSearchQuery('');
                    setIsSearchingBudget(false);
                  }}
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* 5. Dynamic Filter Tabs with Live Real-time Counts */}
          {(() => {
            const currentMonthData = monthlyBudgetsMap[activeMonthKey] || { main: null, categories: {} };
            const monthCatLimits = currentMonthData.categories || {};
            const countAll = allBudgetCategories.length;
            const countActive = allBudgetCategories.filter(c => {
              const monthLimit = monthCatLimits[c.id];
              return (typeof monthLimit === 'number' && monthLimit > 0);
            }).length;
            const countUnset = countAll - countActive;

            return (
              <div className="budget-filter-tabs">
                <button 
                  type="button" 
                  className={`budget-tab-btn ${budgetFilterTab === 'all' ? 'active' : ''}`}
                  onClick={() => setBudgetFilterTab('all')}
                >
                  {t('filterAll') || 'Semua'} ({countAll})
                </button>
                <button 
                  type="button" 
                  className={`budget-tab-btn ${budgetFilterTab === 'active' ? 'active' : ''}`}
                  onClick={() => setBudgetFilterTab('active')}
                >
                  {t('filterActive') || 'Aktif'} ({countActive})
                </button>
                <button 
                  type="button" 
                  className={`budget-tab-btn ${budgetFilterTab === 'unset' ? 'active' : ''}`}
                  onClick={() => setBudgetFilterTab('unset')}
                >
                  {t('filterUnset') || 'Belum Diatur'} ({countUnset})
                </button>
              </div>
            );
          })()}

          {/* 6. Seamless 1-Column Category List (No Outer Box, Row Item with Mini Progress Bars) */}
          <div className="budget-list-section">
            {(() => {
              const filtered = getFilteredBudgetCategories();
              if (filtered.length === 0) {
                return (
                  <div style={{ textAlign: 'center', padding: '40px 20px', color: '#8C786A' }}>
                    <p style={{ fontSize: '14px', fontWeight: 500 }}>
                      {budgetSearchQuery ? (t('categoryNotFound', { query: budgetSearchQuery }) || `Kategori "${budgetSearchQuery}" tidak ditemukan`) : (t('noCategoriesInFilter') || 'Tidak ada kategori pada filter ini')}
                    </p>
                  </div>
                );
              }

              const isSearchActive = Boolean(budgetSearchQuery && budgetSearchQuery.trim());
              const firstThree = filtered.slice(0, 3);
              const remaining = filtered.slice(3);
              const hasMore = filtered.length > 3 && !isSearchActive;

              const renderCategoryRow = (cat) => {
                const iconPath = resolveIcon(cat);
                const hasLimit = typeof cat.monthlyLimit === 'number' && cat.monthlyLimit > 0;
                const catSpent = currentMonthExpensesByCategory[cat.id] ?? currentMonthExpensesByCategory[cat.name] ?? 0;
                const catLimit = cat.monthlyLimit || 0;
                const catPercent = hasLimit && catLimit > 0 ? (catSpent / catLimit) * 100 : 0;
                const isCatOver = hasLimit && catSpent > catLimit;
                const catStatus = isCatOver ? 'danger' : (catPercent >= 80 ? 'warning' : 'safe');

                return (
                  <div 
                    key={cat.id} 
                    className={`budget-row-item ${hasLimit ? 'has-limit' : 'unset-limit'}`}
                    onClick={() => handleOpenCategoryBudgetModal(cat)}
                  >
                    {/* Left: Category Icon Box */}
                    <div className={`budget-row-icon-box ${cat.iconClass}`}>
                      <img src={iconPath} alt={cat.name} />
                    </div>

                    {/* Middle: Name + Spending Breakdown / Status + Mini Progress Bar */}
                    <div className="budget-row-content">
                      <div className="budget-row-title-line">
                        <span className="budget-row-cat-name">{getCategoryName(cat.name, appLanguage)}</span>
                      </div>

                      {hasLimit ? (
                        <>
                          <div className="budget-row-amount-line">
                            <span className="budget-row-spent">{fmtMoney(catSpent)}</span>
                            <span className="budget-row-sep">/</span>
                            <span className="budget-row-limit">{fmtMoney(catLimit)}</span>
                          </div>
                          <div className="budget-row-mini-bar-frame">
                            <div 
                              className={`budget-row-mini-bar-fill ${catStatus}`} 
                              style={{ width: `${Math.min(Math.max(catPercent, 4), 100)}%` }}
                            />
                          </div>
                        </>
                      ) : (
                        <div className="budget-row-unset-desc">
                          <span>{t('tapToSet') || 'Belum diatur'}</span>
                        </div>
                      )}
                    </div>

                    {/* Right: Percent Badge / "Atur" Button + Chevron Arrow */}
                    <div className="budget-row-right">
                      {hasLimit ? (
                        <span className={`budget-row-pct-text ${catStatus}`}>
                          {Math.round(catPercent)}%
                        </span>
                      ) : (
                        <button 
                          type="button" 
                          className="budget-row-set-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenCategoryBudgetModal(cat);
                          }}
                        >
                          {t('set') || 'Atur'}
                        </button>
                      )}

                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#B8A494" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="budget-row-chevron">
                        <polyline points="9 18 15 12 9 6"/>
                      </svg>
                    </div>
                  </div>
                );
              };

              return (
                <>
                  {!isSearchActive ? (
                    <>
                      <div className="budget-category-row-list">
                        {firstThree.map(renderCategoryRow)}
                      </div>

                      {hasMore && (
                        <div className="budget-expand-btn-wrapper">
                          <button
                            type="button"
                            className="budget-expand-toggle-btn"
                            onClick={() => setIsBudgetCategoriesExpanded(prev => !prev)}
                          >
                            <span>
                              {isBudgetCategoriesExpanded 
                                ? (t('hide') || 'Sembunyikan') 
                                : `${t('showAll') || 'Tampilkan Semua'} (${filtered.length})`}
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

                      {hasMore && (
                        <div className={`budget-expandable-section ${isBudgetCategoriesExpanded ? 'expanded' : 'collapsed'}`}>
                          <div className="budget-expandable-inner">
                            <div className="budget-category-row-list budget-category-row-list-expanded">
                              {remaining.map(renderCategoryRow)}
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="budget-category-row-list">
                      {filtered.map(renderCategoryRow)}
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
          onOpenQuickText={() => setIsQuickTextModalOpen(true)}
          onOpenProModal={handleOpenProModal}
        />
      )}

      {/* Quick-Type Natural Language Modal */}
      <QuickTextModal
        isOpen={isQuickTextModalOpen}
        onClose={() => setIsQuickTextModalOpen(false)}
        expenseCategories={expenseCategories}
        incomeCategories={incomeCategories}
        accountsList={accountsList}
        handleSaveVoiceTransaction={handleSaveVoiceTransaction}
        showVoiceToast={showVoiceToast}
      />

      {/* Interactive AI Financial Voice Query Result Modal */}
      <VoiceQueryResultModal
        isOpen={isVoiceQueryResultOpen}
        onClose={() => setIsVoiceQueryResultOpen(false)}
        queryData={voiceQueryData}
        appCurrency={appCurrency}
      />

      {/* Voice Feedback Toast Notification */}
      {voiceToastMessage && (
        <div className="voice-toast-notification">
          <span>{voiceToastMessage}</span>
        </div>
      )}

      {/* Bottom Nav (Hidden when editing main budget or searching budget to prevent keyboard pushup) */}
      {!isEditingMainBudget && !isSearchingBudget && (
        <nav className="bottom-nav">
          <svg className="nav-bg-svg" viewBox="0 0 400 80" preserveAspectRatio="none">
            <path
              d="M 0,16 Q 0,0 20,0 L 142,0 C 158,0 166,6 174,14 C 183,23 189,25 200,25 C 211,25 217,23 226,14 C 234,6 242,0 258,0 L 380,0 Q 400,0 400,16 L 400,80 L 0,80 Z"
              fill="#F8EFE6"
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
      )}

      {/* Full Page Add Transaction Screen (Triggered by Plus button) */}
      {isAddModalOpen && (
        <div
          className={`full-page-add-screen ${isAddModalClosing ? 'closing' : ''}`}
          onScroll={() => {
            if (isNoteSuggestionsOpen) setIsNoteSuggestionsOpen(false);
          }}
        >
          {/* Top Header */}
          <div className="full-page-header">
            <button type="button" className="back-btn" onClick={handleCloseAddModal} aria-label="Back">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 19l-7-7 7-7"/>
                <path d="M7 12h13"/>
              </svg>
            </button>
            <span className="full-page-title">
              {editingTransactionId
                ? (appLanguage === 'id_id' ? 'Edit Transaksi' : 'Edit Transaction')
                : transType === 'Expense' 
                  ? (appLanguage === 'id_id' ? 'Pengeluaran' : appLanguage === 'jv' ? 'Pangetrapan' : appLanguage === 'zh' ? 'Zhichu' : 'Expense') 
                  : (appLanguage === 'id_id' ? 'Pemasukan' : appLanguage === 'jv' ? 'Pamasukan' : appLanguage === 'zh' ? 'Shouru' : 'Income')}
            </span>
          </div>

          {/* Type Switcher Tabs */}
          <div className="type-switcher-container">
            <div className="type-switcher">
              <div className={`type-switcher-indicator ${transType === 'Expense' ? 'to-expense' : 'to-income'}`} />
              {['Income', 'Expense'].map(type => (
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
                    : (appLanguage === 'id_id' ? 'Pemasukan' : appLanguage === 'jv' ? 'Pamasukan' : appLanguage === 'zh' ? 'Shouru' : appLanguage === 'ko' ? 'Su-ip' : 'Income')}
                </button>
              ))}
            </div>
          </div>

          {/* Form Fields List for Expense & Income */}
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
                      const convertedValue = e.target.value.replace(/\b(dan)(\s+|$)/gi, (match, p1, p2) => `&${p2}`);
                      setNote(convertedValue);
                      setIsNoteSuggestionsOpen(convertedValue.trim().length > 0);
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
                  {editingTransactionId
                    ? (appLanguage === 'id_id' ? 'Simpan Perubahan' : 'Save Changes')
                    : t('formSave')}
                </button>
              </div>
            </div>

              {/* Category Selector Sheet when Category is active */}
              {activePanel === 'category' && (
                <div className="panel-category-full tour-target-form-category">
                  {isCategoryWarehouseOpen ? (
                    /* Gudang Kategori View */
                    <>
                      <div className="panel-sub-header">
                        <span className="panel-title">{t('categoryWarehouse')}</span>
                        <div className="panel-header-actions">
                          <button
                            type="button"
                            className="header-action-btn back-warehouse-btn"
                            onClick={() => setIsCategoryWarehouseOpen(false)}
                            title={t('back') || 'Kembali'}
                            aria-label="Close category warehouse"
                          >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M19 12H5M12 19l-7-7 7-7"/>
                            </svg>
                          </button>
                        </div>
                      </div>

                      <div className="category-grid">
                        {(transType === 'Expense' ? warehouseExpenseCategories : warehouseIncomeCategories).length === 0 ? (
                          <div className="warehouse-empty-state">
                            <div className="warehouse-empty-icon">📦</div>
                            <div className="warehouse-empty-text">{t('emptyWarehouse')}</div>
                          </div>
                        ) : (
                          (transType === 'Expense' ? warehouseExpenseCategories : warehouseIncomeCategories).map((cat) => {
                            const catIcon = resolveIcon(cat);
                            return (
                              <button
                                key={cat.id}
                                type="button"
                                className={`cat-grid-item ${!catIcon ? 'text-only' : ''}`}
                                onClick={() => handleRestoreCategoryFromWarehouse(cat)}
                              >
                                <span
                                  className="cat-add-pill"
                                  onClick={(e) => handleRestoreCategoryFromWarehouse(cat, e)}
                                  title={`Tambah ${getCategoryName(cat, appLanguage)}`}
                                  aria-label={`Tambah ${getCategoryName(cat, appLanguage)}`}
                                >
                                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="3.5" strokeLinecap="round">
                                    <line x1="12" y1="5" x2="12" y2="19" />
                                    <line x1="5" y1="12" x2="19" y2="12" />
                                  </svg>
                                </span>
                                {catIcon ? (
                                  <div className={`cat-grid-icon ${cat.iconClass}`}>
                                    <img src={catIcon} alt={cat.name} />
                                  </div>
                                ) : null}
                                <span className="cat-grid-label">{getCategoryName(cat, appLanguage)}</span>
                              </button>
                            );
                          })
                        )}
                      </div>
                    </>
                  ) : (
                    /* Active Category View */
                    <>
                      <div className="panel-sub-header">
                        <span className="panel-title">{t('formCategory')}</span>
                        <div className="panel-header-actions">
                          <button
                            type="button"
                            className="header-action-btn warehouse-btn"
                            onClick={() => {
                              setIsCategoryWarehouseOpen(true);
                              setIsCategoryDeleteMode(false);
                              setIsCustomCat(false);
                            }}
                            title={t('categoryWarehouse')}
                            aria-label="Open category warehouse"
                          >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="gemini-warehouse-svg">
                              <defs>
                                <linearGradient id="geminiWarehouseGradCat" x1="0%" y1="0%" x2="100%" y2="100%">
                                  <stop offset="0%" stopColor="#1BA1E3" />
                                  <stop offset="26%" stopColor="#5468FF" />
                                  <stop offset="58%" stopColor="#9747FF" />
                                  <stop offset="84%" stopColor="#E04FD5" />
                                  <stop offset="100%" stopColor="#FF7643" />
                                </linearGradient>
                              </defs>
                              <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" stroke="url(#geminiWarehouseGradCat)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/>
                              <path d="m3.3 7 8.7 5 8.7-5" stroke="url(#geminiWarehouseGradCat)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/>
                              <path d="M12 22V12" stroke="url(#geminiWarehouseGradCat)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </button>
                          <button
                            type="button"
                            className={`header-action-btn minus-btn ${isCategoryDeleteMode ? 'active' : ''}`}
                            onClick={() => {
                              setIsCategoryDeleteMode(!isCategoryDeleteMode);
                              if (isCustomCat) setIsCustomCat(false);
                            }}
                            title={isCategoryDeleteMode ? t('doneDeleting') : t('deleteCategoryMode')}
                            aria-label="Toggle category delete mode"
                          >
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                              <line x1="5" y1="12" x2="19" y2="12" />
                            </svg>
                          </button>
                          <button
                            type="button"
                            className={`header-action-btn ${isCustomCat ? 'active' : ''}`}
                            onClick={() => {
                              setIsCustomCat(!isCustomCat);
                              if (isCategoryDeleteMode) setIsCategoryDeleteMode(false);
                            }}
                            title={t('writeCustomCategory')}
                            aria-label="Edit custom category"
                          >
                            ✏️
                          </button>
                          <button
                            type="button"
                            className="header-action-btn close-btn"
                            onClick={() => {
                              setIsCategoryDeleteMode(false);
                              setActivePanel('account');
                            }}
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
                              className={`cat-grid-item ${selectedCategory && selectedCategory.id === cat.id ? 'active' : ''} ${!catIcon ? 'text-only' : ''} ${showLastBadge ? 'has-last-badge' : ''} ${isCategoryDeleteMode ? 'in-delete-mode' : ''}`}
                              onClick={() => {
                                if (isCategoryDeleteMode) {
                                  handleMoveCategoryToWarehouse(cat);
                                } else {
                                  handleSelectCategory(cat);
                                }
                              }}
                            >
                              {isCategoryDeleteMode && (
                                <span
                                  className="cat-delete-pill"
                                  onClick={(e) => handleMoveCategoryToWarehouse(cat, e)}
                                  title={`Simpan ke Gudang: ${getCategoryName(cat, appLanguage)}`}
                                  aria-label={`Simpan ke Gudang: ${getCategoryName(cat, appLanguage)}`}
                                >
                                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="3.5" strokeLinecap="round">
                                    <line x1="4" y1="12" x2="20" y2="12" />
                                  </svg>
                                </span>
                              )}
                              {!isCategoryDeleteMode && showLastBadge && (
                                <span className="last-used-badge" title={t('recentCategoryTitle') || 'Kategori paling sering / terakhir digunakan'}>
                                  {t('recentBadge') || 'Terakhir'}
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
                    </>
                  )}
                </div>
              )}

              {/* Account Selector Sheet when Account is active */}
              {activePanel === 'account' && (
                <div className="panel-category-full tour-target-form-account">
                  {isAccountWarehouseOpen ? (
                    /* Gudang Akun View */
                    <>
                      <div className="panel-sub-header">
                        <span className="panel-title">{t('accountWarehouse')}</span>
                        <div className="panel-header-actions">
                          <button
                            type="button"
                            className="header-action-btn back-warehouse-btn"
                            onClick={() => setIsAccountWarehouseOpen(false)}
                            title={t('back') || 'Kembali'}
                            aria-label="Close account warehouse"
                          >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M19 12H5M12 19l-7-7 7-7"/>
                            </svg>
                          </button>
                        </div>
                      </div>

                      <div className="category-grid">
                        {warehouseAccountsList.length === 0 ? (
                          <div className="warehouse-empty-state">
                            <div className="warehouse-empty-icon">📦</div>
                            <div className="warehouse-empty-text">{t('emptyWarehouse')}</div>
                          </div>
                        ) : (
                          warehouseAccountsList.map((acc) => (
                            <button
                              key={acc}
                              type="button"
                              className="cat-grid-item account-grid-item"
                              onClick={() => handleRestoreAccountFromWarehouse(acc)}
                            >
                              <span
                                className="account-add-pill"
                                onClick={(e) => handleRestoreAccountFromWarehouse(acc, e)}
                                title={`Tambah ${acc}`}
                                aria-label={`Tambah ${acc}`}
                              >
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="3.5" strokeLinecap="round">
                                  <line x1="12" y1="5" x2="12" y2="19" />
                                  <line x1="5" y1="12" x2="19" y2="12" />
                                </svg>
                              </span>
                              <div className="cat-grid-icon account-badge-icon">
                                <AccountIconBadge accountName={acc} size={36} />
                              </div>
                              <span className="cat-grid-label">{acc}</span>
                            </button>
                          ))
                        )}
                      </div>
                    </>
                  ) : (
                    /* Active Account View */
                    <>
                      <div className="panel-sub-header">
                        <span className="panel-title">{t('formAccount')}</span>
                        <div className="panel-header-actions">
                          <button
                            type="button"
                            className="header-action-btn warehouse-btn"
                            onClick={() => {
                              setIsAccountWarehouseOpen(true);
                              setIsAccountDeleteMode(false);
                              setIsCustomAccount(false);
                            }}
                            title={t('accountWarehouse')}
                            aria-label="Open account warehouse"
                          >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="gemini-warehouse-svg">
                              <defs>
                                <linearGradient id="geminiWarehouseGradAcc" x1="0%" y1="0%" x2="100%" y2="100%">
                                  <stop offset="0%" stopColor="#1BA1E3" />
                                  <stop offset="26%" stopColor="#5468FF" />
                                  <stop offset="58%" stopColor="#9747FF" />
                                  <stop offset="84%" stopColor="#E04FD5" />
                                  <stop offset="100%" stopColor="#FF7643" />
                                </linearGradient>
                              </defs>
                              <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" stroke="url(#geminiWarehouseGradAcc)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/>
                              <path d="m3.3 7 8.7 5 8.7-5" stroke="url(#geminiWarehouseGradAcc)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/>
                              <path d="M12 22V12" stroke="url(#geminiWarehouseGradAcc)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </button>
                          <button
                            type="button"
                            className={`header-action-btn minus-btn tour-target-form-minus ${isAccountDeleteMode ? 'active' : ''}`}
                            onClick={() => {
                              setIsAccountDeleteMode(!isAccountDeleteMode);
                              if (isCustomAccount) setIsCustomAccount(false);
                            }}
                            title={isAccountDeleteMode ? t('doneDeleting') : t('deleteAccountMode')}
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
                            title={t('writeCustomAccount')}
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
                          return (
                            <button
                              key={acc}
                              type="button"
                              className={`cat-grid-item account-grid-item ${account === acc ? 'active' : ''} ${showLastBadge ? 'has-last-badge' : ''} ${isAccountDeleteMode ? 'in-delete-mode' : ''}`}
                              onClick={() => {
                                if (isAccountDeleteMode) {
                                  handleMoveAccountToWarehouse(acc);
                                } else {
                                  handleSelectAccount(acc);
                                }
                              }}
                            >
                              {isAccountDeleteMode && (
                                <span 
                                  className="account-delete-pill"
                                  onClick={(e) => handleMoveAccountToWarehouse(acc, e)}
                                  title={`Simpan ke Gudang: ${acc}`}
                                  aria-label={`Simpan ke Gudang: ${acc}`}
                                >
                                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="3.5" strokeLinecap="round">
                                    <line x1="4" y1="12" x2="20" y2="12" />
                                  </svg>
                                </span>
                              )}
                              {!isAccountDeleteMode && showLastBadge && (
                                <span className="last-used-badge" title={t('recentAccountTitle') || 'Akun paling sering / terakhir digunakan'}>
                                  {t('recentBadge') || 'Terakhir'}
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
                    </>
                  )}
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
                <span className="profile-picker-hint">{t('tapPhotoToChoose') || 'Tekan foto untuk memilih dari galeri'}</span>
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
                <label className="profile-field-label">{t('fullNameOrNickname') || 'Nama Lengkap / Panggilan (Opsional)'}</label>
                <input
                  type="text"
                  className="profile-name-input"
                  placeholder={t('typeNicknamePlaceholder') || 'Ketik nama panggilan Anda...'}
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && tempName.trim()) handleSaveProfile();
                  }}
                />
              </div>

              {/* Language Selection Dropdown for Beginners */}
              <div className="profile-field-group">
                <label className="profile-field-label">{t('chooseAppLanguage') || 'Pilih Bahasa Aplikasi'}</label>
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
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" className="onboarding-lang-check">
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
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2D2520" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                      <circle cx="12" cy="13" r="4"/>
                    </svg>
                  </div>

                  {/* Donor Capsule Badge (Only shown for real verified donors on native devices/local test) */}
                  {isPro && getUserDonorInfo().isDonor && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '-14px',
                        right: '-14px',
                        background: 'linear-gradient(135deg, #F59E0B, #D97706)',
                        color: '#FFFFFF',
                        fontSize: '10px',
                        fontWeight: '800',
                        padding: '3px 9px',
                        borderRadius: '999px',
                        boxShadow: '0 4px 12px rgba(217, 119, 6, 0.4)',
                        letterSpacing: '0.4px',
                        zIndex: 10,
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {getUserDonorInfo().badgeText}
                    </div>
                  )}
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

                {/* ⚖️ JUSTICE CASSIEL VIP CARD */}
                <div 
                  className="justice-cassiel-profile-card"
                  onClick={() => handleOpenProModal('general')}
                  style={{
                    margin: '12px auto 0',
                    width: 'calc(100% - 16px)',
                    maxWidth: '360px',
                    borderRadius: '16px',
                    padding: '12px 16px',
                    background: isPro 
                      ? '#F59E0B' 
                      : '#FFFFFF',
                    border: isPro ? 'none' : '1px solid #FDE68A',
                    boxShadow: isPro 
                      ? '0 4px 14px rgba(245, 158, 11, 0.28)' 
                      : '0 2px 8px rgba(0, 0, 0, 0.04)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    transition: 'transform 0.15s ease'
                  }}
                >
                  <div style={{ textAlign: 'left' }}>
                    <div style={{
                      fontSize: '14px',
                      fontWeight: '800',
                      color: isPro ? '#FFFFFF' : '#92400E',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}>
                        <span style={{
                          color: isPro ? '#FFFFFF' : '#92400E',
                          fontFamily: "'Cinzel', 'Playfair Display', 'Times New Roman', serif",
                          letterSpacing: '0.8px',
                          fontWeight: '800',
                          fontSize: '14.5px'
                        }}>
                          Justice Cassiel
                        </span>
                        <span style={{
                          fontSize: '9px',
                          fontWeight: '800',
                          padding: '1.5px 6px',
                          borderRadius: '6px',
                          background: isPro ? 'rgba(255, 255, 255, 0.95)' : 'linear-gradient(135deg, #F59E0B, #D97706)',
                          color: isPro ? '#B45309' : '#FFFFFF',
                          boxShadow: isPro ? '0 2px 4px rgba(0, 0, 0, 0.1)' : 'none'
                        }}>
                          {isPro ? 'PRO AKTIF' : 'UPGRADE'}
                        </span>
                      </div>
                      <div style={{
                        fontSize: '11px',
                        color: isPro ? 'rgba(255, 255, 255, 0.95)' : '#B45309',
                        marginTop: '2px',
                        fontWeight: isPro ? '600' : 'normal'
                      }}>
                        {isPro 
                          ? 'Akses Penuh Tanpa Batas Seluruh Fitur' 
                          : 'Buka Voice AI, Multi-Grup & Ekspor Excel'}
                      </div>
                  </div>

                  <svg 
                    width="18" 
                    height="18" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke={isPro ? '#FFFFFF' : '#B45309'} 
                    strokeWidth="2.5" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  >
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
                </div>

                {/* 💙 KITABISA TRANSPARENCY & PROOF ENTRY CARD */}
                <div 
                  className="kitabisa-transparency-profile-card"
                  onClick={() => setIsKitabisaModalOpen(true)}
                  style={{
                    margin: '8px auto 0',
                    width: 'calc(100% - 16px)',
                    maxWidth: '360px',
                    borderRadius: '16px',
                    padding: '11px 16px',
                    background: 'rgba(255, 255, 255, 0.92)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(2, 132, 199, 0.18)',
                    boxShadow: '0 2px 10px rgba(2, 132, 199, 0.06)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    transition: 'transform 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <img 
                      src={kitabisaLogo} 
                      alt="Kitabisa" 
                      style={{ width: '22px', height: '22px', borderRadius: '6px', objectFit: 'cover' }} 
                    />
                    <div style={{ textAlign: 'left' }}>
                      <div style={{
                        fontSize: '13px',
                        fontWeight: '800',
                        color: '#0284C7',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}>
                        <span>Jalur Penyaluran & Bukti Donasi</span>
                      </div>
                      <div style={{
                        fontSize: '10.5px',
                        color: '#64748B',
                        marginTop: '1px'
                      }}>
                        Pantau penyaluran real-time & bukti sertifikat donasi
                      </div>
                    </div>
                  </div>

                  <svg 
                    width="16" 
                    height="16" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="#0284C7" 
                    strokeWidth="2.5" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  >
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
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

                {/* 1b. Notification Auto Tracker */}
                <div 
                  className="wa-menu-item"
                  onClick={async () => {
                    const nextPref = !isAutoTrackerPref;
                    setIsAutoTrackerPref(nextPref);
                    await setAutoTrackerPreference(nextPref);
                    if (nextPref) {
                      // Request POST_NOTIFICATIONS for native confirmation popups
                      await requestNotificationPermission(); 
                      
                      const hasPerm = await checkNotificationAccessPermission();
                      setHasNotifPermission(hasPerm);
                      if (!hasPerm) {
                        await openNotificationAccessSettings();
                      } else {
                        processAutoTrackerQueue();
                      }
                    }
                  }}
                >
                  <div className="wa-menu-icon-box auto-tracker-icon">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 7V5a2 2 0 0 1 2-2h2" />
                      <path d="M17 3h2a2 2 0 0 1 2 2v2" />
                      <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
                      <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
                      <path d="M13 7L9 12.5h4.5L11 17.5" />
                    </svg>
                  </div>
                  <div className="wa-menu-content">
                    <div className="wa-menu-title-row">
                      <span className="wa-menu-title">{t('notifAutoTrackerTitle') || 'Notification Auto Tracker'}</span>
                    </div>
                    <span className="wa-menu-subtitle">
                      {!isAutoTrackerPref
                        ? (t('notifAutoTrackerDescOff') || 'Cassiel will not track transactions from notifications.')
                        : hasNotifPermission
                          ? (t('notifAutoTrackerDescOn') || 'Automatic transaction tracking is active.')
                          : (t('notifAutoTrackerDescReq') || 'Notification access is required.')}
                    </span>
                  </div>
                  <div className={`wa-custom-toggle-track ${isAutoTrackerPref ? 'active' : ''}`}>
                    <div className="wa-custom-toggle-thumb" />
                  </div>
                </div>

                {/* 1c. Cassiel Quick Assist */}
                <div 
                  className="wa-menu-item"
                  onClick={async () => {
                    await openAssistantSettings();
                    setTimeout(async () => {
                      const active = await checkAssistantActive();
                      setIsAssistantActive(active);
                    }, 1000);
                  }}
                >
                  <div className="wa-menu-icon-box assistant-icon">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3L12 3z"/>
                      <path d="M5 3v4"/>
                      <path d="M3 5h4"/>
                      <path d="M19 17v4"/>
                      <path d="M17 19h4"/>
                    </svg>
                  </div>
                  <div className="wa-menu-content">
                    <div className="wa-menu-title-row">
                      <span className="wa-menu-title">{t('quickAssistTitle') || 'Cassiel Quick Assist'}</span>
                    </div>
                    <span className="wa-menu-subtitle">
                      {t('quickAssistSubtitle') || 'Tahan tombol Power untuk catat transaksi'}
                    </span>
                  </div>
                  <div className={`wa-custom-toggle-track ${isAssistantActive ? 'active' : ''}`}>
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
                    <svg width="22" height="22" viewBox="0 0 512 512" fill="currentColor">
                      <path d="M239.83 0.08C251.25 0.08 262.66 0.08 274.08 0.08C277.79 1.31 282.05 0.88 285.93 1.37C295.76 2.61 305.61 3.44 315.38 5.18C340.86 9.72 365.39 18.5 389.03 28.72C398.94 33.01 424.65 41.35 415.89 56.57C407.57 71.04 388.15 56.27 377.68 51.76C338.88 35.08 298.64 25.41 256 25.68C213.28 25.95 172.85 35.06 133.87 51.8C123.97 56.05 103.79 71.41 96.18 56.47C90.01 44.37 101.74 39.01 110.23 34.72C114.96 32.33 119.63 29.93 124.51 27.91C148.04 18.18 171.57 10.16 196.68 5.3C206.85 3.33 217.21 2.59 227.48 1.32C231.44 0.83 236.06 1.4 239.83 0.08ZM254.63 62.4C269.68 61.85 285.15 63.58 299.98 65.78C354.41 73.83 405.24 96.73 446.13 133.91C458.26 144.94 469.61 157.14 479.3 170.38C483.92 176.7 488.66 182.21 484.74 190.42C481.37 197.45 470.85 198.46 465.29 193.75C461.09 190.18 458.24 184.65 454.81 180.38C451.84 176.67 448.62 173.17 445.59 169.52C436.2 158.2 424.43 148.13 412.81 139.18C368.37 104.97 311.9 87.9 256 88.01C199.85 88.12 142.79 105.37 98.47 140.29C87.05 149.29 75.73 159.23 66.34 170.38C63 174.34 59.44 178.2 56.35 182.36C53.41 186.31 50.59 191.59 46.7 194.66C41.05 199.12 30.74 198.37 27.32 191.31C23.34 183.1 28.05 177.32 32.8 170.99C42.36 158.27 52.94 146.3 64.7 135.55C119.52 85.39 181.03 65.1 254.63 62.4ZM333.41 511.92C331.36 511.92 329.31 511.92 327.26 511.92C325.81 510.51 322.88 510.37 320.97 509.74C315.89 508.05 310.74 506.6 305.71 504.79C290.95 499.47 276.14 492.76 263.17 483.77C218.56 452.86 186.53 406.15 178.84 352.11C174.83 323.96 175.33 299.08 194.31 276.36C202.93 266.04 214.82 258.25 227.36 253.74C237.73 250.01 248.21 248.62 259.27 248.94C290.98 249.86 321.14 271.59 330.79 302.07C334.3 313.16 332.7 323.52 335.24 334.08C339.17 350.41 351.06 362.75 366.06 369.65C395.04 382.97 433.15 364.78 439.78 333.46C441.16 326.93 440.32 320.55 440.08 313.98C439.36 294.25 434.4 273.03 425.74 255.25C413.41 229.95 396.03 206.53 373.38 189.35C299.27 133.13 192.81 135.96 124.24 200.21C97.65 225.13 78.65 258.37 73.15 294.47C70.39 312.63 70.86 331.24 72.15 349.52C73.33 366.23 77.48 383.13 82.2 399.1C84.16 405.72 88.15 412.77 88.8 419.65C89.71 429.28 80.01 435.5 71.45 432.77C63.69 430.3 61.98 419.78 59.77 413.16C53.1 393.14 49.44 372.78 46.76 351.85C42.9 321.7 45.17 288.52 55.25 259.8C73.85 206.74 115.8 165.53 166.35 142.28C250.32 103.65 357.21 126.62 417.68 196.48C434.15 215.51 446.55 237.4 455.24 260.87C462.37 280.16 468.69 311.8 465.76 332.22C457.52 389.77 392.02 417.74 343.35 386.77C326.84 376.27 314.57 359.08 310.17 340.07C306.09 322.46 310.56 314.25 299.75 297.12C296.9 292.6 292.53 288.84 288.34 285.64C264.83 267.63 229.12 272.34 211.3 296.17C198.94 312.69 201.38 334.11 204.71 353.27C213.01 400.96 244.74 445.41 287.5 468.77C297.84 474.42 308.72 478.85 319.8 482.77C325.26 484.7 331.74 485.3 336.77 488.27C343.13 492.03 344.83 500.91 340.56 506.81C338.63 509.48 335.56 509.87 333.41 511.92ZM247.61 186.3C306.85 182.56 369.93 217.54 391.15 274.46C395.99 287.42 399.18 300.05 400.44 313.92C401.04 320.45 402.15 327.38 397.44 332.67C391.17 339.71 379.85 336.79 376.28 328.59C374.28 324.01 375.22 317.9 374.87 313.04C374.59 309.08 373.79 304.61 372.86 300.74C366.85 275.8 351.95 251.31 330.63 236.33C274.9 197.17 200.77 204.82 158.29 259.52C123 304.96 135.14 381.29 163.18 427.58C171.97 442.1 181.25 455.69 192.3 468.63C197.29 474.47 206.33 481 209.7 487.68C214.91 498 205.51 507.72 195.21 505.9C188.92 504.78 178.21 491.18 173.79 486.19C155.4 465.44 139.61 441.61 128.81 416.13C114.51 382.4 105.21 330.84 114.2 294.85C129.84 232.28 183.73 190.33 247.61 186.3ZM252.37 311.57C258.51 310.23 266.08 315.07 267.02 321.46C268.52 331.67 268.17 341.86 271.14 351.86C278.85 377.8 294.64 398.7 316.36 414.73C334.83 428.36 359.14 433.6 381.78 433.51C386.35 433.49 391.25 433.36 395.78 432.82C401.22 432.18 408.12 429.86 413.55 431.18C422.12 433.26 427.22 444.43 420.88 451.5C416.65 456.22 411.96 456.22 406.09 457.31C393.55 459.63 379.46 460.01 366.81 458.33C354.46 456.69 342.64 454.86 330.83 450.76C294.12 438.01 268.66 409.63 252.32 375.41C245.88 361.91 242.22 345.33 241.98 330.36C241.85 321.76 242.31 313.76 252.37 311.57Z" fill="currentColor"/>
                    </svg>
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

                {/* Bantuan (Full on page khusus bantuan) */}
                <div className="wa-menu-item" onClick={() => setIsHelpCenterOpen(true)}>
                  <div className="wa-menu-icon-box" style={{ background: 'transparent', color: '#2D2520' }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"/>
                      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
                      <line x1="12" y1="17" x2="12.01" y2="17"/>
                    </svg>
                  </div>
                  <div className="wa-menu-content">
                    <div className="wa-menu-title-row">
                      <span className="wa-menu-title">{t('helpCenterTitle') || 'Bantuan'}</span>
                    </div>
                    <span className="wa-menu-subtitle">{t('helpCenterSubtitle') || 'Pusat bantuan, FAQ, dan panduan'}</span>
                  </div>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="wa-menu-chevron">
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
                </div>

                {/* Groups (Kelola Kas & Uang Bersama) */}
                <div className="wa-menu-item tour-target-groups" onClick={() => setIsGroupsModalOpen(true)}>
                  <div className="wa-menu-icon-box" style={{ background: 'transparent', color: '#2D2520' }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                  </div>
                  <div className="wa-menu-content">
                    <div className="wa-menu-title-row">
                      <span className="wa-menu-title">Groups</span>
                    </div>
                    <span className="wa-menu-subtitle">Kelola kas & uang bersama secara transparan</span>
                  </div>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="wa-menu-chevron">
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
                </div>

                {/* Data & Cadangan */}
                <div className="wa-menu-item tour-target-backup" onClick={() => setIsBackupModalOpen(true)}>
                  <div className="wa-menu-icon-box backup-icon">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/>
                      <polyline points="12 13 12 17"/>
                      <polyline points="9 15 12 12 15 15"/>
                    </svg>
                  </div>
                  <div className="wa-menu-content">
                    <div className="wa-menu-title-row">
                      <span className="wa-menu-title">{t('backupSettingTitle') || 'Data & Cadangan'}</span>
                    </div>
                    <span className="wa-menu-subtitle">{t('backupSettingSubtitle') || 'Cadangkan atau pulihkan seluruh data'}</span>
                  </div>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="wa-menu-chevron">
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
                </div>

                {/* Ekspor Laporan Excel (.xlsx) */}
                <div 
                  className="wa-menu-item" 
                  onClick={async () => {
                    if (!isPro) {
                      handleOpenProModal('export');
                      return;
                    }
                    showVoiceToast('Sedang menyiapkan berkas laporan...');
                    const res = await exportTransactionsToSpreadsheet({
                      transactions,
                      currency: appCurrency,
                      profileName
                    });
                    if (res.success) {
                      showVoiceToast(`✅ Laporan ${res.fileName} berhasil diekspor!`);
                    } else {
                      showVoiceToast(`❌ ${res.error || 'Gagal mengekspor berkas'}`);
                    }
                  }}
                >
                  <div className="wa-menu-icon-box" style={{ background: 'transparent', color: '#D97706' }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                      <polyline points="14 2 14 8 20 8"></polyline>
                      <line x1="8" y1="13" x2="16" y2="13"></line>
                      <line x1="8" y1="17" x2="16" y2="17"></line>
                      <line x1="10" y1="9" x2="8" y2="9"></line>
                    </svg>
                  </div>
                  <div className="wa-menu-content">
                    <div className="wa-menu-title-row" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span className="wa-menu-title">Ekspor Laporan Excel</span>
                      <span style={{
                        fontSize: '10px',
                        fontWeight: 800,
                        background: 'linear-gradient(135deg, #F59E0B, #D97706)',
                        color: '#FFFFFF',
                        padding: '1px 6px',
                        borderRadius: '6px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '2px'
                      }}>
                        👑 PRO
                      </span>
                    </div>
                    <span className="wa-menu-subtitle">Unduh seluruh rekapan transaksi ke format Excel (.xlsx)</span>
                  </div>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="wa-menu-chevron">
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
                </div>

                {/* ========================================================
                    5. LAINNYA
                   ======================================================== */}
                <h4 className="wa-profile-section-title">{t('sectionOthers') || 'LAINNYA'}</h4>

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

                {/* Tentang Cassiel */}
                <div className="wa-menu-item" onClick={() => setIsAboutModalOpen(true)}>
                  <div className="wa-menu-icon-box" style={{ background: 'transparent', color: '#2D2520' }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                    </svg>
                  </div>
                  <div className="wa-menu-content">
                    <div className="wa-menu-title-row">
                      <span className="wa-menu-title">{t('aboutTitle') || 'Tentang Kami'}</span>
                    </div>
                    <span className="wa-menu-subtitle">{t('aboutSubtitle') || 'Informasi aplikasi dan pengembang'}</span>
                  </div>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="wa-menu-chevron">
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
                </div>

                {/* Kebijakan Privasi */}
                <div className="wa-menu-item" onClick={() => setIsPrivacyModalOpen(true)}>
                  <div className="wa-menu-icon-box" style={{ background: 'transparent', color: '#2D2520' }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                  </div>
                  <div className="wa-menu-content">
                    <div className="wa-menu-title-row">
                      <span className="wa-menu-title">{t('privacyPolicyTitle') || 'Kebijakan Privasi'}</span>
                    </div>
                    <span className="wa-menu-subtitle">{t('privacyPolicySubtitle') || 'Komitmen keamanan & privasi data lokal'}</span>
                  </div>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="wa-menu-chevron">
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
                </div>

                {/* Ketentuan Layanan */}
                <div className="wa-menu-item" onClick={() => setIsTermsModalOpen(true)}>
                  <div className="wa-menu-icon-box" style={{ background: 'transparent', color: '#2D2520' }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                      <polyline points="14 2 14 8 20 8"/>
                      <line x1="16" y1="13" x2="8" y2="13"/>
                      <line x1="16" y1="17" x2="8" y2="17"/>
                      <polyline points="10 9 9 9 8 9"/>
                    </svg>
                  </div>
                  <div className="wa-menu-content">
                    <div className="wa-menu-title-row">
                      <span className="wa-menu-title">{t('termsOfServiceTitle') || 'Ketentuan Layanan'}</span>
                    </div>
                    <span className="wa-menu-subtitle">{t('termsOfServiceSubtitle') || 'Syarat dan ketentuan penggunaan aplikasi'}</span>
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

      {/* Full-Page Screen: Pusat Bantuan */}
      {isHelpCenterOpen && (
        <div className="modal-overlay profile-setup-overlay full-page-profile-screen">
          <div className="wa-profile-screen-container">
            {/* Top Bar Header */}
            <div className="wa-profile-top-header">
              <button
                type="button"
                className="back-btn"
                onClick={() => setIsHelpCenterOpen(false)}
                aria-label="Kembali"
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 12H5M12 19l-7-7 7-7"/>
                </svg>
              </button>
              <h3 className="profile-modal-title">{t('helpCenterHeader') || 'Bantuan'}</h3>
            </div>

            <div className="full-page-sub-body">
              <div className="full-page-settings-group">
                {/* 1. Panduan Aplikasi */}
                <div 
                  className="wa-menu-item" 
                  onClick={() => {
                    setIsHelpCenterOpen(false);
                    handleOpenFullGuide();
                  }}
                >
                  <div className="wa-menu-icon-box" style={{ background: 'transparent', color: '#2D2520' }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
                      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
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

                {/* 2. FAQ */}
                <div 
                  className="wa-menu-item" 
                  onClick={() => setIsFaqModalOpen(true)}
                >
                  <div className="wa-menu-icon-box" style={{ background: 'transparent', color: '#2D2520' }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"/>
                      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
                      <line x1="12" y1="17" x2="12.01" y2="17"/>
                    </svg>
                  </div>
                  <div className="wa-menu-content">
                    <div className="wa-menu-title-row">
                      <span className="wa-menu-title">{t('faqTitle') || 'FAQ'}</span>
                    </div>
                    <span className="wa-menu-subtitle">{t('faqSubtitle') || 'Pertanyaan seputar penggunaan aplikasi'}</span>
                  </div>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="wa-menu-chevron">
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
                </div>

                {/* 3. Laporkan Masalah */}
                <div 
                  className="wa-menu-item" 
                  onClick={() => setIsReportIssueModalOpen(true)}
                >
                  <div className="wa-menu-icon-box" style={{ background: 'transparent', color: '#2D2520' }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                      <line x1="12" y1="9" x2="12" y2="13"/>
                      <line x1="12" y1="17" x2="12.01" y2="17"/>
                    </svg>
                  </div>
                  <div className="wa-menu-content">
                    <div className="wa-menu-title-row">
                      <span className="wa-menu-title">{t('reportIssueTitle') || 'Laporkan Masalah'}</span>
                    </div>
                    <span className="wa-menu-subtitle">{t('reportIssueSubtitle') || 'Laporkan kendala, galat, atau bug di aplikasi'}</span>
                  </div>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="wa-menu-chevron">
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
                </div>

                {/* 4. Hubungi Kami */}
                <div 
                  className="wa-menu-item" 
                  onClick={() => setIsContactUsModalOpen(true)}
                >
                  <div className="wa-menu-icon-box" style={{ background: 'transparent', color: '#2D2520' }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                      <polyline points="22,6 12,13 2,6"/>
                    </svg>
                  </div>
                  <div className="wa-menu-content">
                    <div className="wa-menu-title-row">
                      <span className="wa-menu-title">{t('contactUsTitle') || 'Hubungi Kami'}</span>
                    </div>
                    <span className="wa-menu-subtitle">{t('contactUsSubtitle') || 'Hubungi pengembang melalui email atau media sosial'}</span>
                  </div>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="wa-menu-chevron">
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Full-Page Screen: FAQ */}
      {isFaqModalOpen && (
        <div className="modal-overlay profile-setup-overlay full-page-profile-screen">
          <div className="wa-profile-screen-container">
            {/* Top Navigation Bar with Back Arrow */}
            <div className="wa-profile-top-header" style={{ borderBottom: 'none', padding: '16px 20px 8px' }}>
              <button
                type="button"
                className="back-btn"
                onClick={() => setIsFaqModalOpen(false)}
                aria-label="Kembali"
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 12H5M12 19l-7-7 7-7"/>
                </svg>
              </button>
            </div>

            <div className="full-page-sub-body" style={{ padding: '0 24px 48px' }}>
              <div className="faq-screen-editorial-wrapper">

                {/* FLOQ-Style Brand Header Bar */}
                <div className="about-floq-brand-bar">
                  <div className="about-floq-brand-left">
                    <img src="./Cassiel logo.png" alt="Cassiel" className="about-floq-logo-img" />
                    <span className="about-floq-brand-name">CASSIEL</span>
                  </div>
                  <div className="about-floq-brand-menu">
                    <span className="about-floq-menu-line"></span>
                    <span className="about-floq-menu-line"></span>
                  </div>
                </div>

                {/* Giant FLOQ-Style 2-Line Hero Title */}
                <div className="about-floq-hero">
                  <h1 className="about-floq-hero-title">
                    Tanya &<br />Jawab
                  </h1>
                </div>

                {/* Lead Headline Editorial Paragraph */}
                <div className="about-floq-lead-editorial">
                  <p className="about-floq-lead-text">
                    Temukan jawaban lengkap dan panduan cepat seputar penggunaan <strong className="about-floq-highlight">CASSIEL</strong>, mulai dari pencatatan suara, keamanan privasi, hingga sinkronisasi data lokal.
                  </p>
                </div>

                {/* FAQ List */}
                <div className="faq-list-container">
                  {FAQ_ITEMS.map((item, idx) => {
                    const isOpen = expandedFaqId === item.id;
                    const paragraphs = item.answer.split('\n\n');
                    const numStr = String(idx + 1).padStart(2, '0');
                    return (
                      <div key={item.id} className={`faq-item-editorial ${isOpen ? 'expanded' : ''}`}>
                        <button
                          type="button"
                          className="faq-question-btn-editorial"
                          onClick={() => setExpandedFaqId(isOpen ? null : item.id)}
                        >
                          <span className="faq-num-editorial">{numStr}</span>
                          <span className="faq-question-text-editorial">{item.question}</span>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="faq-toggle-icon-editorial">
                            <polyline points="6 9 12 15 18 9"/>
                          </svg>
                        </button>
                        {isOpen && (
                          <div className="faq-answer-box-editorial">
                            {paragraphs.map((para, pIdx) => {
                              if (para.startsWith('Contoh:')) {
                                const lines = para.split('\n');
                                return (
                                  <div key={pIdx} className="faq-answer-paragraph-editorial">
                                    <p style={{ margin: '0 0 4px 0', fontWeight: '700', color: '#2D2520' }}>{lines[0]}</p>
                                    {lines.slice(1).map((line, lIdx) => (
                                      <div key={lIdx} className="faq-quote-box-editorial">
                                        {line.replace(/^>\s*/, '')}
                                      </div>
                                    ))}
                                  </div>
                                );
                              }
                              return (
                                <p key={pIdx} className="faq-answer-paragraph-editorial">
                                  {para}
                                </p>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Footer Tagline */}
                <div className="about-floq-footer" style={{ marginTop: '36px' }}>
                  <p className="about-floq-footer-tagline">Catat. Analisis. Bijak Berbelanja.</p>
                  <p className="about-floq-footer-sub">Cassiel Finance App</p>
                </div>

              </div>
            </div>
          </div>
        </div>
      )}

      {/* Full-Page Screen: Laporkan Masalah */}
      {isReportIssueModalOpen && (
        <div className="modal-overlay profile-setup-overlay full-page-profile-screen">
          <div className="wa-profile-screen-container">
            <div className="wa-profile-top-header">
              <button
                type="button"
                className="back-btn"
                onClick={handleCloseReportIssue}
                aria-label="Kembali"
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 12H5M12 19l-7-7 7-7"/>
                </svg>
              </button>
              <h3 className="profile-modal-title">Laporkan Masalah</h3>
            </div>

            <div className="full-page-sub-body">
              {isReportSubmittedSuccess ? (
                /* Sukses View */
                <div className="report-success-view">
                  <div className="report-success-icon-box">
                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  </div>
                  <h3 className="report-success-title">Laporan Terkirim</h3>
                  <p className="report-success-desc">
                    Terima kasih. Laporanmu sudah diterima dan akan kami periksa.
                  </p>
                  <button
                    type="button"
                    className="report-return-btn"
                    onClick={handleCloseReportIssue}
                  >
                    Kembali ke Bantuan
                  </button>
                </div>
              ) : (
                /* Form View */
                <div className="report-issue-container">
                  <p className="report-intro-text">
                    Menemukan sesuatu yang tidak bekerja sebagaimana mestinya? Beri tahu kami agar dapat memperbaikinya.
                  </p>

                  {/* 1. Jenis Masalah (Custom Dropdown Selector) */}
                  <div className="report-form-group" style={{ position: 'relative', zIndex: 20 }}>
                    <label className="report-section-label">
                      1. Jenis Masalah <span className="report-required-mark">*</span>
                    </label>
                    <div className="report-dropdown-wrapper">
                      <button
                        type="button"
                        className={`report-dropdown-trigger ${isReportCatDropdownOpen ? 'active' : ''} ${reportIssueCat ? 'has-value' : ''}`}
                        onClick={() => setIsReportCatDropdownOpen(!isReportCatDropdownOpen)}
                      >
                        <span className="report-dropdown-selected-text">
                          {reportIssueCat || 'Pilih jenis masalah yang kamu alami...'}
                        </span>
                        <svg
                          className={`report-dropdown-chevron ${isReportCatDropdownOpen ? 'open' : ''}`}
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="6 9 12 15 18 9" />
                        </svg>
                      </button>

                      {isReportCatDropdownOpen && (
                        <div className="report-dropdown-menu">
                          {[
                            { id: 'Transaksi', icon: '💸', desc: 'Gagal catat, salah hitung, atau edit transaksi' },
                            { id: 'Voice AI', icon: '🎙️', desc: 'Asisten suara salah mengenali kata / angka' },
                            { id: 'Akun', icon: '💳', desc: 'Saldo tidak sesuai atau kendala akun bank/e-wallet' },
                            { id: 'Budget', icon: '🎯', desc: 'Batas anggaran bulanan atau progress bar' },
                            { id: 'Statistik & Insight', icon: '📊', desc: 'Grafik pengeluaran atau ringkasan bulanan' },
                            { id: 'Backup & Restore', icon: '💾', desc: 'Ekspor berkas cadangan atau impor data' },
                            { id: 'Tampilan', icon: '✨', desc: 'Tata letak berantakan atau tombol tidak pas' },
                            { id: 'Performa', icon: '⚡', desc: 'Aplikasi terasa lambat, lag, atau freeze' },
                            { id: 'Lainnya', icon: '💬', desc: 'Kendala atau pertanyaan teknis lainnya' }
                          ].map((item) => (
                            <button
                              key={item.id}
                              type="button"
                              className={`report-dropdown-item ${reportIssueCat === item.id ? 'selected' : ''}`}
                              onClick={() => {
                                setReportIssueCat(item.id);
                                setIsReportCatDropdownOpen(false);
                              }}
                            >
                              <span className="report-dropdown-item-icon">{item.icon}</span>
                              <div className="report-dropdown-item-info">
                                <span className="report-dropdown-item-title">{item.id}</span>
                                <span className="report-dropdown-item-desc">{item.desc}</span>
                              </div>
                              {reportIssueCat === item.id && (
                                <svg className="report-dropdown-item-check" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#BC6C25" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                              )}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 2. Jelaskan Masalah */}
                  <div className="report-form-group">
                    <label className="report-section-label">
                      2. Jelaskan Masalah <span className="report-required-mark">*</span>
                    </label>
                    <p className="report-hint-text">
                      Ceritakan apa yang kamu lakukan dan apa yang terjadi setelahnya.
                    </p>
                    <div className="report-textarea-container">
                      <textarea
                        className="report-textarea"
                        placeholder={'Jelaskan apa yang terjadi...\n\nContoh: Saya mengucapkan "beli kopi 20 ribu", tetapi nominal yang muncul menjadi Rp200.000.'}
                        value={reportIssueText}
                        onChange={(e) => setReportIssueText(e.target.value)}
                        autoFocus
                      />
                    </div>
                  </div>

                  {/* 3. Tambahkan Screenshot (Opsional) */}
                  <div className="report-form-group report-screenshot-container">
                    <label className="report-section-label">
                      3. Tambahkan Screenshot (Opsional)
                    </label>
                    
                    {/* Hidden Native File Input */}
                    <input
                      ref={reportFileInputRef}
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={handleScreenshotChange}
                    />

                    {reportIssueScreenshot ? (
                      <div className="report-screenshot-preview-box">
                        <img 
                          src={reportIssueScreenshot} 
                          alt="Screenshot Masalah" 
                          className="report-screenshot-img" 
                        />
                        <button
                          type="button"
                          className="report-screenshot-remove-btn"
                          onClick={handleRemoveScreenshot}
                          title="Hapus Screenshot"
                          aria-label="Hapus Screenshot"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"/>
                            <line x1="6" y1="6" x2="18" y2="18"/>
                          </svg>
                        </button>
                      </div>
                    ) : (
                      <div className="report-upload-btn-box">
                        <button
                          type="button"
                          className="report-upload-trigger-btn"
                          onClick={() => reportFileInputRef.current && reportFileInputRef.current.click()}
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                            <circle cx="8.5" cy="8.5" r="1.5"/>
                            <polyline points="21 15 16 10 5 21"/>
                          </svg>
                          <span>Pilih Gambar / Screenshot</span>
                        </button>
                      </div>
                    )}

                    <p className="report-privacy-note">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="12" y1="16" x2="12" y2="12"/>
                        <line x1="12" y1="8" x2="12.01" y2="8"/>
                      </svg>
                      <span>Pastikan screenshot tidak berisi informasi sensitif yang tidak ingin kamu bagikan.</span>
                    </p>
                  </div>

                  {/* Tombol Kirim Laporan */}
                  <button
                    type="button"
                    className="report-submit-btn"
                    disabled={isSubmittingReport || !reportIssueCat || !reportIssueText.trim()}
                    onClick={handleSubmitReportIssue}
                  >
                    {isSubmittingReport ? (
                      <>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="spin-animate">
                          <circle cx="12" cy="12" r="10" strokeDasharray="32" strokeDashoffset="12"/>
                        </svg>
                        <span>Mengirim...</span>
                      </>
                    ) : (
                      <span>Kirim Laporan</span>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Full-Page Screen: Hubungi Kami */}
      {isContactUsModalOpen && (
        <div className="modal-overlay profile-setup-overlay full-page-profile-screen">
          <div className="wa-profile-screen-container">
            {/* Top Navigation Bar */}
            <div className="wa-profile-top-header" style={{ borderBottom: 'none', padding: '16px 20px 8px' }}>
              <button
                type="button"
                className="back-btn"
                onClick={() => setIsContactUsModalOpen(false)}
                aria-label="Kembali"
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 12H5M12 19l-7-7 7-7"/>
                </svg>
              </button>
            </div>

            <div className="full-page-sub-body" style={{ padding: '0 24px 56px' }}>
              <div className="privacy-screen-editorial-wrapper">

                {/* FLOQ Brand Bar */}
                <div className="about-floq-brand-bar">
                  <div className="about-floq-brand-left">
                    <img src="./Cassiel logo.png" alt="Cassiel" className="about-floq-logo-img" />
                    <span className="about-floq-brand-name">CASSIEL</span>
                  </div>
                  <div className="about-floq-brand-menu">
                    <span className="about-floq-menu-line"></span>
                    <span className="about-floq-menu-line"></span>
                  </div>
                </div>

                {/* Giant Hero Title */}
                <div className="about-floq-hero">
                  <h1 className="about-floq-hero-title">
                    Hubungi<br />Kami
                  </h1>
                </div>

                {/* Lead */}
                <div className="about-floq-lead-editorial">
                  <p className="about-floq-lead-text">
                    Ada pertanyaan, masukan, atau keperluan kerja sama untuk <strong className="about-floq-highlight">CASSIEL</strong>? Hubungi kami langsung melalui kanal di bawah.
                  </p>
                </div>

                {/* ── KANAL KONTAK ── */}
                <div className="about-floq-section">
                  <h3 className="about-floq-section-heading">Kanal Kontak Resmi</h3>
                  <div className="contact-floq-list">

                    {/* Email */}
                    <a
                      href="mailto:stevanusredi199@gmail.com?subject=Pesan%20dari%20Cassiel%20App"
                      className="contact-floq-row"
                    >
                      <div className="contact-floq-icon-wrap">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#BC6C25" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                          <polyline points="22,6 12,13 2,6"/>
                        </svg>
                      </div>
                      <div className="contact-floq-text">
                        <span className="contact-floq-label">Email</span>
                        <span className="contact-floq-value">stevanusredi199@gmail.com</span>
                      </div>
                      <svg className="contact-floq-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 12h14M12 5l7 7-7 7"/>
                      </svg>
                    </a>

                    {/* Instagram */}
                    <a
                      href="https://www.instagram.com/redii_rm/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="contact-floq-row"
                    >
                      <div className="contact-floq-icon-wrap">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#BC6C25" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                          <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
                        </svg>
                      </div>
                      <div className="contact-floq-text">
                        <span className="contact-floq-label">Instagram</span>
                        <span className="contact-floq-value">@redii_rm</span>
                      </div>
                      <svg className="contact-floq-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 12h14M12 5l7 7-7 7"/>
                      </svg>
                    </a>

                  </div>
                </div>

                {/* ── DIVIDER ── */}
                <div style={{ height: '1px', background: 'rgba(188,108,37,0.12)', margin: '8px 0 28px' }} />

                {/* ── LAPORAN MASALAH ── */}
                <div className="about-floq-section" style={{ marginBottom: '0' }}>
                  <h3 className="about-floq-section-heading">Ada Masalah di Aplikasi?</h3>
                  <div className="about-floq-narrative">
                    <p>Untuk bug, error, atau kendala teknis, gunakan fitur <strong>Laporkan Masalah</strong> yang tersedia di menu Saran &amp; Masukan agar dapat ditangani lebih cepat.</p>
                  </div>
                  <button
                    type="button"
                    className="contact-floq-report-btn"
                    onClick={() => {
                      setIsContactUsModalOpen(false);
                      setTimeout(() => setIsFeedbackModalOpen(true), 200);
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                      <line x1="12" y1="9" x2="12" y2="13"/>
                      <line x1="12" y1="17" x2="12.01" y2="17"/>
                    </svg>
                    Laporkan Masalah
                  </button>
                </div>

                {/* Footer */}
                <div className="about-floq-footer" style={{ marginTop: '48px' }}>
                  <p className="about-floq-footer-tagline">Catat. Analisis. Bijak Berbelanja.</p>
                  <p className="about-floq-footer-sub">Cassiel Finance App</p>
                </div>

              </div>
            </div>
          </div>
        </div>
      )}

      {/* Full-Page Screen: Tentang Kami */}
      {/* Full-Page Screen: Tentang Kami */}
      {isAboutModalOpen && (
        <div className="modal-overlay profile-setup-overlay full-page-profile-screen">
          <div className="wa-profile-screen-container">
            {/* Top Navigation Bar with Back Arrow */}
            <div className="wa-profile-top-header" style={{ borderBottom: 'none', padding: '16px 20px 8px' }}>
              <button
                type="button"
                className="back-btn"
                onClick={() => setIsAboutModalOpen(false)}
                aria-label="Kembali"
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 12H5M12 19l-7-7 7-7"/>
                </svg>
              </button>
            </div>

            <div className="full-page-sub-body" style={{ padding: '0 24px 48px' }}>
              <div className="about-screen-wrapper aboutkami-wrapper">

                {/* FLOQ-Style Brand Header Bar */}
                <div className="about-floq-brand-bar">
                  <div className="about-floq-brand-left">
                    <img src="./Cassiel logo.png" alt="Cassiel" className="about-floq-logo-img" />
                    <span className="about-floq-brand-name">CASSIEL</span>
                  </div>
                  <div className="about-floq-brand-menu">
                    <span className="about-floq-menu-line"></span>
                    <span className="about-floq-menu-line"></span>
                  </div>
                </div>

                {/* Giant FLOQ-Style 2-Line Hero Title */}
                <div className="about-floq-hero">
                  <h1 className="about-floq-hero-title">
                    Tentang<br />Kami
                  </h1>
                </div>

                {/* Lead Headline Editorial Paragraphs */}
                <div className="about-floq-lead-editorial">
                  <p className="about-floq-lead-text">
                    <strong className="about-floq-highlight">CASSIEL</strong> adalah aplikasi pencatat keuangan pribadi yang dirancang dengan prinsip <em>offline-first & zero-data-leakage</em>. Kami menghadirkan pengalaman pencatatan yang tenang, cepat, dan aman tanpa gangguan iklan maupun pop-up yang tidak diperlukan.
                  </p>
                  <p className="about-floq-lead-text" style={{ marginTop: '18px' }}>
                    Lebih dari sekadar alat pencatat, <strong className="about-floq-highlight">CASSIEL</strong> berkomitmen membantu setiap individu memahami pola pengeluaran hariannya dengan jujur dan penuh kesadaran.
                  </p>
                </div>

                {/* Section: Kenapa Cassiel Dibuat */}
                <div className="about-floq-section">
                  <h3 className="about-floq-section-heading">Kenapa Cassiel dibuat?</h3>
                  <div className="about-floq-narrative">
                    <p>Saya percaya mencatat keuangan seharusnya sederhana dan menenangkan.</p>
                    <p>Sebelum membuat Cassiel, saya pernah menggunakan berbagai aplikasi keuangan lain. Saya hanya ingin mencatat pengeluaran harian dengan cepat, tetapi iklan, pop-up promosi, dan antarmuka yang membingungkan sering kali menjadi distraksi besar.</p>
                    <p>Dari keresahan itu, lahir <strong>Cassiel</strong>, sebuah ruang privat yang hening dan nyaman untuk merefleksikan ke mana uang kita pergi setiap hari.</p>
                  </div>
                </div>

                {/* Section: Visi & Misi */}
                <div className="about-floq-section">
                  <h3 className="about-floq-section-heading">Visi & Misi</h3>
                  <div className="about-floq-visi-editorial">
                    <p>“Membuat pengelolaan keuangan pribadi menjadi lebih sederhana, tenang, dan transparan bagi semua orang.”</p>
                  </div>
                  <div className="about-floq-misi-list">
                    <div className="about-floq-misi-row">
                      <span className="about-floq-misi-num">01</span>
                      <div className="about-floq-misi-body">
                        <h4 className="about-floq-misi-title">Sederhanakan</h4>
                        <p className="about-floq-misi-desc">Pencatatan instan hanya dalam hitungan detik tanpa langkah berbelit.</p>
                      </div>
                    </div>
                    <div className="about-floq-misi-row">
                      <span className="about-floq-misi-num">02</span>
                      <div className="about-floq-misi-body">
                        <h4 className="about-floq-misi-title">Berikan Pemahaman</h4>
                        <p className="about-floq-misi-desc">Visualisasi statistik dan insight cerdas yang mudah dicerna secara langsung.</p>
                      </div>
                    </div>
                    <div className="about-floq-misi-row">
                      <span className="about-floq-misi-num">03</span>
                      <div className="about-floq-misi-body">
                        <h4 className="about-floq-misi-title">Hilangkan Gangguan</h4>
                        <p className="about-floq-misi-desc">100% bebas iklan dan privasi lokal tanpa kebocoran data pengguna.</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section: Makna Nama Cassiel */}
                <div className="about-floq-section">
                  <h3 className="about-floq-section-heading">Mengapa Cassiel?</h3>
                  <div className="about-floq-narrative">
                    <p>Nama <strong>Cassiel</strong> terinspirasi dari sosok pelindung waktu dan ketenangan. Bagi kami, waktu dan keuangan adalah dua hal yang tak terpisahkan, di mana setiap keputusan hari ini membentuk ketenangan masa depan.</p>
                  </div>
                </div>

                {/* Section: Nilai Utama */}
                <div className="about-floq-section">
                  <h3 className="about-floq-section-heading">Nilai yang Kami Pegang</h3>
                  <div className="about-floq-values-list">
                    <div className="about-floq-val-row">
                      <h4 className="about-floq-val-name">Sederhana</h4>
                      <p className="about-floq-val-desc">Mudah digunakan tanpa kerumitan fitur berlebih.</p>
                    </div>
                    <div className="about-floq-val-row">
                      <h4 className="about-floq-val-name">Privasi</h4>
                      <p className="about-floq-val-desc">Data tersimpan privat di perangkat lokal Anda.</p>
                    </div>
                    <div className="about-floq-val-row">
                      <h4 className="about-floq-val-name">Bebas Gangguan</h4>
                      <p className="about-floq-val-desc">Ruang tenang mencatat tanpa distraksi iklan.</p>
                    </div>
                    <div className="about-floq-val-row">
                      <h4 className="about-floq-val-name">Jujur</h4>
                      <p className="about-floq-val-desc">Melihat kondisi keuangan apa adanya secara akurat.</p>
                    </div>
                  </div>
                </div>

                {/* Section: Dibuat Oleh */}
                <div className="about-floq-section">
                  <h3 className="about-floq-section-heading">Dibuat oleh</h3>
                  <div className="about-floq-narrative">
                    <h4 className="about-floq-author-name">Redi Mariyono</h4>
                    <p>
                      Cassiel dibangun dengan dedikasi penuh untuk menghadirkan pengalaman finansial yang lebih personal, manusiawi, dan memberdayakan.
                    </p>
                  </div>
                </div>

                {/* Footer Tagline */}
                <div className="about-floq-footer">
                  <p className="about-floq-footer-tagline">Catat. Analisis. Bijak Berbelanja.</p>
                  <p className="about-floq-footer-sub">Cassiel Finance App</p>
                </div>

              </div>
            </div>
          </div>
        </div>
      )}

      {/* Full-Page Screen: Kebijakan Privasi */}
      {isPrivacyModalOpen && (
        <div className="modal-overlay profile-setup-overlay full-page-profile-screen">
          <div className="wa-profile-screen-container">
            {/* Top Navigation Bar with Back Arrow */}
            <div className="wa-profile-top-header" style={{ borderBottom: 'none', padding: '16px 20px 8px' }}>
              <button
                type="button"
                className="back-btn"
                onClick={() => setIsPrivacyModalOpen(false)}
                aria-label="Kembali"
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 12H5M12 19l-7-7 7-7"/>
                </svg>
              </button>
            </div>

            <div className="full-page-sub-body" style={{ padding: '0 24px 48px' }}>
              <div className="privacy-screen-editorial-wrapper">

                {/* FLOQ-Style Brand Header Bar */}
                <div className="about-floq-brand-bar">
                  <div className="about-floq-brand-left">
                    <img src="./Cassiel logo.png" alt="Cassiel" className="about-floq-logo-img" />
                    <span className="about-floq-brand-name">CASSIEL</span>
                  </div>
                  <div className="about-floq-brand-menu">
                    <span className="about-floq-menu-line"></span>
                    <span className="about-floq-menu-line"></span>
                  </div>
                </div>

                {/* Giant FLOQ-Style 2-Line Hero Title */}
                <div className="about-floq-hero">
                  <h1 className="about-floq-hero-title">
                    Kebijakan<br />Privasi
                  </h1>
                </div>

                {/* Lead Headline Editorial Paragraph */}
                <div className="about-floq-lead-editorial">
                  <p className="about-floq-lead-text">
                    Privasi Anda adalah komitmen utama <strong className="about-floq-highlight">CASSIEL</strong>. Kami menyusun kebijakan ini secara transparan dan jujur berdasarkan cara kerja teknis aplikasi yang sebenarnya, tanpa menyembunyikan pemrosesan data apa pun.
                  </p>
                </div>

                {/* 1. Data yang Disimpan di Perangkat (Lokal) */}
                <div className="about-floq-section">
                  <h3 className="about-floq-section-heading">Data yang Disimpan di Perangkat</h3>
                  <div className="about-floq-narrative">
                    <p>Hampir seluruh data operasional Anda disimpan secara lokal di perangkat Anda menggunakan penyimpanan lokal (<em>localStorage</em> / <em>secureStorage</em>). Data ini meliputi:</p>
                    <div className="about-floq-values-list" style={{ marginTop: '8px' }}>
                      <div className="about-floq-val-row">
                        <h4 className="about-floq-val-name">Catatan Transaksi</h4>
                        <p className="about-floq-val-desc">Nominal uang, tanggal, kategori belanja/pemasukan, catatan pribadi, dan akun dompet yang dipilih.</p>
                      </div>
                      <div className="about-floq-val-row">
                        <h4 className="about-floq-val-name">Akun & Saldo</h4>
                        <p className="about-floq-val-desc">Daftar nama akun (bank/e-wallet), saldo awal, dan riwayat mutasi.</p>
                      </div>
                      <div className="about-floq-val-row">
                        <h4 className="about-floq-val-name">Anggaran & Preferensi</h4>
                        <p className="about-floq-val-desc">Batas budget bulanan, preferensi bahasa, gaya font, mata uang aktif, nama profil, dan foto profil.</p>
                      </div>
                      <div className="about-floq-val-row">
                        <h4 className="about-floq-val-name">Keamanan Lokal</h4>
                        <p className="about-floq-val-desc">Kode hash PIN keamanan untuk mengunci aplikasi di perangkat Anda.</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Data yang Dikirim ke Layanan Luar */}
                <div className="about-floq-section">
                  <h3 className="about-floq-section-heading">Data yang Terkirim ke Layanan Luar</h3>
                  <div className="about-floq-narrative">
                    <p>Cassiel menggunakan beberapa layanan pihak ketiga untuk kebutuhan teknis tertentu saat perangkat Anda terhubung ke internet:</p>
                    <div className="about-floq-misi-list" style={{ marginTop: '12px' }}>
                      <div className="about-floq-misi-row">
                        <span className="about-floq-misi-num">01</span>
                        <div className="about-floq-misi-body">
                          <h4 className="about-floq-misi-title">Telemetri Teknis & Agregat (Firebase Firestore)</h4>
                          <p className="about-floq-misi-desc">
                            Untuk memantau stabilitas dan penggunaan fitur, aplikasi mengirimkan ID perangkat acak (misal: <code>dev_xxxx</code>), nama profil, tipe perangkat/OS, versi aplikasi, durasi aktif, jumlah transaksi, serta agregat statistik kategori bulan berjalan. Rincian deskripsi transaksi pribadi Anda tidak dikirim.
                          </p>
                        </div>
                      </div>
                      <div className="about-floq-misi-row">
                        <span className="about-floq-misi-num">02</span>
                        <div className="about-floq-misi-body">
                          <h4 className="about-floq-misi-title">Saran & Laporan Masalah (Firebase Firestore)</h4>
                          <p className="about-floq-misi-desc">
                            Saat Anda mengirim masukan atau laporan bug melalui menu Saran & Masukan, data pesan, kategori, ID perangkat, dan tangkapan layar opsional akan disimpan di database Firebase pengembang agar masalah dapat diperbaiki.
                          </p>
                        </div>
                      </div>
                      <div className="about-floq-misi-row">
                        <span className="about-floq-misi-num">03</span>
                        <div className="about-floq-misi-body">
                          <h4 className="about-floq-misi-title">Kurs Mata Uang Real-Time (Open Exchange Rates)</h4>
                          <p className="about-floq-misi-desc">
                            Aplikasi memanggil API publik kurs mata uang (open.er-api.com) dan mengunduh bendera negara (flagcdn.com). Tidak ada data pengguna yang dikirim saat permintaan ini berlangsung.
                          </p>
                        </div>
                      </div>
                      <div className="about-floq-misi-row">
                        <span className="about-floq-misi-num">04</span>
                        <div className="about-floq-misi-body">
                          <h4 className="about-floq-misi-title">Pemeriksaan Pembaruan Aplikasi (GitHub API)</h4>
                          <p className="about-floq-misi-desc">
                            Aplikasi memeriksa repositori GitHub publik untuk mendeteksi apakah tersedia versi APK terbaru. Tidak ada data pribadi yang dikirim.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. Cara Kerja Voice AI */}
                <div className="about-floq-section">
                  <h3 className="about-floq-section-heading">Pemrosesan Suara (Voice AI)</h3>
                  <div className="about-floq-narrative">
                    <p>
                      Fitur input suara menggunakan mesin Speech Recognition bawaan sistem perangkat Anda (Android Speech / Web Speech). 
                    </p>
                    <p>
                      Setelah suara diubah menjadi teks, seluruh logika pengenalan angka, kategori, nominal belanja, dan koreksi kata diproses secara lokal langsung di dalam kode aplikasi tanpa dikirim ke server AI eksternal. Rekaman audio Anda tidak disimpan oleh Cassiel.
                    </p>
                  </div>
                </div>

                {/* 4. Cadangan Data & Berbagi Berkas */}
                <div className="about-floq-section">
                  <h3 className="about-floq-section-heading">Cadangan Data (Backup & Restore)</h3>
                  <div className="about-floq-narrative">
                    <p>
                      Fitur cadangan mengekspor seluruh data lokal Anda ke dalam berkas teks mandiri (<code>.txt</code> / JSON).
                    </p>
                    <p>
                      Ketika Anda memilih opsi simpan ke Google Drive, iCloud, atau WhatsApp, aplikasi memanfaatkan menu Share bawaan sistem operasi. Berkas cadangan tersebut dikelola langsung oleh Anda dan akun penyimpanan pribadi Anda.
                    </p>
                  </div>
                </div>

                {/* 5. Iklan & Pelacakan Pihak Ketiga */}
                <div className="about-floq-section">
                  <h3 className="about-floq-section-heading">Iklan & Pelacakan Komersial</h3>
                  <div className="about-floq-narrative">
                    <p>
                      Cassiel 100% bebas dari SDK periklanan pihak ketiga (seperti Google AdMob, Unity Ads, atau Facebook Audience Network). Kami tidak menjual atau menyewakan data Anda kepada pengiklan atau broker data mana pun.
                    </p>
                  </div>
                </div>

                {/* 6. Keamanan Data & Akses Perangkat */}
                <div className="about-floq-section">
                  <h3 className="about-floq-section-heading">Keamanan & Kontrol Pengguna</h3>
                  <div className="about-floq-values-list">
                    <div className="about-floq-val-row">
                      <h4 className="about-floq-val-name">Kunci PIN & Biometrik</h4>
                      <p className="about-floq-val-desc">Anda dapat mengaktifkan proteksi PIN 6-digit dan autentikasi sidik jari untuk mencegah akses fisik tidak sah ke aplikasi.</p>
                    </div>
                    <div className="about-floq-val-row">
                      <h4 className="about-floq-val-name">Edit & Hapus Kapan Saja</h4>
                      <p className="about-floq-val-desc">Anda memiliki kendali penuh untuk menambah, mengedit, atau menghapus setiap data transaksi, kategori, dan akun secara langsung.</p>
                    </div>
                    <div className="about-floq-val-row">
                      <h4 className="about-floq-val-name">Hapus Seluruh Data</h4>
                      <p className="about-floq-val-desc">Menghapus data aplikasi melalui pengaturan ponsel atau menghapus instalan aplikasi akan membersihkan seluruh data lokal secara permanen.</p>
                    </div>
                  </div>
                </div>

                {/* 7. Perubahan Kebijakan & Kontak */}
                <div className="about-floq-section">
                  <h3 className="about-floq-section-heading">Perubahan Kebijakan & Pertanyaan</h3>
                  <div className="about-floq-narrative">
                    <p>
                      Kebijakan privasi ini dapat diperbarui seiring penambahan fitur baru di aplikasi. Setiap perubahan akan selalu tercantum di halaman ini dan disinkronkan dengan rilis versi aplikasi terbaru.
                    </p>
                    <p>
                      Jika Anda memiliki pertanyaan mengenai privasi data, Anda dapat menyampaikan saran melalui menu <strong>Saran & Masukan</strong> di dalam aplikasi atau menghubungi pengembang melalui Instagram di <strong>@redii_rm</strong>.
                    </p>
                  </div>
                </div>

                {/* Footer Tagline */}
                <div className="about-floq-footer" style={{ marginTop: '36px' }}>
                  <p className="about-floq-footer-tagline">Catat. Analisis. Bijak Berbelanja.</p>
                  <p className="about-floq-footer-sub">Cassiel Finance App</p>
                </div>

              </div>
            </div>
          </div>
        </div>
      )}

      {/* Full-Page Screen: Ketentuan Layanan */}
      {isTermsModalOpen && (
        <div className="modal-overlay profile-setup-overlay full-page-profile-screen">
          <div className="wa-profile-screen-container">
            {/* Top Navigation Bar with Back Arrow */}
            <div className="wa-profile-top-header" style={{ borderBottom: 'none', padding: '16px 20px 8px' }}>
              <button
                type="button"
                className="back-btn"
                onClick={() => setIsTermsModalOpen(false)}
                aria-label="Kembali"
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 12H5M12 19l-7-7 7-7"/>
                </svg>
              </button>
            </div>

            <div className="full-page-sub-body" style={{ padding: '0 24px 48px' }}>
              <div className="privacy-screen-editorial-wrapper">

                {/* FLOQ-Style Brand Header Bar */}
                <div className="about-floq-brand-bar">
                  <div className="about-floq-brand-left">
                    <img src="./Cassiel logo.png" alt="Cassiel" className="about-floq-logo-img" />
                    <span className="about-floq-brand-name">CASSIEL</span>
                  </div>
                  <div className="about-floq-brand-menu">
                    <span className="about-floq-menu-line"></span>
                    <span className="about-floq-menu-line"></span>
                  </div>
                </div>

                {/* Giant FLOQ-Style 2-Line Hero Title */}
                <div className="about-floq-hero">
                  <h1 className="about-floq-hero-title">
                    Ketentuan<br />Layanan
                  </h1>
                </div>

                {/* Lead Paragraph */}
                <div className="about-floq-lead-editorial">
                  <p className="about-floq-lead-text">
                    Dengan menggunakan <strong className="about-floq-highlight">CASSIEL</strong>, kamu menyetujui ketentuan penggunaan yang dijelaskan di halaman ini. Ketentuan ini dibuat untuk menjelaskan bagaimana Cassiel dapat digunakan serta tanggung jawab pengguna dan Cassiel.
                  </p>
                  <p className="about-floq-lead-text" style={{ marginTop: '8px', fontSize: '13px', color: '#8C7B6E' }}>
                    Terakhir diperbarui: Agustus 2026
                  </p>
                </div>

                {/* 1. Penggunaan Cassiel */}
                <div className="about-floq-section">
                  <h3 className="about-floq-section-heading">1. Penggunaan Cassiel</h3>
                  <div className="about-floq-narrative">
                    <p>Cassiel adalah aplikasi pencatatan dan pengelolaan keuangan pribadi. Kamu dapat menggunakannya untuk mencatat transaksi harian, mengelola saldo akun bank dan e-wallet, melihat statistik keuangan, membuat budget bulanan, serta menggunakan fitur Voice AI dan analitik yang tersedia.</p>
                    <p>Kamu bertanggung jawab menggunakan Cassiel sesuai dengan hukum yang berlaku dan tidak menggunakannya untuk tujuan yang merugikan pihak lain.</p>
                  </div>
                </div>

                {/* 2. Data yang Kamu Masukkan */}
                <div className="about-floq-section">
                  <h3 className="about-floq-section-heading">2. Data yang Kamu Masukkan</h3>
                  <div className="about-floq-narrative">
                    <p>Kamu bertanggung jawab atas informasi yang dimasukkan ke dalam Cassiel, termasuk nominal transaksi, saldo akun, kategori, budget, dan catatan pribadi.</p>
                    <p>Pastikan data yang kamu masukkan benar dan sesuai kebutuhanmu, karena statistik dan insight Cassiel sepenuhnya bergantung pada data tersebut.</p>
                  </div>
                </div>

                {/* 3. Voice AI dan Fitur Otomatis */}
                <div className="about-floq-section">
                  <h3 className="about-floq-section-heading">3. Voice AI dan Fitur Otomatis</h3>
                  <div className="about-floq-narrative">
                    <p>Cassiel menyediakan fitur Voice AI untuk membantu pencatatan transaksi melalui perintah suara. Hasil pengenalan suara dapat mengandung kesalahan karena bergantung pada kualitas suara, pengucapan, dan teknologi speech recognition bawaan perangkat yang digunakan.</p>
                    <p>Kamu bertanggung jawab memeriksa kembali hasil yang diberikan sebelum menyimpannya sebagai catatan transaksi.</p>
                  </div>
                </div>

                {/* 4. Statistik dan Insight */}
                <div className="about-floq-section">
                  <h3 className="about-floq-section-heading">4. Statistik dan Insight</h3>
                  <div className="about-floq-narrative">
                    <p>Statistik, grafik, dan insight Cassiel dibuat berdasarkan data yang tersedia di aplikasi dan ditujukan untuk membantu kamu memahami pola keuangan pribadi.</p>
                    <p>Informasi tersebut bukan merupakan nasihat keuangan, investasi, pajak, atau profesional lainnya. Keputusan yang kamu ambil berdasarkan informasi dari Cassiel sepenuhnya merupakan tanggung jawabmu sendiri.</p>
                  </div>
                </div>

                {/* 5. Backup dan Restore */}
                <div className="about-floq-section">
                  <h3 className="about-floq-section-heading">5. Backup dan Restore</h3>
                  <div className="about-floq-narrative">
                    <p>Cassiel menyediakan fitur backup dan restore agar kamu dapat mengamankan dan memindahkan data aplikasi. File backup diekspor ke perangkat dan dapat disimpan ke layanan penyimpanan pilihanmu seperti Google Drive atau iCloud.</p>
                    <p>Kamu bertanggung jawab menyimpan file backup di tempat yang aman. Cassiel tidak bertanggung jawab atas kehilangan atau kerusakan file backup yang dikelola melalui layanan pihak ketiga.</p>
                  </div>
                </div>

                {/* 6. Keamanan Aplikasi */}
                <div className="about-floq-section">
                  <h3 className="about-floq-section-heading">6. Keamanan Aplikasi</h3>
                  <div className="about-floq-narrative">
                    <p>Cassiel menyediakan fitur PIN dan autentikasi biometrik (sidik jari) untuk membantu melindungi akses ke aplikasi di perangkatmu.</p>
                    <p>Kamu bertanggung jawab menjaga PIN dan tidak memberikan akses perangkat kepada orang lain jika ingin menjaga privasi data di dalam aplikasi.</p>
                  </div>
                </div>

                {/* 7. Layanan Pihak Ketiga */}
                <div className="about-floq-section">
                  <h3 className="about-floq-section-heading">7. Layanan Pihak Ketiga</h3>
                  <div className="about-floq-narrative">
                    <p>Beberapa fungsi Cassiel menggunakan layanan pihak ketiga, antara lain:</p>
                    <div className="about-floq-values-list" style={{ marginTop: '8px' }}>
                      <div className="about-floq-val-row">
                        <h4 className="about-floq-val-name">Firebase (Google)</h4>
                        <p className="about-floq-val-desc">Untuk menerima laporan masalah dan saran dari pengguna, serta telemetri teknis agregat.</p>
                      </div>
                      <div className="about-floq-val-row">
                        <h4 className="about-floq-val-name">Open Exchange Rates & FlagCDN</h4>
                        <p className="about-floq-val-desc">Untuk menampilkan kurs mata uang real-time dan ikon bendera negara.</p>
                      </div>
                      <div className="about-floq-val-row">
                        <h4 className="about-floq-val-name">GitHub</h4>
                        <p className="about-floq-val-desc">Untuk memeriksa ketersediaan pembaruan versi aplikasi terbaru.</p>
                      </div>
                    </div>
                    <p style={{ marginTop: '12px' }}>Penggunaan layanan tersebut tunduk pada ketentuan dan kebijakan privasi masing-masing penyedia layanan.</p>
                  </div>
                </div>

                {/* 8. Penggunaan yang Dilarang */}
                <div className="about-floq-section">
                  <h3 className="about-floq-section-heading">8. Penggunaan yang Dilarang</h3>
                  <div className="about-floq-narrative">
                    <p>Kamu tidak boleh menggunakan Cassiel untuk:</p>
                    <div className="about-floq-misi-list" style={{ marginTop: '10px' }}>
                      <div className="about-floq-misi-row">
                        <span className="about-floq-misi-num">—</span>
                        <div className="about-floq-misi-body">
                          <p className="about-floq-misi-desc">Aktivitas ilegal atau yang melanggar hukum yang berlaku.</p>
                        </div>
                      </div>
                      <div className="about-floq-misi-row">
                        <span className="about-floq-misi-num">—</span>
                        <div className="about-floq-misi-body">
                          <p className="about-floq-misi-desc">Mencoba mendapatkan akses tidak sah ke sistem atau infrastruktur Cassiel.</p>
                        </div>
                      </div>
                      <div className="about-floq-misi-row">
                        <span className="about-floq-misi-num">—</span>
                        <div className="about-floq-misi-body">
                          <p className="about-floq-misi-desc">Tujuan yang merugikan atau menipu pihak lain.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 9. Kekayaan Intelektual */}
                <div className="about-floq-section">
                  <h3 className="about-floq-section-heading">9. Kekayaan Intelektual</h3>
                  <div className="about-floq-narrative">
                    <p>Nama Cassiel, logo, desain tampilan, kode, dan elemen aplikasi lainnya merupakan bagian dari produk Cassiel. Menggunakan aplikasi tidak memberikanmu hak kepemilikan atas elemen-elemen tersebut.</p>
                  </div>
                </div>

                {/* 10. Ketersediaan & Batas Tanggung Jawab */}
                <div className="about-floq-section">
                  <h3 className="about-floq-section-heading">10. Ketersediaan & Batas Tanggung Jawab</h3>
                  <div className="about-floq-narrative">
                    <p>Kami berusaha menjaga Cassiel agar dapat digunakan dengan baik, tetapi tidak menjamin aplikasi akan selalu tersedia, bebas dari bug, atau bebas dari gangguan teknis.</p>
                    <p>Cassiel disediakan sebagai alat bantu pencatatan keuangan pribadi. Sejauh diizinkan hukum yang berlaku, Cassiel tidak bertanggung jawab atas kerugian yang timbul dari keputusan finansial yang dibuat berdasarkan informasi atau insight yang ditampilkan aplikasi.</p>
                  </div>
                </div>

                {/* 11. Penghentian Penggunaan */}
                <div className="about-floq-section">
                  <h3 className="about-floq-section-heading">11. Penghentian Penggunaan</h3>
                  <div className="about-floq-narrative">
                    <p>Kamu dapat berhenti menggunakan Cassiel kapan saja. Untuk menghapus data yang tersimpan di perangkat, gunakan fitur penghapusan data aplikasi di pengaturan ponselmu.</p>
                  </div>
                </div>

                {/* 12. Perubahan Ketentuan & Hubungi Kami */}
                <div className="about-floq-section">
                  <h3 className="about-floq-section-heading">12. Perubahan Ketentuan & Hubungi Kami</h3>
                  <div className="about-floq-narrative">
                    <p>Ketentuan ini dapat diperbarui seiring perubahan pada fitur atau kebutuhan operasional Cassiel. Versi terbaru selalu ditampilkan di halaman ini.</p>
                    <p>Jika kamu memiliki pertanyaan mengenai ketentuan ini, sampaikan melalui menu <strong>Saran & Masukan</strong> di dalam aplikasi atau hubungi pengembang melalui Instagram <strong>@redii_rm</strong>.</p>
                  </div>
                </div>

                {/* Footer Tagline */}
                <div className="about-floq-footer" style={{ marginTop: '36px' }}>
                  <p className="about-floq-footer-tagline">Catat. Analisis. Bijak Berbelanja.</p>
                  <p className="about-floq-footer-sub">Cassiel Finance App</p>
                </div>

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
                      <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/>
                      <polyline points="12 13 12 17"/>
                      <polyline points="9 15 12 12 15 15"/>
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

                {/* Export Excel (.xlsx / CSV) Card */}
                <button
                  type="button"
                  className="backup-action-card"
                  onClick={async () => {
                    if (!isPro) {
                      handleOpenProModal('export');
                      return;
                    }
                    showVoiceToast('Sedang menyiapkan berkas laporan...');
                    const res = await exportTransactionsToSpreadsheet({
                      transactions,
                      currency: appCurrency,
                      profileName
                    });
                    if (res.success) {
                      showVoiceToast(`✅ Laporan ${res.fileName} berhasil diekspor!`);
                    } else {
                      showVoiceToast(`❌ ${res.error || 'Gagal mengekspor berkas'}`);
                    }
                  }}
                >
                  <div className="backup-action-icon" style={{ background: '#FEF3C7', color: '#D97706' }}>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                      <polyline points="14 2 14 8 20 8"></polyline>
                      <line x1="8" y1="13" x2="16" y2="13"></line>
                      <line x1="8" y1="17" x2="16" y2="17"></line>
                      <line x1="10" y1="9" x2="8" y2="9"></line>
                    </svg>
                  </div>
                  <div className="backup-action-content">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span className="backup-action-title">Ekspor Excel (.xlsx / CSV)</span>
                      <span style={{
                        fontSize: '9px',
                        fontWeight: 800,
                        background: 'linear-gradient(135deg, #F59E0B, #D97706)',
                        color: '#FFFFFF',
                        padding: '1px 5px',
                        borderRadius: '5px'
                      }}>
                        👑 PRO
                      </span>
                    </div>
                    <span className="backup-action-desc">Unduh seluruh riwayat transaksi ke format Excel (.xlsx)</span>
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
                      <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/>
                      <polyline points="12 12 12 16"/>
                      <polyline points="9 14 12 17 15 14"/>
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
                <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/>
                <polyline points="12 12 12 16"/>
                <polyline points="9 14 12 17 15 14"/>
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
                  <p className="budget-sheet-subtitle">{t('setCategoryLimitSubtitle') || 'Batas belanja bulanan kategori ini'}</p>
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
              <label className="budget-sheet-label">{t('quickAmountLabel') || 'Pilihan Nominal Cepat'}</label>
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
              <label className="budget-sheet-label" style={{ marginTop: '14px' }}>{t('limitAmountLabel') || 'Nominal Limit'}</label>
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
                  {t('removeLimit') || 'Hapus Limit'}
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
                {t('saveLimit') || 'Simpan Limit'}
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
                <h3 className="budget-sheet-title">{t('selectBudgetPeriodTitle') || 'Pilih Periode Budget'}</h3>
                <p className="budget-sheet-subtitle">{t('selectBudgetPeriodSubtitle') || 'Cek riwayat realisasi & pengeluaran bulanan'}</p>
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
                {t('thisMonth') || 'Bulan Ini'}
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
              <span className="update-modal-badge">{t('newVersionAvailable') || '🚀 Versi Baru Tersedia'}</span>
            </div>
            <div className="update-modal-body">
              <h3 className="update-version-title">Update v{updateInfo.version}</h3>
              {(() => {
                const rawChangelog = updateInfo.changelog || 'Pembaruan aplikasi telah tersedia.';
                const lines = rawChangelog.split('\n').map(l => l.trim()).filter(Boolean);
                const featureLines = lines.filter(line => 
                  !line.toLowerCase().startsWith('new in this update') && 
                  !line.toLowerCase().startsWith('yang baru')
                );

                if (featureLines.length === 0) {
                  return <p className="update-changelog-text">{rawChangelog}</p>;
                }

                return (
                  <div className="update-changelog-container">
                    <p className="update-changelog-header">{t('whatsNewInThisVersion') || 'Yang baru di versi ini:'}</p>
                    <ul className="update-changelog-list">
                      {featureLines
                        .slice(0, 3)
                        .map((line, idx) => {
                          const cleanText = line.replace(/^[-•*]\s*/, '').replace(/^\[New\]\s*/i, '').trim();
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
                {t('later') || 'Nanti'}
              </button>
              <button
                type="button"
                className="update-now-btn"
                onClick={() => {
                  if (updateInfo?.isUdinApp || updateInfo?.isDebugApp) {
                    const targetApk = updateInfo?.apkName || (updateInfo?.isUdinApp ? 'udin.apk' : 'cassielll1.apk');
                    const rawUrl = updateInfo?.downloadUrl || `https://raw.githubusercontent.com/redilah/Finance-tracker/main/apk/${targetApk}`;
                    const cleanUrl = rawUrl.includes('?') ? `${rawUrl}&t=${Date.now()}` : `${rawUrl}?t=${Date.now()}`;
                    console.log('[UpdateModal] Navigating to sideload APK URL:', cleanUrl);
                    const opened = window.open(cleanUrl, '_system');
                    if (!opened) {
                      window.location.href = cleanUrl;
                    }
                  } else {
                    // Official Cassiel Release -> Buka halaman Google Play Store resmi
                    const playStoreWebUrl = updateInfo?.playStoreUrl || 'https://play.google.com/store/apps/details?id=com.redilah.financetracker';
                    const playStoreMarketUrl = updateInfo?.playStoreMarketUrl || 'market://details?id=com.redilah.financetracker';
                    console.log('[UpdateModal] Opening Play Store listing:', playStoreMarketUrl);
                    try {
                      const opened = window.open(playStoreMarketUrl, '_system');
                      if (!opened) {
                        window.open(playStoreWebUrl, '_blank') || (window.location.href = playStoreWebUrl);
                      }
                    } catch {
                      window.open(playStoreWebUrl, '_blank') || (window.location.href = playStoreWebUrl);
                    }
                  }
                }}
              >
                {t('updateNow') || 'Update Sekarang'}
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
            <h3 className="safety-warning-title">{t('prohibitedActivityTitle') || 'Aktivitas Tidak Diizinkan'}</h3>
            <div className="safety-warning-tag">{safetyWarning.categoryLabel || t('prohibitedDangerousContent') || 'Konten Berbahaya'}</div>
            <p className="safety-warning-desc">
              {safetyWarning.reason || t('prohibitedActivityDesc') || 'Pencatatan untuk kategori berbahaya, ilegal, rokok, miras, atau asusila tidak diizinkan.'}
            </p>
            <div className="safety-warning-footer">
              <button
                type="button"
                className="safety-understand-btn"
                onClick={() => setSafetyWarning({ isOpen: false, categoryLabel: '', reason: '' })}
              >
                {t('iUnderstand') || 'Saya Mengerti'}
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
              {activeBalanceDetail.type === 'expense' && (t('totalExpenseMonthDesc') || 'Total seluruh pengeluaran bulan ini')}
              {activeBalanceDetail.type === 'income' && (t('totalIncomeMonthDesc') || 'Total seluruh pemasukan bulan ini')}
              {activeBalanceDetail.type === 'total' && (t('netBalanceMonthDesc') || 'Sisa saldo bersih keseluruhan bulan ini')}
            </div>
          </div>
        </div>
      )}

      {/* Pop-up Zoom Detail Transaksi (Naik ke Depan Muka untuk Lihat Detail Transaksi) */}
      {activeTxDetail && (() => {
        const catName = getCategoryName(activeTxDetail.category, appLanguage);
        const hasCustomTitle = activeTxDetail.title && 
          activeTxDetail.title.trim().toLowerCase() !== (activeTxDetail.category || '').trim().toLowerCase() && 
          activeTxDetail.title.trim().toLowerCase() !== (catName || '').trim().toLowerCase();
        const bgColor = resolveCardBgColor(activeTxDetail);
        
        return (
          <div 
            className="modal-overlay balance-pop-overlay"
            onClick={() => setActiveTxDetail(null)}
          >
            <div 
              className="balance-pop-card tx-pop-card"
              style={{ backgroundColor: bgColor }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="tx-pop-header">
                <div className="tx-pop-badge-container">
                  <div className={`tx-pop-icon-circle ${activeTxDetail.iconClass || ''}`}>
                    {resolveIcon(activeTxDetail) && (
                      <img src={resolveIcon(activeTxDetail)} alt={activeTxDetail.category} />
                    )}
                  </div>
                  <div className="tx-pop-category-info">
                    <span className="tx-pop-category-name">
                      {catName}
                    </span>
                    <span className="tx-pop-account-tag">
                      {activeTxDetail.account || 'Cash'}
                    </span>
                  </div>
                </div>
                <button 
                  type="button" 
                  className="balance-pop-close-btn"
                  onClick={() => setActiveTxDetail(null)}
                  aria-label="Tutup"
                >
                  ✕
                </button>
              </div>

              <div className="balance-pop-amount-row">
                <span 
                  className="balance-pop-amount"
                  style={{ 
                    color: activeTxDetail.type === 'expense' 
                      ? 'var(--card-expense-text, #BC6C25)' 
                      : 'var(--card-income-text, #2D6A43)' 
                  }}
                >
                  {activeTxDetail.type === 'expense' ? '-' : '+'}{fmtMoney(activeTxDetail.amount)}
                </span>
              </div>

              <div className="tx-pop-body">
                {hasCustomTitle && (
                  <div className="tx-pop-title">
                    "{activeTxDetail.title}"
                  </div>
                )}
                {activeTxDetail.note && (
                  <div className="tx-pop-note">
                    📝 {activeTxDetail.note}
                  </div>
                )}
                <div className="tx-pop-meta-row">
                  <span>📅 {activeTxDetail.date || 'Hari Ini'}</span>
                  <span>•</span>
                  <span>{activeTxDetail.type === 'expense' ? t('expenses') : t('income')}</span>
                  {isAutoTrackedTx(activeTxDetail) && (
                    <>
                      <span>•</span>
                      <span style={{ color: 'var(--card-expense-text, #BC6C25)', fontWeight: 700 }}>⚡ Auto-Tracker</span>
                    </>
                  )}
                </div>
                {isAutoTrackedTx(activeTxDetail) && (
                  <button 
                    type="button" 
                    className="tx-pop-edit-action-btn"
                    onClick={() => {
                      const txToEdit = activeTxDetail;
                      setActiveTxDetail(null);
                      handleEditTransaction(txToEdit);
                    }}
                    aria-label="Edit Transaksi"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                    <span>Edit Transaksi</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Modal: Atur Saldo Akun / Tambah Saldo / Edit Saldo Tercatat */}
      {accountToSetBalance && (() => {
        const rawInit = accountInitialBalances[accountToSetBalance];
        const hasInitial = typeof rawInit === 'number' && !isNaN(rawInit);
        const initVal = hasInitial ? rawInit : 0;
        
        const accTxs = transactions.filter(t => (t.account || 'Cash').toLowerCase().trim() === (accountToSetBalance || '').toLowerCase().trim());
        const totalInc = accTxs.filter(t => t.type === 'income').reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
        const totalExp = accTxs.filter(t => t.type === 'expense').reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
        const currBal = initVal + totalInc - totalExp;
        const hasRecorded = hasInitial;

        const isAddMode = hasRecorded ? balanceModalMode === 'add' : false;

        const handleSave = () => {
          const rawStr = balanceModalInputValue.replace(/\./g, '').replace(/[^0-9]/g, '');
          if (rawStr === '') {
            showVoiceToast(t('enterValidAmount') || 'Masukkan nominal yang valid!');
            return;
          }
          const raw = parseInt(rawStr, 10);
          if (isNaN(raw) || raw < 0) {
            showVoiceToast(t('enterValidAmount') || 'Masukkan nominal yang valid!');
            return;
          }

          if (isAddMode && raw <= 0) {
            showVoiceToast(t('enterValidAmount') || 'Nominal penambahan harus lebih dari 0!');
            return;
          }

          if (!hasRecorded || !isAddMode) {
            // Edit / Atur Saldo Tercatat:
            // Saldo Tercatat = Saldo Awal + totalInc - totalExp
            // Maka: Saldo Awal = raw - totalInc + totalExp
            const adjustedInitial = raw - totalInc + totalExp;
            setAccountInitialBalances(prev => ({ ...prev, [accountToSetBalance]: adjustedInitial }));
            showVoiceToast(`✨ Saldo tercatat ${accountToSetBalance} berhasil diperbarui: ${fmtMoney(raw)}`);
          } else {
            // Tambah Saldo (Top-up / Pemasukan)
            const newIncomeTx = {
              id: Date.now(),
              amount: raw,
              type: 'income',
              category: 'Bonus',
              categoryId: 'tambahSaldo',
              iconClass: 'sub-icon',
              title: balanceModalNote.trim() || `Tambah Saldo`,
              account: accountToSetBalance,
              date: new Date().toISOString().split('T')[0],
              time: new Date().toTimeString().slice(0, 5),
              note: `[Tambah Saldo Akun]`
            };

            setTransactions(prev => {
              const updated = [newIncomeTx, ...prev];
              safeStorageSet('user_transactions', updated);
              return updated;
            });

            showVoiceToast(`✨ Saldo ${accountToSetBalance} bertambah +${fmtMoney(raw)}!`);
          }

          setAccountToSetBalance(null);
          setBalanceModalInputValue('');
          setBalanceModalNote('');
        };

        return (
          <div 
            className="modal-overlay"
            onClick={() => setAccountToSetBalance(null)}
            style={{ zIndex: 100000 }}
          >
            <div 
              className="set-balance-modal-card"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="set-balance-header">
                <AccountIconBadge accountName={accountToSetBalance} size={40} />
                <div className="set-balance-title-wrap">
                  <h3 className="set-balance-title">
                    {!hasRecorded 
                      ? (t('setBalanceTitle') || 'Atur Saldo Akun') 
                      : (isAddMode ? (t('addBalanceTitle') || 'Tambah Saldo') : (t('editRecordedBalanceTitle') || 'Edit Saldo Tercatat'))}
                  </h3>
                  <span className="set-balance-sub">
                    {accountToSetBalance} {hasRecorded && `• Sisa: ${fmtMoney(currBal)}`}
                  </span>
                </div>
              </div>

              {/* Opsi Tab jika akun sudah memiliki saldo tercatat */}
              {hasRecorded && (
                <div className="set-balance-tabs">
                  <button
                    type="button"
                    className={`set-balance-tab-btn ${isAddMode ? 'active' : ''}`}
                    onClick={() => {
                      setBalanceModalMode('add');
                      setBalanceModalInputValue('');
                    }}
                  >
                    ➕ {t('addBalanceTab') || 'Tambah Saldo'}
                  </button>
                  <button
                    type="button"
                    className={`set-balance-tab-btn ${!isAddMode ? 'active' : ''}`}
                    onClick={() => {
                      setBalanceModalMode('edit_recorded');
                      setBalanceModalInputValue(new Intl.NumberFormat('id-ID').format(Math.max(0, currBal)));
                    }}
                  >
                    ✏️ {t('editRecordedTab') || 'Edit Saldo'}
                  </button>
                </div>
              )}

              <div className="set-balance-input-box">
                <span className="set-balance-currency">{getCurrency(appCurrency).symbol}</span>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  autoFocus
                  className="set-balance-input"
                  placeholder="0"
                  value={balanceModalInputValue}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/\./g, '').replace(/[^0-9]/g, '');
                    const formatted = raw ? new Intl.NumberFormat('id-ID').format(parseInt(raw, 10)) : '';
                    setBalanceModalInputValue(formatted);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSave();
                    if (e.key === 'Escape') setAccountToSetBalance(null);
                  }}
                />
              </div>

              {/* Input Catatan Opsional jika mode Tambah Saldo */}
              {hasRecorded && isAddMode && (
                <div className="set-balance-note-box">
                  <input
                    type="text"
                    className="set-balance-note-input"
                    placeholder="Catatan (misal: Top Up, Gaji, Transfer masuk)..."
                    value={balanceModalNote}
                    onChange={(e) => setBalanceModalNote(e.target.value)}
                    maxLength={40}
                  />
                </div>
              )}

              <p className="set-balance-prompt-text">
                {!hasRecorded 
                  ? (t('setBalancePrompt') || 'Masukkan saldo terkini yang ada di akun ini. Cassiel akan menghitung sisa saldo otomatis dari transaksi.') 
                  : (isAddMode 
                      ? (t('addBalancePrompt') || 'Nominal ini akan langsung ditambahkan ke saldo akun dan dicatat ke histori pemasukan.')
                      : (t('editRecordedBalancePrompt') || 'Ubah saldo tercatat saat ini secara langsung. Nilai saldo awal akan disesuaikan otomatis tanpa mengubah riwayat transaksimu.'))}
              </p>

              <div className="set-balance-actions">
                <button
                  type="button"
                  className="set-balance-btn-cancel"
                  onClick={() => {
                    setAccountToSetBalance(null);
                    setBalanceModalInputValue('');
                    setBalanceModalNote('');
                  }}
                >
                  {t('close') || 'Batal'}
                </button>
                <button
                  type="button"
                  className="set-balance-btn-save"
                  onClick={handleSave}
                >
                  {!hasRecorded 
                    ? (t('saveBalanceBtn') || 'Simpan Saldo') 
                    : (isAddMode ? (t('submitAddBalanceBtn') || 'Tambah ke Saldo') : (t('saveRecordedBalanceBtn') || 'Simpan Saldo Tercatat'))}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Modal: Tambah Akun Baru */}
      {isAddAccountModalOpen && (() => {
        // Daftar akun terstruktur sesuai referensi UI (Populer menyertakan Cash, Bank & E-Wallet utama)
        const popularList = [
          { id: 'cash', name: 'Cash' },
          { id: 'bca', name: 'BCA' },
          { id: 'bri', name: 'BRImo' },
          { id: 'livin', name: "Livin' by Mandiri" },
          { id: 'wondr', name: 'Wondr by BNI' },
          { id: 'jago', name: 'Jago' },
          { id: 'gopay', name: 'GoPay' },
          { id: 'ovo', name: 'OVO' },
          { id: 'dana', name: 'DANA' },
          { id: 'shopeepay', name: 'ShopeePay' }
        ];

        const bankList = [
          { id: 'bsi', name: 'BSI' },
          { id: 'cimb', name: 'CIMB Niaga' },
          { id: 'seabank', name: 'SeaBank' },
          { id: 'jenius', name: 'Jenius' },
          { id: 'maybank', name: 'Maybank' },
          { id: 'bpddiy', name: 'BPD DIY' },
          { id: 'bale_by_btn', name: 'bale by btn' },
          { id: 'permata', name: 'Permata' },
          { id: 'blu', name: 'blu' }
        ];

        const ewalletList = [
          { id: 'linkaja', name: 'LinkAja' },
          { id: 'gopay', name: 'GoPay' },
          { id: 'ovo', name: 'OVO' },
          { id: 'dana', name: 'DANA' },
          { id: 'shopeepay', name: 'ShopeePay' },
          { id: 'qris', name: 'QRIS' },
          { id: 'paypal', name: 'PayPal' }
        ];

        const creditCardList = [
          { id: 'bca_card', name: 'BCA Card' },
          { id: 'tokopedia_card', name: 'Tokopedia Card' },
          { id: 'jenius_cc', name: 'Jenius CC' },
          { id: 'mandiri_card', name: 'Mandiri Card' },
          { id: 'bni_card', name: 'BNI Card' },
          { id: 'bri_touch', name: 'BRI Touch' },
          { id: 'cimb_card', name: 'CIMB OCTO Card' },
          { id: 'jcb', name: 'JCB' },
          { id: 'amex', name: 'American Express' },
          { id: 'visa', name: 'Visa' },
          { id: 'mastercard', name: 'Mastercard' }
        ];

        // Helper: Cek apakah akun sudah pernah ditulis/diatur saldonya (termasuk Cash / Tunai)
        const isAccountAlreadyConfigured = (accName) => {
          const norm = (accName || '').trim().toLowerCase();
          const isTargetCash = norm === 'cash' || norm === 'tunai' || norm === 'uang tunai';

          return Object.keys(accountInitialBalances || {}).some(k => {
            const kNorm = (k || '').trim().toLowerCase();
            const val = accountInitialBalances[k];
            const isKeyCash = kNorm === 'cash' || kNorm === 'tunai' || kNorm === 'uang tunai';

            if (isTargetCash && isKeyCash) {
              return typeof val === 'number' && !isNaN(val);
            }

            return (kNorm === norm || kNorm.includes(norm) || norm.includes(kNorm)) && typeof val === 'number' && !isNaN(val);
          });
        };

        const activePopularList = popularList.filter(item => !isAccountAlreadyConfigured(item.name));
        const activeBankList = bankList.filter(item => !isAccountAlreadyConfigured(item.name));
        const activeEwalletList = ewalletList.filter(item => !isAccountAlreadyConfigured(item.name));
        const activeCreditCardList = creditCardList.filter(item => !isAccountAlreadyConfigured(item.name));

        const searchTrim = addAccountSearchQuery.trim().toLowerCase();

        // Filter pencarian
        const filterBySearch = (list) => {
          if (!searchTrim) return list;
          return list.filter(item => item.name.toLowerCase().includes(searchTrim));
        };

        const filteredPopular = filterBySearch(activePopularList);
        const filteredBank = filterBySearch(activeBankList);
        const filteredEwallet = filterBySearch(activeEwalletList);
        const filteredCreditCard = filterBySearch(activeCreditCardList);

        const showPopular = addAccountCategoryTab === 'all' && !searchTrim;
        const showBank = (addAccountCategoryTab === 'all' || addAccountCategoryTab === 'bank') && (filteredBank.length > 0 || searchTrim);
        const showEwallet = (addAccountCategoryTab === 'all' || addAccountCategoryTab === 'ewallet') && (filteredEwallet.length > 0 || searchTrim);
        const showCreditCard = (addAccountCategoryTab === 'all' || addAccountCategoryTab === 'credit_card') && (filteredCreditCard.length > 0 || searchTrim);

        const hasAnyResult = (showPopular && filteredPopular.length > 0) || 
                             (showBank && filteredBank.length > 0) || 
                             (showEwallet && filteredEwallet.length > 0) ||
                             (showCreditCard && filteredCreditCard.length > 0);

        return (
          <div 
            className="modal-overlay profile-setup-overlay full-page-profile-screen"
            style={{ zIndex: 99999 }}
          >
            <div className="wa-profile-screen-container">
              {/* Header */}
              <div className="wa-profile-top-header">
                <button
                  type="button"
                  className="back-btn"
                  onClick={() => {
                    setIsAddAccountModalOpen(false);
                    setAddAccountSearchQuery('');
                    setIsCustomAddAccOpen(false);
                  }}
                  aria-label="Kembali"
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 12H5M12 19l-7-7 7-7"/>
                  </svg>
                </button>
                <h3 className="profile-modal-title">{t('addNewAccountTitle') || 'Tambah Akun Baru'}</h3>
              </div>

              {/* Body */}
              <div className="full-page-sub-body">
                <div className="add-acc-new-screen-body">
                  {/* 1. Search Bar */}
                  <div className="add-acc-search-box">
                    <span className="add-acc-search-icon">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="8"/>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                      </svg>
                    </span>
                    <input
                      type="text"
                      className="add-acc-search-input"
                      placeholder={t('searchAccountPlaceholder') || 'Cari...'}
                      value={addAccountSearchQuery}
                      onChange={(e) => setAddAccountSearchQuery(e.target.value)}
                    />
                    {addAccountSearchQuery && (
                      <button
                        type="button"
                        className="add-acc-search-clear"
                        onClick={() => setAddAccountSearchQuery('')}
                        aria-label="Hapus pencarian"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="18" y1="6" x2="6" y2="18"/>
                          <line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                      </button>
                    )}
                  </div>

                  {/* 2. Tabs / Category Pills */}
                  <div className="add-acc-tab-list">
                    <button
                      type="button"
                      className={`add-acc-tab-pill ${addAccountCategoryTab === 'all' ? 'active' : ''}`}
                      onClick={() => setAddAccountCategoryTab('all')}
                    >
                      {t('all') || 'Semua'}
                    </button>
                    <button
                      type="button"
                      className={`add-acc-tab-pill ${addAccountCategoryTab === 'bank' ? 'active' : ''}`}
                      onClick={() => setAddAccountCategoryTab('bank')}
                    >
                      Bank
                    </button>
                    <button
                      type="button"
                      className={`add-acc-tab-pill ${addAccountCategoryTab === 'ewallet' ? 'active' : ''}`}
                      onClick={() => setAddAccountCategoryTab('ewallet')}
                    >
                      E-Wallet
                    </button>
                    <button
                      type="button"
                      className={`add-acc-tab-pill ${addAccountCategoryTab === 'credit_card' ? 'active' : ''}`}
                      onClick={() => setAddAccountCategoryTab('credit_card')}
                    >
                      {t('creditCard') || 'Kartu Kredit'}
                    </button>
                  </div>

                  {/* 3. Empty Search State */}
                  {searchTrim && !hasAnyResult && (
                    <div className="add-acc-empty-search">
                      <p className="add-acc-empty-text">Tidak menemukan "{addAccountSearchQuery}"</p>
                      <p className="add-acc-empty-sub">Kamu bisa menambahkan akun tersebut secara manual di bawah.</p>
                    </div>
                  )}

                  {/* 4. Section: Populer (hanya muncul di tab Semua & tanpa filter query) */}
                  {showPopular && filteredPopular.length > 0 && (
                    <div className="add-acc-section">
                      <div className="add-acc-section-header">
                        <h4 className="add-acc-section-title">Populer</h4>
                      </div>
                      <div className="add-acc-cards-grid">
                        {filteredPopular.map((acc) => (
                          <button
                            key={acc.id}
                            type="button"
                            className="add-acc-card-item"
                            onClick={() => handleSelectOrAddAccount(acc.name)}
                          >
                            <div className="add-acc-card-logo-wrap">
                              <AccountIconBadge accountName={acc.name} size={35} />
                            </div>
                            <span className="add-acc-card-name">{acc.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 5. Section: Bank */}
                  {showBank && filteredBank.length > 0 && (
                    <div className="add-acc-section">
                      <div className="add-acc-section-header">
                        <h4 className="add-acc-section-title">Bank</h4>
                        {addAccountCategoryTab === 'all' && !searchTrim && (
                          <button
                            type="button"
                            className="add-acc-section-link"
                            onClick={() => setAddAccountCategoryTab('bank')}
                          >
                            <span>Lihat semua</span>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M5 12h14M12 5l7 7-7 7"/>
                            </svg>
                          </button>
                        )}
                      </div>
                      <div className="add-acc-cards-grid">
                        {filteredBank.map((acc) => (
                          <button
                            key={acc.id}
                            type="button"
                            className="add-acc-card-item"
                            onClick={() => handleSelectOrAddAccount(acc.name)}
                          >
                            <div className="add-acc-card-logo-wrap">
                              <AccountIconBadge accountName={acc.name} size={35} />
                            </div>
                            <span className="add-acc-card-name">{acc.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 6. Section: E-Wallet */}
                  {showEwallet && filteredEwallet.length > 0 && (
                    <div className="add-acc-section">
                      <div className="add-acc-section-header">
                        <h4 className="add-acc-section-title">E-Wallet</h4>
                        {addAccountCategoryTab === 'all' && !searchTrim && (
                          <button
                            type="button"
                            className="add-acc-section-link"
                            onClick={() => setAddAccountCategoryTab('ewallet')}
                          >
                            <span>Lihat semua</span>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M5 12h14M12 5l7 7-7 7"/>
                            </svg>
                          </button>
                        )}
                      </div>
                      <div className="add-acc-cards-grid">
                        {filteredEwallet.map((acc) => (
                          <button
                            key={acc.id}
                            type="button"
                            className="add-acc-card-item"
                            onClick={() => handleSelectOrAddAccount(acc.name)}
                          >
                            <div className="add-acc-card-logo-wrap">
                              <AccountIconBadge accountName={acc.name} size={35} />
                            </div>
                            <span className="add-acc-card-name">{acc.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 7. Section: Kartu Kredit */}
                  {showCreditCard && filteredCreditCard.length > 0 && (
                    <div className="add-acc-section">
                      <div className="add-acc-section-header">
                        <h4 className="add-acc-section-title">{t('creditCard') || 'Kartu Kredit'}</h4>
                        {addAccountCategoryTab === 'all' && !searchTrim && (
                          <button
                            type="button"
                            className="add-acc-section-link"
                            onClick={() => setAddAccountCategoryTab('credit_card')}
                          >
                            <span>Lihat semua</span>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M5 12h14M12 5l7 7-7 7"/>
                            </svg>
                          </button>
                        )}
                      </div>
                      <div className="add-acc-cards-grid">
                        {filteredCreditCard.map((acc) => (
                          <button
                            key={acc.id}
                            type="button"
                            className="add-acc-card-item"
                            onClick={() => handleSelectOrAddAccount(acc.name)}
                          >
                            <div className="add-acc-card-logo-wrap">
                              <AccountIconBadge accountName={acc.name} size={35} />
                            </div>
                            <span className="add-acc-card-name">{acc.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 8. Bottom Card: Tidak Menemukan Akunmu? */}
                  <div className="add-acc-custom-banner">
                    <div className="add-acc-custom-header">
                      <div className="add-acc-custom-plus-box">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="12" y1="5" x2="12" y2="19"/>
                          <line x1="5" y1="12" x2="19" y2="12"/>
                        </svg>
                      </div>
                      <div className="add-acc-custom-info">
                        <span className="add-acc-custom-title">Tidak menemukan akunmu?</span>
                        <span className="add-acc-custom-desc">Buat akun secara manual sesuai kebutuhanmu.</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="add-acc-custom-action-btn"
                      onClick={() => setIsCustomAddAccOpen(prev => !prev)}
                    >
                      {isCustomAddAccOpen ? 'Tutup' : 'Buat akun sendiri'}
                    </button>
                  </div>

                  {/* Form input akun manual */}
                  {isCustomAddAccOpen && (
                    <div className="add-acc-custom-form-card">
                      <div className="add-acc-custom-input-row">
                        <input
                          type="text"
                          className="add-acc-custom-input"
                          placeholder={t('accountNamePlaceholder') || 'Nama akun baru...'}
                          value={newAccountInput}
                          autoFocus
                          onChange={(e) => setNewAccountInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && newAccountInput.trim()) {
                              handleSelectOrAddAccount(newAccountInput.trim());
                            }
                          }}
                        />
                        <button
                          type="button"
                          className="add-acc-custom-submit-btn"
                          onClick={() => {
                            if (newAccountInput.trim()) {
                              handleSelectOrAddAccount(newAccountInput.trim());
                            }
                          }}
                        >
                          <span>{t('add') || 'Tambah'}</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Screen / Drawer: Detail Akun (Histori Transaksi Akun) */}
      {selectedAccountDetail && (
        <div 
          className="modal-overlay profile-setup-overlay full-page-profile-screen account-detail-screen"
          style={{ zIndex: 99999 }}
        >
          <div className="account-detail-container">
            {/* Top Bar */}
            <div className="account-detail-top-bar">
              <div className="account-detail-top-left">
                <button
                  type="button"
                  className="back-btn"
                  onClick={() => setSelectedAccountDetail(null)}
                  aria-label="Kembali"
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 12H5M12 19l-7-7 7-7"/>
                  </svg>
                </button>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <AccountIconBadge accountName={selectedAccountDetail.name} size={28} />
                  <span className="account-detail-top-title">{selectedAccountDetail.name}</span>
                </div>
              </div>

              <button
                type="button"
                className="account-detail-edit-init-btn"
                onClick={() => {
                  setAccountToSetBalance(selectedAccountDetail.name);
                  setBalanceModalMode('add');
                  setBalanceModalInputValue('');
                  setBalanceModalNote('');
                }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 20h9"/>
                  <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
                </svg>
                <span>{t('adjustBalanceBtn') || 'Sesuaikan saldo'}</span>
              </button>
            </div>

            {/* Kartu Ringkasan Detail Saldo */}
            {(() => {
              const rawInit = accountInitialBalances[selectedAccountDetail.name];
              const hasInitial = typeof rawInit === 'number' && !isNaN(rawInit);
              const initVal = hasInitial ? rawInit : 0;

              const accTxs = transactions.filter(t => (t.account || 'Cash').toLowerCase().trim() === (selectedAccountDetail.name || '').toLowerCase().trim());
              const totalInc = accTxs.filter(t => t.type === 'income').reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
              const totalExp = accTxs.filter(t => t.type === 'expense').reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
              const hasRecorded = hasInitial;
              const currBal = initVal + totalInc - totalExp;

              return (
                <div className="account-detail-summary-card">
                  <div className="account-detail-current-wrap">
                    <span className="account-detail-current-sub">
                      {hasRecorded ? (t('recordedBalance') || 'Sisa saldo tercatat saat ini') : (t('balanceNotSet') || 'Saldo belum diatur')}
                    </span>
                    <span className="account-detail-current-val" style={{ color: hasRecorded ? (currBal < 0 ? '#DC2626' : '#BC6C25') : '#A08C7D' }}>
                      {hasRecorded ? fmtMoney(currBal) : '-'}
                    </span>
                  </div>

                  <div className="account-detail-grid-stats">
                    <div className="account-detail-stat-item">
                      <span className="account-detail-stat-item-label">{t('income') || 'Pemasukan'}</span>
                      <span className="account-detail-stat-item-val income">+{fmtMoney(totalInc)}</span>
                    </div>
                    <div className="account-detail-stat-item">
                      <span className="account-detail-stat-item-label">{t('expenses') || 'Pengeluaran'}</span>
                      <span className="account-detail-stat-item-val expense">-{fmtMoney(totalExp)}</span>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Histori Transaksi Akun */}
            <div className="account-detail-tx-list-wrap">
              <span className="account-detail-tx-header">{t('accountTransactionsHistory') || 'Histori Transaksi Akun'}</span>
              {(() => {
                const accTxs = transactions.filter(t => (t.account || 'Cash').toLowerCase().trim() === (selectedAccountDetail.name || '').toLowerCase().trim());

                if (accTxs.length === 0) {
                  return (
                    <div className="empty-transactions" style={{ marginTop: '20px' }}>
                      <span className="empty-icon">💳</span>
                      <span className="empty-title">{t('noTransactions')}</span>
                      <span className="empty-subtitle">Belum ada transaksi dengan akun ini.</span>
                    </div>
                  );
                }

                // Urutkan transaksi dari yang paling baru
                const sorted = [...accTxs].sort((a, b) => {
                  const dateA = a.date || '';
                  const dateB = b.date || '';
                  if (dateA !== dateB) return dateB.localeCompare(dateA);
                  const timeA = a.time || '';
                  const timeB = b.time || '';
                  if (timeA !== timeB) return timeB.localeCompare(timeA);
                  return (b.id || 0) - (a.id || 0);
                });

                return sorted.map((tx) => {
                  const iconSrc = resolveIcon(tx);
                  const isExpense = tx.type === 'expense';
                  let formattedDate = tx.date || '';
                  if (tx.date) {
                    const parts = tx.date.split('-');
                    if (parts.length === 3) {
                      const dayNum = parseInt(parts[2], 10);
                      const monthIdx = parseInt(parts[1], 10) - 1;
                      const shortMonth = monthNamesShort[monthIdx] || parts[1];
                      formattedDate = `${dayNum} ${shortMonth} ${parts[0]}`;
                    }
                  }

                  const catMeta = expenseCategories.find(c => c.name === tx.category || c.id === tx.categoryId || c.id === tx.id) ||
                                  incomeCategories.find(c => c.name === tx.category || c.id === tx.categoryId || c.id === tx.id);
                  const catIconClass = tx.iconClass || (catMeta ? catMeta.iconClass : '') || 'food-icon';

                  return (
                    <div key={tx.id} className="account-detail-tx-item">
                      <div className="account-detail-tx-left">
                        <div className={`account-detail-tx-icon ${catIconClass}`}>
                          {iconSrc ? <img src={iconSrc} alt={tx.category} /> : <span>🏷️</span>}
                        </div>
                        <div className="account-detail-tx-meta">
                          <span className="account-detail-tx-title">{tx.title || tx.category}</span>
                          <span className="account-detail-tx-date">
                            {getCategoryName(tx.category, appLanguage)} • {formattedDate} {tx.time ? `(${tx.time})` : ''}
                          </span>
                        </div>
                      </div>
                      <span className={`account-detail-tx-amount ${isExpense ? 'expense' : 'income'}`}>
                        {isExpense ? '-' : '+'}{fmtMoney(tx.amount)}
                      </span>
                    </div>
                  );
                });
              })()}
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
        onClose={handleCloseTour}
      />

      {/* Cassiel Groups Hub Modal */}
      <GroupsHubModal
        isOpen={isGroupsModalOpen}
        onClose={() => setIsGroupsModalOpen(false)}
        currentUserName={profileName || 'Pengguna Cassiel'}
        currentUserAvatar={profileImage}
        onOpenProModal={handleOpenProModal}
      />

      {/* Cassiel Pro Upgrade Modal */}
      <ProUpgradeModal
        isOpen={isProModalOpen}
        onClose={() => setIsProModalOpen(false)}
        triggerReason={proTriggerReason}
        onProStatusChanged={(newProStatus) => {
          setIsPro(newProStatus);
          showVoiceToast(newProStatus ? '👑 Mode Cassiel Pro Aktif!' : 'Mode Gratis (Free) Aktif');
        }}
      />

      {/* Kitabisa Transparency & Real-Time Impact Journey Modal */}
      <KitabisaTransparencyModal
        isOpen={isKitabisaModalOpen}
        onClose={() => setIsKitabisaModalOpen(false)}
        currentUserName={profileName || 'Pengguna Cassiel'}
        onOpenProModal={handleOpenProModal}
        isPro={isPro}
      />
    </div>
  );
}

export default App;

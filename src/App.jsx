import React, { useState, useRef, useEffect } from 'react';
import './App.css';
import fastFoodSvg from './assets/fast-food.svg';
import gameSvg from './assets/3d-movie.svg';
import carSvg from './assets/car.svg';
import houseSvg from './assets/house_colored.svg';
import addSvg from './assets/add.svg';
import diagramSvg from './assets/diagram.svg';
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
import { isConsumptiveHybrid, getConsumptiveTransactions } from './utils/classifier';
import { playPositiveChime } from './utils/soundFeedback';
import { checkForAppUpdates } from './utils/version';
import { safeStorageGet, safeStorageSet } from './utils/secureStorage';
import VoiceMicButton from './components/VoiceMicButton';

const AdminDashboard = React.lazy(() => import('./components/admin/AdminDashboard'));
import { syncLearnerWithUserData, recordDeletionEvaluation } from './utils/voiceLearner';
import { checkProhibitedContent } from './utils/safetyGuard';
import { updateCurrentDeviceTelemetry } from './utils/telemetry';
import { 
  isNotificationEnabled,
  toggleNotificationState,
  sendInstantNotification, 
  sendInstantBudgetNotification,
  schedulePersonalizedNotifications, 
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
    'Jajan Adek': 'jajanAdek', 'Party': 'party',
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

function AndaiFeatureView({ transactions, resolveIcon }) {
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

  return (
    <div className="andai-container-clean">
      {/* Stat Card Ringkas */}
      <div className="andai-hero-card">
        <span className="andai-hero-label">Konsumtif Bulan Ini</span>
        <h2 className="andai-hero-amount">Rp {totalConsumptiveAmount.toLocaleString('id-ID')}</h2>
        <span className="andai-hero-sub">{consumptiveTransactions.length} transaksi terdeteksi</span>
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
              {yr} Thn
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
          <span className="compare-lbl">Jika Dibeli</span>
          <span className="compare-val zero">Rp 0</span>
          <span className="compare-desc">Hangus</span>
        </div>

        <div className="andai-compare-item future">
          <span className="compare-lbl">Andai Diinvestasikan ({investmentYear} Thn)</span>
          <span className="compare-val grow">Rp {futureValue.toLocaleString('id-ID')}</span>
          <span className="compare-gain">+Rp {gain.toLocaleString('id-ID')} (+{Math.round((gain / (totalConsumptiveAmount || 1)) * 100)}%)</span>
        </div>
      </div>

      {/* Ringkasan Transaksi Konsumtif Minimalis */}
      <div className="andai-list-clean">
        <div className="list-clean-title">Rincian Pengeluaran Konsumtif</div>
        {consumptiveTransactions.length === 0 ? (
          <div className="empty-clean-text">Tidak ada pengeluaran konsumtif bulan ini.</div>
        ) : (
          consumptiveTransactions.map(item => (
            <div className="item-clean-row" key={item.id}>
              <div className="item-clean-left">
                <div className="item-clean-icon">
                  {resolveIcon(item) ? (
                    <img src={resolveIcon(item)} alt={item.category} />
                  ) : (
                    <span>🛍️</span>
                  )}
                </div>
                <div className="item-clean-meta">
                  <span className="item-clean-title">{item.title}</span>
                  <span className="item-clean-sub">{item.subtext || item.category}</span>
                </div>
              </div>
              <span className="item-clean-amount">-Rp {Number(item.amount).toLocaleString('id-ID')}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function LossAversionBadge({ transactions, handleOpenAndaiModal }) {
  const now = new Date();
  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const consumptiveTransactions = getConsumptiveTransactions(transactions, currentMonthStr);

  const totalConsumptiveAmount = consumptiveTransactions.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  if (totalConsumptiveAmount === 0) return null;

  const selectedInstrument = INVESTMENT_INSTRUMENTS[0];
  const investmentYear = 5;
  const futureValue = Math.round(totalConsumptiveAmount * Math.pow(1 + selectedInstrument.rate, investmentYear));
  const gain = futureValue - totalConsumptiveAmount;

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
          ⚠️ Peringatan Konsumtif
        </span>
        <span style={{ fontSize: '12px', color: '#ff4d4f' }}>Detail ›</span>
      </div>
      <span style={{ fontSize: '12px', color: '#5c0011', lineHeight: '1.4' }}>
        Bulan ini Anda <strong>kehilangan potensi dana Rp {gain.toLocaleString('id-ID')}</strong> dalam 5 tahun akibat pengeluaran konsumtif.
      </span>
    </div>
  );
}

function App() {
  const [activeTab, setActiveTab] = useState('home'); // 'home' | 'stats'
  const [currentDate, setCurrentDate] = useState(new Date());
  const [periodFilter, setPeriodFilter] = useState('monthly'); // 'monthly' | 'weekly' | 'yearly'
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [statsType, setStatsType] = useState('expense'); // 'expense' | 'income'
  
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

  const [accountsList, setAccountsList] = useState(() => {
    try {
      const saved = safeStorageGet('user_accounts_list');
      return saved ? saved : ['Bank', 'Cash', 'E-Wallet'];
    } catch {
      return ['Bank', 'Cash', 'E-Wallet'];
    }
  });

  const [isCustomAccount, setIsCustomAccount] = useState(false);
  const [customAccountInput, setCustomAccountInput] = useState('');

  // Profile State & Persistence
  const isFirstTimeUser = !safeStorageGet('user_profile_setup_done');

  const [profileName, setProfileName] = useState(() => {
    return safeStorageGet('user_profile_name') || '';
  });
  const [profileImage, setProfileImage] = useState(() => {
    return safeStorageGet('user_profile_image') || null;
  });

  // Auto-open modal on first time setup
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(isFirstTimeUser);
  const [isBudgetCapModalOpen, setIsBudgetCapModalOpen] = useState(false);
  const [hasVisitedBudgetCap, setHasVisitedBudgetCap] = useState(() => {
    return safeStorageGet('user_has_visited_budget_cap') === 'true' || safeStorageGet('user_has_visited_budget_cap') === true;
  });
  const [budgetFilterTab, setBudgetFilterTab] = useState('all'); // 'all' | 'active' | 'unset'
  const [activeBudgetCategory, setActiveBudgetCategory] = useState(null);
  const [budgetModalInputValue, setBudgetModalInputValue] = useState('');
  const [budgetSearchQuery, setBudgetSearchQuery] = useState('');

  const handleOpenBudgetCap = () => {
    if (!hasVisitedBudgetCap) {
      setHasVisitedBudgetCap(true);
      localStorage.setItem('user_has_visited_budget_cap', 'true');
    }
    setIsBudgetCapModalOpen(true);
  };

  // Voice-Command Deletion & Feedback Toast State
  const [deletingTxId, setDeletingTxId] = useState(null);
  const [voiceToastMessage, setVoiceToastMessage] = useState(null);

  // Safety Warning Modal State (Pencegahan transaksi ilegal / berbahaya / rokok / alkohol / asusila)
  const [safetyWarning, setSafetyWarning] = useState({ isOpen: false, categoryLabel: '', reason: '' });

  // Sync Continuous Voice Learner with User Data
  useEffect(() => {
    syncLearnerWithUserData(expenseCategories, transactions);
  }, [expenseCategories, transactions]);

  const showVoiceToast = (msg) => {
    setVoiceToastMessage(msg);
    setTimeout(() => {
      setVoiceToastMessage(null);
    }, 2800);
  };

  // In-App Update Check State
  const [updateInfo, setUpdateInfo] = useState(null);

  // Notification Bell State (Persisted)
  const [isNotifActive, setIsNotifActive] = useState(() => isNotificationEnabled());

  // Web Admin Dashboard URL detection (?admin or /admin)
  const [isAdminView, setIsAdminView] = useState(() => {
    return window.location.search.includes('admin') || window.location.pathname.startsWith('/admin');
  });

  // Hide HTML splash screen immediately on app load once React is ready
  React.useEffect(() => {
    const splash = document.getElementById('app-splash-screen');
    if (splash && splash.parentNode) {
      splash.parentNode.removeChild(splash);
    }
  }, []);

  // Track & update device telemetry on launch / profile change
  React.useEffect(() => {
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

  // Schedule / sync notifications when profile name, transactions, or expenseCategories update
  React.useEffect(() => {
    if (isNotifActive) {
      schedulePersonalizedNotifications(profileName, transactions, expenseCategories);
    }
  }, [isNotifActive, profileName, transactions, expenseCategories]);

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
    const finalName = tempName.trim() || 'Pengguna';
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
    const finalName = tempName.trim() || 'Pengguna';
    const isFirstTimeSetup = !safeStorageGet('user_profile_setup_done');

    setProfileName(finalName);
    setProfileImage(tempProfileImage);
    safeStorageSet('user_profile_name', finalName);
    if (tempProfileImage) {
      safeStorageSet('user_profile_image', tempProfileImage);
    } else {
      localStorage.removeItem('user_profile_image');
    }
    safeStorageSet('user_profile_setup_done', 'true');

    // Auto activate notifications on profile save ONLY for initial onboarding setup
    if (isFirstTimeSetup) {
      if (!isNotifActive) {
        const nextState = await toggleNotificationState(false);
        setIsNotifActive(nextState);
        if (nextState) {
          sendInstantNotification(finalName, transactions);
        }
      } else {
        sendInstantNotification(finalName, transactions);
      }
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
  const [account, setAccount] = useState('Bank'); // 'Bank' | 'Cash' | 'QRIS'
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

  const isCurrentMonth = currentDate.getFullYear() === 2026 && currentDate.getMonth() === 7;

  // Open Full-Page Add Form (Plus button)
  const handleOpenAddModal = () => {
    setTransType('Expense');
    setAmountVal('');
    setSelectedCategory(expenseCategories[0]);
    setIsCustomCat(false);
    setCustomCatInput('');
    setAccount('Bank');
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

  // Handle Category Select (Auto advance to Account)
  const handleSelectCategory = (cat) => {
    setIsCustomCat(false);
    setSelectedCategory(cat);
    setActivePanel('account');
  };

  // Handle Account Select (Auto advance to Note & focus text keyboard)
  const handleSelectAccount = (acc) => {
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
      party: ['pesta', 'nongkrong', 'klub', 'party']
    };

    let list = expenseCategories;
    const q = budgetSearchQuery.toLowerCase().trim();

    if (q) {
      list = expenseCategories
        .map(cat => {
          const nameLower = cat.name.toLowerCase();
          const idLower = cat.id.toLowerCase();
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
    const currentLimit = typeof cat.monthlyLimit === 'number' && cat.monthlyLimit > 0 ? cat.monthlyLimit : 0;
    setBudgetModalInputValue(currentLimit > 0 ? new Intl.NumberFormat('id-ID').format(currentLimit) : '');
  };

  const handleSaveCategoryBudget = () => {
    if (!activeBudgetCategory) return;
    const raw = budgetModalInputValue.replace(/\./g, '').replace(/[^0-9]/g, '');
    const numVal = parseInt(raw, 10) || 0;

    const newCats = expenseCategories.map(c => 
      c.id === activeBudgetCategory.id ? { ...c, monthlyLimit: numVal > 0 ? numVal : undefined } : c
    );
    setExpenseCategories(newCats);
    localStorage.setItem('user_expense_categories', JSON.stringify(newCats));
    setActiveBudgetCategory(null);
    setBudgetModalInputValue('');
  };

  const handleRemoveCategoryBudget = () => {
    if (!activeBudgetCategory) return;
    const newCats = expenseCategories.map(c => 
      c.id === activeBudgetCategory.id ? { ...c, monthlyLimit: undefined } : c
    );
    setExpenseCategories(newCats);
    localStorage.setItem('user_expense_categories', JSON.stringify(newCats));
    setActiveBudgetCategory(null);
    setBudgetModalInputValue('');
  };

  const checkAndTriggerBudgetNotifications = (newTx, allTx, categories) => {
    if (newTx.type !== 'expense' || !newTx.categoryId) return;
    
    const cat = categories.find(c => c.id === newTx.categoryId);
    if (!cat || !cat.monthlyLimit) return;
    
    const limit = parseFloat(cat.monthlyLimit);
    if (limit <= 0) return;

    const txDate = new Date(newTx.date);
    const monthStr = `${txDate.getFullYear()}-${String(txDate.getMonth() + 1).padStart(2, '0')}`;
    
    const allExpensesThisMonth = [newTx, ...allTx].filter(t => {
      if (t.type !== 'expense' || t.categoryId !== newTx.categoryId) return false;
      return t.date.startsWith(monthStr);
    });

    const totalSpent = allExpensesThisMonth.reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);
    const percentage = (totalSpent / limit) * 100;
    
    const thresholds = [20, 40, 60, 80, 90, 92, 94, 96, 98, 100];
    const passedThresholds = thresholds.filter(th => percentage >= th);
    
    if (passedThresholds.length === 0) return;
    
    const storageKey = 'user_budget_notif_state';
    let notifState = safeStorageGet(storageKey, {});
    
    const monthKey = `${newTx.categoryId}_${monthStr}`;
    const notifiedForMonth = notifState[monthKey] || [];
    
    const newThresholds = passedThresholds.filter(th => !notifiedForMonth.includes(th));
    
    if (newThresholds.length > 0) {
      notifState[monthKey] = [...notifiedForMonth, ...newThresholds];
      safeStorageSet(storageKey, notifState);
      
      const highestNewTh = Math.max(...newThresholds);
      const formatIdr = (num) => new Intl.NumberFormat('id-ID').format(num);
      
      let title = `Peringatan Budget: ${cat.name}`;
      let body = `Kamu sudah pakai ${highestNewTh}% budget ${cat.name} bulan ini (Rp ${formatIdr(totalSpent)} dari Rp ${formatIdr(limit)}).`;
      
      if (highestNewTh >= 100) {
        title = `🚨 Budget Habis: ${cat.name}`;
        body = `Budget ${cat.name} bulan ini sudah habis! (Rp ${formatIdr(totalSpent)} dari Rp ${formatIdr(limit)}).`;
      }
      
      sendInstantBudgetNotification(title, body);
    }
  };

  // Save / Delete Voice Transaction
  const handleSaveVoiceTransaction = (result) => {
    if (!result) return;

    // A. Perintah Hapus Suara (Voice-Command Delete)
    if (result.action === 'DELETE') {
      if (transactions.length === 0) {
        showVoiceToast('Belum ada transaksi untuk dihapus');
        return;
      }

      let targetTx = null;

      if (result.isLast) {
        // Ambil transaksi paling atas / terakhir dibuat
        targetTx = transactions[0];
      } else if (result.targetQuery && result.targetAmount) {
        const q = result.targetQuery.toLowerCase();
        // Cari transaksi yang cocok judul + nominal
        targetTx = transactions.find(t => 
          t.amount === result.targetAmount &&
          ((t.title && t.title.toLowerCase().includes(q)) ||
           (t.category && t.category.toLowerCase().includes(q)) ||
           (t.categoryId && t.categoryId.toLowerCase().includes(q)))
        );
        // Fallback jika tidak ketemu tepat keduanya
        if (!targetTx) {
          targetTx = transactions.find(t => t.amount === result.targetAmount) ||
                     transactions.find(t => t.title && t.title.toLowerCase().includes(q));
        }
      } else if (result.targetAmount) {
        // Hapus berdasarkan nominal saja (misal: "Hapus 20 ribu")
        targetTx = transactions.find(t => t.amount === result.targetAmount);
      } else if (result.targetQuery) {
        const q = result.targetQuery.toLowerCase();
        // Cari transaksi yang cocok dari title, category, atau categoryId
        targetTx = transactions.find(t => 
          (t.title && t.title.toLowerCase().includes(q)) ||
          (t.category && t.category.toLowerCase().includes(q)) ||
          (t.categoryId && t.categoryId.toLowerCase().includes(q))
        );
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

    const newTx = {
      id: Date.now(),
      title: finalTitle,
      category: catName,
      categoryId: result.category.id || null,
      account: result.account,
      amount: numericAmount,
      type: result.type.toLowerCase(),
      iconClass: catIconClass,
      date: getTodayISO()
    };

    if (result.type === 'Expense') {
      const isConsumptive = isConsumptiveHybrid(newTx, transactions);
      if (!isConsumptive) {
        playPositiveChime();
      }
      checkAndTriggerBudgetNotifications(newTx, transactions, expenseCategories);
    }

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

    // Save note to history if non-empty and not already in history
    if (note.trim()) {
      setNoteHistory(prev => {
        if (!prev.includes(note.trim())) {
          return [note.trim(), ...prev];
        }
        return prev;
      });
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
      date: selectedDateVal || getTodayISO()
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

  // Filter transactions according to period (monthly/weekly/yearly)
  const filteredTransactions = transactions.filter(t => {
    if (!isCurrentMonth) return false;
    if (periodFilter === 'weekly') {
      // Show subset for weekly view
      return t.id <= 6;
    }
    return true;
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
      {activeTab === 'home' ? (
        <>
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
                  Good Day,
                </span>
                <span className="profile-name">{profileName || 'Pengguna'}</span>
              </div>
              <div className="profile-avatar">
                {profileImage ? (
                  <img src={profileImage} alt={profileName} className="profile-avatar-img" />
                ) : (
                  (profileName || 'P').trim().charAt(0).toUpperCase()
                )}
              </div>
            </div>
          </header>

          {/* Balance Cards */}
          <section className="balance-section">
            <div className="balance-card expenses-card">
              <span className="card-label">Expenses</span>
              <div className="amount-container">
                <span className="amount">{isCurrentMonth ? `Rp ${totalExpenses.toLocaleString('id-ID')}` : 'Rp 0'}</span>
                <span className="icon-down">▼</span>
              </div>
            </div>
            <div className="balance-card income-card">
              <span className="card-label">Income</span>
              <div className="amount-container">
                <span className="amount">{isCurrentMonth ? `Rp ${totalIncome.toLocaleString('id-ID')}` : 'Rp 0'}</span>
                <span className="icon-up">▲</span>
              </div>
            </div>
            <div className="balance-card total-card">
              <span className="card-label">Total</span>
              <div className="amount-container">
                <span className="amount">{isCurrentMonth ? `Rp ${totalBalance.toLocaleString('id-ID')}` : 'Rp 0'}</span>
                <span className="icon-total font-bold">💰</span>
              </div>
            </div>
          </section>

          {isCurrentMonth && (
            <LossAversionBadge 
              transactions={transactions} 
              handleOpenAndaiModal={handleOpenAndaiModal} 
            />
          )}

          {/* Transactions List Grouped by Date */}
          <section className="transactions-container">
            {isCurrentMonth ? (
              transactions.length > 0 ? (
                (() => {
                  // Group transactions by YYYY-MM-DD
                  const groupedMap = {};
                  transactions.forEach(tx => {
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
                            <span className="day-income-amount">Rp {dayIncome.toLocaleString('id-ID')}</span>
                            <span className="day-expense-amount">Rp {dayExpense.toLocaleString('id-ID')}</span>
                          </div>
                        </div>

                        {/* Transaction Items under this date */}
                        <div className="date-group-items">
                          {groupTxs.map(item => (
                            <div className={`transaction-item ${deletingTxId === item.id ? 'deleting-sink' : ''}`} key={item.id}>
                              <div className={`transaction-icon ${item.iconClass}`}>
                                {resolveIcon(item) && <img src={resolveIcon(item)} alt={item.category} />}
                              </div>
                              <div className="transaction-details">
                                <span className="transaction-title">{item.title}</span>
                                <span className="transaction-category">{item.category} • {item.account || 'Bank'}</span>
                              </div>
                              <div className={`transaction-amount ${item.type === 'expense' ? 'negative' : 'positive'}`}>
                                {item.type === 'expense' ? '-' : '+'}Rp {item.amount.toLocaleString('id-ID')}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  });
                })()
              ) : (
                <div className="empty-transactions">
                  <span className="empty-icon">📂</span>
                  <span className="empty-title">Belum ada transaksi</span>
                  <span className="empty-subtitle">Tidak ada riwayat transaksi pada bulan {formatMonthYear(currentDate)}</span>
                </div>
              )
            ) : (
              <div className="empty-transactions">
                <span className="empty-icon">📂</span>
                <span className="empty-title">Belum ada transaksi</span>
                <span className="empty-subtitle">Tidak ada riwayat transaksi pada bulan {formatMonthYear(currentDate)}</span>
              </div>
            )}
          </section>
        </>
      ) : (
        /* Stats / Diagram View (Detailed Pie Chart matching reference) */
        <div className="stats-page-container">
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
              <span>Income</span>
              <span className="stats-total-amount">
                Rp {filteredTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0).toLocaleString('id-ID')}
              </span>
            </button>
            <button
              type="button"
              className={`stats-type-tab expense ${statsType === 'expense' ? 'active' : ''}`}
              onClick={() => setStatsType('expense')}
            >
              <span>Expenses</span>
              <span className="stats-total-amount">
                Rp {filteredTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0).toLocaleString('id-ID')}
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
                        <g key={`label-${idx}`} className="pie-label-group">
                          <text
                            x={slice.pLabel.x + (slice.isRight ? 2 : -2)}
                            y={slice.pLabel.y - 3}
                            textAnchor={textAnchor}
                            className="pie-label-name"
                          >
                            {slice.name}
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

          {/* Category Breakdown List */}
          <div className="stats-breakdown-list">
            {statsCategories.map((cat, idx) => (
              <div key={idx} className="stats-breakdown-item">
                <div className="stats-item-left">
                  <div className="stats-percent-badge" style={{ backgroundColor: cat.color }}>
                    {Math.round(cat.percentage)}%
                  </div>
                  <div className="stats-cat-info">
                    {resolveIcon(cat) && <img src={resolveIcon(cat)} alt={cat.name} className="stats-cat-icon" />}
                    <span className="stats-cat-name">
                      {cat.name} <span className="stats-cat-count">({cat.count}x)</span>
                    </span>
                  </div>
                </div>
                <div className="stats-item-right">
                  <span className="stats-cat-amount">Rp {cat.amount.toLocaleString('id-ID')}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'home' && (
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
          <path
            d="M 0,20 Q 0,0 20,0 L 145,0 C 165,0 172,34 200,34 C 228,34 235,0 255,0 L 380,0 Q 400,0 400,20 L 400,80 L 0,80 Z"
            fill="rgba(248, 239, 230, 0.95)"
          />
        </svg>

        <div className="nav-items-container">
          <button
            type="button"
            className={`nav-item ${activeTab === 'home' ? 'active' : ''}`}
            onClick={() => setActiveTab('home')}
            aria-label="Home"
          >
            <img src={houseSvg} alt="Home" className="nav-icon" />
          </button>

          <div className="nav-item center-add-wrapper">
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

          <button
            type="button"
            className={`nav-item ${activeTab === 'stats' ? 'active' : ''}`}
            onClick={() => setActiveTab('stats')}
            aria-label="Stats"
          >
            <img src={diagramSvg} alt="Stats" className="nav-icon" />
          </button>
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
            <span className="full-page-title">{transType}</span>
          </div>

          {/* Type Switcher Tabs */}
          <div className="type-switcher-container">
            <div className="type-switcher">
              {['Income', 'Expense', 'Andai'].map(type => (
                <button
                  key={type}
                  type="button"
                  className={`type-tab ${transType === type ? `active ${type.toLowerCase()}-tab` : ''}`}
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
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Fitur 'Andai' — Opportunity Cost & Consumptive Investment Visualizer */}
          {transType === 'Andai' ? (
            <AndaiFeatureView 
              transactions={transactions} 
              resolveIcon={resolveIcon} 
            />
          ) : (
            /* Form Fields List for Expense & Income */
            <div className="full-page-form">
              {/* Date Row (Split Date & Time Click Triggers for Native Android/iOS Pickers) */}
              <div className="form-row date-row-container">
                <span className="field-label">Date</span>
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
                <label htmlFor="transaction-amount-input" className="field-label">Amount</label>
                <div className="amount-input-wrapper">
                  <span className="currency-prefix">Rp</span>
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
                <span className="field-label">Category</span>
                <div className="field-value-category">
                  <div className="cat-chip">
                    {resolveIcon(selectedCategory) && (
                      <img src={resolveIcon(selectedCategory)} alt={selectedCategory.name} className="cat-chip-icon" />
                    )}
                    <span>{selectedCategory.name}</span>
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
                <span className="field-label">Account</span>
                <div className="field-value-category">
                  <div className="cat-chip">
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
                <label htmlFor="transaction-note-input" className="field-label">Note</label>
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

                {/* Floating History Popover Overlay - Only appears WHEN user types letters matching saved transactions history */}
                {activePanel === 'note' && isNoteSuggestionsOpen && note.trim().length > 0 && (
                  (() => {
                    // Extract unique notes from actual user transactions history
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

              {/* Save Button ONLY when activePanel === 'note' */}
              {activePanel === 'note' && (
                <div className="note-save-container">
                  <button
                    type="button"
                    className={`save-btn-dynamic ${transType === 'Expense' ? 'save-red' : transType === 'Income' ? 'save-green' : 'save-blue'}`}
                    onClick={handleSaveTransaction}
                  >
                    Save
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Category Selector Sheet when Category is active */}
          {activePanel === 'category' && (
            <div className="panel-category-full">
              <div className="panel-sub-header">
                <span className="panel-title">Category</span>
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
                    title="Tutup"
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
                    placeholder="Tulis kategori baru..."
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
                    + Tambah
                  </button>
                </div>
              )}

              <div className="category-grid">
                {(transType === 'Expense' ? expenseCategories : incomeCategories).map(cat => {
                  const catIcon = resolveIcon(cat);
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      className={`cat-grid-item ${selectedCategory.id === cat.id ? 'active' : ''} ${!catIcon ? 'text-only' : ''}`}
                      onClick={() => handleSelectCategory(cat)}
                    >
                      {catIcon ? (
                        <div className={`cat-grid-icon ${cat.iconClass}`}>
                          <img src={catIcon} alt={cat.name} />
                        </div>
                      ) : null}
                      <span className="cat-grid-label">{cat.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Account Selector Sheet when Account is active */}
          {activePanel === 'account' && (
            <div className="panel-category-full">
              <div className="panel-sub-header">
                <span className="panel-title">Account</span>
                <div className="panel-header-actions">
                  <button
                    type="button"
                    className={`header-action-btn ${isCustomAccount ? 'active' : ''}`}
                    onClick={() => setIsCustomAccount(!isCustomAccount)}
                    title="Tulis Akun Sendiri"
                    aria-label="Edit custom account"
                  >
                    ✏️
                  </button>
                  <button
                    type="button"
                    className="header-action-btn close-btn"
                    onClick={() => setActivePanel('note')}
                    title="Tutup"
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
                    placeholder="Tulis akun baru..."
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
                    + Tambah
                  </button>
                </div>
              )}

              <div className="category-grid">
                {accountsList.map(acc => (
                  <button
                    key={acc}
                    type="button"
                    className={`cat-grid-item text-only ${account === acc ? 'active' : ''}`}
                    onClick={() => handleSelectAccount(acc)}
                  >
                    <span className="cat-grid-label" style={{ fontSize: '14px' }}>{acc}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Onboarding Welcome Setup Modal (Hanya untuk pengguna baru saat pertama kali buka aplikasi) */}
      {isProfileModalOpen && !safeStorageGet('user_profile_setup_done') && (
        <div className="modal-overlay profile-setup-overlay">
          <div className="profile-modal-card">
            <div className="profile-modal-header">
              <h3 className="profile-modal-title">Selamat Datang! Atur Profil Anda</h3>
            </div>

            <div className="profile-modal-body">
              {/* Avatar Picker Circle */}
              <div className="profile-avatar-picker-wrapper">
                <div
                  className="profile-avatar-picker-circle"
                  onClick={() => profileFileInputRef.current && profileFileInputRef.current.click()}
                  title="Klik untuk memilih foto profil"
                >
                  {tempProfileImage ? (
                    <img src={tempProfileImage} alt="Foto Profil" className="profile-picker-img" />
                  ) : (
                    <span className="profile-picker-initial">
                      {(tempName.trim() || 'P').charAt(0).toUpperCase()}
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

              {/* Name Input Field (TANPA autoFocus) */}
              <div className="profile-field-group">
                <label className="profile-field-label">Nama Lengkap / Panggilan</label>
                <input
                  type="text"
                  className="profile-name-input"
                  placeholder="Ketik nama Anda..."
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveProfile();
                  }}
                />
              </div>
            </div>

            <div className="profile-modal-footer" style={{ flexDirection: 'column', gap: '8px' }}>
              <button
                type="button"
                className="profile-save-btn"
                onClick={handleSaveProfile}
              >
                Simpan Profil
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full Page WhatsApp Style Profile Screen (Untuk user terdaftar) */}
      {isProfileModalOpen && safeStorageGet('user_profile_setup_done') && (
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
              <h3 className="profile-modal-title">Pengaturan Profil</h3>
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

              {/* WA-Style Settings Menu List */}
              <div className="wa-settings-menu-group">
                {/* 1. Budget Kategori */}
                <div className="wa-menu-item" onClick={handleOpenBudgetCap}>
                  <div className="wa-menu-icon-box budget-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="7" width="20" height="15" rx="2" ry="2"/>
                      <polyline points="17 2 12 7 7 2"/>
                    </svg>
                  </div>
                  <div className="wa-menu-content">
                    <div className="wa-menu-title-row">
                      <span className="wa-menu-title">Budget Kategori Per Bulan</span>
                      {!hasVisitedBudgetCap && <span className="wa-unread-dot" />}
                    </div>
                    <span className="wa-menu-subtitle">Atur batas maksimal pengeluaran kategori</span>
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

      {/* Budget Cap Full Page UI */}
      {isBudgetCapModalOpen && (
        <div className="modal-overlay profile-setup-overlay full-page-profile-screen">
          <div className="budget-cap-screen-wrapper">
            <div className="profile-modal-header budget-screen-header">
              <button
                type="button"
                className="back-btn"
                onClick={() => setIsBudgetCapModalOpen(false)}
                aria-label="Kembali"
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 12H5M12 19l-7-7 7-7"/>
                </svg>
              </button>
              <h3 className="profile-modal-title">Budget Kategori Per Bulan</h3>
              <div style={{ width: '32px' }}></div>
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

            {/* Filter Tabs (Solusi C) */}
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

            {/* Clean Category List (Solusi A) */}
            <div className="budget-list-container">
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

                return filtered.map(cat => {
                  const iconPath = resolveIcon(cat);
                  const hasLimit = typeof cat.monthlyLimit === 'number' && cat.monthlyLimit > 0;

                  return (
                    <div 
                      key={cat.id} 
                      className="budget-item-card"
                      onClick={() => handleOpenCategoryBudgetModal(cat)}
                    >
                      <div className={`budget-item-icon-box ${cat.iconClass}`}>
                        <img src={iconPath} alt={cat.name} />
                      </div>

                      <div className="budget-item-info">
                        <span className="budget-item-name">{cat.name}</span>
                        <span className="budget-item-sub">
                          {hasLimit ? 'Batas aktif' : 'Tanpa batas'}
                        </span>
                      </div>

                      <div className="budget-item-status-wrapper">
                        {hasLimit ? (
                          <span className="budget-status-badge active">
                            Rp {new Intl.NumberFormat('id-ID').format(cat.monthlyLimit)}
                          </span>
                        ) : (
                          <span className="budget-status-badge unset">
                            Belum diatur
                          </span>
                        )}
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="budget-item-chevron">
                          <polyline points="9 18 15 12 9 6"></polyline>
                        </svg>
                      </div>
                    </div>
                  );
                });
              })()}
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
                <span className="budget-modal-input-prefix">Rp</span>
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

      {/* Simple App Update Pop-Up Modal */}
      {updateInfo && (
        <div className="modal-overlay update-overlay">
          <div className="update-modal-card">
            <div className="update-modal-header">
              <span className="update-modal-badge">🚀 Versi Baru Tersedia</span>
            </div>
            <div className="update-modal-body">
              <h3 className="update-version-title">Update v{updateInfo.version}</h3>
              <p className="update-changelog-text">{updateInfo.changelog || 'Pembaruan aplikasi telah tersedia.'}</p>
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
                  const rawUrl = updateInfo?.downloadUrl || 'https://raw.githubusercontent.com/redilah/Finance-tracker/main/Cassiel.apk';
                  const cleanUrl = rawUrl.split('?')[0] + `?t=${Date.now()}`;
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
    </div>
  );
}

export default App;

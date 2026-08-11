import React, { useState, useRef } from 'react';
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
import { CURRENT_VERSION_NAME, CURRENT_VERSION_CODE, checkForAppUpdates } from './utils/version';
import AdminDashboard from './components/admin/AdminDashboard';
import { updateCurrentDeviceTelemetry } from './utils/telemetry';
import { 
  isNotificationEnabled, 
  toggleNotificationState, 
  sendInstantNotification, 
  schedulePersonalizedNotifications, 
  playSound,
  playPopSound 
} from './utils/notifications';

const DEFAULT_EXPENSE_CATEGORIES = [
  { id: 'food', name: 'Food', icon: fastFoodSvg, iconClass: 'food-icon' },
  { id: 'bioskop', name: 'Bioskop', icon: gameSvg, iconClass: 'game-icon' },
  { id: 'transport', name: 'Transportasi', icon: carSvg, iconClass: 'car-icon' },
  { id: 'barber', name: 'Barbershop', icon: barberSvg, iconClass: 'barber-icon' },
  { id: 'skincare', name: 'Skincare', icon: cosmeticsSvg, iconClass: 'cosmetics-icon' },
  { id: 'edukasi', name: 'Edukasi', icon: bookSvg, iconClass: 'book-icon' },
  { id: 'galon', name: 'Air Galon', icon: dispenserBottleSvg, iconClass: 'bottle-icon' },
  { id: 'fashion', name: 'Fashion', icon: shirtShoeSvg, iconClass: 'fashion-icon' },
  { id: 'supermarket', name: 'Supermarket', icon: shoppingCartSvg, iconClass: 'cart-icon' },
  { id: 'sub', name: 'Subscription', icon: subscriptionSvg, iconClass: 'sub-icon' },
  { id: 'pesawat', name: 'Pesawat', icon: pesawatSvg, iconClass: 'pesawat-icon' },
  { id: 'kost', name: 'Kost', icon: kostSvg, iconClass: 'kost-icon' },
];

const DEFAULT_INCOME_CATEGORIES = [
  { id: 'gaji', name: 'Gaji', icon: salarySvg, iconClass: 'food-icon' },
  { id: 'bonus', name: 'Bonus', icon: bonusSvg, iconClass: 'sub-icon' },
  { id: 'kip', name: 'KIP', icon: kipSvg, iconClass: 'car-icon' },
];

const INITIAL_TRANSACTIONS = [];

// Helper to detect wallpaper average brightness (0 = dark, 255 = light)
const getWallpaperLuminance = (imageSrc) => {
  return new Promise((resolve) => {
    if (!imageSrc) {
      resolve(null);
      return;
    }
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 40;
        canvas.height = 40;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, 40, 40);
        const imgData = ctx.getImageData(0, 0, 40, 40).data;
        let totalLuminance = 0;
        let count = 0;
        for (let i = 0; i < imgData.length; i += 4) {
          const r = imgData[i];
          const g = imgData[i + 1];
          const b = imgData[i + 2];
          const lum = 0.299 * r + 0.587 * g + 0.114 * b;
          totalLuminance += lum;
          count++;
        }
        resolve(totalLuminance / count);
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = imageSrc;
  });
};

function App() {
  const [activeTab, setActiveTab] = useState('home'); // 'home' | 'stats'
  const [currentDate, setCurrentDate] = useState(new Date());
  const [periodFilter, setPeriodFilter] = useState('monthly'); // 'monthly' | 'weekly' | 'yearly'
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [statsType, setStatsType] = useState('expense'); // 'expense' | 'income'
  
  // LocalStorage Persistence for Transactions
  const [transactions, setTransactions] = useState(() => {
    try {
      const saved = localStorage.getItem('user_transactions');
      return saved ? JSON.parse(saved) : INITIAL_TRANSACTIONS;
    } catch {
      return INITIAL_TRANSACTIONS;
    }
  });

  // LocalStorage Persistence for Custom Categories & Accounts
  const [expenseCategories, setExpenseCategories] = useState(() => {
    try {
      const saved = localStorage.getItem('user_expense_categories');
      return saved ? JSON.parse(saved) : DEFAULT_EXPENSE_CATEGORIES;
    } catch {
      return DEFAULT_EXPENSE_CATEGORIES;
    }
  });

  const [incomeCategories, setIncomeCategories] = useState(() => {
    try {
      const saved = localStorage.getItem('user_income_categories');
      return saved ? JSON.parse(saved) : DEFAULT_INCOME_CATEGORIES;
    } catch {
      return DEFAULT_INCOME_CATEGORIES;
    }
  });

  const [accountsList, setAccountsList] = useState(() => {
    try {
      const saved = localStorage.getItem('user_accounts_list');
      return saved ? JSON.parse(saved) : ['Bank', 'Cash', 'E-Wallet'];
    } catch {
      return ['Bank', 'Cash', 'E-Wallet'];
    }
  });

  const [isCustomAccount, setIsCustomAccount] = useState(false);
  const [customAccountInput, setCustomAccountInput] = useState('');

  // Profile State & Persistence
  const isFirstTimeUser = !localStorage.getItem('user_profile_setup_done');

  const [profileName, setProfileName] = useState(() => {
    return localStorage.getItem('user_profile_name') || '';
  });
  const [profileImage, setProfileImage] = useState(() => {
    return localStorage.getItem('user_profile_image') || null;
  });
  const [appWallpaper, setAppWallpaper] = useState(() => {
    return localStorage.getItem('user_app_wallpaper') || null;
  });
  const [tempWallpaper, setTempWallpaper] = useState(appWallpaper);
  const [isWallpaperJustSelected, setIsWallpaperJustSelected] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  // Auto-open modal on first time setup
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(isFirstTimeUser);

  // In-App Update Check State
  const [updateInfo, setUpdateInfo] = useState(null);

  // Notification Bell State (Persisted)
  const [isNotifActive, setIsNotifActive] = useState(() => isNotificationEnabled());

  // Web Admin Dashboard URL detection (?admin or /admin)
  const [isAdminView, setIsAdminView] = useState(() => {
    return window.location.search.includes('admin') || window.location.pathname.startsWith('/admin');
  });

  // Hide HTML splash screen smoothly on app load once React is ready
  React.useEffect(() => {
    const splash = document.getElementById('app-splash-screen');
    if (splash) {
      if (isAdminView) {
        if (splash.parentNode) splash.parentNode.removeChild(splash);
      } else {
        splash.classList.add('splash-exit');
        setTimeout(() => {
          if (splash.parentNode) {
            splash.parentNode.removeChild(splash);
          }
        }, 500);
      }
    }
  }, [isAdminView]);

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
    if (isNotifActive) {
      playSound('app_open');
    }
  }, []);

  // Schedule / sync notifications when profile name or transactions update
  React.useEffect(() => {
    if (isNotifActive) {
      schedulePersonalizedNotifications(profileName, transactions);
    }
  }, [isNotifActive, profileName, transactions]);

  const handleToggleNotification = async (e) => {
    e.stopPropagation(); // prevent opening profile modal
    const nextState = await toggleNotificationState(isNotifActive);
    setIsNotifActive(nextState);
    if (nextState) {
      sendInstantNotification(profileName, transactions);
    }
  };

  React.useEffect(() => {
    const checkUpdate = () => {
      checkForAppUpdates().then(info => {
        if (info) setUpdateInfo(info);
      });
    };

    // 1. Cek saat pertama kali dibuka (mount)
    checkUpdate();

    // 2. Cek saat aplikasi Capacitor kembali dari background (resume)
    let appStateListener;
    import('@capacitor/app').then(({ App: CapApp }) => {
      CapApp.addListener('appStateChange', ({ isActive }) => {
        if (isActive) checkUpdate();
      }).then(listener => {
        appStateListener = listener;
      });
    }).catch(() => {
      // Fallback PWA / Web
      const handleVisibility = () => {
        if (document.visibilityState === 'visible') checkUpdate();
      };
      document.addEventListener('visibilitychange', handleVisibility);
      appStateListener = { remove: () => document.removeEventListener('visibilitychange', handleVisibility) };
    });

    return () => {
      if (appStateListener) appStateListener.remove();
    };
  }, []);

  // Sync states to LocalStorage
  React.useEffect(() => {
    localStorage.setItem('user_transactions', JSON.stringify(transactions));
  }, [transactions]);

  React.useEffect(() => {
    localStorage.setItem('user_expense_categories', JSON.stringify(expenseCategories));
  }, [expenseCategories]);

  React.useEffect(() => {
    localStorage.setItem('user_income_categories', JSON.stringify(incomeCategories));
  }, [incomeCategories]);

  React.useEffect(() => {
    localStorage.setItem('user_accounts_list', JSON.stringify(accountsList));
  }, [accountsList]);

  // Note History & Modal state
  const [noteHistory, setNoteHistory] = useState([]);
  const [isNoteSuggestionsOpen, setIsNoteSuggestionsOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const [tempName, setTempName] = useState(profileName);
  const [tempProfileImage, setTempProfileImage] = useState(profileImage);

  // Image Crop & Adjustment State (Image 2 Style)
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState(null);
  const [cropZoom, setCropZoom] = useState(1);
  const [cropRotation, setCropRotation] = useState(0);
  const [cropOffset, setCropOffset] = useState({ x: 0, y: 0 });
  const [isDraggingCrop, setIsDraggingCrop] = useState(false);
  const [cropDragStart, setCropDragStart] = useState({ x: 0, y: 0 });

  const profileFileInputRef = useRef(null);
  const wallpaperFileInputRef = useRef(null);
  const cropImgRef = useRef(null);

  // Dynamically apply custom wallpaper & brightness detection to root container
  React.useEffect(() => {
    const rootEl = document.getElementById('root');
    if (rootEl) {
      if (appWallpaper) {
        rootEl.style.backgroundImage = `url(${appWallpaper})`;
        rootEl.style.backgroundSize = 'cover';
        rootEl.style.backgroundPosition = 'center';
        rootEl.style.backgroundRepeat = 'no-repeat';

        getWallpaperLuminance(appWallpaper).then((avgLum) => {
          if (avgLum !== null && avgLum > 135) {
            rootEl.classList.add('light-wallpaper');
          } else {
            rootEl.classList.remove('light-wallpaper');
          }
        });
      } else {
        rootEl.style.backgroundImage = '';
        rootEl.style.backgroundSize = '';
        rootEl.style.backgroundPosition = '';
        rootEl.style.backgroundRepeat = '';
        rootEl.classList.remove('light-wallpaper');
      }
    }
  }, [appWallpaper]);

  const handleOpenProfileModal = () => {
    setTempName(profileName);
    setTempProfileImage(profileImage);
    setTempWallpaper(appWallpaper);
    setIsWallpaperJustSelected(false);
    setIsProfileModalOpen(true);
  };

  const handleSelectWallpaperFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setTempWallpaper(reader.result);
      setIsWallpaperJustSelected(true);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSelectFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setCropImageSrc(reader.result);
      setCropZoom(1);
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
    const size = 400;
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

    const croppedUrl = canvas.toDataURL('image/jpeg', 0.9);
    setTempProfileImage(croppedUrl);
    setIsCropModalOpen(false);
  };

  const handleSaveProfile = async () => {
    const finalName = tempName.trim() || 'Pengguna';
    const isFirstTimeSetup = !localStorage.getItem('user_profile_setup_done');

    setProfileName(finalName);
    setProfileImage(tempProfileImage);
    setAppWallpaper(tempWallpaper);
    localStorage.setItem('user_profile_name', finalName);
    if (tempProfileImage) {
      localStorage.setItem('user_profile_image', tempProfileImage);
    } else {
      localStorage.removeItem('user_profile_image');
    }
    if (tempWallpaper) {
      localStorage.setItem('user_app_wallpaper', tempWallpaper);
    } else {
      localStorage.removeItem('user_app_wallpaper');
    }
    localStorage.setItem('user_profile_setup_done', 'true');

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

  // Format selected date and time to original string format e.g. "8/9/26 (Sun) 08:08"
  const formatSelectedDateTime = (dateISO, timeHHMM) => {
    try {
      const [year, month, day] = dateISO.split('-').map(Number);
      const [hours, mins] = timeHHMM.split(':');
      const d = new Date(year, month - 1, day, Number(hours), Number(mins));
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const dayName = days[d.getDay()];
      const dateFormatted = `${month}/${day}/${String(year).slice(-2)}`;
      return `${dateFormatted} (${dayName})  ${hours}:${mins}`;
    } catch {
      return `${dateISO} ${timeHHMM}`;
    }
  };

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

  // Save Transaction
  const handleSaveTransaction = () => {
    const numericAmount = parseFloat(amountVal.replace(/\./g, '')) || 0;
    if (numericAmount <= 0) {
      alert('Masukkan nominal transaksi');
      return;
    }

    const catName = selectedCategory.name;
    const catIcon = selectedCategory.icon || (transType === 'Expense' ? fastFoodSvg : salarySvg);
    const catIconClass = selectedCategory.iconClass || 'food-icon';

    const finalTitle = note.trim() || catName;

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
      account: account,
      amount: numericAmount,
      type: transType.toLowerCase(),
      icon: catIcon,
      iconClass: catIconClass,
      date: selectedDateVal || getTodayISO()
    };

    setTransactions(prev => [newTx, ...prev]);
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
        icon: t.icon
      };
    }
    categoryMap[t.category].amount += t.amount;
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
  const chartWidth = 380;
  const chartHeight = 260;
  const centerX = chartWidth / 2;
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
      <AdminDashboard 
        onNavigateToApp={() => {
          window.history.pushState({}, '', window.location.pathname.replace('/admin', '/').replace(/\?admin.*/, ''));
          setIsAdminView(false);
        }}
      />
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
                            <div className="transaction-item" key={item.id}>
                              <div className={`transaction-icon ${item.iconClass}`}>
                                <img src={item.icon} alt={item.category} />
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
                    {cat.icon && <img src={cat.icon} alt={cat.name} className="stats-cat-icon" />}
                    <span className="stats-cat-name">{cat.name}</span>
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
              {['Income', 'Expense', 'Transfer'].map(type => (
                <button
                  key={type}
                  type="button"
                  className={`type-tab ${transType === type ? `active ${type.toLowerCase()}-tab` : ''}`}
                  onClick={() => {
                    setTransType(type);
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

          {/* Transfer Empty View */}
          {transType === 'Transfer' ? (
            <div className="transfer-empty-view">
              <span className="transfer-empty-icon">💸</span>
              <span className="transfer-empty-title">Transfer</span>
              <span className="transfer-empty-subtitle">Menu Transfer saat ini belum diisi</span>
            </div>
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
                    {selectedCategory.icon && (
                      <img src={selectedCategory.icon} alt={selectedCategory.name} className="cat-chip-icon" />
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
                {(transType === 'Expense' ? expenseCategories : incomeCategories).map(cat => (
                  <button
                    key={cat.id}
                    type="button"
                    className={`cat-grid-item ${selectedCategory.id === cat.id ? 'active' : ''} ${!cat.icon ? 'text-only' : ''}`}
                    onClick={() => handleSelectCategory(cat)}
                  >
                    {cat.icon ? (
                      <div className={`cat-grid-icon ${cat.iconClass}`}>
                        <img src={cat.icon} alt={cat.name} />
                      </div>
                    ) : null}
                    <span className="cat-grid-label">{cat.name}</span>
                  </button>
                ))}
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

      {/* Profile Setup / Edit Modal */}
      {isProfileModalOpen && (
        <div className="modal-overlay profile-setup-overlay">
          <div className="profile-modal-card">
            <div className="profile-modal-header">
              <h3 className="profile-modal-title">
                {localStorage.getItem('user_profile_setup_done') ? 'Atur Profil Anda' : 'Selamat Datang! Atur Profil Anda'}
              </h3>
              {localStorage.getItem('user_profile_setup_done') && (
                <button
                  type="button"
                  className="profile-modal-close-btn"
                  onClick={() => setIsProfileModalOpen(false)}
                  aria-label="Tutup"
                >
                  ✕
                </button>
              )}
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

              {/* Name Input Field */}
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
                  autoFocus
                />
              </div>

              {/* Wallpaper Customizer Option */}
              <div className="profile-field-group" style={{ marginTop: '12px' }}>
                <div className="wallpaper-actions-row" style={{ marginTop: 0 }}>
                  <button
                    type="button"
                    className={`wallpaper-btn wallpaper-pick-btn ${isWallpaperJustSelected ? 'active-uploaded' : ''}`}
                    onClick={() => wallpaperFileInputRef.current && wallpaperFileInputRef.current.click()}
                  >
                    {isWallpaperJustSelected ? (
                      <>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                        <span>Wallpaper Terpasang</span>
                      </>
                    ) : (
                      <>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                          <circle cx="8.5" cy="8.5" r="1.5"/>
                          <polyline points="21 15 16 10 5 21"/>
                        </svg>
                        <span>Ganti Wallpaper</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    className="wallpaper-btn wallpaper-reset-btn"
                    onClick={() => setIsResetConfirmOpen(true)}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
                      <path d="M3 3v5h5"/>
                    </svg>
                    <span>Reset Default</span>
                  </button>
                </div>

                <input
                  ref={wallpaperFileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden-file-input"
                  onChange={handleSelectWallpaperFile}
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

      {/* Confirmation Modal for Resetting Wallpaper */}
      {isResetConfirmOpen && (
        <div className="modal-overlay wallpaper-confirm-overlay" style={{ zIndex: 1100 }}>
          <div className="profile-modal-card confirm-modal-card">
            <div className="profile-modal-header">
              <h3 className="profile-modal-title">Konfirmasi Wallpaper</h3>
              <button
                type="button"
                className="profile-modal-close-btn"
                onClick={() => setIsResetConfirmOpen(false)}
                aria-label="Tutup"
              >
                ✕
              </button>
            </div>
            <div className="profile-modal-body" style={{ textAlign: 'center', padding: '16px 8px' }}>
              <p className="confirm-modal-text">
                Apakah Anda yakin ingin mengembalikan wallpaper ke tampilan default?
              </p>
            </div>
            <div className="profile-modal-footer" style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                className="wallpaper-cancel-btn"
                onClick={() => setIsResetConfirmOpen(false)}
              >
                Batal
              </button>
              <button
                type="button"
                className="wallpaper-confirm-reset-btn"
                onClick={() => {
                  setTempWallpaper(null);
                  setIsWallpaperJustSelected(false);
                  setIsResetConfirmOpen(false);
                }}
              >
                Ya, Reset
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

      {/* Simple In-App Update Pop-Up Modal */}
      {updateInfo && (
        <div className="modal-overlay update-modal-overlay">
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
                onClick={() => setUpdateInfo(null)}
              >
                Nanti
              </button>
              <a
                href={updateInfo.downloadUrl || 'https://github.com/redilah/Finance-tracker/releases'}
                target="_blank"
                rel="noreferrer"
                className="update-now-btn"
              >
                Update Sekarang
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;

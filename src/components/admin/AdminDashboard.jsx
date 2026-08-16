import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import './AdminDashboard.css';
import { 
  getTelemetryData, 
  updateCurrentDeviceTelemetry, 
  subscribeToTelemetry 
} from '../../utils/telemetry';
import { 
  getLearnedInsights, 
  fetchLearnedInsightsFromCloud, 
  subscribeToLearnedInsights,
  clearLearnedInsights,
  deleteSingleLearnedInsight
} from '../../utils/voiceLearner';
import { 
  subscribeToFeedbacks, 
  deleteFeedbackItem, 
  updateFeedbackItemStatus 
} from '../../utils/feedback';
import { syncDecrypt } from '../../utils/secureStorage';
import { 
  Users, 
  Smartphone, 
  RefreshCw, 
  Clock, 
  Search, 
  ArrowLeft, 
  CheckCircle, 
  AlertCircle, 
  Activity, 
  ShieldCheck,
  HardDrive,
  Flame,
  Sparkles,
  Lightbulb,
  Brain,
  Trash2,
  Tag,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Calendar,
  Check,
  ExternalLink,
  MessageSquare,
  Heart
} from 'lucide-react';

const REFRESH_INTERVAL_SECONDS = 1200; // 20 minutes = 1200 seconds
const FIREBASE_CONSOLE_URL = 'https://console.firebase.google.com/u/0/project/regalia-senpai-app/firestore/databases/-default-/data/~2Fcassiel_telemetry~2Fdev_3a8q6za_mst1qfoh';

/**
 * Memastikan kategori pada kartu AI Learning selalu logis dan masuk akal
 */
export const getSensibleVocabCategory = (vocabWord, rawCategory) => {
  const clean = (vocabWord || '').toLowerCase().trim();
  if (!clean) return rawCategory || 'Umum';

  // 1. Buah
  if (/nanas|apel|pisang|jeruk|semangka|melon|mangga|durian|duren|alpukat|anggur|pepaya|salak|rambutan|stroberi|strawberry|jambu|pear|pir|kelengkeng|lengkeng|duku|manggis|kiwi|sirsak|blewah|belimbing|nangka|cempedak|markisa|kedondong|srikaya|sawo|plum|kurma|delima|buah/i.test(clean)) {
    return 'Buah';
  }

  // 2. Minuman
  if (/es kacang|kacang hijau|kacang ijo|burjo|es buah|es campur|es teler|cendol|dawet|doger|cincau|selasih|tebu|kopyor|coca|sprite|fanta|pepsi|pocari|teh|jus|susu|minuman|boba|matcha|yakult|cimory|wedang|bajigur|bandrek|sekoteng|jamu/i.test(clean)) {
    return 'Minuman';
  }

  // 3. Kopi / Coffee
  if (/kopi|coffee|kopsu|espresso|latte|cappuccino|americano|starbucks|sbux|tomoro|fore|kenangan/i.test(clean)) {
    return 'Coffee';
  }

  // 4. Makanan / Food
  if (/makan|nasi|ayam|mie|bakso|soto|sate|rawon|gule|bubur|martabak|gorengan|bakwan|tahu|tempe|seblak|cilok|cireng|batagor|siomay|warteg|burger|kfc|mcd|pizza|pasta|ramen|sushi|roti|kue|donat|snack|cemilan|telur dadar|telur goreng|telur ceplok/i.test(clean)) {
    return 'Food';
  }

  // 5. Supermarket
  if (/indomaret|alfamart|superindo|sembako|beras|gula|minyak goreng|deterjen|sabun cuci|supermarket|minimarket/i.test(clean)) {
    return 'Supermarket';
  }

  // 6. Fashion
  if (/baju|kaos|kemeja|jeans|jaket|hoodie|jas|rok|dress|gamis|hijab|jilbab|topi|sabuk|sepatu|sandal|pakaian|fashion/i.test(clean)) {
    return 'Fashion';
  }

  // 7. Skincare / Kosmetik / Perawatan
  if (/skincare|skin care|facewash|face wash|facial wash|facial foam|cleanser|micellar|toner|serum|moisturizer|mosturizer|pelembab|pelembap|sunscreen|sunblock|day cream|night cream|krim siang|krim malam|sheet mask|masker wajah|masker muka|lipstik|lipstick|lip balm|lip tint|bedak|cushion|foundation|concealer|parfum|perfume|deodorant|shampoo|sampo|sabun mandi|sabun cuci muka|body lotion|body wash|body scrub|retinol|niacinamide|salicylic|ceramide|hyaluronic|skintific|somethinc|originote|scarlett|wardah|avoskin|whitelab|azarine|kahf|cetaphil|cerave|cosrx|innisfree|laneige|nivea|vaseline|emina|glad2glow|facetology|npure|hanasui|implora|barenbliss|luxcrime/i.test(clean)) {
    return 'Skincare';
  }

  return rawCategory || 'Umum';
};

/**
 * Validasi apakah nama pengguna adalah teks manusia yang valid dan bersih
 */
export const isCleanUserName = (name) => {
  if (!name || typeof name !== 'string') return false;
  const trimmed = name.trim();
  if (trimmed.startsWith('enc:v1:')) return false;
  
  const alphaChars = trimmed.replace(/[^a-zA-Z]/g, '');
  if (alphaChars.length < 2) return false;

  const symbolCount = (trimmed.match(/[!@#$%^&*()_+=[\]{};':"\\|,.<>/?`~]/g) || []).length;
  if (symbolCount >= 2 && alphaChars.length < 4) return false;

  return true;
};

/**
 * Menyelesaikan NAMA ASLI PENGGUNA untuk Tabel Telemetry & Firestore Monitor
 */
export const resolveRealUserName = (rawName, deviceId = null, telemetryList = []) => {
  if (isCleanUserName(rawName)) {
    return rawName.trim();
  }

  if (typeof rawName === 'string' && rawName.startsWith('enc:v1:b64:')) {
    try {
      const decoded = decodeURIComponent(atob(rawName.slice(11)));
      if (isCleanUserName(decoded)) return decoded.trim();
    } catch {}
  }

  if (typeof rawName === 'string' && rawName.startsWith('enc:v1:')) {
    try {
      const decrypted = syncDecrypt(rawName);
      if (isCleanUserName(decrypted)) return decrypted.trim();
    } catch {}
  }

  if (deviceId && Array.isArray(telemetryList)) {
    const matched = telemetryList.find(t => t.id === deviceId);
    if (matched) {
      if (isCleanUserName(matched.userName)) {
        return matched.userName.trim();
      }
      if (matched.deviceName && typeof matched.deviceName === 'string') {
        const cleanDev = matched.deviceName.replace(/\s*•\s*Browser.*$/i, '').replace(/\s*\(Web\).*$/i, '').trim();
        if (cleanDev && !cleanDev.includes('Tidak Dikenal')) {
          return `User ${cleanDev}`;
        }
      }
    }
  }

  return 'Pengguna';
};

/**
 * Format nama pengguna menjadi kode simbol / angka enkripsi anonim KHUSUS untuk bagian AI Learning
 * Menjaga privasi finansial saat melihat catatan pengeluaran & evaluasi suara
 */
export const getAnonymizedUserCode = (rawName, deviceId = null) => {
  if (!rawName && !deviceId) return 'enc:v1:s1:00000000';
  
  if (typeof rawName === 'string' && rawName.startsWith('enc:v1:')) {
    return rawName;
  }

  const seed = (rawName || deviceId || 'user').trim();
  try {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = ((hash << 5) - hash) + seed.charCodeAt(i);
      hash |= 0;
    }
    const hex = Math.abs(hash).toString(16).toUpperCase().padStart(8, '0');
    const code = btoa(encodeURIComponent(seed.slice(0, 2) + hex)).replace(/=/g, '');
    return `enc:v1:s1:${code}`;
  } catch {
    return `enc:v1:s1:${seed.slice(0, 3)}#${deviceId ? deviceId.slice(-4) : '99'}`;
  }
};

export default function AdminDashboard({ onNavigateToApp }) {
  // Navigation Tab: 'telemetry' | 'insights'
  const [activeTab, setActiveTab] = useState('telemetry');

  // Telemetry state (TAB 1: Menggunakan NAMA ASLI)
  const [telemetryList, setTelemetryList] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // 'all' | 'online' | 'offline'
  const [telemetryPage, setTelemetryPage] = useState(1);
  const [telemetryPerPage, setTelemetryPerPage] = useState(8);
  const [isTelemetryPerPageOpen, setIsTelemetryPerPageOpen] = useState(false);
  const telemetryPerPageRef = useRef(null);

  // Insights state (TAB 2: Menggunakan KODE ANGKA/SIMBOL PRIVASI)
  const [learnedInsights, setLearnedInsights] = useState(() => getLearnedInsights());
  const [insightSearchQuery, setInsightSearchQuery] = useState('');
  const [insightUserFilter, setInsightUserFilter] = useState('all');
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const userDropdownRef = useRef(null);

  const [insightTypeFilter, setInsightTypeFilter] = useState('all'); // 'all' | 'deletion' | 'vocab'
  const [insightDateFilter, setInsightDateFilter] = useState('all'); // 'all' | 'today' | 'yesterday' | 'week'
  const [insightPage, setInsightPage] = useState(1);
  const [insightPerPage, setInsightPerPage] = useState(6);
  const [isInsightPerPageOpen, setIsInsightPerPageOpen] = useState(false);
  const insightPerPageRef = useRef(null);

  const [expandedInsights, setExpandedInsights] = useState({});

  // Feedback state (TAB 3: SARAN & KELUH KESAH PENGGUNA)
  const [feedbacks, setFeedbacks] = useState([]);
  const [feedbackSearchQuery, setFeedbackSearchQuery] = useState('');
  const [feedbackCategoryFilter, setFeedbackCategoryFilter] = useState('all'); // 'all' | 'Saran Fitur' | 'Keluh Kesah' | 'Masalah'
  const [feedbackStatusFilter, setFeedbackStatusFilter] = useState('all'); // 'all' | 'unread' | 'read'
  const [feedbackPage, setFeedbackPage] = useState(1);
  const [feedbackPerPage, setFeedbackPerPage] = useState(8);
  const [isFeedbackPerPageOpen, setIsFeedbackPerPageOpen] = useState(false);
  const feedbackPerPageRef = useRef(null);

  // Global loading & timer state
  const [isLoading, setIsLoading] = useState(true);
  const [isSpinning, setIsSpinning] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(REFRESH_INTERVAL_SECONDS);
  const [lastRefreshedAt, setLastRefreshedAt] = useState(new Date());

  // Close dropdowns on outside click
  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target)) {
        setIsUserDropdownOpen(false);
      }
      if (telemetryPerPageRef.current && !telemetryPerPageRef.current.contains(event.target)) {
        setIsTelemetryPerPageOpen(false);
      }
      if (insightPerPageRef.current && !insightPerPageRef.current.contains(event.target)) {
        setIsInsightPerPageOpen(false);
      }
      if (feedbackPerPageRef.current && !feedbackPerPageRef.current.contains(event.target)) {
        setIsFeedbackPerPageOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('touchstart', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
    };
  }, []);

  // Manual refresh trigger
  const fetchTelemetry = useCallback(async () => {
    if (isSpinning) return;
    setIsSpinning(true);
    try {
      await updateCurrentDeviceTelemetry();
      const data = await getTelemetryData();
      if (Array.isArray(data)) {
        setTelemetryList(data);
      }
      const insights = await fetchLearnedInsightsFromCloud();
      if (Array.isArray(insights)) {
        setLearnedInsights(insights);
      }
      setLastRefreshedAt(new Date());
      setSecondsRemaining(REFRESH_INTERVAL_SECONDS);
    } catch (e) {
      console.error('Refresh warning:', e);
    } finally {
      setTimeout(() => {
        setIsSpinning(false);
        setIsLoading(false);
      }, 500);
    }
  }, [isSpinning]);

  // Initial load & Firebase Realtime Subscription
  useEffect(() => {
    const splash = document.getElementById('app-splash-screen');
    if (splash && splash.parentNode) {
      splash.parentNode.removeChild(splash);
    }

    updateCurrentDeviceTelemetry();

    fetchLearnedInsightsFromCloud().then(data => {
      if (Array.isArray(data)) setLearnedInsights(data);
    });

    const unsubscribeTelemetry = subscribeToTelemetry((data) => {
      setTelemetryList(data);
      setLastRefreshedAt(new Date());
      setIsLoading(false);
    });

    const unsubscribeInsights = subscribeToLearnedInsights((data) => {
      setLearnedInsights(data);
    });

    const unsubscribeFeedbacks = subscribeToFeedbacks((data) => {
      setFeedbacks(data);
    });

    return () => {
      if (typeof unsubscribeTelemetry === 'function') unsubscribeTelemetry();
      if (typeof unsubscribeInsights === 'function') unsubscribeInsights();
      if (typeof unsubscribeFeedbacks === 'function') unsubscribeFeedbacks();
    };
  }, []);

  // Timer countdown and 20-minute auto refresh interval
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          fetchTelemetry();
          return REFRESH_INTERVAL_SECONDS;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [fetchTelemetry]);

  // Reset page when filters change
  useEffect(() => {
    setTelemetryPage(1);
  }, [searchQuery, filterStatus]);

  useEffect(() => {
    setInsightPage(1);
  }, [insightSearchQuery, insightUserFilter, insightTypeFilter, insightDateFilter]);

  // Format seconds to mm:ss
  const formatTimer = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Date and Time Formatter (Indonesian format)
  const formatDateTime = (rawVal) => {
    if (!rawVal) return { dateStr: '-', timeStr: '-', full: '-', dateObj: null };
    try {
      let date;
      if (typeof rawVal === 'number') {
        date = new Date(rawVal);
      } else if (rawVal && typeof rawVal === 'object' && typeof rawVal.toDate === 'function') {
        date = rawVal.toDate();
      } else if (rawVal && typeof rawVal === 'object' && rawVal.seconds) {
        date = new Date(rawVal.seconds * 1000);
      } else {
        date = new Date(rawVal);
      }

      if (isNaN(date.getTime())) {
        return { dateStr: '-', timeStr: '-', full: '-', dateObj: null };
      }

      const day = date.getDate().toString().padStart(2, '0');
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
      const month = months[date.getMonth()];
      const year = date.getFullYear();
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      const seconds = date.getSeconds().toString().padStart(2, '0');

      return {
        dateStr: `${day} ${month} ${year}`,
        timeStr: `${hours}:${minutes}:${seconds}`,
        full: `${day} ${month} ${year}, ${hours}:${minutes}:${seconds}`,
        dateObj: date
      };
    } catch {
      return { dateStr: '-', timeStr: '-', full: '-', dateObj: null };
    }
  };

  // Determine user active status (Online < 5m, Idle < 1h, Offline > 1h)
  const getDeviceStatus = (lastActiveIso) => {
    if (!lastActiveIso) return { status: 'offline', text: 'Offline' };
    const diffMs = Date.now() - new Date(lastActiveIso).getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (diffMinutes < 5) {
      return { status: 'online', text: 'Aktif (Online)' };
    } else if (diffMinutes < 60) {
      return { status: 'idle', text: `${diffMinutes}m lalu` };
    } else if (diffMinutes < 1440) {
      const hours = Math.floor(diffMinutes / 60);
      return { status: 'offline', text: `${hours}j lalu` };
    } else {
      const days = Math.floor(diffMinutes / 1440);
      return { status: 'offline', text: `${days}d lalu` };
    }
  };

  // Toggle card expansion
  const toggleExpandInsight = (id) => {
    setExpandedInsights(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // TAB 1: Filtered Telemetry List (MENGGUNAKAN NAMA ASLI PENGGUNA)
  const filteredTelemetryList = useMemo(() => {
    return telemetryList.filter((item) => {
      const realName = resolveRealUserName(item.userName, item.id, telemetryList).toLowerCase();
      const q = searchQuery.toLowerCase().trim();

      const matchesSearch = !q ||
        realName.includes(q) ||
        (item.deviceName || '').toLowerCase().includes(q) ||
        (item.id || '').toLowerCase().includes(q);

      const statusInfo = getDeviceStatus(item.lastActive);
      const matchesStatus = 
        filterStatus === 'all' ? true :
        filterStatus === 'online' ? (statusInfo.status === 'online' || statusInfo.status === 'idle') :
        (statusInfo.status === 'offline');

      return matchesSearch && matchesStatus;
    });
  }, [telemetryList, searchQuery, filterStatus]);

  // Paginated Telemetry List
  const paginatedTelemetry = useMemo(() => {
    if (telemetryPerPage === -1) return filteredTelemetryList;
    const start = (telemetryPage - 1) * telemetryPerPage;
    return filteredTelemetryList.slice(start, start + telemetryPerPage);
  }, [filteredTelemetryList, telemetryPage, telemetryPerPage]);

  const totalTelemetryPages = telemetryPerPage === -1 ? 1 : Math.ceil(filteredTelemetryList.length / telemetryPerPage) || 1;

  // TAB 2: Daftar Kode Anonim Pengguna (HANYA pengguna yang memiliki catatan pembelajaran AI)
  const anonymousUserCodes = useMemo(() => {
    const codes = new Set();
    
    // Hanya ambil pengguna yang benar-benar memiliki catatan di learnedInsights
    learnedInsights.forEach(item => {
      const code = getAnonymizedUserCode(item.userName, item.deviceId);
      if (code) codes.add(code);
    });

    return Array.from(codes);
  }, [learnedInsights]);

  // TAB 2: Filtered Insights List (MENGGUNAKAN KODE PRIVASI)
  const filteredInsights = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const startOfYesterday = startOfToday - (24 * 60 * 60 * 1000);
    const startOfWeek = startOfToday - (7 * 24 * 60 * 60 * 1000);

    return learnedInsights.filter(item => {
      const anonCode = getAnonymizedUserCode(item.userName, item.deviceId);
      const query = insightSearchQuery.toLowerCase().trim();

      const matchesSearch = !query || 
        anonCode.toLowerCase().includes(query) || 
        (item.deletedTx && item.deletedTx.toLowerCase().includes(query)) ||
        (item.vocabWord && item.vocabWord.toLowerCase().includes(query)) ||
        (item.category && item.category.toLowerCase().includes(query));

      const matchesDropdown = insightUserFilter === 'all' || anonCode === insightUserFilter;
      
      const isVocab = item.type === 'NEW_VOCAB' || (item.deletedTx && item.deletedTx.includes('[Kosakata Baru]'));
      const matchesType = 
        insightTypeFilter === 'all' ? true :
        insightTypeFilter === 'vocab' ? isVocab :
        !isVocab;

      let matchesDate = true;
      if (insightDateFilter !== 'all' && item.timestamp) {
        const itemTime = new Date(item.timestamp).getTime();
        if (insightDateFilter === 'today') {
          matchesDate = itemTime >= startOfToday;
        } else if (insightDateFilter === 'yesterday') {
          matchesDate = itemTime >= startOfYesterday && itemTime < startOfToday;
        } else if (insightDateFilter === 'week') {
          matchesDate = itemTime >= startOfWeek;
        }
      }

      return matchesSearch && matchesDropdown && matchesType && matchesDate;
    });
  }, [learnedInsights, insightSearchQuery, insightUserFilter, insightTypeFilter, insightDateFilter]);

  // Paginated Insights List
  const paginatedInsights = useMemo(() => {
    if (insightPerPage === -1) return filteredInsights;
    const start = (insightPage - 1) * insightPerPage;
    return filteredInsights.slice(start, start + insightPerPage);
  }, [filteredInsights, insightPage, insightPerPage]);

  const totalInsightPages = insightPerPage === -1 
    ? 1 
    : Math.ceil(filteredInsights.length / insightPerPage) || 1;

  // Feedbacks memoized filtering
  const filteredFeedbacks = useMemo(() => {
    return feedbacks.filter((fb) => {
      // 1. Search Query
      if (feedbackSearchQuery.trim()) {
        const query = feedbackSearchQuery.toLowerCase().trim();
        const msg = (fb.message || '').toLowerCase();
        const user = (fb.userName || '').toLowerCase();
        const dev = (fb.deviceId || '').toLowerCase();
        if (!msg.includes(query) && !user.includes(query) && !dev.includes(query)) {
          return false;
        }
      }

      // 2. Category Filter
      if (feedbackCategoryFilter !== 'all') {
        if (fb.category !== feedbackCategoryFilter) return false;
      }

      // 3. Status Filter
      if (feedbackStatusFilter !== 'all') {
        if (fb.status !== feedbackStatusFilter) return false;
      }

      return true;
    });
  }, [feedbacks, feedbackSearchQuery, feedbackCategoryFilter, feedbackStatusFilter]);

  const totalFeedbackPages = feedbackPerPage === -1 
    ? 1 
    : Math.ceil(filteredFeedbacks.length / feedbackPerPage) || 1;

  const paginatedFeedbacks = useMemo(() => {
    if (feedbackPerPage === -1) return filteredFeedbacks;
    const start = (feedbackPage - 1) * feedbackPerPage;
    return filteredFeedbacks.slice(start, start + feedbackPerPage);
  }, [filteredFeedbacks, feedbackPage, feedbackPerPage]);

  // Counts for Badges
  const totalUsers = telemetryList.length;
  const activeDevices = telemetryList.filter(item => getDeviceStatus(item.lastActive).status !== 'offline').length;
  const totalTransactions = telemetryList.reduce((acc, curr) => acc + (curr.totalTransactions || 0), 0);
  const deletionCount = learnedInsights.filter(item => !(item.type === 'NEW_VOCAB' || (item.deletedTx && item.deletedTx.includes('[Kosakata Baru]')))).length;
  const vocabCount = learnedInsights.filter(item => item.type === 'NEW_VOCAB' || (item.deletedTx && item.deletedTx.includes('[Kosakata Baru]'))).length;
  
  const feedbackIdeaCount = feedbacks.filter(f => f.category === 'Saran Fitur' || f.category?.includes('Saran')).length;
  const feedbackGripeCount = feedbacks.filter(f => f.category === 'Keluh Kesah' || f.category?.includes('Keluh')).length;
  const feedbackBugCount = feedbacks.filter(f => f.category === 'Masalah' || f.category?.includes('Masalah') || f.category?.includes('Bug')).length;

  // Selected User Label for Custom Dropdown Button di Tab 2 (Format Angka/Simbol)
  const selectedUserDisplayLabel = useMemo(() => {
    if (insightUserFilter === 'all') {
      return `Semua Pengguna (${anonymousUserCodes.length})`;
    }
    return `User: ${insightUserFilter}`;
  }, [insightUserFilter, anonymousUserCodes]);

  useEffect(() => {
    document.title = 'Cassiel Command - Admin Web Monitor';
  }, []);

  return (
    <div className="admin-wrapper">
      <div className="admin-container">
        
        {/* Admin Header */}
        <header className="admin-header">
          <div className="admin-header-title">
            <div className="admin-logo-icon">
              <ShieldCheck size={26} />
            </div>
            <div className="admin-header-text">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h1>Cassiel Command</h1>
                <a 
                  href={FIREBASE_CONSOLE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="admin-badge admin-badge-btn"
                  title="Buka Database Firestore di Firebase Console"
                >
                  <Flame size={13} color="#FF5722" />
                  <span>FIREBASE CLOUD</span>
                  <ExternalLink size={11} className="admin-badge-ext-icon" />
                </a>
              </div>
              <p>Pusat Komando & Pemantauan Perangkat Pengguna Real-Time • Diperbarui: {lastRefreshedAt ? lastRefreshedAt.toLocaleTimeString('id-ID') : '-'}</p>
            </div>
          </div>

          <div className="admin-header-actions">
            <button 
              className={`btn-refresh ${isSpinning ? 'spinning' : ''}`}
              onClick={fetchTelemetry}
              title="Refresh data pemantauan sekarang"
            >
              <RefreshCw size={16} className="icon-spin" />
              <span>Refresh Sekarang</span>
            </button>

            {onNavigateToApp && (
              <button 
                className="btn-back-app"
                onClick={onNavigateToApp}
                title="Kembali ke Aplikasi Utama Finance Tracker"
              >
                <ArrowLeft size={16} />
                <span>Ke Apps Utama</span>
              </button>
            )}
          </div>
        </header>

        {/* Top Metric Cards */}
        <section className="admin-stats-grid">
          <div className="admin-stat-card">
            <div className="stat-icon-wrapper stat-icon-users">
              <Users size={24} />
            </div>
            <div className="stat-info">
              <span>TOTAL PENGGUNA REAL-TIME</span>
              <h3>{totalUsers} <small style={{ fontSize: '13px', fontWeight: 500, color: '#6B7280' }}>user</small></h3>
              <p className="stat-subtext">Perangkat terdaftar di Firebase</p>
            </div>
          </div>

          <div className="admin-stat-card">
            <div className="stat-icon-wrapper stat-icon-active">
              <Activity size={24} />
            </div>
            <div className="stat-info">
              <span>PERANGKAT AKTIF</span>
              <h3>{activeDevices} <small style={{ fontSize: '13px', fontWeight: 500, color: '#10B981' }}>online</small></h3>
              <p className="stat-subtext">Aktif dalam 1 jam terakhir</p>
            </div>
          </div>

          <div className="admin-stat-card">
            <div className="stat-icon-wrapper stat-icon-tx">
              <HardDrive size={24} />
            </div>
            <div className="stat-info">
              <span>TOTAL TRANSAKSI</span>
              <h3>{totalTransactions.toLocaleString('id-ID')} <small style={{ fontSize: '13px', fontWeight: 500, color: '#6B7280' }}>transaksi</small></h3>
              <p className="stat-subtext">Total seluruh user tersimpan</p>
            </div>
          </div>

          <div className="admin-stat-card">
            <div className="stat-icon-wrapper stat-icon-timer">
              <Clock size={24} />
            </div>
            <div className="stat-info">
              <span>REFRESH OTOMATIS</span>
              <h3>{formatTimer(secondsRemaining)}</h3>
              <p className="stat-subtext">Setiap 20 menit sekali</p>
            </div>
          </div>
        </section>

        {/* Segmented View Navigation Tabs */}
        <div className="admin-view-tabs-container">
          <div className="admin-view-tabs">
            <button 
              className={`view-tab-btn ${activeTab === 'telemetry' ? 'active' : ''}`}
              onClick={() => setActiveTab('telemetry')}
            >
              <Smartphone size={18} />
              <span>Pemantauan Perangkat</span>
              <span className="tab-badge-count">{totalUsers}</span>
            </button>
            <button 
              className={`view-tab-btn ${activeTab === 'insights' ? 'active' : ''}`}
              onClick={() => setActiveTab('insights')}
            >
              <Sparkles size={18} />
              <span>AI Learning & Kosakata</span>
              <span className="tab-badge-count highlight">{learnedInsights.length}</span>
            </button>
            <button 
              className={`view-tab-btn ${activeTab === 'feedback' ? 'active' : ''}`}
              onClick={() => setActiveTab('feedback')}
            >
              <MessageSquare size={18} />
              <span>Saran & Keluh Kesah</span>
              <span className="tab-badge-count feedback-count">{feedbacks.length}</span>
            </button>
          </div>
        </div>

        {/* TAB 1: PEMANTAUAN PENGGUNA & PERANGKAT (MENGGUNAKAN NAMA ASLI PENGGUNA) */}
        {activeTab === 'telemetry' && (
          <div className="tab-pane-content">
            {/* Monitoring Control & Filters */}
            <section className="admin-controls-card">
              <div className="controls-row">
                <div className="search-box">
                  <Search size={18} color="#9CA3AF" />
                  <input 
                    type="text" 
                    placeholder="Cari nama user, tipe HP, atau Device ID..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  {searchQuery && (
                    <button 
                      className="clear-search-btn" 
                      onClick={() => setSearchQuery('')}
                      title="Hapus pencarian"
                    >
                      ✕
                    </button>
                  )}
                </div>

                <div className="status-filters">
                  <button 
                    className={`filter-pill ${filterStatus === 'all' ? 'active' : ''}`}
                    onClick={() => setFilterStatus('all')}
                  >
                    Semua ({totalUsers})
                  </button>
                  <button 
                    className={`filter-pill ${filterStatus === 'online' ? 'active' : ''}`}
                    onClick={() => setFilterStatus('online')}
                  >
                    <span className="dot dot-online"></span> Online ({activeDevices})
                  </button>
                  <button 
                    className={`filter-pill ${filterStatus === 'offline' ? 'active' : ''}`}
                    onClick={() => setFilterStatus('offline')}
                  >
                    <span className="dot dot-offline"></span> Offline ({totalUsers - activeDevices})
                  </button>
                </div>
              </div>
            </section>

            {/* Real-time Telemetry Table */}
            <section className="admin-card">
              <div className="table-header-row">
                <h2 className="admin-section-title">
                  <Smartphone size={20} color="#10B981" />
                  Tabel Pemantauan Pengguna Aktif
                </h2>
                <span className="table-counter-badge">
                  Menampilkan {paginatedTelemetry.length} dari {filteredTelemetryList.length} perangkat
                </span>
              </div>

              {isLoading ? (
                <div className="loading-state">
                  <div className="spinner"></div>
                  <p>Menghubungkan ke Firebase Cloud Realtime...</p>
                </div>
              ) : filteredTelemetryList.length === 0 ? (
                <div className="empty-telemetry">
                  <AlertCircle size={40} color="#9CA3AF" />
                  <h3>Belum ada data perangkat yang cocok</h3>
                  <p>Pastikan aplikasi dibuka pada HP atau ubah kata kunci pencarian Anda.</p>
                </div>
              ) : (
                <div className="admin-table-container">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>PENGGUNA</th>
                        <th>DEVICE</th>
                        <th>METODE INPUT</th>
                        <th>VERSI</th>
                        <th>TGL & JAM INSTAL</th>
                        <th>TERAKHIR AKTIF</th>
                        <th>TRANSAKSI</th>
                        <th>STATUS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedTelemetry.map((item) => {
                        const installDt = formatDateTime(item.installDate || item.installedAt || item.installedDate || item.createdAt);
                        const lastActiveDt = formatDateTime(item.lastActive || item.updatedAt);
                        const statusInfo = getDeviceStatus(item.lastActive || item.updatedAt);
                        // NAMA ASLI PENGGUNA (Amura, Redi, Dina, Gracia, Susan, dll.)
                        const realName = resolveRealUserName(item.userName, item.id, telemetryList);
                        const avatarLetter = (realName || 'U').charAt(0).toUpperCase();

                        const voiceCount = item.voiceTxCount ?? 0;
                        const manualCount = item.manualTxCount ?? (item.totalTransactions ? Math.max(0, item.totalTransactions - voiceCount) : 0);

                        return (
                          <tr key={item.id} className="telemetry-row">
                            {/* Nama Pengguna Asli & Jelas */}
                            <td>
                              <div className="user-profile-cell">
                                <div className="user-avatar-circle">
                                  {avatarLetter}
                                </div>
                                <div className="user-meta">
                                  <span className="user-name-text">{realName}</span>
                                  <span className="user-device-id" title={item.id}>
                                    ID: {item.id ? item.id.substring(0, 14) : '-'}...
                                  </span>
                                </div>
                              </div>
                            </td>

                            {/* Nama Device */}
                            <td>
                              <div className="device-badge">
                                <Smartphone size={14} color="#4B5563" />
                                <span>{item.deviceName || 'Perangkat Tidak Dikenal'}</span>
                              </div>
                            </td>

                            {/* Metode Input: Mic vs Manual */}
                            <td>
                              <div className="input-method-badge-group">
                                <span className="input-method-badge mic-badge" title={`${voiceCount} transaksi via Voice Mic`}>
                                  🎙️ Mic: <b>{voiceCount}</b>
                                </span>
                                <span className="input-method-badge manual-badge" title={`${manualCount} transaksi via Nulis Manual`}>
                                  ✍️ Manual: <b>{manualCount}</b>
                                </span>
                              </div>
                            </td>

                            {/* Versi Aplikasi */}
                            <td>
                              <span className="version-badge">
                                v{item.appVersion || item.version || '1.0.0'}
                              </span>
                            </td>

                            {/* Tgl & Jam Instal */}
                            <td>
                              <div className="datetime-primary">{installDt.dateStr}</div>
                              <div className="datetime-sub">🕒 {installDt.timeStr}</div>
                            </td>

                            {/* Tgl & Jam Terakhir AKTIF */}
                            <td>
                              <div className="datetime-primary">{lastActiveDt.dateStr}</div>
                              <div className="datetime-sub">🕒 {lastActiveDt.timeStr}</div>
                            </td>

                            {/* Jumlah Transaksi per User */}
                            <td>
                              <div className="tx-count-cell">
                                <span className="tx-count-badge">{item.totalTransactions ?? 0}</span>
                                <span className="tx-count-label">transaksi</span>
                              </div>
                            </td>

                            {/* Status Online/Idle/Offline */}
                            <td>
                              <span className={`status-pill status-${statusInfo.status}`}>
                                <span className="status-dot"></span>
                                {statusInfo.text}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Telemetry Pagination Bar dengan Custom Dropdown */}
              {filteredTelemetryList.length > 0 && (
                <div className="admin-pagination-bar">
                  <div className="pagination-per-page">
                    <span>Tampilkan:</span>
                    <div className="custom-dropdown-container" ref={telemetryPerPageRef}>
                      <button 
                        className="custom-dropdown-trigger compact-trigger"
                        onClick={() => setIsTelemetryPerPageOpen(!isTelemetryPerPageOpen)}
                      >
                        <span>{telemetryPerPage === -1 ? `Semua (${filteredTelemetryList.length})` : `${telemetryPerPage} baris`}</span>
                        <ChevronDown size={14} className={`dropdown-arrow ${isTelemetryPerPageOpen ? 'open' : ''}`} />
                      </button>

                      {isTelemetryPerPageOpen && (
                        <div className="custom-dropdown-menu compact-menu">
                          {[
                            { value: 8, label: '8 baris' },
                            { value: 16, label: '16 baris' },
                            { value: 32, label: '32 baris' },
                            { value: -1, label: `Semua (${filteredTelemetryList.length})` }
                          ].map(opt => (
                            <button
                              key={opt.value}
                              className={`custom-dropdown-option ${telemetryPerPage === opt.value ? 'selected' : ''}`}
                              onClick={() => {
                                setTelemetryPerPage(opt.value);
                                setIsTelemetryPerPageOpen(false);
                              }}
                            >
                              <span>{opt.label}</span>
                              {telemetryPerPage === opt.value && <Check size={14} color="#10B981" />}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pagination-controls">
                    <button 
                      className="btn-page-nav"
                      disabled={telemetryPage <= 1}
                      onClick={() => setTelemetryPage(prev => Math.max(1, prev - 1))}
                    >
                      <ChevronLeft size={16} />
                      <span>Sebelumnya</span>
                    </button>

                    <div className="pagination-page-indicator">
                      Halaman <b>{telemetryPage}</b> dari <b>{totalTelemetryPages}</b>
                    </div>

                    <button 
                      className="btn-page-nav"
                      disabled={telemetryPage >= totalTelemetryPages}
                      onClick={() => setTelemetryPage(prev => Math.min(totalTelemetryPages, prev + 1))}
                    >
                      <span>Berikutnya</span>
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              )}

              {/* Auto Refresh Footer Banner */}
              <div className="auto-refresh-banner">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle size={16} />
                  <span>Koneksi <b>Firebase Firestore Real-time Live</b> aktif. Auto refresh otomatis setiap <b>20 menit sekali</b>.</span>
                </div>
                <div className="refresh-timer-badge">
                  <Clock size={13} />
                  <span>Refresh berikutnya: {formatTimer(secondsRemaining)}</span>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* TAB 2: AI VOICE & BEHAVIORAL LEARNING (MENGGUNAKAN KODE ANGKA/SIMBOL PRIVASI & DROPDOWN SIMBOL) */}
        {activeTab === 'insights' && (
          <div className="tab-pane-content">
            <section className="admin-card learned-insights-section">
              <div className="table-header-row">
                <div className="section-title-group">
                  <h2 className="admin-section-title">
                    <Sparkles size={20} color="#F59E0B" />
                    Hal yang Dipelajari & Evaluasi Suara
                  </h2>
                  <p className="learned-section-desc" style={{ margin: '4px 0 0 0' }}>
                    Evaluasi penghapusan transaksi dan penemuan kosakata baru secara otomatis (Mode Privasi Anonim).
                  </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  <span className="insights-count-badge">
                    <Brain size={14} />
                    {filteredInsights.length} Catatan
                  </span>
                  {learnedInsights.length > 0 && (
                    <button
                      className="btn-clear-all-log"
                      title="Hapus semua log pembelajaran dari Firebase Cloud"
                      onClick={async () => {
                        if (window.confirm('Hapus semua catatan pembelajaran dari Firebase Cloud? Tindakan ini tidak dapat dibatalkan.')) {
                          await clearLearnedInsights();
                          setLearnedInsights([]);
                        }
                      }}
                    >
                      <Trash2 size={14} />
                      <span>Bersihkan Log</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Bilah Filter Komprehensif dengan Custom User Dropdown (Berisi Kode Angka/Simbol Sesuai Keinginan User) */}
              <div className="insights-filter-toolbar">
                <div className="search-box">
                  <Search size={16} color="#9CA3AF" />
                  <input
                    type="text"
                    placeholder="Cari kata, transaksi, kode user..."
                    value={insightSearchQuery}
                    onChange={(e) => setInsightSearchQuery(e.target.value)}
                  />
                  {insightSearchQuery && (
                    <button 
                      className="clear-search-btn" 
                      onClick={() => setInsightSearchQuery('')}
                      title="Hapus pencarian"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* CUSTOM USER DROPDOWN (BERISI KODE ANGKA/SIMBOL PRIVASI SEPERTI SEBELUMNYA) */}
                <div className="custom-dropdown-container" ref={userDropdownRef}>
                  <button 
                    className="custom-dropdown-trigger user-filter-trigger"
                    onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                  >
                    <Users size={16} color="#10B981" />
                    <span className="trigger-label-text font-mono-code">{selectedUserDisplayLabel}</span>
                    <ChevronDown size={15} className={`dropdown-arrow ${isUserDropdownOpen ? 'open' : ''}`} />
                  </button>

                  {isUserDropdownOpen && (
                    <div className="custom-dropdown-menu user-dropdown-menu">
                      <div className="dropdown-menu-header">
                        <span>Pilih Pengguna ({anonymousUserCodes.length})</span>
                      </div>
                      <div className="dropdown-options-scrollable">
                        <button
                          className={`custom-dropdown-option user-option-item ${insightUserFilter === 'all' ? 'selected' : ''}`}
                          onClick={() => {
                            setInsightUserFilter('all');
                            setIsUserDropdownOpen(false);
                          }}
                        >
                          <div className="option-avatar-circle all-users-avatar">
                            <Users size={14} />
                          </div>
                          <div className="option-text-group">
                            <span className="option-name-primary">Semua Pengguna</span>
                            <span className="option-name-sub">Tampilkan seluruh catatan</span>
                          </div>
                          {insightUserFilter === 'all' && <Check size={16} color="#10B981" />}
                        </button>

                        <div className="dropdown-divider"></div>

                        {anonymousUserCodes.map(code => {
                          const initialChar = (code.replace(/enc:v1:s1:/, '').charAt(0) || '#').toUpperCase();
                          const isSelected = insightUserFilter === code;

                          return (
                            <button
                              key={code}
                              className={`custom-dropdown-option user-option-item ${isSelected ? 'selected' : ''}`}
                              onClick={() => {
                                setInsightUserFilter(code);
                                setIsUserDropdownOpen(false);
                              }}
                            >
                              <div className="option-avatar-circle">
                                {initialChar}
                              </div>
                              <div className="option-text-group">
                                <span className="option-name-primary font-mono-code" title={code}>
                                  User: {code.length > 22 ? `${code.substring(0, 20)}...` : code}
                                </span>
                              </div>
                              {isSelected && <Check size={16} color="#10B981" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Filter Tipe Catatan */}
                <div className="insight-type-pills">
                  <button 
                    className={`type-pill ${insightTypeFilter === 'all' ? 'active' : ''}`}
                    onClick={() => setInsightTypeFilter('all')}
                  >
                    Semua ({learnedInsights.length})
                  </button>
                  <button 
                    className={`type-pill ${insightTypeFilter === 'vocab' ? 'active' : ''}`}
                    onClick={() => setInsightTypeFilter('vocab')}
                  >
                    ✨ Kosakata ({vocabCount})
                  </button>
                  <button 
                    className={`type-pill ${insightTypeFilter === 'deletion' ? 'active' : ''}`}
                    onClick={() => setInsightTypeFilter('deletion')}
                  >
                    🗑️ Dihapus ({deletionCount})
                  </button>
                </div>

                {/* Filter Tanggal */}
                <div className="insight-date-pills">
                  <button 
                    className={`date-pill ${insightDateFilter === 'all' ? 'active' : ''}`}
                    onClick={() => setInsightDateFilter('all')}
                  >
                    Semua Waktu
                  </button>
                  <button 
                    className={`date-pill ${insightDateFilter === 'today' ? 'active' : ''}`}
                    onClick={() => setInsightDateFilter('today')}
                  >
                    Hari Ini
                  </button>
                  <button 
                    className={`date-pill ${insightDateFilter === 'yesterday' ? 'active' : ''}`}
                    onClick={() => setInsightDateFilter('yesterday')}
                  >
                    Kemarin
                  </button>
                  <button 
                    className={`date-pill ${insightDateFilter === 'week' ? 'active' : ''}`}
                    onClick={() => setInsightDateFilter('week')}
                  >
                    7 Hari Terakhir
                  </button>
                </div>
              </div>

              {/* Grid 2-Kolom Responsive untuk Kartu Pembelajaran */}
              <div className="insights-grid-layout">
                {filteredInsights.length === 0 ? (
                  <div className="empty-insights-full">
                    <Lightbulb size={36} color="#9CA3AF" />
                    <h3>Tidak ada catatan pembelajaran yang cocok</h3>
                    <p>Coba ubah kata kunci pencarian, filter pengguna, atau filter tipe.</p>
                  </div>
                ) : (
                  paginatedInsights.map((item, idx) => {
                    const itemDt = item.timestamp ? formatDateTime(item.timestamp) : null;
                    const anonCode = getAnonymizedUserCode(item.userName, item.deviceId);
                    const initialChar = (anonCode.replace(/enc:v1:s1:/, '').charAt(0) || '6').toUpperCase();
                    const isNewVocab = item.type === 'NEW_VOCAB' || (item.deletedTx && item.deletedTx.includes('[Kosakata Baru]'));
                    const isExpanded = !!expandedInsights[item.id || idx];

                    const handleDeleteThisItem = async (e) => {
                      e.stopPropagation();
                      if (window.confirm(`Hapus catatan ini dari database Firebase?`)) {
                        await deleteSingleLearnedInsight(item.id);
                        setLearnedInsights(prev => prev.filter(p => p.id !== item.id));
                      }
                    };

                    // Format Kosakata Baru
                    if (isNewVocab) {
                      let displayVocabWord = item.vocabWord;
                      if (!displayVocabWord && item.deletedTx) {
                        const match = item.deletedTx.match(/"([^"]+)"/);
                        displayVocabWord = match ? match[1] : item.deletedTx.replace(/✨\s*\[Kosakata Baru\]\s*/i, '');
                      }
                      displayVocabWord = displayVocabWord || item.title || 'Kata Baru';

                      return (
                        <div className="insight-modern-card vocab-card" key={item.id || idx}>
                          {/* Header Bar dengan Kode Simbol Anonim */}
                          <div className="insight-card-header">
                            <div className="insight-user-pill">
                              <div className="insight-user-avatar vocab-avatar">{initialChar}</div>
                              <div className="insight-user-info">
                                <span className="insight-user-name font-mono-code" title={anonCode}>
                                  {anonCode.length > 20 ? `${anonCode.substring(0, 16)}...` : anonCode}
                                </span>
                                <span className="vocab-badge-pill">✨ Kosakata Baru</span>
                              </div>
                            </div>
                            <div className="insight-card-actions">
                              {itemDt && (
                                <span className="insight-time-badge">🕒 {itemDt.timeStr}</span>
                              )}
                              <button 
                                className="btn-item-trash"
                                title="Hapus catatan ini"
                                onClick={handleDeleteThisItem}
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>

                          {/* Body Content */}
                          <div className="insight-card-body">
                            <div className="insight-vocab-main">
                              <span className="vocab-word-large">"{displayVocabWord}"</span>
                              {getSensibleVocabCategory(displayVocabWord, item.category) && (
                                <span className="vocab-category-tag">
                                  <Tag size={12} /> {getSensibleVocabCategory(displayVocabWord, item.category)}
                                </span>
                              )}
                            </div>

                            {itemDt && (
                              <div className="insight-date-row">
                                <Calendar size={12} /> <span>Tercatat: {itemDt.dateStr}</span>
                              </div>
                            )}

                            {item.learningPoint && !item.learningPoint.includes('Daftarkan mapping') && (
                              <div className="insight-detail-row learning-row vocab-learning-row">
                                <span className="insight-label">💡 Keterangan:</span>
                                <span className="insight-value learning-highlight">{item.learningPoint}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    }

                    // Format Transaksi yang Dihapus dengan Kode Simbol Anonim
                    return (
                      <div className={`insight-modern-card deletion-card ${isExpanded ? 'expanded' : ''}`} key={item.id || idx}>
                        {/* Header Bar dengan Kode Simbol Anonim */}
                        <div className="insight-card-header" onClick={() => toggleExpandInsight(item.id || idx)}>
                          <div className="insight-user-pill">
                            <div className="insight-user-avatar">{initialChar}</div>
                            <div className="insight-user-info">
                              <span className="insight-user-name font-mono-code" title={anonCode}>
                                {anonCode.length > 20 ? `${anonCode.substring(0, 16)}...` : anonCode}
                              </span>
                              <span className="deletion-badge-pill">🗑️ Transaksi Dihapus</span>
                            </div>
                          </div>
                          <div className="insight-card-actions">
                            {itemDt && (
                              <span className="insight-time-badge">🕒 {itemDt.timeStr}</span>
                            )}
                            <button 
                              className="btn-item-trash"
                              title="Hapus catatan ini"
                              onClick={handleDeleteThisItem}
                            >
                              <Trash2 size={14} />
                            </button>
                            <button 
                              className="btn-item-expand"
                              title={isExpanded ? "Tutup detail" : "Lihat detail"}
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleExpandInsight(item.id || idx);
                              }}
                            >
                              {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </button>
                          </div>
                        </div>

                        {/* Body Content */}
                        <div className="insight-card-body">
                          <div className="insight-detail-row">
                            <span className="insight-label">🗑️ Transaksi:</span>
                            <span className="insight-value deleted-highlight">{item.deletedTx || item.title}</span>
                          </div>

                          {itemDt && (
                            <div className="insight-date-row">
                              <Calendar size={12} /> <span>Tercatat: {itemDt.dateStr}</span>
                            </div>
                          )}

                          {/* Detail yang bisa di-expand atau langsung tampil ringkas */}
                          {(isExpanded || (item.reason && item.reason.length < 60)) && (
                            <div className="insight-detail-row">
                              <span className="insight-label">❓ Kemungkinan Alasan:</span>
                              <span className="insight-value">{item.reason || item.description || '-'}</span>
                            </div>
                          )}

                          <div className="insight-detail-row learning-row">
                            <span className="insight-label">💡 Poin Evaluasi:</span>
                            <span className="insight-value learning-highlight">{item.learningPoint || item.evaluation}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Insights Pagination Bar dengan Custom Dropdown */}
              {filteredInsights.length > 0 && (
                <div className="admin-pagination-bar">
                  <div className="pagination-per-page">
                    <span>Tampilkan:</span>
                    <div className="custom-dropdown-container" ref={insightPerPageRef}>
                      <button 
                        className="custom-dropdown-trigger compact-trigger"
                        onClick={() => setIsInsightPerPageOpen(!isInsightPerPageOpen)}
                      >
                        <span>{insightPerPage === -1 ? `Semua (${filteredInsights.length})` : `${insightPerPage} per halaman`}</span>
                        <ChevronDown size={14} className={`dropdown-arrow ${isInsightPerPageOpen ? 'open' : ''}`} />
                      </button>

                      {isInsightPerPageOpen && (
                        <div className="custom-dropdown-menu compact-menu">
                          {[
                            { value: 6, label: '6 per halaman' },
                            { value: 12, label: '12 per halaman' },
                            { value: 24, label: '24 per halaman' },
                            { value: -1, label: `Semua (${filteredInsights.length})` }
                          ].map(opt => (
                            <button
                              key={opt.value}
                              className={`custom-dropdown-option ${insightPerPage === opt.value ? 'selected' : ''}`}
                              onClick={() => {
                                setInsightPerPage(opt.value);
                                setIsInsightPerPageOpen(false);
                              }}
                            >
                              <span>{opt.label}</span>
                              {insightPerPage === opt.value && <Check size={14} color="#10B981" />}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pagination-controls">
                    <button 
                      className="btn-page-nav"
                      disabled={insightPage <= 1}
                      onClick={() => setInsightPage(prev => Math.max(1, prev - 1))}
                    >
                      <ChevronLeft size={16} />
                      <span>Sebelumnya</span>
                    </button>

                    <div className="pagination-page-indicator">
                      Halaman <b>{insightPage}</b> dari <b>{totalInsightPages}</b>
                    </div>

                    <button 
                      className="btn-page-nav"
                      disabled={insightPage >= totalInsightPages}
                      onClick={() => setInsightPage(prev => Math.min(totalInsightPages, prev + 1))}
                    >
                      <span>Berikutnya</span>
                      <ChevronRight size={16} />
                    </button>
                    </div>
                  </div>
                )}
              </section>
            </div>
          )}

        {/* TAB 3: SARAN & KELUH KESAH PENGGUNA */}
        {activeTab === 'feedback' && (
          <div className="tab-pane-content">
            {/* Feedback Controls & Search */}
            <section className="admin-controls-card">
              <div className="controls-row">
                <div className="search-box">
                  <Search size={18} color="#9CA3AF" />
                  <input 
                    type="text" 
                    placeholder="Cari pesan saran, keluh kesah, atau nama pengguna..." 
                    value={feedbackSearchQuery}
                    onChange={(e) => setFeedbackSearchQuery(e.target.value)}
                  />
                  {feedbackSearchQuery && (
                    <button 
                      className="btn-clear-search" 
                      onClick={() => setFeedbackSearchQuery('')}
                      title="Hapus pencarian"
                    >
                      ×
                    </button>
                  )}
                </div>

                <div className="filter-group">
                  <span className="filter-label">Kategori:</span>
                  <div className="filter-buttons">
                    <button 
                      className={`btn-filter ${feedbackCategoryFilter === 'all' ? 'active' : ''}`}
                      onClick={() => { setFeedbackCategoryFilter('all'); setFeedbackPage(1); }}
                    >
                      Semua ({feedbacks.length})
                    </button>
                    <button 
                      className={`btn-filter ${feedbackCategoryFilter === 'Saran Fitur' ? 'active' : ''}`}
                      onClick={() => { setFeedbackCategoryFilter('Saran Fitur'); setFeedbackPage(1); }}
                    >
                      💡 Saran ({feedbackIdeaCount})
                    </button>
                    <button 
                      className={`btn-filter ${feedbackCategoryFilter === 'Keluh Kesah' ? 'active' : ''}`}
                      onClick={() => { setFeedbackCategoryFilter('Keluh Kesah'); setFeedbackPage(1); }}
                    >
                      💬 Keluh Kesah ({feedbackGripeCount})
                    </button>
                    <button 
                      className={`btn-filter ${feedbackCategoryFilter === 'Masalah' ? 'active' : ''}`}
                      onClick={() => { setFeedbackCategoryFilter('Masalah'); setFeedbackPage(1); }}
                    >
                      ⚠️ Bug ({feedbackBugCount})
                    </button>
                  </div>
                </div>

                <div className="filter-group">
                  <span className="filter-label">Status:</span>
                  <div className="filter-buttons">
                    <button 
                      className={`btn-filter ${feedbackStatusFilter === 'all' ? 'active' : ''}`}
                      onClick={() => { setFeedbackStatusFilter('all'); setFeedbackPage(1); }}
                    >
                      Semua
                    </button>
                    <button 
                      className={`btn-filter ${feedbackStatusFilter === 'unread' ? 'active' : ''}`}
                      onClick={() => { setFeedbackStatusFilter('unread'); setFeedbackPage(1); }}
                    >
                      Belum Dibaca
                    </button>
                    <button 
                      className={`btn-filter ${feedbackStatusFilter === 'read' ? 'active' : ''}`}
                      onClick={() => { setFeedbackStatusFilter('read'); setFeedbackPage(1); }}
                    >
                      Sudah Dibaca
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* Feedback Cards List */}
            <section className="feedbacks-display-section">
              {filteredFeedbacks.length === 0 ? (
                <div className="empty-state-card">
                  <MessageSquare size={48} color="#D1D5DB" />
                  <h3>Belum Ada Saran atau Keluh Kesah</h3>
                  <p>
                    {feedbackSearchQuery || feedbackCategoryFilter !== 'all' || feedbackStatusFilter !== 'all'
                      ? 'Tidak ada masukan yang sesuai dengan filter pencarian.'
                      : 'Masukan dan keluh kesah dari pengguna yang dikirim via menu Profil akan muncul di sini secara real-time.'}
                  </p>
                </div>
              ) : (
                <div className="feedback-cards-grid">
                  {paginatedFeedbacks.map((item) => (
                    <div 
                      key={item.id} 
                      className={`admin-feedback-card ${item.status === 'unread' ? 'unread-feedback' : ''}`}
                    >
                      <div className="feedback-card-header">
                        <div className="feedback-card-badges">
                          <span className={`feedback-cat-tag cat-${(item.category || 'saran').toLowerCase().replace(/[^a-z]/g, '')}`}>
                            {item.category || 'Saran Fitur'}
                          </span>
                          {item.status === 'unread' && (
                            <span className="feedback-unread-badge">Baru</span>
                          )}
                        </div>
                        <div className="feedback-card-time">
                          <Clock size={12} />
                          <span>{item.createdAt ? new Date(item.createdAt).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) : 'Baru saja'}</span>
                        </div>
                      </div>

                      <div className="feedback-card-body">
                        <p className="feedback-message-text">{item.message}</p>
                      </div>

                      <div className="feedback-card-footer">
                        <div className="feedback-user-meta">
                          <div className="feedback-user-avatar">
                            {(item.userName || 'P').charAt(0).toUpperCase()}
                          </div>
                          <div className="feedback-user-details">
                            <span className="feedback-user-name">{item.userName || 'Anonim'}</span>
                            <span className="feedback-device-id">{item.deviceId ? `ID: ${item.deviceId.slice(0, 10)}...` : 'Mobile'}</span>
                          </div>
                        </div>

                        <div className="feedback-actions">
                          <button
                            type="button"
                            className="btn-feedback-action toggle-status"
                            title={item.status === 'read' ? 'Tandai belum dibaca' : 'Tandai sudah dibaca'}
                            onClick={async () => {
                              try {
                                await updateFeedbackItemStatus(item.id, item.status === 'read' ? 'unread' : 'read');
                              } catch (e) {
                                console.error('Status update error:', e);
                              }
                            }}
                          >
                            <CheckCircle size={15} color={item.status === 'read' ? '#10B981' : '#9CA3AF'} />
                            <span>{item.status === 'read' ? 'Dibaca' : 'Tandai Baca'}</span>
                          </button>
                          <button
                            type="button"
                            className="btn-feedback-action delete"
                            title="Hapus masukan ini"
                            onClick={async () => {
                              if (window.confirm('Hapus saran/keluh kesah ini?')) {
                                try {
                                  await deleteFeedbackItem(item.id);
                                } catch (e) {
                                  console.error('Delete feedback error:', e);
                                }
                              }
                            }}
                          >
                            <Trash2 size={15} color="#EF4444" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Feedback Pagination Footer */}
              {filteredFeedbacks.length > 0 && (
                <div className="pagination-footer">
                  <div className="pagination-info">
                    Menampilkan <b>{paginatedFeedbacks.length}</b> dari <b>{filteredFeedbacks.length}</b> masukan
                  </div>

                  <div className="pagination-controls">
                    <button 
                      className="btn-page-nav"
                      disabled={feedbackPage <= 1}
                      onClick={() => setFeedbackPage(prev => Math.max(1, prev - 1))}
                    >
                      <ChevronLeft size={16} />
                      <span>Sebelumnya</span>
                    </button>

                    <div className="pagination-page-indicator">
                      Halaman <b>{feedbackPage}</b> dari <b>{totalFeedbackPages}</b>
                    </div>

                    <button 
                      className="btn-page-nav"
                      disabled={feedbackPage >= totalFeedbackPages}
                      onClick={() => setFeedbackPage(prev => Math.min(totalFeedbackPages, prev + 1))}
                    >
                      <span>Berikutnya</span>
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              )}
            </section>
          </div>
        )}

      </div>
    </div>
  );
}

import React, { useState, useEffect, useCallback } from 'react';
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
  Tag
} from 'lucide-react';

const REFRESH_INTERVAL_SECONDS = 1200; // 20 minutes = 1200 seconds

export default function AdminDashboard({ onNavigateToApp }) {
  const [telemetryList, setTelemetryList] = useState([]);
  const [learnedInsights, setLearnedInsights] = useState(() => getLearnedInsights());
  const [insightSearchQuery, setInsightSearchQuery] = useState('');
  const [insightUserFilter, setInsightUserFilter] = useState('all');
  const [insightTypeFilter, setInsightTypeFilter] = useState('all'); // 'all' | 'deletion' | 'vocab'
  const [isLoading, setIsLoading] = useState(true);
  const [isSpinning, setIsSpinning] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(REFRESH_INTERVAL_SECONDS);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // 'all' | 'online' | 'offline'
  const [lastRefreshedAt, setLastRefreshedAt] = useState(new Date());

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
    // Immediately remove HTML splash screen if present when viewing Admin Dashboard
    const splash = document.getElementById('app-splash-screen');
    if (splash && splash.parentNode) {
      splash.parentNode.removeChild(splash);
    }

    // 1. Update this device telemetry on load
    updateCurrentDeviceTelemetry();

    // 2. Fetch latest insights from cloud
    fetchLearnedInsightsFromCloud().then(data => {
      if (Array.isArray(data)) setLearnedInsights(data);
    });

    // 3. Subscribe to Firebase Firestore real-time changes
    const unsubscribeTelemetry = subscribeToTelemetry((data) => {
      setTelemetryList(data);
      setLastRefreshedAt(new Date());
      setIsLoading(false);
    });

    const unsubscribeInsights = subscribeToLearnedInsights((data) => {
      setLearnedInsights(data);
    });

    return () => {
      if (typeof unsubscribeTelemetry === 'function') unsubscribeTelemetry();
      if (typeof unsubscribeInsights === 'function') unsubscribeInsights();
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

  // Format seconds to mm:ss
  const formatTimer = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Date and Time Formatter (Indonesian format)
  const formatDateTime = (rawVal) => {
    if (!rawVal) return { dateStr: '-', timeStr: '-', full: '-' };
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
        return { dateStr: '-', timeStr: '-', full: '-' };
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
        full: `${day} ${month} ${year}, ${hours}:${minutes}:${seconds}`
      };
    } catch {
      return { dateStr: '-', timeStr: '-', full: '-' };
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

  // Filter & Search Logic
  const filteredList = telemetryList.filter((item) => {
    const matchesSearch = 
      (item.userName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.deviceName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.id || '').toLowerCase().includes(searchQuery.toLowerCase());

    const statusInfo = getDeviceStatus(item.lastActive);
    const matchesStatus = 
      filterStatus === 'all' ? true :
      filterStatus === 'online' ? (statusInfo.status === 'online' || statusInfo.status === 'idle') :
      (statusInfo.status === 'offline');

    return matchesSearch && matchesStatus;
  });

  // Calculate statistics
  const totalUsers = telemetryList.length;
  const activeDevices = telemetryList.filter(item => getDeviceStatus(item.lastActive).status !== 'offline').length;
  const totalTransactions = telemetryList.reduce((acc, curr) => acc + (curr.totalTransactions || 0), 0);

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
                <span className="admin-badge" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Flame size={12} color="#FF5722" /> FIREBASE CLOUD
                </span>
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

        {/* Monitoring Control & Filters */}
        <section className="admin-controls-card">
          <div className="controls-row">
            <div className="search-box">
              <Search size={18} color="#9CA3AF" />
              <input 
                type="text" 
                placeholder="Cari user, tipe HP, atau Device ID..." 
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
              Menampilkan {filteredList.length} dari {totalUsers} perangkat
            </span>
          </div>

          {isLoading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Menghubungkan ke Firebase Cloud Realtime...</p>
            </div>
          ) : filteredList.length === 0 ? (
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
                    <th>TGL & JAM INSTAL</th>
                    <th>TERAKHIR AKTIF</th>
                    <th>TRANSAKSI</th>
                    <th>STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredList.map((item) => {
                    const installDt = formatDateTime(item.installDate || item.installedAt || item.installedDate || item.createdAt);
                    const lastActiveDt = formatDateTime(item.lastActive || item.updatedAt);
                    const statusInfo = getDeviceStatus(item.lastActive || item.updatedAt);
                    const avatarLetter = (item.userName || 'U').charAt(0).toUpperCase();

                    return (
                      <tr key={item.id} className="telemetry-row">
                        {/* Nama Pengguna */}
                        <td>
                          <div className="user-profile-cell">
                            <div className="user-avatar-circle">
                              {avatarLetter}
                            </div>
                            <div className="user-meta">
                              <span className="user-name-text">{item.userName || 'Tanpa Nama'}</span>
                              <span className="user-device-id" title={item.id}>
                                ID: {item.id.substring(0, 14)}...
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

                        {/* Tgl & Jam Instal */}
                        <td>
                          <div className="datetime-primary">{installDt.dateStr}</div>
                          <div className="datetime-sub">🕒 {installDt.timeStr}</div>
                        </td>

                        {/* Tgl & Jam Terakhir Aktif */}
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

        {/* SECTION: HAL YANG DIPELAJARI (VOICE AI & BEHAVIOR INSIGHTS) */}
        {(() => {
          // Daftar unik user dari catatan pembelajaran dan telemetry
          const insightUserNames = Array.from(
            new Set([
              ...learnedInsights.map(item => item.userName).filter(Boolean),
              ...telemetryList.map(t => t.userName).filter(Boolean)
            ])
          );

          const filteredInsights = learnedInsights.filter(item => {
            const uName = (item.userName || '').toLowerCase();
            const query = insightSearchQuery.toLowerCase().trim();
            const matchesSearch = !query || 
              uName.includes(query) || 
              (item.deletedTx && item.deletedTx.toLowerCase().includes(query)) ||
              (item.vocabWord && item.vocabWord.toLowerCase().includes(query));

            const matchesDropdown = insightUserFilter === 'all' || item.userName === insightUserFilter;
            
            // Filter tipe kotak: deletion vs vocab
            const isVocab = item.type === 'NEW_VOCAB' || (item.deletedTx && item.deletedTx.includes('[Kosakata Baru]'));
            const matchesType = 
              insightTypeFilter === 'all' ? true :
              insightTypeFilter === 'vocab' ? isVocab :
              !isVocab;

            return matchesSearch && matchesDropdown && matchesType;
          });

          const deletionCount = learnedInsights.filter(item => !(item.type === 'NEW_VOCAB' || (item.deletedTx && item.deletedTx.includes('[Kosakata Baru]')))).length;
          const vocabCount = learnedInsights.filter(item => item.type === 'NEW_VOCAB' || (item.deletedTx && item.deletedTx.includes('[Kosakata Baru]'))).length;

          return (
            <section className="admin-card learned-insights-section">
              <div className="table-header-row">
                <h2 className="admin-section-title">
                  <Sparkles size={20} color="#F59E0B" />
                  Hal yang Dipelajari & Evaluasi Suara
                </h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span className="insights-count-badge">
                    <Brain size={14} />
                    {filteredInsights.length} Catatan
                  </span>
                  {learnedInsights.length > 0 && (
                    <button
                      className="btn-clear-all-log"
                      title="Hapus semua log pembelajaran dari Firebase Cloud"
                      onClick={async () => {
                        if (window.confirm('Hapus semua catatan pembelajaran dari Firebase Cloud?')) {
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
              <p className="learned-section-desc">
                Catatan evaluasi penghapusan transaksi dan penemuan kosakata baru oleh pengguna.
              </p>

              {/* Bilah Filter Tab, Search & Dropdown User */}
              <div className="insights-filter-toolbar">
                <div className="search-box">
                  <Search size={16} color="#9CA3AF" />
                  <input
                    type="text"
                    placeholder="Cari berdasarkan nama user atau kata..."
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

                <div className="filter-dropdown-wrapper">
                  <Users size={16} color="#6B7280" className="dropdown-prefix-icon" />
                  <select
                    className="user-select-dropdown"
                    value={insightUserFilter}
                    onChange={(e) => setInsightUserFilter(e.target.value)}
                  >
                    <option value="all">Semua User ({insightUserNames.length})</option>
                    {insightUserNames.map(user => (
                      <option key={user} value={user}>
                        User: {user}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Tab Filter Tipe Kotak */}
                <div className="insight-type-pills">
                  <button 
                    className={`type-pill ${insightTypeFilter === 'all' ? 'active' : ''}`}
                    onClick={() => setInsightTypeFilter('all')}
                  >
                    Semua ({learnedInsights.length})
                  </button>
                  <button 
                    className={`type-pill ${insightTypeFilter === 'deletion' ? 'active' : ''}`}
                    onClick={() => setInsightTypeFilter('deletion')}
                  >
                    🗑️ Dihapus ({deletionCount})
                  </button>
                  <button 
                    className={`type-pill ${insightTypeFilter === 'vocab' ? 'active' : ''}`}
                    onClick={() => setInsightTypeFilter('vocab')}
                  >
                    ✨ Kosakata Baru ({vocabCount})
                  </button>
                </div>
              </div>

              {/* Daftar Kotak Pembelajaran */}
              <div className="insights-bullet-list">
                {filteredInsights.length === 0 ? (
                  <div className="empty-insights">
                    <Lightbulb size={32} color="#9CA3AF" />
                    <p>Tidak ada catatan pembelajaran yang cocok.</p>
                  </div>
                ) : (
                  filteredInsights.map((item, idx) => {
                    const itemDt = item.timestamp ? formatDateTime(item.timestamp) : null;
                    const avatarLetter = (item.userName || 'P').trim().charAt(0).toUpperCase();
                    
                    // Deteksi apakah ini Kotak Kosakata Baru atau Kotak Transaksi Dihapus
                    const isNewVocab = item.type === 'NEW_VOCAB' || (item.deletedTx && item.deletedTx.includes('[Kosakata Baru]'));

                    const handleDeleteThisItem = async () => {
                      if (window.confirm(`Hapus catatan ini?`)) {
                        await deleteSingleLearnedInsight(item.id);
                        setLearnedInsights(prev => prev.filter(p => p.id !== item.id));
                      }
                    };

                    // Format Simpel untuk Kotak Kosakata Baru
                    if (isNewVocab) {
                      let displayVocabWord = item.vocabWord;
                      if (!displayVocabWord && item.deletedTx) {
                        const match = item.deletedTx.match(/"([^"]+)"/);
                        displayVocabWord = match ? match[1] : item.deletedTx.replace(/✨\s*\[Kosakata Baru\]\s*/i, '');
                      }
                      displayVocabWord = displayVocabWord || item.title || 'Kata Baru';

                      return (
                        <div className="insight-clean-card vocab-card" key={item.id || idx}>
                          {/* 1. Header: Nama User & Badge Kosakata Baru + Tombol Tong Sampah Individual */}
                          <div className="insight-card-user-header">
                            <div className="insight-user-pill">
                              <div className="insight-user-avatar vocab-avatar">{avatarLetter}</div>
                              <span className="insight-user-name">{item.userName || 'Pengguna'}</span>
                              <span className="vocab-badge-pill">✨ Kosakata Baru</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              {itemDt && (
                                <span className="insight-time-badge">🕒 {itemDt.timeStr} • {itemDt.dateStr}</span>
                              )}
                              <button 
                                className="btn-item-trash"
                                title="Hapus catatan ini"
                                onClick={handleDeleteThisItem}
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </div>

                          {/* 2. Format Simpel Kosakata Baru */}
                          <div className="insight-card-details">
                            <div className="insight-detail-row">
                              <span className="insight-label">📖 Kosakata Baru:</span>
                              <span className="insight-value vocab-word-highlight">"{displayVocabWord}"</span>
                              {item.category && (
                                <span className="vocab-category-tag">
                                  <Tag size={12} /> {item.category}
                                </span>
                              )}
                            </div>

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

                    // Format Lengkap untuk Kotak Transaksi yang Dihapus
                    return (
                      <div className="insight-clean-card deletion-card" key={item.id || idx}>
                        {/* 1. Header Kotak: Nama User + Tombol Tong Sampah Individual */}
                        <div className="insight-card-user-header">
                          <div className="insight-user-pill">
                            <div className="insight-user-avatar">{avatarLetter}</div>
                            <span className="insight-user-name">{item.userName || 'Pengguna'}</span>
                            <span className="deletion-badge-pill">🗑️ Transaksi Dihapus</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            {itemDt && (
                              <span className="insight-time-badge">🕒 {itemDt.timeStr} • {itemDt.dateStr}</span>
                            )}
                            <button 
                              className="btn-item-trash"
                              title="Hapus catatan ini"
                              onClick={handleDeleteThisItem}
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </div>

                        {/* 2, 3, 4: Baris Konten Singkat & Real Transaksi yang Dihapus */}
                        <div className="insight-card-details">
                          <div className="insight-detail-row">
                            <span className="insight-label">🗑️ Transaksi yang Dihapus:</span>
                            <span className="insight-value deleted-highlight">{item.deletedTx || item.title}</span>
                          </div>

                          <div className="insight-detail-row">
                            <span className="insight-label">❓ Kemungkinan Kenapa Dihapus:</span>
                            <span className="insight-value">{item.reason || item.description}</span>
                          </div>

                          <div className="insight-detail-row learning-row">
                            <span className="insight-label">💡 Poin Pembelajaran:</span>
                            <span className="insight-value learning-highlight">{item.learningPoint || item.evaluation}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </section>
          );
        })()}

      </div>
    </div>
  );
}

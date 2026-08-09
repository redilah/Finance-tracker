import React, { useState, useEffect } from 'react';
import './AdminDashboard.css';
import { 
  getTelemetryData, 
  updateCurrentDeviceTelemetry, 
  subscribeToTelemetry 
} from '../../utils/telemetry';
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
  Flame
} from 'lucide-react';

const REFRESH_INTERVAL_SECONDS = 1200; // 20 minutes = 1200 seconds

export default function AdminDashboard({ onNavigateToApp }) {
  const [telemetryList, setTelemetryList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSpinning, setIsSpinning] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(REFRESH_INTERVAL_SECONDS);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // 'all' | 'online' | 'offline'
  const [lastRefreshedAt, setLastRefreshedAt] = useState(new Date());

  // Manual refresh trigger
  const fetchTelemetry = async () => {
    if (isSpinning) return;
    setIsSpinning(true);
    try {
      await updateCurrentDeviceTelemetry();
      const data = await getTelemetryData();
      if (Array.isArray(data)) {
        setTelemetryList(data);
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
  };

  // Initial load & Firebase Realtime Subscription
  useEffect(() => {
    // 1. Update this device telemetry on load
    updateCurrentDeviceTelemetry();

    // 2. Subscribe to Firebase Firestore real-time changes
    const unsubscribe = subscribeToTelemetry((data) => {
      setTelemetryList(data);
      setLastRefreshedAt(new Date());
      setIsLoading(false);
    });

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
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
  }, []);

  // Format seconds to mm:ss
  const formatTimer = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Date and Time Formatter (Indonesian format)
  const formatDateTime = (isoString) => {
    if (!isoString) return '-';
    try {
      const date = new Date(isoString);
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
              <p>Pusat Komando & Pemantauan Perangkat Pengguna Real-Time</p>
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
              <Smartphone size={24} />
            </div>
            <div className="stat-info">
              <span>DEVICE AKTIF TERKINI</span>
              <h3>{activeDevices} <small style={{ fontSize: '13px', fontWeight: 500, color: '#10B981' }}>online/idle</small></h3>
              <p className="stat-subtext">Aktif dalam 1 jam terakhir</p>
            </div>
          </div>

          <div className="admin-stat-card">
            <div className="stat-icon-wrapper stat-icon-timer">
              <Clock size={24} />
            </div>
            <div className="stat-info">
              <span>AUTO REFRESH (20 MENIT)</span>
              <h3>{formatTimer(secondsRemaining)}</h3>
              <p className="stat-subtext">Terakhir sync: {formatDateTime(lastRefreshedAt.toISOString()).timeStr}</p>
            </div>
          </div>

          <div className="admin-stat-card">
            <div className="stat-icon-wrapper stat-icon-tx">
              <Activity size={24} />
            </div>
            <div className="stat-info">
              <span>TOTAL TRANSAKSI USER</span>
              <h3>{totalTransactions}</h3>
              <p className="stat-subtext">Akumulasi pencatatan di perangkat</p>
            </div>
          </div>
        </section>

        {/* Filter and Controls */}
        <section className="admin-controls-card">
          <div className="controls-row">
            <div className="search-box">
              <Search size={18} color="#9CA3AF" />
              <input 
                type="text"
                placeholder="Cari nama user, jenis device, atau ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="filter-group">
              <button 
                className={`btn-filter ${filterStatus === 'all' ? 'active' : ''}`}
                onClick={() => setFilterStatus('all')}
              >
                Semua ({telemetryList.length})
              </button>
              <button 
                className={`btn-filter ${filterStatus === 'online' ? 'active' : ''}`}
                onClick={() => setFilterStatus('online')}
              >
                Aktif ({telemetryList.filter(i => getDeviceStatus(i.lastActive).status !== 'offline').length})
              </button>
              <button 
                className={`btn-filter ${filterStatus === 'offline' ? 'active' : ''}`}
                onClick={() => setFilterStatus('offline')}
              >
                Offline ({telemetryList.filter(i => getDeviceStatus(i.lastActive).status === 'offline').length})
              </button>

            </div>
          </div>
        </section>

        {/* Telemetry Data Table */}
        <section className="admin-table-card">
          <div className="table-header-title">
            <h2>
              <HardDrive size={20} color="#10B981" />
              Daftar Pemantauan Perangkat & Pengguna Real-Time
            </h2>
            <span>Menampilkan {filteredList.length} dari {telemetryList.length} data</span>
          </div>

          {isLoading ? (
            <div className="empty-telemetry">
              <RefreshCw size={36} color="#10B981" className="icon-spin" />
              <h3>Menghubungkan ke Firebase Cloud...</h3>
              <p>Mengambil data perangkat & pengguna terbaru secara real-time.</p>
            </div>
          ) : filteredList.length === 0 ? (
            <div className="empty-telemetry">
              <AlertCircle size={40} color="#9CA3AF" />
              <h3>Belum ada data perangkat lain terdeteksi</h3>
              <p>Semua data dummy telah dihapus. Saat pengguna baru menginstal dan membuka aplikasi <b>Cassiel.apk</b> di HP mereka, data mereka akan otomatis muncul di sini secara live!</p>
            </div>
          ) : (
            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>NO / NAMA PENGGUNA</th>
                    <th>NAMA DEVICE & OS</th>
                    <th>TGL & JAM INSTAL</th>
                    <th>TGL & JAM TERAKHIR AKTIF</th>
                    <th>STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredList.map((item, idx) => {
                    const statusInfo = getDeviceStatus(item.lastActive);
                    const installDt = formatDateTime(item.installedAt);
                    const lastActiveDt = formatDateTime(item.lastActive);

                    return (
                      <tr key={item.id || idx}>
                        {/* Nama yang ditulis siapa */}
                        <td>
                          <div className="user-cell">
                            <div className="user-avatar">
                              {(item.userName || 'P').charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="user-name-text">
                                {item.userName || 'Tanpa Nama'}
                                {item.isCurrentDevice && (
                                  <span className="tag-current">Device Ini</span>
                                )}
                              </div>
                              <div className="user-sub-id">ID: {item.id}</div>
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

      </div>
    </div>
  );
}

import React, { useState, useMemo, useEffect } from 'react';
import { 
  generateCategoryInsight, 
  isEndOfMonthOrTesting, 
  getLastDayOfMonth,
  formatRupiah 
} from '../utils/categoryInsightEngine.js';
import { getInstallDate } from '../utils/telemetry.js';

// Helper hitung sisa waktu hingga akhir bulan
const calculateTimeLeft = (target) => {
  const diff = target.getTime() - Date.now();
  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true };
  }
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);
  return { days, hours, minutes, seconds, isExpired: false };
};

const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
const MONTH_FULL = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export default function CategoryInsightScreen({
  category, // { name, color, categoryId, id, ... }
  initialDate = new Date(),
  allTransactions = [],
  userName = 'Pengguna',
  resolveIcon,
  onClose
}) {
  const [currentDate, setCurrentDate] = useState(() => new Date(initialDate.getFullYear(), initialDate.getMonth(), 1));
  const [isTxListExpanded, setIsTxListExpanded] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const year = currentDate.getFullYear();
  const monthIndex = currentDate.getMonth(); // 0-indexed

  // Format header bulan & tahun (< Agu 2026 >)
  const monthYearLabel = `${MONTH_SHORT[monthIndex]} ${year}`;
  const fullMonthYearLabel = `${MONTH_FULL[monthIndex]} ${year}`;

  // Dapatkan bulan & tahun instalasi pengguna
  const installInfo = useMemo(() => {
    try {
      const raw = getInstallDate();
      const d = new Date(raw);
      if (!isNaN(d.getTime())) {
        return {
          year: d.getFullYear(),
          monthIndex: d.getMonth(),
          monthName: MONTH_FULL[d.getMonth()]
        };
      }
    } catch {}
    const now = new Date();
    return {
      year: now.getFullYear(),
      monthIndex: now.getMonth(),
      monthName: MONTH_FULL[now.getMonth()]
    };
  }, []);

  // Periksa apakah pengguna bisa mundur ke bulan sebelumnya
  const canGoPrev = useMemo(() => {
    if (year > installInfo.year) return true;
    if (year === installInfo.year && monthIndex > installInfo.monthIndex) return true;
    return false;
  }, [year, monthIndex, installInfo]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  };

  const handlePrevMonth = () => {
    if (canGoPrev) {
      setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    } else {
      showToast(`Pertama diinstal ${installInfo.monthName} ${installInfo.year}. Tidak ada data sebelumnya.`);
    }
  };

  const handleNextMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  // Cek ketersediaan insight untuk bulan ini
  const lastDay = getLastDayOfMonth(year, monthIndex);
  
  // Real-time Countdown Timer ke tanggal akhir bulan (Pukul 00:00:00)
  const [timeLeft, setTimeLeft] = useState(() => {
    const target = new Date(year, monthIndex, lastDay, 0, 0, 0, 0);
    return calculateTimeLeft(target);
  });

  useEffect(() => {
    const target = new Date(year, monthIndex, lastDay, 0, 0, 0, 0);
    setTimeLeft(calculateTimeLeft(target));

    const timer = setInterval(() => {
      const remaining = calculateTimeLeft(target);
      setTimeLeft(remaining);
    }, 1000);

    return () => clearInterval(timer);
  }, [year, monthIndex, lastDay]);

  const isUnlocked = isEndOfMonthOrTesting(year, monthIndex) || timeLeft.isExpired;

  // Generate insight data
  const insight = useMemo(() => {
    return generateCategoryInsight({
      categoryName: category.name || category.category || 'Kategori',
      year,
      monthIndex,
      allTransactions,
      userName
    });
  }, [category, year, monthIndex, allTransactions, userName]);

  const catIcon = resolveIcon ? resolveIcon(category) : null;
  const catColor = category.color || '#4EBE96';

  return (
    <div className="modal-overlay profile-setup-overlay full-page-profile-screen category-insight-screen">
      <div className="wa-profile-screen-container category-insight-container">
        
        {/* Toast Notifikasi Feedback (Identik dengan format & animasi notifikasi Voice Mic, ~70% lebar layar) */}
        {toastMessage && (
          <div className="voice-toast-notification category-insight-toast-pill" style={{ top: 24, zIndex: 100002 }}>
            <span>ℹ️</span>
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Top Header Bar */}
        <div className="wa-profile-top-header">
          <button
            type="button"
            className="back-btn"
            onClick={onClose}
            aria-label="Kembali ke Stats"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
          </button>
          <div className="category-insight-header-title">
            <h2>Insight Kategori</h2>
            <span className="category-insight-subtitle">{category.name}</span>
          </div>
          <div style={{ width: 36 }}></div>
        </div>

        {/* Scrollable Content Body */}
        <div className="category-insight-body">
          
          {/* Month / Year Navigator (< Agu 2026 >) */}
          <div className="category-insight-date-nav">
            <button
              type="button"
              className="month-btn"
              onClick={handlePrevMonth}
              aria-label="Bulan Sebelumnya"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 18l-6-6 6-6"/>
              </svg>
            </button>
            <span className="month-text category-insight-month-text">
              {monthYearLabel}
            </span>
            <button
              type="button"
              className="month-btn"
              onClick={handleNextMonth}
              aria-label="Bulan Berikutnya"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18l6-6-6-6"/>
              </svg>
            </button>
          </div>

          {/* Skenario: Belum Akhir Bulan / Bulan Belum Tersedia */}
          {!isUnlocked ? (
            <div className="category-insight-future-card">
              <div className="category-insight-calendar-badge" aria-label={`Kalender ${fullMonthYearLabel}`}>
                <div className="calendar-badge-header">{MONTH_SHORT[monthIndex].toUpperCase()}</div>
                <div className="calendar-badge-day">{lastDay}</div>
              </div>
              <h4>Belum ada insight untuk bulan {fullMonthYearLabel}</h4>
              <p>Periode ini baru bisa dilihat jika sudah tanggal {lastDay} {fullMonthYearLabel}.</p>
              
              {/* Countdown Timer Hitung Mundur */}
              <div className="category-insight-countdown-wrap">
                <div className="category-insight-countdown-grid">
                  <div className="category-insight-countdown-box">
                    <span className="countdown-val">{String(timeLeft.days).padStart(2, '0')}</span>
                    <span className="countdown-lbl">Hari</span>
                  </div>
                  <span className="countdown-colon">:</span>
                  <div className="category-insight-countdown-box">
                    <span className="countdown-val">{String(timeLeft.hours).padStart(2, '0')}</span>
                    <span className="countdown-lbl">Jam</span>
                  </div>
                  <span className="countdown-colon">:</span>
                  <div className="category-insight-countdown-box">
                    <span className="countdown-val">{String(timeLeft.minutes).padStart(2, '0')}</span>
                    <span className="countdown-lbl">Menit</span>
                  </div>
                  <span className="countdown-colon">:</span>
                  <div className="category-insight-countdown-box">
                    <span className="countdown-val">{String(timeLeft.seconds).padStart(2, '0')}</span>
                    <span className="countdown-lbl">Detik</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Skenario: Insight Terbuka (Bulan Lampau / Akhir Bulan yang sudah tiba) */
            <>
              {/* Category Hero Summary Card */}
              <div className="category-insight-hero-card">
                <div className="category-insight-hero-left">
                  <div 
                    className="category-insight-hero-icon"
                    style={{ backgroundColor: `${catColor}20` }}
                  >
                    {catIcon ? (
                      <img src={catIcon} alt={category.name} />
                    ) : (
                      <span style={{ fontSize: 24 }}>🏷️</span>
                    )}
                  </div>
                  <div className="category-insight-hero-info">
                    <h3 className="category-insight-hero-name">{category.name}</h3>
                    <span className="category-insight-hero-count">
                      {insight.currentCount} transaksi ({insight.percentageOfTotal}% anggaran)
                    </span>
                  </div>
                </div>
                <div className="category-insight-hero-right">
                  <span className="category-insight-hero-amount">
                    {formatRupiah(insight.currentTotalAmount)}
                  </span>
                  <span className="category-insight-hero-avg">
                    Rata-rata {formatRupiah(insight.averagePerTx)}/tx
                  </span>
                </div>
              </div>

              {/* Story Narrative Box */}
              <div className="category-insight-story-card">
                <div className="category-insight-story-header">
                  <div className="category-insight-story-badge">
                    <span>✨ Kisah Pengeluaranmu</span>
                  </div>
                  <span className="category-insight-story-user">{userName}</span>
                </div>
                <p className="category-insight-story-text">
                  {insight.narrativeStory}
                </p>
              </div>

              {/* Key Highlights Grid */}
              <div className="category-insight-highlights-grid">
                
                {/* 1. Item Paling Sering */}
                <div className="category-insight-highlight-item">
                  <div className="highlight-item-header">
                    <span className="highlight-icon">🍜</span>
                    <span className="highlight-title">Favorit Dibeli</span>
                  </div>
                  <div className="highlight-item-content">
                    {insight.topNote ? (
                      <>
                        <span className="highlight-main-val">{insight.topNote.note}</span>
                        <span className="highlight-sub-val">
                          {insight.topNote.count}x dibeli • {formatRupiah(insight.topNote.totalAmount)}
                        </span>
                      </>
                    ) : (
                      <span className="highlight-empty-val">Belum ada item</span>
                    )}
                  </div>
                </div>

                {/* 2. Hari Tersibuk / Terboros */}
                <div className="category-insight-highlight-item">
                  <div className="highlight-item-header">
                    <span className="highlight-icon">📅</span>
                    <span className="highlight-title">Hari Paling Aktif</span>
                  </div>
                  <div className="highlight-item-content">
                    {insight.busiestDay ? (
                      <>
                        <span className="highlight-main-val">Tgl {insight.busiestDay.dayNum} {insight.monthName}</span>
                        <span className="highlight-sub-val">
                          {insight.busiestDay.count} transaksi • {formatRupiah(insight.busiestDay.amount)}
                        </span>
                      </>
                    ) : (
                      <span className="highlight-empty-val">-</span>
                    )}
                  </div>
                </div>

                {/* 3. Transaksi Terbesar */}
                <div className="category-insight-highlight-item">
                  <div className="highlight-item-header">
                    <span className="highlight-icon">💎</span>
                    <span className="highlight-title">Transaksi Terbesar</span>
                  </div>
                  <div className="highlight-item-content">
                    {insight.largestTx ? (
                      <>
                        <span className="highlight-main-val">{formatRupiah(insight.largestTx.amount)}</span>
                        <span className="highlight-sub-val">
                          {insight.largestTxLabel || `Kategori ${category.name}`}
                        </span>
                      </>
                    ) : (
                      <span className="highlight-empty-val">-</span>
                    )}
                  </div>
                </div>

                {/* 4. Metode Pembayaran */}
                <div className="category-insight-highlight-item">
                  <div className="highlight-item-header">
                    <span className="highlight-icon">💳</span>
                    <span className="highlight-title">Metode Utama</span>
                  </div>
                  <div className="highlight-item-content">
                    {insight.currentCount > 0 ? (
                      <>
                        <span className="highlight-main-val">{insight.dominantAccount}</span>
                        <span className="highlight-sub-val">Sering digunakan</span>
                      </>
                    ) : (
                      <span className="highlight-empty-val">-</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Perbandingan Bulan Sebelumnya */}
              {insight.prevTotalAmount > 0 && (
                <div className={`category-insight-trend-card ${insight.diffStatus}`}>
                  <div className="trend-card-icon">
                    {insight.diffStatus === 'up' ? '📈' : insight.diffStatus === 'down' ? '📉' : '⚖️'}
                  </div>
                  <div className="trend-card-text">
                    <strong>
                      {insight.diffStatus === 'up' 
                        ? `Naik ${insight.diffPercentage}% dibanding bulan lalu`
                        : insight.diffStatus === 'down'
                        ? `Turun ${insight.diffPercentage}% lebih hemat dibanding bulan lalu`
                        : 'Sama persis dengan bulan lalu'}
                    </strong>
                    <span>
                      Bulan lalu: {formatRupiah(insight.prevTotalAmount)} ({insight.prevCount}x tx)
                    </span>
                  </div>
                </div>
              )}

              {/* Expandable Capsule: Daftar Transaksi */}
              <div className="category-insight-capsule-wrapper">
                <div 
                  className={`category-insight-txs-capsule ${isTxListExpanded ? 'expanded' : ''}`}
                  onClick={() => setIsTxListExpanded(!isTxListExpanded)}
                  role="button"
                  tabIndex={0}
                >
                  <div className="capsule-header-left">
                    <span className="capsule-icon">📋</span>
                    <span className="capsule-title">
                      Daftar Transaksi ({insight.transactions.length})
                    </span>
                  </div>
                  <div className="capsule-header-right">
                    <svg 
                      className={`capsule-chevron ${isTxListExpanded ? 'rotated' : ''}`}
                      width="18" 
                      height="18" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="2.5" 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                    >
                      <path d="M6 9l6 6 6-6"/>
                    </svg>
                  </div>
                </div>

                {/* Expanded Content List */}
                {isTxListExpanded && (
                  <div className="category-insight-txs-expanded-list">
                    {insight.transactions.length > 0 ? (
                      insight.transactions.map((tx) => (
                        <div key={tx.id || Math.random()} className="category-insight-tx-row">
                          <div className="tx-row-left">
                            <span className="tx-row-date">
                              {tx.date ? tx.date.split('-').reverse().join('/') : '-'}
                            </span>
                            <span className="tx-row-note">
                              {(tx.title && tx.title.trim()) || (tx.note && tx.note.trim()) || category.name}
                            </span>
                            <span className="tx-row-account">{tx.account || 'Bank'}</span>
                          </div>
                          <div className="tx-row-right">
                            <span className="tx-row-amount">
                              -Rp {tx.amount.toLocaleString('id-ID')}
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="category-insight-txs-empty">
                        <p>Tidak ada transaksi di bulan ini.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
}

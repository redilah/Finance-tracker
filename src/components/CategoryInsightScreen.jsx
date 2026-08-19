import React, { useState, useMemo, useEffect } from 'react';
import { 
  generateCategoryInsight, 
  isEndOfMonthOrTesting, 
  getLastDayOfMonth,
  formatRupiah 
} from '../utils/categoryInsightEngine.js';
import { getInstallDate } from '../utils/telemetry.js';
import { fetchCommunityBenchmark, getCommunityAverage, getInitialCommunityBenchmark } from '../utils/communityBenchmark.js';
import { MONTH_NAMES_I18N, MONTH_SHORT_I18N, getTranslation } from '../utils/i18n.js';
import { AccountIconBadge } from '../utils/accountLogos.jsx';

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

export default function CategoryInsightScreen({
  category, // { name, color, categoryId, id, ... }
  initialDate = new Date(),
  allTransactions = [],
  userName = 'Pengguna',
  resolveIcon,
  appLanguage = 'id',
  fmtMoney,
  t,
  getCategoryName,
  onClose
}) {
  const [currentDate, setCurrentDate] = useState(() => new Date(initialDate.getFullYear(), initialDate.getMonth(), 1));
  const [isTxListExpanded, setIsTxListExpanded] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [benchmarkData, setBenchmarkData] = useState(() => getInitialCommunityBenchmark());

  // Helper translation fallback
  const tr = (key) => (t ? t(key) : getTranslation(appLanguage, key));

  const year = currentDate.getFullYear();
  const monthIndex = currentDate.getMonth(); // 0-indexed

  // Format header bulan & tahun dinamis sesuai bahasa aktif
  const monthShortList = MONTH_SHORT_I18N[appLanguage] || MONTH_SHORT_I18N.id;
  const monthFullList = MONTH_NAMES_I18N[appLanguage] || MONTH_NAMES_I18N.id;
  const monthYearLabel = `${monthShortList[monthIndex]} ${year}`;
  const fullMonthYearLabel = `${monthFullList[monthIndex]} ${year}`;

  const localizedCatName = getCategoryName 
    ? getCategoryName(category, appLanguage) 
    : (category.name || category.category || 'Category');

  // Dapatkan bulan & tahun instalasi pengguna
  const installInfo = useMemo(() => {
    try {
      const raw = getInstallDate();
      const d = new Date(raw);
      if (!isNaN(d.getTime())) {
        return {
          year: d.getFullYear(),
          monthIndex: d.getMonth(),
          monthName: monthFullList[d.getMonth()]
        };
      }
    } catch {}
    const now = new Date();
    return {
      year: now.getFullYear(),
      monthIndex: now.getMonth(),
      monthName: monthFullList[now.getMonth()]
    };
  }, [monthFullList]);

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
      showToast(`${tr('categoryInsightInstallNote')} ${installInfo.monthName} ${installInfo.year}. ${tr('categoryInsightNoPrevData')}`);
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

  // Fetch community benchmark data (async, non-blocking)
  useEffect(() => {
    let cancelled = false;
    fetchCommunityBenchmark().then(data => {
      if (!cancelled) setBenchmarkData(data);
    }).catch(() => {});
    return () => { cancelled = true; };
  }, []);

  // Resolve community average for current category
  const catNameForBenchmark = category.name || category.category || 'Kategori';
  const communityDataForCat = useMemo(() => {
    return getCommunityAverage(catNameForBenchmark, benchmarkData);
  }, [catNameForBenchmark, benchmarkData]);

  // Generate insight data
  const insight = useMemo(() => {
    return generateCategoryInsight({
      categoryName: catNameForBenchmark,
      year,
      monthIndex,
      allTransactions,
      userName,
      appLanguage,
      fmtMoney,
      getCategoryName,
      communityData: communityDataForCat
    });
  }, [category, year, monthIndex, allTransactions, userName, appLanguage, fmtMoney, getCategoryName, communityDataForCat]);

  const catIcon = resolveIcon ? resolveIcon(category) : null;
  const catColor = category.color || '#4EBE96';

  const formatAmount = (amt) => {
    return fmtMoney ? fmtMoney(amt) : formatRupiah(amt);
  };

  return (
    <div className="modal-overlay profile-setup-overlay full-page-profile-screen category-insight-screen">
      <div className="wa-profile-screen-container category-insight-container">
        
        {/* Toast Notifikasi Feedback */}
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
            aria-label="Kembali"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
          </button>
          <div className="category-insight-header-title">
            <h2>{tr('categoryInsightTitle')}</h2>
            <span className="category-insight-subtitle">{localizedCatName}</span>
          </div>
          <div style={{ width: 36 }}></div>
        </div>

        {/* Scrollable Content Body */}
        <div className="category-insight-body">
          
          {/* Month / Year Navigator */}
          <div className="category-insight-date-nav">
            <button
              type="button"
              className="month-btn"
              onClick={handlePrevMonth}
              aria-label="Previous Month"
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
              aria-label="Next Month"
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
                <div className="calendar-badge-header">{monthShortList[monthIndex].toUpperCase()}</div>
                <div className="calendar-badge-day">{lastDay}</div>
              </div>
              <h4>{tr('categoryInsightNoData')} {fullMonthYearLabel}</h4>
              <p>{tr('categoryInsightLockedDesc')} {lastDay} {fullMonthYearLabel}.</p>
              
              {/* Countdown Timer Hitung Mundur */}
              <div className="category-insight-countdown-wrap">
                <div className="category-insight-countdown-grid">
                  <div className="category-insight-countdown-box">
                    <span className="countdown-val">{String(timeLeft.days).padStart(2, '0')}</span>
                    <span className="countdown-lbl">{tr('timeDays')}</span>
                  </div>
                  <span className="countdown-colon">:</span>
                  <div className="category-insight-countdown-box">
                    <span className="countdown-val">{String(timeLeft.hours).padStart(2, '0')}</span>
                    <span className="countdown-lbl">{tr('timeHours')}</span>
                  </div>
                  <span className="countdown-colon">:</span>
                  <div className="category-insight-countdown-box">
                    <span className="countdown-val">{String(timeLeft.minutes).padStart(2, '0')}</span>
                    <span className="countdown-lbl">{tr('timeMinutes')}</span>
                  </div>
                  <span className="countdown-colon">:</span>
                  <div className="category-insight-countdown-box">
                    <span className="countdown-val">{String(timeLeft.seconds).padStart(2, '0')}</span>
                    <span className="countdown-lbl">{tr('timeSeconds')}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Skenario: Insight Terbuka */
            <>
              {/* Category Hero Summary Card */}
              <div className="category-insight-hero-card">
                <div className="category-insight-hero-left">
                  <div 
                    className={`category-insight-hero-icon ${category.iconClass || ''}`}
                    style={category.iconClass ? {} : { backgroundColor: `${catColor}20` }}
                  >
                    {catIcon ? (
                      <img src={catIcon} alt={localizedCatName} />
                    ) : (
                      <span style={{ fontSize: 24 }}>🏷️</span>
                    )}
                  </div>
                  <div className="category-insight-hero-info">
                    <h3 className="category-insight-hero-name">{localizedCatName}</h3>
                    <span className="category-insight-hero-count">
                      {insight.currentCount} {tr('categoryInsightTxCount')} ({insight.percentageOfTotal}% {tr('categoryInsightBudgetShare')})
                    </span>
                  </div>
                </div>
                <div className="category-insight-hero-right">
                  <span className="category-insight-hero-amount">
                    {formatAmount(insight.currentTotalAmount)}
                  </span>
                  <span className="category-insight-hero-avg">
                    {formatAmount(insight.averagePerTx)}/tx
                  </span>
                </div>
              </div>

              {/* Story Narrative Box */}
              <div className="category-insight-story-card">
                <div className="category-insight-story-header">
                  <div className="category-insight-story-badge">
                    <span>{tr('categoryInsightStory')}</span>
                  </div>
                  <span className="category-insight-story-user">{userName}</span>
                </div>
                <p className="category-insight-story-text">
                  {insight.narrativeMainStory || insight.narrativeStory}
                  {insight.socialProofStory && (
                    <>
                      {' '}
                      <span className="category-insight-social-proof-text">
                        {insight.socialProofStory}
                      </span>
                    </>
                  )}
                </p>
              </div>

              {/* Key Highlights Grid */}
              <div className="category-insight-highlights-grid">
                
                {/* 0. Rata-rata Pengeluaran Per Hari (Featured) */}
                <div className="category-insight-highlight-item featured">
                  <div className="highlight-item-header">
                    <span className="highlight-icon">📊</span>
                    <span className="highlight-title">{tr('categoryInsightDailyAverage')}</span>
                  </div>
                  <div className="highlight-item-content">
                    {insight.currentCount > 0 ? (
                      <>
                        <span className="highlight-main-val">
                          {formatAmount(insight.averagePerDay)} <span className="highlight-unit-label">/ {tr('timeDays').toLowerCase()}</span>
                        </span>
                        <span className="highlight-sub-val">
                          {tr('categoryInsightPerDayDesc')}
                        </span>
                      </>
                    ) : (
                      <span className="highlight-empty-val">-</span>
                    )}
                  </div>
                </div>

                {/* 1. Item Paling Sering */}
                <div className="category-insight-highlight-item">
                  <div className="highlight-item-header">
                    <span className="highlight-icon">🍜</span>
                    <span className="highlight-title">{tr('categoryInsightTopBought')}</span>
                  </div>
                  <div className="highlight-item-content">
                    {insight.topNote ? (
                      <>
                        <span className="highlight-main-val">{insight.topNote.note}</span>
                        <span className="highlight-sub-val">
                          {insight.topNote.count}x • {formatAmount(insight.topNote.totalAmount)}
                        </span>
                      </>
                    ) : (
                      <span className="highlight-empty-val">{tr('categoryInsightNoItems')}</span>
                    )}
                  </div>
                </div>

                {/* 2. Hari Tersibuk */}
                <div className="category-insight-highlight-item">
                  <div className="highlight-item-header">
                    <span className="highlight-icon">📅</span>
                    <span className="highlight-title">{tr('categoryInsightBusiestDay')}</span>
                  </div>
                  <div className="highlight-item-content">
                    {insight.busiestDay ? (
                      <>
                        <span className="highlight-main-val">{monthShortList[monthIndex]} {insight.busiestDay.dayNum}</span>
                        <span className="highlight-sub-val">
                          {insight.busiestDay.count} {tr('categoryInsightTxCount')} • {formatAmount(insight.busiestDay.amount)}
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
                    <span className="highlight-title">{tr('categoryInsightLargestTx')}</span>
                  </div>
                  <div className="highlight-item-content">
                    {insight.largestTx ? (
                      <>
                        <span className="highlight-main-val">{formatAmount(insight.largestTx.amount)}</span>
                        <span className="highlight-sub-val">
                          {insight.largestTxLabel || localizedCatName}
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
                    <span className="highlight-icon">
                      {insight.currentCount > 0 && insight.dominantAccount ? (
                        <AccountIconBadge accountName={insight.dominantAccount} size={22} />
                      ) : (
                        '💳'
                      )}
                    </span>
                    <span className="highlight-title">{tr('categoryInsightPrimaryMethod')}</span>
                  </div>
                  <div className="highlight-item-content">
                    {insight.currentCount > 0 ? (
                      <>
                        <span className="highlight-main-val">{insight.dominantAccount}</span>
                        <span className="highlight-sub-val">{tr('categoryInsightFrequent')}</span>
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
                        ? `${tr('categoryInsightUp')} ${insight.diffPercentage}% ${tr('categoryInsightVsPrev')}`
                        : insight.diffStatus === 'down'
                        ? `${tr('categoryInsightDown')} ${insight.diffPercentage}% ${tr('categoryInsightVsPrev')}`
                        : tr('categoryInsightSame')}
                    </strong>
                    <span>
                      {tr('categoryInsightPrevMonth')} {formatAmount(insight.prevTotalAmount)} ({insight.prevCount}x tx)
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
                      {tr('categoryInsightTxList')} ({insight.transactions.length})
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
                              {(tx.title && tx.title.trim()) || (tx.note && tx.note.trim()) || localizedCatName}
                            </span>
                            <span className="tx-row-account">{tx.account || 'BRImo'}</span>
                          </div>
                          <div className="tx-row-right">
                            <span className="tx-row-amount">
                              -{formatAmount(tx.amount)}
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="category-insight-txs-empty">
                        <p>{tr('categoryInsightNoTx')}</p>
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

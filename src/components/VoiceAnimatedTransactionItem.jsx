import React, { useState, useEffect } from 'react';
import { resolveCardBgClass, isAutoTrackedTx } from '../utils/categoryConfig';

/**
 * Komponen Kartu Transaksi Baru:
 * 1. Fluid Pill Expansion (Muncul sebagai bulatan kecil di tengah lalu meregang mulus ke kiri-kanan)
 * 2. Animasi Ketik (Typewriter) Terstruktur & Berirama:
 *    - Menunggu kartu membuka sebagian (260ms) sebelum mulai mengetik
 *    - Memiliki jeda napas terstruktur saat berpindah dari Judul -> Kategori/Akun -> Nominal
 *    - Nominal rata kanan dengan tabular-nums agar tidak bergeser saat diketik
 */
export default function VoiceAnimatedTransactionItem({
  item,
  resolveIcon,
  isDeleting,
  onAnimationComplete,
  onSelectTx,
  onEditTx,
  getCategoryName,
  appLanguage,
  fmtHomeMoney,
  className = ''
}) {
  const fullTitle = item.title || item.category || 'Transaksi';
  const catLabel = getCategoryName ? getCategoryName(item.category, appLanguage) : (item.category || '');
  const fullSubtitle = `${catLabel} • ${item.account || 'Cash'}`;
  const prefix = item.type === 'expense' ? '-' : '+';
  const formattedAmt = fmtHomeMoney ? fmtHomeMoney(item.amount) : `Rp ${Number(item.amount || 0).toLocaleString('id-ID')}`;
  const fullAmount = `${prefix}${formattedAmt}`;

  const L1 = fullTitle.length;
  const PAUSE_1 = 3; // Jeda terstruktur setelah selesai ketik Judul (~135ms)
  const L2 = fullSubtitle.length;
  const PAUSE_2 = 3; // Jeda terstruktur sebelum mulai ketik Nominal (~135ms)
  const L3 = fullAmount.length;
  const totalSteps = L1 + PAUSE_1 + L2 + PAUSE_2 + L3;

  const [stepProgress, setStepProgress] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  useEffect(() => {
    let current = 0;
    let interval = null;
    let finishTimer = null;

    // Tunggu 260ms saat kartu sedang membuka dari bulatan tengah agar ketikan terlihat jelas & terstruktur
    const startDelay = setTimeout(() => {
      interval = setInterval(() => {
        current++;
        setStepProgress(current);
        if (current >= totalSteps) {
          clearInterval(interval);
          setIsFinished(true);
          // Setelah selesai mengetik, lepaskan dari state animasi menjadi kartu statis
          finishTimer = setTimeout(() => {
            if (onAnimationComplete) {
              onAnimationComplete(item.id);
            }
          }, 420);
        }
      }, 42); // Kecepatan 42ms per langkah: rapi, tenang, dan mudah diikuti mata
    }, 260);

    return () => {
      clearTimeout(startDelay);
      if (interval) clearInterval(interval);
      if (finishTimer) clearTimeout(finishTimer);
    };
  }, [totalSteps, item.id, onAnimationComplete]);

  // Hitung teks yang tampil berdasarkan step terstruktur saat ini
  let displayedTitle = '';
  let displayedSubtitle = '';
  let displayedAmount = '';
  let currentCursor = 'none'; // 'title' | 'sub' | 'amount' | 'none'

  if (isFinished) {
    displayedTitle = fullTitle;
    displayedSubtitle = fullSubtitle;
    displayedAmount = fullAmount;
    currentCursor = 'none';
  } else if (stepProgress === 0) {
    currentCursor = 'title';
  } else if (stepProgress <= L1) {
    displayedTitle = fullTitle.slice(0, stepProgress);
    currentCursor = 'title';
  } else if (stepProgress <= L1 + PAUSE_1) {
    // Jeda tenang di akhir judul sebelum pindah ke baris bawah
    displayedTitle = fullTitle;
    currentCursor = 'title';
  } else if (stepProgress <= L1 + PAUSE_1 + L2) {
    displayedTitle = fullTitle;
    displayedSubtitle = fullSubtitle.slice(0, stepProgress - L1 - PAUSE_1);
    currentCursor = 'sub';
  } else if (stepProgress <= L1 + PAUSE_1 + L2 + PAUSE_2) {
    // Jeda tenang di akhir subjudul sebelum pindah ke nominal kanan
    displayedTitle = fullTitle;
    displayedSubtitle = fullSubtitle;
    currentCursor = 'sub';
  } else {
    displayedTitle = fullTitle;
    displayedSubtitle = fullSubtitle;
    displayedAmount = fullAmount.slice(0, stepProgress - L1 - PAUSE_1 - L2 - PAUSE_2);
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
        <span className="transaction-title" style={{ textAlign: 'left', direction: 'ltr', display: 'inline-flex', alignItems: 'center', minHeight: '20px' }}>
          <span>{displayedTitle}</span>
          {currentCursor === 'title' && <span className="typewriter-cursor">|</span>}
        </span>
        <span className="transaction-category" style={{ textAlign: 'left', direction: 'ltr', display: 'inline-flex', alignItems: 'center', minHeight: '16px' }}>
          <span>{displayedSubtitle}</span>
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
        <div
          className={`transaction-amount ${item.type === 'expense' ? 'negative' : 'positive'}`}
          style={{
            textAlign: 'right',
            direction: 'ltr',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            fontVariantNumeric: 'tabular-nums'
          }}
        >
          <span>{displayedAmount}</span>
          {currentCursor === 'amount' && <span className="typewriter-cursor">|</span>}
        </div>
      </div>
    </div>
  );
}

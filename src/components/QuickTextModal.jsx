import React, { useState, useEffect, useRef, useMemo } from 'react';
import { parseVoiceTransaction } from '../utils/voiceParser';
import { formatMoney } from '../utils/currency';

export default function QuickTextModal({
  isOpen,
  onClose,
  expenseCategories,
  incomeCategories,
  accountsList,
  handleSaveVoiceTransaction,
  showVoiceToast
}) {
  const [textInput, setTextInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setTextInput('');
      setIsSubmitting(false);
      const timer = setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Live Parsing real-time saat pengguna mengetik
  const parsedPreview = useMemo(() => {
    const raw = (textInput || '').trim();
    if (!raw || raw.length < 2) return null;
    try {
      const res = parseVoiceTransaction(raw, {
        expenseCategories,
        incomeCategories,
        accountsList
      });
      if (res && res.success) {
        return res;
      }
    } catch {
      // ignore parsing error while typing
    }
    return null;
  }, [textInput, expenseCategories, incomeCategories, accountsList]);

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    const raw = (textInput || '').trim();
    if (!raw || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const result = parseVoiceTransaction(raw, {
        expenseCategories,
        incomeCategories,
        accountsList
      });

      if (!result || !result.success) {
        if (showVoiceToast) {
          showVoiceToast(result?.message || 'Kalimat belum dapat dipahami. Coba: "kopi 18k gopay"');
        }
        setIsSubmitting(false);
        return;
      }

      handleSaveVoiceTransaction(result);
      onClose();
    } catch (err) {
      console.error('Quick text submit error:', err);
      if (showVoiceToast) {
        showVoiceToast('Gagal memproses kalimat.');
      }
      setIsSubmitting(false);
    }
  };

  const handleApplySuggestion = (exampleText) => {
    setTextInput(exampleText);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="quick-text-modal-overlay" onClick={onClose}>
      <div 
        className="quick-text-modal-card" 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="quick-text-header">
          <div className="quick-text-title-wrapper">
            <span className="quick-text-sparkle">⚡</span>
            <span className="quick-text-title">Teks Cepat</span>
          </div>
          <button 
            type="button" 
            className="quick-text-close-btn" 
            onClick={onClose}
            aria-label="Tutup"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="quick-text-form">
          <div className="quick-text-input-wrapper">
            <input
              ref={inputRef}
              type="text"
              className="quick-text-input"
              placeholder=""
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              autoComplete="off"
              autoCorrect="off"
              spellCheck="false"
            />
            {textInput && (
              <button
                type="button"
                className="quick-text-clear-btn"
                onClick={() => {
                  setTextInput('');
                  if (inputRef.current) inputRef.current.focus();
                }}
              >
                ✕
              </button>
            )}
          </div>

          {/* Live Interpretation Preview Chips */}
          {parsedPreview && (
            <div className="quick-text-preview-box">
              <span className="quick-text-preview-label">Deteksi Otomatis:</span>
              <div className="quick-text-chips-row">
                {parsedPreview.action === 'DELETE' ? (
                  <span className="quick-chip chip-delete">
                    🗑️ Hapus {parsedPreview.isMultipleDelete
                      ? (parsedPreview.deleteAllMatching
                          ? `Semua ${parsedPreview.targetCategory || parsedPreview.targetQuery || (parsedPreview.timeRange === 'today' ? 'Hari Ini' : 'Transaksi')}`
                          : `${parsedPreview.deleteCount} Transaksi Terakhir`)
                      : (parsedPreview.isLast ? 'Terakhir' : parsedPreview.targetQuery || (parsedPreview.targetAmount ? formatMoney(parsedPreview.targetAmount) : ''))}
                  </span>
                ) : parsedPreview.action === 'QUERY' ? (
                  <span className="quick-chip chip-type expense" style={{ background: '#EDE4FF', color: '#6B21A8' }}>
                    ✨ Tanya AI: {parsedPreview.queryType} ({parsedPreview.timeRange})
                  </span>
                ) : (
                  <>
                    <span className={`quick-chip chip-type ${(parsedPreview.type || 'expense').toLowerCase()}`}>
                      {(parsedPreview.type || '').toLowerCase() === 'income' ? '📥 Pemasukan' : '📤 Pengeluaran'}
                    </span>
                    {parsedPreview.amount ? (
                      <span className="quick-chip chip-amount">
                        💰 {formatMoney(parsedPreview.amount)}
                      </span>
                    ) : null}
                    {parsedPreview.category ? (
                      <span className="quick-chip chip-category">
                        🏷️ {typeof parsedPreview.category === 'object' ? (parsedPreview.category.name || parsedPreview.category.id) : parsedPreview.category}
                      </span>
                    ) : null}
                    {parsedPreview.account ? (
                      <span className="quick-chip chip-account">
                        💳 {typeof parsedPreview.account === 'object' ? (parsedPreview.account.name || parsedPreview.account.id) : parsedPreview.account}
                      </span>
                    ) : null}
                    {parsedPreview.note && parsedPreview.note !== (typeof parsedPreview.category === 'object' ? parsedPreview.category.name : parsedPreview.category) ? (
                      <span className="quick-chip chip-note">
                        📝 {typeof parsedPreview.note === 'object' ? (parsedPreview.note.name || parsedPreview.note.title) : parsedPreview.note}
                      </span>
                    ) : null}
                  </>
                )}
              </div>
            </div>
          )}

          {/* Quick Suggestions / Examples */}
          {!textInput && (
            <div className="quick-text-suggestions">
              <span className="quick-text-sugg-title">Contoh Cepat:</span>
              <div className="quick-text-sugg-chips">
                <button
                  type="button"
                  className="quick-sugg-pill"
                  onClick={() => handleApplySuggestion('kopi 18k gopay')}
                >
                  ☕ kopi 18k gopay
                </button>
                <button
                  type="button"
                  className="quick-sugg-pill"
                  onClick={() => handleApplySuggestion('bensin 30rb tunai')}
                >
                  ⛽ bensin 30rb tunai
                </button>
                <button
                  type="button"
                  className="quick-sugg-pill"
                  onClick={() => handleApplySuggestion('gaji 5jt bca')}
                >
                  💵 gaji 5jt bca
                </button>
                <button
                  type="button"
                  className="quick-sugg-pill"
                  onClick={() => handleApplySuggestion('makan siang 25k')}
                >
                  🍛 makan siang 25k
                </button>
              </div>
            </div>
          )}

          <div className="quick-text-actions">
            <button
              type="submit"
              className="quick-text-submit-btn"
              disabled={!textInput.trim() || isSubmitting}
            >
              {isSubmitting ? 'Memproses...' : 'Simpan Transaksi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

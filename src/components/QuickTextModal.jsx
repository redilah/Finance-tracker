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

  const STORAGE_KEY = 'cassiel_custom_quick_texts';
  const DEFAULT_SUGGESTION = 'kopi 18k gopay';

  // Load custom shortcuts from localStorage
  const [customChips, setCustomChips] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed.filter(item => typeof item === 'string' && item.trim().length > 0);
      }
    } catch (e) {
      console.warn('Failed reading custom quick texts', e);
    }
    return [];
  });

  const [isAddingChip, setIsAddingChip] = useState(false);
  const [newChipInput, setNewChipInput] = useState('');
  const newChipInputRef = useRef(null);

  // Sync custom chips to localStorage
  const saveCustomChips = (updated) => {
    setCustomChips(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed saving custom quick texts', e);
    }
  };

  const handleAddChipSubmit = (e) => {
    if (e) e.preventDefault();
    const clean = (newChipInput || '').trim();
    if (!clean) {
      setIsAddingChip(false);
      return;
    }
    // Prevent duplicate with default or existing
    if (clean.toLowerCase() === DEFAULT_SUGGESTION.toLowerCase() || customChips.some(c => c.toLowerCase() === clean.toLowerCase())) {
      if (showVoiceToast) showVoiceToast('Aksi cepat ini sudah ada!');
      setNewChipInput('');
      setIsAddingChip(false);
      return;
    }
    const next = [...customChips, clean];
    saveCustomChips(next);
    setNewChipInput('');
    setIsAddingChip(false);
    if (showVoiceToast) showVoiceToast('Aksi cepat berhasil ditambahkan ✨');
  };

  const handleDeleteCustomChip = (chipText, e) => {
    if (e) e.stopPropagation();
    const next = customChips.filter(c => c !== chipText);
    saveCustomChips(next);
    if (showVoiceToast) showVoiceToast('Aksi cepat dihapus');
  };

  const handleSaveCurrentAsChip = () => {
    const clean = (textInput || '').trim();
    if (!clean) return;
    if (clean.toLowerCase() === DEFAULT_SUGGESTION.toLowerCase() || customChips.some(c => c.toLowerCase() === clean.toLowerCase())) {
      if (showVoiceToast) showVoiceToast('Aksi cepat ini sudah ada!');
      return;
    }
    const next = [...customChips, clean];
    saveCustomChips(next);
    if (showVoiceToast) showVoiceToast('Tersimpan ke Aksi Cepat 📌');
  };

  const handleApplySuggestion = (exampleText) => {
    setTextInput(exampleText);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  if (!isOpen) return null;

  const isCurrentTextAlreadySaved = textInput.trim().length > 2 && (
    textInput.trim().toLowerCase() === DEFAULT_SUGGESTION.toLowerCase() ||
    customChips.some(c => c.toLowerCase() === textInput.trim().toLowerCase())
  );

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
              placeholder="Ketik transaksi... (cth: kopi 18k gopay)"
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

          {/* Quick Save Current Input to Action Chip */}
          {parsedPreview && !isCurrentTextAlreadySaved && (
            <div className="quick-text-save-action-row">
              <button
                type="button"
                className="quick-text-pin-chip-btn"
                onClick={handleSaveCurrentAsChip}
              >
                <span>📌</span> Simpan teks ini ke Aksi Cepat
              </button>
            </div>
          )}

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

          {/* Quick Suggestions & Custom User Chips */}
          <div className="quick-text-suggestions">
            <div className="quick-text-sugg-header">
              <span className="quick-text-sugg-title">Aksi Cepat:</span>
              {!isAddingChip && (
                <button
                  type="button"
                  className="quick-add-chip-trigger"
                  onClick={() => {
                    setIsAddingChip(true);
                    setTimeout(() => {
                      if (newChipInputRef.current) newChipInputRef.current.focus();
                    }, 80);
                  }}
                >
                  + Tambah
                </button>
              )}
            </div>

            {/* Inline Add Chip Form */}
            {isAddingChip && (
              <div className="quick-add-chip-inline-box">
                <input
                  ref={newChipInputRef}
                  type="text"
                  className="quick-add-chip-inline-input"
                  placeholder="Cth: makan siang 20k bca..."
                  value={newChipInput}
                  onChange={(e) => setNewChipInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddChipSubmit();
                    } else if (e.key === 'Escape') {
                      setIsAddingChip(false);
                      setNewChipInput('');
                    }
                  }}
                />
                <button
                  type="button"
                  className="quick-add-chip-save-btn"
                  onClick={handleAddChipSubmit}
                  disabled={!newChipInput.trim()}
                >
                  Simpan
                </button>
                <button
                  type="button"
                  className="quick-add-chip-cancel-btn"
                  onClick={() => {
                    setIsAddingChip(false);
                    setNewChipInput('');
                  }}
                >
                  ✕
                </button>
              </div>
            )}

            <div className="quick-text-sugg-chips">
              {/* Default Single Example */}
              <button
                type="button"
                className="quick-sugg-pill is-default"
                onClick={() => handleApplySuggestion(DEFAULT_SUGGESTION)}
                title="Contoh bawaan"
              >
                ☕ {DEFAULT_SUGGESTION}
              </button>

              {/* User Custom Chips */}
              {customChips.map((chipText, idx) => (
                <div key={`${chipText}-${idx}`} className="quick-sugg-pill-custom-wrapper">
                  <button
                    type="button"
                    className="quick-sugg-pill is-custom"
                    onClick={() => handleApplySuggestion(chipText)}
                  >
                    ✨ {chipText}
                  </button>
                  <button
                    type="button"
                    className="quick-sugg-chip-delete-btn"
                    onClick={(e) => handleDeleteCustomChip(chipText, e)}
                    title="Hapus aksi cepat ini"
                    aria-label={`Hapus ${chipText}`}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>

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

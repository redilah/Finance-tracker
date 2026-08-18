import React, { useState, useEffect, useCallback } from 'react';
import './PinSetupModal.css';
import { saveUserPin } from '../utils/authPin';

export default function PinSetupModal({ isOpen, onClose, onSuccess, t, isChangeMode = false }) {
  // Step 1: 'initial' (Masukkan PIN), Step 2: 'confirm' (Konfirmasi PIN)
  const [step, setStep] = useState('initial');
  const [firstPin, setFirstPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isShaking, setIsShaking] = useState(false);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setStep('initial');
      setFirstPin('');
      setConfirmPin('');
      setErrorMessage('');
      setIsLoading(false);
      setIsShaking(false);
    }
  }, [isOpen]);

  const currentPin = step === 'initial' ? firstPin : confirmPin;

  const triggerErrorShake = (msg) => {
    setErrorMessage(msg);
    setIsShaking(true);
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try { navigator.vibrate([80, 50, 80]); } catch {}
    }
    setTimeout(() => {
      setIsShaking(false);
    }, 600);
  };

  const handleKeyPress = (numStr) => {
    if (isLoading) return;
    setErrorMessage('');

    if (step === 'initial') {
      if (firstPin.length < 6) {
        const next = firstPin + numStr;
        setFirstPin(next);
        // Begitu 6 digit selesai diketik di langkah 1 -> Langsung otomatis beralih ke langkah konfirmasi
        if (next.length === 6) {
          setTimeout(() => {
            setStep('confirm');
            setConfirmPin('');
          }, 200);
        }
      }
    } else {
      if (confirmPin.length < 6) {
        const next = confirmPin + numStr;
        setConfirmPin(next);
      }
    }
  };

  const handleBackspace = () => {
    if (isLoading) return;
    setErrorMessage('');
    if (step === 'initial') {
      setFirstPin(prev => prev.slice(0, -1));
    } else {
      setConfirmPin(prev => prev.slice(0, -1));
    }
  };

  const handleConfirmSubmit = async () => {
    if (isLoading) return;
    if (confirmPin.length !== 6) {
      triggerErrorShake(t ? t('pinIncomplete') || 'PIN harus 6 digit' : 'PIN harus 6 digit');
      return;
    }

    if (firstPin !== confirmPin) {
      triggerErrorShake(t ? t('pinMismatch') || 'PIN konfirmasi tidak cocok. Coba lagi.' : 'PIN konfirmasi tidak cocok. Coba lagi.');
      setConfirmPin('');
      return;
    }

    // Cocok -> Tampilkan animasi putar (spinner) sebentar lalu simpan
    setIsLoading(true);
    try {
      await saveUserPin(confirmPin);
      setTimeout(() => {
        setIsLoading(false);
        if (onSuccess) onSuccess();
        if (onClose) onClose();
      }, 700);
    } catch (err) {
      console.error('Error saving PIN:', err);
      setIsLoading(false);
      triggerErrorShake('Gagal menyimpan PIN. Coba lagi.');
    }
  };

  if (!isOpen) return null;

  const pageTitle = isChangeMode
    ? (t ? t('changePinTitle') || 'Ubah PIN' : 'Ubah PIN')
    : (t ? t('setPinTitle') || 'Atur PIN' : 'Atur PIN');

  const stepSubtitle = step === 'initial'
    ? (isChangeMode 
        ? (t ? t('enterNewPin') || 'Masukkan PIN Baru' : 'Masukkan PIN Baru')
        : (t ? t('enterInitialPin') || 'Masukkan PIN' : 'Masukkan PIN'))
    : (t ? t('confirmPinTitle') || 'Konfirmasi PIN' : 'Konfirmasi PIN');

  return (
    <div className="modal-overlay profile-setup-overlay full-page-profile-screen pin-screen-overlay">
      <div className="wa-profile-screen-container pin-setup-screen">
        {/* Top Header: Teks judul berada dekat di sebelah tombol panah back */}
        <div className="wa-profile-top-header pin-setup-header">
          <div className="pin-setup-header-left">
            <button
              type="button"
              className="back-btn pin-back-arrow-btn"
              onClick={onClose}
              aria-label="Kembali"
              disabled={isLoading}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
            </button>
            <h3 className="pin-header-title">{pageTitle}</h3>
          </div>
        </div>

        {/* PIN Body Content */}
        <div className="pin-body-content">
          <p className="pin-prompt-text">{stepSubtitle}</p>

          {/* 6 PIN Indicator Dots */}
          <div className={`pin-dots-container ${isShaking ? 'shake-animation' : ''}`}>
            {[0, 1, 2, 3, 4, 5].map(idx => (
              <span
                key={idx}
                className={`pin-dot ${idx < currentPin.length ? 'filled' : ''}`}
              />
            ))}
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="pin-error-banner">
              {errorMessage}
            </div>
          )}

          {/* Numeric Keypad: Tombol angka bulat, tombol hapus tanpa bulat */}
          <div className="pin-keypad-grid">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
              <button
                key={num}
                type="button"
                className="pin-key-btn"
                onClick={() => handleKeyPress(String(num))}
                disabled={isLoading}
              >
                {num}
              </button>
            ))}

            {/* Row 4: Placeholder, 0, Backspace (Tanpa bulat) */}
            <div className="pin-key-btn-placeholder" />

            <button
              type="button"
              className="pin-key-btn"
              onClick={() => handleKeyPress('0')}
              disabled={isLoading}
            >
              0
            </button>

            <button
              type="button"
              className="pin-backspace-plain-btn"
              onClick={handleBackspace}
              disabled={isLoading}
              aria-label="Hapus Digit"
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z"/>
                <line x1="18" y1="9" x2="12" y2="15"/>
                <line x1="12" y1="9" x2="18" y2="15"/>
              </svg>
            </button>
          </div>

          {/* Tombol Konfirmasi / Loading Spinner di Langkah Kedua */}
          {step === 'confirm' && (
            <div className="pin-submit-container">
              <button
                type="button"
                className="pin-confirm-action-btn"
                onClick={handleConfirmSubmit}
                disabled={confirmPin.length !== 6 || isLoading}
              >
                {isLoading ? (
                  <span className="pin-spinner" />
                ) : (
                  <span>{t ? t('confirmPinAction') || 'Konfirmasi PIN' : 'Konfirmasi PIN'}</span>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

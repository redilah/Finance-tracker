import React, { useState, useEffect, useCallback } from 'react';
import './PinLockScreen.css';
import { verifyUserPin, isBiometricEnabled, authenticateWithBiometrics } from '../utils/authPin';
import { CURRENT_VERSION_NAME, CURRENT_VERSION_CODE } from '../utils/version';
import fingerprintSvg from '../assets/fingerprint.svg';

export default function PinLockScreen({ onUnlockSuccess, t }) {
  const [pin, setPin] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isShaking, setIsShaking] = useState(false);
  const [isAuthenticatingBio, setIsAuthenticatingBio] = useState(false);

  const isBioActive = isBiometricEnabled();

  const triggerErrorShake = (msg) => {
    setErrorMessage(msg);
    setIsShaking(true);
    setPin('');
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try { navigator.vibrate([100, 50, 100]); } catch {}
    }
    setTimeout(() => {
      setIsShaking(false);
    }, 600);
  };

  const handleBiometricAuth = useCallback(async () => {
    if (!isBioActive || isAuthenticatingBio) return;
    setIsAuthenticatingBio(true);
    try {
      const res = await authenticateWithBiometrics(
        t ? t('biometricPromptReason') || 'Verifikasi sidik jari untuk masuk ke Cassiel' : 'Verifikasi sidik jari untuk masuk ke Cassiel'
      );
      if (res && res.success === true) {
        if (onUnlockSuccess) onUnlockSuccess();
      }
    } catch (e) {
      console.log('Biometric prompt dismissed or failed:', e);
    } finally {
      setIsAuthenticatingBio(false);
    }
  }, [isBioActive, isAuthenticatingBio, onUnlockSuccess, t]);

  // Otomatis memicu dialog sidik jari HP saat lock screen pertama kali muncul jika sidik jari aktif
  useEffect(() => {
    if (isBioActive) {
      const timer = setTimeout(() => {
        handleBiometricAuth();
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [isBioActive, handleBiometricAuth]);

  // Validasi PIN otomatis begitu 6 digit selesai diketik
  const handlePinSubmit = useCallback(async (fullPin) => {
    const isValid = await verifyUserPin(fullPin);
    if (isValid) {
      if (onUnlockSuccess) onUnlockSuccess();
    } else {
      triggerErrorShake(t ? t('pinWrong') || 'PIN yang Anda masukkan salah' : 'PIN yang Anda masukkan salah');
    }
  }, [onUnlockSuccess, t]);

  const handleKeyPress = (numStr) => {
    if (pin.length < 6) {
      setErrorMessage('');
      const nextPin = pin + numStr;
      setPin(nextPin);
      if (nextPin.length === 6) {
        setTimeout(() => {
          handlePinSubmit(nextPin);
        }, 150);
      }
    }
  };

  const handleBackspace = () => {
    setErrorMessage('');
    setPin(prev => prev.slice(0, -1));
  };

  return (
    <div className="pin-lock-screen-container">
      {/* Dynamic App Version di Pojok Kanan Atas */}
      <div className="pin-lock-version-tag">
        {`Versi ${CURRENT_VERSION_NAME} (${CURRENT_VERSION_CODE})`}
      </div>

      <div className="pin-lock-inner">
        {/* Title */}
        <h2 className="pin-lock-title">
          {t ? t('enterYourPin') || 'Masukkan PIN kamu' : 'Masukkan PIN kamu'}
        </h2>

        {/* 6 PIN Indicator Dots */}
        <div className={`pin-dots-container lock-dots ${isShaking ? 'shake-animation' : ''}`}>
          {[0, 1, 2, 3, 4, 5].map(idx => (
            <span
              key={idx}
              className={`pin-dot lock-dot ${idx < pin.length ? 'filled' : ''}`}
            />
          ))}
        </div>

        {/* Error Message Feedback */}
        {errorMessage && (
          <div className="pin-lock-error-text">
            {errorMessage}
          </div>
        )}

        {/* Keypad Grid (Bulat dengan Bayangan Halus) */}
        <div className="pin-keypad-grid lock-keypad">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
            <button
              key={num}
              type="button"
              className="pin-key-btn lock-key-btn"
              onClick={() => handleKeyPress(String(num))}
            >
              {num}
            </button>
          ))}

          {/* Row 4: Biometric Icon (jika aktif), 0, Backspace */}
          {isBioActive ? (
            <button
              type="button"
              className="pin-bio-plain-btn"
              onClick={handleBiometricAuth}
              aria-label="Masuk dengan Sidik Jari"
              title="Sidik Jari"
            >
              <img src={fingerprintSvg} alt="Sidik Jari" width="30" height="30" style={{ objectFit: 'contain' }} />
            </button>
          ) : (
            <div className="pin-key-btn-placeholder" />
          )}

          <button
            type="button"
            className="pin-key-btn lock-key-btn"
            onClick={() => handleKeyPress('0')}
          >
            0
          </button>

          <button
            type="button"
            className="pin-lock-backspace-plain-btn"
            onClick={handleBackspace}
            aria-label="Hapus Digit"
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z"/>
              <line x1="18" y1="9" x2="12" y2="15"/>
              <line x1="12" y1="9" x2="18" y2="15"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect, useCallback } from 'react';
import './PinLockScreen.css';
import { verifyUserPin, isBiometricEnabled, authenticateWithBiometrics } from '../utils/authPin';
import { CURRENT_VERSION_NAME, CURRENT_VERSION_CODE } from '../utils/version';

export default function PinLockScreen({ onUnlockSuccess, t }) {
  const [pin, setPin] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isShaking, setIsShaking] = useState(false);
  const [isAuthenticatingBio, setIsAuthenticatingBio] = useState(false);

  const isBioActive = isBiometricEnabled();
  // Ref untuk menandai bahwa auto-prompt saat inisialisasi sudah berjalan 1x
  const hasAutoPromptedRef = React.useRef(false);
  // Ref untuk mencegah concurrent/overlapping prompt invocation
  const isCallingBioRef = React.useRef(false);

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
    if (!isBioActive || isCallingBioRef.current) return;
    isCallingBioRef.current = true;
    setIsAuthenticatingBio(true);
    try {
      const res = await authenticateWithBiometrics(
        t ? t('biometricPromptReason') || 'Verifikasi sidik jari untuk masuk ke Cassiel' : 'Verifikasi sidik jari untuk masuk ke Cassiel'
      );
      if (res && res.success === true) {
        if (onUnlockSuccess) onUnlockSuccess();
      }
      // Jika user klik Batal / Gunakan PIN, fungsi selesai tanpa re-trigger
    } catch (e) {
      console.log('Biometric prompt dismissed or failed:', e);
    } finally {
      isCallingBioRef.current = false;
      setIsAuthenticatingBio(false);
    }
  }, [isBioActive, onUnlockSuccess, t]);

  // Otomatis memicu dialog sidik jari HP HANYA 1x saat lock screen pertama kali dibuka (mount)
  useEffect(() => {
    if (isBioActive && !hasAutoPromptedRef.current) {
      hasAutoPromptedRef.current = true;
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
        {`${t ? (t('version') || 'Versi') : 'Versi'} ${CURRENT_VERSION_NAME} (${CURRENT_VERSION_CODE})`}
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
              aria-label={t ? (t('unlockWithFingerprint') || 'Masuk dengan Sidik Jari') : 'Masuk dengan Sidik Jari'}
              title={t ? (t('fingerprint') || 'Sidik Jari') : 'Sidik Jari'}
            >
              <svg width="28" height="28" viewBox="0 0 512 512" fill="currentColor">
                <path d="M239.83 0.08C251.25 0.08 262.66 0.08 274.08 0.08C277.79 1.31 282.05 0.88 285.93 1.37C295.76 2.61 305.61 3.44 315.38 5.18C340.86 9.72 365.39 18.5 389.03 28.72C398.94 33.01 424.65 41.35 415.89 56.57C407.57 71.04 388.15 56.27 377.68 51.76C338.88 35.08 298.64 25.41 256 25.68C213.28 25.95 172.85 35.06 133.87 51.8C123.97 56.05 103.79 71.41 96.18 56.47C90.01 44.37 101.74 39.01 110.23 34.72C114.96 32.33 119.63 29.93 124.51 27.91C148.04 18.18 171.57 10.16 196.68 5.3C206.85 3.33 217.21 2.59 227.48 1.32C231.44 0.83 236.06 1.4 239.83 0.08ZM254.63 62.4C269.68 61.85 285.15 63.58 299.98 65.78C354.41 73.83 405.24 96.73 446.13 133.91C458.26 144.94 469.61 157.14 479.3 170.38C483.92 176.7 488.66 182.21 484.74 190.42C481.37 197.45 470.85 198.46 465.29 193.75C461.09 190.18 458.24 184.65 454.81 180.38C451.84 176.67 448.62 173.17 445.59 169.52C436.2 158.2 424.43 148.13 412.81 139.18C368.37 104.97 311.9 87.9 256 88.01C199.85 88.12 142.79 105.37 98.47 140.29C87.05 149.29 75.73 159.23 66.34 170.38C63 174.34 59.44 178.2 56.35 182.36C53.41 186.31 50.59 191.59 46.7 194.66C41.05 199.12 30.74 198.37 27.32 191.31C23.34 183.1 28.05 177.32 32.8 170.99C42.36 158.27 52.94 146.3 64.7 135.55C119.52 85.39 181.03 65.1 254.63 62.4ZM333.41 511.92C331.36 511.92 329.31 511.92 327.26 511.92C325.81 510.51 322.88 510.37 320.97 509.74C315.89 508.05 310.74 506.6 305.71 504.79C290.95 499.47 276.14 492.76 263.17 483.77C218.56 452.86 186.53 406.15 178.84 352.11C174.83 323.96 175.33 299.08 194.31 276.36C202.93 266.04 214.82 258.25 227.36 253.74C237.73 250.01 248.21 248.62 259.27 248.94C290.98 249.86 321.14 271.59 330.79 302.07C334.3 313.16 332.7 323.52 335.24 334.08C339.17 350.41 351.06 362.75 366.06 369.65C395.04 382.97 433.15 364.78 439.78 333.46C441.16 326.93 440.32 320.55 440.08 313.98C439.36 294.25 434.4 273.03 425.74 255.25C413.41 229.95 396.03 206.53 373.38 189.35C299.27 133.13 192.81 135.96 124.24 200.21C97.65 225.13 78.65 258.37 73.15 294.47C70.39 312.63 70.86 331.24 72.15 349.52C73.33 366.23 77.48 383.13 82.2 399.1C84.16 405.72 88.15 412.77 88.8 419.65C89.71 429.28 80.01 435.5 71.45 432.77C63.69 430.3 61.98 419.78 59.77 413.16C53.1 393.14 49.44 372.78 46.76 351.85C42.9 321.7 45.17 288.52 55.25 259.8C73.85 206.74 115.8 165.53 166.35 142.28C250.32 103.65 357.21 126.62 417.68 196.48C434.15 215.51 446.55 237.4 446.55 260.87C462.37 280.16 468.69 311.8 465.76 332.22C457.52 389.77 392.02 417.74 343.35 386.77C326.84 376.27 314.57 359.08 310.17 340.07C306.09 322.46 310.56 314.25 299.75 297.12C296.9 292.6 292.53 288.84 288.34 285.64C264.83 267.63 229.12 272.34 211.3 296.17C198.94 312.69 201.38 334.11 204.71 353.27C213.01 400.96 244.74 445.41 287.5 468.77C297.84 474.42 308.72 478.85 319.8 482.77C325.26 484.7 331.74 485.3 336.77 488.27C343.13 492.03 344.83 500.91 340.56 506.81C338.63 509.48 335.56 509.87 333.41 511.92ZM247.61 186.3C306.85 182.56 369.93 217.54 391.15 274.46C395.99 287.42 399.18 300.05 400.44 313.92C401.04 320.45 402.15 327.38 397.44 332.67C391.17 339.71 379.85 336.79 376.28 328.59C374.28 324.01 375.22 317.9 374.87 313.04C374.59 309.08 373.79 304.61 372.86 300.74C366.85 275.8 351.95 251.31 330.63 236.33C274.9 197.17 200.77 204.82 158.29 259.52C123 304.96 135.14 381.29 163.18 427.58C171.97 442.1 181.25 455.69 192.3 468.63C197.29 474.47 206.33 481 209.7 487.68C214.91 498 205.51 507.72 195.21 505.9C188.92 504.78 178.21 491.18 173.79 486.19C155.4 465.44 139.61 441.61 128.81 416.13C114.51 382.4 105.21 330.84 114.2 294.85C129.84 232.28 183.73 190.33 247.61 186.3ZM252.37 311.57C258.51 310.23 266.08 315.07 267.02 321.46C268.52 331.67 268.17 341.86 271.14 351.86C278.85 377.8 294.64 398.7 316.36 414.73C334.83 428.36 359.14 433.6 381.78 433.51C386.35 433.49 391.25 433.36 395.78 432.82C401.22 432.18 408.12 429.86 413.55 431.18C422.12 433.26 427.22 444.43 420.88 451.5C416.65 456.22 411.96 456.22 406.09 457.31C393.55 459.63 379.46 460.01 366.81 458.33C354.46 456.69 342.64 454.86 330.83 450.76C294.12 438.01 268.66 409.63 252.32 375.41C245.88 361.91 242.22 345.33 241.98 330.36C241.85 321.76 242.31 313.76 252.37 311.57Z" fill="currentColor"/>
              </svg>
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
            aria-label={t ? (t('deleteDigit') || 'Hapus Digit') : 'Hapus Digit'}
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

import React, { useState, useEffect } from 'react';
import './AuthModal.css';
import { 
  loginWithEmail, 
  registerWithEmail, 
  loginWithGoogle, 
  sendPasswordReset, 
  logoutUser, 
  syncLocalDataToFirestore, 
  fetchCloudDataFromFirestore 
} from '../utils/authService';

/**
 * Official Google 4-Color Vector Logo
 */
export const GoogleLogo = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
    <path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      fill="#4285F4"
    />
    <path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      fill="#FBBC05"
    />
    <path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      fill="#EA4335"
    />
  </svg>
);

export default function AuthModal({
  isOpen,
  onClose,
  currentUser,
  onUserChange,
  localDataPayload,
  onRestoreData,
  onShowToast
}) {
  const [mode, setMode] = useState('login'); // 'login' | 'register' | 'forgot'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [lastSyncTime, setLastSyncTime] = useState(() => {
    return localStorage.getItem('cassiel_last_cloud_sync') || '';
  });

  // Reset form when screen opens/closes
  useEffect(() => {
    if (isOpen) {
      setErrorMsg('');
      setSuccessMsg('');
      if (!currentUser) {
        setMode('login');
      }
    }
  }, [isOpen, currentUser]);

  if (!isOpen) return null;

  const showToast = (msg) => {
    if (onShowToast) {
      onShowToast(msg);
    } else {
      setSuccessMsg(msg);
    }
  };

  const handleEmailAuth = async (e) => {
    e?.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!email.trim()) {
      setErrorMsg('Silakan masukkan alamat email.');
      return;
    }

    if (mode !== 'forgot' && !password) {
      setErrorMsg('Silakan masukkan kata sandi.');
      return;
    }

    setIsLoading(true);

    try {
      if (mode === 'login') {
        const res = await loginWithEmail(email, password);
        if (res.success) {
          showToast('Berhasil masuk ke akun Anda!');
          onUserChange?.(res.user);
          if (localDataPayload) {
            syncLocalDataToFirestore(res.user, localDataPayload);
          }
        } else {
          setErrorMsg(res.error);
        }
      } else if (mode === 'register') {
        const res = await registerWithEmail(email, password, displayName);
        if (res.success) {
          showToast('Akun berhasil dibuat!');
          onUserChange?.(res.user);
          if (localDataPayload) {
            syncLocalDataToFirestore(res.user, localDataPayload);
          }
        } else {
          setErrorMsg(res.error);
        }
      } else if (mode === 'forgot') {
        const res = await sendPasswordReset(email);
        if (res.success) {
          setSuccessMsg(`Tautan pemulihan kata sandi telah dikirim ke ${email}. Silakan periksa kotak masuk atau spam.`);
        } else {
          setErrorMsg(res.error);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setErrorMsg('');
    setSuccessMsg('');
    setIsLoading(true);

    try {
      const res = await loginWithGoogle();
      if (res.success) {
        showToast('Berhasil terhubung dengan Google!');
        onUserChange?.(res.user);
        if (localDataPayload) {
          syncLocalDataToFirestore(res.user, localDataPayload);
        }
      } else {
        setErrorMsg(res.error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualSync = async () => {
    if (!currentUser) return;
    setIsLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await syncLocalDataToFirestore(currentUser, localDataPayload);
      if (res.success) {
        const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        localStorage.setItem('cassiel_last_cloud_sync', nowStr);
        setLastSyncTime(nowStr);
        setSuccessMsg('Data berhasil dicadangkan ke Cloud Firestore!');
        showToast('Data berhasil dicadangkan ke Cloud!');
      } else {
        setErrorMsg(res.error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualRestore = async () => {
    if (!currentUser) return;
    setIsLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await fetchCloudDataFromFirestore(currentUser);
      if (res.success && res.data) {
        if (onRestoreData) {
          onRestoreData(res.data);
          setSuccessMsg('Data cloud berhasil disinkronkan ke aplikasi!');
          showToast('Data cloud berhasil dipulihkan!');
        } else {
          setSuccessMsg('Data cadangan ditemukan di Cloud.');
        }
      } else if (res.success) {
        setSuccessMsg('Belum ada data cadangan di cloud untuk akun ini.');
      } else {
        setErrorMsg(res.error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      await logoutUser();
      onUserChange?.(null);
      setSuccessMsg('Berhasil keluar.');
      showToast('Berhasil keluar dari akun.');
    } finally {
      setIsLoading(false);
    }
  };

  const getPageTitle = () => {
    if (currentUser) return 'Akun & Cloud Sync';
    if (mode === 'login') return 'Masuk ke Akun';
    if (mode === 'register') return 'Buat Akun Baru';
    if (mode === 'forgot') return 'Pemulihan Sandi';
    return 'Akun Pengguna';
  };

  return (
    <div className="auth-fullscreen-page">
      <div className="auth-fullscreen-container">
        {/* Full-Page Top Bar Header */}
        <div className="auth-fullscreen-header">
          <button 
            type="button" 
            className="auth-back-btn" 
            onClick={onClose}
            aria-label="Kembali"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"/>
              <polyline points="12 19 5 12 12 5"/>
            </svg>
          </button>
          <h3 className="auth-header-title">{getPageTitle()}</h3>
          <div style={{ width: 40 }} />
        </div>

        {/* Scrollable Content Body */}
        <div className="auth-fullscreen-body">
          <div className="auth-fullscreen-content-card">
            {currentUser ? (
              /* ========================================================
                 VIEW: SUDAH TERHUBUNG KE AKUN (CONNECTED STATE)
                 ======================================================== */
              <div className="auth-connected-view">
                <div className="auth-user-avatar-badge">
                  {currentUser.photoURL ? (
                    <img 
                      src={currentUser.photoURL} 
                      alt="User Avatar" 
                      className="auth-user-avatar-img" 
                    />
                  ) : (
                    <div className="auth-user-avatar-initial">
                      {(currentUser.displayName || currentUser.email || 'U').charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="auth-badge-status-dot" />
                </div>

                <h3 className="auth-connected-title">
                  {currentUser.displayName || 'Akun Terhubung'}
                </h3>
                <p className="auth-connected-email">{currentUser.email}</p>

                <div className="auth-sync-status-card">
                  <div className="auth-sync-status-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M19 18a3.5 3.5 0 0 0 0-7h-1A5 5 0 0 0 8 8a3.5 3.5 0 0 0 0 7h11z"/>
                      <polyline points="13 11 16 14 13 17"/>
                    </svg>
                  </div>
                  <div className="auth-sync-status-text">
                    <span className="auth-sync-title">Cloud Backup Aktif</span>
                    <span className="auth-sync-time">
                      {lastSyncTime ? `Terakhir dicadangkan: ${lastSyncTime}` : 'Otomatis tersimpan di Cloud'}
                    </span>
                  </div>
                </div>

                {errorMsg && <div className="auth-error-banner">{errorMsg}</div>}
                {successMsg && <div className="auth-success-banner">{successMsg}</div>}

                <div className="auth-action-buttons-group">
                  <button 
                    type="button" 
                    className="auth-btn-primary" 
                    onClick={handleManualSync}
                    disabled={isLoading}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
                    </svg>
                    <span>{isLoading ? 'Menyinkronkan...' : 'Cadangkan ke Cloud Sekarang'}</span>
                  </button>

                  <button 
                    type="button" 
                    className="auth-btn-secondary" 
                    onClick={handleManualRestore}
                    disabled={isLoading}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                      <polyline points="7 10 12 15 17 10"/>
                      <line x1="12" y1="15" x2="12" y2="3"/>
                    </svg>
                    <span>Pulihkan Data dari Cloud</span>
                  </button>

                  <button 
                    type="button" 
                    className="auth-btn-logout" 
                    onClick={handleLogout}
                    disabled={isLoading}
                  >
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                      <polyline points="16 17 21 12 16 7"/>
                      <line x1="21" y1="12" x2="9" y2="12"/>
                    </svg>
                    <span>Keluar dari Akun</span>
                  </button>
                </div>
              </div>
            ) : (
              /* ========================================================
                 VIEW: FORM MASUK / DAFTAR / LUPA PASSWORD
                 ======================================================== */
              <div className="auth-form-view">
                <div className="auth-header-hero">
                  <h3 className="auth-hero-title">
                    {mode === 'login' && 'Masuk ke Akun'}
                    {mode === 'register' && 'Buat Akun Baru'}
                    {mode === 'forgot' && 'Pemulihan Kata Sandi'}
                  </h3>
                  <p className="auth-hero-subtitle">
                    {mode === 'login' && 'Daftar atau masuk agar catatan keuangan selalu aman di semua perangkat'}
                    {mode === 'register' && 'Daftar agar catatan keuangan selalu aman di semua perangkat'}
                    {mode === 'forgot' && 'Masukkan email Anda untuk menerima link reset kata sandi'}
                  </p>
                </div>

                {/* Apple-Style Smooth Sliding Segmented Control */}
                {mode !== 'forgot' && (
                  <div className="auth-segment-switch">
                    <div 
                      className={`auth-segment-indicator ${mode === 'register' ? 'slide-right' : 'slide-left'}`}
                      aria-hidden="true" 
                    />
                    <button
                      type="button"
                      className={`auth-segment-btn ${mode === 'login' ? 'active' : ''}`}
                      onClick={() => { setMode('login'); setErrorMsg(''); setSuccessMsg(''); }}
                    >
                      Masuk
                    </button>
                    <button
                      type="button"
                      className={`auth-segment-btn ${mode === 'register' ? 'active' : ''}`}
                      onClick={() => { setMode('register'); setErrorMsg(''); setSuccessMsg(''); }}
                    >
                      Daftar
                    </button>
                  </div>
                )}

                {/* Google Sign In Quick Button */}
                {mode !== 'forgot' && (
                  <div className="auth-google-section">
                    <button 
                      type="button" 
                      className="auth-google-btn" 
                      onClick={handleGoogleAuth}
                      disabled={isLoading}
                    >
                      <GoogleLogo size={20} />
                      <span>Lanjutkan dengan Google</span>
                    </button>

                    <div className="auth-divider">
                      <span className="auth-divider-line" />
                      <span className="auth-divider-text">atau via email</span>
                      <span className="auth-divider-line" />
                    </div>
                  </div>
                )}

                {errorMsg && <div className="auth-error-banner">{errorMsg}</div>}
                {successMsg && <div className="auth-success-banner">{successMsg}</div>}

                {/* Form Inputs */}
                <form onSubmit={handleEmailAuth} className="auth-input-form">
                  <div className={`auth-expandable-field ${mode === 'register' ? 'expanded' : 'collapsed'}`}>
                    <div className="auth-field-group">
                      <label className="auth-field-label">Nama Lengkap</label>
                      <div className="auth-field-input-box">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="auth-field-icon">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                          <circle cx="12" cy="7" r="4"/>
                        </svg>
                        <input 
                          type="text" 
                          placeholder="Nama Anda" 
                          value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                          className="auth-text-input"
                          tabIndex={mode === 'register' ? 0 : -1}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="auth-field-group">
                    <label className="auth-field-label">Alamat Email</label>
                    <div className="auth-field-input-box">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="auth-field-icon">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                        <polyline points="22,6 12,13 2,6"/>
                      </svg>
                      <input 
                        type="email" 
                        placeholder="nama@email.com" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="auth-text-input"
                      />
                    </div>
                  </div>

                  {mode !== 'forgot' && (
                    <div className="auth-field-group">
                      <div className="auth-field-label-row">
                        <label className="auth-field-label">Kata Sandi</label>
                        {mode === 'login' && (
                          <button 
                            type="button" 
                            className="auth-link-btn" 
                            onClick={() => { setMode('forgot'); setErrorMsg(''); setSuccessMsg(''); }}
                          >
                            Lupa sandi?
                          </button>
                        )}
                      </div>
                      <div className="auth-field-input-box">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="auth-field-icon">
                          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                          <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                        </svg>
                        <input 
                          type={showPassword ? 'text' : 'password'} 
                          placeholder="Minimal 6 karakter" 
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          className="auth-text-input"
                        />
                        <button 
                          type="button" 
                          className="auth-pwd-toggle-btn"
                          onClick={() => setShowPassword(!showPassword)}
                          aria-label="Lihat kata sandi"
                        >
                          {showPassword ? (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                              <line x1="1" y1="1" x2="23" y2="23"/>
                            </svg>
                          ) : (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                              <circle cx="12" cy="12" r="3"/>
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Primary Action Submit Button */}
                  <button 
                    type="submit" 
                    className="auth-btn-primary"
                    disabled={isLoading}
                  >
                    <span>
                      {isLoading 
                        ? 'Memproses...' 
                        : mode === 'login' 
                          ? 'Masuk Sekarang' 
                          : mode === 'register' 
                            ? 'Daftar Sekarang' 
                            : 'Kirim Link Pemulihan'
                      }
                    </span>
                  </button>

                  {mode === 'forgot' && (
                    <button 
                      type="button" 
                      className="auth-btn-secondary" 
                      onClick={() => { setMode('login'); setErrorMsg(''); setSuccessMsg(''); }}
                    >
                      <span>Kembali ke Halaman Masuk</span>
                    </button>
                  )}
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

import React, { useState, useRef } from 'react';
import { calculateGroupLedger, getMonthPaymentStatus, getCurrentMonthKey, formatMonthLabel, getCurrentUserId } from '../../utils/groupStorage';
import { safeStorageGet } from '../../utils/secureStorage';

export default function GroupInfoScreen({
  group,
  currentUserName = 'Redilah',
  currentUserAvatar = null,
  onBack,
  onUpdateGroup,
  onAddMember,
  onRemoveMember,
  onLeaveGroup,
  onDeleteGroup,
  onOpenKasStatus,
  onOpenAddMember
}) {
  const [isPhotoPickerOpen, setIsPhotoPickerOpen] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(group?.name || '');
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [descInput, setDescInput] = useState(group?.description || '');
  const [isEditingFee, setIsEditingFee] = useState(false);
  const [feeInput, setFeeInput] = useState(String(group?.monthlyFee || ''));
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const cameraInputRef = useRef(null);
  const galleryInputRef = useRef(null);

  const currentMonthKey = getCurrentMonthKey();
  const ledger = calculateGroupLedger(group, currentMonthKey);
  const paymentStatus = getMonthPaymentStatus(group, currentMonthKey);
  
  let localUserAvatar = currentUserAvatar || null;
  if (!localUserAvatar && typeof window !== 'undefined') {
    try {
      localUserAvatar = localStorage.getItem('user_profile_image') || null;
    } catch {
      localUserAvatar = null;
    }
  }

  // Helper to compress image to max 256px JPEG 0.75
  const processImageFile = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const size = 256;
        let width = img.width;
        let height = img.height;

        let sourceX = 0;
        let sourceY = 0;
        let sourceSize = Math.min(width, height);

        if (width > height) {
          sourceX = (width - height) / 2;
        } else {
          sourceY = (height - width) / 2;
        }

        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, sourceX, sourceY, sourceSize, sourceSize, 0, 0, size, size);
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.75);

        if (onUpdateGroup) {
          onUpdateGroup({
            groupId: group.id,
            avatar: compressedBase64
          });
        }
        setIsPhotoPickerOpen(false);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleCameraChange = (e) => {
    const file = e.target.files?.[0];
    if (file) processImageFile(file);
    e.target.value = '';
  };

  const handleGalleryChange = (e) => {
    const file = e.target.files?.[0];
    if (file) processImageFile(file);
    e.target.value = '';
  };

  const handleSaveName = () => {
    if (!nameInput.trim()) return;
    if (onUpdateGroup) {
      onUpdateGroup({
        groupId: group.id,
        name: nameInput.trim()
      });
    }
    setIsEditingName(false);
  };

  const handleSaveDesc = () => {
    if (onUpdateGroup) {
      onUpdateGroup({
        groupId: group.id,
        description: descInput.trim()
      });
    }
    setIsEditingDesc(false);
  };

  const handleSaveFee = () => {
    const num = Number(feeInput) || 0;
    if (onUpdateGroup) {
      onUpdateGroup({
        groupId: group.id,
        monthlyFee: num
      });
    }
    setIsEditingFee(false);
  };

  const handleShareLink = () => {
    const inviteUrl = `https://cassiel.app/join?g=${group.inviteCode || 'CASSIEL'}`;
    const text = `Yuk gabung ke grup keuangan "${group.name}" di Cassiel untuk transparansi kas bersama! Klik link: ${inviteUrl}`;
    if (navigator.share) {
      navigator.share({ title: `Gabung ke ${group.name}`, text, url: inviteUrl }).catch(() => {});
    } else {
      navigator.clipboard.writeText(text);
      alert('Tautan invite grup berhasil disalin!');
    }
  };

  const handleLeaveGroup = () => {
    if (window.confirm(`Apakah Anda yakin ingin keluar dari grup "${group.name}"?`)) {
      if (onLeaveGroup) {
        onLeaveGroup(group.id);
      }
    }
  };

  const handleDeleteGroup = () => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus grup "${group.name}"? Seluruh data kas dan riwayat pesan akan dihapus secara permanen.`)) {
      if (onDeleteGroup) {
        onDeleteGroup(group.id);
      }
    }
  };

  const myUserId = getCurrentUserId();
  const members = group?.members || [];
  const currentUserObj = members.find(m => (m.userId && m.userId === myUserId) || m.id === myUserId || m.isCurrentUser || m.name === currentUserName);
  const isCurrentUserAdmin = currentUserObj?.role === 'admin';

  return (
    <div
      className="groups-sheet-container wa-info-screen"
      onClick={(e) => {
        e.stopPropagation();
        if (isMenuOpen) setIsMenuOpen(false);
      }}
    >
      {/* Hidden file inputs */}
      <input
        type="file"
        ref={cameraInputRef}
        accept="image/*"
        capture="environment"
        style={{ display: 'none' }}
        onChange={handleCameraChange}
      />
      <input
        type="file"
        ref={galleryInputRef}
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleGalleryChange}
      />

      {/* Top Floating Transparent Nav Bar (No Colored Header Box) */}
      <div className="wa-info-top-nav">
        <button type="button" className="wa-info-nav-btn" onClick={onBack} aria-label="Kembali">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>

        <div style={{ position: 'relative' }}>
          <button
            type="button"
            className="wa-info-nav-btn"
            onClick={(e) => {
              e.stopPropagation();
              setIsMenuOpen(!isMenuOpen);
            }}
            aria-label="Menu"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="5" r="1.5" />
              <circle cx="12" cy="12" r="1.5" />
              <circle cx="12" cy="19" r="1.5" />
            </svg>
          </button>

          {isMenuOpen && (
            <div className="wa-info-dropdown" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                className="wa-info-dropdown-item"
                onClick={() => {
                  setIsMenuOpen(false);
                  handleShareLink();
                }}
              >
                <span>🔗</span>
                <span>Bagikan Link Grup</span>
              </button>
              <button
                type="button"
                className="wa-info-dropdown-item"
                onClick={() => {
                  setIsMenuOpen(false);
                  setIsEditingName(true);
                }}
              >
                <span>✏️</span>
                <span>Ubah Nama Grup</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Scrollable Body — Seamless Direct on Background (NO White Card Boxes) */}
      <div className="wa-info-scroll">
        {/* Giant Centered Avatar */}
        <div className="wa-info-avatar-section">
          <div
            className="wa-info-avatar-circle"
            onClick={() => setIsPhotoPickerOpen(true)}
            title="Ganti Foto Profil Grup"
          >
            {group.avatar ? (
              <img src={group.avatar} alt={group.name} className="wa-info-avatar-img" />
            ) : (
              <div className="wa-info-avatar-placeholder">
                <svg width="54" height="54" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
                </svg>
              </div>
            )}
            <div className="wa-info-camera-badge">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
            </div>
          </div>

          {/* Group Title */}
          {isEditingName ? (
            <div className="wa-info-inline-edit-box">
              <input
                type="text"
                className="wa-info-name-input"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                autoFocus
              />
              <button type="button" className="wa-info-action-confirm-btn" onClick={handleSaveName}>
                Simpan
              </button>
            </div>
          ) : (
            <div className="wa-info-title-row">
              <h1 className="wa-info-group-title">{group.name}</h1>
              {isCurrentUserAdmin && (
                <button
                  type="button"
                  className="wa-info-edit-pencil-btn"
                  onClick={() => setIsEditingName(true)}
                  aria-label="Ubah Nama"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                </button>
              )}
            </div>
          )}

          <div className="wa-info-members-count-subtitle">
            Grup • {members.length} anggota
          </div>

          {/* Group Description */}
          {isEditingDesc ? (
            <div className="wa-info-inline-edit-box" style={{ width: '100%', maxWidth: '320px', marginTop: '6px' }}>
              <textarea
                className="wa-info-desc-input"
                rows={2}
                value={descInput}
                onChange={(e) => setDescInput(e.target.value)}
                placeholder="Tambah deskripsi grup..."
                autoFocus
              />
              <button type="button" className="wa-info-action-confirm-btn" onClick={handleSaveDesc}>
                Simpan
              </button>
            </div>
          ) : (
            <div
              className="wa-info-desc-text-btn"
              onClick={() => isCurrentUserAdmin && setIsEditingDesc(true)}
            >
              {group.description || (isCurrentUserAdmin ? '+ Tambah deskripsi grup' : 'Belum ada deskripsi')}
            </div>
          )}
        </div>

        {/* Action Buttons Row (WhatsApp Style Round Circles) */}
        <div className="wa-info-quick-actions">
          <button type="button" className="wa-info-circle-action" onClick={handleShareLink}>
            <div className="wa-info-circle-btn">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="18" cy="5" r="3" />
                <circle cx="6" cy="12" r="3" />
                <circle cx="18" cy="19" r="3" />
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
              </svg>
            </div>
            <span className="wa-info-circle-label">Bagikan</span>
          </button>

          <button type="button" className="wa-info-circle-action" onClick={onOpenAddMember}>
            <div className="wa-info-circle-btn">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="8.5" cy="7" r="4" />
                <line x1="20" y1="8" x2="20" y2="14" />
                <line x1="23" y1="11" x2="17" y2="11" />
              </svg>
            </div>
            <span className="wa-info-circle-label">Tambah</span>
          </button>

          <button type="button" className="wa-info-circle-action" onClick={onOpenKasStatus}>
            <div className="wa-info-circle-btn">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <circle cx="12" cy="12" r="6" />
                <circle cx="12" cy="12" r="2" />
              </svg>
            </div>
            <span className="wa-info-circle-label">Status Kas</span>
          </button>
        </div>

        {/* Seamless Financial Highlight (Direct background, no white box) */}
        <div className="wa-info-fin-section">
          <div className="wa-info-fin-row">
            <span className="wa-info-fin-label">Saldo Kas Grup</span>
            <span className="wa-info-fin-val green">Rp{(Number(ledger?.balance) || 0).toLocaleString('id-ID')}</span>
          </div>
          <div className="wa-info-fin-row">
            <span className="wa-info-fin-label">Iuran Kas Bulanan</span>
            {isEditingFee ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <input
                  type="number"
                  className="wa-info-fee-input"
                  value={feeInput}
                  onChange={(e) => setFeeInput(e.target.value)}
                />
                <button type="button" className="wa-info-action-confirm-btn" onClick={handleSaveFee}>
                  OK
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span className="wa-info-fin-val">Rp{Number(group.monthlyFee || 0).toLocaleString('id-ID')}/bln</span>
                {isCurrentUserAdmin && (
                  <button type="button" className="wa-info-fee-edit-link" onClick={() => setIsEditingFee(true)}>
                    Ubah
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Section Divider */}
        <div className="wa-info-divider" />

        {/* WAJIB: DAFTAR ANGGOTA DI BAWAH (DIRECT LIST TANPA KOTAK) */}
        <div className="wa-info-members-section">
          <div className="wa-info-section-header">
            <span className="wa-info-section-title">{members.length} anggota</span>
          </div>

          {/* Add Members Row */}
          <div className="wa-info-member-item add-row" onClick={onOpenAddMember}>
            <div className="wa-info-member-icon-circle add">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </div>
            <div className="wa-info-member-details">
              <span className="wa-info-member-name-text add-text">Tambah anggota</span>
            </div>
          </div>

          {/* Member Rows */}
          {members.map((member) => {
            const isMe = (member.userId && member.userId === myUserId) || member.id === myUserId || member.isCurrentUser || member.name === currentUserName;
            const isPaid = paymentStatus.paidMembers.some(p => p.id === member.id);
            const memberAvatar = member.avatar || (isMe ? localUserAvatar : null);

            return (
              <div key={member.id} className="wa-info-member-item">
                {memberAvatar ? (
                  <img src={memberAvatar} alt={member.name} className="wa-info-member-avatar-img" />
                ) : (
                  <div className="wa-info-member-icon-circle">
                    {member.name?.charAt(0)?.toUpperCase() || 'A'}
                  </div>
                )}
                <div className="wa-info-member-details">
                  <div className="wa-info-member-top-line">
                    <span className="wa-info-member-name-text">
                      {member.name} {isMe && <span className="wa-info-me-tag">~ Anda</span>}
                    </span>
                    {member.role === 'admin' && (
                      <span className="wa-info-admin-pill">Admin grup</span>
                    )}
                  </div>
                  <div className={`wa-info-member-status-line ${isPaid ? 'paid' : 'unpaid'}`}>
                    {isPaid ? '✅ Lunas iuran bulan ini' : '⏳ Belum iuran kas'}
                  </div>
                </div>

                {isCurrentUserAdmin && !isMe && (
                  <button
                    type="button"
                    className="wa-info-remove-btn"
                    onClick={() => {
                      if (window.confirm(`Hapus ${member.name} dari grup?`)) {
                        if (onRemoveMember) onRemoveMember(group.id, member.id);
                      }
                    }}
                    title="Hapus anggota"
                  >
                    ✕
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Section Divider */}
        <div className="wa-info-divider" />

        {/* Danger Actions: Keluar dan Hapus Group (Warna Merah di Bawah) */}
        <div className="wa-info-danger-section">
          <button
            type="button"
            className="wa-info-danger-item"
            onClick={handleLeaveGroup}
          >
            <div className="wa-info-danger-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </div>
            <span className="wa-info-danger-text">Keluar dari grup</span>
          </button>

          <button
            type="button"
            className="wa-info-danger-item"
            onClick={handleDeleteGroup}
          >
            <div className="wa-info-danger-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                <line x1="10" y1="11" x2="10" y2="17" />
                <line x1="14" y1="11" x2="14" y2="17" />
              </svg>
            </div>
            <span className="wa-info-danger-text">Hapus group</span>
          </button>
        </div>
      </div>

      {/* BOTTOM SHEET MODAL: OPSI FOTO PROFIL (KAMERA & GALERI) */}
      {isPhotoPickerOpen && (
        <div
          className="group-photo-sheet-backdrop"
          onClick={() => setIsPhotoPickerOpen(false)}
        >
          <div
            className="group-photo-sheet-container"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="group-photo-sheet-handle" />

            <div className="group-photo-sheet-header">
              <button
                type="button"
                className="group-photo-sheet-close-btn"
                onClick={() => setIsPhotoPickerOpen(false)}
              >
                ✕
              </button>
              <span className="group-photo-sheet-title">Foto profil grup</span>
              <div style={{ width: '28px' }} />
            </div>

            <div className="group-photo-sheet-options">
              <button
                type="button"
                className="group-photo-option-btn"
                onClick={() => cameraInputRef.current?.click()}
              >
                <div className="group-photo-option-icon">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                    <circle cx="12" cy="13" r="4" />
                  </svg>
                </div>
                <span className="group-photo-option-text">Kamera</span>
              </button>

              <button
                type="button"
                className="group-photo-option-btn"
                onClick={() => galleryInputRef.current?.click()}
              >
                <div className="group-photo-option-icon">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                  </svg>
                </div>
                <span className="group-photo-option-text">Galeri</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

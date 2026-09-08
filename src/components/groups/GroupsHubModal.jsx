import React, { useState } from 'react';
import './groups.css';
import {
  getStoredGroups,
  createNewGroup,
  joinGroupByInviteCode,
  recordKasPayment,
  recordGroupExpense,
  sendGroupTextMessage,
  deleteGroupMessage,
  addMemberToGroup,
  leaveGroup,
  deleteGroup,
  calculateGroupLedger,
  getMonthPaymentStatus,
  getCurrentMonthKey
} from '../../utils/groupStorage';
import { canCreateGroup } from '../../utils/proManager';
import GroupDetailScreen from './GroupDetailScreen';

export default function GroupsHubModal({
  isOpen,
  onClose,
  currentUserName = 'Redilah',
  currentUserAvatar = null,
  onOpenProModal
}) {
  const [groups, setGroups] = useState(() => getStoredGroups(currentUserName));
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [isJoiningGroup, setIsJoiningGroup] = useState(false);
  const [inviteCodeInput, setInviteCodeInput] = useState('');
  const [isSubmittingJoin, setIsSubmittingJoin] = useState(false);
  const [joinError, setJoinError] = useState('');

  // New Group Form State (WhatsApp-style)
  const [newGroupName, setNewGroupName] = useState('');
  const [groupAvatar, setGroupAvatar] = useState(null);
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const formatAmountInput = (val) => {
    if (!val && val !== 0) return '';
    const cleanVal = String(val).replace(/\D/g, '');
    if (!cleanVal) return '';
    return Number(cleanVal).toLocaleString('id-ID');
  };

  const [newGroupFee, setNewGroupFee] = useState('50.000');
  const [newGroupInitBalance, setNewGroupInitBalance] = useState('');
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');

  // Handle swipe-to-back & back events
  useEffect(() => {
    if (!isOpen) return;

    const handleBack = () => {
      if (selectedGroup) {
        setSelectedGroup(null);
        return;
      }
      if (isCreatingGroup) {
        setIsCreatingGroup(false);
        return;
      }
      if (isJoiningGroup) {
        setIsJoiningGroup(false);
        return;
      }
      onClose();
    };

    const handleBackEvent = (e) => {
      if (selectedGroup) {
        setSelectedGroup(null);
        if (e && e.preventDefault) e.preventDefault();
      } else if (isCreatingGroup) {
        setIsCreatingGroup(false);
        if (e && e.preventDefault) e.preventDefault();
      } else if (isJoiningGroup) {
        setIsJoiningGroup(false);
        if (e && e.preventDefault) e.preventDefault();
      } else {
        onClose();
      }
    };

    window.addEventListener('cassiel_groups_modal_back', handleBackEvent);

    let startX = 0;
    let startY = 0;
    let startTime = 0;

    const handleTouchStart = (e) => {
      if (!e.touches || e.touches.length !== 1) return;
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      startTime = Date.now();
    };

    const handleTouchEnd = (e) => {
      if (!e.changedTouches || e.changedTouches.length !== 1) return;
      const endX = e.changedTouches[0].clientX;
      const endY = e.changedTouches[0].clientY;
      const deltaX = endX - startX;
      const deltaY = endY - startY;
      const duration = Date.now() - startTime;

      if (startX <= 60 && deltaX >= 50 && Math.abs(deltaX) > Math.abs(deltaY) * 1.2 && duration < 550) {
        handleBack();
      }
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('cassiel_groups_modal_back', handleBackEvent);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isOpen, selectedGroup, isCreatingGroup, isJoiningGroup, onClose]);

  if (!isOpen) return null;

  const currentMonthKey = getCurrentMonthKey();

  // Reload groups on state changes
  const refreshGroups = () => {
    const updated = getStoredGroups(currentUserName);
    setGroups(updated);
    if (selectedGroup) {
      const refreshedSelected = updated.find(g => g.id === selectedGroup.id);
      setSelectedGroup(refreshedSelected || null);
    }
  };

  const handleAvatarUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setGroupAvatar(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddMemberName = (e) => {
    e.preventDefault();
    if (!newMemberName.trim()) return;
    setInitialMembers([...initialMembers, newMemberName.trim()]);
    setNewMemberName('');
    setIsAddingMember(false);
  };

  const handleRemoveInitialMember = (indexToRemove) => {
    setInitialMembers(initialMembers.filter((_, idx) => idx !== indexToRemove));
  };

  const handleStartCreateGroup = () => {
    if (!canCreateGroup(groups.length)) {
      if (onOpenProModal) {
        onOpenProModal('group');
      } else {
        alert('Batas maksimal 3 grup untuk akun gratis telah tercapai. Upgrade ke Cassiel Pro untuk membuat grup tanpa batas!');
      }
      return;
    }
    setIsCreatingGroup(true);
  };

  const handleCreateGroupSubmit = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!newGroupName.trim()) return;

    const created = createNewGroup({
      name: newGroupName,
      type: 'Organisasi',
      avatar: groupAvatar,
      description: newGroupDesc,
      monthlyFee: Number(String(newGroupFee).replace(/\D/g, '')) || 0,
      initialBalance: Number(String(newGroupInitBalance).replace(/\D/g, '')) || 0,
      initialMembers,
      currentUserName
    });

    setNewGroupName('');
    setGroupAvatar(null);
    setNewGroupDesc('');
    setNewGroupFee('50.000');
    setNewGroupInitBalance('');
    setInitialMembers([]);
    setIsCreatingGroup(false);
    refreshGroups();
    setSelectedGroup(created);
  };

  const handleJoinGroupSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!inviteCodeInput.trim()) return;

    // Bersihkan link jika user paste URL lengkap (e.g. https://cassiel.app/join?g=XYZ123)
    let code = inviteCodeInput.trim();
    if (code.includes('?g=')) {
      const match = code.match(/\?g=([a-zA-Z0-9]+)/);
      if (match && match[1]) code = match[1];
    }

    setIsSubmittingJoin(true);
    setJoinError('');

    try {
      const res = await joinGroupByInviteCode({
        inviteCode: code,
        currentUserName,
        currentUserAvatar
      });

      if (res && res.group) {
        setInviteCodeInput('');
        setIsJoiningGroup(false);
        refreshGroups();
        setSelectedGroup(res.group);
      }
    } catch (err) {
      setJoinError(err?.message || 'Gagal bergabung ke grup. Pastikan kode benar.');
    } finally {
      setIsSubmittingJoin(false);
    }
  };

  const handleRecordKas = (params) => {
    recordKasPayment({ ...params, currentUserName });
    refreshGroups();
  };

  const handleRecordExpense = (params) => {
    recordGroupExpense({ ...params, currentUserName });
    refreshGroups();
  };

  const handleSendTextMessage = (params) => {
    sendGroupTextMessage(params);
    refreshGroups();
  };

  const handleDeleteMessage = (params) => {
    deleteGroupMessage({ ...params, currentUserName });
    refreshGroups();
  };

  const handleAddMember = (params) => {
    addMemberToGroup({ ...params, currentUserName });
    refreshGroups();
  };

  const handleUpdateGroup = (params) => {
    updateGroupInfo({ ...params, currentUserName });
    refreshGroups();
  };

  const handleRemoveMember = (groupId, memberId) => {
    removeMemberFromGroup({ groupId, memberId, currentUserName });
    refreshGroups();
  };

  const handleLeaveGroup = (groupId) => {
    leaveGroup({ groupId, currentUserName });
    setSelectedGroup(null);
    refreshGroups();
  };

  const handleDeleteGroup = (groupId) => {
    deleteGroup({ groupId, currentUserName });
    setSelectedGroup(null);
    refreshGroups();
  };

  return (
    <div className="groups-overlay" onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: '414px', height: '100%' }}>
        {selectedGroup ? (
          <GroupDetailScreen
            group={selectedGroup}
            currentUserName={currentUserName}
            currentUserAvatar={currentUserAvatar}
            onBack={() => setSelectedGroup(null)}
            onRecordKas={handleRecordKas}
            onRecordExpense={handleRecordExpense}
            onSendTextMessage={handleSendTextMessage}
            onDeleteMessage={handleDeleteMessage}
            onAddMember={handleAddMember}
            onUpdateGroup={handleUpdateGroup}
            onRemoveMember={handleRemoveMember}
            onLeaveGroup={handleLeaveGroup}
            onDeleteGroup={handleDeleteGroup}
          />
        ) : isCreatingGroup ? (
          /* Halaman Buat Group Baru (WhatsApp Style dengan Palet Cassiel) */
          <div className="groups-sheet-container" style={{ position: 'relative' }}>
            <div className="groups-header">
              <div className="groups-header-left">
                <button
                  type="button"
                  className="groups-back-btn"
                  onClick={() => setIsCreatingGroup(false)}
                  aria-label="Kembali"
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 12H5M12 19l-7-7 7-7" />
                  </svg>
                </button>
                <div className="groups-title-box">
                  <span className="groups-main-title">New group</span>
                </div>
              </div>
            </div>

            <div className="groups-create-scroll-content" style={{ paddingBottom: '90px' }}>
              {/* WA Top Section: Avatar Button + Group Name Box */}
              <div className="wa-create-top-section">
                <label className="wa-group-avatar-btn" title="Pilih Foto Profil Grup">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    style={{ display: 'none' }}
                  />
                  {groupAvatar ? (
                    <img src={groupAvatar} alt="Group Avatar" className="wa-group-avatar-preview" />
                  ) : (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                      <circle cx="12" cy="13" r="4" />
                    </svg>
                  )}
                </label>

                <div className="wa-group-name-box">
                  <input
                    type="text"
                    className="wa-group-name-input"
                    value={newGroupName}
                    onChange={e => setNewGroupName(e.target.value)}
                    placeholder="Enter group name"
                    autoFocus
                    required
                  />
                  <span className="wa-group-emoji-icon">😊</span>
                </div>
              </div>

              {/* Financial Rows (Cassiel Flat Style) */}
              <div className="groups-form-container">
                {/* Row 1: Iuran Kas Rutin */}
                <div className="group-form-row">
                  <span className="group-form-label">Iuran Kas</span>
                  <div className="group-form-amount-row">
                    <span className="group-form-currency-prefix">Rp</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      className="group-form-input-amount"
                      value={newGroupFee}
                      onChange={e => setNewGroupFee(formatAmountInput(e.target.value))}
                    />
                  </div>
                </div>

                {/* Row 2: Saldo Awal (Opsional) */}
                <div className="group-form-row">
                  <span className="group-form-label">Saldo Awal</span>
                  <div className="group-form-amount-row">
                    <span className="group-form-currency-prefix">Rp</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      className="group-form-input-amount"
                      value={newGroupInitBalance}
                      onChange={e => setNewGroupInitBalance(formatAmountInput(e.target.value))}
                    />
                  </div>
                </div>

                {/* Row 3: Catatan / Deskripsi */}
                <div className="group-form-row">
                  <span className="group-form-label">Catatan</span>
                  <div className="group-form-input-box">
                    <input
                      type="text"
                      className="group-form-input-text"
                      value={newGroupDesc}
                      onChange={e => setNewGroupDesc(e.target.value)}
                      placeholder=""
                    />
                  </div>
                </div>
              </div>

              {/* WA Members Section */}
              <div className="wa-members-section">
                <div className="wa-members-header">
                  Anggota Tambahan: {initialMembers.length > 0 ? `${initialMembers.length} orang` : 'Belum ada'}
                </div>

                <div className="wa-members-grid">
                  {/* Added Members Chips */}
                  {initialMembers.map((mName, idx) => (
                    <div key={idx} className="wa-member-item-chip">
                      <div className="wa-member-item-avatar">
                        {mName.substring(0, 1).toUpperCase()}
                      </div>
                      <span className="wa-member-item-name">{mName}</span>
                      <button
                        type="button"
                        className="wa-member-remove-badge"
                        onClick={() => handleRemoveInitialMember(idx)}
                        title="Hapus"
                      >
                        ✕
                      </button>
                    </div>
                  ))}

                  {/* Add Member Button */}
                  <button
                    type="button"
                    className="wa-add-member-btn"
                    onClick={() => setIsAddingMember(true)}
                  >
                    <div className="wa-add-member-circle">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                        <circle cx="8.5" cy="7" r="4" />
                        <line x1="20" y1="8" x2="20" y2="14" />
                        <line x1="23" y1="11" x2="17" y2="11" />
                      </svg>
                    </div>
                    <span className="wa-add-member-label">Add</span>
                  </button>
                </div>
              </div>
            </div>

            {/* WA Floating Action Button (FAB) at Bottom Right */}
            <button
              type="button"
              className="wa-create-fab-btn"
              onClick={handleCreateGroupSubmit}
              disabled={!newGroupName.trim()}
              style={{ opacity: newGroupName.trim() ? 1 : 0.5 }}
              title="Buat Grup"
            >
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </button>

            {/* Quick Add Member Modal */}
            {isAddingMember && (
              <div className="group-submodal-overlay" onClick={() => setIsAddingMember(false)}>
                <div className="group-submodal-card" onClick={e => e.stopPropagation()}>
                  <div className="submodal-header">
                    <h3 className="submodal-title">Tambah Nama Anggota</h3>
                    <button type="button" className="submodal-close-btn" onClick={() => setIsAddingMember(false)}>✕</button>
                  </div>
                  <form onSubmit={handleAddMemberName}>
                    <div className="form-group-item">
                      <label className="form-group-label">Nama Anggota</label>
                      <input
                        type="text"
                        className="form-group-input"
                        value={newMemberName}
                        onChange={e => setNewMemberName(e.target.value)}
                        autoFocus
                        required
                      />
                    </div>
                    <button type="submit" className="form-group-submit-btn">
                      ✓ Tambahkan
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Halaman Utama Groups */
          <div className="groups-sheet-container">
            {/* Header */}
            <div className="groups-header">
              <div className="groups-header-left">
                <button type="button" className="groups-back-btn" onClick={onClose} aria-label="Tutup">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 12H5M12 19l-7-7 7-7" />
                  </svg>
                </button>
                <div className="groups-title-box">
                  <span className="groups-main-title">Groups</span>
                </div>
              </div>
            </div>

            {/* Content: Clean Centered Empty State or Group Cards */}
            {groups.length === 0 ? (
              <div className="groups-empty-state-container">
                <div className="groups-empty-icon-box">
                  <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                  <div className="groups-empty-plus-badge">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                  </div>
                </div>
                <div className="groups-empty-title">Belum Ada Grup</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center', width: '100%', maxWidth: '240px' }}>
                  <button
                    type="button"
                    className="groups-new-group-btn"
                    onClick={handleStartCreateGroup}
                  >
                    <span>New Group</span>
                  </button>
                  <button
                    type="button"
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#2D5284',
                      fontSize: '13px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      padding: '6px 12px'
                    }}
                    onClick={() => {
                      setJoinError('');
                      setInviteCodeInput('');
                      setIsJoiningGroup(true);
                    }}
                  >
                    🔗 Gabung via Link / Kode
                  </button>
                </div>
              </div>
            ) : (
              <div className="groups-hub-content" style={{ position: 'relative' }}>
                <div className="group-section-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: '4px' }}>
                  <span>Grup Aktif ({groups.length})</span>
                  <button
                    type="button"
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#2D5284',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                    onClick={() => {
                      setJoinError('');
                      setInviteCodeInput('');
                      setIsJoiningGroup(true);
                    }}
                  >
                    + Gabung via Kode
                  </button>
                </div>

                {groups.map(grp => {
                  const ledger = calculateGroupLedger(grp, currentMonthKey);
                  const payStatus = getMonthPaymentStatus(grp, currentMonthKey);
                  const isAllPaid = payStatus.unpaidMembers.length === 0;

                  return (
                    <div
                      key={grp.id}
                      className="group-card-item"
                      onClick={() => setSelectedGroup(grp)}
                    >
                      <div className="group-card-top">
                        <div className="group-card-identity">
                          <div className="group-avatar-icon" style={{ overflow: 'hidden', padding: 0 }}>
                            {grp.avatar ? (
                              <img src={grp.avatar} alt={grp.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '14px' }} />
                            ) : (
                              <svg width="22" height="22" viewBox="0 0 24 24" fill="#BC6C25">
                                <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
                              </svg>
                            )}
                          </div>
                          <div>
                            <div className="group-card-name">{grp.name}</div>
                            <div className="group-card-type-tag">
                              {grp.members?.length || 1} Anggota
                            </div>
                          </div>
                        </div>

                        <div className="group-card-balance-box">
                          <div className="group-card-balance-label">Saldo Kas</div>
                          <div className="group-card-balance-amt">
                            Rp{(Number(ledger?.balance) || 0).toLocaleString('id-ID')}
                          </div>
                        </div>
                      </div>

                      <div className="group-card-kas-status">
                        <span className="group-kas-status-text">
                          Kas {currentMonthKey.substring(5, 7) === '08' ? 'Agustus' : 'Bulan Ini'}
                        </span>
                        <span className={`group-kas-status-pill ${isAllPaid ? '' : 'warning'}`}>
                          {isAllPaid ? '✅ Semua Lunas' : `⚠️ ${payStatus.unpaidMembers.length} Belum Bayar`}
                        </span>
                      </div>
                    </div>
                  );
                })}

                {/* Floating Capsule Button: Buat Grup */}
                <button
                  type="button"
                  className="groups-floating-capsule-btn"
                  onClick={handleStartCreateGroup}
                  title="Buat Grup"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  <span>Buat Grup</span>
                </button>
              </div>
            )}

            {/* Modal: Gabung Grup via Link / Kode */}
            {isJoiningGroup && (
              <div className="group-submodal-overlay" onClick={() => setIsJoiningGroup(false)}>
                <div className="group-submodal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: '360px' }}>
                  <div className="submodal-header">
                    <div>
                      <h3 className="submodal-title">Gabung ke Grup</h3>
                      <p className="submodal-subtitle">Masukkan kode undangan 6 digit atau link</p>
                    </div>
                    <button type="button" className="submodal-close-btn" onClick={() => setIsJoiningGroup(false)} aria-label="Tutup">✕</button>
                  </div>
                  <form onSubmit={handleJoinGroupSubmit}>
                    <div className="form-group-item">
                      <label className="form-group-label">Kode Undangan / Link Grup</label>
                      <div className="form-group-input-wrapper">
                        <svg className="form-group-input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                        </svg>
                        <input
                          type="text"
                          className="form-group-input"
                          placeholder="Contoh: K9X2QA atau https://..."
                          value={inviteCodeInput}
                          onChange={e => setInviteCodeInput(e.target.value)}
                          autoFocus
                          required
                        />
                      </div>
                    </div>

                    {joinError && (
                      <div className="form-group-error-box">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10" />
                          <line x1="12" y1="8" x2="12" y2="12" />
                          <line x1="12" y1="16" x2="12.01" y2="16" />
                        </svg>
                        <span>{joinError}</span>
                      </div>
                    )}

                    <button
                      type="submit"
                      className="form-group-submit-btn"
                      disabled={isSubmittingJoin || !inviteCodeInput.trim()}
                    >
                      {isSubmittingJoin ? (
                        <>
                          <div className="btn-spinner" />
                          <span>Menghubungkan ke Server...</span>
                        </>
                      ) : (
                        <>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                            <polyline points="10 17 15 12 10 7" />
                            <line x1="15" y1="12" x2="3" y2="12" />
                          </svg>
                          <span>Gabung Sekarang</span>
                        </>
                      )}
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

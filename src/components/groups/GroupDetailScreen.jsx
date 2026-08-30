import React, { useState, useRef, useEffect } from 'react';
import { 
  calculateGroupLedger, 
  getMonthPaymentStatus, 
  getCurrentMonthKey, 
  formatMonthLabel,
  subscribeToGroupRealtime,
  getStoredGroups,
  saveStoredGroups
} from '../../utils/groupStorage';
import { clearAppBadgeCount } from '../../utils/notifications';
import GroupKasStatusModal from './GroupKasStatusModal';
import GroupAddTxModal from './GroupAddTxModal';
import GroupInfoScreen from './GroupInfoScreen';

export default function GroupDetailScreen({
  group,
  currentUserName = 'Redilah',
  currentUserAvatar = null,
  onBack,
  onRecordKas,
  onRecordExpense,
  onSendTextMessage,
  onDeleteMessage,
  onAddMember,
  onUpdateGroup,
  onRemoveMember,
  onDeleteGroup
}) {
  const [activeGroup, setActiveGroup] = useState(group);

  // Real-time Firestore sync whenever group data changes from another device
  useEffect(() => {
    setActiveGroup(group);
  }, [group]);

  useEffect(() => {
    if (!group?.id) return;
    const unsubscribe = subscribeToGroupRealtime(group.id, (cloudGroup) => {
      if (cloudGroup) {
        setActiveGroup(cloudGroup);
        const localList = getStoredGroups(currentUserName);
        const idx = localList.findIndex(g => g.id === cloudGroup.id);
        if (idx !== -1) {
          localList[idx] = cloudGroup;
          saveStoredGroups(localList);
        }
      }
    });

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [group?.id, currentUserName]);
  const [activeSubTab, setActiveSubTab] = useState('finance'); // 'finance' | 'chat'
  const [isGroupInfoOpen, setIsGroupInfoOpen] = useState(false);
  const [isKasStatusOpen, setIsKasStatusOpen] = useState(false);
  const [isAddTxOpen, setIsAddTxOpen] = useState(false);
  const [addTxMode, setAddTxMode] = useState('kas_in');
  const [prefilledMember, setPrefilledMember] = useState(null);
  
  // Chat States
  const [chatInputText, setChatInputText] = useState('');
  const [isPlusMenuOpen, setIsPlusMenuOpen] = useState(false);
  const [selectedProofPreview, setSelectedProofPreview] = useState(null);
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
  const [newMemberNameInput, setNewMemberNameInput] = useState('');
  const [isMenuDropdownOpen, setIsMenuDropdownOpen] = useState(false);
  const [currentWallpaper, setCurrentWallpaper] = useState(group?.chatWallpaper || null);

  // Message Selection & Deletion States (WhatsApp Style)
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const longPressTimerRef = useRef(null);
  const isLongPressActiveRef = useRef(false);

  const startLongPress = (msg) => {
    isLongPressActiveRef.current = false;
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
    longPressTimerRef.current = setTimeout(() => {
      isLongPressActiveRef.current = true;
      if (navigator.vibrate) {
        try { navigator.vibrate(40); } catch {}
      }
      setSelectedMessage(msg);
    }, 450);
  };

  const cancelLongPress = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const handleMessageClick = (msg) => {
    if (isLongPressActiveRef.current) {
      isLongPressActiveRef.current = false;
      return;
    }
    if (selectedMessage) {
      if (selectedMessage.id === msg.id) {
        setSelectedMessage(null);
      } else {
        setSelectedMessage(msg);
      }
    }
  };

  const executeDelete = (type) => {
    if (!selectedMessage) return;
    if (onDeleteMessage) {
      onDeleteMessage({
        groupId: group.id,
        messageId: selectedMessage.id,
        deleteType: type
      });
    }
    setIsDeleteModalOpen(false);
    setSelectedMessage(null);
  };

  const wallpaperGalleryRef = useRef(null);
  const chatBottomRef = useRef(null);
  const currentMonthKey = getCurrentMonthKey();
  useEffect(() => {
    if (group?.chatWallpaper !== undefined) {
      setCurrentWallpaper(group.chatWallpaper);
    }
  }, [group?.chatWallpaper]);

  // Helper to compress chat wallpaper (max 1024px JPEG 0.75) and save
  const processWallpaperFile = (file) => {
    if (!file || !group) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDimension = 1440;
        let width = img.width;
        let height = img.height;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.88);

        // Instantly update local UI state so it applies immediately
        setCurrentWallpaper(compressedBase64);

        if (onUpdateGroup) {
          onUpdateGroup({
            groupId: group.id,
            chatWallpaper: compressedBase64
          });
        }
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleWallpaperGalleryChange = (e) => {
    const file = e.target.files?.[0];
    if (file) processWallpaperFile(file);
    e.target.value = '';
  };

  const handleRemoveWallpaper = () => {
    setCurrentWallpaper(null);
    if (onUpdateGroup && group) {
      onUpdateGroup({
        groupId: group.id,
        chatWallpaper: null
      });
    }
  };

  // Auto-scroll chat to bottom on new messages and clear app badge count (Unconditional Hook)
  useEffect(() => {
    if (activeSubTab === 'chat' && !isGroupInfoOpen) {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      clearAppBadgeCount();
    }
  }, [group?.messages, activeSubTab, isGroupInfoOpen]);

  // If group is null/undefined, do not crash
  const currentGroup = activeGroup || group;
  if (!currentGroup) {
    return null;
  }

  const safeTransactions = Array.isArray(currentGroup?.transactions) ? currentGroup.transactions : [];
  const safeMembers = Array.isArray(currentGroup?.members) ? currentGroup.members : [];
  const safeMessages = Array.isArray(currentGroup?.messages) ? currentGroup.messages : [];

  const ledger = calculateGroupLedger(currentGroup, currentMonthKey) || {
    balance: 0,
    monthIncome: 0,
    monthExpense: 0,
    totalIncome: 0,
    totalExpense: 0,
    transactions: []
  };
  const paymentStatus = getMonthPaymentStatus(currentGroup, currentMonthKey) || {
    paidMembers: [],
    unpaidMembers: [],
    paidCount: 0,
    totalMembers: 0,
    percentage: 0
  };

  // Look up local user avatar if currentUserAvatar is null
  let localUserAvatar = currentUserAvatar || null;
  if (!localUserAvatar && typeof window !== 'undefined') {
    try {
      localUserAvatar = localStorage.getItem('user_profile_image') || null;
    } catch {
      localUserAvatar = null;
    }
  }

  // Helper to get real avatar for any member (by id or by name)
  const getMemberAvatar = (memberId, memberName) => {
    const memberObj = safeMembers.find(m => (memberId && m.id === memberId) || (memberName && m.name === memberName));
    const isMe = (memberObj && (memberObj.isCurrentUser || memberObj.name === currentUserName)) || memberName === currentUserName || memberId === 'mem_cur';
    if (memberObj && memberObj.avatar) return memberObj.avatar;
    if (isMe && localUserAvatar) return localUserAvatar;
    return null;
  };

  // Generate real member names string for subtitle (e.g. "Redilah, Rian, Sarah")
  const memberNamesSubtext = (group?.members || [])
    .map(m => m.name || (m.isCurrentUser ? currentUserName : 'Anggota'))
    .join(', ');

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!chatInputText.trim()) return;
    onSendTextMessage({
      groupId: group.id,
      text: chatInputText,
      senderName: currentUserName,
      senderId: 'mem_cur'
    });
    setChatInputText('');
  };

  const handleShareGroupLink = () => {
    setIsMenuDropdownOpen(false);
    const inviteUrl = `https://cassiel.app/join?g=${group.inviteCode || 'CASSIEL'}`;
    const text = `Yuk gabung ke grup keuangan "${group.name}" di Cassiel untuk transparansi kas bersama! Klik link: ${inviteUrl}`;
    if (navigator.share) {
      navigator.share({ title: `Gabung ke ${group.name}`, text, url: inviteUrl }).catch(() => {});
    } else {
      navigator.clipboard.writeText(text);
      alert('Tautan invite grup berhasil disalin ke clipboard!');
    }
  };

  const handleCreateNewMember = (e) => {
    e.preventDefault();
    if (!newMemberNameInput.trim()) return;
    onAddMember({
      groupId: group.id,
      name: newMemberNameInput.trim(),
      role: 'member'
    });
    setNewMemberNameInput('');
    setIsAddMemberModalOpen(false);
  };

  // If Group Info Screen is open, render GroupInfoScreen
  if (isGroupInfoOpen) {
    return (
      <GroupInfoScreen
        group={group}
        currentUserName={currentUserName}
        currentUserAvatar={currentUserAvatar}
        onBack={() => setIsGroupInfoOpen(false)}
        onUpdateGroup={onUpdateGroup}
        onAddMember={onAddMember}
        onRemoveMember={onRemoveMember}
        onDeleteGroup={onDeleteGroup}
        onOpenKasStatus={() => {
          setIsGroupInfoOpen(false);
          setIsKasStatusOpen(true);
        }}
        onOpenAddMember={() => {
          setIsGroupInfoOpen(false);
          setIsAddMemberModalOpen(true);
        }}
      />
    );
  }

  // Month label formatting (e.g., "Agustus 2026")
  const currentMonthDisplay = formatMonthLabel(currentMonthKey) || 'Bulan Ini';

  return (
    <div
      className="groups-sheet-container"
      style={activeSubTab === 'chat' && currentWallpaper ? {
        backgroundImage: `url(${currentWallpaper})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center center',
        backgroundRepeat: 'no-repeat'
      } : undefined}
      onClick={() => isMenuDropdownOpen && setIsMenuDropdownOpen(false)}
    >
      {/* Top Header Card / WhatsApp-style Selection Header when message selected */}
      {activeSubTab === 'chat' && selectedMessage ? (
        <div className="group-detail-header-card selection-header" style={{ position: 'relative' }}>
          <div className="groups-header-left" style={{ flex: 1, minWidth: 0, gap: '14px' }}>
            <button
              type="button"
              className="groups-back-btn"
              onClick={() => setSelectedMessage(null)}
              aria-label="Batal Seleksi"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
            </button>
            <span style={{ fontSize: '18px', fontWeight: 800, color: '#2D2727' }}>
              1
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              className="group-header-trash-btn"
              onClick={() => setIsDeleteModalOpen(true)}
              aria-label="Hapus Pesan"
              title="Hapus Pesan"
            >
              <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                <line x1="10" y1="11" x2="10" y2="17" />
                <line x1="14" y1="11" x2="14" y2="17" />
              </svg>
            </button>
          </div>
        </div>
      ) : (
        <div className="group-detail-header-card" style={{ position: 'relative' }}>
          <div className="groups-header-left" style={{ flex: 1, minWidth: 0 }}>
            <button type="button" className="groups-back-btn" onClick={onBack} aria-label="Kembali">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
            </button>
            <div
              className="groups-header-profile-trigger"
              onClick={() => setIsGroupInfoOpen(true)}
              style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0, cursor: 'pointer' }}
              title="Lihat Info Grup"
            >
              {group.avatar ? (
                <img
                  src={group.avatar}
                  alt={group.name}
                  style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
                />
              ) : (
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #FAE2CB, #F3DBC4)',
                  color: '#BC6C25',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  boxShadow: '0 2px 6px rgba(0,0,0,0.06)'
                }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
                  </svg>
                </div>
              )}
              <div className="groups-title-box" style={{ minWidth: 0, flex: 1 }}>
                <span className="groups-main-title" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {group.name}
                </span>
                <span className="groups-sub-title" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: '#7E7B78' }}>
                  {memberNamesSubtext || currentUserName}
                </span>
              </div>
            </div>
          </div>

          {/* 3-dots Menu Button & Dropdown */}
          <div style={{ position: 'relative' }}>
            <button
              type="button"
              className="group-header-more-btn"
              onClick={(e) => {
                e.stopPropagation();
                setIsMenuDropdownOpen(!isMenuDropdownOpen);
              }}
              aria-label="Menu Opsi"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="5" r="1.5" />
                <circle cx="12" cy="12" r="1.5" />
                <circle cx="12" cy="19" r="1.5" />
              </svg>
            </button>

            {isMenuDropdownOpen && (
              <div className="group-header-dropdown" onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  className="group-header-dropdown-item"
                  onClick={() => {
                    setIsMenuDropdownOpen(false);
                    setIsGroupInfoOpen(true);
                  }}
                >
                  <span>ℹ️</span>
                  <span>Info Grup</span>
                </button>
                <button
                  type="button"
                  className="group-header-dropdown-item"
                  onClick={handleShareGroupLink}
                >
                  <span>🔗</span>
                  <span>Bagikan Link Grup</span>
                </button>
                <button
                  type="button"
                  className="group-header-dropdown-item"
                  onClick={() => {
                    setIsMenuDropdownOpen(false);
                    setIsAddMemberModalOpen(true);
                  }}
                >
                  <span>👤</span>
                  <span>Tambah Anggota</span>
                </button>
                <button
                  type="button"
                  className="group-header-dropdown-item"
                  onClick={() => {
                    setIsMenuDropdownOpen(false);
                    wallpaperGalleryRef.current?.click();
                  }}
                >
                  <span>🖼️</span>
                  <span>Ganti Wallpaper</span>
                </button>
                {currentWallpaper && (
                  <button
                    type="button"
                    className="group-header-dropdown-item danger"
                    onClick={() => {
                      setIsMenuDropdownOpen(false);
                      handleRemoveWallpaper();
                    }}
                  >
                    <span>🗑️</span>
                    <span>Hapus Wallpaper</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main 2 Tabs: Keuangan | Message (Apple Segmented Style matching reference) */}
      <div className="group-tabs-nav">
        <div className={`group-tabs-slider ${activeSubTab === 'chat' ? 'chat-active' : ''}`} />
        <button
          type="button"
          className={`group-tab-btn ${activeSubTab === 'finance' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('finance')}
        >
          <span>💰</span> Keuangan
        </button>
        <button
          type="button"
          className={`group-tab-btn ${activeSubTab === 'chat' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('chat')}
        >
          <span>💬</span> Message
        </button>
      </div>

      {/* Hidden file input for Wallpaper */}
      <input
        type="file"
        ref={wallpaperGalleryRef}
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleWallpaperGalleryChange}
      />

      {/* TAB 1: FINANCIAL OVERVIEW (EXACT REFERENCE DESIGN) */}
      {activeSubTab === 'finance' && (
        <div className="group-finance-view">
          {/* Card 1: Saldo Kas Saat Ini Hero Card */}
          <div className="group-hero-balance-card">
            <div className="group-hero-balance-label">SALDO KAS SAAT INI</div>
            <div className="group-hero-balance-amount">
              Rp{ledger.balance.toLocaleString('id-ID')}
            </div>

            <div className="group-hero-balance-divider" />

            <div className="group-hero-stats-row">
              {/* Income Col */}
              <div className="group-hero-stat-item">
                <div className="group-hero-stat-icon-circle in">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2D6A43" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="19" x2="12" y2="5" />
                    <polyline points="5 12 12 5 19 12" />
                  </svg>
                </div>
                <div className="group-hero-stat-text-box">
                  <span className="group-hero-stat-label">Pemasukan Bulan Ini</span>
                  <span className="group-hero-stat-val in">+Rp{(ledger.monthIncome || ledger.totalIncome || 0).toLocaleString('id-ID')}</span>
                </div>
              </div>

              <div className="group-hero-stat-v-divider" />

              {/* Expense Col */}
              <div className="group-hero-stat-item">
                <div className="group-hero-stat-icon-circle out">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#BC6C25" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <polyline points="19 12 12 19 5 12" />
                  </svg>
                </div>
                <div className="group-hero-stat-text-box">
                  <span className="group-hero-stat-label">Pengeluaran Bulan Ini</span>
                  <span className="group-hero-stat-val out">-Rp{(ledger.monthExpense || ledger.totalExpense || 0).toLocaleString('id-ID')}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Pelacak Kas Month Tracker Card */}
          <div className="group-tracker-card" onClick={() => setIsKasStatusOpen(true)}>
            <div className="group-tracker-header">
              <span className="group-tracker-title">Pelacak Kas {currentMonthDisplay}</span>
              <button type="button" className="group-tracker-link-btn" onClick={() => setIsKasStatusOpen(true)}>
                <span>Lihat Daftar</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            </div>

            <div className="group-tracker-meta-row">
              <div className="group-tracker-check-status">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
                <span>{paymentStatus.paidCount} dari {paymentStatus.totalMembers || 1} anggota sudah bayar</span>
              </div>
              <span className="group-tracker-percent-text">{paymentStatus.percentage}%</span>
            </div>

            <div className="group-tracker-progress-frame">
              <div className="group-tracker-progress-fill" style={{ width: `${paymentStatus.percentage}%` }} />
            </div>
          </div>

          {/* Card 3: Action Buttons (Bayar Kas = ORANGE, Catat Pengeluaran = White Card with Orange Outline/Text) */}
          <div className="group-buttons-container">
            <button
              type="button"
              className="group-btn-bayar-kas"
              onClick={() => {
                setAddTxMode('kas_in');
                setPrefilledMember(null);
                setIsAddTxOpen(true);
              }}
            >
              <div className="group-btn-icon-circle">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </div>
              <span>Bayar Kas</span>
            </button>

            <button
              type="button"
              className="group-btn-catat-pengeluaran"
              onClick={() => {
                setAddTxMode('expense');
                setPrefilledMember(null);
                setIsAddTxOpen(true);
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
              </svg>
              <span>Catat Pengeluaran</span>
            </button>
          </div>

          {/* Aktivitas Terbaru Header */}
          <div className="group-recent-header">
            <span className="group-recent-title">Aktivitas Terbaru</span>
            <button
              type="button"
              className="group-recent-all-btn"
              onClick={() => setIsKasStatusOpen(true)}
            >
              Lihat Semua
            </button>
          </div>

          {/* Aktivitas List */}
          <div className="group-recent-list">
            {safeTransactions.length === 0 ? (
              <div className="group-recent-empty">
                Belum ada aktivitas kas bulan ini. 🍃
              </div>
            ) : (
              safeTransactions.map(tx => {
                const isKasIn = tx.type === 'kas_in';
                const dateObj = tx.timestamp ? new Date(tx.timestamp) : (tx.date ? new Date(tx.date) : new Date());
                const dateStr = !isNaN(dateObj.getTime())
                  ? dateObj.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
                  : (tx.date || 'Hari ini');
                
                const memberAvatar = isKasIn ? getMemberAvatar(tx.memberId, tx.memberName) : null;

                return (
                  <div key={tx.id} className="group-activity-card">
                    <div className="group-activity-left">
                      {isKasIn ? (
                        memberAvatar ? (
                          <img src={memberAvatar} alt={tx.memberName || 'Anggota'} className="group-activity-avatar-img" />
                        ) : (
                          <div className="group-activity-avatar-placeholder">
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                            </svg>
                          </div>
                        )
                      ) : (
                        <div className="group-activity-avatar-out">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
                          </svg>
                        </div>
                      )}

                      <div className="group-activity-details">
                        <span className="group-activity-name">
                          {isKasIn ? `${tx.memberName || currentUserName} membayar kas` : (tx.purpose || tx.title || 'Pengeluaran Kas')}
                        </span>
                        <span className="group-activity-meta">
                          {dateStr} • {tx.note || (isKasIn ? 'Transfer' : `Oleh: ${tx.paidBy || 'Kasir'}`)}
                        </span>
                      </div>
                    </div>

                    <div className="group-activity-right">
                      <span className={`group-activity-amount ${isKasIn ? 'in' : 'out'}`}>
                        {isKasIn ? '+' : '-'}Rp{Number(tx.amount || 0).toLocaleString('id-ID')}
                      </span>
                      {(tx.proofPhoto || tx.proofImage) && (
                        <button
                          type="button"
                          className="proof-badge-btn"
                          onClick={() => setSelectedProofPreview(tx.proofPhoto || tx.proofImage)}
                        >
                          Nota
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* TAB 2: CHAT VIEW & FINANCIAL MESSAGES */}
      {activeSubTab === 'chat' && (
        <div className="group-chat-view">
          <div className="group-chat-messages-scroll">
            {safeMessages.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px', color: '#888888', fontSize: '13px' }}>
                Mulai percakapan atau bagikan transaksi kas bersama! 💬
              </div>
            ) : (
              safeMessages.map(msg => {
                const isMe = msg.senderName === currentUserName || msg.senderId === 'mem_cur';
                const hasOtherMembers = (group?.members?.length || 1) > 1;
                const msgDate = new Date(msg.timestamp);
                const hours = String(msgDate.getHours()).padStart(2, '0');
                const minutes = String(msgDate.getMinutes()).padStart(2, '0');
                const timeStr = `${hours}.${minutes}`;

                const renderCheckIcon = () => {
                  if (!isMe) return null;
                  if (hasOtherMembers) {
                    return (
                      <svg width="15" height="11" viewBox="0 0 16 11" fill="none" xmlns="http://www.w3.org/2000/svg" className="chat-check-icon double">
                        <path d="M11 1L5.5 8L2.5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M14.5 1L9 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    );
                  }
                  return (
                    <svg width="12" height="11" viewBox="0 0 12 11" fill="none" xmlns="http://www.w3.org/2000/svg" className="chat-check-icon single">
                      <path d="M10 1.5L4.5 8.5L1.5 5.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  );
                };

                const isSelected = selectedMessage?.id === msg.id;

                if (msg.type === 'financial_in') {
                  return (
                    <div
                      key={msg.id}
                      className={`chat-message-row ${isMe ? 'me' : 'other'} ${isSelected ? 'selected' : ''}`}
                      onTouchStart={() => startLongPress(msg)}
                      onTouchEnd={cancelLongPress}
                      onTouchMove={cancelLongPress}
                      onMouseDown={() => startLongPress(msg)}
                      onMouseUp={cancelLongPress}
                      onMouseLeave={cancelLongPress}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        setSelectedMessage(msg);
                      }}
                      onClick={() => handleMessageClick(msg)}
                    >
                      {!isMe && <span className="chat-sender-name">{msg.senderName}</span>}
                      <div className="chat-financial-card in">
                        <div className="fin-card-header">
                          <span>✅ Kas Masuk Terverifikasi</span>
                        </div>
                        <div className="fin-card-amount">
                          +Rp{Number(msg.amount || 0).toLocaleString('id-ID')}
                        </div>
                        <div className="fin-card-meta">
                          {msg.text || `${msg.senderName} membayar kas`}
                        </div>
                        <div className="fin-card-footer">
                          <span className="chat-time-stamp-inside">
                            {timeStr}
                            {renderCheckIcon()}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                }

                if (msg.type === 'financial_out') {
                  return (
                    <div
                      key={msg.id}
                      className={`chat-message-row ${isMe ? 'me' : 'other'} ${isSelected ? 'selected' : ''}`}
                      onTouchStart={() => startLongPress(msg)}
                      onTouchEnd={cancelLongPress}
                      onTouchMove={cancelLongPress}
                      onMouseDown={() => startLongPress(msg)}
                      onMouseUp={cancelLongPress}
                      onMouseLeave={cancelLongPress}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        setSelectedMessage(msg);
                      }}
                      onClick={() => handleMessageClick(msg)}
                    >
                      {!isMe && <span className="chat-sender-name">{msg.senderName}</span>}
                      <div className="chat-financial-card out">
                        <div className="fin-card-header">
                          <span>💸 Pengeluaran Kas Tercatat</span>
                        </div>
                        <div className="fin-card-amount">
                          -Rp{Number(msg.amount || 0).toLocaleString('id-ID')}
                        </div>
                        <div className="fin-card-meta">
                          <b>Untuk:</b> {msg.purpose || msg.title}<br />
                          <b>Dibayar oleh:</b> {msg.paidBy || msg.senderName}
                        </div>
                        <div className="fin-card-footer">
                          <span className="chat-time-stamp-inside">
                            {timeStr}
                            {renderCheckIcon()}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={msg.id}
                    className={`chat-message-row ${isMe ? 'me' : 'other'} ${isSelected ? 'selected' : ''}`}
                    onTouchStart={() => startLongPress(msg)}
                    onTouchEnd={cancelLongPress}
                    onTouchMove={cancelLongPress}
                    onMouseDown={() => startLongPress(msg)}
                    onMouseUp={cancelLongPress}
                    onMouseLeave={cancelLongPress}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      setSelectedMessage(msg);
                    }}
                    onClick={() => handleMessageClick(msg)}
                  >
                    {!isMe && <span className="chat-sender-name">{msg.senderName}</span>}
                    <div className="chat-bubble-text">
                      <div className="chat-bubble-body">
                        <span className="chat-message-content">{msg.text}</span>
                        <span className="chat-time-stamp-inside">
                          {timeStr}
                          {renderCheckIcon()}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={chatBottomRef} />
          </div>

          {/* Plus Action Popup Menu */}
          {isPlusMenuOpen && (
            <div className="chat-plus-menu-popup">
              <button
                type="button"
                className="chat-plus-menu-item kas"
                onClick={() => {
                  setIsPlusMenuOpen(false);
                  setAddTxMode('kas_in');
                  setPrefilledMember(null);
                  setIsAddTxOpen(true);
                }}
              >
                <span>💰</span> Bayar Iuran Kas
              </button>
              <button
                type="button"
                className="chat-plus-menu-item exp"
                onClick={() => {
                  setIsPlusMenuOpen(false);
                  setAddTxMode('expense');
                  setPrefilledMember(null);
                  setIsAddTxOpen(true);
                }}
              >
                <span>💸</span> Catat Pengeluaran Kas
              </button>
            </div>
          )}

          {/* Bottom Chat Bar */}
          <form className="group-chat-bottom-bar" onSubmit={handleSendMessage}>
            <button
              type="button"
              className="chat-action-plus-btn"
              onClick={() => setIsPlusMenuOpen(!isPlusMenuOpen)}
              title="Aksi Finansial"
            >
              +
            </button>
            <input
              type="text"
              className="chat-input-field"
              value={chatInputText}
              onChange={e => setChatInputText(e.target.value)}
              placeholder="Message"
            />
            <button
              type="submit"
              className="chat-send-btn"
              disabled={!chatInputText.trim()}
              aria-label="Kirim Pesan"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </form>
        </div>
      )}

      {/* Submodal: Pelacak Siapa Belum Bayar */}
      {isKasStatusOpen && (
        <GroupKasStatusModal
          group={group}
          monthKey={currentMonthKey}
          currentUserAvatar={currentUserAvatar}
          onClose={() => setIsKasStatusOpen(false)}
          onQuickPay={(member) => {
            setAddTxMode('kas_in');
            setPrefilledMember(member);
            setIsAddTxOpen(true);
          }}
        />
      )}

      {/* Submodal: Bayar Kas / Pengeluaran */}
      {isAddTxOpen && (
        <GroupAddTxModal
          group={group}
          mode={addTxMode}
          prefilledMember={prefilledMember}
          onClose={() => setIsAddTxOpen(false)}
          onSubmitKas={onRecordKas}
          onSubmitExpense={onRecordExpense}
        />
      )}

      {/* Submodal: Preview Bukti Nota */}
      {selectedProofPreview && (
        <div className="group-submodal-overlay" onClick={() => setSelectedProofPreview(null)}>
          <div className="group-submodal-card" style={{ textAlign: 'center' }} onClick={e => e.stopPropagation()}>
            <div className="submodal-header">
              <h3 className="submodal-title">Lampiran Bukti Nota</h3>
              <button type="button" className="submodal-close-btn" onClick={() => setSelectedProofPreview(null)}>✕</button>
            </div>
            <img src={selectedProofPreview} alt="Bukti transaksi" style={{ maxWidth: '100%', maxHeight: '60vh', borderRadius: '14px', objectFit: 'contain' }} />
          </div>
        </div>
      )}

      {/* Submodal: Tambah Anggota */}
      {isAddMemberModalOpen && (
        <div className="group-submodal-overlay" onClick={() => setIsAddMemberModalOpen(false)}>
          <div className="group-submodal-card" onClick={e => e.stopPropagation()}>
            <div className="submodal-header">
              <h3 className="submodal-title">Tambah Anggota ke Grup</h3>
              <button type="button" className="submodal-close-btn" onClick={() => setIsAddMemberModalOpen(false)}>✕</button>
            </div>
            <form onSubmit={handleCreateNewMember}>
              <div className="form-group-item">
                <label className="form-group-label">Nama Anggota Baru</label>
                <input
                  type="text"
                  className="form-group-input"
                  value={newMemberNameInput}
                  onChange={e => setNewMemberNameInput(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className="form-group-submit-btn">
                + Tambahkan Anggota
              </button>
            </form>
          </div>
        </div>
      )}

      {/* WhatsApp-style Delete Message Dialog (matching Image 1) */}
      {isDeleteModalOpen && (
        <div className="wa-delete-dialog-overlay" onClick={() => setIsDeleteModalOpen(false)}>
          <div className="wa-delete-dialog-card" onClick={e => e.stopPropagation()}>
            <h3 className="wa-delete-dialog-title">Delete message?</h3>
            <div className="wa-delete-dialog-actions">
              {(selectedMessage?.senderName === currentUserName || selectedMessage?.senderId === 'mem_cur' || selectedMessage?.senderName === 'Saya') && (
                <button
                  type="button"
                  className="wa-delete-dialog-btn"
                  onClick={() => executeDelete('everyone')}
                >
                  Delete for everyone
                </button>
              )}
              <button
                type="button"
                className="wa-delete-dialog-btn"
                onClick={() => executeDelete('me')}
              >
                Delete for me
              </button>
              <button
                type="button"
                className="wa-delete-dialog-btn cancel"
                onClick={() => setIsDeleteModalOpen(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

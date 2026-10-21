import React, { useState, useRef, useEffect } from 'react';
import { 
  calculateGroupLedger, 
  getMonthPaymentStatus, 
  getCurrentMonthKey, 
  formatMonthLabel,
  subscribeToGroupRealtime,
  getStoredGroups,
  saveStoredGroups,
  getCurrentUserId,
  getGroupInviteUrl,
  syncGroupToCloud
} from '../../utils/groupStorage';
import { clearAppBadgeCount } from '../../utils/notifications';
import { safeStorageGet } from '../../utils/secureStorage';
import GroupKasStatusModal from './GroupKasStatusModal';
import GroupAddTxModal from './GroupAddTxModal';
import GroupInfoScreen from './GroupInfoScreen';

export default function GroupDetailScreen({
  group,
  currentUserName = 'Redilah',
  currentUserAvatar = null,
  initialSubTab = 'finance',
  onBack,
  onRecordKas,
  onRecordExpense,
  onSendTextMessage,
  onDeleteMessage,
  onAddMember,
  onUpdateGroup,
  onRemoveMember,
  onLeaveGroup,
  onDeleteGroup
}) {
  const [activeGroup, setActiveGroup] = useState(group);
  const myUserId = getCurrentUserId();

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
    }, group);

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [group?.id, currentUserName]);
  const [activeSubTab, setActiveSubTab] = useState(initialSubTab || 'finance'); // 'finance' | 'chat'

  useEffect(() => {
    if (initialSubTab) {
      setActiveSubTab(initialSubTab);
    }
  }, [initialSubTab, group?.id]);
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
  const chatScrollRef = useRef(null);
  const chatInputRef = useRef(null);
  const scrollSpringRafRef = useRef(null);
  const screenMountTimeRef = useRef(Date.now());
  const prevMsgCountRef = useRef((group?.messages || []).length);
  const [isSendingPulse, setIsSendingPulse] = useState(false);
  const currentMonthKey = getCurrentMonthKey();

  // Interruptible critically-damped Apple spring scroll (damping = 1.0, response = 0.32s)
  const animateScrollToBottom = (instant = false) => {
    const el = chatScrollRef.current;
    if (!el) return;
    if (scrollSpringRafRef.current) {
      cancelAnimationFrame(scrollSpringRafRef.current);
      scrollSpringRafRef.current = null;
    }
    const targetTop = Math.max(0, el.scrollHeight - el.clientHeight);
    if (instant || Math.abs(targetTop - el.scrollTop) < 2) {
      el.scrollTop = targetTop;
      return;
    }

    let currentPos = el.scrollTop;
    let velocity = 0;
    let lastTime = performance.now();
    const omega = (2 * Math.PI) / 0.32; // critically damped response = 0.32s

    const step = (now) => {
      const dt = Math.min((now - lastTime) / 1000, 0.032);
      lastTime = now;
      const liveTarget = Math.max(0, el.scrollHeight - el.clientHeight);
      const displacement = currentPos - liveTarget;
      // Critically damped spring equation: F = -k*x - c*v where c = 2*omega, k = omega^2
      const accel = -omega * omega * displacement - 2 * omega * velocity;
      velocity += accel * dt;
      currentPos += velocity * dt;
      el.scrollTop = currentPos;

      if (Math.abs(liveTarget - currentPos) > 0.6 || Math.abs(velocity) > 4) {
        scrollSpringRafRef.current = requestAnimationFrame(step);
      } else {
        el.scrollTop = liveTarget;
        scrollSpringRafRef.current = null;
      }
    };

    scrollSpringRafRef.current = requestAnimationFrame(step);
  };

  const cancelScrollSpring = () => {
    if (scrollSpringRafRef.current) {
      cancelAnimationFrame(scrollSpringRafRef.current);
      scrollSpringRafRef.current = null;
    }
  };

  useEffect(() => {
    return () => cancelScrollSpring();
  }, []);

  // Handle tiered Android hardware back button and modal back for internal sub-modals
  useEffect(() => {
    const handleDetailBack = (e) => {
      if (selectedProofPreview) {
        setSelectedProofPreview(null);
        if (e && e.stopImmediatePropagation) e.stopImmediatePropagation();
        if (e && e.preventDefault) e.preventDefault();
        return;
      }
      if (isDeleteModalOpen) {
        setIsDeleteModalOpen(false);
        if (e && e.stopImmediatePropagation) e.stopImmediatePropagation();
        if (e && e.preventDefault) e.preventDefault();
        return;
      }
      if (selectedMessage) {
        setSelectedMessage(null);
        if (e && e.stopImmediatePropagation) e.stopImmediatePropagation();
        if (e && e.preventDefault) e.preventDefault();
        return;
      }
      if (isPlusMenuOpen) {
        setIsPlusMenuOpen(false);
        if (e && e.stopImmediatePropagation) e.stopImmediatePropagation();
        if (e && e.preventDefault) e.preventDefault();
        return;
      }
      if (isMenuDropdownOpen) {
        setIsMenuDropdownOpen(false);
        if (e && e.stopImmediatePropagation) e.stopImmediatePropagation();
        if (e && e.preventDefault) e.preventDefault();
        return;
      }
      if (isAddMemberModalOpen) {
        setIsAddMemberModalOpen(false);
        if (e && e.stopImmediatePropagation) e.stopImmediatePropagation();
        if (e && e.preventDefault) e.preventDefault();
        return;
      }
      if (isAddTxOpen) {
        setIsAddTxOpen(false);
        if (e && e.stopImmediatePropagation) e.stopImmediatePropagation();
        if (e && e.preventDefault) e.preventDefault();
        return;
      }
      if (isKasStatusOpen) {
        setIsKasStatusOpen(false);
        if (e && e.stopImmediatePropagation) e.stopImmediatePropagation();
        if (e && e.preventDefault) e.preventDefault();
        return;
      }
      if (isGroupInfoOpen) {
        setIsGroupInfoOpen(false);
        if (e && e.stopImmediatePropagation) e.stopImmediatePropagation();
        if (e && e.preventDefault) e.preventDefault();
        return;
      }
    };

    window.addEventListener('cassiel_groups_modal_back', handleDetailBack, true);
    return () => {
      window.removeEventListener('cassiel_groups_modal_back', handleDetailBack, true);
    };
  }, [
    selectedProofPreview,
    isDeleteModalOpen,
    selectedMessage,
    isPlusMenuOpen,
    isMenuDropdownOpen,
    isAddMemberModalOpen,
    isAddTxOpen,
    isKasStatusOpen,
    isGroupInfoOpen
  ]);

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

  const currentMessagesList = (activeGroup || group)?.messages;

  // Auto-scroll chat to bottom on new messages and clear app badge count (Unconditional Hook)
  useEffect(() => {
    if (activeSubTab === 'chat' && !isGroupInfoOpen) {
      const count = Array.isArray(currentMessagesList) ? currentMessagesList.length : 0;
      const isNewMessageAdded = count > prevMsgCountRef.current;
      prevMsgCountRef.current = count;
      requestAnimationFrame(() => {
        animateScrollToBottom(!isNewMessageAdded);
      });
      clearAppBadgeCount();
    }
  }, [currentMessagesList, activeSubTab, isGroupInfoOpen]);

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
    const memberObj = safeMembers.find(m => (memberId && (m.userId === memberId || m.id === memberId)) || (memberName && m.name === memberName));
    const isMe = (memberObj && ((memberObj.userId && memberObj.userId === myUserId) || memberObj.id === myUserId || memberObj.isCurrentUser || memberObj.name === currentUserName)) || memberName === currentUserName || memberId === myUserId || memberId === 'mem_cur';
    if (memberObj && memberObj.avatar) return memberObj.avatar;
    if (isMe && localUserAvatar) return localUserAvatar;
    return null;
  };

  // Generate real member names string for subtitle (e.g. "Redilah, Rian, Sarah")
  const memberNamesSubtext = (group?.members || [])
    .map(m => m.name || (((m.userId && m.userId === myUserId) || m.id === myUserId || m.isCurrentUser) ? currentUserName : 'Anggota'))
    .join(', ');

  const handleSendMessage = (e) => {
    e.preventDefault();
    const trimmed = chatInputText.trim();
    if (!trimmed) return;

    // Multimodal harmony: fire subtle haptic on the exact commit frame
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try { navigator.vibrate(8); } catch {}
    }

    setIsSendingPulse(true);
    setTimeout(() => setIsSendingPulse(false), 340);

    setChatInputText('');
    onSendTextMessage({
      groupId: group.id,
      text: trimmed,
      senderName: currentUserName,
      senderId: myUserId
    });

    // Sync local state immediately from storage so bubble mounts with zero latency
    const latestGroups = getStoredGroups(currentUserName);
    const updated = latestGroups.find(g => g.id === group.id);
    if (updated) {
      setActiveGroup(updated);
    }

    requestAnimationFrame(() => {
      animateScrollToBottom(false);
    });
  };

  const handleShareGroupLink = () => {
    setIsMenuDropdownOpen(false);
    const targetGroup = activeGroup || group;
    syncGroupToCloud(targetGroup);
    const inviteUrl = getGroupInviteUrl(targetGroup);
    const text = `Yuk gabung ke grup keuangan "${targetGroup.name}" di Cassiel untuk transparansi kas bersama!\n\nKode Undangan: ${targetGroup.inviteCode || 'CASSIEL'}\nKlik link untuk langsung bergabung:\n${inviteUrl}`;
    if (navigator.share) {
      navigator.share({ title: `Gabung ke ${targetGroup.name}`, text }).catch(() => {});
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
        onLeaveGroup={onLeaveGroup}
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
                <div className="group-header-avatar-glass">
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
          <div
            ref={chatScrollRef}
            className="group-chat-messages-scroll"
            onPointerDown={cancelScrollSpring}
            onTouchStart={cancelScrollSpring}
            onWheel={cancelScrollSpring}
          >
            {safeMessages.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px', color: '#888888', fontSize: '13px' }}>
                Mulai percakapan atau bagikan transaksi kas bersama! 💬
              </div>
            ) : (
              safeMessages.map(msg => {
                const isCustomMyName = Boolean(
                  currentUserName &&
                  currentUserName !== 'Pengguna Cassiel' &&
                  currentUserName !== 'No Name' &&
                  currentUserName !== 'Anggota'
                );
                const hasExplicitSenderId = Boolean(
                  msg.senderId && msg.senderId !== 'system' && msg.senderId !== 'mem_cur'
                );
                const isMe = hasExplicitSenderId
                  ? msg.senderId === myUserId
                  : (msg.senderId === 'mem_cur' || (isCustomMyName && msg.senderName === currentUserName));
                const hasOtherMembers = (group?.members?.length || 1) > 1;
                const msgDate = new Date(msg.timestamp);
                const msgTimeMs = msgDate.getTime() || 0;
                const isFreshMsg = msgTimeMs >= (screenMountTimeRef.current - 300) && (Date.now() - msgTimeMs < 4000);
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
                const matchedMember = (activeGroup?.members || []).find(
                  m => (msg.senderId && (m.id === msg.senderId || m.userId === msg.senderId))
                );
                const displaySenderName = (matchedMember?.name && matchedMember.name !== 'Pengguna Cassiel')
                  ? matchedMember.name
                  : (msg.senderName || matchedMember?.name || 'Anggota');

                const rawText = typeof msg.text === 'string' ? msg.text.trim() : '';
                const isLegacyCreate = /^Grup\s+(.+?)\s+berhasil dibuat\.\s*Selamat mengelola/i.test(rawText) || /membuat grup\s+"/i.test(rawText);
                const isLegacyJoin = /telah bergabung ke dalam grup/i.test(rawText) || /bergabung via tautan undangan/i.test(rawText);
                const isLegacyLeave = /telah keluar dari grup/i.test(rawText) || /keluar dari grup/i.test(rawText);
                const isSystemMsg = msg.type === 'system' || isLegacyCreate || isLegacyJoin || isLegacyLeave;

                if (isSystemMsg) {
                  const activeLang = safeStorageGet('user_app_lang') || 'en';
                  const explicitActorId = (msg.actorId && msg.actorId !== 'system')
                    ? msg.actorId
                    : (msg.senderId && msg.senderId !== 'system' ? msg.senderId : null);

                  const actorMember = (activeGroup?.members || []).find(
                    m => explicitActorId && (m.id === explicitActorId || m.userId === explicitActorId)
                  );
                  const rawActorName = (actorMember?.name && actorMember.name !== 'Pengguna Cassiel')
                    ? actorMember.name
                    : (msg.actorName || (msg.senderName !== 'Sistem Cassiel' ? msg.senderName : '') || actorMember?.name || '');

                  // Jika pesan memiliki explicitActorId (ID unik HP/user), perspektif "You/Anda"
                  // ditentukan 100% dari kecocokan ID perangkat (explicitActorId === myUserId),
                  // sehingga di HP orang lain TIDAK AKAN PERNAH tertulis "You".
                  const isActorMe = explicitActorId
                    ? (explicitActorId === myUserId || explicitActorId === 'mem_cur')
                    : Boolean(isCustomMyName && rawActorName && rawActorName === currentUserName);

                  let systemLabel = rawText;
                  if (msg.systemType === 'group_created' || isLegacyCreate) {
                    const gName = activeGroup?.name || group?.name || '';
                    const adminMember = (activeGroup?.members || []).find(m => m.role === 'admin') || (activeGroup?.members || [])[0];
                    const isCreatorMe = explicitActorId
                      ? isActorMe
                      : Boolean(
                          (adminMember && (adminMember.id === myUserId || adminMember.userId === myUserId)) ||
                          isActorMe
                        );
                    const actor = rawActorName || adminMember?.name || 'Admin';
                    if (activeLang === 'en') {
                      systemLabel = isCreatorMe ? `You created group "${gName}"` : `${actor} created group "${gName}"`;
                    } else if (activeLang === 'jv') {
                      systemLabel = isCreatorMe ? `Panjenengan damel grup "${gName}"` : `${actor} damel grup "${gName}"`;
                    } else if (activeLang === 'zh') {
                      systemLabel = isCreatorMe ? `你创建了群组 "${gName}"` : `${actor} 创建了群组 "${gName}"`;
                    } else if (activeLang === 'ko') {
                      systemLabel = isCreatorMe ? `"${gName}" 그룹을 만들었습니다` : `${actor}님이 "${gName}" 그룹을 만들었습니다`;
                    } else {
                      systemLabel = isCreatorMe ? `Anda membuat grup "${gName}"` : `${actor} membuat grup "${gName}"`;
                    }
                  } else if (msg.systemType === 'member_added') {
                    const target = msg.targetName || (activeLang === 'en' ? 'a member' : 'anggota baru');
                    const actor = rawActorName || 'Admin';
                    if (activeLang === 'en') {
                      systemLabel = isActorMe ? `You added ${target}` : `${actor} added ${target}`;
                    } else if (activeLang === 'jv') {
                      systemLabel = isActorMe ? `Panjenengan nambahaken ${target}` : `${actor} nambahaken ${target}`;
                    } else if (activeLang === 'zh') {
                      systemLabel = isActorMe ? `你添加了 ${target}` : `${actor} 添加了 ${target}`;
                    } else if (activeLang === 'ko') {
                      systemLabel = isActorMe ? `${target}님을 추가했습니다` : `${actor}님이 ${target}님을 추가했습니다`;
                    } else {
                      systemLabel = isActorMe ? `Anda menambahkan ${target}` : `${actor} menambahkan ${target}`;
                    }
                  } else if (msg.systemType === 'member_joined_link' || isLegacyJoin) {
                    let joiner = rawActorName;
                    if (!joiner && isLegacyJoin) {
                      const m = rawText.match(/^👋?\s*(.+?)\s+(?:telah bergabung|bergabung via)/i);
                      if (m && m[1]) joiner = m[1].trim();
                    }
                    const isJoinerMe = explicitActorId
                      ? isActorMe
                      : Boolean(isActorMe || (isCustomMyName && joiner && joiner === currentUserName));
                    const displayJoiner = joiner || (activeLang === 'en' ? 'A member' : 'Anggota baru');
                    if (activeLang === 'en') {
                      systemLabel = isJoinerMe ? 'You joined via invite link' : `${displayJoiner} joined via invite link`;
                    } else if (activeLang === 'jv') {
                      systemLabel = isJoinerMe ? 'Panjenengan gabung lumantar pranala uleman' : `${displayJoiner} gabung lumantar pranala uleman`;
                    } else if (activeLang === 'zh') {
                      systemLabel = isJoinerMe ? '你通过邀请链接加入' : `${displayJoiner} 通过邀请链接加入`;
                    } else if (activeLang === 'ko') {
                      systemLabel = isJoinerMe ? '초대 링크로 참여했습니다' : `${displayJoiner}님이 초대 링크로 참여했습니다`;
                    } else {
                      systemLabel = isJoinerMe ? 'Anda bergabung via tautan undangan' : `${displayJoiner} bergabung via tautan undangan`;
                    }
                  } else if (msg.systemType === 'member_left' || isLegacyLeave) {
                    let leaver = rawActorName;
                    if (!leaver && isLegacyLeave) {
                      const m = rawText.match(/^👋?\s*(.+?)\s+(?:telah keluar|keluar dari)/i);
                      if (m && m[1]) leaver = m[1].trim();
                    }
                    const isLeaverMe = explicitActorId
                      ? isActorMe
                      : Boolean(isActorMe || (isCustomMyName && leaver && leaver === currentUserName));
                    const displayLeaver = leaver || (activeLang === 'en' ? 'A member' : 'Anggota');
                    if (activeLang === 'en') {
                      systemLabel = isLeaverMe ? 'You left' : `${displayLeaver} left`;
                    } else if (activeLang === 'jv') {
                      systemLabel = isLeaverMe ? 'Panjenengan medal saking grup' : `${displayLeaver} medal saking grup`;
                    } else if (activeLang === 'zh') {
                      systemLabel = isLeaverMe ? '你退出了群组' : `${displayLeaver} 退出了群组`;
                    } else if (activeLang === 'ko') {
                      systemLabel = isLeaverMe ? '그룹에서 나갔습니다' : `${displayLeaver}님이 그룹에서 나갔습니다`;
                    } else {
                      systemLabel = isLeaverMe ? 'Anda keluar dari grup' : `${displayLeaver} keluar dari grup`;
                    }
                  }

                  return (
                    <div key={msg.id} className="chat-system-pill-row">
                      <span className="chat-system-pill">{systemLabel}</span>
                    </div>
                  );
                }

                if (msg.type === 'financial_in') {
                  return (
                    <div
                      key={msg.id}
                      className={`chat-message-row ${isMe ? 'me' : 'other'} ${isSelected ? 'selected' : ''} ${isFreshMsg ? 'apple-msg-enter' : ''}`}
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
                      <div className="chat-financial-card in">
                        {!isMe && <span className="chat-sender-name in-fin-card">{displaySenderName}</span>}
                        <div className="fin-card-header">
                          <span>✅ Kas Masuk Terverifikasi</span>
                        </div>
                        <div className="fin-card-amount">
                          +Rp{Number(msg.amount || 0).toLocaleString('id-ID')}
                        </div>
                        <div className="fin-card-meta">
                          {msg.text || `${displaySenderName} membayar kas`}
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
                      className={`chat-message-row ${isMe ? 'me' : 'other'} ${isSelected ? 'selected' : ''} ${isFreshMsg ? 'apple-msg-enter' : ''}`}
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
                      <div className="chat-financial-card out">
                        {!isMe && <span className="chat-sender-name in-fin-card">{displaySenderName}</span>}
                        <div className="fin-card-header">
                          <span>💸 Pengeluaran Kas Tercatat</span>
                        </div>
                        <div className="fin-card-amount">
                          -Rp{Number(msg.amount || 0).toLocaleString('id-ID')}
                        </div>
                        <div className="fin-card-meta">
                          <b>Untuk:</b> {msg.purpose || msg.title}<br />
                          <b>Dibayar oleh:</b> {msg.paidBy || displaySenderName}
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
                    className={`chat-message-row ${isMe ? 'me' : 'other'} ${isSelected ? 'selected' : ''} ${isFreshMsg ? 'apple-msg-enter' : ''}`}
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
                    <div className="chat-bubble-text">
                      {!isMe && (
                        <span className="chat-sender-name">
                          {displaySenderName}
                        </span>
                      )}
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
              ref={chatInputRef}
              type="text"
              className="chat-input-field"
              value={chatInputText}
              onChange={e => setChatInputText(e.target.value)}
              placeholder="Message"
            />
            <button
              type="submit"
              className={`chat-send-btn ${isSendingPulse ? 'is-sending' : ''} ${chatInputText.trim() ? 'has-text' : ''}`}
              disabled={!chatInputText.trim() && !isSendingPulse}
              aria-label="Kirim Pesan"
            >
              {/* Pure 3D Sculpted Apple Liquid Glass Paper Plane Send Icon */}
              <svg
                className="chat-send-glass-icon"
                width="21"
                height="21"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <defs>
                  {/* Active Warm Amber Glass Wing Gradients */}
                  <linearGradient id="lgrSendWingMainAct" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.96" />
                    <stop offset="35%" stopColor="#FFFBEB" stopOpacity="0.75" />
                    <stop offset="70%" stopColor="#FDE68A" stopOpacity="0.45" />
                    <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.85" />
                  </linearGradient>

                  <linearGradient id="lgrSendWingSubAct" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#FEF3C7" stopOpacity="0.85" />
                    <stop offset="50%" stopColor="#F59E0B" stopOpacity="0.48" />
                    <stop offset="100%" stopColor="#D97706" stopOpacity="0.32" />
                  </linearGradient>

                  <linearGradient id="lgrSendEdgeAct" x1="0%" y1="0%" x2="100%" y2="80%">
                    <stop offset="0%" stopColor="#FFFFFF" stopOpacity="1" />
                    <stop offset="50%" stopColor="#FDE68A" stopOpacity="0.85" />
                    <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.95" />
                  </linearGradient>

                  {/* Disabled Frosted Clear Ice Glass Wing Gradients */}
                  <linearGradient id="lgrSendWingMainDis" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.92" />
                    <stop offset="35%" stopColor="#F1F5F9" stopOpacity="0.55" />
                    <stop offset="70%" stopColor="#CBD5E1" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.75" />
                  </linearGradient>

                  <linearGradient id="lgrSendWingSubDis" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#E2E8F0" stopOpacity="0.70" />
                    <stop offset="50%" stopColor="#94A3B8" stopOpacity="0.42" />
                    <stop offset="100%" stopColor="#64748B" stopOpacity="0.25" />
                  </linearGradient>

                  <linearGradient id="lgrSendEdgeDis" x1="0%" y1="0%" x2="100%" y2="80%">
                    <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.98" />
                    <stop offset="50%" stopColor="#CBD5E1" stopOpacity="0.75" />
                    <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.92" />
                  </linearGradient>

                  {/* Center Spine Ridge Specular */}
                  <linearGradient id="lgrSendSpine" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#FFFFFF" stopOpacity="1" />
                    <stop offset="60%" stopColor="#FFFFFF" stopOpacity="0.88" />
                    <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.40" />
                  </linearGradient>
                </defs>

                {/* Underbody Wing Facet (Sisi Bawah Berarsir Refraksi Kedalaman) */}
                <polygon
                  className="send-glass-wing-sub"
                  points="22 2 11.2 13.2 14.8 22"
                  fill={chatInputText.trim() ? "url(#lgrSendWingSubAct)" : "url(#lgrSendWingSubDis)"}
                  stroke={chatInputText.trim() ? "url(#lgrSendEdgeAct)" : "url(#lgrSendEdgeDis)"}
                  strokeWidth="1.15"
                  strokeLinejoin="round"
                />

                {/* Main Top Wing Facet (Sayap Atas Transparan Memantulkan Cahaya Langit) */}
                <polygon
                  className="send-glass-wing-main"
                  points="22 2 2.2 9.4 11.2 13.2"
                  fill={chatInputText.trim() ? "url(#lgrSendWingMainAct)" : "url(#lgrSendWingMainDis)"}
                  stroke={chatInputText.trim() ? "url(#lgrSendEdgeAct)" : "url(#lgrSendEdgeDis)"}
                  strokeWidth="1.15"
                  strokeLinejoin="round"
                />

                {/* Central Folding Spine Ridge (Garis Lipatan Tengah dengan Kilau Kristal) */}
                <line
                  className="send-glass-spine"
                  x1="22"
                  y1="2"
                  x2="11.2"
                  y2="13.2"
                  stroke="url(#lgrSendSpine)"
                  strokeWidth="1.3"
                  strokeLinecap="round"
                />

                {/* Leading Edge Specular Glint (Kilau Tepi Depan) */}
                <path
                  className="send-glass-sheen"
                  d="M 4 9.1 L 21.2 2.3"
                  stroke="#FFFFFF"
                  strokeWidth="0.85"
                  strokeLinecap="round"
                  strokeOpacity="0.95"
                />

                {/* Bottom Trailing Rim Specular Glint */}
                <path
                  className="send-glass-sheen-sub"
                  d="M 11.8 13.8 L 14.5 21.2"
                  stroke="#FFFFFF"
                  strokeWidth="0.75"
                  strokeLinecap="round"
                  strokeOpacity="0.85"
                />
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

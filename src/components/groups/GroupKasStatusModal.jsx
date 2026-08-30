import React, { useState } from 'react';
import { formatMonthLabel } from '../../utils/groupStorage';

export default function GroupKasStatusModal({ group, monthKey, currentUserAvatar = null, onClose, onQuickPay }) {
  const [filterTab, setFilterTab] = useState('all'); // 'all' | 'unpaid' | 'paid'

  if (!group) return null;

  let localUserAvatar = currentUserAvatar || null;
  if (!localUserAvatar && typeof window !== 'undefined') {
    try {
      localUserAvatar = localStorage.getItem('user_profile_image') || null;
    } catch {
      localUserAvatar = null;
    }
  }

  const activeMonth = monthKey || `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
  const tracking = (group.monthlyKasTracking && group.monthlyKasTracking[activeMonth]) || {};
  const members = group.members || [];

  const paidMembers = [];
  const unpaidMembers = [];

  members.forEach(m => {
    const status = tracking[m.id];
    if (status && status.paid) {
      paidMembers.push({ ...m, paidData: status });
    } else {
      unpaidMembers.push(m);
    }
  });

  const totalMembers = members.length;
  const paidCount = paidMembers.length;
  const unpaidCount = unpaidMembers.length;
  const percentage = totalMembers > 0 ? Math.round((paidCount / totalMembers) * 100) : 0;

  const handleShareReminder = (member) => {
    const text = `Halo ${member.name}! Jangan lupa iuran kas ${group.name} untuk bulan ${formatMonthLabel(activeMonth)} sebesar Rp${(group.monthlyFee || 50000).toLocaleString('id-ID')} ya. Buka Cassiel untuk konfirmasi pembayaran: https://cassiel.app/join?g=${group.inviteCode}`;
    if (navigator.share) {
      navigator.share({ title: `Pengingat Kas ${group.name}`, text }).catch(() => {});
    } else {
      navigator.clipboard.writeText(text);
      alert(`Pesan pengingat kas untuk ${member.name} berhasil disalin ke clipboard!`);
    }
  };

  return (
    <div className="group-submodal-overlay" onClick={onClose}>
      <div className="group-submodal-card" onClick={e => e.stopPropagation()}>
        <div className="submodal-header">
          <div>
            <h3 className="submodal-title">Status Iuran Kas</h3>
            <span style={{ fontSize: '12px', color: '#7E7B78', fontWeight: 600 }}>
              {formatMonthLabel(activeMonth)} • {group.name}
            </span>
          </div>
          <button type="button" className="submodal-close-btn" onClick={onClose}>✕</button>
        </div>

        {/* Status Summary Banner */}
        <div style={{
          background: 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)',
          borderRadius: '16px',
          padding: '14px 16px',
          marginBottom: '16px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontWeight: 800, fontSize: '13.5px', color: '#78350F' }}>
            <span>✅ {paidCount} Sudah Bayar</span>
            <span>⚠️ {unpaidCount} Belum Bayar</span>
          </div>
          <div className="unpaid-progress-bar-bg">
            <div className="unpaid-progress-bar-fill" style={{ width: `${percentage}%` }} />
          </div>
          <div style={{ textAlign: 'right', marginTop: '6px', fontSize: '11px', fontWeight: 700, color: '#92400E' }}>
            {percentage}% Terkumpul ({paidCount}/{totalMembers} Anggota)
          </div>
        </div>

        {/* Filter Segmented Tabs */}
        <div style={{ display: 'flex', gap: '6px', marginBottom: '14px', background: '#F8EFE6', padding: '4px', borderRadius: '12px' }}>
          <button
            type="button"
            style={{
              flex: 1,
              padding: '8px 0',
              border: 'none',
              borderRadius: '10px',
              fontWeight: 700,
              fontSize: '12px',
              cursor: 'pointer',
              background: filterTab === 'all' ? '#FFFFFF' : 'transparent',
              color: filterTab === 'all' ? '#2D2727' : '#888888',
              boxShadow: filterTab === 'all' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none'
            }}
            onClick={() => setFilterTab('all')}
          >
            Semua ({totalMembers})
          </button>
          <button
            type="button"
            style={{
              flex: 1,
              padding: '8px 0',
              border: 'none',
              borderRadius: '10px',
              fontWeight: 700,
              fontSize: '12px',
              cursor: 'pointer',
              background: filterTab === 'unpaid' ? '#FFFFFF' : 'transparent',
              color: filterTab === 'unpaid' ? '#B45309' : '#888888',
              boxShadow: filterTab === 'unpaid' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none'
            }}
            onClick={() => setFilterTab('unpaid')}
          >
            Belum Bayar ({unpaidCount})
          </button>
          <button
            type="button"
            style={{
              flex: 1,
              padding: '8px 0',
              border: 'none',
              borderRadius: '10px',
              fontWeight: 700,
              fontSize: '12px',
              cursor: 'pointer',
              background: filterTab === 'paid' ? '#FFFFFF' : 'transparent',
              color: filterTab === 'paid' ? '#2D6A43' : '#888888',
              boxShadow: filterTab === 'paid' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none'
            }}
            onClick={() => setFilterTab('paid')}
          >
            Lunas ({paidCount})
          </button>
        </div>

        {/* Member List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {(filterTab === 'all' ? members : (filterTab === 'unpaid' ? unpaidMembers : paidMembers)).map(m => {
            const isPaid = paidMembers.some(p => p.id === m.id);
            const memberAvatar = m.avatar || (m.isCurrentUser ? localUserAvatar : null);
            return (
              <div
                key={m.id}
                style={{
                  background: '#F8EFE6',
                  borderRadius: '14px',
                  padding: '12px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '10px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {memberAvatar ? (
                    <img
                      src={memberAvatar}
                      alt={m.name}
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        objectFit: 'cover',
                        flexShrink: 0,
                        boxShadow: '0 2px 6px rgba(0,0,0,0.08)'
                      }}
                    />
                  ) : (
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      background: isPaid ? '#E1F0E0' : '#FEF3C7',
                      color: isPaid ? '#2D6A43' : '#B45309',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: '13px',
                      flexShrink: 0
                    }}>
                      {m.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <div style={{ fontSize: '13.5px', fontWeight: 800, color: '#2D2727' }}>
                      {m.name} {m.isCurrentUser && <span style={{ fontSize: '10px', color: '#2D5284', fontWeight: 700 }}>(Saya)</span>}
                    </div>
                    <div style={{ fontSize: '11px', color: isPaid ? '#2D6A43' : '#B45309', fontWeight: 600 }}>
                      {isPaid ? '✅ Lunas' : '⚠️ Belum Bayar'}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '6px' }}>
                  {!isPaid && (
                    <>
                      <button
                        type="button"
                        style={{
                          background: '#E1F0E0',
                          color: '#2D6A43',
                          border: 'none',
                          padding: '6px 10px',
                          borderRadius: '8px',
                          fontSize: '11px',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                        onClick={() => {
                          onClose();
                          onQuickPay(m);
                        }}
                      >
                        Bayarkan
                      </button>
                      <button
                        type="button"
                        style={{
                          background: '#2D5284',
                          color: '#FFFFFF',
                          border: 'none',
                          padding: '6px 10px',
                          borderRadius: '8px',
                          fontSize: '11px',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                        onClick={() => handleShareReminder(m)}
                      >
                        Ingatkan
                      </button>
                    </>
                  )}
                  {isPaid && (
                    <span style={{ fontSize: '12.5px', fontWeight: 800, color: '#2D6A43' }}>
                      Rp{(group.monthlyFee || 50000).toLocaleString('id-ID')}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { getCurrentMonthKey, formatMonthLabel, getCurrentUserId } from '../../utils/groupStorage';

export default function GroupAddTxModal({
  group,
  mode = 'kas_in',
  prefilledMember = null,
  onClose,
  onSubmitKas,
  onSubmitExpense
}) {
  const [txType, setTxType] = useState(mode); // 'kas_in' | 'expense'

  const myUserId = getCurrentUserId();
  const members = Array.isArray(group?.members) ? group.members : [];
  const currentUserMember = members.find(m => (m.userId && m.userId === myUserId) || m.id === myUserId || m.isCurrentUser) || members[0] || { id: myUserId, name: 'Saya' };

  // Helper format nominal ribuan dengan titik (contoh 8000 -> 8.000)
  const formatAmountInput = (val) => {
    if (!val && val !== 0) return '';
    const cleanVal = String(val).replace(/\D/g, '');
    if (!cleanVal) return '';
    return Number(cleanVal).toLocaleString('id-ID');
  };

  // State Kas Masuk
  const [kasMemberId, setKasMemberId] = useState(prefilledMember ? prefilledMember.id : (currentUserMember?.id || ''));
  const [kasAmount, setKasAmount] = useState(formatAmountInput(group?.monthlyFee || 20000));
  const [kasMonth, setKasMonth] = useState(getCurrentMonthKey());
  const [kasNote, setKasNote] = useState('Transfer kas bulanan');

  // State Pengeluaran
  const [expTitle, setExpTitle] = useState('');
  const [expAmount, setExpAmount] = useState('');
  const [expPaidBy, setExpPaidBy] = useState(currentUserMember?.name || 'Saya');
  const [expPurpose, setExpPurpose] = useState('');
  const [expCategory, setExpCategory] = useState('Rapat Organisasi');
  const [expNote, setExpNote] = useState('');
  const [expProof, setExpProof] = useState(null);
  const [expFileName, setExpFileName] = useState('');

  const handleKasSubmit = (e) => {
    e.preventDefault();
    const selectedMember = members.find(m => m.id === kasMemberId) || { name: 'Anggota' };
    const cleanAmount = Number(String(kasAmount).replace(/\D/g, '')) || group?.monthlyFee || 0;
    onSubmitKas({
      groupId: group.id,
      memberId: kasMemberId,
      memberName: selectedMember.name,
      amount: cleanAmount,
      monthKey: kasMonth,
      note: kasNote
    });
    onClose();
  };

  const handleExpenseSubmit = (e) => {
    e.preventDefault();
    const cleanAmount = Number(String(expAmount).replace(/\D/g, ''));
    if (!expTitle.trim() || !cleanAmount) return;
    onSubmitExpense({
      groupId: group.id,
      title: expTitle,
      amount: cleanAmount,
      paidBy: expPaidBy,
      purpose: expPurpose || expTitle,
      category: expCategory,
      note: expNote,
      proofImage: expProof
    });
    onClose();
  };

  const handleProofImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setExpFileName(file.name);
      const reader = new FileReader();
      reader.onload = () => {
        setExpProof(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Month label formatting for display
  const monthDisplayStr = formatMonthLabel(kasMonth) || 'Agustus 2026';

  return (
    <div className="group-submodal-overlay" onClick={onClose}>
      <div className="group-submodal-card redesigned-modal" onClick={e => e.stopPropagation()}>
        {/* Header with Title & Close Circle */}
        <div className="submodal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '20px' }}>{txType === 'kas_in' ? '💰' : '💸'}</span>
            <h3 className="submodal-title">
              {txType === 'kas_in' ? 'Bayar Iuran Kas' : 'Catat Pengeluaran Kas'}
            </h3>
          </div>
          <button type="button" className="submodal-close-btn" onClick={onClose} aria-label="Tutup">
            ✕
          </button>
        </div>

        {/* 2 Tab Toggle Pill */}
        <div className="group-modal-pill-toggle">
          <button
            type="button"
            className={`group-modal-pill-btn ${txType === 'kas_in' ? 'active-kas' : ''}`}
            onClick={() => setTxType('kas_in')}
          >
            <span>💰</span>
            <span>Bayar Kas</span>
          </button>
          <button
            type="button"
            className={`group-modal-pill-btn ${txType === 'expense' ? 'active-exp' : ''}`}
            onClick={() => setTxType('expense')}
          >
            <span>💸</span>
            <span>Pengeluaran</span>
          </button>
        </div>

        {/* FORM 1: BAYAR KAS (MATCHING USER SCREENSHOT 1) */}
        {txType === 'kas_in' && (
          <form onSubmit={handleKasSubmit} className="redesigned-form">
            {/* Field 1: Siapa yang Membayar */}
            <div className="modal-field-block">
              <label className="modal-field-label">Siapa yang Membayar?</label>
              <div className="modal-input-row select-row">
                <div className="modal-input-left-badge green-tint">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2D6A43" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </div>
                <select
                  className="modal-field-control modal-select-control"
                  value={kasMemberId}
                  onChange={e => setKasMemberId(e.target.value)}
                  required
                >
                  {members.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.name} {m.isCurrentUser ? '(Saya)' : ''}
                    </option>
                  ))}
                </select>
                <div className="modal-chevron-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2D2727" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Field 2: Nominal Pembayaran (Rp) */}
            <div className="modal-field-block">
              <label className="modal-field-label">Nominal Pembayaran (Rp)</label>
              <div className="modal-input-row">
                <div className="modal-input-left-badge green-tint">
                  <span style={{ fontSize: '13px', fontWeight: 800, color: '#2D6A43' }}>Rp</span>
                </div>
                <input
                  type="text"
                  inputMode="numeric"
                  className="modal-field-control"
                  value={kasAmount}
                  onChange={e => setKasAmount(formatAmountInput(e.target.value))}
                  required
                />
              </div>
            </div>

            {/* Field 3: Untuk Bulan */}
            <div className="modal-field-block">
              <label className="modal-field-label">Untuk Bulan</label>
              <div className="modal-input-row calendar-row">
                <div className="modal-input-left-badge green-tint">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2D6A43" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                </div>
                <div className="modal-date-display-box">
                  <span className="modal-date-text">{monthDisplayStr}</span>
                  <input
                    type="month"
                    className="modal-invisible-month-input"
                    value={kasMonth}
                    onChange={e => setKasMonth(e.target.value)}
                    required
                  />
                </div>
                <div className="modal-calendar-right-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#666666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Field 4: Catatan / Metode (Opsional) */}
            <div className="modal-field-block">
              <label className="modal-field-label">Catatan / Metode (Opsional)</label>
              <div className="modal-input-row">
                <div className="modal-input-left-badge green-tint">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2D6A43" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                    <polyline points="10 9 9 9 8 9" />
                  </svg>
                </div>
                <input
                  type="text"
                  className="modal-field-control"
                  value={kasNote}
                  onChange={e => setKasNote(e.target.value)}
                />
              </div>
            </div>

            {/* Submit Button (Orange with Check Circle matching app theme) */}
            <button type="submit" className="modal-orange-submit-btn">
              <div className="modal-btn-check-circle orange">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#E67A35" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <span>Konfirmasi Kas Masuk</span>
            </button>
          </form>
        )}

        {/* FORM 2: CATAT PENGELUARAN (MATCHING USER SCREENSHOT 2) */}
        {txType === 'expense' && (
          <form onSubmit={handleExpenseSubmit} className="redesigned-form">
            {/* Field 1: Judul Pengeluaran */}
            <div className="modal-field-block-exp">
              <div className="modal-input-left-badge-outside orange-tint">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#E67A35" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                </svg>
              </div>
              <div className="modal-field-exp-content">
                <label className="modal-field-label">Judul Pengeluaran</label>
                <div className="modal-input-row-plain">
                  <input
                    type="text"
                    className="modal-field-control-plain"
                    value={expTitle}
                    onChange={e => setExpTitle(e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Field 2: Nominal Keluar (Rp) */}
            <div className="modal-field-block-exp">
              <div className="modal-input-left-badge-outside orange-tint">
                <span style={{ fontSize: '13px', fontWeight: 800, color: '#E67A35' }}>Rp</span>
              </div>
              <div className="modal-field-exp-content">
                <label className="modal-field-label">Nominal Keluar (Rp)</label>
                <div className="modal-input-row-plain">
                  <input
                    type="text"
                    inputMode="numeric"
                    className="modal-field-control-plain"
                    value={expAmount}
                    onChange={e => setExpAmount(formatAmountInput(e.target.value))}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Field 3: Dibayar / Ditalangi Oleh */}
            <div className="modal-field-block-exp">
              <div className="modal-input-left-badge-outside green-tint">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2D6A43" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>
              <div className="modal-field-exp-content">
                <label className="modal-field-label">Dibayar / Ditalangi Oleh</label>
                <div className="modal-input-row-plain select-row-plain">
                  <select
                    className="modal-field-control-plain modal-select-control-plain"
                    value={expPaidBy}
                    onChange={e => setExpPaidBy(e.target.value)}
                    required
                  >
                    {members.map(m => (
                      <option key={m.id} value={m.name}>
                        {m.name} {m.isCurrentUser ? '(Saya)' : ''}
                      </option>
                    ))}
                  </select>
                  <div className="modal-chevron-icon-plain">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2D2727" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Field 4: Keperluan / Audit Detail */}
            <div className="modal-field-block-exp">
              <div className="modal-input-left-badge-outside yellow-tint">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="9" y="2" width="6" height="4" rx="1" ry="1" />
                  <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                  <line x1="9" y1="12" x2="15" y2="12" />
                  <line x1="9" y1="16" x2="15" y2="16" />
                </svg>
              </div>
              <div className="modal-field-exp-content">
                <label className="modal-field-label">Keperluan / Audit Detail</label>
                <div className="modal-input-row-plain">
                  <input
                    type="text"
                    className="modal-field-control-plain"
                    value={expPurpose}
                    onChange={e => setExpPurpose(e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Field 5: Kategori */}
            <div className="modal-field-block-exp">
              <div className="modal-input-left-badge-outside purple-tint">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                  <line x1="7" y1="7" x2="7.01" y2="7" />
                </svg>
              </div>
              <div className="modal-field-exp-content">
                <label className="modal-field-label">Kategori</label>
                <div className="modal-input-row-plain select-row-plain">
                  <select
                    className="modal-field-control-plain modal-select-control-plain"
                    value={expCategory}
                    onChange={e => setExpCategory(e.target.value)}
                  >
                    <option value="Rapat Organisasi">Rapat Organisasi</option>
                    <option value="Konsumsi">Konsumsi & Makanan</option>
                    <option value="Transportasi">Transportasi / Logistik</option>
                    <option value="Inventaris">Inventaris / Perlengkapan</option>
                    <option value="Sewa Tempat">Sewa Tempat / Ruangan</option>
                    <option value="Lain-lain">Lain-lain</option>
                  </select>
                  <div className="modal-chevron-icon-plain">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2D2727" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Field 6: Lampiran Bukti Nota (Opsional) */}
            <div className="modal-field-block-exp">
              <div className="modal-input-left-badge-outside blue-tint">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                </svg>
              </div>
              <div className="modal-field-exp-content">
                <label className="modal-field-label">Lampiran Bukti Nota (Opsional)</label>
                <label className="modal-file-upload-box">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleProofImageUpload}
                    style={{ display: 'none' }}
                  />
                  <div className="modal-upload-icon-box">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2D6A43" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="17 8 12 3 7 8" />
                      <line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                  </div>
                  <div className="modal-upload-text-box">
                    <span className="modal-upload-title">{expFileName || 'Pilih file'}</span>
                    <span className="modal-upload-subtitle">JPG, PNG, PDF maks. 10MB</span>
                  </div>
                </label>
                {expProof && (
                  <div style={{ marginTop: '8px' }}>
                    <img src={expProof} alt="Bukti nota" style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '10px' }} />
                  </div>
                )}
              </div>
            </div>

            {/* Submit Button (Orange with Check Circle) */}
            <button type="submit" className="modal-orange-submit-btn">
              <div className="modal-btn-check-circle orange">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#E67A35" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <span>Catat Pengeluaran Kas</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

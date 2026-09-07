import React, { useState, useEffect } from 'react';
import kitabisaLogo from '../assets/kitabisa_logo.png';
import {
  DONATION_JOURNEY_STAGES,
  OFFICIAL_YOUTUBE_DOCUMENTATION,
  getUserDonationProofs,
  getKitabisaCurrentActiveStage
} from '../utils/kitabisaTransparencyManager';
import { isProUser } from '../utils/proManager';

export default function KitabisaTransparencyModal({
  isOpen,
  onClose,
  currentUserName = 'Pengguna Cassiel',
  onOpenProModal,
  isPro
}) {
  const [activeTab, setActiveTab] = useState('process'); // 'process' | 'proofs'
  const [currentStage, setCurrentStage] = useState(() => getKitabisaCurrentActiveStage());
  const [isProStatus, setIsProStatus] = useState(() => isProUser() || !!isPro);
  const [proofs, setProofs] = useState([]);
  const [activeProof, setActiveProof] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setIsProStatus(isProUser() || !!isPro);
      setCurrentStage(getKitabisaCurrentActiveStage());
      const list = getUserDonationProofs();
      setProofs(list);
      if (list.length > 0) {
        setActiveProof(list[0]);
      } else {
        setActiveProof(null);
      }
    }
  }, [isOpen, isPro]);

  useEffect(() => {
    const handleProofAdded = (e) => {
      const list = getUserDonationProofs();
      setProofs(list);
      if (e.detail) setActiveProof(e.detail);
    };
    const handleStageChanged = (e) => {
      if (e.detail?.activeStage) setCurrentStage(e.detail.activeStage);
    };
    const handleProChanged = (e) => {
      setIsProStatus(e.detail?.isPro ?? isProUser());
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('cassiel_donation_proof_added', handleProofAdded);
      window.addEventListener('cassiel_kitabisa_stage_changed', handleStageChanged);
      window.addEventListener('cassiel_pro_status_changed', handleProChanged);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('cassiel_donation_proof_added', handleProofAdded);
        window.removeEventListener('cassiel_kitabisa_stage_changed', handleStageChanged);
        window.removeEventListener('cassiel_pro_status_changed', handleProChanged);
      }
    };
  }, []);

  if (!isOpen) return null;

  const hasSubscribed = Boolean(isProStatus || proofs.length > 0);
  const effectiveStage = hasSubscribed ? currentStage : 0;

  const formatRupiah = (val) => {
    return 'Rp' + Number(val || 0).toLocaleString('id-ID');
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 12000,
        background: '#FAF2EA',
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
        fontFamily: 'var(--font-body, system-ui, -apple-system, sans-serif)'
      }}
    >
      {/* Background Ambience Silk */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          pointerEvents: 'none',
          zIndex: 0,
          overflow: 'hidden'
        }}
      >
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 430 932"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none"
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        >
          <defs>
            <linearGradient id="silkFlow1" x1="0" y1="0" x2="430" y2="600" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.25" />
              <stop offset="50%" stopColor="#0284C7" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#FAF2EA" stopOpacity="0" />
            </linearGradient>
            <filter id="silkBlur" x="-10%" y="-10%" width="120%" height="120%" filterUnits="userSpaceOnUse">
              <feGaussianBlur stdDeviation="32" />
            </filter>
          </defs>
          <rect width="100%" height="100%" fill="#FAF2EA" />
          <g filter="url(#silkBlur)">
            <circle cx="380" cy="120" r="180" fill="#0284C7" fillOpacity="0.18" />
            <circle cx="50" cy="450" r="190" fill="#F59E0B" fillOpacity="0.2" />
            <circle cx="360" cy="800" r="210" fill="#10B981" fillOpacity="0.15" />
          </g>
          <path d="M0 0C150 100 300 50 430 200V0H0Z" fill="url(#silkFlow1)" />
        </svg>
      </div>

      {/* Main Container Max Width */}
      <div
        style={{
          width: '100%',
          maxWidth: '430px',
          margin: '0 auto',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          padding: '16px 20px calc(48px + env(safe-area-inset-bottom, 24px))',
          boxSizing: 'border-box',
          position: 'relative',
          zIndex: 2
        }}
      >
        {/* Top Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '14px',
            position: 'relative',
            zIndex: 3
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              padding: '8px',
              marginLeft: '-8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#2D3748'
            }}
            aria-label="Kembali"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>

          <div style={{ width: '32px' }} />
        </div>

        {/* Title & Subtitle */}
        <div style={{ textAlign: 'center', marginBottom: '18px' }}>
          <h2
            style={{
              margin: '0 0 6px',
              fontSize: '21px',
              fontWeight: '800',
              color: '#1F2937',
              letterSpacing: '-0.3px'
            }}
          >
            Jalur Penyaluran Kebaikan
          </h2>
          <p
            style={{
              margin: '0 auto',
              maxWidth: '340px',
              fontSize: '12.5px',
              color: '#6B7280',
              lineHeight: 1.45
            }}
          >
            Pantau pergerakan dana subscription & gift secara real-time dari sebelum masuk hingga tuntas ke Kitabisa.
          </p>
        </div>

        {/* TOGGLE PROSES (APPLE SEGMENTED SPRING CONTROL) */}
        <div
          style={{
            position: 'relative',
            display: 'flex',
            background: 'rgba(0, 0, 0, 0.05)',
            padding: '4px',
            borderRadius: '16px',
            marginBottom: '20px',
            userSelect: 'none',
            WebkitUserSelect: 'none'
          }}
        >
          {/* Apple Sliding Spring Pill Indicator */}
          <div
            style={{
              position: 'absolute',
              top: '4px',
              bottom: '4px',
              left: '4px',
              width: 'calc(50% - 4px)',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #F59E0B, #D97706)',
              boxShadow: '0 4px 14px rgba(217, 119, 6, 0.35)',
              transform: activeTab === 'process' ? 'translateX(0%)' : 'translateX(100%)',
              transition: 'transform 0.38s cubic-bezier(0.34, 1.56, 0.64, 1)',
              pointerEvents: 'none',
              zIndex: 1
            }}
          />

          <button
            type="button"
            onClick={() => setActiveTab('process')}
            style={{
              flex: 1,
              position: 'relative',
              zIndex: 2,
              padding: '10px 14px',
              borderRadius: '12px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: '800',
              fontSize: '13px',
              letterSpacing: '0.2px',
              background: 'transparent',
              color: activeTab === 'process' ? '#FFFFFF' : '#6B7280',
              transition: 'color 0.25s ease, transform 0.12s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
            onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(0.96)'; }}
            onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
            onTouchStart={(e) => { e.currentTarget.style.transform = 'scale(0.96)'; }}
            onTouchEnd={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
          >
            <span>⚡ Proses</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('proofs')}
            style={{
              flex: 1,
              position: 'relative',
              zIndex: 2,
              padding: '10px 14px',
              borderRadius: '12px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: '800',
              fontSize: '13px',
              letterSpacing: '0.2px',
              background: 'transparent',
              color: activeTab === 'proofs' ? '#FFFFFF' : '#6B7280',
              transition: 'color 0.25s ease, transform 0.12s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
            onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(0.96)'; }}
            onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
            onTouchStart={(e) => { e.currentTarget.style.transform = 'scale(0.96)'; }}
            onTouchEnd={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
          >
            <span>📜 Bukti Donasi Saya ({proofs.length})</span>
          </button>
        </div>

        {/* TAB 1: PROSES (WINDING SNAKE JOURNEY) */}
        {activeTab === 'process' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

              {/* BANNER STATUS BERLANGGANAN & TRANSPARANSI */}
              {!hasSubscribed ? (
                <div
                  style={{
                    background: 'linear-gradient(135deg, rgba(254, 243, 199, 0.95), rgba(255, 251, 235, 0.98))',
                    borderRadius: '20px',
                    padding: '16px 18px',
                    boxShadow: '0 4px 16px rgba(217, 119, 6, 0.08)',
                    border: '1px solid rgba(245, 158, 11, 0.25)',
                    textAlign: 'left',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '8px',
                        background: 'linear-gradient(135deg, #F59E0B, #D97706)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#FFFFFF',
                        fontSize: '14px',
                        boxShadow: '0 2px 8px rgba(217, 119, 6, 0.28)'
                      }}
                    >
                      🔒
                    </div>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: '800', color: '#92400E' }}>
                        Status: Belum Berlangganan
                      </div>
                      <div style={{ fontSize: '11px', color: '#B45309' }}>
                        Alur penyaluran donasi belum aktif
                      </div>
                    </div>
                  </div>

                  <p style={{ margin: 0, fontSize: '12px', color: '#78350F', lineHeight: 1.45 }}>
                    Alur transparansi di bawah ini akan aktif dan bergerak otomatis mulai dari <strong>Tahap 1</strong> saat kamu berlangganan <strong>Justice Cassiel</strong>.
                  </p>

                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      if (onOpenProModal) onOpenProModal('general');
                    }}
                    style={{
                      width: '100%',
                      padding: '11px 16px',
                      borderRadius: '12px',
                      background: 'linear-gradient(135deg, #F59E0B, #D97706)',
                      color: '#FFFFFF',
                      fontSize: '12.5px',
                      fontWeight: '800',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      boxShadow: '0 3px 10px rgba(217, 119, 6, 0.28)'
                    }}
                  >
                    <span>👑 Berlangganan Justice Cassiel</span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              ) : (
                <div
                  style={{
                    background: 'linear-gradient(135deg, rgba(236, 253, 245, 0.95), rgba(240, 253, 244, 0.98))',
                    borderRadius: '16px',
                    padding: '12px 16px',
                    border: '1px solid rgba(16, 185, 129, 0.25)',
                    boxShadow: '0 2px 10px rgba(16, 185, 129, 0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                  }}
                >
                  <div
                    style={{
                      width: '26px',
                      height: '26px',
                      borderRadius: '7px',
                      background: 'linear-gradient(135deg, #10B981, #059669)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#FFFFFF',
                      fontSize: '13px',
                      boxShadow: '0 2px 6px rgba(5, 150, 105, 0.25)'
                    }}
                  >
                    ✓
                  </div>
                  <div style={{ flex: 1, textAlign: 'left' }}>
                    <div style={{ fontSize: '12.5px', fontWeight: '800', color: '#065F46' }}>
                      Langganan Aktif • Penyaluran Terlacak
                    </div>
                    <div style={{ fontSize: '11px', color: '#047857' }}>
                      Dana donasimu saat ini berada di Tahap {effectiveStage}
                    </div>
                  </div>
                </div>
              )}

              {/* ZIG-ZAG ARCHITECTURE TIMELINE CONTAINER */}
              <div
                style={{
                  position: 'relative',
                  padding: '24px 16px 20px',
                  background: 'rgba(255, 255, 255, 0.75)',
                  backdropFilter: 'blur(16px)',
                  WebkitBackdropFilter: 'blur(16px)',
                  borderRadius: '24px',
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.03)'
                }}
              >
                {/* Zig-Zag Stepped Arrow Path (SVG) */}
                <svg
                  style={{
                    position: 'absolute',
                    top: '10px',
                    left: 0,
                    width: '100%',
                    height: 'calc(100% - 20px)',
                    pointerEvents: 'none',
                    zIndex: 1
                  }}
                  viewBox="0 0 380 640"
                  preserveAspectRatio="none"
                  fill="none"
                >
                  <defs>
                    {/* Arrow marker right active */}
                    <marker
                      id="arrowRightActive"
                      viewBox="0 0 10 10"
                      refX="5"
                      refY="5"
                      markerWidth="5"
                      markerHeight="5"
                      orient="auto-start-reverse"
                    >
                      <path d="M 0 1 L 8 5 L 0 9 z" fill="#D97706" />
                    </marker>
                    {/* Arrow marker left active */}
                    <marker
                      id="arrowLeftActive"
                      viewBox="0 0 10 10"
                      refX="5"
                      refY="5"
                      markerWidth="5"
                      markerHeight="5"
                      orient="auto-start-reverse"
                    >
                      <path d="M 0 1 L 8 5 L 0 9 z" fill="#D97706" />
                    </marker>
                    {/* Arrow marker right muted */}
                    <marker
                      id="arrowRightMuted"
                      viewBox="0 0 10 10"
                      refX="5"
                      refY="5"
                      markerWidth="5"
                      markerHeight="5"
                      orient="auto-start-reverse"
                    >
                      <path d="M 0 1 L 8 5 L 0 9 z" fill="#D1D5DB" />
                    </marker>
                    {/* Arrow marker left muted */}
                    <marker
                      id="arrowLeftMuted"
                      viewBox="0 0 10 10"
                      refX="5"
                      refY="5"
                      markerWidth="5"
                      markerHeight="5"
                      orient="auto-start-reverse"
                    >
                      <path d="M 0 1 L 8 5 L 0 9 z" fill="#D1D5DB" />
                    </marker>
                  </defs>

                  {/* Start Top Dot */}
                  <circle cx="35" cy="18" r="4" fill={effectiveStage >= 1 ? '#D97706' : '#D1D5DB'} />

                  {/* Line 0 to Stage 1: down then right -> didekatkan presisi ke tepi kotak kanan (x: 87) */}
                  <path
                    d="M 35 22 L 35 72 L 87 72"
                    stroke={effectiveStage >= 1 ? '#D97706' : '#D1D5DB'}
                    strokeWidth="2.2"
                    strokeDasharray="5 4"
                    markerEnd={effectiveStage >= 1 ? 'url(#arrowRightActive)' : 'url(#arrowRightMuted)'}
                  />

                  {/* Line Stage 1 to Stage 2: down from right side (x: 345) then left -> didekatkan presisi ke tepi kotak kiri (x: 293) */}
                  <path
                    d="M 345 115 L 345 198 L 293 198"
                    stroke={effectiveStage >= 2 ? '#D97706' : '#D1D5DB'}
                    strokeWidth="2.2"
                    strokeDasharray="5 4"
                    markerEnd={effectiveStage >= 2 ? 'url(#arrowLeftActive)' : 'url(#arrowLeftMuted)'}
                  />

                  {/* Line Stage 2 to Stage 3: down from left side (x: 35) then right -> didekatkan presisi ke tepi kotak kanan (x: 87) */}
                  <path
                    d="M 35 240 L 35 326 L 87 326"
                    stroke={effectiveStage >= 3 ? '#D97706' : '#D1D5DB'}
                    strokeWidth="2.2"
                    strokeDasharray="5 4"
                    markerEnd={effectiveStage >= 3 ? 'url(#arrowRightActive)' : 'url(#arrowRightMuted)'}
                  />

                  {/* Line Stage 3 to Stage 4: down from right side (x: 345) then left -> didekatkan presisi ke tepi kotak kiri (x: 293) */}
                  <path
                    d="M 345 370 L 345 454 L 293 454"
                    stroke={effectiveStage >= 4 ? '#D97706' : '#D1D5DB'}
                    strokeWidth="2.2"
                    strokeDasharray="5 4"
                    markerEnd={effectiveStage >= 4 ? 'url(#arrowLeftActive)' : 'url(#arrowLeftMuted)'}
                  />

                  {/* Line Stage 4 to Stage 5: down from left side (x: 35) then right -> didekatkan presisi ke tepi kotak kanan (x: 87) */}
                  <path
                    d="M 35 495 L 35 580 L 87 580"
                    stroke={effectiveStage >= 5 ? '#D97706' : '#D1D5DB'}
                    strokeWidth="2.2"
                    strokeDasharray="5 4"
                    markerEnd={effectiveStage >= 5 ? 'url(#arrowRightActive)' : 'url(#arrowRightMuted)'}
                  />
                </svg>

                {/* ZIG-ZAG STAGES LIST */}
                <div style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', gap: '26px' }}>
                  {DONATION_JOURNEY_STAGES.map((stage) => {
                    const isRight = stage.side === 'right'; // Tahap 1, 3, 5 di kanan; Tahap 2, 4 di kiri
                    const isActive = hasSubscribed && effectiveStage === stage.id;
                    const isPast = hasSubscribed && effectiveStage > stage.id;

                    let badgeText = 'Menunggu';
                    let badgeColor = '#9CA3AF';
                    let badgeBg = '#F3F4F6';
                    let stageSubtitle = stage.subtitle;

                    if (!hasSubscribed) {
                      if (stage.id === 1) {
                        badgeText = 'Belum Berlangganan';
                        badgeColor = '#D97706';
                        badgeBg = '#FEF3C7';
                        stageSubtitle = 'Pilihan misi kebaikanmu akan otomatis tersimpan saat kamu berlangganan Justice Cassiel.';
                      } else if (stage.id === 2) {
                        stageSubtitle = 'Dana langganan akan masuk ke Google Play setelah kamu berlangganan.';
                      }
                    } else {
                      if (isPast) {
                        badgeText = '✓ Selesai';
                        badgeColor = '#059669';
                        badgeBg = '#ECFDF5';
                      }
                    }

                    return (
                      <div
                        key={stage.id}
                        style={{
                          display: 'flex',
                          justifyContent: isRight ? 'flex-end' : 'flex-start',
                          width: '100%'
                        }}
                      >
                        <div
                          style={{
                            width: '76%',
                            background: isActive
                              ? 'linear-gradient(135deg, #FFFFFF, #FFFBEB)'
                              : 'rgba(255, 255, 255, 0.94)',
                            borderRadius: '16px',
                            padding: '12px 14px',
                            boxShadow: isActive
                              ? '0 6px 20px rgba(217, 119, 6, 0.22), 0 2px 6px rgba(0, 0, 0, 0.04)'
                              : '0 4px 14px rgba(0, 0, 0, 0.03)',
                            border: isActive
                              ? '2px solid #D97706'
                              : (!hasSubscribed && stage.id === 1)
                                ? '1.5px dashed rgba(217, 119, 6, 0.35)'
                                : 'none',
                            textAlign: 'left',
                            position: 'relative',
                            transition: 'all 0.3s ease',
                            transform: isActive ? 'scale(1.02)' : 'scale(1)'
                          }}
                        >
                          {/* Header Stage Tag & Live Status Indicator */}
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <span
                              style={{
                                fontSize: '10px',
                                fontWeight: '800',
                                color: isActive ? '#FFFFFF' : '#D97706',
                                background: isActive ? 'linear-gradient(135deg, #F59E0B, #D97706)' : 'rgba(217, 119, 6, 0.1)',
                                padding: '2px 8px',
                                borderRadius: '6px',
                                letterSpacing: '0.4px',
                                boxShadow: isActive ? '0 2px 6px rgba(217, 119, 6, 0.3)' : 'none'
                              }}
                            >
                              TAHAP {stage.id}
                            </span>

                            {/* PENANDA POSISI AKTIF SAAT INI DENGAN TITIK BERKEDIP */}
                            {isActive && (
                              <div
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '5px',
                                  background: '#FEF3C7',
                                  color: '#92400E',
                                  padding: '2.5px 8px',
                                  borderRadius: '6px',
                                  fontSize: '10px',
                                  fontWeight: '800'
                                }}
                              >
                                <span
                                  className="live-pulsing-dot"
                                  style={{
                                    width: '7px',
                                    height: '7px',
                                    borderRadius: '50%',
                                    background: '#D97706',
                                    display: 'inline-block',
                                    boxShadow: '0 0 0 0 rgba(217, 119, 6, 0.7)',
                                    animation: 'liveBlinkPulse 1.4s infinite cubic-bezier(0.4, 0, 0.6, 1)'
                                  }}
                                />
                                <span>📍 Posisi Saat Ini</span>
                              </div>
                            )}

                            {/* STATUS BADGE JIKA BUKAN ACTIVE */}
                            {!isActive && (
                              <span
                                style={{
                                  fontSize: '10px',
                                  fontWeight: isPast || (!hasSubscribed && stage.id === 1) ? '700' : '600',
                                  color: badgeColor,
                                  background: badgeBg,
                                  padding: '2px 6px',
                                  borderRadius: '5px'
                                }}
                              >
                                {badgeText}
                              </span>
                            )}
                          </div>

                          {/* Stage Title with Emoji */}
                          <div
                            style={{
                              fontSize: '14px',
                              fontWeight: '800',
                              color: '#1F2937',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              marginBottom: '3px'
                            }}
                          >
                            <span>{stage.iconEmoji}</span>
                            <span style={{ color: isActive ? '#B45309' : '#1F2937' }}>{stage.title}</span>
                          </div>

                          {/* Stage Subtitle */}
                          <div
                            style={{
                              fontSize: '11.5px',
                              color: isActive ? '#78350F' : '#6B7280',
                              lineHeight: 1.4,
                              fontWeight: isActive ? '500' : 'normal'
                            }}
                          >
                            {stageSubtitle}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* DOKUMENTASI VIDEO YOUTUBE PENYALURAN CARD (WARM AMBER CASSIEL PALETTE) */}
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(16px)',
                borderRadius: '20px',
                padding: '16px 18px',
                boxShadow: '0 6px 20px rgba(0, 0, 0, 0.04)',
                textAlign: 'left'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '7px',
                      background: 'linear-gradient(135deg, #F59E0B, #D97706)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#FFFFFF',
                      boxShadow: '0 2px 8px rgba(217, 119, 6, 0.28)'
                    }}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" />
                    </svg>
                  </div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: '800', color: '#1F2937' }}>
                      Dokumentasi Video Penyaluran
                    </div>
                    <div style={{ fontSize: '11px', color: '#6B7280' }}>
                      {OFFICIAL_YOUTUBE_DOCUMENTATION.channelName}
                    </div>
                  </div>
                </div>
              </div>

              {/* YouTube Video Action Banner */}
              <div
                style={{
                  position: 'relative',
                  width: '100%',
                  height: '150px',
                  borderRadius: '14px',
                  overflow: 'hidden',
                  background: 'linear-gradient(135deg, #2D2520, #1F1B18)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#FFFFFF',
                  marginBottom: '12px',
                  boxShadow: '0 4px 14px rgba(0, 0, 0, 0.08)'
                }}
              >
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #F59E0B, #D97706)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 16px rgba(217, 119, 6, 0.45)',
                    marginBottom: '8px',
                    cursor: 'pointer'
                  }}
                  onClick={() => {
                    window.open(OFFICIAL_YOUTUBE_DOCUMENTATION.youtubeUrl, '_blank');
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="#FFFFFF">
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                </div>
                <div style={{ fontSize: '12.5px', fontWeight: '800', textAlign: 'center', padding: '0 16px' }}>
                  {OFFICIAL_YOUTUBE_DOCUMENTATION.title}
                </div>
              </div>

              {/* WARM ORANGE ACTION BUTTON */}
              <a
                href={OFFICIAL_YOUTUBE_DOCUMENTATION.youtubeUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #F59E0B, #D97706)',
                  color: '#FFFFFF',
                  fontSize: '13.5px',
                  fontWeight: '800',
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  boxShadow: '0 4px 14px rgba(217, 119, 6, 0.32)',
                  boxSizing: 'border-box'
                }}
              >
                <span>Tonton Dokumentasi di YouTube</span>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                  <polyline points="15 3 21 3 21 9" />
                  <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
              </a>
              </div>
            </div>
          )}

        {/* TAB 2: BUKTI DONASI SAYA (PERSONAL PROOF OF IMPACT) */}
        {activeTab === 'proofs' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {proofs.length === 0 ? (
              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.88)',
                  backdropFilter: 'blur(16px)',
                  borderRadius: '20px',
                  padding: '36px 20px',
                  textAlign: 'center',
                  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.03)'
                }}
              >
                <div style={{ fontSize: '42px', marginBottom: '10px' }}>📜</div>
                <div style={{ fontSize: '16px', fontWeight: '800', color: '#1F2937', marginBottom: '6px' }}>
                  Belum Ada Bukti Donasi
                </div>
                <p style={{ fontSize: '13px', color: '#6B7280', lineHeight: 1.45, marginBottom: '18px' }}>
                  Saat kamu berlangganan Justice Cassiel atau mengirim gift, bukti resmi penyaluran ke Kitabisa akan otomatis terbit di akunmu di sini.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    if (onOpenProModal) onOpenProModal('general');
                  }}
                  style={{
                    padding: '12px 20px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #F59E0B, #D97706)',
                    color: '#FFFFFF',
                    fontSize: '13.5px',
                    fontWeight: '800',
                    border: 'none',
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(217, 119, 6, 0.28)'
                  }}
                >
                  Berlangganan & Salurkan Kebaikan
                </button>
              </div>
            ) : (
              <>
                {/* Proof of Impact Certificate Card */}
                {activeProof && (
                  <div
                    style={{
                      background: 'linear-gradient(135deg, #FFFFFF, #FFFBF5)',
                      borderRadius: '22px',
                      padding: '22px 20px',
                      boxShadow: '0 10px 30px rgba(217, 119, 6, 0.12), 0 2px 8px rgba(0, 0, 0, 0.04)',
                      border: '1.5px solid rgba(245, 158, 11, 0.2)',
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                  >
                    {/* Background Watermark Crest */}
                    <div
                      style={{
                        position: 'absolute',
                        right: '-20px',
                        bottom: '-20px',
                        width: '160px',
                        height: '160px',
                        opacity: 0.05,
                        pointerEvents: 'none'
                      }}
                    >
                      <img
                        src={kitabisaLogo}
                        alt="Watermark"
                        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                      />
                    </div>

                    {/* Certificate Top Header */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <img
                          src={kitabisaLogo}
                          alt="Kitabisa"
                          style={{ width: '24px', height: '24px', borderRadius: '6px', objectFit: 'cover' }}
                        />
                        <div>
                          <div style={{ fontSize: '11px', fontWeight: '800', color: '#0284C7', letterSpacing: '0.5px' }}>
                            SERTIFIKAT DAMPAK SOSIAL
                          </div>
                          <div style={{ fontSize: '10px', color: '#9CA3AF' }}>
                            No. {activeProof.certificateNumber}
                          </div>
                        </div>
                      </div>

                      <div
                        style={{
                          background: '#ECFDF5',
                          color: '#059669',
                          fontSize: '10px',
                          fontWeight: '800',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        ✓ {activeProof.status}
                      </div>
                    </div>

                    {/* Recipient / Donor Name */}
                    <div style={{ textAlign: 'center', margin: '14px 0' }}>
                      {/* Pioneer Backer Seal */}
                      <div style={{ marginBottom: '8px' }}>
                        <span
                          style={{
                            fontSize: '10.5px',
                            fontWeight: '800',
                            background: 'linear-gradient(135deg, #F59E0B, #D97706)',
                            color: '#FFFFFF',
                            padding: '3.5px 12px',
                            borderRadius: '999px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            boxShadow: '0 2px 8px rgba(217, 119, 6, 0.3)',
                            letterSpacing: '0.4px',
                            textTransform: 'uppercase'
                          }}
                        >
                          {activeProof.donorLabel || 'Donatur #000001'}
                        </span>
                      </div>
                      <div style={{ fontSize: '11px', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                        Diberikan Sebagai Apresiasi Kepada:
                      </div>
                      <div style={{ fontSize: '18px', fontWeight: '800', color: '#1F2937', margin: '4px 0' }}>
                        {activeProof.userName || currentUserName}
                      </div>
                      <div style={{ fontSize: '12px', color: '#D97706', fontWeight: '700' }}>
                        Atas Partisipasi Langganan {activeProof.planTitle}
                      </div>
                    </div>

                    {/* Donation Detail Box */}
                    <div
                      style={{
                        background: 'rgba(245, 158, 11, 0.06)',
                        borderRadius: '14px',
                        padding: '12px 14px',
                        marginBottom: '14px'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
                        <span style={{ color: '#6B7280' }}>Misi Penyaluran:</span>
                        <span style={{ fontWeight: '800', color: '#1F2937' }}>{activeProof.causeTitle}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
                        <span style={{ color: '#6B7280' }}>Penyelenggara:</span>
                        <span style={{ fontWeight: '700', color: '#0284C7' }}>{activeProof.causeOrganizer}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
                        <span style={{ color: '#6B7280' }}>Tanggal Penyaluran:</span>
                        <span style={{ fontWeight: '600', color: '#374151' }}>{activeProof.dateFormatted}</span>
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          paddingTop: '6px',
                          borderTop: '1px dashed rgba(217, 119, 6, 0.2)',
                          marginTop: '6px'
                        }}
                      >
                        <span style={{ fontSize: '12px', fontWeight: '700', color: '#92400E' }}>Alokasi Dana Donasi:</span>
                        <span style={{ fontSize: '15px', fontWeight: '800', color: '#D97706' }}>
                          {formatRupiah(activeProof.amountDonated)}
                        </span>
                      </div>
                    </div>

                    {/* YouTube Proof Direct Link Button */}
                    <a
                      href={activeProof.youtubeUrl || OFFICIAL_YOUTUBE_DOCUMENTATION.youtubeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        width: '100%',
                        padding: '10px',
                        borderRadius: '10px',
                        background: 'rgba(239, 68, 68, 0.1)',
                        color: '#DC2626',
                        fontSize: '12px',
                        fontWeight: '800',
                        textDecoration: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        boxSizing: 'border-box'
                      }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" />
                      </svg>
                      <span>Lihat Dokumentasi Penyaluran (YouTube)</span>
                    </a>
                  </div>
                )}

                {/* List of Other Proofs if multiple */}
                {proofs.length > 1 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ fontSize: '12px', fontWeight: '800', color: '#4B5563', paddingLeft: '4px' }}>
                      Riwayat Bukti Donasi Lainnya:
                    </div>
                    {proofs.map(p => (
                      <div
                        key={p.id}
                        onClick={() => setActiveProof(p)}
                        style={{
                          background: activeProof?.id === p.id ? 'rgba(255, 255, 255, 0.95)' : 'rgba(255, 255, 255, 0.7)',
                          borderRadius: '14px',
                          padding: '10px 14px',
                          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.03)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between'
                        }}
                      >
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: '700', color: '#1F2937' }}>
                            {p.causeTitle}
                          </div>
                          <div style={{ fontSize: '11px', color: '#6B7280' }}>
                            {p.dateFormatted} • {formatRupiah(p.amountDonated)}
                          </div>
                        </div>
                        <span style={{ fontSize: '11px', fontWeight: '800', color: '#D97706' }}>
                          Lihat Sertifikat →
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Extra Bottom Spacer */}
        <div style={{ height: '30px', width: '100%', flexShrink: 0 }} />
      </div>
    </div>
  );
}

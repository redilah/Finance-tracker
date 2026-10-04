import React, { useState, useEffect } from 'react';
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
  const [isCardFlipped, setIsCardFlipped] = useState(false);

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

  // Handle swipe-to-back & back events
  useEffect(() => {
    if (!isOpen) return;

    const handleBackEvent = (e) => {
      if (e && e.preventDefault) e.preventDefault();
      onClose();
    };

    window.addEventListener('cassiel_kitabisa_modal_back', handleBackEvent);

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

      // Swipe from left to right: edge starting point (<= 60px) or clean horizontal right-swipe (deltaX >= 50px)
      if (startX <= 60 && deltaX >= 50 && Math.abs(deltaX) > Math.abs(deltaY) * 1.2 && duration < 550) {
        onClose();
      }
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('cassiel_kitabisa_modal_back', handleBackEvent);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const displayProofs = proofs;
  const currentActiveProof = activeProof || (displayProofs.length > 0 ? displayProofs[0] : null);

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
              padding: '9px 8px',
              borderRadius: '12px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: '800',
              fontSize: 'clamp(11px, 3.2vw, 12.5px)',
              letterSpacing: '0.1px',
              whiteSpace: 'nowrap',
              background: 'transparent',
              color: activeTab === 'process' ? '#FFFFFF' : '#6B7280',
              transition: 'color 0.25s ease, transform 0.12s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '5px'
            }}
            onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(0.96)'; }}
            onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
            onTouchStart={(e) => { e.currentTarget.style.transform = 'scale(0.96)'; }}
            onTouchEnd={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
          >
            <span style={{ whiteSpace: 'nowrap' }}>⚡ Proses</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('proofs')}
            style={{
              flex: 1,
              position: 'relative',
              zIndex: 2,
              padding: '9px 8px',
              borderRadius: '12px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: '800',
              fontSize: 'clamp(11px, 3.2vw, 12.5px)',
              letterSpacing: '0.1px',
              whiteSpace: 'nowrap',
              background: 'transparent',
              color: activeTab === 'proofs' ? '#FFFFFF' : '#6B7280',
              transition: 'color 0.25s ease, transform 0.12s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '5px'
            }}
            onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(0.96)'; }}
            onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
            onTouchStart={(e) => { e.currentTarget.style.transform = 'scale(0.96)'; }}
            onTouchEnd={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
          >
            <span style={{ whiteSpace: 'nowrap' }}>📜 Bukti Donasi Saya ({proofs.length})</span>
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
            {displayProofs.length === 0 ? (
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
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
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
              </div>
            ) : (
              <>
                {/* 3D Interactive Flip Card (Front & Back Integration) */}
                {currentActiveProof && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {/* Perspective Stage Container */}
                    <div
                      style={{
                        perspective: '1200px',
                        width: '100%',
                        cursor: 'pointer',
                        userSelect: 'none',
                        WebkitUserSelect: 'none'
                      }}
                      onClick={() => setIsCardFlipped(prev => !prev)}
                    >
                      {/* Flipper Wrapper */}
                      <div
                        style={{
                          position: 'relative',
                          width: '100%',
                          aspectRatio: '1.586 / 1',
                          borderRadius: '20px',
                          transformStyle: 'preserve-3d',
                          transition: 'transform 0.65s cubic-bezier(0.34, 1.56, 0.64, 1)',
                          transform: isCardFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                          boxShadow: '0 20px 45px rgba(0, 0, 0, 0.7), 0 4px 14px rgba(255, 255, 255, 0.05)'
                        }}
                      >
                        {/* ================= CARD FRONT ================= */}
                        <div
                          style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            borderRadius: '20px',
                            background: 'radial-gradient(circle at 20% 30%, #1c1c1f 0%, #0a0a0c 60%, #000000 100%)',
                            overflow: 'hidden',
                            padding: '22px 24px',
                            boxSizing: 'border-box',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            color: '#FFFFFF',
                            border: '1px solid rgba(255, 255, 255, 0.12)',
                            backfaceVisibility: 'hidden',
                            WebkitBackfaceVisibility: 'hidden'
                          }}
                        >
                          {/* 3D Isometric Dark Stepped Monolithic Blocks (Reference Matching) */}
                          <svg
                            style={{
                              position: 'absolute',
                              top: 0,
                              right: 0,
                              bottom: 0,
                              width: '100%',
                              height: '100%',
                              pointerEvents: 'none',
                              zIndex: 1
                            }}
                            viewBox="0 0 360 227"
                            preserveAspectRatio="none"
                            fill="none"
                          >
                            <defs>
                              <linearGradient id="cubeTop1" x1="0" y1="0" x2="1" y2="1">
                                <stop offset="0%" stopColor="#404044" />
                                <stop offset="100%" stopColor="#28282b" />
                              </linearGradient>
                              <linearGradient id="cubeTop2" x1="0" y1="0" x2="1" y2="1">
                                <stop offset="0%" stopColor="#323236" />
                                <stop offset="100%" stopColor="#1f1f22" />
                              </linearGradient>
                              <linearGradient id="cubeFront" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#17171a" />
                                <stop offset="100%" stopColor="#08080a" />
                              </linearGradient>
                              <linearGradient id="cubeDeepShadow" x1="0" y1="0" x2="1" y2="0">
                                <stop offset="0%" stopColor="#0a0a0c" />
                                <stop offset="100%" stopColor="#000000" />
                              </linearGradient>
                              <linearGradient id="cubeSpecularEdge" x1="0" y1="0" x2="1" y2="0.6">
                                <stop offset="0%" stopColor="#8e8e93" stopOpacity="0.75" />
                                <stop offset="60%" stopColor="#545458" stopOpacity="0.4" />
                                <stop offset="100%" stopColor="#2c2c2e" stopOpacity="0.1" />
                              </linearGradient>
                            </defs>

                            <polygon points="0,0 120,0 200,227 0,227" fill="#09090b" opacity="0.95" />
                            <polygon points="90,115 155,125 100,227 40,227" fill="#0d0d10" />
                            <line x1="90" y1="115" x2="155" y2="125" stroke="#3a3a3c" strokeWidth="1" />

                            {/* BLOCK 1 */}
                            <polygon points="125,20 280,45 360,35 240,0 95,0" fill="url(#cubeTop2)" />
                            <polygon points="125,20 280,45 280,58 125,33" fill="url(#cubeFront)" />
                            <line x1="95" y1="0" x2="280" y2="45" stroke="url(#cubeSpecularEdge)" strokeWidth="1.2" />
                            <line x1="125" y1="33" x2="280" y2="58" stroke="#000000" strokeWidth="2.5" />

                            {/* BLOCK 2 */}
                            <polygon points="228,38 275,44 260,82 215,74" fill="url(#cubeTop1)" />
                            <polygon points="215,74 260,82 258,92 213,84" fill="url(#cubeFront)" />
                            <polygon points="260,82 275,44 275,52 258,92" fill="url(#cubeDeepShadow)" />
                            <line x1="228" y1="38" x2="215" y2="74" stroke="url(#cubeSpecularEdge)" strokeWidth="1.2" />
                            <line x1="215" y1="74" x2="260" y2="82" stroke="#636366" strokeWidth="1" />
                            <line x1="213" y1="84" x2="258" y2="92" stroke="#000000" strokeWidth="2.5" />

                            {/* BLOCK 3 */}
                            <polygon points="135,42 270,72 360,110 360,95 285,55" fill="url(#cubeTop2)" />
                            <polygon points="135,42 270,72 260,98 125,68" fill="url(#cubeFront)" />
                            <line x1="135" y1="42" x2="360" y2="110" stroke="url(#cubeSpecularEdge)" strokeWidth="1.3" />
                            <line x1="125" y1="68" x2="260" y2="98" stroke="#000000" strokeWidth="2" />

                            {/* BLOCK 4 */}
                            <polygon points="152,78 262,104 360,152 360,135 240,92" fill="url(#cubeTop1)" />
                            <polygon points="152,78 262,104 246,144 136,118" fill="url(#cubeFront)" />
                            <line x1="152" y1="78" x2="360" y2="152" stroke="url(#cubeSpecularEdge)" strokeWidth="1.5" />
                            <line x1="136" y1="118" x2="246" y2="144" stroke="#000000" strokeWidth="2.5" />

                            {/* BLOCK 5 */}
                            <polygon points="170,126 255,148 360,202 360,185 245,138" fill="url(#cubeTop2)" />
                            <polygon points="170,126 255,148 240,188 155,166" fill="url(#cubeFront)" />
                            <line x1="170" y1="126" x2="360" y2="202" stroke="url(#cubeSpecularEdge)" strokeWidth="1.2" />
                            <line x1="155" y1="166" x2="240" y2="188" stroke="#000000" strokeWidth="2.5" />

                            {/* BLOCK 6 */}
                            <polygon points="200,174 275,194 360,227 360,220 280,188" fill="url(#cubeTop1)" />
                            <polygon points="200,174 275,194 265,227 190,207" fill="url(#cubeFront)" />
                            <line x1="200" y1="174" x2="360" y2="227" stroke="url(#cubeSpecularEdge)" strokeWidth="1.3" />

                            {/* BLOCK 7 */}
                            <polygon points="255,0 360,22 360,5 295,0" fill="url(#cubeTop1)" />
                            <line x1="255" y1="0" x2="360" y2="22" stroke="url(#cubeSpecularEdge)" strokeWidth="1.1" />

                            <polygon points="120,40 160,82 140,125 100,65" fill="#050507" opacity="0.6" />
                          </svg>

                          {/* Top Row: Logo & Brand Name */}
                          <div
                            style={{
                              position: 'relative',
                              zIndex: 2,
                              display: 'flex',
                              alignItems: 'flex-start',
                              justifyContent: 'space-between'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '11px' }}>
                              <img
                                src="./cf-logo-white.png"
                                alt="Cassiel CF"
                                style={{
                                  width: '28px',
                                  height: '28px',
                                  objectFit: 'contain',
                                  filter: 'drop-shadow(0 2px 6px rgba(0, 0, 0, 0.7)) drop-shadow(0 0 10px rgba(255, 255, 255, 0.25))'
                                }}
                              />
                              <div>
                                <div style={{ fontSize: '15px', fontWeight: '900', letterSpacing: '1.8px', textTransform: 'uppercase', lineHeight: 1.15, color: '#FFFFFF', textShadow: '0 2px 8px rgba(0,0,0,0.8)' }}>
                                  CASSIEL
                                </div>
                                <div style={{ fontSize: '8.5px', fontWeight: '800', letterSpacing: '1.6px', textTransform: 'uppercase', color: '#E4E4E7', opacity: 0.9 }}>
                                  PLATINUM CERAMIC
                                </div>
                              </div>
                            </div>

                            {/* Verified Pill Badge */}
                            <div
                              style={{
                                background: 'rgba(24, 24, 27, 0.75)',
                                backdropFilter: 'blur(10px)',
                                padding: '4px 10px',
                                borderRadius: '999px',
                                fontSize: '9.5px',
                                fontWeight: '800',
                                letterSpacing: '0.5px',
                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.5)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                color: '#F4F4F5'
                              }}
                            >
                              <span style={{ fontSize: '10px', color: '#34D399' }}>✓</span> {currentActiveProof.status || 'TERVERIFIKASI'}
                            </div>
                          </div>

                          {/* Middle: Metallic Smart EMV Chip */}
                          <div style={{ position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div
                              style={{
                                width: '42px',
                                height: '32px',
                                borderRadius: '7px',
                                background: 'linear-gradient(135deg, #F4F4F5 0%, #D4D4D8 35%, #71717A 70%, #E4E4E7 100%)',
                                boxShadow: 'inset 0 1px 2px rgba(255, 255, 255, 0.9), 0 3px 8px rgba(0, 0, 0, 0.6)',
                                position: 'relative',
                                border: '0.8px solid #71717A',
                                overflow: 'hidden'
                              }}
                            >
                              <div style={{ position: 'absolute', top: '10px', left: 0, right: 0, height: '0.8px', background: '#3F3F46', opacity: 0.65 }} />
                              <div style={{ position: 'absolute', top: '21px', left: 0, right: 0, height: '0.8px', background: '#3F3F46', opacity: 0.65 }} />
                              <div style={{ position: 'absolute', left: '14px', top: 0, bottom: 0, width: '0.8px', background: '#3F3F46', opacity: 0.65 }} />
                              <div style={{ position: 'absolute', right: '14px', top: 0, bottom: 0, width: '0.8px', background: '#3F3F46', opacity: 0.65 }} />
                              <div style={{ position: 'absolute', left: '14px', right: '14px', top: '10px', bottom: '10px', border: '0.8px solid #3F3F46', borderRadius: '2px', opacity: 0.65 }} />
                            </div>

                            {/* Seal Donor Label */}
                            <div
                              style={{
                                fontSize: '11px',
                                fontWeight: '800',
                                letterSpacing: '0.6px',
                                color: '#FFFFFF',
                                background: 'rgba(24, 24, 27, 0.85)',
                                backdropFilter: 'blur(8px)',
                                border: '1px solid rgba(255, 255, 255, 0.18)',
                                padding: '4px 12px',
                                borderRadius: '8px',
                                boxShadow: '0 3px 10px rgba(0, 0, 0, 0.6)'
                              }}
                            >
                              {currentActiveProof.donorLabel || 'DONATUR #000001'}
                            </div>
                          </div>

                          {/* Bottom Row: Member Holder Name & Certificate Number */}
                          <div
                            style={{
                              position: 'relative',
                              zIndex: 2,
                              display: 'flex',
                              alignItems: 'flex-end',
                              justifyContent: 'space-between'
                            }}
                          >
                            <div>
                              <div style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '1px', color: '#A1A1AA', marginBottom: '2px' }}>
                                Cardholder / Impact Donor
                              </div>
                              <div style={{ fontSize: '17px', fontWeight: '800', letterSpacing: '0.8px', textShadow: '0 2px 6px rgba(0, 0, 0, 0.7)', color: '#FFFFFF' }}>
                                {currentActiveProof.userName || currentUserName}
                              </div>
                            </div>

                            <div
                              style={{
                                textAlign: 'right',
                                background: 'rgba(0, 0, 0, 0.65)',
                                backdropFilter: 'blur(8px)',
                                padding: '3px 9px',
                                borderRadius: '7px',
                                border: '0.8px solid rgba(255, 255, 255, 0.15)'
                              }}
                            >
                              <div style={{ fontSize: '8.5px', textTransform: 'uppercase', letterSpacing: '0.8px', color: '#D4D4D8', fontWeight: '700', marginBottom: '1px' }}>
                                Cert. ID
                              </div>
                              <div style={{ fontSize: '11px', fontWeight: '800', letterSpacing: '0.8px', fontFamily: 'monospace', color: '#FFFFFF' }}>
                                {currentActiveProof.certificateNumber}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* ================= CARD BACK ================= */}
                        <div
                          style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            borderRadius: '20px',
                            background: 'radial-gradient(circle at 75% 25%, #242429 0%, #121215 50%, #08080a 100%)',
                            overflow: 'hidden',
                            boxSizing: 'border-box',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            color: '#FFFFFF',
                            border: '1px solid rgba(255, 255, 255, 0.16)',
                            backfaceVisibility: 'hidden',
                            WebkitBackfaceVisibility: 'hidden',
                            transform: 'rotateY(180deg)',
                            padding: '14px 18px',
                            boxShadow: 'inset 0 1px 1px rgba(255, 255, 255, 0.12)'
                          }}
                        >
                          {/* Subtle geometric luxury watermark overlay on card back */}
                          <div
                            style={{
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              right: 0,
                              bottom: 0,
                              pointerEvents: 'none',
                              opacity: 0.035,
                              backgroundImage: 'repeating-linear-gradient(45deg, #FFF 0, #FFF 1px, transparent 0, transparent 16px)'
                            }}
                          />

                          {/* Top: Black Magnetic Stripe */}
                          <div
                            style={{
                              position: 'absolute',
                              top: '14px',
                              left: 0,
                              right: 0,
                              height: '34px',
                              background: 'linear-gradient(180deg, #050507 0%, #1a1a1f 35%, #000000 65%, #0f0f12 100%)',
                              borderTop: '0.8px solid rgba(255, 255, 255, 0.09)',
                              borderBottom: '0.8px solid rgba(255, 255, 255, 0.09)',
                              boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.9)'
                            }}
                          />

                          {/* Space below magnetic stripe */}
                          <div style={{ height: '36px' }} />

                          {/* Middle: Signature Strip & Holographic Authenticity Seal */}
                          <div
                            style={{
                              position: 'relative',
                              zIndex: 2,
                              display: 'flex',
                              alignItems: 'center',
                              gap: '10px'
                            }}
                          >
                            {/* Realistic Frosted Signature & Barcode Panel */}
                            <div
                              style={{
                                flex: 1,
                                height: '28px',
                                background: 'linear-gradient(90deg, #E5E7EB 0%, #F3F4F6 40%, #E5E7EB 100%)',
                                borderRadius: '4px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '0 10px',
                                boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.3)',
                                overflow: 'hidden',
                                position: 'relative'
                              }}
                            >
                              {/* Security pattern lines */}
                              <div
                                style={{
                                  position: 'absolute',
                                  inset: 0,
                                  opacity: 0.15,
                                  backgroundImage: 'repeating-linear-gradient(-45deg, #000 0, #000 1px, transparent 0, transparent 4px)',
                                  pointerEvents: 'none'
                                }}
                              />
                              <span
                                style={{
                                  fontFamily: '"Brush Script MT", "Caveat", cursive, sans-serif',
                                  fontSize: '15px',
                                  color: '#1E293B',
                                  fontWeight: 'bold',
                                  letterSpacing: '1px',
                                  textShadow: '0 0 1px rgba(0,0,0,0.2)'
                                }}
                              >
                                {currentActiveProof.userName || currentUserName}
                              </span>
                            </div>

                            {/* Holographic Seal / Chip */}
                            <div
                              style={{
                                width: '38px',
                                height: '28px',
                                borderRadius: '5px',
                                background: 'linear-gradient(135deg, #FDE68A 0%, #F59E0B 25%, #6EE7B7 50%, #38BDF8 75%, #FDE68A 100%)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
                                border: '0.8px solid rgba(255,255,255,0.4)',
                                opacity: 0.95
                              }}
                            >
                              <span style={{ fontSize: '8px', fontWeight: '900', color: '#09090B', letterSpacing: '0.5px' }}>
                                SECURE
                              </span>
                            </div>
                          </div>

                          {/* Center: Luxury Certificate Data Card */}
                          <div
                            style={{
                              position: 'relative',
                              zIndex: 2,
                              background: 'rgba(255, 255, 255, 0.035)',
                              backdropFilter: 'blur(12px)',
                              borderRadius: '11px',
                              padding: '9px 12px',
                              border: '1px solid rgba(255, 255, 255, 0.08)',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '5px'
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontSize: '9.5px', textTransform: 'uppercase', letterSpacing: '1px', color: '#71717A', fontWeight: '700' }}>
                                Misi Kebaikan
                              </span>
                              <span style={{ fontSize: '11px', fontWeight: '800', color: '#FFFFFF', letterSpacing: '0.2px', textAlign: 'right', maxWidth: '62%', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {currentActiveProof.causeTitle}
                              </span>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontSize: '9.5px', textTransform: 'uppercase', letterSpacing: '1px', color: '#71717A', fontWeight: '700' }}>
                                Penyelenggara
                              </span>
                              <span style={{ fontSize: '10.5px', fontWeight: '700', color: '#38BDF8', letterSpacing: '0.2px' }}>
                                {currentActiveProof.causeOrganizer}
                              </span>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontSize: '9.5px', textTransform: 'uppercase', letterSpacing: '1px', color: '#71717A', fontWeight: '700' }}>
                                Tanggal Verifikasi
                              </span>
                              <span style={{ fontSize: '10.5px', fontWeight: '600', color: '#D4D4D8' }}>
                                {currentActiveProof.dateFormatted}
                              </span>
                            </div>

                            {/* Gold Impact Metric Banner */}
                            <div
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                paddingTop: '5px',
                                marginTop: '2px',
                                borderTop: '1px solid rgba(255, 255, 255, 0.08)'
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                <div
                                  style={{
                                    width: '6px',
                                    height: '6px',
                                    borderRadius: '50%',
                                    background: '#10B981',
                                    boxShadow: '0 0 6px #10B981'
                                  }}
                                />
                                <span style={{ fontSize: '9.5px', textTransform: 'uppercase', letterSpacing: '1.2px', fontWeight: '800', color: '#E4E4E7' }}>
                                  Alokasi Donasi
                                </span>
                              </div>
                              <span
                                style={{
                                  fontSize: '15px',
                                  fontWeight: '900',
                                  letterSpacing: '0.6px',
                                  background: 'linear-gradient(135deg, #FDE68A 0%, #F59E0B 50%, #D97706 100%)',
                                  WebkitBackgroundClip: 'text',
                                  WebkitTextFillColor: 'transparent',
                                  textShadow: '0 2px 10px rgba(245, 158, 11, 0.3)'
                                }}
                              >
                                {formatRupiah(currentActiveProof.amountDonated)}
                              </span>
                            </div>
                          </div>

                          {/* Bottom Action: YouTube Documentary Verification */}
                          <div style={{ position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <a
                              href={currentActiveProof.youtubeUrl || OFFICIAL_YOUTUBE_DOCUMENTATION.youtubeUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              style={{
                                flex: 1,
                                height: '32px',
                                borderRadius: '8px',
                                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.03) 100%)',
                                border: '1px solid rgba(255, 255, 255, 0.16)',
                                color: '#FFFFFF',
                                fontSize: '11px',
                                fontWeight: '800',
                                letterSpacing: '0.3px',
                                textDecoration: 'none',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '7px',
                                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.4)',
                                transition: 'all 0.2s ease'
                              }}
                            >
                              <div
                                style={{
                                  width: '18px',
                                  height: '18px',
                                  borderRadius: '50%',
                                  background: '#EF4444',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center'
                                }}
                              >
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="#FFFFFF">
                                  <path d="M8 5v14l11-7z" />
                                </svg>
                              </div>
                              <span style={{ color: '#F4F4F5' }}>Dokumentasi Resmi Penyaluran</span>
                              <span style={{ fontSize: '10px', color: '#9CA3AF' }}>↗</span>
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Interactive 3D Flip Hint Pill */}
                    <div
                      onClick={() => setIsCardFlipped(prev => !prev)}
                      style={{
                        alignSelf: 'center',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        background: 'rgba(0, 0, 0, 0.05)',
                        padding: '6px 14px',
                        borderRadius: '999px',
                        fontSize: '11px',
                        fontWeight: '700',
                        color: '#6B7280',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        border: '1px solid rgba(0, 0, 0, 0.06)'
                      }}
                    >
                      <span style={{ fontSize: '13px' }}>🔄</span>
                      <span>{isCardFlipped ? 'Sentuh kartu untuk melihat sisi depan' : 'Sentuh kartu untuk melihat rincian di belakang'}</span>
                    </div>
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

import React, { useEffect, useState, useRef } from 'react';
import './GuidedTour.css';

/**
 * GuidedTourModal Component
 * Ultra-Smooth Apple-grade Animated Walkthrough
 * 
 * Precise Target Coordinate Resolver with continuous animation tracking
 */

export const NEW_USER_STEPS = [
  {
    id: 'backup',
    targetSelector: '.tour-target-backup',
    tab: 'home',
    screen: 'profile',
    titleKey: 'tourBackupTitle',
    descKey: 'tourBackupDesc',
    isCircle: false
  },
  {
    id: 'groups',
    targetSelector: '.tour-target-groups',
    tab: 'home',
    screen: 'profile',
    titleKey: 'tourGroupsTitle',
    descKey: 'tourGroupsDesc',
    isCircle: false
  },
  {
    id: 'voice_ai',
    targetSelector: '.tour-target-voice-btn',
    tab: 'home',
    screen: 'main',
    titleKey: 'tourFullVoiceTitle',
    descKey: 'tourFullVoiceDesc',
    isCircle: true
  },
  {
    id: 'voice_recorded_result',
    targetSelector: '.tour-target-first-tx, .transaction-item:first-child, .date-group-items .transaction-item:first-of-type',
    tab: 'home',
    screen: 'main',
    titleKey: 'tourVoiceRecordedTitle',
    descKey: 'tourVoiceRecordedDesc',
    isCircle: false
  },
  {
    id: 'add',
    targetSelector: '.tour-target-add',
    tab: 'home',
    screen: 'main',
    titleKey: 'tourFullAddTitle',
    descKey: 'tourFullAddDesc',
    isCircle: true
  },
  {
    id: 'budget',
    targetSelector: '.tour-target-budget',
    tab: 'budget',
    screen: 'main',
    titleKey: 'tourBudgetTitle',
    descKey: 'tourBudgetDesc',
    isCircle: true
  },
  {
    id: 'stats',
    targetSelector: '.tour-target-stats',
    tab: 'stats',
    screen: 'main',
    titleKey: 'tourFullStatsTitle',
    descKey: 'tourFullStatsDesc',
    isCircle: true
  }
];

export const FULL_GUIDE_STEPS = [
  {
    id: 'backup',
    targetSelector: '.tour-target-backup',
    tab: 'home',
    screen: 'profile',
    titleKey: 'tourBackupTitle',
    descKey: 'tourBackupDesc',
    isCircle: false
  },
  {
    id: 'groups',
    targetSelector: '.tour-target-groups',
    tab: 'home',
    screen: 'profile',
    titleKey: 'tourGroupsTitle',
    descKey: 'tourGroupsDesc',
    isCircle: false
  },
  {
    id: 'voice_ai',
    targetSelector: '.tour-target-voice-btn',
    tab: 'home',
    screen: 'main',
    titleKey: 'tourFullVoiceTitle',
    descKey: 'tourFullVoiceDesc',
    isCircle: true
  },
  {
    id: 'voice_recorded_result',
    targetSelector: '.tour-target-first-tx, .transaction-item:first-child, .date-group-items .transaction-item:first-of-type',
    tab: 'home',
    screen: 'main',
    titleKey: 'tourVoiceRecordedTitle',
    descKey: 'tourVoiceRecordedDesc',
    isCircle: false
  },
  {
    id: 'add',
    targetSelector: '.tour-target-add',
    tab: 'home',
    screen: 'main',
    titleKey: 'tourFullAddTitle',
    descKey: 'tourFullAddDesc',
    isCircle: true
  },
  {
    id: 'budget',
    targetSelector: '.tour-target-budget',
    tab: 'budget',
    screen: 'main',
    titleKey: 'tourBudgetTitle',
    descKey: 'tourBudgetDesc',
    isCircle: true
  },
  {
    id: 'stats',
    targetSelector: '.tour-target-stats',
    tab: 'stats',
    screen: 'main',
    titleKey: 'tourFullStatsTitle',
    descKey: 'tourFullStatsDesc',
    isCircle: true
  }
];

export default function GuidedTourModal({
  isOpen,
  mode = 'new_user_v20',
  onClose,
  onComplete,
  t,
  setActiveTab,
  setIsProfileModalOpen,
  setIsAddModalOpen,
  setActivePanel,
  setTransType
}) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState(null);
  const [cardContentVisible, setCardContentVisible] = useState(true);
  const [tourVoiceError, setTourVoiceError] = useState('');
  const [isTourVoiceSuccess, setIsTourVoiceSuccess] = useState(false);
  const [recordedVoiceTx, setRecordedVoiceTx] = useState(null);
  const cardRef = useRef(null);
  const animFrameRef = useRef(null);

  const steps = mode === 'full_guide' ? FULL_GUIDE_STEPS : NEW_USER_STEPS;
  const currentStep = steps[currentStepIndex];

  // Broadcast current tour step to the whole app (e.g. VoiceMicButton)
  useEffect(() => {
    if (isOpen && currentStep) {
      window.dispatchEvent(new CustomEvent('cassiel_tour_step_changed', {
        detail: { stepId: currentStep.id }
      }));
    } else {
      window.dispatchEvent(new CustomEvent('cassiel_tour_step_changed', {
        detail: { stepId: null }
      }));
    }
    return () => {
      window.dispatchEvent(new CustomEvent('cassiel_tour_step_changed', {
        detail: { stepId: null }
      }));
    };
  }, [isOpen, currentStepIndex, currentStep?.id]);

  // Listen for voice test errors or success when on voice_ai step
  useEffect(() => {
    if (!isOpen || currentStep?.id !== 'voice_ai') {
      setTourVoiceError('');
      setIsTourVoiceSuccess(false);
      return;
    }

    let errorTimer = null;
    let successTimer = null;

    const handleError = (e) => {
      setTourVoiceError(e.detail?.message || 'Teks salah, coba lagi');
      if (errorTimer) clearTimeout(errorTimer);
      errorTimer = setTimeout(() => {
        setTourVoiceError('');
      }, 3500);
    };

    const handleSuccess = () => {
      setTourVoiceError('');
      setIsTourVoiceSuccess(true);
      if (successTimer) clearTimeout(successTimer);
      successTimer = setTimeout(() => {
        setIsTourVoiceSuccess(false);
        setCurrentStepIndex(prev => prev + 1);
      }, 350);
    };

    window.addEventListener('cassiel_tour_voice_error', handleError);
    window.addEventListener('cassiel_tour_voice_success', handleSuccess);

    return () => {
      if (errorTimer) clearTimeout(errorTimer);
      if (successTimer) clearTimeout(successTimer);
      window.removeEventListener('cassiel_tour_voice_error', handleError);
      window.removeEventListener('cassiel_tour_voice_success', handleSuccess);
    };
  }, [isOpen, currentStepIndex, currentStep?.id]);

  const measureTarget = () => {
    if (!currentStep) return;
    const el = document.querySelector(currentStep.targetSelector);
    if (el) {
      const rect = el.getBoundingClientRect();
      // Only update if visible in viewport
      if (rect.width > 0 && rect.height > 0) {
        setTargetRect({
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
          bottom: rect.bottom,
          right: rect.right
        });
      }
    }
  };

  // Sync screen / tab and measure target with continuous animation tracking
  useEffect(() => {
    if (!isOpen || !currentStep) return;

    setCardContentVisible(false);

    if (currentStep.screen === 'profile') {
      if (setIsAddModalOpen) setIsAddModalOpen(false);
      setIsProfileModalOpen(true);
    } else if (currentStep.screen === 'add_modal') {
      setIsProfileModalOpen(false);
      if (setIsAddModalOpen) setIsAddModalOpen(true);
      if (currentStep.transType && setTransType) {
        setTransType(currentStep.transType);
      }
      if (currentStep.panel && setActivePanel) {
        setActivePanel(currentStep.panel);
      }
    } else {
      setIsProfileModalOpen(false);
      if (setIsAddModalOpen) setIsAddModalOpen(false);
      if (currentStep.tab) {
        setActiveTab(currentStep.tab);
      }
    }

    // Scroll parent profile container if needed
    const prepareTimer = setTimeout(() => {
      const el = document.querySelector(currentStep.targetSelector);
      if (el && currentStep.screen === 'profile') {
        const scrollBody = document.querySelector('.wa-profile-scroll-body');
        if (scrollBody) {
          const bodyRect = scrollBody.getBoundingClientRect();
          const elRect = el.getBoundingClientRect();
          const currentScroll = scrollBody.scrollTop;
          const targetScroll = currentScroll + (elRect.top - bodyRect.top) - (bodyRect.height / 2) + (elRect.height / 2);
          
          scrollBody.scrollTo({
            top: Math.max(0, targetScroll),
            behavior: 'smooth'
          });
        }
      } else if (el && (currentStep.id === 'voice_recorded_result' || currentStep.targetSelector?.includes('tour-target-first-tx'))) {
        try {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } catch (_) {}
      }

      // Continuous tracking during slide-in and scroll animation (0ms - 450ms)
      const startTime = performance.now();
      const trackPosition = (now) => {
        measureTarget();
        if (now - startTime < 450) {
          animFrameRef.current = requestAnimationFrame(trackPosition);
        } else {
          measureTarget();
          setCardContentVisible(true);
        }
      };
      animFrameRef.current = requestAnimationFrame(trackPosition);
    }, 60);

    return () => {
      clearTimeout(prepareTimer);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isOpen, currentStepIndex, mode]);

  // Keep measuring on scroll / resize inside profile
  useEffect(() => {
    if (!isOpen || !currentStep) return;
    const scrollBody = document.querySelector('.wa-profile-scroll-body');
    if (scrollBody) {
      scrollBody.addEventListener('scroll', measureTarget);
    }
    window.addEventListener('resize', measureTarget);

    return () => {
      if (scrollBody) {
        scrollBody.removeEventListener('scroll', measureTarget);
      }
      window.removeEventListener('resize', measureTarget);
    };
  }, [isOpen, currentStep]);

  if (!isOpen || !currentStep) return null;

  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === steps.length - 1;

  const handleNext = () => {
    if (isLastStep) {
      handleFinish();
    } else {
      setCurrentStepIndex(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  };

  const handleFinish = () => {
    setIsProfileModalOpen(false);
    if (setIsAddModalOpen) setIsAddModalOpen(false);
    setActiveTab('home');
    setCurrentStepIndex(0);
    if (onComplete) onComplete();
    if (onClose) onClose();
  };

  const handleSkip = () => {
    setIsProfileModalOpen(false);
    if (setIsAddModalOpen) setIsAddModalOpen(false);
    setActiveTab('home');
    setCurrentStepIndex(0);
    if (onComplete) onComplete();
    if (onClose) onClose();
  };

  // SVG Cutout padding and dimensions - pixel-perfect fit per target type
  const isCircle = currentStep.isCircle === true;

  let spotX = 0;
  let spotY = 0;
  let spotW = 0;
  let spotH = 0;
  let spotRadius = 14;

  if (targetRect) {
    if (isCircle) {
      const pad = 4;
      spotX = targetRect.left - pad;
      spotY = targetRect.top - pad;
      spotW = targetRect.width + (pad * 2);
      spotH = targetRect.height + (pad * 2);
      spotRadius = Math.max(spotW, spotH) / 2;
    } else if (currentStep.targetSelector?.includes('tour-target-tab-')) {
      // Type pill tab (Income / Expense)
      const padX = 3;
      const padY = 2;
      spotX = targetRect.left - padX;
      spotY = targetRect.top - padY;
      spotW = targetRect.width + (padX * 2);
      spotH = targetRect.height + (padY * 2);
      spotRadius = 16;
    } else if (currentStep.id === 'form_category' || currentStep.id === 'form_account') {
      // Form panel category/account
      const padX = 2;
      const padY = 2;
      spotX = targetRect.left - padX;
      spotY = targetRect.top - padY;
      spotW = targetRect.width + (padX * 2);
      spotH = targetRect.height + (padY * 2);
      spotRadius = 16;
    } else {
      // Profile menu item (row list) or generic rectangular item
      const trimY = 4;
      const padX = 6;
      spotX = targetRect.left - padX;
      spotY = targetRect.top + trimY;
      spotW = targetRect.width + (padX * 2);
      spotH = Math.max(38, targetRect.height - (trimY * 2));
      spotRadius = 14;
    }
  }

  const spotCenterX = targetRect ? targetRect.left + (targetRect.width / 2) : 0;
  const spotCenterY = targetRect ? targetRect.top + (targetRect.height / 2) : 0;
  // Determine card placement dynamically based on where target is on screen
  let cardTop = 0;
  let isArrowOnBottom = true;
  const cardGap = 16;
  const estimatedCardHeight = 180;

  if (targetRect) {
    // If element is in lower half of screen (or space below is insufficient), place card ABOVE target
    const spaceAbove = targetRect.top;
    const spaceBelow = window.innerHeight - targetRect.bottom;

    if (spaceAbove > estimatedCardHeight + cardGap && (spaceBelow < estimatedCardHeight + cardGap || targetRect.top > window.innerHeight * 0.45)) {
      isArrowOnBottom = true;
      cardTop = Math.max(16, targetRect.top - estimatedCardHeight - cardGap);
    } else {
      isArrowOnBottom = false;
      cardTop = Math.min(window.innerHeight - estimatedCardHeight - 16, targetRect.bottom + cardGap);
    }
  } else {
    cardTop = window.innerHeight - 260;
  }

  // Calculate arrow horizontal position to point directly to target center
  let arrowStyle = {};
  if (targetRect) {
    const targetCenterX = targetRect.left + (targetRect.width / 2);
    const cardEl = cardRef.current;
    const cardWidth = cardEl ? cardEl.offsetWidth : Math.min(330, Math.max(270, window.innerWidth * 0.6));
    const cardLeft = (window.innerWidth - cardWidth) / 2;
    
    const arrowOffsetInCard = targetCenterX - cardLeft;
    const clampedOffset = Math.max(24, Math.min(cardWidth - 24, arrowOffsetInCard));
    arrowStyle = {
      left: `${clampedOffset}px`,
      transform: 'translateX(-50%)'
    };
  }

  return (
    <div className="guided-tour-root">
      {/* SVG Mask Cutout: Pure transparent hole with CSS smooth transitions */}
      <svg className="guided-tour-svg-mask" width="100%" height="100%">
        <defs>
          <mask id="tour-spotlight-mask">
            {/* White background: solid dark backdrop */}
            <rect x="0" y="0" width="100%" height="100%" fill="#FFFFFF" />
            {/* Black cutout hole for target element */}
            {targetRect && (
              isCircle ? (
                <circle
                  className="tour-svg-circle"
                  cx={spotCenterX}
                  cy={spotCenterY}
                  r={spotRadius}
                  fill="#000000"
                />
              ) : (
                <rect
                  className="tour-svg-rect"
                  x={spotX}
                  y={spotY}
                  width={spotW}
                  height={spotH}
                  rx={spotRadius}
                  ry={spotRadius}
                  fill="#000000"
                />
              )
            )}
          </mask>
        </defs>
        {/* Render overlay filled with dark color using mask */}
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="rgba(15, 23, 42, 0.72)"
          mask="url(#tour-spotlight-mask)"
          onClick={handleSkip}
        />
      </svg>

      {/* Spotlight White Glowing Ring around the cutout hole */}
      {targetRect && (
        <div
          className="guided-tour-spotlight-ring"
          style={{
            top: isCircle ? `${spotCenterY - spotRadius}px` : `${spotY}px`,
            left: isCircle ? `${spotCenterX - spotRadius}px` : `${spotX}px`,
            width: isCircle ? `${spotRadius * 2}px` : `${spotW}px`,
            height: isCircle ? `${spotRadius * 2}px` : `${spotH}px`,
            borderRadius: isCircle ? '50%' : `${spotRadius}px`
          }}
        />
      )}

      {/* Luxury White Coach Mark Card */}
      <div
        ref={cardRef}
        className="guided-tour-card"
        style={{
          top: `${cardTop}px`
        }}
      >
        {/* Dynamic Arrow Indicator */}
        <div
          className={`guided-tour-arrow ${isArrowOnBottom ? 'arrow-bottom' : 'arrow-top'}`}
          style={arrowStyle}
        />

        {/* Card Content with subtle fade animation */}
        <div className={`guided-tour-inner-content ${cardContentVisible ? 'visible' : 'fading'}`}>
          {/* Card Header: Step Pill & Close Button */}
          <div className="guided-tour-header">
            <div className="guided-tour-badge">
              <span className="tour-badge-text">
                {currentStepIndex + 1} / {steps.length}
              </span>
            </div>
            <button
              type="button"
              className="guided-tour-close-btn"
              onClick={handleSkip}
              aria-label="Tutup Panduan"
            >
              ✕
            </button>
          </div>

          {/* Card Content */}
          <div className="guided-tour-body">
            <h4 className="guided-tour-title">
              {t(currentStep.titleKey)}
            </h4>
            <p className="guided-tour-desc">
              {t(currentStep.descKey)}
            </p>

            {/* Special Interactive Prompt for Voice AI step */}
            {currentStep.id === 'voice_ai' && (
              <div className="tour-voice-trial-wrapper">
                <div className="tour-voice-trial-box">
                  <span className="tour-voice-trial-prompt">🎙️ Wajib ucapkan contoh ini:</span>
                  <div className="tour-voice-trial-pill">
                    "Ketoprak 11.000 pakai BRI"
                  </div>
                </div>

                {tourVoiceError && (
                  <div className="tour-voice-error-banner">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    <span>{tourVoiceError}</span>
                  </div>
                )}

                {isTourVoiceSuccess && (
                  <div className="tour-voice-success-banner">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                      <polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                    <span>✅ Transaksi berhasil dicatat!</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Card Footer Actions */}
          <div className="guided-tour-footer">
            {isFirstStep ? (
              <button
                type="button"
                className="guided-tour-btn-text"
                onClick={handleSkip}
              >
                {t('tourBtnSkip') || 'Lewati'}
              </button>
            ) : (
              <button
                type="button"
                className="guided-tour-btn-text"
                onClick={handlePrev}
              >
                {t('tourBtnBack') || 'Kembali'}
              </button>
            )}

            {currentStep.id === 'voice_ai' && !isTourVoiceSuccess ? (
              <button
                type="button"
                className="guided-tour-btn-primary tour-mic-action-btn"
                style={{ color: '#FFFFFF !important' }}
                onClick={() => {
                  const micBtn = document.querySelector('.tour-target-voice-btn');
                  if (micBtn) micBtn.click();
                }}
                title="Tekan tombol mic untuk mulai bicara"
              >
                🎙️ Tekan Mic & Bicara
              </button>
            ) : (
              <button
                type="button"
                className="guided-tour-btn-primary"
                style={{ color: '#FFFFFF !important' }}
                onClick={handleNext}
              >
                {isLastStep ? (t('tourBtnFinish') || 'Selesai 🎉') : (t('tourBtnNext') || 'Lanjut →')}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

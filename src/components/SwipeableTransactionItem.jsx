import React, { useState, useRef, useEffect, useMemo } from 'react';

/**
 * SwipeableTransactionItem with Liquid Glass Redi (LGR) Coalescence
 * 
 * Invariants:
 * 1. Bubble & bridge lie UNDERNEATH the transaction card (z-index: 1), emerging from beneath it.
 * 2. Maximum drag offset is strictly clamped to 78px (max 82px) so the bridge NEVER detaches or breaks.
 * 3. 44px circular Liquid Glass Bubble with authentic optical lighting (Crescent arc, PBR apex glint, refractive rim).
 * 4. Trash can icon is 100% mathematically centered in the bubble.
 * 5. Firm open-latch locking: synthetic post-drag clicks are suppressed so the card STAYS OPEN when released.
 */
export default function SwipeableTransactionItem({
  item,
  resolveIcon,
  resolveCardBgClass,
  resolveCardBgColor,
  getCategoryName,
  appLanguage,
  fmtHomeMoney,
  isTxDeleting,
  firstTxClass = '',
  isAutoTrackedTx,
  handleEditTransaction,
  setActiveTxDetail,
  onDeleteTransaction,
  openRowId,
  setOpenRowId,
}) {
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const cardRef = useRef(null);

  const SNAP_OPEN = 78;
  const SNAP_THRESHOLD = 28;

  // Storing live gesture values in Ref to prevent any React closure staleness
  const gestureRef = useRef({
    startX: 0,
    startY: 0,
    initialOffset: 0,
    currentOffset: 0,
    directionLocked: null, // 'horizontal' | 'vertical' | null
    isDown: false,
    startTime: 0,
    dragHappened: false,
    pointerId: null,
  });

  // Keep state and ref in sync when parent or external triggers close
  useEffect(() => {
    if (openRowId !== item.id && dragOffset > 0 && !isDragging) {
      setDragOffset(0);
      gestureRef.current.currentOffset = 0;
    }
  }, [openRowId, item.id, dragOffset, isDragging]);

  // Compute Liquid Glass Bridge emerging precisely from the card's right boundary edge into the bubble
  const bridgeData = useMemo(() => {
    const svgWidth = 140;
    const Yc = 32;

    // Bubble center at X=112, left equator at X=90. Attach to bubble at X=92
    const bubbleAttachX = 92;
    const bubbleAttachTopY = 19;
    const bubbleAttachBotY = 45;

    // Card right boundary edge in SVG coordinates (140 - dragOffset)
    const cardX = svgWidth - dragOffset;

    // Only render bridge once card right edge separates from the bubble attachment
    if (cardX >= bubbleAttachX - 1) return null;

    const saddleSpan = bubbleAttachX - cardX;
    if (saddleSpan < 3) return null;

    const cpDist = Math.max(3, saddleSpan * 0.44);

    // Organic waist thickness: ~22px waist matching the LGR reference
    const waistHalf = Math.max(9, 13.5 - (saddleSpan / 34) * 2.5);
    const cardHalf = Math.min(17.5, Math.max(14.5, 14.5 + (saddleSpan / 34) * 2.5));

    // Path starts EXACTLY at the card's right boundary edge (cardX) and NEVER penetrates into the card!
    const pathD = [
      `M ${cardX.toFixed(1)} ${(Yc - cardHalf).toFixed(1)}`,
      `C ${(cardX + cpDist).toFixed(1)} ${(Yc - waistHalf).toFixed(1)}, ${(bubbleAttachX - cpDist).toFixed(1)} ${(Yc - waistHalf).toFixed(1)}, ${bubbleAttachX} ${bubbleAttachTopY}`,
      `L ${bubbleAttachX} ${bubbleAttachBotY}`,
      `C ${(bubbleAttachX - cpDist).toFixed(1)} ${(Yc + waistHalf).toFixed(1)}, ${(cardX + cpDist).toFixed(1)} ${(Yc + waistHalf).toFixed(1)}, ${cardX.toFixed(1)} ${(Yc + cardHalf).toFixed(1)}`,
      `Z`
    ].join(' ');

    // Specular glint along the upper meniscus curve (Liquid Glass Redi physics)
    const sheenD = [
      `M ${cardX.toFixed(1)} ${(Yc - cardHalf + 1).toFixed(1)}`,
      `C ${(cardX + cpDist).toFixed(1)} ${(Yc - waistHalf + 1).toFixed(1)}, ${(bubbleAttachX - cpDist).toFixed(1)} ${(Yc - waistHalf + 1).toFixed(1)}, ${bubbleAttachX - 1} ${bubbleAttachTopY + 1}`
    ].join(' ');

    // Specular glint along the lower meniscus curve
    const botSheenD = [
      `M ${cardX.toFixed(1)} ${(Yc + cardHalf - 1).toFixed(1)}`,
      `C ${(cardX + cpDist).toFixed(1)} ${(Yc + waistHalf - 1).toFixed(1)}, ${(bubbleAttachX - cpDist).toFixed(1)} ${(Yc + waistHalf - 1).toFixed(1)}, ${bubbleAttachX - 1} ${bubbleAttachBotY - 1}`
    ].join(' ');

    return { pathD, sheenD, botSheenD, cardX };
  }, [dragOffset]);

  // Pointer drag event handlers with pointer capture
  const handlePointerDown = (e) => {
    if (isTxDeleting) return;

    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch (_) {}

    gestureRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialOffset: dragOffset,
      currentOffset: dragOffset,
      directionLocked: null,
      isDown: true,
      startTime: Date.now(),
      dragHappened: false,
      pointerId: e.pointerId,
    };
    setIsDragging(true);
  };

  const handlePointerMove = (e) => {
    if (!gestureRef.current.isDown || isTxDeleting) return;

    const deltaX = e.clientX - gestureRef.current.startX;
    const deltaY = e.clientY - gestureRef.current.startY;

    // Detect gesture direction
    if (!gestureRef.current.directionLocked) {
      if (Math.abs(deltaY) > 6 && Math.abs(deltaY) > Math.abs(deltaX)) {
        gestureRef.current.directionLocked = 'vertical';
        setIsDragging(false);
        try {
          e.currentTarget.releasePointerCapture(e.pointerId);
        } catch (_) {}
        return;
      }
      if (Math.abs(deltaX) > 6 && Math.abs(deltaX) > Math.abs(deltaY)) {
        gestureRef.current.directionLocked = 'horizontal';
        gestureRef.current.dragHappened = true;
        // Auto-close any other open card
        if (setOpenRowId && openRowId && openRowId !== item.id) {
          setOpenRowId(null);
        }
      }
    }

    if (gestureRef.current.directionLocked === 'horizontal') {
      let rawTarget = gestureRef.current.initialOffset - deltaX;

      // Strict clamping with elastic resistance (NEVER exceeds 82px)
      let clamped = 0;
      if (rawTarget < 0) {
        clamped = rawTarget * 0.12;
      } else if (rawTarget > SNAP_OPEN) {
        clamped = SNAP_OPEN + Math.min(4, (rawTarget - SNAP_OPEN) * 0.15);
      } else {
        clamped = rawTarget;
      }

      clamped = Math.max(0, Math.min(82, clamped));
      gestureRef.current.currentOffset = clamped;
      setDragOffset(clamped);
    }
  };

  const handlePointerUp = (e) => {
    if (!gestureRef.current.isDown) return;
    gestureRef.current.isDown = false;
    setIsDragging(false);

    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch (_) {}

    if (gestureRef.current.directionLocked === 'horizontal') {
      const current = gestureRef.current.currentOffset;
      const initial = gestureRef.current.initialOffset;
      const elapsed = Date.now() - gestureRef.current.startTime;
      const deltaDrag = current - initial;

      let shouldOpen = false;
      if (initial === 0) {
        // From closed: drag past SNAP_THRESHOLD or quick flick
        shouldOpen = current >= SNAP_THRESHOLD || (deltaDrag > 14 && elapsed < 320);
      } else {
        // Already open: stay open unless dragged right past 22px
        shouldOpen = deltaDrag > -22;
      }

      if (shouldOpen) {
        // FIRMLY LOCK OPEN AT SNAP_OPEN
        setDragOffset(SNAP_OPEN);
        gestureRef.current.currentOffset = SNAP_OPEN;
        if (setOpenRowId) setOpenRowId(item.id);
      } else {
        // SNAP SHUT
        setDragOffset(0);
        gestureRef.current.currentOffset = 0;
        if (setOpenRowId && openRowId === item.id) setOpenRowId(null);
      }

      // Keep dragHappened true for 250ms so synthetic click event does NOT trigger snap-shut!
      setTimeout(() => {
        gestureRef.current.dragHappened = false;
      }, 250);
    }
  };

  const handleCardClick = (e) => {
    // If a drag gesture just finished, IGNORE the synthetic click completely!
    if (gestureRef.current.dragHappened) {
      e.stopPropagation();
      return;
    }

    // If card was already resting open, tapping the card body closes it
    if (dragOffset > 10) {
      e.stopPropagation();
      setDragOffset(0);
      gestureRef.current.currentOffset = 0;
      if (setOpenRowId && openRowId === item.id) setOpenRowId(null);
      return;
    }

    // Normal click opens Transaction Detail modal
    if (setActiveTxDetail) {
      setActiveTxDetail(item);
    }
  };

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    if (onDeleteTransaction) {
      onDeleteTransaction(item);
    }
  };

  const cardColor = resolveCardBgColor ? resolveCardBgColor(item) : '#FAE2CB';

  // Smooth bubble appearance
  const bubbleScale = dragOffset < 8 ? 0 : Math.min(1, Math.max(0.65, dragOffset / SNAP_OPEN));
  const bubbleOpacity = dragOffset < 8 ? 0 : Math.min(1, (dragOffset - 6) / 24);

  return (
    <div 
      className={`tx-swipe-row-container ${isTxDeleting ? 'deleting-sink' : ''}`}
    >
      {/* Layer 0 (Underneath Card): Liquid Glass Action Pod & Thick Capillary Bridge */}
      <div 
        className="tx-swipe-action-backdrop"
        style={{
          opacity: dragOffset > 6 ? 1 : 0,
          pointerEvents: dragOffset >= 24 ? 'auto' : 'none',
          transition: isDragging ? 'none' : 'opacity 0.22s ease',
        }}
      >
        {/* SVG Liquid Bridge (Emerging precisely from the card's right boundary edge) */}
        {bridgeData && (
          <svg 
            className="tx-liquid-bridge-svg"
            width="140"
            height="64"
            viewBox="0 0 140 64"
            preserveAspectRatio="none"
          >
            <defs>
              {/* Strict edge boundary clip: guarantees 0 pixels can ever bleed inside underneath the card */}
              <clipPath id={`lgrBridgeClip-${item.id}`}>
                <rect 
                  x={bridgeData.cardX.toFixed(1)} 
                  y="0" 
                  width={(140 - bridgeData.cardX).toFixed(1)} 
                  height="64" 
                />
              </clipPath>
              <linearGradient id={`lgrBridgeGrad-${item.id}`} x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor={cardColor} stopOpacity="0.88" />
                <stop offset="50%" stopColor="rgba(255, 255, 255, 0.78)" stopOpacity="0.80" />
                <stop offset="100%" stopColor="rgba(244, 244, 246, 0.85)" stopOpacity="0.85" />
              </linearGradient>
              <linearGradient id={`lgrBridgeSheen-${item.id}`} x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.90" />
                <stop offset="50%" stopColor="#FFFFFF" stopOpacity="0.95" />
                <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.35" />
              </linearGradient>
              <linearGradient id={`lgrBridgeBotSheen-${item.id}`} x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.55" />
                <stop offset="50%" stopColor="#FFFFFF" stopOpacity="0.75" />
                <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.25" />
              </linearGradient>
            </defs>

            <g clipPath={`url(#lgrBridgeClip-${item.id})`}>
              {/* Seamless Saddle Body */}
              <path
                d={bridgeData.pathD}
                fill={`url(#lgrBridgeGrad-${item.id})`}
                className="tx-liquid-bridge-body"
              />

              {/* Upper Specular Meniscus Glint */}
              {bridgeData.sheenD && (
                <path
                  d={bridgeData.sheenD}
                  fill="none"
                  stroke={`url(#lgrBridgeSheen-${item.id})`}
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  className="tx-liquid-bridge-sheen"
                />
              )}

              {/* Lower Specular Meniscus Glint */}
              {bridgeData.botSheenD && (
                <path
                  d={bridgeData.botSheenD}
                  fill="none"
                  stroke={`url(#lgrBridgeBotSheen-${item.id})`}
                  strokeWidth="1.2"
                  strokeLinecap="round"
                  className="tx-liquid-bridge-sheen"
                  style={{ opacity: 0.75 }}
                />
              )}
            </g>
          </svg>
        )}

        {/* 44px Circular Liquid Glass Bubble Pod with 100% Centered Trash Can */}
        <button
          type="button"
          className="tx-liquid-bubble-pod"
          onClick={handleDeleteClick}
          aria-label={`Hapus ${item.title || 'Transaksi'}`}
          title="Hapus Transaksi"
          style={{
            transform: `translateY(-50%) scale(${bubbleScale})`,
            opacity: bubbleOpacity,
            transition: isDragging 
              ? 'none' 
              : 'transform 0.32s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.22s ease',
          }}
          tabIndex={dragOffset >= 24 ? 0 : -1}
        >
          {/* 1. Curved Crescent Specular Arc (Puncak Sabit Kaca Putih Terang Apple) */}
          <div className="tx-bubble-crescent-arc" />

          {/* 2. PBR Apex Specular Radial Sheen (Kilau Kubah Kaca Kristal) */}
          <div className="tx-bubble-apex-glare" />

          {/* 3. Pure 3D Sculpted Apple Liquid Glass Trash Can (Authentic Trash Can Silhouette & Proportions) */}
          <svg
            className="tx-delete-trash-icon tx-liquid-glass-trash"
            width="25"
            height="25"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <defs>
              {/* Volumetric Glass Canister Body Gradient */}
              <linearGradient id={`lgrTrashBody-${item.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.88" />
                <stop offset="35%" stopColor="#E2E8F0" stopOpacity="0.32" />
                <stop offset="70%" stopColor="#CBD5E1" stopOpacity="0.22" />
                <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.70" />
              </linearGradient>

              {/* Glass Specular Edge Bevel Stroke Gradient */}
              <linearGradient id={`lgrTrashEdge-${item.id}`} x1="0%" y1="0%" x2="100%" y2="80%">
                <stop offset="0%" stopColor="#FFFFFF" stopOpacity="1" />
                <stop offset="40%" stopColor="#FFFFFF" stopOpacity="0.85" />
                <stop offset="70%" stopColor="#94A3B8" stopOpacity="0.60" />
                <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.95" />
              </linearGradient>

              {/* Glass Lid Gradient */}
              <linearGradient id={`lgrTrashLid-${item.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.95" />
                <stop offset="50%" stopColor="#F1F5F9" stopOpacity="0.70" />
                <stop offset="100%" stopColor="#CBD5E1" stopOpacity="0.55" />
              </linearGradient>

              {/* Glass Handle Gradient (Low & Wide classic trash can handle) */}
              <linearGradient id={`lgrTrashHandle-${item.id}`} x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#94A3B8" stopOpacity="0.70" />
                <stop offset="50%" stopColor="#FFFFFF" stopOpacity="1" />
                <stop offset="100%" stopColor="#94A3B8" stopOpacity="0.70" />
              </linearGradient>

              {/* Optical Fluted Glass Rib Specular */}
              <linearGradient id={`lgrTrashRib-${item.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.95" />
                <stop offset="50%" stopColor="#FFFFFF" stopOpacity="0.75" />
                <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.45" />
              </linearGradient>
            </defs>

            {/* Glass Canister Body (Authentic Tapered Trash Bin Container) */}
            <path
              className="tx-glass-trash-body"
              d="M 5 7.8 L 6.4 19.4 C 6.6 20.9 7.8 22 9.3 22 H 14.7 C 16.2 22 17.4 20.9 17.6 19.4 L 19 7.8 Z"
              fill={`url(#lgrTrashBody-${item.id})`}
              stroke={`url(#lgrTrashEdge-${item.id})`}
              strokeWidth="1.4"
              strokeLinejoin="round"
            />

            {/* Left Wall Specular Glint */}
            <path
              className="tx-glass-trash-sheen-arc"
              d="M 6.6 9 L 7.6 18.5"
              stroke="#FFFFFF"
              strokeWidth="0.85"
              strokeLinecap="round"
              strokeOpacity="0.80"
            />

            {/* 2 Iconic Vertical Fluted Ribs (Garis Ikonik Tong Sampah) */}
            <g className="tx-glass-trash-ribs">
              {/* Left Rib */}
              <line x1="10.2" y1="10.5" x2="10.2" y2="18" stroke="#64748B" strokeWidth="0.8" strokeOpacity="0.35" strokeLinecap="round" />
              <line x1="9.8" y1="10.5" x2="9.8" y2="18" stroke={`url(#lgrTrashRib-${item.id})`} strokeWidth="1.1" strokeLinecap="round" />

              {/* Right Rib */}
              <line x1="14.2" y1="10.5" x2="14.2" y2="18" stroke="#64748B" strokeWidth="0.8" strokeOpacity="0.35" strokeLinecap="round" />
              <line x1="13.8" y1="10.5" x2="13.8" y2="18" stroke={`url(#lgrTrashRib-${item.id})`} strokeWidth="1.1" strokeLinecap="round" />
            </g>

            {/* Glass Lid & Handle Assembly (Authentic Trash Can Top) */}
            <g className="tx-glass-trash-lid-group">
              {/* Wide Low Handle (Gagang Pipih & Lebar Ikonik Tong Sampah) */}
              <path
                d="M 9 5.8 V 3.5 C 9 2.7 9.7 2 10.5 2 H 13.5 C 14.3 2 15 2.7 15 3.5 V 5.8"
                fill="none"
                stroke={`url(#lgrTrashHandle-${item.id})`}
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Handle Apex Specular Spot */}
              <line x1="11.2" y1="2" x2="12.8" y2="2" stroke="#FFFFFF" strokeWidth="1.1" strokeLinecap="round" />

              {/* Wide Horizontal Lid Shelf (Tutup Melebar Khas Tong Sampah) */}
              <rect
                x="2.5"
                y="5.2"
                width="19"
                height="2.6"
                rx="1.3"
                fill={`url(#lgrTrashLid-${item.id})`}
                stroke="#FFFFFF"
                strokeWidth="0.9"
              />
              {/* Lid Upper Specular Crest Line */}
              <line x1="4.5" y1="5.8" x2="19.5" y2="5.8" stroke="#FFFFFF" strokeWidth="0.8" strokeLinecap="round" strokeOpacity="0.95" />
            </g>
          </svg>
        </button>
      </div>

      {/* Layer 1 (On Top, z-index: 2): Foreground Transaction Card */}
      <div 
        ref={cardRef}
        className={`transaction-item ${resolveCardBgClass(item)} ${firstTxClass}`} 
        onClick={handleCardClick}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        style={{
          transform: `translate3d(-${dragOffset}px, 0, 0)`,
          transition: isDragging 
            ? 'none' 
            : 'transform 0.36s cubic-bezier(0.22, 1, 0.36, 1)',
          touchAction: 'pan-y', // Smooth native vertical page scrolling
        }}
        role="button"
        tabIndex={0}
      >
        <div className={`transaction-icon ${item.iconClass}`}>
          {resolveIcon(item) && <img src={resolveIcon(item)} alt={item.category} />}
        </div>
        <div className="transaction-details">
          <span className="transaction-title">{item.title}</span>
          <span className="transaction-category">
            {getCategoryName(item.category, appLanguage)} • {item.account || 'BRImo'}
          </span>
        </div>
        <div className="transaction-actions-right">
          {isAutoTrackedTx && isAutoTrackedTx(item) && (
            <button 
              type="button" 
              className="tx-edit-capsule-btn"
              onClick={(e) => {
                e.stopPropagation();
                if (handleEditTransaction) handleEditTransaction(item);
              }}
              title="Edit Transaksi Otomatis"
              aria-label="Edit Transaksi Otomatis"
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
              <span>Edit</span>
            </button>
          )}
          <div className={`transaction-amount ${item.type === 'expense' ? 'negative' : 'positive'}`}>
            {item.type === 'expense' ? '-' : '+'}{fmtHomeMoney(item.amount)}
          </div>
        </div>
      </div>
    </div>
  );
}

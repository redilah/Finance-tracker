/**
 * Apple iOS Sheet Physics & Gesture Controller
 * Mengikuti pedoman WWDC Designing Fluid Interfaces:
 * - 1:1 direct finger tracking with grab offset preservation
 * - Exponential rubber-banding at boundaries
 * - Velocity projection & momentum handoff
 * - Interruptible spring dismiss / snap-back
 */

export function attachIOSSheetGesture(sheetEl, options = {}) {
  if (!sheetEl) return () => {};

  const {
    stageEl,
    backdropEl,
    onDismiss = () => {},
    triggerHaptic = () => {},
    dismissThreshold = 120,
    velocityThreshold = 450,
  } = options;

  let startY = 0;
  let currentY = 0;
  let isDragging = false;
  let lastY = 0;
  let lastTime = 0;
  let velocityY = 0;
  let animationFrameId = null;

  // Rubber banding: soft boundary resistance
  const rubberBand = (distance, dimension = 300, constant = 0.55) => {
    return (distance * dimension * constant) / (dimension + constant * distance);
  };

  const handlePointerDown = (e) => {
    // Hanya tangani sentuhan di area grabber, header, atau saat sheet di paling atas (scrollTop <= 0)
    const isGrabber = e.target.closest('.ios-sheet-grabber-zone');
    const isHeader = e.target.closest('.full-page-header');
    const isScrollTop = sheetEl.scrollTop <= 0;

    if (!isGrabber && !isHeader && !isScrollTop) return;

    // Jangan tangkap jika user menekan tombol aksi / input
    if (e.target.closest('button, input, select, textarea, .type-tab')) return;

    isDragging = true;
    startY = e.clientY;
    currentY = 0;
    lastY = e.clientY;
    lastTime = performance.now();
    velocityY = 0;

    sheetEl.style.transition = 'none';
    if (backdropEl) backdropEl.style.transition = 'none';
    if (stageEl) stageEl.style.transition = 'none';

    try {
      sheetEl.setPointerCapture(e.pointerId);
    } catch {
      // fallback jika pointer capture tidak didukung
    }
  };

  const handlePointerMove = (e) => {
    if (!isDragging) return;

    const deltaY = e.clientY - startY;
    const now = performance.now();
    const dt = now - lastTime;

    if (dt > 0) {
      velocityY = (e.clientY - lastY) / (dt / 1000); // px per second
      lastY = e.clientY;
      lastTime = now;
    }

    if (deltaY < 0) {
      // Menarik ke atas: berikan rubber band resistance
      currentY = -rubberBand(-deltaY, 200, 0.35);
    } else {
      // Menarik ke bawah
      currentY = deltaY;
    }

    // Terapkan transform langsung 1:1
    sheetEl.style.transform = `translate3d(0, ${currentY.toFixed(1)}px, 0)`;

    // Redupkan backdrop sebanding dengan tarikan
    if (backdropEl && currentY > 0) {
      const progress = Math.max(0, Math.min(1, 1 - currentY / 400));
      backdropEl.style.opacity = progress.toFixed(3);
    }

    // Skala panggung belakang (Apple stage recess effect)
    if (stageEl && currentY > 0) {
      const stageScale = Math.min(1, 0.93 + (currentY / 400) * 0.07);
      stageEl.style.transform = `scale(${stageScale.toFixed(4)})`;
    }
  };

  const handlePointerUp = (e) => {
    if (!isDragging) return;
    isDragging = false;

    try {
      sheetEl.releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }

    const shouldDismiss = currentY > dismissThreshold || velocityY > velocityThreshold;

    if (shouldDismiss) {
      // Tutup dengan momentum geser ke bawah
      sheetEl.style.transition = 'transform 0.28s cubic-bezier(0.32, 0.72, 0, 1)';
      sheetEl.style.transform = 'translate3d(0, 100%, 0)';

      if (backdropEl) {
        backdropEl.style.transition = 'opacity 0.24s ease';
        backdropEl.style.opacity = '0';
      }
      if (stageEl) {
        stageEl.style.transition = 'transform 0.28s cubic-bezier(0.32, 0.72, 0, 1)';
        stageEl.style.transform = 'scale(1)';
      }

      if (typeof triggerHaptic === 'function') {
        triggerHaptic('light');
      }

      setTimeout(() => {
        onDismiss();
      }, 260);
    } else {
      // Pantulkan kembali ke atas (Snap Back Apple Spring)
      sheetEl.style.transition = 'transform 0.36s cubic-bezier(0.175, 0.885, 0.32, 1.175)';
      sheetEl.style.transform = 'translate3d(0, 0, 0)';

      if (backdropEl) {
        backdropEl.style.transition = 'opacity 0.3s ease';
        backdropEl.style.opacity = '1';
      }
      if (stageEl) {
        stageEl.style.transition = 'transform 0.36s cubic-bezier(0.175, 0.885, 0.32, 1.175)';
        stageEl.style.transform = 'scale(0.93)';
      }

      if (currentY > 40 && typeof triggerHaptic === 'function') {
        triggerHaptic('tick');
      }
    }
  };

  sheetEl.addEventListener('pointerdown', handlePointerDown);
  sheetEl.addEventListener('pointermove', handlePointerMove);
  sheetEl.addEventListener('pointerup', handlePointerUp);
  sheetEl.addEventListener('pointercancel', handlePointerUp);

  return () => {
    sheetEl.removeEventListener('pointerdown', handlePointerDown);
    sheetEl.removeEventListener('pointermove', handlePointerMove);
    sheetEl.removeEventListener('pointerup', handlePointerUp);
    sheetEl.removeEventListener('pointercancel', handlePointerUp);
    if (animationFrameId) cancelAnimationFrame(animationFrameId);
  };
}

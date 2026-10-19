import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { isDevOrLocalhost, triggerJellyShake } from '../utils/jellyPhysics';

export default function JellyShakeTestButton() {
  const [mounted, setMounted] = useState(false);
  const [isPressing, setIsPressing] = useState(false);
  const holdIntervalRef = useRef(null);

  useEffect(() => {
    setMounted(true);
    return () => {
      if (holdIntervalRef.current) clearInterval(holdIntervalRef.current);
    };
  }, []);

  if (!mounted || !isDevOrLocalhost()) {
    return null;
  }

  const handlePointerDown = (e) => {
    e.preventDefault();
    setIsPressing(true);
    // Smooth immediate hand-shake impulse
    triggerJellyShake(1.15);

    // Continuous responsive jiggle if held down
    if (holdIntervalRef.current) clearInterval(holdIntervalRef.current);
    holdIntervalRef.current = setInterval(() => {
      triggerJellyShake(0.75);
    }, 135);
  };

  const handlePointerUp = () => {
    if (holdIntervalRef.current) {
      clearInterval(holdIntervalRef.current);
      holdIntervalRef.current = null;
    }
    if (isPressing) {
      setIsPressing(false);
      // Gentle settling release rebound
      triggerJellyShake(1.2);
    }
  };

  return createPortal(
    <div className="jelly-test-floating-wrapper" title="Uji Goyang HP (Jelly Shake) — Klik untuk membal kenyal">
      <button
        type="button"
        className={`jelly-test-triangle-btn ${isPressing ? 'pressed' : ''}`}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        aria-label="Uji Goyang HP"
      >
        {/* Sleek Rounded Geometric Triangle Icon */}
        <svg
          viewBox="0 0 24 24"
          width="24"
          height="24"
          fill="currentColor"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
          strokeLinecap="round"
          className="jelly-triangle-svg"
        >
          <polygon points="12,3 21.5,19.5 2.5,19.5" />
        </svg>
      </button>
      <span className="jelly-test-label">Goyang HP</span>
    </div>,
    document.body
  );
}

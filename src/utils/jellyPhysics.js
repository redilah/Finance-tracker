/**
 * Viscoelastic Jelly Continuum Physics Engine
 * Multi-layer damped harmonic lattice with Navier-Stokes Poisson volume conservation,
 * subtle responsive micro-motion, and active DeviceMotion / Desktop chassis shake reflection.
 */

export function isDevOrLocalhost() {
  if (typeof window === 'undefined') return false;
  const host = window.location.hostname;
  return (
    host === 'localhost' ||
    host === '127.0.0.1' ||
    host === '0.0.0.0' ||
    host.startsWith('192.168.') ||
    host.endsWith('.local') ||
    Boolean(import.meta.env?.DEV)
  );
}

// Subscribed listeners for coupled UI components (e.g. Nav Liquid Glass Bubble in App.jsx)
const shakeListeners = new Set();

export function registerJellyShakeListener(callback) {
  if (typeof callback === 'function') {
    shakeListeners.add(callback);
    return () => shakeListeners.delete(callback);
  }
  return () => {};
}

// Viscoelastic lattice parameters:
// - Subtle micro-displacement (maxDispX / maxDispY clamped tight: 2.8px - 5.0px)
// - Underdamped silky ratios (zeta: 0.50 - 0.58) for smooth, elastic jelly rebound
// - High natural frequencies (omega: 16.5 - 20.0 rad/s) for responsive instant settling (~350ms)
const LAYER_CONFIGS = {
  top:  { omega: 20.0, zeta: 0.58, mass: 1.00, delayMs: 0,   maxDispX: 2.8, maxDispY: 2.2 },
  hero: { omega: 16.5, zeta: 0.52, mass: 1.35, delayMs: 18,  maxDispX: 4.5, maxDispY: 3.5 },
  mid:  { omega: 17.5, zeta: 0.55, mass: 1.10, delayMs: 35,  maxDispX: 3.5, maxDispY: 2.6 },
  body: { omega: 16.0, zeta: 0.56, mass: 1.25, delayMs: 50,  maxDispX: 3.2, maxDispY: 2.5 },
  dock: { omega: 18.0, zeta: 0.50, mass: 0.95, delayMs: 60,  maxDispX: 5.0, maxDispY: 3.8 }
};

const layerStates = {
  top:  { x: 0, vx: 0, y: 0, vy: 0 },
  hero: { x: 0, vx: 0, y: 0, vy: 0 },
  mid:  { x: 0, vx: 0, y: 0, vy: 0 },
  body: { x: 0, vx: 0, y: 0, vy: 0 },
  dock: { x: 0, vx: 0, y: 0, vy: 0 }
};

// Desktop chassis shake (reflecting physical phone held in hand on localhost)
const chassisState = {
  x: 0,
  vx: 0,
  rot: 0,
  vRot: 0,
  omega: 22.0,
  zeta: 0.48,
  maxDispX: 7.5,
  maxRot: 1.4
};

let animFrameId = null;
let lastTime = null;
let isAnimating = false;
let pendingTimeouts = [];

function applyTransforms() {
  const root = document.documentElement;
  if (!root) return;

  const rootStyle = root.style;

  // 1. Layer Deformations: subtle responsive micro-motion + Poisson volume conservation (melar kenyal)
  Object.keys(LAYER_CONFIGS).forEach((key) => {
    const s = layerStates[key];
    const cfg = LAYER_CONFIGS[key];

    // Tight micro-displacement clamp
    const cx = Math.max(-cfg.maxDispX, Math.min(cfg.maxDispX, s.x));
    const cy = Math.max(-cfg.maxDispY, Math.min(cfg.maxDispY, s.y));

    // Elastic strain tensors (Poisson squish & stretch: melar horizontal, memipih vertikal)
    const strainX = Math.tanh(cx / 26) * 0.042;
    const strainY = Math.tanh(cy / 22) * 0.036;

    // Volume-conserving scales (nu = 0.48)
    const scaleX = Math.max(0.96, Math.min(1.052, 1.0 + Math.abs(strainX) - 0.48 * strainY));
    const scaleY = Math.max(0.96, Math.min(1.045, 1.0 + strainY - 0.48 * Math.abs(strainX)));

    // Hydrodynamic shear & gentle floating tilt
    const skewDeg = -Math.tanh(s.vx / 280) * 1.35;
    const rotDeg = Math.tanh(cx / 30) * 0.75;

    rootStyle.setProperty(`--jelly-${key}-x`, `${cx.toFixed(2)}px`);
    rootStyle.setProperty(`--jelly-${key}-y`, `${cy.toFixed(2)}px`);
    rootStyle.setProperty(`--jelly-${key}-sx`, scaleX.toFixed(4));
    rootStyle.setProperty(`--jelly-${key}-sy`, scaleY.toFixed(4));
    rootStyle.setProperty(`--jelly-${key}-rot`, `${rotDeg.toFixed(2)}deg`);
    rootStyle.setProperty(`--jelly-${key}-skew`, `${skewDeg.toFixed(2)}deg`);

    // Special dock lift for menu bar container
    if (key === 'dock') {
      const dockLift = -cy * 0.65;
      rootStyle.setProperty('--jelly-dock-lift', `${dockLift.toFixed(2)}px`);
    }
  });

  // 2. Chassis Shake (for desktop preview reflection of phone being shaken by hand)
  const chassisX = Math.max(-chassisState.maxDispX, Math.min(chassisState.maxDispX, chassisState.x));
  const chassisRot = Math.max(-chassisState.maxRot, Math.min(chassisState.maxRot, chassisState.rot));

  rootStyle.setProperty('--phone-shake-x', `${chassisX.toFixed(2)}px`);
  rootStyle.setProperty('--phone-shake-rot', `${chassisRot.toFixed(2)}deg`);
}

function resetTransforms() {
  const root = document.documentElement;
  if (!root) return;
  const rootStyle = root.style;

  Object.keys(LAYER_CONFIGS).forEach((key) => {
    layerStates[key].x = 0;
    layerStates[key].vx = 0;
    layerStates[key].y = 0;
    layerStates[key].vy = 0;

    rootStyle.setProperty(`--jelly-${key}-x`, '0px');
    rootStyle.setProperty(`--jelly-${key}-y`, '0px');
    rootStyle.setProperty(`--jelly-${key}-sx`, '1');
    rootStyle.setProperty(`--jelly-${key}-sy`, '1');
    rootStyle.setProperty(`--jelly-${key}-rot`, '0deg');
    rootStyle.setProperty(`--jelly-${key}-skew`, '0deg');
    if (key === 'dock') {
      rootStyle.setProperty('--jelly-dock-lift', '0px');
    }
  });

  chassisState.x = 0;
  chassisState.vx = 0;
  chassisState.rot = 0;
  chassisState.vRot = 0;
  rootStyle.setProperty('--phone-shake-x', '0px');
  rootStyle.setProperty('--phone-shake-rot', '0deg');

  if (typeof document !== 'undefined' && document.body) {
    document.body.classList.remove('jelly-animating');
  }
}

function physicsStep(now) {
  const rawDt = Math.min((now - (lastTime || now)) / 1000, 0.030) || 0.016;
  lastTime = now;

  // Sub-stepped Symplectic Verlet integration (2 sub-steps)
  const subSteps = 2;
  const dt = rawDt / subSteps;

  let totalEnergy = 0;

  for (let step = 0; step < subSteps; step++) {
    // 1. Update layers
    Object.keys(LAYER_CONFIGS).forEach((key) => {
      const cfg = LAYER_CONFIGS[key];
      const s = layerStates[key];

      const k = cfg.omega * cfg.omega;
      const c = 2 * cfg.zeta * cfg.omega;

      const fx = -k * s.x - c * s.vx;
      const fy = -k * s.y - c * s.vy;

      s.vx += fx * dt;
      s.x += s.vx * dt;

      s.vy += fy * dt;
      s.y += s.vy * dt;

      if (step === subSteps - 1) {
        totalEnergy += (s.x * s.x + s.y * s.y) + 0.002 * (s.vx * s.vx + s.vy * s.vy);
      }
    });

    // 2. Update chassis phone shake
    const kChassis = chassisState.omega * chassisState.omega;
    const cChassis = 2 * chassisState.zeta * chassisState.omega;

    const fChassisX = -kChassis * chassisState.x - cChassis * chassisState.vx;
    chassisState.vx += fChassisX * dt;
    chassisState.x += chassisState.vx * dt;

    const fChassisRot = -kChassis * chassisState.rot - cChassis * chassisState.vRot;
    chassisState.vRot += fChassisRot * dt;
    chassisState.rot += chassisState.vRot * dt;

    if (step === subSteps - 1) {
      totalEnergy += (chassisState.x * chassisState.x) + 0.002 * (chassisState.vx * chassisState.vx);
    }
  }

  applyTransforms();

  // Smooth settling threshold: only active when shaking, drops to 0 when settled
  if (totalEnergy > 0.008) {
    animFrameId = requestAnimationFrame(physicsStep);
  } else {
    isAnimating = false;
    animFrameId = null;
    lastTime = null;
    resetTransforms();
  }
}

function ensureAnimationRunning() {
  if (!isAnimating) {
    isAnimating = true;
    lastTime = performance.now();
    if (typeof document !== 'undefined' && document.body) {
      document.body.classList.add('jelly-animating');
    }
    animFrameId = requestAnimationFrame(physicsStep);
  }
}

export function triggerJellyShake(intensity = 1.0, angleDeg = null) {
  pendingTimeouts.forEach((t) => clearTimeout(t));
  pendingTimeouts = [];

  const theta = angleDeg !== null
    ? (angleDeg * Math.PI) / 180
    : (Math.random() > 0.5 ? 0 : Math.PI) + (Math.random() - 0.5) * 0.45; // Natural left-right hand flick

  // Controlled, smooth velocity impulse magnitude (subtle, non-jarring)
  const baseAmp = 160 * Math.max(0.4, Math.min(1.8, intensity));
  const ix = Math.cos(theta) * baseAmp;
  const iy = Math.sin(theta) * baseAmp * 0.65; // Horizontal shake dominant

  // 1. Excite desktop chassis shake (simulating hand-held phone shake)
  chassisState.vx += ix * 0.85;
  chassisState.vRot += (ix / 160) * 18.0;

  // 2. Propagate smooth gelatinous wave across UI layers with phase delays
  Object.keys(LAYER_CONFIGS).forEach((key) => {
    const cfg = LAYER_CONFIGS[key];
    const layerIx = (ix / cfg.mass) * (0.9 + Math.random() * 0.2);
    const layerIy = (iy / cfg.mass) * (0.9 + Math.random() * 0.2);

    if (cfg.delayMs === 0) {
      layerStates[key].vx += layerIx;
      layerStates[key].vy += layerIy;
    } else {
      const t = setTimeout(() => {
        layerStates[key].vx += layerIx;
        layerStates[key].vy += layerIy;
        ensureAnimationRunning();
      }, cfg.delayMs);
      pendingTimeouts.push(t);
    }
  });

  // 3. Notify coupled subscribers (such as Nav Liquid Glass Bubble in App.jsx)
  shakeListeners.forEach((fn) => {
    try {
      fn(intensity, angleDeg, ix, iy);
    } catch {}
  });

  ensureAnimationRunning();

  // Tactile haptic vibration for real mobile devices
  if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
    try {
      navigator.vibrate([8, 16, 6]);
    } catch {}
  }
}

let isDeviceMotionBound = false;
let lastAcc = null;
let lastShakeTimestamp = 0;

export function initDeviceMotionListener() {
  if (typeof window === 'undefined' || isDeviceMotionBound) return;

  const onDeviceMotion = (e) => {
    const acc = e.accelerationIncludingGravity || e.acceleration;
    if (!acc) return;

    const now = performance.now();
    if (now - lastShakeTimestamp < 160) return; // Debounce sensor flutter

    const currentX = acc.x || 0;
    const currentY = acc.y || 0;
    const currentZ = acc.z || 0;

    if (!lastAcc) {
      lastAcc = { x: currentX, y: currentY, z: currentZ };
      return;
    }

    // High-pass jerk filter to eliminate constant 1G gravity
    const dx = currentX - lastAcc.x;
    const dy = currentY - lastAcc.y;
    const dz = currentZ - lastAcc.z;
    lastAcc = { x: currentX, y: currentY, z: currentZ };

    const jerk = Math.sqrt(dx * dx + dy * dy + dz * dz);

    // Natural deliberate hand shake threshold
    if (jerk > 5.5) {
      lastShakeTimestamp = now;
      const normalizedIntensity = Math.min(1.8, Math.max(0.6, jerk / 9.0));
      const angle = Math.atan2(-dy, dx);
      triggerJellyShake(normalizedIntensity, (angle * 180) / Math.PI);
    }
  };

  try {
    window.addEventListener('devicemotion', onDeviceMotion, { passive: true });
    isDeviceMotionBound = true;
  } catch {}
}

export function cleanupJellyPhysics() {
  if (animFrameId) {
    cancelAnimationFrame(animFrameId);
    animFrameId = null;
  }
  pendingTimeouts.forEach((t) => clearTimeout(t));
  pendingTimeouts = [];
  isAnimating = false;
  lastTime = null;
  shakeListeners.clear();
  resetTransforms();
}

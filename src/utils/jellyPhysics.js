/**
 * Viscoelastic Jelly Continuum Physics Engine
 * Multi-layer damped harmonic lattice with Navier-Stokes Poisson volume conservation & DeviceMotion shake detection
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

// Viscoelastic lattice parameters:
// omega: natural frequency (rad/s)
// zeta: underdamped ratio (0.35 - 0.44) for juicy, jiggly bounce
// mass: inertial mass factor
// delayMs: phase velocity delay (propagating gelatin shockwave)
// maxDisp: clamp threshold in px to prevent clipping
const LAYER_CONFIGS = {
  top:  { omega: 21.0, zeta: 0.44, mass: 0.85, delayMs: 0,   maxDisp: 18 },
  hero: { omega: 16.8, zeta: 0.35, mass: 1.45, delayMs: 25,  maxDisp: 32 },
  mid:  { omega: 18.5, zeta: 0.39, mass: 1.05, delayMs: 45,  maxDisp: 24 },
  body: { omega: 15.8, zeta: 0.41, mass: 1.25, delayMs: 70,  maxDisp: 26 },
  dock: { omega: 19.5, zeta: 0.37, mass: 0.95, delayMs: 85,  maxDisp: 22 }
};

const layerStates = {
  top:  { x: 0, vx: 0, y: 0, vy: 0 },
  hero: { x: 0, vx: 0, y: 0, vy: 0 },
  mid:  { x: 0, vx: 0, y: 0, vy: 0 },
  body: { x: 0, vx: 0, y: 0, vy: 0 },
  dock: { x: 0, vx: 0, y: 0, vy: 0 }
};

let animFrameId = null;
let lastTime = null;
let isAnimating = false;
let pendingTimeouts = [];

function applyLayerTransforms() {
  const root = document.documentElement;
  if (!root) return;

  const rootStyle = root.style;

  Object.keys(LAYER_CONFIGS).forEach((key) => {
    const s = layerStates[key];
    const cfg = LAYER_CONFIGS[key];

    // Clamping to physical elastic boundary
    const cx = Math.max(-cfg.maxDisp, Math.min(cfg.maxDisp, s.x));
    const cy = Math.max(-cfg.maxDisp, Math.min(cfg.maxDisp, s.y));

    // Non-linear Poisson volume conservation (Squish-and-stretch)
    const squishY = Math.tanh(cy / 55) * 0.16;
    const scaleY = Math.max(0.82, Math.min(1.22, 1.0 + squishY));
    const scaleX = Math.max(0.82, Math.min(1.25, 1.0 - 0.46 * squishY + Math.abs(Math.tanh(cx / 70)) * 0.08));

    // Dynamic hydrodynamic rotational tilt & shear
    const rotDeg = Math.tanh(cx / 40) * 3.4 + Math.tanh(s.vx / 450) * 2.0;
    const skewDeg = -Math.tanh(cx / 60) * 2.8;

    rootStyle.setProperty(`--jelly-${key}-x`, `${cx.toFixed(2)}px`);
    rootStyle.setProperty(`--jelly-${key}-y`, `${cy.toFixed(2)}px`);
    rootStyle.setProperty(`--jelly-${key}-sx`, scaleX.toFixed(4));
    rootStyle.setProperty(`--jelly-${key}-sy`, scaleY.toFixed(4));
    rootStyle.setProperty(`--jelly-${key}-rot`, `${rotDeg.toFixed(2)}deg`);
    if (key === 'hero') {
      rootStyle.setProperty(`--jelly-${key}-skew`, `${skewDeg.toFixed(2)}deg`);
    }
  });
}

function resetLayerTransforms() {
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
    if (key === 'hero') {
      rootStyle.setProperty(`--jelly-${key}-skew`, '0deg');
    }
  });

  if (typeof document !== 'undefined' && document.body) {
    document.body.classList.remove('jelly-animating');
  }
}

function physicsStep(now) {
  const rawDt = Math.min((now - (lastTime || now)) / 1000, 0.032) || 0.016;
  lastTime = now;

  // RK2 / Symplectic Verlet integration (2 sub-steps for smooth 120Hz stability)
  const subSteps = 2;
  const dt = rawDt / subSteps;

  let totalEnergy = 0;

  for (let step = 0; step < subSteps; step++) {
    Object.keys(LAYER_CONFIGS).forEach((key) => {
      const cfg = LAYER_CONFIGS[key];
      const s = layerStates[key];

      // Second-order damped harmonic spring: f = -omega^2 * x - 2 * zeta * omega * v
      const k = cfg.omega * cfg.omega;
      const c = 2 * cfg.zeta * cfg.omega;

      const fx = -k * s.x - c * s.vx;
      const fy = -k * s.y - c * s.vy;

      s.vx += fx * dt;
      s.x += s.vx * dt;

      s.vy += fy * dt;
      s.y += s.vy * dt;

      if (step === subSteps - 1) {
        totalEnergy += 0.5 * (s.x * s.x + s.y * s.y) + 0.001 * (s.vx * s.vx + s.vy * s.vy);
      }
    });
  }

  applyLayerTransforms();

  // Energy settling threshold
  if (totalEnergy > 0.02) {
    animFrameId = requestAnimationFrame(physicsStep);
  } else {
    isAnimating = false;
    animFrameId = null;
    lastTime = null;
    resetLayerTransforms();
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
  // Clear any pending delayed phase wave timers
  pendingTimeouts.forEach((t) => clearTimeout(t));
  pendingTimeouts = [];

  // Determine shake angle: random natural hand flick or specified angle
  const theta = angleDeg !== null
    ? (angleDeg * Math.PI) / 180
    : (Math.random() * Math.PI * 2);

  // Velocity impulse magnitude
  const baseAmp = 380 * Math.max(0.4, Math.min(2.5, intensity));
  const ix = Math.cos(theta) * baseAmp * (0.85 + Math.random() * 0.3);
  const iy = Math.sin(theta) * baseAmp * (0.85 + Math.random() * 0.3);

  // Propagate shockwave down the gelatinous lattice with phase delays
  Object.keys(LAYER_CONFIGS).forEach((key) => {
    const cfg = LAYER_CONFIGS[key];
    const layerIx = (ix / cfg.mass) * (1 + (Math.random() - 0.5) * 0.15);
    const layerIy = (iy / cfg.mass) * (1 + (Math.random() - 0.5) * 0.15);

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

  ensureAnimationRunning();

  // Tactile haptic vibration for real mobile devices
  if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
    try {
      navigator.vibrate([10, 24, 6]);
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
    if (now - lastShakeTimestamp < 150) return; // Debounce sensor flutter

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

    // Dynamic threshold: deliberate hand shake
    if (jerk > 7.0) {
      lastShakeTimestamp = now;
      const normalizedIntensity = Math.min(2.2, Math.max(0.65, jerk / 8.5));
      // Invert Y because device accelerometer Y goes down
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
  resetLayerTransforms();
}

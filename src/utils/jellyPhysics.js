/**
 * Cassiel Inertial Jelly Engine (HP Goyang → UI Kenyal Searah Goyangan)
 *
 * Referensi dunia nyata yang diterjemahkan ke kode:
 *  1. Prinsip d'Alembert (kerangka non-inersia): layar HP adalah kerangka yang dipercepat,
 *     sehingga setiap elemen merasakan gaya semu  F = −m · a_hp.
 *     HP disentak ke ATAS → konten tertinggal ke BAWAH → memantul naik-turun (kenyal).
 *  2. Android SpringForce (androidx.dynamicanimation): DAMPING_RATIO_MEDIUM_BOUNCY = 0.5,
 *     STIFFNESS_LOW = 200 (ω ≈ 14 rad/s) → karakter jelly natural.
 *  3. Glenn Fiedler "Fix Your Timestep!": integrasi langkah tetap 240 Hz + akumulator
 *     → gerak identik & mulus di 60/90/120 Hz, tanpa patah-patah.
 *  4. Disney Squash & Stretch: luas dipertahankan (sx · sy = 1) via skala eksponensial.
 *
 * Hukum Inersia Jelly Cassiel (rumus gabungan):
 *   ẍᵢ = −ωᵢ² xᵢ − 2ζᵢωᵢ ẋᵢ − mᵢ · a_layar(t − τᵢ)
 *   x_tampil = X_max · tanh(xᵢ / X_max)              (saturasi lunak, tidak ada clamp keras)
 *   σ = κ · tanh(y / Y₀),  sy = e^(−σ),  sx = e^(+σ)  (kekekalan luas)
 *
 * Performa: transform ditulis langsung lewat properti CSS individual `translate` / `scale` /
 * `rotate` per elemen (tidak menimpa `transform` yang sudah ada & tidak memicu recalc
 * style seluruh dokumen). Loop RAF mati total saat diam.
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

// ---------------------------------------------------------------------------
// Event bus untuk komponen terkopel (Balon Kaca Menu Bar di App.jsx)
// ---------------------------------------------------------------------------
const shakeListeners = new Set();

export function registerJellyShakeListener(callback) {
  if (typeof callback !== 'function') return () => {};
  shakeListeners.add(callback);
  return () => shakeListeners.delete(callback);
}

// ---------------------------------------------------------------------------
// Konfigurasi lapisan (ω rad/s, ζ redaman, m massa inersia, τ jeda gelombang ms)
// ---------------------------------------------------------------------------
const LAYERS = [
  { key: 'top',  sel: '.top-bar',                                                         omega: 17.0, zeta: 0.52, mass: 0.70, delayMs: 0,  maxX: 6,  maxY: 7 },
  { key: 'hero', sel: '.balance-section, .floating-hero-card',                            omega: 14.0, zeta: 0.46, mass: 1.00, delayMs: 14, maxX: 9,  maxY: 11 },
  { key: 'mid',  sel: '.home-budget-hero, .home-insight-card, .income-expense-cards, .budget-overview-card', omega: 15.0, zeta: 0.48, mass: 0.90, delayMs: 26, maxX: 8, maxY: 9 },
  { key: 'body', sel: '.transactions-container, .transactions-container-animated, .account-section, .budget-list-container', omega: 13.5, zeta: 0.50, mass: 0.80, delayMs: 38, maxX: 7, maxY: 8 },
  { key: 'dock', sel: '.bottom-nav .nav-items-container',                                  omega: 15.5, zeta: 0.44, mass: 1.10, delayMs: 50, maxX: 9,  maxY: 10 },
];

const H = 1 / 240;                 // langkah fisika tetap (detik)
const HISTORY = 64;                // buffer riwayat percepatan (~266 ms)
const DEVICE_PX_PER_MS2 = 140;     // skala m/s² → px/s² untuk sensor nyata (lebih responsif)
const DEVICE_DEADZONE = 0.35;      // m/s² (filter tremor tangan mikro)
const DEVICE_WAKE = 0.9;           // m/s² ambang bangun cepat saat digoyang tangan

const layerState = LAYERS.map(() => ({ x: 0, y: 0, vx: 0, vy: 0, els: [] }));
const histX = new Float32Array(HISTORY);
const histY = new Float32Array(HISTORY);
let histHead = 0;

// Simulasi HP di desktop (tangan memegang HP)
const phone = {
  x: 0, y: 0, vx: 0, vy: 0,
  tx: 0, ty: 0,          // target posisi (tangan)
  ax: 0, ay: 0,          // percepatan hasil (px/s²)
  omega: 26, zeta: 0.72,
  holding: false,
  dragging: false,
  holdT: 0,
  flickX: 0, flickY: 0, flickLeft: 0,
};

// Input sensor nyata (px/s², koordinat layar: x kanan, y bawah)
const device = { ax: 0, ay: 0, lastSample: 0 };

let rafId = null;
let lastFrame = 0;
let accumulator = 0;
let rootEl = null;
let lastElRefresh = 0;
let lastEmit = 0;

const softSat = (v, max) => max * Math.tanh(v / max);

function refreshElements() {
  if (typeof document === 'undefined') return;
  LAYERS.forEach((cfg, i) => {
    layerState[i].els = Array.from(document.querySelectorAll(cfg.sel));
  });
  rootEl = document.getElementById('root');
}

function clearStyles() {
  layerState.forEach((s) => {
    s.els.forEach((el) => {
      el.style.translate = '';
      el.style.scale = '';
      el.style.rotate = '';
    });
  });
  if (rootEl) {
    rootEl.style.translate = '';
    rootEl.style.rotate = '';
  }
}

function isDesktopFrame() {
  return typeof window !== 'undefined' && window.innerWidth > 480;
}

function stepPhysics() {
  // 1. HP (tangan) — pegas kritis menuju target tangan
  if (phone.holding && !phone.dragging) {
    // Goyang naik-turun ritmis ±9px @ 4.2 Hz (frekuensi goyangan tangan manusia)
    phone.holdT += H;
    phone.ty = -9 * Math.sin(2 * Math.PI * 4.2 * phone.holdT);
    phone.tx = 0;
  } else if (phone.flickLeft > 0) {
    phone.tx = phone.flickX;
    phone.ty = phone.flickY;
    phone.flickLeft -= H;
    if (phone.flickLeft <= 0 && !phone.dragging) {
      phone.tx = 0;
      phone.ty = 0;
    }
  }
  const kp = phone.omega * phone.omega;
  const cp = 2 * phone.zeta * phone.omega;
  phone.ax = -kp * (phone.x - phone.tx) - cp * phone.vx;
  phone.ay = -kp * (phone.y - phone.ty) - cp * phone.vy;
  phone.vx += phone.ax * H;
  phone.vy += phone.ay * H;
  phone.x += phone.vx * H;
  phone.y += phone.vy * H;

  // 2. Percepatan total kerangka layar
  const aX = phone.ax + device.ax;
  const aY = phone.ay + device.ay;
  histX[histHead] = aX;
  histY[histHead] = aY;

  // 3. Lapisan jelly: ẍ = −ω²x − 2ζωẋ − m·a(t−τ)
  for (let i = 0; i < LAYERS.length; i++) {
    const cfg = LAYERS[i];
    const s = layerState[i];
    const lag = Math.min(HISTORY - 1, Math.round(cfg.delayMs / 1000 / H));
    const idx = (histHead - lag + HISTORY) % HISTORY;
    const k = cfg.omega * cfg.omega;
    const c = 2 * cfg.zeta * cfg.omega;
    const accX = -k * s.x - c * s.vx - cfg.mass * histX[idx];
    const accY = -k * s.y - c * s.vy - cfg.mass * histY[idx];
    s.vx += accX * H;   // semi-implicit Euler (symplectic)
    s.vy += accY * H;
    s.x += s.vx * H;
    s.y += s.vy * H;
  }

  histHead = (histHead + 1) % HISTORY;
  return Math.abs(aX) + Math.abs(aY);
}

function render() {
  for (let i = 0; i < LAYERS.length; i++) {
    const cfg = LAYERS[i];
    const s = layerState[i];
    if (!s.els.length) continue;

    const dx = softSat(s.x, cfg.maxX);
    const dy = softSat(s.y, cfg.maxY);

    // Squash & stretch searah gerak vertikal (luas tetap)
    const sigma = 0.045 * Math.tanh(s.y / 8) - 0.015 * Math.tanh(Math.abs(s.x) / 10);
    const sy = Math.exp(-sigma);
    const sx = Math.exp(sigma);
    // Condong lembut searah kecepatan horizontal
    const rot = 0.9 * Math.tanh(s.vx / 500);

    const t = `${dx.toFixed(2)}px ${dy.toFixed(2)}px`;
    const sc = `${sx.toFixed(4)} ${sy.toFixed(4)}`;
    const r = `${rot.toFixed(3)}deg`;
    for (const el of s.els) {
      el.style.translate = t;
      el.style.scale = sc;
      el.style.rotate = r;
    }
  }

  if (rootEl && isDesktopFrame() && (phone.holding || Math.abs(phone.x) + Math.abs(phone.y) > 0.05)) {
    rootEl.style.translate = `${phone.x.toFixed(2)}px ${phone.y.toFixed(2)}px`;
    rootEl.style.rotate = `${(phone.x * 0.06).toFixed(3)}deg`;
  } else if (rootEl && rootEl.style.translate) {
    rootEl.style.translate = '';
    rootEl.style.rotate = '';
  }
}

function emitToListeners(aX, aY) {
  const now = performance.now();
  const mag = Math.hypot(aX, aY);
  if (mag < 250 || now - lastEmit < 110 || !shakeListeners.size) return;
  lastEmit = now;
  const intensity = Math.min(1.8, Math.max(0.4, mag / 1200));
  const ix = (-aX / mag) * 160 * intensity; // arah inersia konten
  const iy = (-aY / mag) * 160 * intensity;
  const angleDeg = (Math.atan2(iy, ix) * 180) / Math.PI;
  shakeListeners.forEach((fn) => { try { fn(intensity, angleDeg, ix, iy); } catch {} });
}

function totalEnergy() {
  let e = phone.vx * phone.vx + phone.vy * phone.vy + 400 * (phone.x * phone.x + phone.y * phone.y);
  for (const s of layerState) {
    e += s.vx * s.vx + s.vy * s.vy + 200 * (s.x * s.x + s.y * s.y);
  }
  return e;
}

function frame(now) {
  const elapsed = Math.min(0.05, (now - lastFrame) / 1000);
  lastFrame = now;
  accumulator += elapsed;

  if (now - lastElRefresh > 400) {
    refreshElements();
    lastElRefresh = now;
  }

  // Sensor diam > 120ms → anggap percepatan nol
  if (now - device.lastSample > 120) {
    device.ax *= 0.5;
    device.ay *= 0.5;
  }

  let peak = 0;
  while (accumulator >= H) {
    peak = Math.max(peak, stepPhysics());
    accumulator -= H;
  }
  emitToListeners(phone.ax + device.ax, phone.ay + device.ay);
  render();

  const deviceActive = Math.abs(device.ax) + Math.abs(device.ay) > 1;
  if (!phone.holding && phone.flickLeft <= 0 && !deviceActive && totalEnergy() < 2.0) {
    stopLoop();
    return;
  }
  rafId = requestAnimationFrame(frame);
}

function startLoop() {
  if (rafId) return;
  refreshElements();
  lastElRefresh = performance.now();
  lastFrame = performance.now();
  accumulator = 0;
  rafId = requestAnimationFrame(frame);
}

function stopLoop() {
  if (rafId) cancelAnimationFrame(rafId);
  rafId = null;
  phone.x = phone.y = phone.vx = phone.vy = phone.tx = phone.ty = 0;
  phone.flickLeft = 0;
  layerState.forEach((s) => { s.x = s.y = s.vx = s.vy = 0; });
  histX.fill(0);
  histY.fill(0);
  clearStyles();
}

// ---------------------------------------------------------------------------
// API simulasi HP (tombol segitiga localhost)
// ---------------------------------------------------------------------------

/** Sentakan HP searah sudut (default 270° = ke atas, sesuai ikon ▲). */
export function triggerJellyShake(intensity = 1.0, angleDeg = -90) {
  const th = (angleDeg * Math.PI) / 180;
  const amp = 14 * Math.max(0.3, Math.min(1.8, intensity));
  // Tangan menggerakkan HP secara kontinu: ke arah sentakan selama 90ms lalu kembali.
  // Percepatan riil awal searah sentakan → konten tertinggal berlawanan arah dulu (fisis).
  phone.flickX = Math.cos(th) * amp;
  phone.flickY = Math.sin(th) * amp;
  phone.flickLeft = 0.09;
  startLoop();
  if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
    try { navigator.vibrate(8); } catch {}
  }
}

/** Mulai menggenggam HP: goyang naik-turun ritmis sampai dilepas / diseret. */
export function beginPhoneHold() {
  phone.holding = true;
  phone.dragging = false;
  phone.holdT = 0;
  startLoop();
}

/** Seret HP mengikuti tangan (dx, dy dalam px dari titik tekan). */
export function dragPhone(dx, dy) {
  phone.dragging = true;
  phone.tx = 40 * Math.tanh((dx * 0.4) / 40);
  phone.ty = 40 * Math.tanh((dy * 0.4) / 40);
  startLoop();
}

/** Lepas HP: pegas tangan kembali ke tengah, konten memantul kenyal. */
export function endPhoneHold() {
  phone.holding = false;
  phone.dragging = false;
  phone.tx = 0;
  phone.ty = 0;
}

import { Capacitor, registerPlugin } from '@capacitor/core';

// Native Sensor Plugin Bridge (Android Hardware SensorManager)
const CassielMotion = registerPlugin('CassielMotion');

// ---------------------------------------------------------------------------
// Sensor gerak HP nyata
// ---------------------------------------------------------------------------
let motionBound = false;
let gravity = null;
let onMotionRef = null;
let nativeMotionHandle = null;

function processCleanMotion(ax, ay) {
  // Koordinat perangkat Android (y ke atas) → koordinat layar CSS (y ke bawah), koreksi orientasi layar
  const angle = ((window.screen?.orientation?.angle ?? window.orientation ?? 0) * Math.PI) / 180;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  let sx = ax * cos + ay * sin;
  let sy = -(-ax * sin + ay * cos);

  // Deadzone lunak
  const mag = Math.hypot(sx, sy);
  if (mag < DEVICE_DEADZONE) {
    sx = 0;
    sy = 0;
  } else {
    const f = (mag - DEVICE_DEADZONE) / mag;
    sx *= f;
    sy *= f;
  }

  // Low-pass ringan untuk menghaluskan sampel sensor 60 Hz
  device.ax += (sx * DEVICE_PX_PER_MS2 - device.ax) * 0.55;
  device.ay += (sy * DEVICE_PX_PER_MS2 - device.ay) * 0.55;
  device.lastSample = performance.now();

  if (!rafId && mag > DEVICE_WAKE) startLoop();
}

export function initDeviceMotionListener() {
  if (typeof window === 'undefined' || motionBound) return;

  // 1. JALUR NATIVE ANDROID: Langsung dari SensorManager Hardware via CassielMotion
  if (Capacitor.isNativePlatform()) {
    try {
      CassielMotion.startListening()
        .then(() => {
          return CassielMotion.addListener('motion', (data) => {
            if (data && typeof data.x === 'number') {
              processCleanMotion(data.x, data.y);
            }
          });
        })
        .then((handle) => {
          nativeMotionHandle = handle;
          motionBound = true;
        })
        .catch((err) => {
          console.warn('[JellyPhysics] Native sensor bridge fallback to DOM:', err);
          bindDomMotionListener();
        });
      return;
    } catch (e) {
      console.warn('[JellyPhysics] Could not start native motion:', e);
    }
  }

  // 2. JALUR BROWSER / WEB FALLBACK: DOM DeviceMotionEvent
  bindDomMotionListener();
}

function bindDomMotionListener() {
  if (motionBound) return;
  onMotionRef = (e) => {
    let ax;
    let ay;
    if (e.acceleration && e.acceleration.x !== null && e.acceleration.x !== undefined) {
      ax = e.acceleration.x || 0;
      ay = e.acceleration.y || 0;
    } else if (e.accelerationIncludingGravity) {
      // Filter lolos-tinggi: pisahkan gravitasi dengan low-pass α = 0.9
      const g = e.accelerationIncludingGravity;
      if (!gravity) gravity = { x: g.x || 0, y: g.y || 0 };
      gravity.x = 0.9 * gravity.x + 0.1 * (g.x || 0);
      gravity.y = 0.9 * gravity.y + 0.1 * (g.y || 0);
      ax = (g.x || 0) - gravity.x;
      ay = (g.y || 0) - gravity.y;
    } else {
      return;
    }

    processCleanMotion(ax, ay);
  };

  try {
    window.addEventListener('devicemotion', onMotionRef, { passive: true });
    motionBound = true;
  } catch {}
}

export function cleanupJellyPhysics() {
  if (nativeMotionHandle && typeof nativeMotionHandle.remove === 'function') {
    try {
      nativeMotionHandle.remove();
    } catch {}
    nativeMotionHandle = null;
  }
  if (Capacitor.isNativePlatform()) {
    try {
      CassielMotion.stopListening().catch(() => {});
    } catch {}
  }
  if (motionBound && onMotionRef) {
    window.removeEventListener('devicemotion', onMotionRef);
  }
  motionBound = false;
  onMotionRef = null;
  gravity = null;
  stopLoop();
}


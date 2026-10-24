import React, { useState, useEffect, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import './LocalhostMenubarTuner.css';

const STORAGE_KEY = 'cassiel_tuning_settings_v3';

// Helper hex to rgba
function hexToRgba(hex, alphaPercent) {
  let c = hex.replace('#', '');
  if (c.length === 3) c = c.split('').map((x) => x + x).join('');
  const num = parseInt(c, 16);
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  const a = Math.max(0, Math.min(1, alphaPercent / 100));
  return `rgba(${r}, ${g}, ${b}, ${a.toFixed(2)})`;
}

// Preset Warna Cepat
const PRESET_COLORS = [
  { name: 'Pure White', hex: '#FFFFFF' },
  { name: 'Obsidian Black', hex: '#000000' },
  { name: 'Cassiel Amber', hex: '#D97706' },
  { name: 'Midnight Navy', hex: '#0F172A' },
  { name: 'Forest Emerald', hex: '#064E3B' },
  { name: 'Royal Purple', hex: '#3B0764' },
  { name: 'Warm Cream', hex: '#FDFBF7' },
];

// Permanent Default Settings (Diselaraskan 100% dengan Pilihan Terkini Redi)
const DEFAULT_VALUES = {
  // === 1. Wadah Menubar (Container Glass) ===
  containerStyleId: 'clear',
  backdropEffectId: 'wave',
  bgColor: '#FFFFFF',
  bgOpacity: 0, // 0% (Clear Bening)
  sheenColor: '#FFFFFF',
  sheenOpacity: 0, // 0%
  blur: 2, // 2px (Background Blur)

  // Inner Shadow 1 (Key Specular: Atas & Samping Kiri)
  in1Color: '#FFFFFF',
  in1X: 4,
  in1Y: 2,
  in1Blur: 3,
  in1Op: 60, // 60%

  // Inner Shadow 2 (Counter Rim Reflex: Bawah & Samping Kanan)
  in2Color: '#FFFFFF',
  in2X: -3,
  in2Y: 2,
  in2Blur: 3,
  in2Op: 60, // 60%

  // Inner Shadow 3 (Perimeter Glow)
  in3Color: '#FFFFFF',
  in3Blur: 10,
  in3Op: 30, // 30%

  // Tekstur Noise
  textureOpacity: 0, // 0% (Tanpa noise)
  textureSize: 180,

  // Bayangan Luar Halus (Subtle Elevation)
  outerShadowOp: 15, // 15%
  outerShadowBlur: 9, // 9px

  // === 2. Balon Kaca Oval (Bubble Glass) ===
  bubbleBgColor: '#FFFFFF',
  bubbleBgOpacity: 45, // 45%
  bubbleBlur: 18, // 18px
  bubbleIn1Color: '#FFFFFF',
  bubbleIn1X: 0,
  bubbleIn1Y: 1.5,
  bubbleIn1Blur: 2,
  bubbleIn1Op: 95, // 95%
  bubbleIn2Color: '#D97706',
  bubbleIn2X: 0,
  bubbleIn2Y: -1.5,
  bubbleIn2Blur: 2.5,
  bubbleIn2Op: 12, // 12%
  bubbleCrescentOp: 100, // 100%
  bubbleShadowOp: 20, // 20%
  bubbleShadowBlur: 12, // 12px

  // === 3. Animasi Scroll Kartu Transaksi ===
  txScrollAnim: 'spring-up',
  txAnimDur: 0.52, // 0.52 detik
};

// 5 Pilihan Animasi Kartu Transaksi
const SCROLL_ANIM_OPTIONS = [
  {
    id: 'spring-up',
    name: 'Spring Cascade',
    icon: '🌊',
    desc: 'Meluncur naik dari bawah dengan pantulan kurva Apple Spring alami.',
  },
  {
    id: 'deck-3d',
    name: '3D Deck Flip',
    icon: '🎴',
    desc: 'Perspektif 3D sumbu X seperti deretan kartu fisik yang terbuka rapi.',
  },
  {
    id: 'jelly-pop',
    name: 'Elastic Jelly Pop',
    icon: '🍮',
    desc: 'Skala membal elastis dari kecil ke normal dengan efek kenyal.',
  },
  {
    id: 'kinetic-slide',
    name: 'Kinetic Slide',
    icon: '🚀',
    desc: 'Meluncur gesit dan halus dari arah samping kiri layar.',
  },
  {
    id: 'glass-levitate',
    name: 'Glass Levitation',
    icon: '🪟',
    desc: 'Kaca melayang terangkat dari blur kabur menjadi kristal tajam.',
  },
  {
    id: 'none',
    name: 'Nonaktif (Standar)',
    icon: '⏹️',
    desc: 'Tanpa animasi scroll khusus (muncul statis bawaan).',
  },
];

// 1. Pilihan Gaya Material Wadah Kontainer (Terpisah dari Efek Latar)
const CONTAINER_STYLES = [
  {
    id: 'clear',
    label: 'Clear Bening',
    icon: '🫧',
    tag: 'CLEAR',
    desc: '100% Transparan',
    bgColor: '#FFFFFF',
    bgOpacity: 0,
    sheenOpacity: 0,
    textureOpacity: 0,
    border: '1px solid rgba(255, 255, 255, 0.45)',
  },
  {
    id: 'standard',
    label: 'Figma Liquid',
    icon: '🥛',
    tag: 'FIGMA',
    desc: 'Putih Semi-Transparan',
    bgColor: '#FFFFFF',
    bgOpacity: 20,
    sheenOpacity: 20,
    textureOpacity: 25,
    border: 'none',
  },
  {
    id: 'obsidian',
    label: 'Obsidian Smoked',
    icon: '🖤',
    tag: 'DARK',
    desc: 'Kaca Gelap Elegan',
    bgColor: '#0F172A',
    bgOpacity: 35,
    sheenOpacity: 15,
    textureOpacity: 20,
    border: 'none',
  },
  {
    id: 'ivory',
    label: 'Warm Crystal',
    icon: '🍦',
    tag: 'IVORY',
    desc: 'Gading Kristal Hangat',
    bgColor: '#FFFBEB',
    bgOpacity: 24,
    sheenOpacity: 30,
    textureOpacity: 15,
    border: 'none',
  },
];

// 2. Pilihan Efek Pembiasan / Blur Latar Belakang (Independen)
const BACKDROP_EFFECTS = [
  {
    id: 'wave',
    label: 'Liquid Wave',
    icon: '🌊',
    tag: 'WAVE',
    filterBase: 'url(#distorsion-wave)',
    desc: 'Riak Alami Cair',
    summary: 'Latar belakang terdistorsi melengkung-lengkung gelombang likuid cair.',
  },
  {
    id: 'fluted',
    label: 'Fluted Moru',
    icon: '🏛️',
    tag: 'MORU',
    filterBase: 'url(#distorsion-fluted)',
    desc: 'Kaca Garis Katedral',
    summary: 'Latar belakang terbiaskan garis-garis vertikal arsitektural moru.',
  },
  {
    id: 'lens',
    label: 'Domed Lens',
    icon: '🔍',
    tag: 'LENS',
    filterBase: 'url(#distorsion-lens)',
    desc: 'Lensa Kubah Cembung',
    summary: 'Latar belakang terbiaskan kubah cembung melengkung besar ala kaca arloji.',
  },
  {
    id: 'standard-blur',
    label: 'Standar Blur',
    icon: '🌫️',
    tag: 'BLUR',
    filterUrl: 'blur-dynamic',
    desc: 'Blur Bersih Datar',
    summary: 'Blur Gaussian bersih dan halus (keburaman diatur via slider di bawah).',
  },
  {
    id: 'prism',
    label: 'Prism Split',
    icon: '🌈',
    tag: 'PRISM',
    filterUrl: 'blur(14px) saturate(180%) contrast(110%) brightness(1.04)',
    desc: 'Dispersi Prisma',
    summary: 'Dispersi spektrum pelangi optik Cauchy di tepi batas kontur.',
  },
  {
    id: 'silk',
    label: 'Frosted Silk',
    icon: '❄️',
    tag: 'SILK',
    filterUrl: 'blur(24px) saturate(135%) brightness(1.12) contrast(106%)',
    desc: 'Kabut Sutra Satin',
    summary: 'Difusi serat sutra horizontal halus ala jam tangan mewah.',
  },
  {
    id: 'aurora',
    label: 'Aurora Velvet',
    icon: '🌌',
    tag: 'AURORA',
    filterUrl: 'blur(18px) saturate(220%) contrast(124%) brightness(1.02)',
    desc: 'Pendar Velvet Polar',
    summary: 'Pendar atmosferik hangat matahari senja & twilight.',
  },
];


export default function LocalhostMenubarTuner() {
  // ATURAN MUTLAK: Panel HANYA boleh aktif di browser desktop localhost (DILARANG KERAS tampil di Android / Capacitor)
  const isNativeAndroid =
    Capacitor.isNativePlatform() ||
    Capacitor.getPlatform() === 'android' ||
    (typeof window !== 'undefined' &&
      (window.location.protocol === 'capacitor:' ||
        window.location.protocol === 'ionic:' ||
        /Android/i.test(navigator.userAgent)));

  const isLocalhost =
    Boolean(import.meta.env?.DEV) &&
    !isNativeAndroid &&
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('menubar'); // 'menubar' | 'bubble' | 'tx_anim'
  const [toastMsg, setToastMsg] = useState('');
  const [saveStatus, setSaveStatus] = useState('');

  // Posisi draggable panel di layar
  const [panelPos, setPanelPos] = useState({ x: 20, y: 80 });
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ startX: 0, startY: 0, initialX: 0, initialY: 0 });

  // Load saved settings
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return { ...DEFAULT_VALUES, ...JSON.parse(saved) };
      }
    } catch {
      // ignore
    }
    return DEFAULT_VALUES;
  });

  // Terapkan semua CSS variables secara real-time ke document.documentElement
  useEffect(() => {
    if (!isLocalhost) return;

    // 1. Wadah Menubar
    const root = document.documentElement;
    root.style.setProperty('--nav-glass-bg-color', hexToRgba(settings.bgColor, settings.bgOpacity));
    root.style.setProperty('--nav-glass-white-sheen', hexToRgba(settings.sheenColor, settings.sheenOpacity));
    root.dataset.containerStyle = settings.containerStyleId || 'clear';
    root.dataset.blurEffect = settings.backdropEffectId || 'wave';
    let backdropFormula = '';
    const curEffId = settings.backdropEffectId || 'wave';
    const blurPart = settings.blur > 0 ? `blur(${settings.blur}px)` : '';

    if (curEffId === 'wave') {
      backdropFormula = blurPart ? `url(#distorsion-wave) ${blurPart}` : 'url(#distorsion-wave)';
    } else if (curEffId === 'fluted') {
      backdropFormula = blurPart ? `url(#distorsion-fluted) ${blurPart}` : 'url(#distorsion-fluted)';
    } else if (curEffId === 'lens') {
      backdropFormula = blurPart ? `url(#distorsion-lens) ${blurPart}` : 'url(#distorsion-lens)';
    } else if (curEffId === 'prism') {
      backdropFormula = `blur(${Math.max(4, settings.blur)}px) saturate(180%) contrast(110%) brightness(1.04)`;
    } else if (curEffId === 'silk') {
      backdropFormula = `blur(${Math.max(4, settings.blur)}px) saturate(135%) brightness(1.12) contrast(106%)`;
    } else if (curEffId === 'aurora') {
      backdropFormula = `blur(${Math.max(4, settings.blur)}px) saturate(220%) contrast(124%) brightness(1.02)`;
    } else {
      // standard-blur
      backdropFormula = `blur(${settings.blur}px)`;
    }
    root.style.setProperty('--nav-glass-backdrop', backdropFormula);
    root.style.setProperty('--nav-glass-blur', `${settings.blur}px`);
    root.style.setProperty(
      '--nav-glass-inner-1',
      `inset ${settings.in1X}px ${settings.in1Y}px ${settings.in1Blur}px ${hexToRgba(settings.in1Color, settings.in1Op)}`
    );
    root.style.setProperty(
      '--nav-glass-inner-2',
      `inset ${settings.in2X}px ${settings.in2Y}px ${settings.in2Blur}px ${hexToRgba(settings.in2Color, settings.in2Op)}`
    );
    root.style.setProperty(
      '--nav-glass-inner-3',
      `inset 0 0 ${settings.in3Blur}px ${hexToRgba(settings.in3Color, settings.in3Op)}`
    );
    root.style.setProperty('--nav-glass-texture-size', `${settings.textureSize}px ${settings.textureSize}px`);
    const noiseSvg = settings.textureOpacity > 0
      ? `url("data:image/svg+xml,%3Csvg viewBox='0 0 ${settings.textureSize} ${settings.textureSize}' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='${settings.textureSize}' height='${settings.textureSize}' filter='url(%23noise)' opacity='${(settings.textureOpacity / 100).toFixed(2)}'/%3E%3C/svg%3E")`
      : 'none';
    root.style.setProperty('--nav-glass-texture-url', noiseSvg);
    root.style.setProperty(
      '--nav-glass-outer-shadow',
      settings.outerShadowOp > 0
        ? `0 6px ${settings.outerShadowBlur}px -3px rgba(65, 45, 25, ${(settings.outerShadowOp / 100).toFixed(2)})`
        : 'none'
    );

    // 2. Balon Kaca Oval
    root.style.setProperty('--bubble-blur', `${settings.bubbleBlur}px`);
    root.style.setProperty('--bubble-crescent-opacity', `${(settings.bubbleCrescentOp / 100).toFixed(2)}`);
    root.style.setProperty(
      '--bubble-material-bg',
      `radial-gradient(110% 90% at calc(50% - var(--glass-tilt-x) * 14%) calc(20% - var(--glass-lift) * 4%), ${hexToRgba(
        settings.bubbleBgColor,
        settings.bubbleBgOpacity
      )} 0%, rgba(255, 253, 248, 0.28) 45%, rgba(246, 234, 218, 0.18) 80%, ${hexToRgba(
        settings.bubbleBgColor,
        Math.min(100, settings.bubbleBgOpacity * 1.25)
      )} 100%)`
    );
    root.style.setProperty(
      '--bubble-inner-shadow',
      `inset ${settings.bubbleIn1X}px ${settings.bubbleIn1Y}px ${settings.bubbleIn1Blur}px ${hexToRgba(
        settings.bubbleIn1Color,
        settings.bubbleIn1Op
      )}, inset ${settings.bubbleIn2X}px ${settings.bubbleIn2Y}px ${settings.bubbleIn2Blur}px ${hexToRgba(
        settings.bubbleIn2Color,
        settings.bubbleIn2Op
      )}, inset calc(1.8px - var(--glass-tilt-x) * 2px) 0 3px rgba(255, 255, 255, 0.35), inset calc(-1.8px - var(--glass-tilt-x) * 1.5px) 0 3px rgba(255, 250, 242, 0.28)`
    );
    root.style.setProperty(
      '--bubble-drop-shadow',
      `0 calc(3px + var(--glass-lift) * 6.5px) calc(${settings.bubbleShadowBlur}px + var(--glass-lift) * 12px) rgba(92, 58, 24, ${(
        settings.bubbleShadowOp / 100
      ).toFixed(2)}), 0 calc(1.5px + var(--glass-lift) * 2px) calc(4px + var(--glass-lift) * 5px) rgba(0, 0, 0, 0.04), 0 calc(2px + var(--glass-lift) * 4px) calc(8px + var(--glass-lift) * 10px) rgba(255, 251, 242, calc(0.45 * var(--glass-lift)))`
    );

    // 3. Animasi Scroll Kartu
    root.dataset.txScrollAnim = settings.txScrollAnim;
    root.style.setProperty('--tx-anim-dur', `${settings.txAnimDur}s`);
  }, [settings, isLocalhost]);

  // Keyboard shortcut (Alt + T) untuk toggle panel saat di desktop localhost
  useEffect(() => {
    if (!isLocalhost) return;
    const handleKeyDown = (e) => {
      if (e.altKey && (e.key === 't' || e.key === 'T')) {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLocalhost]);

  if (!isLocalhost) return null;

  const update = (field, value) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
    setSaveStatus('');
  };

  // Tombol SAVE eksplisit agar tersimpan kuat di localStorage
  const _handleSelectClearVariant = (variant) => {
    update('clearVariant', variant.id);
    update('backdropFilter', variant.filterUrl);
    document.documentElement.style.setProperty('--nav-glass-backdrop', variant.filterUrl);
    document.documentElement.dataset.clearVariant = variant.id;
    showToast(`✨ Varian Clear "${variant.label}" aktif! ${variant.desc}`);
  };

  const _handleApplyBlurEffect = (eff) => {
    setSettings((prev) => ({
      ...prev,
      blurEffectId: eff.id,
      blur: eff.blur,
      backdropFilter: eff.backdropFilter,
      bgOpacity: eff.bgOpacity,
      bgColor: eff.bgColor,
      sheenColor: eff.sheenColor,
      sheenOpacity: eff.sheenOpacity,
      in1Color: eff.in1Color,
      in1X: eff.in1X,
      in1Y: eff.in1Y,
      in1Blur: eff.in1Blur,
      in1Op: eff.in1Op,
      in2Color: eff.in2Color,
      in2X: eff.in2X,
      in2Y: eff.in2Y,
      in2Blur: eff.in2Blur,
      in2Op: eff.in2Op,
      in3Color: eff.in3Color,
      in3Blur: eff.in3Blur,
      in3Op: eff.in3Op,
      textureSize: eff.textureSize,
      textureOpacity: eff.textureOpacity,
      outerShadowOp: eff.outerShadowOp,
      outerShadowBlur: eff.outerShadowBlur,
    }));
    document.documentElement.dataset.blurEffect = eff.id;
    document.documentElement.style.setProperty('--nav-glass-backdrop', eff.backdropFilter);
    showToast(`✨ Efek "${eff.label}" aktif! ${eff.summary}`);
  };

  const handleSelectContainerStyle = (c) => {
    setSettings((prev) => ({
      ...prev,
      containerStyleId: c.id,
      bgColor: c.bgColor,
      bgOpacity: c.bgOpacity,
      sheenOpacity: c.sheenOpacity,
      textureOpacity: c.textureOpacity,
    }));
    document.documentElement.dataset.containerStyle = c.id;
    showToast(`✨ Material Wadah "${c.label}" aktif! ${c.desc}`);
  };

  const handleSelectBackdropEffect = (b) => {
    setSettings((prev) => ({
      ...prev,
      backdropEffectId: b.id,
    }));
    document.documentElement.dataset.blurEffect = b.id;
    showToast(`✨ Efek Latar "${b.label}" aktif! ${b.desc}`);
  };

  const handleSaveSettings = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      // Terapkan animasi kartu dan dataset ke root secara sinkron
      if (settings.txScrollAnim) {
        document.documentElement.dataset.txScrollAnim = settings.txScrollAnim;
        window.dispatchEvent(new CustomEvent('cassiel:apply-tx-anim'));
      }
      setSaveStatus('✅ Tersimpan!');
      showToast('Pengaturan berhasil disimpan secara permanen!');
      setTimeout(() => setSaveStatus(''), 3000);
    } catch {
      showToast('Gagal menyimpan ke localStorage');
    }
  };

  // Terapkan Animasi Kartu secara langsung ke halaman
  const handleApplyAnim = (animId) => {
    const idToApply = animId || settings.txScrollAnim;
    setSettings((prev) => ({ ...prev, txScrollAnim: idToApply }));
    document.documentElement.dataset.txScrollAnim = idToApply;
    document.documentElement.style.setProperty('--tx-anim-dur', `${settings.txAnimDur}s`);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...settings, txScrollAnim: idToApply }));
    } catch {
      // ignore
    }
    window.dispatchEvent(new CustomEvent('cassiel:apply-tx-anim'));
    const opt = SCROLL_ANIM_OPTIONS.find((o) => o.id === idToApply);
    showToast(`✨ Animasi "${opt?.name || idToApply}" diterapkan! Coba scroll sekarang.`);
  };

  const handleReset = () => {
    if (window.confirm('Kembalikan seluruh pengaturan ke default rekomendasi?')) {
      setSettings(DEFAULT_VALUES);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_VALUES));
      } catch {
        // ignore
      }
      setSaveStatus('✅ Direset!');
      showToast('Pengaturan telah direset ke default');
      setTimeout(() => setSaveStatus(''), 2500);
    }
  };

  // Helper nama warna sederhana
  const getColorName = (hex) => {
    if (!hex) return 'Putih';
    const h = hex.toUpperCase();
    if (h === '#FFFFFF') return 'Putih';
    if (h === '#000000') return 'Hitam';
    if (h === '#D97706' || h === '#F59E0B') return 'Oranye Amber';
    if (h === '#0F172A' || h === '#1E293B') return 'Biru Gelap Obsidian';
    if (h === '#064E3B') return 'Hijau Emerald';
    if (h === '#3B0764') return 'Ungu Royal';
    if (h === '#FFFBEB' || h === '#FDFBF7') return 'Krem Hangat / Gading';
    return h;
  };

  // Generate teks ringkasan pengaturan dalam bahasa Indonesia biasa tanpa rumus / simbol rumit
  const generateCleanCss = () => {
    const curContainer = CONTAINER_STYLES.find((c) => c.id === settings.containerStyleId) || CONTAINER_STYLES[0];
    const curBackdrop = BACKDROP_EFFECTS.find((b) => b.id === settings.backdropEffectId) || BACKDROP_EFFECTS[0];
    const curAnim = SCROLL_ANIM_OPTIONS.find((a) => a.id === settings.txScrollAnim) || SCROLL_ANIM_OPTIONS[0];

    return `=== RINGKASAN SETELAN MENUBAR CASSIEL ===

1. MATERIAL KONTAINER KACA:
- Jenis Bahan: ${curContainer.label} (${curContainer.desc})
- Warna Utama: ${getColorName(settings.bgColor)} (${settings.bgColor})
- Transparansi / Opacity: ${settings.bgOpacity}%
- Background Blur: ${settings.blur}px
- Tekstur Noise: Ukuran ${settings.textureSize}px, Kepekatan ${settings.textureOpacity}%

2. EFEK REFRAKSI & BLUR LATAR:
- Efek Terpilih: ${curBackdrop.label} (${curBackdrop.desc})
- Deskripsi Efek: ${curBackdrop.summary}

3. KILAU & BAYANGAN DALAM (INNER SHADOW):
- Kilau Atas (Sheen): Warna ${getColorName(settings.sheenColor)}, Opacity ${settings.sheenOpacity}%
- Inner 1 (Sudut Kiri-Atas): Geser X ${settings.in1X}px, Geser Y ${settings.in1Y}px, Blur ${settings.in1Blur}px, Opacity ${settings.in1Op}%, Warna ${getColorName(settings.in1Color)}
- Inner 2 (Sudut Kanan-Bawah): Geser X ${settings.in2X}px, Geser Y ${settings.in2Y}px, Blur ${settings.in2Blur}px, Opacity ${settings.in2Op}%, Warna ${getColorName(settings.in2Color)}
- Inner 3 (Glow Keliling): Blur ${settings.in3Blur}px, Opacity ${settings.in3Op}%, Warna ${getColorName(settings.in3Color)}
- Bayangan Luar (Drop Shadow): Blur ${settings.outerShadowBlur}px, Opacity ${settings.outerShadowOp}%

4. BALON KACA AKTIF (BUBBLE):
- Warna Balon: ${getColorName(settings.bubbleBgColor)}, Opacity ${settings.bubbleBgOpacity}%
- Keburaman Balon: ${settings.bubbleBlur}px
- Garis Sabit Kilau: Opacity ${settings.bubbleCrescentOp}%

5. ANIMASI GULIR KARTU TRANSAKSI:
- Nama Animasi: ${curAnim.name}
- Durasi: ${settings.txAnimDur} detik
`;
  };

  const handleCopyCss = async () => {
    const cssCode = generateCleanCss();
    try {
      await navigator.clipboard.writeText(cssCode);
      showToast('Ringkasan pengaturan berhasil disalin ke Clipboard!');
    } catch {
      showToast('Gagal menyalin CSS');
    }
  };

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 2500);
  };

  // Drag handler untuk memindahkan panel kontrol di layar
  const handlePointerDown = (e) => {
    isDraggingRef.current = true;
    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialX: panelPos.x,
      initialY: panelPos.y,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e) => {
    if (!isDraggingRef.current) return;
    const dx = e.clientX - dragStartRef.current.startX;
    const dy = e.clientY - dragStartRef.current.startY;
    setPanelPos({
      x: Math.max(8, Math.min(window.innerWidth - 320, dragStartRef.current.initialX + dx)),
      y: Math.max(8, Math.min(window.innerHeight - 100, dragStartRef.current.initialY + dy)),
    });
  };

  const handlePointerUp = () => {
    isDraggingRef.current = false;
  };



  return (
    <>
      {/* Toast Alert */}
      {toastMsg && <div className="tuner-toast">{toastMsg}</div>}

      {/* Floating Pill Trigger saat panel diminimize */}
      {!isOpen && (
        <button
          type="button"
          className="tuner-floating-pill"
          style={{ left: `${panelPos.x}px`, top: `${panelPos.y}px` }}
          onClick={() => setIsOpen(true)}
          title="Buka Tuner Kaca Menubar & Kartu"
        >
          <span className="tuner-pill-icon">🎛️</span>
          <span className="tuner-pill-text">Tuner Visual</span>
        </button>
      )}

      {/* Panel Utama (Clean White Theme) */}
      {isOpen && (
        <div
          className="tuner-panel-window"
          style={{ left: `${panelPos.x}px`, top: `${panelPos.y}px` }}
        >
          {/* Header Draggable */}
          <div
            className="tuner-header"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
          >
            <div className="tuner-title-group">
              <span className="tuner-drag-handle">⠿</span>
              <h3 className="tuner-title">Tuning Visual</h3>
              <span className="tuner-badge">LOCALHOST</span>
            </div>
            <button
              type="button"
              className="tuner-close-btn"
              onClick={() => setIsOpen(false)}
              title="Tutup Panel"
            >
              ✕
            </button>
          </div>

          {/* DROPDOWN SELECTOR: Wadah Menubar / Balon Kaca Oval / Animasi Kartu */}
          <div className="tuner-tab-dropdown-wrapper">
            <label className="tuner-dropdown-label">PILIH TARGET SETTING:</label>
            <select
              className="tuner-mode-select"
              value={activeTab}
              onChange={(e) => setActiveTab(e.target.value)}
            >
              <option value="menubar">🔲 Wadah Menubar & Pop-up Teks Cepat</option>
              <option value="bubble">🫧 Balon Kaca Oval (Bubble Glass)</option>
              <option value="tx_anim">🃏 Animasi Scroll Kartu (5 Pilihan)</option>
            </select>
          </div>

          {/* Konten Scrollable */}
          <div className="tuner-content">
            {/* ============================================================== */}
            {/* TAB 1: WADAH MENUBAR (CONTAINER GLASS)                         */}
            {/* ============================================================== */}
            {activeTab === 'menubar' && (
              <>
                {/* 1. Warna Menubar & Opacity */}
                <div className="tuner-section-card">
                  <div className="tuner-section-header">
                    <h4>WARNA & OPACITY MENUBAR</h4>
                    <span className="tuner-sub-tag">BASE TINT</span>
                  </div>

                  <div className="tuner-color-row">
                    <span className="tuner-label">Warna Utama</span>
                    <span className="tuner-hex-display">{settings.bgColor}</span>
                    <input
                      type="color"
                      className="tuner-color-picker"
                      value={settings.bgColor}
                      onChange={(e) => update('bgColor', e.target.value)}
                    />
                  </div>

                  {/* Preset Colors */}
                  <div className="tuner-presets-row">
                    {PRESET_COLORS.map((p) => (
                      <button
                        key={p.name}
                        type="button"
                        className={`tuner-preset-swatch ${settings.bgColor.toLowerCase() === p.hex.toLowerCase() ? 'active' : ''}`}
                        style={{ backgroundColor: p.hex }}
                        onClick={() => update('bgColor', p.hex)}
                        title={p.name}
                      />
                    ))}
                  </div>

                  <div className="tuner-control-row">
                    <span className="tuner-label">Opacity Warna</span>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={settings.bgOpacity}
                      onChange={(e) => update('bgOpacity', Number(e.target.value))}
                    />
                    <span className="tuner-val">{settings.bgOpacity}%</span>
                  </div>

                  <div className="tuner-control-row">
                    <span className="tuner-label">Background Blur</span>
                    <input
                      type="range"
                      min="0"
                      max="30"
                      value={settings.blur}
                      onChange={(e) => update('blur', Number(e.target.value))}
                    />
                    <span className="tuner-val">{settings.blur}px</span>
                  </div>

                  {/* 1. SEKSI A: PILIHAN MATERIAL KONTAINER (TERPISAH) */}
                  <div className="tuner-modular-block">
                    <div className="tuner-gloss-header">
                      <span className="tuner-gloss-title">1. MATERIAL KONTAINER KACA</span>
                      <span className="tuner-sub-tag">WADAH</span>
                    </div>
                    <p className="tuner-gloss-subtitle">
                      Pilih bahan kaca: Bening murni (clear), Putih semi-transparan (Figma), Gelap (Obsidian), atau Gading.
                    </p>
                    <div className="tuner-container-styles-grid">
                      {CONTAINER_STYLES.map((c) => {
                        const isMatch = (settings.containerStyleId || 'clear') === c.id;
                        return (
                          <button
                            key={c.id}
                            type="button"
                            className={`tuner-container-style-card ${isMatch ? 'active' : ''}`}
                            onClick={() => handleSelectContainerStyle(c)}
                          >
                            <span className="tuner-container-icon">{c.icon}</span>
                            <span className="tuner-container-name">{c.label}</span>
                            <span className="tuner-container-tag">{c.desc}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 2. SEKSI B: PILIHAN EFEK REFRAKSI & BLUR LATAR (TERPISAH) */}
                  <div className="tuner-modular-block" style={{ marginTop: '14px' }}>
                    <div className="tuner-gloss-header">
                      <span className="tuner-gloss-title">2. EFEK REFRAKSI & BLUR LATAR</span>
                      <span className="tuner-sub-tag">LATAR BELAKANG</span>
                    </div>
                    <p className="tuner-gloss-subtitle">
                      Pilih bagaimana latar di balik kaca bereaksi: melengkung riak cair, kaca garis moru, lensa cembung, atau blur datar.
                    </p>
                    <div className="tuner-backdrop-effects-grid">
                      {BACKDROP_EFFECTS.map((b) => {
                        const isMatch = (settings.backdropEffectId || 'wave') === b.id;
                        return (
                          <button
                            key={b.id}
                            type="button"
                            className={`tuner-backdrop-card ${isMatch ? 'active' : ''}`}
                            onClick={() => handleSelectBackdropEffect(b)}
                            title={b.summary}
                          >
                            <span className="tuner-backdrop-icon">{b.icon}</span>
                            <span className="tuner-backdrop-name">{b.label}</span>
                            <span className="tuner-backdrop-desc">{b.desc}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* 2. Kilau Sheen Atas */}
                <div className="tuner-section-card">
                  <div className="tuner-section-header">
                    <h4>KILAU SHEEN ATAS</h4>
                    <span className="tuner-sub-tag">GLEAM</span>
                  </div>
                  <div className="tuner-color-row">
                    <span className="tuner-label">Warna Kilau</span>
                    <span className="tuner-hex-display">{settings.sheenColor}</span>
                    <input
                      type="color"
                      className="tuner-color-picker"
                      value={settings.sheenColor}
                      onChange={(e) => update('sheenColor', e.target.value)}
                    />
                  </div>
                  <div className="tuner-control-row">
                    <span className="tuner-label">Opacity Kilau</span>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={settings.sheenOpacity}
                      onChange={(e) => update('sheenOpacity', Number(e.target.value))}
                    />
                    <span className="tuner-val">{settings.sheenOpacity}%</span>
                  </div>
                </div>

                {/* 3. Inner 1 (Atas & Samping Kiri) */}
                <div className="tuner-section-card">
                  <div className="tuner-section-header">
                    <h4>INNER 1 (ATAS & SAMPING KIRI)</h4>
                    <span className="tuner-sub-tag">KEY SPECULAR</span>
                  </div>
                  <div className="tuner-color-row">
                    <span className="tuner-label">Warna Bayangan</span>
                    <span className="tuner-hex-display">{settings.in1Color}</span>
                    <input
                      type="color"
                      className="tuner-color-picker"
                      value={settings.in1Color}
                      onChange={(e) => update('in1Color', e.target.value)}
                    />
                  </div>
                  <div className="tuner-control-row">
                    <span className="tuner-label">Posisi X (Samping)</span>
                    <input
                      type="range"
                      min="-10"
                      max="10"
                      value={settings.in1X}
                      onChange={(e) => update('in1X', Number(e.target.value))}
                    />
                    <span className="tuner-val">{settings.in1X}px</span>
                  </div>
                  <div className="tuner-control-row">
                    <span className="tuner-label">Posisi Y (Atas)</span>
                    <input
                      type="range"
                      min="-10"
                      max="10"
                      value={settings.in1Y}
                      onChange={(e) => update('in1Y', Number(e.target.value))}
                    />
                    <span className="tuner-val">{settings.in1Y}px</span>
                  </div>
                  <div className="tuner-control-row">
                    <span className="tuner-label">Blur</span>
                    <input
                      type="range"
                      min="0"
                      max="15"
                      value={settings.in1Blur}
                      onChange={(e) => update('in1Blur', Number(e.target.value))}
                    />
                    <span className="tuner-val">{settings.in1Blur}px</span>
                  </div>
                  <div className="tuner-control-row">
                    <span className="tuner-label">Opacity</span>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={settings.in1Op}
                      onChange={(e) => update('in1Op', Number(e.target.value))}
                    />
                    <span className="tuner-val">{settings.in1Op}%</span>
                  </div>
                </div>

                {/* 4. Inner 2 (Bawah & Samping Kanan) */}
                <div className="tuner-section-card">
                  <div className="tuner-section-header">
                    <h4>INNER 2 (BAWAH & SAMPING KANAN)</h4>
                    <span className="tuner-sub-tag">COUNTER REFLEX</span>
                  </div>
                  <div className="tuner-color-row">
                    <span className="tuner-label">Warna Bayangan</span>
                    <span className="tuner-hex-display">{settings.in2Color}</span>
                    <input
                      type="color"
                      className="tuner-color-picker"
                      value={settings.in2Color}
                      onChange={(e) => update('in2Color', e.target.value)}
                    />
                  </div>
                  <div className="tuner-control-row">
                    <span className="tuner-label">Posisi X (Samping)</span>
                    <input
                      type="range"
                      min="-10"
                      max="10"
                      value={settings.in2X}
                      onChange={(e) => update('in2X', Number(e.target.value))}
                    />
                    <span className="tuner-val">{settings.in2X}px</span>
                  </div>
                  <div className="tuner-control-row">
                    <span className="tuner-label">Posisi Y (Bawah)</span>
                    <input
                      type="range"
                      min="-10"
                      max="10"
                      value={settings.in2Y}
                      onChange={(e) => update('in2Y', Number(e.target.value))}
                    />
                    <span className="tuner-val">{settings.in2Y}px</span>
                  </div>
                  <div className="tuner-control-row">
                    <span className="tuner-label">Blur</span>
                    <input
                      type="range"
                      min="0"
                      max="15"
                      value={settings.in2Blur}
                      onChange={(e) => update('in2Blur', Number(e.target.value))}
                    />
                    <span className="tuner-val">{settings.in2Blur}px</span>
                  </div>
                  <div className="tuner-control-row">
                    <span className="tuner-label">Opacity</span>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={settings.in2Op}
                      onChange={(e) => update('in2Op', Number(e.target.value))}
                    />
                    <span className="tuner-val">{settings.in2Op}%</span>
                  </div>
                </div>

                {/* 5. Inner 3 (Glow Keliling) */}
                <div className="tuner-section-card">
                  <div className="tuner-section-header">
                    <h4>INNER 3 (GLOW KELILING)</h4>
                    <span className="tuner-sub-tag">PERIMETER</span>
                  </div>
                  <div className="tuner-color-row">
                    <span className="tuner-label">Warna Glow</span>
                    <span className="tuner-hex-display">{settings.in3Color}</span>
                    <input
                      type="color"
                      className="tuner-color-picker"
                      value={settings.in3Color}
                      onChange={(e) => update('in3Color', e.target.value)}
                    />
                  </div>
                  <div className="tuner-control-row">
                    <span className="tuner-label">Blur</span>
                    <input
                      type="range"
                      min="0"
                      max="30"
                      value={settings.in3Blur}
                      onChange={(e) => update('in3Blur', Number(e.target.value))}
                    />
                    <span className="tuner-val">{settings.in3Blur}px</span>
                  </div>
                  <div className="tuner-control-row">
                    <span className="tuner-label">Opacity</span>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={settings.in3Op}
                      onChange={(e) => update('in3Op', Number(e.target.value))}
                    />
                    <span className="tuner-val">{settings.in3Op}%</span>
                  </div>
                </div>

                {/* 6. Tekstur Micro Grain */}
                <div className="tuner-section-card">
                  <div className="tuner-section-header">
                    <h4>TEKSTUR (NOISE)</h4>
                    <span className="tuner-sub-tag">MICRO GRAIN</span>
                  </div>
                  <div className="tuner-control-row">
                    <span className="tuner-label">Kepekatan Tekstur</span>
                    <input
                      type="range"
                      min="0"
                      max="50"
                      value={settings.textureOpacity}
                      onChange={(e) => update('textureOpacity', Number(e.target.value))}
                    />
                    <span className="tuner-val">{settings.textureOpacity}%</span>
                  </div>
                  <div className="tuner-control-row">
                    <span className="tuner-label">Ukuran Tekstur</span>
                    <input
                      type="range"
                      min="30"
                      max="180"
                      step="10"
                      value={settings.textureSize}
                      onChange={(e) => update('textureSize', Number(e.target.value))}
                    />
                    <span className="tuner-val">{settings.textureSize}px</span>
                  </div>
                </div>

                {/* 7. Bayangan Luar Halus (Subtle Elevation) */}
                <div className="tuner-section-card">
                  <div className="tuner-section-header">
                    <h4>BAYANGAN LUAR ELEVASI</h4>
                    <span className="tuner-sub-tag">SOFT AMBIENT</span>
                  </div>
                  <div className="tuner-control-row">
                    <span className="tuner-label">Kepekatan Bayangan</span>
                    <input
                      type="range"
                      min="0"
                      max="30"
                      value={settings.outerShadowOp ?? 8}
                      onChange={(e) => update('outerShadowOp', Number(e.target.value))}
                    />
                    <span className="tuner-val">{settings.outerShadowOp ?? 8}%</span>
                  </div>
                  <div className="tuner-control-row">
                    <span className="tuner-label">Blur Bayangan</span>
                    <input
                      type="range"
                      min="4"
                      max="35"
                      value={settings.outerShadowBlur ?? 18}
                      onChange={(e) => update('outerShadowBlur', Number(e.target.value))}
                    />
                    <span className="tuner-val">{settings.outerShadowBlur ?? 18}px</span>
                  </div>
                </div>
              </>
            )}

            {/* ============================================================== */}
            {/* TAB 2: BALON KACA OVAL (BUBBLE GLASS)                          */}
            {/* ============================================================== */}
            {activeTab === 'bubble' && (
              <>
                <div className="tuner-section-card">
                  <div className="tuner-section-header">
                    <h4>WARNA & BLUR BALON OVAL</h4>
                    <span className="tuner-sub-tag">BUBBLE CORE</span>
                  </div>
                  <div className="tuner-color-row">
                    <span className="tuner-label">Warna Bodi</span>
                    <span className="tuner-hex-display">{settings.bubbleBgColor}</span>
                    <input
                      type="color"
                      className="tuner-color-picker"
                      value={settings.bubbleBgColor}
                      onChange={(e) => update('bubbleBgColor', e.target.value)}
                    />
                  </div>
                  <div className="tuner-control-row">
                    <span className="tuner-label">Opacity Bodi Kaca</span>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={settings.bubbleBgOpacity}
                      onChange={(e) => update('bubbleBgOpacity', Number(e.target.value))}
                    />
                    <span className="tuner-val">{settings.bubbleBgOpacity}%</span>
                  </div>
                  <div className="tuner-control-row">
                    <span className="tuner-label">Backdrop Blur Balon</span>
                    <input
                      type="range"
                      min="0"
                      max="40"
                      value={settings.bubbleBlur}
                      onChange={(e) => update('bubbleBlur', Number(e.target.value))}
                    />
                    <span className="tuner-val">{settings.bubbleBlur}px</span>
                  </div>
                </div>

                {/* Inner Highlight Atas Balon */}
                <div className="tuner-section-card">
                  <div className="tuner-section-header">
                    <h4>INNER SPECULAR ATAS BALON</h4>
                    <span className="tuner-sub-tag">APEX RIM</span>
                  </div>
                  <div className="tuner-color-row">
                    <span className="tuner-label">Warna Rim Atas</span>
                    <span className="tuner-hex-display">{settings.bubbleIn1Color}</span>
                    <input
                      type="color"
                      className="tuner-color-picker"
                      value={settings.bubbleIn1Color}
                      onChange={(e) => update('bubbleIn1Color', e.target.value)}
                    />
                  </div>
                  <div className="tuner-control-row">
                    <span className="tuner-label">Posisi Y (Tinggi)</span>
                    <input
                      type="range"
                      min="-5"
                      max="10"
                      step="0.5"
                      value={settings.bubbleIn1Y}
                      onChange={(e) => update('bubbleIn1Y', Number(e.target.value))}
                    />
                    <span className="tuner-val">{settings.bubbleIn1Y}px</span>
                  </div>
                  <div className="tuner-control-row">
                    <span className="tuner-label">Blur</span>
                    <input
                      type="range"
                      min="0"
                      max="10"
                      step="0.5"
                      value={settings.bubbleIn1Blur}
                      onChange={(e) => update('bubbleIn1Blur', Number(e.target.value))}
                    />
                    <span className="tuner-val">{settings.bubbleIn1Blur}px</span>
                  </div>
                  <div className="tuner-control-row">
                    <span className="tuner-label">Opacity</span>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={settings.bubbleIn1Op}
                      onChange={(e) => update('bubbleIn1Op', Number(e.target.value))}
                    />
                    <span className="tuner-val">{settings.bubbleIn1Op}%</span>
                  </div>
                </div>

                {/* Inner Counter Reflex Bawah Balon */}
                <div className="tuner-section-card">
                  <div className="tuner-section-header">
                    <h4>COUNTER REFLEX BAWAH</h4>
                    <span className="tuner-sub-tag">BASE AMBER RIM</span>
                  </div>
                  <div className="tuner-color-row">
                    <span className="tuner-label">Warna Rim Bawah</span>
                    <span className="tuner-hex-display">{settings.bubbleIn2Color}</span>
                    <input
                      type="color"
                      className="tuner-color-picker"
                      value={settings.bubbleIn2Color}
                      onChange={(e) => update('bubbleIn2Color', e.target.value)}
                    />
                  </div>
                  <div className="tuner-control-row">
                    <span className="tuner-label">Posisi Y</span>
                    <input
                      type="range"
                      min="-10"
                      max="5"
                      step="0.5"
                      value={settings.bubbleIn2Y}
                      onChange={(e) => update('bubbleIn2Y', Number(e.target.value))}
                    />
                    <span className="tuner-val">{settings.bubbleIn2Y}px</span>
                  </div>
                  <div className="tuner-control-row">
                    <span className="tuner-label">Blur</span>
                    <input
                      type="range"
                      min="0"
                      max="10"
                      step="0.5"
                      value={settings.bubbleIn2Blur}
                      onChange={(e) => update('bubbleIn2Blur', Number(e.target.value))}
                    />
                    <span className="tuner-val">{settings.bubbleIn2Blur}px</span>
                  </div>
                  <div className="tuner-control-row">
                    <span className="tuner-label">Opacity</span>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={settings.bubbleIn2Op}
                      onChange={(e) => update('bubbleIn2Op', Number(e.target.value))}
                    />
                    <span className="tuner-val">{settings.bubbleIn2Op}%</span>
                  </div>
                </div>

                {/* Puncak Sabit Kristal & Drop Shadow */}
                <div className="tuner-section-card">
                  <div className="tuner-section-header">
                    <h4>SABIT KRISTAL & BAYANGAN ELEVASI</h4>
                    <span className="tuner-sub-tag">CRESCENT & SHADOW</span>
                  </div>
                  <div className="tuner-control-row">
                    <span className="tuner-label">Puncak Sabit (Crescent)</span>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={settings.bubbleCrescentOp}
                      onChange={(e) => update('bubbleCrescentOp', Number(e.target.value))}
                    />
                    <span className="tuner-val">{settings.bubbleCrescentOp}%</span>
                  </div>
                  <div className="tuner-control-row">
                    <span className="tuner-label">Kepekatan Bayangan</span>
                    <input
                      type="range"
                      min="0"
                      max="60"
                      value={settings.bubbleShadowOp}
                      onChange={(e) => update('bubbleShadowOp', Number(e.target.value))}
                    />
                    <span className="tuner-val">{settings.bubbleShadowOp}%</span>
                  </div>
                  <div className="tuner-control-row">
                    <span className="tuner-label">Blur Bayangan</span>
                    <input
                      type="range"
                      min="2"
                      max="30"
                      value={settings.bubbleShadowBlur}
                      onChange={(e) => update('bubbleShadowBlur', Number(e.target.value))}
                    />
                    <span className="tuner-val">{settings.bubbleShadowBlur}px</span>
                  </div>
                </div>
              </>
            )}

            {/* ============================================================== */}
            {/* TAB 3: 5 PILIHAN ANIMASI KARTU TRANSAKSI SAAT SCROLL           */}
            {/* ============================================================== */}
            {activeTab === 'tx_anim' && (
              <>
                <div className="tuner-section-card">
                  <div className="tuner-section-header">
                    <h4>PILIH EFEK ANIMASI SCROLL</h4>
                    <span className="tuner-sub-tag">5 PHYSICS STYLES</span>
                  </div>

                  <p className="tuner-help-text">
                    Pilih animasi yang paling Anda sukai saat kartu transaksi muncul di layar saat di-scroll:
                  </p>

                  <div className="tuner-anim-options-list">
                    {SCROLL_ANIM_OPTIONS.map((opt) => (
                      <div
                        key={opt.id}
                        className={`tuner-anim-card ${settings.txScrollAnim === opt.id ? 'active' : ''}`}
                        onClick={() => handleApplyAnim(opt.id)}
                      >
                        <div className="tuner-anim-card-left">
                          <span className="tuner-anim-icon">{opt.icon}</span>
                          <div>
                            <span className="tuner-anim-name">{opt.name}</span>
                            <p className="tuner-anim-desc">{opt.desc}</p>
                          </div>
                        </div>
                        <span className="tuner-anim-radio">
                          {settings.txScrollAnim === opt.id ? '●' : '○'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="tuner-section-card">
                  <div className="tuner-section-header">
                    <h4>KONTROL DURASI & TERAPKAN</h4>
                    <span className="tuner-sub-tag">SPEED & APPLY</span>
                  </div>
                  <div className="tuner-control-row">
                    <span className="tuner-label">Durasi Animasi</span>
                    <input
                      type="range"
                      min="0.25"
                      max="1.20"
                      step="0.05"
                      value={settings.txAnimDur}
                      onChange={(e) => update('txAnimDur', Number(e.target.value))}
                    />
                    <span className="tuner-val">{settings.txAnimDur}s</span>
                  </div>

                  <button
                    type="button"
                    className="tuner-apply-btn"
                    onClick={() => handleApplyAnim(settings.txScrollAnim)}
                  >
                    ✨ Terapkan ke Kartu Transaksi
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Footer Action Bar: SAVE, SALIN CSS & RESET */}
          <div className="tuner-footer">
            <div className="tuner-footer-top-row">
              <button
                type="button"
                className="tuner-btn-save"
                onClick={handleSaveSettings}
              >
                💾 {saveStatus || 'Simpan Pengaturan'}
              </button>
            </div>
            <div className="tuner-footer-bottom-row">
              <button
                type="button"
                className="tuner-btn-copy"
                onClick={handleCopyCss}
              >
                📋 Salin CSS
              </button>
              <button
                type="button"
                className="tuner-btn-reset"
                onClick={handleReset}
              >
                ↺ Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

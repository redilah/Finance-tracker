import React, { useState, useEffect } from 'react';
import { isProUser, setProUser } from '../utils/proManager';
import { getSubscriptionOfferings, purchaseJusticeCassielPackage, restoreJusticePurchases } from '../utils/revenueCatManager';
import { recordUserDonationProof } from '../utils/kitabisaTransparencyManager';
import kitabisaLogo from '../assets/kitabisa_logo.png';
import airBersihGunungkidulImg from '../assets/air_bersih_gunungkidul.png';
import sedekahAirGempaNttImg from '../assets/sedekah_air_gempa_ntt.png';

// Paket Langganan Default & Fallback
const SUBSCRIPTION_PLANS = [
  {
    id: 'yearly',
    title: '1 Tahun',
    priceText: 'Rp149.000',
    numericPrice: 149000,
    periodText: '/ tahun',
    badgeTopLeft: 'BEST VALUE',
    badgeTopRight: 'Hemat 35%',
    originalPrice: 'Rp228.000',
    features: [
      'Voice AI Mic Tanpa Batas',
      'Dompet Grup Unlimited',
      'Auto-Tracker Notifikasi Tanpa Batas',
      'Ekspor Laporan Excel (.xlsx)'
    ]
  },
  {
    id: 'six_months',
    title: '6 Bulan',
    priceText: 'Rp89.000',
    numericPrice: 89000,
    periodText: '/ 6 bulan',
    badgeTopLeft: 'POPULER',
    badgeTopRight: 'Hemat Rp25.000',
    originalPrice: 'Rp114.000',
    features: [
      'Voice AI Mic Tanpa Batas',
      'Dompet Grup Unlimited',
      'Auto-Tracker Notifikasi Tanpa Batas',
      'Ekspor Laporan Excel (.xlsx)'
    ]
  },
  {
    id: 'monthly',
    title: '1 Bulan',
    priceText: 'Rp19.000',
    numericPrice: 19000,
    periodText: '/ bulan',
    badgeTopLeft: 'WORTH IT',
    badgeTopRight: null,
    originalPrice: null,
    features: [
      'Voice AI Mic Tanpa Batas',
      'Dompet Grup Unlimited',
      'Auto-Tracker Notifikasi Tanpa Batas',
      'Ekspor Laporan Excel (.xlsx)'
    ]
  }
];

// Pilihan Misi Donasi Air Bersih Kitabisa Resmi (Real Verified Water Campaigns)
const DONATION_CAUSES = [
  {
    id: 'air_bersih_gunungkidul',
    title: 'Air Bersih Untuk Gunungkidul',
    tag: 'Kitabisa Air Bersih',
    organizer: 'Tanah Air Lestari',
    targetInfo: 'Program Bantuan Air Bersih',
    image: airBersihGunungkidulImg,
    description: (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748B', display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span>📖</span>
          <span>Latar Belakang & Detail Penyaluran:</span>
        </div>
        <p style={{ margin: 0, fontWeight: '700', color: '#0F172A', lineHeight: 1.5 }}>
          Selama lebih dari 30 tahun, 60 Kepala Keluarga di Dusun Bonpon terpaksa 'bertaruh' dengan kekeringan.
        </p>
        <p style={{ margin: 0, lineHeight: 1.55 }}>
          Bagi mereka, air bersih adalah barang langka. Demi memenuhi kebutuhan harian, warga harus bergantian menyedot air dari selang kecil dari satu-satunya sumber mata air berdebit sangat rendah—harapan tipis yang harus dibagi untuk seluruh desa.
        </p>
        <p style={{ margin: 0, lineHeight: 1.55 }}>
          Kini, titik terang mulai terlihat. Yayasan Tanah Air Lestari sebelumnya telah berhasil membangun sumur air bersih di wilayah Kutugan, yang berjarak sekitar 2 kilometer dari Bonpon. Air melimpah dari Kutugan menjadi kunci jawaban atas penantian panjang warga.
        </p>
        <p style={{ margin: 0, lineHeight: 1.55 }}>
          Sebagai langkah tanggap darurat, rencana besar siap dijalankan: menyambungkan jaringan pipa sepanjang 2 kilometer dari sumur Kutugan menuju Dusun Bonpon. Pipanisasi ini akan menjadi jalur kehidupan yang mengalirkan air bersih langsung ke pemukiman, sekaligus mengakhiri krisis air tiga dekade di Bonpon.
        </p>
        <p style={{ margin: 0, lineHeight: 1.55 }}>
          Perjuangan ini bukan sekadar menyambung pipa, melainkan menyambungkan harapan dan menghadirkan kehidupan yang lebih layak bagi warga Dusun Bonpon.
        </p>
      </div>
    ),
    color: '#0284C7',
    glowColor: 'rgba(2, 132, 199, 0.22)',
    bgCard: 'linear-gradient(135deg, rgba(255, 255, 255, 0.98), rgba(240, 249, 255, 0.94))'
  },
  {
    id: 'air_bersih_gempa_ntt',
    title: 'Sedekah Air Bersih Penyintas Gempa NTT',
    tag: 'Kitabisa Air Bersih',
    organizer: 'Rumah zakat jayapura',
    targetInfo: 'Bantuan Air Bersih Gempa NTT',
    image: sedekahAirGempaNttImg,
    description: (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748B', display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span>📖</span>
          <span>Latar Belakang & Detail Penyaluran:</span>
        </div>
        <p style={{ margin: 0, fontWeight: '700', color: '#0F172A', lineHeight: 1.5 }}>
          Air Bersih Mendesak, Penyintas Gempa NTT Masih Membutuhkan Bantuan
        </p>
        <p style={{ margin: 0, lineHeight: 1.55 }}>
          Gempa bumi bermagnitudo 7,7 mengguncang wilayah Nusa Tenggara Timur pada Sabtu (15/8) pagi. Gempa berpusat di laut, sekitar 38 km timur laut Mbay, Kabupaten Nagekeo, dengan kedalaman sekitar 15 km.
        </p>
        <p style={{ margin: 0, lineHeight: 1.55 }}>
          Hingga saat ini, masih banyak penyintas yang bertahan di pengungsian dalam kondisi serba terbatas dan memprihatinkan. Mereka kehilangan tempat tinggal dan harus menjalani hari-hari di tengah situasi darurat, sementara kebutuhan dasar belum sepenuhnya terpenuhi.
        </p>
        <p style={{ margin: 0, fontWeight: '700', color: '#0F172A', lineHeight: 1.5 }}>
          Salah satu kebutuhan yang paling mendesak adalah air bersih.
        </p>
        <p style={{ margin: 0, lineHeight: 1.55 }}>
          Tanpa air yang cukup, aktivitas sederhana seperti minum, memasak, mandi, mencuci, hingga menjaga kebersihan menjadi sangat sulit. Kondisi ini juga dapat meningkatkan risiko gangguan kesehatan bagi para penyintas, terutama anak-anak, lansia, dan kelompok rentan lainnya.
        </p>
        <p style={{ margin: 0, lineHeight: 1.55 }}>
          Setiap hari yang mereka lalui di pengungsian berarti kebutuhan air bersih terus bertambah. Jangan sampai mereka harus bertahan dari bencana sekaligus kesulitan mendapatkan air untuk kebutuhan paling dasar.
        </p>
      </div>
    ),
    color: '#0D9488',
    glowColor: 'rgba(13, 148, 136, 0.22)',
    bgCard: 'linear-gradient(135deg, rgba(255, 255, 255, 0.98), rgba(240, 253, 250, 0.94))'
  }
];

export default function ProUpgradeModal({
  isOpen,
  onClose,
  triggerReason = 'general',
  onProStatusChanged
}) {
  const [step, setStep] = useState(1); // 1: Pilih Paket, 2: Pilih Misi Donasi Kitabisa
  const [selectedPlanId, setSelectedPlanId] = useState('six_months');
  const [selectedCauseId, setSelectedCauseId] = useState('air_bersih_gunungkidul');
  const [expandedCauseIds, setExpandedCauseIds] = useState({});
  const [previewImage, setPreviewImage] = useState(null);
  const [packages, setPackages] = useState([]);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setSelectedPlanId('six_months');
      getSubscriptionOfferings().then(pkgs => {
        if (Array.isArray(pkgs)) setPackages(pkgs);
      });
    }
  }, [isOpen]);

  // Handle swipe-to-back & back events (Step 2 -> Step 1 -> Close, or Close Preview Image)
  useEffect(() => {
    if (!isOpen) return;

    const handleBackAction = () => {
      if (previewImage) {
        setPreviewImage(null);
        return true;
      }
      if (step === 2) {
        setStep(1);
        return true;
      }
      onClose();
      return true;
    };

    const handleBackEvent = (e) => {
      if (previewImage) {
        setPreviewImage(null);
        if (e && e.preventDefault) e.preventDefault();
      } else if (step === 2) {
        setStep(1);
        if (e && e.preventDefault) e.preventDefault();
      } else {
        onClose();
      }
    };

    window.addEventListener('cassiel_pro_modal_back', handleBackEvent);

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

      if (startX <= 60 && deltaX >= 50 && Math.abs(deltaX) > Math.abs(deltaY) * 1.2 && duration < 550) {
        handleBackAction();
      }
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('cassiel_pro_modal_back', handleBackEvent);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isOpen, step, previewImage, onClose]);

  if (!isOpen) return null;

  const currentPlan = SUBSCRIPTION_PLANS.find(p => p.id === selectedPlanId) || SUBSCRIPTION_PLANS[1];
  const currentCause = DONATION_CAUSES.find(c => c.id === selectedCauseId) || DONATION_CAUSES[0];

  const formatRupiah = (num) => {
    return 'Rp' + Number(num || 0).toLocaleString('id-ID');
  };

  // Kalkulasi Transparansi Keuangan (Sesuai Gambar 3)
  const grossPrice = currentPlan.numericPrice;
  const playStoreCut = Math.round(grossPrice * 0.15); // Potongan Google Play Store (15%)
  const netAfterPlayStore = grossPrice - playStoreCut;
  const devShare = Math.round(netAfterPlayStore * 0.10); // Operasional Pengembang (10%)
  const donationShare = netAfterPlayStore - devShare; // Alokasi Donasi Kitabisa

  const toggleExpandCause = (causeId, e) => {
    if (e) e.stopPropagation();
    setExpandedCauseIds(prev => ({
      ...prev,
      [causeId]: !prev[causeId]
    }));
  };

  const handleNextToDonation = () => {
    setStep(2);
  };

  const handleBackToPlans = () => {
    setStep(1);
  };

  const handlePurchase = async () => {
    setIsPurchasing(true);
    try {
      let targetPkg = packages.find(p => {
        const id = (p?.product?.identifier || p?.identifier || '').toLowerCase();
        if (selectedPlanId === 'yearly') return id.includes('year') || id.includes('annual');
        if (selectedPlanId === 'six_months') return id.includes('six') || id.includes('6m') || id.includes('semi');
        return id.includes('month');
      }) || packages[0] || null;

      const res = await purchaseJusticeCassielPackage(targetPkg);
      if (res.success) {
        setProUser(true);
        if (onProStatusChanged) onProStatusChanged(true);

        // Catat bukti donasi resmi ke akun pengguna
        recordUserDonationProof({
          planId: currentPlan.id,
          planTitle: currentPlan.title,
          grossPrice: currentPlan.numericPrice,
          amountDonated: donationShare,
          causeId: currentCause.id,
          causeTitle: currentCause.title,
          causeOrganizer: currentCause.organizer,
          causeTag: currentCause.tag,
          date: new Date().toISOString()
        });

        setTimeout(() => {
          onClose();
        }, 600);
      } else if (!res.userCancelled) {
        alert(res.error || 'Layanan pembayaran Google Play sedang disiapkan atau produk belum aktif di Google Play.');
      }
    } finally {
      setIsPurchasing(false);
    }
  };

  const handleRestore = async () => {
    setIsRestoring(true);
    try {
      const res = await restoreJusticePurchases();
      if (res.success && res.isPro) {
        if (onProStatusChanged) onProStatusChanged(true);
        alert('Status langganan Justice Cassiel berhasil dipulihkan!');
        setTimeout(() => onClose(), 600);
      } else {
        alert('Tidak ditemukan transaksi langganan aktif di akun Google Play kamu.');
      }
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 10000,
        background: '#FFFDF9',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
        fontFamily: 'var(--font-body, system-ui, -apple-system, sans-serif)',
        animation: 'fadeIn 0.2s ease-out'
      }}
    >
      {/* Background Ambience Silk Mesh (Orange Amber White with Mesh Lines) */}
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
            {/* Linear gradients for flowing mesh silk ribbons */}
            <linearGradient id="amberSilkFlow1" x1="0" y1="0" x2="430" y2="420" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.28" />
              <stop offset="45%" stopColor="#FB923C" stopOpacity="0.16" />
              <stop offset="85%" stopColor="#FFF7ED" stopOpacity="0.05" />
              <stop offset="100%" stopColor="#FFFDF9" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="amberSilkFlow2" x1="430" y1="320" x2="0" y2="880" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#EA580C" stopOpacity="0.15" />
              <stop offset="50%" stopColor="#FBBF24" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#FFFDF9" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="meshLineGrad1" x1="0" y1="0" x2="430" y2="600" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#D97706" stopOpacity="0.24" />
              <stop offset="50%" stopColor="#F59E0B" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#EA580C" stopOpacity="0.05" />
            </linearGradient>
            <linearGradient id="meshLineGrad2" x1="430" y1="200" x2="0" y2="900" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.22" />
              <stop offset="60%" stopColor="#FBBF24" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
            </linearGradient>
            <filter id="meshGlowBlur" x="-20%" y="-20%" width="140%" height="140%" filterUnits="userSpaceOnUse">
              <feGaussianBlur stdDeviation="40" />
            </filter>
            <filter id="meshSoftBlur" x="-10%" y="-10%" width="120%" height="120%" filterUnits="userSpaceOnUse">
              <feGaussianBlur stdDeviation="16" />
            </filter>
          </defs>

          {/* Base Luxury Warm Canvas */}
          <rect width="100%" height="100%" fill="#FFFDF9" />

          {/* Glowing Aura Mesh Nodes (Orange Amber White) */}
          <g filter="url(#meshGlowBlur)">
            {/* Top-left deep warm Amber sun */}
            <circle cx="30" cy="140" r="200" fill="#F59E0B" fillOpacity="0.28" />
            {/* Top-right warm Golden Orange glow */}
            <circle cx="410" cy="80" r="180" fill="#FB923C" fillOpacity="0.22" />
            {/* Center-left White Radiance Highlight */}
            <circle cx="170" cy="380" r="220" fill="#FFFFFF" fillOpacity="0.80" />
            {/* Mid-left Golden Amber warmth */}
            <circle cx="40" cy="560" r="210" fill="#FBBF24" fillOpacity="0.26" />
            {/* Bottom-right Warm Tangerine glow */}
            <circle cx="390" cy="760" r="240" fill="#EA580C" fillOpacity="0.16" />
            {/* Bottom-left soft warm peach */}
            <circle cx="90" cy="900" r="190" fill="#FED7AA" fillOpacity="0.35" />
          </g>

          {/* Dynamic Silk Wave Ribbon Layers */}
          <path d="M0 0C140 120 290 60 430 210V0H0Z" fill="url(#amberSilkFlow1)" />
          <path d="M430 420C290 560 140 510 0 680V932H430V420Z" fill="url(#amberSilkFlow2)" />

          {/* Organic Topological Mesh Wave Lines ("Garis Mesh" Ambient Glow) */}
          <g filter="url(#meshSoftBlur)" opacity="0.65">
            <path d="M-20 180 C120 90, 260 260, 450 140" stroke="url(#meshLineGrad1)" strokeWidth="3" fill="none" />
            <path d="M-30 320 C140 240, 280 410, 460 290" stroke="url(#meshLineGrad1)" strokeWidth="2.5" fill="none" />
            <path d="M-10 480 C150 390, 290 560, 450 460" stroke="url(#meshLineGrad2)" strokeWidth="2.5" fill="none" />
            <path d="M-20 660 C130 570, 270 740, 450 630" stroke="url(#meshLineGrad2)" strokeWidth="3" fill="none" />
          </g>

          {/* Fine Crisp Mesh Contour Lines */}
          <g opacity="0.5">
            <path d="M-20 180 C120 90, 260 260, 450 140" stroke="url(#meshLineGrad1)" strokeWidth="1.2" fill="none" />
            <path d="M-30 320 C140 240, 280 410, 460 290" stroke="url(#meshLineGrad1)" strokeWidth="1" strokeDasharray="6 4" fill="none" />
            <path d="M-10 480 C150 390, 290 560, 450 460" stroke="url(#meshLineGrad2)" strokeWidth="1" strokeDasharray="8 5" fill="none" />
            <path d="M-20 660 C130 570, 270 740, 450 630" stroke="url(#meshLineGrad2)" strokeWidth="1.2" fill="none" />
            <path d="M-20 820 C140 730, 280 900, 450 800" stroke="url(#meshLineGrad2)" strokeWidth="1" strokeDasharray="6 4" fill="none" />

            {/* Subtle Cross Isometric Grid Mesh Accents */}
            <path d="M60 -20 C100 240, 70 540, 130 950" stroke="rgba(245, 158, 11, 0.09)" strokeWidth="0.8" fill="none" />
            <path d="M210 -20 C240 260, 210 570, 260 950" stroke="rgba(245, 158, 11, 0.09)" strokeWidth="0.8" fill="none" />
            <path d="M360 -20 C380 250, 350 560, 400 950" stroke="rgba(245, 158, 11, 0.09)" strokeWidth="0.8" fill="none" />
          </g>
        </svg>
      </div>

      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '430px',
          minHeight: '100vh',
          padding: 'calc(env(safe-area-inset-top, 0px) + 16px) 20px calc(env(safe-area-inset-bottom, 0px) + 32px)',
          boxSizing: 'border-box',
          background: 'transparent',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 1
        }}
      >
        {/* Top Bar: Navigation & Step Indicator */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '18px',
            position: 'relative',
            zIndex: 3
          }}
        >
          <button
            type="button"
            onClick={step === 2 ? handleBackToPlans : onClose}
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
            aria-label={step === 2 ? 'Kembali ke Pilihan Paket' : 'Tutup'}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              {step === 2 ? (
                <path d="M15 18l-6-6 6-6" />
              ) : (
                <path d="M15 18l-6-6 6-6" />
              )}
            </svg>
          </button>

          {/* Step Dots & Progress Label Capsule */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: '#FFFFFF',
              padding: '5px 14px',
              borderRadius: '999px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
            }}
          >
            <span
              style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                background: '#D97706',
                transition: 'all 0.3s ease'
              }}
            />
            <span
              style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                background: step === 2 ? '#D97706' : '#E5E7EB',
                transition: 'all 0.3s ease'
              }}
            />
            <span
              style={{
                fontSize: '11.5px',
                fontWeight: '700',
                color: '#4B5563',
                marginLeft: '2px'
              }}
            >
              {step === 1 ? 'Langkah 1/2' : 'Langkah 2/2'}
            </span>
          </div>

          <button
            type="button"
            onClick={handleRestore}
            disabled={isRestoring}
            style={{
              background: 'transparent',
              border: 'none',
              padding: '6px 10px',
              fontSize: '12px',
              fontWeight: '700',
              color: '#8A5D3B',
              cursor: isRestoring ? 'not-allowed' : 'pointer',
              letterSpacing: '0.2px'
            }}
          >
            {isRestoring ? 'Memulihkan...' : 'Pulihkan'}
          </button>
        </div>

        {/* STEP 1: PILIH PAKET LANGGANAN */}
        {step === 1 && (
          <>
            {/* Header Section */}
            <div style={{ textAlign: 'center', margin: '4px 0 22px' }}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 16px',
                borderRadius: '999px',
                background: 'rgba(254, 243, 199, 0.85)',
                color: '#D97706',
                fontSize: '11px',
                fontWeight: '800',
                letterSpacing: '0.4px',
                marginBottom: '10px'
              }}>
                <span style={{ fontSize: '13px' }}>✨</span>
                <span style={{ color: '#D97706' }}>LANGGANAN BERKAH & BERBAGI</span>
              </div>
              <h2
                style={{
                  margin: '0 0 8px',
                  fontSize: '22px',
                  fontWeight: '800',
                  color: '#1F2937',
                  letterSpacing: '-0.3px'
                }}
              >
                Pilih Paket Justice Cassiel
              </h2>
              <p
                style={{
                  margin: '0 auto',
                  maxWidth: '340px',
                  fontSize: '13px',
                  color: '#6B7280',
                  lineHeight: 1.45
                }}
              >
                Seluruh fitur premium aktif tanpa batas & sebagian besar hasil disalurkan ke donasi Kitabisa.
              </p>
            </div>

            {/* Subscription Plan Cards List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '16px' }}>
              {SUBSCRIPTION_PLANS.map(plan => {
                const isSelected = selectedPlanId === plan.id;

                return (
                  <div
                    key={plan.id}
                    onClick={() => setSelectedPlanId(plan.id)}
                    style={{
                      position: 'relative',
                      background: '#FFFFFF',
                      borderRadius: '22px',
                      padding: '20px 18px 18px',
                      border: isSelected
                        ? '2.5px solid #E65100'
                        : '2.5px solid transparent',
                      boxShadow: isSelected
                        ? '0 4px 18px rgba(230, 81, 0, 0.08)'
                        : '0 4px 16px rgba(0, 0, 0, 0.03)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {/* Top Badge (BEST VALUE / POPULER / WORTH IT) */}
                    {plan.badgeTopLeft && (
                      <div
                        style={{
                          position: 'absolute',
                          top: '-11px',
                          left: '16px',
                          background: '#E65100',
                          color: '#FFFFFF',
                          fontSize: '11px',
                          fontWeight: '800',
                          padding: '4px 12px',
                          borderRadius: '8px',
                          letterSpacing: '0.4px',
                          textTransform: 'uppercase'
                        }}
                      >
                        {plan.badgeTopLeft}
                      </div>
                    )}

                    {/* Top Row: Title on Left, Radio Button on Right */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: plan.badgeTopLeft ? '2px' : '0', marginBottom: '4px' }}>
                      <div style={{ fontSize: '18px', fontWeight: '800', color: '#1F2937' }}>
                        {plan.title}
                      </div>

                      {/* Custom Radio Button at Top Right (above Hemat badge) */}
                      <div
                        style={{
                          width: '22px',
                          height: '22px',
                          borderRadius: '50%',
                          background: isSelected ? '#E65100' : '#E5E7EB',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          transition: 'all 0.15s ease'
                        }}
                      >
                        {isSelected && (
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </div>
                    </div>

                    {/* Second Row: Price on Left, Hemat & Strikethrough on Right */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                        <span style={{ fontSize: '24px', fontWeight: '800', color: '#E65100' }}>
                          {plan.priceText}
                        </span>
                        <span style={{ fontSize: '14px', color: '#4B5563', fontWeight: '600' }}>
                          {plan.periodText}
                        </span>
                      </div>

                      {/* Discount Badge stacked vertically on top of Strike-through Price */}
                      {plan.badgeTopRight && (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
                          <span
                            style={{
                              background: '#FEECE6',
                              color: '#E65100',
                              fontSize: '11px',
                              fontWeight: '800',
                              padding: '2.5px 9px',
                              borderRadius: '6px',
                              whiteSpace: 'nowrap',
                              letterSpacing: '0.1px'
                            }}
                          >
                            {plan.badgeTopRight}
                          </span>
                          {plan.originalPrice && (
                            <span style={{ fontSize: '12px', color: '#94A3B8', textDecoration: 'line-through', fontWeight: '500' }}>
                              {plan.originalPrice}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Features Bullet List */}
                    <div style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {plan.features.map((feat, fIdx) => (
                        <div key={fIdx} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13.5px', fontWeight: '600', color: '#1F2937' }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#E65100" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Kitabisa Social Impact Highlight Box (Sesuai Gambar 1) */}
            <div
              style={{
                background: 'rgba(254, 243, 199, 0.65)',
                borderRadius: '18px',
                padding: '14px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '16px'
              }}
            >
              <img
                src={kitabisaLogo}
                alt="Kitabisa"
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  objectFit: 'cover',
                  flexShrink: 0
                }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '13.5px', fontWeight: '800', color: '#78350F' }}>
                  Kitabisa Social Impact
                </div>
                <div style={{ fontSize: '11.5px', color: '#92400E', lineHeight: 1.45, marginTop: '2px' }}>
                  Sebagian besar pembayaran paketmu langsung dialokasikan untuk program donasi pilihanmu.
                </div>
              </div>
            </div>

            {/* Step 1 Next Button (Sesuai Gambar 1) */}
            <button
              type="button"
              onClick={handleNextToDonation}
              style={{
                width: '100%',
                padding: '16px',
                borderRadius: '16px',
                background: 'linear-gradient(135deg, #F59E0B, #D97706)',
                color: '#FFFFFF',
                fontSize: '15px',
                fontWeight: '800',
                letterSpacing: '0.5px',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 6px 20px rgba(217, 119, 6, 0.35)',
                marginBottom: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <span>PILIH MISI KEBAIKAN</span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </>
        )}

        {/* STEP 2: PILIH MISI DONASI AIR BERSIH */}
        {step === 2 && (
          <>
            {/* Header Section */}
            <div style={{ textAlign: 'center', margin: '4px 0 18px' }}>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '7px',
                  background: '#FFFFFF',
                  padding: '6px 16px',
                  borderRadius: '999px',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                  marginBottom: '10px'
                }}
              >
                <img
                  src={kitabisaLogo}
                  alt="Kitabisa"
                  style={{ width: '18px', height: '18px', borderRadius: '4px', objectFit: 'cover' }}
                />
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: '800',
                    color: '#0284C7',
                    letterSpacing: '0.4px'
                  }}
                >
                  KITABISA CAUSE SELECTION
                </span>
              </div>
              <h2
                style={{
                  margin: '0 0 6px',
                  fontSize: '20px',
                  fontWeight: '800',
                  color: '#0F172A',
                  letterSpacing: '-0.2px'
                }}
              >
                Tentukan Misi Kebaikanmu
              </h2>
              <p
                style={{
                  margin: '0 auto',
                  maxWidth: '350px',
                  fontSize: '12.5px',
                  color: '#64748B',
                  lineHeight: 1.45
                }}
              >
                Pilih program sosial yang ingin kamu bantu lewat langganan <strong style={{ color: '#0F172A' }}>{currentPlan.title}</strong>.
              </p>
            </div>

            {/* List of Real Water Causes */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '18px' }}>
              {DONATION_CAUSES.map(cause => {
                const isSelected = selectedCauseId === cause.id;
                const isExpanded = expandedCauseIds[cause.id] || false;

                return (
                  <div
                    key={cause.id}
                    onClick={() => setSelectedCauseId(cause.id)}
                    style={{
                      position: 'relative',
                      background: '#FFFFFF',
                      borderRadius: '20px',
                      padding: '16px',
                      boxShadow: isSelected
                        ? '0 8px 20px rgba(2, 132, 199, 0.12)'
                        : '0 2px 10px rgba(0, 0, 0, 0.02)',
                      border: isSelected ? '2px solid #0284C7' : '2px solid transparent',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {/* Top Row: Photo, Title, Organizer, Radio & Expand Arrow */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '13px' }}>
                      {/* Real Campaign Thumbnail Image (Clickable for Fullscreen Preview) */}
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          setPreviewImage({
                            src: cause.image,
                            title: cause.title,
                            organizer: cause.organizer,
                            tag: cause.tag
                          });
                        }}
                        style={{
                          position: 'relative',
                          width: '56px',
                          height: '56px',
                          borderRadius: '14px',
                          overflow: 'hidden',
                          flexShrink: 0,
                          cursor: 'zoom-in',
                          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.12)'
                        }}
                        title="Klik untuk perbesar gambar"
                      >
                        <img
                          src={cause.image}
                          alt={cause.title}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                        <div
                          style={{
                            position: 'absolute',
                            bottom: '3px',
                            right: '3px',
                            background: 'rgba(0, 0, 0, 0.55)',
                            borderRadius: '4px',
                            padding: '2px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.5">
                            <polyline points="15 3 21 3 21 9" />
                            <polyline points="9 21 3 21 3 15" />
                            <line x1="21" y1="3" x2="14" y2="10" />
                            <line x1="3" y1="21" x2="14" y2="10" />
                          </svg>
                        </div>
                      </div>

                      {/* Content Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '3px' }}>
                          <span
                            style={{
                              fontSize: '9.5px',
                              fontWeight: '800',
                              color: '#0284C7',
                              background: 'rgba(2, 132, 199, 0.08)',
                              padding: '2px 8px',
                              borderRadius: '6px',
                              letterSpacing: '0.2px'
                            }}
                          >
                            {cause.tag}
                          </span>
                        </div>
                        <div style={{ fontSize: '11px', color: '#64748B', fontWeight: '600', marginBottom: '2px' }}>
                          • {cause.organizer}
                        </div>
                        <div
                          style={{
                            fontSize: '14px',
                            fontWeight: '800',
                            color: '#0F172A',
                            lineHeight: 1.3,
                            marginBottom: '2px'
                          }}
                        >
                          {cause.title}
                        </div>
                        <div style={{ fontSize: '11.5px', color: '#64748B', fontWeight: '500' }}>
                          {cause.targetInfo}
                        </div>
                      </div>

                      {/* Radio & Expand Toggle */}
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                        {/* Selected Check Button (Cyan circle with white check) or Unselected (Solid light grey circle) */}
                        <div
                          style={{
                            width: '22px',
                            height: '22px',
                            borderRadius: '50%',
                            background: isSelected ? '#0284C7' : '#E2E8F0',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          {isSelected && (
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          )}
                        </div>

                        {/* Accordion Expand Button in soft grey rounded box */}
                        <button
                          type="button"
                          onClick={(e) => toggleExpandCause(cause.id, e)}
                          style={{
                            background: '#F1F5F9',
                            border: 'none',
                            width: '26px',
                            height: '26px',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#64748B',
                            padding: 0
                          }}
                          aria-label={isExpanded ? 'Tutup Rincian' : 'Buka Rincian'}
                        >
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.6"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            style={{
                              transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                              transition: 'transform 0.25s ease'
                            }}
                          >
                            <polyline points="6 9 12 15 18 9" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    {/* EXPANDABLE REAL DESCRIPTION ACCORDION BODY */}
                    {isExpanded && (
                      <div
                        style={{
                          marginTop: '12px',
                          paddingTop: '11px',
                          borderTop: '1px dashed rgba(0, 0, 0, 0.08)',
                          fontSize: '12px',
                          color: '#475569',
                          lineHeight: 1.55
                        }}
                      >
                        {cause.description}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Financial Transparency Breakdown Card (Sesuai Gambar 3) */}
            <div
              style={{
                background: '#FFFFFF',
                borderRadius: '18px',
                padding: '16px 18px',
                marginBottom: '16px',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04)',
                border: 'none'
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '12px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '800', color: '#1E293B' }}>
                  <span>📊</span>
                  <span>Rincian Alokasi Dana</span>
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '11px',
                    fontWeight: '700',
                    color: '#0284C7',
                    background: 'rgba(2, 132, 199, 0.08)',
                    padding: '3px 8px',
                    borderRadius: '6px'
                  }}
                >
                  <img src={kitabisaLogo} alt="" style={{ width: '12px', height: '12px', borderRadius: '2px' }} />
                  <span>100% Transparan</span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12.5px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#334155' }}>
                  <span>Total Biaya Paket ({currentPlan.title})</span>
                  <span style={{ fontWeight: '800', color: '#0F172A' }}>{formatRupiah(grossPrice)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
                  <span>Potongan Google Play Store (15%)</span>
                  <span style={{ fontWeight: '700', color: '#0F172A' }}>- {formatRupiah(playStoreCut)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
                  <span>Operasional Pengembang (10%)</span>
                  <span style={{ fontWeight: '700', color: '#0F172A' }}>- {formatRupiah(devShare)}</span>
                </div>

                {/* Highlight Box Alokasi Donasi Kitabisa */}
                <div
                  style={{
                    marginTop: '6px',
                    padding: '11px 14px',
                    borderRadius: '12px',
                    background: 'rgba(2, 132, 199, 0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                    <img src={kitabisaLogo} alt="Kitabisa" style={{ width: '18px', height: '18px', borderRadius: '4px', objectFit: 'cover' }} />
                    <span style={{ fontSize: '13px', fontWeight: '800', color: '#0369A1' }}>
                      Alokasi Donasi Kitabisa
                    </span>
                  </div>
                  <span style={{ fontSize: '15px', fontWeight: '800', color: '#0284C7' }}>
                    {formatRupiah(donationShare)}
                  </span>
                </div>
              </div>

              <div
                style={{
                  fontSize: '11px',
                  color: '#64748B',
                  textAlign: 'center',
                  marginTop: '12px',
                  lineHeight: 1.45
                }}
              >
                Penyaluran resmi dilakukan berkala ke Kitabisa atas nama seluruh pengguna Cassiel.
              </div>
            </div>

            {/* Final Action CTA Button */}
            <button
              type="button"
              onClick={handlePurchase}
              disabled={isPurchasing}
              style={{
                width: '100%',
                padding: '15px 16px',
                borderRadius: '14px',
                background: 'linear-gradient(135deg, #F59E0B, #D97706)',
                color: '#FFFFFF',
                fontSize: '15px',
                fontWeight: '800',
                letterSpacing: '0.4px',
                border: 'none',
                cursor: isPurchasing ? 'not-allowed' : 'pointer',
                boxShadow: '0 6px 20px rgba(217, 119, 6, 0.35)',
                marginBottom: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              {isPurchasing ? 'Menghubungkan ke Google Play...' : 'LANJUTKAN & TUNAIKAN KEBAIKAN'}
            </button>
          </>
        )}

        {/* Footer Guarantee / Recurring Info */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            fontSize: '12px',
            fontWeight: '600',
            color: '#4B5563',
            marginBottom: '8px'
          }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
          </svg>
          <span>Penagihan resmi Google Play, batalkan kapan saja.</span>
        </div>

        {/* Legal / Terms Disclaimer */}
        <p
          style={{
            fontSize: '11.5px',
            color: '#6B7280',
            lineHeight: 1.5,
            textAlign: 'center',
            margin: '0 0 16px',
            padding: '0 10px'
          }}
        >
          Kamu akan ditagih secara otomatis pada akhir masa uji coba/periode, sesuai dengan masa berlangganan yang kamu pilih. Pembatalan dapat dilakukan dengan mudah kapan saja melalui langganan akun Google Play Store kamu.
        </p>

        {/* Extra Bottom Safe Spacer */}
        <div style={{ height: '20px', width: '100%', flexShrink: 0 }} />
      </div>

      {/* FULLSCREEN / HIGH-PRIORITY IMAGE LIGHTBOX MODAL */}
      {previewImage && (
        <div
          onClick={() => setPreviewImage(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.88)',
            zIndex: 999999,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px 16px',
            animation: 'fadeIn 0.2s ease-out'
          }}
        >
          {/* Modal Image Box (Strict Borderless UI) */}
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: '440px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              borderRadius: '20px',
              overflow: 'hidden',
              background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.96), rgba(15, 23, 42, 0.98))',
              border: 'none',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.35)'
            }}
          >
            {/* Close Button Top Right INSIDE Image */}
            <button
              type="button"
              onClick={() => setPreviewImage(null)}
              style={{
                position: 'absolute',
                top: '12px',
                right: '12px',
                width: '34px',
                height: '34px',
                borderRadius: '50%',
                background: 'rgba(0, 0, 0, 0.55)',
                border: 'none',
                color: '#FFFFFF',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 20,
                backdropFilter: 'blur(6px)',
                WebkitBackdropFilter: 'blur(6px)',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.35)',
                padding: 0
              }}
              aria-label="Tutup Preview Gambar"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>

            {/* Main Image */}
            <div
              style={{
                position: 'relative',
                width: '100%',
                maxHeight: '62vh',
                background: '#0F172A',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden'
              }}
            >
              <img
                src={previewImage.src}
                alt={previewImage.title}
                style={{
                  width: '100%',
                  height: 'auto',
                  maxHeight: '62vh',
                  objectFit: 'contain',
                  display: 'block',
                  border: 'none'
                }}
              />
            </div>

            {/* Caption & Info Header */}
            <div
              style={{
                width: '100%',
                padding: '16px 18px',
                boxSizing: 'border-box',
                background: 'rgba(255, 255, 255, 0.05)',
                border: 'none'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: '800',
                    color: '#38BDF8',
                    background: 'rgba(56, 189, 248, 0.16)',
                    padding: '2px 8px',
                    borderRadius: '6px',
                    letterSpacing: '0.3px'
                  }}
                >
                  {previewImage.tag || 'Kitabisa Air Bersih'}
                </span>
                <span style={{ fontSize: '11px', color: '#CBD5E1', fontWeight: '600' }}>
                  • {previewImage.organizer}
                </span>
              </div>
              <div
                style={{
                  fontSize: '15px',
                  fontWeight: '800',
                  color: '#FFFFFF',
                  lineHeight: 1.35
                }}
              >
                {previewImage.title}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { isProUser, setProUser } from '../utils/proManager';
import { getSubscriptionOfferings, purchaseJusticeCassielPackage, restoreJusticePurchases } from '../utils/revenueCatManager';

// Paket Langganan Default & Fallback
const SUBSCRIPTION_PLANS = [
  {
    id: 'yearly',
    title: '1 Tahun',
    priceText: 'Rp149.000',
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
    periodText: '/ bulan',
    badgeTopLeft: null,
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

export default function ProUpgradeModal({
  isOpen,
  onClose,
  triggerReason = 'general',
  onProStatusChanged
}) {
  const [isPro, setIsPro] = useState(() => isProUser());
  const [selectedPlanId, setSelectedPlanId] = useState('six_months'); // 6 Bulan sorotan default
  const [packages, setPackages] = useState([]);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsPro(isProUser());
      setSelectedPlanId('six_months');
      getSubscriptionOfferings().then(pkgs => {
        if (Array.isArray(pkgs)) setPackages(pkgs);
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handlePurchase = async () => {
    setIsPurchasing(true);
    try {
      // Cari matching RevenueCat package jika ada
      let targetPkg = packages.find(p => {
        const id = (p?.product?.identifier || p?.identifier || '').toLowerCase();
        if (selectedPlanId === 'yearly') return id.includes('year') || id.includes('annual');
        if (selectedPlanId === 'six_months') return id.includes('six') || id.includes('6m') || id.includes('semi');
        return id.includes('month');
      }) || packages[0] || null;

      const res = await purchaseJusticeCassielPackage(targetPkg);
      if (res.success) {
        setIsPro(true);
        if (onProStatusChanged) onProStatusChanged(true);
        setTimeout(() => onClose(), 800);
      } else if (!res.userCancelled) {
        alert(res.error || 'Layanan pembayaran Google Play sedang disiapkan atau produk belum aktif di konsol Google Play Store.');
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
        setIsPro(true);
        if (onProStatusChanged) onProStatusChanged(true);
        alert('Status langganan Justice Cassiel berhasil dipulihkan!');
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
        zIndex: 12000,
        background: '#FAF2EA',
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
        fontFamily: 'var(--font-body, system-ui, -apple-system, sans-serif)'
      }}
    >
      {/* Container Full Page Max Width */}
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
          position: 'relative'
        }}
      >
        {/* Top Bar with Back Button & Restore Action */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '8px'
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

        {/* Header Section: Pure Clean Text (Title & Description) */}
        <div style={{ textAlign: 'center', margin: '4px 0 22px' }}>
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
              fontSize: '13.5px',
              color: '#6B7280',
              lineHeight: 1.45
            }}
          >
            Semua paket memberikan akses penuh ke seluruh fitur premium tanpa batas.
          </p>
        </div>

        {/* Subscription Plan Cards List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '22px' }}>
          {SUBSCRIPTION_PLANS.map(plan => {
            const isSelected = selectedPlanId === plan.id;

            return (
              <div
                key={plan.id}
                onClick={() => setSelectedPlanId(plan.id)}
                style={{
                  position: 'relative',
                  background: '#FFFFFF',
                  borderRadius: '20px',
                  padding: '17px 18px 15px',
                  border: isSelected
                    ? '2.5px solid #E65100'
                    : '2.5px solid #E5E7EB',
                  boxShadow: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {/* Top Badge (BEST VALUE / POPULER) */}
                {plan.badgeTopLeft && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '-1px',
                      left: '16px',
                      background: '#E65100',
                      color: '#FFFFFF',
                      fontSize: '9.5px',
                      fontWeight: '800',
                      letterSpacing: '0.4px',
                      padding: '3.5px 9px',
                      borderBottomLeftRadius: '6px',
                      borderBottomRightRadius: '6px',
                      textTransform: 'uppercase'
                    }}
                  >
                    {plan.badgeTopLeft}
                  </div>
                )}

                {/* Top Row: Plan Title & Radio Selection Indicator */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    marginTop: plan.badgeTopLeft ? '10px' : '0',
                    marginBottom: '4px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                    <span
                      style={{
                        fontSize: '17px',
                        fontWeight: '800',
                        color: '#1F2937'
                      }}
                    >
                      {plan.title}
                    </span>
                  </div>

                  {/* Radio / Check Circle */}
                  <div
                    style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      background: isSelected ? '#E65100' : 'transparent',
                      border: isSelected ? 'none' : '1.5px solid #D1D5DB',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}
                  >
                    {isSelected && (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </div>
                </div>

                {/* Price & Savings Row */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '14px'
                  }}
                >
                  <div>
                    <span
                      style={{
                        fontSize: '19px',
                        fontWeight: '800',
                        color: '#E65100'
                      }}
                    >
                      {plan.priceText}
                    </span>
                    <span
                      style={{
                        fontSize: '13px',
                        fontWeight: '600',
                        color: '#4B5563',
                        marginLeft: '3px'
                      }}
                    >
                      {plan.periodText}
                    </span>
                  </div>

                  {/* Right Savings Tag / Strikethrough Price */}
                  {plan.badgeTopRight && (
                    <div style={{ textAlign: 'right' }}>
                      <div
                        style={{
                          display: 'inline-block',
                          background: 'rgba(230, 81, 0, 0.1)',
                          color: '#E65100',
                          padding: '2px 8px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: '700'
                        }}
                      >
                        {plan.badgeTopRight}
                      </div>
                      {plan.originalPrice && (
                        <div
                          style={{
                            fontSize: '11px',
                            color: '#9CA3AF',
                            textDecoration: 'line-through',
                            marginTop: '2px'
                          }}
                        >
                          {plan.originalPrice}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Features Checkpoints */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                  {plan.features.map((feat, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontSize: '12.5px',
                        color: '#374151',
                        fontWeight: '500'
                      }}
                    >
                      <span
                        style={{
                          color: '#E65100',
                          fontWeight: '800',
                          fontSize: '14px',
                          lineHeight: 1
                        }}
                      >
                        ✓
                      </span>
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

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
            marginBottom: '10px'
          }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#E65100" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
          </svg>
          <span>Penagihan berulang, batalkan kapan saja.</span>
        </div>

        {/* Primary Action Button: GABUNG JUSTICE CASSIEL */}
        <button
          type="button"
          onClick={handlePurchase}
          disabled={isPurchasing}
          style={{
            width: '100%',
            padding: '15px 16px',
            borderRadius: '12px',
            background: '#E65100',
            color: '#FFFFFF',
            fontSize: '15px',
            fontWeight: '800',
            letterSpacing: '0.4px',
            border: 'none',
            cursor: isPurchasing ? 'not-allowed' : 'pointer',
            boxShadow: '0 4px 16px rgba(230, 81, 0, 0.35)',
            marginBottom: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}
        >
          {isPurchasing ? 'Memproses Langganan...' : 'GABUNG JUSTICE CASSIEL'}
        </button>

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
          Kamu akan ditagih secara otomatis pada akhir masa uji coba gratismu, sesuai dengan masa berlangganan dan harga yang telah kamu pilih, kecuali jika kamu membatalkannya minimal 24 jam sebelum masa uji coba gratismu berakhir. Kamu bisa membatalkannya kapan saja di Google Play.
        </p>

        {/* Extra Bottom Safe Spacer */}
        <div style={{ height: '40px', width: '100%', flexShrink: 0 }} />
      </div>
    </div>
  );
}

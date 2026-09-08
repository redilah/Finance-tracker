/**
 * Native Google Play Billing Manager (100% Native - Tanpa Pihak Ketiga)
 * Mengelola langganan Justice Cassiel langsung via Google Play Store
 */

import { Capacitor, registerPlugin } from '@capacitor/core';
import { setProUser, isProUser } from './proManager';

// Register native Android plugin directly
const CassielNativeBilling = registerPlugin('CassielNativeBilling');

let isInitialized = false;

/**
 * Inisialisasi Native Google Play Billing saat aplikasi start
 */
export async function initNativeBilling() {
  if (!Capacitor.isNativePlatform() || isInitialized) {
    return;
  }

  try {
    isInitialized = true;
    // Cek apakah user sudah memiliki transaksi langganan aktif di Google Play
    const res = await CassielNativeBilling.checkActivePurchases();
    if (res && typeof res.isPro === 'boolean') {
      setProUser(res.isPro);
    }
  } catch (err) {
    console.warn('[NativeBilling] Init check warning:', err?.message || err);
  }
}

/**
 * Ambil daftar penawaran paket langganan langsung dari Google Play Store
 */
export async function getSubscriptionOfferings() {
  if (!Capacitor.isNativePlatform()) {
    // Fallback data untuk browser web development / preview
    return [
      {
        identifier: 'cassiel_pro_monthly',
        packageType: 'MONTHLY',
        product: {
          identifier: 'cassiel_pro_monthly',
          title: 'Cassiel Pro 1 Bulan',
          description: 'Akses penuh tanpa batas seluruh fitur premium',
          priceString: 'Rp 19.000 / bulan'
        }
      },
      {
        identifier: 'cassiel_pro_six_months',
        packageType: 'SIX_MONTH',
        product: {
          identifier: 'cassiel_pro_six_months',
          title: 'Cassiel Pro 6 Bulan',
          description: 'Akses penuh tanpa batas seluruh fitur premium',
          priceString: 'Rp 89.000 / 6 bulan'
        }
      },
      {
        identifier: 'cassiel_pro_yearly',
        packageType: 'ANNUAL',
        product: {
          identifier: 'cassiel_pro_yearly',
          title: 'Cassiel Pro 1 Tahun',
          description: 'Akses penuh tanpa batas seluruh fitur premium',
          priceString: 'Rp 149.000 / tahun'
        }
      }
    ];
  }

  try {
    const res = await CassielNativeBilling.querySubscriptionProducts();
    if (res && res.products && Array.isArray(res.products)) {
      return res.products.map(p => ({
        identifier: p.productId,
        product: {
          identifier: p.productId,
          title: p.title || p.name,
          description: p.description,
          priceString: p.formattedPrice || ''
        }
      }));
    }
    return [];
  } catch (err) {
    console.error('[NativeBilling] Query products error:', err);
    return [];
  }
}

/**
 * Memunculkan Pop-up Pembayaran Resmi Google Play Store
 */
export async function purchaseJusticeCassielPackage(targetPkgOrId) {
  if (!Capacitor.isNativePlatform()) {
    return { 
      success: false, 
      error: 'Pembayaran Google Play hanya dapat diproses langsung di aplikasi Android terinstal (bukan di browser web preview).' 
    };
  }

  const productId = typeof targetPkgOrId === 'string' 
    ? targetPkgOrId 
    : (targetPkgOrId?.identifier || targetPkgOrId?.product?.identifier);

  try {
    const res = await CassielNativeBilling.launchPurchaseFlow({ productId });
    if (res && res.success) {
      setProUser(true);
      return { success: true, purchase: res.purchase };
    }
    if (res && res.userCancelled) {
      return { success: false, userCancelled: true };
    }
    return { success: false, error: res?.message || 'Gagal memproses transaksi Google Play' };
  } catch (err) {
    if (err?.code === 'USER_CANCELED' || err?.userCancelled) {
      return { success: false, userCancelled: true };
    }
    console.error('[NativeBilling] Purchase Error:', err);
    return { success: false, error: err?.message || 'Gagal memproses transaksi Google Play' };
  }
}

/**
 * Pulihkan Pembelian (Restore Purchases) jika user ganti HP
 */
export async function restoreJusticePurchases() {
  if (!Capacitor.isNativePlatform()) {
    return { success: true, isPro: isProUser() };
  }

  try {
    const res = await CassielNativeBilling.checkActivePurchases();
    const isPro = Boolean(res && res.isPro);
    setProUser(isPro);
    return { success: true, isPro };
  } catch (err) {
    console.error('[NativeBilling] Restore Error:', err);
    return { success: false, error: err?.message || 'Gagal memulihkan langganan' };
  }
}

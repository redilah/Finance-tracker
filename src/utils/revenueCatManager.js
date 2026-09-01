/**
 * RevenueCat & Google Play In-App Purchase Manager
 * Mengelola langganan Justice Cassiel via Google Play Store
 */

import { Capacitor } from '@capacitor/core';
import { Purchases } from '@revenuecat/purchases-capacitor';
import { setProUser, isProUser } from './proManager';

// RevenueCat Public API Key (Bisa diisi saat akun RevenueCat siap, misal: 'goog_xxxx')
const REVENUECAT_PUBLIC_GOOGLE_KEY = 'goog_cassiel_public_key';
export const ENTITLEMENT_ID = 'Justice Cassiel'; // Identifier entitlement di RevenueCat

let isInitialized = false;

/**
 * Inisialisasi RevenueCat saat aplikasi start
 */
export async function initRevenueCat() {
  if (!Capacitor.isNativePlatform() || isInitialized) {
    return;
  }

  try {
    await Purchases.configure({
      apiKey: REVENUECAT_PUBLIC_GOOGLE_KEY,
      appUserID: localStorage.getItem('cassiel_user_id') || undefined
    });

    isInitialized = true;

    // Cek status langganan aktif pengguna
    const customerInfo = await Purchases.getCustomerInfo();
    checkAndUpdateEntitlement(customerInfo);

    // Listener otomatis jika Google memperbarui langganan (misal auto-renew sukses)
    Purchases.addCustomerInfoUpdateListener((info) => {
      checkAndUpdateEntitlement(info);
    });
  } catch (err) {
    console.warn('[RevenueCat] Init warning:', err?.message || err);
  }
}

/**
 * Helper untuk verifikasi apakah entitlement 'Justice Cassiel' aktif
 */
function checkAndUpdateEntitlement(customerInfo) {
  if (!customerInfo || !customerInfo.customerInfo) return;
  const entitlements = customerInfo.customerInfo.entitlements?.active || {};
  const isJusticeActive = Boolean(entitlements[ENTITLEMENT_ID] || entitlements['pro'] || entitlements['justice_cassiel']);
  setProUser(isJusticeActive);
}

/**
 * Ambil daftar penawaran paket langganan dari Google Play
 */
export async function getSubscriptionOfferings() {
  if (!Capacitor.isNativePlatform()) {
    // Mock package untuk Web/Preview browser testing
    return [
      {
        identifier: '',
        packageType: 'MONTHLY',
        product: {
          identifier: 'justice_cassiel_monthly',
          title: 'Justice Cassiel (Bulanan)',
          description: 'Akses penuh tanpa batas seluruh fitur premium',
          priceString: 'Rp 19.000 / bulan'
        }
      }
    ];
  }

  try {
    const offerings = await Purchases.getOfferings();
    if (offerings && offerings.current && offerings.current.availablePackages) {
      return offerings.current.availablePackages;
    }
    return [];
  } catch (err) {
    console.error('[RevenueCat] Get Offerings Error:', err);
    return [];
  }
}

/**
 * Memicu Bottom Sheet Pembayaran Google Pay / Google Play Subscription
 */
export async function purchaseJusticeCassielPackage(rcPackage) {
  if (!Capacitor.isNativePlatform()) {
    return { 
      success: false, 
      error: 'Pembayaran Google Play hanya dapat diproses langsung di aplikasi Android terinstal (bukan di browser web preview).' 
    };
  }

  try {
    const { customerInfo } = await Purchases.purchasePackage({ aPackage: rcPackage });
    const entitlements = customerInfo.entitlements?.active || {};
    const isJusticeActive = Boolean(entitlements[ENTITLEMENT_ID] || entitlements['pro'] || entitlements['justice_cassiel']);
    
    setProUser(isJusticeActive);
    return { success: isJusticeActive, customerInfo };
  } catch (err) {
    if (err?.code === '1' || err?.userCancelled) {
      return { success: false, userCancelled: true };
    }
    console.error('[RevenueCat] Purchase Error:', err);
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
    const { customerInfo } = await Purchases.restorePurchases();
    checkAndUpdateEntitlement({ customerInfo });
    const entitlements = customerInfo.entitlements?.active || {};
    const isJusticeActive = Boolean(entitlements[ENTITLEMENT_ID] || entitlements['pro'] || entitlements['justice_cassiel']);
    return { success: true, isPro: isJusticeActive };
  } catch (err) {
    console.error('[RevenueCat] Restore Error:', err);
    return { success: false, error: err?.message || 'Gagal memulihkan langganan' };
  }
}

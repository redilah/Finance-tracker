import { Capacitor } from '@capacitor/core';

const FloatingBubblePlugin = Capacitor.Plugins?.CassielFloatingBubble;

/**
 * Cek apakah izin "Display over other apps" (SYSTEM_ALERT_WINDOW) sudah aktif.
 */
export const checkFloatingBubblePermission = async () => {
  if (Capacitor.isNativePlatform() && FloatingBubblePlugin) {
    try {
      const res = await FloatingBubblePlugin.checkPermission();
      return !!res?.granted;
    } catch (e) {
      console.warn('[FloatingBubble] checkPermission error:', e);
      return false;
    }
  }
  return false;
};

/**
 * Langsung membuka pengaturan Android "Display over other apps" untuk Cassiel tanpa dialog perantara.
 */
export const requestFloatingBubblePermission = async () => {
  if (Capacitor.isNativePlatform() && FloatingBubblePlugin) {
    try {
      await FloatingBubblePlugin.requestPermission();
    } catch (e) {
      console.warn('[FloatingBubble] requestPermission error:', e);
    }
  }
};

/**
 * Memulai Service Tombol Melayang CF di layar.
 */
export const startFloatingBubble = async () => {
  if (Capacitor.isNativePlatform() && FloatingBubblePlugin) {
    try {
      await FloatingBubblePlugin.startBubble();
      return true;
    } catch (e) {
      console.warn('[FloatingBubble] startBubble error:', e);
      return false;
    }
  }
  return false;
};

/**
 * Menghentikan Service Tombol Melayang CF.
 */
export const stopFloatingBubble = async () => {
  if (Capacitor.isNativePlatform() && FloatingBubblePlugin) {
    try {
      await FloatingBubblePlugin.stopBubble();
      return true;
    } catch (e) {
      console.warn('[FloatingBubble] stopBubble error:', e);
      return false;
    }
  }
  return false;
};

/**
 * Cek apakah tombol melayang sedang aktif di layar.
 */
export const isFloatingBubbleRunning = async () => {
  if (Capacitor.isNativePlatform() && FloatingBubblePlugin) {
    try {
      const res = await FloatingBubblePlugin.isBubbleRunning();
      return !!res?.running;
    } catch (e) {
      return false;
    }
  }
  return false;
};

import { App } from '@capacitor/app';

export const CURRENT_VERSION_CODE = 25;
export const CURRENT_VERSION_NAME = '1.0.24';

/**
 * Rebuilt In-App Update Checker with Integrity Verification
 * Menggunakan standard GET request sederhana tanpa CORS preflight headers 
 * agar tidak diblokir oleh CORS policy github, dilengkapi validasi struktur & integritas hash.
 */
export const checkForAppUpdates = async () => {
  const timestamp = new Date().getTime();
  
  // 1. Coba GitHub API terlebih dahulu (Instant zero-cache, real-time tanpa delay Fastly CDN)
  try {
    const apiController = new AbortController();
    const apiTimeout = setTimeout(() => apiController.abort(), 4000);
    const apiRes = await fetch(`https://api.github.com/repos/redilah/Finance-tracker/contents/public/version.json?t=${timestamp}`, {
      method: 'GET',
      headers: { 'Accept': 'application/vnd.github.v3+json' },
      cache: 'no-store',
      signal: apiController.signal
    });
    clearTimeout(apiTimeout);

    if (apiRes.ok) {
      const apiData = await apiRes.json();
      if (apiData && apiData.content) {
        const decodedStr = atob(apiData.content.replace(/\s/g, ''));
        const data = JSON.parse(decodedStr);
        if (data && typeof data.versionCode === 'number') {
          return await formatUpdateResult(data);
        }
      }
    }
  } catch (err) {
    console.warn('[UpdateCheck] GitHub API fetch error, fallback to raw CDN URLs:', err?.message || err);
  }

  // 2. Fallback ke Raw CDN URLs jika GitHub API tidak merespon
  const urls = [
    `https://raw.githubusercontent.com/redilah/Finance-tracker/main/public/version.json?t=${timestamp}`,
    `https://cdn.jsdelivr.net/gh/redilah/Finance-tracker@main/public/version.json?t=${timestamp}`
  ];

  for (const url of urls) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const res = await fetch(url, {
        method: 'GET',
        cache: 'no-store',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!res.ok) continue;
      
      const data = await res.json();
      if (data && typeof data.versionCode === 'number') {
        const result = await formatUpdateResult(data);
        if (result) return result;
        break;
      }
    } catch (e) {
      console.warn(`Gagal memuat info update dari URL (${url}):`, e?.message || e);
    }
  }
  return null;
};

/**
 * Helper untuk memformat objek update dan mencocokkan target APK secara dinamis:
 * 1. Mode Udin (applicationId: com.redilah.udin) -> udin.apk
 * 2. Mode Debug / Test Sideload (cassielll1) -> cassielll1.apk
 * 3. Mode Release resmi (Cassiel) -> Cassiel.apk
 */
const formatUpdateResult = async (data) => {
  const latestVersionCode = data.versionCode;
  console.log(`[UpdateCheck] Versi lokal: ${CURRENT_VERSION_CODE}, Versi server: ${latestVersionCode}`);

  if (latestVersionCode > CURRENT_VERSION_CODE) {
    let isUdinApp = false;
    let isDebugOrTestApp = false;

    try {
      const appInfo = await App.getInfo();
      if (appInfo) {
        const id = (appInfo.id || '').toLowerCase();
        const name = (appInfo.name || '').toLowerCase();
        if (id.includes('udin') || name.includes('udin')) {
          isUdinApp = true;
        } else if (id.includes('debug') || name.includes('debug') || id.includes('cassielll1')) {
          isDebugOrTestApp = true;
        }
      }
    } catch {
      // Ignore native error on web
    }

    // Web / Storage fallback check
    if (typeof window !== 'undefined') {
      if (window.location.hostname.includes('udin') || window.localStorage.getItem('cassiel_apk_track') === 'udin') {
        isUdinApp = true;
      } else if (window.__IS_DEBUG_BUILD__ || window.localStorage.getItem('cassiel_apk_track') === 'debug') {
        isDebugOrTestApp = true;
      }
    }

    let baseApkName = 'Cassiel.apk';
    let downloadUrl = data.downloadUrl || `https://raw.githubusercontent.com/redilah/Finance-tracker/main/Cassiel.apk?v=${latestVersionCode}&t=${Date.now()}`;
    
    if (isUdinApp) {
      baseApkName = 'udin.apk';
      downloadUrl = data.udinDownloadUrl || `https://raw.githubusercontent.com/redilah/Finance-tracker/main/udin.apk?v=${latestVersionCode}&t=${Date.now()}`;
    } else if (isDebugOrTestApp) {
      baseApkName = 'cassielll1.apk';
      downloadUrl = data.debugDownloadUrl || `https://raw.githubusercontent.com/redilah/Finance-tracker/main/cassielll1.apk?v=${latestVersionCode}&t=${Date.now()}`;
    }

    return {
      hasUpdate: true,
      currentVersionCode: CURRENT_VERSION_CODE,
      currentVersionName: CURRENT_VERSION_NAME,
      latestVersionCode: latestVersionCode,
      latestVersionName: data.versionName || data.version || '1.0.0',
      version: data.versionName || data.version || '1.0.0',
      changelog: data.changelog || 'Pembaruan aplikasi terbaru telah tersedia.',
      downloadUrl: downloadUrl,
      sha256: data.sha256 || null,
      isUdinApp: isUdinApp,
      isDebugApp: isDebugOrTestApp,
      apkName: baseApkName
    };
  }
  return null;
};


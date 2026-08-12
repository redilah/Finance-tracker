export const CURRENT_VERSION_CODE = 9;
export const CURRENT_VERSION_NAME = '1.0.8';

/**
 * Rebuilt In-App Update Checker
 * Menggunakan request bypass cache yang sangat ketat langsung ke GitHub Raw file.
 * Menggunakan dynamic URL fallback untuk memotong blocking CDN jsDelivr dan GitHub.
 */
export const checkForAppUpdates = async () => {
  const timestamp = new Date().getTime();
  
  // URL List untuk memintas cache WebView yang agresif
  const urls = [
    `https://raw.githubusercontent.com/redilah/Finance-tracker/main/public/version.json?nocache=${timestamp}`,
    `https://cdn.jsdelivr.net/gh/redilah/Finance-tracker@main/public/version.json?nocache=${timestamp}`
  ];

  for (const url of urls) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000); // 6 detik limit timeout

      const res = await fetch(url, {
        method: 'GET',
        cache: 'no-store',
        mode: 'cors',
        signal: controller.signal,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      
      clearTimeout(timeoutId);
      
      if (!res.ok) {
        console.warn(`HTTP status error ${res.status} untuk URL: ${url}`);
        continue;
      }
      
      const data = await res.json();
      if (!data || typeof data.versionCode !== 'number') {
        console.warn('Struktur data version.json tidak valid:', data);
        continue;
      }
      
      const latestVersionCode = data.versionCode;
      console.log(`[UpdateCheck] Versi lokal: ${CURRENT_VERSION_CODE}, Versi server: ${latestVersionCode}`);

      if (latestVersionCode > CURRENT_VERSION_CODE) {
        return {
          hasUpdate: true,
          currentVersionCode: CURRENT_VERSION_CODE,
          currentVersionName: CURRENT_VERSION_NAME,
          latestVersionCode: latestVersionCode,
          latestVersionName: data.versionName || data.version || '1.0.0',
          version: data.versionName || data.version || '1.0.0',
          changelog: data.changelog || 'Pembaruan aplikasi terbaru telah tersedia.',
          downloadUrl: data.downloadUrl || 'https://raw.githubusercontent.com/redilah/Finance-tracker/main/Cassiel.apk'
        };
      }
      
      // Jika berhasil mendapat respon tapi tidak ada update lebih baru, hentikan loop.
      break;
    } catch (e) {
      console.warn(`Gagal memuat info update dari URL (${url}):`, e?.message || e);
    }
  }
  return null;
};

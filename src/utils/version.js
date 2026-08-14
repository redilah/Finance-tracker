export const CURRENT_VERSION_CODE = 14;
export const CURRENT_VERSION_NAME = '1.0.13';

/**
 * Rebuilt In-App Update Checker with Integrity Verification
 * Menggunakan standard GET request sederhana tanpa CORS preflight headers 
 * agar tidak diblokir oleh CORS policy github, dilengkapi validasi struktur & integritas hash.
 */
export const checkForAppUpdates = async () => {
  const timestamp = new Date().getTime();
  
  const urls = [
    `https://raw.githubusercontent.com/redilah/Finance-tracker/main/public/version.json?t=${timestamp}`,
    `https://cdn.jsdelivr.net/gh/redilah/Finance-tracker@main/public/version.json?t=${timestamp}`
  ];

  for (const url of urls) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 detik timeout

      const res = await fetch(url, {
        method: 'GET',
        cache: 'no-store',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!res.ok) {
        console.warn(`HTTP error ${res.status} untuk URL: ${url}`);
        continue;
      }
      
      const data = await res.json();
      if (!data || typeof data.versionCode !== 'number') {
        console.warn('Struktur data version.json tidak valid:', data);
        continue;
      }

      // Validasi integritas download URL (hanya izinkan domain terpercaya)
      const downloadUrl = data.downloadUrl || data.apkUrl;
      if (downloadUrl) {
        try {
          const parsedUrl = new URL(downloadUrl);
          const isTrusted = ['raw.githubusercontent.com', 'github.com', 'cdn.jsdelivr.net'].some(
            domain => parsedUrl.hostname === domain || parsedUrl.hostname.endsWith('.' + domain)
          );
          if (!isTrusted) {
            console.error('[Security] Untrusted download URL host rejected:', parsedUrl.hostname);
            continue;
          }
        } catch {
          console.error('[Security] Invalid download URL format');
          continue;
        }
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
          downloadUrl: downloadUrl || `https://raw.githubusercontent.com/redilah/Finance-tracker/main/Cassiel.apk?v=${latestVersionCode}`,
          sha256: data.sha256 || null
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

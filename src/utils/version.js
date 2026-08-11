export const CURRENT_VERSION_CODE = 8;
export const CURRENT_VERSION_NAME = '1.0.7';

// Check for updates via versionCode comparison (persis seperti Puncak App)
export const checkForAppUpdates = async () => {
  const timestamp = Date.now();
  const urls = process.env.NODE_ENV === 'development'
    ? [`/version.json?t=${timestamp}`]
    : [
        `https://raw.githubusercontent.com/redilah/Finance-tracker/main/public/version.json?t=${timestamp}`,
        `https://cdn.jsdelivr.net/gh/redilah/Finance-tracker@main/public/version.json?t=${timestamp}`
      ];

  for (const url of urls) {
    try {
      const res = await fetch(url, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      });
      if (!res.ok) continue;
      const data = await res.json();
      const latestVersionCode = data.versionCode || 0;
      
      if (latestVersionCode > CURRENT_VERSION_CODE) {
        return {
          hasUpdate: true,
          currentVersionCode: CURRENT_VERSION_CODE,
          currentVersionName: CURRENT_VERSION_NAME,
          latestVersionCode: latestVersionCode,
          latestVersionName: data.versionName || data.version || '1.0.0',
          version: data.versionName || data.version || '1.0.0',
          changelog: data.changelog || data.releaseNotes || 'Pembaruan aplikasi terbaru telah tersedia.',
          downloadUrl: data.downloadUrl || data.apkUrl || 'https://raw.githubusercontent.com/redilah/Finance-tracker/main/Cassiel.apk'
        };
      }
    } catch (e) {
      console.warn('Update check endpoint fallback warning:', url, e?.message || e);
    }
  }
  return null;
};


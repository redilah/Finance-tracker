export const CURRENT_VERSION = '1.0.4';

// Helper to compare semver strings (e.g. "1.0.4" > "1.0.3")
export const isNewerVersion = (serverVer, currentVer = CURRENT_VERSION) => {
  if (!serverVer) return false;
  const parse = (v) => v.toString().replace(/^v/i, '').split('.').map(n => parseInt(n, 10) || 0);
  const s = parse(serverVer);
  const c = parse(currentVer);
  for (let i = 0; i < Math.max(s.length, c.length); i++) {
    const numS = s[i] || 0;
    const numC = c[i] || 0;
    if (numS > numC) return true;
    if (numS < numC) return false;
  }
  return false;
};

// Check for updates with multi-CDN fallback & no-cache headers
export const checkForAppUpdates = async () => {
  const timestamp = Date.now();
  const urls = [
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
      if (data && data.version && isNewerVersion(data.version, CURRENT_VERSION)) {
        return data;
      }
    } catch (e) {
      console.warn('Update check endpoint fallback warning:', url, e?.message || e);
    }
  }
  return null;
};

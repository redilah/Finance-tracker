# Developer Guidelines for Cassiel (Finance Tracker)

## 1. Proactive Tool & Command Execution
* **Rule**: Never instruct or delegate tasks to the user if you have the tools and capabilities to perform them yourself. 
* **Action**: If you see a compilation error, configuration issue, or resource problem, proactively write scripts, fix code, or run terminal commands to resolve it directly. Present the results/resolutions to the user instead of listing instructions for them to run.

## 2. Android Release APK Build & Publishing Runbook
Follow these steps to prepare a new release or update:

### A. Pre-Build Validations
1. **Icon and Resource Formats**: AAPT is strict. Ensure no JPEGs are renamed to `.png` (check file magic bytes if needed). Status/notification icons must be in `drawable-*` directories, not `mipmap-*`.
2. **Version Code Increment**: For every update, increment the `versionCode` (integer) and update the `versionName` string inside `android/app/build.gradle`.

### B. Build and Automatic Signing
1. **Keystore Configuration**: Ensure `signingConfigs.release` is configured in `android/app/build.gradle` and references `release.keystore`.
2. **Build Command**: Navigate to the `android/` directory and run `./gradlew assembleRelease`.
3. **Verify Signature**: Run `apksigner verify --print-certs <apk-path>` to confirm it is signed with the release key (`CN=Redilah`) rather than the debug key.

### C. Store Asset Constraints
## 3. Storage & Data Persistence Guidelines
* **No Raw Media in Storage**: Dilarang menyimpan data SVG mentah (XML string) atau Base64 foto berukuran besar di objek transaksi/kategori di `localStorage`.
* **Runtime Icon Lookup**: Objek transaksi/kategori hanya menyimpan `id` / `categoryId`. Ikon di-resolve secara runtime via `ICON_MAP`.
* **Image Compression**: Foto profil wajib dikompres (JPEG max 256px), wallpaper dikompres (JPEG max 1024px) sebelum disimpan.

## 4. Fitur "Andai" & Prinsip Kedisiplinan Finansial
* **Kedap Cheating (Anti-Excuse)**: Klasifikasi konsumtif di fitur "Andai" bersifat mutlak dan tidak boleh menyediakan tombol manual untuk mengeluarkan transaksi.
* **Smart Hybrid Engine**: Gunakan `src/utils/classifier.js` untuk deteksi otomatis. Wajib mendeteksi konteks Bahasa Indonesia, Gaul, Singkatan, Daerah/Pulau, dan Bahasa Inggris (seperti `pulkam`, `dinas`, `mudik`, `homecoming`, `kalbar`, dll.).
* **Threshold Barbershop**: Transaksi Barbershop < Rp 50.000 dianggap kebutuhan kebersihan pokok (non-konsumtif).

## 5. UI Invariants & Design Standards
* **Warna & Theme**: Hindari penggunaan container/box hitam gelap kaku jika tidak menyatu dengan tema netral/krim (`#F8EFE6`).
* **Halaman Profil**: Tampilan profil untuk pengguna terdaftar wajib berbentuk **Full Page Screen** (bukan modal pop-up).
* **Navigasi Back**: Tombol kembali ($\leftarrow$) menggunakan `back-btn` tanpa border/background kotak kaku.
* **Dropdown Format**: Tombol aktif dropdown dibuat ringkas (`Big Bank 10%`), sedangkan item menu pilihan menyertakan keterangan periode (`Big Bank 10%/thn`).

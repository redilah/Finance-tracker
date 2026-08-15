# Developer Guidelines for Cassiel (Finance Tracker)

## 1. Proactive Tool & Command Execution
* **Rule**: Never instruct or delegate tasks to the user if you have the tools and capabilities to perform them yourself. 
* **Action**: If you see a compilation error, configuration issue, or resource problem, proactively write scripts, fix code, or run terminal commands to resolve it directly. Present the results/resolutions to the user instead of listing instructions for them to run.

## 2. Android Release APK Build & Publishing Runbook
Follow these steps to prepare a new release or update:

### A. Multi-File Synchronized Version Bump
Setiap kali menaikkan versi rilis, **wajib memperbarui secara serentak di 4 lokasi file**:
1. `android/app/build.gradle`: `versionCode` (integer) dan `versionName` (string).
2. `src/utils/version.js`: `CURRENT_VERSION_CODE` dan `CURRENT_VERSION_NAME` *(Kritis: jika tidak disinkronkan, app akan memicu update pop-up berulang).*
3. `package.json`: `"version": "x.y.z"`.
4. `public/version.json`: `versionCode`, `versionName`, `downloadUrl`, `apkUrl`, dan `sha256`.

### B. Pre-Build Validations
1. **Icon and Resource Formats**: AAPT is strict. Ensure no JPEGs are renamed to `.png` (check file magic bytes if needed). Status/notification icons must be in `drawable-*` directories, not `mipmap-*`.

### C. Build and Automatic Signing (Windows & OneDrive Safe)
1. **Keystore Configuration**: Ensure `signingConfigs.release` is configured in `android/app/build.gradle` and references `release.keystore`.
2. **Build Command**: Gunakan `.\gradlew assembleRelease --no-daemon` untuk mencegah konflik background *file-locking* OneDrive pada folder `build/intermediates/`.
3. **Verify Signature**: Run `apksigner verify --print-certs <apk-path>` to confirm it is signed with the release key (`CN=Redilah`) rather than the debug key.
4. **Copy & Sync Root APKs**: Salin file `app-release.apk` hasil build ke `.\Cassiel.apk` dan `.\Cassiel-Release.apk` di direktori root.

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
* **Navigasi Back & Borderless Cards**: Tombol kembali ($\leftarrow$) menggunakan `back-btn` tanpa border/background kotak kaku. Kotak menu/card pengaturan profil wajib menggunakan desain borderless (`border: none`) dengan bayangan halus.
* **Dropdown Format**: Tombol aktif dropdown dibuat ringkas (`Big Bank 10%`), sedangkan item menu pilihan menyertakan keterangan periode (`Big Bank 10%/thn`).
* **Action Button Persistence**: Tombol aksi utama (seperti tombol *Save* transaksi) harus selalu tampil dan aktif di form tanpa dikunci oleh kondisi panel/input focus (`activePanel === 'note'`).
* **Floating FAB Screen Isolation**: Tombol melayang (seperti Voice Mic) wajib dibatasi secara ketat hanya pada layar Home (`activeTab === 'home' && !isAddModalOpen && !isProfileModalOpen && !isBudgetCapModalOpen`) agar tidak menimpa layar form atau modal.

## 6. Format Penulisan "What's New" / Update Release Notes
* **Aturan**: Setiap kali membuat ringkasan pembaruan untuk rilis APK (misal saat diminta info pembaruan untuk upload store/APKPure), gunakan format yang simpel, langsung menyebutkan fiturnya saja menggunakan bullet point dan label `[New]` tanpa penjelasan tambahan.
* **Format Contoh**:
  ```text
  New in this update:
  - [New] Fitur Budget Kategori
  - [New] Fitur Audio Feedback Transaksi
  ```

## 7. In-App Update Anti-Cache Invariants
* **Fetch Anti-Cache**: Setiap pemanggilan `fetch` untuk `version.json` wajib menyertakan opsi `{ method: 'GET', cache: 'no-store' }`.
* **Dynamic URL Cache-Buster**: Tombol "Update Sekarang" / property `downloadUrl` & `apkUrl` wajib menyertakan parameter anti-cache dinamis (contoh: `?t=${Date.now()}` atau `?v=${versionCode}`) agar CDN GitHub/browser HP tidak menyajikan file APK lama.

## 8. Sideload Test Build (Debug Ramping)
* **Debug Build dengan R8 Shrinker**: Untuk build pengujian lokal agar tidak terjadi konflik keystore ("package invalid"), gunakan `./gradlew assembleDebug` dengan `minifyEnabled true` & `shrinkResources true` di `buildTypes.debug` agar file APK tetap berukuran ~5 MB namun menggunakan kunci debug bawaan Android.

## 9. Pola Pikir Tugas Kompleks & Goal-Driven Autonomous Loop
* **Prinsip Utama**: Jika menghadapi tugas yang rumit, membutuhkan banyak iterasi kamus, akurasi logika, pemetaan ratusan variasi kata/slang, atau perbaikan parser—**JANGAN membuang waktu user dengan iterasi chat manual kata-per-kata**.
* **Gunakan Goal-Driven Approach**:
  1. Tetapkan kondisi awal (state saat ini) dan target akhir (goals) yang terukur.
  2. Buat skrip automated test suite / benchmark mandiri (misal puluhan hingga ratusan test cases variasi input user nyata).
  3. Jalankan autonomous iteration loop: perbaiki kode/kamus, jalankan skrip pengujian, evaluasi kegagalan, dan ulangi mandiri sampai lulus 100% (Perfect Score).
  4. Hanya laporkan hasil akhir yang sudah teruji dan tuntas kepada user.

## 10. Android Edge-Swipe Gesture & Hierarchical Back-Button Handler
* **Wajib Mengakomodasi Gestur Usap Tepi Layar**: Seluruh tampilan popup, modal, sheet, dan layar penuh (seperti Halaman Profil, Budget Cap, Cropper) wajib terdaftar pada handler `App.addListener('backButton')`.
* **Hierarki Penutupan**:
  1. **Tingkat 1**: Tutup modal/cropper/budget popup/update yang sedang aktif.
  2. **Tingkat 2**: Tutup Full-Page Profile Screen dan kembali ke Home.
  3. **Tingkat 3**: Jika berada di tab non-Home (seperti Stats atau Add), kembalikan ke tab Home.
  4. **Tingkat 4**: Jika sudah di Home root tanpa modal terbuka, tampilkan toast konfirmasi ganda sebelum memanggil `App.exitApp()`.

## 11. Android Native Speech Recognition & R8 ProGuard Invariants
* **Manifest Queries**: Wajib menyertakan `<queries><intent><action android:name="android.speech.RecognitionService"/></intent></queries>` di `AndroidManifest.xml` agar tidak crash di Android 11+.
* **ProGuard / R8 Rules**: Wajib mempertahankan class Capacitor Plugins & `@PluginMethod` di `proguard-rules.pro` saat `minifyEnabled true`.
* **Seamless In-App Voice UX**: Wajib menggunakan opsi `popup: false` pada `SpeechRecognition.start()` sehingga tombol mic berdenyut (*pulsing wave*) langsung di dalam aplikasi tanpa memunculkan jendela dialog Google.

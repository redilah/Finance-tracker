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
4. **Dedicated APK Folder & Multi-File Sync**: 
   - Kumpulkan seluruh file output APK ke dalam 1 folder khusus di dalam direktori proyek: `.\apk\` (misal `.\apk\Cassiel.apk`, `.\apk\Cassiel-Release.apk`, `.\apk\cassielll1.apk`, `.\apk\udin.apk`).
   - Salin dan sinkronkan juga file rilis ke root: `.\Cassiel.apk`, `.\Cassiel-Release.apk`, `.\cassielll1.apk`, dan `.\udin.apk`.
   - **Khusus `cassielll1.apk` (Tanpa Release Key Signature)**: File `.\cassielll1.apk` dan `.\apk\cassielll1.apk` **wajib** menggunakan build tanpa release key signature (hasil `./gradlew assembleDebug` dengan R8 shrinker bawaan kunci debug Android) agar kompatibel untuk testing/sideload tanpa konflik keystore.
   - **Khusus `udin.apk` / `.\apk\Udin.apk` (Isolated Clone App)**: File `.\udin.apk`, `.\apk\udin.apk`, dan `.\apk\Udin.apk` **dilarang keras** hanya disalin/di-rename dari build Cassiel. Wajib dikompilasi secara terpisah dengan `applicationId "com.redilah.udin"` dan `app_name "Udin"` agar beroperasi sebagai aplikasi klon mandiri yang bisa diinstal berdampingan di HP yang sama tanpa menimpa atau tertukar dengan aplikasi utama `Cassiel` (`com.redilah.financetracker`).
   - **Git Push APK Invariant**: Setiap kali user meminta push kode ke GitHub, wajib memastikan seluruh file APK (`cassielll1.apk`, `udin.apk`, `Cassiel.apk`, serta isi folder `.\apk\`) ikut disertakan dalam staging `git add`, di-commit, dan di-push ke remote repository.

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
* **Security Screen Theme**: Semua layar keamanan (PIN setup, PIN lock screen, biometric prompt container) wajib menggunakan `background: var(--bg-app, #F8EFE6)`. Dilarang menggunakan gradien warna kustom (seperti amber/oranye) yang tidak konsisten dengan tema aplikasi.
* **Halaman Profil**: Tampilan profil untuk pengguna terdaftar wajib berbentuk **Full Page Screen** (bukan modal pop-up).
* **Navigasi Back & Borderless Cards**: Tombol kembali ($\leftarrow$) menggunakan `back-btn` tanpa border/background kotak kaku. Kotak menu/card pengaturan profil wajib menggunakan desain borderless (`border: none`) dengan bayangan halus.
* **Dropdown Format**: Tombol aktif dropdown dibuat ringkas (`Big Bank 10%`), sedangkan item menu pilihan menyertakan keterangan periode (`Big Bank 10%/thn`).
* **Action Button Persistence**: Tombol aksi utama (seperti tombol *Save* transaksi) harus selalu tampil dan aktif di form tanpa dikunci oleh kondisi panel/input focus (`activePanel === 'note'`).
* **Floating FAB Screen Isolation**: Tombol melayang (seperti Voice Mic) wajib dibatasi secara ketat hanya pada layar Home (`activeTab === 'home' && !isAddModalOpen && !isProfileModalOpen && !isBudgetCapModalOpen`) agar tidak menimpa layar form atau modal.

## 6. Format Penulisan "What's New" & In-App Update Modal Invariants
* **Aturan & Format**: Setiap kali membuat ringkasan pembaruan untuk rilis APK (misal saat diminta info pembaruan untuk upload store/APKPure/in-app update):
  1. **Wajib Audit Komprehensif via Git Diff**: Dilarang hanya mencantumkan fitur dari topik obrolan terakhir. Wajib memeriksa perubahan riil secara menyeluruh menggunakan `git diff` / riwayat perubahan terhadap versi rilis sebelumnya untuk mendeteksi seluruh fitur baru, aset, optimasi, dan perbaikan yang masuk ke dalam build rilis tersebut.
  2. **Format Ringkas 1–2 Poin Utama**: Changelog pada pop-up modal update wajib dibuat sangat ringkas (cukup **1–2 poin fitur utama** saja, tidak perlu menuliskan seluruh daftar panjang).
  3. **No Nested White Box**: Tampilan daftar pembaruan pada modal pop-up update dilarang menggunakan container/box putih terpisah (`background: transparent; border: none; box-shadow: none;`) agar menyatu mulus dan bersih dengan latar kartu modal tanpa kesan kotak di dalam kotak.
* **Format Contoh**:
  ```text
  New in this update:
  - [New] Fitur Multi-Bahasa Aplikasi
  - [New] Fitur Saran Pengguna untuk Pengembang
  ```

## 7. In-App Update Anti-Cache & Dynamic Routing Invariants
* **GitHub API Zero-Cache Priority**: Pengecekan pembaruan wajib memanggil GitHub API Contents Endpoint (`https://api.github.com/repos/redilah/Finance-tracker/contents/public/version.json`) dengan header `{ 'Accept': 'application/vnd.github.v3+json', cache: 'no-store' }` sebagai jalur utama untuk melewati jeda cache Fastly CDN (5–10 menit) pada URL raw.
* **Fetch Anti-Cache Fallback**: Jika fallback ke `version.json` raw/jsdelivr, wajib menyertakan opsi `{ method: 'GET', cache: 'no-store' }` dan parameter timestamp `?t=${Date.now()}`.
* **Dynamic Target APK Routing (Cassiel vs Udin)**: Pengecekan update wajib mendeteksi package ID runtime (`App.getInfo()`). Jika aplikasi berjalan dengan `applicationId "com.redilah.udin"`, tautan update diarahkan secara otomatis ke `udin.apk`, bukan `Cassiel.apk`.

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

## 12. Privacy Separation in Admin Dashboard
* **Tab 1 (Telemetry)**: Tampilkan nama asli pengguna (`resolveRealUserName`) dan avatar inisial asli untuk keperluan teknis perangkat.
* **Tab 2 (AI Learning)**: Wajib menyamarkan nama pengguna menggunakan kode enkripsi privasi (`enc:v1:s1:...`) dan dropdown filter hanya mencantumkan pengguna dengan data insight aktif.

## 13. Voice AI Parsing & Deletion Matcher Invariants
* **Scored Token Relevance Matcher**: Penghapusan transaksi via suara wajib mendukung pencocokan sebagian kata (*partial token match*) berbobot skor agar pengguna cukup menyebut 1–2 kata inti tanpa menyebut judul panjang.
* **Compound / Multi-Action Commands**: Parser wajib mendukung pemecahan klausa majemuk (hapus + tambah, multi-pengeluaran, pemasukan + pengeluaran) dan mengeksekusinya secara sekuensial.
* **Non-Split Protection**: Kalimat majemuk tunggal dengan 1 nominal (seperti *"beli roti dan selai 20 ribu"*) tidak boleh dipecah.

## 14. Voice Transaction Typewriter Animation & Speech Lock
* **Single Unified Progress Loop**: Efek ketik kartu transaksi suara wajib menggunakan 1 interval progress terpadu (`charProgress`) untuk mencegah benturan timer, text freeze, dan double execution.
* **Strict Left-to-Right Flow**: Seluruh pengetikan teks dan nominal angka (`-Rp xx.xxx`) wajib mengalir dari kiri ke kanan dengan anchor kiri (`justify-content: flex-start`).
* **Synchronous Speech Processing Lock**: Kunci `isProcessingRef.current = true` secara sinkron sebelum memproses transkrip untuk mencegah pemicuan ganda dari `silenceTimer` dan event `recognition.onend`.

## 15. Feature Introduction Notification Workflow & 5-Second Delay
* **Proactive Feature Intro Proposal**: Setiap kali user meminta rilis atau push kode APK baru ke GitHub, asisten **wajib** terlebih dahulu menyiapkan dan mengusulkan draf ringkas teks Notifikasi Perkenalan Fitur Baru yang spesifik (hanya menyebutkan fitur inti baru rilis tersebut tanpa menyebutkan seluruh riwayat lama).
* **5-Second Post-Update Delay**: Notifikasi perkenalan lokal Android wajib dijadwalkan muncul tepat **5 detik** (`Date.now() + 5000 ms`) setelah aplikasi selesai di-update dan dibuka pertama kali oleh pengguna.

## 16. Transaction Form 3-Column Category Grid Invariant
* **Strict 3-Column Grid**: Susunan ikon dan label kategori pada panel bawah form transaksi (`.category-grid`) bersifat mutlak **3 kolom ke samping** (`grid-template-columns: repeat(3, 1fr)`) agar nama kategori (termasuk terjemahan daerah seperti Basa Jawa) memiliki ruang baca yang proporsional dan tidak terpotong.

## 17. Standalone & Emblem-Only Payment Badges Invariant
* **Emblem/Symbol Only without Redundant Text**: Logo bank dan e-wallet (seperti DANA, SeaBank, Jenius, Bank Jago, BRI, OVO, ShopeePay) wajib menggunakan lambang/emblem inti murni tanpa teks/subteks panjang di dalam kotak badge.
* **Standalone Badges (No Double White Box)**: Akun dengan aset berwarna mandiri (seperti `Livin`, `Wondr`, `ShopeePay`, `DANA`, `LinkAja`, `OVO`, `GoPay`) wajib didaftarkan di `STANDALONE_BADGES` (`background: transparent`, `padding: 0`) agar tidak terbungkus kotak putih ganda atau padding putih kaku.
* **Deprecated Account Auto-Migration**: Jika ada akun bawaan yang di-deprecate/dihapus (seperti `Pos Indonesia` dan `Pegadaian`), wajib sertakan filter sanitasi pada inisialisasi `accountsList` di `App.jsx` agar data lama di `localStorage` otomatis bersih tanpa meninggalkan kartu kosong.

## 18. Dynamic Smart Frequency Ranking & One-Time "Terakhir" Discovery Badge
* **Auto-Priority Ranking**: Susunan kategori (pengeluaran & pemasukan) serta akun di form transaksi wajib bersifat dinamis dengan memprioritaskan item yang paling sering digunakan (`catFreq` / `accFreq`) dan paling baru digunakan (`lastIdx`).
* **One-Time "Terakhir" Onboarding Badge**:
  - Item urutan No. 1 (paling sering/terakhir digunakan) menampilkan badge mini elegan bertuliskan `"Terakhir"` dengan animasi denyut halus (*subtle pulse*).
  - Badge ini bersifat *one-time discovery hint*: sekali pengguna menekan/memilih kategori atau akun tersebut, status langsung disimpan ke `localStorage` (`user_last_badge_dismissed`) dan badge hilang permanen pada penggunaan berikutnya.

## 19. Multi-Language (i18n) & Strict 1-Word Form Label Invariants
* **Strict 1-Word Form Labels**: Seluruh label input form transaksi wajib berupa **1 kata tunggal murni** di semua pilihan bahasa (misal: `Tanggal`, `Jumlah`, `Kategori`, `Akun`, `Catatan`, `Simpan`). Dilarang menggunakan simbol garis miring (`/`), kata "atau", atau frasa panjang.
* **Basa Jawa "Gunggung" Nominal**: Label nominal uang pada Basa Jawa wajib menggunakan **`Gunggung`** (bukan `Gunggungipun Arta`) agar tidak menempel atau terlalu dekat ke awalan teks `Rp`.
* **Mandarin Pinyin Format**: Opsi Bahasa Mandarin wajib disajikan dalam ejaan alfabet latin murni (**Hanyu Pinyin / ABC**) seperti `Shouye`, `Tongji`, `Riqi`, `Jine`, `Fenlei`, `Zhanghu`, `Beizhu`, `Baocun` tanpa aksara Hanzi agar mudah dibaca.
* **Dynamic Full-App Synchronization**: Seluruh judul layar (`Pengaturan Profil`, `Pemasukan / Pengeluaran / Andai`), salam sapaan (`Good Day,` / `Halo,` / `Sugeng Rawuh,` / `Ni Hao,`), dan subteks ringkasan wajib terhubung secara dinamis ke engine `i18n.js`.

## 20. Bottom Navigation & Seamless UI Invariants
* **5-Tab Symmetrical Bottom Navigation**:
  - Sisi Kiri (`.nav-group-left`): `Home` dan `Account` (`akun.svg`).
  - Tengah (`.center-add-wrapper`): Tombol `(+)` tanpa label teks, terkunci di tengah (`left: 50%; transform: translate(-50%, -24px)`) presisi pada lekukan notch bar.
  - Sisi Kanan (`.nav-group-right`): `Budget` (`budget.svg`) dan `Stats` (`diagram.svg`).
  - Label tab statistik menggunakan `Stats` di semua bahasa.
* **Seamless & Borderless Content Lists**: Daftar akun (`.account-card-item`), daftar budget (`.budget-item-card`), menu profil (`.wa-menu-item`), dan grup opsi layar penuh (`.full-page-settings-group`) wajib menempel langsung pada latar belakang aplikasi tanpa kotak putih terpisah (`background: transparent; border: none; box-shadow: none; border-bottom: 1px solid rgba(0, 0, 0, 0.05);`). Item terakhir wajib `border-bottom: none`.

## 21. Swipeable Account Screen & Indicator Dots Invariant
* **Default Expense & Swipe Navigation**: Default tab Account selalu membuka `Expenses`. Transisi ke tampilan `Income` dilakukan via gestur usap horizontal (*touch swipe*).
* **Pure Visual Indicator Dots**: Titik penanda halaman di bawah nominal hero (`.account-swipe-dots`) bersifat murni visual (*non-clickable*, `pointer-events: none`).

## 22. Dynamic Smart Priority Ranking for Budget
* **Top Priority for High-Frequency Unbudgeted Categories**: Kategori pengeluaran yang paling sering memiliki transaksi riil namun belum pernah disetel limit-nya (`monthlyLimit <= 0`) wajib otomatis diprioritaskan di urutan teratas.
* **Centered Personalized Header**: Judul halaman budget wajib rata tengah (`text-align: center`) dengan format `Ayo atur budget [Nama User]`.

## 23. Apple-Grade Smooth & Fluid Motion Invariants
* **Physics & Spring Easing Curves**:
  - Transisi pergantian layar utama, tab, dan modal wajib menggunakan kurva *Apple-grade natural decel/spring* (`cubic-bezier(0.16, 1, 0.3, 1)` atau `cubic-bezier(0.25, 1, 0.5, 1)`) dengan durasi `0.22s - 0.28s`.
  - Animasi sentuhan tombol / item interaktif menggunakan kurva elastis (`cubic-bezier(0.34, 1.56, 0.64, 1)`).
* **Segmented Sliding Indicators**:
  - Komponen beralih kategori/filter (seperti Pemasukan/Pengeluaran di Home) wajib menggunakan indikator pill melayang (`.home-tx-filter-indicator`) yang meluncur secara fisik horizontal (`transform: translateX(...)`), bukan sekadar pergantian warna statis.
* **Micro Page & List Fade Transitions**:
  - Pergantian konten tab bottom nav dan filter list transaksi wajib menyertakan micro *fade-in & slide-up* (`.tab-page-transition`, `.transactions-container-animated`) agar tidak terasa kaku atau patah-patah.
* **Tactile Press Feedback**:
  - Seluruh tombol interaktif (bottom nav icon, plus FAB, menu item profil, tombol back, toggle) wajib memiliki feedback mikro-tekan (`transform: scale(0.86 - 0.96)`) yang responsif terhadap sentuhan jari pengguna.

## 24. PIN & Biometric Security Invariants

* **PIN Hash Storage — Plain `localStorage` Only**:
  - Hash PIN (SHA-256 salted, format: `cassiel_pin_salt_${pin}_2026`) wajib disimpan dan dibaca **langsung via `localStorage.setItem/getItem`**, bukan via `safeStorageSet/safeStorageGet`.
  - Alasan: SHA-256 sudah kriptografis aman. Lapisan enkripsi XOR+salt tambahan dari `secureStorage.js` bergantung pada *device salt* yang bisa belum tersedia saat inisialisasi React di Capacitor Android, sehingga `hasUserPin()` bisa return `false` meski PIN sudah tersimpan (race condition).

* **Lock Screen Flow — First-Time Setup**:
  - Setelah PIN pertama kali berhasil diatur (bukan *ubah*), wajib segera memanggil `setIsAppLocked(true)` agar user diminta verifikasi PIN baru sebelum bisa mengakses home.
  - Pattern wajib di `onSuccess` callback `PinSetupModal`:
    ```js
    onSuccess={() => {
      const wasFirstTime = !userHasPin;
      setUserHasPin(true);
      showVoiceToast(t('pinSuccessSet'));
      if (wasFirstTime) setIsAppLocked(true);
    }}
    ```

* **Biometric Auth — Native Platform Guard**:
  - Fungsi `authenticateWithBiometrics` wajib memeriksa `Capacitor.isNativePlatform()` **sebelum** memanggil `NativeBiometric`. Jika bukan native (web/dev server), langsung return `{ success: false, error: 'not_native' }`.
  - Ini mencegah bypass autentikasi di lingkungan browser/dev dan memastikan hanya sidik jari HP asli yang bisa membuka lock screen.

* **PIN Dot Filled Color**: Titik indikator PIN yang terisi wajib menggunakan warna **abu-abu** (`background: #64748B`), bukan biru atau warna mencolok lainnya.

* **Backspace Key — Borderless Plain Icon**: Tombol hapus pada keypad PIN (di `PinSetupModal` dan `PinLockScreen`) wajib menggunakan ikon polos tanpa latar belakang bulat atau shadow (`background: transparent; box-shadow: none`).

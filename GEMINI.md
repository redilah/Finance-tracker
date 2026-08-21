# Developer Guidelines for Cassiel (Finance Tracker)

> [!CAUTION]
> ## ⛔ ATURAN KRITIS APK — JANGAN PERNAH TERTUKAR!
> 
> | File APK | Untuk Siapa | Keterangan |
> |----------|-------------|------------|
> | **`Cassiel.apk`** / **`Cassiel-Release.apk`** | **USER sendiri (Redilah)** | Build **release** dengan **release key signature** (`CN=Redilah`). Ini APK utama yang dipakai user sehari-hari. |
> | **`cassielll1.apk`** | **Teman user** | Build **debug** (tanpa release key signature) karena HP teman user **tidak bisa install APK berkunci signature**. JANGAN pernah menyuruh user install file ini. |
> | **`udin.apk`** / **`Udin.apk`** | **User sendiri untuk testing & konten demo** | Build terpisah dengan `applicationId "com.redilah.udin"`, `app_name "Udin"`. Digunakan user untuk keperluan demo/konten. |
> 
> **WAJIB DIPATUHI:**
> - Jika user minta build/test untuk dirinya sendiri → build **`Cassiel.apk`** (release) atau **`udin.apk`** (demo).
> - **JANGAN PERNAH** menyuruh user install `cassielll1.apk` — itu khusus untuk temannya.
> - **JANGAN PERNAH** menuduh/mengasumsikan user menginstal `cassielll1.apk` saat user mengalami kendala instalasi "App not installed". User HANYA memakai `Cassiel.apk`.
> - Jika konteksnya perbaikan notifikasi/bug untuk ditest user sendiri → build **release** (`assembleRelease`) bukan debug.


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

### D. Notification Asset Protection & Keep Rules (Anti-Resource-Stripping)
1. **AAPT Resource Shrinking Invariant**: File `android/app/src/main/res/raw/keep.xml` wajib selalu dipertahankan dengan `tools:keep="@drawable/ic_*,@drawable/widget_*,@mipmap/*"` untuk mencegah R8/AAPT merusak aset icon notifikasi dinamis Capacitor menjadi dummy hitam/kosong 1x1 piksel saat `shrinkResources true`.
2. **Large Icon vs Small Icon Separation**:
   - `ic_large_icon.png`: Digunakan sebagai thumbnail sisi kanan notifikasi. Menggunakan logo Cassiel warna asli resolusi tinggi lengkap dengan teks `"Cassiel Finance"` dan latar squircle warm cream di seluruh density.
   - `ic_stat_icon.png` / `ic_notification.png`: Digunakan di status bar Android dan badge header notifikasi. Wajib berupa siluet monokrom putih bersih (`#FFFFFF`) murni lambang `CF` **TANPA TEKS** di seluruh density (`mdpi` 24x24, `hdpi` 36x36, `xhdpi` 48x48, `xxhdpi` 72x72, `xxxhdpi` 96x96) agar terbaca tajam dan tidak pecah pada ukuran kecil.
3. **Pure OS Material You Header Badge (No iconColor Forcing)**:
   - Dilarang memaksakan parameter `iconColor` pada `LocalNotifications.schedule()`, `capacitor.config.json`, maupun `AndroidManifest.xml` (`default_notification_color`). Sistem wajib membiarkan Android merender badge header secara netral sesuai tema Material You / Dark Mode bawaan HP pengguna (lingkaran abu/putih netral dengan simbol kontras seperti notifikasi Gmail).
4. **Auto-Purge Pending Notification Queue**:
   - Sebelum menjadwalkan notifikasi fresh (`schedulePersonalizedNotifications`), wajib mengambil dan membatalkan seluruh ID notifikasi pending (`LocalNotifications.getPending()`) untuk mencegah notifikasi usang/kotak hitam masa lalu tertinggal di sistem Android AlarmManager.

## 3. Storage & Data Persistence Guidelines
* **No Raw Media in Storage**: Dilarang menyimpan data SVG mentah (XML string) atau Base64 foto berukuran besar di objek transaksi/kategori di `localStorage`.
* **Runtime Icon Lookup**: Objek transaksi/kategori hanya menyimpan `id` / `categoryId`. Ikon di-resolve secara runtime via `ICON_MAP`.
* **Image Compression**: Foto profil wajib dikompres (JPEG max 256px), wallpaper dikompres (JPEG max 1024px) sebelum disimpan.
* **Capacitor Filesystem & Kotlin Coroutines Invariant**:
  - Plugin `@capacitor/filesystem` (v8+) membutuhkan runtime Kotlin 2.x & `kotlinx-coroutines 1.10.2` (`SpillingKt`).
  - Dilarang memaksakan versi `kotlin-stdlib` lama (`1.8.x`) di `android/build.gradle`.
  - Wajib sertakan `implementation 'org.jetbrains.kotlin:kotlin-stdlib:2.0.21'` dan `implementation 'org.jetbrains.kotlinx:kotlinx-coroutines-android:1.10.2'` di `android/app/build.gradle` serta rule keep di `proguard-rules.pro`.
* **Backup & Native Share Sheet Document Intent Invariant**:
  - Berkas cadangan diekspor dalam format teks (`.txt`) agar universal dan tidak memicu penolakan MIME type OS.
  - Saat memanggil `@capacitor/share` untuk berkas, dilarang menyertakan parameter `text` (hanya `files: [shareUri]`, `title`, dan `dialogTitle`) agar OS Android mengenali intent murni sebagai Dokumen Berkas, sehingga opsi **"Simpan ke Drive" (Google Drive)** dan **File Manager** tampil 100%.
  - URI wajib diawali dengan skema `file://` agar valid di `SharePlugin.java`.

## 4. Fitur "Andai" & Prinsip Kedisiplinan Finansial
* **Kedap Cheating (Anti-Excuse)**: Klasifikasi konsumtif di fitur "Andai" bersifat mutlak dan tidak boleh menyediakan tombol manual untuk mengeluarkan transaksi.
* **Smart Hybrid Engine**: Gunakan `src/utils/classifier.js` untuk deteksi otomatis. Wajib mendeteksi konteks Bahasa Indonesia, Gaul, Singkatan, Daerah/Pulau, dan Bahasa Inggris (seperti `pulkam`, `dinas`, `mudik`, `homecoming`, `kalbar`, dll.).
* **Threshold Barbershop**: Transaksi Barbershop < Rp 50.000 dianggap kebutuhan kebersihan pokok (non-konsumtif).

## 5. UI Invariants & Design Standards
* **Warna & Theme (Strict Ban on Dark/Black Containers)**: 
  - **DILARANG KERAS** menggunakan container, card, hero header, atau elemen utama dengan warna hitam, abu-abu gelap, cokelat tua pekat, atau gradien gelap kaku (`#000000`, `#27221F`, `#333333`, dll.). 
  - Seluruh komponen wajib menggunakan palet cerah, hangat, bersih, dan mewah yang menyatu mulus dengan latar krim `#F8EFE6` (seperti *warm cream*, *soft peach/coral tint*, *clean white luxury*, atau pastel hangat).
* **Budget Hero Card & Gaming Progress Bar**:
  - Hero card budget wajib menggunakan latar terang/krim cerah elegan dengan border halus dan bayangan lembut.
  - Jangan sertakan avatar atau nama profil di dalam kartu hero budget.
  - Progress bar budget wajib mengusung gaya visual **Gaming / Arcade HP & EXP Bar** tanpa garis tepi/border kaku (`border: none !important; border-radius: 999px;` pill dengan warna gradien neon energetik seperti Cyber Neon Emerald, Amber Energy, Hyper Coral Red, efek kilau *gloss shine*, tekstur strip diagonal).
  - **Direct In-Place Amount Input**: Nominal budget di hero card dapat langsung disentuh untuk memunculkan keyboard numerik/kalkulator HP seketika secara seamless tanpa kotak input kaku atau tombol centang/silang. Tombol aksi di bawahnya berupa tombol bersih "Simpan Budget".
  - **Action Button Text Contrast**: Teks dan ikon di dalam tombol aksi berwarna (seperti tombol biru `#2D5284` Simpan Budget) wajib secara eksplisit menggunakan warna putih bersih (`color: #FFFFFF !important;`) pada tombol maupun child `span` / `svg` agar tidak tertimpa oleh style global `span { color: var(--text-main); }`.
* **Security Screen Theme**: Semua layar keamanan (PIN setup, PIN lock screen, biometric prompt container) wajib menggunakan `background: var(--bg-app, #F8EFE6)`. Dilarang menggunakan gradien warna kustom (seperti amber/oranye) yang tidak konsisten dengan tema aplikasi.
* **Halaman Profil — Seamless & Direct Background (No White Card Boxes)**: 
  - Seluruh menu profil menempel langsung di atas latar belakang aplikasi (`var(--bg-app, #F8EFE6)`), dilarang menggunakan container card / kotak putih melayang terpisah (`background: transparent; border: none; box-shadow: none;`).
  - **Format Seluruh Menu**: Seluruh menu profil disusun **berbaris memanjang ke bawah (Row List)** tanpa icon grid berjejer.
  - **Hierarki Urutan Kategori Menu Profil**:
    1. **Urutan 1 (Paling Atas)**: `NOTIFIKASI` (Notifikasi Harian dengan Switch Toggle aktif/nonaktif).
    2. **Urutan 2**: `TAMPILAN & PREFERENSI` (Bahasa dengan ikon translasi karakter `文A`, Gaya Tulisan, Mata Uang / Currency).
    3. **Urutan 3**: `KEAMANAN` (Atur PIN / Ubah PIN dan Sidik Jari / Biometrik dengan Switch Toggle).
    4. **Urutan 4**: `DATA & DUKUNGAN` (Panduan Aplikasi, Data & Cadangan).
    5. **Urutan 5 (Paling Bawah)**: `LAINNYA` (Saran & Masukan, FAQ, Tentang Cassiel).
    6. **Footer**: Ikon sosial media Instagram polos tanpa bulatan latar putih (`https://www.instagram.com/redii_rm/`) berwarna abu-abu netral dan teks versi aplikasi (`Cassiel App ver x.y.z`) sebagai batas akhir bawah tanpa ruang kosong berlebih.
* **Navigasi Back & Borderless Cards**: Tombol kembali ($\leftarrow$) menggunakan `back-btn` tanpa border/background kotak kaku.
* **Dropdown Format**: Tombol aktif dropdown dibuat ringkas (`Big Bank 10%`), sedangkan item menu pilihan menyertakan keterangan periode (`Big Bank 10%/thn`).
* **Action Button Persistence**: Tombol aksi utama (seperti tombol *Save* transaksi) harus selalu tampil dan aktif di form tanpa dikunci oleh kondisi panel/input focus (`activePanel === 'note'`).
* **Strict Ban on Rigid Borders & Outlines (Absolute Borderless UI)**:
  - **DILARANG KERAS** menambahkan garis tepi/border kaku (`border: 1px solid ...`, `border-bottom`, `border-top`, `outline`) pada komponen UI seperti:
    - Kartu Hero Budget (`.budget-hero-card`)
    - Tombol Filter Tab & Kategori Chips (`.budget-tab-btn`, `.category-chip`, `.filter-pill`)
    - Kolom Pencarian / Search Input Wrapper (`.budget-search-wrapper`, `.search-box`)
    - Gaming EXP / Progress Bar Frame (`.budget-game-bar-frame`)
    - Tombol Aksi, Navigasi Back, Modal Card, dan Dropdown Item.
  - **Teknik Pemisah Elemen**: Batas visual dan kedalaman antar elemen wajib murni mengandalkan **kontras latar belakang cerah yang halus**, **gradien lembut**, **bayangan melayang alami (*soft warm drop shadow*)**, dan **border-radius melengkung**, bukan garis tepi kaku.
* **Authentic Asset Vector Invariant for Fingerprint**:
  - Icon sidik jari di menu profil dan layar kunci PIN wajib menggunakan vector path asli dari `src/assets/fingerprint.svg` (`viewBox="0 0 512 512" fill="currentColor"`) dalam format inline SVG agar 100% anti-broken image dan dinamis mengikuti warna tema teks. Dilarang mengganti dengan icon SVG generik.
* **Budget Hero Subtitle Strict 5-Word Limit**:
  - Deskripsi di atas nominal hero budget dibatasi ringkas padat maksimal 4–5 kata (`"Batas total pengeluaran bulan ini"`). Dilarang menggunakan frasa panjang lebih dari 6 kata.
* **Floating FAB Screen Isolation**: Tombol melayang (seperti Voice Mic) wajib dibatasi secara ketat hanya pada layar Home (`activeTab === 'home' && !isAddModalOpen && !isProfileModalOpen && !isBudgetCapModalOpen`) agar tidak menimpa layar form atau modal.
* **Budget Page Architecture & 1-Column Category Row Invariants**:
  - **Standalone Top Bar**: Header `🎯 Budget` (`font-size: 20px; font-weight: 800;`) wajib berdiri mandiri di atas kartu hero, berdampingan dengan tombol navigasi bulan & tahun.
  - **Hero Card Proportions**: Kartu hero budget menggunakan `border-radius: 18px;`, lebar seimbang `margin: 0 -4px; width: calc(100% + 8px);`, dan ilustrasi kanan atas menggunakan `kalender.svg` transparan.
  - **Gaming Progress Bar & Dual Percentage**: Warna bar hero wajib mempertahankan gradien neon energetik (`#34D399` Emerald / `#FBBF24` Amber / `#F87171` Coral Red) dengan kilau *gloss shine* dan animasi strip diagonal. Teks meta di bawah bar wajib menampilkan status kondisi di kiri dan rasio dua persentase di kanan (`XX% / 100%`).
  - **1-Column Seamless Category List**: Kategori budget disusun vertikal 1 baris per kategori tanpa kotak pembungkus luar (*seamless direct background*).
  - **Category Row Alignment & Mini Progress Bar**: 
    - Mini progress bar memiliki `max-width: 84%` dan `height: 6.5px`.
    - Teks persentase (misal `96%`) wajib berada lurus sejajar secara horizontal dengan teks nominal (`Rp xxx.xxx / Rp xxx.xxx`).
    - Tombol "Atur" pada kategori yang belum memiliki limit wajib berbentuk kotak memanjang (*rounded rectangle*) dengan sudut halus 4.5px (`border-radius: 4.5px; padding: 3px 14px; min-width: 50px;`), bukan kapsul/lonjong.

## 6. Format Penulisan "What's New" & In-App Update Modal Invariants
* **Aturan & Format**: Setiap kali membuat ringkasan pembaruan untuk rilis APK (misal saat diminta info pembaruan untuk upload store/APKPure/in-app update):
  1. **Wajib Audit Komprehensif via Git Diff**: Dilarang hanya mencantumkan fitur dari topik obrolan terakhir. Wajib memeriksa perubahan riil secara menyeluruh menggunakan `git diff` / riwayat perubahan terhadap versi rilis sebelumnya untuk mendeteksi seluruh fitur baru, aset, optimasi, dan perbaikan yang masuk ke dalam build rilis tersebut.
  2. **High-Impact Value & Benefit (Bukan Perubahan Remeh)**: Dilarang mencantumkan perubahan teknis minor internal atau kosmetik kecil (misal "tampilan kalender", "optimalisasi notif") yang tidak memiliki daya tarik nyata bagi pengguna. Wajib menonjolkan fitur dengan **nilai guna nyata (*core value & benefit*)** yang membuat pengguna merasa sangat butuh dan tertarik untuk melakukan update (misal: "Target Budget Bulanan & Pemantauan Sisa Belanja Real-Time", "Backup & Restore Data Langsung ke Google Drive").
  3. **Format Tag [NEW] (No Bullet Points)**: Setiap baris pembaruan wajib diawali langsung dengan tag `[NEW]` (tanpa bullet point dash `-` atau dot `•`).
  4. **Format Ringkas 1–2 Poin Utama**: Changelog pada pop-up modal update wajib dibuat sangat ringkas (cukup **1–2 poin fitur utama** saja, tidak perlu menuliskan seluruh daftar panjang).
  5. **No Nested White Box**: Tampilan daftar pembaruan pada modal pop-up update dilarang menggunakan container/box putih terpisah (`background: transparent; border: none; box-shadow: none;`) agar menyatu mulus dan bersih dengan latar kartu modal tanpa kesan kotak di dalam kotak.
* **Format Contoh**:
  ```text
  New in this update:
  [NEW] Target Budget Bulanan & Pemantauan Sisa Belanja Real-Time
  [NEW] Backup & Restore Data Langsung ke Google Drive & Cloud
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
* **Cash / Tunai Standalone Badge (No White Container)**: Ikon Cash / Tunai hijau (`#10B981`) wajib disajikan secara murni dan mandiri (*standalone*) tanpa bingkai kotak putih, shadow, atau border (`background: transparent !important; box-shadow: none !important; border: none !important; padding: 0 !important;`).
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
  - Tengah (`.center-add-wrapper`): Tombol `(+)` tanpa label teks, **DIKUNCI MATI (KRITIS & TIDAK BOLEH DIUBAH)** di posisi tengah `left: 50%; top: 0; transform: translate(-50%, -24px); z-index: 10;`.
  - **Kurva Lekukan Notch SVG Bottom Nav (Locked Invariant)**: Lekukan notch pada SVG background bottom navigation (`.nav-bg-svg path`) wajib selalu disinkronkan memeluk tombol Add di `transform: translate(-50%, -24px)` dengan path `d="M 0,16 Q 0,0 20,0 L 142,0 C 158,0 166,6 174,14 C 183,23 189,25 200,25 C 211,25 217,23 226,14 C 234,6 242,0 258,0 L 380,0 Q 400,0 400,16 L 400,80 L 0,80 Z" fill="var(--bg-app, #F8EFE6)"` tanpa menyisakan celah kosong di bawah tombol. Dilarang mengubah posisi vertikal tombol Add menjadi lebih turun/naik.
  - Sisi Kanan (`.nav-group-right`): `Budget` (`budget.svg`) dan `Stats` (`diagram.svg`).
  - Label tab statistik menggunakan `Stats` di semua bahasa.
* **Borderless Period Filter**: Tombol filter periode pada menu Stats dan Account (`.stats-period-btn`) wajib tanpa garis tepi/border kaku (`border: none !important; box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);`).
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

## 25. iOS Cloud Build & IPA Packaging Invariants
* **Node.js Runtime Requirement (>= 22.0.0)**: Seluruh workflow CI/CD untuk iOS (seperti `.github/workflows/build_ios.yml`) wajib menggunakan `node-version: 22` (atau lebih baru) karena Capacitor CLI v8 tidak mendukung Node.js 20.
* **macOS Cloud Runner & Xcode Version**: Gunakan `runs-on: macos-latest` dengan `xcode-select -switch /Applications/Xcode.app` untuk kompilasi iOS SDK standar.
* **Unsigned Build Flags**: Kompilasi iOS non-keystore wajib menyertakan flag:
  `CODE_SIGNING_ALLOWED=NO CODE_SIGNING_REQUIRED=NO CODE_SIGN_IDENTITY="" CODE_SIGNING_ENTITLEMENTS="" ONLY_ACTIVE_ARCH=NO`.
* **Payload Packaging Standard**:
  1. Cari lokasi direktori `.app` hasil build derived data.
  2. Buat direktori `Payload/` dan salin file `App.app` ke dalamnya.
  3. Kompres direktori `Payload` menggunakan command `zip -r -y "app-release.ipa" Payload` dan salin sebagai `Cassiel.ipa`.
* **Retention Policy**: Artifact upload diatur dengan retensi 14 hari (`retention-days: 14`) untuk efisiensi penyimpanan storage repositori.

## 26. Android Notification Icon Assets Invariant
* **Small Icon (`ic_stat_icon.xml` & `ic_notification.xml`)**: Wajib berupa Android Vector Drawable XML (atau monokrom putih `#FFFFFF` di atas background 100% transparan / *alpha channel mask*). Dilarang keras menggunakan file PNG solid/opaque/berwarna karena Android (API 21+) akan mewarnai seluruh kotak bounding box dan memicu bug kotak hitam/gelap pekat.
* **Large Icon (`ic_large_icon.png`)**: Wajib berupa full-color RGBA bitmap 32-bit dari logo aplikasi asli (`public/app-icon.png`) pada seluruh folder `res/drawable-*`.
* **Manifest Fallback & Config**: Wajib mendaftarkan meta-data default notification icon & color di `AndroidManifest.xml` serta `capacitor.config.json`.

## 27. Native Biometric Prompt & Loop-Prevention Invariant
* **One-Time Init Prompt Guard**: Auto-prompt sidik jari saat lock screen mount wajib dikunci dengan `hasAutoPromptedRef` dan `isCallingBioRef` agar penekanan tombol "Batal / Gunakan PIN" tidak memicu loop re-trigger siklis.
* **Clean Dialog Typography**: Dialog `verifyIdentity` hanya menampilkan `title: 'Sidik Jari'` dan `negativeButtonText: 'Gunakan PIN'` tanpa subtitle/description bertumpuk yang berulang.

## 28. Interactive Guided Tour & Dynamic Spotlight Invariants
* **Direct Physical Target**: Target class `.tour-target-*` wajib dipasang langsung pada elemen DOM yang memiliki layout nyata (dilarang pada `display: contents`).
* **Dynamic Floating Card Placement**: Posisi kartu panduan wajib dinamis berdasarkan koordinat bounding box elemen target (melayang di atas jika target berada di area bawah layar, dan melayang di bawah jika target di area atas) dengan panah penunjuk (*arrow*) yang presisi menunjuk ke titik tengah (*center X*) target.

## 29. Category Insight & Dynamic Influence Psychology Invariants
* **100% Dynamic Real-Time Social Proof Benchmarks**: 
  - Dilarang keras meng-hardcode angka jumlah pengguna (seperti angka 8, 9, atau konstanta statis lainnya) pada teks narasi insight atau perbandingan komunitas.
  - Jumlah pengguna pembanding wajib dihitung secara dinamis dari data real-time Firestore (`cassiel_telemetry` / `allDevices.length - 1`).
  - Format angka wajib menggunakan pemisah ribuan lokal (`.toLocaleString('id-ID')` / `.toLocaleString('en-US')`) agar otomatis mendukung skala puluhan ribu pengguna atau lebih.
* **Italicized AI & Social Proof Takeaways**:
  - Teks perbandingan komunitas (*Social Proof*) dan komitmen motivasi pada kotak *✨ Kisah Pengeluaranmu* wajib dipisah (`socialProofStory`) dan diberi styling *italic* (`font-style: italic; font-weight: 600;`) agar tampil jelas sebagai kesimpulan/takeaway khusus.
* **No Redundant Daily Average in Hero Card**:
  - Kartu hero atas pada layar insight kategori hanya menampilkan total pengeluaran dan rata-rata per transaksi (`{averagePerTx}/tx`).
  - Nominal rata-rata harian dilarang diduplikasi di hero card atas karena sudah disajikan secara khusus pada kartu sorotan (*featured highlight card*) di bawahnya.
* **Clean 1-Sentence Daily Average Sub-Label**:
  - Label pendukung pada kartu rata-rata harian wajib berupa 1 kalimat tunggal yang bersih (contoh: `"Rata-rata pengeluaranmu per hari"`) tanpa teks template mentah (`{days}`).

## 30. Android FileProvider & Crash-Proof Backup Architecture
* **Complete FileProvider Storage Paths (`file_paths.xml`)**:
  - `android/app/src/main/res/xml/file_paths.xml` **wajib** mendaftarkan seluruh root direktori penyimpanan Android (`<files-path>`, `<cache-path>`, `<external-files-path>`, `<external-cache-path>`, `<external-path>`).
  - Alasan: Mencegah error fatal `IllegalArgumentException: Failed to find configured root` dan `FileUriExposedException` yang menyebabkan aplikasi *force-close* seketika di Android OEM (seperti HyperOS/MIUI, Samsung OneUI, ColorOS) saat memanggil native file sharing atau backup.
* **Multi-Tier Safe Export & Backup Fallback**:
  - Ekspor backup di `src/utils/backup.js` wajib menerapkan *multi-tier safe write*:
    1. Simpan salinan permanen ke `Directory.Documents`.
    2. Tulis file shareable ke `Directory.Cache`.
    3. Periksa ketersediaan share sheet dengan `await Share.canShare()`.
    4. Sediakan fallback otomatis ke Web Share API atau direct browser download tanpa pernah melempar unhandled exception ke main thread.

## 31. Main Monthly Budget Automated Onboarding Notification
* **Automated 10:00 AM Reminder**: Jika pengguna belum pernah mengatur Budget Utama (`mainMonthlyBudget === null` atau `<= 0`), scheduler notifikasi wajib menjadwalkan notifikasi ramah & personal pada jam **10:00 Pagi** (`notifSetMainBudget` / `notifSetMainBudgetBody`).
* **Multi-Language Synchronization**: Teks notifikasi pengingat budget utama wajib disinkronkan secara konsisten di seluruh kamus bahasa (`id`, `id_id`, `en`, `jv`, `zh`, `ko`).

## 32. Bottom Navigation Notch Background & Anti-Bleed Invariant
* **No Open Notch Gaps (Anti-Fragment/Pecahan)**:
  - Elemen SVG background navigasi bawah (`nav-bg-svg`) dilarang membiarkan celah lekukan notch bolong 100% tembus pandang ke halaman di belakangnya.
  - Wajib menyertakan lapisan dasar (*base backing layer*) bernuansa krim lembut (`<rect fill="rgba(248, 239, 230, 0.95)" rx="20" />`) di balik lekukan notch agar elemen kartu, teks, atau bayangan di seluruh tab (Home, Account, Budget, Stats) tidak mengintip sebagai serpihan/pecahan janggal saat di-scroll.
* **Preserve Translucent Aesthetic (No 100% Solid Box)**:
  - Bar navigasi tetap mengusung nuansa transparan lembut dengan `backdrop-filter: blur(...)` dan `rgba(...)`, dilarang diubah menjadi kotak 100% solid kaku.
* **Untouched `add.svg` Stroke Width**:
  - Garis tepi / stroke pada `add.svg` wajib dipertahankan tipis dan rapi (`stroke-width="0.25"`), dilarang dipertebal.

## 34. Explain-First & User Confirmation Gate
* **Strict Clarification Rule**: Jika user meminta *"Jelaskan dulu"*, *"Coba jelaskan"*, atau bertanya bagaimana mekanismenya sebelum perbaikan, asisten **DILARANG KERAS** langsung mengubah file kode atau menjalankan proses *build* di latar belakang.
* **Prosedur Wajib**: Berikan penjelasan teknis dan logis secara mendalam terlebih dahulu, lalu tunggu konfirmasi/arahan eksplisit dari user (*"ya"*, *"kerjakan"*, *"lanjut"*) sebelum mengeksekusi perubahan kode.

## 35. Financial Notification Auto-Tracker & Anti-Promo Filter Invariants
* **Two-Tier Architecture**: Pemrosesan notifikasi keuangan wajib disinkronkan secara konsisten di 2 lapis:
  1. **Native Android Listener** (`AutoExpenseListenerService.java`)
  2. **JavaScript Engine** (`src/utils/notificationTracker.js`)
* **Strict Anti-Promo / Noise Filter (Zero False-Positives)**:
  - **Blacklist Kata Kunci Promo**: Segera buang (*discard*) notifikasi jika mengandung pola diskon/marketing (`diskon`, `discount`, `promo`, `cashback`, `voucher`, `kupon`, `hemat hingga`, `s.d.`, `up to`, persentase diskon `\b\d{1,2}%\b`, `special offer`, `penawaran`, `hadiah`, `ajukan pinjaman`, `paylater`, `kartu kredit`, `investasi`, `kode otp`, dll.).
  - **Whitelist Transaksi Sah**: Notifikasi hanya diproses jika secara eksplisit mengandung indikator transaksi valid (`berhasil`, `sukses`, `selesai`, `pembayaran`, `pembelian`, `transfer`, `terima`, `top up`, `qris`, `debit`, `kredit`) dan memiliki nominal uang `Rp` / `IDR` yang valid.
* **Standardized Account Mapping**:
  - BRI / BRImo wajib dipetakan ke nama akun standar **`BRImo`** (bukan "BRI" atau "Lainnya").
  - BCA -> `BCA`, Mandiri/Livin -> `Mandiri`, BNI/Wondr -> `BNI`, Jago -> `Bank Jago`, SeaBank -> `SeaBank`, DANA -> `DANA`, GoPay -> `GoPay`, OVO -> `OVO`, ShopeePay -> `ShopeePay`.
* **Smart Fallback for Merchant Names**:
  - Jika notifikasi dari bank tidak menyertakan nama merchant (seperti notifikasi QRIS BRImo), gunakan format fallback yang rapi dan informatif: `QRIS [Nama Akun]` (misal: `"QRIS BRImo"`), bukan string generik `"Transaksi Otomatis..."`.
  - Notifikasi push Cassiel wajib berformat: `"[Nama Merchant / Fallback] ([Nominal]) berhasil disimpan otomatis ke Cassiel."`
* **Smart Category Guessing**:
  - Klasifikasikan kategori secara cerdas berdasarkan kata kunci nama merchant (ayam/nasi/makan -> `Food`, kopi/cafe -> `Coffee`, pulsa/kuota -> `Internet`, alfamart/indomaret -> `Groceries`, dll.).

## 36. Standardized Category Addition Runbook (Expense & Income)
Setiap kali pengguna meminta penambahan kategori baru (misal: "tambah kategori X"), asisten **WAJIB** secara otomatis menyelesaikan seluruh 6 titik integrasi berikut tanpa ada yang terlewat:

1. **Aset Ikon & Mapping Runtime (`src/App.jsx`)**:
   - Salin/taruh file SVG di `src/assets/<nama>.svg` (atau gunakan aset yang diminta).
   - Import file SVG di bagian header `src/App.jsx`.
   - Daftarkan ke `DEFAULT_EXPENSE_CATEGORIES` atau `DEFAULT_INCOME_CATEGORIES` dengan `id`, `name`, dan `iconClass`.
   - Daftarkan `id` ke `ICON_MAP` untuk runtime icon lookup.
   - Daftarkan alias nama ke `nameToId` di dalam `migrateTransactions()`.

2. **Styling Badge Ikon (`src/App.css`)**:
   - Tambahkan CSS class `.<id>-icon { background-color: <hex-warm-pastel>; }` yang harmonis dengan palet hangat Cassiel.

3. **Pelatihan Voice AI / Mic Parser (`src/utils/voiceParser.js`)**:
   - **Kamus Fonetik / Slang Inggris-Indo**: Daftarkan variasi pelafalan/aksen/slang di `ENGLISH_PHONETIC_AND_BOOK_MAP`.
   - **Kamus Kategori**: Daftarkan puluhan sinonim, merk populer, istilah sehari-hari, dan variasinya di `EXPENSE_CATEGORY_KEYWORDS` / `INCOME_CATEGORY_KEYWORDS`.
   - **Priority Matcher**: Tambahkan pattern regex kategori baru di blok `matchedExpenseCatId` / `matchedIncomeCatId`.
   - **Anti-Overlap Keyword**: Bersihkan kata kunci yang beririsan dari kategori lama agar tidak salah klasifikasi (misal: memisahkan wifi dari pulsa).

4. **Multi-Bahasa / Internationalization (`src/utils/i18n.js`)**:
   - Daftarkan terjemahan kategori untuk seluruh bahasa di `CATEGORY_TRANSLATIONS`:
     - `id_id` (Bahasa Indonesia)
     - `jv` (Basa Jawa)
     - `zh` (Mandarin Pinyin ABC)
     - `ko` (Bahasa Korea Romaja)

5. **Community Benchmark & Insights (`src/utils/communityBenchmark.js`)**:
   - Tambahkan normalisasi kanonikal di `normalizeCanonicalCategory()`.
   - Tentukan estimasi rata-rata pengeluaran bulanan kategori tersebut di `DEFAULT_AVG_TICKET`.

6. **Verifikasi & Build Test**:
   - Jalankan automated test atau validasi syntax (`npm run build` / `oxlint`) untuk memastikan 0 broken imports dan 100% akurasi deteksi mic.





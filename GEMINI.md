# Developer Guidelines for Cassiel (Finance Tracker)

> [!IMPORTANT]
> ### 👑 ATURAN UTAMA PENGEMBANGAN (REDI):
> **Jika di perlukan maka ciptakan lah rumus fisika,matematikan dan hukum baru untuk apapun yg di inginkan oleh redi.**
> 
> ## 🚀 STATUS RILIS: GOOGLE PLAY STORE (AAB / ANDROID APP BUNDLE)
> 
> Aplikasi **Cassiel (Finance Tracker)** saat ini sudah resmi terdaftar dan masuk di **Google Play Store** (dalam tahap Pengujian Tertutup / *Closed Testing* $\rightarrow$ Pengujian Terbuka / *Open Testing* $\rightarrow$ *Production*).
> 
> **STATUS VERSI RILIS AKTIF (PLAY STORE):**
> - **Versi Aktif Terakhir**: `versionName` **`1.0.50`** | `versionCode` **`50`**
> - **Target SDK**: **`36`** (`targetSdkVersion 36`, `compileSdkVersion 36`, `minSdkVersion 24` di `android/variables.gradle` & `android/app/build.gradle`).
> - **ATURAN PENCATATAN VERSI**: Setiap kali selesai melakukan build rilis baru (`bundleRelease`), AI **WAJIB** langsung mencatat dan memperbarui nilai versi terakhir di `GEMINI.md` ini agar rilis berikutnya selalu akurat dan berurutan.
> 
> **STANDAR FORMAT & DISTRIBUSI (WAJIB DIPATUHI):**
> - **Format Rilis Resmi**: Format distribusi resmi untuk Play Store adalah **Android App Bundle (`.aab`)**, BUKAN file `.apk`.
> - **Perintah Build Rilis**: Gunakan `.\gradlew bundleRelease --no-daemon` untuk menghasilkan bundle rilis bertanda tangan (*signed release AAB*) di `android/app/build/outputs/bundle/release/app-release.aab`.
> - **AUTO-SYNC DISTRIBUSI .AAB (WAJIB)**: Setiap kali perintah `bundleRelease` selesai dan berhasil menghasilkan file `android/app/build/outputs/bundle/release/app-release.aab`, AI **WAJIB OTOMATIS** langsung menyalin (*copy*) file tersebut ke seluruh file distribusi di `apk/app-release.aab`, `apk/Cassiel.aab`, `apk/Cassiel-Release.aab`, `Cassiel.aab` (root), dan `Cassiel-Release.aab` (root) tanpa menunggu perintah tambahan.
> - **Aturan Push ke GitHub**: Saat user meminta rilis / push pembaruan ke GitHub, kompilasi dan sertakan file `.aab` bersama seluruh perubahan *source code* ke repositori GitHub.
> - **DILARANG AUTO-BUILD TANPA PERINTAH**: Jangan melakukan kompilasi/build file binary jika user hanya meminta perubahan kode/fitur atau investigasi. Build HANYA dilakukan jika user secara eksplisit memerintahkannya.
> - **ANTI-DATA-LOSS**: DILARANG KERAS menyuruh/menyarankan user melakukan *uninstall* aplikasi saat testing, agar tidak menghapus seluruh data finansial lokal pengguna di `localStorage`. Semua proses pembaruan wajib mendukung *seamless in-place update*.


## 1. Proactive Tool & Command Execution
* **Rule**: Never instruct or delegate tasks to the user if you have the tools and capabilities to perform them yourself. 
* **Action**: If you see a compilation error, configuration issue, or resource problem, proactively write scripts, fix code, or run terminal commands to resolve it directly. Present the results/resolutions to the user instead of listing instructions for them to run.

## 2. Google Play Store Release (AAB) & Publishing Runbook
Follow these steps to prepare a new release or update:

### A. Multi-File Synchronized Version Bump
Setiap kali menaikkan versi rilis Play Store, **wajib memperbarui secara serentak di 4 lokasi file**:
1. `android/app/build.gradle`: `versionCode` (integer) dan `versionName` (string).
2. `src/utils/version.js`: `CURRENT_VERSION_CODE` dan `CURRENT_VERSION_NAME` *(Kritis: jika tidak disinkronkan, app akan memicu update pop-up berulang).*
3. `package.json`: `"version": "x.y.z"`.
4. `public/version.json`: `versionCode`, `versionName`, `downloadUrl`, `apkUrl`, dan `sha256`.

### B. Pre-Build Validations
1. **Icon and Resource Formats**: AAPT is strict. Ensure no JPEGs are renamed to `.png` (check file magic bytes if needed). Status/notification icons must be in `drawable-*` directories, not `mipmap-*`.

### C. Build and Automatic Signing (Windows & OneDrive Safe)
1. **Keystore Configuration**: Ensure `signingConfigs.release` is configured in `android/app/build.gradle` and references `release.keystore`.
2. **Build Command**: Gunakan `.\gradlew bundleRelease --no-daemon` untuk menghasilkan file App Bundle (`.aab`) resmi Google Play Store.
3. **Release Artifact Output & Auto-Sync**: Output bundle berada di `android/app/build/outputs/bundle/release/app-release.aab`. AI wajib langsung menyalin (*copy*) file output ini ke folder `apk/` (`apk/app-release.aab`, `apk/Cassiel.aab`, `apk/Cassiel-Release.aab`) dan root (`Cassiel.aab`, `Cassiel-Release.aab`).
4. **Git Push Invariant**: Saat user meminta rilis/push ke GitHub, pastikan file bundle `.aab` dan *source code* ter-stage, di-commit, dan di-push ke remote GitHub.

### D. Notification Asset Protection & Keep Rules (Anti-Resource-Stripping)
1. **AAPT Resource Shrinking Invariant**: File `android/app/src/main/res/raw/keep.xml` wajib selalu dipertahankan dengan `tools:keep="@drawable/ic_*,@drawable/widget_*,@mipmap/*"` untuk mencegah R8/AAPT merusak aset icon notifikasi dinamis Capacitor menjadi dummy hitam/kosong 1x1 piksel saat `shrinkResources true`.
2. **Large Icon vs Small Icon Separation**:
   - `ic_large_icon.png`: Digunakan sebagai thumbnail sisi kanan notifikasi. Menggunakan logo Cassiel warna asli resolusi tinggi lengkap dengan teks `"Cassiel Finance"` dan latar squircle warm cream di seluruh density.
   - `ic_stat_icon.png` / `ic_notification.png`: Digunakan di status bar Android dan badge header notifikasi. Wajib berupa siluet monokrom putih bersih (`#FFFFFF`) murni lambang `CF` **TANPA TEKS** di seluruh density (`mdpi` 24x24, `hdpi` 36x36, `xhdpi` 48x48, `xxhdpi` 72x72, `xxxhdpi` 96x96) agar terbaca tajam dan tidak pecah pada ukuran kecil.
3. **Pure OS Material You Header Badge (No iconColor Forcing)**:
   - Dilarang memaksakan parameter `iconColor` pada `LocalNotifications.schedule()`, `capacitor.config.json`, maupun `AndroidManifest.xml` (`default_notification_color`). Sistem wajib membiarkan Android merender badge header secara netral sesuai tema Material You / Dark Mode bawaan HP pengguna (lingkaran abu/putih netral dengan simbol kontras seperti notifikasi Gmail).
4. **Auto-Purge Pending Notification Queue**:
   - Sebelum menjadwalkan notifikasi fresh (`schedulePersonalizedNotifications`), wajib mengambil dan membatalkan seluruh ID notifikasi pending (`LocalNotifications.getPending()`) untuk mencegah notifikasi usang/kotak hitam masa lalu tertinggal di sistem Android AlarmManager.

### E. Cassiel Assistant (Quick Access) Voice/Text Ingestion Invariant
1. **Direct Ingestion & Gatekeeper Bypass**:
   - Seluruh transaksi yang dicatat melalui pop-up homescreen / overlay Cassiel Assistant (`com.redilah.financetracker.assistant` / `assistantDirect: true`) wajib langsung dikonversi menjadi objek transaksi valid di `processSingleNotification()` (`src/utils/notificationTracker.js`) tanpa dilempar ke `detectProvider()` bank atau filter OTP pihak ketiga.
   - Pemanggilan `drainAndProcessQueuedNotifications()` di `App.jsx` dilarang diblokir oleh syarat izin `NotificationListenerService` maupun saklar preferensi auto-tracker bank, agar transaksi asisten selalu terserap seketika saat aplikasi dibuka/resume.
2. **Interactive UI & Strict Ban on Auto-Save Countdown**:
   - Tampilan `public/assistant.html` wajib mengusung gaya **Interactive Chat & Dual Input** (kolom teks `"Ketik transaksi..."` + tombol mic dengan animasi denyut *pulse ripple* saat aktif + tombol kirim panah oranye).
   - Setelah input suara/teks selesai, sistem wajib menampilkan bubble pengguna oranye dan kartu `✔ PREVIEW TRANSAKSI` yang memuat jenis, nominal oranye besar, Kategori, Akun, dan Catatan, disertai tombol **`Batal`** dan **`Kirim`**.
   - **DILARANG KERAS** memasang timer hitung mundur otomatis (misal 3 detik auto-save) yang menyimpan transaksi tanpa tindakan eksplisit dari pengguna.
   - Halaman asisten wajib mendukung revisi instan (bicara/ketik ulang) dan scroll vertikal halus (*smooth scroll*) tanpa terpotong keyboard.
3. **Phonetic & Slang Account Synonym Invariant**:
   - Sistem speech-to-text / voice parser wajib mendaftarkan variasi fonetik sehari-hari dan slang perbankan (seperti `"bang jago"` $\rightarrow$ `"Bank Jago"`, `"bang bca"` $\rightarrow$ `"BCA"`, dll.) ke dalam `ACCOUNT_SYNONYMS`, `ACCOUNT_KEYWORDS`, dan `ACCOUNT_INTERCHANGEABLE_ALIASES`.
   - Kata partikel/preposisi perbankan (`"bang"`, `"bank"`, `"pake"`, `"via"`, `"lewat"`) wajib dimasukkan ke dalam `CONNECTING_WORDS` dan secara otomatis dibersihkan dari catatan akhir transaksi (`note`) agar tidak tertinggal kata residu perbankan pada judul pengeluaran/pemasukan.

### F. Google Sign-In Native & Firebase Authentication Invariants
1. **Native 1-Tap Google Sign-In (Strict Ban on Web Popups in Mobile)**:
   - Di lingkungan Android Capacitor, dilarang mengandalkan `signInWithPopup` / `signInWithRedirect` Web SDK karena pembatasan isolasi sesi (*storage partitioning / missing initial state*) pada browser mobile modern.
   - Autentikasi Google di Android wajib menggunakan plugin native `CassielNativeGoogleAuthPlugin` berbasis **Android Credential Manager API** (`androidx.credentials` + `com.google.android.libraries.identity.googleid:googleid` dengan `GetGoogleIdOption`) yang menampilkan UI *bottom sheet* Google One Tap modern (persis seperti Grammarly) serta fallback otomatis ke `GoogleSignInClient` legacy.
   - Hasil `idToken` dari native ditukarkan ke Firebase melalui `signInWithCredential(auth, GoogleAuthProvider.credential(idToken))`.
   - `signInWithPopup` hanya digunakan sebagai fallback murni pada platform browser web desktop.
2. **Google Services & Keystore SHA Synchronization**:
   - File `android/app/google-services.json` wajib dipertahankan dengan konfigurasi paket `com.redilah.financetracker`.
   - Sidik jari SHA-1 dan SHA-256 dari `release.keystore` wajib selalu terdaftar di Firebase Project dan Google Cloud Credentials.
3. **Proactive MCP Tools Priority**:
   - Selalu manfaatkan tool MCP yang aktif (misal `firebase-mcp-server`) untuk melakukan manajemen project, registrasi SHA, dan query konfigurasi secara otomatis tanpa membebani pengguna dengan langkah manual di konsol browser.

### G. Excel (.xlsx) Export & Freemium Quota Invariants
1. **Quota Structure & Monthly Replenish**:
   - Paket **Free**: Starter quota 25x ekspor gratis di awal. Setiap pergantian bulan kalender, kuota di bawah 5 otomatis diisi ulang menjadi 5x ekspor per bulan tanpa memotong sisa kuota awal jika masih >= 5.
   - Paket **Pro**: Ekspor Excel tanpa batas (Unlimited).
2. **Mandatory Confirmation Dialog & Privacy Assertion**:
   - DILARANG langsung mengunduh/mengekspor berkas saat tombol ekspor ditekan. Sistem wajib selalu menampilkan pop-up dialog konfirmasi terlebih dahulu.
   - **Ikon Dokumen**: Wajib berupa garis hitam murni (`stroke: #000000 !important;` dengan wadah `.excel-confirm-icon-wrapper`) di atas wadah rounded warm-yellow agar tajam dan tidak ter-override CSS biru warisan.
   - **Teks Penegasan Privasi**: Wajib menggunakan kalimat: *"Data transaksimu adalah milikmu seutuhnya. Unduh salinan data ke Excel kapan pun kamu mau."*
   - **Tombol Aksi**: Tombol aksi utama **`Ya, Ekspor`** wajib menggunakan gradien Warm Orange (`linear-gradient(135deg, #F59E0B, #D97706)` dengan `color: #FFFFFF !important;`).
3. **Global Navigation & Back Gesture Integration**:
   - State `excelExportConfirm` wajib didaftarkan di `backHandlerStateRef.current` dan ditangani di `handleAppBack()` agar dapat ditutup menggunakan Android System Back Button maupun gestur usapan tepi kiri (*edge-swipe*).

### H. Notification Auto Tracker — Anti-False-Positive & Promo Isolation Invariant
1. **Promo, Rewards & Giveaway Strict Exclusion**:
   - Seluruh notifikasi yang memuat kata kunci promosi, sayembara, undian, reward, diskon, atau mini-game (seperti `hadiah`, `menangkan`, `pemenang`, `flip card`, `rewards`, `gratis`, `free`, `spin`, `undian`, `giveaway`, `cashback s.d.`, `voucher`, `kupon`) **WAJIB** diklasifikasikan sebagai `isNonTransactional = true` dan ditolak dari pencatatan otomatis, kecuali bila notifikasi tersebut memuat bukti penyelesaian transaksi riil yang eksplisit (`pembayaran ... berhasil`, `transfer ... berhasil`, `top up berhasil`, `kamu telah membayar`, `berhasil dibayar`).
2. **Provider Brand vs Verb Collision Protection**:
   - Pencocokan kata kerja transaksi (seperti `pay`, `beli`, `kirim`) wajib menggunakan pembatas kata ketat (*word boundaries* / negative lookbehind) untuk mencegah nama penyedia layanan (*brand names* seperti `GoPay`, `ShopeePay`, `AstraPay`, `Google Play`) disalahartikan sebagai sinyal transaksi pembayaran aktif.
3. **Multiplier & Prize Pool Isolation**:
   - Ekstraksi nominal Rupiah wajib mendeteksi akhiran pengali (`jt`, `juta`, `rb`, `k`, `m`, `miliar`). Dilarang memotong `Rp60 jt` menjadi nominal `Rp 60`. Nominal yang berada dalam konteks hadiah/sayembara/promo (`PROMO_CONTEXT_PATTERNS`) wajib diisolasi dan diabaikan dari pencatatan transaksi.
4. **Amount Indicator vs Account/Identifier Collision Protection**:
   - Filter nomor rekening/telepon (`isPhoneNumberOrIdentifier`) **DILARANG KERAS** menolak atau mengabaikan nominal yang secara eksplisit diawali oleh kata nominal/mata uang (`sebesar`, `sejumlah`, `nominal`, `total`, `rp`, `idr`).
   - Pengecekan kata kunci nomor rekening/telepon (`nomor`, `rekening`, `tujuan`, `hp`, `call center`) wajib dibatasi hanya jika kata kunci tersebut **berada langsung persis sebelum angka** (*immediate preceding match*) dan tidak diakhiri oleh indikator nominal.
5. **Strict Date, Timestamp & Year Sanitization**:
   - Format tanggal kalender (`DD/MM/YYYY`, `YYYY-MM-DD`, `DD-MM-YYYY`), jam/waktu (`HH:mm:ss`, `HH:mm`), dan tahun kalender 4-digit (`2020..2039`) **WAJIB** dibersihkan (*sanitized*) terlebih dahulu sebelum eksekusi fallback pencarian angka (*raw numeric amount extraction*). Dilarang keras mengekstrak tahun kalender (seperti `2026` pada `20/09/2026`) menjadi nominal Rupiah (`Rp 2.026`).
6. **Bank Transfer Destination Ingestion**:
   - Notifikasi transfer perbankan (seperti BRImo: `"Transfer dari ... dengan nomor rekening tujuan [tujuan] sebesar Rp..."`) wajib diklasifikasikan sebagai pengeluaran (*expense*) dan mengekstrak label tujuan transaksi menjadi `"Transfer ke [tujuan]"` secara otomatis.
7. **Failed, Cancelled & Insufficient Balance Strict Exclusion**:
   - Seluruh notifikasi yang menyatakan transaksi gagal, batal, ditolak, kadaluarsa, atau saldo tidak cukup (seperti `pembayaran gagal`, `gak bisa bayar`, `tidak berhasil`, `saldonya kurang`, `saldo tidak cukup`, `saldo tidak mencukupi`, `gagal diproses`, `gagal transfer`, `ditolak`, `declined`, `failed`, `cancelled`, `kadaluarsa`, `expired`, `batal`) **WAJIB LANGSUNG DITOLAK** (`isNonTransactional = true` / `isFailedOrCancelledNotification = true`) dan DILARANG KERAS dicatat atau dimunculkan sebagai notifikasi transaksi berhasil.

### I. Android Widget & Background Refresh Invariants
1. **Widget Scope & 4x2 Widget Deprecation**:
   - Aplikasi Cassiel hanya memelihara **1 jenis widget resmi: Widget 2x2 (Small Habit / Jatah Harian)**.
   - Widget 4x2 (Medium) telah dihapus dari codebase dan tidak boleh dimunculkan atau didaftarkan kembali.
2. **UI & Layout Preservation Invariant (Strict No-Touch UI)**:
   - **DILARANG KERAS** mengubah tampilan, styling, ukuran teks, warna, atau berkas layout XML (`widget_cassiel_small.xml`) saat melakukan perbaikan logika backend, jam, atau tanggal widget. Tampilan visual wajib selalu dipertahankan persis seperti aslinya.
3. **Date & Time Awareness — Midnight Auto-Reset (Lewat Jam 00:00)**:
   - Widget 2x2 wajib mengenali jam dan tanggal kalender secara mandiri.
   - Setiap kali widget digambar (`updateAppWidget`), sistem wajib membandingkan tanggal kalender perangkat saat ini dengan `syncedDate`. Jika sudah memasuki hari baru (lewat jam 00:00 tengah malam), nominal pengeluaran hari ini wajib **langsung di-reset menjadi `Rp 0`** secara otomatis.
   - Sistem wajib mendaftarkan alarm proaktif `AlarmManager` di pukul `00:00:02` (`ACTION_MIDNIGHT_RESET`) dan menangkap event OS (`ACTION_DATE_CHANGED`, `ACTION_TIME_SET`, `ACTION_TIMEZONE_CHANGED`, `ACTION_BOOT_COMPLETED`) agar widget di homescreen langsung ter-update ke `Rp 0` tanpa perlu user membuka aplikasi terlebih dahulu.
4. **Anti-Wipeout & Nominal Preservation (Same-Day Refresh)**:
   - Menekan tombol refresh manual pada widget 2x2 pada hari yang sama **DILARANG KERAS** menghapus nominal yang sudah valid menjadi `Rp 0`. Reset ke `Rp 0` HANYA sah terjadi jika tanggal perangkat benar-benar sudah berganti ke hari berikutnya.
5. **Dark Modern Theme (`#18181B`)**:
   - Widget 2x2 menggunakan tema gelap modern (`#18181B`) elegan dengan kontras teks dan aksen warna warm amber/emas yang tajam.





### J. Google Play Console Policy, Data Safety & Store Listing Master Blueprint
1. **Financial Features Declaration Invariant**:
   - Sebagai aplikasi *manual personal budgeting & offline expense tracker*, wajib selalu memilih **`Aplikasi saya tidak menyediakan fitur keuangan apa pun`** di form Deklarasi Fitur Keuangan Google Play.
   - **DILARANG KERAS** memilih *"Perbankan"*, *"Pinjaman"*, *"Dompet Digital"*, *"Trading"*, atau *"Saran Keuangan"* karena akan mewajibkan dokumen lisensi OJK/Bank Indonesia dan memicu penolakan review.
2. **Data Safety (Keamanan Data) Declaration**:
   - **Apakah Mengumpulkan Data?**: Pilih **`Ya`** (karena ada Firebase Auth untuk Google Sign-In opsional dan formulir Feedback/Bug Report).
   - **Enkripsi saat transit**: Pilih **`Ya`** (HTTPS/SSL).
   - **Penghapusan data**: Pilih **`Ya`** dengan URL `https://cassiel-finance.netlify.app/privacy.html`.
   - **Info Keuangan**: **KOSONGKAN SEMUA** (karena data transaksi, saldo, dan rekening disimpan 100% lokal di memori HP pengguna dan tidak pernah dikirim ke server).
   - **Info Pribadi**: Centang **Nama** & **Alamat Email** (Pengelolaan Akun & Fungsi Aplikasi, bersifat opsional).
   - **ID Perangkat / Lainnya**: Centang **Perangkat atau ID lainnya** (Fungsi aplikasi & Analytics, tidak diproses sementara).
   - **Metode Pembuatan Akun**: Pilih **`OAuth`** (Google Sign-In 1-Tap).
3. **App Access & Target Audience Invariant**:
   - **Akses Aplikasi (Login Credentials)**: Pilih **`Tidak (Semua fungsi tersedia tanpa batasan)`** agar reviewer Google dapat langsung menguji aplikasi tanpa memerlukan akun demo khusus.
   - **Target Usia**: Pilih **`18 tahun ke atas`** untuk menghindari regulasi ketat perlindungan anak (COPPA / Designed for Families).
   - **Kategori Store**: Pilih **`Produktivitas`** (*Productivity*) atau **`Keuangan`**.
4. **Visual Asset Specs (Feature Graphic & Screenshots)**:
   - **Feature Graphic**: Tepat **`1024 × 500 px`**, format PNG/JPEG, maksimal 15 MB.
   - **Screenshots**: Rasio 16:9 atau hingga maksimal 2:1 (contoh: **`1080 × 2160 px`**). Mengabadikan 6 layar kunci: Home, Account, Add Modal, Budget Hero & Gaming EXP Bar, Stats Trend Line Chart dengan Net Surplus, dan Profil Donasi Kitabisa.
5. **Testing Progression & Live Approval**:
   - Alur rilis: `Internal Testing` $\rightarrow$ `Closed Testing (Alpha)` $\rightarrow$ Checklist Dasbor & Kebijakan $\rightarrow$ `Kirim Perubahan untuk Ditinjau` $\rightarrow$ Status **`Diterbitkan`** (*Published*).
   - Akun developer personal baru wajib memenuhi minimal **20 penguji aktif selama 14 hari berturut-turut** di Pengujian Tertutup sebelum tombol pengajuan ke **Produksi (*Production*)** terbuka.

### K. Sariel Companion Testing Entity (Side-by-Side Sideload APK)
1. **Entitas & Identitas Terpisah (Side-by-Side Dual Install)**:
   - **Nama Aplikasi**: **`Sariel`** (label di homescreen HP: `Sariel`).
   - **Application ID / Package Name**: **`com.redilah.financetracker.sariel`** (varian Gradle `sariel`).
   - **Tujuan**: Memungkinkan pengujian menyeluruh (*stress test*, UI test, fitur baru) langsung di perangkat fisik pribadi berdampingan dengan Cassiel resmi Play Store tanpa konflik paket atau risiko data tertimpa.
2. **Penyimpanan & Database Terisolasi 100%**:
   - Memiliki sandbox penyimpanan (`localStorage`, SQLite/Room, SharedPreferences, cache) terpisah total dari Cassiel. Perubahan atau penghapusan data di Sariel tidak akan pernah mempengaruhi data riil di Cassiel.
3. **Perintah Build & Auto-Sync**:
   - **Perintah Build**: Gunakan `.\gradlew assembleSarielRelease --no-daemon` untuk menghasilkan APK bertanda tangan release (`release.keystore`) dengan optimasi R8 shrinker.
   - **Auto-Sync File APK**: Setiap kali perintah selesai, Gradle otomatis menyalin APK ke:
     - `apk/Sariel.apk`
     - `apk/app-sariel-release.apk`
     - `Sariel.apk` (root workspace)
4. **Google Sign-In & Firebase Credential Synchronization**:
   - Paket `com.redilah.financetracker.sariel` terdaftar resmi di Firebase Project `regalia-senpai-app` lengkap dengan fingerprint SHA-1 & SHA-256 (baik release maupun debug) di `android/app/google-services.json` dan Google Cloud OAuth Client ID, sehingga Google Sign-In 1-Tap berfungsi penuh di kedua aplikasi.

### L. Figma Design Reference — Liquid Glass Menubar Invariant
1. **Figma-to-CSS Layer Composition (Status: Permanent Active Default - Updated Pilihan Terkini Redi)**:
   - Menubar container (`.nav-items-container.nav-glass-pill-shell`) menggunakan sistem modular yang presisi:
     a. **Outer Container (Clear Bening + Liquid Wave Refraction)**:
        - Material: Clear Bening (`100% Transparan`, `bgOpacity: 0%`, `bgColor: #FFFFFF`).
        - Efek Refraksi Latar: Liquid Wave (`url(#distorsion-wave) blur(2px)` di desktop & pseudo-element `::before` SVG overlay di Android WebView) — riak alami cair melengkung lembut dengan keburaman optik 2px.
        - Stroke / Border: `1px solid rgba(255, 255, 255, 0.45)` (border kaca kristal tipis halus).
        - Texture Noise: `opacity: 0%` (bersih murni tanpa bintik noise).
        - Kilau Sheen Atas: `opacity: 0%`.
     b. **Menubar Oval (Directional 2D Multi-Axis Inner Shadow)**:
        - Corner Radius: Melengkung penuh (`border-radius: 999px`).
        - **Prinsip Arah Inner Shadow**:
          1. **Key Specular (Atas & Samping Kiri)**: `inset 4px 2px 3px rgba(255, 255, 255, 0.60)` (X:4, Y:2, Blur:3, Opacity:60%).
          2. **Counter Rim Reflex (Bawah & Samping Kanan)**: `inset -3px 2px 3px rgba(255, 255, 255, 0.60)` (X:-3, Y:2, Blur:3, Opacity:60%).
          3. **Perimeter Glow Melingkar**: `inset 0 0 10px rgba(255, 255, 255, 0.30)` (X:0, Y:0, Blur:10, Opacity:30%).
          4. **Outer Elevation (Drop Shadow)**: `0 6px 9px -3px rgba(65, 45, 25, 0.15)` (Blur:9px, Opacity:15%).
     c. **Active Bubble (Balon Kaca)**:
        - Warna: Putih, Opacity 45%, Keburaman 18px, Garis Sabit Kilau 100%.
     d. **Scroll Animation**:
        - Spring Cascade (durasi 0.52 detik).

2. **Android WebView Liquid Wave Compatibility Invariant (Strict No-Loss Refraction)**:
   - Chromium Skia pada Android System WebView mengabaikan `backdrop-filter: url(#...)` dengan `feDisplacementMap`.
   - **Aturan Permanen**:
     1. Tag `<html>` di `index.html` **WAJIB** selalu menyertakan atribut default: `data-container-style="clear"` dan `data-blur-effect="wave"`.
     2. Di `src/App.css`, selector `[data-blur-effect="wave"] .nav-items-container.nav-glass-pill-shell::before` **WAJIB** selalu dipelihara dengan layer SVG `fractalNoise` (`mix-blend-mode: overlay; opacity: 0.95; z-index: 1`) agar distorsi gelombang cairan selalu aktif di perangkat Android tanpa mengandalkan tuner dev.
     3. Nilai default variabel CSS (`--nav-glass-bg-color`, `--nav-glass-inner-*`, `--nav-glass-blur: 2px`, `--bubble-blur: 18px`) **WAJIB** terdefinisi di selector `:root` pada `src/App.css`.


### N. Strict Invariant: Dev/Tuning Panel Localhost Only (Strict Ban on Android)
1. **Desktop Localhost Exclusive**:
   - Seluruh komponen tuner visual, floating controls, atau panel penyesuaian styling (`LocalhostMenubarTuner`) **DILARANG KERAS** tampil di lingkungan Android (baik Play Store release, emulator, debug APK, maupun testing Sariel).
   - Guard wajib menggunakan:
     `Boolean(import.meta.env?.DEV) && !Capacitor.isNativePlatform() && Capacitor.getPlatform() !== 'android' && !/Android/i.test(navigator.userAgent)`
   - Pada aplikasi Android atau production build, komponen ini wajib me-return `null` seketika agar tidak meninggalkan jejak visual apa pun di perangkat pengguna.

### M. Figma MCP Setup in Antigravity 2.0 (Other Clients)
1. **OAuth Whitelist Limitation (Remote Server)**:
   - Endpoint remote `https://mcp.figma.com/mcp` mewajibkan OAuth allowlist khusus partner (VS Code, Cursor, Claude Code).
   - Antigravity 2.0 tergolong **"Other Clients"**. Pemanggilan OAuth remote akan memicu error: `OAuth app with client id WPjiIBOlI6Snc0EeAjsit7 doesn't exist`.
2. **Official Solution — Figma Desktop MCP Server**:
   - Konfigurasi resmi di `~/.gemini/config/mcp_config.json` adalah:
     ```json
     {
       "mcpServers": {
         "Figma": {
           "url": "http://127.0.0.1:3845/mcp"
         }
       }
     }
     ```
   - **Bebas OAuth**: Server berjalan lokal di `127.0.0.1:3845` dan langsung mewarisi sesi login dari aplikasi Figma Desktop.
   - **Cara Aktivasi di Figma Desktop**:
     1. Buka file desain di Figma Desktop.
     2. Masuk ke Dev Mode (`Shift + D`).
     3. Buka Quick Actions (`Ctrl + /`) dan jalankan: `Enable desktop MCP server`.
3. **Antigravity 2.0 Navigation**:
   - Letak pengaturan MCP di **Sidebar Kiri $\rightarrow$ Skills & Customizations (ikon puzzle/kubus) $\rightarrow$ tab MCP Servers**.

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

## 5. UI Invariants & Design Standards
* **Global Navigation, Modal Back & Edge-Swipe Invariant**:
  - Setiap modal/layar pop-up baru (misal: `KitabisaTransparencyModal`, `ProUpgradeModal`, `GroupsHubModal`, `QuickTextModal`, dll.) **WAJIB** didaftarkan ke dalam `backHandlerStateRef.current` dan ditangani secara bertingkat di dalam `handleAppBack()` pada `src/App.jsx`.
  - Modal multi-langkah (seperti `ProUpgradeModal`) wajib menangani hierarki kembali (*step-aware back navigation*): menutup pratinjau gambar jika terbuka $\rightarrow$ kembali ke Langkah 1 jika berada di Langkah 2 $\rightarrow$ menutup modal jika berada di Langkah 1.
  - Parameter gestur usapan tepi global (*edge-swipe gesture*) dikunci pada toleransi: titik sentuh awal tepi kiri `touchStartX <= 50px`, jarak usapan `deltaX >= 50px`, dominan horizontal `Math.abs(deltaX) > Math.abs(deltaY) * 1.2`, dan durasi `duration < 550ms` agar dapat mendeteksi usapan jari pengguna secara presisi pada perangkat ber-bezel tebal maupun ber-casing.
* **Compact Screen Single-Line Typography (iPhone SE & Small Displays)**:
  - Label navigasi bulan-tahun dan status finansial (seperti `"Defisit Rp 10.000"` / `"Surplus Rp ..."` pada grafik stats) **WAJIB** selalu tampil dalam **1 baris rapi** tanpa terpotong (*no line-wrap*) pada layar kecil/kompak ($\le 375\text{px}$) dengan memanfaatkan `font-size: clamp(...)` atau *media query* responsif khusus.
* **PIN Setup Modal Action Button Contrast & Theme**:
  - Tombol aksi konfirmasi pada modal PIN Setup wajib selalu menggunakan gradien **Warm Orange / Amber** (`linear-gradient(135deg, #F59E0B, #D97706)`) dengan teks putih bersih (`color: #FFFFFF !important;`), dilarang keras menggunakan warna biru dingin.
* **Warna & Theme (Strict Ban on Dark/Black Containers & Cold Blue Buttons)**: 
  - **DILARANG KERAS** menggunakan container, card, hero header, atau elemen utama dengan warna hitam, abu-abu gelap, cokelat tua pekat, atau gradien gelap kaku (`#000000`, `#27221F`, `#333333`, dll.). 
  - **DILARANG KERAS** menggunakan warna biru, navy, cold dark blue (`#2D5284`, `#1D4ED8`, `#3B82F6`, dll.) untuk tombol aksi utama, tombol konfirmasi/selesai modal ("Selesai", "Simpan", "Kirim", "Terapkan", CTA actions), badge toggle, dan highlight elemen baru.
  - Seluruh komponen dan tombol aksi utama wajib menggunakan palet cerah, hangat, bersih, dan mewah khas Cassiel (**Warm Orange / Amber** seperti toggle notifikasi: `linear-gradient(135deg, #F59E0B, #D97706)` atau `#D97706` / `#F59E0B` dengan bayangan lembut `rgba(217, 119, 6, 0.28)`) dan teks/ikon putih bersih `color: #FFFFFF !important;`.
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
* **Custom Category & Account Input Box Contrast**:
  - Kolom input pembuatan akun baru maupun kategori baru (`.custom-cat-input`) pada modal tambah transaksi wajib menggunakan garis tepi putih bersih (`border: 1.5px solid #FFFFFF;`) dengan bayangan halus di atas kontainer krem (`#EFE6DC`), dilarang keras menggunakan garis tepi biru dingin (`#2D5284`).
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
  - **Standalone Top Bar & Short Month Pill**: Header `🎯 Budget` (`font-size: 20px; font-weight: 800;`) wajib berdiri mandiri di atas kartu hero, berdampingan dengan tombol navigasi bulan & tahun. Tombol pill navigasi bulan wajib menggunakan format nama bulan yang disingkat (`MONTH_SHORT_I18N`, seperti `Agu 2026` / `Aug 2026`) agar tampilan tetap ringkas dan tidak memakan ruang berlebih.
  - **Single-Count Category Calculation (Anti-Double-Counting)**: Perhitungan pengeluaran kategori bulanan (`currentMonthExpensesByCategory`) wajib memetakan setiap transaksi pengeluaran hanya 1 kali per kategori (`t.categoryId === cat.id || t.category === cat.name`). Dilarang mencatat ke dua key (`category` dan `categoryId`) lalu menjumlahkannya kembali saat render.
  - **Hero Card Proportions**: Kartu hero budget menggunakan `border-radius: 18px;`, lebar seimbang `margin: 0 -4px; width: calc(100% + 8px);`, dan ilustrasi kanan atas menggunakan `kalender.svg` transparan.
  - **Gaming Progress Bar & Dual Percentage**: Warna bar hero wajib mempertahankan gradien neon energetik (`#34D399` Emerald / `#FBBF24` Amber / `#F87171` Coral Red) dengan kilau *gloss shine* dan animasi strip diagonal. Teks meta di bawah bar wajib menampilkan status kondisi di kiri dan rasio dua persentase di kanan (`XX% / 100%`).
  - **1-Column Seamless Category List**: Kategori budget disusun vertikal 1 baris per kategori tanpa kotak pembungkus luar (*seamless direct background*).
  - **Category Row Alignment & Mini Progress Bar**: 
    - Mini progress bar memiliki `max-width: 84%` dan `height: 6.5px`.
    - Teks persentase (misal `96%`) wajib berada lurus sejajar secara horizontal dengan teks nominal (`Rp xxx.xxx / Rp xxx.xxx`).
    - Tombol "Atur" pada kategori yang belum memiliki limit wajib berbentuk kotak memanjang (*rounded rectangle*) dengan sudut halus 4.5px (`border-radius: 4.5px; padding: 3px 14px; min-width: 50px;`), bukan kapsul/lonjong.
* **Pie Chart Leader Line & Label Alignment Invariant**:
  - Garis penunjuk horizontal (*leader line*) pada diagram lingkaran Pie Chart Stats wajib mengarah dan berhenti lurus tepat di tengah vertikal teks **[Nama Kategori]** (`dominantBaseline="central"` pada ketinggian `slice.pLabel.y`).
  - Teks persentase diletakkan rapi di bawah nama kategori, dengan jarak bebas tabrakan vertikal antar-label (`minYSpacing`) minimal 26px.
* **Bottom Navigation Soft Keyboard Avoidance**:
  - Saat pengguna mengedit nominal budget di kartu Hero (`isEditingMainBudget === true`) atau saat kolom pencarian kategori difokuskan (`isSearchingBudget === true`), bilah Bottom Nav wajib disembunyikan otomatis agar keyboard HP tidak mendorong bilah navigasi ke atas menutupi antarmuka pencarian dan tombol aksi. (Arsitektur bilah navigasi dan balon kaca bawah diatur terpusat pada **Section 48: Apple iOS Liquid Glass Navigation Bar**).
* **Apple Direction-Aware Page Slide Transitions Invariant**:
  - **Zero-Lag Render-Pass Derivation**: Penentuan arah geser tab (`direction: 'forward' | 'backward'`), jumlah langkah (`steps`), jarak geser (`distance`), dan durasi (`duration`) **WAJIB** dihitung langsung pada siklus render React saat `activeTab` berubah (`if (prevTabRef.current !== activeTab) setTabMotion(...)`), **DILARANG** mengandalkan `useEffect` yang menyebabkan jeda render 1–2 frame.
  - **Directional Alignment Invariant**:
    - Perpindahan tab ke arah kanan ($\rightarrow$) memicu gelembung menu meluncur ke kanan DAN halaman masuk meluncur ke kanan (`translate3d(-dist, 0, 0)` menuju `0`).
    - Perpindahan tab ke arah kiri ($\leftarrow$) memicu gelembung menu meluncur ke kiri DAN halaman masuk meluncur ke kiri (`translate3d(dist, 0, 0)` menuju `0`).
  - **Dynamic Step-Aware Distance & Duration Scaling**:
    - Perpindahan 1 langkah (tab bertetangga): `--slide-dist: 40px; --slide-dur: 260ms;`.
    - Perpindahan melompati tombol Add / multi-langkah: `--slide-dist: 70px; --slide-dur: 320ms;`.
  - **Apple Standard Easing**: Menggunakan kurva `cubic-bezier(0.16, 1, 0.3, 1)` dengan akselerasi GPU (`will-change: transform, opacity; transform: translate3d(...)`) pada setiap kontainer halaman tab.
* **Apple Liquid Glass (visionOS / iOS 26) Navigation Bar & GPU Shader Invariants**:
  - **Exact 1:1 Resting Scale & Baseline Alignment Invariant**:
    - Saat balon kaca berada dalam posisi diam (*idle / at rest* pada satu tab):
      - Skala pembesaran lensa (`snellMagnification`) wajib bernilai tepat `1.0000` murni (1:1 terhadap item menu lain di luar balon).
      - Elevasi sumbu vertikal (`lensIconLiftY`) dan pergeseran optik wajib `0.0px`, sehingga titik tumpu (*baseline*) ikon dan label teks berada pada garis horizontal yang rata sempurna dengan menu-menu di sebelahnya.
      - Pembesaran dinamis (`scale` hingga ~1.18x), efek elevasi maju 3D, dan bayangan jatuh (*drop-shadow*) HANYA boleh aktif saat terjadi interaksi membal (`bounceActivity > 0`), sentuhan jari (*drag/press*), atau saat berpindah antar tab.
  - **Strict Ban on SVG feDisplacementMap & Mandatory Clip-Path Containment**:
    - DILARANG KERAS menggunakan filter raster SVG (`<feDisplacementMap>`) pada elemen DOM navbar karena peramban merendernya sebagai kotak persegi 90° (*bounding-box leak*) yang menyembul di luar lengkungan kapsul dan memicu pikselasi bergerigi pada ikon SVG.
    - Wadah lensa (`.nav-lens-refraction-stage`) wajib selalu diproteksi dengan `clip-path: inset(0 round 999px)` dan `-webkit-clip-path: inset(0 round 999px)` agar batas optik lensa selalu 100% identik dengan bentuk kapsul balon kaca (`72px × 48px`).
  - **Fused Single-Entity WebGL2 & CSS Architecture (Ditempel Lengket Jadi Utuh Satu)**:
    - **Penyatuan Fisik Elemen DOM & Shader**: Canvas shader WebGL2 (`<canvas className="nav-webgl-shader-canvas">`) **WAJIB DITEMPEL LANGSUNG DI DALAM** bodi kontainer balon (`.nav-liquid-glass-bubble`), DILARANG diletakkan sebagai kanvas terpisah di level dock luar.
    - Hal ini menjamin layer "warna di atasnya" (CSS background, blur, Cauchy prism, vector icon/label) dan layer "tekstur liquid glass" (GPU shader PBR Blinn-Phong, Snell refraction, Schlick Fresnel) menyatu 100% sebagai satu atom fisik tunggal tanpa pernah bergeser, tertinggal, atau terbelah dua saat di-drag maupun saat meluncur.
    - Output warna menggunakan *premultiplied alpha* dengan pemotongan transparan presisi di tepi meniskus droplet (`dist > 0.5 -> vec4(0.0)`).
  - **Unified Viscoelastic Sticky Droplet & 300ms Timing (Melar Lengket Elastis Satu Benda)**:
    - **Melar Lengket Satu Benda (*Strict Cohesive Elastic Rule*)**: Saat berpindah antar tab, balon kaca **WAJIB** mempertahankan efek melar lengket elastis (*viscoelastic stretch*) yang kenyal sebagai **SATU BENDA TUNGGAL UTUH**.
    - **Laplace Surface Tension Cap**: Rentang regangan antar kepala dan ekor (`fluidSpan`) dibatasi ketat $\le 72\text{px}$ (panjang total balon maksimal $\sim 130\text{px}$ / skala $\le 2.45\times$). Hal ini menjamin balon **TIDAK PERNAH TERBELAH DUA** oleh tombol Plus tengah dan tidak pernah menjebol dinding luar dock.
    - **Navier-Stokes Volume Conservation (Necking)**: Regangan horizontal memicu penipisan pinggang vertikal nyata ($S_{\text{neckY}} = 1 / \sqrt{1 + 0.60 \cdot (\text{span} / B_w)}$, mengecil hingga $\sim 0.65\times$) yang memberikan sensasi cairan kental elastis / permen karet yang nyata.
    - **Durasi Tepat 300ms & Tail Snappy Landing**: Durasi transit dikunci pada tepat **300ms** ($\omega_{\text{base}} = 16.8\text{ rad/s}$, $\zeta = 0.88$). Ekor menahan sejenak di awal ($15\%$) lalu melesat kencang ($\omega_{\text{trail}}$ hingga $32\text{ rad/s}$) mendarat bersamaan dengan kepala (selisih $< 30\text{ms}$, tanpa delay), memicu impuls membal pendaratan kenyal $\Delta v_{sx} \approx -5.2$, $\Delta v_{sy} \approx +4.6$, gelombang dock `velBarSink = 5.6`, dan haptic feedback.
* **Home Segmented Filter Tabs & Quick Dropdown Invariants**:
  - **Click Isolation & Independent Dropdown Trigger**:
    - Menekan tab **Expense** murni hanya berpindah filter kategori transaksi (`homeTxFilter = 'expense'`) dan **WAJIB** menutup dropdown (`isExpenseDropdownOpen = false`). Dilarang keras otomatis memunculkan dropdown saat berpindah tab.
    - Dropdown menu filter periode tanggal **HANYA BOLEH DIBUKA** ketika pengguna secara eksplisit menekan tombol panah dropdown (`.capsule-dropdown-arrow`).
  - **Optical Center Alignment & Position for Arrow (Locked Invariant)**:
    - Tombol panah dropdown (`.capsule-dropdown-arrow`) wajib terkunci di sisi kanan kapsul tab (`position: absolute; right: 8px; top: calc(50% + 1.5px); transform: translateY(-50%); z-index: 5;`). Dilarang mendekatkannya/menempelkannya ke teks Expense.
    - Menggunakan vektor SVG chevron bersih (`width="10" height="6"` dengan stroke `1.8` round) berukuran sentuh nyaman `24x24px` flexbox agar posisinya sejajar presisi secara optik dengan garis tengah karakter teks `Expense`.
  - **Dropdown Stacking & Isolation**: Kontainer bilah filter kapsul (`.home-tx-filter-bar`) wajib menaikkan `z-index` secara dinamis (`zIndex: isDropdownOpen ? 1150 : 5`) saat dropdown menu terbuka agar daftar filter melayang 100% di atas kartu-kartu transaksi di bawahnya tanpa terpotong atau tembus.
  - **Action Button Text Color Inheritance**: Tombol segmen aktif (seperti `.expense-active` dan `.income-active`) wajib memaksakan warna tema pada seluruh child element (`.home-tx-filter-btn.active.expense-active, .home-tx-filter-btn.active.expense-active * { color: var(--card-expense-text, #BC6C25) !important; }`) guna mencegah penimpaan warna oleh aturan global `span { color: var(--text-main); }`.
  - **Cash Counter Rolling Animation**: Perubahan filter nominal pada kartu ringkasan wajib menggunakan animasi mesin hitung uang bergulir (*cash counter*, durasi ~1.2 detik dengan kurva *cubic-bezier ease-out*) dari nominal sebelumnya ke nominal baru.
* **Transaction Card Category-Bound Palette (Strict Ban on :nth-child)**:
  - **Dilarang Keras** memberi warna background balok kartu transaksi menggunakan selektor urutan baris CSS `:nth-child(N)`.
  - Seluruh kategori (35 kategori pengeluaran & pemasukan) wajib terikat secara permanen dengan warna balok pastel khusus melalui kelas `.cat-card-${id}` / `.cat-card-${iconClass}`.
  - Warna wajib menggunakan *Soft Muted Luxury Pastel* yang berkontras jelas terhadap latar `#F8EFE6` tanpa terlihat pudar/tersamar dan tidak menyilaukan/ngejreng.
* **Budget Progress Bar & Percentage No-Red Invariant**:
  - Saat kategori budget mencapai limit ($\ge 100\%$) atau melebihi limit (*over-limit*), warna mini bar dan teks persentase wajib menggunakan gradien/warna Warm Amber (`#FBBF24` $\rightarrow$ `#D97706`), **DILARANG KERAS** menggunakan warna merah.
* **Accounts Page 3-Metric Asset Distribution Invariant**:
  - Kartu hero halaman Akun wajib menyajikan 3 metrik sebaran aset yang terisolasi: `Rekening Bank` (khusus bank resmi), `E-Wallet` (khusus dompet digital, tanpa cash), dan `Kartu Kredit`.
  - Dilarang mengulang ringkasan Income/Expense yang sudah ada di halaman Home & Stats.
* **Add Transaction Modal Independent Amount State**:
  - Input nominal Expense dan Income wajib memiliki state mandiri (`expenseAmountVal` dan `incomeAmountVal`) agar nominal yang diketik pengguna tidak tercopy ke tab lain dan tidak hilang saat berpindah-pindah antar-tab. Kedua nilai hanya di-reset saat modal dibuka dari awal atau saat transaksi berhasil disimpan.
* **Category & Account Warehouse Isolation Invariants**:
  - **Menu Utama Form Add Transaksi (Active List Lean Invariant)**:
    - Menu form Add transaksi wajib tampil ramping dengan hanya memuat kategori/akun default aktif:
      - **Expense**: Maksimal 4 kategori default aktif (`food`, `transport`, `coffee`, `bensin`) + kategori kustom pengguna.
      - **Income**: Maksimal 3 kategori default aktif (`gaji`, `bonus`, `affiliate`) + kategori kustom pengguna.
      - **Accounts**: 3 akun default aktif (`Cash`, `GoPay`, `BRImo`) + akun kustom pengguna.
    - Seluruh kategori default dan akun lainnya wajib berada di dalam **📦 Gudang (Warehouse)** saat inisialisasi awal maupun migrasi storage.
  - **Eksklusi Mutlak Kartu Kredit dari Gudang Akun**:
    - Gudang Akun (`warehouseAccountsList`) **DILARANG KERAS** memuat Kartu Kredit (`type === 'credit_card'`). Gudang Akun hanya untuk Bank Resmi, E-Wallet, dan Tunai (Cash).
  - **Strict Dedicated Icon Mapping in ICON_MAP**:
    - Dilarang memetakan kategori default ke icon dummy `addSvg`. Kategori `investasi`, `bisnis`, `accessories`, dan lainnya wajib terhubung ke file SVG aslinya (`investasiSvg`, `bisnisSvg`, `accessoriesSvg`, dll.).
* **Notification Auto Tracker OS Push Invariant**:
  - Saat notifikasi transaksi bank/e-wallet tertangkap di background Android (`CassielNotificationListenerService.java`), sistem wajib langsung memunculkan notifikasi status bar native dari Cassiel:
    - **Judul**: `"Transaksi [Nama Bank / E-Wallet] Berhasil Dicatat"` *(contoh: `Transaksi BRImo Berhasil Dicatat`, `Transaksi BCA Berhasil Dicatat`, `Transaksi GoPay Berhasil Dicatat`)*.
    - **Isi (Body)**: `[Merchant / Kategori] • Rp [Nominal]` *(contoh: `Starbucks • Rp 55.000` atau `Food • Rp 25.000`)*.
    - **Ikon**: `R.drawable.ic_stat_icon` (small icon monokrom putih) dan `R.drawable.ic_large_icon` (large icon logo Cassiel).
    - **Aksi Tap**: `PendingIntent` menuju `MainActivity`.
* **Auto-Tracker Transaction Edit & Settle Lifecycle**:
  - Tombol kapsul **"Edit"** hanya tampil pada transaksi yang berasal dari notifikasi otomatis (`autoTracked: true` / `inputMethod: 'notification'`).
  - Menekan tombol "Edit" membuka modal form Add dalam mode edit dengan data terisi (nominal, nama merchant, kategori, akun).
  - Menyimpan transaksi (`handleSaveTransaction`) wajib memperbarui data transaksi di tempat (*in-place update*) dan mengubah `autoTracked: false` & `inputMethod: 'manual'` agar tombol kapsul Edit **langsung hilang otomatis**.
* **Transaction Pop-Up Zoom Detail Invariant**:
  - Kartu zoom pop-up transaksi wajib 100% solid opacity menggunakan palet warna kategori masing-masing (`CATEGORY_BG_COLORS` / `resolveCardBgColor`), anti-tembus pandang.
  - Wajib 100% borderless tanpa garis tepi kaku dan tanpa `inset` outline pada `box-shadow`.

* **Apple Liquid Glass (visionOS / iOS 26) System Invariants**:
  - **Modal & Card Translucency (Strict Ban on Opaque Pseudo-Element Blocks)**: Pada modal kartu atau sheet berukuran besar (`.budget-sheet-card`, `.quick-text-modal-card`, pop-up kustom), dilarang memasang pseudo-elemen `::before` berdimensi besar dengan opasitas putih pekat (`rgba(255, 255, 255, 0.9+)`). Seluruh ilusi kedalaman kaca kristal wajib dihasilkan melalui kombinasi `backdrop-filter: blur()`, translusensi gradien latar yang merata, dan *perimeter inset highlights* (`inset 0 1.5px 2px rgba(255, 255, 255, 0.95)`), sehingga bebas dari artefak blok/potongan layer putih di dalam modal.
  - **Sub-Screen Header Action Gem & PIN Keypad Spheres**: Tombol centang konfirmasi di sub-header pengaturan (`.header-confirm-btn`) wajib mengusung bentuk permata kaca cair (*liquid glass gem*) melingkar 36px dengan *specular crescent arc* dan border tipis. Tombol keypad angka pada layar PIN (`.pin-key-btn` di `PinSetupModal` dan `PinLockScreen`) wajib berbentuk bola kristal kaca 3D (*3D crystal spheres*) 74px tembus pandang yang menyatu dengan latar hangat aplikasi, didukung indikator 6 titik PIN (*dots*) dengan pendaran gradien emas saat terisi.
  - **3D Sculpted Liquid Glass Iconography & Authentic Silhouettes**:
    - Dilarang memasang ikon garis kawat datar (*flat wireframe outline SVGs*) di dalam tombol aksi bola kaca cair. Seluruh ikon aksi kaca wajib dipahat menjadi vektor 3D volumetrik bersegi (*faceted 3D crystal*).
    - Saat mengubah ikon garis fungsional menjadi kaca kristal 3D volumetrik (seperti tong sampah swipe-to-delete atau tombol kirim chat), **DILARANG KERAS merusak atau mengubah siluet fisik universal objek**.
    - **Anatomi Tong Sampah Kaca (Trash Can)**:
      - Gagang atas wajib berupa *low-profile wide grip* yang pipih dan lebar (lebar ~6px, tinggi ~3.5px) menancap langsung di atas bibir tutup. Dilarang membuat gagang tinggi melengkung sempit yang menyerupai cantolan tas jinjing atau gembok.
      - Tutup wajib berupa lempeng horizontal melebar (*overhanging lid shelf*) yang menonjol keluar melampaui badan tong.
      - Dasar tong wajib berupa tabung trapesium bersih dengan sudut melengkung halus (*rounded corners*), tanpa lengkungan baki/mangkuk asing di dalam tabung.
      - Kisi vertikal wajib menggunakan 2 garis simetris beralur kaca kristal (*dual fluted glass ribs* dengan garis kilau spekular + bayangan refraksi optik).
    - **Anatomi Ikon Kirim Kaca (Paper Airplane Send Icon)**:
      - Wajib tersusun atas 2 faset origami kristal 3D: Sayap Atas (*Main Wing Facet*) dengan gradien refraksi terang + *leading edge sheen*, dan Sayap Bawah (*Underbody Facet*) dengan gradien refraksi kedalaman prismatik.
      - Tulang lipatan tengah (*Central Spine Ridge*) wajib diberi garis kilau spekular kristal tajam.
      - Mode Non-Aktif (*Disabled*) wajib berupa kaca es kristal translusen (*frosted ice glass*), bukan garis kawat abu-abu.
    - **Rasio Ikon terhadap Kontainer Pod**: Ikon kaca 3D di dalam gelembung aksi pod distandarkan pada ukuran **55–58% dari diameter kontainer** (misal `25×25px` di pod `44×44px`, atau `21×21px` di tombol chat `38×38px`) agar detail material kaca terlihat tajam dan menonjol tanpa membesarkan kontainer luarnya.

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
* **Dynamic Target APK Routing (Cassiel vs Sariel)**: Pengecekan update wajib mendeteksi package ID runtime (`App.getInfo()`). Jika aplikasi berjalan sebagai entitas pendamping pengujian Sariel (`applicationId "com.redilah.financetracker.sariel"`), tautan update diarahkan secara otomatis ke `Sariel.apk` / `app-sariel-release.apk`, bukan `Cassiel.apk`. Sideload testing dikelola penuh secara terisolasi via varian **Sariel** (lihat **Section 2.K**).

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


## 16. Transaction Form 3-Column Category Grid Invariant
* **Strict 3-Column Grid**: Susunan ikon dan label kategori pada panel bawah form transaksi (`.category-grid`) bersifat mutlak **3 kolom ke samping** (`grid-template-columns: repeat(3, 1fr)`) agar nama kategori (termasuk terjemahan daerah seperti Basa Jawa) memiliki ruang baca yang proporsional dan tidak terpotong.

## 17. Standalone & Emblem-Only Payment Badges Invariant
* **Strict Ban on Legacy Mandiri & BNI Assets/Names**:
  - Dilarang keras mengimpor, membuat file, atau menggunakan aset `mandiriva.svg` dan `bniva.svg`.
  - Aplikasi secara mutlak hanya menggunakan **`Livin' by Mandiri`** (`livin.svg`) dan **`Wondr by BNI`** (`wondr.svg`).
* **Preserve Standard White Container for Bank Logos**:
  - Wadah logo akun (`.account-logo-frame`) **wajib mempertahankan latar putih rounded dengan bayangan lembut** (`background: #FFFFFF; border-radius: 8px; box-shadow: 0 2px 5px rgba(0, 0, 0, 0.08); padding: 3px;`). Dilarang menghapus background putih ini.
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
* **Dynamic Full-App Synchronization**: Seluruh judul layar (`Pengaturan Profil`, `Pemasukan / Pengeluaran`), salam sapaan (`Good Day,` / `Halo,` / `Sugeng Rawuh,` / `Ni Hao,`), dan subteks ringkasan wajib terhubung secara dinamis ke engine `i18n.js`.

## 20. Bottom Navigation & Seamless UI Invariants
* **5-Tab Symmetrical Bottom Navigation**:
  - Sisi Kiri (`.nav-group-left`): `Home` dan `Account` (`akun.svg`).
  - Tengah (`.center-add-wrapper`): Tombol `(+)` tanpa label teks di posisi tengah melayang bebas (*independent floating button*).
  - Sisi Kanan (`.nav-group-right`): `Budget` (`budget.svg`) dan `Stats` (`diagram.svg`).
  - Label tab statistik menggunakan `Stats` di semua bahasa.
  - Arsitektur visual, kapsul kaca melayang, dan fisika membal balon kaca diatur penuh secara terpusat pada **Section 48: Apple iOS Liquid Glass Navigation Bar**.
* **Borderless Period Filter**: Tombol filter periode pada menu Stats dan Account (`.stats-period-btn`) wajib tanpa garis tepi/border kaku (`border: none !important; box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);`).
* **Seamless & Borderless Content Lists**: Daftar akun (`.account-card-item`), daftar budget (`.budget-item-card`), menu profil (`.wa-menu-item`), dan grup opsi layar penuh (`.full-page-settings-group`) wajib menempel langsung pada latar belakang aplikasi tanpa kotak putih terpisah (`background: transparent; border: none; box-shadow: none; border-bottom: 1px solid rgba(0, 0, 0, 0.05);`). Item terakhir wajib `border-bottom: none`.

## 21. Swipeable Account Screen & Indicator Dots Invariant
* **Default Expense & Swipe Navigation**: Default tab Account selalu membuka `Expenses`. Transisi ke tampilan `Income` dilakukan via gestur usap horizontal (*touch swipe*).
* **Pure Visual Indicator Dots**: Titik penanda halaman di bawah nominal hero (`.account-swipe-dots`) bersifat murni visual (*non-clickable*, `pointer-events: none`).

## 22. Dynamic Smart Priority Ranking for Budget
* **Top Priority for Configured Categories (`hasLimit`)**: Kategori pengeluaran yang SUDAH memiliki limit budget bulanan aktif (`hasLimit`) wajib otomatis diprioritaskan di urutan teratas (diurutkan berdasarkan frekuensi transaksi terbanyak), disusul kategori yang belum diatur namun pernah ada transaksi, dan terakhir kategori tanpa transaksi.
* **3-Item Initial Preview Limit**: Tampilan awal daftar kategori budget sebelum tombol ekspansi ditekan wajib dibatasi tepat 3 kategori teratas (`displayList.slice(0, 3)`).
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
* **5 Essential Steps Limit & Hierarchy**:
  - Alur panduan onboarding wajib dibatasi maksimal **5 langkah esensial** (tanpa membebani pengguna dengan form mikro bertingkat atau menu minor).
  - **Urutan 1 (Wajib Paling Awal)**: `Cadangkan Data` di halaman Profil dengan deskripsi universal perlindungan data dari kehilangan kapan pun (bukan hanya saat ganti perangkat).
  - **Urutan 2**: `Catat Lewat Suara (Voice AI)` di Beranda.
  - **Urutan 3**: `Tambah Transaksi Manual` di Bottom Navigation.
  - **Urutan 4**: `Rencana & Limit Budget` di Bottom Navigation.
  - **Urutan 5**: `Statistik & Laporan` di Bottom Navigation.
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


## 34. Explain-First & User Confirmation Gate
* **Strict Clarification Rule**: Jika user meminta *"Jelaskan dulu"*, *"Coba jelaskan"*, atau bertanya bagaimana mekanismenya sebelum perbaikan, asisten **DILARANG KERAS** langsung mengubah file kode atau menjalankan proses *build* di latar belakang.
* **Prosedur Wajib**: Berikan penjelasan teknis dan logis secara mendalam terlebih dahulu, lalu tunggu konfirmasi/arahan eksplisit dari user (*"ya"*, *"kerjakan"*, *"lanjut"*) sebelum mengeksekusi perubahan kode.


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

## 37. Modern "Tambah Akun Baru" Screen & Bank Selection Invariants
* **Layout & Color-Synchronized Tabs**:
  - Tab kategori filter (`Semua`, `Bank`, `E-Wallet`) wajib menggunakan gradien aktif warm terracotta (`linear-gradient(135deg, #D4A373 0%, #BC6C25 100%)`) yang seragam dengan tombol aksi "Tambah" dan "Buat akun sendiri".
  - Search bar menggunakan placeholder resmi `"Cari bank atau e-wallet..."` yang terdaftar di `i18n.js`.
* **Official Mobile Banking App Identities (Strict Ban on Legacy Mandiri/BNI)**:
  - Bank Mandiri dan BNI wajib menggunakan nama & branding resmi aplikasi terkini: **`Livin' by Mandiri`** dan **`Wondr by BNI`** (dilarang menggunakan opsi duplikat generic "Mandiri" atau "BNI", dan aset `mandiriva.svg` serta `bniva.svg` tidak boleh digunakan).
  - Kategori Populer memuat akun utama: `Cash`, `BCA`, `BRImo`, `Livin' by Mandiri`, `Wondr by BNI`, `Jago`, `GoPay`, `OVO`, `DANA`, `ShopeePay`.
* **Standard Account Logo Frame Styling**:
  - Frame logo akun (`.account-logo-frame`) menggunakan latar putih bersih dengan bayangan lembut (`background: #FFFFFF; border-radius: 8px; box-shadow: 0 2px 5px rgba(0, 0, 0, 0.08); padding: 3px;`) agar logo bank (BCA, BSI, CIMB, dll.) tampil tegas dan kontras di semua grid.
  - Akun dengan aset berwarna mandiri (`STANDALONE_BADGES` seperti Livin, Wondr, LinkAja, DANA, OVO, ShopeePay) serta `Cash` tetap menggunakan `background: transparent; padding: 0;` tanpa kotak putih ganda.
* **Silent & Non-Intrusive Account Selection**:
  - Dilarang memutar efek suara pop/bubble (`bubble_pop_2.wav`) saat pengguna mengetuk salah satu kartu bank/e-wallet.
* **Layering & Navigation State Preservation**:
  - Pop-up *"Atur Saldo Awal"* berjalan di atas layer `zIndex: 100000`.
  - Saat pengguna membatalkan/menutup pop-up saldo awal, aplikasi **wajib tetap berada di layar Tambah Akun Baru** tanpa menutup layar ke menu awal.
* **Dynamic Auto-Hide for Configured Accounts**:
  - Sistem wajib menyaring seluruh daftar (`popularList`, `bankList`, `ewalletList`) menggunakan `isAccountAlreadyConfigured()`. Akun yang sudah pernah diatur saldonya (termasuk Cash/Tunai) wajib otomatis dihilangkan dari kartu pilihan Tambah Akun Baru.

## 38. 🔒 Code Scope Protection — Menu ADD (LOCKED)

> [!CAUTION]
> ## ⛔ SELURUH ISI MENU ADD DIKUNCI PERMANEN
> 
> **Seluruh kode, logika, UI, dan perilaku yang berkaitan dengan Menu ADD (Modal Add Transaksi) berstatus LOCKED dan DILARANG KERAS diubah** tanpa izin eksplisit dari user.
> 
> ### Area yang Dilindungi (LOCKED):
> | Komponen | Status |
> |----------|--------|
> | Form Add Transaksi (Expense & Income tabs) | 🔒 Locked |
> | Input nominal (`expenseAmountVal`, `incomeAmountVal`) | 🔒 Locked |
> | Pemilihan kategori (termasuk Gudang/Warehouse) | 🔒 Locked |
> | Pemilihan akun | 🔒 Locked |
> | Input catatan/note | 🔒 Locked |
> | Pemilihan tanggal | 🔒 Locked |
> | Logika simpan/save transaksi | 🔒 Locked |
> | Validasi form | 🔒 Locked |
> | State management modal ADD | 🔒 Locked |
> | Tampilan/UI modal ADD (layout, styling, animasi) | 🔒 Locked |
> | Tombol aksi (Save, tab switch Expense/Income) | 🔒 Locked |
> | Animasi & interaksi di dalam modal ADD | 🔒 Locked |
> | Panel kategori, panel akun, panel note | 🔒 Locked |
> | Badge "Terakhir" & Dynamic Smart Frequency di form ADD | 🔒 Locked |
> | 3-Column Category Grid di form ADD | 🔒 Locked |
> 
> ### Aturan Wajib:
> 1. **DILARANG** memodifikasi, merefaktor, menyederhanakan, mengganti, merestruktur, atau "memperbaiki" area yang terkunci di atas.
> 2. **DILARANG** melakukan refactoring oportunistik (rename variabel, reorganisasi fungsi, pindah kode, rewrite fungsi yang sudah berjalan) pada area Menu ADD.
> 3. Jika perubahan pada fitur lain secara teknis membutuhkan modifikasi pada kode Menu ADD, **WAJIB jelaskan alasannya dan minta izin eksplisit** dari user terlebih dahulu.
> 4. Perubahan visual/UI pada fitur lain **WAJIB** diimplementasikan tanpa menyentuh kode Menu ADD jika memungkinkan.
> 5. Aturan ini berlaku di **semua percakapan baru** — tidak hanya pada sesi percakapan saat aturan ini dibuat.
> 6. Kunci ini hanya bisa dibuka jika user secara eksplisit mengatakan ingin mengubah bagian tertentu dari Menu ADD.

## 39. Privacy Page & Public Web Invariants (/kebijakanprivacy)
* **Clean URL Routing Without .html**:
  - Halaman kebijakan privasi resmi wajib disajikan melalui rute bersih `/kebijakanprivacy` (folder `public/kebijakanprivacy/index.html` dan rewrite dev server di `vite.config.js`).
  - URL `privacy.html` atau `/privacy` wajib dialihkan (*302 redirect*) otomatis ke `/kebijakanprivacy`.
* **Header Color & Luxury Palette**:
  - Background hero header wajib menggunakan gradien Golden Amber Orange yang identik dengan tombol toggle switch aktif aplikasi (`linear-gradient(135deg, #D97706 0%, #F59E0B 50%, #FBBF24 100%)`).
  - Garis tepi tombol kapsul aksi (*"Download Sekarang"*) dan *Language Switcher* (**ID | EN**) wajib menggunakan warna krem hangat (`border: 1.5px solid #FDE68A` / `#FEF3C7`) dengan latar semi-transparan.
* **Clean Logo Asset Presentation**:
  - Logo brand di header wajib menggunakan `app-icon-clean.png` langsung dengan `border-radius: 11px` tanpa pembungkus kotak putih ganda (`div.brand-logo-frame`) agar tidak menimbulkan artefak garis putus-putus hitam.
* **Apple Fluid Motion & Spring Transitions**:
  - Seluruh tombol interaktif wajib memiliki feedback fisik sentuh (`:active { transform: scale(0.93); }`) dengan kurva pegas alami Apple (`cubic-bezier(0.34, 1.56, 0.64, 1)`).
  - Pergantian bahasa (**ID $\leftrightarrow$ EN**) wajib menggunakan transisi memudar halus (*fluid cross-fade* + elevasi `translateY(4px)`), dilarang berganti secara instan/kaku.
* **Ultra-Responsive iPhone SE Bounds**:
  - Tata letak wajib teruji responsif pada layar kecil (320px – 375px) dengan padding adaptif (`14px`), teks adaptif, dan judul yang sejajar presisi dengan tombol switch bahasa tanpa tumpang tindih.
* **Pure Social Icon Buttons**:
  - Kontak pengembang (Instagram & GitHub) wajib berupa tombol ikon bulat murni (*pure icon buttons*) tanpa deretan teks panjang.
* **Formal & Professional Phrasing**:
  - Menggunakan frasa legal yang tenang dan elegan seperti *"Privacy-First (Privasi Utama)"* (menghindari kata berlebihan seperti *"Privasi Mutlak"*).

## 40. Kitabisa Proof of Impact — 3D Interactive Flip Card Invariants
* **Zero Disconnected White Slip Boxes**:
  - DILARANG menampilkan kotak slip putih terpisah di bawah kartu sertifikat bukti donasi.
  - Seluruh rincian penyaluran (Misi Kebaikan, Penyelenggara, Tanggal Verifikasi, Alokasi Donasi emas, dan tombol dokumentasi YouTube) wajib terintegrasi langsung di sisi belakang kartu (*card back*).
* **Ultra-Luxury Black Ceramic Aesthetic**:
  - Sisi depan (*card front*): 3D isometric dark monolithic stepped blocks (Riyadh Platinum style), logo siluet putih Cassiel `CF` transparan tanpa kotak putih kaku, chip EMV, dan sudut simetris rapi `borderRadius: 20px`.
  - Sisi belakang (*card back*): Black magnetic stripe, frosted security signature strip (nama pengguna + segel hologram pelangi, tanpa angka CVV tiruan seperti `892`), tipografi mikro elegan `#71717A`/`#FFFFFF`, dan alokasi dana dengan efek gradien emas metalik (*metallic liquid gold*).
* **Click Event Isolation**:
  - Tombol tautan video dokumentasi YouTube di bagian belakang kartu wajib memiliki `onClick={(e) => e.stopPropagation()}` agar sentuhan pada tombol tidak memicu kartu berputar balik secara tidak sengaja.
* **Strict Ban on Persistent Mock Previews**:
  - Dilarang memasang tombol atau kartu pratinjau dummy di lingkungan produksi. Kartu bukti donasi murni hanya muncul ketika pengguna telah memiliki catatan bukti donasi riil (`recordUserDonationProof`). Pengguna yang belum berlangganan hanya melihat status kosong bersih dengan tombol ajakan berlangganan.

## 41. Pro Subscription Telemetry & Admin Dashboard Metrics Invariants
* **Immediate Subscription Telemetry Sync**:
  - Setiap kali transaksi langganan berhasil (`purchaseJusticeCassielPackage`) atau dipulihkan (`restoreJusticePurchases`), fungsi `updateCurrentDeviceTelemetry()` wajib langsung dipanggil secara otomatis untuk menyinkronkan status Pro (`isPro: true`, `proPlanTitle`, `donorNumber`, `donorLabel`, `totalDonated`) ke koleksi Firebase Firestore `cassiel_telemetry`.
* **Concise & Clean Dashboard Typography**:
  - Kartu metrik langganan di Admin Dashboard wajib menggunakan teks ringkas 1 baris:
    - Judul: **`PENGGUNA PRO`** (dilarang menggunakan judul panjang seperti `"PENGGUNA LANGGANAN PRO"` yang memicu line-wrap canggung).
    - Satuan angka: **`{count} pro`**.
    - Subteks: **`Langganan Aktif`** (atau ringkasan total nominal donasi).
  - Tombol filter tabel: **`👑 Pro ({count})`**.
  - Kolom tabel `PAKET / STATUS`: Menampilkan badge emas `👑 {PlanTitle}`, badge donatur Kitabisa `💙 {DonorLabel}`, dan label abu-abu bersih `Free / Gratis` untuk pengguna reguler.

## 42. Telemetry Privacy & Data Safety Invariants (Percentages vs Nominals)
* **Strict Percentage-Based Expense Aggregation**:
  - Seluruh pengiriman data telemetri kategori pengeluaran ke Firestore (`cassiel_telemetry`) **WAJIB** menggunakan persentase rasio integer (0..100%) melalui modul `toCategoryPercentages()` di `src/utils/telemetryPrivacy.js`.
  - **DILARANG KERAS** mengirimkan atau menyimpan nominal Rupiah mentah per kategori transaksi (`expenseCategoryAmounts`) ke Firestore demi mematuhi deklarasi Google Play Data Safety.
* **Preservation of User & Group Identity**:
  - Kolom nama pengguna (`userName`) dan daftar grup (`groups`) **WAJIB TETAP DIPERTAHANKAN** di Firestore dan telemetri. AI dilarang menghapus, mengosongkan, atau membuang data nama dan grup ini saat sanitasi telemetri.

## 43. Admin Dashboard Direct Access Invariant (Localhost Monitor)
* **No Password/Passcode Gate**:
  - Tampilan `AdminDashboard.jsx` ditujukan sebagai monitor pengembang lokal (*localhost*).
  - **DILARANG KERAS** memasang formulir sandi, passcode SHA-256, session gate, atau tombol kunci/logout yang menghalangi pembukaan dasbor admin. Dasbor wajib selalu dapat diakses secara langsung dan instan.

## 44. Default Onboarding Language & Guided Tour Localization Invariant
* **English As Primary Default Onboarding Language**:
  - Untuk pengguna baru (instalasi bersih atau pertama kali buka di Web maupun Android tanpa `user_app_lang` tersimpan), bahasa utama aplikasi **WAJIB** selalu diinisialisasi ke **`'en'` (English)**, bukan `id_id` atau `jv`.
  - Dropdown pemilih bahasa onboarding (`onboarding-lang-dropdown`) wajib secara default memilih **English (🇬🇧)** dan menempatkan English di urutan paling atas.
  - Semua elemen formulir onboarding (sambutan selamat datang, placeholder nama panggilan, tombol mulai, tombol Google Sign-In, tombol login email) wajib tampil dalam bahasa English secara default.
* **Strict Guided Tour Localization Sync**:
  - Alur panduan aplikasi (`GuidedTourModal.jsx`) wajib secara konsisten dan real-time mengikuti bahasa aktif yang dipilih pengguna.
  - Dilarang keras menaruh teks hardcoded bahasa Indonesia/Jawa pada dialog contoh suara Voice AI, tombol mic, tombol aksi lanjut/kembali/lewati/selesai, serta banner pesan berhasil/gagal.
  - Seluruh teks panduan wajib terdaftar di `DICTIONARY` (`src/utils/i18n.js`) untuk semua bahasa yang didukung (`en`, `id`, `id_id`, `jv`, `zh`, `ko`).

## 45. Static Lint Verification & Multi-View Modal Integrity Invariants
1. **Mandatory Static Linting on Component Changes (Anti-Blank-Screen Invariant)**:
   - Bundler produksi (`vite build`) tidak selalu mendeteksi variabel JSX yang belum terdefinisi (`ReferenceError`) pada kondisi bersyarat (*conditional sub-views*).
   - Setiap kali membuat atau memodifikasi komponen/modal React (terutama yang memiliki sub-view seperti `isCreatingGroup`, `isEditing`, dsb.), AI **WAJIB** menjalankan static linting (`npx oxlint <file-path>`) untuk memastikan nol *warning* dan nol *error* sebelum menyatakan pekerjaan selesai.
2. **Multi-View Hub Modal State & Storage Function Synchronization**:
   - Seluruh *state* yang direferensikan pada sub-halaman modal (seperti `initialMembers`, `groupAvatar`, `newGroupName`, `inviteCodeInput` di `GroupsHubModal.jsx`) wajib dideklarasikan secara eksplisit dengan `useState` pada level *root* modal.
   - Seluruh fungsi *storage/ledger action handler* (seperti `updateGroupInfo`, `removeMemberFromGroup`, `recordKasPayment`, `recordGroupExpense`) wajib diimpor secara utuh dari modul pendukungnya (`groupStorage.js`) untuk mencegah runtime crash saat pengguna melakukan manipulasi data di sub-layar.

## 46. Cassiel Groups, Deep-Link Invite (/join), WhatsApp System Pills & Apple Fluid Chat Invariants
* **Cross-Device Invite Link & Android App Links (`/join`)**:
  - Seluruh tautan undangan grup wajib dibuat menggunakan `getGroupInviteUrl(group)` di `src/utils/groupStorage.js` dengan format `https://cassiel-finance.netlify.app/join?g=KODE&name=NamaGrup` (dilarang keras menggunakan domain `cassiel.app`).
  - Halaman `public/join.html` menampilkan logo Cassiel murni tanpa pembungkus kotak/border oranye (`.brand-logo-wrap` transparan) dan otomatis memicu Android Intent (`intent://join?...#Intent;scheme=cassiel;package=com.redilah.financetracker;end`) serta skema `cassiel://join?g=KODE`.
* **White Card Theme & Chat Bubble Typography (`GroupDetailScreen.jsx` & `groups.css`)**:
  - Header detail grup (`.group-detail-header-card`), kartu utama tab Keuangan (`.group-hero-balance-card` & `.group-tracker-card`), serta gelembung chat dari anggota lain (`.chat-message-row.other .chat-bubble-text`) wajib menggunakan latar putih bersih (`#FFFFFF`).
  - Kolom pengetikan pesan bawah (`.chat-input-field`) menggunakan latar `#EAE8E4`, sedangkan tombol `+` dan tombol panah kirim (`.chat-send-btn`) tetap mempertahankan gradien oranye hangat khas Cassiel.
  - Nama pengirim (`.chat-sender-name`) wajib berada **di dalam** gelembung chat (`.chat-bubble-text` / `.chat-financial-card`) dengan warna gelap tebal (`#1F1C1A`), dilarang ditaruh di luar kotak chat.
  - Jam pesan (`.chat-time-stamp-inside`) disejajarkan dengan batas bawah huruf teks pesan menggunakan `padding-bottom: 7px` pada `.chat-message-content` dan `line-height: 1; margin-bottom: -1px` pada `.chat-time-stamp-inside`.
* **WhatsApp-Style Centered System Pills & Strict Per-Device Perspective**:
  - Aktivitas sistem grup (`group_created`, `member_added`, `member_joined_link`, `member_left`) wajib disimpan dengan `type: 'system'`, `senderId: 'system'`, `actorId: myUserId`, dan `actorName`, serta dirender di tengah layar menggunakan `.chat-system-pill-row` / `.chat-system-pill` (putih semi-transparan `rgba(255, 255, 255, 0.92)` tanpa jam/centang).
  - **Strict Per-Device Perspective (`explicitActorId === myUserId`)**: Penentuan kata ganti `"You"` / `"Anda"` vs nama anggota (contoh: `"Kimi joined via invite link"`) **WAJIB** ditentukan 100% dari kecocokan ID unik perangkat (`explicitActorId === myUserId`), dilarang di-override oleh kecocokan string nama jika `explicitActorId` tersedia, agar di HP anggota lain tidak pernah tertulis `"You"`.
  - Teks pil sistem wajib otomatis menyesuaikan bahasa aktif aplikasi (`safeStorageGet('user_app_lang')`: `'en'`, `'id'`/`'id_id'`, `'jv'`, `'zh'`, `'ko'`).
* **Apple Fluid Interface Chat Send Motion**:
  - Saat tombol Send ditekan, pesan langsung masuk ke state lokal di frame yang sama (*zero-latency*), gelembung chat baru muncul dari poros sudut bawah (`transform-origin: 100% 100%` untuk `.me`, `0% 100%` untuk `.other`) dengan kurva pegas *critically-damped* (`cubic-bezier(0.22, 1, 0.36, 1)`), disertai *interruptible spring scroll* berbasis `requestAnimationFrame` yang langsung berhenti ketika pengguna menyentuh layar.
* **Netlify MCP Fast Deployment Invariant**:
  - Saat melakukan deploy ke Netlify menggunakan tool MCP `netlify-deploy-services-updater` (`siteId: "9e945988-b260-40ae-b97a-b590933d4a55"`), wajib menjalankan `npm run build` terlebih dahulu dan mengisi `deployDirectory` dengan path folder `dist` (`c:\Users\GC\Desktop\finance tracker\dist`), dilarang mengirim *root directory* proyek agar tidak *timeout* saat mengarsipkan folder `android/` dan `.aab`.

## 47. Apple Fluid Morphing Pill, Typewriter Rhythm & Web Speech Recognition Invariants
* **Apple Fluid Morphing Pill (Charging Indicator Motion)**:
  - **Single Continuous Curve (Anti-Stutter)**: Animasi ekspansi pil/toast dinamis DILARANG menggunakan perhentian bertingkat (seperti `20%`, `50%`, `75%`) dan DILARANG memanipulasi `filter: blur()` atau `border-radius` perantara yang membebani GPU. Animasi wajib berjalan murni dalam 1 tarikan napas `0% -> 100%` dengan kurva fluida Apple `cubic-bezier(0.22, 1, 0.36, 1)`.
  - **True Circular Origin (`clip-path: inset round 999px`)**: Dilarang memenyet kapsul dengan `scaleX` non-seragam yang mendistorsi sudut bulat menjadi persegi panjang pipih. Gunakan `clip-path: inset(0% 45% 0% 45% round 999px)` di awal agar titik awal selalu berupa lingkaran sempurna di tengah sebelum meregang ke kiri-kanan.
  - **Symmetric Exit & Smooth Space Collapse**: Animasi keluar dan hapus kartu (`cardFluidDeleteShrink`) wajib menyusut kembali ke bulatan tengah dengan `clip-path` simetris, diikuti penutupan tinggi vertikal (`max-height: 92px -> 0px`) agar kartu di bawahnya mengalir naik secara halus tanpa loncatan kasar.
* **Structured Typewriter Timing & Tabular-Nums Alignment**:
  - **Expansion Delay**: Animasi ketik wajib menunggu kartu membuka sebagian (`260ms`) sebelum mulai mengetik karakter pertama.
  - **Rhythmic Structured Pauses**: Ketikan wajib memiliki jeda napas antar-bagian (Judul -> jeda `~130ms` -> Kategori/Akun -> jeda `~130ms` -> Nominal) dengan kecepatan santai `~42ms` per karakter.
  - **Layout Jump Prevention**: Kolom nominal wajib dikunci rata kanan (`justify-content: flex-end`) dengan `fontVariantNumeric: tabular-nums` sejak frame pertama pengetikan agar angka tidak melompat posisi saat animasi berganti ke komponen statis.
* **Desktop Browser (Chrome/Edge) Web Speech Recognition**:
  - **Multi-Segment Result Iteration**: Pengambilan teks pada `recognition.onresult` wajib melakukan iterasi dari `event.resultIndex` untuk menangkap segmen *interim* dan *final*, agar ucapan berkelanjutan tidak terpotong pada browser desktop.
  - **Hardware Mic Contention Guard**: Hindari pemanggilan `getUserMedia` yang langsung di-`stop()` persis bersamaan dengan `recognition.start()` untuk mencegah driver audio Windows terkunci di browser.

## 48. 🍎 Apple Design & Liquid Glass Master Architecture (Consolidated Apple UI/UX Invariants)

Bagian ini mendokumentasikan secara terpusat seluruh komponen, rumus fisika pegas, dan arsitektur visual di aplikasi **Cassiel** yang menerapkan standar **Apple Human Interface Guidelines (iOS Fluid Interface & iOS 26 Liquid Glass)**. Seluruh aturan di bawah ini bersifat **LOCKED INVARIANT** dan wajib dipatuhi:

### A. Apple iOS "Liquid Glass" Bottom Navigation Bar (`src/App.jsx` & `src/App.css`)
1. **Tata Letak Kapsul & Jarak Aman Tombol `+` (Opsi B — Center Plus)**:
   - Bilah navigasi bawah menggunakan kapsul melayang **Light/Warm Glass** (`.nav-glass-pill-shell`, tinggi `62px`, `border-radius: 999px`, `backdrop-filter: blur(22px) saturate(195%)`) yang menyatu dengan tema krem hangat Cassiel (`#F8EFE6`).
   - **2 Menu Kiri** (`.nav-group-left`: `Home`, `Accounts`) dan **2 Menu Kanan** (`.nav-group-right`: `Budget`, `Stats`) masing-masing memiliki lebar `calc(50% - 44px)` untuk menjaga zona aman di sekitar tombol `+` tengah.
   - **Ukuran Balon Kaca (`69px × 48px`)**: Balon kaca aktif (`.nav-liquid-glass-bubble`) berukuran presisi **`69px × 48px`** dengan offset penempatan simetris `translate3d(navIndicatorX - 34.5px, -50%, 0)` dan sorotan kaustik atas `69px 3.5px`. Ukuran ini wajib pas di dalam tinggi bar `62px` dan **DILARANG KERAS** menyentuh tombol `+` tengah saat berada di menu `Accounts` maupun `Budget`.
2. **Murni Kaca Kristal Monokrom (Strict Ban on Rainbow / Chromatic Rim)**:
   - **DILARANG KERAS** menambahkan cincin warna pelangi (`.glass-bubble-chromatic-rim`, cyan/magenta/orange inset shadows) pada balon kaca.
   - Balon kaca wajib murni berupa **tetesan kaca kristal bening monokrom** yang dikontrol oleh variabel `--glass-active` (`0` saat diam $\rightarrow$ `1` saat ditekan/meluncur), lengkap dengan lengkung pantulan dalam atas-bawah (*meniscus reflection* `.glass-bubble-pole-top` & `.glass-bubble-pole-bottom`) dan kilau tepi putih bersih (`.glass-bubble-specular-shell`).
3. **100% Teks & Ikon Tajam Vektor (Dual-Layer Cloned Optical Split-Color)**:
   - **DILARANG KERAS** memasang `<feDisplacementMap>` SVG filter, `backdrop-filter: blur()`, atau `text-shadow` berwarna pada lapisan teks/ikon di dalam balon kaca karena akan memaksa browser merasterisasi font menjadi bitmap pecah/blur.
   - Gunakan arsitektur **2 Lapis Vektor GPU**:
     - **Layer 1 (`.nav-base-layer`)**: Menampilkan ikon & teks tidak aktif (`#72655A`) di luar balon kaca, dan dilubangi secara presisi tepat di bawah area balon kaca menggunakan `radial-gradient(..., transparent 90%, black 98%)` (`mask-image`) agar tidak terjadi bayangan ganda (*ghosting*).
     - **Layer 2 (`.nav-lens-inner-world` di dalam `.nav-lens-refraction-stage`)**: Menampilkan klon ikon & teks aktif berwarna **Warm Amber (`#D97706`, `font-weight: 800`)** dengan kompensasi skala vektor murni (`netScaleX = iconPulse / finalScaleX`) sehingga teks yang terpotong setengah oleh pinggiran balon kaca terbelah dua warna secara tajam 100%.
4. **Fisika Membal Balon Kaca — 2D Hydro-Elastic Jelly Bounce (Jangan Diubah!)**:
   - Balon kaca memiliki pegas 2D independen (`curScaleX` & `curScaleY`) dengan frekuensi alami $\omega = 27.5$ dan redaman rendah $\zeta = 0.34$ (*underdamped spring* yang menghasilkan 2–3 ayunan kenyal).
   - **Wajib Membal Saat Menekan Menu yang Sama**: Menekan menu yang **sedang aktif** (misal sedang di `Home` lalu menekan `Home` lagi) **WAJIB** tetap memicu efek mengembang kaca bening saat ditekan (`handleNavPointerDown`: `targetScaleX = 1.09, targetScaleY = 1.05, velScaleX += 3.8, velScaleY -= 2.4`) dan membal kenyal saat dilepas/diklik (`handleNavTabClick`: `velScaleX = -4.2, velScaleY = 3.8`).
5. **Fisika Membal Bar Panjang — Gerakan Smooth "Naik $\rightarrow$ Turun $\rightarrow$ Naik" Menyatu (`curBarSink`)**:
   - Kapsul bar panjang di bawah (`.nav-glass-pill-shell` / `navContainerRef`) **WAJIB** ikut membal halus menyatu dengan balon kaca setiap kali menu ditekan maupun saat berpindah menu.
   - **DILARANG KERAS** menggunakan skala horizontal-vertikal berlawanan (`scaleX` vs `scaleY`) yang membuat bar bergetar ke samping, dan **DILARANG** membuat bar tenggelam turun terlebih dahulu.
   - Gunakan pegas halus tidak berlebihan ($\omega = 21.0, \zeta = 0.46$) dengan titik tumpu terkunci di tengah bawah (`transform-origin: 50% 100%`) dan urutan gerak **Naik dulu $\rightarrow$ Turun $\rightarrow$ Naik**:
     - **Saat ditekan / mulai berpindah menu ("Naik dulu")**: Bar tetap di posisinya lalu terangkat naik sedikit secara halus (`barTranslateY = -clampedLift * 1.9px`, `barUniformScale = 1 + clampedLift * 0.012`).
     - **Saat dilepas / mendarat ("Turun $\rightarrow$ Naik")**: Bar turun kembali ke posisi semula lalu memantul naik tipis secara *smooth* tanpa berlebihan (`transform: translate3d(0, ${barTranslateY}px, 0) scale3d(${barUniformScale}, ${barUniformScale}, 1)`).
6. **Getaran Haptic Fisik Tanpa Suara (Silent Tactile Haptics Only)**:
   - **DILARANG KERAS** memutar suara klik / synthesizer audio (`AudioContext` atau `playPopSound`) saat menekan atau menggeser menu navigasi utama (kecuali tombol `+` tengah yang memang memanggil modal).
   - Feedback taktil pada menu navigasi murni menggunakan getaran fisik hening (`navigator.vibrate(8)` saat tekan, `4ms` saat geser lintas tab, dan *elastic double-pulse* `[10, 26, 5]` saat membal).
7. **Penyeimbang Dinamis Dua Arah — Kecepatan Tangan vs Kepelanan 350ms (Bi-Directional Cadence Balancer)**:
   - **Waktu Luncur Santai/Pelan (~350ms)**:
     - Frekuensi dasar pegas kepala dikunci pada $\omega_{\text{base}} = 15.2\text{ rad/s}$ dengan redaman kritis $\zeta = 0.89$.
     - Saat pengguna berpindah menu secara santai ($\Delta t \ge 700\text{ms}$), durasi tempuh wajib meluncur anggun dan tenang tepat di kisaran **$\approx 350\text{ms}$**.
     - **DILARANG KERAS** memasang sentakan kecepatan awal (*initial kick*) pada saat santai (`speedExcess = 0`); balon wajib meluncur mulus dari keadaan diam (*rest*).
   - **Kurva Adaptif Kecepatan Cepat ($\Phi(\Delta t)$)**:
     - Rumus: $\Phi(\Delta t) = 1.0 + 0.90 \cdot \exp(-\Delta t / 320)$.
     - Jika jari mengetuk beruntun cepat ($\Delta t \le 180\text{ms}$), frekuensi $\omega$ otomatis meningkat hingga $1.65\times$ dan waktu tempuh memadat ke $\approx 160\text{ms}$ disertai impuls momentum awal agar pergerakan balon selaras dengan kecepatan tangan.
   - **Invarian Mutlak: Melar Elastisitas Tetap 100% Utuh**:
     - **DILARANG KERAS** mengubah atau merusak efek melar (*stretching elasticity*).
     - Frekuensi pegas ekor wajib diskalakan persis sebanding dengan rasio kepala: $\text{speedRatio} = \omega_{\text{lead}} / \omega_{\text{base}}$, dengan $\omega_{\text{trail}} = (5.2 + 18.0 \cdot \text{tension}) \cdot \text{speedRatio}$.
     - Ambang penahan ekor pada jarak $35\%$ (`releaseThreshold = 0.35`) dan kurva tegangan $\text{tailRelease}^{1.6}$ wajib dipertahankan agar bentuk regangan, penipisan leher (*necking*), dan kekekalan volume fluida identik pada semua kecepatan.
   - **Pemisahan Respon Taktil Sentuhan**:
     - Event `pointerdown` hanya memicu respon taktil lokal (balon sedikit mengembang dan menegang di tempat). Peluncuran transisi (*flight launch*) dieksekusi saat sentuhan ketukan selesai (`handleNavTabClick`), mencegah balon melesat prematur saat pengguna baru menaruh jari di layar.

8. **Arsitektur Baku 6 Tingkatan Liquid Glass + Latar Lingkungan Dinamis (Locked Invariant)**:
   - Bilah navigasi bawah dan gelembung lensa aktif **WAJIB** dibangun menggunakan hierarki 6 tingkatan fisika optik sejati yang terkoordinasi:
   - **Tingkat 0: Latar Belakang & Cahaya Lingkungan Dinamis (`.nav-ambient-caustic-backdrop`)**:
     - Bilah `.bottom-nav` **DILARANG KERAS** menggunakan latar gradien pekat / solid yang menutup konten aplikasi di belakangnya. Transparansi bernapas (~0% hingga 42%) wajib dipertahankan agar transaksi dan kartu yang bergulir di belakang bar terlihat nyata menembus kaca.
     - Menggunakan medan cahaya atmosferik `.nav-ambient-glow-mesh` (gradien hangat sunset amber `#F59E0B`, coral peach `#FB923C`, dan soft sky `#E0E7FF`) yang bernapas lembut.
     - Dilengkapi titik fokus cahaya kaustik belakang `.nav-ambient-caustic-spot` yang bergerak halus mengikuti posisi horizontal balon kaca (`--bubble-x-pct`).
   - **Tingkat 1: Background Layer (Transparansi Terkontrol - Regular Liquid Glass)**:
     - Kapsul dermaga `.nav-glass-pill-shell` dan badan balon kaca mempertahankan transparansi kristal (~35%–46%) dengan tint champagne hangat (`#FFFDF8` / `#F8EFDC`), **DILARANG** dicat putih pekat (opacity > 70%).
   - **Tingkat 2: Blur Layer (Difusi Optik Halus & Proteksi Keterbacaan)**:
     - Menggunakan multi-tier diffusion: `backdrop-filter: blur(28px) saturate(210%) contrast(104%)` pada dermaga dock dan `blur(18px) saturate(190%)` pada gelembung aktif `.glass-bubble-blur-layer` untuk meredam noise latar tanpa mengaburkan ketajaman teks/ikon.
   - **Tingkat 3: Refraction Layer (Pembiasan Meniskus & Dispersi Spektral Cauchy)**:
     - Lapisan refraksi optik nyata `.glass-bubble-refraction-prism` dan `.nav-pill-cauchy-prism-rim` membiaskan latar di sepanjang kelengkungan dinding cembung.
     - Menyertakan pendaran dispersi mikro Cauchy sejati ($\lambda_R = 650\text{nm}, \lambda_G = 550\text{nm}, \lambda_B = 450\text{nm}$) di batas sudut kritis kaca, menghasilkan kilauan prismatik kristal mewah.
   - **Tingkat 4: Glass Material Layer (Bodi Kaca Kristal Volumetrik & Ketebalan 3D)**:
     - Bodi kaca `.glass-bubble-material-body` memiliki ketebalan visual nyata melalui profil toroidal meniscus, kontras bifasik (Puncak Putih + Kedalaman Beer-Lambert Amber), dan multi-layered inner bevels (`inset 0 1.5px 2px rgba(255, 255, 255, 0.95)` & `inset 0 -1.5px 2.5px rgba(217, 119, 6, 0.12)`).
   - **Tingkat 5: Highlight Layer (Curved Crescent Specular Arc — Puncak Sabit Putih Terang)**:
     - Elemen terpenting identitas Liquid Glass Apple: Busur sabit putih terang benderang `.glass-bubble-crescent-arc` (`#FFFFFF` 100% luminous) di puncak kelengkungan bibir atas kapsul yang melengkung cembung mengikuti kontur tabung dan condong dinamis terhadap kemiringan sensor giroskop HP (`--glass-tilt-x`).
     - Terdapat pula busur sabit serupa pada kontur dermaga `.nav-pill-bar-crescent-arc` dan socket tombol plus `.center-add-crescent-highlight`.
   - **Tingkat 6: Liquid Glass Composite & Interaksi Responsif**:
     - Ikon dan label menu aktif mengapung tajam dengan ketajaman vektor 100% dan kontras warna Warm Amber (`#D97706`).
     - **Caustic Ground Spotlight (`.glass-bubble-ground-caustic`)**: Terdapat konsentrasi pendaran cahaya kristal hangat yang jatuh di bawah gelembung ke rel dermaga saat meluncur.
     - Dipadukan dengan elastisitas pegas fluida Navier-Stokes (elongasi Weber, konservasi volume leher tetesan) dan getaran haptik hening.

### B. Komponen Lain di Cassiel yang Menggunakan Teknik Apple Design
1. **Apple Direction-Aware Page Slide Transitions (`src/App.jsx` & `src/App.css`)**:
   - Pergantian halaman antar-tab (`Home`, `Accounts`, `Budget`, `Stats`) dihitung secara instan pada *render-pass* React (tanpa jeda `useEffect`) menggunakan kurva `cubic-bezier(0.16, 1, 0.3, 1)`.
   - Arah luncuran halaman (`tab-slide-forward` / `tab-slide-backward`) dan jarak luncuran (`--slide-dist: 26px..38px`, `--slide-dur: 280ms..390ms`) selalu selaras dengan arah dan jarak lompatan balon kaca.
2. **Apple Fluid Morphing Pill — Voice & Toast Indicator (`src/App.css`)**:
   - Ekspansi kartu/pil dinamis menggunakan 1 kurva kontinu `cubic-bezier(0.22, 1, 0.36, 1)` dari titik tengah bulat sempurna (`clip-path: inset(0% 45% 0% 45% round 999px)`) tanpa penyetan `scaleX` yang merusak sudut bulat kapsul, serta menutup kembali secara simetris (`cardFluidDeleteShrink`).
3. **Apple Fluid Interface Chat Send Motion (`GroupDetailScreen.jsx` & `groups.css`)**:
   - Pesan grup baru muncul seketika (*zero-latency*) dari poros sudut bawah (`transform-origin: 100% 100%` / `0% 100%`) dengan pegas *critically-damped* `cubic-bezier(0.22, 1, 0.36, 1)` dan *interruptible spring scroll* berbasis `requestAnimationFrame` yang langsung berhenti saat layar disentuh jari.
4. **Segmented Sliding Pill Indicators & Rolling Cash Counter (`Home`)**:
   - Tab filter Pemasukan/Pengeluaran di Home menggunakan indikator pil melayang (`.home-tx-filter-indicator`) yang meluncur secara fisik (`translateX`), dipadukan dengan animasi angka bergulir (*rolling cash counter* + `tabular-nums`) saat total nominal berubah.
5. **Edge-Swipe Back Gesture & Tactile Spring Buttons**:
   - Seluruh modal mendukung gestur usap tepi kiri bergaya iOS (`touchStartX <= 50px`, `deltaX >= 50px`, `duration < 550ms`), dan tombol aksi di seluruh aplikasi menggunakan respon sentuh elastis Apple (`cubic-bezier(0.34, 1.56, 0.64, 1)`).

---

## 49. Bahasa Pemrograman Mandiri `.lgr` (Liquid Glass Redi) & Acuan Desain Kaca Cair

> [!NOTE]
> **KODE PEMROGRAMAN SENDIRI: `.lgr` (LIQUID GLASS REDI)**
> 
> Di dalam proyek **Cassiel (Finance Tracker)** ini, terdapat direktori dan ekosistem bahasa pemrograman mandiri bernama **Liquid Glass Redi (`.lgr`)** pada folder [`liquid-glass-redi/`](file:///c:/Users/GC/Desktop/finance%20tracker/liquid-glass-redi).
> 
> Berkas `.lgr` dan engine kompilatornya menjadi **acuan utama dan standar baku desain optik liquid glass** bersama dengan skill Apple Design (`apple-design`), membawa simulasi fisika sejati ke antarmuka aplikasi.
> 
> **Repositori Resmi GitHub**:
> 👉 [**redilah/.lgr-liquid-glass-redi**](https://github.com/redilah/.lgr-liquid-glass-redi): *New kode for create a liquid glass*

### A. Konsep & Arsitektur Utama `.lgr`
- **Tujuan**: Bahasa pemrograman deklaratif fisika dan engine render hardware GPU untuk menghasilkan efek *Liquid Crystal Glass* fotorealistik secara real-time (60–120 FPS) mandiri tanpa ketergantungan pada ekosistem eksklusif macOS/Apple Silicon maupun keterbatasan styling CSS/DOM.
- **Acuan Desain Bersama Apple Design**: Selain panduan Apple iOS Liquid Glass, implementasi visual kaca cair di Cassiel mengacu pada prinsip optik & mekanika fluida yang didefinisikan dalam `.lgr`:
  1. **Hukum Snellius & Dispersi Spektral Cauchy ($n(\lambda) = A + B/\lambda^2$)**: Memecah refraksi menjadi 3 panjang gelombang ($\lambda_R = 650\text{nm}, \lambda_G = 550\text{nm}, \lambda_B = 450\text{nm}$) untuk kilau prismatik mikro di tepi meniskus.
  2. **Kekekalan Volume Fluida Navier-Stokes (Bilangan Weber $We$)**: Dinamika renggangan tetesan kaca cair saat meluncur ($S_x$) dan pengempisan sumbu tegak lurus ($S_y$) agar massa konstan.
  3. **Tegangan Permukaan Marangoni & Koalesensi Tetesan (*Metaballs*)**: Transisi leher cairan (*liquid necking*) elastis antar-tetesan tanpa garis sambungan kaku.
  4. **Hukum Kontras Bifasik & Riak Air Kapiler LGR**: Mengatasi *Contrast Collapse* pada tema terang/krem (`#F8EFE6` / `#F5EBE1`) dengan pasangan Puncak Putih Berlian (`#FFFFFF`) dan Lembah Refraksi Beer-Lambert (*Warm Champagne-Amber*).
  5. **Invarian Keseimbangan 1:1 saat Diam**: Mengunci magnifikasi tepat `1.0000x` dan offset `0.0px` ketika berhenti di atas elemen menu untuk mencegah distorsi teks.

### B. Struktur File & Toolchain `.lgr` di Workspace
- [`liquid-glass-redi/examples/crystal_redi.lgr`](file:///c:/Users/GC/Desktop/finance%20tracker/liquid-glass-redi/examples/crystal_redi.lgr): Berkas sumber contoh bahasa LGR (`CrownCrystalRedi` & `DiamondPrismRedi`).
- [`liquid-glass-redi/compiler/`](file:///c:/Users/GC/Desktop/finance%20tracker/liquid-glass-redi/compiler): Rangkaian compiler mandiri (`lexer.js`, `parser.js`, `analyzer.js`, `codegen.js`, `lgrc.js`).
- [`liquid-glass-redi/physics/`](file:///c:/Users/GC/Desktop/finance%20tracker/liquid-glass-redi/physics): Mesin fisika fluida RK4 Orde-4 & Navier-Stokes (`hydroEngine.js`).
- [`liquid-glass-redi/shaders/`](file:///c:/Users/GC/Desktop/finance%20tracker/liquid-glass-redi/shaders): Kernel optik hardware GPU GLSL multi-pass (`opticalKernel.js`).
- [`liquid-glass-redi/lab/`](file:///c:/Users/GC/Desktop/finance%20tracker/liquid-glass-redi/lab): Laboratorium visual interaktif 120 FPS dengan Live `.lgr` compiler.
- **Dokumentasi Spesifikasi**:
  - [`LGR_LANGUAGE_SPEC.md`](file:///c:/Users/GC/Desktop/finance%20tracker/liquid-glass-redi/LGR_LANGUAGE_SPEC.md): Spesifikasi tata bahasa formal EBNF bahasa `.lgr`.
  - [`LGR_MASTER_PLAN.md`](file:///c:/Users/GC/Desktop/finance%20tracker/liquid-glass-redi/LGR_MASTER_PLAN.md): Roadmap pengembangan rekayasa LGR.
  - [`LGR_RESEARCH_MASTER.md`](file:///c:/Users/GC/Desktop/finance%20tracker/liquid-glass-redi/LGR_RESEARCH_MASTER.md): Bedah komparatif Apple Liquid Glass vs LGR.

### C. Standalone LGR Lab & Isomorphic Node/Browser Module Invariants
1. **Standalone Lab Server & Clean URLs (Port 4321)**:
   - Visual workbench mandiri LGR dilayani di **Port 4321** via skrip `node liquid-glass-redi/serve-lab.js` (BUKAN Vite port 5173 atau protokol `file:///`).
   - Server wajib mendukung clean URL `/` dan `/lab` yang secara otomatis mengarah ke `/lab/index.html`.
2. **Isomorphic Browser & Node Module Boundary**:
   - Modul compiler (`compiler/lgrc.js`) dan SDK (`runtime/lgrRuntime.js`) wajib 100% aman dijalankan di lingkungan browser tanpa dependensi Node statis (`node:fs`, `node:path`).
   - Seluruh pemanggilan modul filesystem Node wajib dibungkus deteksi runtime dinamis (`if (typeof process !== 'undefined' && process.versions?.node)`) agar tidak memicu error CORS atau kegagalan pemuatan sumber daya (`net::ERR_FAILED`) di browser Chromium.
3. **Loop Telemetry Resilience (Anti-Undefined `.toFixed()`)**:
   - Seluruh properti objek hasil komputasi/simulasi di dalam loop `tick()` (`requestAnimationFrame`) wajib menggunakan nullish coalescing guard (misalnya: `(computeRep.dispatchTimeMs || 0).toFixed(2)` alih-alih `computeRep.executionTimeMs`) untuk mencegah *TypeError* yang membekukan rendering dan interaksi input.
4. **Universal Pointer & Drag Fallbacks**:
   - Elemen interaktif kaca fluida (Stage 1 & Stage 2) wajib mendukung event pointer lengkap (`pointerdown`, `mousedown`, `touchstart`) dengan tracking pergerakan pada `window` agar interaksi drag tidak terputus saat kursor keluar dari batas canvas.

---

## 50. Cassiel Inertial Jelly Engine (HP Goyang → UI Kenyal Searah Goyangan)

> [!NOTE]
> UI bergerak kenyal **searah sumbu goyangan HP** (HP naik-turun → UI naik-turun, kiri-kanan → kiri-kanan) dan **hanya aktif saat HP digoyang**. Engine: [jellyPhysics.js](file:///c:/Users/GC/Desktop/finance%20tracker/src/utils/jellyPhysics.js).

### A. Referensi Dunia Nyata yang Diterjemahkan
1. **Prinsip d'Alembert (kerangka non-inersia)**: layar = kerangka dipercepat, tiap elemen merasakan gaya semu $F = -m\,a_{hp}$. HP disentak ke atas → konten tertinggal ke bawah dulu → memantul naik-turun.
2. **Android SpringForce** (androidx.dynamicanimation): DAMPING_RATIO_MEDIUM_BOUNCY = 0.5, STIFFNESS_LOW = 200 ($\omega \approx 14$ rad/s) sebagai basis karakter jelly.
3. **Glenn Fiedler "Fix Your Timestep!"**: integrasi langkah tetap 240 Hz + akumulator (semi-implicit Euler) → identik di 60/90/120 Hz.
4. **Disney Squash & Stretch**: kekekalan luas $s_x s_y = 1$.

### B. Hukum Inersia Jelly Cassiel
$$\ddot{x}_i = -\omega_i^2 x_i - 2\zeta_i\omega_i\dot{x}_i - m_i\,a_{layar}(t-\tau_i)$$
$$x_{tampil} = X_{max}\tanh(x_i/X_{max}),\quad \sigma = 0.045\tanh(y/8),\quad s_y = e^{-\sigma},\ s_x = e^{\sigma}$$
- Lapisan (ω, ζ, m, τ): top (17, 0.52, 0.70, 0ms), hero (14, 0.46, 1.00, 14ms), mid (15, 0.48, 0.90, 26ms), body (13.5, 0.50, 0.80, 38ms), dock/menu bar (15.5, 0.44, 1.10, 50ms).
- Jeda gelombang $\tau_i$ dibaca dari ring buffer riwayat percepatan (bukan setTimeout).
- Sentakan uji = HP digerakkan kontinu ke arah sentakan 90ms lalu kembali (bukan impuls kecepatan instan), agar konten tertinggal berlawanan arah dulu secara fisis.

### C. Invarian Wajib (Anti Kaku & Patah-Patah)
- **DILARANG** menulis CSS variable ke :root / documentElement per frame (memicu recalc style seluruh dokumen). Transform wajib ditulis langsung ke elemen via properti individual el.style.translate / scale / rotate (tidak menimpa transform bawaan, mis. inline transform menu bar).
- **DILARANG** clamp keras (Math.min/max) pada posisi tampil; wajib saturasi lunak tanh.
- **DILARANG** transform permanen pada #root (merusak position: fixed). Translate #root hanya saat simulasi desktop aktif lalu dikosongkan.
- Saat energi di bawah ambang dan tanpa input: RAF berhenti, seluruh style inline dikosongkan (0% CPU).

### D. Sensor Gerak HP Nyata & Pengujian
- **HP nyata**: devicemotion → e.acceleration (fallback high-pass α = 0.9 dari accelerationIncludingGravity), dipetakan ke koordinat layar + koreksi screen.orientation.angle, deadzone 0.6 m/s², bangun saat > 1.8 m/s², skala 110 px per m/s².
- **Invarian Produksi**: Tombol penguji segitiga di localhost telah dihapus setelah pengujian selesai. Sistem 100% didorong oleh sensor gerak perangkat fisik (`devicemotion`) tanpa elemen overlay tambahan.
- Balon kaca menu bar menerima impuls arah via registerJellyShakeListener.

# 💰 Cassiel — Personal Finance Tracker

> Aplikasi pencatat keuangan pribadi yang cerdas, ultra-responsif, aman, dan offline-first. Dilengkapi dengan **Input Transaksi Berbasis Voice AI Majemuk**, **Sistem Mata Uang 1 Dunia & Kurs Real-Time**, **Multi-Bahasa (Termasuk Romaja Korea & Basa Jawa)**, **Keamanan PIN & Biometrik Sidik Jari**, **Manajemen Multi-Akun & Sebaran Aset 3-Metrik**, **Cadangan Data Dokumen & Google Drive**, **Interactive Monthly Stats Bar Chart**, **Direct Budget Editing & Gaming EXP Bar**, **Live Category Insight Engine**, **Animasi Mesin Hitung Uang (Cash Counter)**, serta klasifikasi finansial otomatis yang dirancang khusus untuk pola pengeluaran sehari-hari.

---

## 📖 Daftar Isi

- [Tentang Cassiel](#tentang-cassiel)
- [Fitur Utama](#fitur-utama)
- [💳 Manajemen Multi-Akun & Sebaran Aset](#-manajemen-multi-akun--sebaran-aset)
- [🌍 Sistem Mata Uang Dunia & Kurs Real-Time](#-sistem-mata-uang-dunia--kurs-real-time)
- [🌐 Multi-Bahasa (i18n)](#-multi-bahasa-i18n)
- [🎙️ Input Transaksi Suara (Voice AI Engine)](#️-input-transaksi-suara-voice-ai-engine)
- [🔒 Keamanan PIN & Biometrik Sidik Jari](#-keamanan-pin--biometrik-sidik-jari)
- [💾 Cadangan & Pemulihan Data (Google Drive Support)](#-cadangan--pemulihan-data-google-drive-support)
- [🎯 Direct In-Place Budget & Gaming EXP Bar](#-direct-in-place-budget--gaming-exp-bar)
- [📊 Analisis Statistik & Monthly Bar Chart Switcher](#-analisis-statistik--monthly-bar-chart-switcher)
- [⏱️ Category Insight & Live Countdown Engine](#️-category-insight--live-countdown-engine)
- [🔔 Notifikasi Finansial Cerdas & Auto-Purge](#-notifikasi-finansial-cerdas--auto-purge)
- [🎛️ Bilah Filter Transaksi Segmen & Quick Dropdown](#️-bilah-filter-transaksi-segmen--quick-dropdown)
- [🏷️ Sistem Kategori & Smart Frequency Ranking](#️-sistem-kategori--smart-frequency-ranking)
- [🛡️ Keamanan & Integritas Data](#️-keamanan--integritas-data)
- [📱 Android Edge-Swipe Gesture](#-android-edge-swipe-gesture)
- [🔄 In-App Update Engine & Dynamic Target APK](#-in-app-update-engine--dynamic-target-apk)
- [📊 Admin Dashboard & Telemetri Privasi](#-admin-dashboard--telemetri-privasi)
- [🛠️ Tech Stack](#️-tech-stack)
- [📂 Struktur Proyek](#-struktur-proyek)
- [🚀 Cara Menjalankan (Development)](#-cara-menjalankan-development)
- [📦 Build & Deploy](#-build--deploy)
- [🤖 Build APK Android & Panduan Rilis](#-build-apk-android--panduan-rilis)
- [💾 Penyimpanan Data (Storage Schema)](#-penyimpanan-data-storage-schema)
- [📜 Versi & Changelog](#-versi--changelog)

---

## Tentang Cassiel

**Cassiel** adalah aplikasi pencatat keuangan pribadi yang dibangun dengan filosofi **offline-first & zero-data-leakage** — seluruh data transaksi tersimpan aman di perangkat lokal pengguna tanpa mengharuskan pendaftaran akun atau koneksi internet untuk operasional sehari-hari.

Nama "Cassiel" terinspirasi dari malaikat penjaga waktu dan catatan — merepresentasikan komitmen aplikasi ini untuk menjaga rekam jejak keuangan pengguna dengan teliti, disiplin, dan jujur.

Cassiel tersedia dalam dua platform:
- **Android Native APK** — dibangun dengan Capacitor 8, sangat ringan (~3.8 MB), hemat daya, dan responsif dengan integrasi native speech recognition tanpa pop-up dialog sistem.
- **Progressive Web App (PWA)** — dapat diakses langsung dari browser modern dengan performa instan dan offline support.

---

## Fitur Utama

### 💳 Manajemen Multi-Akun & Sebaran Aset 3-Metrik
- **Multi-Dompet Terisolasi**: Atur saldo terpisah untuk Bank (BCA, Mandiri, BRI, BNI, Jago, dll.), E-Wallet (GoPay, OVO, Dana, ShopeePay), dan Tunai (Cash).
- **Sebaran Aset 3-Metrik**: Menampilkan ringkasan portofolio terisolasi di kartu hero halaman Akun: *Rekening Bank*, *E-Wallet*, dan *Kartu Kredit*.
- **Filter Arus Kas Cepat**: Filter transaksi per sumber dana dengan animasi mesin hitung uang (*Cash Counter Rolling Animation*).

### 🌍 Multi-Currency & Live Exchange Rates (1 Dunia)
- **Database Mata Uang Global**: Mendukung seluruh mata uang dunia utama (IDR, USD, EUR, JPY, GBP, KRW, SGD, MYR, AUD, SAR, AED, CNY, dll.) dengan bendera resmi berkualitas tinggi (*FlagCDN*).
- **Live Exchange Rate Engine**: Integrasi kurs *real-time* otomatis via Open Exchange Rates API dengan sistem *smart caching* 30 menit hemat kuota serta fallback luring aman.
- **Rupiah Prioritas No. 1**: IDR berada di posisi teratas sebagai mata uang utama bawaan aplikasi.

### 🌐 Multi-Language Engine (i18n)
- **5 Pilihan Bahasa Dinamis**:
  1. **Bahasa Indonesia (Default)**
  2. **English**
  3. **Basa Jawa** (Krama Alus Mataraman)
  4. **Mandarin** (Pinyin Latin ABC)
  5. **Bahasa Korea** (Romaja Latin Alphabet ABC)
- **Kaidah 1 Kata**: Label form transaksi menggunakan 1 kata murni yang padat, presisi, dan proporsional di seluruh bahasa.

### 🎙️ Voice AI Transaction Engine (Canggih & Majemuk)
- **Compound Commands**: Mendukung perintah majemuk dalam satu ucapan (misal: *"hapus bakwan lalu beli kopi 20rb dan bensin 30rb"*).
- **Scored Relevance Token Matcher**: Penghapusan transaksi via suara cukup dengan menyebutkan kata kunci parsial.
- **Self-Repair & Ralat**: Deteksi otomatis koreksi ucapan pengguna (*"beli mie ayam ralat bakso 15 ribu"*).
- **Seamless Native Mic**: Tombol mic berdenyut halus (*pulsing wave*) langsung di dalam aplikasi tanpa popup dialog Google.

### 🔒 Keamanan PIN & Biometrik Native
- **PIN 6 Digit**: Layar kunci PIN elegan dengan proteksi brute-force, konfirmasi ganda saat setup, dan opsi ubah PIN kapan saja.
- **Autentikasi Sidik Jari (Fingerprint / Biometric)**: Terintegrasi langsung dengan sensor biometrik perangkat Android menggunakan `@capgo/capacitor-native-biometric`.

### 💾 Cadangan & Pemulihan Universal
- **Format File Dokumen Bersih (`.txt`)**: Struktur JSON terenkapsulasi yang universal dan bebas penolakan MIME type OS.
- **Native Android Share Sheet**: Mendukung langsung opsi **"Simpan ke Google Drive"**, File Manager, WhatsApp, maupun email.
- **Restore & Merge**: Pemulihan data tanpa risiko kehilangan konfigurasi pengaturan pengguna.

### 🎯 Direct In-Place Budget & Gaming EXP Bar
- **Touch-to-Edit Budget**: Nominal batas pengeluaran bulanan di hero card dapat langsung disentuh untuk memunculkan keyboard angka/kalkulator tanpa modal terpisah.
- **Gaming Arcade EXP Progress Bar**: Indikator persentase pemakaian budget bergaya bilah HP/EXP game futuristik dengan gradien dinamis (Cyber Neon Emerald, Amber Energy, Hyper Coral Red).
- **No-Red Limit Invariant**: Kategori yang mencapai limit menggunakan warna Warm Amber yang elegan tanpa warna merah kaku.

### 📊 Monthly Stats Switcher & Bar Chart
- **Interaktif Bar Chart**: Visualisasi tren pengeluaran dan pemasukan bulanan yang jelas.
- **Pie Chart Stats**: Diagram lingkaran pengeluaran dengan garis penunjuk lurus (*leader line*) presisi horizontal sejajar nama kategori.
- **Month-to-Month Switcher**: Navigasi cepat antar bulan untuk membandingkan performa finansial historis.

---

## 💳 Manajemen Multi-Akun & Sebaran Aset

Cassiel menyediakan tata kelola akun keuangan terstruktur dan terisolasi:

```
┌─────────────────────────────────────────────────────────┐
│                 Kartu Hero Halaman Akun                 │
│         Sebaran Aset Mandiri & Portofolio Riil          │
├───────────────────┬───────────────────┬─────────────────┤
│   🏦 Bank Resmi   │   📱 E-Wallet     │ 💳 Kartu Kredit │
│   (BCA, Mandiri)  │  (GoPay, OVO, ..) │ (Limit/Tagihan) │
└───────────────────┴───────────────────┴─────────────────┘
```

- **Independent Amount State**: Nominal pada form input Expense dan Income terisolasi mandiri sehingga tidak tertukar atau hilang saat berganti tab.
- **Seamless Account Adjustment**: Penyesuaian saldo awal dan koreksi nominal secara aman tanpa merusak riwayat transaksi terdahulu.

---

## 🌍 Sistem Mata Uang Dunia & Kurs Real-Time

Cassiel menghadirkan mesin konversi dan pemformatan mata uang global yang fleksibel:

```
┌─────────────────────────────────────────────────────────┐
│              Open Exchange Rates API                    │
│        https://open.er-api.com/v6/latest/IDR            │
└────────────────────────────┬────────────────────────────┘
                             │ (Background Fetch & Cache 30 Min)
┌────────────────────────────▼────────────────────────────┐
│               Cassiel Currency Engine                   │
│   - Multi-Currency Database + FlagCDN Assets           │
│   - Offline Fallback Baseline Rates                    │
│   - Dynamic Amount Formatter (fmtMoney)                 │
└────────────────────────────┬────────────────────────────┘
                             │
     ┌───────────────────────┼───────────────────────┐
     ▼                       ▼                       ▼
┌──────────────┐     ┌──────────────┐     ┌────────────────┐
│  Dashboard   │     │ Transactions │     │    Category    │
│ Balance Card │     │  Daily Rows  │     │    Insights    │
└──────────────┘     └──────────────┘     └────────────────┘
```

- **Pencarian Cepat**: Filter mata uang berdasarkan nama negara, kode ISO (USD, EUR, KRW), atau simbol (`$`, `₩`, `€`, `Rp`).
- **Scrollbar Elegan**: Navigasi daftar mata uang dilengkapi scrollbar minimalis dengan *fixed search header* yang rapi.

---

## 🌐 Multi-Bahasa (i18n)

Aplikasi terhubung secara dinamis ke kamus multi-bahasa `src/utils/i18n.js`:

| Fitur / Layar | Bahasa Indonesia | English | Basa Jawa | Mandarin (ABC) | Korea (Romaja) |
|---|---|---|---|---|---|
| **Home** | Beranda | Home | Kaca Utama | Shouye | Hom |
| **Stats** | Statistik | Statistics | Statistik | Tongji | Tonggye |
| **Add Button** | *(Ikon Melayang +)* | *(Icon Only)* | *(Icon Only)* | *(Icon Only)* | *(Icon Only)* |
| **Tanggal** | Tanggal | Date | Titimangsa | Riqi | Naljja |
| **Jumlah** | Jumlah | Amount | Gunggung | Jine | Geumaek |
| **Kategori** | Kategori | Category | Kategori | Fenlei | Bungnyu |
| **Akun** | Akun | Account | Wadhah | Zhanghu | Gyejwa |
| **Catatan** | Catatan | Note | Cathetan | Beizhu | Memo |
| **Simpan** | Simpan | Save | Simpen | Baocun | Jeojang |

---

## 🎙️ Input Transaksi Suara (Voice AI Engine)

Mesin pemroses suara cerdas Cassiel mengekstrak seluruh parameter transaksi dari ucapan alami secara lokal:

```
                  ┌─────────────────────────────────┐
                  │   Suara Pengguna (Mic Input)     │
                  └────────────────┬────────────────┘
                                   │
               ┌───────────────────▼───────────────────┐
               │ Capacitor Speech / Web Speech Engine  │
               └───────────────────┬───────────────────┘
                                   │ (Raw Transcript)
               ┌───────────────────▼───────────────────┐
               │   STT Noise Filter & Sanitizer        │
               │   (Punctuation, Noise, Self-Repair)   │
               └───────────────────┬───────────────────┘
                                   │
      ┌────────────────────────────┴────────────────────────────┐
      ▼                                                         ▼
┌───────────────┐                                       ┌───────────────┐
│ Number Parser │ ("dua puluh lima ribu", "25rb", "5jt")│ Regex Filters │
└───────┬───────┘                                       └───────┬───────┘
        │                                                       │
        └──────────────────────────┬────────────────────────────┘
                                   │
               ┌───────────────────▼───────────────────┐
               │      Dynamic Category Classifier      │
               │  - Pre-defined Multi-Language Dict    │
               │  - Learned User Aliases (Local AI)    │
               │  - Levenshtein & Jaro-Winkler Fuzzy   │
               └───────────────────┬───────────────────┘
                                   │
                                   ▼
        { type: "expense", amount: 25000, categoryId: "bensin", account: "QRIS", note: "bensin" }
```

---

## 🔒 Keamanan PIN & Biometrik Sidik Jari

Cassiel mengamankan akses aplikasi dengan lapisan proteksi ganda:
1. **PIN Lock Screen**: Layar input PIN 6 digit yang responsif dengan haptic feedback dan animasi transisi halus (`background: var(--bg-app, #F8EFE6)`).
2. **Native Biometric Support**: Opsi login cepat menggunakan sidik jari / face unlock bawaan smartphone pengguna.
3. **Authentic Vector Path**: Ikon sidik jari menggunakan vector path asli (`src/assets/fingerprint.svg`) untuk tampilan tajam anti-broken.

---

## 💾 Cadangan & Pemulihan Data (Google Drive Support)

- **One-Click Export**: Mengekspor seluruh data keuangan ke dalam berkas dokumen teks (`.txt`).
- **Android Native Intent**: Mengirimkan berkas langsung ke dialog share bawaan Android, memungkinkan penyimpanan instan ke **Google Drive**, **File Manager**, atau media perpesanan.
- **Restore & Merge**: Pemulihan data tanpa risiko kehilangan konfigurasi pengaturan pengguna.

---

## 🎯 Direct In-Place Budget & Gaming EXP Bar

- **Direct In-Place Editing**: Sentuh nominal budget pada kartu hero untuk langsung mengubah batas pengeluaran bulanan tanpa jendela popup tambahan.
- **Gaming Arcade EXP Progress Bar**: Menampilkan sisa budget dalam persentase visual yang tajam, modern, dan bebas garis tepi kaku (*borderless*).
- **Animasi Kilau Gloss & Strip**: Efek kilau dinamis bergaya bilah HP/EXP game.
- **Kondisi Dinamis**: Bar berubah warna secara cerdas dari Cyber Neon Emerald (Aman) → Amber Energy (Peringatan/Limit) → Hyper Coral Red (Over-budget).

---

## 📊 Analisis Statistik & Monthly Bar Chart Switcher

- **Grafik Batang Komparatif**: Menampilkan perbandingan riil total pemasukan vs pengeluaran setiap bulan.
- **Distribusi Kategori**: Diagram persentase pengeluaran berdasarkan masing-masing kategori belanja dengan leader line sejajar nama kategori.
- **Selector Bulan Mudah**: Tombol pill ringkas (`MONTH_SHORT_I18N`) untuk menelusuri rekap keuangan masa lampau.

---

## ⏱️ Category Insight & Live Countdown Engine

Sistem analitik berbasis perilaku belanja lokal yang memberikan wawasan disiplin finansial:
- Menganalisis frekuensi dan interval belanja setiap kategori.
- Menyajikan **Live Countdown Timer** yang menghitung sisa waktu menuju target jeda belanja yang disarankan.
- Narasi kisah pengeluaran (*Spending Story*), transaksi terbesar, metode pembayaran utama, dan perbandingan tren bulanan.

---

## 🔔 Notifikasi Finansial Cerdas & Auto-Purge

- **Scheduled Daily Reminder**: Mengingatkan pencatatan transaksi harian secara konsisten.
- **Auto-Purge Pending Notification**: Membersihkan antrean notifikasi kadaluarsa sebelum menjadwalkan notifikasi fresh untuk mencegah notifikasi kotak hitam tertinggal di OS.
- **Aset Notifikasi Terpisah**: `ic_large_icon.png` (resolusi tinggi berwarna) untuk thumbnail kanan dan `ic_stat_icon.png` (siluet monokrom putih bersih) untuk status bar Android.

---

## 🎛️ Bilah Filter Transaksi Segmen & Quick Dropdown

- **Segmented Income / Expense Filter**: Navigasi cepat penyaringan transaksi dengan animasi sliding indicator mulus.
- **Click Isolation & Independent Trigger**: Menekan tab Expense hanya memindahkan filter tanpa memunculkan dropdown secara otomatis.
- **Quick Date Filter Dropdown**: Dropdown filter tanggal (*Bulan Ini*, *Kemarin*, *3 Hari Lalu*, *1 Minggu Lalu*, *2 Minggu Lalu*) dibuka secara eksklusif hanya melalui tombol panah chevron (▼) di sisi kanan tombol Expense dengan penyelarasan optik presisi.

---

## 🏷️ Sistem Kategori & Smart Frequency Ranking

- **21+ Kategori Pengeluaran (Expense)**: `food`, `bioskop`, `transport`, `barber`, `skincare`, `edukasi`, `galon`, `fashion`, `supermarket`, `sub`, `pesawat`, `kost`, `coffee`, `gofood`, `sepatu`, `donasi`, `topupGame`, `bensin`, `konser`, `pulsa`, `rumahSakit`, `obatSakit`, dll.
- **6+ Kategori Pemasukan (Income)**: `gaji`, `bonus`, `kip`, `investasi`, `bisnis`, `affiliate`, dll.
- **Category-Bound Pastel Palette**: Setiap kategori memiliki warna balok pastel mewah permanen tanpa selektor urutan baris `:nth-child`.
- **Dynamic Smart Frequency Ranking**: Kategori dan akun yang paling sering/terakhir digunakan secara otomatis berada di posisi terdepan.

---

## 🛡️ Keamanan & Integritas Data

1. **Local-First Isolation**: Seluruh riwayat transaksi keuangan tersimpan privat di perangkat lokal.
2. **Seamless In-Place Update**: Seluruh pembaruan aplikasi dirancang mendukung update langsung tanpa perlu uninstall (menjaga data `localStorage` tetap 100% utuh).
3. **In-App Update Signature Integrity**: Pengecekan checksum SHA-256 dan validasi URL download terpercaya sebelum mengizinkan pembaruan aplikasi.
4. **Firestore Rules Hardening**: Aturan Firestore terkunci rapat — hanya mengizinkan pengiriman metrik telemetri agregat perangkat tanpa akses membaca data pribadi pengguna lain.

---

## 📱 Android Edge-Swipe Gesture

Sistem navigasi tombol kembali fisik dan usap tepi layar (*edge-swipe gesture*) bertingkat:
- **Tingkat 1**: Menutup modal, image cropper, budget cap popup, atau update dialog yang aktif.
- **Tingkat 2**: Menutup Full-Page Profile Screen dan kembali ke layar Home.
- **Tingkat 3**: Mengembalikan tab non-Home ke tab Home.
- **Tingkat 4**: Menampilkan toast konfirmasi ganda sebelum memanggil `App.exitApp()`.

---

## 🔄 In-App Update Engine & Dynamic Target APK

Aplikasi dilengkapi mekanisme pembaruan mandiri yang cerdas:
- **GitHub API Zero-Cache Fetching**: Melewati cache CDN Fastly untuk mendeteksi update terbaru secara instan.
- **Dynamic Routing**: Otomatis mengarahkan unduhan sesuai tipe instalasi pengguna:
  - **`Cassiel.apk` / `Cassiel-Release.apk`**: Aplikasi resmi bertanda tangan Release Key (`CN=Redilah`).
  - **`Udin.apk` / `udin.apk`**: Aplikasi demo mandiri ber-ID klon (`com.redilah.udin`).
  - **`cassielll1.apk`**: Build sideload debug tanpa konflik signature.

---

## 📊 Admin Dashboard & Telemetri Privasi

Panel admin (`/?admin`) memisahkan ranah teknis dan privasi secara ketat:
- **Tab 1 (Telemetry)**: Menampilkan metrik teknis perangkat, versi aktif, dan nama profil asli untuk keperluan pemecahan masalah teknis.
- **Tab 2 (AI Learning)**: Menyamarkan identitas pengguna dengan kode enkripsi privasi (`enc:v1:...`) dan hanya memfilter pengguna dengan data insight aktif.

---

## 🛠️ Tech Stack

| Layer | Teknologi |
|---|---|
| **Core Framework** | React 19, Vite 8 |
| **Mobile Runtime** | Capacitor 8 (Android & iOS Platform) |
| **Speech Engine** | `@capacitor-community/speech-recognition`, Web Speech API |
| **Biometrics** | `@capgo/capacitor-native-biometric` |
| **Notifications** | `@capacitor/local-notifications` |
| **Filesystem & Sharing** | `@capacitor/filesystem`, `@capacitor/share` |
| **Currency & Flags** | Open Exchange Rates API, FlagCDN |
| **Icons & UI** | Custom Hand-crafted SVGs, Lucide React |
| **Styling** | Modern Vanilla CSS (Fluid Design, Glassmorphism, Theme Engine) |
| **Audio Synthesis** | Web Audio API (Synthesized Oscillators) |
| **Telemetry & Cloud** | Firebase Firestore (Anonymous Device Metrics) |
| **Code Quality** | OxLint |

---

## 📂 Struktur Proyek

```
finance-tracker/
├── src/
│   ├── App.jsx                  # Komponen inti aplikasi & router tampilan
│   ├── App.css                  # Desain visual global & sistem tema
│   ├── main.jsx                 # Entry point React
│   ├── index.css                # Style dasar & tipografi
│   ├── assets/                  # Kumpulan ikon SVG kategori & audio
│   ├── components/
│   │   ├── VoiceMicButton.jsx   # Tombol interaktif perekam suara AI
│   │   ├── CategoryInsightScreen.jsx # Layar analitik & live countdown insight
│   │   ├── GuidedTourModal.jsx  # Panduan interaktif aplikasi (Guided Tour)
│   │   ├── PinLockScreen.jsx    # Layar kunci PIN 6 digit & Biometrik
│   │   ├── PinSetupModal.jsx    # Modal pengaturan & perubahan PIN
│   │   └── admin/
│   │       ├── AdminDashboard.jsx    # Dashboard telemetri & AI learning admin
│   │       └── AdminDashboard.css
│   └── utils/
│       ├── accountLogos.jsx     # Peta logo rekening & e-wallet
│       ├── authPin.js           # Mesin verifikasi PIN & biometrik
│       ├── backup.js            # Engine ekspor/impor cadangan data & Google Drive
│       ├── categoryInsightEngine.js # Mesin kalkulasi jeda & wawasan kategori
│       ├── communityBenchmark.js# Perbandingan belanja komunitas lokal
│       ├── currency.js          # Mesin mata uang 1 dunia & live exchange rates
│       ├── feedback.js          # Pengiriman saran pengguna ke developer
│       ├── firebase.js          # Inisialisasi Firebase Firestore
│       ├── fuzzyMatch.js        # Algoritma fuzzy string matching
│       ├── i18n.js              # Engine multi-bahasa (ID, EN, JV, ZH, KO)
│       ├── noiseFilter.js       # Pembersih noise transkrip suara & tanda baca
│       ├── notifications.js     # Manajemen notifikasi lokal & auto-purge
│       ├── notificationTracker.js# Pelacak riwayat interaksi notifikasi
│       ├── safetyGuard.js       # Sanitasi input & pencegahan manipulasi data
│       ├── secureStorage.js     # Storage wrapper dengan validasi integritas
│       ├── soundFeedback.js     # Audio synthesizer feedback positif
│       ├── telemetry.js         # Pengiriman metrik perangkat anonim
│       ├── version.js           # Sistem in-app update checker & target routing
│       ├── voiceLearner.js      # Mesin pembelajaran kebiasaan kata lokal
│       ├── voiceParser.js       # Natural Language Parser suara majemuk Indonesia
│       └── widgetSync.js        # Sinkronisasi data widget Android
├── public/
│   ├── version.json             # Manifest metadata versi APK
│   ├── favicon.svg              # Logo favicon
│   └── audio/                   # Audio asset pendukung
├── apk/                         # Direktori penyimpanan seluruh output berkas APK
│   ├── Cassiel.apk              # Rilis APK Android resmi (Signed Release)
│   ├── Cassiel-Release.apk      # Mirror rilis APK release
│   ├── cassielll1.apk           # APK pengujian debug sideload
│   └── Udin.apk                 # APK demo klon mandiri (com.redilah.udin)
├── android/                     # Source project Android native (Capacitor)
├── Cassiel.apk                  # Root mirror APK rilis resmi
├── Cassiel-Release.apk          # Root mirror APK rilis resmi
├── cassielll1.apk               # Root mirror APK sideload debug
├── udin.apk                     # Root mirror APK demo klon
├── capacitor.config.json        # Konfigurasi Capacitor
├── package.json
├── vite.config.js
└── firestore.rules
```

---

## 🚀 Cara Menjalankan (Development)

### Prasyarat:
- Node.js >= 18.x
- npm >= 9.x

### Langkah-langkah:
```bash
# 1. Clone repositori
git clone https://github.com/redilah/Finance-tracker.git
cd Finance-tracker

# 2. Install dependencies
npm install

# 3. Jalankan server pengembangan
npm run dev
```

Buka browser di: **`http://localhost:5173`**  
Akses Admin Dashboard: **`http://localhost:5173/?admin`**

---

## 📦 Build & Deploy

### Build Web App:
```bash
npm run build
```
Hasil build siap saji akan berada di folder `dist/`.

---

## 🤖 Build APK Android & Panduan Rilis

```bash
# 1. Kompilasi web bundle
npm run build

# 2. Sinkronkan asset ke folder Android
npx cap sync android

# 3. Masuk ke folder Android dan kompilasi APK release
cd android
./gradlew assembleRelease --no-daemon
```

File APK release yang sudah di-optimize dengan R8 shrinker dan ditandatangani akan berada di:  
`android/app/build/outputs/apk/release/app-release.apk`

---

## 💾 Penyimpanan Data (Storage Schema)

| Key LocalStorage | Tipe Data | Deskripsi |
|---|---|---|
| `user_transactions` | `Array<Object>` | Seluruh catatan transaksi pengguna |
| `user_accounts_list` | `Array<Object>` | Daftar akun, rekening bank, e-wallet, & saldo terpisah |
| `user_app_currency` | `String` | Kode mata uang aktif (e.g. `IDR`, `USD`, `KRW`) |
| `user_app_language` | `String` | Kode bahasa aktif (`id`, `en`, `jv`, `zh`, `ko`) |
| `user_app_font` | `String` | ID font aktif yang dipilih |
| `user_pin_code` | `String` | Hash PIN keamanan 6 digit |
| `user_biometric_enabled` | `Boolean` | Status proteksi sidik jari / biometrik |
| `user_budget_cap` | `Number` | Nominal batas pengeluaran bulanan aktif |
| `user_learned_voice_aliases` | `Object` | Kamus asosiasi kata suara hasil pembelajaran lokal |
| `user_expense_categories` | `Array<Object>` | Daftar kategori pengeluaran kustom |
| `user_income_categories` | `Array<Object>` | Daftar kategori pemasukan kustom |
| `user_profile_name` | `String` | Nama profil pengguna |
| `user_profile_image` | `String` | Foto profil terkompresi (JPEG max 256px) |
| `user_app_wallpaper` | `String` | Wallpaper terkompresi (JPEG max 1024px) |
| `user_notification_bell_enabled`| `Boolean` | Preferensi status notifikasi harian |
| `app_device_id` | `String` | UUID unik perangkat untuk telemetri |

---

## 📜 Versi & Changelog

| Versi | Version Code | Tanggal Rilis | Fitur Utama & Keterangan |
|---|---|---|---|
| **1.0.28** | **29** | **Agustus 2026** | **Manajemen Multi-Akun & Saldo Rekening Terpisah Real-Time**, Filter Cepat & Pemantauan Arus Kas per Sumber Dana, Animasi Cash Counter Rolling, Notifikasi Personal Cerdas |
| 1.0.27 | 28 | Agustus 2026 | Auto Expense Listener Service & Izin Notifikasi Android Background |
| 1.0.26 | 27 | Agustus 2026 | Sinkronisasi APK Folder `./apk/`, Dynamic Target APK Routing, SHA-256 Checksum Verification |
| 1.0.25 | 26 | Agustus 2026 | High-Impact What's New In-App Update, Borderless Luxury UI Design Refresh |
| 1.0.24 | 25 | Agustus 2026 | **Perbaikan Cadangan Data Google Drive & File Picker**, Optimasi Dynamic Target APK Routing (Cassiel, Udin, Debug) |
| 1.0.23 | 24 | Agustus 2026 | **Monthly Stats Bar Chart Switcher**, Visualisasi Tren Finansial Bulanan |
| 1.0.22 | 23 | Agustus 2026 | Pembaruan Asset Notifikasi Android & Guided Tour Interaktif |
| 1.0.21 | 22 | Agustus 2026 | Modal Penyesuaian Akun Legacy & Large Notification Icon Android |
| 1.0.20 | 21 | Agustus 2026 | Sinkronisasi In-App Update Engine & Direct Budget In-Place Editing |
| 1.0.19 | 20 | Agustus 2026 | **Mata Uang 1 Dunia (Live Exchange Rates)**, **Bahasa Korea (Latin Romaja)**, Full i18n Sync |
| 1.0.18 | 19 | Agustus 2026 | Fitur Saran & Keluh Kesah Developer, Pilihan Font & Multi-Bahasa |

---

## 📄 Lisensi & Privasi

- Seluruh data transaksi finansial bersifat **100% lokal** dan tidak pernah diunggah ke server manapun.
- Informasi lengkap mengenai perlindungan data dapat dibaca di [PRIVACY.md](./PRIVACY.md).

---

<div align="center">
  <strong>Cassiel</strong> — Catat. Analisis. Bijak Berbelanja.
  <br>
  Dibuat dengan ❤️ untuk membantu mengelola keuangan pribadi secara lebih cerdas dan mandiri.
</div>

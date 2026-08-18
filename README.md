# 💰 Cassiel — Personal Finance Tracker

> Aplikasi pencatat keuangan pribadi yang cerdas, ultra-responsif, aman, dan offline-first. Dilengkapi dengan **Input Transaksi Berbasis Voice AI Majemuk**, **Sistem Mata Uang 1 Dunia & Kurs Real-Time**, **Multi-Bahasa (Termasuk Bahasa Korea Latin & Basa Jawa)**, **Live Category Insight Engine**, **Animasi 3D Typewriter Transaksi**, **Simulator Opportunity Cost "Andai"**, serta klasifikasi finansial otomatis yang dirancang khusus untuk pola pengeluaran sehari-hari.

---

## 📖 Daftar Isi

- [Tentang Cassiel](#tentang-cassiel)
- [Fitur Utama](#fitur-utama)
- [🌍 Sistem Mata Uang Dunia & Kurs Real-Time](#-sistem-mata-uang-dunia--kurs-real-time)
- [🌐 Multi-Bahasa (i18n)](#-multi-bahasa-i18n)
- [🎙️ Input Transaksi Suara (Voice AI Engine)](#️-input-transaksi-suara-voice-ai-engine)
- [⏱️ Category Insight & Live Countdown Engine](#️-category-insight--live-countdown-engine)
- [✨ 3D Pop-in & Typewriter Animation](#-3d-pop-in--typewriter-animation)
- [🔮 Fitur Andai (What-If Simulator)](#-fitur-andai-what-if-simulator)
- [⚡ Loss Aversion Badge](#-loss-aversion-badge)
- [🔔 Audio Feedback — Positive Chime](#-audio-feedback--positive-chime)
- [🧠 Hybrid AI Classifier](#-hybrid-ai-classifier)
- [📏 Aturan Threshold Kategori Khusus](#-aturan-threshold-kategori-khusus)
- [🏷️ Sistem Kategori](#️-sistem-kategori)
- [🛡️ Keamanan & Integritas Data](#️-keamanan--integritas-data)
- [📱 Android Edge-Swipe Gesture](#-android-edge-swipe-gesture)
- [📊 Admin Dashboard & Telemetri Privasi](#-admin-dashboard--telemetri-privasi)
- [🛠️ Tech Stack](#️-tech-stack)
- [📂 Struktur Proyek](#-struktur-proyek)
- [🚀 Cara Menjalankan (Development)](#-cara-menjalankan-development)
- [📦 Build & Deploy](#-build--deploy)
- [🤖 Build APK Android](#-build-apk-android)
- [💾 Penyimpanan Data (Storage Schema)](#-penyimpanan-data-storage-schema)
- [📜 Versi & Changelog](#-versi--changelog)

---

## Tentang Cassiel

**Cassiel** adalah aplikasi pencatat keuangan pribadi yang dibangun dengan filosofi **offline-first & zero-data-leakage** — seluruh data transaksi tersimpan aman di perangkat lokal pengguna tanpa mengharuskan pendaftaran akun atau koneksi internet untuk operasional sehari-hari.

Nama "Cassiel" terinspirasi dari malaikat penjaga waktu dan catatan — merepresentasikan komitmen aplikasi ini untuk menjaga rekam jejak keuangan pengguna dengan teliti, disiplin, dan jujur.

Cassiel tersedia dalam dua platform:
- **Android Native APK** — dibangun dengan Capacitor 8, sangat ringan (~3.2 MB), hemat daya, dan responsif dengan integrasi native speech recognition tanpa pop-up.
- **Progressive Web App (PWA)** — dapat diakses langsung dari browser modern dengan performa instan dan offline support.

---

## Fitur Utama

### 🌍 Multi-Currency & Live Exchange Rates (1 Dunia)
- **Database Mata Uang Global**: Mendukung seluruh mata uang dunia utama (IDR, USD, EUR, JPY, GBP, KRW, SGD, MYR, AUD, SAR, AED, CNY, dll.) dengan bendera resmi berkualitas tinggi (*FlagCDN*).
- **Live Exchange Rate Engine**: Integrasi kurs *real-time* otomatis dengan sistem *smart caching* hemat kuota serta fallback luring aman.
- **Rupiah Prioritas No. 1**: IDR berada di posisi teratas sebagai mata uang utama bawaan aplikasi.

### 🌐 Multi-Language Engine (i18n)
- **5 Pilihan Bahasa**:
  1. **Bahasa Indonesia (Default)**
  2. **English**
  3. **Basa Jawa** (Krama Alus Mataraman)
  4. **Mandarin** (Pinyin Latin ABC)
  5. **Bahasa Korea** (Romaja Latin Alphabet ABC)
- **Kaidah 1 Kata**: Label form transaksi menggunakan 1 kata murni yang padat, presisi, dan proporsional di semua bahasa.

### 🎙️ Voice AI Transaction Engine (Canggih & Majemuk)
- **Compound Commands**: Mendukung perintah majemuk dalam satu ucapan (misal: *"hapus bakwan lalu beli kopi 20rb dan bensin 30rb"*).
- **Scored Relevance Token Matcher**: Penghapusan transaksi via suara cukup dengan menyebutkan kata kunci parsial.
- **Self-Repair & Ralat**: Deteksi otomatis koreksi ucapan pengguna (*"beli mie ayam ralat bakso 15 ribu"*).
- **Seamless Native Mic**: Tombol mic berdenyut halus (*pulsing wave*) langsung di dalam aplikasi tanpa popup dialog Google.

### ✨ 3D Depth Pop-in & Left-to-Right Typewriter Animation
- Setiap transaksi yang dibuat via suara tampil dengan efek visual kartu 3D pop-in yang elegan.
- Animasi pengetikan dinamis (*typewriter*) mengalir mulus dari kiri ke kanan untuk teks deskripsi dan nominal digit angka.

### ⏱️ Category Insight & Live Countdown Engine
- Pemantauan ritme dan intensitas belanja per kategori secara cerdas.
- Layar **Category Insight** dengan **Live Countdown Timer** yang menghitung mundur interval jeda belanja sehat berikutnya, diselaraskan penuh dengan bahasa dan mata uang aktif.

### 🔮 Fitur "Andai" & Loss Aversion
- **What-If Simulator**: Menghitung potensi pertumbuhan uang jika pengeluaran konsumtif diinvestasikan ke instrumen finansial (Big Bank 10%, Emas 7%, Obligasi 6.5%).
- **Loss Aversion Badge**: Kartu psikologis di halaman utama yang menghitung akumulasi potensi kerugian masa depan dari gaya hidup konsumtif dalam mata uang dan bahasa aktif pengguna.

### 👤 Personalisasi & Profil Full-Page
- Kustomisasi nama profil dan foto pengguna dengan fitur **crop & zoom** interaktif.
- Pilihan **Gaya Tulisan (Font)** dan upload **Wallpaper / Background** personal.
- Menu pengaturan profil bergaya modern, *borderless*, dan *backgroundless*.
- Fitur **Saran & Masukan Developer** untuk mengirim ide fitur atau keluhan langsung dari aplikasi.

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
│  Dashboard   │     │ Transactions │     │ Andai & Insight│
│ Balance Card │     │  Daily Rows  │     │   Simulators   │
└──────────────┘     └──────────────┘     └────────────────┘
```

- **Pencarian Cepat**: Filter mata uang berdasarkan nama negara, kode ISO (USD, EUR, KRW), atau simbol (`$`, `₩`, `€`, `Rp`).
- **Scrollbar Elegan**: Navigasi daftar mata uang dilengkapi scrollbar hitam minimalis dengan *fixed search header* yang rapi.

---

## 🌐 Multi-Bahasa (i18n)

Aplikasi terhubung secara dinamis ke kamus multi-bahasa `src/utils/i18n.js`:

| Fitur / Layar | Bahasa Indonesia | English | Basa Jawa | Mandarin (ABC) | Korea (Romaja) |
|---------------|------------------|---------|-----------|----------------|----------------|
| **Home** | Beranda | Home | Kaca Utama | Shouye | Hom |
| **Stats** | Statistik | Statistics | Statistik | Tongji | Tonggye |
| **Add Button** | *Ikon Melayang (+)* | *(Icon Only)* | *(Icon Only)* | *(Icon Only)* | *(Icon Only)* |
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

## ⏱️ Category Insight & Live Countdown Engine

Sistem analitik berbasis perilaku belanja lokal yang memberikan wawasan disiplin finansial:
- Menganalisis frekuensi dan interval belanja setiap kategori.
- Menyajikan **Live Countdown Timer** yang menghitung sisa waktu menuju target jeda belanja yang disarankan.
- Narasi kisah pengeluaran (*Spending Story*), transaksi terbesar, metode pembayaran utama, dan perbandingan tren bulanan.

---

## 🔮 Fitur Andai (What-If Simulator)

Fitur **Andai** membantu pengguna menyadari **biaya peluang (opportunity cost)** dari pengeluaran konsumtif bulanan mereka.

### Cara Kerja:
1. Sistem mengidentifikasi seluruh transaksi konsumtif bulan berjalan via **Hybrid AI Classifier**.
2. Pengguna memilih **instrumen investasi** dan **jangka waktu** (1, 3, 5, atau 10 tahun).
3. Proyeksi nilai masa depan dihitung menggunakan rumus *Compound Interest*:

$$\text{FV} = P \times (1 + r)^n$$

### Instrumen Investasi:
| Instrumen | Return Proyeksi | Keterangan |
|-----------|-----------------|------------|
| **Big Bank** | 10% / tahun | Saham perbankan fundamental kuat |
| **Emas Mulia** | 7% / tahun | Instrumen lindung nilai (hedging) |
| **Obligasi** | 6.5% / tahun | Surat Berharga Negara / Fixed Income |

---

## ⚡ Loss Aversion Badge

**Loss Aversion Badge** adalah kartu interaktif di dashboard utama yang mengingatkan potensi nominal yang hilang akibat belanja impulsif/konsumtif bulan ini.

- **Kondisi Muncul**: Hanya tampil saat bulan aktif jika terdapat transaksi konsumtif (`totalConsumptiveAmount > 0`).
- **Multi-Bahasa & Multi-Mata Uang**: Pesan peringatan dan nominal uang otomatis menyesuaikan pengaturan bahasa dan mata uang aktif.
- **Aksi Cepat**: Mengetuk badge langsung membuka simulator Andai untuk rincian lebih detail.

---

## 🔔 Audio Feedback — Positive Chime

Untuk membentuk kebiasaan finansial yang sehat, aplikasi memberikan *dopamine reward* positif saat pengguna mencatat pengeluaran non-konsumtif (kebutuhan primer/esensial):
- **Melodi**: Arpeggio nada naik C5 → E5 → G5 → **C6**.
- **Sintesis Audio**: 100% menggunakan Web Audio API tanpa file audio eksternal (ringan dan bebas latensi).

---

## 🧠 Hybrid AI Classifier

Klasifikasi transaksi di Cassiel berjalan **100% offline, deterministik, dan bebas kuota internet**.

### Pipeline Klasifikasi:
1. **Text Normalizer & Noise Stripper**: Pembersihan karakter khusus, konversi huruf kecil, dan perataan slang kata.
2. **Threshold Rule Engine**: Evaluasi khusus untuk kategori yang bergantung pada batas nominal.
3. **Exact & Context Match**: Pencocokan kata kunci esensial dan konsumtif khas multi-bahasa.
4. **Fuzzy Match Engine**: Kombinasi algoritma Levenshtein & Jaro-Winkler untuk menangani salah ketik/typo.
5. **Naive Bayes Weighted Voting**: Menggabungkan seluruh bukti untuk menghasilkan status akhir (*Konsumtif* vs *Non-Konsumtif*).

---

## 📏 Aturan Threshold Kategori Khusus

| Kategori | Batas Nominal | Logika Keputusan |
|----------|---------------|------------------|
| 🍔 **Food** | > Rp 50.000 / tx *atau* > Rp 75.000 / hari | Pengeluaran makan wajar dianggap primer. Kelebihan batas harian masuk hitungan konsumtif. *(Sembako dikecualikan)* |
| ☕ **Coffee** | > Rp 20.000 / tx *atau* > Rp 20.000 / hari | Kopi harian di atas Rp 20k diklasifikasikan sebagai gaya hidup. |
| 💈 **Barbershop** | Rp 50.000 | Potong rambut reguler (<50k) = esensial; Perawatan/styling premium (≥50k) = konsumtif. |

---

## 🏷️ Sistem Kategori

### 21 Kategori Pengeluaran (Expense):
`food`, `bioskop`, `transport`, `barber`, `skincare`, `edukasi`, `galon`, `fashion`, `supermarket`, `sub`, `pesawat`, `kost`, `coffee`, `gofood`, `sepatu`, `donasi`, `topupGame`, `bensin`, `konser`, `pulsa`, `rumahSakit`, `obatSakit`.

### 6 Kategori Pemasukan (Income):
`gaji`, `bonus`, `kip`, `investasi`, `bisnis`, `affiliate`.

---

## 🛡️ Keamanan & Integritas Data

1. **Local-First Isolation**: Seluruh riwayat transaksi keuangan tersimpan privat di perangkat lokal.
2. **Secure Storage Wrappers**: Serialisasi data aman dengan validasi schema sebelum disimpan ke storage.
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

## 📊 Admin Dashboard & Telemetri Privasi

Panel admin (`/?admin`) memisahkan ranah teknis dan privasi secara ketat:
- **Tab 1 (Telemetry)**: Menampilkan metrik teknis perangkat, versi aktif, dan nama profil asli untuk keperluan pemecahan masalah teknis.
- **Tab 2 (AI Learning)**: Menyamarkan identitas pengguna dengan kode enkripsi privasi (`enc:v1:...`) dan hanya memfilter pengguna dengan data insight aktif.

---

## 🛠️ Tech Stack

| Layer | Teknologi |
|-------|-----------|
| **Core Framework** | React 19, Vite 8 |
| **Mobile Runtime** | Capacitor 8 (Android Platform) |
| **Speech Engine** | `@capacitor-community/speech-recognition`, Web Speech API |
| **Currency & Flags** | Open Exchange Rates API, FlagCDN |
| **Icons & UI** | Custom Hand-crafted SVGs, Lucide React |
| **Styling** | Vanilla CSS Modern (Fluid Design, Glassmorphism, Theme Engine) |
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
│   │   └── admin/
│   │       ├── AdminDashboard.jsx    # Dashboard telemetri & AI learning admin
│   │       └── AdminDashboard.css
│   └── utils/
│       ├── currency.js          # Mesin mata uang 1 dunia & live exchange rates
│       ├── i18n.js              # Engine multi-bahasa (ID, EN, JV, ZH, KO)
│       ├── feedback.js          # Pengiriman saran pengguna ke developer
│       ├── voiceParser.js       # Natural Language Parser suara majemuk Indonesia
│       ├── voiceLearner.js      # Mesin pembelajaran kebiasaan kata lokal
│       ├── noiseFilter.js       # Pembersih noise transkrip suara & tanda baca
│       ├── categoryInsightEngine.js # Mesin kalkulasi jeda & wawasan kategori
│       ├── fuzzyMatch.js        # Algoritma fuzzy string matching
│       ├── safetyGuard.js       # Sanitasi input & pencegahan manipulasi data
│       ├── secureStorage.js     # Storage wrapper dengan validasi integritas
│       ├── classifier.js        # Hybrid AI classifier & logic konsumtif
│       ├── soundFeedback.js     # Audio synthesizer feedback positif
│       ├── notifications.js     # Manajemen notifikasi lokal
│       ├── telemetry.js         # Pengiriman metrik perangkat anonim
│       ├── firebase.js          # Inisialisasi Firebase Firestore
│       └── version.js           # Sistem in-app update checker
├── public/
│   ├── version.json             # Manifest metadata versi APK
│   ├── favicon.svg              # Logo favicon
│   └── audio/                   # Audio asset pendukung
├── android/                     # Source project Android native (Capacitor)
├── Cassiel.apk                  # Rilis APK Android terbaru (Signed Release)
├── Cassiel-Release.apk          # Mirror rilis APK release
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

## 🤖 Build APK Android

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
|------------------|-----------|-----------|
| `user_transactions` | `Array<Object>` | Seluruh catatan transaksi pengguna |
| `user_app_currency` | `String` | Kode mata uang aktif (e.g. `IDR`, `USD`, `KRW`) |
| `user_app_language` | `String` | Kode bahasa aktif (`id`, `id_id`, `en`, `jv`, `zh`, `ko`) |
| `user_app_font` | `String` | ID font aktif yang dipilih |
| `user_learned_voice_aliases` | `Object` | Kamus asosiasi kata suara hasil pembelajaran lokal |
| `user_expense_categories` | `Array<Object>` | Daftar kategori pengeluaran kustom |
| `user_income_categories` | `Array<Object>` | Daftar kategori pemasukan kustom |
| `user_accounts_list` | `Array<Object>` | Daftar akun / dompet keuangan |
| `user_profile_name` | `String` | Nama profil pengguna |
| `user_profile_image` | `String` | Foto profil terkompresi (JPEG max 256px) |
| `user_app_wallpaper` | `String` | Wallpaper terkompresi (JPEG max 1024px) |
| `user_notification_bell_enabled`| `Boolean` | Preferensi status notifikasi |
| `app_device_id` | `String` | UUID unik perangkat untuk telemetri |

---

## 📜 Versi & Changelog

| Versi | Version Code | Tanggal Rilis | Fitur Utama & Keterangan |
|-------|--------------|---------------|--------------------------|
| **1.0.19** | **20** | **Agustus 2026** | **Mata Uang 1 Dunia (Live Exchange Rates)**, **Bahasa Korea (Latin Romaja)**, Full i18n Sync |
| 1.0.18 | 19 | Agustus 2026 | Fitur Saran & Keluh Kesah Developer, Pilihan Font & Multi-Bahasa |
| 1.0.17 | 18 | Agustus 2026 | Sinkronisasi Notifikasi Update, Borderless Profile Menu |
| 1.0.16 | 17 | Agustus 2026 | Live Countdown Timer Category Insight, Compound Voice Actions |
| 1.0.15 | 16 | Agustus 2026 | Scored Relevance Token Matcher, Voice Deletion Enhancements |
| 1.0.14 | 15 | Agustus 2026 | Privacy Anonymization in Admin Dashboard Tab 2 |

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

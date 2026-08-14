# 💰 Cassiel — Personal Finance Tracker

> Aplikasi pencatat keuangan pribadi yang cerdas, ringan, aman, dan offline-first. Dilengkapi dengan **Input Transaksi Berbasis AI Suara (Voice AI)**, **Simulator Opportunity Cost "Andai"**, serta klasifikasi finansial otomatis yang dirancang khusus untuk pola pengeluaran masyarakat Indonesia.

---

## 📖 Daftar Isi

- [Tentang Cassiel](#tentang-cassiel)
- [Fitur Utama](#fitur-utama)
- [🎙️ Input Transaksi Suara (Voice AI)](#️-input-transaksi-suara-voice-ai)
- [Fitur Andai (What-If Simulator)](#fitur-andai-what-if-simulator)
- [Loss Aversion Badge](#loss-aversion-badge)
- [Audio Feedback — Positive Chime](#audio-feedback--positive-chime)
- [Hybrid AI Classifier](#hybrid-ai-classifier)
- [Aturan Threshold Kategori Khusus](#aturan-threshold-kategori-khusus)
- [Sistem Kategori](#sistem-kategori)
- [Halaman & Navigasi](#halaman--navigasi)
- [Keamanan & Integritas Data](#keamanan--integritas-data)
- [Sistem Notifikasi](#sistem-notifikasi)
- [Pembaruan Otomatis (In-App Update)](#pembaruan-otomatis-in-app-update)
- [Admin Dashboard & Telemetri](#admin-dashboard--telemetri)
- [Tech Stack](#tech-stack)
- [Struktur Proyek](#struktur-proyek)
- [Cara Menjalankan (Development)](#cara-menjalankan-development)
- [Build & Deploy](#build--deploy)
- [Build APK Android](#build-apk-android)
- [Penyimpanan Data (Storage Schema)](#penyimpanan-data-storage-schema)
- [Versi & Changelog](#versi--changelog)

---

## Tentang Cassiel

**Cassiel** adalah aplikasi pencatat keuangan pribadi yang dibangun dengan filosofi **offline-first & zero-data-leakage** — seluruh data transaksi tersimpan aman di perangkat lokal pengguna tanpa mengharuskan pendaftaran akun atau koneksi internet untuk operasional sehari-hari.

Nama "Cassiel" terinspirasi dari malaikat penjaga waktu dan catatan — merepresentasikan komitmen aplikasi ini untuk menjaga rekam jejak keuangan pengguna dengan teliti, disiplin, dan jujur.

Cassiel tersedia dalam dua platform:
- **Android Native APK** — dibangun dengan Capacitor, ringan (~3.2 MB), responsif, dan hemat daya.
- **Progressive Web App (PWA)** — dapat diakses langsung dari browser modern dengan performa tinggi.

---

## Fitur Utama

### 🎙️ Voice AI Transaction Input (Baru)
- Catat transaksi dalam hitungan detik hanya dengan berbicara (contoh: *"Beli bensin 25 ribu pakai QRIS"*, *"Kopi 18rb kemarin"*, *"Gaji 5 juta"*).
- Smart Natural Language Parser yang memahami bahasa Indonesia, bahasa gaul, singkatan nominal (`rb`, `k`, `jt`), hingga ejaan angka terbilang.
- Menggunakan Speech Recognition native di Android dan Web Speech API di browser.

### 📝 Pencatatan Transaksi Cerdas
- Catat **Pemasukan (Income)** dan **Pengeluaran (Expense)** dalam form interaktif.
- Input nominal dengan pemformatan **Rupiah otomatis** (contoh: `15000` → `15.000`).
- Dukungan akun sumber dana: **Bank**, **Cash**, **QRIS**, atau custom.
- Riwayat saran catatan transaksi otomatis.
- **Audio Chime Positif** saat menyimpan transaksi kebutuhan pokok / non-konsumtif.

### 🔮 Fitur "Andai" & Loss Aversion
- **What-If Simulator**: Menghitung potensi pertumbuhan uang jika pengeluaran konsumtif diinvestasikan ke instrumen finansial (Big Bank, Emas, Obligasi).
- **Loss Aversion Badge**: Kartu peringatan psikologis di halaman utama yang menghitung potensi kerugian masa depan dari akumulasi gaya hidup konsumtif.

### 📊 Statistik & Laporan Mendalam
- Ringkasan **Total Pemasukan**, **Total Pengeluaran**, dan **Arus Kas Bersih**.
- Filter periode fleksibel: **Bulanan**, **Mingguan**, dan **Tahunan**.
- Navigasi bulan yang mulus dengan visualisasi grafik interaktif.

### 👤 Profil & Personalisasi Tampilan
- Kustomisasi nama profil dan foto pengguna dengan fitur **crop & zoom** interaktif.
- Upload **wallpaper / background** personal dengan kompresi cerdas.
- Full-page profile screen yang bersih dan elegan.

---

## 🎙️ Input Transaksi Suara (Voice AI)

Cassiel v1.0.11 menghadirkan mesin pemroses suara cerdas yang mampu mengekstrak seluruh parameter transaksi dari satu kalimat ucapan:

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
               │         Text Sanitizer & Guard        │
               │   (Punctuation & Slang Normalizer)    │
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
               │  - Pre-defined Dictionary             │
               │  - Learned User Aliases (Local AI)    │
               │  - Levenshtein & Jaro-Winkler Fuzzy   │
               └───────────────────┬───────────────────┘
                                   │
                                   ▼
        { type: "expense", amount: 25000, categoryId: "bensin", account: "QRIS", note: "bensin" }
```

### Kemampuan Pemahaman Suara:
1. **Ekstraksi Nominal Fleksibel**:
   - Angka + Singkatan: `15rb`, `25k`, `5jt`, `1.5 juta`.
   - Ejaan Huruf: `seratus lima puluh ribu`, `dua puluh lima ribu`.
   - Kombinasi Campuran: `1 juta lima ratus ribu`.
2. **Deteksi Tipe & Akun Otomatis**:
   - Kata kunci masuk (`dapat gaji`, `terima transfer`, `nemu uang`, `bonus`) otomatis menjadi **Income**.
   - Kata kunci keluar (`beli`, `bayar`, `jajan`, `makan`, `isi bensin`) otomatis menjadi **Expense**.
   - Ekstraksi akun dana (`pake qris`, `lewat bank`, `pake cash`, `tunai`).
3. **Pencocokan Tanggal Alami**:
   - Mendukung kata `kemarin`, `lusa`, atau tanggal spesifik.
4. **Dynamic Voice Learner (Self-Learning)**:
   - Jika pengguna sering mengaitkan kata tertentu dengan suatu kategori, sistem akan mengingatnya di storage lokal pengguna tanpa perlu update aplikasi.

---

## Fitur Andai (What-If Simulator)

Fitur **Andai** membantu pengguna menyadari **biaya peluang (opportunity cost)** dari pengeluaran konsumtif bulanan mereka.

### Cara Kerja:
1. Sistem mengidentifikasi seluruh transaksi konsumtif bulan berjalan via **Hybrid AI Classifier**.
2. Pengguna memilih **instrumen investasi** dan **jangka waktu** (1, 3, 5, atau 10 tahun).
3. Sistem menghitung proyeksi nilai masa depan menggunakan rumus *Compound Interest*:

$$\text{FV} = P \times (1 + r)^n$$

### Instrumen Investasi:
| Instrumen | Return Proyeksi | Keterangan |
|-----------|-----------------|------------|
| **Big Bank** | 10% / tahun | Saham perbankan fundamental kuat |
| **Emas Mulia** | 7% / tahun | Instrumen lindung nilai (hedging) |
| **Obligasi** | 6.5% / tahun | Surat Berharga Negara / Fixed Income |

### Prinsip Anti-Excuse (Kedap Cheating):
Klasifikasi konsumtif pada fitur Andai bersifat **mutlak dan otomatis** berdasarkan algoritma sistem — tidak ada tombol bypass manual demi menjaga kejujuran finansial pengguna.

---

## Loss Aversion Badge

**Loss Aversion Badge** adalah kartu interaktif di dashboard utama yang mengingatkan potensi nominal yang hilang akibat belanja impulsif/konsumtif bulan ini.

- **Kondisi Muncul**: Hanya tampil saat bulan aktif jika terdapat transaksi konsumtif (`totalConsumptiveAmount > 0`).
- **Framing Psikologis**: Menggunakan perspektif kerugian (*"Kamu berpotensi kehilangan Rp X di masa depan..."*) yang terbukti 2x lebih efektif mengubah perilaku belanja dibanding framing tabungan biasa.
- **Aksi Cepat**: Mengetuk badge langsung membuka simulator Andai untuk rincian lebih detail.

---

## Audio Feedback — Positive Chime

Untuk membentuk kebiasaan finansial yang sehat, aplikasi memberikan *dopamine reward* positif saat pengguna mencatat pengeluaran non-konsumtif (kebutuhan primer/esensial):

- **Melodi**: Arpeggio nada naik C5 → E5 → G5 → **C6**.
- **Sintesis Audio**: 100% menggunakan Web Audio API tanpa load file MP3/WAV eksternal (sangat ringan dan bebas latency).
- **Aturan**: Hanya berbunyi untuk pengeluaran esensial (seperti beras, bensin, obat, edukasi, listrik).

---

## Hybrid AI Classifier

Klasifikasi transaksi di Cassiel berjalan **100% offline, deterministik, dan bebas kuota internet**.

### Pipeline Klasifikasi:
1. **Text Normalizer**: Pembersihan karakter khusus, konversi huruf kecil, dan perataan slang kata.
2. **Threshold Rule Engine**: Evaluasi khusus untuk kategori yang bergantung pada batas nominal.
3. **Exact & Context Match**: Pencocokan kata kunci esensial dan konsumtif.
4. **Fuzzy Match Engine**: Menggunakan kombinasi algoritma Levenshtein & Jaro-Winkler untuk menangani salah ketik/typo.
5. **Naive Bayes Weighted Voting**: Menggabungkan seluruh bukti untuk menghasilkan status akhir (*Konsumtif* vs *Non-Konsumtif*).

---

## Aturan Threshold Kategori Khusus

| Kategori | Batas Nominal | Logika Keputusan |
|----------|---------------|------------------|
| 🍔 **Food** | > Rp 50.000 / tx *atau* > Rp 75.000 / hari | Pengeluaran makan wajar dianggap primer. Kelebihan batas harian masuk hitungan konsumtif. *(Sembako dikecualikan)* |
| ☕ **Coffee** | > Rp 20.000 / tx *atau* > Rp 20.000 / hari | Kopi harian di atas Rp 20k diklasifikasikan sebagai gaya hidup. |
| 💈 **Barbershop** | Rp 50.000 | Potong rambut reguler (<50k) = esensial; Perawatan/styling premium (≥50k) = konsumtif. |

---

## Sistem Kategori

### 21 Kategori Pengeluaran (Expense):
`food`, `bioskop`, `transport`, `barber`, `skincare`, `edukasi`, `galon`, `fashion`, `supermarket`, `sub`, `pesawat`, `kost`, `coffee`, `gofood`, `sepatu`, `donasi`, `topupGame`, `bensin`, `konser`, `pulsa`, `rumahSakit`, `obatSakit`.

### 6 Kategori Pemasukan (Income):
`gaji`, `bonus`, `kip`, `investasi`, `bisnis`, `affiliate`.

> **Prinsip Runtime Icon Lookup**: Objek transaksi hanya menyimpan string `categoryId`. Seluruh render ikon SVG dilakukan secara runtime melalui `ICON_MAP` untuk menghemat ruang memori `localStorage`.

---

## Keamanan & Integritas Data

Cassiel v1.0.11 menerapkan standar keamanan data tingkat lanjut:

1. **Local-First Isolation**: Seluruh riwayat transaksi keuangan Anda tersimpan privat di perangkat lokal.
2. **Secure Storage Wrappers**: Serialisasi data aman dengan validasi schema sebelum disimpan ke storage.
3. **In-App Update Signature Integrity**: Pengecekan checksum SHA-256 dan validasi URL download terpercaya sebelum mengizinkan pembaruan aplikasi.
4. **Firestore Rules Hardening**: Aturan Firestore terkunci rapat — hanya mengizinkan pengiriman metrik telemetri agregat perangkat tanpa akses membaca data pengguna lain.

---

## Sistem Notifikasi

- Menggunakan **Capacitor Local Notifications** di Android (berjalan offline di background perangkat).
- Fallback ke **Web Notifications API** untuk platform web browser.
- Mendukung pengingat pencatatan harian dan peringatan budget periodik.

---

## Pembaruan Otomatis (In-App Update)

Aplikasi memeriksa ketersediaan rilis baru secara berkala melalui endpoint GitHub raw:

- **Bypass Cache Cerdas**: Request `version.json` dilengkapi parameter `cache: 'no-store'` dan timestamp dinamis `?t=...` untuk mencegah caching CDN.
- **One-Click Update**: Notifikasi pembaruan langsung mengunduh file APK resmi terbaru.

---

## Admin Dashboard & Telemetri

Panel admin (`/?admin`) memungkinkan pemantauan metrik teknis perangkat secara agregat:
- Distribusi versi aplikasi aktif.
- Statistik platform (Android native vs Web).
- Tingkat keberhasilan in-app update.
- *Catatan: Tidak ada data nominal, catatan, atau rincian transaksi pengguna yang dikirimkan ke telemetri.*

---

## Tech Stack

| Layer | Teknologi |
|-------|-----------|
| **Core Framework** | React 19, Vite 8 |
| **Mobile Runtime** | Capacitor 8 (Android Platform) |
| **Speech Engine** | `@capacitor-community/speech-recognition`, Web Speech API |
| **Icons & UI** | Custom Hand-crafted SVGs, Lucide React |
| **Styling** | Vanilla CSS Modern (Fluid Design, Glassmorphism, Theme Engine) |
| **Audio Synthesis** | Web Audio API (Synthesized Oscillators) |
| **Telemetry & Cloud** | Firebase Firestore (Anonymous Device Metrics) |
| **Code Quality** | OxLint |

---

## Struktur Proyek

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
│   │   └── admin/
│   │       ├── AdminDashboard.jsx  # Dashboard telemetri admin
│   │       └── AdminDashboard.css
│   └── utils/
│       ├── voiceParser.js       # Natural Language Parser suara Indonesia
│       ├── voiceLearner.js      # Mesin pembelajaran kebiasaan kata lokal
│       ├── fuzzyMatch.js        # Algoritma fuzzy string matching
│       ├── safetyGuard.js       # Sanitasi input & pencegahan manipulasi data
│       ├── secureStorage.js     # Storage wrapper dengan validasi integritas
│       ├── classifier.js        # Hybrid AI classifier & logic konsumtif
│       ├── soundFeedback.js     # Audio synthesizer feedback positif
│       ├── notifications.js     # Manajemen notifikasi lokal
│       ├── telemetry.js         # Pengiriman metrik perangkat anonim
│       └── version.js           # Sistem in-app update checker
├── public/
│   ├── version.json             # Manifest metadata versi APK
│   ├── favicon.svg              # Logo favicon
│   └── audio/                   # Audio asset pendukung
├── android/                     # Source project Android native (Capacitor)
├── Cassiel.apk                  # Rilis APK Android terbaru
├── Cassiel-Release.apk          # Mirror rilis APK release
├── capacitor.config.json        # Konfigurasi Capacitor
├── package.json
├── vite.config.js
└── firestore.rules
```

---

## Cara Menjalankan (Development)

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

## Build & Deploy

### Build Web App:
```bash
npm run build
```
Hasil build siap saji akan berada di folder `dist/`.

### Linting Kode:
```bash
npm run lint
```

---

## Build APK Android

### Prasyarat:
- Java JDK 17+
- Android SDK & Build Tools
- Capacitor CLI

### Langkah Build Release:
```bash
# 1. Kompilasi web bundle
npm run build

# 2. Sinkronkan asset ke folder Android
npx cap sync android

# 3. Masuk ke folder Android dan kompilasi APK release
cd android
./gradlew assembleRelease
```

File APK release yang sudah di-optimize dengan R8 shrinker dan ditandatangani akan berada di:  
`android/app/build/outputs/apk/release/app-release.apk`

---

## Penyimpanan Data (Storage Schema)

| Key LocalStorage | Tipe Data | Deskripsi |
|------------------|-----------|-----------|
| `user_transactions` | `Array<Object>` | Seluruh catatan transaksi pengguna |
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

## Versi & Changelog

| Versi | Version Code | Tanggal Rilis | Fitur Utama & Keterangan |
|-------|--------------|---------------|--------------------------|
| **1.0.12** | **13** | **Agustus 2026** | **Dukungan Android Edge-Swipe Gesture**, Perbaikan Crash Native Speech Recognition & ProGuard |
| 1.0.11 | 12 | Agustus 2026 | Voice AI Transaction Input, Dynamic Voice Learner, Hardening Storage & Rules |
| 1.0.10 | 11 | Agustus 2026 | Bypass Cache In-App Update, Perbaikan Notifikasi Background |
| 1.0.9 | 10 | Agustus 2026 | Peningkatan Keamanan Keystore & Verifikasi Hash APK |
| 1.0.8 | 9 | Agustus 2026 | Audio Feedback Positive Chime, Loss Aversion Badge, Threshold Food/Coffee |

### Rilis Terkini — v1.0.12 (Version Code 13)

- 📱 **[New] Android Edge-Swipe Back Gesture**: Navigasi geser dari tepi layar HP kini berfungsi cerdas dan bertingkat (menutup modal profil, crop foto, budget cap, atau kembali ke tab Home).
- 🎙️ **[New] Speech Recognition Stability**: Perbaikan deklarasi intent `<queries>` Android 11+ dan proteksi ProGuard untuk mencegah aplikasi keluar/crash saat tombol mic ditekan.
- ⚡ **[New] R8 Code Shrinking**: APK rilis terkompresi optimal (~3.2 MB) dan ditandatangani dengan kunci rilis resmi.

---

## Lisensi & Privasi

- Seluruh data transaksi finansial bersifat **100% lokal** dan tidak pernah diunggah ke server manapun.
- Informasi lengkap mengenai perlindungan data dapat dibaca di [PRIVACY.md](./PRIVACY.md).

---

<div align="center">
  <strong>Cassiel</strong> — Catat. Analisis. Bijak Berbelanja.
  <br>
  Dibuat dengan ❤️ untuk membantu mengelola keuangan pribadi secara lebih cerdas dan mandiri.
</div>

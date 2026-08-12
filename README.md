# 💰 Cassiel — Personal Finance Tracker

> Aplikasi pencatat keuangan pribadi yang cerdas, ringan, dan offline-first. Dirancang khusus untuk kebutuhan finansial harian masyarakat Indonesia.

---

## 📖 Daftar Isi

- [Tentang Cassiel](#tentang-cassiel)
- [Fitur Utama](#fitur-utama)
- [Fitur Andai (What-If Simulator)](#fitur-andai-what-if-simulator)
- [Loss Aversion Badge](#loss-aversion-badge)
- [Audio Feedback — Positive Chime](#audio-feedback--positive-chime)
- [Hybrid AI Classifier](#hybrid-ai-classifier)
- [Aturan Threshold Kategori Khusus](#aturan-threshold-kategori-khusus)
- [Sistem Kategori](#sistem-kategori)
- [Halaman & Navigasi](#halaman--navigasi)
- [Sistem Notifikasi](#sistem-notifikasi)
- [Pembaruan Otomatis (In-App Update)](#pembaruan-otomatis-in-app-update)
- [Admin Dashboard](#admin-dashboard)
- [Tech Stack](#tech-stack)
- [Struktur Proyek](#struktur-proyek)
- [Cara Menjalankan (Development)](#cara-menjalankan-development)
- [Build & Deploy](#build--deploy)
- [Build APK Android](#build-apk-android)
- [Penyimpanan Data](#penyimpanan-data)
- [Versi & Changelog](#versi--changelog)

---

## Tentang Cassiel

**Cassiel** adalah aplikasi pencatat keuangan pribadi yang dibangun dengan filosofi **offline-first** — semua data transaksi tersimpan langsung di perangkat pengguna tanpa memerlukan akun atau internet untuk operasional sehari-hari.

Nama "Cassiel" terinspirasi dari malaikat penjaga waktu dan catatan — merepresentasikan komitmen aplikasi ini untuk menjaga rekam jejak keuangan pengguna dengan teliti dan jujur.

Cassiel tersedia dalam dua platform:
- **Android APK** — dibangun dengan Capacitor, berjalan secara native di Android
- **Web App** — dapat diakses langsung dari browser tanpa instalasi

---

## Fitur Utama

### 📝 Pencatatan Transaksi
- Catat **Pemasukan (Income)** dan **Pengeluaran (Expense)** dalam satu tampilan form yang intuitif
- Input nominal dengan format **Rupiah otomatis** (contoh: `15000` → `15.000`)
- Pilih **kategori** dengan ikon bergambar yang khas
- Pilih **akun sumber** (Bank, Cash, QRIS, atau custom)
- Tambahkan **catatan / note** dengan riwayat saran otomatis
- Pilih **tanggal dan jam** transaksi secara fleksibel
- Mode **Andai** — catat skenario "bagaimana jika uang ini diinvestasikan?"
- Suara efek **bubble pop** saat menekan tombol Tab Add untuk pengalaman yang menyenangkan
- **Audio chime positif** saat menyimpan transaksi pengeluaran non-konsumtif

### 📊 Statistik & Laporan
- Ringkasan **Total Pemasukan**, **Total Pengeluaran**, dan **Saldo Bersih** per periode
- Filter periode: **Bulanan**, **Mingguan**, **Tahunan**
- Navigasi **bulan sebelumnya / berikutnya** dengan swipe atau tombol panah
- Riwayat transaksi dengan ikon kategori berwarna
- Tampilan statistik per jenis (Income / Expense)

### 👤 Profil Pengguna
- Pengaturan **nama profil** pengguna
- Upload **foto profil** dengan fitur **crop & zoom** interaktif
- Kompres otomatis foto profil (JPEG max 256px) untuk efisiensi penyimpanan
- Upload **wallpaper / background** aplikasi personal
- Kompres otomatis wallpaper (JPEG max 1024px)
- **Full-page profile screen** untuk pengguna yang sudah terdaftar

### 🔧 Manajemen Kategori
- **Edit** nama dan urutan kategori yang sudah ada
- **Tambah kategori kustom** (Income maupun Expense)
- Ikon kategori di-resolve secara runtime dari `ICON_MAP` — tidak pernah disimpan ke localStorage

### 💳 Manajemen Akun
- Daftar akun default: **Bank**, **Cash**, **QRIS**
- Tambah akun kustom sesuai kebutuhan
- Filter transaksi per akun

---

## Fitur Andai (What-If Simulator)

Fitur **Andai** adalah fitur unggulan Cassiel yang membantu pengguna menyadari **biaya peluang (opportunity cost)** dari pengeluaran konsumtif mereka.

### Cara Kerja
1. Sistem mendeteksi otomatis transaksi konsumtif bulan ini menggunakan **Hybrid AI Classifier** + **aturan threshold kategori khusus**
2. Menampilkan total pengeluaran konsumtif bulan berjalan
3. Pengguna memilih **instrumen investasi** dan **jangka waktu**
4. Sistem menghitung **Future Value** menggunakan rumus compound interest:

```
FV = P × (1 + r)ⁿ
```

### Instrumen Investasi yang Tersedia
| Instrumen | Return Tahunan |
|-----------|---------------|
| Big Bank  | 10% / tahun   |
| Emas Mulia | 7% / tahun   |
| Obligasi  | 6.5% / tahun  |

### Periode Simulasi
Tersedia pilihan: **1 Tahun**, **3 Tahun**, **5 Tahun**, **10 Tahun**

### Tampilan Rincian Per Kategori
Daftar rincian pengeluaran konsumtif ditampilkan **per kategori** (bukan per transaksi individual), diurutkan dari nominal tertinggi ke terendah:

| Kategori | Subteks |
|----------|---------|
| Fashion | Total pengeluaran fashion konsumtif bulan ini |
| Coffee | Total pengeluaran coffee konsumtif bulan ini |
| Food | Kelebihan Rp (X) dari limit Rp 75.000/hari |
| Bioskop | Total pengeluaran bioskop konsumtif bulan ini |

### Prinsip Anti-Excuse
Klasifikasi konsumtif bersifat **mutlak dan otomatis** — tidak ada tombol override manual. Ini adalah bagian dari desain yang mendorong kedisiplinan finansial yang jujur.

---

## Loss Aversion Badge

**Loss Aversion Badge** adalah kartu peringatan otomatis yang muncul di halaman **Home** jika pengguna sudah memiliki pengeluaran konsumtif pada bulan berjalan.

### Cara Kerja
- Badge **hanya muncul** jika `totalConsumptiveAmount > 0` pada bulan berjalan
- Badge **tidak muncul** saat melihat bulan lampau (hanya relevan untuk bulan aktif)
- Angka di badge **konsisten** dengan angka di tab Andai (menggunakan fungsi klasifikasi yang sama)
- Menggunakan framing **"kehilangan"** (bukan "peluang") untuk efek psikologis loss aversion yang lebih kuat
- **Dapat diklik** — langsung membuka fitur Andai dengan tab Andai aktif
- Nominal: hasil simulasi **5 tahun dengan Big Bank (10%/thn)**

---

## Audio Feedback — Positive Chime

Saat pengguna menyimpan transaksi **Expense** yang terklasifikasi sebagai **non-konsumtif**, aplikasi membunyikan *chime* positif sebagai bentuk apresiasi.

### Spesifikasi Suara
- **Nada**: C5 → E5 → G5 → **C6** (arpeggio naik)
- **Durasi**: ~80ms per nada, C6 diperpanjang 2x (~160ms) dengan release ~150ms
- **Gain utama**: 0.28 | **Efek Sparkle**: oscillator kedua di 1 oktaf atas, gain 30%
- **Teknologi**: 100% synthesized via Web Audio API — tidak ada file audio eksternal

### Aturan Pembunyian
| Kondisi | Suara |
|---------|-------|
| Expense → Non-Konsumtif | ✅ Chime berbunyi |
| Expense → Konsumtif | ❌ Silent |
| Income | ❌ Silent |

---

## Hybrid AI Classifier

Cassiel menggunakan sistem klasifikasi transaksi berlapis yang berjalan **100% offline** dan **deterministik** — tidak memerlukan internet atau API eksternal.

### Pipeline Klasifikasi
```
Input Transaksi
      ↓
Normalisasi Teks (lowercase, remove punctuation, stemming slang)
      ↓
Threshold Kategori Khusus (Food / Coffee / Barber)
      ↓
Exact Match → Context Signal → Fuzzy Match
      ↓
Naive Bayes Scoring
      ↓
Evidence Aggregation (weighted voting)
      ↓
Hasil: Konsumtif / Non-Konsumtif + Confidence Score
```

### Kemampuan Deteksi
- **Bahasa Indonesia** formal dan informal
- **Bahasa Gaul & Singkatan** (contoh: `nongki`, `jajan`, `makan2`)
- **Istilah Daerah** (contoh: `pulkam`, `mudik`, `kalbar`)
- **Bahasa Inggris** campuran (contoh: `homecoming`, `dinas trip`)
- **Nama Brand** (Starbucks, Netflix, GoFood, Steam, dll.)

### Bobot Signal
| Signal | Bobot |
|--------|-------|
| Taksonomi Kategori | 0.62 |
| Strong Essential Match | 0.55 |
| Absolute Essential | 1.00 |
| Context Consumptive | 0.58 |
| Fuzzy Match | 0.38 |
| Naive Bayes | 0.30 |
| Amount Signal | 0.10 |

---

## Aturan Threshold Kategori Khusus

Selain klasifikasi berbasis teks, Cassiel menerapkan aturan **threshold nominal berbasis data ekonomi Indonesia** untuk kategori tertentu.

### 🍔 Food (Makanan) — Hybrid Threshold

| Aturan | Nilai | Keterangan |
|--------|-------|------------|
| Single Transaction | > Rp 50.000 | 1 transaksi makanan > 50k = konsumtif (resto/delivery) |
| Akumulasi Harian | > Rp 75.000/hari | Kelebihan dari batas harian masuk ke perhitungan Andai |

```
Kelebihan = Total Pengeluaran Makan Hari Itu − Rp 75.000
```

> **Pengecualian Sembako**: Kata kunci `beras`, `sembako`, `galon`, dll. tidak akan dianggap konsumtif meskipun nominalnya besar.

### ☕ Coffee (Kopi) — Hybrid Threshold

| Aturan | Nilai | Keterangan |
|--------|-------|------------|
| Single Transaction | > Rp 20.000 | 1 transaksi kopi > 20k = konsumtif |
| Akumulasi Harian | > Rp 20.000/hari | Total kopi hari itu > 20k = konsumtif |

### 💈 Barbershop — Threshold Essential

| Aturan | Nilai | Keterangan |
|--------|-------|------------|
| Di bawah batas | < Rp 50.000 | Kebutuhan kebersihan pokok (non-konsumtif) |
| Di atas batas | ≥ Rp 50.000 | Layanan premium / gaya hidup (konsumtif) |

---

## Sistem Kategori

### Kategori Pengeluaran (Expense) — 21 Kategori
| Nama | ID | Default Konsumtif? |
|------|----|--------------------|
| Food | `food` | ❌ (threshold: >50k/tx atau >75k/hari) |
| Bioskop | `bioskop` | ✅ |
| Transportasi | `transport` | ❌ |
| Barbershop | `barber` | ❌ / ✅ (threshold Rp 50k) |
| Skincare | `skincare` | ✅ |
| Edukasi | `edukasi` | ❌ |
| Air Galon | `galon` | ❌ |
| Fashion | `fashion` | ✅ |
| Supermarket | `supermarket` | ❌ |
| Subscription | `sub` | ✅ |
| Pesawat | `pesawat` | ✅ |
| Kost | `kost` | ❌ |
| Coffee | `coffee` | ✅ (threshold: >20k/tx atau >20k/hari) |
| GoFood | `gofood` | ✅ |
| Sepatu | `sepatu` | ✅ |
| Donasi | `donasi` | ❌ |
| Top Up Game | `topupGame` | ✅ |
| Bensin | `bensin` | ❌ |
| Konser | `konser` | ✅ |
| Pulsa | `pulsa` | ❌ |
| Rumah Sakit | `rumahSakit` | ❌ |
| Obat Sakit | `obatSakit` | ❌ |

### Kategori Pemasukan (Income) — 6 Kategori
| Nama | ID |
|------|----|
| Gaji | `gaji` |
| Bonus | `bonus` |
| KIP | `kip` |
| Investasi | `investasi` |
| Bisnis | `bisnis` |
| Affiliate | `affiliate` |

> Semua ikon kategori di-resolve secara runtime melalui `ICON_MAP` dan **tidak pernah disimpan ke `localStorage`** untuk menjaga efisiensi storage.

---

## Halaman & Navigasi

### Navigasi Utama (Bottom Tab Bar)
| Tab | Fungsi |
|-----|--------|
| 🏠 **Home** | Dashboard utama — ringkasan saldo, Loss Aversion Badge, riwayat transaksi terbaru |
| 📊 **Stats** | Statistik pengeluaran/pemasukan per periode |
| ➕ **Add** | Form tambah transaksi baru |
| 👤 **Profile** | Profil, pengaturan, dan kustomisasi tampilan |

### Halaman Tambah Transaksi
Form full-page dengan 3 tab mode:
- **Income** — catat pemasukan
- **Expense** — catat pengeluaran (dengan audio feedback non-konsumtif)
- **Andai** — simulasi opportunity cost

### Sub-panel dalam Form
1. **Amount** — input nominal (default panel yang terbuka)
2. **Category** — pilih atau buat kategori baru
3. **Account** — pilih akun sumber dana
4. **Note** — tambahkan catatan dengan riwayat saran

> **Reset Otomatis**: Setiap kali tombol Save ditekan, semua field (nominal, catatan, panel aktif) di-reset ke kondisi awal agar tidak ada data yang tersisa untuk transaksi berikutnya.

---

## Sistem Notifikasi

Cassiel mendukung notifikasi lokal menggunakan **Capacitor Local Notifications** (untuk Android) dengan fallback Web Notifications API (untuk browser).

### Fitur Notifikasi
- **Notifikasi terjadwal** yang dipersonalisasi berdasarkan kebiasaan pengguna
- **Notifikasi instan** untuk konfirmasi aksi penting
- **Suara efek** saat buka aplikasi (`app_open.mp3`) dan saat interaksi tab Add (`bubble_pop_1.wav`, `bubble_pop_2.wav`)
- **Positive chime** (synthesized via Web Audio API) saat menyimpan transaksi non-konsumtif
- Toggle on/off notifikasi dari halaman profil
- Status notifikasi tersimpan di `localStorage` (`user_notification_bell_enabled`)

---

## Pembaruan Otomatis (In-App Update)

Cassiel memiliki sistem pemeriksaan pembaruan otomatis yang ringan dan handal.

### Cara Kerja
1. Saat app dibuka, sistem fetch file `version.json` dari GitHub/CDN
2. Bandingkan `versionCode` lokal vs server
3. Jika ada versi lebih baru → tampilkan banner update dengan changelog
4. Pengguna bisa langsung unduh APK terbaru dari dalam aplikasi

### Endpoint Pengecekan
- **Development:** `/version.json` (lokal)
- **Production:** GitHub Raw & jsDelivr CDN (fallback otomatis)

### Format version.json
```json
{
  "versionCode": 8,
  "versionName": "1.0.7",
  "changelog": "Deskripsi perubahan versi terbaru",
  "downloadUrl": "URL download APK"
}
```

---

## Admin Dashboard

Admin Dashboard adalah panel pemantauan khusus untuk monitoring pengguna secara real-time melalui Firebase Firestore.

### Cara Akses
Tambahkan `?admin` pada URL web app:
```
http://localhost:5173/?admin
```

### Fitur Admin Dashboard
- **Daftar semua perangkat** yang telah menginstal dan membuka Cassiel
- Kolom informasi per pengguna:
  - Nama pengguna & ID perangkat unik
  - Nama device & OS (Android model, Windows PC, dsb.)
  - Tanggal & jam pertama instalasi
  - Tanggal & jam terakhir aktif
  - **Jumlah transaksi per pengguna** (badge hijau)
  - Status real-time: Online (< 5 menit), Idle (< 1 jam), Offline
- **Pencarian** berdasarkan nama, device, atau ID
- **Filter** status: Semua / Aktif / Offline
- **Auto refresh** setiap 20 menit (dengan countdown timer)
- **Real-time listener** via Firebase Firestore `onSnapshot`
- Statistik agregat: total pengguna, device aktif, total transaksi semua user

### Telemetri yang Dikirim ke Firebase
```
- ID perangkat unik (generated locally, tidak mengandung info personal sensitif)
- Nama pengguna (dari profil)
- Nama perangkat & OS (dari User-Agent)
- Waktu instalasi pertama
- Waktu terakhir aktif
- Jumlah total transaksi
- Versi aplikasi
```

> ⚠️ Data yang dikirim hanya untuk keperluan monitoring penggunaan. Tidak ada data transaksi, nominal, atau informasi sensitif finansial yang dikirim ke server.

---

## Tech Stack

### Frontend
| Teknologi | Versi | Fungsi |
|-----------|-------|--------|
| **React** | 19.x | UI Framework |
| **Vite** | 8.x | Build Tool & Dev Server |
| **Vanilla CSS** | — | Styling (glassmorphism, animasi) |
| **Lucide React** | 1.x | Icon set |
| **Web Audio API** | Native | Synthesized audio feedback (positive chime) |

### Mobile
| Teknologi | Versi | Fungsi |
|-----------|-------|--------|
| **Capacitor** | 8.x | Bridge Web → Android |
| **@capacitor/local-notifications** | 8.x | Notifikasi lokal Android |
| **@capacitor/app** | 8.x | App lifecycle events |

### Backend / Cloud
| Teknologi | Fungsi |
|-----------|--------|
| **Firebase Firestore** | Database real-time untuk telemetri admin |
| **GitHub Raw / jsDelivr** | CDN hosting `version.json` untuk update checker |
| **Firebase Hosting** (opsional) | Deploy web app |

### Tooling
| Teknologi | Fungsi |
|-----------|--------|
| **OxLint** | Fast JavaScript linter |

---

## Struktur Proyek

```
finance-tracker/
├── src/
│   ├── App.jsx               # Komponen utama & seluruh logika UI
│   │                         # (AndaiFeatureView, LossAversionBadge, App)
│   ├── App.css               # Stylesheet utama (glassmorphism, animasi, layout)
│   ├── main.jsx              # Entry point React
│   ├── index.css             # Global reset & font
│   ├── assets/               # SVG ikon kategori (21 expense + 6 income)
│   │   └── ... (32 file SVG total)
│   ├── components/
│   │   └── admin/
│   │       ├── AdminDashboard.jsx   # Panel admin monitoring real-time
│   │       └── AdminDashboard.css
│   └── utils/
│       ├── classifier.js     # Hybrid AI classifier + threshold Food/Coffee/Barber
│       │                     # + getConsumptiveTransactions() per-category grouping
│       ├── soundFeedback.js  # Web Audio API positive chime (C5→E5→G5→C6 arpeggio)
│       ├── firebase.js       # Firebase initialization
│       ├── notifications.js  # Notifikasi lokal & suara efek
│       ├── telemetry.js      # Telemetri perangkat ke Firebase Firestore
│       └── version.js        # In-app update checker
├── public/
│   ├── version.json          # Manifest versi untuk update checker
│   ├── favicon.svg           # Favicon aplikasi
│   ├── audio/                # Efek suara (app_open, bubble_pop) — bukan chime
│   └── ...
├── android/                  # Project Android (Capacitor)
├── capacitor.config.json     # Konfigurasi Capacitor
├── package.json
├── vite.config.js
└── firebase.json
```

---

## Cara Menjalankan (Development)

### Prasyarat
- Node.js >= 18.x
- npm >= 9.x

### Langkah
```bash
# Clone repositori
git clone https://github.com/redilah/Finance-tracker.git
cd Finance-tracker

# Install dependensi
npm install

# Jalankan dev server
npm run dev
```

Server akan berjalan di: **http://localhost:5173**

### Akses Admin Dashboard (Development)
```
http://localhost:5173/?admin
```

---

## Build & Deploy

### Build Web App (Production)
```bash
npm run build
```
Output build ada di folder `dist/`.

### Lint
```bash
npm run lint
```

### Preview Build Lokal
```bash
npm run preview
```

---

## Build APK Android

### Prasyarat Tambahan
- Java JDK 17+
- Android SDK
- Capacitor CLI

### Langkah Build APK Release

```bash
# 1. Build web app terlebih dahulu
npm run build

# 2. Sync ke project Android
npx cap sync android

# 3. Masuk ke direktori android
cd android

# 4. Build APK release
./gradlew assembleRelease
```

APK hasil build tersedia di:
```
android/app/build/outputs/apk/release/app-release.apk
```

### Catatan Penting Build
- Pastikan `versionCode` di-increment setiap rilis baru di `android/app/build.gradle`
- Signing menggunakan keystore release (`signingConfigs.release`)
- Verifikasi tanda tangan: `apksigner verify --print-certs <path-apk>`
- Ikon notifikasi harus ada di folder `drawable-*`, bukan `mipmap-*`
- Hindari JPEG yang di-rename jadi `.png` — AAPT akan menolaknya

---

## Penyimpanan Data

Seluruh data pengguna disimpan di **`localStorage`** browser / WebView. Tidak ada data finansial yang dikirim ke server.

### Key localStorage yang Digunakan
| Key | Isi |
|-----|-----|
| `user_transactions` | Array semua transaksi (tanpa field `icon`) |
| `user_expense_categories` | Daftar kategori pengeluaran kustom |
| `user_income_categories` | Daftar kategori pemasukan kustom |
| `user_accounts_list` | Daftar akun pengguna |
| `user_profile_name` | Nama pengguna |
| `user_profile_image` | Foto profil (JPEG terkompresi, max 256px) |
| `user_app_wallpaper` | Wallpaper aplikasi (JPEG terkompresi, max 1024px) |
| `user_profile_setup_done` | Flag setup pertama kali |
| `user_notification_bell_enabled` | Status notifikasi |
| `app_device_id` | ID perangkat unik (untuk telemetri) |
| `app_install_date` | Tanggal instalasi pertama |

### Aturan Penyimpanan
- **Dilarang** menyimpan SVG mentah atau string Base64 besar di objek transaksi
- Ikon di-resolve **runtime-only** melalui `ICON_MAP`, tidak pernah disimpan
- Foto profil wajib dikompres sebelum disimpan
- Wallpaper wajib dikompres sebelum disimpan

### Migrasi Data Lama
Cassiel memiliki fungsi `migrateTransactions()` yang otomatis membersihkan field `icon` lama dari data transaksi yang tersimpan, dan memetakan nama kategori ke `categoryId` yang baru.

---

## Versi & Changelog

| Versi | Version Code | Keterangan |
|-------|-------------|------------|
| **1.0.8** | 9 | Audio Feedback, Loss Aversion Badge, Threshold Food & Coffee, Rincian Andai per Kategori |
| 1.0.7 | 8 | Peningkatan stabilitas & sistem pembaruan otomatis |
| 1.0.6 | 7 | Rilis sebelumnya |

### Rilis Terkini — v1.0.8

Pembaruan besar dengan 4 fitur baru:

#### 🔊 Audio Feedback — Positive Chime
Suara chime C5→E5→G5→C6 (synthesized via Web Audio API) berbunyi saat menyimpan pengeluaran non-konsumtif.

#### 🚨 Loss Aversion Badge
Kartu peringatan otomatis di Home menggunakan framing "kehilangan" — dapat diklik untuk langsung masuk ke fitur Andai.

#### 🍔☕ Threshold Kategori Food & Coffee
- **Food**: Single > Rp 50.000 atau akumulasi harian > Rp 75.000 → Konsumtif
- **Coffee**: Single > Rp 20.000 atau akumulasi harian > Rp 20.000 → Konsumtif
- Kelebihan dihitung sebagai `Total − Limit` (bukan total keseluruhan)

#### 📊 Rincian Andai Per Kategori
Tampilan rincian konsumtif di fitur Andai kini dikelompokkan per kategori dengan subteks informatif, bukan per transaksi individual.

---

## Lisensi & Privasi

- Seluruh data finansial pengguna tersimpan **lokal di perangkat** dan tidak pernah diunggah ke server manapun
- Data telemetri yang dikirim ke Firebase hanya berisi informasi teknis perangkat (bukan data transaksi)
- Lihat [PRIVACY.md](./PRIVACY.md) untuk kebijakan privasi lengkap

---

<div align="center">
  <strong>Cassiel</strong> — Catat. Analisis. Bijak Berbelanja.
  <br>
  Dibuat dengan ❤️ untuk membantu kamu lebih sadar dalam mengelola keuangan pribadi.
</div>

import { parseVoiceTransaction } from '../src/utils/voiceParser.js';

const testCases = [
  // 1. Perintah Hapus Suara (Voice Delete) dengan Tanda Baca & Noise STT
  {
    name: 'Hapus dengan titik di akhir',
    input: 'hapus bakwan.',
    expected: { action: 'DELETE', targetQuery: 'bakwan' }
  },
  {
    name: 'Hapus dengan tanda seru dan spasi',
    input: 'tolong hapus transaksi bakwan!',
    expected: { action: 'DELETE', targetQuery: 'bakwan' }
  },
  {
    name: 'Hapus dengan tanda tanya dan nominal',
    input: 'hapus bakwan 9 ribu?',
    expected: { action: 'DELETE', targetQuery: 'bakwan', targetAmount: 9000 }
  },
  {
    name: 'Hapus transaksi terakhir dengan titik',
    input: 'hapus transaksi terakhir.',
    expected: { action: 'DELETE', isLast: true }
  },
  {
    name: 'Batalkan barusan dengan titik',
    input: 'batalkan yang barusan.',
    expected: { action: 'DELETE', isLast: true }
  },
  {
    name: 'Hapus nominal saja dengan koma',
    input: 'hapus 20 ribu,',
    expected: { action: 'DELETE', targetAmount: 20000 }
  },
  {
    name: 'Hapus slang nominal',
    input: 'hapus ceban dong.',
    expected: { action: 'DELETE', targetAmount: 10000 }
  },
  {
    name: 'Hapus dengan awalan tolong',
    input: 'tolong hapus nasi padang 25 ribu.',
    expected: { action: 'DELETE', targetQuery: 'nasi padang', targetAmount: 25000 }
  },
  {
    name: 'Hapus dengan kata batalin',
    input: 'batalin kopi kenangan 22k!',
    expected: { action: 'DELETE', targetQuery: 'kopi kenangan', targetAmount: 22000 }
  },

  // 2. Ralat Lisan, Koreksi Spontan & Speech Disfluencies
  {
    name: 'Ralat dengan apa maksudku',
    input: 'apa maksudku bakwan pink 20 ribu',
    expected: { type: 'Expense', amount: 20000, note: 'Bakwan pink', categoryId: 'food' }
  },
  {
    name: 'Beli dengan apa maksudku',
    input: 'beli apa maksudku bakwan pink 20 ribu',
    expected: { type: 'Expense', amount: 20000, note: 'Bakwan pink', categoryId: 'food' }
  },
  {
    name: 'Ralat ganti item dan nominal',
    input: 'beli nasi goreng 15 ribu eh maksudku bakwan pink 20 ribu',
    expected: { type: 'Expense', amount: 20000, note: 'Bakwan pink', categoryId: 'food' }
  },
  {
    name: 'Ralat nominal saja',
    input: 'beli bakso 15 ribu maksudku 20 ribu',
    expected: { type: 'Expense', amount: 20000, note: 'Bakso', categoryId: 'food' }
  },
  {
    name: 'Ralat dengan bukan deng',
    input: 'kopi susu 15 ribu bukan deng kopi latte 25 ribu',
    expected: { type: 'Expense', amount: 25000, note: 'Kopi latte', categoryId: 'coffee' }
  },
  {
    name: 'Ralat dengan salah tadi',
    input: 'bensin 30 ribu salah tadi bensin pertamax 50 ribu',
    expected: { type: 'Expense', amount: 50000, note: 'Bensin pertamax', categoryId: 'bensin' }
  },
  {
    name: 'Ralat dengan ralat deh',
    input: 'beli martabak 30 ribu ralat deh 35 ribu',
    expected: { type: 'Expense', amount: 35000, note: 'Martabak', categoryId: 'food' }
  },
  {
    name: 'Ralat dengan gak jadi tapi',
    input: 'beli soto 15 ribu gak jadi tapi nasi padang 25 ribu',
    expected: { type: 'Expense', amount: 25000, note: 'Nasi padang', categoryId: 'food' }
  },
  {
    name: 'Filler apa namanya tuh',
    input: 'tolong catat beli apa namanya tuh mie ayam 18 ribu',
    expected: { type: 'Expense', amount: 18000, note: 'Mie ayam', categoryId: 'food' }
  },
  {
    name: 'Filler apa ya',
    input: 'apa ya nasi padang 25 ribu pake bca',
    expected: { type: 'Expense', amount: 25000, note: 'Nasi padang', account: 'Bank' }
  },
  {
    name: 'Filler tolong catatkan dong',
    input: 'tolong catatkan dong beli martabak manis 35 ribu',
    expected: { type: 'Expense', amount: 35000, note: 'Martabak manis', categoryId: 'food' }
  },
  {
    name: 'Filler gimana sih',
    input: 'beli apa sih namanya donat jco 60 ribu',
    expected: { type: 'Expense', amount: 60000, note: 'Donat jco', categoryId: 'food' }
  },
  {
    name: 'Filler bentar dulu',
    input: 'bentar dulu catat kopi susu 18 ribu',
    expected: { type: 'Expense', amount: 18000, note: 'Kopi susu', categoryId: 'coffee' }
  },

  // 3. Konversi Nominal Slang & Bahasa Gaul Indonesia
  {
    name: 'Slang goceng',
    input: 'beli es teh goceng',
    expected: { type: 'Expense', amount: 5000, categoryId: 'coffee' }
  },
  {
    name: 'Slang ceban',
    input: 'beli gorengan ceban',
    expected: { type: 'Expense', amount: 10000, categoryId: 'food' }
  },
  {
    name: 'Slang noban',
    input: 'beli bensin noban',
    expected: { type: 'Expense', amount: 20000, categoryId: 'bensin' }
  },
  {
    name: 'Slang goban',
    input: 'potong rambut goban pake cash',
    expected: { type: 'Expense', amount: 50000, categoryId: 'barber', account: 'Cash' }
  },
  {
    name: 'Slang pego',
    input: 'beli sepatu pego',
    expected: { type: 'Expense', amount: 150000, categoryId: 'sepatu' }
  },
  {
    name: 'Slang 1.5 juta',
    input: 'bayar kosan 1.5 juta via mandiri',
    expected: { type: 'Expense', amount: 1500000, categoryId: 'kost', account: 'Bank' }
  },
  {
    name: 'Slang 2.5 jt',
    input: 'beli tiket pesawat 2.5 jt',
    expected: { type: 'Expense', amount: 2500000, categoryId: 'pesawat' }
  },
  {
    name: 'Slang 2 setengah juta',
    input: 'gaji bulanan 2 setengah juta',
    expected: { type: 'Income', amount: 2500000, categoryId: 'gaji' }
  },
  {
    name: 'Slang setengah juta',
    input: 'dapat bonus setengah juta',
    expected: { type: 'Income', amount: 500000, categoryId: 'bonus' }
  },
  {
    name: 'Slang 500k',
    input: 'belanja bulanan di supermarket 500k',
    expected: { type: 'Expense', amount: 500000, categoryId: 'supermarket' }
  },
  {
    name: 'Slang 50k',
    input: 'top up mobile legends 50k pake gopay',
    expected: { type: 'Expense', amount: 50000, categoryId: 'topupGame', account: 'QRIS' }
  },
  {
    name: 'Slang 100rb',
    input: 'isi token listrik 100rb',
    expected: { type: 'Expense', amount: 100000, categoryId: 'pulsa' }
  },
  {
    name: 'Slang sejuta',
    input: 'gajian sejuta dari magang',
    expected: { type: 'Income', amount: 1000000, categoryId: 'gaji' }
  },

  // 4. Deteksi Multi-Akun & Rekening Bank / E-Wallet
  {
    name: 'Akun BCA',
    input: 'makan siang nasi padang 25 ribu transfer bca',
    expected: { amount: 25000, account: 'Bank' }
  },
  {
    name: 'Akun Mandiri Livin',
    input: 'bayar listrik 100 ribu pake livin',
    expected: { amount: 100000, account: 'Bank' }
  },
  {
    name: 'Akun BRI Brimo',
    input: 'beli kuota internet 50 ribu pake brimo',
    expected: { amount: 50000, account: 'Bank' }
  },
  {
    name: 'Akun Bank Jago',
    input: 'bayar langganan netflix 65 ribu pake jago',
    expected: { amount: 65000, account: 'Bank' }
  },
  {
    name: 'Akun SeaBank',
    input: 'beli baju 120 ribu pake seabank',
    expected: { amount: 120000, account: 'Bank' }
  },
  {
    name: 'Akun QRIS Scan',
    input: 'kopi janji jiwa 22 ribu scan qris',
    expected: { amount: 22000, account: 'QRIS' }
  },
  {
    name: 'Akun ShopeePay / Spay',
    input: 'beli skincare 85 ribu bayar spay',
    expected: { amount: 85000, account: 'QRIS' }
  },
  {
    name: 'Akun Dana',
    input: 'bayar pdam 45 ribu bayar dana',
    expected: { amount: 45000, account: 'QRIS' }
  },
  {
    name: 'Akun OVO',
    input: 'order grabfood 35 ribu bayar ovo',
    expected: { amount: 35000, account: 'QRIS' }
  },
  {
    name: 'Akun Cash Tunai',
    input: 'isi bensin pertalite 20 ribu tunai',
    expected: { amount: 20000, account: 'Cash' }
  },

  // 5. Pemasukan (Income Multi-Category)
  {
    name: 'Gaji Pokok',
    input: 'dapat gaji pokok 5 juta masuk rekening bca',
    expected: { type: 'Income', amount: 5000000, categoryId: 'gaji' }
  },
  {
    name: 'Bonus THR Lebaran',
    input: 'alhamdulillah cair thr 2 juta',
    expected: { type: 'Income', amount: 2000000, categoryId: 'bonus' }
  },
  {
    name: 'Insentif Penjualan',
    input: 'dapat insentif 400 ribu',
    expected: { type: 'Income', amount: 400000, categoryId: 'bonus' }
  },
  {
    name: 'Hasil Bisnis Jualan',
    input: 'orderan masuk hasil jualan toko 350 ribu',
    expected: { type: 'Income', amount: 350000, categoryId: 'bisnis' }
  },
  {
    name: 'Shopee Affiliate Komisi',
    input: 'komisi shopee affiliate cair 120 ribu',
    expected: { type: 'Income', amount: 120000, categoryId: 'affiliate' }
  },
  {
    name: 'Dana Beasiswa KIP',
    input: 'uang saku beasiswa kip kuliah masuk 700 ribu',
    expected: { type: 'Income', amount: 700000, categoryId: 'kip' }
  },
  {
    name: 'Dividen / Profit Saham',
    input: 'cair dividen saham 250 ribu ke rekening',
    expected: { type: 'Income', amount: 250000, categoryId: 'investasi' }
  },

  // 6. Pengeluaran Kategori Komprehensif (Expense Categories)
  {
    name: 'GoFood Makanan',
    input: 'pesen gofood ayam geprek 28 ribu',
    expected: { type: 'Expense', amount: 28000, categoryId: 'gofood' }
  },
  {
    name: 'GrabFood Delivery',
    input: 'order grabfood soto betawi 32 ribu',
    expected: { type: 'Expense', amount: 32000, categoryId: 'gofood' }
  },
  {
    name: 'Tiket Bioskop XXI',
    input: 'nonton film di xxi 50 ribu pake qris',
    expected: { type: 'Expense', amount: 50000, categoryId: 'bioskop' }
  },
  {
    name: 'Tiket Pesawat AirAsia',
    input: 'beli tiket pesawat airasia 850 ribu',
    expected: { type: 'Expense', amount: 850000, categoryId: 'pesawat' }
  },
  {
    name: 'Uang Jajan Adek',
    input: 'kasih uang jajan adek 20 ribu',
    expected: { type: 'Expense', amount: 20000, categoryId: 'jajanAdek' }
  },
  {
    name: 'Donasi Sedekah Subuh',
    input: 'sedekah subuh di kotak amal 15 ribu tunai',
    expected: { type: 'Expense', amount: 15000, categoryId: 'donasi' }
  },
  {
    name: 'Air Galon Le Minerale',
    input: 'beli air galon le minerale 20 ribu',
    expected: { type: 'Expense', amount: 20000, categoryId: 'galon' }
  },
  {
    name: 'Langganan Netflix',
    input: 'bayar langganan netflix 65 ribu',
    expected: { type: 'Expense', amount: 65000, categoryId: 'sub' }
  },
  {
    name: 'Obat di Apotek K24',
    input: 'beli tolak angin dan obat di apotek 30 ribu',
    expected: { type: 'Expense', amount: 30000, categoryId: 'obatSakit' }
  },
  {
    name: 'Periksa Dokter Gigi',
    input: 'periksa dokter tambal gigi di rumah sakit 180 ribu',
    expected: { type: 'Expense', amount: 180000, categoryId: 'rumahSakit' }
  },
  {
    name: 'Tiket Konser Musik',
    input: 'beli tiket konser coldplay 1.200.000',
    expected: { type: 'Expense', amount: 1200000, categoryId: 'konser' }
  },
  {
    name: 'Hadiah Kado Ultah Party',
    input: 'beli kado ulang tahun sahabat 100 ribu',
    expected: { type: 'Expense', amount: 100000, categoryId: 'party' }
  },
  {
    name: 'Cuci Sepatu Sneakers',
    input: 'cuci sepatu sneakers aerostreet 35 ribu',
    expected: { type: 'Expense', amount: 35000, categoryId: 'sepatu' }
  },
  {
    name: 'Edukasi Beli Buku Gramedia',
    input: 'beli buku novel di gramedia 85 ribu',
    expected: { type: 'Expense', amount: 85000, categoryId: 'edukasi' }
  },
  // 7. Multi-Action Voice Commands (Multi-Intent / Compound Commands)
  {
    name: 'Multi-Action: Hapus + Tambah Baru',
    input: 'hapus bakwan tambahkan bakmie 13 ribu',
    expected: {
      isMultiple: true,
      commands: [
        { action: 'DELETE', targetQuery: 'bakwan' },
        { type: 'Expense', amount: 13000, note: 'Bakmie', categoryId: 'food' }
      ]
    }
  },
  {
    name: 'Multi-Action: Hapus Terakhir + Tambah Baru',
    input: 'hapus transaksi terakhir lalu catat kopi susu 18 ribu',
    expected: {
      isMultiple: true,
      commands: [
        { action: 'DELETE', isLast: true },
        { type: 'Expense', amount: 18000, note: 'Kopi susu', categoryId: 'coffee' }
      ]
    }
  },
  {
    name: 'Multi-Action: Dua Pengeluaran (dan)',
    input: 'beli bakso 15 ribu dan es teh 5 ribu',
    expected: {
      isMultiple: true,
      commands: [
        { type: 'Expense', amount: 15000, note: 'Bakso', categoryId: 'food' },
        { type: 'Expense', amount: 5000, note: 'Es teh', categoryId: 'coffee' }
      ]
    }
  },
  {
    name: 'Multi-Action: Makan + Bensin (sama beli)',
    input: 'makan siang nasi padang 25 ribu sama beli bensin 30 ribu',
    expected: {
      isMultiple: true,
      commands: [
        { type: 'Expense', amount: 25000, note: 'Makan siang nasi padang', categoryId: 'food' },
        { type: 'Expense', amount: 30000, note: 'Bensin', categoryId: 'bensin' }
      ]
    }
  },
  {
    name: 'Multi-Action: Gaji + Beli Baju (terus)',
    input: 'dapat gaji 5 juta terus beli baju 200 ribu',
    expected: {
      isMultiple: true,
      commands: [
        { type: 'Income', amount: 5000000, note: 'Gaji', categoryId: 'gaji' },
        { type: 'Expense', amount: 200000, note: 'Baju', categoryId: 'fashion' }
      ]
    }
  },
  {
    name: 'Multi-Action: Dua Hapus Sekaligus',
    input: 'hapus bakwan dan hapus es teh',
    expected: {
      isMultiple: true,
      commands: [
        { action: 'DELETE', targetQuery: 'bakwan' },
        { action: 'DELETE', targetQuery: 'es teh' }
      ]
    }
  },
  {
    name: 'Single Non-Split: Roti dan Selai',
    input: 'beli roti dan selai 20 ribu',
    expected: { type: 'Expense', amount: 20000, note: 'Roti dan selai', categoryId: 'food' }
  },

  // 8. Filter Suara Kebisingan Lingkungan (Noise / Musik / Hewan / Benda Jatuh / Tes Mic)
  {
    name: 'Noise: Suara Kucing (Meong)',
    input: 'meong meong meong',
    expected: { shouldReject: true, reason: 'noise_detected' }
  },
  {
    name: 'Noise: Suara Anjing (Guk Guk)',
    input: 'guk guk guk guguk',
    expected: { shouldReject: true, reason: 'noise_detected' }
  },
  {
    name: 'Noise: Suara Ayam Berkokok (Kukuruyuk)',
    input: 'kukuruyuk petok petok',
    expected: { shouldReject: true, reason: 'noise_detected' }
  },
  {
    name: 'Noise: Suara Musik / Senandung (Lalala Nanana)',
    input: 'la la la lalala nanana',
    expected: { shouldReject: true, reason: 'noise_detected' }
  },
  {
    name: 'Noise: Suara Instrumen / Lirik Lagu',
    input: 'jreng jreng suara gitar nada dering',
    expected: { shouldReject: true, reason: 'noise_detected' }
  },
  {
    name: 'Noise: Benda Jatuh / Benturan (Gubrak)',
    input: 'gubrak gedebuk suara jatuh',
    expected: { shouldReject: true, reason: 'noise_detected' }
  },
  {
    name: 'Noise: Piring Pecah / Klontang',
    input: 'prang klontang piring pecah',
    expected: { shouldReject: true, reason: 'noise_detected' }
  },
  {
    name: 'Noise: Tes Mic / Obrolan Non-Finansial (Tes 1 2 3)',
    input: 'tes mic 1 2 3 cek suara',
    expected: { shouldReject: true }
  },
  {
    name: 'Noise: Sapaan Santai (Halo halo apa kabar)',
    input: 'halo halo apa kabar selamat pagi',
    expected: { shouldReject: true }
  },
  {
    name: 'Noise: Ucapan Vokal Acak / Desah',
    input: 'uhh',
    expected: { shouldReject: true }
  },

  // 9. Validasi Transaksi Manusia Nyata yang Mirip Kata Noise (Anti-False-Positive)
  {
    name: 'Human Voice: Beli Makanan Kucing (Valid)',
    input: 'beli makanan kucing 45 ribu',
    expected: { type: 'Expense', amount: 45000, categoryId: 'food' }
  },
  {
    name: 'Human Voice: Ayam Goreng (Valid)',
    input: 'beli ayam goreng 25 ribu',
    expected: { type: 'Expense', amount: 25000, categoryId: 'food' }
  },
  {
    name: 'Human Voice: Bayar Kursus Musik / Gitar (Valid)',
    input: 'bayar kursus gitar 250 ribu',
    expected: { type: 'Expense', amount: 250000, categoryId: 'edukasi' }
  },
  {
    name: 'Human Voice: Ganti Piring Pecah (Valid)',
    input: 'beli piring baru 30 ribu',
    expected: { type: 'Expense', amount: 30000 }
  },

  // 10. Kategori Buah-buahan (Fresh Fruit Transaction Multi-Variations)
  {
    name: 'Buah: Nanas 1 kilo 5 ribu (Kasus Utama)',
    input: 'buah nanas 1 kilo 5 ribu',
    expected: { type: 'Expense', amount: 5000, categoryId: 'buah' }
  },
  {
    name: 'Buah: Beli Buah Nanas Madu 15 Ribu',
    input: 'beli buah nanas madu 15 ribu',
    expected: { type: 'Expense', amount: 15000, categoryId: 'buah' }
  },
  {
    name: 'Buah: Beli Apel Fuji Sekilo 35 Ribu',
    input: 'beli apel fuji sekilo 35 ribu',
    expected: { type: 'Expense', amount: 35000, categoryId: 'buah' }
  },
  {
    name: 'Buah: Semangka Merah 20rb Pake QRIS',
    input: 'semangka merah 20rb pake qris',
    expected: { type: 'Expense', amount: 20000, categoryId: 'buah', account: 'QRIS' }
  },
  {
    name: 'Buah: Mangga Harum Manis 2 Kilo 40 Ribu',
    input: 'mangga harum manis 2 kilo 40 ribu',
    expected: { type: 'Expense', amount: 40000, categoryId: 'buah' }
  },
  {
    name: 'Buah: Durian Montong 150 Ribu Bayar Cash',
    input: 'durian montong 150 ribu bayar cash',
    expected: { type: 'Expense', amount: 150000, categoryId: 'buah', account: 'Cash' }
  },
  {
    name: 'Buah: Beli Jeruk Medan Sekilo 28 Ribu',
    input: 'beli jeruk medan sekilo 28 ribu',
    expected: { type: 'Expense', amount: 28000, categoryId: 'buah' }
  },
  {
    name: 'Buah: Pisang Cavendish 30 Ribu Transfer BCA',
    input: 'pisang cavendish 30 ribu transfer bca',
    expected: { type: 'Expense', amount: 30000, categoryId: 'buah', account: 'Bank' }
  },
  {
    name: 'Buah: Alpukat Mentega 1 Kilo 25 Ribu',
    input: 'alpukat mentega 1 kilo 25 ribu',
    expected: { type: 'Expense', amount: 25000, categoryId: 'buah' }
  },
  {
    name: 'Buah: Anggur Shine Muscat 85 Ribu Scan QRIS',
    input: 'anggur shine muscat 85 ribu scan qris',
    expected: { type: 'Expense', amount: 85000, categoryId: 'buah', account: 'QRIS' }
  },
  {
    name: 'Buah: Belanja di Toko Buah 100 Ribu',
    input: 'belanja di toko buah 100 ribu',
    expected: { type: 'Expense', amount: 100000, categoryId: 'buah' }
  },
  {
    name: 'Buah: Buah Naga Merah 22 Ribu',
    input: 'buah naga merah 22 ribu',
    expected: { type: 'Expense', amount: 22000, categoryId: 'buah' }
  },
  {
    name: 'Buah: Salak Pondoh Sekilo 15 Ribu',
    input: 'salak pondoh sekilo 15 ribu',
    expected: { type: 'Expense', amount: 15000, categoryId: 'buah' }
  },
  {
    name: 'Buah: Kelengkeng Bangkok 45 Ribu Pake Mandiri',
    input: 'kelengkeng bangkok 45 ribu pake mandiri',
    expected: { type: 'Expense', amount: 45000, categoryId: 'buah', account: 'Bank' }
  },
  {
    name: 'Buah: Pepaya California 18 Ribu Tunai',
    input: 'pepaya california 18 ribu tunai',
    expected: { type: 'Expense', amount: 18000, categoryId: 'buah', account: 'Cash' }
  },
  {
    name: 'Buah: Multi-Action Buah + Makanan (dan)',
    input: 'beli buah nanas 5 ribu dan mie ayam 15 ribu',
    expected: {
      isMultiple: true,
      commands: [
        { type: 'Expense', amount: 5000, categoryId: 'buah' },
        { type: 'Expense', amount: 15000, categoryId: 'food' }
      ]
    }
  },

  // 11. Kategori Minuman Segar & Kemasan (Beverages)
  {
    name: 'Minuman: Beli Es Buah 15 Ribu',
    input: 'beli es buah 15 ribu',
    expected: { type: 'Expense', amount: 15000, categoryId: 'minuman' }
  },
  {
    name: 'Minuman: Es Kacang Hijau 8 Ribu',
    input: 'es kacang hijau 8 ribu',
    expected: { type: 'Expense', amount: 8000, categoryId: 'minuman' }
  },
  {
    name: 'Minuman: Coca Cola Dingin 7 Ribu Tunai',
    input: 'coca cola dingin 7 ribu tunai',
    expected: { type: 'Expense', amount: 7000, categoryId: 'minuman', account: 'Cash' }
  },
  {
    name: 'Minuman: Pocari Sweat 10 Ribu Transfer BCA',
    input: 'pocari sweat 10 ribu transfer bca',
    expected: { type: 'Expense', amount: 10000, categoryId: 'minuman', account: 'Bank' }
  },
  {
    name: 'Minuman: Jus Alpukat 12 Ribu Scan QRIS',
    input: 'jus alpukat 12 ribu scan qris',
    expected: { type: 'Expense', amount: 12000, categoryId: 'minuman', account: 'QRIS' }
  },
  {
    name: 'Minuman: Teh Pucuk Harum 4 Ribu',
    input: 'teh pucuk harum 4 ribu',
    expected: { type: 'Expense', amount: 4000, categoryId: 'minuman' }
  },
  {
    name: 'Minuman: Ultra Milk Coklat 6 Ribu',
    input: 'ultra milk coklat 6 ribu',
    expected: { type: 'Expense', amount: 6000, categoryId: 'minuman' }
  },
  {
    name: 'Minuman: Es Cendol Dawet 10 Ribu',
    input: 'es cendol dawet 10 ribu',
    expected: { type: 'Expense', amount: 10000, categoryId: 'minuman' }
  },
  {
    name: 'Minuman: Es Degan Kelapa Muda 12 Ribu',
    input: 'es degan kelapa muda 12 ribu',
    expected: { type: 'Expense', amount: 12000, categoryId: 'minuman' }
  },
  {
    name: 'Minuman: Wedang Jahe Ronde 15 Ribu',
    input: 'wedang jahe ronde 15 ribu',
    expected: { type: 'Expense', amount: 15000, categoryId: 'minuman' }
  },
  {
    name: 'Minuman: Multi-Action Sprite + Fanta',
    input: 'beli sprite 6 ribu dan fanta 6 ribu',
    expected: {
      isMultiple: true,
      commands: [
        { type: 'Expense', amount: 6000, categoryId: 'minuman' },
        { type: 'Expense', amount: 6000, categoryId: 'minuman' }
      ]
    }
  },

  // 12. Safety Guard: Penolakan Minuman Keras / Miras / Alkohol
  {
    name: 'Safety Guard: Penolakan Miras',
    input: 'beli miras 100 ribu',
    expected: { shouldReject: true, reason: 'prohibited_content' }
  },
  {
    name: 'Safety Guard: Penolakan Bir Bintang',
    input: 'beli bir bintang 50 ribu',
    expected: { shouldReject: true, reason: 'prohibited_content' }
  },
  {
    name: 'Safety Guard: Penolakan Whiskey Transfer BCA',
    input: 'whiskey 500 ribu transfer bca',
    expected: { shouldReject: true, reason: 'prohibited_content' }
  },
  {
    name: 'Safety Guard: Penolakan Arak Bali',
    input: 'arak bali 75 ribu',
    expected: { shouldReject: true, reason: 'prohibited_content' }
  },
  {
    name: 'Safety Guard: Penolakan Soju',
    input: 'beli soju 80 ribu bayar qris',
    expected: { shouldReject: true, reason: 'prohibited_content' }
  },

  // 13. Pembedaan Buah Segar vs Minuman (Anti-False-Positive)
  {
    name: 'Distinction: Buah Anggur Merah (Bukan Miras Amer)',
    input: 'buah anggur merah sekilo 45 ribu',
    expected: { type: 'Expense', amount: 45000, categoryId: 'buah' }
  },
  {
    name: 'Distinction: Buah Nanas (Kategori Buah)',
    input: 'buah nanas madu 15 ribu',
    expected: { type: 'Expense', amount: 15000, categoryId: 'buah' }
  },
  {
    name: 'Distinction: Es Buah (Kategori Minuman)',
    input: 'es buah segar 15 ribu',
    expected: { type: 'Expense', amount: 15000, categoryId: 'minuman' }
  }
];

function runTests() {
  let passed = 0;
  let failed = 0;
  console.log(`\n🚀 MENJALANKAN BENCHMARK VOICE PARSER TEST SUITE (${testCases.length} Test Cases)...\n`);

  for (const tc of testCases) {
    const res = parseVoiceTransaction(tc.input);

    let isMatch = true;
    const errors = [];

    if (tc.expected.shouldReject) {
      if (res.success) {
        isMatch = false;
        errors.push(`Expected rejection for noise/non-transaction but got success with amount ${res.amount}`);
      }
    } else if (tc.expected.isMultiple) {
      if (!res.isMultiple || !Array.isArray(res.commands)) {
        isMatch = false;
        errors.push(`Expected isMultiple=true but got single result`);
      } else if (res.commands.length !== tc.expected.commands.length) {
        isMatch = false;
        errors.push(`Expected ${tc.expected.commands.length} commands but got ${res.commands.length}`);
      } else {
        for (let i = 0; i < tc.expected.commands.length; i++) {
          const expCmd = tc.expected.commands[i];
          const actCmd = res.commands[i];
          if (expCmd.action === 'DELETE') {
            if (actCmd.action !== 'DELETE') errors.push(`Cmd[${i}] action expected DELETE but got ${actCmd.action}`);
            if (expCmd.targetQuery && actCmd.targetQuery !== expCmd.targetQuery) errors.push(`Cmd[${i}] targetQuery expected "${expCmd.targetQuery}" but got "${actCmd.targetQuery}"`);
            if (expCmd.isLast !== undefined && actCmd.isLast !== expCmd.isLast) errors.push(`Cmd[${i}] isLast expected ${expCmd.isLast} but got ${actCmd.isLast}`);
          } else {
            if (expCmd.type && actCmd.type !== expCmd.type) errors.push(`Cmd[${i}] type expected ${expCmd.type} but got ${actCmd.type}`);
            if (expCmd.amount && actCmd.amount !== expCmd.amount) errors.push(`Cmd[${i}] amount expected ${expCmd.amount} but got ${actCmd.amount}`);
            if (expCmd.note && actCmd.note !== expCmd.note) errors.push(`Cmd[${i}] note expected "${expCmd.note}" but got "${actCmd.note}"`);
            if (expCmd.categoryId && actCmd.category?.id !== expCmd.categoryId) errors.push(`Cmd[${i}] categoryId expected "${expCmd.categoryId}" but got "${actCmd.category?.id}"`);
          }
        }
        if (errors.length > 0) isMatch = false;
      }
    } else if (tc.expected.action === 'DELETE') {
      if (res.action !== 'DELETE') {
        isMatch = false;
        errors.push(`Action expected DELETE but got ${res.action}`);
      }
      if (tc.expected.targetQuery !== undefined && res.targetQuery !== tc.expected.targetQuery) {
        isMatch = false;
        errors.push(`targetQuery expected "${tc.expected.targetQuery}" but got "${res.targetQuery}"`);
      }
      if (tc.expected.targetAmount !== undefined && res.targetAmount !== tc.expected.targetAmount) {
        isMatch = false;
        errors.push(`targetAmount expected ${tc.expected.targetAmount} but got ${res.targetAmount}`);
      }
      if (tc.expected.isLast !== undefined && res.isLast !== tc.expected.isLast) {
        isMatch = false;
        errors.push(`isLast expected ${tc.expected.isLast} but got ${res.isLast}`);
      }
    } else {
      if (tc.expected.type && res.type !== tc.expected.type) {
        isMatch = false;
        errors.push(`Type expected ${tc.expected.type} but got ${res.type}`);
      }
      if (tc.expected.amount && res.amount !== tc.expected.amount) {
        isMatch = false;
        errors.push(`Amount expected ${tc.expected.amount} but got ${res.amount}`);
      }
      if (tc.expected.note && res.note !== tc.expected.note) {
        isMatch = false;
        errors.push(`Note expected "${tc.expected.note}" but got "${res.note}"`);
      }
      if (tc.expected.categoryId && res.category?.id !== tc.expected.categoryId) {
        isMatch = false;
        errors.push(`CategoryId expected "${tc.expected.categoryId}" but got "${res.category?.id}"`);
      }
      if (tc.expected.account && res.account !== tc.expected.account) {
        isMatch = false;
        errors.push(`Account expected "${tc.expected.account}" but got "${res.account}"`);
      }
    }

    if (isMatch) {
      passed++;
      console.log(`✅ PASS: [${tc.name}] -> "${tc.input}"`);
    } else {
      failed++;
      console.log(`❌ FAIL: [${tc.name}] -> "${tc.input}"`);
      errors.forEach(e => console.log(`   └─ ${e}`));
    }
  }

  const score = ((passed / testCases.length) * 10).toFixed(1);
  console.log(`\n========================================`);
  console.log(`📊 HASIL AKHIR BENCHMARK:`);
  console.log(`Passed: ${passed} / ${testCases.length} (${((passed / testCases.length) * 100).toFixed(1)}%)`);
  console.log(`Failed: ${failed}`);
  console.log(`Score:  ${score} / 10.0`);
  console.log(`========================================\n`);

  return { passed, failed, score: parseFloat(score) };
}

runTests();

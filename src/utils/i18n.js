/**
 * Internationalization (i18n) Engine for Cassiel Finance Tracker
 * Supports: 'id' (Bahasa Indonesia), 'en' (English), 'jv' (Basa Jawa)
 */

export const LANGUAGES = [
  { code: 'id', name: 'Default', nativeName: 'Default', flag: '🇮🇩' },
  { code: 'jv', name: 'Basa Jawa', nativeName: 'Basa Jawa', flag: '☕' },
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧' },
];

export const FONTS = [
  { id: 'outfit', name: 'Default', fontFamily: "'Outfit', sans-serif" },
  { id: 'lora', name: 'Lora', fontFamily: "'Lora', Georgia, serif" },
  { id: 'the-seasons', name: 'The Seasons', fontFamily: "'Playfair Display', 'Cormorant Garamond', Georgia, serif" },
  { id: 'amoresa', name: 'Amoresa', fontFamily: "'Great Vibes', cursive" },
];

export const CATEGORY_TRANSLATIONS = {
  jv: {
    // Pengeluaran / Pangetrapan (Bersih tanpa garis miring)
    'Food': 'Tedhan',
    'Makanan': 'Tedhan',
    'Bioskop': 'Tontonan',
    'Transportasi': 'Tumpakan',
    'Transport': 'Tumpakan',
    'Barbershop': 'Pangkas Rikma',
    'Skincare': 'Pangudi Raga',
    'Edukasi': 'Pawiyatan',
    'Air Galon': 'Toya Galon',
    'Fashion': 'Busana',
    'Supermarket': 'Blonjo Kabetahan',
    'Subscription': 'Langganan',
    'Pesawat': 'Kreteg Mabur',
    'Kost': 'Pondhokan',
    'Coffee': 'Wedang Kopi',
    'GoFood': 'Pesen Dhaharan',
    'Sepatu': 'Sepatu', // Tetap Asli
    'Donasi': 'Sedhekah',
    'Top Up Game': 'Wuwuh Gim',
    'Bensin': 'Bensin', // Tetap Asli
    'Konser': 'Pentas Musik',
    'Pulsa': 'Pulsa',   // Tetap Asli
    'Rumah Sakit': 'Panti Husada',
    'Obat Sakit': 'Jampi Kasarasan',
    'Jajan Adek': 'Paring Jajan',
    'Party': 'Pahargyan',
    'Buah': 'Woh-wohan',
    'Minuman': 'Omben-omben',
    
    // Pemasukan / Pamasukan
    'Gaji': 'Asil Makarya',
    'Bonus': 'Wuwuhan',
    'KIP': 'Beasiswa KIP',
    'Investasi': 'Investasi Arta',
    'Bisnis': 'Usaha Dagang',
    'Affiliate': 'Kemitraan',
  }
};

export const DICTIONARY = {
  id: {
    // Nav & Common
    home: 'Home',
    stats: 'Statistik',
    add: 'Tambah',
    profile: 'Profil',
    back: 'Kembali',
    save: 'Simpan',
    cancel: 'Batal',
    close: 'Tutup',
    send: 'Kirim',
    delete: 'Hapus',
    all: 'Semua',
    income: 'Income',
    expenses: 'Expenses',
    total: 'Total',
    
    // Home Filter & Cards
    filterAll: 'Semua',
    filterIncome: 'Income',
    filterExpense: 'Expense',
    noTransactions: 'Belum ada transaksi',
    noTransactionsDesc: 'Tidak ada riwayat transaksi pada periode ini',
    noIncomeDesc: 'Tidak ada riwayat pemasukan pada periode ini',
    noExpenseDesc: 'Tidak ada riwayat pengeluaran pada periode ini',
    
    // Form Labels (Default Mode: English Form Labels)
    formDate: 'Date',
    formAmount: 'Amount',
    formCategory: 'Category',
    formAccount: 'Account',
    formNote: 'Note',
    formNotePlaceholder: '',
    formSave: 'Save',
    formCancel: 'Cancel',
    formCustomCat: 'Write new category...',
    formCustomAcc: 'Write new account...',
    
    // Andai Feature
    andaiHeroLabel: 'Konsumtif Bulan Ini',
    andaiTxDetected: 'transaksi terdeteksi',
    andaiYearUnit: 'Thn',
    andaiIfBought: 'Jika Dibeli',
    andaiBurnt: 'Hangus',
    andaiIfInvested: 'Andai Diinvestasikan',
    andaiConsumptiveTitle: 'Rincian Pengeluaran Konsumtif',
    andaiEmptyClean: 'Tidak ada pengeluaran konsumtif bulan ini.',
    
    // Profile Menu
    profileSettings: 'Pengaturan Profil',
    profileNamePlaceholder: 'Masukkan Nama',
    changePhoto: 'Ganti Foto Profil',
    budgetCapTitle: 'Budget Kategori Per Bulan',
    budgetCapSubtitle: 'Atur batas maksimal pengeluaran kategori',
    fontSettingTitle: 'Gaya Tulisan (Font)',
    fontSettingSubtitle: 'Pilih font tampilan aplikasi & catatan',
    langSettingTitle: 'Bahasa (Language)',
    langSettingSubtitle: 'Pilih bahasa tampilan aplikasi',
    feedbackTitle: 'Saran & Keluh Kesah',
    feedbackSubtitle: 'Kirim masukan untuk pengembangan aplikasi',
    
    // Feedback Modal
    feedbackHeader: 'Saran & Keluh Kesah',
    feedbackHelperText: 'Ada keluhan, masalah bug, atau saran fitur baru yang Anda impikan? Tuliskan masukan Anda di bawah ini:',
    feedbackCategoryLabel: 'Jenis Masukan',
    feedbackCatIdea: '💡 Saran Fitur',
    feedbackCatGripe: '💬 Keluh Kesah',
    feedbackCatBug: '⚠️ Lapor Masalah',
    feedbackInputPlaceholder: 'Tuliskan saran, ide fitur, atau keluh kesah Anda di sini dengan leluasa...',
    feedbackSubmitBtn: 'Kirim Masukan',
    feedbackSending: 'Mengirim...',
    feedbackSuccess: 'Terima kasih! Masukan Anda telah berhasil terkirim.',
    feedbackError: 'Gagal mengirim saran. Periksa koneksi internet Anda.',
    
    // Font Modal
    selectFontTitle: 'Pilih Gaya Tulisan',
    
    // Language Modal
    selectLangTitle: 'Pilih Bahasa',
  },
  en: {
    // Nav & Common
    home: 'Home',
    stats: 'Statistics',
    add: 'Add',
    profile: 'Profile',
    back: 'Back',
    save: 'Save',
    cancel: 'Cancel',
    close: 'Close',
    send: 'Send',
    delete: 'Delete',
    all: 'All',
    income: 'Income',
    expenses: 'Expenses',
    total: 'Total',
    
    // Home Filter & Cards
    filterAll: 'All',
    filterIncome: 'Income',
    filterExpense: 'Expense',
    noTransactions: 'No transactions yet',
    noTransactionsDesc: 'No transaction history in this period',
    noIncomeDesc: 'No income recorded in this period',
    noExpenseDesc: 'No expenses recorded in this period',
    
    // Form Labels
    formDate: 'Date',
    formAmount: 'Amount',
    formCategory: 'Category',
    formAccount: 'Account',
    formNote: 'Note',
    formNotePlaceholder: '',
    formSave: 'Save',
    formCancel: 'Cancel',
    formCustomCat: 'Write new category...',
    formCustomAcc: 'Write new account...',
    
    // Andai Feature
    andaiHeroLabel: 'Consumptive This Month',
    andaiTxDetected: 'transactions detected',
    andaiYearUnit: 'Yrs',
    andaiIfBought: 'If Spent',
    andaiBurnt: 'Gone',
    andaiIfInvested: 'If Invested',
    andaiConsumptiveTitle: 'Consumptive Expense Breakdown',
    andaiEmptyClean: 'No consumptive expenses this month.',
    
    // Profile Menu
    profileSettings: 'Profile Settings',
    profileNamePlaceholder: 'Enter Your Name',
    changePhoto: 'Change Profile Picture',
    budgetCapTitle: 'Monthly Category Budget',
    budgetCapSubtitle: 'Set maximum spending limit per category',
    fontSettingTitle: 'Font Style',
    fontSettingSubtitle: 'Choose app typography and note font',
    langSettingTitle: 'Language',
    langSettingSubtitle: 'Choose interface language',
    feedbackTitle: 'Feedback & Grievances',
    feedbackSubtitle: 'Share feedback and suggestions for the app',
    
    // Feedback Modal
    feedbackHeader: 'Feedback & Grievances',
    feedbackHelperText: 'Have a complaint, bug report, or feature idea? Share your feedback below:',
    feedbackCategoryLabel: 'Feedback Type',
    feedbackCatIdea: '💡 Feature Idea',
    feedbackCatGripe: '💬 Grievance / Vent',
    feedbackCatBug: '⚠️ Bug Report',
    feedbackInputPlaceholder: 'Share your feedback, ideas, or grievances here freely...',
    feedbackSubmitBtn: 'Submit Feedback',
    feedbackSending: 'Sending...',
    feedbackSuccess: 'Thank you! Your feedback has been sent successfully.',
    feedbackError: 'Failed to send feedback. Please check your internet connection.',
    
    // Font Modal
    selectFontTitle: 'Choose Typography',
    
    // Language Modal
    selectLangTitle: 'Choose Language',
  },
  jv: {
    // Nav & Common (Krama Alus Mataraman)
    home: 'Kaca Utama',
    stats: 'Statistik',
    add: 'Wuwuh',
    profile: 'Profil',
    back: 'Wangsul',
    save: 'Simpen',
    cancel: 'Batal',
    close: 'Tutup',
    send: 'Kintun',
    delete: 'Busek',
    all: 'Sedaya',
    income: 'Pamasukan',
    expenses: 'Pangetrapan',
    total: 'Gunggungipun',
    
    // Home Filter & Cards
    filterAll: 'Sedaya',
    filterIncome: 'Pamasukan',
    filterExpense: 'Pangetrapan',
    noTransactions: 'Dereng wonten cathetan',
    noTransactionsDesc: 'Mboten wonten riwayat transaksi ing wekdal punika',
    noIncomeDesc: 'Mboten wonten cathetan pamasukan ing wekdal punika',
    noExpenseDesc: 'Mboten wonten cathetan pangetrapan ing wekdal punika',
    
    // Form Labels (Krama Mataraman)
    formDate: 'Titimangsa',
    formAmount: 'Gunggungipun Arta',
    formCategory: 'Jinis Kategori',
    formAccount: 'Wadhah Arta',
    formNote: 'Cathetan',
    formNotePlaceholder: '',
    formSave: 'Simpen',
    formCancel: 'Batal',
    formCustomCat: 'Serat kategori enggal...',
    formCustomAcc: 'Serat wadhah arta enggal...',
    
    // Andai Feature (Simulasi Menawi)
    andaiHeroLabel: 'Pangetrapan Konsumtif Wulan Punika',
    andaiTxDetected: 'transaksi kapirsan',
    andaiYearUnit: 'Thn',
    andaiIfBought: 'Menawi Katumbas',
    andaiBurnt: 'Sirna',
    andaiIfInvested: 'Menawi Kainvestasikaken',
    andaiConsumptiveTitle: 'Rerincen Pangetrapan Konsumtif',
    andaiEmptyClean: 'Mboten wonten pangetrapan konsumtif wulan punika.',
    
    // Profile Menu
    profileSettings: 'Setelan Profil',
    profileNamePlaceholder: 'Serat Asma Panjenengan',
    changePhoto: 'Gantos Foto Profil',
    budgetCapTitle: 'Watesan Kategori Saben Wulan',
    budgetCapSubtitle: 'Watesi gunggung pangetrapan saben kategori',
    fontSettingTitle: 'Gaya Tulisan (Font)',
    fontSettingSubtitle: 'Pilih gaya tulisan tampilan lan cathetan',
    langSettingTitle: 'Basa (Language)',
    langSettingSubtitle: 'Pilih basa tampilan aplikasi',
    feedbackTitle: 'Panyaruwe & Keluh Kesah',
    feedbackSubtitle: 'Kintun panyaruwe lan pamrayogi kangge aplikasi',
    
    // Feedback Modal
    feedbackHeader: 'Panyaruwe & Keluh Kesah',
    feedbackHelperText: 'Wonten uneg-uneg, lapuran masalah, utawi ide fitur enggal? Serat panyaruwe panjenengan ing ngandhap punika:',
    feedbackCategoryLabel: 'Jinis Masukan',
    feedbackCatIdea: '💡 Ide Fitur',
    feedbackCatGripe: '💬 Keluh Kesah',
    feedbackCatBug: '⚠️ Lapur Masalah',
    feedbackInputPlaceholder: 'Serat panyaruwe, usulan, utawi uneg-uneg panjenengan ing mriki...',
    feedbackSubmitBtn: 'Kintun Panyaruwe',
    feedbackSending: 'Ngrantos...',
    feedbackSuccess: 'Matur nuwun sanget! Panyaruwe panjenengan sampun kasil kakintun.',
    feedbackError: 'Gagal ngintun. Mangga priksa sambungan internet.',
    
    // Font Modal
    selectFontTitle: 'Pilih Gaya Tulisan',
    
    // Language Modal
    selectLangTitle: 'Pilih Basa',
  }
};

export const getTranslation = (lang = 'id', key) => {
  const currentLangDict = DICTIONARY[lang] || DICTIONARY.id;
  if (currentLangDict && key in currentLangDict) {
    return currentLangDict[key];
  }
  if (DICTIONARY.id && key in DICTIONARY.id) {
    return DICTIONARY.id[key];
  }
  return key;
};

export const getCategoryName = (categoryNameOrObj, lang = 'id') => {
  if (!categoryNameOrObj) return '';
  const rawName = typeof categoryNameOrObj === 'string' ? categoryNameOrObj : (categoryNameOrObj.name || '');
  if (lang === 'jv' && CATEGORY_TRANSLATIONS.jv && CATEGORY_TRANSLATIONS.jv[rawName]) {
    return CATEGORY_TRANSLATIONS.jv[rawName];
  }
  return rawName;
};

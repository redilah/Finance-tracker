/**
 * categoryInsightEngine.js
 * Mesin kalkulasi dan narasi finansial berbasis data transaksi nyata untuk kategori & bulan tertentu.
 */

// Helper untuk format rupiah
export const formatRupiah = (num) => {
  return 'Rp ' + Math.round(num || 0).toLocaleString('id-ID');
};

// Cek apakah tanggal hari ini adalah hari terakhir bulan atau bulan lampau
export const isEndOfMonthOrTesting = (year, monthIndex) => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-indexed

  // Jika bulan yang dipilih adalah bulan di masa lalu (sudah lewat), insight selalu tersedia
  if (year < currentYear || (year === currentYear && monthIndex < currentMonth)) {
    return true;
  }

  // Jika bulan di masa depan, insight belum terbuka
  if (year > currentYear || (year === currentYear && monthIndex > currentMonth)) {
    return false;
  }

  // Jika bulan yang dipilih adalah bulan berjalan saat ini: hanya terbuka jika hari ini >= tanggal akhir bulan
  const lastDayOfMonth = new Date(year, monthIndex + 1, 0).getDate();
  const todayDate = now.getDate();

  return todayDate >= lastDayOfMonth;
};

// Hitung hari terakhir dari suatu bulan
export const getLastDayOfMonth = (year, monthIndex) => {
  return new Date(year, monthIndex + 1, 0).getDate();
};

/**
 * Menganalisis transaksi pengguna dan menghasilkan statistik serta narasi mendalam
 */
export const generateCategoryInsight = ({
  categoryName,
  year,
  monthIndex, // 0-indexed (0 = Jan, 7 = Agu, 11 = Des)
  allTransactions = [],
  userName = 'Pengguna'
}) => {
  const cleanUserName = userName && userName.trim() ? userName.trim() : 'Kamu';
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  // 1. Filter transaksi bulan terpilih
  let currentMonthTxs = allTransactions.filter(t => {
    if (!t.date) return false;
    const [y, m] = t.date.split('-');
    return Number(y) === year && Number(m) === (monthIndex + 1);
  });

  // Jika di bulan depan (demo preview) belum ada data, gunakan data riil bulan berjalan (terbaru)
  if (currentMonthTxs.length === 0 && (year > currentYear || (year === currentYear && monthIndex > currentMonth))) {
    currentMonthTxs = allTransactions.filter(t => {
      if (!t.date) return false;
      const [y, m] = t.date.split('-');
      return Number(y) === currentYear && Number(m) === (currentMonth + 1);
    });
    if (currentMonthTxs.length === 0) {
      currentMonthTxs = allTransactions;
    }
  }

  const totalAllExpensesInMonth = currentMonthTxs
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  // Transaksi kategori spesifik bulan ini
  const catTxs = currentMonthTxs.filter(t => {
    return t.type === 'expense' && (
      (t.category && t.category.toLowerCase() === categoryName.toLowerCase()) ||
      (t.categoryId && t.categoryId.toLowerCase() === categoryName.toLowerCase())
    );
  });

  // 2. Filter transaksi bulan sebelumnya untuk perbandingan
  const prevMonthDate = new Date(year, monthIndex - 1, 1);
  const prevYear = prevMonthDate.getFullYear();
  const prevMonthIndex = prevMonthDate.getMonth();

  let prevMonthCatTxs = allTransactions.filter(t => {
    if (!t.date) return false;
    const [y, m] = t.date.split('-');
    const matchesMonth = Number(y) === prevYear && Number(m) === (prevMonthIndex + 1);
    const matchesCat = t.type === 'expense' && (
      (t.category && t.category.toLowerCase() === categoryName.toLowerCase()) ||
      (t.categoryId && t.categoryId.toLowerCase() === categoryName.toLowerCase())
    );
    return matchesMonth && matchesCat;
  });

  if (prevMonthCatTxs.length === 0 && (year > currentYear || (year === currentYear && monthIndex > currentMonth))) {
    const prevToCurrent = new Date(currentYear, currentMonth - 1, 1);
    prevMonthCatTxs = allTransactions.filter(t => {
      if (!t.date) return false;
      const [y, m] = t.date.split('-');
      const matchesMonth = Number(y) === prevToCurrent.getFullYear() && Number(m) === (prevToCurrent.getMonth() + 1);
      const matchesCat = t.type === 'expense' && (
        (t.category && t.category.toLowerCase() === categoryName.toLowerCase()) ||
        (t.categoryId && t.categoryId.toLowerCase() === categoryName.toLowerCase())
      );
      return matchesMonth && matchesCat;
    });
  }

  const currentTotalAmount = catTxs.reduce((sum, t) => sum + t.amount, 0);
  const prevTotalAmount = prevMonthCatTxs.reduce((sum, t) => sum + t.amount, 0);
  const currentCount = catTxs.length;
  const prevCount = prevMonthCatTxs.length;

  // Persentase dari total pengeluaran
  const percentageOfTotal = totalAllExpensesInMonth > 0 
    ? Math.round((currentTotalAmount / totalAllExpensesInMonth) * 100) 
    : 0;

  // Rata-rata per transaksi
  const averagePerTx = currentCount > 0 ? Math.round(currentTotalAmount / currentCount) : 0;

  // 3. Analisis item / catatan yang paling sering dibeli (membaca t.title & t.note riil)
  const noteFrequency = {};
  const noteAmounts = {};

  catTxs.forEach(t => {
    const rawNote = (t.title || t.note || '').trim();
    if (rawNote) {
      noteFrequency[rawNote] = (noteFrequency[rawNote] || 0) + 1;
      noteAmounts[rawNote] = (noteAmounts[rawNote] || 0) + t.amount;
    }
  });

  let topNote = null;
  const sortedNotes = Object.keys(noteFrequency)
    .map(key => ({
      note: key,
      count: noteFrequency[key],
      totalAmount: noteAmounts[key]
    }))
    .sort((a, b) => b.count - a.count || b.totalAmount - a.totalAmount);

  if (sortedNotes.length > 0) {
    topNote = sortedNotes[0];
  } else if (currentCount > 0) {
    topNote = {
      note: `Belanja ${categoryName}`,
      count: currentCount,
      totalAmount: currentTotalAmount,
      isGeneric: true
    };
  }

  // 4. Analisis hari/tanggal tersibuk & paling boros
  const dayFrequency = {};
  const dayAmounts = {};
  catTxs.forEach(t => {
    const dateStr = t.date; // 'YYYY-MM-DD'
    dayFrequency[dateStr] = (dayFrequency[dateStr] || 0) + 1;
    dayAmounts[dateStr] = (dayAmounts[dateStr] || 0) + t.amount;
  });

  let busiestDay = null;
  let highestSpendDay = null;

  Object.keys(dayFrequency).forEach(dateStr => {
    const count = dayFrequency[dateStr];
    const amount = dayAmounts[dateStr];
    const dayNum = Number(dateStr.split('-')[2]);

    if (!busiestDay || count > busiestDay.count) {
      busiestDay = { dateStr, dayNum, count, amount };
    }
    if (!highestSpendDay || amount > highestSpendDay.amount) {
      highestSpendDay = { dateStr, dayNum, count, amount };
    }
  });

  // 5. Transaksi terbesar
  let largestTx = null;
  let largestTxLabel = '';
  if (catTxs.length > 0) {
    largestTx = [...catTxs].sort((a, b) => b.amount - a.amount)[0];
    if (largestTx) {
      const rawNote = (largestTx.title || largestTx.note || '').trim();
      const dayNum = largestTx.date ? Number(largestTx.date.split('-')[2]) : null;
      if (rawNote) {
        largestTxLabel = rawNote;
      } else if (dayNum) {
        largestTxLabel = `Tgl ${dayNum} (${largestTx.account || 'Bank'})`;
      } else {
        largestTxLabel = `Transaksi utama ${categoryName}`;
      }
    }
  }

  // 6. Akun/metode pembayaran yang paling sering digunakan
  const accountFrequency = {};
  catTxs.forEach(t => {
    const acc = t.account || 'Bank';
    accountFrequency[acc] = (accountFrequency[acc] || 0) + 1;
  });
  const dominantAccount = Object.keys(accountFrequency)
    .sort((a, b) => accountFrequency[b] - accountFrequency[a])[0] || 'Bank';

  // 7. Komparasi dengan bulan lalu
  let diffPercentage = 0;
  let diffStatus = 'same'; // 'up' | 'down' | 'same' | 'new'
  if (prevTotalAmount === 0 && currentTotalAmount > 0) {
    diffStatus = 'new';
  } else if (prevTotalAmount > 0) {
    const diff = currentTotalAmount - prevTotalAmount;
    diffPercentage = Math.round(Math.abs(diff) / prevTotalAmount * 100);
    if (diff > 0) diffStatus = 'up';
    else if (diff < 0) diffStatus = 'down';
    else diffStatus = 'same';
  }

  // 8. Membuat paragraf cerita personal yang hangat & natural
  const MONTH_NAMES = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  const monthName = MONTH_NAMES[monthIndex];

  let narrativeStory = '';
  if (currentCount === 0) {
    narrativeStory = `Di bulan ${monthName} ${year}, ${cleanUserName} belum mencatat pengeluaran apa pun untuk kategori ${categoryName}. Pengeluaranmu di sektor ini sangat hemat dan terkendali dengan baik!`;
  } else {
    const sentences = [];

    // Kalimat 1: Ringkasan belanja
    sentences.push(
      `Di bulan ${monthName} ${year}, ${cleanUserName} tercatat melakukan ${currentCount} kali transaksi pada kategori ${categoryName} dengan total pengeluaran sebesar ${formatRupiah(currentTotalAmount)}.`
    );

    // Kalimat 2: Porsi persentase
    if (percentageOfTotal > 0) {
      sentences.push(
        `Kategori ini menyumbang sekitar ${percentageOfTotal}% dari seluruh anggaran belanja yang kamu keluarkan sepanjang bulan ini.`
      );
    }

    // Kalimat 3: Catatan/item paling sering (hanya jika ada catatan riil)
    if (topNote && !topNote.isGeneric) {
      sentences.push(
        `Catatan belanja yang paling sering kamu lakukan adalah "${topNote.note}" sebanyak ${topNote.count} kali (${formatRupiah(topNote.totalAmount)}).`
      );
    }

    // Kalimat 4: Hari tersibuk/paling boros
    if (busiestDay && busiestDay.count >= 2) {
      sentences.push(
        `Tanggal ${busiestDay.dayNum} ${monthName} menjadi hari tersibukmu dengan ${busiestDay.count} transaksi sekaligus dalam satu hari senilai ${formatRupiah(busiestDay.amount)}.`
      );
    } else if (highestSpendDay && largestTx) {
      const txTitle = (largestTx.title || largestTx.note || '').trim();
      const itemNote = txTitle ? ` untuk "${txTitle}"` : '';
      sentences.push(
        `Pengeluaran terbesarmu terjadi pada tanggal ${highestSpendDay.dayNum} ${monthName} sebesar ${formatRupiah(largestTx.amount)}${itemNote}.`
      );
    }

    // Kalimat 5: Perbandingan bulan lalu
    if (diffStatus === 'up') {
      sentences.push(
        `Pengeluaranmu di kategori ini meningkat ${diffPercentage}% dibandingkan bulan lalu (${formatRupiah(prevTotalAmount)}).`
      );
    } else if (diffStatus === 'down') {
      sentences.push(
        `Kabar baik! Pengeluaranmu turun ${diffPercentage}% lebih hemat dibandingkan bulan sebelumnya (${formatRupiah(prevTotalAmount)}).`
      );
    }

    narrativeStory = sentences.join(' ');
  }

  return {
    categoryName,
    year,
    monthIndex,
    monthName,
    currentTotalAmount,
    currentCount,
    percentageOfTotal,
    averagePerTx,
    topNote,
    sortedNotes,
    busiestDay,
    highestSpendDay,
    largestTx,
    largestTxLabel,
    dominantAccount,
    prevTotalAmount,
    prevCount,
    diffPercentage,
    diffStatus,
    narrativeStory,
    transactions: catTxs.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))
  };
};

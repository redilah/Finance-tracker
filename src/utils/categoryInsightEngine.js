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
  const currentMonth = now.getMonth();
  const currentDate = now.getDate();

  // 1. Bulan lampau selalu terbuka (unlocked)
  if (year < currentYear) return true;
  if (year === currentYear && monthIndex < currentMonth) return true;

  // 2. Bulan masa depan selalu terkunci (locked)
  if (year > currentYear) return false;
  if (year === currentYear && monthIndex > currentMonth) return false;

  // 3. Bulan berjalan: Hanya terbuka jika tanggal hari ini adalah hari terakhir dari bulan tersebut
  const lastDayOfTargetMonth = getLastDayOfMonth(year, monthIndex);
  return currentDate >= lastDayOfTargetMonth;
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
  userName = 'Pengguna',
  appLanguage = 'id',
  fmtMoney,
  getCategoryName,
  communityData = null // { avgAmount, userCount } dari communityBenchmark.js
}) => {
  const cleanUserName = userName && userName.trim() ? userName.trim() : (
    appLanguage === 'en' ? 'You' : appLanguage === 'jv' ? 'Panjenengan' : appLanguage === 'zh' ? 'Nin' : appLanguage === 'ko' ? 'Dangsin' : 'Kamu'
  );
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  const localizedCatName = getCategoryName ? getCategoryName(categoryName, appLanguage) : categoryName;
  const formatAmt = (amt) => (fmtMoney ? fmtMoney(amt) : formatRupiah(amt));

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
    const matchesCategory = (
      (t.category && t.category.toLowerCase() === categoryName.toLowerCase()) ||
      (t.categoryId && t.categoryId.toLowerCase() === categoryName.toLowerCase())
    );
    return t.type === 'expense' && matchesMonth && matchesCategory;
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

  // Metrik Utama
  const currentTotalAmount = catTxs.reduce((sum, t) => sum + t.amount, 0);
  const currentCount = catTxs.length;
  const prevTotalAmount = prevMonthCatTxs.reduce((sum, t) => sum + t.amount, 0);
  const prevCount = prevMonthCatTxs.length;

  // Persentase dari total pengeluaran
  const percentageOfTotal = totalAllExpensesInMonth > 0 
    ? Math.round((currentTotalAmount / totalAllExpensesInMonth) * 100) 
    : 0;

  // Rata-rata per transaksi
  const averagePerTx = currentCount > 0 ? Math.round(currentTotalAmount / currentCount) : 0;

  // 3. Rata-rata pengeluaran per hari dalam sebulan
  const daysInMonth = getLastDayOfMonth(year, monthIndex);
  const averagePerDay = daysInMonth > 0 ? Math.round(currentTotalAmount / daysInMonth) : 0;

  // 4. Catatan/item yang paling sering dibeli
  const noteFrequency = {};
  catTxs.forEach(t => {
    const rawNote = (t.title || t.note || '').trim();
    if (rawNote) {
      noteFrequency[rawNote] = (noteFrequency[rawNote] || { count: 0, totalAmount: 0 });
      noteFrequency[rawNote].count += 1;
      noteFrequency[rawNote].totalAmount += t.amount;
    }
  });

  const sortedNotes = Object.keys(noteFrequency)
    .map(key => ({
      note: key,
      count: noteFrequency[key].count,
      totalAmount: noteFrequency[key].totalAmount,
      isGeneric: key.toLowerCase() === categoryName.toLowerCase()
    }))
    .sort((a, b) => b.count - a.count || b.totalAmount - a.totalAmount);

  const topNote = sortedNotes.length > 0 ? sortedNotes[0] : null;

  // 4. Hari tersibuk & Pengeluaran terbesar per hari
  const dayFrequency = {};
  catTxs.forEach(t => {
    if (t.date) {
      const dayNum = parseInt(t.date.split('-')[2], 10);
      if (!isNaN(dayNum)) {
        if (!dayFrequency[dayNum]) {
          dayFrequency[dayNum] = { count: 0, amount: 0, txs: [] };
        }
        dayFrequency[dayNum].count += 1;
        dayFrequency[dayNum].amount += t.amount;
        dayFrequency[dayNum].txs.push(t);
      }
    }
  });

  let busiestDay = null;
  let highestSpendDay = null;
  const daysList = Object.keys(dayFrequency).map(d => ({
    dayNum: parseInt(d, 10),
    count: dayFrequency[d].count,
    amount: dayFrequency[d].amount,
    txs: dayFrequency[d].txs
  }));

  if (daysList.length > 0) {
    busiestDay = [...daysList].sort((a, b) => b.count - a.count || b.amount - a.amount)[0];
    highestSpendDay = [...daysList].sort((a, b) => b.amount - a.amount || b.count - a.count)[0];
  }

  // 5. Transaksi tunggal terbesar
  let largestTx = null;
  let largestTxLabel = '';
  if (catTxs.length > 0) {
    largestTx = [...catTxs].sort((a, b) => b.amount - a.amount)[0];
    if (largestTx) {
      const rawTitle = (largestTx.title || largestTx.note || '').trim();
      const dayNum = largestTx.date ? parseInt(largestTx.date.split('-')[2], 10) : null;
      if (rawTitle && rawTitle.toLowerCase() !== categoryName.toLowerCase()) {
        largestTxLabel = rawTitle;
      } else if (dayNum) {
        largestTxLabel = `${dayNum} (${largestTx.account || 'Bank'})`;
      } else {
        largestTxLabel = localizedCatName;
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

  // 8. Nama Bulan Sesuai Bahasa
  const MONTH_NAMES_MAP = {
    id: ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'],
    id_id: ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'],
    en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
    jv: ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'],
    zh: ['1 Yue', '2 Yue', '3 Yue', '4 Yue', '5 Yue', '6 Yue', '7 Yue', '8 Yue', '9 Yue', '10 Yue', '11 Yue', '12 Yue'],
    ko: ['1-wol', '2-wol', '3-wol', '4-wol', '5-wol', '6-wol', '7-wol', '8-wol', '9-wol', '10-wol', '11-wol', '12-wol']
  };
  const currentMonthNames = MONTH_NAMES_MAP[appLanguage] || MONTH_NAMES_MAP.id;
  const monthName = currentMonthNames[monthIndex] || 'Bulan Ini';

  // ──────────────────────────────────────────────────────
  // 9. Persuasion Metrics (Cialdini: Commitment, Social Proof, Loss Framing)
  // ──────────────────────────────────────────────────────

  // Loss Framing (Scarcity): hitung kerugian riil & potensi penghematan
  const lossAmount = diffStatus === 'up' ? (currentTotalAmount - prevTotalAmount) : 0;
  const savingsIfCut10 = currentTotalAmount > 0 ? Math.round(currentTotalAmount * 0.1) : 0;

  // Social Proof: data komunitas real yang dinamis dari database telemetry
  const hasCommunityData = communityData && communityData.avgAmount > 0;
  const communityAvg = hasCommunityData ? communityData.avgAmount : 0;
  const communityUserCount = hasCommunityData ? (communityData.userCount || 1) : 0;
  const userCountLabel = communityUserCount.toLocaleString(
    appLanguage === 'en' ? 'en-US' : (appLanguage === 'zh' || appLanguage === 'ko' ? 'en-US' : 'id-ID')
  );
  let communityDiffPercent = 0;
  let isAboveCommunityAvg = false;
  if (hasCommunityData && currentTotalAmount > 0) {
    communityDiffPercent = Math.round(Math.abs(currentTotalAmount - communityAvg) / communityAvg * 100);
    isAboveCommunityAvg = currentTotalAmount > communityAvg;
  }

  // 10. Narasi Finansial Dinamis Sesuai Bahasa Aktif
  let narrativeStory = '';
  let narrativeMainStory = '';
  let socialProofStory = '';

  if (appLanguage === 'en') {
    if (currentCount === 0) {
      narrativeMainStory = `In ${monthName} ${year}, ${cleanUserName} has not recorded any expenses for ${localizedCatName}.`;
      socialProofStory = `Zero spending — your discipline is outstanding! Keep this record going 💪`;
      narrativeStory = `${narrativeMainStory} ${socialProofStory}`.trim();
    } else {
      const sentences = [];
      const socialSentences = [];
      sentences.push(
        `In ${monthName} ${year}, ${cleanUserName} made ${currentCount} transactions in ${localizedCatName} with a total spending of ${formatAmt(currentTotalAmount)}.`
      );
      if (percentageOfTotal > 0) {
        sentences.push(`This category accounts for about ${percentageOfTotal}% of your total budget spent this month.`);
      }
      if (topNote && !topNote.isGeneric) {
        sentences.push(`Your most frequent purchase was "${topNote.note}" (${topNote.count} times, totaling ${formatAmt(topNote.totalAmount)}).`);
      }
      if (busiestDay && busiestDay.count >= 2) {
        sentences.push(`${monthName} ${busiestDay.dayNum} was your busiest day with ${busiestDay.count} transactions totaling ${formatAmt(busiestDay.amount)}.`);
      } else if (highestSpendDay && largestTx) {
        const txTitle = (largestTx.title || largestTx.note || '').trim();
        const itemNote = txTitle ? ` for "${txTitle}"` : '';
        sentences.push(`Your largest spending occurred on ${monthName} ${highestSpendDay.dayNum} totaling ${formatAmt(largestTx.amount)}${itemNote}.`);
      }
      // 🔴 Loss Framing (Scarcity)
      if (diffStatus === 'up') {
        sentences.push(`You lost ${formatAmt(lossAmount)} more this month compared to last month (${formatAmt(prevTotalAmount)}).`);
        if (savingsIfCut10 > 0) {
          sentences.push(`If spending dropped just 10%, you could save ${formatAmt(savingsIfCut10)}.`);
        }
      } else if (diffStatus === 'down') {
        sentences.push(`Great news! Your spending decreased by ${diffPercentage}%, saving more than last month (${formatAmt(prevTotalAmount)}).`);
      }
      // 🟢 Social Proof — Real community data from dashboard users
      if (hasCommunityData && currentCount > 0) {
        if (isAboveCommunityAvg) {
          socialSentences.push(`Compared to ${userCountLabel} other Cassiel users (avg ${formatAmt(communityAvg)}), your spending is ${communityDiffPercent}% above average.`);
        } else {
          socialSentences.push(`Awesome! Your spending is more efficient than ${userCountLabel} other Cassiel users (avg ${formatAmt(communityAvg)}).`);
        }
      }
      // 🔵 Commitment & Consistency
      if (diffStatus === 'up' || isAboveCommunityAvg) {
        socialSentences.push(`Set a slightly tighter budget next month to keep spending well balanced! 🎯`);
      } else if (diffStatus === 'down' || currentCount === 0) {
        socialSentences.push(`Your consistency is amazing! Keep this saving streak going 💪`);
      } else {
        socialSentences.push(`Keep managing your budget wisely each month! 💪`);
      }
      narrativeMainStory = sentences.join(' ');
      socialProofStory = socialSentences.join(' ');
      narrativeStory = [narrativeMainStory, socialProofStory].filter(Boolean).join(' ');
    }
  } else if (appLanguage === 'jv') {
    if (currentCount === 0) {
      narrativeMainStory = `Ing wulan ${monthName} ${year}, ${cleanUserName} dereng wonten cathetan pangetrapan kangge ${localizedCatName}.`;
      socialProofStory = `Nol pangetrapan — kedisiplinan panjenengan luar biasa! Lestantunaken rekor punika 💪`;
      narrativeStory = `${narrativeMainStory} ${socialProofStory}`.trim();
    } else {
      const sentences = [];
      const socialSentences = [];
      sentences.push(
        `Ing wulan ${monthName} ${year}, ${cleanUserName} kecathet ${currentCount} kaping blanja ing kategori ${localizedCatName} kanthi gunggung ${formatAmt(currentTotalAmount)}.`
      );
      if (percentageOfTotal > 0) {
        sentences.push(`Kategori punika nyumbang watawis ${percentageOfTotal}% saking sedaya anggaran ingkang medal wulan punika.`);
      }
      if (topNote && !topNote.isGeneric) {
        sentences.push(`Cathetan blanja ingkang paling asring inggih punika "${topNote.note}" kaping ${topNote.count} (${formatAmt(topNote.totalAmount)}).`);
      }
      if (busiestDay && busiestDay.count >= 2) {
        sentences.push(`Titimangsa ${busiestDay.dayNum} ${monthName} dados dinten paling kathah kanthi ${busiestDay.count} transaksi (${formatAmt(busiestDay.amount)}).`);
      } else if (highestSpendDay && largestTx) {
        const txTitle = (largestTx.title || largestTx.note || '').trim();
        const itemNote = txTitle ? ` kangge "${txTitle}"` : '';
        sentences.push(`Blanja paling ageng kalampahan ing tanggal ${highestSpendDay.dayNum} ${monthName} kanthi ${formatAmt(largestTx.amount)}${itemNote}.`);
      }
      // 🔴 Loss Framing
      if (diffStatus === 'up') {
        sentences.push(`Panjenengan kecalan ${formatAmt(lossAmount)} langkung kathah wulan punika tinimbang wulan kapengker (${formatAmt(prevTotalAmount)}).`);
        if (savingsIfCut10 > 0) {
          sentences.push(`Menawi saged nyuda 10%, panjenengan saged nyimpen ${formatAmt(savingsIfCut10)}.`);
        }
      } else if (diffStatus === 'down') {
        sentences.push(`Kabar sae! Pangetrapan mudhun ${diffPercentage}% langkung hemat tinimbang wulan sadèrèngipun (${formatAmt(prevTotalAmount)}).`);
      }
      // 🟢 Social Proof
      if (hasCommunityData && currentCount > 0) {
        if (isAboveCommunityAvg) {
          socialSentences.push(`Katandhingaken kaliyan ${userCountLabel} panggangge Cassiel sanesipun (rata-rata ${formatAmt(communityAvg)}), pangetrapan panjenengan ${communityDiffPercent}% ing nginggil rata-rata.`);
        } else {
          socialSentences.push(`Hebat! Pangetrapan panjenengan langkung hemat tinimbang ${userCountLabel} panggangge Cassiel sanesipun (rata-rata ${formatAmt(communityAvg)}).`);
        }
      }
      // 🔵 Commitment & Consistency
      if (diffStatus === 'up' || isAboveCommunityAvg) {
        socialSentences.push(`Atur watesan anggaran langkung rapi wulan ngajeng supados langkung seimbang! 🎯`);
      } else if (diffStatus === 'down' || currentCount === 0) {
        socialSentences.push(`Konsistensi panjenengan luar biasa! Lestantunaken rekor hemat punika 💪`);
      } else {
        socialSentences.push(`Titi pangetrapan lan anggaran panjenengan kanthi wicaksana! 💪`);
      }
      narrativeMainStory = sentences.join(' ');
      socialProofStory = socialSentences.join(' ');
      narrativeStory = [narrativeMainStory, socialProofStory].filter(Boolean).join(' ');
    }
  } else if (appLanguage === 'zh') {
    if (currentCount === 0) {
      narrativeMainStory = `Zai ${year} nian ${monthName}, ${cleanUserName} zai ${localizedCatName} fenlei shang shangwu renhe zhichu.`;
      socialProofStory = `Ling zhichu — nin de jilü feichang chuzhong! Jixu baochi zheige jilu 💪`;
      narrativeStory = `${narrativeMainStory} ${socialProofStory}`.trim();
    } else {
      const sentences = [];
      const socialSentences = [];
      sentences.push(
        `Zai ${year} nian ${monthName}, ${cleanUserName} zai ${localizedCatName} jinxing le ${currentCount} ci jiaoyi, zong zhichu wei ${formatAmt(currentTotalAmount)}.`
      );
      if (percentageOfTotal > 0) {
        sentences.push(`Gai fenlei zhan benyue zong zhichu de ${percentageOfTotal}%.`);
      }
      if (topNote && !topNote.isGeneric) {
        sentences.push(`Zui chang goumai de xiangmu shi "${topNote.note}" (${topNote.count} ci, gongji ${formatAmt(topNote.totalAmount)}).`);
      }
      if (busiestDay && busiestDay.count >= 2) {
        sentences.push(`${monthName} ${busiestDay.dayNum} ri shi zui fanmang de yitian, gong ${busiestDay.count} bi jiaoyi, jine wei ${formatAmt(busiestDay.amount)}.`);
      } else if (highestSpendDay && largestTx) {
        const txTitle = (largestTx.title || largestTx.note || '').trim();
        const itemNote = txTitle ? ` ("${txTitle}")` : '';
        sentences.push(`Zui da danbi zhichu fasheng zai ${monthName} ${highestSpendDay.dayNum} ri, jine wei ${formatAmt(largestTx.amount)}${itemNote}.`);
      }
      // 🔴 Loss Framing
      if (diffStatus === 'up') {
        sentences.push(`Nin benyue duosunshi le ${formatAmt(lossAmount)}, yu shangyue (${formatAmt(prevTotalAmount)}) xiangbi.`);
        if (savingsIfCut10 > 0) {
          sentences.push(`Ruguo jianshao 10%, nin keyi jiesheng ${formatAmt(savingsIfCut10)}.`);
        }
      } else if (diffStatus === 'down') {
        sentences.push(`Tai bang le! Yu shangyue (${formatAmt(prevTotalAmount)}) xiangbi, nin de zhichu jianshao le ${diffPercentage}%.`);
      }
      // 🟢 Social Proof
      if (hasCommunityData && currentCount > 0) {
        if (isAboveCommunityAvg) {
          socialSentences.push(`Yu ${userCountLabel} wei qita Cassiel yonghu (pingjun ${formatAmt(communityAvg)}) xiangbi, nin de zhichu gao ${communityDiffPercent}%.`);
        } else {
          socialSentences.push(`Hen bang! Nin de zhichu bi ${userCountLabel} wei qita Cassiel yonghu (pingjun ${formatAmt(communityAvg)}) geng jieyue.`);
        }
      }
      // 🔵 Commitment & Consistency
      if (diffStatus === 'up' || isAboveCommunityAvg) {
        socialSentences.push(`Xiayue shidang diaozheng yuesuan yi baochi lianghao de zhichu pingheng! 🎯`);
      } else if (diffStatus === 'down' || currentCount === 0) {
        socialSentences.push(`Nin de jianchi feichang bang! Jixu baochi jieyue jilu 💪`);
      } else {
        socialSentences.push(`Mingzhi guanli nin de yuesuan yu kaizhi! 💪`);
      }
      narrativeMainStory = sentences.join(' ');
      socialProofStory = socialSentences.join(' ');
      narrativeStory = [narrativeMainStory, socialProofStory].filter(Boolean).join(' ');
    }
  } else if (appLanguage === 'ko') {
    if (currentCount === 0) {
      narrativeMainStory = `${year}nyeon ${monthName}e ${cleanUserName}nim-eun ${localizedCatName} hangmog-eseo jichul-i eobs-seubnida.`;
      socialProofStory = `Yeong jichul — gyuyul-i ttwieona-seubnida! I gilog-eul yuji-haseyo 💪`;
      narrativeStory = `${narrativeMainStory} ${socialProofStory}`.trim();
    } else {
      const sentences = [];
      const socialSentences = [];
      sentences.push(
        `${year}nyeon ${monthName}e ${cleanUserName}nim-eun ${localizedCatName} hangmog-eseo chong ${currentCount}hwe jichul-eul haess-eumyeo, chong-aeg-eun ${formatAmt(currentTotalAmount)} ibnida.`
      );
      if (percentageOfTotal > 0) {
        sentences.push(`I hangmog-eun ibeondal jeonche jichul-ui yag ${percentageOfTotal}%leul chaji-habnida.`);
      }
      if (topNote && !topNote.isGeneric) {
        sentences.push(`Gajang jaju gumaeban hangmog-eun "${topNote.note}" (${topNote.count}hwe, chong ${formatAmt(topNote.totalAmount)}) ibnida.`);
      }
      if (busiestDay && busiestDay.count >= 2) {
        sentences.push(`${monthName} ${busiestDay.dayNum}il-i gajang bappeun nal-ieoss-eumyeo, ${busiestDay.count}geon-ui jichul (${formatAmt(busiestDay.amount)})i iss-eoss-seubnida.`);
      } else if (highestSpendDay && largestTx) {
        const txTitle = (largestTx.title || largestTx.note || '').trim();
        const itemNote = txTitle ? ` ("${txTitle}")` : '';
        sentences.push(`Gajang keun jichul-eun ${monthName} ${highestSpendDay.dayNum}il-e ${formatAmt(largestTx.amount)}${itemNote}euro balsaenghaess-seubnida.`);
      }
      // 🔴 Loss Framing
      if (diffStatus === 'up') {
        sentences.push(`Ibeondal jinandal (${formatAmt(prevTotalAmount)})boda ${formatAmt(lossAmount)} deo sonhae-leul bo-ass-seubnida.`);
        if (savingsIfCut10 > 0) {
          sentences.push(`10%man jul-imyeon ${formatAmt(savingsIfCut10)}eul jeol-yag-hal su iss-seubnida.`);
        }
      } else if (diffStatus === 'down') {
        sentences.push(`Jinandall (${formatAmt(prevTotalAmount)})boda jichul-i ${diffPercentage}% jul-eo deol sseoss-seubnida!`);
      }
      // 🟢 Social Proof
      if (hasCommunityData && currentCount > 0) {
        if (isAboveCommunityAvg) {
          socialSentences.push(`${userCountLabel}myeong-ui daleun Cassiel sayongja (pyeong-gyun ${formatAmt(communityAvg)})wa bigyohae, jichul-i ${communityDiffPercent}% nops-seubnida.`);
        } else {
          socialSentences.push(`Meotjyeo! ${userCountLabel}myeong-ui daleun Cassiel sayongja (pyeong-gyun ${formatAmt(communityAvg)})boda deo jeol-yag-haess-seubnida.`);
        }
      }
      // 🔵 Commitment & Consistency
      if (diffStatus === 'up' || isAboveCommunityAvg) {
        socialSentences.push(`Daeum dal-eun yesan-eul jogeum deo jo-yeo gyunhyeong-eul matchwo boseyo! 🎯`);
      } else if (diffStatus === 'down' || currentCount === 0) {
        socialSentences.push(`Ilgwan-seong-i hullyung-habnida! Jeol-yag gilog-eul yuji-haseyo 💪`);
      } else {
        socialSentences.push(`Yesan-gwa jichul-eul jihyerobge gwanli-haseyo! 💪`);
      }
      narrativeMainStory = sentences.join(' ');
      socialProofStory = socialSentences.join(' ');
      narrativeStory = [narrativeMainStory, socialProofStory].filter(Boolean).join(' ');
    }
  } else {
    // Default: Bahasa Indonesia
    if (currentCount === 0) {
      narrativeMainStory = `Di bulan ${monthName} ${year}, ${cleanUserName} belum mencatat pengeluaran apa pun untuk kategori ${localizedCatName}.`;
      socialProofStory = `Nol pengeluaran — disiplinmu luar biasa! Pertahankan rekor ini 💪`;
      narrativeStory = `${narrativeMainStory} ${socialProofStory}`.trim();
    } else {
      const sentences = [];
      const socialSentences = [];
      sentences.push(
        `Di bulan ${monthName} ${year}, ${cleanUserName} tercatat melakukan ${currentCount} kali transaksi pada kategori ${localizedCatName} dengan total pengeluaran sebesar ${formatAmt(currentTotalAmount)}.`
      );
      if (percentageOfTotal > 0) {
        sentences.push(
          `Kategori ini menyumbang sekitar ${percentageOfTotal}% dari seluruh anggaran belanja yang kamu keluarkan sepanjang bulan ini.`
        );
      }
      if (topNote && !topNote.isGeneric) {
        sentences.push(
          `Catatan belanja yang paling sering kamu lakukan adalah "${topNote.note}" sebanyak ${topNote.count} kali (${formatAmt(topNote.totalAmount)}).`
        );
      }
      if (busiestDay && busiestDay.count >= 2) {
        sentences.push(
          `Tanggal ${busiestDay.dayNum} ${monthName} menjadi hari tersibukmu dengan ${busiestDay.count} transaksi sekaligus dalam satu hari senilai ${formatAmt(busiestDay.amount)}.`
        );
      } else if (highestSpendDay && largestTx) {
        const txTitle = (largestTx.title || largestTx.note || '').trim();
        const itemNote = txTitle ? ` untuk "${txTitle}"` : '';
        sentences.push(
          `Pengeluaran terbesarmu terjadi pada tanggal ${highestSpendDay.dayNum} ${monthName} sebesar ${formatAmt(largestTx.amount)}${itemNote}.`
        );
      }
      // 🔴 Loss Framing (Scarcity)
      if (diffStatus === 'up') {
        sentences.push(
          `Kamu kehilangan ${formatAmt(lossAmount)} lebih banyak bulan ini dibanding bulan lalu (${formatAmt(prevTotalAmount)}).`
        );
        if (savingsIfCut10 > 0) {
          sentences.push(
            `Andai turun 10% saja, kamu bisa menabung ${formatAmt(savingsIfCut10)}.`
          );
        }
      } else if (diffStatus === 'down') {
        sentences.push(
          `Kabar baik! Pengeluaranmu turun ${diffPercentage}% lebih hemat dibandingkan bulan sebelumnya (${formatAmt(prevTotalAmount)}).`
        );
      }
      // 🟢 Social Proof — data komunitas real
      if (hasCommunityData && currentCount > 0) {
        if (isAboveCommunityAvg) {
          socialSentences.push(
            `Dibandingkan ${userCountLabel} pengguna Cassiel lainnya (rata-rata ${formatAmt(communityAvg)}), pengeluaranmu ${communityDiffPercent}% di atas rata-rata.`
          );
        } else {
          socialSentences.push(
            `Keren! Pengeluaranmu lebih hemat dari ${userCountLabel} pengguna Cassiel lainnya (rata-rata ${formatAmt(communityAvg)}).`
          );
        }
      }
      // 🔵 Commitment & Consistency
      if (diffStatus === 'up' || isAboveCommunityAvg) {
        socialSentences.push(
          `Yuk atur batas anggaran lebih ketat bulan depan agar pengeluaran kembali seimbang! 🎯`
        );
      } else if (diffStatus === 'down' || currentCount === 0) {
        socialSentences.push(
          `Konsistenmu luar biasa! Pertahankan rekor hematan ini 💪`
        );
      } else {
        socialSentences.push(
          `Kelola anggaranmu dengan bijak setiap bulannya! 💪`
        );
      }
      narrativeMainStory = sentences.join(' ');
      socialProofStory = socialSentences.join(' ');
      narrativeStory = [narrativeMainStory, socialProofStory].filter(Boolean).join(' ');
    }
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
    averagePerDay,
    daysInMonth,
    activeDaysCount: daysList.length,
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
    narrativeMainStory,
    socialProofStory,
    transactions: catTxs.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))
  };
};

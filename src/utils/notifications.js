import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';

// Keys for LocalStorage
const NOTIF_STORAGE_KEY = 'user_notification_bell_enabled';

// Play sound helper
export const playSound = (soundType = 'notification') => {
  try {
    let audioPath = '/audio/notification.mp3';
    if (soundType === 'app_open') {
      audioPath = '/audio/app_open.mp3';
    } else if (soundType === 'bubble') {
      audioPath = '/audio/bubble_pop_1.wav';
    } else if (soundType === 'notification') {
      audioPath = '/audio/notification.mp3';
    }
    const audio = new Audio(audioPath);
    audio.volume = 0.85;
    audio.play().catch(err => {
      console.log('Audio autoplay prevented or error:', err);
    });
  } catch (e) {
    console.error('Error playing sound:', e);
  }
};

// Play bubble pop sound effect on button press
export const playPopSound = (soundName = 'bubble_pop_2.wav') => {
  try {
    const audio = new Audio(`/audio/${soundName}`);
    audio.volume = 0.7;
    audio.currentTime = 0;
    audio.play().catch(() => {
      // Fallback synthesizer pop sound if browser restricts audio element
      try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(550, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(180, audioCtx.currentTime + 0.08);
        gain.gain.setValueAtTime(0.5, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.08);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.08);
      } catch {
        // Ignore audio context cleanup error
      }
    });
  } catch (e) {
    console.error('Pop sound error:', e);
  }
};

// Check if notification bell is enabled in state/storage
export const isNotificationEnabled = () => {
  return localStorage.getItem(NOTIF_STORAGE_KEY) === 'true';
};

// Request Notification permission
export const requestNotificationPermission = async () => {
  try {
    if (Capacitor.isNativePlatform()) {
      const permResult = await LocalNotifications.requestPermissions();
      if (permResult.display === 'granted') {
        localStorage.setItem(NOTIF_STORAGE_KEY, 'true');
        
        // Buat notification channel Android dengan prioritas tinggi
        await LocalNotifications.createChannel({
          id: 'financial_notifications',
          name: 'Notifikasi Finansial',
          description: 'Pengingat dan notifikasi anggaran harian',
          importance: 5,
          visibility: 1,
          sound: 'notification',
          vibration: true
        }).catch(() => {});

        playSound('notification');
        return true;
      }
    } else if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        localStorage.setItem(NOTIF_STORAGE_KEY, 'true');
        playSound('notification');
        return true;
      }
    }
  } catch (err) {
    console.error('Error requesting notification permission:', err);
  }
  return false;
};

// Toggle notification bell on user click
export const toggleNotificationState = async (currentState) => {
  if (currentState) {
    // Turning off
    localStorage.setItem(NOTIF_STORAGE_KEY, 'false');
    if (Capacitor.isNativePlatform()) {
      await LocalNotifications.cancel({ notifications: [{ id: 101 }, { id: 102 }] }).catch(() => {});
    }
    return false;
  } else {
    // Turning on
    const granted = await requestNotificationPermission();
    return granted;
  }
};

// Calculate expense summary & productive assets for personalized messages
export const getExpenseStatsForNotification = (transactions = []) => {
  const now = new Date();
  
  // Format YYYY-MM-DD
  const formatDateStr = (d) => {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const todayStr = formatDateStr(now);
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const yesterdayStr = formatDateStr(yesterday);

  let todayExpense = 0;
  let yesterdayExpense = 0;
  let hasTodayExpense = false;
  const productiveCategories = ['edukasi', 'buku', 'kursus', 'investasi', 'modal', 'bisnis', 'alat', 'laptop', 'hp', 'peralatan'];
  let todayProductiveItems = [];

  transactions.forEach(t => {
    if (t.type && t.type.toLowerCase() === 'expense') {
      const amt = Number(t.amount) || 0;
      if (t.date === todayStr) {
        todayExpense += amt;
        hasTodayExpense = true;

        // Check if category name or note matches productive asset
        const catName = (t.categoryName || t.category || '').toLowerCase();
        const noteText = (t.note || '').toLowerCase();
        
        const isProd = productiveCategories.some(keyword => 
          catName.includes(keyword) || noteText.includes(keyword)
        );

        if (isProd) {
          todayProductiveItems.push(t.categoryName || t.note || 'Aset Produktif');
        }
      } else if (t.date === yesterdayStr) {
        yesterdayExpense += amt;
      }
    }
  });

  return {
    todayExpense,
    yesterdayExpense,
    hasTodayExpense,
    todayProductiveItems
  };
};

// Generate smart personal message
export const generateNotificationMessage = (userName = 'Teman', transactions = []) => {
  const name = userName.trim() || 'Teman';
  const { todayExpense, yesterdayExpense, hasTodayExpense, todayProductiveItems } = getExpenseStatsForNotification(transactions);
  
  const currentHour = new Date().getHours();
  
  // Format IDR string
  const formatIdr = (num) => new Intl.NumberFormat('id-ID').format(num);

  // 1. Pujian khusus jika membeli aset / investasi produktif hari ini
  if (todayProductiveItems.length > 0) {
    const itemName = todayProductiveItems[0];
    return {
      title: `Keputusan Hebat, ${name}! 🚀`,
      body: `Kamu membeli/menginvestasikan aset produktif (${itemName}) hari ini! Pengeluaran ini adalah investasi masa depan yang sangat bagus!`
    };
  }

  // 2. Tanya jika belum mencatat pengeluaran hari ini
  if (!hasTodayExpense) {
    if (currentHour >= 19) {
      return {
        title: `Selamat Malam, ${name}! ✨`,
        body: `Hari ini belum ada pencatatan pengeluaran nih. Apakah kamu memang tidak membeli sesuatu hari ini?`
      };
    } else {
      return {
        title: `Halo ${name}! 💡`,
        body: `Belum ada pengeluaran yang dicatat hari ini. Jangan lupa langsung catat ya jika ada transaksi!`
      };
    }
  }

  // 3. Pujian hemat dibanding kemarin
  if (yesterdayExpense > 0 && todayExpense < yesterdayExpense) {
    return {
      title: `Pujian Hemat untuk ${name}! 🎉`,
      body: `Pengeluaran hari ini (Rp ${formatIdr(todayExpense)}) lebih rendah dari kemarin (Rp ${formatIdr(yesterdayExpense)}). Keren, pertahankan hematnya!`
    };
  }

  if (todayExpense > 0) {
    return {
      title: `Catatan Finansial ${name} 📊`,
      body: `Total pengeluaranmu hari ini tercatat Rp ${formatIdr(todayExpense)}. Selalu pantau keuanganmu ya!`
    };
  }

  return {
    title: `Semangat Hari Ini, ${name}! 💪`,
    body: `Yuk jaga performa keuanganmu tetap sehat hari ini.`
  };
};

// Trigger immediate welcome notification when bell is turned on
export const sendInstantNotification = (userName) => {
  if (!isNotificationEnabled()) return;

  const name = userName && userName.trim() ? userName.trim() : 'Teman';
  const title = `Halo ${name}! ✨`;
  const body = `Selamat datang di Cassiel, semoga catatan keuanganmu lebih teratur ya!`;

  if (Capacitor.isNativePlatform()) {
    LocalNotifications.schedule({
      notifications: [
        {
          title: title,
          body: body,
          id: Date.now() % 10000,
          schedule: { at: new Date(Date.now() + 1000), allowWhileIdle: true },
          channelId: 'financial_notifications',
          sound: 'notification',
          smallIcon: 'ic_stat_icon',
          iconColor: '#4f46e5'
        }
      ]
    }).catch(err => console.log('Capacitor local notification error:', err));
  } else if ('Notification' in window && Notification.permission === 'granted') {
    try {
      new Notification(title, {
        body: body,
        icon: '/app-icon.png',
        badge: '/app-icon.png'
      });
    } catch (e) {
      console.log('Web notification error:', e);
    }
  }
};

// Trigger immediate budget cap threshold warning notification
export const sendInstantBudgetNotification = (title, body) => {
  if (!isNotificationEnabled()) return;

  if (Capacitor.isNativePlatform()) {
    LocalNotifications.schedule({
      notifications: [
        {
          title: title,
          body: body,
          id: (Date.now() % 10000) + 500,
          schedule: { at: new Date(Date.now() + 500), allowWhileIdle: true },
          channelId: 'financial_notifications',
          sound: 'notification',
          smallIcon: 'ic_stat_icon',
          iconColor: '#ef4444'
        }
      ]
    }).catch(err => console.log('Capacitor local notification error:', err));
  } else if ('Notification' in window && Notification.permission === 'granted') {
    try {
      new Notification(title, {
        body: body,
        icon: '/app-icon.png',
        badge: '/app-icon.png'
      });
    } catch (e) {
      console.log('Web notification error:', e);
    }
  }
};

// Trigger native status bar notification when a new version update is available
export const sendUpdateReminderNotification = async (updateInfo) => {
  if (!updateInfo || !updateInfo.latestVersionName) return;

  const versionTag = updateInfo.latestVersionName;
  const title = `Pembaruan Cassiel v${versionTag} Tersedia! 🚀`;
  const body = `Versi terbaru telah rilis dengan fitur & kestabilan baru. Buka aplikasi untuk memperbarui.`;

  // Cegah spam notifikasi update (maksimal 1 kali per hari untuk versi yang sama)
  const notifKey = `update_notif_sent_${updateInfo.latestVersionCode || versionTag}`;
  const lastSent = localStorage.getItem(notifKey);
  const now = Date.now();
  if (lastSent && now - Number(lastSent) < 24 * 60 * 60 * 1000) {
    return;
  }

  if (Capacitor.isNativePlatform()) {
    try {
      await LocalNotifications.createChannel({
        id: 'update_notifications',
        name: 'Pembaruan Aplikasi',
        description: 'Notifikasi ketersediaan rilis dan versi terbaru Cassiel',
        importance: 5,
        visibility: 1,
        sound: 'notification',
        vibration: true
      }).catch(() => {});

      await LocalNotifications.schedule({
        notifications: [
          {
            id: 999,
            title: title,
            body: body,
            schedule: { at: new Date(Date.now() + 1000), allowWhileIdle: true },
            channelId: 'update_notifications',
            sound: 'notification',
            smallIcon: 'ic_stat_icon',
            iconColor: '#10B981'
          }
        ]
      });
      localStorage.setItem(notifKey, String(now));
    } catch (err) {
      console.log('[UpdateNotif] Native notification error:', err);
    }
  } else if ('Notification' in window && Notification.permission === 'granted') {
    try {
      new Notification(title, {
        body: body,
        icon: '/app-icon.png',
        badge: '/app-icon.png'
      });
      localStorage.setItem(notifKey, String(now));
    } catch (e) {
      console.log('[UpdateNotif] Web notification error:', e);
    }
  }
};

// Schedule background/routine local notifications on HP / Native Android & Web
export const schedulePersonalizedNotifications = async (userName = 'Teman', transactions = [], categories = []) => {
  if (!isNotificationEnabled()) return;

  const name = userName.trim() || 'Teman';
  const hasAnyBudgetLimit = categories.some(cat => typeof cat.monthlyLimit === 'number' && cat.monthlyLimit > 0);

  if (Capacitor.isNativePlatform()) {
    try {
      // Pastikan notification channel tersedia di HP Android
      await LocalNotifications.createChannel({
        id: 'financial_notifications',
        name: 'Notifikasi Finansial',
        description: 'Pengingat dan notifikasi anggaran harian',
        importance: 5,
        visibility: 1,
        sound: 'notification',
        vibration: true
      }).catch(() => {});

      // Selalu cancel notifikasi pengingat lama sebelum menjadwalkan yang fresh
      await LocalNotifications.cancel({ notifications: [{ id: 101 }, { id: 102 }, { id: 103 }] }).catch(() => {});

      const now = new Date();

      const notifsToSchedule = [];

      // 1. Notifikasi Harian Rutin Malam (19:00 WIB)
      let eveningTarget = new Date();
      eveningTarget.setHours(19, 0, 0, 0);
      if (now.getTime() >= eveningTarget.getTime()) {
        eveningTarget.setDate(eveningTarget.getDate() + 1);
      }

      // Generate pesan FRESH menggunakan transaksi terkini
      const msg = generateNotificationMessage(userName, transactions);

      notifsToSchedule.push({
        title: msg.title,
        body: msg.body,
        id: 101,
        schedule: { 
          at: eveningTarget,
          allowWhileIdle: true
        },
        channelId: 'financial_notifications',
        sound: 'notification',
        smallIcon: 'ic_stat_icon',
        iconColor: '#4f46e5'
      });

      // 2. Notifikasi Pengingat Budget Jam 10:00 PAGI (Tepat 1x sehari jika belum mengisi budget)
      if (!hasAnyBudgetLimit) {
        let budgetReminderTarget = new Date();
        budgetReminderTarget.setHours(10, 0, 0, 0);
        
        // Jika saat ini sudah jam 10:00 atau lebih, jadwalkan strictly untuk besok jam 10:00 pagi
        if (now.getTime() >= budgetReminderTarget.getTime()) {
          budgetReminderTarget.setDate(budgetReminderTarget.getDate() + 1);
        }

        notifsToSchedule.push({
          title: `Atur Budget Kategori Bulananmu! 🎯`,
          body: `Halo ${name}! Kamu belum mengatur limit pengeluaran kategori nih. Yuk atur sekarang di menu Profil → "Budget Kategori Per Bulan" agar keuanganmu lebih teratur!`,
          id: 102,
          schedule: { 
            at: budgetReminderTarget,
            allowWhileIdle: true
          },
          channelId: 'financial_notifications',
          sound: 'notification',
          smallIcon: 'ic_stat_icon',
          iconColor: '#2D5284'
        });
      }

      // 3. Notifikasi Ramah Pengenalan Nama Jam 14:00 SIANG (Tepat 1x sehari jika belum ada nama)
      const isUnnamed = !userName || userName.trim() === '' || userName.trim().toLowerCase() === 'pengguna' || userName.trim().toLowerCase() === 'teman';
      if (isUnnamed) {
        let nameReminderTarget = new Date();
        nameReminderTarget.setHours(14, 0, 0, 0);
        
        // Jika saat ini sudah jam 14:00 atau lebih, jadwalkan strictly untuk besok jam 14:00 siang
        if (now.getTime() >= nameReminderTarget.getTime()) {
          nameReminderTarget.setDate(nameReminderTarget.getDate() + 1);
        }

        notifsToSchedule.push({
          title: `Halo Sahabat Cassiel! 👋`,
          body: `Alangkah baiknya jika kamu menuliskan nama panggilan di menu Profil agar Cassiel bisa menyapamu dengan lebih akrab dan personal 😊`,
          id: 103,
          schedule: { 
            at: nameReminderTarget,
            allowWhileIdle: true
          },
          channelId: 'financial_notifications',
          sound: 'notification',
          smallIcon: 'ic_stat_icon',
          iconColor: '#059669'
        });
      }

      if (notifsToSchedule.length > 0) {
        await LocalNotifications.schedule({
          notifications: notifsToSchedule
        });
      }
    } catch (e) {
      console.log('Failed to schedule native local notifications on Android:', e);
    }
  } else if ('Notification' in window && Notification.permission === 'granted') {
    // Web fallback
    try {
      const now = new Date();
      const isUnnamed = !userName || userName.trim() === '' || userName.trim().toLowerCase() === 'pengguna' || userName.trim().toLowerCase() === 'teman';
      if (now.getHours() === 19 && now.getMinutes() === 0) {
        const msg = generateNotificationMessage(userName, transactions);
        new Notification(msg.title, {
          body: msg.body,
          icon: '/app-icon.png',
          badge: '/app-icon.png'
        });
        playSound('notification');
      } else if (now.getHours() === 10 && now.getMinutes() === 0 && !hasAnyBudgetLimit) {
        new Notification(`Atur Budget Kategori Bulananmu! 🎯`, {
          body: `Halo ${name}! Kamu belum mengatur limit pengeluaran kategori nih. Yuk atur sekarang di menu Profil → "Budget Kategori Per Bulan" agar keuanganmu lebih teratur!`,
          icon: '/app-icon.png',
          badge: '/app-icon.png'
        });
        playSound('notification');
      } else if (now.getHours() === 14 && now.getMinutes() === 0 && isUnnamed) {
        new Notification(`Halo Sahabat Cassiel! 👋`, {
          body: `Alangkah baiknya jika kamu menuliskan nama panggilan di menu Profil agar Cassiel bisa menyapamu dengan lebih akrab dan personal 😊`,
          icon: '/app-icon.png',
          badge: '/app-icon.png'
        });
        playSound('notification');
      }
    } catch (e) {
      console.log('Web notification error:', e);
    }
  }
};

// Schedule 1-Day Intro Notification for New Category Insight Feature (08:00 AM & 18:00 PM)
export const scheduleFeatureIntroNotification = async (userName = 'Teman') => {
  if (typeof localStorage === 'undefined') return;
  const ALREADY_SCHEDULED_KEY = 'feature_intro_insight_notif_v1';
  if (localStorage.getItem(ALREADY_SCHEDULED_KEY) === 'true') {
    return;
  }

  const name = userName && userName.trim() ? userName.trim() : 'Teman';
  const now = new Date();

  const morningTarget = new Date();
  morningTarget.setHours(8, 0, 0, 0);

  const eveningTarget = new Date();
  eveningTarget.setHours(18, 0, 0, 0);

  const notifsToSchedule = [];

  if (now.getTime() < morningTarget.getTime()) {
    // 1. Install/Update pagi sebelum jam 8 -> kirim jam 8 pagi & jam 18 sore hari ini
    notifsToSchedule.push(
      {
        id: 201,
        title: `✨ Fitur Baru: Insight Kategori Bulanan`,
        body: `Halo ${name}! Kini kamu bisa melihat rangkuman personal kebiasaan pengeluaran tiap kategori di menu Stats pada akhir bulan.`,
        schedule: { at: morningTarget, allowWhileIdle: true },
        channelId: 'financial_notifications',
        sound: 'notification',
        smallIcon: 'ic_stat_icon',
        iconColor: '#2D5284'
      },
      {
        id: 202,
        title: `📊 Rangkuman Kategori di Akhir Bulan`,
        body: `Setiap transaksi yang kamu catat akan otomatis dirangkum oleh Cassiel menjadi wawasan kebiasaan belanja saat akhir bulan tiba ✨`,
        schedule: { at: eveningTarget, allowWhileIdle: true },
        channelId: 'financial_notifications',
        sound: 'notification',
        smallIcon: 'ic_stat_icon',
        iconColor: '#2D5284'
      }
    );
  } else if (now.getTime() < eveningTarget.getTime()) {
    // 2. Install/Update siang antara jam 8 s.d. 18 -> kirim jam 18 sore hari ini
    notifsToSchedule.push({
      id: 202,
      title: `✨ Fitur Baru: Insight Kategori Bulanan`,
      body: `Halo ${name}! Kini kamu bisa melihat rangkuman personal kebiasaan pengeluaran tiap kategori di menu Stats pada akhir bulan.`,
      schedule: { at: eveningTarget, allowWhileIdle: true },
      channelId: 'financial_notifications',
      sound: 'notification',
      smallIcon: 'ic_stat_icon',
      iconColor: '#2D5284'
    });
  } else {
    // 3. Install/Update malam setelah jam 18 -> kirim besok pagi jam 8 & besok sore jam 18
    const tomorrowMorning = new Date(morningTarget);
    tomorrowMorning.setDate(tomorrowMorning.getDate() + 1);

    const tomorrowEvening = new Date(eveningTarget);
    tomorrowEvening.setDate(tomorrowEvening.getDate() + 1);

    notifsToSchedule.push(
      {
        id: 201,
        title: `✨ Fitur Baru: Insight Kategori Bulanan`,
        body: `Halo ${name}! Kini kamu bisa melihat rangkuman personal kebiasaan pengeluaran tiap kategori di menu Stats pada akhir bulan.`,
        schedule: { at: tomorrowMorning, allowWhileIdle: true },
        channelId: 'financial_notifications',
        sound: 'notification',
        smallIcon: 'ic_stat_icon',
        iconColor: '#2D5284'
      },
      {
        id: 202,
        title: `📊 Rangkuman Kategori di Akhir Bulan`,
        body: `Setiap transaksi yang kamu catat akan otomatis dirangkum oleh Cassiel menjadi wawasan kebiasaan belanja saat akhir bulan tiba ✨`,
        schedule: { at: tomorrowEvening, allowWhileIdle: true },
        channelId: 'financial_notifications',
        sound: 'notification',
        smallIcon: 'ic_stat_icon',
        iconColor: '#2D5284'
      }
    );
  }

  if (Capacitor.isNativePlatform() && notifsToSchedule.length > 0) {
    try {
      await LocalNotifications.createChannel({
        id: 'financial_notifications',
        name: 'Notifikasi Finansial',
        description: 'Pengingat dan notifikasi anggaran harian',
        importance: 5,
        visibility: 1,
        sound: 'notification',
        vibration: true
      }).catch(() => {});

      await LocalNotifications.schedule({
        notifications: notifsToSchedule
      });
      localStorage.setItem(ALREADY_SCHEDULED_KEY, 'true');
    } catch (e) {
      console.warn('Failed to schedule feature intro notification:', e);
    }
  } else {
    localStorage.setItem(ALREADY_SCHEDULED_KEY, 'true');
  }
};

// Schedule 1-Time 5-Second Post-Update Notification for New Categories (Buah & Minuman)
export const scheduleNewCategoryNotification = async (userName = 'Teman') => {
  if (typeof localStorage === 'undefined') return;
  const NOTIF_KEY = 'new_categories_buah_minuman_notif_v1';
  if (localStorage.getItem(NOTIF_KEY) === 'true') {
    return;
  }

  const name = userName && userName.trim() ? userName.trim() : 'Teman';
  const title = '🍎 Kategori Baru: Buah & Minuman';
  const body = `Halo ${name}! Telah hadir 2 kategori baru di Cassiel, yaitu Buah dan Minuman lengkap dengan ikon terbarunya.`;

  if (Capacitor.isNativePlatform()) {
    try {
      await LocalNotifications.createChannel({
        id: 'financial_notifications',
        name: 'Notifikasi Finansial',
        description: 'Pengingat dan notifikasi anggaran harian',
        importance: 5,
        visibility: 1,
        sound: 'notification',
        vibration: true
      }).catch(() => {});

      await LocalNotifications.schedule({
        notifications: [
          {
            id: 301,
            title: title,
            body: body,
            schedule: { at: new Date(Date.now() + 5000), allowWhileIdle: true },
            channelId: 'financial_notifications',
            sound: 'notification',
            smallIcon: 'ic_stat_icon',
            iconColor: '#2D5284'
          }
        ]
      });
      localStorage.setItem(NOTIF_KEY, 'true');
    } catch (e) {
      console.warn('Failed to schedule new category notification:', e);
    }
  } else if ('Notification' in window && Notification.permission === 'granted') {
    setTimeout(() => {
      try {
        new Notification(title, {
          body: body,
          icon: '/app-icon.png',
          badge: '/app-icon.png'
        });
        playSound('notification');
        localStorage.setItem(NOTIF_KEY, 'true');
      } catch (e) {
        console.log('Web notification error:', e);
      }
    }, 5000);
  } else {
    localStorage.setItem(NOTIF_KEY, 'true');
  }
};

// Schedule 1-Time 5-Second Post-Update Notification for v1.0.18 Features (Multi-Language & Developer Feedback)
export const scheduleV18FeatureIntroNotification = async (userName = 'Teman') => {
  if (typeof localStorage === 'undefined') return;
  const NOTIF_KEY = 'v1_0_18_feature_intro_notif';
  if (localStorage.getItem(NOTIF_KEY) === 'true') {
    return;
  }

  const name = userName && userName.trim() ? userName.trim() : 'Teman';
  const title = '✨ Fitur Baru: Gaya Tulisan & Bahasa!';
  const body = 'Kini Anda bisa mengubah gaya font tampilan aplikasi dan pilihan bahasa melalui menu Profil ✨';

  if (Capacitor.isNativePlatform()) {
    try {
      await LocalNotifications.createChannel({
        id: 'financial_notifications',
        name: 'Notifikasi Finansial',
        description: 'Pengingat dan notifikasi anggaran harian',
        importance: 5,
        visibility: 1,
        sound: 'notification',
        vibration: true
      }).catch(() => {});

      await LocalNotifications.schedule({
        notifications: [
          {
            id: 401,
            title: title,
            body: body,
            schedule: { at: new Date(Date.now() + 5000), allowWhileIdle: true },
            channelId: 'financial_notifications',
            sound: 'notification',
            smallIcon: 'ic_stat_icon',
            iconColor: '#2D5284'
          }
        ]
      });
      localStorage.setItem(NOTIF_KEY, 'true');
    } catch (e) {
      console.warn('Failed to schedule v1.0.18 feature intro notification:', e);
    }
  } else if ('Notification' in window && Notification.permission === 'granted') {
    setTimeout(() => {
      try {
        new Notification(title, {
          body: body,
          icon: '/app-icon.png',
          badge: '/app-icon.png'
        });
        playSound('notification');
        localStorage.setItem(NOTIF_KEY, 'true');
      } catch (e) {
        console.log('Web notification error:', e);
      }
    }, 5000);
  } else {
    localStorage.setItem(NOTIF_KEY, 'true');
  }
};


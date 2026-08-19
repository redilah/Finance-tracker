import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';
import { getTranslation } from './i18n';
import { safeStorageGet } from './secureStorage';

// Keys for LocalStorage
const NOTIF_STORAGE_KEY = 'user_notification_bell_enabled';

// Helper: interpolate {placeholders} in translated strings
const interp = (str = '', vars = {}) =>
  str.replace(/\{(\w+)\}/g, (_, key) => (vars[key] !== undefined ? vars[key] : `{${key}}`));

// Helper: read language from localStorage (used outside React context)
const getLang = () => {
  try { return localStorage.getItem('user_app_lang') || 'id'; } catch { return 'id'; }
};

// Shorthand t() — resolves from passed lang or falls back to localStorage
const tr = (lang, key, vars = {}) => interp(getTranslation(lang || getLang(), key), vars);

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

        return true;
      }
    } else if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        localStorage.setItem(NOTIF_STORAGE_KEY, 'true');
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

// Generate smart personal message (now language-aware)
export const generateNotificationMessage = (userName = 'Teman', transactions = [], lang) => {
  const l = lang || getLang();
  const fallbackName = l === 'en' ? 'Friend'
    : l === 'jv' ? 'Mitra'
    : l === 'zh' ? 'Pengyou'
    : l === 'ko' ? 'Chingu'
    : 'Teman';
  const name = (userName && userName.trim()) ? userName.trim() : fallbackName;
  const { todayExpense, yesterdayExpense, hasTodayExpense, todayProductiveItems } = getExpenseStatsForNotification(transactions);
  
  const currentHour = new Date().getHours();
  
  // Format IDR string
  const formatIdr = (num) => new Intl.NumberFormat('id-ID').format(num);

  // 1. Pujian khusus jika membeli aset / investasi produktif hari ini
  if (todayProductiveItems.length > 0) {
    const itemName = todayProductiveItems[0];
    return {
      title: tr(l, 'notifGreatDecision', { name }),
      body: tr(l, 'notifGreatDecisionBody', { name, item: itemName })
    };
  }

  // 2. Tanya jika belum mencatat pengeluaran hari ini
  if (!hasTodayExpense) {
    if (currentHour >= 19) {
      return {
        title: tr(l, 'notifGoodEvening', { name }),
        body: tr(l, 'notifGoodEveningBody', { name })
      };
    } else {
      return {
        title: tr(l, 'notifHello', { name }),
        body: tr(l, 'notifHelloBody', { name })
      };
    }
  }

  // 3. Pujian hemat dibanding kemarin
  if (yesterdayExpense > 0 && todayExpense < yesterdayExpense) {
    return {
      title: tr(l, 'notifSavingPraise', { name }),
      body: tr(l, 'notifSavingPraiseBody', { name, today: formatIdr(todayExpense), yesterday: formatIdr(yesterdayExpense) })
    };
  }

  if (todayExpense > 0) {
    return {
      title: tr(l, 'notifFinancialNote', { name }),
      body: tr(l, 'notifFinancialNoteBody', { name, today: formatIdr(todayExpense) })
    };
  }

  return {
    title: tr(l, 'notifKeepGoing', { name }),
    body: tr(l, 'notifKeepGoingBody', { name })
  };
};

// Trigger immediate welcome notification when bell is turned on
export const sendInstantNotification = (userName, transactions, lang) => {
  if (!isNotificationEnabled()) return;

  const l = lang || getLang();
  const fallbackName = l === 'en' ? 'Friend' : l === 'jv' ? 'Mitra' : l === 'zh' ? 'Pengyou' : l === 'ko' ? 'Chingu' : 'Teman';
  const name = (userName && userName.trim()) ? userName.trim() : fallbackName;

  const title = tr(l, 'notifWelcome', { name });
  const body = tr(l, 'notifWelcomeBody', { name });

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
          largeIcon: 'ic_large_icon',
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
          largeIcon: 'ic_large_icon',
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

// Build localized budget notification strings (called from App.jsx)
export const buildBudgetNotifText = (catName, pct, limit, lang) => {
  const l = lang || getLang();
  const formatIdr = (num) => new Intl.NumberFormat('id-ID').format(num);
  const limitStr = formatIdr(limit);
  if (pct >= 100) {
    return {
      title: tr(l, 'notifBudgetExhausted', { cat: catName }),
      body: tr(l, 'notifBudgetExhaustedBody', { cat: catName, limit: limitStr })
    };
  }
  return {
    title: tr(l, 'notifBudgetWarning', { cat: catName }),
    body: tr(l, 'notifBudgetWarningBody', { cat: catName, pct, limit: limitStr })
  };
};

// Build localized Main Monthly Budget notification strings (called from App.jsx)
export const buildMainBudgetNotifText = (pct, limit, spent, lang) => {
  const l = lang || getLang();
  const formatIdr = (num) => new Intl.NumberFormat('id-ID').format(num);
  const limitStr = formatIdr(limit);
  const spentStr = formatIdr(spent);
  if (pct >= 100) {
    return {
      title: tr(l, 'notifMainBudgetExhausted'),
      body: tr(l, 'notifMainBudgetExhaustedBody', { limit: limitStr, spent: spentStr })
    };
  }
  return {
    title: tr(l, 'notifMainBudgetWarning', { pct }),
    body: tr(l, 'notifMainBudgetWarningBody', { pct, limit: limitStr, spent: spentStr })
  };
};

// Trigger native status bar notification when a new version update is available
export const sendUpdateReminderNotification = async (updateInfo, lang) => {
  if (!updateInfo || !updateInfo.latestVersionName) return;

  const l = lang || getLang();
  const versionTag = updateInfo.latestVersionName;
  const title = tr(l, 'notifUpdateAvailable', { ver: versionTag });
  const body = tr(l, 'notifUpdateAvailableBody', { ver: versionTag });

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
            largeIcon: 'ic_large_icon',
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
export const schedulePersonalizedNotifications = async (userName = 'Teman', transactions = [], categories = [], lang, mainBudget = null) => {
  if (!isNotificationEnabled()) return;

  const l = lang || getLang();
  const fallbackName = l === 'en' ? 'Friend' : l === 'jv' ? 'Mitra' : l === 'zh' ? 'Pengyou' : l === 'ko' ? 'Chingu' : 'Teman';
  const name = (userName && userName.trim()) ? userName.trim() : fallbackName;
  const hasAnyBudgetLimit = categories.some(cat => typeof cat.monthlyLimit === 'number' && cat.monthlyLimit > 0);
  const resolvedMainBudget = mainBudget !== null ? mainBudget : (Number(safeStorageGet('user_main_monthly_budget')) || null);
  const hasMainBudget = typeof resolvedMainBudget === 'number' && resolvedMainBudget > 0;

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
      await LocalNotifications.cancel({ notifications: [{ id: 101 }, { id: 102 }, { id: 103 }, { id: 104 }] }).catch(() => {});

      const now = new Date();

      const notifsToSchedule = [];

      // 1. Notifikasi Harian Rutin Malam (19:00 WIB)
      let eveningTarget = new Date();
      eveningTarget.setHours(19, 0, 0, 0);
      if (now.getTime() >= eveningTarget.getTime()) {
        eveningTarget.setDate(eveningTarget.getDate() + 1);
      }

      // Generate pesan FRESH menggunakan transaksi terkini
      const msg = generateNotificationMessage(userName, transactions, l);

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
        largeIcon: 'ic_large_icon',
        iconColor: '#4f46e5'
      });

      // 2. Notifikasi Pengingat Budget Utama / Kategori Jam 10:00 PAGI
      if (!hasMainBudget || !hasAnyBudgetLimit) {
        let budgetReminderTarget = new Date();
        budgetReminderTarget.setHours(10, 0, 0, 0);
        
        if (now.getTime() >= budgetReminderTarget.getTime()) {
          budgetReminderTarget.setDate(budgetReminderTarget.getDate() + 1);
        }

        const notifTitle = !hasMainBudget ? tr(l, 'notifSetMainBudget', { name }) : tr(l, 'notifSetBudget', { name });
        const notifBody = !hasMainBudget ? tr(l, 'notifSetMainBudgetBody', { name }) : tr(l, 'notifSetBudgetBody', { name });

        notifsToSchedule.push({
          title: notifTitle,
          body: notifBody,
          id: 102,
          schedule: { 
            at: budgetReminderTarget,
            allowWhileIdle: true
          },
          channelId: 'financial_notifications',
          sound: 'notification',
          smallIcon: 'ic_stat_icon',
          largeIcon: 'ic_large_icon',
          iconColor: '#2D5284'
        });
      }

      // 3. Notifikasi Ramah Pengenalan Nama Jam 14:00 SIANG
      const isUnnamed = !userName || userName.trim() === '' || userName.trim().toLowerCase() === 'pengguna' || userName.trim().toLowerCase() === 'teman';
      if (isUnnamed) {
        let nameReminderTarget = new Date();
        nameReminderTarget.setHours(14, 0, 0, 0);
        
        if (now.getTime() >= nameReminderTarget.getTime()) {
          nameReminderTarget.setDate(nameReminderTarget.getDate() + 1);
        }

        notifsToSchedule.push({
          title: tr(l, 'notifAddName', { name }),
          body: tr(l, 'notifAddNameBody', { name }),
          id: 103,
          schedule: { 
            at: nameReminderTarget,
            allowWhileIdle: true
          },
          channelId: 'financial_notifications',
          sound: 'notification',
          smallIcon: 'ic_stat_icon',
          largeIcon: 'ic_large_icon',
          iconColor: '#059669'
        });
      }

      // 4. Notifikasi Insight Bulanan Siap Dibaca di Hari Terakhir Bulan (Pukul 09:00 Pagi)
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth();
      const lastDateOfMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
      let endOfMonthTarget = new Date(currentYear, currentMonth, lastDateOfMonth, 9, 0, 0, 0);

      // Jika hari terakhir bulan ini jam 09:00 sudah lewat, jadwalkan untuk akhir bulan depan
      if (now.getTime() >= endOfMonthTarget.getTime()) {
        const nextMonthLastDate = new Date(currentYear, currentMonth + 2, 0).getDate();
        endOfMonthTarget = new Date(currentYear, currentMonth + 1, nextMonthLastDate, 9, 0, 0, 0);
      }

      const targetMonthIndex = endOfMonthTarget.getMonth();
      const targetMonthNames = {
        id: ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'],
        en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
        jv: ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'],
        zh: ['1 Yue', '2 Yue', '3 Yue', '4 Yue', '5 Yue', '6 Yue', '7 Yue', '8 Yue', '9 Yue', '10 Yue', '11 Yue', '12 Yue'],
        ko: ['1-Wol', '2-Wol', '3-Wol', '4-Wol', '5-Wol', '6-Wol', '7-Wol', '8-Wol', '9-Wol', '10-Wol', '11-Wol', '12-Wol']
      };
      const monthNameStr = (targetMonthNames[l] || targetMonthNames.id)[targetMonthIndex];

      notifsToSchedule.push({
        title: tr(l, 'notifMonthlyInsightReady', { name, month: monthNameStr }),
        body: tr(l, 'notifMonthlyInsightReadyBody', { name, month: monthNameStr }),
        id: 104,
        schedule: {
          at: endOfMonthTarget,
          allowWhileIdle: true
        },
        channelId: 'financial_notifications',
        sound: 'notification',
        smallIcon: 'ic_stat_icon',
        largeIcon: 'ic_large_icon',
        iconColor: '#7C3AED'
      });

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
        const msg = generateNotificationMessage(userName, transactions, l);
        new Notification(msg.title, {
          body: msg.body,
          icon: '/app-icon.png',
          badge: '/app-icon.png'
        });
        playSound('notification');
      } else if (now.getHours() === 10 && now.getMinutes() === 0 && (!hasMainBudget || !hasAnyBudgetLimit)) {
        const notifTitle = !hasMainBudget ? tr(l, 'notifSetMainBudget', { name }) : tr(l, 'notifSetBudget', { name });
        const notifBody = !hasMainBudget ? tr(l, 'notifSetMainBudgetBody', { name }) : tr(l, 'notifSetBudgetBody', { name });
        new Notification(notifTitle, {
          body: notifBody,
          icon: '/app-icon.png',
          badge: '/app-icon.png'
        });
        playSound('notification');
      } else if (now.getHours() === 14 && now.getMinutes() === 0 && isUnnamed) {
        new Notification(tr(l, 'notifAddName', { name }), {
          body: tr(l, 'notifAddNameBody', { name }),
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
export const scheduleFeatureIntroNotification = async (userName = 'Teman', lang) => {
  if (typeof localStorage === 'undefined') return;
  const ALREADY_SCHEDULED_KEY = 'feature_intro_insight_notif_v1';
  if (localStorage.getItem(ALREADY_SCHEDULED_KEY) === 'true') {
    return;
  }

  const l = lang || getLang();
  const fallbackName = l === 'en' ? 'Friend' : l === 'jv' ? 'Mitra' : l === 'zh' ? 'Pengyou' : l === 'ko' ? 'Chingu' : 'Teman';
  const name = (userName && userName.trim()) ? userName.trim() : fallbackName;
  const now = new Date();

  const morningTarget = new Date();
  morningTarget.setHours(8, 0, 0, 0);

  const eveningTarget = new Date();
  eveningTarget.setHours(18, 0, 0, 0);

  const notifsToSchedule = [];

  if (now.getTime() < morningTarget.getTime()) {
    notifsToSchedule.push(
      {
        id: 201,
        title: tr(l, 'notifInsightTitle', { name }),
        body: tr(l, 'notifInsightBody', { name }),
        schedule: { at: morningTarget, allowWhileIdle: true },
        channelId: 'financial_notifications',
        sound: 'notification',
        smallIcon: 'ic_stat_icon',
        largeIcon: 'ic_large_icon',
        iconColor: '#2D5284'
      },
      {
        id: 202,
        title: tr(l, 'notifInsightEveTitle', { name }),
        body: tr(l, 'notifInsightEveBody', { name }),
        schedule: { at: eveningTarget, allowWhileIdle: true },
        channelId: 'financial_notifications',
        sound: 'notification',
        smallIcon: 'ic_stat_icon',
        largeIcon: 'ic_large_icon',
        iconColor: '#2D5284'
      }
    );
  } else if (now.getTime() < eveningTarget.getTime()) {
    notifsToSchedule.push({
      id: 202,
      title: tr(l, 'notifInsightTitle', { name }),
      body: tr(l, 'notifInsightBody', { name }),
      schedule: { at: eveningTarget, allowWhileIdle: true },
      channelId: 'financial_notifications',
      sound: 'notification',
      smallIcon: 'ic_stat_icon',
      largeIcon: 'ic_large_icon',
      iconColor: '#2D5284'
    });
  } else {
    const tomorrowMorning = new Date(morningTarget);
    tomorrowMorning.setDate(tomorrowMorning.getDate() + 1);

    const tomorrowEvening = new Date(eveningTarget);
    tomorrowEvening.setDate(tomorrowEvening.getDate() + 1);

    notifsToSchedule.push(
      {
        id: 201,
        title: tr(l, 'notifInsightTitle', { name }),
        body: tr(l, 'notifInsightBody', { name }),
        schedule: { at: tomorrowMorning, allowWhileIdle: true },
        channelId: 'financial_notifications',
        sound: 'notification',
        smallIcon: 'ic_stat_icon',
        largeIcon: 'ic_large_icon',
        iconColor: '#2D5284'
      },
      {
        id: 202,
        title: tr(l, 'notifInsightEveTitle', { name }),
        body: tr(l, 'notifInsightEveBody', { name }),
        schedule: { at: tomorrowEvening, allowWhileIdle: true },
        channelId: 'financial_notifications',
        sound: 'notification',
        smallIcon: 'ic_stat_icon',
        largeIcon: 'ic_large_icon',
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
export const scheduleNewCategoryNotification = async (userName = 'Teman', lang) => {
  if (typeof localStorage === 'undefined') return;
  const NOTIF_KEY = 'new_categories_buah_minuman_notif_v1';
  if (localStorage.getItem(NOTIF_KEY) === 'true') {
    return;
  }

  const l = lang || getLang();
  const fallbackName = l === 'en' ? 'Friend' : l === 'jv' ? 'Mitra' : l === 'zh' ? 'Pengyou' : l === 'ko' ? 'Chingu' : 'Teman';
  const name = (userName && userName.trim()) ? userName.trim() : fallbackName;
  const title = tr(l, 'notifNewCatTitle', { name });
  const body = tr(l, 'notifNewCatBody', { name });

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
            largeIcon: 'ic_large_icon',
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

// Schedule 1-Time 5-Second Post-Update Notification for v1.0.20 Features (Accounts/Banks & Data Backup/Restore)
export const scheduleV20FeatureIntroNotification = async (userName = 'Teman', lang) => {
  if (typeof localStorage === 'undefined') return;
  const NOTIF_KEY = 'v1_0_20_feature_intro_notif';
  if (localStorage.getItem(NOTIF_KEY) === 'true') {
    return;
  }

  const l = lang || getLang();
  const fallbackName = l === 'en' ? 'Friend' : l === 'jv' ? 'Mitra' : l === 'zh' ? 'Pengyou' : l === 'ko' ? 'Chingu' : 'Teman';
  const name = (userName && userName.trim()) ? userName.trim() : fallbackName;
  const title = tr(l, 'notifV20FeatureIntroTitle', { name });
  const body = tr(l, 'notifV20FeatureIntroBody', { name });

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
            id: 501,
            title: title,
            body: body,
            schedule: { at: new Date(Date.now() + 5000), allowWhileIdle: true },
            channelId: 'financial_notifications',
            sound: 'notification',
            smallIcon: 'ic_stat_icon',
            largeIcon: 'ic_large_icon',
            iconColor: '#2D5284'
          }
        ]
      });
      localStorage.setItem(NOTIF_KEY, 'true');
    } catch (e) {
      console.warn('Failed to schedule v1.0.20 feature intro notification:', e);
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

// Schedule 1-Time 5-Second Post-Update Notification for v1.0.23 Features (Monthly Bar Chart & Stats Switcher)
export const scheduleV23FeatureIntroNotification = async (userName = 'Teman', lang) => {
  if (typeof localStorage === 'undefined') return;
  const NOTIF_KEY = 'v1_0_23_feature_intro_notif';
  if (localStorage.getItem(NOTIF_KEY) === 'true') {
    return;
  }

  const l = lang || getLang();
  const fallbackName = l === 'en' ? 'Friend' : l === 'jv' ? 'Mitra' : l === 'zh' ? 'Pengyou' : l === 'ko' ? 'Chingu' : 'Teman';
  const name = (userName && userName.trim()) ? userName.trim() : fallbackName;
  const title = tr(l, 'notifV23FeatureIntroTitle', { name });
  const body = tr(l, 'notifV23FeatureIntroBody', { name });

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
            id: 601,
            title: title,
            body: body,
            schedule: { at: new Date(Date.now() + 5000), allowWhileIdle: true },
            channelId: 'financial_notifications',
            sound: 'notification',
            smallIcon: 'ic_stat_icon',
            largeIcon: 'ic_large_icon',
            iconColor: '#2D5284'
          }
        ]
      });
      localStorage.setItem(NOTIF_KEY, 'true');
    } catch (e) {
      console.warn('Failed to schedule v1.0.23 feature intro notification:', e);
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



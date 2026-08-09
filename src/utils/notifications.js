import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';

// Keys for LocalStorage
const NOTIF_STORAGE_KEY = 'user_notification_bell_enabled';

// Play sound helper
export const playSound = (soundType = 'notification') => {
  try {
    const audioPath = soundType === 'app_open' ? '/audio/app_open.mp3' : '/audio/bubble_pop_1.wav';
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
      } catch (err) {}
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
    if (t.type === 'Expense') {
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

  const name = userName.trim() || 'Teman';
  const title = `Halo ${name}! ✨`;
  const body = `Selamat datang di Cassiel, semoga catatan keuanganmu lebih teratur ya!`;

  if (Capacitor.isNativePlatform()) {
    LocalNotifications.schedule({
      notifications: [
        {
          title: title,
          body: body,
          id: Date.now() % 10000,
          schedule: { at: new Date(Date.now() + 1000) },
          sound: 'notification.mp3',
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
      playSound('notification');
    } catch (e) {
      console.log('Web notification error:', e);
    }
  }
};

// Schedule background/routine local notifications
export const schedulePersonalizedNotifications = async (userName = 'Teman', transactions = []) => {
  if (!isNotificationEnabled()) return;

  const msg = generateNotificationMessage(userName, transactions);

  if (Capacitor.isNativePlatform()) {
    try {
      await LocalNotifications.cancel({ notifications: [{ id: 101 }, { id: 102 }] });
      
      const now = new Date();
      // Evening notification target: 19:00 today or tomorrow
      let eveningTarget = new Date();
      eveningTarget.setHours(19, 0, 0, 0);
      if (now.getTime() >= eveningTarget.getTime()) {
        eveningTarget.setDate(eveningTarget.getDate() + 1);
      }

      await LocalNotifications.schedule({
        notifications: [
          {
            title: msg.title,
            body: msg.body,
            id: 101,
            schedule: { at: eveningTarget, repeats: true },
            sound: 'notification.mp3',
            smallIcon: 'ic_stat_icon',
            iconColor: '#4f46e5'
          }
        ]
      });
    } catch (e) {
      console.log('Failed to schedule native local notifications:', e);
    }
  } else if ('Notification' in window && Notification.permission === 'granted') {
    // Web fallback for native OS notifications
    try {
      const now = new Date();
      if (now.getHours() === 19 && now.getMinutes() === 0) {
        new Notification(msg.title, {
          body: msg.body,
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

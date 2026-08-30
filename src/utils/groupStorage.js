/**
 * Cassiel Groups Storage & Business Engine (V1)
 * Encrypted local persistence for Group Financial Ledgers & Social Chat
 */

import { safeStorageGet, safeStorageSet } from './secureStorage';
import { sendGroupChatNotification } from './notifications';
import { db } from './firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  deleteDoc, 
  query, 
  where, 
  onSnapshot 
} from '@firebase/firestore';

const GROUPS_STORAGE_KEY = 'user_cassiel_groups';
const SHARED_GROUPS_COLLECTION = 'cassiel_shared_groups';

// Helper to push group to Firestore in real-time
export async function syncGroupToCloud(group) {
  if (!group || !group.id) return;
  try {
    const docRef = doc(db, SHARED_GROUPS_COLLECTION, group.id);
    const cleanGroup = JSON.parse(JSON.stringify(group));
    await setDoc(docRef, cleanGroup, { merge: true });
  } catch (err) {
    console.warn('[Firestore Group Sync] Gagal sinkronisasi grup ke cloud:', err?.message || err);
  }
}

// Initial sample group is empty (no dummy data)
const INITIAL_DEMO_GROUPS = [];

export function getStoredGroups(currentUserName = 'Pengguna Cassiel') {
  try {
    const raw = safeStorageGet(GROUPS_STORAGE_KEY);
    if (!raw) {
      safeStorageSet(GROUPS_STORAGE_KEY, []);
      return [];
    }
    const parsed = Array.isArray(raw) ? raw : JSON.parse(raw);
    // Filter out old legacy demo group if previously stored
    const cleaned = (parsed || []).filter(g => g.id !== 'grp_bem_2026');
    if (cleaned.length !== (parsed || []).length) {
      safeStorageSet(GROUPS_STORAGE_KEY, cleaned);
    }
    return cleaned;
  } catch (err) {
    console.error('Error loading Cassiel Groups:', err);
    return [];
  }
}

export function saveStoredGroups(groups) {
  try {
    safeStorageSet(GROUPS_STORAGE_KEY, groups);
    // Asynchronously trigger telemetry update so admin dashboard has real-time group data
    if (typeof window !== 'undefined') {
      import('./telemetry.js').then(({ updateCurrentDeviceTelemetry }) => {
        if (typeof updateCurrentDeviceTelemetry === 'function') {
          updateCurrentDeviceTelemetry().catch(() => {});
        }
      }).catch(() => {});
    }
  } catch (err) {
    console.error('Error saving Cassiel Groups:', err);
  }
}

/**
 * Bergabung ke grup via Kode Undangan (Invite Code) dari Firestore
 */
export async function joinGroupByInviteCode({ inviteCode, currentUserName = 'Redilah', currentUserAvatar = null }) {
  if (!inviteCode || !inviteCode.trim()) {
    throw new Error('Kode undangan tidak boleh kosong');
  }

  const cleanCode = inviteCode.trim().toUpperCase();
  const currentList = getStoredGroups(currentUserName);

  // Cek apakah sudah ada di grup lokal
  const existingLocal = currentList.find(g => (g.inviteCode || '').toUpperCase() === cleanCode);
  if (existingLocal) {
    return { success: true, group: existingLocal, isNew: false };
  }

  try {
    const colRef = collection(db, SHARED_GROUPS_COLLECTION);
    const q = query(colRef, where('inviteCode', '==', cleanCode));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      throw new Error(`Grup dengan kode "${cleanCode}" tidak ditemukan di server.`);
    }

    const docSnap = snapshot.docs[0];
    const groupData = docSnap.data();

    // Tambahkan diri kita sebagai anggota jika belum ada
    const members = Array.isArray(groupData.members) ? [...groupData.members] : [];
    const alreadyMember = members.some(m => m.name === currentUserName || m.isCurrentUser);

    if (!alreadyMember) {
      const newMember = {
        id: `mem_${Date.now()}`,
        name: currentUserName || 'Anggota',
        avatar: currentUserAvatar || null,
        role: 'member',
        isCurrentUser: true,
        joinedAt: new Date().toISOString()
      };
      members.push(newMember);
      groupData.members = members;

      // Catat pesan sistem bahwa ada member baru bergabung
      const joinMsg = {
        id: `msg_${Date.now()}_join`,
        senderId: newMember.id,
        senderName: newMember.name,
        type: 'text',
        text: `👋 ${currentUserName} telah bergabung ke dalam grup melalui link undangan.`,
        timestamp: new Date().toISOString()
      };
      groupData.messages = [...(groupData.messages || []), joinMsg];

      // Update di Firestore
      await setDoc(doc(db, SHARED_GROUPS_COLLECTION, groupData.id), groupData, { merge: true });
    }

    // Simpan ke storage lokal
    const updatedList = [groupData, ...currentList.filter(g => g.id !== groupData.id)];
    saveStoredGroups(updatedList);

    return { success: true, group: groupData, isNew: true };
  } catch (err) {
    console.error('Error joining group by invite code:', err);
    throw err;
  }
}

/**
 * Realtime Listener untuk mensinkronkan perubahan grup antar anggota secara instan
 */
export function subscribeToGroupRealtime(groupId, onUpdate) {
  if (!groupId || !db) return () => {};
  try {
    const docRef = doc(db, SHARED_GROUPS_COLLECTION, groupId);
    return onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const cloudData = docSnap.data();
        if (typeof onUpdate === 'function') {
          onUpdate(cloudData);
        }
      }
    });
  } catch (e) {
    console.warn('Subscription to group warning:', e);
    return () => {};
  }
}

export function createNewGroup({
  name,
  type = 'Organisasi',
  description = '',
  monthlyFee = 50000,
  initialBalance = 0,
  currentUserName = 'Redilah',
  avatar = null,
  initialMembers = []
}) {
  const code = Math.random().toString(36).substring(2, 8).toUpperCase();
  const newGroupId = `grp_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
  const nowStr = new Date().toISOString();

  const currentMember = {
    id: `mem_${Date.now()}`,
    name: currentUserName || 'Pengguna Cassiel',
    role: 'admin',
    isCurrentUser: true
  };

  const parsedExtraMembers = (initialMembers || []).map((mName, idx) => ({
    id: `mem_${Date.now()}_${idx + 1}`,
    name: typeof mName === 'string' ? mName.trim() : mName.name || 'Anggota',
    role: 'member'
  }));

  const initialTx = [];
  const initialMsgs = [
    {
      id: `msg_${Date.now()}`,
      senderId: currentMember.id,
      senderName: currentMember.name,
      type: 'text',
      text: `Grup ${name} berhasil dibuat. Selamat mengelola keuangan bersama secara transparan! ✨`,
      timestamp: nowStr
    }
  ];

  if (Number(initialBalance) > 0) {
    const txId = `tx_${Date.now()}_init`;
    initialTx.push({
      id: txId,
      type: 'kas_in',
      amount: Number(initialBalance),
      memberId: currentMember.id,
      memberName: currentMember.name,
      month: nowStr.substring(0, 7),
      title: 'Saldo Awal Kas',
      category: 'Saldo Awal',
      note: 'Inisialisasi saldo pembukaan kas',
      timestamp: nowStr
    });
    initialMsgs.push({
      id: `msg_${Date.now()}_init`,
      senderId: currentMember.id,
      senderName: currentMember.name,
      type: 'financial_in',
      txId,
      amount: Number(initialBalance),
      month: 'Saldo Awal',
      text: `${currentMember.name} menambahkan Saldo Awal Kas Rp${Number(initialBalance).toLocaleString('id-ID')}`,
      timestamp: nowStr
    });
  }

  const newGroup = {
    id: newGroupId,
    name: name.trim(),
    avatar: avatar || null,
    type,
    description: description.trim(),
    createdAt: nowStr,
    monthlyFee: Number(monthlyFee) || 0,
    currency: 'IDR',
    inviteCode: code,
    members: [currentMember, ...parsedExtraMembers],
    monthlyKasTracking: {},
    transactions: initialTx,
    messages: initialMsgs
  };

  const currentList = getStoredGroups(currentUserName);
  const updatedList = [newGroup, ...currentList];
  saveStoredGroups(updatedList);
  syncGroupToCloud(newGroup);
  return newGroup;
}

export function recordKasPayment({ groupId, memberId, memberName, amount, monthKey, note = '', currentUserName = 'Redilah' }) {
  const currentList = getStoredGroups(currentUserName);
  const groupIndex = currentList.findIndex(g => g.id === groupId);
  if (groupIndex === -1) return null;

  const group = { ...currentList[groupIndex] };
  const txId = `tx_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
  const nowStr = new Date().toISOString();
  const numAmount = Number(amount) || group.monthlyFee || 0;

  const newTx = {
    id: txId,
    type: 'kas_in',
    amount: numAmount,
    memberId: memberId || 'mem_cur',
    memberName: memberName || currentUserName,
    month: monthKey,
    title: `Iuran Kas ${formatMonthLabel(monthKey)}`,
    category: 'Iuran Kas',
    note: note.trim(),
    timestamp: nowStr
  };

  const newMsg = {
    id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
    senderId: memberId || 'mem_cur',
    senderName: memberName || currentUserName,
    type: 'financial_in',
    txId,
    amount: numAmount,
    month: formatMonthLabel(monthKey),
    text: `${memberName || currentUserName} membayar iuran kas Rp${numAmount.toLocaleString('id-ID')} (${formatMonthLabel(monthKey)})`,
    timestamp: nowStr
  };

  const currentTracking = group.monthlyKasTracking || {};
  const monthTracking = currentTracking[monthKey] || {};
  
  group.monthlyKasTracking = {
    ...currentTracking,
    [monthKey]: {
      ...monthTracking,
      [memberId]: {
        paid: true,
        amount: numAmount,
        paidAt: nowStr,
        txId
      }
    }
  };

  group.transactions = [newTx, ...(group.transactions || [])];
  group.messages = [...(group.messages || []), newMsg];

  currentList[groupIndex] = group;
  saveStoredGroups(currentList);
  syncGroupToCloud(group);

  const isMe = (memberName || currentUserName) === currentUserName && memberId === 'mem_cur';
  sendGroupChatNotification({
    groupName: group.name,
    senderName: memberName || currentUserName,
    text: newMsg.text,
    amount: numAmount,
    type: 'financial_in',
    isMe
  });

  return { updatedGroup: group, newTx, newMsg };
}

export function recordGroupExpense({ groupId, title, amount, paidBy, purpose, category = 'Pengeluaran Kas', note = '', proofImage = null, currentUserName = 'Redilah' }) {
  const currentList = getStoredGroups(currentUserName);
  const groupIndex = currentList.findIndex(g => g.id === groupId);
  if (groupIndex === -1) return null;

  const group = { ...currentList[groupIndex] };
  const txId = `tx_exp_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
  const nowStr = new Date().toISOString();
  const numAmount = Number(amount) || 0;

  const newTx = {
    id: txId,
    type: 'expense',
    amount: numAmount,
    paidBy: paidBy || currentUserName,
    purpose: purpose || title,
    title: title.trim(),
    category: category.trim(),
    note: note.trim(),
    proofImage: proofImage || null,
    timestamp: nowStr
  };

  const newMsg = {
    id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
    senderId: 'mem_cur',
    senderName: paidBy || currentUserName,
    type: 'financial_out',
    txId,
    amount: numAmount,
    paidBy: paidBy || currentUserName,
    purpose: purpose || title,
    title: title.trim(),
    hasProof: Boolean(proofImage),
    text: `${paidBy || currentUserName} mencatat pengeluaran Rp${numAmount.toLocaleString('id-ID')} untuk ${purpose || title}`,
    timestamp: nowStr
  };

  group.transactions = [newTx, ...(group.transactions || [])];
  group.messages = [...(group.messages || []), newMsg];

  currentList[groupIndex] = group;
  saveStoredGroups(currentList);
  syncGroupToCloud(group);

  const isMe = (paidBy || currentUserName) === currentUserName;
  sendGroupChatNotification({
    groupName: group.name,
    senderName: paidBy || currentUserName,
    text: newMsg.text,
    amount: numAmount,
    type: 'financial_out',
    isMe
  });

  return { updatedGroup: group, newTx, newMsg };
}

export function sendGroupTextMessage({ groupId, text, senderName = 'Redilah', senderId = 'mem_cur' }) {
  if (!text || !text.trim()) return null;
  const currentList = getStoredGroups(senderName);
  const groupIndex = currentList.findIndex(g => g.id === groupId);
  if (groupIndex === -1) return null;

  const group = { ...currentList[groupIndex] };
  const newMsg = {
    id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
    senderId: senderId || 'mem_cur',
    senderName: senderName || 'Pengguna Cassiel',
    type: 'text',
    text: text.trim(),
    timestamp: new Date().toISOString()
  };

  group.messages = [...(group.messages || []), newMsg];
  currentList[groupIndex] = group;
  saveStoredGroups(currentList);
  syncGroupToCloud(group);

  const isMe = senderId === 'mem_cur';
  sendGroupChatNotification({
    groupName: group.name,
    senderName: senderName || 'Pengguna Cassiel',
    text: text.trim(),
    type: 'text',
    isMe
  });

  return { updatedGroup: group, newMsg };
}

export function deleteGroupMessage({ groupId, messageId, deleteType = 'everyone', currentUserName = 'Redilah' }) {
  if (!groupId || !messageId) return null;
  const currentList = getStoredGroups(currentUserName);
  const groupIndex = currentList.findIndex(g => g.id === groupId);
  if (groupIndex === -1) return null;

  const group = { ...currentList[groupIndex] };
  const currentMessages = Array.isArray(group.messages) ? group.messages : [];
  
  // Remove message from the list
  group.messages = currentMessages.filter(m => m.id !== messageId);

  currentList[groupIndex] = group;
  saveStoredGroups(currentList);
  syncGroupToCloud(group);

  return { updatedGroup: group };
}

export function addMemberToGroup({ groupId, name, role = 'member', currentUserName = 'Redilah' }) {
  if (!name || !name.trim()) return null;
  const currentList = getStoredGroups(currentUserName);
  const groupIndex = currentList.findIndex(g => g.id === groupId);
  if (groupIndex === -1) return null;

  const group = { ...currentList[groupIndex] };
  const newMemberId = `mem_${Date.now()}_${Math.random().toString(36).substr(2, 3)}`;
  const newMember = {
    id: newMemberId,
    name: name.trim(),
    role: role || 'member'
  };

  group.members = [...(group.members || []), newMember];
  currentList[groupIndex] = group;
  saveStoredGroups(currentList);
  syncGroupToCloud(group);
  return { updatedGroup: group, newMember };
}

export function calculateGroupLedger(group, currentMonthKey = null) {
  if (!group || !Array.isArray(group.transactions)) {
    return {
      balance: 0,
      monthIncome: 0,
      monthExpense: 0,
      totalIncome: 0,
      totalExpense: 0,
      totalIn: 0,
      totalOut: 0,
      monthIn: 0,
      monthOut: 0,
      transactions: []
    };
  }

  const activeMonth = currentMonthKey || getCurrentMonthKey();
  let totalIncome = 0;
  let totalExpense = 0;
  let monthIncome = 0;
  let monthExpense = 0;

  group.transactions.forEach(tx => {
    const amt = Number(tx.amount) || 0;
    const isThisMonth = (tx.month === activeMonth) || (tx.timestamp && String(tx.timestamp).startsWith(activeMonth));

    if (tx.type === 'kas_in') {
      totalIncome += amt;
      if (isThisMonth) monthIncome += amt;
    } else if (tx.type === 'expense') {
      totalExpense += amt;
      if (isThisMonth) monthExpense += amt;
    }
  });

  const balance = totalIncome - totalExpense;
  return {
    balance: Number(balance) || 0,
    monthIncome: Number(monthIncome) || 0,
    monthExpense: Number(monthExpense) || 0,
    totalIncome: Number(totalIncome) || 0,
    totalExpense: Number(totalExpense) || 0,
    totalIn: Number(totalIncome) || 0,
    totalOut: Number(totalExpense) || 0,
    monthIn: Number(monthIncome) || 0,
    monthOut: Number(monthExpense) || 0,
    transactions: group.transactions || []
  };
}

export function getMonthPaymentStatus(group, monthKey = null) {
  if (!group || !Array.isArray(group.members)) {
    return { paidMembers: [], unpaidMembers: [], paidCount: 0, totalMembers: 0, percentage: 0 };
  }

  const activeMonth = monthKey || getCurrentMonthKey();
  const monthTracking = (group.monthlyKasTracking && group.monthlyKasTracking[activeMonth]) || {};
  const members = group.members || [];

  const paidMembers = [];
  const unpaidMembers = [];

  members.forEach(member => {
    const status = monthTracking[member.id];
    if (status && status.paid) {
      paidMembers.push({ ...member, paidData: status });
    } else {
      unpaidMembers.push(member);
    }
  });

  const totalMembers = members.length;
  const paidCount = paidMembers.length;
  const percentage = totalMembers > 0 ? Math.round((paidCount / totalMembers) * 100) : 0;

  return {
    paidMembers,
    unpaidMembers,
    paidCount,
    totalMembers,
    percentage
  };
}

export function getCurrentMonthKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function formatMonthLabel(monthKey) {
  if (!monthKey) return '';
  const parts = monthKey.split('-');
  if (parts.length < 2) return monthKey;
  const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  const monthIndex = parseInt(parts[1], 10) - 1;
  const monthName = months[monthIndex] || parts[1];
  return `${monthName} ${parts[0]}`;
}

export function updateGroupInfo({ groupId, name, description, avatar, chatWallpaper, monthlyFee, currentUserName = 'Redilah' }) {
  const currentList = getStoredGroups(currentUserName);
  const groupIndex = currentList.findIndex(g => g.id === groupId);
  if (groupIndex === -1) return null;

  const group = { ...currentList[groupIndex] };
  if (name !== undefined) group.name = name.trim();
  if (description !== undefined) group.description = description.trim();
  if (avatar !== undefined) group.avatar = avatar;
  if (chatWallpaper !== undefined) group.chatWallpaper = chatWallpaper;
  if (monthlyFee !== undefined) group.monthlyFee = Number(monthlyFee) || 0;

  currentList[groupIndex] = group;
  saveStoredGroups(currentList);
  syncGroupToCloud(group);
  return group;
}

export function removeMemberFromGroup({ groupId, memberId, currentUserName = 'Redilah' }) {
  const currentList = getStoredGroups(currentUserName);
  const groupIndex = currentList.findIndex(g => g.id === groupId);
  if (groupIndex === -1) return null;

  const group = { ...currentList[groupIndex] };
  group.members = (group.members || []).filter(m => m.id !== memberId);

  currentList[groupIndex] = group;
  saveStoredGroups(currentList);
  syncGroupToCloud(group);
  return group;
}

export function deleteGroup({ groupId, currentUserName = 'Redilah' }) {
  const currentList = getStoredGroups(currentUserName);
  const updatedList = currentList.filter(g => g.id !== groupId);
  saveStoredGroups(updatedList);
  try {
    const docRef = doc(db, SHARED_GROUPS_COLLECTION, groupId);
    deleteDoc(docRef).catch(() => {});
  } catch {}
  return updatedList;
}

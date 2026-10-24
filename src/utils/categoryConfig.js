import fastFoodSvg from '../assets/fast-food.svg';
import gameSvg from '../assets/3d-movie.svg';
import carSvg from '../assets/car.svg';
import houseSvg from '../assets/house_colored.svg';
import addSvg from '../assets/add.svg';
import diagramSvg from '../assets/diagram.svg';
import akunSvg from '../assets/akun.svg';
import budgetSvg from '../assets/budget.svg';
import barberSvg from '../assets/barber.svg';
import bookSvg from '../assets/book.svg';
import cosmeticsSvg from '../assets/cosmetics.svg';
import dispenserBottleSvg from '../assets/dispenser-bottle.svg';
import shirtShoeSvg from '../assets/shirt-shoe.svg';
import shoppingCartSvg from '../assets/shopping-cart.svg';
import subscriptionSvg from '../assets/subscription.svg';
import salarySvg from '../assets/salary.svg';
import bonusSvg from '../assets/bonus.svg';
import pesawatSvg from '../assets/Pesawat.svg';
import kostSvg from '../assets/Kost.svg';
import coffeeSvg from '../assets/Coffee.svg';
import sepatuSvg from '../assets/Sepatu.svg';
import donasiSvg from '../assets/Donasi.svg';
import topupGameSvg from '../assets/Top up Game.svg';
import bensinSvg from '../assets/Bensin.svg';
import investasiSvg from '../assets/investasi.svg';
import bisnisSvg from '../assets/bisnis.svg';
import affiliateSvg from '../assets/Affliate.svg';
import konserSvg from '../assets/Konser.svg';
import pulsaSvg from '../assets/Pulsa.svg';
import rumahSakitSvg from '../assets/Rumah Sakit.svg';
import obatSakitSvg from '../assets/Obat Sakit.svg';
import jajanAdekSvg from '../assets/Jajan adek.svg';
import partySvg from '../assets/Party.svg';
import buahSvg from '../assets/Buah.svg';
import minumanSvg from '../assets/Minuman.svg';
import wifiSvg from '../assets/wifi.svg';
import freelanceSvg from '../assets/Freelance.svg';
import biayaAdminSvg from '../assets/Biaya admin.svg';
import accessoriesSvg from '../assets/Accesories.svg';
import ticketSvg from '../assets/Ticket.svg';
import tranferSvg from '../assets/tranfer.svg';
import kalenderSvg from '../assets/kalender.svg';
import dompetSvg from '../assets/dompet.svg';
import { safeStorageSet } from './secureStorage';

export {
  fastFoodSvg,
  gameSvg,
  carSvg,
  houseSvg,
  addSvg,
  diagramSvg,
  akunSvg,
  budgetSvg,
  barberSvg,
  bookSvg,
  cosmeticsSvg,
  dispenserBottleSvg,
  shirtShoeSvg,
  shoppingCartSvg,
  subscriptionSvg,
  salarySvg,
  bonusSvg,
  pesawatSvg,
  kostSvg,
  coffeeSvg,
  sepatuSvg,
  donasiSvg,
  topupGameSvg,
  bensinSvg,
  investasiSvg,
  bisnisSvg,
  affiliateSvg,
  konserSvg,
  pulsaSvg,
  rumahSakitSvg,
  obatSakitSvg,
  jajanAdekSvg,
  partySvg,
  buahSvg,
  minumanSvg,
  wifiSvg,
  freelanceSvg,
  biayaAdminSvg,
  accessoriesSvg,
  ticketSvg,
  tranferSvg,
  kalenderSvg,
  dompetSvg,
};

// Categories: NO icon field stored — icons resolved at runtime via ICON_MAP
export const DEFAULT_EXPENSE_CATEGORIES = [
  { id: 'food', name: 'Food', iconClass: 'food-icon' },
  { id: 'bioskop', name: 'Bioskop', iconClass: 'game-icon' },
  { id: 'transport', name: 'Transportasi', iconClass: 'car-icon' },
  { id: 'barber', name: 'Barbershop', iconClass: 'barber-icon' },
  { id: 'skincare', name: 'Skincare', iconClass: 'cosmetics-icon' },
  { id: 'edukasi', name: 'Edukasi', iconClass: 'book-icon' },
  { id: 'galon', name: 'Air Galon', iconClass: 'bottle-icon' },
  { id: 'fashion', name: 'Fashion', iconClass: 'fashion-icon' },
  { id: 'supermarket', name: 'Supermarket', iconClass: 'cart-icon' },
  { id: 'sub', name: 'Subscription', iconClass: 'sub-icon' },
  { id: 'pesawat', name: 'Pesawat', iconClass: 'pesawat-icon' },
  { id: 'tranfer', name: 'Tranfer', iconClass: 'tranfer-icon' },
  { id: 'kost', name: 'Kost', iconClass: 'kost-icon' },
  { id: 'coffee', name: 'Coffee', iconClass: 'coffee-icon' },
  { id: 'gofood', name: 'GoFood', iconClass: 'gofood-icon' },
  { id: 'sepatu', name: 'Sepatu', iconClass: 'sepatu-icon' },
  { id: 'donasi', name: 'Donasi', iconClass: 'donasi-icon' },
  { id: 'topupGame', name: 'Top Up Game', iconClass: 'topup-game-icon' },
  { id: 'bensin', name: 'Bensin', iconClass: 'bensin-icon' },
  { id: 'konser', name: 'Konser', iconClass: 'konser-icon' },
  { id: 'pulsa', name: 'Pulsa', iconClass: 'pulsa-icon' },
  { id: 'rumahSakit', name: 'Rumah Sakit', iconClass: 'rumah-sakit-icon' },
  { id: 'obatSakit', name: 'Obat Sakit', iconClass: 'obat-sakit-icon' },
  { id: 'jajanAdek', name: 'Jajan Adek', iconClass: 'jajan-adek-icon' },
  { id: 'party', name: 'Party', iconClass: 'party-icon' },
  { id: 'buah', name: 'Buah', iconClass: 'buah-icon' },
  { id: 'minuman', name: 'Minuman', iconClass: 'minuman-icon' },
  { id: 'wifi', name: 'WiFi', iconClass: 'wifi-icon' },
  { id: 'biayaAdmin', name: 'Biaya Admin', iconClass: 'biaya-admin-icon' },
  { id: 'accessories', name: 'Accessories', iconClass: 'accessories-icon' },
  { id: 'tiket', name: 'Tiket', iconClass: 'tiket-icon' },
];

export const DEFAULT_INCOME_CATEGORIES = [
  { id: 'gaji', name: 'Gaji', iconClass: 'gaji-icon' },
  { id: 'bonus', name: 'Bonus', iconClass: 'bonus-icon' },
  { id: 'kip', name: 'KIP', iconClass: 'kip-icon' },
  { id: 'investasi', name: 'Investasi', iconClass: 'investasi-icon' },
  { id: 'bisnis', name: 'Bisnis', iconClass: 'bisnis-icon' },
  { id: 'affiliate', name: 'Affiliate', iconClass: 'affiliate-icon' },
  { id: 'freelance', name: 'Freelance', iconClass: 'freelance-icon' },
];

export const DEFAULT_ACTIVE_EXPENSE_CATEGORY_IDS = ['food', 'transport', 'coffee', 'bensin'];
export const DEFAULT_ACTIVE_INCOME_CATEGORY_IDS = ['gaji', 'bonus', 'affiliate'];
export const DEFAULT_ACTIVE_ACCOUNTS = ['Cash', 'GoPay', 'BRImo'];

// Runtime icon lookup — NEVER stored to localStorage, only used during render
export const ICON_MAP = {
  food: fastFoodSvg,
  bioskop: gameSvg,
  transport: carSvg,
  barber: barberSvg,
  skincare: cosmeticsSvg,
  edukasi: bookSvg,
  galon: dispenserBottleSvg,
  fashion: shirtShoeSvg,
  supermarket: shoppingCartSvg,
  sub: subscriptionSvg,
  pesawat: pesawatSvg,
  tranfer: tranferSvg,
  transfer: tranferSvg,
  kost: kostSvg,
  coffee: coffeeSvg,
  gofood: fastFoodSvg,
  sepatu: sepatuSvg,
  donasi: donasiSvg,
  topupGame: topupGameSvg,
  bensin: bensinSvg,
  investasi: investasiSvg,
  bisnis: bisnisSvg,
  affiliate: affiliateSvg,
  konser: konserSvg,
  pulsa: pulsaSvg,
  rumahSakit: rumahSakitSvg,
  obatSakit: obatSakitSvg,
  jajanAdek: jajanAdekSvg,
  party: partySvg,
  buah: buahSvg,
  minuman: minumanSvg,
  wifi: wifiSvg,
  biayaAdmin: biayaAdminSvg,
  accessories: accessoriesSvg,
  tiket: ticketSvg,
  gaji: salarySvg,
  bonus: bonusSvg,
  kip: bookSvg,
  freelance: freelanceSvg,
  tambahSaldo: addSvg,
};

// Resolve icon SVG from category id (runtime only, not from storage)
export const resolveIcon = (catOrTx) => {
  if (!catOrTx) return null;
  const id = catOrTx.categoryId || catOrTx.id || null;
  return id ? (ICON_MAP[id] || null) : null;
};

// Resolve category-bound background card class for consistent block colors
export const resolveCardBgClass = (catOrTx) => {
  if (!catOrTx) return 'cat-card-food';
  const id = catOrTx.categoryId || catOrTx.id;
  if (id) return `cat-card-${id}`;
  if (catOrTx.category) {
    const norm = (catOrTx.category || '').toLowerCase().trim();
    const allCats = [...DEFAULT_EXPENSE_CATEGORIES, ...DEFAULT_INCOME_CATEGORIES];
    const found = allCats.find(c => (c.name || '').toLowerCase() === norm || (c.id || '').toLowerCase() === norm);
    if (found) return `cat-card-${found.id}`;
  }
  if (catOrTx.iconClass) {
    return `cat-card-${catOrTx.iconClass}`;
  }
  return 'cat-card-food';
};

export const CATEGORY_BG_COLORS = {
  food: '#FAE2CB',
  coffee: '#EFE3D5',
  bioskop: '#F2E1EE',
  transport: '#D9E8F1',
  barber: '#F8DECE',
  skincare: '#F9DFEA',
  edukasi: '#DAE4F5',
  galon: '#D6EFE7',
  fashion: '#E8E2F7',
  supermarket: '#FAF2C8',
  sub: '#D6EDE4',
  pesawat: '#D0E6F7',
  tranfer: '#D2ECF2',
  transfer: '#D2ECF2',
  kost: '#F6E3D5',
  gofood: '#FCE2E2',
  sepatu: '#EFE0FA',
  donasi: '#F8DFEA',
  topupGame: '#D9F5E2',
  topupgame: '#D9F5E2',
  bensin: '#F8ECD0',
  konser: '#F7D6E6',
  pulsa: '#DBEAFE',
  rumahSakit: '#FCE4E7',
  rumahsakit: '#FCE4E7',
  obatSakit: '#DEF7E7',
  obatsakit: '#DEF7E7',
  jajanAdek: '#FDECEE',
  jajanadek: '#FDECEE',
  party: '#FEF3C7',
  buah: '#E2F4DC',
  minuman: '#D8F1FE',
  wifi: '#FEF3C7',
  biayaAdmin: '#E8EDF2',
  biayaadmin: '#E8EDF2',
  accessories: '#ECE7F9',
  tiket: '#FCE5DC',
  gaji: '#D1FAE5',
  bonus: '#FEF08A',
  kip: '#DBEAFE',
  freelance: '#D3F6FA',
  investasi: '#DCF3DC',
  bisnis: '#FFF0D4',
  affiliate: '#E8EEFC',
  tambahSaldo: '#D8ECF9',
};

export const resolveIconClass = (catOrTx) => {
  if (!catOrTx) return 'food-icon';
  const id = catOrTx.categoryId || catOrTx.id;
  const allCats = [...DEFAULT_EXPENSE_CATEGORIES, ...DEFAULT_INCOME_CATEGORIES];
  if (id) {
    const found = allCats.find(c => c.id.toLowerCase() === id.toLowerCase());
    if (found && found.iconClass) return found.iconClass;
  }
  if (catOrTx.category || catOrTx.name) {
    const norm = (catOrTx.category || catOrTx.name || '').toLowerCase().trim();
    const found = allCats.find(c => (c.name || '').toLowerCase() === norm || (c.id || '').toLowerCase() === norm);
    if (found && found.iconClass) return found.iconClass;
  }
  if (catOrTx.iconClass) return catOrTx.iconClass;
  return 'food-icon';
};

export const resolveCardBgColor = (catOrTx) => {
  if (!catOrTx) return '#FAE2CB';
  const id = catOrTx.categoryId || catOrTx.id;
  if (id && CATEGORY_BG_COLORS[id]) return CATEGORY_BG_COLORS[id];
  if (catOrTx.category) {
    const norm = (catOrTx.category || '').toLowerCase().trim();
    const allCats = [...DEFAULT_EXPENSE_CATEGORIES, ...DEFAULT_INCOME_CATEGORIES];
    const found = allCats.find(c => (c.name || '').toLowerCase() === norm || (c.id || '').toLowerCase() === norm);
    if (found && CATEGORY_BG_COLORS[found.id]) return CATEGORY_BG_COLORS[found.id];
  }
  return catOrTx.type === 'income' ? 'var(--card-income-bg, #E8F5E9)' : 'var(--card-expense-bg, #FBE9E7)';
};

export const migrateTransactions = (list) => {
  if (!Array.isArray(list)) return list;
  const nameToId = {
    'Food': 'food', 'Bioskop': 'bioskop', 'Transportasi': 'transport',
    'Barbershop': 'barber', 'Skincare': 'skincare', 'Edukasi': 'edukasi',
    'Air Galon': 'galon', 'Fashion': 'fashion', 'Supermarket': 'supermarket',
    'Subscription': 'sub', 'Pesawat': 'pesawat', 'Tranfer': 'tranfer', 'tranfer': 'tranfer', 'Transfer': 'tranfer', 'transfer': 'tranfer', 'Kost': 'kost',
    'Gaji': 'gaji', 'Bonus': 'bonus', 'KIP': 'kip', 'Tambah Saldo': 'tambahSaldo',
    'Bensin': 'bensin', 'Investasi': 'investasi', 'Bisnis': 'bisnis',
    'Affiliate': 'affiliate', 'Konser': 'konser', 'Pulsa': 'pulsa',
    'Rumah Sakit': 'rumahSakit', 'Obat Sakit': 'obatSakit',
    'Jajan Adek': 'jajanAdek', 'Party': 'party', 'Buah': 'buah',
    'Minuman': 'minuman', 'WiFi': 'wifi', 'Wifi': 'wifi', 'WIFI': 'wifi',
    'Biaya Admin': 'biayaAdmin', 'Accessories': 'accessories', 'Aksesoris': 'accessories', 'accesories': 'accessories', 'accessories': 'accessories',
    'Tiket': 'tiket', 'tiket': 'tiket', 'Ticket': 'tiket', 'ticket': 'tiket', 'Karcis': 'tiket', 'karcis': 'tiket',
  };
  let changed = false;
  const migrated = list.map(tx => {
    if (tx.icon !== undefined) {
      const { icon: _icon, ...rest } = tx;
      changed = true;
      return {
        ...rest,
        categoryId: rest.categoryId || nameToId[rest.category] || null,
      };
    }
    if (!tx.categoryId && tx.category) {
      changed = true;
      return { ...tx, categoryId: nameToId[tx.category] || null };
    }
    return tx;
  });
  if (changed) {
    try { safeStorageSet('user_transactions', migrated); } catch { /* ignore */ }
  }
  return migrated;
};

export const migrateCategories = (list) => {
  if (!Array.isArray(list)) return list;
  return list.map(cat => {
    const { icon: _icon, ...rest } = cat;
    return rest;
  });
};

export const INITIAL_TRANSACTIONS = [];

export const isAutoTrackedTx = (tx) => Boolean(
  tx && (
    tx.autoTracked === true ||
    tx.inputMethod === 'notification' ||
    (Boolean(tx.rawProvider) && tx.inputMethod !== 'manual')
  )
);

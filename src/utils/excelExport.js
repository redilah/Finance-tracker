/**
 * Export Transactions to Genuine Excel OpenXML (.xlsx) for Cassiel Finance Tracker
 */

import XLSX from 'xlsx-js-style';
import { Capacitor } from '@capacitor/core';
import { Share } from '@capacitor/share';
import { Filesystem, Directory } from '@capacitor/filesystem';

/**
 * Category background pastel RGB hex mapping
 */
const CATEGORY_HEX_MAP = {
  food: 'FAE2CB',
  makanan: 'FAE2CB',
  coffee: 'F3DBC4',
  kopi: 'F3DBC4',
  bioskop: 'EEDCE9',
  transport: 'D9E8F1',
  transportasi: 'D9E8F1',
  barber: 'F8DECE',
  skincare: 'F7D8E4',
  edukasi: 'DAE4F5',
  galon: 'D6EFE7',
  fashion: 'E6E1F6',
  supermarket: 'F7EFC8',
  sub: 'D7ECE4',
  pesawat: 'D0E6F5',
  kost: 'F4DFD2',
  gofood: 'F8D7D7',
  sepatu: 'EBDEFA',
  donasi: 'F6DCE6',
  topupgame: 'D7F4E1',
  bensin: 'F8DFCA',
  konser: 'F6D0E3',
  pulsa: 'D4E4F8',
  rumahsakit: 'F9D8DC',
  obatsakit: 'DBF2E4',
  jajanadek: 'F7D8D8',
  party: 'F7EAB9',
  buah: 'DCF1DB',
  minuman: 'D1E6F9',
  wifi: 'D8F1EB',
  biayaadmin: 'EBE2F7',
  accessories: 'F5D7DF',
  gaji: 'D5F1DF',
  bonus: 'D8EBF9',
  kip: 'F5DFDE',
  freelance: 'EBE0F7',
  investasi: 'DCF3DC',
  bisnis: 'F8E7D1',
  affiliate: 'F9E5DC',
  tambahsaldo: 'D8ECF9',
};

export function getCategoryXlsxTheme(categoryName = '') {
  const key = (categoryName || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  if (CATEGORY_HEX_MAP[key]) return { bg: CATEGORY_HEX_MAP[key], color: '000000' };
  for (const [k, v] of Object.entries(CATEGORY_HEX_MAP)) {
    if (key.includes(k) || k.includes(key)) {
      return { bg: v, color: '000000' };
    }
  }
  return { bg: 'F1F5F9', color: '000000' };
}

/**
 * Get background and text RGB hex matching account identity (without # for xlsx)
 */
export function getAccountXlsxTheme(accountName = '') {
  const acc = (accountName || '').toLowerCase().trim();
  if (acc.includes('bri')) return { bg: 'DBEAFE', color: '1E40AF' }; // Biru BRI
  if (acc.includes('bca')) return { bg: 'E0E7FF', color: '3730A3' }; // Biru BCA
  if (acc.includes('cash') || acc.includes('tunai')) return { bg: 'DCFCE7', color: '166534' }; // Hijau Cash
  if (acc.includes('gopay')) return { bg: 'CCFBF1', color: '0F766E' }; // Toska GoPay
  if (acc.includes('dana')) return { bg: 'E0F2FE', color: '0369A1' }; // Biru DANA
  if (acc.includes('shopee') || acc.includes('seabank')) return { bg: 'FFEDD5', color: 'C2410C' }; // Oranye Shopee
  if (acc.includes('mandiri') || acc.includes('livin')) return { bg: 'FEF3C7', color: 'B45309' }; // Emas Mandiri
  if (acc.includes('jago')) return { bg: 'FEE2E2', color: '991B1B' }; // Coral Jago
  if (acc.includes('bsi')) return { bg: 'D1FAE5', color: '065F46' }; // Hijau BSI
  if (acc.includes('ovo')) return { bg: 'F3E8FF', color: '6B21A8' }; // Ungu OVO
  if (acc.includes('linkaja')) return { bg: 'FFE4E6', color: 'BE123C' }; // Merah LinkAja
  if (acc.includes('jenius')) return { bg: 'CFFAFE', color: '0E7490' }; // Cyan Jenius
  return { bg: 'F1F5F9', color: '334155' }; // Neutral
}

/**
 * Format currency string (e.g. Rp 1.000.000)
 */
function formatCurrency(amount, currency = 'IDR') {
  const num = Number(amount || 0);
  const formatted = Math.abs(num).toLocaleString('id-ID');
  const prefix = currency === 'IDR' ? 'Rp ' : `${currency} `;
  return (num < 0 ? '-' : '') + prefix + formatted;
}

/**
 * Generate native OpenXML .xlsx Workbook with separate Pengeluaran and Pemasukan columns
 */
export function generateTransactionsWorkbook(transactions = [], currency = 'IDR', profileName = 'Cassiel') {
  const wb = XLSX.utils.book_new();

  let totalExpense = 0;
  let totalIncome = 0;

  const borderThin = {
    top: { style: 'thin', color: { rgb: '64748B' } },
    bottom: { style: 'thin', color: { rgb: '64748B' } },
    left: { style: 'thin', color: { rgb: '64748B' } },
    right: { style: 'thin', color: { rgb: '64748B' } }
  };

  const headerStyle = {
    font: { name: 'Segoe UI', sz: 13, bold: true, color: { rgb: '000000' } },
    fill: { fgColor: { rgb: 'E2E8F0' } },
    alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
    border: {
      top: { style: 'medium', color: { rgb: '1E293B' } },
      bottom: { style: 'medium', color: { rgb: '1E293B' } },
      left: { style: 'thin', color: { rgb: '64748B' } },
      right: { style: 'thin', color: { rgb: '64748B' } }
    }
  };

  const wsData = [];

  // Row 0: Title
  wsData.push([
    { v: 'Laporan Keuangan Cassiel', t: 's', s: { font: { name: 'Segoe UI', sz: 16, bold: true, color: { rgb: '000000' } } } },
    null, null, null, null, null
  ]);

  // Row 1: Subtitle
  wsData.push([
    { v: `Pengguna: ${profileName} • Total Transaksi: ${(transactions || []).length}`, t: 's', s: { font: { name: 'Segoe UI', sz: 11, color: { rgb: '64748B' } } } },
    null, null, null, null, null
  ]);

  // Row 2: Empty Spacer
  wsData.push([null, null, null, null, null, null]);

  // Row 3: Headers
  const headerLabels = ['Tanggal', 'Kategori', 'Akun', 'Pengeluaran', 'Pemasukan', 'Catatan'];
  wsData.push(headerLabels.map(label => ({
    v: label,
    t: 's',
    s: headerStyle
  })));

  // Data Rows
  (transactions || []).forEach(tx => {
    const isIncome = tx.type === 'income';
    const amountVal = Number(tx.amount || 0);

    if (isIncome) {
      totalIncome += amountVal;
    } else {
      totalExpense += amountVal;
    }

    const categoryTheme = getCategoryXlsxTheme(tx.category);
    const accountTheme = getAccountXlsxTheme(tx.account);
    const dateStr = tx.date || '-';
    const categoryStr = tx.category || '-';
    const accountStr = tx.account || '-';
    const noteStr = tx.note || tx.title || tx.description || tx.merchant || '-';
    
    const expenseStr = !isIncome ? formatCurrency(amountVal, currency) : '-';
    const incomeStr = isIncome ? formatCurrency(amountVal, currency) : '-';

    wsData.push([
      // 1. Tanggal
      {
        v: dateStr,
        t: 's',
        s: {
          font: { name: 'Segoe UI', sz: 13, color: { rgb: '000000' } },
          alignment: { horizontal: 'center', vertical: 'center' },
          border: borderThin
        }
      },
      // 2. Kategori (Berwarna Pastel Kategori)
      {
        v: categoryStr,
        t: 's',
        s: {
          font: { name: 'Segoe UI', sz: 13, bold: true, color: { rgb: categoryTheme.color } },
          fill: { fgColor: { rgb: categoryTheme.bg } },
          alignment: { horizontal: 'center', vertical: 'center' },
          border: borderThin
        }
      },
      // 3. Akun (Berwarna Khusus Akun)
      {
        v: accountStr,
        t: 's',
        s: {
          font: { name: 'Segoe UI', sz: 13, bold: true, color: { rgb: accountTheme.color } },
          fill: { fgColor: { rgb: accountTheme.bg } },
          alignment: { horizontal: 'center', vertical: 'center' },
          border: borderThin
        }
      },
      // 4. Pengeluaran
      {
        v: expenseStr,
        t: 's',
        s: {
          font: { name: 'Segoe UI', sz: 13, bold: !isIncome, color: { rgb: '000000' } },
          alignment: { horizontal: !isIncome ? 'right' : 'center', vertical: 'center' },
          border: borderThin
        }
      },
      // 5. Pemasukan
      {
        v: incomeStr,
        t: 's',
        s: {
          font: { name: 'Segoe UI', sz: 13, bold: isIncome, color: { rgb: '000000' } },
          alignment: { horizontal: isIncome ? 'right' : 'center', vertical: 'center' },
          border: borderThin
        }
      },
      // 6. Catatan
      {
        v: noteStr,
        t: 's',
        s: {
          font: { name: 'Segoe UI', sz: 13, color: { rgb: '000000' } },
          alignment: { horizontal: 'left', vertical: 'center' },
          border: borderThin
        }
      }
    ]);
  });

  const netBalance = totalIncome - totalExpense;
  const totalExpenseStr = formatCurrency(totalExpense, currency);
  const totalIncomeStr = formatCurrency(totalIncome, currency);
  const netBalanceStr = formatCurrency(netBalance, currency);

  // Spacer row
  wsData.push([null, null, null, null, null, null]);

  // Total Summary Style
  const totalLabelStyle = {
    font: { name: 'Segoe UI', sz: 13, bold: true, color: { rgb: '000000' } },
    alignment: { horizontal: 'right', vertical: 'center' },
    border: borderThin
  };
  const totalValueStyle = {
    font: { name: 'Segoe UI', sz: 13, bold: true, color: { rgb: '000000' } },
    alignment: { horizontal: 'right', vertical: 'center' },
    border: borderThin
  };

  // Row 1: Total Pengeluaran & Total Pemasukan
  wsData.push([
    { v: 'Total', t: 's', s: totalLabelStyle },
    { v: '', t: 's', s: totalLabelStyle },
    { v: '', t: 's', s: totalLabelStyle },
    { v: totalExpenseStr, t: 's', s: totalValueStyle },
    { v: totalIncomeStr, t: 's', s: totalValueStyle },
    { v: '', t: 's', s: totalLabelStyle }
  ]);

  // Row 2: Sisa Saldo
  wsData.push([
    { v: 'Sisa Saldo (Pemasukan - Pengeluaran)', t: 's', s: totalLabelStyle },
    { v: '', t: 's', s: totalLabelStyle },
    { v: '', t: 's', s: totalLabelStyle },
    { v: '', t: 's', s: totalLabelStyle },
    { v: netBalanceStr, t: 's', s: totalValueStyle },
    { v: '', t: 's', s: totalLabelStyle }
  ]);

  // Create Worksheet from AOA
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Column Widths
  ws['!cols'] = [
    { wch: 18 }, // Tanggal
    { wch: 20 }, // Kategori
    { wch: 18 }, // Akun
    { wch: 24 }, // Pengeluaran
    { wch: 24 }, // Pemasukan
    { wch: 38 }  // Catatan
  ];

  // Worksheet Gridlines View
  ws['!views'] = [{ showGridLines: true }];

  // Merges for Title, Subtitle, and Totals
  const totalStartRow = 4 + (transactions || []).length + 1; // 0-indexed
  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 5 } }, // Title
    { s: { r: 1, c: 0 }, e: { r: 1, c: 5 } }, // Subtitle
    { s: { r: totalStartRow, c: 0 }, e: { r: totalStartRow, c: 2 } }, // Total label spanning cols A..C
    { s: { r: totalStartRow + 1, c: 0 }, e: { r: totalStartRow + 1, c: 3 } } // Sisa Saldo label spanning cols A..D
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Laporan Keuangan');
  return wb;
}

/**
 * Save and trigger Native Share Sheet / Download for Genuine Excel (.xlsx)
 */
export async function exportTransactionsToSpreadsheet({ transactions = [], currency = 'IDR', profileName = 'Cassiel' }) {
  try {
    const wb = generateTransactionsWorkbook(transactions, currency, profileName);
    const dateStamp = new Date().toISOString().slice(0, 10);
    const fileName = `Laporan_Keuangan_Cassiel_${dateStamp}.xlsx`;

    if (Capacitor.isNativePlatform()) {
      // 1. Android & iOS native export via Base64 & Filesystem & Share Sheet
      const base64Data = XLSX.write(wb, { bookType: 'xlsx', type: 'base64' });

      const result = await Filesystem.writeFile({
        path: fileName,
        data: base64Data,
        directory: Directory.Cache
      });

      let shareUri = result.uri;
      if (!shareUri.startsWith('file://')) {
        shareUri = 'file://' + shareUri;
      }

      await Share.share({
        title: 'Ekspor Laporan Keuangan Cassiel',
        dialogTitle: 'Simpan / Bagikan Laporan Keuangan (Excel)',
        files: [shareUri]
      });

      return { success: true, fileName };
    } else {
      // 2. Web Browser Download fallback
      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      return { success: true, fileName };
    }
  } catch (err) {
    console.error('Failed to export spreadsheet:', err);
    return { success: false, error: err?.message || 'Gagal mengekspor berkas spreadsheet' };
  }
}


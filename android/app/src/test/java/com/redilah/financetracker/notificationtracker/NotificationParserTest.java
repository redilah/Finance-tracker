package com.redilah.financetracker.notificationtracker;

import org.junit.Test;

import java.text.DecimalFormat;
import java.text.DecimalFormatSymbols;
import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import static org.junit.Assert.*;

public class NotificationParserTest {

    private boolean isPhoneNumberOrIdentifier(String rawNumStr, String rawBefore, String fullText) {
        if (rawNumStr == null || rawNumStr.isEmpty()) return false;
        String digits = rawNumStr.replaceAll("[^0-9]", "");
        String cb = rawBefore != null ? rawBefore.toLowerCase().trim() : "";

        if (digits.matches("^628\\d{7,12}$")) return true;
        if (digits.matches("^08\\d{8,11}$")) return true;
        if (digits.matches("^8\\d{8,11}$") && (cb.endsWith("ke") || cb.endsWith("nomor") || cb.endsWith("no") || cb.endsWith("hp") || cb.endsWith("pulsa"))) return true;

        if (!cb.contains("rp") && !cb.contains("idr")) {
            if (digits.matches("^(?:1500\\d{3}|140\\d{2})$")) return true;
        }

        if (cb.matches(".*(?:ke|tujuan|nomor|no\\.?|hp|handphone|telepon|telp|msisdn|serial|sn|id|ref|order|trx|call\\s*center|contact\\s*center|hubungi|bantuan)\\s*[:#-]?\\s*$")) {
            if (!cb.matches(".*(?:sebesar|sejumlah|nominal|total|rp|idr)\\s*$")) {
                if (digits.length() >= 5) return true;
            }
        }

        if (digits.length() >= 10 && !cb.contains("rp") && !cb.contains("idr")) {
            return true;
        }
        if (digits.length() >= 12 && !cb.contains("rp") && !cb.contains("idr")) {
            return true;
        }

        return false;
    }

    private String extractFormattedAmount(String fullText) {
        try {
            Pattern pattern = Pattern.compile("(?:rp\\.?|idr)\\s*([0-9]+(?:[\\.,][0-9]+)*)", Pattern.CASE_INSENSITIVE);
            Matcher matcher = pattern.matcher(fullText);

            long candidateAmount = -1;

            while (matcher.find()) {
                int matchIndex = matcher.start();
                String rawBefore = fullText.substring(Math.max(0, matchIndex - 40), matchIndex).toLowerCase();

                boolean isBalance = (rawBefore.contains("saldo") || rawBefore.contains("sisa") || rawBefore.contains("balance") || rawBefore.contains("limit"))
                        && !rawBefore.contains("bertambah") && !rawBefore.contains("ditambahkan") && !rawBefore.contains("masuk");

                String numStr = matcher.group(1).trim();
                if (isPhoneNumberOrIdentifier(numStr, rawBefore, fullText)) {
                    continue;
                }

                String cleanedNum = numStr.replaceAll("[,.]\\d{1,2}$", "");
                String rawNum = cleanedNum.replaceAll("[^0-9]", "");
                if (!rawNum.isEmpty()) {
                    long amount = Long.parseLong(rawNum);
                    if (amount > 0 && amount < 10000000000L) {
                        if (!isBalance) {
                            candidateAmount = amount;
                            break;
                        } else if (candidateAmount == -1) {
                            candidateAmount = amount;
                        }
                    }
                }
            }

            if (candidateAmount <= 0) {
                String textWithoutDates = fullText
                        .replaceAll("\\b\\d{1,2}[/\\-\\.]\\d{1,2}[/\\-\\.]\\d{2,4}\\b", " ")
                        .replaceAll("\\b\\d{4}[/\\-\\.]\\d{1,2}[/\\-\\.]\\d{1,2}\\b", " ")
                        .replaceAll("\\b\\d{1,2}:\\d{2}(?::\\d{2})?\\b", " ")
                        .replaceAll("\\b20[2-3]\\d\\b", " ");

                Pattern rawNumPattern = Pattern.compile("\\b([0-9]{1,3}(?:[\\.,][0-9]{3})+(?:[\\.,][0-9]{1,2})?|[0-9]{4,}(?:[\\.,][0-9]{1,2})?)\\b");
                Matcher rawMatcher = rawNumPattern.matcher(textWithoutDates);
                while (rawMatcher.find()) {
                    int matchIndex = rawMatcher.start();
                    String rawBefore = textWithoutDates.substring(Math.max(0, matchIndex - 40), matchIndex).toLowerCase();
                    boolean isBalance = rawBefore.contains("saldo") || rawBefore.contains("sisa") || rawBefore.contains("balance");
                    if (!isBalance) {
                        String numStr = rawMatcher.group(1).trim();
                        if (isPhoneNumberOrIdentifier(numStr, rawBefore, textWithoutDates)) {
                            continue;
                        }
                        String cleanedNum = numStr.replaceAll("[,.]\\d{1,2}$", "");
                        String digits = cleanedNum.replaceAll("[^0-9]", "");
                        if (!digits.isEmpty()) {
                            long amt = Long.parseLong(digits);
                            if (amt >= 1000 && amt < 1000000000L) {
                                candidateAmount = amt;
                                break;
                            }
                        }
                    }
                }
            }

            if (candidateAmount > 0) {
                DecimalFormatSymbols symbols = new DecimalFormatSymbols(new Locale("id", "ID"));
                symbols.setGroupingSeparator('.');
                DecimalFormat df = new DecimalFormat("#,###", symbols);
                return "Rp " + df.format(candidateAmount);
            }
        } catch (Throwable ignored) {}
        return null;
    }

    @Test
    public void testBriTransferExtraction() {
        String notif = "20/09/2026 12:42:40 - Transfer dari XXXXXXXXXX9503 dengan nomor rekening tujuan XXXXXX6251 sebesar Rp5.600.000,00 BERHASIL. Info lebih lanjut hubungi Call Center BRI 1500017";
        String extracted = extractFormattedAmount(notif);
        assertEquals("Rp 5.600.000", extracted);
    }

    @Test
    public void testBriDebitWithBalance() {
        String notif = "INFO BRI: Nasabah Yth. Debet sebesar Rp25.000 pada 27/08 14:30. Saldo akhir Rp1.250.000";
        String extracted = extractFormattedAmount(notif);
        assertEquals("Rp 25.000", extracted);
    }

    @Test
    public void testFailedGoPayPaymentIsRejected() {
        String notif = "Pembayaran gagal Gak bisa bayar Rp85.470 ke Google Play pake GoPay karena saldonya kurang. Klik buat top up.";
        assertTrue(CassielNotificationListenerService.isFailedOrCancelledNotification(notif));
    }

    @Test
    public void testFailedTransferIsRejected() {
        String notif = "Transfer Rp500.000 ke Budi gagal diproses karena saldo tidak mencukupi.";
        assertTrue(CassielNotificationListenerService.isFailedOrCancelledNotification(notif));
    }
}

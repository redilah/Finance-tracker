package com.redilah.financetracker.assistant;

import java.text.DecimalFormat;
import java.text.DecimalFormatSymbols;
import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Pure Java NLP Parser for Indonesian speech inputs.
 * Extracts amount, account, category, and type without relying on Android-specific stubs.
 */
public class AssistantVoiceParser {

    public static class Result {
        public boolean isValid = false;
        public String type = "expense"; // "expense" | "income"
        public long amount = 0L;
        public String formattedAmount = "Rp 0";
        public String category = "Food";
        public String categoryId = "food";
        public String account = "Cash";
        public String note = "";

        public String toJsonString() {
            StringBuilder sb = new StringBuilder();
            sb.append("{");
            sb.append("\"isValid\":").append(isValid).append(",");
            sb.append("\"type\":\"").append(escape(type)).append("\",");
            sb.append("\"amount\":").append(amount).append(",");
            sb.append("\"formattedAmount\":\"").append(escape(formattedAmount)).append("\",");
            sb.append("\"category\":\"").append(escape(category)).append("\",");
            sb.append("\"categoryId\":\"").append(escape(categoryId)).append("\",");
            sb.append("\"account\":\"").append(escape(account)).append("\",");
            sb.append("\"note\":\"").append(escape(note)).append("\"");
            sb.append("}");
            return sb.toString();
        }

        private String escape(String s) {
            if (s == null) return "";
            return s.replace("\\", "\\\\").replace("\"", "\\\"").replace("\n", "\\n").replace("\r", "\\r");
        }
    }

    public static Result parse(String rawText) {
        Result result = new Result();
        if (rawText == null || rawText.trim().isEmpty()) {
            return result;
        }

        String input = rawText.trim();
        String lower = input.toLowerCase(Locale.ROOT);
        // 1. Determine Transaction Type
        if (lower.contains("gaji") || lower.contains("masuk") || lower.contains("diterima") ||
            lower.contains("bonus") || lower.contains("income") || lower.contains("pemasukan") ||
            lower.contains("dapat uang") || lower.contains("terima")) {
            result.type = "income";
        } else {
            result.type = "expense";
        }

        // 2. Extract Amount
        long extractedAmount = parseAmount(lower);
        if (extractedAmount > 0) {
            result.amount = extractedAmount;
            result.isValid = true;
            result.formattedAmount = formatCurrency(extractedAmount);
        }

        // 3. Extract Account
        result.account = parseAccount(lower);

        // 4. Extract Category
        parseCategory(lower, result);

        // 5. Clean Note (strip amount, account, prepositions)
        String cleanedNote = cleanNote(input);
        if (cleanedNote.isEmpty()) {
            result.note = result.category;
        } else {
            result.note = cleanedNote;
        }

        return result;
    }

    public static String cleanNote(String rawText) {
        if (rawText == null || rawText.trim().isEmpty()) {
            return "";
        }

        String cleaned = rawText.trim();

        // Remove slang number words
        cleaned = cleaned.replaceAll("(?i)\\b(ceban|goceng|seceng|noceng|noban|goban|cepek|gopek)\\b", " ");

        // Remove amount patterns (juta, jt, ribu, rb, k, rp, raw numbers)
        cleaned = cleaned.replaceAll("(?i)\\b\\d+(?:[.,]\\d+)?\\s*(?:juta|jt|million|m)\\b", " ");
        cleaned = cleaned.replaceAll("(?i)\\b\\d+(?:[.,]\\d+)?\\s*(?:ribu|rb|k)\\b", " ");
        cleaned = cleaned.replaceAll("(?i)(?:rp\\.?|rupiah)?\\s*\\b\\d{1,3}(?:\\.\\d{3})+\\b", " ");
        cleaned = cleaned.replaceAll("(?i)(?:rp\\.?|rupiah)?\\s*\\b\\d+\\b", " ");
        cleaned = cleaned.replaceAll("(?i)\\b(rp|rupiah)\\b", " ");

        // Remove bank and account keywords
        cleaned = cleaned.replaceAll("(?i)\\b(brimo|bri|bca|klikbca|livin'\\s*by\\s*mandiri|livin|mandiri|wondr\\s*by\\s*bni|wondr|bni|seabank|sea\\s*bank|bsi\\s*mobile|bsi|jago|gopay|go-pay|ovo|dana|shopeepay|shopee\\s*pay|spay|linkaja|link\\s*aja|cash|tunai|qris)\\b", " ");

        // Remove preposition & connector words
        cleaned = cleaned.replaceAll("(?i)\\b(pakai|pake|via|lewat|menggunakan|dengan|sebesar|sebanyak|senilai|ke\\s*akun|dari\\s*akun)\\b", " ");
        cleaned = cleaned.replaceAll("(?i)\\b(masuk\\s*ke|masuk|diterima\\s*di|diterima)\\b", " ");

        // Remove leftover punctuation and extra whitespace
        cleaned = cleaned.replaceAll("[,;\\-_/\\|]", " ");
        cleaned = cleaned.replaceAll("\\s+", " ").trim();

        if (cleaned.isEmpty()) {
            return "";
        }

        return Character.toUpperCase(cleaned.charAt(0)) + (cleaned.length() > 1 ? cleaned.substring(1) : "");
    }

    private static long parseAmount(String lower) {
        // Slang numbers (Hokkien / Indonesian slang)
        if (lower.contains("ceban")) return 10000L;
        if (lower.contains("goceng")) return 5000L;
        if (lower.contains("seceng")) return 1000L;
        if (lower.contains("noceng")) return 2000L;
        if (lower.contains("noban")) return 20000L;
        if (lower.contains("goban")) return 50000L;
        if (lower.contains("cepek")) return 100L;
        if (lower.contains("gopek")) return 500L;

        // Pattern 1: Decimal or integer with millions (e.g. 5 juta, 1.5jt)
        Pattern jtPattern = Pattern.compile("(\\d+(?:[.,]\\d+)?)\\s*(?:juta|jt|million|m)\\b");
        Matcher jtMatcher = jtPattern.matcher(lower);
        if (jtMatcher.find()) {
            try {
                double val = Double.parseDouble(jtMatcher.group(1).replace(',', '.'));
                return Math.round(val * 1_000_000);
            } catch (Exception ignored) {}
        }

        // Pattern 2: Decimal or integer with thousands (e.g. 20 ribu, 50rb, 12.5 rb, 25k)
        Pattern rbPattern = Pattern.compile("(\\d+(?:[.,]\\d+)?)\\s*(?:ribu|rb|k)\\b");
        Matcher rbMatcher = rbPattern.matcher(lower);
        if (rbMatcher.find()) {
            try {
                double val = Double.parseDouble(rbMatcher.group(1).replace(',', '.'));
                return Math.round(val * 1_000);
            } catch (Exception ignored) {}
        }

        // Pattern 3: Standard currency format (e.g. Rp 25.000, Rp25000, 25000)
        Pattern rawPattern = Pattern.compile("(?:rp|rupiah)?\\s*(\\d{1,3}(?:\\.\\d{3})+|\\d+)");
        Matcher rawMatcher = rawPattern.matcher(lower);
        long candidate = 0L;
        while (rawMatcher.find()) {
            try {
                String clean = rawMatcher.group(1).replace(".", "").replace(",", "");
                long val = Long.parseLong(clean);
                if (val > candidate) {
                    candidate = val;
                }
            } catch (Exception ignored) {}
        }

        return candidate;
    }

    private static String parseAccount(String lower) {
        if (lower.contains("bri") || lower.contains("brimo")) return "BRImo";
        if (lower.contains("bca") || lower.contains("klikbca")) return "BCA";
        if (lower.contains("mandiri") || lower.contains("livin")) return "Livin' by Mandiri";
        if (lower.contains("bni") || lower.contains("wondr")) return "Wondr by BNI";
        if (lower.contains("jago")) return "Jago";
        if (lower.contains("bsi")) return "BSI Mobile";
        if (lower.contains("seabank") || lower.contains("sea bank")) return "SeaBank";
        if (lower.contains("gopay") || lower.contains("go-pay") || lower.contains("gojek")) return "GoPay";
        if (lower.contains("ovo")) return "OVO";
        if (lower.contains("dana")) return "DANA";
        if (lower.contains("shopeepay") || lower.contains("shopee pay") || lower.contains("spay")) return "ShopeePay";
        if (lower.contains("linkaja") || lower.contains("link aja")) return "LinkAja";
        if (lower.contains("tunai") || lower.contains("cash")) return "Cash";

        return "Cash";
    }

    private static void parseCategory(String lower, Result result) {
        if ("income".equals(result.type)) {
            if (lower.contains("gaji")) {
                result.category = "Gaji";
                result.categoryId = "gaji";
            } else if (lower.contains("bonus")) {
                result.category = "Bonus";
                result.categoryId = "bonus";
            } else if (lower.contains("investasi") || lower.contains("dividen")) {
                result.category = "Investasi";
                result.categoryId = "investasi";
            } else {
                result.category = "Pemasukan";
                result.categoryId = "pemasukan";
            }
            return;
        }

        // Expense categories
        if (lower.contains("kopi") || lower.contains("starbucks") || lower.contains("coffee") || lower.contains("kafe") || lower.contains("cafe")) {
            result.category = "Coffee";
            result.categoryId = "coffee";
        } else if (lower.contains("bensin") || lower.contains("pertamax") || lower.contains("pertalite") || lower.contains("solar") || lower.contains("spbu")) {
            result.category = "Bensin";
            result.categoryId = "bensin";
        } else if (lower.contains("indomaret") || lower.contains("alfamart") || lower.contains("supermarket") || lower.contains("belanja")) {
            result.category = "Supermarket";
            result.categoryId = "supermarket";
        } else if (lower.contains("mangga") || lower.contains("makan") || lower.contains("food") || lower.contains("nasi") || lower.contains("bakso") || lower.contains("ayam") || lower.contains("warung")) {
            result.category = "Food";
            result.categoryId = "food";
        } else if (lower.contains("ojek") || lower.contains("grab") || lower.contains("gojek") || lower.contains("transport") || lower.contains("kereta") || lower.contains("busway")) {
            result.category = "Transport";
            result.categoryId = "transport";
        } else if (lower.contains("listrik") || lower.contains("pln") || lower.contains("air") || lower.contains("pdam") || lower.contains("wifi") || lower.contains("pulsa") || lower.contains("tagihan")) {
            result.category = "Tagihan";
            result.categoryId = "tagihan";
        } else {
            result.category = "Food";
            result.categoryId = "food";
        }
    }

    private static String formatCurrency(long amount) {
        DecimalFormatSymbols symbols = new DecimalFormatSymbols(Locale.GERMAN); // uses dots for thousands
        DecimalFormat df = new DecimalFormat("#,###", symbols);
        return "Rp " + df.format(amount);
    }
}

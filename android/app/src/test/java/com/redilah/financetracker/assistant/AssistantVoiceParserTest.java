package com.redilah.financetracker.assistant;

import org.junit.Test;

import static org.junit.Assert.*;

/**
 * Pure Java Unit Test for AssistantVoiceParser
 * Verifies Indonesian speech text extraction for amounts, accounts, categories, and types.
 */
public class AssistantVoiceParserTest {

    @Test
    public void testStandardExpenseWithAccount() {
        String input = "Beli mangga lima biji 20 ribu pakai BRI";
        AssistantVoiceParser.Result res = AssistantVoiceParser.parse(input);

        assertTrue("Should be valid transaction", res.isValid);
        assertEquals("expense", res.type);
        assertEquals(20000L, res.amount);
        assertEquals("Rp 20.000", res.formattedAmount);
        assertEquals("Food", res.category);
        assertEquals("BRImo", res.account);
    }

    @Test
    public void testIncomeWithBank() {
        String input = "Gaji bulan ini 5 juta masuk BCA";
        AssistantVoiceParser.Result res = AssistantVoiceParser.parse(input);

        assertTrue("Should be valid transaction", res.isValid);
        assertEquals("income", res.type);
        assertEquals(5000000L, res.amount);
        assertEquals("Rp 5.000.000", res.formattedAmount);
        assertEquals("Gaji", res.category);
        assertEquals("BCA", res.account);
    }

    @Test
    public void testSlangNumberAndEWallet() {
        String input = "Kopi starbucks 50rb lewat GoPay";
        AssistantVoiceParser.Result res = AssistantVoiceParser.parse(input);

        assertTrue("Should be valid transaction", res.isValid);
        assertEquals("expense", res.type);
        assertEquals(50000L, res.amount);
        assertEquals("Coffee", res.category);
        assertEquals("GoPay", res.account);
    }

    @Test
    public void testDecimalSuffixNumber() {
        String input = "Belanja indomaret 12.5 rb tunai";
        AssistantVoiceParser.Result res = AssistantVoiceParser.parse(input);

        assertTrue("Should be valid transaction", res.isValid);
        assertEquals(12500L, res.amount);
        assertEquals("Supermarket", res.category);
        assertEquals("Cash", res.account);
    }

    @Test
    public void testCebanSlang() {
        String input = "Beli bensin ceban via dana";
        AssistantVoiceParser.Result res = AssistantVoiceParser.parse(input);

        assertTrue("Should be valid transaction", res.isValid);
        assertEquals(10000L, res.amount);
        assertEquals("Bensin", res.category);
        assertEquals("DANA", res.account);
    }

    @Test
    public void testJsonSerialization() {
        String input = "Beli kopi 25rb pakai GoPay";
        AssistantVoiceParser.Result res = AssistantVoiceParser.parse(input);
        String json = res.toJsonString();

        assertTrue(json.contains("\"isValid\":true"));
        assertTrue(json.contains("\"amount\":25000"));
        assertTrue(json.contains("\"account\":\"GoPay\""));
        assertTrue(json.contains("\"category\":\"Coffee\""));
    }
}

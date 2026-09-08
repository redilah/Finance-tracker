package com.redilah.financetracker.assistant;

import android.service.voice.VoiceInteractionService;
import android.util.Log;

/**
 * Cassiel Digital Assistant — VoiceInteractionService
 *
 * Mendaftarkan Cassiel sebagai pilihan resmi Digital Assistant App
 * di Android Settings → Default Apps → Assist & Voice Input.
 */
public class CassielVoiceInteractionService extends VoiceInteractionService {

    private static final String TAG = "CassielVoiceService";

    @Override
    public void onReady() {
        super.onReady();
        Log.d(TAG, "CassielVoiceInteractionService is ready and active");
    }

    @Override
    public void onShutdown() {
        super.onShutdown();
        Log.d(TAG, "CassielVoiceInteractionService is shutting down");
    }
}

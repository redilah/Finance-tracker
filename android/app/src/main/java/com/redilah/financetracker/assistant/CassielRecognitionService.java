package com.redilah.financetracker.assistant;

import android.content.Intent;
import android.speech.RecognitionService;
import android.util.Log;

/**
 * Cassiel Recognition Service
 *
 * Diperlukan oleh Android OS (VoiceInteractionManagerService) agar aplikasi
 * dikenali sebagai Full Digital Assistant & Voice Input Service yang valid.
 */
public class CassielRecognitionService extends RecognitionService {

    private static final String TAG = "CassielRecService";

    @Override
    protected void onStartListening(Intent recognizerIntent, Callback listener) {
        Log.d(TAG, "onStartListening called");
    }

    @Override
    protected void onStopListening(Callback listener) {
        Log.d(TAG, "onStopListening called");
    }

    @Override
    protected void onCancel(Callback listener) {
        Log.d(TAG, "onCancel called");
    }
}

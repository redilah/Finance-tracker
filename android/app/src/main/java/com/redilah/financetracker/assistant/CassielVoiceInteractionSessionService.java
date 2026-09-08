package com.redilah.financetracker.assistant;

import android.os.Bundle;
import android.service.voice.VoiceInteractionSession;
import android.service.voice.VoiceInteractionSessionService;

/**
 * Cassiel Digital Assistant — VoiceInteractionSessionService
 *
 * Dipanggil oleh Android saat user memicu gesture Assistant (long-press Power / swipe corner).
 * Membuat instance CassielVoiceInteractionSession yang menangani interaksi.
 */
public class CassielVoiceInteractionSessionService extends VoiceInteractionSessionService {

    @Override
    public VoiceInteractionSession onNewSession(Bundle args) {
        return new CassielVoiceInteractionSession(this);
    }
}

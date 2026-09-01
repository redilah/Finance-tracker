import React, { useEffect, useState } from 'react';
import { formatMoney } from '../utils/currency';
import { speakIndonesian, stopIndonesianSpeech } from '../utils/voiceSpeech';

export default function VoiceQueryResultModal({
  isOpen,
  onClose,
  queryData,
  appCurrency = 'IDR'
}) {
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    if (!isOpen || !queryData) {
      stopIndonesianSpeech();
      setIsSpeaking(false);
      return;
    }

    // Text-to-speech audio pronunciation (Natural HD Indonesian)
    if (queryData.ttsMessage) {
      const timer = setTimeout(() => {
        speakIndonesian(queryData.ttsMessage, {
          onStart: () => setIsSpeaking(true),
          onEnd: () => setIsSpeaking(false),
          onError: () => setIsSpeaking(false)
        });
      }, 250);

      return () => {
        clearTimeout(timer);
        stopIndonesianSpeech();
      };
    }

    return () => {
      stopIndonesianSpeech();
    };
  }, [isOpen, queryData]);

  const toggleSpeech = () => {
    if (!queryData?.ttsMessage) return;
    if (isSpeaking) {
      stopIndonesianSpeech();
      setIsSpeaking(false);
    } else {
      speakIndonesian(queryData.ttsMessage, {
        onStart: () => setIsSpeaking(true),
        onEnd: () => setIsSpeaking(false),
        onError: () => setIsSpeaking(false)
      });
    }
  };

  if (!isOpen || !queryData) return null;

  const {
    title,
    subtitle,
    primaryAmount,
    primaryLabel,
    badge,
    details = [],
    rawSpokenText,
    icon = '✨'
  } = queryData;

  return (
    <div className="voice-query-modal-overlay" onClick={onClose}>
      <div 
        className="voice-query-modal-card"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="voice-query-header">
          <div className="voice-query-title-wrapper">
            <span className="voice-query-icon-badge">{icon}</span>
            <div className="voice-query-title-text">
              <h3 className="voice-query-title">{title || 'Tanya AI Finansial'}</h3>
              <p className="voice-query-subtitle">{subtitle || 'Ringkasan Keuangan Anda'}</p>
            </div>
          </div>
          <button 
            type="button" 
            className="voice-query-close-btn"
            onClick={onClose}
            aria-label="Tutup"
          >
            ✕
          </button>
        </div>

        {/* User Spoken Prompt Bubble */}
        {rawSpokenText && (
          <div className="voice-query-prompt-pill">
            <span className="voice-query-mic-dot"></span>
            <span className="voice-query-prompt-quote">"{rawSpokenText}"</span>
          </div>
        )}

        {/* Main Highlight Card */}
        <div className="voice-query-highlight-card">
          <div className="voice-query-amount-meta">
            <span className="voice-query-amount-label">{primaryLabel}</span>
            {badge && (
              <span className={`voice-query-badge badge-${badge.type || 'neutral'}`}>
                {badge.text}
              </span>
            )}
          </div>
          <div className="voice-query-primary-amount">
            {typeof primaryAmount === 'number' ? formatMoney(primaryAmount, appCurrency) : primaryAmount}
          </div>
        </div>

        {/* Breakdown & Detail Metrics List */}
        {details && details.length > 0 && (
          <div className="voice-query-details-list">
            {details.map((item, idx) => (
              <div key={idx} className="voice-query-detail-row">
                <span className="voice-query-detail-label">
                  {item.icon && <span className="voice-query-detail-icon">{item.icon}</span>}
                  {item.label}
                </span>
                <span className={`voice-query-detail-val ${item.highlight ? 'text-highlight' : ''}`}>
                  {typeof item.value === 'number' ? formatMoney(item.value, appCurrency) : item.value}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Footer Actions (Speech Button & Close Button) */}
        <div className="voice-query-footer">
          {typeof window !== 'undefined' && window.speechSynthesis && (
            <button
              type="button"
              className={`voice-query-tts-btn ${isSpeaking ? 'active-speaking' : ''}`}
              onClick={toggleSpeech}
              title={isSpeaking ? 'Hentikan Suara' : 'Dengarkan Jawaban'}
            >
              {isSpeaking ? (
                <>
                  <span className="voice-tts-wave-bar bar1"></span>
                  <span className="voice-tts-wave-bar bar2"></span>
                  <span className="voice-tts-wave-bar bar3"></span>
                  <span className="voice-tts-label">Membaca...</span>
                </>
              ) : (
                <>
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                    <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
                  </svg>
                  <span className="voice-tts-label">Dengarkan</span>
                </>
              )}
            </button>
          )}

          <button
            type="button"
            className="voice-query-done-btn"
            onClick={onClose}
          >
            Selesai
          </button>
        </div>
      </div>
    </div>
  );
}

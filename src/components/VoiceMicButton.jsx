import React, { useState, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { SpeechRecognition } from '@capacitor-community/speech-recognition';
import { parseVoiceTransaction } from '../utils/voiceParser';

export default function VoiceMicButton({ 
  expenseCategories, 
  incomeCategories, 
  accountsList,
  setTransType,
  setAmountVal,
  setSelectedCategory,
  setAccount,
  setNote,
  handleSaveVoiceTransaction
}) {
  const [status, setStatus] = useState('idle'); // 'idle' | 'listening' | 'processing' | 'success' | 'error'
  const webRecognitionRef = useRef(null);
  const silenceTimerRef = useRef(null);
  const accumulatedTranscriptRef = useRef('');
  const isProcessingRef = useRef(false); // Flag anti duplikasi / double trigger

  // Hentikan rekaman dan batalkan / proses
  const handleCancelOrStop = () => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }

    if (Capacitor.isNativePlatform()) {
      try {
        SpeechRecognition.stop();
      } catch (e) {
        console.warn('Native speech stop error:', e);
      }
    } else if (webRecognitionRef.current) {
      try {
        webRecognitionRef.current.abort();
      } catch {
        // Ignore speech recognition abort error
      }
      webRecognitionRef.current = null;
    }

    const fullText = accumulatedTranscriptRef.current.trim();
    accumulatedTranscriptRef.current = '';

    // Jika user sedang merekam dan sudah ada teks ucapan, langsung proses tanpa jeda
    if (status === 'listening' && fullText && !isProcessingRef.current) {
      processText(fullText);
    } else {
      // Jika kosong atau saat sedang memproses/error, reset ke idle
      isProcessingRef.current = false;
      setStatus('idle');
    }
  };

  const stopListeningAndProcess = () => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }

    const fullText = accumulatedTranscriptRef.current.trim();
    accumulatedTranscriptRef.current = '';

    if (webRecognitionRef.current) {
      try {
        webRecognitionRef.current.stop();
      } catch (e) {
        console.warn('Web speech stop error:', e);
      }
      webRecognitionRef.current = null;
    }

    if (fullText && !isProcessingRef.current) {
      isProcessingRef.current = true;
      processText(fullText);
    } else if (!isProcessingRef.current) {
      setStatus('idle');
    }
  };

  const handleMicClick = async () => {
    if (status === 'success') {
      return;
    }

    // Toggle stop/cancel jika user klik saat sedang mendengarkan, memproses, atau error
    if (status === 'listening' || status === 'processing' || status === 'error') {
      handleCancelOrStop();
      return;
    }

    // START LISTENING
    accumulatedTranscriptRef.current = '';
    isProcessingRef.current = false;

    if (Capacitor.isNativePlatform()) {
      // 1. Native Android
      try {
        const isAvail = await SpeechRecognition.available().catch(() => ({ available: false }));
        if (isAvail && isAvail.available === false) {
          alert('Pengenalan suara tidak tersedia di perangkat ini. Pastikan Google Speech Services aktif.');
          setStatus('error');
          setTimeout(() => setStatus('idle'), 2000);
          return;
        }

        const perm = await SpeechRecognition.checkPermissions().catch(() => ({ speechRecognition: 'prompt' }));
        if (perm.speechRecognition !== 'granted') {
          const request = await SpeechRecognition.requestPermissions().catch(() => ({ speechRecognition: 'denied' }));
          if (request.speechRecognition !== 'granted') {
            alert('Izin mikrofon dibutuhkan untuk fitur input suara.');
            setStatus('error');
            setTimeout(() => setStatus('idle'), 2000);
            return;
          }
        }

        setStatus('listening');
        const { matches } = await SpeechRecognition.start({
          language: 'id-ID',
          maxResults: 2,
          partialResults: false,
          popup: false
        });

        if (matches && matches.length > 0 && !isProcessingRef.current) {
          processText(matches[0]);
        } else {
          setStatus('idle');
        }
      } catch (e) {
        console.warn('Native speech error / user cancelled:', e);
        setStatus('idle');
      }
    } else {
      // 2. Web / Laptop Browser (Continuous listening with 1.2s silence debounce)
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          stream.getTracks().forEach(track => track.stop());
        }

        const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognitionAPI) {
          alert('Browser Anda tidak mendukung Web Speech Recognition. Disarankan menggunakan Google Chrome atau Edge.');
          setStatus('error');
          setTimeout(() => setStatus('idle'), 2000);
          return;
        }

        const recognition = new SpeechRecognitionAPI();
        recognition.lang = 'id-ID';
        recognition.continuous = true;
        recognition.interimResults = true;

        recognition.onstart = () => {
          setStatus('listening');
          isProcessingRef.current = false;
        };

        recognition.onresult = (event) => {
          if (isProcessingRef.current) return;

          let currentTranscript = '';
          for (let i = 0; i < event.results.length; i++) {
            currentTranscript += event.results[i][0].transcript + ' ';
          }
          accumulatedTranscriptRef.current = currentTranscript;

          // Reset silence timer setiap kali ada kata baru (tunggu 2 detik jeda hening sebelum submit)
          if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current);
          }
          silenceTimerRef.current = setTimeout(() => {
            stopListeningAndProcess();
          }, 2000);
        };

        recognition.onerror = (event) => {
          if (event.error !== 'no-speech') {
            console.warn('Web Speech Error:', event.error);
            setStatus('error');
            setTimeout(() => setStatus('idle'), 1500);
          }
        };

        recognition.onend = () => {
          if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current);
            silenceTimerRef.current = null;
          }
          if (isProcessingRef.current) return;

          const text = accumulatedTranscriptRef.current.trim();
          accumulatedTranscriptRef.current = '';
          if (text) {
            isProcessingRef.current = true;
            processText(text);
          } else {
            setStatus(prev => (prev === 'listening' ? 'idle' : prev));
          }
        };

        webRecognitionRef.current = recognition;
        recognition.start();
      } catch (err) {
        console.warn('Laptop/Browser mic permission error:', err);
        alert('Izin mikrofon ditolak pada browser Anda.');
        setStatus('error');
        setTimeout(() => setStatus('idle'), 1500);
      }
    }
  };

  const processText = (text) => {
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;

    setStatus('processing'); // Visual State: Oranye Memahami
    
    setTimeout(() => {
      try {
        const result = parseVoiceTransaction(text, { expenseCategories, incomeCategories, accountsList });
        
        if (!result || !result.success) {
          setStatus('error');
          isProcessingRef.current = false;
          setTimeout(() => setStatus('idle'), 1500);
          return;
        }

        if (result.isMultiple && Array.isArray(result.commands)) {
          handleSaveVoiceTransaction(result);
          setStatus('success');

          setTimeout(() => {
            setStatus('idle');
            isProcessingRef.current = false;
            setAmountVal('');
            setNote('');
          }, 1000);
          return;
        }

        // A. Perintah Hapus (Voice-Command DELETE)
        if (result.action === 'DELETE') {
          handleSaveVoiceTransaction(result);
          setStatus('success'); // Visual State: Hijau Berhasil Hapus

          setTimeout(() => {
            setStatus('idle');
            isProcessingRef.current = false;
          }, 1000);
          return;
        }

        // B. Perintah Simpan Transaksi Baru
        if (result.type && result.amount) {
          setTransType(result.type);
          setAmountVal(result.amount.toString());
          if (result.category) setSelectedCategory(result.category);
          if (result.account) setAccount(result.account);
          if (result.note) setNote(result.note);

          handleSaveVoiceTransaction(result);
          setStatus('success'); // Visual State: Hijau Tersimpan

          setTimeout(() => {
            setStatus('idle');
            isProcessingRef.current = false;
            setAmountVal('');
            setNote('');
          }, 1000);
        } else {
          setStatus('error');
          isProcessingRef.current = false;
          setTimeout(() => setStatus('idle'), 1500);
        }
      } catch (err) {
        console.error('Error in processText:', err);
        setStatus('error');
        isProcessingRef.current = false;
        setTimeout(() => setStatus('idle'), 1500);
      }
    }, 200); // Respon instan dan cepat
  };

  return (
    <div className="voice-mic-container">
      <span className="voice-mic-beta-badge">BETA</span>
      <button 
        type="button"
        className={`voice-mic-fab status-${status}`}
        onClick={handleMicClick}
        disabled={status === 'success'}
        aria-label="Input Transaksi Suara"
        title={
          status === 'listening' 
            ? 'Sedang mendengarkan... (Klik untuk selesai / proses)' 
            : status === 'processing' 
              ? 'Sedang memproses... (Klik untuk batal)' 
              : 'Bicara untuk catat atau hapus transaksi'
        }
      >
        {status === 'success' ? (
          <svg className="voice-mic-icon check" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        ) : status === 'error' ? (
          <svg className="voice-mic-icon cross" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        ) : (
          <svg className="voice-mic-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path>
            <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
            <line x1="12" y1="19" x2="12" y2="22"></line>
          </svg>
        )}
      </button>
    </div>
  );
}

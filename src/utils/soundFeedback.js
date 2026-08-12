let audioCtx = null;

export function playPositiveChime() {
  try {
    if (!audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      audioCtx = new AudioContext();
    }
    
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    
    const notes = [
      { freq: 523.25, isLast: false }, // C5
      { freq: 659.25, isLast: false }, // E5
      { freq: 783.99, isLast: false }, // G5
      { freq: 1046.50, isLast: true }  // C6 (Oktaf naik di akhir)
    ];

    const baseDuration = 0.08; // 80ms untuk 3 nada pertama
    const attack = 0.01;        // 10ms attack
    const startTime = audioCtx.currentTime;
    const maxGain = 0.28;       // Gain ~0.25 - 0.3 untuk sensasi lebih terasa namun tetap lembut

    let currentOffset = 0;

    notes.forEach((note) => {
      const noteStart = startTime + currentOffset;
      const duration = note.isLast ? baseDuration * 2 : baseDuration; // 2x durasi (~160ms) untuk C6
      const release = note.isLast ? 0.15 : 0.04;                     // Release ~150ms untuk C6 ("menggantung")

      // --- Oscillator Utama (Fundamental) ---
      const oscPrimary = audioCtx.createOscillator();
      const gainPrimary = audioCtx.createGain();

      oscPrimary.type = 'sine';
      oscPrimary.frequency.value = note.freq;

      gainPrimary.gain.setValueAtTime(0, noteStart);
      gainPrimary.gain.linearRampToValueAtTime(maxGain, noteStart + attack);
      gainPrimary.gain.setValueAtTime(maxGain, noteStart + duration);
      gainPrimary.gain.linearRampToValueAtTime(0, noteStart + duration + release);

      oscPrimary.connect(gainPrimary);
      gainPrimary.connect(audioCtx.destination);

      oscPrimary.start(noteStart);
      oscPrimary.stop(noteStart + duration + release);

      // --- Oscillator Kedua (Oktaf atas ~30% gain untuk efek "berkilau/lonceng") ---
      const oscSparkle = audioCtx.createOscillator();
      const gainSparkle = audioCtx.createGain();

      oscSparkle.type = 'sine';
      oscSparkle.frequency.value = note.freq * 2; // 1 oktaf di atas nada utama

      const sparkleGain = maxGain * 0.3; // 30% dari gain utama

      gainSparkle.gain.setValueAtTime(0, noteStart);
      gainSparkle.gain.linearRampToValueAtTime(sparkleGain, noteStart + attack);
      gainSparkle.gain.setValueAtTime(sparkleGain, noteStart + duration);
      gainSparkle.gain.linearRampToValueAtTime(0, noteStart + duration + release);

      oscSparkle.connect(gainSparkle);
      gainSparkle.connect(audioCtx.destination);

      oscSparkle.start(noteStart);
      oscSparkle.stop(noteStart + duration + release);

      currentOffset += baseDuration;
    });
  } catch (e) {
    // Silent fail jika AudioContext gagal
    console.warn("Failed to play positive chime:", e);
  }
}

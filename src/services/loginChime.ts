/** Play a brief, original retro-console startup chime after successful sign-in. */
export function playLoginChime(): void {
  if (typeof window === 'undefined') return;

  const AudioContextConstructor =
    window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

  if (!AudioContextConstructor) return;

  try {
    const context = new AudioContextConstructor();
    const master = context.createGain();
    master.gain.setValueAtTime(0.0001, context.currentTime);
    master.gain.exponentialRampToValueAtTime(0.16, context.currentTime + 0.08);
    master.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 1.65);
    master.connect(context.destination);

    // A low warm note under a bright three-note ascending startup motif.
    const notes = [
      { frequency: 146.83, start: 0, duration: 0.65, type: 'sine' as OscillatorType, level: 0.55 },
      { frequency: 587.33, start: 0.16, duration: 0.3, type: 'triangle' as OscillatorType, level: 0.42 },
      { frequency: 783.99, start: 0.46, duration: 0.34, type: 'triangle' as OscillatorType, level: 0.35 },
      { frequency: 1174.66, start: 0.8, duration: 0.75, type: 'sine' as OscillatorType, level: 0.3 },
    ];

    for (const note of notes) {
      const oscillator = context.createOscillator();
      const volume = context.createGain();
      const start = context.currentTime + note.start;
      oscillator.type = note.type;
      oscillator.frequency.setValueAtTime(note.frequency, start);
      volume.gain.setValueAtTime(0.0001, start);
      volume.gain.exponentialRampToValueAtTime(note.level, start + 0.025);
      volume.gain.exponentialRampToValueAtTime(0.0001, start + note.duration);
      oscillator.connect(volume);
      volume.connect(master);
      oscillator.start(start);
      oscillator.stop(start + note.duration + 0.02);
    }

    window.setTimeout(() => void context.close().catch(() => undefined), 1900);
  } catch {
    // Audio is an enhancement; login should still work if the browser blocks it.
  }
}

import startupSoundUrl from '../assets/ps2_start_up.mp3';

let startupSound: HTMLAudioElement | undefined;

/** Play the supplied console startup sound after a successful sign-in. */
export function playLoginChime(): void {
  if (typeof window === 'undefined') return;

  try {
    startupSound ??= new Audio(startupSoundUrl);
    startupSound.currentTime = 0;
    void startupSound.play().catch(() => undefined);
  } catch {
    // Audio is an enhancement; login should still work if playback is blocked.
  }
}

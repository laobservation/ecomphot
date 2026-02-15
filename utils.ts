import { useEffect, useRef } from 'react';

/**
 * A custom hook to track page visibility state using a ref.
 * This is useful for checking visibility inside async functions without stale state.
 * @returns A React ref object whose `current` property is true if the page is visible, and false otherwise.
 */
export const usePageVisibility = () => {
  // Initialize ref with the current visibility state
  const isVisibleRef = useRef<boolean>(typeof document !== 'undefined' ? !document.hidden : true);

  useEffect(() => {
    const handleVisibilityChange = () => {
      isVisibleRef.current = !document.hidden;
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return isVisibleRef;
};

/**
 * Plays a short notification sound using the Web Audio API.
 * Creates a shared AudioContext to be efficient.
 */
export const playNotificationSound = () => {
  // Ensure this runs only in the browser
  if (typeof window === 'undefined') return;
  
  const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioContext) {
    console.warn("Web Audio API is not supported in this browser.");
    return;
  }

  // Use a shared AudioContext to avoid creating multiple instances.
  let audioContext: AudioContext;
  if (!(window as any)._notificationAudioContext) {
    try {
      (window as any)._notificationAudioContext = new AudioContext();
    } catch (e) {
      console.error("Could not create AudioContext:", e);
      return;
    }
  }
  audioContext = (window as any)._notificationAudioContext;

  // Browsers may suspend AudioContext until a user gesture. Attempt to resume it.
  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }

  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(880, audioContext.currentTime); // A5 note

  // Create a short "beep" with a fade out
  gainNode.gain.setValueAtTime(0, audioContext.currentTime);
  gainNode.gain.linearRampToValueAtTime(0.4, audioContext.currentTime + 0.02); // Quick ramp up
  gainNode.gain.exponentialRampToValueAtTime(0.00001, audioContext.currentTime + 0.3); // Fade out

  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + 0.3);
};

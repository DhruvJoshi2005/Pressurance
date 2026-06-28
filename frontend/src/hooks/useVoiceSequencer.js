import { useState, useRef, useEffect, useCallback } from "react";

// Speaks `instruction`, then counts down from `duration` seconds.
// Calls onComplete when countdown reaches zero.
// Returns { status, timeLeft, start, stop }.
// status: "idle" | "speaking" | "counting" | "done"
export function useVoiceSequencer({ instruction, duration, onComplete }) {
  const [status, setStatus]   = useState("idle");
  const [timeLeft, setTimeLeft] = useState(duration);

  const activeRef   = useRef(false);
  const timerRef    = useRef(null);
  const onDoneRef   = useRef(onComplete);
  onDoneRef.current = onComplete;  // keep ref in sync without re-triggering effect

  const stopInternal = useCallback(() => {
    activeRef.current = false;
    clearInterval(timerRef.current);
    window.speechSynthesis?.cancel();
  }, []);

  const startCountdown = useCallback((secs) => {
    if (!activeRef.current) return;
    setStatus("counting");
    let rem = secs;
    setTimeLeft(rem);

    timerRef.current = setInterval(() => {
      rem -= 1;
      setTimeLeft(rem);
      if (rem <= 0) {
        clearInterval(timerRef.current);
        if (activeRef.current) {
          activeRef.current = false;
          setStatus("done");
          onDoneRef.current?.();
        }
      }
    }, 1000);
  }, []);

  const start = useCallback(() => {
    if (activeRef.current) return;
    activeRef.current = true;
    setStatus("speaking");
    setTimeLeft(duration);

    if (window.speechSynthesis && instruction) {
      window.speechSynthesis.cancel();
      const utt = new SpeechSynthesisUtterance(instruction);
      utt.rate   = 0.92;
      utt.onend  = () => startCountdown(duration);
      utt.onerror = () => startCountdown(duration);
      window.speechSynthesis.speak(utt);
    } else {
      startCountdown(duration);
    }
  }, [instruction, duration, startCountdown]);

  const stop = useCallback(() => {
    stopInternal();
    setStatus("idle");
    setTimeLeft(duration);
  }, [stopInternal, duration]);

  // Cleanup on unmount
  useEffect(() => () => stopInternal(), [stopInternal]);

  return { status, timeLeft, start, stop };
}

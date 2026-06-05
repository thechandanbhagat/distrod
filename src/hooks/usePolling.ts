// @group Utilities : Hook for periodic polling of Tauri commands
import { useEffect, useRef, useCallback } from "react";

// @group BusinessLogic : usePolling hook — calls `fn` every `intervalMs`
export function usePolling(
  fn: () => void | Promise<void>,
  intervalMs: number,
  enabled = true
): void {
  const fnRef = useRef(fn);
  fnRef.current = fn;

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stop = useCallback(() => {
    if (timerRef.current !== null) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!enabled) {
      stop();
      return;
    }
    // Fire immediately then on interval
    fnRef.current();
    timerRef.current = setInterval(() => fnRef.current(), intervalMs);

    return stop;
  }, [enabled, intervalMs, stop]);
}

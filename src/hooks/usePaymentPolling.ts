import { useState, useRef, useEffect, useCallback } from 'react';
import { getTransactionStatus } from '../api/payments';

export type PollingResult = 'failed' | 'expired' | 'timeout';

interface UsePaymentPollingOptions {
  onSuccess: () => void;
  onFailed: (status: PollingResult) => void;
  pollInterval?: number;
  timeoutSeconds?: number;
}

// Progressive backoff: stay responsive early (users watch the spinner in the
// first few seconds) but relax quickly after that to cut API load by ~60%
// when the user has walked away from the payment screen.
function nextPollDelay(elapsedSeconds: number, base: number): number {
  if (elapsedSeconds < 15) return base;            // 3s
  if (elapsedSeconds < 45) return base * 2;        // 6s
  return base * 4;                                 // 12s
}

export function usePaymentPolling({
  onSuccess,
  onFailed,
  pollInterval = 3000,
  timeoutSeconds = 120,
}: UsePaymentPollingOptions) {
  const [countdown, setCountdown] = useState(timeoutSeconds);
  const [isPolling, setIsPolling] = useState(false);
  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stoppedRef = useRef(false);
  const callbacksRef = useRef({ onSuccess, onFailed });
  callbacksRef.current = { onSuccess, onFailed };

  const clearTimers = useCallback(() => {
    stoppedRef.current = true;
    if (pollRef.current) clearTimeout(pollRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
    pollRef.current = null;
    countdownRef.current = null;
    setIsPolling(false);
  }, []);

  const startPolling = useCallback(
    (contributionId: string) => {
      clearTimers();
      stoppedRef.current = false;
      setCountdown(timeoutSeconds);
      setIsPolling(true);

      const startedAt = Date.now();

      countdownRef.current = setInterval(() => {
        setCountdown((c) => {
          if (c <= 1) {
            clearTimers();
            callbacksRef.current.onFailed('timeout');
            return 0;
          }
          return c - 1;
        });
      }, 1000);

      const poll = async () => {
        if (stoppedRef.current) return;

        const elapsed = (Date.now() - startedAt) / 1000;
        if (elapsed >= timeoutSeconds) {
          clearTimers();
          callbacksRef.current.onFailed('timeout');
          return;
        }

        try {
          const status = await getTransactionStatus(contributionId);
          if (stoppedRef.current) return;
          if (status.status === 'successful' || status.status === 'success') {
            clearTimers();
            callbacksRef.current.onSuccess();
            return;
          }
          if (status.status === 'failed' || status.status === 'expired') {
            clearTimers();
            callbacksRef.current.onFailed(status.status);
            return;
          }
        } catch {
          // Ignore polling errors — keep retrying until timeout.
        }

        if (stoppedRef.current) return;
        const delay = nextPollDelay(elapsed, pollInterval);
        pollRef.current = setTimeout(poll, delay);
      };

      // Fire the first poll immediately after the base interval.
      pollRef.current = setTimeout(poll, pollInterval);
    },
    [clearTimers, pollInterval, timeoutSeconds]
  );

  useEffect(() => () => clearTimers(), [clearTimers]);

  return { countdown, isPolling, startPolling, clearTimers };
}

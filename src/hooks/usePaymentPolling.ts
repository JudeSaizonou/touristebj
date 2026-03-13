import { useState, useRef, useEffect, useCallback } from 'react';
import { getTransactionStatus } from '../api/payments';

export type PollingResult = 'failed' | 'expired' | 'timeout';

interface UsePaymentPollingOptions {
  onSuccess: () => void;
  onFailed: (status: PollingResult) => void;
  pollInterval?: number;
  timeoutSeconds?: number;
}

export function usePaymentPolling({
  onSuccess,
  onFailed,
  pollInterval = 3000,
  timeoutSeconds = 120,
}: UsePaymentPollingOptions) {
  const [countdown, setCountdown] = useState(timeoutSeconds);
  const [isPolling, setIsPolling] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const callbacksRef = useRef({ onSuccess, onFailed });
  callbacksRef.current = { onSuccess, onFailed };

  const clearTimers = useCallback(() => {
    if (pollRef.current) clearInterval(pollRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
    pollRef.current = null;
    countdownRef.current = null;
    setIsPolling(false);
  }, []);

  const startPolling = useCallback(
    (referenceId: string) => {
      clearTimers();
      setCountdown(timeoutSeconds);
      setIsPolling(true);

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

      let elapsed = 0;
      pollRef.current = setInterval(async () => {
        elapsed += pollInterval / 1000;
        if (elapsed >= timeoutSeconds) {
          clearTimers();
          callbacksRef.current.onFailed('timeout');
          return;
        }
        try {
          const status = await getTransactionStatus(referenceId);
          if (status.status === 'successful' || status.status === 'success') {
            clearTimers();
            callbacksRef.current.onSuccess();
          } else if (status.status === 'failed' || status.status === 'expired') {
            clearTimers();
            callbacksRef.current.onFailed(status.status);
          }
        } catch {
          // ignore polling errors
        }
      }, pollInterval);
    },
    [clearTimers, pollInterval, timeoutSeconds]
  );

  useEffect(() => () => clearTimers(), [clearTimers]);

  return { countdown, isPolling, startPolling, clearTimers };
}

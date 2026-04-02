import { KKIAPAY_KEY, KKIAPAY_SANDBOX } from '../config/payments';

export interface KkiapayOptions {
  amount: number;
  email?: string;
  phone?: string;
  name?: string;
  description?: string;
}

export interface KkiapaySuccessResponse {
  transactionId: string;
}

/**
 * Opens the KKiaPay payment widget and returns a promise that resolves
 * with the transactionId on success or rejects on failure/cancel.
 *
 * Uses the global `openKkiapayWidget` / `addSuccessListener` / `addFailedListener`
 * injected by the KKiaPay CDN script (loaded in index.html).
 */
export function openKkiapay(options: KkiapayOptions): Promise<KkiapaySuccessResponse> {
  return new Promise((resolve, reject) => {
    if (typeof window.openKkiapayWidget !== 'function') {
      reject(new Error('KKiaPay non disponible. Rechargez la page et réessayez.'));
      return;
    }

    if (!KKIAPAY_KEY) {
      reject(new Error('KKiaPay non configuré. Contactez le support.'));
      return;
    }

    // Clean up any previous listeners
    const cleanup = () => {
      try {
        window.removeKkiapayListener?.('success', onSuccess);
        window.removeKkiapayListener?.('failed', onFailed);
      } catch { /* ignore */ }
    };

    const onSuccess = (response: unknown) => {
      cleanup();
      const txId = (response as Record<string, unknown>)?.transactionId;
      if (!txId || typeof txId !== 'string') {
        reject(new Error('Réponse KKiaPay invalide — transactionId manquant.'));
        return;
      }
      resolve({ transactionId: txId });
    };

    const onFailed = (error: unknown) => {
      cleanup();
      reject(new Error(typeof error === 'string' ? error : 'Le paiement a échoué.'));
    };

    window.addSuccessListener?.(onSuccess);
    window.addFailedListener?.(onFailed);

    window.openKkiapayWidget({
      amount: options.amount,
      key: KKIAPAY_KEY,
      sandbox: KKIAPAY_SANDBOX,
      email: options.email || '',
      phone: options.phone || '',
      name: options.name || '',
      paymentmethod: ['momo', 'card'],
      countries: ['BJ'],
      theme: '#D97706',
    });
  });
}

// Global type declarations for KKiaPay CDN script
declare global {
  interface Window {
    openKkiapayWidget: (config: Record<string, unknown>) => void;
    addSuccessListener: (cb: (response: any) => void) => void;
    addFailedListener: (cb: (error: any) => void) => void;
    removeKkiapayListener: (event: string, cb: (...args: any[]) => void) => void;
  }
}

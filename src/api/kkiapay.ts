declare global {
  interface Window {
    openKkiapayWidget: (options: KkiapayWidgetOptions) => void;
    addSuccessListener: (cb: (response: KkiapaySuccessResponse) => void) => void;
    addFailedListener: (cb: (err: KkiapayFailedResponse) => void) => void;
    removeKkiapayListener: () => void;
  }
}

export interface KkiapayWidgetOptions {
  amount: number;
  api_key: string;
  sandbox?: boolean;
  phone?: string;
  data?: string;
  email?: string;
  name?: string;
  reference?: string;
}

export interface KkiapaySuccessResponse {
  transactionId: string;
}

export interface KkiapayFailedResponse {
  message?: string;
  code?: string;
}

const CDN_URL = 'https://cdn.kkiapay.me/k.js';
let loadPromise: Promise<void> | null = null;

export function loadKkiapayScript(): Promise<void> {
  if (typeof window.openKkiapayWidget === 'function') return Promise.resolve();
  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = CDN_URL;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Impossible de charger Kkiapay.'));
    document.head.appendChild(script);
  });

  return loadPromise;
}

export async function openKkiapay(options: KkiapayWidgetOptions): Promise<KkiapaySuccessResponse> {
  await loadKkiapayScript();

  return new Promise((resolve, reject) => {
    if (window.removeKkiapayListener) window.removeKkiapayListener();

    window.addSuccessListener((response) => {
      resolve(response);
    });

    window.addFailedListener((err) => {
      reject(new Error(err?.message || 'Paiement Kkiapay échoué.'));
    });

    window.openKkiapayWidget(options);
  });
}

declare global {
  interface Window {
    openKkiapayWidget: (options: Record<string, unknown>) => void;
    addSuccessListener: (cb: (response: KkiapaySuccessResponse) => void) => void;
    addFailedListener: (cb: (err: KkiapayFailedResponse) => void) => void;
    removeKkiapayListener: () => void;
  }
}

export interface KkiapayWidgetOptions {
  amount: number;
  key: string;
  sandbox?: boolean;
  phone?: string;
  data?: string;
  email?: string;
  name?: string;
  partnerId?: string;
  theme?: string;
  paymentmethod?: string[];
  countries?: string[];
  callback?: string;
  position?: string;
}

export interface KkiapaySuccessResponse {
  transactionId: string;
}

export interface KkiapayFailedResponse {
  message?: string;
  code?: string;
}

function isKkiapayReady(): boolean {
  return typeof window.openKkiapayWidget === 'function'
    && typeof window.addSuccessListener === 'function';
}

const CDN_URL = 'https://cdn.kkiapay.me/k.js';
let loadPromise: Promise<void> | null = null;

export function loadKkiapayScript(): Promise<void> {
  if (isKkiapayReady()) return Promise.resolve();
  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve, reject) => {
    // Check if script tag already exists (added in index.html)
    const existing = document.querySelector('script[src*="kkiapay"]');
    if (existing) {
      // Script tag exists but may not have loaded yet
      if (isKkiapayReady()) {
        resolve();
        return;
      }
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('Impossible de charger Kkiapay.')));
      return;
    }

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
    if (typeof window.removeKkiapayListener === 'function') {
      window.removeKkiapayListener();
    }

    window.addSuccessListener((response) => {
      resolve(response);
    });

    window.addFailedListener((err) => {
      reject(new Error(err?.message || 'Paiement Kkiapay échoué.'));
    });

    window.openKkiapayWidget({
      amount: options.amount,
      key: options.key,
      sandbox: options.sandbox ?? true,
      phone: options.phone,
      name: options.name,
      email: options.email,
      data: options.data,
      partnerId: options.partnerId,
      theme: options.theme || '#1a4d3e',
      paymentmethod: options.paymentmethod || ['momo', 'card'],
      countries: options.countries || ['BJ'],
      position: options.position || 'center',
      callback: options.callback || '',
    });
  });
}

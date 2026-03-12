declare global {
  interface Window {
    FedaPay: {
      init: (options: Record<string, unknown>) => FedaPayWidget;
      CHECKOUT_COMPLETED: string;
      DIALOG_DISMISSED: string;
    };
  }
}

interface FedaPayWidget {
  open: () => void;
}

export interface FedaPayOptions {
  amount: number;
  publicKey: string;
  environment: 'sandbox' | 'live';
  description?: string;
  customerEmail?: string;
  customerFirstname?: string;
  customerLastname?: string;
  customerPhone?: string;
  customerCountry?: string;
  currency?: string;
  transactionId?: string;
}

export interface FedaPaySuccessResponse {
  transactionId: string;
  transaction?: Record<string, unknown>;
}

const CDN_URL = 'https://cdn.fedapay.com/checkout.js?v=1.1.7';
let loadPromise: Promise<void> | null = null;

function isFedaPayReady(): boolean {
  return typeof window.FedaPay !== 'undefined' && typeof window.FedaPay.init === 'function';
}

export function loadFedaPayScript(): Promise<void> {
  if (isFedaPayReady()) return Promise.resolve();
  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector('script[src*="fedapay"]');
    if (existing) {
      if (isFedaPayReady()) { resolve(); return; }
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('Impossible de charger FedaPay.')));
      return;
    }
    const script = document.createElement('script');
    script.src = CDN_URL;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Impossible de charger FedaPay.'));
    document.head.appendChild(script);
  });
  return loadPromise;
}

export async function openFedaPay(options: FedaPayOptions): Promise<FedaPaySuccessResponse> {
  await loadFedaPayScript();

  return new Promise((resolve, reject) => {
    const widget = window.FedaPay.init({
      public_key: options.publicKey,
      environment: options.environment,
      transaction: {
        amount: options.amount,
        description: options.description || 'Paiement Le Touriste.bj',
      },
      customer: {
        email: options.customerEmail || '',
        firstname: options.customerFirstname || '',
        lastname: options.customerLastname || '',
        phone_number: options.customerPhone ? {
          number: options.customerPhone,
          country: options.customerCountry || 'BJ',
        } : undefined,
      },
      currency: { iso: options.currency || 'XOF' },
      onComplete: (reason: string, transaction: Record<string, unknown>) => {
        if (reason === window.FedaPay.CHECKOUT_COMPLETED) {
          resolve({
            transactionId: String(transaction?.id || transaction?.transaction_id || ''),
            transaction,
          });
        } else if (reason === window.FedaPay.DIALOG_DISMISSED) {
          reject(new Error('Paiement annulé.'));
        }
      },
    });
    widget.open();
  });
}

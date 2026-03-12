export const PAYMENT_FEES = {
  MTN: 0.02,
  FEDAPAY: 0.02,
} as const;

export const FEDAPAY_KEY = import.meta.env.VITE_FEDAPAY_PUBLIC_KEY as string | undefined;
export const FEDAPAY_ENV = (import.meta.env.VITE_FEDAPAY_ENV || 'sandbox') as 'sandbox' | 'live';

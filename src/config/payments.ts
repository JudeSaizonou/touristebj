export const PAYMENT_FEES = {
  MTN: 0.02,       // +2%
  KKIAPAY: 0.005,  // +0.5%
} as const;

export const KKIAPAY_KEY = import.meta.env.VITE_KKIAPAY_PUBLIC_KEY as string | undefined;
export const KKIAPAY_SANDBOX = import.meta.env.VITE_KKIAPAY_SANDBOX !== 'false';

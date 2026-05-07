import { API_BASE, TRIPS_PREFIX } from './config';
import { apiRequest } from './client';

export interface MtnInitResponse {
  success: boolean;
  status: string;
  contributionId: string;
  referenceId: string;
  message?: string;
  data?: any;
}

export type MtnStatus = 'pending' | 'processing' | 'successful' | 'success' | 'failed' | 'expired' | 'timeout';

export interface TransactionStatus {
  status: MtnStatus;
  failed?: boolean;
  userMessage?: string;
}

/** Initie un paiement MTN pour un booking TouristeBJ (acompte ou versement). */
export async function payBookingMtn(
  bookingId: string,
  params: {
    amount: number;
    phoneNumber: string;
    countryCode?: string;
    type: 'DEPOSIT' | 'INSTALLMENT';
  }
): Promise<MtnInitResponse> {
  const endpoint = params.type === 'DEPOSIT' ? 'pay-deposit' : 'pay-installment';
  return apiRequest<MtnInitResponse>(
    `${TRIPS_PREFIX}/bookings/${bookingId}/${endpoint}`,
    {
      method: 'POST',
      body: JSON.stringify({
        paymentMethod: 'mtn',
        amount: params.amount,
        phoneNumber: params.phoneNumber.replace(/\D/g, ''),
        countryCode: params.countryCode || '229',
        tripBookingId: bookingId,
      }),
    }
  );
}

export interface KkiapayInitResponse {
  success: boolean;
  message?: string;
  transactionId?: string;
  amount: number;
  netAmount: number;
  fee: number;
  feeRate: number;
  contributionId?: string;
  booking?: any;
}

/** Initie un paiement KKiaPay pour l'acompte. */
export async function payDepositKkiapay(bookingId: string, amount: number): Promise<KkiapayInitResponse> {
  return apiRequest<KkiapayInitResponse>(
    `${TRIPS_PREFIX}/bookings/${bookingId}/pay-deposit`,
    {
      method: 'POST',
      body: JSON.stringify({ paymentMethod: 'kkiapay', amount, tripBookingId: bookingId }),
    }
  );
}

/** Initie un paiement KKiaPay pour un versement échelonné. */
export async function payInstallmentKkiapay(bookingId: string, amount: number): Promise<KkiapayInitResponse> {
  return apiRequest<KkiapayInitResponse>(
    `${TRIPS_PREFIX}/bookings/${bookingId}/pay-installment`,
    {
      method: 'POST',
      body: JSON.stringify({ paymentMethod: 'kkiapay', amount, tripBookingId: bookingId }),
    }
  );
}

/** Vérifie un paiement KKiaPay côté serveur après succès widget. */
export async function verifyKkiapayTransaction(
  bookingId: string,
  transactionId: string,
  type: 'DEPOSIT' | 'INSTALLMENT'
): Promise<{ success: boolean; booking?: any }> {
  return apiRequest<{ success: boolean; booking?: any }>(
    `${TRIPS_PREFIX}/bookings/${bookingId}/verify-kkiapay`,
    {
      method: 'POST',
      body: JSON.stringify({ transactionId, type }),
    }
  );
}

/** Récupère le statut d'une transaction par contributionId (polling async Zepargn). */
export async function getTransactionStatus(contributionId: string): Promise<TransactionStatus> {
  const res = await apiRequest<TransactionStatus & { success: boolean; data?: TransactionStatus }>(
    `${API_BASE}/transactions/${encodeURIComponent(contributionId)}/status`
  );
  return res.data || res;
}

import { API_BASE, TRIPS_PREFIX } from './config';
import { apiRequest } from './client';

export interface MtnInitResponse {
  success: boolean;
  referenceId: string;
  status: string;
  data?: any;
}

export type MtnStatus = 'processing' | 'successful' | 'failed' | 'expired' | 'timeout';

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

export interface FedaPayInitResponse {
  success: boolean;
  message?: string;
  transactionId: string;
  amount: number;
  netAmount: number;
  fee: number;
  feeRate: number;
  contributionId?: string;
  booking?: any;
}

/** Initie un paiement FedaPay pour l'acompte. Retourne transactionId à passer au widget. */
export async function payDepositFedaPay(bookingId: string, amount: number): Promise<FedaPayInitResponse> {
  return apiRequest<FedaPayInitResponse>(
    `${TRIPS_PREFIX}/bookings/${bookingId}/pay-deposit`,
    {
      method: 'POST',
      body: JSON.stringify({ paymentMethod: 'mobile_money', amount, tripBookingId: bookingId }),
    }
  );
}

/** Initie un paiement FedaPay pour un versement échelonné. Retourne transactionId à passer au widget. */
export async function payInstallmentFedaPay(bookingId: string, amount: number): Promise<FedaPayInitResponse> {
  return apiRequest<FedaPayInitResponse>(
    `${TRIPS_PREFIX}/bookings/${bookingId}/pay-installment`,
    {
      method: 'POST',
      body: JSON.stringify({ paymentMethod: 'mobile_money', amount, tripBookingId: bookingId }),
    }
  );
}

/** Récupère le statut d'une transaction MTN. */
export async function getTransactionStatus(referenceId: string): Promise<TransactionStatus> {
  const res = await apiRequest<{ success: boolean; data: TransactionStatus }>(
    `${API_BASE}/payment/transaction/status?paymentMethod=mtn&referenceId=${encodeURIComponent(referenceId)}`
  );
  return res.data;
}

import { apiRequest } from './api';

export type Payment = {
  id: string;
  bookingId: string;
  amount: string;
  provider: string;
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED';
  reference: string | null;
  createdAt: string;
};

export type PaymentInitiationResponse = {
  payment: Payment;
  providerResponse: {
    status: string;
    transactionId: string;
    paymentUrl?: string;
  };
};

// POST /api/payments/initiate (🔒 Auth Requise)
export function initiatePayment(
  bookingId: string,
  token: string
): Promise<PaymentInitiationResponse> {
  return apiRequest<PaymentInitiationResponse>('/payments/initiate', {
    method: 'POST',
    body: { bookingId },
    token,
  });
}

// POST /api/payments/confirm (🔒 Auth Requise) — confirme aussi la réservation
export function confirmPayment(
  bookingId: string,
  token: string
): Promise<{ message: string }> {
  return apiRequest<{ message: string }>('/payments/confirm', {
    method: 'POST',
    body: { bookingId },
    token,
  });
}

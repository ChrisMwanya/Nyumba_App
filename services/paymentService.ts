import { apiRequest } from './api';

export type PaymentMethod = 'mpesa' | 'orange_money' | 'airtel_money' | 'card';

export type PaymentInitiationResponse = {
  transactionReference: string;
  paymentUrl?: string;
  message: string;
};

export type PaymentConfirmationResponse = {
  status: 'success' | 'failure';
  message: string;
};

export function initiatePayment(data: { 
  reservation_id: number, 
  payment_method: PaymentMethod 
}, token: string): Promise<PaymentInitiationResponse> {
  return apiRequest<PaymentInitiationResponse>('/payments/initiate', {
    method: 'POST',
    body: data,
    token,
  });
}

export function confirmPayment(data: { 
  transaction_reference: string, 
  status: 'success' | 'failure' 
}, token: string): Promise<PaymentConfirmationResponse> {
  return apiRequest<PaymentConfirmationResponse>('/payments/confirm', {
    method: 'POST',
    body: data,
    token,
  });
}

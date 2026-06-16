import { apiRequest } from './api';

export type Reservation = {
  id: number;
  annonceId: number;
  userId: number;
  startDate: string;
  endDate: string;
  guestsCount: number;
  status: string; // 'en_attente_paiement' | 'confirmee' | 'annulee'
  totalAmount: number;
  typeReservation?: string;
  createdAt: string;
  updatedAt?: string;
  annonce?: {
    id: number;
    title: string;
    coverImageUrl: string | null;
    price: number;
    currency: string;
    address: string | null;
  };
};

export type AvailabilityResponse = {
  available: boolean;
  message: string;
};

export type QuoteResponse = {
  basePrice: number;
  duration: number;
  durationType: 'nights' | 'days' | 'months';
  subtotal: number;
  serviceFee: number;
  total: number;
  currency: string;
};

export function checkAvailability(data: { 
  annonce_id: number, 
  start_date: string, 
  end_date: string, 
  guests_count: number 
}): Promise<AvailabilityResponse> {
  return apiRequest<AvailabilityResponse>('/reservations/check-availability', {
    method: 'POST',
    body: data,
  });
}

export function getQuote(data: { 
  annonce_id: number, 
  start_date: string, 
  end_date: string, 
  guests_count: number 
}): Promise<QuoteResponse> {
  return apiRequest<QuoteResponse>('/reservations/quote', {
    method: 'POST',
    body: data,
  });
}

export function createReservation(data: { 
  annonce_id: number, 
  start_date: string, 
  end_date: string, 
  guests_count: number,
  options?: any[]
}, token?: string): Promise<Reservation> {
  return apiRequest<Reservation>('/reservations', {
    method: 'POST',
    body: data,
    token,
  });
}

export function getMyReservations(token: string): Promise<Reservation[]> {
  return apiRequest<Reservation[]>('/reservations', {
    method: 'GET',
    token,
  });
}

export function getReservationDetails(id: number, token: string): Promise<Reservation> {
  return apiRequest<Reservation>(`/reservations/${id}`, {
    method: 'GET',
    token,
  });
}


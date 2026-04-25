import { apiRequest } from './api';

export type Reservation = {
  id: number;
  annonceId: number;
  userId: number;
  startDate: string;
  endDate: string;
  guestsCount: number;
  status: 'pending' | 'confirmed' | 'cancelled';
  totalPrice?: number;
  createdAt: string;
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
    body: JSON.stringify(data),
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
    body: JSON.stringify(data),
  });
}

export function createReservation(data: { 
  annonce_id: number, 
  start_date: string, 
  end_date: string, 
  guests_count: number,
  options?: any[]
}): Promise<Reservation> {
  return apiRequest<Reservation>('/reservations', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function getMyReservations(): Promise<Reservation[]> {
  return apiRequest<Reservation[]>('/reservations');
}

export function getReservationDetails(id: number): Promise<Reservation> {
  return apiRequest<Reservation>(`/reservations/${id}`);
}

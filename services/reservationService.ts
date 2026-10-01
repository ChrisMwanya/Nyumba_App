import { apiRequest } from './api';

export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';

export type Reservation = {
  id: string;
  annonceId: string;
  startDate: string;
  endDate: string | null;
  guestsCount: number;
  status: BookingStatus;
  totalAmount: number;
  createdAt: string;
  annonce?: {
    id: string;
    title: string;
  };
};

export type AvailabilityResponse = {
  available: boolean;
};

// Booking tel que renvoyé par ApiExpress (totalPrice est un Decimal sérialisé en chaîne)
type ApiBooking = {
  id: string;
  listingId: string;
  startDate: string;
  endDate: string | null;
  guestsCount: number;
  status: BookingStatus;
  totalPrice: string | number;
  createdAt: string;
  listing?: { id: string; name: string };
};

function toReservation(booking: ApiBooking): Reservation {
  return {
    id: booking.id,
    annonceId: booking.listingId,
    startDate: booking.startDate,
    endDate: booking.endDate,
    guestsCount: booking.guestsCount,
    status: booking.status,
    totalAmount: Number(booking.totalPrice),
    createdAt: booking.createdAt,
    annonce: booking.listing
      ? { id: booking.listing.id, title: booking.listing.name }
      : undefined,
  };
}

// POST /api/bookings/listings/{id}/check-availability (🔒 Auth Requise)
export async function checkAvailability(
  listingId: string,
  dates: { startDate: string; endDate?: string },
  token: string
): Promise<AvailabilityResponse> {
  const { available } = await apiRequest<{ available: boolean }>(
    `/bookings/listings/${listingId}/check-availability`,
    { method: 'POST', body: dates, token }
  );
  return { available };
}

// POST /api/bookings (🔒 Auth Requise) — le montant est calculé côté serveur
export async function createReservation(
  data: {
    listingId: string;
    startDate: string;
    endDate?: string;
    guestsCount: number;
  },
  token: string
): Promise<Reservation> {
  return toReservation(
    await apiRequest<ApiBooking>('/bookings', {
      method: 'POST',
      body: data,
      token,
    })
  );
}

// GET /api/bookings/me (🔒 Auth Requise)
export async function getMyReservations(token: string): Promise<Reservation[]> {
  const bookings = await apiRequest<ApiBooking[]>('/bookings/me', { token });
  return bookings.map(toReservation);
}

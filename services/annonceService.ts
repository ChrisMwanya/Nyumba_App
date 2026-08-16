import { apiRequest } from './api';

export type Category = {
  id: number;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
};

export type Ville = {
  id: number;
  name: string;
  code?: string;
  region?: string;
  latitude?: number;
  longitude?: number;
};

export type AnnonceImage = {
  id: number;
  url: string;
  isMain: boolean;
};

export type Amenity = {
  id: number;
  name: string;
  icon?: string;
  type?: string;
};

export type RestaurantDetail = {
  id: number;
  cuisineType?: string;
  menuUrl?: string;
  openingHours?: string;
  hasDelivery: boolean;
  hasReservation: boolean;
  averagePrice?: number;
  alcoholAvailable: boolean;
};

export type HotelDetail = {
  id: number;
  stars?: number;
  checkInTime?: string;
  checkOutTime?: string;
  hasPool: boolean;
  hasWifi: boolean;
  hasParking: boolean;
  hasBreakfast: boolean;
};

export type AccommodationDetail = {
  id: number;
  numberOfRooms?: number;
  numberOfBeds?: number;
  maxGuests?: number;
  hasKitchen: boolean;
  hasWifi: boolean;
  hasAirConditioning: boolean;
  pricePerNight?: number;
};

export type ClubDetail = {
  id: number;
  musicType?: string;
  dressCode?: string;
  entranceFee?: number;
  minimumAge?: number;
  openingDays?: string;
  vipAvailable: boolean;
};

export type Annonceur = {
  id: number;
  name: string;
  email: string;
  phone: string;
  address?: string;
  type: 'agence' | 'particulier';
  logoUrl?: string;
};

export type Annonce = {
  id: number;
  title: string;
  description?: string;
  type?: 'restaurant' | 'hotel' | 'accommodation' | 'club';
  price: number;
  currency: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  avgRating?: number;
  phone?: string;
  email?: string;
  website?: string;
  metadata?: any;
  status: 'available' | 'rented' | 'sold';
  categoryId: number;
  villeId: number;
  communeId?: number;
  userId: number;
  annonceurId: number;
  coverImageUrl?: string;
  category?: Category;
  ville?: Ville;
  commune?: { id: number; name: string };
  annonceur?: Annonceur;
  images?: AnnonceImage[];
  amenities?: Amenity[];
  restaurantDetail?: RestaurantDetail;
  hotelDetail?: HotelDetail;
  accommodationDetail?: AccommodationDetail;
  clubDetail?: ClubDetail;
  avis?: any[];
  reservations?: any[];
  createdAt: string;
  updatedAt: string;
};

export type PaginatedResponse<T> = {
  meta: {
    total: number;
    perPage: number;
    currentPage: number;
    lastPage: number;
    firstPage: number;
  };
  data: T[];
};

export type AnnonceFilters = {
  page?: number;
  limit?: number;
  category_id?: number;
  ville_id?: number;
  commune_id?: number;
  status?: string;
  search?: string;
  min_price?: number;
  max_price?: number;
  min_rating?: number;
  lat?: number;
  lng?: number;
  radius?: number;
};

export function getAnnonces(filters: AnnonceFilters = {}): Promise<PaginatedResponse<Annonce>> {
  const queryParams = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      queryParams.append(key, value.toString());
    }
  });

  const queryString = queryParams.toString();
  const path = `/annonces${queryString ? `?${queryString}` : ''}`;

  return apiRequest<PaginatedResponse<Annonce>>(path);
}

export function getAnnonceById(id: number): Promise<Annonce> {
  return apiRequest<Annonce>(`/annonces/${id}`);
}

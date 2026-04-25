import { apiRequest } from './api';

export type Category = {
  id: number;
  name: string;
  slug: string;
  description?: string;
  icon?: string; // Optional field for UI
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
  price: number;
  currency: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  avgRating: number;
  status: 'available' | 'rented' | 'sold';
  categoryId: number;
  villeId: number;
  communeId?: number;
  userId: number;
  annonceurId: number;
  category?: Category;
  ville?: Ville;
  annonceur?: Annonceur;
  images?: AnnonceImage[];
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

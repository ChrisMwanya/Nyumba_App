import { apiRequest } from './api';

export type CategoryAttribute = {
  id: string;
  categoryId: string;
  key: string;
  label: string;
  type: 'NUMBER' | 'TEXT' | 'BOOLEAN' | 'SELECT' | 'MULTISELECT';
  options?: string[] | null;
  isRequired: boolean;
  order: number;
};

export type Category = {
  id: string;
  name: string;
  slug: string;
  icon?: string | null;
  isActive?: boolean;
  attributeDefinitions?: CategoryAttribute[];
};

export type Ville = {
  id: string;
  name: string;
  country: string;
};

export type AnnonceImage = {
  id: string;
  url: string;
};

export type Annonce = {
  id: string;
  slug: string;
  title: string;
  description?: string;
  address: string;
  // Gamme de prix libre ("$$", "$$$$"…) : l'API ne fournit pas de tarif chiffré
  priceRange?: string;
  // Budget à prévoir par personne, en dollars ; absent si non renseigné
  budgetMin?: number;
  budgetMax?: number;
  latitude?: number;
  longitude?: number;
  // Distance en mètres, renseignée par la recherche de proximité
  distance?: number;
  // Attributs dynamiques définis par la catégorie (stars, wifi, cuisine_type…)
  attributes: Record<string, unknown>;
  categoryId: string;
  villeId?: string;
  category?: Pick<Category, 'id' | 'name' | 'slug'>;
  ville?: Ville;
  images: AnnonceImage[];
  owner?: { id: string; fullName: string };
  rating: ListingRating;
  createdAt: string;
  updatedAt: string;
};

export type PaginatedResponse<T> = {
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  data: T[];
};

export type AnnonceFilters = {
  page?: number;
  limit?: number;
  categoryId?: string;
  cityId?: string;
  // Pas de recherche texte côté API : filtrée localement sur les résultats reçus
  search?: string;
  // Recherche par proximité, rayon en km
  lat?: number;
  lng?: number;
  radius?: number;
  // « rating » : les mieux notées d'abord (ignoré par la recherche de proximité)
  sort?: 'rating';
  // Budget total du groupe en dollars et nombre de personnes : l'API ne renvoie
  // que les lieux accessibles avec `budget / people` par personne
  budget?: number;
  people?: number;
};

/**
 * Prix à afficher pour une annonce : le budget par personne s'il est renseigné
 * (« 15 – 40 $ / pers. »), sinon la gamme de prix libre.
 */
export function getPriceLabel(
  annonce: Pick<Annonce, 'budgetMin' | 'budgetMax' | 'priceRange'>
): string | undefined {
  const { budgetMin: min, budgetMax: max } = annonce;
  if (min === undefined && max === undefined) return annonce.priceRange;

  const range =
    min !== undefined && max !== undefined
      ? min === max
        ? `${min} $`
        : `${min} – ${max} $`
      : min !== undefined
        ? `dès ${min} $`
        : `jusqu'à ${max} $`;
  return `${range} / pers.`;
}

export type ListingRating = {
  // Arrondie au dixième par l'API ; 0 tant que personne n'a noté
  average: number;
  count: number;
};

export type Review = {
  id: string;
  listingId: string;
  userId: string;
  rating: number;
  comment: string | null;
  createdAt: string;
};

const NO_RATING: ListingRating = { average: 0, count: 0 };

// Listing tel que renvoyé par ApiExpress
export type ApiListing = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  address: string;
  categoryId: string;
  cityId: string | null;
  priceRange: string | null;
  budgetMin?: number | null;
  budgetMax?: number | null;
  attributes?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  category?: { id: string; name: string; slug: string };
  city?: Ville | null;
  images?: { id: string; url: string; order: number }[];
  owner?: { id: string; fullName: string };
  lat?: number | null;
  lng?: number | null;
  distance?: number;
  rating?: ListingRating;
};

export function toAnnonce(listing: ApiListing): Annonce {
  return {
    id: listing.id,
    slug: listing.slug,
    title: listing.name,
    description: listing.description ?? undefined,
    address: listing.address,
    priceRange: listing.priceRange ?? undefined,
    budgetMin: listing.budgetMin ?? undefined,
    budgetMax: listing.budgetMax ?? undefined,
    latitude: listing.lat ?? undefined,
    longitude: listing.lng ?? undefined,
    distance: listing.distance,
    attributes: listing.attributes ?? {},
    categoryId: listing.categoryId,
    villeId: listing.cityId ?? undefined,
    category: listing.category,
    ville: listing.city ?? undefined,
    images: (listing.images ?? []).map(({ id, url }) => ({ id, url })),
    owner: listing.owner,
    rating: listing.rating ?? NO_RATING,
    createdAt: listing.createdAt,
    updatedAt: listing.updatedAt,
  };
}

function toQuery(params: Record<string, string | number | undefined>): string {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      query.append(key, value.toString());
    }
  });
  return query.toString();
}

// GET /api/listings (filtres : categoryId, cityId) ou GET /api/listings/nearby si lat/lng
export async function getAnnonces(
  filters: AnnonceFilters = {}
): Promise<PaginatedResponse<Annonce>> {
  const { search, lat, lng, radius, ...rest } = filters;
  let result: PaginatedResponse<Annonce>;

  if (lat !== undefined && lng !== undefined) {
    // /nearby n'est pas paginé et ne renvoie ni images, ni catégorie, ni ville
    const query = toQuery({
      lat,
      lng,
      radius: radius !== undefined ? radius * 1000 : undefined,
      categoryId: rest.categoryId,
      budget: rest.budget,
      people: rest.people,
    });
    const listings = await apiRequest<ApiListing[]>(
      `/listings/nearby?${query}`
    );
    const data = listings.map(toAnnonce);
    result = {
      data,
      meta: { total: data.length, page: 1, limit: data.length, totalPages: 1 },
    };
  } else {
    const query = toQuery(rest);
    const page = await apiRequest<PaginatedResponse<ApiListing>>(
      `/listings${query ? `?${query}` : ''}`
    );
    result = { ...page, data: page.data.map(toAnnonce) };
  }

  const needle = search?.trim().toLowerCase();
  if (!needle) return result;

  return {
    ...result,
    data: result.data.filter(annonce =>
      [annonce.title, annonce.description, annonce.address].some(field =>
        field?.toLowerCase().includes(needle)
      )
    ),
  };
}

// GET /api/listings/{id}
export async function getAnnonceById(id: string): Promise<Annonce> {
  return toAnnonce(await apiRequest<ApiListing>(`/listings/${id}`));
}

// GET /api/listings/{id}/reviews/me — null si l'utilisateur n'a pas encore noté
export async function getMyReview(
  listingId: string,
  token: string
): Promise<Review | null> {
  return apiRequest<Review | null>(`/listings/${listingId}/reviews/me`, {
    token,
  });
}

// POST /api/listings/{id}/reviews — crée ou remplace la note de l'utilisateur
export async function rateListing(
  listingId: string,
  rating: number,
  token: string
): Promise<{ review: Review; summary: ListingRating }> {
  return apiRequest(`/listings/${listingId}/reviews`, {
    method: 'POST',
    body: { rating },
    token,
  });
}

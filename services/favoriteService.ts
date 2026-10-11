import { toAnnonce, type Annonce, type ApiListing } from './annonceService';
import { apiRequest } from './api';

// Favori tel que renvoyé par ApiExpress (GET /api/favorites/me)
type ApiFavorite = {
  id: string;
  listingId: string;
  createdAt: string;
  listing: ApiListing;
};

/** Annonces mises en favori par l'utilisateur, de la plus récente à la plus ancienne. */
export async function getMyFavorites(token: string): Promise<Annonce[]> {
  const favorites = await apiRequest<ApiFavorite[]>('/favorites/me', { token });
  return favorites.map(favorite => toAnnonce(favorite.listing));
}

/**
 * POST /api/favorites/listings/{id}/favorite — l'API bascule l'état (ajout ou
 * retrait) et renvoie l'état final, qui fait foi côté client.
 */
export async function toggleFavorite(
  listingId: string,
  token: string
): Promise<boolean> {
  const result = await apiRequest<{ isFavorite: boolean }>(
    `/favorites/listings/${listingId}/favorite`,
    { method: 'POST', token }
  );
  return result.isFavorite;
}

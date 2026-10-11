import { apiRequest } from './api';

export type Commune = {
  id: string;
  name: string;
  cityId: string;
};

// GET /api/locations/{id}/communes
export function getCommunes(cityId: string): Promise<Commune[]> {
  return apiRequest<Commune[]>(`/locations/${cityId}/communes`);
}

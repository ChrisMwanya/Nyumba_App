import { apiRequest } from './api';

export type Commune = {
  id: number;
  name: string;
  villeId: number;
};

export function getCommunes(villeId?: number): Promise<Commune[]> {
  const path = `/communes${villeId ? `?ville_id=${villeId}` : ''}`;
  return apiRequest<Commune[]>(path);
}

export function getCommuneById(id: number): Promise<Commune> {
  return apiRequest<Commune>(`/communes/${id}`);
}

import { apiRequest } from './api';
import { Ville } from './annonceService';

export function getVilles(): Promise<Ville[]> {
  return apiRequest<Ville[]>('/villes');
}

export function getVilleById(id: number): Promise<Ville> {
  return apiRequest<Ville>(`/villes/${id}`);
}

import { apiRequest } from './api';
import type { Ville } from './annonceService';

// GET /api/locations — liste des villes
export function getVilles(): Promise<Ville[]> {
  return apiRequest<Ville[]>('/locations');
}

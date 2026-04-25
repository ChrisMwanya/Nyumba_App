import { apiRequest } from './api';
import { Category } from './annonceService';

export function getCategories(): Promise<Category[]> {
  return apiRequest<Category[]>('/categories');
}

export function getCategoryById(id: number): Promise<Category> {
  return apiRequest<Category>(`/categories/${id}`);
}

import { apiRequest } from './api';
import type {
  Category,
  CategoryAttribute,
  PaginatedResponse,
} from './annonceService';

// GET /api/categories — paginé (10 par défaut, 100 au maximum)
export async function getCategories(): Promise<Category[]> {
  const page = await apiRequest<PaginatedResponse<Category>>(
    '/categories?limit=100'
  );
  return page.data.filter(category => category.isActive !== false);
}

// GET /api/categories/{slug}/attributes
export function getCategoryAttributes(
  slug: string
): Promise<CategoryAttribute[]> {
  return apiRequest<CategoryAttribute[]>(
    `/categories/${encodeURIComponent(slug)}/attributes`
  );
}

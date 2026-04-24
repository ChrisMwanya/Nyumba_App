const BASE_URL = (process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3333') + '/api/v1';


type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: object;
  token?: string;
};

export class ApiError extends Error {
  constructor(
    public status: number,
    public errors?: { message: string; rule: string; field: string }[],
    message = 'Une erreur est survenue.'
  ) {
    super(message);
  }
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, token } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const raw = await response.json().catch(() => ({}));

  // L'API Adonis wrappe les réponses dans { data: { ... } } via serialize()
  const data = raw?.data !== undefined ? raw.data : raw;

  if (!response.ok) {
    const message = data?.error ?? data?.message ?? raw?.message ?? 'Erreur serveur';
    throw new ApiError(response.status, data?.errors ?? raw?.errors, message);
  }

  return data as T;
}

export async function apiRequestMultipart<T>(path: string, formData: FormData, token?: string): Promise<T> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers,
    body: formData,
  });

  const raw = await response.json().catch(() => ({}));
  const data = raw?.data !== undefined ? raw.data : raw;

  if (!response.ok) {
    const message = data?.error ?? data?.message ?? raw?.message ?? 'Erreur serveur';
    throw new ApiError(response.status, data?.errors ?? raw?.errors, message);
  }

  return data as T;
}

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3333';


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

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new ApiError(response.status, data.errors, data.message ?? 'Erreur serveur');
  }

  return data as T;
}

// Retire le « / » final éventuel : sinon `…com//api/…` renvoie un 404.
const BASE_URL =
  (process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3333').replace(
    /\/+$/,
    ''
  ) + '/api';

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
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

// ApiExpress renvoie ses erreurs sous la forme { error: { message, details } },
// `details` contenant les issues Zod ({ path: ['body', 'champ'], message, code }).
type ZodIssue = { path?: (string | number)[]; message: string; code?: string };

function toApiError(status: number, raw: any): ApiError {
  const error = raw?.error;
  const message =
    (typeof error === 'string' ? error : error?.message) ??
    raw?.message ??
    'Erreur serveur';
  const details: ZodIssue[] | undefined = Array.isArray(error?.details)
    ? error.details
    : undefined;
  const errors = details?.map(issue => ({
    message: issue.message,
    rule: issue.code ?? '',
    field: String(issue.path?.[issue.path.length - 1] ?? ''),
  }));
  return new ApiError(status, errors, message);
}

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
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

  if (!response.ok) {
    throw toApiError(response.status, raw);
  }

  // Certaines routes wrappent leur réponse dans { data: ... } ;
  // la pagination retourne { data: [...], meta: {...} } et reste telle quelle.
  const data =
    raw?.data !== undefined && raw?.meta === undefined ? raw.data : raw;

  return data as T;
}

export async function apiRequestMultipart<T>(
  path: string,
  formData: FormData,
  token?: string
): Promise<T> {
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

  if (!response.ok) {
    throw toApiError(response.status, raw);
  }

  const data =
    raw?.data !== undefined && raw?.meta === undefined ? raw.data : raw;

  return data as T;
}

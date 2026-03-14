import { apiRequest } from './api';

export type AuthUser = {
  id: number;
  fullName: string;
  email: string;
  phone?: string;
  roleId: number;
  isActive: boolean;
  emailVerifiedAt: string | null;
  createdAt: string;
  updatedAt: string;
  role: { id: number; name: string };
};

export type TokenInfo = {
  type: string;
  token: string;
  expiresAt: string;
};

export type LoginResponse = {
  user: AuthUser;
  access_token: TokenInfo;
  refresh_token: TokenInfo;
};

export type RegisterResponse = {
  user: AuthUser;
  token: TokenInfo;
};

export type RefreshResponse = {
  access_token: TokenInfo;
};

// POST /auth/login
export function login(uid: string, password: string): Promise<LoginResponse> {
  return apiRequest<LoginResponse>('/auth/login', {
    method: 'POST',
    body: { email: uid, password }, // Identifiant envoyé comme 'email' pour le moment
  });
}

// POST /auth/register
export function register(payload: {
  fullName: string;
  email: string;
  phone?: string;
  password: string;
  password_confirmation: string;
}): Promise<RegisterResponse> {
  return apiRequest<RegisterResponse>('/auth/register', {
    method: 'POST',
    body: payload,
  });
}

// POST /auth/refresh
export function refreshToken(refresh_token: string): Promise<RefreshResponse> {
  return apiRequest<RefreshResponse>('/auth/refresh', {
    method: 'POST',
    body: { refresh_token },
  });
}

// POST /auth/logout
export function logout(accessToken: string): Promise<{ message: string }> {
  return apiRequest('/auth/logout', {
    method: 'POST',
    token: accessToken,
  });
}

// GET /auth/me
export function getMe(accessToken: string): Promise<{ user: AuthUser }> {
  return apiRequest('/auth/me', {
    method: 'GET',
    token: accessToken,
  });
}

// POST /auth/change-password (Future/Assumed)
export function changePassword(accessToken: string, payload: any): Promise<{ message: string }> {
  return apiRequest('/auth/change-password', {
    method: 'POST',
    token: accessToken,
    body: payload,
  });
}

// DELETE /auth/delete-account (Future/Assumed)
export function deleteAccount(accessToken: string): Promise<{ message: string }> {
  return apiRequest('/auth/delete-account', {
    method: 'DELETE',
    token: accessToken,
  });
}
// POST /auth/forgot-password
export function forgotPassword(uid: string): Promise<{ message: string }> {
  return apiRequest('/auth/forgot-password', {
    method: 'POST',
    body: { email: uid }, // Identifiant envoyé comme 'email' pour le moment
  });
}

// POST /auth/reset-password
export function resetPassword(payload: {
  email: string;
  token: string;
  password: string;
  password_confirmation: string;
}): Promise<{ message: string }> {
  return apiRequest('/auth/reset-password', {
    method: 'POST',
    body: payload,
  });
}

// POST /auth/verify-otp
export function verifyOtp(email: string, otp: string): Promise<{ message: string; user?: AuthUser; token?: TokenInfo }> {
  return apiRequest('/auth/verify-otp', {
    method: 'POST',
    body: { email, otp },
  });
}

// POST /auth/resend-otp
export function resendOtp(email: string): Promise<{ message: string }> {
  return apiRequest('/auth/resend-otp', {
    method: 'POST',
    body: { email },
  });
}

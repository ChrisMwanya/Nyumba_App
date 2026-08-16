import { apiRequest, apiRequestMultipart } from './api';

export type AuthUser = {
  id: number;
  firstName?: string;
  lastName?: string;
  fullName: string;
  email?: string;
  phone?: string;
  language?: string;
  profilePicture?: string;
  status: 'en_attente' | 'active' | 'suspendu';
  initials?: string;
  createdAt: string;
  updatedAt: string;
};

export type TokenInfo = {
  value: string;
  expiresAt: string;
  expiresIn: number;
};

export type LoginResponse = {
  user: AuthUser;
  token: TokenInfo;
};

// Réponse de POST /auth/signup
export type SignupUser = {
  id: number;
  fullName: string | null;
  email?: string;
  phone?: string;
  status: string;
  createdAt: string;
};

export type SignupResponse = {
  message: string;
  user: SignupUser;
  verificationMethod: 'email' | 'sms';
  destination: string;
};

// Réponse de POST /auth/verify-otp
export type VerifyOtpResponse = {
  token: TokenInfo;
  user: AuthUser;
};

export type RefreshResponse = {
  token: TokenInfo;
  user: AuthUser;
};

// POST /api/v1/auth/login
export function login(uid: string, password: string): Promise<LoginResponse> {
  return apiRequest<LoginResponse>('/auth/login', {
    method: 'POST',
    body: { email: uid, password },
  });
}

// POST /api/v1/auth/signup
export function signup(payload: {
  fullName: string;
  email: string;
  phone?: string;
  password: string;
  passwordConfirmation: string;
}): Promise<SignupResponse> {
  return apiRequest<SignupResponse>('/auth/signup', {
    method: 'POST',
    body: payload,
  });
}

// POST /api/v1/auth/refresh (🔒 Auth Requise)
export function refreshToken(accessToken: string): Promise<RefreshResponse> {
  return apiRequest<RefreshResponse>('/auth/refresh', {
    method: 'POST',
    token: accessToken,
  });
}

// POST /api/v1/account/logout
export function logout(accessToken: string): Promise<{ message: string }> {
  return apiRequest('/account/logout', {
    method: 'POST',
    token: accessToken,
  });
}

// GET /api/v1/account/profile — retourne le user directement (pas wrappé dans {user})
export function getMe(accessToken: string): Promise<AuthUser> {
  return apiRequest<AuthUser>('/account/profile', {
    method: 'GET',
    token: accessToken,
  });
}

// PUT /api/v1/account/profile
export function updateProfile(
  accessToken: string,
  payload: { 
    firstName?: string;
    lastName?: string;
    fullName?: string; 
    email?: string;
    phone?: string;
    language?: string;
  }
): Promise<{ message: string; user: AuthUser }> {
  return apiRequest('/account/profile', {
    method: 'PUT',
    token: accessToken,
    body: payload,
  });
}

// POST /api/v1/account/profile/picture
export function updateProfilePicture(
  accessToken: string,
  imageUri: string
): Promise<{ message: string; user: AuthUser }> {
  const formData = new FormData();
  
  // Extract filename and type from URI if possible, or use defaults
  const filename = imageUri.split('/').pop() || 'profile.jpg';
  const match = /\.(\w+)$/.exec(filename);
  const type = match ? `image/${match[1]}` : `image/jpeg`;

  formData.append('profilePicture', {
    uri: imageUri,
    name: filename,
    type,
  } as any);

  return apiRequestMultipart('/account/profile/picture', formData, accessToken);
}

// PUT /api/v1/auth/profile/password
export function changePassword(
  accessToken: string,
  payload: { currentPassword: string; password: string; passwordConfirmation: string }
): Promise<{ message: string }> {
  return apiRequest('/auth/profile/password', {
    method: 'PUT',
    token: accessToken,
    body: payload,
  });
}

// DELETE /api/v1/auth/delete-account
export function deleteAccount(accessToken: string): Promise<{ message: string }> {
  return apiRequest('/auth/delete-account', {
    method: 'DELETE',
    token: accessToken,
  });
}

// POST /api/v1/auth/forgot-password
export function forgotPassword(
  identifier: string,
  type: 'email' | 'phone' = 'email'
): Promise<{ message: string }> {
  const body = type === 'email' ? { email: identifier } : { phone: identifier };
  return apiRequest('/auth/forgot-password', {
    method: 'POST',
    body,
  });
}

// POST /api/v1/auth/reset-password
// L'API attend { email | phone, code, password, passwordConfirmation }
export function resetPassword(payload: {
  email?: string;
  phone?: string;
  code: string;
  password: string;
  passwordConfirmation: string;
}): Promise<{ message: string }> {
  return apiRequest('/auth/reset-password', {
    method: 'POST',
    body: payload,
  });
}

// POST /api/v1/auth/verify-otp
// L'API attend { email, code } ou { phone, code }
export function verifyOtp(
  identifier: string,
  otp: string,
  type: 'email' | 'sms'
): Promise<VerifyOtpResponse> {
  const body = type === 'email'
    ? { email: identifier, code: otp }
    : { phone: identifier, code: otp };
  return apiRequest<VerifyOtpResponse>('/auth/verify-otp', {
    method: 'POST',
    body,
  });
}

// POST /api/v1/auth/resend-otp
export function resendOtp(
  identifier: string,
  type: 'email' | 'sms'
): Promise<{ message: string }> {
  const body = type === 'email'
    ? { email: identifier }
    : { phone: identifier };
  return apiRequest('/auth/resend-otp', {
    method: 'POST',
    body,
  });
}

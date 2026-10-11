import { apiRequest } from './api';

// Profil renvoyé par GET /api/users/me
export type AuthUser = {
  id: string;
  fullName: string;
  email?: string | null;
  phone?: string | null;
  /** Photo de profil hébergée sur Cloudinary. */
  avatarUrl?: string | null;
  role: string;
  isVerified?: boolean;
  createdAt?: string;
};

/** Paramètres signés par l'API pour téléverser directement sur Cloudinary. */
export type UploadSignature = {
  cloudName: string;
  apiKey: string;
  folder: string;
  timestamp: number;
  signature: string;
};

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

// Réponse de POST /auth/login et /auth/refresh : le user ne contient que id/role/fullName
export type LoginResponse = {
  user: Pick<AuthUser, 'id' | 'role' | 'fullName'>;
  tokens: AuthTokens;
};

export type RefreshResponse = LoginResponse;

// Réponse de POST /auth/signup
export type SignupResponse = {
  message: string;
  userId: string;
};

// POST /api/auth/login — identifier : email ou téléphone (0812345678 ou +243812345678)
export function login(
  identifier: string,
  password: string
): Promise<LoginResponse> {
  return apiRequest<LoginResponse>('/auth/login', {
    method: 'POST',
    body: { identifier, password },
  });
}

// POST /api/auth/signup — email ou phone requis ; l'OTP part par email si fourni, par SMS sinon
export function signup(payload: {
  fullName: string;
  email?: string;
  phone?: string;
  password: string;
}): Promise<SignupResponse> {
  return apiRequest<SignupResponse>('/auth/signup', {
    method: 'POST',
    body: payload,
  });
}

// POST /api/auth/refresh — renouvelle aussi le refresh token
export function refreshToken(refreshToken: string): Promise<RefreshResponse> {
  return apiRequest<RefreshResponse>('/auth/refresh', {
    method: 'POST',
    body: { refreshToken },
  });
}

// POST /api/auth/logout (🔒 Auth Requise)
export function logout(accessToken: string): Promise<{ message: string }> {
  return apiRequest('/auth/logout', {
    method: 'POST',
    token: accessToken,
  });
}

// GET /api/users/me (🔒 Auth Requise)
export function getMe(accessToken: string): Promise<AuthUser> {
  return apiRequest<AuthUser>('/users/me', {
    method: 'GET',
    token: accessToken,
  });
}

// PATCH /api/users/me — nom et téléphone. L'email reste l'identifiant de
// connexion et n'est pas modifiable ; les autres champs (rôle, vérification)
// sont rejetés par l'API pour fermer les affectations en masse.
export function updateProfile(
  accessToken: string,
  payload: { fullName?: string; phone?: string | null }
): Promise<AuthUser> {
  return apiRequest<AuthUser>('/users/me', {
    method: 'PATCH',
    token: accessToken,
    body: payload,
  });
}

// POST /api/users/me/avatar/signature — 503 si Cloudinary n'est pas configuré.
export function getAvatarUploadSignature(
  accessToken: string
): Promise<UploadSignature> {
  return apiRequest<UploadSignature>('/users/me/avatar/signature', {
    method: 'POST',
    token: accessToken,
  });
}

// PUT /api/users/me/avatar — le fichier est déjà sur Cloudinary, on n'envoie
// que sa référence.
export function setAvatar(
  accessToken: string,
  payload: { url: string; publicId: string }
): Promise<AuthUser> {
  return apiRequest<AuthUser>('/users/me/avatar', {
    method: 'PUT',
    token: accessToken,
    body: payload,
  });
}

// DELETE /api/users/me/avatar
export function removeAvatar(accessToken: string): Promise<AuthUser> {
  return apiRequest<AuthUser>('/users/me/avatar', {
    method: 'DELETE',
    token: accessToken,
  });
}

// PUT /api/users/me/password — le mot de passe actuel est exigé par l'API :
// un jeton volé ne doit pas suffire à verrouiller le compte de son
// propriétaire. La confirmation de saisie est vérifiée côté app.
//
// L'API invalide au passage toutes les sessions et renvoie un couple de jetons
// neufs pour l'appareil appelant : ils doivent être adoptés (`applyTokens`),
// sinon l'utilisateur se déconnecte lui-même en changeant son mot de passe.
export function changePassword(
  accessToken: string,
  payload: { currentPassword: string; newPassword: string }
): Promise<{ message: string; tokens: AuthTokens }> {
  return apiRequest('/users/me/password', {
    method: 'PUT',
    token: accessToken,
    body: payload,
  });
}

// DELETE /api/users/me — suppression définitive. Le mot de passe est redemandé
// par l'API : un appareil déverrouillé ne suffit pas à détruire un compte.
export function deleteAccount(
  accessToken: string,
  password: string
): Promise<{ message: string }> {
  return apiRequest('/users/me', {
    method: 'DELETE',
    token: accessToken,
    body: { password },
  });
}

// POST /api/auth/forgot-password — code par SMS si l'identifiant est un numéro, par email sinon
export function forgotPassword(
  identifier: string
): Promise<{ message: string }> {
  return apiRequest('/auth/forgot-password', {
    method: 'POST',
    body: { identifier },
  });
}

// POST /api/auth/reset-password
export function resetPassword(payload: {
  identifier: string;
  otp: string;
  newPassword: string;
}): Promise<{ message: string }> {
  return apiRequest('/auth/reset-password', {
    method: 'POST',
    body: payload,
  });
}

// POST /api/auth/verify-otp — active le compte, ne renvoie pas de token
export function verifyOtp(
  identifier: string,
  otp: string
): Promise<{ message: string }> {
  return apiRequest('/auth/verify-otp', {
    method: 'POST',
    body: { identifier, otp },
  });
}

// POST /api/auth/resend-otp
export function resendOtp(identifier: string): Promise<{ message: string }> {
  return apiRequest('/auth/resend-otp', {
    method: 'POST',
    body: { identifier },
  });
}

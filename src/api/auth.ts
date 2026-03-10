import { AUTH_PREFIX } from './config';
import { apiRequest, apiRequestRaw } from './client';

export interface AuthUser {
  id: string;
  phoneNumber: string;
  role: string;
  username?: string;
  phoneNumberVerified?: boolean;
  emailVerified?: boolean;
  countryCode?: string;
  twoFactorEnabled?: boolean;
  kycStatus?: string;
  campaignCode?: string;
}

export interface SendCodeResponse {
  success: true;
  message: string;
  status: string;
}

export interface VerifyCodeResponseExisting {
  success: true;
  message: string;
  token: string;
  user: AuthUser;
}

export interface VerifyCodeResponseNewUser {
  success: true;
  message: string;
  isNewUser: true;
  verifiedPhoneNumber: string;
}

export type VerifyCodeResponse = VerifyCodeResponseExisting | VerifyCodeResponseNewUser;

export interface SignupResponse {
  success: true;
  message: string;
  token: string;
  user: AuthUser;
}

export interface LoginResponse {
  success: true;
  token: string;
  user: AuthUser;
  tokenInfo?: { expiresIn?: number; expiresAt?: string };
}

/** Extrait token et user de la réponse brute (plusieurs formats backend possibles). */
function normalizeAuthResponse(body: any): { token: string; user: AuthUser } {
  const token =
    body?.token ??
    body?.data?.token ??
    body?.accessToken ??
    body?.access_token;
  const user =
    body?.user ??
    body?.data?.user ??
    body?.data;
  if (!token || typeof token !== 'string') {
    if (typeof import.meta !== 'undefined' && (import.meta as any).dev) {
      console.warn('[Auth] Réponse login sans token:', body);
    }
    throw { success: false, message: 'Réponse du serveur invalide : token manquant.' };
  }
  const userObj = user && typeof user === 'object' ? user : { id: '', phoneNumber: '', role: 'USER_X' };
  // S'assurer que user.id existe (certains backends envoient _id)
  const normalizedUser: AuthUser = {
    ...userObj,
    id: userObj.id ?? userObj._id ?? '',
    phoneNumber: userObj.phoneNumber ?? '',
    role: userObj.role ?? 'USER_X',
  };
  return { token, user: normalizedUser };
}

/** Vérifie si le numéro existe déjà. 200 = disponible (inscription), 409 = existant (connexion). */
export async function verifyPhone(
  countryCode: string,
  phoneNumber: string
): Promise<{ exists: boolean }> {
  const national = phoneNumber.replace(/\D/g, '');
  const { res, body } = await apiRequestRaw(`${AUTH_PREFIX}/verify-phone`, {
    method: 'POST',
    body: JSON.stringify({ countryCode: countryCode || undefined, phoneNumber: national }),
    skipAuth: true,
  });
  if (res.status === 200) return { exists: false };
  if (res.status === 409) return { exists: true };
  const msg = body?.msg || body?.message || `Erreur ${res.status}`;
  throw { success: false, message: msg };
}

/** Inscription : envoi du code OTP par SMS (Twilio). Refuse si le numéro existe déjà ; limite 1 envoi / 2 min. */
export function initiatePhoneVerification(
  countryCode: string,
  phoneNumber: string
): Promise<{ success: true; message: string }> {
  const national = phoneNumber.replace(/\D/g, '');
  return apiRequest<{ success: true; message: string }>(
    `${AUTH_PREFIX}/initiate-phone-verification`,
    {
      method: 'POST',
      body: JSON.stringify({ countryCode: countryCode || undefined, phoneNumber: national }),
      skipAuth: true,
    }
  );
}

/** Connexion : envoi du code OTP (send-code). */
export function sendCode(countryCode: string, phoneNumber: string): Promise<SendCodeResponse> {
  const national = phoneNumber.replace(/\D/g, '');
  return apiRequest<SendCodeResponse>(`${AUTH_PREFIX}/send-code`, {
    method: 'POST',
    body: JSON.stringify({ countryCode: countryCode || undefined, phoneNumber: national }),
    skipAuth: true,
  });
}

export async function verifyCode(
  countryCode: string,
  phoneNumber: string,
  code: string
): Promise<VerifyCodeResponse> {
  const national = phoneNumber.replace(/\D/g, '');
  const body = await apiRequest<any>(`${AUTH_PREFIX}/verify-code`, {
    method: 'POST',
    body: JSON.stringify({
      countryCode: countryCode || undefined,
      phoneNumber: national,
      code: code.trim(),
    }),
    skipAuth: true,
  });
  if (body?.isNewUser ?? body?.data?.isNewUser) {
    return {
      success: true,
      message: body?.message ?? body?.data?.message ?? '',
      isNewUser: true,
      verifiedPhoneNumber: body?.verifiedPhoneNumber ?? body?.data?.verifiedPhoneNumber ?? '',
    };
  }
  const { token, user } = normalizeAuthResponse(body);
  return { success: true, message: body?.message ?? '', token, user };
}

export async function signup(params: {
  countryCode: string;
  phoneNumber: string;
  password: string;
  username: string;
  referralCode?: string;
  campaignCode?: string;
}): Promise<SignupResponse> {
  const national = params.phoneNumber.replace(/\D/g, '');
  const body = await apiRequest<any>(`${AUTH_PREFIX}/signup`, {
    method: 'POST',
    body: JSON.stringify({
      countryCode: params.countryCode || undefined,
      phoneNumber: national,
      password: params.password,
      username: params.username,
      ...(params.referralCode ? { referralCode: params.referralCode } : {}),
      ...(params.campaignCode ? { campaignCode: params.campaignCode } : {}),
    }),
    skipAuth: true,
  });
  const { token, user } = normalizeAuthResponse(body);
  return { success: true, message: body?.message ?? '', token, user };
}

/** Envoie un token de réinitialisation de mot de passe (code SMS 10 chars, valable 1h). */
export async function forgotPasswordToken(
  countryCode: string,
  phoneNumber: string
): Promise<{ success: boolean; message: string }> {
  const national = phoneNumber.replace(/\D/g, '');
  return apiRequest<{ success: boolean; message: string }>(`${AUTH_PREFIX}/forgotPasswordToken`, {
    method: 'POST',
    body: JSON.stringify({ countryCode: countryCode || undefined, phoneNumber: national }),
    skipAuth: true,
  });
}

/** Réinitialise le mot de passe avec le token reçu par SMS. */
export async function resetPassword(
  resetToken: string,
  password: string
): Promise<{ msg: string }> {
  return apiRequest<{ msg: string }>(`${AUTH_PREFIX}/reset-password`, {
    method: 'POST',
    body: JSON.stringify({ resetToken: resetToken.trim(), password }),
    skipAuth: true,
  });
}

/** Login : envoie le numéro national uniquement (sans indicatif), comme attendu par la plupart des APIs. */
export async function login(
  nationalPhoneNumber: string,
  password: string,
  deviceId?: string
): Promise<LoginResponse> {
  const phoneNumber = nationalPhoneNumber.replace(/\D/g, '');
  const body = await apiRequest<any>(`${AUTH_PREFIX}/login`, {
    method: 'POST',
    body: JSON.stringify({
      phoneNumber,
      password,
      ...(deviceId ? { deviceId } : {}),
    }),
    skipAuth: true,
  });
  const { token, user } = normalizeAuthResponse(body);
  return { success: true, token, user, tokenInfo: body?.tokenInfo ?? body?.data?.tokenInfo };
}

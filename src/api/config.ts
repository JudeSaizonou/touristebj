const BASE_URL =
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_BASE_URL) ||
  '/v2/api';

export const API_BASE = BASE_URL.replace(/\/$/, '');
export const AUTH_PREFIX = `${API_BASE}/auth`;
export const TRIPS_PREFIX = `${API_BASE}/trips`;

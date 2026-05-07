// Toujours en relatif : client.ts gère la résolution du host (primary Zepargn
// → LB fallback). Si on injectait une URL absolue ici, fetchWithFallback
// court-circuiterait le fallback (cf. cert cassé sur prodapi.zepargn.com).
export const API_BASE = '/v2/api';
export const AUTH_PREFIX = `${API_BASE}/auth`;
export const TRIPS_PREFIX = `${API_BASE}/trips`;

import { useState, useEffect, useCallback } from 'react';

export interface RouteInfo {
  path: string;
  params: Record<string, string>;
}

const routes: Array<{ pattern: RegExp; keys: string[]; path: string }> = [
  { pattern: /^\/$/,                            keys: [],           path: '/' },
  { pattern: /^\/voyage\/([^/]+)$/,             keys: ['id'],       path: '/voyage/:id' },
  { pattern: /^\/auth$/,                        keys: [],           path: '/auth' },
  { pattern: /^\/mes-voyages$/,                 keys: [],           path: '/mes-voyages' },
  { pattern: /^\/epargne\/([^/]+)$/,            keys: ['bookingId'],path: '/epargne/:bookingId' },
  { pattern: /^\/admin\/dashboard$/,            keys: [],           path: '/admin/dashboard' },
  { pattern: /^\/admin\/voyages$/,              keys: [],           path: '/admin/voyages' },
  { pattern: /^\/admin\/voyages\/new$/,         keys: [],           path: '/admin/voyages/new' },
  { pattern: /^\/admin\/voyages\/([^/]+)\/edit$/,keys: ['id'],      path: '/admin/voyages/:id/edit' },
  { pattern: /^\/admin\/reservations$/,         keys: [],           path: '/admin/reservations' },
  { pattern: /^\/admin\/voyageurs$/,            keys: [],           path: '/admin/voyageurs' },
  { pattern: /^\/admin\/parametres$/,           keys: [],           path: '/admin/parametres' },
];

function parseHash(): RouteInfo {
  const hash = window.location.hash.replace(/^#/, '') || '/';
  for (const route of routes) {
    const match = hash.match(route.pattern);
    if (match) {
      const params: Record<string, string> = {};
      route.keys.forEach((key, i) => {
        params[key] = match[i + 1] || '';
      });
      return { path: route.path, params };
    }
  }
  return { path: '/', params: {} };
}

export function useHashRouter() {
  const [route, setRoute] = useState<RouteInfo>(parseHash);

  useEffect(() => {
    const handleChange = () => setRoute(parseHash());
    window.addEventListener('hashchange', handleChange);
    return () => window.removeEventListener('hashchange', handleChange);
  }, []);

  const navigate = useCallback((path: string) => {
    window.location.hash = `#${path}`;
  }, []);

  return { route, navigate };
}

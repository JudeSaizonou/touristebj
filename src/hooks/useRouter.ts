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
  { pattern: /^\/admin\/reversements$/,         keys: [],           path: '/admin/reversements' },
  { pattern: /^\/admin\/parametres$/,           keys: [],           path: '/admin/parametres' },
];

function migrateHashUrl() {
  const hash = window.location.hash;
  if (hash && hash.startsWith('#/')) {
    const path = hash.replace(/^#/, '');
    window.history.replaceState(null, '', path);
  }
}

function parsePath(): RouteInfo {
  migrateHashUrl();
  const pathname = window.location.pathname || '/';
  for (const route of routes) {
    const match = pathname.match(route.pattern);
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

export function useRouter() {
  const [route, setRoute] = useState<RouteInfo>(parsePath);

  useEffect(() => {
    const handleChange = () => setRoute(parsePath());
    window.addEventListener('popstate', handleChange);
    return () => window.removeEventListener('popstate', handleChange);
  }, []);

  const navigate = useCallback((path: string) => {
    window.history.pushState(null, '', path);
    setRoute(parsePath());
  }, []);

  return { route, navigate };
}

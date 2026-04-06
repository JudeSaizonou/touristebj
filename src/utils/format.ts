/** Format a number as "1.500.000 FCFA" */
export const fmtPrice = (v: number) =>
  v.toLocaleString('fr-FR').replace(/\s/g, '.') + ' FCFA';

/** Compact format: 1.5M, 250K, 42 */
export const fmtCompact = (n: number) =>
  n >= 1e6 ? (n / 1e6).toFixed(1) + 'M' : n >= 1e3 ? (n / 1e3).toFixed(0) + 'K' : String(n);

/** Format ISO date → "06 avr. 2026, 14:30" */
export const fmtDate = (d?: string) =>
  d
    ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : '—';

/** Format ISO date → "6 avril 2026" (no time) */
export const fmtDateShort = (d?: string) =>
  d
    ? new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
    : '—';

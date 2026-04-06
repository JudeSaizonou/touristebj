// ─── Booking / Reservation statuses ──────────────────────────────────────────

export interface StatusEntry {
  label: string;
  color: string;   // text class
  bg: string;       // bg + border classes
  style: string;    // combined "bg-… text-… border-…"
}

const s = (label: string, color: string, bg: string): StatusEntry => ({
  label,
  color,
  bg,
  style: `${bg} ${color}`,
});

export const BOOKING_STATUS: Record<string, StatusEntry> = {
  PENDING_DEPOSIT: s('Acompte en attente', 'text-amber-700',   'bg-amber-50 border-amber-200'),
  DEPOSIT_PAID:    s('Acompte payé',       'text-blue-700',    'bg-blue-50 border-blue-200'),
  SAVING:          s('Épargne en cours',   'text-forest-800',  'bg-forest-800/5 border-forest-800/20'),
  IN_PROGRESS:     s('En cours',           'text-indigo-700',  'bg-indigo-50 border-indigo-200'),
  FULLY_PAID:      s('Voyage payé',        'text-green-700',   'bg-green-50 border-green-200'),
  COMPLETED:       s('Terminé',            'text-emerald-700', 'bg-emerald-50 border-emerald-200'),
  CANCELLED:       s('Annulé',             'text-red-600',     'bg-red-50 border-red-200'),
  REFUNDED:        s('Remboursé',          'text-gray-600',    'bg-gray-50 border-gray-200'),
};

/** Get booking status config with fallback */
export const getBookingStatus = (status: string): StatusEntry =>
  BOOKING_STATUS[status] ?? { label: status, color: 'text-gray-600', bg: 'bg-gray-50 border-gray-200', style: 'bg-gray-50 border-gray-200 text-gray-600' };

// ─── Payout statuses ─────────────────────────────────────────────────────────

export const PAYOUT_STATUS: Record<string, StatusEntry> = {
  PENDING:    s('En attente', 'text-amber-700', 'bg-amber-100 border-amber-200'),
  PROCESSING: s('En cours',  'text-blue-700',  'bg-blue-100 border-blue-200'),
  SUCCESS:    s('Traité',    'text-green-700',  'bg-green-100 border-green-200'),
  FAILED:     s('Échoué',    'text-red-700',    'bg-red-100 border-red-200'),
  CANCELLED:  s('Annulé',    'text-gray-700',   'bg-gray-100 border-gray-200'),
  // lowercase aliases from older API responses
  pending:    s('En attente', 'text-amber-700', 'bg-amber-100 border-amber-200'),
  approved:   s('Approuvé',   'text-blue-700',  'bg-blue-100 border-blue-200'),
  processed:  s('Traité',     'text-green-700', 'bg-green-100 border-green-200'),
  rejected:   s('Rejeté',     'text-red-700',   'bg-red-100 border-red-200'),
};

export const getPayoutStatus = (status: string): StatusEntry =>
  PAYOUT_STATUS[status] ?? { label: status, color: 'text-gray-600', bg: 'bg-gray-50 border-gray-200', style: 'bg-gray-50 border-gray-200 text-gray-600' };

// ─── Voyage statuses ─────────────────────────────────────────────────────────

export const VOYAGE_STATUS: Record<string, StatusEntry> = {
  'pause':    s('Pause',    'text-amber-600',  'bg-amber-100 border-amber-200'),
  'en-cours': s('En cours', 'text-purple-600', 'bg-purple-100 border-purple-200'),
  'complet':  s('Complet',  'text-gray-600',   'bg-gray-100 border-gray-200'),
};

// ─── Payment method labels ───────────────────────────────────────────────────

export const PAYMENT_METHOD_LABEL: Record<string, string> = {
  mtn: 'MTN MoMo',
  moov: 'Moov Money',
  kkiapay: 'KKiaPay',
  card: 'Carte bancaire',
};

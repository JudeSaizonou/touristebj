// Maps backend error codes from the trip co-management API to French UX messages.
// Fallback to the backend message, then to a generic default.

const CODE_MESSAGES: Record<string, string> = {
  TRIP_FORBIDDEN: 'Permission insuffisante pour cette action.',
  ALREADY_MANAGER: 'Cet utilisateur est déjà manager du voyage.',
  INVITE_PENDING: 'Une invitation est déjà en attente pour ce numéro.',
  INVALID_ROLE: 'Rôle invalide.',
  CANNOT_DEMOTE_OWNER: 'Impossible de rétrograder le propriétaire — utilisez "Transférer l\'ownership".',
  CANNOT_REMOVE_OWNER: 'Impossible de retirer le propriétaire — utilisez "Transférer l\'ownership".',
  TARGET_NOT_MANAGER: 'Cet utilisateur n\'est pas manager du voyage. Ajoutez-le d\'abord.',
  SELF_TRANSFER: 'Vous ne pouvez pas vous transférer l\'ownership à vous-même.',
  INVITATION_NOT_FOUND: 'Invitation introuvable ou lien invalide.',
  INVITATION_NOT_PENDING: 'Cette invitation a déjà été traitée.',
  INVITATION_EXPIRED: 'Invitation expirée — demandez-en une nouvelle.',
  INVITATION_FORBIDDEN: 'Cette invitation n\'est pas pour votre compte.',
  ONLY_OWNER_CAN_DELETE: 'Seul le propriétaire peut supprimer un voyage actif.',
  ACTIVE_BOOKINGS: 'Impossible de supprimer : des réservations actives existent. Vous pouvez plutôt annuler le voyage.',
};

export function getTripManagerErrorMessage(err: unknown, fallback = 'Une erreur est survenue.'): string {
  if (!err || typeof err !== 'object') return fallback;
  const e = err as { code?: string; message?: string };
  if (e.code && CODE_MESSAGES[e.code]) return CODE_MESSAGES[e.code];
  return e.message || fallback;
}

export function getTripManagerErrorCode(err: unknown): string | null {
  if (!err || typeof err !== 'object') return null;
  return (err as { code?: string }).code || null;
}

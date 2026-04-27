import { API_BASE, TRIPS_PREFIX } from './config';
import { apiRequest } from './client';

export type TripManagerRole = 'OWNER' | 'MANAGER' | 'READONLY';

export interface TripManager {
  userId: string;
  role: TripManagerRole;
  addedAt: string;
  addedBy?: string;
  // Enrichi côté front si besoin
  name?: string;
  phone?: string;
}

export interface ManagerInvitation {
  _id: string;
  tripId: string;
  tripTitle?: string;
  role: TripManagerRole;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  invitedPhoneNumber: string;
  invitedBy?: string;
  expiresAt: string;
  createdAt?: string;
}

interface ManagersResponse {
  success: boolean;
  managers: TripManager[];
}

// ─── Trip managers ─────────────────────────────────────────────────────────

export async function getTripManagers(tripId: string): Promise<TripManager[]> {
  const res = await apiRequest<ManagersResponse>(
    `${TRIPS_PREFIX}/partner/trips/${tripId}/managers`
  );
  return res.managers || [];
}

export async function inviteManager(
  tripId: string,
  body: { countryCode: string; phoneNumber: string; role: 'MANAGER' | 'READONLY' }
): Promise<ManagerInvitation> {
  const res = await apiRequest<{ success: boolean; invitation: ManagerInvitation }>(
    `${TRIPS_PREFIX}/partner/trips/${tripId}/managers/invite`,
    { method: 'POST', body: JSON.stringify(body) }
  );
  return res.invitation;
}

export async function updateManagerRole(
  tripId: string,
  userId: string,
  role: 'MANAGER' | 'READONLY'
): Promise<TripManager[]> {
  const res = await apiRequest<ManagersResponse>(
    `${TRIPS_PREFIX}/partner/trips/${tripId}/managers/${userId}`,
    { method: 'PATCH', body: JSON.stringify({ role }) }
  );
  return res.managers || [];
}

export async function removeManager(tripId: string, userId: string): Promise<TripManager[]> {
  const res = await apiRequest<ManagersResponse>(
    `${TRIPS_PREFIX}/partner/trips/${tripId}/managers/${userId}`,
    { method: 'DELETE' }
  );
  return res.managers || [];
}

export async function transferOwnership(tripId: string, userId: string): Promise<TripManager[]> {
  const res = await apiRequest<ManagersResponse>(
    `${TRIPS_PREFIX}/partner/trips/${tripId}/managers/transfer-ownership`,
    { method: 'POST', body: JSON.stringify({ userId }) }
  );
  return res.managers || [];
}

// ─── Invitations reçues (côté invité) ─────────────────────────────────────

export async function getMyManagerInvitations(): Promise<ManagerInvitation[]> {
  const res = await apiRequest<{ success: boolean; invitations: ManagerInvitation[] }>(
    `${API_BASE}/trip-manager-invitations`
  );
  return res.invitations || [];
}

export async function acceptManagerInvitation(
  token: string
): Promise<{ _id: string; title: string; role: TripManagerRole }> {
  const res = await apiRequest<{ success: boolean; trip: { _id: string; title: string; role: TripManagerRole } }>(
    `${API_BASE}/trip-manager-invitations/${token}/accept`,
    { method: 'POST' }
  );
  return res.trip;
}

export async function declineManagerInvitation(token: string): Promise<void> {
  await apiRequest<{ success: boolean }>(
    `${API_BASE}/trip-manager-invitations/${token}/decline`,
    { method: 'POST' }
  );
}

import { API_BASE, TRIPS_PREFIX } from './config';
import { apiRequest, apiRequestMultipart } from './client';

// Backend response types (simplified)
export type TripManagerRole = 'OWNER' | 'MANAGER' | 'READONLY';

export interface TripManagerBackend {
  userId: string | { _id?: string; id?: string; prenom?: string; nom?: string; username?: string; phoneNumber?: string; countryCode?: string };
  role: TripManagerRole;
  addedAt?: string;
}

export interface TripBackend {
  _id: string;
  title: string;
  description?: string;
  destination?: string;
  tripType?: string;
  departureDate?: string;
  returnDate?: string;
  totalPrice?: number;
  depositAmount?: number;
  paymentDeadlineDays?: number;
  allowInstallments?: boolean;
  minInstallmentAmount?: number;
  maxParticipants?: number;
  status?: string;
  images?: string[];
  itinerary?: Array<{ day?: number; title?: string; description?: string; city?: string }>;
  included?: string[];
  excluded?: string[];
  metadata?: Record<string, unknown>;
  partnerId?: { prenom?: string; nom?: string; email?: string; phoneNumber?: string };
  activeBookings?: number;
  availableSpots?: number;
  managers?: TripManagerBackend[];
  yourRole?: TripManagerRole;
}

export interface TripListResponse {
  success: boolean;
  trips: TripBackend[];
  pagination?: { page: number; limit: number; total: number; pages: number };
}

export interface TripDetailResponse {
  success: boolean;
  trip: TripBackend;
}

export interface VoyageurBackend {
  _id: string;
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  gender?: string;
  nationality?: string;
  email?: string;
  phoneNumber?: string;
  [key: string]: unknown;
}

export interface TripStatsResponse {
  success: boolean;
  data: {
    trip: { _id: string; title?: string; destination?: string; status?: string; maxParticipants?: number };
    stats: {
      totalBookings: number;
      bookingsByStatus: Record<string, number>;
      totalRevenue: number;
      totalDeposits: number;
      totalPending: number;
      occupancyRate: number;
      averageBookingValue: number;
    };
    travelers: Array<{
      odooBookingId?: string;
      odooInvoiceId?: string;
      userId: { firstName?: string; lastName?: string; phoneNumber?: string; email?: string };
      status: string;
      totalAmount: number;
      depositAmount: number;
      paidAmount: number;
      remainingAmount: number;
    }>;
  };
}

export interface DashboardStatsResponse {
  success: boolean;
  stats: {
    trips?: { total?: number; active?: number; draft?: number; completed?: number; cancelled?: number };
    bookings?: { total?: number; pendingDeposit?: number; depositPaid?: number; inProgress?: number; completed?: number; cancelled?: number };
    revenue?: { total?: number; deposits?: number; installments?: number; transactions?: number };
    pending?: { amount?: number; count?: number };
    overdue?: { amount?: number; bookings?: number };
    clients?: { total?: number };
    groups?: { total?: number; payAll?: number; split?: number };
    invitations?: { total?: number; pending?: number; accepted?: number; expired?: number };
    kpi?: {
      conversionRate?: number;
      averageBookingValue?: number;
      nextDeparture?: { title?: string; destination?: string; departureDate?: string };
      topDestinations?: Array<{ destination?: string; bookings?: number; revenue?: number }>;
    };
  };
}

export interface ChartsResponse {
  success: boolean;
  data: {
    revenueByMonth?: Array<{ year: number; month: number; total: number; count?: number }>;
    bookingsByStatus?: Array<{ status: string; count: number }>;
    tripsByDestination?: Array<{ destination: string; count: number }>;
  };
}

function calcDays(departure?: string, returnDate?: string): number {
  if (!departure || !returnDate) return 0;
  const diff = Math.round(
    (new Date(returnDate).getTime() - new Date(departure).getTime()) / (1000 * 60 * 60 * 24)
  );
  return Math.max(1, diff);
}

// Map backend trip to frontend voyage shape (id, titre, destination, prix string, etc.)
export function mapTripToVoyage(t: TripBackend): any {
  const id = t._id;
  const titre = t.title || '';
  const destination = t.destination || titre;
  const totalPrice = t.totalPrice ?? 0;
  const deposit = t.depositAmount ?? 0;
  const dateDebut = t.departureDate
    ? new Date(t.departureDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
    : '';
  const auteur =
    t.partnerId?.prenom || t.partnerId?.nom
      ? [t.partnerId.prenom, t.partnerId.nom].filter(Boolean).join(' ')
      : 'Admin';
  const statutMap: Record<string, string> = {
    ACTIVE: 'en-cours',
    DRAFT: 'pause',
    PAUSED: 'pause',
    FULL: 'complet',
    CANCELLED: 'complet',
    COMPLETED: 'complet',
  };
  const statut = statutMap[t.status || ''] || 'pause';
  const activeBookings = t.activeBookings ?? 0;
  const availableSpots = t.availableSpots ?? 0;
  const maxParticipants = t.maxParticipants ?? 0;
  const placesRestantes = `${availableSpots} sur ${maxParticipants || activeBookings + availableSpots}`;
  const nombreJours = calcDays(t.departureDate, t.returnDate);
  return {
    id,
    _id: id,
    titre,
    destination,
    pays: destination,
    dateDebut,
    auteur,
    statut,
    etat: statut,
    prix: totalPrice.toLocaleString('fr-FR'),
    devise: 'FCFA',
    acomptesRecus: deposit.toLocaleString('fr-FR') + ' FCFA',
    placesRestantes,
    description: t.description || '',
    photos: t.images?.length ? t.images : ['https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800'],
    ceQuiEstInclus: t.included || [],
    ceQuiNestPasInclus: t.excluded || [],
    itineraire: (t.itinerary || []).map((item) => ({
      jour: item.day,
      ville: item.city,
      titre: item.title,
      description: item.description,
    })),
    nombrePersonnes: String(t.maxParticipants || 0),
    totalPrice: t.totalPrice,
    depositAmount: t.depositAmount,
    status: t.status,
    activeBookings: t.activeBookings,
    availableSpots: t.availableSpots,
    paymentDeadlineDays: t.paymentDeadlineDays ?? 14,
    rawDepartureDate: t.departureDate || '',
    returnDate: t.returnDate || '',
    tripType: t.tripType || 'voyage',
    allowInstallments: t.allowInstallments ?? true,
    minInstallmentAmount: t.minInstallmentAmount ?? 5000,
    yourRole: t.yourRole,
    managers: t.managers,
    // Champs calculés / valeurs par défaut pour la vue publique
    acomptesPourcentage: 30,
    note: 4,
    nombreAvis: 0,
    nombreJours,
    duree: nombreJours ? `${nombreJours} jours` : '',
    minAge: 18,
    bedrooms: 2,
    conditionsPaiement: 'Acompte 30% + Solde par épargne',
    politiqueRemboursement: "L'acompte versé (30%) est non remboursable en cas de désistement. Le solde peut être payé par versements jusqu'à la date limite définie par l'organisateur.",
  };
}

export async function getVoyages(params?: {
  destination?: string;
  tripType?: string;
  page?: number;
  limit?: number;
}): Promise<{ voyages: any[]; pagination?: TripListResponse['pagination'] }> {
  const q = new URLSearchParams();
  if (params?.destination) q.set('destination', params.destination);
  if (params?.tripType) q.set('tripType', params.tripType);
  if (params?.page) q.set('page', String(params.page));
  if (params?.limit) q.set('limit', String(params.limit));
  const query = q.toString();
  const url = `${TRIPS_PREFIX}/trips/available${query ? `?${query}` : ''}`;
  const res = await apiRequest<TripListResponse>(url);
  const voyages = (res.trips || []).map(mapTripToVoyage);
  return { voyages, pagination: res.pagination };
}

export async function getVoyageById(voyageId: string): Promise<any> {
  const res = await apiRequest<TripDetailResponse>(`${TRIPS_PREFIX}/trips/${voyageId}`);
  return mapTripToVoyage(res.trip);
}

export async function getPartnerVoyageById(voyageId: string): Promise<any> {
  const res = await apiRequest<{ success: boolean; trip: TripBackend }>(`${TRIPS_PREFIX}/partner/trips/${voyageId}`);
  return mapTripToVoyage(res.trip);
}

export async function getPartnerVoyages(params?: {
  status?: string;
  page?: number;
  limit?: number;
}): Promise<{ voyages: any[]; pagination?: TripListResponse['pagination'] }> {
  const q = new URLSearchParams();
  if (params?.status) q.set('status', params.status);
  if (params?.page) q.set('page', String(params.page));
  if (params?.limit) q.set('limit', String(params.limit));
  const query = q.toString();
  const res = await apiRequest<TripListResponse>(`${TRIPS_PREFIX}/partner/trips${query ? `?${query}` : ''}`);
  return { voyages: (res.trips || []).map(mapTripToVoyage), pagination: res.pagination };
}

export async function createVoyage(body: {
  title: string;
  description?: string;
  destination?: string;
  tripType?: string;
  departureDate?: string;
  returnDate?: string;
  totalPrice?: number;
  depositAmount?: number;
  paymentDeadlineDays?: number;
  allowInstallments?: boolean;
  minInstallmentAmount?: number;
  maxParticipants?: number;
  images?: string[];
  itinerary?: Array<{ day?: number; title?: string; description?: string; activities?: string[] }>;
  included?: string[];
  excluded?: string[];
}): Promise<any> {
  const res = await apiRequest<{ success: boolean; trip: TripBackend }>(
    `${TRIPS_PREFIX}/partner/trips`,
    { method: 'POST', body: JSON.stringify(body) }
  );
  return mapTripToVoyage(res.trip);
}

export async function updateVoyage(voyageId: string, body: Partial<Parameters<typeof createVoyage>[0]>): Promise<any> {
  const res = await apiRequest<{ success: boolean; trip: TripBackend }>(
    `${TRIPS_PREFIX}/partner/trips/${voyageId}`,
    { method: 'PUT', body: JSON.stringify(body) }
  );
  return mapTripToVoyage(res.trip);
}

export async function activateVoyage(voyageId: string): Promise<any> {
  const res = await apiRequest<{ success: boolean; trip: TripBackend }>(
    `${TRIPS_PREFIX}/partner/trips/${voyageId}/activate`,
    { method: 'POST' }
  );
  return mapTripToVoyage(res.trip);
}

export async function cancelVoyage(voyageId: string, reason?: string): Promise<any> {
  const res = await apiRequest<{ success: boolean; trip: TripBackend }>(
    `${TRIPS_PREFIX}/partner/trips/${voyageId}/cancel`,
    { method: 'POST', body: JSON.stringify({ reason }) }
  );
  return mapTripToVoyage(res.trip);
}

export async function deleteVoyage(voyageId: string): Promise<void> {
  await apiRequest<{ success: boolean }>(`${TRIPS_PREFIX}/partner/trips/${voyageId}`, { method: 'DELETE' });
}

// ─── Trip co-managers ────────────────────────────────────────────────────

export interface MappedTripManager {
  userId: string;
  role: TripManagerRole;
  name: string;
  phoneNumber: string;
  addedAt?: string;
}

function mapTripManager(m: TripManagerBackend): MappedTripManager {
  const u = typeof m.userId === 'object' ? m.userId : null;
  const userId = u ? (u._id || u.id || '') : (m.userId as string);
  const phone = u?.phoneNumber
    ? `${u.countryCode ? '+' + u.countryCode + ' ' : ''}${u.phoneNumber}`
    : '';
  const name =
    [u?.prenom, u?.nom].filter(Boolean).join(' ') ||
    u?.username ||
    phone ||
    'Utilisateur';
  return {
    userId,
    role: m.role,
    name,
    phoneNumber: phone,
    addedAt: m.addedAt,
  };
}

export async function getTripManagers(tripId: string): Promise<{
  managers: MappedTripManager[];
  yourRole: TripManagerRole | null;
}> {
  const res = await apiRequest<{
    success: boolean;
    managers: TripManagerBackend[];
    yourRole?: TripManagerRole;
  }>(`${TRIPS_PREFIX}/partner/trips/${tripId}/managers`);
  return {
    managers: (res.managers || []).map(mapTripManager),
    yourRole: res.yourRole || null,
  };
}

export async function inviteTripManager(
  tripId: string,
  body: { countryCode: string; phoneNumber: string; role: 'MANAGER' | 'READONLY' }
): Promise<void> {
  const nationalPhone = body.phoneNumber.replace(/\D/g, '');
  await apiRequest<{ success: boolean }>(
    `${TRIPS_PREFIX}/partner/trips/${tripId}/managers/invite`,
    {
      method: 'POST',
      body: JSON.stringify({
        countryCode: body.countryCode,
        phoneNumber: nationalPhone,
        role: body.role,
      }),
    }
  );
}

export async function updateTripManagerRole(
  tripId: string,
  userId: string,
  role: 'MANAGER' | 'READONLY'
): Promise<void> {
  await apiRequest<{ success: boolean }>(
    `${TRIPS_PREFIX}/partner/trips/${tripId}/managers/${userId}`,
    { method: 'PATCH', body: JSON.stringify({ role }) }
  );
}

export async function removeTripManager(tripId: string, userId: string): Promise<void> {
  await apiRequest<{ success: boolean }>(
    `${TRIPS_PREFIX}/partner/trips/${tripId}/managers/${userId}`,
    { method: 'DELETE' }
  );
}

export async function transferTripOwnership(tripId: string, userId: string): Promise<void> {
  await apiRequest<{ success: boolean }>(
    `${TRIPS_PREFIX}/partner/trips/${tripId}/managers/transfer-ownership`,
    { method: 'POST', body: JSON.stringify({ userId }) }
  );
}

// ─── Manager invitations (invitee side) ───────────────────────────────────

export interface TripManagerInvitationBackend {
  _id: string;
  tripId: string | { _id: string; title?: string; destination?: string; images?: string[]; departureDate?: string };
  invitedBy?: { username?: string; prenom?: string; nom?: string; phoneNumber?: string };
  role: TripManagerRole;
  token: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  expiresAt?: string;
  createdAt?: string;
}

export interface MappedTripManagerInvitation {
  id: string;
  token: string;
  role: TripManagerRole;
  status: TripManagerInvitationBackend['status'];
  expiresAt?: string;
  createdAt?: string;
  invitedByName: string;
  trip: { id: string; title: string; destination: string; image?: string; departureDate?: string };
}

function mapTripManagerInvitation(inv: TripManagerInvitationBackend): MappedTripManagerInvitation {
  const tripObj = typeof inv.tripId === 'object' ? inv.tripId : null;
  const tripId = tripObj ? (tripObj._id || '') : (inv.tripId as string);
  const invitedByName =
    [inv.invitedBy?.prenom, inv.invitedBy?.nom].filter(Boolean).join(' ') ||
    inv.invitedBy?.username ||
    inv.invitedBy?.phoneNumber ||
    'Quelqu\'un';
  return {
    id: inv._id,
    token: inv.token,
    role: inv.role,
    status: inv.status,
    expiresAt: inv.expiresAt,
    createdAt: inv.createdAt,
    invitedByName,
    trip: {
      id: tripId,
      title: tripObj?.title || 'Voyage',
      destination: tripObj?.destination || '',
      image: tripObj?.images?.[0],
      departureDate: tripObj?.departureDate,
    },
  };
}

export async function getTripManagerInvitations(): Promise<MappedTripManagerInvitation[]> {
  const res = await apiRequest<{ success: boolean; invitations: TripManagerInvitationBackend[] }>(
    `${API_BASE}/trip-manager-invitations`
  );
  return (res.invitations || []).map(mapTripManagerInvitation);
}

export async function acceptTripManagerInvitation(token: string): Promise<void> {
  await apiRequest<{ success: boolean }>(
    `${API_BASE}/trip-manager-invitations/${token}/accept`,
    { method: 'POST' }
  );
}

export async function declineTripManagerInvitation(token: string): Promise<void> {
  await apiRequest<{ success: boolean }>(
    `${API_BASE}/trip-manager-invitations/${token}/decline`,
    { method: 'POST' }
  );
}

export async function uploadTripImages(tripId: string, files: File[]): Promise<string[]> {
  const formData = new FormData();
  files.forEach(f => formData.append('images', f));
  const res = await apiRequestMultipart<{ success: boolean; images: string[]; uploaded: string[] }>(
    `${TRIPS_PREFIX}/partner/trips/${tripId}/images`,
    formData
  );
  return res.images || res.uploaded || [];
}

export async function deleteTripImage(tripId: string, imageUrl: string): Promise<string[]> {
  const res = await apiRequest<{ success: boolean; images: string[] }>(
    `${TRIPS_PREFIX}/partner/trips/${tripId}/images`,
    { method: 'DELETE', body: JSON.stringify({ imageUrl }) }
  );
  return res.images || [];
}

export async function getVoyageStats(voyageId: string): Promise<{
  totalReservations: number;
  totalAcomptes: string;
  utilisateursEpargne: number;
  utilisateursFinances: number;
  montantAttente: string;
  totalPaiements: string;
}> {
  const res = await apiRequest<TripStatsResponse>(`${TRIPS_PREFIX}/partner/dashboard/trips/${voyageId}/stats`);
  const d = res.data;
  const s = d.stats;
  const fmt = (v: number) => v >= 1000000 ? (v / 1e6).toFixed(1) + 'M' : String(v);
  return {
    totalReservations: s.totalBookings,
    totalAcomptes: fmt(s.totalDeposits),
    utilisateursEpargne: s.bookingsByStatus?.['IN_PROGRESS'] ?? 0,
    utilisateursFinances: s.bookingsByStatus?.['COMPLETED'] ?? 0,
    montantAttente: fmt(s.totalPending),
    totalPaiements: fmt(s.totalRevenue),
  };
}

function mapBookingStatus(status: string): 'acompte-paye' | 'epargne-en-cours' | 'solde' | 'financement-accorde' | 'reservation-annulee' {
  switch (status) {
    case 'DEPOSIT_PAID': return 'acompte-paye';
    case 'IN_PROGRESS': return 'epargne-en-cours';
    case 'COMPLETED': return 'solde';
    case 'CANCELLED': return 'reservation-annulee';
    default: return 'acompte-paye';
  }
}

function mapPaymentMethod(b: any): 'epargne' | 'financement' | 'une-fois' | 'annule' {
  if (b.status === 'CANCELLED') return 'annule';
  if (b.isFullyPaid) return 'une-fois';
  if (b.payments && b.payments.length > 1) return 'epargne';
  return 'une-fois';
}

const fmtFCFA = (v: number) => v.toLocaleString('fr-FR') + ' FCFA';

interface TravelersResponse {
  success: boolean;
  trip?: any;
  travelers: Array<{
    _id: string;
    bookingNumber?: string;
    user: { _id?: string; prenom?: string; nom?: string; email?: string; phoneNumber?: string; countryCode?: string; profilePhoto?: string };
    numberOfParticipants?: number;
    contactInfo?: { email?: string; phoneNumber?: string; emergencyContact?: any };
    specialRequests?: string;
    status: string;
    totalAmount: number;
    depositAmount: number;
    depositPaid?: boolean;
    depositPaidAt?: string;
    amountPaid: number;
    remainingAmount: number;
    isFullyPaid?: boolean;
    isOverdue?: boolean;
    paymentDeadline?: string;
    createdAt?: string;
    payments?: Array<{ _id?: string; amount: number; paymentType?: string; paymentMethod?: string; transactionId?: string; createdAt?: string }>;
    pendingPayments?: any[];
  }>;
  pagination?: { page: number; limit: number; total: number; pages: number };
}

export async function getVoyageursByVoyage(voyageId: string, params?: {
  status?: string;
  paymentStatus?: string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: string;
}): Promise<any[]> {
  const q = new URLSearchParams();
  if (params?.status) q.set('status', params.status);
  if (params?.paymentStatus) q.set('paymentStatus', params.paymentStatus);
  if (params?.search) q.set('search', params.search);
  if (params?.page) q.set('page', String(params.page));
  if (params?.limit) q.set('limit', String(params.limit));
  if (params?.sortBy) q.set('sortBy', params.sortBy);
  if (params?.sortOrder) q.set('sortOrder', params.sortOrder);
  const qs = q.toString();
  const res = await apiRequest<TravelersResponse>(
    `${TRIPS_PREFIX}/partner/dashboard/trips/${voyageId}/travelers${qs ? '?' + qs : ''}`
  );
  const list = res.travelers || [];
  return list.map((t) => ({
    id: t._id,
    nom: [t.user?.prenom, t.user?.nom].filter(Boolean).join(' ') || 'Sans nom',
    date: t.createdAt ? new Date(t.createdAt).toLocaleDateString('fr-FR') : '',
    telephone: t.user?.phoneNumber ? (t.user.countryCode ? `+${t.user.countryCode}` : '') + t.user.phoneNumber : t.contactInfo?.phoneNumber || '',
    statutPaiement: mapBookingStatus(t.status),
    moyenUtilise: mapPaymentMethod(t),
    acomptesRecus: fmtFCFA(t.amountPaid),
    montantsRestants: fmtFCFA(t.remainingAmount),
    documents: {},
    // Extra fields for details modal
    email: t.user?.email || t.contactInfo?.email || '',
    bookingNumber: t.bookingNumber || '',
    totalAmount: t.totalAmount,
    depositAmount: t.depositAmount,
    amountPaid: t.amountPaid,
    remainingAmount: t.remainingAmount,
    isFullyPaid: t.isFullyPaid,
    isOverdue: t.isOverdue,
    paymentDeadline: t.paymentDeadline,
    numberOfParticipants: t.numberOfParticipants || 1,
    specialRequests: t.specialRequests,
    payments: t.payments || [],
    rawStatus: t.status,
  }));
}

export async function createVoyageur(
  voyageId: string,
  body: {
    firstName: string;
    lastName: string;
    dateOfBirth?: string;
    gender?: string;
    nationality?: string;
    email?: string;
    phoneNumber?: string;
  }
): Promise<any> {
  const res = await apiRequest<{ success: boolean; booking?: any }>(
    `${TRIPS_PREFIX}/partner/dashboard/trips/${voyageId}/travelers`,
    {
      method: 'POST',
      body: JSON.stringify({
        contactInfo: {
          email: body.email,
          phoneNumber: body.phoneNumber,
        },
        specialRequests: undefined,
      }),
    }
  );
  const b = res.booking;
  if (!b) return {};
  const u = b.userId || {};
  return {
    id: b._id,
    nom: [u.prenom, u.nom].filter(Boolean).join(' ') || [body.firstName, body.lastName].filter(Boolean).join(' ') || 'Sans nom',
    date: b.createdAt ? new Date(b.createdAt).toLocaleDateString('fr-FR') : '',
    telephone: u.phoneNumber || body.phoneNumber || '',
    statutPaiement: mapBookingStatus(b.status),
    moyenUtilise: 'une-fois' as const,
    acomptesRecus: fmtFCFA(b.amountPaid || 0),
    montantsRestants: fmtFCFA(b.remainingAmount || b.totalAmount || 0),
  };
}

export async function updateVoyageur(
  voyageId: string,
  voyageurId: string,
  body: {
    contactInfo?: { email?: string; phoneNumber?: string };
    specialRequests?: string;
    notes?: string;
    numberOfParticipants?: number;
  }
): Promise<any> {
  const res = await apiRequest<{ success: boolean; booking?: any }>(
    `${TRIPS_PREFIX}/partner/dashboard/trips/${voyageId}/travelers/${voyageurId}`,
    { method: 'PUT', body: JSON.stringify(body) }
  );
  const b = res.booking;
  if (!b) return {};
  const u = b.userId || {};
  return {
    id: b._id,
    nom: [u.prenom, u.nom].filter(Boolean).join(' ') || 'Sans nom',
    date: b.createdAt ? new Date(b.createdAt).toLocaleDateString('fr-FR') : '',
    telephone: u.phoneNumber || '',
    statutPaiement: mapBookingStatus(b.status),
    moyenUtilise: mapPaymentMethod(b),
    acomptesRecus: fmtFCFA(b.amountPaid || 0),
    montantsRestants: fmtFCFA(b.remainingAmount || 0),
  };
}

export async function deleteVoyageur(voyageId: string, voyageurId: string, reason?: string): Promise<void> {
  await apiRequest(
    `${TRIPS_PREFIX}/partner/dashboard/trips/${voyageId}/travelers/${voyageurId}`,
    { method: 'DELETE', body: JSON.stringify({ reason }) }
  );
}

export async function requestVoyageurDocuments(
  voyageId: string,
  voyageurId: string,
  documentTypes: string[],
  notes?: string
): Promise<any> {
  const res = await apiRequest<{ success: boolean; documentRequests?: any[] }>(
    `${TRIPS_PREFIX}/partner/dashboard/trips/${voyageId}/travelers/${voyageurId}/documents/request`,
    { method: 'POST', body: JSON.stringify({ documentTypes, notes }) }
  );
  return res.documentRequests;
}

export async function getVoyageurDocuments(
  voyageId: string,
  bookingId: string
): Promise<any[]> {
  const res = await apiRequest<{ success: boolean; documentRequests?: any[] }>(
    `${TRIPS_PREFIX}/partner/dashboard/trips/${voyageId}/travelers/${bookingId}/documents`
  );
  return res.documentRequests || [];
}

export async function reviewVoyageurDocument(
  voyageId: string,
  bookingId: string,
  documentId: string,
  action: 'approve' | 'reject',
  rejectionReason?: string
): Promise<any> {
  const body: Record<string, string> = { action };
  if (action === 'reject' && rejectionReason) body.rejectionReason = rejectionReason;
  const res = await apiRequest<{ success: boolean; document?: any }>(
    `${TRIPS_PREFIX}/partner/dashboard/trips/${voyageId}/travelers/${bookingId}/documents/${documentId}`,
    { method: 'PATCH', body: JSON.stringify(body) }
  );
  return res.document;
}

// ─── Messaging (admin → traveler) ──────────────────────────────────────────

export async function sendTravelerMessage(
  bookingId: string,
  data: { subject: string; message: string; attachments?: { url: string; filename: string }[] }
): Promise<{ success: boolean }> {
  return apiRequest<{ success: boolean }>(
    `${TRIPS_PREFIX}/partner/dashboard/travelers/${bookingId}/message`,
    { method: 'POST', body: JSON.stringify(data) }
  );
}

export async function uploadTravelerFiles(
  bookingId: string,
  files: File[]
): Promise<{ url: string; filename: string; size: number; mimetype: string }[]> {
  const formData = new FormData();
  files.forEach(f => formData.append('files', f));
  const res = await apiRequestMultipart<{ success: boolean; files: { url: string; filename: string; size: number; mimetype: string }[] }>(
    `${TRIPS_PREFIX}/partner/dashboard/travelers/${bookingId}/upload`,
    formData
  );
  return res.files || [];
}

export async function getAllVoyageurs(params?: {
  tripId?: string;
  status?: string;
  paymentStatus?: string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: string;
}): Promise<{ travelers: any[]; pagination: any }> {
  const q = new URLSearchParams();
  if (params?.tripId) q.set('tripId', params.tripId);
  if (params?.status) q.set('status', params.status);
  if (params?.paymentStatus) q.set('paymentStatus', params.paymentStatus);
  if (params?.search) q.set('search', params.search);
  if (params?.page) q.set('page', String(params.page));
  if (params?.limit) q.set('limit', String(params.limit));
  if (params?.sortBy) q.set('sortBy', params.sortBy);
  if (params?.sortOrder) q.set('sortOrder', params.sortOrder);
  const qs = q.toString();
  const res = await apiRequest<{
    success: boolean;
    travelers: Array<{
      _id: string;
      bookingNumber?: string;
      user: { prenom?: string; nom?: string; email?: string; phoneNumber?: string; countryCode?: string; profilePhoto?: string };
      trip: { _id: string; title?: string; destination?: string; departureDate?: string; totalPrice?: number; depositAmount?: number };
      numberOfParticipants?: number;
      status: string;
      totalAmount: number;
      depositAmount: number;
      depositPaid?: boolean;
      depositPaidAt?: string;
      amountPaid: number;
      remainingAmount: number;
      isFullyPaid?: boolean;
      isOverdue?: boolean;
      paymentDeadline?: string;
      payments?: any[];
    }>;
    pagination: any;
  }>(`${TRIPS_PREFIX}/partner/dashboard/travelers${qs ? '?' + qs : ''}`);
  return {
    travelers: (res.travelers || []).map((t) => ({
      id: t._id,
      bookingNumber: t.bookingNumber || '',
      nom: [t.user?.prenom, t.user?.nom].filter(Boolean).join(' ') || 'Sans nom',
      telephone: t.user?.phoneNumber ? (t.user.countryCode ? `+${t.user.countryCode}` : '') + t.user.phoneNumber : '',
      email: t.user?.email || '',
      profilePhoto: t.user?.profilePhoto || '',
      tripId: t.trip?._id || '',
      tripTitle: t.trip?.title || '',
      tripDestination: t.trip?.destination || '',
      tripDepartureDate: t.trip?.departureDate || '',
      status: t.status,
      statutPaiement: mapBookingStatus(t.status),
      moyenUtilise: mapPaymentMethod(t),
      totalAmount: t.totalAmount,
      depositAmount: t.depositAmount,
      amountPaid: t.amountPaid,
      remainingAmount: t.remainingAmount,
      acomptesRecus: fmtFCFA(t.amountPaid),
      montantsRestants: fmtFCFA(t.remainingAmount),
      isFullyPaid: t.isFullyPaid,
      isOverdue: t.isOverdue,
      paymentDeadline: t.paymentDeadline,
      numberOfParticipants: t.numberOfParticipants || 1,
      payments: t.payments || [],
    })),
    pagination: res.pagination || { page: 1, limit: 20, total: 0, pages: 1 },
  };
}

export async function getReservations(params?: {
  tripId?: string;
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<{ data: any[] }> {
  const q = new URLSearchParams();
  if (params?.tripId) q.set('tripId', params.tripId);
  if (params?.status) q.set('status', params.status);
  if (params?.search) q.set('search', params.search);
  if (params?.page) q.set('page', String(params.page));
  if (params?.limit) q.set('limit', String(params.limit));
  const query = q.toString();
  const res = await apiRequest<{ success: boolean; data?: any[]; bookings?: any[] }>(
    `${TRIPS_PREFIX}/partner/dashboard/bookings${query ? `?${query}` : ''}`
  );
  const list = res.data || res.bookings || [];
  return {
    data: list.map((r: any) => ({
      id: r._id || r.id,
      voyageId: typeof r.tripId === 'string' ? r.tripId : r.tripId?._id || '',
      voyageDestination: r.tripId?.destination || r.tripId?.title || '',
      type: 'reservation',
      nombrePersonnes: r.numberOfParticipants ?? r.nombrePersonnes ?? 1,
      montantTotal: r.totalAmount ?? 0,
      acompte: r.depositAmount ?? 0,
      date: r.createdAt ? new Date(r.createdAt).toLocaleDateString('fr-FR') : '',
      statut: r.status || 'PENDING_DEPOSIT',
    })),
  };
}

export interface TopDestination {
  destination: string;
  bookings: number;
  revenue: number;
}

export interface NextDeparture {
  title: string;
  destination: string;
  departureDate: string;
}

export interface DashboardKpi {
  conversionRate: number;
  averageBookingValue: number;
  nextDeparture?: NextDeparture;
  topDestinations?: TopDestination[];
}

export interface DashboardStats {
  trips: { total: number; active: number; draft: number; completed: number; cancelled: number };
  bookings: { total: number; pendingDeposit: number; depositPaid: number; inProgress: number; completed: number; cancelled: number };
  revenue: { total: number; deposits: number; installments: number; transactions: number };
  pending: { amount: number; count: number };
  overdue: { amount: number; bookings: number };
  clients: { total: number };
  groups?: { total: number; payAll: number; split: number };
  invitations?: { total: number; pending: number; accepted: number; expired: number };
  kpi?: DashboardKpi;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const res = await apiRequest<DashboardStatsResponse>(`${TRIPS_PREFIX}/partner/dashboard/stats`);
  const s = res.stats || {};
  return {
    trips: {
      total: s.trips?.total ?? 0,
      active: s.trips?.active ?? 0,
      draft: s.trips?.draft ?? 0,
      completed: s.trips?.completed ?? 0,
      cancelled: s.trips?.cancelled ?? 0,
    },
    bookings: {
      total: s.bookings?.total ?? 0,
      pendingDeposit: s.bookings?.pendingDeposit ?? 0,
      depositPaid: s.bookings?.depositPaid ?? 0,
      inProgress: s.bookings?.inProgress ?? 0,
      completed: s.bookings?.completed ?? 0,
      cancelled: s.bookings?.cancelled ?? 0,
    },
    revenue: {
      total: s.revenue?.total ?? 0,
      deposits: s.revenue?.deposits ?? 0,
      installments: s.revenue?.installments ?? 0,
      transactions: s.revenue?.transactions ?? 0,
    },
    pending: {
      amount: s.pending?.amount ?? 0,
      count: s.pending?.count ?? 0,
    },
    overdue: {
      amount: s.overdue?.amount ?? 0,
      bookings: s.overdue?.bookings ?? 0,
    },
    clients: { total: s.clients?.total ?? 0 },
    groups: s.groups ? {
      total: s.groups.total ?? 0,
      payAll: s.groups.payAll ?? 0,
      split: s.groups.split ?? 0,
    } : undefined,
    invitations: s.invitations ? {
      total: s.invitations.total ?? 0,
      pending: s.invitations.pending ?? 0,
      accepted: s.invitations.accepted ?? 0,
      expired: s.invitations.expired ?? 0,
    } : undefined,
    kpi: s.kpi ? {
      conversionRate: s.kpi.conversionRate ?? 0,
      averageBookingValue: s.kpi.averageBookingValue ?? 0,
      nextDeparture: s.kpi.nextDeparture?.title ? {
        title: s.kpi.nextDeparture.title,
        destination: s.kpi.nextDeparture.destination || '',
        departureDate: s.kpi.nextDeparture.departureDate || '',
      } : undefined,
      topDestinations: (s.kpi.topDestinations || []).map(d => ({
        destination: d.destination || '',
        bookings: d.bookings ?? 0,
        revenue: d.revenue ?? 0,
      })),
    } : undefined,
  };
}

export interface MonthlyPoint {
  month: string; // "Avr 25", "Mai 25", etc.
  revenue: number;
  deposits: number;
  installments: number;
  bookings: number;
  bookingsCancelled: number;
  bookingsCompleted: number;
}

const MONTHS_FR = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];

function buildMonthLabel(year: number, month: number): string {
  return `${MONTHS_FR[month - 1]} ${String(year).slice(2)}`;
}

function fillMonthlyGaps(
  rawRevenue: Array<{ year: number; month: number; revenue?: number; deposits?: number; installments?: number; transactions?: number }>,
  rawBookings: Array<{ year: number; month: number; total?: number; cancelled?: number; completed?: number }>,
  totalMonths: number
): MonthlyPoint[] {
  // Build lookup maps
  const revMap = new Map<string, typeof rawRevenue[0]>();
  rawRevenue.forEach(r => revMap.set(`${r.year}-${r.month}`, r));
  const bokMap = new Map<string, typeof rawBookings[0]>();
  rawBookings.forEach(b => bokMap.set(`${b.year}-${b.month}`, b));

  const now = new Date();
  const points: MonthlyPoint[] = [];
  for (let i = totalMonths - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const y = d.getFullYear();
    const m = d.getMonth() + 1;
    const key = `${y}-${m}`;
    const rev = revMap.get(key);
    const bok = bokMap.get(key);
    points.push({
      month: buildMonthLabel(y, m),
      revenue: rev?.revenue ?? 0,
      deposits: rev?.deposits ?? 0,
      installments: rev?.installments ?? 0,
      bookings: bok?.total ?? 0,
      bookingsCancelled: bok?.cancelled ?? 0,
      bookingsCompleted: bok?.completed ?? 0,
    });
  }
  return points;
}

export async function getMonthlyStats(months = 12): Promise<MonthlyPoint[]> {
  const res = await apiRequest<{
    success: boolean;
    revenue?: Array<{ year: number; month: number; revenue?: number; deposits?: number; installments?: number }>;
    bookings?: Array<{ year: number; month: number; total?: number; cancelled?: number; completed?: number }>;
  }>(`${TRIPS_PREFIX}/partner/dashboard/monthly-stats?months=${months}`);
  return fillMonthlyGaps(res.revenue || [], res.bookings || [], months);
}

export interface DashboardBooking {
  id: string;
  bookingNumber: string;
  client: { nom: string; telephone: string; email: string };
  voyage: { id: string; titre: string; destination: string; departureDate: string };
  nombrePersonnes: number;
  totalAmount: number;
  depositAmount: number;
  amountPaid: number;
  remainingAmount: number;
  depositPaid: boolean;
  isFullyPaid: boolean;
  isPaymentOverdue: boolean;
  paymentDeadline: string;
  status: string;
  createdAt: string;
  // Group fields
  paymentMode?: 'pay_all' | 'split' | null;
  groupId?: string | null;
  parentBookingId?: string | null;
  invitationStats?: { total: number; pending: number; accepted: number } | null;
}

export async function getDashboardBookings(params?: {
  tripId?: string;
  status?: string;
  search?: string;
  type?: string; // 'solo' | 'group' | 'invited'
  page?: number;
  limit?: number;
}): Promise<{ bookings: DashboardBooking[]; pagination?: any }> {
  const q = new URLSearchParams();
  if (params?.tripId) q.set('tripId', params.tripId);
  if (params?.status) q.set('status', params.status);
  if (params?.search) q.set('search', params.search);
  if (params?.type) q.set('bookingType', params.type);
  if (params?.page) q.set('page', String(params.page));
  if (params?.limit) q.set('limit', String(params.limit));
  const query = q.toString();
  const res = await apiRequest<{ success: boolean; bookings?: any[]; data?: any[]; pagination?: any }>(
    `${TRIPS_PREFIX}/partner/dashboard/bookings${query ? `?${query}` : ''}`
  );
  const list = res.bookings || res.data || [];
  return {
    bookings: list.map((r: any) => {
      const trip = typeof r.tripId === 'object' ? r.tripId : null;
      const user = typeof r.userId === 'object' ? r.userId : null;
      return {
        id: r._id || r.id || '',
        bookingNumber: r.bookingNumber || '',
        client: {
          nom: user ? [user.prenom, user.nom].filter(Boolean).join(' ') || user.username || user.phoneNumber || 'Client' : 'Client',
          telephone: user?.phoneNumber || '',
          email: user?.email || '',
        },
        voyage: {
          id: trip?._id || (typeof r.tripId === 'string' ? r.tripId : ''),
          titre: trip?.title || '',
          destination: trip?.destination || trip?.title || '',
          departureDate: trip?.departureDate ? new Date(trip.departureDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : '',
        },
        nombrePersonnes: r.numberOfParticipants ?? r.nombrePersonnes ?? 1,
        totalAmount: r.totalAmount ?? 0,
        depositAmount: r.depositAmount ?? 0,
        amountPaid: r.amountPaid ?? 0,
        remainingAmount: r.remainingAmount ?? 0,
        depositPaid: r.depositPaid ?? false,
        isFullyPaid: r.isFullyPaid ?? false,
        isPaymentOverdue: r.isPaymentOverdue ?? false,
        paymentDeadline: r.paymentDeadline ? new Date(r.paymentDeadline).toLocaleDateString('fr-FR') : '',
        status: r.status || 'PENDING_DEPOSIT',
        createdAt: r.createdAt ? new Date(r.createdAt).toLocaleDateString('fr-FR') : '',
        paymentMode: r.paymentMode || null,
        groupId: r.groupId || null,
        parentBookingId: r.parentBookingId || null,
        invitationStats: r.invitationStats || null,
      };
    }),
    pagination: res.pagination,
  };
}

// ─── Group Details (admin) ────────────────────────────────────────────────

export interface GroupDetail {
  groupId: string;
  paymentMode: 'pay_all' | 'split';
  organizer: {
    name: string;
    phone: string;
    email: string;
    bookingId: string;
    depositPaid: boolean;
    amountPaid: number;
  };
  invitations: Array<{
    id: string;
    guestName: string;
    guestEmail: string;
    status: string;
    acceptedAt: string | null;
    bookingId: string | null;
    depositPaid: boolean;
    amountPaid: number;
  }>;
  summary: {
    totalParticipants: number;
    confirmed: number;
    pending: number;
    totalCollected: number;
    totalExpected: number;
  };
}

export async function getGroupDetail(bookingId: string): Promise<GroupDetail> {
  const res = await apiRequest<{ success: boolean; group: GroupDetail }>(
    `${TRIPS_PREFIX}/partner/bookings/${bookingId}/group`
  );
  return res.group;
}

// ─── Bookings ────────────────────────────────────────────────────────────────

import type { MappedBooking, MappedPayment } from '../types';

export interface BookingBackend {
  _id: string;
  bookingNumber?: string;
  tripId?: string | TripBackend;
  userId?: string | object;
  participants?: number;
  nombrePersonnes?: number;
  numberOfParticipants?: number;
  totalAmount?: number;
  depositAmount?: number;
  depositPaid?: boolean;
  amountPaid?: number;
  remainingAmount?: number;
  isFullyPaid?: boolean;
  isPaymentOverdue?: boolean;
  paymentDeadline?: string;
  status?: string;
  createdAt?: string;
  payments?: PaymentBackend[];
  paymentMode?: 'pay_all' | 'split' | null;
  groupId?: string | null;
  invitationStats?: { total: number; pending: number; accepted: number };
}

export interface PaymentBackend {
  _id: string;
  bookingId?: string;
  amount?: number;
  type?: string;
  paymentType?: string;
  paymentMethod?: string;
  status?: string;
  transactionId?: string;
  createdAt?: string;
}

function mapBooking(b: BookingBackend): MappedBooking {
  const trip = typeof b.tripId === 'object' ? (b.tripId as TripBackend) : null;
  const totalAmount = b.totalAmount ?? 0;
  const depositAmount = b.depositAmount ?? Math.round(totalAmount * 0.5);

  // Calculate amountPaid / remainingAmount:
  // Priority order matters — backend flags AND status are authoritative.
  // Payment amounts may be net (after fees) while totalAmount is gross,
  // so we trust backend flags over local recalculation.
  let amountPaid: number;
  let remainingAmount: number;

  const fullyPaidByStatus = b.status === 'FULLY_PAID' || b.status === 'COMPLETED';

  if (b.isFullyPaid || fullyPaidByStatus) {
    amountPaid = totalAmount;
    remainingAmount = 0;
  } else if (!b.depositPaid && b.status === 'PENDING_DEPOSIT') {
    amountPaid = 0;
    remainingAmount = totalAmount;
  } else if (b.amountPaid != null) {
    amountPaid = b.amountPaid;
    remainingAmount = b.remainingAmount ?? Math.max(0, totalAmount - amountPaid);
  } else if (b.payments && b.payments.length > 0) {
    const successPayments = b.payments.filter(p => {
      const s = (p.status || '').toLowerCase();
      return s === 'success' || s === 'completed';
    });
    amountPaid = successPayments.reduce((sum, p) => sum + (p.amount ?? 0), 0);
    remainingAmount = Math.max(0, totalAmount - amountPaid);
  } else {
    amountPaid = 0;
    remainingAmount = totalAmount;
  }
  return {
    id: b._id,
    bookingNumber: b.bookingNumber,
    voyageId: trip?._id ?? (typeof b.tripId === 'string' ? b.tripId : ''),
    voyage: trip ? {
      titre: trip.title ?? '',
      destination: trip.destination ?? trip.title ?? '',
      departureDate: trip.departureDate
        ? new Date(trip.departureDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
        : '',
      rawDepartureDate: trip.departureDate,
      images: trip.images?.length ? trip.images : ['https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800'],
      paymentDeadlineDays: trip.paymentDeadlineDays ?? 14,
    } : undefined,
    nombrePersonnes: b.numberOfParticipants ?? b.nombrePersonnes ?? b.participants ?? 1,
    totalPrice: totalAmount,
    depositAmount,
    depositPaid: b.depositPaid,
    amountPaid,
    remainingAmount,
    isFullyPaid: b.isFullyPaid || fullyPaidByStatus,
    isPaymentOverdue: b.isPaymentOverdue,
    paymentDeadline: b.paymentDeadline ?? '',
    status: b.status ?? 'PENDING_DEPOSIT',
    createdAt: b.createdAt ?? '',
    payments: b.payments?.map(mapPayment),
    paymentMode: b.paymentMode,
    groupId: b.groupId,
    invitationStats: b.invitationStats,
  };
}

function mapPayment(p: PaymentBackend): MappedPayment {
  return {
    id: p._id,
    amount: p.amount ?? 0,
    type: p.paymentType ?? p.type ?? 'trip_installment',
    paymentMethod: p.paymentMethod,
    status: p.status ?? 'success',
    date: p.createdAt ? new Date(p.createdAt).toLocaleDateString('fr-FR') : '',
  };
}

export async function createBooking(
  tripId: string,
  numberOfParticipants: number,
  contactInfo?: {
    email?: string;
    phone?: string;
  },
  specialRequests?: string,
  paymentMode?: 'pay_all' | 'split'
): Promise<MappedBooking> {
  const body: Record<string, unknown> = { tripId, numberOfParticipants };
  if (contactInfo && Object.values(contactInfo).some(Boolean)) body.contactInfo = contactInfo;
  if (specialRequests?.trim()) body.specialRequests = specialRequests.trim();
  if (paymentMode && numberOfParticipants > 1) body.paymentMode = paymentMode;
  const res = await apiRequest<{ success: boolean; booking: BookingBackend }>(
    `${TRIPS_PREFIX}/bookings`,
    { method: 'POST', body: JSON.stringify(body) }
  );
  return mapBooking(res.booking);
}

export async function cancelBooking(bookingId: string, reason?: string): Promise<MappedBooking> {
  const res = await apiRequest<{ success: boolean; booking: BookingBackend }>(
    `${TRIPS_PREFIX}/bookings/${bookingId}/cancel`,
    { method: 'POST', body: JSON.stringify({ reason }) }
  );
  return mapBooking(res.booking);
}

export async function getMyBookings(params?: { status?: string; page?: number; limit?: number }): Promise<MappedBooking[]> {
  const q = new URLSearchParams();
  if (params?.status) q.set('status', params.status);
  if (params?.page) q.set('page', String(params.page));
  if (params?.limit) q.set('limit', String(params.limit));
  const query = q.toString();
  const res = await apiRequest<{ success: boolean; bookings?: BookingBackend[]; data?: BookingBackend[] }>(
    `${TRIPS_PREFIX}/bookings${query ? `?${query}` : ''}`
  );
  return ((res.bookings ?? res.data) || []).map(mapBooking);
}

export async function getBookingById(bookingId: string): Promise<MappedBooking> {
  const res = await apiRequest<{ success: boolean; booking: BookingBackend }>(
    `${TRIPS_PREFIX}/bookings/${bookingId}`
  );
  return mapBooking(res.booking);
}

export async function addPayment(
  bookingId: string,
  amount: number,
  type: 'DEPOSIT' | 'INSTALLMENT'
): Promise<{ booking: MappedBooking; payment: MappedPayment }> {
  const res = await apiRequest<{ success: boolean; booking: BookingBackend; payment: PaymentBackend }>(
    `${TRIPS_PREFIX}/bookings/${bookingId}/payments`,
    { method: 'POST', body: JSON.stringify({ amount, type }) }
  );
  return { booking: mapBooking(res.booking), payment: mapPayment(res.payment) };
}

export async function getBookingPayments(bookingId: string): Promise<MappedPayment[]> {
  const res = await apiRequest<{ success: boolean; booking: BookingBackend }>(
    `${TRIPS_PREFIX}/bookings/${bookingId}`
  );
  return (res.booking.payments || []).map(mapPayment);
}

// ─── Booking Messages & Documents (user-facing) ───────────────────────────

// Mapped types — normalized from backend response
export interface BookingMessage {
  id: string;
  subject: string;
  message: string;
  attachments?: { url: string; filename: string }[];
  sender?: string;
  senderRole?: string;
  read: boolean;
  sentAt: string;
}

export interface DocumentRequest {
  id: string;
  documentType: string;
  label: string;
  status: 'pending' | 'submitted' | 'approved' | 'rejected';
  requestedAt: string;
  submittedAt: string | null;
  reviewedAt: string | null;
  submittedUrl: string | null;
  notes: string | null;
  rejectionReason: string | null;
}

export async function getBookingMessages(bookingId: string): Promise<{ messages: BookingMessage[]; unreadCount: number }> {
  const res = await apiRequest<{ success: boolean; messages: any[]; unreadCount?: number }>(
    `${TRIPS_PREFIX}/bookings/${bookingId}/messages`
  );
  const messages = (res.messages || []).map((m: any) => ({
    id: m._id || m.id,
    subject: m.subject || '',
    message: m.message || '',
    attachments: m.attachments || [],
    sender: m.sender,
    senderRole: m.senderRole,
    read: m.read ?? m.isRead ?? false,
    sentAt: m.sentAt || m.createdAt || '',
  }));
  return {
    messages,
    unreadCount: res.unreadCount ?? messages.filter(m => !m.read).length,
  };
}

export async function getBookingDocumentRequests(bookingId: string): Promise<{
  documents: DocumentRequest[];
  summary: { total: number; pending: number; submitted: number; approved: number; rejected: number };
  trip?: { title: string; destination: string };
  bookingNumber?: string;
}> {
  const res = await apiRequest<{ success: boolean; documentRequests?: any[]; documents?: any[]; summary?: any; trip?: any; bookingNumber?: string }>(
    `${TRIPS_PREFIX}/bookings/${bookingId}/documents`
  );
  const list = res.documentRequests || res.documents || [];
  return {
    documents: list.map((d: any) => ({
      id: d._id || d.id,
      documentType: d.documentType || d.type || '',
      label: d.label || d.documentType || d.type || '',
      status: (d.status || 'pending').toLowerCase() as DocumentRequest['status'],
      requestedAt: d.requestedAt || d.createdAt || '',
      submittedAt: d.submittedAt || null,
      reviewedAt: d.reviewedAt || null,
      submittedUrl: d.submittedUrl || d.fileUrl || null,
      notes: d.notes || null,
      rejectionReason: d.rejectionReason || null,
    })),
    summary: res.summary || { total: list.length, pending: 0, submitted: 0, approved: 0, rejected: 0 },
    trip: res.trip,
    bookingNumber: res.bookingNumber,
  };
}

const DOC_LABELS: Record<string, string> = {
  PASSPORT: 'Passeport',
  ID_CARD: 'Copie pièce d\'identité',
  PHOTO: 'Photo d\'identité',
  passport: 'Passeport',
  id_card: 'Copie pièce d\'identité',
  photo: 'Photo d\'identité',
};

export function getDocumentLabel(doc: DocumentRequest): string {
  return doc.label || DOC_LABELS[doc.documentType] || doc.documentType;
}

export async function submitDocument(bookingId: string, documentId: string, file: File): Promise<{ success: boolean; status?: string }> {
  const formData = new FormData();
  formData.append('file', file);
  return apiRequestMultipart<{ success: boolean; status?: string }>(
    `${TRIPS_PREFIX}/bookings/${bookingId}/documents/${documentId}/submit`,
    formData
  );
}

export async function sendBookingMessage(bookingId: string, message: string): Promise<{ success: boolean }> {
  return apiRequest<{ success: boolean }>(
    `${TRIPS_PREFIX}/bookings/${bookingId}/messages`,
    { method: 'POST', body: JSON.stringify({ message }) }
  );
}

export async function markMessageRead(bookingId: string, messageId: string): Promise<void> {
  await apiRequest<{ success: boolean }>(
    `${TRIPS_PREFIX}/bookings/${bookingId}/messages/${messageId}/read`,
    { method: 'POST' }
  );
}

// ─── Payout (Reversement) ──────────────────────────────────────────────────

export interface PayoutBalance {
  totalRevenue: number;
  commission: number;
  commissionRate: number;
  totalPayouts: number;
  availableBalance: number;
}

export interface PayoutRequest {
  _id: string;
  amount: number;
  commission: number;
  netAmount: number;
  paymentMethod: string;
  status: string;
  transactionId?: string;
  approvedAt?: string;
  processedAt?: string;
  createdAt: string;
}

export async function getPayoutBalance(): Promise<PayoutBalance> {
  const res = await apiRequest<{ success: boolean; balance: PayoutBalance }>(
    `${TRIPS_PREFIX}/partner/payout/balance`
  );
  return res.balance;
}

export async function requestPayout(body: {
  amount: number;
  paymentMethod: string;
  phoneNumber?: string;
  countryCode?: string;
  notes?: string;
}): Promise<PayoutRequest> {
  const res = await apiRequest<{ success: boolean; message: string; payout: PayoutRequest }>(
    `${TRIPS_PREFIX}/partner/payout/request`,
    { method: 'POST', body: JSON.stringify(body) }
  );
  return res.payout;
}

export async function getPayoutHistory(params?: {
  status?: string;
  page?: number;
  limit?: number;
}): Promise<{ payouts: PayoutRequest[]; pagination?: any }> {
  const q = new URLSearchParams();
  if (params?.status) q.set('status', params.status);
  if (params?.page) q.set('page', String(params.page));
  if (params?.limit) q.set('limit', String(params.limit));
  const query = q.toString();
  const res = await apiRequest<{ success: boolean; payouts: PayoutRequest[]; pagination?: any }>(
    `${TRIPS_PREFIX}/partner/payout/history${query ? `?${query}` : ''}`
  );
  return { payouts: res.payouts || [], pagination: res.pagination };
}

// ─── Overdue & Pending ─────────────────────────────────────────────────────

export async function getOverdueBookings(params?: { page?: number; limit?: number }): Promise<{ bookings: DashboardBooking[]; pagination?: any }> {
  const q = new URLSearchParams();
  if (params?.page) q.set('page', String(params.page));
  if (params?.limit) q.set('limit', String(params.limit));
  const query = q.toString();
  const res = await apiRequest<{ success: boolean; bookings?: any[]; data?: any[]; pagination?: any }>(
    `${TRIPS_PREFIX}/partner/dashboard/overdue-bookings${query ? `?${query}` : ''}`
  );
  const list = res.bookings || res.data || [];
  return {
    bookings: list.map((r: any) => {
      const trip = typeof r.tripId === 'object' ? r.tripId : null;
      const user = typeof r.userId === 'object' ? r.userId : null;
      return {
        id: r._id || r.id || '',
        bookingNumber: r.bookingNumber || '',
        client: {
          nom: user ? [user.prenom, user.nom].filter(Boolean).join(' ') || user.username || user.phoneNumber || 'Client' : 'Client',
          telephone: user?.phoneNumber || '',
          email: user?.email || '',
        },
        voyage: {
          id: trip?._id || (typeof r.tripId === 'string' ? r.tripId : ''),
          titre: trip?.title || '',
          destination: trip?.destination || trip?.title || '',
          departureDate: trip?.departureDate ? new Date(trip.departureDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : '',
        },
        nombrePersonnes: r.numberOfParticipants ?? r.nombrePersonnes ?? 1,
        totalAmount: r.totalAmount ?? 0,
        depositAmount: r.depositAmount ?? 0,
        amountPaid: r.amountPaid ?? 0,
        remainingAmount: r.remainingAmount ?? 0,
        depositPaid: r.depositPaid ?? false,
        isFullyPaid: r.isFullyPaid ?? false,
        isPaymentOverdue: r.isPaymentOverdue ?? true,
        paymentDeadline: r.paymentDeadline ? new Date(r.paymentDeadline).toLocaleDateString('fr-FR') : '',
        status: r.status || 'IN_PROGRESS',
        createdAt: r.createdAt ? new Date(r.createdAt).toLocaleDateString('fr-FR') : '',
        daysOverdue: r.daysOverdue,
      } as DashboardBooking & { daysOverdue?: number };
    }),
    pagination: res.pagination,
  };
}

export async function getChartsData(): Promise<{ month: string; value: number }[]> {
  const res = await apiRequest<ChartsResponse>(`${TRIPS_PREFIX}/stats/charts`);
  const byMonth = res.data?.revenueByMonth || [];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  if (byMonth.length) {
    return byMonth.map((m) => ({
      month: months[(m.month || 1) - 1] || String(m.month),
      value: m.total || 0,
    }));
  }
  return months.map((month) => ({ month, value: 0 }));
}

// ─── Group Invitations ────────────────────────────────────────────────────

export interface InvitationBackend {
  _id: string;
  bookingId: string;
  tripId: string;
  trip?: TripBackend;
  invitedBy?: { username?: string; referralCode?: string };
  paymentMode: 'pay_all' | 'split';
  guestName: string;
  guestEmail: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  inviteToken: string;
  acceptedAt?: string;
  createdAt: string;
}

function mapInvitation(inv: InvitationBackend) {
  const trip = inv.trip;
  return {
    id: inv._id,
    bookingId: inv.bookingId,
    tripId: inv.tripId,
    trip: trip ? {
      title: trip.title || '',
      destination: trip.destination || '',
      totalPrice: trip.totalPrice ?? 0,
      depositAmount: trip.depositAmount ?? 0,
      images: trip.images || [],
      departureDate: trip.departureDate
        ? new Date(trip.departureDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
        : '',
    } : undefined,
    invitedBy: inv.invitedBy,
    paymentMode: inv.paymentMode,
    guestName: inv.guestName,
    guestEmail: inv.guestEmail,
    status: inv.status,
    inviteToken: inv.inviteToken,
    acceptedAt: inv.acceptedAt,
    createdAt: inv.createdAt,
  };
}

export type MappedInvitation = ReturnType<typeof mapInvitation>;

export async function inviteGuests(
  bookingId: string,
  invitees: { name: string; email: string }[]
): Promise<MappedInvitation[]> {
  const res = await apiRequest<{ success: boolean; invitations: InvitationBackend[] }>(
    `${TRIPS_PREFIX}/bookings/${bookingId}/invite`,
    { method: 'POST', body: JSON.stringify({ invitees }) }
  );
  return (res.invitations || []).map(mapInvitation);
}

export async function getInvitationByToken(token: string): Promise<MappedInvitation> {
  const res = await apiRequest<{ success: boolean; invitation: InvitationBackend }>(
    `${TRIPS_PREFIX}/invitations/${token}`,
    { skipAuth: true } as any
  );
  return mapInvitation(res.invitation);
}

export async function acceptInvitation(token: string): Promise<{ invitation: MappedInvitation; booking?: MappedBooking }> {
  const res = await apiRequest<{ success: boolean; invitation: InvitationBackend; booking?: BookingBackend }>(
    `${TRIPS_PREFIX}/invitations/${token}/accept`,
    { method: 'POST' }
  );
  return {
    invitation: mapInvitation(res.invitation),
    booking: res.booking ? mapBooking(res.booking) : undefined,
  };
}

export async function getMyInvitations(): Promise<MappedInvitation[]> {
  const res = await apiRequest<{ success: boolean; invitations: InvitationBackend[] }>(
    `${TRIPS_PREFIX}/invitations/mine`
  );
  return (res.invitations || []).map(mapInvitation);
}

export async function getBookingInvitations(bookingId: string): Promise<MappedInvitation[]> {
  const res = await apiRequest<{ success: boolean; invitations: InvitationBackend[] }>(
    `${TRIPS_PREFIX}/bookings/${bookingId}/invitations`
  );
  return (res.invitations || []).map(mapInvitation);
}

export async function resendInvitation(
  bookingId: string,
  invitee: { name: string; email: string }
): Promise<MappedInvitation[]> {
  const res = await apiRequest<{ success: boolean; invitations: InvitationBackend[] }>(
    `${TRIPS_PREFIX}/bookings/${bookingId}/invite`,
    { method: 'POST', body: JSON.stringify({ invitees: [invitee] }) }
  );
  return (res.invitations || []).map(mapInvitation);
}

// ─── Partner Notifications ───────────────────────────────────────────────

export interface PartnerNotification {
  _id: string;
  type: 'new_booking' | 'payment_received' | 'payment_overdue' | 'payout_processed' | 'partner_payout' | 'booking_cancelled' | 'invitation_accepted';
  title: string;
  message: string;
  bookingId?: string;
  read: boolean;
  createdAt: string;
}

export async function getPartnerNotifications(params?: {
  page?: number;
  limit?: number;
  read?: boolean;
}): Promise<{ notifications: PartnerNotification[]; unreadCount: number; pagination?: any }> {
  const q = new URLSearchParams();
  if (params?.page) q.set('page', String(params.page));
  if (params?.limit) q.set('limit', String(params.limit));
  if (params?.read !== undefined) q.set('read', String(params.read));
  const query = q.toString();
  const res = await apiRequest<{
    success: boolean;
    notifications: PartnerNotification[];
    unreadCount: number;
    pagination?: any;
  }>(`${TRIPS_PREFIX}/partner/notifications${query ? `?${query}` : ''}`);
  return {
    notifications: res.notifications || [],
    unreadCount: res.unreadCount ?? 0,
    pagination: res.pagination,
  };
}

export async function markNotificationRead(id: string): Promise<void> {
  await apiRequest<{ success: boolean }>(
    `${TRIPS_PREFIX}/partner/notifications/${id}/read`,
    { method: 'PUT' }
  );
}

export async function markAllNotificationsRead(): Promise<number> {
  const res = await apiRequest<{ success: boolean; modifiedCount: number }>(
    `${TRIPS_PREFIX}/partner/notifications/read-all`,
    { method: 'PUT' }
  );
  return res.modifiedCount ?? 0;
}

// ─── Partner Conversations (Messages) ────────────────────────────────────

export interface PartnerConversation {
  bookingId: string;
  client: {
    name: string;
    phone: string;
    email: string;
  };
  tripTitle: string;
  lastMessage: {
    subject: string;
    message: string;
    sentAt: string;
    sender: 'partner' | 'system';
    read: boolean;
  };
  unreadCount: number;
  totalMessages: number;
}

export async function getPartnerConversations(params?: {
  page?: number;
  limit?: number;
}): Promise<{ conversations: PartnerConversation[]; pagination?: any }> {
  const q = new URLSearchParams();
  if (params?.page) q.set('page', String(params.page));
  if (params?.limit) q.set('limit', String(params.limit));
  const query = q.toString();
  const res = await apiRequest<{
    success: boolean;
    conversations: PartnerConversation[];
    pagination?: any;
  }>(`${TRIPS_PREFIX}/partner/messages${query ? `?${query}` : ''}`);
  return {
    conversations: res.conversations || [],
    pagination: res.pagination,
  };
}

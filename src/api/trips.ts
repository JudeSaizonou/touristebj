import { TRIPS_PREFIX } from './config';
import { apiRequest } from './client';

// Backend response types (simplified)
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
    voyage: { _id: string; title?: string; destination?: string; status?: string };
    bookings?: { total?: number; byStatus?: Record<string, number> };
    voyageurs?: number;
    revenue?: { total?: number; transactions?: number };
  };
}

export interface DashboardStatsResponse {
  success: boolean;
  stats: {
    trips?: { total?: number; active?: number; draft?: number; cancelled?: number };
    bookings?: {
      total?: number;
      pendingDeposit?: number;
      depositPaid?: number;
      inProgress?: number;
      completed?: number;
      cancelled?: number;
    };
    revenue?: {
      total?: number;
      deposits?: number;
      installments?: number;
      totalTransactions?: number;
    };
    pending?: { amount?: number; count?: number };
    overdue?: { amount?: number; bookings?: number };
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
    // Champs calculés / valeurs par défaut pour la vue publique
    acomptesPourcentage: 50,
    note: 4,
    nombreAvis: 0,
    nombreJours,
    duree: nombreJours ? `${nombreJours} jours` : '',
    minAge: 18,
    bedrooms: 2,
    conditionsPaiement: 'Acompte 50% + Solde par épargne',
    politiqueRemboursement: "L'acompte versé (50%) est non remboursable en cas de désistement. Le solde peut être payé par versements jusqu'à la date limite définie par l'organisateur.",
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
  itinerary?: Array<{ day?: number; title?: string; description?: string; city?: string }>;
  included?: string[];
  excluded?: string[];
  metadata?: Record<string, unknown>;
}): Promise<any> {
  const res = await apiRequest<{ success: boolean; trip: TripBackend }>(
    `${TRIPS_PREFIX}/trips`,
    { method: 'POST', body: JSON.stringify(body) }
  );
  return mapTripToVoyage(res.trip);
}

export async function updateVoyage(voyageId: string, body: Partial<Parameters<typeof createVoyage>[0]>): Promise<any> {
  const res = await apiRequest<{ success: boolean; trip: TripBackend }>(
    `${TRIPS_PREFIX}/trips/${voyageId}`,
    { method: 'PUT', body: JSON.stringify(body) }
  );
  return mapTripToVoyage(res.trip);
}

export async function deleteVoyage(voyageId: string): Promise<void> {
  await apiRequest<{ success: boolean }>(`${TRIPS_PREFIX}/trips/${voyageId}`, { method: 'DELETE' });
}

export async function getVoyageStats(voyageId: string): Promise<{
  totalReservations: number;
  totalAcomptes: string;
  utilisateursEpargne: number;
  utilisateursFinances: number;
  montantAttente: string;
  totalPaiements: string;
}> {
  const res = await apiRequest<TripStatsResponse>(`${TRIPS_PREFIX}/trips/${voyageId}/stats`);
  const d = res.data;
  const totalReservations = d.bookings?.total ?? d.voyageurs ?? 0;
  const totalAcomptes = (d.revenue?.total ?? 0) >= 1000000 ? (d.revenue!.total! / 1e6).toFixed(1) + 'M' : String(d.revenue?.total ?? 0);
  const montantAttente = '0';
  return {
    totalReservations,
    totalAcomptes,
    utilisateursEpargne: 0,
    utilisateursFinances: 0,
    montantAttente,
    totalPaiements: totalAcomptes,
  };
}

export async function getVoyageursByVoyage(voyageId: string): Promise<any[]> {
  const res = await apiRequest<{ success: boolean; data?: VoyageurBackend[] }>(
    `${TRIPS_PREFIX}/trips/${voyageId}/voyageurs`
  );
  const list = res.data || [];
  return list.map((v) => ({
    id: v._id,
    nom: [v.firstName, v.lastName].filter(Boolean).join(' ') || 'Sans nom',
    date: v.dateOfBirth ? new Date(v.dateOfBirth).toLocaleDateString('fr-FR') : '',
    telephone: v.phoneNumber || '',
    statutPaiement: 'acompte-paye',
    moyenUtilise: 'une-fois',
    acomptesRecus: '0 FCFA',
    montantsRestants: '0 FCFA',
    documents: {},
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
  const res = await apiRequest<{ success: boolean; data?: VoyageurBackend }>(
    `${TRIPS_PREFIX}/trips/${voyageId}/voyageurs`,
    { method: 'POST', body: JSON.stringify(body) }
  );
  const v = res.data;
  if (!v) return {};
  return {
    id: v._id,
    nom: [v.firstName, v.lastName].filter(Boolean).join(' ') || 'Sans nom',
    date: v.dateOfBirth ? new Date(v.dateOfBirth).toLocaleDateString('fr-FR') : '',
    telephone: v.phoneNumber || '',
    statutPaiement: 'acompte-paye',
    moyenUtilise: 'une-fois',
    acomptesRecus: '0 FCFA',
    montantsRestants: '0 FCFA',
  };
}

export async function updateVoyageur(
  voyageId: string,
  voyageurId: string,
  body: Partial<Parameters<typeof createVoyageur>[1]>
): Promise<any> {
  const res = await apiRequest<{ success: boolean; data?: VoyageurBackend }>(
    `${TRIPS_PREFIX}/trips/${voyageId}/voyageurs/${voyageurId}`,
    { method: 'PUT', body: JSON.stringify(body) }
  );
  const v = res.data;
  if (!v) return {};
  return {
    id: v._id,
    nom: [v.firstName, v.lastName].filter(Boolean).join(' ') || 'Sans nom',
    date: v.dateOfBirth ? new Date(v.dateOfBirth).toLocaleDateString('fr-FR') : '',
    telephone: v.phoneNumber || '',
    statutPaiement: 'acompte-paye',
    moyenUtilise: 'une-fois',
    acomptesRecus: '0 FCFA',
    montantsRestants: '0 FCFA',
  };
}

export async function deleteVoyageur(voyageId: string, voyageurId: string): Promise<void> {
  await apiRequest(`${TRIPS_PREFIX}/trips/${voyageId}/voyageurs/${voyageurId}`, { method: 'DELETE' });
}

export async function requestVoyageurDocuments(
  voyageId: string,
  voyageurId: string,
  documentTypes: string[],
  notes?: string
): Promise<any> {
  const res = await apiRequest<{ success: boolean; data?: VoyageurBackend }>(
    `${TRIPS_PREFIX}/trips/${voyageId}/voyageurs/${voyageurId}/documents/request`,
    { method: 'POST', body: JSON.stringify({ documentTypes, notes }) }
  );
  return res.data;
}

export async function getAllVoyageurs(): Promise<{ voyageur: any; voyageId: string; voyageDestination: string }[]> {
  const res = await apiRequest<{ success: boolean; data?: Array<{ _id: string; tripId?: string; voyageDestination?: string; firstName?: string; lastName?: string; [k: string]: unknown }> }>(
    `${TRIPS_PREFIX}/voyageurs`
  );
  const list = res.data || [];
  return list.map((row) => ({
    voyageur: {
      id: row._id,
      nom: [row.firstName, row.lastName].filter(Boolean).join(' ') || 'Sans nom',
      telephone: (row as any).phoneNumber || '',
      statutPaiement: 'acompte-paye',
      moyenUtilise: 'une-fois',
      acomptesRecus: '0 FCFA',
      montantsRestants: '0 FCFA',
    },
    voyageId: row.tripId || '',
    voyageDestination: row.voyageDestination || '',
  }));
}

export async function getReservations(params?: {
  tripId?: string;
  status?: string;
  page?: number;
  limit?: number;
}): Promise<{ data: any[] }> {
  const q = new URLSearchParams();
  if (params?.tripId) q.set('tripId', params.tripId);
  if (params?.status) q.set('status', params.status);
  if (params?.page) q.set('page', String(params.page));
  if (params?.limit) q.set('limit', String(params.limit));
  const query = q.toString();
  const res = await apiRequest<{ success: boolean; data?: any[]; bookings?: any[] }>(
    `${TRIPS_PREFIX}/reservations${query ? `?${query}` : ''}`
  );
  const list = res.data || res.bookings || [];
  return {
    data: list.map((r: any) => ({
      id: r._id || r.id,
      voyageId: r.tripId || r.voyageId,
      voyageDestination: r.voyageDestination || r.trip?.destination || '',
      type: 'reservation',
      nombrePersonnes: r.nombrePersonnes ?? r.participants ?? 1,
      montantTotal: r.montantTotal ?? r.totalAmount ?? 0,
      acompte: r.acompte ?? r.depositAmount ?? 0,
      date: r.date || (r.createdAt ? new Date(r.createdAt).toLocaleDateString('fr-FR') : ''),
      statut: r.statut || r.status || 'confirmee',
    })),
  };
}

export async function getDashboardStats(): Promise<{
  totalVoyages: number;
  totalReservations: number;
  totalAcomptes: string;
  utilisateursEpargne: number;
  utilisateursFinances: number;
  montantAttente: string;
  totalPaiements: string;
}> {
  const res = await apiRequest<DashboardStatsResponse>(`${TRIPS_PREFIX}/stats/dashboard`);
  const s = res.stats || {};
  const fmt = (n: number) => (n >= 1e6 ? (n / 1e6).toFixed(1) + 'M' : n >= 1e3 ? (n / 1e3).toFixed(0) + 'K' : String(n));
  return {
    totalVoyages: s.trips?.total ?? 0,
    totalReservations: s.bookings?.total ?? 0,
    totalAcomptes: fmt(s.revenue?.total ?? 0),
    utilisateursEpargne: 0,
    utilisateursFinances: 0,
    montantAttente: fmt(s.pending?.amount ?? 0),
    totalPaiements: fmt(s.revenue?.totalTransactions ?? s.revenue?.total ?? 0),
  };
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
  // remainingAmount est la source de vérité ; amountPaid en est déduit
  const remainingAmount = b.remainingAmount ?? Math.max(0, totalAmount - (b.amountPaid ?? 0));
  const amountPaid = typeof b.remainingAmount === 'number'
    ? Math.max(0, totalAmount - b.remainingAmount)
    : (b.amountPaid ?? 0);
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
    isFullyPaid: b.isFullyPaid,
    isPaymentOverdue: b.isPaymentOverdue,
    paymentDeadline: b.paymentDeadline ?? '',
    status: b.status ?? 'PENDING_DEPOSIT',
    createdAt: b.createdAt ?? '',
    payments: b.payments?.map(mapPayment),
  };
}

function mapPayment(p: PaymentBackend): MappedPayment {
  return {
    id: p._id,
    amount: p.amount ?? 0,
    type: p.paymentType ?? p.type ?? 'trip_installment',
    status: p.status ?? 'success',
    date: p.createdAt ? new Date(p.createdAt).toLocaleDateString('fr-FR') : '',
  };
}

export async function createBooking(tripId: string, nombrePersonnes: number): Promise<MappedBooking> {
  const res = await apiRequest<{ success: boolean; booking: BookingBackend }>(
    `${TRIPS_PREFIX}/bookings`,
    { method: 'POST', body: JSON.stringify({ tripId, nombrePersonnes }) }
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

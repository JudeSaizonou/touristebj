export type VoyageStatus = 'pause' | 'en-cours' | 'complet';

export type VoyageurDocumentType =
  | 'copie-identite'
  | 'passeport'
  | 'photo-identite';

export type VoyageurDocumentStatus =
  | 'non-fourni'
  | 'demande'
  | 'recu';

export interface VoyageurDocumentInfo {
  status: VoyageurDocumentStatus;
  requestedAt?: string;
  updatedAt?: string;
}

// Backend document request model (from TripBooking.documentRequests)
export interface DocumentRequestBackend {
  _id: string;
  documentType: string;
  status: 'PENDING' | 'SUBMITTED' | 'APPROVED' | 'REJECTED';
  notes?: string;
  fileUrl?: string;
  fileName?: string;
  rejectionReason?: string;
  requestedAt?: string;
  submittedAt?: string;
  reviewedAt?: string;
}

export interface Voyage {
  id: string;
  destination: string;
  date: string;
  auteur: string;
  etat: VoyageStatus;
  prix: string;
  acomptesRecus: string;
  placesRestantes: string;
  rawStatus?: string;
  yourRole?: 'OWNER' | 'MANAGER' | 'READONLY';
}

export interface DashboardStats {
  totalReservations: number;
  totalAcomptes: string;
  utilisateursEpargne: number;
  utilisateursFinances: number;
  montantAttente: string;
  totalPaiements: string;
}

export interface ChartData {
  month: string;
  value: number;
}

export interface Voyageur {
  id: string;
  nom: string;
  email?: string;
  date: string;
  statutPaiement: 'acompte-paye' | 'epargne-en-cours' | 'solde' | 'financement-accorde' | 'reservation-annulee';
  moyenUtilise: 'epargne' | 'financement' | 'une-fois' | 'annule';
  telephone: string;
  acomptesRecus: string;
  montantsRestants: string;
  documents?: Partial<Record<VoyageurDocumentType, VoyageurDocumentInfo>>;
}

export interface Reservation {
  id: string;
  voyageId: string;
  voyageDestination: string;
  type: 'reservation' | 'epargne';
  nombrePersonnes: number;
  montantTotal: number;
  acompte: number;
  date: string;
  statut: 'confirmee' | 'en-attente' | 'annulee';
}

export type GroupPaymentMode = 'pay_all' | 'split';

export interface Invitation {
  id: string;
  bookingId: string;
  tripId: string;
  trip?: {
    title: string;
    destination: string;
    totalPrice: number;
    depositAmount: number;
    images: string[];
    departureDate: string;
  };
  invitedBy?: {
    username: string;
    referralCode?: string;
  };
  paymentMode: GroupPaymentMode;
  guestName: string;
  guestEmail: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  inviteToken: string;
  acceptedAt?: string;
  createdAt: string;
}

export type PageView = 'dashboard' | 'voyages' | 'create-voyage' | 'edit-voyage' | 'reservations' | 'all-voyageurs' | 'reversements' | 'parametres';

export interface MappedBooking {
  id: string;
  bookingNumber?: string;
  voyageId: string;
  voyage?: {
    titre: string;
    destination: string;
    departureDate: string;
    rawDepartureDate?: string;
    images: string[];
    paymentDeadlineDays: number;
  };
  nombrePersonnes: number;
  totalPrice: number;
  depositAmount: number;
  depositPaid?: boolean;
  amountPaid: number;
  remainingAmount: number;
  isFullyPaid?: boolean;
  isPaymentOverdue?: boolean;
  paymentDeadline: string;
  status: string;
  createdAt: string;
  payments?: MappedPayment[];
  paymentMode?: 'pay_all' | 'split' | null;
  groupId?: string | null;
  invitationStats?: { total: number; pending: number; accepted: number };
}

export interface MappedPayment {
  id: string;
  amount: number;
  type: string;
  paymentMethod?: string;
  status: string;
  date: string;
}

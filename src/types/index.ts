export type VoyageStatus = 'pause' | 'en-cours' | 'complet';

export interface Voyage {
  id: string;
  destination: string;
  date: string;
  auteur: string;
  etat: VoyageStatus;
  prix: string;
  acomptesRecus: string;
  placesRestantes: string;
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
  date: string;
  statutPaiement: 'acompte-paye' | 'epargne-en-cours' | 'solde' | 'financement-accorde' | 'reservation-annulee';
  moyenUtilise: 'epargne' | 'financement' | 'une-fois' | 'annule';
  telephone: string;
  acomptesRecus: string;
  montantsRestants: string;
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

export type PageView = 'dashboard' | 'voyages' | 'create-voyage' | 'edit-voyage' | 'reservations' | 'all-voyageurs' | 'parametres';

// LocalStorage keys
const STORAGE_KEYS = {
  VOYAGES: 'touriste_voyages',
  RESERVATIONS: 'touriste_reservations',
  VOYAGEURS: 'touriste_voyageurs',
  USERS: 'touriste_users',
  STATS: 'touriste_stats',
};

// Initialize default data
const DEFAULT_VOYAGES = [
  {
    id: '1',
    titre: 'Visite groupée Thaïlande',
    destination: 'Thaïlande',
    pays: 'Thaïlande',
    duree: '6 Heures',
    nombreJours: '10',
    nombrePersonnes: '25',
    prix: '1,000,000',
    devise: 'FCFA',
    description: 'Découvrez la beauté époustouflante de la Thaïlande avec notre visite de groupe exclusive. De Bangkok animé aux plages idylliques de Phuket, en passant par les temples anciens de Chiang Mai, cette aventure de 10 jours vous emmènera à travers les joyaux cachés et les sites emblématiques du pays du sourire.',
    conditionsPaiement: 'Acompte 50%',
    acomptesPourcentage: 50,
    statut: 'pause',
    note: 5,
    nombreAvis: 200,
    dateDebut: '15 Jan - 25 Jan, 2025',
    auteur: 'Chieko Chute',
    acomptesRecus: '1,500,000 FCFA',
    placesRestantes: '15 sur 20',
    photos: [
      'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=800',
      'https://images.unsplash.com/photo-1583418860514-c5eb05fc1e4a?w=800',
      'https://images.unsplash.com/photo-1528181304800-259b08848526?w=800',
      'https://images.unsplash.com/photo-1519451241324-20b4ea2c4220?w=800',
    ],
    politiqueRemboursement: 'Remboursement complet jusqu\'à 30 jours avant le départ. Remboursement de 50% entre 15 et 30 jours. Aucun remboursement moins de 15 jours avant le départ.',
    ceQuiEstInclus: [
      'Vols internationaux aller-retour',
      'Hébergement en hôtels 4 étoiles',
      'Petit-déjeuner quotidien',
      'Transferts aéroport-hôtel',
      'Guide francophone certifié',
      'Visites des temples principaux',
      'Assurance voyage complète',
    ],
    ceQuiNestPasInclus: [
      'Repas du midi et du soir',
      'Boissons alcoolisées',
      'Pourboires aux guides et chauffeurs',
      'Dépenses personnelles',
      'Activités optionnelles',
    ],
    itineraire: [
      {
        jour: 1,
        ville: 'Bangkok',
        titre: 'Arrivée à Bangkok',
        description: 'Arrivée à l\'aéroport international de Bangkok. Transfert à l\'hôtel. Temps libre pour vous reposer.',
      },
      {
        jour: 2,
        ville: 'Bangkok',
        titre: 'Temples de Bangkok',
        description: 'Visite du Grand Palais, Wat Pho et Wat Arun. Découverte du marché flottant.',
      },
      {
        jour: 3,
        ville: 'Bangkok',
        titre: 'Marchés et Gastronomie',
        description: 'Visite du marché de Chatuchak et cours de cuisine thaïe.',
      },
    ],
    departureTime: '10:00 AM',
    returnTime: '8:00 PM',
    included: 'Vols - Hôtels - Repas',
    excluded: 'Boissons - Activités optionnelles',
    bedrooms: 2,
    bathrooms: 1,
    maxPeople: 25,
    minAge: 18,
  },
  {
    id: '2',
    titre: 'Visite groupée Grèce',
    destination: 'Grèce',
    pays: 'Grèce',
    duree: '6 Heures',
    nombreJours: '8',
    nombrePersonnes: '20',
    prix: '1,000,000',
    devise: 'FCFA',
    description: 'Explorez les merveilles de la Grèce antique et ses îles paradisiaques. D\'Athènes historique à Santorin romantique, découvrez l\'histoire, la culture et la beauté naturelle de ce pays méditerranéen.',
    conditionsPaiement: 'Acompte 50%',
    acomptesPourcentage: 50,
    statut: 'pause',
    note: 5,
    nombreAvis: 200,
    dateDebut: '1 Feb - 9 Feb, 2025',
    auteur: 'Annabel Rohan',
    acomptesRecus: '1,500,000 FCFA',
    placesRestantes: '12 sur 25',
    photos: [
      'https://images.unsplash.com/photo-1613395877344-13d4a8e0d49e?w=800',
      'https://images.unsplash.com/photo-1503152394-c571994fd383?w=800',
      'https://images.unsplash.com/photo-1601581987809-a874a81309c9?w=800',
      'https://images.unsplash.com/photo-1533104816931-20fa691ff6ca?w=800',
    ],
    politiqueRemboursement: 'Remboursement complet jusqu\'à 30 jours avant le départ. Remboursement de 50% entre 15 et 30 jours. Aucun remboursement moins de 15 jours avant le départ.',
    ceQuiEstInclus: [
      'Vols internationaux',
      'Ferries inter-îles',
      'Hôtels 4 étoiles',
      'Petits-déjeuners',
      'Guide francophone',
      'Visites des sites archéologiques',
    ],
    ceQuiNestPasInclus: [
      'Déjeuners et dîners',
      'Boissons',
      'Pourboires',
      'Dépenses personnelles',
    ],
    itineraire: [],
    departureTime: '9:00 AM',
    returnTime: '7:00 PM',
    included: 'Vols - Hôtels - Ferries',
    excluded: 'Repas - Boissons',
    bedrooms: 2,
    bathrooms: 1,
    maxPeople: 20,
    minAge: 18,
  },
  {
    id: '3',
    titre: 'Visite groupée Spanish Riviera',
    destination: 'Espagne',
    pays: 'Espagne',
    duree: '6 Heures',
    nombreJours: '7',
    nombrePersonnes: '30',
    prix: '1,000,000',
    devise: 'FCFA',
    description: 'Découvrez la côte méditerranéenne espagnole avec ses plages dorées, son architecture impressionnante et sa gastronomie exceptionnelle.',
    conditionsPaiement: 'Acompte 50%',
    acomptesPourcentage: 50,
    statut: 'pause',
    note: 5,
    nombreAvis: 200,
    dateDebut: '10 Mar - 17 Mar, 2025',
    auteur: 'Pedro Huard',
    acomptesRecus: '1,500,000 FCFA',
    placesRestantes: '11 sur 12',
    photos: [
      'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=800',
      'https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?w=800',
      'https://images.unsplash.com/photo-1543783207-ec64e4d95325?w=800',
      'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=800',
    ],
    politiqueRemboursement: 'Remboursement complet jusqu\'à 30 jours avant le départ.',
    ceQuiEstInclus: [
      'Vols internationaux',
      'Hôtels 4 étoiles',
      'Petits-déjeuners',
      'Guide',
    ],
    ceQuiNestPasInclus: [
      'Repas',
      'Boissons',
      'Pourboires',
    ],
    itineraire: [],
    departureTime: '10:00 AM',
    returnTime: '8:00 PM',
    included: 'Vols - Hôtels',
    excluded: 'Repas',
    bedrooms: 2,
    bathrooms: 1,
    maxPeople: 30,
    minAge: 16,
  },
  {
    id: '4',
    titre: 'Visite groupée Athène',
    destination: 'Grèce',
    pays: 'Grèce',
    duree: '6 Heures',
    nombreJours: '6',
    nombrePersonnes: '20',
    prix: '1,000,000',
    devise: 'FCFA',
    description: 'Découvrez Athènes, berceau de la civilisation occidentale. Visitez l\'Acropole, le Parthénon et les quartiers historiques de Plaka.',
    conditionsPaiement: 'Acompte 50%',
    acomptesPourcentage: 50,
    statut: 'en-cours',
    note: 5,
    nombreAvis: 200,
    dateDebut: '5 Mar - 11 Mar, 2025',
    auteur: 'Chieko Chute',
    acomptesRecus: '1,200,000 FCFA',
    placesRestantes: '10 sur 20',
    photos: [
      'https://images.unsplash.com/photo-1555993539-1732b0258235?w=800',
      'https://images.unsplash.com/photo-1603565816030-6b389eeb23cb?w=800',
      'https://images.unsplash.com/photo-1613395877344-13d4a8e0d49e?w=800',
      'https://images.unsplash.com/photo-1533104816931-20fa691ff6ca?w=800',
    ],
    politiqueRemboursement: 'Remboursement complet jusqu\'à 30 jours avant le départ.',
    ceQuiEstInclus: [
      'Vols internationaux',
      'Hôtels 4 étoiles',
      'Petits-déjeuners',
      'Guide francophone',
    ],
    ceQuiNestPasInclus: [
      'Repas du midi et du soir',
      'Boissons',
      'Pourboires',
    ],
    itineraire: [],
    departureTime: '9:00 AM',
    returnTime: '6:00 PM',
    included: 'Vols - Hôtels - Guide',
    excluded: 'Repas - Boissons',
    bedrooms: 2,
    bathrooms: 1,
    maxPeople: 20,
    minAge: 18,
  },
  {
    id: '5',
    titre: 'Visite groupée Vietnam',
    destination: 'Vietnam',
    pays: 'Vietnam',
    duree: '6 Heures',
    nombreJours: '12',
    nombrePersonnes: '25',
    prix: '1,000,000',
    devise: 'FCFA',
    description: 'Explorez le Vietnam, de la baie d\'Ha Long aux rizières de Sapa, en passant par Hanoï et Hô Chi Minh-Ville.',
    conditionsPaiement: 'Acompte 50%',
    acomptesPourcentage: 50,
    statut: 'en-cours',
    note: 5,
    nombreAvis: 200,
    dateDebut: '20 Apr - 2 May, 2025',
    auteur: 'Pedro Huard',
    acomptesRecus: '2,000,000 FCFA',
    placesRestantes: '15 sur 25',
    photos: [
      'https://images.unsplash.com/photo-1528127269322-539801943592?w=800',
      'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=800',
      'https://images.unsplash.com/photo-1557750255-c76072a7aad1?w=800',
      'https://images.unsplash.com/photo-1555921015-5532091f6026?w=800',
    ],
    politiqueRemboursement: 'Remboursement complet jusqu\'à 30 jours avant le départ.',
    ceQuiEstInclus: [
      'Vols internationaux',
      'Hébergement en hôtels 4 étoiles',
      'Petit-déjeuner quotidien',
      'Guide francophone',
    ],
    ceQuiNestPasInclus: [
      'Repas du midi et du soir',
      'Boissons',
      'Pourboires',
    ],
    itineraire: [],
    departureTime: '8:00 AM',
    returnTime: '9:00 PM',
    included: 'Vols - Hôtels - Guide',
    excluded: 'Repas - Boissons',
    bedrooms: 2,
    bathrooms: 1,
    maxPeople: 25,
    minAge: 18,
  },
  {
    id: '6',
    titre: 'Visite groupée Spanish Riviera',
    destination: 'Espagne',
    pays: 'Espagne',
    duree: '6 Heures',
    nombreJours: '7',
    nombrePersonnes: '30',
    prix: '1,000,000',
    devise: 'FCFA',
    description: 'Redécouvrez la côte méditerranéenne espagnole avec une nouvelle perspective. Plages, culture et gastronomie vous attendent.',
    conditionsPaiement: 'Acompte 50%',
    acomptesPourcentage: 50,
    statut: 'en-cours',
    note: 5,
    nombreAvis: 200,
    dateDebut: '15 May - 22 May, 2025',
    auteur: 'Annabel Rohan',
    acomptesRecus: '1,800,000 FCFA',
    placesRestantes: '20 sur 30',
    photos: [
      'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=800',
      'https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?w=800',
      'https://images.unsplash.com/photo-1543783207-ec64e4d95325?w=800',
      'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=800',
    ],
    politiqueRemboursement: 'Remboursement complet jusqu\'à 30 jours avant le départ.',
    ceQuiEstInclus: [
      'Vols internationaux',
      'Hôtels 4 étoiles',
      'Petits-déjeuners',
    ],
    ceQuiNestPasInclus: [
      'Repas',
      'Boissons',
      'Pourboires',
    ],
    itineraire: [],
    departureTime: '10:00 AM',
    returnTime: '8:00 PM',
    included: 'Vols - Hôtels',
    excluded: 'Repas',
    bedrooms: 2,
    bathrooms: 1,
    maxPeople: 30,
    minAge: 16,
  },
  {
    id: '7',
    titre: 'Visite groupée Egypte',
    destination: 'Egypte',
    pays: 'Egypte',
    duree: '6 Heures',
    nombreJours: '9',
    nombrePersonnes: '20',
    prix: '1,000,000',
    devise: 'FCFA',
    description: 'Découvrez les mystères de l\'Egypte ancienne. Des pyramides de Gizeh à la vallée des Rois, plongez dans une civilisation millénaire.',
    conditionsPaiement: 'Acompte 50%',
    acomptesPourcentage: 50,
    statut: 'en-cours',
    note: 5,
    nombreAvis: 200,
    dateDebut: '1 Jun - 10 Jun, 2025',
    auteur: 'Chieko Chute',
    acomptesRecus: '1,500,000 FCFA',
    placesRestantes: '12 sur 20',
    photos: [
      'https://images.unsplash.com/photo-1539768942893-daf53e736b68?w=800',
      'https://images.unsplash.com/photo-1568322445389-f64e1d3a6c04?w=800',
      'https://images.unsplash.com/photo-1553913861-c0fddf2619ee?w=800',
      'https://images.unsplash.com/photo-1572252009286-268acec5ca0a?w=800',
    ],
    politiqueRemboursement: 'Remboursement complet jusqu\'à 30 jours avant le départ.',
    ceQuiEstInclus: [
      'Vols internationaux',
      'Hébergement en hôtels 4 étoiles',
      'Petit-déjeuner quotidien',
      'Guide francophone',
      'Visites des sites principaux',
    ],
    ceQuiNestPasInclus: [
      'Repas du midi et du soir',
      'Boissons',
      'Pourboires',
      'Dépenses personnelles',
    ],
    itineraire: [],
    departureTime: '7:00 AM',
    returnTime: '7:00 PM',
    included: 'Vols - Hôtels - Guide',
    excluded: 'Repas - Boissons',
    bedrooms: 2,
    bathrooms: 1,
    maxPeople: 20,
    minAge: 18,
  },
];

export class StorageService {
  // Initialize storage with default data
  static initialize() {
    if (!localStorage.getItem(STORAGE_KEYS.VOYAGES)) {
      localStorage.setItem(STORAGE_KEYS.VOYAGES, JSON.stringify(DEFAULT_VOYAGES));
    }
    if (!localStorage.getItem(STORAGE_KEYS.RESERVATIONS)) {
      localStorage.setItem(STORAGE_KEYS.RESERVATIONS, JSON.stringify([]));
    }
    if (!localStorage.getItem(STORAGE_KEYS.VOYAGEURS)) {
      const defaultVoyageurs: Record<string, any[]> = {
        '1': [
          { id: '1', nom: 'TOM Olivier', date: 'Apr 24, 2022', statutPaiement: 'acompte-paye', moyenUtilise: 'epargne', telephone: '+22901959595', acomptesRecus: '500,000 FCFA', montantsRestants: '500,000 FCFA' },
          { id: '2', nom: 'DUPONT Marie', date: 'Apr 24, 2022', statutPaiement: 'epargne-en-cours', moyenUtilise: 'epargne', telephone: '+22901959596', acomptesRecus: '300,000 FCFA', montantsRestants: '700,000 FCFA' },
          { id: '3', nom: 'KOFFI Jean', date: 'Apr 24, 2022', statutPaiement: 'solde', moyenUtilise: 'financement', telephone: '+22901959597', acomptesRecus: '1,000,000 FCFA', montantsRestants: '0 FCFA' },
          { id: '4', nom: 'AHOUNOU Pierre', date: 'Apr 23, 2022', statutPaiement: 'financement-accorde', moyenUtilise: 'une-fois', telephone: '+22901959598', acomptesRecus: '1,000,000 FCFA', montantsRestants: '0 FCFA' },
          { id: '5', nom: 'BOSSA Claire', date: 'Apr 22, 2022', statutPaiement: 'reservation-annulee', moyenUtilise: 'annule', telephone: '+22901959599', acomptesRecus: '0 FCFA', montantsRestants: '1,000,000 FCFA' },
          { id: '6', nom: 'GANHOU Luc', date: 'Apr 22, 2022', statutPaiement: 'acompte-paye', moyenUtilise: 'epargne', telephone: '+22901959600', acomptesRecus: '500,000 FCFA', montantsRestants: '500,000 FCFA' },
        ],
        '2': [
          { id: '7', nom: 'SANTOS Maria', date: 'May 10, 2022', statutPaiement: 'acompte-paye', moyenUtilise: 'epargne', telephone: '+22901959601', acomptesRecus: '500,000 FCFA', montantsRestants: '500,000 FCFA' },
          { id: '8', nom: 'MENSAH Kofi', date: 'May 11, 2022', statutPaiement: 'epargne-en-cours', moyenUtilise: 'financement', telephone: '+22901959602', acomptesRecus: '250,000 FCFA', montantsRestants: '750,000 FCFA' },
        ],
      };
      localStorage.setItem(STORAGE_KEYS.VOYAGEURS, JSON.stringify(defaultVoyageurs));
    }
  }

  // Voyages
  static getVoyages() {
    const data = localStorage.getItem(STORAGE_KEYS.VOYAGES);
    return data ? JSON.parse(data) : [];
  }

  static getVoyageById(id: string) {
    const voyages = this.getVoyages();
    return voyages.find((v: any) => v.id === id);
  }

  static saveVoyage(voyage: any) {
    const voyages = this.getVoyages();
    const index = voyages.findIndex((v: any) => v.id === voyage.id);

    if (index >= 0) {
      voyages[index] = voyage;
    } else {
      voyage.id = Date.now().toString();
      voyages.push(voyage);
    }

    localStorage.setItem(STORAGE_KEYS.VOYAGES, JSON.stringify(voyages));
    return voyage;
  }

  static deleteVoyage(id: string) {
    const voyages = this.getVoyages();
    const filtered = voyages.filter((v: any) => v.id !== id);
    localStorage.setItem(STORAGE_KEYS.VOYAGES, JSON.stringify(filtered));
  }

  // Reservations
  static getReservations() {
    const data = localStorage.getItem(STORAGE_KEYS.RESERVATIONS);
    return data ? JSON.parse(data) : [];
  }

  static saveReservation(reservation: any) {
    const reservations = this.getReservations();
    reservation.id = Date.now().toString();
    reservation.date = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
    reservations.push(reservation);
    localStorage.setItem(STORAGE_KEYS.RESERVATIONS, JSON.stringify(reservations));
    return reservation;
  }

  static deleteReservation(id: string) {
    const reservations = this.getReservations();
    const filtered = reservations.filter((r: any) => r.id !== id);
    localStorage.setItem(STORAGE_KEYS.RESERVATIONS, JSON.stringify(filtered));
  }

  // Voyageurs (per voyage)
  static getVoyageursByVoyage(voyageId: string): any[] {
    const data = localStorage.getItem(STORAGE_KEYS.VOYAGEURS);
    const all = data ? JSON.parse(data) : {};
    return all[voyageId] || [];
  }

  // Get ALL voyageurs across all voyages
  static getAllVoyageurs(): { voyageur: any; voyageId: string; voyageDestination: string }[] {
    const data = localStorage.getItem(STORAGE_KEYS.VOYAGEURS);
    const all = data ? JSON.parse(data) : {};
    const voyages = this.getVoyages();
    const result: { voyageur: any; voyageId: string; voyageDestination: string }[] = [];

    for (const voyageId in all) {
      const voyage = voyages.find((v: any) => v.id === voyageId);
      const destination = voyage ? (voyage.destination || voyage.titre) : 'Inconnu';
      (all[voyageId] as any[]).forEach((voyageur: any) => {
        result.push({ voyageur, voyageId, voyageDestination: destination });
      });
    }
    return result;
  }

  static saveVoyageur(voyageId: string, voyageur: any) {
    const data = localStorage.getItem(STORAGE_KEYS.VOYAGEURS);
    const all = data ? JSON.parse(data) : {};
    if (!all[voyageId]) all[voyageId] = [];

    const index = all[voyageId].findIndex((v: any) => v.id === voyageur.id);
    if (index >= 0) {
      all[voyageId][index] = voyageur;
    } else {
      voyageur.id = Date.now().toString();
      all[voyageId].push(voyageur);
    }

    localStorage.setItem(STORAGE_KEYS.VOYAGEURS, JSON.stringify(all));
    return voyageur;
  }

  static deleteVoyageur(voyageId: string, voyageurId: string) {
    const data = localStorage.getItem(STORAGE_KEYS.VOYAGEURS);
    const all = data ? JSON.parse(data) : {};
    if (all[voyageId]) {
      all[voyageId] = all[voyageId].filter((v: any) => v.id !== voyageurId);
      localStorage.setItem(STORAGE_KEYS.VOYAGEURS, JSON.stringify(all));
    }
  }

  // Computed Stats (from real data)
  static getComputedStats() {
    const voyages = this.getVoyages();
    const data = localStorage.getItem(STORAGE_KEYS.VOYAGEURS);
    const allVoyageurs = data ? JSON.parse(data) : {};

    let totalReservations = 0;
    let totalAcomptes = 0;
    let utilisateursEpargne = 0;
    let utilisateursFinances = 0;
    let montantAttente = 0;
    let totalPaiements = 0;

    for (const voyageId in allVoyageurs) {
      const voyageurs = allVoyageurs[voyageId] as any[];
      totalReservations += voyageurs.length;

      voyageurs.forEach((v: any) => {
        const acompte = parseFloat((v.acomptesRecus || '0').replace(/[^0-9]/g, '')) || 0;
        const restant = parseFloat((v.montantsRestants || '0').replace(/[^0-9]/g, '')) || 0;
        totalAcomptes += acompte;
        totalPaiements += acompte;
        montantAttente += restant;

        if (v.moyenUtilise === 'epargne') utilisateursEpargne++;
        if (v.moyenUtilise === 'financement') utilisateursFinances++;
      });
    }

    const fmt = (n: number) => {
      if (n >= 1000000) return Math.round(n / 1000000) + 'M';
      if (n >= 1000) return Math.round(n / 1000) + 'K';
      return n.toString();
    };

    return {
      totalVoyages: voyages.length,
      totalReservations,
      totalAcomptes: fmt(totalAcomptes),
      utilisateursEpargne,
      utilisateursFinances,
      montantAttente: fmt(montantAttente),
      totalPaiements: fmt(totalPaiements),
    };
  }

  // Stats for a specific voyage
  static getVoyageStats(voyageId: string) {
    const voyageurs = this.getVoyageursByVoyage(voyageId);
    let totalAcomptes = 0;
    let montantAttente = 0;
    let utilisateursEpargne = 0;
    let utilisateursFinances = 0;

    voyageurs.forEach((v: any) => {
      const acompte = parseFloat((v.acomptesRecus || '0').replace(/[^0-9]/g, '')) || 0;
      const restant = parseFloat((v.montantsRestants || '0').replace(/[^0-9]/g, '')) || 0;
      totalAcomptes += acompte;
      montantAttente += restant;
      if (v.moyenUtilise === 'epargne') utilisateursEpargne++;
      if (v.moyenUtilise === 'financement') utilisateursFinances++;
    });

    const fmt = (n: number) => {
      if (n >= 1000000) return Math.round(n / 1000000) + 'M';
      if (n >= 1000) return Math.round(n / 1000) + 'K';
      return n.toString();
    };

    return {
      totalReservations: voyageurs.length,
      totalAcomptes: fmt(totalAcomptes),
      utilisateursEpargne,
      utilisateursFinances,
      montantAttente: fmt(montantAttente),
      totalPaiements: fmt(totalAcomptes),
    };
  }

  // Legacy stats (keep for backward compat)
  static getStats() {
    return this.getComputedStats();
  }

  static updateStats(stats: any) {
    localStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(stats));
  }
}

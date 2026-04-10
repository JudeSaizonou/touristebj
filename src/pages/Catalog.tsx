import React, { useState, useEffect, useMemo } from 'react';
import { MapPin, Star, Search, Loader2, SlidersHorizontal, X, ArrowRight, Clock, Users, Calendar, ChevronRight, ChevronDown, Quote, MessageSquare } from 'lucide-react';
import { PublicLayout } from '../components/PublicLayout';
import { getVoyages } from '../api/trips';
import { useAuth } from '../context/AuthContext';
import LogoZepargn from '../assets/LogoZepargn.png';
import LogoTouristeBj from '../assets/LogoTouristeBj.png';
import { useDebounce } from '../hooks/useDebounce';
import { SEO, buildFAQJsonLd } from '../components/SEO';

import type { AuthMode } from './Auth';
import { fmtPrice } from '../utils/format';

const FAQ_DATA = [
  { q: "C'est quoi exactement l'acompte de 30% ?", a: "C'est le montant minimum pour confirmer votre place dans le groupe. Il est non remboursable mais garantit votre réservation. Le solde est dû 10 jours avant le départ." },
  { q: "Et si je n'ai pas Zepargn ?", a: "Téléchargez l'app (iOS/Android), créez un compte en 3 minutes avec votre numéro de téléphone. Disponible dans 18 pays UEMOA. Après réservation, un objectif d'épargne est créé automatiquement pour votre voyage." },
  { q: "Je suis en Europe — ça marche pour moi ?", a: "Oui. Inscription avec numéro international, paiement par carte. Vous rejoignez le groupe depuis où vous êtes." },
  { q: "Combien de personnes par voyage ?", a: "Entre 10 et 30. La taille est affichée sur chaque fiche voyage. Les places disponibles aussi — en temps réel." },
  { q: "Que se passe-t-il si je ne complète pas l'épargne à temps ?", a: "Vous recevez des notifications de rappel dans Zepargn. Si le solde n'est pas atteint 10 jours avant, nous vous contactons pour trouver une solution (report, transfert de place, remboursement partiel)." },
  { q: "Comment vous joindre ?", a: "WhatsApp : +229 01 61 38 28 69 | Email : voyage@zepargn.com | Lundi–Vendredi, 8h30 à 17h30." },
];

interface CatalogProps {
  onViewDetails: (voyageId: string) => void;
  onAdminLogin?: () => void;
  onOpenAuth?: (mode: AuthMode) => void;
  onMesVoyages?: () => void;
  onLogout?: () => void;
}

export const Catalog: React.FC<CatalogProps> = ({
  onViewDetails,
  onAdminLogin,
  onOpenAuth,
  onMesVoyages,
  onLogout,
}) => {
  const { user } = useAuth();
  const [voyages, setVoyages] = useState<any[]>([]);
  const [filteredVoyages, setFilteredVoyages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [authRequired, setAuthRequired] = useState(false);
  const [sortBy, setSortBy] = useState('default');
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 300);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filterDestination, setFilterDestination] = useState('');
  const [filterTripType, setFilterTripType] = useState('');

  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [showDownloadPopup, setShowDownloadPopup] = useState(false);
  const activeFilterCount = [priceMin, priceMax, dateFrom, dateTo, filterDestination, filterTripType].filter(Boolean).length;

  const uniqueDestinations = useMemo(() => {
    const dests = new Set(voyages.map(v => v.destination as string).filter(Boolean));
    return Array.from(dests).sort();
  }, [voyages]);

  const uniqueTripTypes = useMemo(() => {
    const types = new Set(voyages.map(v => v.tripType as string).filter(Boolean));
    return Array.from(types).sort();
  }, [voyages]);

  const heroStats = useMemo(() => {
    const tripCount = voyages.length;
    const destCount = uniqueDestinations.length;
    return [
      { value: tripCount > 0 ? `${tripCount}+` : '0', label: 'voyages disponibles' },
      { value: destCount > 0 ? `${destCount}+` : '0', label: 'destinations' },
      { value: '0', label: 'blocage financier' },
      { value: uniqueTripTypes.length > 0 ? String(uniqueTripTypes.length) : '0', label: 'types de voyage' },
    ];
  }, [voyages, uniqueDestinations, uniqueTripTypes]);

  const resetFilters = () => {
    setPriceMin('');
    setPriceMax('');
    setDateFrom('');
    setDateTo('');
    setFilterDestination('');
    setFilterTripType('');
    setSearchQuery('');
    setSortBy('default');
  };

  const loadVoyages = async () => {
    setLoading(true);
    setError('');
    setAuthRequired(false);
    try {
      const { voyages: data } = await getVoyages();
      setVoyages(data);
      setFilteredVoyages(data);
    } catch (err: any) {
      const msg: string = err?.message || '';
      const is401 = msg.toLowerCase().includes('token') || msg.includes('401') || msg.includes('Unauthorized');
      if (is401) {
        setAuthRequired(true);
      } else {
        setError(msg || 'Impossible de charger les voyages.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVoyages();
  }, [user]);

  useEffect(() => {
    let result = [...voyages];
    if (debouncedSearch.trim()) {
      const query = debouncedSearch.toLowerCase();
      result = result.filter(v =>
        v.titre?.toLowerCase().includes(query) ||
        v.destination?.toLowerCase().includes(query) ||
        v.pays?.toLowerCase().includes(query)
      );
    }
    if (priceMin) {
      const min = Number(priceMin);
      result = result.filter(v => (v.totalPrice ?? 0) >= min);
    }
    if (priceMax) {
      const max = Number(priceMax);
      result = result.filter(v => (v.totalPrice ?? 0) <= max);
    }
    if (dateFrom) {
      const from = new Date(dateFrom);
      result = result.filter(v => v.rawDepartureDate && new Date(v.rawDepartureDate) >= from);
    }
    if (dateTo) {
      const to = new Date(dateTo);
      result = result.filter(v => v.rawDepartureDate && new Date(v.rawDepartureDate) <= to);
    }
    if (filterDestination) {
      result = result.filter(v => v.destination === filterDestination);
    }
    if (filterTripType) {
      result = result.filter(v => v.tripType === filterTripType);
    }
    switch (sortBy) {
      case 'price-low':
        result.sort((a, b) => (a.totalPrice ?? 0) - (b.totalPrice ?? 0));
        break;
      case 'price-high':
        result.sort((a, b) => (b.totalPrice ?? 0) - (a.totalPrice ?? 0));
        break;
      case 'name':
        result.sort((a, b) => (a.titre || '').localeCompare(b.titre || ''));
        break;
    }
    setFilteredVoyages(result);
    setCurrentPage(1);
  }, [debouncedSearch, sortBy, voyages, priceMin, priceMax, dateFrom, dateTo, filterDestination, filterTripType]);

  const totalPages = Math.ceil(filteredVoyages.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const displayedVoyages = filteredVoyages.slice(startIndex, startIndex + itemsPerPage);
  const endIndex = Math.min(startIndex + itemsPerPage, filteredVoyages.length);

  return (
    <PublicLayout
      onAdminLogin={onAdminLogin}
      onOpenAuth={onOpenAuth}
      onMesVoyages={onMesVoyages}
      onLogout={onLogout}
    >
      {/* ═══════════════ HERO ═══════════════ */}
      <section className="relative min-h-[85vh] flex items-center overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0">
          <img
            srcSet="https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=640&q=70&fm=webp 640w, https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1280&q=75&fm=webp 1280w, https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1920&q=80&fm=webp 1920w"
            sizes="100vw"
            src="https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1280&q=75"
            alt="Voyageurs sur une route de voyage"
            width={1920}
            height={1080}
            fetchPriority="high"
            loading="eager"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#031927]/55 to-[#031927]/75" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-20 w-full">
          <div className="max-w-3xl mx-auto text-center">
            {/* Badge pill */}
            <span className="inline-block bg-white/15 backdrop-blur-sm text-white text-xs font-semibold uppercase tracking-widest px-5 py-2 rounded-full mb-6 border border-white/20">
              Réservez aujourd'hui. Payez à votre rythme.
            </span>

            <h1 className="font-playfair text-[40px] sm:text-[52px] lg:text-[64px] font-extrabold text-white leading-[1.1] mb-6">
              Voyager, c'est pas
              <br />
              une question de budget.
            </h1>

            <p className="text-base sm:text-lg text-gray-300 mb-10 max-w-xl mx-auto leading-relaxed font-sans">
              Réservez votre place avec 30% d'acompte. Zepargn s'occupe du reste : versements automatiques, solde complété avant le départ.
            </p>

            {/* Stats */}
            <div className="flex flex-wrap justify-center gap-6 sm:gap-10 mb-10">
              {heroStats.map((stat) => (
                <div key={stat.label} className="text-center">
                  <p className="text-2xl sm:text-3xl font-bold text-white font-sans">{stat.value}</p>
                  <p className="text-sm text-gray-400 font-sans">{stat.label}</p>
                </div>
              ))}
            </div>

            {/* CTAs */}
            <div className="flex flex-wrap justify-center gap-4">
              <button
                onClick={() => {
                  const el = document.getElementById('voyages-section');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className="inline-flex items-center gap-2 px-7 py-3.5 bg-primary-500 text-white rounded-xl font-semibold hover:bg-primary-600 transition-all hover:shadow-lg hover:shadow-primary-500/25 text-base font-sans"
              >
                Voir les départs disponibles <ArrowRight className="w-5 h-5" />
              </button>
              <button
                onClick={() => setShowDownloadPopup(true)}
                className="inline-flex items-center gap-2 px-7 py-3.5 bg-transparent text-white border border-white/30 rounded-xl font-semibold hover:bg-white/10 transition-all text-base font-sans"
              >
                Télécharger Zepargn
              </button>
            </div>
          </div>
        </div>

        {/* Download popup */}
        {showDownloadPopup && (
          <>
            <div className="fixed inset-0 bg-black/50 z-[60] backdrop-blur-sm" onClick={() => setShowDownloadPopup(false)} />
            <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[70] bg-white rounded-2xl shadow-2xl p-6 sm:p-8 w-[90%] max-w-sm animate-scale-in">
              <button onClick={() => setShowDownloadPopup(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
              <div className="text-center mb-6">
                <img src={LogoZepargn} alt="Zepargn" className="h-10 mx-auto mb-3" />
                <h3 className="font-bold text-dark-800 text-lg">Télécharger Zepargn</h3>
                <p className="text-sm text-dark-800/50 mt-1">Épargnez pour vos voyages, automatiquement.</p>
              </div>
              <div className="space-y-3">
                <a
                  href="https://apps.apple.com/us/app/zepargn/id6474701827"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 w-full px-5 py-3.5 bg-dark-800 text-white rounded-xl hover:bg-dark-700 transition-colors font-semibold text-sm"
                >
                  <svg className="w-6 h-6 shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
                  <div>
                    <p className="text-[10px] text-white/50 leading-none">Télécharger sur</p>
                    <p className="text-base font-bold leading-tight">App Store</p>
                  </div>
                </a>
                <a
                  href="https://play.google.com/store/apps/details?id=com.digitalelevate.zepargnmobileapp"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 w-full px-5 py-3.5 bg-dark-800 text-white rounded-xl hover:bg-dark-700 transition-colors font-semibold text-sm"
                >
                  <svg className="w-6 h-6 shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M3.18 23.04c.17.3.44.54.77.67.1.04.2.06.31.08l.13.01h.04c.11 0 .22-.02.33-.05.05-.02.09-.03.14-.05l8.05-4.56-3.32-3.32-6.45 7.22zm-.81-1.38L13.3 10.73 10.9 8.33 2.09 20.3c-.15.24-.22.52-.22.79 0 .2.04.39.12.57h-.01l.39-.01zM21.81 11.06l-3.37-1.91-3.63 3.18 3.47 3.47 3.53-2c.57-.32.94-.87.94-1.37 0-.51-.36-1.05-.94-1.37zM13.3 10.73L17.37 7 5.76.42c-.12-.07-.25-.12-.39-.16C5.22.2 5.07.17 4.92.18c-.08 0-.16.01-.24.03-.33.06-.63.23-.84.48l.05-.04 9.41 10.08z"/></svg>
                  <div>
                    <p className="text-[10px] text-white/50 leading-none">Disponible sur</p>
                    <p className="text-base font-bold leading-tight">Google Play</p>
                  </div>
                </a>
              </div>
            </div>
          </>
        )}

        {/* Bottom wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" className="w-full" preserveAspectRatio="none">
            <path d="M0,30 C480,60 960,0 1440,30 L1440,60 L0,60 Z" fill="white" />
          </svg>
        </div>
      </section>

      {/* ═══════════════ COMMENT CA MARCHE ═══════════════ */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <span className="inline-block bg-primary-100 text-primary-500 text-xs font-bold uppercase tracking-[0.1em] px-4 py-1.5 rounded-full mb-4">
              COMMENT CA MARCHE
            </span>
            <h2 className="font-playfair text-3xl md:text-4xl font-bold text-dark-800 mb-3">
              Le voyage de groupe, enfin accessible.
            </h2>
            <p className="text-dark-800/60 max-w-2xl mx-auto text-sm leading-relaxed font-sans">
              Vous n'attendez plus d'avoir tout l'argent pour réserver. Vous réservez, vous épargnez, vous partez.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {[
              {
                num: '1',
                title: 'Choisissez votre destination',
                desc: 'Consultez les prochains départs et trouvez le voyage qui vous attire.',
              },
              {
                num: '2',
                title: 'Payez 30% pour confirmer',
                desc: 'Acompte via Zepargn. Votre place est bloquée immédiatement.',
              },
              {
                num: '3',
                title: 'Zepargn complète le reste',
                desc: "Créez un objectif d'épargne dans l'app. Versements au quotidien, à la semaine, au mois — comme vous voulez.",
              },
              {
                num: '4',
                title: 'Partez sans stress',
                desc: 'Solde atteint, départ confirmé. Il ne reste plus qu\'à faire vos valises.',
              },
            ].map((item) => (
              <div key={item.num} className="text-center">
                <div className="w-14 h-14 bg-primary-500 text-white rounded-full flex items-center justify-center mx-auto mb-5 text-xl font-bold font-sans">
                  {item.num}
                </div>
                <h3 className="text-lg font-bold text-dark-800 mb-2 font-sans">{item.title}</h3>
                <p className="text-sm text-dark-800/60 leading-relaxed font-sans">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ VOYAGES ═══════════════ */}
      <section id="voyages-section" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <span className="inline-block bg-primary-100 text-primary-500 text-xs font-bold uppercase tracking-[0.1em] px-4 py-1.5 rounded-full mb-4">
              NOS DÉPARTS
            </span>
            <h2 className="font-playfair text-3xl md:text-4xl font-bold text-dark-800 mb-3">
              Nos prochains voyages
            </h2>
            <p className="text-dark-800/60 max-w-2xl mx-auto text-sm leading-relaxed font-sans">
              Découvrez nos voyages de groupe soigneusement organisés. Réservez votre place, les autres paiements suivent à votre rythme.
            </p>
          </div>

          {/* Loading */}
          {loading && (
            <div className="flex flex-col items-center py-20 gap-4">
              <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
              <p className="text-dark-800/40 font-sans">Chargement des voyages...</p>
            </div>
          )}

          {/* Error */}
          {!loading && !authRequired && error && (
            <div className="flex flex-col items-center py-16 gap-4">
              <p className="text-red-500 font-medium font-sans">{error}</p>
              <button onClick={loadVoyages} className="px-6 py-2.5 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-colors text-sm font-semibold font-sans">
                Réessayer
              </button>
            </div>
          )}

          {/* Auth required */}
          {!loading && authRequired && (
            <div className="relative">
              <div className="flex flex-col sm:flex-row items-center justify-between bg-gradient-to-r from-dark-800 to-dark-700 text-white rounded-2xl px-6 py-5 mb-8 gap-4">
                <div className="flex items-center gap-3">
                  <div>
                    <p className="font-semibold text-sm font-sans">Connectez-vous pour découvrir nos voyages</p>
                    <p className="text-xs text-white/60 font-sans">Inscription gratuite en 2 minutes</p>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => onOpenAuth?.('connexion')}
                    className="px-5 py-2.5 bg-white text-dark-800 rounded-xl text-sm font-semibold hover:bg-gray-100 transition-colors font-sans"
                  >
                    Se connecter
                  </button>
                  <a
                    href="https://play.google.com/store/apps/details?id=com.digitalelevate.zepargnmobileapp"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-5 py-2.5 border border-white/30 text-white rounded-xl text-sm font-semibold hover:bg-white/10 transition-colors font-sans"
                  >
                    Télécharger Zepargn
                  </a>
                </div>
              </div>
              {/* Placeholder cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 select-none pointer-events-none">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden opacity-40">
                    <div className="h-52 bg-gray-200 animate-pulse" />
                    <div className="p-5 space-y-3">
                      <div className="h-4 bg-gray-200 rounded w-1/3 animate-pulse" />
                      <div className="h-5 bg-gray-200 rounded w-2/3 animate-pulse" />
                      <div className="h-3 bg-gray-200 rounded w-1/2 animate-pulse" />
                      <div className="flex justify-between items-end pt-4">
                        <div className="h-6 bg-gray-200 rounded w-1/3 animate-pulse" />
                        <div className="h-10 w-24 bg-gray-200 rounded-lg animate-pulse" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Content */}
          {!loading && !error && !authRequired && (
            <>
              {/* Search + Filters bar */}
              <div className="flex flex-col sm:flex-row gap-2 mb-6">
                <div className="relative flex-1 max-w-lg">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Rechercher une destination..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-10 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 shadow-sm text-dark-800 placeholder-gray-400 text-sm font-sans"
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-200 transition-colors">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className={`inline-flex items-center gap-2 px-4 py-3 border rounded-xl text-sm font-medium transition-colors font-sans ${
                      showFilters || activeFilterCount > 0
                        ? 'border-primary-500 bg-primary-50 text-primary-600'
                        : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <SlidersHorizontal className="w-4 h-4" />
                    Filtres
                    {activeFilterCount > 0 && (
                      <span className="inline-flex items-center justify-center w-5 h-5 bg-primary-500 text-white text-xs font-bold rounded-full">
                        {activeFilterCount}
                      </span>
                    )}
                  </button>
                  <select
                    aria-label="Trier les voyages"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-4 py-3 border border-gray-200 bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm text-gray-600 font-sans"
                  >
                    <option value="default">Trier par</option>
                    <option value="price-low">Prix croissant</option>
                    <option value="price-high">Prix décroissant</option>
                    <option value="name">Nom A-Z</option>
                  </select>
                  {activeFilterCount > 0 && (
                    <button onClick={resetFilters} className="inline-flex items-center gap-1 px-3 py-3 text-sm text-gray-500 hover:text-gray-700 transition-colors font-sans">
                      <X className="w-3.5 h-3.5" /> Reset
                    </button>
                  )}
                </div>
              </div>

              {/* Filter panel */}
              {showFilters && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 bg-white p-5 rounded-2xl border border-gray-100 shadow-sm mb-6">
                  <div>
                    <label className="block text-xs font-semibold text-dark-800/50 mb-1.5 font-sans">Prix min (FCFA)</label>
                    <input type="number" value={priceMin} onChange={(e) => setPriceMin(e.target.value)} placeholder="0"
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 font-sans" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-dark-800/50 mb-1.5 font-sans">Prix max (FCFA)</label>
                    <input type="number" value={priceMax} onChange={(e) => setPriceMax(e.target.value)} placeholder="1 000 000"
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 font-sans" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-dark-800/50 mb-1.5 font-sans">Destination</label>
                    <select value={filterDestination} onChange={(e) => setFilterDestination(e.target.value)}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 font-sans">
                      <option value="">Toutes les destinations</option>
                      {uniqueDestinations.map(d => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-dark-800/50 mb-1.5 font-sans">Type de voyage</label>
                    <select value={filterTripType} onChange={(e) => setFilterTripType(e.target.value)}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 font-sans">
                      <option value="">Tous les types</option>
                      {uniqueTripTypes.map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-dark-800/50 mb-1.5 font-sans">Départ après</label>
                    <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 font-sans" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-dark-800/50 mb-1.5 font-sans">Départ avant</label>
                    <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 font-sans" />
                  </div>
                </div>
              )}

              {/* Results count */}
              <div className="flex items-center justify-between mb-6">
                <p className="text-dark-800/50 text-sm font-sans">
                  {filteredVoyages.length === 0
                    ? 'Aucun résultat'
                    : `${startIndex + 1}-${endIndex} de ${filteredVoyages.length} voyages`}
                </p>
              </div>

              {/* Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {displayedVoyages.map((voyage) => (
                  <div
                    key={voyage.id}
                    className="bg-white rounded-2xl shadow-card overflow-hidden group hover:-translate-y-1 hover:shadow-lg transition-all duration-300"
                  >
                    {/* Image */}
                    <div className="relative h-40 sm:h-52 overflow-hidden">
                      <img
                        src={voyage.photos?.[0] || 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800'}
                        alt={voyage.titre}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                      {/* Badges */}
                      <div className="absolute top-3 left-3 flex gap-2">
                        {voyage.duree && (
                          <span className="bg-white/95 backdrop-blur-sm text-xs font-semibold px-3 py-1.5 rounded-lg text-dark-800 flex items-center gap-1 font-sans">
                            <Clock className="w-3 h-3" /> {voyage.duree}
                          </span>
                        )}
                      </div>
                      <div className="absolute top-3 right-3">
                        <span className={`text-xs font-semibold px-3 py-1.5 rounded-lg font-sans ${
                          voyage.statut === 'en-cours'
                            ? 'bg-green-500 text-white'
                            : voyage.statut === 'complet'
                            ? 'bg-red-500 text-white'
                            : 'bg-gray-500 text-white'
                        }`}>
                          {voyage.statut === 'en-cours' ? 'Disponible' : voyage.statut === 'complet' ? 'Complet' : 'Bientôt'}
                        </span>
                      </div>
                      {/* Bottom overlay info */}
                      <div className="absolute bottom-3 left-3 right-3">
                        <div className="flex items-center gap-1.5 text-white/90">
                          <MapPin className="w-3.5 h-3.5" />
                          <span className="text-sm font-medium font-sans">{voyage.pays}</span>
                        </div>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-5">
                      <div className="flex items-center gap-1 mb-2">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={`w-3.5 h-3.5 ${i < (voyage.note ?? 4) ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`} />
                        ))}
                        <span className="text-xs text-dark-800/40 ml-1 font-sans">({voyage.nombreAvis || 0})</span>
                      </div>
                      <h3 className="font-playfair text-lg font-bold text-dark-800 mb-3 line-clamp-1">{voyage.titre}</h3>

                      {/* Meta row */}
                      <div className="flex items-center gap-3 text-xs text-dark-800/50 mb-4 font-sans">
                        {voyage.dateDebut && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" /> {voyage.dateDebut}
                          </span>
                        )}
                        {voyage.nombrePersonnes && (
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" /> {voyage.nombrePersonnes} places
                          </span>
                        )}
                      </div>

                      {/* Price breakdown */}
                      <div className="text-xs text-dark-800/50 mb-3 font-sans">
                        Acompte: {voyage.totalPrice ? fmtPrice(Math.round(voyage.totalPrice * 0.3)) : '—'} | Total: {voyage.totalPrice ? fmtPrice(voyage.totalPrice) : voyage.prix?.replace(/,/g, '.') + ' FCFA'}
                      </div>

                      {/* Price + CTA */}
                      <div className="flex items-end justify-between pt-3 border-t border-gray-100">
                        <div>
                          <p className="text-[10px] text-dark-800/40 uppercase font-medium tracking-wider font-sans">À partir de</p>
                          <p className="text-xl font-bold text-dark-800 font-sans">
                            {voyage.prix?.replace(/,/g, '.')}
                            <span className="text-xs font-medium text-dark-800/40 ml-1">FCFA</span>
                          </p>
                        </div>
                        <button
                          onClick={() => onViewDetails(voyage.id)}
                          className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-colors font-semibold text-sm font-sans"
                        >
                          Détails <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {displayedVoyages.length === 0 && (
                <div className="text-center py-20">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search className="w-7 h-7 text-gray-400" />
                  </div>
                  <p className="text-dark-800/50 text-lg mb-2 font-sans">Aucun voyage trouvé</p>
                  <button onClick={resetFilters} className="text-primary-500 hover:text-primary-600 font-semibold text-sm font-sans">
                    Réinitialiser les filtres
                  </button>
                </div>
              )}

              {totalPages > 1 && currentPage < totalPages && (
                <div className="flex justify-center mt-12">
                  <button
                    onClick={() => setCurrentPage(currentPage + 1)}
                    className="inline-flex items-center gap-2 px-8 py-3.5 bg-dark-800 text-white rounded-xl hover:bg-dark-700 transition-colors font-semibold text-sm shadow-lg hover:shadow-xl font-sans"
                  >
                    Voir plus de voyages <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* ═══════════════ POURQUOI NOUS ═══════════════ */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <span className="inline-block bg-primary-100 text-primary-500 text-xs font-bold uppercase tracking-[0.1em] px-4 py-1.5 rounded-full mb-4">
              POURQUOI LE TOURISTE.BJ
            </span>
            <h2 className="font-playfair text-3xl md:text-4xl font-bold text-dark-800 mb-3">
              La différence ? Ici, le voyage n'attend pas l'argent.
            </h2>
            <p className="text-dark-800/60 max-w-2xl mx-auto text-sm leading-relaxed font-sans">
              Zepargn vous aide à épargner pour un objectif concret. Ce partenariat est né de cette logique : voyager maintenant, financer progressivement.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                emoji: '\uD83D\uDD12',
                title: 'Acompte à 30%',
                desc: "Plus besoin d'attendre. 30% suffit pour bloquer votre place. Le solde se constitue dans Zepargn avant le départ.",
              },
              {
                emoji: '\uD83D\uDCB0',
                title: 'Épargne automatisée',
                desc: 'Définissez votre montant quotidien ou hebdomadaire. Zepargn débite, calcule, notifie. Vous suivez votre progression en temps réel.',
              },
              {
                emoji: '\uD83D\uDC65',
                title: 'Groupes sélectionnés',
                desc: "Entre 10 et 30 personnes par voyage. Des profils vérifiés, des ambiances garanties. Pas de mauvaises surprises.",
              },
              {
                emoji: '\uD83C\uDF0D',
                title: 'Ouvert à tout le monde',
                desc: "Inscription par numéro de téléphone. Bénin, Maroc, Sénégal, France, USA, Togo, Côte d'Ivoire — vous êtes où vous êtes, vous partez quand même.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="bg-white rounded-2xl shadow-card p-6 text-center hover:-translate-y-1 hover:shadow-lg transition-all duration-300"
              >
                <span className="text-4xl mb-4 block">{item.emoji}</span>
                <h3 className="text-lg font-bold text-dark-800 mb-2 font-sans">{item.title}</h3>
                <p className="text-sm text-dark-800/60 leading-relaxed font-sans">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ GALLERY ═══════════════ */}
      <section className="py-20 bg-dark-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <h2 className="font-playfair text-3xl md:text-4xl font-bold text-white mb-3">
              Nos destinations
            </h2>
            <p className="text-gray-400 max-w-xl mx-auto text-sm leading-relaxed font-sans">
              Découvrez les moments inoubliables de nos voyages précédents.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              'https://images.unsplash.com/photo-1523805009345-7448845a9e53?w=600&q=80',
              'https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?w=600&q=80',
              'https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?w=600&q=80',
              'https://images.unsplash.com/photo-1504150558240-0b4fd8946624?w=600&q=80',
              'https://images.unsplash.com/photo-1473116763249-2faaef81ccda?w=600&q=80',
              'https://images.unsplash.com/photo-1528543606781-2f6e6857f318?w=600&q=80',
            ].map((src, i) => (
              <div key={i} className="rounded-2xl overflow-hidden">
                <img
                  src={src}
                  alt={`Destination ${i + 1}`}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-64 object-cover hover:scale-[1.03] transition-transform duration-500"
                />
              </div>
            ))}
          </div>

          <div className="text-center mt-10">
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-500 font-semibold text-sm hover:text-primary-400 transition-colors font-sans"
            >
              Suivez-nous sur Instagram &rarr;
            </a>
          </div>
        </div>
      </section>

      {/* ═══════════════ TÉMOIGNAGES ═══════════════ */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <span className="inline-block bg-primary-100 text-primary-500 text-xs font-bold uppercase tracking-[0.1em] px-4 py-1.5 rounded-full mb-4">
              TÉMOIGNAGES
            </span>
            <h2 className="font-playfair text-3xl md:text-4xl font-bold text-dark-800 mb-3">
              Ce que disent nos voyageurs
            </h2>
            <p className="text-dark-800/60 max-w-2xl mx-auto text-sm leading-relaxed font-sans">
              Ils ont réservé avec 30% d'acompte, épargné le reste avec Zepargn, et sont partis.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                name: 'Amina K.',
                location: 'Cotonou, Bénin',
                text: "J'avais le budget pour l'acompte, pas pour le tout. En 3 mois d'épargne dans Zepargn, j'avais tout réglé. Je suis partie à Zanzibar avec LeTouriste.bj sans avoir détruit mes économies.",
                rating: 5,
                trip: 'Zanzibar, Août 2025',
              },
              {
                name: 'Roméo D.',
                location: 'Paris, France',
                text: "Depuis Paris, je cherchais un moyen de voyager au Bénin en organisant le paiement à l'avance. Le Touriste.bj est la seule option qui marche pour la diaspora.",
                rating: 5,
                trip: 'Grand-Popo-Ouidah, Décembre 2025',
              },
              {
                name: 'Farid S.',
                location: 'Lomé, Togo',
                text: "Le système m'a permis de voyager sans me mettre dans le rouge. J'ai mis de côté 60 000 FCFA par semaine pendant 7 mois. C'est tout.",
                rating: 4,
                trip: 'Ouidah, Mars 2025',
              },
            ].map((testimonial) => (
              <div
                key={testimonial.name}
                className="bg-white rounded-2xl shadow-card p-6 hover:-translate-y-1 hover:shadow-lg transition-all duration-300 relative"
              >
                <Quote className="w-8 h-8 text-primary-500/15 absolute top-5 right-5" />
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${i < testimonial.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`}
                    />
                  ))}
                </div>
                <p className="text-sm text-dark-800/70 leading-relaxed mb-5 font-sans">
                  "{testimonial.text}"
                </p>
                <div className="border-t border-gray-100 pt-4">
                  <p className="font-semibold text-dark-800 text-sm font-sans">{testimonial.name}</p>
                  <p className="text-xs text-dark-800/40 font-sans">{testimonial.location}</p>
                  <p className="text-xs text-primary-500 font-medium mt-1 font-sans">{testimonial.trip}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ CTA FINAL ═══════════════ */}
      <section className="py-24 bg-primary-500">
        <div className="max-w-3xl mx-auto text-center px-4">
          <h2 className="font-playfair text-3xl md:text-5xl font-extrabold text-white mb-4">
            Votre prochaine destination attend.
          </h2>
          <p className="text-white/80 mb-8 max-w-xl mx-auto font-sans">
            Des dizaines de voyageurs ont déjà réservé leur prochaine aventure sans attendre d'avoir tout l'argent. Pourquoi pas vous ?
          </p>
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            <button
              onClick={() => {
                const el = document.getElementById('voyages-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-primary-500 rounded-xl font-semibold hover:bg-gray-100 transition-all text-base shadow-lg hover:shadow-xl font-sans"
            >
              Voir les départs disponibles <ArrowRight className="w-5 h-5" />
            </button>
          </div>
          <div className="flex flex-wrap justify-center gap-4">
            <a
              href="https://apps.apple.com/us/app/zepargn/id6474701827"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white/15 backdrop-blur-sm text-white border border-white/30 rounded-xl font-semibold text-sm hover:bg-white/25 transition-all font-sans"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
              App Store
            </a>
            <a
              href="https://play.google.com/store/apps/details?id=com.digitalelevate.zepargnmobileapp"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white/15 backdrop-blur-sm text-white border border-white/30 rounded-xl font-semibold text-sm hover:bg-white/25 transition-all font-sans"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M3.18 23.04c.17.3.44.54.77.67.1.04.2.06.31.08l.13.01h.04c.11 0 .22-.02.33-.05.05-.02.09-.03.14-.05l8.05-4.56-3.32-3.32-6.45 7.22zm-.81-1.38L13.3 10.73 10.9 8.33 2.09 20.3c-.15.24-.22.52-.22.79 0 .2.04.39.12.57h-.01l.39-.01zM21.81 11.06l-3.37-1.91-3.63 3.18 3.47 3.47 3.53-2c.57-.32.94-.87.94-1.37 0-.51-.36-1.05-.94-1.37zM13.3 10.73L17.37 7 5.76.42c-.12-.07-.25-.12-.39-.16C5.22.2 5.07.17 4.92.18c-.08 0-.16.01-.24.03-.33.06-.63.23-.84.48l.05-.04 9.41 10.08z"/></svg>
              Google Play
            </a>
          </div>
        </div>
      </section>

      {/* ═══════════════ FAQ ═══════════════ */}
      <SEO jsonLd={buildFAQJsonLd(FAQ_DATA)} />
      <section id="faq-section" className="py-20 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <span className="inline-block bg-primary-100 text-primary-500 text-xs font-bold uppercase tracking-[0.1em] px-4 py-1.5 rounded-full mb-4">
              FAQ
            </span>
            <h2 className="font-playfair text-3xl md:text-4xl font-bold text-dark-800 mb-3">
              Tout savoir avant de réserver
            </h2>
            <p className="text-dark-800/60 max-w-xl mx-auto text-sm leading-relaxed font-sans">
              Vous avez des questions sur le fonctionnement du paiement ou de l'épargne ? On répond à tout.
            </p>
          </div>

          <div className="space-y-3">
            {FAQ_DATA.map((faq, index) => (
              <div
                key={index}
                className="bg-gray-50 rounded-2xl border border-gray-100 overflow-hidden hover:border-gray-200 transition-colors"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-100/50 transition-colors"
                >
                  <span className="font-semibold text-dark-800 text-sm pr-4 font-sans">{faq.q}</span>
                  <ChevronDown className={`w-5 h-5 text-dark-800/30 shrink-0 transition-transform ${openFaq === index ? 'rotate-180' : ''}`} />
                </button>
                {openFaq === index && (
                  <div className="px-5 pb-5 pt-0">
                    <p className="text-sm text-dark-800/60 leading-relaxed font-sans">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="text-center mt-10">
            <p className="text-dark-800/40 text-sm mb-3 font-sans">Vous ne trouvez pas la réponse ?</p>
            <a
              href="https://wa.me/22901613828269"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-green-500 text-white rounded-xl font-semibold text-sm hover:bg-green-600 transition-colors shadow-lg hover:shadow-xl font-sans"
            >
              <MessageSquare className="w-4 h-4" />
              Contactez-nous sur WhatsApp
            </a>
          </div>
        </div>
      </section>

      {/* ═══════════════ PARTENAIRES ═══════════════ */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <span className="inline-block bg-primary-100 text-primary-500 text-xs font-bold uppercase tracking-[0.1em] px-4 py-1.5 rounded-full mb-4">
            NOS PARTENAIRES
          </span>
          <h2 className="font-playfair text-3xl md:text-4xl font-bold text-dark-800 mb-10">
            Ils rendent le voyage possible
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 max-w-lg mx-auto gap-5">
            <div className="bg-gradient-to-br from-forest-800 to-forest-700 rounded-2xl p-6 flex flex-col items-center justify-center gap-3 shadow-md hover:shadow-lg transition-shadow">
              <img src={LogoZepargn} alt="Zepargn" className="h-12 object-contain brightness-0 invert" />
              <p className="text-white/70 text-xs font-sans">Épargne & paiement échelonné</p>
            </div>
            <div className="bg-primary-50 rounded-2xl p-6 flex flex-col items-center justify-center gap-3 border border-primary-200 shadow-md hover:shadow-lg transition-shadow">
              <img src={LogoTouristeBj} alt="Le Touriste.bj" className="h-10 object-contain" />
              <p className="text-dark-800/60 text-xs font-sans">Voyages de groupe au Bénin</p>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
};

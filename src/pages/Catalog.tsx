import React, { useState, useEffect } from 'react';
import { MapPin, Star, Search, Loader2, SlidersHorizontal, X, ArrowRight, Clock, Users, Calendar, ChevronRight } from 'lucide-react';
import { PublicLayout } from '../components/PublicLayout';
import { getVoyages } from '../api/trips';
import { useAuth } from '../context/AuthContext';
import LogoZepargn from '../assets/LogoZepargn.png';
import { useDebounce } from '../hooks/useDebounce';

import type { AuthMode } from './Auth';

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

  const activeFilterCount = [priceMin, priceMax, dateFrom, dateTo].filter(Boolean).length;

  const resetFilters = () => {
    setPriceMin('');
    setPriceMax('');
    setDateFrom('');
    setDateTo('');
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
  }, [debouncedSearch, sortBy, voyages, priceMin, priceMax, dateFrom, dateTo]);

  const totalPages = Math.ceil(filteredVoyages.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const displayedVoyages = filteredVoyages.slice(startIndex, startIndex + itemsPerPage);
  const endIndex = Math.min(startIndex + itemsPerPage, filteredVoyages.length);

  const fmtPrice = (v: number) => v.toLocaleString('fr-FR').replace(/\s/g, '.') + ' FCFA';

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
            src="https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1920&q=80"
            alt=""
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-dark-900/90 via-dark-800/70 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-dark-900/60 via-transparent to-transparent" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-20 w-full">
          <div className="max-w-2xl">
            <p className="text-primary-400 text-sm font-semibold uppercase tracking-widest mb-4">Agence de voyage au Benin</p>

            <h1 className="font-playfair text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
              Voyagez en groupe,
              <br />
              <span className="text-primary-400">Epargnez</span> en toute
              <br />
              <span className="relative">
                sérénité
                <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 200 12" fill="none">
                  <path d="M2 8 C50 2, 150 2, 198 8" stroke="#FF7F2A" strokeWidth="3" strokeLinecap="round" />
                </svg>
              </span>
            </h1>

            <p className="text-lg text-gray-300 mb-8 max-w-lg leading-relaxed">
              Reservez votre place, payez 50% d'acompte puis epargnez le reste a votre rythme avec ZePargn.
            </p>

            <div className="flex flex-wrap gap-4">
              <button
                onClick={() => {
                  const el = document.getElementById('voyages-section');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className="inline-flex items-center gap-2 px-7 py-3.5 bg-primary-500 text-white rounded-xl font-semibold hover:bg-primary-600 transition-all hover:shadow-lg hover:shadow-primary-500/25 text-base"
              >
                Voir les voyages <ArrowRight className="w-5 h-5" />
              </button>
              {!user && (
                <button
                  onClick={() => onOpenAuth?.('inscription')}
                  className="inline-flex items-center gap-2 px-7 py-3.5 bg-white/10 backdrop-blur-sm text-white border border-white/20 rounded-xl font-semibold hover:bg-white/20 transition-all text-base"
                >
                  Creer un compte
                </button>
              )}
            </div>

            {/* Stats */}
            <div className="flex gap-8 mt-12 pt-8 border-t border-white/10">
              {[
                { value: '500+', label: 'Voyageurs' },
                { value: '50+', label: 'Destinations' },
                { value: '100%', label: 'Securise' },
              ].map((stat) => (
                <div key={stat.label}>
                  <p className="text-2xl sm:text-3xl font-bold text-white">{stat.value}</p>
                  <p className="text-sm text-gray-400">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

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
            <p className="text-primary-500 font-semibold text-sm uppercase tracking-widest mb-2">Simple et rapide</p>
            <h2 className="font-playfair text-3xl md:text-4xl font-bold text-dark-800">
              Comment ca marche ?
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-10">
            {[
              {
                num: '1',
                title: 'Choisissez votre voyage',
                desc: 'Parcourez nos destinations et trouvez le voyage qui vous correspond.',
              },
              {
                num: '2',
                title: 'Reservez avec 50%',
                desc: 'Payez un acompte de 50% via MTN MoMo ou FedaPay pour confirmer votre place.',
              },
              {
                num: '3',
                title: 'Epargnez le reste',
                desc: 'Payez le solde a votre rythme avec ZePargn avant la date du voyage.',
              },
            ].map((item) => (
              <div key={item.num} className="text-center">
                <div className="w-14 h-14 bg-primary-500 text-white rounded-full flex items-center justify-center mx-auto mb-5 text-xl font-bold">
                  {item.num}
                </div>
                <h3 className="text-lg font-bold text-dark-800 mb-2">{item.title}</h3>
                <p className="text-sm text-dark-800/60 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ VOYAGES ═══════════════ */}
      <section id="voyages-section" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
            <div>
              <p className="text-primary-500 font-semibold text-sm uppercase tracking-widest mb-2">Explorez</p>
              <h2 className="font-playfair text-3xl md:text-4xl font-bold text-dark-800">
                Nos prochains departs
              </h2>
            </div>
            <p className="text-dark-800/50 text-sm max-w-sm">
              Decouvrez nos voyages de groupe soigneusement organises pour une experience inoubliable.
            </p>
          </div>

          {/* Loading */}
          {loading && (
            <div className="flex flex-col items-center py-20 gap-4">
              <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
              <p className="text-dark-800/40">Chargement des voyages...</p>
            </div>
          )}

          {/* Error */}
          {!loading && !authRequired && error && (
            <div className="flex flex-col items-center py-16 gap-4">
              <p className="text-red-500 font-medium">{error}</p>
              <button onClick={loadVoyages} className="px-6 py-2.5 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-colors text-sm font-semibold">
                Reessayer
              </button>
            </div>
          )}

          {/* Auth required */}
          {!loading && authRequired && (
            <div className="relative">
              <div className="flex flex-col sm:flex-row items-center justify-between bg-gradient-to-r from-dark-800 to-dark-700 text-white rounded-2xl px-6 py-5 mb-8 gap-4">
                <div className="flex items-center gap-3">
                  <div>
                    <p className="font-semibold text-sm">Connectez-vous pour decouvrir nos voyages</p>
                    <p className="text-xs text-white/60">Inscription gratuite en 2 minutes</p>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => onOpenAuth?.('connexion')}
                    className="px-5 py-2.5 bg-white text-dark-800 rounded-xl text-sm font-semibold hover:bg-gray-100 transition-colors"
                  >
                    Se connecter
                  </button>
                  <button
                    onClick={() => onOpenAuth?.('inscription')}
                    className="px-5 py-2.5 border border-white/30 text-white rounded-xl text-sm font-semibold hover:bg-white/10 transition-colors"
                  >
                    S'inscrire
                  </button>
                </div>
              </div>
              {/* Placeholder cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 select-none pointer-events-none">
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
              <div className="flex flex-col sm:flex-row gap-3 mb-6">
                <div className="relative flex-1 max-w-lg">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Rechercher une destination..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-10 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 shadow-sm text-dark-800 placeholder-gray-400 text-sm"
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
                    className={`inline-flex items-center gap-2 px-4 py-3 border rounded-xl text-sm font-medium transition-colors ${
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
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-4 py-3 border border-gray-200 bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm text-gray-600"
                  >
                    <option value="default">Trier par</option>
                    <option value="price-low">Prix croissant</option>
                    <option value="price-high">Prix decroissant</option>
                    <option value="name">Nom A-Z</option>
                  </select>
                  {activeFilterCount > 0 && (
                    <button onClick={resetFilters} className="inline-flex items-center gap-1 px-3 py-3 text-sm text-gray-500 hover:text-gray-700 transition-colors">
                      <X className="w-3.5 h-3.5" /> Reset
                    </button>
                  )}
                </div>
              </div>

              {/* Filter panel */}
              {showFilters && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-white p-5 rounded-2xl border border-gray-100 shadow-sm mb-6">
                  <div>
                    <label className="block text-xs font-semibold text-dark-800/50 mb-1.5">Prix min (FCFA)</label>
                    <input type="number" value={priceMin} onChange={(e) => setPriceMin(e.target.value)} placeholder="0"
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-dark-800/50 mb-1.5">Prix max (FCFA)</label>
                    <input type="number" value={priceMax} onChange={(e) => setPriceMax(e.target.value)} placeholder="1 000 000"
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-dark-800/50 mb-1.5">Depart apres</label>
                    <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-dark-800/50 mb-1.5">Depart avant</label>
                    <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                  </div>
                </div>
              )}

              {/* Results count */}
              <div className="flex items-center justify-between mb-6">
                <p className="text-dark-800/50 text-sm">
                  {filteredVoyages.length === 0
                    ? 'Aucun resultat'
                    : `${startIndex + 1}-${endIndex} de ${filteredVoyages.length} voyages`}
                </p>
              </div>

              {/* Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {displayedVoyages.map((voyage) => (
                  <div
                    key={voyage.id}
                    className="bg-white rounded-2xl border border-gray-100 overflow-hidden group hover:shadow-xl hover:shadow-gray-200/60 transition-all duration-300 hover:-translate-y-1"
                  >
                    {/* Image */}
                    <div className="relative h-56 overflow-hidden">
                      <img
                        src={voyage.photos?.[0] || 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800'}
                        alt={voyage.titre}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                      {/* Badges */}
                      <div className="absolute top-3 left-3 flex gap-2">
                        {voyage.duree && (
                          <span className="bg-white/95 backdrop-blur-sm text-xs font-semibold px-3 py-1.5 rounded-lg text-dark-800 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {voyage.duree}
                          </span>
                        )}
                      </div>
                      <div className="absolute top-3 right-3">
                        <span className={`text-xs font-semibold px-3 py-1.5 rounded-lg ${
                          voyage.statut === 'en-cours'
                            ? 'bg-green-500 text-white'
                            : voyage.statut === 'complet'
                            ? 'bg-red-500 text-white'
                            : 'bg-gray-500 text-white'
                        }`}>
                          {voyage.statut === 'en-cours' ? 'Disponible' : voyage.statut === 'complet' ? 'Complet' : 'Bientot'}
                        </span>
                      </div>
                      {/* Bottom overlay info */}
                      <div className="absolute bottom-3 left-3 right-3">
                        <div className="flex items-center gap-1.5 text-white/90">
                          <MapPin className="w-3.5 h-3.5" />
                          <span className="text-sm font-medium">{voyage.pays}</span>
                        </div>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-5">
                      <div className="flex items-center gap-1 mb-2">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={`w-3.5 h-3.5 ${i < (voyage.note ?? 4) ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`} />
                        ))}
                        <span className="text-xs text-dark-800/40 ml-1">({voyage.nombreAvis || 0})</span>
                      </div>
                      <h3 className="font-playfair text-lg font-bold text-dark-800 mb-3 line-clamp-1">{voyage.titre}</h3>

                      {/* Meta row */}
                      <div className="flex items-center gap-3 text-xs text-dark-800/50 mb-4">
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

                      {/* Price + CTA */}
                      <div className="flex items-end justify-between pt-3 border-t border-gray-100">
                        <div>
                          <p className="text-[10px] text-dark-800/40 uppercase font-medium tracking-wider">A partir de</p>
                          <p className="text-xl font-bold text-dark-800">
                            {voyage.prix?.replace(/,/g, '.')}
                            <span className="text-xs font-medium text-dark-800/40 ml-1">FCFA</span>
                          </p>
                        </div>
                        <button
                          onClick={() => onViewDetails(voyage.id)}
                          className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-colors font-semibold text-sm"
                        >
                          Details <ChevronRight className="w-4 h-4" />
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
                  <p className="text-dark-800/50 text-lg mb-2">Aucun voyage trouve</p>
                  <button onClick={resetFilters} className="text-primary-500 hover:text-primary-600 font-semibold text-sm">
                    Reinitialiser les filtres
                  </button>
                </div>
              )}

              {totalPages > 1 && currentPage < totalPages && (
                <div className="flex justify-center mt-12">
                  <button
                    onClick={() => setCurrentPage(currentPage + 1)}
                    className="inline-flex items-center gap-2 px-8 py-3.5 bg-dark-800 text-white rounded-xl hover:bg-dark-700 transition-colors font-semibold text-sm shadow-lg hover:shadow-xl"
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
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-primary-500 font-semibold text-sm uppercase tracking-widest mb-2">Pourquoi nous</p>
              <h2 className="font-playfair text-3xl md:text-4xl font-bold text-dark-800 mb-6">
                Le voyage de groupe<br />
                <span className="text-primary-500">reinvente</span>
              </h2>
              <p className="text-dark-800/60 mb-8 leading-relaxed">
                Le Touriste.bj vous permet de voyager en groupe tout en etalant vos paiements.
                Grace a notre partenariat avec ZePargn, payez 50% a la reservation puis epargnez le reste a votre rythme.
              </p>

              <ul className="space-y-4">
                {[
                  { title: 'Paiement securise', desc: 'MTN MoMo et FedaPay pour des transactions fiables' },
                  { title: 'Epargne flexible', desc: 'Payez le solde en plusieurs fois avant le depart' },
                  { title: 'Voyages de groupe', desc: 'Partagez des moments uniques avec d\'autres passionnes' },
                ].map((item) => (
                  <li key={item.title} className="flex gap-3">
                    <span className="w-2 h-2 bg-primary-500 rounded-full mt-2 shrink-0" />
                    <div>
                      <h4 className="font-semibold text-dark-800 mb-0.5">{item.title}</h4>
                      <p className="text-sm text-dark-800/50">{item.desc}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="relative">
              <div className="rounded-2xl overflow-hidden shadow-2xl">
                <img
                  src="https://images.unsplash.com/photo-1530789253388-582c481c54b0?w=800&q=80"
                  alt="Voyageurs heureux"
                  className="w-full h-[450px] object-cover"
                />
              </div>
              {/* Floating card */}
              <div className="absolute -bottom-6 -left-6 bg-white rounded-2xl shadow-xl border border-gray-100 p-5 max-w-[200px]">
                <p className="text-2xl font-bold text-primary-500 mb-0.5">100%</p>
                <p className="text-xs text-dark-800/50">Paiements securises</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════ CTA ═══════════════ */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1488085061387-422e29b40080?w=1920&q=80"
            alt=""
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-dark-800/85" />
        </div>
        <div className="relative max-w-3xl mx-auto text-center px-4">
          <h2 className="font-playfair text-3xl md:text-5xl font-bold text-white mb-4">
            Pret pour votre prochain
            <span className="text-primary-400"> voyage ?</span>
          </h2>
          <p className="text-gray-300 mb-8 max-w-xl mx-auto">
            Rejoignez des centaines de voyageurs qui ont choisi Le Touriste.bj pour explorer le monde autrement.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <button
              onClick={() => {
                const el = document.getElementById('voyages-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="inline-flex items-center gap-2 px-8 py-4 bg-primary-500 text-white rounded-xl font-semibold hover:bg-primary-600 transition-all text-base shadow-lg hover:shadow-xl"
            >
              Explorer les voyages <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </section>

      {/* ═══════════════ PARTENAIRES ═══════════════ */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <p className="text-primary-500 font-semibold text-sm uppercase tracking-widest mb-2">Confiance</p>
          <h2 className="font-playfair text-3xl md:text-4xl font-bold text-dark-800 mb-3">
            Nos partenaires
          </h2>
          <p className="text-dark-800/50 mb-10 max-w-lg mx-auto text-sm">
            Des partenaires de confiance pour garantir la qualite de vos voyages et la securite de vos paiements.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 max-w-lg mx-auto gap-5">
            <div className="bg-gradient-to-br from-forest-800 to-forest-700 rounded-2xl p-6 flex flex-col items-center justify-center gap-3 shadow-md hover:shadow-lg transition-shadow">
              <img src={LogoZepargn} alt="ZePargn" className="h-12 object-contain brightness-0 invert" />
              <p className="text-white/70 text-xs">Epargne & paiement echelonne</p>
            </div>
            <div className="bg-amber-50 rounded-2xl p-6 flex flex-col items-center justify-center gap-3 border border-amber-200 shadow-md hover:shadow-lg transition-shadow">
              <span className="text-amber-800 font-bold text-xl tracking-wide">Miwakpon</span>
              <p className="text-amber-700 text-xs">Tourisme & decouverte</p>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
};

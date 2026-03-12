import React, { useState, useEffect } from 'react';
import { MapPin, Star, LayoutGrid, List, Search, Loader2, LogIn, SlidersHorizontal, X } from 'lucide-react';
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
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
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
  }, [user]); // re-charger quand l'utilisateur se connecte

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
    // Price range filter
    if (priceMin) {
      const min = Number(priceMin);
      result = result.filter(v => (v.totalPrice ?? 0) >= min);
    }
    if (priceMax) {
      const max = Number(priceMax);
      result = result.filter(v => (v.totalPrice ?? 0) <= max);
    }
    // Departure date filter
    if (dateFrom) {
      const from = new Date(dateFrom);
      result = result.filter(v => {
        if (!v.rawDepartureDate) return false;
        return new Date(v.rawDepartureDate) >= from;
      });
    }
    if (dateTo) {
      const to = new Date(dateTo);
      result = result.filter(v => {
        if (!v.rawDepartureDate) return false;
        return new Date(v.rawDepartureDate) <= to;
      });
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

  return (
    <PublicLayout
      onAdminLogin={onAdminLogin}
      onOpenAuth={onOpenAuth}
      onMesVoyages={onMesVoyages}
      onLogout={onLogout}
    >
      {/* Hero Section */}
      <div className="relative h-[350px] overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1600)' }}
        >
          <div className="absolute inset-0 bg-forest-800/85" />
        </div>
        <div className="relative h-full flex items-center justify-center">
          <div className="text-center text-white">
            <h1 className="text-5xl md:text-6xl font-bold mb-4 tracking-tight font-display" style={{ fontFamily: "'Outfit', sans-serif" }}>
              LISTE DES VOYAGES
            </h1>
            <div className="flex items-center justify-center gap-2 text-gray-300 text-sm">
              <span>Accueil</span>
              <span>/</span>
              <span className="text-primary-400">Liste des Voyages</span>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 80" className="w-full" preserveAspectRatio="none">
            <path d="M0,40 C360,80 720,0 1080,40 C1260,60 1380,50 1440,40 L1440,80 L0,80 Z" fill="white" />
          </svg>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center py-20 gap-4">
            <Loader2 className="w-8 h-8 text-forest-800 animate-spin" />
            <p className="text-gray-400">Chargement des voyages...</p>
          </div>
        )}

        {/* Error non-auth */}
        {!loading && !authRequired && error && (
          <div className="flex flex-col items-center py-16 gap-4">
            <p className="text-red-500 font-medium">{error}</p>
            <button
              onClick={loadVoyages}
              className="px-6 py-2.5 bg-forest-800 text-white rounded-lg hover:bg-forest-900 transition-colors text-sm font-medium"
            >
              Réessayer
            </button>
          </div>
        )}

        {/* Placeholder cards when auth required */}
        {!loading && authRequired && (
          <div className="relative">
            {/* Bannière discrète */}
            <div className="flex items-center justify-between bg-forest-800 text-white rounded-xl px-5 py-3.5 mb-6 gap-4">
              <div className="flex items-center gap-3">
                <LogIn className="w-5 h-5 shrink-0" />
                <p className="text-sm font-medium">Connectez-vous pour explorer nos voyages disponibles</p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => onOpenAuth?.('connexion')}
                  className="px-4 py-1.5 bg-white text-forest-800 rounded-lg text-sm font-semibold hover:bg-gray-100 transition-colors"
                >
                  Se connecter
                </button>
                <button
                  onClick={() => onOpenAuth?.('inscription')}
                  className="px-4 py-1.5 border border-white/40 text-white rounded-lg text-sm font-semibold hover:bg-white/10 transition-colors"
                >
                  S'inscrire
                </button>
              </div>
            </div>
            {/* Placeholder cards floues */}
            <div className="space-y-5 select-none pointer-events-none">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 opacity-50">
                  <div className="flex flex-col md:flex-row gap-5">
                    <div className="md:w-64 h-52 md:h-48 bg-gray-200 rounded-xl animate-pulse shrink-0" />
                    <div className="flex-1 py-1 space-y-3">
                      <div className="h-3 bg-gray-200 rounded w-1/4 animate-pulse" />
                      <div className="h-5 bg-gray-200 rounded w-1/2 animate-pulse" />
                      <div className="h-3 bg-gray-200 rounded w-1/3 animate-pulse" />
                      <div className="mt-auto pt-8 flex justify-between items-end">
                        <div className="h-4 bg-gray-200 rounded w-1/3 animate-pulse" />
                        <div className="h-9 w-32 bg-gray-200 rounded-lg animate-pulse" />
                      </div>
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
            {/* Search Bar */}
            <div className="mb-6">
              <div className="relative max-w-xl">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher une destination, un pays..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 shadow-sm text-gray-700 placeholder-gray-400"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* Filter Panel */}
            <div className="mb-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`inline-flex items-center gap-2 px-4 py-2 border rounded-xl text-sm font-medium transition-colors ${
                    showFilters || activeFilterCount > 0
                      ? 'border-forest-800 bg-forest-800/5 text-forest-800'
                      : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  Filtres
                  {activeFilterCount > 0 && (
                    <span className="inline-flex items-center justify-center w-5 h-5 bg-forest-800 text-white text-xs font-bold rounded-full">
                      {activeFilterCount}
                    </span>
                  )}
                </button>
                {activeFilterCount > 0 && (
                  <button
                    onClick={resetFilters}
                    className="inline-flex items-center gap-1 px-3 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                    Réinitialiser
                  </button>
                )}
              </div>
              {showFilters && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-white p-4 rounded-xl border border-gray-200 mt-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Prix min (FCFA)</label>
                    <input
                      type="number"
                      value={priceMin}
                      onChange={(e) => setPriceMin(e.target.value)}
                      placeholder="0"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Prix max (FCFA)</label>
                    <input
                      type="number"
                      value={priceMax}
                      onChange={(e) => setPriceMax(e.target.value)}
                      placeholder="1 000 000"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Départ après</label>
                    <input
                      type="date"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Départ avant</label>
                    <input
                      type="date"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between mb-8">
              <p className="text-gray-600 text-sm">
                {filteredVoyages.length === 0
                  ? 'Aucun résultat'
                  : `${startIndex + 1}-${endIndex} de ${filteredVoyages.length} résultats`}
              </p>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1 border border-gray-200 rounded-lg overflow-hidden">
                  <button onClick={() => setViewMode('grid')} className={`p-2 transition-colors ${viewMode === 'grid' ? 'bg-primary-500 text-white' : 'text-gray-500 hover:bg-gray-100'}`}>
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                  <button onClick={() => setViewMode('list')} className={`p-2 transition-colors ${viewMode === 'list' ? 'bg-primary-500 text-white' : 'text-gray-500 hover:bg-gray-100'}`}>
                    <List className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-600 text-sm">Filtrer par</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white text-sm"
                  >
                    <option value="default">Par défaut</option>
                    <option value="price-low">Prix croissant</option>
                    <option value="price-high">Prix décroissant</option>
                    <option value="name">Nom A-Z</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Cards */}
            {viewMode === 'list' ? (
              <div className="space-y-5">
                {displayedVoyages.map((voyage) => (
                  <div key={voyage.id} className="bg-white rounded-2xl hover:shadow-lg transition-all duration-300 border border-gray-100 p-4">
                    <div className="flex flex-col md:flex-row gap-5">
                      <div className="md:w-64 h-52 md:h-48 relative overflow-hidden flex-shrink-0 rounded-xl">
                        <img
                          src={voyage.photos?.[0] || 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800'}
                          alt={voyage.titre}
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                      <div className="flex-1 flex flex-col justify-between py-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-xs text-dark-800/50 mb-2">
                              {voyage.duree} | Full Day Tours
                            </p>
                            <h3 className="font-playfair text-xl font-bold text-dark-800 mb-1.5">{voyage.titre}</h3>
                            <div className="flex items-center gap-1.5">
                              <MapPin className="w-3.5 h-3.5 text-primary-500" />
                              <span className="text-sm text-dark-800/60">{voyage.pays}</span>
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0 ml-4">
                            <div className="flex items-center gap-0.5 justify-end mb-1">
                              {[...Array(5)].map((_, i) => (
                                <Star key={i} className={`w-3.5 h-3.5 ${i < (voyage.note ?? 4) ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`} />
                              ))}
                            </div>
                            <p className="text-xs text-dark-800/50">{voyage.nombreAvis || 0} Reviews</p>
                          </div>
                        </div>
                        <div className="flex items-end justify-between mt-auto pt-4">
                          <div>
                            <p className="text-xs text-dark-800/40 mb-0.5">Conditions de paiement</p>
                            <p className="text-sm font-semibold text-dark-800">{voyage.conditionsPaiement}</p>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <div className="text-right">
                              <p className="text-xs text-dark-800/40 mb-0.5">Montant</p>
                              <p className="font-playfair text-2xl font-bold text-dark-800">
                                {voyage.prix.replace(/,/g, '.')}<span className="text-sm font-normal text-dark-800/50">FcFA</span>
                              </p>
                              <p className="text-xs text-dark-800/40">Par personne</p>
                            </div>
                            <button
                              onClick={() => onViewDetails(voyage.id)}
                              className="px-6 py-2.5 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors font-semibold text-sm"
                            >
                              Voir Les Détails
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {displayedVoyages.map((voyage) => (
                  <div key={voyage.id} className="bg-white rounded-2xl hover:shadow-lg transition-all duration-300 border border-gray-100 overflow-hidden group">
                    <div className="relative h-52 overflow-hidden">
                      <img
                        src={voyage.photos?.[0] || 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800'}
                        alt={voyage.titre}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute top-3 left-3">
                        <span className="bg-white/90 backdrop-blur-sm text-xs font-medium px-3 py-1 rounded-full text-dark-800">
                          {voyage.duree}
                        </span>
                      </div>
                    </div>
                    <div className="p-5">
                      <div className="flex items-center gap-0.5 mb-2">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={`w-3.5 h-3.5 ${i < (voyage.note ?? 4) ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`} />
                        ))}
                        <span className="text-xs text-gray-400 ml-1">({voyage.nombreAvis || 0})</span>
                      </div>
                      <h3 className="font-playfair text-lg font-bold text-dark-800 mb-1">{voyage.titre}</h3>
                      <div className="flex items-center gap-1.5 mb-4">
                        <MapPin className="w-3.5 h-3.5 text-primary-500" />
                        <span className="text-sm text-dark-800/60">{voyage.pays}</span>
                      </div>
                      <div className="flex items-end justify-between">
                        <div>
                          <p className="text-xs text-dark-800/40">À partir de</p>
                          <p className="font-playfair text-xl font-bold text-dark-800">
                            {voyage.prix.replace(/,/g, '.')}<span className="text-xs font-normal text-dark-800/50"> FcFA</span>
                          </p>
                        </div>
                        <button
                          onClick={() => onViewDetails(voyage.id)}
                          className="px-5 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors font-semibold text-sm"
                        >
                          Détails
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {displayedVoyages.length === 0 && (
              <div className="text-center py-16">
                <p className="text-gray-400 text-lg mb-2">Aucun voyage ne correspond à votre recherche</p>
                <button
                  onClick={resetFilters}
                  className="text-primary-500 hover:text-primary-600 font-medium"
                >
                  Réinitialiser les filtres
                </button>
              </div>
            )}

            {totalPages > 1 && currentPage < totalPages && (
              <div className="flex justify-center mt-10">
                <button
                  onClick={() => setCurrentPage(currentPage + 1)}
                  className="px-8 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors font-semibold shadow-md hover:shadow-lg"
                >
                  Voir Plus +
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* CTA Section */}
      <div className="relative py-24 mt-16 overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1600)' }}>
          <div className="absolute inset-0 bg-forest-800/90" />
        </div>
        <div className="relative max-w-4xl mx-auto text-center px-4">
          <p className="text-primary-400 font-semibold mb-3 tracking-wide text-sm uppercase">Love Where You're Going</p>
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-white">
            Explore Ta Vie, <span className="text-primary-400">Voyage Là Où Tu</span>
            <br /><span className="text-yellow-400">Souhaites!</span>
          </h2>
          <p className="text-gray-300 mb-8 max-w-2xl mx-auto text-sm">
            Réservez votre voyage et épargnez progressivement pour réaliser vos rêves de voyage.
          </p>
        </div>
      </div>

      {/* Partners Section */}
      <div className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-primary-500 font-semibold mb-3 tracking-wide uppercase text-sm">Nos Partenaires</p>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Nos Incroyables Partenaires</h2>
          <p className="text-gray-500 mb-12 max-w-2xl mx-auto text-sm">
            En partenariat avec ZePargn, nous vous offrons des conditions de paiement flexibles pour vos voyages.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 max-w-lg mx-auto gap-4 md:gap-8 items-center">
            <div className="bg-gradient-to-r from-forest-800 to-[#2a7d5e] rounded-xl p-4 h-20 flex items-center justify-center border border-transparent transition-shadow hover:shadow-md">
              <img src={LogoZepargn} alt="ZePargn" className="h-12 object-contain brightness-0 invert" />
            </div>
            <div className="bg-amber-50 rounded-xl p-6 h-20 flex items-center justify-center border border-amber-300 transition-shadow hover:shadow-md">
              <span className="text-amber-800 font-bold text-lg tracking-wide">Miwakpon</span>
            </div>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
};

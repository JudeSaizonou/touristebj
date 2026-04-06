import React, { useState, useEffect } from 'react';
import { MapPin, Star, Search, Loader2, SlidersHorizontal, X, ArrowRight, Clock, Users, Calendar, ChevronRight, ChevronLeft } from 'lucide-react';
import { PublicLayout } from '../components/PublicLayout';
import { getVoyages } from '../api/trips';
import { useAuth } from '../context/AuthContext';
import { useDebounce } from '../hooks/useDebounce';
import { SEO } from '../components/SEO';
import type { AuthMode } from './Auth';
import { fmtPrice } from '../utils/format';

interface VoyagesPageProps {
  onViewDetails: (voyageId: string) => void;
  onBack: () => void;
  onAdminLogin?: () => void;
  onOpenAuth?: (mode: AuthMode) => void;
  onMesVoyages?: () => void;
  onLogout?: () => void;
}

export const VoyagesPage: React.FC<VoyagesPageProps> = ({
  onViewDetails,
  onBack,
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
  const [sortBy, setSortBy] = useState('default');
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 300);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const activeFilterCount = [priceMin, priceMax, dateFrom, dateTo].filter(Boolean).length;

  const resetFilters = () => {
    setPriceMin(''); setPriceMax(''); setDateFrom(''); setDateTo('');
    setSearchQuery(''); setSortBy('default');
  };

  const loadVoyages = async () => {
    setLoading(true);
    setError('');
    try {
      const { voyages: data } = await getVoyages();
      setVoyages(data);
      setFilteredVoyages(data);
    } catch (err: any) {
      setError(err?.message || 'Impossible de charger les voyages.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadVoyages(); }, [user]);

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
    if (priceMin) result = result.filter(v => (v.totalPrice ?? 0) >= Number(priceMin));
    if (priceMax) result = result.filter(v => (v.totalPrice ?? 0) <= Number(priceMax));
    if (dateFrom) { const from = new Date(dateFrom); result = result.filter(v => v.rawDepartureDate && new Date(v.rawDepartureDate) >= from); }
    if (dateTo) { const to = new Date(dateTo); result = result.filter(v => v.rawDepartureDate && new Date(v.rawDepartureDate) <= to); }
    switch (sortBy) {
      case 'price-low': result.sort((a, b) => (a.totalPrice ?? 0) - (b.totalPrice ?? 0)); break;
      case 'price-high': result.sort((a, b) => (b.totalPrice ?? 0) - (a.totalPrice ?? 0)); break;
      case 'name': result.sort((a, b) => (a.titre || '').localeCompare(b.titre || '')); break;
    }
    setFilteredVoyages(result);
    setCurrentPage(1);
  }, [debouncedSearch, sortBy, voyages, priceMin, priceMax, dateFrom, dateTo]);

  const totalPages = Math.ceil(filteredVoyages.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const displayedVoyages = filteredVoyages.slice(startIndex, startIndex + itemsPerPage);
  const endIndex = Math.min(startIndex + itemsPerPage, filteredVoyages.length);

  return (
    <PublicLayout onAdminLogin={onAdminLogin} onOpenAuth={onOpenAuth} onMesVoyages={onMesVoyages} onLogout={onLogout}>
      <SEO title="Nos voyages" description="Découvrez tous nos voyages de groupe. Réservez avec 30% d'acompte." url="/voyages" />

      {/* Header */}
      <div className="bg-gradient-to-r from-dark-800 to-dark-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <button onClick={onBack} className="flex items-center gap-1.5 text-white/50 hover:text-white text-sm mb-3 transition-colors">
            <ChevronLeft className="w-4 h-4" /> Accueil
          </button>
          <h1 className="font-playfair text-2xl sm:text-3xl font-bold">Nos voyages</h1>
          <p className="text-white/60 text-sm mt-1">
            {filteredVoyages.length} voyage{filteredVoyages.length > 1 ? 's' : ''} disponible{filteredVoyages.length > 1 ? 's' : ''}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-8">
        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center py-20 gap-4">
            <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
            <p className="text-dark-800/40">Chargement des voyages...</p>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="flex flex-col items-center py-16 gap-4">
            <p className="text-red-500 font-medium">{error}</p>
            <button onClick={loadVoyages} className="px-6 py-2.5 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-colors text-sm font-semibold">
              Réessayer
            </button>
          </div>
        )}

        {/* Content */}
        {!loading && !error && (
          <>
            {/* Search + Filters */}
            <div className="flex flex-col sm:flex-row gap-2 mb-6">
              <div className="relative flex-1 max-w-lg">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher une destination..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-10 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 shadow-sm text-dark-800 placeholder-gray-400 text-sm"
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
                  aria-label="Trier les voyages"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-4 py-3 border border-gray-200 bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm text-gray-600"
                >
                  <option value="default">Trier par</option>
                  <option value="price-low">Prix croissant</option>
                  <option value="price-high">Prix décroissant</option>
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
                  <label className="block text-xs font-semibold text-dark-800/50 mb-1.5">Départ après</label>
                  <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-dark-800/50 mb-1.5">Départ avant</label>
                  <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                </div>
              </div>
            )}

            {/* Results count */}
            <div className="flex items-center justify-between mb-6">
              <p className="text-dark-800/50 text-sm">
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
                  <div className="relative h-40 sm:h-52 overflow-hidden">
                    <img
                      src={voyage.photos?.[0] || 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800'}
                      alt={voyage.titre}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                    <div className="absolute top-3 left-3 flex gap-2">
                      {voyage.duree && (
                        <span className="bg-white/95 backdrop-blur-sm text-xs font-semibold px-3 py-1.5 rounded-lg text-dark-800 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {voyage.duree}
                        </span>
                      )}
                    </div>
                    <div className="absolute top-3 right-3">
                      <span className={`text-xs font-semibold px-3 py-1.5 rounded-lg ${
                        voyage.statut === 'en-cours' ? 'bg-green-500 text-white'
                          : voyage.statut === 'complet' ? 'bg-red-500 text-white'
                          : 'bg-gray-500 text-white'
                      }`}>
                        {voyage.statut === 'en-cours' ? 'Disponible' : voyage.statut === 'complet' ? 'Complet' : 'Bientôt'}
                      </span>
                    </div>
                    <div className="absolute bottom-3 left-3 right-3">
                      <div className="flex items-center gap-1.5 text-white/90">
                        <MapPin className="w-3.5 h-3.5" />
                        <span className="text-sm font-medium">{voyage.pays}</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-5">
                    <div className="flex items-center gap-1 mb-2">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`w-3.5 h-3.5 ${i < (voyage.note ?? 4) ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`} />
                      ))}
                      <span className="text-xs text-dark-800/40 ml-1">({voyage.nombreAvis || 0})</span>
                    </div>
                    <h3 className="font-playfair text-lg font-bold text-dark-800 mb-3 line-clamp-1">{voyage.titre}</h3>

                    <div className="flex items-center gap-3 text-xs text-dark-800/50 mb-4">
                      {voyage.dateDebut && (
                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {voyage.dateDebut}</span>
                      )}
                      {voyage.nombrePersonnes && (
                        <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {voyage.nombrePersonnes} places</span>
                      )}
                    </div>

                    <div className="text-xs text-dark-800/50 mb-3">
                      Acompte: {voyage.totalPrice ? fmtPrice(Math.round(voyage.totalPrice * 0.3)) : '—'} | Total: {voyage.totalPrice ? fmtPrice(voyage.totalPrice) : voyage.prix?.replace(/,/g, '.') + ' FCFA'}
                    </div>

                    <div className="flex items-end justify-between pt-3 border-t border-gray-100">
                      <div>
                        <p className="text-[10px] text-dark-800/40 uppercase font-medium tracking-wider">À partir de</p>
                        <p className="text-xl font-bold text-dark-800">
                          {voyage.prix?.replace(/,/g, '.')}
                          <span className="text-xs font-medium text-dark-800/40 ml-1">FCFA</span>
                        </p>
                      </div>
                      <button
                        onClick={() => onViewDetails(voyage.id)}
                        className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-colors font-semibold text-sm"
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
                <p className="text-dark-800/50 text-lg mb-2">Aucun voyage trouvé</p>
                <button onClick={resetFilters} className="text-primary-500 hover:text-primary-600 font-semibold text-sm">
                  Réinitialiser les filtres
                </button>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-10">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-50 transition-colors"
                >
                  <ChevronLeft className="w-5 h-5 text-gray-600" />
                </button>
                <span className="text-sm text-gray-600 px-3">Page {currentPage} / {totalPages}</span>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage >= totalPages}
                  className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-50 transition-colors"
                >
                  <ChevronRight className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </PublicLayout>
  );
};

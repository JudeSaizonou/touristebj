import React, { useState, useEffect } from 'react';
import { MapPin, Star, LayoutGrid, List, Search } from 'lucide-react';
import { PublicLayout } from '../components/PublicLayout';
import { StorageService } from '../utils/storage';

interface CatalogProps {
  onViewDetails: (voyageId: string) => void;
  onAdminLogin?: () => void;
}

export const Catalog: React.FC<CatalogProps> = ({ onViewDetails, onAdminLogin }) => {
  const [voyages, setVoyages] = useState<any[]>([]);
  const [filteredVoyages, setFilteredVoyages] = useState<any[]>([]);
  const [sortBy, setSortBy] = useState('default');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  useEffect(() => {
    const data = StorageService.getVoyages();
    setVoyages(data);
    setFilteredVoyages(data);
  }, []);

  useEffect(() => {
    let result = [...voyages];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(v =>
        v.titre?.toLowerCase().includes(query) ||
        v.destination?.toLowerCase().includes(query) ||
        v.pays?.toLowerCase().includes(query)
      );
    }

    // Apply sort
    switch (sortBy) {
      case 'price-low':
        result.sort((a, b) => parseFloat(a.prix.replace(/,/g, '')) - parseFloat(b.prix.replace(/,/g, '')));
        break;
      case 'price-high':
        result.sort((a, b) => parseFloat(b.prix.replace(/,/g, '')) - parseFloat(a.prix.replace(/,/g, '')));
        break;
      case 'name':
        result.sort((a, b) => (a.titre || '').localeCompare(b.titre || ''));
        break;
    }

    setFilteredVoyages(result);
    setCurrentPage(1);
  }, [searchQuery, sortBy, voyages]);

  const totalPages = Math.ceil(filteredVoyages.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const displayedVoyages = filteredVoyages.slice(startIndex, startIndex + itemsPerPage);
  const endIndex = Math.min(startIndex + itemsPerPage, filteredVoyages.length);

  return (
    <PublicLayout onAdminLogin={onAdminLogin}>
      {/* Hero Section - Dark green with image overlay */}
      <div className="relative h-[350px] overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: 'url(https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1600)',
          }}
        >
          <div className="absolute inset-0 bg-[#1a4d3e]/85" />
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

        {/* Wave decoration at bottom */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 80" className="w-full" preserveAspectRatio="none">
            <path d="M0,40 C360,80 720,0 1080,40 C1260,60 1380,50 1440,40 L1440,80 L0,80 Z" fill="white" />
          </svg>
        </div>
      </div>

      {/* Search + Filters */}
      <div className="max-w-7xl mx-auto px-4 py-8">
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
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between mb-8">
          <p className="text-gray-600 text-sm">
            {filteredVoyages.length === 0
              ? 'Aucun résultat'
              : `${startIndex + 1}-${endIndex} de ${filteredVoyages.length} résultats`
            }
          </p>

          <div className="flex items-center gap-4">
            {/* View mode toggles */}
            <div className="flex items-center gap-1 border border-gray-200 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 transition-colors ${viewMode === 'grid' ? 'bg-primary-500 text-white' : 'text-gray-500 hover:bg-gray-100'}`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 transition-colors ${viewMode === 'list' ? 'bg-primary-500 text-white' : 'text-gray-500 hover:bg-gray-100'}`}
              >
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

        {/* Voyage Cards */}
        {viewMode === 'list' ? (
          /* List View */
          <div className="space-y-5">
            {displayedVoyages.map((voyage) => (
              <div
                key={voyage.id}
                className="bg-white rounded-2xl hover:shadow-lg transition-all duration-300 border border-gray-100 p-4"
              >
                <div className="flex flex-col md:flex-row gap-5">
                  {/* Image avec coins arrondis */}
                  <div className="md:w-64 h-52 md:h-48 relative overflow-hidden flex-shrink-0 rounded-xl">
                    <img
                      src={voyage.photos[0]}
                      alt={voyage.titre}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                    />
                  </div>

                  {/* Content */}
                  <div className="flex-1 flex flex-col justify-between py-1">
                    {/* Zone haute : infos + étoiles */}
                    <div className="flex items-start justify-between">
                      <div>
                        {/* Durée + type */}
                        <p className="text-xs text-[#17233E]/50 mb-2">
                          {voyage.duree} | Full Day Tours
                        </p>
                        {/* Titre en Playfair Display */}
                        <h3 className="font-playfair text-xl font-bold text-[#17233E] mb-1.5">
                          {voyage.titre}
                        </h3>
                        {/* Pays */}
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-[#FF7F2A]" />
                          <span className="text-sm text-[#17233E]/60">{voyage.pays}</span>
                        </div>
                      </div>

                      {/* Étoiles + reviews */}
                      <div className="text-right flex-shrink-0 ml-4">
                        <div className="flex items-center gap-0.5 justify-end mb-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3.5 h-3.5 ${
                                i < voyage.note
                                  ? 'fill-amber-400 text-amber-400'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                        <p className="text-xs text-[#17233E]/50">{voyage.nombreAvis} Reviews</p>
                      </div>
                    </div>

                    {/* Zone basse : conditions + montant + bouton */}
                    <div className="flex items-end justify-between mt-auto pt-4">
                      {/* Conditions de paiement */}
                      <div>
                        <p className="text-xs text-[#17233E]/40 mb-0.5">Conditions de paiement</p>
                        <p className="text-sm font-semibold text-[#17233E]">{voyage.conditionsPaiement}</p>
                      </div>

                      {/* Montant + Bouton empilés */}
                      <div className="flex flex-col items-end gap-2">
                        <div className="text-right">
                          <p className="text-xs text-[#17233E]/40 mb-0.5">Montant</p>
                          <p className="font-playfair text-2xl font-bold text-[#17233E]">
                            {voyage.prix.replace(/,/g, '.')}<span className="text-sm font-normal text-[#17233E]/50">FcFA</span>
                          </p>
                          <p className="text-xs text-[#17233E]/40">Par personne</p>
                        </div>
                        <button
                          onClick={() => onViewDetails(voyage.id)}
                          className="px-6 py-2.5 bg-[#FF7F2A] text-white rounded-lg hover:bg-[#e66d1e] transition-colors font-semibold text-sm"
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
          /* Grid View */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayedVoyages.map((voyage) => (
              <div
                key={voyage.id}
                className="bg-white rounded-2xl hover:shadow-lg transition-all duration-300 border border-gray-100 overflow-hidden group"
              >
                <div className="relative h-52 overflow-hidden">
                  <img
                    src={voyage.photos[0]}
                    alt={voyage.titre}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 left-3">
                    <span className="bg-white/90 backdrop-blur-sm text-xs font-medium px-3 py-1 rounded-full text-[#17233E]">
                      {voyage.duree}
                    </span>
                  </div>
                </div>
                <div className="p-5">
                  <div className="flex items-center gap-0.5 mb-2">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3.5 h-3.5 ${
                          i < voyage.note
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                    <span className="text-xs text-gray-400 ml-1">({voyage.nombreAvis})</span>
                  </div>
                  <h3 className="font-playfair text-lg font-bold text-[#17233E] mb-1">
                    {voyage.titre}
                  </h3>
                  <div className="flex items-center gap-1.5 mb-4">
                    <MapPin className="w-3.5 h-3.5 text-[#FF7F2A]" />
                    <span className="text-sm text-[#17233E]/60">{voyage.pays}</span>
                  </div>
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-xs text-[#17233E]/40">À partir de</p>
                      <p className="font-playfair text-xl font-bold text-[#17233E]">
                        {voyage.prix.replace(/,/g, '.')}<span className="text-xs font-normal text-[#17233E]/50"> FcFA</span>
                      </p>
                    </div>
                    <button
                      onClick={() => onViewDetails(voyage.id)}
                      className="px-5 py-2 bg-[#FF7F2A] text-white rounded-lg hover:bg-[#e66d1e] transition-colors font-semibold text-sm"
                    >
                      Détails
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* No results message */}
        {displayedVoyages.length === 0 && (
          <div className="text-center py-16">
            <p className="text-gray-400 text-lg mb-2">Aucun voyage ne correspond à votre recherche</p>
            <button
              onClick={() => { setSearchQuery(''); setSortBy('default'); }}
              className="text-primary-500 hover:text-primary-600 font-medium"
            >
              Réinitialiser les filtres
            </button>
          </div>
        )}

        {/* Voir Plus Button */}
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
      </div>

      {/* CTA Section - with dark background image */}
      <div className="relative py-24 mt-16 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: 'url(https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1600)',
          }}
        >
          <div className="absolute inset-0 bg-[#1a4d3e]/90" />
        </div>

        <div className="relative max-w-4xl mx-auto text-center px-4">
          <p className="text-primary-400 font-semibold mb-3 tracking-wide text-sm uppercase">
            Love Where You're Going
          </p>
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-white">
            Explore Ta Vie, <span className="text-primary-400">Voyage Là Où Tu</span>
            <br />
            <span className="text-yellow-400">Souhaites!</span>
          </h2>
          <p className="text-gray-300 mb-8 max-w-2xl mx-auto text-sm">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore
            et dolore magna aliqua.
          </p>
          <button className="inline-flex items-center justify-center w-16 h-16 bg-gray-900/80 text-white rounded-full hover:bg-gray-900 transition-all hover:scale-110 shadow-lg border-2 border-white/30">
            <svg className="w-6 h-6 ml-1" fill="currentColor" viewBox="0 0 20 20">
              <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Partners Section */}
      <div className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-primary-500 font-semibold mb-3 tracking-wide uppercase text-sm">
            Nos Partenaires
          </p>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Nos Incroyables Partenaires</h2>
          <p className="text-gray-500 mb-12 max-w-2xl mx-auto text-sm">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 md:gap-8 items-center">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-gray-50 rounded-lg p-6 h-20 flex items-center justify-center border border-gray-100">
                <div className="text-gray-300 font-bold text-lg tracking-wider">
                  {['PARTNER', 'BRAND', 'TRAVEL', 'AGENCY', 'GROUP'][i]}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PublicLayout>
  );
};

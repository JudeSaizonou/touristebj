import React, { useState, useEffect, useRef } from 'react';
import { Search, Mail, Bell, Plane, Users, Menu } from 'lucide-react';
import { StorageService } from '../utils/storage';

interface HeaderProps {
  userName: string;
  userRole: string;
  greeting: string;
  subGreeting: string;
  onNavigateToVoyage?: (voyageId: string) => void;
  onToggleSidebar?: () => void;
}

interface SearchResult {
  type: 'voyage' | 'voyageur';
  id: string;
  label: string;
  sublabel: string;
  voyageId?: string;
}

export const Header: React.FC<HeaderProps> = ({ userName, userRole, greeting, subGreeting, onNavigateToVoyage, onToggleSidebar }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setResults([]);
      setShowResults(false);
      return;
    }

    const q = searchQuery.toLowerCase();
    const searchResults: SearchResult[] = [];

    const voyages = StorageService.getVoyages();
    voyages.forEach((v: any) => {
      const dest = (v.destination || v.titre || '').toLowerCase();
      if (dest.includes(q)) {
        searchResults.push({
          type: 'voyage',
          id: v.id,
          label: v.destination || v.titre,
          sublabel: `${v.dateDebut} - ${v.prix} ${v.devise}`,
        });
      }
    });

    const allVoyageurs = StorageService.getAllVoyageurs();
    allVoyageurs.forEach(({ voyageur, voyageId, voyageDestination }) => {
      if (voyageur.nom.toLowerCase().includes(q)) {
        searchResults.push({
          type: 'voyageur',
          id: voyageur.id,
          label: voyageur.nom,
          sublabel: `Voyage: ${voyageDestination}`,
          voyageId,
        });
      }
    });

    setResults(searchResults.slice(0, 8));
    setShowResults(searchResults.length > 0);
  }, [searchQuery]);

  const handleResultClick = (result: SearchResult) => {
    if (result.type === 'voyage' && onNavigateToVoyage) {
      onNavigateToVoyage(result.id);
    } else if (result.type === 'voyageur' && result.voyageId && onNavigateToVoyage) {
      onNavigateToVoyage(result.voyageId);
    }
    setShowResults(false);
    setSearchQuery('');
  };

  return (
    <header className="bg-white border-b border-gray-200 px-4 md:px-8 py-3 md:py-4">
      <div className="flex items-center justify-between gap-2 md:gap-4">
        {/* Mobile hamburger + Greeting */}
        <div className="flex items-center gap-2 md:gap-3 min-w-0">
          <button
            onClick={onToggleSidebar}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors md:hidden shrink-0"
          >
            <Menu className="w-6 h-6 text-gray-600" />
          </button>
          <div className="min-w-0">
            <h1 className="text-base sm:text-lg md:text-2xl font-bold text-gray-900 truncate">
              {greeting}, {userName}!
            </h1>
            <p className="text-xs md:text-sm text-gray-500 mt-0.5 truncate">{subGreeting}</p>
          </div>
        </div>

        {/* Center section - Search */}
        <div className="hidden sm:block flex-1 max-w-xs md:max-w-md mx-2 md:mx-8" ref={searchRef}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher voyages, voyageurs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => results.length > 0 && setShowResults(true)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-colors"
            />

            {showResults && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50 max-h-80 overflow-y-auto">
                {results.map((result, i) => (
                  <button
                    key={`${result.type}-${result.id}-${i}`}
                    onClick={() => handleResultClick(result)}
                    className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3 transition-colors"
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      result.type === 'voyage' ? 'bg-primary-100 text-primary-600' : 'bg-blue-100 text-blue-600'
                    }`}>
                      {result.type === 'voyage' ? <Plane className="w-4 h-4" /> : <Users className="w-4 h-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{result.label}</p>
                      <p className="text-xs text-gray-500 truncate">{result.sublabel}</p>
                    </div>
                    <span className="text-xs text-gray-400 shrink-0">
                      {result.type === 'voyage' ? 'Voyage' : 'Voyageur'}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right section - Icons and Profile */}
        <div className="flex items-center gap-2 md:gap-4 shrink-0">
          <button className="hidden sm:block p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <Mail className="w-5 h-5 text-gray-600" />
          </button>
          <button className="hidden sm:block p-2 hover:bg-gray-100 rounded-lg transition-colors relative">
            <Bell className="w-5 h-5 text-gray-600" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>

          <div className="flex items-center gap-2 md:gap-3 ml-1 md:ml-2">
            <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center text-white font-semibold shadow-md text-sm md:text-base">
              J
            </div>
            <div className="hidden md:block text-right">
              <div className="text-sm font-semibold text-gray-900">{userName}</div>
              <div className="text-xs text-gray-500">{userRole}</div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

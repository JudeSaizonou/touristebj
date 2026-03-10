import React, { useState, useEffect } from 'react';
import { Search, SlidersHorizontal, Calendar, Upload, Plus, Pencil, Trash2, ChevronLeft, ChevronRight, ArrowUpDown, ChevronUp, ChevronDown, X } from 'lucide-react';
import { Voyage, VoyageStatus } from '../types';
import * as tripsApi from '../api/trips';
import { ConfirmModal } from '../components/ConfirmModal';
import { ExportModal } from '../components/ExportModal';
import { ToastContainer, useToast } from '../components/Toast';
import { handleExport } from '../utils/export';

interface VoyagesProps {
  onCreateVoyage: () => void;
  onEditVoyage: (voyageId: string) => void;
}

const StatusBadge: React.FC<{ status: VoyageStatus }> = ({ status }) => {
  const styles = {
    'pause': 'bg-success-100 text-success-600 border-success-200',
    'en-cours': 'bg-purple-100 text-purple-600 border-purple-200',
    'complet': 'bg-gray-100 text-gray-600 border-gray-200',
  };

  const labels = {
    'pause': 'Pause',
    'en-cours': 'En cours',
    'complet': 'Complet',
  };

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${styles[status]}`}>
      {labels[status]}
    </span>
  );
};

type SortField = 'destination' | 'date' | 'auteur' | 'etat' | 'prix' | 'acomptesRecus' | 'placesRestantes';
type SortDirection = 'asc' | 'desc' | null;

export const Voyages: React.FC<VoyagesProps> = ({ onCreateVoyage, onEditVoyage }) => {
  const [voyages, setVoyages] = useState<Voyage[]>([]);
  const [selectedVoyages, setSelectedVoyages] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(6);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | VoyageStatus>('all');
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [filterStatut, setFilterStatut] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState({ from: '', to: '' });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const { toasts, addToast, removeToast } = useToast();

  useEffect(() => {
    loadVoyages();
  }, []);

  const loadVoyages = async () => {
    try {
      const { voyages: list } = await tripsApi.getPartnerVoyages();
      const mappedData = list.map((v: any) => ({
        id: v.id,
        destination: v.destination || v.titre,
        date: v.dateDebut,
        auteur: v.auteur,
        etat: v.statut,
        prix: v.prix ? `${v.prix} ${v.devise || ''}`.trim() : '',
        acomptesRecus: v.acomptesRecus,
        placesRestantes: v.placesRestantes,
      }));
      setVoyages(mappedData);
    } catch (e) {
      addToast('error', (e as { message?: string })?.message || 'Erreur chargement des voyages');
    }
  };

  const handleDelete = (id: string) => {
    setDeleteTarget(id);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await tripsApi.deleteVoyage(deleteTarget);
      await loadVoyages();
      setSelectedVoyages(prev => prev.filter(vid => vid !== deleteTarget));
      addToast('success', 'Voyage supprimé avec succès');
      setDeleteTarget(null);
    } catch (e) {
      addToast('error', (e as { message?: string })?.message || 'Erreur suppression');
    }
  };

  const handleExportFormat = (format: 'csv' | 'pdf' | 'xlsx') => {
    const headers = ['Voyage', 'Date', 'Auteur', 'État', 'Prix', 'Acomptes reçus', 'Places restantes'];
    const rows = filteredVoyages.map(v => [v.destination, v.date, v.auteur, v.etat, v.prix, v.acomptesRecus, v.placesRestantes]);
    handleExport(format, {
      headers,
      rows,
      filename: 'voyages_export'
    });
    addToast('success', `Export ${format.toUpperCase()} téléchargé`);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        setSortField(null);
        setSortDirection(null);
      }
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    setCurrentPage(1);
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="w-4 h-4 text-gray-400" />;
    if (sortDirection === 'asc') return <ChevronUp className="w-4 h-4 text-primary-600" />;
    return <ChevronDown className="w-4 h-4 text-primary-600" />;
  };

  // Filter by search, status, and advanced filters
  let filteredVoyages = voyages.filter(v => {
    const matchSearch = v.destination.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = statusFilter === 'all' || v.etat === statusFilter;
    const matchFilterStatut = filterStatut.length === 0 || filterStatut.includes(v.etat);
    return matchSearch && matchStatus && matchFilterStatut;
  });

  // Date range filter
  if (dateRange.from || dateRange.to) {
    filteredVoyages = filteredVoyages.filter(v => {
      if (!v.date) return true;
      const vDate = v.date;
      if (dateRange.from && vDate < dateRange.from) return false;
      if (dateRange.to && vDate > dateRange.to) return false;
      return true;
    });
  }

  // Apply sorting
  if (sortField && sortDirection) {
    filteredVoyages = [...filteredVoyages].sort((a, b) => {
      let valA: string | number = '';
      let valB: string | number = '';

      switch (sortField) {
        case 'destination':
          valA = a.destination.toLowerCase();
          valB = b.destination.toLowerCase();
          break;
        case 'date':
          valA = a.date || '';
          valB = b.date || '';
          break;
        case 'auteur':
          valA = a.auteur.toLowerCase();
          valB = b.auteur.toLowerCase();
          break;
        case 'etat':
          valA = a.etat;
          valB = b.etat;
          break;
        case 'prix':
          valA = parseFloat(a.prix.replace(/[^0-9.,]/g, '').replace(',', '.')) || 0;
          valB = parseFloat(b.prix.replace(/[^0-9.,]/g, '').replace(',', '.')) || 0;
          break;
        case 'acomptesRecus':
          valA = parseFloat(String(a.acomptesRecus).replace(/[^0-9.,]/g, '').replace(',', '.')) || 0;
          valB = parseFloat(String(b.acomptesRecus).replace(/[^0-9.,]/g, '').replace(',', '.')) || 0;
          break;
        case 'placesRestantes':
          valA = parseInt(String(a.placesRestantes)) || 0;
          valB = parseInt(String(b.placesRestantes)) || 0;
          break;
      }

      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }

  const totalPages = Math.max(1, Math.ceil(filteredVoyages.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const displayedVoyages = filteredVoyages.slice(startIndex, startIndex + itemsPerPage);

  const toggleSelectAll = () => {
    if (selectedVoyages.length === filteredVoyages.length) {
      setSelectedVoyages([]);
    } else {
      setSelectedVoyages(filteredVoyages.map(v => v.id));
    }
  };

  const toggleSelectVoyage = (id: string) => {
    setSelectedVoyages(prev =>
      prev.includes(id) ? prev.filter(vid => vid !== id) : [...prev, id]
    );
  };

  const tabItems = [
    { id: 'all' as const, label: 'Les voyages' },
    { id: 'pause' as const, label: 'En pause' },
    { id: 'complet' as const, label: 'Complet' },
  ];

  const toggleFilterStatut = (statut: string) => {
    setFilterStatut(prev =>
      prev.includes(statut) ? prev.filter(s => s !== statut) : [...prev, statut]
    );
    setCurrentPage(1);
  };

  return (
    <div className="p-4 md:p-8 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
      <ToastContainer toasts={toasts} onClose={removeToast} />

      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Supprimer le voyage"
        message="Êtes-vous sûr de vouloir supprimer ce voyage ? Cette action est irréversible."
        confirmLabel="Supprimer"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        onExport={handleExportFormat}
        title="Exporter les voyages"
      />

      {/* Tabs */}
      <div className="bg-white rounded-t-xl border-b border-gray-200">
        <div className="flex gap-8 px-6">
          {tabItems.map(tab => (
            <button
              key={tab.id}
              onClick={() => { setStatusFilter(tab.id); setCurrentPage(1); }}
              className={`px-4 py-4 font-semibold transition-colors ${
                statusFilter === tab.id
                  ? 'text-primary-600 border-b-2 border-primary-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Filters and Actions */}
      <div className="bg-white px-4 md:px-6 py-4 border-b border-gray-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-wrap w-full md:w-auto">
          <div className="relative w-full sm:w-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par voyage"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className="pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-colors w-full sm:w-80"
            />
          </div>

          {/* Filtres dropdown */}
          <div className="relative">
            <button
              onClick={() => { setShowFilterDropdown(!showFilterDropdown); setShowDatePicker(false); }}
              className={`flex items-center gap-2 px-4 py-2.5 border rounded-lg hover:bg-gray-50 transition-colors ${filterStatut.length > 0 ? 'border-primary-400 bg-primary-50' : 'border-gray-200'}`}
            >
              <SlidersHorizontal className="w-5 h-5 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">Filtres</span>
              {filterStatut.length > 0 && (
                <span className="bg-primary-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {filterStatut.length}
                </span>
              )}
            </button>
            {showFilterDropdown && (
              <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg z-50 w-56 py-2">
                <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase">Statut</div>
                {[
                  { value: 'pause', label: 'En pause' },
                  { value: 'en-cours', label: 'En cours' },
                  { value: 'complet', label: 'Complet' },
                ].map(item => (
                  <label key={item.value} className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filterStatut.includes(item.value)}
                      onChange={() => toggleFilterStatut(item.value)}
                      className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm text-gray-700">{item.label}</span>
                  </label>
                ))}
                {filterStatut.length > 0 && (
                  <div className="border-t border-gray-100 mt-1 pt-1 px-3">
                    <button
                      onClick={() => { setFilterStatut([]); setCurrentPage(1); }}
                      className="text-xs text-red-500 hover:text-red-700 py-1"
                    >
                      Réinitialiser
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Date range picker */}
          <div className="relative">
            <button
              onClick={() => { setShowDatePicker(!showDatePicker); setShowFilterDropdown(false); }}
              className={`flex items-center gap-2 px-4 py-2.5 border rounded-lg hover:bg-gray-50 transition-colors ${(dateRange.from || dateRange.to) ? 'border-primary-400 bg-primary-50' : 'border-gray-200'}`}
            >
              <Calendar className="w-5 h-5 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">
                {dateRange.from && dateRange.to
                  ? `${dateRange.from} - ${dateRange.to}`
                  : dateRange.from
                    ? `Depuis ${dateRange.from}`
                    : dateRange.to
                      ? `Jusqu'à ${dateRange.to}`
                      : 'Période'}
              </span>
              {(dateRange.from || dateRange.to) && (
                <button
                  onClick={(e) => { e.stopPropagation(); setDateRange({ from: '', to: '' }); setCurrentPage(1); }}
                  className="ml-1 hover:bg-gray-200 rounded p-0.5"
                >
                  <X className="w-3 h-3 text-gray-500" />
                </button>
              )}
            </button>
            {showDatePicker && (
              <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg z-50 w-64 p-4">
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Date de début</label>
                    <input
                      type="date"
                      value={dateRange.from}
                      onChange={(e) => { setDateRange(prev => ({ ...prev, from: e.target.value })); setCurrentPage(1); }}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Date de fin</label>
                    <input
                      type="date"
                      value={dateRange.to}
                      onChange={(e) => { setDateRange(prev => ({ ...prev, to: e.target.value })); setCurrentPage(1); }}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <button
                    onClick={() => setShowDatePicker(false)}
                    className="w-full py-2 bg-primary-500 text-white rounded-lg text-sm font-medium hover:bg-primary-600 transition-colors"
                  >
                    Appliquer
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowExportModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Upload className="w-5 h-5 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Exporter</span>
          </button>
          <button
            onClick={onCreateVoyage}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors shadow-md"
          >
            <Plus className="w-5 h-5" />
            <span className="text-sm font-semibold">Créer un voyage</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-b-xl shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left">
                  <input
                    type="checkbox"
                    checked={selectedVoyages.length === filteredVoyages.length && filteredVoyages.length > 0}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                </th>
                {([
                  { field: 'destination' as SortField, label: 'Voyage' },
                  { field: 'date' as SortField, label: 'Date' },
                  { field: 'auteur' as SortField, label: 'Auteur' },
                  { field: 'etat' as SortField, label: 'État' },
                  { field: 'prix' as SortField, label: 'Prix' },
                  { field: 'acomptesRecus' as SortField, label: 'Acomptes reçus' },
                  { field: 'placesRestantes' as SortField, label: 'Places restantes' },
                ]).map(col => (
                  <th key={col.field} className="px-6 py-4 text-left text-sm font-semibold text-gray-600">
                    <button
                      onClick={() => handleSort(col.field)}
                      className={`flex items-center gap-2 hover:text-gray-900 transition-colors ${sortField === col.field ? 'text-primary-600' : ''}`}
                    >
                      {col.label}
                      {getSortIcon(col.field)}
                    </button>
                  </th>
                ))}
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {displayedVoyages.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-gray-400">
                    Aucun voyage trouvé
                  </td>
                </tr>
              ) : displayedVoyages.map((voyage) => (
                <tr key={voyage.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={selectedVoyages.includes(voyage.id)}
                      onChange={() => toggleSelectVoyage(voyage.id)}
                      className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-semibold text-gray-900">{voyage.destination}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-gray-700">{voyage.date}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-gray-700">{voyage.auteur}</span>
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={voyage.etat} />
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-gray-900 font-medium">{voyage.prix}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-gray-900 font-medium">{voyage.acomptesRecus}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-gray-700">{voyage.placesRestantes}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onEditVoyage(voyage.id)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <Pencil className="w-4 h-4 text-gray-600" />
                      </button>
                      <button
                        onClick={() => handleDelete(voyage.id)}
                        className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>Show result:</span>
            <select
              value={itemsPerPage}
              onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
              className="px-3 py-1 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value={6}>6</option>
              <option value={12}>12</option>
              <option value={24}>24</option>
              <option value={50}>50</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>

            {[...Array(Math.min(4, totalPages))].map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i + 1)}
                className={`w-8 h-8 rounded-lg transition-colors ${
                  currentPage === i + 1
                    ? 'bg-primary-500 text-white'
                    : 'hover:bg-gray-100 text-gray-700'
                }`}
              >
                {i + 1}
              </button>
            ))}

            {totalPages > 4 && (
              <>
                <span className="text-gray-400 px-2">...</span>
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  className="w-8 h-8 rounded-lg hover:bg-gray-100 text-gray-700 transition-colors"
                >
                  {totalPages}
                </button>
              </>
            )}

            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

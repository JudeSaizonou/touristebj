import React, { useState, useEffect } from 'react';
import { Search, SlidersHorizontal, Calendar, Upload, Plus, Pencil, Trash2, ChevronLeft, ChevronRight, ArrowUpDown, ChevronUp, ChevronDown, X } from 'lucide-react';
import { StorageService } from '../utils/storage';
import { ConfirmModal } from './ConfirmModal';
import { ExportModal } from './ExportModal';
import { ToastContainer, useToast } from './Toast';
import { handleExport } from '../utils/export';

interface Voyageur {
  id: string;
  nom: string;
  date: string;
  statutPaiement: 'acompte-paye' | 'epargne-en-cours' | 'solde' | 'financement-accorde' | 'reservation-annulee';
  moyenUtilise: 'epargne' | 'financement' | 'une-fois' | 'annule';
  telephone: string;
  acomptesRecus: string;
  montantsRestants: string;
}

const StatutPaiementBadge: React.FC<{ statut: Voyageur['statutPaiement'] }> = ({ statut }) => {
  const styles = {
    'acompte-paye': 'bg-success-100 text-success-600 border-success-200',
    'epargne-en-cours': 'bg-blue-100 text-blue-600 border-blue-200',
    'solde': 'bg-teal-100 text-teal-600 border-teal-200',
    'financement-accorde': 'bg-cyan-100 text-cyan-600 border-cyan-200',
    'reservation-annulee': 'bg-success-100 text-success-600 border-success-200',
  };

  const labels = {
    'acompte-paye': 'Acompte payé',
    'epargne-en-cours': 'Épargne en cours',
    'solde': 'Soldé',
    'financement-accorde': 'Financement accordé',
    'reservation-annulee': 'Réservation annulée',
  };

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${styles[statut]}`}>
      {labels[statut]}
    </span>
  );
};

const MoyenBadge: React.FC<{ moyen: Voyageur['moyenUtilise'] }> = ({ moyen }) => {
  const styles = {
    'epargne': 'bg-success-100 text-success-600 border-success-200',
    'financement': 'bg-teal-100 text-teal-600 border-teal-200',
    'une-fois': 'bg-purple-100 text-purple-600 border-purple-200',
    'annule': 'bg-gray-100 text-gray-600 border-gray-200',
  };

  const labels = {
    'epargne': 'Épargne',
    'financement': 'Financement',
    'une-fois': 'Une fois',
    'annule': 'Annulé',
  };

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${styles[moyen]}`}>
      {labels[moyen]}
    </span>
  );
};

// Voyageur Form Modal
interface VoyageurFormModalProps {
  isOpen: boolean;
  voyageur?: Voyageur | null;
  onSave: (data: Omit<Voyageur, 'id'> & { id?: string }) => void;
  onClose: () => void;
}

const VoyageurFormModal: React.FC<VoyageurFormModalProps> = ({ isOpen, voyageur, onSave, onClose }) => {
  const [form, setForm] = useState({
    nom: '',
    telephone: '',
    statutPaiement: 'acompte-paye' as Voyageur['statutPaiement'],
    moyenUtilise: 'epargne' as Voyageur['moyenUtilise'],
    acomptesRecus: '',
    montantsRestants: '',
  });

  useEffect(() => {
    if (voyageur) {
      setForm({
        nom: voyageur.nom,
        telephone: voyageur.telephone,
        statutPaiement: voyageur.statutPaiement,
        moyenUtilise: voyageur.moyenUtilise,
        acomptesRecus: voyageur.acomptesRecus,
        montantsRestants: voyageur.montantsRestants,
      });
    } else {
      setForm({
        nom: '',
        telephone: '',
        statutPaiement: 'acompte-paye',
        moyenUtilise: 'epargne',
        acomptesRecus: '',
        montantsRestants: '',
      });
    }
  }, [voyageur, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nom.trim() || !form.telephone.trim()) return;
    onSave({
      ...(voyageur ? { id: voyageur.id } : {}),
      nom: form.nom,
      date: voyageur?.date || new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      telephone: form.telephone,
      statutPaiement: form.statutPaiement,
      moyenUtilise: form.moyenUtilise,
      acomptesRecus: form.acomptesRecus || '0 FCFA',
      montantsRestants: form.montantsRestants || '0 FCFA',
    });
  };

  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl p-6 max-w-lg w-full mx-4 animate-scale-in">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">
            {voyageur ? 'Modifier le voyageur' : 'Ajouter un voyageur'}
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nom complet *</label>
              <input
                type="text"
                value={form.nom}
                onChange={(e) => setForm({ ...form, nom: e.target.value })}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white text-sm"
                placeholder="NOM Prénom"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone *</label>
              <input
                type="text"
                value={form.telephone}
                onChange={(e) => setForm({ ...form, telephone: e.target.value })}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white text-sm"
                placeholder="+229..."
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Statut du paiement</label>
              <select
                value={form.statutPaiement}
                onChange={(e) => setForm({ ...form, statutPaiement: e.target.value as Voyageur['statutPaiement'] })}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
              >
                <option value="acompte-paye">Acompte payé</option>
                <option value="epargne-en-cours">Épargne en cours</option>
                <option value="solde">Soldé</option>
                <option value="financement-accorde">Financement accordé</option>
                <option value="reservation-annulee">Réservation annulée</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Moyen utilisé</label>
              <select
                value={form.moyenUtilise}
                onChange={(e) => setForm({ ...form, moyenUtilise: e.target.value as Voyageur['moyenUtilise'] })}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
              >
                <option value="epargne">Épargne</option>
                <option value="financement">Financement</option>
                <option value="une-fois">Une fois</option>
                <option value="annule">Annulé</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Acomptes reçus</label>
              <input
                type="text"
                value={form.acomptesRecus}
                onChange={(e) => setForm({ ...form, acomptesRecus: e.target.value })}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white text-sm"
                placeholder="500,000 FCFA"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Montants restants</label>
              <input
                type="text"
                value={form.montantsRestants}
                onChange={(e) => setForm({ ...form, montantsRestants: e.target.value })}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white text-sm"
                placeholder="500,000 FCFA"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-primary-500 hover:bg-primary-600 rounded-lg transition-colors"
            >
              {voyageur ? 'Modifier' : 'Ajouter'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface VoyageursListProps {
  voyageId: string;
}

type SortField = 'nom' | 'date' | 'statutPaiement' | 'moyenUtilise' | 'telephone' | 'acomptesRecus' | 'montantsRestants';
type SortDirection = 'asc' | 'desc' | null;

export const VoyageursList: React.FC<VoyageursListProps> = ({ voyageId }) => {
  const [voyageurs, setVoyageurs] = useState<Voyageur[]>([]);
  const [selectedVoyageurs, setSelectedVoyageurs] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [itemsPerPage, setItemsPerPage] = useState(6);
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingVoyageur, setEditingVoyageur] = useState<Voyageur | null>(null);
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
    loadVoyageurs();
  }, [voyageId]);

  const loadVoyageurs = () => {
    const data = StorageService.getVoyageursByVoyage(voyageId);
    setVoyageurs(data);
  };

  const handleDelete = (voyageurId: string) => {
    setDeleteTarget(voyageurId);
  };

  const confirmDelete = () => {
    if (deleteTarget) {
      StorageService.deleteVoyageur(voyageId, deleteTarget);
      loadVoyageurs();
      setSelectedVoyageurs(prev => prev.filter(id => id !== deleteTarget));
      addToast('success', 'Voyageur supprimé avec succès');
      setDeleteTarget(null);
    }
  };

  const handleSaveVoyageur = (data: any) => {
    StorageService.saveVoyageur(voyageId, data);
    loadVoyageurs();
    setShowFormModal(false);
    setEditingVoyageur(null);
    addToast('success', data.id ? 'Voyageur modifié avec succès' : 'Voyageur ajouté avec succès');
  };

  const handleEdit = (voyageur: Voyageur) => {
    setEditingVoyageur(voyageur);
    setShowFormModal(true);
  };

  const handleExportFormat = (format: 'csv' | 'pdf' | 'xlsx') => {
    const headers = ['Nom', 'Date', 'Statut paiement', 'Moyen utilisé', 'Téléphone', 'Acomptes reçus', 'Montants restants'];
    const statutLabels: Record<string, string> = {
      'acompte-paye': 'Acompte payé',
      'epargne-en-cours': 'Épargne en cours',
      'solde': 'Soldé',
      'financement-accorde': 'Financement accordé',
      'reservation-annulee': 'Réservation annulée',
    };
    const moyenLabels: Record<string, string> = {
      'epargne': 'Épargne',
      'financement': 'Financement',
      'une-fois': 'Une fois',
      'annule': 'Annulé',
    };
    const rows = voyageurs.map(v => [
      v.nom,
      v.date,
      statutLabels[v.statutPaiement] || v.statutPaiement,
      moyenLabels[v.moyenUtilise] || v.moyenUtilise,
      v.telephone,
      v.acomptesRecus,
      v.montantsRestants
    ]);
    handleExport(format, {
      headers,
      rows,
      filename: `voyageurs_voyage_${voyageId}`
    });
    addToast('success', `Export ${format.toUpperCase()} téléchargé`);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      if (sortDirection === 'asc') setSortDirection('desc');
      else if (sortDirection === 'desc') { setSortField(null); setSortDirection(null); }
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

  const toggleFilterStatut = (statut: string) => {
    setFilterStatut(prev => prev.includes(statut) ? prev.filter(s => s !== statut) : [...prev, statut]);
    setCurrentPage(1);
  };

  let filtered = voyageurs.filter(v => {
    const matchSearch = v.nom.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatut = filterStatut.length === 0 || filterStatut.includes(v.statutPaiement);
    return matchSearch && matchStatut;
  });

  // Date range filter
  if (dateRange.from || dateRange.to) {
    filtered = filtered.filter(v => {
      if (!v.date) return true;
      const vDate = new Date(v.date).toISOString().slice(0, 10);
      if (dateRange.from && vDate < dateRange.from) return false;
      if (dateRange.to && vDate > dateRange.to) return false;
      return true;
    });
  }

  // Apply sorting
  if (sortField && sortDirection) {
    filtered = [...filtered].sort((a, b) => {
      let valA: string | number = '';
      let valB: string | number = '';
      switch (sortField) {
        case 'nom': valA = a.nom.toLowerCase(); valB = b.nom.toLowerCase(); break;
        case 'date': valA = a.date || ''; valB = b.date || ''; break;
        case 'statutPaiement': valA = a.statutPaiement; valB = b.statutPaiement; break;
        case 'moyenUtilise': valA = a.moyenUtilise; valB = b.moyenUtilise; break;
        case 'telephone': valA = a.telephone; valB = b.telephone; break;
        case 'acomptesRecus':
          valA = parseFloat(a.acomptesRecus.replace(/[^0-9.,]/g, '').replace(',', '.')) || 0;
          valB = parseFloat(b.acomptesRecus.replace(/[^0-9.,]/g, '').replace(',', '.')) || 0;
          break;
        case 'montantsRestants':
          valA = parseFloat(a.montantsRestants.replace(/[^0-9.,]/g, '').replace(',', '.')) || 0;
          valB = parseFloat(b.montantsRestants.replace(/[^0-9.,]/g, '').replace(',', '.')) || 0;
          break;
      }
      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }

  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
  const displayedVoyageurs = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const toggleSelectAll = () => {
    if (selectedVoyageurs.length === displayedVoyageurs.length) {
      setSelectedVoyageurs([]);
    } else {
      setSelectedVoyageurs(displayedVoyageurs.map(v => v.id));
    }
  };

  const toggleSelectVoyageur = (id: string) => {
    setSelectedVoyageurs(prev =>
      prev.includes(id) ? prev.filter(vid => vid !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-4">
      <ToastContainer toasts={toasts} onClose={removeToast} />

      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Supprimer le voyageur"
        message="Êtes-vous sûr de vouloir supprimer ce voyageur ? Cette action est irréversible."
        confirmLabel="Supprimer"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      <VoyageurFormModal
        isOpen={showFormModal}
        voyageur={editingVoyageur}
        onSave={handleSaveVoyageur}
        onClose={() => { setShowFormModal(false); setEditingVoyageur(null); }}
      />

      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        onExport={handleExportFormat}
        title="Exporter les voyageurs"
      />

      {/* Filters and Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher un voyageur"
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
                <span className="bg-primary-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">{filterStatut.length}</span>
              )}
            </button>
            {showFilterDropdown && (
              <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg z-50 w-56 py-2">
                <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase">Statut paiement</div>
                {[
                  { value: 'acompte-paye', label: 'Acompte payé' },
                  { value: 'epargne-en-cours', label: 'Épargne en cours' },
                  { value: 'solde', label: 'Soldé' },
                  { value: 'financement-accorde', label: 'Financement accordé' },
                  { value: 'reservation-annulee', label: 'Réservation annulée' },
                ].map(item => (
                  <label key={item.value} className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 cursor-pointer">
                    <input type="checkbox" checked={filterStatut.includes(item.value)} onChange={() => toggleFilterStatut(item.value)} className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                    <span className="text-sm text-gray-700">{item.label}</span>
                  </label>
                ))}
                {filterStatut.length > 0 && (
                  <div className="border-t border-gray-100 mt-1 pt-1 px-3">
                    <button onClick={() => { setFilterStatut([]); setCurrentPage(1); }} className="text-xs text-red-500 hover:text-red-700 py-1">Réinitialiser</button>
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
                {dateRange.from && dateRange.to ? `${dateRange.from} - ${dateRange.to}` : dateRange.from ? `Depuis ${dateRange.from}` : dateRange.to ? `Jusqu'à ${dateRange.to}` : 'Période'}
              </span>
              {(dateRange.from || dateRange.to) && (
                <button onClick={(e) => { e.stopPropagation(); setDateRange({ from: '', to: '' }); setCurrentPage(1); }} className="ml-1 hover:bg-gray-200 rounded p-0.5">
                  <X className="w-3 h-3 text-gray-500" />
                </button>
              )}
            </button>
            {showDatePicker && (
              <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg z-50 w-64 p-4">
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Date de début</label>
                    <input type="date" value={dateRange.from} onChange={(e) => { setDateRange(prev => ({ ...prev, from: e.target.value })); setCurrentPage(1); }} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Date de fin</label>
                    <input type="date" value={dateRange.to} onChange={(e) => { setDateRange(prev => ({ ...prev, to: e.target.value })); setCurrentPage(1); }} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                  </div>
                  <button onClick={() => setShowDatePicker(false)} className="w-full py-2 bg-primary-500 text-white rounded-lg text-sm font-medium hover:bg-primary-600 transition-colors">Appliquer</button>
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
            onClick={() => { setEditingVoyageur(null); setShowFormModal(true); }}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors shadow-md"
          >
            <Plus className="w-5 h-5" />
            <span className="text-sm font-semibold">Ajouter un voyageur</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-card overflow-hidden border border-gray-100">
        <div className="overflow-x-auto">
          <table className="w-full whitespace-nowrap">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left">
                  <input
                    type="checkbox"
                    checked={selectedVoyageurs.length === displayedVoyageurs.length && displayedVoyageurs.length > 0}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                </th>
                {([
                  { field: 'nom' as SortField, label: 'Voyageur' },
                  { field: 'date' as SortField, label: 'Date' },
                  { field: 'statutPaiement' as SortField, label: 'Statut du paiement' },
                  { field: 'moyenUtilise' as SortField, label: 'Moyen utilisé' },
                  { field: 'telephone' as SortField, label: 'Téléphone' },
                  { field: 'acomptesRecus' as SortField, label: 'Acomptes reçus' },
                  { field: 'montantsRestants' as SortField, label: 'Montants restants' },
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
              {displayedVoyageurs.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-gray-400">
                    Aucun voyageur pour ce voyage
                  </td>
                </tr>
              ) : displayedVoyageurs.map((voyageur) => (
                <tr key={voyageur.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={selectedVoyageurs.includes(voyageur.id)}
                      onChange={() => toggleSelectVoyageur(voyageur.id)}
                      className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-semibold text-gray-900">{voyageur.nom}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-gray-700">{voyageur.date}</span>
                  </td>
                  <td className="px-6 py-4">
                    <StatutPaiementBadge statut={voyageur.statutPaiement} />
                  </td>
                  <td className="px-6 py-4">
                    <MoyenBadge moyen={voyageur.moyenUtilise} />
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-gray-700">{voyageur.telephone}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-gray-900 font-medium">{voyageur.acomptesRecus}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-gray-900 font-medium">{voyageur.montantsRestants}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(voyageur)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <Pencil className="w-4 h-4 text-gray-600" />
                      </button>
                      <button
                        onClick={() => handleDelete(voyageur.id)}
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

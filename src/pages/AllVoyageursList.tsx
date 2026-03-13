import React, { useState, useEffect } from 'react';
import { Search, ChevronLeft, ChevronRight, Upload, Eye, SlidersHorizontal } from 'lucide-react';
import { getAllVoyageurs } from '../api/trips';
import { ExportModal } from '../components/ExportModal';
import { ToastContainer, useToast } from '../components/Toast';
import { handleExport } from '../utils/export';

const STATUS_LABEL: Record<string, string> = {
  PENDING_DEPOSIT: 'En attente',
  DEPOSIT_PAID: 'Acompte payé',
  IN_PROGRESS: 'En cours',
  COMPLETED: 'Payé',
  CANCELLED: 'Annulé',
  REFUNDED: 'Remboursé',
};

const STATUS_STYLE: Record<string, string> = {
  PENDING_DEPOSIT: 'bg-amber-100 text-amber-700 border-amber-200',
  DEPOSIT_PAID: 'bg-blue-100 text-blue-700 border-blue-200',
  IN_PROGRESS: 'bg-purple-100 text-purple-700 border-purple-200',
  COMPLETED: 'bg-green-100 text-green-700 border-green-200',
  CANCELLED: 'bg-red-100 text-red-700 border-red-200',
  REFUNDED: 'bg-gray-100 text-gray-700 border-gray-200',
};

const fmtPrice = (v: number) => v.toLocaleString('fr-FR').replace(/\s/g, '.') + ' FCFA';

const PAYMENT_STATUS_OPTIONS = [
  { value: '', label: 'Tous les statuts' },
  { value: 'pending_deposit', label: 'En attente' },
  { value: 'partial', label: 'Partiel' },
  { value: 'fully_paid', label: 'Payé' },
  { value: 'overdue', label: 'En retard' },
];

export const AllVoyageursList: React.FC = () => {
  const [travelers, setTravelers] = useState<any[]>([]);
  const [pagination, setPagination] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showExportModal, setShowExportModal] = useState(false);
  const [selectedTraveler, setSelectedTraveler] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const { toasts, addToast, removeToast } = useToast();
  const itemsPerPage = 12;

  const loadVoyageurs = async () => {
    setLoading(true);
    try {
      const { travelers: list, pagination: pag } = await getAllVoyageurs({
        search: searchQuery || undefined,
        status: statusFilter || undefined,
        paymentStatus: paymentFilter || undefined,
        page: currentPage,
        limit: itemsPerPage,
      });
      setTravelers(list);
      setPagination(pag);
    } catch (e) {
      addToast('error', (e as { message?: string })?.message || 'Erreur chargement des voyageurs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVoyageurs();
  }, [currentPage, statusFilter, paymentFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    loadVoyageurs();
  };

  const totalPages = pagination?.pages ?? 1;

  const handleExportFormat = (format: 'csv' | 'pdf' | 'xlsx') => {
    const headers = ['Voyageur', 'Téléphone', 'Email', 'Voyage', 'Statut', 'Payé', 'Restant'];
    const rows = travelers.map(t => [
      t.nom,
      t.telephone,
      t.email,
      t.tripDestination || t.tripTitle,
      STATUS_LABEL[t.status] || t.status,
      fmtPrice(t.amountPaid),
      fmtPrice(t.remainingAmount),
    ]);
    handleExport(format, { headers, rows, filename: 'voyageurs_export' });
    addToast('success', `Export ${format.toUpperCase()} téléchargé`);
  };

  return (
    <div className="p-3 sm:p-6">
      <ToastContainer toasts={toasts} onClose={removeToast} />

      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        onExport={handleExportFormat}
        title="Exporter les voyageurs"
      />

      {/* Detail modal */}
      {selectedTraveler && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-[95vw] sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">Détails du voyageur</h2>
              <button onClick={() => setSelectedTraveler(null)} className="p-2 hover:bg-gray-100 rounded-lg">
                <span className="sr-only">Fermer</span>
                &times;
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Voyageur</p>
                <p className="font-semibold text-gray-900 text-lg">{selectedTraveler.nom}</p>
                {selectedTraveler.telephone && <p className="text-sm text-gray-600">{selectedTraveler.telephone}</p>}
                {selectedTraveler.email && <p className="text-sm text-gray-600">{selectedTraveler.email}</p>}
                {selectedTraveler.bookingNumber && <p className="text-xs text-gray-400 mt-1">N° {selectedTraveler.bookingNumber}</p>}
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Voyage</p>
                <p className="font-semibold text-gray-900">{selectedTraveler.tripDestination || selectedTraveler.tripTitle}</p>
                {selectedTraveler.tripDepartureDate && <p className="text-sm text-gray-600">Départ : {new Date(selectedTraveler.tripDepartureDate).toLocaleDateString('fr-FR')}</p>}
                <p className="text-sm text-gray-600">{selectedTraveler.numberOfParticipants} participant{selectedTraveler.numberOfParticipants > 1 ? 's' : ''}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Paiements</p>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div><p className="text-xs text-gray-500">Total</p><p className="font-bold text-gray-900">{fmtPrice(selectedTraveler.totalAmount)}</p></div>
                  <div><p className="text-xs text-gray-500">Acompte</p><p className="font-bold text-blue-600">{fmtPrice(selectedTraveler.depositAmount)}</p></div>
                  <div><p className="text-xs text-gray-500">Payé</p><p className="font-bold text-green-600">{fmtPrice(selectedTraveler.amountPaid)}</p></div>
                  <div><p className="text-xs text-gray-500">Restant</p><p className="font-bold text-orange-600">{fmtPrice(selectedTraveler.remainingAmount)}</p></div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-primary-500 h-2 rounded-full"
                    style={{ width: `${selectedTraveler.totalAmount > 0 ? Math.round((selectedTraveler.amountPaid / selectedTraveler.totalAmount) * 100) : 0}%` }}
                  />
                </div>
                {selectedTraveler.isOverdue && (
                  <p className="text-xs text-red-500 font-medium mt-2">Paiement en retard</p>
                )}
                {selectedTraveler.paymentDeadline && (
                  <p className="text-xs text-gray-400 mt-1">Échéance : {new Date(selectedTraveler.paymentDeadline).toLocaleDateString('fr-FR')}</p>
                )}
              </div>
              {selectedTraveler.payments?.length > 0 && (
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Historique des paiements</p>
                  <div className="space-y-2">
                    {selectedTraveler.payments.map((p: any, i: number) => (
                      <div key={i} className="flex items-center justify-between text-sm">
                        <div>
                          <span className="text-gray-700">{fmtPrice(p.amount)}</span>
                          <span className="text-xs text-gray-400 ml-2">{p.paymentMethod?.toUpperCase()}</span>
                        </div>
                        <span className="text-xs text-gray-400">{p.createdAt ? new Date(p.createdAt).toLocaleDateString('fr-FR') : ''}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500">{selectedTraveler.isFullyPaid ? 'Entièrement payé' : 'En cours'}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium border ${STATUS_STYLE[selectedTraveler.status] || ''}`}>
                  {STATUS_LABEL[selectedTraveler.status] || selectedTraveler.status}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <h1 className="text-lg sm:text-2xl font-bold text-gray-900">Tous les voyageurs</h1>
        <button
          onClick={() => setShowExportModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors w-fit"
        >
          <Upload className="w-5 h-5 text-gray-600" />
          <span className="text-sm font-medium text-gray-700">Exporter</span>
        </button>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-4">
        <form onSubmit={handleSearch} className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher par nom, email, téléphone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-colors"
          />
        </form>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
          className="px-3 py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="">Tous les statuts</option>
          <option value="PENDING_DEPOSIT">En attente</option>
          <option value="DEPOSIT_PAID">Acompte payé</option>
          <option value="IN_PROGRESS">En cours</option>
          <option value="COMPLETED">Payé</option>
          <option value="CANCELLED">Annulé</option>
        </select>
        <select
          value={paymentFilter}
          onChange={(e) => { setPaymentFilter(e.target.value); setCurrentPage(1); }}
          className="px-3 py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          {PAYMENT_STATUS_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-card overflow-hidden border border-gray-100">
        <div className="overflow-x-auto">
          <table className="w-full whitespace-nowrap">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-2 py-1.5 sm:px-4 sm:py-3 text-left text-xs sm:text-sm font-semibold text-gray-600">Voyageur</th>
                <th className="px-2 py-1.5 sm:px-4 sm:py-3 text-left text-xs sm:text-sm font-semibold text-gray-600 hidden sm:table-cell">Voyage</th>
                <th className="px-2 py-1.5 sm:px-4 sm:py-3 text-left text-xs sm:text-sm font-semibold text-gray-600 hidden sm:table-cell">Téléphone</th>
                <th className="px-2 py-1.5 sm:px-4 sm:py-3 text-left text-xs sm:text-sm font-semibold text-gray-600">Statut</th>
                <th className="px-2 py-1.5 sm:px-4 sm:py-3 text-left text-xs sm:text-sm font-semibold text-gray-600">Payé</th>
                <th className="px-2 py-1.5 sm:px-4 sm:py-3 text-left text-xs sm:text-sm font-semibold text-gray-600 hidden sm:table-cell">Restant</th>
                <th className="px-2 py-1.5 sm:px-4 sm:py-3 text-left text-xs sm:text-sm font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto" />
                  </td>
                </tr>
              ) : travelers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-400">
                    Aucun voyageur trouvé
                  </td>
                </tr>
              ) : travelers.map(t => (
                <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-2 py-1.5 sm:px-4 sm:py-3">
                    <p className="font-semibold text-gray-900 text-xs sm:text-sm">{t.nom}</p>
                    {t.email && <p className="text-xs text-gray-400 hidden sm:block">{t.email}</p>}
                  </td>
                  <td className="px-2 py-1.5 sm:px-4 sm:py-3 hidden sm:table-cell">
                    <span className="px-2 py-1 bg-primary-50 text-primary-700 rounded text-xs font-medium">
                      {t.tripDestination || t.tripTitle}
                    </span>
                    {t.tripDepartureDate && <p className="text-xs text-gray-400 mt-0.5">{new Date(t.tripDepartureDate).toLocaleDateString('fr-FR')}</p>}
                  </td>
                  <td className="px-2 py-1.5 sm:px-4 sm:py-3 text-xs sm:text-sm text-gray-700 hidden sm:table-cell">{t.telephone || '—'}</td>
                  <td className="px-2 py-1.5 sm:px-4 sm:py-3">
                    <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-medium border ${STATUS_STYLE[t.status] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                      {STATUS_LABEL[t.status] || t.status}
                    </span>
                    {t.isOverdue && <span className="ml-1 px-2 py-0.5 bg-red-100 text-red-600 rounded text-xs">Retard</span>}
                  </td>
                  <td className="px-2 py-1.5 sm:px-4 sm:py-3 font-medium text-green-600 text-xs sm:text-sm">{fmtPrice(t.amountPaid)}</td>
                  <td className="px-2 py-1.5 sm:px-4 sm:py-3 font-medium text-orange-600 text-xs sm:text-sm hidden sm:table-cell">{fmtPrice(t.remainingAmount)}</td>
                  <td className="px-2 py-1.5 sm:px-4 sm:py-3">
                    <button
                      onClick={() => setSelectedTraveler(t)}
                      className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Voir détails"
                    >
                      <Eye className="w-4 h-4 text-gray-500" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              {pagination?.total ?? travelers.length} voyageur{(pagination?.total ?? travelers.length) > 1 ? 's' : ''}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-50"
              >
                <ChevronLeft className="w-5 h-5 text-gray-600" />
              </button>
              <span className="text-sm text-gray-600">Page {currentPage} / {totalPages}</span>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-50"
              >
                <ChevronRight className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

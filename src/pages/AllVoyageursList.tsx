import React, { useState, useEffect } from 'react';
import { Search, ChevronLeft, ChevronRight, Upload, Eye } from 'lucide-react';
import { getDashboardBookings } from '../api/trips';
import type { DashboardBooking } from '../api/trips';
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

export const AllVoyageursList: React.FC = () => {
  const [bookings, setBookings] = useState<DashboardBooking[]>([]);
  const [pagination, setPagination] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showExportModal, setShowExportModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<DashboardBooking | null>(null);
  const [loading, setLoading] = useState(true);
  const { toasts, addToast, removeToast } = useToast();
  const itemsPerPage = 12;

  const loadVoyageurs = async () => {
    setLoading(true);
    try {
      const { bookings: list, pagination: pag } = await getDashboardBookings({
        search: searchQuery || undefined,
        page: currentPage,
        limit: itemsPerPage,
      });
      setBookings(list);
      setPagination(pag);
    } catch (e) {
      addToast('error', (e as { message?: string })?.message || 'Erreur chargement des voyageurs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVoyageurs();
  }, [currentPage]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    loadVoyageurs();
  };

  const totalPages = pagination?.pages ?? Math.max(1, Math.ceil((pagination?.total ?? bookings.length) / itemsPerPage));

  const handleExportFormat = (format: 'csv' | 'pdf' | 'xlsx') => {
    const headers = ['Voyageur', 'Téléphone', 'Email', 'Voyage', 'Statut', 'Acomptes reçus', 'Montants restants'];
    const rows = bookings.map(b => [
      b.client.nom,
      b.client.telephone,
      b.client.email,
      b.voyage.destination || b.voyage.titre,
      STATUS_LABEL[b.status] || b.status,
      fmtPrice(b.amountPaid),
      fmtPrice(b.remainingAmount),
    ]);
    handleExport(format, { headers, rows, filename: 'voyageurs_export' });
    addToast('success', `Export ${format.toUpperCase()} téléchargé`);
  };

  return (
    <div className="p-4 md:p-8">
      <ToastContainer toasts={toasts} onClose={removeToast} />

      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        onExport={handleExportFormat}
        title="Exporter les voyageurs"
      />

      {/* Detail modal */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">Détails du voyageur</h2>
              <button onClick={() => setSelectedBooking(null)} className="p-2 hover:bg-gray-100 rounded-lg">
                <span className="sr-only">Fermer</span>
                &times;
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Voyageur</p>
                <p className="font-semibold text-gray-900 text-lg">{selectedBooking.client.nom}</p>
                {selectedBooking.client.telephone && <p className="text-sm text-gray-600">{selectedBooking.client.telephone}</p>}
                {selectedBooking.client.email && <p className="text-sm text-gray-600">{selectedBooking.client.email}</p>}
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Voyage</p>
                <p className="font-semibold text-gray-900">{selectedBooking.voyage.destination || selectedBooking.voyage.titre}</p>
                {selectedBooking.voyage.departureDate && <p className="text-sm text-gray-600">Départ : {selectedBooking.voyage.departureDate}</p>}
                <p className="text-sm text-gray-600">{selectedBooking.nombrePersonnes} participant{selectedBooking.nombrePersonnes > 1 ? 's' : ''}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Paiements</p>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div><p className="text-xs text-gray-500">Total</p><p className="font-bold text-gray-900">{fmtPrice(selectedBooking.totalAmount)}</p></div>
                  <div><p className="text-xs text-gray-500">Acompte</p><p className="font-bold text-blue-600">{fmtPrice(selectedBooking.depositAmount)}</p></div>
                  <div><p className="text-xs text-gray-500">Payé</p><p className="font-bold text-green-600">{fmtPrice(selectedBooking.amountPaid)}</p></div>
                  <div><p className="text-xs text-gray-500">Restant</p><p className="font-bold text-orange-600">{fmtPrice(selectedBooking.remainingAmount)}</p></div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-primary-500 h-2 rounded-full"
                    style={{ width: `${selectedBooking.totalAmount > 0 ? Math.round((selectedBooking.amountPaid / selectedBooking.totalAmount) * 100) : 0}%` }}
                  />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500">Réservé le</p>
                  <p className="text-sm font-medium text-gray-700">{selectedBooking.createdAt}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium border ${STATUS_STYLE[selectedBooking.status] || ''}`}>
                  {STATUS_LABEL[selectedBooking.status] || selectedBooking.status}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Tous les voyageurs</h1>
        <button
          onClick={() => setShowExportModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors w-fit"
        >
          <Upload className="w-5 h-5 text-gray-600" />
          <span className="text-sm font-medium text-gray-700">Exporter</span>
        </button>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="mb-4">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher par nom ou voyage..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-colors"
          />
        </div>
      </form>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-card overflow-hidden border border-gray-100">
        <div className="overflow-x-auto">
          <table className="w-full whitespace-nowrap">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Voyageur</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Voyage</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Téléphone</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Statut</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Payé</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Restant</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto" />
                  </td>
                </tr>
              ) : bookings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-400">
                    Aucun voyageur trouvé
                  </td>
                </tr>
              ) : bookings.map(b => (
                <tr key={b.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-semibold text-gray-900 text-sm">{b.client.nom}</p>
                    {b.client.email && <p className="text-xs text-gray-400">{b.client.email}</p>}
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-primary-50 text-primary-700 rounded text-xs font-medium">
                      {b.voyage.destination || b.voyage.titre}
                    </span>
                    {b.voyage.departureDate && <p className="text-xs text-gray-400 mt-0.5">{b.voyage.departureDate}</p>}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">{b.client.telephone || '—'}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${STATUS_STYLE[b.status] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                      {STATUS_LABEL[b.status] || b.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-medium text-green-600 text-sm">{fmtPrice(b.amountPaid)}</td>
                  <td className="px-6 py-4 font-medium text-orange-600 text-sm">{fmtPrice(b.remainingAmount)}</td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => setSelectedBooking(b)}
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
              {pagination?.total ?? bookings.length} voyageur{(pagination?.total ?? bookings.length) > 1 ? 's' : ''}
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

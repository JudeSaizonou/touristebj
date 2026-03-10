import React, { useState, useEffect } from 'react';
import { Search, ChevronLeft, ChevronRight, Upload, X, Eye } from 'lucide-react';
import { getDashboardBookings, cancelBooking } from '../api/trips';
import type { DashboardBooking } from '../api/trips';
import { ConfirmModal } from '../components/ConfirmModal';
import { ExportModal } from '../components/ExportModal';
import { ToastContainer, useToast } from '../components/Toast';
import { handleExport } from '../utils/export';

const STATUS_LABEL: Record<string, string> = {
  PENDING_DEPOSIT: 'En attente',
  DEPOSIT_PAID: 'Acompte payé',
  IN_PROGRESS: 'En cours',
  COMPLETED: 'Complété',
  CANCELLED: 'Annulée',
  REFUNDED: 'Remboursée',
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

export const ReservationsList: React.FC = () => {
  const [bookings, setBookings] = useState<DashboardBooking[]>([]);
  const [pagination, setPagination] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [cancelTarget, setCancelTarget] = useState<string | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<DashboardBooking | null>(null);
  const [loading, setLoading] = useState(true);
  const { toasts, addToast, removeToast } = useToast();
  const itemsPerPage = 10;

  const toNumber = (value: unknown): number => {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string') {
      const cleaned = value.replace(/[^0-9.,-]/g, '').replace(/\./g, '').replace(',', '.');
      const parsed = parseFloat(cleaned);
      return Number.isFinite(parsed) ? parsed : 0;
    }
    return 0;
  };

  const normalizeReservation = (reservation: any) => ({
    ...reservation,
    voyageDestination: reservation?.voyageDestination || reservation?.destination || 'Voyage non renseigné',
    type: reservation?.type || 'reservation',
    nombrePersonnes: toNumber(reservation?.nombrePersonnes ?? reservation?.participants ?? 0),
    montantTotal: toNumber(reservation?.montantTotal ?? reservation?.totalAmount ?? reservation?.montant),
    acompte: toNumber(reservation?.acompte ?? reservation?.depositAmount ?? reservation?.avance),
    date: reservation?.date || '-',
    statut: reservation?.statut || reservation?.status || 'en-attente',
  });

  const loadReservations = async () => {
    try {
      const { data } = await getReservations();
      setReservations((data || []).map(normalizeReservation));
    } catch (e) {
      addToast('error', (e as { message?: string })?.message || 'Erreur chargement des réservations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
  }, [currentPage, statusFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    loadBookings();
  };

  const confirmCancel = async () => {
    if (!cancelTarget) return;
    try {
      await cancelBooking(cancelTarget);
      addToast('success', 'Réservation annulée');
      loadBookings();
    } catch (e) {
      addToast('error', (e as { message?: string })?.message || "Impossible d'annuler");
    }
    setCancelTarget(null);
  };

  const totalPages = pagination?.pages ?? Math.max(1, Math.ceil((pagination?.total ?? bookings.length) / itemsPerPage));

  const handleExportFormat = (format: 'csv' | 'pdf' | 'xlsx') => {
    const headers = ['Client', 'Voyage', 'Personnes', 'Total', 'Acompte', 'Payé', 'Solde', 'Date', 'Statut'];
    const rows = bookings.map(b => [
      b.client.nom,
      b.voyage.destination || b.voyage.titre,
      b.nombrePersonnes,
      fmtPrice(b.totalAmount),
      fmtPrice(b.depositAmount),
      fmtPrice(b.amountPaid),
      fmtPrice(b.remainingAmount),
      b.createdAt,
      STATUS_LABEL[b.status] || b.status,
    ]);
    handleExport(format, { headers, rows, filename: 'reservations_export' });
    addToast('success', `Export ${format.toUpperCase()} téléchargé`);
  };

  return (
    <div className="p-4 md:p-8">
      <ToastContainer toasts={toasts} onClose={removeToast} />

      <ConfirmModal
        isOpen={!!cancelTarget}
        title="Annuler la réservation"
        message="Êtes-vous sûr de vouloir annuler cette réservation ? Cette action est irréversible."
        confirmLabel="Annuler la réservation"
        onConfirm={confirmCancel}
        onCancel={() => setCancelTarget(null)}
      />

      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        onExport={handleExportFormat}
        title="Exporter les réservations"
      />

      {selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Détails réservation</h2>
                <p className="text-sm text-gray-500">{selectedBooking.bookingNumber}</p>
              </div>
              <button onClick={() => setSelectedBooking(null)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Client</p>
                <p className="font-semibold text-gray-900">{selectedBooking.client.nom}</p>
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
                  <div className="bg-primary-500 h-2 rounded-full transition-all" style={{ width: `${selectedBooking.totalAmount > 0 ? Math.round((selectedBooking.amountPaid / selectedBooking.totalAmount) * 100) : 0}%` }} />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500">Date de réservation</p>
                  <p className="text-sm font-medium text-gray-700">{selectedBooking.createdAt}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium border ${STATUS_STYLE[selectedBooking.status] || STATUS_STYLE['PENDING_DEPOSIT']}`}>
                  {STATUS_LABEL[selectedBooking.status] || selectedBooking.status}
                </span>
              </div>
              {selectedBooking.isPaymentOverdue && (
                <div className="bg-red-50 text-red-700 rounded-xl p-3 text-sm">
                  Paiement en retard — échéance : {selectedBooking.paymentDeadline}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Réservations</h1>
        <button
          onClick={() => setShowExportModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors w-fit"
        >
          <Upload className="w-5 h-5 text-gray-600" />
          <span className="text-sm font-medium text-gray-700">Exporter</span>
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <form onSubmit={handleSearch} className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher client, voyage..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-colors"
          />
        </form>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
          className="text-sm bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="">Tous les statuts</option>
          <option value="PENDING_DEPOSIT">En attente</option>
          <option value="DEPOSIT_PAID">Acompte payé</option>
          <option value="IN_PROGRESS">En cours</option>
          <option value="COMPLETED">Complétés</option>
          <option value="CANCELLED">Annulés</option>
        </select>
      </div>

      <div className="bg-white rounded-xl shadow-card overflow-hidden border border-gray-100">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Client</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Voyage</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Pers.</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Total</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Payé</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Solde</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Statut</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Date</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center">
                    <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto" />
                  </td>
                </tr>
              ) : bookings.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-gray-400">Aucune réservation</td>
                </tr>
              ) : bookings.map(b => (
                <tr key={b.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-medium text-gray-900 text-sm">{b.client.nom}</p>
                    {b.client.telephone && <p className="text-xs text-gray-400">{b.client.telephone}</p>}
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-medium text-gray-900 text-sm">{b.voyage.destination || b.voyage.titre}</p>
                    {b.voyage.departureDate && <p className="text-xs text-gray-400">{b.voyage.departureDate}</p>}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">{b.nombrePersonnes}</td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{fmtPrice(b.totalAmount)}</td>
                  <td className="px-6 py-4 text-sm font-medium text-green-600">{fmtPrice(b.amountPaid)}</td>
                  <td className="px-6 py-4 text-sm font-medium text-orange-600">{fmtPrice(b.remainingAmount)}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${STATUS_STYLE[b.status] || STATUS_STYLE['PENDING_DEPOSIT']}`}>
                      {STATUS_LABEL[b.status] || b.status}
                    </span>
                    {b.isPaymentOverdue && (
                      <span className="ml-1 inline-block w-2 h-2 rounded-full bg-red-500" title="En retard" />
                    )}
                  </td>
                  <td className="px-6 py-4 text-xs text-gray-400">{b.createdAt}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setSelectedBooking(b)}
                        className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Voir détails"
                      >
                        <Eye className="w-4 h-4 text-gray-500" />
                      </button>
                      {b.status !== 'CANCELLED' && b.status !== 'COMPLETED' && b.status !== 'REFUNDED' && (
                        <button
                          onClick={() => setCancelTarget(b.id)}
                          className="p-1.5 hover:bg-red-50 rounded-lg transition-colors text-xs text-red-600 font-medium"
                          title="Annuler"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              {pagination?.total ?? bookings.length} réservation{(pagination?.total ?? bookings.length) > 1 ? 's' : ''}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-50"
              >
                <ChevronLeft className="w-5 h-5 text-gray-600" />
              </button>
              <span className="text-sm text-gray-600">Page {currentPage} / {totalPages}</span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
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

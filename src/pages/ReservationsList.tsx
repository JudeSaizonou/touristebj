import React, { useState, useEffect } from 'react';
import { Search, Trash2, ChevronLeft, ChevronRight, Upload } from 'lucide-react';
import { StorageService } from '../utils/storage';
import { ConfirmModal } from '../components/ConfirmModal';
import { ExportModal } from '../components/ExportModal';
import { ToastContainer, useToast } from '../components/Toast';
import { handleExport } from '../utils/export';

export const ReservationsList: React.FC = () => {
  const [reservations, setReservations] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const { toasts, addToast, removeToast } = useToast();
  const itemsPerPage = 10;

  useEffect(() => {
    loadReservations();
  }, []);

  const loadReservations = () => {
    const data = StorageService.getReservations();
    setReservations(data);
  };

  const confirmDelete = () => {
    if (deleteTarget) {
      StorageService.deleteReservation(deleteTarget);
      loadReservations();
      addToast('success', 'Réservation supprimée');
      setDeleteTarget(null);
    }
  };

  const filtered = reservations.filter(r =>
    (r.voyageDestination || '').toLowerCase().includes(searchQuery.toLowerCase())
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
  const displayed = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const fmtPrice = (v: number) => v.toLocaleString('fr-FR').replace(/\s/g, '.') + ' FCFA';

  const typeBadge = (type: string) => {
    if (type === 'reservation') return <span className="px-3 py-1 rounded-full text-xs font-medium border bg-green-100 text-green-600 border-green-200">Réservation</span>;
    return <span className="px-3 py-1 rounded-full text-xs font-medium border bg-blue-100 text-blue-600 border-blue-200">Épargne</span>;
  };

  const statutBadge = (statut: string) => {
    const styles: Record<string, string> = {
      'confirmee': 'bg-green-100 text-green-600 border-green-200',
      'en-attente': 'bg-amber-100 text-amber-600 border-amber-200',
      'annulee': 'bg-red-100 text-red-600 border-red-200',
    };
    const labels: Record<string, string> = {
      'confirmee': 'Confirmée',
      'en-attente': 'En attente',
      'annulee': 'Annulée',
    };
    return <span className={`px-3 py-1 rounded-full text-xs font-medium border ${styles[statut] || styles['en-attente']}`}>{labels[statut] || statut}</span>;
  };

  const handleExportFormat = (format: 'csv' | 'pdf' | 'xlsx') => {
    const statutLabels: Record<string, string> = {
      'confirmee': 'Confirmée',
      'en-attente': 'En attente',
      'annulee': 'Annulée',
    };
    const headers = ['Voyage', 'Type', 'Personnes', 'Montant total', 'Acompte', 'Date', 'Statut'];
    const rows = filtered.map(r => [
      r.voyageDestination,
      r.type === 'reservation' ? 'Réservation' : 'Épargne',
      r.nombrePersonnes,
      r.montantTotal,
      r.acompte,
      r.date,
      statutLabels[r.statut] || r.statut
    ]);
    handleExport(format, {
      headers,
      rows,
      filename: 'reservations_export'
    });
    addToast('success', `Export ${format.toUpperCase()} téléchargé`);
  };

  return (
    <div className="p-4 md:p-8">
      <ToastContainer toasts={toasts} onClose={removeToast} />
      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Supprimer la réservation"
        message="Êtes-vous sûr de vouloir supprimer cette réservation ?"
        confirmLabel="Supprimer"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        onExport={handleExportFormat}
        title="Exporter les réservations"
      />

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

      {/* Search */}
      <div className="mb-4">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher par voyage..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-colors"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-card overflow-hidden border border-gray-100">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Voyage</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Type</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Personnes</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Montant total</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Acompte</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Date</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Statut</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {displayed.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-400">
                    Aucune réservation
                  </td>
                </tr>
              ) : displayed.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-semibold text-gray-900">{r.voyageDestination}</td>
                  <td className="px-6 py-4">{typeBadge(r.type)}</td>
                  <td className="px-6 py-4 text-gray-700">{r.nombrePersonnes}</td>
                  <td className="px-6 py-4 font-medium text-gray-900">{fmtPrice(r.montantTotal)}</td>
                  <td className="px-6 py-4 font-medium text-gray-900">{fmtPrice(r.acompte)}</td>
                  <td className="px-6 py-4 text-gray-700">{r.date}</td>
                  <td className="px-6 py-4">{statutBadge(r.statut)}</td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => setDeleteTarget(r.id)}
                      className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end">
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

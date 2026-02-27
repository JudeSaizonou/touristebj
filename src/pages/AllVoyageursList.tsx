import React, { useState, useEffect } from 'react';
import { Search, ChevronLeft, ChevronRight, Upload } from 'lucide-react';
import { StorageService } from '../utils/storage';
import { ExportModal } from '../components/ExportModal';
import { ToastContainer, useToast } from '../components/Toast';
import { handleExport } from '../utils/export';

interface VoyageurRow {
  voyageur: any;
  voyageId: string;
  voyageDestination: string;
}

export const AllVoyageursList: React.FC = () => {
  const [allData, setAllData] = useState<VoyageurRow[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showExportModal, setShowExportModal] = useState(false);
  const { toasts, addToast, removeToast } = useToast();
  const itemsPerPage = 12;

  useEffect(() => {
    const data = StorageService.getAllVoyageurs();
    setAllData(data);
  }, []);

  const filtered = allData.filter(d =>
    d.voyageur.nom.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.voyageDestination.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
  const displayed = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const statutLabels: Record<string, string> = {
    'acompte-paye': 'Acompte payé',
    'epargne-en-cours': 'Épargne en cours',
    'solde': 'Soldé',
    'financement-accorde': 'Financement accordé',
    'reservation-annulee': 'Réservation annulée',
  };

  const statutStyles: Record<string, string> = {
    'acompte-paye': 'bg-green-100 text-green-600 border-green-200',
    'epargne-en-cours': 'bg-blue-100 text-blue-600 border-blue-200',
    'solde': 'bg-teal-100 text-teal-600 border-teal-200',
    'financement-accorde': 'bg-cyan-100 text-cyan-600 border-cyan-200',
    'reservation-annulee': 'bg-red-100 text-red-600 border-red-200',
  };

  const handleExportFormat = (format: 'csv' | 'pdf' | 'xlsx') => {
    const headers = ['Voyageur', 'Voyage', 'Date', 'Statut', 'Téléphone', 'Acomptes reçus', 'Montants restants'];
    const rows = filtered.map(d => [
      d.voyageur.nom,
      d.voyageDestination,
      d.voyageur.date,
      statutLabels[d.voyageur.statutPaiement] || d.voyageur.statutPaiement,
      d.voyageur.telephone,
      d.voyageur.acomptesRecus,
      d.voyageur.montantsRestants
    ]);
    handleExport(format, {
      headers,
      rows,
      filename: 'voyageurs_export'
    });
    addToast('success', `Export ${format.toUpperCase()} téléchargé`);
  };

  return (
    <div className="p-4 md:p-8">
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

      <ToastContainer toasts={toasts} onClose={removeToast} />

      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        onExport={handleExportFormat}
        title="Exporter les voyageurs"
      />

      {/* Search */}
      <div className="mb-4">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher par nom ou voyage..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-colors"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-card overflow-hidden border border-gray-100">
        <div className="overflow-x-auto">
          <table className="w-full whitespace-nowrap">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Voyageur</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Voyage</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Date</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Statut</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Téléphone</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Acomptes reçus</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Montants restants</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {displayed.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-400">
                    Aucun voyageur trouvé
                  </td>
                </tr>
              ) : displayed.map((d, i) => (
                <tr key={`${d.voyageId}-${d.voyageur.id}-${i}`} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-semibold text-gray-900">{d.voyageur.nom}</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-primary-50 text-primary-700 rounded text-xs font-medium">{d.voyageDestination}</span>
                  </td>
                  <td className="px-6 py-4 text-gray-700">{d.voyageur.date}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${statutStyles[d.voyageur.statutPaiement] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                      {statutLabels[d.voyageur.statutPaiement] || d.voyageur.statutPaiement}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-700">{d.voyageur.telephone}</td>
                  <td className="px-6 py-4 font-medium text-gray-900">{d.voyageur.acomptesRecus}</td>
                  <td className="px-6 py-4 font-medium text-gray-900">{d.voyageur.montantsRestants}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

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

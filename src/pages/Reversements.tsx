import React, { useState, useEffect } from 'react';
import { ArrowRightLeft, Download, ChevronLeft, ChevronRight, Search, Loader2, Upload, X, Clock, CheckCircle, AlertCircle, CreditCard } from 'lucide-react';
import { getPayoutBalance, getPayoutHistory } from '../api/trips';
import type { PayoutBalance, PayoutRequest } from '../api/trips';
import { ExportModal } from '../components/ExportModal';
import { handleExport } from '../utils/export';
import { ToastContainer, useToast } from '../components/Toast';

const fmtPrice = (v: number) => v.toLocaleString('fr-FR').replace(/\s/g, '.') + ' FCFA';
const fmtDate = (d?: string) => d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

const STATUS_LABEL: Record<string, string> = {
  pending: 'En attente',
  approved: 'Approuvé',
  processed: 'Traité',
  rejected: 'Rejeté',
};

const STATUS_STYLE: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700 border-amber-200',
  approved: 'bg-blue-100 text-blue-700 border-blue-200',
  processed: 'bg-green-100 text-green-700 border-green-200',
  rejected: 'bg-red-100 text-red-700 border-red-200',
};

const STATUS_ICON: Record<string, React.ReactNode> = {
  pending: <Clock className="w-5 h-5 text-amber-500" />,
  approved: <CheckCircle className="w-5 h-5 text-blue-500" />,
  processed: <CheckCircle className="w-5 h-5 text-green-500" />,
  rejected: <AlertCircle className="w-5 h-5 text-red-500" />,
};

const METHOD_LABEL: Record<string, string> = {
  mtn: 'MTN MoMo',
  moov: 'Moov Money',
};

interface ReversementsProps {
  onRequestRefund: () => void;
}

export const Reversements: React.FC<ReversementsProps> = ({ onRequestRefund }) => {
  const [balance, setBalance] = useState<PayoutBalance | null>(null);
  const [payouts, setPayouts] = useState<PayoutRequest[]>([]);
  const [pagination, setPagination] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [balanceLoading, setBalanceLoading] = useState(true);
  const [showExportModal, setShowExportModal] = useState(false);
  const [selectedPayout, setSelectedPayout] = useState<PayoutRequest | null>(null);
  const { toasts, addToast, removeToast } = useToast();
  const itemsPerPage = 10;

  const loadBalance = async () => {
    try {
      setBalanceLoading(true);
      const data = await getPayoutBalance();
      setBalance(data);
    } catch (e) {
      addToast('error', (e as { message?: string })?.message || 'Erreur chargement du solde');
    } finally {
      setBalanceLoading(false);
    }
  };

  const loadPayouts = async () => {
    try {
      setLoading(true);
      const { payouts: data, pagination: pag } = await getPayoutHistory({
        status: statusFilter || undefined,
        page: currentPage,
        limit: itemsPerPage,
      });
      setPayouts(data);
      setPagination(pag);
    } catch (e) {
      addToast('error', (e as { message?: string })?.message || 'Erreur chargement des reversements');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadBalance(); }, []);
  useEffect(() => { loadPayouts(); }, [currentPage, statusFilter]);

  const totalPages = pagination?.pages ?? Math.max(1, Math.ceil((pagination?.total ?? payouts.length) / itemsPerPage));

  const handleExportFormat = (format: 'csv' | 'pdf' | 'xlsx') => {
    const headers = ['Date', 'Montant', 'Méthode', 'Statut'];
    const rows = payouts.map((p) => [
      new Date(p.createdAt).toLocaleDateString('fr-FR'),
      fmtPrice(p.amount),
      METHOD_LABEL[p.paymentMethod] || p.paymentMethod,
      STATUS_LABEL[p.status] || p.status,
    ]);
    handleExport(format, { headers, rows, filename: 'reversements' });
    setShowExportModal(false);
    addToast('success', 'Export téléchargé');
  };

  return (
    <div className="space-y-4 sm:space-y-6 p-3 sm:p-0">
      <ToastContainer toasts={toasts} onClose={removeToast} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-forest-100 rounded-lg">
            <ArrowRightLeft className="w-6 h-6 text-forest-700" />
          </div>
          <div>
            <h1 className="text-lg sm:text-2xl font-bold text-gray-900">Reversements</h1>
            <p className="text-sm text-gray-500">Historique des demandes de reversement</p>
          </div>
        </div>
        <button
          onClick={() => setShowExportModal(true)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <Upload className="w-4 h-4" />
          Exporter
        </button>
      </div>

      {/* Balance Card */}
      <div className="bg-gradient-to-br from-forest-800 to-forest-900 rounded-2xl p-4 sm:p-6 text-white shadow-lg">
        {balanceLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-white/60" />
          </div>
        ) : balance ? (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
              <div>
                <p className="text-sm text-white/70 mb-1">Solde disponible</p>
                <p className="text-3xl font-bold">{fmtPrice(balance.availableBalance)}</p>
              </div>
              <button
                onClick={onRequestRefund}
                className="flex items-center gap-2 px-5 py-2.5 bg-white text-forest-800 font-semibold rounded-xl hover:bg-white/90 transition-colors shadow-md"
              >
                <Download className="w-4 h-4" />
                Demander un reversement
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/20">
              <div>
                <p className="text-sm text-white/60">Total collecté</p>
                <p className="text-lg font-semibold">{fmtPrice(balance.totalRevenue)}</p>
              </div>
              <div>
                <p className="text-sm text-white/60">Total reversé</p>
                <p className="text-lg font-semibold">{fmtPrice(balance.totalPayouts)}</p>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-white/60 text-center py-4">Impossible de charger le solde</p>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex items-center gap-2">
          <Search className="w-4 h-4 text-gray-400" />
          <span className="text-sm font-medium text-gray-700">Filtrer par statut :</span>
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
          className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-forest-500 focus:border-forest-500 outline-none"
        >
          <option value="">Tous les statuts</option>
          <option value="pending">En attente</option>
          <option value="approved">Approuvé</option>
          <option value="processed">Traité</option>
          <option value="rejected">Rejeté</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-forest-600" />
          </div>
        ) : payouts.length === 0 ? (
          <div className="text-center py-16">
            <ArrowRightLeft className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">Aucun reversement trouvé</p>
            <p className="text-sm text-gray-400 mt-1">Les demandes de reversement apparaîtront ici</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-2 py-1.5 sm:px-4 sm:py-3 text-xs sm:text-sm font-semibold text-gray-600 hidden sm:table-cell">Date</th>
                  <th className="text-right px-2 py-1.5 sm:px-4 sm:py-3 text-xs sm:text-sm font-semibold text-gray-600">Montant</th>
                  <th className="text-left px-2 py-1.5 sm:px-4 sm:py-3 text-xs sm:text-sm font-semibold text-gray-600 hidden sm:table-cell">Méthode</th>
                  <th className="text-center px-2 py-1.5 sm:px-4 sm:py-3 text-xs sm:text-sm font-semibold text-gray-600">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {payouts.map((p) => (
                  <tr key={p._id} onClick={() => setSelectedPayout(p)} className="hover:bg-gray-50 transition-colors cursor-pointer">
                    <td className="px-2 py-1.5 sm:px-4 sm:py-3 text-xs sm:text-sm text-gray-700 whitespace-nowrap hidden sm:table-cell">
                      {new Date(p.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-2 py-1.5 sm:px-4 sm:py-3 text-right font-medium text-gray-900 whitespace-nowrap text-xs sm:text-sm">
                      {fmtPrice(p.amount)}
                    </td>
                    <td className="px-2 py-1.5 sm:px-4 sm:py-3 text-gray-700 whitespace-nowrap text-xs sm:text-sm hidden sm:table-cell">
                      {METHOD_LABEL[p.paymentMethod] || p.paymentMethod}
                    </td>
                    <td className="px-2 py-1.5 sm:px-4 sm:py-3 text-center">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium border ${STATUS_STYLE[p.status] || 'bg-gray-100 text-gray-700 border-gray-200'}`}>
                        {STATUS_LABEL[p.status] || p.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && payouts.length > 0 && totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
            <p className="text-sm text-gray-600">
              Page {currentPage} sur {totalPages}
              {pagination?.total && <span className="ml-1 text-gray-400">({pagination.total} résultats)</span>}
            </p>
            <div className="flex items-center gap-2">
              <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage <= 1}
                className="p-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage >= totalPages}
                className="p-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      <ExportModal isOpen={showExportModal} onClose={() => setShowExportModal(false)} onExport={handleExportFormat} title="Exporter les reversements" />

      {/* Detail Modal */}
      {selectedPayout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSelectedPayout(null)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95">
            {/* Header */}
            <div className="bg-gradient-to-br from-forest-800 to-forest-900 text-white p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-white/70" />
                  <h3 className="font-bold text-lg">Détail du reversement</h3>
                </div>
                <button onClick={() => setSelectedPayout(null)} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-3xl font-bold">{fmtPrice(selectedPayout.amount)}</p>
              <div className="mt-2">
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${STATUS_STYLE[selectedPayout.status] || 'bg-gray-100 text-gray-700 border-gray-200'}`}>
                  {STATUS_LABEL[selectedPayout.status] || selectedPayout.status}
                </span>
              </div>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Montant brut</p>
                  <p className="font-bold text-dark-800 text-sm">{fmtPrice(selectedPayout.amount)}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Montant net</p>
                  <p className="font-bold text-green-600 text-sm">{fmtPrice(selectedPayout.netAmount)}</p>
                </div>
              </div>

              {selectedPayout.commission > 0 && (
                <div className="bg-amber-50 rounded-xl p-3 border border-amber-100">
                  <p className="text-[10px] text-amber-500 uppercase tracking-wider mb-1">Commission</p>
                  <p className="font-bold text-amber-700 text-sm">{fmtPrice(selectedPayout.commission)}</p>
                </div>
              )}

              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-500">Méthode de paiement</span>
                  <span className="text-sm font-medium text-dark-800">{METHOD_LABEL[selectedPayout.paymentMethod] || selectedPayout.paymentMethod}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-500">Statut</span>
                  <span className="flex items-center gap-1.5 text-sm font-medium">
                    {STATUS_ICON[selectedPayout.status]}
                    {STATUS_LABEL[selectedPayout.status] || selectedPayout.status}
                  </span>
                </div>
                {selectedPayout.transactionId && (
                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-500">ID Transaction</span>
                    <span className="text-sm font-mono text-dark-800 bg-gray-100 px-2 py-0.5 rounded">{selectedPayout.transactionId}</span>
                  </div>
                )}
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-500">Date de demande</span>
                  <span className="text-sm text-dark-800">{fmtDate(selectedPayout.createdAt)}</span>
                </div>
                {selectedPayout.approvedAt && (
                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-500">Date d'approbation</span>
                    <span className="text-sm text-dark-800">{fmtDate(selectedPayout.approvedAt)}</span>
                  </div>
                )}
                {selectedPayout.processedAt && (
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm text-gray-500">Date de traitement</span>
                    <span className="text-sm text-dark-800">{fmtDate(selectedPayout.processedAt)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="px-5 pb-5">
              <button
                onClick={() => setSelectedPayout(null)}
                className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors text-sm"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

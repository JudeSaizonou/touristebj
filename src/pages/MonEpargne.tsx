import React, { useState, useEffect } from 'react';
import {
  Calendar, PiggyBank, CheckCircle, Clock,
  Loader2, AlertCircle, TrendingUp, CreditCard, ChevronLeft, Users, ArrowRight, RefreshCw
} from 'lucide-react';
import { PublicLayout } from '../components/PublicLayout';
import { EpargneModal } from '../components/EpargneModal';
import { getBookingById, getBookingPayments } from '../api/trips';
import { useAuth } from '../context/AuthContext';
import type { MappedBooking, MappedPayment } from '../types';
import type { AuthMode } from './Auth';

interface MonEpargneProps {
  bookingId: string;
  onBack: () => void;
  onAdminLogin?: () => void;
  onOpenAuth?: (mode: AuthMode) => void;
  onMesVoyages?: () => void;
  onLogout?: () => void;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  PENDING_DEPOSIT: { label: 'Acompte en attente', color: 'text-amber-700 bg-amber-50 border-amber-200' },
  DEPOSIT_PAID:    { label: 'Acompte payé',        color: 'text-blue-700 bg-blue-50 border-blue-200' },
  IN_PROGRESS:     { label: 'Paiement en cours',   color: 'text-blue-700 bg-blue-50 border-blue-200' },
  SAVING:          { label: 'Épargne en cours',    color: 'text-forest-800 bg-forest-800/5 border-forest-800/20' },
  FULLY_PAID:      { label: 'Voyage payé',         color: 'text-green-700 bg-green-50 border-green-200' },
  COMPLETED:       { label: 'Voyage payé',         color: 'text-green-700 bg-green-50 border-green-200' },
  CANCELLED:       { label: 'Annulé',              color: 'text-red-600 bg-red-50 border-red-200' },
  REFUNDED:        { label: 'Remboursé',           color: 'text-gray-600 bg-gray-50 border-gray-200' },
};

export const MonEpargne: React.FC<MonEpargneProps> = ({
  bookingId,
  onBack,
  onAdminLogin,
  onOpenAuth,
  onMesVoyages,
  onLogout,
}) => {
  const { user } = useAuth();
  const [booking, setBooking] = useState<MappedBooking | null>(null);
  const [payments, setPayments] = useState<MappedPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [epargneOpen, setEpargneOpen] = useState(false);
  const [retryPayment, setRetryPayment] = useState<{ type: 'DEPOSIT' | 'INSTALLMENT'; amount: number } | null>(null);

  useEffect(() => {
    if (!user) {
      onOpenAuth?.('connexion');
      onBack();
    }
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    setError('');
    try {
      const [b, p] = await Promise.all([
        getBookingById(bookingId),
        getBookingPayments(bookingId),
      ]);
      setBooking(b);
      setPayments(p);
    } catch (err: any) {
      const msg: string = err?.message || '';
      const is401 = msg.toLowerCase().includes('token') || msg.includes('401') || msg.includes('Unauthorized');
      if (is401) {
        onOpenAuth?.('connexion');
        onBack();
        return;
      }
      setError(msg || 'Impossible de charger les détails.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (bookingId && user) loadData(); }, [bookingId, user]);

  const fmtPrice = (v: number) => v.toLocaleString('fr-FR').replace(/\s/g, '.') + ' FCFA';

  const percent = booking && booking.totalPrice > 0
    ? Math.min(100, Math.round((booking.amountPaid / booking.totalPrice) * 100))
    : 0;

  const daysLeft = booking?.paymentDeadline
    ? Math.max(0, Math.ceil((new Date(booking.paymentDeadline).getTime() - Date.now()) / 86400000))
    : null;

  const isUrgent = daysLeft !== null && daysLeft <= 14;
  const status = booking ? (STATUS_LABELS[booking.status] ?? { label: booking.status, color: 'text-gray-600 bg-gray-50 border-gray-200' }) : null;
  const isComplete = booking && ['FULLY_PAID', 'COMPLETED'].includes(booking.status);
  const canPay = booking && !['FULLY_PAID', 'COMPLETED', 'CANCELLED', 'REFUNDED'].includes(booking.status) && (booking.remainingAmount ?? 1) > 0;

  return (
    <PublicLayout onAdminLogin={onAdminLogin} onOpenAuth={onOpenAuth} onMesVoyages={onMesVoyages} onLogout={onLogout}>

      {loading && (
        <div className="flex flex-col items-center py-32 gap-4">
          <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
          <p className="text-dark-800/50">Chargement...</p>
        </div>
      )}

      {!loading && error && (
        <div className="flex flex-col items-center py-24 gap-4">
          <AlertCircle className="w-8 h-8 text-red-400" />
          <p className="text-red-600 font-medium">{error}</p>
          <button onClick={loadData} className="px-6 py-2.5 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-colors text-sm font-semibold">
            Réessayer
          </button>
        </div>
      )}

      {!loading && !error && booking && (
        <>
          {/* Compact header */}
          <div className="bg-gradient-to-r from-dark-800 to-dark-700 text-white">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
              <button onClick={onBack} className="flex items-center gap-1.5 text-white/50 hover:text-white text-sm mb-3 transition-colors">
                <ChevronLeft className="w-4 h-4" /> Mes Voyages
              </button>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h1 className="font-playfair text-2xl sm:text-3xl font-bold">{booking.voyage?.titre || 'Mon Épargne'}</h1>
                  <p className="text-white/50 text-sm mt-1">{booking.voyage?.destination}</p>
                </div>
                {status && (
                  <span className={`self-start sm:self-center text-xs font-semibold px-3 py-1.5 rounded-full border ${status.color}`}>
                    {status.label}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">

            {/* Progression principale */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6 shadow-sm mb-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary-500" />
                  <h2 className="font-bold text-dark-800">Progression</h2>
                </div>
                <span className={`text-2xl font-bold ${percent >= 100 ? 'text-green-500' : 'text-dark-800'}`}>{percent}%</span>
              </div>

              {/* Grande barre de progression */}
              <div className="h-4 bg-gray-100 rounded-full overflow-hidden mb-5">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${
                    percent >= 100 ? 'bg-green-500' : isUrgent ? 'bg-red-400' : 'bg-primary-500'
                  }`}
                  style={{ width: `${percent}%` }}
                />
              </div>

              {/* Stats en ligne */}
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-3 bg-gray-50 rounded-xl">
                  <p className="text-[10px] sm:text-xs text-dark-800/40 mb-1">Total voyage</p>
                  <p className="font-bold text-dark-800 text-sm">{fmtPrice(booking.totalPrice)}</p>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-xl">
                  <p className="text-[10px] sm:text-xs text-dark-800/40 mb-1">Épargné</p>
                  <p className="font-bold text-green-600 text-sm">{fmtPrice(booking.amountPaid)}</p>
                </div>
                <div className={`text-center p-3 rounded-xl ${booking.remainingAmount > 0 ? 'bg-amber-50' : 'bg-green-50'}`}>
                  <p className="text-[10px] sm:text-xs text-dark-800/40 mb-1">Restant</p>
                  <p className={`font-bold text-sm ${booking.remainingAmount > 0 ? 'text-amber-600' : 'text-green-600'}`}>
                    {fmtPrice(booking.remainingAmount)}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Colonne gauche : historique */}
              <div className="lg:col-span-2">
                <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6 shadow-sm">
                  <div className="flex items-center gap-2 mb-5">
                    <CreditCard className="w-5 h-5 text-dark-800/70" />
                    <h2 className="font-bold text-dark-800">Historique des paiements</h2>
                  </div>

                  {payments.length === 0 ? (
                    <div className="text-center py-10">
                      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <CreditCard className="w-5 h-5 text-gray-300" />
                      </div>
                      <p className="text-dark-800/40 text-sm">Aucun paiement enregistré</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {payments.map(p => {
                        const isSuccess = ['success', 'completed'].includes((p.status || '').toLowerCase());
                        const isPending = (p.status || '').toLowerCase() === 'pending';
                        const isFailed = !isSuccess && !isPending;
                        return (
                          <div key={p.id} className={`flex items-center justify-between p-3 rounded-xl gap-3 ${isPending || isFailed ? 'bg-gray-50/50' : 'hover:bg-gray-50'} transition-colors`}>
                            <div className="flex items-center gap-3 min-w-0">
                              <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                                isPending ? 'bg-amber-100' : isFailed ? 'bg-red-100' : p.type === 'DEPOSIT' ? 'bg-blue-100' : 'bg-primary-50'
                              }`}>
                                {isPending
                                  ? <Clock className="w-4 h-4 text-amber-500" />
                                  : isFailed
                                  ? <AlertCircle className="w-4 h-4 text-red-500" />
                                  : p.type === 'DEPOSIT'
                                  ? <CheckCircle className="w-4 h-4 text-blue-500" />
                                  : <PiggyBank className="w-4 h-4 text-primary-500" />
                                }
                              </div>
                              <div className="min-w-0">
                                <p className={`text-sm font-medium ${isPending || isFailed ? 'text-dark-800/50' : 'text-dark-800'}`}>
                                  {p.type === 'DEPOSIT' ? 'Acompte' : 'Versement'}
                                </p>
                                <p className="text-xs text-dark-800/40">{p.date}</p>
                              </div>
                            </div>
                            <div className="text-right flex-shrink-0 flex items-center gap-2">
                              <div>
                                <p className={`font-bold text-sm ${isPending || isFailed ? 'text-dark-800/40 line-through' : 'text-dark-800'}`}>{fmtPrice(p.amount)}</p>
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                                  isSuccess ? 'bg-green-100 text-green-600'
                                    : isPending ? 'bg-amber-100 text-amber-600'
                                    : 'bg-red-100 text-red-600'
                                }`}>
                                  {isSuccess ? 'Confirmé' : isPending ? 'En attente' : 'Échoué'}
                                </span>
                              </div>
                              {(isPending || isFailed) && (
                                <button
                                  onClick={() => {
                                    const pType = (p.type || '').toUpperCase().includes('DEPOSIT') ? 'DEPOSIT' as const : 'INSTALLMENT' as const;
                                    setRetryPayment({ type: pType, amount: p.amount });
                                    setEpargneOpen(true);
                                  }}
                                  className="p-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
                                  title="Repayer"
                                >
                                  <RefreshCw className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Colonne droite : actions + infos */}
              <div className="space-y-4">

                {/* Échéance */}
                {daysLeft !== null && canPay && (
                  <div className={`rounded-2xl p-5 border ${isUrgent ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <Clock className={`w-4 h-4 ${isUrgent ? 'text-red-500' : 'text-amber-500'}`} />
                      <p className={`text-xs font-semibold ${isUrgent ? 'text-red-600' : 'text-amber-600'}`}>
                        Date limite
                      </p>
                    </div>
                    <p className={`text-3xl font-bold font-playfair ${isUrgent ? 'text-red-700' : 'text-amber-700'}`}>
                      {daysLeft} <span className="text-lg">jours</span>
                    </p>
                    {booking.paymentDeadline && (
                      <p className={`text-xs mt-1 ${isUrgent ? 'text-red-500/70' : 'text-amber-600/70'}`}>
                        {new Date(booking.paymentDeadline).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </p>
                    )}
                  </div>
                )}

                {/* Bouton épargner */}
                {canPay && (
                  <button
                    onClick={() => setEpargneOpen(true)}
                    className="w-full py-4 bg-primary-500 text-white rounded-2xl font-semibold hover:bg-primary-600 transition-all hover:shadow-lg hover:shadow-primary-500/25 flex items-center justify-center gap-2 text-base"
                  >
                    <PiggyBank className="w-5 h-5" />
                    Ajouter un versement
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}

                {/* Voyage payé */}
                {isComplete && (
                  <div className="bg-green-50 border border-green-200 rounded-2xl p-5 text-center">
                    <CheckCircle className="w-10 h-10 text-green-500 mx-auto mb-2" />
                    <p className="font-bold text-green-700">Voyage intégralement payé !</p>
                    <p className="text-xs text-green-600/70 mt-1">Préparez vos bagages, l'aventure vous attend.</p>
                  </div>
                )}

                {/* Infos voyage */}
                <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm space-y-3">
                  <h3 className="font-bold text-dark-800 text-sm">Détails du voyage</h3>
                  {booking.voyage?.departureDate && (
                    <div className="flex items-center gap-2 text-sm text-dark-800/60">
                      <Calendar className="w-4 h-4 text-primary-500 flex-shrink-0" />
                      <span>{booking.voyage.departureDate}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm text-dark-800/60">
                    <Users className="w-4 h-4 text-primary-500 flex-shrink-0" />
                    <span>{booking.nombrePersonnes} personne{booking.nombrePersonnes > 1 ? 's' : ''}</span>
                  </div>
                  <div className="pt-3 border-t border-gray-100">
                    <p className="text-xs text-dark-800/40 mb-0.5">Acompte versé</p>
                    <p className="font-semibold text-dark-800">{fmtPrice(booking.depositAmount)}</p>
                    <p className="text-[10px] text-red-400 mt-0.5">Non remboursable</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      <EpargneModal
        isOpen={epargneOpen}
        booking={booking}
        onClose={() => { setEpargneOpen(false); setRetryPayment(null); }}
        onSuccess={() => { setRetryPayment(null); loadData(); }}
        forceType={retryPayment?.type}
        defaultAmount={retryPayment?.amount}
      />
    </PublicLayout>
  );
};

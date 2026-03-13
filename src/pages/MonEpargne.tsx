import React, { useState, useEffect } from 'react';
import {
  ArrowLeft, Calendar, PiggyBank, CheckCircle, Clock,
  Loader2, AlertCircle, TrendingUp, CreditCard
} from 'lucide-react';
import { PublicLayout } from '../components/PublicLayout';
import { EpargneModal } from '../components/EpargneModal';
import { getBookingById, getBookingPayments } from '../api/trips';
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
  PENDING_DEPOSIT: { label: 'Acompte en attente', color: 'text-amber-600 bg-amber-50 border-amber-200' },
  DEPOSIT_PAID:    { label: 'Acompte payé',        color: 'text-blue-600 bg-blue-50 border-blue-200' },
  IN_PROGRESS:     { label: 'Paiement en cours',   color: 'text-blue-600 bg-blue-50 border-blue-200' },
  SAVING:          { label: 'Épargne en cours',    color: 'text-forest-800 bg-forest-800/5 border-forest-800/20' },
  FULLY_PAID:      { label: 'Voyage payé',         color: 'text-green-600 bg-green-50 border-green-200' },
  COMPLETED:       { label: 'Voyage payé',         color: 'text-green-600 bg-green-50 border-green-200' },
  CANCELLED:       { label: 'Annulé',              color: 'text-red-600 bg-red-50 border-red-200' },
  REFUNDED:        { label: 'Remboursé',           color: 'text-gray-600 bg-gray-50 border-gray-200' },
};

const PAYMENT_TYPE_LABELS: Record<string, string> = {
  DEPOSIT: 'Acompte',
  INSTALLMENT: 'Versement',
};

export const MonEpargne: React.FC<MonEpargneProps> = ({
  bookingId,
  onBack,
  onAdminLogin,
  onOpenAuth,
  onMesVoyages,
  onLogout,
}) => {
  const [booking, setBooking] = useState<MappedBooking | null>(null);
  const [payments, setPayments] = useState<MappedPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [epargneOpen, setEpargneOpen] = useState(false);

  const loadData = async () => {
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
      setError(err?.message || 'Impossible de charger les détails.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (bookingId) loadData();
  }, [bookingId]);

  const fmtPrice = (v: number) => v.toLocaleString('fr-FR').replace(/\s/g, '.') + ' FCFA';

  const percent = booking && booking.totalPrice > 0
    ? Math.min(100, Math.round((booking.amountPaid / booking.totalPrice) * 100))
    : 0;

  const daysLeft = booking?.paymentDeadline
    ? Math.max(0, Math.ceil((new Date(booking.paymentDeadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null;

  const status = booking ? (STATUS_LABELS[booking.status] ?? { label: booking.status, color: 'text-gray-600 bg-gray-50 border-gray-200' }) : null;

  return (
    <PublicLayout
      onAdminLogin={onAdminLogin}
      onOpenAuth={onOpenAuth}
      onMesVoyages={onMesVoyages}
      onLogout={onLogout}
    >
      {loading && (
        <div className="flex flex-col items-center py-32 gap-4">
          <Loader2 className="w-8 h-8 text-forest-800 animate-spin" />
          <p className="text-dark-800/60">Chargement...</p>
        </div>
      )}

      {!loading && error && (
        <div className="flex flex-col items-center py-24 gap-4">
          <AlertCircle className="w-8 h-8 text-red-400" />
          <p className="text-red-600 font-medium">{error}</p>
          <button onClick={loadData} className="px-6 py-2.5 bg-forest-800 text-white rounded-lg hover:bg-forest-900 transition-colors text-sm font-medium">
            Réessayer
          </button>
        </div>
      )}

      {!loading && !error && booking && (
        <>
          {/* Hero avec image */}
          <div className="relative h-[280px] overflow-hidden">
            <img
              src={booking.voyage?.images?.[0] || 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1600'}
              alt={booking.voyage?.titre}
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-dark-800/80" />
            <div className="relative h-full flex flex-col justify-end pb-8 px-4 max-w-4xl mx-auto">
              <button
                onClick={onBack}
                className="flex items-center gap-2 text-white/70 hover:text-white transition-colors mb-4 self-start"
              >
                <ArrowLeft className="w-4 h-4" />
                Mes voyages
              </button>
              <h1 className="font-playfair text-3xl md:text-4xl font-bold text-white mb-2">
                {booking.voyage?.titre || 'Mon Épargne'}
              </h1>
              {status && (
                <span className={`self-start text-xs font-semibold px-3 py-1.5 rounded-full border ${status.color}`}>
                  {status.label}
                </span>
              )}
            </div>
            <div className="absolute bottom-0 left-0 right-0">
              <svg viewBox="0 0 1440 50" className="w-full" preserveAspectRatio="none">
                <path d="M0,25 C360,50 720,0 1080,25 C1260,38 1380,30 1440,25 L1440,50 L0,50 Z" fill="white" />
              </svg>
            </div>
          </div>

          <div className="max-w-4xl mx-auto px-4 py-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* LEFT: progression + infos */}
              <div className="lg:col-span-2 space-y-5">
                {/* Carte progression */}
                <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                  <div className="flex items-center gap-2 mb-5">
                    <TrendingUp className="w-5 h-5 text-forest-800" />
                    <h2 className="font-playfair font-bold text-dark-800 text-lg">Progression de l'épargne</h2>
                  </div>

                  {/* Barre principale */}
                  <div className="mb-5">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-dark-800/60">Montant épargné</span>
                      <span className="font-bold text-dark-800">{percent}%</span>
                    </div>
                    <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${percent >= 100 ? 'bg-green-500' : 'bg-forest-800'}`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-3 bg-gray-50 rounded-xl">
                      <p className="text-xs text-dark-800/50 mb-1">Total voyage</p>
                      <p className="font-bold text-dark-800 text-sm">{fmtPrice(booking.totalPrice)}</p>
                    </div>
                    <div className="text-center p-3 bg-forest-800/5 rounded-xl">
                      <p className="text-xs text-dark-800/50 mb-1">Épargné</p>
                      <p className="font-bold text-forest-800 text-sm">{fmtPrice(booking.amountPaid)}</p>
                    </div>
                    <div className={`text-center p-3 rounded-xl ${booking.remainingAmount > 0 ? 'bg-amber-50' : 'bg-green-50'}`}>
                      <p className="text-xs text-dark-800/50 mb-1">Restant</p>
                      <p className={`font-bold text-sm ${booking.remainingAmount > 0 ? 'text-amber-600' : 'text-green-600'}`}>
                        {fmtPrice(booking.remainingAmount)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Historique des paiements */}
                <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                  <div className="flex items-center gap-2 mb-5">
                    <CreditCard className="w-5 h-5 text-dark-800" />
                    <h2 className="font-playfair font-bold text-dark-800 text-lg">Historique des paiements</h2>
                  </div>

                  {payments.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-dark-800/40 text-sm">Aucun paiement enregistré</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {payments.map((p) => (
                        <div key={p.id} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${p.type === 'DEPOSIT' ? 'bg-blue-100' : 'bg-forest-800/10'}`}>
                              {p.type === 'DEPOSIT'
                                ? <CheckCircle className="w-4 h-4 text-blue-500" />
                                : <PiggyBank className="w-4 h-4 text-forest-800" />
                              }
                            </div>
                            <div>
                              <p className="text-sm font-medium text-dark-800">
                                {PAYMENT_TYPE_LABELS[p.type] ?? p.type}
                              </p>
                              <p className="text-xs text-dark-800/50">{p.date}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-dark-800 text-sm">{fmtPrice(p.amount)}</p>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${p.status === 'COMPLETED' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                              {p.status === 'COMPLETED' ? 'Confirmé' : p.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* RIGHT: actions + infos voyage */}
              <div className="space-y-5">
                {/* Deadline card */}
                {daysLeft !== null && !['FULLY_PAID', 'COMPLETED', 'CANCELLED', 'REFUNDED'].includes(booking.status) && (booking.remainingAmount ?? 1) > 0 && (
                  <div className={`rounded-2xl p-5 border ${daysLeft <= 14 ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className={`w-5 h-5 ${daysLeft <= 14 ? 'text-red-500' : 'text-amber-500'}`} />
                      <p className={`font-semibold text-sm ${daysLeft <= 14 ? 'text-red-700' : 'text-amber-700'}`}>
                        Date limite de paiement
                      </p>
                    </div>
                    <p className={`text-2xl font-bold font-playfair ${daysLeft <= 14 ? 'text-red-700' : 'text-amber-700'}`}>
                      {daysLeft} jours
                    </p>
                    {booking.paymentDeadline && (
                      <p className={`text-xs mt-1 ${daysLeft <= 14 ? 'text-red-500' : 'text-amber-600'}`}>
                        {new Date(booking.paymentDeadline).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </p>
                    )}
                  </div>
                )}

                {/* Bouton épargner */}
                {!['FULLY_PAID', 'COMPLETED', 'CANCELLED', 'REFUNDED'].includes(booking.status) && (booking.remainingAmount ?? 1) > 0 && (
                  <button
                    onClick={() => setEpargneOpen(true)}
                    className="w-full py-4 bg-forest-800 text-white rounded-2xl font-semibold hover:bg-forest-900 transition-colors flex items-center justify-center gap-2"
                  >
                    <PiggyBank className="w-5 h-5" />
                    Ajouter un versement
                  </button>
                )}

                {(['FULLY_PAID', 'COMPLETED'].includes(booking.status) || (booking.remainingAmount ?? 1) === 0) && (
                  <div className="bg-green-50 border border-green-200 rounded-2xl p-5 text-center">
                    <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                    <p className="font-bold text-green-700">Voyage intégralement payé !</p>
                    <p className="text-xs text-green-600 mt-1">Préparez vos bagages, l'aventure vous attend.</p>
                  </div>
                )}

                {/* Infos voyage */}
                <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm space-y-3">
                  <h3 className="font-playfair font-bold text-dark-800">Détails du voyage</h3>
                  {booking.voyage?.departureDate && (
                    <div className="flex items-center gap-2 text-sm text-dark-800/70">
                      <Calendar className="w-4 h-4 text-primary-500 flex-shrink-0" />
                      <span>{booking.voyage.departureDate}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm text-dark-800/70">
                    <svg className="w-4 h-4 text-primary-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>{booking.nombrePersonnes} personne{booking.nombrePersonnes > 1 ? 's' : ''}</span>
                  </div>
                  <div className="pt-2 border-t border-gray-100">
                    <p className="text-xs text-dark-800/50 mb-0.5">Acompte versé</p>
                    <p className="font-semibold text-dark-800">{fmtPrice(booking.depositAmount)}</p>
                    <p className="text-xs text-red-500 mt-0.5">Non remboursable</p>
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
        onClose={() => setEpargneOpen(false)}
        onSuccess={loadData}
      />
    </PublicLayout>
  );
};

import React, { useState, useEffect } from 'react';
import { MapPin, Calendar, Clock, PiggyBank, Eye, AlertCircle, Loader2, Plane } from 'lucide-react';
import { PublicLayout } from '../components/PublicLayout';
import { EpargneModal } from '../components/EpargneModal';
import { getMyBookings } from '../api/trips';
import type { MappedBooking } from '../types';
import type { AuthMode } from './Auth';

interface MesVoyagesProps {
  onBack: () => void;
  onViewBooking: (bookingId: string) => void;
  onAdminLogin?: () => void;
  onOpenAuth?: (mode: AuthMode) => void;
  onMesVoyages?: () => void;
  onLogout?: () => void;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  PENDING_DEPOSIT: { label: 'Acompte en attente', color: 'bg-amber-100 text-amber-700' },
  DEPOSIT_PAID:    { label: 'Acompte payé',        color: 'bg-blue-100 text-blue-700' },
  SAVING:          { label: 'Épargne en cours',    color: 'bg-[#1a4d3e]/10 text-[#1a4d3e]' },
  FULLY_PAID:      { label: 'Voyage payé',         color: 'bg-green-100 text-green-700' },
  CANCELLED:       { label: 'Annulé',              color: 'bg-red-100 text-red-600' },
};

export const MesVoyages: React.FC<MesVoyagesProps> = ({
  onBack,
  onViewBooking,
  onAdminLogin,
  onOpenAuth,
  onMesVoyages,
  onLogout,
}) => {
  const [bookings, setBookings] = useState<MappedBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [epargneBooking, setEpargneBooking] = useState<MappedBooking | null>(null);

  const loadBookings = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getMyBookings();
      setBookings(data);
    } catch (err: any) {
      setError(err?.message || 'Impossible de charger vos réservations.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
  }, []);

  const fmtPrice = (v: number) => v.toLocaleString('fr-FR').replace(/\s/g, '.') + ' FCFA';

  return (
    <PublicLayout
      onAdminLogin={onAdminLogin}
      onOpenAuth={onOpenAuth}
      onMesVoyages={onMesVoyages}
      onLogout={onLogout}
    >
      {/* Hero */}
      <div className="relative h-[240px] overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1600)' }}
        >
          <div className="absolute inset-0 bg-[#1a4d3e]/85" />
        </div>
        <div className="relative h-full flex items-center justify-center">
          <div className="text-center text-white">
            <h1 className="text-4xl md:text-5xl font-bold mb-3 tracking-tight" style={{ fontFamily: "'Outfit', sans-serif" }}>
              MES VOYAGES
            </h1>
            <div className="flex items-center justify-center gap-2 text-gray-300 text-sm">
              <button onClick={onBack} className="hover:text-white transition-colors">Accueil</button>
              <span>/</span>
              <span className="text-[#FF7F2A]">Mes Voyages</span>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" className="w-full" preserveAspectRatio="none">
            <path d="M0,30 C360,60 720,0 1080,30 C1260,45 1380,38 1440,30 L1440,60 L0,60 Z" fill="white" />
          </svg>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-10">
        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center py-20 gap-4">
            <Loader2 className="w-8 h-8 text-[#1a4d3e] animate-spin" />
            <p className="text-[#17233E]/60">Chargement de vos réservations...</p>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="flex flex-col items-center py-16 gap-4">
            <div className="flex items-center gap-2 text-red-500">
              <AlertCircle className="w-5 h-5" />
              <p className="font-medium">{error}</p>
            </div>
            <button
              onClick={loadBookings}
              className="px-6 py-2.5 bg-[#1a4d3e] text-white rounded-lg hover:bg-[#153d31] transition-colors font-medium text-sm"
            >
              Réessayer
            </button>
          </div>
        )}

        {/* Empty */}
        {!loading && !error && bookings.length === 0 && (
          <div className="flex flex-col items-center py-20 gap-5 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center">
              <Plane className="w-9 h-9 text-gray-300" />
            </div>
            <div>
              <p className="text-xl font-playfair font-bold text-[#17233E] mb-2">Aucune réservation</p>
              <p className="text-[#17233E]/60 text-sm max-w-sm">
                Vous n'avez pas encore réservé de voyage. Découvrez nos destinations et commencez à épargner !
              </p>
            </div>
            <button
              onClick={onBack}
              className="px-8 py-3 bg-[#FF7F2A] text-white rounded-xl font-semibold hover:bg-[#e66d1e] transition-colors"
            >
              Découvrir les voyages
            </button>
          </div>
        )}

        {/* Booking cards */}
        {!loading && !error && bookings.length > 0 && (
          <div className="space-y-5">
            <p className="text-sm text-[#17233E]/60">
              {bookings.length} réservation{bookings.length > 1 ? 's' : ''}
            </p>
            {bookings.map((booking) => {
              const status = STATUS_LABELS[booking.status] ?? { label: booking.status, color: 'bg-gray-100 text-gray-600' };
              const percent = booking.totalPrice > 0
                ? Math.min(100, Math.round((booking.amountPaid / booking.totalPrice) * 100))
                : 0;
              const daysLeft = booking.paymentDeadline
                ? Math.max(0, Math.ceil((new Date(booking.paymentDeadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
                : null;
              const isUrgent = daysLeft !== null && daysLeft <= 14 && booking.status !== 'FULLY_PAID' && booking.status !== 'CANCELLED';

              return (
                <div key={booking.id} className="bg-white rounded-2xl border border-gray-100 hover:shadow-lg transition-all duration-300 overflow-hidden">
                  <div className="flex flex-col md:flex-row gap-0">
                    {/* Image */}
                    <div className="md:w-48 h-44 md:h-auto relative overflow-hidden flex-shrink-0">
                      <img
                        src={booking.voyage?.images?.[0] || 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400'}
                        alt={booking.voyage?.titre}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-3 left-3">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${status.color}`}>
                          {status.label}
                        </span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-playfair font-bold text-[#17233E] text-lg leading-tight">
                            {booking.voyage?.titre || 'Voyage'}
                          </h3>
                          <div className="flex items-center gap-1.5 text-xs text-[#17233E]/60 mt-1">
                            <MapPin className="w-3.5 h-3.5 text-[#FF7F2A]" />
                            {booking.voyage?.destination}
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0 ml-3">
                          <p className="text-xs text-[#17233E]/50">Total</p>
                          <p className="font-bold text-[#17233E]">{fmtPrice(booking.totalPrice)}</p>
                          <p className="text-xs text-[#17233E]/50">{booking.nombrePersonnes} pers.</p>
                        </div>
                      </div>

                      {/* Info row */}
                      <div className="flex flex-wrap gap-3 mb-4 text-xs text-[#17233E]/60">
                        {booking.voyage?.departureDate && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {booking.voyage.departureDate}
                          </span>
                        )}
                        {daysLeft !== null && booking.status !== 'FULLY_PAID' && booking.status !== 'CANCELLED' && (
                          <span className={`flex items-center gap-1 font-medium ${isUrgent ? 'text-red-500' : ''}`}>
                            <Clock className="w-3.5 h-3.5" />
                            {isUrgent ? `Urgent : ` : ''}{daysLeft} jours restants
                          </span>
                        )}
                      </div>

                      {/* Progress bar */}
                      {booking.status !== 'CANCELLED' && (
                        <div className="mb-4">
                          <div className="flex justify-between text-xs text-[#17233E]/60 mb-1.5">
                            <span>Épargné : {fmtPrice(booking.amountPaid)}</span>
                            <span className="font-medium">{percent}%</span>
                          </div>
                          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${percent >= 100 ? 'bg-green-500' : 'bg-[#1a4d3e]'}`}
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                          {booking.remainingAmount > 0 && (
                            <p className="text-xs text-[#17233E]/50 mt-1">
                              Restant : <span className="font-medium text-[#17233E]">{fmtPrice(booking.remainingAmount)}</span>
                            </p>
                          )}
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex gap-2.5">
                        <button
                          onClick={() => onViewBooking(booking.id)}
                          className="flex items-center gap-1.5 px-4 py-2 border border-gray-200 text-[#17233E] rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm"
                        >
                          <Eye className="w-4 h-4" />
                          Détails
                        </button>
                        {booking.status !== 'FULLY_PAID' && booking.status !== 'CANCELLED' && (
                          <button
                            onClick={() => setEpargneBooking(booking)}
                            className="flex items-center gap-1.5 px-4 py-2 bg-[#1a4d3e] text-white rounded-lg hover:bg-[#153d31] transition-colors font-medium text-sm"
                          >
                            <PiggyBank className="w-4 h-4" />
                            Épargner
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <EpargneModal
        isOpen={!!epargneBooking}
        booking={epargneBooking}
        onClose={() => setEpargneBooking(null)}
        onSuccess={loadBookings}
      />
    </PublicLayout>
  );
};

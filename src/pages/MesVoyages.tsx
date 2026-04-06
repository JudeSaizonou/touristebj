import React, { useState, useEffect, useMemo } from 'react';
import {
  MapPin, Calendar, Clock, PiggyBank, Eye, AlertCircle, Loader2,
  Plane, ChevronDown, ArrowRight, TrendingUp, Wallet, ChevronLeft, Mail, UserPlus, CheckCircle
} from 'lucide-react';
import { PublicLayout } from '../components/PublicLayout';
import { EpargneModal } from '../components/EpargneModal';
import { getMyBookings, getMyInvitations } from '../api/trips';
import type { MappedInvitation } from '../api/trips';
import { useAuth } from '../context/AuthContext';
import type { MappedBooking } from '../types';
import type { AuthMode } from './Auth';
import { fmtPrice } from '../utils/format';
import { getBookingStatus } from '../utils/statusConfig';

interface MesVoyagesProps {
  onBack: () => void;
  onViewBooking: (bookingId: string) => void;
  onAdminLogin?: () => void;
  onOpenAuth?: (mode: AuthMode) => void;
  onMesVoyages?: () => void;
  onLogout?: () => void;
}

const FILTER_TABS: { key: string; label: string; statuses: string[] }[] = [
  { key: '',          label: 'Tous',    statuses: [] },
  { key: 'en_cours',  label: 'En cours', statuses: ['PENDING_DEPOSIT', 'DEPOSIT_PAID', 'SAVING', 'IN_PROGRESS'] },
  { key: 'payes',     label: 'Payés',    statuses: ['FULLY_PAID', 'COMPLETED'] },
  { key: 'annules',   label: 'Annulés',  statuses: ['CANCELLED'] },
];

type SortKey = 'recent' | 'oldest' | 'amount';

export const MesVoyages: React.FC<MesVoyagesProps> = ({
  onBack,
  onViewBooking,
  onAdminLogin,
  onOpenAuth,
  onMesVoyages,
  onLogout,
}) => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<MappedBooking[]>([]);
  const [invitations, setInvitations] = useState<MappedInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [epargneBooking, setEpargneBooking] = useState<MappedBooking | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('recent');

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!user) {
      onOpenAuth?.('connexion');
      onBack();
    }
  }, [user]);

  const loadBookings = async () => {
    if (!user) return;
    setLoading(true);
    setError('');
    try {
      const [data, invs] = await Promise.all([
        getMyBookings(),
        getMyInvitations().catch(() => [] as MappedInvitation[]),
      ]);
      setBookings(data);
      setInvitations(invs.filter(i => i.status === 'pending'));
    } catch (err: any) {
      const msg: string = err?.message || '';
      const is401 = msg.toLowerCase().includes('token') || msg.includes('401') || msg.includes('Unauthorized');
      if (is401) {
        onOpenAuth?.('connexion');
        onBack();
        return;
      }
      setError(msg || 'Impossible de charger vos réservations.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (user) loadBookings(); }, [user]);

  // Stats globales
  const stats = useMemo(() => {
    const active = bookings.filter(b => !['CANCELLED', 'COMPLETED'].includes(b.status));
    const totalEpargne = bookings.reduce((sum, b) => sum + b.amountPaid, 0);
    const prochaine = active
      .filter(b => b.paymentDeadline)
      .sort((a, b) => new Date(a.paymentDeadline!).getTime() - new Date(b.paymentDeadline!).getTime())[0];
    const joursProchain = prochaine?.paymentDeadline
      ? Math.max(0, Math.ceil((new Date(prochaine.paymentDeadline).getTime() - Date.now()) / 86400000))
      : null;
    return {
      total: bookings.length,
      enCours: active.length,
      totalEpargne,
      joursProchain,
    };
  }, [bookings]);

  const tabCounts = useMemo(() => {
    const counts: Record<string, number> = { '': bookings.length };
    for (const tab of FILTER_TABS) {
      if (tab.key) counts[tab.key] = bookings.filter(b => tab.statuses.includes(b.status)).length;
    }
    return counts;
  }, [bookings]);

  const filteredBookings = useMemo(() => {
    const activeTab = FILTER_TABS.find(t => t.key === statusFilter);
    let result = activeTab && activeTab.statuses.length > 0
      ? bookings.filter(b => activeTab.statuses.includes(b.status))
      : [...bookings];
    result.sort((a, b) => {
      if (sortKey === 'oldest') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      if (sortKey === 'amount') return b.totalPrice - a.totalPrice;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    return result;
  }, [bookings, statusFilter, sortKey]);

  return (
    <PublicLayout onAdminLogin={onAdminLogin} onOpenAuth={onOpenAuth} onMesVoyages={onMesVoyages} onLogout={onLogout}>

      {/* Compact header */}
      <div className="bg-gradient-to-r from-dark-800 to-dark-700 text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
          <button onClick={onBack} className="flex items-center gap-1.5 text-white/50 hover:text-white text-sm mb-3 transition-colors">
            <ChevronLeft className="w-4 h-4" /> Accueil
          </button>
          <h1 className="font-playfair text-2xl sm:text-3xl font-bold">Mes Voyages</h1>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center py-20 gap-4">
            <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
            <p className="text-dark-800/50">Chargement...</p>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="flex flex-col items-center py-16 gap-4">
            <AlertCircle className="w-8 h-8 text-red-400" />
            <p className="text-red-500 font-medium">{error}</p>
            <button onClick={loadBookings} className="px-6 py-2.5 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-colors text-sm font-semibold">
              Réessayer
            </button>
          </div>
        )}

        {/* Empty */}
        {!loading && !error && bookings.length === 0 && invitations.length === 0 && (
          <div className="flex flex-col items-center py-12 sm:py-20 gap-6 text-center max-w-md mx-auto">
            <div className="w-24 h-24 bg-primary-50 rounded-full flex items-center justify-center">
              <Plane className="w-11 h-11 text-primary-400" />
            </div>
            <div>
              <p className="text-2xl font-playfair font-bold text-dark-800 mb-3">Pas encore de voyage</p>
              <p className="text-dark-800/50 text-sm leading-relaxed">
                Vous n'avez aucune réservation pour le moment. Parcourez nos destinations, trouvez le voyage qui vous inspire et réservez avec seulement 30% d'acompte.
              </p>
            </div>

            <div className="w-full space-y-3">
              <button
                onClick={onBack}
                className="w-full inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-primary-500 text-white rounded-xl font-semibold hover:bg-primary-600 transition-colors"
              >
                Découvrir les voyages <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-4 pt-4 w-full">
              <div className="bg-white rounded-xl border border-gray-100 p-3 text-center">
                <p className="font-bold text-primary-500 text-lg">30%</p>
                <p className="text-[10px] text-dark-800/40 mt-0.5">d'acompte seulement</p>
              </div>
              <div className="bg-white rounded-xl border border-gray-100 p-3 text-center">
                <p className="font-bold text-primary-500 text-lg">0%</p>
                <p className="text-[10px] text-dark-800/40 mt-0.5">de frais cachés</p>
              </div>
              <div className="bg-white rounded-xl border border-gray-100 p-3 text-center">
                <p className="font-bold text-primary-500 text-lg">100%</p>
                <p className="text-[10px] text-dark-800/40 mt-0.5">sécurisé</p>
              </div>
            </div>
          </div>
        )}

        {/* Pending invitations */}
        {!loading && invitations.length > 0 && (
          <div className="mb-8">
            <h2 className="font-playfair font-bold text-dark-800 text-lg mb-4 flex items-center gap-2">
              <Mail className="w-5 h-5 text-primary-500" /> Invitations reçues
            </h2>
            <div className="space-y-3">
              {invitations.map(inv => (
                <div key={inv.id} className="bg-white rounded-2xl border border-primary-200 overflow-hidden hover:shadow-md transition-all">
                  <div className="flex flex-col sm:flex-row">
                    {inv.trip?.images?.[0] && (
                      <div className="sm:w-32 h-24 sm:h-auto overflow-hidden flex-shrink-0">
                        <img src={inv.trip.images[0]} alt={inv.trip.title} className="w-full h-full object-cover" loading="lazy" />
                      </div>
                    )}
                    <div className="flex-1 p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-playfair font-bold text-dark-800 text-base truncate">{inv.trip?.title || 'Voyage'}</p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-dark-800/50">
                          {inv.trip?.destination && (
                            <span className="flex items-center gap-1"><MapPin className="w-3 h-3 text-primary-500" />{inv.trip.destination}</span>
                          )}
                          {inv.trip?.departureDate && (
                            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{inv.trip.departureDate}</span>
                          )}
                        </div>
                        <p className="text-xs text-dark-800/50 mt-1">
                          Invité par <strong>{inv.invitedBy?.username || 'un ami'}</strong>
                          {inv.paymentMode === 'pay_all' && (
                            <span className="ml-1 text-green-600 font-medium">— Place déjà payée</span>
                          )}
                        </p>
                      </div>
                      <a
                        href={`/invitation/${inv.inviteToken}`}
                        className="flex items-center justify-center gap-1.5 w-full sm:w-auto px-5 py-3 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-colors font-semibold text-sm whitespace-nowrap"
                      >
                        <UserPlus className="w-4 h-4" /> Accepter
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Content */}
        {!loading && !error && bookings.length > 0 && (
          <>
            {/* Stats cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
              <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-primary-50 rounded-lg flex items-center justify-center">
                    <Plane className="w-4 h-4 text-primary-500" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-dark-800">{stats.total}</p>
                <p className="text-xs text-dark-800/40">Réservation{stats.total > 1 ? 's' : ''}</p>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-blue-500" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-dark-800">{stats.enCours}</p>
                <p className="text-xs text-dark-800/40">En cours</p>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center">
                    <Wallet className="w-4 h-4 text-green-500" />
                  </div>
                </div>
                <p className="text-lg sm:text-2xl font-bold text-dark-800">{fmtPrice(stats.totalEpargne)}</p>
                <p className="text-xs text-dark-800/40">Total épargné</p>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${stats.joursProchain !== null && stats.joursProchain <= 14 ? 'bg-red-50' : 'bg-amber-50'}`}>
                    <Clock className={`w-4 h-4 ${stats.joursProchain !== null && stats.joursProchain <= 14 ? 'text-red-500' : 'text-amber-500'}`} />
                  </div>
                </div>
                <p className="text-2xl font-bold text-dark-800">{stats.joursProchain !== null ? `${stats.joursProchain}j` : '—'}</p>
                <p className="text-xs text-dark-800/40">Prochaine échéance</p>
              </div>
            </div>

            {/* Filter tabs + sort */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
              <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar flex-1">
                {FILTER_TABS.map(tab => {
                  const isActive = statusFilter === tab.key;
                  return (
                    <button
                      key={tab.key}
                      onClick={() => setStatusFilter(tab.key)}
                      className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                        isActive ? 'bg-dark-800 text-white' : 'bg-gray-100 text-dark-800/60 hover:bg-gray-200'
                      }`}
                    >
                      {tab.label}
                      <span className={`text-xs px-1.5 py-0.5 rounded-full min-w-[20px] text-center ${
                        isActive ? 'bg-white/20' : 'bg-gray-200 text-dark-800/40'
                      }`}>
                        {tabCounts[tab.key] ?? 0}
                      </span>
                    </button>
                  );
                })}
              </div>
              <div className="relative flex-shrink-0">
                <select
                  value={sortKey}
                  onChange={e => setSortKey(e.target.value as SortKey)}
                  className="appearance-none pl-3 pr-8 py-2 bg-gray-100 rounded-lg text-sm font-medium text-dark-800/60 hover:bg-gray-200 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                >
                  <option value="recent">Plus récent</option>
                  <option value="oldest">Plus ancien</option>
                  <option value="amount">Montant</option>
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-800/30 pointer-events-none" />
              </div>
            </div>

            {filteredBookings.length === 0 && (
              <div className="text-center py-12 text-dark-800/40 text-sm">
                Aucune réservation dans cette catégorie.
              </div>
            )}

            {/* Booking cards */}
            <div className="space-y-4">
              {filteredBookings.map(booking => {
                const status = getBookingStatus(booking.status);
                const percent = booking.totalPrice > 0 ? Math.min(100, Math.round((booking.amountPaid / booking.totalPrice) * 100)) : 0;
                const daysLeft = booking.paymentDeadline
                  ? Math.max(0, Math.ceil((new Date(booking.paymentDeadline).getTime() - Date.now()) / 86400000))
                  : null;
                const isUrgent = daysLeft !== null && daysLeft <= 14 && !['FULLY_PAID', 'CANCELLED', 'COMPLETED'].includes(booking.status);
                const canPay = !['FULLY_PAID', 'CANCELLED', 'COMPLETED'].includes(booking.status);

                return (
                  <div key={booking.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300">
                    <div className="flex flex-col sm:flex-row">
                      {/* Image */}
                      <div className="sm:w-44 h-36 sm:h-auto relative overflow-hidden flex-shrink-0">
                        <img
                          src={booking.voyage?.images?.[0] || 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400'}
                          alt={booking.voyage?.titre}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent sm:bg-gradient-to-r" />
                        <span className={`absolute top-3 left-3 text-[10px] font-semibold px-2.5 py-1 rounded-full border ${status.bg} ${status.color}`}>
                          {status.label}
                        </span>
                      </div>

                      {/* Content */}
                      <div className="flex-1 p-4 sm:p-5 flex flex-col">
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="min-w-0">
                            <h3 className="font-playfair font-bold text-dark-800 text-base sm:text-lg truncate">
                              {booking.voyage?.titre || 'Voyage'}
                            </h3>
                            <div className="flex items-center gap-3 mt-1 text-xs text-dark-800/50">
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-primary-500" />{booking.voyage?.destination}
                              </span>
                              {booking.voyage?.departureDate && (
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />{booking.voyage.departureDate}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="font-bold text-dark-800 text-sm sm:text-base">{fmtPrice(booking.totalPrice)}</p>
                            <p className="text-[10px] text-dark-800/40">{booking.nombrePersonnes} pers.</p>
                          </div>
                        </div>

                        {/* Progress */}
                        {booking.status !== 'CANCELLED' && (
                          <div className="mb-4">
                            <div className="flex justify-between text-xs mb-1.5">
                              <span className="text-dark-800/50">
                                {fmtPrice(booking.amountPaid)} épargnés
                              </span>
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-dark-800">{percent}%</span>
                                {isUrgent && (
                                  <span className="text-red-500 font-medium flex items-center gap-0.5">
                                    <Clock className="w-3 h-3" />{daysLeft}j
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${
                                  percent >= 100 ? 'bg-green-500' : isUrgent ? 'bg-red-400' : 'bg-primary-500'
                                }`}
                                style={{ width: `${percent}%` }}
                              />
                            </div>
                            {booking.remainingAmount > 0 && (
                              <p className="text-[10px] text-dark-800/40 mt-1">
                                Reste {fmtPrice(booking.remainingAmount)}
                              </p>
                            )}
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex flex-wrap gap-2 mt-auto">
                          <button
                            onClick={() => onViewBooking(booking.id)}
                            className="flex items-center gap-1.5 px-4 py-2.5 border border-gray-200 text-dark-800 rounded-xl hover:bg-gray-50 transition-colors font-medium text-sm"
                          >
                            <Eye className="w-4 h-4" /> Détails
                          </button>
                          {canPay && (
                            <button
                              onClick={() => setEpargneBooking(booking)}
                              className="flex items-center gap-1.5 px-4 py-2.5 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-colors font-semibold text-sm"
                            >
                              <PiggyBank className="w-4 h-4" /> Épargner
                            </button>
                          )}
                          {booking.nombrePersonnes > 1 && booking.depositPaid && !['CANCELLED'].includes(booking.status) && (
                            <button
                              onClick={() => onViewBooking(booking.id)}
                              className="flex items-center gap-1.5 px-4 py-2.5 border border-primary-200 text-primary-600 rounded-xl hover:bg-primary-50 transition-colors font-medium text-sm"
                            >
                              <UserPlus className="w-4 h-4" />
                              Inviter
                              {booking.invitationStats && booking.invitationStats.accepted > 0 && (
                                <span className="flex items-center gap-0.5 text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">
                                  <CheckCircle className="w-3 h-3" /> {booking.invitationStats.accepted}
                                </span>
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
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

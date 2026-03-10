import React, { useState, useEffect } from 'react';
import { Search, ChevronLeft, ChevronRight, X, TrendingUp, Users, MapPin, CreditCard, Clock, AlertTriangle } from 'lucide-react';
import { BarChart, Bar, XAxis, ResponsiveContainer, Cell, Tooltip, LineChart, Line, CartesianGrid, YAxis } from 'recharts';
import { getDashboardStats, getDashboardBookings, getMonthlyStats } from '../api/trips';
import type { DashboardStats, DashboardBooking, MonthlyPoint } from '../api/trips';

const fmt = (n: number) =>
  n >= 1e6 ? (n / 1e6).toFixed(1) + 'M' : n >= 1e3 ? (n / 1e3).toFixed(0) + 'K' : String(n);

const fmtFcfa = (n: number) =>
  n.toLocaleString('fr-FR').replace(/\s/g, '.') + ' FCFA';

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

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gray-900 text-white px-3 py-2 rounded-lg text-sm font-medium shadow-lg">
        <p className="text-gray-400 text-xs mb-1">{label}</p>
        <p>{payload[0].value.toLocaleString('fr-FR')}</p>
      </div>
    );
  }
  return null;
};

interface BookingDetailModalProps {
  booking: DashboardBooking;
  onClose: () => void;
}

const BookingDetailModal: React.FC<BookingDetailModalProps> = ({ booking, onClose }) => {
  const progressPct = booking.totalAmount > 0
    ? Math.round((booking.amountPaid / booking.totalAmount) * 100)
    : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Détails réservation</h2>
            <p className="text-sm text-gray-500">{booking.bookingNumber}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Client */}
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Client</p>
            <p className="font-semibold text-gray-900">{booking.client.nom}</p>
            {booking.client.telephone && <p className="text-sm text-gray-600">{booking.client.telephone}</p>}
            {booking.client.email && <p className="text-sm text-gray-600">{booking.client.email}</p>}
          </div>

          {/* Voyage */}
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Voyage</p>
            <p className="font-semibold text-gray-900">{booking.voyage.destination || booking.voyage.titre}</p>
            {booking.voyage.departureDate && <p className="text-sm text-gray-600">Départ : {booking.voyage.departureDate}</p>}
            <p className="text-sm text-gray-600">{booking.nombrePersonnes} participant{booking.nombrePersonnes > 1 ? 's' : ''}</p>
          </div>

          {/* Paiements */}
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Paiements</p>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <p className="text-xs text-gray-500">Total</p>
                <p className="font-bold text-gray-900">{fmtFcfa(booking.totalAmount)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Acompte</p>
                <p className="font-bold text-blue-600">{fmtFcfa(booking.depositAmount)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Payé</p>
                <p className="font-bold text-green-600">{fmtFcfa(booking.amountPaid)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Solde restant</p>
                <p className="font-bold text-orange-600">{fmtFcfa(booking.remainingAmount)}</p>
              </div>
            </div>
            {/* Progress bar */}
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-primary-500 h-2 rounded-full transition-all"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">{progressPct}% payé</p>
          </div>

          {/* Statut */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Date de réservation</p>
              <p className="text-sm font-medium text-gray-700">{booking.createdAt}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500 mb-1">Statut</p>
              <span className={`px-3 py-1 rounded-full text-xs font-medium border ${STATUS_STYLE[booking.status] || STATUS_STYLE['PENDING_DEPOSIT']}`}>
                {STATUS_LABEL[booking.status] || booking.status}
              </span>
            </div>
          </div>

          {booking.isPaymentOverdue && (
            <div className="flex items-center gap-2 bg-red-50 text-red-700 rounded-xl p-3 text-sm">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>Paiement en retard — échéance : {booking.paymentDeadline}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [bookings, setBookings] = useState<DashboardBooking[]>([]);
  const [pagination, setPagination] = useState<any>(null);
  const [monthlyData, setMonthlyData] = useState<MonthlyPoint[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<DashboardBooking | null>(null);

  const itemsPerPage = 10;

  useEffect(() => {
    loadStats();
    loadMonthly();
  }, []);

  useEffect(() => {
    loadBookings();
  }, [currentPage, statusFilter]);

  const loadStats = async () => {
    try {
      const data = await getDashboardStats();
      setStats(data);
    } catch (e) {
      setError((e as { message?: string })?.message || 'Erreur chargement des statistiques');
    } finally {
      setLoading(false);
    }
  };

  const loadMonthly = async () => {
    try {
      const data = await getMonthlyStats(12);
      setMonthlyData(data);
    } catch {
      // non critique
    }
  };

  const loadBookings = async () => {
    try {
      const { bookings: list, pagination: pag } = await getDashboardBookings({
        status: statusFilter || undefined,
        page: currentPage,
        limit: itemsPerPage,
      });
      setBookings(list);
      setPagination(pag);
    } catch {
      // non critique
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    getDashboardBookings({ search, status: statusFilter || undefined, page: 1, limit: itemsPerPage })
      .then(({ bookings: list, pagination: pag }) => { setBookings(list); setPagination(pag); })
      .catch(() => {});
  };

  const totalPages = pagination?.pages ?? Math.max(1, Math.ceil((pagination?.total ?? bookings.length) / itemsPerPage));

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return <div className="p-8"><p className="text-red-600">{error}</p></div>;
  }

  return (
    <div className="p-4 md:p-8 space-y-8">
      {selectedBooking && (
        <BookingDetailModal booking={selectedBooking} onClose={() => setSelectedBooking(null)} />
      )}

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          icon={<MapPin className="w-5 h-5" />}
          label="Voyages"
          value={stats?.trips.total ?? 0}
          sub={`${stats?.trips.active ?? 0} actifs`}
          color="orange"
        />
        <StatCard
          icon={<Users className="w-5 h-5" />}
          label="Clients"
          value={stats?.clients.total ?? 0}
          sub={`${stats?.bookings.total ?? 0} réservations`}
          color="blue"
        />
        <StatCard
          icon={<CreditCard className="w-5 h-5" />}
          label="Acomptes collectés"
          value={fmt(stats?.revenue.collected ?? 0)}
          sub={`${stats?.bookings.confirmed ?? 0} confirmées`}
          color="green"
        />
        <StatCard
          icon={<TrendingUp className="w-5 h-5" />}
          label="Revenu total"
          value={fmt(stats?.revenue.total ?? 0)}
          sub={`${stats?.bookings.total ?? 0} réservations`}
          color="purple"
        />
        <StatCard
          icon={<Clock className="w-5 h-5" />}
          label="Paiements en attente"
          value={fmt(stats?.revenue.pending ?? 0)}
          sub={`${stats?.bookings.pending ?? 0} résa.`}
          color="amber"
        />
        <StatCard
          icon={<AlertTriangle className="w-5 h-5" />}
          label="Réservations annulées"
          value={stats?.bookings.cancelled ?? 0}
          sub={`${stats?.trips.cancelled ?? 0} voyages annulés`}
          color="red"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue chart */}
        <div className="bg-white rounded-xl p-6 shadow-card border border-gray-100">
          <h3 className="text-base font-semibold text-gray-900 mb-1">Revenus par mois</h3>
          <p className="text-2xl font-bold text-gray-900 mb-4">{fmtFcfa(stats?.revenue.total ?? 0)}</p>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 11 }} />
                <Tooltip
                  content={({ active, payload, label }) =>
                    active && payload?.length ? (
                      <div className="bg-gray-900 text-white px-3 py-2 rounded-lg text-sm shadow-lg">
                        <p className="text-gray-400 text-xs mb-1">{label}</p>
                        <p>{fmtFcfa(payload[0].value as number)}</p>
                      </div>
                    ) : null
                  }
                  cursor={false}
                />
                <Bar dataKey="revenue" radius={[6, 6, 0, 0]}>
                  {monthlyData.map((_, i) => (
                    <Cell key={i} fill={i % 2 === 0 ? '#E5E7EB' : '#F97316'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bookings chart */}
        <div className="bg-white rounded-xl p-6 shadow-card border border-gray-100">
          <h3 className="text-base font-semibold text-gray-900 mb-1">Réservations par mois</h3>
          <p className="text-2xl font-bold text-gray-900 mb-4">{stats?.bookings.total ?? 0} au total</p>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 11 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 11 }} width={30} />
                <Tooltip
                  content={({ active, payload, label }) =>
                    active && payload?.length ? (
                      <div className="bg-gray-900 text-white px-3 py-2 rounded-lg text-sm shadow-lg">
                        <p className="text-gray-400 text-xs mb-1">{label}</p>
                        <p>{payload[0].value} réservations</p>
                      </div>
                    ) : null
                  }
                />
                <Line type="monotone" dataKey="bookings" stroke="#F97316" strokeWidth={2.5} dot={{ fill: '#F97316', r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bookings table */}
      <div className="bg-white rounded-xl shadow-card border border-gray-100">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-6 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">Toutes les réservations</h2>
          <div className="flex gap-3 flex-wrap">
            <form onSubmit={handleSearch} className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher client, voyage..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 w-56"
              />
            </form>
            <select
              value={statusFilter}
              onChange={e => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              className="text-sm bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Tous les statuts</option>
              <option value="PENDING_DEPOSIT">En attente</option>
              <option value="DEPOSIT_PAID">Acompte payé</option>
              <option value="IN_PROGRESS">En cours</option>
              <option value="COMPLETED">Complétées</option>
              <option value="CANCELLED">Annulées</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Client</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Voyage</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Pers.</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Total</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Acompte</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Solde</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Statut</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Date</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {bookings.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-gray-400">Aucune réservation</td>
                </tr>
              ) : bookings.map(b => (
                <tr
                  key={b.id}
                  className="hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => setSelectedBooking(b)}
                >
                  <td className="px-6 py-4">
                    <p className="font-medium text-gray-900 text-sm">{b.client.nom}</p>
                    {b.client.telephone && <p className="text-xs text-gray-400">{b.client.telephone}</p>}
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-medium text-gray-900 text-sm">{b.voyage.destination || b.voyage.titre}</p>
                    {b.voyage.departureDate && <p className="text-xs text-gray-400">{b.voyage.departureDate}</p>}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">{b.nombrePersonnes}</td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{fmt(b.totalAmount)}</td>
                  <td className="px-6 py-4 text-sm font-medium text-blue-600">{fmt(b.depositAmount)}</td>
                  <td className="px-6 py-4 text-sm font-medium text-orange-600">{fmt(b.remainingAmount)}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${STATUS_STYLE[b.status] || STATUS_STYLE['PENDING_DEPOSIT']}`}>
                      {STATUS_LABEL[b.status] || b.status}
                    </span>
                    {b.isPaymentOverdue && (
                      <span className="ml-1 inline-block w-2 h-2 rounded-full bg-red-500" title="Retard de paiement" />
                    )}
                  </td>
                  <td className="px-6 py-4 text-xs text-gray-400">{b.createdAt}</td>
                  <td className="px-6 py-4">
                    <button
                      onClick={e => { e.stopPropagation(); setSelectedBooking(b); }}
                      className="text-xs text-primary-600 font-medium hover:underline"
                    >
                      Voir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-50"
            >
              <ChevronLeft className="w-4 h-4 text-gray-600" />
            </button>
            <span className="text-sm text-gray-600">Page {currentPage} / {totalPages}</span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-50"
            >
              <ChevronRight className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub: string;
  color: 'orange' | 'blue' | 'green' | 'purple' | 'amber' | 'red';
}

const colorMap = {
  orange: { bg: 'bg-orange-50', text: 'text-orange-600', icon: 'text-orange-500' },
  blue: { bg: 'bg-blue-50', text: 'text-blue-600', icon: 'text-blue-500' },
  green: { bg: 'bg-green-50', text: 'text-green-600', icon: 'text-green-500' },
  purple: { bg: 'bg-purple-50', text: 'text-purple-600', icon: 'text-purple-500' },
  amber: { bg: 'bg-amber-50', text: 'text-amber-600', icon: 'text-amber-500' },
  red: { bg: 'bg-red-50', text: 'text-red-600', icon: 'text-red-500' },
};

const StatCard: React.FC<StatCardProps> = ({ icon, label, value, sub, color }) => {
  const c = colorMap[color];
  return (
    <div className="bg-white rounded-xl p-5 shadow-card border border-gray-100">
      <div className={`w-9 h-9 ${c.bg} ${c.icon} rounded-lg flex items-center justify-center mb-3`}>
        {icon}
      </div>
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className={`text-xl font-bold ${c.text} leading-tight`}>{value}</p>
      <p className="text-xs text-gray-400 mt-1">{sub}</p>
    </div>
  );
};

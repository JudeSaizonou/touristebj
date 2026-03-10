import React, { useState, useEffect } from 'react';
import { StatsCard } from '../components/StatsCard';
import { ChartCard } from '../components/ChartCard';
import { ChartData } from '../types';
import { getDashboardStats, getChartsData } from '../api/trips';

export const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const computed = await getDashboardStats();
        if (!cancelled) setStats(computed);
      } catch (e) {
        if (!cancelled) setError((e as { message?: string })?.message || 'Erreur chargement des statistiques');
      }
      try {
        const charts = await getChartsData();
        if (!cancelled) setChartData(charts);
      } catch {
        // charts non critiques, on affiche des données vides
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (error) {
    return (
      <div className="p-8">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="p-8">
        <p className="text-gray-600">Chargement...</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-8">
        <StatsCard
          label="Total des voyages"
          value={stats.totalVoyages}
          highlight
        />
        <StatsCard
          label="Total des réservations"
          value={stats.totalReservations}
          highlight
        />
        <StatsCard
          label="Total des acomptes collectés"
          value={stats.totalAcomptes}
          highlight
        />
        <StatsCard
          label="Utilisateurs en épargne"
          value={stats.utilisateursEpargne}
          highlight
        />
        <StatsCard
          label="Montant en attente"
          value={stats.montantAttente}
          highlight
        />
        <StatsCard
          label="Total des paiements"
          value={stats.totalPaiements}
          highlight
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard
          title="Réservations"
          total={stats.totalReservations + ' réservations'}
          data={chartData}
        />
        <ChartCard
          title="Acomptes collectés"
          total={stats.totalAcomptes + ' FCFA'}
          data={chartData}
        />
      </div>
    </div>
  );
};

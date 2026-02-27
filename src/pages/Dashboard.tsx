import React, { useState, useEffect } from 'react';
import { StatsCard } from '../components/StatsCard';
import { ChartCard } from '../components/ChartCard';
import { ChartData } from '../types';
import { StorageService } from '../utils/storage';

export const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [chartData, setChartData] = useState<ChartData[]>([]);

  useEffect(() => {
    // Compute stats from real data
    const computed = StorageService.getComputedStats();
    setStats(computed);

    // Generate chart data from voyages per month
    const voyages = StorageService.getVoyages();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const data: ChartData[] = months.map((month) => {
      const count = voyages.filter((v: any) => {
        const dateStr = v.dateDebut || '';
        return dateStr.toLowerCase().includes(month.toLowerCase());
      }).length;
      return { month, value: count > 0 ? count * 30 + 20 : 0 };
    });
    setChartData(data);
  }, []);

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

import { useState } from 'react';
import { BarChart, Bar, XAxis, ResponsiveContainer, Cell, Tooltip } from 'recharts';
import { Eye, Upload, Trash2, MoreVertical } from 'lucide-react';
import { ChartData } from '../types';

interface ChartCardProps {
  title: string;
  total: string;
  data: ChartData[];
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gray-900 text-white px-3 py-2 rounded-lg text-sm font-medium shadow-lg">
        {payload[0].value}
      </div>
    );
  }
  return null;
};

export const ChartCard: React.FC<ChartCardProps> = ({ title, total, data }) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [showMenu, setShowMenu] = useState(false);

  const handleExportCSV = () => {
    const headers = ['Mois', 'Valeur'];
    const rows = data.map(d => [d.month, d.value.toString()]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/\s+/g, '_').toLowerCase()}_chart.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setShowMenu(false);
  };

  const totalValue = data.reduce((sum, d) => sum + d.value, 0);
  const pendingPercent = totalValue > 0 ? Math.round((data.filter(d => d.value === 0).length / data.length) * 100) : 0;

  return (
    <div className="bg-white rounded-xl p-6 shadow-card border border-gray-100 relative">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">{title}</h3>
          <div className="text-3xl font-bold text-gray-900">{total}</div>
        </div>

        {/* Menu Button */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <MoreVertical className="w-5 h-5 text-gray-400" />
          </button>

          {showMenu && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowMenu(false)}
              ></div>
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-20">
                <button
                  onClick={() => setShowMenu(false)}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3"
                >
                  <Eye className="w-4 h-4" />
                  View
                </button>
                <button
                  onClick={handleExportCSV}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3"
                >
                  <Upload className="w-4 h-4" />
                  Export CSV
                </button>
                <button
                  onClick={() => setShowMenu(false)}
                  className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-3"
                >
                  <Trash2 className="w-4 h-4" />
                  Remove
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Chart */}
      <div className="h-48 md:h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#9CA3AF', fontSize: 12 }}
            />
            <Tooltip content={<CustomTooltip />} cursor={false} />
            <Bar
              dataKey="value"
              radius={[8, 8, 0, 0]}
              onMouseEnter={(_, index) => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              {data.map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={hoveredIndex === index ? '#ea580c' : index % 2 === 0 ? '#E5E7EB' : '#F97316'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Footer */}
      <div className="mt-4 pt-4 border-t border-gray-100">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <div className="w-3 h-3 bg-primary-500 rounded-sm"></div>
          <span>Pending ({pendingPercent}%)</span>
        </div>
      </div>
    </div>
  );
};

import React from 'react';

interface StatsCardProps {
  label: string;
  value: string | number;
  highlight?: boolean;
}

export const StatsCard: React.FC<StatsCardProps> = ({ label, value, highlight = false }) => {
  return (
    <div className="bg-white rounded-xl p-6 shadow-card border border-gray-100 hover:shadow-lg transition-shadow duration-200">
      <div className="text-sm text-gray-600 mb-3 font-medium">{label}</div>
      <div className={`text-2xl md:text-4xl font-bold ${
        highlight ? 'bg-gradient-to-r from-primary-600 to-primary-500 bg-clip-text text-transparent' : 'text-primary-500'
      }`}>
        {value}
      </div>
    </div>
  );
};

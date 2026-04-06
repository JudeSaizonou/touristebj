import React from 'react';
import type { StatusEntry } from '../utils/statusConfig';

interface StatusBadgeProps {
  status: StatusEntry;
  size?: 'sm' | 'md';
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'sm', className = '' }) => {
  const sizeClass = size === 'md' ? 'px-3 py-1 text-sm' : 'px-2.5 py-0.5 text-xs';
  return (
    <span
      className={`inline-flex items-center rounded-full font-medium border ${status.style} ${sizeClass} ${className}`}
      role="status"
      aria-label={status.label}
    >
      {status.label}
    </span>
  );
};

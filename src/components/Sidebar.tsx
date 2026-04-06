import React from 'react';
import { LayoutDashboard, Plane, ChevronRight, CalendarCheck, Users, Settings, LogOut, ArrowRightLeft } from 'lucide-react';
import { PageView } from '../types';
import LogoTouristeBj from '../assets/LogoTouristeBj.png';

interface BadgeCounts {
  reservations?: number;
  voyageurs?: number;
  reversements?: number;
}

interface SidebarProps {
  currentPage: 'dashboard' | 'voyages' | 'reservations' | 'all-voyageurs' | 'reversements' | 'parametres';
  onNavigate: (page: PageView) => void;
  onLogout?: () => void;
  onRequestRefund?: () => void;
  badges?: BadgeCounts;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentPage, onNavigate, onLogout, onRequestRefund, badges }) => {
  const menuItems = [
    { id: 'dashboard' as const, label: 'Dashboard', icon: LayoutDashboard, badge: 0 },
    { id: 'voyages' as const, label: 'Voyages', icon: Plane, badge: 0 },
    { id: 'reservations' as const, label: 'Réservations', icon: CalendarCheck, badge: badges?.reservations || 0 },
    { id: 'all-voyageurs' as const, label: 'Voyageurs', icon: Users, badge: badges?.voyageurs || 0 },
    { id: 'reversements' as const, label: 'Reversements', icon: ArrowRightLeft, badge: badges?.reversements || 0 },
    { id: 'parametres' as const, label: 'Paramètres', icon: Settings, badge: 0 },
  ];

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col h-screen">
      {/* Logo */}
      <div className="p-4 border-b border-gray-100">
        <img src={LogoTouristeBj} alt="Le Touriste.bj" className="h-12 object-contain" />
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group ${
                isActive
                  ? 'bg-primary-500 text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-600'}`} />
              <span className="flex-1 text-left font-medium">{item.label}</span>
              {item.badge > 0 && !isActive && (
                <span className="min-w-[20px] h-5 flex items-center justify-center px-1.5 text-[10px] font-bold bg-red-500 text-white rounded-full">
                  {item.badge > 99 ? '99+' : item.badge}
                </span>
              )}
              {isActive && <ChevronRight className="w-4 h-4" />}
            </button>
          );
        })}
      </nav>

      {/* Logout */}
      {onLogout && (
        <div className="p-4 space-y-2 border-t border-gray-100">
          {onRequestRefund && (
            <button
              onClick={onRequestRefund}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-forest-800/5 text-forest-800 hover:bg-forest-800/10 transition-all duration-200 group"
            >
              <ArrowRightLeft className="w-5 h-5 text-forest-700 group-hover:text-forest-800" />
              <span className="flex-1 text-left font-medium text-sm">Demander un reversement</span>
            </button>
          )}
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-600 hover:bg-red-50 hover:text-red-600 transition-all duration-200 group"
          >
            <LogOut className="w-5 h-5 text-gray-400 group-hover:text-red-500" />
            <span className="flex-1 text-left font-medium">Déconnexion</span>
          </button>
        </div>
      )}
    </aside>
  );
};

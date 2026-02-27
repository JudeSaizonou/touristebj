import React from 'react';
import { Settings, Globe, Bell, Shield, Palette } from 'lucide-react';

export const Parametres: React.FC = () => {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Paramètres</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-card border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
              <Settings className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Général</h3>
              <p className="text-xs text-gray-500">Paramètres généraux de l'application</p>
            </div>
          </div>
          <p className="text-sm text-gray-400">Configuration en cours de développement...</p>
        </div>

        <div className="bg-white rounded-xl shadow-card border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Globe className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Langue & Devise</h3>
              <p className="text-xs text-gray-500">Français / FCFA</p>
            </div>
          </div>
          <p className="text-sm text-gray-400">Configuration en cours de développement...</p>
        </div>

        <div className="bg-white rounded-xl shadow-card border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
              <Bell className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Notifications</h3>
              <p className="text-xs text-gray-500">Gérer les alertes et notifications</p>
            </div>
          </div>
          <p className="text-sm text-gray-400">Configuration en cours de développement...</p>
        </div>

        <div className="bg-white rounded-xl shadow-card border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Sécurité</h3>
              <p className="text-xs text-gray-500">Authentification et autorisations</p>
            </div>
          </div>
          <p className="text-sm text-gray-400">Configuration en cours de développement...</p>
        </div>

        <div className="bg-white rounded-xl shadow-card border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Palette className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Apparence</h3>
              <p className="text-xs text-gray-500">Thème et personnalisation</p>
            </div>
          </div>
          <p className="text-sm text-gray-400">Configuration en cours de développement...</p>
        </div>
      </div>
    </div>
  );
};

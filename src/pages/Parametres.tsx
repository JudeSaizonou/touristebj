import React, { useState, useEffect } from 'react';
import { User, Shield, Bell, Smartphone, Eye, EyeOff, Save, Trash2, ExternalLink } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ToastContainer, useToast } from '../components/Toast';

const NOTIF_PREFS_KEY = 'touriste_notification_prefs';

interface NotificationPrefs {
  newBookingEmail: boolean;
  paymentReceivedEmail: boolean;
  paymentLateEmail: boolean;
}

const defaultNotifPrefs: NotificationPrefs = {
  newBookingEmail: true,
  paymentReceivedEmail: true,
  paymentLateEmail: false,
};

function loadNotifPrefs(): NotificationPrefs {
  try {
    const raw = localStorage.getItem(NOTIF_PREFS_KEY);
    if (raw) return { ...defaultNotifPrefs, ...JSON.parse(raw) };
  } catch { /* ignore */ }
  return defaultNotifPrefs;
}

/* ------------------------------------------------------------------ */

export const Parametres: React.FC = () => {
  const { user } = useAuth();
  const { toasts, addToast, removeToast } = useToast();

  // --- Security form state ---
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // --- Notification prefs ---
  const [notifPrefs, setNotifPrefs] = useState<NotificationPrefs>(loadNotifPrefs);

  useEffect(() => {
    localStorage.setItem(NOTIF_PREFS_KEY, JSON.stringify(notifPrefs));
  }, [notifPrefs]);

  const toggleNotif = (key: keyof NotificationPrefs) => {
    setNotifPrefs(prev => {
      const updated = { ...prev, [key]: !prev[key] };
      return updated;
    });
    addToast('success', 'Préférence de notification mise à jour');
  };

  // --- Security submit ---
  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldPassword || !newPassword || !confirmPassword) {
      addToast('error', 'Veuillez remplir tous les champs');
      return;
    }
    if (newPassword !== confirmPassword) {
      addToast('error', 'Les mots de passe ne correspondent pas');
      return;
    }
    if (newPassword.length < 6) {
      addToast('error', 'Le mot de passe doit contenir au moins 6 caractères');
      return;
    }
    addToast('info', 'Fonctionnalité bientôt disponible');
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  // --- Cache clear ---
  const handleClearCache = () => {
    const token = localStorage.getItem('touriste_token');
    const userStored = localStorage.getItem('touriste_user');
    localStorage.clear();
    if (token) localStorage.setItem('touriste_token', token);
    if (userStored) localStorage.setItem('touriste_user', userStored);
    addToast('success', 'Cache vidé avec succès');
  };

  /* ================================================================ */

  return (
    <div className="p-4 sm:p-8 max-w-4xl mx-auto space-y-8">
      <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Paramètres</h1>

      {/* ======================= PROFIL ======================= */}
      <section className="bg-white rounded-xl shadow-card border border-gray-100 p-4 sm:p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
            <User className="w-5 h-5 text-primary-600" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">Profil</h2>
            <p className="text-xs text-gray-500">Informations de votre compte partenaire</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Username */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Nom d'utilisateur</label>
            <input
              type="text"
              readOnly
              value={user?.username ?? '—'}
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-700 cursor-not-allowed"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Téléphone</label>
            <input
              type="text"
              readOnly
              value={user?.phoneNumber ?? '—'}
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-700 cursor-not-allowed"
            />
          </div>

          {/* Role */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Rôle</label>
            <input
              type="text"
              readOnly
              value={user?.role ?? '—'}
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-700 cursor-not-allowed"
            />
          </div>

          {/* Country code */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Code pays</label>
            <input
              type="text"
              readOnly
              value={user?.countryCode ?? '—'}
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-700 cursor-not-allowed"
            />
          </div>
        </div>

        <div className="mt-5 flex justify-end">
          <button
            disabled
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 text-gray-400 text-sm font-medium cursor-not-allowed"
          >
            <Save className="w-4 h-4" />
            Modifier le profil
            <span className="ml-1 text-[10px] font-semibold uppercase tracking-wide bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded">
              Bientôt
            </span>
          </button>
        </div>
      </section>

      {/* ======================= SECURITE ======================= */}
      <section className="bg-white rounded-xl shadow-card border border-gray-100 p-4 sm:p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
            <Shield className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">Sécurité</h2>
            <p className="text-xs text-gray-500">Modifier votre mot de passe</p>
          </div>
        </div>

        <form onSubmit={handlePasswordSubmit} className="space-y-4 w-full sm:max-w-md">
          {/* Old password */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Mot de passe actuel</label>
            <div className="relative">
              <input
                type={showOld ? 'text' : 'password'}
                value={oldPassword}
                onChange={e => setOldPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent pr-10"
              />
              <button
                type="button"
                onClick={() => setShowOld(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showOld ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* New password */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Nouveau mot de passe</label>
            <div className="relative">
              <input
                type={showNew ? 'text' : 'password'}
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent pr-10"
              />
              <button
                type="button"
                onClick={() => setShowNew(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Confirm password */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Confirmer le mot de passe</label>
            <div className="relative">
              <input
                type={showConfirm ? 'text' : 'password'}
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent pr-10"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium transition-colors"
          >
            <Save className="w-4 h-4" />
            <span className="text-xs sm:text-sm">Changer le mot de passe</span>
          </button>
        </form>
      </section>

      {/* ======================= NOTIFICATIONS ======================= */}
      <section className="bg-white rounded-xl shadow-card border border-gray-100 p-4 sm:p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
            <Bell className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">Notifications</h2>
            <p className="text-xs text-gray-500">Gérer vos préférences de notifications par email</p>
          </div>
        </div>

        <div className="space-y-4 max-w-md">
          <ToggleRow
            label="Nouvelle réservation"
            description="Recevoir un email lors d'une nouvelle réservation"
            checked={notifPrefs.newBookingEmail}
            onChange={() => toggleNotif('newBookingEmail')}
          />
          <ToggleRow
            label="Paiement reçu"
            description="Recevoir un email lors d'un paiement confirmé"
            checked={notifPrefs.paymentReceivedEmail}
            onChange={() => toggleNotif('paymentReceivedEmail')}
          />
          <ToggleRow
            label="Paiement en retard"
            description="Recevoir un email si un paiement est en retard"
            checked={notifPrefs.paymentLateEmail}
            onChange={() => toggleNotif('paymentLateEmail')}
          />
        </div>
      </section>

      {/* ======================= APPLICATION ======================= */}
      <section className="bg-white rounded-xl shadow-card border border-gray-100 p-4 sm:p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <Smartphone className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">Application</h2>
            <p className="text-xs text-gray-500">Informations et maintenance</p>
          </div>
        </div>

        <div className="space-y-4 max-w-md">
          {/* Version */}
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-gray-600">Version de l'application</span>
            <span className="text-sm font-mono font-medium text-gray-900 bg-gray-100 px-2.5 py-0.5 rounded">
              1.0.0
            </span>
          </div>

          <hr className="border-gray-100" />

          {/* Clear cache */}
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm font-medium text-gray-700">Vider le cache</p>
              <p className="text-xs text-gray-400">Supprime les données locales (sauf authentification)</p>
            </div>
            <button
              onClick={handleClearCache}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 text-sm font-medium transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Vider
            </button>
          </div>

          <hr className="border-gray-100" />

          {/* Back to catalog */}
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm font-medium text-gray-700">Site public</p>
              <p className="text-xs text-gray-400">Retourner au catalogue des voyages</p>
            </div>
            <a
              href="/"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 text-sm font-medium transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              Catalogue
            </a>
          </div>
        </div>
      </section>

      <ToastContainer toasts={toasts} onClose={removeToast} />
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Toggle component                                                    */
/* ------------------------------------------------------------------ */

interface ToggleRowProps {
  label: string;
  description: string;
  checked: boolean;
  onChange: () => void;
}

const ToggleRow: React.FC<ToggleRowProps> = ({ label, description, checked, onChange }) => (
  <div className="flex items-center justify-between py-2">
    <div>
      <p className="text-sm font-medium text-gray-700">{label}</p>
      <p className="text-xs text-gray-400">{description}</p>
    </div>
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
        checked ? 'bg-primary-600' : 'bg-gray-200'
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  </div>
);

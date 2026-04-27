import { useState, useEffect } from 'react';
import {
  ArrowLeft,
  UserPlus,
  Crown,
  Shield,
  Eye,
  Trash2,
  Edit2,
  RefreshCw,
  AlertTriangle,
  Loader2,
  X,
  ChevronDown,
} from 'lucide-react';
import {
  getTripManagers,
  inviteManager,
  updateManagerRole,
  removeManager,
  transferOwnership,
  type TripManager,
  type TripManagerRole,
} from '../api/managers';
import { getPartnerVoyageById } from '../api/trips';
import { useAuth } from '../context/AuthContext';
import { ToastContainer, useToast } from '../components/Toast';

interface TripManagersProps {
  tripId: string;
  onBack: () => void;
}

const ROLE_CONFIG: Record<TripManagerRole, { label: string; color: string; icon: React.ReactNode }> = {
  OWNER: {
    label: 'Propriétaire',
    color: 'bg-amber-100 text-amber-800 border border-amber-200',
    icon: <Crown className="w-3.5 h-3.5" />,
  },
  MANAGER: {
    label: 'Manager',
    color: 'bg-blue-100 text-blue-800 border border-blue-200',
    icon: <Shield className="w-3.5 h-3.5" />,
  },
  READONLY: {
    label: 'Lecture seule',
    color: 'bg-gray-100 text-gray-700 border border-gray-200',
    icon: <Eye className="w-3.5 h-3.5" />,
  },
};

function RoleBadge({ role }: { role: TripManagerRole }) {
  const cfg = ROLE_CONFIG[role];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${cfg.color}`}>
      {cfg.icon}
      {cfg.label}
    </span>
  );
}

// ─── Modal Invitation ──────────────────────────────────────────────────────

interface InviteModalProps {
  tripId: string;
  onClose: () => void;
  onSuccess: (managers: TripManager[]) => void;
  addToast: (type: 'success' | 'error', msg: string) => void;
}

function InviteModal({ tripId, onClose, onSuccess, addToast }: InviteModalProps) {
  const [countryCode, setCountryCode] = useState('229');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [role, setRole] = useState<'MANAGER' | 'READONLY'>('MANAGER');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber.trim()) return;
    setLoading(true);
    try {
      await inviteManager(tripId, { countryCode: countryCode.trim(), phoneNumber: phoneNumber.trim(), role });
      // Re-fetch managers list after invite
      const managers = await getTripManagers(tripId);
      onSuccess(managers);
      addToast('success', 'Invitation envoyée par SMS');
      onClose();
    } catch (err: any) {
      const code = err?.code || '';
      if (code === 'ALREADY_MANAGER') addToast('error', 'Ce numéro est déjà manager de ce voyage');
      else if (code === 'INVITE_PENDING') addToast('error', 'Une invitation est déjà en attente pour ce numéro');
      else if (code === 'INVALID_ROLE') addToast('error', 'Rôle invalide');
      else addToast('error', err?.message || 'Erreur lors de l\'invitation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">Inviter un co-manager</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Numéro de téléphone</label>
            <div className="flex gap-2">
              <div className="relative">
                <select
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  className="h-10 pl-3 pr-8 border border-gray-300 rounded-lg text-sm bg-white appearance-none focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="229">+229 (BJ)</option>
                  <option value="225">+225 (CI)</option>
                  <option value="221">+221 (SN)</option>
                  <option value="228">+228 (TG)</option>
                  <option value="237">+237 (CM)</option>
                  <option value="33">+33 (FR)</option>
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="0198765432"
                required
                className="flex-1 h-10 px-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Rôle</label>
            <div className="grid grid-cols-2 gap-3">
              {(['MANAGER', 'READONLY'] as const).map((r) => {
                const cfg = ROLE_CONFIG[r];
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className={`flex items-center gap-2 p-3 border-2 rounded-xl text-sm font-medium transition-all ${
                      role === r
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    {cfg.icon}
                    {cfg.label}
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {role === 'MANAGER'
                ? 'Peut modifier le voyage, gérer les réservations et uploader des images.'
                : 'Accès lecture seule — peut voir le voyage, les voyageurs et les messages.'}
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading || !phoneNumber.trim()}
              className="flex-1 py-2.5 bg-primary-500 text-white rounded-xl font-medium hover:bg-primary-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
              Inviter
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Modal Changer rôle ────────────────────────────────────────────────────

interface ChangeRoleModalProps {
  tripId: string;
  manager: TripManager;
  onClose: () => void;
  onSuccess: (managers: TripManager[]) => void;
  addToast: (type: 'success' | 'error', msg: string) => void;
}

function ChangeRoleModal({ tripId, manager, onClose, onSuccess, addToast }: ChangeRoleModalProps) {
  const [role, setRole] = useState<'MANAGER' | 'READONLY'>(
    manager.role === 'OWNER' ? 'MANAGER' : manager.role
  );
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const managers = await updateManagerRole(tripId, manager.userId, role);
      onSuccess(managers);
      addToast('success', 'Rôle mis à jour');
      onClose();
    } catch (err: any) {
      const code = err?.code || '';
      if (code === 'CANNOT_DEMOTE_OWNER') addToast('error', 'Impossible de déclasser l\'OWNER — utilisez "Transférer ownership"');
      else addToast('error', err?.message || 'Erreur lors de la mise à jour');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">Changer le rôle</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-500" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <p className="text-sm text-gray-600">
            Modifier le rôle de <span className="font-semibold">{manager.name || manager.userId}</span>
          </p>
          <div className="grid grid-cols-2 gap-3">
            {(['MANAGER', 'READONLY'] as const).map((r) => {
              const cfg = ROLE_CONFIG[r];
              return (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={`flex items-center gap-2 p-3 border-2 rounded-xl text-sm font-medium transition-all ${
                    role === r
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {cfg.icon}
                  {cfg.label}
                </button>
              );
            })}
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50">Annuler</button>
            <button type="submit" disabled={loading} className="flex-1 py-2.5 bg-primary-500 text-white rounded-xl font-medium hover:bg-primary-600 disabled:opacity-50 flex items-center justify-center gap-2">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Confirmer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Modal Confirmer suppression / transfert ───────────────────────────────

interface ConfirmModalProps {
  title: string;
  message: string;
  confirmLabel: string;
  confirmClass?: string;
  onConfirm: () => void;
  onClose: () => void;
  loading?: boolean;
}

function ConfirmModal({ title, message, confirmLabel, confirmClass = 'bg-red-500 hover:bg-red-600', onConfirm, onClose, loading }: ConfirmModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
        <div className="p-6">
          <div className="flex items-start gap-3 mb-4">
            <div className="p-2 bg-red-100 rounded-full flex-shrink-0">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">{title}</h2>
              <p className="text-sm text-gray-600 mt-1">{message}</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-2.5 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50">Annuler</button>
            <button onClick={onConfirm} disabled={loading} className={`flex-1 py-2.5 text-white rounded-xl font-medium disabled:opacity-50 flex items-center justify-center gap-2 ${confirmClass}`}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Page principale ───────────────────────────────────────────────────────

export const TripManagers: React.FC<TripManagersProps> = ({ tripId, onBack }) => {
  const { user } = useAuth();
  const { toasts, addToast, removeToast } = useToast();

  const [managers, setManagers] = useState<TripManager[]>([]);
  const [tripTitle, setTripTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);

  const [showInvite, setShowInvite] = useState(false);
  const [changeRoleTarget, setChangeRoleTarget] = useState<TripManager | null>(null);
  const [removeTarget, setRemoveTarget] = useState<TripManager | null>(null);
  const [transferTarget, setTransferTarget] = useState<TripManager | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const currentUserId = user?.id || (user as any)?._id || '';
  const myEntry = managers.find((m) => m.userId === currentUserId);
  const myRole: TripManagerRole = myEntry?.role || 'READONLY';
  const isOwner = myRole === 'OWNER';

  const load = async () => {
    setLoading(true);
    try {
      const [mgs, trip] = await Promise.all([
        getTripManagers(tripId),
        getPartnerVoyageById(tripId).catch(() => null),
      ]);
      setManagers(mgs);
      if (trip) setTripTitle(trip.titre || trip.destination || '');
    } catch (err: any) {
      const code = err?.code || '';
      if (code === 'TRIP_FORBIDDEN' || err?.status === 403) {
        setForbidden(true);
      } else {
        addToast('error', err?.message || 'Erreur lors du chargement');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [tripId]);

  const handleRemove = async () => {
    if (!removeTarget) return;
    setActionLoading(true);
    try {
      const mgs = await removeManager(tripId, removeTarget.userId);
      setManagers(mgs);
      addToast('success', 'Manager retiré');
    } catch (err: any) {
      const code = err?.code || '';
      if (code === 'CANNOT_REMOVE_OWNER') addToast('error', 'Impossible de retirer le propriétaire — transférez d\'abord l\'ownership');
      else addToast('error', err?.message || 'Erreur');
    } finally {
      setActionLoading(false);
      setRemoveTarget(null);
    }
  };

  const handleTransfer = async () => {
    if (!transferTarget) return;
    setActionLoading(true);
    try {
      const mgs = await transferOwnership(tripId, transferTarget.userId);
      setManagers(mgs);
      addToast('success', 'Ownership transféré — vous êtes maintenant MANAGER');
    } catch (err: any) {
      const code = err?.code || '';
      if (code === 'TARGET_NOT_MANAGER') addToast('error', 'La cible doit déjà être manager de ce voyage');
      else if (code === 'SELF_TRANSFER') addToast('error', 'Vous ne pouvez pas vous transférer l\'ownership');
      else addToast('error', err?.message || 'Erreur');
    } finally {
      setActionLoading(false);
      setTransferTarget(null);
    }
  };

  // ─── Écran de chargement ───────────────────────────────────────────────

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  // ─── Accès refusé (403 TRIP_FORBIDDEN) ────────────────────────────────

  if (forbidden) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-64 text-center">
        <div className="p-4 bg-red-100 rounded-full mb-4">
          <AlertTriangle className="w-10 h-10 text-red-500" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Accès refusé</h2>
        <p className="text-gray-500 mb-6">Vous n'avez pas les droits pour gérer ce voyage.</p>
        <button onClick={onBack} className="px-6 py-2.5 bg-primary-500 text-white rounded-xl font-medium hover:bg-primary-600">
          Retour
        </button>
      </div>
    );
  }

  // ─── Accès uniquement OWNER ────────────────────────────────────────────

  if (!isOwner) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-64 text-center">
        <div className="p-4 bg-amber-100 rounded-full mb-4">
          <Crown className="w-10 h-10 text-amber-500" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Réservé au propriétaire</h2>
        <p className="text-gray-500 mb-2">
          Votre rôle sur ce voyage est <RoleBadge role={myRole} />.
        </p>
        <p className="text-gray-500 mb-6">Seul le propriétaire peut gérer les co-managers.</p>
        <button onClick={onBack} className="px-6 py-2.5 bg-primary-500 text-white rounded-xl font-medium hover:bg-primary-600">
          Retour
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto">
      <ToastContainer toasts={toasts} onClose={removeToast} />

      {/* Modals */}
      {showInvite && (
        <InviteModal
          tripId={tripId}
          onClose={() => setShowInvite(false)}
          onSuccess={setManagers}
          addToast={addToast}
        />
      )}
      {changeRoleTarget && (
        <ChangeRoleModal
          tripId={tripId}
          manager={changeRoleTarget}
          onClose={() => setChangeRoleTarget(null)}
          onSuccess={setManagers}
          addToast={addToast}
        />
      )}
      {removeTarget && (
        <ConfirmModal
          title="Retirer ce manager ?"
          message={`${removeTarget.name || removeTarget.userId} perdra l'accès à ce voyage.`}
          confirmLabel="Retirer"
          loading={actionLoading}
          onConfirm={handleRemove}
          onClose={() => setRemoveTarget(null)}
        />
      )}
      {transferTarget && (
        <ConfirmModal
          title="Transférer l'ownership ?"
          message={`${transferTarget.name || transferTarget.userId} deviendra le nouveau propriétaire. Vous passerez MANAGER.`}
          confirmLabel="Transférer"
          confirmClass="bg-amber-500 hover:bg-amber-600"
          loading={actionLoading}
          onConfirm={handleTransfer}
          onClose={() => setTransferTarget(null)}
        />
      )}

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={onBack}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Co-managers</h1>
          {tripTitle && <p className="text-sm text-gray-500">{tripTitle}</p>}
        </div>
        <button
          onClick={load}
          className="ml-auto p-2 hover:bg-gray-100 rounded-lg transition-colors"
          title="Actualiser"
        >
          <RefreshCw className="w-4 h-4 text-gray-500" />
        </button>
      </div>

      {/* Card */}
      <div className="bg-white rounded-2xl shadow-card border border-gray-100 overflow-hidden">

        {/* Toolbar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <p className="text-sm text-gray-600">
            <span className="font-semibold text-gray-900">{managers.length}</span> membre{managers.length > 1 ? 's' : ''}
          </p>
          <button
            onClick={() => setShowInvite(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500 text-white text-sm font-medium rounded-xl hover:bg-primary-600 transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            Inviter
          </button>
        </div>

        {/* Liste */}
        {managers.length === 0 ? (
          <div className="py-12 text-center text-gray-400">
            <Shield className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>Aucun co-manager pour le moment.</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-50">
            {managers.map((m) => {
              const isMe = m.userId === currentUserId;
              return (
                <li key={m.userId} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors">
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-primary-700 font-bold text-sm uppercase">
                      {(m.name || m.userId).slice(0, 2)}
                    </span>
                  </div>

                  {/* Infos */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-gray-900 truncate">
                        {m.name || m.userId}
                        {isMe && <span className="text-gray-400 font-normal ml-1">(vous)</span>}
                      </span>
                      <RoleBadge role={m.role} />
                    </div>
                    {m.addedAt && (
                      <p className="text-xs text-gray-400 mt-0.5">
                        Ajouté le {new Date(m.addedAt).toLocaleDateString('fr-FR')}
                      </p>
                    )}
                  </div>

                  {/* Actions (OWNER only, pas sur soi-même) */}
                  {isOwner && !isMe && (
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {m.role !== 'OWNER' && (
                        <button
                          onClick={() => setChangeRoleTarget(m)}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Changer le rôle"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      )}
                      {m.role !== 'OWNER' && (
                        <button
                          onClick={() => setTransferTarget(m)}
                          className="p-2 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                          title="Transférer l'ownership"
                        >
                          <Crown className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => setRemoveTarget(m)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Retirer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Info box */}
      <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-100">
        <p className="text-xs text-blue-700 leading-relaxed">
          <strong>MANAGER</strong> — peut modifier le voyage, uploader des images et gérer les réservations.<br />
          <strong>READONLY</strong> — accès lecture seule (voyageurs, messages, statistiques).<br />
          Les invitations sont envoyées par SMS via le numéro de téléphone.
        </p>
      </div>
    </div>
  );
};

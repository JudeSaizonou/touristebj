import React, { useEffect, useState } from 'react';
import { X, UserPlus, Crown, Shield, Eye, Loader2, Trash2, ArrowUpRight } from 'lucide-react';
import * as tripsApi from '../api/trips';
import type { MappedTripManager, TripManagerRole } from '../api/trips';
import { getTripManagerErrorMessage } from '../lib/tripManagerErrors';

interface TripManagersModalProps {
  isOpen: boolean;
  tripId: string;
  tripTitle: string;
  currentUserId: string;
  onClose: () => void;
  onToast: (type: 'success' | 'error' | 'info', message: string) => void;
}

type Tab = 'list' | 'invite';

const ROLE_LABEL: Record<TripManagerRole, string> = {
  OWNER: 'Propriétaire',
  MANAGER: 'Gestionnaire',
  READONLY: 'Lecture seule',
};

const RoleIcon: React.FC<{ role: TripManagerRole; className?: string }> = ({ role, className = 'w-4 h-4' }) => {
  if (role === 'OWNER') return <Crown className={`${className} text-amber-500`} />;
  if (role === 'MANAGER') return <Shield className={`${className} text-primary-500`} />;
  return <Eye className={`${className} text-gray-500`} />;
};

export const TripManagersModal: React.FC<TripManagersModalProps> = ({
  isOpen,
  tripId,
  tripTitle,
  currentUserId,
  onClose,
  onToast,
}) => {
  const [tab, setTab] = useState<Tab>('list');
  const [loading, setLoading] = useState(false);
  const [managers, setManagers] = useState<MappedTripManager[]>([]);
  const [rowBusy, setRowBusy] = useState<string | null>(null);

  const [inviteCountry, setInviteCountry] = useState('229');
  const [invitePhone, setInvitePhone] = useState('');
  const [inviteRole, setInviteRole] = useState<'MANAGER' | 'READONLY'>('MANAGER');
  const [inviting, setInviting] = useState(false);

  const [transferTarget, setTransferTarget] = useState<string | null>(null);
  const [transferring, setTransferring] = useState(false);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      return () => document.removeEventListener('keydown', handleEsc);
    }
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) loadManagers();
  }, [isOpen, tripId]);

  async function loadManagers() {
    setLoading(true);
    try {
      const res = await tripsApi.getTripManagers(tripId);
      setManagers(res.managers);
    } catch (e) {
      onToast('error', getTripManagerErrorMessage(e, 'Erreur chargement des managers'));
    } finally {
      setLoading(false);
    }
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    const national = invitePhone.replace(/\D/g, '');
    if (!national) {
      onToast('error', 'Numéro de téléphone requis');
      return;
    }
    setInviting(true);
    try {
      await tripsApi.inviteTripManager(tripId, {
        countryCode: inviteCountry.replace(/\D/g, ''),
        phoneNumber: national,
        role: inviteRole,
      });
      onToast('success', 'Invitation envoyée par SMS');
      setInvitePhone('');
      setTab('list');
      await loadManagers();
    } catch (e) {
      onToast('error', getTripManagerErrorMessage(e, 'Erreur envoi invitation'));
    } finally {
      setInviting(false);
    }
  }

  async function handleRoleChange(userId: string, newRole: 'MANAGER' | 'READONLY') {
    setRowBusy(userId);
    try {
      await tripsApi.updateTripManagerRole(tripId, userId, newRole);
      onToast('success', 'Rôle mis à jour');
      await loadManagers();
    } catch (e) {
      onToast('error', getTripManagerErrorMessage(e, 'Erreur mise à jour du rôle'));
    } finally {
      setRowBusy(null);
    }
  }

  async function handleRemove(userId: string) {
    if (!window.confirm('Retirer ce manager du voyage ?')) return;
    setRowBusy(userId);
    try {
      await tripsApi.removeTripManager(tripId, userId);
      onToast('success', 'Manager retiré');
      await loadManagers();
    } catch (e) {
      onToast('error', getTripManagerErrorMessage(e, 'Erreur suppression'));
    } finally {
      setRowBusy(null);
    }
  }

  async function handleTransfer() {
    if (!transferTarget) return;
    setTransferring(true);
    try {
      await tripsApi.transferTripOwnership(tripId, transferTarget);
      onToast('success', 'Ownership transféré');
      setTransferTarget(null);
      await loadManagers();
    } catch (e) {
      onToast('error', getTripManagerErrorMessage(e, 'Erreur transfert'));
    } finally {
      setTransferring(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Gérer les co-managers</h3>
            <p className="text-xs text-gray-500 mt-0.5 truncate max-w-[360px]">{tripTitle}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 px-5">
          <button
            onClick={() => setTab('list')}
            className={`px-3 py-3 text-sm font-semibold transition-colors ${
              tab === 'list' ? 'text-primary-600 border-b-2 border-primary-600' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Managers ({managers.length})
          </button>
          <button
            onClick={() => setTab('invite')}
            className={`px-3 py-3 text-sm font-semibold transition-colors ${
              tab === 'invite' ? 'text-primary-600 border-b-2 border-primary-600' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Inviter
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {tab === 'list' && (
            <>
              {loading ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
                </div>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {managers.map(m => {
                    const isSelf = m.userId === currentUserId;
                    const isOwner = m.role === 'OWNER';
                    const busy = rowBusy === m.userId;
                    return (
                      <li key={m.userId} className="py-3 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                          <RoleIcon role={m.role} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">
                            {m.name} {isSelf && <span className="text-xs text-gray-400 font-normal">(vous)</span>}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {m.phoneNumber} • {ROLE_LABEL[m.role]}
                          </p>
                        </div>
                        {isOwner ? (
                          <span className="text-xs px-2 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                            OWNER
                          </span>
                        ) : (
                          <div className="flex items-center gap-1">
                            <select
                              value={m.role}
                              disabled={busy}
                              onChange={(e) => handleRoleChange(m.userId, e.target.value as 'MANAGER' | 'READONLY')}
                              className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-500"
                            >
                              <option value="MANAGER">MANAGER</option>
                              <option value="READONLY">READONLY</option>
                            </select>
                            <button
                              type="button"
                              onClick={() => setTransferTarget(m.userId)}
                              disabled={busy}
                              title="Transférer l'ownership"
                              className="p-2 text-gray-500 hover:bg-amber-50 hover:text-amber-600 rounded-lg transition-colors disabled:opacity-50"
                            >
                              <ArrowUpRight className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemove(m.userId)}
                              disabled={busy}
                              title="Retirer"
                              className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                            >
                              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                            </button>
                          </div>
                        )}
                      </li>
                    );
                  })}
                  {!managers.length && (
                    <li className="py-10 text-center text-sm text-gray-500">Aucun manager.</li>
                  )}
                </ul>
              )}
            </>
          )}

          {tab === 'invite' && (
            <form onSubmit={handleInvite} className="space-y-4">
              <p className="text-sm text-gray-600">
                L'invité recevra un SMS pour accepter depuis l'app Zepargn. Le numéro peut être inconnu de Zepargn — l'invitation sera valable après son inscription.
              </p>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Indicatif</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={inviteCountry}
                    onChange={(e) => setInviteCountry(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    placeholder="229"
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Numéro</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={invitePhone}
                    onChange={(e) => setInvitePhone(e.target.value.replace(/\D/g, '').slice(0, 15))}
                    placeholder="0198765432"
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Rôle</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as 'MANAGER' | 'READONLY')}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="MANAGER">MANAGER — édite et traite les bookings</option>
                  <option value="READONLY">READONLY — lecture seule</option>
                </select>
                <p className="text-[11px] text-gray-400 mt-1">
                  Pour désigner un nouveau propriétaire, utilisez le bouton <span className="inline-flex items-center gap-0.5"><ArrowUpRight className="w-3 h-3" /> Transférer</span> dans la liste.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setTab('list')}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={inviting}
                  className="px-4 py-2 text-sm font-semibold text-white bg-primary-500 hover:bg-primary-600 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {inviting ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                  Envoyer l'invitation
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Transfer confirm overlay */}
        {transferTarget && (
          <div className="absolute inset-0 bg-white/95 backdrop-blur-sm flex items-center justify-center p-6 rounded-2xl">
            <div className="max-w-sm text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mx-auto">
                <Crown className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Transférer l'ownership ?</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Vous deviendrez MANAGER et le manager sélectionné deviendra OWNER. Vous perdrez les droits : suppression d'un voyage actif, gestion des managers, payouts.
                </p>
              </div>
              <div className="flex justify-center gap-2">
                <button
                  disabled={transferring}
                  onClick={() => setTransferTarget(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
                >
                  Annuler
                </button>
                <button
                  disabled={transferring}
                  onClick={handleTransfer}
                  className="px-4 py-2 text-sm font-semibold text-white bg-amber-500 hover:bg-amber-600 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {transferring && <Loader2 className="w-4 h-4 animate-spin" />}
                  Transférer
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};


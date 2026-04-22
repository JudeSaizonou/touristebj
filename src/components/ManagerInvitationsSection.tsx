import React, { useEffect, useState } from 'react';
import { Briefcase, Calendar, Check, Loader2, MapPin, X } from 'lucide-react';
import * as tripsApi from '../api/trips';
import type { MappedTripManagerInvitation, TripManagerRole } from '../api/trips';
import { getTripManagerErrorMessage } from '../lib/tripManagerErrors';

interface Props {
  onToast: (type: 'success' | 'error' | 'info', message: string) => void;
}

const ROLE_BADGE: Record<TripManagerRole, string> = {
  OWNER: 'bg-amber-50 text-amber-700 border-amber-200',
  MANAGER: 'bg-primary-50 text-primary-700 border-primary-200',
  READONLY: 'bg-gray-100 text-gray-700 border-gray-200',
};

function daysUntil(iso?: string): number | null {
  if (!iso) return null;
  const diff = new Date(iso).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / 86400000));
}

export const ManagerInvitationsSection: React.FC<Props> = ({ onToast }) => {
  const [invites, setInvites] = useState<MappedTripManagerInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const list = await tripsApi.getTripManagerInvitations();
      setInvites(list.filter(i => i.status === 'pending'));
    } catch {
      // Silent — endpoint may not be deployed yet
      setInvites([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleAccept(inv: MappedTripManagerInvitation) {
    setBusyId(inv.id);
    try {
      await tripsApi.acceptTripManagerInvitation(inv.token);
      onToast('success', `Vous êtes maintenant ${inv.role} sur "${inv.trip.title}"`);
      await load();
    } catch (e) {
      onToast('error', getTripManagerErrorMessage(e, 'Erreur acceptation'));
    } finally {
      setBusyId(null);
    }
  }

  async function handleDecline(inv: MappedTripManagerInvitation) {
    setBusyId(inv.id);
    try {
      await tripsApi.declineTripManagerInvitation(inv.token);
      onToast('info', 'Invitation refusée');
      await load();
    } catch (e) {
      onToast('error', getTripManagerErrorMessage(e, 'Erreur refus'));
    } finally {
      setBusyId(null);
    }
  }

  if (loading || invites.length === 0) return null;

  return (
    <div className="mb-8">
      <h2 className="font-playfair font-bold text-dark-800 text-lg mb-4 flex items-center gap-2">
        <Briefcase className="w-5 h-5 text-primary-500" /> Invitations de co-gestion
      </h2>
      <div className="space-y-3">
        {invites.map(inv => {
          const daysLeft = daysUntil(inv.expiresAt);
          const busy = busyId === inv.id;
          return (
            <div key={inv.id} className="bg-white rounded-2xl border border-primary-200 overflow-hidden hover:shadow-md transition-all">
              <div className="flex flex-col sm:flex-row">
                {inv.trip.image && (
                  <div className="sm:w-32 h-24 sm:h-auto overflow-hidden flex-shrink-0">
                    <img src={inv.trip.image} alt={inv.trip.title} className="w-full h-full object-cover" loading="lazy" />
                  </div>
                )}
                <div className="flex-1 p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-playfair font-bold text-dark-800 text-base truncate">{inv.trip.title}</p>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${ROLE_BADGE[inv.role]}`}>
                        {inv.role}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-dark-800/50 flex-wrap">
                      {inv.trip.destination && (
                        <span className="flex items-center gap-1"><MapPin className="w-3 h-3 text-primary-500" />{inv.trip.destination}</span>
                      )}
                      {inv.trip.departureDate && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(inv.trip.departureDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-dark-800/50 mt-1">
                      Invité par <strong>{inv.invitedByName}</strong>
                      {daysLeft !== null && (
                        <span className="ml-2">• Expire dans {daysLeft} jour{daysLeft > 1 ? 's' : ''}</span>
                      )}
                    </p>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleDecline(inv)}
                      disabled={busy}
                      className="flex items-center justify-center gap-1.5 px-3 py-2.5 border border-gray-200 text-dark-800 rounded-xl hover:bg-gray-50 transition-colors font-medium text-sm disabled:opacity-50"
                    >
                      <X className="w-4 h-4" /> Refuser
                    </button>
                    <button
                      onClick={() => handleAccept(inv)}
                      disabled={busy}
                      className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-colors font-semibold text-sm disabled:opacity-50"
                    >
                      {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                      Accepter
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

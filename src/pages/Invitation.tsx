import React, { useState, useEffect } from 'react';
import { PublicLayout } from '../components/PublicLayout';
import { SEO } from '../components/SEO';
import { useAuth } from '../context/AuthContext';
import { getInvitationByToken, acceptInvitation } from '../api/trips';
import type { MappedInvitation } from '../api/trips';
import {
  MapPin, Calendar, Loader2, CheckCircle, AlertCircle, UserPlus, CreditCard, Users,
} from 'lucide-react';

import type { AuthMode } from './Auth';

interface InvitationPageProps {
  token: string;
  onOpenAuth?: (mode: AuthMode) => void;
  onMesVoyages?: () => void;
  onBack: () => void;
}

export const InvitationPage: React.FC<InvitationPageProps> = ({
  token,
  onOpenAuth,
  onMesVoyages,
  onBack,
}) => {
  const { user } = useAuth();
  const [invitation, setInvitation] = useState<MappedInvitation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [accepting, setAccepting] = useState(false);
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const inv = await getInvitationByToken(token);
        if (cancelled) return;
        setInvitation(inv);
        if (inv.status === 'accepted') setAccepted(true);
      } catch (err: any) {
        if (cancelled) return;
        setError(err?.message || 'Invitation introuvable ou expirée.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [token]);

  const handleAccept = async () => {
    setAccepting(true);
    setError('');
    try {
      await acceptInvitation(token);
      setAccepted(true);
    } catch (err: any) {
      setError(err?.message || "Erreur lors de l'acceptation.");
    } finally {
      setAccepting(false);
    }
  };

  const fmtPrice = (v: number) => v.toLocaleString('fr-FR').replace(/\s/g, '.') + ' FCFA';

  const trip = invitation?.trip;
  const isPaid = invitation?.paymentMode === 'pay_all';

  return (
    <PublicLayout onOpenAuth={onOpenAuth} onMesVoyages={onMesVoyages}>
      <SEO title="Invitation voyage" noindex />

      <div className="min-h-screen bg-gray-50 pt-20 pb-12 px-4">
        <div className="max-w-lg mx-auto">
          {loading && (
            <div className="flex flex-col items-center gap-4 py-20">
              <Loader2 className="w-10 h-10 text-primary-500 animate-spin" />
              <p className="text-dark-800/60">Chargement de l'invitation...</p>
            </div>
          )}

          {!loading && error && !invitation && (
            <div className="bg-white rounded-2xl shadow-lg p-8 text-center space-y-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                <AlertCircle className="w-8 h-8 text-red-500" />
              </div>
              <p className="font-playfair font-bold text-dark-800 text-xl">Invitation invalide</p>
              <p className="text-sm text-dark-800/60">{error}</p>
              <button
                onClick={onBack}
                className="px-6 py-3 bg-primary-500 text-white rounded-xl font-semibold hover:bg-primary-600 transition-colors"
              >
                Voir les voyages
              </button>
            </div>
          )}

          {!loading && invitation && (
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              {/* Trip image */}
              {trip?.images?.[0] && (
                <div className="h-40 sm:h-48 overflow-hidden">
                  <img src={trip.images[0]} alt={trip.title} className="w-full h-full object-cover" loading="lazy" />
                </div>
              )}

              <div className="p-6 space-y-5">
                {/* Invited by */}
                <div className="bg-primary-50 border border-primary-200 rounded-xl p-4 text-center">
                  <p className="text-sm text-primary-700">
                    <strong>{invitation.invitedBy?.username || 'Quelqu\'un'}</strong> vous invite à rejoindre ce voyage
                  </p>
                </div>

                {/* Trip info */}
                <div>
                  <h1 className="font-playfair font-bold text-dark-800 text-2xl">{trip?.title}</h1>
                  <div className="flex flex-wrap gap-3 mt-2 text-sm text-dark-800/60">
                    {trip?.destination && (
                      <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {trip.destination}</span>
                    )}
                    {trip?.departureDate && (
                      <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> {trip.departureDate}</span>
                    )}
                  </div>
                </div>

                {/* Payment info */}
                <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-dark-800/60">Prix par personne</span>
                    <span className="font-semibold text-dark-800">{fmtPrice(trip?.totalPrice ?? 0)}</span>
                  </div>
                  {isPaid ? (
                    <div className="flex items-center gap-2 text-green-600 text-sm font-semibold pt-1">
                      <CheckCircle className="w-4 h-4" />
                      Votre place est déjà payée !
                    </div>
                  ) : (
                    <div className="flex justify-between text-sm">
                      <span className="text-dark-800/60">Acompte à payer (30%)</span>
                      <span className="font-bold text-primary-500">{fmtPrice(trip?.depositAmount ?? 0)}</span>
                    </div>
                  )}
                </div>

                {/* Status & Actions */}
                {accepted ? (
                  <div className="space-y-4">
                    <div className="flex flex-col items-center gap-3 text-center py-4">
                      <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center">
                        <CheckCircle className="w-7 h-7 text-green-500" />
                      </div>
                      <div>
                        <p className="font-playfair font-bold text-dark-800 text-lg">Invitation acceptée !</p>
                        <p className="text-sm text-dark-800/60 mt-1">
                          {isPaid
                            ? 'Votre place est confirmée. Rendez-vous dans "Mes Voyages" pour les détails.'
                            : 'Rendez-vous dans "Mes Voyages" pour payer votre acompte et confirmer votre place.'}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={onMesVoyages}
                      className="w-full py-3.5 bg-primary-500 text-white rounded-xl font-semibold hover:bg-primary-600 transition-colors"
                    >
                      Voir mes voyages
                    </button>
                  </div>
                ) : invitation.status === 'expired' ? (
                  <div className="text-center py-4">
                    <p className="text-sm text-red-500 font-medium">Cette invitation a expiré.</p>
                    <button
                      onClick={onBack}
                      className="mt-4 px-6 py-3 bg-primary-500 text-white rounded-xl font-semibold hover:bg-primary-600 transition-colors"
                    >
                      Découvrir nos voyages
                    </button>
                  </div>
                ) : !user ? (
                  <div className="space-y-3">
                    <p className="text-sm text-dark-800/60 text-center">
                      Créez un compte ou connectez-vous pour accepter cette invitation.
                    </p>
                    <button
                      onClick={() => onOpenAuth?.('inscription')}
                      className="w-full py-3.5 bg-primary-500 text-white rounded-xl font-semibold hover:bg-primary-600 transition-colors flex items-center justify-center gap-2"
                    >
                      <UserPlus className="w-4 h-4" /> Créer un compte
                    </button>
                    <button
                      onClick={() => onOpenAuth?.('connexion')}
                      className="w-full py-2.5 border border-gray-200 text-dark-800/70 rounded-xl font-medium text-sm hover:bg-gray-50 transition-colors"
                    >
                      J'ai déjà un compte — Me connecter
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {error && (
                      <p className="text-sm text-red-500 flex items-center gap-1.5">
                        <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
                      </p>
                    )}
                    <button
                      onClick={handleAccept}
                      disabled={accepting}
                      className="w-full py-3.5 bg-primary-500 text-white rounded-xl font-semibold hover:bg-primary-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {accepting ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /> Acceptation...</>
                      ) : isPaid ? (
                        <><CheckCircle className="w-4 h-4" /> Accepter l'invitation</>
                      ) : (
                        <><CreditCard className="w-4 h-4" /> Accepter et payer mon acompte</>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </PublicLayout>
  );
};

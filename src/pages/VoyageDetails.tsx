import React, { useState, useEffect } from 'react';
import { PublicLayout } from '../components/PublicLayout';
import { ToastContainer, useToast } from '../components/Toast';
import { ReservationModal } from '../components/ReservationModal';
import { getVoyageById } from '../api/trips';
import { useAuth } from '../context/AuthContext';
import {
  MapPin, Clock, Users, Calendar,
  Check, X, ChevronDown, Globe, Loader2
} from 'lucide-react';

import type { AuthMode } from './Auth';

interface VoyageDetailsProps {
  voyageId: string;
  onBack: () => void;
  onAdminLogin?: () => void;
  onOpenAuth?: (mode: AuthMode) => void;
  onMesVoyages?: () => void;
  onLogout?: () => void;
}

export const VoyageDetails: React.FC<VoyageDetailsProps> = ({
  voyageId,
  onBack,
  onAdminLogin,
  onOpenAuth,
  onMesVoyages,
  onLogout,
}) => {
  const { user } = useAuth();
  const [voyage, setVoyage] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedImage, setSelectedImage] = useState(0);
  const [expandedDay, setExpandedDay] = useState<number | null>(null);
  const [reservationOpen, setReservationOpen] = useState(false);
  const { toasts, addToast, removeToast } = useToast();

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await getVoyageById(voyageId);
        setVoyage(data);
      } catch (err: any) {
        const msg: string = err?.message || '';
        const is401 = msg.toLowerCase().includes('token') || msg.includes('401') || msg.includes('Unauthorized');
        setError(is401 ? 'Connectez-vous pour accéder aux détails de ce voyage.' : msg || 'Impossible de charger ce voyage.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [voyageId]);

  const fmtPrice = (v: number) => v.toLocaleString('fr-FR').replace(/\s/g, '.') + 'FCFA';

  const handleReservationClick = () => {
    if (!user) {
      onOpenAuth?.('connexion');
    } else {
      setReservationOpen(true);
    }
  };

  const handleReservationSuccess = (_bookingId: string) => {
    setReservationOpen(false);
    addToast('success', 'Réservation créée ! Retrouvez-la dans "Mes Voyages".');
    setTimeout(() => onMesVoyages?.(), 1500);
  };

  if (loading) {
    return (
      <PublicLayout onAdminLogin={onAdminLogin} onOpenAuth={onOpenAuth} onMesVoyages={onMesVoyages} onLogout={onLogout}>
        <div className="max-w-7xl mx-auto px-4 py-32 flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-[#1a4d3e] animate-spin" />
          <p className="text-[#17233E]/60">Chargement du voyage...</p>
        </div>
      </PublicLayout>
    );
  }

  if (error || !voyage) {
    const isAuthError = error?.toLowerCase().includes('connectez-vous') || error?.toLowerCase().includes('token');
    return (
      <PublicLayout onAdminLogin={onAdminLogin} onOpenAuth={onOpenAuth} onMesVoyages={onMesVoyages} onLogout={onLogout}>
        <div className="max-w-7xl mx-auto px-4 py-24 text-center">
          <p className={`font-medium mb-6 ${isAuthError ? 'text-[#17233E]' : 'text-red-500'}`}>
            {error || 'Voyage introuvable.'}
          </p>
          <div className="flex gap-3 justify-center">
            {isAuthError && (
              <button
                onClick={() => onOpenAuth?.('connexion')}
                className="px-6 py-2.5 bg-[#FF7F2A] text-white rounded-lg hover:bg-[#e66d1e] transition-colors text-sm font-semibold"
              >
                Se connecter
              </button>
            )}
            <button onClick={onBack} className="px-6 py-2.5 bg-[#1a4d3e] text-white rounded-lg hover:bg-[#153d31] transition-colors text-sm font-medium">
              Retour au catalogue
            </button>
          </div>
        </div>
      </PublicLayout>
    );
  }

  const basePrice = voyage.totalPrice ?? 0;
  const acompte = voyage.depositAmount ?? Math.round(basePrice * 0.5);
  const solde = basePrice - acompte;

  return (
    <PublicLayout onAdminLogin={onAdminLogin} onOpenAuth={onOpenAuth} onMesVoyages={onMesVoyages} onLogout={onLogout}>
      <ToastContainer toasts={toasts} onClose={removeToast} />

      <ReservationModal
        isOpen={reservationOpen}
        voyage={voyage}
        onClose={() => setReservationOpen(false)}
        onSuccess={handleReservationSuccess}
      />

      <div className="bg-white py-10">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="font-playfair text-3xl md:text-4xl font-bold text-[#17233E] mb-8">
            {voyage.destination} {voyage.itineraire?.[0]?.ville ? `– ${voyage.itineraire[0].ville}` : ''}
          </h1>

          {/* Images */}
          <div className="mb-8">
            <div className="rounded-2xl overflow-hidden h-[420px] mb-4">
              <img src={voyage.photos[selectedImage]} alt={voyage.titre} className="w-full h-full object-cover" />
            </div>
            {voyage.photos.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {voyage.photos.map((photo: string, index: number) => (
                  <div
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`w-24 h-20 shrink-0 rounded-lg overflow-hidden cursor-pointer border-2 transition-all ${selectedImage === index ? 'border-[#FF7F2A] shadow-md' : 'border-transparent opacity-60 hover:opacity-100'}`}
                  >
                    <img src={photo} alt="" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* LEFT COLUMN */}
            <div className="lg:col-span-2 space-y-8">
              <div>
                <h2 className="font-playfair text-xl font-bold text-[#17233E] mb-4">Description</h2>
                <div className="text-sm text-[#17233E]/70 leading-relaxed space-y-3">
                  <p>{voyage.description}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                {[
                  { icon: <Clock className="w-4 h-4" />, label: `${voyage.nombreJours || '?'} jours` },
                  { icon: <Users className="w-4 h-4" />, label: `Places : ${voyage.nombrePersonnes}` },
                  { icon: <Calendar className="w-4 h-4" />, label: voyage.dateDebut },
                  { icon: <Users className="w-4 h-4" />, label: `Min Age: ${voyage.minAge}+` },
                  { icon: <MapPin className="w-4 h-4" />, label: 'Pickup : Aéroport' },
                  { icon: <Globe className="w-4 h-4" />, label: 'Langue : Français' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-[#17233E]/70 bg-gray-50 rounded-lg px-3 py-2.5 border border-gray-100">
                    <span className="text-[#FF7F2A]">{item.icon}</span>
                    <span>{item.label}</span>
                  </div>
                ))}
              </div>

              {/* Inclus / Pas inclus */}
              {(voyage.ceQuiEstInclus?.length > 0 || voyage.ceQuiNestPasInclus?.length > 0) && (
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <div className="grid grid-cols-1 md:grid-cols-2">
                    {voyage.ceQuiEstInclus?.length > 0 && (
                      <div className="p-5 border-b md:border-b-0 md:border-r border-gray-200">
                        <h3 className="text-sm font-bold text-[#17233E] mb-3">Ce qui est inclus</h3>
                        <ul className="space-y-2">
                          {voyage.ceQuiEstInclus.map((item: string, index: number) => (
                            <li key={index} className="flex items-start gap-2 text-xs text-[#17233E]/70">
                              <Check className="w-3.5 h-3.5 text-green-500 flex-shrink-0 mt-0.5" />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {voyage.ceQuiNestPasInclus?.length > 0 && (
                      <div className="p-5">
                        <h3 className="text-sm font-bold text-[#17233E] mb-3">Ce qui n'est pas inclus</h3>
                        <ul className="space-y-2">
                          {voyage.ceQuiNestPasInclus.map((item: string, index: number) => (
                            <li key={index} className="flex items-start gap-2 text-xs text-[#17233E]/70">
                              <X className="w-3.5 h-3.5 text-red-400 flex-shrink-0 mt-0.5" />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Politique remboursement */}
              <div>
                <h2 className="font-playfair text-xl font-bold text-[#17233E] mb-4">Politique de remboursement</h2>
                <p className="text-sm text-[#17233E]/70 leading-relaxed">{voyage.politiqueRemboursement}</p>
              </div>

              {/* Itinéraire */}
              {voyage.itineraire?.length > 0 && (
                <div>
                  <h2 className="font-playfair text-xl font-bold text-[#17233E] mb-4">Itinéraire</h2>
                  <div className="space-y-3">
                    {voyage.itineraire.map((day: any) => (
                      <div key={day.jour} className="border border-gray-200 rounded-xl overflow-hidden">
                        <button
                          onClick={() => setExpandedDay(expandedDay === day.jour ? null : day.jour)}
                          className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-[#FF7F2A] text-white rounded-full flex items-center justify-center font-bold text-sm">{day.jour}</div>
                            <div className="text-left">
                              <h4 className="font-semibold text-sm text-[#17233E]">{day.titre}</h4>
                              <p className="text-xs text-[#17233E]/50">{day.ville}</p>
                            </div>
                          </div>
                          <ChevronDown className={`w-4 h-4 text-[#17233E]/40 transition-transform ${expandedDay === day.jour ? 'rotate-180' : ''}`} />
                        </button>
                        {expandedDay === day.jour && (
                          <div className="px-4 pb-4 pt-0">
                            <p className="text-sm text-[#17233E]/70 pl-11">{day.description}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* RIGHT COLUMN - RESERVATION */}
            <div className="lg:col-span-1">
              <div className="md:sticky md:top-20 rounded-2xl overflow-hidden shadow-lg" style={{ backgroundColor: '#17233E' }}>
                <div className="px-6 pt-7 pb-4 text-center">
                  <h3 className="font-playfair text-2xl font-bold text-white">Réservation</h3>
                  <div className="mt-4 border-t border-dashed border-white/20" />
                </div>

                <div className="px-6 pb-7 space-y-5">
                  <div>
                    <p className="text-sm text-white/50 mb-1">Date de départ</p>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-white/70" />
                      <span className="font-playfair text-xl font-bold text-white">{voyage.dateDebut}</span>
                    </div>
                  </div>

                  {voyage.nombreJours > 0 && (
                    <p className="font-playfair text-2xl font-bold text-white">({voyage.nombreJours} Jours)</p>
                  )}

                  {/* Récap prix */}
                  <div className="bg-white rounded-xl p-5 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-[#17233E]/60">Prix par personne</span>
                      <span className="font-bold text-[#17233E]">{fmtPrice(basePrice)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-[#17233E]/60">Acompte (50%)</span>
                      <span className="font-bold text-[#FF7F2A]">{fmtPrice(acompte)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-[#17233E]/60">Solde à épargner</span>
                      <span className="font-bold text-[#17233E]">{fmtPrice(solde)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-[#17233E]/60">Délai paiement</span>
                      <span className="font-bold text-[#17233E]">{voyage.paymentDeadlineDays || 14} jours</span>
                    </div>
                    <div className="border-t border-dashed border-[#17233E]/20" />
                    <div className="flex justify-between items-center">
                      <span className="text-base font-bold text-[#17233E]/50">Total</span>
                      <span className="font-bold text-lg text-[#17233E]">{fmtPrice(basePrice)}</span>
                    </div>
                  </div>

                  <button
                    onClick={handleReservationClick}
                    className="w-full py-3.5 bg-[#FF7F2A] text-white rounded-xl font-semibold text-base hover:bg-[#e66d1e] transition-colors"
                  >
                    {user ? 'Réservez Maintenant' : 'Se connecter pour réserver'}
                  </button>

                  {!user && (
                    <p className="text-center text-xs text-white/50">
                      Vous devez être connecté pour réserver.{' '}
                      <button
                        onClick={() => onOpenAuth?.('inscription')}
                        className="text-[#FF7F2A] hover:underline"
                      >
                        Créer un compte
                      </button>
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA SECTION */}
      <div className="relative py-24 mt-8 overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1600)' }}>
          <div className="absolute inset-0 bg-[#1a4d3e]/90" />
        </div>
        <div className="relative max-w-4xl mx-auto text-center px-4">
          <p className="text-[#FF7F2A] font-semibold mb-3 tracking-wide text-sm uppercase">Love Where You're Going</p>
          <h2 className="font-playfair text-4xl md:text-5xl font-bold mb-4 text-white">
            Explore Ta Vie, <span className="text-[#FF7F2A]">Voyage Là Où Tu</span>
            <br /><span className="text-yellow-400">Souhaites!</span>
          </h2>
        </div>
      </div>

      {/* PARTENAIRES */}
      <div className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-[#FF7F2A] font-semibold mb-3 tracking-wide uppercase text-sm">Nos Partenaires</p>
          <h2 className="font-playfair text-3xl md:text-4xl font-bold text-[#17233E] mb-4">Nos Incroyables Partenaires</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 md:gap-8 items-center">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-gray-50 rounded-lg p-6 h-20 flex items-center justify-center border border-gray-100">
                <div className="text-gray-300 font-bold text-lg tracking-wider">
                  {['ZEPARGN', 'PARTNER', 'TRAVEL', 'AGENCY', 'GROUP'][i]}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PublicLayout>
  );
};

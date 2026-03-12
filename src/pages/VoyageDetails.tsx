import React, { useState, useEffect } from 'react';
import { PublicLayout } from '../components/PublicLayout';
import { ToastContainer, useToast } from '../components/Toast';
import { ReservationModal } from '../components/ReservationModal';
import { getVoyageById } from '../api/trips';
import LogoZepargn from '../assets/LogoZepargn.png';
import { useAuth } from '../context/AuthContext';
import {
  MapPin, Clock, Users, Calendar,
  Check, X, ChevronDown, ChevronLeft, Globe, Loader2, Shield, PiggyBank, ArrowRight
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
        setError(is401 ? 'Connectez-vous pour acceder aux details de ce voyage.' : msg || 'Impossible de charger ce voyage.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [voyageId]);

  const fmtPrice = (v: number) => v.toLocaleString('fr-FR').replace(/\s/g, '.') + ' FCFA';

  const handleReservationClick = () => {
    if (!user) {
      onOpenAuth?.('connexion');
    } else {
      setReservationOpen(true);
    }
  };

  const handleReservationSuccess = (_bookingId: string) => {
    setReservationOpen(false);
    addToast('success', 'Reservation creee ! Retrouvez-la dans "Mes Voyages".');
    setTimeout(() => onMesVoyages?.(), 1500);
  };

  if (loading) {
    return (
      <PublicLayout onAdminLogin={onAdminLogin} onOpenAuth={onOpenAuth} onMesVoyages={onMesVoyages} onLogout={onLogout}>
        <div className="max-w-7xl mx-auto px-4 py-32 flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
          <p className="text-dark-800/40">Chargement du voyage...</p>
        </div>
      </PublicLayout>
    );
  }

  if (error || !voyage) {
    const isAuthError = error?.toLowerCase().includes('connectez-vous') || error?.toLowerCase().includes('token');
    return (
      <PublicLayout onAdminLogin={onAdminLogin} onOpenAuth={onOpenAuth} onMesVoyages={onMesVoyages} onLogout={onLogout}>
        <div className="max-w-7xl mx-auto px-4 py-24 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <MapPin className="w-7 h-7 text-gray-400" />
          </div>
          <p className={`font-medium mb-6 ${isAuthError ? 'text-dark-800' : 'text-red-500'}`}>
            {error || 'Voyage introuvable.'}
          </p>
          <div className="flex gap-3 justify-center">
            {isAuthError && (
              <button
                onClick={() => onOpenAuth?.('connexion')}
                className="px-6 py-2.5 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-colors text-sm font-semibold"
              >
                Se connecter
              </button>
            )}
            <button onClick={onBack} className="px-6 py-2.5 bg-dark-800 text-white rounded-xl hover:bg-dark-700 transition-colors text-sm font-medium">
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

      {/* Breadcrumb */}
      <div className="bg-gray-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
          <button onClick={onBack} className="inline-flex items-center gap-1.5 text-sm text-dark-800/50 hover:text-primary-500 transition-colors font-medium">
            <ChevronLeft className="w-4 h-4" />
            Retour aux voyages
          </button>
        </div>
      </div>

      {/* Hero Image */}
      <div className="relative">
        <div className="h-[400px] md:h-[480px] overflow-hidden">
          <img
            src={voyage.photos?.[selectedImage] || voyage.photos?.[0] || ''}
            alt={voyage.titre}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
        </div>
        {/* Title overlay */}
        <div className="absolute bottom-0 left-0 right-0">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-8">
            <div className="flex items-center gap-2 text-white/80 text-sm mb-2">
              <MapPin className="w-4 h-4" />
              <span>{voyage.pays}</span>
              {voyage.dateDebut && (
                <>
                  <span className="text-white/30">|</span>
                  <Calendar className="w-4 h-4" />
                  <span>{voyage.dateDebut}</span>
                </>
              )}
            </div>
            <h1 className="font-playfair text-3xl md:text-4xl lg:text-5xl font-bold text-white">
              {voyage.titre}
            </h1>
          </div>
        </div>
      </div>

      {/* Thumbnails */}
      {(voyage.photos?.length ?? 0) > 1 && (
        <div className="bg-white border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
            <div className="flex gap-2 overflow-x-auto pb-1">
              {voyage.photos.map((photo: string, index: number) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`w-20 h-14 shrink-0 rounded-lg overflow-hidden border-2 transition-all ${
                    selectedImage === index
                      ? 'border-primary-500 shadow-md ring-2 ring-primary-500/20'
                      : 'border-transparent opacity-50 hover:opacity-80'
                  }`}
                >
                  <img src={photo} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="bg-gray-50 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* Left column */}
            <div className="lg:col-span-2 space-y-8">
              {/* Quick info pills */}
              <div className="flex flex-wrap gap-2">
                {[
                  { icon: <Clock className="w-3.5 h-3.5" />, label: `${voyage.nombreJours || '?'} jours` },
                  { icon: <Users className="w-3.5 h-3.5" />, label: `${voyage.nombrePersonnes} places` },
                  { icon: <Calendar className="w-3.5 h-3.5" />, label: voyage.dateDebut },
                  { icon: <Globe className="w-3.5 h-3.5" />, label: 'Francais' },
                ].map((item, i) => (
                  <span key={i} className="inline-flex items-center gap-1.5 text-xs font-medium text-dark-800/60 bg-white rounded-full px-4 py-2 border border-gray-100">
                    <span className="text-primary-500">{item.icon}</span>
                    {item.label}
                  </span>
                ))}
              </div>

              {/* Description */}
              <div className="bg-white rounded-2xl border border-gray-100 p-6 md:p-8">
                <h2 className="font-playfair text-xl font-bold text-dark-800 mb-4">Description</h2>
                <p className="text-sm text-dark-800/60 leading-relaxed">{voyage.description}</p>
              </div>

              {/* Inclus / Pas inclus */}
              {(voyage.ceQuiEstInclus?.length > 0 || voyage.ceQuiNestPasInclus?.length > 0) && (
                <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                  <div className="grid grid-cols-1 md:grid-cols-2">
                    {voyage.ceQuiEstInclus?.length > 0 && (
                      <div className="p-6 md:p-8 border-b md:border-b-0 md:border-r border-gray-100">
                        <h3 className="flex items-center gap-2 text-sm font-bold text-dark-800 mb-4">
                          <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                            <Check className="w-3.5 h-3.5 text-green-600" />
                          </div>
                          Ce qui est inclus
                        </h3>
                        <ul className="space-y-2.5">
                          {voyage.ceQuiEstInclus.map((item: string, index: number) => (
                            <li key={index} className="flex items-start gap-2 text-sm text-dark-800/60">
                              <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {voyage.ceQuiNestPasInclus?.length > 0 && (
                      <div className="p-6 md:p-8">
                        <h3 className="flex items-center gap-2 text-sm font-bold text-dark-800 mb-4">
                          <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center">
                            <X className="w-3.5 h-3.5 text-red-500" />
                          </div>
                          Non inclus
                        </h3>
                        <ul className="space-y-2.5">
                          {voyage.ceQuiNestPasInclus.map((item: string, index: number) => (
                            <li key={index} className="flex items-start gap-2 text-sm text-dark-800/60">
                              <X className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Itineraire */}
              {voyage.itineraire?.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 p-6 md:p-8">
                  <h2 className="font-playfair text-xl font-bold text-dark-800 mb-6">Itineraire</h2>
                  <div className="space-y-3">
                    {voyage.itineraire.map((day: any) => (
                      <div key={day.jour} className="border border-gray-100 rounded-xl overflow-hidden hover:border-gray-200 transition-colors">
                        <button
                          onClick={() => setExpandedDay(expandedDay === day.jour ? null : day.jour)}
                          className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-primary-600 text-white rounded-xl flex items-center justify-center font-bold text-sm shadow-sm">
                              {day.jour}
                            </div>
                            <div className="text-left">
                              <h4 className="font-semibold text-sm text-dark-800">{day.titre}</h4>
                              <p className="text-xs text-dark-800/40">{day.ville}</p>
                            </div>
                          </div>
                          <ChevronDown className={`w-4 h-4 text-dark-800/30 transition-transform ${expandedDay === day.jour ? 'rotate-180' : ''}`} />
                        </button>
                        {expandedDay === day.jour && (
                          <div className="px-4 pb-4 pt-0">
                            <p className="text-sm text-dark-800/60 pl-12 leading-relaxed">{day.description}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Politique */}
              <div className="bg-white rounded-2xl border border-gray-100 p-6 md:p-8">
                <h2 className="font-playfair text-xl font-bold text-dark-800 mb-4">Politique de remboursement</h2>
                <p className="text-sm text-dark-800/60 leading-relaxed">{voyage.politiqueRemboursement}</p>
              </div>
            </div>

            {/* Right column - Reservation card */}
            <div className="lg:col-span-1">
              <div className="md:sticky md:top-20 space-y-5">
                {/* Price card */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-lg overflow-hidden">
                  <div className="bg-gradient-to-r from-dark-800 to-dark-700 px-6 py-5 text-center">
                    <p className="text-white/50 text-xs uppercase tracking-widest font-semibold mb-1">Prix par personne</p>
                    <p className="font-playfair text-3xl font-bold text-white">{fmtPrice(basePrice)}</p>
                  </div>

                  <div className="p-6 space-y-4">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-dark-800/50">Acompte (50%)</span>
                        <span className="font-bold text-primary-500">{fmtPrice(acompte)}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-dark-800/50">Solde a epargner</span>
                        <span className="font-semibold text-dark-800">{fmtPrice(solde)}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-dark-800/50">Delai paiement</span>
                        <span className="font-semibold text-dark-800">{voyage.paymentDeadlineDays || 14} jours</span>
                      </div>
                    </div>

                    <div className="border-t border-dashed border-gray-200" />

                    <div className="flex justify-between items-center">
                      <span className="font-bold text-dark-800">Total voyage</span>
                      <span className="font-bold text-lg text-dark-800">{fmtPrice(basePrice)}</span>
                    </div>

                    <button
                      onClick={handleReservationClick}
                      className="w-full py-3.5 bg-primary-500 text-white rounded-xl font-semibold text-base hover:bg-primary-600 transition-all hover:shadow-lg hover:shadow-primary-500/25 flex items-center justify-center gap-2"
                    >
                      {user ? 'Reservez Maintenant' : 'Se connecter pour reserver'}
                      <ArrowRight className="w-4 h-4" />
                    </button>

                    {!user && (
                      <p className="text-center text-xs text-dark-800/40">
                        Vous devez etre connecte.{' '}
                        <button onClick={() => onOpenAuth?.('inscription')} className="text-primary-500 hover:underline font-medium">
                          Creer un compte
                        </button>
                      </p>
                    )}
                  </div>
                </div>

                {/* Trust badges */}
                <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
                  {[
                    { icon: <Shield className="w-4 h-4" />, text: 'Paiement 100% securise', color: 'text-green-600 bg-green-50' },
                    { icon: <PiggyBank className="w-4 h-4" />, text: 'Epargne flexible avec ZePargn', color: 'text-forest-700 bg-forest-50' },
                    { icon: <Users className="w-4 h-4" />, text: 'Voyage en groupe organise', color: 'text-primary-600 bg-primary-50' },
                  ].map((item) => (
                    <div key={item.text} className="flex items-center gap-3">
                      <div className={`w-8 h-8 ${item.color} rounded-lg flex items-center justify-center shrink-0`}>
                        {item.icon}
                      </div>
                      <span className="text-xs text-dark-800/60 font-medium">{item.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Partenaires */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <p className="text-primary-500 font-semibold text-sm uppercase tracking-widest mb-2">Confiance</p>
          <h2 className="font-playfair text-2xl md:text-3xl font-bold text-dark-800 mb-8">Nos partenaires</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 max-w-lg mx-auto gap-5">
            <div className="bg-gradient-to-br from-forest-800 to-forest-700 rounded-2xl p-5 flex flex-col items-center justify-center gap-2 shadow-md">
              <img src={LogoZepargn} alt="ZePargn" className="h-10 object-contain brightness-0 invert" />
              <p className="text-white/60 text-xs">Epargne & paiement echelonne</p>
            </div>
            <div className="bg-amber-50 rounded-2xl p-5 flex flex-col items-center justify-center gap-2 border border-amber-200 shadow-md">
              <span className="text-amber-800 font-bold text-lg tracking-wide">Miwakpon</span>
              <p className="text-amber-700 text-xs">Tourisme & decouverte</p>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
};

import React, { useState, useEffect } from 'react';
import { PublicLayout } from '../components/PublicLayout';
import { StorageService } from '../utils/storage';
import { ToastContainer, useToast } from '../components/Toast';
import {
  MapPin, Clock, Users, Calendar,
  Check, X, ChevronDown, Globe
} from 'lucide-react';

interface VoyageDetailsProps {
  voyageId: string;
  onBack: () => void;
  onAdminLogin?: () => void;
}

export const VoyageDetails: React.FC<VoyageDetailsProps> = ({ voyageId, onAdminLogin }) => {
  const [voyage, setVoyage] = useState<any>(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [expandedDay, setExpandedDay] = useState<number | null>(null);
  const { toasts, addToast, removeToast } = useToast();

  const [formData, setFormData] = useState({
    nombrePersonnes: 1,
  });

  useEffect(() => {
    const data = StorageService.getVoyageById(voyageId);
    if (data) {
      setVoyage(data);
    }
  }, [voyageId]);

  if (!voyage) {
    return (
      <PublicLayout onAdminLogin={onAdminLogin}>
        <div className="max-w-7xl mx-auto px-4 py-20 text-center">
          <p className="text-[#17233E]/60">Chargement...</p>
        </div>
      </PublicLayout>
    );
  }

  const basePrice = parseFloat(voyage.prix.replace(/,/g, ''));
  const sousTotal = basePrice * formData.nombrePersonnes;
  const acompte = sousTotal * (voyage.acomptesPourcentage / 100);
  const economisez = Math.round(sousTotal * 0.05);
  const total = sousTotal - economisez;

  const fmtPrice = (v: number) => v.toLocaleString('fr-FR').replace(/\s/g, '.') + 'FCFA';

  const handleReservation = (type: 'reservation' | 'epargne') => {
    const reservation = {
      voyageId: voyage.id,
      voyageDestination: voyage.destination || voyage.titre,
      type,
      nombrePersonnes: formData.nombrePersonnes,
      montantTotal: total,
      acompte,
      statut: 'confirmee',
    };
    StorageService.saveReservation(reservation);
    addToast('success', type === 'reservation'
      ? `Réservation confirmée ! ${formData.nombrePersonnes} personne(s) pour ${fmtPrice(total)}`
      : `Épargne démarrée ! Objectif : ${fmtPrice(total)}`
    );
  };

  return (
    <PublicLayout onAdminLogin={onAdminLogin}>
      <ToastContainer toasts={toasts} onClose={removeToast} />

      {/* CONTENT */}
      <div className="bg-white py-10">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="font-playfair text-3xl md:text-4xl font-bold text-[#17233E] mb-8">
            {voyage.destination} – {voyage.itineraire?.[0]?.ville || voyage.pays}
          </h1>

          {/* Grande image + Thumbnails */}
          <div className="mb-8">
            <div className="rounded-2xl overflow-hidden h-[420px] mb-4">
              <img src={voyage.photos[selectedImage]} alt={voyage.titre} className="w-full h-full object-cover" />
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2">
              {voyage.photos.map((photo: string, index: number) => (
                <div key={index} onClick={() => setSelectedImage(index)} className={`w-24 h-20 shrink-0 rounded-lg overflow-hidden cursor-pointer border-2 transition-all ${selectedImage === index ? 'border-[#FF7F2A] shadow-md' : 'border-transparent opacity-60 hover:opacity-100'}`}>
                  <img src={photo} alt="" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* LEFT COLUMN */}
            <div className="lg:col-span-2 space-y-8">
              <div>
                <h2 className="font-playfair text-xl font-bold text-[#17233E] mb-4">Description</h2>
                <div className="text-sm text-[#17233E]/70 leading-relaxed space-y-3">
                  <p>{voyage.description}</p>
                  {voyage.politiqueRemboursement && <p>{voyage.politiqueRemboursement}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                {[
                  { icon: <Clock className="w-4 h-4" />, label: voyage.nombreJours + ' jours' },
                  { icon: <Users className="w-4 h-4" />, label: 'Places : ' + voyage.nombrePersonnes },
                  { icon: <Calendar className="w-4 h-4" />, label: voyage.dateDebut },
                  { icon: <Users className="w-4 h-4" />, label: 'Min Age: ' + voyage.minAge + '+' },
                  { icon: <MapPin className="w-4 h-4" />, label: 'Pickup : Aéroport' },
                  { icon: <Globe className="w-4 h-4" />, label: 'Langue : Français' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-[#17233E]/70 bg-gray-50 rounded-lg px-3 py-2.5 border border-gray-100">
                    <span className="text-[#FF7F2A]">{item.icon}</span>
                    <span>{item.label}</span>
                  </div>
                ))}
              </div>

              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <div className="grid grid-cols-1 md:grid-cols-2">
                  <div className="p-4 border-b md:border-r border-gray-200">
                    <p className="text-xs font-semibold text-[#17233E] mb-1">Departure & Return Location</p>
                    <p className="text-xs text-[#17233E]/60">John F.k. International Airport</p>
                  </div>
                  <div className="p-4 border-b border-gray-200">
                    <p className="text-xs font-semibold text-[#17233E] mb-1">Bedrooms</p>
                    <p className="text-xs text-[#17233E]/60">{voyage.bedrooms} Bedrooms</p>
                  </div>
                  <div className="p-4 border-r border-gray-200">
                    <p className="text-xs font-semibold text-[#17233E] mb-1">Departure Time</p>
                    <p className="text-xs text-[#17233E]/60">{voyage.departureTime || '10:00 AM'}</p>
                  </div>
                  <div className="p-4">
                    <p className="text-xs font-semibold text-[#17233E] mb-1">Return Time</p>
                    <p className="text-xs text-[#17233E]/60">{voyage.returnTime || '8:00 PM'}</p>
                  </div>
                </div>
              </div>

              {/* Inclus / Pas inclus */}
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <div className="grid grid-cols-1 md:grid-cols-2">
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
                </div>
              </div>

              {/* Politique remboursement */}
              <div>
                <h2 className="font-playfair text-xl font-bold text-[#17233E] mb-4">Politique de remboursement</h2>
                <p className="text-sm text-[#17233E]/70 leading-relaxed">{voyage.politiqueRemboursement}</p>
              </div>

              {/* Itinéraire */}
              {voyage.itineraire && voyage.itineraire.length > 0 && (
                <div>
                  <h2 className="font-playfair text-xl font-bold text-[#17233E] mb-4">Itinéraire</h2>
                  <div className="space-y-3">
                    {voyage.itineraire.map((day: any) => (
                      <div key={day.jour} className="border border-gray-200 rounded-xl overflow-hidden">
                        <button onClick={() => setExpandedDay(expandedDay === day.jour ? null : day.jour)} className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
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
                    <p className="text-sm text-white/50 mb-1">Vos dates</p>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-white/70" />
                      <span className="font-playfair text-xl font-bold text-white">{voyage.dateDebut}</span>
                    </div>
                  </div>

                  <p className="font-playfair text-2xl font-bold text-white">({voyage.nombreJours} Jours)</p>

                  <div>
                    <p className="text-base font-semibold text-white mb-2">Nombre de personnes</p>
                    <select
                      value={formData.nombrePersonnes}
                      onChange={(e) => setFormData({ ...formData, nombrePersonnes: parseInt(e.target.value) })}
                      className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#FF7F2A]/50 focus:border-[#FF7F2A] appearance-none"
                      style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23ffffff80' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 16px center' }}
                    >
                      {[...Array(10)].map((_, i) => (
                        <option key={i} value={i + 1} className="text-gray-900 bg-white">{i + 1}</option>
                      ))}
                    </select>
                  </div>

                  <div className="bg-white rounded-xl p-5 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-[#17233E]/60">{fmtPrice(basePrice)} x{formData.nombrePersonnes}</span>
                      <span className="font-bold text-[#17233E]">{fmtPrice(sousTotal)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-[#17233E]/60">Acompte {voyage.acomptesPourcentage}%</span>
                      <span className="font-bold text-[#17233E]">{fmtPrice(acompte)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-[#17233E]/60">Economisez (5%)</span>
                      <span className="font-bold text-green-600">-{fmtPrice(economisez)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-[#17233E]/60">Autres frais</span>
                      <span className="font-bold text-[#17233E]">Gratuit</span>
                    </div>
                    <div className="border-t border-dashed border-[#17233E]/20" />
                    <div className="flex justify-between items-center">
                      <span className="text-base font-bold text-[#17233E]/50">Total</span>
                      <span className="font-bold text-lg text-[#17233E]">{fmtPrice(total)}</span>
                    </div>
                  </div>

                  <button onClick={() => handleReservation('reservation')} className="w-full py-3.5 bg-[#FF7F2A] text-white rounded-xl font-semibold text-base hover:bg-[#e66d1e] transition-colors">
                    Réservez Maintenant
                  </button>
                  <p className="text-center text-sm text-white/50">Ou</p>
                  <button onClick={() => handleReservation('epargne')} className="w-full py-3.5 bg-[#FF7F2A] text-white rounded-xl font-semibold text-base hover:bg-[#e66d1e] transition-colors">
                    Epargner Pour Voyager
                  </button>
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
          <p className="text-gray-300 mb-8 max-w-2xl mx-auto text-sm">Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>
        </div>
      </div>

      {/* PARTENAIRES */}
      <div className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-[#FF7F2A] font-semibold mb-3 tracking-wide uppercase text-sm">Nos Partenaires</p>
          <h2 className="font-playfair text-3xl md:text-4xl font-bold text-[#17233E] mb-4">Nos Incroyables Partenaires</h2>
          <p className="text-[#17233E]/50 mb-12 max-w-2xl mx-auto text-sm">Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 md:gap-8 items-center">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-gray-50 rounded-lg p-6 h-20 flex items-center justify-center border border-gray-100">
                <div className="text-gray-300 font-bold text-lg tracking-wider">{['PARTNER', 'BRAND', 'TRAVEL', 'AGENCY', 'GROUP'][i]}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PublicLayout>
  );
};

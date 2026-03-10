import { useState, useEffect, useRef } from 'react';
import { VoyageForm, VoyageFormRef } from '../components/VoyageForm';
import type { VoyageFormData } from '../components/VoyageForm';
import { VoyageursList } from '../components/VoyageursList';
import { StatsCard } from '../components/StatsCard';
import * as tripsApi from '../api/trips';
import { ToastContainer, useToast } from '../components/Toast';

interface EditVoyageProps {
  voyageId: string;
  onBack: () => void;
  onUpdate: (data: any) => void;
}

type TabType = 'details' | 'voyageurs' | 'statistiques';

export const EditVoyage: React.FC<EditVoyageProps> = ({ voyageId, onBack, onUpdate }) => {
  const [activeTab, setActiveTab] = useState<TabType>('details');
  const [voyage, setVoyage] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const formRef = useRef<VoyageFormRef>(null);
  const { toasts, addToast, removeToast } = useToast();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [trip, st] = await Promise.all([
          tripsApi.getVoyageById(voyageId),
          tripsApi.getVoyageStats(voyageId),
        ]);
        if (!cancelled) {
          setVoyage(trip);
          setStats(st);
        }
      } catch {
        if (!cancelled) setVoyage(null);
      }
    })();
    return () => { cancelled = true; };
  }, [voyageId]);

  const handleSubmit = async (data: VoyageFormData) => {
    if (!voyage) return;
    try {
      const updated = await tripsApi.updateVoyage(voyageId, {
        title: data.title,
        destination: data.destination,
        description: data.description,
        tripType: data.tripType,
        departureDate: data.departureDate,
        returnDate: data.returnDate,
        totalPrice: data.totalPrice,
        depositAmount: data.depositAmount,
        paymentDeadlineDays: data.paymentDeadlineDays,
        allowInstallments: data.allowInstallments,
        minInstallmentAmount: data.minInstallmentAmount,
        maxParticipants: data.maxParticipants,
        images: data.photos,
        included: data.included,
        excluded: data.excluded,
        itinerary: data.itinerary,
      });
      setVoyage(updated);
      onUpdate(updated);
      addToast('success', 'Voyage modifié avec succès');
    } catch (e) {
      addToast('error', (e as { message?: string })?.message || 'Erreur lors de la mise à jour');
    }
  };

  if (!voyage) {
    return (
      <div className="p-8">
        <p className="text-gray-600">Chargement...</p>
      </div>
    );
  }

  const formData: Partial<VoyageFormData> = {
    title: voyage.titre || '',
    destination: voyage.destination || '',
    description: voyage.description || '',
    tripType: voyage.tripType || 'voyage',
    departureDate: voyage.rawDepartureDate || '',
    returnDate: voyage.returnDate || '',
    totalPrice: voyage.totalPrice || 0,
    depositAmount: voyage.depositAmount || 0,
    paymentDeadlineDays: voyage.paymentDeadlineDays || 14,
    allowInstallments: voyage.allowInstallments ?? true,
    minInstallmentAmount: voyage.minInstallmentAmount || 5000,
    maxParticipants: Number(voyage.nombrePersonnes) || 20,
    photos: voyage.photos || [],
    included: voyage.ceQuiEstInclus || [],
    excluded: voyage.ceQuiNestPasInclus || [],
    itinerary: voyage.itineraire?.map((d: any) => ({
      day: d.jour || d.day || 1,
      description: d.titre || d.description || '',
      activities: d.activities || [],
    })) || [],
  };

  const tabs = [
    { id: 'details' as TabType, label: 'Détails' },
    { id: 'voyageurs' as TabType, label: 'Liste des voyageurs' },
    { id: 'statistiques' as TabType, label: 'Statistiques' },
  ];

  return (
    <div className="p-4 md:p-8">
      <ToastContainer toasts={toasts} onClose={removeToast} />

      <h1 className="text-2xl font-bold text-gray-900 mb-6">{voyage.titre || voyage.destination}</h1>

      {/* Tabs */}
      <div className="bg-white rounded-t-xl border-b border-gray-200">
        <div className="flex gap-4 md:gap-8 px-4 md:px-6 overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-4 font-semibold transition-colors ${
                activeTab === tab.id
                  ? 'text-primary-600 border-b-2 border-primary-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-b-xl shadow-card p-4 md:p-8 border-x border-b border-gray-100">
        {activeTab === 'details' && (
          <VoyageForm
            ref={formRef}
            mode="edit"
            initialData={formData}
            onSubmit={handleSubmit}
            onCancel={onBack}
          />
        )}

        {activeTab === 'voyageurs' && (
          <VoyageursList voyageId={voyageId} />
        )}

        {activeTab === 'statistiques' && stats && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
              <StatsCard
                label="Total des réservations"
                value={stats.totalReservations}
                highlight
              />
              <StatsCard
                label="Total des acomptes collectés"
                value={stats.totalAcomptes}
                highlight
              />
              <StatsCard
                label="Nombre d'utilisateurs en mode épargne"
                value={stats.utilisateursEpargne}
                highlight
              />
              <StatsCard
                label="Nombre d'utilisateurs financés"
                value={stats.utilisateursFinances}
                highlight
              />
              <StatsCard
                label="Montant en attente"
                value={stats.montantAttente}
                highlight
              />
              <StatsCard
                label="Total des paiements collectés"
                value={stats.totalPaiements}
                highlight
              />
            </div>
          </div>
        )}
      </div>

      {/* Save Button - only on Détails tab, triggers form validation */}
      {activeTab === 'details' && (
        <div className="flex justify-center mt-6">
          <button
            onClick={() => formRef.current?.triggerSubmit()}
            className="px-8 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors font-semibold shadow-md"
          >
            Enregistrer les modifications
          </button>
        </div>
      )}
    </div>
  );
};

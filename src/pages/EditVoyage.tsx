import { useState, useEffect, useRef } from 'react';
import { Crown, Eye, Loader2, Shield, Users } from 'lucide-react';
import { VoyageForm, VoyageFormRef } from '../components/VoyageForm';
import type { VoyageFormData } from '../components/VoyageForm';
import { VoyageursList } from '../components/VoyageursList';
import { StatsCard } from '../components/StatsCard';
import { TripManagersModal } from '../components/TripManagersModal';
import * as tripsApi from '../api/trips';
import { uploadTripImages, deleteTripImage, getPartnerVoyageById } from '../api/trips';
import { ToastContainer, useToast } from '../components/Toast';
import { useAuth } from '../context/AuthContext';
import { getTripManagerErrorMessage } from '../lib/tripManagerErrors';

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
  const [saving, setSaving] = useState(false);
  const [managersOpen, setManagersOpen] = useState(false);
  const formRef = useRef<VoyageFormRef>(null);
  const { toasts, addToast, removeToast } = useToast();
  const { user } = useAuth();

  const yourRole: 'OWNER' | 'MANAGER' | 'READONLY' | undefined = voyage?.yourRole;
  const isReadOnly = yourRole === 'READONLY';
  const isOwner = yourRole === 'OWNER' || !yourRole; // legacy trips without yourRole: treat as owner

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const trip = await getPartnerVoyageById(voyageId);
        if (!cancelled) setVoyage(trip);
      } catch {
        if (!cancelled) setVoyage(null);
      }
      try {
        const st = await tripsApi.getVoyageStats(voyageId);
        if (!cancelled) setStats(st);
      } catch {
        // stats endpoint may not exist — non-blocking
      }
    })();
    return () => { cancelled = true; };
  }, [voyageId]);

  const handleSubmit = async (data: VoyageFormData) => {
    if (!voyage || saving) return;
    setSaving(true);
    try {
      // 1. Supprimer les images retirées
      for (const url of data.removedPhotos) {
        await deleteTripImage(voyageId, url);
      }
      // 2. Uploader les nouvelles images
      if (data.newPhotoFiles.length > 0) {
        await uploadTripImages(voyageId, data.newPhotoFiles);
      }
      // 3. Mettre à jour les autres champs
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
        included: data.included,
        excluded: data.excluded,
        itinerary: data.itinerary,
      });
      setVoyage(updated);
      onUpdate(updated);
      addToast('success', 'Voyage modifié avec succès');
    } catch (e) {
      addToast('error', getTripManagerErrorMessage(e, 'Erreur lors de la mise à jour'));
    } finally {
      setSaving(false);
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
    existingPhotos: voyage.photos || [],
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

  const roleBadge = yourRole && yourRole !== 'OWNER' ? (
    <span
      className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full border ${
        yourRole === 'MANAGER'
          ? 'bg-primary-50 text-primary-700 border-primary-200'
          : 'bg-gray-100 text-gray-700 border-gray-200'
      }`}
    >
      {yourRole === 'MANAGER' ? <Shield className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
      {yourRole}
    </span>
  ) : yourRole === 'OWNER' ? (
    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full border bg-amber-50 text-amber-700 border-amber-200">
      <Crown className="w-3 h-3" /> OWNER
    </span>
  ) : null;

  return (
    <div className="p-4 md:p-8">
      <ToastContainer toasts={toasts} onClose={removeToast} />

      <TripManagersModal
        isOpen={managersOpen}
        tripId={voyageId}
        tripTitle={voyage.titre || voyage.destination || ''}
        currentUserId={user?.id || ''}
        onClose={() => setManagersOpen(false)}
        onToast={addToast}
      />

      <div className="flex items-center justify-between gap-3 mb-4 sm:mb-6 flex-wrap">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-lg sm:text-2xl font-bold text-gray-900">{voyage.titre || voyage.destination}</h1>
          {roleBadge}
        </div>
        {isOwner && (
          <button
            onClick={() => setManagersOpen(true)}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-primary-700 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors border border-primary-200"
          >
            <Users className="w-4 h-4" />
            Gérer les co-managers
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-t-xl border-b border-gray-200">
        <div className="flex gap-4 md:gap-8 px-4 md:px-6 overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 sm:px-4 py-3 sm:py-4 text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap ${
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

      {isReadOnly && (
        <div className="mt-2 mb-2 p-3 bg-gray-50 border border-gray-200 rounded-lg flex items-center gap-2 text-sm text-gray-700">
          <Eye className="w-4 h-4 text-gray-500" />
          Lecture seule — vous n'avez pas les droits pour modifier ce voyage.
        </div>
      )}

      {/* Tab Content */}
      <div className="bg-white rounded-b-xl shadow-card p-3 sm:p-6 md:p-8 border-x border-b border-gray-100">
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
      {activeTab === 'details' && !isReadOnly && (
        <div className="flex justify-center mt-6">
          <button
            onClick={() => formRef.current?.triggerSubmit()}
            disabled={saving}
            className="w-full sm:w-auto px-8 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors font-semibold shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {saving ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Enregistrement...</>
            ) : (
              'Enregistrer les modifications'
            )}
          </button>
        </div>
      )}
    </div>
  );
};

import React, { useState } from 'react';
import { VoyageForm } from '../components/VoyageForm';
import { createVoyage } from '../api/trips';
import { ToastContainer, useToast } from '../components/Toast';

interface CreateVoyageProps {
  onBack: () => void;
  onCreate: (data: any) => void;
}

export const CreateVoyage: React.FC<CreateVoyageProps> = ({ onBack, onCreate }) => {
  const [loading, setLoading] = useState(false);
  const { toasts, addToast, removeToast } = useToast();

  const handleSubmit = async (formData: any) => {
    const titre = formData.titre || 'Nouveau voyage';
    const destination = formData.destination || titre;
    const totalPrice = parseInt(String(formData.prix || formData.montant || '0').replace(/\D/g, ''), 10) || 0;
    const depositAmount = Math.round(totalPrice * 0.5);
    const maxParticipants = parseInt(formData.nombrePersonnes, 10) || 5;
    const d = new Date();
    const departureDate = d.toISOString().slice(0, 10);
    d.setDate(d.getDate() + (parseInt(formData.nombreJours, 10) || 7));
    const returnDate = d.toISOString().slice(0, 10);

    setLoading(true);
    try {
      await createVoyage({
        title: titre,
        description: formData.description || '',
        destination,
        tripType: 'voyage',
        departureDate,
        returnDate,
        totalPrice,
        depositAmount,
        maxParticipants,
        images: formData.photos || [],
        included: (formData.ceQuiEstInclus || []).filter((s: string) => s.trim()),
        excluded: (formData.ceQuiNestPasInclus || []).filter((s: string) => s.trim()),
        itinerary: [],
      });
      addToast('success', 'Voyage créé avec succès');
      onCreate({});
      onBack();
    } catch (e) {
      addToast('error', (e as { message?: string })?.message || 'Erreur lors de la création');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-8">
      <ToastContainer toasts={toasts} onClose={removeToast} />
      <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-6">Nouveau voyage</h1>
      <div className="bg-white rounded-xl shadow-card p-4 md:p-8 border border-gray-100">
        <VoyageForm
          mode="create"
          onSubmit={handleSubmit}
          onCancel={onBack}
        />
      </div>
    </div>
  );
};

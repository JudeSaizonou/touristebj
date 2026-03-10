import React, { useState } from 'react';
import { VoyageForm } from '../components/VoyageForm';
import type { VoyageFormData } from '../components/VoyageForm';
import { createVoyage } from '../api/trips';
import { ToastContainer, useToast } from '../components/Toast';

interface CreateVoyageProps {
  onBack: () => void;
  onCreate: (data: any) => void;
}

export const CreateVoyage: React.FC<CreateVoyageProps> = ({ onBack, onCreate }) => {
  const [loading, setLoading] = useState(false);
  const { toasts, addToast, removeToast } = useToast();

  const handleSubmit = async (formData: VoyageFormData) => {
    setLoading(true);
    try {
      await createVoyage({
        title: formData.title,
        destination: formData.destination,
        description: formData.description,
        tripType: formData.tripType,
        departureDate: formData.departureDate,
        returnDate: formData.returnDate,
        totalPrice: formData.totalPrice,
        depositAmount: formData.depositAmount,
        paymentDeadlineDays: formData.paymentDeadlineDays,
        allowInstallments: formData.allowInstallments,
        minInstallmentAmount: formData.minInstallmentAmount,
        maxParticipants: formData.maxParticipants,
        images: formData.photos,
        included: formData.included,
        excluded: formData.excluded,
        itinerary: formData.itinerary,
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
      {loading && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl p-6 flex items-center gap-3 shadow-xl">
            <div className="w-6 h-6 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm font-medium text-gray-700">Création en cours...</span>
          </div>
        </div>
      )}
      <div className="bg-white rounded-xl shadow-card p-4 md:p-8 border border-gray-100">
        <VoyageForm mode="create" onSubmit={handleSubmit} onCancel={onBack} />
      </div>
    </div>
  );
};

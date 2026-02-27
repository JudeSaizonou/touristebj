import React from 'react';
import { VoyageForm } from '../components/VoyageForm';

interface CreateVoyageProps {
  onBack: () => void;
  onCreate: (data: any) => void;
}

export const CreateVoyage: React.FC<CreateVoyageProps> = ({ onBack, onCreate }) => {
  const handleSubmit = (formData: any) => {
    // Build a complete voyage object with all required fields
    const voyage = {
      titre: formData.titre || 'Nouveau voyage',
      destination: formData.destination || formData.titre || 'Nouveau voyage',
      pays: formData.titre || 'Non défini',
      duree: formData.nombreJours + ' jours',
      nombreJours: formData.nombreJours || '1',
      nombrePersonnes: formData.nombrePersonnes || '5',
      prix: formData.prix || formData.montant || '0',
      devise: 'FCFA',
      description: formData.description || '',
      conditionsPaiement: 'Acompte 50%',
      acomptesPourcentage: 50,
      statut: 'pause',
      note: 5,
      nombreAvis: 0,
      dateDebut: new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }),
      auteur: 'Admin',
      acomptesRecus: '0 FCFA',
      placesRestantes: `0 sur ${formData.nombrePersonnes || '5'}`,
      photos: formData.photos || [],
      politiqueRemboursement: formData.politiqueRemboursement || '',
      ceQuiEstInclus: (formData.ceQuiEstInclus || []).filter((s: string) => s.trim()),
      ceQuiNestPasInclus: (formData.ceQuiNestPasInclus || []).filter((s: string) => s.trim()),
      itineraire: [],
      departureTime: '10:00 AM',
      returnTime: '8:00 PM',
      included: '',
      excluded: '',
      bedrooms: 2,
      bathrooms: 1,
      maxPeople: parseInt(formData.nombrePersonnes) || 5,
      minAge: 18,
    };

    onCreate(voyage);
    onBack();
  };

  return (
    <div className="p-4 md:p-8">
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

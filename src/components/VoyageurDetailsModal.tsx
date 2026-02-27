import React, { useEffect, useState } from 'react';
import { Eye, FileCheck2, Send, X } from 'lucide-react';
import { Voyageur, VoyageurDocumentType } from '../types';

interface VoyageurDetailsModalProps {
  isOpen: boolean;
  voyageur: Voyageur | null;
  voyageDestination?: string;
  onClose: () => void;
  onRequestDocuments: (documents: VoyageurDocumentType[]) => void;
}

const DOCUMENTS: Array<{ id: VoyageurDocumentType; label: string; help: string }> = [
  { id: 'copie-identite', label: 'Copie pièce d\'identité', help: 'Carte nationale d\'identité recto/verso' },
  { id: 'passeport', label: 'Passeport', help: 'Page d\'identité + validité minimum 6 mois' },
  { id: 'photo-identite', label: 'Photo d\'identité', help: 'Format récent sur fond clair' },
];

const statusLabels: Record<string, string> = {
  'non-fourni': 'Non fourni',
  'demande': 'Demandé',
  'recu': 'Reçu',
};

const statusStyles: Record<string, string> = {
  'non-fourni': 'bg-gray-100 text-gray-700 border-gray-200',
  'demande': 'bg-amber-100 text-amber-700 border-amber-200',
  'recu': 'bg-green-100 text-green-700 border-green-200',
};

const formatDateTime = (iso?: string) => {
  if (!iso) return '-';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const VoyageurDetailsModal: React.FC<VoyageurDetailsModalProps> = ({
  isOpen,
  voyageur,
  voyageDestination,
  onClose,
  onRequestDocuments,
}) => {
  const [selectedDocuments, setSelectedDocuments] = useState<VoyageurDocumentType[]>([
    'copie-identite',
    'passeport',
    'photo-identite',
  ]);

  useEffect(() => {
    if (isOpen) {
      setSelectedDocuments(['copie-identite', 'passeport', 'photo-identite']);
    }
  }, [isOpen]);

  if (!isOpen || !voyageur) return null;

  const toggleDocument = (documentType: VoyageurDocumentType) => {
    setSelectedDocuments((prev) =>
      prev.includes(documentType)
        ? prev.filter((doc) => doc !== documentType)
        : [...prev, documentType]
    );
  };

  const handleRequest = () => {
    if (selectedDocuments.length === 0) return;
    onRequestDocuments(selectedDocuments);
  };

  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Eye className="w-5 h-5 text-primary-600" />
            Détails du voyageur
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-lg border border-gray-200 p-4 bg-gray-50">
              <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">Nom</p>
              <p className="font-semibold text-gray-900">{voyageur.nom}</p>
            </div>
            <div className="rounded-lg border border-gray-200 p-4 bg-gray-50">
              <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">Téléphone</p>
              <p className="font-semibold text-gray-900">{voyageur.telephone}</p>
            </div>
            <div className="rounded-lg border border-gray-200 p-4 bg-gray-50">
              <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">Date d'inscription</p>
              <p className="font-semibold text-gray-900">{voyageur.date}</p>
            </div>
            <div className="rounded-lg border border-gray-200 p-4 bg-gray-50">
              <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">Voyage</p>
              <p className="font-semibold text-gray-900">{voyageDestination || 'N/A'}</p>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <FileCheck2 className="w-5 h-5 text-primary-600" />
              Documents visa
            </h4>
            <div className="space-y-3">
              {DOCUMENTS.map((document) => {
                const info = voyageur.documents?.[document.id];
                const status = info?.status || 'non-fourni';
                return (
                  <div key={document.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-medium text-gray-900">{document.label}</p>
                        <p className="text-sm text-gray-600">{document.help}</p>
                        <p className="text-xs text-gray-500 mt-2">
                          Dernière demande: {formatDateTime(info?.requestedAt)}
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${statusStyles[status] || statusStyles['non-fourni']}`}>
                        {statusLabels[status] || statusLabels['non-fourni']}
                      </span>
                    </div>
                    <label className="mt-3 inline-flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedDocuments.includes(document.id)}
                        onChange={() => toggleDocument(document.id)}
                        className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      Inclure dans la prochaine demande
                    </label>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-200 flex items-center gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Fermer
          </button>
          <button
            onClick={handleRequest}
            disabled={selectedDocuments.length === 0}
            className="flex-1 px-4 py-2.5 bg-primary-500 text-white rounded-lg text-sm font-semibold hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Send className="w-4 h-4" />
            Envoyer la demande
          </button>
        </div>
      </div>
    </div>
  );
};

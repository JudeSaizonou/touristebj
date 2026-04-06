import React, { useEffect, useState, useCallback } from 'react';
import { Check, Download, Eye, FileCheck2, Loader2, Send, X, XCircle } from 'lucide-react';
import { Voyageur, VoyageurDocumentType, DocumentRequestBackend } from '../types';
import * as tripsApi from '../api/trips';

interface VoyageurDetailsModalProps {
  isOpen: boolean;
  voyageur: Voyageur | null;
  voyageId: string;
  voyageDestination?: string;
  onClose: () => void;
  onRequestDocuments: (documents: VoyageurDocumentType[]) => void;
  onDocumentsChanged?: () => void;
}

const REQUEST_DOCUMENTS: Array<{ id: VoyageurDocumentType; label: string; help: string; backendType: string }> = [
  { id: 'copie-identite', label: 'Copie pi\u00e8ce d\'identit\u00e9', help: 'Carte nationale d\'identit\u00e9 recto/verso', backendType: 'ID_CARD' },
  { id: 'passeport', label: 'Passeport', help: 'Page d\'identit\u00e9 + validit\u00e9 minimum 6 mois', backendType: 'PASSPORT' },
  { id: 'photo-identite', label: 'Photo d\'identit\u00e9', help: 'Format r\u00e9cent sur fond clair', backendType: 'PHOTO' },
];

const DOC_TYPE_LABELS: Record<string, string> = {
  ID_CARD: 'Copie pi\u00e8ce d\'identit\u00e9',
  PASSPORT: 'Passeport',
  PHOTO: 'Photo d\'identit\u00e9',
  VISA: 'Visa',
  VACCINATION: 'Carnet de vaccination',
  INSURANCE: 'Attestation d\'assurance',
  OTHER: 'Autre document',
};

const statusConfig: Record<string, { label: string; style: string }> = {
  PENDING: { label: 'En attente', style: 'bg-amber-100 text-amber-700 border-amber-200' },
  SUBMITTED: { label: 'Soumis', style: 'bg-blue-100 text-blue-700 border-blue-200' },
  APPROVED: { label: 'Approuv\u00e9', style: 'bg-green-100 text-green-700 border-green-200' },
  REJECTED: { label: 'Rejet\u00e9', style: 'bg-red-100 text-red-700 border-red-200' },
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

const isImageUrl = (url: string) => /\.(jpe?g|png|gif|webp|bmp)(\?|$)/i.test(url);

export const VoyageurDetailsModal: React.FC<VoyageurDetailsModalProps> = ({
  isOpen,
  voyageur,
  voyageId,
  voyageDestination,
  onClose,
  onRequestDocuments,
  onDocumentsChanged,
}) => {
  const [selectedDocuments, setSelectedDocuments] = useState<VoyageurDocumentType[]>([
    'copie-identite',
    'passeport',
    'photo-identite',
  ]);
  const [documents, setDocuments] = useState<DocumentRequestBackend[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const handleDownload = useCallback(async (doc: DocumentRequestBackend) => {
    if (!doc.fileUrl) return;
    setDownloadingId(doc._id);
    try {
      const token = localStorage.getItem('touriste_token');
      const res = await fetch(doc.fileUrl, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error('Download failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.fileName || 'document';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      // Fallback: open in new tab (for external URLs that don't need auth)
      window.open(doc.fileUrl, '_blank');
    } finally {
      setDownloadingId(null);
    }
  }, []);
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [rejectingDoc, setRejectingDoc] = useState<DocumentRequestBackend | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && voyageur) {
      setSelectedDocuments(['copie-identite', 'passeport', 'photo-identite']);
      setRejectingDoc(null);
      setRejectionReason('');
      setPreviewUrl(null);
      loadDocuments();
    } else {
      setDocuments([]);
    }
  }, [isOpen, voyageur?.id]);

  const loadDocuments = async () => {
    if (!voyageur) return;
    setLoadingDocs(true);
    try {
      const docs = await tripsApi.getVoyageurDocuments(voyageId, voyageur.id);
      setDocuments(docs);
    } catch {
      setDocuments([]);
    } finally {
      setLoadingDocs(false);
    }
  };

  const handleApprove = async (doc: DocumentRequestBackend) => {
    if (!voyageur) return;
    setReviewingId(doc._id);
    try {
      await tripsApi.reviewVoyageurDocument(voyageId, voyageur.id, doc._id, 'approve');
      await loadDocuments();
      onDocumentsChanged?.();
    } catch {
      // error handled silently — toast could be added via parent
    } finally {
      setReviewingId(null);
    }
  };

  const handleRejectSubmit = async () => {
    if (!voyageur || !rejectingDoc || !rejectionReason.trim()) return;
    setReviewingId(rejectingDoc._id);
    try {
      await tripsApi.reviewVoyageurDocument(voyageId, voyageur.id, rejectingDoc._id, 'reject', rejectionReason.trim());
      await loadDocuments();
      onDocumentsChanged?.();
      setRejectingDoc(null);
      setRejectionReason('');
    } catch {
      // error handled silently
    } finally {
      setReviewingId(null);
    }
  };

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

  const submittedDocs = documents.filter(d => d.status !== 'PENDING' || d.fileUrl);
  const hasDocuments = documents.length > 0;

  return (
    <>
      <div className="fixed inset-0 z-[9998] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/50" onClick={onClose} />

        <div className="relative bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Eye className="w-5 h-5 text-primary-600" />
              D\u00e9tails du voyageur
            </h3>
            <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Voyageur info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-lg border border-gray-200 p-4 bg-gray-50">
                <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">Nom</p>
                <p className="font-semibold text-gray-900">{voyageur.nom}</p>
              </div>
              <div className="rounded-lg border border-gray-200 p-4 bg-gray-50">
                <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">T\u00e9l\u00e9phone</p>
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

            {/* Documents soumis */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <FileCheck2 className="w-5 h-5 text-primary-600" />
                Documents re\u00e7us
              </h4>

              {loadingDocs ? (
                <div className="flex items-center justify-center py-8 text-gray-400">
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  Chargement des documents...
                </div>
              ) : !hasDocuments ? (
                <p className="text-sm text-gray-500 py-4">Aucun document demand\u00e9 pour l'instant.</p>
              ) : (
                <div className="space-y-3">
                  {documents.map((doc) => {
                    const cfg = statusConfig[doc.status] || statusConfig.PENDING;
                    const isReviewing = reviewingId === doc._id;
                    return (
                      <div key={doc._id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-medium text-gray-900">
                                {DOC_TYPE_LABELS[doc.documentType] || doc.documentType}
                              </p>
                              <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${cfg.style}`}>
                                {cfg.label}
                              </span>
                            </div>

                            <div className="text-xs text-gray-500 space-y-0.5">
                              <p>Demand\u00e9 le {formatDateTime(doc.requestedAt)}</p>
                              {doc.submittedAt && <p>Soumis le {formatDateTime(doc.submittedAt)}</p>}
                              {doc.reviewedAt && <p>Review\u00e9 le {formatDateTime(doc.reviewedAt)}</p>}
                              {doc.notes && <p className="text-gray-600 italic mt-1">Note : {doc.notes}</p>}
                              {doc.rejectionReason && (
                                <p className="text-red-600 mt-1">Motif de rejet : {doc.rejectionReason}</p>
                              )}
                            </div>

                            {/* File preview / download */}
                            {doc.fileUrl && (
                              <div className="mt-3">
                                {isImageUrl(doc.fileUrl) ? (
                                  <button
                                    onClick={() => setPreviewUrl(doc.fileUrl!)}
                                    className="group relative inline-block"
                                  >
                                    <img
                                      src={doc.fileUrl}
                                      alt={doc.fileName || 'Document'}
                                      className="w-24 h-24 object-cover rounded-lg border border-gray-200 group-hover:border-primary-400 transition-colors"
                                    />
                                    <span className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/30 rounded-lg transition-colors">
                                      <Eye className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </span>
                                  </button>
                                ) : (
                                  <div className="flex items-center gap-2 text-sm">
                                    <FileCheck2 className="w-4 h-4 text-gray-400" />
                                    <span className="text-gray-700 truncate max-w-[200px]">{doc.fileName || 'Fichier'}</span>
                                  </div>
                                )}
                                <button
                                  onClick={() => handleDownload(doc)}
                                  disabled={downloadingId === doc._id}
                                  className="inline-flex items-center gap-1.5 mt-2 text-sm text-primary-600 hover:text-primary-700 font-medium disabled:opacity-50"
                                >
                                  {downloadingId === doc._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                                  {downloadingId === doc._id ? 'T\u00e9l\u00e9chargement...' : 'T\u00e9l\u00e9charger'}
                                </button>
                              </div>
                            )}
                          </div>

                          {/* Approve / Reject actions */}
                          {doc.status === 'SUBMITTED' && (
                            <div className="flex flex-col gap-2 shrink-0">
                              <button
                                onClick={() => handleApprove(doc)}
                                disabled={isReviewing}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 transition-colors disabled:opacity-50"
                              >
                                {isReviewing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                Approuver
                              </button>
                              <button
                                onClick={() => { setRejectingDoc(doc); setRejectionReason(''); }}
                                disabled={isReviewing}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 border border-red-200 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors disabled:opacity-50"
                              >
                                <XCircle className="w-4 h-4" />
                                Rejeter
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Rejection reason inline form */}
            {rejectingDoc && (
              <div className="border border-red-200 bg-red-50 rounded-lg p-4">
                <p className="text-sm font-medium text-red-800 mb-2">
                  Rejeter : {DOC_TYPE_LABELS[rejectingDoc.documentType] || rejectingDoc.documentType}
                </p>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Motif du rejet (obligatoire)..."
                  rows={2}
                  className="w-full px-3 py-2 border border-red-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-400 bg-white"
                />
                <div className="flex items-center gap-2 mt-2">
                  <button
                    onClick={handleRejectSubmit}
                    disabled={!rejectionReason.trim() || reviewingId === rejectingDoc._id}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition-colors disabled:opacity-50"
                  >
                    {reviewingId === rejectingDoc._id ? 'Envoi...' : 'Confirmer le rejet'}
                  </button>
                  <button
                    onClick={() => { setRejectingDoc(null); setRejectionReason(''); }}
                    className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            )}

            {/* Request new documents */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Send className="w-5 h-5 text-primary-600" />
                Demander des documents
              </h4>
              <div className="space-y-3">
                {REQUEST_DOCUMENTS.map((document) => {
                  const existing = documents.find(d => d.documentType === document.backendType);
                  const alreadyActive = existing && (existing.status === 'PENDING' || existing.status === 'SUBMITTED');
                  return (
                    <div key={document.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-medium text-gray-900">{document.label}</p>
                          <p className="text-sm text-gray-600">{document.help}</p>
                          {alreadyActive && (
                            <p className="text-xs text-amber-600 mt-1">
                              D\u00e9j\u00e0 {existing.status === 'SUBMITTED' ? 'soumis' : 'en attente'}
                            </p>
                          )}
                        </div>
                        <label className="inline-flex items-center gap-2 text-sm text-gray-700 cursor-pointer shrink-0">
                          <input
                            type="checkbox"
                            checked={selectedDocuments.includes(document.id)}
                            onChange={() => toggleDocument(document.id)}
                            className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                          />
                          Inclure
                        </label>
                      </div>
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

      {/* Fullscreen image preview */}
      {previewUrl && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 p-4"
          onClick={() => setPreviewUrl(null)}
        >
          <button
            onClick={() => setPreviewUrl(null)}
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-white" />
          </button>
          <img
            src={previewUrl}
            alt="Aper\u00e7u du document"
            className="max-w-full max-h-full object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
};

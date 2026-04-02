import React, { useState, useRef } from 'react';
import { X, Send, Paperclip, Loader2, FileText, Trash2, AlertCircle } from 'lucide-react';
import { sendTravelerMessage, uploadTravelerFiles } from '../api/trips';

interface SendMessageModalProps {
  isOpen: boolean;
  bookingId: string;
  travelerName: string;
  travelerEmail?: string;
  onClose: () => void;
  onSuccess: () => void;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const MAX_FILES = 5;
const ALLOWED_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
];

const fmtSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
};

export const SendMessageModal: React.FC<SendMessageModalProps> = ({
  isOpen,
  bookingId,
  travelerName,
  travelerEmail,
  onClose,
  onSuccess,
}) => {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [attachments, setAttachments] = useState<{ url: string; filename: string; size?: number }[]>([]);
  const [uploading, setUploading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    if (fileRef.current) fileRef.current.value = '';

    const remaining = MAX_FILES - attachments.length;
    if (remaining <= 0) {
      setError(`Maximum ${MAX_FILES} fichiers.`);
      return;
    }

    const selected = Array.from(files).slice(0, remaining);
    const rejected: string[] = [];
    const valid: File[] = [];

    for (const file of selected) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        rejected.push(`${file.name} : format non supporté`);
      } else if (file.size > MAX_FILE_SIZE) {
        rejected.push(`${file.name} : trop volumineux (max 10 MB)`);
      } else {
        valid.push(file);
      }
    }

    if (rejected.length > 0) {
      setError(rejected.join(' · '));
    }

    if (valid.length === 0) return;

    setUploading(true);
    if (!rejected.length) setError('');
    try {
      const uploaded = await uploadTravelerFiles(bookingId, valid);
      setAttachments(prev => [...prev, ...uploaded.map(f => ({ url: f.url, filename: f.filename, size: f.size }))]);
    } catch (err: any) {
      setError(err?.message || 'Erreur lors de l\'upload.');
    } finally {
      setUploading(false);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSend = async () => {
    if (!subject.trim() || !message.trim() || sending) return;
    setSending(true);
    setError('');
    try {
      await sendTravelerMessage(bookingId, {
        subject: subject.trim(),
        message: message.trim(),
        attachments: attachments.length > 0
          ? attachments.map(a => ({ url: a.url, filename: a.filename }))
          : undefined,
      });
      onSuccess();
      handleClose();
    } catch (err: any) {
      setError(err?.message || 'Erreur lors de l\'envoi du message.');
    } finally {
      setSending(false);
    }
  };

  const handleClose = () => {
    setSubject('');
    setMessage('');
    setAttachments([]);
    setError('');
    onClose();
  };

  const canSend = subject.trim() && message.trim() && !sending && !uploading;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/50" onClick={!sending ? handleClose : undefined} />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-dark-800 px-6 py-4 flex items-center justify-between shrink-0">
          <div>
            <h2 className="font-playfair text-lg font-bold text-white">Envoyer un message</h2>
            <p className="text-white/50 text-xs mt-0.5">
              À : {travelerName}{travelerEmail ? ` (${travelerEmail})` : ''}
            </p>
          </div>
          {!sending && (
            <button onClick={handleClose} className="text-white/50 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* Subject */}
          <div>
            <label className="block text-sm font-semibold text-dark-800 mb-1.5">Objet</label>
            <input
              type="text"
              placeholder="Ex: Votre visa est prêt"
              value={subject}
              onChange={e => setSubject(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 text-sm text-dark-800"
            />
          </div>

          {/* Message */}
          <div>
            <label className="block text-sm font-semibold text-dark-800 mb-1.5">Message</label>
            <textarea
              rows={5}
              placeholder="Écrivez votre message ici..."
              value={message}
              onChange={e => setMessage(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 text-sm text-dark-800 resize-none"
            />
          </div>

          {/* Attachments */}
          {attachments.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-dark-800/50">
                Pièces jointes ({attachments.length}/{MAX_FILES})
              </p>
              {attachments.map((att, i) => (
                <div key={i} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className="w-4 h-4 text-primary-500 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm text-dark-800 truncate">{att.filename}</p>
                      {att.size && <p className="text-[10px] text-dark-800/40">{fmtSize(att.size)}</p>}
                    </div>
                  </div>
                  <button onClick={() => removeAttachment(i)} className="p-1 hover:bg-red-50 rounded transition-colors flex-shrink-0">
                    <Trash2 className="w-3.5 h-3.5 text-red-400" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Add attachment */}
          {attachments.length < MAX_FILES && (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="inline-flex items-center gap-2 text-sm text-dark-800/60 hover:text-primary-500 transition-colors disabled:opacity-50"
            >
              {uploading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Upload en cours...</>
              ) : (
                <><Paperclip className="w-4 h-4" /> Joindre des fichiers (PDF, images — max 10 MB, {MAX_FILES - attachments.length} restant{MAX_FILES - attachments.length > 1 ? 's' : ''})</>
              )}
            </button>
          )}
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.webp"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl p-3">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-red-600">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex gap-3 shrink-0">
          <button
            onClick={handleClose}
            disabled={sending}
            className="flex-1 py-3 border border-gray-200 text-dark-800 rounded-xl font-semibold hover:bg-gray-50 transition-colors text-sm disabled:opacity-50"
          >
            Annuler
          </button>
          <button
            onClick={handleSend}
            disabled={!canSend}
            className="flex-1 py-3 bg-primary-500 text-white rounded-xl font-semibold hover:bg-primary-600 transition-colors text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sending ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Envoi...</>
            ) : (
              <><Send className="w-4 h-4" /> Envoyer</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

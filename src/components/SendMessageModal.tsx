import React, { useState, useRef } from 'react';
import { X, Send, Paperclip, Loader2, FileText, Trash2, AlertCircle } from 'lucide-react';
import { sendTravelerMessage, uploadTravelerFile } from '../api/trips';

interface SendMessageModalProps {
  isOpen: boolean;
  bookingId: string;
  travelerName: string;
  travelerEmail?: string;
  onClose: () => void;
  onSuccess: () => void;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

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
  const [attachments, setAttachments] = useState<{ url: string; filename: string }[]>([]);
  const [uploading, setUploading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (fileRef.current) fileRef.current.value = '';

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError('Format non supporté. PDF, JPG, PNG, WebP ou Word uniquement.');
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setError('Fichier trop volumineux (max 10 MB).');
      return;
    }

    setError('');
    setUploading(true);
    try {
      const result = await uploadTravelerFile(bookingId, file);
      setAttachments(prev => [...prev, { url: result.url, filename: result.filename || file.name }]);
    } catch (err: any) {
      setError(err?.message || 'Erreur lors de l\'upload du fichier.');
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
        attachments: attachments.length > 0 ? attachments.map(a => a.url) : undefined,
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
              <p className="text-xs font-semibold text-dark-800/50">Pièces jointes</p>
              {attachments.map((att, i) => (
                <div key={i} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className="w-4 h-4 text-primary-500 flex-shrink-0" />
                    <span className="text-sm text-dark-800 truncate">{att.filename}</span>
                  </div>
                  <button onClick={() => removeAttachment(i)} className="p-1 hover:bg-red-50 rounded transition-colors">
                    <Trash2 className="w-3.5 h-3.5 text-red-400" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Add attachment */}
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="inline-flex items-center gap-2 text-sm text-dark-800/60 hover:text-primary-500 transition-colors disabled:opacity-50"
          >
            {uploading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Upload en cours...</>
            ) : (
              <><Paperclip className="w-4 h-4" /> Joindre un fichier (PDF, image, Word — max 10 MB)</>
            )}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx"
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

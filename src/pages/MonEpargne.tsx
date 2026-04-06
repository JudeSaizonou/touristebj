import React, { useState, useEffect } from 'react';
import {
  Calendar, PiggyBank, CheckCircle, Clock,
  Loader2, AlertCircle, TrendingUp, CreditCard, ChevronLeft, Users, ArrowRight, RefreshCw, XCircle,
  Mail, FileText, Upload, Paperclip, ExternalLink, UserPlus, Send, Copy, Download
} from 'lucide-react';
import jsPDF from 'jspdf';
import { PublicLayout } from '../components/PublicLayout';
import { EpargneModal } from '../components/EpargneModal';
import { getBookingById, getBookingPayments, cancelBooking, getBookingMessages, sendBookingMessage, getBookingDocumentRequests, submitDocument, markMessageRead, getDocumentLabel, getBookingInvitations, resendInvitation, inviteGuests } from '../api/trips';
import type { BookingMessage, DocumentRequest, MappedInvitation } from '../api/trips';
import { ConfirmModal } from '../components/ConfirmModal';
import { useAuth } from '../context/AuthContext';
import type { MappedBooking, MappedPayment } from '../types';
import type { AuthMode } from './Auth';
import { fmtPrice } from '../utils/format';
import { getBookingStatus } from '../utils/statusConfig';

// ─── Invite Guests Form ──────────────────────────────────────────────────────

const InviteGuestsForm: React.FC<{
  bookingId: string;
  maxGuests: number;
  onInvited: () => void;
}> = ({ bookingId, maxGuests, onInvited }) => {
  const [guests, setGuests] = useState([{ name: '', email: '' }]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const addRow = () => {
    if (guests.length < Math.max(1, maxGuests)) setGuests([...guests, { name: '', email: '' }]);
  };

  const updateGuest = (i: number, field: 'name' | 'email', value: string) => {
    setGuests(prev => prev.map((g, idx) => idx === i ? { ...g, [field]: value } : g));
  };

  const removeRow = (i: number) => {
    if (guests.length > 1) setGuests(prev => prev.filter((_, idx) => idx !== i));
  };

  const isValid = guests.every(g => g.name.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(g.email));

  const handleSubmit = async () => {
    if (!isValid || sending) return;
    setSending(true);
    setError('');
    setSuccess('');
    try {
      await inviteGuests(bookingId, guests.map(g => ({ name: g.name.trim(), email: g.email.trim() })));
      setSuccess(`${guests.length} invitation(s) envoyée(s) !`);
      setGuests([{ name: '', email: '' }]);
      onInvited();
    } catch (e: any) {
      setError(e?.message || 'Impossible d\'envoyer les invitations.');
    } finally {
      setSending(false);
    }
  };

  if (maxGuests <= 0) return null;

  return (
    <div className="bg-primary-50/50 border border-primary-100 rounded-xl p-4">
      <p className="text-sm font-semibold text-dark-800 mb-3">
        Inviter vos compagnons de voyage
      </p>
      <div className="space-y-2">
        {guests.map((g, i) => (
          <div key={i} className="flex gap-2">
            <input
              type="text"
              placeholder="Nom complet"
              value={g.name}
              onChange={e => updateGuest(i, 'name', e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30"
            />
            <input
              type="email"
              placeholder="Email"
              value={g.email}
              onChange={e => updateGuest(i, 'email', e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30"
            />
            {guests.length > 1 && (
              <button onClick={() => removeRow(i)} className="p-2 text-gray-400 hover:text-red-500">
                <XCircle className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2 mt-3">
        {guests.length < maxGuests && (
          <button onClick={addRow} className="text-xs text-primary-600 hover:text-primary-700 font-medium">
            + Ajouter un invité
          </button>
        )}
        <div className="flex-1" />
        <button
          onClick={handleSubmit}
          disabled={!isValid || sending}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary-500 text-white rounded-lg text-sm font-semibold hover:bg-primary-600 transition-colors disabled:opacity-50"
        >
          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          {sending ? 'Envoi...' : 'Envoyer'}
        </button>
      </div>
      {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
      {success && <p className="text-xs text-green-600 mt-2 flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5" /> {success}</p>}
    </div>
  );
};

// ─── Main Component ──────────────────────────────────────────────────────────

interface MonEpargneProps {
  bookingId: string;
  onBack: () => void;
  onAdminLogin?: () => void;
  onOpenAuth?: (mode: AuthMode) => void;
  onMesVoyages?: () => void;
  onLogout?: () => void;
}

export const MonEpargne: React.FC<MonEpargneProps> = ({
  bookingId,
  onBack,
  onAdminLogin,
  onOpenAuth,
  onMesVoyages,
  onLogout,
}) => {
  const { user } = useAuth();
  const [booking, setBooking] = useState<MappedBooking | null>(null);
  const [payments, setPayments] = useState<MappedPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [epargneOpen, setEpargneOpen] = useState(false);
  const [retryPayment, setRetryPayment] = useState<{ type: 'DEPOSIT' | 'INSTALLMENT'; amount: number } | null>(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [messages, setMessages] = useState<BookingMessage[]>([]);
  const [docRequests, setDocRequests] = useState<DocumentRequest[]>([]);
  const [uploadingDocId, setUploadingDocId] = useState<string | null>(null);
  const [invitations, setInvitations] = useState<MappedInvitation[]>([]);
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);

  useEffect(() => {
    if (!user) {
      onOpenAuth?.('connexion');
      onBack();
    }
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    setError('');
    try {
      const [b, p, msgsRes, docsRes, invs] = await Promise.all([
        getBookingById(bookingId),
        getBookingPayments(bookingId),
        getBookingMessages(bookingId).catch(() => ({ messages: [] as BookingMessage[], unreadCount: 0 })),
        getBookingDocumentRequests(bookingId).catch(() => ({ documents: [] as DocumentRequest[], summary: { total: 0, pending: 0, submitted: 0, approved: 0, rejected: 0 } })),
        getBookingInvitations(bookingId).catch(() => [] as MappedInvitation[]),
      ]);
      setBooking(b);
      setPayments(p);
      setMessages(msgsRes.messages);
      setDocRequests(docsRes.documents);
      setInvitations(invs);
    } catch (err: any) {
      const msg: string = err?.message || '';
      const is401 = msg.toLowerCase().includes('token') || msg.includes('401') || msg.includes('Unauthorized');
      if (is401) {
        onOpenAuth?.('connexion');
        onBack();
        return;
      }
      setError(msg || 'Impossible de charger les détails.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (bookingId && user) loadData(); }, [bookingId, user]);

  const percent = booking && booking.totalPrice > 0
    ? Math.min(100, Math.round((booking.amountPaid / booking.totalPrice) * 100))
    : 0;

  const daysLeft = booking?.paymentDeadline
    ? Math.max(0, Math.ceil((new Date(booking.paymentDeadline).getTime() - Date.now()) / 86400000))
    : null;

  const isUrgent = daysLeft !== null && daysLeft <= 14;
  const status = booking ? getBookingStatus(booking.status) : null;
  const isComplete = booking && ['FULLY_PAID', 'COMPLETED'].includes(booking.status);
  const isCancelled = booking && booking.status === 'CANCELLED';
  const needsDeposit = booking && booking.status === 'PENDING_DEPOSIT';
  const canPay = booking && !['FULLY_PAID', 'COMPLETED', 'CANCELLED', 'REFUNDED'].includes(booking.status) && (booking.remainingAmount ?? 1) > 0;
  const canCancel = booking && booking.amountPaid === 0 && !['CANCELLED', 'COMPLETED', 'FULLY_PAID', 'REFUNDED'].includes(booking.status);

  const handleCancel = async () => {
    if (!booking || cancelling) return;
    setCancelling(true);
    try {
      await cancelBooking(booking.id);
      await loadData();
      setShowCancelConfirm(false);
    } catch (e: any) {
      setError(e?.message || 'Impossible d\'annuler la réservation.');
    } finally {
      setCancelling(false);
    }
  };

  const handleSendReply = async () => {
    if (!replyText.trim() || sendingReply) return;
    setSendingReply(true);
    try {
      await sendBookingMessage(bookingId, replyText.trim());
      setReplyText('');
      const msgsRes = await getBookingMessages(bookingId);
      setMessages(msgsRes.messages);
    } catch {
      setError('Impossible d\'envoyer le message.');
    } finally {
      setSendingReply(false);
    }
  };

  const generatePaymentReceipt = (bk: MappedBooking, payment: MappedPayment) => {
    const doc = new jsPDF();
    const pw = doc.internal.pageSize.getWidth();
    const userPhone = user?.phoneNumber || '';
    const userName = user?.username || '';

    // Header bar
    doc.setFillColor(36, 36, 36);
    doc.rect(0, 0, pw, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('Le Touriste.bj', 20, 22);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Reçu de paiement', 20, 32);

    // Receipt number
    doc.setTextColor(130, 130, 130);
    doc.setFontSize(9);
    const receiptNum = `REC-${(bk.bookingNumber || bk.id).slice(-8).toUpperCase()}`;
    doc.text(receiptNum, pw - 20, 28, { align: 'right' });

    // Status badge
    doc.setFillColor(34, 197, 94);
    doc.roundedRect(pw - 58, 10, 38, 12, 3, 3, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('CONFIRME', pw - 39, 18, { align: 'center' });

    // Body
    doc.setTextColor(60, 60, 60);
    let y = 56;
    const lh = 12;
    const labelX = 25;
    const valX = 95;

    const addRow = (label: string, value: string) => {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(130, 130, 130);
      doc.text(label, labelX, y);
      doc.setTextColor(40, 40, 40);
      doc.setFont('helvetica', 'bold');
      doc.text(value, valX, y);
      y += lh;
    };

    // Client info section
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(40, 40, 40);
    doc.text('Client', labelX, y);
    y += 8;

    if (userName) addRow('Nom', userName);
    if (userPhone) addRow('Telephone', userPhone);
    y += 4;

    // Separator
    doc.setDrawColor(220, 220, 220);
    doc.line(labelX, y, pw - 25, y);
    y += 10;

    // Booking info section
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(40, 40, 40);
    doc.text('Details du paiement', labelX, y);
    y += 8;

    addRow('Reference', bk.bookingNumber || bk.id.slice(-10).toUpperCase());
    addRow('Voyage', bk.voyage?.titre || '-');
    addRow('Destination', bk.voyage?.destination || '-');
    addRow('Type', (payment.type || '').toUpperCase().includes('DEPOSIT') ? 'Acompte' : 'Versement epargne');
    addRow('Montant', fmtPrice(payment.amount));
    addRow('Methode', payment.paymentMethod === 'mtn' ? 'MTN Mobile Money' : payment.paymentMethod === 'kkiapay' ? 'KKiaPay (Carte/Mobile)' : (payment.paymentMethod || '-'));
    addRow('Date', payment.date || '-');

    // Amount highlight box
    y += 6;
    doc.setFillColor(245, 245, 245);
    doc.roundedRect(labelX, y, pw - 50, 22, 4, 4, 'F');
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text('Total paye', labelX + 8, y + 9);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(34, 197, 94);
    doc.text(fmtPrice(payment.amount), pw - 33, y + 15, { align: 'right' });

    // Footer
    y += 36;
    doc.setDrawColor(220, 220, 220);
    doc.line(labelX, y, pw - 25, y);
    y += 8;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(150, 150, 150);
    doc.text('Ce recu est genere automatiquement par Le Touriste.bj', pw / 2, y, { align: 'center' });
    doc.text('Paiement securise via MTN MoMo / KKiaPay', pw / 2, y + 5, { align: 'center' });
    doc.text(`Genere le ${new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`, pw / 2, y + 10, { align: 'center' });

    doc.save(`recu-${receiptNum}-${payment.date?.replace(/\//g, '-') || payment.id}.pdf`);
  };

  return (
    <PublicLayout onAdminLogin={onAdminLogin} onOpenAuth={onOpenAuth} onMesVoyages={onMesVoyages} onLogout={onLogout}>

      {loading && (
        <div className="flex flex-col items-center py-32 gap-4">
          <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
          <p className="text-dark-800/50">Chargement...</p>
        </div>
      )}

      {!loading && error && (
        <div className="flex flex-col items-center py-24 gap-4">
          <AlertCircle className="w-8 h-8 text-red-400" />
          <p className="text-red-600 font-medium">{error}</p>
          <button onClick={loadData} className="px-6 py-2.5 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-colors text-sm font-semibold">
            Réessayer
          </button>
        </div>
      )}

      {!loading && !error && booking && (
        <>
          {/* Compact header */}
          <div className="bg-gradient-to-r from-dark-800 to-dark-700 text-white">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
              <button onClick={onBack} className="flex items-center gap-1.5 text-white/50 hover:text-white text-sm mb-3 transition-colors">
                <ChevronLeft className="w-4 h-4" /> Mes Voyages
              </button>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h1 className="font-playfair text-2xl sm:text-3xl font-bold">{booking.voyage?.titre || 'Mon Épargne'}</h1>
                  <p className="text-white/50 text-sm mt-1">{booking.voyage?.destination}</p>
                </div>
                {status && (
                  <span className={`self-start sm:self-center text-xs font-semibold px-3 py-1.5 rounded-full border ${status.style}`}>
                    {status.label}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">

            {/* Progression principale */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6 shadow-sm mb-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary-500" />
                  <h2 className="font-bold text-dark-800">Progression</h2>
                </div>
                <span className={`text-2xl font-bold ${percent >= 100 ? 'text-green-500' : 'text-dark-800'}`}>{percent}%</span>
              </div>

              {/* Grande barre de progression */}
              <div className="h-4 bg-gray-100 rounded-full overflow-hidden mb-5">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${
                    percent >= 100 ? 'bg-green-500' : isUrgent ? 'bg-red-400' : 'bg-primary-500'
                  }`}
                  style={{ width: `${percent}%` }}
                />
              </div>

              {/* Stats en ligne */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="text-center p-3 bg-gray-50 rounded-xl">
                  <p className="text-[10px] sm:text-xs text-dark-800/40 mb-1">Total voyage</p>
                  <p className="font-bold text-dark-800 text-sm">{fmtPrice(booking.totalPrice)}</p>
                </div>
                <div className={`text-center p-3 rounded-xl ${booking.depositPaid ? 'bg-emerald-50' : 'bg-amber-50'}`}>
                  <p className="text-[10px] sm:text-xs text-dark-800/40 mb-1">Acompte {booking.depositPaid ? 'versé' : 'requis'}</p>
                  <p className={`font-bold text-sm ${booking.depositPaid ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {fmtPrice(booking.depositAmount)}
                  </p>
                  {booking.depositPaid && <p className="text-[9px] text-emerald-500 mt-0.5">Non remboursable</p>}
                </div>
                <div className="text-center p-3 bg-green-50 rounded-xl">
                  <p className="text-[10px] sm:text-xs text-dark-800/40 mb-1">Total payé</p>
                  <p className="font-bold text-green-600 text-sm">{fmtPrice(booking.amountPaid)}</p>
                  {booking.depositPaid && booking.amountPaid > booking.depositAmount && (
                    <p className="text-[9px] text-green-500 mt-0.5">
                      Acompte + {fmtPrice(booking.amountPaid - booking.depositAmount)} épargne
                    </p>
                  )}
                </div>
                <div className={`text-center p-3 rounded-xl ${booking.remainingAmount > 0 ? 'bg-amber-50' : 'bg-green-50'}`}>
                  <p className="text-[10px] sm:text-xs text-dark-800/40 mb-1">Restant</p>
                  <p className={`font-bold text-sm ${booking.remainingAmount > 0 ? 'text-amber-600' : 'text-green-600'}`}>
                    {fmtPrice(booking.remainingAmount)}
                  </p>
                </div>
              </div>

              {/* Projection d'épargne */}
              {booking.remainingAmount > 0 && daysLeft !== null && daysLeft > 0 && (
                <div className="mt-4 bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <p className="text-xs font-semibold text-blue-800 mb-2 flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4" /> Projection d'épargne
                  </p>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    {[
                      { label: '/semaine', weeks: Math.max(1, Math.ceil(daysLeft / 7)) },
                      { label: '/2 sem.', weeks: Math.max(1, Math.ceil(daysLeft / 14)) },
                      { label: '/mois', weeks: Math.max(1, Math.ceil(daysLeft / 30)) },
                    ].map(({ label, weeks }) => (
                      <div key={label} className="bg-white rounded-lg p-2.5">
                        <p className="text-[10px] text-blue-600/60 mb-0.5">{label}</p>
                        <p className="text-sm font-bold text-blue-800">
                          {fmtPrice(Math.ceil(booking.remainingAmount / weeks))}
                        </p>
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] text-blue-600/50 mt-2 text-center">
                    Pour solder avant l'échéance ({daysLeft} jours restants)
                  </p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Colonne gauche : historique */}
              <div className="lg:col-span-2">
                <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6 shadow-sm">
                  <div className="flex items-center gap-2 mb-5">
                    <CreditCard className="w-5 h-5 text-dark-800/70" />
                    <h2 className="font-bold text-dark-800">Historique des paiements</h2>
                  </div>

                  {payments.length === 0 ? (
                    <div className="text-center py-10">
                      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <CreditCard className="w-5 h-5 text-gray-300" />
                      </div>
                      <p className="text-dark-800/40 text-sm">Aucun paiement enregistré</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {payments.map(p => {
                        const isSuccess = ['success', 'completed'].includes((p.status || '').toLowerCase());
                        const isPending = (p.status || '').toLowerCase() === 'pending';
                        const isExpired = (p.status || '').toLowerCase() === 'expired';
                        const isFailed = !isSuccess && !isPending && !isExpired;
                        return (
                          <div key={p.id} className={`flex items-center justify-between p-3 rounded-xl gap-3 ${isPending || isFailed || isExpired ? 'bg-gray-50/50' : 'hover:bg-gray-50'} transition-colors`}>
                            <div className="flex items-center gap-3 min-w-0">
                              <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                                isPending ? 'bg-amber-100' : isExpired ? 'bg-gray-100' : isFailed ? 'bg-red-100' : p.type === 'DEPOSIT' ? 'bg-blue-100' : 'bg-primary-50'
                              }`}>
                                {isPending
                                  ? <Clock className="w-4 h-4 text-amber-500" />
                                  : isExpired
                                  ? <Clock className="w-4 h-4 text-gray-400" />
                                  : isFailed
                                  ? <AlertCircle className="w-4 h-4 text-red-500" />
                                  : p.type === 'DEPOSIT'
                                  ? <CheckCircle className="w-4 h-4 text-blue-500" />
                                  : <PiggyBank className="w-4 h-4 text-primary-500" />
                                }
                              </div>
                              <div className="min-w-0">
                                <p className={`text-sm font-medium ${isPending || isFailed || isExpired ? 'text-dark-800/50' : 'text-dark-800'}`}>
                                  {(p.type || '').toUpperCase().includes('DEPOSIT') ? 'Acompte' : 'Versement'}
                                </p>
                                <p className="text-xs text-dark-800/40">{p.date}</p>
                              </div>
                            </div>
                            <div className="text-right flex-shrink-0 flex items-center gap-2">
                              <div>
                                <p className={`font-bold text-sm ${isPending || isFailed || isExpired ? 'text-dark-800/40 line-through' : 'text-dark-800'}`}>{fmtPrice(p.amount)}</p>
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                                  isSuccess ? 'bg-green-100 text-green-600'
                                    : isPending ? 'bg-amber-100 text-amber-600'
                                    : isExpired ? 'bg-gray-100 text-gray-500'
                                    : 'bg-red-100 text-red-600'
                                }`}>
                                  {isSuccess ? 'Confirmé' : isPending ? 'En attente' : isExpired ? 'Expiré' : 'Échoué'}
                                </span>
                              </div>
                              {isSuccess && booking && (
                                <button
                                  onClick={() => generatePaymentReceipt(booking, p)}
                                  className="p-2 bg-gray-100 text-dark-800/60 rounded-lg hover:bg-gray-200 transition-colors"
                                  title="Télécharger le reçu"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                </button>
                              )}
                              {(isPending || isFailed || isExpired) && (
                                <button
                                  onClick={() => {
                                    const pType = (p.type || '').toUpperCase().includes('DEPOSIT') ? 'DEPOSIT' as const : 'INSTALLMENT' as const;
                                    setRetryPayment({ type: pType, amount: p.amount });
                                    setEpargneOpen(true);
                                  }}
                                  disabled={epargneOpen}
                                  className="p-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50"
                                  title="Repayer"
                                >
                                  <RefreshCw className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Messages de l'organisateur */}
              {messages.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6 shadow-sm">
                  <div className="flex items-center gap-2 mb-5">
                    <Mail className="w-5 h-5 text-blue-500" />
                    <h2 className="font-bold text-dark-800">Messages</h2>
                    {messages.filter(m => !m.read).length > 0 && (
                      <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                        {messages.filter(m => !m.read).length}
                      </span>
                    )}
                  </div>
                  <div className="space-y-3">
                    {messages.map(msg => (
                      <div
                        key={msg.id}
                        className={`rounded-xl p-4 border transition-colors ${!msg.read ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-100'}`}
                        onClick={() => { if (!msg.read) markMessageRead(bookingId, msg.id).then(() => setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, read: true } : m))).catch(() => {}); }}
                      >
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <p className="text-sm font-semibold text-dark-800">{msg.subject}</p>
                          {!msg.read && <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1.5" />}
                        </div>
                        <p className="text-sm text-dark-800/70 whitespace-pre-line">{msg.message}</p>
                        {msg.attachments && msg.attachments.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-3">
                            {msg.attachments.map((att, i) => (
                              <a
                                key={i}
                                href={att.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-xs text-primary-600 hover:bg-primary-50 transition-colors"
                              >
                                <FileText className="w-3.5 h-3.5" />
                                {att.filename}
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            ))}
                          </div>
                        )}
                        <div className="flex items-center justify-between mt-2">
                          <p className="text-[10px] text-dark-800/30">
                            {msg.sentAt ? new Date(msg.sentAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}
                          </p>
                          {msg.sender && <p className="text-[10px] text-dark-800/30">{msg.sender}</p>}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Reply form */}
                  <div className="mt-4 flex gap-2">
                    <textarea
                      value={replyText}
                      onChange={e => setReplyText(e.target.value)}
                      placeholder="Répondre..."
                      rows={2}
                      className="flex-1 text-sm border border-gray-200 rounded-xl px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400"
                      disabled={sendingReply}
                    />
                    <button
                      onClick={handleSendReply}
                      disabled={sendingReply || !replyText.trim()}
                      className="self-end p-2.5 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-colors disabled:opacity-50"
                      title="Envoyer"
                    >
                      {sendingReply ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}

              {/* Documents demandés */}
              {docRequests.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6 shadow-sm">
                  <div className="flex items-center gap-2 mb-5">
                    <FileText className="w-5 h-5 text-amber-500" />
                    <h2 className="font-bold text-dark-800">Documents demandés</h2>
                    {docRequests.filter(d => d.status === 'pending').length > 0 && (
                      <span className="bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                        {docRequests.filter(d => d.status === 'pending').length} à fournir
                      </span>
                    )}
                  </div>
                  <div className="space-y-3">
                    {docRequests.map(doc => (
                      <div key={doc.id} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm font-semibold text-dark-800">{getDocumentLabel(doc)}</p>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium border ${
                            doc.status === 'approved' ? 'bg-green-100 text-green-600 border-green-200'
                              : doc.status === 'submitted' ? 'bg-blue-100 text-blue-600 border-blue-200'
                              : doc.status === 'rejected' ? 'bg-red-100 text-red-600 border-red-200'
                              : 'bg-amber-100 text-amber-600 border-amber-200'
                          }`}>
                            {doc.status === 'approved' ? 'Validé' : doc.status === 'submitted' ? 'Soumis' : doc.status === 'rejected' ? 'Refusé' : 'À fournir'}
                          </span>
                        </div>
                        {doc.notes && <p className="text-xs text-dark-800/50 mb-2">{doc.notes}</p>}
                        {doc.rejectionReason && doc.status === 'rejected' && (
                          <p className="text-xs text-red-500 mb-3 flex items-center gap-1">
                            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" /> {doc.rejectionReason}
                          </p>
                        )}
                        {(doc.status === 'pending' || doc.status === 'rejected') && (
                          <label className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-500 text-white rounded-xl text-sm font-semibold hover:bg-primary-600 transition-colors cursor-pointer">
                            {uploadingDocId === doc.id ? (
                              <><Loader2 className="w-4 h-4 animate-spin" /> Envoi en cours...</>
                            ) : (
                              <><Upload className="w-4 h-4" /> {doc.status === 'rejected' ? 'Renvoyer le document' : 'Envoyer le document'}</>
                            )}
                            <input
                              type="file"
                              accept="application/pdf,image/jpeg,image/png"
                              className="hidden"
                              disabled={uploadingDocId === doc.id}
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                setUploadingDocId(doc.id);
                                try {
                                  await submitDocument(bookingId, doc.id, file);
                                  setDocRequests(prev => prev.map(d => d.id === doc.id ? { ...d, status: 'submitted' as const } : d));
                                } catch {
                                  setError('Erreur lors de l\'envoi du document.');
                                } finally {
                                  setUploadingDocId(null);
                                }
                                if (e.target) e.target.value = '';
                              }}
                            />
                          </label>
                        )}
                        {doc.status === 'submitted' && (
                          <p className="text-xs text-blue-500 mt-2 flex items-center gap-1">
                            <CheckCircle className="w-3.5 h-3.5" /> Document envoyé — en attente de validation
                          </p>
                        )}
                        {doc.status === 'approved' && (
                          <p className="text-xs text-green-500 mt-2 flex items-center gap-1">
                            <CheckCircle className="w-3.5 h-3.5" /> Document validé
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Invitations */}
              {booking.nombrePersonnes > 1 && booking.depositPaid && !['CANCELLED'].includes(booking.status) && (
                <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6 shadow-sm">
                  <div className="flex items-center gap-2 mb-5">
                    <UserPlus className="w-5 h-5 text-primary-500" />
                    <h2 className="font-bold text-dark-800">Inviter des compagnons</h2>
                    {invitations.length > 0 && (
                      <span className="bg-primary-100 text-primary-600 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        {invitations.filter(i => i.status === 'accepted').length}/{booking.nombrePersonnes - 1}
                      </span>
                    )}
                  </div>

                  {/* Formulaire d'invitation */}
                  {invitations.filter(i => i.status === 'accepted').length < booking.nombrePersonnes - 1 && (
                    <InviteGuestsForm
                      bookingId={bookingId}
                      maxGuests={booking.nombrePersonnes - 1 - invitations.length}
                      onInvited={async () => {
                        try {
                          const invs = await getBookingInvitations(bookingId);
                          setInvitations(invs);
                        } catch {}
                      }}
                    />
                  )}

                  {/* Liste des invitations envoyées */}
                  <div className="space-y-3 mt-4">
                    {invitations.map(inv => {
                      const isExpired = inv.status === 'expired';
                      const isPending = inv.status === 'pending';
                      const isAccepted = inv.status === 'accepted';
                      const canResend = isExpired || isPending;
                      const invLink = `${window.location.origin}/invitation/${inv.inviteToken}`;

                      return (
                        <div key={inv.id} className={`rounded-xl p-4 border transition-colors ${
                          isAccepted ? 'bg-green-50 border-green-200' : isExpired ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-100'
                        }`}>
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-dark-800 truncate">{inv.guestName}</p>
                              <p className="text-xs text-dark-800/50 truncate">{inv.guestEmail}</p>
                            </div>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium border flex-shrink-0 ${
                              isAccepted ? 'bg-green-100 text-green-600 border-green-200'
                                : isExpired ? 'bg-red-100 text-red-600 border-red-200'
                                : 'bg-amber-100 text-amber-600 border-amber-200'
                            }`}>
                              {isAccepted ? 'Acceptée' : isExpired ? 'Expirée' : 'En attente'}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-[10px] text-dark-800/40 mb-3">
                            <Clock className="w-3 h-3" />
                            Envoyée le {new Date(inv.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                            {inv.paymentMode === 'pay_all' && (
                              <span className="ml-1 text-green-600 font-medium">• Place payée</span>
                            )}
                          </div>

                          {canResend && (
                            <div className="flex gap-2">
                              <button
                                onClick={async () => {
                                  setResendingId(inv.id);
                                  try {
                                    const updated = await resendInvitation(bookingId, { name: inv.guestName, email: inv.guestEmail });
                                    setInvitations(prev => {
                                      const newIds = new Set(updated.map(u => u.guestEmail));
                                      return [
                                        ...prev.filter(p => !newIds.has(p.guestEmail)),
                                        ...updated,
                                      ];
                                    });
                                  } catch {
                                    setError('Impossible de relancer l\'invitation.');
                                  } finally {
                                    setResendingId(null);
                                  }
                                }}
                                disabled={resendingId === inv.id}
                                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-primary-500 text-white rounded-lg text-xs font-semibold hover:bg-primary-600 transition-colors disabled:opacity-50"
                              >
                                {resendingId === inv.id ? (
                                  <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Envoi...</>
                                ) : (
                                  <><Send className="w-3.5 h-3.5" /> Relancer</>
                                )}
                              </button>
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(invLink);
                                  setCopiedToken(inv.id);
                                  setTimeout(() => setCopiedToken(null), 2000);
                                }}
                                className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 text-dark-800/70 rounded-lg text-xs font-medium hover:bg-gray-100 transition-colors"
                                title="Copier le lien d'invitation"
                              >
                                {copiedToken === inv.id ? (
                                  <><CheckCircle className="w-3.5 h-3.5 text-green-500" /> Copié</>
                                ) : (
                                  <><Copy className="w-3.5 h-3.5" /> Lien</>
                                )}
                              </button>
                            </div>
                          )}

                          {isAccepted && (
                            <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
                              <CheckCircle className="w-3.5 h-3.5" />
                              Acceptée {inv.acceptedAt ? `le ${new Date(inv.acceptedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}` : ''}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Colonne droite : actions + infos */}
              <div className="space-y-4">

                {/* Échéance */}
                {daysLeft !== null && canPay && (
                  <div className={`rounded-2xl p-5 border ${isUrgent ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <Clock className={`w-4 h-4 ${isUrgent ? 'text-red-500' : 'text-amber-500'}`} />
                      <p className={`text-xs font-semibold ${isUrgent ? 'text-red-600' : 'text-amber-600'}`}>
                        Date limite
                      </p>
                    </div>
                    <p className={`text-3xl font-bold font-playfair ${isUrgent ? 'text-red-700' : 'text-amber-700'}`}>
                      {daysLeft} <span className="text-lg">jours</span>
                    </p>
                    {booking.paymentDeadline && (
                      <p className={`text-xs mt-1 ${isUrgent ? 'text-red-500/70' : 'text-amber-600/70'}`}>
                        {new Date(booking.paymentDeadline).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </p>
                    )}
                  </div>
                )}

                {/* Bouton payer acompte */}
                {canPay && needsDeposit && (
                  <button
                    onClick={() => { setRetryPayment({ type: 'DEPOSIT', amount: booking.depositAmount }); setEpargneOpen(true); }}
                    className="w-full py-4 bg-primary-500 text-white rounded-2xl font-semibold hover:bg-primary-600 transition-all hover:shadow-lg hover:shadow-primary-500/25 flex items-center justify-center gap-2 text-base"
                  >
                    <CreditCard className="w-5 h-5" />
                    Payer l'acompte ({fmtPrice(booking.depositAmount)})
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}

                {/* Bouton épargner (après acompte payé) */}
                {canPay && !needsDeposit && (
                  <button
                    onClick={() => { setRetryPayment(null); setEpargneOpen(true); }}
                    className="w-full py-4 bg-primary-500 text-white rounded-2xl font-semibold hover:bg-primary-600 transition-all hover:shadow-lg hover:shadow-primary-500/25 flex items-center justify-center gap-2 text-base"
                  >
                    <PiggyBank className="w-5 h-5" />
                    Ajouter un versement
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}

                {/* Bouton annuler */}
                {canCancel && (
                  <button
                    onClick={() => setShowCancelConfirm(true)}
                    className="w-full py-3 border border-red-200 text-red-500 rounded-2xl font-medium hover:bg-red-50 transition-colors flex items-center justify-center gap-2 text-sm"
                  >
                    <XCircle className="w-4 h-4" />
                    Annuler cette réservation
                  </button>
                )}

                {/* Voyage payé */}
                {isComplete && (
                  <div className="bg-green-50 border border-green-200 rounded-2xl p-5 text-center">
                    <CheckCircle className="w-10 h-10 text-green-500 mx-auto mb-2" />
                    <p className="font-bold text-green-700">Voyage intégralement payé !</p>
                    <p className="text-xs text-green-600/70 mt-1">Préparez vos bagages, l'aventure vous attend.</p>
                  </div>
                )}

                {/* Réservation annulée */}
                {isCancelled && (
                  <div className="bg-red-50 border border-red-200 rounded-2xl p-5 text-center">
                    <XCircle className="w-10 h-10 text-red-400 mx-auto mb-2" />
                    <p className="font-bold text-red-600">Réservation annulée</p>
                    <p className="text-xs text-red-500/70 mt-1">Cette réservation a été annulée.</p>
                    <button
                      onClick={onBack}
                      className="mt-3 px-6 py-2.5 bg-primary-500 text-white rounded-xl font-semibold hover:bg-primary-600 transition-colors text-sm"
                    >
                      Retour à mes voyages
                    </button>
                  </div>
                )}

                {/* Infos voyage */}
                <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm space-y-3">
                  <h3 className="font-bold text-dark-800 text-sm">Détails du voyage</h3>
                  {booking.voyage?.departureDate && (
                    <div className="flex items-center gap-2 text-sm text-dark-800/60">
                      <Calendar className="w-4 h-4 text-primary-500 flex-shrink-0" />
                      <span>{booking.voyage.departureDate}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm text-dark-800/60">
                    <Users className="w-4 h-4 text-primary-500 flex-shrink-0" />
                    <span>{booking.nombrePersonnes} personne{booking.nombrePersonnes > 1 ? 's' : ''}</span>
                  </div>
                  <div className="pt-3 border-t border-gray-100">
                    <p className="text-xs text-dark-800/40 mb-0.5">Acompte versé</p>
                    <p className="font-semibold text-dark-800">{fmtPrice(booking.depositAmount)}</p>
                    <p className="text-[10px] text-red-400 mt-0.5">Non remboursable</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      <EpargneModal
        isOpen={epargneOpen}
        booking={booking}
        onClose={() => { setEpargneOpen(false); setRetryPayment(null); }}
        onSuccess={() => { setRetryPayment(null); loadData(); }}
        forceType={retryPayment?.type}
        defaultAmount={retryPayment?.amount}
      />

      <ConfirmModal
        isOpen={showCancelConfirm}
        title="Annuler la réservation"
        message="Êtes-vous sûr de vouloir annuler cette réservation ? Cette action est irréversible."
        confirmLabel="Oui, annuler"
        loading={cancelling}
        onConfirm={handleCancel}
        onCancel={() => setShowCancelConfirm(false)}
      />
    </PublicLayout>
  );
};

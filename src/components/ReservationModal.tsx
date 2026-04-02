import React, { useState, useEffect } from 'react';
import { X, Users, Calendar, AlertTriangle, CheckCircle, Loader2, Phone, RefreshCw, AlertCircle, Mail, ChevronRight, UserPlus, Send, CreditCard, Wallet } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { createBooking, inviteGuests } from '../api/trips';
import { payBookingMtn, payDepositKkiapay, verifyKkiapayTransaction } from '../api/payments';
import { openKkiapay } from '../api/kkiapay';
import { usePaymentPolling } from '../hooks/usePaymentPolling';
import { PAYMENT_FEES, KKIAPAY_KEY } from '../config/payments';
import type { GroupPaymentMode } from '../types';

interface ReservationModalProps {
  isOpen: boolean;
  voyage: any;
  onClose: () => void;
  onSuccess: (bookingId: string) => void;
}

type Step =
  | 'summary'
  | 'group-mode'
  | 'contact-form'
  | 'creating'
  | 'payment-form'
  | 'paying'
  | 'processing'
  | 'successful'
  | 'invite-guests'
  | 'inviting'
  | 'invites-sent'
  | 'error';

type PaymentMethod = 'mtn' | 'kkiapay';

export const ReservationModal: React.FC<ReservationModalProps> = ({
  isOpen,
  voyage,
  onClose,
  onSuccess,
}) => {
  const { user } = useAuth();
  const [step, setStep] = useState<Step>('summary');
  const [nombrePersonnes, setNombrePersonnes] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('mtn');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [bookingId, setBookingId] = useState('');
  const [mtnStatus, setMtnStatus] = useState<'failed' | 'expired' | 'timeout' | null>(null);

  const { countdown, startPolling, clearTimers } = usePaymentPolling({
    onSuccess: () => setStep('successful'),
    onFailed: (status) => { setMtnStatus(status); setStep('error'); },
  });

  // Group mode
  const [groupMode, setGroupMode] = useState<GroupPaymentMode>('pay_all');

  // Invite guests
  const [guests, setGuests] = useState<{ name: string; email: string }[]>([]);
  const [inviteError, setInviteError] = useState('');

  // Contact info fields
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [specialRequests, setSpecialRequests] = useState('');
  const [emailError, setEmailError] = useState('');

  const isProcessingStep = step === 'processing';
  const canClose = !isProcessingStep && step !== 'creating' && step !== 'paying';

  useEffect(() => {
    if (isOpen && user?.phoneNumber) {
      const national = user.phoneNumber.replace(/^\+\d{1,3}/, '').replace(/\D/g, '');
      setPhoneNumber(national);
    }
  }, [isOpen, user]);

  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape' && canClose) onClose(); };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isOpen, canClose, onClose]);

  if (!isOpen || !voyage) return null;

  const basePrice = typeof voyage.totalPrice === 'number'
    ? voyage.totalPrice
    : parseFloat(String(voyage.prix || '0').replace(/[^\d]/g, '')) || 0;

  const depositPerPerson = typeof voyage.depositAmount === 'number' ? voyage.depositAmount : Math.round(basePrice * 0.3);
  const isGroup = nombrePersonnes > 1;
  const isSplit = isGroup && groupMode === 'split';

  const payingCount = isSplit ? 1 : nombrePersonnes;
  const sousTotal = basePrice * payingCount;
  const acompte = depositPerPerson * payingCount;
  const soldeRestant = sousTotal - acompte;

  const sousTotalGroupe = basePrice * nombrePersonnes;

  const mtnFees = Math.round(acompte * PAYMENT_FEES.MTN);
  const kkiapayFees = Math.round(acompte * PAYMENT_FEES.KKIAPAY);
  const fees = paymentMethod === 'mtn' ? mtnFees : kkiapayFees;
  const totalDebited = acompte + fees;

  const isPhoneValid = phoneNumber.replace(/\D/g, '').length >= 8;

  const fmtPrice = (v: number) => v.toLocaleString('fr-FR').replace(/\s/g, '.') + ' FCFA';

  const handleConfirmReservation = async () => {
    if (step !== 'contact-form') return;
    setStep('creating');
    setErrorMsg('');
    try {
      const contactInfo = {
        email: contactEmail.trim() || undefined,
        phone: contactPhone.trim() || undefined,
      };
      const booking = await createBooking(
        voyage._id || voyage.id,
        nombrePersonnes,
        contactInfo,
        specialRequests || undefined,
        isGroup ? groupMode : undefined
      );
      setBookingId(booking.id);
      setStep('payment-form');
    } catch (err: any) {
      setErrorMsg(err?.message || 'Impossible de créer la réservation.');
      setStep('error');
    }
  };

  const handlePayMtn = async () => {
    if (!isPhoneValid || !bookingId || step !== 'payment-form') return;
    setStep('paying');
    setErrorMsg('');
    try {
      const res = await payBookingMtn(bookingId, {
        amount: acompte,
        phoneNumber: phoneNumber.replace(/\D/g, ''),
        countryCode: '229',
        type: 'DEPOSIT',
      });
      setStep('processing');
      startPolling(res.referenceId);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Impossible d\'initier le paiement MTN.');
      setStep('payment-form');
    }
  };

  const handlePayKkiapay = async () => {
    if (step !== 'payment-form') return;
    if (!bookingId || !KKIAPAY_KEY) {
      setErrorMsg('KKiaPay n\'est pas configuré. Contactez le support.');
      return;
    }
    setStep('paying');
    setErrorMsg('');
    try {
      await payDepositKkiapay(bookingId, acompte);
      const result = await openKkiapay({
        amount: acompte,
        phone: phoneNumber.replace(/\D/g, '') || undefined,
        email: contactEmail || undefined,
        name: user?.username || undefined,
        description: 'Acompte voyage',
      });
      // Vérification côté serveur (sécurité anti-fraude)
      await verifyKkiapayTransaction(bookingId, result.transactionId, 'DEPOSIT');
      setStep('successful');
    } catch (err: any) {
      setErrorMsg(err?.message || 'Paiement KKiaPay échoué.');
      setStep('payment-form');
    }
  };

  const handlePay = () => {
    if (paymentMethod === 'mtn') handlePayMtn();
    else handlePayKkiapay();
  };

  const initGuestSlots = (count: number) => {
    setGuests(Array.from({ length: Math.max(0, count - 1) }, () => ({ name: '', email: '' })));
  };

  const handleSendInvites = async () => {
    if (step !== 'invite-guests') return;
    const valid = guests.every(g => g.name.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(g.email.trim()));
    if (!valid) { setInviteError('Remplissez le nom et un email valide pour chaque invité.'); return; }
    setStep('inviting');
    setInviteError('');
    try {
      await inviteGuests(bookingId, guests.map(g => ({ name: g.name.trim(), email: g.email.trim() })));
      setStep('invites-sent');
    } catch (err: any) {
      setInviteError(err?.message || "Erreur lors de l'envoi des invitations.");
      setStep('invite-guests');
    }
  };

  const handleClose = () => {
    clearTimers();
    setStep('summary');
    setNombrePersonnes(1);
    setGroupMode('pay_all');
    setGuests([]);
    setInviteError('');
    setErrorMsg('');
    setMtnStatus(null);
    setContactEmail('');
    setContactPhone('');
    setSpecialRequests('');
    setEmailError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/60" onClick={canClose ? handleClose : undefined} />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="bg-dark-800 px-6 py-5 flex items-center justify-between">
          <h2 className="font-playfair text-xl font-bold text-white">
            {step === 'successful' ? 'Réservation confirmée !' : 'Réserver ce voyage'}
          </h2>
          {canClose && (
            <button onClick={handleClose} className="text-white/60 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        <div className="p-6">
          {/* STEP: summary */}
          {step === 'summary' && (
            <div className="space-y-5">
              <div className="flex gap-3">
                {voyage.photos?.[0] && (
                  <img src={voyage.photos[0]} alt={voyage.titre} className="w-20 h-16 rounded-xl object-cover flex-shrink-0" />
                )}
                <div>
                  <p className="font-playfair font-bold text-dark-800 text-base">{voyage.titre}</p>
                  <p className="text-sm text-dark-800/60 flex items-center gap-1 mt-0.5">
                    <Calendar className="w-3.5 h-3.5" /> {voyage.dateDebut}
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-dark-800 mb-2 flex items-center gap-1.5">
                  <Users className="w-4 h-4" /> Nombre de personnes
                </label>
                <select
                  value={nombrePersonnes}
                  onChange={(e) => setNombrePersonnes(parseInt(e.target.value))}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 text-dark-800"
                >
                  {[...Array(10)].map((_, i) => (
                    <option key={i} value={i + 1}>{i + 1} personne{i > 0 ? 's' : ''}</option>
                  ))}
                </select>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 space-y-2.5">
                <div className="flex justify-between text-sm">
                  <span className="text-dark-800/60">{fmtPrice(basePrice)} × {nombrePersonnes}</span>
                  <span className="font-semibold text-dark-800">{fmtPrice(sousTotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-dark-800/60">Acompte à payer maintenant (30%)</span>
                  <span className="font-bold text-primary-500">{fmtPrice(acompte)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-dark-800/60">Solde à épargner</span>
                  <span className="font-semibold text-dark-800">{fmtPrice(soldeRestant)}</span>
                </div>
                <div className="border-t border-gray-200 pt-2.5 flex justify-between">
                  <span className="font-bold text-dark-800">Total voyage</span>
                  <span className="font-bold text-dark-800">{fmtPrice(sousTotal)}</span>
                </div>
              </div>

              <div className="flex gap-2.5 bg-amber-50 border border-amber-200 rounded-xl p-3.5">
                <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700 leading-relaxed">
                  L'acompte de <strong>{fmtPrice(acompte)}</strong> est <strong>non remboursable</strong> en cas de désistement.
                </p>
              </div>

              <button
                onClick={() => setStep(isGroup ? 'group-mode' : 'contact-form')}
                className="w-full py-3.5 bg-primary-500 text-white rounded-xl font-semibold hover:bg-primary-600 transition-colors flex items-center justify-center gap-2"
              >
                Continuer <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* STEP: group mode choice */}
          {step === 'group-mode' && (
            <div className="space-y-5">
              <p className="text-sm font-semibold text-dark-800">
                Vous réservez pour <strong>{nombrePersonnes} personnes</strong>. Comment souhaitez-vous gérer le paiement ?
              </p>

              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => setGroupMode('pay_all')}
                  className={`w-full flex items-start gap-2.5 p-3 sm:p-4 rounded-xl border-2 transition-all text-left ${
                    groupMode === 'pay_all'
                      ? 'border-primary-500 bg-orange-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <CreditCard className={`w-5 h-5 mt-0.5 flex-shrink-0 hidden sm:block ${groupMode === 'pay_all' ? 'text-primary-500' : 'text-dark-800/40'}`} />
                  <div>
                    <p className={`font-semibold text-sm ${groupMode === 'pay_all' ? 'text-primary-600' : 'text-dark-800'}`}>
                      Je paye pour tout le monde
                    </p>
                    <p className="text-xs text-dark-800/60 mt-1">
                      Vous payez l'acompte total de <strong>{fmtPrice(depositPerPerson * nombrePersonnes)}</strong> pour {nombrePersonnes} personnes. Vous inviterez vos compagnons ensuite.
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setGroupMode('split')}
                  className={`w-full flex items-start gap-2.5 p-3 sm:p-4 rounded-xl border-2 transition-all text-left ${
                    groupMode === 'split'
                      ? 'border-primary-500 bg-orange-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Users className={`w-5 h-5 mt-0.5 flex-shrink-0 hidden sm:block ${groupMode === 'split' ? 'text-primary-500' : 'text-dark-800/40'}`} />
                  <div>
                    <p className={`font-semibold text-sm ${groupMode === 'split' ? 'text-primary-600' : 'text-dark-800'}`}>
                      Chacun paye sa part
                    </p>
                    <p className="text-xs text-dark-800/60 mt-1">
                      Vous payez uniquement votre acompte de <strong>{fmtPrice(depositPerPerson)}</strong>. Vos {nombrePersonnes - 1} compagnon{nombrePersonnes > 2 ? 's' : ''} recevront une invitation pour payer leur part.
                    </p>
                  </div>
                </button>
              </div>

              {/* Récap prix selon mode */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-2.5">
                <div className="flex justify-between text-sm">
                  <span className="text-dark-800/60">Prix par personne</span>
                  <span className="font-semibold text-dark-800">{fmtPrice(basePrice)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-dark-800/60">
                    {isSplit ? 'Votre acompte (30%)' : `Acompte total (30% × ${nombrePersonnes})`}
                  </span>
                  <span className="font-bold text-primary-500">{fmtPrice(acompte)}</span>
                </div>
                {!isSplit && (
                  <div className="flex justify-between text-sm">
                    <span className="text-dark-800/60">Solde à épargner</span>
                    <span className="font-semibold text-dark-800">{fmtPrice(soldeRestant)}</span>
                  </div>
                )}
                <div className="border-t border-gray-200 pt-2.5 flex justify-between">
                  <span className="font-bold text-dark-800">{isSplit ? 'Vous payez maintenant' : 'Total voyage (groupe)'}</span>
                  <span className="font-bold text-dark-800">{fmtPrice(isSplit ? acompte : sousTotalGroupe)}</span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep('summary')}
                  className="flex-1 py-3 border border-gray-200 text-dark-800 rounded-xl font-semibold hover:bg-gray-50 transition-colors text-sm"
                >
                  Retour
                </button>
                <button
                  onClick={() => setStep('contact-form')}
                  className="flex-1 py-3.5 bg-primary-500 text-white rounded-xl font-semibold hover:bg-primary-600 transition-colors text-sm flex items-center justify-center gap-2"
                >
                  Continuer <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP: contact form */}
          {step === 'contact-form' && (
            <div className="space-y-5">
              <p className="text-sm text-dark-800/60">Informations de contact <span className="text-xs">(optionnel)</span></p>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-dark-800/70 mb-1 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5" /> Email
                  </label>
                  <input
                    type="email"
                    placeholder="votre@email.com"
                    value={contactEmail}
                    onChange={e => {
                      const val = e.target.value;
                      setContactEmail(val);
                      if (val.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim())) {
                        setEmailError("Format d'email invalide");
                      } else {
                        setEmailError('');
                      }
                    }}
                    className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 text-sm text-dark-800 ${emailError ? 'border-red-400' : 'border-gray-200'}`}
                  />
                  {emailError && (
                    <p className="text-xs text-red-500 mt-1">{emailError}</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-dark-800/70 mb-1 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5" /> Téléphone de contact
                  </label>
                  <input
                    type="tel"
                    placeholder="0197000000"
                    value={contactPhone}
                    onChange={e => setContactPhone(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 text-sm text-dark-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-dark-800/70 mb-1">Demandes particulières</label>
                <textarea
                  rows={2}
                  placeholder="Chambre non-fumeur, régime alimentaire..."
                  value={specialRequests}
                  onChange={e => setSpecialRequests(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 text-sm text-dark-800 resize-none"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(isGroup ? 'group-mode' : 'summary')}
                  className="flex-1 py-3 border border-gray-200 text-dark-800 rounded-xl font-semibold hover:bg-gray-50 transition-colors text-sm"
                >
                  Retour
                </button>
                <button
                  onClick={handleConfirmReservation}
                  disabled={!!emailError}
                  className="flex-1 py-3.5 bg-primary-500 text-white rounded-xl font-semibold hover:bg-primary-600 transition-colors text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Réserver
                </button>
              </div>
            </div>
          )}

          {/* STEP: creating booking */}
          {step === 'creating' && (
            <div className="py-12 flex flex-col items-center gap-4">
              <Loader2 className="w-10 h-10 text-primary-500 animate-spin" />
              <p className="text-dark-800/70 font-medium">Création de votre réservation...</p>
            </div>
          )}

          {/* STEP: payment form */}
          {step === 'payment-form' && (
            <div className="space-y-5">
              <div className="flex items-center gap-2 text-dark-800/60 text-sm">
                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                Réservation créée — Payez l'acompte pour confirmer
              </div>

              {/* Recap acompte */}
              <div className="bg-dark-800/5 rounded-xl p-4 text-center">
                <p className="text-xs text-dark-800/50 mb-1">Acompte à régler</p>
                <p className="font-playfair text-3xl font-bold text-dark-800">{fmtPrice(acompte)}</p>
                <p className="text-xs text-dark-800/50 mt-0.5">30% du total voyage</p>
              </div>

              {/* Choix du moyen de paiement */}
              <div>
                <p className="text-sm font-semibold text-dark-800 mb-2">Moyen de paiement</p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('mtn')}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all text-sm font-medium ${
                      paymentMethod === 'mtn'
                        ? 'border-yellow-400 bg-yellow-50 text-yellow-800'
                        : 'border-gray-200 text-dark-800/60 hover:border-gray-300'
                    }`}
                  >
                    <span className="text-2xl">📱</span>
                    <span>MTN MoMo</span>
                    <span className="text-xs font-normal opacity-70">+2% de frais</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('kkiapay')}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all text-sm font-medium ${
                      paymentMethod === 'kkiapay'
                        ? 'border-primary-500 bg-orange-50 text-orange-800'
                        : 'border-gray-200 text-dark-800/60 hover:border-gray-300'
                    }`}
                  >
                    <span className="text-2xl">💳</span>
                    <span>Carte / Mobile</span>
                    <span className="text-xs font-normal opacity-70">+0.5% de frais</span>
                  </button>
                </div>
              </div>

              {/* Champ téléphone (MTN uniquement) */}
              {paymentMethod === 'mtn' && (
                <div>
                  <label className="block text-sm font-semibold text-dark-800 mb-2 flex items-center gap-1.5">
                    <Phone className="w-4 h-4" /> Numéro MTN Bénin
                  </label>
                  <div className="flex gap-2">
                    <span className="flex items-center px-3 py-3 bg-gray-100 border border-gray-200 rounded-xl text-sm text-dark-800/70 font-medium whitespace-nowrap">
                      +229
                    </span>
                    <input
                      type="tel"
                      inputMode="numeric"
                      placeholder="0197000000"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                      className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 text-dark-800"
                    />
                  </div>
                </div>
              )}

              {/* Info KKiaPay */}
              {paymentMethod === 'kkiapay' && (
                <div className="bg-orange-50 border border-orange-200 rounded-xl p-3.5 text-sm text-orange-800">
                  Le widget KKiaPay s'ouvrira pour finaliser le paiement. Carte bancaire, Mobile Money et autres moyens acceptés. Des frais supplémentaires peuvent être appliqués par l'agrégateur de paiement.
                </div>
              )}

              {/* Récap frais */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-amber-700">Acompte</span>
                  <span className="font-semibold text-amber-800">{fmtPrice(acompte)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-amber-700">
                    Frais {paymentMethod === 'mtn' ? 'MTN (+2%)' : 'KKiaPay (+0.5%)'}
                  </span>
                  <span className="font-semibold text-amber-800">{fmtPrice(fees)}</span>
                </div>
                <div className="border-t border-amber-200 pt-1.5 flex justify-between">
                  <span className="font-bold text-amber-800">Total débité</span>
                  <span className="font-bold text-amber-900">{fmtPrice(totalDebited)}</span>
                </div>
              </div>

              {errorMsg && (
                <p className="text-sm text-red-500 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" /> {errorMsg}
                </p>
              )}

              <button
                onClick={handlePay}
                disabled={paymentMethod === 'mtn' && !isPhoneValid}
                className="w-full py-3.5 bg-primary-500 text-white rounded-xl font-semibold hover:bg-primary-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Payer {fmtPrice(totalDebited)} via {paymentMethod === 'mtn' ? 'MTN' : 'KKiaPay'}
              </button>

              <button
                onClick={() => onSuccess(bookingId)}
                className="w-full text-center text-sm text-dark-800/50 hover:text-dark-800 transition-colors"
              >
                Payer plus tard depuis "Mes Voyages"
              </button>
            </div>
          )}

          {/* STEP: paying */}
          {step === 'paying' && (
            <div className="py-12 flex flex-col items-center gap-4">
              <Loader2 className="w-10 h-10 text-primary-500 animate-spin" />
              <p className="text-dark-800/70 font-medium">
                {paymentMethod === 'mtn' ? 'Connexion à MTN Mobile Money...' : 'Ouverture de KKiaPay...'}
              </p>
            </div>
          )}

          {/* STEP: processing (MTN polling) */}
          {step === 'processing' && (
            <div className="py-6 space-y-5">
              <div className="flex flex-col items-center gap-3">
                <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center">
                  <div className="w-8 h-8 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin" />
                </div>
                <div className="text-center">
                  <p className="font-playfair font-bold text-dark-800 text-lg">En attente de confirmation</p>
                  <p className="text-sm text-dark-800/60 mt-1">
                    Confirmez le paiement sur votre téléphone MTN.
                  </p>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                <p className="text-sm font-semibold text-yellow-800 mb-2">Pour confirmer :</p>
                <ol className="space-y-1.5 text-sm text-yellow-700">
                  <li className="flex items-start gap-2"><span className="font-bold mt-0.5">1.</span> Composez <strong>*880#</strong> sur votre téléphone MTN</li>
                  <li className="flex items-start gap-2"><span className="font-bold mt-0.5">2.</span> Sélectionnez l'option <strong>8</strong> (Payer)</li>
                  <li className="flex items-start gap-2"><span className="font-bold mt-0.5">3.</span> Entrez votre <strong>code PIN MTN</strong></li>
                </ol>
              </div>

              <div className="text-center">
                <div className="inline-flex items-center gap-2 bg-gray-100 rounded-full px-4 py-2">
                  <div className={`w-2 h-2 rounded-full ${countdown > 30 ? 'bg-green-500' : 'bg-red-500'} animate-pulse`} />
                  <span className="text-sm font-medium text-dark-800">
                    Expire dans <strong>{countdown}s</strong>
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* STEP: successful */}
          {step === 'successful' && (
            <div className="py-6 space-y-5">
              <div className="flex flex-col items-center gap-3 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-green-500" />
                </div>
                <div>
                  <p className="font-playfair font-bold text-dark-800 text-xl">Réservation confirmée !</p>
                  <p className="text-sm text-dark-800/60 mt-1">
                    Votre acompte de <strong>{fmtPrice(acompte)}</strong> a été reçu. Un reçu vous sera envoyé par email.
                  </p>
                  {bookingId && (
                    <p className="text-xs text-gray-400 mt-2 font-mono">Réf: #{bookingId.slice(-8).toUpperCase()}</p>
                  )}
                </div>
              </div>
              {!isSplit && soldeRestant > 0 && (
                <div className="bg-forest-800/5 rounded-xl p-4 text-sm text-center text-dark-800/70">
                  Il vous reste <strong>{fmtPrice(soldeRestant)}</strong> à épargner avant le voyage.
                </div>
              )}
              {isGroup ? (
                <div className="space-y-3">
                  <button
                    onClick={() => { initGuestSlots(nombrePersonnes); setStep('invite-guests'); }}
                    className="w-full py-3.5 bg-primary-500 text-white rounded-xl font-semibold hover:bg-primary-600 transition-colors flex items-center justify-center gap-2"
                  >
                    <UserPlus className="w-4 h-4" />
                    Inviter mes {nombrePersonnes - 1} compagnon{nombrePersonnes > 2 ? 's' : ''}
                  </button>
                  <button
                    onClick={() => onSuccess(bookingId)}
                    className="w-full text-center text-sm text-dark-800/50 hover:text-dark-800 transition-colors"
                  >
                    Inviter plus tard depuis "Mes Voyages"
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => onSuccess(bookingId)}
                  className="w-full py-3.5 bg-primary-500 text-white rounded-xl font-semibold hover:bg-primary-600 transition-colors"
                >
                  Voir mes voyages
                </button>
              )}
            </div>
          )}

          {/* STEP: invite guests form */}
          {step === 'invite-guests' && (
            <div className="space-y-5">
              <div className="text-center">
                <p className="font-playfair font-bold text-dark-800 text-base sm:text-lg">Inviter vos compagnons</p>
                <p className="text-sm text-dark-800/60 mt-1">
                  {isSplit
                    ? 'Ils recevront un email pour s\'inscrire et payer leur acompte.'
                    : 'Leur place est déjà réservée. Ils recevront un email pour rejoindre le voyage.'}
                </p>
              </div>

              <div className="space-y-3 max-h-[40vh] overflow-y-auto">
                {guests.map((guest, i) => (
                  <div key={i} className="bg-gray-50 rounded-xl p-3 space-y-2">
                    <p className="text-xs font-semibold text-dark-800/50">Voyageur {i + 2}</p>
                    <input
                      type="text"
                      placeholder="Nom complet"
                      value={guest.name}
                      onChange={e => {
                        const updated = [...guests];
                        updated[i] = { ...updated[i], name: e.target.value };
                        setGuests(updated);
                      }}
                      className="w-full px-3 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 text-sm text-dark-800"
                    />
                    <input
                      type="email"
                      placeholder="Email"
                      value={guest.email}
                      onChange={e => {
                        const updated = [...guests];
                        updated[i] = { ...updated[i], email: e.target.value };
                        setGuests(updated);
                      }}
                      className="w-full px-3 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 text-sm text-dark-800"
                    />
                  </div>
                ))}
              </div>

              {inviteError && (
                <p className="text-sm text-red-500 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" /> {inviteError}
                </p>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => onSuccess(bookingId)}
                  className="flex-1 py-3 border border-gray-200 text-dark-800 rounded-xl font-semibold hover:bg-gray-50 transition-colors text-sm"
                >
                  Plus tard
                </button>
                <button
                  onClick={handleSendInvites}
                  disabled={guests.some(g => !g.name.trim() || !g.email.trim())}
                  className="flex-1 py-3.5 bg-primary-500 text-white rounded-xl font-semibold hover:bg-primary-600 transition-colors text-sm flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Send className="w-4 h-4" /> Envoyer
                </button>
              </div>
            </div>
          )}

          {/* STEP: sending invites */}
          {step === 'inviting' && (
            <div className="py-12 flex flex-col items-center gap-4">
              <Loader2 className="w-10 h-10 text-primary-500 animate-spin" />
              <p className="text-dark-800/70 font-medium">Envoi des invitations...</p>
            </div>
          )}

          {/* STEP: invites sent */}
          {step === 'invites-sent' && (
            <div className="py-6 space-y-5">
              <div className="flex flex-col items-center gap-3 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <Send className="w-8 h-8 text-green-500" />
                </div>
                <div>
                  <p className="font-playfair font-bold text-dark-800 text-xl">Invitations envoyées !</p>
                  <p className="text-sm text-dark-800/60 mt-1">
                    Vos {guests.length} compagnon{guests.length > 1 ? 's' : ''} recevront un email avec les instructions pour rejoindre le voyage.
                  </p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                {guests.map((g, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span className="text-dark-800">{g.name}</span>
                    <span className="text-dark-800/40">— {g.email}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => onSuccess(bookingId)}
                className="w-full py-3.5 bg-primary-500 text-white rounded-xl font-semibold hover:bg-primary-600 transition-colors"
              >
                Voir mes voyages
              </button>
            </div>
          )}

          {/* STEP: error */}
          {step === 'error' && (
            <div className="py-6 space-y-5">
              <div className="flex flex-col items-center gap-3 text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-8 h-8 text-red-500" />
                </div>
                <div>
                  <p className="font-playfair font-bold text-dark-800 text-xl">
                    {mtnStatus === 'failed' ? 'Paiement refusé'
                      : mtnStatus === 'expired' ? 'Délai expiré'
                      : mtnStatus === 'timeout' ? 'Temps écoulé'
                      : 'Erreur'}
                  </p>
                  <p className="text-sm text-red-600 mt-1">
                    {errorMsg || (mtnStatus === 'failed'
                      ? 'La transaction MTN a été refusée. Vérifiez votre solde.'
                      : 'Le délai de confirmation a expiré. Réessayez.')}
                  </p>
                </div>
              </div>

              {bookingId && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-3.5 text-xs text-blue-700 text-center">
                  Votre réservation <strong>#{bookingId.slice(-8).toUpperCase()}</strong> est enregistrée. Vous pouvez régler l'acompte depuis "Mes Voyages".
                </div>
              )}

              <div className="flex gap-3">
                {bookingId ? (
                  <button
                    onClick={() => onSuccess(bookingId)}
                    className="flex-1 py-3 border border-gray-200 text-dark-800 rounded-xl font-semibold hover:bg-gray-50 transition-colors text-sm"
                  >
                    Mes voyages
                  </button>
                ) : (
                  <button
                    onClick={handleClose}
                    className="flex-1 py-3 border border-gray-200 text-dark-800 rounded-xl font-semibold hover:bg-gray-50 transition-colors text-sm"
                  >
                    Fermer
                  </button>
                )}
                <button
                  onClick={() => { setMtnStatus(null); setStep(bookingId ? 'payment-form' : 'summary'); }}
                  className="flex-1 py-3 bg-primary-500 text-white rounded-xl font-semibold hover:bg-primary-600 transition-colors text-sm flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" /> Réessayer
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

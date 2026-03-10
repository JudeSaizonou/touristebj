import React, { useState, useEffect, useRef } from 'react';
import { X, Users, Calendar, AlertTriangle, CheckCircle, Loader2, Phone, RefreshCw, AlertCircle, Mail, ChevronRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { createBooking } from '../api/trips';
import { payBookingMtn, payDepositKkiapay, getTransactionStatus } from '../api/payments';
import { openKkiapay } from '../api/kkiapay';

interface ReservationModalProps {
  isOpen: boolean;
  voyage: any;
  onClose: () => void;
  onSuccess: (bookingId: string) => void;
}

type Step =
  | 'summary'
  | 'contact-form'
  | 'creating'
  | 'payment-form'
  | 'paying'
  | 'processing'
  | 'successful'
  | 'error';

type PaymentMethod = 'mtn' | 'kkiapay';

const MTN_FEE_RATE = 0.02;    // +2%
const KKIA_FEE_RATE = 0.005;  // +0.5%

const KKIAPAY_KEY = import.meta.env.VITE_KKIAPAY_PUBLIC_KEY as string | undefined;
const KKIAPAY_SANDBOX = import.meta.env.VITE_KKIAPAY_SANDBOX !== 'false';

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
  const [countdown, setCountdown] = useState(120);
  const [mtnStatus, setMtnStatus] = useState<'failed' | 'expired' | 'timeout' | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Contact info fields
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [specialRequests, setSpecialRequests] = useState('');

  useEffect(() => {
    if (isOpen && user?.phoneNumber) {
      const national = user.phoneNumber.replace(/^\+\d{1,3}/, '').replace(/\D/g, '');
      setPhoneNumber(national);
    }
  }, [isOpen, user]);

  const clearTimers = () => {
    if (pollRef.current) clearInterval(pollRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
  };

  useEffect(() => () => clearTimers(), []);

  if (!isOpen || !voyage) return null;

  const basePrice = typeof voyage.totalPrice === 'number'
    ? voyage.totalPrice
    : parseFloat(String(voyage.prix || '0').replace(/[^\d]/g, '')) || 0;

  const sousTotal = basePrice * nombrePersonnes;
  const depositPerPerson = typeof voyage.depositAmount === 'number' ? voyage.depositAmount : Math.round(basePrice * 0.5);
  const acompte = depositPerPerson * nombrePersonnes;
  const soldeRestant = sousTotal - acompte;

  const mtnFees = Math.round(acompte * MTN_FEE_RATE);
  const kkiaFees = Math.round(acompte * KKIA_FEE_RATE);
  const fees = paymentMethod === 'mtn' ? mtnFees : kkiaFees;
  const totalDebited = acompte + fees;

  const isPhoneValid = phoneNumber.replace(/\D/g, '').length >= 8;

  const fmtPrice = (v: number) => v.toLocaleString('fr-FR').replace(/\s/g, '.') + ' FCFA';

  const handleConfirmReservation = async () => {
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
        specialRequests || undefined
      );
      setBookingId(booking.id);
      setStep('payment-form');
    } catch (err: any) {
      setErrorMsg(err?.message || 'Impossible de créer la réservation.');
      setStep('error');
    }
  };

  const startPolling = (referenceId: string) => {
    setCountdown(120);
    setStep('processing');

    countdownRef.current = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearTimers();
          setMtnStatus('timeout');
          setStep('error');
          return 0;
        }
        return c - 1;
      });
    }, 1000);

    let elapsed = 0;
    pollRef.current = setInterval(async () => {
      elapsed += 3;
      if (elapsed >= 120) {
        clearTimers();
        setMtnStatus('timeout');
        setStep('error');
        return;
      }
      try {
        const status = await getTransactionStatus(referenceId);
        if (status.status === 'successful') {
          clearTimers();
          setStep('successful');
        } else if (status.status === 'failed' || status.status === 'expired') {
          clearTimers();
          setMtnStatus(status.status);
          setStep('error');
        }
      } catch {
        // ignore polling errors
      }
    }, 3000);
  };

  const handlePayMtn = async () => {
    if (!isPhoneValid || !bookingId) return;
    setStep('paying');
    setErrorMsg('');
    try {
      const res = await payBookingMtn(bookingId, {
        amount: acompte,
        phoneNumber: phoneNumber.replace(/\D/g, ''),
        countryCode: '229',
        type: 'DEPOSIT',
      });
      startPolling(res.referenceId);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Impossible d\'initier le paiement MTN.');
      setStep('payment-form');
    }
  };

  const handlePayKkiapay = async () => {
    if (!bookingId || !KKIAPAY_KEY) {
      setErrorMsg('Kkiapay n\'est pas configuré. Contactez le support.');
      return;
    }
    setStep('paying');
    setErrorMsg('');
    try {
      // 1. Backend crée la transaction et retourne transactionId + montant avec frais
      const init = await payDepositKkiapay(bookingId, acompte);
      // 2. Ouvrir le widget avec le montant et le transactionId du backend
      await openKkiapay({
        amount: init.amount,
        api_key: KKIAPAY_KEY,
        sandbox: KKIAPAY_SANDBOX,
        reference: init.transactionId,
        phone: phoneNumber.replace(/\D/g, '') || undefined,
        name: user?.username || undefined,
      });
      // 3. Widget success → webhook backend met à jour la réservation automatiquement
      setStep('successful');
    } catch (err: any) {
      setErrorMsg(err?.message || 'Paiement Kkiapay échoué.');
      setStep('payment-form');
    }
  };

  const handlePay = () => {
    if (paymentMethod === 'mtn') handlePayMtn();
    else handlePayKkiapay();
  };

  const handleClose = () => {
    clearTimers();
    setStep('summary');
    setNombrePersonnes(1);
    setErrorMsg('');
    setMtnStatus(null);
    setCountdown(120);
    setContactEmail('');
    setContactPhone('');
    setSpecialRequests('');
    onClose();
  };

  const isProcessingStep = step === 'processing';
  const canClose = !isProcessingStep && step !== 'creating' && step !== 'paying';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={canClose ? handleClose : undefined} />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="bg-[#17233E] px-6 py-5 flex items-center justify-between">
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
                  <p className="font-playfair font-bold text-[#17233E] text-base">{voyage.titre}</p>
                  <p className="text-sm text-[#17233E]/60 flex items-center gap-1 mt-0.5">
                    <Calendar className="w-3.5 h-3.5" /> {voyage.dateDebut}
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#17233E] mb-2 flex items-center gap-1.5">
                  <Users className="w-4 h-4" /> Nombre de personnes
                </label>
                <select
                  value={nombrePersonnes}
                  onChange={(e) => setNombrePersonnes(parseInt(e.target.value))}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF7F2A]/50 focus:border-[#FF7F2A] text-[#17233E]"
                >
                  {[...Array(10)].map((_, i) => (
                    <option key={i} value={i + 1}>{i + 1} personne{i > 0 ? 's' : ''}</option>
                  ))}
                </select>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 space-y-2.5">
                <div className="flex justify-between text-sm">
                  <span className="text-[#17233E]/60">{fmtPrice(basePrice)} × {nombrePersonnes}</span>
                  <span className="font-semibold text-[#17233E]">{fmtPrice(sousTotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#17233E]/60">Acompte à payer maintenant (50%)</span>
                  <span className="font-bold text-[#FF7F2A]">{fmtPrice(acompte)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#17233E]/60">Solde à épargner</span>
                  <span className="font-semibold text-[#17233E]">{fmtPrice(soldeRestant)}</span>
                </div>
                <div className="border-t border-gray-200 pt-2.5 flex justify-between">
                  <span className="font-bold text-[#17233E]">Total voyage</span>
                  <span className="font-bold text-[#17233E]">{fmtPrice(sousTotal)}</span>
                </div>
              </div>

              <div className="flex gap-2.5 bg-amber-50 border border-amber-200 rounded-xl p-3.5">
                <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700 leading-relaxed">
                  L'acompte de <strong>{fmtPrice(acompte)}</strong> est <strong>non remboursable</strong> en cas de désistement.
                </p>
              </div>

              <button
                onClick={() => setStep('contact-form')}
                className="w-full py-3.5 bg-[#FF7F2A] text-white rounded-xl font-semibold hover:bg-[#e66d1e] transition-colors flex items-center justify-center gap-2"
              >
                Continuer <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* STEP: contact form */}
          {step === 'contact-form' && (
            <div className="space-y-5">
              <p className="text-sm text-[#17233E]/60">Informations de contact <span className="text-xs">(optionnel)</span></p>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-[#17233E]/70 mb-1 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5" /> Email
                  </label>
                  <input
                    type="email"
                    placeholder="votre@email.com"
                    value={contactEmail}
                    onChange={e => setContactEmail(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF7F2A]/50 focus:border-[#FF7F2A] text-sm text-[#17233E]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#17233E]/70 mb-1 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5" /> Téléphone de contact
                  </label>
                  <input
                    type="tel"
                    placeholder="0197000000"
                    value={contactPhone}
                    onChange={e => setContactPhone(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF7F2A]/50 focus:border-[#FF7F2A] text-sm text-[#17233E]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#17233E]/70 mb-1">Demandes particulières</label>
                <textarea
                  rows={2}
                  placeholder="Chambre non-fumeur, régime alimentaire..."
                  value={specialRequests}
                  onChange={e => setSpecialRequests(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF7F2A]/50 focus:border-[#FF7F2A] text-sm text-[#17233E] resize-none"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep('summary')}
                  className="flex-1 py-3 border border-gray-200 text-[#17233E] rounded-xl font-semibold hover:bg-gray-50 transition-colors text-sm"
                >
                  Retour
                </button>
                <button
                  onClick={handleConfirmReservation}
                  className="flex-1 py-3.5 bg-[#FF7F2A] text-white rounded-xl font-semibold hover:bg-[#e66d1e] transition-colors text-sm"
                >
                  Réserver
                </button>
              </div>
            </div>
          )}

          {/* STEP: creating booking */}
          {step === 'creating' && (
            <div className="py-12 flex flex-col items-center gap-4">
              <Loader2 className="w-10 h-10 text-[#FF7F2A] animate-spin" />
              <p className="text-[#17233E]/70 font-medium">Création de votre réservation...</p>
            </div>
          )}

          {/* STEP: payment form */}
          {step === 'payment-form' && (
            <div className="space-y-5">
              <div className="flex items-center gap-2 text-[#17233E]/60 text-sm">
                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                Réservation créée — Payez l'acompte pour confirmer
              </div>

              {/* Recap acompte */}
              <div className="bg-[#17233E]/5 rounded-xl p-4 text-center">
                <p className="text-xs text-[#17233E]/50 mb-1">Acompte à régler</p>
                <p className="font-playfair text-3xl font-bold text-[#17233E]">{fmtPrice(acompte)}</p>
                <p className="text-xs text-[#17233E]/50 mt-0.5">50% du total voyage</p>
              </div>

              {/* Choix du moyen de paiement */}
              <div>
                <p className="text-sm font-semibold text-[#17233E] mb-2">Moyen de paiement</p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('mtn')}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all text-sm font-medium ${
                      paymentMethod === 'mtn'
                        ? 'border-yellow-400 bg-yellow-50 text-yellow-800'
                        : 'border-gray-200 text-[#17233E]/60 hover:border-gray-300'
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
                        ? 'border-[#FF7F2A] bg-orange-50 text-orange-800'
                        : 'border-gray-200 text-[#17233E]/60 hover:border-gray-300'
                    }`}
                  >
                    <span className="text-2xl">💳</span>
                    <span>Kkiapay</span>
                    <span className="text-xs font-normal opacity-70">+0.5% de frais</span>
                  </button>
                </div>
              </div>

              {/* Champ téléphone (MTN uniquement) */}
              {paymentMethod === 'mtn' && (
                <div>
                  <label className="block text-sm font-semibold text-[#17233E] mb-2 flex items-center gap-1.5">
                    <Phone className="w-4 h-4" /> Numéro MTN Bénin
                  </label>
                  <div className="flex gap-2">
                    <span className="flex items-center px-3 py-3 bg-gray-100 border border-gray-200 rounded-xl text-sm text-[#17233E]/70 font-medium whitespace-nowrap">
                      +229
                    </span>
                    <input
                      type="tel"
                      inputMode="numeric"
                      placeholder="0197000000"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                      className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF7F2A]/50 focus:border-[#FF7F2A] text-[#17233E]"
                    />
                  </div>
                </div>
              )}

              {/* Info Kkiapay */}
              {paymentMethod === 'kkiapay' && (
                <div className="bg-orange-50 border border-orange-200 rounded-xl p-3.5 text-sm text-orange-800">
                  Le widget Kkiapay s'ouvrira pour finaliser le paiement. Vous pouvez utiliser carte bancaire, Mobile Money et d'autres moyens.
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
                    Frais {paymentMethod === 'mtn' ? 'MTN (+2%)' : 'Kkiapay (+0.5%)'}
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
                className="w-full py-3.5 bg-[#FF7F2A] text-white rounded-xl font-semibold hover:bg-[#e66d1e] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Payer {fmtPrice(totalDebited)} via {paymentMethod === 'mtn' ? 'MTN' : 'Kkiapay'}
              </button>

              <button
                onClick={() => onSuccess(bookingId)}
                className="w-full text-center text-sm text-[#17233E]/50 hover:text-[#17233E] transition-colors"
              >
                Payer plus tard depuis "Mes Voyages"
              </button>
            </div>
          )}

          {/* STEP: paying */}
          {step === 'paying' && (
            <div className="py-12 flex flex-col items-center gap-4">
              <Loader2 className="w-10 h-10 text-[#FF7F2A] animate-spin" />
              <p className="text-[#17233E]/70 font-medium">
                {paymentMethod === 'mtn' ? 'Connexion à MTN Mobile Money...' : 'Chargement du widget Kkiapay...'}
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
                  <p className="font-playfair font-bold text-[#17233E] text-lg">En attente de confirmation</p>
                  <p className="text-sm text-[#17233E]/60 mt-1">
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
                  <span className="text-sm font-medium text-[#17233E]">
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
                  <p className="font-playfair font-bold text-[#17233E] text-xl">Réservation confirmée !</p>
                  <p className="text-sm text-[#17233E]/60 mt-1">
                    Votre acompte de <strong>{fmtPrice(acompte)}</strong> a été reçu. Un reçu vous sera envoyé par email.
                  </p>
                  {bookingId && (
                    <p className="text-xs text-gray-400 mt-2 font-mono">Réf: #{bookingId.slice(-8).toUpperCase()}</p>
                  )}
                </div>
              </div>
              <div className="bg-[#1a4d3e]/5 rounded-xl p-4 text-sm text-center text-[#17233E]/70">
                Il vous reste <strong>{fmtPrice(soldeRestant)}</strong> à épargner avant le voyage.
              </div>
              <button
                onClick={() => onSuccess(bookingId)}
                className="w-full py-3.5 bg-[#FF7F2A] text-white rounded-xl font-semibold hover:bg-[#e66d1e] transition-colors"
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
                  <p className="font-playfair font-bold text-[#17233E] text-xl">
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
                    className="flex-1 py-3 border border-gray-200 text-[#17233E] rounded-xl font-semibold hover:bg-gray-50 transition-colors text-sm"
                  >
                    Mes voyages
                  </button>
                ) : (
                  <button
                    onClick={handleClose}
                    className="flex-1 py-3 border border-gray-200 text-[#17233E] rounded-xl font-semibold hover:bg-gray-50 transition-colors text-sm"
                  >
                    Fermer
                  </button>
                )}
                <button
                  onClick={() => { setMtnStatus(null); setStep(bookingId ? 'payment-form' : 'summary'); }}
                  className="flex-1 py-3 bg-[#FF7F2A] text-white rounded-xl font-semibold hover:bg-[#e66d1e] transition-colors text-sm flex items-center justify-center gap-2"
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

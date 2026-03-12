import React, { useState, useEffect } from 'react';
import { X, PiggyBank, Loader2, CheckCircle, AlertCircle, RefreshCw, Phone } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { payBookingMtn, payInstallmentKkiapay } from '../api/payments';
import { openKkiapay } from '../api/kkiapay';
import type { MappedBooking } from '../types';
import { usePaymentPolling } from '../hooks/usePaymentPolling';
import { PAYMENT_FEES, KKIAPAY_KEY, KKIAPAY_SANDBOX } from '../config/payments';

interface EpargneModalProps {
  isOpen: boolean;
  booking: MappedBooking | null;
  onClose: () => void;
  onSuccess?: () => void;
}

type Step = 'form' | 'loading' | 'processing' | 'successful' | 'failed' | 'expired' | 'timeout';
type PaymentMethod = 'mtn' | 'kkiapay';

export const EpargneModal: React.FC<EpargneModalProps> = ({ isOpen, booking, onClose, onSuccess }) => {
  const { user } = useAuth();
  const [step, setStep] = useState<Step>('form');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('mtn');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const { countdown, startPolling, clearTimers } = usePaymentPolling({
    onSuccess: () => setStep('successful'),
    onFailed: (status) => setStep(status),
  });

  useEffect(() => {
    if (isOpen && user?.phoneNumber) {
      const national = user.phoneNumber.replace(/^\+\d{1,3}/, '').replace(/\D/g, '');
      setPhoneNumber(national);
    }
  }, [isOpen, user]);

  if (!isOpen || !booking) return null;

  const fmtPrice = (v: number) => v.toLocaleString('fr-FR').replace(/\s/g, '.') + ' FCFA';

  const remaining = booking.remainingAmount;
  const amountNum = parseInt(amount.replace(/\D/g, '')) || 0;
  const fees = Math.round(amountNum * (paymentMethod === 'mtn' ? PAYMENT_FEES.MTN : PAYMENT_FEES.KKIAPAY));
  const totalDebited = amountNum + fees;
  const isAmountValid = amountNum > 0 && amountNum <= remaining;
  const isPhoneValid = phoneNumber.replace(/\D/g, '').length >= 8;
  const isValid = isAmountValid && (paymentMethod === 'kkiapay' || isPhoneValid);

  const daysLeft = booking.paymentDeadline
    ? Math.max(0, Math.ceil((new Date(booking.paymentDeadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null;

  const handlePayMtn = async () => {
    setStep('loading');
    setErrorMsg('');
    try {
      const res = await payBookingMtn(booking.id, {
        amount: amountNum,
        phoneNumber: phoneNumber.replace(/\D/g, ''),
        countryCode: '229',
        type: 'INSTALLMENT',
      });
      setStep('processing');
      startPolling(res.referenceId);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Impossible d\'initier le paiement.');
      setStep('form');
    }
  };

  const handlePayKkiapay = async () => {
    if (!KKIAPAY_KEY) {
      setErrorMsg('Kkiapay n\'est pas configuré. Contactez le support.');
      return;
    }
    setStep('loading');
    setErrorMsg('');
    try {
      // 1. Backend crée la transaction et retourne transactionId + montant avec frais
      const init = await payInstallmentKkiapay(booking.id, amountNum);
      // 2. Ouvrir le widget avec le montant et le transactionId du backend
      await openKkiapay({
        amount: init.amount,
        key: KKIAPAY_KEY,
        sandbox: KKIAPAY_SANDBOX,
        data: init.transactionId,
        phone: phoneNumber.replace(/\D/g, '') || undefined,
        name: user?.username || undefined,
      });
      // 3. Widget success → webhook backend met à jour automatiquement
      setStep('successful');
    } catch (err: any) {
      setErrorMsg(err?.message || 'Paiement Kkiapay échoué.');
      setStep('form');
    }
  };

  const handlePay = () => {
    if (!isValid) return;
    if (paymentMethod === 'mtn') handlePayMtn();
    else handlePayKkiapay();
  };

  const handleClose = () => {
    clearTimers();
    setStep('form');
    setAmount('');
    setErrorMsg('');
    onClose();
  };

  const handleSuccess = () => {
    handleClose();
    onSuccess?.();
  };

  const handleRetry = () => {
    clearTimers();
    setStep('form');
  };

  const canClose = step === 'form' || step === 'successful' || step === 'failed' || step === 'expired' || step === 'timeout';

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape' && canClose) handleClose(); };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [canClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/60" onClick={step === 'form' ? handleClose : undefined} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="bg-forest-800 px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-2 text-white">
            <PiggyBank className="w-5 h-5" />
            <h2 className="font-playfair text-xl font-bold">Épargner</h2>
          </div>
          {canClose && (
            <button onClick={handleClose} className="text-white/60 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        <div className="p-6">
          {/* FORM */}
          {step === 'form' && (
            <div className="space-y-4">
              <div>
                <p className="font-semibold text-dark-800">{booking.voyage?.titre || 'Voyage'}</p>
                <p className="text-sm text-dark-800/60">{booking.voyage?.destination}</p>
              </div>

              {/* Barre de progression */}
              <div>
                <div className="flex justify-between text-xs text-dark-800/60 mb-1.5">
                  <span>Épargné : {fmtPrice(booking.amountPaid)}</span>
                  <span>Total : {fmtPrice(booking.totalPrice)}</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-forest-800 rounded-full"
                    style={{ width: `${Math.min(100, Math.round((booking.amountPaid / booking.totalPrice) * 100))}%` }}
                  />
                </div>
              </div>

              {/* Solde restant + deadline */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                  <p className="text-xs text-dark-800/50 mb-1">Solde restant</p>
                  <p className="font-bold text-dark-800 text-sm">{fmtPrice(remaining)}</p>
                </div>
                <div className={`rounded-xl p-3 text-center ${daysLeft !== null && daysLeft <= 14 ? 'bg-red-50' : 'bg-gray-50'}`}>
                  <p className="text-xs text-dark-800/50 mb-1">Date limite</p>
                  <p className={`font-bold text-sm ${daysLeft !== null && daysLeft <= 14 ? 'text-red-600' : 'text-dark-800'}`}>
                    {daysLeft !== null ? `${daysLeft} jours` : '—'}
                  </p>
                </div>
              </div>

              {/* Montant */}
              <div>
                <label className="block text-sm font-semibold text-dark-800 mb-2">Montant à épargner (FCFA)</label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="Ex: 25000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value.replace(/[^\d]/g, ''))}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-forest-800/30 focus:border-forest-800 text-dark-800"
                />
                {amountNum > remaining && (
                  <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> Maximum : {fmtPrice(remaining)}
                  </p>
                )}
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
                        ? 'border-forest-800 bg-green-50 text-green-800'
                        : 'border-gray-200 text-dark-800/60 hover:border-gray-300'
                    }`}
                  >
                    <span className="text-2xl">💳</span>
                    <span>Kkiapay</span>
                    <span className="text-xs font-normal opacity-70">+0.5% de frais</span>
                  </button>
                </div>
              </div>

              {/* Téléphone MTN */}
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
                      className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-forest-800/30 focus:border-forest-800 text-dark-800"
                    />
                  </div>
                </div>
              )}

              {/* Info Kkiapay */}
              {paymentMethod === 'kkiapay' && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-3.5 text-sm text-green-800">
                  Le widget Kkiapay s'ouvrira pour finaliser le paiement. Carte bancaire, Mobile Money et autres moyens acceptés.
                </div>
              )}

              {/* Récap frais */}
              {amountNum > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-amber-700">Montant épargné</span>
                    <span className="font-semibold text-amber-800">{fmtPrice(amountNum)}</span>
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
              )}

              {errorMsg && (
                <p className="text-sm text-red-500 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" /> {errorMsg}
                </p>
              )}

              <button
                onClick={handlePay}
                disabled={!isValid}
                className="w-full py-3.5 bg-forest-800 text-white rounded-xl font-semibold hover:bg-forest-900 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Payer {amountNum > 0 && isAmountValid ? fmtPrice(totalDebited) : ''} via {paymentMethod === 'mtn' ? 'MTN' : 'Kkiapay'}
              </button>
            </div>
          )}

          {/* LOADING */}
          {step === 'loading' && (
            <div className="py-12 flex flex-col items-center gap-4">
              <Loader2 className="w-10 h-10 text-forest-800 animate-spin" />
              <p className="text-dark-800/70 font-medium">
                {paymentMethod === 'mtn' ? 'Initiation du paiement MTN...' : 'Chargement du widget Kkiapay...'}
              </p>
            </div>
          )}

          {/* PROCESSING (MTN polling) */}
          {step === 'processing' && (
            <div className="py-6 space-y-5">
              <div className="flex flex-col items-center gap-3">
                <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center">
                  <div className="w-8 h-8 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin" />
                </div>
                <div className="text-center">
                  <p className="font-playfair font-bold text-dark-800 text-lg">En attente de confirmation</p>
                  <p className="text-sm text-dark-800/60 mt-1">Une notification a été envoyée sur votre téléphone MTN.</p>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                <p className="text-sm font-semibold text-yellow-800 mb-2">Pour confirmer le paiement :</p>
                <ol className="space-y-1.5 text-sm text-yellow-700">
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-yellow-800 mt-0.5">1.</span>
                    Composez <strong>*880#</strong> sur votre téléphone MTN
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-yellow-800 mt-0.5">2.</span>
                    Sélectionnez l'option <strong>8</strong> (Payer)
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-yellow-800 mt-0.5">3.</span>
                    Entrez votre <strong>code PIN MTN</strong>
                  </li>
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

          {/* SUCCESSFUL */}
          {step === 'successful' && (
            <div className="py-6 space-y-5">
              <div className="flex flex-col items-center gap-3 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-green-500" />
                </div>
                <div>
                  <p className="font-playfair font-bold text-dark-800 text-xl">Paiement confirmé !</p>
                  <p className="text-sm text-dark-800/60 mt-1">
                    Votre versement de <strong>{fmtPrice(amountNum)}</strong> a été enregistré.
                  </p>
                </div>
              </div>
              <button
                onClick={handleSuccess}
                className="w-full py-3.5 bg-forest-800 text-white rounded-xl font-semibold hover:bg-forest-900 transition-colors"
              >
                Voir mon épargne
              </button>
            </div>
          )}

          {/* FAILED / EXPIRED / TIMEOUT */}
          {(step === 'failed' || step === 'expired' || step === 'timeout') && (
            <div className="py-6 space-y-5">
              <div className="flex flex-col items-center gap-3 text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-8 h-8 text-red-500" />
                </div>
                <div>
                  <p className="font-playfair font-bold text-dark-800 text-xl">
                    {step === 'failed' ? 'Paiement refusé' : step === 'expired' ? 'Délai expiré' : 'Temps écoulé'}
                  </p>
                  <p className="text-sm text-dark-800/60 mt-1">
                    {step === 'failed'
                      ? 'La transaction MTN a été refusée. Vérifiez votre solde.'
                      : 'Le délai de confirmation MTN est dépassé. Réessayez.'}
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleClose}
                  className="flex-1 py-3 border border-gray-200 text-dark-800 rounded-xl font-semibold hover:bg-gray-50 transition-colors text-sm"
                >
                  Annuler
                </button>
                <button
                  onClick={handleRetry}
                  className="flex-1 py-3 bg-forest-800 text-white rounded-xl font-semibold hover:bg-forest-900 transition-colors text-sm flex items-center justify-center gap-2"
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

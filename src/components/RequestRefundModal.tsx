import React, { useState, useEffect } from 'react';
import { X, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { getPayoutBalance, requestPayout } from '../api/trips';
import type { PayoutBalance } from '../api/trips';

interface RequestRefundModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const RequestRefundModal: React.FC<RequestRefundModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [balance, setBalance] = useState<PayoutBalance | null>(null);
  const [loadingBalance, setLoadingBalance] = useState(true);
  const [montant, setMontant] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedMethod, setSelectedMethod] = useState<'mtn' | 'moov'>('mtn');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [payoutResult, setPayoutResult] = useState<{ netAmount: number; commission: number } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setMontant('');
      setPhoneNumber('');
      setNotes('');
      setError('');
      setSuccess(false);
      setPayoutResult(null);
      loadBalance();
    }
  }, [isOpen]);

  const loadBalance = async () => {
    setLoadingBalance(true);
    try {
      const b = await getPayoutBalance();
      setBalance(b);
    } catch (e: any) {
      setError(e?.message || 'Impossible de charger le solde');
    } finally {
      setLoadingBalance(false);
    }
  };

  if (!isOpen) return null;

  const parsedAmount = Number(montant.replace(/\s/g, '').replace(/,/g, '.'));
  const isAmountValid = !Number.isNaN(parsedAmount) && parsedAmount > 0;
  const isOverBalance = isAmountValid && balance && parsedAmount > balance.availableBalance;
  const isPhoneValid = phoneNumber.replace(/\D/g, '').length >= 8;
  const canSubmit = isAmountValid && !isOverBalance && isPhoneValid && !submitting;

  const fmtPrice = (v: number) => v.toLocaleString('fr-FR').replace(/\s/g, '.') + ' FCFA';

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setError('');
    try {
      const result = await requestPayout({
        amount: parsedAmount,
        paymentMethod: selectedMethod,
        phoneNumber: phoneNumber.replace(/\D/g, ''),
        countryCode: '229',
        notes: notes.trim() || undefined,
      });
      setPayoutResult({ netAmount: result.netAmount, commission: result.commission });
      setSuccess(true);
      onSuccess?.();
    } catch (e: any) {
      setError(e?.message || 'Impossible de créer la demande de reversement');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h2 className="text-lg font-bold text-gray-900">
              {success ? 'Demande envoyée' : 'Demander un reversement'}
            </h2>
            <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          <div className="p-6">
            {loadingBalance ? (
              <div className="py-12 flex flex-col items-center gap-3">
                <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
                <p className="text-sm text-gray-500">Chargement du solde...</p>
              </div>
            ) : success ? (
              <div className="py-6 space-y-4 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle className="w-8 h-8 text-green-500" />
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-lg">Demande enregistrée</p>
                  <p className="text-sm text-gray-600 mt-1">
                    Votre demande de reversement de <strong>{fmtPrice(parsedAmount)}</strong> est en attente de validation.
                  </p>
                </div>
                {payoutResult && (
                  <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Montant brut</span>
                      <span className="font-medium text-gray-900">{fmtPrice(parsedAmount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Commission ({((balance?.commissionRate ?? 0.05) * 100).toFixed(0)}%)</span>
                      <span className="font-medium text-red-600">-{fmtPrice(payoutResult.commission)}</span>
                    </div>
                    <div className="border-t border-gray-200 pt-2 flex justify-between">
                      <span className="font-bold text-gray-900">Montant net</span>
                      <span className="font-bold text-green-600">{fmtPrice(payoutResult.netAmount)}</span>
                    </div>
                  </div>
                )}
                <button
                  onClick={onClose}
                  className="w-full py-3 bg-primary-500 text-white rounded-xl font-semibold hover:bg-primary-600 transition-colors"
                >
                  Fermer
                </button>
              </div>
            ) : (
              <div className="space-y-5">
                {/* Solde disponible */}
                {balance && (
                  <div className="bg-gradient-to-r from-forest-800 to-forest-800/80 rounded-xl p-5 text-white">
                    <p className="text-xs text-white/70 mb-1">Solde disponible</p>
                    <p className="text-2xl font-bold">{fmtPrice(balance.availableBalance)}</p>
                    <div className="flex gap-4 mt-3 text-xs text-white/60">
                      <span>Revenus: {fmtPrice(balance.totalRevenue)}</span>
                      <span>Reversé: {fmtPrice(balance.totalPayouts)}</span>
                    </div>
                  </div>
                )}

                {/* Montant */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Montant à reverser (FCFA)
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="Ex: 150000"
                    value={montant}
                    onChange={(e) => setMontant(e.target.value)}
                    className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/50 text-gray-900 ${
                      isOverBalance ? 'border-red-400 bg-red-50' : 'border-gray-200'
                    }`}
                  />
                  {isOverBalance && (
                    <p className="text-xs text-red-500 mt-1">
                      Le montant dépasse votre solde disponible ({fmtPrice(balance!.availableBalance)})
                    </p>
                  )}
                </div>

                {/* Moyen de paiement */}
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Moyen de versement</p>
                  <div className="grid grid-cols-2 gap-2">
                    {(['mtn', 'moov'] as const).map((method) => (
                      <button
                        key={method}
                        type="button"
                        onClick={() => setSelectedMethod(method)}
                        className={`p-3 rounded-xl border-2 text-sm font-medium transition-all ${
                          selectedMethod === method
                            ? method === 'mtn' ? 'border-yellow-400 bg-yellow-50 text-yellow-800' : 'border-blue-400 bg-blue-50 text-blue-800'
                            : 'border-gray-200 text-gray-600 hover:border-gray-300'
                        }`}
                      >
                        {method === 'mtn' ? 'MTN MoMo' : 'Moov Money'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Numéro de téléphone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Numéro {selectedMethod === 'mtn' ? 'MTN' : 'Moov'}
                  </label>
                  <div className="flex gap-2">
                    <span className="flex items-center px-3 py-3 bg-gray-100 border border-gray-200 rounded-xl text-sm text-gray-600 font-medium">
                      +229
                    </span>
                    <input
                      type="tel"
                      inputMode="numeric"
                      placeholder="0197000000"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                      className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/50 text-gray-900"
                    />
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optionnel)</label>
                  <input
                    type="text"
                    placeholder="Ex: Reversement mars 2026"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/50 text-sm text-gray-900"
                  />
                </div>

                {/* Commission info */}
                {isAmountValid && !isOverBalance && balance && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm space-y-1">
                    <div className="flex justify-between text-amber-700">
                      <span>Commission ({(balance.commissionRate * 100).toFixed(0)}%)</span>
                      <span className="font-medium">-{fmtPrice(Math.round(parsedAmount * balance.commissionRate))}</span>
                    </div>
                    <div className="flex justify-between text-amber-800 font-bold">
                      <span>Vous recevrez</span>
                      <span>{fmtPrice(Math.round(parsedAmount * (1 - balance.commissionRate)))}</span>
                    </div>
                  </div>
                )}

                {error && (
                  <div className="flex items-center gap-2 text-sm text-red-600">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    {error}
                  </div>
                )}

                {/* Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={onClose}
                    className="flex-1 py-3 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={!canSubmit}
                    className="flex-1 py-3 bg-primary-500 text-white rounded-xl font-semibold hover:bg-primary-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    Demander
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

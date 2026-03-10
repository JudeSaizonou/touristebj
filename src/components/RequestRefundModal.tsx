import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Button } from '@/components/ui/button';

interface RequestRefundModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (method: 'mobile-money' | 'bancaire', montant: string) => void;
  title?: string;
}

export const RequestRefundModal: React.FC<RequestRefundModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  title = 'Demander un reversement'
}) => {
  const [montant, setMontant] = useState('');
  const [selectedMethod, setSelectedMethod] = useState<'mobile-money' | 'bancaire'>('mobile-money');

  useEffect(() => {
    if (isOpen) {
      setMontant('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const montantValide = montant.trim() !== '' && !Number.isNaN(Number(montant.replace(/\s/g, '').replace(/,/g, '.')));

  const handleSubmit = () => {
    if (!montantValide) return;
    onSubmit(selectedMethod, montant.trim());
  };

  const methods = [
    {
      id: 'mobile-money',
      label: 'Mobile Money',
      description: 'Versement par mobile money'
    },
    {
      id: 'bancaire',
      label: 'Virement Bancaire',
      description: 'Versement par virement bancaire'
    }
  ];

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-40"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 space-y-5">
            {/* Montant à reverser */}
            <div>
              <label htmlFor="montant-reversement" className="block text-sm font-medium text-gray-700 mb-1">
                Montant à reverser (FCFA)
              </label>
              <input
                id="montant-reversement"
                type="text"
                inputMode="numeric"
                placeholder="Ex: 150 000"
                value={montant}
                onChange={(e) => setMontant(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-colors"
              />
            </div>

            {/* Moyen de paiement */}
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Moyen de versement</p>
              <RadioGroup value={selectedMethod} onValueChange={(value) => setSelectedMethod(value as 'mobile-money' | 'bancaire')}>
              <div className="space-y-3">
                {methods.map((method) => (
                  <div key={method.id} className="flex items-center space-x-2 p-3 border border-gray-200 rounded-lg hover:border-primary-400 hover:bg-primary-50 cursor-pointer transition-colors"
                    onClick={() => setSelectedMethod(method.id as 'mobile-money' | 'bancaire')}>
                    <RadioGroupItem value={method.id} id={method.id} />
                    <label htmlFor={method.id} className="flex-1 cursor-pointer">
                      <div>
                        <p className="font-semibold text-gray-900">{method.label}</p>
                        <p className="text-sm text-gray-600">{method.description}</p>
                      </div>
                    </label>
                  </div>
                ))}
              </div>
            </RadioGroup>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 flex items-center gap-3">
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1"
            >
              Annuler
            </Button>
            <Button
              onClick={handleSubmit}
              className="flex-1"
              disabled={!montantValide}
            >
              Demander
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

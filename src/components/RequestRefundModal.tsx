import React, { useState } from 'react';
import { X } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Button } from '@/components/ui/button';

interface RequestRefundModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (method: 'mobile-money' | 'bancaire') => void;
  title?: string;
}

export const RequestRefundModal: React.FC<RequestRefundModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  title = 'Demander un reversement'
}) => {
  const [selectedMethod, setSelectedMethod] = useState<'mobile-money' | 'bancaire'>('mobile-money');

  if (!isOpen) return null;

  const handleSubmit = () => {
    onSubmit(selectedMethod);
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
          <div className="p-6">
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
            >
              Demander
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

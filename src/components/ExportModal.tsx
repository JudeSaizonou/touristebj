import React, { useState } from 'react';
import { X } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Button } from '@/components/ui/button';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (format: 'csv' | 'pdf' | 'xlsx') => void;
  title?: string;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  onExport,
  title = 'Choisir le format d\'export'
}) => {
  const [selectedFormat, setSelectedFormat] = useState<'csv' | 'pdf' | 'xlsx'>('csv');

  if (!isOpen) return null;

  const handleExport = () => {
    onExport(selectedFormat);
  };

  const formats = [
    {
      id: 'csv',
      label: 'CSV',
      description: 'Fichier de valeurs séparées par des virgules'
    },
    {
      id: 'xlsx',
      label: 'Excel (XLSX)',
      description: 'Classeur Excel avec formatage'
    },
    {
      id: 'pdf',
      label: 'PDF',
      description: 'Document PDF formaté'
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
            <RadioGroup value={selectedFormat} onValueChange={(value) => setSelectedFormat(value as 'csv' | 'pdf' | 'xlsx')}>
              <div className="space-y-3">
                {formats.map((format) => (
                  <div key={format.id} className="flex items-center space-x-2 p-3 border border-gray-200 rounded-lg hover:border-primary-400 hover:bg-primary-50 cursor-pointer transition-colors"
                    onClick={() => setSelectedFormat(format.id as 'csv' | 'pdf' | 'xlsx')}>
                    <RadioGroupItem value={format.id} id={format.id} />
                    <label htmlFor={format.id} className="flex-1 cursor-pointer">
                      <div>
                        <p className="font-semibold text-gray-900">{format.label}</p>
                        <p className="text-sm text-gray-600">{format.description}</p>
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
              onClick={handleExport}
              className="flex-1"
            >
              Exporter
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

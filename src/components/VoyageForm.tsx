import { useState, useRef, forwardRef, useImperativeHandle } from 'react';
import { Upload, X, AlertCircle } from 'lucide-react';

interface VoyageFormProps {
  mode: 'create' | 'edit';
  initialData?: {
    titre: string;
    montant: string;
    description: string;
    nombreJours: string;
    nombrePersonnes: string;
    politiqueRemboursement: string;
    ceQuiEstInclus: string[];
    ceQuiNestPasInclus: string[];
    photos: string[];
  };
  onSubmit: (data: any) => void;
  onCancel?: () => void;
}

export interface VoyageFormRef {
  triggerSubmit: () => void;
}

export const VoyageForm = forwardRef<VoyageFormRef, VoyageFormProps>(({
  mode,
  initialData,
  onSubmit
}, ref) => {
  const [formData, setFormData] = useState({
    titre: initialData?.titre || '',
    montant: initialData?.montant || '',
    description: initialData?.description || '',
    nombreJours: initialData?.nombreJours || '1',
    nombrePersonnes: initialData?.nombrePersonnes || '5',
    politiqueRemboursement: initialData?.politiqueRemboursement || '',
    ceQuiEstInclus: initialData?.ceQuiEstInclus || [''],
    ceQuiNestPasInclus: initialData?.ceQuiNestPasInclus || [''],
  });

  const [photos, setPhotos] = useState<string[]>(initialData?.photos || []);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error on change
    if (errors[field]) {
      setErrors(prev => { const n = { ...prev }; delete n[field]; return n; });
    }
  };

  const handleArrayChange = (field: 'ceQuiEstInclus' | 'ceQuiNestPasInclus', index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => i === index ? value : item)
    }));
  };

  const addArrayItem = (field: 'ceQuiEstInclus' | 'ceQuiNestPasInclus') => {
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field], '']
    }));
  };

  const removeArrayItem = (field: 'ceQuiEstInclus' | 'ceQuiNestPasInclus', index: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      if (photos.length >= 8) return;
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotos(prev => {
          if (prev.length >= 8) return prev;
          return [...prev, reader.result as string];
        });
      };
      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.titre.trim()) newErrors.titre = 'Le titre est obligatoire';
    if (!formData.montant.trim()) newErrors.montant = 'Le montant est obligatoire';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const doSubmit = () => {
    if (!validate()) return;

    const submitData = {
      ...formData,
      prix: formData.montant,
      titre: formData.titre,
      destination: formData.titre,
      photos,
    };
    onSubmit(submitData);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    doSubmit();
  };

  // Expose triggerSubmit to parent via ref
  useImperativeHandle(ref, () => ({
    triggerSubmit: () => {
      doSubmit();
    }
  }));

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Form Fields */}
        <div className="lg:col-span-2 space-y-6">
          {/* Titre et Montant */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Titre <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Titre du voyage"
                value={formData.titre}
                onChange={(e) => handleChange('titre', e.target.value)}
                className={`w-full px-4 py-2.5 bg-gray-50 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-colors ${errors.titre ? 'border-red-400 bg-red-50' : 'border-gray-200'}`}
              />
              {errors.titre && (
                <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.titre}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Montant par personne <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Montant par personne"
                value={formData.montant}
                onChange={(e) => handleChange('montant', e.target.value)}
                className={`w-full px-4 py-2.5 bg-gray-50 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-colors ${errors.montant ? 'border-red-400 bg-red-50' : 'border-gray-200'}`}
              />
              {errors.montant && (
                <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.montant}
                </p>
              )}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              rows={6}
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-colors resize-none"
            />
          </div>

          {/* Nombre de jours et personnes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre de jours
              </label>
              <select
                value={formData.nombreJours}
                onChange={(e) => handleChange('nombreJours', e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-colors"
              >
                {[1, 2, 3, 4, 5, 7, 10, 14, 21, 30].map(num => (
                  <option key={num} value={num}>{num}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre de personnes
              </label>
              <select
                value={formData.nombrePersonnes}
                onChange={(e) => handleChange('nombrePersonnes', e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-colors"
              >
                {[5, 10, 15, 20, 25, 30, 40, 50].map(num => (
                  <option key={num} value={num}>{num}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Politique de remboursement */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Politique de remboursement
            </label>
            <textarea
              rows={6}
              value={formData.politiqueRemboursement}
              onChange={(e) => handleChange('politiqueRemboursement', e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-colors resize-none"
            />
          </div>

          {/* Ce qui est inclus / pas inclus */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ce qui est inclus
              </label>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-2">
                {formData.ceQuiEstInclus.map((item, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <span className="text-gray-400 mt-1">•</span>
                    <input
                      type="text"
                      value={item}
                      onChange={(e) => handleArrayChange('ceQuiEstInclus', index, e.target.value)}
                      className="flex-1 bg-white px-2 py-1 text-sm border-0 focus:outline-none focus:ring-1 focus:ring-primary-500 rounded"
                      placeholder="Élément inclus"
                    />
                    {formData.ceQuiEstInclus.length > 1 && (
                      <button type="button" onClick={() => removeArrayItem('ceQuiEstInclus', index)} className="text-red-500 hover:text-red-700">
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
                <button type="button" onClick={() => addArrayItem('ceQuiEstInclus')} className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                  + Ajouter un élément
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ce qui n'est pas inclus
              </label>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-2">
                {formData.ceQuiNestPasInclus.map((item, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <span className="text-gray-400 mt-1">•</span>
                    <input
                      type="text"
                      value={item}
                      onChange={(e) => handleArrayChange('ceQuiNestPasInclus', index, e.target.value)}
                      className="flex-1 bg-white px-2 py-1 text-sm border-0 focus:outline-none focus:ring-1 focus:ring-primary-500 rounded"
                      placeholder="Élément non inclus"
                    />
                    {formData.ceQuiNestPasInclus.length > 1 && (
                      <button type="button" onClick={() => removeArrayItem('ceQuiNestPasInclus', index)} className="text-red-500 hover:text-red-700">
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
                <button type="button" onClick={() => addArrayItem('ceQuiNestPasInclus')} className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                  + Ajouter un élément
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Media Upload */}
        <div className="space-y-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Médias
          </label>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 flex flex-col items-center justify-center min-h-[400px]">
            <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Upload className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-sm font-semibold text-gray-700 mb-3">
              Sélectionnez vos photos
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
            >
              Téléchargez Vos Photos
            </button>
          </div>

          {/* Photo Thumbnails */}
          {photos.length > 0 && (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {photos.map((photo, index) => (
                <div key={index} className="w-24 h-20 shrink-0 bg-gray-200 rounded-lg relative overflow-hidden">
                  <img src={photo} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setPhotos(photos.filter((_, i) => i !== index))}
                    className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors z-20"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Submit Button - only in create mode */}
      {mode === 'create' && (
        <div className="flex justify-center pt-6">
          <button
            type="submit"
            className="px-8 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors font-semibold shadow-md"
          >
            Enregistrer
          </button>
        </div>
      )}
    </form>
  );
});

VoyageForm.displayName = 'VoyageForm';

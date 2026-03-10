import { useState, useRef, forwardRef, useImperativeHandle } from 'react';
import { Upload, X, AlertCircle, Plus, Trash2 } from 'lucide-react';

export interface VoyageFormData {
  title: string;
  destination: string;
  description: string;
  tripType: string;
  departureDate: string;
  returnDate: string;
  totalPrice: number;
  depositAmount: number;
  paymentDeadlineDays: number;
  allowInstallments: boolean;
  minInstallmentAmount: number;
  maxParticipants: number;
  existingPhotos: string[];   // URLs déjà sur le serveur (inchangées)
  removedPhotos: string[];    // URLs à supprimer via DELETE
  newPhotoFiles: File[];      // nouveaux fichiers à uploader via multipart
  included: string[];
  excluded: string[];
  itinerary: Array<{ day: number; description: string; activities: string[] }>;
}

interface VoyageFormProps {
  mode: 'create' | 'edit';
  initialData?: Partial<VoyageFormData>;
  onSubmit: (data: VoyageFormData) => void;
  onCancel?: () => void;
}

export interface VoyageFormRef {
  triggerSubmit: () => void;
}

const TRIP_TYPES = [
  { value: 'voyage', label: 'Voyage' },
  { value: 'sortie', label: 'Sortie' },
  { value: 'excursion', label: 'Excursion' },
  { value: 'autre', label: 'Autre' },
];

export const VoyageForm = forwardRef<VoyageFormRef, VoyageFormProps>(({
  mode,
  initialData,
  onSubmit,
}, ref) => {
  const [title, setTitle] = useState(initialData?.title || '');
  const [destination, setDestination] = useState(initialData?.destination || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [tripType, setTripType] = useState(initialData?.tripType || 'voyage');
  const [departureDate, setDepartureDate] = useState(
    initialData?.departureDate ? initialData.departureDate.slice(0, 10) : ''
  );
  const [returnDate, setReturnDate] = useState(
    initialData?.returnDate ? initialData.returnDate.slice(0, 10) : ''
  );
  const [totalPrice, setTotalPrice] = useState(initialData?.totalPrice ? String(initialData.totalPrice) : '');
  const [depositAmount, setDepositAmount] = useState(initialData?.depositAmount ? String(initialData.depositAmount) : '');
  const [paymentDeadlineDays, setPaymentDeadlineDays] = useState(String(initialData?.paymentDeadlineDays ?? 14));
  const [allowInstallments, setAllowInstallments] = useState(initialData?.allowInstallments ?? true);
  const [minInstallmentAmount, setMinInstallmentAmount] = useState(String(initialData?.minInstallmentAmount ?? 5000));
  const [maxParticipants, setMaxParticipants] = useState(String(initialData?.maxParticipants ?? 20));
  // images existantes (URLs serveur) vs nouveaux fichiers
  const [existingPhotos, setExistingPhotos] = useState<string[]>(initialData?.existingPhotos || []);
  const [removedPhotos, setRemovedPhotos] = useState<string[]>([]);
  const [newPhotoFiles, setNewPhotoFiles] = useState<File[]>([]);
  const [newPhotoPreviews, setNewPhotoPreviews] = useState<string[]>([]);
  const [included, setIncluded] = useState<string[]>(initialData?.included?.length ? initialData.included : ['']);
  const [excluded, setExcluded] = useState<string[]>(initialData?.excluded?.length ? initialData.excluded : ['']);
  const [itinerary, setItinerary] = useState<Array<{ day: number; description: string; activities: string[] }>>(
    initialData?.itinerary?.length ? initialData.itinerary : []
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ─── Image upload ───────────────────────────────────────────────────────────

  const previewFile = (file: File): Promise<string> =>
    new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (ev) => resolve(ev.target?.result as string);
      reader.readAsDataURL(file);
    });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const totalExisting = existingPhotos.length + newPhotoFiles.length;
    const slots = Math.max(0, 10 - totalExisting);
    const picked = Array.from(files).slice(0, slots);
    const previews = await Promise.all(picked.map(previewFile));
    setNewPhotoFiles(prev => [...prev, ...picked]);
    setNewPhotoPreviews(prev => [...prev, ...previews]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeExisting = (url: string) => {
    setExistingPhotos(prev => prev.filter(u => u !== url));
    setRemovedPhotos(prev => [...prev, url]);
  };

  const removeNew = (idx: number) => {
    setNewPhotoFiles(prev => prev.filter((_, i) => i !== idx));
    setNewPhotoPreviews(prev => prev.filter((_, i) => i !== idx));
  };

  // ─── Itinerary helpers ──────────────────────────────────────────────────────

  const addItineraryDay = () =>
    setItinerary(prev => [...prev, { day: prev.length + 1, description: '', activities: [''] }]);

  const removeItineraryDay = (i: number) =>
    setItinerary(prev => prev.filter((_, idx) => idx !== i).map((d, idx) => ({ ...d, day: idx + 1 })));

  const updateItineraryDay = (i: number, field: 'day' | 'description', value: string) =>
    setItinerary(prev => prev.map((d, idx) => idx === i ? { ...d, [field]: field === 'day' ? Number(value) : value } : d));

  const addActivity = (dayIdx: number) =>
    setItinerary(prev => prev.map((d, i) => i === dayIdx ? { ...d, activities: [...d.activities, ''] } : d));

  const updateActivity = (dayIdx: number, actIdx: number, value: string) =>
    setItinerary(prev => prev.map((d, i) => i === dayIdx ? { ...d, activities: d.activities.map((a, j) => j === actIdx ? value : a) } : d));

  const removeActivity = (dayIdx: number, actIdx: number) =>
    setItinerary(prev => prev.map((d, i) => i === dayIdx ? { ...d, activities: d.activities.filter((_, j) => j !== actIdx) } : d));

  // ─── Validation & submit ────────────────────────────────────────────────────

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!title.trim()) e.title = 'Obligatoire';
    if (!destination.trim()) e.destination = 'Obligatoire';
    if (!departureDate) e.departureDate = 'Obligatoire';
    if (!returnDate) e.returnDate = 'Obligatoire';
    if (departureDate && returnDate && returnDate <= departureDate) e.returnDate = 'Doit être après la date de départ';
    const tp = Number(totalPrice);
    const da = Number(depositAmount);
    if (!tp || tp <= 0) e.totalPrice = 'Obligatoire (nombre > 0)';
    if (!da || da <= 0) e.depositAmount = 'Obligatoire (nombre > 0)';
    if (tp && da && da > tp) e.depositAmount = 'Doit être ≤ au prix total';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const doSubmit = () => {
    if (!validate()) return;
    onSubmit({
      title: title.trim(),
      destination: destination.trim(),
      description: description.trim(),
      tripType,
      departureDate: new Date(departureDate).toISOString(),
      returnDate: new Date(returnDate).toISOString(),
      totalPrice: Number(totalPrice),
      depositAmount: Number(depositAmount),
      paymentDeadlineDays: Number(paymentDeadlineDays) || 14,
      allowInstallments,
      minInstallmentAmount: Number(minInstallmentAmount) || 5000,
      maxParticipants: Number(maxParticipants) || 20,
      existingPhotos,
      removedPhotos,
      newPhotoFiles,
      included: included.filter(s => s.trim()),
      excluded: excluded.filter(s => s.trim()),
      itinerary: itinerary.map(d => ({
        day: d.day,
        description: d.description,
        activities: d.activities.filter(a => a.trim()),
      })),
    });
  };

  useImperativeHandle(ref, () => ({ triggerSubmit: doSubmit }));

  const fieldCls = (name: string) =>
    `w-full px-4 py-2.5 bg-gray-50 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-colors ${errors[name] ? 'border-red-400 bg-red-50' : 'border-gray-200'}`;

  const FieldError = ({ name }: { name: string }) =>
    errors[name] ? (
      <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
        <AlertCircle className="w-3 h-3" />{errors[name]}
      </p>
    ) : null;

  return (
    <form onSubmit={(e) => { e.preventDefault(); doSubmit(); }} className="space-y-8">

      {/* ── Section 1 : Informations générales ── */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Informations générales</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Titre <span className="text-red-500">*</span></label>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Ex : Safari Kenya" className={fieldCls('title')} />
            <FieldError name="title" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Destination <span className="text-red-500">*</span></label>
            <input value={destination} onChange={e => setDestination(e.target.value)} placeholder="Ex : Nairobi, Kenya" className={fieldCls('destination')} />
            <FieldError name="destination" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type de voyage</label>
            <select value={tripType} onChange={e => setTripType(e.target.value)} className={fieldCls('tripType')}>
              {TRIP_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de participants max</label>
            <input type="number" min="1" value={maxParticipants} onChange={e => setMaxParticipants(e.target.value)} className={fieldCls('maxParticipants')} />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea rows={4} value={description} onChange={e => setDescription(e.target.value)} className={`${fieldCls('description')} resize-none`} />
          </div>
        </div>
      </div>

      {/* ── Section 2 : Dates ── */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Dates</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date de départ <span className="text-red-500">*</span></label>
            <input type="date" value={departureDate} onChange={e => setDepartureDate(e.target.value)} className={fieldCls('departureDate')} />
            <FieldError name="departureDate" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date de retour <span className="text-red-500">*</span></label>
            <input type="date" value={returnDate} min={departureDate} onChange={e => setReturnDate(e.target.value)} className={fieldCls('returnDate')} />
            <FieldError name="returnDate" />
          </div>
        </div>
      </div>

      {/* ── Section 3 : Tarification ── */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Tarification</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Prix total (FCFA) <span className="text-red-500">*</span></label>
            <input type="number" min="0" value={totalPrice} onChange={e => setTotalPrice(e.target.value)} placeholder="Ex : 250000" className={fieldCls('totalPrice')} />
            <FieldError name="totalPrice" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Acompte (FCFA) <span className="text-red-500">*</span></label>
            <input type="number" min="0" value={depositAmount} onChange={e => setDepositAmount(e.target.value)} placeholder="Ex : 50000" className={fieldCls('depositAmount')} />
            <FieldError name="depositAmount" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Délai de paiement (jours)</label>
            <input type="number" min="1" value={paymentDeadlineDays} onChange={e => setPaymentDeadlineDays(e.target.value)} className={fieldCls('paymentDeadlineDays')} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Versement minimum (FCFA)</label>
            <input type="number" min="0" value={minInstallmentAmount} onChange={e => setMinInstallmentAmount(e.target.value)} disabled={!allowInstallments} className={`${fieldCls('minInstallmentAmount')} disabled:opacity-50`} />
          </div>
          <div className="flex items-center gap-3">
            <input type="checkbox" id="allowInstallments" checked={allowInstallments} onChange={e => setAllowInstallments(e.target.checked)} className="w-4 h-4 accent-primary-500" />
            <label htmlFor="allowInstallments" className="text-sm font-medium text-gray-700">Autoriser les paiements échelonnés</label>
          </div>
        </div>
      </div>

      {/* ── Section 4 : Inclus / Non inclus ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {[
          { label: 'Ce qui est inclus', state: included, setState: setIncluded },
          { label: "Ce qui n'est pas inclus", state: excluded, setState: setExcluded },
        ].map(({ label, state, setState }) => (
          <div key={label}>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">{label}</h2>
            <div className="space-y-2">
              {state.map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    value={item}
                    onChange={e => setState(prev => prev.map((v, j) => j === i ? e.target.value : v))}
                    placeholder="Élément..."
                    className="flex-1 px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  {state.length > 1 && (
                    <button type="button" onClick={() => setState(prev => prev.filter((_, j) => j !== i))} className="text-red-400 hover:text-red-600">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
              <button type="button" onClick={() => setState(prev => [...prev, ''])} className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1">
                <Plus className="w-3 h-3" /> Ajouter
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* ── Section 5 : Itinéraire ── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Itinéraire</h2>
          <button type="button" onClick={addItineraryDay} className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1">
            <Plus className="w-3 h-3" /> Ajouter un jour
          </button>
        </div>
        {itinerary.length === 0 && (
          <p className="text-sm text-gray-400 italic">Aucun jour ajouté — optionnel</p>
        )}
        <div className="space-y-4">
          {itinerary.map((day, i) => (
            <div key={i} className="bg-gray-50 border border-gray-200 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-3">
                <span className="w-7 h-7 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center text-xs font-bold">J{day.day}</span>
                <input
                  value={day.description}
                  onChange={e => updateItineraryDay(i, 'description', e.target.value)}
                  placeholder="Description du jour"
                  className="flex-1 px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <button type="button" onClick={() => removeItineraryDay(i)} className="text-red-400 hover:text-red-600">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="pl-10 space-y-2">
                {day.activities.map((act, j) => (
                  <div key={j} className="flex items-center gap-2">
                    <span className="text-gray-400 text-xs">•</span>
                    <input
                      value={act}
                      onChange={e => updateActivity(i, j, e.target.value)}
                      placeholder="Activité"
                      className="flex-1 px-3 py-1.5 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    {day.activities.length > 1 && (
                      <button type="button" onClick={() => removeActivity(i, j)} className="text-red-400 hover:text-red-600">
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ))}
                <button type="button" onClick={() => addActivity(i)} className="text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1">
                  <Plus className="w-3 h-3" /> Activité
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Section 6 : Photos ── */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
          Photos <span className="text-xs font-normal text-gray-400">({existingPhotos.length + newPhotoFiles.length}/10)</span>
        </h2>

        {existingPhotos.length + newPhotoFiles.length < 10 && (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-gray-200 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer hover:border-primary-400 hover:bg-primary-50 transition-colors mb-4"
          >
            <Upload className="w-8 h-8 text-gray-400 mb-2" />
            <p className="text-sm font-medium text-gray-700">Cliquez pour ajouter des photos</p>
            <p className="text-xs text-gray-400 mt-1">JPG, PNG — max 5 MB/photo — max 10 photos</p>
          </div>
        )}
        <input ref={fileInputRef} type="file" accept="image/jpeg,image/png" multiple onChange={handleFileUpload} className="hidden" />

        {(existingPhotos.length > 0 || newPhotoFiles.length > 0) && (
          <div className="flex gap-3 flex-wrap">
            {existingPhotos.map((url, i) => (
              <div key={`existing-${i}`} className="w-24 h-20 rounded-lg relative overflow-hidden bg-gray-100 group">
                <img src={url} alt="" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeExisting(url)}
                  className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
            {newPhotoPreviews.map((preview, i) => (
              <div key={`new-${i}`} className="w-24 h-20 rounded-lg relative overflow-hidden bg-gray-100">
                <img src={preview} alt="" className="w-full h-full object-cover" />
                <div className="absolute bottom-0 left-0 right-0 bg-primary-500/80 text-white text-[9px] text-center py-0.5">Nouveau</div>
                <button
                  type="button"
                  onClick={() => removeNew(i)}
                  className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {mode === 'create' && (
        <div className="flex justify-end pt-4 border-t border-gray-100">
          <button type="submit" className="px-8 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors font-semibold shadow-md">
            Enregistrer
          </button>
        </div>
      )}
    </form>
  );
});

VoyageForm.displayName = 'VoyageForm';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Phone, KeyRound, User, Mail, ArrowLeft, Loader2, ShieldCheck, Eye, EyeOff, CheckCircle2, Circle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ToastContainer, useToast } from '@/components/Toast';
import { useAuth } from '../context/AuthContext';
import * as authApi from '../api/auth';
import LogoTouristeBj from '../assets/LogoTouristeBj.png';
import type { ApiError } from '../api/client';

export type AuthMode = 'inscription' | 'connexion';

type InscriptionStep = 'phone' | 'form';
type ConnexionStep = 'phone' | 'otp' | 'password' | 'password-only' | 'forgot-send' | 'forgot-reset' | 'migrate-pin';

interface AuthProps {
  initialMode?: AuthMode;
  onSuccess?: (isAdmin: boolean) => void;
  onBack?: () => void;
}

const COUNTRY_OPTIONS: { code: string; label: string; indicatif: string; flag: string }[] = [
  { code: 'BJ', label: 'Bénin', indicatif: '229', flag: '🇧🇯' },
  { code: 'FR', label: 'France', indicatif: '33', flag: '🇫🇷' },
  { code: 'TG', label: 'Togo', indicatif: '228', flag: '🇹🇬' },
  { code: 'NE', label: 'Niger', indicatif: '227', flag: '🇳🇪' },
  { code: 'NG', label: 'Nigeria', indicatif: '234', flag: '🇳🇬' },
  { code: 'SN', label: 'Sénégal', indicatif: '221', flag: '🇸🇳' },
  { code: 'BF', label: 'Burkina Faso', indicatif: '226', flag: '🇧🇫' },
  { code: 'ML', label: 'Mali', indicatif: '223', flag: '🇲🇱' },
  { code: 'GH', label: 'Ghana', indicatif: '233', flag: '🇬🇭' },
  { code: 'CI', label: "Côte d'Ivoire", indicatif: '225', flag: '🇨🇮' },
  { code: 'CM', label: 'Cameroun', indicatif: '237', flag: '🇨🇲' },
  { code: 'CD', label: 'RD Congo', indicatif: '243', flag: '🇨🇩' },
  { code: 'GA', label: 'Gabon', indicatif: '241', flag: '🇬🇦' },
  { code: 'BE', label: 'Belgique', indicatif: '32', flag: '🇧🇪' },
  { code: 'CH', label: 'Suisse', indicatif: '41', flag: '🇨🇭' },
  { code: 'CA', label: 'Canada', indicatif: '1', flag: '🇨🇦' },
  { code: 'US', label: 'États-Unis', indicatif: '1', flag: '🇺🇸' },
  { code: 'GB', label: 'Royaume-Uni', indicatif: '44', flag: '🇬🇧' },
  { code: 'OTHER', label: 'Autre', indicatif: '', flag: '🌍' },
];

function getApiMessage(err: unknown): string {
  return (err as ApiError)?.message || 'Une erreur est survenue';
}

/** Détecte si la valeur saisie est un PIN (4-6 chiffres uniquement) ou un mot de passe classique. */
function isPin(value: string): boolean {
  return /^\d{4,6}$/.test(value);
}

/** Valide un PIN : 4 chiffres, pas de séquence triviale. */
function validatePin(pin: string): { valid: boolean; error?: string } {
  if (pin.length !== 4) return { valid: false, error: 'Le PIN doit contenir 4 chiffres.' };
  if (!/^\d{4}$/.test(pin)) return { valid: false, error: 'Le PIN ne doit contenir que des chiffres.' };
  if (/^(\d)\1{3}$/.test(pin)) return { valid: false, error: 'Évitez les PIN trop simples (ex: 1111).' };
  if (['1234', '4321', '0000'].includes(pin)) return { valid: false, error: 'Ce PIN est trop courant. Choisissez-en un autre.' };
  return { valid: true };
}

// ──── OTP Input Component ────
const OtpInput: React.FC<{
  length: number;
  value: string;
  onChange: (val: string) => void;
  disabled?: boolean;
}> = ({ length, value, onChange, disabled }) => {
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    // Auto-focus first empty box
    const idx = value.length;
    if (idx < length) refs.current[idx]?.focus();
  }, []);

  const handleChange = (i: number, char: string) => {
    if (!/^\d?$/.test(char)) return;
    const arr = value.split('');
    arr[i] = char;
    const next = arr.join('').replace(/undefined/g, '');
    onChange(next.slice(0, length));
    if (char && i < length - 1) refs.current[i + 1]?.focus();
  };

  const handleKeyDown = (i: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !value[i] && i > 0) {
      refs.current[i - 1]?.focus();
      const arr = value.split('');
      arr[i - 1] = '';
      onChange(arr.join(''));
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    onChange(pasted);
    const idx = Math.min(pasted.length, length - 1);
    refs.current[idx]?.focus();
  };

  return (
    <div className="flex justify-center gap-2 sm:gap-3">
      {Array.from({ length }).map((_, i) => (
        <input
          key={i}
          ref={(el) => { refs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={value[i] || ''}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={i === 0 ? handlePaste : undefined}
          disabled={disabled}
          className="w-11 h-13 sm:w-12 sm:h-14 text-center text-xl font-bold border-2 border-gray-200 rounded-xl
                     focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none
                     transition-all duration-200 disabled:opacity-50 disabled:bg-gray-50"
        />
      ))}
    </div>
  );
};

// ──── Step Progress ────
const StepProgress: React.FC<{ current: number; total: number; labels: string[] }> = ({ current, total, labels }) => (
  <div className="flex items-center justify-between mb-6 px-2">
    {labels.map((label, i) => (
      <React.Fragment key={i}>
        <div className="flex flex-col items-center gap-1">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 ${
            i < current
              ? 'bg-green-500 text-white'
              : i === current
                ? 'bg-orange-500 text-white ring-4 ring-orange-100'
                : 'bg-gray-200 text-gray-400'
          }`}>
            {i < current ? <CheckCircle2 className="w-5 h-5" /> : i + 1}
          </div>
          <span className={`text-[10px] sm:text-xs font-medium transition-colors ${
            i <= current ? 'text-gray-700' : 'text-gray-400'
          }`}>{label}</span>
        </div>
        {i < total - 1 && (
          <div className={`flex-1 h-0.5 mx-2 mb-5 rounded transition-colors duration-300 ${
            i < current ? 'bg-green-500' : 'bg-gray-200'
          }`} />
        )}
      </React.Fragment>
    ))}
  </div>
);

// ──── Password Input with toggle ────
const PasswordInput: React.FC<{
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
}> = ({ value, onChange, placeholder = '••••••••', autoFocus }) => {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
      <input
        type={show ? 'text' : 'password'}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoFocus={autoFocus}
        className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-colors"
      />
      <button
        type="button"
        onClick={() => setShow(!show)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
        tabIndex={-1}
      >
        {show ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
      </button>
    </div>
  );
};

// ──── PIN Input (4 boxes) ────
const PinInput: React.FC<{
  value: string;
  onChange: (val: string) => void;
  disabled?: boolean;
  autoFocus?: boolean;
}> = ({ value, onChange, disabled, autoFocus }) => {
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (autoFocus && value.length < 4) refs.current[value.length]?.focus();
  }, []);

  const handleChange = (i: number, char: string) => {
    if (!/^\d?$/.test(char)) return;
    const arr = value.split('');
    arr[i] = char;
    const next = arr.join('').replace(/undefined/g, '');
    onChange(next.slice(0, 4));
    if (char && i < 3) refs.current[i + 1]?.focus();
  };

  const handleKeyDown = (i: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !value[i] && i > 0) {
      refs.current[i - 1]?.focus();
      const arr = value.split('');
      arr[i - 1] = '';
      onChange(arr.join(''));
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4);
    onChange(pasted);
    const idx = Math.min(pasted.length, 3);
    refs.current[idx]?.focus();
  };

  return (
    <div className="flex justify-center gap-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <input
          key={i}
          ref={(el) => { refs.current[i] = el; }}
          type="password"
          inputMode="numeric"
          maxLength={1}
          value={value[i] ? '•' : ''}
          onChange={(e) => {
            const v = e.target.value.replace(/[^0-9]/g, '');
            handleChange(i, v);
          }}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={i === 0 ? handlePaste : undefined}
          disabled={disabled}
          className="w-14 h-14 text-center text-2xl font-bold border-2 border-gray-200 rounded-xl
                     focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none
                     transition-all duration-200 disabled:opacity-50 disabled:bg-gray-50"
        />
      ))}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
export const Auth: React.FC<AuthProps> = ({
  initialMode = 'connexion',
  onSuccess,
  onBack,
}) => {
  const { setAuth } = useAuth();
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const { toasts, addToast, removeToast } = useToast();

  // Inscription
  const [inscriptionStep, setInscriptionStep] = useState<InscriptionStep>('phone');
  const [inscriptionCountry, setInscriptionCountry] = useState(COUNTRY_OPTIONS[0].indicatif);
  const [inscriptionPhone, setInscriptionPhone] = useState('');
  const [inscriptionForm, setInscriptionForm] = useState({
    username: '',
    pin: '',
    confirmPin: '',
    codeParrainage: '',
  });
  const [inscriptionLoading, setInscriptionLoading] = useState(false);

  // Connexion
  const [connexionStep, setConnexionStep] = useState<ConnexionStep>('phone');
  const [connexionCountry, setConnexionCountry] = useState(COUNTRY_OPTIONS[0].indicatif);
  const [connexionPhone, setConnexionPhone] = useState('');
  const [connexionRole, setConnexionRole] = useState<'user' | 'user_x' | null>(null);
  const [connexionOtp, setConnexionOtp] = useState('');
  const [connexionOtpSent, setConnexionOtpSent] = useState(false);
  const [connexionPassword, setConnexionPassword] = useState('');
  const [connexionLoading, setConnexionLoading] = useState(false);

  // Migration PIN (après login avec mot de passe)
  const [migrateOldPassword, setMigrateOldPassword] = useState('');
  const [migrateNewPin, setMigrateNewPin] = useState('');
  const [migrateConfirmPin, setMigrateConfirmPin] = useState('');
  const [migrateLoading, setMigrateLoading] = useState(false);
  const [migrateLoginData, setMigrateLoginData] = useState<{ token: string; user: any } | null>(null);

  // PIN oublié
  const [forgotToken, setForgotToken] = useState('');
  const [forgotNewPin, setForgotNewPin] = useState('');
  const [forgotConfirmPin, setForgotConfirmPin] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotOtpTimer, setForgotOtpTimer] = useState(0);
  const forgotTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Timers
  const [connexionOtpTimer, setConnexionOtpTimer] = useState(0);
  const connexionTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startTimer = (setter: React.Dispatch<React.SetStateAction<number>>, ref: React.MutableRefObject<ReturnType<typeof setInterval> | null>, seconds = 60) => {
    if (ref.current) clearInterval(ref.current);
    setter(seconds);
    ref.current = setInterval(() => {
      setter((v) => {
        if (v <= 1) { if (ref.current) clearInterval(ref.current); return 0; }
        return v - 1;
      });
    }, 1000);
  };

  useEffect(() => () => {
    if (forgotTimerRef.current) clearInterval(forgotTimerRef.current);

    if (connexionTimerRef.current) clearInterval(connexionTimerRef.current);
  }, []);

  const normalizePhone = (indicatif: string, num: string) => {
    const digits = (indicatif + num).replace(/\D/g, '');
    return digits.startsWith('0') ? digits.slice(1) : digits;
  };

  const formatFullPhone = (indicatif: string, num: string) => {
    const n = num.replace(/\D/g, '').trim();
    if (!indicatif && !n) return 'votre numéro';
    const prefix = indicatif ? `+${indicatif} ` : '';
    return `${prefix}${n || '…'}`;
  };

  const selectedCountry = useCallback(
    (indicatif: string) => COUNTRY_OPTIONS.find((c) => c.indicatif === indicatif) || COUNTRY_OPTIONS[0],
    []
  );

  // Step index for progress indicator
  const inscriptionStepIndex = inscriptionStep === 'phone' ? 0 : 1;

  // ——— Inscription handlers ———
  const handleInscriptionContinue = async () => {
    const national = inscriptionPhone.replace(/\D/g, '');
    if (national.length < 6) {
      addToast('error', 'Numéro de téléphone invalide');
      return;
    }
    setInscriptionLoading(true);
    try {
      const { exists } = await authApi.verifyPhone(inscriptionCountry, inscriptionPhone);
      if (exists) {
        addToast('info', 'Ce numéro est déjà enregistré. Connectez-vous.');
        setConnexionCountry(inscriptionCountry);
        setConnexionPhone(inscriptionPhone);
        setConnexionStep('password-only');
        setMode('connexion');
        setInscriptionStep('phone');
        return;
      }
      setInscriptionStep('form');
    } catch (err) {
      const msg = getApiMessage(err);
      if (msg.toLowerCase().includes('déjà utilisé') || msg.toLowerCase().includes('already')) {
        addToast('info', 'Ce numéro est déjà enregistré. Connectez-vous.');
        setConnexionCountry(inscriptionCountry);
        setConnexionPhone(inscriptionPhone);
        setConnexionStep('password-only');
        setMode('connexion');
        setInscriptionStep('phone');
      } else {
        // Si verifyPhone échoue, on laisse quand même passer à l'étape suivante
        setInscriptionStep('form');
      }
    } finally {
      setInscriptionLoading(false);
    }
  };

  const handleInscriptionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { username, pin, confirmPin, codeParrainage } = inscriptionForm;
    if (!username.trim()) {
      addToast('error', 'Nom d\'utilisateur requis');
      return;
    }
    const pinCheck = validatePin(pin);
    if (!pinCheck.valid) {
      addToast('error', pinCheck.error!);
      return;
    }
    if (pin !== confirmPin) {
      addToast('error', 'Les codes PIN ne correspondent pas');
      return;
    }
    setInscriptionLoading(true);
    try {
      const res = await authApi.signup({
        countryCode: inscriptionCountry,
        phoneNumber: inscriptionPhone,
        password: pin,
        username: username.trim(),
        referralCode: codeParrainage.trim() || undefined,
      });
      setAuth(res.token, res.user);
      addToast('success', 'Bienvenue ! Votre compte a été créé.');
      const isAdmin = res.user.role === 'ADMIN' || res.user.role === 'PARTNER';
      onSuccess?.(isAdmin);
    } catch (err) {
      addToast('error', getApiMessage(err));
    } finally {
      setInscriptionLoading(false);
    }
  };

  // ——— Connexion handlers ———
  const handleConnexionContinue = () => {
    const national = connexionPhone.replace(/\D/g, '');
    if (national.length < 6) {
      addToast('error', 'Numéro de téléphone invalide');
      return;
    }
    setConnexionStep('password-only');
  };

  const handleConnexionVerifyOtp = async () => {
    const code = connexionOtp.replace(/\s/g, '');
    if (code.length !== 6) {
      addToast('error', 'Le code doit contenir 6 chiffres');
      return;
    }
    setConnexionLoading(true);
    try {
      const res = await authApi.verifyCode(connexionCountry, connexionPhone, code);
      if ('token' in res && res.token && res.user) {
        setAuth(res.token, res.user);
        try {
          const me = await authApi.getMe();
          setAuth(res.token, { ...res.user, ...me });
          addToast('success', 'Connexion réussie !');
          const isAdmin = me.role === 'ADMIN' || me.role === 'PARTNER';
          onSuccess?.(isAdmin);
        } catch {
          addToast('success', 'Connexion réussie !');
          const isAdmin = res.user.role === 'ADMIN' || res.user.role === 'PARTNER';
          onSuccess?.(isAdmin);
        }
      } else if ('isNewUser' in res && res.isNewUser) {
        addToast('info', 'Ce numéro n\'est pas encore inscrit. Créez un compte.');
        setMode('inscription');
        setInscriptionStep('phone');
        setInscriptionCountry(connexionCountry);
        setInscriptionPhone(connexionPhone);
        setConnexionStep('phone');
        setConnexionOtp('');
      } else {
        addToast('error', 'Réponse inattendue. Réessayez.');
      }
    } catch (err) {
      addToast('error', getApiMessage(err));
    } finally {
      setConnexionLoading(false);
    }
  };

  // Auto-verify connexion OTP
  useEffect(() => {
    if (mode === 'connexion' && connexionStep === 'otp' && connexionOtp.length === 6 && !connexionLoading) {
      handleConnexionVerifyOtp();
    }
  }, [connexionOtp]);

  const handleConnexionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!connexionPassword) {
      addToast('error', 'Mot de passe ou PIN requis');
      return;
    }
    setConnexionLoading(true);
    try {
      const national = connexionPhone.replace(/\D/g, '');
      const res = await authApi.login(national, connexionPassword);
      if (!res?.token) {
        addToast('error', 'Réponse serveur invalide.');
        return;
      }

      // Détecte si l'utilisateur s'est connecté avec un mot de passe (pas un PIN)
      const usedPassword = !isPin(connexionPassword);

      if (usedPassword) {
        // Stocker les infos de login pour après la migration
        setMigrateLoginData({ token: res.token, user: res.user });
        setMigrateOldPassword(connexionPassword);
        setAuth(res.token, res.user);
        setConnexionStep('migrate-pin');
        addToast('info', 'Veuillez migrer vers un code PIN à 4 chiffres.');
      } else {
        setAuth(res.token, res.user);
        try {
          const me = await authApi.getMe();
          setAuth(res.token, { ...res.user, ...me });
          addToast('success', 'Connexion réussie !');
          const isAdmin = me.role === 'ADMIN' || me.role === 'PARTNER';
          onSuccess?.(isAdmin);
        } catch {
          addToast('success', 'Connexion réussie !');
          const isAdmin = res.user?.role === 'ADMIN' || res.user?.role === 'PARTNER';
          onSuccess?.(isAdmin);
        }
      }
    } catch (err) {
      const msg = getApiMessage(err);
      const lower = msg.toLowerCase();
      const needsOtp =
        lower.includes('otp') ||
        lower.includes('code') ||
        lower.includes('verif') ||
        lower.includes('sms');
      if (needsOtp) {
        try {
          await authApi.sendCode(connexionCountry, connexionPhone);
          setConnexionOtpSent(true);
          setConnexionStep('otp');
          startTimer(setConnexionOtpTimer, connexionTimerRef, 60);
          addToast('info', 'Un code de vérification vous a été envoyé.');
        } catch {
          addToast('error', msg);
        }
      } else {
        addToast('error', msg);
      }
    } finally {
      setConnexionLoading(false);
    }
  };

  // ——— Mot de passe oublié ———
  const handleForgotSendToken = async () => {
    setForgotLoading(true);
    try {
      await authApi.verifyPhone(connexionCountry, connexionPhone).then(
        () => ({ res: { status: 200 } })
      ).catch((err: any) => {
        if (err?.message?.toLowerCase().includes('already') || err?.message?.toLowerCase().includes('déjà')) {
          return { res: { status: 409 } };
        }
        throw err;
      });
    } catch {
      // continue anyway
    }
    try {
      await authApi.forgotPasswordToken(connexionCountry, connexionPhone);
      setConnexionStep('forgot-reset');
      startTimer(setForgotOtpTimer, forgotTimerRef, 60);
      addToast('success', 'Code de réinitialisation envoyé par SMS.');
    } catch (err) {
      addToast('error', getApiMessage(err));
    } finally {
      setForgotLoading(false);
    }
  };

  const handleForgotResetPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotToken.trim()) { addToast('error', 'Entrez le code reçu par SMS.'); return; }
    const pinCheck = validatePin(forgotNewPin);
    if (!pinCheck.valid) { addToast('error', pinCheck.error!); return; }
    if (forgotNewPin !== forgotConfirmPin) { addToast('error', 'Les codes PIN ne correspondent pas.'); return; }
    setForgotLoading(true);
    try {
      await authApi.resetPassword(forgotToken.trim(), forgotNewPin);
      addToast('success', 'PIN réinitialisé ! Connectez-vous.');
      setConnexionStep('password-only');
      setForgotToken('');
      setForgotNewPin('');
      setForgotConfirmPin('');
      setConnexionPassword('');
    } catch (err) {
      addToast('error', getApiMessage(err));
    } finally {
      setForgotLoading(false);
    }
  };

  const handleMigratePin = async () => {
    const pinCheck = validatePin(migrateNewPin);
    if (!pinCheck.valid) { addToast('error', pinCheck.error!); return; }
    if (migrateNewPin !== migrateConfirmPin) { addToast('error', 'Les codes PIN ne correspondent pas.'); return; }
    setMigrateLoading(true);
    try {
      const national = connexionPhone.replace(/\D/g, '');
      await authApi.changePassword(national, migrateOldPassword, migrateNewPin);
      addToast('success', 'PIN mis à jour ! Bienvenue.');
      if (migrateLoginData) {
        try {
          const me = await authApi.getMe();
          setAuth(migrateLoginData.token, { ...migrateLoginData.user, ...me });
          const isAdmin = me.role === 'ADMIN' || me.role === 'PARTNER';
          onSuccess?.(isAdmin);
        } catch {
          const isAdmin = migrateLoginData.user?.role === 'ADMIN' || migrateLoginData.user?.role === 'PARTNER';
          onSuccess?.(isAdmin);
        }
      }
    } catch (err) {
      addToast('error', getApiMessage(err));
    } finally {
      setMigrateLoading(false);
    }
  };

  const handleSkipMigration = () => {
    if (migrateLoginData) {
      addToast('success', 'Connexion réussie !');
      const isAdmin = migrateLoginData.user?.role === 'ADMIN' || migrateLoginData.user?.role === 'PARTNER';
      onSuccess?.(isAdmin);
    }
  };

  // ——— Navigation ———
  const canGoBackInscription =
    mode === 'inscription' && inscriptionStep === 'form';
  const canGoBackConnexion =
    mode === 'connexion' &&
    (connexionStep === 'otp' || connexionStep === 'password' || connexionStep === 'password-only' || connexionStep === 'forgot-send' || connexionStep === 'forgot-reset' || connexionStep === 'migrate-pin');

  const goBackInscription = () => {
    if (inscriptionStep === 'form') setInscriptionStep('phone');
  };

  const goBackConnexion = () => {
    if (connexionStep === 'migrate-pin') {
      handleSkipMigration();
      return;
    } else if (connexionStep === 'forgot-reset') {
      setConnexionStep('forgot-send');
      setForgotToken('');
    } else if (connexionStep === 'forgot-send') {
      setConnexionStep('password-only');
    } else if (connexionStep === 'password' || connexionStep === 'password-only') {
      setConnexionStep('phone');
      setConnexionRole(null);
      setConnexionPassword('');
    } else if (connexionStep === 'otp') {
      setConnexionStep('phone');
      setConnexionRole(null);
      setConnexionOtpSent(false);
      setConnexionOtp('');
    }
  };

  const handleGoBack = () => {
    if (canGoBackInscription) goBackInscription();
    else if (canGoBackConnexion) goBackConnexion();
    else onBack?.();
  };

  const showBackButton =
    onBack && (canGoBackInscription || canGoBackConnexion ||
      (mode === 'connexion' && connexionStep === 'phone') ||
      (mode === 'inscription' && inscriptionStep === 'phone'));

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-orange-50/30 flex flex-col items-center justify-center px-3 py-6 sm:p-4 relative overflow-hidden">
      {/* Decorative blobs */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500/8 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-500/8 rounded-full blur-[120px] translate-y-1/2 -translate-x-1/2" />
      <ToastContainer toasts={toasts} onClose={removeToast} />

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <img src={LogoTouristeBj} alt="Le Touriste.bj" className="h-12 object-contain" />
        </div>

        {showBackButton && (
          <button
            type="button"
            onClick={handleGoBack}
            className="flex items-center gap-2 text-gray-500 hover:text-gray-800 mb-4 transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour
          </button>
        )}

        <div className="relative bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-gray-100">
            {(['inscription', 'connexion'] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => {
                  setMode(m);
                  if (m === 'inscription') {
                    setInscriptionStep('phone');
                  }
                  setConnexionStep('phone');
                  setConnexionRole(null);
                  setConnexionOtp('');
                  setConnexionPassword('');
                }}
                className={`flex-1 py-3.5 text-sm font-semibold transition-all duration-200 ${
                  mode === m
                    ? 'text-orange-600 border-b-2 border-orange-500 bg-orange-50/40'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                {m === 'inscription' ? 'Inscription' : 'Connexion'}
              </button>
            ))}
          </div>

          <div className="p-5 sm:p-7">
            {/* ═══ INSCRIPTION ═══ */}
            {mode === 'inscription' && (
              <div className="space-y-0">
                <StepProgress
                  current={inscriptionStepIndex}
                  total={2}
                  labels={['Téléphone', 'Profil & PIN']}
                />

                {/* Step 1: Phone */}
                {inscriptionStep === 'phone' && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">Créer votre compte</h2>
                      <p className="text-sm text-gray-500 mt-1">
                        Entrez votre numéro de téléphone pour commencer.
                      </p>
                    </div>

                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl px-4 py-3">
                      <p className="text-xs text-blue-700 leading-relaxed">
                        Vous avez un compte <strong>Zepargn</strong> ? Utilisez les mêmes identifiants pour vous connecter directement.
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Pays</label>
                      <select
                        value={inscriptionCountry}
                        onChange={(e) => setInscriptionCountry(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none bg-white transition-colors"
                      >
                        {COUNTRY_OPTIONS.map((c) => (
                          <option key={c.code} value={c.indicatif}>
                            {c.flag} {c.label} {c.indicatif ? `(+${c.indicatif})` : ''}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Numéro de téléphone</label>
                      <div className="relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-gray-500 text-sm font-medium pointer-events-none">
                          <Phone className="w-4 h-4" />
                          <span>+{inscriptionCountry}</span>
                        </div>
                        <input
                          type="tel"
                          inputMode="numeric"
                          placeholder={inscriptionCountry === '229' ? '97 12 34 56' : '6 12 34 56 78'}
                          value={inscriptionPhone}
                          onChange={(e) => setInscriptionPhone(e.target.value.replace(/\D/g, ' ').trim().replace(/\s+/g, ' '))}
                          autoFocus
                          className="w-full pl-24 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-colors"
                        />
                      </div>
                    </div>

                    <Button
                      className="w-full rounded-xl py-3 bg-orange-500 hover:bg-orange-600 shadow-lg shadow-orange-500/20 transition-all"
                      onClick={handleInscriptionContinue}
                      disabled={inscriptionLoading || inscriptionPhone.replace(/\D/g, '').length < 6}
                    >
                      {inscriptionLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        'Continuer'
                      )}
                    </Button>
                  </div>
                )}

                {/* Step 2: Profile form */}
                {inscriptionStep === 'form' && (
                  <form onSubmit={handleInscriptionSubmit} className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">Finalisez votre profil</h2>
                      <p className="text-sm text-gray-500 mt-1">
                        Dernière étape ! Choisissez votre nom d'utilisateur et un code PIN.
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Nom d'utilisateur</label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Ex: jean_dupont"
                          value={inscriptionForm.username}
                          onChange={(e) => setInscriptionForm((p) => ({ ...p, username: e.target.value }))}
                          autoFocus
                          className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-colors"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Code PIN (4 chiffres)</label>
                      <PinInput
                        value={inscriptionForm.pin}
                        onChange={(v) => setInscriptionForm((p) => ({ ...p, pin: v }))}
                        autoFocus={false}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Confirmer le PIN</label>
                      <PinInput
                        value={inscriptionForm.confirmPin}
                        onChange={(v) => setInscriptionForm((p) => ({ ...p, confirmPin: v }))}
                      />
                      {inscriptionForm.confirmPin.length === 4 && inscriptionForm.pin !== inscriptionForm.confirmPin && (
                        <p className="text-xs text-red-500 mt-2 text-center">Les codes PIN ne correspondent pas</p>
                      )}
                      {inscriptionForm.confirmPin.length === 4 && inscriptionForm.pin === inscriptionForm.confirmPin && (
                        <p className="text-xs text-green-600 mt-2 text-center flex items-center justify-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> PIN identiques
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Code de parrainage <span className="text-gray-400 font-normal">(optionnel)</span>
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="text"
                          placeholder="CODE123"
                          value={inscriptionForm.codeParrainage}
                          onChange={(e) => setInscriptionForm((p) => ({ ...p, codeParrainage: e.target.value }))}
                          className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-colors"
                        />
                      </div>
                    </div>

                    <Button
                      type="submit"
                      className="w-full rounded-xl py-3 bg-orange-500 hover:bg-orange-600 shadow-lg shadow-orange-500/20 transition-all"
                      disabled={inscriptionLoading || !inscriptionForm.username.trim() || inscriptionForm.pin.length !== 4}
                    >
                      {inscriptionLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        "Créer mon compte"
                      )}
                    </Button>
                  </form>
                )}
              </div>
            )}

            {/* ═══ CONNEXION ═══ */}
            {mode === 'connexion' && (
              <>
                {connexionStep === 'phone' && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">Bon retour !</h2>
                      <p className="text-sm text-gray-500 mt-1">
                        Connectez-vous pour accéder à votre espace.
                      </p>
                    </div>

                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl px-4 py-3">
                      <p className="text-xs text-blue-700 leading-relaxed">
                        Utilisez vos identifiants <strong>Zepargn</strong> (même numéro et PIN).
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Pays</label>
                      <select
                        value={connexionCountry}
                        onChange={(e) => setConnexionCountry(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none bg-white transition-colors"
                      >
                        {COUNTRY_OPTIONS.map((c) => (
                          <option key={c.code} value={c.indicatif}>
                            {c.flag} {c.label} {c.indicatif ? `(+${c.indicatif})` : ''}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Numéro de téléphone</label>
                      <div className="relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-gray-500 text-sm font-medium pointer-events-none">
                          <Phone className="w-4 h-4" />
                          <span>+{connexionCountry}</span>
                        </div>
                        <input
                          type="tel"
                          inputMode="numeric"
                          placeholder={connexionCountry === '229' ? '97 12 34 56' : '6 12 34 56 78'}
                          value={connexionPhone}
                          onChange={(e) => setConnexionPhone(e.target.value.replace(/\D/g, ' ').trim().replace(/\s+/g, ' '))}
                          autoFocus
                          className="w-full pl-24 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-colors"
                        />
                      </div>
                    </div>

                    <Button
                      className="w-full rounded-xl py-3 bg-orange-500 hover:bg-orange-600 shadow-lg shadow-orange-500/20 transition-all"
                      onClick={handleConnexionContinue}
                      disabled={connexionPhone.replace(/\D/g, '').length < 6}
                    >
                      Continuer
                    </Button>
                  </div>
                )}

                {connexionStep === 'otp' && (
                  <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-orange-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                        <ShieldCheck className="w-7 h-7 text-orange-500" />
                      </div>
                      <h2 className="text-xl font-bold text-gray-900">Code de vérification</h2>
                      <p className="text-sm text-gray-500 mt-1">
                        Code envoyé au <strong className="text-gray-700">{formatFullPhone(connexionCountry, connexionPhone)}</strong>
                      </p>
                    </div>

                    <OtpInput
                      length={6}
                      value={connexionOtp}
                      onChange={setConnexionOtp}
                      disabled={connexionLoading}
                    />

                    {connexionLoading && (
                      <div className="flex justify-center">
                        <Loader2 className="w-5 h-5 animate-spin text-orange-500" />
                      </div>
                    )}

                    {connexionOtpTimer > 0 ? (
                      <p className="text-center text-xs text-gray-400">
                        Renvoyer dans <span className="font-mono font-semibold text-gray-600">{connexionOtpTimer}s</span>
                      </p>
                    ) : (
                      <button
                        type="button"
                        onClick={async () => {
                          setConnexionLoading(true);
                          try {
                            await authApi.sendCode(connexionCountry, connexionPhone);
                            startTimer(setConnexionOtpTimer, connexionTimerRef, 60);
                            addToast('success', 'Code renvoyé.');
                          } catch (err) {
                            addToast('error', getApiMessage(err));
                          } finally {
                            setConnexionLoading(false);
                          }
                        }}
                        disabled={connexionLoading}
                        className="w-full text-center text-sm text-orange-600 hover:text-orange-700 font-medium disabled:opacity-50"
                      >
                        Renvoyer le code
                      </button>
                    )}
                  </div>
                )}

                {(connexionStep === 'password' || connexionStep === 'password-only') && (
                  <form onSubmit={handleConnexionSubmit} className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">Code PIN</h2>
                      <p className="text-sm text-gray-500 mt-1">
                        Connectez-vous au{' '}
                        <span className="font-medium text-gray-700">{formatFullPhone(connexionCountry, connexionPhone)}</span>
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">PIN ou mot de passe</label>
                      <PasswordInput
                        value={connexionPassword}
                        onChange={setConnexionPassword}
                        placeholder="••••"
                        autoFocus
                      />
                    </div>

                    <Button
                      type="submit"
                      className="w-full rounded-xl py-3 bg-orange-500 hover:bg-orange-600 shadow-lg shadow-orange-500/20 transition-all"
                      disabled={connexionLoading || !connexionPassword}
                    >
                      {connexionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Se connecter'}
                    </Button>

                    <button
                      type="button"
                      onClick={() => setConnexionStep('forgot-send')}
                      className="w-full text-center text-sm text-orange-600 hover:text-orange-700 font-medium transition-colors"
                    >
                      PIN oublié ?
                    </button>
                  </form>
                )}

                {/* Migration PIN */}
                {connexionStep === 'migrate-pin' && (
                  <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-orange-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                        <KeyRound className="w-7 h-7 text-orange-500" />
                      </div>
                      <h2 className="text-xl font-bold text-gray-900">Passez au code PIN</h2>
                      <p className="text-sm text-gray-500 mt-1">
                        Pour plus de simplicité, remplacez votre mot de passe par un code PIN à 4 chiffres.
                      </p>
                    </div>

                    <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                      <p className="text-xs text-amber-800 leading-relaxed font-medium">
                        Obligatoire avant le 30 avril 2026. Les mots de passe ne seront plus acceptés après cette date.
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2 text-center">Nouveau code PIN</label>
                      <PinInput
                        value={migrateNewPin}
                        onChange={setMigrateNewPin}
                        autoFocus
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2 text-center">Confirmer le PIN</label>
                      <PinInput
                        value={migrateConfirmPin}
                        onChange={setMigrateConfirmPin}
                      />
                      {migrateConfirmPin.length === 4 && migrateNewPin !== migrateConfirmPin && (
                        <p className="text-xs text-red-500 mt-2 text-center">Les codes PIN ne correspondent pas</p>
                      )}
                    </div>

                    <Button
                      className="w-full rounded-xl py-3 bg-orange-500 hover:bg-orange-600 shadow-lg shadow-orange-500/20 transition-all"
                      onClick={handleMigratePin}
                      disabled={migrateLoading || migrateNewPin.length !== 4 || migrateNewPin !== migrateConfirmPin}
                    >
                      {migrateLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Mettre à jour mon PIN'}
                    </Button>

                    <button
                      type="button"
                      onClick={handleSkipMigration}
                      className="w-full text-center text-sm text-gray-400 hover:text-gray-600 font-medium transition-colors"
                    >
                      Passer pour l'instant
                    </button>
                  </div>
                )}

                {/* Forgot — send token */}
                {connexionStep === 'forgot-send' && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-orange-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                        <ShieldCheck className="w-7 h-7 text-orange-500" />
                      </div>
                      <h2 className="text-xl font-bold text-gray-900">Réinitialiser le PIN</h2>
                      <p className="text-sm text-gray-500 mt-2">
                        Un code de réinitialisation sera envoyé au{' '}
                        <strong className="text-gray-700">+{connexionCountry} {connexionPhone}</strong>
                      </p>
                    </div>
                    <Button
                      className="w-full rounded-xl py-3 bg-orange-500 hover:bg-orange-600 shadow-lg shadow-orange-500/20 transition-all"
                      onClick={handleForgotSendToken}
                      disabled={forgotLoading}
                    >
                      {forgotLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Envoyer le code par SMS'}
                    </Button>
                  </div>
                )}

                {/* Forgot — reset with PIN */}
                {connexionStep === 'forgot-reset' && (
                  <form onSubmit={handleForgotResetPin} className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">Nouveau code PIN</h2>
                      <p className="text-sm text-gray-500 mt-1">
                        Entrez le code reçu par SMS et choisissez un nouveau PIN à 4 chiffres.
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Code de réinitialisation</label>
                      <input
                        type="text"
                        placeholder="a3f9c12b4d"
                        value={forgotToken}
                        onChange={(e) => setForgotToken(e.target.value)}
                        autoFocus
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none font-mono tracking-widest transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2 text-center">Nouveau PIN</label>
                      <PinInput
                        value={forgotNewPin}
                        onChange={setForgotNewPin}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2 text-center">Confirmer le PIN</label>
                      <PinInput
                        value={forgotConfirmPin}
                        onChange={setForgotConfirmPin}
                      />
                      {forgotConfirmPin.length === 4 && forgotNewPin !== forgotConfirmPin && (
                        <p className="text-xs text-red-500 mt-2 text-center">Les codes PIN ne correspondent pas</p>
                      )}
                    </div>

                    <Button
                      type="submit"
                      className="w-full rounded-xl py-3 bg-orange-500 hover:bg-orange-600 shadow-lg shadow-orange-500/20 transition-all"
                      disabled={forgotLoading || forgotNewPin.length !== 4}
                    >
                      {forgotLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Réinitialiser le PIN'}
                    </Button>

                    {forgotOtpTimer > 0 ? (
                      <p className="text-center text-xs text-gray-400">
                        Renvoyer dans <span className="font-mono font-semibold text-gray-600">{forgotOtpTimer}s</span>
                      </p>
                    ) : (
                      <button
                        type="button"
                        onClick={handleForgotSendToken}
                        className="w-full text-center text-sm text-orange-600 hover:text-orange-700 font-medium"
                      >
                        Renvoyer le code
                      </button>
                    )}
                  </form>
                )}
              </>
            )}
          </div>
        </div>

        {/* Bottom switch */}
        <p className="text-center text-sm text-gray-500 mt-6">
          {mode === 'inscription'
            ? 'Déjà inscrit ? '
            : 'Pas encore de compte ? '}
          <button
            type="button"
            onClick={() => setMode(mode === 'inscription' ? 'connexion' : 'inscription')}
            className="text-orange-600 font-semibold hover:underline"
          >
            {mode === 'inscription' ? 'Se connecter' : "S'inscrire"}
          </button>
        </p>
      </div>
    </div>
  );
};

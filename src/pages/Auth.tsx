import React, { useState, useEffect, useRef } from 'react';
import { Phone, KeyRound, User, Mail, ArrowLeft, Loader2, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ToastContainer, useToast } from '@/components/Toast';
import { useAuth } from '../context/AuthContext';
import * as authApi from '../api/auth';
import type { ApiError } from '../api/client';

export type AuthMode = 'inscription' | 'connexion';

type InscriptionStep = 'phone' | 'otp' | 'form';
type ConnexionStep = 'phone' | 'otp' | 'password' | 'password-only' | 'forgot-send' | 'forgot-reset';

interface AuthProps {
  initialMode?: AuthMode;
  /** Appelé après connexion/inscription avec token. isAdmin = true si rôle ADMIN ou PARTNER */
  onSuccess?: (isAdmin: boolean) => void;
  onBack?: () => void;
}

// Pays avec indicatif téléphonique
const COUNTRY_OPTIONS: { code: string; label: string; indicatif: string }[] = [
  { code: 'BJ', label: 'Bénin', indicatif: '229' },
  { code: 'FR', label: 'France', indicatif: '33' },
  { code: 'TG', label: 'Togo', indicatif: '228' },
  { code: 'NE', label: 'Niger', indicatif: '227' },
  { code: 'NG', label: 'Nigeria', indicatif: '234' },
  { code: 'SN', label: 'Sénégal', indicatif: '221' },
  { code: 'BF', label: 'Burkina Faso', indicatif: '226' },
  { code: 'ML', label: 'Mali', indicatif: '223' },
  { code: 'GH', label: 'Ghana', indicatif: '233' },
  { code: 'CI', label: "Côte d'Ivoire", indicatif: '225' },
  { code: 'CM', label: 'Cameroun', indicatif: '237' },
  { code: 'CD', label: 'RD Congo', indicatif: '243' },
  { code: 'GA', label: 'Gabon', indicatif: '241' },
  { code: 'BE', label: 'Belgique', indicatif: '32' },
  { code: 'CH', label: 'Suisse', indicatif: '41' },
  { code: 'CA', label: 'Canada', indicatif: '1' },
  { code: 'US', label: 'États-Unis', indicatif: '1' },
  { code: 'GB', label: 'Royaume-Uni', indicatif: '44' },
  { code: 'OTHER', label: 'Autre', indicatif: '' },
];

function getApiMessage(err: unknown): string {
  return (err as ApiError)?.message || 'Une erreur est survenue';
}

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
  const [inscriptionOtp, setInscriptionOtp] = useState('');
  const [inscriptionOtpSent, setInscriptionOtpSent] = useState(false);
  const [inscriptionForm, setInscriptionForm] = useState({
    username: '',
    password: '',
    confirmPassword: '',
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

  // Mot de passe oublié
  const [forgotToken, setForgotToken] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotOtpTimer, setForgotOtpTimer] = useState(0);
  const forgotTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Inscription OTP timer
  const [inscriptionOtpTimer, setInscriptionOtpTimer] = useState(0);
  const inscriptionTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Connexion OTP timer
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
    if (inscriptionTimerRef.current) clearInterval(inscriptionTimerRef.current);
    if (connexionTimerRef.current) clearInterval(connexionTimerRef.current);
  }, []);

  const normalizePhone = (indicatif: string, num: string) => {
    const digits = (indicatif + num).replace(/\D/g, '');
    return digits.startsWith('0') ? digits.slice(1) : digits;
  };

  const getFullPhoneInscription = () =>
    normalizePhone(inscriptionCountry, inscriptionPhone);
  const getFullPhoneConnexion = () =>
    normalizePhone(connexionCountry, connexionPhone);

  const formatFullPhone = (indicatif: string, num: string) => {
    const n = num.replace(/\D/g, '').trim();
    if (!indicatif && !n) return 'votre numéro';
    const prefix = indicatif ? `+${indicatif} ` : '';
    return `${prefix}${n || '…'}`;
  };

  // ——— Inscription ———
  const handleInscriptionSendOtp = async () => {
    const national = inscriptionPhone.replace(/\D/g, '');
    if (national.length < 6) {
      addToast('error', 'Numéro de téléphone invalide');
      return;
    }
    setInscriptionLoading(true);
    try {
      const { exists } = await authApi.verifyPhone(inscriptionCountry, inscriptionPhone);
      if (exists) {
        addToast('info', 'Ce numéro est déjà enregistré. Veuillez vous connecter.');
        setConnexionCountry(inscriptionCountry);
        setConnexionPhone(inscriptionPhone);
        setConnexionStep('phone');
        setMode('connexion');
        setInscriptionStep('phone');
        setInscriptionOtp('');
        return;
      }
      await authApi.initiatePhoneVerification(inscriptionCountry, inscriptionPhone);
      setInscriptionOtpSent(true);
      setInscriptionStep('otp');
      startTimer(setInscriptionOtpTimer, inscriptionTimerRef, 60);
      addToast('success', 'Code envoyé sur votre téléphone');
    } catch (err) {
      const msg = getApiMessage(err);
      addToast('error', msg);
      if (msg.toLowerCase().includes('déjà utilisé') || msg.toLowerCase().includes('already')) {
        setConnexionCountry(inscriptionCountry);
        setConnexionPhone(inscriptionPhone);
        setConnexionStep('phone');
        setMode('connexion');
        setInscriptionStep('phone');
        setInscriptionOtp('');
      }
    } finally {
      setInscriptionLoading(false);
    }
  };

  const handleInscriptionVerifyOtp = async () => {
    const code = inscriptionOtp.replace(/\s/g, '');
    if (code.length !== 6) {
      addToast('error', 'Le code doit contenir 6 chiffres');
      return;
    }
    setInscriptionLoading(true);
    try {
      const res = await authApi.verifyCode(inscriptionCountry, inscriptionPhone, code);
      if ('isNewUser' in res && res.isNewUser) {
        setInscriptionStep('form');
        addToast('success', 'Code validé. Finalisez votre inscription.');
      } else if ('token' in res && res.token && res.user) {
        setAuth(res.token, res.user);
        addToast('success', 'Vous avez déjà un compte. Connexion réussie.');
        const isAdmin = res.user.role === 'ADMIN' || res.user.role === 'PARTNER';
        onSuccess?.(isAdmin);
      }
    } catch (err) {
      addToast('error', getApiMessage(err));
    } finally {
      setInscriptionLoading(false);
    }
  };

  const handleInscriptionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { username, password, confirmPassword, codeParrainage } = inscriptionForm;
    if (!username.trim()) {
      addToast('error', 'Nom d\'utilisateur requis');
      return;
    }
    if (password.length < 8) {
      addToast('error', 'Le mot de passe doit contenir au moins 8 caractères (majuscule, minuscule, chiffre, caractère spécial)');
      return;
    }
    if (password !== confirmPassword) {
      addToast('error', 'Les mots de passe ne correspondent pas');
      return;
    }
    setInscriptionLoading(true);
    try {
      const res = await authApi.signup({
        countryCode: inscriptionCountry,
        phoneNumber: inscriptionPhone,
        password,
        username: username.trim(),
        referralCode: codeParrainage.trim() || undefined,
      });
      setAuth(res.token, res.user);
      addToast('success', 'Inscription réussie ! Bienvenue.');
      const isAdmin = res.user.role === 'ADMIN' || res.user.role === 'PARTNER';
      onSuccess?.(isAdmin);
    } catch (err) {
      addToast('error', getApiMessage(err));
    } finally {
      setInscriptionLoading(false);
    }
  };

  // ——— Connexion ———
  const handleConnexionContinue = async () => {
    const national = connexionPhone.replace(/\D/g, '');
    if (national.length < 6) {
      addToast('error', 'Numéro de téléphone invalide');
      return;
    }
    setConnexionLoading(true);
    try {
      await authApi.sendCode(connexionCountry, connexionPhone);
      setConnexionOtpSent(true);
      setConnexionStep('otp');
      startTimer(setConnexionOtpTimer, connexionTimerRef, 60);
      addToast('success', 'Code envoyé sur votre téléphone');
    } catch (err) {
      const msg = getApiMessage(err);
      const lower = msg.toLowerCase();
      // USER_X, ADMIN, PARTNER : pas d'OTP, afficher directement le mot de passe
      const usePasswordDirectly =
        lower.includes('déjà vérifié') ||
        lower.includes('already verified') ||
        lower.includes('déjà utilisé') ||
        lower.includes('already used') ||
        lower.includes('password') ||
        lower.includes('mot de passe') ||
        lower.includes('connecter');
      if (usePasswordDirectly) {
        setConnexionRole('user_x');
        setConnexionStep('password-only');
        addToast('info', 'Entrez votre mot de passe pour vous connecter.');
      } else {
        addToast('error', msg);
      }
    } finally {
      setConnexionLoading(false);
    }
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
        // Stocker d'abord avec les données de base
        setAuth(res.token, res.user);
        // Enrichir avec le profil complet (inclut role, username, etc.)
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
        addToast('error', 'Réponse inattendue du serveur. Réessayez.');
      }
    } catch (err) {
      addToast('error', getApiMessage(err));
    } finally {
      setConnexionLoading(false);
    }
  };

  const handleConnexionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!connexionPassword) {
      addToast('error', 'Mot de passe requis');
      return;
    }
    setConnexionLoading(true);
    try {
      const national = connexionPhone.replace(/\D/g, '');
      const res = await authApi.login(national, connexionPassword);
      if (!res?.token) {
        addToast('error', 'Réponse serveur invalide : token manquant.');
        return;
      }
      setAuth(res.token, res.user);
      // Enrichir avec le profil complet pour avoir le vrai role
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
    } catch (err) {
      addToast('error', getApiMessage(err));
    } finally {
      setConnexionLoading(false);
    }
  };

  // ——— Mot de passe oublié ———
  const handleForgotSendToken = async () => {
    setForgotLoading(true);
    try {
      // D'abord vérifier que le compte existe (409 = existe)
      const { res } = await authApi.verifyPhone(connexionCountry, connexionPhone).then(
        () => ({ res: { status: 200 } })
      ).catch((err: any) => {
        if (err?.message?.toLowerCase().includes('already') || err?.message?.toLowerCase().includes('déjà')) {
          return { res: { status: 409 } };
        }
        throw err;
      });
      if (res.status !== 409) {
        addToast('error', 'Aucun compte trouvé pour ce numéro.');
        setForgotLoading(false);
        return;
      }
    } catch {
      // Continuer quand même - le compte doit exister puisque l'utilisateur essaie de se connecter
    }
    try {
      await authApi.forgotPasswordToken(connexionCountry, connexionPhone);
      setConnexionStep('forgot-reset');
      startTimer(setForgotOtpTimer, forgotTimerRef, 60);
      addToast('success', 'Code de réinitialisation envoyé par SMS (10 caractères).');
    } catch (err) {
      addToast('error', getApiMessage(err));
    } finally {
      setForgotLoading(false);
    }
  };

  const handleForgotResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotToken.trim()) { addToast('error', 'Entrez le code reçu par SMS.'); return; }
    if (forgotNewPassword.length < 8) { addToast('error', 'Le mot de passe doit contenir au moins 8 caractères.'); return; }
    if (forgotNewPassword !== forgotConfirmPassword) { addToast('error', 'Les mots de passe ne correspondent pas.'); return; }
    setForgotLoading(true);
    try {
      await authApi.resetPassword(forgotToken.trim(), forgotNewPassword);
      addToast('success', 'Mot de passe réinitialisé ! Connectez-vous.');
      setConnexionStep('password-only');
      setForgotToken('');
      setForgotNewPassword('');
      setForgotConfirmPassword('');
      setConnexionPassword('');
    } catch (err) {
      addToast('error', getApiMessage(err));
    } finally {
      setForgotLoading(false);
    }
  };

  const canGoBackInscription =
    mode === 'inscription' &&
    (inscriptionStep === 'otp' || inscriptionStep === 'form');
  const canGoBackConnexion =
    mode === 'connexion' &&
    (connexionStep === 'otp' || connexionStep === 'password' || connexionStep === 'password-only' || connexionStep === 'forgot-send' || connexionStep === 'forgot-reset');

  const goBackInscription = () => {
    if (inscriptionStep === 'form') setInscriptionStep('otp');
    else if (inscriptionStep === 'otp') {
      setInscriptionStep('phone');
      setInscriptionOtpSent(false);
      setInscriptionOtp('');
    }
  };

  const goBackConnexion = () => {
    if (connexionStep === 'forgot-reset') {
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50 flex flex-col items-center justify-center p-4">
      <ToastContainer toasts={toasts} onClose={removeToast} />

      <div className="w-full max-w-md">
        {onBack && (canGoBackInscription || canGoBackConnexion) ? (
          <button
            type="button"
            onClick={mode === 'inscription' ? goBackInscription : goBackConnexion}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour
          </button>
        ) : onBack && mode === 'connexion' && connexionStep === 'phone' ? (
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour
          </button>
        ) : onBack && mode === 'inscription' && inscriptionStep === 'phone' ? (
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour
          </button>
        ) : null}

        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          {/* Tabs Inscription / Connexion */}
          <div className="flex border-b border-gray-200">
            <button
              type="button"
              onClick={() => {
                setMode('inscription');
                setInscriptionStep('phone');
                setInscriptionOtpSent(false);
                setInscriptionOtp('');
                setConnexionStep('phone');
                setConnexionRole(null);
                setConnexionOtp('');
                setConnexionPassword('');
              }}
              className={`flex-1 py-4 text-sm font-semibold transition-colors ${
                mode === 'inscription'
                  ? 'text-orange-600 border-b-2 border-orange-500 bg-orange-50/50'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Inscription
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('connexion');
                setConnexionStep('phone');
                setConnexionRole(null);
                setConnexionOtp('');
                setConnexionPassword('');
                setInscriptionStep('phone');
                setInscriptionOtpSent(false);
              }}
              className={`flex-1 py-4 text-sm font-semibold transition-colors ${
                mode === 'connexion'
                  ? 'text-orange-600 border-b-2 border-orange-500 bg-orange-50/50'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Connexion
            </button>
          </div>

          <div className="p-6 md:p-8">
            {/* ——— Inscription ——— */}
            {mode === 'inscription' && (
              <>
                {inscriptionStep === 'phone' && (
                  <div className="space-y-4">
                    <h2 className="text-xl font-bold text-gray-900">Créer un compte</h2>
                    <p className="text-sm text-gray-600">
                      Choisissez votre pays puis entrez votre numéro. Nous vous enverrons un code de vérification.
                    </p>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Pays (indicatif)
                      </label>
                      <select
                        value={inscriptionCountry}
                        onChange={(e) => setInscriptionCountry(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none bg-white"
                      >
                        {COUNTRY_OPTIONS.map((c) => (
                          <option key={c.code} value={c.indicatif}>
                            {c.label} {c.indicatif ? `(+${c.indicatif})` : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Numéro de téléphone
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="tel"
                          inputMode="numeric"
                          placeholder={inscriptionCountry === '229' ? '01 23 45 67 89' : '6 12 34 56 78'}
                          value={inscriptionPhone}
                          onChange={(e) => setInscriptionPhone(e.target.value.replace(/\D/g, ' ').trim().replace(/\s+/g, ' '))}
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                        />
                      </div>
                    </div>
                    <Button
                      className="w-full rounded-xl py-3 bg-orange-500 hover:bg-orange-600"
                      onClick={handleInscriptionSendOtp}
                      disabled={inscriptionLoading}
                    >
                      {inscriptionLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        'Envoyer le code OTP'
                      )}
                    </Button>
                  </div>
                )}

                {inscriptionStep === 'otp' && (
                  <div className="space-y-4">
                    <h2 className="text-xl font-bold text-gray-900">Vérification</h2>
                    <p className="text-sm text-gray-600">
                      Entrez le code à 6 chiffres envoyé au {formatFullPhone(inscriptionCountry, inscriptionPhone)}.
                    </p>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Code OTP
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        placeholder="123456"
                        value={inscriptionOtp}
                        onChange={(e) => setInscriptionOtp(e.target.value.replace(/\D/g, ''))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none text-center text-lg tracking-widest"
                      />
                    </div>
                    <Button
                      className="w-full rounded-xl py-3 bg-orange-500 hover:bg-orange-600"
                      onClick={handleInscriptionVerifyOtp}
                      disabled={inscriptionLoading || inscriptionOtp.length !== 6}
                    >
                      {inscriptionLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        'Valider le code'
                      )}
                    </Button>
                    {inscriptionOtpTimer > 0 ? (
                      <p className="text-center text-xs text-gray-400">Renvoyer dans {inscriptionOtpTimer}s</p>
                    ) : (
                      <button
                        type="button"
                        onClick={async () => {
                          setInscriptionLoading(true);
                          try {
                            await authApi.initiatePhoneVerification(inscriptionCountry, inscriptionPhone);
                            startTimer(setInscriptionOtpTimer, inscriptionTimerRef, 60);
                            addToast('success', 'Code renvoyé.');
                          } catch (err) {
                            addToast('error', getApiMessage(err));
                          } finally {
                            setInscriptionLoading(false);
                          }
                        }}
                        disabled={inscriptionLoading}
                        className="w-full text-center text-sm text-orange-600 hover:underline disabled:opacity-50"
                      >
                        Renvoyer le code
                      </button>
                    )}
                  </div>
                )}

                {inscriptionStep === 'form' && (
                  <form onSubmit={handleInscriptionSubmit} className="space-y-4">
                    <h2 className="text-xl font-bold text-gray-900">Finaliser l'inscription</h2>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nom d'utilisateur
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="text"
                          placeholder="johndoe"
                          value={inscriptionForm.username}
                          onChange={(e) =>
                            setInscriptionForm((p) => ({ ...p, username: e.target.value }))
                          }
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Mot de passe
                      </label>
                      <div className="relative">
                        <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="password"
                          placeholder="••••••••"
                          value={inscriptionForm.password}
                          onChange={(e) =>
                            setInscriptionForm((p) => ({ ...p, password: e.target.value }))
                          }
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Confirmer le mot de passe
                      </label>
                      <div className="relative">
                        <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="password"
                          placeholder="••••••••"
                          value={inscriptionForm.confirmPassword}
                          onChange={(e) =>
                            setInscriptionForm((p) => ({ ...p, confirmPassword: e.target.value }))
                          }
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Code de parrainage <span className="text-gray-400">(optionnel)</span>
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="text"
                          placeholder="CODE123"
                          value={inscriptionForm.codeParrainage}
                          onChange={(e) =>
                            setInscriptionForm((p) => ({ ...p, codeParrainage: e.target.value }))
                          }
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                        />
                      </div>
                    </div>
                    <Button
                      type="submit"
                      className="w-full rounded-xl py-3 bg-orange-500 hover:bg-orange-600"
                      disabled={inscriptionLoading}
                    >
                      {inscriptionLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        "S'inscrire"
                      )}
                    </Button>
                  </form>
                )}
              </>
            )}

            {/* ——— Connexion ——— */}
            {mode === 'connexion' && (
              <>
                {connexionStep === 'phone' && (
                  <div className="space-y-4">
                    <h2 className="text-xl font-bold text-gray-900">Se connecter</h2>
                    <p className="text-sm text-gray-600">
                      Choisissez votre pays puis entrez votre numéro pour continuer.
                    </p>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Pays (indicatif)
                      </label>
                      <select
                        value={connexionCountry}
                        onChange={(e) => setConnexionCountry(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none bg-white"
                      >
                        {COUNTRY_OPTIONS.map((c) => (
                          <option key={c.code} value={c.indicatif}>
                            {c.label} {c.indicatif ? `(+${c.indicatif})` : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Numéro de téléphone
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="tel"
                          inputMode="numeric"
                          placeholder={connexionCountry === '229' ? '01 23 45 67 89' : '6 12 34 56 78'}
                          value={connexionPhone}
                          onChange={(e) => setConnexionPhone(e.target.value.replace(/\D/g, ' ').trim().replace(/\s+/g, ' '))}
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                        />
                      </div>
                    </div>
                    <Button
                      className="w-full rounded-xl py-3 bg-orange-500 hover:bg-orange-600"
                      onClick={handleConnexionContinue}
                      disabled={connexionLoading}
                    >
                      {connexionLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        'Continuer'
                      )}
                    </Button>
                  </div>
                )}

                {connexionStep === 'otp' && (
                  <div className="space-y-4">
                    <h2 className="text-xl font-bold text-gray-900">Code de vérification</h2>
                    <p className="text-sm text-gray-600">
                      Un code a été envoyé au {formatFullPhone(connexionCountry, connexionPhone)}. Entrez-le ci-dessous.
                    </p>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Code OTP
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        placeholder="123456"
                        value={connexionOtp}
                        onChange={(e) => setConnexionOtp(e.target.value.replace(/\D/g, ''))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none text-center text-lg tracking-widest"
                      />
                    </div>
                    <Button
                      className="w-full rounded-xl py-3 bg-orange-500 hover:bg-orange-600"
                      onClick={handleConnexionVerifyOtp}
                      disabled={connexionLoading || connexionOtp.length !== 6}
                    >
                      {connexionLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        'Valider le code'
                      )}
                    </Button>
                    {connexionOtpTimer > 0 ? (
                      <p className="text-center text-xs text-gray-400">Renvoyer dans {connexionOtpTimer}s</p>
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
                        className="w-full text-center text-sm text-orange-600 hover:underline disabled:opacity-50"
                      >
                        Renvoyer le code
                      </button>
                    )}
                  </div>
                )}

                {(connexionStep === 'password' || connexionStep === 'password-only') && (
                  <form onSubmit={handleConnexionSubmit} className="space-y-4">
                    <h2 className="text-xl font-bold text-gray-900">Mot de passe</h2>
                    <p className="text-sm text-gray-600">
                      {connexionRole === 'user_x'
                        ? 'Entrez votre mot de passe pour vous connecter.'
                        : 'Entrez votre mot de passe pour finaliser la connexion.'}
                    </p>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe</label>
                      <div className="relative">
                        <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="password"
                          placeholder="••••••••"
                          value={connexionPassword}
                          onChange={(e) => setConnexionPassword(e.target.value)}
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                        />
                      </div>
                    </div>
                    <Button
                      type="submit"
                      className="w-full rounded-xl py-3 bg-orange-500 hover:bg-orange-600"
                      disabled={connexionLoading}
                    >
                      {connexionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Se connecter'}
                    </Button>
                    <button
                      type="button"
                      onClick={() => setConnexionStep('forgot-send')}
                      className="w-full text-center text-sm text-orange-600 hover:text-orange-700 font-medium"
                    >
                      Mot de passe oublié ?
                    </button>
                  </form>
                )}

                {/* ——— Mot de passe oublié — envoi token ——— */}
                {connexionStep === 'forgot-send' && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-orange-600">
                      <ShieldCheck className="w-5 h-5" />
                      <h2 className="text-xl font-bold text-gray-900">Réinitialiser</h2>
                    </div>
                    <p className="text-sm text-gray-600">
                      Nous allons envoyer un code de réinitialisation (10 caractères) par SMS au{' '}
                      <strong>+{connexionCountry} {connexionPhone}</strong>.
                    </p>
                    <Button
                      className="w-full rounded-xl py-3 bg-orange-500 hover:bg-orange-600"
                      onClick={handleForgotSendToken}
                      disabled={forgotLoading}
                    >
                      {forgotLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Envoyer le code par SMS'}
                    </Button>
                  </div>
                )}

                {/* ——— Mot de passe oublié — reset ——— */}
                {connexionStep === 'forgot-reset' && (
                  <form onSubmit={handleForgotResetPassword} className="space-y-4">
                    <h2 className="text-xl font-bold text-gray-900">Nouveau mot de passe</h2>
                    <p className="text-sm text-gray-600">
                      Entrez le code à 10 caractères reçu par SMS et choisissez un nouveau mot de passe.
                    </p>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Code de réinitialisation</label>
                      <input
                        type="text"
                        placeholder="a3f9c12b4d"
                        value={forgotToken}
                        onChange={(e) => setForgotToken(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none font-mono tracking-widest"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nouveau mot de passe</label>
                      <div className="relative">
                        <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="password"
                          placeholder="••••••••"
                          value={forgotNewPassword}
                          onChange={(e) => setForgotNewPassword(e.target.value)}
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                        />
                      </div>
                      <p className="text-xs text-gray-400 mt-1">8 min, majuscule, minuscule, chiffre, caractère spécial</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Confirmer le mot de passe</label>
                      <div className="relative">
                        <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="password"
                          placeholder="••••••••"
                          value={forgotConfirmPassword}
                          onChange={(e) => setForgotConfirmPassword(e.target.value)}
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                        />
                      </div>
                    </div>
                    <Button
                      type="submit"
                      className="w-full rounded-xl py-3 bg-orange-500 hover:bg-orange-600"
                      disabled={forgotLoading}
                    >
                      {forgotLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Réinitialiser le mot de passe'}
                    </Button>
                    {forgotOtpTimer > 0 ? (
                      <p className="text-center text-xs text-gray-400">Renvoyer dans {forgotOtpTimer}s</p>
                    ) : (
                      <button
                        type="button"
                        onClick={handleForgotSendToken}
                        className="w-full text-center text-sm text-orange-600 hover:underline"
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

        <p className="text-center text-sm text-gray-500 mt-6">
          {mode === 'inscription'
            ? 'Vous avez déjà un compte ? '
            : 'Vous n\'avez pas de compte ? '}
          <button
            type="button"
            onClick={() =>
              setMode(mode === 'inscription' ? 'connexion' : 'inscription')
            }
            className="text-orange-600 font-semibold hover:underline"
          >
            {mode === 'inscription' ? 'Se connecter' : "S'inscrire"}
          </button>
        </p>
      </div>
    </div>
  );
};

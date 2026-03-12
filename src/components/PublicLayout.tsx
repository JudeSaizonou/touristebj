import React, { useState } from 'react';
import { Facebook, Instagram, Calendar, MapPin, Clock, Phone, Mail, Globe, ArrowRight, Menu, X, PiggyBank, LogOut, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const TikTokIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.34-6.34V8.74a8.18 8.18 0 004.76 1.52V6.8a4.83 4.83 0 01-1-.11z" />
  </svg>
);
import LogoTouristeBj from '../assets/LogoTouristeBj.png';
import LogoZepargn from '../assets/LogoZepargn.png';
import type { AuthMode } from '../pages/Auth';

interface PublicLayoutProps {
  children: React.ReactNode;
  onAdminLogin?: () => void;
  onOpenAuth?: (mode: AuthMode) => void;
  onMesVoyages?: () => void;
  onLogout?: () => void;
}

export const PublicLayout: React.FC<PublicLayoutProps> = ({ children, onAdminLogin, onOpenAuth, onMesVoyages, onLogout }) => {
  const { user, isAdmin, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterMsg, setNewsletterMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const handleLogout = () => {
    logout();
    onLogout?.();
    setMobileMenuOpen(false);
    setUserMenuOpen(false);
  };

  const scrollToSection = (sectionId: string) => {
    setMobileMenuOpen(false);
    setTimeout(() => {
      const el = document.getElementById(sectionId);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const navItems = [
    { label: 'ACCUEIL', action: () => { setMobileMenuOpen(false); window.location.hash = '#/'; window.scrollTo({ top: 0, behavior: 'smooth' }); } },
    { label: 'VOYAGES', action: () => scrollToSection('voyages-section') },
  ];

  return (
    <div className="min-h-screen bg-white">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:bg-white focus:px-4 focus:py-2 focus:rounded-lg focus:shadow-lg focus:text-primary-500 focus:font-semibold">
        Aller au contenu principal
      </a>

      {/* ═══════ Top Bar ═══════ */}
      <div className="bg-dark-800 text-white/80 py-2 px-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center text-xs">
          <div className="flex items-center gap-4 md:gap-6">
            <span className="hidden md:flex items-center gap-1.5">
              <Phone className="w-3 h-3 text-primary-400" />
              +229 97 00 00 00
            </span>
            <span className="hidden md:flex items-center gap-1.5">
              <Mail className="w-3 h-3 text-primary-400" />
              contact@letouriste.bj
            </span>
            <span className="flex md:hidden items-center gap-1.5">
              <MapPin className="w-3 h-3 text-primary-400" />
              Cotonou, Benin
            </span>
          </div>
          <div className="flex items-center gap-3">
            <a href="#" aria-label="Facebook" className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center hover:bg-primary-500 transition-colors">
              <Facebook className="w-3 h-3" />
            </a>
            <a href="https://www.tiktok.com/@letouriste.bj" target="_blank" rel="noopener noreferrer" aria-label="TikTok" className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center hover:bg-primary-500 transition-colors">
              <TikTokIcon className="w-3 h-3" />
            </a>
            <a href="https://www.instagram.com/letouriste.bj" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center hover:bg-primary-500 transition-colors">
              <Instagram className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>

      {/* ═══════ Header ═══════ */}
      <header className="bg-white/95 backdrop-blur-md border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <button onClick={() => { window.location.hash = '#/'; }} className="shrink-0">
              <img src={LogoTouristeBj} alt="Le Touriste.bj" className="h-10 md:h-11 object-contain" />
            </button>

            {/* Desktop Nav */}
            <nav className="hidden lg:flex items-center gap-8 text-sm">
              {navItems.map((item) => (
                <button
                  key={item.label}
                  onClick={item.action}
                  className="font-medium text-dark-800/70 hover:text-primary-500 transition-colors relative py-1"
                >
                  {item.label}
                </button>
              ))}
            </nav>

            {/* Right side */}
            <div className="flex items-center gap-2 md:gap-3 shrink-0">
              {user ? (
                <>
                  {!isAdmin && onMesVoyages && (
                    <button
                      onClick={onMesVoyages}
                      className="hidden sm:flex items-center gap-1.5 px-4 py-2 text-dark-800/70 hover:text-primary-500 font-medium transition-colors text-sm"
                    >
                      <PiggyBank className="w-4 h-4" />
                      Mes Voyages
                    </button>
                  )}
                  {isAdmin && (
                    <button
                      onClick={onAdminLogin}
                      className="hidden sm:block px-4 py-2 text-dark-800/70 hover:text-primary-500 font-medium transition-colors text-sm"
                    >
                      Administration
                    </button>
                  )}
                  {/* User avatar menu */}
                  <div className="relative hidden sm:block">
                    <button
                      onClick={() => setUserMenuOpen(!userMenuOpen)}
                      className="flex items-center gap-2 px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors"
                    >
                      <div className="w-7 h-7 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                        {(user.username || user.phoneNumber || 'U')[0].toUpperCase()}
                      </div>
                      <span className="max-w-[100px] truncate text-sm font-medium text-dark-800">{user.username || user.phoneNumber}</span>
                      <ChevronDown className={`w-3.5 h-3.5 text-dark-800/40 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {userMenuOpen && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} />
                        <div className="absolute right-0 top-full mt-2 bg-white border border-gray-100 rounded-xl shadow-xl z-20 min-w-[200px] py-2 overflow-hidden">
                          <div className="px-4 py-2.5 border-b border-gray-100">
                            <p className="text-xs text-dark-800/40">Connecte en tant que</p>
                            <p className="text-sm font-semibold text-dark-800 truncate">{user.username || user.phoneNumber}</p>
                          </div>
                          {!isAdmin && onMesVoyages && (
                            <button
                              onClick={() => { setUserMenuOpen(false); onMesVoyages(); }}
                              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-dark-800/70 hover:bg-gray-50 transition-colors"
                            >
                              <PiggyBank className="w-4 h-4 text-forest-700" />
                              Mes voyages
                            </button>
                          )}
                          <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                          >
                            <LogOut className="w-4 h-4" />
                            Se deconnecter
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </>
              ) : (
                <>
                  {onOpenAuth ? (
                    <>
                      <button
                        onClick={() => onOpenAuth('connexion')}
                        className="hidden sm:block px-4 py-2 text-dark-800/70 hover:text-primary-500 font-medium transition-colors text-sm"
                      >
                        Connexion
                      </button>
                      <button
                        onClick={() => onOpenAuth('inscription')}
                        className="hidden sm:block px-5 py-2.5 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-colors font-semibold text-sm"
                      >
                        S'inscrire
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={onAdminLogin}
                      className="hidden sm:block px-4 py-2 text-dark-800/70 hover:text-primary-500 font-medium transition-colors text-sm"
                    >
                      Connexion
                    </button>
                  )}
                </>
              )}

              {/* Hamburger */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 hover:bg-gray-100 rounded-xl transition-colors"
              >
                {mobileMenuOpen ? <X className="w-5 h-5 text-dark-800" /> : <Menu className="w-5 h-5 text-dark-800" />}
              </button>
            </div>
          </div>
        </div>

        {/* ═══════ Mobile Drawer ═══════ */}
        {mobileMenuOpen && (
          <>
            <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={() => setMobileMenuOpen(false)} />
            <div className="fixed top-0 right-0 h-full w-72 sm:w-80 bg-white z-50 shadow-2xl lg:hidden overflow-y-auto">
              <div className="flex items-center justify-between p-4 border-b border-gray-100">
                <img src={LogoTouristeBj} alt="Le Touriste.bj" className="h-9 object-contain" />
                <button onClick={() => setMobileMenuOpen(false)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                  <X className="w-5 h-5 text-dark-800/60" />
                </button>
              </div>

              <nav className="p-4 space-y-1">
                {navItems.map((item) => (
                  <button
                    key={item.label}
                    onClick={item.action}
                    className="w-full text-left px-4 py-3 rounded-xl font-medium text-sm text-dark-800/70 hover:bg-primary-50 hover:text-primary-600 transition-colors"
                  >
                    {item.label}
                  </button>
                ))}
              </nav>

              <div className="border-t border-gray-100 mx-4" />

              <div className="p-4 space-y-2">
                {user ? (
                  <>
                    <div className="px-4 py-3 bg-gradient-to-r from-primary-50 to-orange-50 rounded-xl">
                      <p className="text-[10px] text-dark-800/40 uppercase tracking-wider font-semibold">Connecte</p>
                      <p className="font-semibold text-dark-800 text-sm truncate">{user.username || user.phoneNumber}</p>
                    </div>
                    {!isAdmin && onMesVoyages && (
                      <button
                        onClick={() => { setMobileMenuOpen(false); onMesVoyages(); }}
                        className="w-full flex items-center gap-2 px-4 py-3 text-forest-700 hover:bg-forest-50 rounded-xl font-medium text-sm transition-colors text-left"
                      >
                        <PiggyBank className="w-4 h-4" /> Mes Voyages
                      </button>
                    )}
                    {isAdmin && (
                      <button
                        onClick={() => { setMobileMenuOpen(false); onAdminLogin?.(); }}
                        className="w-full px-4 py-3 text-dark-800/70 hover:bg-gray-50 rounded-xl font-medium text-sm transition-colors text-left"
                      >
                        Administration
                      </button>
                    )}
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl font-medium text-sm transition-colors text-left"
                    >
                      <LogOut className="w-4 h-4" /> Se deconnecter
                    </button>
                  </>
                ) : (
                  <>
                    {onOpenAuth ? (
                      <>
                        <button
                          onClick={() => { setMobileMenuOpen(false); onOpenAuth('connexion'); }}
                          className="w-full px-4 py-3 text-dark-800/70 hover:bg-gray-50 rounded-xl font-medium text-sm transition-colors text-center border border-gray-200"
                        >
                          Connexion
                        </button>
                        <button
                          onClick={() => { setMobileMenuOpen(false); onOpenAuth('inscription'); }}
                          className="w-full px-4 py-3 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-colors font-semibold text-sm text-center"
                        >
                          S'inscrire
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => { setMobileMenuOpen(false); onAdminLogin?.(); }}
                        className="w-full px-4 py-3 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-colors font-semibold text-sm text-center"
                      >
                        Connexion
                      </button>
                    )}
                  </>
                )}
              </div>

              <div className="p-4 border-t border-gray-100 mt-2">
                <p className="text-[10px] text-dark-800/30 uppercase tracking-wider font-semibold mb-3">Suivez-nous</p>
                <div className="flex items-center gap-3">
                  {[
                    { href: '#', label: 'Facebook', icon: <Facebook className="w-4 h-4" /> },
                    { href: 'https://www.tiktok.com/@letouriste.bj', label: 'TikTok', icon: <TikTokIcon className="w-4 h-4" /> },
                    { href: 'https://www.instagram.com/letouriste.bj', label: 'Instagram', icon: <Instagram className="w-4 h-4" /> },
                  ].map(({ href, label, icon }, i) => (
                    <a key={i} href={href} target={href !== '#' ? '_blank' : undefined} rel={href !== '#' ? 'noopener noreferrer' : undefined} aria-label={label}
                      className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center text-dark-800/40 hover:bg-primary-500 hover:text-white transition-all">
                      {icon}
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </header>

      {/* ═══════ Content ═══════ */}
      <main id="main-content">{children}</main>

      {/* ═══════ Footer ═══════ */}
      <footer className="bg-dark-800 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary-500 rounded-full blur-[150px] -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-forest-500 rounded-full blur-[150px] translate-y-1/2 -translate-x-1/2" />
        </div>

        {/* Newsletter */}
        <div id="newsletter-section" className="relative border-b border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
            <div className="bg-gradient-to-r from-primary-500/10 to-primary-500/5 border border-primary-500/20 rounded-2xl p-8 flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                <h3 className="text-xl font-bold text-white mb-1">Ne manquez aucun depart</h3>
                <p className="text-white/50 text-sm">Recevez nos offres et nouveaux voyages en avant-premiere.</p>
              </div>
              <div className="flex flex-col w-full md:w-auto max-w-md gap-2">
                <div className="flex w-full gap-2">
                  <input
                    type="email"
                    placeholder="Votre email"
                    value={newsletterEmail}
                    onChange={(e) => { setNewsletterEmail(e.target.value); setNewsletterMsg(null); }}
                    className="flex-1 min-w-0 px-4 py-3 bg-white/10 text-white placeholder-white/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 border border-white/10 text-sm"
                  />
                  <button
                    onClick={() => {
                      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                      if (emailRegex.test(newsletterEmail.trim())) {
                        setNewsletterMsg({ text: 'Merci ! Vous etes inscrit.', type: 'success' });
                        setNewsletterEmail('');
                      } else {
                        setNewsletterMsg({ text: 'Email invalide', type: 'error' });
                      }
                      setTimeout(() => setNewsletterMsg(null), 3000);
                    }}
                    className="px-5 py-3 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-colors font-semibold text-sm flex items-center gap-2 whitespace-nowrap"
                  >
                    S'abonner <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
                {newsletterMsg && (
                  <p className={`text-sm font-medium ${newsletterMsg.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                    {newsletterMsg.text}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer grid */}
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-14">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
            {/* Brand */}
            <div>
              <img src={LogoTouristeBj} alt="Le Touriste.bj" className="h-11 object-contain brightness-0 invert mb-5" />
              <p className="text-white/40 text-sm leading-relaxed mb-6">
                Votre partenaire voyage au Benin. Reservez en groupe, epargnez progressivement avec ZePargn.
              </p>
              <ul className="space-y-2.5 text-sm">
                <li className="flex items-center gap-2.5 text-white/50">
                  <MapPin className="w-3.5 h-3.5 text-primary-400 shrink-0" />
                  Cotonou, Benin
                </li>
                <li className="flex items-center gap-2.5 text-white/50">
                  <Phone className="w-3.5 h-3.5 text-primary-400 shrink-0" />
                  +229 97 00 00 00
                </li>
                <li className="flex items-center gap-2.5 text-white/50">
                  <Mail className="w-3.5 h-3.5 text-primary-400 shrink-0" />
                  contact@letouriste.bj
                </li>
                <li className="flex items-center gap-2.5 text-white/50">
                  <Clock className="w-3.5 h-3.5 text-primary-400 shrink-0" />
                  Lun - Ven : 08h30 - 17h00
                </li>
              </ul>
              <div className="flex items-center gap-2.5 mt-6">
                {[
                  { href: '#', label: 'Facebook', icon: <Facebook className="w-3.5 h-3.5" /> },
                  { href: 'https://www.tiktok.com/@letouriste.bj', label: 'TikTok', icon: <TikTokIcon className="w-3.5 h-3.5" /> },
                  { href: 'https://www.instagram.com/letouriste.bj', label: 'Instagram', icon: <Instagram className="w-3.5 h-3.5" /> },
                ].map(({ href, label, icon }, i) => (
                  <a key={i} href={href} target={href !== '#' ? '_blank' : undefined} rel={href !== '#' ? 'noopener noreferrer' : undefined} aria-label={label}
                    className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-white/40 hover:bg-primary-500 hover:text-white transition-all">
                    {icon}
                  </a>
                ))}
              </div>
            </div>

            {/* Navigation */}
            <div>
              <h4 className="text-white font-bold text-xs uppercase tracking-widest mb-5">Navigation</h4>
              <ul className="space-y-2.5">
                {[
                  { label: 'Accueil', action: () => { window.location.hash = '#/'; window.scrollTo({ top: 0 }); } },
                  { label: 'Nos voyages', action: () => scrollToSection('voyages-section') },
                  { label: 'Mes voyages', action: onMesVoyages },
                  ...(isAdmin ? [{ label: 'Administration', action: onAdminLogin }] : []),
                ].map(({ label, action }) => (
                  <li key={label}>
                    <button
                      onClick={action}
                      className="text-white/40 hover:text-primary-400 text-sm transition-colors flex items-center gap-2 group"
                    >
                      <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-primary-400" />
                      {label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Partners + Payment */}
            <div>
              <h4 className="text-white font-bold text-xs uppercase tracking-widest mb-5">Nos partenaires</h4>
              <div className="space-y-3 mb-8">
                <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 flex items-center gap-3 hover:bg-white/10 transition-colors">
                  <img src={LogoZepargn} alt="ZePargn" className="h-7 object-contain brightness-0 invert" />
                  <p className="text-white/40 text-xs">Epargne & paiement echelonne</p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 hover:bg-white/10 transition-colors">
                  <p className="text-amber-400 font-bold text-sm">Miwakpon</p>
                  <p className="text-white/40 text-xs">Tourisme & decouverte</p>
                </div>
              </div>

              <h4 className="text-white font-bold text-xs uppercase tracking-widest mb-3">Paiement securise</h4>
              <div className="flex items-center gap-2.5">
                <div className="bg-yellow-400 text-yellow-900 rounded-lg px-3 py-1.5 text-xs font-bold">MTN MoMo</div>
                <div className="bg-green-500 text-white rounded-lg px-3 py-1.5 text-xs font-bold">FedaPay</div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="relative border-t border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-white/30">
            <p>&copy; {new Date().getFullYear()} Le Touriste.bj - Tous droits reserves.</p>
            <div className="flex items-center gap-5">
              <a href="#" className="hover:text-white/60 transition-colors">Politique de confidentialite</a>
              <a href="#" className="hover:text-white/60 transition-colors">Conditions d'utilisation</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

import React, { useState } from 'react';
import { Facebook, Instagram, Linkedin, Calendar, MapPin, Clock, CreditCard, Smartphone, Menu, X, PiggyBank, LogOut, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const TikTokIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.34-6.34V8.74a8.18 8.18 0 004.76 1.52V6.8a4.83 4.83 0 01-1-.11z" />
  </svg>
);
import LogoTouristeBj from '../assets/LogoTouristeBj.png';
import type { AuthMode } from '../pages/Auth';

interface PublicLayoutProps {
  children: React.ReactNode;
  onAdminLogin?: () => void;
  onOpenAuth?: (mode: AuthMode) => void;
  onMesVoyages?: () => void;
  onLogout?: () => void;
}

const getFormattedDate = (): string => {
  const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
  const months = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
  const now = new Date();
  return `${days[now.getDay()]}, ${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;
};

export const PublicLayout: React.FC<PublicLayoutProps> = ({ children, onAdminLogin, onOpenAuth, onMesVoyages, onLogout }) => {
  const { user, isAdmin, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

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
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  const navItems = [
    { label: 'ACCUEIL', action: () => { setMobileMenuOpen(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }, active: false },
    { label: 'À PROPOS', action: () => scrollToSection('about-section'), active: false },
    { label: 'DESTINATIONS', action: () => scrollToSection('destinations-section'), active: false },
    { label: 'VOYAGES', action: () => scrollToSection('voyages-section'), active: true },
    { label: 'PAGES', action: () => scrollToSection('partners-section'), active: false },
    { label: 'BLOG', action: () => scrollToSection('newsletter-section'), active: false },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Top Bar - Dark green */}
      <div className="bg-[#1a4d3e] text-white py-2 px-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center text-sm">
          <div className="flex items-center gap-2 md:gap-6">
            <span className="hidden md:flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              {getFormattedDate()}
            </span>
            <span className="hidden md:flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Cotonou, Bénin
            </span>
            <span className="hidden lg:flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Lun - Vend : 08h 30 - 17h
            </span>
            {/* Mobile: show a compact info */}
            <span className="flex md:hidden items-center gap-1.5 text-xs">
              <MapPin className="w-3.5 h-3.5" />
              Cotonou, Bénin
            </span>
          </div>
          <div className="flex items-center gap-3 md:gap-4">
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="hover:text-gray-200 transition-colors">
              <Facebook className="w-4 h-4" />
            </a>
            <a href="https://www.tiktok.com/@letouriste.bj" target="_blank" rel="noopener noreferrer" className="hover:text-gray-200 transition-colors">
              <TikTokIcon className="w-4 h-4" />
            </a>
            <a href="https://www.instagram.com/letouriste.bj" target="_blank" rel="noopener noreferrer" className="hover:text-gray-200 transition-colors">
              <Instagram className="w-4 h-4" />
            </a>
            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="hover:text-gray-200 transition-colors hidden sm:block">
              <Linkedin className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="shrink-0">
              <img src={LogoTouristeBj} alt="Le Touriste.bj" className="h-10 md:h-12 object-contain" />
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-5 xl:gap-6 text-sm mx-auto whitespace-nowrap">
              {navItems.map((item) => (
                <button
                  key={item.label}
                  onClick={item.action}
                  className={`font-medium transition-colors flex items-center gap-1 ${
                    item.active
                      ? 'text-primary-600 font-semibold border-b-2 border-primary-600 pb-1'
                      : 'text-gray-700 hover:text-primary-600'
                  }`}
                >
                  {item.label}
                  <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </button>
              ))}
              {/* Search icon */}
              <button
                onClick={() => {
                  const searchInput = document.querySelector('input[placeholder*="Rechercher"]') as HTMLInputElement;
                  if (searchInput) {
                    searchInput.scrollIntoView({ behavior: 'smooth' });
                    setTimeout(() => searchInput.focus(), 500);
                  }
                }}
                className="text-gray-700 hover:text-primary-600 transition-colors shrink-0"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </button>
            </nav>

            {/* Right: CTA + user + Hamburger */}
            <div className="flex items-center gap-2 md:gap-3 shrink-0">
              {user ? (
                /* Utilisateur connecté */
                <>
                  {!isAdmin && onMesVoyages && (
                    <button
                      onClick={onMesVoyages}
                      className="hidden sm:flex items-center gap-1.5 px-3 md:px-4 py-2 text-gray-700 hover:text-primary-600 font-medium transition-colors text-sm whitespace-nowrap"
                    >
                      <PiggyBank className="w-4 h-4" />
                      MES VOYAGES
                    </button>
                  )}
                  {isAdmin && (
                    <button
                      onClick={onAdminLogin}
                      className="hidden sm:block px-3 md:px-4 py-2 text-gray-700 hover:text-primary-600 font-medium transition-colors text-sm whitespace-nowrap"
                    >
                      ADMINISTRATION
                    </button>
                  )}
                  <div className="relative hidden sm:block">
                    <button
                      onClick={() => setUserMenuOpen(!userMenuOpen)}
                      className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-sm font-medium text-gray-700"
                    >
                      <div className="w-6 h-6 bg-[#1a4d3e] rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {(user.username || user.phoneNumber || 'U')[0].toUpperCase()}
                      </div>
                      <span className="max-w-[100px] truncate">{user.username || user.phoneNumber}</span>
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                    {userMenuOpen && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} />
                        <div className="absolute right-0 top-full mt-1.5 bg-white border border-gray-100 rounded-xl shadow-lg z-20 min-w-[180px] py-1.5 overflow-hidden">
                          {!isAdmin && onMesVoyages && (
                            <button
                              onClick={() => { setUserMenuOpen(false); onMesVoyages(); }}
                              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                              <PiggyBank className="w-4 h-4 text-[#1a4d3e]" />
                              Mes voyages
                            </button>
                          )}
                          <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                          >
                            <LogOut className="w-4 h-4" />
                            Se déconnecter
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </>
              ) : (
                /* Non connecté */
                <>
                  {onOpenAuth ? (
                    <>
                      <button
                        onClick={() => onOpenAuth('inscription')}
                        className="hidden sm:block px-3 md:px-4 py-2 text-gray-700 hover:text-primary-600 font-medium transition-colors text-sm whitespace-nowrap"
                      >
                        S'INSCRIRE
                      </button>
                      <button
                        onClick={() => onOpenAuth('connexion')}
                        className="hidden sm:block px-3 md:px-4 py-2 text-gray-700 hover:text-primary-600 font-medium transition-colors text-sm whitespace-nowrap"
                      >
                        SE CONNECTER
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={onAdminLogin}
                      className="hidden sm:block px-3 md:px-4 py-2 text-gray-700 hover:text-primary-600 font-medium transition-colors text-sm whitespace-nowrap"
                    >
                      SE CONNECTER
                    </button>
                  )}
                </>
              )}
              <button
                onClick={() => {
                  const voyagesSection = document.getElementById('voyages-section');
                  if (voyagesSection) {
                    voyagesSection.scrollIntoView({ behavior: 'smooth' });
                  } else {
                    window.scrollTo({ top: 400, behavior: 'smooth' });
                  }
                }}
                className="hidden md:block px-5 py-2.5 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors font-semibold text-sm whitespace-nowrap"
              >
                RÉSERVER
              </button>

              {/* Hamburger button - visible below lg */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                {mobileMenuOpen ? (
                  <X className="w-6 h-6 text-gray-700" />
                ) : (
                  <Menu className="w-6 h-6 text-gray-700" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu Drawer */}
        {mobileMenuOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black/40 z-40 lg:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />
            {/* Drawer */}
            <div className="fixed top-0 right-0 h-full w-72 sm:w-80 bg-white z-50 shadow-2xl lg:hidden transform transition-transform duration-300 ease-in-out overflow-y-auto">
              {/* Drawer Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-100">
                <img src={LogoTouristeBj} alt="Le Touriste.bj" className="h-10 object-contain" />
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>

              {/* Nav Links */}
              <nav className="p-4 space-y-1">
                {navItems.map((item) => (
                  <button
                    key={item.label}
                    onClick={item.action}
                    className={`w-full text-left px-4 py-3 rounded-lg font-medium text-sm transition-colors ${
                      item.active
                        ? 'bg-primary-50 text-primary-600 font-semibold'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-primary-600'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </nav>

              {/* Divider */}
              <div className="border-t border-gray-100 mx-4" />

              {/* Actions */}
              <div className="p-4 space-y-3">
                {user ? (
                  <>
                    <div className="px-4 py-3 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-500">Connecté en tant que</p>
                      <p className="font-medium text-[#17233E] text-sm truncate">{user.username || user.phoneNumber}</p>
                    </div>
                    {!isAdmin && onMesVoyages && (
                      <button
                        onClick={() => { setMobileMenuOpen(false); onMesVoyages(); }}
                        className="w-full flex items-center gap-2 px-4 py-3 text-[#1a4d3e] hover:bg-[#1a4d3e]/5 rounded-lg font-medium text-sm transition-colors text-left"
                      >
                        <PiggyBank className="w-4 h-4" /> MES VOYAGES
                      </button>
                    )}
                    {isAdmin && (
                      <button
                        onClick={() => { setMobileMenuOpen(false); onAdminLogin?.(); }}
                        className="w-full px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg font-medium text-sm transition-colors text-left"
                      >
                        ADMINISTRATION
                      </button>
                    )}
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg font-medium text-sm transition-colors text-left"
                    >
                      <LogOut className="w-4 h-4" /> Se déconnecter
                    </button>
                  </>
                ) : (
                  <>
                    {onOpenAuth ? (
                      <>
                        <button
                          onClick={() => { setMobileMenuOpen(false); onOpenAuth('inscription'); }}
                          className="w-full px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg font-medium text-sm transition-colors text-left"
                        >
                          S'INSCRIRE
                        </button>
                        <button
                          onClick={() => { setMobileMenuOpen(false); onOpenAuth('connexion'); }}
                          className="w-full px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg font-medium text-sm transition-colors text-left"
                        >
                          SE CONNECTER
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => { setMobileMenuOpen(false); onAdminLogin?.(); }}
                        className="w-full px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg font-medium text-sm transition-colors text-left"
                      >
                        SE CONNECTER
                      </button>
                    )}
                  </>
                )}
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    const voyagesSection = document.getElementById('voyages-section');
                    if (voyagesSection) voyagesSection.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="w-full px-4 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors font-semibold text-sm text-center"
                >
                  RÉSERVER MAINTENANT
                </button>
              </div>

              {/* Social */}
              <div className="p-4 border-t border-gray-100 mt-2">
                <p className="text-xs text-gray-400 mb-3 font-medium">Suivez-nous</p>
                <div className="flex items-center gap-4">
                  <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-primary-600 transition-colors">
                    <Facebook className="w-5 h-5" />
                  </a>
                  <a href="https://www.tiktok.com/@letouriste.bj" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-primary-600 transition-colors">
                    <TikTokIcon className="w-5 h-5" />
                  </a>
                  <a href="https://www.instagram.com/letouriste.bj" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-primary-600 transition-colors">
                    <Instagram className="w-5 h-5" />
                  </a>
                  <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-primary-600 transition-colors">
                    <Linkedin className="w-5 h-5" />
                  </a>
                </div>
              </div>
            </div>
          </>
        )}
      </header>

      {/* Main Content */}
      <main id="voyages-section">{children}</main>

      {/* Instagram Gallery Section */}
      <div id="about-section" className="bg-[#0a1f3d] pt-12 pb-0">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-center gap-3 md:gap-6 flex-wrap">
            {[
              'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=200&h=200&fit=crop',
              'https://images.unsplash.com/photo-1613395877344-13d4a8e0d49e?w=200&h=200&fit=crop',
              'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=200&h=200&fit=crop',
            ].map((img, i) => (
              <div key={i} className="w-20 h-20 md:w-28 md:h-28 rounded-xl overflow-hidden opacity-80 hover:opacity-100 transition-opacity">
                <img src={img} alt="" className="w-full h-full object-cover" />
              </div>
            ))}
            <a
              href="https://www.instagram.com/letouriste.bj"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 md:px-5 md:py-2.5 border border-white text-white rounded-full text-xs md:text-sm font-medium hover:bg-white/10 transition-colors flex items-center gap-2"
            >
              <Instagram className="w-4 h-4" />
              Follow On Instagram
            </a>
            {[
              'https://images.unsplash.com/photo-1528181304800-259b08848526?w=200&h=200&fit=crop',
              'https://images.unsplash.com/photo-1503152394-c571994fd383?w=200&h=200&fit=crop',
              'https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?w=200&h=200&fit=crop',
            ].map((img, i) => (
              <div key={i + 3} className="w-20 h-20 md:w-28 md:h-28 rounded-xl overflow-hidden opacity-80 hover:opacity-100 transition-opacity">
                <img src={img} alt="" className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-[#0a1f3d] text-white pt-12 pb-8 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 relative">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            {/* Company Info */}
            <div className="sm:col-span-2 md:col-span-1">
              <div className="mb-4">
                <img src={LogoTouristeBj} alt="Le Touriste.bj" className="h-12 object-contain brightness-0 invert" />
              </div>
              <p className="text-gray-400 text-sm mb-4 leading-relaxed">
                Votre partenaire voyage de confiance au Bénin. Découvrez les meilleures destinations en groupe avec des conditions de paiement flexibles.
              </p>
              <div className="space-y-2 text-sm">
                <p className="text-gray-400">
                  <span className="font-semibold text-white">Tél:</span> +229 97 00 00 00
                </p>
                <p className="text-gray-400">
                  <span className="font-semibold text-white">Adresse:</span> Cotonou, Bénin
                </p>
                <p className="text-gray-400">
                  <span className="font-semibold text-white">Email:</span> contact@letouriste.bj
                </p>
                <p className="text-gray-400">
                  <span className="font-semibold text-white">Site:</span> www.letouriste.bj
                </p>
              </div>
              <div className="mt-4">
                <p className="text-sm text-gray-400 mb-2">Moyens de paiement:</p>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-5 bg-blue-700 rounded flex items-center justify-center">
                    <CreditCard className="w-4 h-3 text-white" />
                  </div>
                  <div className="w-8 h-5 bg-red-600 rounded flex items-center justify-center">
                    <CreditCard className="w-4 h-3 text-white" />
                  </div>
                  <div className="w-8 h-5 bg-yellow-500 rounded flex items-center justify-center">
                    <CreditCard className="w-4 h-3 text-white" />
                  </div>
                  <div className="w-8 h-5 bg-green-600 rounded flex items-center justify-center">
                    <Smartphone className="w-4 h-3 text-white" />
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="font-bold text-lg mb-4">Liens Rapides</h3>
              <ul className="space-y-2 text-sm">
                <li><button onClick={() => scrollToSection('about-section')} className="text-gray-400 hover:text-white transition-colors">À Propos</button></li>
                <li><button onClick={() => scrollToSection('destinations-section')} className="text-gray-400 hover:text-white transition-colors">Destinations</button></li>
                <li><button onClick={() => scrollToSection('voyages-section')} className="text-gray-400 hover:text-white transition-colors">Nos Voyages</button></li>
                <li><button onClick={() => scrollToSection('partners-section')} className="text-gray-400 hover:text-white transition-colors">Partenaires</button></li>
                <li><button onClick={() => scrollToSection('newsletter-section')} className="text-gray-400 hover:text-white transition-colors">Newsletter</button></li>
                <li><button onClick={onAdminLogin} className="text-gray-400 hover:text-white transition-colors">Administration</button></li>
              </ul>
            </div>

            {/* Categories */}
            <div id="destinations-section">
              <h3 className="font-bold text-lg mb-4">Destinations</h3>
              <ul className="space-y-2 text-sm">
                <li><span className="text-gray-400">Dubaï, EAU</span></li>
                <li><span className="text-gray-400">Istanbul, Turquie</span></li>
                <li><span className="text-gray-400">Marrakech, Maroc</span></li>
                <li><span className="text-gray-400">Zanzibar, Tanzanie</span></li>
                <li><span className="text-gray-400">Le Caire, Égypte</span></li>
                <li><span className="text-gray-400">Bali, Indonésie</span></li>
              </ul>
            </div>

            {/* Newsletter */}
            <div id="newsletter-section">
              <h3 className="font-bold text-lg mb-4">Newsletter</h3>
              <p className="text-gray-400 text-sm mb-4">
                Rejoignez notre communauté de voyageurs et recevez nos meilleures offres et promotions directement dans votre boîte mail.
              </p>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="email"
                  placeholder="Adresse email"
                  className="flex-1 px-4 py-2.5 bg-white/10 text-white placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 border border-gray-600"
                />
                <button className="px-5 py-2.5 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors font-medium text-sm whitespace-nowrap">
                  S'abonner
                </button>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div id="partners-section" className="border-t border-gray-700 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-400 text-sm">
              © {new Date().getFullYear()} Le Touriste.bj - Tous droits réservés.
            </p>
            <div className="flex items-center gap-3 md:gap-4">
              <select className="bg-transparent text-gray-400 text-sm border border-gray-600 rounded px-3 py-1.5 focus:outline-none">
                <option>Français</option>
                <option>English</option>
              </select>
              <select className="bg-transparent text-gray-400 text-sm border border-gray-600 rounded px-3 py-1.5 focus:outline-none">
                <option>FCFA</option>
                <option>USD</option>
                <option>EUR</option>
              </select>
            </div>
            <div className="flex items-center gap-4">
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="https://www.tiktok.com/@letouriste.bj" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
                <TikTokIcon className="w-5 h-5" />
              </a>
              <a href="https://www.instagram.com/letouriste.bj" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
                <Linkedin className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

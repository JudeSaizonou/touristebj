import { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { RequestRefundModal } from './components/RequestRefundModal';
import { ToastContainer, useToast } from './components/Toast';
import { Dashboard } from './pages/Dashboard';
import { Voyages } from './pages/Voyages';
import { CreateVoyage } from './pages/CreateVoyage';
import { EditVoyage } from './pages/EditVoyage';
import { Catalog } from './pages/Catalog';
import { VoyageDetails } from './pages/VoyageDetails';
import { ReservationsList } from './pages/ReservationsList';
import { AllVoyageursList } from './pages/AllVoyageursList';
import { Parametres } from './pages/Parametres';
import { Auth, AuthMode } from './pages/Auth';
import { MesVoyages } from './pages/MesVoyages';
import { MonEpargne } from './pages/MonEpargne';
import { useAuth } from './context/AuthContext';
import { StorageService } from './utils/storage';
import { PageView } from './types';

type AppView = PageView | 'catalog' | 'voyage-details' | 'auth' | 'mes-voyages' | 'mon-epargne';

function App() {
  const { user, isAdmin, logout: authLogout } = useAuth();
  const [currentView, setCurrentView] = useState<AppView>('catalog');
  const [editingVoyageId, setEditingVoyageId] = useState<string>('1');
  const [viewingVoyageId, setViewingVoyageId] = useState<string>('1');
  const [viewingBookingId, setViewingBookingId] = useState<string>('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>('connexion');
  const [, setAuthRedirect] = useState<'catalog' | 'dashboard'>('catalog');
  const { toasts, addToast, removeToast } = useToast();

  useEffect(() => {
    StorageService.initialize();
  }, []);

  // Rediriger vers le catalogue si plus de token alors qu'on est en vue admin
  useEffect(() => {
    const adminViews: AppView[] = ['dashboard', 'voyages', 'create-voyage', 'edit-voyage', 'reservations', 'all-voyageurs', 'parametres'];
    if (!user && adminViews.includes(currentView)) {
      setCurrentView('catalog');
    }
  }, [user, currentView]);

  const handleAdminLogin = () => {
    if (isAdmin) {
      setCurrentView('dashboard');
    } else {
      setAuthRedirect('dashboard');
      setAuthMode('connexion');
      setCurrentView('auth');
    }
  };

  const handleLogout = () => {
    authLogout();
    setCurrentView('catalog');
    setSidebarOpen(false);
  };

  const handleAuthSuccess = (_isAdminUser: boolean) => {
    // setAuth écrit en localStorage de façon synchrone → source de vérité fiable
    // même si la réponse API n'incluait pas le champ role
    try {
      const raw = localStorage.getItem('touriste_user');
      const savedUser = raw ? JSON.parse(raw) : null;
      const adminFromStorage = savedUser?.role === 'ADMIN' || savedUser?.role === 'PARTNER';
      setCurrentView(adminFromStorage ? 'dashboard' : 'catalog');
    } catch {
      setCurrentView(_isAdminUser ? 'dashboard' : 'catalog');
    }
    setAuthRedirect('catalog');
  };

  const handleEditVoyage = (voyageId: string) => {
    setEditingVoyageId(voyageId);
    setCurrentView('edit-voyage');
  };

  const handleViewDetails = (voyageId: string) => {
    setViewingVoyageId(voyageId);
    setCurrentView('voyage-details');
  };

  const handleNavigate = (page: PageView) => {
    setCurrentView(page);
    setSidebarOpen(false);
  };

  const handleNavigateMesVoyages = () => {
    setCurrentView('mes-voyages');
  };

  const handleViewBooking = (bookingId: string) => {
    setViewingBookingId(bookingId);
    setCurrentView('mon-epargne');
  };

  const handleRequestRefund = (method: 'mobile-money' | 'bancaire', montant: string) => {
    setShowRefundModal(false);
    const methodLabel = method === 'mobile-money' ? 'Mobile Money' : 'Virement Bancaire';
    addToast('success', `Demande de reversement de ${montant} FCFA par ${methodLabel} enregistrée`);
  };

  // Auth (full page)
  if (currentView === 'auth') {
    return (
      <Auth
        initialMode={authMode}
        onBack={() => setCurrentView('catalog')}
        onSuccess={handleAuthSuccess}
      />
    );
  }

  // Public views
  if (currentView === 'catalog') {
    return (
      <Catalog
        onViewDetails={handleViewDetails}
        onAdminLogin={handleAdminLogin}
        onOpenAuth={(mode) => {
          setAuthRedirect('catalog');
          setAuthMode(mode);
          setCurrentView('auth');
        }}
        onMesVoyages={handleNavigateMesVoyages}
        onLogout={handleLogout}
      />
    );
  }

  if (currentView === 'voyage-details') {
    return (
      <VoyageDetails
        voyageId={viewingVoyageId}
        onBack={() => setCurrentView('catalog')}
        onAdminLogin={handleAdminLogin}
        onOpenAuth={(mode) => {
          setAuthRedirect('catalog');
          setAuthMode(mode);
          setCurrentView('auth');
        }}
        onMesVoyages={handleNavigateMesVoyages}
        onLogout={handleLogout}
      />
    );
  }

  if (currentView === 'mes-voyages') {
    return (
      <MesVoyages
        onBack={() => setCurrentView('catalog')}
        onViewBooking={handleViewBooking}
        onAdminLogin={handleAdminLogin}
        onOpenAuth={(mode) => {
          setAuthRedirect('catalog');
          setAuthMode(mode);
          setCurrentView('auth');
        }}
        onMesVoyages={handleNavigateMesVoyages}
        onLogout={handleLogout}
      />
    );
  }

  if (currentView === 'mon-epargne') {
    return (
      <MonEpargne
        bookingId={viewingBookingId}
        onBack={() => setCurrentView('mes-voyages')}
        onAdminLogin={handleAdminLogin}
        onOpenAuth={(mode) => {
          setAuthRedirect('catalog');
          setAuthMode(mode);
          setCurrentView('auth');
        }}
        onMesVoyages={handleNavigateMesVoyages}
        onLogout={handleLogout}
      />
    );
  }

  // Admin views
  const sidebarPage = (currentView === 'create-voyage' || currentView === 'edit-voyage')
    ? 'voyages'
    : (currentView as 'dashboard' | 'voyages' | 'reservations' | 'all-voyageurs' | 'parametres');

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <ToastContainer toasts={toasts} onClose={removeToast} />

      <RequestRefundModal
        isOpen={showRefundModal}
        onClose={() => setShowRefundModal(false)}
        onSubmit={handleRequestRefund}
      />

      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <div className={`
        fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <Sidebar
          currentPage={sidebarPage}
          onNavigate={handleNavigate}
          onLogout={handleLogout}
          onRequestRefund={() => setShowRefundModal(true)}
        />
      </div>

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <Header
          userName={user?.username || user?.phoneNumber?.replace(/^\+\d+/, '') || 'Admin'}
          userRole={user?.role === 'ADMIN' ? 'Admin' : user?.role === 'PARTNER' ? 'Partenaire' : user?.role || 'Admin'}
          greeting="Hello"
          subGreeting="Faisons le point,"
          onNavigateToVoyage={handleEditVoyage}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        />
        <main className="flex-1 overflow-y-auto">
          {currentView === 'dashboard' && <Dashboard />}
          {currentView === 'voyages' && (
            <Voyages
              onCreateVoyage={() => setCurrentView('create-voyage')}
              onEditVoyage={handleEditVoyage}
            />
          )}
          {currentView === 'create-voyage' && (
            <CreateVoyage
              onBack={() => setCurrentView('voyages')}
              onCreate={() => setCurrentView('voyages')}
            />
          )}
          {currentView === 'edit-voyage' && (
            <EditVoyage
              voyageId={editingVoyageId}
              onBack={() => setCurrentView('voyages')}
              onUpdate={() => {}}
            />
          )}
          {currentView === 'reservations' && <ReservationsList />}
          {currentView === 'all-voyageurs' && <AllVoyageursList />}
          {currentView === 'parametres' && <Parametres />}
        </main>
      </div>
    </div>
  );
}

export default App;

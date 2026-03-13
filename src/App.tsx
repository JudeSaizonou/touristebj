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
import { useHashRouter } from './hooks/useHashRouter';
import { StorageService } from './utils/storage';
import { PageView } from './types';

function App() {
  const { user, isAdmin, logout: authLogout } = useAuth();
  const { route, navigate } = useHashRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>('connexion');
  const { toasts, addToast, removeToast } = useToast();

  useEffect(() => {
    StorageService.initialize();
  }, []);

  // Redirect to catalog if not authenticated and trying to access admin routes
  useEffect(() => {
    if (!user && route.path.startsWith('/admin')) {
      navigate('/');
    }
  }, [user, route.path, navigate]);

  const handleAdminLogin = () => {
    if (isAdmin) {
      navigate('/admin/dashboard');
    } else {
      setAuthMode('connexion');
      navigate('/auth');
    }
  };

  const handleLogout = () => {
    authLogout();
    navigate('/');
    setSidebarOpen(false);
  };

  const handleAuthSuccess = (_isAdminUser: boolean) => {
    try {
      const raw = localStorage.getItem('touriste_user');
      const savedUser = raw ? JSON.parse(raw) : null;
      const adminFromStorage = savedUser?.role === 'ADMIN' || savedUser?.role === 'PARTNER';
      navigate(adminFromStorage ? '/admin/dashboard' : '/');
    } catch {
      navigate(_isAdminUser ? '/admin/dashboard' : '/');
    }
  };

  const handleOpenAuth = (mode: AuthMode) => {
    setAuthMode(mode);
    navigate('/auth');
  };

  const handleNavigate = (page: PageView) => {
    const pageToRoute: Record<PageView, string> = {
      dashboard: '/admin/dashboard',
      voyages: '/admin/voyages',
      'create-voyage': '/admin/voyages/new',
      'edit-voyage': '/admin/voyages',
      reservations: '/admin/reservations',
      'all-voyageurs': '/admin/voyageurs',
      parametres: '/admin/parametres',
    };
    navigate(pageToRoute[page] || '/admin/dashboard');
    setSidebarOpen(false);
  };

  const handleRefundSuccess = () => {
    addToast('success', 'Demande de reversement enregistrée');
  };

  // --- Public routes ---

  if (route.path === '/auth') {
    return (
      <Auth
        initialMode={authMode}
        onBack={() => navigate('/')}
        onSuccess={handleAuthSuccess}
      />
    );
  }

  if (route.path === '/') {
    return (
      <Catalog
        onViewDetails={(id) => navigate(`/voyage/${id}`)}
        onAdminLogin={handleAdminLogin}
        onOpenAuth={handleOpenAuth}
        onMesVoyages={() => navigate('/mes-voyages')}
        onLogout={handleLogout}
      />
    );
  }

  if (route.path === '/voyage/:id') {
    return (
      <VoyageDetails
        voyageId={route.params.id}
        onBack={() => navigate('/')}
        onAdminLogin={handleAdminLogin}
        onOpenAuth={handleOpenAuth}
        onMesVoyages={() => navigate('/mes-voyages')}
        onLogout={handleLogout}
      />
    );
  }

  if (route.path === '/mes-voyages') {
    return (
      <MesVoyages
        onBack={() => navigate('/')}
        onViewBooking={(bookingId) => navigate(`/epargne/${bookingId}`)}
        onAdminLogin={handleAdminLogin}
        onOpenAuth={handleOpenAuth}
        onMesVoyages={() => navigate('/mes-voyages')}
        onLogout={handleLogout}
      />
    );
  }

  if (route.path === '/epargne/:bookingId') {
    return (
      <MonEpargne
        bookingId={route.params.bookingId}
        onBack={() => navigate('/mes-voyages')}
        onAdminLogin={handleAdminLogin}
        onOpenAuth={handleOpenAuth}
        onMesVoyages={() => navigate('/mes-voyages')}
        onLogout={handleLogout}
      />
    );
  }

  // --- Admin routes ---

  const adminRouteToPage: Record<string, string> = {
    '/admin/dashboard': 'dashboard',
    '/admin/voyages': 'voyages',
    '/admin/voyages/new': 'create-voyage',
    '/admin/voyages/:id/edit': 'edit-voyage',
    '/admin/reservations': 'reservations',
    '/admin/voyageurs': 'all-voyageurs',
    '/admin/parametres': 'parametres',
  };

  const currentAdminPage = adminRouteToPage[route.path] || 'dashboard';
  const sidebarPage = (currentAdminPage === 'create-voyage' || currentAdminPage === 'edit-voyage')
    ? 'voyages'
    : (currentAdminPage as 'dashboard' | 'voyages' | 'reservations' | 'all-voyageurs' | 'parametres');

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <ToastContainer toasts={toasts} onClose={removeToast} />

      <RequestRefundModal
        isOpen={showRefundModal}
        onClose={() => setShowRefundModal(false)}
        onSuccess={handleRefundSuccess}
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
          onNavigateToVoyage={(id) => navigate(`/admin/voyages/${id}/edit`)}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        />
        <main className="flex-1 overflow-y-auto">
          {currentAdminPage === 'dashboard' && <Dashboard />}
          {currentAdminPage === 'voyages' && (
            <Voyages
              onCreateVoyage={() => navigate('/admin/voyages/new')}
              onEditVoyage={(id) => navigate(`/admin/voyages/${id}/edit`)}
            />
          )}
          {currentAdminPage === 'create-voyage' && (
            <CreateVoyage
              onBack={() => navigate('/admin/voyages')}
              onCreate={() => navigate('/admin/voyages')}
            />
          )}
          {currentAdminPage === 'edit-voyage' && (
            <EditVoyage
              voyageId={route.params.id}
              onBack={() => navigate('/admin/voyages')}
              onUpdate={() => {}}
            />
          )}
          {currentAdminPage === 'reservations' && <ReservationsList />}
          {currentAdminPage === 'all-voyageurs' && <AllVoyageursList />}
          {currentAdminPage === 'parametres' && <Parametres />}
        </main>
      </div>
    </div>
  );
}

export default App;

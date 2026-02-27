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
import { StorageService } from './utils/storage';
import { PageView } from './types';

type AppView = PageView | 'catalog' | 'voyage-details';

function App() {
  const [currentView, setCurrentView] = useState<AppView>('catalog');
  const [editingVoyageId, setEditingVoyageId] = useState<string>('1');
  const [viewingVoyageId, setViewingVoyageId] = useState<string>('1');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const { toasts, addToast, removeToast } = useToast();

  useEffect(() => {
    StorageService.initialize();
  }, []);

  const handleAdminLogin = () => {
    setCurrentView('dashboard');
  };

  const handleLogout = () => {
    setCurrentView('catalog');
    setSidebarOpen(false);
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

  const handleRequestRefund = (method: 'mobile-money' | 'bancaire') => {
    setShowRefundModal(false);
    const methodLabel = method === 'mobile-money' ? 'Mobile Money' : 'Virement Bancaire';
    addToast('success', `Demande de reversement par ${methodLabel} enregistrée`);
  };

  // Public views
  if (currentView === 'catalog') {
    return (
      <Catalog
        onViewDetails={handleViewDetails}
        onAdminLogin={handleAdminLogin}
      />
    );
  }

  if (currentView === 'voyage-details') {
    return (
      <VoyageDetails
        voyageId={viewingVoyageId}
        onBack={() => setCurrentView('catalog')}
        onAdminLogin={handleAdminLogin}
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

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
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
          userName="Julien"
          userRole="Admin"
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

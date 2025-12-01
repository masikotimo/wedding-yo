import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import DashboardLayout from './components/Dashboard/DashboardLayout';
import DashboardOverview from './components/Dashboard/DashboardOverview';
import BudgetManagement from './components/Budget/BudgetManagement';
import PrintBudget from './components/Budget/PrintBudget';
import PledgeManagement from './components/Pledges/PledgeManagement';
import PublicPledgeForm from './components/Pledges/PublicPledgeForm';
import CashManagement from './components/CashAtHand/CashManagement';
import ExpenditureManagement from './components/Expenditure/ExpenditureManagement';
import GuestManagement from './components/Guests/GuestManagement';
import VendorManagement from './components/Vendors/VendorManagement';
import AgendaManagement from './components/Agenda/AgendaManagement';
import Settings from './components/Settings/Settings';
import AdminDashboard from './components/Admin/AdminDashboard';

function AppContent() {
  const { user, loading } = useAuth();
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isPublicPledgePage, setIsPublicPledgePage] = useState(false);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const path = window.location.pathname;
    const token = urlParams.get('token');

    if (path === '/pledge' || token) {
      setIsPublicPledgePage(true);
    }
  }, []);

  if (isPublicPledgePage) {
    return <PublicPledgeForm />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    if (authMode === 'login') {
      return <Login onToggleMode={() => setAuthMode('register')} />;
    } else {
      return <Register onToggleMode={() => setAuthMode('login')} />;
    }
  }

  return (
    <DashboardLayout activeTab={activeTab} onTabChange={setActiveTab}>
      {activeTab === 'dashboard' && <DashboardOverview />}
      {activeTab === 'budget' && <BudgetManagement />}
      {activeTab === 'print' && <PrintBudget />}
      {activeTab === 'pledges' && <PledgeManagement />}
      {activeTab === 'cash' && <CashManagement />}
      {activeTab === 'expenditure' && <ExpenditureManagement />}
      {activeTab === 'guests' && <GuestManagement />}
      {activeTab === 'vendors' && <VendorManagement />}
      {activeTab === 'agenda' && <AgendaManagement />}
      {activeTab === 'settings' && <Settings />}
      {activeTab === 'admin' && <AdminDashboard />}
    </DashboardLayout>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;

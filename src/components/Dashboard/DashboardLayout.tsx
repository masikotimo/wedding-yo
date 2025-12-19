import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import {
  LayoutDashboard,
  DollarSign,
  Users,
  Calendar,
  Settings,
  LogOut,
  Menu,
  X,
  Briefcase,
  UserPlus,
  Shield,
  Printer,
  Wallet,
  TrendingDown
} from 'lucide-react';

interface DashboardLayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

interface Wedding {
  id: string;
  bride_name: string;
  groom_name: string;
  wedding_date: string;
  expected_guests: number;
}

export default function DashboardLayout({ children, activeTab, onTabChange }: DashboardLayoutProps) {
  const { user, signOut } = useAuth();
  const [wedding, setWedding] = useState<Wedding | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    loadWedding();
    checkAdmin();
  }, [user]);

  const loadWedding = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('weddings')
      .select('*')
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle();

    if (data && !error) {
      setWedding(data);
    }
  };

  const checkAdmin = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('admin_users')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .maybeSingle();

    setIsAdmin(!!data);
  };

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'budget', label: 'Budget', icon: DollarSign },
    { id: 'print', label: 'Print Budget', icon: Printer },
    { id: 'pledges', label: 'Pledges', icon: UserPlus },
    { id: 'cash', label: 'Cash at Hand', icon: Wallet },
    { id: 'expenditure', label: 'Expenditure', icon: TrendingDown },
    { id: 'guests', label: 'Guests', icon: Users },
    { id: 'vendors', label: 'Vendors', icon: Briefcase },
    { id: 'agenda', label: 'Agenda', icon: Calendar },
    { id: 'settings', label: 'Settings', icon: Settings },
    ...(isAdmin ? [{ id: 'admin', label: 'Admin Panel', icon: Shield }] : []),
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-white border-b border-gray-200 p-4 z-50">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold text-gray-900">Wedding Planner</h1>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 text-gray-600 hover:text-gray-900"
          >
            {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      <div className={`fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-blue-600">Wedding Planner</h1>
            {wedding && (
              <div className="mt-4 text-sm">
                <p className="font-semibold text-gray-900">
                  {wedding.bride_name} & {wedding.groom_name}
                </p>
                <p className="text-gray-600 mt-1">
                  {new Date(wedding.wedding_date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            )}
          </div>

          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onTabChange(item.id);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center px-4 py-3 rounded-lg transition-all ${
                    isActive
                      ? 'bg-blue-50 text-blue-600 font-semibold'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-5 h-5 mr-3" />
                  {item.label}
                </button>
              );
            })}
          </nav>

          <div className="p-4 border-t border-gray-200">
            <button
              onClick={signOut}
              className="w-full flex items-center px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5 mr-3" />
              Sign Out
            </button>
          </div>
        </div>
      </div>

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="lg:pl-64 pt-16 lg:pt-0">
        <main className="p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}

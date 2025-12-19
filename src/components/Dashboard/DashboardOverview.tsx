import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { formatCurrency } from '../../lib/currency';
import {
  DollarSign,
  TrendingUp,
  Users,
  CreditCard,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

interface DashboardStats {
  totalBudget: number;
  totalPaid: number;
  totalBalance: number;
  percentageCovered: number;
  totalPledges: number;
  pledgesPaid: number;
  pledgesOutstanding: number;
  pledgeFulfillmentRate: number;
  cashAtHand: number;
  totalExpenditure: number;
  expectedGuests: number;
  confirmedGuests: number;
  budgetPerGuest: number;
}

export default function DashboardOverview() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalBudget: 0,
    totalPaid: 0,
    totalBalance: 0,
    percentageCovered: 0,
    totalPledges: 0,
    pledgesPaid: 0,
    pledgesOutstanding: 0,
    pledgeFulfillmentRate: 0,
    cashAtHand: 0,
    totalExpenditure: 0,
    expectedGuests: 0,
    confirmedGuests: 0,
    budgetPerGuest: 0,
  });
  const [currency, setCurrency] = useState('USD');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, [user]);

  const loadStats = async () => {
    if (!user) return;

    const { data: weddings } = await supabase
      .from('weddings')
      .select('id, expected_guests, currency')
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle();

    if (!weddings) {
      setLoading(false);
      return;
    }

    const weddingId = weddings.id;
    setCurrency(weddings.currency || 'USD');

    const [budgetResult, pledgesResult, guestsResult, cashResult, expenditureResult] = await Promise.all([
      supabase
        .from('budget_items')
        .select('amount, paid, balance')
        .eq('wedding_id', weddingId),
      supabase
        .from('pledges')
        .select('amount_pledged, amount_paid, balance')
        .eq('wedding_id', weddingId),
      supabase
        .from('guests')
        .select('rsvp_status')
        .eq('wedding_id', weddingId),
      supabase
        .from('cash_transactions')
        .select('amount')
        .eq('wedding_id', weddingId),
      supabase
        .from('expenditures')
        .select('amount')
        .eq('wedding_id', weddingId),
    ]);

    const totalBudget = budgetResult.data?.reduce((sum, item) => sum + Number(item.amount), 0) || 0;
    const totalPaid = budgetResult.data?.reduce((sum, item) => sum + Number(item.paid), 0) || 0;
    const totalBalance = budgetResult.data?.reduce((sum, item) => sum + Number(item.balance), 0) || 0;

    const totalPledges = pledgesResult.data?.reduce((sum, item) => sum + Number(item.amount_pledged), 0) || 0;
    const pledgesPaid = pledgesResult.data?.reduce((sum, item) => sum + Number(item.amount_paid), 0) || 0;
    const pledgesOutstanding = pledgesResult.data?.reduce((sum, item) => sum + Number(item.balance), 0) || 0;

    const cashAtHand = cashResult.data?.reduce((sum, item) => sum + Number(item.amount), 0) || 0;
    const totalExpenditure = expenditureResult.data?.reduce((sum, item) => sum + Number(item.amount), 0) || 0;

    const confirmedGuests = guestsResult.data?.filter(g => g.rsvp_status === 'confirmed').length || 0;

    const percentageCovered = totalBudget > 0 ? (totalPaid / totalBudget) * 100 : 0;
    const pledgeFulfillmentRate = totalPledges > 0 ? (pledgesPaid / totalPledges) * 100 : 0;
    const budgetPerGuest = weddings.expected_guests > 0 ? totalBudget / weddings.expected_guests : 0;

    setStats({
      totalBudget,
      totalPaid,
      totalBalance,
      percentageCovered,
      totalPledges,
      pledgesPaid,
      pledgesOutstanding,
      pledgeFulfillmentRate,
      cashAtHand,
      totalExpenditure,
      expectedGuests: weddings.expected_guests,
      confirmedGuests,
      budgetPerGuest,
    });

    setLoading(false);
  };

  const formatAmount = (amount: number) => {
    return formatCurrency(amount, currency);
  };

  const StatCard = ({
    title,
    value,
    icon: Icon,
    color,
    subtitle
  }: {
    title: string;
    value: string | number;
    icon: any;
    color: string;
    subtitle?: string;
  }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 rounded-lg ${color} flex items-center justify-center`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
      <h3 className="text-gray-600 text-sm font-medium mb-1">{title}</h3>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Dashboard Overview</h2>
        <p className="text-gray-600 mt-2">Track your wedding budget and planning progress</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Budget"
          value={formatAmount(stats.totalBudget)}
          icon={DollarSign}
          color="bg-blue-600"
          subtitle={`${formatAmount(stats.budgetPerGuest)} per guest`}
        />
        <StatCard
          title="Total Paid"
          value={formatAmount(stats.totalPaid)}
          icon={CheckCircle}
          color="bg-green-600"
          subtitle={`${stats.percentageCovered.toFixed(1)}% covered`}
        />
        <StatCard
          title="Balance Due"
          value={formatAmount(stats.totalBalance)}
          icon={AlertCircle}
          color="bg-orange-600"
          subtitle={`${(100 - stats.percentageCovered).toFixed(1)}% remaining`}
        />
        <StatCard
          title="Expected Guests"
          value={stats.expectedGuests}
          icon={Users}
          color="bg-blue-600"
          subtitle={`${stats.confirmedGuests} confirmed`}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard
          title="Total Pledges"
          value={formatAmount(stats.totalPledges)}
          icon={TrendingUp}
          color="bg-blue-600"
          subtitle={`${stats.pledgeFulfillmentRate.toFixed(1)}% fulfilled`}
        />
        <StatCard
          title="Cash at Hand"
          value={formatAmount(stats.cashAtHand)}
          icon={CreditCard}
          color="bg-green-600"
          subtitle="All sources"
        />
        <StatCard
          title="Total Expenditure"
          value={formatAmount(stats.totalExpenditure)}
          icon={AlertCircle}
          color="bg-red-600"
          subtitle="Money spent"
        />
        <StatCard
          title="Net Cash Position"
          value={formatAmount(stats.cashAtHand - stats.totalExpenditure)}
          icon={DollarSign}
          color={stats.cashAtHand - stats.totalExpenditure >= 0 ? "bg-green-600" : "bg-red-600"}
          subtitle="Cash - Expenditure"
        />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Budget Progress</h3>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-600">Budget Coverage</span>
              <span className="font-semibold text-gray-900">
                {stats.percentageCovered.toFixed(1)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-blue-600 h-3 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(stats.percentageCovered, 100)}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t">
            <div>
              <p className="text-sm text-gray-600 mb-1">Paid</p>
              <p className="text-xl font-bold text-green-600">{formatAmount(stats.totalPaid)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Remaining</p>
              <p className="text-xl font-bold text-orange-600">{formatAmount(stats.totalBalance)}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

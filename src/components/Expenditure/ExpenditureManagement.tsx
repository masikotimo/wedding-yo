import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { formatCurrency } from '../../lib/currency';
import { Plus, Edit2, Trash2, DollarSign, Calendar, TrendingDown } from 'lucide-react';
import ExpenditureModal from './ExpenditureModal';

interface Expenditure {
  id: string;
  expense_date: string;
  category: string;
  description: string;
  amount: number;
  payment_method: string | null;
  vendor_name: string | null;
  notes: string | null;
}

export default function ExpenditureManagement() {
  const { user } = useAuth();
  const [weddingId, setWeddingId] = useState<string | null>(null);
  const [currency, setCurrency] = useState('USD');
  const [expenditures, setExpenditures] = useState<Expenditure[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingExpenditure, setEditingExpenditure] = useState<Expenditure | null>(null);
  const [filterCategory, setFilterCategory] = useState('');

  useEffect(() => {
    loadExpenditures();
  }, [user]);

  const loadExpenditures = async () => {
    if (!user) return;

    const { data: wedding } = await supabase
      .from('weddings')
      .select('id, currency')
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle();

    if (!wedding) {
      setLoading(false);
      return;
    }

    setWeddingId(wedding.id);
    setCurrency(wedding.currency || 'USD');

    const { data } = await supabase
      .from('expenditures')
      .select('*')
      .eq('wedding_id', wedding.id)
      .order('expense_date', { ascending: false });

    if (data) setExpenditures(data);
    setLoading(false);
  };

  const handleAddExpenditure = () => {
    setEditingExpenditure(null);
    setModalOpen(true);
  };

  const handleEditExpenditure = (expenditure: Expenditure) => {
    setEditingExpenditure(expenditure);
    setModalOpen(true);
  };

  const handleDeleteExpenditure = async (expenditureId: string) => {
    if (!confirm('Are you sure you want to delete this expenditure?')) return;

    await supabase.from('expenditures').delete().eq('id', expenditureId);
    await loadExpenditures();
  };

  const handleSaveExpenditure = async () => {
    await loadExpenditures();
    setModalOpen(false);
    setEditingExpenditure(null);
  };

  const formatAmount = (amount: number) => {
    return formatCurrency(amount, currency);
  };

  const getTotals = () => {
    const filtered = filterCategory
      ? expenditures.filter(e => e.category === filterCategory)
      : expenditures;

    const total = filtered.reduce((sum, e) => sum + Number(e.amount), 0);
    return total;
  };

  const getCategories = () => {
    const categories = Array.from(new Set(expenditures.map(e => e.category)));
    return categories.sort();
  };

  const getCategoryTotal = (category: string) => {
    return expenditures
      .filter(e => e.category === category)
      .reduce((sum, e) => sum + Number(e.amount), 0);
  };

  const filteredExpenditures = filterCategory
    ? expenditures.filter(e => e.category === filterCategory)
    : expenditures;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Expenditure Management</h2>
          <p className="text-gray-600 mt-2">Track all wedding expenses and spending</p>
        </div>
        <button
          onClick={handleAddExpenditure}
          className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Expenditure
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <DollarSign className="w-8 h-8 text-red-600" />
          </div>
          <p className="text-sm text-gray-600 mb-1">Total Expenditure</p>
          <p className="text-2xl font-bold text-red-600">{formatAmount(getTotals())}</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <TrendingDown className="w-8 h-8 text-orange-600" />
          </div>
          <p className="text-sm text-gray-600 mb-1">Total Transactions</p>
          <p className="text-2xl font-bold text-gray-900">{filteredExpenditures.length}</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <Calendar className="w-8 h-8 text-blue-600" />
          </div>
          <p className="text-sm text-gray-600 mb-1">Categories</p>
          <p className="text-2xl font-bold text-gray-900">{getCategories().length}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Category Breakdown</h3>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Categories</option>
            {getCategories().map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {getCategories().map(category => (
            <div
              key={category}
              className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-blue-500 cursor-pointer transition-colors"
              onClick={() => setFilterCategory(filterCategory === category ? '' : category)}
            >
              <div className="font-medium text-gray-900">{category}</div>
              <div className="text-2xl font-bold text-red-600 mt-2">
                {formatAmount(getCategoryTotal(category))}
              </div>
              <div className="text-sm text-gray-500 mt-1">
                {expenditures.filter(e => e.category === category).length} expenses
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            {filterCategory ? `${filterCategory} Expenses` : 'All Expenses'}
          </h3>
        </div>

        {filteredExpenditures.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vendor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment Method
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredExpenditures.map((expenditure) => (
                  <tr key={expenditure.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(expenditure.expense_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                        {expenditure.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div>{expenditure.description}</div>
                      {expenditure.notes && (
                        <div className="text-xs text-gray-500 mt-1">{expenditure.notes}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {expenditure.vendor_name || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {expenditure.payment_method || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold text-red-600">
                      {formatAmount(expenditure.amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleEditExpenditure(expenditure)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteExpenditure(expenditure.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-6 py-12 text-center text-gray-500">
            No expenditures recorded yet. Click "Add Expenditure" to get started.
          </div>
        )}
      </div>

      {modalOpen && weddingId && (
        <ExpenditureModal
          isOpen={modalOpen}
          onClose={() => {
            setModalOpen(false);
            setEditingExpenditure(null);
          }}
          onSave={handleSaveExpenditure}
          weddingId={weddingId}
          expenditure={editingExpenditure}
          existingCategories={getCategories()}
        />
      )}
    </div>
  );
}

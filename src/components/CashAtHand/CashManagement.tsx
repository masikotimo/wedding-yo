import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { formatCurrency } from '../../lib/currency';
import { Plus, Edit2, Trash2, Wallet, TrendingUp, Gift } from 'lucide-react';
import CashTransactionModal from './CashTransactionModal';

interface CashTransaction {
  id: string;
  transaction_date: string;
  amount: number;
  source_type: string;
  source_reference_id: string | null;
  contributor_name: string;
  notes: string | null;
}

export default function CashManagement() {
  const { user } = useAuth();
  const [weddingId, setWeddingId] = useState<string | null>(null);
  const [currency, setCurrency] = useState('USD');
  const [transactions, setTransactions] = useState<CashTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<CashTransaction | null>(null);
  const [filterType, setFilterType] = useState('');

  useEffect(() => {
    loadTransactions();
  }, [user]);

  const loadTransactions = async () => {
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
      .from('cash_transactions')
      .select('*')
      .eq('wedding_id', wedding.id)
      .order('transaction_date', { ascending: false });

    if (data) setTransactions(data);
    setLoading(false);
  };

  const handleAddTransaction = () => {
    setEditingTransaction(null);
    setModalOpen(true);
  };

  const handleEditTransaction = (transaction: CashTransaction) => {
    if (transaction.source_type === 'pledge' && transaction.source_reference_id) {
      alert('This transaction is linked to a pledge and cannot be edited here. Please edit the pledge instead.');
      return;
    }
    setEditingTransaction(transaction);
    setModalOpen(true);
  };

  const handleDeleteTransaction = async (transaction: CashTransaction) => {
    if (transaction.source_type === 'pledge' && transaction.source_reference_id) {
      alert('This transaction is linked to a pledge and cannot be deleted here. Please edit the pledge instead.');
      return;
    }

    if (!confirm('Are you sure you want to delete this transaction?')) return;

    await supabase.from('cash_transactions').delete().eq('id', transaction.id);
    await loadTransactions();
  };

  const handleSaveTransaction = async () => {
    await loadTransactions();
    setModalOpen(false);
    setEditingTransaction(null);
  };

  const formatAmount = (amount: number) => {
    return formatCurrency(amount, currency);
  };

  const getTotals = () => {
    const filtered = filterType
      ? transactions.filter(t => t.source_type === filterType)
      : transactions;

    const total = filtered.reduce((sum, t) => sum + Number(t.amount), 0);
    return total;
  };

  const getTypeTotal = (type: string) => {
    return transactions
      .filter(t => t.source_type === type)
      .reduce((sum, t) => sum + Number(t.amount), 0);
  };

  const filteredTransactions = filterType
    ? transactions.filter(t => t.source_type === filterType)
    : transactions;

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
          <h2 className="text-3xl font-bold text-gray-900">Cash at Hand</h2>
          <p className="text-gray-600 mt-2">Track all money received for the wedding</p>
        </div>
        <button
          onClick={handleAddTransaction}
          className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Cash
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <Wallet className="w-8 h-8 text-green-600" />
          </div>
          <p className="text-sm text-gray-600 mb-1">Total Cash at Hand</p>
          <p className="text-2xl font-bold text-green-600">{formatAmount(getTotals())}</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="w-8 h-8 text-blue-600" />
          </div>
          <p className="text-sm text-gray-600 mb-1">From Pledges</p>
          <p className="text-2xl font-bold text-blue-600">{formatAmount(getTypeTotal('pledge'))}</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <Gift className="w-8 h-8 text-purple-600" />
          </div>
          <p className="text-sm text-gray-600 mb-1">Gifts</p>
          <p className="text-2xl font-bold text-purple-600">{formatAmount(getTypeTotal('gift'))}</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <Wallet className="w-8 h-8 text-gray-600" />
          </div>
          <p className="text-sm text-gray-600 mb-1">Other Sources</p>
          <p className="text-2xl font-bold text-gray-600">{formatAmount(getTypeTotal('other'))}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Transaction History</h3>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Types</option>
            <option value="pledge">Pledge Payments</option>
            <option value="gift">Gifts</option>
            <option value="other">Other</option>
          </select>
        </div>

        {filteredTransactions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contributor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Source Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Notes
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
                {filteredTransactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(transaction.transaction_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {transaction.contributor_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        transaction.source_type === 'pledge'
                          ? 'bg-blue-100 text-blue-800'
                          : transaction.source_type === 'gift'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {transaction.source_type === 'pledge' ? 'Pledge' : transaction.source_type === 'gift' ? 'Gift' : 'Other'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {transaction.notes || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold text-green-600">
                      {formatAmount(transaction.amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        {!(transaction.source_type === 'pledge' && transaction.source_reference_id) && (
                          <>
                            <button
                              onClick={() => handleEditTransaction(transaction)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteTransaction(transaction)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        {transaction.source_type === 'pledge' && transaction.source_reference_id && (
                          <span className="text-xs text-gray-500">From Pledge</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-6 py-12 text-center text-gray-500">
            No cash transactions recorded yet. Click "Add Cash" to get started.
          </div>
        )}
      </div>

      {modalOpen && weddingId && (
        <CashTransactionModal
          isOpen={modalOpen}
          onClose={() => {
            setModalOpen(false);
            setEditingTransaction(null);
          }}
          onSave={handleSaveTransaction}
          weddingId={weddingId}
          transaction={editingTransaction}
        />
      )}
    </div>
  );
}

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { formatCurrency as formatCurrencyUtil } from '../../lib/currency';
import { Plus, Edit2, Trash2, Wallet, Phone, Mail, MessageSquare, Share2, Upload, AlertTriangle } from 'lucide-react';
import PledgeModal from './PledgeModal';
import WhatsAppMessageModal from './WhatsAppMessageModal';
import ShareLinkModal from './ShareLinkModal';
import WhatsAppImportModal from './WhatsAppImportModal';

interface Pledge {
  id: string;
  contributor_name: string;
  phone: string | null;
  email: string | null;
  amount_pledged: number;
  amount_paid: number | null;
  balance: number | null;
  payment_method: string | null;
  pledge_fulfillment_date: string;
  created_at: string;
  status: string;
  notes: string | null;
}

export default function PledgeManagement() {
  const { user } = useAuth();
  const [weddingId, setWeddingId] = useState<string | null>(null);
  const [currency, setCurrency] = useState('USD');
  const [weddingInfo, setWeddingInfo] = useState<{ bride_name: string; groom_name: string; wedding_date: string } | null>(null);
  const [pledges, setPledges] = useState<Pledge[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPledge, setEditingPledge] = useState<Pledge | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [whatsappModalOpen, setWhatsappModalOpen] = useState(false);
  const [shareLinkModalOpen, setShareLinkModalOpen] = useState(false);
  const [whatsappImportModalOpen, setWhatsappImportModalOpen] = useState(false);

  useEffect(() => {
    loadPledges();
  }, [user]);

  const loadPledges = async () => {
    if (!user) return;

    const { data: wedding } = await supabase
      .from('weddings')
      .select('id, currency, bride_name, groom_name, wedding_date')
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle();

    if (!wedding) {
      setLoading(false);
      return;
    }

    setWeddingId(wedding.id);
    setCurrency(wedding.currency || 'USD');
    setWeddingInfo({
      bride_name: wedding.bride_name,
      groom_name: wedding.groom_name,
      wedding_date: wedding.wedding_date,
    });

    const { data } = await supabase
      .from('pledges')
      .select('*')
      .eq('wedding_id', wedding.id)
      .order('created_at', { ascending: true });

    if (data) setPledges(data);
    setLoading(false);
  };

  const handleAddPledge = () => {
    setEditingPledge(null);
    setModalOpen(true);
  };

  const handleEditPledge = (pledge: Pledge) => {
    setEditingPledge(pledge);
    setModalOpen(true);
  };

  const handleDeletePledge = async (pledgeId: string) => {
    if (!confirm('Are you sure you want to delete this pledge?')) return;

    await supabase.from('pledges').delete().eq('id', pledgeId);
    await loadPledges();
  };

  const handleDeleteAllPledges = async () => {
    const count = pledges.length;
    if (count === 0) {
      alert('No pledges to delete');
      return;
    }

    const confirmed = confirm(
      `Are you sure you want to delete ALL ${count} pledge(s)? This action cannot be undone.`
    );

    if (!confirmed) return;

    if (!weddingId) return;

    // Delete all pledges for this wedding
    await supabase.from('pledges').delete().eq('wedding_id', weddingId);
    await loadPledges();
  };

  const handleSavePledge = async () => {
    await loadPledges();
    setModalOpen(false);
    setEditingPledge(null);
  };

  const formatCurrency = (amount: number) => {
    return formatCurrencyUtil(amount, currency);
  };

  const getTotals = () => {
    const totalPledged = pledges.reduce((sum, p) => sum + Number(p.amount_pledged || 0), 0);
    const totalPaid = pledges.reduce((sum, p) => sum + Number(p.amount_paid || 0), 0);
    const totalOutstanding = pledges.reduce((sum, p) => sum + Number(p.balance || 0), 0);
    const fulfillmentRate = totalPledged > 0 ? (totalPaid / totalPledged) * 100 : 0;

    return { totalPledged, totalPaid, totalOutstanding, fulfillmentRate };
  };

  const totals = getTotals();

  const filteredPledges = pledges.filter((pledge) =>
    pledge.contributor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pledge.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pledge.email?.toLowerCase().includes(searchTerm.toLowerCase())
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Pledge Management</h2>
          <p className="text-gray-600 mt-2">Track financial contributions and pledges</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShareLinkModalOpen(true)}
            className="flex items-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            <Share2 className="w-5 h-5 mr-2" />
            Share Link
          </button>
          <button
            onClick={() => setWhatsappImportModalOpen(true)}
            className="flex items-center px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
          >
            <Upload className="w-5 h-5 mr-2" />
            Import WhatsApp
          </button>
          <button
            onClick={() => setWhatsappModalOpen(true)}
            className="flex items-center px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
          >
            <MessageSquare className="w-5 h-5 mr-2" />
            WhatsApp Message
          </button>
          <button
            onClick={handleAddPledge}
            className="flex items-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Pledge
          </button>
          {pledges.length > 0 && (
            <button
              onClick={handleDeleteAllPledges}
              className="flex items-center px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
            >
              <AlertTriangle className="w-5 h-5 mr-2" />
              Delete All
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <Wallet className="w-8 h-8 text-blue-600" />
          </div>
          <p className="text-sm text-gray-600 mb-1">Total Pledged</p>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(totals.totalPledged)}</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <Wallet className="w-8 h-8 text-green-600" />
          </div>
          <p className="text-sm text-gray-600 mb-1">Total Received</p>
          <p className="text-2xl font-bold text-green-600">{formatCurrency(totals.totalPaid)}</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <Wallet className="w-8 h-8 text-orange-600" />
          </div>
          <p className="text-sm text-gray-600 mb-1">Outstanding</p>
          <p className="text-2xl font-bold text-orange-600">{formatCurrency(totals.totalOutstanding)}</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <Wallet className="w-8 h-8 text-blue-600" />
          </div>
          <p className="text-sm text-gray-600 mb-1">Fulfillment Rate</p>
          <p className="text-2xl font-bold text-blue-600">{totals.fulfillmentRate.toFixed(1)}%</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <input
            type="text"
            placeholder="Search pledges by name, phone, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {filteredPledges.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Contributor</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Contact</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Pledged</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Paid</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Balance</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Payment Method</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredPledges.map((pledge) => (
                  <tr key={pledge.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{pledge.contributor_name}</div>
                      <div className="text-xs text-gray-500">
                        Entered: {new Date(pledge.created_at).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-gray-500">
                        Fulfillment: {new Date(pledge.pledge_fulfillment_date).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {pledge.phone && (
                        <div className="flex items-center text-sm text-gray-600 mb-1">
                          <Phone className="w-3 h-3 mr-2" />
                          {pledge.phone}
                        </div>
                      )}
                      {pledge.email && (
                        <div className="flex items-center text-sm text-gray-600">
                          <Mail className="w-3 h-3 mr-2" />
                          {pledge.email}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right font-semibold text-gray-900">
                      {formatCurrency(pledge.amount_pledged)}
                    </td>
                    <td className="px-6 py-4 text-right text-green-600 font-medium">
                      {formatCurrency(pledge.amount_paid ?? 0)}
                    </td>
                    <td className="px-6 py-4 text-right text-orange-600 font-medium">
                      {formatCurrency(pledge.balance ?? 0)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        pledge.status === 'fulfilled'
                          ? 'bg-green-100 text-green-800'
                          : pledge.status === 'partial'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {pledge.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {pledge.payment_method || '-'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          onClick={() => handleEditPledge(pledge)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeletePledge(pledge.id)}
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
            {searchTerm ? 'No pledges found matching your search.' : 'No pledges yet. Click "Add Pledge" to get started.'}
          </div>
        )}
      </div>

      {modalOpen && weddingId && (
        <PledgeModal
          weddingId={weddingId}
          pledge={editingPledge}
          onClose={() => {
            setModalOpen(false);
            setEditingPledge(null);
          }}
          onSave={handleSavePledge}
          currency={currency}
        />
      )}

      {whatsappModalOpen && weddingInfo && (
        <WhatsAppMessageModal
          pledges={pledges}
          currency={currency}
          weddingInfo={weddingInfo}
          onClose={() => setWhatsappModalOpen(false)}
        />
      )}

      {shareLinkModalOpen && weddingId && (
        <ShareLinkModal
          weddingId={weddingId}
          onClose={() => setShareLinkModalOpen(false)}
        />
      )}

      {whatsappImportModalOpen && weddingId && (
        <WhatsAppImportModal
          weddingId={weddingId}
          existingPledges={pledges.map(p => ({
            id: p.id,
            contributor_name: p.contributor_name,
            amount_pledged: p.amount_pledged,
            amount_paid: p.amount_paid,
            balance: p.balance,
          }))}
          onClose={() => setWhatsappImportModalOpen(false)}
          onImport={loadPledges}
        />
      )}
    </div>
  );
}

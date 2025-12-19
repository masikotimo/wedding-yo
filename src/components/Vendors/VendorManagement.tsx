import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { formatCurrency as formatCurrencyUtil } from '../../lib/currency';
import { Plus, Edit2, Trash2, Phone, Mail, MapPin, Calendar, DollarSign } from 'lucide-react';
import VendorModal from './VendorModal';

interface Vendor {
  id: string;
  provider_name: string;
  contact_person: string | null;
  phone: string | null;
  email: string | null;
  category: string | null;
  service_description: string | null;
  venue: string | null;
  delivery_date: string | null;
  committee_responsible: string | null;
  person_responsible: string | null;
  contract_amount: number;
  amount_paid: number;
  balance: number;
  status: string;
  notes: string | null;
}

export default function VendorManagement() {
  const { user } = useAuth();
  const [weddingId, setWeddingId] = useState<string | null>(null);
  const [currency, setCurrency] = useState('USD');
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');

  useEffect(() => {
    loadVendors();
  }, [user]);

  const loadVendors = async () => {
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
      .from('service_providers')
      .select('*')
      .eq('wedding_id', wedding.id)
      .order('created_at', { ascending: false });

    if (data) setVendors(data);
    setLoading(false);
  };

  const handleAddVendor = () => {
    setEditingVendor(null);
    setModalOpen(true);
  };

  const handleEditVendor = (vendor: Vendor) => {
    setEditingVendor(vendor);
    setModalOpen(true);
  };

  const handleDeleteVendor = async (vendorId: string) => {
    if (!confirm('Are you sure you want to delete this vendor?')) return;

    await supabase.from('service_providers').delete().eq('id', vendorId);
    await loadVendors();
  };

  const handleSaveVendor = async () => {
    await loadVendors();
    setModalOpen(false);
    setEditingVendor(null);
  };

  const formatCurrency = (amount: number) => {
    return formatCurrencyUtil(amount, currency);
  };

  const getTotals = () => {
    const totalContract = vendors.reduce((sum, v) => sum + Number(v.contract_amount), 0);
    const totalPaid = vendors.reduce((sum, v) => sum + Number(v.amount_paid), 0);
    const totalBalance = vendors.reduce((sum, v) => sum + Number(v.balance), 0);
    const paymentRate = totalContract > 0 ? (totalPaid / totalContract) * 100 : 0;

    return { totalContract, totalPaid, totalBalance, paymentRate };
  };

  const totals = getTotals();

  const categories = Array.from(new Set(vendors.map(v => v.category).filter(Boolean)));

  const filteredVendors = vendors.filter((vendor) => {
    const matchesSearch =
      vendor.provider_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vendor.contact_person?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vendor.category?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = !filterCategory || vendor.category === filterCategory;

    return matchesSearch && matchesCategory;
  });

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
          <h2 className="text-3xl font-bold text-gray-900">Vendor Management</h2>
          <p className="text-gray-600 mt-2">Manage service providers and vendors</p>
        </div>
        <button
          onClick={handleAddVendor}
          className="flex items-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Vendor
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <DollarSign className="w-8 h-8 text-blue-600" />
          </div>
          <p className="text-sm text-gray-600 mb-1">Total Contracts</p>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(totals.totalContract)}</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <DollarSign className="w-8 h-8 text-green-600" />
          </div>
          <p className="text-sm text-gray-600 mb-1">Total Paid</p>
          <p className="text-2xl font-bold text-green-600">{formatCurrency(totals.totalPaid)}</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <DollarSign className="w-8 h-8 text-orange-600" />
          </div>
          <p className="text-sm text-gray-600 mb-1">Outstanding</p>
          <p className="text-2xl font-bold text-orange-600">{formatCurrency(totals.totalBalance)}</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <DollarSign className="w-8 h-8 text-blue-600" />
          </div>
          <p className="text-sm text-gray-600 mb-1">Payment Rate</p>
          <p className="text-2xl font-bold text-blue-600">{totals.paymentRate.toFixed(1)}%</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200 space-y-4">
          <input
            type="text"
            placeholder="Search vendors by name, contact, or category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />

          {categories.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setFilterCategory('')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  !filterCategory
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setFilterCategory(cat!)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filterCategory === cat
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
        </div>

        {filteredVendors.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-6">
            {filteredVendors.map((vendor) => (
              <div
                key={vendor.id}
                className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {vendor.provider_name}
                    </h3>
                    {vendor.category && (
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                        {vendor.category}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleEditVendor(vendor)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteVendor(vendor.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {vendor.service_description && (
                  <p className="text-sm text-gray-600 mb-4">{vendor.service_description}</p>
                )}

                <div className="space-y-2 mb-4">
                  {vendor.contact_person && (
                    <div className="flex items-center text-sm text-gray-600">
                      <span className="font-medium mr-2">Contact:</span>
                      {vendor.contact_person}
                    </div>
                  )}
                  {vendor.phone && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Phone className="w-4 h-4 mr-2" />
                      {vendor.phone}
                    </div>
                  )}
                  {vendor.email && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Mail className="w-4 h-4 mr-2" />
                      {vendor.email}
                    </div>
                  )}
                  {vendor.venue && (
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="w-4 h-4 mr-2" />
                      {vendor.venue}
                    </div>
                  )}
                  {vendor.delivery_date && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="w-4 h-4 mr-2" />
                      {new Date(vendor.delivery_date).toLocaleDateString()}
                    </div>
                  )}
                </div>

                {(vendor.committee_responsible || vendor.person_responsible) && (
                  <div className="border-t pt-4 mb-4 space-y-1">
                    {vendor.committee_responsible && (
                      <div className="text-sm">
                        <span className="text-gray-600">Committee:</span>{' '}
                        <span className="font-medium text-gray-900">{vendor.committee_responsible}</span>
                      </div>
                    )}
                    {vendor.person_responsible && (
                      <div className="text-sm">
                        <span className="text-gray-600">Coordinator:</span>{' '}
                        <span className="font-medium text-gray-900">{vendor.person_responsible}</span>
                      </div>
                    )}
                  </div>
                )}

                <div className="border-t pt-4">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Contract</p>
                      <p className="font-semibold text-gray-900">{formatCurrency(vendor.contract_amount)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Paid</p>
                      <p className="font-semibold text-green-600">{formatCurrency(vendor.amount_paid)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Balance</p>
                      <p className="font-semibold text-orange-600">{formatCurrency(vendor.balance)}</p>
                    </div>
                  </div>
                  <div className="mt-3">
                    <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full w-full justify-center ${
                      vendor.status === 'paid'
                        ? 'bg-green-100 text-green-800'
                        : vendor.status === 'partial'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {vendor.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="px-6 py-12 text-center text-gray-500">
            {searchTerm || filterCategory
              ? 'No vendors found matching your filters.'
              : 'No vendors yet. Click "Add Vendor" to get started.'}
          </div>
        )}
      </div>

      {modalOpen && weddingId && (
        <VendorModal
          weddingId={weddingId}
          vendor={editingVendor}
          onClose={() => {
            setModalOpen(false);
            setEditingVendor(null);
          }}
          onSave={handleSaveVendor}
        />
      )}
    </div>
  );
}

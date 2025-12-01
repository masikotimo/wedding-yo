import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { X } from 'lucide-react';

interface VendorModalProps {
  weddingId: string;
  vendor: any | null;
  onClose: () => void;
  onSave: () => void;
}

export default function VendorModal({ weddingId, vendor, onClose, onSave }: VendorModalProps) {
  const [formData, setFormData] = useState({
    provider_name: '',
    contact_person: '',
    phone: '',
    email: '',
    category: '',
    service_description: '',
    venue: '',
    delivery_date: '',
    committee_responsible: '',
    person_responsible: '',
    contract_amount: '0',
    amount_paid: '0',
    notes: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (vendor) {
      setFormData({
        provider_name: vendor.provider_name,
        contact_person: vendor.contact_person || '',
        phone: vendor.phone || '',
        email: vendor.email || '',
        category: vendor.category || '',
        service_description: vendor.service_description || '',
        venue: vendor.venue || '',
        delivery_date: vendor.delivery_date || '',
        committee_responsible: vendor.committee_responsible || '',
        person_responsible: vendor.person_responsible || '',
        contract_amount: vendor.contract_amount.toString(),
        amount_paid: vendor.amount_paid.toString(),
        notes: vendor.notes || '',
      });
    }
  }, [vendor]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const contractAmount = parseFloat(formData.contract_amount);
    const amountPaid = parseFloat(formData.amount_paid);
    const balance = contractAmount - amountPaid;

    let status = 'pending';
    if (amountPaid >= contractAmount) status = 'paid';
    else if (amountPaid > 0) status = 'partial';

    const vendorData = {
      wedding_id: weddingId,
      provider_name: formData.provider_name,
      contact_person: formData.contact_person || null,
      phone: formData.phone || null,
      email: formData.email || null,
      category: formData.category || null,
      service_description: formData.service_description || null,
      venue: formData.venue || null,
      delivery_date: formData.delivery_date || null,
      committee_responsible: formData.committee_responsible || null,
      person_responsible: formData.person_responsible || null,
      contract_amount: contractAmount,
      amount_paid: amountPaid,
      balance,
      status,
      notes: formData.notes || null,
    };

    if (vendor) {
      await supabase.from('service_providers').update(vendorData).eq('id', vendor.id);
    } else {
      await supabase.from('service_providers').insert(vendorData);
    }

    setSaving(false);
    onSave();
  };

  const categories = [
    'Videography & Photography',
    'Decorator',
    'Band',
    'Musician',
    'Food/Catering',
    'Cake',
    'Printing',
    'MC/Host',
    'Vehicles/Transport',
    'Drinks Supplier',
    'Tent Provider',
    'Salon & Makeup',
    'Ushers',
    'DJ',
    'Sound System',
    'Lighting',
    'Other',
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">
            {vendor ? 'Edit Service Provider' : 'Add Service Provider'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Provider/Company Name *
              </label>
              <input
                type="text"
                required
                value={formData.provider_name}
                onChange={(e) => setFormData({ ...formData, provider_name: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="ABC Photography Studio"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contact Person
              </label>
              <input
                type="text"
                value={formData.contact_person}
                onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="John Doe"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="+1 (555) 123-4567"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="contact@provider.com"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select category</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Venue
              </label>
              <input
                type="text"
                value={formData.venue}
                onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Service location"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Service Description
            </label>
            <textarea
              value={formData.service_description}
              onChange={(e) => setFormData({ ...formData, service_description: e.target.value })}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Describe the service being provided..."
            />
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Committee Responsible
              </label>
              <input
                type="text"
                value={formData.committee_responsible}
                onChange={(e) => setFormData({ ...formData, committee_responsible: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Decoration Committee"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Person Responsible
              </label>
              <input
                type="text"
                value={formData.person_responsible}
                onChange={(e) => setFormData({ ...formData, person_responsible: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Person coordinating this vendor"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contract Amount
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.contract_amount}
                onChange={(e) => setFormData({ ...formData, contract_amount: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amount Paid
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.amount_paid}
                onChange={(e) => setFormData({ ...formData, amount_paid: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Delivery Date
              </label>
              <input
                type="date"
                value={formData.delivery_date}
                onChange={(e) => setFormData({ ...formData, delivery_date: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">Balance Remaining:</span>
              <span className="text-2xl font-bold text-orange-600">
                ${(parseFloat(formData.contract_amount || '0') - parseFloat(formData.amount_paid || '0')).toFixed(2)}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Additional notes, contract details, special requirements..."
            />
          </div>

          <div className="flex items-center justify-end space-x-4 pt-6 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
            >
              {saving ? 'Saving...' : vendor ? 'Update Vendor' : 'Add Vendor'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

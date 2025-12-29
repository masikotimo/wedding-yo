import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { X } from 'lucide-react';
import { formatCurrency } from '../../lib/currency';

interface PledgeModalProps {
  weddingId: string;
  pledge: any | null;
  onClose: () => void;
  onSave: () => void;
  currency: string;
}

export default function PledgeModal({ weddingId, pledge, onClose, onSave, currency }: PledgeModalProps) {
  const [formData, setFormData] = useState({
    contributor_name: '',
    phone: '',
    email: '',
    amount_pledged: '0',
    amount_paid: '0',
    payment_method: '',
    pledge_fulfillment_date: new Date().toISOString().split('T')[0],
    notes: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (pledge) {
      setFormData({
        contributor_name: pledge.contributor_name,
        phone: pledge.phone || '',
        email: pledge.email || '',
        amount_pledged: pledge.amount_pledged.toString(),
        amount_paid: pledge.amount_paid.toString(),
        payment_method: pledge.payment_method || '',
        pledge_fulfillment_date: pledge.pledge_fulfillment_date,
        notes: pledge.notes || '',
      });
    }
  }, [pledge]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const amountPledged = parseFloat(formData.amount_pledged);
    const amountPaid = parseFloat(formData.amount_paid);
    const balance = amountPledged - amountPaid;

    let status = 'pending';
    if (amountPaid >= amountPledged) status = 'fulfilled';
    else if (amountPaid > 0) status = 'partial';

    const pledgeData = {
      wedding_id: weddingId,
      contributor_name: formData.contributor_name,
      phone: formData.phone || null,
      email: formData.email || null,
      amount_pledged: amountPledged,
      amount_paid: amountPaid,
      balance,
      payment_method: formData.payment_method || null,
      pledge_fulfillment_date: formData.pledge_fulfillment_date,
      status,
      notes: formData.notes || null,
    };

    let pledgeId = pledge?.id;

    if (pledge) {
      const oldAmountPaid = pledge.amount_paid;
      const newPayment = amountPaid - oldAmountPaid;

      await supabase.from('pledges').update(pledgeData).eq('id', pledge.id);

      if (newPayment > 0) {
        await supabase.from('cash_transactions').insert({
          wedding_id: weddingId,
          transaction_date: new Date().toISOString().split('T')[0],
          amount: newPayment,
          source_type: 'pledge',
          source_reference_id: pledge.id,
          contributor_name: formData.contributor_name,
          notes: `Pledge payment - ${formData.payment_method || 'N/A'}`,
        });
      }
    } else {
      const { data: newPledge } = await supabase
        .from('pledges')
        .insert(pledgeData)
        .select()
        .single();

      pledgeId = newPledge?.id;

      if (amountPaid > 0 && pledgeId) {
        await supabase.from('cash_transactions').insert({
          wedding_id: weddingId,
          transaction_date: formData.pledge_fulfillment_date,
          amount: amountPaid,
          source_type: 'pledge',
          source_reference_id: pledgeId,
          contributor_name: formData.contributor_name,
          notes: `Initial pledge payment - ${formData.payment_method || 'N/A'}`,
        });
      }
    }

    setSaving(false);
    onSave();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">
            {pledge ? 'Edit Pledge' : 'Add Pledge'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Contributor Name
            </label>
            <input
              type="text"
              required
              value={formData.contributor_name}
              onChange={(e) => setFormData({ ...formData, contributor_name: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="John Doe"
            />
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
                placeholder="john@example.com"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amount Pledged
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={formData.amount_pledged}
                onChange={(e) => setFormData({ ...formData, amount_pledged: e.target.value })}
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
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">Balance Remaining:</span>
              <span className="text-2xl font-bold text-orange-600">
                {formatCurrency(parseFloat(formData.amount_pledged || '0') - parseFloat(formData.amount_paid || '0'), currency)}
              </span>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Method
              </label>
              <select
                value={formData.payment_method}
                onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select method</option>
                <option value="cash">Cash</option>
                <option value="mobile_money">Mobile Money</option>
                <option value="bank">Bank Transfer</option>
                <option value="check">Check</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pledge Fulfillment Date
              </label>
              <input
                type="date"
                required
                value={formData.pledge_fulfillment_date}
                onChange={(e) => setFormData({ ...formData, pledge_fulfillment_date: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
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
              placeholder="Additional notes..."
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
              {saving ? 'Saving...' : pledge ? 'Update Pledge' : 'Add Pledge'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

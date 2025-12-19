import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { X, Users } from 'lucide-react';

interface BudgetItemModalProps {
  weddingId: string;
  sectionId: string;
  item: any | null;
  expectedGuests: number;
  onClose: () => void;
  onSave: () => void;
}

export default function BudgetItemModal({
  weddingId,
  sectionId,
  item,
  expectedGuests,
  onClose,
  onSave,
}: BudgetItemModalProps) {
  const [formData, setFormData] = useState({
    item_name: '',
    quantity: '1',
    unit_cost: '0',
    paid: '0',
    is_guest_dependent: false,
    guest_multiplier: '1',
    status: 'pending',
    notes: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (item) {
      setFormData({
        item_name: item.item_name,
        quantity: item.quantity.toString(),
        unit_cost: item.unit_cost.toString(),
        paid: item.paid.toString(),
        is_guest_dependent: item.is_guest_dependent,
        guest_multiplier: item.guest_multiplier.toString(),
        status: item.status,
        notes: item.notes || '',
      });
    }
  }, [item]);

  const calculateAmount = () => {
    const qty = formData.is_guest_dependent
      ? expectedGuests * parseFloat(formData.guest_multiplier)
      : parseFloat(formData.quantity);
    const unitCost = parseFloat(formData.unit_cost);
    return qty * unitCost;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const quantity = formData.is_guest_dependent
      ? expectedGuests * parseFloat(formData.guest_multiplier)
      : parseFloat(formData.quantity);

    const amount = quantity * parseFloat(formData.unit_cost);
    const paid = parseFloat(formData.paid);
    const balance = amount - paid;

    let status = 'pending';
    if (paid >= amount) status = 'covered';
    else if (paid > 0) status = 'partial';

    const itemData = {
      wedding_id: weddingId,
      section_id: sectionId,
      item_name: formData.item_name,
      quantity,
      unit_cost: parseFloat(formData.unit_cost),
      amount,
      paid,
      balance,
      status,
      is_guest_dependent: formData.is_guest_dependent,
      guest_multiplier: parseFloat(formData.guest_multiplier),
      notes: formData.notes || null,
    };

    if (item) {
      await supabase
        .from('budget_items')
        .update(itemData)
        .eq('id', item.id);
    } else {
      await supabase.from('budget_items').insert(itemData);
    }

    setSaving(false);
    onSave();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">
            {item ? 'Edit Budget Item' : 'Add Budget Item'}
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
              Item Name
            </label>
            <input
              type="text"
              required
              value={formData.item_name}
              onChange={(e) => setFormData({ ...formData, item_name: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Wedding Cake, Venue Rental"
            />
          </div>

          <div className="flex items-center space-x-3 p-4 bg-blue-50 rounded-lg">
            <input
              type="checkbox"
              id="guestDependent"
              checked={formData.is_guest_dependent}
              onChange={(e) =>
                setFormData({ ...formData, is_guest_dependent: e.target.checked })
              }
              className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
            />
            <label htmlFor="guestDependent" className="flex items-center text-sm font-medium text-gray-900">
              <Users className="w-4 h-4 mr-2 text-blue-600" />
              Guest Dependent (Auto-calculate based on guest count)
            </label>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {formData.is_guest_dependent ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Multiplier per Guest
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={formData.guest_multiplier}
                  onChange={(e) =>
                    setFormData({ ...formData, guest_multiplier: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Quantity will be: {expectedGuests} guests × {formData.guest_multiplier} ={' '}
                  {(expectedGuests * parseFloat(formData.guest_multiplier || '0')).toFixed(2)}
                </p>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantity
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="1"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Unit Cost
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={formData.unit_cost}
                onChange={(e) => setFormData({ ...formData, unit_cost: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">Calculated Amount:</span>
              <span className="text-2xl font-bold text-gray-900">
                ${calculateAmount().toFixed(2)}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Amount Paid
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.paid}
              onChange={(e) => setFormData({ ...formData, paid: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="0.00"
            />
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
              placeholder="Additional notes or details..."
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
              {saving ? 'Saving...' : item ? 'Update Item' : 'Add Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

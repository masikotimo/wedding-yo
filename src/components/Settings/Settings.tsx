import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Calendar, Users, Save, DollarSign } from 'lucide-react';
import { CURRENCIES } from '../../lib/currency';

export default function Settings() {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    bride_name: '',
    groom_name: '',
    wedding_date: '',
    expected_guests: '0',
    currency: 'USD',
  });
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    loadWedding();
  }, [user]);

  const loadWedding = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('weddings')
      .select('*')
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle();

    if (data) {
      setFormData({
        bride_name: data.bride_name,
        groom_name: data.groom_name,
        wedding_date: data.wedding_date,
        expected_guests: data.expected_guests.toString(),
        currency: data.currency || 'USD',
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);

    const { data: wedding } = await supabase
      .from('weddings')
      .select('id')
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle();

    if (wedding) {
      await supabase
        .from('weddings')
        .update({
          bride_name: formData.bride_name,
          groom_name: formData.groom_name,
          wedding_date: formData.wedding_date,
          expected_guests: parseInt(formData.expected_guests),
          currency: formData.currency,
        })
        .eq('id', wedding.id);

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    }

    setSaving(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Settings</h2>
        <p className="text-gray-600 mt-2">Manage your wedding details and preferences</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Wedding Details</h3>

        <form onSubmit={handleSubmit} className="space-y-6">
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
              Settings saved successfully!
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bride's Name
              </label>
              <input
                type="text"
                required
                value={formData.bride_name}
                onChange={(e) => setFormData({ ...formData, bride_name: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Groom's Name
              </label>
              <input
                type="text"
                required
                value={formData.groom_name}
                onChange={(e) => setFormData({ ...formData, groom_name: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-2" />
                Wedding Date
              </label>
              <input
                type="date"
                required
                value={formData.wedding_date}
                onChange={(e) => setFormData({ ...formData, wedding_date: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Users className="w-4 h-4 inline mr-2" />
                Expected Guests
              </label>
              <input
                type="number"
                required
                min="1"
                value={formData.expected_guests}
                onChange={(e) => setFormData({ ...formData, expected_guests: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <DollarSign className="w-4 h-4 inline mr-2" />
              Currency
            </label>
            <select
              value={formData.currency}
              onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {CURRENCIES.map((curr) => (
                <option key={curr.code} value={curr.code}>
                  {curr.symbol} - {curr.name} ({curr.code})
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end pt-6 border-t">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
            >
              <Save className="w-5 h-5 mr-2" />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { formatCurrency as formatCurrencyUtil } from '../../lib/currency';
import { Heart, CheckCircle, AlertCircle } from 'lucide-react';

interface WeddingPublicInfo {
  wedding_id: string;
  bride_name: string;
  groom_name: string;
  wedding_date: string;
  currency: string;
  is_active: boolean;
}

export default function PublicPledgeForm() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [weddingInfo, setWeddingInfo] = useState<WeddingPublicInfo | null>(null);

  const [formData, setFormData] = useState({
    contributor_name: '',
    phone: '',
    email: '',
    amount_pledged: '',
    notes: '',
  });

  useEffect(() => {
    loadWeddingInfo();
  }, []);

  const loadWeddingInfo = async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');

    if (!token) {
      setError('Invalid link. Please check your invitation link.');
      setLoading(false);
      return;
    }

    const { data: publicData, error: publicError } = await supabase
      .from('weddings_public')
      .select('wedding_id, is_active')
      .eq('access_token', token)
      .maybeSingle();

    if (publicError || !publicData || !publicData.is_active) {
      setError('This pledge link is no longer valid or has been disabled.');
      setLoading(false);
      return;
    }

    const { data: weddingData, error: weddingError } = await supabase
      .from('weddings')
      .select('id, bride_name, groom_name, wedding_date, currency')
      .eq('id', publicData.wedding_id)
      .maybeSingle();

    if (weddingError || !weddingData) {
      setError('Unable to load wedding information.');
      setLoading(false);
      return;
    }

    setWeddingInfo({
      wedding_id: weddingData.id,
      bride_name: weddingData.bride_name,
      groom_name: weddingData.groom_name,
      wedding_date: weddingData.wedding_date,
      currency: weddingData.currency || 'USD',
      is_active: publicData.is_active,
    });
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!weddingInfo) return;

    setSubmitting(true);
    setError(null);

    const amount = parseFloat(formData.amount_pledged);

    if (isNaN(amount) || amount <= 0) {
      setError('Please enter a valid amount.');
      setSubmitting(false);
      return;
    }

    const { error: insertError } = await supabase.from('pledges').insert({
      wedding_id: weddingInfo.wedding_id,
      contributor_name: formData.contributor_name,
      phone: formData.phone || null,
      email: formData.email || null,
      amount_pledged: amount,
      amount_paid: 0,
      balance: amount,
      status: 'pending',
      pledge_fulfillment_date: new Date().toISOString().split('T')[0],
      notes: formData.notes || null,
    });

    if (insertError) {
      setError('Failed to submit pledge. Please try again.');
      setSubmitting(false);
      return;
    }

    setSubmitted(true);
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-pink-50 flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-pink-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Unable to Load</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-pink-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Thank You!</h2>
          <p className="text-gray-600 mb-6">
            Your pledge has been successfully submitted. {weddingInfo?.bride_name} and {weddingInfo?.groom_name} appreciate your generosity!
          </p>
          <div className="bg-blue-50 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">Your Pledge</p>
            <p className="text-2xl font-bold text-blue-600">
              {formatCurrencyUtil(parseFloat(formData.amount_pledged), weddingInfo?.currency || 'USD')}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-pink-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <Heart className="w-16 h-16 text-pink-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {weddingInfo?.bride_name} & {weddingInfo?.groom_name}
          </h1>
          <p className="text-gray-600">
            {new Date(weddingInfo?.wedding_date || '').toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
          <p className="text-sm text-gray-500 mt-4">
            We're honored by your presence and support. Please share your pledge below.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Your Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.contributor_name}
              onChange={(e) => setFormData({ ...formData, contributor_name: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter your full name"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Phone Number
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter your phone number"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter your email"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Pledge Amount ({weddingInfo?.currency}) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              required
              min="0"
              step="0.01"
              value={formData.amount_pledged}
              onChange={(e) => setFormData({ ...formData, amount_pledged: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter amount"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Message (Optional)
            </label>
            <textarea
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder="Add a personal message"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Submitting...' : 'Submit Pledge'}
          </button>
        </form>
      </div>
    </div>
  );
}

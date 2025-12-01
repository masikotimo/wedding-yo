import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { X, Copy, Check, Link2, QrCode, Share2 } from 'lucide-react';

interface ShareLinkModalProps {
  weddingId: string;
  onClose: () => void;
}

export default function ShareLinkModal({ weddingId, onClose }: ShareLinkModalProps) {
  const [loading, setLoading] = useState(true);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isActive, setIsActive] = useState(true);
  const [copied, setCopied] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadOrCreateAccessToken();
  }, [weddingId]);

  const loadOrCreateAccessToken = async () => {
    try {
      setError(null);
      
      // First, try to get existing token
      const { data: existing, error: selectError } = await supabase
        .from('weddings_public')
        .select('access_token, is_active')
        .eq('wedding_id', weddingId)
        .maybeSingle();

      if (selectError) {
        console.error('Error fetching access token:', selectError);
        setError('Failed to load share link. Please try again.');
        setLoading(false);
        return;
      }

      if (existing && existing.access_token) {
        setAccessToken(existing.access_token);
        setIsActive(existing.is_active);
        setShareUrl(`${window.location.origin}/pledge?token=${existing.access_token}`);
        setLoading(false);
        return;
      }

      // If no existing token, create a new one
      const { data: newToken, error: insertError } = await supabase
        .from('weddings_public')
        .insert({ wedding_id: weddingId, is_active: true })
        .select('access_token, is_active')
        .single();

      if (insertError) {
        console.error('Error creating access token:', insertError);
        setError('Failed to create share link. Please try again.');
        setLoading(false);
        return;
      }

      if (newToken && newToken.access_token) {
        setAccessToken(newToken.access_token);
        setIsActive(newToken.is_active);
        setShareUrl(`${window.location.origin}/pledge?token=${newToken.access_token}`);
      } else {
        setError('Failed to generate share link. Please try again.');
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async () => {
    if (!accessToken) {
      setError('Access token not available. Please try refreshing.');
      return;
    }

    const newActiveState = !isActive;

    const { error: updateError } = await supabase
      .from('weddings_public')
      .update({ is_active: newActiveState })
      .eq('access_token', accessToken);

    if (updateError) {
      console.error('Error updating access token:', updateError);
      setError('Failed to update link status. Please try again.');
      return;
    }

    setIsActive(newActiveState);
  };

  const handleCopyLink = async () => {
    if (!shareUrl) {
      setError('Share link is not available. Please try refreshing.');
      return;
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
      setError('Failed to copy link. Please try again.');
    }
  };

  const handleGenerateQR = () => {
    if (!shareUrl) return;

    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(shareUrl)}`;
    window.open(qrUrl, '_blank');
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl p-8 max-w-md w-full">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-xl">
          <div className="flex items-center space-x-3">
            <Share2 className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-900">Share Pledge Link</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              Share this link with guests so they can submit their pledges online. You can enable or disable this link anytime.
            </p>
          </div>

          <div>
            <label className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-gray-700">Public Link Status</span>
              <button
                onClick={handleToggleActive}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  isActive ? 'bg-green-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    isActive ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </label>
            <p className="text-xs text-gray-500">
              {isActive ? 'Link is active and accepting pledges' : 'Link is disabled'}
            </p>
          </div>

          {isActive && (
            <>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Shareable Link
                </label>
                {shareUrl ? (
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 text-sm text-gray-700 font-mono overflow-x-auto">
                      {shareUrl}
                    </div>
                    <button
                      onClick={handleCopyLink}
                      className="flex items-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      {copied ? (
                        <>
                          <Check className="w-4 h-4 mr-2" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4 mr-2" />
                          Copy
                        </>
                      )}
                    </button>
                  </div>
                ) : (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-sm text-yellow-800">
                      Share link is being generated. Please wait...
                    </p>
                  </div>
                )}
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={handleGenerateQR}
                  disabled={!shareUrl}
                  className="flex-1 flex items-center justify-center px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <QrCode className="w-5 h-5 mr-2" />
                  Generate QR Code
                </button>
                <button
                  onClick={handleCopyLink}
                  disabled={!shareUrl}
                  className="flex-1 flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Link2 className="w-5 h-5 mr-2" />
                  Copy Link
                </button>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <h3 className="text-sm font-semibold text-gray-900">How to use:</h3>
                <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                  <li>Copy the link and share it via email, WhatsApp, or social media</li>
                  <li>Generate a QR code to print on invitations or display at events</li>
                  <li>Guests can submit their pledges directly through this link</li>
                  <li>All submissions will appear in your pledge management dashboard</li>
                </ul>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

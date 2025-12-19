import { X, Copy, Check } from 'lucide-react';
import { useState } from 'react';

interface Pledge {
  id: string;
  contributor_name: string;
  amount_pledged: number;
  amount_paid: number | null;
  balance: number | null;
  status: string;
}

interface WeddingInfo {
  bride_name: string;
  groom_name: string;
  wedding_date: string;
}

interface WhatsAppMessageModalProps {
  pledges: Pledge[];
  currency: string;
  weddingInfo: WeddingInfo;
  onClose: () => void;
}

export default function WhatsAppMessageModal({ pledges, weddingInfo, onClose }: WhatsAppMessageModalProps) {
  const [copied, setCopied] = useState(false);

  // Format number with commas but no currency symbol (for WhatsApp)
  const formatNumber = (amount: number | null | undefined): string => {
    const num = amount ?? 0;
    return num.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  };

  // Format date as "21st February 2026"
  const formatWeddingDate = (dateString: string): string => {
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.toLocaleDateString('en-US', { month: 'long' });
    const year = date.getFullYear();
    
    // Add ordinal suffix (st, nd, rd, th)
    const getOrdinalSuffix = (day: number): string => {
      if (day > 3 && day < 21) return 'th';
      switch (day % 10) {
        case 1: return 'st';
        case 2: return 'nd';
        case 3: return 'rd';
        default: return 'th';
      }
    };
    
    return `${day}${getOrdinalSuffix(day)} ${month} ${year}`;
  };

  const generateWhatsAppMessage = () => {
    // Format wedding date
    const formattedDate = formatWeddingDate(weddingInfo.wedding_date);
    
    // Check if this is Tim & TODZA wedding (case-insensitive)
    const isTimAndTodza = 
      weddingInfo.groom_name.toLowerCase().trim() === 'tim' && 
      weddingInfo.bride_name.toLowerCase().trim() === 'todza';
    
    // Build header text
    let header = `✨ Love-Filled Support Towards the Wedding of ${weddingInfo.groom_name} & ${weddingInfo.bride_name} – ${formattedDate} ✨\n\nWe extend our heartfelt gratitude to everyone who has shown their love and support toward this beautiful union. Your kindness means the world to us.\n\n`;
    
    // Add payment/meeting info only for Tim & TODZA
    if (isTimAndTodza) {
      header += `For anyone who would like to send in their support or pledge, you may use the details below:\n\nTel: 0777 127 289\n\nStanbic Bank: 9030015097212\n(All in the names of TIMOTHY MASIKO)\n\nOur next meeting will be held on 19th December.\n\n`;
    }
    
    header += `Below is the updated list of pledges received:\n\n`;

    if (pledges.length === 0) {
      return header + 'No pledges to display.';
    }

    const formattedPledges = pledges.map((pledge, index) => {
      const name = pledge.contributor_name;
      const amountPledged = formatNumber(pledge.amount_pledged);
      const amountPaid = pledge.amount_paid ?? 0;
      const balance = pledge.balance ?? 0;
      
      // Check if fully paid (balance is 0 or very close to 0, or status is fulfilled)
      const isFullyPaid = balance <= 0.01 || pledge.status === 'fulfilled';
      
      if (isFullyPaid) {
        return `${index + 1}. ${name} ${amountPledged} ✅`;
      } else {
        // Only include "paid" and "balance" if they have actually paid something
        if (amountPaid > 0.01) {
          const formattedPaid = formatNumber(amountPaid);
          const formattedBalance = formatNumber(balance);
          return `${index + 1}. ${name} ${amountPledged} 🅿️ paid ${formattedPaid} balance ${formattedBalance}`;
        } else {
          // Nothing paid yet - just show the pledge
          return `${index + 1}. ${name} ${amountPledged} 🅿️`;
        }
      }
    });

    return header + formattedPledges.join('\n');
  };

  const message = generateWhatsAppMessage();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">WhatsApp Message</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-gray-700">Pledge Update</p>
              <button
                onClick={handleCopy}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-2" />
                    Copy
                  </>
                )}
              </button>
            </div>
            <textarea
              readOnly
              value={message}
              className="w-full h-80 px-4 py-3 border border-gray-300 rounded-lg bg-white font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-green-500"
              onClick={(e) => (e.target as HTMLTextAreaElement).select()}
            />
          </div>

          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <p className="text-sm text-blue-800">
              <strong>Tip:</strong> Click the text area to select all, or use the Copy button. 
              Then paste it into your WhatsApp channel.
            </p>
          </div>

          <div className="flex items-center justify-end pt-4 border-t">
            <button
              onClick={onClose}
              className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


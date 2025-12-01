import { X, Upload, AlertCircle, CheckCircle } from 'lucide-react';
import { useState } from 'react';
import { supabase } from '../../lib/supabase';

interface ParsedPledge {
  name: string;
  amountPledged: number;
  amountPaid: number;
  balance: number;
  status: 'fulfilled' | 'partial' | 'pending';
  lineNumber: number;
  originalText: string;
}

interface WhatsAppImportModalProps {
  weddingId: string;
  existingPledges: Array<{ id: string; contributor_name: string; amount_pledged: number; amount_paid: number | null; balance: number | null }>;
  onClose: () => void;
  onImport: () => void;
}

export default function WhatsAppImportModal({ weddingId, existingPledges, onClose, onImport }: WhatsAppImportModalProps) {
  const [messageText, setMessageText] = useState('');
  const [parsedPledges, setParsedPledges] = useState<ParsedPledge[]>([]);
  const [importing, setImporting] = useState(false);
  const [importResults, setImportResults] = useState<{ created: number; updated: number; errors: string[] } | null>(null);

  // Parse WhatsApp message text
  const parseMessage = (text: string): ParsedPledge[] => {
    const lines = text.split('\n').filter(line => line.trim());
    const pledges: ParsedPledge[] = [];

    lines.forEach((line, index) => {
      const trimmedLine = line.trim();
      
      // Skip header lines (lines that don't start with a number)
      if (!/^\d+\./.test(trimmedLine)) {
        return;
      }

      try {
        // Remove leading number and dot
        const content = trimmedLine.replace(/^\d+\.\s*/, '').trim();
        
        // Extract name and amount
        // Pattern: Name Amount [✅|🅿️] [paid X balance Y]
        // Handle cases like "500,000🅿️" (emoji attached) or "500,000 🅿️" (with space)
        // Also handle "200k" format and negative amounts
        // Make space before emoji optional to handle both cases
        const match = content.match(/^(.+?)\s+(-?[\d,]+(?:k|K)?)\s*(✅|🅿️)?/);
        
        // If no match with space, try without space (emoji attached)
        const finalMatch = match || content.match(/^(.+?)\s+(-?[\d,]+(?:k|K)?)(✅|🅿️)/);
        
        if (!finalMatch) return;

        const name = finalMatch[1].trim();
        let amountStr = finalMatch[2].replace(/,/g, '').toLowerCase();
        const emoji = finalMatch[3] || (content.includes('✅') ? '✅' : content.includes('🅿️') ? '🅿️' : null);
        
        // Check for fulfilled status (✅)
        const isFulfilled = emoji === '✅' || content.includes('✅');
        
        // Handle "k" suffix (e.g., 200k = 200,000)
        if (amountStr.endsWith('k')) {
          amountStr = (parseFloat(amountStr.replace('k', '')) * 1000).toString();
        }
        
        const amountPledged = Math.abs(parseFloat(amountStr));

        if (isNaN(amountPledged) || amountPledged <= 0) return;

        let amountPaid = 0;
        let balance = amountPledged;
        let status: 'fulfilled' | 'partial' | 'pending' = 'pending';

        // Check if fulfilled
        if (isFulfilled) {
          amountPaid = amountPledged;
          balance = 0;
          status = 'fulfilled';
        } else {
          // Check for payment details: "paid X balance Y"
          const paidMatch = content.match(/paid\s+([\d,]+(?:k|K)?)/i);
          const balanceMatch = content.match(/balance\s+([\d,]+(?:k|K)?)/i);

          if (paidMatch) {
            let paidStr = paidMatch[1].replace(/,/g, '').toLowerCase();
            if (paidStr.endsWith('k')) {
              paidStr = (parseFloat(paidStr.replace('k', '')) * 1000).toString();
            }
            amountPaid = parseFloat(paidStr);
          }

          if (balanceMatch) {
            let balStr = balanceMatch[1].replace(/,/g, '').toLowerCase();
            if (balStr.endsWith('k')) {
              balStr = (parseFloat(balStr.replace('k', '')) * 1000).toString();
            }
            balance = parseFloat(balStr);
          } else if (amountPaid > 0) {
            balance = amountPledged - amountPaid;
          }

          if (amountPaid >= amountPledged) {
            status = 'fulfilled';
            balance = 0;
          } else if (amountPaid > 0) {
            status = 'partial';
          }
        }

        pledges.push({
          name,
          amountPledged,
          amountPaid,
          balance,
          status,
          lineNumber: index + 1,
          originalText: trimmedLine,
        });
      } catch (error) {
        console.error(`Error parsing line ${index + 1}:`, error);
      }
    });

    return pledges;
  };

  const handleParse = () => {
    if (!messageText.trim()) {
      alert('Please paste a WhatsApp message');
      return;
    }

    const parsed = parseMessage(messageText);
    setParsedPledges(parsed);
  };

  // Find matching pledge by name (case-insensitive, handle variations)
  const findMatchingPledge = (name: string) => {
    const normalizedName = name.toLowerCase().trim();
    
    return existingPledges.find(pledge => {
      const pledgeName = pledge.contributor_name.toLowerCase().trim();
      
      // Exact match
      if (pledgeName === normalizedName) return true;
      
      // Check if one name contains the other (for variations)
      if (pledgeName.includes(normalizedName) || normalizedName.includes(pledgeName)) {
        // Additional check: if the difference is just common prefixes/suffixes
        const commonPrefixes = ['mr', 'mrs', 'dr', 'prof', 'counsel', 'uncle', 'family of', 'family'];
        const nameWithoutPrefix = normalizedName.replace(new RegExp(`^(${commonPrefixes.join('|')})\\s+`, 'i'), '');
        const pledgeWithoutPrefix = pledgeName.replace(new RegExp(`^(${commonPrefixes.join('|')})\\s+`, 'i'), '');
        
        if (nameWithoutPrefix === pledgeWithoutPrefix) return true;
        if (pledgeName.includes(nameWithoutPrefix) || normalizedName.includes(pledgeWithoutPrefix)) return true;
      }
      
      return false;
    });
  };

  const handleImport = async () => {
    if (parsedPledges.length === 0) {
      alert('No pledges to import. Please parse the message first.');
      return;
    }

    setImporting(true);
    setImportResults(null);

    const results = {
      created: 0,
      updated: 0,
      errors: [] as string[],
    };

    // Default fulfillment date: December 30th of current year
    const currentYear = new Date().getFullYear();
    const defaultFulfillmentDate = `${currentYear}-12-30`;

    try {
      for (const parsedPledge of parsedPledges) {
        try {
          const matchingPledge = findMatchingPledge(parsedPledge.name);

          if (matchingPledge) {
            // Update existing pledge
            const currentPaid = matchingPledge.amount_paid || 0;
            const newPaid = Math.max(currentPaid, parsedPledge.amountPaid); // Use the higher amount
            const paymentDifference = newPaid - currentPaid; // Amount to add to cash transactions
            
            const newBalance = parsedPledge.amountPledged - newPaid;
            const newStatus = newPaid >= parsedPledge.amountPledged ? 'fulfilled' : (newPaid > 0 ? 'partial' : 'pending');

            const { data: updatedPledge } = await supabase
              .from('pledges')
              .update({
                amount_pledged: parsedPledge.amountPledged,
                amount_paid: newPaid,
                balance: newBalance,
                status: newStatus,
                pledge_fulfillment_date: defaultFulfillmentDate,
              })
              .eq('id', matchingPledge.id)
              .select()
              .single();

            // Create cash transaction if there's a payment difference
            if (paymentDifference > 0 && updatedPledge) {
              await supabase.from('cash_transactions').insert({
                wedding_id: weddingId,
                transaction_date: defaultFulfillmentDate,
                amount: paymentDifference,
                source_type: 'pledge',
                source_reference_id: updatedPledge.id,
                contributor_name: parsedPledge.name,
                notes: 'Pledge payment - Imported from WhatsApp message',
              });
            }

            results.updated++;
          } else {
            // Create new pledge
            const { data: newPledge } = await supabase
              .from('pledges')
              .insert({
                wedding_id: weddingId,
                contributor_name: parsedPledge.name,
                amount_pledged: parsedPledge.amountPledged,
                amount_paid: parsedPledge.amountPaid,
                balance: parsedPledge.balance,
                status: parsedPledge.status,
                pledge_fulfillment_date: defaultFulfillmentDate,
                phone: null,
                email: null,
                payment_method: null,
                notes: 'Imported from WhatsApp message',
              })
              .select()
              .single();

            // Create cash transaction if there's a payment
            if (parsedPledge.amountPaid > 0 && newPledge) {
              await supabase.from('cash_transactions').insert({
                wedding_id: weddingId,
                transaction_date: defaultFulfillmentDate,
                amount: parsedPledge.amountPaid,
                source_type: 'pledge',
                source_reference_id: newPledge.id,
                contributor_name: parsedPledge.name,
                notes: 'Initial pledge payment - Imported from WhatsApp message',
              });
            }

            results.created++;
          }
        } catch (error: any) {
          results.errors.push(`${parsedPledge.name}: ${error.message || 'Unknown error'}`);
        }
      }

      setImportResults(results);
      
      if (results.errors.length === 0) {
        // Auto-close after 2 seconds if successful
        setTimeout(() => {
          onImport();
          onClose();
        }, 2000);
      }
    } catch (error: any) {
      results.errors.push(`Import failed: ${error.message || 'Unknown error'}`);
      setImportResults(results);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Upload className="w-6 h-6 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-900">Import from WhatsApp</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>Instructions:</strong> Paste your WhatsApp message here. The system will automatically parse contributor names, amounts, and payment status. 
              If a name already exists, the pledge will be updated. New names will be added as new pledges.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Paste WhatsApp Message
            </label>
            <textarea
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="Paste your WhatsApp message here..."
              className="w-full h-64 px-4 py-3 border border-gray-300 rounded-lg font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex items-center justify-end mt-2">
              <button
                onClick={handleParse}
                disabled={!messageText.trim()}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Parse Message
              </button>
            </div>
          </div>

          {parsedPledges.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Parsed Pledges ({parsedPledges.length})
                </h3>
                <button
                  onClick={handleImport}
                  disabled={importing}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {importing ? 'Importing...' : 'Import Pledges'}
                </button>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
                <div className="space-y-2">
                  {parsedPledges.map((pledge, index) => {
                    const matching = findMatchingPledge(pledge.name);
                    return (
                      <div
                        key={index}
                        className={`p-3 rounded-lg border ${
                          matching
                            ? 'bg-yellow-50 border-yellow-200'
                            : 'bg-white border-gray-200'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <span className="font-medium text-gray-900">{pledge.name}</span>
                              {matching && (
                                <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                                  Will Update
                                </span>
                              )}
                              {!matching && (
                                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                                  New
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-gray-600 mt-1">
                              Pledged: {pledge.amountPledged.toLocaleString()}
                              {pledge.amountPaid > 0 && (
                                <> • Paid: {pledge.amountPaid.toLocaleString()}</>
                              )}
                              {pledge.balance > 0 && (
                                <> • Balance: {pledge.balance.toLocaleString()}</>
                              )}
                              <span className="ml-2 text-xs">
                                ({pledge.status})
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {importResults && (
            <div className={`rounded-lg p-4 border ${
              importResults.errors.length > 0
                ? 'bg-red-50 border-red-200'
                : 'bg-green-50 border-green-200'
            }`}>
              <div className="flex items-start space-x-3">
                {importResults.errors.length > 0 ? (
                  <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                ) : (
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                )}
                <div className="flex-1">
                  <h4 className={`font-semibold mb-2 ${
                    importResults.errors.length > 0 ? 'text-red-800' : 'text-green-800'
                  }`}>
                    Import {importResults.errors.length > 0 ? 'Completed with Errors' : 'Successful'}
                  </h4>
                  <ul className="text-sm space-y-1">
                    <li className={importResults.errors.length > 0 ? 'text-red-700' : 'text-green-700'}>
                      Created: {importResults.created} pledge(s)
                    </li>
                    <li className={importResults.errors.length > 0 ? 'text-red-700' : 'text-green-700'}>
                      Updated: {importResults.updated} pledge(s)
                    </li>
                    {importResults.errors.length > 0 && (
                      <li className="text-red-700 mt-2">
                        <strong>Errors:</strong>
                        <ul className="list-disc list-inside mt-1">
                          {importResults.errors.map((error, idx) => (
                            <li key={idx}>{error}</li>
                          ))}
                        </ul>
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}


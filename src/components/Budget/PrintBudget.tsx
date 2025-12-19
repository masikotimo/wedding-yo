import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { formatCurrency } from '../../lib/currency';
import { Printer } from 'lucide-react';

interface Wedding {
  bride_name: string;
  groom_name: string;
  wedding_date: string;
  currency: string;
}

interface BudgetSection {
  id: string;
  name: string;
  display_order: number;
}

interface BudgetItem {
  id: string;
  section_id: string;
  item_name: string;
  quantity: number;
  unit_cost: number;
  amount: number;
  paid: number;
  balance: number;
}

export default function PrintBudget() {
  const { user } = useAuth();
  const [wedding, setWedding] = useState<Wedding | null>(null);
  const [sections, setSections] = useState<BudgetSection[]>([]);
  const [items, setItems] = useState<BudgetItem[]>([]);
  const [loading, setLoading] = useState(true);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;

    const { data: weddingData } = await supabase
      .from('weddings')
      .select('bride_name, groom_name, wedding_date, currency')
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle();

    if (!weddingData) {
      setLoading(false);
      return;
    }

    setWedding(weddingData);

    const { data: weddingIdData } = await supabase
      .from('weddings')
      .select('id')
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle();

    if (!weddingIdData) return;

    const weddingId = weddingIdData.id;

    const [sectionsResult, itemsResult] = await Promise.all([
      supabase.from('budget_sections').select('*').eq('wedding_id', weddingId).order('display_order'),
      supabase.from('budget_items').select('*').eq('wedding_id', weddingId).order('created_at'),
    ]);

    if (sectionsResult.data) setSections(sectionsResult.data);
    if (itemsResult.data) setItems(itemsResult.data);
    setLoading(false);
  };

  const formatAmount = (amount: number) => {
    return formatCurrency(amount, wedding?.currency || 'USD');
  };

  const getTotals = () => {
    const total = items.reduce((sum, item) => sum + Number(item.amount), 0);
    const paid = items.reduce((sum, item) => sum + Number(item.paid), 0);
    const balance = items.reduce((sum, item) => sum + Number(item.balance), 0);
    return { total, paid, balance };
  };

  const handlePrint = () => {
    window.print();
  };

  const totals = getTotals();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between print:hidden">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Print Budget</h2>
          <p className="text-gray-600 mt-2">Preview and print your budget</p>
        </div>
        <button
          onClick={handlePrint}
          className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Printer className="w-5 h-5 mr-2" />
          Print / Save as PDF
        </button>
      </div>

      <div ref={printRef} id="print-budget-content" className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 print:shadow-none print:border-0">
        <div className="text-center mb-8 border-b-2 border-gray-900 pb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">WEDDING BUDGET</h1>
          {wedding && (
            <>
              <p className="text-xl font-semibold text-gray-800">
                {wedding.bride_name} & {wedding.groom_name}
              </p>
              <p className="text-gray-600 mt-1">
                {new Date(wedding.wedding_date).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </>
          )}
        </div>

        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b-2 border-gray-900">
              <th className="text-left py-3 px-2 font-bold text-sm uppercase">Classification</th>
              <th className="text-left py-3 px-2 font-bold text-sm uppercase">Item</th>
              <th className="text-center py-3 px-2 font-bold text-sm uppercase">Qty</th>
              <th className="text-right py-3 px-2 font-bold text-sm uppercase">Unit Cost</th>
              <th className="text-right py-3 px-2 font-bold text-sm uppercase">Amount</th>
              <th className="text-right py-3 px-2 font-bold text-sm uppercase">Paid</th>
              <th className="text-right py-3 px-2 font-bold text-sm uppercase">Balance</th>
            </tr>
          </thead>
          <tbody>
            {sections.map((section) => {
              const sectionItems = items.filter(item => item.section_id === section.id);
              if (sectionItems.length === 0) return null;

              const sectionTotal = sectionItems.reduce((sum, item) => sum + Number(item.amount), 0);
              const sectionPaid = sectionItems.reduce((sum, item) => sum + Number(item.paid), 0);
              const sectionBalance = sectionItems.reduce((sum, item) => sum + Number(item.balance), 0);

              return (
                <React.Fragment key={section.id}>
                  <tr className="border-t border-gray-300">
                    <td colSpan={7} className="py-3 px-2 font-bold text-gray-900 bg-gray-50">
                      {section.name.toUpperCase()}
                    </td>
                  </tr>
                  {sectionItems.map((item, index) => (
                    <tr key={item.id} className={index % 2 === 0 ? '' : 'bg-gray-50'}>
                      <td className="py-2 px-2"></td>
                      <td className="py-2 px-2 text-gray-900">{item.item_name}</td>
                      <td className="py-2 px-2 text-center text-gray-700">{item.quantity}</td>
                      <td className="py-2 px-2 text-right text-gray-700">
                        {formatAmount(item.unit_cost)}
                      </td>
                      <td className="py-2 px-2 text-right font-semibold text-gray-900">
                        {formatAmount(item.amount)}
                      </td>
                      <td className="py-2 px-2 text-right text-green-700">
                        {formatAmount(item.paid)}
                      </td>
                      <td className="py-2 px-2 text-right text-orange-700">
                        {formatAmount(item.balance)}
                      </td>
                    </tr>
                  ))}
                  <tr className="border-b border-gray-200">
                    <td colSpan={4} className="py-2 px-2 text-right font-semibold text-gray-700">
                      Section Total:
                    </td>
                    <td className="py-2 px-2 text-right font-bold text-gray-900">
                      {formatAmount(sectionTotal)}
                    </td>
                    <td className="py-2 px-2 text-right font-bold text-green-700">
                      {formatAmount(sectionPaid)}
                    </td>
                    <td className="py-2 px-2 text-right font-bold text-orange-700">
                      {formatAmount(sectionBalance)}
                    </td>
                  </tr>
                </React.Fragment>
              );
            })}

            <tr className="border-t-2 border-gray-900">
              <td colSpan={4} className="py-4 px-2 text-right font-bold text-lg text-gray-900">
                GRAND TOTAL:
              </td>
              <td className="py-4 px-2 text-right font-bold text-xl text-gray-900">
                {formatAmount(totals.total)}
              </td>
              <td className="py-4 px-2 text-right font-bold text-xl text-green-700">
                {formatAmount(totals.paid)}
              </td>
              <td className="py-4 px-2 text-right font-bold text-xl text-orange-700">
                {formatAmount(totals.balance)}
              </td>
            </tr>
          </tbody>
        </table>

        {items.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No budget items to display. Add items in the Budget Management section.
          </div>
        )}

        <div className="mt-8 pt-6 border-t border-gray-300 text-sm text-gray-600 text-center">
          <p>Generated on {new Date().toLocaleDateString()}</p>
        </div>
      </div>

      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #print-budget-content,
          #print-budget-content * {
            visibility: visible;
          }
          #print-budget-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: white;
          }
          .print\\:hidden {
            display: none !important;
          }
          @page {
            margin: 1cm;
            size: A4;
          }
          body {
            margin: 0;
            padding: 0;
          }
          table {
            page-break-inside: auto;
          }
          tr {
            page-break-inside: avoid;
            page-break-after: auto;
          }
          thead {
            display: table-header-group;
          }
          tfoot {
            display: table-footer-group;
          }
        }
      `}</style>
    </div>
  );
}

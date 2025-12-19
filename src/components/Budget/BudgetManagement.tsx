import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { formatCurrency as formatCurrencyUtil } from '../../lib/currency';
import { Plus, Edit2, Trash2, Users, FolderOpen, Download, Upload, X } from 'lucide-react';
import BudgetItemModal from './BudgetItemModal';
import CategoryModal from './CategoryModal';

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
  status: string;
  is_guest_dependent: boolean;
  guest_multiplier: number;
  notes: string | null;
}

export default function BudgetManagement() {
  const { user } = useAuth();
  const [weddingId, setWeddingId] = useState<string | null>(null);
  const [expectedGuests, setExpectedGuests] = useState(0);
  const [currency, setCurrency] = useState('USD');
  const [sections, setSections] = useState<BudgetSection[]>([]);
  const [items, setItems] = useState<BudgetItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<BudgetItem | null>(null);
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importData, setImportData] = useState<any>(null);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  useEffect(() => {
    loadWeddingAndBudget();
  }, [user]);

  const loadWeddingAndBudget = async () => {
    if (!user) return;

    const { data: wedding } = await supabase
      .from('weddings')
      .select('id, expected_guests, currency')
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle();

    if (!wedding) {
      setLoading(false);
      return;
    }

    setWeddingId(wedding.id);
    setExpectedGuests(wedding.expected_guests);
    setCurrency(wedding.currency || 'USD');

    await initializeDefaultSections(wedding.id);
    await loadBudgetItems(wedding.id);

    setLoading(false);
  };

  const initializeDefaultSections = async (weddingId: string) => {
    const defaultSections = [
      'Church & Ceremony',
      'Groom & Bridal Items',
      'Decorations & Venue',
      'Food & Drinks',
      'Entertainment',
      'Media & Transport',
      'Miscellaneous',
      'Launch Event',
    ];

    const { data: existingSections } = await supabase
      .from('budget_sections')
      .select('*')
      .eq('wedding_id', weddingId)
      .order('display_order');

    if (existingSections && existingSections.length === 0) {
      const sectionsToInsert = defaultSections.map((name, index) => ({
        wedding_id: weddingId,
        name,
        display_order: index,
      }));

      await supabase.from('budget_sections').insert(sectionsToInsert);
    }

    const { data } = await supabase
      .from('budget_sections')
      .select('*')
      .eq('wedding_id', weddingId)
      .order('display_order');

    if (data) setSections(data);
  };

  const loadBudgetItems = async (weddingId: string) => {
    const { data } = await supabase
      .from('budget_items')
      .select('*')
      .eq('wedding_id', weddingId)
      .order('created_at');

    if (data) setItems(data);
  };

  const handleGuestCountChange = async (newCount: number) => {
    if (!weddingId) return;

    await supabase
      .from('weddings')
      .update({ expected_guests: newCount })
      .eq('id', weddingId);

    setExpectedGuests(newCount);

    const guestDependentItems = items.filter(item => item.is_guest_dependent);

    for (const item of guestDependentItems) {
      const newQuantity = newCount * item.guest_multiplier;
      const newAmount = newQuantity * item.unit_cost;
      const newBalance = newAmount - item.paid;

      await supabase
        .from('budget_items')
        .update({
          quantity: newQuantity,
          amount: newAmount,
          balance: newBalance,
        })
        .eq('id', item.id);
    }

    await loadBudgetItems(weddingId);
  };

  const handleAddItem = (sectionId: string) => {
    setSelectedSection(sectionId);
    setEditingItem(null);
    setModalOpen(true);
  };

  const handleEditItem = (item: BudgetItem) => {
    setEditingItem(item);
    setSelectedSection(item.section_id);
    setModalOpen(true);
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;

    await supabase.from('budget_items').delete().eq('id', itemId);
    await loadBudgetItems(weddingId!);
  };

  const handleSaveItem = async () => {
    if (weddingId) {
      await loadBudgetItems(weddingId);
    }
    setModalOpen(false);
    setEditingItem(null);
    setSelectedSection(null);
  };

  const getSectionTotal = (sectionId: string) => {
    return items
      .filter(item => item.section_id === sectionId)
      .reduce((sum, item) => sum + Number(item.amount), 0);
  };

  const getSectionPaid = (sectionId: string) => {
    return items
      .filter(item => item.section_id === sectionId)
      .reduce((sum, item) => sum + Number(item.paid), 0);
  };

  const getSectionBalance = (sectionId: string) => {
    return items
      .filter(item => item.section_id === sectionId)
      .reduce((sum, item) => sum + Number(item.balance), 0);
  };

  const formatCurrency = (amount: number) => {
    return formatCurrencyUtil(amount, currency);
  };

  const getOverallTotals = () => {
    const total = items.reduce((sum, item) => sum + Number(item.amount), 0);
    const paid = items.reduce((sum, item) => sum + Number(item.paid), 0);
    const balance = items.reduce((sum, item) => sum + Number(item.balance), 0);
    const coverage = total > 0 ? (paid / total) * 100 : 0;

    return { total, paid, balance, coverage };
  };

  const totals = getOverallTotals();

  const handleExportBudget = () => {
    if (!weddingId || sections.length === 0) {
      alert('No budget data to export');
      return;
    }

    // Create export data structure
    const exportData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      sections: sections.map(section => ({
        name: section.name,
        display_order: section.display_order,
      })),
      items: items.map(item => {
        const section = sections.find(s => s.id === item.section_id);
        return {
          section_name: section?.name || '',
          item_name: item.item_name,
          quantity: item.quantity,
          unit_cost: item.unit_cost,
          paid: item.paid,
          is_guest_dependent: item.is_guest_dependent,
          guest_multiplier: item.guest_multiplier,
          status: item.status,
          notes: item.notes,
        };
      }),
    };

    // Create and download JSON file
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `wedding-budget-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImportFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content);

        // Validate import data structure
        if (!data.sections || !Array.isArray(data.sections)) {
          setImportError('Invalid file format: missing sections');
          return;
        }

        if (!data.items || !Array.isArray(data.items)) {
          setImportError('Invalid file format: missing items');
          return;
        }

        setImportData(data);
        setImportModalOpen(true);
        setImportError(null);
      } catch (error) {
        setImportError('Failed to parse JSON file. Please check the file format.');
        console.error('Import error:', error);
      }
    };

    reader.onerror = () => {
      setImportError('Failed to read file');
    };

    reader.readAsText(file);
    // Reset input
    event.target.value = '';
  };

  const handleImportBudget = async () => {
    if (!weddingId || !importData) return;

    setImporting(true);
    setImportError(null);

    try {
      // Create a map of section names to IDs (existing or new)
      const sectionMap = new Map<string, string>();
      const maxDisplayOrder = sections.length > 0 
        ? Math.max(...sections.map(s => s.display_order)) 
        : -1;

      // Process sections
      for (let i = 0; i < importData.sections.length; i++) {
        const sectionData = importData.sections[i];
        const existingSection = sections.find(s => s.name === sectionData.name);

        if (existingSection) {
          sectionMap.set(sectionData.name, existingSection.id);
        } else {
          // Create new section
          const { data: newSection, error } = await supabase
            .from('budget_sections')
            .insert({
              wedding_id: weddingId,
              name: sectionData.name,
              display_order: maxDisplayOrder + 1 + i,
              is_custom: true,
            })
            .select()
            .single();

          if (error) {
            throw new Error(`Failed to create section "${sectionData.name}": ${error.message}`);
          }

          if (newSection) {
            sectionMap.set(sectionData.name, newSection.id);
          }
        }
      }

      // Process items
      const itemsToInsert = [];
      for (const itemData of importData.items) {
        const sectionId = sectionMap.get(itemData.section_name);
        if (!sectionId) {
          console.warn(`Skipping item "${itemData.item_name}" - section "${itemData.section_name}" not found`);
          continue;
        }

        // Calculate quantity based on guest dependency
        const quantity = itemData.is_guest_dependent
          ? expectedGuests * (itemData.guest_multiplier || 1)
          : itemData.quantity;

        const amount = quantity * itemData.unit_cost;
        const paid = itemData.paid || 0;
        const balance = amount - paid;

        let status = 'pending';
        if (paid >= amount) status = 'covered';
        else if (paid > 0) status = 'partial';

        itemsToInsert.push({
          wedding_id: weddingId,
          section_id: sectionId,
          item_name: itemData.item_name,
          quantity,
          unit_cost: itemData.unit_cost,
          amount,
          paid,
          balance,
          status,
          is_guest_dependent: itemData.is_guest_dependent || false,
          guest_multiplier: itemData.guest_multiplier || 0,
          notes: itemData.notes || null,
        });
      }

      // Insert items in batches
      if (itemsToInsert.length > 0) {
        const { error: insertError } = await supabase
          .from('budget_items')
          .insert(itemsToInsert);

        if (insertError) {
          throw new Error(`Failed to import items: ${insertError.message}`);
        }
      }

      // Reload data
      await initializeDefaultSections(weddingId);
      await loadBudgetItems(weddingId);

      setImportModalOpen(false);
      setImportData(null);
      alert(`Successfully imported ${itemsToInsert.length} items and ${importData.sections.length} sections!`);
    } catch (error: any) {
      setImportError(error.message || 'Failed to import budget data');
      console.error('Import error:', error);
    } finally {
      setImporting(false);
    }
  };

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
          <h2 className="text-3xl font-bold text-gray-900">Budget Management</h2>
          <p className="text-gray-600 mt-2">Manage your wedding budget and expenses</p>
        </div>
        <div className="flex items-center space-x-3">
          <label className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors cursor-pointer">
            <Upload className="w-5 h-5 mr-2" />
            Import Budget
            <input
              type="file"
              accept=".json"
              onChange={handleImportFileSelect}
              className="hidden"
            />
          </label>
          <button
            onClick={handleExportBudget}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Download className="w-5 h-5 mr-2" />
            Export Budget
          </button>
          <button
            onClick={() => setCategoryModalOpen(true)}
            className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            <FolderOpen className="w-5 h-5 mr-2" />
            Manage Categories
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Users className="w-8 h-8 text-blue-600" />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Expected Guests
              </label>
              <input
                type="number"
                min="1"
                value={expectedGuests}
                onChange={(e) => handleGuestCountChange(parseInt(e.target.value) || 0)}
                className="w-32 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Total Budget</p>
            <p className="text-3xl font-bold text-gray-900">{formatCurrency(totals.total)}</p>
            <p className="text-sm text-green-600 mt-1">{totals.coverage.toFixed(1)}% Covered</p>
          </div>
        </div>
      </div>

      {sections.map((section) => {
        const sectionItems = items.filter(item => item.section_id === section.id);
        const sectionTotal = getSectionTotal(section.id);
        const sectionPaid = getSectionPaid(section.id);
        const sectionBalance = getSectionBalance(section.id);
        const sectionCoverage = sectionTotal > 0 ? (sectionPaid / sectionTotal) * 100 : 0;

        return (
          <div key={section.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">{section.name}</h3>
                <button
                  onClick={() => handleAddItem(section.id)}
                  className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Item
                </button>
              </div>
              <div className="flex items-center space-x-6 mt-3 text-sm">
                <div>
                  <span className="text-gray-600">Total: </span>
                  <span className="font-semibold text-gray-900">{formatCurrency(sectionTotal)}</span>
                </div>
                <div>
                  <span className="text-gray-600">Paid: </span>
                  <span className="font-semibold text-green-600">{formatCurrency(sectionPaid)}</span>
                </div>
                <div>
                  <span className="text-gray-600">Balance: </span>
                  <span className="font-semibold text-orange-600">{formatCurrency(sectionBalance)}</span>
                </div>
                <div>
                  <span className="text-gray-600">Coverage: </span>
                  <span className="font-semibold text-blue-600">{sectionCoverage.toFixed(1)}%</span>
                </div>
              </div>
            </div>

            {sectionItems.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Item</th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">QTY</th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Unit Cost</th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Amount</th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Paid</th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Balance</th>
                      <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {sectionItems.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div>
                            <div className="font-medium text-gray-900">{item.item_name}</div>
                            {item.is_guest_dependent && (
                              <div className="flex items-center text-xs text-blue-600 mt-1">
                                <Users className="w-3 h-3 mr-1" />
                                Guest dependent
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right text-gray-900">{item.quantity}</td>
                        <td className="px-6 py-4 text-right text-gray-900">{formatCurrency(item.unit_cost)}</td>
                        <td className="px-6 py-4 text-right font-semibold text-gray-900">{formatCurrency(item.amount)}</td>
                        <td className="px-6 py-4 text-right text-green-600 font-medium">{formatCurrency(item.paid)}</td>
                        <td className="px-6 py-4 text-right text-orange-600 font-medium">{formatCurrency(item.balance)}</td>
                        <td className="px-6 py-4 text-center">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            item.status === 'covered'
                              ? 'bg-green-100 text-green-800'
                              : item.status === 'partial'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {item.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center space-x-2">
                            <button
                              onClick={() => handleEditItem(item)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteItem(item.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="px-6 py-12 text-center text-gray-500">
                No items yet. Click "Add Item" to get started.
              </div>
            )}
          </div>
        );
      })}

      {modalOpen && weddingId && (
        <BudgetItemModal
          weddingId={weddingId}
          sectionId={selectedSection!}
          item={editingItem}
          expectedGuests={expectedGuests}
          onClose={() => {
            setModalOpen(false);
            setEditingItem(null);
            setSelectedSection(null);
          }}
          onSave={handleSaveItem}
        />
      )}

      {categoryModalOpen && weddingId && (
        <CategoryModal
          isOpen={categoryModalOpen}
          onClose={() => setCategoryModalOpen(false)}
          weddingId={weddingId}
          onSave={() => {
            if (weddingId) {
              initializeDefaultSections(weddingId);
            }
          }}
        />
      )}

      {importModalOpen && importData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-xl">
              <div className="flex items-center space-x-3">
                <Upload className="w-6 h-6 text-blue-600" />
                <h2 className="text-xl font-bold text-gray-900">Import Budget</h2>
              </div>
              <button
                onClick={() => {
                  setImportModalOpen(false);
                  setImportData(null);
                  setImportError(null);
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {importError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm text-red-800">{importError}</p>
                </div>
              )}

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  This will import {importData.sections?.length || 0} categories and {importData.items?.length || 0} budget items.
                  Existing categories with the same name will be reused. New categories will be created.
                </p>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Categories to Import:</h3>
                <div className="bg-gray-50 rounded-lg p-4 max-h-40 overflow-y-auto">
                  <ul className="space-y-1">
                    {importData.sections?.map((section: any, index: number) => {
                      const exists = sections.some(s => s.name === section.name);
                      return (
                        <li key={index} className="text-sm text-gray-700 flex items-center">
                          <span className={exists ? 'text-green-600 mr-2' : 'text-blue-600 mr-2'}>
                            {exists ? '✓' : '+'}
                          </span>
                          {section.name}
                          {exists && <span className="text-xs text-gray-500 ml-2">(existing)</span>}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Items to Import:</h3>
                <div className="bg-gray-50 rounded-lg p-4 max-h-60 overflow-y-auto">
                  <div className="space-y-2">
                    {importData.items?.slice(0, 10).map((item: any, index: number) => (
                      <div key={index} className="text-sm text-gray-700">
                        • {item.item_name} <span className="text-gray-500">({item.section_name})</span>
                      </div>
                    ))}
                    {importData.items?.length > 10 && (
                      <div className="text-sm text-gray-500 italic">
                        ... and {importData.items.length - 10} more items
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-4 pt-6 border-t">
                <button
                  onClick={() => {
                    setImportModalOpen(false);
                    setImportData(null);
                    setImportError(null);
                  }}
                  disabled={importing}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleImportBudget}
                  disabled={importing}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
                >
                  {importing ? 'Importing...' : 'Import Budget'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

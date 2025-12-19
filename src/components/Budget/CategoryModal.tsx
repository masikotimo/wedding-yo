import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { X, Plus, Edit2, Trash2, Sparkles } from 'lucide-react';

interface CategoryTemplate {
  id: string;
  name: string;
  description: string | null;
  display_order: number;
}

interface BudgetSection {
  id: string;
  name: string;
  display_order: number;
  is_custom: boolean;
}

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  weddingId: string;
  onSave: () => void;
}

export default function CategoryModal({ isOpen, onClose, weddingId, onSave }: CategoryModalProps) {
  const [templates, setTemplates] = useState<CategoryTemplate[]>([]);
  const [sections, setSections] = useState<BudgetSection[]>([]);
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, weddingId]);

  const loadData = async () => {
    setLoading(true);
    const [templatesResult, sectionsResult] = await Promise.all([
      supabase.from('budget_category_templates').select('*').order('display_order'),
      supabase.from('budget_sections').select('*').eq('wedding_id', weddingId).order('display_order'),
    ]);

    if (templatesResult.data) setTemplates(templatesResult.data);
    if (sectionsResult.data) setSections(sectionsResult.data);
    setLoading(false);
  };

  const handleAddFromTemplate = async (template: CategoryTemplate) => {
    const exists = sections.find(s => s.name === template.name);
    if (exists) {
      alert('This category already exists!');
      return;
    }

    const newSection = {
      wedding_id: weddingId,
      name: template.name,
      display_order: sections.length,
      is_custom: false,
    };

    await supabase.from('budget_sections').insert(newSection);
    await loadData();
  };

  const handleAddCustom = async () => {
    if (!newCategoryName.trim()) return;

    const exists = sections.find(s => s.name === newCategoryName.trim());
    if (exists) {
      alert('This category already exists!');
      return;
    }

    const newSection = {
      wedding_id: weddingId,
      name: newCategoryName.trim(),
      display_order: sections.length,
      is_custom: true,
    };

    await supabase.from('budget_sections').insert(newSection);
    setNewCategoryName('');
    await loadData();
  };

  const handleEdit = (section: BudgetSection) => {
    setEditingSection(section.id);
    setEditName(section.name);
  };

  const handleSaveEdit = async (sectionId: string) => {
    if (!editName.trim()) return;

    await supabase
      .from('budget_sections')
      .update({ name: editName.trim() })
      .eq('id', sectionId);

    setEditingSection(null);
    setEditName('');
    await loadData();
  };

  const handleDelete = async (sectionId: string) => {
    if (!confirm('Are you sure? All budget items in this category will also be deleted.')) return;

    await supabase.from('budget_items').delete().eq('section_id', sectionId);
    await supabase.from('budget_sections').delete().eq('id', sectionId);
    await loadData();
  };

  const handleMoveUp = async (section: BudgetSection, index: number) => {
    if (index === 0) return;

    const aboveSection = sections[index - 1];
    await Promise.all([
      supabase.from('budget_sections').update({ display_order: index }).eq('id', aboveSection.id),
      supabase.from('budget_sections').update({ display_order: index - 1 }).eq('id', section.id),
    ]);

    await loadData();
  };

  const handleMoveDown = async (section: BudgetSection, index: number) => {
    if (index === sections.length - 1) return;

    const belowSection = sections[index + 1];
    await Promise.all([
      supabase.from('budget_sections').update({ display_order: index }).eq('id', belowSection.id),
      supabase.from('budget_sections').update({ display_order: index + 1 }).eq('id', section.id),
    ]);

    await loadData();
  };

  const handleClose = () => {
    onSave();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Manage Budget Categories</h2>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <div className="flex items-center mb-4">
                  <Sparkles className="w-5 h-5 text-blue-600 mr-2" />
                  <h3 className="text-lg font-semibold text-gray-900">Category Templates</h3>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  Click to add common wedding budget categories
                </p>
                <div className="space-y-2">
                  {templates.map((template) => {
                    const isAdded = sections.some(s => s.name === template.name);
                    return (
                      <button
                        key={template.id}
                        onClick={() => !isAdded && handleAddFromTemplate(template)}
                        disabled={isAdded}
                        className={`w-full text-left px-4 py-3 rounded-lg border transition-colors ${
                          isAdded
                            ? 'border-green-200 bg-green-50 text-green-700 cursor-not-allowed'
                            : 'border-gray-200 hover:border-blue-500 hover:bg-blue-50'
                        }`}
                      >
                        <div className="font-medium">{template.name}</div>
                        {template.description && (
                          <div className="text-xs text-gray-500 mt-1">{template.description}</div>
                        )}
                        {isAdded && (
                          <div className="text-xs text-green-600 mt-1">✓ Added</div>
                        )}
                      </button>
                    );
                  })}
                </div>

                <div className="mt-6">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Add Custom Category</h3>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleAddCustom()}
                      placeholder="Category name"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button
                      onClick={handleAddCustom}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Categories</h3>
                <p className="text-sm text-gray-600 mb-4">
                  {sections.length} categories • Edit, reorder, or remove
                </p>
                <div className="space-y-2">
                  {sections.map((section, index) => (
                    <div
                      key={section.id}
                      className="flex items-center gap-2 px-4 py-3 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <div className="flex flex-col gap-1">
                        <button
                          onClick={() => handleMoveUp(section, index)}
                          disabled={index === 0}
                          className="text-gray-400 hover:text-gray-600 disabled:opacity-30"
                        >
                          ▲
                        </button>
                        <button
                          onClick={() => handleMoveDown(section, index)}
                          disabled={index === sections.length - 1}
                          className="text-gray-400 hover:text-gray-600 disabled:opacity-30"
                        >
                          ▼
                        </button>
                      </div>

                      {editingSection === section.id ? (
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && handleSaveEdit(section.id)}
                          onBlur={() => handleSaveEdit(section.id)}
                          autoFocus
                          className="flex-1 px-3 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      ) : (
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{section.name}</div>
                          {section.is_custom && (
                            <div className="text-xs text-blue-600">Custom</div>
                          )}
                        </div>
                      )}

                      <button
                        onClick={() => handleEdit(section)}
                        className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(section.id)}
                        className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}

                  {sections.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      No categories yet. Add from templates or create custom ones.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
          <button
            onClick={handleClose}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

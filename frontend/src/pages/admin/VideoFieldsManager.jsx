import React, { useState, useEffect, useCallback } from 'react';
import {
  SlidersHorizontal,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  AlertCircle,
  HelpCircle,
  Layers,
  Search,
  Eye,
  Type,
  ListFilter,
  CheckSquare,
  CircleDot,
  ChevronDown,
  RotateCcw,
  Sparkles,
  Save,
  ArrowUpDown,
  GripVertical
} from 'lucide-react';
import { videoFieldAPI } from '../../services/api';

export default function VideoFieldsManager() {
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  // Drag-and-drop states for field cards
  const [draggedCardIndex, setDraggedCardIndex] = useState(null);
  const [dragOverCardIndex, setDragOverCardIndex] = useState(null);

  // Drag-and-drop states for option chips: { fieldId: string, index: number }
  const [draggedOption, setDraggedOption] = useState(null);
  const [dragOverOption, setDragOverOption] = useState(null);

  // Handle Card Drop Reordering
  const handleCardDrop = async (targetIndex) => {
    if (draggedCardIndex === null || draggedCardIndex === targetIndex) {
      setDraggedCardIndex(null);
      setDragOverCardIndex(null);
      return;
    }

    const updated = [...fields];
    const [moved] = updated.splice(draggedCardIndex, 1);
    updated.splice(targetIndex, 0, moved);

    setFields(updated);
    setDraggedCardIndex(null);
    setDragOverCardIndex(null);

    const orderList = updated.map((f, idx) => ({ id: f._id, order: idx + 1 }));
    try {
      await videoFieldAPI.reorder(orderList);
      showNotification('Field cards order saved!');
    } catch (err) {
      console.error('Failed to save field order:', err);
      loadFields();
    }
  };

  // Handle Option Drop Reordering
  const handleOptionDrop = async (field, targetIndex) => {
    if (
      !draggedOption ||
      draggedOption.fieldId !== field._id ||
      draggedOption.index === targetIndex
    ) {
      setDraggedOption(null);
      setDragOverOption(null);
      return;
    }

    const updatedOptions = [...(field.options || [])];
    const [movedOption] = updatedOptions.splice(draggedOption.index, 1);
    updatedOptions.splice(targetIndex, 0, movedOption);

    setFields((prev) =>
      prev.map((f) => (f._id === field._id ? { ...f, options: updatedOptions } : f))
    );
    setDraggedOption(null);
    setDragOverOption(null);

    try {
      await videoFieldAPI.update(field._id, { options: updatedOptions });
      showNotification(`Reordered options for ${field.title}`);
    } catch (err) {
      console.error('Failed to save option order:', err);
      loadFields();
    }
  };

  // New Field Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newKey, setNewKey] = useState('');
  const [newType, setNewType] = useState('checkbox');
  const [newDescription, setNewDescription] = useState('');
  const [newPlaceholder, setNewPlaceholder] = useState('');
  const [newOptionsInput, setNewOptionsInput] = useState('');
  const [newShowInSearch, setNewShowInSearch] = useState(true);
  const [newShowInEditor, setNewShowInEditor] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit Field Modal
  const [editingField, setEditingField] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editPlaceholder, setEditPlaceholder] = useState('');
  const [editShowInSearch, setEditShowInSearch] = useState(true);
  const [editShowInEditor, setEditShowInEditor] = useState(true);

  // Quick Option Adders state per field: { [fieldId]: string }
  const [quickOptionInputs, setQuickOptionInputs] = useState({});

  // Inline Option Editing state: { fieldId: string, optionIndex: number, value: string }
  const [inlineEditingOption, setInlineEditingOption] = useState(null);

  const showNotification = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3500);
  };

  const loadFields = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await videoFieldAPI.getAll();
      if (res && res.data) {
        setFields(res.data);
      }
    } catch (err) {
      console.error('Error fetching video fields:', err);
      setError(err.message || 'Failed to load video fields');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFields();
  }, [loadFields]);

  // Handle Quick Add Option
  const handleAddOption = async (field) => {
    const val = (quickOptionInputs[field._id] || '').trim();
    if (!val) return;

    if (field.options && field.options.some((o) => o.toLowerCase() === val.toLowerCase())) {
      alert(`Option "${val}" already exists!`);
      return;
    }

    const updatedOptions = [...(field.options || []), val];

    // Optimistic UI update
    setFields((prev) =>
      prev.map((f) => (f._id === field._id ? { ...f, options: updatedOptions } : f))
    );
    setQuickOptionInputs((prev) => ({ ...prev, [field._id]: '' }));

    try {
      await videoFieldAPI.update(field._id, { options: updatedOptions });
      showNotification(`Added option "${val}" to ${field.title}`);
    } catch (err) {
      console.error('Failed to add option:', err);
      alert('Failed to save option: ' + err.message);
      loadFields();
    }
  };

  // Handle Delete Option
  const handleDeleteOption = async (field, optionToDelete) => {
    if (!window.confirm(`Delete option "${optionToDelete}" from ${field.title}?`)) {
      return;
    }

    const updatedOptions = (field.options || []).filter((o) => o !== optionToDelete);

    // Optimistic UI update
    setFields((prev) =>
      prev.map((f) => (f._id === field._id ? { ...f, options: updatedOptions } : f))
    );

    try {
      await videoFieldAPI.update(field._id, { options: updatedOptions });
      showNotification(`Deleted option "${optionToDelete}"`);
    } catch (err) {
      console.error('Failed to delete option:', err);
      alert('Failed to delete option: ' + err.message);
      loadFields();
    }
  };

  // Handle Save Inline Option Edit
  const handleSaveInlineOption = async (field) => {
    if (!inlineEditingOption || inlineEditingOption.fieldId !== field._id) return;
    const newVal = inlineEditingOption.value.trim();
    if (!newVal) return;

    const oldVal = (field.options || [])[inlineEditingOption.optionIndex];
    const updatedOptions = [...(field.options || [])];
    updatedOptions[inlineEditingOption.optionIndex] = newVal;

    setFields((prev) =>
      prev.map((f) => (f._id === field._id ? { ...f, options: updatedOptions } : f))
    );
    setInlineEditingOption(null);

    try {
      await videoFieldAPI.update(field._id, {
        options: updatedOptions,
        renameOption: { oldVal, newVal }
      });
      showNotification(`Updated option to "${newVal}"`);
    } catch (err) {
      console.error('Failed to update option:', err);
      alert('Failed to update option: ' + err.message);
      loadFields();
    }
  };

  // Handle Toggle Active/Inactive
  const handleToggleActive = async (field) => {
    const nextState = !field.isActive;
    setFields((prev) =>
      prev.map((f) => (f._id === field._id ? { ...f, isActive: nextState } : f))
    );

    try {
      await videoFieldAPI.update(field._id, { isActive: nextState });
      showNotification(`${field.title} is now ${nextState ? 'Active' : 'Inactive'}`);
    } catch (err) {
      console.error('Failed to toggle field status:', err);
      loadFields();
    }
  };

  // Handle Create New Field Group
  const handleCreateField = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    setIsSubmitting(true);
    try {
      const parsedOptions = newOptionsInput
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      await videoFieldAPI.create({
        title: newTitle.trim(),
        key: newKey.trim() || undefined,
        type: newType,
        description: newDescription.trim(),
        placeholder: newPlaceholder.trim(),
        options: parsedOptions,
        showInSearch: newShowInSearch,
        showInEditor: newShowInEditor
      });

      showNotification(`Field group "${newTitle}" created successfully!`);
      setIsAddModalOpen(false);
      setNewTitle('');
      setNewKey('');
      setNewType('checkbox');
      setNewDescription('');
      setNewPlaceholder('');
      setNewOptionsInput('');
      setNewShowInSearch(true);
      setNewShowInEditor(true);
      loadFields();
    } catch (err) {
      console.error('Failed to create field group:', err);
      alert('Failed to create field group: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Delete Field Group
  const handleDeleteField = async (field) => {
    if (field.isSystem) {
      alert(
        'System fields (Choice Category, Age Group, Marital Status) cannot be deleted. You can delete or edit their options instead.'
      );
      return;
    }

    if (
      !window.confirm(
        `Are you sure you want to delete the field group "${field.title}"? This cannot be undone.`
      )
    ) {
      return;
    }

    try {
      await videoFieldAPI.delete(field._id);
      showNotification(`Field group "${field.title}" deleted`);
      loadFields();
    } catch (err) {
      console.error('Failed to delete field group:', err);
      alert('Failed to delete field: ' + err.message);
    }
  };

  // Open Edit Modal
  const openEditModal = (field) => {
    setEditingField(field);
    setEditTitle(field.title);
    setEditDescription(field.description || '');
    setEditPlaceholder(field.placeholder || '');
    setEditShowInSearch(field.showInSearch !== false);
    setEditShowInEditor(field.showInEditor !== false);
  };

  // Save Edit Field Group
  const handleSaveEditField = async (e) => {
    e.preventDefault();
    if (!editingField || !editTitle.trim()) return;

    setIsSubmitting(true);
    try {
      await videoFieldAPI.update(editingField._id, {
        title: editTitle.trim(),
        description: editDescription.trim(),
        placeholder: editPlaceholder.trim(),
        showInSearch: editShowInSearch,
        showInEditor: editShowInEditor
      });

      showNotification(`Field group "${editTitle}" updated successfully!`);
      setEditingField(null);
      loadFields();
    } catch (err) {
      console.error('Failed to update field group:', err);
      alert('Failed to update: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'checkbox':
        return <CheckSquare size={14} color="#6366f1" />;
      case 'radio':
        return <CircleDot size={14} color="#ec4899" />;
      case 'select':
        return <ChevronDown size={14} color="#f59e0b" />;
      case 'text':
      default:
        return <Type size={14} color="#10b981" />;
    }
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case 'checkbox':
        return 'Checkbox (Multi-Select)';
      case 'radio':
        return 'Radio (Single-Select)';
      case 'select':
        return 'Dropdown (Select)';
      case 'text':
      default:
        return 'Text Input';
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 20px' }}>
      {/* Toast Notification */}
      {successMsg && (
        <div
          style={{
            position: 'fixed',
            top: '24px',
            right: '24px',
            background: 'linear-gradient(135deg, #10b981, #059669)',
            color: '#fff',
            padding: '12px 20px',
            borderRadius: '8px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.4)',
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontWeight: 600,
            fontSize: '13.5px',
            animation: 'fadeIn 0.2s ease'
          }}
        >
          <Check size={18} />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Header */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: '16px',
          marginBottom: '28px'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff'
              }}
            >
              <SlidersHorizontal size={20} />
            </div>
            <h1
              style={{
                fontSize: '24px',
                fontWeight: 800,
                color: 'var(--text-primary, #f8fafc)',
                margin: 0,
                letterSpacing: '-0.02em'
              }}
            >
              Video Details & Custom Taxonomies
            </h1>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsAddModalOpen(true)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            color: '#fff',
            border: 'none',
            padding: '10px 18px',
            borderRadius: '8px',
            fontWeight: 600,
            fontSize: '13.5px',
            cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(99, 102, 241, 0.35)',
            transition: 'all 0.15s ease'
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-1px)')}
          onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
        >
          <Plus size={16} />
          <span>Add Custom Field Group</span>
        </button>
      </div>

      {/* Loading & Error States */}
      {loading ? (
        <div
          style={{
            padding: '60px',
            textAlign: 'center',
            color: 'var(--text-muted, #94a3b8)',
            fontSize: '14px'
          }}
        >
          Loading video field groups...
        </div>
      ) : error ? (
        <div
          style={{
            padding: '24px',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '10px',
            color: '#f87171',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}
        >
          <AlertCircle size={20} />
          <span>{error}</span>
          <button
            onClick={loadFields}
            style={{
              marginLeft: 'auto',
              background: '#ef4444',
              color: '#fff',
              border: 'none',
              padding: '6px 12px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 600
            }}
          >
            Retry
          </button>
        </div>
      ) : (
        /* Field Groups List (2-Column Grid with Drag-and-Drop) */
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(460px, 1fr))',
            gap: '20px',
            alignItems: 'start'
          }}
        >
          {fields.map((field, cardIdx) => (
            <div
              key={field._id}
              draggable={!inlineEditingOption}
              onDragStart={(e) => {
                e.dataTransfer.setData('text/plain', 'card');
                setDraggedCardIndex(cardIdx);
              }}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                if (dragOverCardIndex !== cardIdx) {
                  setDragOverCardIndex(cardIdx);
                }
              }}
              onDragEnd={() => {
                setDraggedCardIndex(null);
                setDragOverCardIndex(null);
              }}
              onDrop={(e) => {
                e.preventDefault();
                handleCardDrop(cardIdx);
              }}
              style={{
                background: 'var(--bg-card, #121829)',
                border: dragOverCardIndex === cardIdx
                  ? '2px dashed #6366f1'
                  : '1px solid var(--border-color, rgba(255, 255, 255, 0.08))',
                borderRadius: '12px',
                padding: '20px',
                boxShadow: '0 4px 18px rgba(0, 0, 0, 0.25)',
                opacity: field.isActive ? 1 : 0.6,
                transition: 'all 0.2s ease',
                transform: dragOverCardIndex === cardIdx ? 'scale(1.01)' : 'none'
              }}
            >
              {/* Card Top / Header */}
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '12px',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                  paddingBottom: '14px',
                  marginBottom: '16px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div
                    style={{
                      cursor: 'grab',
                      display: 'flex',
                      alignItems: 'center',
                      color: '#64748b',
                      padding: '4px',
                      borderRadius: '4px'
                    }}
                    title="Drag card to reorder"
                  >
                    <GripVertical size={16} />
                  </div>
                  <div
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '6px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    {getTypeIcon(field.type)}
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <h3
                        style={{
                          fontSize: '16px',
                          fontWeight: 700,
                          color: 'var(--text-primary, #f8fafc)',
                          margin: 0
                        }}
                      >
                        {field.title}
                      </h3>
                      {field.isSystem ? (
                        <span
                          style={{
                            fontSize: '10px',
                            fontWeight: 700,
                            padding: '2px 6px',
                            borderRadius: '4px',
                            background: 'rgba(99, 102, 241, 0.15)',
                            color: '#818cf8',
                            border: '1px solid rgba(99, 102, 241, 0.3)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.04em'
                          }}
                        >
                          System Field
                        </span>
                      ) : (
                        <span
                          style={{
                            fontSize: '10px',
                            fontWeight: 700,
                            padding: '2px 6px',
                            borderRadius: '4px',
                            background: 'rgba(16, 185, 129, 0.15)',
                            color: '#34d399',
                            border: '1px solid rgba(16, 185, 129, 0.3)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.04em'
                          }}
                        >
                          Custom Field
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Header Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {/* Active Toggle Button */}
                  <button
                    type="button"
                    onClick={() => handleToggleActive(field)}
                    style={{
                      fontSize: '11px',
                      padding: '4px 8px',
                      borderRadius: '6px',
                      background: field.isActive
                        ? 'rgba(16, 185, 129, 0.12)'
                        : 'rgba(239, 68, 68, 0.12)',
                      color: field.isActive ? '#34d399' : '#f87171',
                      border: `1px solid ${
                        field.isActive ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'
                      }`,
                      cursor: 'pointer',
                      fontWeight: 600
                    }}
                  >
                    {field.isActive ? 'Active' : 'Inactive'}
                  </button>

                  {/* Edit Field Group Info */}
                  <button
                    type="button"
                    onClick={() => openEditModal(field)}
                    style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: 'var(--text-secondary, #cbd5e1)',
                      padding: '5px 8px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '11px',
                      fontWeight: 500
                    }}
                    title="Edit Field Settings"
                  >
                    <Edit2 size={12} />
                    <span>Edit</span>
                  </button>

                  {/* Delete Field (Only if non-system) */}
                  {!field.isSystem && (
                    <button
                      type="button"
                      onClick={() => handleDeleteField(field)}
                      style={{
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.25)',
                        color: '#f87171',
                        padding: '5px 8px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '11px',
                        fontWeight: 500
                      }}
                      title="Delete Field Group"
                    >
                      <Trash2 size={12} />
                      <span>Delete</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Options Management Section (For checkbox, radio, select) */}
              {field.type !== 'text' ? (
                <div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '10px'
                    }}
                  >
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        color: 'var(--text-muted, #94a3b8)'
                      }}
                    >
                      Configured Options ({field.options?.length || 0})
                    </span>
                  </div>

                  {/* Chips Grid */}
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '8px',
                      marginBottom: '14px',
                      minHeight: '36px'
                    }}
                  >
                    {(!field.options || field.options.length === 0) && (
                      <span
                        style={{
                          fontSize: '12px',
                          color: 'var(--text-muted, #64748b)',
                          fontStyle: 'italic'
                        }}
                      >
                        No options added yet. Add one below.
                      </span>
                    )}

                    {field.options &&
                      field.options.map((option, idx) => {
                        const isEditingThis =
                          inlineEditingOption &&
                          inlineEditingOption.fieldId === field._id &&
                          inlineEditingOption.optionIndex === idx;

                        if (isEditingThis) {
                          return (
                            <div
                              key={idx}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                background: 'rgba(99, 102, 241, 0.2)',
                                border: '1px solid #6366f1',
                                borderRadius: '8px',
                                padding: '2px 4px'
                              }}
                            >
                              <input
                                type="text"
                                autoFocus
                                value={inlineEditingOption.value}
                                onChange={(e) =>
                                  setInlineEditingOption({
                                    ...inlineEditingOption,
                                    value: e.target.value
                                  })
                                }
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleSaveInlineOption(field);
                                  if (e.key === 'Escape') setInlineEditingOption(null);
                                }}
                                style={{
                                  background: 'transparent',
                                  border: 'none',
                                  color: '#fff',
                                  fontSize: '12px',
                                  fontWeight: 600,
                                  outline: 'none',
                                  padding: '2px 4px',
                                  width: '110px'
                                }}
                              />
                              <button
                                type="button"
                                onClick={() => handleSaveInlineOption(field)}
                                style={{
                                  background: '#6366f1',
                                  border: 'none',
                                  color: '#fff',
                                  borderRadius: '4px',
                                  padding: '3px',
                                  cursor: 'pointer'
                                }}
                                title="Save (Enter)"
                              >
                                <Check size={12} />
                              </button>
                              <button
                                type="button"
                                onClick={() => setInlineEditingOption(null)}
                                style={{
                                  background: 'transparent',
                                  border: 'none',
                                  color: '#94a3b8',
                                  cursor: 'pointer',
                                  padding: '3px'
                                }}
                                title="Cancel (Esc)"
                              >
                                <X size={12} />
                              </button>
                            </div>
                          );
                        }

                        const isDragOver =
                          dragOverOption?.fieldId === field._id &&
                          dragOverOption?.index === idx;

                        return (
                          <div
                            key={idx}
                            draggable={!inlineEditingOption}
                            onDragStart={(e) => {
                              e.stopPropagation();
                              e.dataTransfer.setData('text/plain', 'option');
                              setDraggedOption({ fieldId: field._id, index: idx });
                            }}
                            onDragOver={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              e.dataTransfer.dropEffect = 'move';
                              if (
                                !dragOverOption ||
                                dragOverOption.index !== idx ||
                                dragOverOption.fieldId !== field._id
                              ) {
                                setDragOverOption({ fieldId: field._id, index: idx });
                              }
                            }}
                            onDragEnd={(e) => {
                              e.stopPropagation();
                              setDraggedOption(null);
                              setDragOverOption(null);
                            }}
                            onDrop={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleOptionDrop(field, idx);
                            }}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              background: isDragOver
                                ? 'rgba(99, 102, 241, 0.25)'
                                : 'rgba(255, 255, 255, 0.04)',
                              border: isDragOver
                                ? '1px dashed #818cf8'
                                : '1px solid rgba(255, 255, 255, 0.1)',
                              borderRadius: '8px',
                              padding: '5px 10px',
                              fontSize: '12.5px',
                              fontWeight: 500,
                              color: 'var(--text-primary, #f1f5f9)',
                              cursor: 'grab',
                              transition: 'all 0.15s ease'
                            }}
                            title="Drag to reorder option"
                          >
                            <GripVertical
                              size={12}
                              style={{ color: '#64748b', marginRight: '-2px', flexShrink: 0 }}
                            />
                            <span>{option}</span>

                            <button
                              type="button"
                              onClick={() =>
                                setInlineEditingOption({
                                  fieldId: field._id,
                                  optionIndex: idx,
                                  value: option
                                })
                              }
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: 'var(--text-muted, #94a3b8)',
                                cursor: 'pointer',
                                padding: 0,
                                display: 'flex',
                                alignItems: 'center'
                              }}
                              title="Edit Option"
                            >
                              <Edit2 size={11} />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteOption(field, option)}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: 'var(--text-muted, #94a3b8)',
                                cursor: 'pointer',
                                padding: 0,
                                display: 'flex',
                                alignItems: 'center'
                              }}
                              title="Delete Option"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        );
                      })}
                  </div>

                  {/* Quick Add Input Bar */}
                  <div
                    style={{
                      display: 'flex',
                      gap: '8px',
                      alignItems: 'center',
                      maxWidth: '420px'
                    }}
                  >
                    <input
                      type="text"
                      placeholder={`Add new option to ${field.title}...`}
                      value={quickOptionInputs[field._id] || ''}
                      onChange={(e) =>
                        setQuickOptionInputs({
                          ...quickOptionInputs,
                          [field._id]: e.target.value
                        })
                      }
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddOption(field);
                        }
                      }}
                      style={{
                        flex: 1,
                        background: 'rgba(0, 0, 0, 0.25)',
                        border: '1px solid var(--border-color, rgba(255, 255, 255, 0.12))',
                        borderRadius: '6px',
                        padding: '7px 12px',
                        color: 'var(--text-primary, #f8fafc)',
                        fontSize: '12.5px',
                        outline: 'none'
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => handleAddOption(field)}
                      style={{
                        background: 'rgba(99, 102, 241, 0.15)',
                        border: '1px solid rgba(99, 102, 241, 0.35)',
                        color: '#818cf8',
                        padding: '7px 14px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px'
                      }}
                    >
                      <Plus size={13} />
                      <span>Add Option</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* Text Input Preview */
                <div
                  style={{
                    background: 'rgba(0, 0, 0, 0.2)',
                    border: '1px dashed rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    padding: '12px 16px',
                    fontSize: '12.5px',
                    color: 'var(--text-muted, #94a3b8)'
                  }}
                >
                  <div style={{ marginBottom: '6px' }}>
                    <strong>Text Input Field:</strong> In video editor, this renders as a text input
                    box.
                  </div>
                  <div>
                    Placeholder:{' '}
                    <span style={{ color: '#fff' }}>
                      "{field.placeholder || 'Enter ' + field.title}"
                    </span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add New Field Modal */}
      {isAddModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px'
          }}
          onClick={() => setIsAddModalOpen(false)}
        >
          <div
            style={{
              background: 'var(--bg-card, #121829)',
              border: '1px solid var(--border-color, rgba(255, 255, 255, 0.12))',
              borderRadius: '16px',
              padding: '24px 28px',
              maxWidth: '540px',
              width: '100%',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.7)',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '18px'
              }}
            >
              <h2
                style={{
                  fontSize: '18px',
                  fontWeight: 700,
                  color: 'var(--text-primary, #f8fafc)',
                  margin: 0
                }}
              >
                Add New Video Field Group
              </h2>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted, #94a3b8)',
                  cursor: 'pointer',
                  padding: '4px'
                }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateField}>
              {/* Field Label */}
              <div style={{ marginBottom: '14px' }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: 'var(--text-secondary, #cbd5e1)',
                    marginBottom: '6px'
                  }}
                >
                  Field Label / Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Hair Color, Resolution, Language, Ethnicity"
                  value={newTitle}
                  onChange={(e) => {
                    setNewTitle(e.target.value);
                    if (!newKey) {
                      setNewKey(
                        e.target.value
                          .toLowerCase()
                          .replace(/[^a-z0-9]/g, '_')
                          .replace(/_+/g, '_')
                      );
                    }
                  }}
                  style={{
                    width: '100%',
                    background: 'rgba(0, 0, 0, 0.3)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    color: '#fff',
                    fontSize: '13px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Field Key */}
              <div style={{ marginBottom: '14px' }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: 'var(--text-secondary, #cbd5e1)',
                    marginBottom: '6px'
                  }}
                >
                  Field Key (Internal identifier)
                </label>
                <input
                  type="text"
                  placeholder="e.g. custom_hair_color"
                  value={newKey}
                  onChange={(e) => setNewKey(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'rgba(0, 0, 0, 0.3)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    color: '#818cf8',
                    fontFamily: 'monospace',
                    fontSize: '12px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Field Type */}
              <div style={{ marginBottom: '14px' }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: 'var(--text-secondary, #cbd5e1)',
                    marginBottom: '6px'
                  }}
                >
                  Field Type *
                </label>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: '8px'
                  }}
                >
                  {[
                    { id: 'checkbox', label: 'Checkbox', sub: 'Multi-select pills', icon: CheckSquare },
                    { id: 'radio', label: 'Radio', sub: 'Single-select pills', icon: CircleDot },
                    { id: 'select', label: 'Dropdown', sub: 'Select menu', icon: ChevronDown },
                    { id: 'text', label: 'Text Input', sub: 'Custom text value', icon: Type }
                  ].map((t) => {
                    const isSelected = newType === t.id;
                    const Icon = t.icon;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setNewType(t.id)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '10px 12px',
                          borderRadius: '8px',
                          border: `1.5px solid ${isSelected ? '#6366f1' : 'rgba(255, 255, 255, 0.1)'}`,
                          background: isSelected ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                          cursor: 'pointer',
                          textAlign: 'left',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <Icon size={16} color={isSelected ? '#818cf8' : '#94a3b8'} />
                        <div>
                          <div
                            style={{
                              fontSize: '12.5px',
                              fontWeight: 600,
                              color: isSelected ? '#fff' : '#cbd5e1'
                            }}
                          >
                            {t.label}
                          </div>
                          <div style={{ fontSize: '10px', color: '#94a3b8' }}>{t.sub}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Options Input (For checkbox, radio, select) */}
              {newType !== 'text' ? (
                <div style={{ marginBottom: '14px' }}>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '12px',
                      fontWeight: 600,
                      color: 'var(--text-secondary, #cbd5e1)',
                      marginBottom: '6px'
                    }}
                  >
                    Initial Options (comma-separated)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="e.g. Blonde, Brunette, Black, Red, Other"
                    value={newOptionsInput}
                    onChange={(e) => setNewOptionsInput(e.target.value)}
                    style={{
                      width: '100%',
                      background: 'rgba(0, 0, 0, 0.3)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      borderRadius: '8px',
                      padding: '8px 12px',
                      color: '#fff',
                      fontSize: '12.5px',
                      boxSizing: 'border-box'
                    }}
                  />
                  <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                    You can also easily add, edit, and delete options later right from the card.
                  </span>
                </div>
              ) : (
                <div style={{ marginBottom: '14px' }}>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '12px',
                      fontWeight: 600,
                      color: 'var(--text-secondary, #cbd5e1)',
                      marginBottom: '6px'
                    }}
                  >
                    Input Placeholder
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Enter video resolution..."
                    value={newPlaceholder}
                    onChange={(e) => setNewPlaceholder(e.target.value)}
                    style={{
                      width: '100%',
                      background: 'rgba(0, 0, 0, 0.3)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      borderRadius: '8px',
                      padding: '8px 12px',
                      color: '#fff',
                      fontSize: '13px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              )}

              {/* Visibility Options */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  marginBottom: '20px',
                  background: 'rgba(0, 0, 0, 0.2)',
                  padding: '12px',
                  borderRadius: '8px'
                }}
              >
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '12.5px',
                    color: '#e2e8f0',
                    cursor: 'pointer'
                  }}
                >
                  <input
                    type="checkbox"
                    checked={newShowInEditor}
                    onChange={(e) => setNewShowInEditor(e.target.checked)}
                  />
                  <span>Show in Video Editor (under Video Details)</span>
                </label>
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '12.5px',
                    color: '#e2e8f0',
                    cursor: 'pointer'
                  }}
                >
                  <input
                    type="checkbox"
                    checked={newShowInSearch}
                    onChange={(e) => setNewShowInSearch(e.target.checked)}
                  />
                  <span>Show in Search by Videos filters</span>
                </label>
              </div>

              {/* Submit Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  style={{
                    background: 'transparent',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    color: 'var(--text-secondary, #cbd5e1)',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{
                    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                    color: '#fff',
                    border: 'none',
                    padding: '8px 20px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    opacity: isSubmitting ? 0.7 : 1
                  }}
                >
                  {isSubmitting ? 'Creating...' : 'Create Field Group'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Field Modal */}
      {editingField && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px'
          }}
          onClick={() => setEditingField(null)}
        >
          <div
            style={{
              background: 'var(--bg-card, #121829)',
              border: '1px solid var(--border-color, rgba(255, 255, 255, 0.12))',
              borderRadius: '16px',
              padding: '24px 28px',
              maxWidth: '480px',
              width: '100%',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.7)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '18px'
              }}
            >
              <h2
                style={{
                  fontSize: '18px',
                  fontWeight: 700,
                  color: 'var(--text-primary, #f8fafc)',
                  margin: 0
                }}
              >
                Edit Field: {editingField.title}
              </h2>
              <button
                type="button"
                onClick={() => setEditingField(null)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted, #94a3b8)',
                  cursor: 'pointer',
                  padding: '4px'
                }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveEditField}>
              <div style={{ marginBottom: '14px' }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: 'var(--text-secondary, #cbd5e1)',
                    marginBottom: '6px'
                  }}
                >
                  Field Label *
                </label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'rgba(0, 0, 0, 0.3)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    color: '#fff',
                    fontSize: '13px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {editingField.type === 'text' && (
                <div style={{ marginBottom: '14px' }}>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '12px',
                      fontWeight: 600,
                      color: 'var(--text-secondary, #cbd5e1)',
                      marginBottom: '6px'
                    }}
                  >
                    Input Placeholder
                  </label>
                  <input
                    type="text"
                    value={editPlaceholder}
                    onChange={(e) => setEditPlaceholder(e.target.value)}
                    style={{
                      width: '100%',
                      background: 'rgba(0, 0, 0, 0.3)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      borderRadius: '8px',
                      padding: '8px 12px',
                      color: '#fff',
                      fontSize: '13px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              )}

              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  marginBottom: '20px',
                  background: 'rgba(0, 0, 0, 0.2)',
                  padding: '12px',
                  borderRadius: '8px'
                }}
              >
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '12.5px',
                    color: '#e2e8f0',
                    cursor: 'pointer'
                  }}
                >
                  <input
                    type="checkbox"
                    checked={editShowInEditor}
                    onChange={(e) => setEditShowInEditor(e.target.checked)}
                  />
                  <span>Show in Video Editor</span>
                </label>
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '12.5px',
                    color: '#e2e8f0',
                    cursor: 'pointer'
                  }}
                >
                  <input
                    type="checkbox"
                    checked={editShowInSearch}
                    onChange={(e) => setEditShowInSearch(e.target.checked)}
                  />
                  <span>Show in Search by Videos filters</span>
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setEditingField(null)}
                  style={{
                    background: 'transparent',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    color: 'var(--text-secondary, #cbd5e1)',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{
                    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                    color: '#fff',
                    border: 'none',
                    padding: '8px 20px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    opacity: isSubmitting ? 0.7 : 1
                  }}
                >
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

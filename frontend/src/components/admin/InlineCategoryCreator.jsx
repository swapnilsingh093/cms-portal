import React, { useState, useEffect, useMemo } from 'react';
import { categoryAPI } from '../../services/api';
import { Plus, Check, Loader2 } from 'lucide-react';

const InlineCategoryCreator = ({
  taxonomyType = 'post', // 'post' | 'video' | 'gallery'
  taxonomyLabel, // e.g. "Video", "Category", "Gallery"
  selectedCategory,
  selectedSubCategory,
  selectedChildCategory,
  selectedCategories = [],
  onCategoryChange,
  onSubCategoryChange,
  onChildCategoryChange,
  onCategoriesChange
}) => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'most-used'
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatParent, setNewCatParent] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  const label = taxonomyLabel || (taxonomyType === 'video' ? 'Video' : taxonomyType === 'gallery' ? 'Gallery' : 'Category');

  useEffect(() => {
    fetchCategories();
  }, [taxonomyType]);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await categoryAPI.getAll({ type: taxonomyType });
      if (res.categories) {
        setCategories(res.categories);
      }
    } catch (err) {
      console.error('Error fetching categories for inline selector:', err.message);
    } finally {
      setLoading(false);
    }
  };

  // Group into 3-level hierarchy (Root -> Sub -> Child)
  const { allFlattenedHierarchy, selectableParents } = useMemo(() => {
    const parentIdOf = (c) => (c.parentCategory?._id ? c.parentCategory._id : c.parentCategory);
    const roots = [];
    const childrenByParent = {};

    categories.forEach((cat) => {
      const pId = parentIdOf(cat);
      if (!pId) {
        roots.push(cat);
      } else {
        if (!childrenByParent[pId]) {
          childrenByParent[pId] = [];
        }
        childrenByParent[pId].push(cat);
      }
    });

    roots.sort((a, b) => a.name.localeCompare(b.name));

    const flattened = [];
    const parentsList = [];

    const traverse = (items, depth = 0, parentId = null, grandParentId = null) => {
      items.forEach((item) => {
        flattened.push({
          ...item,
          depth,
          isChild: depth > 0,
          parentId,
          grandParentId
        });
        if (depth < 2) {
          parentsList.push({
            _id: item._id,
            name: depth === 1 ? `— ${item.name}` : item.name,
            depth
          });
        }
        const kids = childrenByParent[item._id] || [];
        if (kids.length > 0) {
          kids.sort((a, b) => a.name.localeCompare(b.name));
          traverse(kids, depth + 1, item._id, parentId);
        }
      });
    };

    traverse(roots, 0, null, null);

    return { allFlattenedHierarchy: flattened, selectableParents: parentsList };
  }, [categories]);

  // Determine if a category is checked
  const isChecked = (catId) => {
    const idStr = String(catId);
    return Array.isArray(selectedCategories) && selectedCategories.map(String).includes(idStr);
  };

  const handleToggle = (cat) => {
    const depth = cat.depth || 0;
    const idStr = String(cat._id);
    const curList = (selectedCategories || []).map(String);
    const currentlyChecked = curList.includes(idStr);

    let updatedList;
    if (currentlyChecked) {
      // Uncheck this specific category
      updatedList = curList.filter((id) => id !== idStr);
      if (depth === 2 && onChildCategoryChange && String(selectedChildCategory) === idStr) onChildCategoryChange('');
      if (depth === 1 && onSubCategoryChange && String(selectedSubCategory) === idStr) onSubCategoryChange('');
      if (depth === 0 && onCategoryChange && String(selectedCategory) === idStr) onCategoryChange('');
    } else {
      // Check this specific category
      updatedList = curList.includes(idStr) ? curList : [...curList, idStr];
      if (depth === 2 && onChildCategoryChange) onChildCategoryChange(cat._id);
      if (depth === 1 && onSubCategoryChange) onSubCategoryChange(cat._id);
      if (depth === 0 && onCategoryChange) onCategoryChange(cat._id);
    }

    if (onCategoriesChange) {
      onCategoriesChange(updatedList);
    }
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    if (!newCatName.trim()) {
      setError('Please provide a category name');
      return;
    }

    setCreating(true);
    setError('');

    try {
      const payload = {
        name: newCatName.trim(),
        type: taxonomyType,
        parentCategory: newCatParent || null
      };

      const res = await categoryAPI.create(payload);
      if (res.category) {
        const created = res.category;
        setCategories((prev) => [...prev, created]);

        const curList = (selectedCategories || []).map(String);
        const updatedList = curList.includes(String(created._id)) ? curList : [...curList, String(created._id)];

        if (created.parentCategory) {
          const pId = typeof created.parentCategory === 'object' ? created.parentCategory._id : created.parentCategory;
          const parentDoc = categories.find((c) => String(c._id) === String(pId));
          const gpId = parentDoc && parentDoc.parentCategory
            ? (typeof parentDoc.parentCategory === 'object' ? parentDoc.parentCategory._id : parentDoc.parentCategory)
            : null;

          if (gpId) {
            // Created is Level 3 (Child)
            if (onChildCategoryChange) onChildCategoryChange(created._id);
          } else {
            // Created is Level 2 (Sub)
            if (onSubCategoryChange) onSubCategoryChange(created._id);
          }
        } else {
          // Created is Level 1 (Parent)
          if (onCategoryChange) onCategoryChange(created._id);
        }

        if (onCategoriesChange) {
          onCategoriesChange(updatedList);
        }

        setNewCatName('');
        setNewCatParent('');
        setShowAddForm(false);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Error creating category');
    } finally {
      setCreating(false);
    }
  };

  // Top / Most used categories
  const mostUsedCategories = useMemo(() => {
    return [...categories]
      .sort((a, b) => (b.postCount || 0) - (a.postCount || 0))
      .slice(0, 10);
  }, [categories]);

  return (
    <div className="wp-category-box">
      {/* 1. Category Tabs: All [Type] | Most Used (Matching Screenshot 1) */}
      <div
        style={{
          display: 'flex',
          gap: '4px',
          borderBottom: '1px solid var(--border-color)',
          marginBottom: '0'
        }}
      >
        <button
          type="button"
          onClick={() => setActiveTab('all')}
          style={{
            padding: '6px 12px',
            fontSize: '12.5px',
            fontWeight: activeTab === 'all' ? 600 : 500,
            color: activeTab === 'all' ? 'var(--text-primary)' : 'var(--text-secondary)',
            background: activeTab === 'all' ? 'var(--bg-card)' : 'transparent',
            border: '1px solid',
            borderColor: activeTab === 'all' ? 'var(--border-color) var(--border-color) var(--bg-card)' : 'transparent',
            borderRadius: '4px 4px 0 0',
            cursor: 'pointer',
            marginBottom: '-1px'
          }}
        >
          All {label}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('most-used')}
          style={{
            padding: '6px 12px',
            fontSize: '12.5px',
            fontWeight: activeTab === 'most-used' ? 600 : 500,
            color: activeTab === 'most-used' ? 'var(--text-primary)' : 'var(--text-secondary)',
            background: activeTab === 'most-used' ? 'var(--bg-card)' : 'transparent',
            border: '1px solid',
            borderColor: activeTab === 'most-used' ? 'var(--border-color) var(--border-color) var(--bg-card)' : 'transparent',
            borderRadius: '4px 4px 0 0',
            cursor: 'pointer',
            marginBottom: '-1px'
          }}
        >
          Most Used
        </button>
      </div>

      {/* 2. Scrollable Checkbox Checklist Container (Matching Screenshot 1) */}
      <div
        style={{
          border: '1px solid var(--border-color)',
          borderRadius: '0 0 4px 4px',
          background: 'rgba(0, 0, 0, 0.15)',
          padding: '10px 12px',
          maxHeight: '190px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px'
        }}
      >
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '12px', padding: '12px 0' }}>
            <Loader2 size={14} className="spin" /> Loading categories...
          </div>
        ) : categories.length === 0 ? (
          <div style={{ color: 'var(--text-muted)', fontSize: '12px', padding: '12px 0' }}>
            No categories created yet.
          </div>
        ) : activeTab === 'all' ? (
          allFlattenedHierarchy.map((cat) => {
            const checked = isChecked(cat._id, cat.depth);
            const indentPx = (cat.depth || 0) * 18;
            return (
              <label
                key={cat._id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginLeft: `${indentPx}px`,
                  fontSize: '13px',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  userSelect: 'none'
                }}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => handleToggle(cat)}
                  style={{
                    width: '15px',
                    height: '15px',
                    cursor: 'pointer',
                    accentColor: 'var(--primary-color, #6366f1)'
                  }}
                />
                {cat.depth === 2 && <span style={{ color: 'var(--text-dim)', marginRight: '2px', fontWeight: 600 }}>— —</span>}
                {cat.depth === 1 && <span style={{ color: 'var(--text-dim)', marginRight: '2px', fontWeight: 600 }}>—</span>}
                <span style={{ fontWeight: checked ? 600 : 400 }}>{cat.name}</span>
              </label>
            );
          })
        ) : (
          mostUsedCategories.map((rawCat) => {
            const cat = allFlattenedHierarchy.find(h => String(h._id) === String(rawCat._id)) || rawCat;
            const checked = isChecked(cat._id, cat.depth || 0);
            return (
              <label
                key={cat._id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '13px',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  userSelect: 'none'
                }}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => handleToggle(cat)}
                  style={{
                    width: '15px',
                    height: '15px',
                    cursor: 'pointer',
                    accentColor: 'var(--primary-color, #6366f1)'
                  }}
                />
                <span>{cat.name}</span>
              </label>
            );
          })
        )}
      </div>

      {/* 3. + Add New Category Link & Inline Form (Matching Screenshot 1) */}
      <div style={{ marginTop: '10px' }}>
        <button
          type="button"
          onClick={() => setShowAddForm(!showAddForm)}
          style={{
            background: 'none',
            border: 'none',
            padding: 0,
            fontSize: '12.5px',
            color: 'var(--primary-color, #38bdf8)',
            textDecoration: 'underline',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            fontWeight: 500
          }}
        >
          {showAddForm ? '— Hide Form' : `+ Add New ${label}`}
        </button>

        {showAddForm && (
          <form
            onSubmit={handleCreateCategory}
            style={{
              marginTop: '10px',
              padding: '10px',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}
          >
            <input
              type="text"
              placeholder={`New ${label} Name`}
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              className="form-input"
              style={{ fontSize: '12.5px', padding: '6px 10px' }}
              autoFocus
            />

            <select
              value={newCatParent}
              onChange={(e) => setNewCatParent(e.target.value)}
              className="form-select"
              style={{ fontSize: '12px', padding: '6px 10px' }}
            >
              <option value="">— Parent Category —</option>
              {selectableParents.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name}
                </option>
              ))}
            </select>

            {error && (
              <span style={{ fontSize: '11px', color: 'var(--danger)' }}>
                {error}
              </span>
            )}

            <button
              type="submit"
              disabled={creating}
              className="button button-small button-secondary"
              style={{ alignSelf: 'flex-start' }}
            >
              {creating ? <Loader2 size={12} className="spin" /> : <Plus size={12} />}
              {creating ? 'Adding...' : `Add New ${label}`}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default InlineCategoryCreator;

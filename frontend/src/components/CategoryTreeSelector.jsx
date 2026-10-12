import React, { useState, useEffect } from 'react';
import { categoryAPI } from '../services/api';
import { FolderTree, ChevronRight } from 'lucide-react';

const CategoryTreeSelector = ({
  selectedCategory,
  selectedSubCategory,
  onCategoryChange,
  onSubCategoryChange,
  type = 'all'
}) => {
  const [tree, setTree] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTree = async () => {
      try {
        const res = await categoryAPI.getTree({ type });
        if (res.tree) {
          setTree(res.tree);

          // If a category is already selected, populate its subcategories
          if (selectedCategory) {
            const found = res.tree.find((c) => c._id === selectedCategory);
            if (found && found.children) {
              setSubCategories(found.children);
            }
          }
        }
      } catch (err) {
        console.error('Category tree load error:', err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchTree();
  }, [type]);

  const handleMainCatChange = (catId) => {
    onCategoryChange(catId);
    onSubCategoryChange(''); // Reset sub-category

    const found = tree.find((c) => c._id === catId);
    if (found && found.children && found.children.length > 0) {
      setSubCategories(found.children);
    } else {
      setSubCategories([]);
    }
  };

  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.03)',
      border: '1px solid var(--border-color)',
      borderRadius: 'var(--radius-sm)',
      padding: '16px'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginBottom: '14px',
        color: 'var(--text-muted)',
        fontSize: '0.85rem',
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.05em'
      }}>
        <FolderTree size={16} color="var(--accent-primary)" />
        Assign Category Hierarchy
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '16px'
      }}>
        {/* Main Category */}
        <div>
          <label className="form-label">
            Main Category
          </label>
          <select
            className="form-select"
            value={selectedCategory || ''}
            onChange={(e) => handleMainCatChange(e.target.value)}
          >
            <option value="">-- Select Main Category --</option>
            {tree.map((cat) => (
              <option key={cat._id} value={cat._id}>
                {cat.name} ({cat.children?.length || 0} sub-categories)
              </option>
            ))}
          </select>
        </div>

        {/* Sub-Category */}
        <div>
          <label className="form-label">
            Sub-Category (Under Selected Parent)
          </label>
          <select
            className="form-select"
            value={selectedSubCategory || ''}
            onChange={(e) => onSubCategoryChange(e.target.value)}
            disabled={!selectedCategory || subCategories.length === 0}
          >
            <option value="">
              {!selectedCategory
                ? '-- Select Main Category first --'
                : subCategories.length === 0
                ? '-- No Sub-Categories available --'
                : '-- Select Sub-Category --'}
            </option>
            {subCategories.map((sub) => (
              <option key={sub._id} value={sub._id}>
                ↳ {sub.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Selected Tree Preview */}
      {selectedCategory && (
        <div style={{
          marginTop: '12px',
          padding: '8px 12px',
          background: 'var(--g-accent, rgba(99, 102, 241, 0.08))',
          borderRadius: 'var(--radius-sm)',
          fontSize: '0.82rem',
          color: 'var(--accent-primary)',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          <strong>Hierarchy Path:</strong>
          <span>{tree.find((c) => c._id === selectedCategory)?.name || 'Category'}</span>
          {selectedSubCategory && (
            <>
              <ChevronRight size={14} />
              <span>{subCategories.find((s) => s._id === selectedSubCategory)?.name || 'SubCategory'}</span>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default CategoryTreeSelector;

import React, { useState, useEffect } from 'react';
import { categoryAPI } from '../../services/api';
import {
  FolderTree,
  Plus,
  Edit2,
  Trash2,
  ChevronRight,
  ChevronDown,
  Layers,
  Image as ImageIcon,
  Check,
  X,
  AlertCircle
} from 'lucide-react';

const CategoryManager = () => {
  const [tree, setTree] = useState([]);
  const [allCategories, setAllCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);

  // Form states
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [parentCategory, setParentCategory] = useState('');
  const [type, setType] = useState('all');
  const [order, setOrder] = useState(0);
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [bannerFile, setBannerFile] = useState(null);
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [bannerUrl, setBannerUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Collapsed branches state
  const [expandedNodes, setExpandedNodes] = useState({});

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const [treeRes, flatRes] = await Promise.all([
        categoryAPI.getTree({ includeInactive: 'true' }),
        categoryAPI.getAll({ includeInactive: 'true' })
      ]);
      if (treeRes.tree) setTree(treeRes.tree);
      if (flatRes.categories) setAllCategories(flatRes.categories);

      // Default expand all root nodes
      const initialExpanded = {};
      treeRes.tree?.forEach((c) => {
        initialExpanded[c._id] = true;
      });
      setExpandedNodes(initialExpanded);
    } catch (err) {
      setError(err.message || 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const toggleExpand = (id) => {
    setExpandedNodes((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const openCreateModal = (presetParentId = '') => {
    setEditingCategory(null);
    setName('');
    setDescription('');
    setShortDescription('');
    setParentCategory(presetParentId);
    setType('all');
    setOrder(0);
    setThumbnailFile(null);
    setBannerFile(null);
    setThumbnailUrl('');
    setBannerUrl('');
    setError('');
    setModalOpen(true);
  };

  const openEditModal = (cat) => {
    setEditingCategory(cat);
    setName(cat.name || '');
    setDescription(cat.description || '');
    setShortDescription(cat.shortDescription || '');
    setParentCategory(cat.parentCategory?._id || cat.parentCategory || '');
    setType(cat.type || 'all');
    setOrder(cat.order || 0);
    setThumbnailFile(null);
    setBannerFile(null);
    setThumbnailUrl(cat.thumbnail || '');
    setBannerUrl(cat.banner || '');
    setError('');
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('description', description);
      formData.append('shortDescription', shortDescription);
      formData.append('parentCategory', parentCategory);
      formData.append('type', type);
      formData.append('order', order);

      if (thumbnailFile) {
        formData.append('thumbnail', thumbnailFile);
      } else if (thumbnailUrl) {
        formData.append('thumbnail', thumbnailUrl);
      }

      if (bannerFile) {
        formData.append('banner', bannerFile);
      } else if (bannerUrl) {
        formData.append('banner', bannerUrl);
      }

      if (editingCategory) {
        await categoryAPI.update(editingCategory._id, formData);
      } else {
        await categoryAPI.create(formData);
      }

      setModalOpen(false);
      fetchCategories();
    } catch (err) {
      setError(err.message || 'Error saving category');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (confirm(`Are you sure you want to delete category "${name}"? Sub-categories under it will be unlinked.`)) {
      try {
        await categoryAPI.delete(id);
        fetchCategories();
      } catch (err) {
        alert(err.message || 'Error deleting category');
      }
    }
  };

  return (
    <div>
      {/* Header Bar */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
        marginBottom: '24px'
      }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FolderTree size={24} color="var(--accent-primary)" />
            Category & Sub-Category Tree Hierarchy
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Organize content into parent categories and sub-categories (e.g. Indian ➔ Uncle ➔ Videos).
          </p>
        </div>

        <button onClick={() => openCreateModal('')} className="btn-primary">
          <Plus size={18} /> Add Category
        </button>
      </div>

      {error && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.15)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: 'var(--radius-sm)',
          padding: '12px 16px',
          color: '#f87171',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Hierarchical Tree Container */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-dim)' }}>
            Loading category hierarchy...
          </div>
        ) : tree.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '50px 20px' }}>
            <FolderTree size={48} style={{ color: 'var(--text-dim)', marginBottom: '12px' }} />
            <h3>No Categories Yet</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '20px' }}>
              Create your first root category (like "Indian" or "Travel") to get started.
            </p>
            <button onClick={() => openCreateModal('')} className="btn-primary">
              <Plus size={16} /> Create First Category
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {tree.map((rootCat) => (
              <div
                key={rootCat._id}
                style={{
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(255, 255, 255, 0.02)',
                  overflow: 'hidden'
                }}
              >
                {/* Main Root Category Row */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '16px 20px',
                  background: 'rgba(255, 255, 255, 0.04)',
                  borderBottom: expandedNodes[rootCat._id] && rootCat.children?.length > 0 ? '1px solid var(--border-color)' : 'none'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <button
                      onClick={() => toggleExpand(rootCat._id)}
                      style={{
                        background: 'none',
                        color: 'var(--text-muted)',
                        display: 'flex',
                        alignItems: 'center',
                        padding: '4px'
                      }}
                    >
                      {expandedNodes[rootCat._id] ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                    </button>

                    {rootCat.thumbnail ? (
                      <img
                        src={rootCat.thumbnail}
                        alt={rootCat.name}
                        style={{ width: '42px', height: '42px', borderRadius: '8px', objectFit: 'cover' }}
                      />
                    ) : (
                      <div style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: '8px',
                        background: 'var(--g-accent, rgba(99, 102, 241, 0.2))',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--accent-primary)'
                      }}>
                        <FolderTree size={20} />
                      </div>
                    )}

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: 700, fontSize: '1.05rem' }}>{rootCat.name}</span>
                        <span style={{
                          fontSize: '0.7rem',
                          background: 'var(--g-accent, rgba(99, 102, 241, 0.2))',
                          color: '#818cf8',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontWeight: 700
                        }}>
                          ROOT PARENT
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                          /category/{rootCat.slug}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        {rootCat.description || 'No description'} • Applies to: <strong style={{ color: 'var(--text-main)' }}>{rootCat.type}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Actions on Root Category */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                      onClick={() => openCreateModal(rootCat._id)}
                      className="btn-secondary"
                      style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                      title="Add Sub-category under this parent"
                    >
                      <Plus size={14} /> Add Sub-Category
                    </button>
                    <button
                      onClick={() => openEditModal(rootCat)}
                      style={{
                        background: 'none',
                        color: 'var(--text-muted)',
                        padding: '6px',
                        display: 'flex'
                      }}
                      title="Edit Category"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(rootCat._id, rootCat.name)}
                      style={{
                        background: 'none',
                        color: '#f87171',
                        padding: '6px',
                        display: 'flex'
                      }}
                      title="Delete Category"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {/* Sub-Categories Tree Branch */}
                {expandedNodes[rootCat._id] && (
                  <div style={{ padding: '12px 20px 16px 56px', background: 'rgba(0, 0, 0, 0.2)' }}>
                    {(!rootCat.children || rootCat.children.length === 0) ? (
                      <div style={{
                        padding: '12px',
                        fontSize: '0.85rem',
                        color: 'var(--text-dim)',
                        fontStyle: 'italic',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}>
                        <span>No sub-categories yet under "{rootCat.name}".</span>
                        <button
                          onClick={() => openCreateModal(rootCat._id)}
                          style={{ background: 'none', color: 'var(--accent-primary)', fontSize: '0.82rem', fontWeight: 600 }}
                        >
                          + Add Sub-category (e.g. Uncle)
                        </button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {rootCat.children.map((sub) => (
                          <div
                            key={sub._id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '10px 14px',
                              background: 'rgba(255, 255, 255, 0.03)',
                              borderRadius: 'var(--radius-sm)',
                              borderLeft: '3px solid var(--accent-primary)'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <ChevronRight size={14} color="var(--accent-primary)" />
                              {sub.thumbnail ? (
                                <img
                                  src={sub.thumbnail}
                                  alt={sub.name}
                                  style={{ width: '32px', height: '32px', borderRadius: '6px', objectFit: 'cover' }}
                                />
                              ) : (
                                <div style={{
                                  width: '32px',
                                  height: '32px',
                                  borderRadius: '6px',
                                  background: 'rgba(255, 255, 255, 0.06)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: 'var(--text-dim)'
                                }}>
                                  <Layers size={16} />
                                </div>
                              )}
                              <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <span style={{ fontWeight: 600, fontSize: '0.92rem' }}>{sub.name}</span>
                                  <span style={{
                                    fontSize: '0.65rem',
                                    padding: '1px 6px',
                                    borderRadius: '4px',
                                    background: 'var(--g-accent, rgba(16, 185, 129, 0.15))',
                                    color: '#34d399',
                                    fontWeight: 700
                                  }}>
                                    SUB-CATEGORY
                                  </span>
                                  <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                                    /category/{sub.slug}
                                  </span>
                                </div>
                                <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                                  {sub.description || 'No description'} • Type: {sub.type || 'all'}
                                </div>
                              </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <button
                                onClick={() => openEditModal(sub)}
                                style={{ background: 'none', color: 'var(--text-muted)', padding: '4px' }}
                                title="Edit Sub-Category"
                              >
                                <Edit2 size={15} />
                              </button>
                              <button
                                onClick={() => handleDelete(sub._id, sub.name)}
                                style={{ background: 'none', color: '#f87171', padding: '4px' }}
                                title="Delete Sub-Category"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      {modalOpen && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div
            className="modal-content"
            style={{ maxWidth: '600px', padding: '28px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1.25rem' }}>
                {editingCategory ? 'Edit Category' : 'Create Category / Sub-Category'}
              </h3>
              <button onClick={() => setModalOpen(false)} style={{ background: 'none', color: 'var(--text-dim)' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Category Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Indian, Uncle, Travel, Comedy..."
                  className="form-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              {/* Parent Category Selector */}
              <div className="form-group">
                <label className="form-label">
                  Parent Category (Leave empty if this is a Main/Root Category)
                </label>
                <select
                  className="form-select"
                  value={parentCategory}
                  onChange={(e) => setParentCategory(e.target.value)}
                >
                  <option value="">-- None (Top-Level Main Category) --</option>
                  {allCategories
                    .filter((c) => !editingCategory || c._id !== editingCategory._id)
                    .map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.parentCategory ? `↳ ${c.name}` : c.name}
                      </option>
                    ))}
                </select>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '4px' }}>
                  If you choose a parent category, this category will automatically become its sub-category.
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  className="form-textarea"
                  rows={3}
                  placeholder="Short description for visitors and SEO..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

                            <div className="form-group">
                <label className="form-label">Short Description (Banner Subtitle)</label>
                <textarea
                  className="form-textarea"
                  rows={2}
                  placeholder="Short summary displayed on category hero banner..."
                  value={shortDescription}
                  onChange={(e) => setShortDescription(e.target.value)}
                />
                <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '4px' }}>
                  Appears directly on the category hero banner.
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Applies To Content</label>
                  <select
                    className="form-select"
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                  >
                    <option value="all">All Content</option>
                    <option value="video">Videos Only</option>
                    <option value="gallery">Galleries Only</option>
                    <option value="post">Posts / Stories Only</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Display Order</label>
                  <input
                    type="number"
                    className="form-input"
                    value={order}
                    onChange={(e) => setOrder(e.target.value)}
                  />
                </div>
              </div>

              {/* Image Uploads */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="form-group">
                  <label className="form-label">Thumbnail (Image{type === 'video' ? ' / Video' : ''})</label>
                  <input
                    type="file"
                    accept={type === 'video' ? 'image/*,video/*' : 'image/*'}
                    className="form-input"
                    onChange={(e) => setThumbnailFile(e.target.files[0])}
                  />
                  {!thumbnailFile && (
                    <input
                      type="text"
                      placeholder="Or enter image URL..."
                      className="form-input"
                      style={{ marginTop: '6px', fontSize: '0.82rem' }}
                      value={thumbnailUrl}
                      onChange={(e) => setThumbnailUrl(e.target.value)}
                    />
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">Top Banner (Image{type === 'video' ? ' / Video' : ''})</label>
                  <input
                    type="file"
                    accept={type === 'video' ? 'image/*,video/*' : 'image/*'}
                    className="form-input"
                    onChange={(e) => setBannerFile(e.target.files[0])}
                  />
                  {!bannerFile && (
                    <input
                      type="text"
                      placeholder="Or enter banner URL..."
                      className="form-input"
                      style={{ marginTop: '6px', fontSize: '0.82rem' }}
                      value={bannerUrl}
                      onChange={(e) => setBannerUrl(e.target.value)}
                    />
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={submitting}
                >
                  {submitting ? 'Saving...' : editingCategory ? 'Save Changes' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryManager;

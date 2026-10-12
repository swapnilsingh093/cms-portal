import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { categoryAPI } from '../../services/api';
import MediaPickerModal from '../../components/admin/MediaPickerModal';
import {
  Plus,
  Edit2,
  Trash2,
  Folder,
  Search,
  AlertCircle,
  CheckCircle,
  Image as ImageIcon,
  Upload,
  X,
  ExternalLink,
  Copy,
  Check
} from 'lucide-react';

const CategoryTaxonomyManager = ({
  taxonomyType = 'video', // 'video' | 'post' | 'gallery'
  title = 'Video Categories'
}) => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form State
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [parentCategory, setParentCategory] = useState('');
  const [description, setDescription] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [thumbnailPreview, setThumbnailPreview] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Media Picker Modal State
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);

  // Edit Mode
  const [editingCategory, setEditingCategory] = useState(null);
  const [search, setSearch] = useState('');
  const [copied, setCopied] = useState(false);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await categoryAPI.getAll({ type: taxonomyType, strict: 'false', includeInactive: 'true' });
      if (res.categories) {
        setCategories(res.categories);
      }
    } catch (err) {
      setError(err.message || 'Error fetching categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [taxonomyType]);

  const handleFileSelect = (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file');
      return;
    }
    setError('');
    setThumbnailFile(file);
    setThumbnailUrl('');
    setThumbnailPreview(URL.createObjectURL(file));
  };

  const handleSelectFromMedia = (mediaItem) => {
    if (!mediaItem || !mediaItem.url) return;
    setThumbnailFile(null);
    setThumbnailUrl(mediaItem.url);
    setThumbnailPreview(mediaItem.url);
    setMediaPickerOpen(false);
  };

  const handleRemoveThumbnail = () => {
    setThumbnailFile(null);
    setThumbnailUrl('');
    setThumbnailPreview('');
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter a category name');
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const formData = new FormData();
      formData.append('name', name);
      if (slug) formData.append('slug', slug);
      if (description) formData.append('description', description);
      if (shortDescription) formData.append('shortDescription', shortDescription);
      if (parentCategory) formData.append('parentCategory', parentCategory);
      formData.append('type', taxonomyType);

      if (thumbnailFile) {
        formData.append('thumbnail', thumbnailFile);
      } else {
        formData.append('thumbnail', thumbnailUrl || '');
      }

      if (editingCategory) {
        await categoryAPI.update(editingCategory._id, formData);
        setSuccess(`Category "${name}" updated successfully!`);
        setEditingCategory(null);
      } else {
        await categoryAPI.create(formData);
        setSuccess(`Category "${name}" added successfully!`);
      }

      // Reset form
      setName('');
      setSlug('');
      setParentCategory('');
      setDescription('');
      setShortDescription('');
      setThumbnailFile(null);
      setThumbnailUrl('');
      setThumbnailPreview('');
      fetchCategories();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Error saving category');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (cat) => {
    navigate(`/admin/categories/edit/${cat._id}`);
  };

  const handleCancelEdit = () => {
    setEditingCategory(null);
    setName('');
    setSlug('');
    setParentCategory('');
    setDescription('');
      setShortDescription('');
    setThumbnailFile(null);
    setThumbnailUrl('');
    setThumbnailPreview('');
  };

  const handleDelete = async (id, catName) => {
    if (window.confirm(`Are you sure you want to delete category "${catName}"?`)) {
      try {
        await categoryAPI.delete(id);
        setSuccess(`Category "${catName}" deleted.`);
        fetchCategories();
      } catch (err) {
        setError(err.message || 'Error deleting category');
      }
    }
  };

  // Build 3-level hierarchical list: Root (Level 1) -> Subcategory (Level 2) -> Child (Level 3)
  const categoryTree = useMemo(() => {
    const parentIdOf = (c) => (c.parentCategory?._id ? c.parentCategory._id : c.parentCategory);
    const childrenMap = {};
    const roots = [];

    categories.forEach((cat) => {
      const pId = parentIdOf(cat);
      if (!pId) {
        roots.push(cat);
      } else {
        if (!childrenMap[pId]) childrenMap[pId] = [];
        childrenMap[pId].push(cat);
      }
    });

    const flatten = (items, depth = 0) => {
      let result = [];
      items.forEach((item) => {
        result.push({ ...item, depth });
        const kids = childrenMap[item._id] || [];
        if (kids.length > 0) {
          result = result.concat(flatten(kids, depth + 1));
        }
      });
      return result;
    };

    return flatten(roots, 0);
  }, [categories]);

  const filteredCategories = categories.filter((c) =>
    search ? c.name.toLowerCase().includes(search.toLowerCase()) : true
  );

  const getCategoryCount = (cat) => {
    if (taxonomyType === 'video') return cat.videoCount ?? 0;
    if (taxonomyType === 'gallery') return cat.galleryCount ?? 0;
    if (taxonomyType === 'post') return cat.postCount ?? 0;
    return (cat.videoCount || 0) + (cat.postCount || 0) + (cat.galleryCount || 0);
  };

  const getCategoryItemsUrl = (catId) => {
    if (taxonomyType === 'video') return `/admin/videos?category=${catId}`;
    if (taxonomyType === 'gallery') return `/admin/gallery?category=${catId}`;
    return `/admin/posts?category=${catId}`;
  };

  const getPublicCategoryPath = () => {
    if (!slug) return '';
    const section = taxonomyType === 'video' ? 'videos' : taxonomyType === 'gallery' ? 'galleries' : 'stories';
    if (parentCategory) {
      const parentObj = categories.find((c) => c._id === parentCategory);
      if (parentObj) {
        const grandParentId = parentObj.parentCategory?._id || parentObj.parentCategory;
        if (grandParentId) {
          const grandParentObj = categories.find((c) => c._id === grandParentId);
          if (grandParentObj) {
            return `/${section}/${grandParentObj.slug}/${parentObj.slug}/${slug}`;
          }
        }
        return `/${section}/${parentObj.slug}/${slug}`;
      }
    }
    return `/${section}/${slug}`;
  };

  return (
    <div style={{ maxWidth: '1400px' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 600, margin: 0 }}>
            {title}
          </h1>
          <p style={{ fontSize: '13px', marginTop: '4px', color: 'var(--text-muted)' }}>
            Manage {taxonomyType} categories and subcategories independently.
          </p>
        </div>

        {/* Search */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input
            type="text"
            placeholder="Search Categories..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="form-input"
            style={{ width: '220px', padding: '5px 10px', fontSize: '13px' }}
          />
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div
          style={{
            padding: '12px 16px',
            borderRadius: '6px',
            background: 'var(--danger-bg)',
            color: 'var(--danger)',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '13px',
            border: '1px solid var(--danger)'
          }}
        >
          <AlertCircle size={16} />
          <span>{error}</span>
          <button
            onClick={() => setError('')}
            style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}
          >
            ×
          </button>
        </div>
      )}

      {success && (
        <div
          style={{
            padding: '12px 16px',
            borderRadius: '6px',
            background: 'var(--success-bg)',
            color: 'var(--success)',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '13px',
            border: '1px solid var(--success)'
          }}
        >
          <CheckCircle size={16} />
          <span>{success}</span>
          <button
            onClick={() => setSuccess('')}
            style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}
          >
            ×
          </button>
        </div>
      )}

      {/* Main 2-Column Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '400px 1fr', gap: '24px' }}>
        {/* Left Column: Form */}
        <div className="postbox">
          <div className="postbox-header">
            <h3>{editingCategory ? 'Edit Category' : 'Add New Category'}</h3>
          </div>
          <div className="postbox-inside" style={{ padding: '16px' }}>
            <form onSubmit={handleSubmit}>
              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label className="form-label">Name *</label>
                <input
                  type="text"
                  className="form-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Indian, Nature, Technology"
                  required
                />
                <div className="form-description">
                  The name is how it appears on your site.
                </div>

                {/* Category Direct Access Link / Permalink (WordPress Style) */}
                {editingCategory && slug && (
                  <div
                    style={{
                      marginTop: '8px',
                      padding: '8px 10px',
                      background: 'rgba(59, 130, 246, 0.08)',
                      border: '1px solid rgba(59, 130, 246, 0.22)',
                      borderRadius: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '8px',
                      fontSize: '12px'
                    }}
                  >
                    <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0, flex: 1 }}>
                      <span style={{ color: 'var(--text-muted)', fontWeight: 600, marginRight: '4px' }}>Permalink:</span>
                      <a
                        href={getPublicCategoryPath()}
                        target="_blank"
                        rel="noreferrer"
                        style={{ color: '#60a5fa', textDecoration: 'none', fontWeight: 500 }}
                        onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
                        onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
                        title="Open category page"
                      >
                        {`${window.location.origin}${getPublicCategoryPath()}`}
                      </a>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(`${window.location.origin}${getPublicCategoryPath()}`);
                          setCopied(true);
                          setTimeout(() => setCopied(false), 2000);
                        }}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '3px',
                          background: 'rgba(255, 255, 255, 0.08)',
                          border: '1px solid rgba(255, 255, 255, 0.12)',
                          borderRadius: '4px',
                          color: copied ? '#4ade80' : 'var(--text-secondary)',
                          padding: '2px 8px',
                          fontSize: '11px',
                          cursor: 'pointer'
                        }}
                        title="Copy link"
                      >
                        {copied ? <Check size={11} /> : <Copy size={11} />}
                        <span>{copied ? 'Copied' : 'Copy'}</span>
                      </button>
                      <a
                        href={getPublicCategoryPath()}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '3px',
                          background: 'rgba(59, 130, 246, 0.2)',
                          border: '1px solid rgba(59, 130, 246, 0.4)',
                          borderRadius: '4px',
                          color: '#93c5fd',
                          padding: '2px 8px',
                          fontSize: '11px',
                          textDecoration: 'none',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        <ExternalLink size={11} /> View
                      </a>
                    </div>
                  </div>
                )}
              </div>

              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label className="form-label">Slug</label>
                <input
                  type="text"
                  className="form-input"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="e.g. indian (leave blank to auto-generate)"
                />
                <div className="form-description">
                  The “slug” is the URL-friendly version of the name. It is usually all lowercase and contains only letters, numbers, and hyphens.
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label className="form-label">Parent Category</label>
                <select
                  className="form-select"
                  value={parentCategory}
                  onChange={(e) => setParentCategory(e.target.value)}
                >
                  <option value="">None (Top-Level Category)</option>
                  {categoryTree
                    .filter((c) => c.depth < 2) // Level 1 and Level 2 can be selected as parents (making new category up to Level 3)
                    .filter((c) => !editingCategory || c._id !== editingCategory._id)
                    .map((cat) => (
                      <option key={cat._id} value={cat._id}>
                        {cat.depth === 1 ? `— ${cat.name}` : cat.name}
                      </option>
                    ))}
                </select>
                <div className="form-description">
                  Categories can have a hierarchy. You might have a parent category like <strong>Indian</strong>, and under that have subcategories like <strong>Uncle</strong>.
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label className="form-label">Description</label>
                <textarea
                  className="form-textarea"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="Brief description of this category..."
                />
              </div>

                            <div className="form-group" style={{ marginBottom: '14px' }}>
                <label className="form-label" style={{ fontWeight: 600 }}>Short Description (Banner Subtitle)</label>
                <textarea
                  className="form-textarea"
                  value={shortDescription}
                  onChange={(e) => setShortDescription(e.target.value)}
                  rows={2}
                  placeholder="Enter short description to display on category hero banner..."
                />
                <div className="form-description">
                  Appears directly inside the hero banner info box for this category or subcategory.
                </div>
              </div>

              {/* Category Image / Thumbnail with Media Picker, Upload, and Drag & Drop */}
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label className="form-label" style={{ fontWeight: 600 }}>
                  Category Image / Thumbnail
                </label>

                {thumbnailPreview ? (
                  <div>
                    <div
                      style={{
                        position: 'relative',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        border: '1px solid var(--border-color)',
                        background: '#090e18',
                        marginBottom: '10px'
                      }}
                    >
                      <img
                        src={thumbnailPreview}
                        alt="Category Thumbnail Preview"
                        style={{
                          width: '100%',
                          height: '140px',
                          objectFit: 'cover',
                          display: 'block'
                        }}
                      />
                    </div>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        onClick={() => setMediaPickerOpen(true)}
                        className="button button-neutral button-small"
                        style={{ fontSize: '11.5px', gap: '4px' }}
                      >
                        <ImageIcon size={13} /> Select from Media
                      </button>
                      <label
                        className="button button-neutral button-small"
                        style={{ cursor: 'pointer', fontSize: '11.5px', gap: '4px' }}
                      >
                        <Upload size={13} /> Upload from System
                        <input
                          type="file"
                          accept="image/*"
                          style={{ display: 'none' }}
                          onChange={(e) => handleFileSelect(e.target.files?.[0])}
                        />
                      </label>
                      <button
                        type="button"
                        onClick={handleRemoveThumbnail}
                        className="button button-neutral button-small"
                        style={{ fontSize: '11.5px', gap: '4px' }}
                      >
                        <Trash2 size={13} /> Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      style={{
                        border: `2px dashed ${isDragging ? 'var(--primary-color)' : 'var(--border-color)'}`,
                        background: isDragging ? 'var(--g-accent, rgba(99, 102, 241, 0.12))' : 'rgba(255, 255, 255, 0.02)',
                        borderRadius: '8px',
                        padding: '24px 16px',
                        textAlign: 'center',
                        transition: 'all 0.2s ease',
                        marginBottom: '8px',
                        cursor: 'pointer'
                      }}
                      onClick={() => setMediaPickerOpen(true)}
                    >
                      <ImageIcon
                        size={32}
                        style={{
                          color: isDragging ? 'var(--primary-color)' : 'var(--text-dim)',
                          marginBottom: '8px',
                          transition: 'transform 0.2s',
                          transform: isDragging ? 'scale(1.15)' : 'scale(1)'
                        }}
                      />
                      <p style={{ margin: '0 0 4px', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {isDragging ? 'Drop image here...' : 'Drag & drop category image here'}
                      </p>
                      <p style={{ margin: '0 0 14px', fontSize: '11px', color: 'var(--text-muted)' }}>
                        or choose an option below
                      </p>

                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }} onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => setMediaPickerOpen(true)}
                          className="button button-neutral button-small"
                          style={{ fontSize: '11.5px', gap: '4px' }}
                        >
                          <ImageIcon size={13} /> Select from Media
                        </button>
                        <label
                          className="button button-neutral button-small"
                          style={{ cursor: 'pointer', fontSize: '11.5px', gap: '4px' }}
                        >
                          <Upload size={13} /> Upload from System
                          <input
                            type="file"
                            accept="image/*"
                            style={{ display: 'none' }}
                            onChange={(e) => handleFileSelect(e.target.files?.[0])}
                          />
                        </label>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                <button
                  type="submit"
                  disabled={submitting}
                  className="button button-primary"
                  style={{ flex: 1 }}
                >
                  {submitting
                    ? 'Saving...'
                    : editingCategory
                    ? 'Update Category'
                    : 'Add New Category'}
                </button>

                {editingCategory && (
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="button button-neutral"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* Right Column: WordPress Category List Table */}
        <div className="postbox">
          <div className="postbox-header">
            <h3>{title} List ({categories.length})</h3>
          </div>
          <div style={{ padding: 0 }}>
            {loading ? (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                Loading categories...
              </div>
            ) : filteredCategories.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                No categories found. Create one using the form on the left.
              </div>
            ) : (
              <table className="cms-table">
                <thead>
                  <tr>
                    <th style={{ width: '48px' }}>Image</th>
                    <th>Name</th>
                    <th>Slug</th>
                    <th style={{ width: '90px', textAlign: 'center' }}>Count</th>
                  </tr>
                </thead>
                <tbody>
                  {categoryTree
                    .filter((c) =>
                      search ? c.name.toLowerCase().includes(search.toLowerCase()) : true
                    )
                    .map((cat) => {
                      const isRoot = cat.depth === 0;
                      const isLevel2 = cat.depth === 1;
                      const isLevel3 = cat.depth >= 2;
                      const imgIndent = isLevel3 ? '16px' : isLevel2 ? '8px' : '0px';
                      const imgSize = isRoot ? '36px' : '32px';

                      return (
                        <tr key={cat._id}>
                          <td>
                            <div
                              style={{
                                width: imgSize,
                                height: imgSize,
                                borderRadius: '6px',
                                overflow: 'hidden',
                                background: '#090e18',
                                marginLeft: imgIndent,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                            >
                              {cat.thumbnail ? (
                                <img
                                  src={cat.thumbnail}
                                  alt={cat.name}
                                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                    if (e.currentTarget.nextSibling) e.currentTarget.nextSibling.style.display = 'flex';
                                  }}
                                />
                              ) : null}
                              <div
                                style={{
                                  width: '100%',
                                  height: '100%',
                                  display: cat.thumbnail ? 'none' : 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: 'var(--text-dim)'
                                }}
                              >
                                <Folder size={isRoot ? 16 : 14} />
                              </div>
                            </div>
                          </td>
                          <td>
                            {isLevel3 && <span style={{ marginRight: '6px', color: 'var(--text-dim)', fontWeight: 600 }}>— —</span>}
                            {isLevel2 && <span style={{ marginRight: '6px', color: 'var(--text-dim)', fontWeight: 600 }}>—</span>}
                            <a
                              href={`/admin/categories/edit/${cat._id}`}
                              onClick={(e) => {
                                e.preventDefault();
                                handleEdit(cat);
                              }}
                              style={{
                                fontSize: '13.5px',
                                fontWeight: isRoot ? 600 : 500,
                                color: 'var(--text-primary)',
                                textDecoration: 'none'
                              }}
                              className="row-title"
                            >
                              {cat.name}
                            </a>
                            <div className="row-actions" style={{ marginLeft: isRoot ? '0px' : isLevel3 ? '24px' : '12px' }}>
                              <button type="button" onClick={() => handleEdit(cat)}>Edit</button>
                              <span>|</span>
                              <button
                                type="button"
                                onClick={() => handleDelete(cat._id, cat.name)}
                                className="trash"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                          <td style={{ fontFamily: 'monospace', fontSize: '12px', color: 'var(--text-muted)' }}>
                            {cat.slug}
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <Link
                              to={getCategoryItemsUrl(cat._id)}
                              title={`View ${taxonomyType}s in ${cat.name}`}
                              style={{
                                display: 'inline-block',
                                padding: '3px 10px',
                                borderRadius: '12px',
                                background: isRoot ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.10)',
                                color: '#60a5fa',
                                fontSize: '12px',
                                fontWeight: 600,
                                textDecoration: 'none',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = '#3b82f6';
                                e.currentTarget.style.color = '#ffffff';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = isRoot ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.10)';
                                e.currentTarget.style.color = '#60a5fa';
                              }}
                            >
                              {getCategoryCount(cat)}
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Media Picker Modal */}
      <MediaPickerModal
        isOpen={mediaPickerOpen}
        onClose={() => setMediaPickerOpen(false)}
        onSelect={handleSelectFromMedia}
        mediaType="image"
        title="Select Category Thumbnail from Media Library"
      />
    </div>
  );
};

export default CategoryTaxonomyManager;

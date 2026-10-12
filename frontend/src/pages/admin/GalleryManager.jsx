import React, { useState, useEffect } from 'react';
import { galleryAPI, categoryAPI } from '../../services/api';
import {
  Image as ImageIcon,
  Plus,
  Trash2,
  Upload,
  Search,
  CheckCircle,
  AlertCircle,
  X,
  Star,
  Sparkles
} from 'lucide-react';

const GalleryManager = ({ initialAction = 'list' }) => {
  const [viewMode, setViewMode] = useState(initialAction === 'new' ? 'edit' : 'list');
  const [editingGallery, setEditingGallery] = useState(null);

  // Status Filter Tabs
  const [currentTab, setCurrentTab] = useState('all');
  const [galleries, setGalleries] = useState([]);
  const [statusCounts, setStatusCounts] = useState({ all: 0, published: 0, draft: 0, trash: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Gallery Categories
  const [galleryCategories, setGalleryCategories] = useState([]);

  // Form Fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSubCategory, setSelectedSubCategory] = useState('');
  const [status, setStatus] = useState('published');
  const [tags, setTags] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [coverImageFile, setCoverImageFile] = useState(null);
  const [existingImages, setExistingImages] = useState([]);
  const [newImageFiles, setNewImageFiles] = useState([]);
  const [newImagePreviews, setNewImagePreviews] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const fetchGalleries = async () => {
    setLoading(true);
    try {
      const res = await galleryAPI.getAll({
        status: currentTab,
        search
      });
      if (res.galleries) setGalleries(res.galleries);
      if (res.statusCounts) setStatusCounts(res.statusCounts);
    } catch (err) {
      setError(err.message || 'Error fetching galleries');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await categoryAPI.getAll({ type: 'gallery', strict: 'false' });
      if (res.categories) setGalleryCategories(res.categories);
    } catch (e) {
      console.error('Error fetching gallery categories:', e.message);
    }
  };

  useEffect(() => {
    fetchGalleries();
    fetchCategories();
  }, [currentTab, search]);

  useEffect(() => {
    if (initialAction === 'new') {
      openAddForm();
    }
  }, [initialAction]);

  const openAddForm = () => {
    setEditingGallery(null);
    setTitle('');
    setDescription('');
    setSelectedCategory('');
    setSelectedSubCategory('');
    setStatus('published');
    setTags('');
    setCoverImageUrl('');
    setCoverImageFile(null);
    setExistingImages([]);
    setNewImageFiles([]);
    setNewImagePreviews([]);
    setError('');
    setSuccess('');
    setViewMode('edit');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openEditForm = (gal) => {
    setEditingGallery(gal);
    setTitle(gal.title || '');
    setDescription(gal.description || '');
    setSelectedCategory(gal.category?._id || gal.category || '');
    setSelectedSubCategory(gal.subCategory?._id || gal.subCategory || '');
    setStatus(gal.status || 'published');
    setTags(gal.tags ? gal.tags.join(', ') : '');
    setCoverImageUrl(gal.coverImage || '');
    setCoverImageFile(null);
    setExistingImages(gal.images || []);
    setNewImageFiles([]);
    setNewImagePreviews([]);
    setError('');
    setSuccess('');
    setViewMode('edit');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle Multi-file Drag & Drop / Selection
  const handleImagesSelected = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    setNewImageFiles((prev) => [...prev, ...files]);

    const newPreviews = files.map((file) => ({
      file,
      url: URL.createObjectURL(file),
      name: file.name
    }));

    setNewImagePreviews((prev) => [...prev, ...newPreviews]);

    // Automatic Gallery Thumbnail Generation:
    // If no cover image is set yet, automatically set the first uploaded image as cover!
    if (!coverImageUrl && !coverImageFile && newPreviews.length > 0) {
      setCoverImageUrl(newPreviews[0].url);
    }
  };

  // Remove new file from pending upload
  const removePendingImage = (index) => {
    setNewImageFiles((prev) => prev.filter((_, i) => i !== index));
    setNewImagePreviews((prev) => {
      const removed = prev[index];
      if (removed) URL.revokeObjectURL(removed.url);
      const remaining = prev.filter((_, i) => i !== index);
      // If removed was cover, fallback to first available
      if (coverImageUrl === removed?.url) {
        setCoverImageUrl(remaining[0]?.url || existingImages[0]?.url || '');
      }
      return remaining;
    });
  };

  // Remove existing saved image
  const removeExistingImage = (index) => {
    setExistingImages((prev) => {
      const removed = prev[index];
      const remaining = prev.filter((_, i) => i !== index);
      if (coverImageUrl === removed?.url) {
        setCoverImageUrl(remaining[0]?.url || newImagePreviews[0]?.url || '');
      }
      return remaining;
    });
  };

  // Set explicit cover
  const handleSetAsCover = (url) => {
    setCoverImageUrl(url);
    setCoverImageFile(null);
  };

  // Custom Cover File upload
  const handleCustomCoverFile = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCoverImageFile(file);
      setCoverImageUrl(URL.createObjectURL(file));
    }
  };

  // Submit Handler
  const handleSubmit = async (submitStatus) => {
    if (!title.trim()) {
      setError('Please enter a gallery title');
      return;
    }

    if (existingImages.length === 0 && newImageFiles.length === 0) {
      setError('Please add at least one photo to the gallery');
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('status', submitStatus || status);
      if (selectedCategory) formData.append('category', selectedCategory);
      if (selectedSubCategory) formData.append('subCategory', selectedSubCategory);
      if (tags) formData.append('tags', tags);

      // Existing images to retain
      formData.append('existingImages', JSON.stringify(existingImages));

      // Append new gallery images
      newImageFiles.forEach((file) => {
        formData.append('galleryImages', file);
      });

      // Cover image handling
      if (coverImageFile) {
        formData.append('coverImage', coverImageFile);
      } else if (coverImageUrl && !coverImageUrl.startsWith('blob:')) {
        formData.append('coverImage', coverImageUrl);
      }

      if (editingGallery) {
        await galleryAPI.update(editingGallery._id, formData);
        setSuccess(`Gallery "${title}" updated successfully!`);
      } else {
        await galleryAPI.create(formData);
        setSuccess(`Gallery "${title}" published successfully!`);
      }

      setViewMode('list');
      fetchGalleries();
    } catch (err) {
      setError(err.message || 'Error saving gallery');
    } finally {
      setSubmitting(false);
    }
  };

  // Trash, Restore, Delete Permanent
  const handleTrashGallery = async (id, galTitle) => {
    if (window.confirm(`Move "${galTitle}" to trash?`)) {
      try {
        await galleryAPI.delete(id, false);
        setSuccess('Gallery moved to trash.');
        fetchGalleries();
      } catch (err) {
        setError(err.message || 'Error trashing gallery');
      }
    }
  };

  const handleRestoreGallery = async (id) => {
    try {
      await galleryAPI.restore(id);
      setSuccess('Gallery restored to Drafts.');
      fetchGalleries();
    } catch (err) {
      setError(err.message || 'Error restoring gallery');
    }
  };

  const handlePermanentDelete = async (id, galTitle) => {
    if (window.confirm(`Permanently delete "${galTitle}"? This cannot be undone.`)) {
      try {
        await galleryAPI.delete(id, true);
        setSuccess('Gallery permanently deleted.');
        fetchGalleries();
      } catch (err) {
        setError(err.message || 'Error deleting gallery');
      }
    }
  };

  const rootCats = galleryCategories.filter((c) => !c.parentCategory);
  const availableSubCats = selectedCategory
    ? galleryCategories.filter((c) => {
        if (!c.parentCategory) return false;
        const pId = typeof c.parentCategory === 'object' ? c.parentCategory._id : c.parentCategory;
        return pId && String(pId) === String(selectedCategory);
      })
    : [];

  return (
    <div style={{ maxWidth: '1400px' }}>
      {/* Notifications */}
      {error && (
        <div
          style={{
            background: '#fcf0f1',
            borderLeft: '4px solid #d63638',
            padding: '10px 14px',
            marginBottom: '16px',
            fontSize: '13px',
            color: '#2c3338'
          }}
        >
          {error}
        </div>
      )}

      {success && (
        <div
          style={{
            background: '#edf7ed',
            borderLeft: '4px solid #007017',
            padding: '10px 14px',
            marginBottom: '16px',
            fontSize: '13px',
            color: '#1e4620'
          }}
        >
          {success}
        </div>
      )}

      {/* ====================================================================
          MODE 1: ALL GALLERIES LIST TABLE
          ==================================================================== */}
      {viewMode === 'list' && (
        <div>
          {/* Header Bar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <h1 style={{ fontSize: '22px', fontWeight: 600, color: '#1d2327', margin: 0 }}>
                Photo Galleries
              </h1>
              <button onClick={openAddForm} className="button button-primary">
                <Plus size={14} /> Add New Gallery
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="text"
                placeholder="Search Galleries..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="form-input"
                style={{ width: '220px', padding: '5px 10px', fontSize: '13px' }}
              />
            </div>
          </div>

          {/* Status Tabs */}
          <ul className="subsubsub">
            <li>
              <button
                className={currentTab === 'all' ? 'current' : ''}
                onClick={() => setCurrentTab('all')}
              >
                All <span className="count">({statusCounts.all})</span>
              </button>
            </li>
            <li>
              <button
                className={currentTab === 'published' ? 'current' : ''}
                onClick={() => setCurrentTab('published')}
              >
                Published <span className="count">({statusCounts.published})</span>
              </button>
            </li>
            <li>
              <button
                className={currentTab === 'draft' ? 'current' : ''}
                onClick={() => setCurrentTab('draft')}
              >
                Drafts <span className="count">({statusCounts.draft})</span>
              </button>
            </li>
            {statusCounts.trash > 0 && (
              <li>
                <button
                  className={currentTab === 'trash' ? 'current' : ''}
                  onClick={() => setCurrentTab('trash')}
                >
                  Trash <span className="count">({statusCounts.trash})</span>
                </button>
              </li>
            )}
          </ul>

          {/* Table */}
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', background: '#ffffff', border: '1px solid #c3c4c7', borderRadius: '4px', color: '#646970' }}>
              Loading galleries...
            </div>
          ) : galleries.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', background: '#ffffff', border: '1px solid #c3c4c7', borderRadius: '4px', color: '#646970' }}>
              No galleries found. <button onClick={openAddForm} className="button button-primary" style={{ marginLeft: '10px' }}>Create a Gallery</button>
            </div>
          ) : (
            <table className="wp-list-table">
              <thead>
                <tr>
                  <th style={{ width: '80px' }}>Cover</th>
                  <th>Title</th>
                  <th>Categories</th>
                  <th>Photos</th>
                  <th>Views</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {galleries.map((gal) => (
                  <tr key={gal._id}>
                    <td>
                      <div
                        style={{
                          width: '64px',
                          height: '46px',
                          borderRadius: '3px',
                          background: '#f3f4f6',
                          overflow: 'hidden',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        {gal.coverImage || gal.images?.[0]?.url ? (
                          <img
                            src={gal.coverImage || gal.images[0].url}
                            alt={gal.title}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        ) : (
                          <ImageIcon size={18} color="#9ca3af" />
                        )}
                      </div>
                    </td>

                    <td>
                      <strong
                        style={{ fontSize: '14px', color: '#2271b1', cursor: 'pointer' }}
                        onClick={() => openEditForm(gal)}
                      >
                        {gal.title}
                      </strong>

                      <div className="row-actions">
                        {gal.status !== 'trash' ? (
                          <>
                            <button onClick={() => openEditForm(gal)}>Edit</button>
                            <span>|</span>
                            <button
                              onClick={() => handleTrashGallery(gal._id, gal.title)}
                              className="trash"
                            >
                              Trash
                            </button>
                          </>
                        ) : (
                          <>
                            <button onClick={() => handleRestoreGallery(gal._id)}>
                              Restore
                            </button>
                            <span>|</span>
                            <button
                              onClick={() => handlePermanentDelete(gal._id, gal.title)}
                              className="trash"
                            >
                              Delete Permanently
                            </button>
                          </>
                        )}
                      </div>
                    </td>

                    <td>
                      {(() => {
                        const cats = [];
                        const seen = new Set();
                        const add = (c) => {
                          if (c && c.name && !seen.has(c.name)) {
                            seen.add(c.name);
                            cats.push(c.name);
                          }
                        };
                        if (gal.category) add(gal.category);
                        if (gal.subCategory) add(gal.subCategory);
                        if (gal.childCategory) add(gal.childCategory);
                        if (Array.isArray(gal.categories)) {
                          gal.categories.forEach(c => {
                            if (c) add(c);
                          });
                        }
                        if (cats.length === 0) return <span style={{ color: '#8c8f94' }}>—</span>;
                        return (
                          <span style={{ fontWeight: 600 }}>
                            {cats.join(', ')}
                          </span>
                        );
                      })()}
                    </td>

                    <td>
                      <span style={{ fontWeight: 600, color: '#1d2327' }}>
                        {gal.images?.length || 0}
                      </span> photos
                    </td>

                    <td>{gal.views || 0}</td>

                    <td>
                      <span className={`status-badge ${gal.status}`}>
                        {gal.status}
                      </span>
                    </td>

                    <td style={{ fontSize: '12px', color: '#646970' }}>
                      {new Date(gal.createdAt).toLocaleDateString()}
                    </td>

                    <td style={{ textAlign: 'right' }}>
                      <button
                        onClick={() => openEditForm(gal)}
                        className="button button-neutral button-small"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ====================================================================
          MODE 2: 2-COLUMN CLASSIC EDITOR (Add / Edit Gallery)
          ==================================================================== */}
      {viewMode === 'edit' && (
        <div>
          {/* Top Bar with Back Button */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button
                onClick={() => setViewMode('list')}
                className="button button-neutral"
              >
                ← Back to All Galleries
              </button>
              <h1 style={{ fontSize: '22px', fontWeight: 600, color: '#1d2327', margin: 0 }}>
                {editingGallery ? `Edit Gallery: ${editingGallery.title}` : 'Add New Gallery'}
              </h1>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={() => handleSubmit('draft')}
                disabled={submitting}
                className="button button-secondary"
              >
                Save Draft
              </button>
              <button
                type="button"
                onClick={() => handleSubmit('published')}
                disabled={submitting}
                className="button button-primary"
              >
                {submitting ? 'Publishing...' : editingGallery ? 'Update Gallery' : 'Publish Gallery'}
              </button>
            </div>
          </div>

          <div className="wp-editor-wrap">
            {/* LEFT MAIN COLUMN: Title, Drag & Drop Multi-Image Uploader & Grid */}
            <div className="wp-editor-main">
              <input
                type="text"
                className="wp-title-input"
                placeholder="Add gallery title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />

              {/* MULTI-IMAGE DRAG & DROP UPLOADER METABOX */}
              <div className="postbox">
                <div className="postbox-header">
                  <h3>Gallery Photos ({existingImages.length + newImagePreviews.length})</h3>
                  <label className="button button-primary button-small" style={{ cursor: 'pointer' }}>
                    <Upload size={12} /> Add More Photos
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImagesSelected}
                      style={{ display: 'none' }}
                    />
                  </label>
                </div>

                <div className="postbox-body">
                  {/* Drag and Drop Zone */}
                  <label
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '28px 20px',
                      background: '#f9fafb',
                      border: '2px dashed #c3c4c7',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      marginBottom: '20px',
                      transition: 'border-color 0.15s ease'
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.currentTarget.style.borderColor = '#2271b1';
                    }}
                    onDragLeave={(e) => {
                      e.currentTarget.style.borderColor = '#c3c4c7';
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.currentTarget.style.borderColor = '#c3c4c7';
                      const files = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith('image/'));
                      if (files.length > 0) {
                        setNewImageFiles((prev) => [...prev, ...files]);
                        const newPreviews = files.map((file) => ({
                          file,
                          url: URL.createObjectURL(file),
                          name: file.name
                        }));
                        setNewImagePreviews((prev) => [...prev, ...newPreviews]);
                        if (!coverImageUrl && !coverImageFile && newPreviews.length > 0) {
                          setCoverImageUrl(newPreviews[0].url);
                        }
                      }
                    }}
                  >
                    <ImageIcon size={32} color="#8c8f94" style={{ marginBottom: '8px' }} />
                    <span style={{ fontSize: '14px', fontWeight: 600, color: '#1d2327' }}>
                      Drag and drop photos here, or click to browse
                    </span>
                    <span style={{ fontSize: '12px', color: '#646970', marginTop: '4px' }}>
                      Select multiple images at once (JPG, PNG, WEBP, GIF)
                    </span>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImagesSelected}
                      style={{ display: 'none' }}
                    />
                  </label>

                  {/* Photo Thumbnails Grid */}
                  {(existingImages.length > 0 || newImagePreviews.length > 0) ? (
                    <div>
                      <div style={{ fontSize: '12px', color: '#646970', marginBottom: '10px' }}>
                        Click <strong>"Set as Cover"</strong> on any image to use it as the main album thumbnail.
                      </div>

                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                          gap: '12px'
                        }}
                      >
                        {/* Existing Images */}
                        {existingImages.map((img, i) => {
                          const isCover = coverImageUrl === img.url;
                          return (
                            <div
                              key={`existing-${i}`}
                              style={{
                                position: 'relative',
                                borderRadius: '4px',
                                overflow: 'hidden',
                                border: isCover ? '2px solid #2271b1' : '1px solid #c3c4c7',
                                background: '#f0f0f1'
                              }}
                            >
                              <img
                                src={img.url}
                                alt={img.title || 'Photo'}
                                style={{ width: '100%', height: '110px', objectFit: 'cover', display: 'block' }}
                              />

                              {isCover && (
                                <span
                                  style={{
                                    position: 'absolute',
                                    top: '4px',
                                    left: '4px',
                                    background: '#2271b1',
                                    color: '#fff',
                                    fontSize: '10px',
                                    fontWeight: 700,
                                    padding: '2px 6px',
                                    borderRadius: '3px'
                                  }}
                                >
                                  Cover Photo
                                </span>
                              )}

                              <div
                                style={{
                                  padding: '4px',
                                  background: '#ffffff',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between'
                                }}
                              >
                                {!isCover && (
                                  <button
                                    type="button"
                                    onClick={() => handleSetAsCover(img.url)}
                                    style={{
                                      background: 'none',
                                      border: 'none',
                                      fontSize: '11px',
                                      color: '#2271b1',
                                      cursor: 'pointer'
                                    }}
                                  >
                                    Set as Cover
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => removeExistingImage(i)}
                                  className="button-link-delete"
                                  style={{ fontSize: '11px', marginLeft: 'auto' }}
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          );
                        })}

                        {/* New Images */}
                        {newImagePreviews.map((item, i) => {
                          const isCover = coverImageUrl === item.url;
                          return (
                            <div
                              key={`new-${i}`}
                              style={{
                                position: 'relative',
                                borderRadius: '4px',
                                overflow: 'hidden',
                                border: isCover ? '2px solid #2271b1' : '1px solid #c3c4c7',
                                background: '#f0f0f1'
                              }}
                            >
                              <img
                                src={item.url}
                                alt={item.name}
                                style={{ width: '100%', height: '110px', objectFit: 'cover', display: 'block' }}
                              />

                              {isCover && (
                                <span
                                  style={{
                                    position: 'absolute',
                                    top: '4px',
                                    left: '4px',
                                    background: '#2271b1',
                                    color: '#fff',
                                    fontSize: '10px',
                                    fontWeight: 700,
                                    padding: '2px 6px',
                                    borderRadius: '3px'
                                  }}
                                >
                                  Cover Photo
                                </span>
                              )}

                              <div
                                style={{
                                  padding: '4px',
                                  background: '#ffffff',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between'
                                }}
                              >
                                {!isCover && (
                                  <button
                                    type="button"
                                    onClick={() => handleSetAsCover(item.url)}
                                    style={{
                                      background: 'none',
                                      border: 'none',
                                      fontSize: '11px',
                                      color: '#2271b1',
                                      cursor: 'pointer'
                                    }}
                                  >
                                    Set as Cover
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => removePendingImage(i)}
                                  className="button-link-delete"
                                  style={{ fontSize: '11px', marginLeft: 'auto' }}
                                >
                                  Remove
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', color: '#646970', padding: '10px', fontSize: '13px' }}>
                      No photos added yet. Upload photos using the box above.
                    </div>
                  )}
                </div>
              </div>

              {/* DESCRIPTION METABOX */}
              <div className="postbox">
                <div className="postbox-header">
                  <h3>Gallery Description</h3>
                </div>
                <div className="postbox-body">
                  <textarea
                    className="form-textarea"
                    placeholder="Enter gallery caption or background story..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                  />
                </div>
              </div>
            </div>

            {/* RIGHT SIDEBAR COLUMN: Publish, Gallery Categories, Cover Box */}
            <div className="wp-editor-sidebar">
              {/* PUBLISH METABOX */}
              <div className="postbox">
                <div className="postbox-header">
                  <h3>Publish</h3>
                </div>
                <div className="postbox-body">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: '#646970' }}>Status:</span>
                      <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        className="form-select"
                        style={{ width: '130px', padding: '4px 8px' }}
                      >
                        <option value="published">Published</option>
                        <option value="draft">Draft</option>
                        <option value="trash">Trash</option>
                      </select>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: '#646970' }}>Photos:</span>
                      <strong>{existingImages.length + newImagePreviews.length} items</strong>
                    </div>
                  </div>

                  <div
                    style={{
                      borderTop: '1px solid #dcdcde',
                      marginTop: '16px',
                      paddingTop: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    {editingGallery ? (
                      <button
                        type="button"
                        onClick={() => handleTrashGallery(editingGallery._id, editingGallery.title)}
                        className="button-link-delete"
                      >
                        Move to Trash
                      </button>
                    ) : (
                      <span />
                    )}

                    <button
                      type="button"
                      onClick={() => handleSubmit(status)}
                      disabled={submitting}
                      className="button button-primary"
                    >
                      {submitting ? 'Saving...' : editingGallery ? 'Update' : 'Publish'}
                    </button>
                  </div>
                </div>
              </div>

              {/* GALLERY CATEGORIES (Independent from Posts and Videos) */}
              <div className="postbox">
                <div className="postbox-header">
                  <h3>Gallery Categories</h3>
                </div>
                <div className="postbox-body">
                  <div className="form-group" style={{ marginBottom: '10px' }}>
                    <label className="form-label" style={{ fontSize: '12px' }}>Parent Category</label>
                    <select
                      className="form-select"
                      value={selectedCategory}
                      onChange={(e) => {
                        setSelectedCategory(e.target.value);
                        setSelectedSubCategory('');
                      }}
                    >
                      <option value="">— Select Gallery Category —</option>
                      {rootCats.map((cat) => (
                        <option key={cat._id} value={cat._id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {availableSubCats.length > 0 && (
                    <div className="form-group" style={{ marginBottom: '10px' }}>
                      <label className="form-label" style={{ fontSize: '12px' }}>Subcategory</label>
                      <select
                        className="form-select"
                        value={selectedSubCategory}
                        onChange={(e) => setSelectedSubCategory(e.target.value)}
                      >
                        <option value="">— None (Top-Level Only) —</option>
                        {availableSubCats.map((sub) => (
                          <option key={sub._id} value={sub._id}>
                            ↳ {sub.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>

              {/* AUTOMATIC COVER / THUMBNAIL METABOX */}
              <div className="postbox">
                <div className="postbox-header">
                  <h3>Album Cover / Thumbnail</h3>
                </div>
                <div className="postbox-body">
                  {coverImageUrl ? (
                    <div style={{ marginBottom: '12px' }}>
                      <div
                        style={{
                          width: '100%',
                          height: '140px',
                          borderRadius: '4px',
                          overflow: 'hidden',
                          border: '1px solid #c3c4c7',
                          position: 'relative'
                        }}
                      >
                        <img
                          src={coverImageUrl}
                          alt="Cover Thumbnail"
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      </div>

                      <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span className="auto-badge">
                          <Sparkles size={11} /> Auto Cover Selected
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setCoverImageUrl('');
                            setCoverImageFile(null);
                          }}
                          className="button-link-delete"
                          style={{ fontSize: '12px' }}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      style={{
                        padding: '16px',
                        background: '#f9fafb',
                        border: '1px dashed #c3c4c7',
                        borderRadius: '4px',
                        textAlign: 'center',
                        color: '#646970',
                        fontSize: '12px',
                        marginBottom: '12px'
                      }}
                    >
                      The first uploaded gallery photo is automatically chosen as cover!
                    </div>
                  )}

                  <div>
                    <label className="form-label" style={{ fontSize: '12px' }}>
                      Upload Separate Cover Image:
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleCustomCoverFile}
                      className="form-input"
                      style={{ padding: '4px', fontSize: '12px' }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmModal.isOpen && (
        <div className="modal-backdrop" onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })}>
          <div className="modal-container" style={{ maxWidth: '400px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ margin: 0, fontSize: '16px', color: 'var(--text-primary)' }}>{confirmModal.title}</h3>
              <button
                type="button"
                onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>
            <div className="modal-body" style={{ padding: '20px', color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.5' }}>
              {confirmModal.message}
            </div>
            <div className="modal-footer" style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', background: 'var(--bg-card)' }}>
              <button
                className="button button-neutral"
                onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })}
              >
                Cancel
              </button>
              <button
                className={`button ${confirmModal.isDanger ? 'button-danger' : 'button-primary'}`}
                onClick={confirmModal.onConfirm}
              >
                Yes, Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GalleryManager;

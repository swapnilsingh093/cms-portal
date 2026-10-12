import React, { useState, useEffect } from 'react';
import { pageAPI } from '../../services/api';
import RichEditor from '../../components/RichEditor';
import {
  FileText,
  Plus,
  Edit2,
  Trash2,
  ExternalLink,
  X,
  AlertCircle
} from 'lucide-react';

const PageManager = ({ onPreviewPage }) => {
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPage, setEditingPage] = useState(null);

  // Form states
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [bannerUrl, setBannerUrl] = useState('');
  const [bannerFile, setBannerFile] = useState(null);
  const [template, setTemplate] = useState('default');
  const [status, setStatus] = useState('published');
  const [order, setOrder] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const fetchPages = async () => {
    setLoading(true);
    try {
      const res = await pageAPI.getAll();
      if (res.pages) setPages(res.pages);
    } catch (err) {
      setError(err.message || 'Error fetching pages');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPages();
  }, []);

  const openCreateModal = () => {
    setEditingPage(null);
    setTitle('');
    setContent('<h2>Page Title</h2><p>Write your page content here...</p>');
    setBannerUrl('');
    setBannerFile(null);
    setTemplate('default');
    setStatus('published');
    setOrder(0);
    setError('');
    setModalOpen(true);
  };

  const openEditModal = (page) => {
    setEditingPage(page);
    setTitle(page.title || '');
    setContent(page.content || '');
    setBannerUrl(page.banner || '');
    setBannerFile(null);
    setTemplate(page.template || 'default');
    setStatus(page.status || 'published');
    setOrder(page.order || 0);
    setError('');
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('content', content);
      formData.append('template', template);
      formData.append('status', status);
      formData.append('order', order);

      if (bannerFile) {
        formData.append('banner', bannerFile);
      } else if (bannerUrl) {
        formData.append('banner', bannerUrl);
      }

      if (editingPage) {
        await pageAPI.update(editingPage._id, formData);
      } else {
        await pageAPI.create(formData);
      }

      setModalOpen(false);
      fetchPages();
    } catch (err) {
      setError(err.message || 'Error saving page');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, title) => {
    if (confirm(`Are you sure you want to delete page "${title}"?`)) {
      try {
        await pageAPI.delete(id);
        fetchPages();
      } catch (err) {
        alert(err.message || 'Error deleting page');
      }
    }
  };

  return (
    <div>
      {/* Header */}
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
            <FileText size={24} color="var(--g-accent, #3b82f6)" /> Custom Pages Manager
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Create and maintain custom pages like About Us, Privacy Policy, Contact, and Services.
          </p>
        </div>

        <button onClick={openCreateModal} className="btn-primary">
          <Plus size={18} /> Create New Page
        </button>
      </div>

      {/* Pages List */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-dim)' }}>
            Loading pages...
          </div>
        ) : pages.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '50px 20px' }}>
            <FileText size={48} style={{ color: 'var(--text-dim)', marginBottom: '12px' }} />
            <h3>No Custom Pages Found</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '20px' }}>
              Create your first page such as "About Us" or "Contact Us".
            </p>
            <button onClick={openCreateModal} className="btn-primary">
              <Plus size={16} /> Create Page
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {pages.map((page) => (
              <div
                key={page._id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '16px 20px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-color)',
                  background: 'rgba(255, 255, 255, 0.02)'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                    <h4 style={{ fontSize: '1.05rem' }}>{page.title}</h4>
                    <span className={`badge ${page.status === 'published' ? 'badge-published' : 'badge-draft'}`}>
                      {page.status}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                      /{page.slug}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Template: <strong>{page.template}</strong> • Order: {page.order} • Created: {new Date(page.createdAt).toLocaleDateString()}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    onClick={() => openEditModal(page)}
                    className="btn-secondary"
                    style={{ padding: '6px 12px', fontSize: '0.82rem' }}
                  >
                    <Edit2 size={14} /> Edit
                  </button>
                  <button
                    onClick={() => handleDelete(page._id, page.title)}
                    className="btn-danger"
                    style={{ padding: '6px 12px', fontSize: '0.82rem' }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create / Edit Page Modal */}
      {modalOpen && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div
            className="modal-content"
            style={{ maxWidth: '900px', padding: '32px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1.35rem' }}>
                {editingPage ? 'Edit Page' : 'Create New Page'}
              </h3>
              <button onClick={() => setModalOpen(false)} style={{ background: 'none', color: 'var(--text-dim)' }}>
                <X size={20} />
              </button>
            </div>

            {error && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: 'var(--radius-sm)',
                padding: '10px 14px',
                color: '#f87171',
                marginBottom: '16px'
              }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Page Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. About Us, Contact, Privacy..."
                  className="form-input"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              {/* Rich Text Editor */}
              <div className="form-group">
                <label className="form-label">Page Content (HTML & Rich Text) *</label>
                <RichEditor
                  value={content}
                  onChange={setContent}
                />
              </div>

              {/* Banner Image */}
              <div className="form-group">
                <label className="form-label">Page Top Banner</label>
                <input
                  type="file"
                  accept="image/*"
                  className="form-input"
                  onChange={(e) => setBannerFile(e.target.files[0])}
                />
                {!bannerFile && (
                  <input
                    type="text"
                    placeholder="Or enter banner image URL..."
                    className="form-input"
                    style={{ marginTop: '6px', fontSize: '0.82rem' }}
                    value={bannerUrl}
                    onChange={(e) => setBannerUrl(e.target.value)}
                  />
                )}
              </div>

              {/* Layout Template & Status */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Page Template</label>
                  <select
                    className="form-select"
                    value={template}
                    onChange={(e) => setTemplate(e.target.value)}
                  >
                    <option value="default">Standard Layout</option>
                    <option value="full-width">Full Width Clean</option>
                    <option value="contact">Contact Form Layout</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select
                    className="form-select"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                  >
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Sort Order</label>
                  <input
                    type="number"
                    className="form-input"
                    value={order}
                    onChange={(e) => setOrder(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
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
                  {submitting ? 'Saving Page...' : editingPage ? 'Update Page' : 'Publish Page'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PageManager;

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { mediaAPI } from '../../services/api';
import { ArrowLeft, Save, Copy, Trash2, FileVideo, FileImage, FileText, Download } from 'lucide-react';

const MediaEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [media, setMedia] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [copied, setCopied] = useState(false);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: null, isDanger: false });
  
  const [formData, setFormData] = useState({
    originalName: '',
    altText: '',
    caption: '',
    description: ''
  });

  useEffect(() => {
    fetchMedia();
  }, [id]);

  const fetchMedia = async () => {
    try {
      const res = await mediaAPI.getById(id);
      if (res.media) {
        setMedia(res.media);
        setFormData({
          originalName: res.media.originalName || '',
          altText: res.media.altText || '',
          caption: res.media.caption || '',
          description: res.media.description || ''
        });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to load media.' });
    } finally {
      setLoading(false);
    }
  };

  const handleCopyUrl = (url) => {
    const fullUrl = url.startsWith('http') ? url : `${window.location.origin}${url}`;
    navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDelete = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Media',
      message: 'Are you sure you want to permanently delete this media item? This action cannot be undone.',
      isDanger: true,
      onConfirm: async () => {
        try {
          await mediaAPI.delete(id);
          navigate('/admin/media');
        } catch (err) {
          setMessage({ type: 'error', text: 'Error deleting media' });
          setConfirmModal({ isOpen: false });
        }
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      await mediaAPI.update(id, formData);
      setMessage({ type: 'success', text: 'Media updated successfully.' });
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Error updating media' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={{ padding: '40px' }}>Loading...</div>;
  if (!media) return <div style={{ padding: '40px' }}>Media not found.</div>;

  const fullUrl = media.url.startsWith('http') ? media.url : `http://localhost:5001${media.url}`;

  return (
    <div className="admin-page">
      <div className="admin-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button 
            onClick={() => navigate('/admin/media')}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
          >
            <ArrowLeft size={20} />
          </button>
          <h1>Edit Media</h1>
        </div>
      </div>

      {message && (
        <div className={`message message-${message.type}`} style={{ marginBottom: '20px' }}>
          {message.text}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 400px', gap: '30px' }}>
        {/* Left: Preview */}
        <div style={{ background: 'var(--card-bg)', borderRadius: 'var(--radius-lg)', padding: '24px', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', maxHeight: '500px', overflow: 'hidden' }}>
          {media.mediaType === 'video' ? (
            <video src={fullUrl} controls style={{ maxWidth: '100%', maxHeight: '100%', borderRadius: '8px', objectFit: 'contain', backgroundColor: '#000' }} />
          ) : media.mediaType === 'document' ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px', textAlign: 'center' }}>
              <FileText size={72} color="var(--primary-color)" />
              <h3 style={{ marginTop: '16px', color: 'var(--text-primary)', fontSize: '16px' }}>{media.originalName || media.filename}</h3>
              <a href={fullUrl} target="_blank" rel="noopener noreferrer" className="button button-neutral" style={{ marginTop: '14px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                <Download size={14} /> Open / Download File
              </a>
            </div>
          ) : (
            <img src={fullUrl} alt={media.originalName} style={{ maxWidth: '100%', maxHeight: '100%', borderRadius: '8px', objectFit: 'contain' }} />
          )}
        </div>

        {/* Right: Metadata Form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="postbox">
            <div className="postbox-header"><h2>Attachment Details</h2></div>
            <div className="postbox-inside" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                <strong>Uploaded on:</strong> {new Date(media.createdAt).toLocaleString()}<br/>
                <strong>File name:</strong> {media.filename}<br/>
                <strong>File type:</strong> {media.mimeType}<br/>
                <strong>File size:</strong> {(media.size / 1024 / 1024).toFixed(2)} MB<br/>
              </div>

              <div style={{ marginTop: '10px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '6px' }}>File URL:</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input type="text" value={fullUrl} readOnly className="form-input" style={{ fontSize: '0.8rem', padding: '6px' }} />
                  <button type="button" onClick={() => handleCopyUrl(fullUrl)} className="button button-neutral button-small">
                    {copied ? 'Copied' : <Copy size={14} />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="postbox">
            <div className="postbox-header"><h2>Metadata</h2></div>
            <div className="postbox-inside" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label className="form-label">Title</label>
                <input type="text" className="form-input" value={formData.originalName} onChange={e => setFormData({...formData, originalName: e.target.value})} />
              </div>
              <div>
                <label className="form-label">Alternative Text</label>
                <input type="text" className="form-input" value={formData.altText} onChange={e => setFormData({...formData, altText: e.target.value})} placeholder="Describe the image for screen readers" />
              </div>
              <div>
                <label className="form-label">Caption</label>
                <textarea className="form-input" rows="2" value={formData.caption} onChange={e => setFormData({...formData, caption: e.target.value})} />
              </div>
              <div>
                <label className="form-label">Description</label>
                <textarea className="form-input" rows="4" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
              </div>
            </div>
            <div style={{ padding: '16px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button type="button" onClick={handleDelete} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.9rem' }}>
                Delete Permanently
              </button>
              <button type="submit" className="button button-primary" disabled={saving}>
                {saving ? 'Saving...' : 'Update Media'}
              </button>
            </div>
          </form>
        </div>
      </div>

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
                ✕
              </button>
            </div>
            <div className="modal-body" style={{ padding: '20px', color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.5' }}>
              {confirmModal.message}
            </div>
            <div className="modal-footer" style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', background: 'var(--bg-card)' }}>
              <button className="button button-neutral" onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })}>
                Cancel
              </button>
              <button className={`button ${confirmModal.isDanger ? 'button-danger' : 'button-primary'}`} onClick={confirmModal.onConfirm}>
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default MediaEdit;

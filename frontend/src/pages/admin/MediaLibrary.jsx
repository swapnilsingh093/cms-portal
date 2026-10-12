import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { mediaAPI } from '../../services/api';
import Pagination from '../../components/admin/Pagination';
import { generateDateOptions } from '../../utils/adminHelper';
import {
  Upload,
  RefreshCw,
  Search,
  Grid,
  List,
  Check,
  Trash2,
  HardDrive,
  AlertCircle,
  CheckCircle,
  Loader2,
  FileText,
  Plus,
  UploadCloud
} from 'lucide-react';

const ACCEPT_ALL =
  'image/jpeg,image/png,image/webp,image/svg+xml,image/gif,image/bmp,image/tiff,.jpg,.jpeg,.png,.webp,.svg,.gif,.bmp,.tiff,.tif,video/mp4,video/webm,video/quicktime,video/x-m4v,video/x-msvideo,video/x-matroska,video/mpeg,.mp4,.webm,.mov,.m4v,.avi,.mkv,.mpeg,.mpg,application/pdf,.pdf,.doc,.docx,.txt,.xls,.xlsx,.ppt,.pptx,.csv,.zip,.rar';

const MediaLibrary = () => {
  const [mediaItems, setMediaItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeType, setActiveType] = useState('all'); // 'all' | 'image' | 'video' | 'document'
  const [dateFilter, setDateFilter] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  const [counts, setCounts] = useState({ all: 0, image: 0, video: 0, document: 0 });
  const [search, setSearch] = useState('');
  const [bulkSelectMode, setBulkSelectMode] = useState(false);
  const navigate = useNavigate();
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkActionTop, setBulkActionTop] = useState('');
  const [bulkActionBottom, setBulkActionBottom] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const ITEMS_PER_PAGE = 40;

  const [availableDates, setAvailableDates] = useState([]);
  const dateOptions = useMemo(() => {
    return availableDates.length > 0 ? availableDates : generateDateOptions();
  }, [availableDates]);

  const toggleSelectAll = () => {
    if (selectedIds.length === mediaItems.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(mediaItems.map(m => m._id));
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleBulkDelete = () => {
    if (selectedIds.length === 0) return;
    setConfirmModal({
      isOpen: true,
      title: "Delete Media Permanently",
      message: `Are you sure you want to permanently delete ${selectedIds.length} selected media file(s)? This will delete the physical files from the server uploads directory and cannot be undone.`,
      isDanger: true,
      onConfirm: async () => {
        setConfirmModal({ isOpen: false, title: "", message: "", onConfirm: null });
        setActionLoading(true);
        try {
          const res = await mediaAPI.bulkDelete(selectedIds, true);
          setMessage({
            type: "success",
            text: res.message || `${res.deletedCount || selectedIds.length} media file(s) permanently deleted.`
          });
          setSelectedIds([]);
          setBulkActionTop('');
          setBulkActionBottom('');
          fetchMedia();
        } catch (err) {
          setMessage({
            type: "error",
            text: err.response?.data?.message || err.message || "Failed to delete media files"
          });
        } finally {
          setActionLoading(false);
        }
      }
    });
  };

  const handleApplyBulkAction = (action) => {
    if (!action || selectedIds.length === 0) return;
    if (action === 'delete') {
      handleBulkDelete();
    }
  };

  const [uploading, setUploading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: null });
  const [uploadProgress, setUploadProgress] = useState(0);
  const [message, setMessage] = useState({ type: '', text: '' });

  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragCounter = useRef(0);

  useEffect(() => {
    const handleDragEnter = (e) => {
      e.preventDefault();
      dragCounter.current += 1;
      if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
        setIsDragging(true);
      }
    };
    
    const handleDragLeave = (e) => {
      e.preventDefault();
      dragCounter.current -= 1;
      if (dragCounter.current === 0) {
        setIsDragging(false);
      }
    };
    
    const handleDragOver = (e) => {
      e.preventDefault();
    };
    
    const handleDrop = (e) => {
      e.preventDefault();
      dragCounter.current = 0;
      setIsDragging(false);
      
      const files = Array.from(e.dataTransfer.files || []);
      if (files.length > 0) {
        handleUploadFile({ target: { files } });
      }
    };

    window.addEventListener('dragenter', handleDragEnter);
    window.addEventListener('dragleave', handleDragLeave);
    window.addEventListener('dragover', handleDragOver);
    window.addEventListener('drop', handleDrop);

    return () => {
      window.removeEventListener('dragenter', handleDragEnter);
      window.removeEventListener('dragleave', handleDragLeave);
      window.removeEventListener('dragover', handleDragOver);
      window.removeEventListener('drop', handleDrop);
    };
  }, []);

  const fetchMedia = async () => {
    setLoading(true);
    try {
      const res = await mediaAPI.getAll({
        type: activeType === 'all' ? undefined : activeType,
        month: dateFilter || undefined,
        search,
        page: currentPage,
        limit: ITEMS_PER_PAGE
      });
      if (res.media) setMediaItems(res.media);
      if (res.counts) setCounts(res.counts);
      if (res.pages !== undefined) setTotalPages(res.pages);
      if (res.total !== undefined) setTotalItems(res.total);
      if (res.availableDates) setAvailableDates(res.availableDates);
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Error fetching media items' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [activeType, dateFilter, search]);

  useEffect(() => {
    fetchMedia();
  }, [activeType, dateFilter, search, currentPage]);

  const handleUploadFile = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setUploading(true);
    setUploadProgress(0);
    setMessage({ type: '', text: '' });

    try {
      const formData = new FormData();
      files.forEach((file) => {
        formData.append('files', file);
      });

      const res = await mediaAPI.upload(formData, (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        setUploadProgress(percentCompleted);
      });
      setMessage({
        type: 'success',
        text: res.message || `${files.length} file(s) uploaded and saved to Media Library!`
      });
      fetchMedia();
    } catch (err) {
      setMessage({
        type: 'error',
        text: err.response?.data?.message || err.message || 'Error uploading file'
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSyncMedia = async () => {
    setSyncing(true);
    try {
      const res = await mediaAPI.sync();
      setMessage({ type: 'success', text: res.message || 'Media Library synchronized from uploads folder.' });
      fetchMedia();
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Sync failed' });
    } finally {
      setSyncing(false);
    }
  };

  const handleDeleteItem = (id) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Media',
      message: 'Are you sure you want to permanently delete this media file? It will be completely removed from the server disk folder and library. This action cannot be undone.',
      isDanger: true,
      onConfirm: async () => {
        setConfirmModal({ isOpen: false, title: '', message: '', onConfirm: null });
        try {
          await mediaAPI.delete(id);
          setMessage({ type: 'success', text: 'Media file permanently deleted.' });
          fetchMedia();
        } catch (err) {
          setMessage({ type: 'error', text: err.message || 'Error deleting media' });
        }
      }
    });
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '—';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  const getFormatBadge = (item) => {
    const ext = (item.extension || '').replace('.', '').toUpperCase();
    if (ext) return ext;
    if (item.mimeType) {
      const sub = item.mimeType.split('/')[1] || '';
      return sub.replace('x-', '').replace('+xml', '').toUpperCase();
    }
    return item.mediaType === 'video' ? 'VIDEO' : 'IMG';
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
      {/* 1. Header Bar: Title + Add New Media + Sync */}
      <div className="wp-header-row">
        <h1>Media Library</h1>
        <label className="page-title-action button button-secondary" style={{ cursor: uploading ? 'not-allowed' : 'pointer' }}>
          {uploading ? (
            <>
              <Loader2 size={14} className="spin" /> Uploading ({uploadProgress}%)
            </>
          ) : (
            <>
              <Plus size={14} /> Add New Media File
            </>
          )}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={ACCEPT_ALL}
            onChange={handleUploadFile}
            disabled={uploading}
            style={{ display: 'none' }}
          />
        </label>

        <button
          type="button"
          onClick={handleSyncMedia}
          disabled={syncing}
          className="button button-neutral button-small"
          style={{ marginLeft: 'auto' }}
          title="Scan server uploads directory and register all files in Media Library"
        >
          <RefreshCw size={13} className={syncing ? 'spin' : ''} />
          {syncing ? 'Scanning...' : 'Sync Server Files'}
        </button>
      </div>

      {/* Notifications */}
      {message.text && (
        <div
          style={{
            padding: '10px 14px',
            borderRadius: '6px',
            marginBottom: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '13px',
            background: message.type === 'error' ? 'var(--danger-bg)' : 'var(--success-bg)',
            color: message.type === 'error' ? 'var(--danger)' : 'var(--success)',
            border: `1px solid ${message.type === 'error' ? 'rgba(239, 68, 68, 0.3)' : 'var(--g-accent, rgba(16, 185, 129, 0.3))'}`
          }}
        >
          {message.type === 'error' ? <AlertCircle size={15} /> : <CheckCircle size={15} />}
          <span>{message.text}</span>
          <button
            onClick={() => setMessage({ type: '', text: '' })}
            style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: '16px' }}
          >
            ×
          </button>
        </div>
      )}

      {/* 2. WordPress-Style Media Toolbar (Exact match to Screenshot 2) */}
      <div className="wp-media-toolbar">
        <div className="wp-media-toolbar-left">
          {/* List / Grid view switcher */}
          <button
            type="button"
            onClick={() => setViewMode('list')}
            className={`wp-view-switch-btn ${viewMode === 'list' ? 'active' : ''}`}
            title="List view"
          >
            <List size={16} />
          </button>
          <button
            type="button"
            onClick={() => setViewMode('grid')}
            className={`wp-view-switch-btn ${viewMode === 'grid' ? 'active' : ''}`}
            title="Grid view"
          >
            <Grid size={16} />
          </button>

          {/* Media Types Filter */}
          <select
            value={activeType}
            onChange={(e) => setActiveType(e.target.value)}
          >
            <option value="all">All media items</option>
            <option value="image">Images ({counts.image || 0})</option>
            <option value="video">Videos ({counts.video || 0})</option>
            <option value="document">Documents ({counts.document || 0})</option>
          </select>

          {/* Dates Filter */}
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          >
            <option value="">All dates</option>
            {dateOptions.map(d => (
              <option key={d.value} value={d.value}>{d.label}</option>
            ))}
          </select>

          {/* Bulk Select Button (for Grid View) */}
          {viewMode === 'grid' && (
            <button
              type="button"
              onClick={() => {
                setBulkSelectMode(!bulkSelectMode);
                if (bulkSelectMode) setSelectedIds([]);
              }}
              className={`wp-bulk-select-btn ${bulkSelectMode ? 'active' : ''}`}
            >
              {bulkSelectMode ? 'Cancel Select' : 'Bulk select'}
            </button>
          )}

          {selectedIds.length > 0 && (
            <button
              type="button"
              onClick={handleBulkDelete}
              className="button button-danger button-small"
              style={{ height: '32px' }}
              disabled={actionLoading}
            >
              <Trash2 size={13} /> Delete Permanently ({selectedIds.length})
            </button>
          )}
        </div>

        {/* Right side: Search Media */}
        <div className="wp-media-toolbar-right">
          <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Search media</span>
          <input
            type="search"
            placeholder=""
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="form-input"
            style={{ width: '200px', height: '32px', padding: '0 10px' }}
          />
        </div>
      </div>

      {/* 3. Top Tablenav with Bulk Actions & Pagination */}
      <div className="tablenav top">
        {viewMode === 'list' ? (
          <div className="actions bulkactions">
            <select
              value={bulkActionTop}
              onChange={(e) => setBulkActionTop(e.target.value)}
            >
              <option value="">Bulk actions</option>
              <option value="delete">Delete permanently</option>
            </select>
            <button
              type="button"
              className="button"
              onClick={() => handleApplyBulkAction(bulkActionTop)}
              disabled={actionLoading || !bulkActionTop || selectedIds.length === 0}
            >
              Apply
            </button>
          </div>
        ) : (
          (bulkSelectMode || selectedIds.length > 0) ? (
            <div className="actions">
              <button
                type="button"
                onClick={toggleSelectAll}
                className="button button-small"
              >
                {selectedIds.length === mediaItems.length && mediaItems.length > 0 ? "Deselect All" : "Select All"}
              </button>
              {selectedIds.length > 0 && (
                <button
                  type="button"
                  onClick={handleBulkDelete}
                  className="button button-danger button-small"
                  disabled={actionLoading}
                >
                  <Trash2 size={13} /> Delete Permanently ({selectedIds.length})
                </button>
              )}
            </div>
          ) : (
            <div className="actions"></div>
          )
        )}
        <div className="tablenav-pages">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            total={totalItems}
            onPageChange={(p) => setCurrentPage(p)}
          />
        </div>
      </div>

      {/* 4. Media Main View (Grid or List) */}
      {loading ? (
        <div
          style={{
            padding: '80px 20px',
            textAlign: 'center',
            color: 'var(--text-secondary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px'
          }}
        >
          <Loader2 size={24} className="spin" /> Loading Media Library...
        </div>
      ) : mediaItems.length === 0 ? (
        <div
          style={{
            padding: '80px 20px',
            textAlign: 'center',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: '12px',
            color: 'var(--text-muted)'
          }}
        >
          <HardDrive size={48} style={{ opacity: 0.3, marginBottom: '14px' }} />
          <p style={{ fontSize: '15px', marginBottom: '8px' }}>No media files found in this category.</p>
          <p style={{ fontSize: '13px', marginBottom: '20px', color: 'var(--text-muted)' }}>
            Support for: JPG, PNG, WEBP, SVG, GIF, BMP, TIFF, MP4, WebM, MOV, M4V, AVI, MKV, MPEG
          </p>
          <label className="button button-primary" style={{ cursor: 'pointer' }}>
            <Upload size={14} /> Upload First File
            <input type="file" multiple accept={ACCEPT_ALL} onChange={handleUploadFile} style={{ display: 'none' }} />
          </label>
        </div>
      ) : viewMode === 'grid' ? (
        /* WORDPRESS GRID VIEW (Matches Screenshot 2: Square tiles with bottom filename bar) */
        <div className={`wp-media-grid ${bulkSelectMode ? 'bulk-select-active' : ''}`}>
          {mediaItems.map((item) => {
            const isSelected = selectedIds.includes(item._id);
            const badge = getFormatBadge(item);
            return (
              <div
                key={item._id}
                className={`wp-media-tile ${isSelected ? 'selected' : ''}`}
                onClick={() => {
                  if (bulkSelectMode) {
                    toggleSelect(item._id);
                  } else {
                    navigate(`/admin/media/edit/${item._id}`);
                  }
                }}
                title={item.originalName || item.filename}
              >
                <div
                  className={`wp-media-tile-checkbox ${isSelected ? 'checked' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!bulkSelectMode) setBulkSelectMode(true);
                    toggleSelect(item._id);
                  }}
                  title={isSelected ? "Deselect" : "Select"}
                >
                  {isSelected && <Check size={13} strokeWidth={3} />}
                </div>

                {item.mediaType === 'video' ? (
                  item.thumbnail ? (
                    <img
                      src={item.thumbnail}
                      alt={item.originalName}
                      className="wp-media-tile-preview"
                    />
                  ) : (
                    <video src={item.url} preload="metadata" muted className="wp-media-tile-preview" />
                  )
                ) : item.mediaType === 'document' ? (
                  <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(99, 102, 241, 0.08)', color: 'var(--primary-color)' }}>
                    <FileText size={36} />
                    <span style={{ fontSize: '10px', fontWeight: 700, marginTop: '4px', color: 'var(--text-muted)' }}>{badge}</span>
                  </div>
                ) : (
                  <img
                    src={item.url}
                    alt={item.originalName}
                    className="wp-media-tile-preview"
                    loading="lazy"
                  />
                )}

                {/* Bottom filename caption overlay bar (Screenshot 2) */}
                <div className="wp-media-tile-caption">
                  {item.originalName || item.filename}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* LIST VIEW */
        <div className="cms-table-wrapper">
          <table className="cms-table">
            <thead>
              <tr>
                <th style={{ width: "36px", textAlign: "center" }}>
                  <input
                    type="checkbox"
                    checked={mediaItems.length > 0 && selectedIds.length === mediaItems.length}
                    onChange={toggleSelectAll}
                    style={{ cursor: "pointer" }}
                  />
                </th>
                <th style={{ width: "54px" }}>File</th>
                <th>Name</th>
                <th>Type</th>
                <th>Format</th>
                <th>Size</th>
                <th>Uploaded</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {mediaItems.map((item) => {
                const badge = getFormatBadge(item);
                return (
                  <tr key={item._id} style={{ background: selectedIds.includes(item._id) ? "rgba(59, 130, 246, 0.05)" : undefined }}>
                    <td style={{ textAlign: "center" }}>
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(item._id)}
                        onChange={() => toggleSelect(item._id)}
                        style={{ cursor: "pointer" }}
                      />
                    </td>
                    <td>
                      <div
                        onClick={() => navigate(`/admin/media/edit/${item._id}`)}
                        style={{
                          width: '46px',
                          height: '34px',
                          borderRadius: '4px',
                          background: '#090e18',
                          overflow: 'hidden',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer'
                        }}
                      >
                        {item.mediaType === 'video' ? (
                          item.thumbnail ? (
                            <img src={item.thumbnail} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <video src={item.url} preload="metadata" muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          )
                        ) : item.mediaType === 'document' ? (
                          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary-color)' }}>
                            <FileText size={18} />
                          </div>
                        ) : (
                          <img
                            src={item.url}
                            alt=""
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        )}
                      </div>
                    </td>
                    <td>
                      <strong style={{ cursor: 'pointer', color: 'var(--text-primary)' }} onClick={() => navigate(`/admin/media/edit/${item._id}`)}>
                        {item.originalName || item.filename}
                      </strong>
                    </td>
                    <td>
                      <span className="badge badge-info">{item.mediaType}</span>
                    </td>
                    <td>
                      <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)' }}>{badge}</span>
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                      {formatFileSize(item.size)}
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
                      {new Date(item.createdAt).toLocaleDateString()}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '8px' }}>
                        <button
                          type="button"
                          onClick={() => navigate(`/admin/media/edit/${item._id}`)}
                          className="button button-small button-neutral"
                          title="View Details"
                        >
                          Details
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteItem(item._id)}
                          className="button-link-delete"
                          title="Delete File"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            {/* WordPress Table Footer */}
            <tfoot>
              <tr>
                <th style={{ width: "36px", textAlign: "center" }}>
                  <input
                    type="checkbox"
                    checked={mediaItems.length > 0 && selectedIds.length === mediaItems.length}
                    onChange={toggleSelectAll}
                    style={{ cursor: "pointer" }}
                  />
                </th>
                <th>File</th>
                <th>Name</th>
                <th>Type</th>
                <th>Format</th>
                <th>Size</th>
                <th>Uploaded</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {/* 5. Bottom Tablenav with Bulk Actions & Pagination */}
      <div className="tablenav bottom">
        {viewMode === 'list' && (
          <div className="actions bulkactions">
            <select
              value={bulkActionBottom}
              onChange={(e) => setBulkActionBottom(e.target.value)}
            >
              <option value="">Bulk actions</option>
              <option value="delete">Delete permanently</option>
            </select>
            <button
              type="button"
              className="button"
              onClick={() => handleApplyBulkAction(bulkActionBottom)}
              disabled={actionLoading || !bulkActionBottom || selectedIds.length === 0}
            >
              Apply
            </button>
          </div>
        )}
        <div className="tablenav-pages">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            total={totalItems}
            onPageChange={(p) => setCurrentPage(p)}
          />
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
            <div className="modal-body" style={{ padding: '20px' }}>
              <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                {confirmModal.message}
              </p>
            </div>
            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', padding: '14px 20px', borderTop: '1px solid var(--border-color)' }}>
              <button
                type="button"
                className="button button-neutral"
                onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })}
              >
                Cancel
              </button>
              <button
                type="button"
                className={`button ${confirmModal.isDanger ? 'button-danger' : 'button-primary'}`}
                onClick={confirmModal.onConfirm}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
      {/* WordPress-style Drag & Drop Full-Screen Overlay */}
      {isDragging && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 999999,
            backgroundColor: 'rgba(10, 13, 20, 0.88)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
            padding: '30px'
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '640px',
              height: '360px',
              border: '3px dashed var(--primary-color, #6366f1)',
              borderRadius: '20px',
              backgroundColor: 'rgba(18, 24, 41, 0.9)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '18px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 35px rgba(99, 102, 241, 0.3)',
              textAlign: 'center',
              padding: '30px'
            }}
          >
            <div
              style={{
                width: '84px',
                height: '84px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.25), rgba(168, 85, 247, 0.25))',
                border: '1.5px solid rgba(99, 102, 241, 0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--primary-color, #818cf8)'
              }}
            >
              <UploadCloud size={46} style={{ strokeWidth: 1.8 }} />
            </div>
            <h2 style={{ margin: 0, fontSize: '26px', fontWeight: 700, color: '#f8fafc', letterSpacing: '-0.02em' }}>
              Drop files to upload
            </h2>
            <p style={{ margin: 0, fontSize: '14px', color: '#94a3b8', maxWidth: '400px', lineHeight: 1.5 }}>
              Files will be saved in year/month folders and automatically registered in your Media Library.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default MediaLibrary;

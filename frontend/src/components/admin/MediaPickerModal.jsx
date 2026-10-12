import React, { useState, useEffect, useRef } from 'react';
import { mediaAPI } from '../../services/api';
import {
  Image as ImageIcon,
  Film,
  Upload,
  Search,
  Check,
  X,
  Grid,
  List,
  FolderOpen,
  Loader2,
  FileVideo,
  FileImage,
  AlertCircle
} from 'lucide-react';

const ACCEPT_IMAGES =
  'image/jpeg,image/png,image/webp,image/svg+xml,image/gif,image/bmp,image/tiff,.jpg,.jpeg,.png,.webp,.svg,.gif,.bmp,.tiff,.tif';
const ACCEPT_VIDEOS =
  'video/mp4,video/webm,video/quicktime,video/x-m4v,video/x-msvideo,video/x-matroska,video/mpeg,.mp4,.webm,.mov,.m4v,.avi,.mkv,.mpeg,.mpg';
const ACCEPT_ALL = `${ACCEPT_IMAGES},${ACCEPT_VIDEOS}`;

const MediaPickerModal = ({
  isOpen,
  onClose,
  onSelect,
  title = 'Select Media',
  allowedType = 'any', // 'image' | 'video' | 'any'
  mediaType,
  multiple = false
}) => {
  // Support either allowedType or mediaType alias
  const targetAllowedType = allowedType !== 'any' ? allowedType : (mediaType || 'any');
  const [activeTab, setActiveTab] = useState('library');
  const dragCounter = React.useRef(0);
  const [globalDragging, setGlobalDragging] = React.useState(false);

  React.useEffect(() => {
    const handleDragEnter = (e) => {
      e.preventDefault();
      dragCounter.current += 1;
      if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
        setGlobalDragging(true);
      }
    };
    
    const handleDragLeave = (e) => {
      e.preventDefault();
      dragCounter.current -= 1;
      if (dragCounter.current === 0) {
        setGlobalDragging(false);
      }
    };
    
    const handleDragOver = (e) => {
      e.preventDefault();
    };
    
    const handleDrop = (e) => {
      e.preventDefault();
      dragCounter.current = 0;
      setGlobalDragging(false);
      
      const files = Array.from(e.dataTransfer.files || []);
      if (files.length > 0) {
        setActiveTab('upload');
        handleFileUpload({ target: { files } });
      }
    };

    const modalElement = document.getElementById('media-picker-modal-container');
    if (modalElement) {
      modalElement.addEventListener('dragenter', handleDragEnter);
      modalElement.addEventListener('dragleave', handleDragLeave);
      modalElement.addEventListener('dragover', handleDragOver);
      modalElement.addEventListener('drop', handleDrop);
    }

    return () => {
      if (modalElement) {
        modalElement.removeEventListener('dragenter', handleDragEnter);
        modalElement.removeEventListener('dragleave', handleDragLeave);
        modalElement.removeEventListener('dragover', handleDragOver);
        modalElement.removeEventListener('drop', handleDrop);
      }
    };
  }, []);
  
      const handleGlobalDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setGlobalDragging(false);
    const files = Array.from(e.dataTransfer.files || []);
    if (files.length > 0) {
      setActiveTab('upload');
      handleFileUpload({ target: { files } });
    }
  };
 // 'library' | 'upload'
  // 'library' | 'upload'
  const [mediaItems, setMediaItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [typeFilter, setTypeFilter] = useState(targetAllowedType || 'any');
  const [counts, setCounts] = useState({ all: 0, image: 0, video: 0 });

  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedItems, setSelectedItems] = useState([]); // For multiple
  const [uploadError, setUploadError] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);
  const searchTimeoutRef = useRef(null);

  const PAGE_LIMIT = 48;

  const fetchMedia = async (page = 1, append = false, querySearch = search, queryType = typeFilter) => {
    if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }

    try {
      const params = {
        page,
        limit: PAGE_LIMIT
      };
      if (queryType && queryType !== 'any') {
        params.type = queryType;
      }
      if (querySearch && querySearch.trim()) {
        params.search = querySearch.trim();
      }

      const res = await mediaAPI.getAll(params);
      const items = res.media || [];
      const total = res.total ?? res.pagination?.total ?? 0;
      const pages = res.pages ?? res.pagination?.pages ?? Math.ceil(total / PAGE_LIMIT) ?? 1;

      if (append) {
        setMediaItems((prev) => {
          const existingIds = new Set(prev.map(i => i._id));
          const newItems = items.filter(i => !existingIds.has(i._id));
          return [...prev, ...newItems];
        });
      } else {
        setMediaItems(items);
      }

      if (res.counts) {
        setCounts(res.counts);
      }

      setCurrentPage(page);
      setTotalPages(pages);
      setTotalItems(total);
      setHasMore(page < pages);
    } catch (err) {
      console.error('Error fetching media for picker:', err.message);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMoreMedia = () => {
    if (hasMore && !loadingMore && !loading) {
      fetchMedia(currentPage + 1, true, search, typeFilter);
    }
  };

  const handleScroll = (e) => {
    const { scrollTop, clientHeight, scrollHeight } = e.currentTarget;
    if (scrollHeight - (scrollTop + clientHeight) < 280) {
      if (hasMore && !loadingMore && !loading) {
        loadMoreMedia();
      }
    }
  };

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearch(val);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      fetchMedia(1, false, val, typeFilter);
    }, 350);
  };

  const handleTypeChange = (newType) => {
    setTypeFilter(newType);
    fetchMedia(1, false, search, newType);
  };

  useEffect(() => {
    if (isOpen) {
      const initialType = targetAllowedType || 'any';
      setTypeFilter(initialType);
      setSearch('');
      fetchMedia(1, false, '', initialType);
      setSelectedItem(null);
      setSelectedItems([]);
      setUploadError('');
    }
  }, [isOpen, targetAllowedType]);

  const processUploadFiles = async (fileList) => {
    if (!fileList || fileList.length === 0) return;
    const files = Array.from(fileList);

    setUploading(true);
    setUploadProgress(0);
    setUploadError('');

    try {
      const formData = new FormData();
      files.forEach((f) => {
        formData.append('files', f);
      });

      const res = await mediaAPI.upload(formData, (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        setUploadProgress(percentCompleted);
      });
      if (res.items && res.items.length > 0) {
        setMediaItems((prev) => [...res.items, ...prev]);
        setTotalItems(prev => prev + res.items.length);
        if (multiple) {
            setSelectedItems(prev => [...prev, ...res.items]);
        } else {
            setSelectedItem(res.items[0]);
        }
        setActiveTab('library');
      } else if (res.media) {
        setMediaItems((prev) => [res.media, ...prev]);
        setTotalItems(prev => prev + 1);
        if (multiple) {
            setSelectedItems(prev => [...prev, res.media]);
        } else {
            setSelectedItem(res.media);
        }
        setActiveTab('library');
      }
    } catch (err) {
      setUploadError(err.response?.data?.message || err.message || 'Upload failed');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleFileUpload = (e) => {
    processUploadFiles(e.target.files);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processUploadFiles(e.dataTransfer.files);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleConfirmSelection = () => {
    if (multiple) {
      if (selectedItems.length === 0) return;
      onSelect(selectedItems);
    } else {
      if (!selectedItem) return;
      onSelect(selectedItem);
    }
    onClose();
  };
  
  const toggleSelection = (item) => {
    if (multiple) {
      setSelectedItems(prev => {
        const exists = prev.find(i => i._id === item._id);
        if (exists) return prev.filter(i => i._id !== item._id);
        return [...prev, item];
      });
    } else {
      setSelectedItem(item);
    }
  };

  const getAcceptString = () => {
    if (targetAllowedType === 'video') return ACCEPT_VIDEOS;
    if (targetAllowedType === 'image') return ACCEPT_IMAGES;
    return ACCEPT_ALL;
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

  if (!isOpen) return null;

  const filteredMedia = mediaItems;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-container"
        style={{ maxWidth: '1000px', height: '660px', display: 'flex', flexDirection: 'column' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              {title}
            </h2>
            {/* Tabs */}
            <div style={{ display: 'flex', gap: '4px', background: 'var(--bg-surface)', padding: '3px', borderRadius: '8px' }}>
              <button
                type="button"
                onClick={() => setActiveTab('library')}
                className="button button-small"
                style={{
                  background: activeTab === 'library' ? 'var(--primary-color)' : 'transparent',
                  color: activeTab === 'library' ? '#fff' : 'var(--text-secondary)'
                }}
              >
                <FolderOpen size={14} /> Choose from Media Library
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('upload')}
                className="button button-small"
                style={{
                  background: activeTab === 'upload' ? 'var(--primary-color)' : 'transparent',
                  color: activeTab === 'upload' ? '#fff' : 'var(--text-secondary)'
                }}
              >
                <Upload size={14} /> Upload from Computer
              </button>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: 0, overflow: 'hidden' }}>
          {activeTab === 'library' ? (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              {/* Search & Toolbar */}
              <div
                style={{
                  padding: '12px 20px',
                  borderBottom: '1px solid var(--border-color)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '16px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ position: 'relative', width: '260px' }}>
                    <Search
                      size={15}
                      style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}
                    />
                    <input
                      type="text"
                      placeholder="Search media files..."
                      value={search}
                      onChange={handleSearchChange}
                      className="form-input"
                      style={{ paddingLeft: '32px', fontSize: '13px' }}
                    />
                  </div>

                  {/* Type Filter Select if any allowed */}
                  {targetAllowedType === 'any' && (
                    <select
                      value={typeFilter}
                      onChange={(e) => handleTypeChange(e.target.value)}
                      className="form-select"
                      style={{
                        padding: '6px 12px',
                        fontSize: '12.5px',
                        borderRadius: '6px',
                        background: 'var(--bg-surface)',
                        color: 'var(--text-primary)',
                        border: '1px solid var(--border-color)',
                        cursor: 'pointer'
                      }}
                    >
                      <option value="any">All Media Types ({counts.all || totalItems})</option>
                      <option value="image">🖼️ Images ({counts.image || 0})</option>
                      <option value="video">📹 Videos ({counts.video || 0})</option>
                    </select>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    {totalItems > 0 ? `${mediaItems.length} of ${totalItems}` : '0 files'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setViewMode('grid')}
                    className="button button-small button-neutral"
                    style={{
                      background: viewMode === 'grid' ? 'var(--bg-card-hover)' : 'transparent',
                      borderColor: viewMode === 'grid' ? 'var(--primary-color)' : 'var(--border-color)'
                    }}
                    title="Grid View"
                  >
                    <Grid size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('list')}
                    className="button button-small button-neutral"
                    style={{
                      background: viewMode === 'list' ? 'var(--bg-card-hover)' : 'transparent',
                      borderColor: viewMode === 'list' ? 'var(--primary-color)' : 'var(--border-color)'
                    }}
                    title="List View"
                  >
                    <List size={14} />
                  </button>
                </div>
              </div>

              {/* Media Content Scrollable View with Infinite Scroll */}
              <div onScroll={handleScroll} style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
                {loading && mediaItems.length === 0 ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '260px', gap: '10px', color: 'var(--text-secondary)' }}>
                    <Loader2 size={24} className="spin" color="var(--primary-color)" /> Loading Media Library...
                  </div>
                ) : filteredMedia.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '50px 20px', color: 'var(--text-muted)' }}>
                    <ImageIcon size={44} style={{ opacity: 0.3, marginBottom: '12px' }} />
                    <p style={{ fontSize: '14px', marginBottom: '16px' }}>No media items found</p>
                    <button
                      type="button"
                      onClick={() => setActiveTab('upload')}
                      className="button button-secondary button-small"
                    >
                      <Upload size={14} /> Upload from Computer
                    </button>
                  </div>
                ) : viewMode === 'grid' ? (
                  <div className="media-grid">
                    {filteredMedia.map((item) => {
                      const isSelected = multiple ? selectedItems.some(i => i._id === item._id) : (selectedItem?._id === item._id);
                      const badge = getFormatBadge(item);
                      return (
                        <div
                          key={item._id}
                          className={`media-card ${isSelected ? 'selected' : ''}`}
                          onClick={() => toggleSelection(item)}
                          onDoubleClick={handleConfirmSelection}
                          title={`${item.originalName || item.filename} (Double click to select)`}
                        >
                          <div className="media-thumb">
                            {item.mediaType === 'video' ? (
                              item.thumbnail ? (
                                <img
                                  src={item.thumbnail}
                                  alt={item.originalName}
                                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                />
                              ) : (
                                <video src={item.url} preload="metadata" muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              )
                            ) : (
                              <img
                                src={item.url}
                                alt={item.originalName}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                }}
                              />
                            )}
                            <span
                              style={{
                                position: 'absolute',
                                bottom: '6px',
                                right: '6px',
                                background: 'rgba(0,0,0,0.7)',
                                color: '#e2e8f0',
                                fontSize: '10px',
                                fontWeight: 700,
                                padding: '2px 5px',
                                borderRadius: '4px',
                                textTransform: 'uppercase'
                              }}
                            >
                              {badge}
                            </span>
                          </div>
                          <div style={{ padding: '8px 10px' }}>
                            <p
                              style={{
                                fontSize: '12px',
                                fontWeight: 500,
                                color: 'var(--text-primary)',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                marginBottom: '2px'
                              }}
                            >
                              {item.originalName || item.filename}
                            </p>
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                              {item.mediaType}
                            </span>
                          </div>
                          {isSelected && (
                            <div
                              style={{
                                position: 'absolute',
                                top: '8px',
                                right: '8px',
                                width: '22px',
                                height: '22px',
                                borderRadius: '50%',
                                background: 'var(--primary-color)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#ffffff'
                              }}
                            >
                              <Check size={14} />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <table className="cms-table">
                    <thead>
                      <tr>
                        <th style={{ width: '50px' }}></th>
                        <th>File Name</th>
                        <th>Type</th>
                        <th>Format</th>
                        <th>Size</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredMedia.map((item) => {
                        const isSelected = multiple ? selectedItems.some(i => i._id === item._id) : (selectedItem?._id === item._id);
                        const badge = getFormatBadge(item);
                        return (
                          <tr
                            key={item._id}
                            onClick={() => toggleSelection(item)}
                            onDoubleClick={handleConfirmSelection}
                            style={{
                              cursor: 'pointer',
                              background: isSelected ? 'var(--primary-subtle)' : undefined
                            }}
                          >
                            <td>
                              <div
                                style={{
                                  width: '36px',
                                  height: '36px',
                                  borderRadius: '4px',
                                  overflow: 'hidden',
                                  background: '#090e18',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center'
                                }}
                              >
                                {item.mediaType === 'video' ? (
                                  item.thumbnail ? (
                                    <img src={item.thumbnail} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                  ) : (
                                    <video src={item.url} preload="metadata" muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                  )
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
                              <strong>{item.originalName || item.filename}</strong>
                            </td>
                            <td>
                              <span className="badge badge-info">{item.mediaType}</span>
                            </td>
                            <td>
                              <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)' }}>{badge}</span>
                            </td>
                            <td style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
                              {item.size ? `${(item.size / (1024 * 1024)).toFixed(2)} MB` : '—'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}

                {/* Infinite Scroll Loaders & Triggers */}
                {loadingMore && (
                  <div
                    style={{
                      textAlign: 'center',
                      padding: '20px 0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      color: 'var(--text-secondary)'
                    }}
                  >
                    <Loader2 size={20} className="spin" color="var(--primary-color)" />
                    <span style={{ fontSize: '13px' }}>Loading more media ({mediaItems.length} of {totalItems})...</span>
                  </div>
                )}

                {hasMore && !loadingMore && !loading && (
                  <div style={{ textAlign: 'center', padding: '16px 0' }}>
                    <button
                      type="button"
                      onClick={loadMoreMedia}
                      className="button button-neutral button-small"
                      style={{ padding: '8px 24px', fontSize: '13px', borderRadius: '20px', cursor: 'pointer' }}
                    >
                      📥 Load More Media ({mediaItems.length} of {totalItems})
                    </button>
                  </div>
                )}

                {!hasMore && mediaItems.length > 0 && !loading && (
                  <div style={{ textAlign: 'center', padding: '16px 0', color: 'var(--text-muted)', fontSize: '12px' }}>
                    ✓ All {totalItems} media files loaded
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Upload from Computer Tab */
            <div
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '40px 20px',
                textAlign: 'center'
              }}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <div
                style={{
                  border: `2px dashed ${isDragging ? 'var(--primary-color)' : 'var(--border-color)'}`,
                  borderRadius: '16px',
                  padding: '50px 30px',
                  width: '100%',
                  maxWidth: '560px',
                  background: isDragging ? 'rgba(59, 130, 246, 0.08)' : 'var(--bg-surface)',
                  transition: 'all 0.2s ease'
                }}
              >
                <Upload size={48} color="var(--primary-color)" style={{ marginBottom: '14px' }} />
                <h3 style={{ fontSize: '17px', fontWeight: 700, marginBottom: '8px', color: 'var(--text-primary)' }}>
                  Drag & Drop Files Here
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '8px' }}>
                  Upload actual image or video files directly to the server and Media Library.
                </p>
                <p style={{ color: 'var(--text-muted)', fontSize: '12px', marginBottom: '22px' }}>
                  Supported Images: <strong>JPG, JPEG, PNG, WEBP, SVG, GIF, BMP, TIFF</strong>
                  <br />
                  Supported Videos: <strong>MP4, WebM, MOV, M4V, AVI, MKV, MPEG</strong>
                </p>

                {uploadError && (
                  <div
                    style={{
                      background: 'var(--danger-bg)',
                      color: 'var(--danger)',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      fontSize: '12.5px',
                      marginBottom: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      textAlign: 'left'
                    }}
                  >
                    <AlertCircle size={16} />
                    <span>{uploadError}</span>
                  </div>
                )}

                <label
                  className="button button-primary"
                  style={{
                    cursor: uploading ? 'not-allowed' : 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 22px'
                  }}
                >
                  {uploading ? (
                    <>
                      <Loader2 size={16} className="spin" /> Uploading & Storing File...
                    </>
                  ) : (
                    <>
                      <Upload size={16} /> Select Files from Computer
                    </>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept={getAcceptString()}
                    onChange={handleFileUpload}
                    disabled={uploading}
                    style={{ display: 'none' }}
                  />
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="modal-footer">
          <div style={{ flex: 1, color: 'var(--text-secondary)', fontSize: '12.5px' }}>
            {multiple ? (
              selectedItems.length > 0 ? (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                  <span className="badge badge-info" style={{ fontSize: '11px', fontWeight: 700, padding: '3px 8px' }}>
                    {selectedItems.length} {selectedItems.length === 1 ? 'Photo' : 'Photos'} Selected
                  </span>
                  <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                    {selectedItems.map(i => i.originalName || i.filename).slice(0, 2).join(', ')}
                    {selectedItems.length > 2 ? ` + ${selectedItems.length - 2} more` : ''}
                  </span>
                </span>
              ) : (
                <span>Select one or more photos from the library, or upload from computer.</span>
              )
            ) : selectedItem ? (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                <span className="badge badge-info" style={{ textTransform: 'uppercase', fontSize: '10px' }}>
                  {getFormatBadge(selectedItem)}
                </span>
                Selected: <strong style={{ color: 'var(--text-primary)' }}>{selectedItem.originalName || selectedItem.filename}</strong>
              </span>
            ) : (
              <span>Select an item from the library or upload from computer.</span>
            )}
          </div>
          <button type="button" onClick={onClose} className="button button-neutral">
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirmSelection}
            disabled={multiple ? selectedItems.length === 0 : !selectedItem}
            className="button button-primary"
            style={{
              opacity: (multiple ? selectedItems.length > 0 : selectedItem) ? 1 : 0.5,
              cursor: (multiple ? selectedItems.length > 0 : selectedItem) ? 'pointer' : 'not-allowed'
            }}
          >
            <Check size={15} /> {multiple ? (selectedItems.length > 1 ? `Add ${selectedItems.length} Photos` : 'Add Selected Photo') : 'Select Media'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MediaPickerModal;

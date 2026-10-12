import React, { useState, useEffect, useRef } from 'react';
import { videoAPI, categoryAPI } from '../../services/api';
import {
  Film,
  Plus,
  Play,
  Pause,
  Trash2,
  RefreshCw,
  Search,
  Upload,
  Link as LinkIcon,
  CheckCircle,
  AlertCircle,
  X,
  ExternalLink,
  Clock,
  Sparkles,
  Eye
} from 'lucide-react';

const VideoManager = ({ initialAction = 'list' }) => {
  // View mode: 'list' (All Videos table) or 'edit' (WordPress 2-Column Editor)
  const [viewMode, setViewMode] = useState(initialAction === 'new' ? 'edit' : 'list');
  const [editingVideo, setEditingVideo] = useState(null);

  // Status Filter Tab: 'all' | 'published' | 'draft' | 'trash'
  const [currentTab, setCurrentTab] = useState('all');
  const [videos, setVideos] = useState([]);
  const [statusCounts, setStatusCounts] = useState({ all: 0, published: 0, draft: 0, trash: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Video Categories Taxonomy
  const [videoCategories, setVideoCategories] = useState([]);

  // Form Fields (2-Column Editor)
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [videoUploadType, setVideoUploadType] = useState('upload'); // 'upload' | 'url'
  const [videoFile, setVideoFile] = useState(null);
  const [videoUrl, setVideoUrl] = useState('');
  const [duration, setDuration] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSubCategory, setSelectedSubCategory] = useState('');
  const [status, setStatus] = useState('published');
  const [tags, setTags] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Poster & Thumbnail state
  const [posterFile, setPosterFile] = useState(null);
  const [posterPreview, setPosterPreview] = useState('');
  const [autoPosterDataUrl, setAutoPosterDataUrl] = useState('');
  const [isExtractingFrame, setIsExtractingFrame] = useState(false);

  // Live Video Preview Modal (for quick play from table)
  const [previewVideoItem, setPreviewVideoItem] = useState(null);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: null });

  // Ref for temporary video element to extract poster frame
  const hiddenVideoRef = useRef(null);

  const fetchVideos = async () => {
    setLoading(true);
    try {
      const res = await videoAPI.getAll({
        status: currentTab,
        search
      });
      if (res.videos) {
        setVideos(res.videos);
      }
      if (res.statusCounts) {
        setStatusCounts(res.statusCounts);
      }
    } catch (err) {
      setError(err.message || 'Error fetching videos');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await categoryAPI.getAll({ type: 'video', strict: 'false' });
      if (res.categories) {
        setVideoCategories(res.categories);
      }
    } catch (e) {
      console.error('Error fetching video categories:', e.message);
    }
  };

  useEffect(() => {
    fetchVideos();
    fetchCategories();
  }, [currentTab, search]);

  useEffect(() => {
    if (initialAction === 'new') {
      openAddForm();
    }
  }, [initialAction]);

  // Open Add New Video Form
  const openAddForm = () => {
    setEditingVideo(null);
    setTitle('');
    setDescription('');
    setVideoUploadType('upload');
    setVideoFile(null);
    setVideoUrl('');
    setDuration('');
    setSelectedCategory('');
    setSelectedSubCategory('');
    setStatus('published');
    setTags('');
    setPosterFile(null);
    setPosterPreview('');
    setAutoPosterDataUrl('');
    setError('');
    setSuccess('');
    setViewMode('edit');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Open Edit Video Form
  const openEditForm = (vid) => {
    setEditingVideo(vid);
    setTitle(vid.title || '');
    setDescription(vid.description || '');
    setVideoUploadType(vid.videoType === 'upload' || vid.videoUrl?.startsWith('/uploads/') ? 'upload' : 'url');
    setVideoFile(null);
    setVideoUrl(vid.videoUrl || '');
    setDuration(vid.duration || '');
    setSelectedCategory(vid.category?._id || vid.category || '');
    setSelectedSubCategory(vid.subCategory?._id || vid.subCategory || '');
    setStatus(vid.status || 'published');
    setTags(vid.tags ? vid.tags.join(', ') : '');
    setPosterFile(null);
    setPosterPreview(vid.poster || vid.thumbnail || '');
    setAutoPosterDataUrl('');
    setError('');
    setSuccess('');
    setViewMode('edit');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Automatic Video Poster / Frame Extraction:
  // When a video file is picked, extract a clean frame at 1.5s via Canvas
  const handleVideoFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setVideoFile(file);
    setIsExtractingFrame(true);
    setError('');

    const fileUrl = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.src = fileUrl;
    video.muted = true;
    video.playsInline = true;

    video.onloadedmetadata = () => {
      // Seek to 1.5s or 10% into video
      const targetTime = Math.min(1.5, video.duration > 2 ? 1.5 : video.duration * 0.1);
      video.currentTime = targetTime;

      // Extract duration string
      const mins = Math.floor(video.duration / 60);
      const secs = Math.floor(video.duration % 60);
      setDuration(`${mins}:${secs < 10 ? '0' : ''}${secs}`);
    };

    video.onseeked = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 360;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.88);

        setAutoPosterDataUrl(dataUrl);
        // Only set preview if admin hasn't manually uploaded a custom poster
        if (!posterFile) {
          setPosterPreview(dataUrl);
        }
      } catch (err) {
        console.error('Frame extraction failed:', err);
      } finally {
        setIsExtractingFrame(false);
        URL.revokeObjectURL(fileUrl);
      }
    };

    video.onerror = () => {
      setIsExtractingFrame(false);
      URL.revokeObjectURL(fileUrl);
    };
  };

  // Custom Poster File Change
  const handleCustomPosterChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPosterFile(file);
      setPosterPreview(URL.createObjectURL(file));
      setAutoPosterDataUrl('');
    }
  };

  // Submit Handler (Create or Update)
  const handleSubmit = async (submitStatus) => {
    if (!title.trim()) {
      setError('Please enter a video title');
      return;
    }

// Video is optional

    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('videoType', videoUploadType);
      formData.append('status', submitStatus || status);
      formData.append('duration', duration);
      if (selectedCategory) formData.append('category', selectedCategory);
      if (selectedSubCategory) formData.append('subCategory', selectedSubCategory);
      if (tags) formData.append('tags', tags);

      if (videoUploadType === 'upload' && videoFile) {
        formData.append('video', videoFile);
      } else if (videoUploadType === 'url') {
        formData.append('videoUrl', videoUrl);
      }

      // If user uploaded a custom poster file
      if (posterFile) {
        formData.append('poster', posterFile);
      } else if (autoPosterDataUrl) {
        // Send auto-extracted canvas frame
        formData.append('autoPoster', autoPosterDataUrl);
      }

      if (editingVideo) {
        await videoAPI.update(editingVideo._id, formData);
        setSuccess(`Video "${title}" updated successfully!`);
      } else {
        await videoAPI.create(formData);
        setSuccess(`Video "${title}" published successfully!`);
      }

      setViewMode('list');
      fetchVideos();
    } catch (err) {
      setError(err.message || 'Error saving video');
    } finally {
      setSubmitting(false);
    }
  };

  // Trash Video
  const handleTrashVideo = (id, videoTitle) => {
    setConfirmModal({
      isOpen: true,
      title: 'Move to Trash',
      message: `Are you sure you want to move "${videoTitle}" to the trash?`,
      onConfirm: async () => {
        setConfirmModal({ isOpen: false });
        try {
          await videoAPI.delete(id, false);
          setSuccess(`Video moved to trash.`);
          fetchVideos();
        } catch (err) {
          setError(err.message || 'Error trashing video');
        }
      }
    });
  };

  // Restore Video
  const handleRestoreVideo = async (id) => {
    try {
      await videoAPI.restore(id);
      setSuccess(`Video restored to Drafts.`);
      fetchVideos();
    } catch (err) {
      setError(err.message || 'Error restoring video');
    }
  };

  // Permanent Delete
  const handlePermanentDelete = (id, videoTitle) => {
    setConfirmModal({
      isOpen: true,
      title: 'Permanently Delete',
      message: `Are you sure you want to permanently delete "${videoTitle}" and its files? This action cannot be undone.`,
      isDanger: true,
      onConfirm: async () => {
        setConfirmModal({ isOpen: false });
        try {
          await videoAPI.delete(id, true);
          setSuccess(`Video permanently deleted.`);
          fetchVideos();
        } catch (err) {
          setError(err.message || 'Error deleting video permanently');
        }
      }
    });
  };

  // Filter root and sub categories for video
  const rootCats = videoCategories.filter((c) => !c.parentCategory);
  const availableSubCats = selectedCategory
    ? videoCategories.filter(
        (c) =>
          c.parentCategory &&
          (c.parentCategory._id === selectedCategory || c.parentCategory === selectedCategory)
      )
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
          MODE 1: ALL VIDEOS LIST TABLE (WordPress Classic View)
          ==================================================================== */}
      {viewMode === 'list' && (
        <div>
          {/* Header Bar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <h1 style={{ fontSize: '22px', fontWeight: 600, color: '#1d2327', margin: 0 }}>
                Videos
              </h1>
              <button onClick={openAddForm} className="button button-primary">
                <Plus size={14} /> Add New Video
              </button>
            </div>

            {/* Search Box */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="text"
                placeholder="Search Videos..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="form-input"
                style={{ width: '220px', padding: '5px 10px', fontSize: '13px' }}
              />
            </div>
          </div>

          {/* WordPress Subsubsub Filter Tabs */}
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

          {/* Videos Table */}
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', background: '#ffffff', border: '1px solid #c3c4c7', borderRadius: '4px', color: '#646970' }}>
              Loading videos...
            </div>
          ) : videos.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', background: '#ffffff', border: '1px solid #c3c4c7', borderRadius: '4px', color: '#646970' }}>
              No videos found in this section. <button onClick={openAddForm} className="button button-primary" style={{ marginLeft: '10px' }}>Upload a Video</button>
            </div>
          ) : (
            <table className="wp-list-table">
              <thead>
                <tr>
                  <th style={{ width: '100px' }}>Preview</th>
                  <th>Title</th>
                  <th>Categories</th>
                  <th>Duration</th>
                  <th>Views</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {videos.map((vid) => (
                  <tr key={vid._id}>
                    {/* Thumbnail preview with Play button overlay */}
                    <td>
                      <div
                        onClick={() => setPreviewVideoItem(vid)}
                        style={{
                          width: '84px',
                          height: '50px',
                          background: '#1d2327',
                          borderRadius: '3px',
                          position: 'relative',
                          overflow: 'hidden',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                        title="Click to Play & Verify Video"
                      >
                        {vid.thumbnail || vid.poster ? (
                          <img
                            src={vid.thumbnail || vid.poster}
                            alt={vid.title}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        ) : (
                          <Film size={20} color="#64748b" />
                        )}
                        <div
                          style={{
                            position: 'absolute',
                            inset: 0,
                            background: 'rgba(0,0,0,0.3)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <div
                            style={{
                              width: '22px',
                              height: '22px',
                              borderRadius: '50%',
                              background: '#2271b1',
                              color: '#fff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              boxShadow: '0 2px 5px rgba(0,0,0,0.4)'
                            }}
                          >
                            <Play size={11} fill="#fff" />
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Title & Row Actions */}
                    <td>
                      <strong
                        style={{ fontSize: '14px', color: '#2271b1', cursor: 'pointer' }}
                        onClick={() => openEditForm(vid)}
                      >
                        {vid.title}
                      </strong>

                      <div className="row-actions">
                        {vid.status !== 'trash' ? (
                          <>
                            <button onClick={() => openEditForm(vid)}>Edit</button>
                            <span>|</span>
                            <button onClick={() => setPreviewVideoItem(vid)}>
                              Quick Preview / Play
                            </button>
                            <span>|</span>
                            <button
                              onClick={() => handleTrashVideo(vid._id, vid.title)}
                              className="trash"
                            >
                              Trash
                            </button>
                          </>
                        ) : (
                          <>
                            <button onClick={() => handleRestoreVideo(vid._id)}>
                              Restore
                            </button>
                            <span>|</span>
                            <button
                              onClick={() => handlePermanentDelete(vid._id, vid.title)}
                              className="trash"
                            >
                              Delete Permanently
                            </button>
                          </>
                        )}
                      </div>
                    </td>

                    {/* Categories */}
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
                        if (vid.category) add(vid.category);
                        if (vid.subCategory) add(vid.subCategory);
                        if (vid.childCategory) add(vid.childCategory);
                        if (Array.isArray(vid.categories)) {
                          vid.categories.forEach(c => {
                            if (c) add(c);
                          });
                        }
                        if (cats.length === 0) return <span style={{ color: '#8c8f94' }}>—</span>;
                        return (
                          <span style={{ fontWeight: 600, color: '#1d2327' }}>
                            {cats.join(', ')}
                          </span>
                        );
                      })()}
                    </td>

                    {/* Duration */}
                    <td>
                      <span style={{ fontSize: '12px', color: '#646970' }}>
                        {vid.duration || '—'}
                      </span>
                    </td>

                    {/* Views */}
                    <td>{vid.views || 0}</td>

                    {/* Status Badge */}
                    <td>
                      <span className={`status-badge ${vid.status}`}>
                        {vid.status}
                      </span>
                    </td>

                    {/* Date */}
                    <td style={{ fontSize: '12px', color: '#646970' }}>
                      {new Date(vid.createdAt).toLocaleDateString()}
                    </td>

                    {/* Actions Button */}
                    <td style={{ textAlign: 'right' }}>
                      <button
                        onClick={() => openEditForm(vid)}
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
          MODE 2: WORDPRESS 2-COLUMN CLASSIC EDITOR (Add / Edit Video)
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
                ← Back to All Videos
              </button>
              <h1 style={{ fontSize: '22px', fontWeight: 600, color: '#1d2327', margin: 0 }}>
                {editingVideo ? `Edit Video: ${editingVideo.title}` : 'Add New Video'}
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
                {submitting ? 'Publishing...' : editingVideo ? 'Update Video' : 'Publish Video'}
              </button>
            </div>
          </div>

          {/* WordPress Classic 2-Column Grid */}
          <div className="wp-editor-wrap">
            {/* LEFT MAIN COLUMN: Title, Video Player & Uploader, Description */}
            <div className="wp-editor-main">
              {/* Large Title Input */}
              <input
                type="text"
                className="wp-title-input"
                placeholder="Add title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />

              {/* VIDEO SOURCE & EMBEDDED PLAYER METABOX */}
              <div className="postbox">
                <div className="postbox-header">
                  <h3>Video Source & Embedded Player</h3>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      type="button"
                      onClick={() => setVideoUploadType('upload')}
                      className={`button ${videoUploadType === 'upload' ? 'button-primary' : 'button-neutral'} button-small`}
                    >
                      <Upload size={12} /> Upload Video File
                    </button>
                    <button
                      type="button"
                      onClick={() => setVideoUploadType('url')}
                      className={`button ${videoUploadType === 'url' ? 'button-primary' : 'button-neutral'} button-small`}
                    >
                      <LinkIcon size={12} /> External URL
                    </button>
                  </div>
                </div>

                <div className="postbox-body">
                  {videoUploadType === 'upload' ? (
                    <div>
                      <div className="form-group">
                        <label className="form-label">
                          Select Video File (.mp4, .webm, .mov)
                        </label>
                        <input
                          type="file"
                          accept="video/*"
                          onChange={handleVideoFileChange}
                          className="form-input"
                          style={{ padding: '8px' }}
                        />
                        <div className="form-description">
                          Supports high-definition MP4, WEBM, MOV files. Automatic thumbnail frame is extracted instantly!
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="form-group">
                      <label className="form-label">Video Stream / Embed URL</label>
                      <input
                        type="url"
                        className="form-input"
                        placeholder="https://example.com/video.mp4 or YouTube / Vimeo URL"
                        value={videoUrl}
                        onChange={(e) => setVideoUrl(e.target.value)}
                      />
                    </div>
                  )}

                  {/* EMBEDDED VIDEO PLAYER (Directly preview and play in admin!) */}
                  {(videoFile || videoUrl || editingVideo?.videoUrl) && (
                    <div style={{ marginTop: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: '#1d2327' }}>
                          Embedded Admin Player Preview:
                        </span>
                        {duration && (
                          <span style={{ fontSize: '12px', color: '#646970', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Clock size={13} /> Duration: {duration}
                          </span>
                        )}
                      </div>

                      <div className="video-player-container">
                        <video
                          controls
                          playsInline
                          src={
                            videoFile
                              ? URL.createObjectURL(videoFile)
                              : videoUrl || editingVideo?.videoUrl
                          }
                          poster={posterPreview}
                          style={{ width: '100%', maxHeight: '420px', borderRadius: '4px' }}
                        >
                          Your browser does not support HTML5 video player.
                        </video>
                      </div>
                      <div style={{ fontSize: '12px', color: '#646970', marginTop: '6px' }}>
                        ✓ You can play, pause, seek, and verify this video directly inside the admin dashboard.
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* DESCRIPTION METABOX */}
              <div className="postbox">
                <div className="postbox-header">
                  <h3>Video Description</h3>
                </div>
                <div className="postbox-body">
                  <textarea
                    className="form-textarea"
                    placeholder="Enter detailed video description, notes, or chapter timestamps..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={6}
                  />
                </div>
              </div>

              {/* TAGS METABOX */}
              <div className="postbox">
                <div className="postbox-header">
                  <h3>Tags</h3>
                </div>
                <div className="postbox-body">
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Separate tags with commas (e.g. uncle, indian, 4k, travel)"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* RIGHT SIDEBAR COLUMN: Publish Box, Category Checklist, Poster Box */}
            <div className="wp-editor-sidebar">
              {/* 1. PUBLISH METABOX */}
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
                      <span style={{ color: '#646970' }}>Visibility:</span>
                      <strong>Public</strong>
                    </div>

                    {editingVideo && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: '#646970' }}>Created:</span>
                        <span>{new Date(editingVideo.createdAt).toLocaleDateString()}</span>
                      </div>
                    )}
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
                    {editingVideo ? (
                      <button
                        type="button"
                        onClick={() => handleTrashVideo(editingVideo._id, editingVideo.title)}
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
                      {submitting ? 'Saving...' : editingVideo ? 'Update' : 'Publish'}
                    </button>
                  </div>
                </div>
              </div>

              {/* 2. VIDEO CATEGORIES METABOX (Completely independent from Posts!) */}
              <div className="postbox">
                <div className="postbox-header">
                  <h3>Video Categories</h3>
                </div>
                <div className="postbox-body">
                  <div className="form-description" style={{ marginBottom: '8px' }}>
                    Assign video to a parent category and subcategory:
                  </div>

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
                      <option value="">— Select Video Category —</option>
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

              {/* 3. AUTOMATIC POSTER & THUMBNAIL METABOX */}
              <div className="postbox">
                <div className="postbox-header">
                  <h3>Video Poster & Thumbnail</h3>
                </div>
                <div className="postbox-body">
                  {/* Poster Preview */}
                  {posterPreview ? (
                    <div style={{ marginBottom: '12px' }}>
                      <div
                        style={{
                          width: '100%',
                          height: '140px',
                          borderRadius: '4px',
                          overflow: 'hidden',
                          border: '1px solid #c3c4c7',
                          position: 'relative',
                          background: '#000'
                        }}
                      >
                        <img
                          src={posterPreview}
                          alt="Video Poster Preview"
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      </div>

                      <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        {autoPosterDataUrl && (
                          <span className="auto-badge">
                            <Sparkles size={11} /> Auto-Extracted Frame
                          </span>
                        )}
                        {posterFile && (
                          <span style={{ fontSize: '11px', color: '#007017', fontWeight: 600 }}>
                            ✓ Custom Poster Selected
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setPosterFile(null);
                            setPosterPreview('');
                            setAutoPosterDataUrl('');
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
                      {isExtractingFrame ? (
                        <span>Extracting frame from video...</span>
                      ) : (
                        <span>
                          When you upload a video, a frame is automatically extracted as the poster!
                        </span>
                      )}
                    </div>
                  )}

                  {/* Manual Replace Upload */}
                  <div>
                    <label className="form-label" style={{ fontSize: '12px' }}>
                      Replace with Custom Poster:
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleCustomPosterChange}
                      className="form-input"
                      style={{ padding: '4px', fontSize: '12px' }}
                    />
                    <div className="form-description">
                      Optional: replace auto-generated thumbnail with your own image.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          LIVE VIDEO PREVIEW MODAL (Embedded playback on demand)
          ==================================================================== */}
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

      {previewVideoItem && (
        <div className="wp-modal-overlay" onClick={() => setPreviewVideoItem(null)}>
          <div className="wp-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="wp-modal-header">
              <h3>Admin Video Preview: {previewVideoItem.title}</h3>
              <button
                onClick={() => setPreviewVideoItem(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#646970' }}
              >
                <X size={18} />
              </button>
            </div>

            <div className="wp-modal-body" style={{ background: '#000', padding: 0 }}>
              <video
                controls
                playsInline
                src={previewVideoItem.videoUrl}
                poster={previewVideoItem.poster || previewVideoItem.thumbnail}
                style={{ width: '100%', maxHeight: '520px', display: 'block' }}
              >
                Your browser does not support HTML5 video player.
              </video>
            </div>

            <div className="wp-modal-footer">
              <div style={{ marginRight: 'auto', fontSize: '12px', color: '#646970' }}>
                Status: <strong>{previewVideoItem.status}</strong> • Views: <strong>{previewVideoItem.views || 0}</strong>
              </div>
              <button
                onClick={() => {
                  const vid = previewVideoItem;
                  setPreviewVideoItem(null);
                  openEditForm(vid);
                }}
                className="button button-primary"
              >
                Edit Video
              </button>
              <button
                onClick={() => setPreviewVideoItem(null)}
                className="button button-neutral"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoManager;

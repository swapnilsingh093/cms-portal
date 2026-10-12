import React from 'react';
import {
  Sliders,
  Image as ImageIcon,
  Film,
  FolderTree,
  Layout,
  BookOpen,
  Upload,
  Trash2,
  Loader2,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { mediaAPI } from '../../services/api';

const StoriesTemplateEditor = ({ config, onChange, onOpenMediaPicker }) => {
  const [uploading, setUploading] = React.useState(false);
  const [isDragging, setIsDragging] = React.useState(false);
  const [uploadError, setUploadError] = React.useState('');

  const banner = config.banner || {};

  const handleFileUpload = async (file) => {
    if (!file) return;
    setUploading(true);
    setUploadError('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await mediaAPI.upload(formData);
      if (res.media?.url) {
        updateBanner('mediaUrl', res.media.url);
        if (file.type.startsWith('video/')) {
          updateBanner('type', 'video');
        } else {
          updateBanner('type', 'image');
        }
      }
    } catch (err) {
      setUploadError(err.response?.data?.message || err.message || 'Error uploading file');
    } finally {
      setUploading(false);
    }
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
      handleFileUpload(file);
    }
  };
  const layout = config.layout || {};
  const categories = config.categories || {};
  const sidebar = config.sidebar || {};

  const updateBanner = (field, val) => {
    onChange(prev => ({
      ...prev,
      banner: { ...prev.banner, [field]: val }
    }));
  };

  const updateLayout = (field, val) => {
    onChange(prev => ({
      ...prev,
      layout: { ...prev.layout, [field]: val }
    }));
  };

  const updateCategories = (field, val) => {
    onChange(prev => ({
      ...prev,
      categories: { ...prev.categories, [field]: val }
    }));
  };

  const updateSidebar = (field, val) => {
    onChange(prev => ({
      ...prev,
      sidebar: { ...prev.sidebar, [field]: val }
    }));
  };

  return (
    <div className="stories-template-editor" style={{ marginBottom: '32px' }}>
      {/* Header Info Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, var(--g-accent, rgba(234, 88, 12, 0.15)) 0%, rgba(245, 158, 11, 0.08) 100%)',
          border: '1px solid var(--g-accent, rgba(234, 88, 12, 0.3))',
          borderRadius: '12px',
          padding: '16px 20px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}
      >
        <BookOpen size={24} color="var(--g-accent, #ea580c)" />
        <div>
          <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
            Stories / Editorial Journal Template Configuration
          </h3>
          <p style={{ margin: '3px 0 0 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
            Configure the editorial hero banner (no dark overlay), typography, parent story categories, and left sidebar widgets.
          </p>
        </div>
      </div>

      {/* 1. Hero Banner Settings */}
      <div className="postbox" style={{ marginBottom: '20px' }}>
        <div className="postbox-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sliders size={16} color="var(--g-accent, #ea580c)" />
            <h2>Section 1: Editorial Hero Banner</h2>
          </div>
        </div>
        <div className="postbox-inside" style={{ padding: '18px' }}>
          {/* Media Type */}
          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label className="form-label">Banner Media Type</label>
            <div style={{ display: 'flex', gap: '12px' }}>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  color: 'var(--text-primary)'
                }}
              >
                <input
                  type="radio"
                  name="storyBannerType"
                  value="image"
                  checked={banner.type === 'image' || !banner.type}
                  onChange={() => updateBanner('type', 'image')}
                />
                <ImageIcon size={15} color="var(--g-accent, #ea580c)" /> Featured Image
              </label>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  color: 'var(--text-primary)'
                }}
              >
                <input
                  type="radio"
                  name="storyBannerType"
                  value="video"
                  checked={banner.type === 'video'}
                  onChange={() => updateBanner('type', 'video')}
                />
                <Film size={15} color="var(--g-accent, #ea580c)" /> Background Video
              </label>
            </div>
          </div>

          {/* Media URL / Media Picker / Drag & Drop Selection Area */}
          <div className="form-group" style={{ marginBottom: '18px' }}>
            <label className="form-label" style={{ fontWeight: 600, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Banner Media Asset</span>
              {uploading && <span style={{ fontSize: '12px', color: 'var(--g-accent, #ea580c)', display: 'flex', alignItems: 'center', gap: '4px' }}><Loader2 size={13} className="spin" /> Uploading media...</span>}
            </label>

            {uploadError && (
              <div style={{ padding: '8px 12px', background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '6px', color: '#ef4444', fontSize: '12px', marginBottom: '10px' }}>
                {uploadError}
              </div>
            )}

            {banner.mediaUrl ? (
              <div style={{ borderRadius: '10px', border: '1px solid var(--border-color)', background: '#090e18', padding: '12px', marginBottom: '10px' }}>
                <div style={{ borderRadius: '8px', overflow: 'hidden', maxHeight: '180px', marginBottom: '10px', background: '#000', position: 'relative' }}>
                  {banner.type === 'video' ? (
                    <video src={banner.mediaUrl} autoPlay loop muted playsInline style={{ width: '100%', height: '160px', objectFit: 'cover', display: 'block' }} />
                  ) : (
                    <img src={banner.mediaUrl} alt="Story Banner Preview" style={{ width: '100%', height: '160px', objectFit: 'cover', display: 'block' }} />
                  )}
                  <span style={{ position: 'absolute', bottom: '8px', left: '8px', background: 'rgba(0,0,0,0.75)', color: '#fff', fontSize: '11px', padding: '2px 8px', borderRadius: '4px', textTransform: 'uppercase', fontWeight: 700 }}>
                    {banner.type === 'video' ? 'Video Banner' : 'Image Banner'}
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => onOpenMediaPicker && onOpenMediaPicker('storyBannerMedia')}
                    className="button button-secondary button-small"
                    style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                  >
                    <ImageIcon size={14} /> Change Media (Library)
                  </button>

                  <label className="button button-neutral button-small" style={{ cursor: uploading ? 'not-allowed' : 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <Upload size={14} /> Replace File
                    <input
                      type="file"
                      accept={banner.type === 'video' ? 'video/*' : 'image/*'}
                      style={{ display: 'none' }}
                      onChange={(e) => handleFileUpload(e.target.files?.[0])}
                      disabled={uploading}
                    />
                  </label>

                  <button
                    type="button"
                    onClick={() => updateBanner('mediaUrl', '')}
                    className="button button-danger-outline button-small"
                    title="Remove Banner Media"
                    style={{ padding: '0 12px' }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ) : (
              /* Drag & Drop Selection Area */
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                style={{
                  border: `2px dashed ${isDragging ? 'var(--g-accent, #ea580c)' : 'var(--border-color)'}`,
                  background: isDragging ? 'var(--g-accent, rgba(234, 88, 12, 0.12))' : 'rgba(255, 255, 255, 0.02)',
                  borderRadius: '12px',
                  padding: '28px 16px',
                  textAlign: 'center',
                  transition: 'all 0.2s ease',
                  marginBottom: '10px'
                }}
              >
                <Upload size={32} color={isDragging ? 'var(--g-accent, #ea580c)' : 'var(--text-muted)'} style={{ marginBottom: '8px' }} />
                <h4 style={{ margin: '0 0 4px', fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Drag & Drop Banner Image or Video Here
                </h4>
                <p style={{ margin: '0 0 14px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                  Files are automatically uploaded to your media library and set as hero banner.
                </p>

                <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => onOpenMediaPicker && onOpenMediaPicker('storyBannerMedia')}
                    className="button button-secondary button-small"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  >
                    <ImageIcon size={14} /> Select from Library
                  </button>

                  <label className="button button-primary button-small" style={{ cursor: uploading ? 'not-allowed' : 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <Upload size={14} /> Upload from Computer
                    <input
                      type="file"
                      accept="image/*,video/*"
                      style={{ display: 'none' }}
                      onChange={(e) => handleFileUpload(e.target.files?.[0])}
                      disabled={uploading}
                    />
                  </label>
                </div>
              </div>
            )}

            {/* Direct URL text input fallback */}
            <input
              type="text"
              placeholder={
                banner.type === 'video'
                  ? 'Or enter external direct video URL (e.g. https://.../video.mp4)'
                  : 'Or enter external direct image URL (e.g. https://.../banner.jpg)'
              }
              value={banner.mediaUrl || ''}
              onChange={(e) => updateBanner('mediaUrl', e.target.value)}
              className="form-input"
              style={{ width: '100%', fontSize: '12px', marginTop: '6px' }}
            />
          </div>

          {/* Banner Height & Overlay Strength */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '16px' }}>
            <div className="form-group">
              <label className="form-label">Banner Height</label>
              <select
                value={banner.height || '60vh'}
                onChange={(e) => updateBanner('height', e.target.value)}
                className="form-select"
              >
                <option value="45vh">Compact (45vh)</option>
                <option value="55vh">Medium (55vh)</option>
                <option value="60vh">Editorial Standard (60vh)</option>
                <option value="75vh">Tall (75vh)</option>
                <option value="85vh">Heroic (85vh)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">
                Overlay Strength: <strong>{banner.overlayStrength !== undefined ? banner.overlayStrength : 0}</strong>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginLeft: '6px' }}>
                  (0 = Zero overlay; image remains fully visible)
                </span>
              </label>
              <input
                type="range"
                min="0"
                max="0.8"
                step="0.05"
                value={banner.overlayStrength !== undefined ? banner.overlayStrength : 0}
                onChange={(e) => updateBanner('overlayStrength', parseFloat(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--g-accent, #ea580c)' }}
              />
            </div>
          </div>

          {/* Headings */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px', marginBottom: '16px' }}>
            <div className="form-group">
              <label className="form-label">Main Heading</label>
              <input
                type="text"
                value={banner.heading || ''}
                onChange={(e) => updateBanner('heading', e.target.value)}
                placeholder="Stories & Editorial Journal"
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Sub-heading</label>
              <input
                type="text"
                value={banner.subheading || ''}
                onChange={(e) => updateBanner('subheading', e.target.value)}
                placeholder="Thoughtful Perspectives & Chronicles"
                className="form-input"
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label className="form-label">Editorial Description</label>
            <textarea
              rows="2"
              value={banner.description || ''}
              onChange={(e) => updateBanner('description', e.target.value)}
              placeholder="Explore in-depth investigative reports, cultural essays, narratives, and insightful stories."
              className="form-input"
            />
          </div>

          {/* Button Text & URL */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '16px' }}>
            <div className="form-group">
              <label className="form-label">Button Text</label>
              <input
                type="text"
                value={banner.buttonText || ''}
                onChange={(e) => updateBanner('buttonText', e.target.value)}
                placeholder="Explore Topics"
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Button URL</label>
              <input
                type="text"
                value={banner.buttonUrl || ''}
                onChange={(e) => updateBanner('buttonUrl', e.target.value)}
                placeholder="#categories"
                className="form-input"
              />
            </div>
          </div>

          {/* Typography Sizes */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '16px' }}>
            <div className="form-group">
              <label className="form-label">Heading Font Size</label>
              <input
                type="text"
                value={banner.headingFontSize || '3.2rem'}
                onChange={(e) => updateBanner('headingFontSize', e.target.value)}
                placeholder="3.2rem"
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Subheading Font Size</label>
              <input
                type="text"
                value={banner.subheadingFontSize || '0.72rem'}
                onChange={(e) => updateBanner('subheadingFontSize', e.target.value)}
                placeholder="1.15rem"
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Description Font Size</label>
              <input
                type="text"
                value={banner.descriptionFontSize || '1.05rem'}
                onChange={(e) => updateBanner('descriptionFontSize', e.target.value)}
                placeholder="1.05rem"
                className="form-input"
              />
            </div>
          </div>

          {/* Alignment & Position */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Text Alignment</label>
              <select
                value={banner.alignment || 'left'}
                onChange={(e) => updateBanner('alignment', e.target.value)}
                className="form-select"
              >
                <option value="left">Left Aligned</option>
                <option value="center">Centered</option>
                <option value="right">Right Aligned</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Vertical Content Position</label>
              <select
                value={banner.verticalPosition || 'center'}
                onChange={(e) => updateBanner('verticalPosition', e.target.value)}
                className="form-select"
              >
                <option value="top">Top</option>
                <option value="center">Center</option>
                <option value="bottom">Bottom</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Parent Story Categories Settings */}
      <div className="postbox" style={{ marginBottom: '20px' }}>
        <div className="postbox-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FolderTree size={16} color="var(--g-accent, #ea580c)" />
            <h2>Section 2: Parent Story Categories</h2>
          </div>
        </div>
        <div className="postbox-inside" style={{ padding: '18px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '16px' }}>
            <div className="form-group">
              <label className="form-label">Section Heading</label>
              <input
                type="text"
                value={categories.heading || ''}
                onChange={(e) => updateCategories('heading', e.target.value)}
                placeholder="Editorial Columns & Categories"
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Section Subtitle</label>
              <input
                type="text"
                value={categories.subtitle || ''}
                onChange={(e) => updateCategories('subtitle', e.target.value)}
                placeholder="Browse parent story categories to explore in-depth topics"
                className="form-input"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Categories Per Page</label>
            <input
              type="number"
              min="3"
              max="24"
              value={categories.perPage || 6}
              onChange={(e) => updateCategories('perPage', Number(e.target.value))}
              className="form-input"
              style={{ maxWidth: '160px' }}
            />
          </div>
        </div>
      </div>

      {/* 3. Left Sidebar Settings */}
      <div className="postbox" style={{ marginBottom: '20px' }}>
        <div className="postbox-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Layout size={16} color="var(--g-accent, #ea580c)" />
            <h2>Section 3: Left Sidebar Configuration (Stories, Category & Subcategory Pages)</h2>
          </div>
        </div>
        <div className="postbox-inside" style={{ padding: '18px' }}>
          {/* Enable / Disable Sidebar */}
          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 600,
                color: 'var(--text-primary)'
              }}
            >
              <input
                type="checkbox"
                checked={sidebar.enabled !== false}
                onChange={(e) => updateSidebar('enabled', e.target.checked)}
                style={{ accentColor: 'var(--g-accent, #ea580c)' }}
              />
              Enable Left Sidebar (Search, Recent Stories, Video Categories, Photo Galleries, Latest Video)
            </label>
          </div>

          {sidebar.enabled !== false && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginTop: '16px' }}>
              <div className="form-group">
                <label className="form-label">Latest Stories Widget Count</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={sidebar.latestPostsCount || 5}
                  onChange={(e) => updateSidebar('latestPostsCount', Number(e.target.value))}
                  className="form-input"
                />
              </div>

              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '10px', justifyContent: 'center' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px' }}>
                  <input
                    type="checkbox"
                    checked={sidebar.videoCategoriesEnabled !== false}
                    onChange={(e) => updateSidebar('videoCategoriesEnabled', e.target.checked)}
                    style={{ accentColor: 'var(--g-accent, #ea580c)' }}
                  />
                  Video Categories Widget
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px' }}>
                  <input
                    type="checkbox"
                    checked={sidebar.galleryCategoriesEnabled !== false}
                    onChange={(e) => updateSidebar('galleryCategoriesEnabled', e.target.checked)}
                    style={{ accentColor: 'var(--g-accent, #ea580c)' }}
                  />
                  Gallery Categories Widget
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px' }}>
                  <input
                    type="checkbox"
                    checked={sidebar.latestVideoEnabled !== false}
                    onChange={(e) => updateSidebar('latestVideoEnabled', e.target.checked)}
                    style={{ accentColor: 'var(--g-accent, #ea580c)' }}
                  />
                  Latest Video Widget
                </label>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StoriesTemplateEditor;

import React from 'react';
import {
  Sliders,
  Image as ImageIcon,
  Film,
  FolderTree,
  Layout,
  Images,
  Upload
} from 'lucide-react';

const GalleriesTemplateEditor = ({ config, onChange, onOpenMediaPicker }) => {
  const banner = config?.banner || {};
  const layout = config?.layout || {};
  const categories = config?.categories || {};
  const sidebar = config?.sidebar || {};

  const updateBanner = (field, val) => {
    onChange((prev) => ({
      ...prev,
      banner: { ...(prev?.banner || {}), [field]: val }
    }));
  };

  const updateLayout = (field, val) => {
    onChange((prev) => ({
      ...prev,
      layout: { ...(prev?.layout || {}), [field]: val }
    }));
  };

  const updateCategories = (field, val) => {
    onChange((prev) => ({
      ...prev,
      categories: { ...(prev?.categories || {}), [field]: val }
    }));
  };

  const updateSidebar = (field, val) => {
    onChange((prev) => ({
      ...prev,
      sidebar: { ...(prev?.sidebar || {}), [field]: val }
    }));
  };

  return (
    <div className="galleries-template-editor" style={{ marginBottom: '32px' }}>
      {/* Header Info Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, var(--g-accent, rgba(16, 185, 129, 0.15)) 0%, rgba(5, 150, 105, 0.08) 100%)',
          border: '1px solid var(--g-accent, rgba(16, 185, 129, 0.3))',
          borderRadius: '12px',
          padding: '16px 20px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}
      >
        <Images size={24} color="var(--g-accent, #10b981)" />
        <div>
          <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
            Galleries & Visual Archive Template Configuration
          </h3>
          <p style={{ margin: '3px 0 0 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
            Configure the photography hero banner, layout modes (with or without sidebar), category pagination, and sidebar widgets.
          </p>
        </div>
      </div>

      {/* 1. Hero Banner Settings */}
      <div className="postbox" style={{ marginBottom: '20px' }}>
        <div className="postbox-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sliders size={16} color="var(--g-accent, #10b981)" />
            <h2>Section 1: Gallery Hero Banner</h2>
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
                  name="galleryBannerType"
                  value="image"
                  checked={banner.type === 'image' || !banner.type}
                  onChange={() => updateBanner('type', 'image')}
                  style={{ accentColor: 'var(--g-accent, #10b981)' }}
                />
                <ImageIcon size={16} /> Background Image
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
                  name="galleryBannerType"
                  value="video"
                  checked={banner.type === 'video'}
                  onChange={() => updateBanner('type', 'video')}
                  style={{ accentColor: 'var(--g-accent, #10b981)' }}
                />
                <Film size={16} /> Background Video (MP4 / WebM)
              </label>
            </div>
          </div>

          {/* Media Selection / Upload */}
          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label className="form-label">
              {banner.type === 'video' ? 'Banner Video URL or Media' : 'Banner Image URL or Media'}
            </label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input
                type="text"
                value={banner.mediaUrl || ''}
                onChange={(e) => updateBanner('mediaUrl', e.target.value)}
                placeholder={banner.type === 'video' ? 'https://example.com/ambient.mp4' : 'https://example.com/banner.jpg'}
                className="form-input"
                style={{ flex: 1 }}
              />
              <button
                type="button"
                onClick={() => onOpenMediaPicker && onOpenMediaPicker('galleryBannerMedia')}
                className="button button-secondary"
                style={{ display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}
              >
                <Upload size={14} /> Select from Library
              </button>
            </div>
            {banner.mediaUrl && (
              <div style={{ marginTop: '8px', borderRadius: '6px', overflow: 'hidden', maxHeight: '160px', background: '#000' }}>
                {banner.type === 'video' ? (
                  <video src={banner.mediaUrl} autoPlay loop muted playsInline style={{ width: '100%', height: '140px', objectFit: 'cover' }} />
                ) : (
                  <img src={banner.mediaUrl} alt="Banner Preview" style={{ width: '100%', height: '140px', objectFit: 'cover' }} />
                )}
              </div>
            )}
          </div>

          {/* Banner Dimensions & Text Content */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '16px' }}>
            <div className="form-group">
              <label className="form-label">Banner Height</label>
              <input
                type="text"
                value={banner.height || '65vh'}
                onChange={(e) => updateBanner('height', e.target.value)}
                placeholder="65vh or 500px"
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Dark Overlay Strength (0 to 1)</label>
              <input
                type="number"
                step="0.05"
                min="0"
                max="0.9"
                value={banner.overlayStrength !== undefined ? banner.overlayStrength : 0.35}
                onChange={(e) => updateBanner('overlayStrength', parseFloat(e.target.value))}
                className="form-input"
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '16px' }}>
            <div className="form-group">
              <label className="form-label">Main Heading</label>
              <input
                type="text"
                value={banner.heading || ''}
                onChange={(e) => updateBanner('heading', e.target.value)}
                placeholder="Photo Galleries & Visual Archives"
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Subheading / Badge</label>
              <input
                type="text"
                value={banner.subheading || ''}
                onChange={(e) => updateBanner('subheading', e.target.value)}
                placeholder="Curated High-Resolution Photography"
                className="form-input"
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label className="form-label">Description</label>
            <textarea
              rows={2}
              value={banner.description || ''}
              onChange={(e) => updateBanner('description', e.target.value)}
              placeholder="Explore curated photo albums, master galleries, and evocative visual collections."
              className="form-input"
            />
          </div>

          {/* Button Text & URL */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '16px' }}>
            <div className="form-group">
              <label className="form-label">Button Text</label>
              <input
                type="text"
                value={banner.buttonText || ''}
                onChange={(e) => updateBanner('buttonText', e.target.value)}
                placeholder="Browse Collections"
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

          {/* Font Sizes */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '16px' }}>
            <div className="form-group">
              <label className="form-label">Heading Font Size</label>
              <input
                type="text"
                value={banner.headingFontSize || '3rem'}
                onChange={(e) => updateBanner('headingFontSize', e.target.value)}
                placeholder="3rem"
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Subheading Font Size</label>
              <input
                type="text"
                value={banner.subheadingFontSize || '0.72rem'}
                onChange={(e) => updateBanner('subheadingFontSize', e.target.value)}
                placeholder="1.2rem"
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Description Font Size</label>
              <input
                type="text"
                value={banner.descriptionFontSize || '1rem'}
                onChange={(e) => updateBanner('descriptionFontSize', e.target.value)}
                placeholder="1rem"
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Button Font Size</label>
              <input
                type="text"
                value={banner.buttonFontSize || '0.95rem'}
                onChange={(e) => updateBanner('buttonFontSize', e.target.value)}
                placeholder="0.95rem"
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

      {/* 2. Layout Settings (With Sidebar vs Without Sidebar) */}
      <div className="postbox" style={{ marginBottom: '20px' }}>
        <div className="postbox-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Layout size={16} color="var(--g-accent, #10b981)" />
            <h2>Section 2: Gallery Hub Layout</h2>
          </div>
        </div>
        <div className="postbox-inside" style={{ padding: '18px' }}>
          <div className="form-group">
            <label className="form-label" style={{ marginBottom: '10px' }}>Choose Gallery Page Layout</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
              <div
                onClick={() => updateLayout('sidebar', 'with_sidebar')}
                style={{
                  padding: '16px',
                  borderRadius: '10px',
                  border: layout.sidebar !== 'without_sidebar' ? '2px solid #10b981' : '2px solid var(--border-color)',
                  background: layout.sidebar !== 'without_sidebar' ? 'var(--g-accent, rgba(16, 185, 129, 0.08))' : 'transparent',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '4px', color: 'var(--text-primary)' }}>
                  With Sidebar (2 Columns)
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  Left sidebar with category filters, album widgets & palette, right side with content.
                </div>
              </div>

              <div
                onClick={() => updateLayout('sidebar', 'without_sidebar')}
                style={{
                  padding: '16px',
                  borderRadius: '10px',
                  border: layout.sidebar === 'without_sidebar' ? '2px solid #10b981' : '2px solid var(--border-color)',
                  background: layout.sidebar === 'without_sidebar' ? 'var(--g-accent, rgba(16, 185, 129, 0.08))' : 'transparent',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '4px', color: 'var(--text-primary)' }}>
                  Without Sidebar (Full Width)
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  Full-width expansive grid showcasing photo albums and categories directly.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Photo Categories Section Settings */}
      <div className="postbox" style={{ marginBottom: '20px' }}>
        <div className="postbox-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FolderTree size={16} color="var(--g-accent, #10b981)" />
            <h2>Section 3: Photo Categories Section</h2>
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
                placeholder="Photo Gallery Categories"
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Section Subtitle</label>
              <input
                type="text"
                value={categories.subtitle || ''}
                onChange={(e) => updateCategories('subtitle', e.target.value)}
                placeholder="Browse collections by photography theme and parent categories"
                className="form-input"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Parent Categories Per Page</label>
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

      {/* 4. Dynamic Sidebar Settings */}
      {layout.sidebar !== 'without_sidebar' && (
        <div className="postbox" style={{ marginBottom: '20px' }}>
          <div className="postbox-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Layout size={16} color="var(--g-accent, #10b981)" />
              <h2>Section 4: Sidebar Configuration (Galleries Hub & Details)</h2>
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
                  style={{ accentColor: 'var(--g-accent, #10b981)' }}
                />
                Enable Sidebar Widgets
              </label>
            </div>

            {sidebar.enabled !== false && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginTop: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Latest Galleries Count</label>
                  <input
                    type="number"
                    min="1"
                    max="15"
                    value={sidebar.latestGalleriesCount || 5}
                    onChange={(e) => updateSidebar('latestGalleriesCount', Number(e.target.value))}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Latest Videos Count</label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    value={sidebar.latestVideosCount || 3}
                    onChange={(e) => updateSidebar('latestVideosCount', Number(e.target.value))}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Latest Stories Count</label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    value={sidebar.latestPostsCount || 3}
                    onChange={(e) => updateSidebar('latestPostsCount', Number(e.target.value))}
                    className="form-input"
                  />
                </div>

                <div className="form-group" style={{ display: 'flex', alignItems: 'center', paddingTop: '22px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px' }}>
                    <input
                      type="checkbox"
                      checked={sidebar.categoriesWidgetEnabled !== false}
                      onChange={(e) => updateSidebar('categoriesWidgetEnabled', e.target.checked)}
                      style={{ accentColor: 'var(--g-accent, #10b981)' }}
                    />
                    Show Categories Widget
                  </label>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default GalleriesTemplateEditor;

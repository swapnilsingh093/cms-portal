import React, { useState } from 'react';
import {
  Sliders,
  Film,
  Image as ImageIcon,
  Type,
  Filter,
  Upload,
  Trash2,
  Check,
  Loader2
} from 'lucide-react';
import { mediaAPI } from '../../services/api';

const CHOICE_CATEGORIES = ['Young Girl', 'Wife', 'Uncle', 'Old Man', 'Sasur'];
const AGE_GROUPS = ['20-25', '25-30', '30-35', '35-40', '40-45', '45-50', '50-55', '55-60'];
const MARITAL_STATUSES = ['Married', 'Un-Married'];

const SearchByVideoTemplateEditor = ({ config, onChange, onOpenMediaPicker }) => {
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const bannerType = config?.bannerType || 'video';
  const bannerUrl = config?.bannerUrl || '';
  const overlayStrength = config?.overlayStrength !== undefined ? config?.overlayStrength : 60;
  const heading = config?.heading || 'Search by Video';
  const subheading = config?.subheading || 'Find your favorite desi videos by choice, age, or marital status';
  const headingFontSize = config?.headingFontSize || '2.5rem';
  const subheadingFontSize = config?.subheadingFontSize || '1.1rem';
  const headingColor = config?.headingColor || '#ffffff';
  const subheadingColor = config?.subheadingColor || 'rgba(255, 255, 255, 0.8)';
  const accentColor = config?.accentColor || '#f2545f';
  const alignment = config?.alignment || 'center';
  const defaultChoice = config?.defaultChoice || [];
  const defaultAge = config?.defaultAge || '';
  const defaultMarital = config?.defaultMarital || '';

  const updateConfig = (field, value) => {
    onChange((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFileUpload = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', file.name);
      const res = await mediaAPI.upload(formData);
      const url = res.fileUrl || res.media?.url || res.url;
      if (url) {
        updateConfig('bannerUrl', url);
        if (file.type.startsWith('video/')) {
          updateConfig('bannerType', 'video');
        } else if (file.type.startsWith('image/')) {
          updateConfig('bannerType', 'image');
        }
      }
    } catch (err) {
      console.error('Failed to upload banner media:', err);
      alert('Failed to upload file: ' + (err.response?.data?.message || err.message));
    } finally {
      setUploading(false);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const toggleChoice = (cat) => {
    if (defaultChoice.includes(cat)) {
      updateConfig('defaultChoice', defaultChoice.filter((c) => c !== cat));
    } else {
      updateConfig('defaultChoice', [...defaultChoice, cat]);
    }
  };

  return (
    <div className="search-by-video-template-editor" style={{ marginBottom: '32px' }}>
      {/* Header Info Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(242, 84, 95, 0.15) 0%, rgba(219, 39, 119, 0.08) 100%)',
          border: '1px solid rgba(242, 84, 95, 0.35)',
          borderRadius: '12px',
          padding: '16px 20px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}
      >
        <Film size={26} color="#f2545f" />
        <div>
          <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
            Search by Video Template Configuration (WordPress Integration)
          </h3>
          <p style={{ margin: '3px 0 0 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
            Configure fullscreen video/image background, drag & drop media, typography, and default filters matching the WordPress temp_search template.
          </p>
        </div>
      </div>

      {/* 1. Background Media Settings (Drag & Drop + Media Library) */}
      <div className="postbox" style={{ marginBottom: '20px' }}>
        <div className="postbox-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sliders size={16} color="#f2545f" />
            <h2>Section 1: Background Media & Overlay</h2>
          </div>
        </div>
        <div className="postbox-inside" style={{ padding: '18px' }}>
          
          {/* Media Type Toggle */}
          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label className="form-label">Background Media Type</label>
            <div style={{ display: 'flex', gap: '16px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '14px', color: 'var(--text-primary)' }}>
                <input
                  type="radio"
                  name="sbvBannerType"
                  value="video"
                  checked={bannerType === 'video'}
                  onChange={() => updateConfig('bannerType', 'video')}
                />
                <Film size={15} color="#f2545f" /> Fullscreen Video Background
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '14px', color: 'var(--text-primary)' }}>
                <input
                  type="radio"
                  name="sbvBannerType"
                  value="image"
                  checked={bannerType === 'image'}
                  onChange={() => updateConfig('bannerType', 'image')}
                />
                <ImageIcon size={15} color="#3b82f6" /> Static Image Background
              </label>
            </div>
          </div>

          {/* Drag & Drop Upload Zone */}
          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label className="form-label">Upload or Select Background Media</label>
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              style={{
                border: `2px dashed ${dragActive ? '#f2545f' : 'var(--border-color, rgba(255,255,255,0.15))'}`,
                borderRadius: '12px',
                padding: '24px 20px',
                textAlign: 'center',
                background: dragActive ? 'rgba(242, 84, 95, 0.08)' : 'rgba(255,255,255,0.02)',
                transition: 'all 0.2s ease',
                position: 'relative'
              }}
            >
              {uploading ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', color: '#f2545f' }}>
                  <Loader2 size={32} className="spin" />
                  <span style={{ fontSize: '14px', fontWeight: 600 }}>Uploading file to media server...</span>
                </div>
              ) : (
                <>
                  <Upload size={32} color="#f2545f" style={{ marginBottom: '8px' }} />
                  <p style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                    Drag & Drop your {bannerType === 'video' ? 'video (.mp4)' : 'image'} file here
                  </p>
                  <p style={{ margin: '0 0 16px 0', fontSize: '12px', color: 'var(--text-secondary)' }}>
                    or choose an option below
                  </p>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <label
                      className="button"
                      style={{
                        cursor: 'pointer',
                        padding: '6px 14px',
                        fontSize: '12px',
                        fontWeight: 600,
                        background: 'rgba(255,255,255,0.08)',
                        border: '1px solid rgba(255,255,255,0.2)',
                        borderRadius: '6px',
                        color: '#fff'
                      }}
                    >
                      📁 Browse Local File ({bannerType === 'video' ? 'Video' : 'Image'})
                      <input
                        type="file"
                        accept={bannerType === 'video' ? 'video/*,video/mp4,video/webm,video/quicktime,video/x-matroska' : 'image/*'}
                        onChange={(e) => e.target.files && handleFileUpload(e.target.files[0])}
                        style={{ display: 'none' }}
                      />
                    </label>
                    {onOpenMediaPicker && (
                      <button
                        type="button"
                        onClick={() => {
                          onOpenMediaPicker('searchByVideoBannerMedia', (selected) => {
                            if (selected) {
                              const url = selected.url || selected.fileUrl;
                              updateConfig('bannerUrl', url);
                              if (selected.mediaType === 'video' || url?.match(/\.(mp4|webm|mov|mkv)$/i)) {
                                updateConfig('bannerType', 'video');
                              } else {
                                updateConfig('bannerType', 'image');
                              }
                            }
                          });
                        }}
                        style={{
                          cursor: 'pointer',
                          padding: '6px 14px',
                          fontSize: '12px',
                          fontWeight: 600,
                          background: 'rgba(242, 84, 95, 0.15)',
                          border: '1px solid rgba(242, 84, 95, 0.4)',
                          borderRadius: '6px',
                          color: '#f2545f',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        {bannerType === 'video' ? '📹 Select Video from Media Library' : '🖼️ Select Image from Media Library'}
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Current URL & Preview */}
          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label className="form-label">Background Media URL</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                value={bannerUrl}
                onChange={(e) => updateConfig('bannerUrl', e.target.value)}
                placeholder="/uploads/videos/16.mp4 or https://..."
                className="form-input"
                style={{ flex: 1, fontSize: '13px' }}
              />
              {bannerUrl && (
                <button
                  type="button"
                  onClick={() => updateConfig('bannerUrl', '')}
                  className="button"
                  style={{ color: '#ef4444' }}
                  title="Remove media"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Live Preview Box */}
          {bannerUrl && (
            <div style={{ marginBottom: '16px' }}>
              <label className="form-label">Live Preview</label>
              <div
                style={{
                  position: 'relative',
                  width: '100%',
                  height: '180px',
                  borderRadius: '10px',
                  overflow: 'hidden',
                  background: '#000'
                }}
              >
                {bannerType === 'video' ? (
                  <video
                    src={bannerUrl}
                    autoPlay
                    muted
                    loop
                    playsInline
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <img
                    src={bannerUrl}
                    alt="Preview"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                )}
                {/* Overlay Preview */}
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    background: `rgba(0,0,0,${overlayStrength / 100})`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontWeight: 600,
                    fontSize: '13px'
                  }}
                >
                  Overlay: {overlayStrength}%
                </div>
              </div>
            </div>
          )}

          {/* Overlay Strength Slider */}
          <div className="form-group" style={{ marginBottom: '0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label className="form-label" style={{ margin: 0 }}>Background Dark Overlay Strength</label>
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#f2545f' }}>{overlayStrength}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="95"
              step="5"
              value={overlayStrength}
              onChange={(e) => updateConfig('overlayStrength', Number(e.target.value))}
              style={{ width: '100%', accentColor: '#f2545f' }}
            />
            <span className="form-description">
              Darkens the video/image background to ensure search filters and video cards remain crisp and readable.
            </span>
          </div>

        </div>
      </div>

      {/* 2. Typography & Branding Settings */}
      <div className="postbox" style={{ marginBottom: '20px' }}>
        <div className="postbox-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Type size={16} color="#f2545f" />
            <h2>Section 2: Typography & Styling</h2>
          </div>
        </div>
        <div className="postbox-inside" style={{ padding: '18px' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Page Main Heading</label>
              <input
                type="text"
                value={heading}
                onChange={(e) => updateConfig('heading', e.target.value)}
                className="form-input"
                placeholder="Search by Video"
              />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Heading Font Size</label>
              <select
                value={headingFontSize}
                onChange={(e) => updateConfig('headingFontSize', e.target.value)}
                className="form-select"
              >
                <option value="1.8rem">1.8rem (Small)</option>
                <option value="2.2rem">2.2rem (Medium)</option>
                <option value="2.5rem">2.5rem (Default)</option>
                <option value="3rem">3.0rem (Large)</option>
                <option value="3.5rem">3.5rem (Extra Large)</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Subheading Text</label>
              <input
                type="text"
                value={subheading}
                onChange={(e) => updateConfig('subheading', e.target.value)}
                className="form-input"
                placeholder="Find your favorite desi videos by choice, age, or marital status"
              />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Subheading Font Size</label>
              <select
                value={subheadingFontSize}
                onChange={(e) => updateConfig('subheadingFontSize', e.target.value)}
                className="form-select"
              >
                <option value="0.95rem">0.95rem (Small)</option>
                <option value="1.1rem">1.1rem (Default)</option>
                <option value="1.25rem">1.25rem (Medium)</option>
                <option value="1.4rem">1.4rem (Large)</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Heading Text Color</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="color"
                  value={headingColor.startsWith('#') ? headingColor : '#ffffff'}
                  onChange={(e) => updateConfig('headingColor', e.target.value)}
                  style={{ width: '36px', height: '36px', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                />
                <input
                  type="text"
                  value={headingColor}
                  onChange={(e) => updateConfig('headingColor', e.target.value)}
                  className="form-input"
                  style={{ flex: 1, fontSize: '12px' }}
                />
              </div>
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Accent / Theme Color</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="color"
                  value={accentColor.startsWith('#') ? accentColor : '#f2545f'}
                  onChange={(e) => updateConfig('accentColor', e.target.value)}
                  style={{ width: '36px', height: '36px', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                />
                <input
                  type="text"
                  value={accentColor}
                  onChange={(e) => updateConfig('accentColor', e.target.value)}
                  className="form-input"
                  style={{ flex: 1, fontSize: '12px' }}
                />
              </div>
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Header Alignment</label>
              <select
                value={alignment}
                onChange={(e) => updateConfig('alignment', e.target.value)}
                className="form-select"
              >
                <option value="center">Center</option>
                <option value="left">Left</option>
                <option value="right">Right</option>
              </select>
            </div>
          </div>

        </div>
      </div>

      {/* 3. Default Filter Preferences */}
      <div className="postbox" style={{ marginBottom: '20px' }}>
        <div className="postbox-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Filter size={16} color="#f2545f" />
            <h2>Section 3: Default Filter Preferences (Optional)</h2>
          </div>
        </div>
        <div className="postbox-inside" style={{ padding: '18px' }}>
          
          {/* Default Choice Categories */}
          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label className="form-label">Pre-selected Choice Categories on Load</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {CHOICE_CATEGORIES.map((cat) => {
                const isSelected = defaultChoice.includes(cat);
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => toggleChoice(cat)}
                    style={{
                      padding: '6px 12px',
                      fontSize: '12px',
                      fontWeight: 600,
                      borderRadius: '6px',
                      cursor: 'pointer',
                      background: isSelected ? '#f2545f' : 'rgba(255,255,255,0.06)',
                      color: isSelected ? '#fff' : 'var(--text-secondary)',
                      border: isSelected ? '1px solid #e11d48' : '1px solid rgba(255,255,255,0.12)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    {isSelected && <Check size={12} />}
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Default Age & Marital */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Pre-selected Age Group on Load</label>
              <select
                value={defaultAge}
                onChange={(e) => updateConfig('defaultAge', e.target.value)}
                className="form-select"
              >
                <option value="">None (Any Age)</option>
                {AGE_GROUPS.map((ag) => (
                  <option key={ag} value={ag}>{ag}</option>
                ))}
              </select>
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Pre-selected Marital Status on Load</label>
              <select
                value={defaultMarital}
                onChange={(e) => updateConfig('defaultMarital', e.target.value)}
                className="form-select"
              >
                <option value="">None (Any Status)</option>
                {MARITAL_STATUSES.map((st) => (
                  <option key={st} value={st}>{st}</option>
                ))}
              </select>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default SearchByVideoTemplateEditor;

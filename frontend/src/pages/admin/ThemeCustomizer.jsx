import React, { useState, useEffect } from 'react';
import { themeAPI } from '../../services/api';
import { applyTheme } from '../../utils/themeHelper';
import {
  Paintbrush,
  Check,
  Save,
  CheckCircle,
  AlertCircle,
  Loader2,
  RefreshCw,
  Palette
} from 'lucide-react';

const PRESET_COLORS = [
  { name: 'Vibrant Indigo', primary: 'var(--g-accent, #3b82f6)', accent: 'var(--g-accent, #6366f1)' },
  { name: 'Electric Cyan', primary: '#06b6d4', accent: 'var(--g-accent, #3b82f6)' },
  { name: 'Emerald Forest', primary: 'var(--g-accent, #10b981)', accent: '#059669' },
  { name: 'Royal Purple', primary: '#8b5cf6', accent: '#ec4899' },
  { name: 'Crimson Flame', primary: '#ef4444', accent: '#f97316' },
  { name: 'Amber Glow', primary: '#f59e0b', accent: '#d97706' }
];

const FONTS = [
  { id: 'jakarta', name: 'Plus Jakarta Sans (Crisp & Modern)' },
  { id: 'inter', name: 'Inter (Clean & Professional)' },
  { id: 'roboto', name: 'Roboto (Google Standard)' },
  { id: 'outfit', name: 'Outfit (Geometric & Bold)' },
  { id: 'system', name: 'System Sans-Serif' }
];

const ThemeCustomizer = () => {
  const [siteTitle, setSiteTitle] = useState('CMS Portal');
  const [tagline, setTagline] = useState('Videos, Galleries & Articles');
  const [primaryColor, setPrimaryColor] = useState('var(--g-accent, #3b82f6)');
  const [accentColor, setAccentColor] = useState('var(--g-accent, #6366f1)');
  const [fontFamily, setFontFamily] = useState('jakarta');
  const [postsPerPage, setPostsPerPage] = useState(10);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchTheme();
  }, []);

  const fetchTheme = async () => {
    setLoading(true);
    try {
      const res = await themeAPI.getSettings();
      if (res.settings) {
        const s = res.settings;
        setSiteTitle(s.siteTitle || 'CMS Portal');
        setTagline(s.tagline || 'Videos, Galleries & Articles');
        setPrimaryColor(s.primaryColor || 'var(--g-accent, #3b82f6)');
        setAccentColor(s.accentColor || 'var(--g-accent, #6366f1)');
        setFontFamily(s.fontFamily || 'jakarta');
        setPostsPerPage(s.postsPerPage || 10);
        applyTheme(s);
      }
    } catch (err) {
      console.warn('Could not fetch remote theme settings, using active theme:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPreset = (preset) => {
    setPrimaryColor(preset.primary);
    setAccentColor(preset.accent);
    // Apply live immediately!
    applyTheme({
      primaryColor: preset.primary,
      accentColor: preset.accent,
      fontFamily,
      siteTitle
    });
  };

  const handleColorChange = (newPrimary, newAccent) => {
    setPrimaryColor(newPrimary);
    if (newAccent) setAccentColor(newAccent);
    applyTheme({
      primaryColor: newPrimary,
      accentColor: newAccent || accentColor,
      fontFamily,
      siteTitle
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      const payload = {
        siteTitle,
        tagline,
        primaryColor,
        accentColor,
        fontFamily,
        postsPerPage: Number(postsPerPage) || 10
      };

      await themeAPI.updateSettings(payload);
      applyTheme(payload);
      setMessage({ type: 'success', text: 'Theme & Appearance settings saved and applied successfully!' });
    } catch (err) {
      setMessage({
        type: 'error',
        text: err.response?.data?.message || err.message || 'Error saving theme settings'
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '360px', gap: '10px', color: 'var(--text-secondary)' }}>
        <Loader2 size={24} className="spin" /> Loading theme settings...
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1080px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
            Appearance & Theme Settings
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13.5px', marginTop: '4px' }}>
            Customize your portal's branding, color palette, typography, and site identity.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="button button-primary"
        >
          {saving ? (
            <>
              <Loader2 size={15} className="spin" /> Applying Changes...
            </>
          ) : (
            <>
              <Save size={15} /> Save Theme Settings
            </>
          )}
        </button>
      </div>

      {/* Message Banner */}
      {message.text && (
        <div
          style={{
            padding: '14px 18px',
            borderRadius: '10px',
            marginBottom: '22px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            fontSize: '14px',
            background: message.type === 'error' ? 'var(--danger-bg)' : 'var(--success-bg)',
            color: message.type === 'error' ? 'var(--danger)' : 'var(--success)',
            border: `1px solid ${message.type === 'error' ? 'rgba(239, 68, 68, 0.3)' : 'var(--g-accent, rgba(16, 185, 129, 0.3))'}`
          }}
        >
          {message.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle size={18} />}
          <span>{message.text}</span>
          <button
            onClick={() => setMessage({ type: '', text: '' })}
            style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}
          >
            ×
          </button>
        </div>
      )}

      <form onSubmit={handleSave} style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '28px' }}>
        {/* Left Column: Color Palette & Typography */}
        <div>
          {/* Color Palettes Metabox */}
          <div className="postbox">
            <div className="postbox-header">
              <h2>
                <Palette size={16} color="var(--primary-color)" /> Brand Color Palette
              </h2>
            </div>
            <div className="postbox-inside">
              <label className="form-label" style={{ marginBottom: '12px' }}>
                Preset Color Schemes (Instant Live Preview)
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', marginBottom: '24px' }}>
                {PRESET_COLORS.map((preset) => {
                  const isSelected = primaryColor.toLowerCase() === preset.primary.toLowerCase();
                  return (
                    <div
                      key={preset.name}
                      onClick={() => handleSelectPreset(preset)}
                      style={{
                        padding: '12px',
                        borderRadius: '10px',
                        background: 'var(--bg-surface)',
                        border: isSelected ? '2px solid var(--primary-color)' : '1px solid var(--border-color)',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: preset.primary }} />
                        <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: preset.accent }} />
                      </div>
                      <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {preset.name}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Custom Color Pickers */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Custom Primary Color</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <input
                      type="color"
                      value={primaryColor}
                      onChange={(e) => handleColorChange(e.target.value, accentColor)}
                      style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: '8px',
                        border: '1px solid var(--border-color)',
                        cursor: 'pointer',
                        padding: '2px',
                        background: 'var(--bg-input)'
                      }}
                    />
                    <input
                      type="text"
                      value={primaryColor}
                      onChange={(e) => handleColorChange(e.target.value, accentColor)}
                      className="form-input"
                      style={{ fontFamily: 'monospace', textTransform: 'uppercase' }}
                    />
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Custom Accent Color</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <input
                      type="color"
                      value={accentColor}
                      onChange={(e) => handleColorChange(primaryColor, e.target.value)}
                      style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: '8px',
                        border: '1px solid var(--border-color)',
                        cursor: 'pointer',
                        padding: '2px',
                        background: 'var(--bg-input)'
                      }}
                    />
                    <input
                      type="text"
                      value={accentColor}
                      onChange={(e) => handleColorChange(primaryColor, e.target.value)}
                      className="form-input"
                      style={{ fontFamily: 'monospace', textTransform: 'uppercase' }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Site Identity Box */}
          <div className="postbox">
            <div className="postbox-header">
              <h2>Site Identity</h2>
            </div>
            <div className="postbox-inside">
              <div className="form-group">
                <label className="form-label">Site Title</label>
                <input
                  type="text"
                  value={siteTitle}
                  onChange={(e) => setSiteTitle(e.target.value)}
                  className="form-input"
                  placeholder="CMS Portal"
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Tagline</label>
                <input
                  type="text"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  className="form-input"
                  placeholder="Videos, Galleries & Stories"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Typography & Preferences */}
        <div>
          {/* Typography Metabox */}
          <div className="postbox">
            <div className="postbox-header">
              <h2>Typography</h2>
            </div>
            <div className="postbox-inside">
              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label className="form-label">Body Font Family</label>
                <select
                  value={fontFamily}
                  onChange={(e) => {
                    setFontFamily(e.target.value);
                    applyTheme({
                      primaryColor,
                      accentColor,
                      fontFamily: e.target.value,
                      siteTitle
                    });
                  }}
                  className="form-select"
                >
                  {FONTS.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Archive Posts Per Page</label>
                <input
                  type="number"
                  min="3"
                  max="60"
                  value={postsPerPage}
                  onChange={(e) => setPostsPerPage(e.target.value)}
                  className="form-input"
                />
              </div>
            </div>
          </div>

          {/* Quick Preview Card */}
          <div className="postbox">
            <div className="postbox-header">
              <h2>Theme Preview</h2>
            </div>
            <div className="postbox-inside" style={{ textAlign: 'center' }}>
              <div
                style={{
                  padding: '20px 16px',
                  borderRadius: '12px',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-color)',
                  marginBottom: '14px'
                }}
              >
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    background: 'var(--accent-gradient)',
                    margin: '0 auto 10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff'
                  }}
                >
                  <Paintbrush size={18} />
                </div>
                <h4 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
                  {siteTitle}
                </h4>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '14px' }}>
                  {tagline}
                </p>
                <button type="button" className="button button-primary button-small">
                  Primary Button
                </button>
              </div>

              <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                Colors update across the application in real-time.
              </span>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ThemeCustomizer;

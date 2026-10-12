import React, { useState, useEffect } from 'react';
import { themeAPI } from '../../services/api';
import { applyTheme } from '../../utils/themeHelper';
import {
  Settings, Globe, Clock, Mail, Users, Search, Share2, Shield,
  Check, AlertCircle, Loader2, Database, FileText, Image, Video, ToggleLeft, ToggleRight, Sliders
} from 'lucide-react';

const labelStyle = {
  display: 'block', fontSize: '0.82rem', fontWeight: 600,
  color: 'var(--text-secondary)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em'
};
const inputStyle = {
  width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)',
  borderRadius: '8px', color: 'var(--text-primary)', padding: '10px 14px', fontSize: '0.9rem',
  outline: 'none', boxSizing: 'border-box'
};
const cardStyle = {
  background: 'var(--bg-surface)', border: '1px solid var(--border-color)',
  borderRadius: '12px', padding: '24px', marginBottom: '20px'
};
const sectionTitle = {
  fontSize: '1rem', fontWeight: 700, marginBottom: '18px',
  display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)',
  paddingBottom: '12px', borderBottom: '1px solid var(--border-color)'
};

const Toggle = ({ value, onChange, label }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
    <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{label}</span>
    <button type="button" onClick={() => onChange(!value)}
      style={{ background: value ? 'var(--accent-primary)' : 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 100, padding: '4px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, color: '#fff', fontSize: '0.78rem', fontWeight: 700, transition: 'background 0.2s', minWidth: 70 }}>
      {value ? <><ToggleRight size={16} /> ON</> : <><ToggleLeft size={16} /> OFF</>}
    </button>
  </div>
);

const GeneralSettings = () => {
  const [message, setMessage] = useState({ type: '', text: '' });
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');

  const [form, setForm] = useState({
    // General
    siteTitle: '',
    tagline: '',
    siteUrl: '',
    adminEmail: '',
    showAdminBar: true,
    // Membership
    allowRegistration: false,
    requireAdminApproval: true,
    defaultRole: 'user',
    requireEmailVerification: false,
    pendingApprovalMessage: 'Your registration request is pending approval by the administrator.',
    rejectedApprovalMessage: 'Your account request has been declined by the administrator.',
    suspendedAccountMessage: 'Your account has been suspended by the administrator. Please contact support.',
    // DateTime
    timezone: 'Asia/Kolkata',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '12h',
    // Media
    maxUploadSize: '1024',
    allowedImageTypes: 'jpg,jpeg,png,webp,gif,svg,bmp,tiff',
    allowedVideoTypes: 'mp4,webm,mov,avi,mkv',
    organizeByDate: true,
    generateThumbnails: true,
    // SEO
    metaDescription: '',
    googleAnalytics: '',
    facebookPixel: '',
    // Social
    socialFacebook: '',
    socialTwitter: '',
    socialInstagram: '',
    socialYoutube: '',
    socialWhatsapp: '',
    // Security
    maxLoginAttempts: '5',
    sessionTimeout: '24',
    enableCaptcha: false,
    // Reading
    postsPerPage: '10',
    excerptLength: '200',
    showFullPost: false,
  });

  useEffect(() => {
    // Load saved settings from backend
    themeAPI.getSettings().then(res => {
      const data = res.settings || res;
      if (data && typeof data === 'object') {
        setForm(prev => ({ ...prev, ...data }));
        applyTheme(data);
      }
    }).catch((err) => {
      console.error('Error loading settings:', err);
    });
  }, []);

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 4000);
  };

  const set = (key) => (e) => {
    const val = e.target ? (e.target.type === 'checkbox' ? e.target.checked : e.target.value) : e;
    setForm(prev => ({ ...prev, [key]: val }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await themeAPI.updateSettings({ ...form });
      const saved = res.settings || res;
      if (saved && typeof saved === 'object') {
        setForm(prev => ({ ...prev, ...saved }));
        applyTheme(saved);
      }
      showMessage('success', 'Settings saved successfully!');
    } catch (err) {
      showMessage('error', err.response?.data?.message || err.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { key: 'general', label: 'General', icon: Globe },
    { key: 'membership', label: 'Members', icon: Users },
    { key: 'media', label: 'Media', icon: Image },
    { key: 'reading', label: 'Reading', icon: FileText },
    { key: 'seo', label: 'SEO', icon: Search },
    { key: 'social', label: 'Social', icon: Share2 },
    { key: 'security', label: 'Security', icon: Shield },
  ];

  return (
    <form onSubmit={handleSave}>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: 10 }}>
            <Settings size={24} color="var(--accent-primary)" /> General Settings
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: 4 }}>
            Configure your site, membership, media, SEO, and security options.
          </p>
        </div>
        <button type="submit" disabled={saving}
          style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--accent-primary)', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 24px', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem' }}>
          {saving ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Saving...</> : <><Check size={16} /> Save Settings</>}
        </button>
      </div>

      {message.text && (
        <div style={{ background: message.type === 'error' ? 'rgba(239,68,68,0.15)' : 'var(--g-accent, rgba(16,185,129,0.15))', border: `1px solid ${message.type === 'error' ? 'rgba(239,68,68,0.35)' : 'var(--g-accent, rgba(16,185,129,0.35))'}`, borderRadius: 8, padding: '12px 18px', color: message.type === 'error' ? '#f87171' : '#34d399', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.9rem' }}>
          {message.type === 'error' ? <AlertCircle size={17} /> : <Check size={17} />} {message.text}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, flexWrap: 'wrap', background: 'var(--bg-surface)', borderRadius: 10, padding: 8, border: '1px solid var(--border-color)' }}>
        {tabs.map(({ key, label, icon: Icon }) => (
          <button key={key} type="button" onClick={() => setActiveTab(key)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 7, border: 'none', background: activeTab === key ? 'var(--accent-primary)' : 'transparent', color: activeTab === key ? '#fff' : 'var(--text-muted)', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', transition: 'all 0.2s' }}>
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      {/* ─── GENERAL ─── */}
      {activeTab === 'general' && (
        <div style={cardStyle}>
          <div style={sectionTitle}><Globe size={18} color="var(--accent-primary)" /> Site Identity</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginBottom: 18 }}>
            <div>
              <label style={labelStyle}>Site Title</label>
              <input style={inputStyle} type="text" value={form.siteTitle} onChange={set('siteTitle')} placeholder="My CMS Portal" />
            </div>
            <div>
              <label style={labelStyle}>Tagline / Slogan</label>
              <input style={inputStyle} type="text" value={form.tagline} onChange={set('tagline')} placeholder="Just another great website" />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginBottom: 18 }}>
            <div>
              <label style={labelStyle}>Site URL</label>
              <input style={inputStyle} type="url" value={form.siteUrl} onChange={set('siteUrl')} placeholder="https://example.com" />
            </div>
            <div>
              <label style={labelStyle}>Admin Email</label>
              <input style={inputStyle} type="email" value={form.adminEmail} onChange={set('adminEmail')} placeholder="admin@example.com" />
            </div>
          </div>
          <div style={{ marginTop: 24, ...sectionTitle }}><Clock size={18} color="var(--accent-primary)" /> Date & Time</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 18 }}>
            <div>
              <label style={labelStyle}>Timezone</label>
              <select style={inputStyle} value={form.timezone} onChange={set('timezone')}>
                <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                <option value="UTC">UTC</option>
                <option value="America/New_York">America/New_York (EST)</option>
                <option value="Europe/London">Europe/London (GMT)</option>
                <option value="Asia/Dubai">Asia/Dubai (GST)</option>
                <option value="Asia/Singapore">Asia/Singapore (SGT)</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Date Format</label>
              <select style={inputStyle} value={form.dateFormat} onChange={set('dateFormat')}>
                <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                <option value="DD MMM YYYY">DD MMM YYYY</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Time Format</label>
              <select style={inputStyle} value={form.timeFormat} onChange={set('timeFormat')}>
                <option value="12h">12 Hour (AM/PM)</option>
                <option value="24h">24 Hour</option>
              </select>
            </div>
          </div>
          <div style={{ marginTop: 24, ...sectionTitle }}><Sliders size={18} color="var(--accent-primary)" /> Frontend Toolbar</div>
          <Toggle
            label="Show Toolbar when viewing site (WordPress Admin Bar for logged in Super Admin & Editors)"
            value={form.showAdminBar !== false}
            onChange={(val) => setForm(prev => ({ ...prev, showAdminBar: val }))}
          />
        </div>
      )}

      {/* ─── MEMBERSHIP ─── */}
      {activeTab === 'membership' && (
        <div style={cardStyle}>
          <div style={sectionTitle}><Users size={18} color="var(--accent-primary)" /> Membership & Registration</div>
          <Toggle value={form.allowRegistration} onChange={set('allowRegistration')} label="Allow anyone to register an account" />
          <Toggle value={form.requireAdminApproval} onChange={set('requireAdminApproval')} label="Require Admin Approval for new registrations (user cannot login until approved)" />
          <Toggle value={form.requireEmailVerification} onChange={set('requireEmailVerification')} label="Require email verification before login" />
          <div style={{ marginTop: 18 }}>
            <label style={labelStyle}>Default Role for New Users</label>
            <select style={{ ...inputStyle, maxWidth: 300 }} value={form.defaultRole} onChange={set('defaultRole')}>
              <option value="user">Subscriber (Read-only)</option>
              <option value="editor">Editor (Can create & edit content)</option>
              <option value="admin">Administrator (Full access)</option>
            </select>
          </div>

          <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid var(--border-color)' }}>
            <h4 style={{ margin: '0 0 14px 0', fontSize: '0.95rem', color: 'var(--text-primary)', fontWeight: 600 }}>
              Custom Account Status & Login Messages
            </h4>
            <p style={{ margin: '0 0 16px 0', fontSize: '0.82rem', color: 'var(--text-dim)' }}>
              These messages are displayed to users when they attempt to log in with an unapproved, rejected, or suspended account.
            </p>

            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Pending Approval Message</label>
              <textarea
                style={{ ...inputStyle, minHeight: 64, resize: 'vertical' }}
                value={form.pendingApprovalMessage || ''}
                onChange={set('pendingApprovalMessage')}
                placeholder="Your registration request is pending approval by the administrator."
              />
              <p style={{ color: 'var(--text-dim)', fontSize: '0.78rem', marginTop: 4 }}>
                Shown to user on login screen if their account is awaiting admin approval.
              </p>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Rejected Account Message</label>
              <textarea
                style={{ ...inputStyle, minHeight: 64, resize: 'vertical' }}
                value={form.rejectedApprovalMessage || ''}
                onChange={set('rejectedApprovalMessage')}
                placeholder="Your account request has been declined by the administrator."
              />
              <p style={{ color: 'var(--text-dim)', fontSize: '0.78rem', marginTop: 4 }}>
                Shown to user on login screen if admin rejected their registration.
              </p>
            </div>

            <div>
              <label style={labelStyle}>Suspended Account Message</label>
              <textarea
                style={{ ...inputStyle, minHeight: 64, resize: 'vertical' }}
                value={form.suspendedAccountMessage || ''}
                onChange={set('suspendedAccountMessage')}
                placeholder="Your account has been suspended by the administrator. Please contact support."
              />
              <p style={{ color: 'var(--text-dim)', fontSize: '0.78rem', marginTop: 4 }}>
                Shown to user on login screen if an administrator suspended their account.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ─── MEDIA ─── */}
      {activeTab === 'media' && (
        <div style={cardStyle}>
          <div style={sectionTitle}><Image size={18} color="var(--accent-primary)" /> Media & Upload Settings</div>
          <Toggle value={form.organizeByDate} onChange={set('organizeByDate')} label="Organize uploads into year/month folders (e.g. uploads/2026/09/)" />
          <Toggle value={form.generateThumbnails} onChange={set('generateThumbnails')} label="Auto-generate thumbnails for images" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginTop: 18 }}>
            <div>
              <label style={labelStyle}>Max Upload Size (MB)</label>
              <input style={inputStyle} type="number" min={1} max={5120} value={form.maxUploadSize} onChange={set('maxUploadSize')} />
            </div>
          </div>
          <div style={{ marginTop: 18 }}>
            <label style={labelStyle}>Allowed Image Formats</label>
            <input style={inputStyle} type="text" value={form.allowedImageTypes} onChange={set('allowedImageTypes')} placeholder="jpg,jpeg,png,webp,gif,svg,bmp,tiff" />
            <p style={{ color: 'var(--text-dim)', fontSize: '0.78rem', marginTop: 4 }}>Comma-separated file extensions (no dots).</p>
          </div>
          <div style={{ marginTop: 14 }}>
            <label style={labelStyle}>Allowed Video Formats</label>
            <input style={inputStyle} type="text" value={form.allowedVideoTypes} onChange={set('allowedVideoTypes')} placeholder="mp4,webm,mov,avi,mkv" />
          </div>
        </div>
      )}

      {/* ─── READING ─── */}
      {activeTab === 'reading' && (
        <div style={cardStyle}>
          <div style={sectionTitle}><FileText size={18} color="var(--accent-primary)" /> Reading Settings</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginBottom: 18 }}>
            <div>
              <label style={labelStyle}>Posts Per Page</label>
              <input style={inputStyle} type="number" min={1} max={100} value={form.postsPerPage} onChange={set('postsPerPage')} />
            </div>
            <div>
              <label style={labelStyle}>Excerpt Length (characters)</label>
              <input style={inputStyle} type="number" min={50} max={2000} value={form.excerptLength} onChange={set('excerptLength')} />
            </div>
          </div>
          <Toggle value={form.showFullPost} onChange={set('showFullPost')} label="Show full post content in archive/listing pages (instead of excerpt)" />
        </div>
      )}

      {/* ─── SEO ─── */}
      {activeTab === 'seo' && (
        <div style={cardStyle}>
          <div style={sectionTitle}><Search size={18} color="var(--accent-primary)" /> SEO & Analytics</div>
          <div style={{ marginBottom: 18 }}>
            <label style={labelStyle}>Default Meta Description</label>
            <textarea rows={3} style={{ ...inputStyle, resize: 'vertical' }} placeholder="Brief description of your site for search engines..." value={form.metaDescription} onChange={set('metaDescription')} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
            <div>
              <label style={labelStyle}>Google Analytics ID</label>
              <input style={inputStyle} type="text" placeholder="G-XXXXXXXXXX or UA-XXXXXXXXXX" value={form.googleAnalytics} onChange={set('googleAnalytics')} />
            </div>
            <div>
              <label style={labelStyle}>Facebook Pixel ID</label>
              <input style={inputStyle} type="text" placeholder="123456789012345" value={form.facebookPixel} onChange={set('facebookPixel')} />
            </div>
          </div>
        </div>
      )}

      {/* ─── SOCIAL ─── */}
      {activeTab === 'social' && (
        <div style={cardStyle}>
          <div style={sectionTitle}><Share2 size={18} color="var(--accent-primary)" /> Social Media Links</div>
          {[
            ['socialFacebook', 'Facebook Page URL', 'https://facebook.com/yourpage'],
            ['socialTwitter', 'Twitter / X URL', 'https://twitter.com/yourhandle'],
            ['socialInstagram', 'Instagram URL', 'https://instagram.com/yourprofile'],
            ['socialYoutube', 'YouTube Channel URL', 'https://youtube.com/@yourchannel'],
            ['socialWhatsapp', 'WhatsApp Number (with country code)', '+91XXXXXXXXXX']
          ].map(([key, label, ph]) => (
            <div key={key} style={{ marginBottom: 16 }}>
              <label style={labelStyle}>{label}</label>
              <input style={inputStyle} type="text" placeholder={ph} value={form[key]} onChange={set(key)} />
            </div>
          ))}
        </div>
      )}

      {/* ─── SECURITY ─── */}
      {activeTab === 'security' && (
        <div style={cardStyle}>
          <div style={sectionTitle}><Shield size={18} color="var(--accent-primary)" /> Security Settings</div>
          <Toggle value={form.enableCaptcha} onChange={set('enableCaptcha')} label="Enable CAPTCHA on login & registration forms" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginTop: 18 }}>
            <div>
              <label style={labelStyle}>Max Login Attempts (before lockout)</label>
              <input style={inputStyle} type="number" min={3} max={20} value={form.maxLoginAttempts} onChange={set('maxLoginAttempts')} />
            </div>
            <div>
              <label style={labelStyle}>Session Timeout (hours)</label>
              <input style={inputStyle} type="number" min={1} max={720} value={form.sessionTimeout} onChange={set('sessionTimeout')} />
            </div>
          </div>
          <div style={{ marginTop: 18, padding: '14px 16px', background: 'rgba(239,68,68,0.08)', borderRadius: 8, border: '1px solid rgba(239,68,68,0.2)' }}>
            <p style={{ color: '#f87171', fontSize: '0.85rem', margin: 0 }}>
              ⚠ Security changes take effect on next server restart. Make sure to test login after changing these settings.
            </p>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </form>
  );
};

export default GeneralSettings;

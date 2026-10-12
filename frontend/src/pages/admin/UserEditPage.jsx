import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { userAPI, mediaAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import MediaPickerModal from '../../components/admin/MediaPickerModal';
import {
  User, Mail, Shield, Key, ArrowLeft, Check, AlertCircle,
  Loader2, Eye, EyeOff, RefreshCw, Trash2, Ban, CheckCircle, XCircle, Clock,
  Image as ImageIcon, Upload
} from 'lucide-react';

const MODULE_DEFS = [
  { key: "posts", label: "Posts & Stories", actions: ["view", "create", "edit", "delete"] },
  { key: "pages", label: "Pages", actions: ["view", "create", "edit", "delete"] },
  { key: "videos", label: "Videos", actions: ["view", "create", "edit", "delete"] },
  { key: "galleries", label: "Galleries", actions: ["view", "create", "edit", "delete"] },
  { key: "media", label: "Media Library", actions: ["view", "create", "edit", "delete"] },
  { key: "menus", label: "Menus & Navigation", actions: ["view", "create", "edit", "delete"] },
  { key: "theme", label: "Theme Options", actions: ["view", "create", "edit", "delete"] },
  { key: "settings", label: "Settings", actions: ["view", "create", "edit", "delete"] }
];

const generatePassword = () => {
  const chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789@#$!%&*';
  return Array.from({ length: 14 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
};

const inputStyle = {
  width: '100%',
  background: 'rgba(255, 255, 255, 0.05)',
  border: '1px solid var(--border-color, #2b3d5e)',
  borderRadius: '8px',
  color: 'var(--text-primary, #f1f5f9)',
  padding: '10px 14px',
  fontSize: '0.9rem',
  outline: 'none',
  boxSizing: 'border-box'
};

const labelStyle = {
  display: 'block',
  fontSize: '0.82rem',
  fontWeight: 600,
  color: 'var(--text-secondary, #94a3b8)',
  marginBottom: '6px',
  textTransform: 'uppercase',
  letterSpacing: '0.04em'
};

const cardStyle = {
  background: 'var(--bg-surface, #0f172a)',
  border: '1px solid var(--border-color, #1e293b)',
  borderRadius: '12px',
  padding: '24px',
  marginBottom: '24px',
  boxShadow: '0 4px 20px rgba(0,0,0,0.25)'
};

const sectionTitleStyle = {
  fontSize: '1.05rem',
  fontWeight: 700,
  color: 'var(--text-primary, #f8fafc)',
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  marginBottom: '18px',
  paddingBottom: '12px',
  borderBottom: '1px solid var(--border-color, #1e293b)'
};

const UserEditPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: currentAdmin, updateUser } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showPassword, setShowPassword] = useState(false);

  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarFileRef = useRef(null);

  const [form, setForm] = useState({
    name: '',
    username: '',
    email: '',
    role: 'user',
    status: 'active',
    statusReason: '',
    bio: '',
    avatar: '',
    password: '',
    permissions: {}
  });

  const isSelf = currentAdmin && currentAdmin._id === id;

  const showNotification = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  const handleLocalAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploadingAvatar(true);
      const fd = new FormData();
      fd.append('file', file);
      const res = await mediaAPI.upload(fd);
      if (res?.media?.url) {
        setForm(f => ({ ...f, avatar: res.media.url }));
      }
    } catch (err) {
      showNotification('error', 'Failed to upload avatar: ' + (err.response?.data?.message || err.message));
    } finally {
      setUploadingAvatar(false);
      if (avatarFileRef.current) avatarFileRef.current.value = '';
    }
  };

  const fetchUser = async () => {
    setLoading(true);
    try {
      const res = await userAPI.getById(id);
      if (res.user) {
        const u = res.user;
        setForm({
          name: u.name || '',
          username: u.username || '',
          email: u.email || '',
          role: u.role || 'user',
          status: u.status || 'active',
          statusReason: u.statusReason || '',
          bio: u.bio || '',
          avatar: u.avatar || '',
          password: '',
          permissions: u.permissions || {}
        });
      }
    } catch (err) {
      showNotification('error', err.response?.data?.message || err.message || 'Error loading user');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchUser();
  }, [id]);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        username: (form.username || '').trim().toLowerCase(),
        email: form.email.trim(),
        role: form.role,
        status: form.status,
        statusReason: form.statusReason,
        bio: form.bio,
        avatar: form.avatar,
        permissions: form.permissions
      };
      if (form.password && form.password.trim()) {
        payload.password = form.password.trim();
      }

      await userAPI.update(id, payload);
      setForm(prev => ({ ...prev, password: '' }));
      if (isSelf || (currentAdmin && currentAdmin._id === id)) {
        if (updateUser) updateUser(payload);
      }
      showNotification('success', 'User profile updated successfully!');
      fetchUser();
    } catch (err) {
      showNotification('error', err.response?.data?.message || err.message || 'Error updating user profile');
    } finally {
      setSaving(false);
    }
  };

  const handleApprove = async () => {
    try {
      await userAPI.approve(id);
      showNotification('success', 'User account approved and activated!');
      fetchUser();
    } catch (err) {
      showNotification('error', err.response?.data?.message || err.message);
    }
  };

  const handleReject = async () => {
    const reason = prompt('Optional rejection reason (will be stored):', form.statusReason || '');
    if (reason === null) return;
    try {
      await userAPI.reject(id, { reason });
      showNotification('success', 'User registration rejected.');
      fetchUser();
    } catch (err) {
      showNotification('error', err.response?.data?.message || err.message);
    }
  };

  const handleToggleSuspend = async () => {
    if (isSelf) {
      alert('You cannot suspend your own admin account.');
      return;
    }
    const isSuspending = form.status !== 'suspended';
    const reason = isSuspending ? prompt('Reason for suspension (optional):', form.statusReason || '') : '';
    if (isSuspending && reason === null) return;

    try {
      await userAPI.toggleSuspend(id, { reason });
      showNotification('success', isSuspending ? 'User account has been suspended.' : 'User account has been reactivated.');
      fetchUser();
    } catch (err) {
      showNotification('error', err.response?.data?.message || err.message);
    }
  };

  const handleDelete = async () => {
    if (isSelf) {
      alert('You cannot delete your own admin account.');
      return;
    }
    if (!window.confirm(`Are you sure you want to permanently delete user "${form.name}"? This action cannot be undone.`)) {
      return;
    }
    try {
      await userAPI.delete(id);
      navigate('/admin/users');
    } catch (err) {
      showNotification('error', err.response?.data?.message || err.message);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '360px', gap: '12px', color: 'var(--text-secondary)' }}>
        <Loader2 size={32} className="spin" color="var(--accent-primary, #6366f1)" />
        <span>Loading user profile...</span>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '980px', margin: '0 auto', paddingBottom: '60px' }}>
      {/* ── Top Bar / Breadcrumb ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <Link
            to="/admin/users"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              color: 'var(--text-muted, #94a3b8)',
              textDecoration: 'none',
              fontSize: '0.85rem',
              fontWeight: 600,
              marginBottom: '8px'
            }}
          >
            <ArrowLeft size={14} /> Back to All Users
          </Link>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '12px', color: '#fff' }}>
            <span>Edit User</span>
            <span style={{ fontSize: '1.1rem', fontWeight: 500, color: 'var(--text-muted, #94a3b8)' }}>
              — {form.name}
            </span>
          </h1>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              background: 'var(--accent-primary, #6366f1)',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              padding: '10px 22px',
              fontWeight: 700,
              fontSize: '0.9rem',
              cursor: saving ? 'wait' : 'pointer',
              boxShadow: '0 4px 16px rgba(99, 102, 241, 0.4)'
            }}
          >
            {saving ? <Loader2 size={16} className="spin" /> : <Check size={16} />}
            <span>Update User</span>
          </button>
        </div>
      </div>

      {/* ── Notification Banner ── */}
      {message.text && (
        <div style={{
          background: message.type === 'error' ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)',
          border: `1px solid ${message.type === 'error' ? 'rgba(239,68,68,0.35)' : 'rgba(16,185,129,0.35)'}`,
          borderRadius: '8px',
          padding: '12px 18px',
          color: message.type === 'error' ? '#f87171' : '#34d399',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontSize: '0.9rem'
        }}>
          {message.type === 'error' ? <AlertCircle size={17} /> : <Check size={17} />}
          <span>{message.text}</span>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* ── Section 1: Account Status & Moderation Controls ── */}
        <div style={cardStyle}>
          <div style={sectionTitleStyle}>
            <Shield size={18} color="var(--accent-primary, #6366f1)" />
            <span>Account Status & Moderation</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', background: 'rgba(255,255,255,0.02)', padding: '16px 20px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted, #94a3b8)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '4px' }}>
                Current Status
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {form.status === 'active' && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(16,185,129,0.15)', color: '#34d399', border: '1px solid rgba(16,185,129,0.3)', padding: '4px 14px', borderRadius: '20px', fontSize: '0.84rem', fontWeight: 700 }}>
                    <CheckCircle size={14} /> Active / Approved
                  </span>
                )}
                {form.status === 'pending' && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(245,158,11,0.15)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.3)', padding: '4px 14px', borderRadius: '20px', fontSize: '0.84rem', fontWeight: 700 }}>
                    <Clock size={14} /> Pending Approval
                  </span>
                )}
                {form.status === 'rejected' && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(239,68,68,0.15)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)', padding: '4px 14px', borderRadius: '20px', fontSize: '0.84rem', fontWeight: 700 }}>
                    <XCircle size={14} /> Rejected
                  </span>
                )}
                {(form.status === 'suspended' || form.status === 'banned') && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(239,68,68,0.15)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)', padding: '4px 14px', borderRadius: '20px', fontSize: '0.84rem', fontWeight: 700 }}>
                    <Ban size={14} /> Suspended
                  </span>
                )}
              </div>
            </div>

            {/* Quick Status Action Buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              {form.status === 'pending' && (
                <>
                  <button
                    type="button"
                    onClick={handleApprove}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      background: 'rgba(16,185,129,0.2)',
                      border: '1px solid #10b981',
                      color: '#34d399',
                      padding: '8px 16px',
                      borderRadius: '8px',
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      cursor: 'pointer'
                    }}
                  >
                    <CheckCircle size={15} /> Approve User
                  </button>
                  <button
                    type="button"
                    onClick={handleReject}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      background: 'rgba(239,68,68,0.15)',
                      border: '1px solid rgba(239,68,68,0.4)',
                      color: '#f87171',
                      padding: '8px 16px',
                      borderRadius: '8px',
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      cursor: 'pointer'
                    }}
                  >
                    <XCircle size={15} /> Reject Request
                  </button>
                </>
              )}

              {form.status === 'active' && !isSelf && (
                <button
                  type="button"
                  onClick={handleToggleSuspend}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: 'rgba(239,68,68,0.15)',
                    border: '1px solid #ef4444',
                    color: '#f87171',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    cursor: 'pointer'
                  }}
                >
                  <Ban size={15} /> Suspend Account
                </button>
              )}

              {form.status === 'suspended' && (
                <button
                  type="button"
                  onClick={handleToggleSuspend}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: 'rgba(16,185,129,0.2)',
                    border: '1px solid #10b981',
                    color: '#34d399',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    cursor: 'pointer'
                  }}
                >
                  <CheckCircle size={15} /> Activate Account
                </button>
              )}
            </div>
          </div>

          <div style={{ marginTop: '16px' }}>
            <label style={labelStyle}>Manual Status Override</label>
            <select
              value={form.status}
              onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
              disabled={isSelf}
              style={{ ...inputStyle, cursor: isSelf ? 'not-allowed' : 'pointer', maxWidth: '320px' }}
            >
              <option value="active">Active (Approved)</option>
              <option value="pending">Pending Approval</option>
              <option value="rejected">Rejected</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>

          <div style={{ marginTop: '14px' }}>
            <label style={labelStyle}>Status Note / Reason (Optional)</label>
            <input
              type="text"
              placeholder="e.g. Approved on request, Suspended due to violation..."
              value={form.statusReason || ''}
              onChange={e => setForm(f => ({ ...f, statusReason: e.target.value }))}
              style={inputStyle}
            />
          </div>
        </div>

        {/* ── Section 2: Personal & Contact Information ── */}
        <div style={cardStyle}>
          <div style={sectionTitleStyle}>
            <User size={18} color="var(--accent-primary, #6366f1)" />
            <span>Name & Contact Information</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px', marginBottom: '16px' }}>
            <div>
              <label style={labelStyle}>Full Name / Display Name *</label>
              <input
                type="text"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                required
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Username *</label>
              <input
                type="text"
                value={form.username}
                onChange={e => setForm(f => ({ ...f, username: e.target.value.toLowerCase().replace(/[^a-z0-9_.-]/g, '') }))}
                required
                style={inputStyle}
                placeholder="e.g. johndoe"
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted, #94a3b8)', marginTop: '4px', display: 'block' }}>
                Used for sign in. Alphanumeric, underscores, hyphens, dots.
              </span>
            </div>

            <div>
              <label style={labelStyle}>
                Email Address * (Admin Can Update)
              </label>
              <input
                type="email"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                required
                style={inputStyle}
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted, #94a3b8)', marginTop: '4px', display: 'block' }}>
                Can also be used for signing in.
              </span>
            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={labelStyle}>Profile Avatar</label>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '10px' }}>
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  background: form.avatar ? `url(${form.avatar}) center/cover` : 'var(--bg-card, #1e293b)',
                  border: '2px solid rgba(255, 255, 255, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.25rem',
                  fontWeight: 700,
                  color: '#ffffff',
                  overflow: 'hidden',
                  flexShrink: 0
                }}
              >
                {!form.avatar && (form.name ? form.name.charAt(0).toUpperCase() : 'U')}
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setMediaPickerOpen(true)}
                  className="button button-neutral"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', padding: '6px 12px' }}
                >
                  <ImageIcon size={14} /> Choose from Media
                </button>

                <button
                  type="button"
                  disabled={uploadingAvatar}
                  onClick={() => avatarFileRef.current?.click()}
                  className="button button-neutral"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', padding: '6px 12px' }}
                >
                  {uploadingAvatar ? <Loader2 size={14} className="spin" /> : <Upload size={14} />}
                  {uploadingAvatar ? 'Uploading...' : 'Upload from Device'}
                </button>

                {form.avatar && (
                  <button
                    type="button"
                    onClick={() => setForm(f => ({ ...f, avatar: '' }))}
                    className="button button-danger-outline"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', padding: '6px 10px' }}
                  >
                    <Trash2 size={13} /> Remove
                  </button>
                )}

                <input
                  ref={avatarFileRef}
                  type="file"
                  accept="image/*"
                  onChange={handleLocalAvatarUpload}
                  style={{ display: 'none' }}
                />
              </div>
            </div>

            <input
              type="text"
              placeholder="Or paste direct image URL (https://...)"
              value={form.avatar || ''}
              onChange={e => setForm(f => ({ ...f, avatar: e.target.value }))}
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Biographical Info</label>
            <textarea
              rows={3}
              placeholder="Share a little biographical information to fill out your profile..."
              value={form.bio || ''}
              onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
              style={{ ...inputStyle, resize: 'vertical' }}
            />
          </div>
        </div>

        {/* ── Section 3: Role & Permissions ── */}
        <div style={cardStyle}>
          <div style={sectionTitleStyle}>
            <Shield size={18} color="var(--accent-primary, #6366f1)" />
            <span>Role & Capability</span>
          </div>

          <div style={{ maxWidth: '360px', marginBottom: '20px' }}>
            <label style={labelStyle}>Role</label>
            <select
              value={form.role}
              onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
              disabled={isSelf}
              style={{ ...inputStyle, cursor: isSelf ? 'not-allowed' : 'pointer' }}
            >
              <option value="user">Subscriber (Regular User)</option>
              <option value="editor">Editor (Content Manager)</option>
              <option value="admin">Administrator (Full Access)</option>
            </select>
            {isSelf && (
              <span style={{ fontSize: '0.75rem', color: '#f59e0b', marginTop: '4px', display: 'block' }}>
                You cannot alter your own admin role.
              </span>
            )}
          </div>

          {/* If Role is Editor, show granular permission switches */}
          {form.role === 'editor' && (
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff', marginBottom: '12px' }}>
                Editor Module Permissions
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px' }}>
                {MODULE_DEFS.map(m => {
                  const hasView = form.permissions?.[m.key]?.view ?? false;
                  return (
                    <label key={m.key} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.84rem', color: 'var(--text-secondary, #cbd5e1)', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={hasView}
                        onChange={e => {
                          const checked = e.target.checked;
                          setForm(f => ({
                            ...f,
                            permissions: {
                              ...f.permissions,
                              [m.key]: {
                                view: checked,
                                create: checked,
                                edit: checked,
                                delete: checked
                              }
                            }
                          }));
                        }}
                      />
                      <span>{m.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* ── Section 4: Password & Security ── */}
        <div style={cardStyle}>
          <div style={sectionTitleStyle}>
            <Key size={18} color="var(--accent-primary, #6366f1)" />
            <span>Account Management & Password</span>
          </div>

          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted, #94a3b8)', marginBottom: '16px' }}>
            Leave the password field blank if you do not wish to change this user's password.
          </p>

          <div style={{ maxWidth: '480px' }}>
            <label style={labelStyle}>New Password</label>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter new password (optional)"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  style={{ ...inputStyle, paddingRight: '40px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted, #94a3b8)',
                    cursor: 'pointer',
                    padding: 0
                  }}
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  const generated = generatePassword();
                  setForm(f => ({ ...f, password: generated }));
                  setShowPassword(true);
                }}
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid var(--border-color, #2b3d5e)',
                  color: '#fff',
                  borderRadius: '8px',
                  padding: '10px 14px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  whiteSpace: 'nowrap'
                }}
              >
                <RefreshCw size={13} /> Generate
              </button>
            </div>
          </div>
        </div>

        {/* ── Section 5: Save & Danger Actions ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px', paddingTop: '10px' }}>
          <button
            type="submit"
            disabled={saving}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              background: 'var(--accent-primary, #6366f1)',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              padding: '12px 28px',
              fontWeight: 700,
              fontSize: '0.95rem',
              cursor: saving ? 'wait' : 'pointer',
              boxShadow: '0 4px 16px rgba(99, 102, 241, 0.4)'
            }}
          >
            {saving ? <Loader2 size={16} className="spin" /> : <Check size={16} />}
            <span>Save All Changes</span>
          </button>

          {!isSelf && (
            <button
              type="button"
              onClick={handleDelete}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: 'rgba(239,68,68,0.15)',
                border: '1px solid rgba(239,68,68,0.3)',
                color: '#f87171',
                borderRadius: '8px',
                padding: '10px 18px',
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: 'pointer'
              }}
            >
              <Trash2 size={15} /> Delete Account
            </button>
          )}
        </div>
      </form>

      {/* Media Picker Modal */}
      <MediaPickerModal
        isOpen={mediaPickerOpen}
        onClose={() => setMediaPickerOpen(false)}
        onSelect={(item) => {
          const it = Array.isArray(item) ? item[0] : item;
          if (it && (it.url || it.path)) {
            setForm(f => ({ ...f, avatar: it.url || it.path }));
          }
        }}
        mediaType="image"
      />
    </div>
  );
};

export default UserEditPage;

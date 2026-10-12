import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authAPI, mediaAPI } from '../../services/api';
import MediaPickerModal from '../../components/admin/MediaPickerModal';
import {
  User,
  Mail,
  Lock,
  Shield,
  Save,
  Key,
  LogOut,
  LayoutDashboard,
  CheckCircle,
  AlertCircle,
  Clock,
  Eye,
  EyeOff,
  Sparkles,
  Image as ImageIcon,
  Upload,
  Trash2,
  Loader2
} from 'lucide-react';

const ProfilePage = () => {
  const { user, setUser, updateUser, logout, isEditor, isAdmin } = useAuth();
  const navigate = useNavigate();

  // Profile form state
  const [name, setName] = useState(user?.name || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');

  // Avatar media picker & local upload
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef(null);

  // Password form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Status & messages
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [profileMsg, setProfileMsg] = useState({ type: '', text: '' });
  const [passwordMsg, setPasswordMsg] = useState({ type: '', text: '' });

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setBio(user.bio || '');
      setAvatar(user.avatar || '');
    }
  }, [user]);

  // Handle Profile Update
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileMsg({ type: '', text: '' });

    try {
      const res = await authAPI.updateProfile({ name, bio, avatar });
      if (res.user) {
        setUser((prev) => ({ ...prev, ...res.user }));
        if (updateUser) {
          updateUser(res.user);
        } else {
          localStorage.setItem('cms_user', JSON.stringify({ ...user, ...res.user }));
        }
      }
      setProfileMsg({ type: 'success', text: 'Profile information updated successfully!' });
      setTimeout(() => setProfileMsg({ type: '', text: '' }), 4000);
    } catch (err) {
      setProfileMsg({
        type: 'error',
        text: err.response?.data?.message || err.message || 'Error updating profile'
      });
    } finally {
      setSavingProfile(false);
    }
  };

  // Handle local image upload for avatar
  const handleLocalAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploadingAvatar(true);
      const fd = new FormData();
      fd.append('file', file);
      const res = await mediaAPI.upload(fd);
      if (res?.media?.url) {
        setAvatar(res.media.url);
      }
    } catch (err) {
      setProfileMsg({
        type: 'error',
        text: 'Failed to upload avatar image: ' + (err.response?.data?.message || err.message)
      });
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Handle Password Change
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordMsg({ type: '', text: '' });

    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'New password and confirm password do not match' });
      return;
    }

    if (newPassword.length < 6) {
      setPasswordMsg({ type: 'error', text: 'New password must be at least 6 characters long' });
      return;
    }

    setSavingPassword(true);

    try {
      await authAPI.updatePassword({ currentPassword, newPassword });
      setPasswordMsg({ type: 'success', text: 'Password has been updated successfully!' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordMsg({ type: '', text: '' }), 4000);
    } catch (err) {
      setPasswordMsg({
        type: 'error',
        text: err.response?.data?.message || err.message || 'Error updating password'
      });
    } finally {
      setSavingPassword(false);
    }
  };

  const roleBadge = (role) => {
    if (role === 'admin') {
      return (
        <span style={{ background: 'rgba(99, 102, 241, 0.18)', color: '#818cf8', border: '1px solid rgba(99, 102, 241, 0.35)', padding: '3px 12px', borderRadius: '12px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase' }}>
          Administrator
        </span>
      );
    }
    if (role === 'editor') {
      return (
        <span style={{ background: 'rgba(56, 189, 248, 0.18)', color: '#38bdf8', border: '1px solid rgba(56, 189, 248, 0.35)', padding: '3px 12px', borderRadius: '12px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase' }}>
          Editor
        </span>
      );
    }
    return (
      <span style={{ background: 'rgba(148, 163, 184, 0.15)', color: '#cbd5e1', border: '1px solid rgba(148, 163, 184, 0.25)', padding: '3px 12px', borderRadius: '12px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase' }}>
        Subscriber
      </span>
    );
  };

  if (!user) {
    return (
      <div style={{ maxWidth: '600px', margin: '80px auto', textAlign: 'center', padding: '40px 20px', color: '#fff' }}>
        <h2>Sign In Required</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>Please sign in to view and manage your profile.</p>
        <Link to="/login" className="button button-primary">Go to Sign In</Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '960px', margin: '40px auto 80px', padding: '0 20px' }}>
      {/* ── Top Header Hero ── */}
      <div
        style={{
          background: 'var(--bg-card, #111827)',
          border: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))',
          borderRadius: '16px',
          padding: '28px',
          boxShadow: 'var(--shadow-md, 0 10px 25px -5px rgba(0, 0, 0, 0.5))',
          marginBottom: '28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '20px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          {/* Avatar */}
          <div
            style={{
              width: '74px',
              height: '74px',
              borderRadius: '50%',
              background: avatar ? `url(${avatar}) center/cover` : 'var(--accent-gradient, linear-gradient(135deg, #6366f1, #3b82f6))',
              border: '3px solid rgba(255, 255, 255, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.75rem',
              fontWeight: 800,
              color: '#ffffff',
              boxShadow: '0 4px 15px rgba(0, 0, 0, 0.4)',
              flexShrink: 0
            }}
          >
            {!avatar && user.name?.charAt(0).toUpperCase()}
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <h1 style={{ fontSize: '1.45rem', fontWeight: 800, margin: 0, color: 'var(--text-primary, #ffffff)' }}>
                {user.name}
              </h1>
              {roleBadge(user.role)}
              <span style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '2px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 700 }}>
                Active
              </span>
            </div>
            <div style={{ fontSize: '0.88rem', color: 'var(--text-muted, #94a3b8)', marginTop: '4px' }}>
              {user.email}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {isEditor && (
            <button
              type="button"
              onClick={() => navigate('/admin')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '7px',
                background: 'rgba(99, 102, 241, 0.18)',
                border: '1px solid rgba(99, 102, 241, 0.4)',
                color: '#a5b4fc',
                padding: '9px 16px',
                borderRadius: '8px',
                fontSize: '0.86rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <LayoutDashboard size={16} /> Admin Panel
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              logout();
              navigate('/');
            }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '7px',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              color: '#f87171',
              padding: '9px 16px',
              borderRadius: '8px',
              fontSize: '0.86rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <LogOut size={16} /> Log Out
          </button>
        </div>
      </div>

      {/* ── 2-Column Grid: Profile Edit & Password Change ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px' }}>
        
        {/* ── CARD 1: Edit Profile Information ── */}
        <div
          style={{
            background: 'var(--bg-card, #111827)',
            border: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))',
            borderRadius: '16px',
            padding: '28px',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <User size={20} color="var(--accent-primary, #6366f1)" />
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary, #fff)' }}>
              Personal Details
            </h3>
          </div>

          {profileMsg.text && (
            <div
              style={{
                background: profileMsg.type === 'error' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                border: `1px solid ${profileMsg.type === 'error' ? 'rgba(239, 68, 68, 0.35)' : 'rgba(16, 185, 129, 0.35)'}`,
                color: profileMsg.type === 'error' ? '#f87171' : '#34d399',
                borderRadius: '8px',
                padding: '10px 14px',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '18px'
              }}
            >
              {profileMsg.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle size={16} />}
              <span>{profileMsg.text}</span>
            </div>
          )}

          <form onSubmit={handleUpdateProfile}>
            <div style={{ marginBottom: '18px' }}>
              <label style={labelStyle}>Full Name / Display Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                style={inputStyle}
                placeholder="Your Full Name"
              />
            </div>

            <div style={{ marginBottom: '18px' }}>
              <label style={labelStyle}>
                Username <span style={{ color: '#f59e0b', fontSize: '0.75rem' }}>(Read-Only)</span>
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  value={user?.username || ''}
                  disabled
                  readOnly
                  style={{
                    ...inputStyle,
                    background: 'rgba(255, 255, 255, 0.03)',
                    cursor: 'not-allowed',
                    color: 'var(--text-muted, #94a3b8)'
                  }}
                />
                <Lock
                  size={14}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#94a3b8'
                  }}
                />
              </div>
              <p style={{ margin: '5px 0 0 0', fontSize: '0.76rem', color: 'var(--text-dim, #64748b)' }}>
                Your username can be used alongside your email to log in.
              </p>
            </div>

            <div style={{ marginBottom: '18px' }}>
              <label style={labelStyle}>
                Email Address <span style={{ color: '#f59e0b', fontSize: '0.75rem' }}>(Read-Only)</span>
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="email"
                  value={user.email}
                  disabled
                  readOnly
                  style={{
                    ...inputStyle,
                    background: 'rgba(255, 255, 255, 0.03)',
                    cursor: 'not-allowed',
                    color: 'var(--text-muted, #94a3b8)'
                  }}
                />
                <Lock
                  size={14}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#94a3b8'
                  }}
                />
              </div>
              <p style={{ margin: '5px 0 0 0', fontSize: '0.76rem', color: 'var(--text-dim, #64748b)' }}>
                Email address cannot be changed by simple users. Contact administrator to update your email.
              </p>
            </div>

            <div style={{ marginBottom: '22px' }}>
              <label style={labelStyle}>Profile Avatar</label>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px' }}>
                <div
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    background: avatar ? `url(${avatar}) center/cover` : 'var(--bg-card, #1e293b)',
                    border: '2px solid rgba(255, 255, 255, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.4rem',
                    fontWeight: 700,
                    color: '#ffffff',
                    overflow: 'hidden',
                    flexShrink: 0
                  }}
                >
                  {!avatar && (name ? name.charAt(0).toUpperCase() : 'U')}
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
                    onClick={() => fileInputRef.current?.click()}
                    className="button button-neutral"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', padding: '6px 12px' }}
                  >
                    {uploadingAvatar ? <Loader2 size={14} className="spin" /> : <Upload size={14} />}
                    {uploadingAvatar ? 'Uploading...' : 'Upload from Device'}
                  </button>

                  {avatar && (
                    <button
                      type="button"
                      onClick={() => setAvatar('')}
                      className="button button-danger-outline"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', padding: '6px 10px' }}
                    >
                      <Trash2 size={13} /> Remove
                    </button>
                  )}

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleLocalAvatarUpload}
                    style={{ display: 'none' }}
                  />
                </div>
              </div>

              <input
                type="text"
                value={avatar}
                onChange={(e) => setAvatar(e.target.value)}
                style={inputStyle}
                placeholder="Or paste direct image URL (https://...)"
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={labelStyle}>Biographical Info</label>
              <textarea
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                style={{ ...inputStyle, resize: 'vertical' }}
                placeholder="Tell us a little bit about yourself..."
              />
            </div>

            <button
              type="submit"
              disabled={savingProfile}
              className="button button-primary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 20px', fontWeight: 700 }}
            >
              <Save size={16} />
              {savingProfile ? 'Saving...' : 'Save Profile Details'}
            </button>
          </form>
        </div>

        {/* ── CARD 2: Security & Password Update ── */}
        <div
          style={{
            background: 'var(--bg-card, #111827)',
            border: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))',
            borderRadius: '16px',
            padding: '28px',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <Key size={20} color="#f59e0b" />
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary, #fff)' }}>
              Security & Password
            </h3>
          </div>

          {passwordMsg.text && (
            <div
              style={{
                background: passwordMsg.type === 'error' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                border: `1px solid ${passwordMsg.type === 'error' ? 'rgba(239, 68, 68, 0.35)' : 'rgba(16, 185, 129, 0.35)'}`,
                color: passwordMsg.type === 'error' ? '#f87171' : '#34d399',
                borderRadius: '8px',
                padding: '10px 14px',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '18px'
              }}
            >
              {passwordMsg.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle size={16} />}
              <span>{passwordMsg.text}</span>
            </div>
          )}

          <form onSubmit={handleChangePassword}>
            <div style={{ marginBottom: '18px' }}>
              <label style={labelStyle}>Current Password</label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                style={inputStyle}
                placeholder="Enter current password"
              />
            </div>

            <div style={{ marginBottom: '18px' }}>
              <label style={labelStyle}>New Password (Min 6 Characters)</label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
                style={inputStyle}
                placeholder="••••••••"
              />
            </div>

            <div style={{ marginBottom: '18px' }}>
              <label style={labelStyle}>Confirm New Password</label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                style={inputStyle}
                placeholder="••••••••"
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted, #94a3b8)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  padding: 0
                }}
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                <span>{showPassword ? 'Hide Passwords' : 'Show Passwords'}</span>
              </button>
            </div>

            <button
              type="submit"
              disabled={savingPassword}
              className="button button-primary"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 20px',
                fontWeight: 700,
                background: '#f59e0b',
                borderColor: '#f59e0b'
              }}
            >
              <Key size={16} />
              {savingPassword ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>
      </div>

      {/* Media Picker Modal */}
      <MediaPickerModal
        isOpen={mediaPickerOpen}
        onClose={() => setMediaPickerOpen(false)}
        onSelect={(item) => {
          const it = Array.isArray(item) ? item[0] : item;
          if (it && (it.url || it.path)) {
            setAvatar(it.url || it.path);
          }
        }}
        mediaType="image"
      />
    </div>
  );
};

const labelStyle = {
  display: 'block',
  fontSize: '0.85rem',
  fontWeight: 600,
  color: 'var(--text-secondary, #cbd5e1)',
  marginBottom: '6px'
};

const inputStyle = {
  width: '100%',
  padding: '10px 14px',
  background: 'rgba(255, 255, 255, 0.05)',
  border: '1px solid var(--border-color, rgba(255, 255, 255, 0.12))',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '0.9rem',
  boxSizing: 'border-box',
  outline: 'none'
};

export default ProfilePage;

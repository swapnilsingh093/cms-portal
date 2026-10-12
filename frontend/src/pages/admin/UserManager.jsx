import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { userAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  Users, Plus, Trash2, Shield, UserCheck, UserX, X,
  AlertCircle, Key, Edit2, Search, Eye, EyeOff, RefreshCw,
  Loader2, Check, Lock, User, Clock, CheckCircle, XCircle, Ban
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

const getDefaultPermissions = (role) => {
  const isEditor = role === "editor";
  const isAdmin = role === "admin";
  const perms = {};
  MODULE_DEFS.forEach(m => {
    perms[m.key] = {
      view: isAdmin || (isEditor && m.key === "posts"),
      create: isAdmin || (isEditor && m.key === "posts"),
      edit: isAdmin || (isEditor && m.key === "posts"),
      delete: isAdmin || (isEditor && m.key === "posts")
    };
  });
  return perms;
};

const generatePassword = () => {
  const chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789@#$!';
  return Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
};

const roleBadge = (role) => {
  const styles = {
    admin: { bg: 'rgba(139,92,246,0.18)', color: '#a78bfa', label: 'Administrator' },
    editor: { bg: 'rgba(59,130,246,0.18)', color: '#60a5fa', label: 'Editor' },
    user: { bg: 'rgba(255,255,255,0.08)', color: '#94a3b8', label: 'Subscriber' }
  };
  const s = styles[role] || styles.user;
  return (
    <span style={{ background: s.bg, color: s.color, borderRadius: 100, padding: '2px 10px', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
      {s.label}
    </span>
  );
};

const UserManager = () => {
  const navigate = useNavigate();
  const { user: currentAdmin } = useAuth();
  const [users, setUsers] = useState([]);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: null });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [message, setMessage] = useState({ type: '', text: '' });

  // Add User Modal
  const [addModal, setAddModal] = useState(false);
  const [addForm, setAddForm] = useState({ name: '', username: '', email: '', password: '', role: 'user', status: 'active' });
  const [addShowPw, setAddShowPw] = useState(false);
  const [addSubmitting, setAddSubmitting] = useState(false);

  // Change Password Modal
  const [pwModal, setPwModal] = useState(false);
  const [pwUser, setPwUser] = useState(null);
  const [pwValue, setPwValue] = useState('');
  const [pwShow, setPwShow] = useState(false);
  const [pwSubmitting, setPwSubmitting] = useState(false);

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 4000);
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await userAPI.getAll();
      if (res.users) setUsers(res.users);
    } catch (err) {
      showMessage('error', err.message || 'Error loading users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  // ─── ADD USER ───────────────────────────────────────────
  const handleAddUser = async (e) => {
    e.preventDefault();
    setAddSubmitting(true);
    try {
      await userAPI.create({ ...addForm, status: 'active' });
      setAddModal(false);
      setAddForm({ name: '', username: '', email: '', password: '', role: 'user', status: 'active' });
      showMessage('success', 'User account created and active successfully!');
      fetchUsers();
    } catch (err) {
      showMessage('error', err.response?.data?.message || err.message || 'Error creating user');
    } finally {
      setAddSubmitting(false);
    }
  };

  // ─── APPROVE USER ────────────────────────────────────────
  const handleApproveUser = async (userId, userName) => {
    try {
      await userAPI.approve(userId);
      showMessage('success', `User "${userName}" approved successfully!`);
      fetchUsers();
    } catch (err) {
      showMessage('error', err.response?.data?.message || err.message);
    }
  };

  // ─── REJECT USER ─────────────────────────────────────────
  const handleRejectUser = async (userId, userName) => {
    const reason = prompt(`Reason for rejecting "${userName}" (optional):`);
    if (reason === null) return;
    try {
      await userAPI.reject(userId, { reason });
      showMessage('success', `User "${userName}" rejected.`);
      fetchUsers();
    } catch (err) {
      showMessage('error', err.response?.data?.message || err.message);
    }
  };

  // ─── CHANGE PASSWORD ──────────────────────────────────────
  const openPwModal = (u) => {
    setPwUser(u);
    setPwValue('');
    setPwShow(false);
    setPwModal(true);
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (pwValue.length < 6) { showMessage('error', 'Password must be at least 6 characters'); return; }
    setPwSubmitting(true);
    try {
      await userAPI.update(pwUser._id, { password: pwValue });
      setPwModal(false);
      showMessage('success', `Password for ${pwUser.name} updated successfully!`);
    } catch (err) {
      showMessage('error', err.response?.data?.message || err.message || 'Error changing password');
    } finally {
      setPwSubmitting(false);
    }
  };

  // ─── ROLE / STATUS / DELETE ───────────────────────────────
  const handleRoleChange = async (userId, newRole) => {
    try {
      await userAPI.update(userId, { role: newRole });
      showMessage('success', 'Role updated');
      fetchUsers();
    } catch (err) { showMessage('error', err.response?.data?.message || err.message || 'Error updating role'); }
  };

  const handleStatusToggle = async (userId, currentStatus) => {
    const next = currentStatus === 'active' ? 'suspended' : 'active';
    try {
      await userAPI.update(userId, { status: next });
      fetchUsers();
    } catch (err) { showMessage('error', err.response?.data?.message || err.message || 'Error updating status'); }
  };

  const handleDeleteUser = async (userId, userName) => {
    if (confirm(`Delete user "${userName}"? This cannot be undone.`)) {
      try {
        await userAPI.delete(userId);
        showMessage('success', `User "${userName}" deleted.`);
        fetchUsers();
      } catch (err) { showMessage('error', err.response?.data?.message || err.message || 'Error deleting user'); }
    }
  };

  // ─── FILTER ───────────────────────────────────────────────
  const counts = {
    all: users.length,
    admin: users.filter(u => u.role === 'admin').length,
    editor: users.filter(u => u.role === 'editor').length,
    user: users.filter(u => u.role === 'user').length,
    pending: users.filter(u => u.status === 'pending').length,
    suspended: users.filter(u => u.status === 'suspended' || u.status === 'banned').length
  };

  const filtered = users.filter(u => {
    let matchFilter = true;
    if (roleFilter === 'admin' || roleFilter === 'editor' || roleFilter === 'user') {
      matchFilter = u.role === roleFilter;
    } else if (roleFilter === 'pending') {
      matchFilter = u.status === 'pending';
    } else if (roleFilter === 'suspended') {
      matchFilter = u.status === 'suspended' || u.status === 'banned';
    }
    const matchSearch = !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const tabStyle = (key) => ({
    padding: '8px 18px',
    borderRadius: '6px',
    border: 'none',
    background: roleFilter === key ? 'var(--accent-primary)' : 'transparent',
    color: roleFilter === key ? '#fff' : 'var(--text-muted)',
    cursor: 'pointer',
    fontSize: '0.85rem',
    fontWeight: 600,
    transition: 'all 0.2s'
  });

  const inputStyle = {
    width: '100%',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid var(--border-color)',
    borderRadius: '8px',
    color: 'var(--text-primary)',
    padding: '10px 14px',
    fontSize: '0.9rem',
    outline: 'none'
  };

  const labelStyle = {
    display: 'block',
    fontSize: '0.82rem',
    fontWeight: 600,
    color: 'var(--text-secondary)',
    marginBottom: '6px',
    textTransform: 'uppercase',
    letterSpacing: '0.04em'
  };

  return (
    <div>
      {/* ── Page Header ── */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: 10 }}>
            <Users size={24} color="var(--accent-primary)" /> User Management
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: 4 }}>
            Manage accounts, roles, passwords and access control.
          </p>
        </div>
        <button onClick={() => { setAddForm({ name: '', email: '', password: generatePassword(), role: 'user', status: 'active' }); setAddModal(true); }}
          style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--accent-primary)', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem' }}>
          <Plus size={17} /> Add New User
        </button>
      </div>

      {/* ── Message Banner ── */}
      {message.text && (
        <div style={{ background: message.type === 'error' ? 'rgba(239,68,68,0.15)' : 'var(--g-accent, rgba(16,185,129,0.15))', border: `1px solid ${message.type === 'error' ? 'rgba(239,68,68,0.35)' : 'var(--g-accent, rgba(16,185,129,0.35))'}`, borderRadius: 8, padding: '12px 18px', color: message.type === 'error' ? '#f87171' : '#34d399', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.9rem' }}>
          {message.type === 'error' ? <AlertCircle size={17} /> : <Check size={17} />} {message.text}
        </div>
      )}

      {/* ── Filter Tabs + Search ── */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 14, marginBottom: 20, padding: '14px 18px', background: 'var(--bg-surface)', borderRadius: 10, border: '1px solid var(--border-color)' }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {[
            ['all', 'All'],
            ['admin', 'Admins'],
            ['editor', 'Editors'],
            ['user', 'Subscribers'],
            ['pending', 'Pending Approval'],
            ['suspended', 'Suspended']
          ].map(([key, label]) => {
            const isPendingTab = key === 'pending';
            const count = counts[key] || 0;
            return (
              <button
                key={key}
                onClick={() => setRoleFilter(key)}
                style={{
                  ...tabStyle(key),
                  ...(isPendingTab && count > 0 && roleFilter !== 'pending' ? { color: '#fbbf24', border: '1px solid rgba(245,158,11,0.4)', background: 'rgba(245,158,11,0.1)' } : {})
                }}
              >
                {label} <span style={{ opacity: 0.8, fontWeight: 700, fontSize: '0.78rem' }}>({count})</span>
              </button>
            );
          })}
        </div>
        <div style={{ position: 'relative' }}>
          <Search size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
          <input
            type="text"
            placeholder="Search users..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ ...inputStyle, paddingLeft: 32, width: 220 }}
          />
        </div>
      </div>

      {/* ── Users Table ── */}
      <div style={{ background: 'var(--bg-surface)', borderRadius: 10, border: '1px solid var(--border-color)', overflowX: 'auto' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
            <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} /> Loading users...
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-dim)' }}>
            No users found.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-dim)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                <th style={{ padding: '12px 20px' }}>User</th>
                <th style={{ padding: '12px 20px' }}>Role</th>
                <th style={{ padding: '12px 20px' }}>Status</th>
                <th style={{ padding: '12px 20px', textAlign: 'center', whiteSpace: 'nowrap' }}>Posts</th>
                <th style={{ padding: '12px 20px', whiteSpace: 'nowrap' }}>Joined</th>
                <th style={{ padding: '12px 20px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.sort((a, b) => {
                if (currentAdmin && a._id === currentAdmin._id) return -1;
                if (currentAdmin && b._id === currentAdmin._id) return 1;
                if (a.role === 'admin' && b.role !== 'admin') return -1;
                if (a.role !== 'admin' && b.role === 'admin') return 1;
                return new Date(b.createdAt) - new Date(a.createdAt);
              }).map(u => {
                const isSelf = currentAdmin && currentAdmin._id === u._id;
                return (
                  <tr key={u._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '14px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 38, height: 38, borderRadius: '50%', background: u.role === 'admin' ? 'linear-gradient(135deg,#7c3aed,#3b82f6)' : 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.9rem', flexShrink: 0 }}>
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div
                            onClick={() => navigate(`/admin/users/edit/${u._id}`)}
                            style={{ fontWeight: 600, fontSize: '0.92rem', cursor: 'pointer', color: 'var(--text-primary)', display: 'flex', alignItems: 'center' }}
                            title="Click to edit user profile"
                          >
                            <span style={{ textDecoration: 'underline', textDecorationColor: 'transparent', transition: 'text-decoration-color 0.2s' }}
                              onMouseEnter={e => e.currentTarget.style.textDecorationColor = 'var(--accent-primary)'}
                              onMouseLeave={e => e.currentTarget.style.textDecorationColor = 'transparent'}
                            >
                              {u.name}
                            </span>
                            {isSelf && <span style={{ fontSize: '0.7rem', color: 'var(--accent-primary)', marginLeft: 6 }}>(You)</span>}
                          </div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>@{u.username || 'user'}</span>
                            <span style={{ opacity: 0.4 }}>•</span>
                            <span>{u.email}</span>
                          </div>
                          {u.bio && <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: 2 }}>{u.bio.slice(0, 40)}{u.bio.length > 40 ? '…' : ''}</div>}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      {isSelf ? roleBadge(u.role) : (
                        <select value={u.role} onChange={e => handleRoleChange(u._id, e.target.value)}
                          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-color)', borderRadius: 6, color: 'var(--text-primary)', padding: '4px 8px', fontSize: '0.8rem', cursor: 'pointer' }}>
                          <option value="user">Subscriber</option>
                          <option value="editor">Editor</option>
                          <option value="admin">Administrator</option>
                        </select>
                      )}
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      {u.status === 'active' && (
                        <button onClick={() => !isSelf && handleStatusToggle(u._id, u.status)}
                          disabled={isSelf}
                          title={isSelf ? '' : 'Click to suspend'}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap', background: 'rgba(16,185,129,0.15)', color: '#34d399', border: '1px solid rgba(16,185,129,0.3)', padding: '5px 12px', borderRadius: 100, fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', cursor: isSelf ? 'default' : 'pointer' }}>
                          <CheckCircle size={12} /> Active
                        </button>
                      )}
                      {u.status === 'pending' && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap', background: 'rgba(245,158,11,0.15)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.3)', padding: '5px 12px', borderRadius: 100, fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase' }}>
                          <Clock size={12} /> Pending Approval
                        </span>
                      )}
                      {u.status === 'rejected' && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap', background: 'rgba(239,68,68,0.12)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)', padding: '5px 12px', borderRadius: 100, fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase' }}>
                          <XCircle size={12} /> Rejected
                        </span>
                      )}
                      {(u.status === 'suspended' || u.status === 'banned') && (
                        <button onClick={() => !isSelf && handleStatusToggle(u._id, u.status)}
                          disabled={isSelf}
                          title={isSelf ? '' : 'Click to activate'}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap', background: 'rgba(239,68,68,0.15)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)', padding: '5px 12px', borderRadius: 100, fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', cursor: isSelf ? 'default' : 'pointer' }}>
                          <Ban size={12} /> Suspended
                        </button>
                      )}
                    </td>
                    {/* WordPress-style Posts Column */}
                    <td style={{ padding: '14px 20px', textAlign: 'center' }}>
                      <button
                        type="button"
                        onClick={() => navigate(`/admin/posts?author=${u._id}`)}
                        title={`Posts: ${u.postsCount || 0} | Videos: ${u.videosCount || 0} | Galleries: ${u.galleriesCount || 0} (Click to filter posts)`}
                        style={{
                          background: (u.totalContentCount || u.postsCount) ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.04)',
                          color: (u.totalContentCount || u.postsCount) ? '#a5b4fc' : 'var(--text-dim)',
                          border: (u.totalContentCount || u.postsCount) ? '1px solid rgba(99,102,241,0.35)' : '1px solid rgba(255,255,255,0.08)',
                          borderRadius: 8,
                          padding: '4px 12px',
                          fontSize: '0.85rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(99,102,241,0.25)';
                          e.currentTarget.style.transform = 'translateY(-1px)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = (u.totalContentCount || u.postsCount) ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.04)';
                          e.currentTarget.style.transform = 'none';
                        }}
                      >
                        <span>{u.totalContentCount || u.postsCount || 0}</span>
                        {(u.videosCount > 0 || u.galleriesCount > 0) && (
                          <span style={{ fontSize: '0.7rem', opacity: 0.75, fontWeight: 500 }}>
                            ({u.postsCount || 0}P / {u.videosCount || 0}V / {u.galleriesCount || 0}G)
                          </span>
                        )}
                      </button>
                    </td>
                    <td style={{ padding: '14px 20px', fontSize: '0.82rem', color: 'var(--text-dim)', whiteSpace: 'nowrap' }}>
                      {new Date(u.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'flex-end' }}>
                        <button onClick={() => navigate(`/admin/users/edit/${u._id}`)} title="Edit complete user profile (WordPress style)"
                          style={{ background: 'rgba(59,130,246,0.15)', color: '#60a5fa', border: '1px solid rgba(59,130,246,0.3)', borderRadius: 6, padding: '6px 14px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: '0.82rem', fontWeight: 600 }}>
                          <Edit2 size={13} /> Edit
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════ */}
      {/* ── ADD USER MODAL ── */}
      {addModal && (
        <div onClick={() => setAddModal(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, backdropFilter: 'blur(4px)' }}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 14, padding: '32px', width: '100%', maxWidth: 680, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 24px 80px rgba(0,0,0,0.5)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
              <h3 style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: 8 }}><User size={20} color="var(--accent-primary)" /> Add New User</h3>
              <button onClick={() => setAddModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <form onSubmit={handleAddUser}>
              <div style={{ marginBottom: 18 }}>
                <label style={labelStyle}>Full Name *</label>
                <input type="text" required placeholder="e.g. Rahul Sharma" style={inputStyle} value={addForm.name} onChange={e => setAddForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div style={{ marginBottom: 18 }}>
                <label style={labelStyle}>Username *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. rahul_sharma"
                  style={inputStyle}
                  value={addForm.username}
                  onChange={e => setAddForm(f => ({ ...f, username: e.target.value.toLowerCase().replace(/[^a-z0-9_.-]/g, '') }))}
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: 4, display: 'block' }}>
                  Alphanumeric, underscores, hyphens, and dots only. Used for login.
                </span>
              </div>
              <div style={{ marginBottom: 18 }}>
                <label style={labelStyle}>Email Address *</label>
                <input type="email" required placeholder="rahul@example.com" style={inputStyle} value={addForm.email} onChange={e => setAddForm(f => ({ ...f, email: e.target.value }))} />
              </div>
              <div style={{ marginBottom: 18 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <label style={{ ...labelStyle, marginBottom: 0 }}>Password *</label>
                  <button type="button" onClick={() => setAddForm(f => ({ ...f, password: generatePassword() }))}
                    style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', cursor: 'pointer', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <RefreshCw size={12} /> Generate
                  </button>
                </div>
                <div style={{ position: 'relative' }}>
                  <input type={addShowPw ? 'text' : 'password'} required minLength={6} style={{ ...inputStyle, paddingRight: 42 }} value={addForm.password} onChange={e => setAddForm(f => ({ ...f, password: e.target.value }))} />
                  <button type="button" onClick={() => setAddShowPw(v => !v)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}>
                    {addShowPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
                <div>
                  <label style={labelStyle}>Role</label>
                  <select style={inputStyle} value={addForm.role} onChange={e => setAddForm(f => ({ ...f, role: e.target.value }))}>
                    <option value="user">Subscriber</option>
                    <option value="editor">Editor</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Status</label>
                  <select style={inputStyle} value={addForm.status} onChange={e => setAddForm(f => ({ ...f, status: e.target.value }))}>
                    <option value="active">Active</option>
                    <option value="banned">Suspended</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                <button type="button" onClick={() => setAddModal(false)} style={{ padding: '10px 20px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
                <button type="submit" disabled={addSubmitting} style={{ padding: '10px 24px', borderRadius: 8, border: 'none', background: 'var(--accent-primary)', color: '#fff', cursor: 'pointer', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                  {addSubmitting ? <><Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> Creating...</> : <><Plus size={15} /> Create User</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}



      {/* ── CHANGE PASSWORD MODAL ── */}
      {pwModal && pwUser && (
        <div onClick={() => setPwModal(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, backdropFilter: 'blur(4px)' }}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 14, padding: '32px', width: '100%', maxWidth: 440, boxShadow: '0 24px 80px rgba(0,0,0,0.5)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
              <h3 style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: 8 }}><Lock size={20} color="#fbbf24" /> Change Password</h3>
              <button onClick={() => setPwModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: 20 }}>
              Setting new password for: <strong style={{ color: 'var(--text-primary)' }}>{pwUser.name}</strong> ({pwUser.email})
            </p>
            <form onSubmit={handleChangePassword}>
              <div style={{ marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <label style={{ ...labelStyle, marginBottom: 0 }}>New Password</label>
                  <button type="button" onClick={() => setPwValue(generatePassword())} style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', cursor: 'pointer', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <RefreshCw size={12} /> Generate Strong
                  </button>
                </div>
                <div style={{ position: 'relative' }}>
                  <input type={pwShow ? 'text' : 'password'} required minLength={6} placeholder="Minimum 6 characters" style={{ ...inputStyle, paddingRight: 42 }} value={pwValue} onChange={e => setPwValue(e.target.value)} />
                  <button type="button" onClick={() => setPwShow(v => !v)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}>
                    {pwShow ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {pwValue && <div style={{ marginTop: 6, fontSize: '0.75rem', color: pwValue.length >= 8 ? '#34d399' : '#fbbf24' }}>{pwValue.length >= 8 ? '✓ Strong password' : '⚠ Use at least 8 characters for better security'}</div>}
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                <button type="button" onClick={() => setPwModal(false)} style={{ padding: '10px 20px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
                <button type="submit" disabled={pwSubmitting} style={{ padding: '10px 24px', borderRadius: 8, border: 'none', background: '#f59e0b', color: '#1a1a1a', cursor: 'pointer', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                  {pwSubmitting ? <><Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> Updating...</> : <><Key size={15} /> Update Password</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

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
    </div>
  );
};

export default UserManager;

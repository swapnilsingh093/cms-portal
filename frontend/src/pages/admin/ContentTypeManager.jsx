import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Layers, Plus, Trash2, Edit2, X, Check, ChevronDown, ChevronUp,
  FileText, Eye, Settings, ArrowRight, Loader2
} from 'lucide-react';
import FieldBuilder from './FieldBuilder';

const ICON_OPTIONS = ['🎵', '🎙️', '📻', '🎤', '📅', '💼', '💡', '🏷️', '🔬', '🏆', '🌍', '📰', '🎨', '📊', '🛒', '⭐', '🎭', '🔗', '🎓', '🏥', '🍕', '🎮'];

const slugify = (str) => str.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');

const inputStyle = {
  width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)',
  borderRadius: 8, color: 'var(--text-primary)', padding: '10px 14px', fontSize: '0.9rem',
  outline: 'none', boxSizing: 'border-box'
};
const labelStyle = { display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' };

// Built-in content types
const BUILTIN = [
  { name: 'Posts', slug: 'posts', icon: '📝', description: 'Blog posts and articles', route: '/admin/posts' },
  { name: 'Videos', slug: 'videos', icon: '🎬', description: 'Video content with player', route: '/admin/videos' },
  { name: 'Galleries', slug: 'galleries', icon: '🖼️', description: 'Photo gallery albums', route: '/admin/gallery' },
  { name: 'Pages', slug: 'pages', icon: '📄', description: 'Static pages (About, Contact)', route: '/admin/pages' },
];

const ContentTypeManager = () => {
  const navigate = useNavigate();
  const [types, setTypes] = useState([
    {
      id: 'cpt_podcast', name: 'Podcasts', slug: 'podcasts', icon: '🎵',
      description: 'Audio podcast episodes',
      fields: [
        { id: 'f1', label: 'Audio URL', key: 'audioUrl', type: 'url', required: true, placeholder: 'https://...', subFields: [] },
        { id: 'f2', label: 'Duration', key: 'duration', type: 'text', required: false, placeholder: 'e.g. 45:20', subFields: [] },
        { id: 'f3', label: 'Episode Number', key: 'episode', type: 'number', required: false, placeholder: '', subFields: [] },
      ],
      entries: []
    }
  ]);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ name: '', slug: '', icon: '📝', description: '', fields: [] });
  const [expandedType, setExpandedType] = useState(null);
  const [activeTab, setActiveTab] = useState({}); // typeId -> 'fields' | 'entries'
  const [saving, setSaving] = useState(false);
  const [newEntryModal, setNewEntryModal] = useState(null); // typeId
  const [entryForm, setEntryForm] = useState({ title: '' });

  const openAdd = () => {
    setForm({ name: '', slug: '', icon: '📝', description: '', fields: [] });
    setEditingId(null);
    setShowForm(true);
  };

  const openEdit = (t) => {
    setForm({ ...t, fields: t.fields || [] });
    setEditingId(t.id);
    setShowForm(true);
  };

  const handleSave = () => {
    if (!form.name.trim()) return;
    const slug = form.slug || slugify(form.name);
    if (editingId) {
      setTypes(prev => prev.map(t => t.id === editingId ? { ...t, ...form, slug } : t));
    } else {
      setTypes(prev => [...prev, { ...form, slug, id: 'cpt_' + Date.now(), entries: [] }]);
    }
    setShowForm(false);
  };

  const handleDelete = (id, name) => {
    if (confirm(`Delete "${name}"? All content entries will be lost.`)) {
      setTypes(prev => prev.filter(t => t.id !== id));
    }
  };

  const openNewEntry = (typeId) => {
    const type = types.find(t => t.id === typeId);
    if (!type) return;
    const entryFields = {};
    type.fields.forEach(f => { entryFields[f.key] = f.default || ''; });
    setEntryForm({ title: '', ...entryFields });
    setNewEntryModal(typeId);
  };

  const saveEntry = (typeId) => {
    setTypes(prev => prev.map(t => {
      if (t.id !== typeId) return t;
      const newEntry = { id: 'entry_' + Date.now(), ...entryForm, createdAt: new Date().toISOString() };
      return { ...t, entries: [...(t.entries || []), newEntry] };
    }));
    setNewEntryModal(null);
    setEntryForm({ title: '' });
  };

  const deleteEntry = (typeId, entryId) => {
    setTypes(prev => prev.map(t => t.id !== typeId ? t : { ...t, entries: t.entries.filter(e => e.id !== entryId) }));
  };

  const getTab = (typeId) => activeTab[typeId] || 'fields';
  const setTab = (typeId, tab) => setActiveTab(prev => ({ ...prev, [typeId]: tab }));

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: 10 }}>
            <Layers size={24} color="var(--accent-primary)" /> Custom Content Types
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: 4 }}>
            Build custom content structures like Podcasts, Events, Portfolio, Testimonials. Add custom fields using the ACF-style field builder.
          </p>
        </div>
        <button onClick={openAdd}
          style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--accent-primary)', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem', flexShrink: 0 }}>
          <Plus size={17} /> New Content Type
        </button>
      </div>

      {/* ── Built-in Types ── */}
      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 12, padding: '18px 22px', marginBottom: 22 }}>
        <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-dim)', fontWeight: 700, marginBottom: 12 }}>Built-in Content Types</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: 10 }}>
          {BUILTIN.map(b => (
            <button key={b.slug} onClick={() => navigate(b.route)}
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-color)', borderRadius: 8, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', textAlign: 'left', color: 'var(--text-primary)', transition: 'border-color 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent-primary)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-color)'}>
              <span style={{ fontSize: '1.4rem' }}>{b.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{b.name}</div>
                <div style={{ fontSize: '0.73rem', color: 'var(--text-dim)' }}>{b.description}</div>
              </div>
              <ArrowRight size={14} color="var(--text-dim)" />
            </button>
          ))}
        </div>
      </div>

      {/* ── Custom Types ── */}
      {types.length === 0 ? (
        <div style={{ background: 'var(--bg-surface)', border: '2px dashed var(--border-color)', borderRadius: 12, padding: '48px 24px', textAlign: 'center' }}>
          <Layers size={40} color="var(--text-dim)" style={{ marginBottom: 12 }} />
          <p style={{ color: 'var(--text-dim)', marginBottom: 16, margin: '0 0 16px' }}>No custom content types yet.</p>
          <button onClick={openAdd} style={{ background: 'var(--accent-primary)', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 7 }}>
            <Plus size={16} /> Create First Content Type
          </button>
        </div>
      ) : (
        types.map(t => (
          <div key={t.id} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 12, marginBottom: 16, overflow: 'hidden' }}>
            {/* Type Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 20px', cursor: 'pointer', background: expandedType === t.id ? 'rgba(255,255,255,0.02)' : 'transparent' }}
              onClick={() => setExpandedType(expandedType === t.id ? null : t.id)}>
              <span style={{ fontSize: '1.5rem', flexShrink: 0 }}>{t.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: '1rem' }}>{t.name}</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                  /{t.slug} · {t.fields?.length || 0} fields · {t.entries?.length || 0} entries · {t.description}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }} onClick={e => e.stopPropagation()}>
                <button onClick={() => openNewEntry(t.id)}
                  style={{ background: 'var(--g-accent, rgba(16,185,129,0.15))', color: '#34d399', border: 'none', borderRadius: 7, padding: '6px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontWeight: 600, fontSize: '0.8rem' }}>
                  <Plus size={13} /> Add Entry
                </button>
                <button onClick={() => openEdit(t)}
                  style={{ background: 'rgba(59,130,246,0.12)', color: '#60a5fa', border: 'none', borderRadius: 7, padding: '6px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontWeight: 600, fontSize: '0.8rem' }}>
                  <Settings size={13} /> Configure
                </button>
                <button onClick={() => handleDelete(t.id, t.name)}
                  style={{ background: 'rgba(239,68,68,0.12)', color: '#f87171', border: 'none', borderRadius: 7, padding: '6px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontWeight: 600, fontSize: '0.8rem' }}>
                  <Trash2 size={13} /> Delete
                </button>
                <span style={{ color: 'var(--text-dim)', cursor: 'pointer' }} onClick={() => setExpandedType(expandedType === t.id ? null : t.id)}>
                  {expandedType === t.id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </span>
              </div>
            </div>

            {/* Expanded section */}
            {expandedType === t.id && (
              <div style={{ borderTop: '1px solid var(--border-color)' }}>
                {/* Tabs */}
                <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--border-color)', padding: '0 20px' }}>
                  {[['fields', `Fields (${t.fields?.length || 0})`], ['entries', `Entries (${t.entries?.length || 0})`]].map(([tab, label]) => (
                    <button key={tab} onClick={() => setTab(t.id, tab)}
                      style={{ background: 'none', border: 'none', padding: '12px 20px', cursor: 'pointer', color: getTab(t.id) === tab ? 'var(--accent-primary)' : 'var(--text-muted)', fontWeight: 700, fontSize: '0.85rem', borderBottom: getTab(t.id) === tab ? '2px solid var(--accent-primary)' : '2px solid transparent', marginBottom: -1 }}>
                      {label}
                    </button>
                  ))}
                </div>

                <div style={{ padding: '20px' }}>
                  {/* Fields Tab */}
                  {getTab(t.id) === 'fields' && (
                    <FieldBuilder
                      fields={t.fields || []}
                      title={`Fields for "${t.name}"`}
                      onChange={(fields) => setTypes(prev => prev.map(pt => pt.id === t.id ? { ...pt, fields } : pt))}
                    />
                  )}

                  {/* Entries Tab */}
                  {getTab(t.id) === 'entries' && (
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 14 }}>
                        <button onClick={() => openNewEntry(t.id)}
                          style={{ background: 'var(--accent-primary)', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 18px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Plus size={14} /> Add New {t.name.replace(/s$/, '')}
                        </button>
                      </div>

                      {(!t.entries || t.entries.length === 0) ? (
                        <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-dim)', border: '2px dashed var(--border-color)', borderRadius: 8 }}>
                          No entries yet. Click "Add Entry" to create content.
                        </div>
                      ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                          <thead>
                            <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-dim)', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                              <th style={{ padding: '8px 14px', textAlign: 'left' }}>Title</th>
                              {t.fields?.slice(0, 3).map(f => (
                                <th key={f.key} style={{ padding: '8px 14px', textAlign: 'left' }}>{f.label}</th>
                              ))}
                              <th style={{ padding: '8px 14px', textAlign: 'left' }}>Date</th>
                              <th style={{ padding: '8px 14px' }}></th>
                            </tr>
                          </thead>
                          <tbody>
                            {t.entries.map(entry => (
                              <tr key={entry.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                <td style={{ padding: '12px 14px', fontWeight: 600 }}>{entry.title || '—'}</td>
                                {t.fields?.slice(0, 3).map(f => (
                                  <td key={f.key} style={{ padding: '12px 14px', color: 'var(--text-muted)', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {String(entry[f.key] || '—').slice(0, 40)}
                                  </td>
                                ))}
                                <td style={{ padding: '12px 14px', color: 'var(--text-dim)', fontSize: '0.78rem' }}>
                                  {new Date(entry.createdAt).toLocaleDateString()}
                                </td>
                                <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                                  <button onClick={() => deleteEntry(t.id, entry.id)}
                                    style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', padding: 4 }}>
                                    <Trash2 size={14} />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))
      )}

      {/* ── Create/Edit Type Modal ── */}
      {showForm && (
        <div onClick={() => setShowForm(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', zIndex: 9999, backdropFilter: 'blur(4px)', overflowY: 'auto', padding: '40px 20px' }}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 14, padding: '32px', width: '100%', maxWidth: 680, boxShadow: '0 24px 80px rgba(0,0,0,0.5)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
              <h3 style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Layers size={20} color="var(--accent-primary)" />
                {editingId ? 'Configure Content Type' : 'New Content Type'}
              </h3>
              <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}><X size={20} /></button>
            </div>

            {/* Type Info */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 18 }}>
              <div>
                <label style={labelStyle}>Display Name *</label>
                <input style={inputStyle} type="text" placeholder="e.g. Podcasts" value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value, slug: f.slug || slugify(e.target.value) }))} />
              </div>
              <div>
                <label style={labelStyle}>URL Slug *</label>
                <input style={inputStyle} type="text" placeholder="podcasts" value={form.slug}
                  onChange={e => setForm(f => ({ ...f, slug: slugify(e.target.value) }))} />
                <p style={{ color: 'var(--text-dim)', fontSize: '0.72rem', marginTop: 3 }}>Appears in URL: /admin/{form.slug || 'slug'}</p>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: 16, marginBottom: 18 }}>
              <div>
                <label style={labelStyle}>Icon</label>
                <input style={{ ...inputStyle, fontSize: '1.4rem', textAlign: 'center' }} type="text" value={form.icon} onChange={e => setForm(f => ({ ...f, icon: e.target.value }))} maxLength={2} />
              </div>
              <div>
                <label style={labelStyle}>Description</label>
                <input style={inputStyle} type="text" placeholder="Brief description..." value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              </div>
            </div>

            {/* Quick icon picker */}
            <div style={{ marginBottom: 22 }}>
              <label style={labelStyle}>Quick Icon</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {ICON_OPTIONS.map(ic => (
                  <button key={ic} type="button" onClick={() => setForm(f => ({ ...f, icon: ic }))}
                    style={{ fontSize: '1.3rem', background: form.icon === ic ? 'var(--accent-primary)' : 'rgba(255,255,255,0.05)', border: 'none', borderRadius: 6, padding: '5px 8px', cursor: 'pointer' }}>
                    {ic}
                  </button>
                ))}
              </div>
            </div>

            {/* Field Builder inside modal */}
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: 10, padding: '18px' }}>
              <FieldBuilder
                fields={form.fields || []}
                title="Custom Fields for this Content Type"
                onChange={(fields) => setForm(f => ({ ...f, fields }))}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24 }}>
              <button type="button" onClick={() => setShowForm(false)} style={{ padding: '10px 20px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
              <button type="button" onClick={handleSave} style={{ padding: '10px 24px', borderRadius: 8, border: 'none', background: 'var(--accent-primary)', color: '#fff', cursor: 'pointer', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Check size={15} /> {editingId ? 'Save Changes' : 'Create Type'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── New Entry Modal ── */}
      {newEntryModal && (() => {
        const type = types.find(t => t.id === newEntryModal);
        if (!type) return null;
        return (
          <div onClick={() => setNewEntryModal(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', zIndex: 10000, backdropFilter: 'blur(4px)', overflowY: 'auto', padding: '40px 20px' }}>
            <div onClick={e => e.stopPropagation()} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 14, padding: '32px', width: '100%', maxWidth: 600, boxShadow: '0 24px 80px rgba(0,0,0,0.5)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                <h3 style={{ fontSize: '1.1rem' }}>{type.icon} Add New {type.name.replace(/s$/, '')}</h3>
                <button onClick={() => setNewEntryModal(null)} style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}><X size={20} /></button>
              </div>

              <div style={{ marginBottom: 18 }}>
                <label style={labelStyle}>Title *</label>
                <input style={inputStyle} type="text" placeholder={`${type.name.replace(/s$/, '')} title...`} value={entryForm.title}
                  onChange={e => setEntryForm(f => ({ ...f, title: e.target.value }))} />
              </div>

              {(type.fields || []).map(field => (
                <div key={field.key} style={{ marginBottom: 16 }}>
                  <label style={labelStyle}>{field.label}{field.required && ' *'}</label>
                  {field.type === 'textarea' ? (
                    <textarea rows={3} style={{ ...inputStyle, resize: 'vertical' }} placeholder={field.placeholder}
                      value={entryForm[field.key] || ''} onChange={e => setEntryForm(f => ({ ...f, [field.key]: e.target.value }))} />
                  ) : field.type === 'select' ? (
                    <select style={inputStyle} value={entryForm[field.key] || ''} onChange={e => setEntryForm(f => ({ ...f, [field.key]: e.target.value }))}>
                      <option value="">-- Select --</option>
                      {(field.options || '').split('\n').filter(Boolean).map(opt => {
                        const [val, lbl] = opt.split(':').map(s => s.trim());
                        return <option key={val} value={val}>{lbl || val}</option>;
                      })}
                    </select>
                  ) : field.type === 'checkbox' ? (
                    <div>
                      <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                        <input type="checkbox" checked={!!entryForm[field.key]} onChange={e => setEntryForm(f => ({ ...f, [field.key]: e.target.checked }))} />
                        {field.placeholder || 'Yes'}
                      </label>
                    </div>
                  ) : field.type === 'repeater' ? (
                    <div style={{ background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: 8, padding: 12 }}>
                      <p style={{ color: '#a78bfa', fontSize: '0.82rem', margin: '0 0 8px' }}>
                        Repeater: {field.subFields?.length || 0} sub-fields defined.
                      </p>
                      {(entryForm[field.key] || []).map((row, ri) => (
                        <div key={ri} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', borderRadius: 7, padding: 10, marginBottom: 8 }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-dim)' }}>Row {ri + 1}</span>
                            <button onClick={() => {
                              const rows = [...(entryForm[field.key] || [])];
                              rows.splice(ri, 1);
                              setEntryForm(f => ({ ...f, [field.key]: rows }));
                            }} style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer' }}><Trash2 size={12} /></button>
                          </div>
                          {(field.subFields || []).map(sf => (
                            <div key={sf.key} style={{ marginBottom: 8 }}>
                              <label style={{ ...labelStyle, marginBottom: 3 }}>{sf.label}</label>
                              <input type={sf.type === 'number' ? 'number' : 'text'} style={inputStyle} placeholder={sf.placeholder}
                                value={row[sf.key] || ''} onChange={e => {
                                  const rows = [...(entryForm[field.key] || [])];
                                  rows[ri] = { ...rows[ri], [sf.key]: e.target.value };
                                  setEntryForm(f => ({ ...f, [field.key]: rows }));
                                }} />
                            </div>
                          ))}
                        </div>
                      ))}
                      <button type="button" onClick={() => {
                        const row = {};
                        (field.subFields || []).forEach(sf => { row[sf.key] = ''; });
                        setEntryForm(f => ({ ...f, [field.key]: [...(f[field.key] || []), row] }));
                      }} style={{ background: 'rgba(139,92,246,0.15)', color: '#a78bfa', border: 'none', borderRadius: 6, padding: '7px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, fontSize: '0.8rem' }}>
                        <Plus size={12} /> Add Row
                      </button>
                    </div>
                  ) : (
                    <input type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : field.type === 'url' ? 'url' : 'text'}
                      style={inputStyle} placeholder={field.placeholder}
                      value={entryForm[field.key] || ''} onChange={e => setEntryForm(f => ({ ...f, [field.key]: e.target.value }))} />
                  )}
                </div>
              ))}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24 }}>
                <button onClick={() => setNewEntryModal(null)} style={{ padding: '10px 20px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
                <button onClick={() => saveEntry(newEntryModal)} disabled={!entryForm.title}
                  style={{ padding: '10px 24px', borderRadius: 8, border: 'none', background: entryForm.title ? 'var(--accent-primary)' : 'rgba(255,255,255,0.08)', color: entryForm.title ? '#fff' : 'var(--text-dim)', cursor: entryForm.title ? 'pointer' : 'not-allowed', fontWeight: 700 }}>
                  <Check size={15} style={{ marginRight: 6 }} /> Save Entry
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default ContentTypeManager;

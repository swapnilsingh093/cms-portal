import React, { useState } from 'react';
import {
  Plus, Trash2, GripVertical, ChevronDown, ChevronUp, X, Check,
  Type, FileText, Image, Film, Hash, Calendar, Link, ToggleLeft,
  List, RotateCcw, Copy, Eye, EyeOff
} from 'lucide-react';

// ─── Field Type Registry ──────────────────────────────────────────
export const FIELD_TYPES = [
  { value: 'text',       label: 'Text',          icon: Type,       desc: 'Single line text input' },
  { value: 'textarea',   label: 'Textarea',       icon: FileText,   desc: 'Multi-line plain text' },
  { value: 'richtext',   label: 'Rich Editor',    icon: FileText,   desc: 'WYSIWYG rich text editor' },
  { value: 'number',     label: 'Number',         icon: Hash,       desc: 'Numeric input' },
  { value: 'date',       label: 'Date',           icon: Calendar,   desc: 'Date picker' },
  { value: 'url',        label: 'URL / Link',     icon: Link,       desc: 'Website or file URL' },
  { value: 'image',      label: 'Image',          icon: Image,      desc: 'Single image upload' },
  { value: 'video',      label: 'Video',          icon: Film,       desc: 'Video upload or URL' },
  { value: 'select',     label: 'Select / Dropdown', icon: List,    desc: 'Dropdown with choices' },
  { value: 'checkbox',   label: 'Checkbox',       icon: ToggleLeft, desc: 'True/False toggle' },
  { value: 'repeater',   label: 'Repeater',       icon: RotateCcw,  desc: 'Repeatable group of sub-fields' },
];

const slugify = (str) => str.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');

const inputStyle = {
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid var(--border-color)',
  borderRadius: 7,
  color: 'var(--text-primary)',
  padding: '8px 11px',
  fontSize: '0.85rem',
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box'
};

const labelStyle = {
  display: 'block', fontSize: '0.72rem', fontWeight: 700,
  color: 'var(--text-secondary)', marginBottom: 4,
  textTransform: 'uppercase', letterSpacing: '0.05em'
};

// ─── Single Field Editor ─────────────────────────────────────────
const FieldRow = ({ field, idx, total, onChange, onRemove, onMove, depth = 0 }) => {
  const [open, setOpen] = useState(true);

  const update = (key, val) => onChange(idx, { ...field, [key]: val });

  return (
    <div style={{
      border: `1px solid ${depth > 0 ? 'rgba(139,92,246,0.3)' : 'var(--border-color)'}`,
      borderRadius: 8,
      marginBottom: 8,
      background: depth > 0 ? 'rgba(139,92,246,0.05)' : 'rgba(255,255,255,0.03)',
      overflow: 'hidden'
    }}>
      {/* Field header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: depth > 0 ? 'rgba(139,92,246,0.08)' : 'rgba(255,255,255,0.03)' }}>
        {/* Order controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <button onClick={() => onMove(idx, -1)} disabled={idx === 0}
            style={{ background: 'none', border: 'none', color: idx === 0 ? 'var(--text-dim)' : 'var(--text-muted)', cursor: 'pointer', padding: 1 }}><ChevronUp size={12} /></button>
          <button onClick={() => onMove(idx, 1)} disabled={idx === total - 1}
            style={{ background: 'none', border: 'none', color: idx === total - 1 ? 'var(--text-dim)' : 'var(--text-muted)', cursor: 'pointer', padding: 1 }}><ChevronDown size={12} /></button>
        </div>

        {/* Field type badge */}
        <span style={{ background: 'rgba(255,255,255,0.07)', borderRadius: 5, padding: '2px 8px', fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', flexShrink: 0, textTransform: 'uppercase' }}>
          {FIELD_TYPES.find(t => t.value === field.type)?.label || field.type}
        </span>

        {/* Label preview */}
        <span style={{ flex: 1, fontWeight: 600, fontSize: '0.88rem', cursor: 'pointer' }} onClick={() => setOpen(v => !v)}>
          {field.label || <span style={{ color: 'var(--text-dim)', fontStyle: 'italic' }}>Unnamed field</span>}
          {field.required && <span style={{ fontSize: '0.65rem', color: '#f87171', marginLeft: 5 }}>Required</span>}
        </span>
        <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontFamily: 'monospace' }}>{field.key}</span>

        <button onClick={() => setOpen(v => !v)} style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', padding: 4 }}>
          {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
        <button onClick={() => onRemove(idx)} style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', padding: 4 }}>
          <Trash2 size={14} />
        </button>
      </div>

      {/* Field settings */}
      {open && (
        <div style={{ padding: '14px 16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div>
              <label style={labelStyle}>Field Label *</label>
              <input style={inputStyle} type="text" placeholder="e.g. Author Name" value={field.label}
                onChange={e => update('label', e.target.value)} onBlur={e => {
                  if (!field.key || field.key === slugify(field._prevLabel || '')) {
                    update('key', slugify(e.target.value));
                  }
                }} />
            </div>
            <div>
              <label style={labelStyle}>Field Key</label>
              <input style={{ ...inputStyle, fontFamily: 'monospace', fontSize: '0.82rem' }} type="text" placeholder="auto-generated" value={field.key}
                onChange={e => update('key', slugify(e.target.value))} />
            </div>
            <div>
              <label style={labelStyle}>Field Type</label>
              <select style={inputStyle} value={field.type} onChange={e => update('type', e.target.value)}>
                {FIELD_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12, marginBottom: 12 }}>
            <div>
              <label style={labelStyle}>Placeholder / Instructions</label>
              <input style={inputStyle} type="text" placeholder="Helper text shown to editors..." value={field.placeholder || ''}
                onChange={e => update('placeholder', e.target.value)} />
            </div>
            <div>
              <label style={{ ...labelStyle, marginBottom: 8 }}>Required?</label>
              <button type="button" onClick={() => update('required', !field.required)}
                style={{ background: field.required ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.06)', border: 'none', borderRadius: 7, padding: '8px 14px', color: field.required ? '#f87171' : 'var(--text-muted)', cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.2s' }}>
                {field.required ? <Check size={13} /> : <X size={13} />}
                {field.required ? 'Required' : 'Optional'}
              </button>
            </div>
          </div>

          {/* Select options */}
          {field.type === 'select' && (
            <div style={{ marginBottom: 12 }}>
              <label style={labelStyle}>Dropdown Options (one per line, format: value : Label)</label>
              <textarea style={{ ...inputStyle, resize: 'vertical' }} rows={4}
                placeholder={"red : Red Color\nblue : Blue Color\ngreen : Green"}
                value={field.options || ''} onChange={e => update('options', e.target.value)} />
            </div>
          )}

          {/* Default value */}
          {!['image', 'video', 'repeater'].includes(field.type) && (
            <div>
              <label style={labelStyle}>Default Value</label>
              <input style={inputStyle} type="text" placeholder="Default value (optional)" value={field.default || ''}
                onChange={e => update('default', e.target.value)} />
            </div>
          )}

          {/* Repeater sub-fields */}
          {field.type === 'repeater' && (
            <div style={{ marginTop: 14, padding: '12px 14px', background: 'rgba(139,92,246,0.06)', borderRadius: 8, border: '1px solid rgba(139,92,246,0.2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#a78bfa' }}>Repeater Sub-Fields</span>
                <button type="button"
                  onClick={() => {
                    const newSubField = { id: 'sf_' + Date.now(), label: '', key: '', type: 'text', required: false, placeholder: '' };
                    update('subFields', [...(field.subFields || []), newSubField]);
                  }}
                  style={{ background: 'rgba(139,92,246,0.2)', color: '#a78bfa', border: 'none', borderRadius: 6, padding: '5px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontWeight: 600, fontSize: '0.78rem' }}>
                  <Plus size={12} /> Add Sub-Field
                </button>
              </div>

              {(!field.subFields || field.subFields.length === 0) ? (
                <p style={{ color: 'var(--text-dim)', fontSize: '0.8rem', margin: 0 }}>No sub-fields yet. Add fields to define what each repeater row contains.</p>
              ) : (
                field.subFields.map((sf, sfIdx) => (
                  <FieldRow
                    key={sf.id}
                    field={sf}
                    idx={sfIdx}
                    total={field.subFields.length}
                    depth={depth + 1}
                    onChange={(i, updated) => {
                      const subs = [...field.subFields];
                      subs[i] = updated;
                      update('subFields', subs);
                    }}
                    onRemove={(i) => {
                      const subs = field.subFields.filter((_, si) => si !== i);
                      update('subFields', subs);
                    }}
                    onMove={(i, dir) => {
                      const subs = [...field.subFields];
                      const si = i + dir;
                      if (si >= 0 && si < subs.length) {
                        [subs[i], subs[si]] = [subs[si], subs[i]];
                        update('subFields', subs);
                      }
                    }}
                  />
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ─── FieldBuilder Component (exported for embedding) ─────────────
const FieldBuilder = ({ fields = [], onChange, title = 'Custom Fields' }) => {
  const addField = () => {
    const id = 'field_' + Date.now();
    const newField = { id, label: '', key: '', type: 'text', required: false, placeholder: '', default: '', subFields: [] };
    onChange([...fields, newField]);
  };

  const updateField = (idx, updated) => {
    const next = [...fields];
    next[idx] = updated;
    onChange(next);
  };

  const removeField = (idx) => onChange(fields.filter((_, i) => i !== idx));

  const moveField = (idx, dir) => {
    const next = [...fields];
    const si = idx + dir;
    if (si >= 0 && si < next.length) {
      [next[idx], next[si]] = [next[si], next[idx]];
      onChange(next);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          {title} <span style={{ color: 'var(--text-dim)', fontWeight: 400, fontSize: '0.8rem' }}>({fields.length} fields)</span>
        </span>
        <button type="button" onClick={addField}
          style={{ background: 'var(--g-accent, rgba(99,102,241,0.15))', color: '#818cf8', border: '1px solid var(--g-accent, rgba(99,102,241,0.3))', borderRadius: 7, padding: '7px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, fontSize: '0.82rem' }}>
          <Plus size={14} /> Add Field
        </button>
      </div>

      {fields.length === 0 ? (
        <div style={{ border: '2px dashed var(--border-color)', borderRadius: 8, padding: '32px 20px', textAlign: 'center', color: 'var(--text-dim)' }}>
          <Plus size={28} style={{ marginBottom: 8 }} />
          <p style={{ margin: 0, fontSize: '0.88rem' }}>No fields yet. Click "Add Field" to start building.</p>
        </div>
      ) : (
        fields.map((field, idx) => (
          <FieldRow
            key={field.id}
            field={field}
            idx={idx}
            total={fields.length}
            onChange={updateField}
            onRemove={removeField}
            onMove={moveField}
          />
        ))
      )}
    </div>
  );
};

export default FieldBuilder;

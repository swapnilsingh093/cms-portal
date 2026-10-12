import React from 'react';
import { Sliders, Heart, Calendar, Check, X } from 'lucide-react';
import MetaBox from './MetaBox';

const AGE_LIST = Array.from({ length: 43 }, (_, i) => 18 + i); // 18 to 60

const QUICK_AGE_RANGES = [
  { label: '18 - 25', min: 18, max: 25 },
  { label: '26 - 35', min: 26, max: 35 },
  { label: '36 - 45', min: 36, max: 45 },
  { label: '46 - 60', min: 46, max: 60 }
];

const AdvancedAttributesCard = ({
  id = 'advanced',
  age = [],
  setAge,
  maritalStatus = '',
  setMaritalStatus,
  className = '',
  dragHandleProps
}) => {
  const selectedAges = Array.isArray(age) ? age : [];

  const toggleAge = (num) => {
    if (selectedAges.includes(num)) {
      setAge(selectedAges.filter((a) => a !== num));
    } else {
      setAge([...selectedAges, num].sort((a, b) => a - b));
    }
  };

  const handleSelectRange = (min, max) => {
    const rangeVals = [];
    for (let i = min; i <= max; i++) {
      rangeVals.push(i);
    }
    // Union with current selected or toggle
    const allInRangeSelected = rangeVals.every((r) => selectedAges.includes(r));
    if (allInRangeSelected) {
      setAge(selectedAges.filter((a) => a < min || a > max));
    } else {
      const merged = Array.from(new Set([...selectedAges, ...rangeVals])).sort((a, b) => a - b);
      setAge(merged);
    }
  };

  const handleSelectAll = () => {
    if (selectedAges.length === AGE_LIST.length) {
      setAge([]);
    } else {
      setAge([...AGE_LIST]);
    }
  };

  return (
    <div className={className}>
      <MetaBox 
        id={id}
        dragHandleProps={dragHandleProps}
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span>Advanced Search & Filter Attributes</span>
            {selectedAges.length > 0 && (
              <span style={{
                fontSize: '0.75rem',
                background: 'rgba(99, 102, 241, 0.15)',
                color: 'var(--accent-primary, #6366f1)',
                padding: '2px 8px',
                borderRadius: '12px',
                fontWeight: 600
              }}>
                {selectedAges.length} ages selected
              </span>
            )}
          </div>
        } 
        icon={<Sliders size={16} color="var(--accent-primary, #6366f1)" />}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* 1. Age (18 to 60 yrs) in Multi-select Tag Pill Layout */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.82rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              color: 'var(--text-secondary, #94a3b8)'
            }}>
              <Calendar size={14} /> Age (18 yrs to 60 yrs)
            </label>

            {/* Quick Presets */}
            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={handleSelectAll}
                style={{
                  fontSize: '0.72rem',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  border: '1px solid rgba(255,255,255,0.1)',
                  background: selectedAges.length === AGE_LIST.length ? 'var(--accent-primary, #6366f1)' : 'rgba(255,255,255,0.05)',
                  color: '#fff',
                  cursor: 'pointer'
                }}
              >
                {selectedAges.length === AGE_LIST.length ? 'Clear All' : 'Select All'}
              </button>
            </div>
          </div>

          {/* Quick Range Chips */}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '10px' }}>
            {QUICK_AGE_RANGES.map((rng) => {
              const active = Array.from({ length: rng.max - rng.min + 1 }, (_, i) => rng.min + i).every((r) =>
                selectedAges.includes(r)
              );
              return (
                <button
                  key={rng.label}
                  type="button"
                  onClick={() => handleSelectRange(rng.min, rng.max)}
                  style={{
                    fontSize: '0.74rem',
                    fontWeight: 600,
                    padding: '3px 9px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    border: active ? '1px solid #6366f1' : '1px solid rgba(255,255,255,0.1)',
                    background: active ? 'rgba(99, 102, 241, 0.25)' : 'rgba(255,255,255,0.03)',
                    color: active ? '#a5b4fc' : 'var(--text-secondary, #94a3b8)'
                  }}
                >
                  {rng.label} yrs
                </button>
              );
            })}
          </div>

          {/* Tag / Checkbox Pills Grid (18 to 60) */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '5px',
              maxHeight: '140px',
              overflowY: 'auto',
              padding: '8px',
              background: 'rgba(0, 0, 0, 0.2)',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.06)'
            }}
          >
            {AGE_LIST.map((n) => {
              const isSelected = selectedAges.includes(n);
              return (
                <button
                  key={n}
                  type="button"
                  onClick={() => toggleAge(n)}
                  title={`Age ${n}`}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minWidth: '38px',
                    height: '28px',
                    padding: '0 8px',
                    borderRadius: '6px',
                    fontSize: '0.78rem',
                    fontWeight: isSelected ? 700 : 500,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    border: isSelected
                      ? '1px solid #6366f1'
                      : '1px solid rgba(255, 255, 255, 0.08)',
                    background: isSelected
                      ? 'linear-gradient(135deg, #6366f1, #4f46e5)'
                      : 'rgba(255, 255, 255, 0.04)',
                    color: isSelected ? '#ffffff' : 'var(--text-secondary, #cbd5e1)',
                    boxShadow: isSelected ? '0 2px 8px rgba(99, 102, 241, 0.35)' : 'none'
                  }}
                >
                  {isSelected && <Check size={10} style={{ marginRight: '3px' }} />}
                  {n}
                </button>
              );
            })}
          </div>
          <span className="form-description" style={{ display: 'block', marginTop: '6px', fontSize: '0.75rem' }}>
            Click age tag pills to multi-select. Users can filter matching posts/videos/galleries by age.
          </span>
        </div>

        {/* 2. Marital Status ("Material Status") - Radio Buttons in Tag/Pill Layout */}
        <div>
          <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.82rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            color: 'var(--text-secondary, #94a3b8)',
            marginBottom: '8px'
          }}>
            <Heart size={14} /> Marital Status (Material Status)
          </label>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {[
              { value: '', label: 'Not Specified / Any' },
              { value: 'married', label: 'Married' },
              { value: 'unmarried', label: 'Unmarried' }
            ].map((opt) => {
              const checked = (maritalStatus || '') === opt.value;
              return (
                <label
                  key={opt.value}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 14px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    fontWeight: checked ? 700 : 500,
                    border: checked
                      ? '1px solid #ec4899'
                      : '1px solid rgba(255, 255, 255, 0.1)',
                    background: checked
                      ? 'rgba(236, 72, 153, 0.18)'
                      : 'rgba(255, 255, 255, 0.03)',
                    color: checked ? '#f472b6' : 'var(--text-secondary, #cbd5e1)',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <input
                    type="radio"
                    name="maritalStatusRadio"
                    value={opt.value}
                    checked={checked}
                    onChange={() => setMaritalStatus(opt.value)}
                    style={{
                      cursor: 'pointer',
                      accentColor: '#ec4899'
                    }}
                  />
                  <span>{opt.label}</span>
                </label>
              );
            })}
          </div>
          <span className="form-description" style={{ display: 'block', marginTop: '6px', fontSize: '0.75rem' }}>
            Select marital status for targeted tag and advanced search filtering.
          </span>
        </div>
        </div>
      </MetaBox>
    </div>
  );
};

export default AdvancedAttributesCard;

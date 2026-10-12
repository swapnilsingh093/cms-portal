import React, { useState } from 'react';
import { SlidersHorizontal, ChevronDown, ChevronUp } from 'lucide-react';

/**
 * ScreenOptionsDrawer
 * WordPress-style collapsible Screen Options panel for Admin Editors.
 * Allows toggling module-specific optional metaboxes.
 */
const ScreenOptionsDrawer = ({
  options = [], // [{ id: 'banner', label: 'Hero Banner Media' }, ...]
  screenOptions = {}, // { banner: true, excerpt: false, ... }
  onChange, // (boxId, isEnabled) => void
  onToggleOption, // (boxId, isEnabled) => void
  moduleTitle = 'Post' // 'Story / Post' | 'Video' | 'Gallery'
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleToggle = (boxId, isChecked) => {
    if (typeof onToggleOption === 'function') {
      onToggleOption(boxId, isChecked);
    }
    if (typeof onChange === 'function') {
      onChange(boxId, isChecked);
    }
  };

  return (
    <div style={{ position: 'relative', width: '100%', marginBottom: isOpen ? '24px' : '8px', zIndex: 40 }}>
      {/* WordPress-style Top-Right Tab with consistent button sizing */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            height: '40px',
            padding: '0 18px',
            background: isOpen ? 'var(--bg-card, #111827)' : 'rgba(255, 255, 255, 0.05)',
            color: isOpen ? 'var(--accent-primary, #6366f1)' : 'var(--text-primary, #f8fafc)',
            border: isOpen ? '1px solid var(--accent-primary, #6366f1)' : '1px solid var(--border-color, rgba(255, 255, 255, 0.12))',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxSizing: 'border-box',
            boxShadow: isOpen ? '0 -2px 10px rgba(0,0,0,0.2)' : 'none'
          }}
          onMouseEnter={(e) => {
            if (!isOpen) {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
            }
          }}
          onMouseLeave={(e) => {
            if (!isOpen) {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
              e.currentTarget.style.borderColor = 'var(--border-color, rgba(255, 255, 255, 0.12))';
            }
          }}
          aria-expanded={isOpen}
          title="Toggle Screen Options"
        >
          <SlidersHorizontal size={15} />
          <span>Screen Options</span>
          {isOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </button>
      </div>

      {/* Slide-down Drawer Panel */}
      {isOpen && (
        <div
          style={{
            background: 'var(--bg-card, #111827)',
            border: '1px solid var(--accent-primary, #6366f1)',
            borderRadius: '8px',
            padding: '20px 24px',
            marginTop: '8px',
            boxShadow: '0 12px 30px rgba(0, 0, 0, 0.45)',
            animation: 'fadeInSlide 0.2s ease-out'
          }}
        >
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', justifyContent: 'space-between', gap: '12px', marginBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '12px' }}>
            <div>
              <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: 'var(--text-primary, #f8fafc)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <SlidersHorizontal size={16} color="var(--accent-primary, #6366f1)" />
                {moduleTitle} Screen Elements
              </h4>
            </div>
          </div>

          {/* Checkboxes List */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '12px 24px',
              alignItems: 'center'
            }}
          >
            {options.map((opt) => {
              const isChecked = screenOptions[opt.id] !== false;
              return (
                <label
                  key={opt.id}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: isChecked ? 600 : 400,
                    color: isChecked ? 'var(--text-primary, #f8fafc)' : 'var(--text-dim, #64748b)',
                    padding: '6px 10px',
                    borderRadius: '6px',
                    background: isChecked ? 'rgba(99, 102, 241, 0.1)' : 'rgba(255, 255, 255, 0.02)',
                    border: isChecked ? '1px solid rgba(99, 102, 241, 0.3)' : '1px solid rgba(255, 255, 255, 0.05)',
                    transition: 'all 0.15s ease',
                    userSelect: 'none'
                  }}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={(e) => handleToggle(opt.id, e.target.checked)}
                    style={{
                      width: '16px',
                      height: '16px',
                      accentColor: 'var(--accent-primary, #6366f1)',
                      cursor: 'pointer'
                    }}
                  />
                  <span>{opt.label}</span>
                </label>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default ScreenOptionsDrawer;

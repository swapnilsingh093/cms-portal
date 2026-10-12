import React from 'react';
import {
  useSiteTheme,
  GALLERY_BG_PRESETS,
  GALLERY_ACCENTS,
} from '../../context/SiteThemeContext';
import { Palette, X, Check, Sparkles, RotateCcw } from 'lucide-react';

const GalleryThemePalette = () => {
  const {
    isThemeActive,
    bgTheme,
    setBgTheme,
    accent,
    setAccent,
    currentBg,
    currentAccent,
    resetToDefault,
    paletteOpen,
    setPaletteOpen,
  } = useSiteTheme();

  return (
    <>
      {/* Floating Trigger Button */}
      {!paletteOpen && (
        <button
          type="button"
          onClick={() => setPaletteOpen(true)}
          aria-label="Customize Site Theme Colors"
          title="Customize Theme Background & Accent Colors"
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 9999,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            borderRadius: '999px',
            background: 'var(--g-surface, var(--bg-surface, #111827))',
            color: 'var(--g-text, var(--text-primary, #ffffff))',
            border: '1.5px solid var(--g-accent, #3b82f6)',
            boxShadow:
              '0 8px 30px var(--g-accent-glow, rgba(59, 130, 246, 0.45)), 0 4px 15px rgba(0,0,0,0.5)',
            cursor: 'pointer',
            fontSize: '0.85rem',
            fontWeight: 700,
            letterSpacing: '0.02em',
            backdropFilter: 'blur(14px)',
            WebkitBackdropFilter: 'blur(14px)',
            transition: 'all 0.25s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-3px) scale(1.03)';
            e.currentTarget.style.background = 'var(--g-accent, #3b82f6)';
            e.currentTarget.style.color = 'var(--g-accent-text, #ffffff)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0) scale(1)';
            e.currentTarget.style.background =
              'var(--g-surface, var(--bg-surface, #111827))';
            e.currentTarget.style.color = 'var(--g-text, var(--text-primary, #ffffff))';
          }}
        >
          <Palette size={16} />
          <span>Theme Palette</span>
          {isThemeActive && (
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: 'var(--g-accent, #3b82f6)',
                boxShadow: '0 0 8px var(--g-accent, #3b82f6)',
              }}
            />
          )}
        </button>
      )}

      {/* Live Color Customizer Modal */}
      {paletteOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Site Theme Customizer"
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 10000,
            width: '320px',
            maxWidth: 'calc(100vw - 32px)',
            borderRadius: '20px',
            background: 'var(--g-surface, var(--bg-surface, #111827))',
            border: '1.5px solid var(--g-border, var(--border-color, rgba(255, 255, 255, 0.15)))',
            boxShadow:
              '0 20px 50px rgba(0,0,0,0.7), 0 0 30px var(--g-accent-glow, rgba(59, 130, 246, 0.25))',
            padding: '20px',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            color: 'var(--g-text, var(--text-primary, #ffffff))',
            animation: 'fadeIn 0.2s ease-out',
          }}
        >
          {/* Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '16px',
              paddingBottom: '10px',
              borderBottom: '1px solid var(--g-border, var(--border-color, rgba(255, 255, 255, 0.1)))',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '8px',
                  background: 'var(--g-accent, #3b82f6)',
                  color: 'var(--g-accent-text, #ffffff)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Sparkles size={15} />
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: '0.95rem' }}>Site Theme</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--g-text-muted, var(--text-muted, #94a3b8))' }}>
                  {isThemeActive ? 'Custom Colors Active' : 'Default Website Colors'}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setPaletteOpen(false)}
              aria-label="Close theme customizer"
              style={{
                width: '26px',
                height: '26px',
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.1)',
                border: 'none',
                color: 'var(--g-text, #fff)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <X size={14} />
            </button>
          </div>

          {/* 1. Background Theme Options */}
          <div style={{ marginBottom: '18px' }}>
            <label
              style={{
                display: 'block',
                fontSize: '0.75rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                color: 'var(--g-text-muted, var(--text-muted, #94a3b8))',
                marginBottom: '8px',
              }}
            >
              Background Style
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
              {Object.values(GALLERY_BG_PRESETS).map((p) => {
                const isSelected = isThemeActive && bgTheme === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setBgTheme(p.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 10px',
                      borderRadius: '10px',
                      background: p.bg,
                      color: p.text,
                      border: isSelected
                        ? '2px solid var(--g-accent, #3b82f6)'
                        : '1px solid rgba(255, 255, 255, 0.1)',
                      cursor: 'pointer',
                      fontSize: '0.78rem',
                      fontWeight: isSelected ? 700 : 500,
                      textAlign: 'left',
                      boxShadow: isSelected
                        ? '0 0 10px var(--g-accent-glow, rgba(59, 130, 246, 0.35))'
                        : 'none',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <span
                      style={{
                        width: '14px',
                        height: '14px',
                        borderRadius: '50%',
                        background: p.surface,
                        border: '1px solid ' + p.border,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      {isSelected && (
                        <Check size={10} color="var(--g-accent, #3b82f6)" />
                      )}
                    </span>
                    <span
                      style={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {p.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Accent Colors */}
          <div style={{ marginBottom: '18px' }}>
            <label
              style={{
                display: 'block',
                fontSize: '0.75rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                color: 'var(--g-text-muted, var(--text-muted, #94a3b8))',
                marginBottom: '8px',
              }}
            >
              Accent Color
            </label>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '6px',
              }}
            >
              {Object.values(GALLERY_ACCENTS).map((acc) => {
                const isSelected = isThemeActive && accent === acc.id;
                return (
                  <button
                    key={acc.id}
                    type="button"
                    onClick={() => setAccent(acc.id)}
                    title={acc.name}
                    aria-label={acc.name}
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      backgroundColor: acc.color,
                      border: isSelected
                        ? '3px solid #ffffff'
                        : '2px solid rgba(0,0,0,0.3)',
                      boxShadow: isSelected
                        ? `0 0 14px ${acc.color}, 0 4px 10px rgba(0,0,0,0.4)`
                        : 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: acc.textOnAccent,
                      transition: 'transform 0.15s ease',
                      transform: isSelected ? 'scale(1.15)' : 'scale(1)',
                    }}
                  >
                    {isSelected && <Check size={16} strokeWidth={3} />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Footer Reset to Default */}
          <div
            style={{
              paddingTop: '12px',
              borderTop:
                '1px solid var(--g-border, var(--border-color, rgba(255, 255, 255, 0.08)))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <button
              type="button"
              onClick={resetToDefault}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--g-text-muted, var(--text-muted, #94a3b8))',
                fontSize: '0.75rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                cursor: 'pointer',
                padding: '4px',
              }}
            >
              <RotateCcw size={12} /> Reset to Default
            </button>
            <span
              style={{
                fontSize: '0.72rem',
                color: 'var(--g-accent, #3b82f6)',
                fontWeight: 600,
              }}
            >
              {isThemeActive ? 'Custom theme on' : 'Default design'}
            </span>
          </div>
        </div>
      )}
    </>
  );
};

export default GalleryThemePalette;

import React from 'react';
import { AlignLeft, AlignCenter, AlignRight } from 'lucide-react';

const BannerFocusHeightControl = ({
  bannerPosition = 'center',
  setBannerPosition,
  bannerHeight = '60vh',
  setBannerHeight,
  overlayStrength = 0,
  setOverlayStrength,
  alignment = 'left',
  setAlignment,
  verticalPosition = 'center',
  setVerticalPosition,
  previewImage = '',
}) => {
  // Parse numeric percentage from bannerPosition (e.g. '0%', '50%', 'center' -> 50)
  const currentPercent = (() => {
    if (!bannerPosition) return 50;
    if (bannerPosition === 'top') return 0;
    if (bannerPosition === 'center' || bannerPosition === 'middle') return 50;
    if (bannerPosition === 'bottom' || bannerPosition === 'lower') return 100;
    const match = String(bannerPosition).match(/(\d+)%/);
    return match ? parseInt(match[1], 10) : 50;
  })();

  const positionLabel =
    currentPercent === 0
      ? 'Top (0%)'
      : currentPercent === 50
      ? 'Middle (50%)'
      : currentPercent === 100
      ? 'Lower (100%)'
      : `${currentPercent}%`;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        padding: '16px',
        background: 'rgba(0, 0, 0, 0.25)',
        borderRadius: '10px',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        marginTop: '12px',
      }}
    >
      {/* 1. Banner Height Selector */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
          <label style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-secondary, #cbd5e1)' }}>
            Banner Height
          </label>
          <span style={{ fontSize: '12px', color: 'var(--primary-color, #818cf8)', fontWeight: 600 }}>
            {bannerHeight || '60vh'}
          </span>
        </div>

        {/* Height Quick Presets */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', marginBottom: '8px' }}>
          {['40vh', '50vh', '60vh', '75vh'].map((h) => (
            <button
              key={h}
              type="button"
              onClick={() => setBannerHeight && setBannerHeight(h)}
              style={{
                padding: '7px 4px',
                borderRadius: '6px',
                border:
                  bannerHeight === h
                    ? '1px solid var(--g-accent, #6366f1)'
                    : '1px solid rgba(255,255,255,0.1)',
                background:
                  bannerHeight === h
                    ? 'rgba(99, 102, 241, 0.25)'
                    : 'rgba(0, 0, 0, 0.2)',
                color: bannerHeight === h ? '#ffffff' : 'var(--text-muted, #94a3b8)',
                fontSize: '11.5px',
                fontWeight: 600,
                cursor: 'pointer',
                textAlign: 'center',
                transition: 'all 0.15s ease',
              }}
            >
              {h}
            </button>
          ))}
        </div>

        {/* Custom Height Input */}
        <input
          type="text"
          value={bannerHeight || ''}
          onChange={(e) => setBannerHeight && setBannerHeight(e.target.value)}
          placeholder="e.g. 60vh, 500px, 420px"
          style={{
            width: '100%',
            padding: '7px 10px',
            fontSize: '12px',
            borderRadius: '6px',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            background: 'rgba(0, 0, 0, 0.25)',
            color: 'var(--text-primary, #ffffff)',
            outline: 'none',
            boxSizing: 'border-box'
          }}
        />
      </div>

      {/* 2. Overlay Darkness Slider (0% - 90%) */}
      {setOverlayStrength && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
            <label style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-secondary, #cbd5e1)' }}>
              Overlay Darkness
            </label>
            <span style={{ fontSize: '12px', color: 'var(--primary-color, #818cf8)', fontWeight: 600 }}>
              {overlayStrength || 0}%
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="90"
            step="5"
            value={overlayStrength || 0}
            onChange={(e) => setOverlayStrength(Number(e.target.value))}
            style={{ width: '100%', accentColor: 'var(--g-accent, #6366f1)', cursor: 'pointer' }}
          />
        </div>
      )}

      {/* 3. Content Alignment (Left, Center, Right) */}
      {setAlignment && (
        <div>
          <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: 'var(--text-secondary, #cbd5e1)', marginBottom: '6px' }}>
            Content Alignment
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
            {[
              { val: 'left', label: 'Left', icon: AlignLeft },
              { val: 'center', label: 'Center', icon: AlignCenter },
              { val: 'right', label: 'Right', icon: AlignRight }
            ].map((item) => {
              const Icon = item.icon;
              const isSelected = (alignment || 'left') === item.val;
              return (
                <button
                  key={item.val}
                  type="button"
                  onClick={() => setAlignment(item.val)}
                  style={{
                    padding: '7px 6px',
                    borderRadius: '6px',
                    border: isSelected ? '1px solid var(--g-accent, #6366f1)' : '1px solid rgba(255,255,255,0.1)',
                    background: isSelected ? 'rgba(99, 102, 241, 0.25)' : 'rgba(0, 0, 0, 0.2)',
                    color: isSelected ? '#ffffff' : 'var(--text-muted, #94a3b8)',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <Icon size={13} /> {item.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. Vertical Placement (Top, Center, Bottom) */}
      {setVerticalPosition && (
        <div>
          <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: 'var(--text-secondary, #cbd5e1)', marginBottom: '6px' }}>
            Vertical Placement
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
            {['top', 'center', 'bottom'].map((pos) => {
              const isSelected = (verticalPosition || 'center') === pos;
              return (
                <button
                  key={pos}
                  type="button"
                  onClick={() => setVerticalPosition(pos)}
                  style={{
                    padding: '7px 6px',
                    borderRadius: '6px',
                    border: isSelected ? '1px solid var(--g-accent, #6366f1)' : '1px solid rgba(255,255,255,0.1)',
                    background: isSelected ? 'rgba(99, 102, 241, 0.25)' : 'rgba(0, 0, 0, 0.2)',
                    color: isSelected ? '#ffffff' : 'var(--text-muted, #94a3b8)',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    textTransform: 'capitalize',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {pos}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 5. Banner Image Position (Focus) */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
          <label style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-secondary, #cbd5e1)' }}>
            Banner Image Position (Focus)
          </label>
          <span style={{ fontSize: '12px', color: 'var(--primary-color, #818cf8)', fontWeight: 600 }}>
            {positionLabel}
          </span>
        </div>

        {/* Quick Preset Buttons (Top, Middle, Lower) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', marginBottom: '10px' }}>
          {[
            { val: 0, label: 'Top' },
            { val: 50, label: 'Middle' },
            { val: 100, label: 'Lower' },
          ].map((item) => (
            <button
              key={item.val}
              type="button"
              onClick={() => setBannerPosition && setBannerPosition(`${item.val}%`)}
              style={{
                padding: '8px 6px',
                borderRadius: '6px',
                border:
                  currentPercent === item.val
                    ? '1px solid var(--g-accent, #6366f1)'
                    : '1px solid rgba(255,255,255,0.1)',
                background:
                  currentPercent === item.val
                    ? 'rgba(99, 102, 241, 0.25)'
                    : 'rgba(0, 0, 0, 0.2)',
                color: currentPercent === item.val ? '#ffffff' : 'var(--text-muted, #94a3b8)',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                textAlign: 'center',
                transition: 'all 0.15s ease',
              }}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Live Range Slider for Fine-tuning */}
        <div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '4px',
              fontSize: '11px',
              color: 'var(--text-muted, #94a3b8)',
            }}
          >
            <span>0% (Top)</span>
            <span style={{ fontWeight: 600, color: 'var(--primary-color, #818cf8)' }}>
              {currentPercent}%
            </span>
            <span>100% (Lower)</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            step="1"
            value={currentPercent}
            onChange={(e) => setBannerPosition && setBannerPosition(`${e.target.value}%`)}
            style={{
              width: '100%',
              accentColor: 'var(--g-accent, #6366f1)',
              cursor: 'pointer',
            }}
          />
        </div>

        <div style={{ fontSize: '11px', color: 'var(--text-muted, #94a3b8)', marginTop: '6px' }}>
          Drag the slider or click Top / Middle / Lower to adjust image focus vertically.
        </div>
      </div>

      {/* 6. Live Focus Thumbnail Preview (if previewImage provided) */}
      {previewImage && (
        <div style={{ marginTop: '4px' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted, #94a3b8)', marginBottom: '4px' }}>
            Live Focus Preview:
          </div>
          <div
            style={{
              width: '100%',
              height: '110px',
              borderRadius: '8px',
              overflow: 'hidden',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              position: 'relative',
              background: '#090d16',
            }}
          >
            <img
              src={previewImage}
              alt="Banner focus preview"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                objectPosition: `center ${currentPercent}%`,
                transition: 'object-position 0.1s ease-out',
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default BannerFocusHeightControl;

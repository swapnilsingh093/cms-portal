import React from 'react';
import { Eye, Film, Image as ImageIcon } from 'lucide-react';

const LiveBannerPreview = ({
  bannerType = 'image',
  bannerImage = '',
  bannerVideo = '',
  mediaHeight = '60vh',
  overlayStrength = 0,
  bannerPosition = '50%',
  alignment = 'left',
  verticalPosition = 'center',
  badge = 'STORY',
  title = '',
  description = '',
  buttonText = '',
  buttonUrl = ''
}) => {
  // Convert bannerPosition to numeric percentage
  const getBannerPosPercent = (pos) => {
    if (!pos) return 50;
    if (pos === 'top') return 0;
    if (pos === 'center' || pos === 'middle') return 50;
    if (pos === 'bottom' || pos === 'lower') return 100;
    const match = String(pos).match(/(\d+)%/);
    return match ? parseInt(match[1], 10) : 50;
  };

  const posPercent = getBannerPosPercent(bannerPosition);

  // Parse height for container (vh -> clamp to nice visual box)
  const previewHeight = (() => {
    if (!mediaHeight) return '340px';
    if (String(mediaHeight).includes('vh')) return '340px';
    return mediaHeight;
  })();

  const isVideo = bannerType === 'video' && Boolean(bannerVideo);

  return (
    <div>
      {/* Header bar matching Screenshot 3 */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '14px',
          flexWrap: 'wrap',
          gap: '8px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Eye size={17} color="var(--primary-color, #818cf8)" />
          <h2 style={{ fontSize: '1.05rem', fontWeight: 600, margin: 0, color: 'var(--text-primary, #ffffff)' }}>
            Live Banner Preview
          </h2>
        </div>
        <div style={{ fontSize: '12px', color: 'var(--text-muted, #94a3b8)' }}>
          Rendering {isVideo ? '🎬 Video' : '🖼️ Image'} • Height: {mediaHeight || '60vh'} • Darkness: {overlayStrength || 0}%
        </div>
      </div>

      {/* Visual preview box matching Screenshot 3 */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: previewHeight,
          minHeight: '260px',
          maxHeight: '480px',
          borderRadius: '8px',
          overflow: 'hidden',
          background: '#090d16',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}
      >
        {/* 1. Media Layer: Video or Image */}
        {isVideo ? (
          <video
            key={bannerVideo}
            src={bannerVideo}
            autoPlay
            loop
            muted
            playsInline
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: `center ${posPercent}%`
            }}
          />
        ) : bannerImage ? (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage: `url(${bannerImage})`,
              backgroundSize: 'cover',
              backgroundPosition: `center ${posPercent}%`
            }}
          />
        ) : (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
              gap: '8px',
              color: 'var(--text-muted, #94a3b8)',
              fontSize: '13px'
            }}
          >
            {bannerType === 'video' ? <Film size={36} opacity={0.3} /> : <ImageIcon size={36} opacity={0.3} />}
            <span>No banner media selected. Upload or choose banner image above.</span>
          </div>
        )}

        {/* 2. Overlay Layer */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: `rgba(0, 0, 0, ${(overlayStrength || 0) / 100})`,
            pointerEvents: 'none',
            transition: 'background-color 0.2s ease'
          }}
        />

        {/* 3. Text & Content Layer */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            padding: '36px 40px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent:
              verticalPosition === 'top'
                ? 'flex-start'
                : verticalPosition === 'bottom'
                ? 'flex-end'
                : 'center',
            alignItems:
              alignment === 'center'
                ? 'center'
                : alignment === 'right'
                ? 'flex-end'
                : 'flex-start',
            textAlign: alignment || 'left',
            zIndex: 2,
            boxSizing: 'border-box'
          }}
        >
          {badge && (
            <span
              style={{
                fontSize: '13px',
                color: 'var(--primary-color, #818cf8)',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '1.2px',
                marginBottom: '8px',
                textShadow: '0 1px 8px rgba(0,0,0,0.6)'
              }}
            >
              {badge}
            </span>
          )}

          <h1
            style={{
              margin: '0 0 10px',
              fontSize: '2rem',
              fontWeight: 800,
              color: '#ffffff',
              lineHeight: 1.2,
              textShadow: '0 2px 14px rgba(0,0,0,0.6)',
              maxWidth: '850px'
            }}
          >
            {title || 'Story Title Preview'}
          </h1>

          {description && (
            <p
              style={{
                margin: '0 0 16px',
                fontSize: '1rem',
                color: 'rgba(255, 255, 255, 0.9)',
                maxWidth: '650px',
                lineHeight: 1.5,
                textShadow: '0 1px 8px rgba(0,0,0,0.6)'
              }}
            >
              {description}
            </p>
          )}

          {buttonText && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '9px 20px',
                borderRadius: '6px',
                background: 'linear-gradient(135deg, var(--g-accent, #6366f1), #8b5cf6)',
                color: '#fff',
                fontSize: '13px',
                fontWeight: 600,
                boxShadow: '0 4px 16px rgba(99, 102, 241, 0.45)'
              }}
            >
              {buttonText}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default LiveBannerPreview;

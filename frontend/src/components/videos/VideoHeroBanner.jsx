import React, { useRef, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, Play, ChevronRight, X, Eye, GripVertical, Palette } from 'lucide-react';
import { useSiteTheme } from '../../context/SiteThemeContext';
import { stripHtml } from '../../utils/textHelper';

const VideoHeroBanner = ({ config = {}, breadcrumbs = [], showScrollIndicator = true }) => {
  const { paletteOpen, setPaletteOpen } = useSiteTheme();
  const [videoError, setVideoError] = useState(false);
  const [videoSize, setVideoSize] = useState(null);
  const [isTextVisible, setIsTextVisible] = useState(true);
  const [customPos, setCustomPos] = useState(null); // { x: number, y: number } in px relative to banner
  const [isDragging, setIsDragging] = useState(false);
  const [draggingTarget, setDraggingTarget] = useState(null); // 'button' | 'box'

  const videoRef = useRef(null);
  const bannerRef = useRef(null);
  const dragStartRef = useRef({ startX: 0, startY: 0, offsetX: 0, offsetY: 0, hasMoved: false });

  const {
    type = 'image',
    mediaUrl = '',
    height = '75vh',
    heading = 'Explore Our Video Stories',
    subheading = '',
    description = '',
    buttonText = '',
    buttonUrl = '',
    headingFontSize = '2rem',
    subheadingFontSize = '0.72rem',
    descriptionFontSize = '1rem',
    alignment = 'left',
    verticalPosition = 'center',
    overlayStrength = 0,
    bannerPosition = 'center',
    fileSize = null,
  } = config;

  // Reset error & guarantee muted autoplay when mediaUrl changes
  useEffect(() => {
    setVideoError(false);
    if (videoRef.current) {
      videoRef.current.defaultMuted = true;
      videoRef.current.muted = true;
      videoRef.current.play().catch(() => {});
    }
  }, [mediaUrl, type]);

  // 1. Detect video file size
  useEffect(() => {
    if (type === 'video' && mediaUrl) {
      if (fileSize) {
        setVideoSize(Number(fileSize));
        return;
      }
      fetch(mediaUrl, { method: 'HEAD' })
        .then((res) => {
          const len = res.headers.get('content-length');
          if (len) {
            setVideoSize(parseInt(len, 10));
          }
        })
        .catch(() => {});
    }
  }, [type, mediaUrl, fileSize]);

  // 2. Playback start position based on file size
  const handleLoadedMetadata = () => {
    if (!videoRef.current) return;
    const duration = videoRef.current.duration || 0;
    const eightMB = 8 * 1024 * 1024;
    const isLarge = videoSize !== null && videoSize > eightMB;

    if (isLarge && duration > 20) {
      try {
        videoRef.current.currentTime = 20;
      } catch (e) {}
    } else {
      videoRef.current.currentTime = 0;
    }
    videoRef.current.play().catch(() => {});
  };

  // 3. Drag and Drop handlers for both Button and Info Box
  const handlePointerDown = (e, target) => {
    if (e.button !== undefined && e.button !== 0) return;

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    if (!bannerRef.current) return;
    const bannerRect = bannerRef.current.getBoundingClientRect();
    const targetEl = e.currentTarget;
    const targetRect = targetEl.getBoundingClientRect();

    dragStartRef.current = {
      startX: clientX,
      startY: clientY,
      offsetX: clientX - targetRect.left,
      offsetY: clientY - targetRect.top,
      hasMoved: false,
    };

    setDraggingTarget(target);
    setIsDragging(true);
  };

  useEffect(() => {
    if (!isDragging) return;

    const handlePointerMove = (e) => {
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;

      const deltaX = clientX - dragStartRef.current.startX;
      const deltaY = clientY - dragStartRef.current.startY;

      if (Math.hypot(deltaX, deltaY) > 5) {
        dragStartRef.current.hasMoved = true;
      }

      if (!bannerRef.current) return;
      const bannerRect = bannerRef.current.getBoundingClientRect();

      const newX = clientX - bannerRect.left - dragStartRef.current.offsetX;
      const newY = clientY - bannerRect.top - dragStartRef.current.offsetY;

      const maxW = draggingTarget === 'box' ? Math.min(580, bannerRect.width - 32) : 190;
      const maxH = draggingTarget === 'box' ? 220 : 48;

      const clampedX = Math.max(12, Math.min(newX, bannerRect.width - maxW - 12));
      const clampedY = Math.max(12, Math.min(newY, bannerRect.height - maxH - 12));

      setCustomPos({ x: clampedX, y: clampedY });
    };

    const handlePointerEnd = () => {
      setIsDragging(false);
      setDraggingTarget(null);
    };

    window.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('mouseup', handlePointerEnd);
    window.addEventListener('touchmove', handlePointerMove, { passive: false });
    window.addEventListener('touchend', handlePointerEnd);

    return () => {
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('mouseup', handlePointerEnd);
      window.removeEventListener('touchmove', handlePointerMove);
      window.removeEventListener('touchend', handlePointerEnd);
    };
  }, [isDragging, draggingTarget]);

  const handleToggleClick = () => {
    if (dragStartRef.current.hasMoved) return;
    setIsTextVisible(true);
  };

  const alignMap = {
    left: { textAlign: 'left', alignItems: 'flex-start' },
    center: { textAlign: 'center', alignItems: 'center' },
    right: { textAlign: 'right', alignItems: 'flex-end' },
  };

  const justifyMap = {
    top: 'flex-start',
    center: 'center',
    bottom: 'flex-end',
  };

  const al = alignMap[alignment] || alignMap.left;
  const jc = justifyMap[verticalPosition] || 'center';

  const showVideo = type === 'video' && mediaUrl && !videoError;
  const rawOverlay =
    typeof overlayStrength === 'number'
      ? overlayStrength
      : parseFloat(overlayStrength) || 0;
  // If overlay is stored as percentage (e.g. 10 to 100), convert to 0-1 range
  const overlayAlpha = rawOverlay > 1 ? Math.min(rawOverlay / 100, 1) : Math.max(0, rawOverlay);
  const numericOverlay = overlayAlpha;

  const resolveMediaPos = (pos) => {
    if (!pos || pos === 'center' || pos === 'middle') return 'center center';
    if (pos === 'top') return 'center top';
    if (pos === 'bottom' || pos === 'lower') return 'center bottom';
    const clean = String(pos).trim();
    if (clean.endsWith('%') || !isNaN(clean)) {
      const val = clean.replace('%', '');
      return `center ${val}%`;
    }
    return pos;
  };
  const mediaObjectPos = resolveMediaPos(bannerPosition);

  // Box coordinates when placed via customPos
  const getBoxPositionStyle = () => {
    if (!customPos) {
      return {
        position: 'relative',
        width: 'min(580px, calc(100vw - 48px))',
        maxWidth: '100%',
        margin: alignment === 'center' ? '0 auto' : undefined,
      };
    }

    let left = customPos.x;
    let top = customPos.y;

    if (bannerRef.current) {
      const bannerRect = bannerRef.current.getBoundingClientRect();
      const boxMaxWidth = Math.min(580, bannerRect.width - 32);
      left = Math.max(14, Math.min(left, bannerRect.width - boxMaxWidth - 14));
      top = Math.max(14, Math.min(top, Math.max(14, bannerRect.height - 240)));
    }

    return {
      position: 'absolute',
      left: `${left}px`,
      top: `${top}px`,
      width: 'min(580px, calc(100vw - 48px))',
      maxWidth: '100%',
      zIndex: 25,
    };
  };

  return (
    <div
      ref={bannerRef}
      className="videos-hero-banner"
      style={{
        position: 'relative',
        width: '100%',
        height: height || '75vh',
        overflow: 'hidden',
        background: '#0a0a1a',
      }}
    >
      {/* Background Media: Video or Image */}
      {showVideo ? (
        <video
          ref={videoRef}
          src={mediaUrl}
          autoPlay
          muted
          loop
          playsInline
          onLoadedMetadata={handleLoadedMetadata}
          onError={() => setVideoError(true)}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: mediaObjectPos,
          }}
        />
      ) : mediaUrl && type === 'image' ? (
        <img
          src={mediaUrl}
          alt={heading}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: mediaObjectPos,
          }}
        />
      ) : (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(135deg, #0f0c29 0%, #1a1a4e 40%, #302b63 70%, #24243e 100%)',
          }}
        />
      )}

      {/* Dynamic Overlay */}
      {overlayAlpha > 0 && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `rgba(0, 0, 0, ${overlayAlpha})`,
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Main Content Container */}
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: jc,
          padding: '0 clamp(24px, 6vw, 100px)',
          paddingBottom: verticalPosition === 'bottom' ? '60px' : '0',
          paddingTop: verticalPosition === 'top' ? '80px' : '0',
          maxWidth: '1400px',
          margin: '0 auto',
          width: '100%',
          boxSizing: 'border-box',
          pointerEvents: customPos ? 'none' : 'auto',
        }}
      >
        {/* If text is visible AND no custom drag position, render in normal flow */}
        {isTextVisible && !customPos && (
          <BannerInfoBox
            al={al}
            alignment={alignment}
            numericOverlay={numericOverlay}
            breadcrumbs={breadcrumbs}
            subheading={subheading}
            subheadingFontSize={subheadingFontSize}
            heading={heading}
            headingFontSize={headingFontSize}
            description={description}
            descriptionFontSize={descriptionFontSize}
            buttonText={buttonText}
            buttonUrl={buttonUrl}
            onClose={() => setIsTextVisible(false)}
            onDragStart={(e) => handlePointerDown(e, 'box')}
            isDragging={isDragging && draggingTarget === 'box'}
            customStyle={getBoxPositionStyle()}
            onOpenPalette={() => setPaletteOpen(!paletteOpen)}
          />
        )}

        {/* If text is NOT visible AND no custom drag position, render default toggle button */}
        {!isTextVisible && !customPos && (
          <div
            style={{
              display: 'flex',
              ...al,
              margin: alignment === 'center' ? '0 auto' : undefined,
              animation: 'fadeIn 0.25s ease',
            }}
          >
            <DraggableToggleButton
              onMouseDown={(e) => handlePointerDown(e, 'button')}
              onTouchStart={(e) => handlePointerDown(e, 'button')}
              onClick={handleToggleClick}
              isDragging={isDragging && draggingTarget === 'button'}
              customPos={customPos}
            />
          </div>
        )}
      </div>

      {/* Free Floating Dropped Elements (when customPos is set) */}
      {customPos && (
        <>
          {isTextVisible ? (
            <div style={{ pointerEvents: 'auto' }}>
              <BannerInfoBox
                al={al}
                alignment={alignment}
                numericOverlay={numericOverlay}
                breadcrumbs={breadcrumbs}
                subheading={subheading}
                subheadingFontSize={subheadingFontSize}
                heading={heading}
                headingFontSize={headingFontSize}
                description={description}
                descriptionFontSize={descriptionFontSize}
                buttonText={buttonText}
                buttonUrl={buttonUrl}
                onClose={() => setIsTextVisible(false)}
                onDragStart={(e) => handlePointerDown(e, 'box')}
                isDragging={isDragging && draggingTarget === 'box'}
                customStyle={getBoxPositionStyle()}
                onOpenPalette={() => setPaletteOpen(!paletteOpen)}
              />
            </div>
          ) : (
            <div style={{ pointerEvents: 'auto' }}>
              <DraggableToggleButton
                onMouseDown={(e) => handlePointerDown(e, 'button')}
                onTouchStart={(e) => handlePointerDown(e, 'button')}
                onClick={handleToggleClick}
                isDragging={isDragging && draggingTarget === 'button'}
                customPos={customPos}
              />
            </div>
          )}
        </>
      )}

      {/* Scroll indicator (only if enabled) */}
      {showScrollIndicator && (
        <div
          style={{
            position: 'absolute',
            bottom: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 3,
            animation: 'heroBounce 2s infinite',
            opacity: 0.7,
            pointerEvents: 'none',
          }}
        >
          <ChevronDown size={26} color="#fff" />
        </div>
      )}

      <style>{`
        @keyframes heroBounce {
          0%, 100% { transform: translateX(-50%) translateY(0); }
          50% { transform: translateX(-50%) translateY(7px); }
        }
      `}</style>
    </div>
  );
};

// Reusable Banner Info Box with Drag Handle & Close Button
const BannerInfoBox = ({
  al,
  alignment,
  numericOverlay,
  breadcrumbs,
  subheading,
  subheadingFontSize,
  heading,
  headingFontSize,
  description,
  descriptionFontSize,
  buttonText,
  buttonUrl,
  onClose,
  onDragStart,
  isDragging,
  customStyle = {},
  onOpenPalette,
}) => {
  return (
    <div
      data-draggable="true"
      style={{
        display: 'flex',
        flexDirection: 'column',
        ...al,
        width: 'min(580px, calc(100vw - 48px))',
        maxWidth: '100%',
        minHeight: '290px',
        boxSizing: 'border-box',
        padding: '28px 36px',
        borderRadius: '20px',
        background: 'rgba(12, 12, 12, 0.7)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.16)',
        boxShadow: isDragging
          ? '0 20px 50px rgba(0, 0, 0, 0.65), 0 0 25px var(--g-accent, rgba(99, 102, 241, 0.4))'
          : '0 14px 40px rgba(0, 0, 0, 0.45)',
        animation: 'fadeIn 0.25s ease',
        pointerEvents: 'auto',
        ...customStyle,
      }}
    >
      {/* Top Header Controls: Drag Handle on Left, Cut / Close on Right */}
      <div
        onMouseDown={(e) => {
          if (e.target.closest('button') || e.target.closest('a')) return;
          onDragStart(e);
        }}
        onTouchStart={(e) => {
          if (e.target.closest('button') || e.target.closest('a')) return;
          onDragStart(e);
        }}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          marginBottom: '18px',
          paddingBottom: '10px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          cursor: isDragging ? 'grabbing' : 'grab',
          userSelect: 'none',
          touchAction: 'none',
        }}
        title="Click and drag to move this info box anywhere"
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            color: 'rgba(255, 255, 255, 0.55)',
            fontSize: '0.72rem',
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            fontWeight: 700,
          }}
        >
          <GripVertical size={13} style={{ opacity: 0.7 }} />
          <span>Drag to move</span>
        </div>

        {/* Action Controls: Theme Palette Icon + Close Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {onOpenPalette && (
            <button
              type="button"
              onMouseDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                onOpenPalette();
              }}
              aria-label="Customize theme colors"
              title="Change theme colour"
              style={{
                width: '26px',
                height: '26px',
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.12)',
                border: '1px solid rgba(255, 255, 255, 0.22)',
                color: 'var(--g-accent, #3b82f6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                backdropFilter: 'blur(8px)',
                padding: 0,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.22)';
                e.currentTarget.style.transform = 'scale(1.08)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)';
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              <Palette size={13} />
            </button>
          )}

          {/* Cut / Close Button */}
          <button
            type="button"
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              onClose();
            }}
            aria-label="Hide banner text"
            title="Hide banner text (restored on refresh or via Show Info button)"
            style={{
              width: '26px',
              height: '26px',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.12)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: 'rgba(255, 255, 255, 0.85)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              backdropFilter: 'blur(8px)',
              padding: 0,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.4)';
              e.currentTarget.style.color = '#fff';
              e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.7)';
              e.currentTarget.style.transform = 'scale(1.08)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)';
              e.currentTarget.style.color = 'rgba(255, 255, 255, 0.85)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Breadcrumbs */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav
          aria-label="Breadcrumbs"
          style={{
            display: 'flex',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '6px',
            fontSize: '12px',
            color: 'rgba(255, 255, 255, 0.75)',
            marginBottom: '16px',
          }}
        >
          {breadcrumbs.map((crumb, idx) => (
            <React.Fragment key={idx}>
              {idx > 0 && <ChevronRight size={12} style={{ opacity: 0.5 }} />}
              {crumb.url ? (
                <Link
                  to={crumb.url}
                  style={{
                    color: 'rgba(255, 255, 255, 0.85)',
                    textDecoration: 'none',
                    transition: 'color 0.2s',
                    fontWeight: 500,
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#fff')}
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.color = 'rgba(255, 255, 255, 0.85)')
                  }
                >
                  {crumb.label}
                </Link>
              ) : (
                <span style={{ color: 'var(--g-accent, #ffffff)', fontWeight: 700 }}>
                  {crumb.label}
                </span>
              )}
            </React.Fragment>
          ))}
        </nav>
      )}

      {/* Subheading / Badge */}
      {subheading && (
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'var(--primary-subtle, rgba(99, 102, 241, 0.15))',
            border: '1px solid var(--g-accent, #6366f1)',
            borderRadius: '999px',
            padding: '4px 14px',
            fontSize: '0.72rem',
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--g-accent, #c7d2fe)',
            marginBottom: '16px',
          }}
        >
          <Play size={11} fill="currentColor" />
          {subheading}
        </div>
      )}

      {/* Main Heading */}
      <h1
        style={{
          fontSize: (headingFontSize && headingFontSize !== '3rem' && headingFontSize !== '3.2rem') ? headingFontSize : '2rem',
          fontWeight: 900,
          lineHeight: 1.15,
          color: '#ffffff',
          margin: '0 0 16px',
          textShadow: '0 2px 14px rgba(0, 0, 0, 0.6)',
          letterSpacing: '-0.02em',
        }}
      >
        {heading}
      </h1>

      {/* Short Description */}
      {description && (
        <p
          style={{
            fontSize: descriptionFontSize || '1rem',
            color: 'rgba(255, 255, 255, 0.85)',
            margin: '0 0 24px',
            lineHeight: 1.68,
            maxWidth: '580px',
            textShadow: '0 1px 6px rgba(0, 0, 0, 0.5)',
          }}
        >
          {stripHtml(description)}
        </p>
      )}

      {/* CTA Button */}
      {buttonText && (
        <a
          href={buttonUrl || '#categories'}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'var(--primary-subtle, rgba(99, 102, 241, 0.15))',
            border: '1px solid var(--g-accent, #6366f1)',
            color: 'var(--g-accent, #ffffff)',
            padding: '12px 28px',
            borderRadius: '999px',
            fontWeight: 700,
            fontSize: '0.92rem',
            textDecoration: 'none',
            boxShadow: '0 0 30px var(--g-accent, rgba(99, 102, 241, 0.4))',
            transition: 'transform 0.2s, box-shadow 0.2s',
            alignSelf:
              alignment === 'center'
                ? 'center'
                : alignment === 'right'
                ? 'flex-end'
                : 'flex-start',
          }}
        >
          <Play size={15} fill="#fff" />
          {buttonText}
        </a>
      )}
    </div>
  );
};

// Reusable Draggable "Show Banner Info" Button
const DraggableToggleButton = ({ onMouseDown, onTouchStart, onClick, isDragging, customPos }) => {
  return (
    <button
      type="button"
      onMouseDown={onMouseDown}
      onTouchStart={onTouchStart}
      onClick={onClick}
      aria-label="Drag to move, click to show banner info"
      title="Drag anywhere on banner, click to show info right there"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '7px',
        padding: '8px 16px',
        fontSize: '0.82rem',
        fontWeight: 600,
        letterSpacing: '0.02em',
        color: '#ffffff',
        background: isDragging
          ? 'var(--g-accent, rgba(99, 102, 241, 0.95))'
          : 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        border: '1px solid rgba(255, 255, 255, 0.25)',
        borderRadius: '999px',
        cursor: isDragging ? 'grabbing' : 'grab',
        boxShadow: isDragging
          ? '0 14px 34px var(--g-accent, rgba(99, 102, 241, 0.6)), 0 0 16px rgba(129, 140, 248, 0.5)'
          : '0 8px 24px rgba(0, 0, 0, 0.45)',
        transition: isDragging ? 'none' : 'all 0.2s ease',
        userSelect: 'none',
        touchAction: 'none',
        ...(customPos
          ? {
              position: 'absolute',
              left: `${customPos.x}px`,
              top: `${customPos.y}px`,
              zIndex: 30,
            }
          : {
              position: 'relative',
              zIndex: 30,
            }),
      }}
      onMouseEnter={(e) => {
        if (!isDragging) {
          e.currentTarget.style.background = 'var(--g-accent, rgba(99, 102, 241, 0.85))';
          e.currentTarget.style.borderColor = 'rgba(129, 140, 248, 0.7)';
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 10px 28px var(--g-accent, rgba(99, 102, 241, 0.5))';
        }
      }}
      onMouseLeave={(e) => {
        if (!isDragging) {
          e.currentTarget.style.background = 'rgba(15, 23, 42, 0.75)';
          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.25)';
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.45)';
        }
      }}
    >
      <GripVertical size={13} style={{ opacity: 0.65 }} />
      <Eye size={14} />
      <span>Show Banner Info</span>
    </button>
  );
};

export default VideoHeroBanner;

import React, { useRef, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, BookOpen, ChevronRight, X, Eye, GripVertical, ArrowRight, Palette } from 'lucide-react';
import { useSiteTheme } from '../../context/SiteThemeContext';
import { stripHtml } from '../../utils/textHelper';

const StoriesHeroBanner = ({ config = {}, breadcrumbs = [], showScrollIndicator = false }) => {
  const { setPaletteOpen, paletteOpen } = useSiteTheme();
  const [videoError, setVideoError] = useState(false);
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
    heading = 'Stories & Editorial Journal',
    subheading = 'Thoughtful Perspectives & Chronicles',
    description = '',
    buttonText = '',
    buttonUrl = '',
    headingFontSize = '2rem',
    subheadingFontSize = '0.72rem',
    descriptionFontSize = '1.05rem',
    alignment = 'left',
    verticalPosition = 'center',
    overlayStrength = 0,
    bannerPosition = 'center',
  } = config;

  // Drag and Drop handlers for both Button and Info Box (same as VideoHeroBanner / GalleryHeroBanner)
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

  const defaultMedia =
    'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?auto=format&fit=crop&w=1920&q=80';
  const effectiveImageUrl = mediaUrl || defaultMedia;

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
      style={{
        position: 'relative',
        width: '100%',
        height: height || '75vh',
        minHeight: '480px',
        overflow: 'hidden',
        background: '#090e18',
        boxSizing: 'border-box',
        userSelect: isDragging ? 'none' : 'auto',
      }}
    >
      {/* Background Media */}
      {showVideo ? (
        <video
          ref={videoRef}
          src={mediaUrl}
          autoPlay
          loop
          muted
          playsInline
          onError={() => setVideoError(true)}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: mediaObjectPos,
            pointerEvents: 'none',
          }}
        />
      ) : (
        <img
          src={effectiveImageUrl}
          alt={heading || 'Stories Hero'}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: mediaObjectPos,
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Dark / Tint Overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            overlayAlpha > 0
              ? `rgba(0, 0, 0, ${overlayAlpha})`
              : 'linear-gradient(to top, rgba(9, 14, 24, 0.8) 0%, rgba(9, 14, 24, 0.2) 60%, rgba(9, 14, 24, 0.4) 100%)',
          pointerEvents: 'none',
        }}
      />

      {/* Main Content Container matching VideoHeroBanner / GalleryHeroBanner */}
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
        {/* Normal Flow Info Box */}
        {isTextVisible && !customPos && (
          <StoryBannerInfoBox
            al={al}
            alignment={alignment}
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

        {/* Normal Flow Toggle Button */}
        {!isTextVisible && !customPos && (
          <div
            style={{
              display: 'flex',
              ...al,
              margin: alignment === 'center' ? '0 auto' : undefined,
              animation: 'fadeIn 0.25s ease',
            }}
          >
            <DraggableStoryToggle
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
              <StoryBannerInfoBox
                al={al}
                alignment={alignment}
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
              <DraggableStoryToggle
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

      {/* Scroll indicator */}
      {showScrollIndicator && (
        <div
          style={{
            position: 'absolute',
            bottom: '18px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 10,
            color: 'rgba(255, 255, 255, 0.6)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            fontSize: '11px',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            pointerEvents: 'none',
          }}
        >
          <span style={{ marginBottom: '4px' }}>Scroll</span>
          <ChevronDown size={14} className="bounce" />
        </div>
      )}
    </div>
  );
};

// Reusable Draggable "Show Story Info" Button (matches Video and Gallery pill buttons)
const DraggableStoryToggle = ({ onMouseDown, onTouchStart, onClick, isDragging, customPos }) => {
  return (
    <button
      type="button"
      onMouseDown={onMouseDown}
      onTouchStart={onTouchStart}
      onClick={onClick}
      aria-label="Drag to move, click to show story info"
      title="Drag anywhere on banner, click to show info right there"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        padding: '9px 18px',
        fontSize: '0.82rem',
        fontWeight: 700,
        letterSpacing: '0.02em',
        color: '#ffffff',
        background: isDragging
          ? 'var(--g-accent, #3b82f6)'
          : 'var(--g-surface, rgba(15, 23, 42, 0.88))',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        border: '1px solid var(--g-border, var(--g-accent, rgba(59, 130, 246, 0.4)))',
        borderRadius: '999px',
        cursor: isDragging ? 'grabbing' : 'grab',
        boxShadow: isDragging
          ? '0 14px 34px var(--g-accent-glow, rgba(59, 130, 246, 0.6))'
          : '0 8px 24px rgba(0, 0, 0, 0.5)',
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
          e.currentTarget.style.background = 'var(--g-accent, #3b82f6)';
          e.currentTarget.style.transform = 'translateY(-2px)';
        }
      }}
      onMouseLeave={(e) => {
        if (!isDragging) {
          e.currentTarget.style.background = 'var(--g-surface, rgba(15, 23, 42, 0.88))';
          e.currentTarget.style.transform = 'translateY(0)';
        }
      }}
    >
      <GripVertical size={13} style={{ opacity: 0.7 }} />
      <Eye size={14} color="var(--g-accent, #60a5fa)" />
      <span>Show Story Info</span>
    </button>
  );
};

// The Complete Banner Info Box
const StoryBannerInfoBox = ({
  al,
  alignment = 'left',
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
        padding: '28px 36px',
        borderRadius: '20px',
        background: 'rgba(12, 12, 12, 0.7)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.16)',
        boxShadow: isDragging
          ? '0 24px 60px rgba(0,0,0,0.7), 0 0 30px var(--g-accent-glow, var(--primary-glow, rgba(59, 130, 246, 0.35)))'
          : '0 18px 45px rgba(0,0,0,0.5)',
        width: 'min(580px, calc(100vw - 48px))',
        maxWidth: '100%',
        minHeight: '290px',
        boxSizing: 'border-box',
        cursor: isDragging ? 'grabbing' : 'default',
        transition: isDragging ? 'none' : 'box-shadow 0.2s ease',
        ...customStyle,
      }}
    >
      {/* Drag Bar & Window Controls */}
      <div
        onMouseDown={(e) => {
          if (e.target.closest('button') || e.target.closest('a')) return;
          onDragStart(e);
        }}
        onTouchStart={(e) => {
          if (e.target.closest('button') || e.target.closest('a')) return;
          onDragStart(e);
        }}
        title="Click and drag to reposition banner info box anywhere"
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingBottom: '12px',
          marginBottom: '16px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          cursor: isDragging ? 'grabbing' : 'grab',
          userSelect: 'none',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            color: 'var(--text-secondary, #94a3b8)',
            fontSize: '11px',
            fontWeight: 700,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
          }}
        >
          <GripVertical size={14} />
          <span>Drag to move</span>
        </div>

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
              title="Change Story Banner Colors"
              style={{
                width: '26px',
                height: '26px',
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: 'var(--g-accent, #60a5fa)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              <Palette size={13} />
            </button>
          )}

          <button
            type="button"
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              onClose();
            }}
            title="Hide Info Box"
            style={{
              width: '26px',
              height: '26px',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.4)';
              e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.7)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
            }}
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Breadcrumbs Navigation */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav
          aria-label="Breadcrumb"
          style={{
            display: 'flex',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '6px',
            marginBottom: '14px',
            fontSize: '12px',
          }}
        >
          {breadcrumbs.map((crumb, idx) => (
            <React.Fragment key={idx}>
              {idx > 0 && <ChevronRight size={12} color="rgba(255,255,255,0.4)" />}
              {crumb.url ? (
                <Link
                  to={crumb.url}
                  style={{
                    color: 'rgba(255,255,255,0.7)',
                    textDecoration: 'none',
                    fontWeight: 500,
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#fff')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.7)')}
                >
                  {crumb.label}
                </Link>
              ) : (
                <span style={{ color: 'var(--g-accent, #60a5fa)', fontWeight: 700 }}>
                  {crumb.label}
                </span>
              )}
            </React.Fragment>
          ))}
        </nav>
      )}

      {/* Subheading / Pill Tag */}
      {subheading && (
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: 'var(--primary-subtle, rgba(59, 130, 246, 0.15))',
            border: '1px solid var(--g-accent, #3b82f6)',
            borderRadius: '999px',
            padding: '4px 14px',
            fontSize: '0.72rem',
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--g-accent, #60a5fa)',
            marginBottom: '14px',
            alignSelf:
              alignment === 'center'
                ? 'center'
                : alignment === 'right'
                ? 'flex-end'
                : 'flex-start',
          }}
        >
          <BookOpen size={12} />
          <span>{subheading}</span>
        </div>
      )}

      {/* Main Title Heading */}
      <h1
        style={{
          fontSize: (headingFontSize && headingFontSize !== '3rem' && headingFontSize !== '3.2rem') ? headingFontSize : '2rem',
          fontWeight: 900,
          color: '#ffffff',
          lineHeight: 1.15,
          margin: '0 0 16px 0',
          textShadow: '0 2px 14px rgba(0, 0, 0, 0.6)',
          letterSpacing: '-0.02em',
          textAlign: alignment,
        }}
      >
        {heading}
      </h1>

      {/* Editorial Description */}
      {description && (
        <p
          style={{
            fontSize: descriptionFontSize || '1.05rem',
            lineHeight: 1.65,
            color: 'rgba(255, 255, 255, 0.85)',
            margin: '0 0 24px 0',
            maxWidth: '580px',
            textShadow: '0 1px 6px rgba(0, 0, 0, 0.5)',
            textAlign: alignment,
          }}
        >
          {stripHtml(description)}
        </p>
      )}

      {/* CTA Button */}
      {buttonText && (
        <div
          style={{
            alignSelf:
              alignment === 'center'
                ? 'center'
                : alignment === 'right'
                ? 'flex-end'
                : 'flex-start',
          }}
        >
          <a
            href={buttonUrl || '#articles'}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 28px',
              borderRadius: '999px',
              fontSize: '0.92rem',
              fontWeight: 700,
              textDecoration: 'none',
              color: '#ffffff',
              background: 'var(--primary-subtle, rgba(59, 130, 246, 0.15))',
              border: '1px solid var(--g-accent, #3b82f6)',
              boxShadow: '0 8px 24px var(--g-accent-glow, rgba(59, 130, 246, 0.35))',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--g-accent, #3b82f6)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background =
                'var(--primary-subtle, rgba(59, 130, 246, 0.15))';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <span>{buttonText}</span>
            <ArrowRight size={14} />
          </a>
        </div>
      )}
    </div>
  );
};

export default StoriesHeroBanner;

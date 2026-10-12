import React, { useRef, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, ChevronRight, X, Eye, GripVertical, Images, Sparkles, Palette } from "lucide-react";
import { useGalleryTheme } from "../../context/GalleryThemeContext";
import { stripHtml } from "../../utils/textHelper";

const GalleryHeroBanner = ({ config = {}, breadcrumbs = [], showScrollIndicator = true }) => {
  const { setPaletteOpen, paletteOpen } = useGalleryTheme();
  const [videoError, setVideoError] = useState(false);
  const [isTextVisible, setIsTextVisible] = useState(true);
  const [customPos, setCustomPos] = useState(null); // { x: number, y: number } in px relative to banner
  const [isDragging, setIsDragging] = useState(false);
  const [draggingTarget, setDraggingTarget] = useState(null); // 'button' | 'box'

  const videoRef = useRef(null);
  const bannerRef = useRef(null);
  const dragStartRef = useRef({ startX: 0, startY: 0, offsetX: 0, offsetY: 0, hasMoved: false });

  const {
    type = "image",
    mediaUrl = "",
    height = "70vh",
    heading = "Visual Stories & Photo Collections",
    subheading = "Curated Photography",
    description = "Explore high-resolution visual stories, authentic cultural snapshots, and deep folklore heritage preserved in vivid detail.",
    buttonText = "Explore Albums",
    buttonUrl = "#albums",
    headingFontSize = "2rem",
    subheadingFontSize = "0.72rem",
    descriptionFontSize = "1rem",
    alignment = "left",
    verticalPosition = "center",
    overlayStrength = 0.35,
    bannerPosition = "center",
  } = config;

  // Drag and Drop handlers
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

      const maxW = draggingTarget === "box" ? Math.min(580, bannerRect.width - 32) : 190;
      const maxH = draggingTarget === "box" ? 220 : 48;

      const clampedX = Math.max(12, Math.min(newX, bannerRect.width - maxW - 12));
      const clampedY = Math.max(12, Math.min(newY, bannerRect.height - maxH - 12));

      setCustomPos({ x: clampedX, y: clampedY });
    };

    const handlePointerEnd = () => {
      setIsDragging(false);
      setDraggingTarget(null);
    };

    window.addEventListener("mousemove", handlePointerMove);
    window.addEventListener("mouseup", handlePointerEnd);
    window.addEventListener("touchmove", handlePointerMove, { passive: false });
    window.addEventListener("touchend", handlePointerEnd);

    return () => {
      window.removeEventListener("mousemove", handlePointerMove);
      window.removeEventListener("mouseup", handlePointerEnd);
      window.removeEventListener("touchmove", handlePointerMove);
      window.removeEventListener("touchend", handlePointerEnd);
    };
  }, [isDragging, draggingTarget]);

  const handleToggleClick = () => {
    if (dragStartRef.current.hasMoved) return;
    setIsTextVisible(true);
  };

  const alignMap = {
    left: { textAlign: "left", alignItems: "flex-start" },
    center: { textAlign: "center", alignItems: "center" },
    right: { textAlign: "right", alignItems: "flex-end" },
  };

  const justifyMap = {
    top: "flex-start",
    center: "center",
    bottom: "flex-end",
  };

  const al = alignMap[alignment] || alignMap.left;
  const jc = justifyMap[verticalPosition] || "center";

  const showVideo = type === "video" && mediaUrl && !videoError;
  const rawOverlay =
    typeof overlayStrength === "number"
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

  const bgImage = mediaUrl || "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1800&q=80";

  // Box coordinates when placed via customPos
  const getBoxPositionStyle = () => {
    if (!customPos) {
      return {
        position: "relative",
        width: "min(580px, calc(100vw - 48px))",
        maxWidth: "100%",
        margin: alignment === "center" ? "0 auto" : undefined,
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
      position: "absolute",
      left: `${left}px`,
      top: `${top}px`,
      width: "min(580px, calc(100vw - 48px))",
      maxWidth: "100%",
      zIndex: 25,
    };
  };

  return (
    <div
      ref={bannerRef}
      className="gallery-hero-banner"
      style={{
        position: "relative",
        width: "100%",
        height: height || "70vh",
        minHeight: "480px",
        overflow: "hidden",
        backgroundColor: "var(--g-bg, #0b0f17)",
        borderBottom: "1px solid var(--g-border, rgba(255, 255, 255, 0.1))",
      }}
    >
      {/* Background Media */}
      {showVideo ? (
        <video
          ref={videoRef}
          src={mediaUrl}
          autoPlay
          muted
          loop
          playsInline
          onError={() => setVideoError(true)}
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: mediaObjectPos }}
        />
      ) : (
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: `url("${bgImage}")`,
            backgroundSize: "cover",
            backgroundPosition: mediaObjectPos,
            filter: "brightness(0.92)",
          }}
        />
      )}

      {/* Dynamic Overlay */}
      {numericOverlay > 0 && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: `rgba(0, 0, 0, ${numericOverlay})`,
            pointerEvents: "none",
          }}
        />
      )}

      {/* Subtle photography ambient vignette */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.65) 100%)",
          pointerEvents: "none",
        }}
      />

      {/* Main Content Container */}
      <div
        style={{
          position: "relative",
          zIndex: 2,
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: jc,
          padding: "0 clamp(24px, 6vw, 100px)",
          maxWidth: "1400px",
          margin: "0 auto",
          width: "100%",
          boxSizing: "border-box",
          pointerEvents: customPos ? "none" : "auto",
        }}
      >
        {/* If text is visible AND no custom drag position, render in normal flow */}
        {isTextVisible && !customPos && (
          <GalleryInfoBox
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
            onDragStart={(e) => handlePointerDown(e, "box")}
            isDragging={isDragging && draggingTarget === "box"}
            customStyle={getBoxPositionStyle()}
            onOpenPalette={() => setPaletteOpen(!paletteOpen)}
          />
        )}

        {/* If text is NOT visible AND no custom drag position, render toggle button */}
        {!isTextVisible && !customPos && (
          <div
            style={{
              display: "flex",
              ...al,
              margin: alignment === "center" ? "0 auto" : undefined,
              animation: "fadeIn 0.25s ease",
            }}
          >
            <DraggableGalleryToggle
              onMouseDown={(e) => handlePointerDown(e, "button")}
              onTouchStart={(e) => handlePointerDown(e, "button")}
              onClick={handleToggleClick}
              isDragging={isDragging && draggingTarget === "button"}
              customPos={customPos}
            />
          </div>
        )}
      </div>

      {/* Floating Elements (when customPos is set) */}
      {customPos && (
        <>
          {isTextVisible ? (
            <div style={{ pointerEvents: "auto" }}>
              <GalleryInfoBox
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
                onDragStart={(e) => handlePointerDown(e, "box")}
                isDragging={isDragging && draggingTarget === "box"}
                customStyle={getBoxPositionStyle()}
                onOpenPalette={() => setPaletteOpen(!paletteOpen)}
              />
            </div>
          ) : (
            <div style={{ pointerEvents: "auto" }}>
              <DraggableGalleryToggle
                onMouseDown={(e) => handlePointerDown(e, "button")}
                onTouchStart={(e) => handlePointerDown(e, "button")}
                onClick={handleToggleClick}
                isDragging={isDragging && draggingTarget === "button"}
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
            position: "absolute",
            bottom: "20px",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 3,
            animation: "heroBounce 2s infinite",
            opacity: 0.7,
            pointerEvents: "none",
          }}
        >
          <ChevronDown size={26} color="#fff" />
        </div>
      )}
    </div>
  );
};

const GalleryInfoBox = ({
  al,
  alignment = "left",
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
        display: "flex",
        flexDirection: "column",
        ...al,
        width: "min(580px, calc(100vw - 48px))",
        maxWidth: "100%",
        minHeight: "290px",
        boxSizing: "border-box",
        padding: "28px 36px",
        borderRadius: "20px",
        background: "rgba(12, 12, 12, 0.7)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        border: "1px solid rgba(255, 255, 255, 0.16)",
        boxShadow: isDragging
          ? "0 25px 60px rgba(0, 0, 0, 0.7), 0 0 25px var(--g-accent-glow, var(--g-accent, rgba(16, 185, 129, 0.4)))"
          : "var(--g-shadow, 0 16px 45px rgba(0, 0, 0, 0.5))",
        animation: "fadeIn 0.25s ease",
        pointerEvents: "auto",
        color: "var(--g-text, var(--text-primary, #ffffff))",
        ...customStyle,
      }}
    >
      {/* Top Header Bar */}
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
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          width: "100%",
          marginBottom: "18px",
          paddingBottom: "10px",
          borderBottom: "1px solid var(--g-border, rgba(255, 255, 255, 0.08))",
          cursor: isDragging ? "grabbing" : "grab",
          userSelect: "none",
          touchAction: "none",
        }}
        title="Click and drag to move this gallery box anywhere"
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "5px",
            color: "var(--g-accent, #3b82f6)",
            fontSize: "0.72rem",
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            fontWeight: 800,
          }}
        >
          <GripVertical size={13} style={{ opacity: 0.8 }} />
          <span>Drag to move</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <button
            type="button"
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              onOpenPalette();
            }}
            title="Customize Gallery Colors"
            style={{
              width: "26px",
              height: "26px",
              borderRadius: "50%",
              background: "rgba(255, 255, 255, 0.1)",
              border: "1px solid var(--g-border, rgba(255, 255, 255, 0.2))",
              color: "var(--g-accent, #3b82f6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              padding: 0,
            }}
          >
            <Palette size={13} />
          </button>

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
              width: "26px",
              height: "26px",
              borderRadius: "50%",
              background: "rgba(255, 255, 255, 0.12)",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              color: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              padding: 0,
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
            display: "flex",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "6px",
            fontSize: "12px",
            color: "var(--g-text-muted, var(--text-secondary, #94a3b8))",
            marginBottom: "16px",
          }}
        >
          {breadcrumbs.map((crumb, idx) => (
            <React.Fragment key={idx}>
              {idx > 0 && <ChevronRight size={12} style={{ opacity: 0.5 }} />}
              {crumb.url ? (
                <Link
                  to={crumb.url}
                  style={{
                    color: "var(--g-text, var(--text-primary, #ffffff))",
                    textDecoration: "none",
                    fontWeight: 500,
                  }}
                >
                  {crumb.label}
                </Link>
              ) : (
                <span style={{ color: "var(--g-accent, #3b82f6)", fontWeight: 700 }}>
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
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            background: "var(--primary-subtle, rgba(59, 130, 246, 0.18))",
            border: "1px solid var(--g-accent, #3b82f6)",
            borderRadius: "999px",
            padding: "4px 14px",
            fontSize: "0.72rem",
            fontWeight: 700,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "var(--g-accent, #60a5fa)",
            marginBottom: "16px",
            width: "fit-content",
            maxWidth: "max-content",
            alignSelf:
              alignment === "center"
                ? "center"
                : alignment === "right"
                ? "flex-end"
                : "flex-start",
          }}
        >
          <Images size={13} />
          <span>{subheading}</span>
        </div>
      )}

      {/* Main Heading */}
      <h1
        style={{
          fontSize: (headingFontSize && headingFontSize !== "3rem" && headingFontSize !== "3.2rem") ? headingFontSize : "2rem",
          fontWeight: 900,
          lineHeight: 1.15,
          color: "#ffffff",
          margin: "0 0 16px",
          textShadow: "0 2px 14px rgba(0, 0, 0, 0.6)",
          letterSpacing: "-0.02em",
        }}
      >
        {heading}
      </h1>

      {/* Description */}
      {description && (
        <p
          style={{
            fontSize: descriptionFontSize || "1rem",
            color: "var(--g-text-muted, var(--text-secondary, #94a3b8))",
            margin: "0 0 24px",
            lineHeight: 1.68,
            maxWidth: "580px",
            textShadow: "0 1px 6px rgba(0, 0, 0, 0.5)",
          }}
        >
          {stripHtml(description)}
        </p>
      )}

      {/* Action Button */}
      {buttonText && (
        <a
          href={buttonUrl || "#albums"}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            background: "var(--primary-subtle, rgba(59, 130, 246, 0.15))",
            border: "1px solid var(--g-accent, #3b82f6)",
            color: "var(--g-accent, #ffffff)",
            padding: "12px 28px",
            borderRadius: "999px",
            fontWeight: 700,
            fontSize: "0.92rem",
            textDecoration: "none",
            boxShadow: "0 8px 24px var(--g-accent-glow, var(--g-accent, rgba(16, 185, 129, 0.4)))",
            transition: "all 0.2s ease",
          }}
        >
          <Images size={16} />
          {buttonText}
        </a>
      )}
    </div>
  );
};

const DraggableGalleryToggle = ({ onMouseDown, onTouchStart, onClick, isDragging, customPos }) => {
  return (
    <button
      type="button"
      onMouseDown={onMouseDown}
      onTouchStart={onTouchStart}
      onClick={onClick}
      aria-label="Drag to move, click to show gallery info"
      title="Drag anywhere on banner, click to show info right there"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "8px",
        padding: "9px 18px",
        fontSize: "0.82rem",
        fontWeight: 700,
        letterSpacing: "0.02em",
        color: "var(--g-text, var(--text-primary, #ffffff))",
        background: isDragging
          ? "var(--g-accent, #3b82f6)"
          : "var(--g-surface, #09221f)",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        border: "1px solid var(--g-border, var(--g-accent, rgba(16, 185, 129, 0.4)))",
        borderRadius: "999px",
        cursor: isDragging ? "grabbing" : "grab",
        boxShadow: isDragging
          ? "0 14px 34px var(--g-accent-glow, var(--g-accent, rgba(16, 185, 129, 0.6)))"
          : "0 8px 24px rgba(0, 0, 0, 0.5)",
        transition: isDragging ? "none" : "all 0.2s ease",
        userSelect: "none",
        touchAction: "none",
        ...(customPos
          ? {
              position: "absolute",
              left: `${customPos.x}px`,
              top: `${customPos.y}px`,
              zIndex: 30,
            }
          : {
              position: "relative",
              zIndex: 30,
            }),
      }}
    >
      <GripVertical size={13} style={{ opacity: 0.7 }} />
      <Eye size={14} color="var(--g-accent, #3b82f6)" />
      <span>Show Gallery Info</span>
    </button>
  );
};

export default GalleryHeroBanner;

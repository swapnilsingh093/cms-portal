import React, { useState, useEffect, useRef } from "react";
import {
  X,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize,
  Minimize,
  Download,
  Play,
  Pause,
  Image as ImageIcon
} from "lucide-react";

const GalleryLightboxModal = ({
  isOpen = false,
  onClose,
  images = [],
  initialIndex = 0,
  albumTitle = "",
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
      setZoomLevel(1);
      setIsPlaying(false);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      setIsPlaying(false);
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen, initialIndex]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowLeft") handlePrev();
      else if (e.key === "ArrowRight") handleNext();
      else if (e.key === " ") {
        e.preventDefault();
        setIsPlaying((p) => !p);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, currentIndex, images.length]);

  // Slideshow timer
  useEffect(() => {
    if (!isOpen || !isPlaying || images.length <= 1) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
      setZoomLevel(1);
    }, 3500);

    return () => clearInterval(timer);
  }, [isOpen, isPlaying, images.length]);

  if (!isOpen || images.length === 0) return null;

  const currentImage = images[currentIndex];
  const imageUrl = currentImage?.url
    ? currentImage.url.startsWith("http")
      ? currentImage.url
      : `http://localhost:5001${currentImage.url}`
    : "";

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
    setZoomLevel(1);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
    setZoomLevel(1);
  };

  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(prev + 0.4, 3));
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(prev - 0.4, 1));
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      if (containerRef.current?.requestFullscreen) {
        containerRef.current.requestFullscreen();
        setIsFullscreen(true);
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  const handleDownload = () => {
    if (!imageUrl) return;
    const a = document.createElement("a");
    a.href = imageUrl;
    a.download = currentImage?.title || `photo-${currentIndex + 1}.jpg`;
    a.target = "_blank";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div
      ref={containerRef}
      role="dialog"
      aria-modal="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "rgba(3, 7, 18, 0.96)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        userSelect: "none",
        animation: "fadeIn 0.2s ease-out",
      }}
    >
      {/* Top Bar: Title, Counter & Action Controls */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px 24px",
          background: "linear-gradient(180deg, rgba(0,0,0,0.85) 0%, transparent 100%)",
          zIndex: 10,
          color: "#fff",
        }}
      >
        {/* Left: Album Name & Photo Counter */}
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <div
            style={{
              padding: "4px 12px",
              background: "var(--g-accent, #10b981)",
              color: "var(--g-accent-text, #ffffff)",
              borderRadius: "999px",
              fontSize: "0.78rem",
              fontWeight: 800,
              letterSpacing: "0.04em",
            }}
          >
            {currentIndex + 1} / {images.length}
          </div>
          {albumTitle && (
            <div
              style={{
                fontSize: "0.95rem",
                fontWeight: 700,
                color: "#f8fafc",
                maxWidth: "400px",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {albumTitle}
            </div>
          )}
        </div>

        {/* Right: Controls */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {/* Slideshow button */}
          {images.length > 1 && (
            <button
              type="button"
              onClick={() => setIsPlaying((p) => !p)}
              style={controlBtnStyle}
              title={isPlaying ? "Pause Slideshow (Space)" : "Play Slideshow (Space)"}
            >
              {isPlaying ? <Pause size={17} /> : <Play size={17} />}
            </button>
          )}

          {/* Zoom Out */}
          <button
            type="button"
            onClick={handleZoomOut}
            disabled={zoomLevel <= 1}
            style={{ ...controlBtnStyle, opacity: zoomLevel <= 1 ? 0.4 : 1 }}
            title="Zoom Out"
          >
            <ZoomOut size={17} />
          </button>

          {/* Zoom In */}
          <button
            type="button"
            onClick={handleZoomIn}
            disabled={zoomLevel >= 3}
            style={{ ...controlBtnStyle, opacity: zoomLevel >= 3 ? 0.4 : 1 }}
            title="Zoom In"
          >
            <ZoomIn size={17} />
          </button>

          {/* Fullscreen */}
          <button
            type="button"
            onClick={toggleFullscreen}
            style={controlBtnStyle}
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? <Minimize size={17} /> : <Maximize size={17} />}
          </button>

          {/* Download */}
          <button
            type="button"
            onClick={handleDownload}
            style={controlBtnStyle}
            title="Download Original Photo"
          >
            <Download size={17} />
          </button>

          {/* Close */}
          <button
            type="button"
            onClick={onClose}
            style={{ ...controlBtnStyle, background: "rgba(239, 68, 68, 0.25)", borderColor: "rgba(239, 68, 68, 0.5)" }}
            title="Close Lightbox (Esc)"
          >
            <X size={18} color="#fff" />
          </button>
        </div>
      </div>

      {/* Main Image Stage - STRICTLY ZERO CROPPING (object-fit: contain) */}
      <div
        style={{
          position: "relative",
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          padding: "10px 40px",
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        {/* Navigation Arrow: Previous */}
        {images.length > 1 && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handlePrev();
            }}
            style={{
              position: "absolute",
              left: "20px",
              zIndex: 20,
              width: "48px",
              height: "48px",
              borderRadius: "50%",
              background: "rgba(15, 23, 42, 0.75)",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              color: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              backdropFilter: "blur(10px)",
              transition: "all 0.2s ease",
            }}
            title="Previous (Arrow Left)"
            onMouseEnter={(e) => (e.currentTarget.style.background = "var(--g-accent, #10b981)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(15, 23, 42, 0.75)")}
          >
            <ChevronLeft size={26} />
          </button>
        )}

        {/* High-Resolution Photo Display - 100% Complete Aspect Ratio Preserved */}
        <div
          style={{
            position: "relative",
            maxWidth: "100%",
            maxHeight: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "transform 0.2s ease-out",
            transform: `scale(${zoomLevel})`,
            cursor: zoomLevel > 1 ? "zoom-out" : "default",
          }}
          onClick={() => {
            if (zoomLevel > 1) setZoomLevel(1);
          }}
        >
          <img
            src={imageUrl}
            alt={currentImage?.title || currentImage?.caption || `Gallery photo ${currentIndex + 1}`}
            style={{
              maxWidth: "calc(100vw - 120px)",
              maxHeight: "calc(100vh - 190px)",
              width: "auto",
              height: "auto",
              objectFit: "contain",
              borderRadius: "10px",
              boxShadow: "0 25px 60px rgba(0, 0, 0, 0.8)",
              pointerEvents: "auto",
            }}
          />
        </div>

        {/* Navigation Arrow: Next */}
        {images.length > 1 && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleNext();
            }}
            style={{
              position: "absolute",
              right: "20px",
              zIndex: 20,
              width: "48px",
              height: "48px",
              borderRadius: "50%",
              background: "rgba(15, 23, 42, 0.75)",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              color: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              backdropFilter: "blur(10px)",
              transition: "all 0.2s ease",
            }}
            title="Next (Arrow Right)"
            onMouseEnter={(e) => (e.currentTarget.style.background = "var(--g-accent, #10b981)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(15, 23, 42, 0.75)")}
          >
            <ChevronRight size={26} />
          </button>
        )}
      </div>

      {/* Bottom Area: Caption & Thumbnail Filmstrip */}
      <div
        style={{
          background: "linear-gradient(0deg, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.7) 70%, transparent 100%)",
          padding: "10px 24px 18px",
          display: "flex",
          flexDirection: "column",
          gap: "8px",
          alignItems: "center",
          zIndex: 10,
        }}
      >
        {/* Caption */}
        {(currentImage?.title || currentImage?.caption) && (
          <div
            style={{
              textAlign: "center",
              maxWidth: "700px",
              color: "#f1f5f9",
              fontSize: "0.9rem",
              lineHeight: 1.4,
              textShadow: "0 2px 8px rgba(0,0,0,0.8)",
            }}
          >
            {currentImage.title && <strong style={{ color: "var(--g-accent, #10b981)" }}>{currentImage.title} </strong>}
            {currentImage.caption && <span>{currentImage.caption}</span>}
          </div>
        )}

        {/* Thumbnail Filmstrip */}
        {images.length > 1 && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              maxWidth: "100%",
              overflowX: "auto",
              padding: "4px 8px",
              scrollbarWidth: "none",
            }}
          >
            {images.map((img, idx) => {
              const thumbUrl = img.url?.startsWith("http") ? img.url : `http://localhost:5001${img.url}`;
              const isActive = idx === currentIndex;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setCurrentIndex(idx);
                    setZoomLevel(1);
                  }}
                  style={{
                    position: "relative",
                    width: "52px",
                    height: "38px",
                    borderRadius: "6px",
                    overflow: "hidden",
                    border: isActive ? "2px solid var(--g-accent, #10b981)" : "1px solid rgba(255, 255, 255, 0.2)",
                    background: "#000",
                    cursor: "pointer",
                    padding: 0,
                    opacity: isActive ? 1 : 0.6,
                    transform: isActive ? "scale(1.1)" : "scale(1)",
                    transition: "all 0.15s ease",
                    flexShrink: 0,
                  }}
                >
                  <img
                    src={thumbUrl}
                    alt=""
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

const controlBtnStyle = {
  width: "36px",
  height: "36px",
  borderRadius: "50%",
  background: "rgba(255, 255, 255, 0.1)",
  border: "1px solid rgba(255, 255, 255, 0.18)",
  color: "#ffffff",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  backdropFilter: "blur(8px)",
  transition: "all 0.15s ease",
};

export default GalleryLightboxModal;

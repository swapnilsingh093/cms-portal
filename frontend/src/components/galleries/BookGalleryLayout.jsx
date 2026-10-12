import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import "./BookGalleryLayout.css";
import {
  X,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Layers,
  ZoomIn,
  Bookmark,
  Calendar,
  User,
  Eye,
  Grid,
  Image as ImageIcon,
  Check
} from "lucide-react";

/**
 * Format image URL helper
 */
const getMediaUrl = (url) => {
  if (!url) return "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  const baseUrl = (import.meta.env.VITE_API_URL || "http://localhost:5001/api").replace(/\/api\/?$/, "");
  return `${baseUrl}${url.startsWith("/") ? "" : "/"}${url}`;
};

/**
 * Photorealistic Spiral Coil Wire Binding (matches spiral notebook look)
 */
function SpiralCoilBinding({ height = 620 }) {
  const pitch = 22; // Distance between each coil ring in px
  const ringCount = Math.max(12, Math.floor((height - 30) / pitch));
  const rings = Array.from({ length: ringCount });

  return (
    <div className="book-spiral-binding" aria-hidden="true">
      <div className="book-spiral-shadow" />
      <svg
        width="34"
        height={height}
        viewBox={`0 0 34 ${height}`}
        className="book-spiral-svg"
      >
        <defs>
          <linearGradient id="spiralGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#94a3b8" />
            <stop offset="25%" stopColor="#1e293b" />
            <stop offset="50%" stopColor="#e2e8f0" />
            <stop offset="75%" stopColor="#0f172a" />
            <stop offset="100%" stopColor="#020617" />
          </linearGradient>
          <radialGradient id="holeGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#020617" />
            <stop offset="80%" stopColor="#0f172a" />
            <stop offset="100%" stopColor="#334155" />
          </radialGradient>
        </defs>

        {rings.map((_, idx) => {
          const y = 18 + idx * pitch;
          return (
            <g key={idx}>
              {/* Left page punched hole */}
              <rect x="5" y={y + 1} width="5" height="9" rx="2.5" fill="url(#holeGrad)" />
              {/* Right page punched hole */}
              <rect x="24" y={y + 1} width="5" height="9" rx="2.5" fill="url(#holeGrad)" />

              {/* Rear loop */}
              <path
                d={`M 8 ${y + 8} C 12 ${y + 12}, 22 ${y + 12}, 26 ${y + 8}`}
                fill="none"
                stroke="#0f172a"
                strokeWidth="2.5"
                opacity="0.8"
              />

              {/* Front loop across spine */}
              <path
                d={`M 7 ${y + 5} C 11 ${y - 4}, 23 ${y - 4}, 27 ${y + 5}`}
                fill="none"
                stroke="url(#spiralGrad)"
                strokeWidth="3.2"
                strokeLinecap="round"
              />
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/**
 * Modern High-Performance Photobook Modal
 */
const BookGalleryLayout = ({ gallery, onClose }) => {
  const [currentSpreadIndex, setCurrentSpreadIndex] = useState(0);
  const [bindingType, setBindingType] = useState("hardcover"); // "hardcover" | "spiral"
  const [viewMode, setViewMode] = useState("spread"); // "spread" | "single"
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [autoPlay, setAutoPlay] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [filmstripOpen, setFilmstripOpen] = useState(false);
  const [lightboxPhoto, setLightboxPhoto] = useState(null);
  const [isFlipping, setIsFlipping] = useState(null); // 'next' | 'prev' | null

  const modalContainerRef = useRef(null);
  const audioContextRef = useRef(null);
  const autoPlayTimerRef = useRef(null);

  // Photos array
  const photos = useMemo(() => {
    if (!gallery || !Array.isArray(gallery.images)) return [];
    return gallery.images.filter((img) => img && (img.url || img.secure_url));
  }, [gallery]);

  // Lock body scroll while popup is open
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  // Detect screen size: Auto single page on small devices
  useEffect(() => {
    const checkWidth = () => {
      if (window.innerWidth < 860) {
        setViewMode("single");
      }
    };
    checkWidth();
    window.addEventListener("resize", checkWidth);
    return () => window.removeEventListener("resize", checkWidth);
  }, []);

  // Web Audio synthetic crisp paper rustle sound
  const playPageTurnSound = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioCtx();
      }
      const ctx = audioContextRef.current;
      if (ctx.state === "suspended") ctx.resume();

      const duration = 0.18;
      const bufferSize = ctx.sampleRate * duration;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);

      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        lastOut = (lastOut + 0.02 * white) / 1.02;
        const decay = Math.pow(1 - i / bufferSize, 2.5);
        data[i] = lastOut * decay * 1.6;
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(1400, ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(320, ctx.currentTime + duration);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.35, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.005, ctx.currentTime + duration);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      noise.start();
    } catch {
      // Audio autoplay policy fallback
    }
  }, [soundEnabled]);

  /**
   * Curate gallery photos into designed 2-Page Spreads
   */
  const spreads = useMemo(() => {
    const list = [];
    const totalPhotos = photos.length;

    // Spread 0: Hardcover Cover & Title Plate
    list.push({
      id: "cover",
      type: "cover_spread",
      title: "Hardcover Cover & Title Plate",
      leftPage: {
        type: "inside_front_cover",
        galleryTitle: gallery?.title || "Photo Gallery",
        category: gallery?.category?.name || "Editorial Collection",
        date: gallery?.createdAt ? new Date(gallery.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "Recent",
        photographer: gallery?.author?.name || "Curator's Pick",
        photoCount: totalPhotos,
        description: gallery?.description || "An exclusive photobook showcase."
      },
      rightPage: {
        type: "cover_showcase",
        coverImage: getMediaUrl(gallery?.coverImage || gallery?.banner || photos[0]?.url),
        galleryTitle: gallery?.title || "Photo Gallery",
        subtitle: "Fine Art Photography Collection"
      }
    });

    let photoIdx = 0;
    let spreadCount = 1;
    let pageNum = 1;

    // Cycle through editorial layout pairings
    const layoutPairings = [
      { left: "hero_framed", right: "dual_stacked" },
      { left: "polaroid_duo", right: "editorial_story" },
      { left: "passepartout_minimal", right: "hero_bleed" },
      { left: "triptych_mosaic", right: "quote_portrait" },
      { left: "dual_stacked", right: "passepartout_minimal" }
    ];

    while (photoIdx < totalPhotos) {
      const pairing = layoutPairings[(spreadCount - 1) % layoutPairings.length];
      const remaining = totalPhotos - photoIdx;

      let leftPhotos = [];
      let rightPhotos = [];

      // Determine left page photos
      if (pairing.left === "hero_framed" || pairing.left === "passepartout_minimal") {
        if (remaining >= 1) leftPhotos.push(photos[photoIdx++]);
      } else if (pairing.left === "polaroid_duo" || pairing.left === "dual_stacked") {
        if (photoIdx < totalPhotos) leftPhotos.push(photos[photoIdx++]);
        if (photoIdx < totalPhotos) leftPhotos.push(photos[photoIdx++]);
      } else if (pairing.left === "triptych_mosaic") {
        if (photoIdx < totalPhotos) leftPhotos.push(photos[photoIdx++]);
        if (photoIdx < totalPhotos) leftPhotos.push(photos[photoIdx++]);
        if (photoIdx < totalPhotos) leftPhotos.push(photos[photoIdx++]);
      } else {
        if (photoIdx < totalPhotos) leftPhotos.push(photos[photoIdx++]);
      }

      // Determine right page photos
      if (photoIdx < totalPhotos) {
        if (pairing.right === "hero_bleed" || pairing.right === "editorial_story" || pairing.right === "quote_portrait") {
          rightPhotos.push(photos[photoIdx++]);
        } else if (pairing.right === "dual_stacked") {
          rightPhotos.push(photos[photoIdx++]);
          if (photoIdx < totalPhotos) rightPhotos.push(photos[photoIdx++]);
        } else if (pairing.right === "passepartout_minimal") {
          rightPhotos.push(photos[photoIdx++]);
        } else {
          rightPhotos.push(photos[photoIdx++]);
        }
      }

      list.push({
        id: `spread_${spreadCount}`,
        type: "content_spread",
        title: `Pages ${pageNum} & ${pageNum + 1}`,
        leftPage: {
          type: pairing.left,
          photos: leftPhotos,
          pageNumber: pageNum++
        },
        rightPage: rightPhotos.length > 0 ? {
          type: pairing.right,
          photos: rightPhotos,
          pageNumber: pageNum++
        } : {
          type: "minimal_plate",
          pageNumber: pageNum++
        }
      });

      spreadCount++;
    }

    // Final Spread: Epilogue & Back Cover
    list.push({
      id: "epilogue",
      type: "epilogue_spread",
      title: "Colophon & Back Cover",
      leftPage: {
        type: "colophon",
        pageNumber: pageNum++,
        galleryTitle: gallery?.title || "Photo Gallery",
        photoCount: totalPhotos,
        photographer: gallery?.author?.name || "Featured Artist",
        curator: "CMS Portal Photobook Studio"
      },
      rightPage: {
        type: "back_cover",
        galleryTitle: gallery?.title || "Photo Gallery",
        coverImage: getMediaUrl(gallery?.coverImage || photos[0]?.url)
      }
    });

    return list;
  }, [gallery, photos]);

  const totalSpreads = spreads.length;
  const currentSpread = spreads[currentSpreadIndex] || spreads[0];

  // Navigation handlers
  const goToNextSpread = useCallback(() => {
    if (isFlipping) return;
    if (currentSpreadIndex < totalSpreads - 1) {
      playPageTurnSound();
      setIsFlipping("next");
      setTimeout(() => {
        setCurrentSpreadIndex((prev) => prev + 1);
        setIsFlipping(null);
      }, 320);
    }
  }, [currentSpreadIndex, totalSpreads, isFlipping, playPageTurnSound]);

  const goToPrevSpread = useCallback(() => {
    if (isFlipping) return;
    if (currentSpreadIndex > 0) {
      playPageTurnSound();
      setIsFlipping("prev");
      setTimeout(() => {
        setCurrentSpreadIndex((prev) => prev - 1);
        setIsFlipping(null);
      }, 320);
    }
  }, [currentSpreadIndex, isFlipping, playPageTurnSound]);

  const jumpToSpread = useCallback(
    (index) => {
      if (index === currentSpreadIndex || isFlipping) return;
      playPageTurnSound();
      setIsFlipping(index > currentSpreadIndex ? "next" : "prev");
      setTimeout(() => {
        setCurrentSpreadIndex(index);
        setIsFlipping(null);
      }, 280);
    },
    [currentSpreadIndex, isFlipping, playPageTurnSound]
  );

  // Autoplay Slideshow Timer
  useEffect(() => {
    if (autoPlayTimerRef.current) clearInterval(autoPlayTimerRef.current);
    if (autoPlay) {
      autoPlayTimerRef.current = setInterval(() => {
        setCurrentSpreadIndex((prev) => {
          if (prev < totalSpreads - 1) {
            playPageTurnSound();
            return prev + 1;
          } else {
            setAutoPlay(false);
            return prev;
          }
        });
      }, 5000);
    }
    return () => {
      if (autoPlayTimerRef.current) clearInterval(autoPlayTimerRef.current);
    };
  }, [autoPlay, totalSpreads, playPageTurnSound]);

  // Keyboard navigation & ESC handler
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "ArrowRight") goToNextSpread();
      if (e.key === "ArrowLeft") goToPrevSpread();
      if (e.key === " " && !lightboxPhoto) {
        e.preventDefault();
        setAutoPlay((prev) => !prev);
      }
      if (e.key === "Escape") {
        if (lightboxPhoto) {
          setLightboxPhoto(null);
        } else if (filmstripOpen) {
          setFilmstripOpen(false);
        } else {
          onClose?.();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goToNextSpread, goToPrevSpread, lightboxPhoto, filmstripOpen, onClose]);

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      modalContainerRef.current?.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  };

  /**
   * Render individual page types cleanly
   */
  const renderPage = (pageData, side = "left") => {
    if (!pageData) return null;

    // 1. Cover Inside Front Plate (Colophon / Intro)
    if (pageData.type === "inside_front_cover") {
      return (
        <div className="artisan-page-content inside-cover-plate">
          <div className="plate-watermark">ARCHIVAL EDITION</div>
          <div className="plate-header">
            <span className="plate-badge">EDITORIAL COLLECTION</span>
            <h2 className="plate-title">{pageData.galleryTitle}</h2>
            <div className="plate-divider" />
          </div>

          <div
            className="plate-description"
            dangerouslySetInnerHTML={{
              __html: typeof pageData.description === "string" && pageData.description.trim().length > 0
                ? pageData.description
                : `<p>A curated photographic collection featuring ${pageData.photoCount} visual works. Bound and presented in high fidelity.</p>`
            }}
          />

          <div className="plate-meta-grid">
            <div className="plate-meta-item">
              <span className="meta-label">Total Photographs</span>
              <span className="meta-value">{pageData.photoCount} Fine Art Plates</span>
            </div>
            <div className="plate-meta-item">
              <span className="meta-label">Curator</span>
              <span className="meta-value">{pageData.photographer}</span>
            </div>
            <div className="plate-meta-item">
              <span className="meta-label">Date Published</span>
              <span className="meta-value">{pageData.date}</span>
            </div>
            <div className="plate-meta-item">
              <span className="meta-label">Binding Style</span>
              <span className="meta-value">Hardcover Archival</span>
            </div>
          </div>

          <div className="plate-footer">
            <div className="plate-stamp">
              <Sparkles size={14} /> CERTIFIED EXHIBITION
            </div>
            <span className="plate-turn-hint">Turn right to open album →</span>
          </div>
        </div>
      );
    }

    // 2. Cover Front Title Showcase
    if (pageData.type === "cover_showcase") {
      return (
        <div className="artisan-page-content cover-showcase-plate">
          <div className="cover-frame-box">
            <div className="cover-gold-border" />
            <div className="cover-image-container">
              <img
                src={pageData.coverImage}
                alt={pageData.galleryTitle}
                className="cover-hero-img"
              />
              <div className="cover-img-glare" />
            </div>
          </div>
          <div className="cover-typography">
            <span className="cover-series-tag">PORTFOLIO EDITION</span>
            <h1 className="cover-main-title">{pageData.galleryTitle}</h1>
            <p className="cover-subtitle">{pageData.subtitle}</p>
            <button
              className="cover-open-btn"
              onClick={goToNextSpread}
            >
              <span>Explore Photobook</span>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      );
    }

    // 3. Hero Framed Photo (Museum Passe-partout style)
    if (pageData.type === "hero_framed" || pageData.type === "passepartout_minimal") {
      const p = pageData.photos?.[0];
      return (
        <div className="artisan-page-content framed-photo-plate">
          <div className="photo-matte-frame">
            {p && (
              <div
                className="framed-image-wrapper"
                onClick={() => setLightboxPhoto(p)}
                title="Click to view in high resolution"
              >
                <img
                  src={getMediaUrl(p.url)}
                  alt={p.title || "Gallery Photo"}
                  className="matte-img"
                  loading="lazy"
                />
                <button className="photo-zoom-icon" aria-label="Zoom photo">
                  <ZoomIn size={14} />
                </button>
              </div>
            )}
            <div className="matte-caption">
              <span className="matte-title">{p?.title || gallery?.title || "Exhibition Print"}</span>
              {p?.caption && <span className="matte-desc">{p.caption}</span>}
            </div>
          </div>
          <div className={`page-number-tag ${side}`}>
            {pageData.pageNumber}
          </div>
        </div>
      );
    }

    // 4. Hero Bleed (Full Page Immersion)
    if (pageData.type === "hero_bleed") {
      const p = pageData.photos?.[0];
      return (
        <div className="artisan-page-content hero-bleed-plate">
          {p && (
            <div
              className="bleed-image-wrapper"
              onClick={() => setLightboxPhoto(p)}
            >
              <img
                src={getMediaUrl(p.url)}
                alt={p.title || "Gallery Photo"}
                className="bleed-img"
                loading="lazy"
              />
              <div className="bleed-gradient-overlay" />
              <div className="bleed-caption-box">
                <span className="bleed-badge">MASTER PRINT</span>
                <h3 className="bleed-photo-title">{p.title || "Featured Frame"}</h3>
                {p.caption && <p className="bleed-photo-desc">{p.caption}</p>}
              </div>
              <button className="photo-zoom-icon" aria-label="Zoom photo">
                <ZoomIn size={14} />
              </button>
            </div>
          )}
          <div className={`page-number-tag light-tag ${side}`}>
            {pageData.pageNumber}
          </div>
        </div>
      );
    }

    // 5. Dual Stacked Photos
    if (pageData.type === "dual_stacked") {
      const [p1, p2] = pageData.photos || [];
      return (
        <div className="artisan-page-content dual-stacked-plate">
          {p1 && (
            <div
              className="dual-item-box"
              onClick={() => setLightboxPhoto(p1)}
            >
              <div className="dual-img-crop">
                <img src={getMediaUrl(p1.url)} alt={p1.title || "Photo"} loading="lazy" />
                <button className="photo-zoom-icon"><ZoomIn size={12} /></button>
              </div>
              {p1.title && <span className="dual-item-title">{p1.title}</span>}
            </div>
          )}
          {p2 && (
            <div
              className="dual-item-box"
              onClick={() => setLightboxPhoto(p2)}
            >
              <div className="dual-img-crop">
                <img src={getMediaUrl(p2.url)} alt={p2.title || "Photo"} loading="lazy" />
                <button className="photo-zoom-icon"><ZoomIn size={12} /></button>
              </div>
              {p2.title && <span className="dual-item-title">{p2.title}</span>}
            </div>
          )}
          <div className={`page-number-tag ${side}`}>
            {pageData.pageNumber}
          </div>
        </div>
      );
    }

    // 6. Vintage Polaroid Keepsake Duo
    if (pageData.type === "polaroid_duo") {
      const [p1, p2] = pageData.photos || [];
      return (
        <div className="artisan-page-content polaroids-plate">
          {p1 && (
            <div
              className="polaroid-card polaroid-left"
              onClick={() => setLightboxPhoto(p1)}
            >
              <div className="polaroid-tape" />
              <div className="polaroid-frame">
                <img src={getMediaUrl(p1.url)} alt={p1.title || "Polaroid"} loading="lazy" />
              </div>
              <span className="polaroid-caption">{p1.title || "Capture • 01"}</span>
            </div>
          )}
          {p2 && (
            <div
              className="polaroid-card polaroid-right"
              onClick={() => setLightboxPhoto(p2)}
            >
              <div className="polaroid-tape" />
              <div className="polaroid-frame">
                <img src={getMediaUrl(p2.url)} alt={p2.title || "Polaroid"} loading="lazy" />
              </div>
              <span className="polaroid-caption">{p2.title || "Capture • 02"}</span>
            </div>
          )}
          <div className={`page-number-tag ${side}`}>
            {pageData.pageNumber}
          </div>
        </div>
      );
    }

    // 7. Editorial Story / Portrait with Quote
    if (pageData.type === "editorial_story" || pageData.type === "quote_portrait") {
      const p = pageData.photos?.[0];
      return (
        <div className="artisan-page-content editorial-plate">
          {p && (
            <div
              className="editorial-photo-box"
              onClick={() => setLightboxPhoto(p)}
            >
              <img src={getMediaUrl(p.url)} alt={p.title || "Photo"} loading="lazy" />
              <button className="photo-zoom-icon"><ZoomIn size={14} /></button>
            </div>
          )}
          <div className="editorial-text-box">
            <blockquote className="editorial-quote">
              "{p?.caption || p?.title || "Photography is the story I fail to put into words."}"
            </blockquote>
            <div className="editorial-byline">
              <span className="byline-name">{gallery?.author?.name || "The Artist"}</span>
              <span className="byline-role">Visual Chronicle</span>
            </div>
          </div>
          <div className={`page-number-tag ${side}`}>
            {pageData.pageNumber}
          </div>
        </div>
      );
    }

    // 8. Triptych Mosaic
    if (pageData.type === "triptych_mosaic") {
      const [p1, p2, p3] = pageData.photos || [];
      return (
        <div className="artisan-page-content triptych-plate">
          <div className="triptych-grid">
            {p1 && (
              <div className="trip-cell cell-tall" onClick={() => setLightboxPhoto(p1)}>
                <img src={getMediaUrl(p1.url)} alt={p1.title || "Photo"} loading="lazy" />
                <button className="photo-zoom-icon"><ZoomIn size={12} /></button>
              </div>
            )}
            <div className="trip-column">
              {p2 && (
                <div className="trip-cell cell-stacked" onClick={() => setLightboxPhoto(p2)}>
                  <img src={getMediaUrl(p2.url)} alt={p2.title || "Photo"} loading="lazy" />
                  <button className="photo-zoom-icon"><ZoomIn size={12} /></button>
                </div>
              )}
              {p3 && (
                <div className="trip-cell cell-stacked" onClick={() => setLightboxPhoto(p3)}>
                  <img src={getMediaUrl(p3.url)} alt={p3.title || "Photo"} loading="lazy" />
                  <button className="photo-zoom-icon"><ZoomIn size={12} /></button>
                </div>
              )}
            </div>
          </div>
          <div className={`page-number-tag ${side}`}>
            {pageData.pageNumber}
          </div>
        </div>
      );
    }

    // 9. Colophon / Epilogue Plate
    if (pageData.type === "colophon") {
      return (
        <div className="artisan-page-content colophon-plate">
          <div className="colophon-seal">
            <BookOpen size={28} />
          </div>
          <h2 className="colophon-title">End of Album</h2>
          <p className="colophon-subtitle">{pageData.galleryTitle}</p>
          <div className="colophon-divider" />

          <div className="colophon-details">
            <p>
              This collection has presented <strong>{pageData.photoCount} fine-art photographs</strong> curated
              for immersive high-definition viewing.
            </p>
            <p>
              Curated by <strong>{pageData.photographer}</strong> • Published by {pageData.curator}.
            </p>
          </div>

          <div className="colophon-actions">
            <button
              className="colophon-btn replay-btn"
              onClick={() => jumpToSpread(0)}
            >
              <RotateCcw size={15} /> Replay Album
            </button>
            <button
              className="colophon-btn exit-btn"
              onClick={onClose}
            >
              Return to Gallery
            </button>
          </div>

          <div className={`page-number-tag ${side}`}>
            {pageData.pageNumber}
          </div>
        </div>
      );
    }

    // 10. Back Cover Plate
    if (pageData.type === "back_cover") {
      return (
        <div className="artisan-page-content back-cover-plate">
          <div className="back-cover-emboss">
            <div className="back-cover-logo">
              <Sparkles size={32} />
            </div>
            <h3 className="back-cover-title">{pageData.galleryTitle}</h3>
            <span className="back-cover-edition">LIMITED ARCHIVAL PORTFOLIO</span>
            <div className="back-cover-barcode">
              <div className="barcode-lines" />
              <span className="barcode-num">CMS-PHOTO-ALBUM-2026</span>
            </div>
          </div>
        </div>
      );
    }

    // Default Fallback
    return (
      <div className="artisan-page-content minimal-plate">
        <div className={`page-number-tag ${side}`}>
          {pageData.pageNumber || ""}
        </div>
      </div>
    );
  };

  return (
    <div
      className="artisan-book-modal-backdrop"
      ref={modalContainerRef}
      role="dialog"
      aria-modal="true"
      aria-label="Interactive Photobook Modal"
    >
      {/* Ambient background lighting glow */}
      <div className="artisan-ambient-glow" />

      {/* TOP HEADER CONTROLS */}
      <header className="artisan-book-topbar">
        {/* Left: Gallery Title & Progress */}
        <div className="topbar-left">
          <div className="topbar-book-icon">
            <BookOpen size={20} />
          </div>
          <div className="topbar-info">
            <h2 className="topbar-gallery-title" title={gallery?.title}>
              {gallery?.title || "Photo Gallery Album"}
            </h2>
            <div className="topbar-meta-tags">
              <span className="meta-pill">
                Spread {currentSpreadIndex + 1} of {totalSpreads}
              </span>
              <span className="meta-pill photos-count">
                {photos.length} Photographs
              </span>
            </div>
          </div>
        </div>

        {/* Center: Quick Progress Bar & Binding Switcher */}
        <div className="topbar-center">
          <div className="binding-toggle-group" title="Switch Book Binding Style">
            <button
              className={`binding-btn ${bindingType === "hardcover" ? "active" : ""}`}
              onClick={() => setBindingType("hardcover")}
            >
              Hardcover
            </button>
            <button
              className={`binding-btn ${bindingType === "spiral" ? "active" : ""}`}
              onClick={() => setBindingType("spiral")}
            >
              Spiral Wire
            </button>
          </div>

          <div
            className="spread-progress-bar-wrap"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const pct = (e.clientX - rect.left) / rect.width;
              const target = Math.min(totalSpreads - 1, Math.max(0, Math.floor(pct * totalSpreads)));
              jumpToSpread(target);
            }}
            title="Click along the timeline to jump to spread"
          >
            <div
              className="spread-progress-bar-fill"
              style={{ width: `${((currentSpreadIndex + 1) / totalSpreads) * 100}%` }}
            />
          </div>
        </div>

        {/* Right: Controls & Exit Button */}
        <div className="topbar-right">
          {/* Autoplay Slideshow */}
          <button
            className={`tool-icon-btn ${autoPlay ? "active" : ""}`}
            onClick={() => setAutoPlay((prev) => !prev)}
            title={autoPlay ? "Pause Slideshow [Space]" : "Auto Play Slideshow [Space]"}
          >
            {autoPlay ? <Pause size={18} /> : <Play size={18} />}
          </button>

          {/* Sound Toggle */}
          <button
            className={`tool-icon-btn ${soundEnabled ? "active" : ""}`}
            onClick={() => setSoundEnabled((prev) => !prev)}
            title={soundEnabled ? "Mute Page Flip Sound" : "Enable Page Flip Sound"}
          >
            {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
          </button>

          {/* Thumbnails Filmstrip Drawer */}
          <button
            className={`tool-icon-btn ${filmstripOpen ? "active" : ""}`}
            onClick={() => setFilmstripOpen((prev) => !prev)}
            title="Show All Spreads (Filmstrip)"
          >
            <Grid size={18} />
          </button>

          {/* Fullscreen Toggle */}
          <button
            className="tool-icon-btn"
            onClick={toggleFullscreen}
            title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
          >
            {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
          </button>

          {/* Prominent Close Button */}
          <button
            className="book-close-prominent-btn"
            onClick={onClose}
            title="Exit Photobook [Esc]"
          >
            <span>Close</span>
            <X size={18} />
          </button>
        </div>
      </header>

      {/* MAIN BOOK STAGE */}
      <main className="artisan-book-stage">
        {/* Floating Prev Button */}
        <button
          className={`book-nav-arrow arrow-left ${currentSpreadIndex === 0 ? "disabled" : ""}`}
          onClick={goToPrevSpread}
          disabled={currentSpreadIndex === 0}
          aria-label="Previous Page"
          title="Previous Page (Left Arrow)"
        >
          <ChevronLeft size={28} />
        </button>

        {/* Floating Next Button */}
        <button
          className={`book-nav-arrow arrow-right ${currentSpreadIndex === totalSpreads - 1 ? "disabled" : ""}`}
          onClick={goToNextSpread}
          disabled={currentSpreadIndex === totalSpreads - 1}
          aria-label="Next Page"
          title="Next Page (Right Arrow)"
        >
          <ChevronRight size={28} />
        </button>

        {/* 3D BOOK STRUCTURE */}
        <div
          className={`artisan-book-casing binding-${bindingType} mode-${viewMode} ${
            isFlipping ? `flipping-${isFlipping}` : ""
          }`}
        >
          {/* Stacked Paper Edges (Giving realistic depth to the book) */}
          <div className="book-edge-stack left-stack" />
          <div className="book-edge-stack right-stack" />

          {/* Ribbon Bookmark */}
          <div className="artisan-ribbon-bookmark">
            <div className="ribbon-tail" />
          </div>

          {/* THE BOOK BODY */}
          <div className="artisan-book-pages">
            {/* LEFT PAGE */}
            <div
              className="artisan-page page-left"
              onClick={() => {
                if (currentSpreadIndex > 0) goToPrevSpread();
              }}
            >
              <div className="page-paper-surface">
                {renderPage(currentSpread.leftPage, "left")}
              </div>
              <div className="page-gutter-shadow left-gutter" />
              <div className="page-turn-hint-corner corner-left" title="Click to go back">
                <ChevronLeft size={16} />
              </div>
            </div>

            {/* CENTER BINDING */}
            {bindingType === "spiral" ? (
              <SpiralCoilBinding height={650} />
            ) : (
              <div className="artisan-center-spine" aria-hidden="true">
                <div className="spine-deep-crease" />
                <div className="spine-highlight-stitch" />
              </div>
            )}

            {/* RIGHT PAGE */}
            <div
              className="artisan-page page-right"
              onClick={() => {
                if (currentSpreadIndex < totalSpreads - 1) goToNextSpread();
              }}
            >
              <div className="page-paper-surface">
                {renderPage(currentSpread.rightPage, "right")}
              </div>
              <div className="page-gutter-shadow right-gutter" />
              <div className="page-turn-hint-corner corner-right" title="Click to go next">
                <ChevronRight size={16} />
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* BOTTOM FILMSTRIP TRAY (DRAWER) */}
      <footer className={`artisan-filmstrip-tray ${filmstripOpen ? "open" : ""}`}>
        <div className="filmstrip-header">
          <div className="filmstrip-title-row">
            <Grid size={15} />
            <span>Spreads Overview ({totalSpreads} Spreads)</span>
          </div>
          <button
            className="filmstrip-close-btn"
            onClick={() => setFilmstripOpen(false)}
          >
            <X size={16} />
          </button>
        </div>

        <div className="filmstrip-scroll-row">
          {spreads.map((spread, idx) => {
            const isActive = idx === currentSpreadIndex;
            const previewImg =
              spread.leftPage?.photos?.[0]?.url ||
              spread.rightPage?.photos?.[0]?.url ||
              spread.rightPage?.coverImage ||
              gallery?.coverImage;

            return (
              <button
                key={spread.id}
                className={`filmstrip-card ${isActive ? "active" : ""}`}
                onClick={() => jumpToSpread(idx)}
              >
                <div className="filmstrip-thumbnail">
                  <img
                    src={getMediaUrl(previewImg)}
                    alt={spread.title}
                    loading="lazy"
                  />
                  <div className="filmstrip-badge">{idx === 0 ? "Cover" : `Spread ${idx}`}</div>
                  {isActive && (
                    <div className="filmstrip-active-check">
                      <Check size={14} />
                    </div>
                  )}
                </div>
                <span className="filmstrip-label">{spread.title}</span>
              </button>
            );
          })}
        </div>
      </footer>

      {/* QUICK FLOATING FILMSTRIP TRIGGER BUTTON (When closed) */}
      {!filmstripOpen && (
        <button
          className="filmstrip-floating-pill"
          onClick={() => setFilmstripOpen(true)}
          title="Open thumbnails filmstrip"
        >
          <Grid size={15} />
          <span>Page Navigator ({currentSpreadIndex + 1}/{totalSpreads})</span>
        </button>
      )}

      {/* HIGH RESOLUTION LIGHTBOX MODAL */}
      {lightboxPhoto && (
        <div
          className="artisan-lightbox-overlay"
          onClick={() => setLightboxPhoto(null)}
        >
          <button
            className="lightbox-close-btn"
            onClick={() => setLightboxPhoto(null)}
          >
            <X size={22} />
          </button>

          <div
            className="lightbox-dialog"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={getMediaUrl(lightboxPhoto.url)}
              alt={lightboxPhoto.title || "Zoomed Photo"}
              className="lightbox-img"
            />
            {(lightboxPhoto.title || lightboxPhoto.caption) && (
              <div className="lightbox-caption">
                {lightboxPhoto.title && <h3 className="lightbox-title">{lightboxPhoto.title}</h3>}
                {lightboxPhoto.caption && <p className="lightbox-desc">{lightboxPhoto.caption}</p>}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default BookGalleryLayout;

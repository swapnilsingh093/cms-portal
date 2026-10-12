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
  ZoomIn,
  Grid,
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
  const pitch = 22;
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
              <rect x="5" y={y + 1} width="5" height="9" rx="2.5" fill="url(#holeGrad)" />
              <rect x="24" y={y + 1} width="5" height="9" rx="2.5" fill="url(#holeGrad)" />
              <path
                d={`M 8 ${y + 8} C 12 ${y + 12}, 22 ${y + 12}, 26 ${y + 8}`}
                fill="none"
                stroke="#0f172a"
                strokeWidth="2.5"
                opacity="0.8"
              />
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
 * Modern High-Performance Photobook Modal with 3 Layout Modes:
 * 1. 2 Pages pe 1 Full Image (Cross-Spread Panorama)
 * 2. 1 Page pe 1 Full Width & Height Image
 * 3. 1 Page pe 2 Full Width & Height Images (Split)
 */
const BookGalleryLayout = ({ gallery, onClose }) => {
  const [currentSpreadIndex, setCurrentSpreadIndex] = useState(0);
  const [bindingType, setBindingType] = useState("hardcover"); // "hardcover" | "spiral"
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
   * Curate gallery photos into designed 2-Page Spreads honoring:
   * 1. 2 Pages pe 1 Full Image (Cross-Spread Panorama)
   * 2. 1 Page pe 1 Full Width & Height Image
   * 3. 1 Page pe 2 Full Width & Height Images (Split)
   */
  const spreads = useMemo(() => {
    const list = [];
    const totalPhotos = photos.length;

    // Spread 0: Hardcover Cover & Title Plate
    list.push({
      id: "cover",
      type: "cover_spread",
      badge: "Cover",
      title: "Hardcover Cover & Title Plate",
      leftPage: {
        type: "inside_front_cover",
        galleryTitle: gallery?.title || "Photo Gallery",
        category: gallery?.category?.name || "Editorial Collection",
        date: gallery?.createdAt
          ? new Date(gallery.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
          : "Recent",
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

    // Layout pattern cycle:
    // 0: Panorama (1 photo spanning both pages)
    // 1: Left 1 Full Image, Right 2 Full Images
    // 2: Left 2 Full Images, Right 1 Full Image
    // 3: Left 1 Full Image, Right 1 Full Image
    // 4: Left 2 Full Images, Right 2 Full Images
    const patternCycle = [
      "panorama",
      "single_dual",
      "dual_single",
      "single_single",
      "panorama",
      "dual_dual"
    ];

    let patternIdx = 0;

    while (photoIdx < totalPhotos) {
      const currentPattern = patternCycle[patternIdx % patternCycle.length];
      patternIdx++;
      const remaining = totalPhotos - photoIdx;

      // 1. Two-page Panorama: 1 image spans both left & right pages
      if (currentPattern === "panorama" && remaining >= 1) {
        const panoPhoto = photos[photoIdx++];
        const startPage = pageNum;
        const endPage = pageNum + 1;
        pageNum += 2;

        list.push({
          id: `spread_${spreadCount++}`,
          type: "panorama_spread",
          badge: "2-Page Panorama",
          title: `Pages ${startPage}–${endPage} • Panorama`,
          leftPage: {
            type: "panorama_left",
            photo: panoPhoto,
            pageNumber: startPage
          },
          rightPage: {
            type: "panorama_right",
            photo: panoPhoto,
            pageNumber: endPage
          }
        });
        continue;
      }

      // 2. Left 1 Full Image, Right 2 Full Images
      if (currentPattern === "single_dual") {
        const leftPhoto = photos[photoIdx++];
        const rightPhoto1 = photoIdx < totalPhotos ? photos[photoIdx++] : null;
        const rightPhoto2 = photoIdx < totalPhotos ? photos[photoIdx++] : null;

        const leftPNum = pageNum++;
        const rightPNum = pageNum++;

        list.push({
          id: `spread_${spreadCount++}`,
          type: "content_spread",
          badge: "1 Full + 2 Full",
          title: `Pages ${leftPNum} & ${rightPNum}`,
          leftPage: {
            type: "full_single",
            photo: leftPhoto,
            pageNumber: leftPNum
          },
          rightPage: rightPhoto1
            ? rightPhoto2
              ? {
                  type: "full_dual",
                  photos: [rightPhoto1, rightPhoto2],
                  pageNumber: rightPNum
                }
              : {
                  type: "full_single",
                  photo: rightPhoto1,
                  pageNumber: rightPNum
                }
            : {
                type: "minimal_plate",
                pageNumber: rightPNum
              }
        });
        continue;
      }

      // 3. Left 2 Full Images, Right 1 Full Image
      if (currentPattern === "dual_single") {
        const leftPhoto1 = photos[photoIdx++];
        const leftPhoto2 = photoIdx < totalPhotos ? photos[photoIdx++] : null;
        const rightPhoto = photoIdx < totalPhotos ? photos[photoIdx++] : null;

        const leftPNum = pageNum++;
        const rightPNum = pageNum++;

        list.push({
          id: `spread_${spreadCount++}`,
          type: "content_spread",
          badge: "2 Full + 1 Full",
          title: `Pages ${leftPNum} & ${rightPNum}`,
          leftPage: leftPhoto2
            ? {
                type: "full_dual",
                photos: [leftPhoto1, leftPhoto2],
                pageNumber: leftPNum
              }
            : {
                type: "full_single",
                photo: leftPhoto1,
                pageNumber: leftPNum
              },
          rightPage: rightPhoto
            ? {
                type: "full_single",
                photo: rightPhoto,
                pageNumber: rightPNum
              }
            : {
                type: "minimal_plate",
                pageNumber: rightPNum
              }
        });
        continue;
      }

      // 4. Left 1 Full Image, Right 1 Full Image
      if (currentPattern === "single_single") {
        const leftPhoto = photos[photoIdx++];
        const rightPhoto = photoIdx < totalPhotos ? photos[photoIdx++] : null;

        const leftPNum = pageNum++;
        const rightPNum = pageNum++;

        list.push({
          id: `spread_${spreadCount++}`,
          type: "content_spread",
          badge: "1 Full + 1 Full",
          title: `Pages ${leftPNum} & ${rightPNum}`,
          leftPage: {
            type: "full_single",
            photo: leftPhoto,
            pageNumber: leftPNum
          },
          rightPage: rightPhoto
            ? {
                type: "full_single",
                photo: rightPhoto,
                pageNumber: rightPNum
              }
            : {
                type: "minimal_plate",
                pageNumber: rightPNum
              }
        });
        continue;
      }

      // 5. Left 2 Full Images, Right 2 Full Images
      if (currentPattern === "dual_dual") {
        const lp1 = photos[photoIdx++];
        const lp2 = photoIdx < totalPhotos ? photos[photoIdx++] : null;
        const rp1 = photoIdx < totalPhotos ? photos[photoIdx++] : null;
        const rp2 = photoIdx < totalPhotos ? photos[photoIdx++] : null;

        const leftPNum = pageNum++;
        const rightPNum = pageNum++;

        list.push({
          id: `spread_${spreadCount++}`,
          type: "content_spread",
          badge: "2 Full + 2 Full",
          title: `Pages ${leftPNum} & ${rightPNum}`,
          leftPage: lp2
            ? {
                type: "full_dual",
                photos: [lp1, lp2],
                pageNumber: leftPNum
              }
            : {
                type: "full_single",
                photo: lp1,
                pageNumber: leftPNum
              },
          rightPage: rp1
            ? rp2
              ? {
                  type: "full_dual",
                  photos: [rp1, rp2],
                  pageNumber: rightPNum
                }
              : {
                  type: "full_single",
                  photo: rp1,
                  pageNumber: rightPNum
                }
            : {
                type: "minimal_plate",
                pageNumber: rightPNum
              }
        });
        continue;
      }

      // Fallback
      if (photoIdx < totalPhotos) {
        const p = photos[photoIdx++];
        const pNum = pageNum++;
        list.push({
          id: `spread_${spreadCount++}`,
          type: "content_spread",
          badge: "Full Image",
          title: `Page ${pNum}`,
          leftPage: {
            type: "full_single",
            photo: p,
            pageNumber: pNum
          },
          rightPage: {
            type: "minimal_plate",
            pageNumber: pageNum++
          }
        });
      }
    }

    // Final Spread: Epilogue & Back Cover
    list.push({
      id: "epilogue",
      type: "epilogue_spread",
      badge: "End Plate",
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
   * Render individual page types cleanly:
   * - inside_front_cover
   * - cover_showcase
   * - panorama_left & panorama_right (2 pages pe 1 full image)
   * - full_single (1 page pe 1 full image)
   * - full_dual (1 page pe 2 full images)
   * - colophon & back_cover
   */
  const renderPage = (pageData, side = "left") => {
    if (!pageData) return null;

    // 1. Cover Inside Front Plate
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
              __html:
                typeof pageData.description === "string" && pageData.description.trim().length > 0
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

    // 3. TWO PAGES PE 1 FULL IMAGE: Panorama Left Side
    if (pageData.type === "panorama_left") {
      const p = pageData.photo;
      return (
        <div
          className="artisan-page-content panorama-half-page pano-left-side"
          onClick={() => setLightboxPhoto(p)}
          title="Click to view full panoramic photo"
        >
          {p && (
            <img
              src={getMediaUrl(p.url)}
              alt={p.title || "Panoramic Photo"}
              className="pano-spread-img pano-spread-left"
              loading="lazy"
            />
          )}
          <div className="pano-badge-tag">
            <span>2-PAGE PANORAMA</span>
          </div>
          <button className="photo-zoom-icon" aria-label="Zoom full photo">
            <ZoomIn size={14} />
          </button>
          <div className={`page-number-tag light-tag left`}>
            {pageData.pageNumber}
          </div>
        </div>
      );
    }

    // 4. TWO PAGES PE 1 FULL IMAGE: Panorama Right Side
    if (pageData.type === "panorama_right") {
      const p = pageData.photo;
      return (
        <div
          className="artisan-page-content panorama-half-page pano-right-side"
          onClick={() => setLightboxPhoto(p)}
          title="Click to view full panoramic photo"
        >
          {p && (
            <img
              src={getMediaUrl(p.url)}
              alt={p.title || "Panoramic Photo"}
              className="pano-spread-img pano-spread-right"
              loading="lazy"
            />
          )}
          {p?.title && (
            <div className="pano-title-tag">
              <span>{p.title}</span>
            </div>
          )}
          <button className="photo-zoom-icon" aria-label="Zoom full photo">
            <ZoomIn size={14} />
          </button>
          <div className={`page-number-tag light-tag right`}>
            {pageData.pageNumber}
          </div>
        </div>
      );
    }

    // 5. EK PAGE PE 1 FULL IMAGE (Full Width & Height Edge-to-Edge)
    if (pageData.type === "full_single") {
      const p = pageData.photo;
      return (
        <div
          className="artisan-page-content full-bleed-page"
          onClick={() => setLightboxPhoto(p)}
          title="Click to zoom image"
        >
          {p && (
            <img
              src={getMediaUrl(p.url)}
              alt={p.title || "Gallery Photo"}
              className="full-page-hero-img"
              loading="lazy"
            />
          )}
          <div className="full-page-gradient-tint" />
          {p?.title && (
            <div className="full-page-caption-pill">
              <span className="caption-title">{p.title}</span>
              {p.caption && <span className="caption-sub">{p.caption}</span>}
            </div>
          )}
          <button className="photo-zoom-icon" aria-label="Zoom photo">
            <ZoomIn size={14} />
          </button>
          <div className={`page-number-tag light-tag ${side}`}>
            {pageData.pageNumber}
          </div>
        </div>
      );
    }

    // 6. EK PAGE PE 2 FULL IMAGES (Full Width & Height Split Top & Bottom)
    if (pageData.type === "full_dual") {
      const [p1, p2] = pageData.photos || [];
      return (
        <div className="artisan-page-content dual-full-page">
          {p1 && (
            <div
              className="dual-half-block top-block"
              onClick={() => setLightboxPhoto(p1)}
              title="Click to zoom top photo"
            >
              <img
                src={getMediaUrl(p1.url)}
                alt={p1.title || "Photo"}
                className="dual-half-img"
                loading="lazy"
              />
              <div className="dual-gradient-tint" />
              {p1.title && (
                <div className="dual-caption-overlay">
                  <span>{p1.title}</span>
                </div>
              )}
              <button className="photo-zoom-icon" aria-label="Zoom photo">
                <ZoomIn size={12} />
              </button>
            </div>
          )}

          <div className="dual-split-seam" />

          {p2 && (
            <div
              className="dual-half-block bottom-block"
              onClick={() => setLightboxPhoto(p2)}
              title="Click to zoom bottom photo"
            >
              <img
                src={getMediaUrl(p2.url)}
                alt={p2.title || "Photo"}
                className="dual-half-img"
                loading="lazy"
              />
              <div className="dual-gradient-tint" />
              {p2.title && (
                <div className="dual-caption-overlay">
                  <span>{p2.title}</span>
                </div>
              )}
              <button className="photo-zoom-icon" aria-label="Zoom photo">
                <ZoomIn size={12} />
              </button>
            </div>
          )}

          <div className={`page-number-tag light-tag ${side}`}>
            {pageData.pageNumber}
          </div>
        </div>
      );
    }

    // 7. Colophon / Epilogue Plate
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

    // 8. Back Cover Plate
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
                {photos.length} Photos
              </span>
              {currentSpread?.badge && (
                <span className="meta-pill layout-badge">
                  {currentSpread.badge}
                </span>
              )}
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
          className={`artisan-book-casing binding-${bindingType} ${
            isFlipping ? `flipping-${isFlipping}` : ""
          }`}
        >
          {/* Stacked Paper Edges */}
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
              spread.leftPage?.photo?.url ||
              spread.leftPage?.photos?.[0]?.url ||
              spread.rightPage?.photo?.url ||
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
                  <div className="filmstrip-badge">{spread.badge || `Spread ${idx}`}</div>
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

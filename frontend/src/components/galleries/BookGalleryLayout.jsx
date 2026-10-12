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
 * Photorealistic Interactive 3D Photobook Modal
 * Features:
 * - Real 3D Book Leaf Engine (leaves physically flip over with 180° rotation)
 * - 100% Uncropped faces and subjects (aspect-ratio preserved + ambient blur backfill)
 * - Seamless 2-Page Layflat Panorama across leaves with hidden spine crease
 * - Balanced spreads (1 Full + 2 Dual, 2 Dual + 1 Full, 1 Full + 1 Full, or 2-Page Panorama)
 * - Zero image desync: each page face has static, pre-rendered photos
 * - Smooth, calm, organic page turns without jerks ("jhatke")
 */
const BookGalleryLayout = ({ gallery, onClose }) => {
  const [currentSpread, setCurrentSpread] = useState(0); // Starts at 0, opens smoothly to 1
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [autoPlay, setAutoPlay] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [filmstripOpen, setFilmstripOpen] = useState(false);
  const [lightboxPhoto, setLightboxPhoto] = useState(null);

  const modalContainerRef = useRef(null);
  const audioContextRef = useRef(null);
  const autoPlayTimerRef = useRef(null);
  const isFlippingRef = useRef(false);

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
        const decay = Math.pow(1 - i / bufferSize, 2.2);
        data[i] = lastOut * decay * 1.5;
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(1200, ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + duration);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.35, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.005, ctx.currentTime + duration);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      noise.start();
    } catch {
      // Audio autoplay fallback
    }
  }, [soundEnabled]);

  /**
   * Curate gallery photos into clean spreads (Spread 0 to Spread M)
   */
  const spreads = useMemo(() => {
    const list = [];
    const totalPhotos = photos.length;

    // Spread 0: Hardcover Cover (Right side)
    list.push({
      id: "cover",
      type: "cover_spread",
      badge: "Cover",
      title: "Hardcover Cover",
      frontCover: {
        type: "cover_front",
        coverImage: getMediaUrl(gallery?.coverImage || gallery?.banner || photos[0]?.url),
        galleryTitle: gallery?.title || "Photo Gallery",
        subtitle: gallery?.category?.name ? `${gallery.category.name} Collection` : "Fine Art Photography Collection",
        photoCount: totalPhotos,
        curator: gallery?.author?.name || "Featured Artist",
        year: gallery?.createdAt ? new Date(gallery.createdAt).getFullYear() : 2026
      }
    });

    // Spread 1 Left Page: Inside Cover Plate
    const insideCoverPage = {
      type: "inside_front_cover",
      galleryTitle: gallery?.title || "Photo Gallery",
      category: gallery?.category?.name || "Editorial Collection",
      date: gallery?.createdAt
        ? new Date(gallery.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
        : "Recent",
      photographer: gallery?.author?.name || "Curator's Pick",
      photoCount: totalPhotos,
      description: gallery?.description || "An exclusive photobook showcase."
    };

    let photoIdx = 0;
    let pageNum = 1;
    let spreadCount = 1;

    // Rhythm of layouts:
    // - 2-page panorama (1 photo across 2 pages)
    // - 1 full page (1 photo)
    // - 1 page with 2 full images (dual stack)
    // - NEVER 2 on left AND 2 on right simultaneously!
    const patternCycle = [
      "single_dual",   // Left = 1 Full, Right = 2 Dual
      "single_single", // Left = 1 Full, Right = 1 Full
      "panorama",      // 2-Page Panorama
      "dual_single",   // Left = 2 Dual, Right = 1 Full
      "single_single", // Left = 1 Full, Right = 1 Full
      "panorama"       // 2-Page Panorama
    ];
    let patternIdx = 0;

    // Spread 1:
    // Left Page: insideCoverPage
    // Right Page: Photo 0 (Single Hero Plate)
    if (photoIdx < totalPhotos) {
      const p = photos[photoIdx++];
      list.push({
        id: `spread_${spreadCount++}`,
        type: "content_spread",
        badge: "Hero Plate",
        title: `Spread 1 • Hero Plate`,
        leftPage: insideCoverPage,
        rightPage: {
          type: "full_single",
          photo: p,
          pageNumber: pageNum++
        }
      });
    }

    // Subsequent Spreads:
    while (photoIdx < totalPhotos) {
      const pattern = patternCycle[patternIdx % patternCycle.length];
      patternIdx++;
      const remaining = totalPhotos - photoIdx;

      // 1. Two-page Panorama: 1 image spans both pages seamlessly (NO center line)
      if (pattern === "panorama" && remaining >= 1) {
        const panoPhoto = photos[photoIdx++];
        const startP = pageNum++;
        const endP = pageNum++;

        list.push({
          id: `spread_${spreadCount++}`,
          type: "panorama_spread",
          badge: "2-Page Panorama",
          title: `Pages ${startP} & ${endP} • Panorama`,
          leftPage: {
            type: "panorama_half",
            photo: panoPhoto,
            side: "left",
            pageNumber: startP
          },
          rightPage: {
            type: "panorama_half",
            photo: panoPhoto,
            side: "right",
            pageNumber: endP
          }
        });
        continue;
      }

      // 2. Left 1 Full Image, Right 2 Dual Images
      if (pattern === "single_dual") {
        const leftPhoto = photos[photoIdx++];
        const rightPhoto1 = photoIdx < totalPhotos ? photos[photoIdx++] : null;
        const rightPhoto2 = photoIdx < totalPhotos ? photos[photoIdx++] : null;

        const leftNum = pageNum++;
        const rightNum = pageNum++;

        list.push({
          id: `spread_${spreadCount++}`,
          type: "content_spread",
          badge: "1 Full + 2 Dual",
          title: `Pages ${leftNum} & ${rightNum}`,
          leftPage: {
            type: "full_single",
            photo: leftPhoto,
            pageNumber: leftNum
          },
          rightPage: rightPhoto1
            ? rightPhoto2
              ? {
                  type: "full_dual",
                  photos: [rightPhoto1, rightPhoto2],
                  pageNumber: rightNum
                }
              : {
                  type: "full_single",
                  photo: rightPhoto1,
                  pageNumber: rightNum
                }
            : {
                type: "minimal_plate",
                pageNumber: rightNum
              }
        });
        continue;
      }

      // 3. Left 2 Dual Images, Right 1 Full Image
      if (pattern === "dual_single") {
        const left1 = photos[photoIdx++];
        const left2 = photoIdx < totalPhotos ? photos[photoIdx++] : null;
        const rightP = photoIdx < totalPhotos ? photos[photoIdx++] : null;

        const leftNum = pageNum++;
        const rightNum = pageNum++;

        list.push({
          id: `spread_${spreadCount++}`,
          type: "content_spread",
          badge: "2 Dual + 1 Full",
          title: `Pages ${leftNum} & ${rightNum}`,
          leftPage: left2
            ? {
                type: "full_dual",
                photos: [left1, left2],
                pageNumber: leftNum
              }
            : {
                type: "full_single",
                photo: left1,
                pageNumber: leftNum
              },
          rightPage: rightP
            ? {
                type: "full_single",
                photo: rightP,
                pageNumber: rightNum
              }
            : {
                type: "minimal_plate",
                pageNumber: rightNum
              }
        });
        continue;
      }

      // 4. Left 1 Full Image, Right 1 Full Image
      if (pattern === "single_single") {
        const leftP = photos[photoIdx++];
        const rightP = photoIdx < totalPhotos ? photos[photoIdx++] : null;

        const leftNum = pageNum++;
        const rightNum = pageNum++;

        list.push({
          id: `spread_${spreadCount++}`,
          type: "content_spread",
          badge: "1 Full + 1 Full",
          title: `Pages ${leftNum} & ${rightNum}`,
          leftPage: {
            type: "full_single",
            photo: leftP,
            pageNumber: leftNum
          },
          rightPage: rightP
            ? {
                type: "full_single",
                photo: rightP,
                pageNumber: rightNum
              }
            : {
                type: "minimal_plate",
                pageNumber: rightNum
              }
        });
        continue;
      }

      // Default fallback
      if (photoIdx < totalPhotos) {
        const p = photos[photoIdx++];
        const leftNum = pageNum++;
        const rightNum = pageNum++;
        list.push({
          id: `spread_${spreadCount++}`,
          type: "content_spread",
          badge: "Full Image",
          title: `Pages ${leftNum} & ${rightNum}`,
          leftPage: {
            type: "full_single",
            photo: p,
            pageNumber: leftNum
          },
          rightPage: {
            type: "minimal_plate",
            pageNumber: rightNum
          }
        });
      }
    }

    // Final Spread: Colophon Plate (Left) & Back Cover Plate (Right)
    const endP = pageNum++;
    list.push({
      id: "epilogue",
      type: "epilogue_spread",
      badge: "Colophon",
      title: "Colophon & Back Cover",
      leftPage: {
        type: "colophon",
        pageNumber: endP,
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

  /**
   * Map Spreads to 3D Physical Leaves
   * Each leaf has a Front face (right side) and a Back face (left side when flipped).
   */
  const leaves = useMemo(() => {
    const list = [];
    const count = spreads.length;

    for (let i = 0; i < count; i++) {
      if (i === 0) {
        list.push({
          id: `leaf_0`,
          front: spreads[0].frontCover,
          back: spreads[1]?.leftPage || null,
          isCover: true
        });
      } else if (i === count - 1) {
        list.push({
          id: `leaf_${i}`,
          front: spreads[i].rightPage,
          back: {
            type: "outer_back_cover",
            galleryTitle: gallery?.title || "Photo Gallery"
          },
          isLast: true
        });
      } else {
        list.push({
          id: `leaf_${i}`,
          front: spreads[i].rightPage,
          back: spreads[i + 1]?.leftPage || null
        });
      }
    }
    return list;
  }, [spreads, gallery]);

  const totalLeaves = leaves.length;
  const totalSpreads = spreads.length;
  const currentSpreadData = spreads[currentSpread] || spreads[0];

  // Smooth auto-open on initial mount so user sees book gracefully open to Spread 1
  useEffect(() => {
    const timer = setTimeout(() => {
      if (spreads.length > 1) {
        playPageTurnSound();
        setCurrentSpread(1);
      }
    }, 320);
    return () => clearTimeout(timer);
  }, [spreads.length, playPageTurnSound]);

  // Turn page navigation handlers
  const handleNext = useCallback(() => {
    if (isFlippingRef.current) return;
    if (currentSpread < totalSpreads - 1) {
      isFlippingRef.current = true;
      playPageTurnSound();
      setCurrentSpread((prev) => prev + 1);
      setTimeout(() => {
        isFlippingRef.current = false;
      }, 750);
    }
  }, [currentSpread, totalSpreads, playPageTurnSound]);

  const handlePrev = useCallback(() => {
    if (isFlippingRef.current) return;
    if (currentSpread > 0) {
      isFlippingRef.current = true;
      playPageTurnSound();
      setCurrentSpread((prev) => prev - 1);
      setTimeout(() => {
        isFlippingRef.current = false;
      }, 750);
    }
  }, [currentSpread, playPageTurnSound]);

  const jumpToSpread = useCallback(
    (targetIndex) => {
      if (targetIndex === currentSpread || isFlippingRef.current) return;
      isFlippingRef.current = true;
      playPageTurnSound();
      setCurrentSpread(targetIndex);
      setTimeout(() => {
        isFlippingRef.current = false;
      }, 750);
    },
    [currentSpread, playPageTurnSound]
  );

  // Autoplay Slideshow
  useEffect(() => {
    if (autoPlayTimerRef.current) clearInterval(autoPlayTimerRef.current);
    if (autoPlay) {
      autoPlayTimerRef.current = setInterval(() => {
        if (currentSpread < totalSpreads - 1) {
          handleNext();
        } else {
          jumpToSpread(0);
        }
      }, 5500);
    }
    return () => {
      if (autoPlayTimerRef.current) clearInterval(autoPlayTimerRef.current);
    };
  }, [autoPlay, currentSpread, totalSpreads, handleNext, jumpToSpread]);

  // Keyboard navigation & ESC handler
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "ArrowRight") handleNext();
      if (e.key === "ArrowLeft") handlePrev();
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
  }, [handleNext, handlePrev, lightboxPhoto, filmstripOpen, onClose]);

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
   * 100% Uncropped Faces & Subjects (Aspect-Ratio Containment + Ambient Backfill)
   */
  const renderPageFace = (pageData, side = "left") => {
    if (!pageData) return null;

    // 1. Cover Front (Outer Hardcover)
    if (pageData.type === "cover_front") {
      return (
        <div className="artisan-page-content cover-showcase-plate">
          <div className="cover-frame-box">
            <div className="cover-gold-border" />
            <div className="cover-image-container">
              <div
                className="cover-ambient-blur"
                style={{ backgroundImage: `url(${pageData.coverImage})` }}
              />
              <img
                src={pageData.coverImage}
                alt={pageData.galleryTitle}
                className="cover-hero-img"
              />
              <div className="cover-img-glare" />
            </div>
          </div>
          <div className="cover-typography">
            <span className="cover-series-tag">PORTFOLIO EDITION • {pageData.year}</span>
            <h1 className="cover-main-title">{pageData.galleryTitle}</h1>
            <p className="cover-subtitle">{pageData.subtitle}</p>
            <button
              className="cover-open-btn"
              onClick={handleNext}
            >
              <span>Open Photobook</span>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      );
    }

    // 2. Cover Inside Front Plate (Prologue)
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
                  : `<p>A curated photographic collection featuring ${pageData.photoCount} visual works. Bound and presented in archival high-definition fidelity.</p>`
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
              <span className="meta-value">Hardcover Layflat</span>
            </div>
          </div>

          <div className="plate-footer">
            <div className="plate-stamp">
              <Sparkles size={14} /> CERTIFIED EXHIBITION
            </div>
            <span className="plate-turn-hint" onClick={handleNext}>Turn page →</span>
          </div>
        </div>
      );
    }

    // 3. CONTINUOUS 2-PAGE PANORAMA (Left or Right Half)
    if (pageData.type === "panorama_half") {
      const p = pageData.photo;
      const isLeft = pageData.side === "left";
      return (
        <div
          className={`page-spread-half ${isLeft ? "page-spread-left" : "page-spread-right"}`}
          onClick={() => setLightboxPhoto(p)}
          title="Click to view full panoramic photo"
        >
          {p && (
            <>
              <div
                className="pano-ambient-blur"
                style={{ backgroundImage: `url(${getMediaUrl(p.url)})` }}
                aria-hidden="true"
              />
              <img
                src={getMediaUrl(p.url)}
                alt={p.title || "Panoramic Photo"}
                className="pano-half-img"
                loading="lazy"
              />
            </>
          )}
          {isLeft ? (
            <div className="pano-badge-tag">
              <span>2-PAGE PANORAMA</span>
            </div>
          ) : (
            p?.title && (
              <div className="pano-title-tag">
                <span>{p.title}</span>
              </div>
            )
          )}
          <button className="photo-zoom-icon" aria-label="Zoom photo">
            <ZoomIn size={14} />
          </button>
          <div className={`page-number-tag light-tag ${isLeft ? "left" : "right"}`}>
            {pageData.pageNumber}
          </div>
        </div>
      );
    }

    // 4. EK PAGE PE 1 FULL IMAGE (Aspect-Ratio Preserved, Faces Never Cut)
    if (pageData.type === "full_single") {
      const p = pageData.photo;
      return (
        <div
          className="artisan-page-content full-bleed-page"
          onClick={() => setLightboxPhoto(p)}
          title="Click to zoom image in full resolution"
        >
          {p && (
            <>
              <div
                className="page-ambient-blur-bg"
                style={{ backgroundImage: `url(${getMediaUrl(p.url)})` }}
                aria-hidden="true"
              />
              <img
                src={getMediaUrl(p.url)}
                alt={p.title || "Gallery Photo"}
                className="full-page-hero-img"
                loading="lazy"
              />
            </>
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

    // 5. EK PAGE PE 2 FULL IMAGES (Split with Aspect-Ratio Preserved, Faces Never Cut)
    if (pageData.type === "full_dual") {
      const [p1, p2] = pageData.photos || [];
      return (
        <div className="artisan-page-content dual-full-page">
          {p1 && (
            <div
              className="dual-half-block top-block"
              onClick={() => setLightboxPhoto(p1)}
              title="Click to zoom photo 1"
            >
              <div
                className="dual-ambient-bg"
                style={{ backgroundImage: `url(${getMediaUrl(p1.url)})` }}
                aria-hidden="true"
              />
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
              title="Click to zoom photo 2"
            >
              <div
                className="dual-ambient-bg"
                style={{ backgroundImage: `url(${getMediaUrl(p2.url)})` }}
                aria-hidden="true"
              />
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

    // 6. Colophon / Epilogue Plate
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

    // 7. Back Cover Plate
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

    // 8. Outer Back Cover
    if (pageData.type === "outer_back_cover") {
      return (
        <div className="artisan-page-content back-cover-plate">
          <div className="back-cover-emboss">
            <div className="back-cover-logo">
              <BookOpen size={36} />
            </div>
            <h3 className="back-cover-title">{pageData.galleryTitle}</h3>
            <span className="back-cover-edition">LUMEN EDITIONS • ARCHIVAL CASING</span>
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
                Spread {currentSpread + 1} of {totalSpreads}
              </span>
              <span className="meta-pill photos-count">
                {photos.length} Photos
              </span>
              {currentSpreadData?.badge && (
                <span className="meta-pill layout-badge">
                  {currentSpreadData.badge}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Center: Timeline Progress Bar */}
        <div className="topbar-center">
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
              style={{ width: `${((currentSpread + 1) / totalSpreads) * 100}%` }}
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
          className={`book-nav-arrow arrow-left ${currentSpread === 0 ? "disabled" : ""}`}
          onClick={handlePrev}
          disabled={currentSpread === 0}
          aria-label="Previous Page"
          title="Previous Page (Left Arrow)"
        >
          <ChevronLeft size={28} />
        </button>

        {/* Floating Next Button */}
        <button
          className={`book-nav-arrow arrow-right ${currentSpread === totalSpreads - 1 ? "disabled" : ""}`}
          onClick={handleNext}
          disabled={currentSpread === totalSpreads - 1}
          aria-label="Next Page"
          title="Next Page (Right Arrow)"
        >
          <ChevronRight size={28} />
        </button>

        {/* 3D BOOK STRUCTURE */}
        <div
          className={`artisan-book-casing ${
            currentSpreadData.type === "panorama_spread" ? "is-panorama-casing" : ""
          }`}
        >
          {/* Stacked Paper Edges */}
          <div className="book-edge-stack left-stack" />
          <div className="book-edge-stack right-stack" />

          {/* Ribbon Bookmark */}
          <div className="artisan-ribbon-bookmark">
            <div className="ribbon-tail" />
          </div>

          {/* Deep Spine Groove behind pages (Hidden on panorama spreads) */}
          <div className="spine-deep-crease" />

          {/* Left & Right Page Turning Hotspots / Click Zones */}
          <div
            className="flip-hotspot-left"
            onClick={handlePrev}
            title="Click to flip backward"
          >
            <div className="corner-curl-hint">
              <ChevronLeft size={18} />
            </div>
          </div>
          <div
            className="flip-hotspot-right"
            onClick={handleNext}
            title="Click to flip forward"
          >
            <div className="corner-curl-hint">
              <ChevronRight size={18} />
            </div>
          </div>

          {/* THE 3D LEAF SYSTEM */}
          <div
            className={`artisan-book-pages ${
              currentSpreadData.type === "panorama_spread" ? "is-panorama-spread" : ""
            }`}
          >
            {leaves.map((leaf, idx) => {
              const isFlipped = idx < currentSpread;
              const zIndex = isFlipped ? idx + 1 : totalLeaves - idx + 1;

              return (
                <div
                  key={leaf.id}
                  className={`book-leaf ${isFlipped ? "flipped" : ""}`}
                  style={{ zIndex }}
                >
                  {/* FRONT FACE (Visible on Right side when unflipped) */}
                  <div
                    className={`page-face page-front ${
                      leaf.isCover ? "cover-front-face" : ""
                    }`}
                  >
                    {renderPageFace(leaf.front, "right")}
                  </div>

                  {/* BACK FACE (Visible on Left side when flipped) */}
                  <div
                    className={`page-face page-back ${
                      leaf.isLast ? "cover-back-face" : ""
                    }`}
                  >
                    {renderPageFace(leaf.back, "left")}
                  </div>
                </div>
              );
            })}
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
            const isActive = idx === currentSpread;
            const previewImg =
              spread.frontCover?.coverImage ||
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
          <span>Page Navigator ({currentSpread + 1}/{totalSpreads})</span>
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

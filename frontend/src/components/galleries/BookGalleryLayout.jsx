import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import "./BookGalleryLayout.css";
import {
  X,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Volume2,
  VolumeX,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Grid
} from "lucide-react";

/**
 * Robust image URL formatter
 */
const getMediaUrl = (item) => {
  if (!item) return "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80";
  const rawUrl = typeof item === "string" ? item : item.url || item.secure_url || item.path || "";
  if (!rawUrl) return "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80";
  if (rawUrl.startsWith("http://") || rawUrl.startsWith("https://")) return rawUrl;
  const cleanPath = rawUrl.startsWith("/") ? rawUrl : `/${rawUrl}`;
  return `http://localhost:5001${cleanPath}`;
};

/**
 * EXACT LUMEN PHOTOBOOK ENGINE (post-book-layout)
 */
const BookGalleryLayout = ({ gallery, onClose }) => {
  const [currentSpread, setCurrentSpread] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [autoPlay, setAutoPlay] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [lightboxPhoto, setLightboxPhoto] = useState(null);

  const bookContainerRef = useRef(null);
  const audioContextRef = useRef(null);
  const autoPlayTimerRef = useRef(null);
  const currentSpreadRef = useRef(0);
  const isTransitioningRef = useRef(false);

  // Photos from gallery
  const photos = useMemo(() => {
    if (!gallery) return [];
    const raw = Array.isArray(gallery.images) ? gallery.images : [];
    const valid = raw.filter((img) => img && (typeof img === "string" || img.url || img.secure_url));
    if (valid.length > 0) return valid;
    // Fallback if gallery only has cover
    if (gallery.coverImage || gallery.banner) {
      return [{ url: gallery.coverImage || gallery.banner, title: gallery.title }];
    }
    return [
      { url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80", title: "Lumen Cover" },
      { url: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80", title: "Alpine Ridge" },
      { url: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80", title: "Emerald Valley" }
    ];
  }, [gallery]);

  // Lock body scroll
  useEffect(() => {
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, []);

  // Web Audio synthesis from post-book-layout
  const playPageFlipSound = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioCtx();
      }
      const ctx = audioContextRef.current;
      if (ctx.state === "suspended") ctx.resume();

      const duration = 0.14;
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
      filter.frequency.setValueAtTime(1100, ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(280, ctx.currentTime + duration);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.45, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      noise.start();
    } catch {
      // Audio fallback
    }
  }, [soundEnabled]);

  /**
   * Spreads curation following user specifications:
   * - 1 Full image page (faces never cut)
   * - 1 page with 2 full images (dual stack)
   * - 2-page panorama (seamless across both pages, no center line)
   * - NEVER 2 on left AND 2 on right simultaneously
   */
  const spreads = useMemo(() => {
    const list = [];
    const totalPhotos = photos.length;

    // Spread 0: Hardcover Outer Cover
    list.push({
      id: "spread_0",
      spreadIndex: 0,
      title: "Hardcover • " + (gallery?.title || "Gallery Album"),
      badge: "Cover",
      type: "cover_spread",
      coverFront: {
        title: gallery?.title || "Fine Art Collection",
        subtitle: gallery?.description || "Archival photography collection.",
        category: gallery?.category?.name || "Lumen Editions • 2026",
        coverImage: getMediaUrl(gallery?.coverImage || gallery?.banner || photos[0]?.url)
      }
    });

    // Spread 1:
    // Left: Table of Contents / Prologue
    // Right: Single Hero (Photo 0)
    let photoIdx = 0;
    let pageNum = 1;
    let sIndex = 1;

    const p0 = photos[photoIdx++];
    list.push({
      id: `spread_${sIndex}`,
      spreadIndex: sIndex++,
      title: `Spread 1 • Prologue & Hero Plate`,
      badge: "Hero Plate",
      type: "content_spread",
      leftPage: {
        type: "toc",
        galleryTitle: gallery?.title || "Photo Gallery",
        description: gallery?.description || "A tactile digital book exploring light, solitude, and vast horizons.",
        photoCount: totalPhotos,
        author: gallery?.author?.name || "Curator's Pick"
      },
      rightPage: {
        type: "single_hero",
        photo: p0,
        pageNumber: pageNum++
      }
    });

    // Pattern rhythm:
    // 1. Single (Left) + Dual Equal (Right)
    // 2. 2-Page Panorama (1 photo across both pages)
    // 3. Dual Equal (Left) + Single (Right)
    // 4. Single (Left) + Single (Right)
    // 5. 2-Page Panorama (1 photo across both pages)
    const patterns = ["single_dual", "panorama", "dual_single", "single_single", "panorama"];
    let patIdx = 0;

    // Limit to max 12 content spreads for smooth performance
    while (photoIdx < totalPhotos && sIndex <= 12) {
      const currentPat = patterns[patIdx % patterns.length];
      patIdx++;
      const remaining = totalPhotos - photoIdx;

      // Panorama (1 photo spans 2 pages)
      if (currentPat === "panorama" && remaining >= 1) {
        const pPano = photos[photoIdx++];
        const startP = pageNum++;
        const endP = pageNum++;
        list.push({
          id: `spread_${sIndex}`,
          spreadIndex: sIndex++,
          title: `Pages ${startP} & ${endP} • Double Panorama`,
          badge: "Panorama",
          type: "panorama_spread",
          leftPage: {
            type: "panorama_half",
            photo: pPano,
            side: "left",
            pageNumber: startP
          },
          rightPage: {
            type: "panorama_half",
            photo: pPano,
            side: "right",
            pageNumber: endP
          }
        });
        continue;
      }

      // Single + Dual
      if (currentPat === "single_dual") {
        const leftP = photos[photoIdx++];
        const rightP1 = photoIdx < totalPhotos ? photos[photoIdx++] : null;
        const rightP2 = photoIdx < totalPhotos ? photos[photoIdx++] : null;
        const leftPNum = pageNum++;
        const rightPNum = pageNum++;

        list.push({
          id: `spread_${sIndex}`,
          spreadIndex: sIndex++,
          title: `Pages ${leftPNum} & ${rightPNum} • Single & Dual`,
          badge: "Single & Dual",
          type: "content_spread",
          leftPage: {
            type: "single_hero",
            photo: leftP,
            pageNumber: leftPNum
          },
          rightPage: rightP1
            ? rightP2
              ? {
                  type: "dual_equal",
                  photos: [rightP1, rightP2],
                  pageNumber: rightPNum
                }
              : {
                  type: "single_hero",
                  photo: rightP1,
                  pageNumber: rightPNum
                }
            : {
                type: "single_hero",
                photo: leftP,
                pageNumber: rightPNum
              }
        });
        continue;
      }

      // Dual + Single
      if (currentPat === "dual_single") {
        const leftP1 = photos[photoIdx++];
        const leftP2 = photoIdx < totalPhotos ? photos[photoIdx++] : null;
        const rightP = photoIdx < totalPhotos ? photos[photoIdx++] : null;
        const leftPNum = pageNum++;
        const rightPNum = pageNum++;

        list.push({
          id: `spread_${sIndex}`,
          spreadIndex: sIndex++,
          title: `Pages ${leftPNum} & ${rightPNum} • Dual & Single`,
          badge: "Dual & Single",
          type: "content_spread",
          leftPage: leftP2
            ? {
                type: "dual_equal",
                photos: [leftP1, leftP2],
                pageNumber: leftPNum
              }
            : {
                type: "single_hero",
                photo: leftP1,
                pageNumber: leftPNum
              },
          rightPage: rightP
            ? {
                type: "single_hero",
                photo: rightP,
                pageNumber: rightPNum
              }
            : {
                type: "single_hero",
                photo: leftP1,
                pageNumber: rightPNum
              }
        });
        continue;
      }

      // Single + Single
      if (currentPat === "single_single") {
        const leftP = photos[photoIdx++];
        const rightP = photoIdx < totalPhotos ? photos[photoIdx++] : null;
        const leftPNum = pageNum++;
        const rightPNum = pageNum++;

        list.push({
          id: `spread_${sIndex}`,
          spreadIndex: sIndex++,
          title: `Pages ${leftPNum} & ${rightPNum} • Solo Plates`,
          badge: "Solo Plates",
          type: "content_spread",
          leftPage: {
            type: "single_hero",
            photo: leftP,
            pageNumber: leftPNum
          },
          rightPage: rightP
            ? {
                type: "single_hero",
                photo: rightP,
                pageNumber: rightPNum
              }
            : {
                type: "single_hero",
                photo: leftP,
                pageNumber: rightPNum
              }
        });
        continue;
      }
    }

    // Final Back Cover Spread
    list.push({
      id: `spread_${sIndex}`,
      spreadIndex: sIndex,
      title: "Back Cover • " + (gallery?.title || "Lumen Editions"),
      badge: "Back Cover",
      type: "back_cover_spread",
      coverBack: {
        galleryTitle: gallery?.title || "Photo Gallery",
        photoCount: totalPhotos,
        edition: "LUMEN EDITIONS • 2026"
      }
    });

    return list;
  }, [gallery, photos]);

  /**
   * Leaves generation:
   * Each leaf `i` has a Front face and a Back face.
   */
  const leaves = useMemo(() => {
    const list = [];
    const count = spreads.length - 1; // Number of physical leaves

    for (let i = 0; i < count; i++) {
      if (i === 0) {
        // Leaf 0:
        // Front: Spread 0 Cover Front
        // Back: Spread 1 Left Page (Table of contents)
        list.push({
          id: "leaf_0",
          leafIndex: 0,
          front: spreads[0].coverFront,
          back: spreads[1]?.leftPage || null,
          isCoverFront: true
        });
      } else if (i === count - 1) {
        // Final Leaf:
        // Front: Spread (count) Left Page
        // Back: Spread (count + 1) Back Cover
        list.push({
          id: `leaf_${i}`,
          leafIndex: i,
          front: spreads[i]?.rightPage || null,
          back: spreads[count]?.coverBack || null,
          isCoverBack: true
        });
      } else {
        // Leaf i:
        // Front: Spread i Right Page
        // Back: Spread (i + 1) Left Page
        list.push({
          id: `leaf_${i}`,
          leafIndex: i,
          front: spreads[i]?.rightPage || null,
          back: spreads[i + 1]?.leftPage || null
        });
      }
    }
    return list;
  }, [spreads]);

  const totalLeaves = leaves.length;

  /**
   * EXACT 3D PAGE FLIP ENGINE FROM post-book-layout/book.js
   */
  const flipToSpread = useCallback(
    (targetIndex) => {
      const newIndex = Math.max(0, Math.min(totalLeaves, targetIndex));
      if (newIndex === currentSpreadRef.current && isTransitioningRef.current) return;

      const prevIndex = currentSpreadRef.current;
      currentSpreadRef.current = newIndex;
      setCurrentSpread(newIndex);
      playPageFlipSound();

      if (!bookContainerRef.current) return;
      const domLeaves = bookContainerRef.current.querySelectorAll(".book-leaf");
      const isMovingForward = newIndex > prevIndex;
      isTransitioningRef.current = true;

      domLeaves.forEach((leaf, i) => {
        const isFlipped = i < newIndex;

        // Calculate realistic z-indices
        let zIndex;
        if (isFlipped) {
          zIndex = i + 1;
        } else {
          zIndex = totalLeaves - i + 1;
        }

        // Elevate the moving leaf during transition so it renders above static stacks
        const isMoving = isMovingForward ? i >= prevIndex && i < newIndex : i >= newIndex && i < prevIndex;
        if (isMoving) {
          zIndex = 60 + Math.abs(i - newIndex);
        }

        leaf.style.zIndex = zIndex;

        let delay = 0;
        if (isMoving) {
          delay = isMovingForward ? (i - prevIndex) * 90 : (prevIndex - 1 - i) * 90;
        }
        leaf.style.transitionDelay = `${delay}ms`;

        if (isFlipped) {
          leaf.classList.add("flipped");
        } else {
          leaf.classList.remove("flipped");
        }
      });

      // Reset z-indices cleanly after flip completes
      setTimeout(() => {
        if (!bookContainerRef.current) return;
        const domLeavesReset = bookContainerRef.current.querySelectorAll(".book-leaf");
        domLeavesReset.forEach((leaf, i) => {
          const isFlipped = i < currentSpreadRef.current;
          const zIndex = isFlipped ? i + 1 : totalLeaves - i + 1;
          leaf.style.zIndex = zIndex;
          leaf.style.transitionDelay = "0ms";
        });
        isTransitioningRef.current = false;
      }, 1100);
    },
    [totalLeaves, playPageFlipSound]
  );

  const nextSpread = useCallback(() => {
    if (currentSpread < totalLeaves) {
      flipToSpread(currentSpread + 1);
    }
  }, [currentSpread, totalLeaves, flipToSpread]);

  const prevSpread = useCallback(() => {
    if (currentSpread > 0) {
      flipToSpread(currentSpread - 1);
    }
  }, [currentSpread, flipToSpread]);

  // Initial leaf z-index setup on mount
  useEffect(() => {
    if (!bookContainerRef.current) return;
    const domLeaves = bookContainerRef.current.querySelectorAll(".book-leaf");
    domLeaves.forEach((leaf, i) => {
      const isFlipped = i < currentSpread;
      const zIndex = isFlipped ? i + 1 : totalLeaves - i + 1;
      leaf.style.zIndex = zIndex;
      if (isFlipped) leaf.classList.add("flipped");
      else leaf.classList.remove("flipped");
    });
  }, [leaves, currentSpread, totalLeaves]);

  // Keyboard navigation & ESC
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "ArrowRight") nextSpread();
      if (e.key === "ArrowLeft") prevSpread();
      if (e.key === " " && !lightboxPhoto) {
        e.preventDefault();
        setAutoPlay((prev) => !prev);
      }
      if (e.key === "Escape") {
        if (lightboxPhoto) {
          setLightboxPhoto(null);
        } else if (drawerOpen) {
          setDrawerOpen(false);
        } else {
          onClose?.();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [nextSpread, prevSpread, lightboxPhoto, drawerOpen, onClose]);

  // Slideshow
  useEffect(() => {
    if (autoPlayTimerRef.current) clearInterval(autoPlayTimerRef.current);
    if (autoPlay) {
      autoPlayTimerRef.current = setInterval(() => {
        if (currentSpreadRef.current < totalLeaves) {
          nextSpread();
        } else {
          flipToSpread(0);
        }
      }, 5500);
    }
    return () => {
      if (autoPlayTimerRef.current) clearInterval(autoPlayTimerRef.current);
    };
  }, [autoPlay, totalLeaves, nextSpread, flipToSpread]);

  /**
   * Render individual page faces (exact post-book-layout HTML)
   */
  const renderFaceContent = (faceData, isFront = true) => {
    if (!faceData) return null;

    // Cover Front
    if (faceData.coverImage) {
      return (
        <div className="cover-front">
          <div className="cover-emboss-border" />
          <div className="cover-badge">{faceData.category}</div>
          <h2 className="cover-headline">{faceData.title}</h2>
          <p className="cover-sub">{faceData.subtitle}</p>
          <div style={{ marginTop: "32px", display: "flex", alignItems: "center", gap: "14px" }}>
            <div style={{ width: "48px", height: "1px", background: "rgba(240, 190, 110, 0.7)" }} />
            <span style={{ fontSize: "12px", letterSpacing: "0.16em", textTransform: "uppercase", color: "#E8B975" }}>
              Curated Edition
            </span>
          </div>
          <div className="cover-bottom">
            <span style={{ fontSize: "13px", color: "#D5CEE5" }}>CMS Editions • 2026</span>
            <button
              className="cover-open-btn"
              onClick={(e) => {
                e.stopPropagation();
                flipToSpread(1);
              }}
            >
              Open Book ➔
            </button>
          </div>
        </div>
      );
    }

    // Cover Back
    if (faceData.edition) {
      return (
        <div className="cover-back">
          <div className="cover-back-emblem">
            <BookOpen size={32} />
          </div>
          <h2 style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: "24px", margin: "0 0 8px 0" }}>
            {faceData.galleryTitle}
          </h2>
          <p style={{ fontSize: "13px", color: "#9BA1B5", letterSpacing: "0.14em", textTransform: "uppercase" }}>
            {faceData.edition}
          </p>
          <button
            className="cover-open-btn"
            style={{ marginTop: "24px" }}
            onClick={(e) => {
              e.stopPropagation();
              flipToSpread(0);
            }}
          >
            <RotateCcw size={14} style={{ marginRight: "6px", verticalAlign: "middle" }} />
            Replay Album
          </button>
        </div>
      );
    }

    // Table of contents / Prologue
    if (faceData.type === "toc") {
      return (
        <div className="page-toc">
          <span className="toc-kicker">Curatorial Index</span>
          <h3 className="toc-title">{faceData.galleryTitle}</h3>
          <p className="toc-intro">{faceData.description}</p>
          <div className="toc-list">
            <div className="toc-item" onClick={() => flipToSpread(1)}>
              <span className="toc-num">01</span>
              <span className="toc-label">The Solitary Hero</span>
              <span className="toc-page">Page 1</span>
            </div>
            {spreads.slice(2, 6).map((sp, idx) => (
              <div key={sp.id} className="toc-item" onClick={() => flipToSpread(sp.spreadIndex)}>
                <span className="toc-num">0{idx + 2}</span>
                <span className="toc-label">{sp.badge || sp.title}</span>
                <span className="toc-page">Spread {sp.spreadIndex}</span>
              </div>
            ))}
          </div>
          <div className="page-number" style={{ left: "24px" }}>
            ii
          </div>
        </div>
      );
    }

    // Single Full-Bleed Hero (Uncropped with ambient blur)
    if (faceData.type === "single_hero") {
      const p = faceData.photo;
      const media = getMediaUrl(p?.url || p);
      return (
        <>
          <div className="page-content">
            <div className="layout-single-hero">
              <div
                className="photo-frame"
                onClick={() => setLightboxPhoto(p)}
                title="Click to zoom image"
              >
                <div
                  className="ambient-blur-bg"
                  style={{ backgroundImage: `url(${media})` }}
                  aria-hidden="true"
                />
                <img src={media} alt={p?.title || "Hero Plate"} loading="lazy" />
              </div>
            </div>
          </div>
          <div className="page-number">{faceData.pageNumber}</div>
        </>
      );
    }

    // Dual Equal Stack (Top 50% & Bottom 50%)
    if (faceData.type === "dual_equal") {
      const [p1, p2] = faceData.photos || [];
      const m1 = getMediaUrl(p1?.url || p1);
      const m2 = getMediaUrl(p2?.url || p2);
      return (
        <>
          <div className="page-content">
            <div className="layout-dual-equal">
              {p1 && (
                <div
                  className="photo-frame"
                  onClick={() => setLightboxPhoto(p1)}
                  title="Click to zoom image"
                >
                  <div
                    className="ambient-blur-bg"
                    style={{ backgroundImage: `url(${m1})` }}
                    aria-hidden="true"
                  />
                  <img src={m1} alt={p1?.title || "Photo 1"} loading="lazy" />
                </div>
              )}
              {p2 && (
                <div
                  className="photo-frame"
                  onClick={() => setLightboxPhoto(p2)}
                  title="Click to zoom image"
                >
                  <div
                    className="ambient-blur-bg"
                    style={{ backgroundImage: `url(${m2})` }}
                    aria-hidden="true"
                  />
                  <img src={m2} alt={p2?.title || "Photo 2"} loading="lazy" />
                </div>
              )}
            </div>
          </div>
          <div className="page-number">{faceData.pageNumber}</div>
        </>
      );
    }

    // 2-Page Seamless Panorama Half
    if (faceData.type === "panorama_half") {
      const p = faceData.photo;
      const media = getMediaUrl(p?.url || p);
      const isLeft = faceData.side === "left";
      return (
        <>
          <div
            className={`page-spread-half ${isLeft ? "page-spread-left" : "page-spread-right"}`}
            onClick={() => setLightboxPhoto(p)}
            title="Click to view full panoramic photo"
          >
            <div
              className="ambient-blur-bg"
              style={{ backgroundImage: `url(${media})` }}
              aria-hidden="true"
            />
            <img src={media} alt={p?.title || "Panorama"} loading="lazy" />
          </div>
          <div
            className="page-number"
            style={{ color: "#ffffff", textShadow: "0 1px 4px rgba(0,0,0,0.8)" }}
          >
            {faceData.pageNumber}
          </div>
        </>
      );
    }

    return null;
  };

  const currentSpreadTitle = spreads[currentSpread]?.title || `Spread ${currentSpread}`;
  const progressPercent = totalLeaves > 0 ? (currentSpread / totalLeaves) * 100 : 0;

  return (
    <div
      className="post-book-modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label="Interactive Photobook Gallery"
    >
      {/* HEADER NAVIGATION */}
      <header>
        <div className="brand">
          <div className="brand-icon">
            <Sparkles size={22} />
          </div>
          <div>
            <span className="brand-title">{gallery?.title || "Lumen"}</span>
            <span className="brand-subtitle">Photobook Edition</span>
          </div>
        </div>

        <div className="header-actions">
          <button
            className={`header-btn ${drawerOpen ? "active" : ""}`}
            onClick={() => setDrawerOpen((prev) => !prev)}
            title="View all spreads in a visual filmstrip"
          >
            <Grid size={16} />
            <span>All Spreads</span>
          </button>

          <button
            className={`header-btn ${soundEnabled ? "active" : ""}`}
            onClick={() => setSoundEnabled((prev) => !prev)}
            title="Toggle page flip sound effect"
          >
            {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            <span>{soundEnabled ? "Audio On" : "Muted"}</span>
          </button>

          <button
            className={`header-btn ${autoPlay ? "active" : ""}`}
            onClick={() => setAutoPlay((prev) => !prev)}
            title="Auto-advance slideshow [Space]"
          >
            {autoPlay ? <Pause size={16} /> : <Play size={16} />}
            <span>{autoPlay ? "Pause" : "Auto Play"}</span>
          </button>

          <button
            className="header-btn close-btn"
            onClick={onClose}
            title="Close Book [Esc]"
          >
            <X size={16} />
            <span>Close</span>
          </button>
        </div>
      </header>

      {/* INTRO HERO SECTION */}
      <section className="gallery-intro">
        <div className="tag-badge">
          <span className="dot" />
          <span>{gallery?.category?.name || "Interactive Photobook Collection"}</span>
        </div>
        <h1 className="main-title">{gallery?.title || "Photobook Gallery"}</h1>
        <p className="intro-desc">
          {gallery?.description ||
            "A tactile digital photobook with seamless double-page panoramas and uncropped fine-art presentation. Click the page margins or arrow keys to turn."}
        </p>
      </section>

      {/* 3D REALISTIC BOOK STAGE */}
      <main className="book-stage">
        <div className="book-container" ref={bookContainerRef}>
          {/* Hardcover Back Plate & Drop Shadows */}
          <div className="book-shadow" />
          <div className="book-cover-base" />
          <div className="stacked-pages-left" />
          <div className="stacked-pages-right" />
          <div className="spine-ridge" />

          {/* Left & Right Hotspots */}
          <div
            className="flip-hotspot-left"
            onClick={prevSpread}
            title="Click to flip backward"
          >
            <div className="corner-curl-hint">
              <ChevronLeft size={18} />
            </div>
          </div>
          <div
            className="flip-hotspot-right"
            onClick={nextSpread}
            title="Click to flip forward"
          >
            <div className="corner-curl-hint">
              <ChevronRight size={18} />
            </div>
          </div>

          {/* PHYSICAL 3D LEAVES STACK */}
          {leaves.map((leaf, idx) => {
            const isFlipped = idx < currentSpread;
            const zIndex = isFlipped ? idx + 1 : totalLeaves - idx + 1;

            return (
              <div
                key={leaf.id}
                className={`book-leaf ${isFlipped ? "flipped" : ""}`}
                style={{ zIndex }}
              >
                {/* FRONT FACE (Right side when unflipped) */}
                <div
                  className={`page-face page-front ${
                    leaf.isCoverFront ? "cover-front" : ""
                  } ${leaf.front?.type === "panorama_half" ? "is-panorama-face" : ""}`}
                >
                  {renderFaceContent(leaf.front, true)}
                </div>

                {/* BACK FACE (Left side when flipped) */}
                <div
                  className={`page-face page-back ${
                    leaf.isCoverBack ? "cover-back" : ""
                  } ${leaf.back?.type === "panorama_half" ? "is-panorama-face" : ""}`}
                >
                  {renderFaceContent(leaf.back, false)}
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* NAVIGATION CONTROLS BAR */}
      <nav className="controls-bar">
        <div className="spread-indicator">{currentSpreadTitle}</div>

        <div
          className="progress-track"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const pct = (e.clientX - rect.left) / rect.width;
            const target = Math.min(totalLeaves, Math.max(0, Math.round(pct * totalLeaves)));
            flipToSpread(target);
          }}
          title="Click to jump to spread"
        >
          <div className="progress-fill" style={{ width: `${progressPercent}%` }} />
        </div>

        <div className="nav-buttons-cluster">
          <button
            className="nav-btn"
            onClick={prevSpread}
            disabled={currentSpread === 0}
            title="Previous Page (Left Arrow)"
          >
            <ChevronLeft size={22} />
          </button>

          <div className="dots-container">
            {Array.from({ length: totalLeaves + 1 }).map((_, idx) => (
              <button
                key={idx}
                className={`nav-dot ${idx === currentSpread ? "active" : ""}`}
                onClick={() => flipToSpread(idx)}
                aria-label={`Go to Spread ${idx}`}
              />
            ))}
          </div>

          <button
            className="nav-btn"
            onClick={nextSpread}
            disabled={currentSpread === totalLeaves}
            title="Next Page (Right Arrow)"
          >
            <ChevronRight size={22} />
          </button>
        </div>

        <div className="quick-actions">
          <span style={{ fontSize: "12px", color: "#8A8F9E" }}>
            💡 Tips: Use <strong>Left / Right Arrow keys</strong>, click outer margins to turn, or click any photo to zoom in!
          </span>
        </div>
      </nav>

      {/* ALL SPREADS FILMSTRIP DRAWER */}
      <div
        className={`drawer-overlay ${drawerOpen ? "active" : ""}`}
        onClick={() => setDrawerOpen(false)}
      />
      <aside className={`spreads-drawer ${drawerOpen ? "active" : ""}`}>
        <div className="drawer-header">
          <span className="drawer-title">Browse All Spreads (Filmstrip)</span>
          <button className="pill-action-btn" onClick={() => setDrawerOpen(false)}>
            ✕ Close
          </button>
        </div>
        <div className="drawer-grid">
          {spreads.map((spread) => {
            const isActive = spread.spreadIndex === currentSpread;
            const previewPhoto =
              spread.coverFront?.coverImage ||
              spread.leftPage?.photo?.url ||
              spread.rightPage?.photo?.url ||
              spread.rightPage?.photos?.[0]?.url ||
              gallery?.coverImage;

            return (
              <div
                key={spread.id}
                className={`drawer-card ${isActive ? "active" : ""}`}
                onClick={() => {
                  flipToSpread(spread.spreadIndex);
                  setDrawerOpen(false);
                }}
              >
                <div className="drawer-card-preview">
                  <img
                    src={getMediaUrl(previewPhoto)}
                    alt={spread.title}
                    loading="lazy"
                  />
                </div>
                <div className="drawer-card-title">{spread.badge || `Spread ${spread.spreadIndex}`}</div>
                <div className="drawer-card-sub">{spread.title}</div>
              </div>
            );
          })}
        </div>
      </aside>

      {/* LIGHTBOX ZOOM MODAL */}
      <div
        className={`lightbox-modal ${lightboxPhoto ? "active" : ""}`}
        onClick={() => setLightboxPhoto(null)}
      >
        <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
          <button
            className="lightbox-close-btn"
            onClick={() => setLightboxPhoto(null)}
          >
            ✕
          </button>
          <div className="lightbox-image-wrap">
            {lightboxPhoto && (
              <img
                src={getMediaUrl(lightboxPhoto.url || lightboxPhoto)}
                alt={lightboxPhoto.title || "Zoomed Photo"}
              />
            )}
          </div>
          <div className="lightbox-caption-bar">
            <div className="lightbox-info">
              <h3>{lightboxPhoto?.title || gallery?.title || "Archival Print"}</h3>
              <p>{lightboxPhoto?.caption || "High-resolution fine-art photograph."}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookGalleryLayout;

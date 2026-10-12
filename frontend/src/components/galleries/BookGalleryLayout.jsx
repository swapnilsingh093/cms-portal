import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import "./BookGalleryLayout.css";
import {
  BookOpen,
  LayoutGrid,
  Columns,
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  Layers,
  X,
  RotateCcw,
  Sparkles,
  ArrowRight
} from "lucide-react";

/**
 * Format image URL helper: prepends backend port 5001 if relative path
 */
const getImageUrl = (url) => {
  if (!url) return "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `http://localhost:5001${url.startsWith("/") ? "" : "/"}${url}`;
};

/**
 * Interactive 3D Photobook Layout Component for Single Gallery Detail
 */
const BookGalleryLayout = ({ gallery, onSwitchToStandard }) => {
  const [currentSpread, setCurrentSpread] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [autoPlay, setAutoPlay] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [lightboxData, setLightboxData] = useState(null); // { url, title, desc }

  const rootRef = useRef(null);
  const audioContextRef = useRef(null);
  const autoPlayTimerRef = useRef(null);

  // Photos from gallery
  const photos = useMemo(() => {
    if (!gallery || !Array.isArray(gallery.images)) return [];
    return gallery.images.filter((img) => img && img.url);
  }, [gallery]);

  // Synthesize realistic paper rustle flip sound via Web Audio API
  const playPageFlipSound = useCallback(() => {
    if (!soundEnabled) return;
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      if (ctx.state === "suspended") {
        ctx.resume();
      }

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

      const noiseNode = ctx.createBufferSource();
      noiseNode.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(1100, ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(280, ctx.currentTime + duration);

      const gainNode = ctx.createGain();
      gainNode.gain.setValueAtTime(0.45, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

      noiseNode.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(ctx.destination);

      noiseNode.start();
    } catch {
      // Graceful fallback
    }
  }, [soundEnabled]);

  /**
   * Structure photos into dynamically generated spreads and leaves
   * Leaf 0: Front Cover (Right) + Inside Prologue / TOC (Left)
   * Leaf 1..N: Photo spreads
   * Leaf Last: Final photo / Back cover
   */
  const { leaves, spreadsInfo } = useMemo(() => {
    const rawLeaves = [];
    const spreads = [];

    // Spread 0: Hardcover
    spreads.push({
      title: "Hardcover • " + (gallery?.title || "Gallery"),
      previewImg: getImageUrl(gallery?.coverImage || photos[0]?.url)
    });

    let photoIdx = 0;
    const totalPhotos = photos.length;

    // Pattern layouts for pages
    const layoutTypes = [
      "hero",
      "dual",
      "asymmetric",
      "panorama",
      "trio",
      "polaroids",
      "asymmetric-inv",
      "quad"
    ];
    let layoutCounter = 0;
    let pageNum = 1;

    // Build leaves while photos remain
    while (photoIdx < totalPhotos) {
      const remaining = totalPhotos - photoIdx;
      const chosenLayout = layoutTypes[layoutCounter % layoutTypes.length];
      layoutCounter++;

      // Check if Panorama (takes both sides of a spread)
      if (chosenLayout === "panorama" && remaining >= 1) {
        const panoPhoto = photos[photoIdx];
        photoIdx += 1;

        // Leaf A (Left page of panorama on back face)
        // Leaf B (Right page of panorama on front face)
        // If we need a front page before this panorama:
        const prevPagePhotos = [photos[photoIdx % totalPhotos]];
        
        rawLeaves.push({
          front: {
            type: "hero",
            photos: prevPagePhotos,
            pageNumber: pageNum++
          },
          back: {
            type: "panorama-left",
            photo: panoPhoto,
            pageNumber: pageNum++
          }
        });

        rawLeaves.push({
          front: {
            type: "panorama-right",
            photo: panoPhoto,
            pageNumber: pageNum++
          },
          back: {
            type: "dual",
            photos: [
              photos[(photoIdx++) % totalPhotos],
              photos[(photoIdx++) % totalPhotos]
            ].filter(Boolean),
            pageNumber: pageNum++
          }
        });

        spreads.push({
          title: `Spread • Pages ${pageNum - 3}–${pageNum - 2} • Panorama`,
          previewImg: getImageUrl(panoPhoto?.url)
        });
        continue;
      }

      // Standard Page Generation
      const getPhotosForType = (type) => {
        if (type === "hero") {
          const item = photos[photoIdx++];
          return item ? [item] : [];
        }
        if (type === "dual" || type === "asymmetric" || type === "asymmetric-inv" || type === "polaroids") {
          const p1 = photos[photoIdx++];
          const p2 = photos[photoIdx++];
          return [p1, p2].filter(Boolean);
        }
        if (type === "trio") {
          const p1 = photos[photoIdx++];
          const p2 = photos[photoIdx++];
          const p3 = photos[photoIdx++];
          return [p1, p2, p3].filter(Boolean);
        }
        if (type === "quad") {
          const p1 = photos[photoIdx++];
          const p2 = photos[photoIdx++];
          const p3 = photos[photoIdx++];
          const p4 = photos[photoIdx++];
          return [p1, p2, p3, p4].filter(Boolean);
        }
        const item = photos[photoIdx++];
        return item ? [item] : [];
      };

      const frontType = chosenLayout;
      const frontPhotos = getPhotosForType(frontType);

      let backType = layoutTypes[(layoutCounter + 1) % layoutTypes.length];
      if (backType === "panorama") backType = "dual";
      const backPhotos = getPhotosForType(backType);

      rawLeaves.push({
        front: {
          type: frontType,
          photos: frontPhotos,
          pageNumber: pageNum++
        },
        back: {
          type: backType,
          photos: backPhotos,
          pageNumber: pageNum++
        }
      });

      const repImg = frontPhotos[0]?.url || backPhotos[0]?.url || gallery?.coverImage;
      spreads.push({
        title: `Spread ${spreads.length} • Pages ${pageNum - 2} & ${pageNum - 1}`,
        previewImg: getImageUrl(repImg)
      });
    }

    // Ensure at least 3 leaves for a rich book feel
    if (rawLeaves.length === 0) {
      rawLeaves.push({
        front: {
          type: "hero",
          photos: [
            {
              url: gallery?.coverImage || gallery?.banner,
              title: gallery?.title || "Editorial Cover"
            }
          ],
          pageNumber: 1
        },
        back: {
          type: "dual",
          photos: [
            { url: gallery?.coverImage, title: "Plate I" },
            { url: gallery?.banner, title: "Plate II" }
          ],
          pageNumber: 2
        }
      });
      spreads.push({
        title: "Spread 1 • Featured Collection",
        previewImg: getImageUrl(gallery?.coverImage)
      });
    }

    // Add Final Endplate / Back Cover Spread
    spreads.push({
      title: "Back Cover • End of Collection",
      previewImg: getImageUrl(gallery?.coverImage || photos[0]?.url)
    });

    return { leaves: rawLeaves, spreadsInfo: spreads };
  }, [photos, gallery]);

  const totalLeaves = leaves.length + 1; // Leaf 0 (Cover) + Content Leaves

  // Page Flip Action
  const flipToSpread = useCallback(
    (targetIndex) => {
      const nextIndex = Math.max(0, Math.min(totalLeaves, targetIndex));
      if (nextIndex === currentSpread) return;
      playPageFlipSound();
      setCurrentSpread(nextIndex);
    },
    [currentSpread, totalLeaves, playPageFlipSound]
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

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "ArrowRight") nextSpread();
      if (e.key === "ArrowLeft") prevSpread();
      if (e.key === "Escape") {
        setLightboxData(null);
        setDrawerOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [nextSpread, prevSpread]);

  // Autoplay loop
  useEffect(() => {
    if (autoPlay) {
      autoPlayTimerRef.current = setInterval(() => {
        setCurrentSpread((prev) => {
          if (prev >= totalLeaves) {
            return 0; // Loop back
          }
          return prev + 1;
        });
        playPageFlipSound();
      }, 4200);
    } else {
      if (autoPlayTimerRef.current) clearInterval(autoPlayTimerRef.current);
    }
    return () => {
      if (autoPlayTimerRef.current) clearInterval(autoPlayTimerRef.current);
    };
  }, [autoPlay, totalLeaves, playPageFlipSound]);

  // Fullscreen Toggle
  const toggleFullscreen = () => {
    if (!isFullscreen) {
      if (rootRef.current?.requestFullscreen) {
        rootRef.current.requestFullscreen().catch(() => {});
      }
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const onFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  // Helper to open lightbox
  const openZoom = (photo) => {
    if (!photo || !photo.url) return;
    setLightboxData({
      url: getImageUrl(photo.url),
      title: photo.title || gallery?.title || "Archival Photograph",
      caption: photo.caption || "High-resolution study from the album collection."
    });
  };

  // Helper renderer for page faces based on layout type
  const renderPageLayout = (layoutData) => {
    if (!layoutData) return null;
    const { type, photos: pagePhotos, photo, pageNumber } = layoutData;

    if (type === "panorama-left") {
      return (
        <div
          className="page-spread-half page-spread-left"
          onClick={() => openZoom(photo)}
          title="Click to zoom panorama"
        >
          <img src={getImageUrl(photo?.url)} alt={photo?.title || "Panorama"} loading="lazy" />
          <div className="page-number" style={{ color: "#fff", textShadow: "0 1px 4px rgba(0,0,0,0.8)" }}>
            {pageNumber}
          </div>
        </div>
      );
    }

    if (type === "panorama-right") {
      return (
        <div
          className="page-spread-half page-spread-right"
          onClick={() => openZoom(photo)}
          title="Click to zoom panorama"
        >
          <img src={getImageUrl(photo?.url)} alt={photo?.title || "Panorama"} loading="lazy" />
          <div className="page-number" style={{ color: "#fff", textShadow: "0 1px 4px rgba(0,0,0,0.8)" }}>
            {pageNumber}
          </div>
        </div>
      );
    }

    if (type === "hero" || !pagePhotos || pagePhotos.length <= 1) {
      const p = (pagePhotos && pagePhotos[0]) || { url: gallery?.coverImage };
      return (
        <div className="page-content">
          <div className="layout-single-hero">
            <div className="photo-frame" onClick={() => openZoom(p)} title="Click to zoom">
              <img src={getImageUrl(p?.url)} alt={p?.title || "Photo Plate"} loading="lazy" />
            </div>
          </div>
          <div className="page-number">{pageNumber}</div>
        </div>
      );
    }

    if (type === "dual" || type === "scrapbook" || type === "zigzag") {
      return (
        <div className="page-content">
          <div className="layout-dual-equal">
            {pagePhotos.slice(0, 2).map((p, idx) => (
              <div key={idx} className="photo-frame" onClick={() => openZoom(p)} title="Click to zoom">
                <img src={getImageUrl(p?.url)} alt={p?.title || "Plate"} loading="lazy" />
              </div>
            ))}
          </div>
          <div className="page-number">{pageNumber}</div>
        </div>
      );
    }

    if (type === "asymmetric") {
      return (
        <div className="page-content">
          <div className="layout-asymmetric-duo">
            {pagePhotos.slice(0, 2).map((p, idx) => (
              <div key={idx} className="photo-frame" onClick={() => openZoom(p)} title="Click to zoom">
                <img src={getImageUrl(p?.url)} alt={p?.title || "Plate"} loading="lazy" />
              </div>
            ))}
          </div>
          <div className="page-number">{pageNumber}</div>
        </div>
      );
    }

    if (type === "asymmetric-inv") {
      return (
        <div className="page-content">
          <div className="layout-asymmetric-duo-inverted">
            {pagePhotos.slice(0, 2).map((p, idx) => (
              <div key={idx} className="photo-frame" onClick={() => openZoom(p)} title="Click to zoom">
                <img src={getImageUrl(p?.url)} alt={p?.title || "Plate"} loading="lazy" />
              </div>
            ))}
          </div>
          <div className="page-number">{pageNumber}</div>
        </div>
      );
    }

    if (type === "trio") {
      const lead = pagePhotos[0];
      const stack = pagePhotos.slice(1, 3);
      return (
        <div className="page-content">
          <div className="layout-trio">
            <div className="lead-col">
              <div className="photo-frame" style={{ height: "100%" }} onClick={() => openZoom(lead)}>
                <img src={getImageUrl(lead?.url)} alt={lead?.title || "Plate"} loading="lazy" />
              </div>
            </div>
            <div className="stack-col">
              {stack.map((p, idx) => (
                <div key={idx} className="photo-frame" onClick={() => openZoom(p)}>
                  <img src={getImageUrl(p?.url)} alt={p?.title || "Plate"} loading="lazy" />
                </div>
              ))}
            </div>
          </div>
          <div className="page-number">{pageNumber}</div>
        </div>
      );
    }

    if (type === "polaroids") {
      return (
        <div className="page-content">
          <div className="layout-polaroids">
            {pagePhotos.slice(0, 2).map((p, idx) => (
              <div
                key={idx}
                className={`polaroid-card polaroid-${idx + 1}`}
                onClick={() => openZoom(p)}
                title="Click to zoom"
              >
                <div className="polaroid-img">
                  <img src={getImageUrl(p?.url)} alt={p?.title || "Polaroid"} loading="lazy" />
                </div>
                <div className="polaroid-caption">{p?.title || `Plate ${idx + 1}`}</div>
              </div>
            ))}
          </div>
          <div className="page-number">{pageNumber}</div>
        </div>
      );
    }

    if (type === "quad") {
      return (
        <div className="page-content">
          <div className="layout-quad">
            {pagePhotos.slice(0, 4).map((p, idx) => (
              <div key={idx} className="photo-frame" onClick={() => openZoom(p)} title="Click to zoom">
                <img src={getImageUrl(p?.url)} alt={p?.title || "Quad"} loading="lazy" />
              </div>
            ))}
          </div>
          <div className="page-number">{pageNumber}</div>
        </div>
      );
    }

    // Default Fallback
    return (
      <div className="page-content">
        <div className="layout-single-hero">
          <div className="photo-frame" onClick={() => openZoom(pagePhotos[0])}>
            <img src={getImageUrl(pagePhotos[0]?.url)} alt="Plate" loading="lazy" />
          </div>
        </div>
        <div className="page-number">{pageNumber}</div>
      </div>
    );
  };

  const progressPct = totalLeaves > 0 ? (currentSpread / totalLeaves) * 100 : 0;
  const currentSpreadName = spreadsInfo[currentSpread]?.title || `Spread ${currentSpread}`;

  return (
    <div
      ref={rootRef}
      className={`book-gallery-root ${isFullscreen ? "is-fullscreen" : ""}`}
    >
      {/* ================= HEADER NAVIGATION ================= */}
      <header className="book-gallery-header">
        <button
          type="button"
          className="book-gallery-brand"
          onClick={() => flipToSpread(0)}
          title="Return to Cover"
        >
          <div className="book-gallery-brand-icon">
            <BookOpen size={22} />
          </div>
          <div>
            <span className="book-gallery-brand-title">{gallery?.title || "Photobook"}</span>
            <span className="book-gallery-brand-subtitle">Interactive 3D Photobook Edition</span>
          </div>
        </button>

        <div className="book-gallery-header-actions">
          {/* Direct Switch to Standard View */}
          <button
            type="button"
            className="book-header-btn btn-return-standard"
            onClick={onSwitchToStandard}
            title="Switch back to standard grid and masonry stream view"
          >
            <Columns size={15} />
            <span>Standard Layout</span>
          </button>

          {/* Spreads Drawer Filmstrip Toggle */}
          <button
            type="button"
            className="book-header-btn"
            onClick={() => setDrawerOpen(true)}
            title="View all spreads in a visual filmstrip"
          >
            <Layers size={16} />
            <span>All Spreads</span>
          </button>

          {/* Sound Toggle */}
          <button
            type="button"
            className={`book-header-btn ${soundEnabled ? "active" : ""}`}
            onClick={() => setSoundEnabled(!soundEnabled)}
            title="Toggle realistic paper flip sound"
          >
            {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            <span>{soundEnabled ? "Audio On" : "Audio Off"}</span>
          </button>

          {/* Auto Play */}
          <button
            type="button"
            className={`book-header-btn ${autoPlay ? "active" : ""}`}
            onClick={() => setAutoPlay(!autoPlay)}
            title="Auto-advance photobook pages"
          >
            {autoPlay ? <Pause size={15} /> : <Play size={15} />}
            <span>{autoPlay ? "Pause" : "Auto Play"}</span>
          </button>

          {/* Fullscreen */}
          <button
            type="button"
            className="book-header-btn"
            onClick={toggleFullscreen}
            title="Toggle Fullscreen Mode"
          >
            {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
        </div>
      </header>

      {/* ================= INTRO TITLE ================= */}
      <section className="book-gallery-intro">
        <div className="book-tag-badge">
          <span className="dot"></span>
          <span>{gallery?.category?.name || "Art & Photography"} • Interactive Photobook</span>
        </div>
        <h1 className="book-main-title">{gallery?.title || "Untitled Gallery"}</h1>
        <p className="book-intro-desc">
          {gallery?.shortDescription ||
            "A tactile digital photobook. Click the margins, navigation arrows, or flip hotspots to turn pages."}
        </p>
      </section>

      {/* ================= 3D REALISTIC BOOK STAGE ================= */}
      <main className="book-stage">
        <div className="book-container">
          {/* Hardcover Base, Drop Shadows & Spine */}
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
            <div className="corner-curl-hint">❮</div>
          </div>
          <div
            className="flip-hotspot-right"
            onClick={nextSpread}
            title="Click to flip forward"
          >
            <div className="corner-curl-hint">❯</div>
          </div>

          {/* ========================================================
               LEAF 0: HARDCOVER FRONT (OUTER) + TABLE OF CONTENTS (INNER)
               ======================================================== */}
          {(() => {
            const isFlipped = currentSpread > 0;
            const zIndex = isFlipped ? 1 : totalLeaves + 1;
            return (
              <div
                className={`book-leaf ${isFlipped ? "flipped" : ""}`}
                style={{ zIndex }}
              >
                {/* Front Face: Hardcover Front */}
                <div className="page-face page-front cover-front">
                  <div className="cover-emboss-border" />
                  <div className="cover-badge">
                    {gallery?.category?.name || "Curated Edition"} • Vol. I
                  </div>
                  <h2 className="cover-headline">{gallery?.title || "Photobook Collection"}</h2>
                  <p className="cover-sub">
                    {gallery?.shortDescription ||
                      "Archival photography collection. Exploring light, landscape, and visual harmony."}
                  </p>

                  <div style={{ marginTop: "28px", display: "flex", alignItems: "center", gap: "12px" }}>
                    <div style={{ width: "42px", height: "1px", background: "rgba(240, 190, 110, 0.7)" }} />
                    <span
                      style={{
                        fontSize: "11px",
                        letterSpacing: "0.16em",
                        textTransform: "uppercase",
                        color: "#E8B975",
                        fontWeight: 700
                      }}
                    >
                      {photos.length} High-Res Frames
                    </span>
                  </div>

                  <div className="cover-bottom">
                    <span style={{ fontSize: "12px", color: "#D5CEE5" }}>
                      CMS Portal Editions • {new Date().getFullYear()}
                    </span>
                    <button
                      type="button"
                      className="cover-open-btn"
                      onClick={() => flipToSpread(1)}
                    >
                      Open Book ➔
                    </button>
                  </div>
                </div>

                {/* Back Face: Table of Contents / Index */}
                <div className="page-face page-back toc-page">
                  <div className="page-toc">
                    <span className="toc-kicker">Curatorial Index</span>
                    <h3 className="toc-title">{gallery?.title || "Exhibition Index"}</h3>
                    <p className="toc-intro">
                      Collection of {photos.length} archival photographic plates arranged across dynamic editorial layouts.
                    </p>

                    <div className="toc-list">
                      {spreadsInfo.slice(1, spreadsInfo.length - 1).map((sp, idx) => (
                        <div
                          key={idx}
                          className="toc-item"
                          onClick={() => flipToSpread(idx + 1)}
                        >
                          <span className="toc-num">{String(idx + 1).padStart(2, "0")}</span>
                          <span className="toc-label">
                            {photos[idx]?.title || sp.title.replace(/^Spread \d+ • /, "")}
                          </span>
                          <span className="toc-page">Spread {idx + 1}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="page-number">ii</div>
                </div>
              </div>
            );
          })()}

          {/* ========================================================
               LEAVES 1..N: DYNAMIC PHOTO SPREADS
               ======================================================== */}
          {leaves.map((leaf, index) => {
            const leafIndex = index + 1; // 1-based index (0 is cover)
            const isFlipped = currentSpread >= leafIndex;
            // Realistic z-indices: flipped leaves stack with higher index on top
            const zIndex = isFlipped ? leafIndex + 1 : totalLeaves - leafIndex + 1;

            return (
              <div
                key={index}
                className={`book-leaf ${isFlipped ? "flipped" : ""}`}
                style={{ zIndex }}
              >
                {/* Front Face (Right page of spread) */}
                <div className="page-face page-front">
                  {renderPageLayout(leaf.front)}
                </div>

                {/* Back Face (Left page of next spread when flipped) */}
                <div className="page-face page-back">
                  {renderPageLayout(leaf.back)}
                </div>
              </div>
            );
          })}

          {/* ========================================================
               LAST LEAF: FINAL PHOTO / BACK COVER
               ======================================================== */}
          {(() => {
            const isFlipped = currentSpread >= totalLeaves;
            const zIndex = isFlipped ? totalLeaves + 2 : 1;
            return (
              <div
                className={`book-leaf ${isFlipped ? "flipped" : ""}`}
                style={{ zIndex }}
              >
                <div className="page-face page-front cover-back">
                  <div className="cover-back-emblem">
                    <Sparkles size={32} />
                  </div>
                  <h3
                    style={{
                      fontFamily: "'Bricolage Grotesque', sans-serif",
                      fontSize: "24px",
                      fontWeight: 800,
                      marginBottom: "8px",
                      color: "#fff"
                    }}
                  >
                    End of Collection
                  </h3>
                  <p
                    style={{
                      fontSize: "14px",
                      color: "#A3A8BA",
                      maxWidth: "280px",
                      lineHeight: "1.5",
                      marginBottom: "24px"
                    }}
                  >
                    You have browsed all {photos.length} plates in &ldquo;{gallery?.title}&rdquo;.
                  </p>

                  <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", justifyContent: "center" }}>
                    <button
                      type="button"
                      className="pill-action-btn"
                      onClick={() => flipToSpread(0)}
                    >
                      <RotateCcw size={14} /> Front Cover
                    </button>
                    <button
                      type="button"
                      className="pill-action-btn"
                      style={{ background: "var(--accent)", color: "#111", borderColor: "var(--accent)" }}
                      onClick={onSwitchToStandard}
                    >
                      <Columns size={14} /> Standard View
                    </button>
                  </div>
                </div>

                <div className="page-face page-back cover-back">
                  <span style={{ fontSize: "12px", color: "#64748b" }}>Back Cover Plate</span>
                </div>
              </div>
            );
          })()}
        </div>
      </main>

      {/* ================= NAVIGATION BAR & PROGRESS ================= */}
      <nav className="book-controls-bar">
        {/* Spread Title Indicator */}
        <div className="spread-indicator">{currentSpreadName}</div>

        {/* Progress Track */}
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${progressPct}%` }} />
        </div>

        {/* Navigation Cluster */}
        <div className="nav-buttons-cluster">
          <button
            type="button"
            className="book-nav-btn"
            onClick={prevSpread}
            disabled={currentSpread === 0}
            title="Turn backward (Left Arrow)"
          >
            <ChevronLeft size={24} />
          </button>

          {/* Dots Indicator */}
          <div className="dots-container">
            {Array.from({ length: totalLeaves + 1 }).map((_, idx) => (
              <button
                key={idx}
                type="button"
                className={`nav-dot ${idx === currentSpread ? "active" : ""}`}
                onClick={() => flipToSpread(idx)}
                title={`Go to Spread ${idx}`}
              />
            ))}
          </div>

          <button
            type="button"
            className="book-nav-btn"
            onClick={nextSpread}
            disabled={currentSpread >= totalLeaves}
            title="Turn forward (Right Arrow)"
          >
            <ChevronRight size={24} />
          </button>
        </div>

        {/* Helpful Tips Pill */}
        <div className="quick-actions">
          <span style={{ fontSize: "12px", color: "#8A8F9E" }}>
            💡 Tips: Use <strong>Left / Right Arrow keys</strong>, click the book margins, or click any photo to zoom in!
          </span>
        </div>
      </nav>

      {/* ================= LIGHTBOX ZOOM MODAL ================= */}
      {lightboxData && (
        <div
          className="book-lightbox-modal active"
          onClick={() => setLightboxData(null)}
        >
          <div
            className="book-lightbox-content"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="book-lightbox-close-btn"
              onClick={() => setLightboxData(null)}
              title="Close zoom preview"
            >
              <X size={20} />
            </button>
            <div className="book-lightbox-image-wrap">
              <img src={lightboxData.url} alt={lightboxData.title} />
            </div>
            <div className="book-lightbox-caption-bar">
              <div className="book-lightbox-info">
                <h3>{lightboxData.title}</h3>
                <p>{lightboxData.caption}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= SPREADS FILMSTRIP DRAWER ================= */}
      <div
        className={`book-drawer-overlay ${drawerOpen ? "active" : ""}`}
        onClick={() => setDrawerOpen(false)}
      />
      <aside className={`book-spreads-drawer ${drawerOpen ? "active" : ""}`}>
        <div className="book-drawer-header">
          <span className="book-drawer-title">Browse All Spreads (Filmstrip)</span>
          <button
            type="button"
            className="pill-action-btn"
            onClick={() => setDrawerOpen(false)}
          >
            <X size={14} /> Close
          </button>
        </div>
        <div className="book-drawer-grid">
          {spreadsInfo.map((sp, idx) => (
            <div
              key={idx}
              className={`book-drawer-card ${idx === currentSpread ? "active" : ""}`}
              onClick={() => {
                flipToSpread(idx);
                setDrawerOpen(false);
              }}
            >
              <div className="book-drawer-card-preview">
                <img src={sp.previewImg} alt={sp.title} />
              </div>
              <div className="book-drawer-card-title">{sp.title}</div>
              <div className="book-drawer-card-sub">{idx === 0 ? "Cover" : idx === spreadsInfo.length - 1 ? "End" : `Spread ${idx}`}</div>
            </div>
          ))}
        </div>
      </aside>
    </div>
  );
};

export default BookGalleryLayout;

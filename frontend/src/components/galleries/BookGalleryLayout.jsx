import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import "./BookGalleryLayout.css";
import {
  X,
  Layers,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Maximize2,
  Minimize2,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Sparkles,
  BookOpen
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
 * Interactive 3D Photobook Modal Engine (1:1 Replica from post-book-layout)
 */
const BookGalleryLayout = ({ gallery, onClose }) => {
  const [currentSpread, setCurrentSpread] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [autoPlay, setAutoPlay] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [lightboxData, setLightboxData] = useState(null); // { url, title, desc }

  const containerRef = useRef(null);
  const bookContainerRef = useRef(null);
  const audioContextRef = useRef(null);
  const autoPlayTimerRef = useRef(null);
  const flipTimerRef = useRef(null);
  const currentSpreadRef = useRef(0);

  // Photos from gallery
  const photos = useMemo(() => {
    if (!gallery || !Array.isArray(gallery.images)) return [];
    return gallery.images.filter((img) => img && img.url);
  }, [gallery]);

  // Lock body scroll when popup is open
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  // Web Audio synthetic paper rustle flip sound
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

    while (photoIdx < totalPhotos) {
      const remaining = totalPhotos - photoIdx;
      const chosenLayout = layoutTypes[layoutCounter % layoutTypes.length];
      layoutCounter++;

      if (chosenLayout === "panorama" && remaining >= 1) {
        const panoPhoto = photos[photoIdx++];
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

    spreads.push({
      title: "Back Cover • End of Collection",
      previewImg: getImageUrl(gallery?.coverImage || photos[0]?.url)
    });

    return { leaves: rawLeaves, spreadsInfo: spreads };
  }, [photos, gallery]);

  const totalLeaves = leaves.length + 1; // Leaf 0 (Cover) + Content Leaves

  /**
   * FLIP ENGINE: Direct hardware-accelerated DOM mutation (matches book.js exactly for 60 FPS)
   */
  const flipToSpread = useCallback(
    (targetIndex) => {
      const nextIndex = Math.max(0, Math.min(totalLeaves, targetIndex));
      if (nextIndex === currentSpreadRef.current) return;

      const leafElements = bookContainerRef.current?.querySelectorAll(".book-leaf");
      if (!leafElements || leafElements.length === 0) return;

      const isMovingForward = nextIndex > currentSpreadRef.current;
      const prevIndex = currentSpreadRef.current;

      currentSpreadRef.current = nextIndex;
      setCurrentSpread(nextIndex); // Update react state for UI dots and progress

      playPageFlipSound();

      leafElements.forEach((leaf, i) => {
        const isFlipped = i < nextIndex;

        // Calculate realistic z-indices
        let zIndex = isFlipped ? i + 1 : totalLeaves - i + 1;

        // Elevate the moving leaf during transition so it renders above static stacks
        const isMoving = isMovingForward
          ? i >= prevIndex && i < nextIndex
          : i >= nextIndex && i < prevIndex;

        if (isMoving) {
          zIndex = 60 + Math.abs(i - nextIndex);
        }

        leaf.style.zIndex = zIndex;

        // Stagger flipping for multi-page jumps
        const delay = isMoving
          ? isMovingForward
            ? (i - prevIndex) * 90
            : (prevIndex - 1 - i) * 90
          : 0;

        leaf.style.transitionDelay = `${delay}ms`;

        if (isFlipped) {
          leaf.classList.add("flipped");
        } else {
          leaf.classList.remove("flipped");
        }
      });

      // Reset z-indices cleanly after flip completes
      if (flipTimerRef.current) clearTimeout(flipTimerRef.current);
      flipTimerRef.current = setTimeout(() => {
        leafElements.forEach((leaf, i) => {
          const isFlipped = i < nextIndex;
          leaf.style.zIndex = isFlipped ? i + 1 : totalLeaves - i + 1;
          leaf.style.transitionDelay = "0ms";
        });
      }, 1200);
    },
    [totalLeaves, playPageFlipSound]
  );

  const nextSpread = useCallback(() => {
    if (currentSpreadRef.current < totalLeaves) {
      flipToSpread(currentSpreadRef.current + 1);
    }
  }, [totalLeaves, flipToSpread]);

  const prevSpread = useCallback(() => {
    if (currentSpreadRef.current > 0) {
      flipToSpread(currentSpreadRef.current - 1);
    }
  }, [flipToSpread]);

  // Initial leaf z-index setup on mount
  useEffect(() => {
    const leafElements = bookContainerRef.current?.querySelectorAll(".book-leaf");
    if (leafElements) {
      leafElements.forEach((leaf, i) => {
        const isFlipped = i < currentSpreadRef.current;
        leaf.style.zIndex = isFlipped ? i + 1 : totalLeaves - i + 1;
        leaf.style.transitionDelay = "0ms";
      });
    }
  }, [totalLeaves]);

  // Keyboard navigation & Escape to close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "ArrowRight") nextSpread();
      if (e.key === "ArrowLeft") prevSpread();
      if (e.key === "Escape") {
        if (lightboxData) {
          setLightboxData(null);
        } else if (drawerOpen) {
          setDrawerOpen(false);
        } else {
          onClose?.();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [nextSpread, prevSpread, lightboxData, drawerOpen, onClose]);

  // Autoplay loop
  useEffect(() => {
    if (autoPlay) {
      autoPlayTimerRef.current = setInterval(() => {
        if (currentSpreadRef.current >= totalLeaves) {
          flipToSpread(0);
        } else {
          flipToSpread(currentSpreadRef.current + 1);
        }
      }, 4200);
    } else {
      if (autoPlayTimerRef.current) clearInterval(autoPlayTimerRef.current);
    }
    return () => {
      if (autoPlayTimerRef.current) clearInterval(autoPlayTimerRef.current);
    };
  }, [autoPlay, totalLeaves, flipToSpread]);

  // Fullscreen Toggle
  const toggleFullscreen = () => {
    if (!isFullscreen) {
      if (containerRef.current?.requestFullscreen) {
        containerRef.current.requestFullscreen().catch(() => {});
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

  const openZoom = (photo) => {
    if (!photo || !photo.url) return;
    setLightboxData({
      url: getImageUrl(photo.url),
      title: photo.title || gallery?.title || "Archival Photograph",
      caption: photo.caption || "Curated photographic plate • High resolution archival print."
    });
  };

  // Renderer for page contents
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
    <div className="book-popup-backdrop" ref={containerRef}>
      <div className="book-popup-container">
        {/* ================= HEADER NAVIGATION ================= */}
        <header className="book-header">
          <button
            type="button"
            className="book-brand"
            onClick={() => flipToSpread(0)}
            title="Return to Cover"
          >
            <div className="book-brand-icon">
              <BookOpen size={22} />
            </div>
            <div>
              <span className="book-brand-title">{gallery?.title || "Photobook"}</span>
              <span className="book-brand-subtitle">Interactive 3D Photobook Edition</span>
            </div>
          </button>

          <div className="book-header-actions">
            {/* Filmstrip Drawer Toggle */}
            <button
              type="button"
              className="book-btn"
              onClick={() => setDrawerOpen(true)}
              title="View all spreads in a visual filmstrip"
            >
              <Layers size={16} />
              <span>All Spreads</span>
            </button>

            {/* Sound Toggle */}
            <button
              type="button"
              className={`book-btn ${soundEnabled ? "active" : ""}`}
              onClick={() => setSoundEnabled(!soundEnabled)}
              title="Toggle realistic paper flip sound"
            >
              {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
              <span>{soundEnabled ? "Audio On" : "Audio Off"}</span>
            </button>

            {/* Auto Play */}
            <button
              type="button"
              className={`book-btn ${autoPlay ? "active" : ""}`}
              onClick={() => setAutoPlay(!autoPlay)}
              title="Auto-advance photobook pages"
            >
              {autoPlay ? <Pause size={15} /> : <Play size={15} />}
              <span>{autoPlay ? "Pause" : "Auto Play"}</span>
            </button>

            {/* Fullscreen */}
            <button
              type="button"
              className="book-btn"
              onClick={toggleFullscreen}
              title="Toggle Fullscreen"
            >
              {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>

            {/* Close Popup / Return to Standard View */}
            <button
              type="button"
              className="book-btn btn-close"
              onClick={onClose}
              title="Close book and return to standard gallery page"
            >
              <X size={16} />
              <span>Close Book</span>
            </button>
          </div>
        </header>

        {/* ================= INTRO TITLE SECTION ================= */}
        <section className="book-gallery-intro">
          <div className="book-tag-badge">
            <span className="dot"></span>
            <span>{gallery?.category?.name || "Art & Photography"} • Interactive Photobook</span>
          </div>
          <h1 className="book-main-title">{gallery?.title || "Fifty Frames from a Single Season"}</h1>
          <p className="book-intro-desc">
            {gallery?.shortDescription ||
              "A tactile digital book exploring light, solitude, and vast horizons. Click the book margins, drag or use arrow keys to turn pages."}
          </p>
        </section>

        {/* ================= 3D REALISTIC BOOK STAGE ================= */}
        <main className="book-stage">
          <div className="book-container" ref={bookContainerRef}>
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
            <div className="book-leaf" id="leaf0">
              {/* Front Face: Hardcover Front */}
              <div className="page-face page-front cover-front">
                <div className="cover-emboss-border" />
                <div className="cover-badge">
                  {gallery?.category?.name || "Lumen Journal"} • Vol. I
                </div>
                <h2 className="cover-headline">{gallery?.title || "Photobook Edition"}</h2>
                <p className="cover-sub">
                  {gallery?.shortDescription ||
                    "Archival photography across seasons of light, quiet coastlines, and morning fog."}
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
                    Lumen Edition • {new Date().getFullYear()}
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

            {/* ========================================================
                 LEAVES 1..N: DYNAMIC PHOTO SPREADS
                 ======================================================== */}
            {leaves.map((leaf, index) => (
              <div key={index} className="book-leaf" id={`leaf${index + 1}`}>
                {/* Front Face (Right page of spread) */}
                <div className="page-face page-front">
                  {renderPageLayout(leaf.front)}
                </div>

                {/* Back Face (Left page of next spread when flipped) */}
                <div className="page-face page-back">
                  {renderPageLayout(leaf.back)}
                </div>
              </div>
            ))}

            {/* ========================================================
                 LAST LEAF: BACK COVER / ENDPLATE
                 ======================================================== */}
            <div className="book-leaf" id={`leaf${totalLeaves}`}>
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
                    onClick={onClose}
                  >
                    Close Book
                  </button>
                </div>
              </div>

              <div className="page-face page-back cover-back">
                <span style={{ fontSize: "12px", color: "#64748b" }}>Back Cover Plate</span>
              </div>
            </div>
          </div>
        </main>

        {/* ================= NAVIGATION BAR & PROGRESS ================= */}
        <nav className="controls-bar">
          <div className="spread-indicator">{currentSpreadName}</div>

          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${progressPct}%` }} />
          </div>

          <div className="nav-buttons-cluster">
            <button
              type="button"
              className="nav-btn"
              onClick={prevSpread}
              disabled={currentSpread === 0}
              title="Turn backward (Left Arrow)"
            >
              <ChevronLeft size={24} />
            </button>

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
              className="nav-btn"
              onClick={nextSpread}
              disabled={currentSpread >= totalLeaves}
              title="Turn forward (Right Arrow)"
            >
              <ChevronRight size={24} />
            </button>
          </div>

          <div className="quick-actions">
            <span style={{ fontSize: "12px", color: "#8A8F9E" }}>
              💡 Tips: Use <strong>Left / Right Arrow keys</strong>, click the book margins, or click any photo to zoom in!
            </span>
          </div>
        </nav>

        {/* ================= LIGHTBOX ZOOM MODAL ================= */}
        {lightboxData && (
          <div
            className="lightbox-modal active"
            onClick={() => setLightboxData(null)}
          >
            <div
              className="lightbox-content"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                className="lightbox-close-btn"
                onClick={() => setLightboxData(null)}
                title="Close zoom preview"
              >
                <X size={20} />
              </button>
              <div className="lightbox-image-wrap">
                <img src={lightboxData.url} alt={lightboxData.title} />
              </div>
              <div className="lightbox-caption-bar">
                <div className="lightbox-info">
                  <h3>{lightboxData.title}</h3>
                  <p>{lightboxData.caption}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= SPREADS FILMSTRIP DRAWER ================= */}
        <div
          className={`drawer-overlay ${drawerOpen ? "active" : ""}`}
          onClick={() => setDrawerOpen(false)}
        />
        <aside className={`spreads-drawer ${drawerOpen ? "active" : ""}`}>
          <div className="drawer-header">
            <span className="drawer-title">Browse All Spreads (Filmstrip)</span>
            <button
              type="button"
              className="pill-action-btn"
              onClick={() => setDrawerOpen(false)}
            >
              ✕ Close
            </button>
          </div>
          <div className="drawer-grid">
            {spreadsInfo.map((sp, idx) => (
              <div
                key={idx}
                className={`drawer-card ${idx === currentSpread ? "active" : ""}`}
                onClick={() => {
                  flipToSpread(idx);
                  setDrawerOpen(false);
                }}
              >
                <div className="drawer-card-preview">
                  <img src={sp.previewImg} alt={sp.title} />
                </div>
                <div className="drawer-card-title">{sp.title}</div>
                <div className="drawer-card-sub">
                  {idx === 0 ? "Cover" : idx === spreadsInfo.length - 1 ? "End" : `Spread ${idx}`}
                </div>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
};

export default BookGalleryLayout;

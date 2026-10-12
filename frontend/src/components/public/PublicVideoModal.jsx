import React, { useState, useEffect, useRef } from "react";
import { X, Film, ExternalLink, Lock, LogIn, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const PREVIEW_LIMIT_SECONDS = 20;

const PublicVideoModal = ({ isOpen, onClose, video }) => {
  const navigate = useNavigate();
  const { isAuthenticated, openAuthModal } = useAuth();

  const videoRef = useRef(null);
  const [previewExpired, setPreviewExpired] = useState(false);
  const [screenshotUrl, setScreenshotUrl] = useState("");
  const [playbackTime, setPlaybackTime] = useState(0);

  // Reset states on open/video change
  useEffect(() => {
    if (isOpen) {
      setPreviewExpired(false);
      setScreenshotUrl("");
      setPlaybackTime(0);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen, video]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  const videoSrc = video?.videoUrl || (video?.videoFile ? `/uploads/videos/${video.videoFile}` : "");
  const posterImg = video?.poster || video?.thumbnail || video?.banner || "";
  const isExternalEmbed = videoSrc && (videoSrc.includes("youtube.com") || videoSrc.includes("youtu.be") || videoSrc.includes("vimeo.com"));

  const getEmbedUrl = (url) => {
    if (url.includes("youtube.com/watch?v=")) {
      return url.replace("watch?v=", "embed/") + "?autoplay=1";
    }
    if (url.includes("youtu.be/")) {
      const id = url.split("youtu.be/")[1]?.split("?")[0];
      return `https://www.youtube.com/embed/${id}?autoplay=1`;
    }
    if (url.includes("vimeo.com/")) {
      const id = url.split("vimeo.com/")[1]?.split("?")[0];
      return `https://player.vimeo.com/video/${id}?autoplay=1`;
    }
    return url;
  };

  // Timer limit for external embeds (YouTube/Vimeo)
  useEffect(() => {
    if (!isOpen || isAuthenticated || !isExternalEmbed || previewExpired) return;
    const timer = setTimeout(() => {
      setScreenshotUrl(posterImg);
      setPreviewExpired(true);
    }, PREVIEW_LIMIT_SECONDS * 1000);

    return () => clearTimeout(timer);
  }, [isOpen, isAuthenticated, isExternalEmbed, previewExpired, posterImg]);

  // HTML5 Video Playback & 20s Frame Capture
  const handleTimeUpdate = () => {
    if (isAuthenticated || previewExpired || !videoRef.current) return;

    const current = videoRef.current.currentTime;
    setPlaybackTime(Math.floor(current));

    if (current >= PREVIEW_LIMIT_SECONDS) {
      // 1. Immediately pause the video
      videoRef.current.pause();

      // 2. Capture latest frame from the video element into a Canvas screenshot
      try {
        const videoEl = videoRef.current;
        const canvas = document.createElement("canvas");
        canvas.width = videoEl.videoWidth || 640;
        canvas.height = videoEl.videoHeight || 360;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
        const frameDataUrl = canvas.toDataURL("image/jpeg", 0.85);
        setScreenshotUrl(frameDataUrl);
      } catch (err) {
        // Fallback to poster if cross-origin tainted canvas
        console.warn("Screenshot canvas fallback:", err.message);
        setScreenshotUrl(posterImg);
      }

      // 3. Mark preview expired to show the Auth Wall
      setPreviewExpired(true);
    }
  };

  const handleLoginClick = () => {
    onClose();
    openAuthModal("login", `Sign in to watch the full video: "${video?.title || ""}"`, `/videos/${video.slug}`);
  };

  const handleGoToDetails = () => {
    if (!isAuthenticated) {
      onClose();
      openAuthModal("login", `Please sign in to access full video details`, `/videos/${video.slug}`);
      return;
    }
    onClose();
    if (video?.slug) navigate(`/video/${video.slug}`);
  };

  if (!isOpen || !video) return null;

  return (
    <div
      className="modal-backdrop"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "rgba(5, 8, 16, 0.88)",
        backdropFilter: "blur(12px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        animation: "fadeIn 0.2s ease-out"
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "920px",
          background: "#0d1322",
          borderRadius: "16px",
          border: "1px solid rgba(255, 255, 255, 0.12)",
          boxShadow: "0 25px 60px -15px rgba(0, 0, 0, 0.8), 0 0 40px var(--g-accent, rgba(99, 102, 241, 0.2))",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          position: "relative"
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: "16px 22px",
            background: "linear-gradient(90deg, #111827 0%, #161f36 100%)",
            borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "16px"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
            <div
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "8px",
                background: "var(--g-accent, rgba(99, 102, 241, 0.18))",
                color: "#818cf8",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0
              }}
            >
              <Film size={18} />
            </div>
            <h3
              style={{
                margin: 0,
                fontSize: "1.05rem",
                fontWeight: 600,
                color: "var(--text-main, #f8fafc)",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis"
              }}
            >
              {video?.title || ""}
            </h3>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
            {/* Free Preview Indicator for Unauthenticated Visitors */}
            {!isAuthenticated && !previewExpired && (
              <div style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                background: "rgba(245, 158, 11, 0.15)",
                border: "1px solid rgba(245, 158, 11, 0.35)",
                color: "#fbbf24",
                padding: "4px 10px",
                borderRadius: "9999px",
                fontSize: "0.76rem",
                fontWeight: 600
              }}>
                <Clock size={12} />
                <span>Preview: {Math.max(0, PREVIEW_LIMIT_SECONDS - playbackTime)}s left</span>
              </div>
            )}

            <button
              onClick={handleGoToDetails}
              className="btn-secondary"
              style={{
                padding: "6px 12px",
                fontSize: "0.8rem",
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                gap: "6px"
              }}
              title="Open full single video page"
            >
              <ExternalLink size={13} /> Full Page
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: "rgba(255, 255, 255, 0.06)",
                border: "none",
                borderRadius: "8px",
                width: "32px",
                height: "32px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--text-muted, #94a3b8)",
                cursor: "pointer",
                transition: "all 0.2s"
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Video Player Frame with 20s Paywall Overlay */}
        <div style={{ background: "#000", position: "relative", width: "100%", minHeight: "360px", maxHeight: "540px", display: "flex", alignItems: "center", justifyContent: "center" }}>
          {isExternalEmbed ? (
            <iframe
              src={getEmbedUrl(videoSrc)}
              title={video?.title || "Video"}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              style={{ width: "100%", height: "500px", border: "none" }}
            />
          ) : videoSrc ? (
            <video
              ref={videoRef}
              src={videoSrc}
              controls={!previewExpired}
              autoPlay
              playsInline
              poster={posterImg}
              onTimeUpdate={handleTimeUpdate}
              style={{ width: "100%", maxHeight: "520px", display: "block", outline: "none" }}
            >
              Your browser does not support HTML5 video playback.
            </video>
          ) : (
            <div style={{ padding: "60px 20px", textAlign: "center", color: "#64748b" }}>
              <Film size={44} style={{ opacity: 0.3, marginBottom: "12px" }} />
              <p style={{ margin: 0 }}>No playable video stream found for this video.</p>
            </div>
          )}

          {/* 20-Second Preview Limit Screenshot Auth Wall Overlay */}
          {previewExpired && (
            <div style={{
              position: "absolute",
              inset: 0,
              zIndex: 50,
              backgroundImage: screenshotUrl ? `url("${screenshotUrl}")` : (posterImg ? `url("${posterImg}")` : "none"),
              backgroundSize: "cover",
              backgroundPosition: "center",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "24px"
            }}>
              {/* Blurred Backdrop Overlay */}
              <div style={{
                position: "absolute",
                inset: 0,
                background: "radial-gradient(circle at center, rgba(10, 13, 24, 0.88) 0%, rgba(5, 7, 14, 0.98) 100%)",
                backdropFilter: "blur(12px)"
              }} />

              {/* Paywall Card */}
              <div style={{
                position: "relative",
                zIndex: 2,
                maxWidth: "460px",
                width: "100%",
                textAlign: "center",
                background: "rgba(17, 24, 39, 0.94)",
                border: "1px solid rgba(255, 255, 255, 0.18)",
                boxShadow: "0 25px 60px rgba(0, 0, 0, 0.8), 0 0 35px rgba(239, 68, 68, 0.25)",
                borderRadius: "18px",
                padding: "36px 30px"
              }}>
                <div style={{
                  width: "58px",
                  height: "58px",
                  borderRadius: "16px",
                  background: "linear-gradient(135deg, #ef4444, #f59e0b)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 16px",
                  color: "#fff",
                  boxShadow: "0 8px 24px rgba(239, 68, 68, 0.45)"
                }}>
                  <Lock size={28} />
                </div>

                <h3 style={{ fontSize: "1.35rem", fontWeight: 800, color: "#ffffff", margin: "0 0 10px" }}>
                  Free Preview Ended ({PREVIEW_LIMIT_SECONDS}s)
                </h3>

                <p style={{ fontSize: "0.92rem", color: "#94a3b8", lineHeight: 1.55, margin: "0 0 24px" }}>
                  To continue watching the complete video in high definition, please sign in to your account or register for free.
                </p>

                <button
                  type="button"
                  onClick={handleLoginClick}
                  className="button button-primary"
                  style={{
                    width: "100%",
                    padding: "13px 20px",
                    fontSize: "1rem",
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "10px",
                    borderRadius: "10px"
                  }}
                >
                  <LogIn size={18} /> Sign In / Register to Continue
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Video Footer info */}
        {video?.description && (
          <div style={{ padding: "16px 22px", background: "#090e18", borderTop: "1px solid rgba(255, 255, 255, 0.06)" }}>
            <p style={{ margin: 0, fontSize: "0.88rem", color: "var(--text-muted, #94a3b8)", lineHeight: 1.5 }}>
              {video?.description}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PublicVideoModal;

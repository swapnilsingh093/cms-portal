import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Volume2,
  Volume1,
  VolumeX,
  Maximize,
  Minimize,
  Gauge,
  Tv,
  Check,
  ShieldCheck,
  Expand,
  Shrink
} from "lucide-react";

/**
 * Format seconds to MM:SS or HH:MM:SS
 */
const formatTime = (seconds) => {
  if (isNaN(seconds) || seconds < 0) return "00:00";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const pad = (n) => (n < 10 ? `0${n}` : `${n}`);
  if (h > 0) {
    return `${h}:${pad(m)}:${pad(s)}`;
  }
  return `${pad(m)}:${pad(s)}`;
};

const SPEED_OPTIONS = [0.5, 0.75, 1, 1.25, 1.5, 2];

const CinemaVideoPlayer = ({
  src,
  poster,
  title = "Video",
  onPlayStateChange,
  isTheaterMode = false,
  onToggleTheater
}) => {
  const containerRef = useRef(null);
  const videoRef = useRef(null);
  const timelineRef = useRef(null);
  const controlsTimeoutRef = useRef(null);

  // Player state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fitMode, setFitMode] = useState("contain"); // 'contain' (fit) or 'cover' (fill)
  const [isControlsVisible, setIsControlsVisible] = useState(true);
  const [isSpeedMenuOpen, setIsSpeedMenuOpen] = useState(false);

  // Timeline hover state
  const [hoverTime, setHoverTime] = useState(null);
  const [hoverPosition, setHoverPosition] = useState(0);
  const [isScrubbing, setIsScrubbing] = useState(false);

  // Center feedback badge (e.g. +10s, Pause, Play, etc.)
  const [feedbackBadge, setFeedbackBadge] = useState(null);
  const badgeTimeoutRef = useRef(null);

  const triggerBadge = useCallback((icon, text) => {
    if (badgeTimeoutRef.current) clearTimeout(badgeTimeoutRef.current);
    setFeedbackBadge({ icon, text });
    badgeTimeoutRef.current = setTimeout(() => {
      setFeedbackBadge(null);
    }, 700);
  }, []);

  // Controls visibility management
  const showControls = useCallback(() => {
    setIsControlsVisible(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => {
        setIsControlsVisible(false);
        setIsSpeedMenuOpen(false);
      }, 2600);
    }
  }, [isPlaying]);

  const handleMouseMove = () => {
    showControls();
  };

  const handleMouseLeave = () => {
    if (isPlaying && !isSpeedMenuOpen) {
      setIsControlsVisible(false);
    }
  };

  // Play / Pause toggle
  const togglePlay = useCallback(() => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play().then(() => {
        setIsPlaying(true);
        triggerBadge("play", "Play");
        if (onPlayStateChange) onPlayStateChange(true);
      }).catch(() => {});
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
      triggerBadge("pause", "Pause");
      if (onPlayStateChange) onPlayStateChange(false);
    }
  }, [onPlayStateChange, triggerBadge]);

  // Jump by seconds
  const seekRelative = useCallback((seconds) => {
    if (!videoRef.current) return;
    const newTime = Math.min(Math.max(videoRef.current.currentTime + seconds, 0), duration || 0);
    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
    if (seconds > 0) {
      triggerBadge("forward", `+${seconds}s`);
    } else {
      triggerBadge("rewind", `${seconds}s`);
    }
    showControls();
  }, [duration, triggerBadge, showControls]);

  // Volume & Mute
  const handleVolumeChange = (newVol) => {
    if (!videoRef.current) return;
    const clamped = Math.max(0, Math.min(1, newVol));
    videoRef.current.volume = clamped;
    setVolume(clamped);
    if (clamped === 0) {
      setIsMuted(true);
      videoRef.current.muted = true;
    } else if (isMuted) {
      setIsMuted(false);
      videoRef.current.muted = false;
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    if (isMuted) {
      videoRef.current.muted = false;
      setIsMuted(false);
      triggerBadge("volume", `${Math.round(volume * 100)}%`);
    } else {
      videoRef.current.muted = true;
      setIsMuted(true);
      triggerBadge("mute", "Muted");
    }
  };

  // Playback speed
  const changeSpeed = (speed) => {
    if (!videoRef.current) return;
    videoRef.current.playbackRate = speed;
    setPlaybackSpeed(speed);
    setIsSpeedMenuOpen(false);
    triggerBadge("speed", `${speed}x Speed`);
  };

  // Fullscreen
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen();
      } else if (containerRef.current.webkitRequestFullscreen) {
        containerRef.current.webkitRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      }
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
    };
  }, []);

  // Time & Buffer updates
  const handleTimeUpdate = () => {
    if (!videoRef.current || isScrubbing) return;
    setCurrentTime(videoRef.current.currentTime);

    // Update buffer progress
    if (videoRef.current.buffered.length > 0) {
      const bufferedEnd = videoRef.current.buffered.end(videoRef.current.buffered.length - 1);
      const totalDuration = videoRef.current.duration || 1;
      setBuffered(Math.min(1, bufferedEnd / totalDuration));
    }
  };

  const handleLoadedMetadata = () => {
    if (!videoRef.current) return;
    setDuration(videoRef.current.duration);
    setCurrentTime(videoRef.current.currentTime);
  };

  // Timeline Scrubbing
  const calculateScrubTime = (e) => {
    if (!timelineRef.current || !duration) return 0;
    const rect = timelineRef.current.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    return { time: pos * duration, percentage: pos * 100 };
  };

  const handleTimelineMouseMove = (e) => {
    const result = calculateScrubTime(e);
    if (result) {
      setHoverTime(result.time);
      setHoverPosition(result.percentage);
    }
  };

  const handleTimelineMouseLeave = () => {
    setHoverTime(null);
  };

  const handleTimelineClick = (e) => {
    const result = calculateScrubTime(e);
    if (result && videoRef.current) {
      videoRef.current.currentTime = result.time;
      setCurrentTime(result.time);
    }
  };

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't intercept if user is typing in an input/textarea
      if (["INPUT", "TEXTAREA"].includes(document.activeElement?.tagName)) return;

      const key = e.key.toLowerCase();
      if (key === " " || key === "k") {
        e.preventDefault();
        togglePlay();
      } else if (key === "arrowleft" || key === "j") {
        e.preventDefault();
        seekRelative(-10);
      } else if (key === "arrowright" || key === "l") {
        e.preventDefault();
        seekRelative(10);
      } else if (key === "arrowup") {
        e.preventDefault();
        handleVolumeChange(volume + 0.1);
        triggerBadge("volume", `${Math.round(Math.min(1, volume + 0.1) * 100)}%`);
      } else if (key === "arrowdown") {
        e.preventDefault();
        handleVolumeChange(volume - 0.1);
        triggerBadge("volume", `${Math.round(Math.max(0, volume - 0.1) * 100)}%`);
      } else if (key === "m") {
        e.preventDefault();
        toggleMute();
      } else if (key === "f") {
        e.preventDefault();
        toggleFullscreen();
      } else if (key === "t" && onToggleTheater) {
        e.preventDefault();
        onToggleTheater();
      } else if ((e.ctrlKey || e.metaKey) && (key === "s" || key === "u")) {
        // Block browser save/source shortcut
        e.preventDefault();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [togglePlay, seekRelative, volume, onToggleTheater]);

  const progressPercent = duration ? (currentTime / duration) * 100 : 0;
  const bufferedPercent = buffered * 100;

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onContextMenu={(e) => e.preventDefault()}
      style={{
        position: "relative",
        width: "100%",
        aspectRatio: isFullscreen ? "unset" : "16 / 9",
        height: isFullscreen ? "100vh" : "auto",
        maxHeight: isFullscreen ? "100vh" : "calc(88vh - 40px)",
        background: "#030712",
        borderRadius: isFullscreen ? "0" : "16px",
        overflow: "hidden",
        boxShadow: "0 25px 60px -15px rgba(0, 0, 0, 0.9), 0 0 40px rgba(99, 102, 241, 0.15)",
        border: isFullscreen ? "none" : "1px solid rgba(255, 255, 255, 0.08)",
        userSelect: "none",
        transition: "border-radius 0.3s ease",
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
      }}
    >
      {/* ── 1. Dynamic Ambient Glowing Backdrop ── */}
      {poster && (
        <div
          style={{
            position: "absolute",
            inset: -40,
            backgroundImage: `url(${poster})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            filter: "blur(45px) brightness(0.35) saturate(1.5)",
            transform: "scale(1.2)",
            zIndex: 1,
            pointerEvents: "none",
            opacity: 0.9
          }}
        />
      )}

      {/* ── 2. HTML5 Video Element (Protected / No Native Controls) ── */}
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        controls={false}
        playsInline
        disablePictureInPicture={true}
        controlsList="nodownload nofullscreen noremoteplayback"
        onContextMenu={(e) => e.preventDefault()}
        onDragStart={(e) => e.preventDefault()}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => {
          setIsPlaying(false);
          if (onPlayStateChange) onPlayStateChange(false);
        }}
        style={{
          position: "relative",
          zIndex: 2,
          width: "100%",
          height: "100%",
          objectFit: fitMode,
          background: "transparent",
          pointerEvents: "none" // All clicks routed through transparent shield
        }}
      >
        Your browser does not support HTML5 video playback.
      </video>

      {/* ── 3. Transparent Security Click Shield (Anti-Download Layer) ── */}
      <div
        onClick={togglePlay}
        onDoubleClick={toggleFullscreen}
        onContextMenu={(e) => e.preventDefault()}
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 4,
          cursor: isControlsVisible ? "pointer" : "none"
        }}
      />

      {/* ── 4. Initial Play Button Overlay (when video hasn't started) ── */}
      {!isPlaying && currentTime === 0 && (
        <div
          onClick={togglePlay}
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 5,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: "linear-gradient(180deg, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.6) 100%)",
            cursor: "pointer"
          }}
        >
          {/* Big pulsing play badge */}
          <div
            style={{
              width: "86px",
              height: "86px",
              borderRadius: "50%",
              background: "rgba(99, 102, 241, 0.85)",
              backdropFilter: "blur(12px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "3px solid rgba(255, 255, 255, 0.4)",
              boxShadow: "0 0 40px rgba(99, 102, 241, 0.6), 0 10px 30px rgba(0, 0, 0, 0.7)",
              transition: "transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.25s ease",
              paddingLeft: "6px"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "scale(1.14)";
              e.currentTarget.style.boxShadow = "0 0 50px rgba(99, 102, 241, 0.9), 0 12px 35px rgba(0,0,0,0.8)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "scale(1)";
              e.currentTarget.style.boxShadow = "0 0 40px rgba(99, 102, 241, 0.6), 0 10px 30px rgba(0, 0, 0, 0.7)";
            }}
          >
            <Play size={42} color="#ffffff" fill="#ffffff" />
          </div>

          <div
            style={{
              marginTop: "20px",
              color: "#ffffff",
              fontSize: "1.05rem",
              fontWeight: 700,
              letterSpacing: "0.02em",
              textShadow: "0 2px 10px rgba(0,0,0,0.8)",
              background: "rgba(10, 15, 28, 0.6)",
              padding: "6px 18px",
              borderRadius: "20px",
              backdropFilter: "blur(8px)",
              border: "1px solid rgba(255, 255, 255, 0.15)"
            }}
          >
            Click to Play in High Definition
          </div>
        </div>
      )}

      {/* ── 5. Center Action Ripple Badge (Feedback on Click / Shortcut) ── */}
      {feedbackBadge && (
        <div
          style={{
            position: "absolute",
            zIndex: 6,
            display: "flex",
            alignItems: "center",
            gap: "10px",
            background: "rgba(15, 23, 42, 0.85)",
            backdropFilter: "blur(14px)",
            border: "1px solid rgba(255, 255, 255, 0.2)",
            padding: "14px 24px",
            borderRadius: "50px",
            color: "#ffffff",
            fontSize: "1rem",
            fontWeight: 700,
            boxShadow: "0 10px 30px rgba(0, 0, 0, 0.6)",
            pointerEvents: "none",
            animation: "popFade 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards"
          }}
        >
          {feedbackBadge.icon === "play" && <Play size={20} fill="#fff" />}
          {feedbackBadge.icon === "pause" && <Pause size={20} fill="#fff" />}
          {feedbackBadge.icon === "forward" && <RotateCw size={20} />}
          {feedbackBadge.icon === "rewind" && <RotateCcw size={20} />}
          {feedbackBadge.icon === "volume" && <Volume2 size={20} />}
          {feedbackBadge.icon === "mute" && <VolumeX size={20} />}
          {feedbackBadge.icon === "speed" && <Gauge size={20} />}
          <span>{feedbackBadge.text}</span>
        </div>
      )}

      {/* ── 6. Top Bar: Protected Stream Watermark Badge & Fit Toggle ── */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 7,
          padding: "16px 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "linear-gradient(180deg, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0) 100%)",
          opacity: isControlsVisible ? 1 : 0,
          transition: "opacity 0.3s ease",
          pointerEvents: isControlsVisible ? "auto" : "none"
        }}
      >
        {/* Anti-Download DRM Protected Badge */}
        <div
          title="Encrypted & Protected Media Stream - Direct Download Blocked"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "7px",
            background: "rgba(15, 23, 42, 0.75)",
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(99, 102, 241, 0.35)",
            padding: "5px 12px",
            borderRadius: "20px",
            fontSize: "11px",
            fontWeight: 700,
            color: "#c7d2fe",
            boxShadow: "0 4px 12px rgba(0,0,0,0.4)"
          }}
        >
          <ShieldCheck size={14} color="#818cf8" />
          <span>Protected Stream</span>
        </div>

        {/* Fit Mode Toggle */}
        <button
          type="button"
          onClick={() => setFitMode((m) => (m === "contain" ? "cover" : "contain"))}
          title={fitMode === "contain" ? "Switch to Fill Screen (Crop to 16:9)" : "Switch to Fit Screen (Original Aspect)"}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            background: "rgba(15, 23, 42, 0.75)",
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(255, 255, 255, 0.2)",
            padding: "5px 13px",
            borderRadius: "20px",
            fontSize: "11px",
            fontWeight: 600,
            color: "#ffffff",
            cursor: "pointer",
            transition: "all 0.2s"
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(99, 102, 241, 0.3)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(15, 23, 42, 0.75)")}
        >
          {fitMode === "contain" ? (
            <>
              <Expand size={13} />
              <span>Fill Screen</span>
            </>
          ) : (
            <>
              <Shrink size={13} />
              <span>Fit Screen</span>
            </>
          )}
        </button>
      </div>

      {/* ── 7. Bottom Control Dock (Glassmorphism & High-Def UI) ── */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 8,
          padding: "24px 20px 14px",
          background: "linear-gradient(0deg, rgba(3, 7, 18, 0.95) 0%, rgba(3, 7, 18, 0.6) 70%, rgba(0,0,0,0) 100%)",
          opacity: isControlsVisible ? 1 : 0,
          transform: isControlsVisible ? "translateY(0)" : "translateY(10px)",
          transition: "opacity 0.3s ease, transform 0.3s ease",
          pointerEvents: isControlsVisible ? "auto" : "none"
        }}
      >
        {/* ── Timeline / Scrubber Bar ── */}
        <div
          ref={timelineRef}
          onClick={handleTimelineClick}
          onMouseMove={handleTimelineMouseMove}
          onMouseLeave={handleTimelineMouseLeave}
          style={{
            position: "relative",
            width: "100%",
            height: "22px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center"
          }}
        >
          {/* Timeline Track Background */}
          <div
            style={{
              position: "relative",
              width: "100%",
              height: "5px",
              background: "rgba(255, 255, 255, 0.2)",
              borderRadius: "4px",
              overflow: "hidden",
              transition: "height 0.15s ease"
            }}
            onMouseEnter={(e) => (e.currentTarget.style.height = "7px")}
            onMouseLeave={(e) => (e.currentTarget.style.height = "5px")}
          >
            {/* Buffered Progress */}
            <div
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                bottom: 0,
                width: `${bufferedPercent}%`,
                background: "rgba(255, 255, 255, 0.35)",
                borderRadius: "4px"
              }}
            />

            {/* Current Play Progress */}
            <div
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                bottom: 0,
                width: `${progressPercent}%`,
                background: "linear-gradient(90deg, #6366f1, #38bdf8)",
                borderRadius: "4px"
              }}
            />
          </div>

          {/* Glowing Scrub Thumb */}
          <div
            style={{
              position: "absolute",
              left: `${progressPercent}%`,
              transform: "translateX(-50%)",
              width: "14px",
              height: "14px",
              borderRadius: "50%",
              background: "#38bdf8",
              boxShadow: "0 0 10px rgba(56, 189, 248, 0.9), 0 0 2px #fff",
              border: "2px solid #ffffff",
              pointerEvents: "none",
              transition: "transform 0.1s ease"
            }}
          />

          {/* Hover Time Tooltip */}
          {hoverTime !== null && (
            <div
              style={{
                position: "absolute",
                left: `${hoverPosition}%`,
                bottom: "22px",
                transform: "translateX(-50%)",
                background: "rgba(15, 23, 42, 0.95)",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                color: "#ffffff",
                fontSize: "11px",
                fontWeight: 700,
                padding: "3px 8px",
                borderRadius: "6px",
                pointerEvents: "none",
                whiteSpace: "nowrap",
                boxShadow: "0 4px 12px rgba(0,0,0,0.5)"
              }}
            >
              {formatTime(hoverTime)}
            </div>
          )}
        </div>

        {/* ── Control Buttons Toolbar ── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: "6px",
            color: "#ffffff"
          }}
        >
          {/* Left Controls: Play, 10s Rewind/Forward, Volume, Time */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            {/* Play / Pause Button */}
            <button
              type="button"
              onClick={togglePlay}
              title={isPlaying ? "Pause (Space/k)" : "Play (Space/k)"}
              style={iconBtnStyle}
            >
              {isPlaying ? <Pause size={20} fill="#fff" /> : <Play size={20} fill="#fff" />}
            </button>

            {/* 10s Rewind */}
            <button
              type="button"
              onClick={() => seekRelative(-10)}
              title="Rewind 10s (Left Arrow/j)"
              style={iconBtnStyle}
            >
              <RotateCcw size={18} />
            </button>

            {/* 10s Forward */}
            <button
              type="button"
              onClick={() => seekRelative(10)}
              title="Forward 10s (Right Arrow/l)"
              style={iconBtnStyle}
            >
              <RotateCw size={18} />
            </button>

            {/* Volume Control Dock */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px"
              }}
            >
              <button
                type="button"
                onClick={toggleMute}
                title={isMuted ? "Unmute (m)" : "Mute (m)"}
                style={iconBtnStyle}
              >
                {isMuted || volume === 0 ? (
                  <VolumeX size={19} color="#f87171" />
                ) : volume < 0.5 ? (
                  <Volume1 size={19} />
                ) : (
                  <Volume2 size={19} />
                )}
              </button>

              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={isMuted ? 0 : volume}
                onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                title={`Volume: ${Math.round((isMuted ? 0 : volume) * 100)}%`}
                style={{
                  width: "68px",
                  height: "4px",
                  accentColor: "#6366f1",
                  cursor: "pointer"
                }}
              />
            </div>

            {/* Time Stamp (Monospace) */}
            <div
              style={{
                fontSize: "12px",
                fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, monospace",
                color: "#e2e8f0",
                marginLeft: "4px",
                fontWeight: 500
              }}
            >
              <span>{formatTime(currentTime)}</span>
              <span style={{ color: "#64748b", margin: "0 5px" }}>/</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Right Controls: Speed Selector, Theater Mode, Fullscreen */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px", position: "relative" }}>
            {/* Speed Selector Popup Trigger */}
            <div style={{ position: "relative" }}>
              <button
                type="button"
                onClick={() => setIsSpeedMenuOpen((prev) => !prev)}
                title="Playback Speed"
                style={{
                  ...iconBtnStyle,
                  fontSize: "12px",
                  fontWeight: 700,
                  padding: "4px 8px",
                  background: isSpeedMenuOpen ? "rgba(99, 102, 241, 0.4)" : "rgba(255, 255, 255, 0.08)",
                  borderRadius: "6px"
                }}
              >
                {playbackSpeed}x
              </button>

              {/* Speed Dropdown Menu */}
              {isSpeedMenuOpen && (
                <div
                  style={{
                    position: "absolute",
                    bottom: "38px",
                    right: 0,
                    background: "rgba(15, 23, 42, 0.95)",
                    backdropFilter: "blur(14px)",
                    border: "1px solid rgba(255, 255, 255, 0.15)",
                    borderRadius: "10px",
                    padding: "6px",
                    boxShadow: "0 10px 25px rgba(0, 0, 0, 0.7)",
                    zIndex: 20,
                    minWidth: "110px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "2px"
                  }}
                >
                  <div
                    style={{
                      fontSize: "10px",
                      color: "#94a3b8",
                      padding: "4px 8px",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      fontWeight: 700
                    }}
                  >
                    Speed
                  </div>
                  {SPEED_OPTIONS.map((speed) => (
                    <button
                      key={speed}
                      type="button"
                      onClick={() => changeSpeed(speed)}
                      style={{
                        background: playbackSpeed === speed ? "rgba(99, 102, 241, 0.3)" : "transparent",
                        border: "none",
                        color: playbackSpeed === speed ? "#818cf8" : "#f1f5f9",
                        padding: "6px 10px",
                        borderRadius: "6px",
                        fontSize: "12px",
                        fontWeight: 600,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        textAlign: "left"
                      }}
                      onMouseEnter={(e) => {
                        if (playbackSpeed !== speed) e.currentTarget.style.background = "rgba(255,255,255,0.06)";
                      }}
                      onMouseLeave={(e) => {
                        if (playbackSpeed !== speed) e.currentTarget.style.background = "transparent";
                      }}
                    >
                      <span>{speed === 1 ? "Normal (1x)" : `${speed}x`}</span>
                      {playbackSpeed === speed && <Check size={13} color="#818cf8" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Theater Mode Button */}
            {onToggleTheater && (
              <button
                type="button"
                onClick={onToggleTheater}
                title={isTheaterMode ? "Default View (t)" : "Theater Mode (t)"}
                style={{
                  ...iconBtnStyle,
                  color: isTheaterMode ? "#818cf8" : "#ffffff"
                }}
              >
                <Tv size={18} />
              </button>
            )}

            {/* Fullscreen Button */}
            <button
              type="button"
              onClick={toggleFullscreen}
              title={isFullscreen ? "Exit Fullscreen (f)" : "Fullscreen (f)"}
              style={iconBtnStyle}
            >
              {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const iconBtnStyle = {
  background: "none",
  border: "none",
  color: "#ffffff",
  cursor: "pointer",
  padding: "6px",
  borderRadius: "8px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  transition: "all 0.15s ease",
  outline: "none"
};

export default CinemaVideoPlayer;

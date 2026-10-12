import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  Sparkles,
  RotateCcw,
  Volume2,
  VolumeX,
  ZoomIn,
  X,
  Scroll,
  Layers,
  FileText,
  ArrowRight,
  Clock,
  User,
  Bookmark,
  SunDim,
  Type
} from "lucide-react";
import { postAPI } from "../../services/api";

/**
 * Photorealistic Spiral Ring Coil Wire Binding (matches spiral notebook look)
 * Supports both center crease (2-page spread) and left edge (closed cover & single-page)
 */
function SpiralCoilBinding({ height = 620, isEdge = false }) {
  const pitch = 22; // Distance between each coil ring in px
  const ringCount = Math.max(10, Math.floor((height - 24) / pitch));
  const rings = Array.from({ length: ringCount });

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        bottom: 0,
        left: isEdge ? "-13px" : "calc(50% - 17px)",
        width: isEdge ? "38px" : "34px",
        pointerEvents: "none",
        zIndex: 35,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "space-evenly",
        padding: "16px 0",
        boxSizing: "border-box"
      }}
      aria-hidden="true"
    >
      {/* Background gutter shadow */}
      <div
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          left: isEdge ? "14px" : "50%",
          transform: isEdge ? "none" : "translateX(-50%)",
          width: isEdge ? "20px" : "28px",
          background: isEdge
            ? "linear-gradient(90deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.12) 60%, transparent 100%)"
            : "linear-gradient(90deg, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0.22) 45%, rgba(0,0,0,0.22) 55%, rgba(0,0,0,0.08) 100%)",
          filter: "blur(1px)",
          zIndex: 1
        }}
      />

      <svg
        width={isEdge ? "38" : "34"}
        height={height}
        viewBox={`0 0 ${isEdge ? "38" : "34"} ${height}`}
        style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", zIndex: 2 }}
      >
        <defs>
          {/* Metallic 3D wire gradient for spiral coil */}
          <linearGradient id="spiralCoilGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#64748b" />
            <stop offset="25%" stopColor="#1e293b" />
            <stop offset="50%" stopColor="#cbd5e1" />
            <stop offset="75%" stopColor="#0f172a" />
            <stop offset="100%" stopColor="#020617" />
          </linearGradient>

          {/* Punched hole inner shadow */}
          <radialGradient id="holeGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#0f172a" />
            <stop offset="70%" stopColor="#020617" />
            <stop offset="100%" stopColor="#1e293b" />
          </radialGradient>

          {/* Wire drop shadow */}
          <filter id="coilShadow" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="1" dy="2.5" stdDeviation="1.5" floodColor="rgba(0,0,0,0.5)" />
          </filter>
        </defs>

        {rings.map((_, idx) => {
          const y = 16 + idx * pitch;
          if (isEdge) {
            return (
              <g key={idx}>
                {/* Punched hole in paper / cover surface */}
                <rect
                  x="20"
                  y={y}
                  width="6"
                  height="11"
                  rx="3"
                  fill="url(#holeGrad)"
                  stroke="rgba(0,0,0,0.45)"
                  strokeWidth="0.8"
                />
                <line
                  x1="21"
                  y1={y + 11}
                  x2="25"
                  y2={y + 11}
                  stroke="rgba(255,255,255,0.3)"
                  strokeWidth="0.7"
                />

                {/* Rear wire loop curve extending behind edge */}
                <path
                  d={`M 2 ${y + 10} C 4 ${y + 15}, 14 ${y + 14}, 23 ${y + 9}`}
                  fill="none"
                  stroke="#111827"
                  strokeWidth="2.8"
                  strokeLinecap="round"
                  opacity="0.75"
                />

                {/* Front 3D Metallic Wire Coil looping over the edge and into the punched hole */}
                <path
                  d={`M 1 ${y + 8} C 3 ${y - 6}, 14 ${y - 5}, 24 ${y + 4}`}
                  fill="none"
                  stroke="url(#spiralCoilGrad)"
                  strokeWidth="3.4"
                  strokeLinecap="round"
                  filter="url(#coilShadow)"
                />

                {/* Glossy metallic highlight crest */}
                <path
                  d={`M 3 ${y + 6} C 6 ${y - 7}, 15 ${y - 6}, 22 ${y + 3}`}
                  fill="none"
                  stroke="rgba(255,255,255,0.65)"
                  strokeWidth="0.9"
                  strokeLinecap="round"
                />
              </g>
            );
          }

          // Center crease mode (spread)
          return (
            <g key={idx}>
              {/* Left punched hole */}
              <rect
                x="3"
                y={y - 1}
                width="6"
                height="10"
                rx="3"
                fill="url(#holeGrad)"
                stroke="rgba(0,0,0,0.35)"
                strokeWidth="0.8"
              />

              {/* Right punched hole */}
              <rect
                x="25"
                y={y + 3}
                width="6"
                height="10"
                rx="3"
                fill="url(#holeGrad)"
                stroke="rgba(0,0,0,0.35)"
                strokeWidth="0.8"
              />

              {/* Wire Loop spanning diagonally with realistic 3D curl */}
              <path
                d={`M 6 ${y + 4} C 12 ${y - 6}, 22 ${y - 4}, 28 ${y + 8}`}
                fill="none"
                stroke="url(#spiralCoilGrad)"
                strokeWidth="3.2"
                strokeLinecap="round"
                filter="url(#coilShadow)"
              />

              {/* Realistic glossy highlight along the upper crest of the wire */}
              <path
                d={`M 8 ${y + 3} C 13 ${y - 7}, 21 ${y - 5}, 26 ${y + 7}`}
                fill="none"
                stroke="rgba(255,255,255,0.45)"
                strokeWidth="0.9"
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
 * Returns background style supporting tactile textured grain or old paper wallpaper images
 */
function getPaperBackgroundStyle(themeColors, isAlt = false) {
  if (!themeColors) return {};
  const baseBg = isAlt ? (themeColors.paperAlt || themeColors.paper) : themeColors.paper;

  // Old paper wallpaper image support
  if (themeColors.paperImage) {
    return {
      backgroundColor: baseBg || "#f7eccd"
    };
  }

  // Tactile textured grain for Khurdura yellow paper
  if (themeColors.isKhurdura) {
    return {
      backgroundColor: baseBg,
      backgroundImage: `radial-gradient(rgba(145, 105, 50, 0.22) 0.8px, transparent 0.8px), radial-gradient(rgba(125, 85, 35, 0.16) 0.7px, transparent 0.7px), linear-gradient(135deg, rgba(205, 160, 85, 0.12) 0%, rgba(240, 215, 155, 0.06) 50%, rgba(185, 140, 65, 0.15) 100%)`,
      backgroundSize: "6px 6px, 11px 11px, 100% 100%",
      backgroundPosition: "0 0, 3px 3px, 0 0"
    };
  }
  return {
    background: baseBg
  };
}

/**
 * Accurately determines if a color is light or dark based on human perceived luminance (ITU-R BT.601)
 */
function isColorLight(hexOrRgb) {
  if (!hexOrRgb || typeof hexOrRgb !== "string") return false;
  const str = hexOrRgb.trim().toLowerCase();
  if (str.startsWith("#")) {
    let hex = str.replace("#", "");
    if (hex.length === 3) hex = hex.split("").map((c) => c + c).join("");
    if (hex.length >= 6) {
      const r = parseInt(hex.substring(0, 2), 16) || 0;
      const g = parseInt(hex.substring(2, 4), 16) || 0;
      const b = parseInt(hex.substring(4, 6), 16) || 0;
      const brightness = (r * 299 + g * 587 + b * 114) / 1000;
      return brightness > 155;
    }
  } else if (str.startsWith("rgb")) {
    const match = str.match(/\d+/g);
    if (match && match.length >= 3) {
      const r = parseInt(match[0], 10) || 0;
      const g = parseInt(match[1], 10) || 0;
      const b = parseInt(match[2], 10) || 0;
      const brightness = (r * 299 + g * 587 + b * 114) / 1000;
      return brightness > 155;
    }
  }
  return false;
}

/**
 * Wallpaper backdrop layer with balanced paper luminance wash.
 * Keeps wallpaper 100% visible while ensuring crystal-clear text readability with zero artificial shadow.
 */
function WallpaperBackdrop({ imageUrl, position = "center", isLightText = true }) {
  if (!imageUrl) return null;
  return (
    <>
      {/* Raw Wallpaper Image (100% Intact Texture & Details, Zero Blur) */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `url("${imageUrl}")`,
          backgroundSize: "cover",
          backgroundPosition: position,
          backgroundRepeat: "no-repeat",
          filter: isLightText ? "contrast(1.08) brightness(0.92)" : "contrast(1.04) brightness(1.02)",
          pointerEvents: "none",
          zIndex: 0
        }}
      />
      {/* Adaptive Glassmorphic Scrim (Zero Blur: 100% crisp details, perfect contrast for both light and dark text) */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: isLightText
            ? "linear-gradient(180deg, rgba(7, 10, 18, 0.46) 0%, rgba(10, 14, 24, 0.52) 50%, rgba(7, 10, 18, 0.48) 100%)"
            : "linear-gradient(180deg, rgba(255, 255, 255, 0.72) 0%, rgba(248, 250, 252, 0.78) 50%, rgba(255, 255, 255, 0.72) 100%)",
          boxShadow: isLightText
            ? "inset 0 0 50px rgba(0, 0, 0, 0.55), inset 0 0 100px rgba(0, 0, 0, 0.35)"
            : "inset 0 0 40px rgba(0, 0, 0, 0.10)",
          pointerEvents: "none",
          zIndex: 0
        }}
      />
    </>
  );
}

function getStoryUrl(p) {
  if (!p) return "/stories";
  const actualSlug = p.slug || p._id;
  if (p.category?.slug && p.subCategory?.slug) {
    return `/stories/${p.category.slug}/${p.subCategory.slug}/${actualSlug}`;
  } else if (p.category?.slug) {
    return `/stories/${p.category.slug}/${actualSlug}`;
  }
  return `/story/${actualSlug}`;
}

/**
 * Parses raw HTML into an ordered sequence of atomic content blocks.
 * Preserves 100% of text, headings, blockquotes, and inline images in exact chronological order.
 */
function parseContentToBlocks(html) {
  if (!html) return [];
  const clean = html
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/<\/p>\s*<!--nextpage-->\s*<p>/gi, "</p>\n<p>")
    .replace(/<!--nextpage-->/gi, "")
    .replace(/<p>\s*(?:&nbsp;|\s|<br\s*\/?>)*<\/p>/gi, "")
    .trim();

  // Split on img tags while keeping them in the sequential token array
  const tokens = clean.split(/(<img[^>]+>)/gi);
  const blocks = [];

  tokens.forEach((tok) => {
    const trimmed = tok.trim();
    if (!trimmed) return;

    if (/<img[^>]+>/i.test(trimmed)) {
      const srcMatch = trimmed.match(/src=["']([^"']+)["']/i);
      const altMatch = trimmed.match(/alt=["']([^"']*)["']/i);
      const titleMatch = trimmed.match(/title=["']([^"']*)["']/i);
      if (srcMatch && srcMatch[1]) {
        blocks.push({
          type: "image",
          src: srcMatch[1],
          alt: altMatch ? altMatch[1] : "",
          caption: titleMatch ? titleMatch[1] : ""
        });
      }
    } else {
      // Split sub-blocks: headings, blockquotes, or paragraphs
      const subTokens = trimmed.split(
        /(<h[1-6][^>]*>[\s\S]*?<\/h[1-6]>|<blockquote[^>]*>[\s\S]*?<\/blockquote>|<p[^>]*>[\s\S]*?<\/p>)/gi
      );

      subTokens.forEach((st) => {
        let s = st.trim();
        if (!s) return;

        if (/<h[1-6][^>]*>/i.test(s)) {
          blocks.push({ type: "heading", html: s });
        } else if (/<blockquote[^>]*>/i.test(s)) {
          blocks.push({ type: "quote", html: s });
        } else if (/<p[^>]*>/i.test(s)) {
          const stripped = s.replace(/<[^>]+>/g, "").replace(/&nbsp;/gi, "").trim();
          if (stripped || /<img|<svg|<video/i.test(s)) {
            blocks.push({ type: "paragraph", html: s });
          }
        } else {
          // Plain text or untagged fragment: clean up stray <p> or </p>
          s = s.replace(/^<\/p>/i, "").replace(/<p>$/i, "").trim();
          const textOnly = s.replace(/<[^>]+>/g, "").replace(/&nbsp;/gi, "").trim();
          if (textOnly) {
            blocks.push({ type: "paragraph", html: `<p>${s}</p>` });
          }
        }
      });
    }
  });

  return blocks;
}

/**
 * Splits a paragraph string into valid sentences while preserving HTML formatting.
 * Protects abbreviations (Mr., Mrs., Dr., etc.), numbers with decimals (5.30, 3.14),
 * ellipses (...), and Hindi purna viram (।) so words and sentences are never severed or corrupted.
 */
function splitParagraphIntoSentences(html) {
  const inner = html.replace(/^<p[^>]*>/i, "").replace(/<\/p>$/i, "").trim();
  if (!inner) return [];

  let clean = inner
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\bMr\./gi, "Mr___DOT___")
    .replace(/\bMrs\./gi, "Mrs___DOT___")
    .replace(/\bMs\./gi, "Ms___DOT___")
    .replace(/\bDr\./gi, "Dr___DOT___")
    .replace(/\bProf\./gi, "Prof___DOT___")
    .replace(/\betc\./gi, "etc___DOT___")
    .replace(/\be\.g\./gi, "eg___DOT___")
    .replace(/\bi\.e\./gi, "ie___DOT___")
    .replace(/\bvs\./gi, "vs___DOT___")
    .replace(/(\d)\.(\d)/g, "$1___DECIMAL___$2")
    .replace(/\.{2,}/g, "___ELLIPSIS___")
    .replace(/&hellip;/gi, "___HELLIP___");

  // Split safely on sentence delimiters (. ? ! । followed by whitespace/quote, or newline, or <br>)
  const rawPieces = clean.split(/(?<=[.?!।])\s+|\n+|<br\s*\/?>/i);
  const finalSentences = [];

  const restore = (str) =>
    str
      .replace(/___DECIMAL___/g, ".")
      .replace(/___ELLIPSIS___/g, "...")
      .replace(/___HELLIP___/g, "&hellip;")
      .replace(/___DOT___/g, ".");

  rawPieces.forEach((piece) => {
    const trimmed = piece.trim();
    if (!trimmed) return;

    const words = trimmed.split(/\s+/);
    if (words.length > 28) {
      for (let i = 0; i < words.length; i += 22) {
        finalSentences.push(`<p>${restore(words.slice(i, i + 22).join(" "))}</p>`);
      }
    } else {
      finalSentences.push(`<p>${restore(trimmed)}</p>`);
    }
  });

  return finalSentences.filter((p) => p !== "<p></p>" && p.replace(/<[^>]+>/g, "").trim().length > 0);
}

// Gentle page turn sound synthesized with Web Audio API
function playPageTurnSound() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const bufferSize = ctx.sampleRate * 0.16;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      const decay = Math.exp(-i / (ctx.sampleRate * 0.035));
      data[i] = (Math.random() * 2 - 1) * decay * 0.22;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(1200, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(250, ctx.currentTime + 0.15);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.28, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.16);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start();
  } catch (e) {
    // Autoplay fallback
  }
}

export const PAPER_WALLPAPERS = [
  {
    id: "leaves_vines",
    name: "Leaves & Vines",
    tooltip: "Vintage Leaves & Vines Old Paper Wallpaper",
    paperImage: "http://localhost:5001/uploads/images/2026/10/an-old-paper-background-with-leaves-and-vines-photo.jpg",
    paper: "#151a23",
    text: "#f6c453",
    border: "#cbaf76",
    headerText: "#fbbf24",
    swatch: "http://localhost:5001/uploads/images/2026/10/an-old-paper-background-with-leaves-and-vines-photo.jpg",
    isWallpaper: true
  },
  {
    id: "botanical_branches",
    name: "Botanical Branches",
    tooltip: "Botanical Branches Old Paper Wallpaper",
    paperImage: "http://localhost:5001/uploads/images/2026/10/an-old-paper-background-with-leaves-and-branches-photo.jpg",
    paper: "#151a23",
    text: "#f6c453",
    border: "#cbaf76",
    headerText: "#fbbf24",
    swatch: "http://localhost:5001/uploads/images/2026/10/an-old-paper-background-with-leaves-and-branches-photo.jpg",
    isWallpaper: true
  },
  {
    id: "antique_parchment",
    name: "Antique Parchment",
    tooltip: "Antique Parchment Old Paper Wallpaper",
    paperImage: "http://localhost:5001/uploads/images/2026/10/ae5b48b7d8667818e86f51d4277c3034.jpg",
    paper: "#151a23",
    text: "#f6c453",
    border: "#c3a572",
    headerText: "#fbbf24",
    swatch: "http://localhost:5001/uploads/images/2026/10/ae5b48b7d8667818e86f51d4277c3034.jpg",
    isWallpaper: true
  },
  {
    id: "rustic_manuscript",
    name: "Rustic Manuscript",
    tooltip: "Rustic Manuscript Old Paper Wallpaper",
    paperImage: "http://localhost:5001/uploads/images/2026/10/22c0a61dcdf751cfff696bf84472a216.jpg",
    paper: "#151a23",
    text: "#f6c453",
    border: "#b89862",
    headerText: "#fbbf24",
    swatch: "http://localhost:5001/uploads/images/2026/10/22c0a61dcdf751cfff696bf84472a216.jpg",
    isWallpaper: true
  }
];

export const FONT_COLOR_OPTIONS = [
  { id: "pure_white", label: "Pure White", color: "#ffffff", darkColor: "#18181b", swatch: "#ffffff" },
  { id: "deep_black", label: "Deep Black", color: "#111827", darkColor: "#111827", swatch: "#111827" },
  { id: "royal_gold", label: "Royal Gold", color: "#f6c453", darkColor: "#b45309", swatch: "#f6c453" },
  { id: "rose_gold", label: "Rose Gold", color: "#fb7185", darkColor: "#be123c", swatch: "#fb7185" }
];

export default function BookStoryReader({ post, bannerImage, breadcrumb = null, relatedPosts = [] }) {
  const navigate = useNavigate();
  const [internalRelated, setInternalRelated] = useState(relatedPosts || []);

  useEffect(() => {
    if (relatedPosts && relatedPosts.length > 0) {
      const filtered = relatedPosts.filter((p) => String(p._id) !== String(post?._id));
      const shuffled = [...filtered].sort(() => Math.random() - 0.5);
      setInternalRelated(shuffled);
    } else {
      postAPI
        .getAll({ limit: 12, status: "published" })
        .then((res) => {
          const posts = (res?.posts || []).filter((p) => String(p._id) !== String(post?._id));
          const shuffled = [...posts].sort(() => Math.random() - 0.5);
          setInternalRelated(shuffled);
        })
        .catch(() => {});
    }
  }, [relatedPosts, post?._id]);

  const [isOpen, setIsOpen] = useState(false);
  const [readingMode, setReadingMode] = useState("spread"); // 'spread' | 'single' | 'continuous'
  const [currentSpreadIndex, setCurrentSpreadIndex] = useState(0); // 0-indexed spread
  const [currentSinglePageIndex, setCurrentSinglePageIndex] = useState(0); // 0-indexed single page
  const [fontSize, setFontSize] = useState("normal"); // 'small' | 'normal' | 'large'
  const [paperTheme, setPaperTheme] = useState(() => {
    if (post?.bookPaperImage) {
      const match = PAPER_WALLPAPERS.find((w) => w.paperImage === post.bookPaperImage);
      return match ? match.id : "custom_wallpaper";
    }
    return "khurdura_yellow";
  }); // Default to selected wallpaper or Khurdura Vintage Yellow

  useEffect(() => {
    if (post?.bookPaperImage) {
      const match = PAPER_WALLPAPERS.find((w) => w.paperImage === post.bookPaperImage);
      setPaperTheme(match ? match.id : "custom_wallpaper");
    }
  }, [post?.bookPaperImage]);

  const [fontColor, setFontColor] = useState(post?.bookTextColor || null);

  useEffect(() => {
    if (post?.bookTextColor) {
      setFontColor(post.bookTextColor);
    }
  }, [post?.bookTextColor]);

  const [isDimLight, setIsDimLight] = useState(false); // Dim light / soft reading ambient mode
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeLightboxImg, setActiveLightboxImg] = useState(null);
  const [flipAnimation, setFlipAnimation] = useState(null); // 'next' | 'prev' | null

  // DOM measuring references
  const bookContainerRef = useRef(null);
  const measurerRef = useRef(null);
  const [pageDimensions, setPageDimensions] = useState({ width: 440, height: 620 });
  const [imageSizes, setImageSizes] = useState({}); // src -> { width, height, ratio }
  const [paginatedPages, setPaginatedPages] = useState([]);
  const [isMeasuring, setIsMeasuring] = useState(false);

  // Configuration defaults
  const defaultPaper = post.bookPaperColor || "#faf6ed";
  const defaultCover = post.bookCoverColor || "#18181b";
  const defaultFont = post.bookFontFamily || "serif";

  // Curated Wallpaper Options & Premium Paper Themes
  const PAPER_THEMES = useMemo(() => [
    ...PAPER_WALLPAPERS,
    ...(post?.bookPaperImage && !PAPER_WALLPAPERS.some((w) => w.paperImage === post.bookPaperImage)
      ? [
          {
            id: "custom_wallpaper",
            name: "Custom Wallpaper",
            tooltip: "Story Custom Wallpaper",
            paperImage: post.bookPaperImage,
            paper: "#151a23",
            text: "#f6c453",
            border: "#cbaf76",
            headerText: "#fbbf24",
            swatch: post.bookPaperImage,
            isWallpaper: true
          }
        ]
      : []),
    {
      id: "khurdura_yellow",
      name: "Khurdura Vintage Yellow",
      tooltip: "Khurdura Vintage Yellow (Textured Grain)",
      swatch: "#ecd38c",
      paper: "#f5e4b7",
      paperAlt: "#ebd59e",
      text: "#2c1c0d",
      border: "#cbaf76",
      headerText: "#785834",
      plateBg: "rgba(100, 65, 20, 0.05)",
      isKhurdura: true
    },
    {
      id: "old_yellow",
      name: "Old Yellow Vintage",
      tooltip: "Old Yellow Vintage Paper",
      swatch: "#f5e6c4",
      paper: "#f7eccd",
      paperAlt: "#ebdcb4",
      text: "#36271a",
      border: "#d8c298",
      headerText: "#876743",
      plateBg: "rgba(90, 60, 20, 0.04)"
    },
    {
      id: "light_pink",
      name: "Matte Light Pink",
      tooltip: "Matte Light Pink Finish",
      swatch: "#fadadd",
      paper: "#fdf0f3",
      paperAlt: "#f7e1e6",
      text: "#3a2128",
      border: "#eccdd5",
      headerText: "#965969",
      plateBg: "rgba(220, 70, 110, 0.04)"
    },
    {
      id: "custom",
      name: "Matte Warm Ivory",
      tooltip: "Matte Warm Ivory Finish",
      swatch: defaultPaper,
      paper: defaultPaper,
      paperAlt: "#f4eee1",
      text: post.bookTextColor || "#242220",
      border: "rgba(0,0,0,0.10)",
      headerText: "rgba(0,0,0,0.55)",
      plateBg: "rgba(0,0,0,0.02)"
    },
    {
      id: "sepia",
      name: "Parchment Sepia",
      tooltip: "Parchment Sepia",
      swatch: "#eadeca",
      paper: "#eee2cc",
      paperAlt: "#e2d3b8",
      text: "#3b2a1a",
      border: "#cdb897",
      headerText: "#7e5e3e",
      plateBg: "rgba(0,0,0,0.03)"
    },
    {
      id: "crisp",
      name: "Crisp Pure White",
      tooltip: "Crisp Pure White",
      swatch: "#ffffff",
      paper: "#ffffff",
      paperAlt: "#f8fafc",
      text: "#1e293b",
      border: "#e2e8f0",
      headerText: "#64748b",
      plateBg: "rgba(0,0,0,0.02)"
    },
    {
      id: "dark",
      name: "Velvet Night",
      tooltip: "Velvet Night Mode",
      swatch: "#141824",
      paper: "#151a23",
      paperAlt: "#0f131a",
      text: "#e2e8f0",
      border: "#253142",
      headerText: "#70849f",
      plateBg: "rgba(255,255,255,0.02)"
    }
  ], [defaultPaper, post.bookTextColor]);

  const selectedTheme = useMemo(() => {
    return PAPER_THEMES.find((t) => t.id === paperTheme) || PAPER_THEMES[0];
  }, [PAPER_THEMES, paperTheme]);

  const colors = useMemo(() => {
    return {
      ...selectedTheme,
      text: fontColor || selectedTheme.text,
      headerText: fontColor || selectedTheme.headerText
    };
  }, [selectedTheme, fontColor]);

  const isLightPaper = !colors.paperImage && selectedTheme.id !== "dark";

  const activeTextColor = useMemo(() => {
    if (!fontColor) {
      return selectedTheme.text;
    }
    const colorOpt = FONT_COLOR_OPTIONS.find((fc) => fc.color === fontColor || fc.darkColor === fontColor || fc.id === fontColor);
    if (colorOpt) {
      return isLightPaper ? colorOpt.darkColor : colorOpt.color;
    }
    if (isLightPaper && isColorLight(fontColor)) {
      return "#18181b";
    }
    return fontColor;
  }, [fontColor, selectedTheme, isLightPaper]);

  const isLightColor = isColorLight(activeTextColor);

  // Typography tokens - reduced by 1-2px per user request
  const fontSizes = {
    small: "0.92rem",   // was 1.00rem (~16px -> ~14.7px, -1.3px)
    normal: "1.02rem",  // was 1.12rem (~18px -> ~16.3px, -1.7px)
    large: "1.14rem"    // was 1.25rem (~20px -> ~18.2px, -1.8px)
  };

  const lineHeights = {
    small: "1.68",
    normal: "1.76",
    large: "1.85"
  };

  const fontFamilyStyle =
    defaultFont === "sans"
      ? "Inter, system-ui, -apple-system, sans-serif"
      : defaultFont === "literary"
      ? "Cinzel, 'Playfair Display', Georgia, serif"
      : "'Merriweather', 'Lora', Georgia, serif";

  // 1. Parse raw content into sequential blocks (preserving chronological order)
  const blocks = useMemo(() => {
    return parseContentToBlocks(post.content || "");
  }, [post.content]);

  // 2. Preload and cache natural image dimensions
  useEffect(() => {
    blocks.forEach((block) => {
      if (block.type === "image" && block.src && !imageSizes[block.src]) {
        const img = new Image();
        img.src = block.src;
        img.onload = () => {
          setImageSizes((prev) => ({
            ...prev,
            [block.src]: {
              width: img.naturalWidth || 800,
              height: img.naturalHeight || 600,
              ratio: (img.naturalWidth || 800) / (img.naturalHeight || 600)
            }
          }));
        };
      }
    });
  }, [blocks, imageSizes]);

  // 3. Monitor page viewport dimensions with ResizeObserver
  useEffect(() => {
    const handleResize = () => {
      if (!bookContainerRef.current) return;
      const rect = bookContainerRef.current.getBoundingClientRect();
      const isMobile = window.innerWidth < 960;
      
      const containerWidth = Math.min(rect.width || window.innerWidth, 1400);
      const containerHeight = rect.height || window.innerHeight;
      
      // Spread container height: fits comfortably in viewport, vertically centered
      const availableHeight = containerHeight - 80;
      const spreadHeight = Math.max(520, Math.min(availableHeight - 16, 780));
      // Only bottom footer bar remains (~32px) since top running header is removed
      const FOOTER_H = 32;
      // Usable page body height inside the book spread
      const pageBodyHeight = spreadHeight - FOOTER_H;

      // Page width: leave 140px total margin on desktop for the side slider buttons (70px each side)
      const targetPageWidth = isMobile
        ? Math.min(containerWidth - 32, 580)
        : Math.min(Math.floor((containerWidth - 140) / 2), 560);

      setPageDimensions({
        width: Math.floor(targetPageWidth),
        height: Math.floor(pageBodyHeight),
        spreadWidth: isMobile ? Math.floor(targetPageWidth) : Math.floor(targetPageWidth * 2),
        spreadHeight: Math.floor(spreadHeight)
      });
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isOpen, readingMode, isFullscreen]);

  // 4. CORE ENGINE: DOM-MEASURED PAGINATION (Strict 20px Bottom Limit Guarantee)
  useEffect(() => {
    if (!measurerRef.current || blocks.length === 0 || pageDimensions.width <= 0 || pageDimensions.height <= 0) {
      return;
    }

    setIsMeasuring(true);
    const measurer = measurerRef.current;
    const pageWidth = pageDimensions.width;
    const pageHeight = pageDimensions.height;
    
    // Page body has 16px top padding and strict 20px bottom safe margin
    const PAGE_TOP_PADDING = 16;
    const PAGE_BOTTOM_SAFE_PADDING = 20;

    measurer.className = "book-scene-html";
    measurer.style.width = `${pageWidth - 68}px`; // accounting for page padding (34px left + 34px right)
    measurer.style.fontFamily = fontFamilyStyle;
    measurer.style.fontSize = fontSizes[fontSize];
    measurer.style.lineHeight = lineHeights[fontSize];
    measurer.style.margin = "0";
    measurer.style.padding = "0";
    measurer.style.boxSizing = "border-box";
    measurer.style.wordBreak = "break-word";

    // Dynamically measure the exact rendered height of the Page 1 Opening Header!
    let openingHeaderHeight = 0;
    if (blocks.length > 0) {
      measurer.innerHTML = `
        <div style="margin-bottom: 12px; flex-shrink: 0;">
          <h1 style="font-family: ${fontFamilyStyle}; font-size: 1.65rem; font-weight: 800; margin: 0 0 4px; line-height: 1.25;">
            ${post?.title || ""}
          </h1>
          <p style="margin: 0; font-size: 0.82rem; font-style: italic;">
            By ${post?.author?.name || (typeof post?.author === "string" ? post?.author : "Author")}
          </p>
        </div>
      `;
      openingHeaderHeight = (measurer.firstElementChild ? measurer.firstElementChild.offsetHeight : measurer.offsetHeight) + 12;
    }

    // Page 1 has an opening header allowance; non-opening pages have 0 allowance so text fills all available space
    const getMaxPageHeight = () => {
      const isOpening = generatedPages.length === 0;
      const openingAllowance = isOpening ? openingHeaderHeight : 0;
      return pageHeight - openingAllowance - PAGE_TOP_PADDING - PAGE_BOTTOM_SAFE_PADDING - 6;
    };

    const generatedPages = [];
    let currentPageItems = [];
    let currentHeight = 0;

    const measureElementHeight = (html) => {
      measurer.innerHTML = `<div class="book-scene-html" style="text-align: left; line-height: inherit; margin: 0 0 10px 0;">${html}</div>`;
      const el = measurer.firstElementChild;
      return (el ? el.offsetHeight : measurer.offsetHeight) + 10;
    };

    // Helper: Binary search for exact word cutoff that fits into availableRemaining height
    const findFittingWordsCount = (words, availableHeight, baseText = "") => {
      if (!words || words.length === 0 || availableHeight <= 24) return 0;
      let low = 1;
      let high = words.length;
      let best = 0;

      while (low <= high) {
        const mid = Math.floor((low + high) / 2);
        const joinedWords = words.slice(0, mid).join(" ");
        const combined = baseText ? `${baseText} ${joinedWords}` : joinedWords;
        const testHtml = `<p>${combined}</p>`;
        const h = measureElementHeight(testHtml);
        if (h <= availableHeight) {
          best = mid;
          low = mid + 1;
        } else {
          high = mid - 1;
        }
      }
      return best;
    };

    const flushPage = () => {
      if (currentPageItems.length > 0) {
        generatedPages.push({
          pageNumber: generatedPages.length + 1,
          items: [...currentPageItems],
          isOpening: generatedPages.length === 0
        });
        currentPageItems = [];
        currentHeight = 0;
      }
    };

    // Iterate through blocks in their authentic chronological order
    for (let i = 0; i < blocks.length; i++) {
      const block = blocks[i];

      if (block.type === "image") {
        const imgMeta = imageSizes[block.src] || { width: 800, height: 600, ratio: 1.33 };
        const availableWidth = pageWidth - 68;
        const naturalH = availableWidth / (imgMeta.ratio || 1.33);
        const maxContentHeight = getMaxPageHeight();
        const hasNextContent = blocks.slice(i + 1).some(
          (b) => b.type === "image" || (b.html && b.html.replace(/<[^>]+>|&nbsp;|\s+/g, "").length > 0)
        );
        const IMG_MARGIN = 14;
        const availableRemaining = maxContentHeight - currentHeight - IMG_MARGIN;

        // Image height in Book Layout: somewhat less than Layout 1 (~340px) and full content width
        const targetMaxH = hasNextContent
          ? Math.min(Math.max(Math.round(naturalH || 340), 320), 360)
          : Math.min(Math.round(naturalH || 480), maxContentHeight - 20);

        if (currentHeight === 0) {
          currentPageItems.push({
            type: "image",
            src: block.src,
            alt: block.alt,
            caption: block.caption,
            renderHeight: targetMaxH
          });
          currentHeight += targetMaxH + IMG_MARGIN;
        } else if (availableRemaining >= targetMaxH) {
          currentPageItems.push({
            type: "image",
            src: block.src,
            alt: block.alt,
            caption: block.caption,
            renderHeight: targetMaxH
          });
          currentHeight += targetMaxH + IMG_MARGIN;
        } else {
          // If available space cannot fit the image, move it cleanly to the next page!
          flushPage();
          currentPageItems.push({
            type: "image",
            src: block.src,
            alt: block.alt,
            caption: block.caption,
            renderHeight: targetMaxH
          });
          currentHeight += targetMaxH + IMG_MARGIN;
        }
      } else if (block.type === "heading" || block.type === "quote") {
        const itemH = measureElementHeight(block.html);
        const maxContentHeight = getMaxPageHeight();

        if (currentHeight + itemH <= maxContentHeight) {
          currentPageItems.push(block);
          currentHeight += itemH;
        } else {
          flushPage();
          currentPageItems.push(block);
          currentHeight += itemH;
        }
      } else {
        // Paragraph or text content block
        const maxContentHeight = getMaxPageHeight();
        const hasImageOnCurrentPage = currentPageItems.some((it) => it.type === "image");
        const availableUnderImage = maxContentHeight - currentHeight;

        // If page already has an image and remaining space is too small for a readable block (< 68px / ~3 lines),
        // flush the image page cleanly so this paragraph starts at the top of the next page without awkward single lines!
        if (hasImageOnCurrentPage && availableUnderImage < 68) {
          flushPage();
        }

        const pHeight = measureElementHeight(block.html);

        if (currentHeight + pHeight <= maxContentHeight) {
          currentPageItems.push(block);
          currentHeight += pHeight;
        } else {
          // Paragraph exceeds remaining height:
          // Fill current page with as many sentences and words as fit down to the bottom margin,
          // then carry the rest over cleanly to the next page.
          let sentencesQueue = splitParagraphIntoSentences(block.html);

          while (sentencesQueue.length > 0) {
            const pageMax = getMaxPageHeight();
            let headSentences = [];
            let nextTail = [];

            for (let s = 0; s < sentencesQueue.length; s++) {
              const testHtml = `<p>${headSentences.concat(sentencesQueue[s]).map(x => x.replace(/<\/?p>/g, '')).join(' ')}</p>`;
              const testH = measureElementHeight(testHtml);

              if (currentHeight + testH <= pageMax) {
                headSentences.push(sentencesQueue[s]);
              } else {
                nextTail = sentencesQueue.slice(s);
                break;
              }
            }

            // Check if there is remaining space on the current page to fill with words from nextTail[0]
            if (nextTail.length > 0) {
              const currentHeadHtml = headSentences.length > 0
                ? `<p>${headSentences.map(x => x.replace(/<\/?p>/g, '')).join(' ')}</p>`
                : "";
              const currentHeadH = currentHeadHtml ? measureElementHeight(currentHeadHtml) : 0;
              const remainingSpace = pageMax - currentHeight - currentHeadH;

              if (remainingSpace >= 28) {
                const nextCandidateText = nextTail[0].replace(/<\/?p>/g, '').trim();
                const candidateWords = nextCandidateText.split(/\s+/);

                if (candidateWords.length > 2) {
                  const baseText = headSentences.map(x => x.replace(/<\/?p>/g, '')).join(' ');
                  const fitCount = findFittingWordsCount(candidateWords, pageMax - currentHeight, baseText);

                  if (fitCount >= 2 && fitCount < candidateWords.length) {
                    const fittedPart = candidateWords.slice(0, fitCount).join(' ');
                    const overflowPart = candidateWords.slice(fitCount).join(' ');

                    headSentences.push(`<p>${fittedPart}</p>`);
                    nextTail[0] = `<p>${overflowPart}</p>`;
                  }
                }
              }
            }

            if (headSentences.length > 0) {
              const headHtml = `<p>${headSentences.map(x => x.replace(/<\/?p>/g, '')).join(' ')}</p>`;
              currentPageItems.push({
                type: "paragraph",
                html: headHtml
              });
              currentHeight += measureElementHeight(headHtml);
            } else if (currentHeight === 0 && sentencesQueue.length > 0) {
              // Forced fallback: if a single block is taller than an entire empty page, place it so it's never dropped!
              const headHtml = sentencesQueue[0];
              currentPageItems.push({
                type: "paragraph",
                html: headHtml
              });
              currentHeight += measureElementHeight(headHtml);
              nextTail = sentencesQueue.slice(1);
            }

            if (nextTail.length > 0) {
              flushPage();
              sentencesQueue = nextTail;
            } else {
              break;
            }
          }
        }
      }
    }

    flushPage();
    measurer.innerHTML = "";
    setPaginatedPages(generatedPages);
    setIsMeasuring(false);
  }, [blocks, pageDimensions, fontSize, fontFamilyStyle, imageSizes]);

  // Build Spreads from paginated pages
  const spreads = useMemo(() => {
    if (paginatedPages.length === 0) return [];
    const spreadList = [];

    // Spread 1: Cover frontispiece on Left, Page 1 on Right
    spreadList.push({
      spreadIndex: 1,
      leftPage: {
        pageNumber: 1,
        type: "cover",
        image: bannerImage || post.featuredImage || "/placeholder-story.jpg"
      },
      rightPage: paginatedPages[0]
    });

    // Subsequent pages paired 2-by-2
    let i = 1;
    while (i < paginatedPages.length) {
      const left = paginatedPages[i];
      const right = paginatedPages[i + 1] || null;

      if (right) {
        spreadList.push({
          spreadIndex: spreadList.length + 1,
          leftPage: left,
          rightPage: right
        });
        i += 2;
      } else {
        // Left is the final story page, Right is the Next Suggested Story page!
        spreadList.push({
          spreadIndex: spreadList.length + 1,
          leftPage: left,
          rightPage: {
            pageNumber: paginatedPages.length + 1,
            type: "end_plate",
            items: []
          }
        });
        i += 1;
        break;
      }
    }

    // If all story pages were paired and the final spread didn't have an end plate,
    // append a dedicated concluding spread with Epilogue on the left and Next Suggested Story on the right!
    const lastSpread = spreadList[spreadList.length - 1];
    if (lastSpread && lastSpread.rightPage?.type !== "end_plate") {
      spreadList.push({
        spreadIndex: spreadList.length + 1,
        leftPage: {
          pageNumber: paginatedPages.length + 1,
          type: "epilogue_plate",
          items: []
        },
        rightPage: {
          pageNumber: paginatedPages.length + 2,
          type: "end_plate",
          items: []
        }
      });
    }

    return spreadList;
  }, [paginatedPages, bannerImage, post.featuredImage]);

  // Single page list always concluding with the Next Suggested Story page
  const allSinglePages = useMemo(() => {
    if (paginatedPages.length === 0) return [];
    return [
      ...paginatedPages,
      {
        pageNumber: paginatedPages.length + 1,
        type: "end_plate",
        items: []
      }
    ];
  }, [paginatedPages]);

  const totalSpreads = spreads.length || 1;
  const activeSpread = spreads[currentSpreadIndex] || spreads[0];
  const totalSinglePages = allSinglePages.length || 1;
  const activeSinglePage = allSinglePages[currentSinglePageIndex] || allSinglePages[0];

  // Open Book Handler
  const handleOpenBook = useCallback(() => {
    if (soundEnabled) playPageTurnSound();
    setIsOpen(true);
    setIsFullscreen(true);
    try {
      if (!document.fullscreenElement && bookContainerRef.current) {
        bookContainerRef.current.requestFullscreen?.().catch(() => {});
      }
    } catch (e) {}
  }, [soundEnabled]);

  // Close Book Handler
  const handleCloseBook = useCallback(() => {
    setIsOpen(false);
    setIsFullscreen(false);
    try {
      if (document.fullscreenElement) {
        document.exitFullscreen?.().catch(() => {});
      }
    } catch (e) {}
  }, []);

  // Spread Navigation
  const handleNextSpread = useCallback(() => {
    if (currentSpreadIndex < totalSpreads - 1 && !flipAnimation) {
      if (soundEnabled) playPageTurnSound();
      setFlipAnimation("next");
      setTimeout(() => {
        setCurrentSpreadIndex((prev) => prev + 1);
      }, 240);
      setTimeout(() => {
        setFlipAnimation(null);
      }, 480);
    }
  }, [currentSpreadIndex, totalSpreads, soundEnabled, flipAnimation]);

  const handlePrevSpread = useCallback(() => {
    if (currentSpreadIndex > 0 && !flipAnimation) {
      if (soundEnabled) playPageTurnSound();
      setFlipAnimation("prev");
      setTimeout(() => {
        setCurrentSpreadIndex((prev) => prev - 1);
      }, 240);
      setTimeout(() => {
        setFlipAnimation(null);
      }, 480);
    }
  }, [currentSpreadIndex, soundEnabled, flipAnimation]);

  // Single Page Navigation
  const handleNextSinglePage = useCallback(() => {
    if (currentSinglePageIndex < totalSinglePages - 1 && !flipAnimation) {
      if (soundEnabled) playPageTurnSound();
      setFlipAnimation("next");
      setTimeout(() => {
        setCurrentSinglePageIndex((prev) => prev + 1);
      }, 160);
      setTimeout(() => {
        setFlipAnimation(null);
      }, 340);
    }
  }, [currentSinglePageIndex, totalSinglePages, soundEnabled, flipAnimation]);

  const handlePrevSinglePage = useCallback(() => {
    if (currentSinglePageIndex > 0 && !flipAnimation) {
      if (soundEnabled) playPageTurnSound();
      setFlipAnimation("prev");
      setTimeout(() => {
        setCurrentSinglePageIndex((prev) => prev - 1);
      }, 160);
      setTimeout(() => {
        setFlipAnimation(null);
      }, 340);
    }
  }, [currentSinglePageIndex, soundEnabled, flipAnimation]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;
      if (activeLightboxImg) {
        if (e.key === "Escape") setActiveLightboxImg(null);
        return;
      }
      if (e.key === "ArrowRight" || e.key === "PageDown" || e.key === " ") {
        if (e.key === " ") e.preventDefault();
        if (readingMode === "spread") handleNextSpread();
        else if (readingMode === "single") handleNextSinglePage();
      }
      if (e.key === "ArrowLeft" || e.key === "PageUp") {
        if (readingMode === "spread") handlePrevSpread();
        else if (readingMode === "single") handlePrevSinglePage();
      }
      if (e.key === "Escape") handleCloseBook();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    isOpen,
    activeLightboxImg,
    readingMode,
    handleNextSpread,
    handlePrevSpread,
    handleNextSinglePage,
    handlePrevSinglePage,
    handleCloseBook
  ]);

  const toggleFullscreen = () => {
    if (!bookContainerRef.current) return;
    if (!document.fullscreenElement) {
      bookContainerRef.current.requestFullscreen?.().then(() => setIsFullscreen(true)).catch(() => setIsFullscreen(!isFullscreen));
    } else {
      document.exitFullscreen?.().then(() => setIsFullscreen(false)).catch(() => setIsFullscreen(!isFullscreen));
    }
  };

  // Render content items inside a measured page
  const renderPageItems = (page) => {
    if (!page) return null;

    if (page.type === "cover") {
      return (
        <div style={{ width: "100%", height: "100%", borderRadius: "10px", overflow: "hidden", position: "relative" }}>
          <img
            src={page.image}
            alt={post.title}
            onError={(e) => { e.currentTarget.style.display = "none"; }}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, transparent 40%, rgba(0,0,0,0.85) 100%)" }} />
          <div style={{ position: "absolute", bottom: "24px", left: "24px", right: "24px", color: "#fff" }}>
            <span style={{ background: "var(--g-accent, #ea580c)", color: "#fff", padding: "3px 10px", borderRadius: "10px", fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase" }}>
              {post.category?.name || "Story"}
            </span>
            <h2 style={{ fontFamily: fontFamilyStyle, margin: "10px 0 6px", fontSize: "1.45rem", lineHeight: 1.25 }}>{post.title}</h2>
            <p style={{ margin: 0, fontSize: "0.85rem", opacity: 0.85 }}>By {post.author?.name || "Author"}</p>
          </div>
        </div>
      );
    }

    if (page.type === "epilogue_plate") {
      return (
        <div
          style={{
            height: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            alignItems: "center",
            textAlign: "center",
            padding: "24px 20px",
            boxSizing: "border-box"
          }}
        >
          <div style={{ marginTop: "auto", marginBottom: "auto" }}>
            <span style={{ fontSize: "2.4rem", color: "var(--g-accent, #ea580c)", display: "block", marginBottom: "14px" }}>❦</span>
            <span
              style={{
                fontSize: "0.74rem",
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                fontWeight: 700,
                color: colors.headerText,
                display: "block",
                marginBottom: "6px"
              }}
            >
              Epilogue
            </span>
            <h2
              style={{
                fontFamily: fontFamilyStyle,
                fontSize: "1.65rem",
                fontWeight: 800,
                margin: "0 0 14px",
                color: colors.text
              }}
            >
              {post.title}
            </h2>
            <div
              style={{
                width: "48px",
                height: "2px",
                background: "var(--g-accent, #ea580c)",
                margin: "0 auto 18px",
                opacity: 0.7
              }}
            />
            <p
              style={{
                fontSize: "0.94rem",
                lineHeight: 1.7,
                color: colors.text,
                fontStyle: "italic",
                opacity: 0.88,
                maxWidth: "360px",
                margin: "0 auto"
              }}
            >
              &ldquo;Every story is a journey that lingers in the heart long after the final page is turned.&rdquo;
            </p>
            <p style={{ marginTop: "18px", fontSize: "0.82rem", color: colors.headerText }}>
              Written by <strong>{post.author?.name || (typeof post.author === "string" ? post.author : "Staff Writer")}</strong>
            </p>
          </div>

          <div style={{ fontSize: "0.76rem", color: colors.headerText, fontStyle: "italic" }}>
            ❖ Concluded ❖
          </div>
        </div>
      );
    }

    if (page.type === "end_plate") {
      const suggestedStory = (internalRelated && internalRelated.length > 0) ? internalRelated[0] : null;
      const otherStories = (internalRelated && internalRelated.length > 1) ? internalRelated.slice(1, 3) : [];
      const suggestedImg = suggestedStory ? (suggestedStory.featuredImage || suggestedStory.banner || "/placeholder-story.jpg") : null;
      const suggestedCat = suggestedStory?.category?.name || (typeof suggestedStory?.category === "string" ? suggestedStory.category : "Recommended");
      const readUrl = getStoryUrl(suggestedStory);

      return (
        <div
          style={{
            height: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "8px 6px 6px",
            boxSizing: "border-box"
          }}
        >
          {/* Top Status Header */}
          <div style={{ textAlign: "center", borderBottom: `1px solid ${colors.border}`, paddingBottom: "10px", flexShrink: 0 }}>
            <span style={{ fontSize: "1.5rem", color: "var(--g-accent, #ea580c)", lineHeight: 1 }}>❦</span>
            <h2
              style={{
                fontFamily: fontFamilyStyle,
                fontSize: "1.3rem",
                fontWeight: 800,
                margin: "2px 0 2px",
                color: colors.text
              }}
            >
              Story Completed
            </h2>
            <p style={{ margin: 0, fontSize: "0.76rem", color: colors.headerText, fontStyle: "italic" }}>
              Next recommendation curated for you
            </p>
          </div>

          {/* Main Up Next Suggested Story Card */}
          {suggestedStory ? (
            <div
              style={{
                background: "rgba(0,0,0,0.03)",
                border: `1px solid ${colors.border}`,
                borderRadius: "10px",
                padding: "12px",
                margin: "8px 0",
                display: "flex",
                flexDirection: "column",
                flex: 1,
                minHeight: 0,
                justifyContent: "space-between",
                boxShadow: "0 4px 16px rgba(0,0,0,0.05)"
              }}
            >
              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px", marginBottom: "8px", width: "100%", overflow: "hidden" }}>
                  <span
                    style={{
                      background: "rgba(234, 88, 12, 0.12)",
                      border: "1px solid rgba(234, 88, 12, 0.35)",
                      color: "var(--g-accent, #ea580c)",
                      padding: "2px 8px",
                      borderRadius: "6px",
                      fontSize: "0.66rem",
                      fontWeight: 800,
                      letterSpacing: "0.06em",
                      textTransform: "uppercase",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px",
                      flexShrink: 0,
                      whiteSpace: "nowrap"
                    }}
                  >
                    <Sparkles size={11} /> Suggested Next Story
                  </span>
                  <span
                    style={{
                      fontSize: "0.70rem",
                      color: colors.headerText,
                      fontWeight: 600,
                      textTransform: "uppercase",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      textAlign: "right",
                      flex: 1,
                      minWidth: 0
                    }}
                    title={suggestedCat}
                  >
                    {suggestedCat}
                  </span>
                </div>

                {/* Cover Image */}
                {suggestedImg && (
                  <div
                    onClick={() => {
                      navigate(readUrl);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    style={{
                      width: "100%",
                      height: `${Math.min(240, Math.max(180, Math.round((pageDimensions.height || 620) * 0.38)))}px`,
                      borderRadius: "8px",
                      overflow: "hidden",
                      position: "relative",
                      marginBottom: "10px",
                      cursor: "pointer",
                      boxShadow: "0 6px 16px rgba(0,0,0,0.18)"
                    }}
                    title={`Click to read: ${suggestedStory.title}`}
                  >
                    <img
                      src={suggestedImg}
                      alt={suggestedStory.title}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        display: "block",
                        transition: "transform 0.3s ease"
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.04)")}
                      onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
                    />
                    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, transparent 40%, rgba(0,0,0,0.65) 100%)" }} />
                  </div>
                )}

                {/* Title */}
                <h3
                  onClick={() => {
                    navigate(readUrl);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  style={{
                    fontFamily: fontFamilyStyle,
                    fontSize: "1.12rem",
                    fontWeight: 700,
                    lineHeight: 1.3,
                    margin: "0 0 6px",
                    color: colors.text,
                    cursor: "pointer"
                  }}
                >
                  {suggestedStory.title}
                </h3>

                {/* 2-3 Line Content Teaser (Matching story content font size, safe against overflow) */}
                {(() => {
                  const rawText = (suggestedStory.excerpt || suggestedStory.content || "")
                    .replace(/&hellip;/g, "...")
                    .replace(/&rsquo;/g, "'")
                    .replace(/&lsquo;/g, "'")
                    .replace(/&rdquo;/g, '"')
                    .replace(/&ldquo;/g, '"')
                    .replace(/&quot;/g, '"')
                    .replace(/&#039;/g, "'")
                    .replace(/&amp;/g, "&")
                    .replace(/<[^>]+>/g, " ")
                    .replace(/&nbsp;/g, " ")
                    .replace(/\s+/g, " ")
                    .trim();
                  if (!rawText) return null;
                  return (
                    <p
                      style={{
                        fontFamily: fontFamilyStyle,
                        fontSize: fontSizes[fontSize],
                        lineHeight: 1.5,
                        color: colors.text,
                        opacity: 0.90,
                        margin: "4px 0 8px",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                        textOverflow: "ellipsis"
                      }}
                    >
                      {rawText}
                    </p>
                  );
                })()}

                {/* Meta details */}
                <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "0.74rem", color: colors.headerText, marginBottom: "8px" }}>
                  {suggestedStory.author && (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                      <User size={12} /> {suggestedStory.author.name || suggestedStory.author}
                    </span>
                  )}
                  {suggestedStory.views !== undefined && (
                    <span>• {suggestedStory.views} views</span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: "flex", gap: "8px", alignItems: "center", marginTop: "auto" }}>
                <button
                  onClick={() => {
                    navigate(readUrl);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  style={{
                    flex: 1,
                    background: "var(--g-accent, #ea580c)",
                    color: "#fff",
                    border: "none",
                    borderRadius: "7px",
                    padding: "9px 14px",
                    fontSize: "0.84rem",
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                    boxShadow: "0 4px 14px rgba(234, 88, 12, 0.4)",
                    transition: "transform 0.15s, background 0.15s"
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-1px)")}
                  onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
                >
                  Read Next Story <ArrowRight size={14} />
                </button>

                <button
                  onClick={() => {
                    handleCloseBook();
                    navigate("/stories");
                  }}
                  style={{
                    background: "rgba(0,0,0,0.05)",
                    border: `1px solid ${colors.border}`,
                    color: colors.text,
                    borderRadius: "7px",
                    padding: "9px 12px",
                    fontSize: "0.78rem",
                    fontWeight: 600,
                    cursor: "pointer"
                  }}
                  title="Browse Catalog"
                >
                  All Stories
                </button>
              </div>
            </div>
          ) : (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                flex: 1,
                textAlign: "center",
                padding: "20px"
              }}
            >
              <p style={{ color: colors.headerText, fontStyle: "italic", fontSize: "0.92rem", marginBottom: "16px" }}>
                Browse our complete collection of stories and dispatches.
              </p>
              <Link
                to="/stories"
                style={{
                  background: "var(--g-accent, #ea580c)",
                  color: "#fff",
                  borderRadius: "8px",
                  padding: "10px 18px",
                  fontSize: "0.85rem",
                  fontWeight: 700,
                  textDecoration: "none",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px"
                }}
              >
                Browse All Stories <ArrowRight size={14} />
              </Link>
            </div>
          )}

          {/* Bottom optional small secondary stories */}
          {otherStories.length > 0 && (
            <div style={{ borderTop: `1px solid ${colors.border}`, paddingTop: "6px", display: "flex", gap: "8px", alignItems: "center" }}>
              <span style={{ fontSize: "0.68rem", color: colors.headerText, fontWeight: 700, textTransform: "uppercase" }}>More:</span>
              {otherStories.map((other, idx) => (
                <button
                  key={other._id || idx}
                  onClick={() => {
                    navigate(getStoryUrl(other));
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    padding: 0,
                    color: "var(--g-accent, #ea580c)",
                    fontSize: "0.74rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    textDecoration: "underline",
                    textOverflow: "ellipsis",
                    overflow: "hidden",
                    whiteSpace: "nowrap",
                    maxWidth: "140px"
                  }}
                  title={other.title}
                >
                  {other.title}
                </button>
              ))}
            </div>
          )}
        </div>
      );
    }

    const isSingleImagePage = page.items?.length === 1 && page.items[0]?.type === "image";

    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          boxSizing: "border-box",
          justifyContent: "flex-start"
        }}
      >
        {/* Drop cap opening header if page 1 */}
        {page.isOpening && (
          <div style={{ marginBottom: "12px", flexShrink: 0 }}>
            <h1 style={{ fontFamily: fontFamilyStyle, fontSize: "1.65rem", fontWeight: 800, margin: "0 0 4px", lineHeight: 1.25, color: colors.text }}>
              {post.title}
            </h1>
            <p style={{ margin: 0, fontSize: "0.82rem", color: colors.headerText, fontStyle: "italic" }}>
              By {post.author?.name || "Author"}
            </p>
          </div>
        )}

        {/* Sequential content blocks */}
        {page.items?.map((item, idx) => {
          if (item.type === "image") {
            const isOnlyItem = page.items.length === 1;
            const imgH = isOnlyItem ? `${Math.min(pageDimensions.height - 40, 480)}px` : `${item.renderHeight || 340}px`;
            return (
              <div
                key={idx}
                onClick={() => setActiveLightboxImg(item.src)}
                style={{
                  width: "100%",
                  height: imgH,
                  maxHeight: imgH,
                  flexShrink: 0,
                  display: "block",
                  margin: isOnlyItem ? "0" : "2px 0 12px 0",
                  position: "relative",
                  cursor: "pointer",
                  borderRadius: "8px",
                  overflow: "hidden",
                  border: `1px solid ${colors.border}`,
                  boxShadow: "0 6px 20px rgba(0,0,0,0.12)"
                }}
                title="Click to view full image in lightbox"
              >
                <img
                  src={item.src}
                  alt={item.alt || "Illustration"}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    objectPosition: "center",
                    display: "block",
                    transition: "transform 0.25s ease"
                  }}
                />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveLightboxImg(item.src);
                  }}
                  style={{
                    position: "absolute",
                    bottom: "8px",
                    right: "8px",
                    background: "rgba(0,0,0,0.75)",
                    backdropFilter: "blur(6px)",
                    border: "1px solid rgba(255,255,255,0.25)",
                    color: "#fff",
                    width: "28px",
                    height: "28px",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer"
                  }}
                  title="Zoom Image"
                >
                  <ZoomIn size={13} />
                </button>
              </div>
            );
          }

          if (item.type === "heading") {
            return (
              <div
                key={idx}
                className="book-scene-html"
                dangerouslySetInnerHTML={{ __html: item.html }}
                style={{ margin: "10px 0 6px" }}
              />
            );
          }

          if (item.type === "quote") {
            return (
              <div
                key={idx}
                className="book-scene-html"
                dangerouslySetInnerHTML={{ __html: item.html }}
                style={{ margin: "10px 0" }}
              />
            );
          }

          return (
            <div
              key={idx}
              className={`book-scene-html ${page.isOpening && idx === 0 ? "book-dropcap" : ""}`}
              dangerouslySetInnerHTML={{ __html: item.html }}
              style={{
                textAlign: "left",
                lineHeight: "inherit",
                margin: "0 0 10px 0"
              }}
            />
          );
        })}
      </div>
    );
  };

  return (
    <div
      ref={bookContainerRef}
      style={{
        width: "100%",
        padding: isOpen ? "8px 16px 10px" : "32px 18px 70px",
        background: isOpen ? "#070a10" : "radial-gradient(ellipse at top, #141c2a 0%, #070a10 100%)",
        position: isOpen ? "fixed" : "relative",
        inset: isOpen ? 0 : "auto",
        zIndex: isOpen ? 9999 : 1,
        minHeight: isOpen ? "100vh" : "720px",
        height: isOpen ? "100vh" : "auto",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        boxSizing: "border-box",
        overflow: "hidden",
        transition: "all 0.3s ease"
      }}
    >
      {/* Offscreen DOM Measuring Sandbox */}
      <div
        ref={measurerRef}
        style={{
          position: "absolute",
          top: "-99999px",
          left: "-99999px",
          visibility: "hidden",
          pointerEvents: "none",
          zIndex: -100
        }}
      />

      {/* Ambient background glow */}
      <div
        style={{
          position: "absolute",
          top: "14%",
          left: "50%",
          transform: "translateX(-50%)",
          width: "900px",
          height: "500px",
          background: "radial-gradient(circle, rgba(234, 88, 12, 0.16) 0%, rgba(99, 102, 241, 0.08) 50%, transparent 80%)",
          filter: "blur(100px)",
          pointerEvents: "none",
          zIndex: 0
        }}
      />

      {/* Top Header / Breadcrumbs (Only when closed) */}
      {!isOpen && (
        <div
          style={{
            position: "relative",
            zIndex: 10,
            maxWidth: "1380px",
            width: "100%",
            marginBottom: "24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "14px"
          }}
        >
          {breadcrumb}

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                background: "rgba(234, 88, 12, 0.12)",
                color: "var(--g-accent, #ea580c)",
                border: "1px solid rgba(234, 88, 12, 0.3)",
                padding: "6px 16px",
                borderRadius: "20px",
                fontSize: "0.82rem",
                fontWeight: 600,
                letterSpacing: "0.5px",
                textTransform: "uppercase"
              }}
            >
              <Sparkles size={14} /> Realistic Open Book Edition
            </span>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* VIEW 1: GRAND CLOSED 3D BOOK COVER                             */}
      {/* ============================================================== */}
      {!isOpen && (
        <div
          style={{
            position: "relative",
            zIndex: 5,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            padding: "20px 0 32px"
          }}
        >
          <div
            style={{
              perspective: "2200px",
              cursor: "pointer",
              transition: "transform 0.3s ease"
            }}
            onClick={handleOpenBook}
            title="Click cover to open book"
          >
            <div
              className="book-cover-3d"
              style={{
                width: "420px",
                height: "580px",
                position: "relative",
                transformStyle: "preserve-3d",
                transform: "rotateY(-24deg) rotateX(8deg)",
                transition: "all 0.5s cubic-bezier(0.2, 0.8, 0.2, 1)",
                borderRadius: "5px 16px 16px 5px",
                boxShadow: "-32px 42px 65px rgba(0,0,0,0.72), -8px 14px 22px rgba(0,0,0,0.5), inset 4px 0 12px rgba(255,255,255,0.12)"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "rotateY(-12deg) rotateX(4deg) translateY(-16px) scale(1.03)";
                e.currentTarget.style.boxShadow = "-38px 52px 80px rgba(0,0,0,0.82), -10px 18px 28px rgba(0,0,0,0.6)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "rotateY(-24deg) rotateX(8deg)";
                e.currentTarget.style.boxShadow = "-32px 42px 65px rgba(0,0,0,0.72), -8px 14px 22px rgba(0,0,0,0.5)";
              }}
            >
              {/* Spiral Wire Coil Binding (Left Spine Edge - matches Screenshot 1) */}
              <div
                style={{
                  position: "absolute",
                  left: "-13px",
                  top: 0,
                  bottom: 0,
                  width: "38px",
                  zIndex: 35,
                  transform: "translateZ(3px)",
                  pointerEvents: "none"
                }}
              >
                <SpiralCoilBinding height={580} isEdge={true} />
              </div>

              {/* Spine */}
              <div
                style={{
                  position: "absolute",
                  left: "-36px",
                  top: 0,
                  width: "36px",
                  height: "100%",
                  background: defaultCover,
                  transformOrigin: "right",
                  transform: "rotateY(-90deg)",
                  borderRadius: "4px 0 0 4px",
                  backgroundImage: "linear-gradient(90deg, rgba(0,0,0,0.6) 0%, rgba(255,255,255,0.2) 50%, rgba(0,0,0,0.5) 100%)",
                  boxShadow: "inset 0 0 8px rgba(0,0,0,0.7)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}
              >
                <span
                  style={{
                    writingMode: "vertical-rl",
                    textOrientation: "mixed",
                    transform: "rotate(180deg)",
                    color: "rgba(255,255,255,0.85)",
                    fontSize: "0.76rem",
                    fontWeight: 700,
                    letterSpacing: "3px",
                    textTransform: "uppercase"
                  }}
                >
                  {post.title?.slice(0, 38)}
                </span>
              </div>

              {/* Edge paper texture */}
              <div
                style={{
                  position: "absolute",
                  right: "-30px",
                  top: "8px",
                  width: "34px",
                  height: "calc(100% - 16px)",
                  background: "repeating-linear-gradient(90deg, #ece4d0 0px, #ece4d0 2px, #d8cdb4 3px, #fcf9f2 5px)",
                  transformOrigin: "left",
                  transform: "rotateY(90deg)",
                  borderRadius: "0 3px 3px 0",
                  boxShadow: "inset -3px 0 6px rgba(0,0,0,0.35)"
                }}
              />

              {/* Cover Face */}
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  borderRadius: "5px 16px 16px 5px",
                  background: defaultCover,
                  overflow: "hidden",
                  position: "relative",
                  display: "flex",
                  flexDirection: "column",
                  border: "2px solid rgba(255, 255, 255, 0.15)",
                  boxSizing: "border-box"
                }}
              >
                <div style={{ position: "relative", height: "66%", width: "100%", overflow: "hidden" }}>
                  <img
                    src={bannerImage || post.featuredImage || "/placeholder-story.jpg"}
                    alt={post.title}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      filter: "brightness(0.94) contrast(1.05)"
                    }}
                  />
                  <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.65) 100%)" }} />
                  <div style={{ position: "absolute", inset: "14px 14px 14px 22px", border: "2px solid rgba(255, 215, 0, 0.4)", borderRadius: "6px", pointerEvents: "none" }} />
                  <div
                    style={{
                      position: "absolute",
                      top: "26px",
                      left: "30px",
                      background: "rgba(0,0,0,0.78)",
                      backdropFilter: "blur(8px)",
                      border: "1px solid rgba(255,255,255,0.25)",
                      padding: "4px 14px",
                      borderRadius: "14px",
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      color: "#fbbf24",
                      textTransform: "uppercase",
                      letterSpacing: "0.8px"
                    }}
                  >
                    {post.category?.name || "Illustrated Story"}
                  </div>
                </div>

                <div
                  style={{
                    flex: 1,
                    padding: "22px 26px 22px 28px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    background: `linear-gradient(180deg, ${defaultCover} 0%, rgba(0,0,0,0.96) 100%)`,
                    borderTop: "1px solid rgba(255, 215, 0, 0.3)"
                  }}
                >
                  <div>
                    <h2
                      style={{
                        fontFamily: fontFamilyStyle,
                        fontSize: "1.42rem",
                        fontWeight: 700,
                        color: "#fff",
                        margin: "0 0 8px",
                        lineHeight: 1.3,
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden"
                      }}
                    >
                      {post.title}
                    </h2>
                    <p style={{ margin: 0, fontSize: "0.86rem", color: "rgba(255,255,255,0.72)", fontStyle: "italic" }}>
                      By {post.author?.name || "Author"}
                    </p>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      paddingTop: "12px",
                      borderTop: "1px solid rgba(255,255,255,0.1)",
                      fontSize: "0.8rem",
                      color: "rgba(255,255,255,0.6)"
                    }}
                  >
                    <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <BookOpen size={15} /> {totalSpreads} Spreads ({totalSinglePages} Pages)
                    </span>
                    <span style={{ color: "var(--g-accent, #ea580c)", fontWeight: 700 }}>Click to read full story →</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* VIEW 2: OPEN DIGITAL BOOK SPREAD                               */}
      {/* ============================================================== */}
      {isOpen && (
        <div
          style={{
            position: "relative",
            zIndex: 10,
            width: "100%",
            maxWidth: readingMode === "spread" ? "1540px" : "960px",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "flex-start",
            padding: "6px 14px 10px",
            boxSizing: "border-box"
          }}
        >
          {/* Top Control Toolbar */}
          <div
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              position: "relative",
              gap: "10px",
              padding: "7px 14px",
              background: "rgba(17, 24, 39, 0.94)",
              backdropFilter: "blur(14px)",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              borderRadius: "12px",
              marginBottom: "8px",
              boxShadow: "0 12px 30px rgba(0,0,0,0.45)",
              flexShrink: 0,
              minHeight: "48px",
              boxSizing: "border-box"
            }}
          >
            {/* Left: Close & Mode Toggle */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px", zIndex: 2, flexShrink: 0 }}>
              <button
                onClick={handleCloseBook}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  background: "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.15)",
                  color: "#cbd5e1",
                  padding: "6px 12px",
                  borderRadius: "8px",
                  fontSize: "0.80rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.2s"
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.14)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.08)")}
              >
                <RotateCcw size={13} /> Close Book
              </button>

              {/* Mode switch */}
              <div
                style={{
                  display: "flex",
                  background: "rgba(255,255,255,0.06)",
                  borderRadius: "8px",
                  padding: "2px",
                  border: "1px solid rgba(255,255,255,0.12)"
                }}
              >
                <button
                  onClick={() => setReadingMode("spread")}
                  style={{
                    border: "none",
                    background: readingMode === "spread" ? "var(--g-accent, #ea580c)" : "transparent",
                    color: readingMode === "spread" ? "#fff" : "rgba(255,255,255,0.65)",
                    padding: "4px 10px",
                    borderRadius: "6px",
                    fontSize: "0.78rem",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "5px",
                    fontWeight: 600
                  }}
                  title="2-Page Book Spread (Desktop)"
                >
                  <Layers size={13} /> 2-Page Spread
                </button>

                <button
                  onClick={() => setReadingMode("single")}
                  style={{
                    border: "none",
                    background: readingMode === "single" ? "var(--g-accent, #ea580c)" : "transparent",
                    color: readingMode === "single" ? "#fff" : "rgba(255,255,255,0.65)",
                    padding: "4px 10px",
                    borderRadius: "6px",
                    fontSize: "0.78rem",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "5px",
                    fontWeight: 600
                  }}
                  title="Single Screen Page"
                >
                  <FileText size={13} /> Single Page
                </button>

                <button
                  onClick={() => setReadingMode("continuous")}
                  style={{
                    border: "none",
                    background: readingMode === "continuous" ? "var(--g-accent, #ea580c)" : "transparent",
                    color: readingMode === "continuous" ? "#fff" : "rgba(255,255,255,0.65)",
                    padding: "4px 10px",
                    borderRadius: "6px",
                    fontSize: "0.78rem",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "5px",
                    fontWeight: 600
                  }}
                  title="Continuous Scroll"
                >
                  <Scroll size={13} /> Continuous
                </button>
              </div>
            </div>

            {/* Right: Audio, Font Size, Theme, Fullscreen & Spread/Page Navigator (Right Aligned, Zero Overlap) */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px", zIndex: 2, marginLeft: "auto", flexShrink: 0, flexWrap: "wrap", justifyContent: "flex-end" }}>
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                style={{
                  background: soundEnabled ? "rgba(234, 88, 12, 0.15)" : "rgba(255,255,255,0.06)",
                  border: soundEnabled ? "1px solid rgba(234, 88, 12, 0.35)" : "1px solid rgba(255,255,255,0.1)",
                  color: soundEnabled ? "var(--g-accent, #ea580c)" : "rgba(255,255,255,0.5)",
                  padding: "5px 6px",
                  borderRadius: "7px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}
                title={soundEnabled ? "Mute Page Sound" : "Enable Page Sound"}
              >
                {soundEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
              </button>

              {/* Font Size */}
              <div style={{ display: "flex", background: "rgba(255,255,255,0.06)", borderRadius: "7px", padding: "2px", border: "1px solid rgba(255,255,255,0.12)" }}>
                {["small", "normal", "large"].map((size) => (
                  <button
                    key={size}
                    onClick={() => setFontSize(size)}
                    style={{
                      border: "none",
                      background: fontSize === size ? "var(--g-accent, #ea580c)" : "transparent",
                      color: fontSize === size ? "#fff" : "rgba(255,255,255,0.65)",
                      padding: "3px 7px",
                      borderRadius: "5px",
                      fontSize: size === "small" ? "0.74rem" : size === "normal" ? "0.80rem" : "0.90rem",
                      cursor: "pointer",
                      fontWeight: 700
                    }}
                  >
                    A
                  </button>
                ))}
              </div>

              {/* Font / Text Color Selector */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  background: "rgba(255,255,255,0.06)",
                  borderRadius: "7px",
                  padding: "2px 5px",
                  border: "1px solid rgba(255,255,255,0.12)"
                }}
                title="Select 3D Text Reading Color"
              >
                <Type size={12} style={{ color: "rgba(255,255,255,0.6)", marginRight: "1px" }} />
                {FONT_COLOR_OPTIONS.map((fc) => {
                  const isSelected = (!fontColor && (colors.paperImage ? fc.id === "royal_gold" : fc.id === "deep_black")) || (fontColor === fc.color || fontColor === fc.id);
                  return (
                    <button
                      key={fc.id}
                      onClick={() => setFontColor(fc.id)}
                      style={{
                        width: "16px",
                        height: "16px",
                        borderRadius: "50%",
                        background: fc.swatch,
                        border: isSelected ? "2px solid #ea580c" : (fc.id === "deep_black" ? "1.5px solid rgba(255,255,255,0.6)" : "1px solid rgba(255,255,255,0.3)"),
                        boxShadow: isSelected
                          ? "0 0 0 2px rgba(234, 88, 12, 0.6), 0 2px 5px rgba(0,0,0,0.4)"
                          : "0 1px 3px rgba(0,0,0,0.3)",
                        cursor: "pointer",
                        transform: isSelected ? "scale(1.2)" : "scale(1)",
                        transition: "all 0.15s ease",
                        padding: 0,
                        flexShrink: 0
                      }}
                      title={`Text Color: ${fc.label}`}
                    />
                  );
                })}
              </div>

              {/* Dim Light / Soft Reading Ambient Mode Toggle */}
              <button
                onClick={() => setIsDimLight(!isDimLight)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                  background: isDimLight ? "rgba(251, 191, 36, 0.2)" : "rgba(255,255,255,0.06)",
                  border: isDimLight ? "1px solid rgba(251, 191, 36, 0.5)" : "1px solid rgba(255,255,255,0.12)",
                  color: isDimLight ? "#fbbf24" : "rgba(255,255,255,0.7)",
                  padding: "4px 9px",
                  borderRadius: "7px",
                  fontSize: "0.78rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.2s ease"
                }}
                title={isDimLight ? "Dim Light ON: Eye comfort anti-glare active" : "Dim Light OFF: Click to soften glare and dim page brightness"}
              >
                <SunDim size={14} />
                <span>{isDimLight ? "Dim Light: ON" : "Dim Light"}</span>
              </button>

              {/* Theme & Wallpaper Selector */}
              <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
                {/* Old Paper Wallpapers */}
                {PAPER_THEMES.filter((t) => t.isWallpaper).map((theme) => {
                  const isSelected = paperTheme === theme.id;
                  return (
                    <button
                      key={theme.id}
                      onClick={() => {
                        setPaperTheme(theme.id);
                        setFontColor(null);
                      }}
                      style={{
                        width: "20px",
                        height: "20px",
                        borderRadius: "5px",
                        backgroundImage: `url(${theme.swatch})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                        backgroundColor: "#ecd8ad",
                        border: isSelected ? "2px solid #ea580c" : "1px solid rgba(255,255,255,0.35)",
                        boxShadow: isSelected
                          ? "0 0 0 2px rgba(234, 88, 12, 0.45), 0 2px 6px rgba(0,0,0,0.4)"
                          : "0 1px 3px rgba(0,0,0,0.3)",
                        cursor: "pointer",
                        transform: isSelected ? "scale(1.15)" : "scale(1)",
                        transition: "transform 0.15s ease, box-shadow 0.15s ease",
                        flexShrink: 0
                      }}
                      title={theme.tooltip}
                    />
                  );
                })}

                <div style={{ width: "1px", height: "13px", background: "rgba(255,255,255,0.22)", margin: "0 2px" }} />

                {/* Solid Color Paper Swatches */}
                {PAPER_THEMES.filter((t) => !t.isWallpaper).map((theme) => {
                  const isSelected = paperTheme === theme.id;
                  return (
                    <button
                      key={theme.id}
                      onClick={() => {
                        setPaperTheme(theme.id);
                        setFontColor(null);
                      }}
                      style={{
                        width: "17px",
                        height: "17px",
                        borderRadius: "50%",
                        background: theme.swatch,
                        border: isSelected ? "2px solid #ea580c" : "1px solid rgba(255,255,255,0.3)",
                        boxShadow: isSelected
                          ? "0 0 0 2px rgba(234, 88, 12, 0.45), 0 2px 5px rgba(0,0,0,0.3)"
                          : "0 1px 3px rgba(0,0,0,0.25)",
                        cursor: "pointer",
                        transform: isSelected ? "scale(1.15)" : "scale(1)",
                        transition: "transform 0.15s ease, box-shadow 0.15s ease",
                        flexShrink: 0
                      }}
                      title={theme.tooltip}
                    />
                  );
                })}
              </div>

              {/* Fullscreen toggle */}
              <button
                onClick={toggleFullscreen}
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  color: "#cbd5e1",
                  padding: "5px",
                  borderRadius: "7px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}
                title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
              >
                {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
              </button>

              {/* Spread / Single Page Navigator (Align Right - in-flow flex, zero overlap) */}
              {(readingMode === "spread" || readingMode === "single") && (
                <>
                  <div style={{ width: "1px", height: "20px", background: "rgba(255,255,255,0.18)", margin: "0 2px" }} />
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      background: "rgba(255,255,255,0.08)",
                      border: "1px solid rgba(255,255,255,0.16)",
                      borderRadius: "8px",
                      padding: "2px 8px",
                      flexShrink: 0
                    }}
                  >
                    {readingMode === "spread" && (
                      <>
                        <button
                          onClick={handlePrevSpread}
                          disabled={currentSpreadIndex === 0}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            width: "26px",
                            height: "26px",
                            borderRadius: "50%",
                            background: currentSpreadIndex === 0 ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.12)",
                            border: "1px solid rgba(255,255,255,0.18)",
                            color: currentSpreadIndex === 0 ? "rgba(255,255,255,0.2)" : "#fff",
                            cursor: currentSpreadIndex === 0 ? "not-allowed" : "pointer",
                            transition: "all 0.15s ease"
                          }}
                          title="Previous Pages (Left Arrow)"
                        >
                          <ChevronLeft size={15} />
                        </button>

                        <div style={{ textAlign: "center", minWidth: "115px", userSelect: "none", padding: "0 4px" }}>
                          <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "#fff", whiteSpace: "nowrap" }}>
                            Spread {currentSpreadIndex + 1} of {totalSpreads}
                          </div>
                          <div style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.6)", whiteSpace: "nowrap" }}>
                            Pages {activeSpread?.leftPage?.pageNumber || currentSpreadIndex * 2 + 1} & {activeSpread?.rightPage?.pageNumber || currentSpreadIndex * 2 + 2}
                          </div>
                        </div>

                        <button
                          onClick={handleNextSpread}
                          disabled={currentSpreadIndex >= totalSpreads - 1}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            width: "26px",
                            height: "26px",
                            borderRadius: "50%",
                            background: currentSpreadIndex >= totalSpreads - 1 ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.12)",
                            border: "1px solid rgba(255,255,255,0.18)",
                            color: currentSpreadIndex >= totalSpreads - 1 ? "rgba(255,255,255,0.2)" : "#fff",
                            cursor: currentSpreadIndex >= totalSpreads - 1 ? "not-allowed" : "pointer",
                            transition: "all 0.15s ease"
                          }}
                          title="Next Pages (Right Arrow)"
                        >
                          <ChevronRight size={15} />
                        </button>
                      </>
                    )}

                    {readingMode === "single" && (
                      <>
                        <button
                          onClick={handlePrevSinglePage}
                          disabled={currentSinglePageIndex === 0}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            width: "26px",
                            height: "26px",
                            borderRadius: "50%",
                            background: currentSinglePageIndex === 0 ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.12)",
                            border: "1px solid rgba(255,255,255,0.18)",
                            color: currentSinglePageIndex === 0 ? "rgba(255,255,255,0.2)" : "#fff",
                            cursor: currentSinglePageIndex === 0 ? "not-allowed" : "pointer",
                            transition: "all 0.15s ease"
                          }}
                          title="Previous Page"
                        >
                          <ChevronLeft size={15} />
                        </button>

                        <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "#fff", minWidth: "100px", textAlign: "center", whiteSpace: "nowrap", userSelect: "none", padding: "0 4px" }}>
                          Page {currentSinglePageIndex + 1} of {totalSinglePages}
                        </div>

                        <button
                          onClick={handleNextSinglePage}
                          disabled={currentSinglePageIndex >= totalSinglePages - 1}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            width: "26px",
                            height: "26px",
                            borderRadius: "50%",
                            background: currentSinglePageIndex >= totalSinglePages - 1 ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.12)",
                            border: "1px solid rgba(255,255,255,0.18)",
                            color: currentSinglePageIndex >= totalSinglePages - 1 ? "rgba(255,255,255,0.2)" : "#fff",
                            cursor: currentSinglePageIndex >= totalSinglePages - 1 ? "not-allowed" : "pointer",
                            transition: "all 0.15s ease"
                          }}
                          title="Next Page"
                        >
                          <ChevronRight size={15} />
                        </button>
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Centered Main Book Stage */}
          <div
            style={{
              flex: 1,
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
              minHeight: 0
            }}
          >
            {/* ============================================================== */}
            {/* SPREAD MODE: REALISTIC TWO-PAGE SPREAD (DESKTOP)               */}
            {/* ============================================================== */}
            {readingMode === "spread" && (
              <div
                style={{
                  position: "relative",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  maxWidth: "100%"
                }}
              >
                {/* Left Middle Slider Button */}
                <button
                  onClick={handlePrevSpread}
                  disabled={currentSpreadIndex === 0}
                  style={{
                    position: "absolute",
                    left: typeof window !== "undefined" && window.innerWidth < 960 ? "6px" : "-58px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    zIndex: 60,
                    width: "48px",
                    height: "48px",
                    borderRadius: "50%",
                    background: currentSpreadIndex === 0 ? "rgba(15, 23, 42, 0.4)" : "rgba(15, 23, 42, 0.88)",
                    backdropFilter: "blur(12px)",
                    border: "1px solid rgba(255, 255, 255, 0.2)",
                    boxShadow: "0 8px 24px rgba(0, 0, 0, 0.55), 0 2px 6px rgba(0,0,0,0.3)",
                    color: currentSpreadIndex === 0 ? "rgba(255, 255, 255, 0.2)" : "#ffffff",
                    cursor: currentSpreadIndex === 0 ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "all 0.2s cubic-bezier(0.2, 0.8, 0.2, 1)",
                    opacity: currentSpreadIndex === 0 ? 0.35 : 1
                  }}
                  onMouseEnter={(e) => {
                    if (currentSpreadIndex > 0) {
                      e.currentTarget.style.transform = "translateY(-50%) scale(1.12)";
                      e.currentTarget.style.background = "var(--g-accent, #ea580c)";
                      e.currentTarget.style.boxShadow = "0 12px 30px rgba(234, 88, 12, 0.55)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(-50%) scale(1)";
                    e.currentTarget.style.background = currentSpreadIndex === 0 ? "rgba(15, 23, 42, 0.4)" : "rgba(15, 23, 42, 0.88)";
                    e.currentTarget.style.boxShadow = "0 8px 24px rgba(0, 0, 0, 0.55), 0 2px 6px rgba(0,0,0,0.3)";
                  }}
                  title="Previous Pages (Left Arrow)"
                >
                  <ChevronLeft size={24} />
                </button>

                <div
                  className="book-open-spread"
                  style={{
                    width: `${pageDimensions.spreadWidth || 1120}px`,
                    maxWidth: "100%",
                    height: `${pageDimensions.spreadHeight || 680}px`,
                    margin: "0 auto",
                    ...getPaperBackgroundStyle(colors),
                    borderRadius: "12px",
                    position: "relative",
                    boxShadow: isDimLight
                      ? "0 40px 95px rgba(0, 0, 0, 0.88), 0 0 50px rgba(251, 191, 36, 0.06)"
                      : "0 40px 85px rgba(0, 0, 0, 0.65), 0 14px 28px rgba(0, 0, 0, 0.45)",
                    filter: isDimLight ? "brightness(0.85) contrast(0.96) sepia(0.08)" : "none",
                    transition: "filter 0.3s ease, box-shadow 0.3s ease, background 0.3s ease",
                    overflow: "hidden",
                    border: `1px solid ${colors.border}`,
                    display: "flex",
                    flexDirection: "column",
                    boxSizing: "border-box",
                    flexShrink: 0
                  }}
                >
                  {/* 2-Page Body (Running header REMOVED per user request) */}
                  <div
                    style={{
                      height: `${pageDimensions.height}px`,
                      width: "100%",
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      position: "relative",
                      boxSizing: "border-box",
                      overflow: "hidden"
                    }}
                  >
                    {/* Spiral Ring Coil Wire Binding (matches Screenshot 2) */}
                    <SpiralCoilBinding height={pageDimensions.height} isEdge={false} />

                    {/* Left Page (DOM-Measured with 20px Bottom Safe Area) */}
                    <div
                      className={`book-left-page ${flipAnimation === "next" ? "anim-flip-next-left" : ""} ${flipAnimation === "prev" ? "anim-flip-prev-left" : ""}`}
                      style={{
                        width: `${pageDimensions.width}px`,
                        height: `${pageDimensions.height}px`,
                        maxHeight: `${pageDimensions.height}px`,
                        padding: "16px 34px 20px 34px", // Strict 20px bottom safe area padding
                        boxSizing: "border-box",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "flex-start",
                        position: "relative",
                        ...getPaperBackgroundStyle(colors, false),
                        borderRight: `1px solid ${colors.border}`,
                        overflow: "hidden", // Protected by DOM measurement: zero clipping!
                        color: activeTextColor,
                        fontFamily: fontFamilyStyle,
                        fontSize: fontSizes[fontSize],
                        lineHeight: lineHeights[fontSize]
                      }}
                    >
                      {/* Crisp Vintage Wallpaper Backdrop + Delicate Glassmorphic Sheen (Texture 100% Intact, Zero Blur) */}
                      <WallpaperBackdrop imageUrl={colors.paperImage} position="left center" isLightText={isLightColor} />
                      <div style={{ position: "relative", zIndex: 1, width: "100%", height: "100%", display: "flex", flexDirection: "column" }}>
                        {renderPageItems(activeSpread?.leftPage)}
                      </div>
                    </div>

                    {/* Right Page (DOM-Measured with 20px Bottom Safe Area) */}
                    <div
                      className={`book-right-page ${flipAnimation === "next" ? "anim-flip-next-right" : ""}`}
                      style={{
                        width: `${pageDimensions.width}px`,
                        height: `${pageDimensions.height}px`,
                        maxHeight: `${pageDimensions.height}px`,
                        padding: "16px 34px 20px 34px", // Strict 20px bottom safe area padding
                        boxSizing: "border-box",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "flex-start",
                        position: "relative",
                        ...getPaperBackgroundStyle(colors, true),
                        overflow: "hidden", // Protected by DOM measurement: zero clipping!
                        color: activeTextColor,
                        fontFamily: fontFamilyStyle,
                        fontSize: fontSizes[fontSize],
                        lineHeight: lineHeights[fontSize]
                      }}
                    >
                      {/* Crisp Vintage Wallpaper Backdrop + Delicate Glassmorphic Sheen (Texture 100% Intact, Zero Blur) */}
                      <WallpaperBackdrop imageUrl={colors.paperImage} position="right center" isLightText={isLightColor} />
                      <div style={{ position: "relative", zIndex: 1, width: "100%", height: "100%", display: "flex", flexDirection: "column" }}>
                        {renderPageItems(activeSpread?.rightPage)}
                      </div>
                    </div>
                  </div>

                  {/* Running Footer Bar - Clean Centered Page Numbers */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      padding: "6px 36px 8px",
                      borderTop: `1px solid ${colors.border}`,
                      fontSize: "0.82rem",
                      color: colors.headerText,
                      flexShrink: 0,
                      position: "relative",
                      zIndex: 2,
                      background: colors.paperImage ? "rgba(0, 0, 0, 0.28)" : "transparent"
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", paddingRight: "36px" }}>
                      <span style={{ fontWeight: 600, letterSpacing: "1px" }}>
                        — Page {activeSpread?.leftPage?.pageNumber || currentSpreadIndex * 2 + 1} —
                      </span>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", paddingLeft: "36px" }}>
                      <span style={{ fontWeight: 600, letterSpacing: "1px" }}>
                        — Page {activeSpread?.rightPage?.pageNumber || currentSpreadIndex * 2 + 2} —
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right Middle Slider Button */}
                <button
                  onClick={handleNextSpread}
                  disabled={currentSpreadIndex >= totalSpreads - 1}
                  style={{
                    position: "absolute",
                    right: typeof window !== "undefined" && window.innerWidth < 960 ? "6px" : "-58px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    zIndex: 60,
                    width: "48px",
                    height: "48px",
                    borderRadius: "50%",
                    background: currentSpreadIndex >= totalSpreads - 1 ? "rgba(15, 23, 42, 0.4)" : "rgba(15, 23, 42, 0.88)",
                    backdropFilter: "blur(12px)",
                    border: "1px solid rgba(255, 255, 255, 0.2)",
                    boxShadow: "0 8px 24px rgba(0, 0, 0, 0.55), 0 2px 6px rgba(0,0,0,0.3)",
                    color: currentSpreadIndex >= totalSpreads - 1 ? "rgba(255, 255, 255, 0.2)" : "#ffffff",
                    cursor: currentSpreadIndex >= totalSpreads - 1 ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "all 0.2s cubic-bezier(0.2, 0.8, 0.2, 1)",
                    opacity: currentSpreadIndex >= totalSpreads - 1 ? 0.35 : 1
                  }}
                  onMouseEnter={(e) => {
                    if (currentSpreadIndex < totalSpreads - 1) {
                      e.currentTarget.style.transform = "translateY(-50%) scale(1.12)";
                      e.currentTarget.style.background = "var(--g-accent, #ea580c)";
                      e.currentTarget.style.boxShadow = "0 12px 30px rgba(234, 88, 12, 0.55)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(-50%) scale(1)";
                    e.currentTarget.style.background = currentSpreadIndex >= totalSpreads - 1 ? "rgba(15, 23, 42, 0.4)" : "rgba(15, 23, 42, 0.88)";
                    e.currentTarget.style.boxShadow = "0 8px 24px rgba(0, 0, 0, 0.55), 0 2px 6px rgba(0,0,0,0.3)";
                  }}
                  title="Next Pages (Right Arrow)"
                >
                  <ChevronRight size={24} />
                </button>
              </div>
            )}

          {/* ============================================================== */}
          {/* SINGLE PAGE MODE (MOBILE / TABLET / DESKTOP CLEAN)             */}
          {/* ============================================================== */}
          {readingMode === "single" && (
            <div
              style={{
                position: "relative",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                maxWidth: "100%"
              }}
            >
              {/* Left Middle Slider Button */}
              <button
                onClick={handlePrevSinglePage}
                disabled={currentSinglePageIndex === 0}
                style={{
                  position: "absolute",
                  left: typeof window !== "undefined" && window.innerWidth < 960 ? "6px" : "-58px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  zIndex: 60,
                  width: "48px",
                  height: "48px",
                  borderRadius: "50%",
                  background: currentSinglePageIndex === 0 ? "rgba(15, 23, 42, 0.4)" : "rgba(15, 23, 42, 0.88)",
                  backdropFilter: "blur(12px)",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                  boxShadow: "0 8px 24px rgba(0, 0, 0, 0.55), 0 2px 6px rgba(0,0,0,0.3)",
                  color: currentSinglePageIndex === 0 ? "rgba(255, 255, 255, 0.2)" : "#ffffff",
                  cursor: currentSinglePageIndex === 0 ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.2s cubic-bezier(0.2, 0.8, 0.2, 1)",
                  opacity: currentSinglePageIndex === 0 ? 0.35 : 1
                }}
                onMouseEnter={(e) => {
                  if (currentSinglePageIndex > 0) {
                    e.currentTarget.style.transform = "translateY(-50%) scale(1.12)";
                    e.currentTarget.style.background = "var(--g-accent, #ea580c)";
                    e.currentTarget.style.boxShadow = "0 12px 30px rgba(234, 88, 12, 0.55)";
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(-50%) scale(1)";
                  e.currentTarget.style.background = currentSinglePageIndex === 0 ? "rgba(15, 23, 42, 0.4)" : "rgba(15, 23, 42, 0.88)";
                  e.currentTarget.style.boxShadow = "0 8px 24px rgba(0, 0, 0, 0.55), 0 2px 6px rgba(0,0,0,0.3)";
                }}
                title="Previous Page"
              >
                <ChevronLeft size={24} />
              </button>

              <div
                style={{
                  width: `${pageDimensions.width}px`,
                  maxWidth: "100%",
                  height: `${pageDimensions.spreadHeight || 680}px`,
                  margin: "0 auto",
                  ...getPaperBackgroundStyle(colors),
                  borderRadius: "14px",
                  position: "relative",
                  boxShadow: isDimLight
                    ? "0 30px 80px rgba(0,0,0,0.85), 0 0 50px rgba(251, 191, 36, 0.06)"
                    : "0 28px 70px rgba(0,0,0,0.65), 0 10px 24px rgba(0,0,0,0.45)",
                  filter: isDimLight ? "brightness(0.85) contrast(0.96) sepia(0.08)" : "none",
                  transition: "filter 0.3s ease, box-shadow 0.3s ease, background 0.3s ease",
                  border: `1px solid ${colors.border}`,
                  display: "flex",
                  flexDirection: "column",
                  overflow: "hidden",
                  boxSizing: "border-box",
                  flexShrink: 0
                }}
                className={`single-article-card ${flipAnimation ? `anim-slide-${flipAnimation}` : ""}`}
              >
                {/* Single Page Body (Strict 20px bottom safe zone) */}
                <div
                  style={{
                    position: "relative",
                    width: `${pageDimensions.width}px`,
                    height: `${pageDimensions.height}px`,
                    maxHeight: `${pageDimensions.height}px`,
                    overflow: "hidden",
                    padding: "16px 34px 20px 34px",
                    boxSizing: "border-box",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "flex-start",
                    ...getPaperBackgroundStyle(colors),
                    color: activeTextColor,
                    fontFamily: fontFamilyStyle,
                    fontSize: fontSizes[fontSize],
                    lineHeight: lineHeights[fontSize]
                  }}
                >
                  {/* Crisp Vintage Wallpaper Backdrop + Delicate Glassmorphic Sheen (Texture 100% Intact, Zero Blur) */}
                  <WallpaperBackdrop imageUrl={colors.paperImage} position="center center" isLightText={isLightColor} />
                  {/* Spiral Ring Coil Wire Binding (Left Edge) */}
                  <SpiralCoilBinding height={pageDimensions.height} isEdge={true} />
                  <div style={{ position: "relative", zIndex: 1, width: "100%", height: "100%", display: "flex", flexDirection: "column" }}>
                    {renderPageItems(activeSinglePage)}
                  </div>
                </div>

                {/* Bottom Nav - Clean Centered Page Indicator */}
                <div
                  style={{
                    padding: "8px 24px 10px",
                    borderTop: `1px solid ${colors.border}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "0.82rem",
                    color: colors.headerText,
                    flexShrink: 0
                  }}
                >
                  <span style={{ fontWeight: 600, letterSpacing: "1px" }}>
                    — Page {currentSinglePageIndex + 1} of {totalSinglePages} —
                  </span>
                </div>
              </div>

              {/* Right Middle Slider Button */}
              <button
                onClick={handleNextSinglePage}
                disabled={currentSinglePageIndex >= totalSinglePages - 1}
                style={{
                  position: "absolute",
                  right: typeof window !== "undefined" && window.innerWidth < 960 ? "6px" : "-58px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  zIndex: 60,
                  width: "48px",
                  height: "48px",
                  borderRadius: "50%",
                  background: currentSinglePageIndex >= totalSinglePages - 1 ? "rgba(15, 23, 42, 0.4)" : "rgba(15, 23, 42, 0.88)",
                  backdropFilter: "blur(12px)",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                  boxShadow: "0 8px 24px rgba(0, 0, 0, 0.55), 0 2px 6px rgba(0,0,0,0.3)",
                  color: currentSinglePageIndex >= totalSinglePages - 1 ? "rgba(255, 255, 255, 0.2)" : "#ffffff",
                  cursor: currentSinglePageIndex >= totalSinglePages - 1 ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.2s cubic-bezier(0.2, 0.8, 0.2, 1)",
                  opacity: currentSinglePageIndex >= totalSinglePages - 1 ? 0.35 : 1
                }}
                onMouseEnter={(e) => {
                  if (currentSinglePageIndex < totalSinglePages - 1) {
                    e.currentTarget.style.transform = "translateY(-50%) scale(1.12)";
                    e.currentTarget.style.background = "var(--g-accent, #ea580c)";
                    e.currentTarget.style.boxShadow = "0 12px 30px rgba(234, 88, 12, 0.55)";
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(-50%) scale(1)";
                  e.currentTarget.style.background = currentSinglePageIndex >= totalSinglePages - 1 ? "rgba(15, 23, 42, 0.4)" : "rgba(15, 23, 42, 0.88)";
                  e.currentTarget.style.boxShadow = "0 8px 24px rgba(0, 0, 0, 0.55), 0 2px 6px rgba(0,0,0,0.3)";
                }}
                title="Next Page"
              >
                <ChevronRight size={24} />
              </button>
            </div>
          )}

          {/* ============================================================== */}
          {/* CONTINUOUS SCROLL MODE                                         */}
          {/* ============================================================== */}
          {readingMode === "continuous" && (
            <div
              style={{
                width: "100%",
                maxWidth: "880px",
                position: "relative",
                ...getPaperBackgroundStyle(colors),
                filter: isDimLight ? "brightness(0.85) contrast(0.96) sepia(0.08)" : "none",
                transition: "filter 0.3s ease, background 0.3s ease",
                borderRadius: "14px",
                padding: "44px 56px",
                boxShadow: isDimLight
                  ? "0 35px 80px rgba(0, 0, 0, 0.88), 0 0 50px rgba(251, 191, 36, 0.06)"
                  : "0 35px 75px rgba(0, 0, 0, 0.65)",
                border: `1px solid ${colors.border}`,
                boxSizing: "border-box",
                color: activeTextColor,
                fontFamily: fontFamilyStyle,
                fontSize: fontSizes[fontSize],
                lineHeight: lineHeights[fontSize],
                overflowY: "auto",
                overflowX: "hidden",
                flex: 1
              }}
              className="book-continuous-content"
            >
              {/* Crisp Vintage Wallpaper Backdrop + Delicate Glassmorphic Sheen (Texture 100% Intact, Zero Blur) */}
              <WallpaperBackdrop imageUrl={colors.paperImage} position="center center" isLightText={isLightColor} />
              <div style={{ position: "relative", zIndex: 1 }}>
                <h1 style={{ fontFamily: fontFamilyStyle, fontSize: "2.1rem", marginBottom: "8px", color: activeTextColor }}>{post.title}</h1>
                <p style={{ fontStyle: "italic", opacity: 0.75, marginBottom: "32px", fontSize: "0.95rem" }}>
                  By {post.author?.name || "Author"}
                </p>

              {blocks.map((b, idx) => {
                if (b.type === "image") {
                  return (
                    <div
                      key={idx}
                      onClick={() => setActiveLightboxImg(b.src)}
                      style={{
                        margin: "24px 0",
                        borderRadius: "10px",
                        overflow: "hidden",
                        boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
                        cursor: "pointer"
                      }}
                    >
                      <img src={b.src} alt={b.alt} style={{ width: "100%", maxHeight: "500px", objectFit: "cover", display: "block" }} />
                    </div>
                  );
                }
                return (
                  <div
                    key={idx}
                    className="book-scene-html"
                    dangerouslySetInnerHTML={{ __html: b.html }}
                    style={{ margin: "0 0 16px 0" }}
                  />
                );
              })}
              </div>
            </div>
          )}
        </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* HIGH RESOLUTION LIGHTBOX MODAL                                 */}
      {/* ============================================================== */}
      {activeLightboxImg && (
        <div
          onClick={() => setActiveLightboxImg(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.92)",
            backdropFilter: "blur(12px)",
            zIndex: 100000,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px"
          }}
        >
          <button
            onClick={() => setActiveLightboxImg(null)}
            style={{
              position: "absolute",
              top: "24px",
              right: "24px",
              background: "rgba(255,255,255,0.15)",
              border: "1px solid rgba(255,255,255,0.3)",
              color: "#fff",
              width: "44px",
              height: "44px",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer"
            }}
          >
            <X size={22} />
          </button>

          <img
            src={activeLightboxImg}
            alt="Expanded illustration"
            style={{
              maxWidth: "92vw",
              maxHeight: "88vh",
              objectFit: "contain",
              borderRadius: "10px",
              boxShadow: "0 20px 60px rgba(0,0,0,0.85)"
            }}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* Embedded CSS for 3D page turn, drop-cap, and typography */}
      <style>{`
        /* 3D Realistic Book Perspective */
        .book-open-spread {
          perspective: 2600px;
          transform-style: preserve-3d;
        }

        /* 3D Flip Next Animation */
        @keyframes pageTurnNextRight {
          0% {
            transform: perspective(2200px) rotateY(0deg);
            filter: brightness(1);
          }
          45% {
            transform: perspective(2200px) rotateY(-36deg) scale(0.98);
            filter: brightness(0.91);
            box-shadow: -22px 12px 35px rgba(0,0,0,0.38);
          }
          100% {
            transform: perspective(2200px) rotateY(0deg) scale(1);
            filter: brightness(1);
          }
        }

        @keyframes pageTurnNextLeft {
          0% { filter: brightness(0.95); }
          45% { filter: brightness(0.88); }
          100% { filter: brightness(1); }
        }

        /* 3D Flip Prev Animation */
        @keyframes pageTurnPrevLeft {
          0% {
            transform: perspective(2200px) rotateY(0deg);
            filter: brightness(1);
          }
          45% {
            transform: perspective(2200px) rotateY(36deg) scale(0.98);
            filter: brightness(0.91);
            box-shadow: 22px 12px 35px rgba(0,0,0,0.38);
          }
          100% {
            transform: perspective(2200px) rotateY(0deg) scale(1);
            filter: brightness(1);
          }
        }

        .anim-flip-next-right {
          transform-origin: left center !important;
          animation: pageTurnNextRight 0.48s cubic-bezier(0.25, 1, 0.35, 1) forwards !important;
        }

        .anim-flip-next-left {
          animation: pageTurnNextLeft 0.48s ease forwards !important;
        }

        .anim-flip-prev-left {
          transform-origin: right center !important;
          animation: pageTurnPrevLeft 0.48s cubic-bezier(0.25, 1, 0.35, 1) forwards !important;
        }

        /* Slide Animation for Single Page */
        @keyframes slideInNext {
          0% { opacity: 0.35; transform: translateX(18px); }
          100% { opacity: 1; transform: translateX(0); }
        }
        @keyframes slideInPrev {
          0% { opacity: 0.35; transform: translateX(-18px); }
          100% { opacity: 1; transform: translateX(0); }
        }
        .anim-slide-next { animation: slideInNext 0.22s cubic-bezier(0.2, 0.8, 0.25, 1) forwards; }
        .anim-slide-prev { animation: slideInPrev 0.22s cubic-bezier(0.2, 0.8, 0.25, 1) forwards; }

        /* Typography & Physical Book Print (Crisp, High Contrast, Natural Legibility, Zero Artificial Shadow) */
        .book-scene-html,
        .book-scene-html p,
        .book-scene-html span,
        .book-scene-html em,
        .book-scene-html strong,
        .book-scene-html li {
          color: ${activeTextColor} !important;
          font-weight: 550;
          text-shadow: none !important;
        }

        .book-scene-html p {
          margin-top: 0;
          margin-bottom: 0.76em;
          text-align: left;
          line-height: inherit;
          text-wrap: pretty;
        }

        .book-scene-html p:last-child {
          margin-bottom: 0;
        }

        /* Royal First-Letter Drop-Cap */
        .book-dropcap p:first-of-type::first-letter {
          font-size: 3.1em;
          line-height: 0.82;
          float: left;
          margin-right: 12px;
          margin-top: 6px;
          font-weight: 700;
          color: var(--g-accent, #ea580c) !important;
          font-family: ${fontFamilyStyle};
          text-shadow: none !important;
        }

        .book-scene-html h1,
        .book-scene-html h2,
        .book-scene-html h3 {
          margin-top: 0.8em;
          margin-bottom: 0.4em;
          font-weight: 700;
          line-height: 1.25;
          color: ${activeTextColor} !important;
          text-shadow: none !important;
        }

        .book-scene-html blockquote {
          margin: 14px 0;
          padding: 8px 16px;
          border-left: 3px solid var(--g-accent, #ea580c);
          font-style: italic;
          opacity: 0.95;
          color: ${activeTextColor} !important;
        }

        .book-scene-html em {
          font-style: italic;
          opacity: 0.98;
        }

        @media (max-width: 960px) {
          .book-open-spread {
            grid-template-columns: 1fr !important;
          }
          .book-cover-3d {
            width: 310px !important;
            height: 460px !important;
          }
        }
      `}</style>
    </div>
  );
}

import React from "react";
import { Link } from "react-router-dom";
import {
  Search,
  FolderTree,
  Images,
  TrendingUp,
  Sparkles,
  Palette,
  Calendar,
  Eye,
  ChevronRight
} from "lucide-react";
import { useGalleryTheme } from "../../context/GalleryThemeContext";

const GallerySidebar = ({
  categories = [],
  latestAlbums = [],
  mostViewedAlbums = [],
  searchQuery = "",
  onSearchChange,
  activeCategorySlug = null,
}) => {
  const { setPaletteOpen, paletteOpen } = useGalleryTheme();

  return (
    <aside
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "28px",
        position: "sticky",
        top: "calc(var(--wp-admin-bar-height, 0px) + 88px)",
        alignSelf: "flex-start",
        zIndex: 10,
      }}
    >
      {/* 1. Live Instant Gallery Search Widget */}
      {onSearchChange && (
        <div
          style={{
            background: "var(--g-surface, var(--bg-card, #151f33))",
            border: "1px solid var(--g-border, var(--border-color, #22324f))",
            borderRadius: "18px",
            padding: "20px",
            boxShadow: "var(--g-shadow, 0 8px 24px rgba(0,0,0,0.3))",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "7px",
              fontSize: "0.8rem",
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              color: "var(--g-accent, #3b82f6)",
              marginBottom: "12px",
            }}
          >
            <Search size={14} /> Search Galleries
          </div>
          <div style={{ position: "relative" }}>
            <Search
              size={16}
              style={{
                position: "absolute",
                left: "14px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--g-text-muted, var(--text-secondary, #94a3b8))",
              }}
            />
            <input
              type="text"
              placeholder="Search albums, themes..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              style={{
                width: "100%",
                background: "rgba(0, 0, 0, 0.25)",
                border: "1px solid var(--g-border, rgba(255, 255, 255, 0.12))",
                borderRadius: "12px",
                padding: "10px 14px 10px 38px",
                color: "var(--g-text, var(--text-primary, #ffffff))",
                fontSize: "0.88rem",
                outline: "none",
                boxSizing: "border-box",
                transition: "border-color 0.2s ease",
              }}
              onFocus={(e) => (e.target.style.borderColor = "var(--g-accent, #3b82f6)")}
              onBlur={(e) => (e.target.style.borderColor = "var(--g-border, rgba(255, 255, 255, 0.12))")}
            />
          </div>
        </div>
      )}

      {/* 2. Photo Categories Widget */}
      {categories.length > 0 && (
        <div
          style={{
            background: "var(--g-surface, var(--bg-card, #151f33))",
            border: "1px solid var(--g-border, var(--border-color, #22324f))",
            borderRadius: "18px",
            padding: "20px",
            boxShadow: "var(--g-shadow, 0 8px 24px rgba(0,0,0,0.3))",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "7px",
              fontSize: "0.8rem",
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              color: "var(--g-accent, #3b82f6)",
              marginBottom: "14px",
            }}
          >
            <FolderTree size={14} /> Photo Categories
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {categories.map((cat) => {
              const isActive = activeCategorySlug === cat.slug;
              return (
                <Link
                  key={cat._id || cat.slug}
                  to={`/galleries/${cat.slug}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "9px 12px",
                    borderRadius: "10px",
                    textDecoration: "none",
                    fontSize: "0.88rem",
                    fontWeight: isActive ? 800 : 500,
                    background: isActive ? "var(--primary-subtle, rgba(16, 185, 129, 0.15))" : "transparent",
                    border: isActive ? "1px solid var(--g-accent, rgba(16, 185, 129, 0.3))" : "1px solid transparent",
                    color: isActive ? "var(--g-accent, #3b82f6)" : "var(--g-text, var(--text-primary, #ffffff))",
                    border: isActive ? "1px solid var(--g-accent, #3b82f6)" : "1px solid transparent",
                    transition: "all 0.15s ease",
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
                      e.currentTarget.style.color = "var(--g-accent, #3b82f6)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = "transparent";
                      e.currentTarget.style.color = "var(--g-text, var(--text-primary, #ffffff))";
                    }
                  }}
                >
                  <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <FolderTree size={14} style={{ opacity: 0.7 }} />
                    {cat.name}
                  </span>
                  {cat.subCategories && cat.subCategories.length > 0 && (
                    <span
                      style={{
                        fontSize: "0.72rem",
                        padding: "2px 7px",
                        borderRadius: "999px",
                        background: "rgba(0, 0, 0, 0.25)",
                        color: "var(--g-text-muted, var(--text-secondary, #94a3b8))",
                      }}
                    >
                      {cat.subCategories.length}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. Latest Published Photo Albums */}
      {latestAlbums.length > 0 && (
        <div
          style={{
            background: "var(--g-surface, var(--bg-card, #151f33))",
            border: "1px solid var(--g-border, var(--border-color, #22324f))",
            borderRadius: "18px",
            padding: "20px",
            boxShadow: "var(--g-shadow, 0 8px 24px rgba(0,0,0,0.3))",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "7px",
              fontSize: "0.8rem",
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              color: "var(--g-accent, #3b82f6)",
              marginBottom: "14px",
            }}
          >
            <Images size={14} /> Newest Photo Albums
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {latestAlbums.slice(0, 4).map((alb) => {
              const cover = alb.coverImage || alb.banner || (alb.images && alb.images[0]?.url) || "";
              const fullCover = cover.startsWith("http") ? cover : `http://localhost:5001${cover}`;
              const count = alb.images ? alb.images.length : 0;

              return (
                <Link
                  key={alb._id || alb.slug}
                  to={`/gallery/${alb.slug || alb._id}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    textDecoration: "none",
                    color: "inherit",
                    padding: "6px",
                    borderRadius: "10px",
                    transition: "background 0.15s ease",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <div
                    style={{
                      width: "60px",
                      height: "46px",
                      borderRadius: "8px",
                      overflow: "hidden",
                      background: "#030712",
                      flexShrink: 0,
                    }}
                  >
                    <img
                      src={fullCover}
                      alt={alb.title}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: "0.85rem",
                        fontWeight: 700,
                        color: "var(--g-text, var(--text-primary, #ffffff))",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {alb.title}
                    </div>
                    <div style={{ fontSize: "0.72rem", color: "var(--g-accent, #3b82f6)", marginTop: "2px", display: "flex", alignItems: "center", gap: "4px" }}>
                      <Images size={11} /> {count} Photos
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. Color Theme Quick Widget */}
      <div
        style={{
          background: "var(--primary-subtle, rgba(16, 185, 129, 0.15))",
          border: "1px dashed var(--g-accent, #3b82f6)",
          borderRadius: "18px",
          padding: "18px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          color: "var(--g-text, var(--text-primary, #ffffff))",
        }}
      >
        <div>
          <div style={{ fontWeight: 800, fontSize: "0.88rem" }}>Change Gallery Look</div>
          <div style={{ fontSize: "0.74rem", color: "var(--g-text-muted, var(--text-secondary, #94a3b8))" }}>Customize background & accents</div>
        </div>
        <button
          type="button"
          onClick={() => setPaletteOpen(!paletteOpen)}
          style={{
            padding: "8px 14px",
            borderRadius: "999px",
            background: "var(--primary-subtle, rgba(59, 130, 246, 0.15))",
            color: "var(--g-accent, #ffffff)",
            border: "1px solid var(--g-accent, #3b82f6)",
            fontSize: "0.78rem",
            fontWeight: 800,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "5px",
            boxShadow: "0 4px 14px var(--g-accent-glow, var(--primary-glow, rgba(59, 130, 246, 0.35)))",
          }}
        >
          <Palette size={13} /> Palette
        </button>
      </div>
    </aside>
  );
};

export default GallerySidebar;

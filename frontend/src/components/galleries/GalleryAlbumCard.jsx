import React from "react";
import { Link } from "react-router-dom";
import { Images, Calendar, Eye, FolderTree, ArrowRight } from "lucide-react";
import SmartImage from "../common/SmartImage";
import { stripHtml } from "../../utils/textHelper";

import { getItemPermalink } from "../../utils/permalinkHelper";

const formatDate = (dateStr) => {
  if (!dateStr) return "";
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "";
  }
};

const GalleryAlbumCard = ({ gallery, parentSlug, subcategorySlug }) => {
  if (!gallery) return null;

  // Use actual gallery item's slug (or ID fallback)
  const actualSlug = gallery.slug || (typeof gallery === "object" ? gallery._id : String(gallery));

  // Determine target link URL using WordPress-style permalink helper
  let targetUrl = getItemPermalink(gallery, 'gallery');
  if (targetUrl.startsWith('/gallery/') && parentSlug && subcategorySlug) {
    targetUrl = `/galleries/${parentSlug}/${subcategorySlug}/${actualSlug}`;
  }

  const coverPhoto =
    gallery.coverImage ||
    gallery.banner ||
    (gallery.images && gallery.images[0]?.url) ||
    "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80";

  const fullCoverUrl = coverPhoto.startsWith("http") ? coverPhoto : `http://localhost:5001${coverPhoto}`;
  const photoCount = gallery.images ? gallery.images.length : 0;

  return (
    <Link
      to={targetUrl}
      style={{
        display: "flex",
        flexDirection: "column",
        background: "var(--g-surface, var(--bg-card, #151f33))",
        border: "1px solid var(--g-border, var(--border-color, #22324f))",
        borderRadius: "18px",
        overflow: "hidden",
        textDecoration: "none",
        color: "var(--g-text, var(--text-primary, #ffffff))",
        boxShadow: "var(--g-shadow, 0 8px 24px rgba(0,0,0,0.3))",
        transition: "transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease",
      }}
      className="gallery-album-card"
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-5px)";
        e.currentTarget.style.borderColor = "var(--g-accent, #3b82f6)";
        e.currentTarget.style.boxShadow =
          "0 18px 40px var(--g-accent-glow, var(--primary-glow, rgba(59, 130, 246, 0.35)))";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.borderColor = "var(--g-border, var(--border-color, #22324f))";
        e.currentTarget.style.boxShadow = "var(--g-shadow, 0 8px 24px rgba(0,0,0,0.3))";
      }}
    >
      {/* Cover Image */}
      <div
        style={{
          position: "relative",
          width: "100%",
          paddingTop: "62%",
          background: "#030712",
          overflow: "hidden",
        }}
      >
        <SmartImage
          src={fullCoverUrl}
          alt={gallery.title}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
          }}
          className="hover-zoom"
        />
        {/* Contrast Gradient Overlay (Top vignette for pill legibility + bottom fade) */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(180deg, rgba(0, 0, 0, 0.75) 0%, rgba(0, 0, 0, 0.22) 36%, transparent 60%), linear-gradient(0deg, var(--g-surface, var(--bg-card, #151f33)) 0%, transparent 60%)",
            pointerEvents: "none",
          }}
        />

        {/* Photo Count Pill */}
        <div
          style={{
            position: "absolute",
            bottom: "12px",
            right: "12px",
            background: "rgba(0, 0, 0, 0.8)",
            backdropFilter: "blur(6px)",
            color: "#ffffff",
            fontSize: "0.75rem",
            fontWeight: 700,
            padding: "4px 10px",
            borderRadius: "6px",
            display: "flex",
            alignItems: "center",
            gap: "5px",
            border: "1px solid rgba(255, 255, 255, 0.15)",
            zIndex: 2,
          }}
        >
          <Images size={13} color="var(--g-accent, #3b82f6)" />
          <span>{photoCount} Photos</span>
        </div>

        {/* Category Pill on Top Left with rich green glassmorphism */}
        {(gallery.category?.name || gallery.subCategory?.name) && (
          <div
            title={gallery.category && gallery.subCategory ? `${gallery.category.name} • ${gallery.subCategory.name}` : gallery.subCategory?.name || gallery.category?.name}
            style={{
              position: "absolute",
              top: "12px",
              left: "12px",
              maxWidth: "calc(100% - 24px)",
              background: "rgba(6, 44, 30, 0.82)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              border: "1px solid rgba(52, 211, 153, 0.65)",
              boxShadow: "0 4px 14px rgba(0, 0, 0, 0.45), inset 0 1px 1px rgba(255, 255, 255, 0.2)",
              color: "#a7f3d0",
              fontSize: "0.70rem",
              fontWeight: 800,
              padding: "4px 10px",
              borderRadius: "6px",
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              textShadow: "0 1px 2px rgba(0, 0, 0, 0.85)",
              zIndex: 2,
            }}
          >
            {gallery.category && gallery.subCategory
              ? `${gallery.category.name} • ${gallery.subCategory.name}`
              : gallery.subCategory?.name || gallery.category?.name}
          </div>
        )}
      </div>

      {/* Content */}
      <div style={{ padding: "20px", display: "flex", flexDirection: "column", flex: 1 }}>
        {/* Date and Views */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "14px",
            fontSize: "0.78rem",
            color: "var(--g-text-muted, var(--text-secondary, #94a3b8))",
            marginBottom: "10px",
          }}
        >
          {gallery.createdAt && (
            <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <Calendar size={13} /> {formatDate(gallery.createdAt)}
            </span>
          )}
          {gallery.views !== undefined && (
            <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <Eye size={13} /> {gallery.views} views
            </span>
          )}
        </div>

        {/* Title */}
        <h3
          style={{
            fontSize: "1.15rem",
            fontWeight: 800,
            color: "var(--g-text, var(--text-primary, #ffffff))",
            margin: "0 0 8px",
            lineHeight: 1.4,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {gallery.title}
        </h3>

        {/* Description */}
        {gallery.description && (
          <p
            style={{
              fontSize: "0.86rem",
              color: "var(--g-text-muted, var(--text-secondary, #94a3b8))",
              lineHeight: 1.5,
              margin: "0 0 16px",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {stripHtml(gallery.description)}
          </p>
        )}

        {/* Footer CTA */}
        <div
          style={{
            marginTop: "auto",
            paddingTop: "12px",
            borderTop: "1px solid var(--g-border, var(--border-color, rgba(255, 255, 255, 0.08)))",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: "0.85rem",
            fontWeight: 700,
            color: "var(--g-accent, #3b82f6)",
          }}
        >
          <span>View Photo Album</span>
          <ArrowRight size={15} />
        </div>
      </div>
    </Link>
  );
};

export default GalleryAlbumCard;

import React from "react";
import { Link } from "react-router-dom";
import { FolderTree, Images, ArrowRight } from "lucide-react";
import SmartImage from "../common/SmartImage";
import { stripHtml } from "../../utils/textHelper";

const GalleryCategoryCard = ({ category }) => {
  if (!category) return null;

  const coverImage =
    category.thumbnail ||
    category.banner ||
    "https://images.unsplash.com/photo-1518173946687-a4c8a383392e?auto=format&fit=crop&w=800&q=80";

  const subCategories = category.subCategories || [];

  return (
    <Link
      to={`/galleries/${category.slug}`}
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
      className="gallery-cat-card"
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
      {/* Cover Image Container */}
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
          src={coverImage}
          alt={category.name}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
          }}
          className="hover-zoom"
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(0deg, var(--g-surface, var(--bg-card, #151f33)) 0%, transparent 60%)",
          }}
        />

        {/* Subcategory Count Badge */}
        <div
          style={{
            position: "absolute",
            top: "12px",
            right: "12px",
            background: "rgba(0, 0, 0, 0.75)",
            backdropFilter: "blur(6px)",
            color: "var(--g-accent, #3b82f6)",
            fontSize: "0.75rem",
            fontWeight: 800,
            padding: "4px 10px",
            borderRadius: "999px",
            border: "1px solid var(--g-border, var(--border-color, rgba(255, 255, 255, 0.15)))",
            display: "flex",
            alignItems: "center",
            gap: "5px",
          }}
        >
          <Images size={12} />
          <span>{subCategories.length > 0 ? `${subCategories.length} Parts` : "Albums"}</span>
        </div>
      </div>

      {/* Body Content */}
      <div style={{ padding: "20px", display: "flex", flexDirection: "column", flex: 1 }}>
        <h3
          style={{
            fontSize: "1.25rem",
            fontWeight: 800,
            color: "var(--g-text, var(--text-primary, #ffffff))",
            margin: "0 0 8px",
            lineHeight: 1.3,
          }}
        >
          {category.name}
        </h3>

        {category.description && (
          <p
            style={{
              fontSize: "0.88rem",
              color: "var(--g-text-muted, var(--text-secondary, #94a3b8))",
              lineHeight: 1.5,
              margin: "0 0 16px",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {stripHtml(category.description)}
          </p>
        )}

        {/* Subcategories preview tags (max 2) */}
        {subCategories.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "16px" }}>
            {subCategories.slice(0, 2).map((sub) => (
              <span
                key={sub._id || sub.slug}
                style={{
                  fontSize: "0.72rem",
                  padding: "2px 8px",
                  borderRadius: "6px",
                  background: "rgba(255, 255, 255, 0.06)",
                  color: "var(--g-text-muted, var(--text-secondary, #94a3b8))",
                  border: "1px solid var(--g-border, var(--border-color, rgba(255, 255, 255, 0.08)))",
                }}
              >
                {sub.name}
              </span>
            ))}
            {subCategories.length > 2 && (
              <span style={{ fontSize: "0.72rem", color: "var(--g-accent, #3b82f6)", alignSelf: "center" }}>
                +{subCategories.length - 2} more
              </span>
            )}
          </div>
        )}

        {/* Bottom CTA */}
        <div
          style={{
            marginTop: "auto",
            paddingTop: "12px",
            borderTop: "1px solid var(--g-border, var(--border-color, rgba(255, 255, 255, 0.06)))",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: "0.85rem",
            fontWeight: 700,
            color: "var(--g-accent, #3b82f6)",
          }}
        >
          <span>Explore Collection</span>
          <ArrowRight size={15} />
        </div>
      </div>
    </Link>
  );
};

export default GalleryCategoryCard;

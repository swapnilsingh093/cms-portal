import React from "react";
import StoryCategoryCard from "./StoryCategoryCard";
import { BookOpen, ChevronLeft, ChevronRight } from "lucide-react";

const StoriesCategorySection = ({
  categories = [],
  heading = "Editorial Columns & Categories",
  subtitle = "Browse parent story categories to explore in-depth topics",
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  loading = false
}) => {
  return (
    <section id="categories" className="stories-category-section" style={{ width: "100%" }}>
      {/* Section Header */}
      <div
        style={{
          borderBottom: "2px solid var(--border-color, rgba(255, 255, 255, 0.08))",
          paddingBottom: "16px",
          marginBottom: "32px",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "flex-end",
          justifyContent: "space-between",
          gap: "12px"
        }}
      >
        <div>
          <div
            style={{
              fontSize: "0.75rem",
              fontWeight: 700,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "var(--g-accent, #ea580c)",
              marginBottom: "4px"
            }}
          >
            Curated Channels
          </div>
          <h2
            style={{
              fontSize: "clamp(1.5rem, 2.8vw, 2rem)",
              fontWeight: 700,
              color: "var(--text-primary, #f1f5f9)",
              margin: 0,
              fontFamily: "'Playfair Display', Georgia, serif, sans-serif",
              letterSpacing: "-0.01em"
            }}
          >
            {heading}
          </h2>
          {subtitle && (
            <p
              style={{
                fontSize: "0.95rem",
                color: "var(--text-muted, #94a3b8)",
                margin: "6px 0 0 0"
              }}
            >
              {subtitle}
            </p>
          )}
        </div>

        {totalPages > 1 && (
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "0.85rem", color: "var(--text-muted, #94a3b8)" }}>
              Page {currentPage} of {totalPages}
            </span>
            <div style={{ display: "flex", gap: "4px" }}>
              <button
                type="button"
                onClick={() => onPageChange && onPageChange(currentPage - 1)}
                disabled={currentPage <= 1 || loading}
                aria-label="Previous Page"
                style={{
                  padding: "6px 10px",
                  borderRadius: "6px",
                  background: "var(--bg-secondary, rgba(255,255,255,0.05))",
                  border: "1px solid var(--border-color, rgba(255,255,255,0.1))",
                  color: currentPage <= 1 ? "var(--text-dim, #64748b)" : "var(--text-primary, #f1f5f9)",
                  cursor: currentPage <= 1 ? "not-allowed" : "pointer"
                }}
              >
                <ChevronLeft size={16} />
              </button>
              <button
                type="button"
                onClick={() => onPageChange && onPageChange(currentPage + 1)}
                disabled={currentPage >= totalPages || loading}
                aria-label="Next Page"
                style={{
                  padding: "6px 10px",
                  borderRadius: "6px",
                  background: "var(--bg-secondary, rgba(255,255,255,0.05))",
                  border: "1px solid var(--border-color, rgba(255,255,255,0.1))",
                  color: currentPage >= totalPages ? "var(--text-dim, #64748b)" : "var(--text-primary, #f1f5f9)",
                  cursor: currentPage >= totalPages ? "not-allowed" : "pointer"
                }}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Category Grid or Empty */}
      {categories.length === 0 ? (
        <div
          style={{
            padding: "60px 24px",
            textAlign: "center",
            background: "var(--bg-card, rgba(255,255,255,0.02))",
            borderRadius: "12px",
            border: "1px dashed var(--border-color, rgba(255,255,255,0.1))"
          }}
        >
          <BookOpen size={40} color="var(--g-accent, #ea580c)" style={{ margin: "0 auto 12px", opacity: 0.8 }} />
          <h3 style={{ fontSize: "1.15rem", fontWeight: 600, color: "var(--text-primary, #f1f5f9)", marginBottom: "6px" }}>
            No Story Categories Found
          </h3>
          <p style={{ color: "var(--text-muted, #94a3b8)", fontSize: "0.9rem", margin: 0 }}>
            Parent story categories created in the CMS will appear here.
          </p>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: "24px"
          }}
        >
          {categories.map((cat, idx) => (
            <StoryCategoryCard key={cat._id || cat.id || idx} category={cat} index={idx} />
          ))}
        </div>
      )}

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: "6px",
            marginTop: "40px"
          }}
        >
          <button
            type="button"
            onClick={() => onPageChange && onPageChange(currentPage - 1)}
            disabled={currentPage <= 1 || loading}
            style={{
              padding: "8px 14px",
              borderRadius: "6px",
              background: "var(--bg-secondary, rgba(255,255,255,0.05))",
              border: "1px solid var(--border-color, rgba(255,255,255,0.1))",
              color: currentPage <= 1 ? "var(--text-dim, #64748b)" : "var(--text-primary, #f1f5f9)",
              cursor: currentPage <= 1 ? "not-allowed" : "pointer",
              fontSize: "0.85rem",
              fontWeight: 500,
              display: "flex",
              alignItems: "center",
              gap: "4px"
            }}
          >
            <ChevronLeft size={16} /> Previous
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => onPageChange && onPageChange(p)}
              disabled={loading}
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "6px",
                background: p === currentPage ? "var(--g-accent, #ea580c)" : "var(--bg-secondary, rgba(255,255,255,0.05))",
                border: p === currentPage ? "1px solid #ea580c" : "1px solid var(--border-color, rgba(255,255,255,0.1))",
                color: p === currentPage ? "#ffffff" : "var(--text-primary, #f1f5f9)",
                cursor: "pointer",
                fontSize: "0.85rem",
                fontWeight: p === currentPage ? 700 : 500
              }}
            >
              {p}
            </button>
          ))}

          <button
            type="button"
            onClick={() => onPageChange && onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages || loading}
            style={{
              padding: "8px 14px",
              borderRadius: "6px",
              background: "var(--bg-secondary, rgba(255,255,255,0.05))",
              border: "1px solid var(--border-color, rgba(255,255,255,0.1))",
              color: currentPage >= totalPages ? "var(--text-dim, #64748b)" : "var(--text-primary, #f1f5f9)",
              cursor: currentPage >= totalPages ? "not-allowed" : "pointer",
              fontSize: "0.85rem",
              fontWeight: 500,
              display: "flex",
              alignItems: "center",
              gap: "4px"
            }}
          >
            Next <ChevronRight size={16} />
          </button>
        </div>
      )}
    </section>
  );
};

export default StoriesCategorySection;

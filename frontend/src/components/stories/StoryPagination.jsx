import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const StoryPagination = ({
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  loading = false
}) => {
  if (totalPages <= 1) return null;

  return (
    <nav
      aria-label="Story Pagination"
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        gap: "6px",
        marginTop: "48px",
        paddingTop: "24px",
        borderTop: "1px solid var(--border-color, rgba(255, 255, 255, 0.08))"
      }}
    >
      <button
        type="button"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1 || loading}
        style={{
          padding: "8px 16px",
          borderRadius: "6px",
          background: "var(--bg-secondary, rgba(255,255,255,0.04))",
          border: "1px solid var(--border-color, rgba(255,255,255,0.1))",
          color: currentPage <= 1 ? "var(--text-dim, #64748b)" : "var(--text-primary, #f1f5f9)",
          cursor: currentPage <= 1 ? "not-allowed" : "pointer",
          fontSize: "0.85rem",
          fontWeight: 500,
          display: "flex",
          alignItems: "center",
          gap: "6px",
          transition: "all 0.2s ease"
        }}
      >
        <ChevronLeft size={16} /> Previous
      </button>

      {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
        // Show first, last, current, and neighbours
        if (
          p === 1 ||
          p === totalPages ||
          (p >= currentPage - 2 && p <= currentPage + 2)
        ) {
          const isActive = p === currentPage;
          return (
            <button
              key={p}
              type="button"
              onClick={() => onPageChange(p)}
              disabled={loading}
              style={{
                minWidth: "38px",
                height: "38px",
                padding: "0 8px",
                borderRadius: "6px",
                background: isActive ? "var(--g-accent, #ea580c)" : "var(--bg-secondary, rgba(255,255,255,0.04))",
                border: isActive ? "1px solid #ea580c" : "1px solid var(--border-color, rgba(255,255,255,0.1))",
                color: isActive ? "#ffffff" : "var(--text-primary, #f1f5f9)",
                cursor: "pointer",
                fontSize: "0.88rem",
                fontWeight: isActive ? 700 : 500,
                transition: "all 0.2s ease"
              }}
            >
              {p}
            </button>
          );
        } else if (p === currentPage - 3 || p === currentPage + 3) {
          return (
            <span
              key={p}
              style={{
                color: "var(--text-muted, #94a3b8)",
                padding: "0 4px",
                fontSize: "0.9rem"
              }}
            >
              ...
            </span>
          );
        }
        return null;
      })}

      <button
        type="button"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages || loading}
        style={{
          padding: "8px 16px",
          borderRadius: "6px",
          background: "var(--bg-secondary, rgba(255,255,255,0.04))",
          border: "1px solid var(--border-color, rgba(255,255,255,0.1))",
          color: currentPage >= totalPages ? "var(--text-dim, #64748b)" : "var(--text-primary, #f1f5f9)",
          cursor: currentPage >= totalPages ? "not-allowed" : "pointer",
          fontSize: "0.85rem",
          fontWeight: 500,
          display: "flex",
          alignItems: "center",
          gap: "6px",
          transition: "all 0.2s ease"
        }}
      >
        Next <ChevronRight size={16} />
      </button>
    </nav>
  );
};

export default StoryPagination;

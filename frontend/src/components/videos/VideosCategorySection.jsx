import React from 'react';
import { Grid, ChevronLeft, ChevronRight } from 'lucide-react';
import VideoCategoryCard from './VideoCategoryCard';

const VideosCategorySection = ({
  categories = [],
  config = {},
  currentPage = 1,
  totalPages = 1,
  onPageChange = () => {},
}) => {
  const {
    heading = 'Browse Video Categories',
    subtitle = 'Explore parent categories and discover subtopics',
  } = config;

  if (categories.length === 0) {
    return (
      <div
        id="categories"
        style={{
          textAlign: 'center',
          padding: '60px 20px',
          color: 'var(--text-muted, #64748b)',
        }}
      >
        <Grid size={40} style={{ opacity: 0.3, marginBottom: '12px' }} />
        <p style={{ margin: 0, fontSize: '1rem' }}>No video categories found.</p>
      </div>
    );
  }

  return (
    <section id="categories" style={{ padding: '60px 0 40px' }}>
      {/* Section Header */}
      <div style={{ marginBottom: '36px' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'var(--primary-subtle, rgba(99,102,241,0.12))',
            border: '1px solid var(--g-accent, #6366f1)',
            borderRadius: '999px',
            padding: '5px 16px',
            fontSize: '12px',
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--g-accent, #a5b4fc)',
            marginBottom: '14px',
          }}
        >
          <Grid size={13} />
          Categories
        </div>

        <h2
          style={{
            fontSize: 'clamp(1.6rem, 3vw, 2.2rem)',
            fontWeight: 800,
            color: 'var(--text-primary, #f1f5f9)',
            margin: '0 0 10px',
            letterSpacing: '-0.02em',
          }}
        >
          {heading}
        </h2>

        {subtitle && (
          <p
            style={{
              fontSize: '1rem',
              color: 'var(--text-muted, #94a3b8)',
              margin: 0,
              maxWidth: '560px',
            }}
          >
            {subtitle}
          </p>
        )}
      </div>

      {/* Category Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
          gap: '20px',
          marginBottom: '40px',
        }}
      >
        {categories.map((cat, idx) => (
          <VideoCategoryCard key={cat._id || idx} category={cat} index={idx} />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            marginTop: '16px',
          }}
        >
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage <= 1}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '8px 16px',
              borderRadius: '8px',
              border: '1px solid var(--border-color, rgba(255,255,255,0.1))',
              background: 'var(--bg-card, rgba(255,255,255,0.05))',
              color: currentPage <= 1 ? 'var(--text-muted, #64748b)' : 'var(--text-primary, #f1f5f9)',
              cursor: currentPage <= 1 ? 'not-allowed' : 'pointer',
              fontSize: '13px',
              fontWeight: 600,
              transition: 'all 0.2s',
              opacity: currentPage <= 1 ? 0.5 : 1,
            }}
          >
            <ChevronLeft size={15} />
            Previous
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                border: '1px solid',
                borderColor: currentPage === page ? 'var(--g-accent, #6366f1)' : 'var(--border-color, rgba(255,255,255,0.1))',
                background: currentPage === page
                  ? 'var(--accent-gradient, linear-gradient(135deg, #6366f1, #8b5cf6))'
                  : 'var(--bg-card, rgba(255,255,255,0.05))',
                color: currentPage === page ? '#fff' : 'var(--text-secondary, #94a3b8)',
                cursor: 'pointer',
                fontWeight: currentPage === page ? 700 : 400,
                fontSize: '13px',
                transition: 'all 0.2s',
              }}
            >
              {page}
            </button>
          ))}

          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '8px 16px',
              borderRadius: '8px',
              border: '1px solid var(--border-color, rgba(255,255,255,0.1))',
              background: 'var(--bg-card, rgba(255,255,255,0.05))',
              color: currentPage >= totalPages ? 'var(--text-muted, #64748b)' : 'var(--text-primary, #f1f5f9)',
              cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer',
              fontSize: '13px',
              fontWeight: 600,
              transition: 'all 0.2s',
              opacity: currentPage >= totalPages ? 0.5 : 1,
            }}
          >
            Next
            <ChevronRight size={15} />
          </button>
        </div>
      )}
    </section>
  );
};

export default VideosCategorySection;

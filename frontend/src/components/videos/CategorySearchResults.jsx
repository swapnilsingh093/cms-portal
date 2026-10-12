import React, { useState } from 'react';
import VideoCategoryCard from './VideoCategoryCard';
import SmartImage from '../common/SmartImage';
import { useNavigate } from 'react-router-dom';
import { Search, X, FolderTree, Film, ChevronRight, Layers, Loader2 } from 'lucide-react';

const GRADIENTS = [
  'var(--accent-gradient, linear-gradient(135deg, #6366f1, #8b5cf6))',
  'linear-gradient(135deg, #ec4899, #8b5cf6)',
  'var(--accent-gradient, linear-gradient(135deg, #06b6d4, #6366f1))',
  'linear-gradient(135deg, #10b981, #06b6d4)',
  'linear-gradient(135deg, #f59e0b, #ec4899)',
  'linear-gradient(135deg, #ef4444, #f59e0b)',
];

const CategoryResultCard = ({ category, index = 0 }) => {
  const navigate = useNavigate();
  const [hovered, setHovered] = useState(false);

  const isParent = !category.parentCategory;
  const parentName = category.parentCategory?.name;
  const parentSlug = category.parentCategory?.slug;

  const targetUrl = isParent
    ? `/videos/${category.slug}`
    : `/videos/${parentSlug || 'all'}/${category.slug}`;

  const thumbnail = category.thumbnail || category.image || category.coverImage;
  const count = category.videoCount ?? category.count ?? 0;
  const subCats = category.subCategories || [];

  return (
    <div
      onClick={() => navigate(targetUrl)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        borderRadius: '16px',
        overflow: 'hidden',
        cursor: 'pointer',
        height: '220px',
        position: 'relative',
        background: GRADIENTS[index % GRADIENTS.length],
        transform: hovered ? 'translateY(-4px) scale(1.01)' : 'translateY(0) scale(1)',
        boxShadow: hovered
          ? '0 20px 50px rgba(0,0,0,0.5)'
          : '0 4px 18px rgba(0,0,0,0.25)',
        transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
      }}
    >
      {/* Background Image */}
      {thumbnail && (
        <SmartImage
          src={thumbnail}
          alt={category.name}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            transform: hovered ? 'scale(1.08)' : 'scale(1)',
          }}
        />
      )}

      {/* Dark overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: hovered
            ? 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.45) 60%, rgba(0,0,0,0.1) 100%)'
            : 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.3) 70%, transparent 100%)',
          transition: 'background 0.3s ease',
        }}
      />

      {/* Card Content */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          padding: '18px 20px',
          zIndex: 2,
        }}
      >
        {/* Badges: Parent Category vs Subcategory + Video Count */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginBottom: '8px' }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              background: isParent ? 'var(--g-accent, rgba(99, 102, 241, 0.4))' : 'rgba(236, 72, 153, 0.4)',
              border: `1px solid ${isParent ? 'var(--g-accent, rgba(99, 102, 241, 0.6))' : 'rgba(236, 72, 153, 0.6)'}`,
              borderRadius: '999px',
              padding: '2px 9px',
              fontSize: '10px',
              fontWeight: 700,
              textTransform: 'uppercase',
              color: '#fff',
            }}
          >
            {isParent ? (
              <>
                <FolderTree size={10} /> Parent Category
              </>
            ) : (
              <>
                <Layers size={10} /> Subcategory
              </>
            )}
          </span>

          {!isParent && parentName && (
            <span
              style={{
                fontSize: '10px',
                color: 'rgba(255,255,255,0.8)',
                background: 'rgba(0,0,0,0.4)',
                padding: '2px 8px',
                borderRadius: '999px',
              }}
            >
              in {parentName}
            </span>
          )}

          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              background: 'rgba(0,0,0,0.4)',
              borderRadius: '999px',
              padding: '2px 8px',
              fontSize: '10px',
              color: 'var(--g-accent, #c7d2fe)',
            }}
          >
            <Film size={10} /> {count} {count === 1 ? 'Video' : 'Videos'}
          </span>
        </div>

        {/* Title */}
        <h3
          style={{
            margin: '0 0 4px',
            fontSize: '1.1rem',
            fontWeight: 800,
            color: '#fff',
            textShadow: '0 2px 8px rgba(0,0,0,0.6)',
          }}
        >
          {category.name}
        </h3>

        {/* Description or Subcategories */}
        {category.shortDescription ? (
          <p
            style={{
              margin: '0 0 6px',
              fontSize: '11px',
              color: 'rgba(255,255,255,0.8)',
              lineHeight: 1.4,
              display: '-webkit-box',
              WebkitLineClamp: 1,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {category.shortDescription}
          </p>
        ) : null}

        {/* Subcategories list on hover (for parent category) */}
        {isParent && subCats.length > 0 && (
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '4px',
              marginTop: '4px',
              maxHeight: hovered ? '50px' : '0',
              overflow: 'hidden',
              transition: 'max-height 0.3s ease',
            }}
          >
            {subCats.slice(0, 3).map((sub) => (
              <span
                key={sub._id}
                style={{
                  fontSize: '9px',
                  background: 'rgba(255,255,255,0.15)',
                  borderRadius: '999px',
                  padding: '2px 8px',
                  color: '#fff',
                  whiteSpace: 'nowrap',
                }}
              >
                {sub.name}
              </span>
            ))}
            {subCats.length > 3 && (
              <span style={{ fontSize: '9px', color: 'var(--g-accent, #a5b4fc)', alignSelf: 'center' }}>
                +{subCats.length - 3} more
              </span>
            )}
          </div>
        )}

        {/* Action Link */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '12px',
            color: 'var(--g-accent, #a5b4fc)',
            marginTop: '6px',
            fontWeight: 600,
            opacity: hovered ? 1 : 0.7,
            transition: 'opacity 0.2s',
          }}
        >
          {isParent ? 'Explore Category' : 'View Subcategory Videos'} <ChevronRight size={13} />
        </div>
      </div>
    </div>
  );
};

const CategorySearchResults = ({ query, results = [], loading = false, onClear = () => {} }) => {
  return (
    <section style={{ padding: '60px 0 40px' }}>
      {/* Header bar */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          marginBottom: '28px',
          paddingBottom: '20px',
          borderBottom: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))',
        }}
      >
        <div>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: 'var(--g-accent, rgba(99, 102, 241, 0.15))',
              border: '1px solid var(--g-accent, rgba(99, 102, 241, 0.3))',
              borderRadius: '999px',
              padding: '4px 12px',
              fontSize: '11px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: 'var(--g-accent, #a5b4fc)',
              marginBottom: '10px',
            }}
          >
            <Search size={12} /> Category Search
          </div>

          <h2
            style={{
              fontSize: 'clamp(1.5rem, 2.5vw, 2rem)',
              fontWeight: 800,
              color: 'var(--text-primary, #f1f5f9)',
              margin: '0 0 6px',
            }}
          >
            Category Results for &ldquo;{query}&rdquo;
          </h2>

          <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted, #94a3b8)' }}>
            {loading
              ? 'Searching video categories and subcategories...'
              : `Found ${results.length} matching ${results.length === 1 ? 'category' : 'categories'}`}
          </p>
        </div>

        <button
          onClick={onClear}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 16px',
            borderRadius: '8px',
            border: '1px solid var(--border-color, rgba(255, 255, 255, 0.12))',
            background: 'rgba(255, 255, 255, 0.06)',
            color: 'var(--text-primary, #f1f5f9)',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)';
            e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)';
            e.currentTarget.style.color = '#f87171';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
            e.currentTarget.style.borderColor = 'var(--border-color, rgba(255, 255, 255, 0.12))';
            e.currentTarget.style.color = 'var(--text-primary, #f1f5f9)';
          }}
        >
          <X size={14} /> Clear Search
        </button>
      </div>

      {/* Loading state */}
      {loading ? (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '80px 20px',
            gap: '12px',
            color: 'var(--text-muted, #94a3b8)',
          }}
        >
          <Loader2 size={32} className="spin" color="var(--g-accent, #6366f1)" />
          <span>Searching video categories...</span>
        </div>
      ) : results.length === 0 ? (
        /* Empty State */
        <div
          style={{
            textAlign: 'center',
            padding: '80px 20px',
            background: 'var(--bg-card, rgba(255, 255, 255, 0.02))',
            borderRadius: '16px',
            border: '1px dashed var(--border-color, rgba(255, 255, 255, 0.1))',
          }}
        >
          <FolderTree size={44} style={{ opacity: 0.3, marginBottom: '14px', color: 'var(--g-accent, #6366f1)' }} />
          <h3 style={{ margin: '0 0 8px', fontSize: '1.2rem', color: 'var(--text-primary, #f1f5f9)' }}>
            No Categories Found
          </h3>
          <p
            style={{
              margin: '0 0 20px',
              fontSize: '13px',
              color: 'var(--text-muted, #94a3b8)',
              maxWidth: '420px',
              marginLeft: 'auto',
              marginRight: 'auto',
            }}
          >
            No video categories or subcategories matched &ldquo;{query}&rdquo;.
          </p>
          <button
            onClick={onClear}
            style={{
              padding: '9px 20px',
              borderRadius: '8px',
              background: 'var(--accent-gradient, linear-gradient(135deg, #6366f1, #8b5cf6))',
              color: '#fff',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '13px',
            }}
          >
            View All Categories
          </button>
        </div>
      ) : (
        /* Grid of categories */
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: '20px',
          }}
        >
          {results.map((cat, idx) => (
            <VideoCategoryCard key={cat._id || idx} category={cat} index={idx} />
          ))}
        </div>
      )}
    </section>
  );
};

export default CategorySearchResults;

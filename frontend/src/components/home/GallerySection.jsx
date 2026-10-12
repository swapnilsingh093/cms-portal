import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Image as ImageIcon, Calendar, FolderTree, ArrowRight, Images } from 'lucide-react';
import SmartImage from '../common/SmartImage';
import { stripHtml } from '../../utils/textHelper';

const GallerySection = ({
  config = {},
  latestGallery = null,
  categories = []
}) => {
  const navigate = useNavigate();
  const { isAuthenticated, openAuthModal } = useAuth();

  const handleProtectedNavigate = (targetUrl, message = "Please sign in or register to access photo galleries") => {
    if (!isAuthenticated) {
      openAuthModal("login", message, targetUrl);
      return;
    }
    navigate(targetUrl);
  };

  if (config.enabled === false) return null;

  const title = config.title || 'Featured Photo Galleries';
  const subtitle = config.subtitle || 'Explore high-resolution visual stories and curated photo albums';

  // 1. Strictly filter parent categories only (no subcategories)
  const parentCategories = categories.filter((c) => !c.parentCategory);

  // 2. Select Category 1
  const cat1 =
    (config.category1Id && parentCategories.find((c) => String(c._id) === String(config.category1Id))) ||
    parentCategories[0] ||
    null;

  // 3. Select Category 2 (MUST NOT BE EQUAL TO Category 1 - NO CLONES/DUPLICATES)
  let cat2 = null;
  if (config.category2Id && String(config.category2Id) !== String(cat1?._id)) {
    cat2 = parentCategories.find((c) => String(c._id) === String(config.category2Id)) || null;
  }
  if (!cat2) {
    cat2 = parentCategories.find((c) => String(c._id) !== String(cat1?._id)) || null;
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch (e) {
      return '';
    }
  };

  return (
    <section style={{ marginBottom: '56px' }}>
      {/* Section Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          marginBottom: '24px',
          borderBottom: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))',
          paddingBottom: '16px'
        }}
      >
        <div>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.78rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: '#6366f1',
              marginBottom: '6px'
            }}
          >
            <ImageIcon size={14} /> Visual Galleries
          </div>
          <h2
            style={{
              fontSize: 'clamp(1.5rem, 2.5vw, 1.85rem)',
              fontWeight: 800,
              letterSpacing: '-0.02em',
              margin: 0,
              color: 'var(--text-main, #f8fafc)'
            }}
          >
            {title}
          </h2>
          {subtitle && (
            <p
              style={{
                margin: '6px 0 0',
                fontSize: '0.9rem',
                color: 'var(--text-muted, #94a3b8)'
              }}
            >
              {subtitle}
            </p>
          )}
        </div>

        <button
          onClick={() => handleProtectedNavigate('/galleries', 'Sign in or register to explore our full photo collections')}
          className="btn-secondary"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.85rem',
            padding: '7px 14px',
            borderRadius: 'var(--radius-full, 9999px)',
            flexShrink: 0
          }}
        >
          View All Galleries <ArrowRight size={14} />
        </button>
      </div>

      {/* Dynamic Grid (2 or 3 cards) */}
      <div className={`home-card-grid ${!cat2 ? 'grid-2-cols' : ''}`}>
        {/* Card 1: Latest Gallery */}
        {latestGallery ? (
          <div
            onClick={() => handleProtectedNavigate(`/gallery/${latestGallery.slug}`, `Sign in or register to view gallery details`)}
            className="home-media-card"
            style={{
              background: 'var(--card-bg, #111827)',
              borderRadius: 'var(--radius-lg, 14px)',
              overflow: 'hidden',
              border: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: 'var(--shadow-sm, 0 4px 12px rgba(0,0,0,0.3))',
              cursor: 'pointer',
              transition: 'transform 0.25s, box-shadow 0.25s'
            }}
          >
            {/* Cover Image */}
            <div
              style={{
                position: 'relative',
                width: '100%',
                paddingTop: '58%',
                background: '#090d16',
                overflow: 'hidden'
              }}
            >
              <SmartImage
                src={
                  latestGallery.coverImage ||
                  latestGallery.banner ||
                  (latestGallery.images && latestGallery.images[0]?.url) ||
                  'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80'
                }
                alt={latestGallery.title}
                style={{
                  position: 'absolute',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                }}
                className="hover-zoom"
              />
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(0deg, rgba(8, 11, 20, 0.8) 0%, transparent 50%)'
                }}
              />

              {/* Latest Badge */}
              <div
                style={{
                  position: 'absolute',
                  top: '12px',
                  left: '12px',
                  background: 'rgba(16, 185, 129, 0.9)',
                  color: '#ffffff',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  padding: '3px 9px',
                  borderRadius: '6px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em'
                }}
              >
                Latest Gallery
              </div>

              {/* Photo Count Pill */}
              {latestGallery.images && latestGallery.images.length > 0 && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: '12px',
                    right: '12px',
                    background: 'rgba(0, 0, 0, 0.75)',
                    backdropFilter: 'blur(4px)',
                    color: '#ffffff',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    padding: '3px 8px',
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <Images size={12} /> {latestGallery.images.length} Photos
                </div>
              )}
            </div>

            {/* Body */}
            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', flex: 1 }}>
              {/* Category & Date */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  fontSize: '0.8rem',
                  color: 'var(--text-muted, #94a3b8)',
                  marginBottom: '10px'
                }}
              >
                {latestGallery.category?.name && (
                  <span
                    style={{
                      color: '#818cf8',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <FolderTree size={13} /> {latestGallery.category.name}
                  </span>
                )}
                {latestGallery.createdAt && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Calendar size={13} /> {formatDate(latestGallery.createdAt)}
                  </span>
                )}
              </div>

              <h3
                style={{
                  margin: '0 0 10px',
                  fontSize: '1.1rem',
                  fontWeight: 700,
                  lineHeight: 1.4,
                  color: 'var(--text-main, #f8fafc)',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden'
                }}
                className="title-hover"
              >
                {latestGallery.title}
              </h3>

              {latestGallery.description && (
                <p
                  style={{
                    margin: '0 0 16px',
                    fontSize: '0.88rem',
                    color: 'var(--text-muted, #94a3b8)',
                    lineHeight: 1.5,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}
                >
                  {stripHtml(latestGallery.description)}
                </p>
              )}

              <div
                style={{
                  marginTop: 'auto',
                  paddingTop: '12px',
                  borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  color: '#818cf8',
                  fontSize: '0.86rem',
                  fontWeight: 600
                }}
              >
                <span>View Full Album</span>
                <ArrowRight size={15} />
              </div>
            </div>
          </div>
        ) : (
          <div
            style={{
              background: 'var(--card-bg, #111827)',
              borderRadius: 'var(--radius-lg, 14px)',
              padding: '40px 20px',
              textAlign: 'center',
              border: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))',
              color: 'var(--text-muted, #94a3b8)'
            }}
          >
            <ImageIcon size={36} style={{ opacity: 0.3, marginBottom: '10px' }} />
            <p>No published galleries available yet.</p>
          </div>
        )}

        {/* Card 2: Gallery Category 1 */}
        {cat1 && renderCategoryCard(cat1, config.category1CustomImage, navigate, 'Gallery Collection', handleProtectedNavigate)}

        {/* Card 3: Gallery Category 2 (Rendered ONLY if a distinct 2nd parent category exists - NO CLONE) */}
        {cat2 && renderCategoryCard(cat2, config.category2CustomImage, navigate, 'Gallery Collection', handleProtectedNavigate)}
      </div>
    </section>
  );
};

// Reusable Category Card for Gallery
const renderCategoryCard = (category, customImage, navigate, label, onProtectedNav) => {
  if (!category) {
    return (
      <div
        style={{
          background: 'var(--card-bg, #111827)',
          borderRadius: 'var(--radius-lg, 14px)',
          padding: '40px 20px',
          textAlign: 'center',
          border: '1px dashed var(--border-color, rgba(255, 255, 255, 0.15))',
          color: 'var(--text-muted, #94a3b8)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <FolderTree size={36} style={{ opacity: 0.3, marginBottom: '10px' }} />
        <p style={{ margin: 0, fontSize: '0.9rem' }}>Configure category in Home Template</p>
      </div>
    );
  }

  const imageSrc =
    customImage ||
    category.thumbnail ||
    category.banner ||
    'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&w=800&q=80';

  return (
    <div
      onClick={() => onProtectedNav ? onProtectedNav(`/galleries/${category.slug}`, `Sign in or register to explore gallery categories`) : navigate(`/galleries/${category.slug}`)}
      className="home-media-card category-card"
      style={{
        background: 'var(--card-bg, #111827)',
        borderRadius: 'var(--radius-lg, 14px)',
        overflow: 'hidden',
        border: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: 'var(--shadow-sm, 0 4px 12px rgba(0,0,0,0.3))',
        cursor: 'pointer',
        transition: 'transform 0.25s, box-shadow 0.25s'
      }}
    >
      <div
        style={{
          position: 'relative',
          width: '100%',
          paddingTop: '58%',
          background: '#090d16',
          overflow: 'hidden'
        }}
      >
        <SmartImage
          src={imageSrc}
          alt={category.name}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
          }}
          className="hover-zoom"
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(0deg, rgba(8, 11, 20, 0.85) 0%, rgba(8, 11, 20, 0.2) 60%)'
          }}
        />

        <div
          style={{
            position: 'absolute',
            top: '12px',
            left: '12px',
            background: 'rgba(16, 185, 129, 0.9)',
            color: '#ffffff',
            fontSize: '0.72rem',
            fontWeight: 700,
            padding: '3px 9px',
            borderRadius: '6px',
            textTransform: 'uppercase',
            letterSpacing: '0.06em'
          }}
        >
          {label}
        </div>
      </div>

      <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', flex: 1 }}>
        <h3
          style={{
            margin: '0 0 8px',
            fontSize: '1.2rem',
            fontWeight: 700,
            color: 'var(--text-main, #f8fafc)',
            letterSpacing: '-0.01em'
          }}
        >
          {category.name}
        </h3>

        {category.description ? (
          <p
            style={{
              margin: '0 0 16px',
              fontSize: '0.88rem',
              color: 'var(--text-muted, #94a3b8)',
              lineHeight: 1.5,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden'
            }}
          >
            {stripHtml(category.description)}
          </p>
        ) : (
          <p
            style={{
              margin: '0 0 16px',
              fontSize: '0.88rem',
              color: 'var(--text-muted, #94a3b8)'
            }}
          >
            Explore photo sets in this category
          </p>
        )}

        <div
          style={{
            marginTop: 'auto',
            paddingTop: '12px',
            borderTop: '1px solid rgba(255, 255, 255, 0.06)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            color: '#818cf8',
            fontSize: '0.86rem',
            fontWeight: 600
          }}
        >
          <span>View Photo Sets</span>
          <ArrowRight size={15} />
        </div>
      </div>
    </div>
  );
};

export default GallerySection;

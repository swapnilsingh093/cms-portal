import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Film, Play, Calendar, FolderTree, ArrowRight } from 'lucide-react';
import SmartImage from '../common/SmartImage';
import { stripHtml } from '../../utils/textHelper';

const VideoSection = ({
  config = {},
  latestVideo = null,
  categories = [],
  onPlayVideo
}) => {
  const navigate = useNavigate();
  const { isAuthenticated, openAuthModal } = useAuth();

  const handleProtectedNavigate = (targetUrl, message = "Please sign in or register to access full video details") => {
    if (!isAuthenticated) {
      openAuthModal("login", message, targetUrl);
      return;
    }
    navigate(targetUrl);
  };

  if (config.enabled === false) return null;

  const title = config.title || 'Trending & Latest Videos';
  const subtitle = config.subtitle || 'Stream latest videos and explore curated video collections';

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
            <Film size={14} /> Video Showcase
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
          onClick={() => handleProtectedNavigate('/videos', 'Sign in or register to explore the complete video library')}
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
          View All Videos <ArrowRight size={14} />
        </button>
      </div>

      {/* Dynamic Grid (2 or 3 cards) */}
      <div className={`home-card-grid ${!cat2 ? 'grid-2-cols' : ''}`}>
        {/* Card 1: Latest Video */}
        {latestVideo ? (
          <div
            className="home-media-card"
            style={{
              background: 'var(--card-bg, #111827)',
              borderRadius: 'var(--radius-lg, 14px)',
              overflow: 'hidden',
              border: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: 'var(--shadow-sm, 0 4px 12px rgba(0,0,0,0.3))',
              transition: 'transform 0.25s, box-shadow 0.25s'
            }}
          >
            {/* Thumbnail with Modal Play Trigger */}
            <div
              onClick={() => onPlayVideo && onPlayVideo(latestVideo)}
              style={{
                position: 'relative',
                width: '100%',
                paddingTop: '58%',
                background: '#090d16',
                cursor: 'pointer',
                overflow: 'hidden'
              }}
              title="Click to play video popup"
            >
              <SmartImage
                src={
                  latestVideo.poster ||
                  latestVideo.thumbnail ||
                  latestVideo.banner ||
                  'https://images.unsplash.com/photo-1536240478700-b869070f9279?auto=format&fit=crop&w=800&q=80'
                }
                alt={latestVideo.title}
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

              {/* Play Button Overlay */}
              <div
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: '52px',
                  height: '52px',
                  borderRadius: '50%',
                  background: 'rgba(99, 102, 241, 0.9)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  boxShadow: '0 6px 20px rgba(99, 102, 241, 0.5)',
                  transition: 'transform 0.2s ease, background 0.2s ease'
                }}
                className="play-pulse-btn"
              >
                <Play size={22} fill="currentColor" style={{ marginLeft: '3px' }} />
              </div>

              {/* Latest Badge */}
              <div
                style={{
                  position: 'absolute',
                  top: '12px',
                  left: '12px',
                  background: 'rgba(239, 68, 68, 0.9)',
                  color: '#ffffff',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  padding: '3px 9px',
                  borderRadius: '6px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em'
                }}
              >
                Latest Video
              </div>

              {/* Duration if available */}
              {latestVideo.duration && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: '12px',
                    right: '12px',
                    background: 'rgba(0, 0, 0, 0.8)',
                    color: '#f8fafc',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    padding: '2px 8px',
                    borderRadius: '4px'
                  }}
                >
                  {latestVideo.duration}
                </div>
              )}
            </div>

            {/* Content Body */}
            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', flex: 1 }}>
              {/* Category & Date Metadata */}
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
                {latestVideo.category?.name && (
                  <span
                    style={{
                      color: '#818cf8',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <FolderTree size={13} /> {latestVideo.category.name}
                  </span>
                )}
                {latestVideo.createdAt && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Calendar size={13} /> {formatDate(latestVideo.createdAt)}
                  </span>
                )}
              </div>

              {/* Video Title -> Navigates to Single Video Page */}
              <h3
                onClick={() => handleProtectedNavigate(`/video/${latestVideo.slug}`, `Sign in or register to watch ${latestVideo.title}`)}
                style={{
                  margin: '0 0 10px',
                  fontSize: '1.1rem',
                  fontWeight: 700,
                  lineHeight: 1.4,
                  color: 'var(--text-main, #f8fafc)',
                  cursor: 'pointer',
                  transition: 'color 0.2s',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden'
                }}
                className="title-hover"
                title="Click to view single video page"
              >
                {latestVideo.title}
              </h3>

              {latestVideo.description && (
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
                  {stripHtml(latestVideo.description)}
                </p>
              )}

              {/* Bottom Actions */}
              <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '12px', borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
                <button
                  type="button"
                  onClick={() => onPlayVideo && onPlayVideo(latestVideo)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#818cf8',
                    fontSize: '0.86rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: 0
                  }}
                >
                  <Play size={14} fill="currentColor" /> Quick Play
                </button>
                <button
                  type="button"
                  onClick={() => handleProtectedNavigate(`/video/${latestVideo.slug}`, `Sign in or register to watch ${latestVideo.title}`)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted, #94a3b8)',
                    fontSize: '0.82rem',
                    cursor: 'pointer'
                  }}
                >
                  Details →
                </button>
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
            <Film size={36} style={{ opacity: 0.3, marginBottom: '10px' }} />
            <p>No published videos available yet.</p>
          </div>
        )}

        {/* Card 2: Video Category 1 */}
        {cat1 && renderCategoryCard(cat1, config.category1CustomImage, navigate, 'Video Category', handleProtectedNavigate)}

        {/* Card 3: Video Category 2 (Rendered ONLY if a distinct 2nd parent category exists - NO CLONE) */}
        {cat2 && renderCategoryCard(cat2, config.category2CustomImage, navigate, 'Video Category', handleProtectedNavigate)}
      </div>
    </section>
  );
};

// Reusable Category Card for Video / Gallery
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
    'https://images.unsplash.com/photo-1518173946687-a4c8a383392e?auto=format&fit=crop&w=800&q=80';

  return (
    <div
      onClick={() => onProtectedNav ? onProtectedNav(`/videos/${category.slug}`, `Sign in or register to explore category videos`) : navigate(`/videos/${category.slug}`)}
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

        {/* Badge */}
        <div
          style={{
            position: 'absolute',
            top: '12px',
            left: '12px',
            background: 'rgba(99, 102, 241, 0.9)',
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
            Explore all items in this collection
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
          <span>Browse Category</span>
          <ArrowRight size={15} />
        </div>
      </div>
    </div>
  );
};

export default VideoSection;

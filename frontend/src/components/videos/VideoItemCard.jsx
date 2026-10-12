import React from 'react';
import { Link } from 'react-router-dom';
import { Play, Calendar, Eye, ArrowRight, Film } from 'lucide-react';
import SmartImage from '../common/SmartImage';
import { stripHtml } from '../../utils/textHelper';
import { getItemPermalink } from '../../utils/permalinkHelper';

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return '';
  }
};

const VideoItemCard = ({ video, parentSlug, subcategorySlug }) => {
  if (!video) return null;

  const actualSlug = video.slug || (typeof video === 'object' ? video._id : String(video));

  // Determine target video URL using WordPress-style permalink helper
  let targetUrl = getItemPermalink(video, 'video');
  if (targetUrl.startsWith('/video/') && parentSlug && subcategorySlug) {
    targetUrl = `/videos/${parentSlug}/${subcategorySlug}/${actualSlug}`;
  }

  const thumbnail =
    video.poster ||
    video.thumbnail ||
    video.banner ||
    video.coverImage ||
    'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=800&q=80';

  const fullThumbUrl = thumbnail.startsWith('http')
    ? thumbnail
    : `http://localhost:5001${thumbnail}`;

  const categoryName = video.category && video.subCategory
    ? `${video.category.name} • ${video.subCategory.name}`
    : video.subCategory?.name || video.category?.name || '';

  return (
    <Link
      to={targetUrl}
      style={{
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--g-surface, var(--bg-card, #151f33))',
        border: '1px solid var(--g-border, var(--border-color, #22324f))',
        borderRadius: '18px',
        overflow: 'hidden',
        textDecoration: 'none',
        color: 'var(--g-text, var(--text-primary, #ffffff))',
        boxShadow: 'var(--g-shadow, 0 8px 24px rgba(0,0,0,0.3))',
        transition: 'transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease',
      }}
      className="video-album-card"
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-5px)';
        e.currentTarget.style.borderColor = 'var(--g-accent, #3b82f6)';
        e.currentTarget.style.boxShadow =
          '0 18px 40px var(--g-accent-glow, var(--primary-glow, rgba(59, 130, 246, 0.35)))';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.borderColor = 'var(--g-border, var(--border-color, #22324f))';
        e.currentTarget.style.boxShadow = 'var(--g-shadow, 0 8px 24px rgba(0,0,0,0.3))';
      }}
    >
      {/* Cover Image Container */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          paddingTop: '62%',
          background: '#030712',
          overflow: 'hidden',
        }}
      >
        <SmartImage
          src={fullThumbUrl}
          alt={video.title}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
          }}
          className="hover-zoom"
        />
        {/* Contrast Gradient Overlay (Top vignette for pill legibility + bottom fade) */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(180deg, rgba(0, 0, 0, 0.75) 0%, rgba(0, 0, 0, 0.22) 36%, transparent 60%), linear-gradient(0deg, var(--g-surface, var(--bg-card, #151f33)) 0%, transparent 60%)',
            pointerEvents: 'none',
          }}
        />

        {/* Center Play Button Overlay */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '46px',
            height: '46px',
            borderRadius: '50%',
            background: 'var(--primary-subtle, #3b82f6)',
            border: '1px solid var(--g-accent, #3b82f6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow:
              '0 0 24px var(--g-accent-glow, var(--primary-glow, rgba(59, 130, 246, 0.5)))',
            color: 'var(--g-accent, #ffffff)',
            opacity: 0.95,
            transition: 'transform 0.25s ease, opacity 0.25s ease',
            zIndex: 2,
          }}
        >
          <Play size={18} fill="#ffffff" color="#ffffff" style={{ marginLeft: '2px' }} />
        </div>

        {/* Duration / Quality Badge on Bottom Right */}
        <div
          style={{
            position: 'absolute',
            bottom: '12px',
            right: '12px',
            background: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(6px)',
            color: '#ffffff',
            fontSize: '0.75rem',
            fontWeight: 700,
            padding: '4px 10px',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            zIndex: 2,
          }}
        >
          <Film size={12} color="var(--g-accent, #3b82f6)" />
          <span>{video.duration || 'Watch Video'}</span>
        </div>

        {/* Category Pill on Top Left with rich green glassmorphism */}
        {categoryName && (
          <div
            title={categoryName}
            style={{
              position: 'absolute',
              top: '12px',
              left: '12px',
              maxWidth: 'calc(100% - 24px)',
              background: 'rgba(6, 44, 30, 0.82)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              border: '1px solid rgba(52, 211, 153, 0.65)',
              boxShadow: '0 4px 14px rgba(0, 0, 0, 0.45), inset 0 1px 1px rgba(255, 255, 255, 0.2)',
              color: '#a7f3d0',
              fontSize: '0.70rem',
              fontWeight: 800,
              padding: '4px 10px',
              borderRadius: '6px',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              textShadow: '0 1px 2px rgba(0, 0, 0, 0.85)',
              zIndex: 2,
            }}
          >
            {categoryName}
          </div>
        )}
      </div>

      {/* Content */}
      <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', flex: 1 }}>
        {/* Date and Views */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            fontSize: '0.78rem',
            color: 'var(--g-text-muted, var(--text-secondary, #94a3b8))',
            marginBottom: '10px',
          }}
        >
          {video.createdAt && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Calendar size={13} /> {formatDate(video.createdAt)}
            </span>
          )}
          {video.views !== undefined && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Eye size={13} /> {video.views} views
            </span>
          )}
        </div>

        {/* Title */}
        <h3
          style={{
            fontSize: '1.15rem',
            fontWeight: 800,
            color: 'var(--g-text, var(--text-primary, #ffffff))',
            margin: '0 0 8px',
            lineHeight: 1.4,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {video.title}
        </h3>

        {/* Description */}
        {(video.shortDescription || video.description) && (
          <p
            style={{
              fontSize: '0.86rem',
              color: 'var(--g-text-muted, var(--text-secondary, #94a3b8))',
              lineHeight: 1.5,
              margin: '0 0 16px',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {stripHtml(video.shortDescription || video.description)}
          </p>
        )}

        {/* Footer CTA */}
        <div
          style={{
            marginTop: 'auto',
            paddingTop: '12px',
            borderTop:
              '1px solid var(--g-border, var(--border-color, rgba(255, 255, 255, 0.08)))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.85rem',
            fontWeight: 700,
            color: 'var(--g-accent, #3b82f6)',
          }}
        >
          <span>Watch Video</span>
          <ArrowRight size={15} />
        </div>
      </div>
    </Link>
  );
};

export default VideoItemCard;

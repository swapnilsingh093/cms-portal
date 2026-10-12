import React, { useState } from 'react';
import VideoItemCard from './VideoItemCard';
import { useNavigate } from 'react-router-dom';
import { Search, X, Play, Eye, Clock, Film, Loader2 } from 'lucide-react';

const formatViews = (n) => {
  if (!n) return '0';
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return String(n);
};

const formatDate = (d) => {
  if (!d) return '';
  try {
    return new Date(d).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return '';
  }
};

const SearchVideoCard = ({ video }) => {
  const navigate = useNavigate();
  const [hovered, setHovered] = useState(false);

  const thumbnail =
    video.poster ||
    video.thumbnail ||
    video.banner ||
    video.coverImage ||
    'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600';

  const categoryName = video.category?.name || 'General';

  return (
    <div
      onClick={() => navigate(`/videos/${video.slug || video._id}`)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        borderRadius: '14px',
        overflow: 'hidden',
        background: 'var(--bg-card, rgba(255, 255, 255, 0.04))',
        border: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))',
        cursor: 'pointer',
        transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
        boxShadow: hovered
          ? '0 16px 40px rgba(0, 0, 0, 0.4)'
          : '0 4px 16px rgba(0, 0, 0, 0.2)',
        transition: 'all 0.3s ease',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Thumbnail with overlay & play button */}
      <div
        style={{
          position: 'relative',
          height: '180px',
          background: '#0a0d14',
          overflow: 'hidden',
        }}
      >
        <img
          src={thumbnail}
          alt={video.title}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transform: hovered ? 'scale(1.06)' : 'scale(1)',
            transition: 'transform 0.4s ease',
          }}
        />

        {/* Dark overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.2) 60%, transparent 100%)',
          }}
        />

        {/* Play button */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '50%',
              background: 'var(--accent-gradient, linear-gradient(135deg, #6366f1, #8b5cf6))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 25px var(--g-accent, rgba(99, 102, 241, 0.6))',
              transform: hovered ? 'scale(1.1)' : 'scale(0.95)',
              opacity: hovered ? 1 : 0.85,
              transition: 'all 0.25s ease',
            }}
          >
            <Play size={20} fill="#fff" color="#fff" style={{ marginLeft: '2px' }} />
          </div>
        </div>

        {/* Duration badge */}
        {video.duration && (
          <span
            style={{
              position: 'absolute',
              bottom: '10px',
              right: '10px',
              background: 'rgba(0, 0, 0, 0.75)',
              backdropFilter: 'blur(4px)',
              padding: '2px 8px',
              borderRadius: '4px',
              fontSize: '11px',
              fontWeight: 700,
              color: '#fff',
            }}
          >
            {video.duration}
          </span>
        )}

        {/* Category Pill */}
        <span
          style={{
            position: 'absolute',
            top: '10px',
            left: '10px',
            background: 'var(--primary-subtle, rgba(99, 102, 241, 0.15))', border: '1px solid var(--g-accent, #6366f1)',
            backdropFilter: 'blur(4px)',
            padding: '3px 9px',
            borderRadius: '999px',
            fontSize: '10px',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            color: 'var(--g-accent, #ffffff)',
          }}
        >
          {categoryName}
        </span>
      </div>

      {/* Details */}
      <div style={{ padding: '14px 16px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <h4
          style={{
            margin: '0 0 8px',
            fontSize: '14px',
            fontWeight: 700,
            lineHeight: 1.4,
            color: 'var(--text-primary, #f1f5f9)',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {video.title}
        </h4>

        {video.description && (
          <p
            style={{
              margin: '0 0 12px',
              fontSize: '12px',
              color: 'var(--text-muted, #94a3b8)',
              lineHeight: 1.5,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {video.description}
          </p>
        )}

        <div
          style={{
            marginTop: 'auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '11px',
            color: 'var(--text-muted, #64748b)',
            borderTop: '1px solid var(--border-color, rgba(255, 255, 255, 0.06))',
            paddingTop: '10px',
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Eye size={12} /> {formatViews(video.views)} views
          </span>
          {video.createdAt && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Clock size={12} /> {formatDate(video.createdAt)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

const VideosSearchResults = ({ query, results = [], loading = false, onClear = () => {} }) => {
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
            <Search size={12} /> Live Search
          </div>

          <h2
            style={{
              fontSize: 'clamp(1.5rem, 2.5vw, 2rem)',
              fontWeight: 800,
              color: 'var(--text-primary, #f1f5f9)',
              margin: '0 0 6px',
            }}
          >
            Search Results for &ldquo;{query}&rdquo;
          </h2>

          <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted, #94a3b8)' }}>
            {loading
              ? 'Searching videos archive...'
              : `Found ${results.length} matching ${results.length === 1 ? 'video' : 'videos'}`}
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
          <span>Searching video catalogue...</span>
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
          <Film size={44} style={{ opacity: 0.3, marginBottom: '14px', color: 'var(--g-accent, #6366f1)' }} />
          <h3 style={{ margin: '0 0 8px', fontSize: '1.2rem', color: 'var(--text-primary, #f1f5f9)' }}>
            No Videos Found
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
            We couldn&rsquo;t find any videos matching &ldquo;{query}&rdquo;. Try another term or browse categories.
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
        /* Grid of videos */
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: '20px',
          }}
        >
          {results.map((video) => (
            <VideoItemCard key={video._id} video={video} />
          ))}
        </div>
      )}
    </section>
  );
};

export default VideosSearchResults;

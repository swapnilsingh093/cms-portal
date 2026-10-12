import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Eye, Clock, Image, BookOpen, TrendingUp, Search, X, FolderTree, ChevronDown } from 'lucide-react';
import SmartImage from '../common/SmartImage';

const formatViews = (n) => {
  if (!n) return '0';
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return String(n);
};

const formatDate = (d) => {
  if (!d) return '';
  try {
    return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return '';
  }
};

const SidebarSection = ({ title, icon: Icon, children, defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div
      style={{
        background: 'var(--bg-card, rgba(255,255,255,0.04))',
        border: '1px solid var(--border-color, rgba(255,255,255,0.08))',
        borderRadius: '16px',
        overflow: 'hidden',
        marginBottom: '16px',
        transition: 'all 0.25s ease',
      }}
    >
      <div
        onClick={() => setIsOpen(!isOpen)}
        style={{
          padding: '14px 18px',
          borderBottom: isOpen ? '1px solid var(--border-color, rgba(255,255,255,0.06))' : 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--primary-subtle, rgba(99,102,241,0.06))',
          cursor: 'pointer',
          userSelect: 'none',
          transition: 'background 0.2s ease',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(99,102,241,0.12)')}
        onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--primary-subtle, rgba(99,102,241,0.06))')}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Icon size={15} color="var(--g-accent, #6366f1)" />
          <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary, #f1f5f9)', letterSpacing: '0.01em' }}>
            {title}
          </span>
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '24px',
            height: '24px',
            borderRadius: '6px',
            background: 'rgba(255,255,255,0.06)',
            color: 'var(--text-muted, #94a3b8)',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.25s ease',
          }}
        >
          <ChevronDown size={14} />
        </div>
      </div>
      {isOpen && <div style={{ padding: '12px' }}>{children}</div>}
    </div>
  );
};

const VideoMiniCard = ({ video, showViews = false, index = 0 }) => {
  const navigate = useNavigate();
  const [hovered, setHovered] = useState(false);

  const thumbnail = video.poster || video.thumbnail || video.banner || video.coverImage;

  return (
    <div
      onClick={() => navigate(`/videos/${video.slug || video._id}`)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        gap: '10px',
        cursor: 'pointer',
        padding: '8px',
        borderRadius: '10px',
        background: hovered ? 'var(--g-accent, rgba(99,102,241,0.08))' : 'transparent',
        transition: 'background 0.2s',
        marginBottom: '4px',
      }}
    >
      <div
        style={{
          width: '72px',
          minWidth: '72px',
          height: '48px',
          borderRadius: '8px',
          overflow: 'hidden',
          background: 'linear-gradient(135deg, #1e1b4b, #312e81)',
          position: 'relative',
          flexShrink: 0,
        }}
      >
        {thumbnail ? (
          <SmartImage src={thumbnail} alt={video.title} style={{ width: '100%', height: '100%' }} />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Play size={18} fill="var(--g-accent, #6366f1)" color="var(--g-accent, #6366f1)" />
          </div>
        )}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(0,0,0,0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: hovered ? 1 : 0,
            transition: 'opacity 0.2s',
          }}
        >
          <Play size={16} fill="#fff" color="#fff" />
        </div>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            margin: '0 0 4px',
            fontSize: '12px',
            fontWeight: 600,
            color: 'var(--text-primary, #f1f5f9)',
            lineHeight: 1.4,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {video.title}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {showViews && video.views ? (
            <span style={{ fontSize: '10px', color: 'var(--text-muted, #64748b)', display: 'flex', alignItems: 'center', gap: '3px' }}>
              <Eye size={10} /> {formatViews(video.views)}
            </span>
          ) : null}
          {video.createdAt && !showViews && (
            <span style={{ fontSize: '10px', color: 'var(--text-muted, #64748b)', display: 'flex', alignItems: 'center', gap: '3px' }}>
              <Clock size={10} /> {formatDate(video.createdAt)}
            </span>
          )}
        </div>
      </div>
      <div
        style={{
          alignSelf: 'center',
          minWidth: '20px',
          height: '20px',
          borderRadius: '4px',
          background: 'var(--primary-subtle, rgba(99,102,241,0.15))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '10px',
          fontWeight: 700,
          color: 'var(--g-accent, #6366f1)',
        }}
      >
        {index + 1}
      </div>
    </div>
  );
};

const PostMiniCard = ({ post }) => {
  const navigate = useNavigate();
  const [hovered, setHovered] = useState(false);
  const thumbnail = post.featuredImage || post.banner;

  return (
    <div
      onClick={() => navigate(`/stories/${post.slug || post._id}`)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        gap: '10px',
        cursor: 'pointer',
        padding: '8px',
        borderRadius: '10px',
        background: hovered ? 'rgba(236,72,153,0.06)' : 'transparent',
        transition: 'background 0.2s',
        marginBottom: '4px',
      }}
    >
      <div
        style={{
          width: '56px',
          minWidth: '56px',
          height: '56px',
          borderRadius: '8px',
          overflow: 'hidden',
          background: 'linear-gradient(135deg, #4c1d95, #6d28d9)',
          flexShrink: 0,
        }}
      >
        {thumbnail ? (
          <SmartImage src={thumbnail} alt={post.title} style={{ width: '100%', height: '100%' }} />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <BookOpen size={18} color="#a78bfa" />
          </div>
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            margin: '0 0 4px',
            fontSize: '12px',
            fontWeight: 600,
            color: 'var(--text-primary, #f1f5f9)',
            lineHeight: 1.4,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {post.title}
        </p>
        {post.createdAt && (
          <span style={{ fontSize: '10px', color: 'var(--text-muted, #64748b)', display: 'flex', alignItems: 'center', gap: '3px' }}>
            <Clock size={10} /> {formatDate(post.createdAt)}
          </span>
        )}
      </div>
    </div>
  );
};

const GalleryMiniCard = ({ gallery }) => {
  const navigate = useNavigate();
  const [hovered, setHovered] = useState(false);
  const thumbnail = gallery.coverImage || gallery.banner || (gallery.images && gallery.images[0]?.url);

  return (
    <div
      onClick={() => navigate(`/galleries/${gallery.slug || gallery._id}`)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        gap: '10px',
        cursor: 'pointer',
        padding: '8px',
        borderRadius: '10px',
        background: hovered ? 'rgba(6,182,212,0.06)' : 'transparent',
        transition: 'background 0.2s',
        marginBottom: '4px',
      }}
    >
      <div
        style={{
          width: '56px',
          minWidth: '56px',
          height: '56px',
          borderRadius: '8px',
          overflow: 'hidden',
          background: 'linear-gradient(135deg, #164e63, #0e7490)',
          flexShrink: 0,
        }}
      >
        {thumbnail ? (
          <SmartImage src={thumbnail} alt={gallery.title} style={{ width: '100%', height: '100%' }} />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Image size={18} color="#67e8f9" />
          </div>
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            margin: '0 0 4px',
            fontSize: '12px',
            fontWeight: 600,
            color: 'var(--text-primary, #f1f5f9)',
            lineHeight: 1.4,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {gallery.title}
        </p>
        {gallery.createdAt && (
          <span style={{ fontSize: '10px', color: 'var(--text-muted, #64748b)', display: 'flex', alignItems: 'center', gap: '3px' }}>
            <Clock size={10} /> {formatDate(gallery.createdAt)}
          </span>
        )}
      </div>
    </div>
  );
};

const VideoSidebar = ({
  sidebarData = {},
  sidebarConfig = {},
  searchQuery = '',
  onSearchChange = () => {},
  searchMode = 'categories', // 'categories' | 'videos'
  searchPlaceholder = '',
}) => {
  const [localSearch, setLocalSearch] = useState(searchQuery);

  useEffect(() => {
    setLocalSearch(searchQuery);
  }, [searchQuery]);

  const handleInputChange = (e) => {
    const val = e.target.value;
    setLocalSearch(val);
    onSearchChange(val);
  };

  const handleClear = () => {
    setLocalSearch('');
    onSearchChange('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearchChange(localSearch);
  };

  const {
    latestVideos = [],
    mostViewedVideos = [],
    latestPosts = [],
    latestGalleries = [],
  } = sidebarData;

  const defaultPlaceholder =
    searchMode === 'videos'
      ? 'Search videos in this category...'
      : 'Search video categories...';

  const searchTitle =
    searchMode === 'videos' ? 'Search Videos' : 'Search Categories';

  const SearchIcon = searchMode === 'videos' ? Search : FolderTree;

  return (
    <aside style={{ width: '100%' }}>
      {/* Reusable Search Widget - Default OPEN */}
      <SidebarSection title={searchTitle} icon={SearchIcon} defaultOpen={true}>
        <form onSubmit={handleSubmit} style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <input
            type="text"
            value={localSearch}
            onChange={handleInputChange}
            placeholder={searchPlaceholder || defaultPlaceholder}
            style={{
              width: '100%',
              padding: '10px 38px 10px 34px',
              borderRadius: '10px',
              border: '1px solid var(--border-color, rgba(255,255,255,0.12))',
              background: 'var(--bg-input, rgba(255,255,255,0.06))',
              color: 'var(--text-primary, #f1f5f9)',
              fontSize: '13px',
              outline: 'none',
              transition: 'border-color 0.2s',
            }}
          />
          <Search
            size={15}
            style={{
              position: 'absolute',
              left: '11px',
              color: 'var(--text-muted, #94a3b8)',
              pointerEvents: 'none',
            }}
          />
          {localSearch ? (
            <button
              type="button"
              onClick={handleClear}
              style={{
                position: 'absolute',
                right: '8px',
                background: 'rgba(255,255,255,0.1)',
                border: 'none',
                borderRadius: '50%',
                width: '20px',
                height: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: 'var(--text-secondary, #cbd5e1)',
                padding: 0,
              }}
              title="Clear search"
            >
              <X size={12} />
            </button>
          ) : null}
        </form>
        {localSearch && (
          <div
            style={{
              marginTop: '8px',
              fontSize: '11px',
              color: 'var(--text-muted, #94a3b8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span>Filtering {searchMode === 'videos' ? 'videos' : 'categories'}</span>
            <button
              type="button"
              onClick={handleClear}
              style={{
                background: 'none',
                border: 'none',
                color: '#818cf8',
                cursor: 'pointer',
                fontSize: '11px',
                padding: 0,
                textDecoration: 'underline',
              }}
            >
              Reset
            </button>
          </div>
        )}
      </SidebarSection>

      {/* Latest Videos - Default OPEN (2nd section expanded) */}
      {latestVideos.length > 0 && (
        <SidebarSection title="Latest Videos" icon={Clock} defaultOpen={true}>
          {latestVideos.map((video, idx) => (
            <VideoMiniCard key={video._id || idx} video={video} index={idx} />
          ))}
        </SidebarSection>
      )}

      {/* Most Viewed - Default CLOSED */}
      {mostViewedVideos.length > 0 && (
        <SidebarSection title="Most Viewed" icon={TrendingUp} defaultOpen={false}>
          {mostViewedVideos.map((video, idx) => (
            <VideoMiniCard key={video._id || idx} video={video} showViews index={idx} />
          ))}
        </SidebarSection>
      )}

      {/* Latest Posts - Default CLOSED */}
      {latestPosts.length > 0 && (
        <SidebarSection title="Latest Stories" icon={BookOpen} defaultOpen={false}>
          {latestPosts.map((post, idx) => (
            <PostMiniCard key={post._id || idx} post={post} />
          ))}
        </SidebarSection>
      )}

      {/* Latest Galleries - Default CLOSED */}
      {latestGalleries.length > 0 && (
        <SidebarSection title="Latest Galleries" icon={Image} defaultOpen={false}>
          {latestGalleries.map((gallery, idx) => (
            <GalleryMiniCard key={gallery._id || idx} gallery={gallery} />
          ))}
        </SidebarSection>
      )}
    </aside>
  );
};

export default VideoSidebar;

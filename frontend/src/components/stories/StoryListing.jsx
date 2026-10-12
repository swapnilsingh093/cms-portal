import React from 'react';
import StoryCard from './StoryCard';
import { BookOpen } from 'lucide-react';

const StoryListing = ({
  posts = [],
  title = 'Stories & Articles',
  subtitle = '',
  total = 0,
  loading = false,
  emptyMessage = 'No stories published in this section yet.',
}) => {
  if (loading) {
    return (
      <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-muted, #94a3b8)' }}>
        Loading stories...
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div
        style={{
          padding: '50px 24px',
          textAlign: 'center',
          background: 'var(--bg-card, rgba(255, 255, 255, 0.02))',
          borderRadius: '16px',
          border: '1px dashed var(--border-color, rgba(255, 255, 255, 0.1))',
        }}
      >
        <BookOpen
          size={36}
          color="var(--g-accent, #3b82f6)"
          style={{ margin: '0 auto 12px', opacity: 0.8 }}
        />
        <h4
          style={{
            fontSize: '1.1rem',
            fontWeight: 600,
            color: 'var(--text-primary, #f1f5f9)',
            marginBottom: '6px',
          }}
        >
          {emptyMessage}
        </h4>
        <p style={{ color: 'var(--text-muted, #94a3b8)', fontSize: '0.88rem', margin: 0 }}>
          Check back later for new editorial dispatches and articles.
        </p>
      </div>
    );
  }

  return (
    <div className="story-listing" style={{ width: '100%' }}>
      {/* Listing Section Title if provided */}
      {title && (
        <div
          style={{
            borderBottom: '2px solid var(--border-color, rgba(255, 255, 255, 0.08))',
            paddingBottom: '14px',
            marginBottom: '28px',
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <h3
              style={{
                fontSize: '1.35rem',
                fontWeight: 700,
                color: 'var(--text-primary, #f1f5f9)',
                margin: 0,
              }}
            >
              {title}
            </h3>
            {subtitle && (
              <p
                style={{
                  fontSize: '0.85rem',
                  color: 'var(--text-muted, #94a3b8)',
                  margin: '4px 0 0 0',
                }}
              >
                {subtitle}
              </p>
            )}
          </div>
          {total > 0 && (
            <span
              style={{ fontSize: '0.8rem', color: 'var(--text-muted, #94a3b8)', fontWeight: 500 }}
            >
              {total} {total === 1 ? 'Story' : 'Stories'}
            </span>
          )}
        </div>
      )}

      {/* Story Cards Grid (Matching Gallery Albums & Video Cards) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '24px',
        }}
      >
        {posts.map((post, idx) => (
          <StoryCard key={post._id || post.slug || idx} post={post} index={idx} />
        ))}
      </div>
    </div>
  );
};

export default StoryListing;

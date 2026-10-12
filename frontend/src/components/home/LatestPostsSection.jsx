import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { BookOpen, Calendar, FolderTree, ArrowRight } from 'lucide-react';
import SmartImage from '../common/SmartImage';
import { stripHtml } from '../../utils/textHelper';

const LatestPostsSection = ({
  config = {},
  posts = []
}) => {
  const navigate = useNavigate();
  const { isAuthenticated, openAuthModal } = useAuth();

  const handleProtectedNavigate = (targetUrl, message = "Please sign in or register to read full stories") => {
    if (!isAuthenticated) {
      openAuthModal("login", message, targetUrl);
      return;
    }
    navigate(targetUrl);
  };

  if (config.enabled === false) return null;

  const title = config.title || 'Latest Stories & Articles';
  const subtitle = config.subtitle || 'Read our newly published stories, folklore tales, and insights';

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

  const getExcerpt = (post) => {
    const raw = post.excerpt || post.shortDescription || post.content || '';
    const clean = stripHtml(raw);
    return clean.slice(0, 110) + (clean.length > 110 ? '...' : '');
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
            <BookOpen size={14} /> Editorial & Stories
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
          onClick={() => handleProtectedNavigate('/posts', 'Sign in or register to read all featured stories')}
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
          View All Stories <ArrowRight size={14} />
        </button>
      </div>

      {/* 3-Card Grid */}
      <div className="home-card-grid">
        {posts.length > 0 ? (
          posts.slice(0, config.count || 3).map((post) => {
            const imageSrc =
              post.featuredImage ||
              post.banner ||
              'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=800&q=80';

            return (
              <div
                key={post._id}
                onClick={() => handleProtectedNavigate(`/post/${post.slug}`, `Sign in or register to read: "${post.title}"`)}
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
                {/* Featured Image */}
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
                    alt={post.title}
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

                  {/* Category Pill */}
                  {post.category?.name && (
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
                      {post.category.name}
                    </div>
                  )}
                </div>

                {/* Body */}
                <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                  {/* Date */}
                  {post.createdAt && (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '0.8rem',
                        color: 'var(--text-muted, #94a3b8)',
                        marginBottom: '10px'
                      }}
                    >
                      <Calendar size={13} /> {formatDate(post.createdAt)}
                    </div>
                  )}

                  {/* Title */}
                  <h3
                    style={{
                      margin: '0 0 10px',
                      fontSize: '1.15rem',
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
                    {post.title}
                  </h3>

                  {/* Excerpt */}
                  {getExcerpt(post) && (
                    <p
                      style={{
                        margin: '0 0 16px',
                        fontSize: '0.88rem',
                        color: 'var(--text-muted, #94a3b8)',
                        lineHeight: 1.5,
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}
                    >
                      {getExcerpt(post)}
                    </p>
                  )}

                  {/* Bottom Action */}
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
                    <span>Read Story</span>
                    <ArrowRight size={15} />
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div
            style={{
              gridColumn: '1 / -1',
              background: 'var(--card-bg, #111827)',
              borderRadius: 'var(--radius-lg, 14px)',
              padding: '40px 20px',
              textAlign: 'center',
              border: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))',
              color: 'var(--text-muted, #94a3b8)'
            }}
          >
            <BookOpen size={36} style={{ opacity: 0.3, marginBottom: '10px' }} />
            <p>No published stories available yet.</p>
          </div>
        )}
      </div>
    </section>
  );
};

export default LatestPostsSection;

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { pageAPI } from '../../services/api';
import HomeTemplate from '../../templates/HomeTemplate';
import VideosTemplate from '../../templates/VideosTemplate';
import StoriesTemplate from '../../templates/StoriesTemplate';
import GalleriesTemplate from '../../templates/GalleriesTemplate';
import SearchByVideoTemplate from '../../templates/SearchByVideoTemplate';
import NotFoundPage from './NotFoundPage';
import { ArrowLeft, Loader2 } from 'lucide-react';

const CustomPageView = ({ slug: propSlug, onNavigate }) => {
  const { slug: paramSlug } = useParams();
  const slug = propSlug || paramSlug;
  const navigate = useNavigate();
  const [page, setPage] = useState(null);
  const [loading, setLoading] = useState(true);

  const goHome = () => {
    if (onNavigate) onNavigate('home');
    else navigate('/');
  };

  useEffect(() => {
    const fetchPage = async () => {
      if (!slug) return;
      setLoading(true);
      try {
        const res = await pageAPI.getBySlug(slug);
        if (res.page) setPage(res.page);
      } catch (err) {
        console.error('Error fetching page:', err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchPage();
  }, [slug]);

  if (loading) {
    return (
      <div
        style={{
          minHeight: '60vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px',
          color: 'var(--text-muted, #94a3b8)'
        }}
      >
        <Loader2 size={32} className="spin" color="var(--g-accent, #6366f1)" />
        <span style={{ fontSize: '0.95rem' }}>Loading page...</span>
      </div>
    );
  }

  if (!page) {
    return (
      <NotFoundPage
        type="page"
        title="Page Not Found"
        message={`The custom page "/${slug}" could not be located or may have been un-published.`}
      />
    );
  }

  // Render Template-Specific Views
  if (page.template === 'home') {
    return <HomeTemplate pageData={page} />;
  }

  if (page.template === 'videos') {
    return <VideosTemplate pageData={page} />;
  }

  if (page.template === 'stories' || page.template === 'posts') {
    return <StoriesTemplate pageData={page} />;
  }

  if (page.template === 'galleries' || page.template === 'gallery') {
    return <GalleriesTemplate pageData={page} />;
  }

  if (page.template === 'search-by-video') {
    return <SearchByVideoTemplate pageData={page} />;
  }

  // Default / Standard Page View
  const bannerConfig = page.templateConfig?.banner || {};
  const bannerHeight = bannerConfig.height || '420px';
  const bannerHeading = bannerConfig.heading || page.title;
  const bannerSubheading = bannerConfig.subheading || '';
  const bannerAlignment = bannerConfig.alignment || 'left';
  const overlayOpacity = bannerConfig.overlayOpacity !== undefined ? bannerConfig.overlayOpacity : 0.6;

  return (
    <div style={{ minHeight: '80vh', backgroundColor: 'var(--bg-main, #0b0f19)' }}>
      {/* 
        Single-Post Style Hero Banner for Default Page 
        (Only displays when page.banner is set)
      */}
      {page.banner ? (
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: bannerHeight,
            minHeight: '280px',
            background: '#080c14',
            display: 'flex',
            alignItems: 'flex-end',
            overflow: 'hidden'
          }}
        >
          {/* Background Image */}
          <img
            src={page.banner}
            alt={page.title}
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              zIndex: 1
            }}
          />

          {/* Gradient Overlay for Readability */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: `linear-gradient(180deg, rgba(11, 15, 25, ${overlayOpacity * 0.5}) 0%, rgba(11, 15, 25, ${overlayOpacity * 0.85}) 60%, rgba(11, 15, 25, 0.98) 100%)`,
              zIndex: 2
            }}
          />

          {/* Banner Content (Heading & Subheading) */}
          <div
            style={{
              position: 'relative',
              zIndex: 3,
              width: '100%',
              maxWidth: page.template === 'full-width' ? '1200px' : '960px',
              margin: '0 auto',
              padding: '0 24px 44px',
              textAlign: bannerAlignment,
              boxSizing: 'border-box'
            }}
          >
            <h1
              style={{
                fontSize: 'clamp(2rem, 4.5vw, 3.2rem)',
                fontWeight: 800,
                color: '#ffffff',
                lineHeight: 1.15,
                margin: '0 0 12px 0',
                letterSpacing: '-0.02em',
                textShadow: '0 2px 16px rgba(0, 0, 0, 0.6)'
              }}
            >
              {bannerHeading}
            </h1>

            {bannerSubheading && (
              <p
                style={{
                  fontSize: 'clamp(1rem, 2vw, 1.25rem)',
                  color: '#cbd5e1',
                  margin: 0,
                  maxWidth: '720px',
                  lineHeight: 1.5,
                  ...(bannerAlignment === 'center' ? { margin: '0 auto' } : {})
                }}
              >
                {bannerSubheading}
              </p>
            )}
          </div>
        </div>
      ) : null}

      {/* Main Page Content Body */}
      <div
        style={{
          maxWidth: page.template === 'full-width' ? '1200px' : '960px',
          margin: '0 auto',
          padding: page.banner ? '48px 24px 90px' : '40px 24px 90px',
          boxSizing: 'border-box'
        }}
      >
        {/* If no banner image exists, render standard clean page title header */}
        {!page.banner && (
          <h1
            style={{
              fontSize: 'clamp(2rem, 4vw, 2.8rem)',
              fontWeight: 800,
              color: 'var(--text-primary, #ffffff)',
              marginBottom: '28px',
              letterSpacing: '-0.02em'
            }}
          >
            {page.title}
          </h1>
        )}

        <div
          className="custom-page-content story-content"
          dangerouslySetInnerHTML={{ __html: page.content || '' }}
          style={{
            fontSize: '1.05rem',
            lineHeight: '1.85',
            color: 'var(--text-primary, #ffffff)'
          }}
        />
        <style>{`
          .custom-page-content {
            color: var(--text-primary, #ffffff) !important;
          }
          .custom-page-content h1,
          .custom-page-content h2,
          .custom-page-content h3,
          .custom-page-content h4,
          .custom-page-content h5,
          .custom-page-content h6 {
            color: var(--text-heading, var(--theme-heading, #ffffff)) !important;
            margin-top: 1.5em;
            margin-bottom: 0.6em;
          }
          .custom-page-content p {
            color: var(--text-primary, #ffffff);
            margin-bottom: 1.25em;
          }
          .custom-page-content li {
            color: var(--text-primary, #ffffff);
          }
          .custom-page-content strong,
          .custom-page-content b {
            color: var(--text-heading, #ffffff);
          }
        `}</style>
      </div>
    </div>
  );
};

export default CustomPageView;

import React, { useState, useEffect, useRef } from 'react';
import { categoryAPI, galleryAPI, videoAPI, postAPI } from '../services/api';
import GalleryHeroBanner from '../components/galleries/GalleryHeroBanner';
import GalleryCategoryCard from '../components/galleries/GalleryCategoryCard';
import GalleryAlbumCard from '../components/galleries/GalleryAlbumCard';
import GallerySidebar from '../components/galleries/GallerySidebar';
import GalleryThemePalette from '../components/galleries/GalleryThemePalette';
import { GalleryThemeProvider } from '../context/GalleryThemeContext';
import {
  FolderTree,
  Images,
  Loader2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

const GalleriesTemplateContent = ({ pageData }) => {
  const config = pageData?.templateConfig || {};
  const bannerConfig = config.banner || {};
  const layoutConfig = config.layout || {};
  const categoriesConfig = config.categories || {};
  const sidebarConfig = config.sidebar || {};

  const perPage = Number(categoriesConfig.perPage) || 6;
  const isSidebarEnabled =
    layoutConfig.sidebar !== 'without_sidebar' && sidebarConfig.enabled !== false;

  // Categories & Pagination
  const [categories, setCategories] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  // Albums
  const [albums, setAlbums] = useState([]);
  const [albumsLoading, setAlbumsLoading] = useState(true);

  // Instant Live Search
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const searchTimeoutRef = useRef(null);

  // Sidebar Data State
  const [latestAlbums, setLatestAlbums] = useState([]);
  const [mostViewedAlbums, setMostViewedAlbums] = useState([]);
  const [sidebarLoading, setSidebarLoading] = useState(false);

  // 1. Fetch Root Photo Categories
  useEffect(() => {
    let isMounted = true;
    const fetchCategories = async () => {
      setCategoriesLoading(true);
      try {
        const res = await categoryAPI.getAll({
          type: 'gallery',
          isRoot: 'true',
          page: currentPage,
          limit: perPage,
        });

        let fetched = res.categories || [];
        let pages = res.pagination?.pages || 1;

        if (fetched.length === 0 && currentPage === 1) {
          const fallbackRes = await categoryAPI.getAll({
            isRoot: 'true',
            page: currentPage,
            limit: perPage,
          });
          fetched = fallbackRes.categories || [];
          pages = fallbackRes.pagination?.pages || 1;
        }

        if (isMounted) {
          setCategories(fetched);
          setTotalPages(pages);
        }
      } catch (err) {
        console.error('Error fetching gallery categories:', err);
      } finally {
        if (isMounted) setCategoriesLoading(false);
      }
    };

    fetchCategories();
    return () => {
      isMounted = false;
    };
  }, [currentPage, perPage]);

  // 2. Fetch Direct Published Albums
  useEffect(() => {
    let isMounted = true;
    const fetchAlbums = async () => {
      setAlbumsLoading(true);
      try {
        const res = await galleryAPI.getAll({ status: 'published', limit: 12 });
        if (isMounted) {
          setAlbums(res.galleries || []);
        }
      } catch (err) {
        console.error('Error fetching albums:', err);
      } finally {
        if (isMounted) setAlbumsLoading(false);
      }
    };

    fetchAlbums();
    return () => {
      isMounted = false;
    };
  }, []);

  // 3. Fetch Sidebar Data (when enabled)
  useEffect(() => {
    if (!isSidebarEnabled) return;

    let isMounted = true;
    const fetchSidebar = async () => {
      setSidebarLoading(true);
      try {
        const galCount = Number(sidebarConfig.latestGalleriesCount) || 5;
        const [latestRes, mostViewedRes] = await Promise.all([
          galleryAPI.getAll({ limit: galCount, status: 'published', sort: '-createdAt' }).catch(() => ({ galleries: [] })),
          galleryAPI.getAll({ limit: 4, status: 'published', sort: '-views' }).catch(() => ({ galleries: [] }))
        ]);

        if (isMounted) {
          setLatestAlbums(latestRes.galleries || []);
          setMostViewedAlbums(mostViewedRes.galleries || []);
        }
      } catch (err) {
        console.error('Error loading gallery sidebar data:', err);
      } finally {
        if (isMounted) setSidebarLoading(false);
      }
    };

    fetchSidebar();
    return () => {
      isMounted = false;
    };
  }, [isSidebarEnabled, sidebarConfig.latestGalleriesCount]);

  // 4. Live Debounced Search
  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (!trimmed) {
      setSearchResults([]);
      setSearching(false);
      return;
    }

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    setSearching(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await galleryAPI.getAll({
          search: trimmed,
          status: 'published',
          limit: 20,
        });
        setSearchResults(res.galleries || []);
      } catch (err) {
        console.error('Error searching galleries:', err);
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 250);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      const target = document.getElementById('categories-section');
      if (target) {
        target.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <div className="galleries-template-root" style={{ width: '100%', minHeight: '100vh', background: 'var(--g-bg, transparent)', color: 'var(--g-text, var(--text-primary, #ffffff))' }}>
      {/* 1. Hero Banner */}
      <GalleryHeroBanner
        config={bannerConfig}
        breadcrumbs={[{ label: 'Home', url: '/' }, { label: 'Galleries' }]}
        showScrollIndicator={true}
      />

      {/* 2. Main Body Container with Dynamic Layout (With or Without Sidebar) */}
      <div
        style={{
          maxWidth: '1440px',
          margin: '0 auto',
          padding: '48px 24px 80px',
          boxSizing: 'border-box',
        }}
      >
        <div
          className="galleries-layout-container"
          style={{
            display: 'grid',
            gridTemplateColumns: isSidebarEnabled ? '320px minmax(0, 1fr)' : '1fr',
            gap: '40px',
          }}
        >
          {/* Sidebar (When Enabled) */}
          {isSidebarEnabled && (
            <aside style={{ minWidth: 0, height: '100%' }}>
              <GallerySidebar
                categories={categories}
                latestAlbums={latestAlbums}
                mostViewedAlbums={mostViewedAlbums}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
              />
            </aside>
          )}

          {/* Main Content Column */}
          <main style={{ minWidth: 0, width: '100%' }}>
            {/* If User Is Searching */}
            {searchQuery.trim() ? (
              <section>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                  <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, color: 'var(--g-text, var(--text-primary, #ffffff))' }}>
                    Search Results for <span style={{ color: 'var(--g-accent, #3b82f6)' }}>"{searchQuery}"</span>
                  </h2>
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    style={{
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid var(--g-border, var(--border-color, #22324f))',
                      color: 'var(--g-accent, #3b82f6)',
                      padding: '6px 14px',
                      borderRadius: '8px',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    Clear Search
                  </button>
                </div>

                {searching ? (
                  <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--g-text-muted, var(--text-secondary, #94a3b8))' }}>
                    <Loader2 size={32} className="spin" color="var(--g-accent, #3b82f6)" />
                    <p style={{ marginTop: '12px' }}>Searching photo albums...</p>
                  </div>
                ) : searchResults.length > 0 ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
                    {searchResults.map((alb) => (
                      <GalleryAlbumCard key={alb._id} gallery={alb} />
                    ))}
                  </div>
                ) : (
                  <div
                    style={{
                      textAlign: 'center',
                      padding: '60px 20px',
                      background: 'var(--g-surface, var(--bg-card, #151f33))',
                      borderRadius: '16px',
                      border: '1px solid var(--g-border, var(--border-color, #22324f))',
                    }}
                  >
                    <Images size={40} color="var(--g-accent, #3b82f6)" style={{ opacity: 0.5, marginBottom: '12px' }} />
                    <h3 style={{ margin: '0 0 6px', fontSize: '1.1rem' }}>No Photo Albums Found</h3>
                    <p style={{ margin: 0, color: 'var(--g-text-muted, var(--text-secondary, #94a3b8))', fontSize: '0.9rem' }}>
                      Try searching with different keywords.
                    </p>
                  </div>
                )}
              </section>
            ) : (
              <>
                {/* 1. Parent Photo Categories Section */}
                <section id="categories-section" style={{ marginBottom: '56px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
                    <div>
                      <div
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontSize: '0.78rem',
                          fontWeight: 800,
                          textTransform: 'uppercase',
                          letterSpacing: '0.06em',
                          color: 'var(--g-accent, #3b82f6)',
                          marginBottom: '4px',
                        }}
                      >
                        <FolderTree size={14} /> Photo Taxonomy
                      </div>
                      <h2 style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: 900, margin: 0, color: 'var(--g-text, var(--text-primary, #ffffff))' }}>
                        {categoriesConfig.heading || 'Browse Photo Categories'}
                      </h2>
                      {categoriesConfig.subtitle && (
                        <p style={{ margin: '4px 0 0 0', fontSize: '0.92rem', color: 'var(--g-text-muted, var(--text-secondary, #94a3b8))' }}>
                          {categoriesConfig.subtitle}
                        </p>
                      )}
                    </div>
                  </div>

                  {categoriesLoading ? (
                    <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--g-text-muted, var(--text-secondary, #94a3b8))' }}>
                      <Loader2 size={32} className="spin" color="var(--g-accent, #3b82f6)" />
                    </div>
                  ) : categories.length > 0 ? (
                    <>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
                        {categories.map((cat) => (
                          <GalleryCategoryCard key={cat._id} category={cat} />
                        ))}
                      </div>

                      {/* Pagination Controls */}
                      {totalPages > 1 && (
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', marginTop: '36px' }}>
                          <button
                            type="button"
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage <= 1}
                            style={{
                              padding: '8px 14px',
                              borderRadius: '8px',
                              background: 'rgba(255, 255, 255, 0.08)',
                              border: '1px solid var(--g-border, var(--border-color, #22324f))',
                              color: currentPage <= 1 ? 'rgba(255, 255, 255, 0.3)' : 'var(--g-text, var(--text-primary, #ffffff))',
                              cursor: currentPage <= 1 ? 'not-allowed' : 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '0.85rem'
                            }}
                          >
                            <ChevronLeft size={16} /> Prev
                          </button>
                          <span style={{ fontSize: '0.88rem', color: 'var(--g-text-muted, var(--text-secondary, #94a3b8))' }}>
                            Page {currentPage} of {totalPages}
                          </span>
                          <button
                            type="button"
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage >= totalPages}
                            style={{
                              padding: '8px 14px',
                              borderRadius: '8px',
                              background: 'rgba(255, 255, 255, 0.08)',
                              border: '1px solid var(--g-border, var(--border-color, #22324f))',
                              color: currentPage >= totalPages ? 'rgba(255, 255, 255, 0.3)' : 'var(--g-text, var(--text-primary, #ffffff))',
                              cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '0.85rem'
                            }}
                          >
                            Next <ChevronRight size={16} />
                          </button>
                        </div>
                      )}
                    </>
                  ) : (
                    <div
                      style={{
                        textAlign: 'center',
                        padding: '50px 20px',
                        background: 'var(--g-surface, var(--bg-card, #151f33))',
                        borderRadius: '16px',
                        border: '1px dashed var(--g-border, var(--border-color, #22324f))',
                      }}
                    >
                      <p style={{ margin: 0, color: 'var(--g-text-muted, var(--text-secondary, #94a3b8))' }}>No photo categories found.</p>
                    </div>
                  )}
                </section>

                {/* 2. Direct Published Photo Albums */}
                <section id="albums">
                  <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '24px' }}>
                    <div>
                      <div
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontSize: '0.78rem',
                          fontWeight: 800,
                          textTransform: 'uppercase',
                          letterSpacing: '0.06em',
                          color: 'var(--g-accent, #3b82f6)',
                          marginBottom: '4px',
                        }}
                      >
                        <Images size={14} /> Full Visual Collection
                      </div>
                      <h2 style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: 900, margin: 0, color: 'var(--g-text, var(--text-primary, #ffffff))' }}>
                        All Photo Albums
                      </h2>
                    </div>
                  </div>

                  {albumsLoading ? (
                    <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--g-text-muted, var(--text-secondary, #94a3b8))' }}>
                      <Loader2 size={32} className="spin" color="var(--g-accent, #3b82f6)" />
                    </div>
                  ) : albums.length > 0 ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
                      {albums.map((alb) => (
                        <GalleryAlbumCard key={alb._id} gallery={alb} />
                      ))}
                    </div>
                  ) : (
                    <div
                      style={{
                        textAlign: 'center',
                        padding: '50px 20px',
                        background: 'var(--g-surface, var(--bg-card, #151f33))',
                        borderRadius: '16px',
                        border: '1px dashed var(--g-border, var(--border-color, #22324f))',
                      }}
                    >
                      <p style={{ margin: 0, color: 'var(--g-text-muted, var(--text-secondary, #94a3b8))' }}>No published photo albums available yet.</p>
                    </div>
                  )}
                </section>
              </>
            )}
          </main>
        </div>
      </div>

      {/* Floating Theme Palette Customizer */}
      <GalleryThemePalette />

      <style>{`
        @media (max-width: 960px) {
          .galleries-layout-container {
            grid-template-columns: 1fr !important;
            gap: 32px !important;
          }
        }
      `}</style>
    </div>
  );
};

const GalleriesTemplate = ({ pageData }) => {
  return (
    <GalleryThemeProvider>
      <GalleriesTemplateContent pageData={pageData} />
    </GalleryThemeProvider>
  );
};

export default GalleriesTemplate;

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { categoryAPI, videoAPI, postAPI, galleryAPI } from '../../services/api';
import VideoHeroBanner from '../../components/videos/VideoHeroBanner';
import { resolveBannerImage } from '../../utils/bannerHelper';
import VideoCategoryCard from '../../components/videos/VideoCategoryCard';
import VideoItemCard from '../../components/videos/VideoItemCard';
import CategorySearchResults from '../../components/videos/CategorySearchResults';
import VideoSidebar from '../../components/videos/VideoSidebar';
import VideoDetail from './VideoDetail';
import PageLoader from '../../components/common/PageLoader';
import { Loader2, FolderTree, ChevronLeft, ChevronRight, Film, Play, Eye, Clock } from 'lucide-react';

const VideoParentCategoryPage = ({ categorySlug: propCategorySlug }) => {
  const params = useParams();
  const categorySlug = propCategorySlug || params.categorySlug || params.p1;
  const navigate = useNavigate();

  const [category, setCategory] = useState(null);
  const [subCategories, setSubCategories] = useState([]);
  const [directVideos, setDirectVideos] = useState([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [isLegacyVideo, setIsLegacyVideo] = useState(false);

  // Pagination for subcategories / direct videos
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsLoading, setItemsLoading] = useState(false);

  // On-page search state (searches subcategories or videos)
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  // Sidebar dynamic data
  const [sidebarData, setSidebarData] = useState({
    latestVideos: [],
    mostViewedVideos: [],
    latestPosts: [],
    latestGalleries: [],
  });

  // 1. Fetch Category data (or detect if it's a legacy direct video URL)
  useEffect(() => {
    let isMounted = true;
    const fetchCategory = async () => {
      setPageLoading(true);
      setIsLegacyVideo(false);
      try {
        const res = await categoryAPI.getBySlug(categorySlug, { type: 'video' });
        if (res.category && isMounted) {
          // If this category actually has a parentCategory, redirect to full hierarchical URL
          if (res.category.parentCategory && res.category.parentCategory.slug) {
            navigate(`/videos/${res.category.parentCategory.slug}/${res.category.slug}`, { replace: true });
            return;
          }
          setCategory(res.category);
        } else {
          // Check if it's a legacy video URL
          const vidRes = await videoAPI.getBySlug(categorySlug).catch(() => null);
          if (vidRes && vidRes.video && isMounted) {
            setIsLegacyVideo(true);
          }
        }
      } catch (err) {
        // Fallback: check if it's a video
        try {
          const vidRes = await videoAPI.getBySlug(categorySlug);
          if (vidRes && vidRes.video && isMounted) {
            setIsLegacyVideo(true);
          }
        } catch (e) {
          console.error('Error fetching parent category:', err);
        }
      } finally {
        if (isMounted) setPageLoading(false);
      }
    };

    fetchCategory();
    return () => {
      isMounted = false;
    };
  }, [categorySlug]);

  // 2. Fetch Subcategories or Direct Videos (Part 7, 13, 27, 28)
  useEffect(() => {
    if (!category || isLegacyVideo) return;

    let isMounted = true;
    const fetchContent = async () => {
      setItemsLoading(true);
      try {
        const perPage = 9;
        // Fetch subcategories belonging to this parent category
        const subRes = await categoryAPI.getAll({
          parent: category._id,
          type: 'video',
          page: currentPage,
          limit: perPage,
        });

        const fetchedSubs = subRes.categories || [];
        const pages = subRes.pagination?.pages || 1;

        if (isMounted) {
          setSubCategories(fetchedSubs);
          setTotalPages(pages);

          // If this parent category has NO subcategories, fetch direct videos as fallback (Part 27, 28)
          if (fetchedSubs.length === 0) {
            const vidRes = await videoAPI.getAll({
              category: category._id,
              status: 'published',
              page: currentPage,
              limit: 12,
            });
            if (isMounted) {
              setDirectVideos(vidRes.videos || []);
              setTotalPages(vidRes.pagination?.pages || 1);
            }
          }
        }
      } catch (err) {
        console.error('Error fetching category content:', err);
      } finally {
        if (isMounted) setItemsLoading(false);
      }
    };

    fetchContent();
    return () => {
      isMounted = false;
    };
  }, [category, currentPage, isLegacyVideo]);

  // 3. Fetch Sidebar Data (Latest 5 videos, Most viewed 2 videos, Latest posts, Latest galleries)
  useEffect(() => {
    if (!category || isLegacyVideo) return;

    let isMounted = true;
    const fetchSidebar = async () => {
      try {
        const [latestVids, mostViewed, posts, gals] = await Promise.all([
          videoAPI.getAll({ limit: 5, status: 'published', sort: '-createdAt' }).catch(() => ({ videos: [] })),
          videoAPI.getAll({ limit: 2, status: 'published', sort: '-views' }).catch(() => ({ videos: [] })),
          postAPI.getAll({ limit: 3, status: 'published' }).catch(() => ({ posts: [] })),
          galleryAPI.getAll({ limit: 3, status: 'published' }).catch(() => ({ galleries: [] })),
        ]);

        if (isMounted) {
          setSidebarData({
            latestVideos: latestVids.videos || [],
            mostViewedVideos: mostViewed.videos || [],
            latestPosts: posts.posts || [],
            latestGalleries: gals.galleries || [],
          });
        }
      } catch (err) {
        console.error('Error fetching sidebar widgets:', err);
      }
    };

    fetchSidebar();
    return () => {
      isMounted = false;
    };
  }, [category, isLegacyVideo]);

  // 4. On-Page Search (Search subcategories or categories)
  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (!trimmed) {
      setSearchResults([]);
      setSearching(false);
      return;
    }

    setSearching(true);
    const timeout = setTimeout(async () => {
      try {
        const res = await categoryAPI.getAll({
          type: 'video',
          search: trimmed,
          limit: 20,
        });
        setSearchResults(res.categories || []);
      } catch (e) {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 200);

    return () => clearTimeout(timeout);
  }, [searchQuery]);

  // If this slug belongs to a video, render VideoDetail for backward compatibility
  if (isLegacyVideo) {
    return <VideoDetail slug={categorySlug} />;
  }

  if (pageLoading) {
    return <PageLoader text="Loading category..." />;
  }

  if (!category) {
    return (
      <div style={{ textAlign: 'center', padding: '120px 20px', maxWidth: '500px', margin: '0 auto' }}>
        <FolderTree size={48} style={{ opacity: 0.3, marginBottom: '16px', color: 'var(--g-accent, #6366f1)' }} />
        <h2 style={{ marginBottom: '10px', color: 'var(--text-primary)' }}>Category Not Found</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>
          The requested video category does not exist or has been removed.
        </p>
        <button
          onClick={() => navigate('/videos')}
          className="button button-primary"
          style={{ padding: '10px 24px' }}
        >
          Back to Videos
        </button>
      </div>
    );
  }

  const isWithSidebar = category.layout !== 'without_sidebar';

  // Banner configuration for Parent Category (Parts 8, 9, 10, 23)
  const bannerMediaType = category.bannerType === 'video' && category.bannerVideo ? 'video' : 'image';
  const bannerMediaUrl =
    bannerMediaType === 'video'
      ? category.bannerVideo
      : category.bannerImage || resolveBannerImage(category, category.slug || category.name);

  const shortDesc =
    category.shortDescription ||
    (category.description
      ? category.description.replace(/<[^>]*>?/gm, '').slice(0, 160) + '...'
      : '');

  const bannerConfig = {
    type: bannerMediaType,
    mediaUrl: bannerMediaUrl,
    height: category.mediaHeight || '75vh',
    heading: category.name,
    subheading: 'Parent Video Category',
    description: shortDesc,
    overlayStrength: category.overlayStrength !== undefined ? category.overlayStrength : 0,
    bannerPosition: category.bannerPosition || 'center',
    headingFontSize: '2rem',
    subheadingFontSize: '0.72rem',
    descriptionFontSize: category.descriptionFontSize || '1rem',
    alignment: category.alignment || 'left',
    verticalPosition: category.verticalPosition || 'center',
    buttonText: category.buttonText || '',
    buttonUrl: category.buttonUrl || '',
    buttonFontSize: category.buttonFontSize || '0.95rem',
  };

  const breadcrumbs = [
    { label: 'Home', url: '/' },
    { label: 'Videos', url: '/videos' },
    { label: category.name },
  ];

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      const target = document.getElementById('category-content');
      if (target) target.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="video-parent-category-page" style={{ width: '100%' }}>
      {/* 1. Reusable Hero Banner (Parts 8, 9, 10, 23) */}
      <VideoHeroBanner
        config={bannerConfig}
        breadcrumbs={breadcrumbs}
        showScrollIndicator={false}
      />

      {/* 2. Main Content Body with Layout & Left Sidebar (Parts 11, 12, 13) */}
      <div
        id="category-content"
        style={{
          maxWidth: '1400px',
          margin: '0 auto',
          padding: '40px 24px 80px',
          boxSizing: 'border-box',
        }}
      >
        <div
          className="category-layout-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: isWithSidebar ? '320px minmax(0, 1fr)' : '1fr',
            gap: '40px',
          }}
        >
          {/* Left Sidebar */}
          {isWithSidebar && (
            <aside style={{ minWidth: 0, height: '100%' }}>
              <div
                style={{
                  position: 'sticky',
                  top: 'calc(var(--wp-admin-bar-height, 0px) + 88px)',
                  zIndex: 10,
                }}
              >
                <VideoSidebar
                  sidebarData={sidebarData}
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                  searchMode="categories"
                  searchPlaceholder={`Search categories...`}
                />
              </div>
            </aside>
          )}

          {/* Main Column */}
          <main style={{ minWidth: 0, paddingBottom: '40px' }}>
            {/* If user is searching on this category page, show Category Search Results */}
            {searchQuery.trim() ? (
              <CategorySearchResults
                query={searchQuery.trim()}
                results={searchResults}
                loading={searching}
                onClear={() => setSearchQuery('')}
              />
            ) : itemsLoading ? (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '100px 0',
                  gap: '12px',
                  color: 'var(--text-muted, #94a3b8)',
                }}
              >
                <Loader2 size={28} className="spin" color="var(--g-accent, #6366f1)" />
                <span>Loading content...</span>
              </div>
            ) : subCategories.length > 0 ? (
              /* Subcategories Grid */
              <section>
                <div style={{ marginBottom: '32px' }}>
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      background: 'var(--primary-subtle, rgba(99, 102, 241, 0.15))',
                      border: '1px solid var(--g-accent, #6366f1)',
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
                    <FolderTree size={12} /> Subcategories
                  </div>
                  <h2 style={{ fontSize: 'clamp(1.5rem, 2.5vw, 2rem)', fontWeight: 800, margin: '0 0 6px', color: 'var(--text-primary)' }}>
                    Explore {category.name} Subcategories
                  </h2>
                  <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-muted)' }}>
                    Select a subcategory below to watch videos in this collection.
                  </p>
                </div>

                {/* Subcategories Grid (Part 11: 3 cards with sidebar, 4 cards without sidebar) */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: isWithSidebar
                      ? 'repeat(auto-fill, minmax(260px, 1fr))'
                      : 'repeat(auto-fill, minmax(240px, 1fr))',
                    gap: '20px',
                    marginBottom: '36px',
                  }}
                >
                  {subCategories.map((sub, idx) => (
                    <VideoCategoryCard
                      key={sub._id || idx}
                      category={{
                        ...sub,
                        parentCategory: { slug: category.slug, name: category.name },
                      }}
                      index={idx}
                    />
                  ))}
                </div>

                {/* Pagination (Part 13) */}
                {totalPages > 1 && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '20px' }}>
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage <= 1}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '8px 14px',
                        borderRadius: '8px',
                        border: '1px solid var(--border-color, rgba(255,255,255,0.1))',
                        background: 'var(--bg-card, rgba(255,255,255,0.05))',
                        color: currentPage <= 1 ? 'var(--text-muted)' : 'var(--text-primary)',
                        cursor: currentPage <= 1 ? 'not-allowed' : 'pointer',
                        fontSize: '13px',
                        opacity: currentPage <= 1 ? 0.5 : 1,
                      }}
                    >
                      <ChevronLeft size={14} /> Previous
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                      <button
                        key={p}
                        onClick={() => handlePageChange(p)}
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '8px',
                          border: '1px solid',
                          borderColor: currentPage === p ? 'var(--g-accent, #6366f1)' : 'var(--border-color, rgba(255,255,255,0.1))',
                          background: currentPage === p ? 'var(--accent-gradient, linear-gradient(135deg, #6366f1, #8b5cf6))' : 'var(--bg-card, rgba(255,255,255,0.05))',
                          color: currentPage === p ? '#fff' : 'var(--text-secondary)',
                          cursor: 'pointer',
                          fontWeight: currentPage === p ? 700 : 400,
                          fontSize: '13px',
                        }}
                      >
                        {p}
                      </button>
                    ))}
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage >= totalPages}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '8px 14px',
                        borderRadius: '8px',
                        border: '1px solid var(--border-color, rgba(255,255,255,0.1))',
                        background: 'var(--bg-card, rgba(255,255,255,0.05))',
                        color: currentPage >= totalPages ? 'var(--text-muted)' : 'var(--text-primary)',
                        cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer',
                        fontSize: '13px',
                        opacity: currentPage >= totalPages ? 0.5 : 1,
                      }}
                    >
                      Next <ChevronRight size={14} />
                    </button>
                  </div>
                )}
              </section>
            ) : directVideos.length > 0 ? (
              /* Fallback: Direct Videos assigned to parent category (Parts 27, 28) */
              <section>
                <div style={{ marginBottom: '32px' }}>
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      background: 'var(--primary-subtle, rgba(99, 102, 241, 0.15))',
                      border: '1px solid var(--g-accent, #6366f1)',
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
                    <Film size={12} /> Direct Videos
                  </div>
                  <h2 style={{ fontSize: 'clamp(1.5rem, 2.5vw, 2rem)', fontWeight: 800, margin: '0 0 6px', color: 'var(--text-primary)' }}>
                    Videos in {category.name}
                  </h2>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: isWithSidebar
                      ? 'repeat(auto-fill, minmax(260px, 1fr))'
                      : 'repeat(auto-fill, minmax(240px, 1fr))',
                    gap: '20px',
                    marginBottom: '36px',
                  }}
                >
                  {directVideos.map((video) => (
                    <VideoItemCard
                      key={video._id}
                      video={video}
                      parentSlug={category.slug}
                    />
                  ))}
                </div>
              </section>
            ) : (
              /* Empty state (Part 27) */
              <div
                style={{
                  textAlign: 'center',
                  padding: '80px 20px',
                  background: 'var(--bg-card, rgba(255,255,255,0.02))',
                  borderRadius: '16px',
                  border: '1px dashed var(--border-color, rgba(255,255,255,0.1))',
                }}
              >
                <FolderTree size={44} style={{ opacity: 0.3, marginBottom: '14px', color: 'var(--g-accent, #6366f1)' }} />
                <h3 style={{ margin: '0 0 8px', fontSize: '1.2rem', color: 'var(--text-primary)' }}>
                  No Subcategories Found
                </h3>
                <p style={{ margin: '0 0 20px', fontSize: '13px', color: 'var(--text-muted)' }}>
                  No subcategories or videos have been published in this category yet.
                </p>
                <button
                  onClick={() => navigate('/videos')}
                  className="button button-primary"
                  style={{ padding: '8px 20px' }}
                >
                  Browse All Categories
                </button>
              </div>
            )}
          </main>
        </div>
      </div>

      <style>{`
        @media (max-width: 960px) {
          .category-layout-grid {
            grid-template-columns: 1fr !important;
            gap: 30px !important;
          }
        }
      `}</style>
    </div>
  );
};

export default VideoParentCategoryPage;

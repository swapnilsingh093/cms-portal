import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { categoryAPI, videoAPI, postAPI, galleryAPI } from '../../services/api';
import VideoHeroBanner from '../../components/videos/VideoHeroBanner';
import { resolveBannerImage } from '../../utils/bannerHelper';
import VideoSidebar from '../../components/videos/VideoSidebar';
import VideoItemCard from '../../components/videos/VideoItemCard';
import VideoDetail from './VideoDetail';
import PageLoader from '../../components/common/PageLoader';
import { Loader2, Film, Play, Eye, Clock, ChevronLeft, ChevronRight, X, Search } from 'lucide-react';

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

const VideoSubcategoryPage = ({
  grandParentSlug: propGrandParentSlug,
  parentCategorySlug: propParentSlug,
  subcategorySlug: propSubSlug
}) => {
  const params = useParams();
  const grandParentSlug = propGrandParentSlug || params.grandParentSlug;
  const parentCategorySlug = propParentSlug || params.parentCategorySlug || (params.p3 ? params.p2 : params.p1);
  const subcategorySlug = propSubSlug || params.subcategorySlug || (params.p3 ? params.p3 : params.p2);
  const navigate = useNavigate();

  const [grandParentCategory, setGrandParentCategory] = useState(null);
  const [parentCategory, setParentCategory] = useState(null);
  const [subcategory, setSubcategory] = useState(null);
  const [isDirectVideo, setIsDirectVideo] = useState(false);
  const [videos, setVideos] = useState([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [videosLoading, setVideosLoading] = useState(false);

  // Pagination for videos
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Live on-page video search scoped strictly to this subcategory (Part 18)
  const [searchQuery, setSearchQuery] = useState('');

  // Sidebar dynamic widgets
  const [sidebarData, setSidebarData] = useState({
    latestVideos: [],
    mostViewedVideos: [],
    latestPosts: [],
    latestGalleries: [],
  });

  // 1. Fetch Parent & Subcategory details (or fallback to direct video)
  useEffect(() => {
    let isMounted = true;
    const fetchCategoryInfo = async () => {
      setPageLoading(true);
      setIsDirectVideo(false);
      try {
        const fetchPromises = [
          categoryAPI.getBySlug(parentCategorySlug, { type: 'video' }).catch(() => ({ category: null })),
          categoryAPI.getBySlug(subcategorySlug, { type: 'video' }).catch(() => ({ category: null })),
        ];
        if (grandParentSlug) {
          fetchPromises.push(categoryAPI.getBySlug(grandParentSlug, { type: 'video' }).catch(() => ({ category: null })));
        }

        const [parentRes, subRes, gpRes] = await Promise.all(fetchPromises);

        if (isMounted) {
          if (gpRes && gpRes.category) {
            setGrandParentCategory(gpRes.category);
          }
          setParentCategory(parentRes?.category || null);
          if (subRes && subRes.category) {
            setSubcategory(subRes.category);
          } else {
            // Check if subcategorySlug is actually a video assigned directly to parent category
            const vidRes = await videoAPI.getBySlug(subcategorySlug).catch(() => null);
            if (vidRes && (vidRes.video || vidRes._id)) {
              setIsDirectVideo(true);
            }
          }
        }
      } catch (err) {
        console.error('Error fetching subcategory context:', err);
      } finally {
        if (isMounted) setPageLoading(false);
      }
    };

    fetchCategoryInfo();
    return () => {
      isMounted = false;
    };
  }, [parentCategorySlug, subcategorySlug]);

  // 2. Fetch Videos assigned to this subcategory (with live search & pagination - Part 18, 19, 21)
  useEffect(() => {
    if (!subcategory) return;

    let isMounted = true;
    const fetchSubVideos = async () => {
      setVideosLoading(true);
      try {
        const params = {
          ...(grandParentSlug ? { childCategory: subcategory._id } : { subCategory: subcategory._id }),
          status: 'published',
          page: currentPage,
          limit: 12,
        };
        if (searchQuery.trim()) {
          params.search = searchQuery.trim();
        }

        const res = await videoAPI.getAll(params);
        if (isMounted) {
          setVideos(res.videos || []);
          setTotalPages(res.pagination?.pages || 1);
        }
      } catch (err) {
        console.error('Error fetching subcategory videos:', err);
      } finally {
        if (isMounted) setVideosLoading(false);
      }
    };

    const timeout = setTimeout(fetchSubVideos, searchQuery ? 200 : 0);
    return () => {
      isMounted = false;
      clearTimeout(timeout);
    };
  }, [subcategory, currentPage, searchQuery]);

  // 3. Fetch Sidebar Data (Latest 5 videos, Most viewed 2 videos, Latest posts, Latest galleries)
  useEffect(() => {
    if (!subcategory) return;

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
  }, [subcategory]);

  if (pageLoading) {
    return <PageLoader text="Loading subcategory..." />;
  }

  if (isDirectVideo) {
    return <VideoDetail slug={subcategorySlug} />;
  }

  if (!subcategory) {
    return (
      <div style={{ textAlign: 'center', padding: '120px 20px', maxWidth: '500px', margin: '0 auto' }}>
        <Film size={48} style={{ opacity: 0.3, marginBottom: '16px', color: 'var(--g-accent, #6366f1)' }} />
        <h2 style={{ marginBottom: '10px', color: 'var(--text-primary)' }}>Subcategory Not Found</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>
          The requested video subcategory does not exist or has been removed.
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

  const isWithSidebar = subcategory.layout !== 'without_sidebar';

  // Banner media configuration (inherits from parent if subcategory has none - Part 27)
  const bannerMediaType =
    subcategory.bannerType === 'video' && subcategory.bannerVideo
      ? 'video'
      : parentCategory?.bannerType === 'video' && parentCategory?.bannerVideo
      ? 'video'
      : 'image';

  const bannerMediaUrl =
    bannerMediaType === 'video'
      ? subcategory.bannerVideo || parentCategory?.bannerVideo
      : subcategory.bannerImage || resolveBannerImage(subcategory, subcategory.slug || subcategory.name) || parentCategory?.bannerImage || resolveBannerImage(parentCategory, parentCategory?.slug);

  const shortDesc =
    subcategory.shortDescription ||
    (subcategory.description
      ? subcategory.description.replace(/<[^>]*>?/gm, '').slice(0, 160) + '...'
      : '');

  const bannerConfig = {
    type: bannerMediaType,
    mediaUrl: bannerMediaUrl,
    height: subcategory.mediaHeight || '75vh',
    heading: subcategory.name,
    subheading: `${parentCategory ? parentCategory.name + ' • ' : ''}Subcategory`,
    description: shortDesc,
    overlayStrength: subcategory.overlayStrength !== undefined ? subcategory.overlayStrength : 0,
    bannerPosition: subcategory.bannerPosition || parentCategory?.bannerPosition || 'center',
    headingFontSize: '2rem',
    subheadingFontSize: '0.72rem',
    descriptionFontSize: subcategory.descriptionFontSize || '1rem',
    alignment: subcategory.alignment || 'left',
    verticalPosition: subcategory.verticalPosition || 'center',
    buttonText: subcategory.buttonText || '',
    buttonUrl: subcategory.buttonUrl || '',
    buttonFontSize: subcategory.buttonFontSize || '0.95rem',
  };

  const grandParentName = grandParentCategory?.name || grandParentSlug;
  const parentName = parentCategory?.name || 'Category';

  const breadcrumbs = [
    { label: 'Home', url: '/' },
    { label: 'Videos', url: '/videos' },
    ...(grandParentSlug ? [
      { label: grandParentName, url: `/videos/${grandParentSlug}` },
      { label: parentName, url: `/videos/${grandParentSlug}/${parentCategorySlug}` },
      { label: subcategory.name, url: `/videos/${grandParentSlug}/${parentCategorySlug}/${subcategorySlug}` }
    ] : [
      ...(parentCategory ? [{ label: parentCategory.name, url: `/videos/${parentCategory.slug}` }] : []),
      { label: subcategory.name }
    ])
  ];

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      const target = document.getElementById('sub-videos-section');
      if (target) target.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="video-subcategory-page" style={{ width: '100%' }}>
      {/* 1. Reusable Hero Banner (Parts 15, 16, 23) */}
      <VideoHeroBanner
        config={bannerConfig}
        breadcrumbs={breadcrumbs}
        showScrollIndicator={false}
      />

      {/* 2. Main Body with Left Sidebar & Video Grid (Parts 17, 18, 19, 20, 21) */}
      <div
        id="sub-videos-section"
        style={{
          maxWidth: '1400px',
          margin: '0 auto',
          padding: '40px 24px 80px',
          boxSizing: 'border-box',
        }}
      >
        <div
          className="subcategory-layout-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: isWithSidebar ? '320px minmax(0, 1fr)' : '1fr',
            gap: '40px',
          }}
        >
          {/* Left Sidebar (Part 17, 18, 24) */}
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
                  searchMode="videos"
                  searchPlaceholder={`Search ${subcategory.name} videos...`}
                />
              </div>
            </aside>
          )}

          {/* Main Column */}
          <main style={{ minWidth: 0, paddingBottom: '40px' }}>
            {/* Header / Search Status */}
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
                  <Film size={12} /> {subcategory.name} Videos
                </div>

                <h2 style={{ fontSize: 'clamp(1.5rem, 2.5vw, 2rem)', fontWeight: 800, margin: '0 0 6px', color: 'var(--text-primary)' }}>
                  {searchQuery.trim() ? `Search in ${subcategory.name}` : `All ${subcategory.name} Videos`}
                </h2>

                <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)' }}>
                  {videosLoading
                    ? 'Loading videos...'
                    : searchQuery.trim()
                    ? `Found ${videos.length} matching videos`
                    : `Showing ${videos.length} videos in this subcategory`}
                </p>
              </div>

              {searchQuery.trim() && (
                <button
                  onClick={() => setSearchQuery('')}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color, rgba(255, 255, 255, 0.12))',
                    background: 'rgba(255, 255, 255, 0.06)',
                    color: 'var(--text-primary)',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  <X size={14} /> Clear Search
                </button>
              )}
            </div>

            {/* Video Grid (Parts 19, 20) */}
            {videosLoading ? (
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
                <span>Loading video collection...</span>
              </div>
            ) : videos.length === 0 ? (
              /* Empty state (Part 27) */
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
                <h3 style={{ margin: '0 0 8px', fontSize: '1.2rem', color: 'var(--text-primary)' }}>
                  No videos found
                </h3>
                <p style={{ margin: '0 0 20px', fontSize: '13px', color: 'var(--text-muted)' }}>
                  {searchQuery.trim()
                    ? `No videos in ${subcategory.name} match "${searchQuery}".`
                    : 'No videos found in this category yet.'}
                </p>
                {searchQuery.trim() ? (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="button button-primary"
                    style={{ padding: '8px 20px' }}
                  >
                    View All Videos
                  </button>
                ) : (
                  <button
                    onClick={() => navigate(`/videos/${parentCategorySlug}`)}
                    className="button button-primary"
                    style={{ padding: '8px 20px' }}
                  >
                    Back to {parentCategory?.name || 'Category'}
                  </button>
                )}
              </div>
            ) : (
              /* Grid of Videos */
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
                {videos.map((video) => (
                  <VideoItemCard
                    key={video._id}
                    video={{
                      ...video,
                      category: video.category || { name: subcategory.name, slug: subcategorySlug },
                    }}
                    parentSlug={parentCategorySlug}
                    subcategorySlug={subcategorySlug}
                  />
                ))}
              </div>
            )}

            {/* Pagination (Part 21) */}
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
          </main>
        </div>
      </div>

      <style>{`
        @media (max-width: 960px) {
          .subcategory-layout-grid {
            grid-template-columns: 1fr !important;
            gap: 30px !important;
          }
        }
      `}</style>
    </div>
  );
};

export default VideoSubcategoryPage;

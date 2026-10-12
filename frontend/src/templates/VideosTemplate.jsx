import React, { useState, useEffect, useRef } from 'react';
import { categoryAPI, videoAPI, postAPI, galleryAPI } from '../services/api';
import VideoHeroBanner from '../components/videos/VideoHeroBanner';
import VideosCategorySection from '../components/videos/VideosCategorySection';
import CategorySearchResults from '../components/videos/CategorySearchResults';
import VideoSidebar from '../components/videos/VideoSidebar';
import { Loader2 } from 'lucide-react';
import { useSiteTheme } from '../context/SiteThemeContext';

const VideosTemplate = ({ pageData }) => {
  const { setPaletteOpen } = useSiteTheme();
  const config = pageData?.templateConfig || {};
  const bannerConfig = config.banner || {};
  const layoutConfig = config.layout || {};
  const categoriesConfig = config.categories || {};
  const sidebarConfig = config.sidebar || {};

  const perPage = Number(categoriesConfig.perPage) || 6;
  const isSidebarEnabled =
    layoutConfig.sidebar === 'with_sidebar' && sidebarConfig.enabled !== false;

  // Categories State & Pagination
  const [categories, setCategories] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  // Instant On-Page Category Search State (Part 4: ONLY searches categories & subcategories)
  const [searchQuery, setSearchQuery] = useState('');
  const [categorySearchResults, setCategorySearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const searchTimeoutRef = useRef(null);

  // Sidebar Data State
  const [sidebarData, setSidebarData] = useState({
    latestVideos: [],
    mostViewedVideos: [],
    latestPosts: [],
    latestGalleries: [],
  });
  const [sidebarLoading, setSidebarLoading] = useState(false);

  // 1. Fetch Root Video Categories (Parent Categories Only)
  useEffect(() => {
    let isMounted = true;
    const fetchCategories = async () => {
      setCategoriesLoading(true);
      try {
        const res = await categoryAPI.getAll({
          type: 'video',
          isRoot: 'true',
          page: currentPage,
          limit: perPage,
        });

        let fetched = res.categories || [];
        let pages = res.pagination?.pages || 1;

        // If no video categories found, try all root categories
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
        console.error('Error loading video categories:', err);
      } finally {
        if (isMounted) setCategoriesLoading(false);
      }
    };

    fetchCategories();
    return () => {
      isMounted = false;
    };
  }, [currentPage, perPage]);

  // 2. Fetch Sidebar Widgets Data
  useEffect(() => {
    if (!isSidebarEnabled) return;

    let isMounted = true;
    const fetchSidebarData = async () => {
      setSidebarLoading(true);
      try {
        const latestVidCount = Number(sidebarConfig.latestVideosCount) || 5;
        const mostViewedCount = Number(sidebarConfig.mostViewedVideosCount) || 2;
        const latestPostCount = Number(sidebarConfig.latestPostsCount) || 3;
        const latestGalCount = Number(sidebarConfig.latestGalleriesCount) || 3;

        const [latestVidsRes, mostViewedRes, postsRes, galsRes] = await Promise.all([
          videoAPI.getAll({ limit: latestVidCount, status: 'published', sort: '-createdAt' }).catch(() => ({ videos: [] })),
          videoAPI.getAll({ limit: mostViewedCount, status: 'published', sort: '-views' }).catch(() => ({ videos: [] })),
          postAPI.getAll({ limit: latestPostCount, status: 'published' }).catch(() => ({ posts: [] })),
          galleryAPI.getAll({ limit: latestGalCount, status: 'published' }).catch(() => ({ galleries: [] })),
        ]);

        if (isMounted) {
          setSidebarData({
            latestVideos: latestVidsRes.videos || [],
            mostViewedVideos: mostViewedRes.videos || [],
            latestPosts: postsRes.posts || [],
            latestGalleries: galsRes.galleries || [],
          });
        }
      } catch (err) {
        console.error('Error fetching sidebar data:', err);
      } finally {
        if (isMounted) setSidebarLoading(false);
      }
    };

    fetchSidebarData();
    return () => {
      isMounted = false;
    };
  }, [
    isSidebarEnabled,
    sidebarConfig.latestVideosCount,
    sidebarConfig.mostViewedVideosCount,
    sidebarConfig.latestPostsCount,
    sidebarConfig.latestGalleriesCount,
  ]);

  // 3. Immediate Live On-Page Search (ONLY Video Categories & Subcategories - Part 4)
  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (!trimmed) {
      setCategorySearchResults([]);
      setSearching(false);
      return;
    }

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    setSearching(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        // Query categories with type 'video' and search term
        const res = await categoryAPI.getAll({
          type: 'video',
          search: trimmed,
          limit: 30,
        });
        setCategorySearchResults(res.categories || []);
      } catch (err) {
        console.error('Error searching video categories:', err);
        setCategorySearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 200);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      const catElem = document.getElementById('categories');
      if (catElem) {
        catElem.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setCategorySearchResults([]);
    setSearching(false);
  };

  return (
    <div className="videos-template-root" style={{ width: '100%' }}>
      {/* 1. Full-Width Animated Video / Image Hero Banner with Zero Hardcoded Overlay */}
      <VideoHeroBanner config={bannerConfig} breadcrumbs={[{ label: "Home", url: "/" }, { label: "Videos" }]} showScrollIndicator={true} />

      {/* 2. Main Body: Container with Left Sidebar & Categories/Search on Right */}
      <div
        style={{
          maxWidth: '1400px',
          margin: '0 auto',
          padding: '40px 24px 80px',
          boxSizing: 'border-box',
        }}
      >
        <div
          className="videos-layout-container"
          style={{
            display: 'grid',
            gridTemplateColumns: isSidebarEnabled ? '320px minmax(0, 1fr)' : '1fr',
            gap: '40px',
          }}
        >
          {/* Sidebar Column: On the LEFT side */}
          {isSidebarEnabled && (
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
                  sidebarConfig={sidebarConfig}
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                  searchMode="categories"
                  searchPlaceholder="Search video categories..."
                  loading={sidebarLoading}
                />
              </div>
            </aside>
          )}

          {/* Main Column: On the RIGHT side */}
          <main style={{ minWidth: 0 }}>
            {/* If user is searching on main videos page, display Category search results */}
            {searchQuery.trim() ? (
              <CategorySearchResults
                query={searchQuery.trim()}
                results={categorySearchResults}
                loading={searching}
                onClear={handleClearSearch}
              />
            ) : categoriesLoading ? (
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
                <span>Loading categories...</span>
              </div>
            ) : (
              <VideosCategorySection
                categories={categories}
                config={categoriesConfig}
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            )}
          </main>
        </div>
      </div>

      <style>{`
        @media (max-width: 960px) {
          .videos-layout-container {
            grid-template-columns: 1fr !important;
            gap: 30px !important;
          }
        }
      `}</style>
    </div>
  );
};

export default VideosTemplate;

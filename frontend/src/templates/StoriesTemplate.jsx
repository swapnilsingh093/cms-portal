import React, { useState, useEffect, useRef } from "react";
import { categoryAPI, postAPI } from "../services/api";
import StoriesHeroBanner from "../components/stories/StoriesHeroBanner";
import StoriesCategorySection from "../components/stories/StoriesCategorySection";
import StoriesSidebar from "../components/stories/StoriesSidebar";
import StoryListing from "../components/stories/StoryListing";
import StoryPagination from "../components/stories/StoryPagination";
import { Loader2 } from "lucide-react";
import { useSiteTheme } from "../context/SiteThemeContext";
const StoriesTemplate = ({ pageData }) => {
  const { setPaletteOpen } = useSiteTheme();
  const config = pageData?.templateConfig || {};
  const bannerConfig = config.banner || {};
  const layoutConfig = config.layout || {};
  const categoriesConfig = config.categories || {};
  const sidebarConfig = config.sidebar || {};

  const perPage = Number(categoriesConfig.perPage) || 6;
  const isSidebarEnabled =
    layoutConfig.sidebar === "with_sidebar" && sidebarConfig.enabled !== false;

  // Categories State & Pagination
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Live On-Page Story Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchTotal, setSearchTotal] = useState(0);
  const [searchPage, setSearchPage] = useState(1);
  const [searchTotalPages, setSearchTotalPages] = useState(1);

  const searchDebounceRef = useRef(null);

  // Fetch Parent Categories
  useEffect(() => {
    let isMounted = true;
    const fetchCategories = async () => {
      setLoadingCategories(true);
      try {
        const res = await categoryAPI.getAll({
          isRoot: "true",
          type: "post",
          page: currentPage,
          limit: perPage
        });

        if (!isMounted) return;

        if (res.categories) {
          setCategories(res.categories);
          setTotalPages(Math.ceil((res.total || res.count || res.categories.length) / perPage) || 1);
        }
      } catch (err) {
        console.error("Error fetching parent story categories:", err);
      } finally {
        if (isMounted) setLoadingCategories(false);
      }
    };

    fetchCategories();
    return () => {
      isMounted = false;
    };
  }, [currentPage, perPage]);

  // Live Search Stories (Debounced)
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setSearchTotal(0);
      setSearchLoading(false);
      return;
    }

    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }

    searchDebounceRef.current = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const res = await postAPI.getAll({
          search: searchQuery.trim(),
          page: searchPage,
          limit: 10,
          status: "published"
        });
        setSearchResults(res.posts || []);
        const total = res.total || res.count || (res.posts ? res.posts.length : 0);
        setSearchTotal(total);
        setSearchTotalPages(Math.ceil(total / 10) || 1);
      } catch (err) {
        console.error("Error searching stories:", err);
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 300);

    return () => {
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
      }
    };
  }, [searchQuery, searchPage]);

  const handleClearSearch = () => {
    setSearchQuery("");
    setSearchResults([]);
    setSearchTotal(0);
    setSearchPage(1);
  };

  const isSearchActive = Boolean(searchQuery.trim());

  return (
    <div
      className="stories-template-container"
      style={{
        background: "var(--bg-main, #0b0f19)",
        minHeight: "100vh",
        color: "var(--text-primary, #f1f5f9)"
      }}
    >
      {/* Editorial Hero Banner */}
      <StoriesHeroBanner
        onOpenPalette={() => setPaletteOpen(true)}
        config={bannerConfig}
        breadcrumbs={[{ label: "Home", url: "/" }, { label: "Stories" }]}
        showScrollIndicator={true}
      />

      {/* Main Body Layout: Left Sidebar + Content */}
      <div
        style={{
          maxWidth: "1320px",
          margin: "0 auto",
          padding: "48px 24px 80px",
          display: "flex",
          flexDirection: "row",
          gap: "40px",
          alignItems: "flex-start",
          boxSizing: "border-box"
        }}
        className="stories-main-layout"
      >
        {/* Left Sidebar */}
        {isSidebarEnabled && (
          <StoriesSidebar
            searchQuery={searchQuery}
            onSearchChange={(q) => {
              setSearchQuery(q);
              setSearchPage(1);
            }}
            searchPlaceholder="Search stories..."
            isSearchActive={isSearchActive}
            onClearSearch={handleClearSearch}
            scopeLabel="All Stories"
            config={sidebarConfig}
          />
        )}

        {/* Content Column */}
        <main
          style={{
            flex: 1,
            minWidth: 0,
            width: "100%"
          }}
        >
          {isSearchActive ? (
            <div>
              <div
                style={{
                  borderBottom: "2px solid var(--border-color, rgba(255, 255, 255, 0.08))",
                  paddingBottom: "14px",
                  marginBottom: "24px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between"
                }}
              >
                <div>
                  <span
                    style={{
                      fontSize: "0.72rem",
                      fontWeight: 700,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      color: "var(--g-accent, #ea580c)"
                    }}
                  >
                    Search Filter
                  </span>
                  <h3
                    style={{
                      fontSize: "1.4rem",
                      fontWeight: 700,
                      margin: "2px 0 0 0",
                      fontFamily: "'Playfair Display', Georgia, serif, sans-serif"
                    }}
                  >
                    Results for &ldquo;{searchQuery}&rdquo;
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={handleClearSearch}
                  style={{
                    fontSize: "0.82rem",
                    padding: "6px 12px",
                    background: "var(--g-accent, rgba(234, 88, 12, 0.12))",
                    border: "1px solid var(--g-accent, rgba(234, 88, 12, 0.3))",
                    color: "var(--g-accent, #ea580c)",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontWeight: 600
                  }}
                >
                  Clear Search
                </button>
              </div>

              {searchLoading ? (
                <div
                  style={{
                    padding: "60px 0",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "10px",
                    color: "var(--text-muted, #94a3b8)"
                  }}
                >
                  <Loader2 size={24} className="spin" color="var(--g-accent, #ea580c)" />
                  <span>Searching stories...</span>
                </div>
              ) : (
                <>
                  <StoryListing
                    posts={searchResults}
                    title=""
                    total={searchTotal}
                    emptyMessage={`No stories matched "${searchQuery}"`}
                  />
                  {searchTotalPages > 1 && (
                    <StoryPagination
                      currentPage={searchPage}
                      totalPages={searchTotalPages}
                      onPageChange={(p) => setSearchPage(p)}
                      loading={searchLoading}
                    />
                  )}
                </>
              )}
            </div>
          ) : (
            <>
              {loadingCategories ? (
                <div
                  style={{
                    padding: "60px 0",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "10px",
                    color: "var(--text-muted, #94a3b8)"
                  }}
                >
                  <Loader2 size={24} className="spin" color="var(--g-accent, #ea580c)" />
                  <span>Loading editorial categories...</span>
                </div>
              ) : (
                <StoriesCategorySection
                  categories={categories}
                  heading={categoriesConfig.heading || "Editorial Columns & Categories"}
                  subtitle={categoriesConfig.subtitle || "Browse parent story categories to explore in-depth topics"}
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={(p) => setCurrentPage(p)}
                  loading={loadingCategories}
                />
              )}
            </>
          )}
        </main>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .stories-main-layout {
            flex-direction: column !important;
            gap: 32px !important;
          }
          .stories-left-sidebar {
            max-width: 100% !important;
          }
          .story-editorial-row {
            flex-direction: column !important;
            gap: 14px !important;
          }
          .story-row-thumb {
            width: 100% !important;
            height: 180px !important;
          }
        }
      `}</style>
    </div>
  );
};

export default StoriesTemplate;

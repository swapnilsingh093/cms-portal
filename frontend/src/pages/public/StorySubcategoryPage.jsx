import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { categoryAPI, postAPI } from "../../services/api";
import StoriesHeroBanner from "../../components/stories/StoriesHeroBanner";
import { resolveBannerImage } from "../../utils/bannerHelper";
import StoriesSidebar from "../../components/stories/StoriesSidebar";
import StoryListing from "../../components/stories/StoryListing";
import StoryPagination from "../../components/stories/StoryPagination";
import PostDetail from "./PostDetail";
import PageLoader from "../../components/common/PageLoader";
import { Loader2 } from "lucide-react";

const StorySubcategoryPage = ({
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
  const [isDirectPost, setIsDirectPost] = useState(false);
  const [posts, setPosts] = useState([]);
  const [pageLoading, setPageLoading] = useState(true);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Scoped Search State (Searching posts in this subcategory)
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchTotal, setSearchTotal] = useState(0);
  const [searchPage, setSearchPage] = useState(1);
  const [searchTotalPages, setSearchTotalPages] = useState(1);

  const searchDebounceRef = useRef(null);

  // 1. Fetch Parent Category & Subcategory Details (or fallback to direct post)
  useEffect(() => {
    let isMounted = true;
    const fetchCategories = async () => {
      setPageLoading(true);
      setIsDirectPost(false);
      try {
        const fetchPromises = [
          categoryAPI.getBySlug(parentCategorySlug).catch(() => null),
          categoryAPI.getBySlug(subcategorySlug).catch(() => null)
        ];
        if (grandParentSlug) {
          fetchPromises.push(categoryAPI.getBySlug(grandParentSlug).catch(() => null));
        }

        const [parentRes, subRes, grandParentRes] = await Promise.all(fetchPromises);

        if (!isMounted) return;

        if (grandParentRes && grandParentRes.category) {
          setGrandParentCategory(grandParentRes.category);
        }
        if (parentRes && parentRes.category) {
          setParentCategory(parentRes.category);
        }
        if (subRes && subRes.category) {
          setSubcategory(subRes.category);
        } else {
          // Check if subcategorySlug is actually a post directly under parent category
          const postRes = await postAPI.getBySlug(subcategorySlug).catch(() => null);
          if (postRes && (postRes.post || postRes._id)) {
            setIsDirectPost(true);
          }
        }
      } catch (err) {
        console.error("Error fetching story subcategory info:", err);
      } finally {
        if (isMounted) setPageLoading(false);
      }
    };

    fetchCategories();
    return () => {
      isMounted = false;
    };
  }, [parentCategorySlug, subcategorySlug]);

  // 2. Fetch Posts for this Subcategory
  useEffect(() => {
    if (!subcategory) return;

    let isMounted = true;
    const fetchSubcategoryPosts = async () => {
      try {
        const res = await postAPI.getAll({
          ...(grandParentSlug ? { childCategory: subcategory._id || subcategory.id } : { subCategory: subcategory._id || subcategory.id }),
          page: currentPage,
          limit: 8,
          status: "published",
          sort: "createdAt"
        });

        if (!isMounted) return;

        const rawPosts = res.posts || [];
        const sortedPosts = [...rawPosts].sort((a, b) => {
          if (a.order !== undefined && b.order !== undefined && a.order !== b.order) {
            return a.order - b.order;
          }
          return (a.title || '').localeCompare(b.title || '', undefined, { numeric: true, sensitivity: 'base' });
        });

        setPosts(sortedPosts);
        const total = res.total || res.count || (res.posts ? res.posts.length : 0);
        setTotalCount(total);
        setTotalPages(Math.ceil(total / 8) || 1);
      } catch (err) {
        console.error("Error fetching subcategory stories:", err);
      }
    };

    fetchSubcategoryPosts();
    return () => {
      isMounted = false;
    };
  }, [subcategory, currentPage]);

  // 3. Scoped Live Search (Stories within this Subcategory)
  useEffect(() => {
    if (!searchQuery.trim() || !subcategory) {
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
          subCategory: subcategory._id || subcategory.id,
          page: searchPage,
          limit: 8,
          status: "published"
        });
        setSearchResults(res.posts || []);
        const total = res.total || res.count || (res.posts ? res.posts.length : 0);
        setSearchTotal(total);
        setSearchTotalPages(Math.ceil(total / 8) || 1);
      } catch (err) {
        console.error("Error searching stories in subcategory:", err);
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
  }, [searchQuery, searchPage, subcategory]);

  const handleClearSearch = () => {
    setSearchQuery("");
    setSearchResults([]);
    setSearchTotal(0);
    setSearchPage(1);
  };

  const isSearchActive = Boolean(searchQuery.trim());

  if (pageLoading) {
    return <PageLoader text="Loading department stories..." />;
  }

  if (isDirectPost) {
    return <PostDetail slug={subcategorySlug} />;
  }

  if (!subcategory) {
    return (
      <div style={{ textAlign: "center", padding: "100px 24px" }}>
        <h2 style={{ fontSize: "1.8rem", color: "var(--text-primary, #f1f5f9)", marginBottom: "12px" }}>
          Subcategory Not Found
        </h2>
        <p style={{ color: "var(--text-muted, #94a3b8)", marginBottom: "24px" }}>
          The requested section could not be located.
        </p>
        <Link
          to={`/stories/${parentCategorySlug}`}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            background: 'var(--primary-subtle, #ea580c)',
            border: '1px solid var(--g-accent, #ea580c)',
            color: 'var(--g-accent, #ffffff)',
            padding: "10px 20px",
            borderRadius: "6px",
            textDecoration: "none",
            fontWeight: 600
          }}
        >
          &larr; Back to {parentCategory ? parentCategory.name : "Category"}
        </Link>
      </div>
    );
  }

  const grandParentName = grandParentCategory?.name || grandParentSlug;
  const parentName = parentCategory ? parentCategory.name : "Category";
  const parentUrl = grandParentSlug ? `/stories/${grandParentSlug}/${parentCategorySlug}` : `/stories/${parentCategorySlug}`;

  const bannerMediaUrl = subcategory.bannerType === 'video' && subcategory.bannerVideo
    ? subcategory.bannerVideo
    : subcategory.bannerImage || subcategory.bannerVideo || resolveBannerImage(subcategory, subcategory.slug || subcategory.name);

  const bannerConfig = {
    type: subcategory.bannerType || (subcategory.bannerVideo ? "video" : "image"),
    mediaUrl: bannerMediaUrl,
    height: subcategory.mediaHeight || '75vh',
    heading: subcategory.name,
    subheading: grandParentSlug ? `${grandParentName} / ${parentName}` : `${parentName} Department`,
    description: subcategory.shortDescription || subcategory.description || "",
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

  const breadcrumbs = [
    { label: "Home", url: "/" },
    { label: "Stories", url: "/stories" },
    ...(grandParentSlug ? [
      { label: grandParentName, url: `/stories/${grandParentSlug}` },
      { label: parentName, url: parentUrl },
      { label: subcategory.name }
    ] : [
      { label: parentName, url: parentUrl },
      { label: subcategory.name }
    ])
  ];

  return (
    <div
      className="story-subcategory-page"
      style={{
        background: "var(--bg-main, #0b0f19)",
        minHeight: "100vh",
        color: "var(--text-primary, #f1f5f9)"
      }}
    >
      {/* Editorial Subcategory Banner */}
      <StoriesHeroBanner
        config={bannerConfig}
        breadcrumbs={breadcrumbs}
        showScrollIndicator={false}
      />

      {/* Main Layout: Left Sidebar + Content */}
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
        <StoriesSidebar
          searchQuery={searchQuery}
          onSearchChange={(q) => {
            setSearchQuery(q);
            setSearchPage(1);
          }}
          searchPlaceholder={`Search in ${subcategory.name}...`}
          isSearchActive={isSearchActive}
          onClearSearch={handleClearSearch}
          scopeLabel={subcategory.name}
        />

        {/* Content Column */}
        <main style={{ flex: 1, minWidth: 0, width: "100%" }}>
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
                    Subcategory Search Filter
                  </span>
                  <h3
                    style={{
                      fontSize: "1.35rem",
                      fontWeight: 700,
                      margin: "2px 0 0 0",
                      fontFamily: "'Playfair Display', Georgia, serif, sans-serif"
                    }}
                  >
                    &ldquo;{searchQuery}&rdquo; in {subcategory.name}
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
                  <span>Searching stories in {subcategory.name}...</span>
                </div>
              ) : (
                <>
                  <StoryListing
                    posts={searchResults}
                    title=""
                    total={searchTotal}
                    emptyMessage={`No stories in ${subcategory.name} matched "${searchQuery}"`}
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
            <div>
              <StoryListing
                posts={posts}
                title={`${subcategory.name} Stories`}
                subtitle={`All published dispatches and articles in ${subcategory.name}`}
                total={totalCount}
                showLeadStory={currentPage === 1 && posts.length > 0}
                emptyMessage={`No stories have been posted in ${subcategory.name} yet.`}
              />

              {totalPages > 1 && (
                <StoryPagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={(p) => setCurrentPage(p)}
                />
              )}
            </div>
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

export default StorySubcategoryPage;

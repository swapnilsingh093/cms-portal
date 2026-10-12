import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { categoryAPI, postAPI } from "../../services/api";
import StoriesHeroBanner from "../../components/stories/StoriesHeroBanner";
import { resolveBannerImage } from "../../utils/bannerHelper";
import StoriesSidebar from "../../components/stories/StoriesSidebar";
import StoryCategoryCard from "../../components/stories/StoryCategoryCard";
import StoryListing from "../../components/stories/StoryListing";
import StoryPagination from "../../components/stories/StoryPagination";
import PostDetail from "./PostDetail";
import PageLoader from "../../components/common/PageLoader";
import { Loader2, BookOpen, Layers, ArrowRight, FileText } from "lucide-react";

const StoryParentCategoryPage = ({ categorySlug: propCategorySlug }) => {
  const params = useParams();
  const categorySlug = propCategorySlug || params.categorySlug || params.p1;
  const navigate = useNavigate();

  const [category, setCategory] = useState(null);
  const [subCategories, setSubCategories] = useState([]);
  const [directPosts, setDirectPosts] = useState([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [isLegacyPost, setIsLegacyPost] = useState(false);

  // Pagination for Subcategories or Direct Posts
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Scoped Search State (Searching posts in this category)
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchTotal, setSearchTotal] = useState(0);
  const [searchPage, setSearchPage] = useState(1);
  const [searchTotalPages, setSearchTotalPages] = useState(1);

  const searchDebounceRef = useRef(null);

  // 1. Fetch Parent Category Details (or check if it's a direct post slug)
  useEffect(() => {
    let isMounted = true;
    const fetchCategory = async () => {
      setPageLoading(true);
      setIsLegacyPost(false);
      try {
        const res = await categoryAPI.getBySlug(categorySlug);
        if (!isMounted) return;

        if (res.category) {
          // If this category actually has a parent, redirect to hierarchical subcategory URL
          if (res.category.parentCategory && res.category.parentCategory.slug) {
            navigate(`/stories/${res.category.parentCategory.slug}/${res.category.slug}`, { replace: true });
            return;
          }
          setCategory(res.category);
          setSubCategories(res.subCategories || res.category.subCategories || []);
        } else {
          // Check if it's a direct story/post slug
          const pRes = await postAPI.getBySlug(categorySlug).catch(() => null);
          if (pRes && pRes.post && isMounted) {
            setIsLegacyPost(true);
          } else {
            setCategory(null);
          }
        }
      } catch (err) {
        // Fallback check if it's a direct post slug
        try {
          const pRes = await postAPI.getBySlug(categorySlug).catch(() => null);
          if (pRes && pRes.post && isMounted) {
            setIsLegacyPost(true);
          } else {
            setCategory(null);
          }
        } catch {
          if (isMounted) setCategory(null);
        }
      } finally {
        if (isMounted) setPageLoading(false);
      }
    };

    fetchCategory();
    return () => {
      isMounted = false;
    };
  }, [categorySlug, navigate]);

  const hasSubCategories = subCategories && subCategories.length > 0;

  // 2. Fetch direct posts if this category has NO subcategories
  useEffect(() => {
    if (!category || hasSubCategories || isLegacyPost) return;

    let isMounted = true;
    const fetchDirectPosts = async () => {
      try {
        const res = await postAPI.getAll({
          category: category._id || category.id,
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

        setDirectPosts(sortedPosts);
        const total = res.total || res.count || (res.posts ? res.posts.length : 0);
        setTotalCount(total);
        setTotalPages(Math.ceil(total / 8) || 1);
      } catch (err) {
        console.error("Error fetching direct category stories:", err);
      }
    };

    fetchDirectPosts();
    return () => {
      isMounted = false;
    };
  }, [category, hasSubCategories, isLegacyPost, currentPage]);

  // 3. Scoped Live Search (Stories within this Category)
  useEffect(() => {
    if (!searchQuery.trim() || !category || isLegacyPost) {
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
          category: category._id || category.id,
          page: searchPage,
          limit: 8,
          status: "published"
        });
        setSearchResults(res.posts || []);
        const total = res.total || res.count || (res.posts ? res.posts.length : 0);
        setSearchTotal(total);
        setSearchTotalPages(Math.ceil(total / 8) || 1);
      } catch (err) {
        console.error("Error searching stories in category:", err);
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
  }, [searchQuery, searchPage, category, isLegacyPost]);

  const handleClearSearch = () => {
    setSearchQuery("");
    setSearchResults([]);
    setSearchTotal(0);
    setSearchPage(1);
  };

  const isSearchActive = Boolean(searchQuery.trim());

  if (pageLoading) {
    return <PageLoader text="Loading category stories..." />;
  }

  // If this resolved to a direct story slug, render PostDetail
  if (isLegacyPost) {
    return <PostDetail slug={categorySlug} />;
  }

  if (!category) {
    return (
      <div style={{ textAlign: "center", padding: "100px 24px", background: "var(--bg-main, #0b0f19)", minHeight: "60vh" }}>
        <h2 style={{ fontSize: "1.8rem", color: "var(--text-primary, #f1f5f9)", marginBottom: "12px" }}>
          Category Not Found
        </h2>
        <p style={{ color: "var(--text-muted, #94a3b8)", marginBottom: "24px" }}>
          The requested story category could not be located.
        </p>
        <Link
          to="/stories"
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
          &larr; Back to Stories
        </Link>
      </div>
    );
  }

  // Build Hero Banner Config from Category
  const bannerMediaUrl = category.bannerType === 'video' && category.bannerVideo
    ? category.bannerVideo
    : category.bannerImage || category.bannerVideo || resolveBannerImage(category, category.slug || category.name);

  const bannerConfig = {
    type: category.bannerType || (category.bannerVideo ? "video" : "image"),
    mediaUrl: bannerMediaUrl,
    height: category.mediaHeight || '75vh',
    heading: category.name,
    subheading: "Editorial Column & Field Reports",
    description: category.shortDescription || category.description || "",
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
    { label: "Home", url: "/" },
    { label: "Stories", url: "/stories" },
    { label: category.name }
  ];

  return (
    <div
      className="story-parent-category-page"
      style={{
        background: "var(--bg-main, #0b0f19)",
        minHeight: "100vh",
        color: "var(--text-primary, #f1f5f9)"
      }}
    >
      {/* Category Hero Banner */}
      <StoriesHeroBanner
        config={bannerConfig}
        breadcrumbs={breadcrumbs}
        showScrollIndicator={false}
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
        <StoriesSidebar
          searchQuery={searchQuery}
          onSearchChange={(q) => {
            setSearchQuery(q);
            setSearchPage(1);
          }}
          searchPlaceholder={`Search ${category.name} stories...`}
          isSearchActive={isSearchActive}
          onClearSearch={handleClearSearch}
          scopeLabel={category.name}
        />

        {/* Content Column */}
        <main style={{ flex: 1, minWidth: 0, width: "100%" }}>
          {isSearchActive ? (
            /* Scoped Search Results */
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
                    Category Search Filter
                  </span>
                  <h3
                    style={{
                      fontSize: "1.35rem",
                      fontWeight: 700,
                      margin: "2px 0 0 0",
                      fontFamily: "'Playfair Display', Georgia, serif, sans-serif"
                    }}
                  >
                    &ldquo;{searchQuery}&rdquo; in {category.name}
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
                  <span>Searching stories in {category.name}...</span>
                </div>
              ) : (
                <>
                  <StoryListing
                    posts={searchResults}
                    title=""
                    total={searchTotal}
                    emptyMessage={`No stories in ${category.name} matched "${searchQuery}"`}
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
          ) : hasSubCategories ? (
            /* 1. Show Subcategories when they exist using EXACT same StoryCategoryCard */
            <div>
              <div
                style={{
                  borderBottom: "2px solid var(--border-color, rgba(255, 255, 255, 0.08))",
                  paddingBottom: "14px",
                  marginBottom: "32px",
                  display: "flex",
                  alignItems: "baseline",
                  justifyContent: "space-between"
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      letterSpacing: "0.12em",
                      textTransform: "uppercase",
                      color: "var(--g-accent, #ea580c)",
                      marginBottom: "4px"
                    }}
                  >
                    Subtopics & Departments
                  </div>
                  <h2
                    style={{
                      fontSize: "clamp(1.5rem, 2.5vw, 1.9rem)",
                      fontWeight: 700,
                      color: "var(--text-primary, #f1f5f9)",
                      margin: 0,
                      fontFamily: "'Playfair Display', Georgia, serif, sans-serif"
                    }}
                  >
                    {category.name} Sections
                  </h2>
                </div>
                <span style={{ fontSize: "0.85rem", color: "var(--text-muted, #94a3b8)" }}>
                  {subCategories.length} {subCategories.length === 1 ? "Section" : "Sections"}
                </span>
              </div>

              {/* Subcategories Editorial Cards Grid - EXACT SAME LAYOUT AS CATEGORY PAGE */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                  gap: "24px"
                }}
              >
                {subCategories.map((subCat, idx) => (
                  <StoryCategoryCard
                    key={subCat._id || subCat.slug || idx}
                    category={subCat}
                    parentSlug={category.slug}
                    label="Subcategory & Department"
                    index={idx}
                  />
                ))}
              </div>
            </div>
          ) : (
            /* 2. Directly show assigned posts if NO subcategories exist */
            <div>
              <StoryListing
                posts={directPosts}
                title={`${category.name} Stories`}
                subtitle={`Browse published stories in ${category.name}`}
                total={totalCount}
                showLeadStory={currentPage === 1 && directPosts.length > 0}
                emptyMessage={`No stories published under ${category.name} yet.`}
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

export default StoryParentCategoryPage;

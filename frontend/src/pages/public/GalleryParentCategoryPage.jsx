import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { categoryAPI, galleryAPI } from "../../services/api";
import GalleryHeroBanner from "../../components/galleries/GalleryHeroBanner";
import GalleryCategoryCard from "../../components/galleries/GalleryCategoryCard";
import GalleryAlbumCard from "../../components/galleries/GalleryAlbumCard";
import GallerySidebar from "../../components/galleries/GallerySidebar";
import GalleryThemePalette from "../../components/galleries/GalleryThemePalette";
import GalleryDetail from "./GalleryDetail";
import PageLoader from "../../components/common/PageLoader";
import { GalleryThemeProvider } from "../../context/GalleryThemeContext";
import { useAuth } from "../../context/AuthContext";
import { Loader2, FolderTree, Images, Layers, Search, Sparkles, ArrowRight, Home, ShieldAlert, Edit3, Film } from "lucide-react";

const GalleryParentCategoryContent = ({ categorySlug: propCategorySlug }) => {
  const params = useParams();
  const categorySlug = propCategorySlug || params.categorySlug || params.p1;
  const navigate = useNavigate();
  const { user, isAdmin, isEditor } = useAuth();

  const [category, setCategory] = useState(null);
  const [inactiveCategory, setInactiveCategory] = useState(null);
  const [subCategories, setSubCategories] = useState([]);
  const [directAlbums, setDirectAlbums] = useState([]);
  const [allCategories, setAllCategories] = useState([]);
  const [latestAlbums, setLatestAlbums] = useState([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [isLegacyGallery, setIsLegacyGallery] = useState(false);

  // Scoped Search within Category
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const searchDebounceRef = useRef(null);

  // Global search when on inactive screen
  const [siteSearch, setSiteSearch] = useState("");
  const [siteSearchResults, setSiteSearchResults] = useState([]);
  const [siteSearching, setSiteSearching] = useState(false);

  // 1. Fetch category data
  useEffect(() => {
    let isMounted = true;
    const fetchCategoryData = async () => {
      setPageLoading(true);
      setIsLegacyGallery(false);
      try {
        let res = null;
        try {
          res = await categoryAPI.getBySlug(categorySlug);
        } catch (catErr) {
          // Not a category slug, check gallery slug below
        }

        if (!isMounted) return;

        if (res && res.category) {
          const isCategoryInactive = Boolean(
            res.isInactive || res.category.isActive === false || res.category.status === "inactive"
          );

          if (isCategoryInactive) {
            setInactiveCategory(res.category);
            setCategory(null);
          } else {
            // If this category has a parent, redirect to hierarchical subcategory URL
            if (res.category.parentCategory && res.category.parentCategory.slug) {
              navigate(`/galleries/${res.category.parentCategory.slug}/${res.category.slug}`, { replace: true });
              return;
            }
            setCategory(res.category);
            setInactiveCategory(null);
            setSubCategories(res.subCategories || res.category.subCategories || []);

            // Fetch direct albums in this category
            const albumsRes = await galleryAPI.getAll({
              category: res.category._id,
              status: "published",
              limit: 20,
            }).catch(() => ({ galleries: [] }));

            if (isMounted) setDirectAlbums(albumsRes.galleries || []);
          }
        } else {
          // Check if it is a single gallery slug
          const gRes = await galleryAPI.getBySlug(categorySlug).catch(() => null);
          if (gRes && gRes.gallery && isMounted) {
            setIsLegacyGallery(true);
            return;
          }
        }

        // Fetch sidebar auxiliary data
        const [allCatsRes, latestRes] = await Promise.all([
          categoryAPI.getAll({ type: "gallery", isRoot: "true" }).catch(() => ({ categories: [] })),
          galleryAPI.getAll({ status: "published", limit: 4, sort: "-createdAt" }).catch(() => ({ galleries: [] })),
        ]);

        if (isMounted) {
          setAllCategories(allCatsRes.categories || []);
          setLatestAlbums(latestRes.galleries || []);
        }
      } catch (err) {
        console.error("Error fetching gallery parent category:", err);
      } finally {
        if (isMounted) setPageLoading(false);
      }
    };

    fetchCategoryData();
    return () => {
      isMounted = false;
    };
  }, [categorySlug, navigate]);

  // Scoped live search
  useEffect(() => {
    const q = searchQuery.trim();
    if (!q || !category) {
      setSearchResults([]);
      setSearching(false);
      return;
    }

    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    setSearching(true);

    searchDebounceRef.current = setTimeout(async () => {
      try {
        const res = await galleryAPI.getAll({
          category: category._id,
          status: "published",
          search: q,
          limit: 20,
        });
        setSearchResults(res.galleries || []);
      } catch (err) {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 250);

    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, [searchQuery, category]);

  // Global search when on inactive screen
  useEffect(() => {
    if (!siteSearch.trim()) {
      setSiteSearchResults([]);
      setSiteSearching(false);
      return;
    }
    const t = setTimeout(async () => {
      setSiteSearching(true);
      try {
        const res = await galleryAPI.getAll({ status: "published", search: siteSearch.trim(), limit: 8 });
        setSiteSearchResults(res.galleries || []);
      } catch (e) {
        setSiteSearchResults([]);
      } finally {
        setSiteSearching(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [siteSearch]);

  // If this was a direct gallery slug instead of a category
  if (isLegacyGallery) {
    return <GalleryDetail slug={categorySlug} />;
  }

  if (pageLoading) {
    return <PageLoader text="Loading gallery category..." />;
  }

  if (!category) {
    const isActuallyInactive = Boolean(inactiveCategory);
    const catName = inactiveCategory?.name || categorySlug;

    return (
      <div
        className="galleries-inactive-page"
        style={{
          minHeight: "85vh",
          backgroundColor: "var(--bg-main, #0b0f19)",
          color: "var(--text-primary, #ffffff)",
          position: "relative",
          overflow: "hidden",
          paddingBottom: "80px"
        }}
      >
        {/* Subtle Ambient Glow */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: "50%",
            transform: "translateX(-50%)",
            width: "100%",
            maxWidth: "1100px",
            height: "480px",
            background: "radial-gradient(ellipse at top, rgba(99, 102, 241, 0.18) 0%, rgba(236, 72, 153, 0.08) 45%, transparent 70%)",
            pointerEvents: "none",
            zIndex: 0
          }}
        />

        <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "40px 24px", position: "relative", zIndex: 1 }}>
          {/* Breadcrumbs */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.85rem", color: "var(--text-muted, #94a3b8)", marginBottom: "32px" }}>
            <Link to="/" style={{ color: "var(--text-muted, #94a3b8)", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "4px" }}>
              <Home size={14} /> Home
            </Link>
            <span>/</span>
            <Link to="/galleries" style={{ color: "var(--text-muted, #94a3b8)", textDecoration: "none" }}>Galleries</Link>
            <span>/</span>
            <span style={{ color: "var(--text-primary, #ffffff)", fontWeight: 600 }}>{catName}</span>
          </div>

          {/* Hero Inactive Notification Card */}
          <div
            style={{
              background: "rgba(17, 24, 39, 0.82)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: "20px",
              padding: "48px 32px",
              textAlign: "center",
              boxShadow: "0 20px 50px rgba(0, 0, 0, 0.5)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              marginBottom: "48px",
              maxWidth: "880px",
              margin: "0 auto 48px"
            }}
          >
            {/* Status Badge */}
            <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: isActuallyInactive ? "rgba(245, 158, 11, 0.15)" : "rgba(99, 102, 241, 0.15)", border: `1px solid ${isActuallyInactive ? "rgba(245, 158, 11, 0.35)" : "rgba(99, 102, 241, 0.35)"}`, color: isActuallyInactive ? "#f59e0b" : "#818cf8", padding: "6px 16px", borderRadius: "999px", fontSize: "0.8rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "20px" }}>
              <ShieldAlert size={15} />
              <span>{isActuallyInactive ? "Category Temporarily Inactive" : "Category Unavailable"}</span>
            </div>

            <h1 style={{ fontSize: "2.4rem", fontWeight: 800, margin: "0 0 14px", color: "#ffffff", letterSpacing: "-0.5px" }}>
              {isActuallyInactive ? `"${catName}" is Currently Inactive` : `Photo Category Not Found`}
            </h1>

            <p style={{ color: "var(--text-muted, #94a3b8)", fontSize: "1.05rem", lineHeight: 1.6, maxWidth: "600px", margin: "0 auto 28px" }}>
              {isActuallyInactive
                ? `This photo collection is temporarily offline or undergoing curation. You can explore our other active categories or search through available photo albums below.`
                : `We could not find any active photo gallery category matching "${categorySlug}". Please check the URL or browse our active collections.`}
            </p>

            {/* Exclusive Admin Info & Direct Reactivate Link */}
            {(isAdmin || isEditor) && inactiveCategory && (
              <div
                style={{
                  background: "rgba(245, 158, 11, 0.08)",
                  border: "1px dashed rgba(245, 158, 11, 0.4)",
                  borderRadius: "12px",
                  padding: "16px 20px",
                  marginBottom: "28px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: "14px",
                  textAlign: "left"
                }}
              >
                <div>
                  <div style={{ color: "#fbbf24", fontWeight: 700, fontSize: "0.9rem", display: "flex", alignItems: "center", gap: "6px" }}>
                    <span>⚙️ Admin Notice: Category is set to "Inactive"</span>
                  </div>
                  <div style={{ color: "#cbd5e1", fontSize: "0.82rem", marginTop: "2px" }}>
                    Public visitors see this unavailable screen. You can reactivate it in the Category Manager anytime.
                  </div>
                </div>
                <Link
                  to={`/admin/categories/edit/${inactiveCategory._id}`}
                  className="button button-small"
                  style={{
                    background: "#f59e0b",
                    color: "#000",
                    fontWeight: 700,
                    textDecoration: "none",
                    padding: "8px 16px",
                    borderRadius: "8px",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    fontSize: "0.82rem"
                  }}
                >
                  <Edit3 size={14} /> Edit & Reactivate Category
                </Link>
              </div>
            )}

            {/* In-page live search */}
            <div style={{ maxWidth: "520px", margin: "0 auto 24px", position: "relative" }}>
              <input
                type="text"
                value={siteSearch}
                onChange={(e) => setSiteSearch(e.target.value)}
                placeholder="Search across all published photo albums..."
                style={{
                  width: "100%",
                  padding: "14px 18px 14px 44px",
                  borderRadius: "50px",
                  background: "rgba(255, 255, 255, 0.07)",
                  border: "1px solid rgba(255, 255, 255, 0.18)",
                  color: "#ffffff",
                  fontSize: "0.95rem",
                  outline: "none",
                  boxSizing: "border-box"
                }}
              />
              <Search
                size={18}
                style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted, #94a3b8)" }}
              />
              {siteSearching && (
                <Loader2 size={16} className="spin" style={{ position: "absolute", right: "16px", top: "50%", transform: "translateY(-50%)", color: "var(--primary-color, #6366f1)" }} />
              )}
            </div>

            {/* Action Buttons */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flexWrap: "wrap", gap: "12px" }}>
              <Link
                to="/galleries"
                className="button button-primary"
                style={{ padding: "12px 24px", borderRadius: "50px", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: "8px", textDecoration: "none" }}
              >
                <Images size={16} /> Browse All Galleries
              </Link>
              <Link
                to="/videos"
                className="button button-neutral"
                style={{ padding: "12px 24px", borderRadius: "50px", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "8px", textDecoration: "none" }}
              >
                <Film size={16} /> Explore Videos
              </Link>
            </div>
          </div>

          {/* Search Results Preview (if typed) */}
          {siteSearchResults.length > 0 && (
            <div style={{ marginBottom: "50px" }}>
              <h3 style={{ fontSize: "1.25rem", fontWeight: 700, margin: "0 0 18px", color: "#ffffff" }}>
                Matching Photo Albums ({siteSearchResults.length})
              </h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "20px" }}>
                {siteSearchResults.map((alb) => (
                  <GalleryAlbumCard key={alb._id} gallery={alb} />
                ))}
              </div>
            </div>
          )}

          {/* Active Categories Recommendations */}
          {allCategories.length > 0 && (
            <div style={{ marginBottom: "50px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "18px" }}>
                <div>
                  <h3 style={{ fontSize: "1.3rem", fontWeight: 800, margin: 0, color: "#ffffff", display: "flex", alignItems: "center", gap: "8px" }}>
                    <Sparkles size={18} color="var(--primary-color, #6366f1)" /> Active Photo Collections
                  </h3>
                  <p style={{ margin: "4px 0 0", color: "var(--text-muted, #94a3b8)", fontSize: "0.85rem" }}>
                    Explore these popular active categories
                  </p>
                </div>
                <Link to="/galleries" style={{ color: "var(--primary-color, #818cf8)", fontSize: "0.85rem", fontWeight: 600, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                  View All <ArrowRight size={14} />
                </Link>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "16px" }}>
                {allCategories.slice(0, 8).map((cat) => (
                  <Link
                    key={cat._id}
                    to={`/galleries/${cat.slug}`}
                    style={{
                      background: "rgba(17, 24, 39, 0.7)",
                      border: "1px solid rgba(255, 255, 255, 0.08)",
                      borderRadius: "14px",
                      padding: "16px",
                      textDecoration: "none",
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      transition: "all 0.2s ease"
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = "var(--primary-color, #6366f1)";
                      e.currentTarget.style.transform = "translateY(-2px)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.08)";
                      e.currentTarget.style.transform = "translateY(0)";
                    }}
                  >
                    <div
                      style={{
                        width: "44px",
                        height: "44px",
                        borderRadius: "10px",
                        background: cat.thumbnail ? `url(${cat.thumbnail}) center/cover` : "rgba(99, 102, 241, 0.2)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#ffffff",
                        flexShrink: 0
                      }}
                    >
                      {!cat.thumbnail && <FolderTree size={20} color="#818cf8" />}
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ color: "#ffffff", fontWeight: 700, fontSize: "0.95rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {cat.name}
                      </div>
                      <div style={{ color: "var(--text-muted, #94a3b8)", fontSize: "0.75rem", marginTop: "2px" }}>
                        {cat.itemCount || 0} Albums
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Latest Photo Albums */}
          {latestAlbums.length > 0 && (
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "18px" }}>
                <div>
                  <h3 style={{ fontSize: "1.3rem", fontWeight: 800, margin: 0, color: "#ffffff" }}>
                    Recent Photo Albums
                  </h3>
                  <p style={{ margin: "4px 0 0", color: "var(--text-muted, #94a3b8)", fontSize: "0.85rem" }}>
                    Freshly added photo shoots & series
                  </p>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "20px" }}>
                {latestAlbums.map((alb) => (
                  <GalleryAlbumCard key={alb._id} gallery={alb} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  const bannerMediaType = category.bannerType === 'video' && category.bannerVideo ? 'video' : 'image';
  const bannerMediaUrl =
    bannerMediaType === 'video'
      ? category.bannerVideo
      : category.bannerImage || category.banner || category.thumbnail;

  const bannerConfig = {
    type: bannerMediaType,
    mediaUrl: bannerMediaUrl,
    height: category.mediaHeight || '75vh',
    heading: category.name,
    subheading: "Photo Category",
    description: category.description || `Explore curated photo albums and series under ${category.name}.`,
    buttonText: category.buttonText || (subCategories.length > 0 ? "Explore Parts / Subcategories" : "View Albums"),
    buttonUrl: category.buttonUrl || "#category-content",
    headingFontSize: '2rem',
    subheadingFontSize: '0.72rem',
    descriptionFontSize: category.descriptionFontSize || '1rem',
    alignment: category.alignment || 'left',
    verticalPosition: category.verticalPosition || 'center',
    overlayStrength: category.overlayStrength !== undefined ? category.overlayStrength : 0,
    bannerPosition: category.bannerPosition || 'center',
    buttonFontSize: category.buttonFontSize || '0.95rem',
  };

  const breadcrumbs = [
    { label: "Home", url: "/" },
    { label: "Galleries", url: "/galleries" },
    { label: category.name, url: `/galleries/${category.slug}` },
  ];

  return (
    <div className="galleries-category-page" style={{ width: "100%" }}>
      {/* 1. Category Hero Banner */}
      <GalleryHeroBanner config={bannerConfig} breadcrumbs={breadcrumbs} />

      {/* 2. Main Layout */}
      <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "48px 24px 80px", boxSizing: "border-box" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "320px minmax(0, 1fr)",
            gap: "40px",
          }}
        >
          {/* Sidebar */}
          <div style={{ height: "100%" }}>
            <GallerySidebar
              categories={allCategories}
              latestAlbums={latestAlbums}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              activeCategorySlug={category.slug}
            />
          </div>

          {/* Main Content */}
          <main id="category-content" style={{ minWidth: 0 }}>
            {/* If searching */}
            {searchQuery.trim() ? (
              <section>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
                  <h2 style={{ fontSize: "1.4rem", fontWeight: 800, margin: 0, color: "var(--g-text, var(--text-primary, #ffffff))" }}>
                    Search in {category.name}: <span style={{ color: "var(--g-accent, #3b82f6)" }}>"{searchQuery}"</span>
                  </h2>
                </div>

                {searching ? (
                  <div style={{ textAlign: "center", padding: "60px 0" }}>
                    <Loader2 size={32} className="spin" color="var(--g-accent, #3b82f6)" />
                  </div>
                ) : searchResults.length > 0 ? (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "24px" }}>
                    {searchResults.map((alb) => (
                      <GalleryAlbumCard key={alb._id} gallery={alb} parentSlug={category.slug} />
                    ))}
                  </div>
                ) : (
                  <div style={{ textAlign: "center", padding: "50px", background: "var(--g-surface)", borderRadius: "16px" }}>
                    <p style={{ margin: 0, color: "var(--g-text-muted)" }}>No albums matching your search in this category.</p>
                  </div>
                )}
              </section>
            ) : (
              <>
                {/* Subcategories / Parts Grid (if present) */}
                {subCategories.length > 0 && (
                  <section style={{ marginBottom: "50px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "20px" }}>
                      <Layers size={18} color="var(--g-accent, #3b82f6)" />
                      <h2 style={{ fontSize: "1.5rem", fontWeight: 800, margin: 0, color: "var(--g-text, var(--text-primary, #ffffff))" }}>
                        Subcategories / Parts ({subCategories.length})
                      </h2>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "24px" }}>
                      {subCategories.map((sub) => (
                        <GalleryCategoryCard
                          key={sub._id || sub.slug}
                          category={{ ...sub, slug: `${category.slug}/${sub.slug}` }}
                        />
                      ))}
                    </div>
                  </section>
                )}

                {/* Direct Albums in this Category */}
                <section>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "20px" }}>
                    <Images size={18} color="var(--g-accent, #3b82f6)" />
                    <h2 style={{ fontSize: "1.5rem", fontWeight: 800, margin: 0, color: "var(--g-text, var(--text-primary, #ffffff))" }}>
                      {subCategories.length > 0 ? "Featured Albums in this Category" : "Photo Albums"} ({directAlbums.length})
                    </h2>
                  </div>

                  {directAlbums.length > 0 ? (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "24px" }}>
                      {directAlbums.map((alb) => (
                        <GalleryAlbumCard key={alb._id} gallery={alb} parentSlug={category.slug} />
                      ))}
                    </div>
                  ) : (
                    <div style={{ textAlign: "center", padding: "50px", background: "var(--g-surface)", borderRadius: "16px", border: "1px dashed var(--g-border)" }}>
                      <p style={{ margin: 0, color: "var(--g-text-muted)" }}>No direct photo albums published in this category yet.</p>
                    </div>
                  )}
                </section>
              </>
            )}
          </main>
        </div>
      </div>

      <GalleryThemePalette />
    </div>
  );
};

const GalleryParentCategoryPage = ({ categorySlug }) => {
  return (
    <GalleryThemeProvider>
      <GalleryParentCategoryContent categorySlug={categorySlug} />
    </GalleryThemeProvider>
  );
};

export default GalleryParentCategoryPage;

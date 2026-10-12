import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { galleryAPI } from "../../services/api";
import GalleryLightboxModal from "../../components/galleries/GalleryLightboxModal";
import GalleryThemePalette from "../../components/galleries/GalleryThemePalette";
import { GalleryThemeProvider, useGalleryTheme } from "../../context/GalleryThemeContext";
import SmartImage from "../../components/common/SmartImage";
import NotFoundPage from "./NotFoundPage";
import PageLoader from "../../components/common/PageLoader";
import { getItemPermalink, getCategoryPermalink } from "../../utils/permalinkHelper";
import { useAuth } from "../../context/AuthContext";
import {
  Images,
  Calendar,
  Eye,
  ChevronRight,
  ArrowLeft,
  Share2,
  Play,
  Palette,
  Maximize2,
  FolderTree,
  User,
  Check,
  LayoutGrid,
  Columns,
  Tag
} from "lucide-react";

const GalleryDetailContent = ({
  slug: propSlug,
  parentCategorySlug: propParentSlug,
  subcategorySlug: propSubSlug,
  childCategorySlug: propChildSlug
}) => {
  const params = useParams();
  const slug = propSlug || params.gallerySlug || params.p4 || (params.p3 && !params.p4 ? params.p3 : null) || params.slug;
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const isPrivileged = currentUser && ['admin', 'editor'].includes(currentUser.role);

  const { setPaletteOpen, paletteOpen } = useGalleryTheme();

  const [gallery, setGallery] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);
  const [copied, setCopied] = useState(false);
  const [relatedAlbums, setRelatedAlbums] = useState([]);
  const [viewMode, setViewMode] = useState("masonry"); // "masonry" | "grid"

  useEffect(() => {
    let isMounted = true;
    const fetchGallery = async () => {
      if (!slug) return;
      setLoading(true);
      try {
        const res = await galleryAPI.getBySlug(slug);
        if (!isMounted) return;

        if (res.gallery) {
          setGallery(res.gallery);
          if (typeof window !== 'undefined') {
            window.__CURRENT_CMS_EDIT_CONTEXT__ = {
              label: 'Edit Gallery',
              url: `/admin/gallery/edit/${res.gallery._id || res.gallery.slug}`
            };
            window.dispatchEvent(new Event('cms_edit_context_changed'));
          }

          // Fetch related albums in same category
          if (res.gallery.category?._id || res.gallery.category) {
            const catId = res.gallery.category?._id || res.gallery.category;
            galleryAPI.getAll({ category: catId, status: "published", limit: 4 })
              .then((relRes) => {
                if (isMounted) {
                  const filtered = (relRes.galleries || []).filter(g => g._id !== res.gallery._id);
                  setRelatedAlbums(filtered);
                }
              })
              .catch(() => {});
          }
        }
      } catch (err) {
        console.error("Error fetching gallery detail:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchGallery();
    return () => {
      isMounted = false;
    };
  }, [slug]);

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleStartSlideshow = () => {
    setSelectedPhotoIndex(0);
    setLightboxOpen(true);
  };

  const handlePhotoClick = (index) => {
    setSelectedPhotoIndex(index);
    setLightboxOpen(true);
  };

  if (loading) {
    return <PageLoader text="Loading photo gallery..." />;
  }

  if (!gallery || (gallery.status !== 'published' && !isPrivileged)) {
    return (
      <NotFoundPage
        type="gallery"
        title="Photo Gallery Not Found"
        message="The photo collection or album you requested does not exist or may be in draft."
      />
    );
  }

  const isSidebarEnabled = gallery.showSidebar !== false && gallery.layout !== "without_sidebar";
  const photos = gallery.images || [];
  // Extract all categories hierarchy & assigned categories:
  let rootParent = null;
  let mainCategory = null;
  let mainSubCategory = null;
  let mainChildCategory = null;

  if (gallery.category?.parentCategory) {
    if (gallery.category.parentCategory.parentCategory) {
      rootParent = gallery.category.parentCategory.parentCategory;
      mainCategory = gallery.category.parentCategory;
      mainSubCategory = gallery.category;
      mainChildCategory = gallery.subCategory || gallery.childCategory;
    } else {
      rootParent = gallery.category.parentCategory;
      mainCategory = gallery.category;
      mainSubCategory = gallery.subCategory || gallery.childCategory;
      mainChildCategory = gallery.subCategory && gallery.childCategory ? gallery.childCategory : null;
    }
  } else if (gallery.category) {
    rootParent = gallery.category;
    mainCategory = gallery.subCategory;
    mainChildCategory = gallery.childCategory;
  } else if (gallery.subCategory?.parentCategory) {
    rootParent = gallery.subCategory.parentCategory;
    mainCategory = gallery.subCategory;
    mainChildCategory = gallery.childCategory;
  } else if (gallery.subCategory) {
    rootParent = gallery.subCategory;
    mainChildCategory = gallery.childCategory;
  }

  // Build ordered breadcrumb items from chain
  const breadcrumbChain = [];
  const seenBreadcrumbIds = new Set();
  [rootParent, mainCategory, mainSubCategory, mainChildCategory].forEach((c) => {
    if (c && c.name && !seenBreadcrumbIds.has(String(c._id || c.slug || c.name))) {
      seenBreadcrumbIds.add(String(c._id || c.slug || c.name));
      breadcrumbChain.push(c);
    }
  });

  // Collect ALL assigned categories (from gallery.categories array + category + subCategory + childCategory)
  const allAssignedCategories = [];
  const seenCategoryIds = new Set();

  const addCat = (c) => {
    if (!c || !c.name) return;
    const key = String(c._id || c.slug || c.name);
    if (!seenCategoryIds.has(key)) {
      seenCategoryIds.add(key);
      allAssignedCategories.push(c);
    }
  };

  if (rootParent) addCat(rootParent);
  if (gallery.category) addCat(gallery.category);
  if (gallery.subCategory) addCat(gallery.subCategory);
  if (gallery.childCategory) addCat(gallery.childCategory);
  if (Array.isArray(gallery.categories)) {
    gallery.categories.forEach((catItem) => {
      if (catItem && typeof catItem === "object") {
        if (catItem.parentCategory) addCat(catItem.parentCategory);
        addCat(catItem);
      }
    });
  }

  const getCatUrl = (c, indexInChain = -1) => {
    if (!c) return "/galleries";
    if (indexInChain > 0 && breadcrumbChain[indexInChain - 1]) {
      const prev = breadcrumbChain[indexInChain - 1];
      return `/galleries/${prev.slug}/${c.slug}`;
    }
    return getCategoryPermalink(c, "gallery");
  };

  const categoryName = gallery.category?.name || rootParent?.name || "";
  const subcategoryName = gallery.subCategory?.name || mainSubCategory?.name;
  const childCategoryName = gallery.childCategory?.name || mainChildCategory?.name;

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    try {
      return new Date(dateStr).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return "";
    }
  };

  const resolveBannerImage = (item) => {
    if (!item) return "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1920&q=85";
    if (item.banner && item.banner.trim()) {
      return item.banner.startsWith("http") ? item.banner : `http://localhost:5001${item.banner}`;
    }
    if (item.coverImage && item.coverImage.trim()) {
      return item.coverImage.startsWith("http") ? item.coverImage : `http://localhost:5001${item.coverImage}`;
    }
    if (item.images && item.images.length > 0 && item.images[0].url) {
      const u = item.images[0].url;
      return u.startsWith("http") ? u : `http://localhost:5001${u}`;
    }
    return "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1920&q=85";
  };
  const bannerImage = resolveBannerImage(gallery);

  return (
    <div className="gallery-detail-page" style={{ width: "100%" }}>
      {/* Draft/Trash Preview Notice for Admins & Editors */}
      {gallery.status !== 'published' && isPrivileged && (
        <div
          style={{
            background: 'linear-gradient(90deg, #b45309, #d97706)',
            color: '#ffffff',
            padding: '10px 24px',
            textAlign: 'center',
            fontWeight: 600,
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
            position: 'sticky',
            top: 0,
            zIndex: 9999
          }}
        >
          <span>⚠️ PREVIEW MODE: This gallery is currently in <strong>{gallery.status.toUpperCase()}</strong> status and is NOT visible to public visitors.</span>
        </div>
      )}
      {/* 1. Header Hero Banner - Matching Single Videos and Stories Design */}
      <section
        style={{
          position: "relative",
          width: "100%",
          minHeight: gallery.screenOptions?.banner === false ? "260px" : gallery.bannerHeight || "440px",
          height: gallery.screenOptions?.banner === false ? "auto" : gallery.bannerHeight || "56vh",
          maxHeight: "750px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          overflow: "hidden",
        }}
      >
        {/* Background Banner Image with focal positioning */}
        {gallery.screenOptions?.banner !== false && bannerImage && (
        <img
          src={bannerImage}
          alt={gallery.title}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: gallery.bannerPosition ? (gallery.bannerPosition.includes('%') ? `center ${gallery.bannerPosition}` : gallery.bannerPosition) : "center center",
            zIndex: 1,
          }}
        />
        )}

        {/* Localized Bottom/Left Gradient Overlay for high-contrast readability without darkening entire image */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(180deg, rgba(11, 15, 25, 0.35) 0%, rgba(11, 15, 25, 0.76) 55%, rgba(11, 15, 25, 0.98) 100%)",
            zIndex: 2,
          }}
        />

        {/* Banner Content Container */}
        <div
          style={{
            position: "relative",
            zIndex: 3,
            maxWidth: isSidebarEnabled ? "1340px" : "1100px",
            width: "100%",
            margin: "0 auto",
            padding: "48px 24px 36px",
            boxSizing: "border-box",
            transition: "max-width 0.3s ease",
          }}
        >
          {/* Breadcrumbs: Home > Galleries > [Parent Category] > [Subcategory] */}
          <nav
            aria-label="Breadcrumb"
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              gap: "8px",
              fontSize: "0.85rem",
              color: "#cbd5e1",
              marginBottom: "14px",
            }}
          >
            <Link to="/" style={{ color: "#cbd5e1", textDecoration: "none" }}>Home</Link>
            <span style={{ color: "#94a3b8", opacity: 0.7 }}>&gt;</span>
            <Link to="/galleries" style={{ color: "#cbd5e1", textDecoration: "none" }}>Galleries</Link>
            {breadcrumbChain.map((crumb, idx) => (
              <React.Fragment key={crumb._id || crumb.slug || idx}>
                <span style={{ color: "#94a3b8", opacity: 0.7 }}>&gt;</span>
                <Link
                  to={getCatUrl(crumb, idx)}
                  style={{ color: "var(--g-accent, #10b981)", textDecoration: "none", fontWeight: 600 }}
                >
                  {crumb.name}
                </Link>
              </React.Fragment>
            ))}
            <span style={{ color: "#94a3b8", opacity: 0.7 }}>&gt;</span>
            <span style={{ color: "#ffffff", fontWeight: 500, maxWidth: "340px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {gallery.title}
            </span>
          </nav>

          {/* Badges: Category & Photos Count & Featured */}
          <div style={{ marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
            {allAssignedCategories.map((cat, idx) => (
              <Link
                key={cat._id || cat.slug || idx}
                to={getCategoryPermalink(cat, "gallery")}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "5px",
                  padding: "4px 12px",
                  borderRadius: "4px",
                  background: "var(--primary-subtle, rgba(16, 185, 129, 0.15))",
                  border: "1px solid var(--g-accent, #10b981)",
                  color: "var(--g-accent, #3b82f6)",
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  textDecoration: "none",
                  transition: "all 0.2s ease",
                }}
              >
                <Images size={12} /> {cat.name}
              </Link>
            ))}

            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                padding: "4px 10px",
                borderRadius: "4px",
                background: "rgba(255, 255, 255, 0.12)",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                color: "#f8fafc",
                fontSize: "0.75rem",
                fontWeight: 700,
              }}
            >
              {photos.length} High-Res Photos
            </span>

            {gallery.isFeatured && (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                  fontSize: "0.72rem",
                  fontWeight: 700,
                  color: "#fbbf24",
                  background: "rgba(251, 191, 36, 0.15)",
                  border: "1px solid rgba(251, 191, 36, 0.35)",
                  padding: "4px 9px",
                  borderRadius: "4px",
                }}
              >
                <Sparkles size={11} /> Featured
              </span>
            )}
          </div>

          {/* Gallery Title */}
          <h1
            style={{
              fontSize: "clamp(1.4rem, 2.2vw, 2rem)",
              fontWeight: 800,
              lineHeight: 1.28,
              color: "#ffffff",
              margin: "0 0 14px 0",
              maxWidth: "900px",
              letterSpacing: "-0.015em",
              fontFamily: "'Playfair Display', Georgia, serif, sans-serif",
              textShadow: "0 2px 10px rgba(0,0,0,0.5)",
            }}
          >
            {gallery.title}
          </h1>

          {/* Excerpt / Short Description */}
          {gallery.shortDescription && gallery.screenOptions?.['short-description'] !== false && (
            <p
              style={{
                fontSize: "clamp(1.02rem, 1.8vw, 1.2rem)",
                lineHeight: 1.6,
                color: "#e2e8f0",
                margin: "0 0 20px 0",
                maxWidth: "860px",
                fontStyle: "italic",
                textShadow: "0 1px 4px rgba(0,0,0,0.6)",
              }}
            >
              {gallery.shortDescription}
            </p>
          )}

          {/* Byline & Metadata row */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "14px",
              fontSize: "0.84rem",
              color: "#cbd5e1",
              paddingTop: "14px",
              borderTop: "1px solid rgba(255, 255, 255, 0.15)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "20px", flexWrap: "wrap" }}>
              {gallery.author?.name && (
                <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <User size={14} /> {gallery.author.name}
                </span>
              )}
              {gallery.createdAt && (
                <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <Calendar size={14} /> {formatDate(gallery.createdAt)}
                </span>
              )}
              {gallery.views !== undefined && (
                <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <Eye size={14} /> {gallery.views} views
                </span>
              )}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              {photos.length > 0 && (
                <button
                  type="button"
                  onClick={handleStartSlideshow}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "7px",
                    padding: "8px 18px",
                    borderRadius: "999px",
                    background: 'var(--primary-subtle, #10b981)',
            border: '1px solid var(--g-accent, #10b981)',
                    color: 'var(--g-accent, #ffffff)',
                    
                    fontSize: "0.85rem",
                    fontWeight: 700,
                    cursor: "pointer",
                    boxShadow: "0 4px 14px var(--primary-glow, var(--g-accent, rgba(16, 185, 129, 0.4)))",
                  }}
                >
                  <Play size={14} fill="currentColor" />
                  <span>Start Slideshow</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleShare}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "8px 16px",
                  borderRadius: "999px",
                  background: "rgba(255, 255, 255, 0.1)",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                  color: "#ffffff",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                {copied ? <Check size={14} /> : <Share2 size={14} />}
                <span>{copied ? "Link Copied!" : "Share"}</span>
              </button>

              <button
                type="button"
                onClick={() => setPaletteOpen(!paletteOpen)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "8px 14px",
                  borderRadius: "999px",
                  background: "rgba(255, 255, 255, 0.1)",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                  color: "#fff",
                  fontSize: "0.85rem",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                <Palette size={14} />
                <span>Colors</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Photo Gallery Showcase Area - STRICTLY NO CROPPING */}
      <main style={{ maxWidth: "1440px", margin: "0 auto", padding: "40px 24px 80px", boxSizing: "border-box" }}>
        <div
          className={`gallery-detail-layout ${isSidebarEnabled ? "with-sidebar" : "without-sidebar"}`}
          style={{
            display: "grid",
            gridTemplateColumns: isSidebarEnabled ? "minmax(0, 1fr) 330px" : "1fr",
            gap: "40px",
            alignItems: "start",
          }}
        >
          {/* Main Photo Stream Column */}
          <div style={{ minWidth: 0, width: "100%" }}>
            {/* Layout Switcher Bar */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "28px",
                paddingBottom: "14px",
                borderBottom: "1px solid var(--g-border, rgba(255, 255, 255, 0.08))",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--g-text, var(--text-primary, #ffffff))" }}>
                  High-Definition Photo Stream
                </span>
                <span style={{ fontSize: "0.8rem", color: "var(--g-text-muted, var(--text-secondary, #94a3b8))" }}>
                  (Click any photo to open interactive popup lightbox)
                </span>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <button
                  type="button"
                  onClick={() => setViewMode("masonry")}
                  title="Masonry Natural Orientation Flow"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "5px",
                    padding: "6px 12px",
                    borderRadius: "8px",
                    fontSize: "0.78rem",
                    fontWeight: 700,
                    border: "none",
                    background: viewMode === "masonry" ? "var(--primary-subtle, rgba(59, 130, 246, 0.15))" : "rgba(255,255,255,0.06)",
                    border: viewMode === "masonry" ? "1px solid var(--g-accent, #3b82f6)" : "1px solid transparent",
                    color: viewMode === "masonry" ? "var(--g-accent, #ffffff)" : "var(--g-text-muted, var(--text-secondary, #94a3b8))",
                    cursor: "pointer",
                  }}
                >
                  <Columns size={13} /> Natural Flow
                </button>

                <button
                  type="button"
                  onClick={() => setViewMode("grid")}
                  title="Consistent Grid View"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "5px",
                    padding: "6px 12px",
                    borderRadius: "8px",
                    fontSize: "0.78rem",
                    fontWeight: 700,
                    border: "none",
                    background: viewMode === "grid" ? "var(--primary-subtle, rgba(59, 130, 246, 0.15))" : "rgba(255,255,255,0.06)",
                    border: viewMode === "grid" ? "1px solid var(--g-accent, #3b82f6)" : "1px solid transparent",
                    color: viewMode === "grid" ? "var(--g-accent, #ffffff)" : "var(--g-text-muted, var(--text-secondary, #94a3b8))",
                    cursor: "pointer",
                  }}
                >
                  <LayoutGrid size={13} /> Grid
                </button>
              </div>
            </div>

            {/* Gallery Description */}
            {gallery.description && (
              <div 
                className="gallery-description-content"
                style={{
                  marginBottom: "32px",
                  color: "var(--g-text, var(--text-primary, #ffffff))",
                  lineHeight: "1.7",
                  fontSize: "1.05rem"
                }}
                dangerouslySetInnerHTML={{ __html: gallery.description }}
              />
            )}

            {/* The Photos Display: NO IMAGE IS CUT (Full Complete Dimensions) */}
            {photos.length > 0 ? (
              viewMode === "masonry" ? (
                /* Multi-column Masonry: Natural height of every photo is completely respected */
                <div
                  style={{
                    columnCount: isSidebarEnabled ? "auto" : "auto",
                    columnWidth: isSidebarEnabled ? "300px" : "320px",
                    columnGap: "24px",
                  }}
                >
                  {photos.map((photo, index) => {
                    const imgUrl = photo.url?.startsWith("http") ? photo.url : `http://localhost:5001${photo.url}`;
                    return (
                      <div
                        key={photo._id || index}
                        onClick={() => handlePhotoClick(index)}
                        style={{
                          breakInside: "avoid",
                          marginBottom: "24px",
                          background: "var(--g-surface, var(--bg-card, #151f33))",
                          border: "1px solid var(--g-border, var(--border-color, #22324f))",
                          borderRadius: "18px",
                          overflow: "hidden",
                          cursor: "pointer",
                          position: "relative",
                          boxShadow: "var(--g-shadow, 0 8px 24px rgba(0,0,0,0.3))",
                          transition: "transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease",
                        }}
                        className="gallery-photo-card"
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = "translateY(-4px)";
                          e.currentTarget.style.borderColor = "var(--g-accent, #3b82f6)";
                          e.currentTarget.style.boxShadow = "0 16px 36px var(--g-accent-glow, var(--g-accent, rgba(16, 185, 129, 0.35)))";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = "translateY(0)";
                          e.currentTarget.style.borderColor = "var(--g-border, var(--border-color, #22324f))";
                          e.currentTarget.style.boxShadow = "var(--g-shadow, 0 8px 24px rgba(0,0,0,0.3))";
                        }}
                      >
                        <div style={{ width: "100%", background: "#030712", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", padding: "6px" }}>
                          <img
                            src={imgUrl}
                            alt={photo.title || photo.caption || `Photo ${index + 1}`}
                            loading="lazy"
                            style={{
                              width: "100%",
                              height: "auto",
                              maxHeight: "600px",
                              objectFit: "contain",
                              display: "block",
                              borderRadius: "12px",
                            }}
                          />
                        </div>

                        {/* Hover Overlay Hint */}
                        <div
                          className="photo-overlay"
                          style={{
                            position: "absolute",
                            inset: 0,
                            background: "rgba(0, 0, 0, 0.45)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            opacity: 0,
                            transition: "opacity 0.2s ease",
                            pointerEvents: "none",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                              padding: "10px 18px",
                              borderRadius: "999px",
                              background: 'var(--primary-subtle, #3b82f6)',
            border: '1px solid var(--g-accent, #3b82f6)',
                              color: "var(--g-accent-text, #ffffff)",
                              fontSize: "0.82rem",
                              fontWeight: 800,
                            }}
                          >
                            <Maximize2 size={15} /> Click to Expand
                          </div>
                        </div>

                        {/* Photo Caption / Title */}
                        {(photo.title || photo.caption) && (
                          <div style={{ padding: "14px 18px", borderTop: "1px solid var(--g-border, var(--g-accent, rgba(16, 185, 129, 0.15)))" }}>
                            {photo.title && (
                              <div style={{ fontWeight: 700, fontSize: "0.92rem", color: "var(--g-text, var(--text-primary, #ffffff))", marginBottom: "4px" }}>
                                {photo.title}
                              </div>
                            )}
                            {photo.caption && (
                              <div style={{ fontSize: "0.8rem", color: "var(--g-text-muted, var(--text-secondary, #94a3b8))", lineHeight: 1.5 }}>
                                {photo.caption}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* Grid Mode: Consistent frame height without cropping image */
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: isSidebarEnabled ? "repeat(auto-fill, minmax(260px, 1fr))" : "repeat(auto-fill, minmax(280px, 1fr))",
                    gap: "24px",
                  }}
                >
                  {photos.map((photo, index) => {
                    const imgUrl = photo.url?.startsWith("http") ? photo.url : `http://localhost:5001${photo.url}`;
                    return (
                      <div
                        key={photo._id || index}
                        onClick={() => handlePhotoClick(index)}
                        style={{
                          background: "var(--g-surface, var(--bg-card, #151f33))",
                          border: "1px solid var(--g-border, var(--border-color, #22324f))",
                          borderRadius: "18px",
                          overflow: "hidden",
                          cursor: "pointer",
                          display: "flex",
                          flexDirection: "column",
                          boxShadow: "var(--g-shadow, 0 8px 24px rgba(0,0,0,0.3))",
                          transition: "transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = "translateY(-4px)";
                          e.currentTarget.style.borderColor = "var(--g-accent, #3b82f6)";
                          e.currentTarget.style.boxShadow = "0 16px 36px var(--g-accent-glow, var(--g-accent, rgba(16, 185, 129, 0.35)))";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = "translateY(0)";
                          e.currentTarget.style.borderColor = "var(--g-border, var(--border-color, #22324f))";
                          e.currentTarget.style.boxShadow = "var(--g-shadow, 0 8px 24px rgba(0,0,0,0.3))";
                        }}
                      >
                        <div
                          style={{
                            position: "relative",
                            width: "100%",
                            height: "260px",
                            background: "#030712",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            overflow: "hidden",
                            padding: "8px",
                          }}
                        >
                          <img
                            src={imgUrl}
                            alt={photo.title || photo.caption || `Photo ${index + 1}`}
                            style={{
                              maxWidth: "100%",
                              maxHeight: "100%",
                              objectFit: "contain",
                              borderRadius: "8px",
                            }}
                          />
                          <div
                            style={{
                              position: "absolute",
                              top: "12px",
                              left: "12px",
                              background: "rgba(0,0,0,0.75)",
                              color: "#fff",
                              fontSize: "0.72rem",
                              fontWeight: 800,
                              padding: "2px 7px",
                              borderRadius: "4px",
                            }}
                          >
                            #{index + 1}
                          </div>
                        </div>

                        {(photo.title || photo.caption) && (
                          <div style={{ padding: "12px 16px" }}>
                            {photo.title && <div style={{ fontWeight: 700, fontSize: "0.88rem", color: "var(--g-text, #fff)" }}>{photo.title}</div>}
                            {photo.caption && <div style={{ fontSize: "0.78rem", color: "var(--g-text-muted, var(--text-secondary, #94a3b8))" }}>{photo.caption}</div>}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )
            ) : (
              <div style={{ textAlign: "center", padding: "80px 20px", background: "var(--g-surface, var(--bg-card, #151f33))", borderRadius: "18px", border: "1px dashed var(--g-border, var(--g-accent, rgba(16, 185, 129, 0.3)))" }}>
                <Images size={48} color="var(--g-accent, #3b82f6)" style={{ opacity: 0.5, marginBottom: "14px" }} />
                <h3 style={{ margin: "0 0 8px", fontSize: "1.2rem", color: "var(--g-text, #fff)" }}>No Photos in this Album</h3>
                <p style={{ margin: 0, color: "var(--g-text-muted, var(--text-secondary, #94a3b8))" }}>Photos will be uploaded soon. Stay tuned!</p>
              </div>
            )}

            {/* Advanced Attributes & Tags */}
            {gallery.screenOptions?.tags !== false && (gallery.tags?.length > 0 || gallery.age?.length > 0 || gallery.maritalStatus) && (
              <div
                style={{
                  marginTop: "40px",
                  paddingTop: "24px",
                  borderTop: "1px solid rgba(255, 255, 255, 0.08)",
                  display: "flex",
                  flexWrap: "wrap",
                  alignItems: "center",
                  gap: "8px"
                }}
              >
                <span style={{ fontSize: "0.78rem", color: "var(--text-muted, #94a3b8)", fontWeight: 600, display: "flex", alignItems: "center", gap: "6px", marginRight: '8px' }}>
                  <Tag size={12} /> Tags & Attributes:
                </span>
                
                {/* Tags */}
                {gallery.tags?.map((tag, idx) => (
                  <span
                    key={'tag-'+idx}
                    style={{
                      background: "rgba(255, 255, 255, 0.04)",
                      border: "1px solid rgba(255, 255, 255, 0.08)",
                      borderRadius: "4px",
                      padding: "3px 10px",
                      fontSize: "0.76rem",
                      color: "var(--text-muted, #94a3b8)"
                    }}
                  >
                    #{tag}
                  </span>
                ))}

                {/* Age Tags */}
                {gallery.age?.map((ageNum, idx) => (
                  <span
                    key={'age-'+idx}
                    style={{
                      background: "rgba(99, 102, 241, 0.1)",
                      border: "1px solid rgba(99, 102, 241, 0.3)",
                      borderRadius: "4px",
                      padding: "3px 10px",
                      fontSize: "0.76rem",
                      color: "#a5b4fc"
                    }}
                  >
                    Age {ageNum}
                  </span>
                ))}

                {/* Marital Status Tag */}
                {gallery.maritalStatus && (
                  <span
                    style={{
                      background: "rgba(236, 72, 153, 0.1)",
                      border: "1px solid rgba(236, 72, 153, 0.3)",
                      borderRadius: "4px",
                      padding: "3px 10px",
                      fontSize: "0.76rem",
                      color: "#f472b6",
                      textTransform: 'capitalize'
                    }}
                  >
                    {gallery.maritalStatus}
                  </span>
                )}
              </div>
            )}

            {/* If Sidebar is DISABLED: Render related albums underneath in a wide responsive 4-column grid */}
            {!isSidebarEnabled && relatedAlbums.length > 0 && (
              <section style={{ marginTop: "70px", paddingTop: "40px", borderTop: "1px solid var(--g-border, rgba(255, 255, 255, 0.08))" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "24px" }}>
                  <Images size={18} color="var(--g-accent, #3b82f6)" />
                  <h2 style={{ fontSize: "1.5rem", fontWeight: 800, margin: 0, color: "var(--g-text, var(--text-primary, #ffffff))" }}>
                    More Albums in {categoryName}
                  </h2>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "24px" }}>
                  {relatedAlbums.map((rel) => (
                    <Link
                      key={rel._id}
                      to={getItemPermalink(rel, 'gallery')}
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        background: "var(--g-surface, var(--bg-card, #151f33))",
                        border: "1px solid var(--g-border, var(--border-color, #22324f))",
                        borderRadius: "16px",
                        overflow: "hidden",
                        textDecoration: "none",
                        color: "inherit",
                        boxShadow: "var(--g-shadow, 0 8px 24px rgba(0,0,0,0.3))",
                        transition: "transform 0.2s ease",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-4px)")}
                      onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
                    >
                      <div style={{ position: "relative", width: "100%", paddingTop: "58%", background: "#030712" }}>
                        <SmartImage
                          src={
                            rel.coverImage?.startsWith("http")
                              ? rel.coverImage
                              : rel.coverImage
                              ? `http://localhost:5001${rel.coverImage}`
                              : "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80"
                          }
                          alt={rel.title}
                          style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
                        />
                      </div>
                      <div style={{ padding: "16px" }}>
                        <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--g-text, var(--text-primary, #ffffff))", marginBottom: "4px" }}>
                          {rel.title}
                        </div>
                        <div style={{ fontSize: "0.75rem", color: "var(--g-accent, #3b82f6)", display: "flex", alignItems: "center", gap: "4px" }}>
                          <Images size={12} /> {rel.images?.length || 0} Photos
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Single Gallery Sidebar (When Enabled) */}
          {isSidebarEnabled && (
            <aside
              className="gallery-single-sidebar"
              style={{
                minWidth: 0,
                position: "sticky",
                top: "calc(var(--wp-admin-bar-height, 0px) + 88px)",
                alignSelf: "flex-start",
                zIndex: 10,
                display: "flex",
                flexDirection: "column",
                gap: "24px",
              }}
            >
              {/* 1. Quick Info Postbox */}
              <div
                style={{
                  background: "var(--g-surface, var(--bg-card, #151f33))",
                  border: "1px solid var(--g-border, var(--border-color, #22324f))",
                  borderRadius: "18px",
                  padding: "20px",
                  boxShadow: "var(--g-shadow, 0 8px 24px rgba(0,0,0,0.3))",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "7px",
                    fontSize: "0.8rem",
                    fontWeight: 800,
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    color: "var(--g-accent, #3b82f6)",
                    marginBottom: "16px",
                  }}
                >
                  <Images size={14} /> Album Details
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "0.86rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ color: "var(--g-text-muted, var(--text-secondary, #94a3b8))" }}>Total Photos</span>
                    <span style={{ fontWeight: 800, color: "var(--g-accent, #3b82f6)" }}>{photos.length}</span>
                  </div>
                  {rootParent && (
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ color: "var(--g-text-muted, var(--text-secondary, #94a3b8))" }}>Parent Category</span>
                      <Link
                        to={`/galleries/${rootParent.slug}`}
                        style={{ color: "var(--g-accent, #3b82f6)", fontWeight: 700, textDecoration: "none" }}
                      >
                        {rootParent.name}
                      </Link>
                    </div>
                  )}
                  {mainCategory && mainCategory.slug !== rootParent?.slug && (
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ color: "var(--g-text-muted, var(--text-secondary, #94a3b8))" }}>Category</span>
                      <Link
                        to={getCatUrl(mainCategory, 1)}
                        style={{ color: "var(--g-text, var(--text-primary, #ffffff))", fontWeight: 700, textDecoration: "none" }}
                      >
                        {mainCategory.name}
                      </Link>
                    </div>
                  )}
                  {mainSubCategory && mainSubCategory.slug !== mainCategory?.slug && (
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ color: "var(--g-text-muted, var(--text-secondary, #94a3b8))" }}>Subcategory</span>
                      <Link
                        to={getCatUrl(mainSubCategory, 2)}
                        style={{ color: "var(--g-text, var(--text-primary, #ffffff))", fontWeight: 700, textDecoration: "none" }}
                      >
                        {mainSubCategory.name}
                      </Link>
                    </div>
                  )}
                  {mainChildCategory && (
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ color: "var(--g-text-muted, var(--text-secondary, #94a3b8))" }}>Child Category</span>
                      <Link
                        to={getCatUrl(mainChildCategory, 3)}
                        style={{ color: "var(--g-text, var(--text-primary, #ffffff))", fontWeight: 700, textDecoration: "none" }}
                      >
                        {mainChildCategory.name}
                      </Link>
                    </div>
                  )}
                  {allAssignedCategories.length > 1 && (
                    <div style={{ marginTop: "10px", paddingTop: "10px", borderTop: "1px solid var(--g-border, rgba(255, 255, 255, 0.08))" }}>
                      <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--g-text-muted, #94a3b8)", textTransform: "uppercase", marginBottom: "8px", letterSpacing: "0.05em" }}>
                        All Assigned Categories
                      </div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                        {allAssignedCategories.map((c, idx) => (
                          <Link
                            key={c._id || c.slug || idx}
                            to={getCategoryPermalink(c, "gallery")}
                            style={{
                              fontSize: "0.75rem",
                              fontWeight: 600,
                              padding: "3px 8px",
                              borderRadius: "4px",
                              background: "rgba(255, 255, 255, 0.06)",
                              border: "1px solid rgba(255, 255, 255, 0.12)",
                              color: "var(--g-accent, #3b82f6)",
                              textDecoration: "none",
                            }}
                          >
                            {c.name}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                  {gallery.createdAt && (
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ color: "var(--g-text-muted, var(--text-secondary, #94a3b8))" }}>Date Added</span>
                      <span style={{ color: "var(--g-text, var(--text-primary, #ffffff))" }}>{formatDate(gallery.createdAt)}</span>
                    </div>
                  )}
                  {gallery.author?.name && (
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ color: "var(--g-text-muted, var(--text-secondary, #94a3b8))" }}>Photographer</span>
                      <span style={{ color: "var(--g-text, var(--text-primary, #ffffff))", fontWeight: 700 }}>{gallery.author.name}</span>
                    </div>
                  )}
                </div>

                {photos.length > 0 && (
                  <button
                    type="button"
                    onClick={handleStartSlideshow}
                    style={{
                      width: "100%",
                      marginTop: "18px",
                      padding: "10px",
                      borderRadius: "10px",
                      background: 'var(--primary-subtle, rgba(16, 185, 129, 0.15))',
                      border: "1px solid var(--g-accent, rgba(16, 185, 129, 0.3))",
                      color: "var(--g-accent, #ffffff)",
                      fontSize: "0.85rem",
                      fontWeight: 800,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px",
                      boxShadow: "0 4px 14px var(--g-accent-glow, var(--g-accent, rgba(16, 185, 129, 0.35)))",
                    }}
                  >
                    <Play size={14} fill="currentColor" /> Play Slideshow
                  </button>
                )}
              </div>

              {/* 2. More Albums in Category */}
              {relatedAlbums.length > 0 && (
                <div
                  style={{
                    background: "var(--g-surface, var(--bg-card, #151f33))",
                    border: "1px solid var(--g-border, var(--border-color, #22324f))",
                    borderRadius: "18px",
                    padding: "20px",
                    boxShadow: "var(--g-shadow, 0 8px 24px rgba(0,0,0,0.3))",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "7px",
                      fontSize: "0.8rem",
                      fontWeight: 800,
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                      color: "var(--g-accent, #3b82f6)",
                      marginBottom: "14px",
                    }}
                  >
                    <Images size={14} /> More in {categoryName}
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    {relatedAlbums.slice(0, 4).map((rel) => {
                      const cover = rel.coverImage || rel.banner || (rel.images && rel.images[0]?.url) || "";
                      const fullCover = cover.startsWith("http") ? cover : `http://localhost:5001${cover}`;
                      return (
                        <Link
                          key={rel._id}
                          to={`/galleries/${rel.slug}`}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "12px",
                            textDecoration: "none",
                            color: "inherit",
                            padding: "6px",
                            borderRadius: "10px",
                            transition: "background 0.15s ease",
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)")}
                          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                        >
                          <div
                            style={{
                              width: "60px",
                              height: "46px",
                              borderRadius: "8px",
                              overflow: "hidden",
                              background: "#030712",
                              flexShrink: 0,
                            }}
                          >
                            <img
                              src={fullCover}
                              alt={rel.title}
                              style={{ width: "100%", height: "100%", objectFit: "cover" }}
                            />
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div
                              style={{
                                fontSize: "0.85rem",
                                fontWeight: 700,
                                color: "var(--g-text, var(--text-primary, #ffffff))",
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                              }}
                            >
                              {rel.title}
                            </div>
                            <div style={{ fontSize: "0.72rem", color: "var(--g-accent, #3b82f6)", marginTop: "2px" }}>
                              {rel.images?.length || 0} Photos
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 3. Color Theme Quick Widget */}
              <div
                style={{
                  background: "var(--primary-subtle, rgba(16, 185, 129, 0.15))",
                  border: "1px dashed var(--g-accent, #3b82f6)",
                  borderRadius: "18px",
                  padding: "16px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  color: "var(--g-text, var(--text-primary, #ffffff))",
                }}
              >
                <div>
                  <div style={{ fontWeight: 800, fontSize: "0.85rem" }}>Theme Styling</div>
                  <div style={{ fontSize: "0.72rem", color: "var(--g-text-muted, var(--text-secondary, #94a3b8))" }}>Adjust palette & colors</div>
                </div>
                <button
                  type="button"
                  onClick={() => setPaletteOpen(!paletteOpen)}
                  style={{
                    padding: "7px 12px",
                    borderRadius: "999px",
                    background: 'var(--primary-subtle, #3b82f6)',
            border: '1px solid var(--g-accent, #3b82f6)',
                    color: "var(--g-accent-text, #ffffff)",
                    
                    fontSize: "0.75rem",
                    fontWeight: 800,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  <Palette size={12} /> Palette
                </button>
              </div>
            </aside>
          )}
        </div>
      </main>

      {/* 4. Fullscreen Interactive Popup Lightbox Modal */}
      <GalleryLightboxModal
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        images={photos}
        initialIndex={selectedPhotoIndex}
        albumTitle={gallery.title}
      />

      {/* 5. Live Color Customizer Floating Widget */}
      <GalleryThemePalette />

      <style>{`

        .gallery-description-content p {
          margin-bottom: 1em;
        }
        .gallery-description-content img {
          max-width: 100%;
          height: auto;
          border-radius: 8px;
        }
        .gallery-description-content a {
          color: var(--g-accent, #3b82f6);
          text-decoration: none;
        }
        .gallery-description-content a:hover {
          text-decoration: underline;
        }

        @media (max-width: 960px) {
          .gallery-detail-layout {
            grid-template-columns: 1fr !important;
            gap: 30px !important;
          }
        }
        .gallery-photo-card:hover .photo-overlay {
          opacity: 1 !important;
        }
      `}</style>
    </div>
  );
};

const GalleryDetail = ({ slug, parentCategorySlug, subcategorySlug, childCategorySlug }) => {
  return (
    <GalleryThemeProvider>
      <GalleryDetailContent
        slug={slug}
        parentCategorySlug={parentCategorySlug}
        subcategorySlug={subcategorySlug}
        childCategorySlug={childCategorySlug}
      />
    </GalleryThemeProvider>
  );
};

export default GalleryDetail;

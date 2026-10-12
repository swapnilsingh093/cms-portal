import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { videoAPI, videoFieldAPI } from "../../services/api";
import { resolveBannerImage } from "../../utils/bannerHelper";
import SmartImage from "../../components/common/SmartImage";
import NotFoundPage from "./NotFoundPage";
import PageLoader from "../../components/common/PageLoader";
import { stripHtml } from "../../utils/textHelper";
import CinemaVideoPlayer from "../../components/videos/CinemaVideoPlayer";
import { getItemPermalink } from "../../utils/permalinkHelper";
import { useAuth } from "../../context/AuthContext";
import {
  Film,
  Eye,
  Calendar,
  ChevronRight,
  FolderTree,
  Tag,
  ArrowLeft,
  ArrowRight,
  Clock,
  Play,
  Share2,
  Bookmark,
  Layers,
  Sparkles
} from "lucide-react";

const formatDate = (d) => {
  if (!d) return "";
  try {
    return new Date(d).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    });
  } catch {
    return "";
  }
};

const VideoDetail = ({
  slug: propSlug,
  parentCategorySlug: propParentSlug,
  subcategorySlug: propSubSlug,
  childCategorySlug: propChildSlug,
  onNavigate
}) => {
  const params = useParams();
  const slug = propSlug || params.videoSlug || params.p4 || (params.p3 && !params.p4 ? params.p3 : null) || params.slug || params.subcategorySlug;
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const isPrivileged = currentUser && ['admin', 'editor'].includes(currentUser.role);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isTheaterMode, setIsTheaterMode] = useState(false);

  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [relatedVideos, setRelatedVideos] = useState([]);
  const [loadingRelated, setLoadingRelated] = useState(false);
  const [copied, setCopied] = useState(false);
  const [fieldGroups, setFieldGroups] = useState([]);
  const [activeFieldKeys, setActiveFieldKeys] = useState(null);

  useEffect(() => {
    const fetchActiveFields = async () => {
      try {
        const res = await videoFieldAPI.getAll({ activeOnly: true });
        if (res && res.data) {
          setFieldGroups(res.data);
          const keys = new Set(res.data.map((f) => f.key.toLowerCase()));
          setActiveFieldKeys(keys);
        }
      } catch (e) {
        // Fallback
      }
    };
    fetchActiveFields();
  }, []);

  const isFieldActive = (key) => !activeFieldKeys || activeFieldKeys.has(key.toLowerCase());
  const hasChoice = (vid) => isFieldActive('choicecategory') && vid?.choiceCategory?.length > 0;
  const hasAgeGroup = (vid) => isFieldActive('agegroup') && Boolean(vid?.ageGroup);
  const hasMarital = (vid) => isFieldActive('maritalstatus') && Boolean(vid?.maritalStatus);

  const getCustomFieldBadges = (vid) => {
    if (!vid?.customFields || !fieldGroups.length) return [];
    const badges = [];
    fieldGroups.forEach((fg) => {
      if (['choicecategory', 'agegroup', 'maritalstatus'].includes(fg.key.toLowerCase())) return;
      if (fg.isActive === false) return;
      const rawVal = vid.customFields[fg.key] !== undefined
        ? vid.customFields[fg.key]
        : vid.customFields[fg.key.replace(/^custom_/, '')];
      if (rawVal !== undefined && rawVal !== null && rawVal !== '') {
        if (Array.isArray(rawVal)) {
          rawVal.forEach((item) => badges.push({ title: fg.title, value: item, key: fg.key }));
        } else {
          badges.push({ title: fg.title, value: String(rawVal), key: fg.key });
        }
      }
    });
    return badges;
  };

  const hasAttributes = (vid) =>
    Boolean(
      (vid?.screenOptions?.tags !== false && vid?.tags?.length > 0) ||
      (vid?.screenOptions?.video_details !== false && (
        vid?.age?.length > 0 ||
        hasChoice(vid) ||
        hasAgeGroup(vid) ||
        hasMarital(vid) ||
        getCustomFieldBadges(vid).length > 0
      ))
    );

  useEffect(() => {
    let isMounted = true;
    const fetchVideo = async () => {
      if (!slug) return;
      setLoading(true);
      try {
        const res = await videoAPI.getBySlug(slug);
        if (!isMounted) return;

        if (res.video) {
          setVideo(res.video);
          if (typeof window !== 'undefined') {
            window.__CURRENT_CMS_EDIT_CONTEXT__ = {
              label: 'Edit Video',
              url: `/admin/videos/edit/${res.video._id || res.video.slug}`
            };
            window.dispatchEvent(new Event('cms_edit_context_changed'));
          }

          // Render main video immediately without waiting for secondary related videos!
          if (isMounted) setLoading(false);

          // Fetch related videos from same subcategory/category (max 5)
          const catId = res.video.category?._id || res.video.category;
          const subCatId = res.video.subCategory?._id || res.video.subCategory;
          setLoadingRelated(true);
          try {
            const relParams = {
              status: "published",
              limit: 6
            };
            if (subCatId) {
              relParams.subCategory = subCatId;
            } else if (catId) {
              relParams.category = catId;
            }
            const relRes = await videoAPI.getAll(relParams);
            if (isMounted) {
              const filtered = (relRes.videos || [])
                .filter(
                  (v) => String(v._id) !== String(res.video._id) && String(v.slug) !== String(res.video.slug)
                )
                .slice(0, 5); // STRICT MAXIMUM 5 VIDEOS
              setRelatedVideos(filtered);
            }
          } catch (e) {
            console.error("Error fetching related videos:", e);
          } finally {
            if (isMounted) setLoadingRelated(false);
          }
        }
      } catch (err) {
        console.error("Error fetching video:", err.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchVideo();
    return () => {
      isMounted = false;
    };
  }, [slug]);

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return <PageLoader text="Loading video stream..." />;
  }

  if (!video || (video.status !== 'published' && !isPrivileged)) {
    return (
      <NotFoundPage
        type="video"
        title="Video Not Found"
        message="The video stream or page you are trying to watch could not be located or may be in draft."
      />
    );
  }

  if (video.displayContent === false) {
    return (
      <div
        style={{
          maxWidth: "760px",
          margin: "80px auto",
          padding: "40px 24px",
          textAlign: "center",
          background: "var(--bg-card, rgba(255,255,255,0.03))",
          borderRadius: "12px",
          border: "1px solid var(--border-color, rgba(255,255,255,0.08))"
        }}
      >
        <div
          style={{
            display: "inline-flex",
            padding: "16px",
            borderRadius: "50%",
            background: "rgba(239, 68, 68, 0.1)",
            color: "#ef4444",
            marginBottom: "16px"
          }}
        >
          <Film size={36} />
        </div>
        <h2 style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--text-primary, #f1f5f9)", marginBottom: "8px" }}>
          This video has been unpublished
        </h2>
        <p style={{ color: "var(--text-muted, #94a3b8)", fontSize: "0.95rem", marginBottom: "20px" }}>
          The video <strong>&ldquo;{video.title}&rdquo;</strong> is currently not available for streaming.
        </p>
        <Link
          to="/videos"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            background: 'var(--primary-subtle, #6366f1)',
            border: '1px solid var(--g-accent, #6366f1)',
            color: 'var(--g-accent, #ffffff)',
            padding: "10px 20px",
            borderRadius: "6px",
            textDecoration: "none",
            fontWeight: 600
          }}
        >
          Back to Videos
        </Link>
      </div>
    );
  }

  // Sidebar condition: enabled by default unless showSidebar === false or layout === "without_sidebar"
  const isSidebarEnabled = video.showSidebar !== false && video.layout !== "without_sidebar";

  // Banner resolution: prefers video.banner from backend, then poster/thumbnail, and if empty picks random fallback image
  const bannerImage = resolveBannerImage(video, video._id || video.slug || video.title);

  const videoSrc = video.videoUrl?.startsWith("/uploads/")
    ? `http://localhost:5001${video.videoUrl}`
    : video.videoUrl;

  const posterSrc = (video.poster || video.thumbnail)?.startsWith("/uploads/")
    ? `http://localhost:5001${video.poster || video.thumbnail}`
    : video.poster || video.thumbnail || bannerImage;

  let rootCategory = null;
  let category = null;
  let subCategory = null;
  let childCategory = null;

  if (video.category?.parentCategory) {
    if (video.category.parentCategory.parentCategory) {
      rootCategory = video.category.parentCategory.parentCategory;
      category = video.category.parentCategory;
      subCategory = video.category;
      childCategory = video.subCategory || video.childCategory;
    } else {
      rootCategory = video.category.parentCategory;
      category = video.category;
      subCategory = video.subCategory || video.childCategory;
      childCategory = video.subCategory && video.childCategory ? video.childCategory : null;
    }
  } else if (video.category) {
    category = video.category;
    subCategory = video.subCategory;
    childCategory = video.childCategory;
  } else if (video.subCategory?.parentCategory) {
    rootCategory = video.subCategory.parentCategory;
    category = video.subCategory;
    childCategory = video.childCategory;
  } else {
    category = video.subCategory || video.category;
    childCategory = video.childCategory;
  }

  // Deduplicate category chain to eliminate duplicate categories at any level
  const seenCatKeys = new Set();
  const dedupeCategory = (c) => {
    if (!c || !c.name) return null;
    const key = String(c._id || c.slug || c.name).trim().toLowerCase();
    if (seenCatKeys.has(key)) return null;
    seenCatKeys.add(key);
    return c;
  };

  rootCategory = dedupeCategory(rootCategory);
  category = dedupeCategory(category);
  subCategory = dedupeCategory(subCategory);
  childCategory = dedupeCategory(childCategory);

  const rootCategoryUrl = rootCategory ? `/videos/${rootCategory.slug || rootCategory}` : "/videos";
  const categoryUrl = category
    ? rootCategory
      ? `/videos/${rootCategory.slug || rootCategory}/${category.slug || category}`
      : `/videos/${category.slug || category}`
    : "/videos";
  const subCategoryUrl = category && subCategory
    ? `/videos/${category.slug || category}/${subCategory.slug || subCategory}`
    : subCategory
    ? `/videos/${subCategory.slug || subCategory}`
    : categoryUrl;
  const childCategoryUrl = category && subCategory && childCategory
    ? `/videos/${category.slug || category}/${subCategory.slug || subCategory}/${childCategory.slug || childCategory}`
    : subCategory && childCategory
    ? `/videos/${subCategory.slug || subCategory}/${childCategory.slug || childCategory}`
    : childCategory
    ? `/videos/${childCategory.slug || childCategory}`
    : subCategoryUrl;

  const categoryTagText = [rootCategory?.name, category?.name, subCategory?.name, childCategory?.name]
    .filter(Boolean)
    .join(" • ") || "Video";

  const cleanExcerpt = video.shortDescription || "";

  const getVideoLink = (v) => {
    return getItemPermalink(v, 'video');
  };

  return (
    <div
      className="single-video-page"
      style={{
        background: "var(--bg-main, #0b0f19)",
        minHeight: "100vh",
        color: "var(--text-primary, #f1f5f9)",
        paddingBottom: "80px"
      }}
    >
      {/* Draft/Trash Preview Notice for Admins & Editors */}
      {video.status !== 'published' && isPrivileged && (
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
          <span>⚠️ PREVIEW MODE: This video is currently in <strong>{video.status.toUpperCase()}</strong> status and is NOT visible to public visitors.</span>
        </div>
      )}
      {/* 
        EDITORIAL HERO BANNER ON SINGLE VIDEO PAGE (SAME STRUCTURE AS SINGLE POST PAGE)
        Displays banner image with Breadcrumbs, Category Tag, Video Title, Excerpt, and Byline/Meta
      */}
      <div
        className="single-video-hero-banner"
        style={{
          position: "relative",
          width: "100%",
          minHeight: video.screenOptions?.banner === false ? "260px" : video.bannerHeight || "440px",
          background: "#080c14",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          overflow: "hidden"
        }}
      >
        {/* Background Banner Image with smooth cover */}
        {video.screenOptions?.banner !== false && bannerImage && (
        <img
          src={bannerImage}
          alt={video.title}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: video.bannerPosition ? (video.bannerPosition.includes('%') ? `center ${video.bannerPosition}` : video.bannerPosition) : "center",
            zIndex: 1
          }}
        />
        )}

        {/* Localized Bottom/Left Gradient Overlay for high-contrast readability without darkening entire image */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(180deg, rgba(11, 15, 25, 0.4) 0%, rgba(11, 15, 25, 0.76) 55%, rgba(11, 15, 25, 0.98) 100%)",
            zIndex: 2
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
            transition: "max-width 0.3s ease"
          }}
        >
          {/* 1. Breadcrumbs: Home > Videos > [Parent Category] > [Subcategory] */}
          <nav
            aria-label="Breadcrumb"
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              gap: "8px",
              fontSize: "0.85rem",
              color: "#cbd5e1",
              marginBottom: "14px"
            }}
          >
            <Link
              to="/"
              style={{ color: "#cbd5e1", textDecoration: "none", transition: "color 0.2s" }}
              onMouseEnter={(e) => (e.target.style.color = "#fff")}
              onMouseLeave={(e) => (e.target.style.color = "#cbd5e1")}
            >
              Home
            </Link>
            <span style={{ color: "#94a3b8", opacity: 0.7 }}>&gt;</span>
            <Link
              to="/videos"
              style={{ color: "#cbd5e1", textDecoration: "none", transition: "color 0.2s" }}
              onMouseEnter={(e) => (e.target.style.color = "#fff")}
              onMouseLeave={(e) => (e.target.style.color = "#cbd5e1")}
            >
              Videos
            </Link>
            {rootCategory && (
              <>
                <span style={{ color: "#94a3b8", opacity: 0.7 }}>&gt;</span>
                <Link
                  to={rootCategoryUrl}
                  style={{ color: "var(--g-accent, #6366f1)", textDecoration: "none", fontWeight: 600 }}
                >
                  {rootCategory.name}
                </Link>
              </>
            )}
            {category && (
              <>
                <span style={{ color: "#94a3b8", opacity: 0.7 }}>&gt;</span>
                <Link
                  to={categoryUrl}
                  style={{ color: "var(--g-accent, #6366f1)", textDecoration: "none", fontWeight: 600 }}
                >
                  {category.name}
                </Link>
              </>
            )}
            {subCategory && (
              <>
                <span style={{ color: "#94a3b8", opacity: 0.7 }}>&gt;</span>
                <Link
                  to={subCategoryUrl}
                  style={{ color: "var(--g-accent, #6366f1)", textDecoration: "none", fontWeight: 600 }}
                >
                  {subCategory.name}
                </Link>
              </>
            )}
            {childCategory && (
              <>
                <span style={{ color: "#94a3b8", opacity: 0.7 }}>&gt;</span>
                <Link
                  to={childCategoryUrl}
                  style={{ color: "var(--g-accent, #6366f1)", textDecoration: "none", fontWeight: 600 }}
                >
                  {childCategory.name}
                </Link>
              </>
            )}
            <span style={{ color: "#94a3b8", opacity: 0.7 }}>&gt;</span>
            <span style={{ color: "#ffffff", fontWeight: 500, maxWidth: "340px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {video.title}
            </span>
          </nav>

          {/* 2. Category Tag: [Category] • [Subcategory] */}
          <div style={{ marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
            <span
              style={{
                display: "inline-block",
                padding: "4px 12px",
                borderRadius: "4px",
                background: "var(--primary-subtle, rgba(99, 102, 241, 0.15))",
                border: "1px solid var(--g-accent, #6366f1)",
                color: "#a5b4fc",
                fontSize: "0.75rem",
                fontWeight: 700,
                letterSpacing: "0.1em",
                textTransform: "uppercase"
              }}
            >
              {categoryTagText}
            </span>

            {video.isFeatured && (
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
                  borderRadius: "4px"
                }}
              >
                <Sparkles size={11} /> Featured
              </span>
            )}
          </div>

          {/* 3. Video Headline */}
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
              textShadow: "0 2px 10px rgba(0,0,0,0.5)"
            }}
          >
            {video.title}
          </h1>

          {/* 4. Excerpt / Short description */}
          {cleanExcerpt && video.screenOptions?.['short-description'] !== false && (
            <p
              style={{
                fontSize: "clamp(1.02rem, 1.8vw, 1.2rem)",
                lineHeight: 1.6,
                color: "#e2e8f0",
                margin: "0 0 20px 0",
                maxWidth: "860px",
                fontStyle: "italic",
                textShadow: "0 1px 4px rgba(0,0,0,0.6)"
              }}
            >
              {cleanExcerpt}
            </p>
          )}

          {/* 5. Byline & Metadata inside Banner */}
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
              borderTop: "1px solid rgba(255, 255, 255, 0.15)"
            }}
          >
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "16px" }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "#ffffff", fontWeight: 600 }}>
                <Eye size={15} color="var(--g-accent, #6366f1)" /> {video.views ?? 0} views
              </span>
              {video.createdAt && (
                <span style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
                  <Calendar size={14} color="var(--g-accent, #6366f1)" /> {formatDate(video.createdAt)}
                </span>
              )}
              {video.duration && (
                <span style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
                  <Clock size={14} color="var(--g-accent, #6366f1)" /> {video.duration}
                </span>
              )}
            </div>

            {/* Share action */}
            <button
              type="button"
              onClick={handleShare}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "7px 14px",
                borderRadius: "6px",
                background: "rgba(255, 255, 255, 0.1)",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                color: copied ? "#22c55e" : "#ffffff",
                fontSize: "0.82rem",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.2s"
              }}
            >
              <Share2 size={13} />
              {copied ? "Link Copied!" : "Share Video"}
            </button>
          </div>
        </div>
      </div>

      {/* Main Video Body Layout: 
          Adapts dynamically based on isSidebarEnabled!
          With Sidebar: 2 columns (Video Player + Details on Left, Compact ~330px Sidebar on Right)
          Without Sidebar: 1 clean centered column (Full width cinema player + details + row grid below)
      */}
      <div
        style={{
          maxWidth: isTheaterMode ? "100%" : isSidebarEnabled ? "1380px" : "1100px",
          margin: "0 auto",
          padding: isTheaterMode ? "20px 24px 0" : "36px 24px 0",
          boxSizing: "border-box",
          transition: "max-width 0.3s ease, padding 0.3s ease"
        }}
      >
        <div
          className={`video-layout-wrapper ${isSidebarEnabled ? "has-sidebar" : "no-sidebar"}`}
          style={{
            display: "flex",
            flexDirection: isTheaterMode ? "column" : "row",
            gap: "36px",
            alignItems: "flex-start"
          }}
        >
          {/* Main Video Stream & Overview Column */}
          <main
            style={{
              flex: 1,
              minWidth: 0,
              width: "100%"
            }}
          >
            {/* Description Before Video */}
            {video.descriptionPosition === 'before' && video.description && (
              <div
                className="glass-panel"
                style={{
                  padding: "26px 30px",
                  background: "var(--bg-card, rgba(255, 255, 255, 0.025))",
                  borderRadius: "12px",
                  border: "1px solid var(--border-color, rgba(255, 255, 255, 0.08))",
                  marginBottom: "32px"
                }}
              >
                <div
                  className="story-content"
                  style={{
                    color: "#cbd5e1",
                    fontSize: "0.98rem",
                    lineHeight: "1.75"
                  }}
                  dangerouslySetInnerHTML={{ __html: video.description }}
                />

                {/* Advanced Attributes & Tags */}
                {hasAttributes(video) && (
                  <div
                    style={{
                      marginTop: "24px",
                      paddingTop: "16px",
                      borderTop: "1px solid rgba(255, 255, 255, 0.06)",
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
                    {video.screenOptions?.tags !== false && video.tags?.map((tag, idx) => (
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

                    {/* Choice Categories */}
                    {video.screenOptions?.video_details !== false && hasChoice(video) && video.choiceCategory?.map((cat, idx) => (
                      <span
                        key={'choice-'+idx}
                        style={{
                          background: "rgba(40, 167, 69, 0.12)",
                          border: "1px solid rgba(40, 167, 69, 0.3)",
                          borderRadius: "4px",
                          padding: "3px 10px",
                          fontSize: "0.76rem",
                          color: "#4ade80",
                          fontWeight: 600
                        }}
                      >
                        📂 {cat}
                      </span>
                    ))}

                    {/* Age Group */}
                    {video.screenOptions?.video_details !== false && hasAgeGroup(video) && (
                      <span
                        style={{
                          background: "rgba(242, 84, 95, 0.12)",
                          border: "1px solid rgba(242, 84, 95, 0.3)",
                          borderRadius: "4px",
                          padding: "3px 10px",
                          fontSize: "0.76rem",
                          color: "#f2545f",
                          fontWeight: 600
                        }}
                      >
                        🎂 Age: {video.ageGroup}
                      </span>
                    )}

                    {/* Age Tags */}
                    {video.screenOptions?.video_details !== false && video.age?.map((ageNum, idx) => (
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
                    {video.screenOptions?.video_details !== false && hasMarital(video) && (
                      <span
                        style={{
                          background: "rgba(74, 144, 217, 0.12)",
                          border: "1px solid rgba(74, 144, 217, 0.3)",
                          borderRadius: "4px",
                          padding: "3px 10px",
                          fontSize: "0.76rem",
                          color: "#60a5fa",
                          fontWeight: 600
                        }}
                      >
                        {video.maritalStatus.toLowerCase().includes('un') ? '💔' : '💍'} {video.maritalStatus}
                      </span>
                    )}

                    {/* Dynamic Custom Field Badges */}
                    {video.screenOptions?.video_details !== false && getCustomFieldBadges(video).map((badge, idx) => (
                      <span
                        key={'cf-' + idx}
                        style={{
                          background: "rgba(168, 85, 247, 0.12)",
                          border: "1px solid rgba(168, 85, 247, 0.3)",
                          borderRadius: "4px",
                          padding: "3px 10px",
                          fontSize: "0.76rem",
                          color: "#c084fc",
                          fontWeight: 600
                        }}
                      >
                        ✨ {badge.title}: {badge.value}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
            {/* High-Definition Cinema Video Player */}
            <div
              style={{
                position: "relative",
                width: "100%",
                borderRadius: "16px",
                overflow: "hidden",
                marginBottom: "28px"
              }}
            >
              {video.videoType === "youtube" && video.videoUrl ? (
                <div
                  style={{
                    position: "relative",
                    width: "100%",
                    aspectRatio: "16 / 9",
                    background: "#05070d",
                    borderRadius: "16px",
                    overflow: "hidden",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    boxShadow: "0 18px 45px -10px rgba(0, 0, 0, 0.8), 0 0 25px rgba(99, 102, 241, 0.12)"
                  }}
                >
                  <iframe
                    src={
                      video.videoUrl.includes("embed")
                        ? video.videoUrl
                        : `https://www.youtube.com/embed/${video.videoUrl.split("v=")[1]?.split("&")[0] || ""}`
                    }
                    title={video.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    style={{ width: "100%", height: "100%", border: "none" }}
                  />
                </div>
              ) : video.videoType === "vimeo" && video.videoUrl ? (
                <div
                  style={{
                    position: "relative",
                    width: "100%",
                    aspectRatio: "16 / 9",
                    background: "#05070d",
                    borderRadius: "16px",
                    overflow: "hidden",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    boxShadow: "0 18px 45px -10px rgba(0, 0, 0, 0.8), 0 0 25px rgba(99, 102, 241, 0.12)"
                  }}
                >
                  <iframe
                    src={video.videoUrl}
                    title={video.title}
                    allowFullScreen
                    style={{ width: "100%", height: "100%", border: "none" }}
                  />
                </div>
              ) : (
                <CinemaVideoPlayer
                  src={videoSrc}
                  poster={posterSrc}
                  title={video.title}
                  onPlayStateChange={setIsPlaying}
                  isTheaterMode={isTheaterMode}
                  onToggleTheater={() => setIsTheaterMode((prev) => !prev)}
                />
              )}
            </div>



            {/* If Sidebar is DISABLED: Render related videos underneath in a clean responsive grid! */}
            {!isSidebarEnabled && relatedVideos.length > 0 && (
              <section style={{ marginTop: "44px" }}>
                <div
                  style={{
                    borderBottom: "2px solid var(--border-color, rgba(255, 255, 255, 0.08))",
                    paddingBottom: "12px",
                    marginBottom: "24px",
                    display: "flex",
                    alignItems: "baseline",
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
                        color: "var(--g-accent, #6366f1)"
                      }}
                    >
                      Up Next
                    </span>
                    <h3
                      style={{
                        fontSize: "1.35rem",
                        fontWeight: 700,
                        color: "var(--text-primary, #f1f5f9)",
                        margin: "4px 0 0 0"
                      }}
                    >
                      More Videos You Might Like
                    </h3>
                  </div>
                  <Link
                    to={categoryUrl}
                    style={{ fontSize: "0.82rem", color: "var(--g-accent, #6366f1)", textDecoration: "none", fontWeight: 600 }}
                  >
                    View All &rarr;
                  </Link>
                </div>

                <div className="more-videos-grid">
                  {relatedVideos.slice(0, 3).map((relVid) => {
                    const thumb = resolveBannerImage(relVid, relVid._id || relVid.slug);
                    const catName =
                      relVid.category?.name ||
                      relVid.subCategory?.name ||
                      video.category?.name ||
                      "";
                    const excerpt = stripHtml(relVid.shortDescription || relVid.description || "");

                    return (
                      <Link
                        key={relVid._id}
                        to={getVideoLink(relVid)}
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          background: "var(--g-surface, var(--bg-card, #151f33))",
                          border: "1px solid var(--g-border, var(--border-color, #22324f))",
                          borderRadius: "18px",
                          overflow: "hidden",
                          textDecoration: "none",
                          color: "var(--g-text, var(--text-primary, #ffffff))",
                          boxShadow: "var(--g-shadow, 0 8px 24px rgba(0,0,0,0.3))",
                          transition: "transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease"
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = "translateY(-5px)";
                          e.currentTarget.style.borderColor = "var(--g-accent, #3b82f6)";
                          e.currentTarget.style.boxShadow =
                            "0 18px 40px var(--g-accent-glow, rgba(59, 130, 246, 0.35))";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = "translateY(0)";
                          e.currentTarget.style.borderColor = "var(--g-border, var(--border-color, #22324f))";
                          e.currentTarget.style.boxShadow = "var(--g-shadow, 0 8px 24px rgba(0,0,0,0.3))";
                        }}
                      >
                        {/* Cover Image Container */}
                        <div
                          style={{
                            position: "relative",
                            width: "100%",
                            paddingTop: "60%",
                            background: "#030712",
                            overflow: "hidden"
                          }}
                        >
                          {thumb ? (
                            <SmartImage
                              src={thumb}
                              alt={relVid.title}
                              style={{
                                position: "absolute",
                                inset: 0,
                                width: "100%",
                                height: "100%"
                              }}
                              className="hover-zoom"
                            />
                          ) : (
                            <div
                              style={{
                                position: "absolute",
                                inset: 0,
                                width: "100%",
                                height: "100%",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center"
                              }}
                            >
                              <Play size={28} color="var(--g-accent, #3b82f6)" />
                            </div>
                          )}

                          {/* Contrast Gradient Overlay (Top vignette + bottom fade like Screenshot 2) */}
                          <div
                            style={{
                              position: "absolute",
                              inset: 0,
                              background:
                                "linear-gradient(180deg, rgba(0, 0, 0, 0.75) 0%, rgba(0, 0, 0, 0.22) 36%, transparent 60%), linear-gradient(0deg, var(--g-surface, var(--bg-card, #151f33)) 0%, transparent 60%)",
                              pointerEvents: "none"
                            }}
                          />

                          {/* Category Badge on Top Left (Rich green glassmorphism like Screenshot 2) */}
                          {catName && (
                            <div
                              title={catName}
                              style={{
                                position: "absolute",
                                top: "12px",
                                left: "12px",
                                maxWidth: "calc(100% - 24px)",
                                background: "rgba(6, 44, 30, 0.82)",
                                backdropFilter: "blur(12px)",
                                WebkitBackdropFilter: "blur(12px)",
                                border: "1px solid rgba(52, 211, 153, 0.65)",
                                boxShadow: "0 4px 14px rgba(0, 0, 0, 0.45), inset 0 1px 1px rgba(255, 255, 255, 0.2)",
                                color: "#a7f3d0",
                                fontSize: "0.70rem",
                                fontWeight: 800,
                                padding: "4px 10px",
                                borderRadius: "6px",
                                letterSpacing: "0.04em",
                                textTransform: "uppercase",
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                textShadow: "0 1px 2px rgba(0, 0, 0, 0.85)",
                                zIndex: 2
                              }}
                            >
                              {catName}
                            </div>
                          )}

                          {/* Video Duration / Play Pill on Bottom Right */}
                          <div
                            style={{
                              position: "absolute",
                              bottom: "12px",
                              right: "12px",
                              background: "rgba(0, 0, 0, 0.8)",
                              backdropFilter: "blur(6px)",
                              color: "#ffffff",
                              fontSize: "0.75rem",
                              fontWeight: 700,
                              padding: "4px 10px",
                              borderRadius: "6px",
                              display: "flex",
                              alignItems: "center",
                              gap: "5px",
                              border: "1px solid rgba(255, 255, 255, 0.15)",
                              zIndex: 2
                            }}
                          >
                            <Play size={11} fill="#ffffff" color="#ffffff" />
                            <span>{relVid.duration || "Video"}</span>
                          </div>
                        </div>

                        {/* Content Area */}
                        <div style={{ padding: "20px", display: "flex", flexDirection: "column", flex: 1 }}>
                          {/* Date and Views */}
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "14px",
                              fontSize: "0.78rem",
                              color: "var(--g-text-muted, var(--text-secondary, #94a3b8))",
                              marginBottom: "10px"
                            }}
                          >
                            {relVid.createdAt && (
                              <span style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                                <Calendar size={13} /> {formatDate(relVid.createdAt)}
                              </span>
                            )}
                            <span style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                              <Eye size={13} /> {relVid.views ?? 0} views
                            </span>
                          </div>

                          {/* Title */}
                          <h3
                            style={{
                              fontSize: "1.15rem",
                              fontWeight: 800,
                              color: "var(--g-text, var(--text-primary, #ffffff))",
                              margin: "0 0 8px",
                              lineHeight: 1.4,
                              display: "-webkit-box",
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: "vertical",
                              overflow: "hidden"
                            }}
                          >
                            {relVid.title}
                          </h3>

                          {/* Description */}
                          {excerpt && (
                            <p
                              style={{
                                fontSize: "0.86rem",
                                color: "var(--g-text-muted, var(--text-secondary, #94a3b8))",
                                lineHeight: 1.5,
                                margin: "0 0 16px",
                                display: "-webkit-box",
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: "vertical",
                                overflow: "hidden"
                              }}
                            >
                              {excerpt}
                            </p>
                          )}

                          {/* Footer CTA */}
                          <div
                            style={{
                              marginTop: "auto",
                              paddingTop: "14px",
                              borderTop: "1px solid var(--g-border, var(--border-color, rgba(255, 255, 255, 0.08)))",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              fontSize: "0.85rem",
                              fontWeight: 700
                            }}
                          >
                            <span style={{ color: "#f59e0b" }}>Watch Video</span>
                            <ArrowRight size={15} color="#f59e0b" />
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Description After Video */}
            {video.descriptionPosition !== 'no' && video.descriptionPosition !== 'before' && video.description && (
              <div
                className="glass-panel"
                style={{
                  padding: "26px 30px",
                  background: "var(--bg-card, rgba(255, 255, 255, 0.025))",
                  borderRadius: "12px",
                  border: "1px solid var(--border-color, rgba(255, 255, 255, 0.08))",
                  marginBottom: "32px",
                  marginTop: "8px"
                }}
              >
                <div
                  className="story-content"
                  style={{
                    color: "#cbd5e1",
                    fontSize: "0.98rem",
                    lineHeight: "1.75"
                  }}
                  dangerouslySetInnerHTML={{ __html: video.description }}
                />
                {/* Advanced Attributes & Tags */}
                {hasAttributes(video) && (
                  <div
                    style={{
                      marginTop: "24px",
                      paddingTop: "16px",
                      borderTop: "1px solid rgba(255, 255, 255, 0.06)",
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
                    {video.screenOptions?.tags !== false && video.tags?.map((tag, idx) => (
                      <span
                        key={'tag2-'+idx}
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

                    {/* Choice Categories */}
                    {video.screenOptions?.video_details !== false && hasChoice(video) && video.choiceCategory?.map((cat, idx) => (
                      <span
                        key={'choice2-'+idx}
                        style={{
                          background: "rgba(40, 167, 69, 0.12)",
                          border: "1px solid rgba(40, 167, 69, 0.3)",
                          borderRadius: "4px",
                          padding: "3px 10px",
                          fontSize: "0.76rem",
                          color: "#4ade80",
                          fontWeight: 600
                        }}
                      >
                        📂 {cat}
                      </span>
                    ))}

                    {/* Age Group */}
                    {video.screenOptions?.video_details !== false && hasAgeGroup(video) && (
                      <span
                        style={{
                          background: "rgba(242, 84, 95, 0.12)",
                          border: "1px solid rgba(242, 84, 95, 0.3)",
                          borderRadius: "4px",
                          padding: "3px 10px",
                          fontSize: "0.76rem",
                          color: "#f2545f",
                          fontWeight: 600
                        }}
                      >
                        🎂 Age: {video.ageGroup}
                      </span>
                    )}

                    {/* Age Tags */}
                    {video.screenOptions?.video_details !== false && video.age?.map((ageNum, idx) => (
                      <span
                        key={'age2-'+idx}
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
                    {video.screenOptions?.video_details !== false && hasMarital(video) && (
                      <span
                        style={{
                          background: "rgba(74, 144, 217, 0.12)",
                          border: "1px solid rgba(74, 144, 217, 0.3)",
                          borderRadius: "4px",
                          padding: "3px 10px",
                          fontSize: "0.76rem",
                          color: "#60a5fa",
                          fontWeight: 600
                        }}
                      >
                        {video.maritalStatus.toLowerCase().includes('un') ? '💔' : '💍'} {video.maritalStatus}
                      </span>
                    )}

                    {/* Dynamic Custom Field Badges */}
                    {video.screenOptions?.video_details !== false && getCustomFieldBadges(video).map((badge, idx) => (
                      <span
                        key={'cf2-' + idx}
                        style={{
                          background: "rgba(168, 85, 247, 0.12)",
                          border: "1px solid rgba(168, 85, 247, 0.3)",
                          borderRadius: "4px",
                          padding: "3px 10px",
                          fontSize: "0.76rem",
                          color: "#c084fc",
                          fontWeight: 600
                        }}
                      >
                        ✨ {badge.title}: {badge.value}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </main>

          {/* RIGHT SIDEBAR (When Enabled):
              Compact size ("sidbar jyda badi nhi hogi", width: 330px max)
              Shows: Series & Category Channel card + Up Next / Related Videos list
          */}
          {isSidebarEnabled && (
            <aside
              className="video-compact-sidebar"
              style={{
                width: "330px",
                flexShrink: 0,
                position: "sticky",
                top: "calc(var(--wp-admin-bar-height, 0px) + 88px)",
                alignSelf: "flex-start",
                zIndex: 10,
              }}
            >
              {/* Category Quick Card */}
              {category && (
                <div
                  style={{
                    padding: "16px 18px",
                    background: "var(--bg-card, rgba(255, 255, 255, 0.03))",
                    border: "1px solid var(--border-color, rgba(255, 255, 255, 0.08))",
                    borderRadius: "10px",
                    marginBottom: "20px"
                  }}
                >
                  <div style={{ fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--g-accent, #6366f1)", marginBottom: "4px" }}>
                    Series & Category
                  </div>
                  <h4 style={{ fontSize: "1.05rem", fontWeight: 700, margin: "0 0 6px 0", color: "var(--text-primary, #f1f5f9)" }}>
                    {category.name}
                  </h4>
                  {category.description && (
                    <p style={{ fontSize: "0.82rem", color: "var(--text-muted, #94a3b8)", margin: "0 0 10px 0", lineHeight: 1.45 }}>
                      {category.description}
                    </p>
                  )}
                  <Link
                    to={categoryUrl}
                    style={{
                      fontSize: "0.82rem",
                      color: "var(--g-accent, #6366f1)",
                      textDecoration: "none",
                      fontWeight: 600,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px"
                    }}
                  >
                    Explore Channel <ChevronRight size={13} />
                  </Link>
                </div>
              )}

              {/* Up Next / Related Videos List */}
              <div
                style={{
                  background: "var(--bg-card, rgba(255, 255, 255, 0.025))",
                  border: "1px solid var(--border-color, rgba(255, 255, 255, 0.08))",
                  borderRadius: "10px",
                  padding: "18px 16px"
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    paddingBottom: "12px",
                    marginBottom: "14px",
                    borderBottom: "1px solid var(--border-color, rgba(255, 255, 255, 0.08))"
                  }}
                >
                  <h3
                    style={{
                      fontSize: "0.95rem",
                      fontWeight: 700,
                      letterSpacing: "0.02em",
                      textTransform: "uppercase",
                      color: "var(--text-primary, #f1f5f9)",
                      margin: 0
                    }}
                  >
                    Related Videos
                  </h3>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted, #94a3b8)" }}>
                    {Math.min(relatedVideos.length, 5)} items
                  </span>
                </div>

                {loadingRelated ? (
                  <div style={{ padding: "20px 0", textAlign: "center", color: "var(--text-muted, #94a3b8)", fontSize: "0.82rem" }}>
                    Loading related videos...
                  </div>
                ) : relatedVideos.length === 0 ? (
                  <div style={{ padding: "20px 0", textAlign: "center", color: "var(--text-muted, #94a3b8)", fontSize: "0.82rem" }}>
                    No other videos found in this category.
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    {relatedVideos.slice(0, 5).map((relVid) => {
                      const thumb = resolveBannerImage(relVid, relVid._id || relVid.slug);
                      return (
                        <Link
                          key={relVid._id}
                          to={getVideoLink(relVid)}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "12px",
                            textDecoration: "none",
                            padding: "6px",
                            borderRadius: "8px",
                            transition: "background 0.2s ease"
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)")}
                          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                        >
                          {/* Mini 16:9 Thumbnail (105px) */}
                          <div
                            style={{
                              width: "105px",
                              height: "62px",
                              flexShrink: 0,
                              borderRadius: "6px",
                              overflow: "hidden",
                              background: "#000",
                              position: "relative"
                            }}
                          >
                            {thumb ? (
                              <SmartImage
                                src={thumb}
                                alt={relVid.title}
                                style={{ width: "100%", height: "100%" }}
                              />
                            ) : (
                              <div
                                style={{
                                  width: "100%",
                                  height: "100%",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center"
                                }}
                              >
                                <Play size={16} color="var(--g-accent, #6366f1)" />
                              </div>
                            )}
                            {relVid.duration && (
                              <span
                                style={{
                                  position: "absolute",
                                  bottom: "3px",
                                  right: "3px",
                                  background: "rgba(0,0,0,0.85)",
                                  color: "#fff",
                                  fontSize: "0.65rem",
                                  padding: "1px 4px",
                                  borderRadius: "3px",
                                  fontWeight: 600
                                }}
                              >
                                {relVid.duration}
                              </span>
                            )}
                          </div>

                          {/* Mini Details */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <h4
                              style={{
                                fontSize: "0.84rem",
                                fontWeight: 600,
                                color: "var(--text-primary, #f1f5f9)",
                                margin: "0 0 4px 0",
                                lineHeight: 1.3,
                                display: "-webkit-box",
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: "vertical",
                                overflow: "hidden"
                              }}
                            >
                              {relVid.title}
                            </h4>
                            <div style={{ fontSize: "0.72rem", color: "var(--text-muted, #94a3b8)" }}>
                              {relVid.views ?? 0} views • {formatDate(relVid.createdAt)}
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            </aside>
          )}
        </div>
      </div>

      <style>{`
        .story-content h2 { font-size: 1.45rem; margin: 24px 0 12px; color: var(--text-primary, #f1f5f9); }
        .story-content h3 { font-size: 1.2rem; margin: 20px 0 10px; color: var(--text-primary, #f1f5f9); }
        .story-content p { margin-bottom: 16px; line-height: 1.7; }
        .story-content img, .story-content video { max-width: 100%; border-radius: 8px; margin: 16px 0; display: block; }
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

        .more-videos-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 24px;
        }

        @media (max-width: 960px) {
          .video-layout-wrapper {
            flex-direction: column !important;
            gap: 28px !important;
          }
          .video-compact-sidebar {
            width: 100% !important;
            position: static !important;
          }
          .more-videos-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
            gap: 18px !important;
          }
        }

        @media (max-width: 600px) {
          .more-videos-grid {
            grid-template-columns: 1fr !important;
            gap: 16px !important;
          }
        }
      `}</style>
    </div>
  );
};

export default VideoDetail;

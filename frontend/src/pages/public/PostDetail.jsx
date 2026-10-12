import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { postAPI } from "../../services/api";
import SingleStorySidebar from "../../components/stories/SingleStorySidebar";
import StoryCard from "../../components/stories/StoryCard";
import NotFoundPage from "./NotFoundPage";
import PageLoader from "../../components/common/PageLoader";
import BookStoryReader from "../../components/stories/BookStoryReader";
import { resolveBannerImage } from "../../utils/bannerHelper";
import { stripHtml } from "../../utils/textHelper";
import { useAuth } from "../../context/AuthContext";
import {
  BookOpen,
  Calendar,
  Clock,
  Eye,
  User,
  ChevronRight,
  ArrowLeft,
  Film,
  Tag
} from "lucide-react";

const formatDate = (d) => {
  if (!d) return "";
  try {
    return new Date(d).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric"
    });
  } catch {
    return "";
  }
};

const calcReadTime = (content, excerpt) => {
  const text = (content || "") + " " + (excerpt || "");
  if (!text.trim()) return "2 min read";
  const words = text.replace(/<[^>]+>/g, "").trim().split(/\s+/).length;
  return `${Math.max(1, Math.ceil(words / 200))} min read`;
};

const formatStoryHtml = (content) => {
  if (!content) return "";
  let html = content.trim();

  // Normalize line endings
  html = html.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  // Separate closing block tags from text so headings/figures don't merge with paragraph text
  html = html.replace(/(<\/(?:h[1-6]|div|p|blockquote|figure|ul|ol|table)>)(\s*)([^\s<])/gi, "$1\n\n$3");

  // Separate standalone img tags so they occupy their own independent block
  html = html.replace(/(<img[^>]+>)/gi, "\n\n$1\n\n");

  // Strip hardcoded inline width/height attributes that cause images to blow outside reading width
  html = html.replace(/<img([^>]*)\s+(?:width|height)=["']\d+["']/gi, "<img$1");

  // If the document doesn't already use <p> tags extensively, auto-format paragraphs
  const paragraphCount = (html.match(/<p[\s>]/gi) || []).length;
  if (paragraphCount < 3) {
    const blocks = html.split(/\n{2,}/);
    const formattedBlocks = blocks.map((block) => {
      const trimmed = block.trim();
      if (!trimmed) return "";

      const isBlockTag = /^<(?:h[1-6]|div|p|blockquote|figure|ul|ol|table|img|video|hr|section|article)[\s>]/i.test(
        trimmed
      );

      if (isBlockTag) {
        return trimmed;
      }

      // Convert single newlines within the paragraph to <br />
      const withBr = trimmed.replace(/\n/g, "<br />");
      return `<p>${withBr}</p>`;
    }).filter(Boolean);

    html = formattedBlocks.join("\n\n");
  }

  return html;
};

const PostDetail = ({
  slug: propSlug,
  parentCategorySlug: propParentSlug,
  subcategorySlug: propSubSlug,
  childCategorySlug: propChildSlug,
  onNavigate
}) => {
  const params = useParams();
  const slug = propSlug || params.postSlug || params.p4 || (params.p3 && !params.p4 ? params.p3 : null) || params.slug;
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const isPrivileged = currentUser && ['admin', 'editor'].includes(currentUser.role);

  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [relatedPosts, setRelatedPosts] = useState([]);

  useEffect(() => {
    let isMounted = true;

    const fetchPost = async () => {
      if (!slug) return;
      setLoading(true);
      try {
        const res = await postAPI.getBySlug(slug);
        if (!isMounted) return;

        if (res.post) {
          setPost(res.post);
          if (typeof window !== 'undefined') {
            window.__CURRENT_CMS_EDIT_CONTEXT__ = {
              label: 'Edit Post',
              url: `/admin/posts/edit/${res.post._id || res.post.slug}`
            };
            window.dispatchEvent(new Event('cms_edit_context_changed'));
          }

          // Render story immediately to avoid 3-4s delay
          if (isMounted) setLoading(false);

          // Fetch related posts in background (same category or latest)
          if (res.post.category) {
            const catId = res.post.category._id || res.post.category;
            postAPI.getAll({
              category: catId,
              limit: 4,
              status: "published"
            })
              .then((relRes) => {
                if (isMounted) {
                  const filtered = (relRes.posts || []).filter(
                    (p) => String(p._id) !== String(res.post._id)
                  );
                  setRelatedPosts(filtered.slice(0, 3));
                }
              })
              .catch(() => {});
          }
        }
      } catch (err) {
        console.error("Error fetching story:", err.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchPost();
    return () => {
      isMounted = false;
    };
  }, [slug]);

  if (loading) {
    return <PageLoader text="Loading story..." />;
  }

  if (!post || (post.status !== 'published' && !isPrivileged)) {
    return (
      <NotFoundPage
        type="post"
        title="Story Not Found"
        message="The story or article you requested could not be located or may have been un-published."
      />
    );
  }

  if (post.displayContent === false) {
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
          <BookOpen size={36} />
        </div>
        <h2 style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--text-primary, #f1f5f9)", marginBottom: "8px" }}>
          This story has been unpublished
        </h2>
        <p style={{ color: "var(--text-muted, #94a3b8)", fontSize: "0.95rem", marginBottom: "20px" }}>
          The article <strong>&ldquo;{post.title}&rdquo;</strong> is currently unavailable.
        </p>
        <Link to="/stories" className="btn-primary">
          Back to Stories
        </Link>
      </div>
    );
  }

  // Top banner source: prefers post.banner, fallbacks to post.featuredImage
  const bannerImage = resolveBannerImage(post, post._id || post.slug || post.title);
  const authorName = post.author?.name || (typeof post.author === "string" ? post.author : "");
  const readTime = calcReadTime(post.content, post.excerpt);

  let rootCat = null;
  let parentCat = null;
  let subCat = null;
  let childCat = null;

  if (post.category?.parentCategory) {
    if (post.category.parentCategory.parentCategory) {
      rootCat = post.category.parentCategory.parentCategory;
      parentCat = post.category.parentCategory;
      subCat = post.category;
      childCat = post.subCategory || post.childCategory;
    } else {
      rootCat = post.category.parentCategory;
      parentCat = post.category;
      subCat = post.subCategory || post.childCategory;
      childCat = post.subCategory && post.childCategory ? post.childCategory : null;
    }
  } else if (post.category) {
    parentCat = post.category;
    subCat = post.subCategory;
    childCat = post.childCategory;
  } else if (post.subCategory?.parentCategory) {
    rootCat = post.subCategory.parentCategory;
    parentCat = post.subCategory;
    childCat = post.childCategory;
  } else {
    parentCat = post.subCategory || post.category;
    childCat = post.childCategory;
  }

  // Deduplicate category chain to eliminate duplicate categories at any level
  const seenPostCatKeys = new Set();
  const dedupePostCat = (c) => {
    if (!c || !c.name) return null;
    const key = String(c._id || c.slug || c.name).trim().toLowerCase();
    if (seenPostCatKeys.has(key)) return null;
    seenPostCatKeys.add(key);
    return c;
  };

  rootCat = dedupePostCat(rootCat);
  parentCat = dedupePostCat(parentCat);
  subCat = dedupePostCat(subCat);
  childCat = dedupePostCat(childCat);

  const rootUrl = rootCat ? `/stories/${rootCat.slug || rootCat}` : "/stories";
  const parentUrl = parentCat
    ? rootCat
      ? `/stories/${rootCat.slug || rootCat}/${parentCat.slug || parentCat}`
      : `/stories/${parentCat.slug || parentCat}`
    : "/stories";
  const subCatUrl =
    parentCat && subCat
      ? `/stories/${parentCat.slug || parentCat}/${subCat.slug || subCat}`
      : subCat
      ? `/stories/${subCat.slug || subCat}`
      : parentUrl;
  const childCatUrl =
    parentCat && subCat && childCat
      ? `/stories/${parentCat.slug || parentCat}/${subCat.slug || subCat}/${childCat.slug || childCat}`
      : subCat && childCat
      ? `/stories/${subCat.slug || subCat}/${childCat.slug || childCat}`
      : childCat
      ? `/stories/${childCat.slug || childCat}`
      : subCatUrl;

  const categoryTagText = [rootCat?.name, parentCat?.name, subCat?.name, childCat?.name]
    .filter(Boolean)
    .join(" • ") || "Story";

  return (
    <div
      className="single-story-page"
      style={{
        background: "var(--bg-main, #0b0f19)",
        minHeight: "100vh",
        color: "var(--text-primary, #f1f5f9)"
      }}
    >
      {/* Draft/Trash Preview Notice for Admins & Editors */}
      {post.status !== 'published' && isPrivileged && (
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
          <span>⚠️ PREVIEW MODE: This story is currently in <strong>{post.status.toUpperCase()}</strong> status and is NOT visible to public visitors.</span>
        </div>
      )}
      {/* 
        POST LAYOUT PRESENTATION:
        Layout 1: Standard Editorial Article
        Layout 2: 3D Interactive Animated Book
      */}
      {post.layout === 'book' && post.screenOptions?.['post-layout'] !== false ? (
        <BookStoryReader
          post={post}
          bannerImage={bannerImage}
          relatedPosts={relatedPosts}
          breadcrumb={
            <nav
              aria-label="Breadcrumb"
              style={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                gap: "8px",
                fontSize: "0.85rem",
                color: "#cbd5e1"
              }}
            >
              <Link to="/" style={{ color: "#cbd5e1", textDecoration: "none" }}>
                Home
              </Link>
              <span style={{ color: "#94a3b8", opacity: 0.7 }}>&gt;</span>
              <Link to="/stories" style={{ color: "#cbd5e1", textDecoration: "none" }}>
                Stories
              </Link>
              {rootCat && (
                <>
                  <span style={{ color: "#94a3b8", opacity: 0.7 }}>&gt;</span>
                  <Link to={rootUrl} style={{ color: "var(--g-accent, #ea580c)", textDecoration: "none", fontWeight: 600 }}>
                    {rootCat.name}
                  </Link>
                </>
              )}
              {parentCat && (
                <>
                  <span style={{ color: "#94a3b8", opacity: 0.7 }}>&gt;</span>
                  <Link to={parentUrl} style={{ color: "var(--g-accent, #ea580c)", textDecoration: "none", fontWeight: 600 }}>
                    {parentCat.name}
                  </Link>
                </>
              )}
              {subCat && (
                <>
                  <span style={{ color: "#94a3b8", opacity: 0.7 }}>&gt;</span>
                  <Link to={subCatUrl} style={{ color: "var(--g-accent, #ea580c)", textDecoration: "none", fontWeight: 600 }}>
                    {subCat.name}
                  </Link>
                </>
              )}
              {childCat && (
                <>
                  <span style={{ color: "#94a3b8", opacity: 0.7 }}>&gt;</span>
                  <Link to={childCatUrl} style={{ color: "var(--g-accent, #ea580c)", textDecoration: "none", fontWeight: 600 }}>
                    {childCat.name}
                  </Link>
                </>
              )}
              <span style={{ color: "#94a3b8", opacity: 0.7 }}>&gt;</span>
              <span style={{ color: "#ffffff", fontWeight: 500, maxWidth: "340px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {post.title}
              </span>
            </nav>
          }
        />
      ) : (
        /* EDITORIAL HERO BANNER (Layout 1) */
        <div
          className="single-story-hero-banner"
          style={{
          position: "relative",
          width: "100%",
          minHeight: post.screenOptions?.banner === false ? "260px" : post.bannerHeight || "440px",
          background: "#080c14",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          overflow: "hidden"
        }}
      >
        {/* Background Banner Image */}
        {bannerImage && post.screenOptions?.banner !== false ? (
          <img
            src={bannerImage}
            alt={post.title}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              objectPosition: post.bannerPosition ? (post.bannerPosition.includes('%') ? `center ${post.bannerPosition}` : post.bannerPosition) : "center",
              zIndex: 1
            }}
          />
        ) : (
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "linear-gradient(135deg, var(--g-accent, rgba(234, 88, 12, 0.2)) 0%, rgba(15, 23, 42, 0.95) 100%)",
              zIndex: 1
            }}
          />
        )}

        {/* Localized Bottom/Left Gradient Overlay for perfect readability without dark overall mask */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(180deg, rgba(11, 15, 25, 0.45) 0%, rgba(11, 15, 25, 0.78) 55%, rgba(11, 15, 25, 0.98) 100%)",
            zIndex: 2
          }}
        />

        {/* Banner Content Container */}
        <div
          style={{
            position: "relative",
            zIndex: 3,
            maxWidth: "1280px",
            width: "100%",
            margin: "0 auto",
            padding: "48px 24px 36px",
            boxSizing: "border-box"
          }}
        >
          {/* 1. Breadcrumbs: Home > Stories > Chaalbaaz Neta > Part 03 */}
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
            <Link to="/" style={{ color: "#cbd5e1", textDecoration: "none", transition: "color 0.2s" }} onMouseEnter={(e) => e.target.style.color = '#fff'} onMouseLeave={(e) => e.target.style.color = '#cbd5e1'}>
              Home
            </Link>
            <span style={{ color: "#94a3b8", opacity: 0.7 }}>&gt;</span>
            <Link to="/stories" style={{ color: "#cbd5e1", textDecoration: "none", transition: "color 0.2s" }} onMouseEnter={(e) => e.target.style.color = '#fff'} onMouseLeave={(e) => e.target.style.color = '#cbd5e1'}>
              Stories
            </Link>
            {rootCat && (
              <>
                <span style={{ color: "#94a3b8", opacity: 0.7 }}>&gt;</span>
                <Link to={rootUrl} style={{ color: "var(--g-accent, #ea580c)", textDecoration: "none", fontWeight: 600 }}>
                  {rootCat.name}
                </Link>
              </>
            )}
            {parentCat && (
              <>
                <span style={{ color: "#94a3b8", opacity: 0.7 }}>&gt;</span>
                <Link to={parentUrl} style={{ color: "var(--g-accent, #ea580c)", textDecoration: "none", fontWeight: 600 }}>
                  {parentCat.name}
                </Link>
              </>
            )}
            {subCat && (
              <>
                <span style={{ color: "#94a3b8", opacity: 0.7 }}>&gt;</span>
                <Link to={subCatUrl} style={{ color: "var(--g-accent, #ea580c)", textDecoration: "none", fontWeight: 600 }}>
                  {subCat.name}
                </Link>
              </>
            )}
            {childCat && (
              <>
                <span style={{ color: "#94a3b8", opacity: 0.7 }}>&gt;</span>
                <Link to={childCatUrl} style={{ color: "var(--g-accent, #ea580c)", textDecoration: "none", fontWeight: 600 }}>
                  {childCat.name}
                </Link>
              </>
            )}
            <span style={{ color: "#94a3b8", opacity: 0.7 }}>&gt;</span>
            <span style={{ color: "#ffffff", fontWeight: 500, maxWidth: "340px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {post.title}
            </span>
          </nav>

          {/* 2. Category Tag: Chaalbaaz Neta • Part 03 */}
          <div style={{ marginBottom: "12px" }}>
            <span
              style={{
                display: "inline-block",
                padding: "4px 12px",
                borderRadius: "4px",
                background: "var(--primary-subtle, rgba(234, 88, 12, 0.15))",
                border: "1px solid var(--g-accent, #ea580c)",
                color: "var(--g-accent, #fb923c)",
                fontSize: "0.75rem",
                fontWeight: 700,
                letterSpacing: "0.1em",
                textTransform: "uppercase"
              }}
            >
              {categoryTagText}
            </span>
          </div>

          {/* 3. Story Headline: Eid Mubarak Part 03 */}
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
            {post.title}
          </h1>

          {/* 4. Excerpt: Discover the ancient folklore and family tales passed down through generations. */}
          {post.excerpt && post.screenOptions?.excerpt !== false && (
            <p
              style={{
                fontSize: "clamp(1.05rem, 2vw, 1.25rem)",
                lineHeight: 1.6,
                color: "#e2e8f0",
                margin: "0 0 20px 0",
                maxWidth: "860px",
                fontStyle: "italic",
                textShadow: "0 1px 4px rgba(0,0,0,0.6)"
              }}
            >
              {stripHtml(post.excerpt)}
            </p>
          )}

          {/* 5. Byline & Metadata inside Banner */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              gap: "14px",
              fontSize: "0.84rem",
              color: "#cbd5e1",
              paddingTop: "12px",
              borderTop: "1px solid rgba(255, 255, 255, 0.15)"
            }}
          >
            {authorName && (
              <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "#ffffff", fontWeight: 600 }}>
                <User size={14} color="var(--g-accent, #ea580c)" /> By {authorName}
              </span>
            )}
            {post.createdAt && (
              <span style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
                <Calendar size={14} color="var(--g-accent, #ea580c)" /> {formatDate(post.createdAt)}
              </span>
            )}
            <span style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
              <Clock size={14} color="var(--g-accent, #ea580c)" /> {readTime}
            </span>
            {post.views !== undefined && (
              <span style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
                <Eye size={14} color="var(--g-accent, #ea580c)" /> {post.views} views
              </span>
            )}
          </div>
        </div>
      </div>
      )}

      {/* Main Container: Reading Article (Left) + Sidebar (Right) - Layout 1 Only */}
      {(post.layout !== 'book' || post.screenOptions?.['post-layout'] === false) && (
        <div
          style={{
            maxWidth: "1280px",
            margin: "0 auto",
            padding: "36px 24px 80px",
            display: "flex",
            flexDirection: "row",
            gap: "48px",
            alignItems: "flex-start",
            boxSizing: "border-box"
          }}
          className="single-story-layout"
        >
          {/* Article Column (Main Reading Area) */}
          <article
            style={{
              flex: 1,
              minWidth: 0,
              maxWidth: "800px"
            }}
            className="single-story-article"
          >
            {/* Back Navigation Button */}
            <div style={{ marginBottom: "28px" }}>
              <Link
                to={subCatUrl}
                style={{
                  fontSize: "0.85rem",
                  color: "var(--g-accent, #ea580c)",
                  textDecoration: "none",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  fontWeight: 600,
                  padding: "6px 12px",
                  borderRadius: "6px",
                  background: "var(--primary-subtle, rgba(234, 88, 12, 0.08))",
                  border: "1px solid var(--g-accent, #ea580c)"
                }}
              >
                <ArrowLeft size={14} /> Back to {subCat ? subCat.name : parentCat ? parentCat.name : "Stories"}
              </Link>
            </div>

            {/* Body Article Content */}
            <div
              className="editorial-story-content"
              dangerouslySetInnerHTML={{ __html: formatStoryHtml(post.content) }}
              style={{
                fontSize: "1.12rem",
                lineHeight: 1.85,
                color: "#cbd5e1"
              }}
            />

            {/* Attached Video Section if videoUrl is present */}
            {post.videoUrl && post.screenOptions?.video !== false && (
              <div
                style={{
                  marginTop: "48px",
                  paddingTop: "32px",
                  borderTop: "1px solid var(--border-color, rgba(255,255,255,0.08))"
                }}
              >
                <h3
                  style={{
                    fontSize: "1.3rem",
                    marginBottom: "16px",
                    color: "var(--text-primary, #f1f5f9)",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    fontFamily: "'Playfair Display', Georgia, serif, sans-serif"
                  }}
                >
                  <Film size={20} color="var(--g-accent, #ea580c)" /> Attached Video Dispatch
                </h3>
                <div
                  style={{
                    borderRadius: "10px",
                    overflow: "hidden",
                    background: "#000",
                    boxShadow: "0 8px 30px rgba(0,0,0,0.5)"
                  }}
                >
                  <video
                    src={
                      post.videoUrl.startsWith("/uploads/")
                        ? `http://localhost:5001${post.videoUrl}`
                        : post.videoUrl
                    }
                    controls
                    style={{ width: "100%", maxHeight: "550px", display: "block" }}
                  >
                    Your browser does not support video playback.
                  </video>
                </div>
              </div>
            )}

            {/* Advanced Attributes & Tags */}
            {post.screenOptions?.tags !== false && (post.tags?.length > 0 || post.age?.length > 0 || post.maritalStatus) && (
              <div
                style={{
                  marginTop: "32px",
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
                {post.tags?.map((tag, idx) => (
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
                {post.age?.map((ageNum, idx) => (
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
                {post.maritalStatus && (
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
                    {post.maritalStatus}
                  </span>
                )}
              </div>
            )}

          </article>

          {/* RIGHT-SIDE SIDEBAR */}
          <SingleStorySidebar currentPost={post} />
        </div>
      )}

      {/* Full-Width Related Stories Section (Underneath Article & Sidebar) */}
      {relatedPosts.length > 0 && (
        <section
          style={{
            maxWidth: "1280px",
            margin: "0 auto",
            padding: "0 24px 80px",
            boxSizing: "border-box"
          }}
        >
          <div
            style={{
              borderTop: "2px solid var(--border-color, rgba(255, 255, 255, 0.08))",
              paddingTop: "36px",
              marginBottom: "28px"
            }}
          >
            <div
              style={{
                fontSize: "0.75rem",
                fontWeight: 700,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "var(--g-accent, #ea580c)",
                marginBottom: "4px"
              }}
            >
              Further Reading
            </div>
            <h3
              style={{
                fontSize: "1.55rem",
                fontWeight: 700,
                color: "var(--text-primary, #f1f5f9)",
                margin: 0,
                fontFamily: "'Playfair Display', Georgia, serif, sans-serif"
              }}
            >
              Related Stories & Dispatches
            </h3>
          </div>

          <div
            className="related-stories-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "24px"
            }}
          >
            {relatedPosts.map((relPost, idx) => (
              <StoryCard key={relPost._id || idx} post={relPost} />
            ))}
          </div>
        </section>
      )}

      <style>{`
        .editorial-story-content {
          overflow-wrap: break-word;
          word-wrap: break-word;
          word-break: break-word;
          text-align: justify;
          text-justify: inter-word;
        }
        .editorial-story-content p {
          margin-bottom: 24px;
          line-height: 1.95;
          letter-spacing: 0.012em;
          text-align: justify;
          text-justify: inter-word;
        }
        .editorial-story-content h1,
        .editorial-story-content h2,
        .editorial-story-content h3,
        .editorial-story-content h4,
        .editorial-story-content h5,
        .editorial-story-content h6 {
          font-family: 'Playfair Display', Georgia, serif;
          color: #f8fafc;
          line-height: 1.35;
          margin: 40px 0 16px;
        }
        .editorial-story-content h2 {
          font-size: 1.7rem;
          font-weight: 700;
          letter-spacing: -0.01em;
        }
        .editorial-story-content h3 {
          font-size: 1.35rem;
          font-weight: 600;
        }
        .editorial-story-content h4 {
          font-size: 1.25rem;
          font-weight: 700;
          color: var(--g-accent, #ea580c);
          border-left: 3px solid var(--g-accent, #ea580c);
          padding-left: 14px;
          margin: 32px 0 16px;
        }
        .editorial-story-content blockquote {
          border-left: 3px solid var(--g-accent, #ea580c);
          padding: 16px 24px;
          margin: 32px 0;
          background: var(--primary-subtle, rgba(234, 88, 12, 0.05));
          border-radius: 0 8px 8px 0;
          font-style: italic;
          color: #f1f5f9;
          font-size: 1.15rem;
          line-height: 1.7;
        }
        .editorial-story-content ul, .editorial-story-content ol {
          margin: 20px 0 28px 28px;
        }
        .editorial-story-content li {
          margin-bottom: 10px;
        }
        /* Images: strictly responsive matching content column width, centered, framed with subtle shadow & border */
        .editorial-story-content img {
          display: block !important;
          width: 100% !important;
          max-width: 100% !important;
          height: auto !important;
          max-height: 640px;
          margin: 36px auto !important;
          border-radius: 12px;
          box-shadow: 0 14px 40px rgba(0, 0, 0, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.08);
          clear: both;
          box-sizing: border-box !important;
          object-fit: cover;
        }
        .editorial-story-content figure,
        .editorial-story-content div:has(> img) {
          max-width: 100% !important;
          margin: 36px auto !important;
          text-align: center;
          clear: both;
        }
        .editorial-story-content figcaption {
          font-size: 0.85rem;
          color: #94a3b8;
          text-align: center;
          margin-top: -18px;
          margin-bottom: 24px;
          font-style: italic;
        }
        @media (max-width: 992px) {
          .related-stories-grid {
            grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)) !important;
          }
        }
        @media (max-width: 640px) {
          .related-stories-grid {
            grid-template-columns: 1fr !important;
          }
        }
        @media (max-width: 900px) {
          .single-story-layout {
            flex-direction: column !important;
            gap: 40px !important;
          }
          .single-story-right-sidebar {
            max-width: 100% !important;
            order: 2;
          }
          .single-story-article {
            order: 1;
            max-width: 100% !important;
          }
        }
      `}</style>
    </div>
  );
};

export default PostDetail;

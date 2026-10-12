import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import SmartImage from "../common/SmartImage";
import {
  Search,
  X,
  BookOpen,
  Calendar,
  Clock,
  Film,
  Image as ImageIcon,
  Play,
  ArrowRight,
  FolderTree
} from "lucide-react";
import { postAPI, videoAPI, categoryAPI } from "../../services/api";

const formatDate = (d) => {
  if (!d) return "";
  try {
    return new Date(d).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric"
    });
  } catch {
    return "";
  }
};

const calcReadTime = (text) => {
  if (!text) return "2 min read";
  const words = text.replace(/<[^>]+>/g, "").trim().split(/\\s+/).length;
  return `${Math.max(1, Math.ceil(words / 200))} min read`;
};

const EditorialSidebarSection = ({ title, icon: Icon, children }) => (
  <div
    style={{
      marginBottom: "24px",
      borderBottom: "1px solid var(--border-color, rgba(255, 255, 255, 0.08))",
      paddingBottom: "20px"
    }}
  >
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        marginBottom: "14px"
      }}
    >
      {Icon && <Icon size={14} color="var(--g-accent, #ea580c)" />}
      <h4
        style={{
          fontSize: "0.78rem",
          fontWeight: 700,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: "var(--text-primary, #f1f5f9)",
          margin: 0,
          fontFamily: "'Playfair Display', Georgia, serif, sans-serif"
        }}
      >
        {title}
      </h4>
    </div>
    <div>{children}</div>
  </div>
);

const StoriesSidebar = ({
  searchQuery = "",
  onSearchChange,
  searchPlaceholder = "Search stories...",
  isSearchActive = false,
  onClearSearch,
  scopeLabel = "All Stories",
  config = {}
}) => {
  const navigate = useNavigate();

  const {
    latestPostsCount = 5,
    videoCategoriesEnabled = true,
    galleryCategoriesEnabled = true,
    latestVideoEnabled = true
  } = config;

  const [latestPosts, setLatestPosts] = useState([]);
  const [videoCategories, setVideoCategories] = useState([]);
  const [galleryCategories, setGalleryCategories] = useState([]);
  const [latestVideo, setLatestVideo] = useState(null);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchSidebarData = async () => {
      try {
        const promises = [
          postAPI.getAll({ limit: latestPostsCount || 5, status: "published" }).catch(() => ({ posts: [] }))
        ];

        if (videoCategoriesEnabled) {
          promises.push(categoryAPI.getAll({ type: "video", isRoot: "true" }).catch(() => ({ categories: [] })));
        } else {
          promises.push(Promise.resolve({ categories: [] }));
        }

        if (galleryCategoriesEnabled) {
          promises.push(categoryAPI.getAll({ type: "gallery", isRoot: "true" }).catch(() => ({ categories: [] })));
        } else {
          promises.push(Promise.resolve({ categories: [] }));
        }

        if (latestVideoEnabled) {
          promises.push(videoAPI.getAll({ limit: 1, status: "published" }).catch(() => ({ videos: [] })));
        } else {
          promises.push(Promise.resolve({ videos: [] }));
        }

        const [postsRes, videoCatsRes, galleryCatsRes, videosRes] = await Promise.all(promises);

        if (!isMounted) return;

        setLatestPosts(postsRes.posts || []);
        setVideoCategories(videoCatsRes.categories || []);
        setGalleryCategories(galleryCatsRes.categories || []);
        if (videosRes.videos && videosRes.videos.length > 0) {
          setLatestVideo(videosRes.videos[0]);
        }
      } catch (err) {
        console.error("Error loading stories sidebar widgets:", err);
      } finally {
        if (isMounted) setLoadingData(false);
      }
    };

    fetchSidebarData();
    return () => {
      isMounted = false;
    };
  }, [latestPostsCount, videoCategoriesEnabled, galleryCategoriesEnabled, latestVideoEnabled]);

  return (
    <aside
      className="stories-left-sidebar"
      style={{
        width: "100%",
        maxWidth: "290px",
        flexShrink: 0,
        position: "sticky",
        top: "calc(var(--wp-admin-bar-height, 0px) + 88px)",
        alignSelf: "flex-start",
        zIndex: 10,
      }}
    >
      {/* Search Widget */}
      <div
        style={{
          background: "var(--bg-card, rgba(255, 255, 255, 0.03))",
          border: "1px solid var(--border-color, rgba(255, 255, 255, 0.08))",
          borderRadius: "10px",
          padding: "16px",
          marginBottom: "24px"
        }}
      >
        <div
          style={{
            marginBottom: "12px",
            display: "flex",
            flexDirection: "column",
            gap: "4px"
          }}
        >
          <span
            style={{
              fontSize: "0.72rem",
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "var(--g-accent, #ea580c)"
            }}
          >
            Search Stories
          </span>
          {scopeLabel && (
            <span
              style={{
                fontSize: "0.76rem",
                color: "var(--text-muted, #94a3b8)",
                fontWeight: 500,
                textTransform: "none",
                lineHeight: 1.3
              }}
            >
              {scopeLabel}
            </span>
          )}
        </div>

        <div style={{ position: "relative" }}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            style={{
              width: "100%",
              padding: "9px 34px 9px 34px",
              background: "var(--bg-secondary, rgba(0, 0, 0, 0.2))",
              border: "1px solid var(--border-color, rgba(255, 255, 255, 0.12))",
              borderRadius: "6px",
              color: "var(--text-primary, #f1f5f9)",
              fontSize: "0.85rem",
              outline: "none",
              boxSizing: "border-box"
            }}
          />
          <Search
            size={15}
            color="var(--text-muted, #94a3b8)"
            style={{
              position: "absolute",
              left: "10px",
              top: "50%",
              transform: "translateY(-50%)",
              pointerEvents: "none"
            }}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={onClearSearch}
              aria-label="Clear search"
              style={{
                position: "absolute",
                right: "8px",
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                color: "var(--text-muted, #94a3b8)",
                cursor: "pointer",
                padding: "2px"
              }}
            >
              <X size={15} />
            </button>
          )}
        </div>
      </div>

      {/* Latest 5 Posts */}
      <EditorialSidebarSection title="Recent Stories" icon={BookOpen}>
        {latestPosts.length === 0 ? (
          <p style={{ fontSize: "0.82rem", color: "var(--text-muted, #94a3b8)", margin: 0 }}>
            No stories published yet.
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {latestPosts.slice(0, 5).map((post) => {
              const postThumb = post.featuredImage || post.banner;
              const postUrl = post.category && post.subCategory
                ? `/stories/${post.category.slug || post.category}/${post.subCategory.slug || post.subCategory}/${post.slug}`
                : post.category
                ? `/stories/${post.category.slug || post.category}/${post.slug}`
                : `/stories/${post.slug}`;

              return (
                <Link
                  key={post._id || post.slug}
                  to={postUrl}
                  style={{
                    display: "flex",
                    gap: "10px",
                    textDecoration: "none",
                    alignItems: "flex-start",
                    color: "inherit"
                  }}
                  className="story-sidebar-item"
                >
                  <div
                    style={{
                      width: "60px",
                      height: "50px",
                      borderRadius: "6px",
                      background: "var(--bg-secondary, #1e293b)",
                      overflow: "hidden",
                      flexShrink: 0
                    }}
                  >
                    {postThumb ? (
                      <SmartImage
                        src={postThumb}
                        alt={post.title}
                        loading="lazy"
                        style={{ width: "100%", height: "100%" }}
                      />
                    ) : (
                      <div
                        style={{
                          width: "100%",
                          height: "100%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "var(--text-dim, #64748b)"
                        }}
                      >
                        <BookOpen size={18} />
                      </div>
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h5
                      style={{
                        fontSize: "0.82rem",
                        fontWeight: 600,
                        color: "var(--text-primary, #f1f5f9)",
                        margin: "0 0 4px 0",
                        lineHeight: 1.35,
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden"
                      }}
                    >
                      {post.title}
                    </h5>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        fontSize: "0.72rem",
                        color: "var(--text-muted, #94a3b8)"
                      }}
                    >
                      {post.createdAt && (
                        <span>{formatDate(post.createdAt)}</span>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </EditorialSidebarSection>

      {/* Video Categories */}
      {videoCategoriesEnabled && videoCategories.length > 0 && (
        <EditorialSidebarSection title="Video Channels" icon={Film}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
            {videoCategories.map((cat) => (
              <Link
                key={cat._id || cat.slug}
                to={`/videos/${cat.slug}`}
                style={{
                  fontSize: "0.75rem",
                  padding: "4px 8px",
                  borderRadius: "4px",
                  background: "var(--bg-secondary, rgba(255,255,255,0.04))",
                  border: "1px solid var(--border-color, rgba(255,255,255,0.08))",
                  color: "var(--text-primary, #e2e8f0)",
                  textDecoration: "none",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px"
                }}
              >
                <span>{cat.name}</span>
                {cat.videoCount !== undefined && (
                  <span style={{ fontSize: "0.68rem", color: "var(--text-muted, #94a3b8)" }}>
                    ({cat.videoCount})
                  </span>
                )}
              </Link>
            ))}
          </div>
        </EditorialSidebarSection>
      )}

      {/* Gallery Categories */}
      {galleryCategoriesEnabled && galleryCategories.length > 0 && (
        <EditorialSidebarSection title="Photo Galleries" icon={ImageIcon}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
            {galleryCategories.map((cat) => (
              <Link
                key={cat._id || cat.slug}
                to={`/galleries/${cat.slug}`}
                style={{
                  fontSize: "0.75rem",
                  padding: "4px 8px",
                  borderRadius: "4px",
                  background: "var(--bg-secondary, rgba(255,255,255,0.04))",
                  border: "1px solid var(--border-color, rgba(255,255,255,0.08))",
                  color: "var(--text-primary, #e2e8f0)",
                  textDecoration: "none"
                }}
              >
                {cat.name}
              </Link>
            ))}
          </div>
        </EditorialSidebarSection>
      )}

      {/* Latest Video Widget */}
      {latestVideoEnabled && latestVideo && (
        <EditorialSidebarSection title="Featured Video" icon={Film}>
          <Link
            to={`/video/${latestVideo.slug}`}
            style={{
              display: "block",
              textDecoration: "none",
              background: "var(--bg-card, rgba(255, 255, 255, 0.02))",
              borderRadius: "8px",
              overflow: "hidden",
              border: "1px solid var(--border-color, rgba(255, 255, 255, 0.06))"
            }}
          >
            <div
              style={{
                position: "relative",
                width: "100%",
                aspectRatio: "16 / 9",
                background: "#0f172a"
              }}
            >
              <SmartImage
                src={latestVideo.thumbnail || latestVideo.poster}
                alt={latestVideo.title}
                loading="lazy"
                style={{ width: "100%", height: "100%" }}
              />
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "rgba(0,0,0,0.3)"
                }}
              >
                <div
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "50%",
                    background: 'var(--primary-subtle, #ea580c)',
            border: '1px solid var(--g-accent, #ea580c)',
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: 'var(--g-accent, #ffffff)'
                  }}
                >
                  <Play size={14} fill="#fff" style={{ marginLeft: "2px" }} />
                </div>
              </div>
            </div>
            <div style={{ padding: "10px" }}>
              <h5
                style={{
                  fontSize: "0.82rem",
                  fontWeight: 600,
                  color: "var(--text-primary, #f1f5f9)",
                  margin: "0 0 4px 0",
                  lineHeight: 1.35,
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden"
                }}
              >
                {latestVideo.title}
              </h5>
              <span style={{ fontSize: "0.72rem", color: "var(--text-muted, #94a3b8)" }}>
                Watch video &rarr;
              </span>
            </div>
          </Link>
        </EditorialSidebarSection>
      )}
    </aside>
  );
};

export default StoriesSidebar;

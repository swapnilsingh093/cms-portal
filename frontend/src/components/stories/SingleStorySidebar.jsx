import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { BookOpen, Calendar, Clock, ChevronRight, Layers, FolderTree } from "lucide-react";
import { postAPI, categoryAPI } from "../../services/api";

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

const SingleStorySidebar = ({ currentPost }) => {
  const [relatedPosts, setRelatedPosts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const categoryId = currentPost?.category?._id || currentPost?.category;
  const subCategoryId = currentPost?.subCategory?._id || currentPost?.subCategory;
  const currentPostId = currentPost?._id;

  useEffect(() => {
    let isMounted = true;

    const fetchSidebarData = async () => {
      try {
        const promises = [];

        // 1. Related or latest posts
        if (subCategoryId) {
          promises.push(
            postAPI.getAll({ subCategory: subCategoryId, limit: 6, status: "published" }).catch(() => ({ posts: [] }))
          );
        } else if (categoryId) {
          promises.push(
            postAPI.getAll({ category: categoryId, limit: 6, status: "published" }).catch(() => ({ posts: [] }))
          );
        } else {
          promises.push(
            postAPI.getAll({ limit: 6, status: "published" }).catch(() => ({ posts: [] }))
          );
        }

        // 2. Story parent categories
        promises.push(
          categoryAPI.getAll({ type: "post", isRoot: "true" }).catch(() => ({ categories: [] }))
        );

        const [postsRes, catsRes] = await Promise.all(promises);

        if (!isMounted) return;

        // Filter out current post
        const filteredPosts = (postsRes.posts || []).filter(
          (p) => String(p._id) !== String(currentPostId)
        );
        setRelatedPosts(filteredPosts.slice(0, 5));
        setCategories(catsRes.categories || []);
      } catch (err) {
        console.error("Error loading single story sidebar:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchSidebarData();
    return () => {
      isMounted = false;
    };
  }, [categoryId, subCategoryId, currentPostId]);

  return (
    <aside
      className="single-story-right-sidebar"
      style={{
        width: "100%",
        maxWidth: "320px",
        flexShrink: 0,
        position: "sticky",
        top: "calc(var(--wp-admin-bar-height, 0px) + 88px)",
        alignSelf: "flex-start",
        zIndex: 10
      }}
    >
      {/* Author Bio / Publication Card */}
      <div
        style={{
          background: "var(--bg-card, rgba(255, 255, 255, 0.025))",
          border: "1px solid var(--border-color, rgba(255, 255, 255, 0.08))",
          borderRadius: "10px",
          padding: "20px",
          marginBottom: "28px"
        }}
      >
        <div
          style={{
            fontSize: "0.72rem",
            fontWeight: 700,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "var(--g-accent, #ea580c)",
            marginBottom: "6px"
          }}
        >
          Editorial Dispatch
        </div>
        <h4
          style={{
            fontSize: "1rem",
            fontWeight: 700,
            color: "var(--text-primary, #f1f5f9)",
            margin: "0 0 8px 0",
            fontFamily: "'Playfair Display', Georgia, serif, sans-serif"
          }}
        >
          Stories & Perspectives
        </h4>
        <p style={{ fontSize: "0.82rem", lineHeight: 1.5, color: "var(--text-muted, #94a3b8)", margin: 0 }}>
          Independent journalism, narratives, reports, and thoughtful editorial columns.
        </p>
      </div>

      {/* More from this Category / Section */}
      <div
        style={{
          marginBottom: "32px",
          borderBottom: "1px solid var(--border-color, rgba(255, 255, 255, 0.08))",
          paddingBottom: "24px"
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "16px"
          }}
        >
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
            {currentPost?.subCategory?.name
              ? `More in ${currentPost.subCategory.name}`
              : currentPost?.category?.name
              ? `More in ${currentPost.category.name}`
              : "Related Stories"}
          </h4>
        </div>

        {relatedPosts.length === 0 ? (
          <p style={{ fontSize: "0.82rem", color: "var(--text-muted, #94a3b8)", margin: 0 }}>
            No other stories in this topic yet.
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {relatedPosts.map((post) => {
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
                      width: "64px",
                      height: "52px",
                      borderRadius: "6px",
                      background: "var(--bg-secondary, #1e293b)",
                      overflow: "hidden",
                      flexShrink: 0
                    }}
                  >
                    {postThumb ? (
                      <img
                        src={postThumb}
                        alt={post.title}
                        loading="lazy"
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
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
                        <BookOpen size={16} />
                      </div>
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h5
                      style={{
                        fontSize: "0.84rem",
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
                      {post.createdAt && <span>{formatDate(post.createdAt)}</span>}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Story Categories Navigation */}
      {categories.length > 0 && (
        <div>
          <h4
            style={{
              fontSize: "0.78rem",
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "var(--text-primary, #f1f5f9)",
              margin: "0 0 14px 0",
              fontFamily: "'Playfair Display', Georgia, serif, sans-serif"
            }}
          >
            Explore Columns
          </h4>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {categories.map((cat) => (
              <Link
                key={cat._id || cat.slug}
                to={`/stories/${cat.slug}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "8px 12px",
                  borderRadius: "6px",
                  background: "var(--bg-card, rgba(255,255,255,0.02))",
                  border: "1px solid var(--border-color, rgba(255,255,255,0.06))",
                  color: "var(--text-primary, #e2e8f0)",
                  textDecoration: "none",
                  fontSize: "0.85rem",
                  fontWeight: 500,
                  transition: "all 0.2s ease"
                }}
              >
                <span>{cat.name}</span>
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted, #94a3b8)" }}>
                  {cat.storyCount ?? cat.postCount ?? 0} &rarr;
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
};

export default SingleStorySidebar;

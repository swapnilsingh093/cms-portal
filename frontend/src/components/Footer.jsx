import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { pageAPI, categoryAPI } from "../services/api";
import { useSiteSettings } from "../utils/themeHelper";
import { useAuth } from "../context/AuthContext";
import { Sparkles } from "lucide-react";

const Footer = ({ onNavigate }) => {
  const navigate = useNavigate();
  const { siteTitle, footerStyle = "standard" } = useSiteSettings();
  const { isAuthenticated, openAuthModal } = useAuth();
  const [pages, setPages] = useState([]);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [pagesRes, catRes] = await Promise.all([
          pageAPI.getAll({ status: "published" }),
          categoryAPI.getAll({ isRoot: "true" })
        ]);
        if (pagesRes.pages) setPages(pagesRes.pages);
        if (catRes.categories) setCategories(catRes.categories);
      } catch (err) {
        // silent fail on footer
      }
    };
    fetchData();
  }, []);

  const handleLinkClick = (type, slug) => {
    const targetUrl = type === "category" ? `/category/${slug}` : type === "page" ? `/${slug}` : `/${type}`;
    if (!isAuthenticated) {
      openAuthModal("login", "Please sign in or register to view this section", targetUrl);
      return;
    }
    if (onNavigate) {
      onNavigate(type, slug);
    } else {
      navigate(targetUrl);
    }
  };

  // Compact Single Row Style
  if (footerStyle === "compact") {
    return (
      <footer style={{
        background: "var(--theme-footer-bg, #090e18)",
        color: "var(--theme-footer-text, #94a3b8)",
        borderTop: "1px solid var(--border-color)",
        padding: "20px 24px",
        marginTop: "40px"
      }}>
        <div style={{
          maxWidth: "1400px",
          margin: "0 auto",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "16px",
          fontSize: "0.88rem"
        }}>
          {/* Brand */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{
              width: "28px",
              height: "28px",
              borderRadius: "6px",
              background: "var(--accent-gradient)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff"
            }}>
              <Sparkles size={16} />
            </div>
            <span style={{ fontWeight: 800, color: "var(--theme-heading, #ffffff)", fontSize: "1.05rem" }}>
              {siteTitle || "PORTAL CMS"}
            </span>
          </div>

          {/* Quick Nav Links */}
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "20px" }}>
            <span onClick={() => handleLinkClick("posts")} style={{ cursor: "pointer", color: "var(--theme-footer-text, #94a3b8)" }}>Stories</span>
            <span onClick={() => handleLinkClick("videos")} style={{ cursor: "pointer", color: "var(--theme-footer-text, #94a3b8)" }}>Videos</span>
            <span onClick={() => handleLinkClick("galleries")} style={{ cursor: "pointer", color: "var(--theme-footer-text, #94a3b8)" }}>Galleries</span>
            {pages.slice(0, 3).map((page) => (
              <span key={page._id} onClick={() => handleLinkClick("page", page.slug)} style={{ cursor: "pointer", color: "var(--theme-footer-text, #94a3b8)" }}>
                {page.title}
              </span>
            ))}
          </div>

          {/* Copyright */}
          <div style={{ opacity: 0.8, fontSize: "0.82rem" }}>
            © {new Date().getFullYear()} {siteTitle || "Modern Portal CMS"}.
          </div>
        </div>
      </footer>
    );
  }

  // Centered Branding Style
  if (footerStyle === "centered") {
    return (
      <footer style={{
        background: "var(--theme-footer-bg, #090e18)",
        color: "var(--theme-footer-text, #94a3b8)",
        borderTop: "1px solid var(--border-color)",
        padding: "45px 24px 30px",
        marginTop: "50px",
        textAlign: "center"
      }}>
        <div style={{ maxWidth: "800px", margin: "0 auto", display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" }}>
          <div style={{
            width: "42px",
            height: "42px",
            borderRadius: "10px",
            background: "var(--accent-gradient)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff"
          }}>
            <Sparkles size={22} />
          </div>
          <h3 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 800, fontSize: "1.3rem", color: "var(--theme-heading, #ffffff)", margin: 0 }}>
            {siteTitle || "PORTAL CMS"}
          </h3>
          <p style={{ color: "var(--theme-footer-text, #94a3b8)", opacity: 0.85, fontSize: "0.9rem", maxWidth: "550px", lineHeight: 1.6, margin: 0 }}>
            Modern cross-platform Content Management System built with Node.js, Express, MongoDB, and React. Portable, fast, and feature-rich.
          </p>

          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "20px", margin: "12px 0" }}>
            <span onClick={() => handleLinkClick("posts")} style={{ cursor: "pointer", color: "var(--theme-footer-text, #94a3b8)", fontSize: "0.9rem" }}>Stories</span>
            <span onClick={() => handleLinkClick("videos")} style={{ cursor: "pointer", color: "var(--theme-footer-text, #94a3b8)", fontSize: "0.9rem" }}>Videos</span>
            <span onClick={() => handleLinkClick("galleries")} style={{ cursor: "pointer", color: "var(--theme-footer-text, #94a3b8)", fontSize: "0.9rem" }}>Galleries</span>
            {categories.slice(0, 4).map((cat) => (
              <span key={cat._id} onClick={() => handleLinkClick("category", cat.slug)} style={{ cursor: "pointer", color: "var(--theme-footer-text, #94a3b8)", fontSize: "0.9rem" }}>
                {cat.name}
              </span>
            ))}
          </div>

          <div style={{ borderTop: "1px solid var(--border-color)", width: "100%", paddingTop: "18px", opacity: 0.75, fontSize: "0.82rem" }}>
            © {new Date().getFullYear()} {siteTitle || "Modern Portal CMS"}. All rights reserved.
          </div>
        </div>
      </footer>
    );
  }

  // Standard Multi-Column Style (Default)
  return (
    <footer style={{
      background: "var(--theme-footer-bg, #090e18)",
      color: "var(--theme-footer-text, #94a3b8)",
      borderTop: "1px solid var(--border-color)",
      padding: "50px 24px 30px",
      marginTop: "60px"
    }}>
      <div style={{
        maxWidth: "1400px",
        margin: "0 auto 40px auto",
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
        gap: "40px"
      }}>
        {/* Brand Column */}
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
            <div style={{
              width: "36px",
              height: "36px",
              borderRadius: "8px",
              background: "var(--accent-gradient)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff"
            }}>
              <Sparkles size={20} />
            </div>
            <div style={{ fontFamily: "Outfit, sans-serif", fontWeight: 800, fontSize: "1.2rem", color: "var(--theme-heading, #ffffff)" }}>
              {siteTitle || "PORTAL CMS"}
            </div>
          </div>
          <p style={{ color: "var(--theme-footer-text, #94a3b8)", opacity: 0.85, fontSize: "0.9rem", lineHeight: "1.6" }}>
            Modern cross-platform Content Management System built with Node.js, Express, MongoDB, and React. Portable, fast, and feature-rich.
          </p>
        </div>

        {/* Categories Column */}
        <div>
          <h4 style={{ fontSize: "0.95rem", marginBottom: "16px", color: "var(--theme-heading, #ffffff)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Featured Categories
          </h4>
          <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "10px", padding: 0 }}>
            {categories.slice(0, 5).map((cat) => (
              <li key={cat._id}>
                <span
                  onClick={() => handleLinkClick("category", cat.slug)}
                  style={{
                    color: "var(--theme-footer-text, #94a3b8)",
                    fontSize: "0.9rem",
                    cursor: "pointer",
                    transition: "color 0.2s"
                  }}
                  onMouseEnter={(e) => (e.target.style.color = "var(--theme-primary, #3b82f6)")}
                  onMouseLeave={(e) => (e.target.style.color = "var(--theme-footer-text, #94a3b8)")}
                >
                  {cat.name}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Media & Content Links */}
        <div>
          <h4 style={{ fontSize: "0.95rem", marginBottom: "16px", color: "var(--theme-heading, #ffffff)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Explore Media
          </h4>
          <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "10px", padding: 0 }}>
            <li>
              <span
                onClick={() => handleLinkClick("videos")}
                style={{ color: "var(--theme-footer-text, #94a3b8)", fontSize: "0.9rem", cursor: "pointer" }}
                onMouseEnter={(e) => (e.target.style.color = "var(--theme-primary, #3b82f6)")}
                onMouseLeave={(e) => (e.target.style.color = "var(--theme-footer-text, #94a3b8)")}
              >
                Videos Archive
              </span>
            </li>
            <li>
              <span
                onClick={() => handleLinkClick("galleries")}
                style={{ color: "var(--theme-footer-text, #94a3b8)", fontSize: "0.9rem", cursor: "pointer" }}
                onMouseEnter={(e) => (e.target.style.color = "var(--theme-primary, #3b82f6)")}
                onMouseLeave={(e) => (e.target.style.color = "var(--theme-footer-text, #94a3b8)")}
              >
                Photo Galleries
              </span>
            </li>
            <li>
              <span
                onClick={() => handleLinkClick("posts")}
                style={{ color: "var(--theme-footer-text, #94a3b8)", fontSize: "0.9rem", cursor: "pointer" }}
                onMouseEnter={(e) => (e.target.style.color = "var(--theme-primary, #3b82f6)")}
                onMouseLeave={(e) => (e.target.style.color = "var(--theme-footer-text, #94a3b8)")}
              >
                Stories & Articles
              </span>
            </li>
          </ul>
        </div>

        {/* Custom Pages Column */}
        <div>
          <h4 style={{ fontSize: "0.95rem", marginBottom: "16px", color: "var(--theme-heading, #ffffff)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Pages & Info
          </h4>
          <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "10px", padding: 0 }}>
            {pages.map((page) => (
              <li key={page._id}>
                <span
                  onClick={() => handleLinkClick("page", page.slug)}
                  style={{ color: "var(--theme-footer-text, #94a3b8)", fontSize: "0.9rem", cursor: "pointer" }}
                  onMouseEnter={(e) => (e.target.style.color = "var(--theme-primary, #3b82f6)")}
                  onMouseLeave={(e) => (e.target.style.color = "var(--theme-footer-text, #94a3b8)")}
                >
                  {page.title}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Bottom Bar */}
      <div style={{
        maxWidth: "1400px",
        margin: "0 auto",
        paddingTop: "20px",
        borderTop: "1px solid var(--border-color)",
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        justifyContent: "space-between",
        fontSize: "0.85rem",
        color: "var(--theme-footer-text, #94a3b8)",
        opacity: 0.8,
        gap: "12px"
      }}>
        <div>© {new Date().getFullYear()} {siteTitle || "Modern Portal CMS"}. Portable & Cross-Platform.</div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          Crafted for high performance and clean management
        </div>
      </div>
    </footer>
  );
};

export default Footer;

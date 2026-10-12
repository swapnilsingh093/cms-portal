import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSiteSettings } from '../../utils/themeHelper';
import {
  Gauge,
  Paintbrush,
  RefreshCw,
  MessageSquare,
  Plus,
  Edit3,
  Search,
  LogOut,
  User as UserIcon,
  LayoutDashboard,
  ExternalLink,
  Film,
  Image as ImageIcon,
  FileText,
  Sliders,
  FolderTree,
  Users
} from 'lucide-react';

/**
 * Determine dynamic edit action and target URL based on active route pathname
 */
export const getEditActionForPath = (pathname) => {
  if (!pathname) return { label: 'Edit Page', url: '/admin/pages/edit/home' };
  const p = pathname.replace(/\/+$/, '') || '/';

  // Check if active page component injected a custom edit target
  if (typeof window !== 'undefined' && window.__CURRENT_CMS_EDIT_CONTEXT__) {
    const ctx = window.__CURRENT_CMS_EDIT_CONTEXT__;
    if (ctx && ctx.url) {
      return {
        label: ctx.label || 'Edit Page',
        url: ctx.url
      };
    }
  }

  // 1. Home Page
  if (p === '/' || p === '') {
    return { label: 'Edit Page', url: '/admin/pages/edit/home' };
  }

  // 2. Videos Module
  // 4-level video detail: /videos/:parent/:sub/:child/:videoSlug
  const video4Match = p.match(/^\/videos\/[^/]+\/[^/]+\/[^/]+\/([^/]+)$/);
  if (video4Match) {
    return { label: 'Edit Video', url: `/admin/videos/edit/${video4Match[1]}` };
  }
  // 3-level video detail: /videos/:parent/:sub/:videoSlug
  const video3Match = p.match(/^\/videos\/[^/]+\/[^/]+\/([^/]+)$/);
  if (video3Match) {
    return { label: 'Edit Video', url: `/admin/videos/edit/${video3Match[1]}` };
  }
  // Single video detail: /video/:slug
  const videoSingleMatch = p.match(/^\/video\/([^/]+)$/);
  if (videoSingleMatch) {
    return { label: 'Edit Video', url: `/admin/videos/edit/${videoSingleMatch[1]}` };
  }
  // Videos archive page
  if (p === '/videos') {
    return { label: 'Edit Page', url: '/admin/pages/edit/videos' };
  }
  // Video categories: /videos/:catSlug or /videos/:parent/:sub
  if (p.startsWith('/videos/')) {
    const parts = p.split('/').filter(Boolean);
    const catSlug = parts[parts.length - 1];
    return { label: 'Edit Category', url: `/admin/videos/categories?search=${catSlug}` };
  }

  // 3. Stories / Posts Module
  // 4-level post detail: /stories/:parent/:sub/:child/:postSlug
  const post4Match = p.match(/^\/stories\/[^/]+\/[^/]+\/[^/]+\/([^/]+)$/);
  if (post4Match) {
    return { label: 'Edit Post', url: `/admin/posts/edit/${post4Match[1]}` };
  }
  // 3-level post detail: /stories/:parent/:sub/:postSlug
  const post3Match = p.match(/^\/stories\/[^/]+\/[^/]+\/([^/]+)$/);
  if (post3Match) {
    return { label: 'Edit Post', url: `/admin/posts/edit/${post3Match[1]}` };
  }
  // Single post detail: /post/:slug or /story/:slug
  const postSingleMatch = p.match(/^\/(?:post|story)\/([^/]+)$/);
  if (postSingleMatch) {
    return { label: 'Edit Post', url: `/admin/posts/edit/${postSingleMatch[1]}` };
  }
  // Stories archive page
  if (p === '/stories' || p === '/posts') {
    return { label: 'Edit Page', url: '/admin/pages/edit/stories' };
  }
  // Story categories: /stories/:catSlug or /stories/:parent/:sub
  if (p.startsWith('/stories/')) {
    const parts = p.split('/').filter(Boolean);
    const catSlug = parts[parts.length - 1];
    return { label: 'Edit Category', url: `/admin/posts/categories?search=${catSlug}` };
  }

  // 4. Galleries Module
  // 4-level gallery detail: /galleries/:parent/:sub/:child/:gallerySlug
  const gallery4Match = p.match(/^\/galleries\/[^/]+\/[^/]+\/[^/]+\/([^/]+)$/);
  if (gallery4Match) {
    return { label: 'Edit Gallery', url: `/admin/gallery/edit/${gallery4Match[1]}` };
  }
  // 3-level gallery detail: /galleries/:parent/:sub/:gallerySlug
  const gallery3Match = p.match(/^\/galleries\/[^/]+\/[^/]+\/([^/]+)$/);
  if (gallery3Match) {
    return { label: 'Edit Gallery', url: `/admin/gallery/edit/${gallery3Match[1]}` };
  }
  // Galleries archive page
  if (p === '/galleries' || p === '/gallery') {
    return { label: 'Edit Page', url: '/admin/pages/edit/galleries' };
  }
  // Gallery single detail: /gallery/:slug or /galleries/:slug
  const gallerySingleMatch = p.match(/^\/(?:gallery|galleries)\/([^/]+)$/);
  if (gallerySingleMatch) {
    return { label: 'Edit Gallery', url: `/admin/gallery/edit/${gallerySingleMatch[1]}` };
  }
  if (p.startsWith('/galleries/')) {
    const parts = p.split('/').filter(Boolean);
    const catSlug = parts[parts.length - 1];
    return { label: 'Edit Category', url: `/admin/gallery/categories?search=${catSlug}` };
  }

  // 5. Custom Pages
  const pageMatch = p.match(/^\/page\/([^/]+)$/) || p.match(/^\/([^/]+)$/);
  if (pageMatch && !['login', 'admin', 'forgot-password', 'reset-password'].includes(pageMatch[1])) {
    return { label: 'Edit Page', url: `/admin/pages/edit/${pageMatch[1]}` };
  }

  // 6. Generic Category View
  const catMatch = p.match(/^\/category\/([^/]+)$/);
  if (catMatch) {
    return { label: 'Edit Category', url: `/admin/posts/categories?search=${catMatch[1]}` };
  }

  // 7. Search Pages
  if (p === '/search' || p === '/advanced-search') {
    return { label: 'Edit Page', url: '/admin/pages' };
  }

  // Default fallback
  return { label: 'Edit Page', url: '/admin/pages/edit/home' };
};

const WordPressAdminBar = () => {
  const { user, isAuthenticated, isEditor, logout } = useAuth();
  const settings = useSiteSettings();
  const navigate = useNavigate();
  const location = useLocation();

  const [activeMenu, setActiveMenu] = useState(null);
  const [editContext, setEditContext] = useState(() => getEditActionForPath(location.pathname));

  // Check backend setting: showAdminBar (defaults to true)
  const isEnabled = settings.showAdminBar !== false;
  // Should render for logged in admin or editor (or logged in user when enabled)
  const shouldShow = isAuthenticated && isEditor && isEnabled;

  // Reactively track route changes and custom page edit context
  useEffect(() => {
    setEditContext(getEditActionForPath(location.pathname));

    const handleContextChange = () => {
      setEditContext(getEditActionForPath(location.pathname));
    };

    window.addEventListener('cms_edit_context_changed', handleContextChange);
    return () => {
      window.removeEventListener('cms_edit_context_changed', handleContextChange);
    };
  }, [location.pathname]);

  // Synchronize CSS variable and body class for layout spacing
  useEffect(() => {
    if (shouldShow) {
      document.documentElement.style.setProperty('--wp-admin-bar-height', '32px');
      document.body.classList.add('admin-bar');
    } else {
      document.documentElement.style.setProperty('--wp-admin-bar-height', '0px');
      document.body.classList.remove('admin-bar');
    }

    return () => {
      document.documentElement.style.setProperty('--wp-admin-bar-height', '0px');
      document.body.classList.remove('admin-bar');
    };
  }, [shouldShow]);

  if (!shouldShow) return null;

  const siteName = settings.siteTitle || 'hotBaby';
  const roleLabel = user?.role === 'admin' ? 'Super Admin' : user?.role === 'editor' ? 'Editor' : 'Member';

  const handleNav = (url) => {
    setActiveMenu(null);
    navigate(url);
  };

  return (
    <div
      id="wpadminbar"
      role="navigation"
      aria-label="Toolbar"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '32px',
        background: '#1d2327',
        color: '#c3c4c7',
        zIndex: 99999,
        fontSize: '13px',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif',
        userSelect: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0',
        borderBottom: '1px solid rgba(0,0,0,0.25)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
      }}
    >
      <style>{`
        #wpadminbar a, #wpadminbar button {
          color: #c3c4c7;
          text-decoration: none;
          font-family: inherit;
          font-size: 13px;
        }
        #wpadminbar .ab-item {
          display: flex;
          align-items: center;
          gap: 6px;
          height: 32px;
          padding: 0 10px;
          cursor: pointer;
          color: #f0f0f1;
          transition: background 0.1s ease, color 0.1s ease;
          border: none;
          background: transparent;
          white-space: nowrap;
        }
        #wpadminbar .ab-item:hover,
        #wpadminbar .ab-item.active {
          background: #2c3338;
          color: #72aee6;
        }
        #wpadminbar .ab-item:hover svg,
        #wpadminbar .ab-item.active svg {
          color: #72aee6;
        }
        #wpadminbar .ab-submenu {
          position: absolute;
          top: 32px;
          left: 0;
          background: #2c3338;
          min-width: 180px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.4);
          padding: 5px 0;
          z-index: 100000;
          border-radius: 0 0 3px 3px;
          animation: wpBarFadeIn 0.12s ease-out;
        }
        #wpadminbar .ab-sub-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 14px;
          color: #c3c4c7;
          text-decoration: none;
          cursor: pointer;
          font-size: 13px;
          line-height: 1.4;
          transition: background 0.1s, color 0.1s;
        }
        #wpadminbar .ab-sub-item:hover {
          background: #2271b1;
          color: #ffffff;
        }
        #wpadminbar .ab-sub-item svg {
          color: inherit;
        }
        @keyframes wpBarFadeIn {
          from { opacity: 0; transform: translateY(-3px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* LEFT SECTION (WordPress Items) */}
      <div style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
        {/* 1. WordPress Logo */}
        <div
          style={{ position: 'relative' }}
          onMouseEnter={() => setActiveMenu('wp-logo')}
          onMouseLeave={() => setActiveMenu(null)}
        >
          <button
            type="button"
            className={`ab-item ${activeMenu === 'wp-logo' ? 'active' : ''}`}
            onClick={() => handleNav('/admin')}
            title="About CMS Portal"
            style={{ padding: '0 10px', height: '32px' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style={{ opacity: 0.9 }}>
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1.07 15.65L7.26 8.35c.44-.02.86-.05 1.25-.05.35 0 .7.02 1.05.05l2.44 6.7 1.83-5.26-1.32-3.69c.39-.03.78-.05 1.15-.05.42 0 .81.02 1.21.05l-3.94 11.55zm5.13-1.89l2.25-6.52c.22.84.34 1.73.34 2.65 0 2.22-.68 4.29-1.84 5.99-.25-.7-.5-1.42-.75-2.12zM3.86 12c0-1.89.65-3.63 1.74-5.02l3.75 10.28C5.64 16.03 3.86 14.21 3.86 12zm8.14 8.14c-1.28 0-2.49-.31-3.56-.86l3.41-9.92 3.49 9.54c-1.04.79-2.34 1.24-3.74 1.24z" />
            </svg>
          </button>
          {activeMenu === 'wp-logo' && (
            <div className="ab-submenu">
              <div className="ab-sub-item" onClick={() => handleNav('/admin')}>
                <LayoutDashboard size={14} /> About CMS Portal
              </div>
              <div className="ab-sub-item" onClick={() => handleNav('/admin/settings')}>
                <Sliders size={14} /> Settings & Config
              </div>
              <div className="ab-sub-item" onClick={() => handleNav('/admin/theme')}>
                <Paintbrush size={14} /> Documentation
              </div>
              <div className="ab-sub-item" onClick={() => handleNav('/admin')}>
                <ExternalLink size={14} /> Support & Feedback
              </div>
            </div>
          )}
        </div>

        {/* 2. Site Name with Dashboard Speedometer icon */}
        <div
          style={{ position: 'relative' }}
          onMouseEnter={() => setActiveMenu('site-name')}
          onMouseLeave={() => setActiveMenu(null)}
        >
          <button
            type="button"
            className={`ab-item ${activeMenu === 'site-name' ? 'active' : ''}`}
            onClick={() => handleNav('/admin')}
            style={{ fontWeight: 600, color: '#f0f0f1' }}
          >
            <Gauge size={15} style={{ opacity: 0.9 }} />
            <span>{siteName}</span>
          </button>
          {activeMenu === 'site-name' && (
            <div className="ab-submenu">
              <div className="ab-sub-item" onClick={() => handleNav('/admin')}>
                <LayoutDashboard size={14} /> Dashboard
              </div>
              <div className="ab-sub-item" onClick={() => handleNav('/admin/theme')}>
                <Paintbrush size={14} /> Themes
              </div>
              <div className="ab-sub-item" onClick={() => handleNav('/admin/menus')}>
                <FolderTree size={14} /> Menus
              </div>
              <div className="ab-sub-item" onClick={() => handleNav('/admin/theme/options')}>
                <Sliders size={14} /> Theme Options
              </div>
            </div>
          )}
        </div>

        {/* 3. Customize icon */}
        <button
          type="button"
          className="ab-item"
          onClick={() => handleNav('/admin/theme')}
          title="Customize Theme"
        >
          <Paintbrush size={14} style={{ opacity: 0.85 }} />
          <span>Customize</span>
        </button>

        {/* 4. Updates Sync Icon + Count (13) */}
        <button
          type="button"
          className="ab-item"
          onClick={() => handleNav('/admin/media')}
          title="Media Library & Updates"
        >
          <RefreshCw size={14} style={{ opacity: 0.85 }} />
          <span style={{ fontSize: '12px', fontWeight: 600, opacity: 0.9 }}>13</span>
        </button>

        {/* 5. Comments Icon + Count (0) */}
        <button
          type="button"
          className="ab-item"
          onClick={() => handleNav('/admin')}
          title="Comments"
        >
          <MessageSquare size={14} style={{ opacity: 0.85 }} />
          <span style={{ fontSize: '12px', fontWeight: 600, opacity: 0.9 }}>0</span>
        </button>

        {/* 6. + New Dropdown */}
        <div
          style={{ position: 'relative' }}
          onMouseEnter={() => setActiveMenu('new-menu')}
          onMouseLeave={() => setActiveMenu(null)}
        >
          <button
            type="button"
            className={`ab-item ${activeMenu === 'new-menu' ? 'active' : ''}`}
            onClick={() => handleNav('/admin/posts/new')}
          >
            <Plus size={15} style={{ opacity: 0.9 }} />
            <span>New</span>
          </button>
          {activeMenu === 'new-menu' && (
            <div className="ab-submenu" style={{ minWidth: '160px' }}>
              <div className="ab-sub-item" onClick={() => handleNav('/admin/posts/new')}>
                <FileText size={14} /> Post
              </div>
              <div className="ab-sub-item" onClick={() => handleNav('/admin/videos/new')}>
                <Film size={14} /> Video
              </div>
              <div className="ab-sub-item" onClick={() => handleNav('/admin/gallery/new')}>
                <ImageIcon size={14} /> Gallery
              </div>
              <div className="ab-sub-item" onClick={() => handleNav('/admin/pages/new')}>
                <FileText size={14} /> Page
              </div>
              <div className="ab-sub-item" onClick={() => handleNav('/admin/media')}>
                <ImageIcon size={14} /> Media
              </div>
              <div className="ab-sub-item" onClick={() => handleNav('/admin/users')}>
                <Users size={14} /> User
              </div>
            </div>
          )}
        </div>

        {/* 7. DYNAMIC EDIT BUTTON (Edit Page, Edit Video, Edit Post, Edit Gallery, Edit Category) */}
        <button
          type="button"
          className="ab-item"
          onClick={() => handleNav(editContext.url)}
          title={`Edit this ${editContext.label.replace('Edit ', '')} in CMS Admin`}
          style={{
            color: '#72aee6',
            fontWeight: 600,
            borderLeft: '1px solid rgba(255,255,255,0.08)'
          }}
        >
          <Edit3 size={14} style={{ color: '#72aee6' }} />
          <span>{editContext.label}</span>
        </button>
      </div>

      {/* RIGHT SECTION (Howdy, admin & Search) */}
      <div style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
        {/* User Account Dropdown */}
        <div
          style={{ position: 'relative' }}
          onMouseEnter={() => setActiveMenu('user-menu')}
          onMouseLeave={() => setActiveMenu(null)}
        >
          <button
            type="button"
            className={`ab-item ${activeMenu === 'user-menu' ? 'active' : ''}`}
            style={{ padding: '0 12px', gap: '8px' }}
          >
            <span>Howdy, <strong>{user?.name || 'admin'}</strong></span>
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt={user.name}
                style={{ width: '22px', height: '22px', borderRadius: '50%', objectFit: 'cover' }}
              />
            ) : (
              <div
                style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  background: '#64748b',
                  color: '#fff',
                  fontSize: '11px',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {(user?.name || 'A').charAt(0).toUpperCase()}
              </div>
            )}
          </button>

          {activeMenu === 'user-menu' && (
            <div
              className="ab-submenu"
              style={{
                right: 0,
                left: 'auto',
                minWidth: '220px',
                padding: '8px 0',
                borderTop: 'none'
              }}
            >
              {/* User Header Info Card */}
              <div
                style={{
                  padding: '10px 16px',
                  borderBottom: '1px solid rgba(255,255,255,0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  marginBottom: '6px'
                }}
              >
                <div
                  style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '50%',
                    background: 'var(--primary-color, #2271b1)',
                    color: '#fff',
                    fontSize: '14px',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {(user?.name || 'A').charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style={{ color: '#fff', fontWeight: 600, fontSize: '13px' }}>{user?.name}</div>
                  <div style={{ color: '#8c8f94', fontSize: '11px' }}>{roleLabel}</div>
                </div>
              </div>

              <div className="ab-sub-item" onClick={() => handleNav('/admin/profile')}>
                <UserIcon size={14} /> Edit Profile
              </div>
              <div className="ab-sub-item" onClick={() => handleNav('/admin')}>
                <LayoutDashboard size={14} /> Admin Dashboard
              </div>
              <div
                className="ab-sub-item"
                onClick={() => {
                  setActiveMenu(null);
                  logout();
                }}
                style={{ color: '#f87171' }}
              >
                <LogOut size={14} /> Log Out
              </div>
            </div>
          )}
        </div>

        {/* Search Icon */}
        <button
          type="button"
          className="ab-item"
          onClick={() => handleNav('/search')}
          title="Search"
          style={{ padding: '0 12px' }}
        >
          <Search size={14} style={{ opacity: 0.85 }} />
        </button>
      </div>
    </div>
  );
};

export default WordPressAdminBar;

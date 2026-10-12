import React, { useState, useRef } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Pin,
  FileText,
  Film,
  Image as ImageIcon,
  HardDrive,
  Paintbrush,
  Users,
  Settings,
  ExternalLink,
  ChevronRight,
  Layers,
  Palette
} from 'lucide-react';

const Sidebar = () => {
  const { user, isAdmin } = useAuth();
  const location = useLocation();
  const [hoveredNavId, setHoveredNavId] = useState(null);
  const hoverTimeoutRef = useRef(null);

  const handleMouseEnter = (secId) => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    setHoveredNavId(secId);
  };

  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = setTimeout(() => {
      setHoveredNavId(null);
    }, 140);
  };

  // Dashboard -> Posts -> Media (immediately after Posts) -> Pages -> Videos -> Galleries -> Appearance -> Users -> Content Types -> Settings
  const allNavSections = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      path: '/admin',
      exact: true,
      permissionModule: null // Always accessible
    },
    {
      id: 'posts',
      label: 'Posts',
      icon: Pin,
      path: '/admin/posts',
      permissionModule: 'posts',
      subItems: [
        { label: 'All Posts', path: '/admin/posts' },
        { label: 'Add New Post', path: '/admin/posts/new' },
        { label: 'Categories', path: '/admin/posts/categories' }
      ]
    },
    {
      id: 'media',
      label: 'Media',
      icon: HardDrive,
      path: '/admin/media',
      permissionModule: 'media'
    },
    {
      id: 'pages',
      label: 'Pages',
      icon: FileText,
      path: '/admin/pages',
      permissionModule: 'pages',
      subItems: [
        { label: 'All Pages', path: '/admin/pages' },
        { label: 'Add New Page', path: '/admin/pages/new' }
      ]
    },
    {
      id: 'videos',
      label: 'Videos',
      icon: Film,
      path: '/admin/videos',
      permissionModule: 'videos',
      subItems: [
        { label: 'All Videos', path: '/admin/videos' },
        { label: 'Add New Video', path: '/admin/videos/new' },
        { label: 'Categories', path: '/admin/videos/categories' },
        { label: 'Video Details Fields', path: '/admin/video-fields' }
      ]
    },
    {
      id: 'gallery',
      label: 'Galleries',
      icon: ImageIcon,
      path: '/admin/gallery',
      permissionModule: 'galleries',
      subItems: [
        { label: 'All Galleries', path: '/admin/gallery' },
        { label: 'Add New Gallery', path: '/admin/gallery/new' },
        { label: 'Categories', path: '/admin/gallery/categories' }
      ]
    },
    {
      id: 'appearance',
      label: 'Appearance',
      icon: Paintbrush,
      path: '/admin/appearance/theme-options',
      permissionModule: 'theme',
      subItems: [
        { label: 'Theme Options', path: '/admin/appearance/theme-options' },
        { label: 'Menus', path: '/admin/appearance/menus' }
      ]
    },
    {
      id: "users",
      label: "Users",
      icon: Users,
      path: "/admin/users",
      permissionModule: "users",
      subItems: [
        { label: "All Users", path: "/admin/users" },
        { label: "Your Profile", path: "/admin/profile" },
        { label: "Editor Permissions", path: "/admin/users/permissions" }
      ]
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      path: '/admin/settings',
      permissionModule: 'settings'
    }
  ];

  // Role-based visibility filtering:
  // Super Admin (admin) sees everything.
  // Editor only sees modules permitted in user.permissions (default: posts only).
  const navSections = allNavSections.filter((sec) => {
    if (isAdmin) return true;
    if (!sec.permissionModule) return true; // Dashboard

    if (user?.role === 'editor') {
      const perms = user?.permissions;
      if (!perms) {
        // Safe default: Editor has Posts only
        return sec.permissionModule === 'posts';
      }
      const modPerm = perms[sec.permissionModule];
      if (typeof modPerm === 'boolean') return modPerm;
      if (modPerm && typeof modPerm === 'object') {
        return modPerm.view !== false;
      }
      return sec.permissionModule === 'posts';
    }

    return false;
  });

  return (
    <aside
      style={{
        width: '160px',
        backgroundColor: 'var(--bg-sidebar)',
        borderRight: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        minHeight: 'calc(100vh - 60px)',
        userSelect: 'none',
        position: 'relative',
        zIndex: 50,
        overflow: 'visible'
      }}
    >
      <nav style={{ padding: '12px 6px', flex: 1, display: 'flex', flexDirection: 'column', gap: '2px', overflow: 'visible' }}>
        {navSections.map((sec) => {
          const Icon = sec.icon;
          const isSectionActive = sec.exact
            ? location.pathname === sec.path
            : location.pathname === sec.path || location.pathname.startsWith(sec.path + '/');
          const isHovered = hoveredNavId === sec.id;

          return (
            <div
              key={sec.id}
              style={{ marginBottom: '2px', position: 'relative' }}
              onMouseEnter={() => handleMouseEnter(sec.id)}
              onMouseLeave={handleMouseLeave}
            >
              <NavLink
                to={sec.path}
                end={sec.exact}
                style={({ isActive }) => {
                  const active = sec.exact ? isActive : isSectionActive;
                  return {
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    textDecoration: 'none',
                    fontSize: '12.5px',
                    fontWeight: active ? 600 : 500,
                    color: active ? '#ffffff' : (isHovered ? '#ffffff' : 'var(--text-secondary)'),
                    backgroundColor: active
                      ? 'var(--primary-subtle, rgba(59, 130, 246, 0.15))'
                      : (isHovered ? 'rgba(255, 255, 255, 0.05)' : 'transparent'),
                    borderLeft: active ? '3px solid var(--primary-color)' : '3px solid transparent',
                    transition: 'all 0.15s ease'
                  };
                }}
              >
                <Icon
                  size={15}
                  color={isSectionActive ? 'var(--primary-color)' : (isHovered ? 'var(--primary-color)' : 'var(--text-muted)')}
                />
                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {sec.label}
                </span>
                {sec.subItems && (
                  <ChevronRight
                    size={12}
                    style={{
                      transform: isSectionActive ? 'rotate(90deg)' : 'none',
                      transition: 'transform 0.2s ease',
                      opacity: isSectionActive ? 0.9 : 0.4
                    }}
                  />
                )}
              </NavLink>

              {/* Active Section Inline Subitems (stable, static - only when on that page) */}
              {isSectionActive && sec.subItems && (
                <div
                  style={{
                    paddingLeft: '22px',
                    paddingTop: '2px',
                    paddingBottom: '4px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1px'
                  }}
                >
                  {sec.subItems.map((sub) => {
                    const isSubActive = location.pathname === sub.path;
                    return (
                      <NavLink
                        key={sub.path}
                        to={sub.path}
                        end
                        style={{
                          display: 'block',
                          padding: '5px 8px',
                          borderRadius: '4px',
                          fontSize: '11.5px',
                          color: isSubActive ? '#38bdf8' : 'var(--text-muted)',
                          fontWeight: isSubActive ? 600 : 400,
                          backgroundColor: isSubActive ? 'rgba(56, 189, 248, 0.12)' : 'transparent',
                          textDecoration: 'none',
                          transition: 'all 0.15s ease',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                        onMouseEnter={(e) => {
                          if (location.pathname !== sub.path) {
                            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
                            e.currentTarget.style.color = '#ffffff';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (location.pathname !== sub.path) {
                            e.currentTarget.style.backgroundColor = 'transparent';
                            e.currentTarget.style.color = 'var(--text-muted)';
                          }
                        }}
                      >
                        {sub.label}
                      </NavLink>
                    );
                  })}
                </div>
              )}

              {/* WordPress-style Floating Submenu Card on Hover (for non-active sections) */}
              {!isSectionActive && isHovered && sec.subItems && sec.subItems.length > 0 && (
                <div
                  onMouseEnter={() => handleMouseEnter(sec.id)}
                  onMouseLeave={handleMouseLeave}
                  style={{
                    position: 'absolute',
                    left: '100%',
                    top: '-2px',
                    minWidth: '175px',
                    backgroundColor: '#0f172a',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '8px',
                    boxShadow: '0 12px 30px rgba(0, 0, 0, 0.6), 0 4px 10px rgba(0, 0, 0, 0.4)',
                    padding: '6px',
                    zIndex: 99999,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '2px',
                    marginLeft: '8px',
                    pointerEvents: 'auto'
                  }}
                >
                  {/* Invisible bridge so mouse can travel across the margin gap */}
                  <div
                    style={{
                      position: 'absolute',
                      right: '100%',
                      top: 0,
                      width: '12px',
                      height: '100%'
                    }}
                  />
                  {/* Flyout Title */}
                  <div
                    style={{
                      padding: '5px 10px 6px',
                      fontSize: '11px',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      color: 'var(--primary-color, #38bdf8)',
                      borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                      marginBottom: '4px'
                    }}
                  >
                    {sec.label}
                  </div>
                  {sec.subItems.map((sub) => {
                    const isSubActive = location.pathname === sub.path;
                    return (
                      <NavLink
                        key={sub.path}
                        to={sub.path}
                        end
                        style={{
                          display: 'block',
                          padding: '6px 10px',
                          borderRadius: '5px',
                          fontSize: '12px',
                          color: isSubActive ? '#38bdf8' : '#e2e8f0',
                          fontWeight: isSubActive ? 600 : 500,
                          backgroundColor: isSubActive ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
                          textDecoration: 'none',
                          transition: 'all 0.12s ease',
                          whiteSpace: 'nowrap'
                        }}
                        onMouseEnter={(e) => {
                          if (!isSubActive) {
                            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
                            e.currentTarget.style.color = '#ffffff';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isSubActive) {
                            e.currentTarget.style.backgroundColor = 'transparent';
                            e.currentTarget.style.color = '#e2e8f0';
                          }
                        }}
                      >
                        {sub.label}
                      </NavLink>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Sidebar Footer Link */}
      <div style={{ padding: '10px 8px', borderTop: '1px solid var(--border-color)' }}>
        <a
          href="/"
          target="_blank"
          rel="noreferrer"
          className="button button-neutral button-small"
          style={{ width: '100%', justifyContent: 'center', fontSize: '11.5px', padding: '5px 8px' }}
        >
          <ExternalLink size={12} /> Visit Site
        </a>
      </div>
    </aside>
  );
};

export default Sidebar;

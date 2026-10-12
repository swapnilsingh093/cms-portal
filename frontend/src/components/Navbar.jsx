import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSiteSettings } from '../utils/themeHelper';
import { menuAPI } from '../services/api';
import {
  Sparkles,
  Search,
  Menu as MenuIcon,
  X,
  ChevronDown,
  LayoutDashboard,
  LogOut,
  User as UserIcon,
  ExternalLink
} from 'lucide-react';

const Navbar = ({ activeTab, currentSlug, onNavigate, onOpenAuth }) => {
  const { user, logout, isEditor, isAuthenticated, openAuthModal } = useAuth();
  const settings = useSiteSettings();
  const { siteTitle, tagline, logoUrl, stickyHeader } = settings;
  const navigate = useNavigate();
  const location = useLocation();

  // Hide duplicate user dropdown in header when WordPress Admin Bar is already showing at top
  const isAdminBarShowing = isAuthenticated && isEditor && settings.showAdminBar !== false;

  const [menuItems, setMenuItems] = useState([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch backend-driven menu data
  useEffect(() => {
    const fetchHeaderMenu = async () => {
      try {
        const res = await menuAPI.getByLocation('header');
        if (res.menu && res.menu.items && res.menu.items.length > 0) {
          // Sort items by order
          const sorted = [...res.menu.items].sort((a, b) => (a.order || 0) - (b.order || 0));
          setMenuItems(sorted);
        } else {
          // Fallback to all menus if location query returned empty
          const allRes = await menuAPI.getAll();
          const activeHeader = (allRes.menus || []).find(m => m.location === 'header' && m.isActive);
          if (activeHeader && activeHeader.items) {
            setMenuItems([...activeHeader.items].sort((a, b) => (a.order || 0) - (b.order || 0)));
          }
        }
      } catch (err) {
        console.error('Navbar header menu load error:', err.message);
      }
    };

    fetchHeaderMenu();
  }, [location.pathname]);

  const handleItemClick = (item) => {
    setActiveDropdown(null);
    setMobileMenuOpen(false);

    if (!item.url) return;

    if (item.url.startsWith("http://") || item.url.startsWith("https://")) {
      window.open(item.url, item.target || "_blank", "noreferrer");
      return;
    }

    // Unauthenticated visitors can only stay on homepage; any inner link requires login/register
    if (!isAuthenticated && item.url !== "/") {
      openAuthModal("login", `Sign in or register to access ${item.title || "this section"}`, item.url);
      return;
    }

    navigate(item.url);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      const searchTarget = `/search?q=${encodeURIComponent(searchQuery.trim())}`;
      if (!isAuthenticated) {
        openAuthModal("login", "Sign in or register to search content", searchTarget);
        return;
      }
      navigate(searchTarget);
      setMobileMenuOpen(false);
    }
  };

  const isItemActive = (url) => {
    if (!url) return false;
    if (url === '/') return location.pathname === '/';
    return location.pathname === url || location.pathname.startsWith(url + '/');
  };

  return (
    <header
      style={{
        position: stickyHeader === false ? "relative" : "sticky",
        top: "var(--wp-admin-bar-height, 0px)",
        transition: "top 0.15s ease",
        zIndex: 100,
        background: "var(--theme-header-surface, var(--theme-header-bg, rgba(10, 13, 20, 0.85)))",
        backdropFilter: "var(--theme-header-backdrop, blur(16px))",
        borderBottom: "1px solid var(--border-color)",
        padding: "0 24px"
      }}
    >
      <div
        style={{
          maxWidth: "1400px",
          margin: "0 auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: "var(--theme-header-height, 72px)",
          gap: "20px"
        }}
      >
        {/* Brand / Logo */}
        <div
          onClick={() => navigate('/')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            cursor: 'pointer'
          }}
        >
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={siteTitle || 'PORTAL CMS'}
              style={{ width: '40px', height: '40px', borderRadius: '10px', objectFit: 'cover' }}
            />
          ) : (
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'var(--accent-gradient)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                boxShadow: '0 4px 15px var(--g-accent, rgba(99, 102, 241, 0.4))'
              }}
            >
              <Sparkles size={22} />
            </div>
          )}
          <div>
            <div
              style={{
                fontFamily: 'Outfit, sans-serif',
                fontWeight: 800,
                fontSize: '1.25rem',
                letterSpacing: '-0.02em',
                lineHeight: 1.1,
                color: 'var(--theme-header-text, var(--text-main, #f8fafc))'
              }}
            >
              {siteTitle || 'PORTAL CMS'}
            </div>
            {tagline && (
              <div
                style={{
                  fontSize: '0.65rem',
                  color: 'var(--theme-header-text, var(--text-dim, #64748b))',
                  opacity: 0.75,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase'
                }}
              >
                {tagline}
              </div>
            )}
          </div>
        </div>

        {/* Desktop Navigation Links — 100% Backend-Driven from Menu System */}
        <nav
          style={{ display: 'none', alignItems: 'center', gap: '20px' }}
          className="desktop-nav"
        >
          {menuItems.map((item) => {
            const hasChildren = item.children && item.children.length > 0;
            const active = isItemActive(item.url);

            return (
              <div
                key={item._id || item.title}
                style={{ position: 'relative' }}
                onMouseEnter={() => hasChildren && setActiveDropdown(item._id || item.title)}
                onMouseLeave={() => hasChildren && setActiveDropdown(null)}
              >
                <button
                  type="button"
                  onClick={() => handleItemClick(item)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: active ? 'var(--g-accent, #818cf8)' : 'var(--theme-header-text, var(--text-main, #f8fafc))',
                    fontWeight: active ? 700 : 500,
                    fontSize: '0.92rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    cursor: 'pointer',
                    padding: '8px 4px',
                    transition: 'color 0.15s'
                  }}
                >
                  <span>{item.title}</span>
                  {hasChildren && (
                    <ChevronDown size={14} style={{ opacity: 0.7 }} />
                  )}
                  {item.target === '_blank' && (
                    <ExternalLink size={12} style={{ opacity: 0.6 }} />
                  )}
                </button>

                {/* Dropdown Menu for Sub-items */}
                {hasChildren && activeDropdown === (item._id || item.title) && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      minWidth: '200px',
                      background: 'var(--bg-secondary, #111827)',
                      border: '1px solid var(--border-color, #22324f)',
                      borderRadius: 'var(--radius-sm, 8px)',
                      boxShadow: 'var(--shadow-md, 0 10px 25px -4px rgba(0,0,0,0.5))',
                      padding: '8px 0',
                      zIndex: 200,
                      marginTop: '4px',
                      animation: 'fadeIn 0.15s ease'
                    }}
                  >
                    {item.children.map((subItem) => (
                      <div
                        key={subItem._id || subItem.title}
                        onClick={() => handleItemClick(subItem)}
                        style={{
                          padding: '8px 16px',
                          fontSize: '0.88rem',
                          color: isItemActive(subItem.url) ? 'var(--g-accent, #818cf8)' : 'var(--text-main, #f8fafc)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          transition: 'background 0.15s'
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--g-accent, rgba(99, 102, 241, 0.15))')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                      >
                        <span>{subItem.title}</span>
                        {subItem.target === '_blank' && (
                          <ExternalLink size={12} style={{ opacity: 0.5 }} />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Search Bar & User Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <form
            onSubmit={handleSearchSubmit}
            style={{ position: 'relative', display: 'none' }}
            className="search-container"
          >
            <Search
              size={16}
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-dim)'
              }}
            />
            <input
              type="text"
              placeholder="Search videos, stories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-full)',
                padding: '8px 14px 8px 36px',
                color: '#fff',
                fontSize: '0.85rem',
                width: '190px',
                outline: 'none',
                transition: 'width 0.2s'
              }}
              onFocus={(e) => (e.target.style.width = '240px')}
              onBlur={(e) => (e.target.style.width = '190px')}
            />
          </form>

          {/* User Auth Info / Login Trigger */}
          {user ? (
            <div style={{ position: 'relative' }}>
              <div
                onClick={() => {
                  if (!isAdminBarShowing) {
                    setUserDropdownOpen(!userDropdownOpen);
                  }
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: isAdminBarShowing ? '4px 10px 4px 6px' : '4px 12px 4px 6px',
                  background: 'rgba(255, 255, 255, 0.06)',
                  borderRadius: 'var(--radius-full)',
                  border: '1px solid var(--border-color)',
                  cursor: isAdminBarShowing ? 'default' : 'pointer',
                  userSelect: 'none',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => {
                  if (!isAdminBarShowing) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                }}
                onMouseLeave={(e) => {
                  if (!isAdminBarShowing) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
                }}
              >
                <div
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    background: user.role === 'admin' ? 'linear-gradient(135deg, #7c3aed, #3b82f6)' : 'var(--primary-color)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    color: '#fff'
                  }}
                >
                  {user.name?.charAt(0).toUpperCase()}
                </div>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary, #fff)' }}>{user.name}</span>
                {!isAdminBarShowing && (
                  <ChevronDown size={14} style={{ color: 'var(--text-dim)', transform: userDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                )}
              </div>

              {/* User Dropdown Menu (only active when admin bar is off or for non-admin viewers) */}
              {!isAdminBarShowing && userDropdownOpen && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 'calc(100% + 8px)',
                      right: 0,
                      minWidth: '220px',
                      background: 'var(--bg-card, #111827)',
                      border: '1px solid var(--border-color, rgba(255, 255, 255, 0.12))',
                      borderRadius: '12px',
                      boxShadow: '0 15px 35px rgba(0, 0, 0, 0.7)',
                      padding: '8px',
                      zIndex: 1000,
                      animation: 'fadeIn 0.15s ease-out'
                    }}
                  >
                    <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))', marginBottom: '6px' }}>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#fff' }}>{user.name}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted, #94a3b8)', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.email}</div>
                      <span style={{ display: 'inline-block', marginTop: '6px', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', padding: '2px 8px', borderRadius: '10px', background: user.role === 'admin' ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255, 255, 255, 0.08)', color: user.role === 'admin' ? '#818cf8' : '#cbd5e1' }}>
                        {user.role}
                      </span>
                    </div>

                    <div
                      onClick={() => {
                        setUserDropdownOpen(false);
                        navigate('/profile');
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '9px',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        fontSize: '0.86rem',
                        color: '#f1f5f9',
                        cursor: 'pointer',
                        transition: 'background 0.15s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <UserIcon size={15} color="var(--accent-primary, #6366f1)" />
                      <span>My Profile</span>
                    </div>

                    {isEditor && (
                      <div
                        onClick={() => {
                          setUserDropdownOpen(false);
                          navigate('/admin');
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '9px',
                          padding: '8px 12px',
                          borderRadius: '8px',
                          fontSize: '0.86rem',
                          color: '#f1f5f9',
                          cursor: 'pointer',
                          transition: 'background 0.15s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                        <LayoutDashboard size={15} color="#38bdf8" />
                        <span>Admin Dashboard</span>
                      </div>
                    )}

                    <div style={{ height: '1px', background: 'var(--border-color, rgba(255, 255, 255, 0.08))', margin: '6px 0' }} />

                    <div
                      onClick={() => {
                        setUserDropdownOpen(false);
                        logout();
                        navigate('/');
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '9px',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        fontSize: '0.86rem',
                        color: '#f87171',
                        cursor: 'pointer',
                        transition: 'background 0.15s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <LogOut size={15} />
                      <span>Log Out</span>
                    </div>
                  </div>
                )}
              </div>
          ) : (
            <button
              onClick={() => {
                if (onOpenAuth) onOpenAuth();
                else openAuthModal('login');
              }}
              className="button button-secondary button-small"
              style={{ fontSize: '0.85rem' }}
            >
              <UserIcon size={15} /> Sign In / Register
            </button>
          )}

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-main)',
              display: 'flex',
              padding: '6px',
              cursor: 'pointer'
            }}
            className="mobile-menu-btn"
          >
            {mobileMenuOpen ? <X size={24} /> : <MenuIcon size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div
          style={{
            padding: '16px 0 24px',
            borderTop: '1px solid var(--border-color)',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}
        >
          {menuItems.map((item) => (
            <div key={item._id || item.title}>
              <div
                onClick={() => handleItemClick(item)}
                style={{
                  padding: '10px 16px',
                  borderRadius: 'var(--radius-sm)',
                  background: isItemActive(item.url) ? 'var(--g-accent, rgba(99, 102, 241, 0.15))' : 'transparent',
                  color: isItemActive(item.url) ? 'var(--g-accent, #818cf8)' : 'var(--text-main)',
                  fontWeight: isItemActive(item.url) ? 700 : 500,
                  cursor: 'pointer'
                }}
              >
                {item.title}
              </div>
              {item.children && item.children.length > 0 && (
                <div style={{ paddingLeft: '24px', display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '4px' }}>
                  {item.children.map((sub) => (
                    <div
                      key={sub._id || sub.title}
                      onClick={() => handleItemClick(sub)}
                      style={{
                        padding: '6px 12px',
                        fontSize: '0.88rem',
                        color: isItemActive(sub.url) ? 'var(--g-accent, #818cf8)' : 'var(--text-muted)',
                        cursor: 'pointer'
                      }}
                    >
                      {sub.title}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          {user && (
            <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border-color, rgba(255,255,255,0.08))' }}>
              <div
                onClick={() => {
                  setMobileMenuOpen(false);
                  navigate('/profile');
                }}
                style={{ padding: '10px 16px', borderRadius: 'var(--radius-sm)', color: '#f1f5f9', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}
              >
                <UserIcon size={16} color="var(--accent-primary, #6366f1)" /> My Profile
              </div>
              {isEditor && (
                <div
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigate('/admin');
                  }}
                  style={{ padding: '10px 16px', borderRadius: 'var(--radius-sm)', color: '#38bdf8', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}
                >
                  <LayoutDashboard size={16} /> Admin Dashboard
                </div>
              )}
              <div
                onClick={() => {
                  setMobileMenuOpen(false);
                  logout();
                  navigate('/');
                }}
                style={{ padding: '10px 16px', borderRadius: 'var(--radius-sm)', color: '#f87171', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}
              >
                <LogOut size={16} /> Log Out
              </div>
            </div>
          )}
        </div>
      )}

      <style>{`
        @media (min-width: 860px) {
          .desktop-nav { display: flex !important; }
          .search-container { display: block !important; }
          .mobile-menu-btn { display: none !important; }
        }
      `}</style>
    </header>
  );
};

export default Navbar;

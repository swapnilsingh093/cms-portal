import React, { useState } from 'react';
import { Link, useNavigate, Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useAuth } from '../../context/AuthContext';
import { useSiteSettings } from '../../utils/themeHelper';
import {
  ExternalLink,
  LogOut,
  Plus,
  Compass,
  Film,
  Image as ImageIcon,
  FileText,
  HardDrive,
  User as UserIcon,
  ChevronDown
} from 'lucide-react';

const AdminLayout = ({ children }) => {
  const { siteTitle } = useSiteSettings();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [newDropdownOpen, setNewDropdownOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--bg-main)' }}>
      {/* Top Header Bar */}
      <header
        style={{
          height: '60px',
          backgroundColor: 'var(--bg-topbar)',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
          position: 'sticky',
          top: 0,
          zIndex: 1000
        }}
      >
        {/* Left Side: Brand, Visit Site, + New Dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <Link
            to="/admin"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              textDecoration: 'none'
            }}
          >
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'var(--accent-gradient)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff'
              }}
            >
              <Compass size={18} />
            </div>
            <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
              {siteTitle || 'CMS Portal'}
            </span>
          </Link>

          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              color: 'var(--text-secondary)',
              fontSize: '13px',
              textDecoration: 'none',
              padding: '5px 10px',
              borderRadius: '6px',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--text-primary)';
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--text-secondary)';
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <ExternalLink size={13} /> Visit Site
          </a>

          {/* "+ New" Dropdown */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setNewDropdownOpen(!newDropdownOpen)}
              className="button button-small button-secondary"
              style={{ gap: '5px' }}
            >
              <Plus size={14} /> New <ChevronDown size={12} />
            </button>

            {newDropdownOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: '36px',
                  left: '0',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '10px',
                  boxShadow: 'var(--shadow-lg)',
                  zIndex: 2000,
                  minWidth: '160px',
                  padding: '6px'
                }}
                onMouseLeave={() => setNewDropdownOpen(false)}
              >
                <Link
                  to="/admin/posts/new"
                  onClick={() => setNewDropdownOpen(false)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 12px',
                    color: 'var(--text-primary)',
                    borderRadius: '6px',
                    fontSize: '13px',
                    textDecoration: 'none'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-card-hover)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <FileText size={14} color="var(--g-accent, #3b82f6)" /> Post
                </Link>
                <Link
                  to="/admin/videos/new"
                  onClick={() => setNewDropdownOpen(false)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 12px',
                    color: 'var(--text-primary)',
                    borderRadius: '6px',
                    fontSize: '13px',
                    textDecoration: 'none'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-card-hover)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <Film size={14} color="var(--g-accent, #10b981)" /> Video
                </Link>
                <Link
                  to="/admin/gallery/new"
                  onClick={() => setNewDropdownOpen(false)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 12px',
                    color: 'var(--text-primary)',
                    borderRadius: '6px',
                    fontSize: '13px',
                    textDecoration: 'none'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-card-hover)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <ImageIcon size={14} color="#f59e0b" /> Gallery
                </Link>
                <Link
                  to="/admin/pages/new"
                  onClick={() => setNewDropdownOpen(false)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 12px',
                    color: 'var(--text-primary)',
                    borderRadius: '6px',
                    fontSize: '13px',
                    textDecoration: 'none'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-card-hover)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <FileText size={14} color="#8b5cf6" /> Page
                </Link>
                <Link
                  to="/admin/media"
                  onClick={() => setNewDropdownOpen(false)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 12px',
                    color: 'var(--text-primary)',
                    borderRadius: '6px',
                    fontSize: '13px',
                    textDecoration: 'none'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-card-hover)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <HardDrive size={14} color="#ec4899" /> Media
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Profile & Logout */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '50%',
                background: user?.avatar ? 'transparent' : 'var(--bg-card)',
                border: '1.5px solid var(--border-color)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--primary-color)',
                overflow: 'hidden',
                flexShrink: 0
              }}
            >
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name || 'User'}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              ) : (
                <UserIcon size={16} />
              )}
            </div>
            <div>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                {user?.name || 'Administrator'}
              </span>
              <span
                style={{
                  display: 'block',
                  fontSize: '11px',
                  color: 'var(--text-muted)',
                  textTransform: 'capitalize'
                }}
              >
                {user?.role || 'admin'}
              </span>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="button button-small button-danger-outline"
            title="Log Out"
          >
            <LogOut size={13} /> Log Out
          </button>
        </div>
      </header>

      {/* Main Body */}
      <div style={{ display: 'flex', flex: 1 }}>
        <Sidebar />

        {/* Main Content Viewport */}
        <main
          style={{
            flex: 1,
            backgroundColor: 'var(--bg-main)',
            padding: '20px 24px',
            minHeight: 'calc(100vh - 60px)',
            maxWidth: 'calc(100vw - 160px)',
            overflowX: 'auto'
          }}
        >
          {children || <Outlet />}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;

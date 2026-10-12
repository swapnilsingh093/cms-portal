import { useNavigate, Link } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import { statsAPI, postAPI } from '../../services/api';
import {
  Film,
  Image as ImageIcon,
  BookOpen,
  FolderTree,
  Users,
  Eye,
  Plus,
  Paintbrush,
  HardDrive,
  ExternalLink,
  Clock,
  Sparkles
} from 'lucide-react';

const DashboardOverview = () => {
  const navigate = useNavigate();
  // Helper navigation functions (replaces old setSection/setSubSection pattern)
  const setSection = (section) => {
    const routeMap = {
      videos: '/admin/videos',
      posts: '/admin/posts',
      galleries: '/admin/gallery',
      media: '/admin/media',
      appearance: '/admin/appearance',
      users: '/admin/users',
      settings: '/admin/settings'};
    if (routeMap[section]) navigate(routeMap[section]);
  };
  const setSubSection = (sub) => {
    const subMap = {
      'videos-new': '/admin/videos/new',
      'posts-new': '/admin/posts/new',
      'galleries-new': '/admin/gallery/new',
      'media-library': '/admin/media',
      'appearance-theme': '/admin/appearance',
      'posts-categories': '/admin/posts/categories',
      'videos-categories': '/admin/videos/categories'};
    if (subMap[sub]) navigate(subMap[sub]);
  };
  const [stats, setStats] = useState(null);
  const [recent, setRecent] = useState({ videos: [], posts: [] });
  const [loading, setLoading] = useState(true);

  // Quick Draft state
  const [quickTitle, setQuickTitle] = useState('');
  const [quickContent, setQuickContent] = useState('');
  const [savingDraft, setSavingDraft] = useState(false);
  const [draftMessage, setDraftMessage] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await statsAPI.getStats();
        if (res.stats) setStats(res.stats);
        if (res.recent) setRecent(res.recent);
      } catch (err) {
        console.error('Failed to load stats:', err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const handleSaveQuickDraft = async (e) => {
    e.preventDefault();
    if (!quickTitle.trim()) return;

    setSavingDraft(true);
    setDraftMessage('');
    try {
      const formData = new FormData();
      formData.append('title', quickTitle);
      formData.append('content', quickContent || 'Draft content...');
      formData.append('status', 'draft');

      await postAPI.create(formData);
      setDraftMessage('Draft saved successfully!');
      setQuickTitle('');
      setQuickContent('');
    } catch (err) {
      setDraftMessage('Error saving draft: ' + err.message);
    } finally {
      setSavingDraft(false);
    }
  };

  return (
    <div style={{ maxWidth: '1400px' }}>
      {/* Page Title */}
      <div style={{ marginBottom: '16px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 600,  margin: 0 }}>
          Dashboard
        </h1>
      </div>

      {/* WordPress Welcome Panel */}
      <div
        className="postbox"
        style={{
          
          
          padding: '24px 28px',
          marginBottom: '24px'}}
      >
        <h2 style={{ fontSize: '20px', fontWeight: 600,  margin: '0 0 6px 0' }}>
          Welcome to your CMS Portal!
        </h2>
        <p style={{  fontSize: '13px', margin: '0 0 20px 0' }}>
          We’ve assembled some shortcuts to help you get started managing your content:
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px' }}>
          {/* Column 1: Get Started */}
          <div>
            <div style={{ fontWeight: 600, fontSize: '14px',  marginBottom: '10px' }}>
              Get Started
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button
                onClick={() => {
                  setSection('videos');
                  if (setSubSection) setSubSection('videos-new');
                }}
                className="button button-primary"
                style={{ width: 'fit-content' }}
              >
                <Plus size={14} /> Add New Video
              </button>
              <div style={{ fontSize: '12px',  marginTop: '4px' }}>
                or <a href="#customize" onClick={(e) => { e.preventDefault(); setSection('appearance'); if (setSubSection) setSubSection('appearance-theme'); }}>customize your site theme</a>
              </div>
            </div>
          </div>

          {/* Column 2: Next Steps */}
          <div>
            <div style={{ fontWeight: 600, fontSize: '14px',  marginBottom: '10px' }}>
              Next Steps
            </div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
              <li>
                <a
                  href="#new-post"
                  onClick={(e) => {
                    e.preventDefault();
                    setSection('posts');
                    if (setSubSection) setSubSection('posts-new');
                  }}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <BookOpen size={14} /> Write your first post / story
                </a>
              </li>
              <li>
                <a
                  href="#new-gallery"
                  onClick={(e) => {
                    e.preventDefault();
                    setSection('galleries');
                    if (setSubSection) setSubSection('galleries-new');
                  }}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <ImageIcon size={14} /> Create a photo gallery
                </a>
              </li>
              <li>
                <a
                  href="#media-library"
                  onClick={(e) => {
                    e.preventDefault();
                    setSection('media');
                    if (setSubSection) setSubSection('media-library');
                  }}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <HardDrive size={14} /> Open central Media Library
                </a>
              </li>
            </ul>
          </div>

          {/* Column 3: Categories & Customization */}
          <div>
            <div style={{ fontWeight: 600, fontSize: '14px',  marginBottom: '10px' }}>
              More Actions
            </div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
              <li>
                <a
                  href="#video-categories"
                  onClick={(e) => {
                    e.preventDefault();
                    setSection('videos');
                    if (setSubSection) setSubSection('videos-categories');
                  }}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <FolderTree size={14} /> Manage Video Categories & Subcategories
                </a>
              </li>
              <li>
                <a
                  href="#appearance"
                  onClick={(e) => {
                    e.preventDefault();
                    setSection('appearance');
                    if (setSubSection) setSubSection('appearance-theme');
                  }}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <Paintbrush size={14} /> Theme Settings & Customizer
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* 2-Column Dashboard Widgets Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', alignItems: 'start' }}>
        {/* LEFT COLUMN WIDGETS */}
        <div>
          {/* "At a Glance" Widget */}
          <div className="postbox">
            <div className="postbox-header">
              <h3>At a Glance</h3>
            </div>
            <div className="postbox-body" style={{ padding: '20px 24px' }}>
              {loading ? (
                <div style={{ color: 'var(--text-muted)' }}>Loading summary...</div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 20px', fontSize: '13.5px' }}>
                  <div>
                    <a
                      href="#videos"
                      onClick={(e) => { e.preventDefault(); setSection('videos'); }}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#38bdf8', textDecoration: 'none', fontWeight: 600 }}
                    >
                      <Film size={16} color="#38bdf8" />
                      <span>{stats?.totalVideos ?? 0} Videos</span>
                    </a>
                  </div>
                  <div>
                    <a
                      href="#galleries"
                      onClick={(e) => { e.preventDefault(); setSection('galleries'); }}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#38bdf8', textDecoration: 'none', fontWeight: 600 }}
                    >
                      <ImageIcon size={16} color="#38bdf8" />
                      <span>{stats?.totalGalleries ?? 0} Photo Galleries</span>
                    </a>
                  </div>
                  <div>
                    <a
                      href="#posts"
                      onClick={(e) => { e.preventDefault(); setSection('posts'); }}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#38bdf8', textDecoration: 'none', fontWeight: 600 }}
                    >
                      <BookOpen size={16} color="#38bdf8" />
                      <span>{stats?.totalPosts ?? 0} Stories & Posts</span>
                    </a>
                  </div>
                  <div>
                    <a
                      href="#categories"
                      onClick={(e) => { e.preventDefault(); setSection('posts'); if (setSubSection) setSubSection('posts-categories'); }}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#38bdf8', textDecoration: 'none', fontWeight: 600 }}
                    >
                      <FolderTree size={16} color="#38bdf8" />
                      <span>{stats?.totalCategories ?? 0} Categories</span>
                    </a>
                  </div>
                  <div>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)' }}>
                      <Eye size={16} color="#94a3b8" />
                      <span>{stats?.totalViews?.toLocaleString() ?? 0} Total Views</span>
                    </span>
                  </div>
                  <div>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)' }}>
                      <Users size={16} color="#94a3b8" />
                      <span>{stats?.totalUsers ?? 0} Admin / Users</span>
                    </span>
                  </div>
                </div>
              )}
              <div style={{ marginTop: '20px', paddingTop: '14px', borderTop: '1px solid var(--border-color)', fontSize: '12px', color: 'var(--text-muted)' }}>
                CMS Portal • Running portable on local disk & pendrive
              </div>
            </div>
          </div>

          {/* "Activity" Widget */}
          <div className="postbox">
            <div className="postbox-header">
              <h3>Recently Published Content</h3>
            </div>
            <div className="postbox-body" style={{ padding: 0 }}>
              {recent.videos?.length === 0 && recent.posts?.length === 0 ? (
                <div style={{ padding: '20px',  textAlign: 'center' }}>
                  No recent publications.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {recent.videos?.slice(0, 3).map((v) => (
                    <div
                      key={v._id}
                      style={{
                        padding: '12px 16px',
                        
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Film size={15} color="#2271b1" />
                        <div>
                          <strong style={{ fontSize: '13px'}}>{v.title}</strong>
                          <div style={{ fontSize: '11px'}}>
                            {v.category?.name || 'Uncategorized'} • {v.duration || 'Video'}
                          </div>
                        </div>
                      </div>
                      <span style={{ fontSize: '11px', color: '#8c8f94' }}>
                        {new Date(v.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  ))}

                  {recent.posts?.slice(0, 3).map((p) => (
                    <div
                      key={p._id}
                      style={{
                        padding: '12px 16px',
                        
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <BookOpen size={15} color="#059669" />
                        <div>
                          <strong style={{ fontSize: '13px'}}>{p.title}</strong>
                          <div style={{ fontSize: '11px'}}>
                            {p.category?.name || 'Story'}
                          </div>
                        </div>
                      </div>
                      <span style={{ fontSize: '11px', color: '#8c8f94' }}>
                        {new Date(p.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN WIDGETS */}
        <div>
          {/* "Quick Draft" Widget */}
          <div className="postbox">
            <div className="postbox-header">
              <h3>Quick Draft</h3>
            </div>
            <div className="postbox-body" style={{ padding: '20px 24px' }}>
              <form onSubmit={handleSaveQuickDraft}>
                {draftMessage && (
                  <div style={{ fontSize: '13px', color: '#10b981', marginBottom: '12px', background: 'rgba(16, 185, 129, 0.1)', padding: '8px 12px', borderRadius: '4px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                    {draftMessage}
                  </div>
                )}
                <div className="form-group" style={{ marginBottom: '14px' }}>
                  <label className="form-label" style={{ fontSize: '12px', fontWeight: 600, marginBottom: '6px', display: 'block', color: 'var(--text-secondary)' }}>Title</label>
                  <input
                    type="text"
                    className="form-input"
                    value={quickTitle}
                    onChange={(e) => setQuickTitle(e.target.value)}
                    placeholder="Enter quick story / post title"
                    required
                    style={{ width: '100%', boxSizing: 'border-box' }}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '16px' }}>
                  <label className="form-label" style={{ fontSize: '12px', fontWeight: 600, marginBottom: '6px', display: 'block', color: 'var(--text-secondary)' }}>What’s on your mind?</label>
                  <textarea
                    className="form-textarea"
                    value={quickContent}
                    onChange={(e) => setQuickContent(e.target.value)}
                    placeholder="Draft your notes or story content here..."
                    rows={4}
                    style={{ width: '100%', boxSizing: 'border-box', resize: 'vertical' }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={savingDraft}
                  className="button button-primary"
                  style={{ width: 'fit-content', padding: '8px 18px' }}
                >
                  {savingDraft ? 'Saving Draft...' : 'Save Draft'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardOverview;

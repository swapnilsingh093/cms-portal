import MetaBox from '../../components/admin/MetaBox';
import { useConfirm } from '../../hooks/useConfirm';
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { pageAPI, mediaAPI, categoryAPI } from '../../services/api';
import RichEditor from '../../components/RichEditor';
import MediaPickerModal from '../../components/admin/MediaPickerModal';
import StoriesTemplateEditor from '../../components/admin/StoriesTemplateEditor';
import GalleriesTemplateEditor from '../../components/admin/GalleriesTemplateEditor';
import SearchByVideoTemplateEditor from '../../components/admin/SearchByVideoTemplateEditor';
import {
  ArrowLeft,
  Save,
  ExternalLink,
  Image as ImageIcon,
  CheckCircle,
  AlertCircle,
  Loader2,
  Trash2,
  Check,
  Edit2,
  Upload,
  Film,
  Images,
  BookOpen,
  Sparkles,
  Sliders,
  FolderTree
} from 'lucide-react';

const ACCEPT_IMAGES =
  'image/jpeg,image/png,image/webp,image/svg+xml,image/gif,image/bmp,image/tiff,.jpg,.jpeg,.png,.webp,.svg,.gif,.bmp,.tiff,.tif';

const PageEditor = () => {
  const { confirm, ConfirmDialog } = useConfirm();
  const { id } = useParams();
  const isEditing = Boolean(id);
  const navigate = useNavigate();

  // Core Page Fields
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(false);
  const [editingSlugMode, setEditingSlugMode] = useState(false);
  const [tempSlug, setTempSlug] = useState('');

  const [content, setContent] = useState('');
  const [banner, setBanner] = useState('');
  const [template, setTemplate] = useState('default');
  const [status, setStatus] = useState('published');
  const [order, setOrder] = useState(0);

  // Default Template Banner Options State
  const [defaultBannerConfig, setDefaultBannerConfig] = useState({
    height: '420px',
    heading: '',
    subheading: '',
    alignment: 'left',
    overlayOpacity: 0.6
  });

  // Home Template Configuration State
  const [templateConfig, setTemplateConfig] = useState({
    heroSlider: {
      enabled: true,
      mode: 'dynamic',
      slideCount: 5,
      height: '90vh',
      titleFontSize: '3rem',
      alignment: 'left'
    },
    videoSection: {
      enabled: true,
      title: 'Trending & Latest Videos',
      subtitle: 'Stream recent videos and explore video categories',
      category1Id: '',
      category2Id: '',
      category1CustomImage: '',
      category2CustomImage: ''
    },
    gallerySection: {
      enabled: true,
      title: 'Featured Photo Galleries',
      subtitle: 'High-resolution photo albums and visual collections',
      category1Id: '',
      category2Id: '',
      category1CustomImage: '',
      category2CustomImage: ''
    },
    postsSection: {
      enabled: true,
      title: 'Latest Stories & Articles',
      subtitle: 'Read our newest articles and folklore tales',
      count: 3
    },
    membershipSection: {
      enabled: true,
      heading: 'Unlock Unlimited Access to Exclusive Media',
      subheading: 'Join Our Community',
      content: 'Get unlimited access to high-definition video streams, full-resolution photo albums, and deep folklore stories. Support our independent creators and join our exclusive community today.',
      buttonText: 'Join Today',
      buttonUrl: '/page/about-us',
      image: ''
    }
  });

  // Categories list
  
  // Videos Template Configuration State
    const [galleriesConfig, setGalleriesConfig] = useState({
    banner: {
      type: 'image',
      mediaUrl: '',
      mediaId: null,
      height: '65vh',
      heading: 'Photo Galleries & Visual Archives',
      subheading: 'Curated High-Resolution Photography',
      description: 'Explore curated photo albums, master galleries, and evocative visual collections.',
      buttonText: 'Browse Collections',
      buttonUrl: '#categories',
      headingFontSize: '2rem',
      subheadingFontSize: '0.72rem',
      descriptionFontSize: '1rem',
      buttonFontSize: '0.95rem',
      alignment: 'left',
      verticalPosition: 'center',
      overlayStrength: 0.35
    },
    layout: {
      sidebar: 'with_sidebar'
    },
    categories: {
      heading: 'Photo Gallery Categories',
      subtitle: 'Browse collections by photography theme and parent categories',
      perPage: 6
    },
    sidebar: {
      enabled: true,
      latestGalleriesCount: 5,
      latestVideosCount: 3,
      latestPostsCount: 3,
      categoriesWidgetEnabled: true
    }
  });

  const [storiesConfig, setStoriesConfig] = useState({
    banner: {
      type: 'image',
      mediaUrl: '',
      mediaId: null,
      height: '60vh',
      heading: 'Stories & Editorial Journal',
      subheading: 'Thoughtful Perspectives & Chronicles',
      description: 'Explore in-depth investigative reports, cultural essays, narratives, and insightful stories.',
      buttonText: 'Explore Topics',
      buttonUrl: '#categories',
      headingFontSize: '2rem',
      subheadingFontSize: '0.72rem',
      descriptionFontSize: '1.05rem',
      buttonFontSize: '0.95rem',
      alignment: 'left',
      verticalPosition: 'center',
      overlayStrength: 0
    },
    layout: {
      sidebar: 'with_sidebar'
    },
    categories: {
      heading: 'Editorial Columns & Categories',
      subtitle: 'Browse parent story categories to explore in-depth topics',
      perPage: 6
    },
    sidebar: {
      enabled: true,
      latestPostsCount: 5,
      videoCategoriesEnabled: true,
      galleryCategoriesEnabled: true,
      latestVideoEnabled: true
    }
  });

  const [videosConfig, setVideosConfig] = useState({
    banner: {
      type: 'video',
      mediaUrl: '',
      mediaId: null,
      height: '75vh',
      heading: 'Explore Our Video Stories',
      subheading: 'Stories that bring every moment to life',
      description: 'Watch cinematic journeys, folklore tales, and exclusive documentary films.',
      buttonText: 'Explore Videos',
      buttonUrl: '#categories',
      headingFontSize: '2rem',
      subheadingFontSize: '0.72rem',
      descriptionFontSize: '1rem',
      buttonFontSize: '0.95rem',
      alignment: 'left',
      verticalPosition: 'center',
      overlayStrength: 0
    },
    layout: {
      sidebar: 'with_sidebar'
    },
    categories: {
      heading: 'Browse Video Categories',
      subtitle: 'Explore parent categories and discover subtopics',
      perPage: 6
    },
    sidebar: {
      enabled: true,
      latestVideosCount: 5,
      mostViewedVideosCount: 2,
      latestPostsCount: 3,
      latestGalleriesCount: 3
    }
  });

  // Search By Video Template Configuration State (WordPress temp_search)
  const [searchByVideoConfig, setSearchByVideoConfig] = useState({
    bannerType: 'video',
    bannerUrl: '/uploads/videos/16.mp4',
    overlayStrength: 60,
    heading: 'Search by Video',
    subheading: 'Find your favorite desi videos by choice, age, or marital status',
    headingFontSize: '2.5rem',
    subheadingFontSize: '1.1rem',
    headingColor: '#ffffff',
    subheadingColor: 'rgba(255, 255, 255, 0.8)',
    accentColor: '#f2545f',
    alignment: 'center',
    defaultChoice: [],
    defaultAge: '',
    defaultMarital: ''
  });

  const [allCategories, setAllCategories] = useState([]);

  // Media Picker state & target
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);
  const [mediaPickerTarget, setMediaPickerTarget] = useState('banner');

  // Statuses
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    // Fetch all categories for section selectors
    const fetchCats = async () => {
      try {
        const res = await categoryAPI.getAll();
        if (res.categories) setAllCategories(res.categories);
      } catch (err) {
        console.error('Error fetching categories in PageEditor:', err);
      }
    };
    fetchCats();

    if (isEditing) {
      loadPage();
    }
  }, [id]);

  const loadPage = async () => {
    setLoading(true);
    try {
      const res = await pageAPI.getBySlug(id);
      if (res.page) {
        const p = res.page;
        setTitle(p.title || '');
        setSlug(p.slug || '');
        setIsSlugManuallyEdited(true);
        setContent(p.content || '');
        setBanner(p.banner || '');
        setTemplate(p.template || 'default');
        setStatus(p.status || 'published');
        setOrder(p.order || 0);

        if (p.templateConfig) {
          
        if ((p.template === 'galleries' || p.template === 'gallery') && p.templateConfig) {
          setGalleriesConfig(prev => ({
            banner: { ...prev.banner, ...(p.templateConfig.banner || {}) },
            layout: { ...prev.layout, ...(p.templateConfig.layout || {}) },
            categories: { ...prev.categories, ...(p.templateConfig.categories || {}) },
            sidebar: { ...prev.sidebar, ...(p.templateConfig.sidebar || {}) }
          }));
        }

        if (p.template === 'stories' && p.templateConfig) {
          setStoriesConfig(prev => ({
            banner: { ...prev.banner, ...(p.templateConfig.banner || {}) },
            layout: { ...prev.layout, ...(p.templateConfig.layout || {}) },
            categories: { ...prev.categories, ...(p.templateConfig.categories || {}) },
            sidebar: { ...prev.sidebar, ...(p.templateConfig.sidebar || {}) }
          }));
        }

        if (p.template === 'videos' && p.templateConfig) {
          setVideosConfig(prev => ({
            banner: { ...prev.banner, ...(p.templateConfig.banner || {}) },
            layout: { ...prev.layout, ...(p.templateConfig.layout || {}) },
            categories: { ...prev.categories, ...(p.templateConfig.categories || {}) },
            sidebar: { ...prev.sidebar, ...(p.templateConfig.sidebar || {}) }
          }));
        }

        if (p.template === 'search-by-video' && p.templateConfig) {
          setSearchByVideoConfig(prev => ({
            ...prev,
            ...p.templateConfig
          }));
        }

        if (p.templateConfig?.banner) {
          setDefaultBannerConfig(prev => ({
            ...prev,
            ...p.templateConfig.banner
          }));
        }

          setTemplateConfig(prev => ({
            heroSlider: { ...prev.heroSlider, ...(p.templateConfig.heroSlider || {}) },
            videoSection: { ...prev.videoSection, ...(p.templateConfig.videoSection || {}) },
            gallerySection: { ...prev.gallerySection, ...(p.templateConfig.gallerySection || {}) },
            postsSection: { ...prev.postsSection, ...(p.templateConfig.postsSection || {}) },
            membershipSection: { ...prev.membershipSection, ...(p.templateConfig.membershipSection || {}) }
          }));
        }
      }
    } catch (err) {
      setMessage({
        type: 'error',
        text: err.response?.data?.message || err.message || 'Error loading page'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTitleChange = (e) => {
    const val = e.target.value;
    setTitle(val);
    if (!isSlugManuallyEdited && !isEditing) {
      const generated = val
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
      setSlug(generated);
    }
  };

  const handleStartEditSlug = () => {
    setTempSlug(slug);
    setEditingSlugMode(true);
  };

  const handleSaveSlug = () => {
    const clean = tempSlug
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
    setSlug(clean);
    setIsSlugManuallyEdited(true);
    setEditingSlugMode(false);
  };

  const [mediaPickerCallback, setMediaPickerCallback] = useState(null);

  const openPickerFor = (target, callback = null) => {
    if (typeof target === 'function') {
      setMediaPickerCallback(() => target);
      setMediaPickerTarget('customCallback');
    } else {
      setMediaPickerTarget(target);
      setMediaPickerCallback(callback ? () => callback : null);
    }
    setMediaPickerOpen(true);
  };

  const handleMediaSelect = (mediaItem) => {
    if (mediaPickerCallback) {
      mediaPickerCallback(mediaItem);
      setMediaPickerCallback(null);
      setMediaPickerOpen(false);
      return;
    }
    if (mediaPickerTarget === 'searchByVideoBannerMedia') {
      const url = mediaItem.url || mediaItem.fileUrl;
      const isVideo = mediaItem.mediaType === 'video' || url?.match(/\.(mp4|webm|mov|mkv)$/i);
      setSearchByVideoConfig(prev => ({
        ...prev,
        bannerUrl: url,
        bannerType: isVideo ? 'video' : 'image'
      }));
    } else if (mediaPickerTarget === 'galleryBannerMedia') {
      setGalleriesConfig(prev => ({
        ...prev,
        banner: { ...prev.banner, mediaUrl: mediaItem.url }
      }));
    } else if (mediaPickerTarget === 'storyBannerMedia') {
      setStoriesConfig(prev => ({
        ...prev,
        banner: { ...prev.banner, mediaUrl: mediaItem.url }
      }));
    } else if (mediaPickerTarget === 'banner') {
      setBanner(mediaItem.url);
    } else if (mediaPickerTarget === 'videoBannerMedia') {
      const isVideo = mediaItem.mediaType === 'video' || mediaItem.url?.match(/\.(mp4|webm|mov|mkv|m4v)$/i);
      setVideosConfig(prev => ({
        ...prev,
        banner: {
          ...prev.banner,
          mediaUrl: mediaItem.url,
          mediaId: mediaItem._id,
          type: isVideo ? 'video' : (prev.banner?.type || 'image')
        }
      }));
    } else if (mediaPickerTarget === 'membershipImage') {
      setTemplateConfig(prev => ({
        ...prev,
        membershipSection: { ...prev.membershipSection, image: mediaItem.url }
      }));
    } else if (mediaPickerTarget === 'cat1VideoCustomImage') {
      setTemplateConfig(prev => ({
        ...prev,
        videoSection: { ...prev.videoSection, category1CustomImage: mediaItem.url }
      }));
    } else if (mediaPickerTarget === 'cat2VideoCustomImage') {
      setTemplateConfig(prev => ({
        ...prev,
        videoSection: { ...prev.videoSection, category2CustomImage: mediaItem.url }
      }));
    } else if (mediaPickerTarget === 'cat1GalleryCustomImage') {
      setTemplateConfig(prev => ({
        ...prev,
        gallerySection: { ...prev.gallerySection, category1CustomImage: mediaItem.url }
      }));
    } else if (mediaPickerTarget === 'cat2GalleryCustomImage') {
      setTemplateConfig(prev => ({
        ...prev,
        gallerySection: { ...prev.gallerySection, category2CustomImage: mediaItem.url }
      }));
    }
  };

  const handleLocalUploadFor = async (e, target) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setMessage({ type: '', text: '' });
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await mediaAPI.upload(formData);
      if (res.media) {
        if (target === 'banner') {
          setBanner(res.media.url);
        } else if (target === 'videoBannerMedia') {
          const isVideo = res.media.mediaType === 'video' || res.media.url?.match(/\.(mp4|webm|mov|mkv|m4v)$/i);
          setVideosConfig(prev => ({
            ...prev,
            banner: {
              ...prev.banner,
              mediaUrl: res.media.url,
              mediaId: res.media._id,
              type: isVideo ? 'video' : (prev.banner?.type || 'image')
            }
          }));
        } else if (target === 'membershipImage') {
          setTemplateConfig(prev => ({
            ...prev,
            membershipSection: { ...prev.membershipSection, image: res.media.url }
          }));
        } else if (target === 'cat1VideoCustomImage') {
          setTemplateConfig(prev => ({
            ...prev,
            videoSection: { ...prev.videoSection, category1CustomImage: res.media.url }
          }));
        } else if (target === 'cat2VideoCustomImage') {
          setTemplateConfig(prev => ({
            ...prev,
            videoSection: { ...prev.videoSection, category2CustomImage: res.media.url }
          }));
        } else if (target === 'cat1GalleryCustomImage') {
          setTemplateConfig(prev => ({
            ...prev,
            gallerySection: { ...prev.gallerySection, category1CustomImage: res.media.url }
          }));
        } else if (target === 'cat2GalleryCustomImage') {
          setTemplateConfig(prev => ({
            ...prev,
            gallerySection: { ...prev.gallerySection, category2CustomImage: res.media.url }
          }));
        }
        setMessage({ type: 'success', text: `Image "${file.name}" uploaded and set successfully!` });
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || err.message || 'Error uploading image' });
    }
  };

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();

    const effectiveTitle = title.trim() || 'Untitled Page';
    const isTemplatePage = ['home', 'videos', 'stories', 'galleries', 'gallery', 'search-by-video'].includes(template);
    const hasContent = isTemplatePage || Boolean((content && content.replace(/<[^>]*>/g, '').trim()) || banner);
    const effectiveStatus = hasContent ? status : 'draft';

    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      const payload = {
        title: effectiveTitle,
        slug: slug.trim(),
        content,
        banner,
        template,
        status: effectiveStatus,
        order: Number(order) || 0,
        templateConfig: template === 'videos'
          ? videosConfig
          : template === 'stories'
          ? storiesConfig
          : (template === 'galleries' || template === 'gallery')
          ? galleriesConfig
          : template === 'search-by-video'
          ? searchByVideoConfig
          : (template === 'default' || template === 'full-width')
          ? { ...templateConfig, banner: defaultBannerConfig }
          : templateConfig
      };

      let res;
      if (isEditing) {
        res = await pageAPI.update(id, payload);
        setMessage({ type: 'success', text: 'Page updated successfully!' });
      } else {
        res = await pageAPI.create(payload);
        setMessage({ type: 'success', text: 'Page created successfully!' });
        if (res.page?._id) {
          navigate(`/admin/pages/edit/${res.page._id}`, { replace: true });
        }
      }
    } catch (err) {
      setMessage({
        type: 'error',
        text: err.response?.data?.message || err.message || 'Error saving page'
      });
    } finally {
      setSaving(false);
    }
  };

  // Filtered categories strictly by type (ONLY PARENT CATEGORIES, NO SUBCATEGORIES)
  const finalVideoCats = allCategories.filter(c => !c.parentCategory && c.type === 'video');
  const finalGalleryCats = allCategories.filter(c => !c.parentCategory && c.type === 'gallery');
  const finalPostCats = allCategories.filter(c => !c.parentCategory && (c.type === 'post' || c.type === 'story'));

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px', gap: '10px', color: 'var(--text-secondary)' }}>
      <ConfirmDialog />
        <Loader2 size={28} className="spin" /> Loading page editor...
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1360px', margin: '0 auto' }}>
      {/* Top Bar with Back Link and Actions */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <Link to="/admin/pages" className="button button-neutral button-small">
            <ArrowLeft size={14} /> Back to Pages
          </Link>
          <h1 style={{ fontSize: '20px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
            {isEditing ? 'Edit Page' : 'Add New Page'}
          </h1>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {isEditing && (
            <a
              href={template === 'home' ? '/' : template === 'videos' ? '/videos' : template === 'search-by-video' ? '/search' : `/${slug || id}`}
              target="_blank"
              rel="noreferrer"
              className="button button-neutral button-small"
            >
              <ExternalLink size={14} /> View Live {template === 'home' ? 'Home' : template === 'videos' ? 'Videos' : template === 'search-by-video' ? 'Search by Video' : 'Page'}
            </a>
          )}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="button button-primary"
          >
            {saving ? (
              <>
                <Loader2 size={15} className="spin" /> Saving...
              </>
            ) : (
              <>
                <Save size={15} /> {isEditing ? 'Update Page' : 'Publish Page'}
              </>
            )}
          </button>
        </div>
      </div>

      {/* Notification Banner */}
      {message.text && (
        <div
          style={{
            padding: '14px 18px',
            borderRadius: '10px',
            marginBottom: '22px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            fontSize: '14px',
            background: message.type === 'error' ? 'var(--danger-bg)' : 'var(--success-bg)',
            color: message.type === 'error' ? 'var(--danger)' : 'var(--success)',
            border: `1px solid ${message.type === 'error' ? 'var(--danger)' : 'var(--success)'}`
          }}
        >
          {message.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle size={18} />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Main 2-Column Editor Grid */}
      <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 280px', gap: '20px' }}>
        {/* Left Column: Title, Slug, Home Template Settings, Page Content */}
        <div>
          {/* Title Box */}
          <div className="form-group" style={{ marginBottom: '16px' }}>
            <input
              type="text"
              placeholder="Enter page title (e.g. Home, About Us, Contact)..."
              value={title}
              onChange={handleTitleChange}
              className="form-input"
              style={{
                fontSize: '20px',
                fontWeight: 700,
                padding: '14px 18px',
                height: 'auto'
              }}
              required
            />
          </div>

          {/* Permalink / Slug Editor Box */}
          <div className="permalink-box" style={{ marginBottom: '24px' }}>
            <span className="permalink-label">Permalink:</span>
            {editingSlugMode ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="permalink-prefix">{window.location.origin}/</span>
                <input
                  type="text"
                  value={tempSlug}
                  onChange={(e) => setTempSlug(e.target.value)}
                  className="permalink-input"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={handleSaveSlug}
                  className="button button-small button-primary"
                >
                  <Check size={12} /> OK
                </button>
                <button
                  type="button"
                  onClick={() => setEditingSlugMode(false)}
                  className="button button-small button-neutral"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <>
                <a
                  href={template === 'home' ? '/' : template === 'videos' ? '/videos' : `/${slug || 'your-page'}`}
                  target="_blank"
                  rel="noreferrer"
                  className="permalink-url"
                  title="Click to view live in a new tab"
                >
                  {window.location.origin}{template === 'home' ? '/' : template === 'videos' ? '/videos' : `/${slug || 'untitled-page'}`}
                </a>
                <button
                  type="button"
                  onClick={handleStartEditSlug}
                  className="button button-small button-neutral"
                  style={{ padding: '2px 8px', fontSize: '11px', gap: '3px' }}
                >
                  <Edit2 size={11} /> Edit Slug
                </button>
              </>
            )}
          </div>

          {/* HOME TEMPLATE CONFIGURATION SETTINGS (Only shown when template === 'home') */}
          {template === 'home' && (
            <div style={{ marginBottom: '32px' }}>
              <div
                style={{
                  background: 'linear-gradient(135deg, var(--g-accent, rgba(99, 102, 241, 0.15)) 0%, rgba(59, 130, 246, 0.08) 100%)',
                  border: '1px solid var(--g-accent, rgba(99, 102, 241, 0.3))',
                  borderRadius: '12px',
                  padding: '16px 20px',
                  marginBottom: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}
              >
                <Sparkles size={22} color="var(--primary-color)" />
                <div>
                  <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Home Template Configuration
                  </h3>
                  <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)' }}>
                    Manage section titles, toggle visibility, select video & gallery categories, and customize promotional membership content.
                  </p>
                </div>
              </div>

              {/* 1. Hero Slider Settings */}
              <MetaBox title="Section 1: Hero Slider Settings">
<p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '14px' }}>
                    The Hero Slider automatically pulls published Posts, Videos, and Photo Galleries. As new content is created, the slider animates through them with dedicated action buttons (Read Story, Watch Video, View Gallery).
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                    <div className="form-group">
                      <label className="form-label">Slide Count</label>
                      <input
                        type="number"
                        min="1"
                        max="15"
                        value={templateConfig.heroSlider?.slideCount || 5}
                        onChange={(e) =>
                          setTemplateConfig(prev => ({
                            ...prev,
                            heroSlider: { ...prev.heroSlider, slideCount: Number(e.target.value) }
                          }))
                        }
                        className="form-input"
                      />
                      <div className="form-description">
                        Number of dynamic slides (Posts, Videos, Galleries) to rotate.
                      </div>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Slider Height (vh, px, %)</label>
                      <input
                        type="text"
                        placeholder="e.g. 90vh, 700px, 100vh"
                        value={templateConfig.heroSlider?.height || '90vh'}
                        onChange={(e) =>
                          setTemplateConfig(prev => ({
                            ...prev,
                            heroSlider: { ...prev.heroSlider, height: e.target.value }
                          }))
                        }
                        className="form-input"
                      />
                      <div className="form-description">
                        Manage slider height in <strong>vh</strong>, <strong>px</strong>, or <strong>%</strong> (e.g. <code>90vh</code>, <code>650px</code>, <code>100%</code>).
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div className="form-group">
                      <label className="form-label">Heading Font Size (rem, px)</label>
                      <input
                        type="text"
                        placeholder="e.g. 3rem, 2.8rem, 48px"
                        value={templateConfig.heroSlider?.titleFontSize || '3rem'}
                        onChange={(e) =>
                          setTemplateConfig(prev => ({
                            ...prev,
                            heroSlider: { ...prev.heroSlider, titleFontSize: e.target.value }
                          }))
                        }
                        className="form-input"
                      />
                      <div className="form-description">
                        Custom font size for the slide <code>&lt;h1&gt;</code> title (default: <strong>3rem</strong>).
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Content Alignment (Left / Center / Right)</label>
                      <select
                        value={templateConfig.heroSlider?.alignment || 'left'}
                        onChange={(e) =>
                          setTemplateConfig(prev => ({
                            ...prev,
                            heroSlider: { ...prev.heroSlider, alignment: e.target.value }
                          }))
                        }
                        className="form-select"
                      >
                        <option value="left">⬅️ Left Aligned (Default)</option>
                        <option value="center">⏺️ Center Aligned</option>
                        <option value="right">➡️ Right Aligned</option>
                      </select>
                      <div className="form-description">
                        Align the title, subtitle, badges, and CTA button to Left, Center, or Right.
                      </div>
                    </div>
                  </div>
</MetaBox>

              {/* 2. Video Section Settings (Separated Categories) */}
              <MetaBox title="Section 2: Videos Section Settings">
<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                    <div className="form-group">
                      <label className="form-label">Section Heading</label>
                      <input
                        type="text"
                        value={templateConfig.videoSection?.title || ''}
                        onChange={(e) =>
                          setTemplateConfig(prev => ({
                            ...prev,
                            videoSection: { ...prev.videoSection, title: e.target.value }
                          }))
                        }
                        className="form-input"
                        placeholder="Trending & Latest Videos"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Section Subtitle</label>
                      <input
                        type="text"
                        value={templateConfig.videoSection?.subtitle || ''}
                        onChange={(e) =>
                          setTemplateConfig(prev => ({
                            ...prev,
                            videoSection: { ...prev.videoSection, subtitle: e.target.value }
                          }))
                        }
                        className="form-input"
                        placeholder="Stream recent videos and explore video categories"
                      />
                    </div>
                  </div>

                  <div style={{ background: 'rgba(255,255,255,0.02)', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-color)', marginBottom: '16px' }}>
                    <h4 style={{ margin: '0 0 12px', fontSize: '14px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <FolderTree size={15} color="var(--primary-color)" /> Video Categories (Cards 2 & 3)
                    </h4>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '14px' }}>
                      Card 1 displays the Latest Video automatically. Select two separate Video Categories for Cards 2 & 3 with custom card thumbnail options:
                    </p>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px' }}>
                      {/* Video Category 1 */}
                      <div style={{ padding: '12px', background: 'var(--bg-main)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                        <label className="form-label" style={{ fontWeight: 600 }}>Select Video Category 1</label>
                        <select
                          value={templateConfig.videoSection?.category1Id || ''}
                          onChange={(e) =>
                            setTemplateConfig(prev => ({
                              ...prev,
                              videoSection: { ...prev.videoSection, category1Id: e.target.value }
                            }))
                          }
                          className="form-select"
                          style={{ marginBottom: '10px' }}
                        >
                          <option value="">-- Choose Category --</option>
                          {finalVideoCats.map(c => (
                            <option key={c._id} value={c._id}>
                              {c.name} {c.type ? `(${c.type})` : ''}
                            </option>
                          ))}
                        </select>

                        {/* Custom Thumbnail for Cat 1 */}
                        <label className="form-label" style={{ fontSize: '12px' }}>Custom Card Thumbnail (Optional)</label>
                        {templateConfig.videoSection?.category1CustomImage ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <img
                              src={templateConfig.videoSection.category1CustomImage}
                              alt="Cat 1 Preview"
                              style={{ width: '48px', height: '48px', borderRadius: '6px', objectFit: 'cover' }}
                            />
                            <button
                              type="button"
                              onClick={() =>
                                setTemplateConfig(prev => ({
                                  ...prev,
                                  videoSection: { ...prev.videoSection, category1CustomImage: '' }
                                }))
                              }
                              className="button button-neutral button-small"
                              style={{ fontSize: '11px' }}
                            >
                              <Trash2 size={12} /> Remove
                            </button>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button
                              type="button"
                              onClick={() => openPickerFor('cat1VideoCustomImage')}
                              className="button button-neutral button-small"
                              style={{ fontSize: '11px', flex: 1 }}
                            >
                              <ImageIcon size={12} /> Media Library
                            </button>
                            <label className="button button-neutral button-small" style={{ fontSize: '11px', cursor: 'pointer' }}>
                              <Upload size={12} />
                              <input
                                type="file"
                                accept={ACCEPT_IMAGES}
                                style={{ display: 'none' }}
                                onChange={(e) => handleLocalUploadFor(e, 'cat1VideoCustomImage')}
                              />
                            </label>
                          </div>
                        )}
                      </div>

                      {/* Video Category 2 */}
                      <div style={{ padding: '12px', background: 'var(--bg-main)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                        <label className="form-label" style={{ fontWeight: 600 }}>Select Video Category 2</label>
                        <select
                          value={templateConfig.videoSection?.category2Id || ''}
                          onChange={(e) =>
                            setTemplateConfig(prev => ({
                              ...prev,
                              videoSection: { ...prev.videoSection, category2Id: e.target.value }
                            }))
                          }
                          className="form-select"
                          style={{ marginBottom: '10px' }}
                        >
                          <option value="">-- Choose Category --</option>
                          {finalVideoCats.map(c => (
                            <option key={c._id} value={c._id}>
                              {c.name} {c.type ? `(${c.type})` : ''}
                            </option>
                          ))}
                        </select>

                        {/* Custom Thumbnail for Cat 2 */}
                        <label className="form-label" style={{ fontSize: '12px' }}>Custom Card Thumbnail (Optional)</label>
                        {templateConfig.videoSection?.category2CustomImage ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <img
                              src={templateConfig.videoSection.category2CustomImage}
                              alt="Cat 2 Preview"
                              style={{ width: '48px', height: '48px', borderRadius: '6px', objectFit: 'cover' }}
                            />
                            <button
                              type="button"
                              onClick={() =>
                                setTemplateConfig(prev => ({
                                  ...prev,
                                  videoSection: { ...prev.videoSection, category2CustomImage: '' }
                                }))
                              }
                              className="button button-neutral button-small"
                              style={{ fontSize: '11px' }}
                            >
                              <Trash2 size={12} /> Remove
                            </button>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button
                              type="button"
                              onClick={() => openPickerFor('cat2VideoCustomImage')}
                              className="button button-neutral button-small"
                              style={{ fontSize: '11px', flex: 1 }}
                            >
                              <ImageIcon size={12} /> Media Library
                            </button>
                            <label className="button button-neutral button-small" style={{ fontSize: '11px', cursor: 'pointer' }}>
                              <Upload size={12} />
                              <input
                                type="file"
                                accept={ACCEPT_IMAGES}
                                style={{ display: 'none' }}
                                onChange={(e) => handleLocalUploadFor(e, 'cat2VideoCustomImage')}
                              />
                            </label>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
</MetaBox>

              {/* 3. Gallery Section Settings (Separated Categories) */}
              <MetaBox title="Section 3: Galleries Section Settings">
<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                    <div className="form-group">
                      <label className="form-label">Section Heading</label>
                      <input
                        type="text"
                        value={templateConfig.gallerySection?.title || ''}
                        onChange={(e) =>
                          setTemplateConfig(prev => ({
                            ...prev,
                            gallerySection: { ...prev.gallerySection, title: e.target.value }
                          }))
                        }
                        className="form-input"
                        placeholder="Featured Photo Galleries"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Section Subtitle</label>
                      <input
                        type="text"
                        value={templateConfig.gallerySection?.subtitle || ''}
                        onChange={(e) =>
                          setTemplateConfig(prev => ({
                            ...prev,
                            gallerySection: { ...prev.gallerySection, subtitle: e.target.value }
                          }))
                        }
                        className="form-input"
                        placeholder="High-resolution photo albums and visual collections"
                      />
                    </div>
                  </div>

                  <div style={{ background: 'rgba(255,255,255,0.02)', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-color)', marginBottom: '16px' }}>
                    <h4 style={{ margin: '0 0 12px', fontSize: '14px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <FolderTree size={15} color="var(--primary-color)" /> Gallery Categories (Cards 2 & 3)
                    </h4>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '14px' }}>
                      Card 1 displays the Latest Gallery automatically. Select two separate Gallery Categories for Cards 2 & 3 with custom card thumbnail options:
                    </p>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px' }}>
                      {/* Gallery Category 1 */}
                      <div style={{ padding: '12px', background: 'var(--bg-main)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                        <label className="form-label" style={{ fontWeight: 600 }}>Select Gallery Category 1</label>
                        <select
                          value={templateConfig.gallerySection?.category1Id || ''}
                          onChange={(e) =>
                            setTemplateConfig(prev => ({
                              ...prev,
                              gallerySection: { ...prev.gallerySection, category1Id: e.target.value }
                            }))
                          }
                          className="form-select"
                          style={{ marginBottom: '10px' }}
                        >
                          <option value="">-- Choose Category --</option>
                          {finalGalleryCats.map(c => (
                            <option key={c._id} value={c._id}>
                              {c.name} {c.type ? `(${c.type})` : ''}
                            </option>
                          ))}
                        </select>

                        {/* Custom Thumbnail for Gallery Cat 1 */}
                        <label className="form-label" style={{ fontSize: '12px' }}>Custom Card Thumbnail (Optional)</label>
                        {templateConfig.gallerySection?.category1CustomImage ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <img
                              src={templateConfig.gallerySection.category1CustomImage}
                              alt="Gallery Cat 1 Preview"
                              style={{ width: '48px', height: '48px', borderRadius: '6px', objectFit: 'cover' }}
                            />
                            <button
                              type="button"
                              onClick={() =>
                                setTemplateConfig(prev => ({
                                  ...prev,
                                  gallerySection: { ...prev.gallerySection, category1CustomImage: '' }
                                }))
                              }
                              className="button button-neutral button-small"
                              style={{ fontSize: '11px' }}
                            >
                              <Trash2 size={12} /> Remove
                            </button>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button
                              type="button"
                              onClick={() => openPickerFor('cat1GalleryCustomImage')}
                              className="button button-neutral button-small"
                              style={{ fontSize: '11px', flex: 1 }}
                            >
                              <ImageIcon size={12} /> Media Library
                            </button>
                            <label className="button button-neutral button-small" style={{ fontSize: '11px', cursor: 'pointer' }}>
                              <Upload size={12} />
                              <input
                                type="file"
                                accept={ACCEPT_IMAGES}
                                style={{ display: 'none' }}
                                onChange={(e) => handleLocalUploadFor(e, 'cat1GalleryCustomImage')}
                              />
                            </label>
                          </div>
                        )}
                      </div>

                      {/* Gallery Category 2 */}
                      <div style={{ padding: '12px', background: 'var(--bg-main)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                        <label className="form-label" style={{ fontWeight: 600 }}>Select Gallery Category 2</label>
                        <select
                          value={templateConfig.gallerySection?.category2Id || ''}
                          onChange={(e) =>
                            setTemplateConfig(prev => ({
                              ...prev,
                              gallerySection: { ...prev.gallerySection, category2Id: e.target.value }
                            }))
                          }
                          className="form-select"
                          style={{ marginBottom: '10px' }}
                        >
                          <option value="">-- Choose Category --</option>
                          {finalGalleryCats.map(c => (
                            <option key={c._id} value={c._id}>
                              {c.name} {c.type ? `(${c.type})` : ''}
                            </option>
                          ))}
                        </select>

                        {/* Custom Thumbnail for Gallery Cat 2 */}
                        <label className="form-label" style={{ fontSize: '12px' }}>Custom Card Thumbnail (Optional)</label>
                        {templateConfig.gallerySection?.category2CustomImage ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <img
                              src={templateConfig.gallerySection.category2CustomImage}
                              alt="Gallery Cat 2 Preview"
                              style={{ width: '48px', height: '48px', borderRadius: '6px', objectFit: 'cover' }}
                            />
                            <button
                              type="button"
                              onClick={() =>
                                setTemplateConfig(prev => ({
                                  ...prev,
                                  gallerySection: { ...prev.gallerySection, category2CustomImage: '' }
                                }))
                              }
                              className="button button-neutral button-small"
                              style={{ fontSize: '11px' }}
                            >
                              <Trash2 size={12} /> Remove
                            </button>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button
                              type="button"
                              onClick={() => openPickerFor('cat2GalleryCustomImage')}
                              className="button button-neutral button-small"
                              style={{ fontSize: '11px', flex: 1 }}
                            >
                              <ImageIcon size={12} /> Media Library
                            </button>
                            <label className="button button-neutral button-small" style={{ fontSize: '11px', cursor: 'pointer' }}>
                              <Upload size={12} />
                              <input
                                type="file"
                                accept={ACCEPT_IMAGES}
                                style={{ display: 'none' }}
                                onChange={(e) => handleLocalUploadFor(e, 'cat2GalleryCustomImage')}
                              />
                            </label>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
</MetaBox>

              {/* 4. Latest Posts / Stories Settings */}
              <MetaBox title="Section 4: Latest Posts / Stories Settings">
<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 120px', gap: '16px' }}>
                    <div className="form-group">
                      <label className="form-label">Section Heading</label>
                      <input
                        type="text"
                        value={templateConfig.postsSection?.title || ''}
                        onChange={(e) =>
                          setTemplateConfig(prev => ({
                            ...prev,
                            postsSection: { ...prev.postsSection, title: e.target.value }
                          }))
                        }
                        className="form-input"
                        placeholder="Latest Stories & Articles"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Section Subtitle</label>
                      <input
                        type="text"
                        value={templateConfig.postsSection?.subtitle || ''}
                        onChange={(e) =>
                          setTemplateConfig(prev => ({
                            ...prev,
                            postsSection: { ...prev.postsSection, subtitle: e.target.value }
                          }))
                        }
                        className="form-input"
                        placeholder="Read our newest articles and folklore tales"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Post Count</label>
                      <input
                        type="number"
                        min="1"
                        max="12"
                        value={templateConfig.postsSection?.count || 3}
                        onChange={(e) =>
                          setTemplateConfig(prev => ({
                            ...prev,
                            postsSection: { ...prev.postsSection, count: Number(e.target.value) }
                          }))
                        }
                        className="form-input"
                      />
                    </div>
                  </div>
</MetaBox>

              {/* 5. Membership Promotional Section */}
              <MetaBox title="Section 5: Membership Promotional Section">
<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                    <div className="form-group">
                      <label className="form-label">Heading</label>
                      <input
                        type="text"
                        value={templateConfig.membershipSection?.heading || ''}
                        onChange={(e) =>
                          setTemplateConfig(prev => ({
                            ...prev,
                            membershipSection: { ...prev.membershipSection, heading: e.target.value }
                          }))
                        }
                        className="form-input"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Sub-heading</label>
                      <input
                        type="text"
                        value={templateConfig.membershipSection?.subheading || ''}
                        onChange={(e) =>
                          setTemplateConfig(prev => ({
                            ...prev,
                            membershipSection: { ...prev.membershipSection, subheading: e.target.value }
                          }))
                        }
                        className="form-input"
                      />
                    </div>
                  </div>

                  <div className="form-group" style={{ marginBottom: '16px' }}>
                    <label className="form-label">Content / Description</label>
                    <textarea
                      rows={3}
                      value={templateConfig.membershipSection?.content || ''}
                      onChange={(e) =>
                        setTemplateConfig(prev => ({
                          ...prev,
                          membershipSection: { ...prev.membershipSection, content: e.target.value }
                        }))
                      }
                      className="form-input"
                      style={{ resize: 'vertical' }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                    <div className="form-group">
                      <label className="form-label">Button Text</label>
                      <input
                        type="text"
                        value={templateConfig.membershipSection?.buttonText || ''}
                        onChange={(e) =>
                          setTemplateConfig(prev => ({
                            ...prev,
                            membershipSection: { ...prev.membershipSection, buttonText: e.target.value }
                          }))
                        }
                        className="form-input"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Button URL / Link</label>
                      <input
                        type="text"
                        value={templateConfig.membershipSection?.buttonUrl || ''}
                        onChange={(e) =>
                          setTemplateConfig(prev => ({
                            ...prev,
                            membershipSection: { ...prev.membershipSection, buttonUrl: e.target.value }
                          }))
                        }
                        className="form-input"
                        placeholder="/page/about-us"
                      />
                    </div>
                  </div>

                  {/* Promotional Image Picker */}
                  <div className="form-group">
                    <label className="form-label">Promotional Right-Side Image</label>
                    {templateConfig.membershipSection?.image ? (
                      <div>
                        <div style={{ borderRadius: '8px', overflow: 'hidden', maxHeight: '180px', marginBottom: '10px', background: '#000' }}>
                          <img
                            src={templateConfig.membershipSection.image}
                            alt="Membership preview"
                            style={{ width: '100%', height: '180px', objectFit: 'cover' }}
                          />
                        </div>
                        <div style={{ display: 'flex', gap: '10px' }}>
                          <button
                            type="button"
                            onClick={() => openPickerFor('membershipImage')}
                            className="button button-neutral button-small"
                          >
                            <ImageIcon size={13} /> Change Image
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setTemplateConfig(prev => ({
                                ...prev,
                                membershipSection: { ...prev.membershipSection, image: '' }
                              }))
                            }
                            className="button button-neutral button-small"
                          >
                            <Trash2 size={13} /> Remove
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <button
                          type="button"
                          onClick={() => openPickerFor('membershipImage')}
                          className="button button-neutral"
                        >
                          <ImageIcon size={15} /> Select from Media Library
                        </button>
                        <label className="button button-neutral" style={{ cursor: 'pointer' }}>
                          <Upload size={15} /> Upload Image
                          <input
                            type="file"
                            accept={ACCEPT_IMAGES}
                            style={{ display: 'none' }}
                            onChange={(e) => handleLocalUploadFor(e, 'membershipImage')}
                          />
                        </label>
                      </div>
                    )}
                  </div>
</MetaBox>
            </div>
          )}

          
          {/* VIDEOS TEMPLATE CONFIGURATION SETTINGS (Only shown when template === 'videos') */}
          {template === 'videos' && (
            <div style={{ marginBottom: '32px' }}>
              <div
                style={{
                  background: 'linear-gradient(135deg, var(--g-accent, rgba(99, 102, 241, 0.15)) 0%, rgba(139, 92, 246, 0.08) 100%)',
                  border: '1px solid var(--g-accent, rgba(99, 102, 241, 0.3))',
                  borderRadius: '12px',
                  padding: '16px 20px',
                  marginBottom: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}
              >
                <Film size={22} color="var(--primary-color)" />
                <div>
                  <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Videos Template Configuration
                  </h3>
                  <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)' }}>
                    Customize full-width video/image hero banner, typography, parent video categories, pagination, and dynamic sidebar widgets.
                  </p>
                </div>
              </div>

              {/* 1. Hero Banner Settings */}
              <MetaBox title="Section 1: Hero Banner Settings">
{/* Banner Type: Video vs Image */}
                  <div className="form-group" style={{ marginBottom: '16px' }}>
                    <label className="form-label">Banner Media Type</label>
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <label
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '10px 18px',
                          borderRadius: '8px',
                          border: `1px solid ${videosConfig.banner?.type === 'video' ? 'var(--primary-color)' : 'var(--border-color)'}`,
                          background: videosConfig.banner?.type === 'video' ? 'var(--g-accent, rgba(99, 102, 241, 0.1))' : 'transparent',
                          cursor: 'pointer'
                        }}
                      >
                        <input
                          type="radio"
                          name="bannerType"
                          checked={videosConfig.banner?.type === 'video'}
                          onChange={() =>
                            setVideosConfig(prev => ({
                              ...prev,
                              banner: { ...prev.banner, type: 'video' }
                            }))
                          }
                          style={{ margin: 0 }}
                        />
                        <Film size={15} color="var(--primary-color)" />
                        <span style={{ fontWeight: 600, fontSize: '13px' }}>Background Video (Autoplay / Loop)</span>
                      </label>

                      <label
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '10px 18px',
                          borderRadius: '8px',
                          border: `1px solid ${videosConfig.banner?.type === 'image' ? 'var(--primary-color)' : 'var(--border-color)'}`,
                          background: videosConfig.banner?.type === 'image' ? 'var(--g-accent, rgba(99, 102, 241, 0.1))' : 'transparent',
                          cursor: 'pointer'
                        }}
                      >
                        <input
                          type="radio"
                          name="bannerType"
                          checked={videosConfig.banner?.type === 'image'}
                          onChange={() =>
                            setVideosConfig(prev => ({
                              ...prev,
                              banner: { ...prev.banner, type: 'image' }
                            }))
                          }
                          style={{ margin: 0 }}
                        />
                        <ImageIcon size={15} color="var(--primary-color)" />
                        <span style={{ fontWeight: 600, fontSize: '13px' }}>Background Image</span>
                      </label>
                    </div>
                  </div>

                  {/* Banner Media URL / Picker */}
                  <div className="form-group" style={{ marginBottom: '16px' }}>
                    <label className="form-label">
                      {videosConfig.banner?.type === 'video' ? 'Banner Video URL / File' : 'Banner Image URL / File'}
                    </label>
                    {videosConfig.banner?.mediaUrl ? (
                      <div style={{ marginBottom: '12px' }}>
                        {videosConfig.banner?.type === 'video' ? (
                          <div style={{ maxWidth: '400px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-color)', marginBottom: '8px' }}>
                            <video
                              src={videosConfig.banner?.mediaUrl}
                              autoPlay
                              muted
                              loop
                              playsInline
                              style={{ width: '100%', height: '180px', objectFit: 'cover' }}
                            />
                          </div>
                        ) : (
                          <div style={{ maxWidth: '400px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-color)', marginBottom: '8px' }}>
                            <img
                              src={videosConfig.banner?.mediaUrl}
                              alt="Banner Preview"
                              style={{ width: '100%', height: '180px', objectFit: 'cover' }}
                            />
                          </div>
                        )}
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            type="button"
                            onClick={() => openPickerFor('videoBannerMedia')}
                            className="button button-neutral button-small"
                          >
                            Change Media
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setVideosConfig(prev => ({
                                ...prev,
                                banner: { ...prev.banner, mediaUrl: '' }
                              }))
                            }
                            className="button button-neutral button-small"
                          >
                            <Trash2 size={13} /> Remove
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <button
                          type="button"
                          onClick={() => openPickerFor('videoBannerMedia')}
                          className="button button-neutral"
                        >
                          <ImageIcon size={15} /> Select from Media Library
                        </button>
                        <label className="button button-neutral" style={{ cursor: 'pointer' }}>
                          <Upload size={15} /> Upload File
                          <input
                            type="file"
                            accept={videosConfig.banner?.type === 'video' ? 'video/*' : 'image/*'}
                            style={{ display: 'none' }}
                            onChange={(e) => handleLocalUploadFor(e, 'videoBannerMedia')}
                          />
                        </label>
                      </div>
                    )}
                  </div>

                  {/* Height & Overlay Strength */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                    <div className="form-group">
                      <label className="form-label">Banner Height (vh, px, %)</label>
                      <input
                        type="text"
                        placeholder="e.g. 75vh, 600px, 90vh"
                        value={videosConfig.banner?.height || '75vh'}
                        onChange={(e) =>
                          setVideosConfig(prev => ({
                            ...prev,
                            banner: { ...prev.banner, height: e.target.value }
                          }))
                        }
                        className="form-input"
                      />
                      <div className="form-description">
                        Default is <code>75vh</code>. Accepts <code>vh</code>, <code>px</code>, or <code>%</code>.
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">
                        Overlay Darkness ({Math.round((videosConfig.banner?.overlayStrength ?? 0) * 100)}%)
                      </label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.05"
                          value={videosConfig.banner?.overlayStrength ?? 0}
                          onChange={(e) =>
                            setVideosConfig(prev => ({
                              ...prev,
                              banner: { ...prev.banner, overlayStrength: parseFloat(e.target.value) }
                            }))
                          }
                          style={{ flex: 1 }}
                        />
                        <span style={{ fontSize: '13px', fontWeight: 600, minWidth: '40px' }}>
                          {videosConfig.banner?.overlayStrength ?? 0}
                        </span>
                      </div>
                      <div className="form-description">Controls dark gradient overlay for text readability.</div>
                    </div>
                  </div>

                  {/* Text Alignment & Vertical Position */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                    <div className="form-group">
                      <label className="form-label">Text Alignment</label>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        {['left', 'center', 'right'].map((align) => (
                          <button
                            key={align}
                            type="button"
                            onClick={() =>
                              setVideosConfig(prev => ({
                                ...prev,
                                banner: { ...prev.banner, alignment: align }
                              }))
                            }
                            className={`button button-small ${videosConfig.banner?.alignment === align ? 'button-primary' : 'button-neutral'}`}
                            style={{ flex: 1, textTransform: 'capitalize' }}
                          >
                            {align}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Vertical Position</label>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        {['top', 'center', 'bottom'].map((pos) => (
                          <button
                            key={pos}
                            type="button"
                            onClick={() =>
                              setVideosConfig(prev => ({
                                ...prev,
                                banner: { ...prev.banner, verticalPosition: pos }
                              }))
                            }
                            className={`button button-small ${videosConfig.banner?.verticalPosition === pos ? 'button-primary' : 'button-neutral'}`}
                            style={{ flex: 1, textTransform: 'capitalize' }}
                          >
                            {pos}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Heading & Subheading */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                    <div className="form-group">
                      <label className="form-label">Main Heading</label>
                      <input
                        type="text"
                        placeholder="e.g. Explore Our Video Stories"
                        value={videosConfig.banner?.heading || ''}
                        onChange={(e) =>
                          setVideosConfig(prev => ({
                            ...prev,
                            banner: { ...prev.banner, heading: e.target.value }
                          }))
                        }
                        className="form-input"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Sub-heading (Badge Text)</label>
                      <input
                        type="text"
                        placeholder="e.g. Stories that bring every moment to life"
                        value={videosConfig.banner?.subheading || ''}
                        onChange={(e) =>
                          setVideosConfig(prev => ({
                            ...prev,
                            banner: { ...prev.banner, subheading: e.target.value }
                          }))
                        }
                        className="form-input"
                      />
                    </div>
                  </div>

                  {/* Description */}
                  <div className="form-group" style={{ marginBottom: '16px' }}>
                    <label className="form-label">Short Description</label>
                    <textarea
                      rows={2}
                      placeholder="e.g. Watch cinematic journeys, folklore tales, and exclusive documentary films."
                      value={videosConfig.banner?.description || ''}
                      onChange={(e) =>
                        setVideosConfig(prev => ({
                          ...prev,
                          banner: { ...prev.banner, description: e.target.value }
                        }))
                      }
                      className="form-textarea"
                    />
                  </div>

                  {/* Button Text & Button URL */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                    <div className="form-group">
                      <label className="form-label">Button Text</label>
                      <input
                        type="text"
                        placeholder="e.g. Explore Videos"
                        value={videosConfig.banner?.buttonText || ''}
                        onChange={(e) =>
                          setVideosConfig(prev => ({
                            ...prev,
                            banner: { ...prev.banner, buttonText: e.target.value }
                          }))
                        }
                        className="form-input"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Button URL / Anchor</label>
                      <input
                        type="text"
                        placeholder="e.g. #categories or /search"
                        value={videosConfig.banner?.buttonUrl || ''}
                        onChange={(e) =>
                          setVideosConfig(prev => ({
                            ...prev,
                            banner: { ...prev.banner, buttonUrl: e.target.value }
                          }))
                        }
                        className="form-input"
                      />
                    </div>
                  </div>

                  {/* Typography Font Sizes */}
                  <div style={{ padding: '14px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    <h4 style={{ margin: '0 0 12px', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      Typography Font Sizes (rem, px)
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '12px' }}>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label" style={{ fontSize: '11px' }}>Heading Size</label>
                        <input
                          type="text"
                          value={videosConfig.banner?.headingFontSize || '3rem'}
                          onChange={(e) =>
                            setVideosConfig(prev => ({
                              ...prev,
                              banner: { ...prev.banner, headingFontSize: e.target.value }
                            }))
                          }
                          className="form-input"
                          style={{ fontSize: '12px' }}
                        />
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label" style={{ fontSize: '11px' }}>Subheading Size</label>
                        <input
                          type="text"
                          value={videosConfig.banner?.subheadingFontSize || '1.25rem'}
                          onChange={(e) =>
                            setVideosConfig(prev => ({
                              ...prev,
                              banner: { ...prev.banner, subheadingFontSize: e.target.value }
                            }))
                          }
                          className="form-input"
                          style={{ fontSize: '12px' }}
                        />
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label" style={{ fontSize: '11px' }}>Description Size</label>
                        <input
                          type="text"
                          value={videosConfig.banner?.descriptionFontSize || '1rem'}
                          onChange={(e) =>
                            setVideosConfig(prev => ({
                              ...prev,
                              banner: { ...prev.banner, descriptionFontSize: e.target.value }
                            }))
                          }
                          className="form-input"
                          style={{ fontSize: '12px' }}
                        />
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label" style={{ fontSize: '11px' }}>Button Size</label>
                        <input
                          type="text"
                          value={videosConfig.banner?.buttonFontSize || '0.95rem'}
                          onChange={(e) =>
                            setVideosConfig(prev => ({
                              ...prev,
                              banner: { ...prev.banner, buttonFontSize: e.target.value }
                            }))
                          }
                          className="form-input"
                          style={{ fontSize: '12px' }}
                        />
                      </div>
                    </div>
                  </div>
</MetaBox>

              {/* 2. Layout & Categories Settings */}
              <MetaBox title="Section 2: Categories Section & Layout">
{/* Layout Option */}
                  <div className="form-group" style={{ marginBottom: '16px' }}>
                    <label className="form-label">Layout Mode</label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div
                        onClick={() =>
                          setVideosConfig(prev => ({
                            ...prev,
                            layout: { ...prev.layout, sidebar: 'with_sidebar' }
                          }))
                        }
                        style={{
                          padding: '14px',
                          borderRadius: '8px',
                          border: `2px solid ${videosConfig.layout?.sidebar === 'with_sidebar' ? 'var(--primary-color)' : 'var(--border-color)'}`,
                          background: videosConfig.layout?.sidebar === 'with_sidebar' ? 'var(--g-accent, rgba(99, 102, 241, 0.08))' : 'transparent',
                          cursor: 'pointer'
                        }}
                      >
                        <div style={{ fontWeight: 700, fontSize: '13px', marginBottom: '4px', color: 'var(--text-primary)' }}>
                          With Sidebar
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                          Categories grid + Dynamic Sidebar (Latest Videos, Most Viewed, Posts, Galleries).
                        </div>
                      </div>

                      <div
                        onClick={() =>
                          setVideosConfig(prev => ({
                            ...prev,
                            layout: { ...prev.layout, sidebar: 'without_sidebar' }
                          }))
                        }
                        style={{
                          padding: '14px',
                          borderRadius: '8px',
                          border: `2px solid ${videosConfig.layout?.sidebar === 'without_sidebar' ? 'var(--primary-color)' : 'var(--border-color)'}`,
                          background: videosConfig.layout?.sidebar === 'without_sidebar' ? 'var(--g-accent, rgba(99, 102, 241, 0.08))' : 'transparent',
                          cursor: 'pointer'
                        }}
                      >
                        <div style={{ fontWeight: 700, fontSize: '13px', marginBottom: '4px', color: 'var(--text-primary)' }}>
                          Without Sidebar (Full Width)
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                          Categories grid spans 100% width across the full container.
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Section Heading & Subtitle */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                    <div className="form-group">
                      <label className="form-label">Categories Section Heading</label>
                      <input
                        type="text"
                        placeholder="e.g. Browse Video Categories"
                        value={videosConfig.categories?.heading || ''}
                        onChange={(e) =>
                          setVideosConfig(prev => ({
                            ...prev,
                            categories: { ...prev.categories, heading: e.target.value }
                          }))
                        }
                        className="form-input"
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Categories Section Subtitle</label>
                      <input
                        type="text"
                        placeholder="e.g. Explore parent categories and discover subtopics"
                        value={videosConfig.categories?.subtitle || ''}
                        onChange={(e) =>
                          setVideosConfig(prev => ({
                            ...prev,
                            categories: { ...prev.categories, subtitle: e.target.value }
                          }))
                        }
                        className="form-input"
                      />
                    </div>
                  </div>

                  {/* Categories Per Page */}
                  <div className="form-group">
                    <label className="form-label">Parent Categories Per Page</label>
                    <input
                      type="number"
                      min="1"
                      max="24"
                      value={videosConfig.categories?.perPage || 6}
                      onChange={(e) =>
                        setVideosConfig(prev => ({
                          ...prev,
                          categories: { ...prev.categories, perPage: Number(e.target.value) }
                        }))
                      }
                      className="form-input"
                      style={{ maxWidth: '200px' }}
                    />
                    <div className="form-description">
                      The template strictly renders parent categories (root level). Subcategories appear dynamically on hover.
                    </div>
                  </div>
</MetaBox>

              {/* 3. Sidebar Widgets Settings (when Layout is With Sidebar) */}
              {videosConfig.layout?.sidebar === 'with_sidebar' && (
                <MetaBox title="Section 3: Dynamic Sidebar Widgets">
<p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                      Configure how many items appear dynamically in each sidebar widget. All items are pulled automatically from published content.
                    </p>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '16px' }}>
                      <div className="form-group">
                        <label className="form-label">Latest Videos</label>
                        <input
                          type="number"
                          min="1"
                          max="15"
                          value={videosConfig.sidebar?.latestVideosCount || 5}
                          onChange={(e) =>
                            setVideosConfig(prev => ({
                              ...prev,
                              sidebar: { ...prev.sidebar, latestVideosCount: Number(e.target.value) }
                            }))
                          }
                          className="form-input"
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Most Viewed Videos</label>
                        <input
                          type="number"
                          min="1"
                          max="10"
                          value={videosConfig.sidebar?.mostViewedVideosCount || 2}
                          onChange={(e) =>
                            setVideosConfig(prev => ({
                              ...prev,
                              sidebar: { ...prev.sidebar, mostViewedVideosCount: Number(e.target.value) }
                            }))
                          }
                          className="form-input"
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Latest Stories</label>
                        <input
                          type="number"
                          min="1"
                          max="10"
                          value={videosConfig.sidebar?.latestPostsCount || 3}
                          onChange={(e) =>
                            setVideosConfig(prev => ({
                              ...prev,
                              sidebar: { ...prev.sidebar, latestPostsCount: Number(e.target.value) }
                            }))
                          }
                          className="form-input"
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Latest Galleries</label>
                        <input
                          type="number"
                          min="1"
                          max="10"
                          value={videosConfig.sidebar?.latestGalleriesCount || 3}
                          onChange={(e) =>
                            setVideosConfig(prev => ({
                              ...prev,
                              sidebar: { ...prev.sidebar, latestGalleriesCount: Number(e.target.value) }
                            }))
                          }
                          className="form-input"
                        />
                      </div>
                    </div>
</MetaBox>
              )}
            </div>
          )}


          
          {(template === 'galleries' || template === 'gallery') && (
            <GalleriesTemplateEditor
              config={galleriesConfig}
              onChange={setGalleriesConfig}
              onOpenMediaPicker={openPickerFor}
            />
          )}

          {template === 'stories' && (
            <StoriesTemplateEditor
              config={storiesConfig}
              onChange={setStoriesConfig}
              onOpenMediaPicker={openPickerFor}
            />
          )}

          {template === 'search-by-video' && (
            <SearchByVideoTemplateEditor
              config={searchByVideoConfig}
              onChange={setSearchByVideoConfig}
              onOpenMediaPicker={openPickerFor}
            />
          )}

          {/* Standard Page Content Box */}
          <MetaBox id="content" title={template === 'home' ? 'Extra Page Content / SEO Notes' : 'Page Content'}>
<RichEditor
                value={content}
                onChange={setContent}
                placeholder={template === 'home' ? 'Optional extra rich text or SEO notes for home page...' : 'Write page content, add text, images, or media...'}
              />
</MetaBox>
        </div>

        {/* Right Column: Publish Box, Attributes, Featured Banner */}
        <div>
          {/* Publish / Status Box */}
          <MetaBox id="publish" title="Publish Settings">
<div className="form-group" style={{ marginBottom: '16px' }}>
                <label className="form-label">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="form-select"
                >
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
                  <option value="trash">Trash</option>
                </select>
              </div>

              <div
                style={{
                  paddingTop: '12px',
                  borderTop: '1px solid var(--border-color)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                {isEditing && (
                  <button
                    type="button"
                    onClick={async () => {
                      const isConfirmed = await confirm({ title: 'Move to Trash', message: 'Move this page to trash?', confirmText: 'Move to Trash' });
                      if (isConfirmed) {
                        setStatus('trash');
                        handleSubmit({ preventDefault: () => {} });
                      }
                    }}
                    className="button-link-delete"
                  >
                    Move to trash
                  </button>
                )}
                <button
                  type="submit"
                  disabled={saving}
                  className="button button-primary"
                  style={{ marginLeft: 'auto' }}
                >
                  {saving ? (
                    <>
                      <Loader2 size={14} className="spin" /> Saving...
                    </>
                  ) : (
                    <>
                      <Save size={14} /> {isEditing ? 'Update Page' : 'Publish Page'}
                    </>
                  )}
                </button>
              </div>
</MetaBox>

          {/* Page Attributes (Template Selector) */}
          <MetaBox title="Page Attributes">
<div className="form-group" style={{ marginBottom: '16px' }}>
                <label className="form-label">Template</label>
                <select
                  value={template}
                  onChange={(e) => setTemplate(e.target.value)}
                  className="form-select"
                  style={{ fontWeight: template === 'home' ? 700 : 400 }}
                >
                  <option value="default">Default Template</option>
                  <option value="home">🏠 Home Page Template</option>
                  <option value="videos">🎥 Videos Template</option>
                  <option value="search-by-video">🔍 Search By Video Template (WordPress)</option>
                  <option value="stories">📰 Stories Template</option>
                  <option value="galleries">📸 Galleries Template</option>
                  <option value="fullwidth">Full Width (No Sidebar)</option>
                  <option value="landing">Landing Page</option>
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: '0' }}>
                <label className="form-label">Menu Order</label>
                <input
                  type="number"
                  value={order}
                  onChange={(e) => setOrder(e.target.value)}
                  className="form-input"
                  min="0"
                />
              </div>
</MetaBox>

          {/* Featured Banner Image */}
          <MetaBox title="Featured / Banner Image">
{banner ? (
                <div>
                  <div
                    style={{
                      borderRadius: '8px',
                      overflow: 'hidden',
                      marginBottom: '12px',
                      background: '#090e18',
                      border: '1px solid var(--border-color)',
                      maxHeight: '180px'
                    }}
                  >
                    <img
                      src={banner}
                      alt="Banner Preview"
                      style={{ width: '100%', height: '180px', objectFit: 'cover', display: 'block' }}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={() => openPickerFor('banner')}
                      className="button button-neutral button-small"
                    >
                      <ImageIcon size={13} /> Change Image
                    </button>
                    <button
                      type="button"
                      onClick={() => setBanner('')}
                      className="button button-neutral button-small"
                    >
                      <Trash2 size={13} /> Remove
                    </button>
                  </div>

                  {/* Single-Post Style Hero Banner Options for Default / Full-Width Pages */}
                  {(template === 'default' || template === 'full-width' || template === 'contact') && (
                    <div
                      style={{
                        marginTop: '16px',
                        paddingTop: '16px',
                        borderTop: '1px solid var(--border-color, rgba(255, 255, 255, 0.1))'
                      }}
                    >
                      <p
                        style={{
                          margin: '0 0 12px',
                          fontSize: '11.5px',
                          fontWeight: 700,
                          color: '#38bdf8',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em'
                        }}
                      >
                        Hero Banner Options
                      </p>

                      {/* Banner Height */}
                      <div className="form-group" style={{ marginBottom: '12px' }}>
                        <label className="form-label" style={{ fontSize: '11px', marginBottom: '4px' }}>
                          Banner Height
                        </label>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px', marginBottom: '6px' }}>
                          {[
                            { label: 'Compact', val: '320px' },
                            { label: 'Standard', val: '420px' },
                            { label: 'Tall', val: '520px' },
                            { label: 'Cinema', val: '62vh' }
                          ].map((preset) => (
                            <button
                              key={preset.val}
                              type="button"
                              onClick={() => setDefaultBannerConfig((prev) => ({ ...prev, height: preset.val }))}
                              style={{
                                padding: '4px 6px',
                                fontSize: '10.5px',
                                borderRadius: '4px',
                                border:
                                  defaultBannerConfig.height === preset.val
                                    ? '1px solid var(--primary-color)'
                                    : '1px solid var(--border-color)',
                                background:
                                  defaultBannerConfig.height === preset.val
                                    ? 'var(--primary-subtle, rgba(59, 130, 246, 0.2))'
                                    : 'rgba(255, 255, 255, 0.04)',
                                color: defaultBannerConfig.height === preset.val ? '#fff' : 'var(--text-muted)',
                                cursor: 'pointer'
                              }}
                            >
                              {preset.label}
                            </button>
                          ))}
                        </div>
                        <input
                          type="text"
                          placeholder="e.g. 420px or 60vh"
                          value={defaultBannerConfig.height}
                          onChange={(e) => setDefaultBannerConfig((prev) => ({ ...prev, height: e.target.value }))}
                          className="form-input"
                          style={{ fontSize: '11.5px', padding: '5px 8px' }}
                        />
                      </div>

                      {/* Custom Heading */}
                      <div className="form-group" style={{ marginBottom: '12px' }}>
                        <label className="form-label" style={{ fontSize: '11px', marginBottom: '4px' }}>
                          Custom Heading (optional)
                        </label>
                        <input
                          type="text"
                          placeholder={title || 'Defaults to page title'}
                          value={defaultBannerConfig.heading}
                          onChange={(e) => setDefaultBannerConfig((prev) => ({ ...prev, heading: e.target.value }))}
                          className="form-input"
                          style={{ fontSize: '11.5px', padding: '5px 8px' }}
                        />
                      </div>

                      {/* Custom Subheading */}
                      <div className="form-group" style={{ marginBottom: '12px' }}>
                        <label className="form-label" style={{ fontSize: '11px', marginBottom: '4px' }}>
                          Subheading / Tagline (optional)
                        </label>
                        <textarea
                          rows={2}
                          placeholder="Subtitle or brief summary over the banner..."
                          value={defaultBannerConfig.subheading}
                          onChange={(e) => setDefaultBannerConfig((prev) => ({ ...prev, subheading: e.target.value }))}
                          className="form-input"
                          style={{ fontSize: '11.5px', padding: '5px 8px', resize: 'vertical' }}
                        />
                      </div>

                      {/* Text Alignment */}
                      <div className="form-group" style={{ marginBottom: '12px' }}>
                        <label className="form-label" style={{ fontSize: '11px', marginBottom: '4px' }}>
                          Text Alignment
                        </label>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          {['left', 'center'].map((align) => (
                            <button
                              key={align}
                              type="button"
                              onClick={() => setDefaultBannerConfig((prev) => ({ ...prev, alignment: align }))}
                              style={{
                                flex: 1,
                                padding: '5px 8px',
                                fontSize: '11px',
                                textTransform: 'capitalize',
                                borderRadius: '4px',
                                border:
                                  defaultBannerConfig.alignment === align
                                    ? '1px solid var(--primary-color)'
                                    : '1px solid var(--border-color)',
                                background:
                                  defaultBannerConfig.alignment === align
                                    ? 'var(--primary-subtle, rgba(59, 130, 246, 0.2))'
                                    : 'rgba(255, 255, 255, 0.04)',
                                color: defaultBannerConfig.alignment === align ? '#fff' : 'var(--text-muted)',
                                cursor: 'pointer'
                              }}
                            >
                              {align}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Overlay Darkness */}
                      <div className="form-group" style={{ marginBottom: '4px' }}>
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            fontSize: '11px',
                            marginBottom: '4px'
                          }}
                        >
                          <label className="form-label" style={{ margin: 0 }}>
                            Overlay Gradient
                          </label>
                          <span style={{ color: 'var(--text-muted)' }}>
                            {Math.round((defaultBannerConfig.overlayOpacity ?? 0.6) * 100)}%
                          </span>
                        </div>
                        <input
                          type="range"
                          min="0.2"
                          max="0.9"
                          step="0.05"
                          value={defaultBannerConfig.overlayOpacity ?? 0.6}
                          onChange={(e) =>
                            setDefaultBannerConfig((prev) => ({
                              ...prev,
                              overlayOpacity: parseFloat(e.target.value)
                            }))
                          }
                          style={{ width: '100%', cursor: 'pointer' }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <div
                    onClick={() => openPickerFor('banner')}
                    style={{
                      border: '2px dashed var(--border-color)',
                      borderRadius: '8px',
                      padding: '24px 16px',
                      textAlign: 'center',
                      cursor: 'pointer',
                      background: 'rgba(255, 255, 255, 0.02)',
                      transition: 'border-color 0.2s',
                      marginBottom: '10px'
                    }}
                  >
                    <ImageIcon size={32} style={{ opacity: 0.35, marginBottom: '8px' }} />
                    <p style={{ margin: '0 0 4px', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      Set Featured Image
                    </p>
                    <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-muted)' }}>
                      Select from Media Library or upload
                    </p>
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={() => openPickerFor('banner')}
                      className="button button-neutral button-small"
                      style={{ flex: 1, fontSize: '12px' }}
                    >
                      <ImageIcon size={13} /> Media Library
                    </button>
                    <label
                      className="button button-neutral button-small"
                      style={{ fontSize: '12px', cursor: 'pointer' }}
                    >
                      <Upload size={13} /> Upload
                      <input
                        type="file"
                        accept={ACCEPT_IMAGES}
                        style={{ display: 'none' }}
                        onChange={(e) => handleLocalUploadFor(e, 'banner')}
                      />
                    </label>
                  </div>
                </div>
              )}
</MetaBox>

        </div>
      </form>

      {/* Global Media Picker Modal */}
      <MediaPickerModal
        isOpen={mediaPickerOpen}
        onClose={() => {
          setMediaPickerOpen(false);
          setMediaPickerCallback(null);
        }}
        onSelect={handleMediaSelect}
        allowedType={
          mediaPickerTarget === 'searchByVideoBannerMedia' || mediaPickerTarget === 'customCallback'
            ? 'any'
            : mediaPickerTarget === 'videoBannerMedia'
              ? (videosConfig.banner?.type === 'video' ? 'video' : 'image')
              : 'image'
        }
        title={
          mediaPickerTarget === 'searchByVideoBannerMedia' || mediaPickerTarget === 'customCallback'
            ? (searchByVideoConfig.bannerType === 'video' ? 'Select Video from Media Library' : 'Select Media from Library')
            : mediaPickerTarget === 'videoBannerMedia'
              ? (videosConfig.banner?.type === 'video' ? 'Select Video for Banner' : 'Select Image for Banner')
              : 'Select Image from Media Library'
        }
      />
    </div>
  );
};

export default PageEditor;

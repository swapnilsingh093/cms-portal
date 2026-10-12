import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { categoryAPI } from '../../services/api';
import MediaPickerModal from '../../components/admin/MediaPickerModal';
import MetaBox from '../../components/admin/MetaBox';
import DraggableEditorLayout from '../../components/admin/DraggableEditorLayout';
import {
  ArrowLeft,
  Save,
  Trash2,
  Folder,
  Image as ImageIcon,
  Film,
  Upload,
  X,
  AlertCircle,
  CheckCircle,
  Eye,
  ExternalLink,
  Copy,
  Check,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Layout,
  Type,
  Maximize2
} from 'lucide-react';

const CategoryEditPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  // Category basic fields
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [parentCategory, setParentCategory] = useState('');
  const [type, setType] = useState('video'); // 'video' | 'gallery' | 'post'
  const [order, setOrder] = useState(0);
  const [isActive, setIsActive] = useState(true);

  // Media fields
  const [bannerType, setBannerType] = useState('image'); // 'video' | 'image'
  const [bannerVideo, setBannerVideo] = useState('');
  const [bannerImage, setBannerImage] = useState('');
  const [bannerFile, setBannerFile] = useState(null);
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState('');

  // Display & Typography
  const [mediaHeight, setMediaHeight] = useState('60vh');
  const [overlayStrength, setOverlayStrength] = useState(30);
  const [bannerPosition, setBannerPosition] = useState('50%');

  const getBannerPosPercent = (pos) => {
    if (pos === 'top') return 0;
    if (pos === 'bottom' || pos === 'lower') return 100;
    if (pos === 'center' || pos === 'middle' || !pos) return 50;
    const num = parseInt(String(pos).replace('%', '').trim(), 10);
    return isNaN(num) ? 50 : Math.max(0, Math.min(100, num));
  };
  const [alignment, setAlignment] = useState('left');
  const [verticalPosition, setVerticalPosition] = useState('center');
  const [headingFontSize, setHeadingFontSize] = useState('2.5rem');
  const [subheadingFontSize, setSubheadingFontSize] = useState('1.1rem');
  const [descriptionFontSize, setDescriptionFontSize] = useState('1rem');

  // Layout & CTA
  const [layout, setLayout] = useState('with_sidebar');
  const [buttonText, setButtonText] = useState('');
  const [buttonUrl, setButtonUrl] = useState('');
  const [buttonFontSize, setButtonFontSize] = useState('0.95rem');

  // Supporting state
  const [allCategories, setAllCategories] = useState([]);
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [parentCategorySlug, setParentCategorySlug] = useState('');
  const [copied, setCopied] = useState(false);

  // Media Picker state
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);
  const [mediaPickerTarget, setMediaPickerTarget] = useState('image'); // 'thumbnail' | 'bannerImage' | 'bannerVideo'

  const bannerFileInputRef = useRef(null);
  const thumbFileInputRef = useRef(null);

  // Determine back URL based on category type
  const getBackUrl = () => {
    if (type === 'gallery') return '/admin/gallery/categories';
    if (type === 'post') return '/admin/posts/categories';
    return '/admin/videos/categories';
  };

  // Calculate category frontend path and full URL (supporting up to 3 levels)
  const getCategoryFrontendPath = () => {
    if (!slug) return '';
    const section = type === 'video' ? 'videos' : type === 'gallery' ? 'galleries' : 'stories';
    if (parentCategory) {
      const parentObj = allCategories.find((c) => (c._id === parentCategory || c.id === parentCategory));
      if (parentObj) {
        const grandParentId = parentObj.parentCategory?._id || parentObj.parentCategory;
        if (grandParentId) {
          const grandParentObj = allCategories.find((c) => (c._id === grandParentId || c.id === grandParentId));
          if (grandParentObj?.slug) {
            return `/${section}/${grandParentObj.slug}/${parentObj.slug || parentCategorySlug}/${slug}`;
          }
        }
        const pSlug = parentObj?.slug || parentCategorySlug || '';
        if (pSlug) {
          return `/${section}/${pSlug}/${slug}`;
        }
      }
    }
    return `/${section}/${slug}`;
  };

  const categoryFrontendPath = getCategoryFrontendPath();
  const categoryFullUrl = categoryFrontendPath ? `${window.location.origin}${categoryFrontendPath}` : '';

  const handleCopyLink = () => {
    if (!categoryFullUrl) return;
    navigator.clipboard.writeText(categoryFullUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // 1. Fetch category data if editing
  useEffect(() => {
    if (!isEditing) return;

    const loadCategory = async () => {
      setLoading(true);
      try {
        const res = await categoryAPI.getById(id);
        if (res && res.category) {
          const cat = res.category;
          setName(cat.name || '');
          setSlug(cat.slug || '');
          setDescription(cat.description || '');
          setShortDescription(cat.shortDescription || '');
          setParentCategory(cat.parentCategory?._id || cat.parentCategory || '');
          setParentCategorySlug(cat.parentCategory?.slug || '');
          setType(cat.type || 'video');
          setOrder(cat.order || 0);
          setIsActive(cat.isActive !== false);

          // Media
          setBannerType(cat.bannerType || (cat.type === 'video' && cat.bannerVideo ? 'video' : 'image'));
          setBannerVideo(cat.bannerVideo || '');
          setBannerImage(cat.bannerImage || cat.banner || '');
          setThumbnailUrl(cat.thumbnail || '');
          setThumbnailPreview(cat.thumbnail || '');

          // Display
          setMediaHeight(cat.mediaHeight || '60vh');
          setOverlayStrength(cat.overlayStrength !== undefined ? Number(cat.overlayStrength) : 30);
          setBannerPosition(cat.bannerPosition || 'center');
          setAlignment(cat.alignment || 'left');
          setVerticalPosition(cat.verticalPosition || 'center');
          setHeadingFontSize(cat.headingFontSize || '2.5rem');
          setSubheadingFontSize(cat.subheadingFontSize || '1.1rem');
          setDescriptionFontSize(cat.descriptionFontSize || '1rem');

          // Layout & CTA
          setLayout(cat.layout || 'with_sidebar');
          setButtonText(cat.buttonText || '');
          setButtonUrl(cat.buttonUrl || '');
          setButtonFontSize(cat.buttonFontSize || '0.95rem');
        }
      } catch (err) {
        setError(err.message || 'Failed to load category');
      } finally {
        setLoading(false);
      }
    };

    loadCategory();
  }, [id, isEditing]);

  // 2. Fetch potential parent categories
  useEffect(() => {
    const fetchParents = async () => {
      try {
        const res = await categoryAPI.getAll({ type, strict: 'false', includeInactive: 'true' });
        if (res && res.categories) {
          // Exclude self if editing
          const filtered = res.categories.filter((c) => !id || c._id !== id);
          setAllCategories(filtered);
        }
      } catch (e) {
        console.error('Error fetching parent categories:', e);
      }
    };
    fetchParents();
  }, [type, id]);

  // Compute 3-level hierarchical parent list (Depth 0 = Root, Depth 1 = Sub)
  const selectableParentCategories = useMemo(() => {
    if (!Array.isArray(allCategories)) return [];
    const parentIdOf = (c) => (c?.parentCategory?._id ? c.parentCategory._id : c?.parentCategory);
    const roots = [];
    const childrenByParent = {};

    allCategories.forEach((cat) => {
      if (!cat) return;
      const pId = parentIdOf(cat);
      if (!pId) {
        roots.push(cat);
      } else {
        if (!childrenByParent[pId]) childrenByParent[pId] = [];
        childrenByParent[pId].push(cat);
      }
    });

    roots.sort((a, b) => String(a?.name || '').localeCompare(String(b?.name || '')));

    const result = [];
    roots.forEach((root) => {
      result.push({ ...root, depth: 0 });
      const kids = childrenByParent[root._id] || [];
      kids.sort((a, b) => String(a?.name || '').localeCompare(String(b?.name || '')));
      kids.forEach((kid) => {
        result.push({ ...kid, depth: 1 });
      });
    });

    return result;
  }, [allCategories]);

  // Media Picker handlers
  const openMediaPicker = (target) => {
    setMediaPickerTarget(target);
    setMediaPickerOpen(true);
  };

  const handleMediaPickerSelect = (mediaItem) => {
    const item = Array.isArray(mediaItem) ? mediaItem[0] : mediaItem;
    if (!item) return;
    const mediaUrl = item.url || item.path || '';
    if (!mediaUrl) return;

    if (mediaPickerTarget === 'thumbnail') {
      setThumbnailFile(null);
      setThumbnailUrl(mediaUrl);
      setThumbnailPreview(mediaUrl);
    } else if (mediaPickerTarget === 'bannerVideo') {
      setBannerFile(null);
      setBannerVideo(mediaUrl);
      setBannerType('video');
    } else if (mediaPickerTarget === 'bannerImage') {
      setBannerFile(null);
      setBannerImage(mediaUrl);
      setBannerType('image');
    }
    setMediaPickerOpen(false);
  };

  // File upload handlers
  const handleBannerFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isVideo = file.type.startsWith('video/');
    const previewUrl = URL.createObjectURL(file);

    setBannerFile(file);
    if (isVideo) {
      setBannerType('video');
      setBannerVideo(previewUrl);
    } else {
      setBannerType('image');
      setBannerImage(previewUrl);
    }
  };

  const handleThumbnailFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setThumbnailFile(file);
    setThumbnailPreview(URL.createObjectURL(file));
  };

  // Form submit
  const handleSave = async (e) => {
    if (e) e.preventDefault();
    if (!name.trim()) {
      setError('Please provide a category name');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const formData = new FormData();
      formData.append('name', name.trim());
      if (slug.trim()) formData.append('slug', slug.trim());
      formData.append('description', description);
      formData.append('shortDescription', shortDescription);
      formData.append('parentCategory', parentCategory || '');
      formData.append('type', type);
      formData.append('order', Number(order) || 0);
      formData.append('isActive', isActive);

      // Banner media
      formData.append('bannerType', bannerType);
      formData.append('bannerVideo', bannerVideo);
      formData.append('bannerImage', bannerImage);
      if (bannerFile) {
        formData.append('banner', bannerFile);
      } else {
        formData.append('banner', bannerType === 'video' ? bannerVideo : bannerImage);
      }

      // Thumbnail
      if (thumbnailFile) {
        formData.append('thumbnail', thumbnailFile);
      } else {
        formData.append('thumbnail', thumbnailUrl || '');
      }

      // Display settings
      formData.append('mediaHeight', mediaHeight);
      formData.append('overlayStrength', Number(overlayStrength));
      formData.append('bannerPosition', bannerPosition);
      formData.append('alignment', alignment);
      formData.append('verticalPosition', verticalPosition);
      formData.append('headingFontSize', headingFontSize);
      formData.append('subheadingFontSize', subheadingFontSize);
      formData.append('descriptionFontSize', descriptionFontSize);

      // Layout & CTA
      formData.append('layout', layout);
      formData.append('buttonText', buttonText);
      formData.append('buttonUrl', buttonUrl);
      formData.append('buttonFontSize', buttonFontSize);

      if (isEditing) {
        await categoryAPI.update(id, formData);
        setSuccess('Category updated successfully!');
      } else {
        const res = await categoryAPI.create(formData);
        setSuccess('Category created successfully!');
        if (res?.category?._id) {
          setTimeout(() => navigate(`/admin/categories/edit/${res.category._id}`), 600);
        }
      }
    } catch (err) {
      setError(err.message || 'Error saving category');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete category "${name}"?`)) return;
    try {
      await categoryAPI.delete(id);
      navigate(getBackUrl());
    } catch (err) {
      setError(err.message || 'Error deleting category');
    }
  };

  const isVideoCategory = type === 'video';
  const isSubcategory = Boolean(parentCategory);

  // Active media URL for preview
  const activeMediaUrl = bannerType === 'video' ? bannerVideo : bannerImage;

  if (loading) {
    return (
      <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
        <div style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>Loading Category...</div>
        <p style={{ fontSize: '13px' }}>Please wait while category details are retrieved.</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1240px', margin: '0 auto', padding: '24px 20px 80px' }}>
      {/* 1. Header Bar (WordPress Style) */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          flexWrap: 'wrap',
          marginBottom: '24px',
          paddingBottom: '16px',
          borderBottom: '1px solid var(--border-color, rgba(255, 255, 255, 0.1))'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <Link
            to={getBackUrl()}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 12px',
              borderRadius: '6px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--border-color, rgba(255,255,255,0.1))',
              color: 'var(--text-primary)',
              textDecoration: 'none',
              fontSize: '13px',
              fontWeight: 500
            }}
          >
            <ArrowLeft size={16} />
            Back to Categories
          </Link>
          <div>
            <h1 style={{ fontSize: '1.45rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
              {isEditing ? `Edit ${isSubcategory ? 'Subcategory' : 'Category'}: ${name || 'Untitled'}` : 'Add New Category'}
            </h1>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
              Type: <strong style={{ color: 'var(--primary-color)', textTransform: 'capitalize' }}>{type}</strong>
              {isSubcategory ? ' • (Subcategory)' : ' • (Top-Level Category)'}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {isEditing && slug && (
            <a
              href={`/${type === 'video' ? 'videos' : type === 'gallery' ? 'galleries' : 'stories'}/${slug}`}
              target="_blank"
              rel="noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '9px 14px',
                borderRadius: '6px',
                background: 'transparent',
                border: '1px solid var(--border-color, rgba(255,255,255,0.15))',
                color: 'var(--text-secondary)',
                textDecoration: 'none',
                fontSize: '13px'
              }}
            >
              <ExternalLink size={14} />
              View on Website
            </a>
          )}
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '9px 20px',
              borderRadius: '6px',
              background: 'linear-gradient(135deg, var(--g-accent, #6366f1), #8b5cf6)',
              border: 'none',
              color: '#fff',
              fontSize: '13.5px',
              fontWeight: 600,
              cursor: saving ? 'not-allowed' : 'pointer',
              opacity: saving ? 0.7 : 1,
              boxShadow: '0 2px 10px rgba(99, 102, 241, 0.35)'
            }}
          >
            <Save size={16} />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div
          style={{
            padding: '12px 16px',
            marginBottom: '20px',
            borderRadius: '8px',
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#f87171',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}
        >
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      {success && (
        <div
          style={{
            padding: '12px 16px',
            marginBottom: '20px',
            borderRadius: '8px',
            background: 'rgba(34, 197, 94, 0.12)',
            border: '1px solid rgba(34, 197, 94, 0.3)',
            color: '#4ade80',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}
        >
          <CheckCircle size={18} />
          {success}
        </div>
      )}

      {/* Main 2-Column WordPress Style Layout */}
      <form onSubmit={handleSave}>
        <DraggableEditorLayout
          layoutKey="category-editor-layout"
          defaultLayout={{
            main: ['details', 'media', 'layout-cta', 'preview'],
            sidebar: ['publish', 'thumbnail', 'banner-display', 'typography']
          }}
        >
          {/* Card 1: Basic Information */}
          <MetaBox id="details" title="Category Details" icon={<Folder size={16} color="var(--primary-color)" />}>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
                    Name <span style={{ color: '#f87171' }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Action Movies"
                    required
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '6px',
                      border: '1px solid var(--border-color, rgba(255,255,255,0.12))',
                      background: 'rgba(0,0,0,0.25)',
                      color: 'var(--text-primary)',
                      fontSize: '14px',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />

                  {/* Category Direct Access / Permalink (WordPress Style) */}
                  {slug ? (
                    <div
                      style={{
                        marginTop: '8px',
                        padding: '8px 12px',
                        background: 'rgba(59, 130, 246, 0.08)',
                        border: '1px solid rgba(59, 130, 246, 0.22)',
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '12px',
                        flexWrap: 'wrap',
                        fontSize: '12.5px'
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          minWidth: 0,
                          flex: 1
                        }}
                      >
                        <span style={{ color: 'var(--text-muted)', fontWeight: 600, flexShrink: 0 }}>
                          Permalink:
                        </span>
                        <a
                          href={categoryFrontendPath}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            color: '#60a5fa',
                            textDecoration: 'none',
                            fontWeight: 500,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
                          onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
                          title="Open category page in new tab"
                        >
                          {categoryFullUrl || `${window.location.origin}${categoryFrontendPath}`}
                        </a>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                        <button
                          type="button"
                          onClick={handleCopyLink}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            background: 'rgba(255, 255, 255, 0.08)',
                            border: '1px solid rgba(255, 255, 255, 0.12)',
                            borderRadius: '4px',
                            color: copied ? '#4ade80' : 'var(--text-secondary)',
                            padding: '4px 10px',
                            fontSize: '12px',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                          }}
                          title="Copy category URL"
                        >
                          {copied ? <Check size={13} /> : <Copy size={13} />}
                          <span>{copied ? 'Copied!' : 'Copy Link'}</span>
                        </button>

                        <a
                          href={categoryFrontendPath}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            background: 'rgba(59, 130, 246, 0.2)',
                            border: '1px solid rgba(59, 130, 246, 0.4)',
                            borderRadius: '4px',
                            color: '#93c5fd',
                            padding: '4px 10px',
                            fontSize: '12px',
                            textDecoration: 'none',
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#3b82f6';
                            e.currentTarget.style.color = '#ffffff';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(59, 130, 246, 0.2)';
                            e.currentTarget.style.color = '#93c5fd';
                          }}
                          title="View category live on website"
                        >
                          <ExternalLink size={13} />
                          <span>View Category</span>
                        </a>
                      </div>
                    </div>
                  ) : null}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
                      Slug (URL)
                    </label>
                    <input
                      type="text"
                      value={slug}
                      onChange={(e) => setSlug(e.target.value)}
                      placeholder="e.g. action-movies"
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '6px',
                        border: '1px solid var(--border-color, rgba(255,255,255,0.12))',
                        background: 'rgba(0,0,0,0.25)',
                        color: 'var(--text-primary)',
                        fontSize: '13px',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
                      Parent Category
                    </label>
                    <select
                      value={parentCategory}
                      onChange={(e) => setParentCategory(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '6px',
                        border: '1px solid var(--border-color, rgba(255,255,255,0.12))',
                        background: 'var(--bg-card, #121829)',
                        color: 'var(--text-primary)',
                        fontSize: '13px',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    >
                      <option value="">— None (Top-level Category) —</option>
                      {selectableParentCategories.map((c) => (
                        <option key={c._id} value={c._id}>
                          {c.depth === 1 ? `— ${c.name}` : c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
                    Short Description (Banner Subtitle)
                  </label>
                  <input
                    type="text"
                    value={shortDescription}
                    onChange={(e) => setShortDescription(e.target.value)}
                    placeholder="Short catchphrase or tagline for the hero banner..."
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '6px',
                      border: '1px solid var(--border-color, rgba(255,255,255,0.12))',
                      background: 'rgba(0,0,0,0.25)',
                      color: 'var(--text-primary)',
                      fontSize: '13px',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
                    Description
                  </label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Full description for this category..."
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '6px',
                      border: '1px solid var(--border-color, rgba(255,255,255,0.12))',
                      background: 'rgba(0,0,0,0.25)',
                      color: 'var(--text-primary)',
                      fontSize: '13px',
                      outline: 'none',
                      boxSizing: 'border-box',
                      resize: 'vertical'
                    }}
                  />
                </div>
              </div>
          </MetaBox>

          {/* Card 2: Hero Banner Media */}
          <MetaBox id="media" title="Hero Banner Media" icon={<Film size={16} color="var(--primary-color)" />}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div>
                  <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>
                    {isVideoCategory
                      ? 'Upload or select a Video or Image banner for this video category.'
                      : `Set the hero banner image for this ${type} category.`}
                  </p>
                </div>

                {/* Media Type Toggle: ONLY for Video categories */}
                {isVideoCategory && (
                  <div
                    style={{
                      display: 'inline-flex',
                      background: 'rgba(0, 0, 0, 0.35)',
                      padding: '3px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color, rgba(255,255,255,0.1))'
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => setBannerType('video')}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '6px',
                        border: 'none',
                        background: bannerType === 'video' ? 'var(--g-accent, #6366f1)' : 'transparent',
                        color: bannerType === 'video' ? '#fff' : 'var(--text-muted)',
                        fontSize: '12.5px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <Film size={14} />
                      Video
                    </button>
                    <button
                      type="button"
                      onClick={() => setBannerType('image')}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '6px',
                        border: 'none',
                        background: bannerType === 'image' ? 'var(--g-accent, #6366f1)' : 'transparent',
                        color: bannerType === 'image' ? '#fff' : 'var(--text-muted)',
                        fontSize: '12.5px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <ImageIcon size={14} />
                      Image
                    </button>
                  </div>
                )}
              </div>

              {/* VIDEO BANNER CONTROLS (Only when type is video and bannerType is video) */}
              {isVideoCategory && bannerType === 'video' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <input
                      type="text"
                      value={bannerVideo}
                      onChange={(e) => setBannerVideo(e.target.value)}
                      placeholder="Paste video URL (.mp4, .webm) or upload below..."
                      style={{
                        flex: 1,
                        padding: '10px 12px',
                        borderRadius: '6px',
                        border: '1px solid var(--border-color, rgba(255,255,255,0.12))',
                        background: 'rgba(0,0,0,0.25)',
                        color: 'var(--text-primary)',
                        fontSize: '13px',
                        outline: 'none'
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => openMediaPicker('bannerVideo')}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '10px 14px',
                        borderRadius: '6px',
                        background: 'rgba(99, 102, 241, 0.15)',
                        border: '1px solid rgba(99, 102, 241, 0.4)',
                        color: '#a5b4fc',
                        fontSize: '12.5px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      <Film size={15} />
                      Media Library
                    </button>
                    <button
                      type="button"
                      onClick={() => bannerFileInputRef.current?.click()}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '10px 14px',
                        borderRadius: '6px',
                        background: 'rgba(255, 255, 255, 0.08)',
                        border: '1px solid var(--border-color, rgba(255,255,255,0.15))',
                        color: 'var(--text-primary)',
                        fontSize: '12.5px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      <Upload size={15} />
                      Upload Video
                    </button>
                    <input
                      ref={bannerFileInputRef}
                      type="file"
                      accept="video/*"
                      style={{ display: 'none' }}
                      onChange={handleBannerFileChange}
                    />
                  </div>

                  {bannerVideo && (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 12px',
                        borderRadius: '6px',
                        background: 'rgba(99, 102, 241, 0.08)',
                        border: '1px solid rgba(99, 102, 241, 0.2)',
                        fontSize: '12px',
                        color: 'var(--text-secondary)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                        <Film size={16} color="var(--primary-color)" />
                        <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                          {bannerVideo}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setBannerVideo('');
                          setBannerFile(null);
                        }}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#f87171',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '11px',
                          fontWeight: 600
                        }}
                      >
                        <X size={14} /> Remove
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* IMAGE BANNER CONTROLS (For all categories when bannerType is image) */}
              {(bannerType === 'image' || !isVideoCategory) && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <input
                      type="text"
                      value={bannerImage}
                      onChange={(e) => setBannerImage(e.target.value)}
                      placeholder="Paste image URL (.jpg, .png, .webp) or upload below..."
                      style={{
                        flex: 1,
                        padding: '10px 12px',
                        borderRadius: '6px',
                        border: '1px solid var(--border-color, rgba(255,255,255,0.12))',
                        background: 'rgba(0,0,0,0.25)',
                        color: 'var(--text-primary)',
                        fontSize: '13px',
                        outline: 'none'
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => openMediaPicker('bannerImage')}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '10px 14px',
                        borderRadius: '6px',
                        background: 'rgba(99, 102, 241, 0.15)',
                        border: '1px solid rgba(99, 102, 241, 0.4)',
                        color: '#a5b4fc',
                        fontSize: '12.5px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      <ImageIcon size={15} />
                      Media Library
                    </button>
                    <button
                      type="button"
                      onClick={() => bannerFileInputRef.current?.click()}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '10px 14px',
                        borderRadius: '6px',
                        background: 'rgba(255, 255, 255, 0.08)',
                        border: '1px solid var(--border-color, rgba(255,255,255,0.15))',
                        color: 'var(--text-primary)',
                        fontSize: '12.5px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      <Upload size={15} />
                      Upload Image
                    </button>
                    <input
                      ref={bannerFileInputRef}
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={handleBannerFileChange}
                    />
                  </div>

                  {bannerImage && (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 12px',
                        borderRadius: '6px',
                        background: 'rgba(99, 102, 241, 0.08)',
                        border: '1px solid rgba(99, 102, 241, 0.2)',
                        fontSize: '12px',
                        color: 'var(--text-secondary)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                        <ImageIcon size={16} color="var(--primary-color)" />
                        <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                          {bannerImage}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setBannerImage('');
                          setBannerFile(null);
                        }}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#f87171',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '11px',
                          fontWeight: 600
                        }}
                      >
                        <X size={14} /> Remove
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </MetaBox>

          {/* Card 3: Layout & Call-to-Action */}
          <MetaBox id="layout-cta" title="Page Layout & Call-to-Action" icon={<Layout size={16} color="var(--primary-color)" />}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
                    Page Sidebar Layout
                  </label>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      type="button"
                      onClick={() => setLayout('with_sidebar')}
                      style={{
                        padding: '9px 18px',
                        borderRadius: '6px',
                        border: layout === 'with_sidebar' ? '1px solid var(--g-accent, #6366f1)' : '1px solid rgba(255,255,255,0.1)',
                        background: layout === 'with_sidebar' ? 'rgba(99, 102, 241, 0.2)' : 'rgba(0,0,0,0.2)',
                        color: layout === 'with_sidebar' ? '#fff' : 'var(--text-muted)',
                        fontSize: '13px',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      With Sidebar
                    </button>
                    <button
                      type="button"
                      onClick={() => setLayout('without_sidebar')}
                      style={{
                        padding: '9px 18px',
                        borderRadius: '6px',
                        border: layout === 'without_sidebar' ? '1px solid var(--g-accent, #6366f1)' : '1px solid rgba(255,255,255,0.1)',
                        background: layout === 'without_sidebar' ? 'rgba(99, 102, 241, 0.2)' : 'rgba(0,0,0,0.2)',
                        color: layout === 'without_sidebar' ? '#fff' : 'var(--text-muted)',
                        fontSize: '13px',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      Full Width
                    </button>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.5fr 1fr', gap: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
                      CTA Button Text
                    </label>
                    <input
                      type="text"
                      value={buttonText}
                      onChange={(e) => setButtonText(e.target.value)}
                      placeholder="e.g. Watch Now or Explore"
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        borderRadius: '6px',
                        border: '1px solid var(--border-color, rgba(255,255,255,0.12))',
                        background: 'rgba(0,0,0,0.25)',
                        color: 'var(--text-primary)',
                        fontSize: '13px',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
                      CTA Button URL
                    </label>
                    <input
                      type="text"
                      value={buttonUrl}
                      onChange={(e) => setButtonUrl(e.target.value)}
                      placeholder="e.g. /videos or https://..."
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        borderRadius: '6px',
                        border: '1px solid var(--border-color, rgba(255,255,255,0.12))',
                        background: 'rgba(0,0,0,0.25)',
                        color: 'var(--text-primary)',
                        fontSize: '13px',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
                      Button Font Size
                    </label>
                    <input
                      type="text"
                      value={buttonFontSize}
                      onChange={(e) => setButtonFontSize(e.target.value)}
                      placeholder="e.g. 0.95rem or 14px"
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        borderRadius: '6px',
                        border: '1px solid var(--border-color, rgba(255,255,255,0.12))',
                        background: 'rgba(0,0,0,0.25)',
                        color: 'var(--text-primary)',
                        fontSize: '13px',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>
              </div>
          </MetaBox>

          {/* Card 4: Live Hero Banner Preview */}
          <MetaBox id="preview" title="Live Banner Preview" icon={<Eye size={17} color="var(--primary-color)" />}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Eye size={17} color="var(--primary-color)" />
                  <h2 style={{ fontSize: '1.05rem', fontWeight: 600, margin: 0, color: 'var(--text-primary)' }}>
                    Live Banner Preview
                  </h2>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  Rendering {bannerType === 'video' ? '🎬 Video' : '🖼️ Image'} • Height: {mediaHeight} • Darkness: {overlayStrength}%
                </div>
              </div>

              {/* Visual preview box */}
              <div
                style={{
                  position: 'relative',
                  width: '100%',
                  height: mediaHeight.includes('vh') ? '360px' : mediaHeight,
                  minHeight: '260px',
                  maxHeight: '480px',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  background: '#090d16',
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}
              >
                {/* 1. Media Layer: Video or Image */}
                {bannerType === 'video' && bannerVideo ? (
                  <video
                    key={bannerVideo}
                    src={bannerVideo}
                    autoPlay
                    loop
                    muted
                    playsInline
                    style={{
                      position: 'absolute',
                      inset: 0,
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      objectPosition: `center ${getBannerPosPercent(bannerPosition)}%`
                    }}
                  />
                ) : bannerImage ? (
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      backgroundImage: `url(${bannerImage})`,
                      backgroundSize: 'cover',
                      backgroundPosition: `center ${getBannerPosPercent(bannerPosition)}%`
                    }}
                  />
                ) : (
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexDirection: 'column',
                      gap: '8px',
                      color: 'var(--text-muted)',
                      fontSize: '13px'
                    }}
                  >
                    {bannerType === 'video' ? <Film size={36} opacity={0.3} /> : <ImageIcon size={36} opacity={0.3} />}
                    <span>No banner media selected. Upload or choose above.</span>
                  </div>
                )}

                {/* 2. Overlay Layer */}
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundColor: `rgba(0, 0, 0, ${overlayStrength / 100})`,
                    pointerEvents: 'none',
                    transition: 'background-color 0.2s ease'
                  }}
                />

                {/* 3. Text & Content Layer */}
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    padding: '36px 40px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent:
                      verticalPosition === 'top'
                        ? 'flex-start'
                        : verticalPosition === 'bottom'
                        ? 'flex-end'
                        : 'center',
                    alignItems:
                      alignment === 'center'
                        ? 'center'
                        : alignment === 'right'
                        ? 'flex-end'
                        : 'flex-start',
                    textAlign: alignment,
                    zIndex: 2,
                    boxSizing: 'border-box'
                  }}
                >
                  <span
                    style={{
                      fontSize: subheadingFontSize,
                      color: 'var(--primary-color, #818cf8)',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '1px',
                      marginBottom: '6px'
                    }}
                  >
                    {isSubcategory ? 'Subcategory' : `${type.toUpperCase()} CATEGORY`}
                  </span>

                  <h1
                    style={{
                      margin: '0 0 10px',
                      fontSize: headingFontSize,
                      fontWeight: 800,
                      color: '#ffffff',
                      lineHeight: 1.15,
                      textShadow: '0 2px 14px rgba(0,0,0,0.6)'
                    }}
                  >
                    {name || 'Category Name'}
                  </h1>

                  {(shortDescription || description) && (
                    <p
                      style={{
                        margin: '0 0 18px',
                        fontSize: descriptionFontSize,
                        color: 'rgba(255, 255, 255, 0.88)',
                        maxWidth: '560px',
                        lineHeight: 1.5,
                        textShadow: '0 1px 8px rgba(0,0,0,0.5)'
                      }}
                    >
                      {shortDescription || description}
                    </p>
                  )}

                  {buttonText && (
                    <a
                      href={buttonUrl || '#'}
                      onClick={(e) => e.preventDefault()}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '10px 22px',
                        borderRadius: '6px',
                        background: 'linear-gradient(135deg, var(--g-accent, #6366f1), #8b5cf6)',
                        color: '#fff',
                        fontSize: buttonFontSize,
                        fontWeight: 600,
                        textDecoration: 'none',
                        boxShadow: '0 4px 16px rgba(99, 102, 241, 0.45)'
                      }}
                    >
                      {buttonText}
                    </a>
                  )}
                </div>
              </div>
            </div>
          </MetaBox>

          {/* Box 1: Publish / Status */}
          <MetaBox id="publish" title="Publish Settings">

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <label style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Status</label>
                  <select
                    value={isActive ? 'active' : 'inactive'}
                    onChange={(e) => setIsActive(e.target.value === 'active')}
                    style={{
                      padding: '6px 10px',
                      borderRadius: '6px',
                      background: 'var(--bg-card, #121829)',
                      border: '1px solid var(--border-color, rgba(255,255,255,0.12))',
                      color: 'var(--text-primary)',
                      fontSize: '12.5px'
                    }}
                  >
                    <option value="active">Active (Visible)</option>
                    <option value="inactive">Inactive (Hidden)</option>
                  </select>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <label style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Display Order</label>
                  <input
                    type="number"
                    value={order}
                    onChange={(e) => setOrder(e.target.value)}
                    style={{
                      width: '80px',
                      padding: '6px 10px',
                      borderRadius: '6px',
                      background: 'rgba(0,0,0,0.25)',
                      border: '1px solid var(--border-color, rgba(255,255,255,0.12))',
                      color: 'var(--text-primary)',
                      fontSize: '12.5px',
                      textAlign: 'center'
                    }}
                  />
                </div>

                <div style={{ paddingTop: '10px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  {isEditing ? (
                    <button
                      type="button"
                      onClick={handleDelete}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#f87171',
                        cursor: 'pointer',
                        fontSize: '12.5px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <Trash2 size={14} /> Delete
                    </button>
                  ) : <div />}

                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving}
                    style={{
                      padding: '8px 18px',
                      borderRadius: '6px',
                      background: 'var(--g-accent, #6366f1)',
                      border: 'none',
                      color: '#fff',
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: saving ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </div>
          </MetaBox>

          {/* Box 2: Banner Height & Overlay */}
          <MetaBox id="banner-display" title="Banner Display Settings">

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Media Height */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <label style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                      Banner Height
                    </label>
                    <span style={{ fontSize: '12px', color: 'var(--primary-color)', fontWeight: 600 }}>{mediaHeight}</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', marginBottom: '8px' }}>
                    {['40vh', '50vh', '60vh', '75vh'].map((h) => (
                      <button
                        key={h}
                        type="button"
                        onClick={() => setMediaHeight(h)}
                        style={{
                          padding: '6px 4px',
                          borderRadius: '5px',
                          border: mediaHeight === h ? '1px solid var(--g-accent, #6366f1)' : '1px solid rgba(255,255,255,0.1)',
                          background: mediaHeight === h ? 'rgba(99, 102, 241, 0.2)' : 'rgba(0,0,0,0.2)',
                          color: mediaHeight === h ? '#fff' : 'var(--text-muted)',
                          fontSize: '11.5px',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        {h}
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    value={mediaHeight}
                    onChange={(e) => setMediaHeight(e.target.value)}
                    placeholder="Custom height e.g. 500px, 80vh"
                    style={{
                      width: '100%',
                      padding: '7px 10px',
                      borderRadius: '5px',
                      border: '1px solid var(--border-color, rgba(255,255,255,0.1))',
                      background: 'rgba(0,0,0,0.25)',
                      color: 'var(--text-primary)',
                      fontSize: '12px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                {/* Overlay Darkness */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <label style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                      Overlay Darkness
                    </label>
                    <span style={{ fontSize: '12px', color: 'var(--primary-color)', fontWeight: 600 }}>{overlayStrength}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="90"
                    step="5"
                    value={overlayStrength}
                    onChange={(e) => setOverlayStrength(Number(e.target.value))}
                    style={{ width: '100%', accentColor: 'var(--g-accent, #6366f1)', cursor: 'pointer' }}
                  />
                </div>

                {/* Text Alignment */}
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Content Alignment
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                    {[
                      { val: 'left', label: 'Left', icon: AlignLeft },
                      { val: 'center', label: 'Center', icon: AlignCenter },
                      { val: 'right', label: 'Right', icon: AlignRight }
                    ].map((item) => {
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.val}
                          type="button"
                          onClick={() => setAlignment(item.val)}
                          style={{
                            padding: '7px 6px',
                            borderRadius: '5px',
                            border: alignment === item.val ? '1px solid var(--g-accent, #6366f1)' : '1px solid rgba(255,255,255,0.1)',
                            background: alignment === item.val ? 'rgba(99, 102, 241, 0.2)' : 'rgba(0,0,0,0.2)',
                            color: alignment === item.val ? '#fff' : 'var(--text-muted)',
                            fontSize: '12px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '4px'
                          }}
                        >
                          <Icon size={13} /> {item.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Vertical Position */}
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Vertical Placement
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                    {['top', 'center', 'bottom'].map((pos) => (
                      <button
                        key={pos}
                        type="button"
                        onClick={() => setVerticalPosition(pos)}
                        style={{
                          padding: '7px 6px',
                          borderRadius: '5px',
                          border: verticalPosition === pos ? '1px solid var(--g-accent, #6366f1)' : '1px solid rgba(255,255,255,0.1)',
                          background: verticalPosition === pos ? 'rgba(99, 102, 241, 0.2)' : 'rgba(0,0,0,0.2)',
                          color: verticalPosition === pos ? '#fff' : 'var(--text-muted)',
                          fontSize: '12px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          textTransform: 'capitalize'
                        }}
                      >
                        {pos}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Banner Image Focus Position (Presets + Precision Slider) */}
                <div>
                  {(() => {
                    const currentPercent = getBannerPosPercent(bannerPosition);
                    const positionLabel =
                      currentPercent === 0
                        ? 'Top (0%)'
                        : currentPercent === 50
                        ? 'Middle (50%)'
                        : currentPercent === 100
                        ? 'Lower (100%)'
                        : `${currentPercent}%`;

                    return (
                      <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                          <label style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                            Banner Image Position (Focus)
                          </label>
                          <span style={{ fontSize: '12px', color: 'var(--primary-color)', fontWeight: 600 }}>
                            {positionLabel}
                          </span>
                        </div>

                        {/* Quick Preset Buttons */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', marginBottom: '10px' }}>
                          {[
                            { val: 0, label: 'Top' },
                            { val: 50, label: 'Middle' },
                            { val: 100, label: 'Lower' }
                          ].map((item) => (
                            <button
                              key={item.val}
                              type="button"
                              onClick={() => setBannerPosition(`${item.val}%`)}
                              style={{
                                padding: '7px 6px',
                                borderRadius: '5px',
                                border: currentPercent === item.val ? '1px solid var(--g-accent, #6366f1)' : '1px solid rgba(255,255,255,0.1)',
                                background: currentPercent === item.val ? 'rgba(99, 102, 241, 0.2)' : 'rgba(0,0,0,0.2)',
                                color: currentPercent === item.val ? '#fff' : 'var(--text-muted)',
                                fontSize: '12px',
                                fontWeight: 600,
                                cursor: 'pointer',
                                textAlign: 'center'
                              }}
                            >
                              {item.label}
                            </button>
                          ))}
                        </div>

                        {/* Live Range Slider for Fine-tuning */}
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '11px', color: 'var(--text-muted)' }}>
                            <span>0% (Top)</span>
                            <span style={{ fontWeight: 600, color: 'var(--primary-color)' }}>{currentPercent}%</span>
                            <span>100% (Lower)</span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            step="1"
                            value={currentPercent}
                            onChange={(e) => setBannerPosition(`${e.target.value}%`)}
                            style={{
                              width: '100%',
                              accentColor: 'var(--g-accent, #6366f1)',
                              cursor: 'pointer'
                            }}
                          />
                        </div>

                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '5px' }}>
                          Drag the slider or click Top / Middle / Lower to adjust image focus vertically.
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
          </MetaBox>

          {/* Box 3: Typography Sizes */}
          <MetaBox id="typography" title="Banner Typography" icon={<Type size={16} />}>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    Heading Font Size
                  </label>
                  <input
                    type="text"
                    value={headingFontSize}
                    onChange={(e) => setHeadingFontSize(e.target.value)}
                    placeholder="e.g. 2.5rem or 36px"
                    style={{
                      width: '100%',
                      padding: '7px 10px',
                      borderRadius: '5px',
                      border: '1px solid var(--border-color, rgba(255,255,255,0.1))',
                      background: 'rgba(0,0,0,0.25)',
                      color: 'var(--text-primary)',
                      fontSize: '12px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    Subheading Font Size
                  </label>
                  <input
                    type="text"
                    value={subheadingFontSize}
                    onChange={(e) => setSubheadingFontSize(e.target.value)}
                    placeholder="e.g. 1.1rem or 16px"
                    style={{
                      width: '100%',
                      padding: '7px 10px',
                      borderRadius: '5px',
                      border: '1px solid var(--border-color, rgba(255,255,255,0.1))',
                      background: 'rgba(0,0,0,0.25)',
                      color: 'var(--text-primary)',
                      fontSize: '12px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    Description Font Size
                  </label>
                  <input
                    type="text"
                    value={descriptionFontSize}
                    onChange={(e) => setDescriptionFontSize(e.target.value)}
                    placeholder="e.g. 1rem or 14px"
                    style={{
                      width: '100%',
                      padding: '7px 10px',
                      borderRadius: '5px',
                      border: '1px solid var(--border-color, rgba(255,255,255,0.1))',
                      background: 'rgba(0,0,0,0.25)',
                      color: 'var(--text-primary)',
                      fontSize: '12px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>
          </MetaBox>

          {/* Box 4: Category Thumbnail / Icon */}
          <MetaBox id="thumbnail" title="Category Thumbnail / Icon" icon={<ImageIcon size={16} />}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div
                  style={{
                    width: '100%',
                    height: '130px',
                    borderRadius: '8px',
                    background: '#090d16',
                    border: '1px solid var(--border-color, rgba(255,255,255,0.12))',
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {thumbnailPreview ? (
                    <img
                      src={thumbnailPreview}
                      alt="Thumbnail preview"
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    />
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', color: 'var(--text-dim, #64748b)' }}>
                      <Folder size={32} />
                      <span style={{ fontSize: '12px' }}>No icon selected</span>
                    </div>
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => openMediaPicker('thumbnail')}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '5px',
                      padding: '7px 10px',
                      borderRadius: '6px',
                      background: 'rgba(99, 102, 241, 0.15)',
                      border: '1px solid rgba(99, 102, 241, 0.4)',
                      color: '#a5b4fc',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    <ImageIcon size={13} /> Library
                  </button>
                  <button
                    type="button"
                    onClick={() => thumbFileInputRef.current?.click()}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '5px',
                      padding: '7px 10px',
                      borderRadius: '6px',
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid var(--border-color, rgba(255,255,255,0.15))',
                      color: 'var(--text-primary)',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    <Upload size={13} /> Upload
                  </button>
                  <input
                    ref={thumbFileInputRef}
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handleThumbnailFileChange}
                  />
                </div>

                {thumbnailPreview && (
                  <button
                    type="button"
                    onClick={() => {
                      setThumbnailFile(null);
                      setThumbnailUrl('');
                      setThumbnailPreview('');
                    }}
                    style={{
                      width: '100%',
                      background: 'rgba(239, 68, 68, 0.1)',
                      border: '1px solid rgba(239, 68, 68, 0.25)',
                      color: '#f87171',
                      borderRadius: '6px',
                      padding: '6px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '5px',
                      fontSize: '12px',
                      fontWeight: 500
                    }}
                  >
                    <X size={13} /> Remove Thumbnail
                  </button>
                )}
              </div>
          </MetaBox>
        </DraggableEditorLayout>
      </form>

      {/* Media Picker Modal */}
      {mediaPickerOpen && (
        <MediaPickerModal
          isOpen={mediaPickerOpen}
          onClose={() => setMediaPickerOpen(false)}
          onSelect={handleMediaPickerSelect}
          allowedType={mediaPickerTarget === 'bannerVideo' ? 'video' : 'image'}
          title={
            mediaPickerTarget === 'bannerVideo'
              ? 'Select Banner Video'
              : mediaPickerTarget === 'thumbnail'
              ? 'Select Category Icon / Thumbnail'
              : 'Select Banner Image'
          }
        />
      )}
    </div>
  );
};

export default CategoryEditPage;

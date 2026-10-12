import MetaBox from '../../components/admin/MetaBox';
import { useConfirm } from '../../hooks/useConfirm';
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { galleryAPI, mediaAPI, userAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import MediaPickerModal from '../../components/admin/MediaPickerModal';
import RichEditor from '../../components/RichEditor';
import InlineCategoryCreator from '../../components/admin/InlineCategoryCreator';
import DraggableEditorLayout from '../../components/admin/DraggableEditorLayout';
import BannerFocusHeightControl from '../../components/admin/BannerFocusHeightControl';
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
  Star,
  Edit2,
  Upload,
  Plus,
  Eye,
  User
} from 'lucide-react';
import LiveBannerPreview from '../../components/admin/LiveBannerPreview';
import ScreenOptionsDrawer from '../../components/admin/ScreenOptionsDrawer';

const GALLERY_SCREEN_OPTIONS = [
  { id: 'short-description', label: 'Short Description (Banner Subtitle)' },
  { id: 'banner', label: 'Hero Banner Media' },
  { id: 'tags', label: 'Tags' },
  { id: 'live-preview', label: 'Live Banner Preview' }
];

const ACCEPT_IMAGES =
  'image/jpeg,image/png,image/webp,image/svg+xml,image/gif,image/bmp,image/tiff,.jpg,.jpeg,.png,.webp,.svg,.gif,.bmp,.tiff,.tif';

const GalleryEditor = () => {
  const { confirm, ConfirmDialog } = useConfirm();
  const { id } = useParams();
  const isEditing = Boolean(id);
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();

  // Core Gallery Fields
  const [author, setAuthor] = useState('');
  const [authorsList, setAuthorsList] = useState([]);
  const [screenOptions, setScreenOptions] = useState(() => {
    try {
      const saved = localStorage.getItem('cms_screen_options_gallery');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const handleScreenOptionToggle = (boxId, isEnabled) => {
    setScreenOptions((prev) => {
      const next = { ...prev, [boxId]: isEnabled };
      try {
        localStorage.setItem('cms_screen_options_gallery', JSON.stringify(next));
      } catch (e) {}
      return next;
    });
  };
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(false);
  const [editingSlugMode, setEditingSlugMode] = useState(false);
  const [tempSlug, setTempSlug] = useState('');

  const [description, setDescription] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [category, setCategory] = useState('');
  const [subCategory, setSubCategory] = useState('');
  const [childCategory, setChildCategory] = useState('');
  const [categories, setCategories] = useState([]);
  const [status, setStatus] = useState('published');
  const [tags, setTags] = useState('');
  const [age, setAge] = useState([]);
  const [maritalStatus, setMaritalStatus] = useState('');

  // Images & Cover
  const [coverImage, setCoverImage] = useState('');
  const [globalDragging, setGlobalDragging] = useState(false);
  const dragCounter = useRef(0);

  useEffect(() => {
    const handleDragEnter = (e) => {
      e.preventDefault();
      dragCounter.current += 1;
      if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
        setGlobalDragging(true);
      }
    };
    
    const handleDragLeave = (e) => {
      e.preventDefault();
      dragCounter.current -= 1;
      if (dragCounter.current === 0) {
        setGlobalDragging(false);
      }
    };
    
    const handleDragOver = (e) => {
      e.preventDefault();
    };
    
    const handleDrop = (e) => {
      e.preventDefault();
      dragCounter.current = 0;
      setGlobalDragging(false);
      
      const files = Array.from(e.dataTransfer.files || []);
      if (files.length > 0) {
        // Mock a synthetic event that handleLocalFilesUpload expects
        handleLocalFilesUpload({ target: { files } });
      }
    };

    window.addEventListener('dragenter', handleDragEnter);
    window.addEventListener('dragleave', handleDragLeave);
    window.addEventListener('dragover', handleDragOver);
    window.addEventListener('drop', handleDrop);

    return () => {
      window.removeEventListener('dragenter', handleDragEnter);
      window.removeEventListener('dragleave', handleDragLeave);
      window.removeEventListener('dragover', handleDragOver);
      window.removeEventListener('drop', handleDrop);
    };
  }, []);
  const [images, setImages] = useState([]); // [{ url, title, caption, order }]

  const [displayContent, setDisplayContent] = useState(true);
  const [layout, setLayout] = useState('with_sidebar');
  const [showSidebar, setShowSidebar] = useState(true);

  const [bannerUrl, setBannerUrl] = useState('');
  const [bannerType, setBannerType] = useState('image');
  const [bannerVideo, setBannerVideo] = useState('');
  const [bannerPosition, setBannerPosition] = useState('center');
  const [bannerHeight, setBannerHeight] = useState('60vh');
  const [overlayStrength, setOverlayStrength] = useState(0);
  const [alignment, setAlignment] = useState('left');
  const [verticalPosition, setVerticalPosition] = useState('center');
  const [bannerMediaId, setBannerMediaId] = useState('');
  const [featuredOnHomeBanner, setFeaturedOnHomeBanner] = useState(false);

  // Uploading state
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);

  // Modals
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);
  const [pickerTarget, setPickerTarget] = useState('cover'); // 'cover' | 'galleryImages'

  // Statuses
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    const fetchAuthors = async () => {
      try {
        const res = await userAPI.getAuthors();
        const rawList = res.data?.authors || res.authors || res.data?.users || res.users || [];
        const list = rawList.filter(
          (u) => ['admin', 'editor'].includes(u.role) && u.status === 'active'
        );
        setAuthorsList(list);
        if (!isEditing && currentUser?._id) {
          setAuthor((prev) => prev || currentUser._id);
        }
      } catch (err) {
        console.error('Failed to load authors:', err);
      }
    };
    fetchAuthors();
  }, [isEditing, currentUser]);

  useEffect(() => {
    if (isEditing) {
      loadGallery();
    }
  }, [id]);

  const loadGallery = async () => {
    setLoading(true);
    try {
      const res = await galleryAPI.getBySlug(id);
      if (res.gallery) {
        const g = res.gallery;
        setTitle(g.title || '');
        setSlug(g.slug || '');
        setIsSlugManuallyEdited(true);
        setDescription(g.description || '');
        setShortDescription(g.shortDescription || '');
        if (g.author) {
          setAuthor(g.author?._id || g.author);
        }
        setCategory(g.category?._id || g.category || '');
        setSubCategory(g.subCategory?._id || g.subCategory || '');
        setChildCategory(g.childCategory?._id || g.childCategory || '');
        const explicitCats = (Array.isArray(g.categories) ? g.categories : []).map((c) => (c?._id ? c._id : c));
        const slotCats = [g.category?._id || g.category, g.subCategory?._id || g.subCategory, g.childCategory?._id || g.childCategory].filter(Boolean);
        const loadedCats = Array.from(new Set([...explicitCats, ...slotCats])).map(String);
        setCategories(loadedCats);
        setStatus(g.status || 'published');
        setTags(Array.isArray(g.tags) ? g.tags.join(', ') : g.tags || '');
        setAge(Array.isArray(g.age) ? g.age : []);
        setMaritalStatus(g.maritalStatus || '');
        setDisplayContent(g.displayContent !== false);
        setLayout(g.layout || 'with_sidebar');
        setShowSidebar(g.showSidebar !== false && g.layout !== 'without_sidebar');

        setBannerUrl(g.banner || '');
        setBannerType(g.bannerType || 'image');
        setBannerVideo(g.bannerVideo || '');
        setBannerPosition(g.bannerPosition || 'center');
        setBannerHeight(g.bannerHeight || '60vh');
        setOverlayStrength(g.overlayStrength !== undefined ? Number(g.overlayStrength) : 0);
        setAlignment(g.alignment || 'left');
        setVerticalPosition(g.verticalPosition || 'center');
        setBannerMediaId(g.bannerMedia?._id || g.bannerMedia || '');
        setCoverImage(g.coverImage || '');
        setFeaturedOnHomeBanner(g.featuredOnHomeBanner === true);
        setImages(g.images || []);
        if (g.screenOptions && typeof g.screenOptions === 'object') {
          setScreenOptions((prev) => ({ ...prev, ...g.screenOptions }));
        }
      }
    } catch (err) {
      setMessage({
        type: 'error',
        text: err.response?.data?.message || err.message || 'Error loading gallery'
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

  const handleSaveSlug = () => {
    const clean = tempSlug
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
    setSlug(clean);
    setIsSlugManuallyEdited(true);
    setEditingSlugMode(false);
  };

  // Media Library Selection callback
  const handleMediaSelect = (mediaItem) => {
    if (pickerTarget === 'cover') {
      const item = Array.isArray(mediaItem) ? mediaItem[0] : mediaItem;
      if (item) setCoverImage(item.url);
    } else if (pickerTarget === 'banner') {
      const item = Array.isArray(mediaItem) ? mediaItem[0] : mediaItem;
      if (item) {
        setBannerUrl(item.url);
        if (item._id) setBannerMediaId(item._id);
      }
    } else if (pickerTarget === 'galleryImages') {
      const newItems = Array.isArray(mediaItem) ? mediaItem : [mediaItem];
      
      const formattedItems = newItems.map(m => ({ 
        url: m.url, 
        title: m.originalName || m.filename 
      }));
      
      setImages((prev) => [...prev, ...formattedItems]);
      
      if (!coverImage && formattedItems.length > 0) {
        setCoverImage(formattedItems[0].url);
      }
    }
  };

  // Unified Local Multi-Photo Upload -> Saves to Server & Central Media Library!
  const handleLocalFilesUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setUploadingPhotos(true);
    setMessage({ type: '', text: '' });

    try {
      const formData = new FormData();
      files.forEach((file) => formData.append('files', file));

      const res = await mediaAPI.upload(formData);
      const items = res.items || (res.media ? [res.media] : []);
      const newImages = items.map((m) => ({
        url: m.url,
        title: m.originalName || m.filename
      }));

      setImages((prev) => [...prev, ...newImages]);

      if (!coverImage && newImages.length > 0) {
        setCoverImage(newImages[0].url);
      }

      setMessage({
        type: 'success',
        text: `${newImages.length} photo(s) uploaded and saved to Media Library!`
      });
    } catch (err) {
      setMessage({
        type: 'error',
        text: err.response?.data?.message || err.message || 'Error uploading photos'
      });
    } finally {
      setUploadingPhotos(false);
    }
  };

  const handleLocalCoverUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingCover(true);
    setMessage({ type: '', text: '' });

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await mediaAPI.upload(formData);
      if (res.media) {
        setCoverImage(res.media.url);
        setMessage({
          type: 'success',
          text: `Cover image "${file.name}" uploaded and saved to Media Library!`
        });
      }
    } catch (err) {
      setMessage({
        type: 'error',
        text: err.response?.data?.message || err.message || 'Error uploading cover'
      });
    } finally {
      setUploadingCover(false);
    }
  };

  const handleRemoveImage = (index) => {
    setImages((prev) => {
      const updated = prev.filter((_, i) => i !== index);
      if (coverImage === prev[index]?.url) {
        setCoverImage(updated[0]?.url || '');
      }
      return updated;
    });
  };

  const handleLocalBannerUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingBanner(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await mediaAPI.upload(formData);
      if (res.media) {
        setBannerUrl(res.media.url);
        setBannerMediaId(res.media._id);
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Error uploading banner: ' + err.message });
    } finally {
      setUploadingBanner(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const effectiveTitle = title.trim() || 'Untitled Gallery';
    const hasContent = Boolean(
      images.length > 0 ||
      (coverImage && coverImage.trim()) ||
      bannerUrl ||
      description.trim() ||
      shortDescription.trim() ||
      galleryFiles.length > 0 ||
      coverFile ||
      bannerFile
    );
    const effectiveStatus = hasContent ? status : 'draft';

    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      const formData = new FormData();
      formData.append('title', effectiveTitle);
      formData.append('slug', slug.trim());
      formData.append('description', description);
      formData.append('shortDescription', shortDescription);
      if (author) formData.append('author', author);
      formData.append('category', category || '');
      formData.append('subCategory', subCategory || '');
      formData.append('childCategory', childCategory || '');
      formData.append('categories', JSON.stringify(categories || []));
      formData.append('status', effectiveStatus);
      formData.append('tags', tags);
      formData.append('age', JSON.stringify(age));
      formData.append('maritalStatus', maritalStatus);

      formData.append('displayContent', displayContent);
      formData.append('layout', showSidebar ? 'with_sidebar' : 'without_sidebar');
      formData.append('showSidebar', showSidebar);
      formData.append('featuredOnHomeBanner', featuredOnHomeBanner);

      formData.append('banner', bannerUrl || '');
      formData.append('bannerType', bannerType || 'image');
      formData.append('bannerVideo', bannerVideo || '');
      formData.append('overlayStrength', overlayStrength !== undefined ? overlayStrength : 0);
      formData.append('alignment', alignment || 'left');
      formData.append('verticalPosition', verticalPosition || 'center');
      formData.append('bannerPosition', bannerPosition || 'center');
      formData.append('bannerHeight', bannerHeight || '60vh');
      if (bannerMediaId) formData.append('bannerMedia', bannerMediaId);
      // Persist cover deletion correctly (empty string when cleared)
      formData.append('coverImage', coverImage || '');

      // Send the images array
      formData.append('images', JSON.stringify(images));
      formData.append('screenOptions', JSON.stringify(screenOptions));

      let res;
      if (isEditing) {
        res = await galleryAPI.update(id, formData);
        setMessage({ type: 'success', text: 'Photo gallery updated successfully!' });
      } else {
        res = await galleryAPI.create(formData);
        setMessage({ type: 'success', text: 'Photo gallery created successfully!' });
        if (res.gallery?._id) {
          navigate(`/admin/galleries/edit/${res.gallery._id}`, { replace: true });
        }
      }
    } catch (err) {
      setMessage({
        type: 'error',
        text: err.response?.data?.message || err.message || 'Error saving gallery'
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px', gap: '10px', color: 'var(--text-secondary)' }}>
      <ConfirmDialog />
        <Loader2 size={28} className="spin" /> Loading gallery editor...
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1360px', margin: '0 auto', position: 'relative' }}>
      <ScreenOptionsDrawer
        moduleTitle="Photo Gallery Screen Options"
        options={GALLERY_SCREEN_OPTIONS}
        screenOptions={screenOptions}
        onToggleOption={handleScreenOptionToggle}
        onChange={handleScreenOptionToggle}
      />
      {/* Top Bar with Back Link and Actions */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <Link to="/admin/galleries" className="button button-neutral" style={{ height: '40px', padding: '0 16px', display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '13.5px' }}>
            <ArrowLeft size={15} /> Back to Galleries
          </Link>
          <h1 style={{ fontSize: '20px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
            {isEditing ? 'Edit Gallery' : 'Add New Gallery'}
          </h1>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {isEditing && (
            <a
              href={`/gallery/${slug || id}`}
              target="_blank"
              rel="noreferrer"
              className="button button-neutral"
              style={{
                height: '40px',
                padding: '0 18px',
                fontSize: '13.5px',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                boxSizing: 'border-box'
              }}
            >
              <ExternalLink size={15} /> View Live Gallery
            </a>
          )}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="button button-primary"
            style={{
              height: '40px',
              padding: '0 18px',
              fontSize: '13.5px',
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              boxSizing: 'border-box'
            }}
          >
            {saving ? (
              <>
                <Loader2 size={15} className="spin" /> Saving...
              </>
            ) : (
              <>
                <Save size={15} /> {isEditing ? 'Update Gallery' : 'Publish Gallery'}
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
            border: `1px solid ${message.type === 'error' ? 'rgba(239, 68, 68, 0.3)' : 'var(--g-accent, rgba(16, 185, 129, 0.3))'}`
          }}
        >
          {message.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle size={18} />}
          <span>{message.text}</span>
          <button
            onClick={() => setMessage({ type: '', text: '' })}
            style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}
          >
            ×
          </button>
        </div>
      )}

      {/* Main Grid Layout */}
      <form onSubmit={handleSubmit}>
        <DraggableEditorLayout
          layoutKey="gallery-editor-layout"
          defaultLayout={{
            main: ['photos', 'description', 'short-description', 'live-preview'],
            sidebar: ['publish', 'categories', 'banner', 'cover', 'tags']
          }}
          mainTopContent={
            <>
              <input
                type="text"
                placeholder="Add Gallery Title"
                value={title}
                onChange={handleTitleChange}
                className="wp-title-input"
                autoFocus={!isEditing}
              />

              {/* Visible Permalink / Slug */}
              <div className="permalink-bar">
                <span>Permalink:</span>
                {editingSlugMode ? (
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <input
                      type="text"
                      value={tempSlug}
                      onChange={(e) => setTempSlug(e.target.value)}
                      className="form-input"
                      style={{ padding: '3px 8px', fontSize: '13px', width: '220px' }}
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
                      href={`/gallery/${slug || 'your-gallery'}`}
                      target="_blank"
                      rel="noreferrer"
                      className="permalink-url"
                    >
                      {window.location.origin}/gallery/{slug || 'untitled-gallery'}
                    </a>
                    <button
                      type="button"
                      onClick={() => {
                        setTempSlug(slug);
                        setEditingSlugMode(true);
                      }}
                      className="button button-small button-neutral"
                      style={{ padding: '2px 8px', fontSize: '11px', gap: '3px' }}
                    >
                      <Edit2 size={11} /> Edit Slug
                    </button>
                  </>
                )}
              </div>
            </>
          }
        >
          {/* Photo Management Box */}
          <MetaBox id="photos" title={`Gallery Photos (${images.length})`} icon={<ImageIcon size={16} color="var(--primary-color)" />}>
{images.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 16px', border: '2px dashed var(--border-color)', borderRadius: '12px' }}>
                  <ImageIcon size={44} color="var(--primary-color)" style={{ marginBottom: '12px' }} />
                  <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '6px' }}>
                    No Photos Added Yet
                  </h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '8px' }}>
                    Choose photos from your Media Library or upload directly from your computer.
                  </p>
                  <p style={{ color: 'var(--text-muted)', fontSize: '12px', marginBottom: '18px' }}>
                    Supports JPG, PNG, WEBP, SVG, GIF, BMP, TIFF formats.
                  </p>
                  <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                    <button
                      type="button"
                      onClick={() => {
                        setPickerTarget('galleryImages');
                        setMediaPickerOpen(true);
                      }}
                      className="button button-secondary button-small"
                    >
                      <ImageIcon size={14} /> Add from Media Library
                    </button>
                    <label className="button button-primary button-small" style={{ cursor: uploadingPhotos ? 'not-allowed' : 'pointer' }}>
                      {uploadingPhotos ? (
                        <>
                          <Loader2 size={14} className="spin" /> Uploading...
                        </>
                      ) : (
                        <>
                          <Upload size={14} /> Upload from Computer
                        </>
                      )}
                      <input
                        type="file"
                        multiple
                        accept={ACCEPT_IMAGES}
                        onChange={handleLocalFilesUpload}
                        disabled={uploadingPhotos}
                        style={{ display: 'none' }}
                      />
                    </label>
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                    gap: '14px'
                  }}
                >
                  {images.map((img, index) => {
                    const isCover = coverImage === img.url;
                    return (
                      <div
                        key={index}
                        style={{
                          borderRadius: '8px',
                          border: isCover ? '2px solid var(--primary-color)' : '1px solid var(--border-color)',
                          overflow: 'hidden',
                          background: 'var(--bg-surface)',
                          position: 'relative',
                          display: 'flex',
                          flexDirection: 'column'
                        }}
                      >
                        <div style={{ position: 'relative', height: '110px' }}>
                          <img
                            src={img.url}
                            alt=""
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                          {isCover && (
                            <span
                              style={{
                                position: 'absolute',
                                top: '6px',
                                left: '6px',
                                background: 'var(--primary-color)',
                                color: '#fff',
                                fontSize: '10px',
                                fontWeight: 700,
                                padding: '2px 6px',
                                borderRadius: '4px'
                              }}
                            >
                              COVER
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(index)}
                            style={{
                              position: 'absolute',
                              top: '6px',
                              right: '6px',
                              background: 'rgba(0,0,0,0.6)',
                              border: 'none',
                              color: '#fff',
                              borderRadius: '4px',
                              padding: '3px',
                              cursor: 'pointer'
                            }}
                            title="Remove Photo"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                        <div style={{ padding: '8px', fontSize: '11px', textAlign: 'center' }}>
                          {isCover ? (
                            <div
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '4px',
                                color: '#38bdf8',
                                fontWeight: 600,
                                fontSize: '11px',
                                padding: '5px 8px',
                                borderRadius: '6px',
                                background: 'rgba(56, 189, 248, 0.15)',
                                border: '1px solid rgba(56, 189, 248, 0.35)',
                                width: '100%',
                                boxSizing: 'border-box'
                              }}
                            >
                              <Check size={12} strokeWidth={2.5} /> Active Cover
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setCoverImage(img.url)}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '5px',
                                fontSize: '11.5px',
                                fontWeight: 500,
                                padding: '5px 8px',
                                borderRadius: '6px',
                                border: '1px solid var(--border-color, rgba(255, 255, 255, 0.15))',
                                background: 'rgba(255, 255, 255, 0.06)',
                                color: 'var(--text-primary, #e2e8f0)',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease',
                                width: '100%',
                                boxSizing: 'border-box'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'rgba(59, 130, 246, 0.2)';
                                e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.5)';
                                e.currentTarget.style.color = '#38bdf8';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
                                e.currentTarget.style.borderColor = 'var(--border-color, rgba(255, 255, 255, 0.15))';
                                e.currentTarget.style.color = 'var(--text-primary, #e2e8f0)';
                              }}
                            >
                              <Star size={11} /> Set as Cover
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
          </MetaBox>

          {/* Gallery Description */}
          <MetaBox id="description" title="Gallery Description">
            <RichEditor
              value={description}
              onChange={setDescription}
              placeholder="Write a brief description or story for this photo gallery..."
            />
          </MetaBox>

          {/* Short Description */}
          {screenOptions['short-description'] !== false && (
          <MetaBox id="short-description" title="Short Description (Banner Subtitle / Excerpt)">
            <textarea
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
              placeholder="Enter short description to display on hero banner and cards (e.g. A visual celebration of heritage and culture)..."
              rows={3}
              className="form-control"
              style={{ width: '100%', resize: 'vertical', background: 'var(--bg-card, #0f172a)', color: 'var(--text-primary, #f8fafc)', border: '1px solid var(--border-color, #334155)', borderRadius: '6px', padding: '12px' }}
            />
            <small style={{ color: 'var(--text-secondary, #94a3b8)', marginTop: '6px', display: 'block' }}>
              This text appears in the banner info box and listing card summaries.
            </small>
          </MetaBox>
          )}

          {/* Live Hero Banner Preview */}
          {screenOptions['live-preview'] !== false && (
          <MetaBox id="live-preview" title="Live Banner Preview" icon={<Eye size={17} color="var(--primary-color)" />}>
            <LiveBannerPreview
              bannerType={bannerType}
              bannerImage={bannerUrl}
              bannerVideo={bannerVideo}
              mediaHeight={bannerHeight}
              overlayStrength={overlayStrength}
              bannerPosition={bannerPosition}
              alignment={alignment}
              verticalPosition={verticalPosition}
              badge="GALLERY"
              title={title || 'Gallery Title'}
              description={shortDescription}
            />
          </MetaBox>
          )}

          {/* Publish Settings */}
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

              {/* Author Selection (WordPress-style) */}
              <div className="form-group" style={{ marginBottom: '16px', paddingTop: '12px', borderTop: '1px solid var(--border-color)' }}>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', fontSize: '13px', fontWeight: 600 }}>
                  <User size={13} color="var(--primary-color, #ea580c)" /> Author
                </label>
                <select
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  className="form-select"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    background: 'var(--bg-card, #0f172a)',
                    color: 'var(--text-primary, #f8fafc)',
                    border: '1px solid var(--border-color, rgba(255,255,255,0.12))',
                    fontSize: '13px',
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <option value="">-- Select Author / Creator --</option>
                  {authorsList.map((u) => (
                    <option key={u._id} value={u._id}>
                      {u.name || u.username || 'User'} (@{u.username || 'user'}) {u.role === 'admin' ? '[Administrator]' : u.role === 'editor' ? '[Editor]' : `[${u.role || 'User'}]`}
                    </option>
                  ))}
                </select>
                <p style={{ fontSize: '11px', color: 'var(--text-dim, #94a3b8)', margin: '4px 0 0' }}>
                  Assign author credited on this gallery.
                </p>
              </div>

              {/* Display This Content Option */}
              <div style={{ marginBottom: '16px', paddingTop: '14px', borderTop: '1px solid var(--border-color)' }}>
                <label className="form-label" style={{ marginBottom: '8px', display: 'block' }}>
                  Display this content?
                </label>
                <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13px', color: 'var(--text-main)' }}>
                    <input
                      type="radio"
                      name="galleryDisplayContent"
                      checked={displayContent === true}
                      onChange={() => setDisplayContent(true)}
                    />
                    <span>Yes</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13px', color: 'var(--text-main)' }}>
                    <input
                      type="radio"
                      name="galleryDisplayContent"
                      checked={displayContent === false}
                      onChange={() => setDisplayContent(false)}
                    />
                    <span>No</span>
                  </label>
                </div>
                <p style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '4px', margin: '4px 0 0' }}>
                  {displayContent ? 'Visible normally on the frontend.' : 'Hidden from frontend feeds; displays placeholder if referenced.'}
                </p>
              </div>
              {/* Single Gallery Sidebar Configuration */}
              <div style={{ marginBottom: '16px', paddingTop: '14px', borderTop: '1px solid var(--border-color)' }}>
                <label className="form-label" style={{ marginBottom: '8px', display: 'block', fontWeight: 600 }}>
                  Single Gallery Sidebar
                </label>
                <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13px', color: 'var(--text-main)' }}>
                    <input
                      type="radio"
                      name="galleryShowSidebar"
                      checked={showSidebar === true}
                      onChange={() => {
                        setShowSidebar(true);
                        setLayout('with_sidebar');
                      }}
                    />
                    <span>Enable Sidebar</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13px', color: 'var(--text-main)' }}>
                    <input
                      type="radio"
                      name="galleryShowSidebar"
                      checked={showSidebar === false}
                      onChange={() => {
                        setShowSidebar(false);
                        setLayout('without_sidebar');
                      }}
                    />
                    <span>Disable Sidebar</span>
                  </label>
                </div>
                <p style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '4px', margin: '4px 0 0' }}>
                  {showSidebar
                    ? 'Sidebar enabled: shows photographer info, album taxonomy, and related photo albums.'
                    : 'Sidebar disabled: full-width photo album layout.'}
                </p>
              </div>

              {/* Feature on Homepage Hero Banner Checkbox */}
              <div style={{ marginBottom: '16px', paddingTop: '14px', borderTop: '1px solid var(--border-color)' }}>
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer', userSelect: 'none' }}>
                  <input
                    type="checkbox"
                    checked={featuredOnHomeBanner === true}
                    onChange={(e) => setFeaturedOnHomeBanner(e.target.checked)}
                    style={{ marginTop: '3px', width: '16px', height: '16px', accentColor: '#10b981', cursor: 'pointer' }}
                  />
                  <div>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      Feature on Homepage Banner
                    </span>
                    <p style={{ fontSize: '11.5px', color: 'var(--text-muted)', margin: '2px 0 0', lineHeight: 1.4 }}>
                      Display this photo gallery on the main Homepage Hero Banner (replaces the gallery slide). Only one gallery can be featured at a time.
                    </p>
                  </div>
                </label>
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
                      const isConfirmed = await confirm({ title: 'Move to Trash', message: 'Move this gallery to trash?', confirmText: 'Move to Trash' });
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
                      <Save size={14} /> {isEditing ? 'Update' : 'Publish'}
                    </>
                  )}
                </button>
              </div>
</MetaBox>

          {/* Categories with Inline Creator */}
          <MetaBox id="categories" title="Categories">
            <InlineCategoryCreator
              taxonomyType="gallery"
              taxonomyLabel="Category"
              selectedCategory={category}
              selectedSubCategory={subCategory}
              selectedChildCategory={childCategory}
              selectedCategories={categories}
              onCategoryChange={setCategory}
              onSubCategoryChange={setSubCategory}
              onChildCategoryChange={setChildCategory}
              onCategoriesChange={setCategories}
            />
          </MetaBox>

                    {/* Dedicated Banner Metabox */}
          {screenOptions.banner !== false && (
          <MetaBox id="banner" title="Banner Image">
{bannerUrl ? (
                <div>
                  <div
                    style={{
                      borderRadius: '8px',
                      overflow: 'hidden',
                      marginBottom: '12px',
                      background: '#090e18'
                    }}
                  >
                    <img
                      src={bannerUrl}
                      alt="Banner Preview"
                      style={{ width: '100%', height: '140px', objectFit: 'cover', display: 'block' }}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={() => {
                        setPickerTarget('banner');
                        setMediaPickerOpen(true);
                      }}
                      className="button button-secondary button-small"
                      style={{ flex: 1 }}
                    >
                      Change Banner
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setBannerUrl('');
                        setBannerMediaId('');
                      }}
                      className="button button-danger-outline button-small"
                      title="Remove Banner"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '24px 10px', border: '1px dashed var(--border-color)', borderRadius: '8px' }}>
                  <ImageIcon size={32} color="var(--text-dim)" style={{ marginBottom: '8px' }} />
                  <p style={{ color: 'var(--text-secondary)', fontSize: '12px', marginBottom: '12px' }}>
                    Add a wide header/showcase banner image for this gallery.
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={() => {
                        setPickerTarget('banner');
                        setMediaPickerOpen(true);
                      }}
                      className="button button-secondary button-small"
                    >
                      <ImageIcon size={14} /> Select from Media Library
                    </button>
                    <label className="button button-neutral button-small" style={{ cursor: uploadingBanner ? 'not-allowed' : 'pointer' }}>
                      {uploadingBanner ? (
                        <>
                          <Loader2 size={14} className="spin" /> Uploading...
                        </>
                      ) : (
                        <>
                          <Upload size={14} /> Upload Banner Image
                        </>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={handleLocalBannerUpload}
                        disabled={uploadingBanner}
                      />
                    </label>
                  </div>
                </div>
              )}

              <BannerFocusHeightControl
                bannerPosition={bannerPosition}
                setBannerPosition={setBannerPosition}
                bannerHeight={bannerHeight}
                setBannerHeight={setBannerHeight}
                overlayStrength={overlayStrength}
                setOverlayStrength={setOverlayStrength}
                alignment={alignment}
                setAlignment={setAlignment}
                verticalPosition={verticalPosition}
                setVerticalPosition={setVerticalPosition}
                previewImage={bannerUrl}
              />
</MetaBox>
)}

          {/* Cover Image / Thumbnail Metabox */}
          <MetaBox id="cover" title="Gallery Thumbnail / Cover" icon={<ImageIcon size={16} />}>
            <div>
              {coverImage ? (
                <div>
                  <div
                    style={{
                      borderRadius: '8px',
                      overflow: 'hidden',
                      marginBottom: '12px',
                      background: '#090e18'
                    }}
                  >
                    <img
                      src={coverImage}
                      alt="Cover Preview"
                      style={{ width: '100%', height: '160px', objectFit: 'cover', display: 'block' }}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={() => {
                        setPickerTarget('cover');
                        setMediaPickerOpen(true);
                      }}
                      className="button button-secondary button-small"
                      style={{ flex: 1 }}
                    >
                      Change Cover
                    </button>
                    <button
                      type="button"
                      onClick={() => setCoverImage('')}
                      className="button button-danger-outline button-small"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '24px 10px', border: '1px dashed var(--border-color)', borderRadius: '8px' }}>
                  <ImageIcon size={32} color="var(--text-dim)" style={{ marginBottom: '8px' }} />
                  <p style={{ color: 'var(--text-secondary)', fontSize: '12px', marginBottom: '12px' }}>
                    Auto-selected from first photo if left blank.
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={() => {
                        setPickerTarget('cover');
                        setMediaPickerOpen(true);
                      }}
                      className="button button-secondary button-small"
                    >
                      <ImageIcon size={14} /> Select from Media Library
                    </button>
                    <label className="button button-neutral button-small" style={{ cursor: uploadingCover ? 'not-allowed' : 'pointer' }}>
                      {uploadingCover ? (
                        <>
                          <Loader2 size={14} className="spin" /> Uploading...
                        </>
                      ) : (
                        <>
                          <Upload size={14} /> Upload Cover Image
                        </>
                      )}
                      <input
                        type="file"
                        accept={ACCEPT_IMAGES}
                        onChange={handleLocalCoverUpload}
                        disabled={uploadingCover}
                        style={{ display: 'none' }}
                      />
                    </label>
                  </div>
                </div>
              )}
            </div>
          </MetaBox>


          {/* Tags */}
          {screenOptions.tags !== false && (
          <MetaBox id="tags" title="Tags">
            <input
              type="text"
              placeholder="Separate tags with commas"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="form-input"
              style={{ fontSize: '13px' }}
            />
            <span className="form-description">e.g. Photography, Landscapes, Event</span>
          </MetaBox>
          )}
        </DraggableEditorLayout>
      </form>

      {/* Global Unified Media Picker Modal */}
            {mediaPickerOpen && (
        <MediaPickerModal
          isOpen={mediaPickerOpen}
          onClose={() => setMediaPickerOpen(false)}
          onSelect={handleMediaSelect}
          title={pickerTarget === 'cover' ? 'Select Cover Image' : pickerTarget === 'banner' ? 'Select Banner Image' : 'Add Photos to Gallery'}
          allowedType="image"
          multiple={pickerTarget === 'galleryImages'}
        />
      )}

      {/* Global Drag Overlay */}
      {globalDragging && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'var(--g-accent, rgba(99, 102, 241, 0.2))',
          border: '4px dashed var(--primary-color)',
          zIndex: 999999, display: 'flex', alignItems: 'center', justifyContent: 'center',
          backdropFilter: 'blur(4px)'
        }}>
          <div style={{ background: 'var(--bg-card)', padding: '40px 60px', borderRadius: '16px', boxShadow: '0 20px 40px rgba(0,0,0,0.5)', textAlign: 'center' }}>
            <h2 style={{ color: 'var(--text-main)', fontSize: '1.8rem', margin: 0 }}>Drop files to add to Gallery</h2>
          </div>
        </div>
      )}
    </div>
  );
};

export default GalleryEditor;

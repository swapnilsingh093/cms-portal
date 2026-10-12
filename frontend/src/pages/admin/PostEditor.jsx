import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { postAPI, mediaAPI, userAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import RichEditor from '../../components/RichEditor';
import MediaPickerModal from '../../components/admin/MediaPickerModal';
import InlineCategoryCreator from '../../components/admin/InlineCategoryCreator';
import DraggableEditorLayout from '../../components/admin/DraggableEditorLayout';
import MetaBox from '../../components/admin/MetaBox';
import BannerFocusHeightControl from '../../components/admin/BannerFocusHeightControl';
import { useConfirm } from '../../hooks/useConfirm';
import {
  ArrowLeft,
  Save,
  ExternalLink,
  Film,
  Image as ImageIcon,
  CheckCircle,
  AlertCircle,
  Loader2,
  Eye,
  Trash2,
  Check,
  Edit2,
  Upload,
  FileVideo,
  BookOpen,
  FileUp,
  FileDown,
  FileText,
  ChevronDown,
  Type,
  Palette,
  User
} from 'lucide-react';
import LiveBannerPreview from '../../components/admin/LiveBannerPreview';
import DocumentImportExportModal from '../../components/admin/DocumentImportExportModal';
import ScreenOptionsDrawer from '../../components/admin/ScreenOptionsDrawer';

const POST_SCREEN_OPTIONS = [
  { id: 'excerpt', label: 'Short Description / Excerpt' },
  { id: 'banner', label: 'Hero Banner Media' },
  { id: 'video', label: 'Attached Video' },
  { id: 'post-layout', label: 'Book Reader & Layout' },
  { id: 'tags', label: 'Tags' },
  { id: 'doc-tools', label: 'Document Import & Export' },
  { id: 'live-preview', label: 'Live Banner Preview' }
];

const BOOK_WALLPAPERS = [
  {
    id: '',
    name: 'None (Plain Color)',
    desc: 'Classic clean solid paper',
    url: '',
    preview: '#fcfaf2'
  },
  {
    id: 'http://localhost:5001/uploads/images/2026/10/an-old-paper-background-with-leaves-and-vines-photo.jpg',
    name: 'Leaves & Vines',
    desc: 'Vintage floral borders & vines',
    url: 'http://localhost:5001/uploads/images/2026/10/an-old-paper-background-with-leaves-and-vines-photo.jpg',
    preview: 'http://localhost:5001/uploads/images/2026/10/an-old-paper-background-with-leaves-and-vines-photo.jpg'
  },
  {
    id: 'http://localhost:5001/uploads/images/2026/10/an-old-paper-background-with-leaves-and-branches-photo.jpg',
    name: 'Botanical Branches',
    desc: 'Delicate foliage on aged parchment',
    url: 'http://localhost:5001/uploads/images/2026/10/an-old-paper-background-with-leaves-and-branches-photo.jpg',
    preview: 'http://localhost:5001/uploads/images/2026/10/an-old-paper-background-with-leaves-and-branches-photo.jpg'
  },
  {
    id: 'http://localhost:5001/uploads/images/2026/10/ae5b48b7d8667818e86f51d4277c3034.jpg',
    name: 'Antique Parchment',
    desc: 'Golden sepia weathered parchment',
    url: 'http://localhost:5001/uploads/images/2026/10/ae5b48b7d8667818e86f51d4277c3034.jpg',
    preview: 'http://localhost:5001/uploads/images/2026/10/ae5b48b7d8667818e86f51d4277c3034.jpg'
  },
  {
    id: 'http://localhost:5001/uploads/images/2026/10/22c0a61dcdf751cfff696bf84472a216.jpg',
    name: 'Rustic Manuscript',
    desc: 'Deep warm textured manuscript',
    url: 'http://localhost:5001/uploads/images/2026/10/22c0a61dcdf751cfff696bf84472a216.jpg',
    preview: 'http://localhost:5001/uploads/images/2026/10/22c0a61dcdf751cfff696bf84472a216.jpg'
  }
];

const ACCEPT_IMAGES =
  'image/jpeg,image/png,image/webp,image/svg+xml,image/gif,image/bmp,image/tiff,.jpg,.jpeg,.png,.webp,.svg,.gif,.bmp,.tiff,.tif';
const ACCEPT_VIDEOS =
  'video/mp4,video/webm,video/quicktime,video/x-m4v,video/x-msvideo,video/x-matroska,video/mpeg,.mp4,.webm,.mov,.m4v,.avi,.mkv,.mpeg,.mpg';

const PostEditor = () => {
  const { id } = useParams();
  const isEditing = Boolean(id);
  const navigate = useNavigate();
  const { confirm, ConfirmDialog } = useConfirm();
  const { user: currentUser } = useAuth();

  // Core Post Fields
  const [author, setAuthor] = useState('');
  const [authorsList, setAuthorsList] = useState([]);
  const [screenOptions, setScreenOptions] = useState(() => {
    try {
      const saved = localStorage.getItem('cms_screen_options_post');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const handleScreenOptionToggle = (boxId, isEnabled) => {
    setScreenOptions((prev) => {
      const next = { ...prev, [boxId]: isEnabled };
      try {
        localStorage.setItem('cms_screen_options_post', JSON.stringify(next));
      } catch (e) {}
      return next;
    });
  };

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(false);
  const [editingSlugMode, setEditingSlugMode] = useState(false);
  const [tempSlug, setTempSlug] = useState('');

  const [content, setContent] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [category, setCategory] = useState('');
  const [subCategory, setSubCategory] = useState('');
  const [childCategory, setChildCategory] = useState('');
  const [categories, setCategories] = useState([]);
  const [status, setStatus] = useState('published');
  const [tags, setTags] = useState('');
  const [age, setAge] = useState([]);
  const [maritalStatus, setMaritalStatus] = useState('');

  // Post Presentation Layout
  const [layout, setLayout] = useState('default'); // 'default' | 'book'
  const [bookPaperColor, setBookPaperColor] = useState('#fcfaf2');
  const [bookCoverColor, setBookCoverColor] = useState('#18181b');
  const [bookTextColor, setBookTextColor] = useState('#2c2523');
  const [bookFontFamily, setBookFontFamily] = useState('serif');
  const [bookPaperImage, setBookPaperImage] = useState('');

  // Media
  const [featuredImage, setFeaturedImage] = useState('');
  const [bannerUrl, setBannerUrl] = useState('');
  const [bannerPosition, setBannerPosition] = useState('center');
  const [bannerHeight, setBannerHeight] = useState('60vh');
  const [overlayStrength, setOverlayStrength] = useState(0);
  const [alignment, setAlignment] = useState('left');
  const [verticalPosition, setVerticalPosition] = useState('center');
  const [bannerType, setBannerType] = useState('image');
  const [bannerVideo, setBannerVideo] = useState('');
  const [bannerMediaId, setBannerMediaId] = useState('');
  const [featuredOnHomeBanner, setFeaturedOnHomeBanner] = useState(false);
  const [displayContent, setDisplayContent] = useState(true);
  const [videoUrl, setVideoUrl] = useState('');
  const [videoType, setVideoType] = useState('none');
  const [videoPlaybackError, setVideoPlaybackError] = useState(false);

  // Uploading states
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);

  // Modals
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);
  const [pickerTarget, setPickerTarget] = useState('featuredImage'); // 'featuredImage' | 'video'
  const [docModalOpen, setDocModalOpen] = useState(false);
  const [docModalMode, setDocModalMode] = useState('import'); // 'import' | 'export'

  // Statuses
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleDocumentImportSuccess = (parsedData) => {
    if (parsedData.title) {
      setTitle(parsedData.title);
      if (!slug || !isSlugManuallyEdited) {
        setSlug(parsedData.title.toLowerCase().replace(/[^a-z0-9_-]/g, '-').replace(/-+/g, '-'));
      }
    }
    if (parsedData.content) {
      setContent(parsedData.content);
    }
    if (parsedData.excerpt) {
      setExcerpt(parsedData.excerpt);
      setShortDescription(parsedData.excerpt);
    }
    if (parsedData.featuredImage) {
      setFeaturedImage(parsedData.featuredImage);
    }
    setMessage({
      type: 'success',
      text: `Document "${parsedData.title || 'Story'}" imported successfully! Images extracted and layout preserved.`
    });
    setDocModalOpen(false);
  };

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
      loadPost();
    }
  }, [id]);

  useEffect(() => {
    setVideoPlaybackError(false);
  }, [videoUrl]);

  const loadPost = async () => {
    setLoading(true);
    try {
      const res = await postAPI.getBySlug(id);
      if (res.post) {
        const p = res.post;
        setTitle(p.title || '');
        setSlug(p.slug || '');
        setIsSlugManuallyEdited(true);
        setContent(p.content || '');
        setExcerpt(p.shortDescription || p.excerpt || '');
        if (p.author) {
          setAuthor(p.author?._id || p.author);
        }
        setCategory(p.category?._id || p.category || '');
        setSubCategory(p.subCategory?._id || p.subCategory || '');
        setChildCategory(p.childCategory?._id || p.childCategory || '');
        const explicitCats = (Array.isArray(p.categories) ? p.categories : []).map((c) => (c?._id ? c._id : c));
        const slotCats = [p.category?._id || p.category, p.subCategory?._id || p.subCategory, p.childCategory?._id || p.childCategory].filter(Boolean);
        const loadedCats = Array.from(new Set([...explicitCats, ...slotCats])).map(String);
        setCategories(loadedCats);
        setStatus(p.status || 'published');
        setTags(Array.isArray(p.tags) ? p.tags.join(', ') : p.tags || '');
        setAge(Array.isArray(p.age) ? p.age : []);
        setMaritalStatus(p.maritalStatus || '');
        setDisplayContent(p.displayContent !== false);
        setFeaturedImage(p.featuredImage || '');
        setBannerUrl(p.banner || '');
        setBannerPosition(p.bannerPosition || 'center');
        setBannerHeight(p.bannerHeight || '60vh');
        setOverlayStrength(p.overlayStrength !== undefined ? Number(p.overlayStrength) : 0);
        setAlignment(p.alignment || 'left');
        setVerticalPosition(p.verticalPosition || 'center');
        setBannerType(p.bannerType || 'image');
        setBannerVideo(p.bannerVideo || '');
        setBannerMediaId(p.bannerMedia?._id || p.bannerMedia || '');
        setFeaturedOnHomeBanner(p.featuredOnHomeBanner === true);
        setVideoUrl(p.videoUrl || '');
        setVideoType(p.videoType || (p.videoUrl ? 'media' : 'none'));
        setLayout(p.layout || 'default');
        setBookPaperColor(p.bookPaperColor || '#fcfaf2');
        setBookCoverColor(p.bookCoverColor || '#18181b');
        setBookTextColor(p.bookTextColor || '#2c2523');
        setBookFontFamily(p.bookFontFamily || 'serif');
        setBookPaperImage(p.bookPaperImage || '');
        if (p.screenOptions && typeof p.screenOptions === 'object') {
          setScreenOptions((prev) => ({ ...prev, ...p.screenOptions }));
        }
      }
    } catch (err) {
      setMessage({
        type: 'error',
        text: err.response?.data?.message || err.message || 'Error loading post'
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

  // Media Selection callback
  const handleMediaSelect = (mediaItem) => {
    if (pickerTarget === 'featuredImage') {
      setFeaturedImage(mediaItem.url);
    } else if (pickerTarget === 'banner') {
      setBannerUrl(mediaItem.url);
      if (mediaItem._id) setBannerMediaId(mediaItem._id);
    } else if (pickerTarget === 'video') {
      setVideoUrl(mediaItem.url);
      setVideoType('media');
      setVideoPlaybackError(false);
    }
  };

  // Direct Local File Upload Pipeline -> uploads to server & Media Library immediately!
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

  const handleLocalFeaturedImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    setMessage({ type: '', text: '' });

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await mediaAPI.upload(formData);
      if (res.media) {
        setFeaturedImage(res.media.url);
        setMessage({
          type: 'success',
          text: `Featured image "${file.name}" uploaded and saved to Media Library!`
        });
      }
    } catch (err) {
      setMessage({
        type: 'error',
        text: err.response?.data?.message || err.message || 'Error uploading image'
      });
    } finally {
      setUploadingImage(false);
    }
  };

  const handleLocalVideoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingVideo(true);
    setMessage({ type: '', text: '' });

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await mediaAPI.upload(formData);
      if (res.media) {
        setVideoUrl(res.media.url);
        setVideoType('media');
        setVideoPlaybackError(false);
        setMessage({
          type: 'success',
          text: `Video "${file.name}" uploaded and saved to Media Library!`
        });
      }
    } catch (err) {
      setMessage({
        type: 'error',
        text: err.response?.data?.message || err.message || 'Error uploading video'
      });
    } finally {
      setUploadingVideo(false);
    }
  };

  const handleRemoveVideo = () => {
    setVideoUrl('');
    setVideoType('none');
    setVideoPlaybackError(false);
  };

  // Save / Update Form Submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    const effectiveTitle = title.trim() || 'Untitled Post';
    const hasContent = Boolean(
      (content && content.replace(/<[^>]*>/g, '').trim()) ||
      excerpt.trim() ||
      featuredImage ||
      bannerUrl ||
      videoUrl
    );
    const effectiveStatus = hasContent ? status : 'draft';

    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      const payload = {
        title: effectiveTitle,
        slug: slug.trim(),
        content,
        excerpt,
        shortDescription: excerpt,
        author: author || undefined,
        category: category || null,
        subCategory: subCategory || null,
        childCategory: childCategory || null,
        categories: categories || [],
        status: effectiveStatus,
        tags,
        age,
        maritalStatus,
        displayContent,
        featuredOnHomeBanner,
        featuredImage: featuredImage || '',
        banner: bannerUrl || '',
        bannerType,
        bannerVideo,
        overlayStrength,
        alignment,
        verticalPosition,
        bannerPosition: bannerPosition || 'center',
        bannerHeight: bannerHeight || '60vh',
        bannerMedia: bannerMediaId || null,
        videoUrl: videoUrl || '',
        videoType: videoUrl ? videoType || 'media' : 'none',
        layout,
        bookPaperColor,
        bookCoverColor,
        bookTextColor,
        bookFontFamily,
        bookPaperImage,
        screenOptions
      };

      let res;
      if (isEditing) {
        res = await postAPI.update(id, payload);
        setMessage({ type: 'success', text: 'Post updated successfully!' });
      } else {
        res = await postAPI.create(payload);
        setMessage({ type: 'success', text: 'Post published successfully!' });
        if (res.post?._id) {
          navigate(`/admin/posts/edit/${res.post._id}`, { replace: true });
        }
      }
    } catch (err) {
      setMessage({
        type: 'error',
        text: err.response?.data?.message || err.message || 'Error saving post'
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px', gap: '10px', color: 'var(--text-secondary)' }}>
        <Loader2 size={28} className="spin" /> Loading post editor...
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1360px', margin: '0 auto', position: 'relative' }}>
      <ConfirmDialog />
      <ScreenOptionsDrawer
        moduleTitle="Post / Story Screen Options"
        options={POST_SCREEN_OPTIONS}
        screenOptions={screenOptions}
        onToggleOption={handleScreenOptionToggle}
        onChange={handleScreenOptionToggle}
      />
      {/* Top Bar with Back Link and Actions */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <Link to="/admin/posts" className="button button-neutral" style={{ height: '40px', padding: '0 16px', display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '13.5px' }}>
            <ArrowLeft size={15} /> Back to Posts
          </Link>
          <h1 style={{ fontSize: '20px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
            {isEditing ? 'Edit Post' : 'Add New Post'}
          </h1>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Document Import Button */}
          <button
            type="button"
            onClick={() => {
              setDocModalMode('import');
              setDocModalOpen(true);
            }}
            className="button button-neutral"
            style={{ height: '40px', padding: '0 14px', display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13.5px' }}
            title="Import from Apple Pages (.pages) or Microsoft Word (.docx)"
          >
            <FileUp size={14} color="#818cf8" /> Import Document
          </button>

          {/* Document Export Button */}
          <button
            type="button"
            onClick={() => {
              setDocModalMode('export');
              setDocModalOpen(true);
            }}
            className="button button-neutral"
            style={{ height: '40px', padding: '0 14px', display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13.5px' }}
            title="Export post as Word (.docx) or Apple Pages (.pages)"
          >
            <FileDown size={14} color="#34d399" /> Export Document
          </button>

          {isEditing && (
            <a
              href={`/post/${slug || id}`}
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
              <ExternalLink size={15} /> View Live Post
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
                <Save size={15} /> {isEditing ? 'Update Post' : 'Publish Post'}
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

      {/* Editor Main Layout Grid */}
      <form onSubmit={handleSubmit}>
        <DraggableEditorLayout
          layoutKey="post-editor-layout"
          defaultLayout={{
            main: ['content', 'video', 'excerpt', 'live-preview'],
            sidebar: ['publish', 'categories', 'banner', 'featured', 'post-layout', 'tags']
          }}
          mainTopContent={
            <>
              {/* Large Title Input */}
              <input
                type="text"
                placeholder="Add Post Title"
                value={title}
                onChange={handleTitleChange}
                className="wp-title-input"
                autoFocus={!isEditing}
              />

              {/* Visible Permalink / Slug Area */}
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
                      href={`/post/${slug || 'your-slug'}`}
                      target="_blank"
                      rel="noreferrer"
                      className="permalink-url"
                      title="Click to view public post in a new tab"
                    >
                      {window.location.origin}/post/{slug || 'untitled-post'}
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
            </>
          }
        >

          {/* Main Rich Content Editor with Global Add Media Toolbar */}
          <MetaBox id="content" title="Post Content">
            <RichEditor
              value={content}
              onChange={setContent}
              placeholder="Write your article, story, or news content..."
            />
          </MetaBox>

          {/* Attached Video Metabox */}
          {screenOptions.video !== false && (
          <MetaBox id="video" title="Attached Video" icon={<Film size={16} color="var(--primary-color)" />}>
              {videoUrl ? (
                <div>
                  <div
                    style={{
                      borderRadius: '8px',
                      overflow: 'hidden',
                      background: '#090e18',
                      marginBottom: '14px',
                      maxWidth: '560px'
                    }}
                  >
                    <video
                        src={videoUrl?.startsWith('/uploads/') ? `http://localhost:5001${videoUrl}` : videoUrl}
                        controls
                        style={{ width: '100%', maxHeight: '300px', display: 'block' }}
                      >
                        Your browser does not support video playback.
                      </video>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <button
                      type="button"
                      onClick={() => {
                        setPickerTarget('video');
                        setMediaPickerOpen(true);
                      }}
                      className="button button-secondary button-small"
                    >
                      <Film size={14} /> Change Video
                    </button>
                    <label className="button button-neutral button-small" style={{ cursor: uploadingVideo ? 'not-allowed' : 'pointer' }}>
                      {uploadingVideo ? (
                        <>
                          <Loader2 size={13} className="spin" /> Uploading...
                        </>
                      ) : (
                        <>
                          <Upload size={13} /> Upload Video
                        </>
                      )}
                      <input
                        type="file"
                        accept={ACCEPT_VIDEOS}
                        onChange={handleLocalVideoUpload}
                        disabled={uploadingVideo}
                        style={{ display: 'none' }}
                      />
                    </label>
                    <button
                      type="button"
                      onClick={handleRemoveVideo}
                      className="button button-danger-outline button-small"
                    >
                      <Trash2 size={14} /> Remove Video
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '28px 16px', border: '1px dashed var(--border-color)', borderRadius: '8px' }}>
                  <Film size={36} color="var(--text-dim)" style={{ marginBottom: '10px' }} />
                  <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '14px' }}>
                    Attach a video from Media Library or upload a new file.
                  </p>
                  <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                    <button
                      type="button"
                      onClick={() => {
                        setPickerTarget('video');
                        setMediaPickerOpen(true);
                      }}
                      className="button button-secondary button-small"
                    >
                      <Film size={14} /> Select from Media Library
                    </button>
                    <label className="button button-neutral button-small" style={{ cursor: uploadingVideo ? 'not-allowed' : 'pointer' }}>
                      {uploadingVideo ? (
                        <>
                          <Loader2 size={13} className="spin" /> Uploading...
                        </>
                      ) : (
                        <>
                          <Upload size={13} /> Upload Video File
                        </>
                      )}
                      <input
                        type="file"
                        accept={ACCEPT_VIDEOS}
                        onChange={handleLocalVideoUpload}
                        disabled={uploadingVideo}
                        style={{ display: 'none' }}
                      />
                    </label>
                  </div>
                </div>
              )}
          </MetaBox>
          )}

          {/* Excerpt Metabox */}
          {screenOptions.excerpt !== false && (
          <MetaBox id="excerpt" title="Short Description / Excerpt (Banner Subtitle)">
              <textarea
                placeholder="Enter short description or excerpt to display on the hero banner and cards (e.g. In-depth narratives, culture, and chronicles)..."
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                className="form-textarea"
                style={{ minHeight: '80px' }}
              />
          </MetaBox>
          )}

          {/* Card 4: Live Hero Banner Preview */}
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
              badge="STORY"
              title={title || 'Story Title'}
              description={excerpt}
            />
          </MetaBox>
          )}
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
                  Assign author credited on this story.
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
                      name="postDisplayContent"
                      checked={displayContent === true}
                      onChange={() => setDisplayContent(true)}
                    />
                    <span>Yes</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13px', color: 'var(--text-main)' }}>
                    <input
                      type="radio"
                      name="postDisplayContent"
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

              {/* Feature on Homepage Hero Banner Checkbox */}
              <div style={{ marginBottom: '16px', paddingTop: '14px', borderTop: '1px solid var(--border-color)' }}>
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer', userSelect: 'none' }}>
                  <input
                    type="checkbox"
                    checked={featuredOnHomeBanner === true}
                    onChange={(e) => setFeaturedOnHomeBanner(e.target.checked)}
                    style={{ marginTop: '3px', width: '16px', height: '16px', accentColor: '#ea580c', cursor: 'pointer' }}
                  />
                  <div>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      Feature on Homepage Banner
                    </span>
                    <p style={{ fontSize: '11.5px', color: 'var(--text-muted)', margin: '2px 0 0', lineHeight: 1.4 }}>
                      Display this story on the main Homepage Hero Banner (replaces the story slide). Only one story can be featured at a time.
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
                      const isConfirmed = await confirm({ title: 'Move to Trash', message: 'Move this post to trash?', confirmText: 'Move to Trash' });
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

          {/* Post Presentation Layout & Book Settings */}
          {screenOptions['post-layout'] !== false && (
          <MetaBox id="post-layout" title="Post Layout & Book Reader" icon={<BookOpen size={16} color="var(--primary-color)" />}>
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
                Select Post Layout
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setLayout('default')}
                  style={{
                    padding: '10px 8px',
                    borderRadius: '8px',
                    border: layout === 'default' ? '2px solid var(--primary-color)' : '1px solid var(--border-color)',
                    background: layout === 'default' ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                    color: layout === 'default' ? '#fff' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    textAlign: 'center',
                    fontSize: '12px',
                    fontWeight: 600,
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ fontSize: '18px', marginBottom: '4px' }}>📄</div>
                  Layout 1: Standard Article
                </button>

                <button
                  type="button"
                  onClick={() => setLayout('book')}
                  style={{
                    padding: '10px 8px',
                    borderRadius: '8px',
                    border: layout === 'book' ? '2px solid var(--primary-color)' : '1px solid var(--border-color)',
                    background: layout === 'book' ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                    color: layout === 'book' ? '#fff' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    textAlign: 'center',
                    fontSize: '12px',
                    fontWeight: 600,
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ fontSize: '18px', marginBottom: '4px' }}>📖</div>
                  Layout 2: 3D Animated Book
                </button>
              </div>
            </div>

            {layout === 'book' && (
              <div style={{ borderTop: '1px solid var(--border-color, rgba(255,255,255,0.08))', paddingTop: '12px', marginTop: '12px' }}>
                {/* Font Family */}
                <div>
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '11.5px',
                      fontWeight: 600,
                      color: 'var(--text-secondary, #cbd5e1)',
                      marginBottom: '8px'
                    }}
                  >
                    <Type size={13} color="var(--primary-color, #6366f1)" />
                    Book Typography Style
                  </label>
                  <div style={{ position: 'relative' }}>
                    <select
                      value={bookFontFamily}
                      onChange={(e) => setBookFontFamily(e.target.value)}
                      style={{
                        appearance: 'none',
                        WebkitAppearance: 'none',
                        MozAppearance: 'none',
                        width: '100%',
                        fontSize: '12px',
                        fontWeight: 500,
                        padding: '8px 32px 8px 12px',
                        borderRadius: '8px',
                        background: '#0f172a',
                        color: '#f8fafc',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        outline: 'none',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = '#6366f1';
                        e.target.style.boxShadow = '0 0 0 2px rgba(99, 102, 241, 0.25)';
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = 'rgba(255, 255, 255, 0.12)';
                        e.target.style.boxShadow = 'none';
                      }}
                    >
                      <option value="serif" style={{ background: '#0f172a', color: '#f8fafc' }}>
                        Classic Editorial Serif (Merriweather / Georgia)
                      </option>
                      <option value="literary" style={{ background: '#0f172a', color: '#f8fafc' }}>
                        Literary Antique (Cinzel / Playfair)
                      </option>
                      <option value="sans" style={{ background: '#0f172a', color: '#f8fafc' }}>
                        Modern Clean Sans (Inter)
                      </option>
                    </select>
                    <ChevronDown
                      size={14}
                      color="#94a3b8"
                      style={{
                        position: 'absolute',
                        right: '10px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        pointerEvents: 'none'
                      }}
                    />
                  </div>
                </div>

                {/* Book Paper Wallpaper */}
                <div style={{ marginTop: '14px' }}>
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '11.5px',
                      fontWeight: 600,
                      color: 'var(--text-secondary, #cbd5e1)',
                      marginBottom: '8px'
                    }}
                  >
                    <Palette size={13} color="var(--primary-color, #6366f1)" />
                    Book Paper Wallpaper (Old Paper Texture)
                  </label>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '8px' }}>
                    {BOOK_WALLPAPERS.map((wp) => {
                      const isSelected = (bookPaperImage || '') === wp.url;
                      return (
                        <div
                          key={wp.name}
                          onClick={() => setBookPaperImage(wp.url)}
                          style={{
                            cursor: 'pointer',
                            borderRadius: '8px',
                            border: isSelected ? '2px solid #6366f1' : '1px solid rgba(255,255,255,0.12)',
                            background: isSelected ? 'rgba(99,102,241,0.12)' : 'rgba(255,255,255,0.03)',
                            padding: '6px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '6px',
                            transition: 'all 0.2s ease',
                            position: 'relative',
                            boxShadow: isSelected ? '0 0 0 1px #6366f1' : 'none'
                          }}
                        >
                          <div
                            style={{
                              width: '100%',
                              height: '48px',
                              borderRadius: '6px',
                              border: '1px solid rgba(255,255,255,0.1)',
                              backgroundImage: wp.url ? `url(${wp.url})` : undefined,
                              backgroundColor: wp.url ? '#f5e4b7' : '#fcfaf2',
                              backgroundSize: 'cover',
                              backgroundPosition: 'center',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              position: 'relative',
                              overflow: 'hidden'
                            }}
                          >
                            {!wp.url && (
                              <span style={{ fontSize: '10px', color: '#64748b', fontWeight: 600 }}>Plain</span>
                            )}
                            {isSelected && (
                              <div
                                style={{
                                  position: 'absolute',
                                  top: '4px',
                                  right: '4px',
                                  background: '#6366f1',
                                  borderRadius: '50%',
                                  width: '18px',
                                  height: '18px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: '#fff',
                                  boxShadow: '0 2px 4px rgba(0,0,0,0.4)'
                                }}
                              >
                                <Check size={11} strokeWidth={3} />
                              </div>
                            )}
                          </div>
                          <div>
                            <div style={{ fontSize: '11px', fontWeight: 600, color: isSelected ? '#a5b4fc' : '#f1f5f9', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {wp.name}
                            </div>
                            <div style={{ fontSize: '9.5px', color: '#94a3b8', lineHeight: 1.2, marginTop: '2px' }}>
                              {wp.desc}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Optional Custom Wallpaper URL */}
                  <div style={{ marginTop: '8px' }}>
                    <input
                      type="text"
                      placeholder="Or enter custom wallpaper image URL..."
                      value={bookPaperImage}
                      onChange={(e) => setBookPaperImage(e.target.value)}
                      style={{
                        width: '100%',
                        fontSize: '11px',
                        padding: '6px 10px',
                        borderRadius: '6px',
                        background: '#0f172a',
                        color: '#f8fafc',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>
              </div>
            )}
          </MetaBox>
          )}

          {/* Categories with Inline Creator */}
          <MetaBox id="categories" title="Categories">
              <InlineCategoryCreator
                taxonomyType="post"
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
                    Add a wide header/showcase banner image for this story.
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

          {/* Featured Image Metabox */}
          <MetaBox id="featured" title="Featured Image">
              {featuredImage ? (
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
                      src={featuredImage}
                      alt="Featured Preview"
                      style={{ width: '100%', height: '180px', objectFit: 'cover', display: 'block' }}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={() => {
                        setPickerTarget('featuredImage');
                        setMediaPickerOpen(true);
                      }}
                      className="button button-secondary button-small"
                      style={{ flex: 1 }}
                    >
                      Change Image
                    </button>
                    <button
                      type="button"
                      onClick={() => setFeaturedImage('')}
                      className="button button-danger-outline button-small"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '24px 10px', border: '1px dashed var(--border-color)', borderRadius: '8px' }}>
                  <ImageIcon size={32} color="var(--text-dim)" style={{ marginBottom: '8px' }} />
                  <p style={{ color: 'var(--text-secondary)', fontSize: '12.5px', marginBottom: '12px' }}>
                    Set featured image for this post.
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={() => {
                        setPickerTarget('featuredImage');
                        setMediaPickerOpen(true);
                      }}
                      className="button button-secondary button-small"
                    >
                      <ImageIcon size={14} /> Select from Media Library
                    </button>
                    <label className="button button-neutral button-small" style={{ cursor: uploadingImage ? 'not-allowed' : 'pointer' }}>
                      {uploadingImage ? (
                        <>
                          <Loader2 size={13} className="spin" /> Uploading...
                        </>
                      ) : (
                        <>
                          <Upload size={13} /> Upload from Computer
                        </>
                      )}
                      <input
                        type="file"
                        accept={ACCEPT_IMAGES}
                        onChange={handleLocalFeaturedImageUpload}
                        disabled={uploadingImage}
                        style={{ display: 'none' }}
                      />
                    </label>
                  </div>
                </div>
              )}
          </MetaBox>


          {/* Document Import & Export Metabox */}
          {screenOptions['doc-tools'] !== false && (
          <MetaBox
            id="doc-tools"
            title="Document Import & Export (Mac & Windows)"
            icon={<FileText size={16} color="var(--primary-color)" />}
          >
            <div>
              <p style={{ color: 'var(--text-secondary, #94a3b8)', fontSize: '12.5px', margin: '0 0 14px 0', lineHeight: 1.5 }}>
                Directly import stories written in <strong>Apple Pages (.pages)</strong> or <strong>Microsoft Word (.docx)</strong>.
                All embedded images and formatting are extracted and preserved. You can also export this post anytime.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setDocModalMode('import');
                    setDocModalOpen(true);
                  }}
                  className="button button-secondary button-small"
                  style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px' }}
                >
                  <FileUp size={15} /> Import Document
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setDocModalMode('export');
                    setDocModalOpen(true);
                  }}
                  className="button button-neutral button-small"
                  style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px' }}
                >
                  <FileDown size={15} /> Export Post
                </button>
              </div>
            </div>
          </MetaBox>
          )}

          {/* Tags Metabox */}
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
              <span className="form-description">e.g. Technology, Guides, 2026</span>
          </MetaBox>
          )}
        </DraggableEditorLayout>
      </form>

      {/* Document Import & Export Modal */}
      {docModalOpen && (
        <DocumentImportExportModal
          isOpen={docModalOpen}
          onClose={() => setDocModalOpen(false)}
          mode={docModalMode}
          postId={id}
          postData={{
            title,
            slug,
            content,
            featuredImage,
            categoryName: categories.find(c => c._id === category)?.name || 'General'
          }}
          onImportSuccess={handleDocumentImportSuccess}
          autoCreate={false}
        />
      )}

      {/* Global Unified Media Picker Modal */}
      {mediaPickerOpen && (
        <MediaPickerModal
          isOpen={mediaPickerOpen}
          onClose={() => setMediaPickerOpen(false)}
          onSelect={handleMediaSelect}
          title={pickerTarget === 'featuredImage' ? 'Select Featured Image' : pickerTarget === 'banner' ? 'Select Banner Image' : 'Select Attached Video'}
          allowedType={pickerTarget === 'video' ? 'video' : 'image'}
        />
      )}
    </div>
  );
};

export default PostEditor;

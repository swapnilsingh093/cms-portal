import MetaBox from '../../components/admin/MetaBox';
import { useConfirm } from '../../hooks/useConfirm';
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { videoAPI, mediaAPI, videoFieldAPI, userAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import MediaPickerModal from '../../components/admin/MediaPickerModal';
import RichEditor from '../../components/RichEditor';
import DraggableEditorLayout from '../../components/admin/DraggableEditorLayout';
import InlineCategoryCreator from '../../components/admin/InlineCategoryCreator';
import BannerFocusHeightControl from '../../components/admin/BannerFocusHeightControl';
import {
  ArrowLeft,
  Save,
  ExternalLink,
  Film,
  Image as ImageIcon,
  CheckCircle,
  AlertCircle,
  Loader2,
  Trash2,
  Check,
  Edit2,
  Upload,
  FileVideo,
  Link as LinkIcon,
  Globe,
  X,
  Eye,
  SlidersHorizontal,
  AlignLeft,
  AlignCenter,
  AlignRight,
  User
} from 'lucide-react';
import LiveBannerPreview from '../../components/admin/LiveBannerPreview';
import ScreenOptionsDrawer from '../../components/admin/ScreenOptionsDrawer';

const VIDEO_SCREEN_OPTIONS = [
  { id: 'short-description', label: 'Short Description (Banner Subtitle)' },
  { id: 'banner', label: 'Hero Banner Media' },
  { id: 'video_details', label: 'Video Details & Custom Fields' },
  { id: 'tags', label: 'Tags' },
  { id: 'live-preview', label: 'Live Banner Preview' }
];

const CHOICE_CATEGORIES = ['Young Girl', 'Wife', 'Uncle', 'Old Man', 'Sasur'];
const AGE_GROUPS = ['20-25', '25-30', '30-35', '35-40', '40-45', '45-50', '50-55', '55-60'];
const MARITAL_STATUSES = ['Married', 'Un-Married'];

const ACCEPT_IMAGES =
  'image/jpeg,image/png,image/webp,image/svg+xml,image/gif,image/bmp,image/tiff,.jpg,.jpeg,.png,.webp,.svg,.gif,.bmp,.tiff,.tif';
const ACCEPT_VIDEOS =
  'video/mp4,video/webm,video/quicktime,video/x-m4v,video/x-msvideo,video/x-matroska,video/mpeg,.mp4,.webm,.mov,.m4v,.avi,.mkv,.mpeg,.mpg';
const getYouTubeEmbedUrl = (url) => {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? `https://www.youtube.com/embed/${match[2]}` : null;
};

const getVimeoEmbedUrl = (url) => {
  if (!url) return null;
  const match = url.match(/(?:www\.|player\.)?vimeo.com\/(?:channels\/(?:\w+\/)?|groups\/(?:[^\/]*)\/videos\/|album\/(?:\d+)\/video\/|video\/|)(\d+)(?:[a-zA-Z0-9_\-]+)?/);
  return match ? `https://player.vimeo.com/video/${match[1]}` : null;
};


const VideoEditor = () => {
  const { confirm, ConfirmDialog } = useConfirm();
  const { id } = useParams();
  const isEditing = Boolean(id);
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();

  // Core Video Fields
  const [author, setAuthor] = useState('');
  const [authorsList, setAuthorsList] = useState([]);
  const [screenOptions, setScreenOptions] = useState(() => {
    try {
      const saved = localStorage.getItem('cms_screen_options_video');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const handleScreenOptionToggle = (boxId, isEnabled) => {
    setScreenOptions((prev) => {
      const next = { ...prev, [boxId]: isEnabled };
      try {
        localStorage.setItem('cms_screen_options_video', JSON.stringify(next));
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
  const [descriptionPosition, setDescriptionPosition] = useState('after');
  const [category, setCategory] = useState('');
  const [subCategory, setSubCategory] = useState('');
  const [childCategory, setChildCategory] = useState('');
  const [categories, setCategories] = useState([]);
  const [status, setStatus] = useState('published');
  const [tags, setTags] = useState('');
  const [choiceCategory, setChoiceCategory] = useState([]);
  const [ageGroup, setAgeGroup] = useState('');
  const [maritalStatus, setMaritalStatus] = useState('');
  const [customFields, setCustomFields] = useState({});
  const [fieldGroups, setFieldGroups] = useState([]);

  const [fieldsLoaded, setFieldsLoaded] = useState(false);

  // Fetch dynamic video field groups on mount
  useEffect(() => {
    const fetchFields = async () => {
      try {
        const res = await videoFieldAPI.getAll({ activeOnly: true });
        if (res && res.data) {
          setFieldGroups(res.data);
        }
      } catch (err) {
        console.warn('Failed to load video fields, using defaults', err);
      } finally {
        setFieldsLoaded(true);
      }
    };
    fetchFields();
  }, []);

  // Fetch authors list
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

  // Compute dynamic options with defaults
  const choiceCategoryField = fieldGroups.find(
    (f) => f.key.toLowerCase() === 'choicecategory' && f.isActive !== false
  );
  const ageGroupField = fieldGroups.find(
    (f) => f.key.toLowerCase() === 'agegroup' && f.isActive !== false
  );
  const maritalStatusField = fieldGroups.find(
    (f) => f.key.toLowerCase() === 'maritalstatus' && f.isActive !== false
  );

  const isChoiceActive = !fieldsLoaded ? true : Boolean(choiceCategoryField);
  const isAgeActive = !fieldsLoaded ? true : Boolean(ageGroupField);
  const isMaritalActive = !fieldsLoaded ? true : Boolean(maritalStatusField);

  const dynamicChoiceCategories =
    choiceCategoryField?.options && choiceCategoryField.options.length > 0
      ? choiceCategoryField.options
      : (fieldsLoaded ? [] : CHOICE_CATEGORIES);

  const dynamicAgeGroups =
    ageGroupField?.options && ageGroupField.options.length > 0
      ? ageGroupField.options
      : (fieldsLoaded ? [] : AGE_GROUPS);

  const dynamicMaritalStatuses =
    maritalStatusField?.options && maritalStatusField.options.length > 0
      ? maritalStatusField.options
      : (fieldsLoaded ? [] : MARITAL_STATUSES);

  const customFieldGroups = fieldGroups.filter(
    (f) =>
      !['choicecategory', 'agegroup', 'maritalstatus'].includes(f.key.toLowerCase()) &&
      f.showInEditor !== false
  );

  // Video Source & Poster
  const [videoSourceType, setVideoSourceType] = useState('upload'); // 'upload' | 'url' | 'media'
  const [externalUrlInput, setExternalUrlInput] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [videoFile, setVideoFile] = useState(null);
  const [posterUrl, setPosterUrl] = useState('');
  const [posterFile, setPosterFile] = useState(null);
  const [autoPosterDataUrl, setAutoPosterDataUrl] = useState('');
  const [displayContent, setDisplayContent] = useState(true);
  const [bannerUrl, setBannerUrl] = useState('');
  const [bannerType, setBannerType] = useState('image');
  const [bannerVideo, setBannerVideo] = useState('');
  const [bannerPosition, setBannerPosition] = useState('center');
  const [bannerHeight, setBannerHeight] = useState('60vh');
  const [overlayStrength, setOverlayStrength] = useState(0);
  const [alignment, setAlignment] = useState('left');
  const [verticalPosition, setVerticalPosition] = useState('center');
  const [layout, setLayout] = useState('with_sidebar');
  const [showSidebar, setShowSidebar] = useState(true);
  const [bannerMediaId, setBannerMediaId] = useState('');
  const [featuredOnHomeBanner, setFeaturedOnHomeBanner] = useState(false);

  // Uploading / Playback states
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [uploadingPoster, setUploadingPoster] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [videoPlaybackError, setVideoPlaybackError] = useState(false);

  // Modals
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);
  const [pickerTarget, setPickerTarget] = useState('video'); // 'video' | 'poster'

  // Statuses
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Hidden video element for client-side automatic frame extraction
  const hiddenVideoRef = useRef(null);
  const hiddenCanvasRef = useRef(null);

  useEffect(() => {
    if (isEditing) {
      loadVideo();
    }
  }, [id]);

  useEffect(() => {
    setVideoPlaybackError(false);
  }, [videoUrl]);

  const loadVideo = async () => {
    setLoading(true);
    try {
      const res = await videoAPI.getBySlug(id);
      if (res.video) {
        const v = res.video;
        setTitle(v.title || '');
        setSlug(v.slug || '');
        setIsSlugManuallyEdited(true);
        setDescription(v.description || '');
        setShortDescription(v.shortDescription || '');
        setDescriptionPosition(v.descriptionPosition || 'after');
        if (v.author) {
          setAuthor(v.author?._id || v.author);
        }
        setCategory(v.category?._id || v.category || '');
        setSubCategory(v.subCategory?._id || v.subCategory || '');
        setChildCategory(v.childCategory?._id || v.childCategory || '');
        const explicitCats = (Array.isArray(v.categories) ? v.categories : []).map((c) => (c?._id ? c._id : c));
        const slotCats = [v.category?._id || v.category, v.subCategory?._id || v.subCategory, v.childCategory?._id || v.childCategory].filter(Boolean);
        const loadedCats = Array.from(new Set([...explicitCats, ...slotCats])).map(String);
        setCategories(loadedCats);
        setStatus(v.status || 'published');
        setTags(Array.isArray(v.tags) ? v.tags.join(', ') : v.tags || '');
        setChoiceCategory(Array.isArray(v.choiceCategory) ? v.choiceCategory : (v.choiceCategory ? [v.choiceCategory] : []));
        setAgeGroup(v.ageGroup || '');
        setMaritalStatus(v.maritalStatus || '');
        setCustomFields(v.customFields || {});
        const loadedUrl = v.videoUrl || (v.videoFile ? `/uploads/videos/${v.videoFile}` : '');
        setVideoUrl(loadedUrl);
        setExternalUrlInput(loadedUrl);
        if (v.videoType === 'youtube' || v.videoType === 'vimeo' || (loadedUrl && loadedUrl.startsWith('http') && !loadedUrl.includes('localhost:5001'))) {
          setVideoSourceType('url');
        }
        setDisplayContent(v.displayContent !== false);
        setBannerUrl(v.banner || '');
        setBannerType(v.bannerType || 'image');
        setBannerVideo(v.bannerVideo || '');
        setBannerPosition(v.bannerPosition || 'center');
        setBannerHeight(v.bannerHeight || '60vh');
        setOverlayStrength(v.overlayStrength !== undefined ? Number(v.overlayStrength) : 0);
        setAlignment(v.alignment || 'left');
        setVerticalPosition(v.verticalPosition || 'center');
        setLayout(v.layout || 'with_sidebar');
        setShowSidebar(v.showSidebar !== false && v.layout !== 'without_sidebar');
        setBannerMediaId(v.bannerMedia?._id || v.bannerMedia || '');
        setPosterUrl(v.poster || '');
        setFeaturedOnHomeBanner(v.featuredOnHomeBanner === true);
        if (v.screenOptions && typeof v.screenOptions === 'object') {
          setScreenOptions((prev) => ({ ...prev, ...v.screenOptions }));
        }
      }
    } catch (err) {
      setMessage({
        type: 'error',
        text: err.response?.data?.message || err.message || 'Error loading video'
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

  // Automatic Frame Extraction from Video URL or File
  const captureVideoPoster = (videoSrc) => {
    if (!videoSrc) return;
    const videoEl = hiddenVideoRef.current;
    if (!videoEl) return;

    videoEl.crossOrigin = 'anonymous';
    videoEl.src = videoSrc;
    videoEl.currentTime = 1.5; // capture at 1.5s
    videoEl.onseeked = () => {
      try {
        const canvas = hiddenCanvasRef.current;
        if (!canvas) return;
        canvas.width = videoEl.videoWidth || 640;
        canvas.height = videoEl.videoHeight || 360;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        setAutoPosterDataUrl(dataUrl);
        setPosterUrl(dataUrl);
        setBannerUrl((prev) => {
          if (!prev || prev.startsWith('data:image/')) {
            return dataUrl;
          }
          return prev;
        });
      } catch (err) {
        console.warn('Could not auto-extract canvas frame (CORS or codec):', err.message);
      }
    };
  };

  const handleMediaSelect = (mediaItem) => {
    if (pickerTarget === 'video') {
      setVideoUrl(mediaItem.url);
      setExternalUrlInput(mediaItem.url);
      setVideoFile(null);
      setVideoPlaybackError(false);
      // Always re-capture poster from the newly selected video
      captureVideoPoster(mediaItem.url);
    } else if (pickerTarget === 'poster') {
      setPosterUrl(mediaItem.url);
      setPosterFile(null);
    } else if (pickerTarget === 'banner') {
      setBannerUrl(mediaItem.url);
      if (mediaItem._id) setBannerMediaId(mediaItem._id);
    }
  };

  // Unified Local Upload Pipeline -> saves to server & Media Library immediately!
  const handleLocalVideoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingVideo(true);
    setUploadProgress(0);
    setMessage({ type: '', text: '' });

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await mediaAPI.upload(formData, (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        setUploadProgress(percentCompleted);
      });
      if (res.media) {
        setVideoUrl(res.media.url);
        setExternalUrlInput(res.media.url);
        setVideoFile(null);
        setVideoPlaybackError(false);
        // Always re-capture poster from the newly uploaded video
        captureVideoPoster(res.media.url);
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

  const handleLocalPosterUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingPoster(true);
    setMessage({ type: '', text: '' });

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await mediaAPI.upload(formData);
      if (res.media) {
        setPosterUrl(res.media.url);
        setPosterFile(null);
        setMessage({
          type: 'success',
          text: `Poster "${file.name}" uploaded and saved to Media Library!`
        });
      }
    } catch (err) {
      setMessage({
        type: 'error',
        text: err.response?.data?.message || err.message || 'Error uploading poster'
      });
    } finally {
      setUploadingPoster(false);
    }
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
    if (e && e.preventDefault) e.preventDefault();

    if (uploadingVideo) {
      setMessage({ type: 'error', text: 'Video is still uploading. Please wait for upload to complete.' });
      return;
    }

    const effectiveTitle = title.trim() || 'Untitled Video';
    const effectiveVideoUrl = (videoUrl || externalUrlInput).trim();
    const hasContent = Boolean(effectiveVideoUrl || videoFile || description.trim() || shortDescription.trim() || posterUrl || bannerUrl);
    const effectiveStatus = hasContent ? status : 'draft';

    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      const formData = new FormData();
      formData.append('title', effectiveTitle);
      formData.append('slug', slug.trim());
      formData.append('description', description);
      formData.append('shortDescription', shortDescription);
      formData.append('descriptionPosition', descriptionPosition);
      if (author) formData.append('author', author);
      formData.append('category', category || '');
      formData.append('subCategory', subCategory || '');
      formData.append('childCategory', childCategory || '');
      formData.append('categories', JSON.stringify(categories || []));
      formData.append('status', effectiveStatus);
      formData.append('tags', tags);
      formData.append('choiceCategory', JSON.stringify(choiceCategory));
      formData.append('ageGroup', ageGroup || '');
      formData.append('maritalStatus', maritalStatus || '');
      formData.append('customFields', JSON.stringify(customFields));

      // Determine videoType
      let determinedType = 'upload';
      if (effectiveVideoUrl) {
        if (getYouTubeEmbedUrl(effectiveVideoUrl)) {
          determinedType = 'youtube';
        } else if (getVimeoEmbedUrl(effectiveVideoUrl)) {
          determinedType = 'vimeo';
        } else if (effectiveVideoUrl.startsWith('/uploads/')) {
          determinedType = 'upload';
        } else {
          determinedType = 'external';
        }
      }
      formData.append('videoType', determinedType);

      // Video file or canonical URL
      if (videoFile) {
        formData.append('video', videoFile);
      } else if (effectiveVideoUrl && !effectiveVideoUrl.startsWith('blob:')) {
        formData.append('videoUrl', effectiveVideoUrl);
      }

      formData.append('displayContent', displayContent);
      formData.append('banner', bannerUrl || '');
      formData.append('bannerType', bannerType || 'image');
      formData.append('bannerVideo', bannerVideo || '');
      formData.append('bannerPosition', bannerPosition || 'center');
      formData.append('bannerHeight', bannerHeight || '60vh');
      formData.append('overlayStrength', overlayStrength !== undefined ? overlayStrength : 0);
      formData.append('alignment', alignment || 'left');
      formData.append('verticalPosition', verticalPosition || 'center');
      formData.append('layout', showSidebar ? 'with_sidebar' : 'without_sidebar');
      formData.append('showSidebar', showSidebar);
      formData.append('featuredOnHomeBanner', featuredOnHomeBanner);
      if (bannerMediaId) formData.append('bannerMedia', bannerMediaId);
      formData.append('screenOptions', JSON.stringify(screenOptions));

      // Poster file, auto-generated poster, or URL
      if (posterFile) {
        formData.append('poster', posterFile);
      } else if (posterUrl && !posterUrl.startsWith('blob:') && !posterUrl.startsWith('data:')) {
        formData.append('poster', posterUrl);
        formData.append('thumbnail', posterUrl);
      } else if (autoPosterDataUrl && (!posterUrl || posterUrl.startsWith('data:'))) {
        formData.append('autoPoster', autoPosterDataUrl);
        // Signal backend to replace old poster with auto-generated one
        formData.append('_replaceWithAutoPoster', 'true');
      } else {
        // User explicitly cleared poster
        formData.append('poster', '');
        formData.append('thumbnail', '');
      }

      let res;
      if (isEditing) {
        res = await videoAPI.update(id, formData);
        setMessage({ type: 'success', text: 'Video updated successfully!' });
      } else {
        res = await videoAPI.create(formData);
        setMessage({ type: 'success', text: 'Video published successfully!' });
        if (res.video?._id) {
          navigate(`/admin/videos/edit/${res.video._id}`, { replace: true });
        }
      }

      // Sync poster/thumbnail from backend response so frontend reflects any
      // backend-generated thumbnails (e.g. auto-extracted from video frame)
      if (res?.video) {
        const v = res.video;
        if (v.poster && v.poster !== posterUrl) {
          setPosterUrl(v.poster);
        }
        if (v.videoUrl && v.videoUrl !== videoUrl) {
          setVideoUrl(v.videoUrl);
          setExternalUrlInput(v.videoUrl);
        }
      }
    } catch (err) {
      setMessage({
        type: 'error',
        text: err.response?.data?.message || err.message || 'Error saving video'
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px', gap: '10px', color: 'var(--text-secondary)' }}>
      <ConfirmDialog />
        <Loader2 size={28} className="spin" /> Loading video editor...
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1360px', margin: '0 auto', position: 'relative' }}>
      <ScreenOptionsDrawer
        moduleTitle="Video Screen Options"
        options={VIDEO_SCREEN_OPTIONS}
        screenOptions={screenOptions}
        onToggleOption={handleScreenOptionToggle}
        onChange={handleScreenOptionToggle}
      />
      {/* Hidden elements for auto-poster capture */}
      <video ref={hiddenVideoRef} style={{ display: 'none' }} muted playsInline />
      <canvas ref={hiddenCanvasRef} style={{ display: 'none' }} />

      {/* Top Bar with Back Link and Actions */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <Link to="/admin/videos" className="button button-neutral" style={{ height: '40px', padding: '0 16px', display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '13.5px' }}>
            <ArrowLeft size={15} /> Back to Videos
          </Link>
          <h1 style={{ fontSize: '20px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
            {isEditing ? 'Edit Video' : 'Add New Video'}
          </h1>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {isEditing && (
            <a
              href={`/video/${slug || id}`}
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
              <ExternalLink size={15} /> View Live Video
            </a>
          )}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving || uploadingVideo}
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
            ) : uploadingVideo ? (
              <>
                <Loader2 size={15} className="spin" /> Uploading ({uploadProgress}%)...
              </>
            ) : (
              <>
                <Save size={15} /> {isEditing ? 'Update Video' : 'Publish Video'}
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
          layoutKey="video-editor-layout"
          defaultLayout={{
            main: ['video-source', 'description', 'short-description', 'live-preview'],
            sidebar: ['publish', 'categories', 'banner', 'poster', 'video_details', 'tags']
          }}
          mainTopContent={
            <>
          <input
            type="text"
            placeholder="Add Video Title"
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
                  href={`/video/${slug || 'your-video'}`}
                  target="_blank"
                  rel="noreferrer"
                  className="permalink-url"
                >
                  {window.location.origin}/video/{slug || 'untitled-video'}
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
          {/* Video Player & Upload Metabox */}
          <MetaBox
            id="video-source"
            title="Video File / Source"
            icon={<Film size={17} color="var(--primary-color)" />}
            actions={
              <div style={{ display: 'flex', background: 'var(--bg-secondary, rgba(255,255,255,0.06))', padding: '3px', borderRadius: '8px', gap: '4px' }}>
                <button
                  type="button"
                  onClick={() => setVideoSourceType('upload')}
                  className={`button button-small ${videoSourceType === 'upload' ? 'button-primary' : 'button-neutral'}`}
                  style={{ padding: '3px 8px', fontSize: '11px', border: 'none' }}
                >
                  <Upload size={12} /> Upload
                </button>
                <button
                  type="button"
                  onClick={() => setVideoSourceType('url')}
                  className={`button button-small ${videoSourceType === 'url' ? 'button-primary' : 'button-neutral'}`}
                  style={{ padding: '3px 8px', fontSize: '11px', border: 'none' }}
                >
                  <Globe size={12} /> URL
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setVideoSourceType('media');
                    setPickerTarget('video');
                    setMediaPickerOpen(true);
                  }}
                  className={`button button-small ${videoSourceType === 'media' ? 'button-primary' : 'button-neutral'}`}
                  style={{ padding: '3px 8px', fontSize: '11px', border: 'none' }}
                >
                  <Film size={12} /> Library
                </button>
              </div>
            }
          >
            <div>
              {videoSourceType === 'url' && (
                <div style={{ marginBottom: '18px', background: 'var(--bg-secondary, rgba(255,255,255,0.03))', padding: '16px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', fontWeight: 600 }}>
                    <LinkIcon size={14} color="var(--primary-color)" /> Video Stream / Embed URL (YouTube, Vimeo, MP4 direct link)
                  </label>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <input
                      type="url"
                      placeholder="e.g. https://www.youtube.com/watch?v=... or https://vimeo.com/... or https://domain.com/video.mp4"
                      value={externalUrlInput}
                      onChange={(e) => {
                        setExternalUrlInput(e.target.value);
                        setVideoUrl(e.target.value.trim());
                      }}
                      className="form-input"
                      style={{ flex: 1, fontSize: '13px' }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const trimmed = externalUrlInput.trim();
                        if (!trimmed) {
                          setMessage({ type: 'error', text: 'Please enter a valid video URL.' });
                          return;
                        }
                        setVideoUrl(trimmed);
                        setMessage({ type: 'success', text: 'Video URL applied!' });
                      }}
                      className="button button-primary button-small"
                      style={{ whiteSpace: 'nowrap' }}
                    >
                      <Check size={13} /> Apply
                    </button>
                  </div>
                  <div className="form-description" style={{ marginTop: '6px', fontSize: '12px', color: 'var(--text-muted)' }}>
                    Paste a link from YouTube, Vimeo, cloud CDN, or raw .mp4/.webm file. Live preview will automatically load below.
                  </div>
                </div>
              )}

              {(videoUrl || externalUrlInput) ? (
                <div>
                  <div
                    style={{
                      borderRadius: '8px',
                      overflow: 'hidden',
                      background: '#090e18',
                      marginBottom: '16px',
                      maxHeight: '380px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'relative'
                    }}
                  >
                    <video
                        key={`${videoUrl}-${posterUrl}`}
                        src={videoUrl?.startsWith('/uploads/') ? `http://localhost:5001${videoUrl}` : videoUrl}
                        controls
                        poster={posterUrl?.startsWith('/uploads/') ? `http://localhost:5001${posterUrl}` : posterUrl}
                        style={{ width: '100%', maxHeight: '380px', display: 'block' }}
                      >
                        Your browser does not support HTML5 video playback.
                      </video>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
                    <button
                      type="button"
                      onClick={() => {
                        setPickerTarget('video');
                        setMediaPickerOpen(true);
                      }}
                      className="button button-secondary button-small"
                    >
                      <Film size={14} /> Choose from Media Library
                    </button>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
<label className="button button-neutral button-small" style={{ cursor: uploadingVideo ? 'not-allowed' : 'pointer' }}>
                      {uploadingVideo ? (
                        <>
                          <Loader2 size={14} className="spin" /> Uploading... {uploadProgress}%
                        </>
                      ) : (
                        <>
                          <Upload size={14} /> Upload New Video
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
                    {uploadingVideo && (
                      <div style={{ height: '4px', background: 'var(--border-color)', borderRadius: '2px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${uploadProgress}%`, background: 'var(--primary-color)', transition: 'width 0.2s' }} />
                      </div>
                    )}
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setVideoUrl('');
                        setExternalUrlInput('');
                        setVideoFile(null);
                        setVideoPlaybackError(false);
                      }}
                      className="button button-danger-outline button-small"
                    >
                      <Trash2 size={14} /> Remove
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '40px 16px', border: '2px dashed var(--border-color)', borderRadius: '12px' }}>
                  <Film size={44} color="var(--primary-color)" style={{ marginBottom: '12px' }} />
                  <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '6px' }}>
                    Select or Upload Video
                  </h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '8px' }}>
                    Support for MP4, WebM, MOV, M4V, AVI, MKV, MPEG videos.
                  </p>
                  <p style={{ color: 'var(--text-muted)', fontSize: '12px', marginBottom: '20px' }}>
                    Files uploaded from here are saved to the server and automatically registered in your central Media Library.
                  </p>
                  <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <label className="button button-primary button-small" style={{ cursor: uploadingVideo ? 'not-allowed' : 'pointer' }}>
                      {uploadingVideo ? (
                        <>
                          <Loader2 size={14} className="spin" /> Uploading... {uploadProgress}%
                        </>
                      ) : (
                        <>
                          <Upload size={14} /> Upload from Computer
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
                      onClick={() => {
                        setPickerTarget('video');
                        setMediaPickerOpen(true);
                      }}
                      className="button button-secondary button-small"
                    >
                      <Film size={14} /> Choose from Media Library
                    </button>
                    <button
                      type="button"
                      onClick={() => setVideoSourceType('url')}
                      className="button button-neutral button-small"
                    >
                      <Globe size={14} /> Paste Video URL
                    </button>


                  </div>
                </div>
              )}
            </div>
          </MetaBox>

          {/* Video Description Metabox */}
          <MetaBox id="description" title="Video Description">
            <RichEditor
              value={description}
              onChange={setDescription}
              placeholder="Write a description of this video for viewers and SEO..."
            />
          </MetaBox>

          {/* Short Description Metabox */}
          {screenOptions['short-description'] !== false && (
          <MetaBox id="short-description" title="Short Description (Banner Subtitle / Excerpt)">
            <textarea
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
              placeholder="Enter short description to display on hero banner and cards (e.g. Watch cinematic journeys, folklore tales, and exclusive documentary films)..."
              rows={3}
              className="form-control"
              style={{ width: '100%', resize: 'vertical', background: 'var(--bg-card, #0f172a)', color: 'var(--text-primary, #f8fafc)', border: '1px solid var(--border-color, #334155)', borderRadius: '6px', padding: '12px' }}
            />
            <div style={{ marginTop: '12px' }}>
              <label className="form-label" style={{ fontSize: '12px', marginBottom: '4px', display: 'block' }}>
                Description Position on Video Page:
              </label>
              <select
                value={descriptionPosition}
                onChange={(e) => setDescriptionPosition(e.target.value)}
                className="form-select"
                style={{ fontSize: '12.5px', maxWidth: '320px' }}
              >
                <option value="after">Display After Video Player (Default)</option>
                <option value="before">Display Before Video Player</option>
                <option value="no">Do Not Display Description</option>
              </select>
            </div>
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
              badge="VIDEO"
              title={title || 'Video Title'}
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
                  Assign author credited on this video.
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
                      name="videoDisplayContent"
                      checked={displayContent === true}
                      onChange={() => setDisplayContent(true)}
                    />
                    <span>Yes</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13px', color: 'var(--text-main)' }}>
                    <input
                      type="radio"
                      name="videoDisplayContent"
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
                    style={{ marginTop: '3px', width: '16px', height: '16px', accentColor: '#6366f1', cursor: 'pointer' }}
                  />
                  <div>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      Feature on Homepage Banner
                    </span>
                    <p style={{ fontSize: '11.5px', color: 'var(--text-muted)', margin: '2px 0 0', lineHeight: 1.4 }}>
                      Display this video on the main Homepage Hero Banner (replaces the video slide). Only one video can be featured at a time.
                    </p>
                  </div>
                </label>
              </div>

              {/* Single Video Page Sidebar Option */}
              <div style={{ marginBottom: '16px', paddingTop: '14px', borderTop: '1px solid var(--border-color)' }}>
                <label className="form-label" style={{ marginBottom: '8px', display: 'block', fontWeight: 600 }}>
                  Single Video Sidebar
                </label>
                <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13px', color: 'var(--text-main)' }}>
                    <input
                      type="radio"
                      name="videoShowSidebar"
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
                      name="videoShowSidebar"
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
                    ? 'Sidebar enabled: compact sidebar with related videos and navigation.'
                    : 'Sidebar disabled: full-width video layout.'}
                </p>
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
                      const isConfirmed = await confirm({ title: 'Move to Trash', message: 'Move this video to trash?', confirmText: 'Move to Trash' });
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
          <MetaBox id="categories" title="Video">
            <InlineCategoryCreator
              taxonomyType="video"
              taxonomyLabel="Video"
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
          <MetaBox id="banner" title="Hero Banner Media" icon={<Film size={16} />}>
            <div>
              <p style={{ color: 'var(--text-secondary, #94a3b8)', fontSize: '13px', margin: '0 0 14px 0' }}>
                Set the hero banner image for this video.
              </p>

              {/* Media Selection Bar (matches user screenshot) */}
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ flex: '1 1 260px', position: 'relative' }}>
                  <input
                    type="text"
                    value={bannerUrl || ''}
                    onChange={(e) => {
                      setBannerUrl(e.target.value);
                      if (!e.target.value) setBannerMediaId('');
                    }}
                    placeholder="/uploads/thumbnails/... or image URL"
                    style={{
                      width: '100%',
                      height: '40px',
                      padding: '0 14px',
                      background: 'rgba(15, 23, 42, 0.7)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: '8px',
                      color: '#f8fafc',
                      fontSize: '13px',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setPickerTarget('banner');
                    setMediaPickerOpen(true);
                  }}
                  style={{
                    height: '40px',
                    padding: '0 16px',
                    borderRadius: '8px',
                    background: 'rgba(59, 130, 246, 0.14)',
                    border: '1px solid rgba(59, 130, 246, 0.35)',
                    color: '#93c5fd',
                    fontWeight: 600,
                    fontSize: '13px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    whiteSpace: 'nowrap'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(59, 130, 246, 0.24)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(59, 130, 246, 0.14)')}
                >
                  <ImageIcon size={15} /> Media Library
                </button>

                <label
                  style={{
                    height: '40px',
                    padding: '0 16px',
                    borderRadius: '8px',
                    background: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid rgba(255, 255, 255, 0.14)',
                    color: '#ffffff',
                    fontWeight: 600,
                    fontSize: '13px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: uploadingBanner ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s',
                    whiteSpace: 'nowrap',
                    margin: 0
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)')}
                >
                  {uploadingBanner ? (
                    <>
                      <Loader2 size={15} className="spin" /> Uploading...
                    </>
                  ) : (
                    <>
                      <Upload size={15} /> Upload Image
                    </>
                  )}
                  <input
                    type="file"
                    accept={ACCEPT_IMAGES}
                    style={{ display: 'none' }}
                    onChange={handleLocalBannerUpload}
                    disabled={uploadingBanner}
                  />
                </label>
              </div>

              {/* Selected Banner Preview Strip (matches user screenshot) */}
              {bannerUrl && (
                <div
                  style={{
                    marginTop: '10px',
                    padding: '8px 14px',
                    borderRadius: '8px',
                    background: 'rgba(15, 23, 42, 0.75)',
                    border: '1px solid rgba(255, 255, 255, 0.09)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, overflow: 'hidden' }}>
                    <ImageIcon size={15} color="var(--primary-color, #6366f1)" style={{ flexShrink: 0 }} />
                    <span
                      title={bannerUrl}
                      style={{
                        fontSize: '12.5px',
                        color: '#cbd5e1',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {bannerUrl}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setBannerUrl('');
                      setBannerMediaId('');
                    }}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#f87171',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      padding: '3px 8px',
                      borderRadius: '4px',
                      flexShrink: 0
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <X size={13} /> Remove
                  </button>
                </div>
              )}

              {/* 1 Row and 3 Boxes Settings Grid */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                  gap: '14px',
                  marginTop: '16px'
                }}
              >
                {/* Box 1: Overlay Darkness & Banner Height */}
                <div
                  style={{
                    background: 'rgba(15, 23, 42, 0.55)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '10px',
                    padding: '14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                  }}
                >
                  {/* Overlay Darkness */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary, #94a3b8)' }}>
                        Overlay Darkness
                      </span>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          padding: '1px 6px',
                          borderRadius: '4px',
                          background: 'rgba(99, 102, 241, 0.15)',
                          color: '#818cf8'
                        }}
                      >
                        {Math.round((parseFloat(overlayStrength) || 0) * 100)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="0.9"
                      step="0.05"
                      value={overlayStrength || 0}
                      onChange={(e) => setOverlayStrength(parseFloat(e.target.value))}
                      style={{ width: '100%', accentColor: 'var(--primary-color, #6366f1)', cursor: 'pointer' }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-dim, #64748b)', marginTop: '2px' }}>
                      <span>0%</span>
                      <span>30%</span>
                      <span>60%</span>
                      <span>90%</span>
                    </div>
                  </div>

                  {/* Banner Height */}
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary, #94a3b8)', marginBottom: '6px' }}>
                      Banner Height
                    </label>
                    <select
                      value={bannerHeight || '60vh'}
                      onChange={(e) => setBannerHeight(e.target.value)}
                      style={{
                        width: '100%',
                        height: '36px',
                        padding: '0 10px',
                        background: '#090e18',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        borderRadius: '6px',
                        color: '#ffffff',
                        fontSize: '12.5px',
                        cursor: 'pointer',
                        outline: 'none'
                      }}
                    >
                      <option value="40vh">40vh (Compact)</option>
                      <option value="50vh">50vh (Standard)</option>
                      <option value="60vh">60vh (Default)</option>
                      <option value="70vh">70vh (Tall)</option>
                      <option value="80vh">80vh (Cinematic)</option>
                      <option value="100vh">100vh (Full Viewport)</option>
                    </select>
                  </div>
                </div>

                {/* Box 2: Content Alignment & Vertical Placement */}
                <div
                  style={{
                    background: 'rgba(15, 23, 42, 0.55)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '10px',
                    padding: '14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                  }}
                >
                  {/* Content Alignment */}
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary, #94a3b8)', marginBottom: '6px' }}>
                      Content Alignment
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                      {[
                        { id: 'left', label: 'Left', icon: <AlignLeft size={13} /> },
                        { id: 'center', label: 'Center', icon: <AlignCenter size={13} /> },
                        { id: 'right', label: 'Right', icon: <AlignRight size={13} /> }
                      ].map((item) => {
                        const isSelected = (alignment || 'left') === item.id;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => setAlignment(item.id)}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '4px',
                              padding: '6px 4px',
                              fontSize: '11.5px',
                              fontWeight: isSelected ? 700 : 500,
                              borderRadius: '6px',
                              border: isSelected ? '1px solid var(--primary-color, #6366f1)' : '1px solid rgba(255, 255, 255, 0.1)',
                              background: isSelected ? 'rgba(99, 102, 241, 0.22)' : 'rgba(255, 255, 255, 0.04)',
                              color: isSelected ? '#ffffff' : 'var(--text-secondary, #94a3b8)',
                              cursor: 'pointer',
                              transition: 'all 0.15s'
                            }}
                          >
                            {item.icon}
                            <span>{item.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Vertical Placement */}
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary, #94a3b8)', marginBottom: '6px' }}>
                      Vertical Placement
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                      {[
                        { id: 'top', label: 'Top' },
                        { id: 'center', label: 'Center' },
                        { id: 'bottom', label: 'Bottom' }
                      ].map((item) => {
                        const isSelected = (verticalPosition || 'center') === item.id;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => setVerticalPosition(item.id)}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              padding: '6px 4px',
                              fontSize: '11.5px',
                              fontWeight: isSelected ? 700 : 500,
                              borderRadius: '6px',
                              border: isSelected ? '1px solid var(--primary-color, #6366f1)' : '1px solid rgba(255, 255, 255, 0.1)',
                              background: isSelected ? 'rgba(99, 102, 241, 0.22)' : 'rgba(255, 255, 255, 0.04)',
                              color: isSelected ? '#ffffff' : 'var(--text-secondary, #94a3b8)',
                              cursor: 'pointer',
                              transition: 'all 0.15s'
                            }}
                          >
                            <span>{item.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Box 3: Banner Image Position (Focus) & Slider */}
                <div
                  style={{
                    background: 'rgba(15, 23, 42, 0.55)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '10px',
                    padding: '14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary, #94a3b8)' }}>
                        Image Position (Focus)
                      </span>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          padding: '1px 6px',
                          borderRadius: '4px',
                          background: 'rgba(99, 102, 241, 0.15)',
                          color: '#818cf8'
                        }}
                      >
                        {(() => {
                          const pos = bannerPosition || 'center';
                          if (pos === 'top') return 'Top (0%)';
                          if (pos === 'bottom') return 'Bottom (100%)';
                          if (pos === 'center') return 'Center (50%)';
                          return pos;
                        })()}
                      </span>
                    </div>

                    {/* Slider */}
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="1"
                      value={(() => {
                        const pos = bannerPosition || 'center';
                        if (pos === 'top') return 0;
                        if (pos === 'bottom') return 100;
                        if (pos === 'center') return 50;
                        const parsed = parseInt(pos, 10);
                        return isNaN(parsed) ? 50 : parsed;
                      })()}
                      onChange={(e) => setBannerPosition(`${e.target.value}%`)}
                      style={{ width: '100%', accentColor: 'var(--primary-color, #6366f1)', cursor: 'pointer' }}
                    />

                    {/* Presets */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', marginTop: '8px' }}>
                      {[
                        { label: 'Top', val: '0%' },
                        { label: 'Center', val: '50%' },
                        { label: 'Bottom', val: '100%' }
                      ].map((preset) => {
                        const currentVal = (() => {
                          const pos = bannerPosition || 'center';
                          if (pos === 'top') return '0%';
                          if (pos === 'bottom') return '100%';
                          if (pos === 'center') return '50%';
                          return pos;
                        })();
                        const isPresetActive = currentVal === preset.val;
                        return (
                          <button
                            key={preset.val}
                            type="button"
                            onClick={() => setBannerPosition(preset.val)}
                            style={{
                              padding: '4px 6px',
                              fontSize: '11px',
                              fontWeight: isPresetActive ? 700 : 500,
                              borderRadius: '5px',
                              border: isPresetActive ? '1px solid var(--primary-color, #6366f1)' : '1px solid rgba(255, 255, 255, 0.1)',
                              background: isPresetActive ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                              color: isPresetActive ? '#ffffff' : 'var(--text-secondary, #94a3b8)',
                              cursor: 'pointer'
                            }}
                          >
                            {preset.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </MetaBox>
          )}

          {/* Poster / Thumbnail Metabox */}
          <MetaBox id="poster" title="Poster / Thumbnail" icon={<ImageIcon size={16} />}>
            <div>
              {posterUrl ? (
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
                      src={posterUrl}
                      alt="Poster Preview"
                      style={{ width: '100%', height: '160px', objectFit: 'cover', display: 'block' }}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={() => {
                        setPickerTarget('poster');
                        setMediaPickerOpen(true);
                      }}
                      className="button button-secondary button-small"
                      style={{ flex: 1 }}
                    >
                      Change Poster
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPosterUrl('');
                        setPosterFile(null);
                        setAutoPosterDataUrl('');
                      }}
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
                    Auto-generated from video frame if left blank.
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={() => {
                        setPickerTarget('poster');
                        setMediaPickerOpen(true);
                      }}
                      className="button button-secondary button-small"
                    >
                      <ImageIcon size={14} /> Select from Media Library
                    </button>
                    <label className="button button-neutral button-small" style={{ cursor: uploadingPoster ? 'not-allowed' : 'pointer' }}>
                      {uploadingPoster ? (
                        <>
                          <Loader2 size={14} className="spin" /> Uploading...
                        </>
                      ) : (
                        <>
                          <Upload size={14} /> Upload Poster Image
                        </>
                      )}
                      <input
                        type="file"
                        accept={ACCEPT_IMAGES}
                        onChange={handleLocalPosterUpload}
                        disabled={uploadingPoster}
                        style={{ display: 'none' }}
                      />
                    </label>
                  </div>
                </div>
              )}
            </div>
          </MetaBox>

          {/* Video Details: Dynamic Choice Category, Age Group, Marital Status & Custom Fields */}
          {screenOptions.video_details !== false && (
          <MetaBox id="video_details" title="Video Details">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              
              {/* Choice Category */}
              {isChoiceActive && dynamicChoiceCategories.length > 0 && (
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8', marginBottom: '8px' }}>
                    Choice Category
                  </label>
                  {choiceCategory.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
                      {choiceCategory.map((cat) => (
                        <span
                          key={cat}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '3px 8px',
                            fontSize: '11px',
                            fontWeight: 600,
                            borderRadius: '12px',
                            background: 'rgba(236, 72, 153, 0.15)',
                            color: '#f472b6',
                            border: '1px solid rgba(236, 72, 153, 0.3)'
                          }}
                        >
                          {cat}
                          <button
                            type="button"
                            onClick={() => setChoiceCategory(choiceCategory.filter(c => c !== cat))}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: 'inherit',
                              cursor: 'pointer',
                              padding: 0,
                              display: 'flex',
                              alignItems: 'center'
                            }}
                          >
                            <X size={12} />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(105px, 1fr))', gap: '6px' }}>
                    {dynamicChoiceCategories.map((cat) => {
                      const isSelected = choiceCategory.includes(cat);
                      return (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => {
                            if (isSelected) {
                              setChoiceCategory(choiceCategory.filter(c => c !== cat));
                            } else {
                              setChoiceCategory([...choiceCategory, cat]);
                            }
                          }}
                          style={{
                            padding: '6px 10px',
                            fontSize: '12px',
                            fontWeight: 500,
                            borderRadius: '6px',
                            cursor: 'pointer',
                            textAlign: 'center',
                            transition: 'all 0.15s ease',
                            background: isSelected ? '#ec4899' : 'rgba(255, 255, 255, 0.04)',
                            color: isSelected ? '#fff' : '#cbd5e1',
                            border: isSelected ? '1px solid #db2777' : '1px solid rgba(255, 255, 255, 0.1)'
                          }}
                        >
                          {cat}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Age Group */}
              {isAgeActive && dynamicAgeGroups.length > 0 && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <label style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8' }}>
                      Age Group
                    </label>
                    {ageGroup && (
                      <button
                        type="button"
                        onClick={() => setAgeGroup('')}
                        style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '11px', cursor: 'pointer', textDecoration: 'underline' }}
                      >
                        Clear
                      </button>
                    )}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(70px, 1fr))', gap: '6px' }}>
                    {dynamicAgeGroups.map((ag) => {
                      const isSelected =
                        ageGroup === ag ||
                        (ageGroup &&
                          ag &&
                          ageGroup.replace(/\s*(yrs|yr|years)/gi, '').trim().toLowerCase() ===
                            ag.replace(/\s*(yrs|yr|years)/gi, '').trim().toLowerCase());
                      return (
                        <button
                          key={ag}
                          type="button"
                          onClick={() => setAgeGroup(isSelected ? '' : ag)}
                          style={{
                            padding: '6px 4px',
                            fontSize: '11px',
                            fontWeight: 600,
                            borderRadius: '6px',
                            cursor: 'pointer',
                            textAlign: 'center',
                            transition: 'all 0.15s ease',
                            background: isSelected ? '#3b82f6' : 'rgba(255, 255, 255, 0.04)',
                            color: isSelected ? '#fff' : '#cbd5e1',
                            border: isSelected ? '1px solid #2563eb' : '1px solid rgba(255, 255, 255, 0.1)'
                          }}
                        >
                          {ag}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Marital Status */}
              {isMaritalActive && dynamicMaritalStatuses.length > 0 && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <label style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8' }}>
                      Marital Status
                    </label>
                    {maritalStatus && (
                      <button
                        type="button"
                        onClick={() => setMaritalStatus('')}
                        style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '11px', cursor: 'pointer', textDecoration: 'underline' }}
                      >
                        Clear
                      </button>
                    )}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: '6px' }}>
                    {dynamicMaritalStatuses.map((statusOption) => {
                      const isSelected = maritalStatus.toLowerCase().replace('-', '') === statusOption.toLowerCase().replace('-', '');
                      return (
                        <button
                          key={statusOption}
                          type="button"
                          onClick={() => setMaritalStatus(isSelected ? '' : statusOption)}
                          style={{
                            padding: '8px 10px',
                            fontSize: '12px',
                            fontWeight: 500,
                            borderRadius: '6px',
                            cursor: 'pointer',
                            textAlign: 'center',
                            transition: 'all 0.15s ease',
                            background: isSelected ? '#10b981' : 'rgba(255, 255, 255, 0.04)',
                            color: isSelected ? '#fff' : '#cbd5e1',
                            border: isSelected ? '1px solid #059669' : '1px solid rgba(255, 255, 255, 0.1)'
                          }}
                        >
                          {statusOption}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Dynamic Custom Field Groups */}
              {customFieldGroups.map((group) => {
                const groupKey = group.key;
                const currentValue = customFields[groupKey];

                return (
                  <div key={group._id} style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <label style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8' }}>
                        {group.title}
                      </label>
                      {currentValue && group.type !== 'text' && (
                        <button
                          type="button"
                          onClick={() => {
                            setCustomFields(prev => {
                              const next = { ...prev };
                              delete next[groupKey];
                              return next;
                            });
                          }}
                          style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '11px', cursor: 'pointer', textDecoration: 'underline' }}
                        >
                          Clear
                        </button>
                      )}
                    </div>

                    {/* Text Input Type */}
                    {group.type === 'text' && (
                      <input
                        type="text"
                        placeholder={group.placeholder || `Enter ${group.title}...`}
                        value={currentValue || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setCustomFields(prev => ({ ...prev, [groupKey]: val }));
                        }}
                        style={{
                          width: '100%',
                          background: 'rgba(0, 0, 0, 0.25)',
                          border: '1px solid rgba(255, 255, 255, 0.12)',
                          borderRadius: '6px',
                          padding: '7px 12px',
                          color: '#fff',
                          fontSize: '12.5px',
                          boxSizing: 'border-box'
                        }}
                      />
                    )}

                    {/* Dropdown / Select Type */}
                    {group.type === 'select' && (
                      <select
                        value={currentValue || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setCustomFields(prev => ({ ...prev, [groupKey]: val }));
                        }}
                        style={{
                          width: '100%',
                          background: 'rgba(18, 24, 41, 0.9)',
                          border: '1px solid rgba(255, 255, 255, 0.15)',
                          borderRadius: '6px',
                          padding: '7px 10px',
                          color: '#fff',
                          fontSize: '12.5px',
                          outline: 'none'
                        }}
                      >
                        <option value="">-- Select {group.title} --</option>
                        {(group.options || []).map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    )}

                    {/* Radio Type (Single-select pills) */}
                    {group.type === 'radio' && (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '6px' }}>
                        {(group.options || []).map((opt) => {
                          const isSelected = currentValue === opt;
                          return (
                            <button
                              key={opt}
                              type="button"
                              onClick={() => {
                                setCustomFields(prev => ({
                                  ...prev,
                                  [groupKey]: isSelected ? '' : opt
                                }));
                              }}
                              style={{
                                padding: '6px 8px',
                                fontSize: '11.5px',
                                fontWeight: 500,
                                borderRadius: '6px',
                                cursor: 'pointer',
                                textAlign: 'center',
                                transition: 'all 0.15s ease',
                                background: isSelected ? '#8b5cf6' : 'rgba(255, 255, 255, 0.04)',
                                color: isSelected ? '#fff' : '#cbd5e1',
                                border: isSelected ? '1px solid #7c3aed' : '1px solid rgba(255, 255, 255, 0.1)'
                              }}
                            >
                              {opt}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* Checkbox Type (Multi-select pills) */}
                    {group.type === 'checkbox' && (
                      <div>
                        {Array.isArray(currentValue) && currentValue.length > 0 && (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginBottom: '8px' }}>
                            {currentValue.map((item) => (
                              <span
                                key={item}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  padding: '2px 8px',
                                  fontSize: '11px',
                                  fontWeight: 600,
                                  borderRadius: '12px',
                                  background: 'rgba(99, 102, 241, 0.15)',
                                  color: '#818cf8',
                                  border: '1px solid rgba(99, 102, 241, 0.3)'
                                }}
                              >
                                {item}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setCustomFields(prev => ({
                                      ...prev,
                                      [groupKey]: (prev[groupKey] || []).filter(i => i !== item)
                                    }));
                                  }}
                                  style={{
                                    background: 'none',
                                    border: 'none',
                                    color: 'inherit',
                                    cursor: 'pointer',
                                    padding: 0,
                                    display: 'flex',
                                    alignItems: 'center'
                                  }}
                                >
                                  <X size={11} />
                                </button>
                              </span>
                            ))}
                          </div>
                        )}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(105px, 1fr))', gap: '6px' }}>
                          {(group.options || []).map((opt) => {
                            const isChecked = Array.isArray(currentValue) && currentValue.includes(opt);
                            return (
                              <button
                                key={opt}
                                type="button"
                                onClick={() => {
                                  setCustomFields(prev => {
                                    const list = Array.isArray(prev[groupKey]) ? prev[groupKey] : [];
                                    const updated = isChecked ? list.filter(i => i !== opt) : [...list, opt];
                                    return { ...prev, [groupKey]: updated };
                                  });
                                }}
                                style={{
                                  padding: '6px 8px',
                                  fontSize: '11.5px',
                                  fontWeight: 500,
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                  textAlign: 'center',
                                  transition: 'all 0.15s ease',
                                  background: isChecked ? '#6366f1' : 'rgba(255, 255, 255, 0.04)',
                                  color: isChecked ? '#fff' : '#cbd5e1',
                                  border: isChecked ? '1px solid #4f46e5' : '1px solid rgba(255, 255, 255, 0.1)'
                                }}
                              >
                                {opt}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Link to Manage Fields */}
              <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '12px', display: 'flex', justifyContent: 'flex-end' }}>
                <Link
                  to="/admin/video-fields"
                  target="_blank"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    fontSize: '11.5px',
                    color: 'var(--text-muted, #94a3b8)',
                    textDecoration: 'none',
                    transition: 'color 0.15s ease'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#818cf8')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted, #94a3b8)')}
                >
                  <SlidersHorizontal size={12} />
                  <span>Configure Video Fields & Taxonomies</span>
                </Link>
              </div>

            </div>
          </MetaBox>
          )}

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
            <span className="form-description">e.g. Highlights, 4K, Podcast</span>
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
          title={pickerTarget === 'video' ? 'Select or Upload Video' : pickerTarget === 'banner' ? 'Select Banner Image' : 'Select or Upload Poster'}
          allowedType={pickerTarget === 'video' ? 'video' : 'image'}
        />
      )}
    </div>
  );
};

export default VideoEditor;

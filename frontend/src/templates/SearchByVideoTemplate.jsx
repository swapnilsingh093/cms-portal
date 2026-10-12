import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { videoAPI, videoFieldAPI } from '../services/api';
import { Play, Pause, RotateCcw, Search, X, Loader2, Film, Check, ExternalLink, GripVertical, SlidersHorizontal, Eye } from 'lucide-react';

const CHOICE_CATEGORIES = ['Young Girl', 'Wife', 'Uncle', 'Old Man', 'Sasur'];
const AGE_GROUPS = ['20-25', '25-30', '30-35', '35-40', '40-45', '45-50', '50-55', '55-60'];
const MARITAL_STATUSES = ['Married', 'Un-Married'];

const formatTime = (seconds) => {
  if (isNaN(seconds) || seconds === null || seconds === undefined) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

const SearchByVideoTemplate = ({ pageData }) => {
  const [searchParams] = useSearchParams();
  const config = pageData?.templateConfig || {};
  const bannerType = config.bannerType || 'video';
  const bannerUrl = config.bannerUrl || pageData?.banner || '/uploads/videos/16.mp4';
  const overlayStrength = config.overlayStrength !== undefined ? config.overlayStrength : 60;
  const accentColor = config.accentColor || '#f2545f';

  // Read initial filter values from URL query parameters if present
  const initialTag = searchParams.get('q') || searchParams.get('tag') || searchParams.get('search') || '';
  const initialAge = searchParams.get('age') || config.defaultAge || '';
  const initialMarital = searchParams.get('marital') || searchParams.get('maritalStatus') || config.defaultMarital || '';
  const initialChoices = searchParams.get('choice') || searchParams.get('category')
    ? [searchParams.get('choice') || searchParams.get('category')]
    : (config.defaultChoice || []);

  // Read initial custom field filter values from URL query parameters (cf_<key>)
  const initialCustom = {};
  searchParams.forEach((val, key) => {
    if (key.startsWith('cf_')) {
      const fieldKey = key.slice(3);
      if (val) initialCustom[fieldKey] = val;
    }
  });

  // Filters State
  const [selectedChoices, setSelectedChoices] = useState(initialChoices);
  const [selectedAge, setSelectedAge] = useState(initialAge);
  const [selectedMarital, setSelectedMarital] = useState(initialMarital);
  const [searchTag, setSearchTag] = useState(initialTag);
  const [customFilters, setCustomFilters] = useState(initialCustom);

  // Accordion open states (match WP screenshot: Tag is open, others closed by default unless filtered)
  const [openAccordions, setOpenAccordions] = useState(() => {
    const initialAcc = {
      tag: true,
      choice: Boolean(initialChoices.length > 0),
      age: Boolean(initialAge),
      marital: Boolean(initialMarital)
    };
    Object.keys(initialCustom).forEach((k) => {
      initialAcc[k] = true;
    });
    return initialAcc;
  });

  // Dynamic Video Field Groups & Custom Filters
  const [fieldGroups, setFieldGroups] = useState([]);
  const [fieldsLoaded, setFieldsLoaded] = useState(false);

  useEffect(() => {
    const fetchFields = async () => {
      try {
        const res = await videoFieldAPI.getAll({ activeOnly: true });
        if (res && res.data) {
          setFieldGroups(res.data);
        }
      } catch (e) {
        console.warn('Failed to load video fields, using fallback', e);
      } finally {
        setFieldsLoaded(true);
      }
    };
    fetchFields();
  }, []);

  const choiceCategoryField = fieldGroups.find(
    (f) => f.key.toLowerCase() === 'choicecategory' && f.isActive !== false
  );
  const ageGroupField = fieldGroups.find(
    (f) => f.key.toLowerCase() === 'agegroup' && f.isActive !== false
  );
  const maritalStatusField = fieldGroups.find(
    (f) => f.key.toLowerCase() === 'maritalstatus' && f.isActive !== false
  );

  // When fields are loaded, only show if returned by activeOnly API
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

  const searchCustomFields = fieldGroups.filter(
    (f) =>
      !['choicecategory', 'agegroup', 'maritalstatus'].includes(f.key.toLowerCase()) &&
      f.showInSearch !== false &&
      f.isActive !== false
  );

  // Clear selections if field was deactivated
  useEffect(() => {
    if (fieldsLoaded) {
      if (!isChoiceActive && selectedChoices.length > 0) setSelectedChoices([]);
      if (!isAgeActive && selectedAge) setSelectedAge('');
      if (!isMaritalActive && selectedMarital) setSelectedMarital('');

      // Also clean up any selections for custom fields that are no longer active
      const activeKeys = new Set(searchCustomFields.map((f) => f.key));
      setCustomFilters((prev) => {
        let changed = false;
        const next = { ...prev };
        Object.keys(next).forEach((k) => {
          if (!activeKeys.has(k)) {
            delete next[k];
            changed = true;
          }
        });
        return changed ? next : prev;
      });
    }
  }, [fieldsLoaded, isChoiceActive, isAgeActive, isMaritalActive, searchCustomFields]);

  // Videos & Pagination State
  // Initial state: hasSearched = false, videos = [] (matching WP screenshot!)
  const [videos, setVideos] = useState([]);
  const [totalVideos, setTotalVideos] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Active playing card tracking & video element refs
  const [playingVideoId, setPlayingVideoId] = useState(null);
  const [videoProgress, setVideoProgress] = useState({});
  const videoRefs = useRef({});

  // Video Preview Modal State (captured frame snapshot & details)
  const [modalData, setModalData] = useState(null);

  // Drag & Visibility State for Sidebar
  const [sidebarPos, setSidebarPos] = useState({ x: 0, y: 0 });
  const [isSidebarDragging, setIsSidebarDragging] = useState(false);
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const sidebarDragStartRef = useRef({ startX: 0, startY: 0, posX: 0, posY: 0 });

  // Drag & Visibility State for Glassmorphism Content Box
  const [boxPos, setBoxPos] = useState({ x: 0, y: 0 });
  const [isBoxDragging, setIsBoxDragging] = useState(false);
  const [isBoxVisible, setIsBoxVisible] = useState(true);
  const boxDragStartRef = useRef({ startX: 0, startY: 0, posX: 0, posY: 0 });

  // Drag State for Sidebar Toggle Pill (when hidden)
  const [sidebarTogglePos, setSidebarTogglePos] = useState({ x: 0, y: 0 });
  const [isSidebarToggleDragging, setIsSidebarToggleDragging] = useState(false);
  const sidebarToggleDragStartRef = useRef({ startX: 0, startY: 0, posX: 0, posY: 0, hasMoved: false });

  // Drag State for Box Toggle Pill (when hidden)
  const [boxTogglePos, setBoxTogglePos] = useState({ x: 0, y: 0 });
  const [isBoxToggleDragging, setIsBoxToggleDragging] = useState(false);
  const boxToggleDragStartRef = useRef({ startX: 0, startY: 0, posX: 0, posY: 0, hasMoved: false });

  const handleSidebarPointerDown = (e) => {
    if (e.button !== undefined && e.button !== 0) return;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    sidebarDragStartRef.current = {
      startX: clientX,
      startY: clientY,
      posX: sidebarPos.x,
      posY: sidebarPos.y
    };
    setIsSidebarDragging(true);
  };

  const handleBoxPointerDown = (e) => {
    if (e.button !== undefined && e.button !== 0) return;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    boxDragStartRef.current = {
      startX: clientX,
      startY: clientY,
      posX: boxPos.x,
      posY: boxPos.y
    };
    setIsBoxDragging(true);
  };

  const handleSidebarTogglePointerDown = (e) => {
    if (e.button !== undefined && e.button !== 0) return;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    sidebarToggleDragStartRef.current = {
      startX: clientX,
      startY: clientY,
      posX: sidebarTogglePos.x,
      posY: sidebarTogglePos.y,
      hasMoved: false
    };
    setIsSidebarToggleDragging(true);
  };

  const handleSidebarToggleClick = (e) => {
    if (sidebarToggleDragStartRef.current.hasMoved) return;
    setIsSidebarVisible(true);
  };

  const handleBoxTogglePointerDown = (e) => {
    if (e.button !== undefined && e.button !== 0) return;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    boxToggleDragStartRef.current = {
      startX: clientX,
      startY: clientY,
      posX: boxTogglePos.x,
      posY: boxTogglePos.y,
      hasMoved: false
    };
    setIsBoxToggleDragging(true);
  };

  const handleBoxToggleClick = (e) => {
    if (boxToggleDragStartRef.current.hasMoved) return;
    setIsBoxVisible(true);
  };

  // Window drag movement listener for Sidebar, Box, and both Toggle Pills
  useEffect(() => {
    if (!isSidebarDragging && !isBoxDragging && !isSidebarToggleDragging && !isBoxToggleDragging) return;

    const handlePointerMove = (e) => {
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;

      if (isSidebarDragging) {
        const deltaX = clientX - sidebarDragStartRef.current.startX;
        const deltaY = clientY - sidebarDragStartRef.current.startY;
        setSidebarPos({
          x: sidebarDragStartRef.current.posX + deltaX,
          y: sidebarDragStartRef.current.posY + deltaY
        });
      }

      if (isBoxDragging) {
        const deltaX = clientX - boxDragStartRef.current.startX;
        const deltaY = clientY - boxDragStartRef.current.startY;
        setBoxPos({
          x: boxDragStartRef.current.posX + deltaX,
          y: boxDragStartRef.current.posY + deltaY
        });
      }

      if (isSidebarToggleDragging) {
        const deltaX = clientX - sidebarToggleDragStartRef.current.startX;
        const deltaY = clientY - sidebarToggleDragStartRef.current.startY;
        if (Math.hypot(deltaX, deltaY) > 4) {
          sidebarToggleDragStartRef.current.hasMoved = true;
        }
        setSidebarTogglePos({
          x: sidebarToggleDragStartRef.current.posX + deltaX,
          y: sidebarToggleDragStartRef.current.posY + deltaY
        });
      }

      if (isBoxToggleDragging) {
        const deltaX = clientX - boxToggleDragStartRef.current.startX;
        const deltaY = clientY - boxToggleDragStartRef.current.startY;
        if (Math.hypot(deltaX, deltaY) > 4) {
          boxToggleDragStartRef.current.hasMoved = true;
        }
        setBoxTogglePos({
          x: boxToggleDragStartRef.current.posX + deltaX,
          y: boxToggleDragStartRef.current.posY + deltaY
        });
      }
    };

    const handlePointerEnd = () => {
      setIsSidebarDragging(false);
      setIsBoxDragging(false);
      setIsSidebarToggleDragging(false);
      setIsBoxToggleDragging(false);
    };

    window.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('mouseup', handlePointerEnd);
    window.addEventListener('touchmove', handlePointerMove, { passive: false });
    window.addEventListener('touchend', handlePointerEnd);

    return () => {
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('mouseup', handlePointerEnd);
      window.removeEventListener('touchmove', handlePointerMove);
      window.removeEventListener('touchend', handlePointerEnd);
    };
  }, [isSidebarDragging, isBoxDragging, isSidebarToggleDragging, isBoxToggleDragging]);

  const toggleAccordion = (key) => {
    setOpenAccordions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const fetchVideos = useCallback(async (page = 1, append = false, currentFilters = null) => {
    if (append) setLoadingMore(true);
    else setLoading(true);

    const choices = currentFilters?.choices ?? selectedChoices;
    const age = currentFilters?.age ?? selectedAge;
    const marital = currentFilters?.marital ?? selectedMarital;
    const tag = currentFilters?.tag ?? searchTag;

    try {
      const params = {
        page,
        limit: 12,
        status: 'published'
      };

      if (isChoiceActive && choices.length > 0) {
        params.choiceCategory = choices.join(',');
      }
      if (isAgeActive && age) {
        params.ageGroup = age;
      }
      if (isMaritalActive && marital) {
        params.maritalStatus = marital;
      }
      if (tag.trim()) {
        params.tag = tag.trim();
        params.search = tag.trim();
      }

      // Dynamic custom fields filtering (cf_<key>)
      const activeCustom = currentFilters?.customFilters ?? customFilters;
      Object.entries(activeCustom).forEach(([k, v]) => {
        if (v !== undefined && v !== '' && v !== null) {
          params[`cf_${k}`] = Array.isArray(v) ? v.join(',') : v;
        }
      });

      const res = await videoAPI.getAll(params);
      const fetchedVideos = res.videos || [];
      const total = res.pagination?.total ?? res.total ?? fetchedVideos.length;
      const pages = res.pagination?.pages ?? res.pages ?? 1;

      if (append) {
        setVideos((prev) => [...prev, ...fetchedVideos]);
      } else {
        setVideos(fetchedVideos);
      }
      setTotalVideos(total);
      setTotalPages(pages);
      setCurrentPage(page);
      setHasSearched(true);
      // Reset sidebar to original layout position when results arrive
      setSidebarPos({ x: 0, y: 0 });
    } catch (err) {
      console.error('Error fetching videos in search template:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [selectedChoices, selectedAge, selectedMarital, searchTag, customFilters]);

  // Handle Find Result click
  const handleApply = (e) => {
    if (e) e.preventDefault();
    setSidebarPos({ x: 0, y: 0 });
    fetchVideos(1, false);
  };

  // Reset all filters to default state (matches WP screenshot default view)
  const handleReset = (e) => {
    if (e) e.preventDefault();
    // Pause any playing video
    if (playingVideoId && videoRefs.current[playingVideoId]) {
      videoRefs.current[playingVideoId].pause();
    }
    setPlayingVideoId(null);
    setSelectedChoices([]);
    setSelectedAge('');
    setSelectedMarital('');
    setSearchTag('');
    setCustomFilters({});
    setVideos([]);
    setTotalVideos(0);
    setHasSearched(false);
    setModalData(null);
  };

  const isAnyFilterActiveWith = (
    choices = selectedChoices,
    age = selectedAge,
    marital = selectedMarital,
    tag = searchTag,
    custom = customFilters
  ) => {
    const hasChoices = isChoiceActive && Array.isArray(choices) && choices.length > 0;
    const hasAge = isAgeActive && Boolean(age);
    const hasMaritalStatus = isMaritalActive && Boolean(marital);
    const hasTag = Boolean(tag && String(tag).trim());
    const hasCustom = Object.values(custom || {}).some((v) => {
      if (Array.isArray(v)) return v.length > 0;
      return v !== undefined && v !== null && String(v).trim() !== '';
    });
    return hasChoices || hasAge || hasMaritalStatus || hasTag || hasCustom;
  };

  const toggleChoice = (cat) => {
    setSidebarPos({ x: 0, y: 0 });
    const updated = selectedChoices.includes(cat)
      ? selectedChoices.filter((c) => c !== cat)
      : [...selectedChoices, cat];
    setSelectedChoices(updated);

    if (!isAnyFilterActiveWith(updated, selectedAge, selectedMarital, searchTag, customFilters)) {
      setVideos([]);
      setTotalVideos(0);
      setHasSearched(false);
      if (playingVideoId && videoRefs.current[playingVideoId]) {
        videoRefs.current[playingVideoId].pause();
      }
      setPlayingVideoId(null);
    } else {
      fetchVideos(1, false, { choices: updated });
    }
  };

  const handleSelectAge = (ag) => {
    setSidebarPos({ x: 0, y: 0 });
    const updated = selectedAge === ag ? '' : ag;
    setSelectedAge(updated);

    if (!isAnyFilterActiveWith(selectedChoices, updated, selectedMarital, searchTag, customFilters)) {
      setVideos([]);
      setTotalVideos(0);
      setHasSearched(false);
      if (playingVideoId && videoRefs.current[playingVideoId]) {
        videoRefs.current[playingVideoId].pause();
      }
      setPlayingVideoId(null);
    } else {
      fetchVideos(1, false, { age: updated });
    }
  };

  const handleSelectMarital = (status) => {
    setSidebarPos({ x: 0, y: 0 });
    const updated = selectedMarital === status ? '' : status;
    setSelectedMarital(updated);

    if (!isAnyFilterActiveWith(selectedChoices, selectedAge, updated, searchTag, customFilters)) {
      setVideos([]);
      setTotalVideos(0);
      setHasSearched(false);
      if (playingVideoId && videoRefs.current[playingVideoId]) {
        videoRefs.current[playingVideoId].pause();
      }
      setPlayingVideoId(null);
    } else {
      fetchVideos(1, false, { marital: updated });
    }
  };

  const handleClearTag = () => {
    setSearchTag('');
    if (!isAnyFilterActiveWith(selectedChoices, selectedAge, selectedMarital, '', customFilters)) {
      setVideos([]);
      setTotalVideos(0);
      setHasSearched(false);
      if (playingVideoId && videoRefs.current[playingVideoId]) {
        videoRefs.current[playingVideoId].pause();
      }
      setPlayingVideoId(null);
    } else {
      fetchVideos(1, false, { tag: '' });
    }
  };

  const handleSelectCustomFilter = (fieldKey, value, fieldType) => {
    setSidebarPos({ x: 0, y: 0 });

    let updatedCustom = { ...customFilters };

    if (fieldType === 'checkbox') {
      const cur = Array.isArray(customFilters[fieldKey]) ? customFilters[fieldKey] : [];
      const isChecked = cur.includes(value);
      const updatedList = isChecked ? cur.filter((i) => i !== value) : [...cur, value];
      if (updatedList.length > 0) {
        updatedCustom[fieldKey] = updatedList;
      } else {
        delete updatedCustom[fieldKey];
      }
    } else if (fieldType === 'radio' || fieldType === 'select') {
      const isSelected = customFilters[fieldKey] === value;
      if (isSelected) {
        delete updatedCustom[fieldKey];
      } else {
        updatedCustom[fieldKey] = value;
      }
    } else {
      // Text or others
      if (value && String(value).trim()) {
        updatedCustom[fieldKey] = String(value).trim();
      } else {
        delete updatedCustom[fieldKey];
      }
    }

    setCustomFilters(updatedCustom);

    if (!isAnyFilterActiveWith(selectedChoices, selectedAge, selectedMarital, searchTag, updatedCustom)) {
      setVideos([]);
      setTotalVideos(0);
      setHasSearched(false);
      if (playingVideoId && videoRefs.current[playingVideoId]) {
        videoRefs.current[playingVideoId].pause();
      }
      setPlayingVideoId(null);
    } else {
      fetchVideos(1, false, { customFilters: updatedCustom });
    }
  };

  const handleClearCustomField = (fieldKey) => {
    setSidebarPos({ x: 0, y: 0 });
    const updatedCustom = { ...customFilters };
    delete updatedCustom[fieldKey];
    setCustomFilters(updatedCustom);

    if (!isAnyFilterActiveWith(selectedChoices, selectedAge, selectedMarital, searchTag, updatedCustom)) {
      setVideos([]);
      setTotalVideos(0);
      setHasSearched(false);
      if (playingVideoId && videoRefs.current[playingVideoId]) {
        videoRefs.current[playingVideoId].pause();
      }
      setPlayingVideoId(null);
    } else {
      fetchVideos(1, false, { customFilters: updatedCustom });
    }
  };

  // Initial search if query params or default filters are present
  useEffect(() => {
    const hasInitialCustom = Object.keys(initialCustom).length > 0;
    if (initialTag.trim() || initialAge || initialMarital || initialChoices.length > 0 || hasInitialCustom) {
      fetchVideos(1, false, {
        tag: initialTag.trim(),
        age: initialAge,
        marital: initialMarital,
        choices: initialChoices,
        customFilters: initialCustom
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounced auto-search when tag changes
  useEffect(() => {
    if (!searchTag.trim()) return;
    const timer = setTimeout(() => {
      fetchVideos(1, false, { tag: searchTag });
    }, 600);
    return () => clearTimeout(timer);
  }, [searchTag, fetchVideos]);

  // Video Card Inline Player Logic
  const handleTogglePlay = (vid) => {
    const video = videoRefs.current[vid._id];
    if (!video) return;

    if (playingVideoId === vid._id && !video.paused) {
      video.pause();
      setPlayingVideoId(null);
    } else {
      // Pause all other playing videos
      Object.keys(videoRefs.current).forEach((id) => {
        if (id !== vid._id && videoRefs.current[id]) {
          videoRefs.current[id].pause();
        }
      });
      video.play().then(() => {
        setPlayingVideoId(vid._id);
      }).catch((err) => {
        console.warn('Playback error:', err);
      });
    }
  };

  // Time update listener enforcing the preview limit & frame snapshot
  const handleTimeUpdate = (vid, e) => {
    const video = e.target;
    if (!video) return;

    const dur = video.duration || 0;
    const cur = video.currentTime || 0;

    // Update progress state
    setVideoProgress((prev) => ({
      ...prev,
      [vid._id]: {
        percent: dur > 0 ? (cur / dur) * 100 : 0,
        currentTime: formatTime(cur),
        duration: dur > 0 ? formatTime(dur) : (vid.duration || '00:00')
      }
    }));

    // Timing limit logic:
    // If video < 2 minutes (120s): preview limit is 20 seconds.
    // If video >= 2 minutes (120s): preview limit is 50 seconds.
    const previewLimit = dur > 0 && dur < 120 ? 20 : 50;

    if (cur >= previewLimit) {
      // 1. Immediately pause the video
      video.pause();
      setPlayingVideoId(null);

      // 2. Capture canvas screenshot of the exact pause frame
      let snapshotUrl = vid.poster || vid.thumbnail || '';
      try {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 360;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
        if (dataUrl && dataUrl.length > 100) {
          snapshotUrl = dataUrl;
        }
      } catch (err) {
        console.warn('Canvas frame capture error, using poster fallback:', err);
      }

      // 3. Open Video Preview Modal
      setModalData({
        video: vid,
        snapshot: snapshotUrl,
        pausedAt: cur,
        duration: dur,
        previewLimit
      });
    }
  };

  const handleVideoEnded = (vid) => {
    setPlayingVideoId(null);
  };

  const handleSeek = (vidId, e) => {
    e.stopPropagation();
    const video = videoRefs.current[vidId];
    if (!video || !video.duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    video.currentTime = pos * video.duration;
  };

  const hasAnyFilterActive = isAnyFilterActiveWith(
    selectedChoices,
    selectedAge,
    selectedMarital,
    searchTag,
    customFilters
  );

  return (
    <div style={{ position: 'relative', minHeight: '100vh', background: 'transparent' }}>
      {/* BACKGROUND VIDEO OR IMAGE */}
      {bannerType === 'video' && bannerUrl ? (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            zIndex: 0,
            overflow: 'hidden'
          }}
        >
          <video
            autoPlay
            muted
            playsInline
            loop
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              minWidth: '100%',
              minHeight: '100%',
              width: 'auto',
              height: 'auto',
              objectFit: 'cover'
            }}
          >
            <source src={bannerUrl} type="video/mp4" />
          </video>
        </div>
      ) : bannerUrl ? (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            zIndex: 0,
            backgroundImage: `url(${bannerUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        />
      ) : null}

      {/* OVERLAY (Crisp dark tint without blur, matching WordPress temp_search) */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: `rgba(0, 0, 0, ${overlayStrength / 100})`,
          zIndex: 1,
          pointerEvents: 'none'
        }}
      />

      {/* CONTENT WRAPPER */}
      <div style={{ position: 'relative', zIndex: 2, paddingTop: '16px', paddingBottom: '70px' }}>
        <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '0 24px' }}>

          {/* MAIN TWO-COLUMN LAYOUT: SIDEBAR (approx 300px) + RIGHT CONTENT AREA */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: isSidebarVisible ? 'minmax(280px, 320px) 1fr' : '1fr',
              gap: '24px',
              alignItems: 'start'
            }}
          >
            {/* SIDEBAR FILTER (Draggable & Hideable) */}
            {isSidebarVisible && (
              <aside
                style={{
                  background: 'rgba(12, 16, 26, 0.92)',
                  padding: '20px 18px',
                  borderRadius: '16px',
                  boxShadow: isSidebarDragging
                    ? `0 20px 50px rgba(0,0,0,0.85), 0 0 25px ${accentColor}55`
                    : '0 12px 40px rgba(0,0,0,0.6)',
                  border: `1px solid ${isSidebarDragging ? accentColor : `${accentColor}33`}`,
                  position: 'sticky',
                  top: '84px',
                  alignSelf: 'flex-start',
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                  transform: (sidebarPos.x !== 0 || sidebarPos.y !== 0) ? `translate3d(${sidebarPos.x}px, ${sidebarPos.y}px, 0)` : 'none',
                  zIndex: isSidebarDragging ? 80 : 20,
                  userSelect: isSidebarDragging ? 'none' : 'auto',
                  transition: isSidebarDragging ? 'none' : 'box-shadow 0.2s ease, transform 0.1s ease'
                }}
              >
                {/* Header with Drag Handle & Hide/Reset Controls */}
                <div
                  onMouseDown={handleSidebarPointerDown}
                  onTouchStart={handleSidebarPointerDown}
                  style={{
                    fontSize: '18px',
                    fontWeight: 700,
                    color: '#fff',
                    marginBottom: '16px',
                    paddingBottom: '12px',
                    borderBottom: `2px solid ${accentColor}44`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: isSidebarDragging ? 'grabbing' : 'grab',
                    userSelect: 'none'
                  }}
                  title="Drag anywhere to reposition, or use buttons on the right"
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <GripVertical size={16} color="rgba(255,255,255,0.6)" />
                    🎯 Filter Videos
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {(sidebarPos.x !== 0 || sidebarPos.y !== 0) && (
                      <button
                        type="button"
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={() => setSidebarPos({ x: 0, y: 0 })}
                        title="Reset sidebar position"
                        style={{
                          background: 'rgba(255, 255, 255, 0.08)',
                          border: '1px solid rgba(255, 255, 255, 0.15)',
                          borderRadius: '50%',
                          width: '24px',
                          height: '24px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'rgba(255, 255, 255, 0.8)',
                          cursor: 'pointer',
                          padding: 0
                        }}
                      >
                        <RotateCcw size={11} />
                      </button>
                    )}
                    {hasAnyFilterActive && (
                      <button
                        type="button"
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={handleReset}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: accentColor,
                          fontSize: '12px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontWeight: 600
                        }}
                      >
                        <RotateCcw size={12} /> Clear
                      </button>
                    )}
                    <button
                      type="button"
                      onMouseDown={(e) => e.stopPropagation()}
                      onClick={() => setIsSidebarVisible(false)}
                      title="Hide filter sidebar"
                      style={{
                        background: 'rgba(255, 255, 255, 0.08)',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        borderRadius: '50%',
                        width: '24px',
                        height: '24px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'rgba(255, 255, 255, 0.8)',
                        cursor: 'pointer',
                        padding: 0
                      }}
                    >
                      <X size={12} />
                    </button>
                  </div>
                </div>


              {/* Accordion 1: Search by Tag */}
              <div style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', marginBottom: '8px' }}>
                <div
                  onClick={() => toggleAccordion('tag')}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px 0',
                    cursor: 'pointer',
                    color: '#fff',
                    fontWeight: 600,
                    fontSize: '14px'
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    🏷️ Search by Tag
                  </span>
                  <span
                    style={{
                      fontSize: '18px',
                      color: 'rgba(255,255,255,0.7)',
                      lineHeight: 1
                    }}
                  >
                    {openAccordions.tag ? '✕' : '+'}
                  </span>
                </div>
                {openAccordions.tag && (
                  <div style={{ paddingBottom: '16px' }}>
                    <div style={{ fontSize: '12px', color: '#94a3b8', fontStyle: 'italic', marginBottom: '8px' }}>
                      Type a tag name
                    </div>
                    {searchTag && (
                      <div
                        style={{
                          display: 'flex',
                          flexWrap: 'wrap',
                          gap: '6px',
                          marginBottom: '8px',
                          padding: '6px 8px',
                          background: 'rgba(255,255,255,0.04)',
                          borderRadius: '6px'
                        }}
                      >
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            background: accentColor,
                            color: '#fff',
                            padding: '3px 10px',
                            borderRadius: '20px',
                            fontSize: '12px',
                            fontWeight: 500
                          }}
                        >
                          #{searchTag}
                          <button
                            type="button"
                            onClick={handleClearTag}
                            style={{
                              background: 'rgba(255,255,255,0.25)',
                              border: 'none',
                              borderRadius: '50%',
                              width: '16px',
                              height: '16px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              color: '#fff',
                              padding: 0
                            }}
                          >
                            <X size={10} />
                          </button>
                        </span>
                      </div>
                    )}
                    <div style={{ position: 'relative' }}>
                      <input
                        type="text"
                        value={searchTag}
                        onChange={(e) => {
                          const val = e.target.value;
                          setSearchTag(val);
                          if (!val.trim()) {
                            const hasFilters = selectedChoices.length > 0 || selectedAge || selectedMarital;
                            if (!hasFilters) {
                              setVideos([]);
                              setTotalVideos(0);
                              setHasSearched(false);
                              if (playingVideoId && videoRefs.current[playingVideoId]) {
                                videoRefs.current[playingVideoId].pause();
                              }
                              setPlayingVideoId(null);
                            }
                          }
                        }}
                        onKeyDown={(e) => e.key === 'Enter' && handleApply()}
                        placeholder="Enter tag name... (e.g., hot, c)"
                        style={{
                          width: '100%',
                          padding: '10px 12px 10px 34px',
                          background: 'rgba(255,255,255,0.06)',
                          border: '1px solid rgba(255,255,255,0.15)',
                          borderRadius: '8px',
                          color: '#fff',
                          fontSize: '13px',
                          outline: 'none',
                          boxSizing: 'border-box'
                        }}
                      />
                      <Search
                        size={15}
                        color="rgba(255,255,255,0.4)"
                        style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Accordion 2: Select Your Choice */}
              {isChoiceActive && dynamicChoiceCategories.length > 0 && (
                <div style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', marginBottom: '8px' }}>
                  <div
                    onClick={() => toggleAccordion('choice')}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '12px 0',
                      cursor: 'pointer',
                      color: '#fff',
                      fontWeight: 600,
                      fontSize: '14px'
                    }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      📁 Select Your Choice
                    </span>
                    <span
                      style={{
                        fontSize: '18px',
                        color: 'rgba(255,255,255,0.7)',
                        lineHeight: 1
                      }}
                    >
                      {openAccordions.choice ? '✕' : '+'}
                    </span>
                  </div>
                  {openAccordions.choice && (
                    <div style={{ paddingBottom: '16px' }}>
                      {selectedChoices.length > 0 && (
                        <div
                          style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: '6px',
                            marginBottom: '10px',
                            padding: '6px 8px',
                            background: 'rgba(255,255,255,0.04)',
                            borderRadius: '6px'
                          }}
                        >
                          {selectedChoices.map((choice) => (
                            <span
                              key={choice}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                background: accentColor,
                                color: '#fff',
                                padding: '3px 10px',
                                borderRadius: '20px',
                                fontSize: '12px',
                                fontWeight: 500
                              }}
                            >
                              {choice}
                              <button
                                type="button"
                                onClick={() => toggleChoice(choice)}
                                style={{
                                  background: 'rgba(255,255,255,0.25)',
                                  border: 'none',
                                  borderRadius: '50%',
                                  width: '16px',
                                  height: '16px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  cursor: 'pointer',
                                  color: '#fff',
                                  padding: 0
                                }}
                              >
                                <X size={10} />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                        {dynamicChoiceCategories.map((cat) => {
                          const isChecked = selectedChoices.includes(cat);
                          return (
                            <button
                              key={cat}
                              type="button"
                              onClick={() => toggleChoice(cat)}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                padding: '8px 10px',
                                background: isChecked ? `${accentColor}22` : 'rgba(255,255,255,0.04)',
                                border: `1px solid ${isChecked ? accentColor : 'rgba(255,255,255,0.1)'}`,
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '12px',
                                fontWeight: 500,
                                color: isChecked ? '#fff' : 'rgba(255,255,255,0.8)',
                                textAlign: 'left',
                                transition: 'all 0.2s ease',
                                gap: '6px'
                              }}
                            >
                              <span
                                style={{
                                  width: '14px',
                                  height: '14px',
                                  borderRadius: '3px',
                                  border: `1.5px solid ${isChecked ? accentColor : 'rgba(255,255,255,0.3)'}`,
                                  background: isChecked ? accentColor : 'transparent',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  flexShrink: 0
                                }}
                              >
                                {isChecked && <Check size={10} color="#fff" />}
                              </span>
                              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {cat}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Accordion 3: Select Age Choice */}
              {isAgeActive && dynamicAgeGroups.length > 0 && (
                <div style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', marginBottom: '8px' }}>
                  <div
                    onClick={() => toggleAccordion('age')}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '12px 0',
                      cursor: 'pointer',
                      color: '#fff',
                      fontWeight: 600,
                      fontSize: '14px'
                    }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      🎂 Select Age Choice
                    </span>
                    <span
                      style={{
                        fontSize: '18px',
                        color: 'rgba(255,255,255,0.7)',
                        lineHeight: 1
                      }}
                    >
                      {openAccordions.age ? '✕' : '+'}
                    </span>
                  </div>
                  {openAccordions.age && (
                    <div style={{ paddingBottom: '16px' }}>
                      {selectedAge && (
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            marginBottom: '10px',
                            padding: '6px 8px',
                            background: 'rgba(255,255,255,0.04)',
                            borderRadius: '6px'
                          }}
                        >
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              background: accentColor,
                              color: '#fff',
                              padding: '3px 10px',
                              borderRadius: '20px',
                              fontSize: '12px',
                              fontWeight: 500
                            }}
                          >
                            Age: {selectedAge}
                            <button
                              type="button"
                              onClick={() => handleSelectAge('')}
                              style={{
                                background: 'rgba(255,255,255,0.25)',
                                border: 'none',
                                borderRadius: '50%',
                                width: '16px',
                                height: '16px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                color: '#fff',
                                padding: 0
                              }}
                            >
                              <X size={10} />
                            </button>
                          </span>
                        </div>
                      )}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                        {dynamicAgeGroups.map((ag) => {
                          const isSelected = selectedAge === ag;
                          return (
                            <button
                              key={ag}
                              type="button"
                              onClick={() => handleSelectAge(ag)}
                              style={{
                                padding: '6px 4px',
                                fontSize: '11px',
                                fontWeight: 600,
                                borderRadius: '6px',
                                cursor: 'pointer',
                                textAlign: 'center',
                                background: isSelected ? accentColor : 'rgba(255,255,255,0.04)',
                                color: isSelected ? '#fff' : 'rgba(255,255,255,0.8)',
                                border: `1px solid ${isSelected ? accentColor : 'rgba(255,255,255,0.1)'}`,
                                transition: 'all 0.2s ease'
                              }}
                            >
                              {ag}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Accordion 4: Select Marital Status (Select Your Choice in WP) */}
              {isMaritalActive && dynamicMaritalStatuses.length > 0 && (
                <div style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', marginBottom: '8px' }}>
                  <div
                    onClick={() => toggleAccordion('marital')}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '12px 0',
                      cursor: 'pointer',
                      color: '#fff',
                      fontWeight: 600,
                      fontSize: '14px'
                    }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      👩‍❤️‍👨 Select Your Choice
                    </span>
                    <span
                      style={{
                        fontSize: '18px',
                        color: 'rgba(255,255,255,0.7)',
                        lineHeight: 1
                      }}
                    >
                      {openAccordions.marital ? '✕' : '+'}
                    </span>
                  </div>
                  {openAccordions.marital && (
                    <div style={{ paddingBottom: '16px' }}>
                      {selectedMarital && (
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            marginBottom: '10px',
                            padding: '6px 8px',
                            background: 'rgba(255,255,255,0.04)',
                            borderRadius: '6px'
                          }}
                        >
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              background: accentColor,
                              color: '#fff',
                              padding: '3px 10px',
                              borderRadius: '20px',
                              fontSize: '12px',
                              fontWeight: 500
                            }}
                          >
                            Status: {selectedMarital}
                            <button
                              type="button"
                              onClick={() => handleSelectMarital('')}
                              style={{
                                background: 'rgba(255,255,255,0.25)',
                                border: 'none',
                                borderRadius: '50%',
                                width: '16px',
                                height: '16px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                color: '#fff',
                                padding: 0
                              }}
                            >
                              <X size={10} />
                            </button>
                          </span>
                        </div>
                      )}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                        {dynamicMaritalStatuses.map((status) => {
                          const isSelected = selectedMarital === status;
                          return (
                            <button
                              key={status}
                              type="button"
                              onClick={() => handleSelectMarital(status)}
                              style={{
                                padding: '8px 10px',
                                fontSize: '12px',
                                fontWeight: 600,
                                borderRadius: '6px',
                                cursor: 'pointer',
                                textAlign: 'center',
                                background: isSelected ? accentColor : 'rgba(255,255,255,0.04)',
                                color: isSelected ? '#fff' : 'rgba(255,255,255,0.8)',
                                border: `1px solid ${isSelected ? accentColor : 'rgba(255,255,255,0.1)'}`,
                                transition: 'all 0.2s ease',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '6px'
                              }}
                            >
                              <span>{status === 'Married' ? '💍' : '💔'}</span>
                              <span>{status}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Dynamic Custom Fields Accordions */}
              {searchCustomFields.map((field) => {
                const fieldKey = field.key;
                const isOpen = Boolean(openAccordions[fieldKey]);
                const currentVal = customFilters[fieldKey];
                const hasSelection = Array.isArray(currentVal)
                  ? currentVal.length > 0
                  : Boolean(currentVal && String(currentVal).trim());

                return (
                  <div
                    key={field._id}
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', marginBottom: '8px' }}
                  >
                    <div
                      onClick={() => toggleAccordion(fieldKey)}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '12px 0',
                        cursor: 'pointer',
                        color: '#fff',
                        fontWeight: 600,
                        fontSize: '14px'
                      }}
                    >
                      <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <SlidersHorizontal size={13} color={hasSelection ? accentColor : 'rgba(255,255,255,0.7)'} />
                        <span>{field.title}</span>
                        {hasSelection && (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              background: accentColor,
                              color: '#fff',
                              fontSize: '10px',
                              fontWeight: 700,
                              padding: '1px 6px',
                              borderRadius: '10px',
                              lineHeight: '1.2'
                            }}
                          >
                            {Array.isArray(currentVal) ? currentVal.length : '1'}
                          </span>
                        )}
                      </span>
                      <span
                        style={{
                          fontSize: '18px',
                          color: 'rgba(255,255,255,0.7)',
                          lineHeight: 1
                        }}
                      >
                        {isOpen ? '✕' : '+'}
                      </span>
                    </div>

                    {isOpen && (
                      <div style={{ paddingBottom: '16px' }}>
                        {/* Selected summary badges with remove buttons */}
                        {hasSelection && (
                          <div
                            style={{
                              display: 'flex',
                              flexWrap: 'wrap',
                              alignItems: 'center',
                              gap: '6px',
                              marginBottom: '10px',
                              padding: '6px 8px',
                              background: 'rgba(255,255,255,0.04)',
                              borderRadius: '6px'
                            }}
                          >
                            {Array.isArray(currentVal) ? (
                              currentVal.map((item) => (
                                <span
                                  key={item}
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    background: accentColor,
                                    color: '#fff',
                                    padding: '3px 10px',
                                    borderRadius: '20px',
                                    fontSize: '12px',
                                    fontWeight: 500
                                  }}
                                >
                                  {item}
                                  <button
                                    type="button"
                                    onClick={() => handleSelectCustomFilter(fieldKey, item, 'checkbox')}
                                    style={{
                                      background: 'rgba(255,255,255,0.25)',
                                      border: 'none',
                                      borderRadius: '50%',
                                      width: '16px',
                                      height: '16px',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      cursor: 'pointer',
                                      color: '#fff',
                                      padding: 0
                                    }}
                                  >
                                    <X size={10} />
                                  </button>
                                </span>
                              ))
                            ) : (
                              <span
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  background: accentColor,
                                  color: '#fff',
                                  padding: '3px 10px',
                                  borderRadius: '20px',
                                  fontSize: '12px',
                                  fontWeight: 500
                                }}
                              >
                                {field.title}: {currentVal}
                                <button
                                  type="button"
                                  onClick={() => handleClearCustomField(fieldKey)}
                                  style={{
                                    background: 'rgba(255,255,255,0.25)',
                                    border: 'none',
                                    borderRadius: '50%',
                                    width: '16px',
                                    height: '16px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    color: '#fff',
                                    padding: 0
                                  }}
                                >
                                  <X size={10} />
                                </button>
                              </span>
                            )}
                          </div>
                        )}

                        {/* If text input */}
                        {field.type === 'text' && (
                          <div style={{ position: 'relative' }}>
                            <input
                              type="text"
                              placeholder={field.placeholder || `Filter by ${field.title}...`}
                              value={currentVal || ''}
                              onChange={(e) => {
                                const v = e.target.value;
                                setCustomFilters((prev) => {
                                  const next = { ...prev };
                                  if (v) next[fieldKey] = v;
                                  else delete next[fieldKey];
                                  return next;
                                });
                                if (!v) {
                                  handleClearCustomField(fieldKey);
                                }
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  fetchVideos(1, false);
                                }
                              }}
                              style={{
                                width: '100%',
                                padding: '10px 12px 10px 34px',
                                background: 'rgba(255, 255, 255, 0.06)',
                                border: '1px solid rgba(255, 255, 255, 0.15)',
                                borderRadius: '8px',
                                color: '#fff',
                                fontSize: '13px',
                                outline: 'none',
                                boxSizing: 'border-box'
                              }}
                            />
                            <Search
                              size={15}
                              color="rgba(255,255,255,0.4)"
                              style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }}
                            />
                            {currentVal && (
                              <button
                                type="button"
                                onClick={() => handleClearCustomField(fieldKey)}
                                style={{
                                  position: 'absolute',
                                  right: '10px',
                                  top: '50%',
                                  transform: 'translateY(-50%)',
                                  background: 'none',
                                  border: 'none',
                                  color: 'rgba(255,255,255,0.5)',
                                  cursor: 'pointer',
                                  padding: 0
                                }}
                              >
                                <X size={14} />
                              </button>
                            )}
                          </div>
                        )}

                        {/* If checkbox (multi-select) */}
                        {field.type === 'checkbox' && (
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                            {(field.options || []).map((opt) => {
                              const selectedList = Array.isArray(currentVal) ? currentVal : [];
                              const isChecked = selectedList.includes(opt);
                              return (
                                <button
                                  key={opt}
                                  type="button"
                                  onClick={() => handleSelectCustomFilter(fieldKey, opt, 'checkbox')}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    padding: '8px 10px',
                                    background: isChecked ? `${accentColor}22` : 'rgba(255,255,255,0.04)',
                                    border: `1px solid ${isChecked ? accentColor : 'rgba(255,255,255,0.1)'}`,
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontSize: '12px',
                                    fontWeight: 500,
                                    color: isChecked ? '#fff' : 'rgba(255,255,255,0.8)',
                                    textAlign: 'left',
                                    transition: 'all 0.2s ease',
                                    gap: '6px'
                                  }}
                                >
                                  <span
                                    style={{
                                      width: '14px',
                                      height: '14px',
                                      borderRadius: '3px',
                                      border: `1.5px solid ${isChecked ? accentColor : 'rgba(255,255,255,0.3)'}`,
                                      background: isChecked ? accentColor : 'transparent',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      flexShrink: 0
                                    }}
                                  >
                                    {isChecked && <Check size={10} color="#fff" />}
                                  </span>
                                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {opt}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        )}

                        {/* If radio or select (single-select pills) */}
                        {(field.type === 'radio' || field.type === 'select') && (
                          <div
                            style={{
                              display: 'grid',
                              gridTemplateColumns:
                                (field.options || []).length === 3
                                  ? 'repeat(3, 1fr)'
                                  : (field.options || []).length <= 2
                                  ? 'repeat(2, 1fr)'
                                  : 'repeat(2, 1fr)',
                              gap: '6px'
                            }}
                          >
                            {(field.options || []).map((opt) => {
                              const isSelected = currentVal === opt;
                              return (
                                <button
                                  key={opt}
                                  type="button"
                                  onClick={() => handleSelectCustomFilter(fieldKey, opt, field.type)}
                                  style={{
                                    padding: '8px 10px',
                                    fontSize: '12px',
                                    fontWeight: 600,
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    textAlign: 'center',
                                    background: isSelected ? accentColor : 'rgba(255,255,255,0.04)',
                                    color: isSelected ? '#fff' : 'rgba(255,255,255,0.8)',
                                    border: `1px solid ${isSelected ? accentColor : 'rgba(255,255,255,0.1)'}`,
                                    transition: 'all 0.2s ease',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis'
                                  }}
                                >
                                  {opt}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Action Buttons (Matches WP screenshot) */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '16px' }}>
                <button
                  type="button"
                  onClick={handleApply}
                  style={{
                    background: `linear-gradient(135deg, ${accentColor} 0%, #db2777 100%)`,
                    border: 'none',
                    color: '#fff',
                    padding: '12px 20px',
                    borderRadius: '8px',
                    fontWeight: 700,
                    fontSize: '14px',
                    cursor: 'pointer',
                    boxShadow: `0 4px 16px ${accentColor}44`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <Search size={16} /> Find Result
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  style={{
                    background: 'rgba(255,255,255,0.08)',
                    border: '1px solid rgba(255,255,255,0.14)',
                    color: 'rgba(255,255,255,0.85)',
                    padding: '10px 20px',
                    borderRadius: '8px',
                    fontWeight: 500,
                    fontSize: '13px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <RotateCcw size={14} /> Reset All
                </button>
              </div>
            </aside>
          )}

            {/* RIGHT CONTENT CONTAINER */}
            <main style={{ minHeight: '300px' }}>
              {/* DEFAULT STATE: Exactly matches user screenshot when no search has been run */}
              {!hasSearched ? (
                isBoxVisible ? (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'center',
                      padding: '4px 0'
                    }}
                  >
                    <div
                      style={{
                        background: 'rgba(14, 18, 28, 0.90)',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        borderRadius: '18px',
                        padding: '24px 32px 36px',
                        maxWidth: '680px',
                        width: '100%',
                        textAlign: 'center',
                        boxShadow: isBoxDragging
                          ? '0 25px 60px rgba(0, 0, 0, 0.85), 0 0 25px rgba(255, 255, 255, 0.15)'
                          : '0 16px 40px rgba(0, 0, 0, 0.55)',
                        backdropFilter: 'blur(16px)',
                        WebkitBackdropFilter: 'blur(16px)',
                        transform: (boxPos.x !== 0 || boxPos.y !== 0) ? `translate3d(${boxPos.x}px, ${boxPos.y}px, 0)` : 'none',
                        transition: isBoxDragging ? 'none' : 'box-shadow 0.2s ease, transform 0.1s ease',
                        position: 'relative',
                        zIndex: isBoxDragging ? 70 : 10
                      }}
                    >
                      {/* Drag Handle & Control Header for Glassmorphism Box */}
                      <div
                        onMouseDown={handleBoxPointerDown}
                        onTouchStart={handleBoxPointerDown}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '0 0 12px',
                          marginBottom: '16px',
                          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                          cursor: isBoxDragging ? 'grabbing' : 'grab',
                          userSelect: 'none'
                        }}
                        title="Drag to reposition info box anywhere"
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'rgba(255, 255, 255, 0.6)', fontSize: '12px', fontWeight: 600 }}>
                          <GripVertical size={14} />
                          <span>Drag Box</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {(boxPos.x !== 0 || boxPos.y !== 0) && (
                            <button
                              type="button"
                              onMouseDown={(e) => e.stopPropagation()}
                              onClick={() => setBoxPos({ x: 0, y: 0 })}
                              title="Reset position"
                              style={{
                                background: 'rgba(255, 255, 255, 0.08)',
                                border: '1px solid rgba(255, 255, 255, 0.15)',
                                borderRadius: '50%',
                                width: '24px',
                                height: '24px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'rgba(255, 255, 255, 0.8)',
                                cursor: 'pointer',
                                padding: 0
                              }}
                            >
                              <RotateCcw size={11} />
                            </button>
                          )}
                          <button
                            type="button"
                            onMouseDown={(e) => e.stopPropagation()}
                            onClick={() => setIsBoxVisible(false)}
                            title="Hide Info Box"
                            style={{
                              background: 'rgba(255, 255, 255, 0.08)',
                              border: '1px solid rgba(255, 255, 255, 0.15)',
                              borderRadius: '50%',
                              width: '24px',
                              height: '24px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'rgba(255, 255, 255, 0.8)',
                              cursor: 'pointer',
                              padding: 0
                            }}
                          >
                            <X size={12} />
                          </button>
                        </div>
                      </div>

                      <h2
                        style={{
                          fontSize: '26px',
                          fontWeight: 700,
                          color: '#ffffff',
                          marginBottom: '14px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '12px'
                        }}
                      >
                        🔍 Find Your Videos
                      </h2>
                      <p
                        style={{
                          fontSize: '15px',
                          color: '#e2e8f0',
                          lineHeight: '1.6',
                          marginBottom: '10px',
                          fontWeight: 400
                        }}
                      >
                        Select your preferences from the sidebar and click "Find Result" or wait for auto-search.
                      </p>
                      <p
                        style={{
                          fontSize: '13px',
                          color: 'rgba(255, 255, 255, 0.6)',
                          lineHeight: '1.5',
                          margin: 0
                        }}
                      >
                        Choose categories, age group, marital status, or search by tag to find your perfect videos.
                      </p>
                    </div>
                  </div>
                ) : null
              ) : (
                /* SEARCH RESULTS VIEW */
                <>
                  {/* Results Count Header */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '20px',
                      background: 'rgba(12, 16, 26, 0.75)',
                      padding: '12px 20px',
                      borderRadius: '10px',
                      border: '1px solid rgba(255,255,255,0.08)',
                      backdropFilter: 'blur(12px)',
                      WebkitBackdropFilter: 'blur(12px)'
                    }}
                  >
                    <div style={{ color: '#fff', fontSize: '15px', fontWeight: 600 }}>
                      Found <span style={{ color: accentColor, fontWeight: 700 }}>{totalVideos}</span> videos
                    </div>
                    {loading && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#94a3b8', fontSize: '13px' }}>
                        <Loader2 size={14} className="spin" /> Searching...
                      </div>
                    )}
                  </div>

                  {/* Loading Spinner */}
                  {loading && !loadingMore ? (
                    <div
                      style={{
                        minHeight: '360px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '12px',
                        color: '#94a3b8'
                      }}
                    >
                      <Loader2 size={36} className="spin" color={accentColor} />
                      <span style={{ fontSize: '15px', fontWeight: 500 }}>Searching videos...</span>
                    </div>
                  ) : videos.length === 0 ? (
                    /* No Results Found */
                    <div
                      style={{
                        background: 'rgba(12, 16, 26, 0.75)',
                        borderRadius: '16px',
                        border: '1px solid rgba(255,255,255,0.08)',
                        padding: '60px 24px',
                        textAlign: 'center',
                        backdropFilter: 'blur(12px)'
                      }}
                    >
                      <div style={{ fontSize: '48px', marginBottom: '12px' }}>🔍</div>
                      <h3 style={{ color: '#fff', fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>
                        No Videos Found
                      </h3>
                      <p style={{ color: '#94a3b8', fontSize: '14px', maxWidth: '420px', margin: '0 auto 20px' }}>
                        Try adjusting your choice categories, age group, marital status, or search tag.
                      </p>
                      <button
                        type="button"
                        onClick={handleReset}
                        style={{
                          background: accentColor,
                          border: 'none',
                          color: '#fff',
                          padding: '10px 24px',
                          borderRadius: '50px',
                          fontWeight: 600,
                          fontSize: '14px',
                          cursor: 'pointer'
                        }}
                      >
                        Reset All Filters
                      </button>
                    </div>
                  ) : (
                    /* Videos Grid (3 Columns) */
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                        gap: '20px'
                      }}
                    >
                      {videos.map((vid) => {
                        const poster = vid.poster || vid.thumbnail || '/placeholder-video.jpg';
                        const prog = videoProgress[vid._id] || { percent: 0, currentTime: '00:00', duration: vid.duration || '00:00' };
                        const isCardPlaying = playingVideoId === vid._id;

                        return (
                          <div
                            key={vid._id}
                            style={{
                              background: 'rgba(16, 20, 32, 0.95)',
                              borderRadius: '14px',
                              overflow: 'hidden',
                              border: '1px solid rgba(255,255,255,0.08)',
                              boxShadow: '0 6px 24px rgba(0,0,0,0.35)',
                              display: 'flex',
                              flexDirection: 'column',
                              transition: 'transform 0.25s ease, box-shadow 0.25s ease'
                            }}
                          >
                            {/* VIDEO / INLINE PLAYER CONTAINER */}
                            <div
                              style={{
                                position: 'relative',
                                width: '100%',
                                paddingTop: '58%',
                                background: '#000',
                                overflow: 'hidden',
                                cursor: 'pointer'
                              }}
                              onClick={() => handleTogglePlay(vid)}
                            >
                              {/* Actual Video Element */}
                              <video
                                ref={(el) => (videoRefs.current[vid._id] = el)}
                                src={vid.videoUrl}
                                poster={poster}
                                preload="metadata"
                                playsInline
                                crossOrigin="anonymous"
                                onTimeUpdate={(e) => handleTimeUpdate(vid, e)}
                                onEnded={() => handleVideoEnded(vid)}
                                style={{
                                  position: 'absolute',
                                  top: 0,
                                  left: 0,
                                  width: '100%',
                                  height: '100%',
                                  objectFit: 'cover'
                                }}
                              />

                              {/* Center Play Overlay Icon (shows when paused) */}
                              {!isCardPlaying && (
                                <div
                                  style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    width: '100%',
                                    height: '100%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    background: 'rgba(0,0,0,0.38)',
                                    transition: 'background 0.2s ease',
                                    zIndex: 2
                                  }}
                                >
                                  <div
                                    style={{
                                      width: '56px',
                                      height: '56px',
                                      borderRadius: '50%',
                                      background: accentColor,
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      boxShadow: `0 4px 20px ${accentColor}88`,
                                      transition: 'transform 0.2s ease'
                                    }}
                                  >
                                    <Play size={24} fill="#fff" color="#fff" style={{ marginLeft: '3px' }} />
                                  </div>
                                </div>
                              )}

                              {/* Progress bar overlay at bottom of video card */}
                              <div
                                onClick={(e) => handleSeek(vid._id, e)}
                                style={{
                                  position: 'absolute',
                                  bottom: 0,
                                  left: 0,
                                  right: 0,
                                  padding: '8px 12px 10px',
                                  background: 'linear-gradient(transparent, rgba(0,0,0,0.92))',
                                  zIndex: 3,
                                  cursor: 'pointer'
                                }}
                              >
                                <div
                                  style={{
                                    width: '100%',
                                    height: '4px',
                                    background: 'rgba(255,255,255,0.25)',
                                    borderRadius: '2px',
                                    position: 'relative',
                                    marginBottom: '4px'
                                  }}
                                >
                                  <div
                                    style={{
                                      width: `${prog.percent}%`,
                                      height: '100%',
                                      background: accentColor,
                                      borderRadius: '2px',
                                      transition: 'width 0.1s linear'
                                    }}
                                  />
                                </div>
                                <div
                                  style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    fontSize: '11px',
                                    color: '#fff',
                                    fontWeight: 600,
                                    opacity: 0.95
                                  }}
                                >
                                  <span>{prog.currentTime}</span>
                                  <span>{prog.duration}</span>
                                </div>
                              </div>
                            </div>

                            {/* CARD BODY INFO */}
                            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                              <Link
                                to={`/video/${vid.slug}`}
                                style={{
                                  fontSize: '15px',
                                  fontWeight: 700,
                                  color: '#fff',
                                  textDecoration: 'none',
                                  lineHeight: '1.35',
                                  marginBottom: '10px',
                                  display: '-webkit-box',
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: 'vertical',
                                  overflow: 'hidden'
                                }}
                              >
                                {vid.title}
                              </Link>

                              {/* METADATA TAGS */}
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginBottom: '14px' }}>
                                {/* Choice Category Tag */}
                                {vid.choiceCategory && vid.choiceCategory.length > 0 && (
                                  <span
                                    style={{
                                      background: 'rgba(40, 167, 69, 0.15)',
                                      border: '1px solid rgba(40, 167, 69, 0.35)',
                                      color: '#4ade80',
                                      padding: '2px 8px',
                                      borderRadius: '12px',
                                      fontSize: '11px',
                                      fontWeight: 600
                                    }}
                                  >
                                    📁 {vid.choiceCategory.join(', ')}
                                  </span>
                                )}

                                {/* Age Group Tag */}
                                {vid.ageGroup && (
                                  <span
                                    style={{
                                      background: `${accentColor}18`,
                                      border: `1px solid ${accentColor}44`,
                                      color: accentColor,
                                      padding: '2px 8px',
                                      borderRadius: '12px',
                                      fontSize: '11px',
                                      fontWeight: 600
                                    }}
                                  >
                                    🎂 {vid.ageGroup}
                                  </span>
                                )}

                                {/* Marital Status Tag */}
                                {vid.maritalStatus && (
                                  <span
                                    style={{
                                      background: 'rgba(74, 144, 217, 0.15)',
                                      border: '1px solid rgba(74, 144, 217, 0.35)',
                                      color: '#60a5fa',
                                      padding: '2px 8px',
                                      borderRadius: '12px',
                                      fontSize: '11px',
                                      fontWeight: 600
                                    }}
                                  >
                                    {vid.maritalStatus.toLowerCase().includes('un') ? '💔' : '💍'} {vid.maritalStatus}
                                  </span>
                                )}
                              </div>

                              {/* ACTION BUTTONS */}
                              <div style={{ marginTop: 'auto', display: 'flex', gap: '8px' }}>
                                <button
                                  type="button"
                                  onClick={() => handleTogglePlay(vid)}
                                  style={{
                                    flex: 1,
                                    background: isCardPlaying ? `${accentColor}25` : 'rgba(255,255,255,0.06)',
                                    border: `1px solid ${isCardPlaying ? accentColor : 'rgba(255,255,255,0.12)'}`,
                                    color: isCardPlaying ? accentColor : '#cbd5e1',
                                    padding: '8px 12px',
                                    borderRadius: '6px',
                                    fontSize: '12px',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '6px'
                                  }}
                                >
                                  {isCardPlaying ? (
                                    <>
                                      <Pause size={13} /> Pause
                                    </>
                                  ) : (
                                    <>
                                      <Play size={13} fill="currentColor" /> Play
                                    </>
                                  )}
                                </button>
                                <Link
                                  to={`/video/${vid.slug}`}
                                  style={{
                                    background: accentColor,
                                    color: '#fff',
                                    textDecoration: 'none',
                                    padding: '8px 16px',
                                    borderRadius: '6px',
                                    fontSize: '12px',
                                    fontWeight: 700,
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px'
                                  }}
                                >
                                  Watch
                                </Link>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* LOAD MORE BUTTON */}
                  {currentPage < totalPages && (
                    <div style={{ textAlign: 'center', marginTop: '36px' }}>
                      <button
                        type="button"
                        onClick={() => fetchVideos(currentPage + 1, true)}
                        disabled={loadingMore}
                        style={{
                          background: `linear-gradient(135deg, ${accentColor} 0%, #db2777 100%)`,
                          border: 'none',
                          color: '#fff',
                          padding: '14px 44px',
                          borderRadius: '50px',
                          fontWeight: 700,
                          fontSize: '15px',
                          cursor: loadingMore ? 'not-allowed' : 'pointer',
                          boxShadow: `0 4px 20px ${accentColor}55`,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '10px',
                          opacity: loadingMore ? 0.7 : 1
                        }}
                      >
                        {loadingMore ? (
                          <>
                            <Loader2 size={18} className="spin" /> Loading More...
                          </>
                        ) : (
                          '📥 Load More Videos'
                        )}
                      </button>
                    </div>
                  )}
                </>
              )}
            </main>
          </div>
        </div>
      </div>

      {/* VIDEO PREVIEW MODAL POPUP (Triggered when preview limit 20s/50s reached) */}
      {modalData && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
        >
          {/* Dark Backdrop */}
          <div
            onClick={() => setModalData(null)}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              background: 'rgba(0, 0, 0, 0.88)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)'
            }}
          />

          {/* Modal Box */}
          <div
            style={{
              position: 'relative',
              background: '#141824',
              borderRadius: '20px',
              maxWidth: '540px',
              width: '100%',
              padding: '28px 24px 32px',
              textAlign: 'center',
              zIndex: 1,
              boxShadow: '0 30px 80px rgba(0, 0, 0, 0.8)',
              border: `1px solid ${accentColor}44`
            }}
          >
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setModalData(null)}
              aria-label="Close Preview"
              style={{
                position: 'absolute',
                top: '12px',
                right: '12px',
                zIndex: 100,
                background: 'rgba(10, 14, 23, 0.92)',
                border: '1.5px solid rgba(255, 255, 255, 0.35)',
                borderRadius: '50%',
                width: '38px',
                height: '38px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#ffffff',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.7)',
                transition: 'all 0.2s ease',
                pointerEvents: 'auto'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = accentColor;
                e.currentTarget.style.borderColor = accentColor;
                e.currentTarget.style.transform = 'scale(1.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(10, 14, 23, 0.92)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.35)';
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              <X size={20} strokeWidth={2.5} />
            </button>

            {/* Captured Video Frame Snapshot */}
            <div
              style={{
                position: 'relative',
                borderRadius: '14px',
                overflow: 'hidden',
                marginTop: '16px',
                marginBottom: '20px',
                background: '#000',
                boxShadow: '0 8px 30px rgba(0,0,0,0.6)',
                paddingTop: '56.25%'
              }}
            >
              <img
                src={modalData.snapshot}
                alt={modalData.video.title}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover'
                }}
              />
              {/* Snapshot Timestamp Badge */}
              <div
                style={{
                  position: 'absolute',
                  bottom: '12px',
                  right: '12px',
                  background: 'rgba(0,0,0,0.75)',
                  backdropFilter: 'blur(6px)',
                  color: '#fff',
                  fontSize: '11px',
                  fontWeight: 600,
                  padding: '4px 10px',
                  borderRadius: '20px',
                  border: '1px solid rgba(255,255,255,0.2)'
                }}
              >
                ⏸ Paused at {formatTime(modalData.pausedAt)}
              </div>
            </div>

            {/* Video Title */}
            <h3
              style={{
                margin: '0 0 10px',
                fontSize: '20px',
                color: '#fff',
                fontWeight: 700,
                lineHeight: 1.35
              }}
            >
              {modalData.video.title}
            </h3>

            {/* Metadata Badges */}
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                marginBottom: '16px',
                color: '#94a3b8',
                fontSize: '12px'
              }}
            >
              {modalData.video.choiceCategory?.length > 0 && (
                <span
                  style={{
                    background: 'rgba(40, 167, 69, 0.15)',
                    border: '1px solid rgba(40, 167, 69, 0.35)',
                    color: '#4ade80',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    fontWeight: 600
                  }}
                >
                  📁 {modalData.video.choiceCategory.join(', ')}
                </span>
              )}
              {modalData.video.ageGroup && (
                <span
                  style={{
                    background: `${accentColor}18`,
                    border: `1px solid ${accentColor}44`,
                    color: accentColor,
                    padding: '2px 8px',
                    borderRadius: '12px',
                    fontWeight: 600
                  }}
                >
                  🎂 Age: {modalData.video.ageGroup}
                </span>
              )}
              {modalData.video.maritalStatus && (
                <span
                  style={{
                    background: 'rgba(74, 144, 217, 0.15)',
                    border: '1px solid rgba(74, 144, 217, 0.35)',
                    color: '#60a5fa',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    fontWeight: 600
                  }}
                >
                  💍 {modalData.video.maritalStatus}
                </span>
              )}
            </div>

            {/* Explanation Note */}
            <p
              style={{
                fontSize: '13px',
                color: '#cbd5e1',
                margin: '0 auto 22px',
                maxWidth: '420px',
                lineHeight: 1.5
              }}
            >
              Preview limit reached ({modalData.previewLimit}s). Watch the complete high-definition video with full controls on the video page.
            </p>

            {/* Watch Full Video Button (Navigates to Single Video Details) */}
            <Link
              to={`/video/${modalData.video.slug}`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                background: `linear-gradient(135deg, ${accentColor} 0%, #db2777 100%)`,
                color: '#fff',
                textDecoration: 'none',
                padding: '14px 44px',
                borderRadius: '50px',
                fontWeight: 700,
                fontSize: '15px',
                boxShadow: `0 6px 24px ${accentColor}66`,
                transition: 'all 0.2s ease'
              }}
            >
              ▶ Watch Full Video
            </Link>
          </div>
        </div>
      )}

      {/* Floating Toggle Pill to Restore Sidebar if Hidden (Draggable) */}
      {!isSidebarVisible && (
        <button
          type="button"
          onMouseDown={handleSidebarTogglePointerDown}
          onTouchStart={handleSidebarTogglePointerDown}
          onClick={handleSidebarToggleClick}
          style={{
            position: 'fixed',
            bottom: '24px',
            left: '24px',
            zIndex: 999999,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '10px',
            padding: '10px 22px',
            background: 'rgba(15, 23, 42, 0.95)',
            border: `2px solid ${accentColor}`,
            borderRadius: '999px',
            color: '#fff',
            fontSize: '14px',
            fontWeight: 600,
            cursor: isSidebarToggleDragging ? 'grabbing' : 'grab',
            boxShadow: isSidebarToggleDragging
              ? `0 14px 34px rgba(0,0,0,0.85), 0 0 24px ${accentColor}88`
              : `0 8px 24px rgba(0,0,0,0.6), 0 0 16px ${accentColor}44`,
            backdropFilter: 'blur(14px)',
            WebkitBackdropFilter: 'blur(14px)',
            transform: (sidebarTogglePos.x !== 0 || sidebarTogglePos.y !== 0)
              ? `translate3d(${sidebarTogglePos.x}px, ${sidebarTogglePos.y}px, 0)`
              : 'none',
            transition: isSidebarToggleDragging ? 'none' : 'box-shadow 0.2s ease, transform 0.1s ease',
            userSelect: 'none',
            touchAction: 'none'
          }}
          title="Drag anywhere to reposition, click to show filter sidebar"
        >
          <SlidersHorizontal size={16} color={accentColor} />
          <span>Show Filter Sidebar</span>
        </button>
      )}

      {/* Floating Toggle Pill to Restore Info Box if Hidden (Draggable) */}
      {!isBoxVisible && !hasSearched && (
        <button
          type="button"
          onMouseDown={handleBoxTogglePointerDown}
          onTouchStart={handleBoxTogglePointerDown}
          onClick={handleBoxToggleClick}
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 999999,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '10px',
            padding: '10px 22px',
            background: 'rgba(15, 23, 42, 0.95)',
            border: `2px solid ${accentColor}`,
            borderRadius: '999px',
            color: '#fff',
            fontSize: '14px',
            fontWeight: 600,
            cursor: isBoxToggleDragging ? 'grabbing' : 'grab',
            boxShadow: isBoxToggleDragging
              ? `0 14px 34px rgba(0,0,0,0.85), 0 0 24px ${accentColor}88`
              : `0 8px 24px rgba(0,0,0,0.6), 0 0 16px ${accentColor}44`,
            backdropFilter: 'blur(14px)',
            WebkitBackdropFilter: 'blur(14px)',
            transform: (boxTogglePos.x !== 0 || boxTogglePos.y !== 0)
              ? `translate3d(${boxTogglePos.x}px, ${boxTogglePos.y}px, 0)`
              : 'none',
            transition: isBoxToggleDragging ? 'none' : 'box-shadow 0.2s ease, transform 0.1s ease',
            userSelect: 'none',
            touchAction: 'none'
          }}
          title="Drag anywhere to reposition, click to show info box"
        >
          <SlidersHorizontal size={16} color={accentColor} />
          <span>Show Info Box</span>
        </button>
      )}
    </div>
  );
};

export default SearchByVideoTemplate;

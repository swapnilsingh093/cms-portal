import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import SmartImage from '../../components/common/SmartImage';
import { searchAPI, categoryAPI } from '../../services/api';
import {
  Search,
  Sliders,
  Calendar,
  Heart,
  Tag,
  Film,
  Image as ImageIcon,
  BookOpen,
  Play,
  Eye,
  Clock,
  Layers,
  X,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Filter,
  Check
} from 'lucide-react';

const AGE_LIST = Array.from({ length: 43 }, (_, i) => 18 + i); // 18 to 60

const QUICK_AGE_RANGES = [
  { label: '18 - 25', min: 18, max: 25 },
  { label: '26 - 35', min: 26, max: 35 },
  { label: '36 - 45', min: 36, max: 45 },
  { label: '46 - 60', min: 46, max: 60 }
];

const AdvancedSearchPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Search filter states initialized from URL search params
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || searchParams.get('search') || '');
  const [contentType, setContentType] = useState(searchParams.get('type') || 'all');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [selectedMaritalStatus, setSelectedMaritalStatus] = useState(searchParams.get('maritalStatus') || '');
  
  // Selected ages array
  const [selectedAges, setSelectedAges] = useState(() => {
    const rawAge = searchParams.get('age');
    if (!rawAge) return [];
    return rawAge.split(',').map(Number).filter((n) => !isNaN(n));
  });

  // Selected tags array
  const [selectedTags, setSelectedTags] = useState(() => {
    const rawTags = searchParams.get('tags');
    if (!rawTags) return [];
    return rawTags.split(',').map((t) => t.trim()).filter(Boolean);
  });

  const [sortBy, setSortBy] = useState(searchParams.get('sort') || '-createdAt');
  const [page, setPage] = useState(parseInt(searchParams.get('page')) || 1);

  // Data states
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [counts, setCounts] = useState({ all: 0, videos: 0, galleries: 0, posts: 0 });
  const [availableTags, setAvailableTags] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(true);

  // Load categories
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await categoryAPI.getAll();
        if (res.categories) setCategories(res.categories);
      } catch (err) {
        console.error('Error loading categories:', err);
      }
    };
    loadCategories();
  }, []);

  // Fetch search results
  useEffect(() => {
    const fetchResults = async () => {
      setLoading(true);
      try {
        const params = {
          page,
          limit: 18,
          sort: sortBy
        };

        if (searchQuery.trim()) params.q = searchQuery.trim();
        if (contentType && contentType !== 'all') params.type = contentType;
        if (selectedCategory) params.category = selectedCategory;
        if (selectedMaritalStatus) params.maritalStatus = selectedMaritalStatus;
        if (selectedAges.length > 0) params.age = selectedAges.join(',');
        if (selectedTags.length > 0) params.tags = selectedTags.join(',');

        // Update URL query params without reloading
        const urlParams = new URLSearchParams();
        if (searchQuery.trim()) urlParams.set('q', searchQuery.trim());
        if (contentType && contentType !== 'all') urlParams.set('type', contentType);
        if (selectedCategory) urlParams.set('category', selectedCategory);
        if (selectedMaritalStatus) urlParams.set('maritalStatus', selectedMaritalStatus);
        if (selectedAges.length > 0) urlParams.set('age', selectedAges.join(','));
        if (selectedTags.length > 0) urlParams.set('tags', selectedTags.join(','));
        if (sortBy !== '-createdAt') urlParams.set('sort', sortBy);
        if (page > 1) urlParams.set('page', page);

        setSearchParams(urlParams, { replace: true });

        const res = await searchAPI.advancedSearch(params);
        if (res.success) {
          setItems(res.items || []);
          setTotal(res.total ?? (res.pagination?.total || 0));
          setTotalPages(res.pagination?.pages || 1);
          if (res.counts) setCounts(res.counts);
          if (res.availableTags) setAvailableTags(res.availableTags);
        }
      } catch (err) {
        console.error('Search error:', err);
        setItems([]);
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(fetchResults, 200);
    return () => clearTimeout(debounce);
  }, [searchQuery, contentType, selectedCategory, selectedMaritalStatus, selectedAges, selectedTags, sortBy, page]);

  // Age Toggle
  const toggleAge = (num) => {
    setPage(1);
    if (selectedAges.includes(num)) {
      setSelectedAges(selectedAges.filter((a) => a !== num));
    } else {
      setSelectedAges([...selectedAges, num].sort((a, b) => a - b));
    }
  };

  const handleSelectAgeRange = (min, max) => {
    setPage(1);
    const rangeVals = [];
    for (let i = min; i <= max; i++) rangeVals.push(i);
    const allSelected = rangeVals.every((r) => selectedAges.includes(r));
    if (allSelected) {
      setSelectedAges(selectedAges.filter((a) => a < min || a > max));
    } else {
      setSelectedAges(Array.from(new Set([...selectedAges, ...rangeVals])).sort((a, b) => a - b));
    }
  };

  const selectAgeRange = handleSelectAgeRange;

  const handleSelectAllAges = () => {
    setPage(1);
    if (selectedAges.length === AGE_LIST.length) {
      setSelectedAges([]);
    } else {
      setSelectedAges([...AGE_LIST]);
    }
  };

  const selectAllAges = handleSelectAllAges;

  // Tag Toggle
  const toggleTag = (tagName) => {
    setPage(1);
    if (selectedTags.includes(tagName)) {
      setSelectedTags(selectedTags.filter((t) => t !== tagName));
    } else {
      setSelectedTags([...selectedTags, tagName]);
    }
  };

  // Reset All Filters
  const handleResetFilters = () => {
    setSearchQuery('');
    setContentType('all');
    setSelectedCategory('');
    setSelectedMaritalStatus('');
    setSelectedAges([]);
    setSelectedTags([]);
    setSortBy('-createdAt');
    setPage(1);
  };

  const hasActiveFilters = Boolean(
    searchQuery.trim() ||
    contentType !== 'all' ||
    selectedCategory ||
    selectedMaritalStatus ||
    selectedAges.length > 0 ||
    selectedTags.length > 0
  );

  const handleNavigateToItem = (item) => {
    if (item.itemType === 'video') {
      navigate(`/video/${item.slug}`);
    } else if (item.itemType === 'gallery') {
      navigate(`/gallery/${item.slug}`);
    } else {
      navigate(`/post/${item.slug}`);
    }
  };

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '30px 20px 80px' }}>
      {/* Header Banner */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(20, 26, 44, 0.95), rgba(13, 17, 28, 0.98))',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '16px',
        padding: '32px 28px',
        marginBottom: '28px',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.45)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute',
          top: '-60px',
          right: '-40px',
          width: '280px',
          height: '280px',
          background: 'radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, transparent 70%)',
          borderRadius: '50%',
          pointerEvents: 'none'
        }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--accent-primary, #6366f1)', marginBottom: '8px', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            <Search size={16} /> Portal Search
          </div>
          <h1 style={{ fontSize: '2.1rem', fontWeight: 800, margin: '0 0 10px 0', letterSpacing: '-0.02em', color: '#fff' }}>
            Search Portal
          </h1>
          <p style={{ color: 'var(--text-muted, #94a3b8)', fontSize: '0.98rem', maxWidth: '680px', margin: '0 0 24px 0', lineHeight: 1.5 }}>
            Search across all published videos, photo galleries, and stories.
          </p>

          {/* Main Search Input */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            background: 'rgba(0, 0, 0, 0.4)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: '12px',
            padding: '4px 8px 4px 16px',
            maxWidth: '720px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
            transition: 'border-color 0.2s'
          }}>
            <Search size={20} color="var(--accent-primary, #6366f1)" style={{ marginRight: '12px', flexShrink: 0 }} />
            <input
              type="text"
              placeholder="Search by title, keywords, or topics..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              style={{
                flex: 1,
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: '#fff',
                fontSize: '1.05rem',
                padding: '12px 0'
              }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '28px',
                  height: '28px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#cbd5e1',
                  cursor: 'pointer',
                  marginRight: '8px'
                }}
              >
                <X size={14} />
              </button>
            )}
            <button
              type="button"
              onClick={() => setFiltersOpen(!filtersOpen)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '10px 16px',
                borderRadius: '8px',
                background: filtersOpen ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255, 255, 255, 0.08)',
                border: filtersOpen ? '1px solid #6366f1' : '1px solid rgba(255, 255, 255, 0.1)',
                color: filtersOpen ? '#a5b4fc' : '#cbd5e1',
                fontSize: '0.88rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <Filter size={15} />
              {filtersOpen ? 'Hide Filters' : 'Show Filters'}
            </button>

          </div>
        </div>
      </div>

      {/* Filter Panel */}
      {filtersOpen && (
        <div style={{
          background: 'rgba(18, 24, 38, 0.95)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '16px',
          padding: '24px',
          marginBottom: '28px',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
        }}>
          {/* Row 1: Content Type & Marital Status */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
            {/* Content Type Chips */}
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-secondary, #94a3b8)', marginBottom: '10px' }}>
                <Layers size={14} /> Content Type
              </label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {[
                  { id: 'all', label: 'All Content', icon: Layers, count: counts.all },
                  { id: 'videos', label: 'Videos', icon: Film, count: counts.videos },
                  { id: 'galleries', label: 'Galleries', icon: ImageIcon, count: counts.galleries },
                  { id: 'posts', label: 'Stories', icon: BookOpen, count: counts.posts }
                ].map((typeOption) => {
                  const Icon = typeOption.icon;
                  const isActive = contentType === typeOption.id;
                  return (
                    <button
                      key={typeOption.id}
                      type="button"
                      onClick={() => {
                        setContentType(typeOption.id);
                        setPage(1);
                      }}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '8px 14px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '0.86rem',
                        fontWeight: isActive ? 700 : 500,
                        transition: 'all 0.15s ease',
                        border: isActive ? '1px solid #6366f1' : '1px solid rgba(255, 255, 255, 0.1)',
                        background: isActive ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.25), rgba(79, 70, 229, 0.35))' : 'rgba(255, 255, 255, 0.03)',
                        color: isActive ? '#a5b4fc' : 'var(--text-secondary, #cbd5e1)'
                      }}
                    >
                      <Icon size={14} />
                      {typeOption.label}
                      <span style={{
                        fontSize: '0.72rem',
                        padding: '1px 6px',
                        borderRadius: '10px',
                        background: isActive ? 'rgba(99, 102, 241, 0.5)' : 'rgba(255, 255, 255, 0.08)',
                        color: isActive ? '#fff' : '#94a3b8'
                      }}>
                        {typeOption.count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Marital Status Radio Buttons in Tag/Pill Layout */}
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-secondary, #94a3b8)', marginBottom: '10px' }}>
                <Heart size={14} /> Marital Status (Material Status)
              </label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {[
                  { value: '', label: 'All / Any' },
                  { value: 'married', label: 'Married' },
                  { value: 'unmarried', label: 'Unmarried' }
                ].map((opt) => {
                  const checked = selectedMaritalStatus === opt.value;
                  return (
                    <label
                      key={opt.value}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '8px 14px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '0.86rem',
                        fontWeight: checked ? 700 : 500,
                        border: checked ? '1px solid #ec4899' : '1px solid rgba(255, 255, 255, 0.1)',
                        background: checked ? 'rgba(236, 72, 153, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                        color: checked ? '#f472b6' : 'var(--text-secondary, #cbd5e1)',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <input
                        type="radio"
                        name="maritalStatusFilter"
                        value={opt.value}
                        checked={checked}
                        onChange={() => {
                          setSelectedMaritalStatus(opt.value);
                          setPage(1);
                        }}
                        style={{ accentColor: '#ec4899', cursor: 'pointer' }}
                      />
                      <span>{opt.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Row 2: Age Filter (18 to 60 yrs) Multi-Select Tag Layout */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-secondary, #94a3b8)' }}>
                <Calendar size={14} /> Age Tags (18 yrs to 60 yrs multi-select)
                {selectedAges.length > 0 && (
                  <span style={{ fontSize: '0.72rem', background: '#6366f1', color: '#fff', padding: '1px 7px', borderRadius: '10px', textTransform: 'none' }}>
                    {selectedAges.length} selected
                  </span>
                )}
              </label>

              {/* Quick Presets & Clear */}
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                {QUICK_AGE_RANGES.map((rg) => (
                  <button
                    key={rg.label}
                    type="button"
                    onClick={() => selectAgeRange(rg.min, rg.max)}
                    style={{
                      fontSize: '0.74rem',
                      fontWeight: 600,
                      padding: '3px 8px',
                      borderRadius: '6px',
                      background: 'rgba(255, 255, 255, 0.06)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: 'var(--text-secondary, #cbd5e1)',
                      cursor: 'pointer'
                    }}
                  >
                    {rg.label} yrs
                  </button>
                ))}
                <button
                  type="button"
                  onClick={selectAllAges}
                  style={{
                    fontSize: '0.74rem',
                    fontWeight: 600,
                    padding: '3px 8px',
                    borderRadius: '6px',
                    background: 'rgba(99, 102, 241, 0.15)',
                    border: '1px solid #6366f1',
                    color: '#a5b4fc',
                    cursor: 'pointer'
                  }}
                >
                  Select All (18-60)
                </button>
                {selectedAges.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedAges([]);
                      setPage(1);
                    }}
                    style={{
                      fontSize: '0.74rem',
                      fontWeight: 600,
                      padding: '3px 8px',
                      borderRadius: '6px',
                      background: 'rgba(239, 68, 68, 0.15)',
                      border: '1px solid rgba(239, 68, 68, 0.4)',
                      color: '#f87171',
                      cursor: 'pointer'
                    }}
                  >
                    Clear Ages
                  </button>
                )}
              </div>
            </div>

            {/* 18 to 60 Numbers Grid */}
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '6px',
              maxHeight: '130px',
              overflowY: 'auto',
              padding: '6px',
              background: 'rgba(0, 0, 0, 0.25)',
              borderRadius: '10px',
              border: '1px solid rgba(255, 255, 255, 0.05)'
            }}>
              {AGE_LIST.map((ageNum) => {
                const isSelected = selectedAges.includes(ageNum);
                return (
                  <button
                    key={ageNum}
                    type="button"
                    onClick={() => toggleAge(ageNum)}
                    style={{
                      minWidth: '32px',
                      height: '28px',
                      borderRadius: '6px',
                      fontSize: '0.78rem',
                      fontWeight: isSelected ? 700 : 500,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      border: isSelected ? '1px solid #6366f1' : '1px solid rgba(255, 255, 255, 0.08)',
                      background: isSelected ? '#6366f1' : 'rgba(255, 255, 255, 0.03)',
                      color: isSelected ? '#fff' : 'var(--text-secondary, #cbd5e1)'
                    }}
                  >
                    {ageNum}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Row 3: Categories & Popular Tags */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
            {/* Category Select */}
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-secondary, #94a3b8)', marginBottom: '10px' }}>
                <Layers size={14} /> Categories
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setPage(1);
                }}
                style={{
                  width: '100%',
                  background: 'rgba(0, 0, 0, 0.3)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  color: '#fff',
                  padding: '10px 14px',
                  fontSize: '0.9rem'
                }}
              >
                <option value="">All Categories</option>
                {categories.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.parentCategory ? `↳ ${c.name}` : c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Popular Tags */}
            {availableTags.length > 0 && (
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-secondary, #94a3b8)', marginBottom: '10px' }}>
                  <Tag size={14} /> Popular Tags
                </label>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', maxHeight: '100px', overflowY: 'auto' }}>
                  {availableTags.map((t) => {
                    const isSelected = selectedTags.includes(t);
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => toggleTag(t)}
                        style={{
                          fontSize: '0.78rem',
                          fontWeight: isSelected ? 700 : 500,
                          padding: '4px 10px',
                          borderRadius: '16px',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                          border: isSelected ? '1px solid #10b981' : '1px solid rgba(255, 255, 255, 0.1)',
                          background: isSelected ? 'rgba(16, 185, 129, 0.25)' : 'rgba(255, 255, 255, 0.03)',
                          color: isSelected ? '#6ee7b7' : 'var(--text-secondary, #cbd5e1)'
                        }}
                      >
                        #{t}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Active Filters Summary Bar */}
          {hasActiveFilters && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px',
              paddingTop: '16px',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted, #94a3b8)', fontWeight: 600 }}>
                  Active Filters:
                </span>
                {searchQuery && (
                  <span style={{ fontSize: '0.75rem', background: 'rgba(99, 102, 241, 0.2)', border: '1px solid #6366f1', color: '#fff', padding: '2px 8px', borderRadius: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    Keyword: "{searchQuery}" <X size={12} style={{ cursor: 'pointer' }} onClick={() => setSearchQuery('')} />
                  </span>
                )}
                {contentType !== 'all' && (
                  <span style={{ fontSize: '0.75rem', background: 'rgba(99, 102, 241, 0.2)', border: '1px solid #6366f1', color: '#fff', padding: '2px 8px', borderRadius: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    Type: {contentType} <X size={12} style={{ cursor: 'pointer' }} onClick={() => setContentType('all')} />
                  </span>
                )}
                {selectedMaritalStatus && (
                  <span style={{ fontSize: '0.75rem', background: 'rgba(236, 72, 153, 0.2)', border: '1px solid #ec4899', color: '#fff', padding: '2px 8px', borderRadius: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    Status: {selectedMaritalStatus} <X size={12} style={{ cursor: 'pointer' }} onClick={() => setSelectedMaritalStatus('')} />
                  </span>
                )}
                {selectedAges.length > 0 && (
                  <span style={{ fontSize: '0.75rem', background: 'rgba(99, 102, 241, 0.2)', border: '1px solid #6366f1', color: '#fff', padding: '2px 8px', borderRadius: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    Ages: {selectedAges.slice(0, 5).join(', ')}{selectedAges.length > 5 ? ` +${selectedAges.length - 5}` : ''} <X size={12} style={{ cursor: 'pointer' }} onClick={() => setSelectedAges([])} />
                  </span>
                )}
                {selectedTags.map((tg) => (
                  <span key={tg} style={{ fontSize: '0.75rem', background: 'rgba(16, 185, 129, 0.2)', border: '1px solid #10b981', color: '#fff', padding: '2px 8px', borderRadius: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    #{tg} <X size={12} style={{ cursor: 'pointer' }} onClick={() => toggleTag(tg)} />
                  </span>
                ))}
              </div>

              <button
                type="button"
                onClick={handleResetFilters}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'transparent',
                  border: 'none',
                  color: '#f87171',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: '4px 8px'
                }}
              >
                <RotateCcw size={13} /> Reset All Filters
              </button>
            </div>
          )}
        </div>
      )}

      {/* Results Header: Count & Sort */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        marginBottom: '20px'
      }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>
            {loading ? 'Searching...' : `Found ${total} item${total === 1 ? '' : 's'}`}
          </h2>
          {searchQuery && (
            <p style={{ color: 'var(--text-muted, #94a3b8)', fontSize: '0.85rem', margin: '4px 0 0 0' }}>
              Showing results for &ldquo;{searchQuery}&rdquo;
            </p>
          )}
        </div>

        {/* Sort selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted, #94a3b8)' }}>Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value);
              setPage(1);
            }}
            style={{
              background: 'rgba(0, 0, 0, 0.3)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              color: '#fff',
              padding: '6px 12px',
              fontSize: '0.85rem'
            }}
          >
            <option value="-createdAt">Newest First</option>
            <option value="popular">Most Popular / Views</option>
            <option value="oldest">Oldest First</option>
            <option value="title">Alphabetical (A-Z)</option>
          </select>
        </div>
      </div>

      {/* Grid of Results */}
      {loading ? (
        <div style={{
          textAlign: 'center',
          padding: '100px 20px',
          background: 'rgba(18, 24, 38, 0.5)',
          borderRadius: '16px',
          border: '1px solid rgba(255,255,255,0.06)'
        }}>
          <div style={{ width: '40px', height: '40px', border: '3px solid rgba(99, 102, 241, 0.2)', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
          <h3 style={{ fontSize: '1.1rem', margin: '0 0 6px 0' }}>Searching across library...</h3>
          <p style={{ color: 'var(--text-muted, #94a3b8)', fontSize: '0.9rem', margin: 0 }}>Matching videos, galleries, and stories</p>
        </div>
      ) : items.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '80px 20px',
          background: 'rgba(18, 24, 38, 0.5)',
          borderRadius: '16px',
          border: '1px solid rgba(255,255,255,0.06)'
        }}>
          <Search size={48} color="#64748b" style={{ margin: '0 auto 16px', display: 'block' }} />
          <h3 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>No items match your criteria</h3>
          <p style={{ color: 'var(--text-muted, #94a3b8)', fontSize: '0.92rem', maxWidth: '440px', margin: '0 auto 20px' }}>
            Try expanding your age range, clearing tags, or resetting filters to see more content.
          </p>
          <button
            type="button"
            onClick={handleResetFilters}
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
              border: 'none',
              color: '#fff',
              fontWeight: 600,
              fontSize: '0.9rem',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(99, 102, 241, 0.4)'
            }}
          >
            Reset All Filters
          </button>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))',
          gap: '24px'
        }}>
          {items.map((item) => {
            const isVideo = item.itemType === 'video';
            const isGallery = item.itemType === 'gallery';

            return (
              <div
                key={item._id}
                onClick={() => handleNavigateToItem(item)}
                className="glass-panel"
                style={{
                  cursor: 'pointer',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  borderRadius: '12px',
                  background: 'rgba(18, 24, 38, 0.7)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  transition: 'transform 0.2s, box-shadow 0.2s, border-color 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.4)';
                  e.currentTarget.style.boxShadow = '0 12px 30px rgba(0, 0, 0, 0.5)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                {/* Media Thumbnail Container */}
                <div style={{ position: 'relative', height: '190px', background: '#0a0d14', overflow: 'hidden' }}>
                  <SmartImage
                    src={
                      item.thumbnail ||
                      'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600'
                    }
                    alt={item.title}
                    style={{ width: '100%', height: '100%' }}
                  />

                  {/* Item Type Badge */}
                  <span style={{
                    position: 'absolute',
                    top: '10px',
                    left: '10px',
                    background: isVideo ? 'rgba(99, 102, 241, 0.9)' : isGallery ? 'rgba(168, 85, 247, 0.9)' : 'rgba(236, 72, 153, 0.9)',
                    color: '#fff',
                    padding: '3px 8px',
                    borderRadius: '6px',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
                    backdropFilter: 'blur(4px)'
                  }}>
                    {isVideo && <Film size={11} />}
                    {isGallery && <ImageIcon size={11} />}
                    {!isVideo && !isGallery && <BookOpen size={11} />}
                    {item.itemType}
                  </span>

                  {/* Video Play Icon / Gallery Photos Badge */}
                  {isVideo && (
                    <div style={{
                      position: 'absolute',
                      inset: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: 'rgba(0, 0, 0, 0.2)'
                    }}>
                      <div style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 4px 16px rgba(0,0,0,0.5)'
                      }}>
                        <Play size={18} fill="#fff" color="#fff" style={{ marginLeft: '2px' }} />
                      </div>
                    </div>
                  )}

                  {/* Duration Badge for Videos */}
                  {isVideo && item.duration && (
                    <span style={{
                      position: 'absolute',
                      bottom: '10px',
                      right: '10px',
                      background: 'rgba(0, 0, 0, 0.85)',
                      color: '#fff',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      <Clock size={11} /> {item.duration}
                    </span>
                  )}

                  {/* Photo Count for Galleries */}
                  {isGallery && item.imageCount > 0 && (
                    <span style={{
                      position: 'absolute',
                      bottom: '10px',
                      right: '10px',
                      background: 'rgba(0, 0, 0, 0.85)',
                      color: '#fff',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      <ImageIcon size={11} /> {item.imageCount} photos
                    </span>
                  )}
                </div>

                {/* Card Info */}
                <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                  {/* Category & Marital Status row */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.76rem', color: 'var(--accent-primary, #6366f1)', fontWeight: 700 }}>
                      {item.category?.name || 'General'} {item.subCategory && ` ➔ ${item.subCategory.name}`}
                    </span>

                    {/* Marital Status Badge */}
                    {item.maritalStatus && (
                      <span style={{
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        padding: '1px 7px',
                        borderRadius: '10px',
                        background: item.maritalStatus === 'married' ? 'rgba(236, 72, 153, 0.15)' : 'rgba(99, 102, 241, 0.15)',
                        color: item.maritalStatus === 'married' ? '#f472b6' : '#a5b4fc',
                        border: item.maritalStatus === 'married' ? '1px solid rgba(236, 72, 153, 0.3)' : '1px solid rgba(99, 102, 241, 0.3)',
                        textTransform: 'capitalize',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '3px'
                      }}>
                        <Heart size={10} /> {item.maritalStatus}
                      </span>
                    )}
                  </div>

                  {/* Title */}
                  <h3 style={{
                    fontSize: '1.02rem',
                    fontWeight: 700,
                    lineHeight: 1.35,
                    margin: '0 0 8px 0',
                    color: '#f8fafc',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}>
                    {item.title}
                  </h3>

                  {/* Age tags if present */}
                  {Array.isArray(item.age) && item.age.length > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap', marginBottom: '10px' }}>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted, #94a3b8)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <Calendar size={11} /> Age:
                      </span>
                      {item.age.slice(0, 4).map((a) => (
                        <span key={a} style={{
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          background: 'rgba(255, 255, 255, 0.08)',
                          color: '#e2e8f0',
                          padding: '1px 5px',
                          borderRadius: '4px'
                        }}>
                          {a}
                        </span>
                      ))}
                      {item.age.length > 4 && (
                        <span style={{ fontSize: '0.68rem', color: 'var(--text-muted, #94a3b8)' }}>
                          +{item.age.length - 4} more
                        </span>
                      )}
                    </div>
                  )}

                  {/* Content Tags Pills */}
                  {Array.isArray(item.tags) && item.tags.length > 0 && (
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '12px' }}>
                      {item.tags.slice(0, 3).map((tg) => (
                        <span
                          key={tg}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleTag(tg);
                          }}
                          style={{
                            fontSize: '0.7rem',
                            color: '#94a3b8',
                            background: 'rgba(255, 255, 255, 0.04)',
                            border: '1px solid rgba(255, 255, 255, 0.06)',
                            padding: '1px 6px',
                            borderRadius: '4px',
                            cursor: 'pointer'
                          }}
                        >
                          #{tg}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Footer Meta */}
                  <div style={{
                    marginTop: 'auto',
                    paddingTop: '10px',
                    borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                    fontSize: '0.78rem',
                    color: 'var(--text-dim, #64748b)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Eye size={12} /> {item.views || 0} views
                    </span>
                    <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px',
          marginTop: '40px'
        }}>
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              background: page <= 1 ? 'rgba(255, 255, 255, 0.02)' : 'rgba(255, 255, 255, 0.06)',
              color: page <= 1 ? '#475569' : '#fff',
              cursor: page <= 1 ? 'not-allowed' : 'pointer',
              fontSize: '0.88rem',
              fontWeight: 600
            }}
          >
            <ChevronLeft size={16} /> Previous
          </button>

          <span style={{ color: 'var(--text-muted, #94a3b8)', fontSize: '0.9rem', fontWeight: 600 }}>
            Page {page} of {totalPages}
          </span>

          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage(page + 1)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              background: page >= totalPages ? 'rgba(255, 255, 255, 0.02)' : 'rgba(255, 255, 255, 0.06)',
              color: page >= totalPages ? '#475569' : '#fff',
              cursor: page >= totalPages ? 'not-allowed' : 'pointer',
              fontSize: '0.88rem',
              fontWeight: 600
            }}
          >
            Next <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
};

export default AdvancedSearchPage;

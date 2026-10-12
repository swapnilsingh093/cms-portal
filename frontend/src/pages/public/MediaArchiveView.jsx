import React, { useState, useEffect } from 'react';
import SmartImage from '../../components/common/SmartImage';
import { videoAPI, galleryAPI, postAPI, categoryAPI } from '../../services/api';
import {
  Film,
  Image as ImageIcon,
  BookOpen,
  Play,
  Eye,
  Search,
  FolderTree
} from 'lucide-react';

const MediaArchiveView = ({ type, onNavigate, searchQuery = '' }) => {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [search, setSearch] = useState(searchQuery);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await categoryAPI.getAll();
        if (res.categories) setCategories(res.categories);
      } catch (e) {}
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchItems = async () => {
      setLoading(true);
      try {
        const params = {};
        if (selectedCategory) params.category = selectedCategory;
        if (search) params.search = search;

        if (type === 'videos') {
          const res = await videoAPI.getAll(params);
          if (res.videos) setItems(res.videos);
        } else if (type === 'galleries') {
          const res = await galleryAPI.getAll(params);
          if (res.galleries) setItems(res.galleries);
        } else if (type === 'posts') {
          const res = await postAPI.getAll(params);
          if (res.posts) setItems(res.posts);
        } else if (type === 'search') {
          // Combined search
          const [vidRes, galRes, postRes] = await Promise.all([
            videoAPI.getAll({ search }),
            galleryAPI.getAll({ search }),
            postAPI.getAll({ search })
          ]);
          const combined = [
            ...(vidRes.videos || []).map((v) => ({ ...v, itemType: 'video' })),
            ...(galRes.galleries || []).map((g) => ({ ...g, itemType: 'gallery' })),
            ...(postRes.posts || []).map((p) => ({ ...p, itemType: 'post' }))
          ];
          setItems(combined);
        }
      } catch (err) {
        console.error('Error fetching archive items:', err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
  }, [type, selectedCategory, search]);

  const getTitle = () => {
    if (type === 'videos') return 'Videos Archive';
    if (type === 'galleries') return 'Photo Galleries';
    if (type === 'posts') return 'Stories & Articles';
    return `Search Results for "${search}"`;
  };

  const getIcon = () => {
    if (type === 'videos') return <Film size={26} color="var(--accent-primary)" />;
    if (type === 'galleries') return <ImageIcon size={26} color="#a855f7" />;
    return <BookOpen size={26} color="#ec4899" />;
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '30px 24px 80px' }}>
      {/* Title & Filters */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '20px',
        marginBottom: '32px'
      }}>
        <div>
          <h1 style={{ fontSize: '2rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
            {getIcon()} {getTitle()}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            Showing {items.length} items
          </p>
        </div>

        {/* Filter controls */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <select
            className="form-select"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            style={{ width: 'auto', minWidth: '180px' }}
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c._id} value={c._id}>
                {c.parentCategory ? `↳ ${c.name}` : c.name}
              </option>
            ))}
          </select>

          <input
            type="text"
            placeholder="Filter title..."
            className="form-input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: '200px' }}
          />
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--text-dim)' }}>
          Loading items...
        </div>
      ) : items.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 20px' }}>
          <h3>No items found</h3>
          <p style={{ color: 'var(--text-muted)' }}>Try adjusting your search query or category filter.</p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))',
          gap: '24px'
        }}>
          {items.map((item) => {
            const actualType = item.itemType || (type === 'videos' ? 'video' : type === 'galleries' ? 'gallery' : 'post');
            const targetRoute = actualType === 'video' ? 'video' : actualType === 'gallery' ? 'gallery' : 'post';

            return (
              <div
                key={item._id}
                onClick={() => onNavigate(targetRoute, item.slug)}
                className="glass-panel"
                style={{ cursor: 'pointer', overflow: 'hidden' }}
              >
                <div style={{ position: 'relative', height: '180px', background: '#0a0d14' }}>
                  <SmartImage
                    src={item.poster || item.thumbnail || item.coverImage || item.featuredImage || 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600'}
                    alt={item.title}
                    style={{ width: '100%', height: '100%' }}
                  />
                  {actualType === 'video' && (
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: 'var(--accent-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Play size={18} fill="#fff" />
                      </div>
                    </div>
                  )}
                  {item.duration && (
                    <span style={{ position: 'absolute', bottom: '10px', right: '10px', background: 'rgba(0,0,0,0.8)', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700 }}>
                      {item.duration}
                    </span>
                  )}
                </div>

                <div style={{ padding: '16px' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--accent-primary)', marginBottom: '6px', fontWeight: 600 }}>
                    {item.category?.name || 'Category'} {item.subCategory && ` ➔ ${item.subCategory?.name}`}
                  </div>
                  <h3 style={{ fontSize: '1.05rem', lineHeight: 1.3, marginBottom: '6px' }}>
                    {item.title}
                  </h3>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', display: 'flex', justifyContent: 'space-between' }}>
                    <span><Eye size={12} /> {item.views || 0} views</span>
                    <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MediaArchiveView;

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import SmartImage from '../../components/common/SmartImage';
import { categoryAPI, videoAPI, galleryAPI, postAPI } from '../../services/api';
import { stripHtml } from '../../utils/textHelper';
import {
  FolderTree,
  ChevronRight,
  Film,
  Image as ImageIcon,
  BookOpen,
  Play,
  Eye,
  Filter
} from 'lucide-react';

const CategoryView = ({ slug: propSlug, onNavigate }) => {
  const { slug: paramSlug } = useParams();
  const slug = propSlug || paramSlug;
  const navigate = useNavigate();
  const [category, setCategory] = useState(null);
  const [subCategories, setSubCategories] = useState([]);
  const [activeSubCatId, setActiveSubCatId] = useState(null);
  const [contentType, setContentType] = useState('all'); // 'all' | 'video' | 'gallery' | 'post'

  const [videos, setVideos] = useState([]);
  const [galleries, setGalleries] = useState([]);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load category details and sub-categories
  useEffect(() => {
    const fetchCategoryData = async () => {
      setLoading(true);
      try {
        const res = await categoryAPI.getBySlug(slug);
        if (res.category) {
          setCategory(res.category);
          setSubCategories(res.category.subCategories || []);
          setActiveSubCatId(null); // default to root view
        }
      } catch (err) {
        console.error('Error fetching category:', err.message);
      }
    };

    fetchCategoryData();
  }, [slug]);

  // Load content whenever category or activeSubCatId changes
  useEffect(() => {
    if (!category) return;

    const fetchContent = async () => {
      try {
        const filterParams = activeSubCatId
          ? { subCategory: activeSubCatId }
          : { category: category._id };

        const [vidRes, galRes, postRes] = await Promise.all([
          videoAPI.getAll(filterParams),
          galleryAPI.getAll(filterParams),
          postAPI.getAll(filterParams)
        ]);

        if (vidRes.videos) setVideos(vidRes.videos);
        if (galRes.galleries) setGalleries(galRes.galleries);
        if (postRes.posts) setPosts(postRes.posts);
      } catch (err) {
        console.error('Error loading category content:', err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, [category, activeSubCatId]);

  if (loading && !category) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 20px', color: 'var(--text-dim)' }}>
        Loading category details...
      </div>
    );
  }

  if (!category) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 20px' }}>
        <h2>Category Not Found</h2>
        <button onClick={() => onNavigate('home')} className="btn-primary" style={{ marginTop: '20px' }}>
          Back to Home
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '20px 24px 80px' }}>
      {/* Category Banner & Header */}
      <div style={{
        position: 'relative',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        height: '300px',
        marginBottom: '36px',
        border: '1px solid var(--border-color)',
        boxShadow: 'var(--shadow-md)'
      }}>
        <SmartImage
          src={category.banner || category.thumbnail || 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=1400'}
          alt={category.name}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: (() => {
              const pos = category.bannerPosition;
              if (!pos || pos === 'center' || pos === 'middle') return 'center center';
              if (pos === 'top') return 'center top';
              if (pos === 'bottom' || pos === 'lower') return 'center bottom';
              const clean = String(pos).trim();
              if (clean.endsWith('%') || !isNaN(clean)) {
                return `center ${clean.replace('%', '')}%`;
              }
              return pos;
            })()
          }}
        />
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(to top, rgba(10, 13, 20, 0.95) 0%, rgba(10, 13, 20, 0.4) 60%, transparent 100%)',
          padding: '36px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end'
        }}>
          {/* Breadcrumb Hierarchy */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.85rem',
            color: 'var(--text-muted)',
            marginBottom: '8px'
          }}>
            <span onClick={() => onNavigate('home')} style={{ cursor: 'pointer' }}>Home</span>
            <ChevronRight size={14} />
            {category.parentCategory && (
              <>
                <span
                  onClick={() => onNavigate('category', category.parentCategory.slug)}
                  style={{ cursor: 'pointer', color: 'var(--accent-primary)' }}
                >
                  {category.parentCategory.name}
                </span>
                <ChevronRight size={14} />
              </>
            )}
            <span style={{ color: '#fff', fontWeight: 600 }}>{category.name}</span>
          </div>

          <h1 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', marginBottom: '8px' }}>
            {category.name}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1rem', maxWidth: '700px' }}>
            {stripHtml(category.description) || 'Browse videos, photo galleries, and stories in this category.'}
          </p>
        </div>
      </div>

      {/* Sub-Categories Pill Tabs (e.g. Uncle, Festivals under Indian) */}
      {subCategories.length > 0 && (
        <div style={{ marginBottom: '32px' }}>
          <div style={{
            fontSize: '0.82rem',
            fontWeight: 700,
            color: 'var(--text-dim)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginBottom: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <FolderTree size={16} color="var(--accent-primary)" />
            Sub-Categories under {category.name}:
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            <button
              onClick={() => setActiveSubCatId(null)}
              className={!activeSubCatId ? 'btn-primary' : 'btn-secondary'}
              style={{ borderRadius: 'var(--radius-full)', padding: '8px 18px', fontSize: '0.88rem' }}
            >
              All in {category.name}
            </button>

            {subCategories.map((sub) => (
              <button
                key={sub._id}
                onClick={() => setActiveSubCatId(sub._id)}
                className={activeSubCatId === sub._id ? 'btn-primary' : 'btn-secondary'}
                style={{ borderRadius: 'var(--radius-full)', padding: '8px 18px', fontSize: '0.88rem', gap: '6px' }}
              >
                <span>↳ {sub.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Content Type Filter Tabs */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        marginBottom: '28px',
        borderBottom: '1px solid var(--border-color)',
        paddingBottom: '16px'
      }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setContentType('all')}
            style={{
              background: contentType === 'all' ? 'var(--g-accent, rgba(99, 102, 241, 0.15))' : 'none',
              color: contentType === 'all' ? 'var(--accent-primary)' : 'var(--text-muted)',
              border: contentType === 'all' ? '1px solid var(--accent-primary)' : 'none',
              padding: '6px 14px',
              borderRadius: 'var(--radius-sm)',
              fontWeight: 600,
              fontSize: '0.88rem'
            }}
          >
            All Content
          </button>
          <button
            onClick={() => setContentType('video')}
            style={{
              background: contentType === 'video' ? 'var(--g-accent, rgba(99, 102, 241, 0.15))' : 'none',
              color: contentType === 'video' ? 'var(--accent-primary)' : 'var(--text-muted)',
              border: contentType === 'video' ? '1px solid var(--accent-primary)' : 'none',
              padding: '6px 14px',
              borderRadius: 'var(--radius-sm)',
              fontWeight: 600,
              fontSize: '0.88rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Film size={15} /> Videos ({videos.length})
          </button>
          <button
            onClick={() => setContentType('gallery')}
            style={{
              background: contentType === 'gallery' ? 'var(--g-accent, rgba(99, 102, 241, 0.15))' : 'none',
              color: contentType === 'gallery' ? 'var(--accent-primary)' : 'var(--text-muted)',
              border: contentType === 'gallery' ? '1px solid var(--accent-primary)' : 'none',
              padding: '6px 14px',
              borderRadius: 'var(--radius-sm)',
              fontWeight: 600,
              fontSize: '0.88rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <ImageIcon size={15} /> Galleries ({galleries.length})
          </button>
          <button
            onClick={() => setContentType('post')}
            style={{
              background: contentType === 'post' ? 'var(--g-accent, rgba(99, 102, 241, 0.15))' : 'none',
              color: contentType === 'post' ? 'var(--accent-primary)' : 'var(--text-muted)',
              border: contentType === 'post' ? '1px solid var(--accent-primary)' : 'none',
              padding: '6px 14px',
              borderRadius: 'var(--radius-sm)',
              fontWeight: 600,
              fontSize: '0.88rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <BookOpen size={15} /> Stories ({posts.length})
          </button>
        </div>

        <div style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>
          Showing items in: <strong>{activeSubCatId ? subCategories.find((s) => s._id === activeSubCatId)?.name : category.name}</strong>
        </div>
      </div>

      {/* Videos Section */}
      {(contentType === 'all' || contentType === 'video') && videos.length > 0 && (
        <section style={{ marginBottom: '40px' }}>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Film size={20} color="var(--accent-primary)" /> Videos ({videos.length})
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
            {videos.map((vid) => (
              <div
                key={vid._id}
                onClick={() => onNavigate('video', vid.slug)}
                className="glass-panel"
                style={{ cursor: 'pointer', overflow: 'hidden' }}
              >
                <div style={{ position: 'relative', height: '170px', background: '#000' }}>
                  <SmartImage src={vid.poster || vid.thumbnail} alt={vid.title} style={{ width: '100%', height: '100%' }} />
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: 'var(--accent-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Play size={18} fill="#fff" />
                    </div>
                  </div>
                </div>
                <div style={{ padding: '14px' }}>
                  <h4 style={{ fontSize: '0.98rem', marginBottom: '6px' }}>{vid.title}</h4>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}><Eye size={12} /> {vid.views} views</div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Galleries Section */}
      {(contentType === 'all' || contentType === 'gallery') && galleries.length > 0 && (
        <section style={{ marginBottom: '40px' }}>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ImageIcon size={20} color="#a855f7" /> Photo Galleries ({galleries.length})
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
            {galleries.map((gal) => (
              <div
                key={gal._id}
                onClick={() => onNavigate('gallery', gal.slug)}
                className="glass-panel"
                style={{ cursor: 'pointer', overflow: 'hidden' }}
              >
                <div style={{ height: '170px' }}>
                  <SmartImage src={gal.coverImage || gal.images?.[0]?.url} alt={gal.title} style={{ width: '100%', height: '100%' }} />
                </div>
                <div style={{ padding: '14px' }}>
                  <h4 style={{ fontSize: '0.98rem', marginBottom: '4px' }}>{gal.title}</h4>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>{gal.images?.length || 0} Photos</div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Stories Section */}
      {(contentType === 'all' || contentType === 'post') && posts.length > 0 && (
        <section style={{ marginBottom: '40px' }}>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BookOpen size={20} color="#ec4899" /> Stories ({posts.length})
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
            {posts.map((post) => (
              <div
                key={post._id}
                onClick={() => onNavigate('post', post.slug)}
                className="glass-panel"
                style={{ cursor: 'pointer', overflow: 'hidden' }}
              >
                <div style={{ height: '160px' }}>
                  <SmartImage src={post.featuredImage} alt={post.title} style={{ width: '100%', height: '100%' }} />
                </div>
                <div style={{ padding: '14px' }}>
                  <h4 style={{ fontSize: '0.98rem', marginBottom: '6px' }}>{post.title}</h4>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{stripHtml(post.excerpt)}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Empty State */}
      {videos.length === 0 && galleries.length === 0 && posts.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-dim)' }}>
          <h3>No Content Found in this Category</h3>
          <p style={{ color: 'var(--text-muted)', marginTop: '8px' }}>
            No videos, photo galleries, or stories have been added here yet.
          </p>
        </div>
      )}
    </div>
  );
};

export default CategoryView;

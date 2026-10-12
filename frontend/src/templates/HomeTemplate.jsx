import React, { useState, useEffect } from 'react';
import { videoAPI, galleryAPI, postAPI, categoryAPI } from '../services/api';
import HeroSlider from '../components/home/HeroSlider';
import VideoSection from '../components/home/VideoSection';
import GallerySection from '../components/home/GallerySection';
import LatestPostsSection from '../components/home/LatestPostsSection';
import MembershipSection from '../components/home/MembershipSection';
import PublicVideoModal from '../components/public/PublicVideoModal';
import { Loader2 } from 'lucide-react';

const HomeTemplate = ({ pageData }) => {
  const [loading, setLoading] = useState(true);
  const [slides, setSlides] = useState([]);
  const [latestVideo, setLatestVideo] = useState(null);
  const [latestGallery, setLatestGallery] = useState(null);
  const [posts, setPosts] = useState([]);
  const [videoCategories, setVideoCategories] = useState([]);
  const [galleryCategories, setGalleryCategories] = useState([]);
  const [selectedVideoModal, setSelectedVideoModal] = useState(null);

  const config = pageData?.templateConfig || {};

  useEffect(() => {
    const fetchDynamicContent = async () => {
      setLoading(true);
      try {
        const [postsRes, videosRes, galleriesRes, vidCatsRes, galCatsRes] = await Promise.all([
          postAPI.getAll({ limit: config.postsSection?.count || 3, status: 'published' }).catch(() => ({ posts: [] })),
          videoAPI.getAll({ limit: 6, status: 'published' }).catch(() => ({ videos: [] })),
          galleryAPI.getAll({ limit: 6, status: 'published' }).catch(() => ({ galleries: [] })),
          categoryAPI.getAll({ type: 'video' }).catch(() => ({ categories: [] })),
          categoryAPI.getAll({ type: 'gallery' }).catch(() => ({ categories: [] }))
        ]);

        const fetchedPosts = postsRes.posts || [];
        const fetchedVideos = videosRes.videos || [];
        const fetchedGalleries = galleriesRes.galleries || [];

        setPosts(fetchedPosts);
        if (fetchedVideos.length > 0) setLatestVideo(fetchedVideos[0]);
        if (fetchedGalleries.length > 0) setLatestGallery(fetchedGalleries[0]);

        // If specific categories returned empty, fallback to all categories
        let vCats = vidCatsRes.categories || [];
        let gCats = galCatsRes.categories || [];
        if (vCats.length === 0 || gCats.length === 0) {
          const allCatsRes = await categoryAPI.getAll().catch(() => ({ categories: [] }));
          const allCats = allCatsRes.categories || [];
          if (vCats.length === 0) vCats = allCats.filter(c => c.type === 'video' || c.type === 'all');
          if (gCats.length === 0) gCats = allCats.filter(c => c.type === 'gallery' || c.type === 'all');
          // If still empty, use whatever categories exist
          if (vCats.length === 0) vCats = allCats;
          if (gCats.length === 0) gCats = allCats;
        }

        // Strictly keep ONLY parent categories (no subcategories)
        vCats = vCats.filter(c => !c.parentCategory);
        gCats = gCats.filter(c => !c.parentCategory);

        setVideoCategories(vCats);
        setGalleryCategories(gCats);

        // Strictly 3 Hero Slides: 1 Video, 1 Post (Story), and 1 Gallery
        // When any item is marked featured, it replaces ONLY its respective type slot!
        const featuredVideo = pageData?.featuredHomeBanners?.featuredVideo || fetchedVideos.find(v => v.featuredOnHomeBanner) || null;
        const featuredPost = pageData?.featuredHomeBanners?.featuredPost || fetchedPosts.find(p => p.featuredOnHomeBanner) || null;
        const featuredGallery = pageData?.featuredHomeBanners?.featuredGallery || fetchedGalleries.find(g => g.featuredOnHomeBanner) || null;

        const targetVideo = featuredVideo || fetchedVideos[0] || null;
        const targetPost = featuredPost || fetchedPosts[0] || null;
        const targetGallery = featuredGallery || fetchedGalleries[0] || null;

        const heroSlides = [];

        // Slot 1: Video (Featured video or latest video)
        if (targetVideo) {
          heroSlides.push({
            id: (targetVideo.featuredOnHomeBanner ? 'featured-vid-' : 'vid-') + targetVideo._id,
            type: 'video',
            title: targetVideo.title,
            description: targetVideo.description || targetVideo.shortDescription || 'Watch our newest featured video stream in high definition.',
            image: targetVideo.poster || targetVideo.banner || targetVideo.thumbnail,
            url: `/video/${targetVideo.slug}`,
            buttonText: 'Watch Video',
            isFeatured: Boolean(targetVideo.featuredOnHomeBanner)
          });
        }

        // Slot 2: Post / Story (Featured story or latest story)
        if (targetPost) {
          const stripped = targetPost.excerpt || (targetPost.content ? targetPost.content.replace(/<[^>]*>?/gm, '').slice(0, 140) + '...' : '');
          heroSlides.push({
            id: (targetPost.featuredOnHomeBanner ? 'featured-post-' : 'post-') + targetPost._id,
            type: 'post',
            title: targetPost.title,
            description: stripped || 'Read our featured story in full detail.',
            image: targetPost.featuredImage || targetPost.banner,
            url: `/post/${targetPost.slug}`,
            buttonText: 'Read Story',
            isFeatured: Boolean(targetPost.featuredOnHomeBanner)
          });
        }

        // Slot 3: Gallery (Featured gallery or latest gallery)
        if (targetGallery) {
          heroSlides.push({
            id: (targetGallery.featuredOnHomeBanner ? 'featured-gal-' : 'gal-') + targetGallery._id,
            type: 'gallery',
            title: targetGallery.title,
            description: targetGallery.description || targetGallery.shortDescription || 'Explore our high-resolution photo collection.',
            image: targetGallery.coverImage || targetGallery.banner || (targetGallery.images && targetGallery.images[0]?.url),
            url: `/gallery/${targetGallery.slug}`,
            buttonText: 'View Gallery',
            isFeatured: Boolean(targetGallery.featuredOnHomeBanner)
          });
        }

        setSlides(heroSlides);
      } catch (err) {
        console.error('Error loading home dynamic content:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDynamicContent();
  }, [
    config.heroSlider?.slideCount,
    config.heroSlider?.enabled,
    config.postsSection?.count,
    pageData
  ]);

  if (loading) {
    return (
      <div
        style={{
          minHeight: '60vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '14px',
          color: 'var(--text-muted, #94a3b8)'
        }}
      >
        <Loader2 size={32} className="spin" color="#6366f1" />
        <span style={{ fontSize: '0.95rem' }}>Loading dynamic homepage...</span>
      </div>
    );
  }

  return (
    <div className="home-page-root" style={{ width: '100%' }}>
      {/* 1. Full-Width Animated Hero Slider - Edge to Edge, No Container */}
      <HeroSlider
        slides={slides}
        enabled={config.heroSlider?.enabled !== false}
        height={config.heroSlider?.height || '90vh'}
        titleFontSize={config.heroSlider?.titleFontSize || '3rem'}
        alignment={config.heroSlider?.alignment || 'left'}
      />

      {/* Main Content Sections Container */}
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 24px 80px' }}>
        {/* 2. Video Section (Latest Video + 2 Configured Video Categories) */}
        <VideoSection
          config={config.videoSection}
          latestVideo={latestVideo}
          categories={videoCategories}
          onPlayVideo={setSelectedVideoModal}
        />

        {/* 3. Gallery Section (Latest Gallery + 2 Configured Gallery Categories) */}
        <GallerySection
          config={config.gallerySection}
          latestGallery={latestGallery}
          categories={galleryCategories}
        />

        {/* 4. Latest Posts / Stories (3 Columns) */}
        <LatestPostsSection
          config={config.postsSection}
          posts={posts}
        />

        {/* 5. Membership Promotional Section (Configurable Copy + Media Image) */}
        <MembershipSection
          config={config.membershipSection}
        />
      </div>

      {/* Quick Video Popup Modal */}
      <PublicVideoModal
        isOpen={Boolean(selectedVideoModal)}
        onClose={() => setSelectedVideoModal(null)}
        video={selectedVideoModal}
      />
    </div>
  );
};

export default HomeTemplate;

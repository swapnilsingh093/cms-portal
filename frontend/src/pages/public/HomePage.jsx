import React, { useState, useEffect } from 'react';
import { pageAPI } from '../../services/api';
import HomeTemplate from '../../templates/HomeTemplate';
import PageLoader from '../../components/common/PageLoader';

const HomePage = () => {
  const [page, setPage] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHomePageData = async () => {
      setLoading(true);
      try {
        const res = await pageAPI.getHomeTemplate();
        if (res.page) {
          setPage({
            ...res.page,
            featuredHomeBanner: res.featuredHomeBanner,
            featuredHomeBanners: res.featuredHomeBanners
          });
        }
      } catch (err) {
        console.error('Home template load error:', err.message);
        // Fallback default structure
        setPage({
          title: 'Home',
          slug: 'home',
          template: 'home',
          status: 'published',
          templateConfig: {
            heroSlider: { enabled: true, mode: 'dynamic', slideCount: 5 },
            videoSection: { enabled: true, title: 'Trending & Latest Videos' },
            gallerySection: { enabled: true, title: 'Featured Photo Galleries' },
            postsSection: { enabled: true, title: 'Latest Stories & Articles', count: 3 },
            membershipSection: { enabled: true }
          }
        });
      } finally {
        setLoading(false);
      }
    };

    fetchHomePageData();
  }, []);

  if (loading) {
    return <PageLoader text="Loading AgniPlay homepage..." />;
  }

  return <HomeTemplate pageData={page} />;
};

export default HomePage;

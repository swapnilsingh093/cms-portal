import React, { useState, useEffect } from 'react';
import { pageAPI } from '../../services/api';
import SearchByVideoTemplate from '../../templates/SearchByVideoTemplate';
import { Loader2 } from 'lucide-react';

const SearchByVideoPage = () => {
  const [page, setPage] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPageData = async () => {
      try {
        let res = await pageAPI.getBySlug('search');
        if (!res?.page) {
          res = await pageAPI.getBySlug('search-by-video');
        }
        if (res?.page) {
          setPage(res.page);
        } else {
          setPage({
            title: 'Search by Videos',
            slug: 'search',
            template: 'search-by-video',
            templateConfig: {
              bannerType: 'video',
              bannerUrl: '/uploads/videos/16.mp4',
              overlayStrength: 40,
              heading: 'Search by Video',
              subheading: 'Find your favorite desi videos by choice, age, or marital status',
              headingColor: '#ffffff',
              subheadingColor: 'rgba(255, 255, 255, 0.8)',
              accentColor: '#f2545f',
              headingFontSize: '2.5rem',
              subheadingFontSize: '1.1rem',
              alignment: 'center'
            }
          });
        }
      } catch (err) {
        console.warn('Using default Search by Video page config:', err.message);
        // Fallback default page object
        setPage({
          title: 'Search by Videos',
          slug: 'search',
          template: 'search-by-video',
          templateConfig: {
            bannerType: 'video',
            bannerUrl: '/uploads/videos/16.mp4',
            overlayStrength: 40,
            heading: 'Search by Video',
            subheading: 'Find your favorite desi videos by choice, age, or marital status',
            headingColor: '#ffffff',
            subheadingColor: 'rgba(255, 255, 255, 0.8)',
            accentColor: '#f2545f',
            headingFontSize: '2.5rem',
            subheadingFontSize: '1.1rem',
            alignment: 'center'
          }
        });
      } finally {
        setLoading(false);
      }
    };

    fetchPageData();
  }, []);

  if (loading) {
    return (
      <div
        style={{
          minHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px',
          color: '#94a3b8',
          background: '#0a0a0c'
        }}
      >
        <Loader2 size={36} className="spin" color="#f2545f" />
        <span style={{ fontSize: '15px' }}>Loading Search by Video...</span>
      </div>
    );
  }

  return <SearchByVideoTemplate pageData={page} />;
};

export default SearchByVideoPage;

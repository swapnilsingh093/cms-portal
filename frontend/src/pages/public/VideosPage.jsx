import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { pageAPI } from '../../services/api';
import VideosTemplate from '../../templates/VideosTemplate';
import MediaArchiveView from './MediaArchiveView';
import { Loader2 } from 'lucide-react';
import PageLoader from '../../components/common/PageLoader';

const VideosPage = () => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const hasFilter = searchParams.has('category') || searchParams.has('search');

  const [page, setPage] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // If user filtered by category or search term on /videos, show archive view
    if (hasFilter) {
      setLoading(false);
      return;
    }

    const fetchVideosPage = async () => {
      setLoading(true);
      try {
        const res = await pageAPI.getVideosTemplate();
        if (res.page) {
          setPage(res.page);
        }
      } catch (err) {
        console.error('Error fetching videos template:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchVideosPage();
  }, [hasFilter]);

  if (hasFilter) {
    return <MediaArchiveView type="video" />;
  }

  if (loading) {
    return <PageLoader text="Loading Videos..." />;
  }

  return <VideosTemplate pageData={page} />;
};

export default VideosPage;

import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { pageAPI } from "../../services/api";
import StoriesTemplate from "../../templates/StoriesTemplate";
import MediaArchiveView from "./MediaArchiveView";
import PageLoader from "../../components/common/PageLoader";

const StoriesPage = () => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const hasFilter = searchParams.has("category") || searchParams.has("search");

  const [page, setPage] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (hasFilter) {
      setLoading(false);
      return;
    }

    const fetchStoriesPage = async () => {
      setLoading(true);
      try {
        const res = await pageAPI.getStoriesTemplate();
        if (res.page) {
          setPage(res.page);
        }
      } catch (err) {
        console.error("Error fetching stories template:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStoriesPage();
  }, [hasFilter]);

  if (hasFilter) {
    return <MediaArchiveView type="post" />;
  }

  if (loading) {
    return <PageLoader text="Loading stories..." accentColor="#ea580c" />;
  }

  return <StoriesTemplate pageData={page} />;
};

export default StoriesPage;

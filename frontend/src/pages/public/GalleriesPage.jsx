import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { pageAPI } from "../../services/api";
import GalleriesTemplate from "../../templates/GalleriesTemplate";
import MediaArchiveView from "./MediaArchiveView";
import PageLoader from "../../components/common/PageLoader";

const GalleriesPage = () => {
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

    const fetchGalleriesPage = async () => {
      setLoading(true);
      try {
        const res = await pageAPI.getGalleriesTemplate();
        if (res.page) {
          setPage(res.page);
        }
      } catch (err) {
        console.error("Error fetching galleries template:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchGalleriesPage();
  }, [hasFilter]);

  if (hasFilter) {
    return <MediaArchiveView type="gallery" />;
  }

  if (loading) {
    return <PageLoader text="Loading Photo Galleries..." />;
  }

  return <GalleriesTemplate pageData={page} />;
};

export default GalleriesPage;

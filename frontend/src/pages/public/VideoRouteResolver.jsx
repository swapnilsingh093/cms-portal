import React, { useState, useEffect } from "react";
import { useParams, useLocation } from "react-router-dom";
import { videoAPI, categoryAPI } from "../../services/api";
import VideoDetail from "./VideoDetail";
import VideoSubcategoryPage from "./VideoSubcategoryPage";
import VideoParentCategoryPage from "./VideoParentCategoryPage";
import NotFoundPage from "./NotFoundPage";
import PageLoader from "../../components/common/PageLoader";

/**
 * VideoRouteResolver
 * Resolves dynamic 1, 2, and 3 segment routes for the Videos module without route collisions.
 */
const VideoRouteResolver = () => {
  const { p1, p2, p3 } = useParams();
  const location = useLocation();

  const [resolution, setResolution] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const resolve = async () => {
      setLoading(true);

      // --- Scenario A: 3 segments (/videos/:p1/:p2/:p3) ---
      if (p1 && p2 && p3) {
        try {
          const [vidRes, catRes] = await Promise.all([
            videoAPI.getBySlug(p3).catch(() => null),
            categoryAPI.getBySlug(p3, { type: 'video' }).catch(() => null)
          ]);

          if (!isMounted) return;

          const videoItem = vidRes?.video || (vidRes?._id ? vidRes : null);
          const categoryItem = catRes?.category;

          if (videoItem) {
            const isCategoryChildOfP2 = categoryItem && (
              categoryItem.parentCategory?.slug === p2 ||
              String(categoryItem.parentCategory?._id || categoryItem.parentCategory) === p2
            );

            if (isCategoryChildOfP2 && !videoItem.subCategory) {
              setResolution({
                type: "subcategory",
                grandParentSlug: p1,
                parentCategorySlug: p2,
                subcategorySlug: p3
              });
            } else {
              setResolution({
                type: "video",
                slug: p3,
                parentCategorySlug: p1,
                subcategorySlug: p2
              });
            }
          } else if (categoryItem) {
            setResolution({
              type: "subcategory",
              grandParentSlug: p1,
              parentCategorySlug: p2,
              subcategorySlug: p3
            });
          } else {
            setResolution({ type: "video", slug: p3 });
          }
        } catch {
          if (isMounted) setResolution({ type: "video", slug: p3 });
        } finally {
          if (isMounted) setLoading(false);
        }
        return;
      }

      // --- Scenario B: 2 segments (/videos/:p1/:p2) ---
      if (p1 && p2 && !p3) {
        try {
          const [vidRes, catRes] = await Promise.all([
            videoAPI.getBySlug(p2).catch(() => null),
            categoryAPI.getBySlug(p2, { type: 'video' }).catch(() => null)
          ]);

          if (!isMounted) return;

          const videoItem = vidRes?.video || (vidRes?._id ? vidRes : null);
          const categoryItem = catRes?.category;

          const isCategoryChildOfP1 = categoryItem && (
            categoryItem.parentCategory?.slug === p1 ||
            String(categoryItem.parentCategory?._id || categoryItem.parentCategory) === p1
          );

          if (isCategoryChildOfP1) {
            setResolution({
              type: "subcategory",
              parentCategorySlug: p1,
              subcategorySlug: p2
            });
          } else if (videoItem) {
            setResolution({
              type: "video",
              slug: p2,
              parentCategorySlug: p1
            });
          } else if (categoryItem) {
            setResolution({
              type: "subcategory",
              parentCategorySlug: p1,
              subcategorySlug: p2
            });
          } else {
            setResolution({ type: "video", slug: p2 });
          }
        } catch {
          if (isMounted) setResolution({ type: "video", slug: p2 });
        } finally {
          if (isMounted) setLoading(false);
        }
        return;
      }

      // --- Scenario C: 1 segment (/videos/:p1) ---
      if (p1 && !p2 && !p3) {
        try {
          const [vidRes, catRes] = await Promise.all([
            videoAPI.getBySlug(p1).catch(() => null),
            categoryAPI.getBySlug(p1, { type: 'video' }).catch(() => null)
          ]);

          if (!isMounted) return;

          const videoItem = vidRes?.video || (vidRes?._id ? vidRes : null);
          const categoryItem = catRes?.category;

          if (categoryItem) {
            setResolution({
              type: "parentCategory",
              categorySlug: p1
            });
          } else if (videoItem) {
            setResolution({
              type: "video",
              slug: p1
            });
          } else {
            setResolution({ type: "notfound" });
          }
        } catch {
          if (isMounted) setResolution({ type: "notfound" });
        } finally {
          if (isMounted) setLoading(false);
        }
        return;
      }

      setLoading(false);
      setResolution({ type: "notfound" });
    };

    resolve();
    return () => {
      isMounted = false;
    };
  }, [p1, p2, p3, location.pathname]);

  if (loading) {
    return <PageLoader text="Loading content..." />;
  }

  if (resolution?.type === "video") {
    return (
      <VideoDetail
        slug={resolution.slug}
        parentCategorySlug={resolution.parentCategorySlug}
        subcategorySlug={resolution.subcategorySlug}
      />
    );
  }

  if (resolution?.type === "subcategory") {
    return (
      <VideoSubcategoryPage
        grandParentSlug={resolution.grandParentSlug}
        parentCategorySlug={resolution.parentCategorySlug}
        subcategorySlug={resolution.subcategorySlug}
      />
    );
  }

  if (resolution?.type === "parentCategory") {
    return <VideoParentCategoryPage categorySlug={resolution.categorySlug} />;
  }

  return <NotFoundPage />;
};

export default VideoRouteResolver;

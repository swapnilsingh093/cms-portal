import React, { useState, useEffect } from "react";
import { useParams, useLocation } from "react-router-dom";
import { galleryAPI, categoryAPI } from "../../services/api";
import GalleryDetail from "./GalleryDetail";
import GallerySubcategoryPage from "./GallerySubcategoryPage";
import GalleryParentCategoryPage from "./GalleryParentCategoryPage";
import NotFoundPage from "./NotFoundPage";
import PageLoader from "../../components/common/PageLoader";

/**
 * GalleryRouteResolver
 * Resolves dynamic 1, 2, and 3 segment routes for the Galleries module without route collisions.
 * 
 * Routes handled:
 * - 3 segments: /galleries/:p1/:p2/:p3
 *     Checks whether :p3 is an assigned Gallery post OR a 3. Level Child Category.
 *     If :p3 is a Gallery post -> renders GalleryDetail.
 *     If :p3 is a Category archive -> renders GallerySubcategoryPage (Level 3 Child Category view).
 * 
 * - 2 segments: /galleries/:p1/:p2
 *     Checks whether :p2 is a Subcategory archive OR a Gallery post directly under Parent Category.
 * 
 * - 1 segment: /galleries/:p1
 *     Checks whether :p1 is a Parent Category archive OR a direct Gallery post.
 */
const GalleryRouteResolver = () => {
  const { p1, p2, p3 } = useParams();
  const location = useLocation();

  const [resolution, setResolution] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const resolve = async () => {
      setLoading(true);

      // --- Scenario A: 3 segments (/galleries/:p1/:p2/:p3) ---
      if (p1 && p2 && p3) {
        try {
          const [galRes, catRes] = await Promise.all([
            galleryAPI.getBySlug(p3).catch(() => null),
            categoryAPI.getBySlug(p3, { type: 'gallery' }).catch(() => null)
          ]);

          if (!isMounted) return;

          const galleryItem = galRes?.gallery || (galRes?._id ? galRes : null);
          const categoryItem = catRes?.category;

          // If gallery item exists with slug p3
          if (galleryItem) {
            // Check if categoryItem is a true child category of p2
            const isCategoryChildOfP2 = categoryItem && (
              categoryItem.parentCategory?.slug === p2 ||
              String(categoryItem.parentCategory?._id || categoryItem.parentCategory) === p2
            );

            // If a category exists under p2 with this slug AND gallery is NOT assigned to p2,
            // it's a category archive. Otherwise, it is the assigned gallery post.
            if (isCategoryChildOfP2 && !galleryItem.subCategory) {
              setResolution({
                type: "subcategory",
                grandParentSlug: p1,
                parentCategorySlug: p2,
                subcategorySlug: p3
              });
            } else {
              setResolution({
                type: "gallery",
                slug: p3,
                parentCategorySlug: p1,
                subcategorySlug: p2
              });
            }
          } else if (categoryItem) {
            // Category archive: 3. Level Category
            setResolution({
              type: "subcategory",
              grandParentSlug: p1,
              parentCategorySlug: p2,
              subcategorySlug: p3
            });
          } else {
            // Fallback: check if p3 is direct gallery
            setResolution({ type: "gallery", slug: p3 });
          }
        } catch {
          if (isMounted) setResolution({ type: "gallery", slug: p3 });
        } finally {
          if (isMounted) setLoading(false);
        }
        return;
      }

      // --- Scenario B: 2 segments (/galleries/:p1/:p2) ---
      if (p1 && p2 && !p3) {
        try {
          const [galRes, catRes] = await Promise.all([
            galleryAPI.getBySlug(p2).catch(() => null),
            categoryAPI.getBySlug(p2, { type: 'gallery' }).catch(() => null)
          ]);

          if (!isMounted) return;

          const galleryItem = galRes?.gallery || (galRes?._id ? galRes : null);
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
          } else if (galleryItem) {
            setResolution({
              type: "gallery",
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
            setResolution({ type: "gallery", slug: p2 });
          }
        } catch {
          if (isMounted) setResolution({ type: "gallery", slug: p2 });
        } finally {
          if (isMounted) setLoading(false);
        }
        return;
      }

      // --- Scenario C: 1 segment (/galleries/:p1) ---
      if (p1 && !p2 && !p3) {
        try {
          const [galRes, catRes] = await Promise.all([
            galleryAPI.getBySlug(p1).catch(() => null),
            categoryAPI.getBySlug(p1, { type: 'gallery' }).catch(() => null)
          ]);

          if (!isMounted) return;

          const galleryItem = galRes?.gallery || (galRes?._id ? galRes : null);
          const categoryItem = catRes?.category;

          if (categoryItem) {
            setResolution({
              type: "parentCategory",
              categorySlug: p1
            });
          } else if (galleryItem) {
            setResolution({
              type: "gallery",
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

  if (resolution?.type === "gallery") {
    return (
      <GalleryDetail
        slug={resolution.slug}
        parentCategorySlug={resolution.parentCategorySlug}
        subcategorySlug={resolution.subcategorySlug}
      />
    );
  }

  if (resolution?.type === "subcategory") {
    return (
      <GallerySubcategoryPage
        grandParentSlug={resolution.grandParentSlug}
        parentCategorySlug={resolution.parentCategorySlug}
        subcategorySlug={resolution.subcategorySlug}
      />
    );
  }

  if (resolution?.type === "parentCategory") {
    return <GalleryParentCategoryPage categorySlug={resolution.categorySlug} />;
  }

  return <NotFoundPage />;
};

export default GalleryRouteResolver;

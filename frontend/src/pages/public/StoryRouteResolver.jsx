import React, { useState, useEffect } from "react";
import { useParams, useLocation } from "react-router-dom";
import { postAPI, categoryAPI } from "../../services/api";
import PostDetail from "./PostDetail";
import StorySubcategoryPage from "./StorySubcategoryPage";
import StoryParentCategoryPage from "./StoryParentCategoryPage";
import NotFoundPage from "./NotFoundPage";
import PageLoader from "../../components/common/PageLoader";

/**
 * StoryRouteResolver
 * Resolves dynamic 1, 2, and 3 segment routes for the Stories module without route collisions.
 */
const StoryRouteResolver = () => {
  const { p1, p2, p3 } = useParams();
  const location = useLocation();

  const [resolution, setResolution] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const resolve = async () => {
      setLoading(true);

      // --- Scenario A: 3 segments (/stories/:p1/:p2/:p3) ---
      if (p1 && p2 && p3) {
        try {
          const [postRes, catRes] = await Promise.all([
            postAPI.getBySlug(p3).catch(() => null),
            categoryAPI.getBySlug(p3, { type: 'post' }).catch(() => null)
          ]);

          if (!isMounted) return;

          const postItem = postRes?.post || (postRes?._id ? postRes : null);
          const categoryItem = catRes?.category;

          if (postItem) {
            const isCategoryChildOfP2 = categoryItem && (
              categoryItem.parentCategory?.slug === p2 ||
              String(categoryItem.parentCategory?._id || categoryItem.parentCategory) === p2
            );

            if (isCategoryChildOfP2 && !postItem.subCategory) {
              setResolution({
                type: "subcategory",
                grandParentSlug: p1,
                parentCategorySlug: p2,
                subcategorySlug: p3
              });
            } else {
              setResolution({
                type: "post",
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
            setResolution({ type: "post", slug: p3 });
          }
        } catch {
          if (isMounted) setResolution({ type: "post", slug: p3 });
        } finally {
          if (isMounted) setLoading(false);
        }
        return;
      }

      // --- Scenario B: 2 segments (/stories/:p1/:p2) ---
      if (p1 && p2 && !p3) {
        try {
          const [postRes, catRes] = await Promise.all([
            postAPI.getBySlug(p2).catch(() => null),
            categoryAPI.getBySlug(p2, { type: 'post' }).catch(() => null)
          ]);

          if (!isMounted) return;

          const postItem = postRes?.post || (postRes?._id ? postRes : null);
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
          } else if (postItem) {
            setResolution({
              type: "post",
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
            setResolution({ type: "post", slug: p2 });
          }
        } catch {
          if (isMounted) setResolution({ type: "post", slug: p2 });
        } finally {
          if (isMounted) setLoading(false);
        }
        return;
      }

      // --- Scenario C: 1 segment (/stories/:p1) ---
      if (p1 && !p2 && !p3) {
        try {
          const [postRes, catRes] = await Promise.all([
            postAPI.getBySlug(p1).catch(() => null),
            categoryAPI.getBySlug(p1, { type: 'post' }).catch(() => null)
          ]);

          if (!isMounted) return;

          const postItem = postRes?.post || (postRes?._id ? postRes : null);
          const categoryItem = catRes?.category;

          if (categoryItem) {
            setResolution({
              type: "parentCategory",
              categorySlug: p1
            });
          } else if (postItem) {
            setResolution({
              type: "post",
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

  if (resolution?.type === "post") {
    return (
      <PostDetail
        slug={resolution.slug}
        parentCategorySlug={resolution.parentCategorySlug}
        subcategorySlug={resolution.subcategorySlug}
      />
    );
  }

  if (resolution?.type === "subcategory") {
    return (
      <StorySubcategoryPage
        grandParentSlug={resolution.grandParentSlug}
        parentCategorySlug={resolution.parentCategorySlug}
        subcategorySlug={resolution.subcategorySlug}
      />
    );
  }

  if (resolution?.type === "parentCategory") {
    return <StoryParentCategoryPage categorySlug={resolution.categorySlug} />;
  }

  return <NotFoundPage />;
};

export default StoryRouteResolver;

import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { categoryAPI, galleryAPI } from "../../services/api";
import GalleryHeroBanner from "../../components/galleries/GalleryHeroBanner";
import GalleryAlbumCard from "../../components/galleries/GalleryAlbumCard";
import GallerySidebar from "../../components/galleries/GallerySidebar";
import GalleryDetail from "./GalleryDetail";
import PageLoader from "../../components/common/PageLoader";
import GalleryThemePalette from "../../components/galleries/GalleryThemePalette";
import { GalleryThemeProvider } from "../../context/GalleryThemeContext";
import { Loader2, FolderTree, Images } from "lucide-react";

const GallerySubcategoryContent = ({
  grandParentSlug: propGrandParentSlug,
  parentCategorySlug: propParentSlug,
  subcategorySlug: propSubSlug
}) => {
  const params = useParams();
  const grandParentSlug = propGrandParentSlug || params.grandParentSlug;
  const parentCategorySlug = propParentSlug || params.parentCategorySlug || (params.p3 ? params.p2 : params.p1);
  const subcategorySlug = propSubSlug || params.subcategorySlug || (params.p3 ? params.p3 : params.p2);
  const navigate = useNavigate();

  const [grandParentCategory, setGrandParentCategory] = useState(null);
  const [parentCategory, setParentCategory] = useState(null);
  const [subcategory, setSubcategory] = useState(null);
  const [albums, setAlbums] = useState([]);
  const [allCategories, setAllCategories] = useState([]);
  const [latestAlbums, setLatestAlbums] = useState([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [isDirectGallery, setIsDirectGallery] = useState(false);

  // Scoped Search
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const searchDebounceRef = useRef(null);

  useEffect(() => {
    let isMounted = true;
    const fetchSubcategoryData = async () => {
      setPageLoading(true);
      setIsDirectGallery(false);
      try {
        const fetchPromises = [
          categoryAPI.getBySlug(parentCategorySlug).catch(() => null),
          categoryAPI.getBySlug(subcategorySlug).catch(() => null),
        ];
        if (grandParentSlug) {
          fetchPromises.push(categoryAPI.getBySlug(grandParentSlug).catch(() => null));
        }

        const [pRes, sRes, gpRes] = await Promise.all(fetchPromises);

        if (!isMounted) return;

        if (gpRes && gpRes.category) setGrandParentCategory(gpRes.category);
        if (pRes && pRes.category) setParentCategory(pRes.category);
        if (sRes && sRes.category) {
          setSubcategory(sRes.category);

          // Fetch albums belonging to this category (supports both childCategory & subCategory)
          const albRes = await galleryAPI.getAll({
            ...(grandParentSlug ? { childCategory: sRes.category._id } : { subCategory: sRes.category._id }),
            status: "published",
            limit: 24,
          }).catch(() => ({ galleries: [] }));

          if (isMounted) setAlbums(albRes.galleries || []);
        } else {
          // Check if subcategorySlug is actually a gallery album
          const galRes = await galleryAPI.getBySlug(subcategorySlug).catch(() => null);
          if (galRes && (galRes.gallery || galRes._id)) {
            setIsDirectGallery(true);
          }
        }

        // Fetch auxiliary data
        const [catsRes, latestRes] = await Promise.all([
          categoryAPI.getAll({ type: "gallery", isRoot: "true" }).catch(() => ({ categories: [] })),
          galleryAPI.getAll({ status: "published", limit: 4, sort: "-createdAt" }).catch(() => ({ galleries: [] })),
        ]);

        if (isMounted) {
          setAllCategories(catsRes.categories || []);
          setLatestAlbums(latestRes.galleries || []);
        }
      } catch (err) {
        console.error("Error loading gallery subcategory:", err);
      } finally {
        if (isMounted) setPageLoading(false);
      }
    };

    fetchSubcategoryData();
    return () => {
      isMounted = false;
    };
  }, [parentCategorySlug, subcategorySlug]);

  // Scoped search
  useEffect(() => {
    const q = searchQuery.trim();
    if (!q || !subcategory) {
      setSearchResults([]);
      setSearching(false);
      return;
    }

    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    setSearching(true);

    searchDebounceRef.current = setTimeout(async () => {
      try {
        const res = await galleryAPI.getAll({
          subCategory: subcategory._id,
          status: "published",
          search: q,
          limit: 20,
        });
        setSearchResults(res.galleries || []);
      } catch (err) {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 250);

    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, [searchQuery, subcategory]);

  if (pageLoading) {
    return <PageLoader text="Loading gallery..." />;
  }

  if (isDirectGallery) {
    return <GalleryDetail slug={subcategorySlug} />;
  }

  if (!subcategory) {
    return (
      <div style={{ textAlign: "center", padding: "120px 20px", color: "var(--g-text, var(--text-primary, #ffffff))" }}>
        <h2>Subcategory / Part Not Found</h2>
        <button onClick={() => navigate("/galleries")} className="btn-primary" style={{ marginTop: "20px" }}>
          Browse All Galleries
        </button>
      </div>
    );
  }

  const grandParentName = grandParentCategory?.name || grandParentSlug;
  const parentName = parentCategory?.name || "Parent Collection";

  const bannerMediaType = subcategory.bannerType === 'video' && subcategory.bannerVideo ? 'video' : 'image';
  const bannerMediaUrl =
    bannerMediaType === 'video'
      ? subcategory.bannerVideo
      : subcategory.bannerImage || subcategory.banner || subcategory.thumbnail || parentCategory?.bannerImage || parentCategory?.banner;

  const bannerConfig = {
    type: bannerMediaType,
    mediaUrl: bannerMediaUrl,
    height: subcategory.mediaHeight || '75vh',
    heading: subcategory.name,
    subheading: grandParentSlug ? `${grandParentName} • ${parentName}` : `${parentName} • Part Collection`,
    description: subcategory.description || `Browse high-resolution photo albums in ${subcategory.name}.`,
    buttonText: subcategory.buttonText || "View Albums",
    buttonUrl: subcategory.buttonUrl || "#albums-list",
    headingFontSize: '2rem',
    subheadingFontSize: '0.72rem',
    descriptionFontSize: subcategory.descriptionFontSize || '1rem',
    alignment: subcategory.alignment || 'left',
    verticalPosition: subcategory.verticalPosition || 'center',
    overlayStrength: subcategory.overlayStrength !== undefined ? subcategory.overlayStrength : 0,
    bannerPosition: subcategory.bannerPosition || parentCategory?.bannerPosition || 'center',
    buttonFontSize: subcategory.buttonFontSize || '0.95rem',
  };

  const breadcrumbs = [
    { label: "Home", url: "/" },
    { label: "Galleries", url: "/galleries" },
    ...(grandParentSlug ? [
      { label: grandParentName, url: `/galleries/${grandParentSlug}` },
      { label: parentName, url: `/galleries/${grandParentSlug}/${parentCategorySlug}` },
      { label: subcategory.name, url: `/galleries/${grandParentSlug}/${parentCategorySlug}/${subcategorySlug}` }
    ] : [
      { label: parentName, url: `/galleries/${parentCategorySlug}` },
      { label: subcategory.name, url: `/galleries/${parentCategorySlug}/${subcategorySlug}` }
    ])
  ];

  return (
    <div className="galleries-subcategory-page" style={{ width: "100%" }}>
      {/* 1. Subcategory Hero Banner */}
      <GalleryHeroBanner config={bannerConfig} breadcrumbs={breadcrumbs} />

      {/* 2. Main Content Grid */}
      <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "48px 24px 80px", boxSizing: "border-box" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "320px minmax(0, 1fr)",
            gap: "40px",
          }}
        >
          {/* Sidebar */}
          <div style={{ height: "100%" }}>
            <GallerySidebar
              categories={allCategories}
              latestAlbums={latestAlbums}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              activeCategorySlug={parentCategorySlug}
            />
          </div>

          {/* Main Area */}
          <main id="albums-list" style={{ minWidth: 0 }}>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
              <div>
                <div style={{ fontSize: "0.78rem", fontWeight: 800, textTransform: "uppercase", color: "var(--g-accent, #3b82f6)", marginBottom: "4px" }}>
                  Photo Albums
                </div>
                <h2 style={{ fontSize: "1.75rem", fontWeight: 900, margin: 0, color: "var(--g-text, var(--text-primary, #ffffff))" }}>
                  {subcategory.name} ({albums.length})
                </h2>
              </div>
            </div>

            {/* Results */}
            {searchQuery.trim() ? (
              searchResults.length > 0 ? (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "24px" }}>
                  {searchResults.map((alb) => (
                    <GalleryAlbumCard
                      key={alb._id}
                      gallery={alb}
                      parentSlug={parentCategorySlug}
                      subcategorySlug={subcategorySlug}
                    />
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: "center", padding: "50px", background: "var(--g-surface)", borderRadius: "16px" }}>
                  <p style={{ margin: 0, color: "var(--g-text-muted)" }}>No albums matching your search in this part.</p>
                </div>
              )
            ) : albums.length > 0 ? (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "24px" }}>
                {albums.map((alb) => (
                  <GalleryAlbumCard
                    key={alb._id}
                    gallery={alb}
                    parentSlug={parentCategorySlug}
                    subcategorySlug={subcategorySlug}
                  />
                ))}
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: "60px 20px", background: "var(--g-surface)", borderRadius: "16px", border: "1px dashed var(--g-border)" }}>
                <Images size={36} color="var(--g-accent, #3b82f6)" style={{ opacity: 0.5, marginBottom: "12px" }} />
                <h3 style={{ margin: "0 0 6px" }}>No Albums Published Yet</h3>
                <p style={{ margin: 0, color: "var(--g-text-muted)" }}>Check back soon for new photo albums in this part collection.</p>
              </div>
            )}
          </main>
        </div>
      </div>

      <GalleryThemePalette />
    </div>
  );
};

const GallerySubcategoryPage = ({ grandParentSlug, parentCategorySlug, subcategorySlug }) => {
  return (
    <GalleryThemeProvider>
      <GallerySubcategoryContent
        grandParentSlug={grandParentSlug}
        parentCategorySlug={parentCategorySlug}
        subcategorySlug={subcategorySlug}
      />
    </GalleryThemeProvider>
  );
};

export default GallerySubcategoryPage;

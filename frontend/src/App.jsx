import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useParams, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SiteThemeProvider } from './context/SiteThemeContext';
import GalleryThemePalette from './components/galleries/GalleryThemePalette';
import { initializeTheme } from './utils/themeHelper';

// Public Components
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import WordPressAdminBar from './components/common/WordPressAdminBar';
import PageLoader from './components/common/PageLoader';
import HomePage from './pages/public/HomePage';
import StoriesPage from './pages/public/StoriesPage';
import StoryParentCategoryPage from './pages/public/StoryParentCategoryPage';
import StorySubcategoryPage from './pages/public/StorySubcategoryPage';
import VideosPage from './pages/public/VideosPage';
import VideoParentCategoryPage from './pages/public/VideoParentCategoryPage';
import VideoSubcategoryPage from './pages/public/VideoSubcategoryPage';
import CategoryView from './pages/public/CategoryView';
import VideoDetail from './pages/public/VideoDetail';
import GalleryDetail from './pages/public/GalleryDetail';
import GalleriesPage from './pages/public/GalleriesPage';
import GalleryParentCategoryPage from './pages/public/GalleryParentCategoryPage';
import GallerySubcategoryPage from './pages/public/GallerySubcategoryPage';
import PostDetail from './pages/public/PostDetail';
import CustomPageView from './pages/public/CustomPageView';
import GalleryRouteResolver from './pages/public/GalleryRouteResolver';
import StoryRouteResolver from './pages/public/StoryRouteResolver';
import VideoRouteResolver from './pages/public/VideoRouteResolver';
import MediaArchiveView from './pages/public/MediaArchiveView';
import AdvancedSearchPage from './pages/public/AdvancedSearchPage';
import SearchByVideoPage from './pages/public/SearchByVideoPage';
import LoginPage from './pages/public/LoginPage';
import ForgotPasswordPage from './pages/public/ForgotPasswordPage';
import ResetPasswordPage from './pages/public/ResetPasswordPage';
import NotFoundPage from './pages/public/NotFoundPage';
import AuthModal from './components/AuthModal';

// Admin Components
import AdminLayout from './components/admin/AdminLayout';
import DashboardOverview from './pages/admin/DashboardOverview';
import PostList from './pages/admin/PostList';
import PostEditor from './pages/admin/PostEditor';
import VideoList from './pages/admin/VideoList';
import VideoEditor from './pages/admin/VideoEditor';
import GalleryList from './pages/admin/GalleryList';
import GalleryEditor from './pages/admin/GalleryEditor';
import PageList from './pages/admin/PageList';
import PageEditor from './pages/admin/PageEditor';
import MediaLibrary from './pages/admin/MediaLibrary';
import MediaEdit from './pages/admin/MediaEdit';
import CategoryTaxonomyManager from './pages/admin/CategoryTaxonomyManager';
import MenuManager from './pages/admin/MenuManager';
import UserManager from './pages/admin/UserManager';
import UserEditPage from './pages/admin/UserEditPage';
import EditorPermissions from './pages/admin/EditorPermissions';
import ThemeCustomizer from './pages/admin/ThemeCustomizer';
import ThemeOptions from './pages/admin/ThemeOptions';
import GeneralSettings from './pages/admin/GeneralSettings';

import FieldBuilder from './pages/admin/FieldBuilder';
import CategoryEditPage from './pages/admin/CategoryEditPage';
import VideoFieldsManager from './pages/admin/VideoFieldsManager';
import ProfilePage from './pages/public/ProfilePage';

// Module Permission Guard for granular CMS feature protection
const ModuleGuard = ({ module, children }) => {
  const { user, isAdmin } = useAuth();
  if (isAdmin) return children;

  const allowed = user?.permissions?.[module]?.view ?? (module === "posts");
  if (!allowed) {
    return <Navigate to="/admin/posts" replace />;
  }

  return children;
};

// Protected Route Guard for /admin
const ProtectedRoute = () => {
  const { user, loading, isAuthenticated, isEditor } = useAuth();
  const location = useLocation();

  if (loading) {
    return <PageLoader text="Verifying session..." />;
  }

  if (!isAuthenticated || !isEditor) {
    const returnUrl = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?redirect=${returnUrl}`} replace />;
  }



  return (
    <AdminLayout>
      <Outlet />
    </AdminLayout>
  );
};

// Inner Route Guard: ensures unauthenticated visitors cannot access any inner page
const InnerRouteGuard = () => {
  const { isAuthenticated, openAuthModal } = useAuth();
  const location = useLocation();

  useEffect(() => {
    if (!isAuthenticated) {
      openAuthModal("login", "Please sign in or register to access this content", location.pathname + location.search);
    }
  }, [isAuthenticated, location.pathname, location.search, openAuthModal]);

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

// Page legacy /page/:slug redirect helper
const PageSlugRedirect = () => {
  const { slug } = useParams();
  return <Navigate to={`/${slug}`} replace />;
};

// Public Website Layout wrapper
const PublicLayout = () => {
  const location = useLocation();
  const [navigating, setNavigating] = React.useState(true);
  const [fadeExit, setFadeExit] = React.useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    setNavigating(true);
    setFadeExit(false);

    // Smooth transition holding duration (4-5s) so page data loads completely without any jerk ("jhatka")
    let exitTimer = null;
    const holdTimer = setTimeout(() => {
      setFadeExit(true);
      exitTimer = setTimeout(() => {
        setNavigating(false);
      }, 400); // 400ms smooth fade-out
    }, 4200); // 4.2s holding + 0.4s fade = 4.6s total smooth duration

    return () => {
      clearTimeout(holdTimer);
      if (exitTimer) clearTimeout(exitTimer);
    };
  }, [location.pathname]);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        backgroundColor: "var(--bg-main)",
        paddingTop: "var(--wp-admin-bar-height, 0px)",
        transition: "padding-top 0.15s ease",
        position: "relative"
      }}
    >
      {/* Universal Website Page Loader with Glassmorphism Overlay */}
      {navigating && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 999999,
            background: 'rgba(10, 15, 29, 0.68)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: fadeExit ? 0 : 1,
            transition: 'opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
            pointerEvents: fadeExit ? 'none' : 'auto',
          }}
        >
          <PageLoader text="Loading content..." fullscreen={false} />
        </div>
      )}

      <WordPressAdminBar />
      <Navbar />
      <main style={{ flex: 1 }}>
        <Outlet />
      </main>
      <Footer />
      <AuthModal />
      <GalleryThemePalette />
    </div>
  );
};

const AppContent = () => {
  useEffect(() => {
    initializeTheme();
  }, []);

  return (
    <Routes>
      {/* Public Facing Website Routes */}
      <Route element={<PublicLayout />}>
        {/* Homepage */}
        <Route path="/" element={<HomePage />} />

        {/* Stories / Posts Hierarchy (WordPress-style) */}
        <Route path="/stories" element={<StoriesPage />} />
        <Route path="/posts" element={<StoriesPage />} />
        <Route path="/post/:slug" element={<PostDetail />} />
        <Route path="/story/:slug" element={<PostDetail />} />
        {/* 4 segments: L1 > L2 > L3 > Post Slug */}
        <Route path="/stories/:grandParentSlug/:parentCategorySlug/:subcategorySlug/:postSlug" element={<PostDetail />} />
        {/* 3 segments: L1 > L2 > L3 (Category Archive) OR L1 > L2 > Post (Detail) */}
        <Route path="/stories/:p1/:p2/:p3" element={<StoryRouteResolver />} />
        {/* 2 segments: L1 > L2 (Category Archive) OR L1 > Post (Detail) */}
        <Route path="/stories/:p1/:p2" element={<StoryRouteResolver />} />
        {/* 1 segment: L1 (Category Archive) OR Post (Detail) */}
        <Route path="/stories/:p1" element={<StoryRouteResolver />} />

        {/* Videos Hierarchy (WordPress-style) */}
        <Route path="/videos" element={<VideosPage />} />
        <Route path="/video/:slug" element={<VideoDetail />} />
        {/* 4 segments: L1 > L2 > L3 > Video Slug */}
        <Route path="/videos/:grandParentSlug/:parentCategorySlug/:subcategorySlug/:videoSlug" element={<VideoDetail />} />
        {/* 3 segments: L1 > L2 > L3 (Category Archive) OR L1 > L2 > Video (Detail) */}
        <Route path="/videos/:p1/:p2/:p3" element={<VideoRouteResolver />} />
        {/* 2 segments: L1 > L2 (Category Archive) OR L1 > Video (Detail) */}
        <Route path="/videos/:p1/:p2" element={<VideoRouteResolver />} />
        {/* 1 segment: L1 (Category Archive) OR Video (Detail) */}
        <Route path="/videos/:p1" element={<VideoRouteResolver />} />

        {/* Galleries Hierarchy (WordPress-style) */}
        <Route path="/galleries" element={<GalleriesPage />} />
        <Route path="/gallery" element={<GalleriesPage />} />
        <Route path="/gallery/:slug" element={<GalleryDetail />} />
        {/* 4 segments: L1 > L2 > L3 > Gallery Slug */}
        <Route path="/galleries/:grandParentSlug/:parentCategorySlug/:subcategorySlug/:gallerySlug" element={<GalleryDetail />} />
        {/* 3 segments: L1 > L2 > L3 (Category Archive) OR L1 > L2 > Gallery (Detail) */}
        <Route path="/galleries/:p1/:p2/:p3" element={<GalleryRouteResolver />} />
        {/* 2 segments: L1 > L2 (Category Archive) OR L1 > Gallery (Detail) */}
        <Route path="/galleries/:p1/:p2" element={<GalleryRouteResolver />} />
        {/* 1 segment: L1 (Category Archive) OR Gallery (Detail) */}
        <Route path="/galleries/:p1" element={<GalleryRouteResolver />} />
        <Route path="/category/:slug" element={<CategoryView />} />

        {/* Search */}
        <Route path="/search-by-video" element={<SearchByVideoPage />} />
        <Route path="/search-by-videos" element={<SearchByVideoPage />} />
        <Route path="/search" element={<SearchByVideoPage />} />
        <Route path="/advanced-search" element={<AdvancedSearchPage />} />

        {/* User Self Profile Management */}
        <Route path="/profile" element={<ProfilePage />} />

        {/* Legacy /page/:slug redirect to root /:slug */}
        <Route path="/page/:slug" element={<PageSlugRedirect />} />

        {/* Universal Page Root Permalink (e.g. /galleries, /about-us, /contact-us) */}
        <Route path="/:slug" element={<CustomPageView />} />
      </Route>

      {/* Login & Password Recovery Pages */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password/:token" element={<ResetPasswordPage />} />

      {/* Authenticated Admin CMS Routes */}
      <Route element={<ProtectedRoute />}>
        <Route path="/admin" element={<DashboardOverview />} />

        {/* Posts Section */}
        <Route path="/admin/posts" element={<PostList />} />
        <Route path="/admin/posts/new" element={<PostEditor />} />
        <Route path="/admin/posts/edit/:id" element={<PostEditor />} />
        <Route
          path="/admin/posts/categories"
          element={<CategoryTaxonomyManager taxonomyType="post" title="Post Categories" />}
        />

        {/* Videos Section */}
        <Route path="/admin/videos" element={<ModuleGuard module="videos"><VideoList /></ModuleGuard>} />
        <Route path="/admin/videos/new" element={<ModuleGuard module="videos"><VideoEditor /></ModuleGuard>} />
        <Route path="/admin/videos/edit/:id" element={<ModuleGuard module="videos"><VideoEditor /></ModuleGuard>} />
        <Route
          path="/admin/videos/categories"
          element={<CategoryTaxonomyManager taxonomyType="video" title="Video Categories" />}
        />
        <Route
          path="/admin/video-fields"
          element={<ModuleGuard module="videos"><VideoFieldsManager /></ModuleGuard>}
        />

        {/* Category Edit Pages (shared across video, gallery, post) */}
        <Route path="/admin/categories/new" element={<CategoryEditPage />} />
        <Route path="/admin/categories/edit/:id" element={<CategoryEditPage />} />

        {/* Galleries Section */}
        <Route path="/admin/gallery" element={<ModuleGuard module="galleries"><GalleryList /></ModuleGuard>} />
        <Route path="/admin/galleries" element={<ModuleGuard module="galleries"><GalleryList /></ModuleGuard>} />
        <Route path="/admin/gallery/new" element={<ModuleGuard module="galleries"><GalleryEditor /></ModuleGuard>} />
        <Route path="/admin/galleries/new" element={<ModuleGuard module="galleries"><GalleryEditor /></ModuleGuard>} />
        <Route path="/admin/gallery/edit/:id" element={<ModuleGuard module="galleries"><GalleryEditor /></ModuleGuard>} />
        <Route path="/admin/galleries/edit/:id" element={<ModuleGuard module="galleries"><GalleryEditor /></ModuleGuard>} />
        <Route
          path="/admin/gallery/categories"
          element={<CategoryTaxonomyManager taxonomyType="gallery" title="Gallery Categories" />}
        />
        <Route
          path="/admin/galleries/categories"
          element={<CategoryTaxonomyManager taxonomyType="gallery" title="Gallery Categories" />}
        />

        {/* Media Library */}
        <Route path="/admin/media" element={<ModuleGuard module="media"><MediaLibrary /></ModuleGuard>} />
          <Route path="/admin/media/edit/:id" element={<ModuleGuard module="media"><MediaEdit /></ModuleGuard>} />

        {/* Pages Section */}
        <Route path="/admin/pages" element={<ModuleGuard module="pages"><PageList /></ModuleGuard>} />
        <Route path="/admin/pages/new" element={<ModuleGuard module="pages"><PageEditor /></ModuleGuard>} />
        <Route path="/admin/pages/edit/:id" element={<ModuleGuard module="pages"><PageEditor /></ModuleGuard>} />

        {/* Appearance & Themes */}
        <Route path="/admin/appearance/theme-options" element={<ModuleGuard module="theme"><ThemeOptions /></ModuleGuard>} />
        <Route path="/admin/appearance" element={<Navigate to="/admin/appearance/theme-options" replace />} />
        <Route path="/admin/appearance/menus" element={<ModuleGuard module="menus"><MenuManager /></ModuleGuard>} />

        {/* Users Section */}
        <Route path="/admin/users" element={<ModuleGuard module="users"><UserManager /></ModuleGuard>} />
        <Route path="/admin/users/edit/:id" element={<ModuleGuard module="users"><UserEditPage /></ModuleGuard>} />
        <Route path="/admin/users/permissions" element={<ModuleGuard module="users"><EditorPermissions /></ModuleGuard>} />
        <Route path="/admin/profile" element={<ProfilePage />} />

        {/* Settings */}
        <Route path="/admin/settings" element={<ModuleGuard module="settings"><GeneralSettings /></ModuleGuard>} />
      </Route>

      {/* Catch-all 404 Not Found Page */}
      <Route element={<PublicLayout />}>
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SiteThemeProvider>
          <AppContent />
        </SiteThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;

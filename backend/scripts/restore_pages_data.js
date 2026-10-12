const mongoose = require('mongoose');

async function restorePages() {
  await mongoose.connect('mongodb://127.0.0.1:27017/cms_portal');
  const Page = mongoose.model('Page', new mongoose.Schema({}, { strict: false }));
  const Category = mongoose.model('Category', new mongoose.Schema({}, { strict: false }));

  // Find exact Category IDs
  const indianVideoCat = await Category.findOne({ slug: 'indian-videos' }) || await Category.findOne({ type: 'video' });
  const pakistaniVideoCat = await Category.findOne({ slug: 'pakistani' }) || await Category.findOne({ type: 'video' });
  const asianGalleryCat = await Category.findOne({ slug: 'asian' }) || await Category.findOne({ type: 'gallery' });
  const desiBhabisCat = await Category.findOne({ slug: 'desi-bhabis' }) || await Category.findOne({ type: 'gallery' });

  console.log('Video Cats:', indianVideoCat?._id, pakistaniVideoCat?._id);
  console.log('Gallery Cats:', asianGalleryCat?._id, desiBhabisCat?._id);

  // 1. HOME PAGE
  await Page.findOneAndUpdate(
    { slug: 'home' },
    {
      title: 'Home',
      slug: 'home',
      template: 'home',
      status: 'published',
      order: 1,
      content: '<p>Welcome to our media platform.</p>',
      templateConfig: {
        heroSlider: {
          enabled: true,
          mode: 'dynamic',
          slideCount: 3,
          height: '85vh',
          titleFontSize: '3rem',
          alignment: 'left'
        },
        videoSection: {
          enabled: true,
          title: 'Trending & Latest Videos',
          subtitle: 'Stream recent videos and explore video categories',
          category1Id: indianVideoCat ? indianVideoCat._id.toString() : '',
          category2Id: pakistaniVideoCat ? pakistaniVideoCat._id.toString() : '',
          category1CustomImage: '',
          category2CustomImage: ''
        },
        gallerySection: {
          enabled: true,
          title: 'Featured Photo Galleries',
          subtitle: 'High-resolution photo albums and visual collections',
          category1Id: asianGalleryCat ? asianGalleryCat._id.toString() : '',
          category2Id: desiBhabisCat ? desiBhabisCat._id.toString() : '',
          category1CustomImage: '',
          category2CustomImage: ''
        },
        postsSection: {
          enabled: true,
          title: 'Latest Stories & Articles',
          subtitle: 'Read our newest articles and folklore tales',
          count: 3
        },
        membershipSection: {
          enabled: true,
          heading: 'Unlock Unlimited Access to Exclusive Media',
          subheading: 'Join Our Community',
          content: 'Get unlimited access to high-definition video streams, full-resolution photo albums, and deep folklore stories. Support our independent creators and join our exclusive community today.',
          buttonText: 'Join Today',
          buttonUrl: '/page/about-us',
          image: '/uploads/images/WhatsApp-Image-2026-09-26-at-20-52-51-1790490902432-954911024.jpeg'
        }
      }
    },
    { upsert: true, new: true }
  );
  console.log('✅ Home Page restored');

  // 2. VIDEOS PAGE
  const videoBannerConfig = {
    type: 'video',
    mediaUrl: '/uploads/videos/Download-free-Uncle-with-neighbour-s-young-wife-porn-video-hd-xxx-mobile-p.mp4',
    mediaId: null,
    height: '75vh',
    heading: 'Explore Our Video Stories',
    subheading: 'Stories that bring every moment to life',
    description: 'Watch cinematic journeys, folklore tales, and exclusive documentary films.',
    buttonText: 'Explore Videos',
    buttonUrl: '#categories',
    headingFontSize: '3rem',
    subheadingFontSize: '1.25rem',
    descriptionFontSize: '1rem',
    buttonFontSize: '0.95rem',
    alignment: 'left',
    verticalPosition: 'center',
    overlayStrength: 0
  };

  await Page.findOneAndUpdate(
    { slug: 'videos' },
    {
      title: 'Videos',
      slug: 'videos',
      template: 'videos',
      status: 'published',
      order: 0,
      metaTitle: 'Videos',
      metaDescription: '',
      banner: videoBannerConfig,
      templateConfig: {
        banner: videoBannerConfig,
        layout: {
          sidebar: 'with_sidebar'
        },
        categories: {
          heading: 'Browse Video Categories',
          subtitle: 'Explore parent categories and discover subtopics',
          perPage: 6
        },
        sidebar: {
          enabled: true,
          latestVideosCount: 5,
          mostViewedVideosCount: 2,
          latestPostsCount: 3,
          latestGalleriesCount: 3
        }
      }
    },
    { upsert: true, new: true }
  );
  console.log('✅ Videos Page restored');

  // 3. STORIES PAGE
  const storiesBannerConfig = {
    type: 'image',
    mediaUrl: '/uploads/images/indian_hot_girl_in_pink_bra_lying_on_bessy_bed_by_niranjanbara_digr90g-pre-1790485942702-434637203.jpg',
    mediaId: null,
    height: '60vh',
    heading: 'Stories & Editorial Journal',
    subheading: 'Thoughtful Perspectives & Chronicles',
    description: 'Explore in-depth investigative reports, cultural essays, narratives, and insightful stories.',
    buttonText: 'Explore Topics',
    buttonUrl: '#categories',
    headingFontSize: '3rem',
    subheadingFontSize: '1.15rem',
    descriptionFontSize: '1.05rem',
    buttonFontSize: '0.95rem',
    alignment: 'left',
    verticalPosition: 'center',
    overlayStrength: 0
  };

  await Page.findOneAndUpdate(
    { slug: 'stories' },
    {
      title: 'Stories',
      slug: 'stories',
      template: 'stories',
      status: 'published',
      order: 1,
      content: '<p>Welcome to our editorial journal and stories portal.</p>',
      banner: storiesBannerConfig,
      templateConfig: {
        banner: storiesBannerConfig,
        layout: {
          sidebar: 'with_sidebar'
        },
        categories: {
          heading: 'Editorial Columns & Categories',
          subtitle: 'Browse parent story categories to explore in-depth topics',
          perPage: 6
        },
        sidebar: {
          enabled: true,
          latestPostsCount: 5,
          videoCategoriesEnabled: true,
          galleryCategoriesEnabled: true,
          latestVideoEnabled: true
        }
      }
    },
    { upsert: true, new: true }
  );
  console.log('✅ Stories Page restored');

  // 4. GALLERIES PAGE
  const galleriesBannerConfig = {
    type: 'image',
    mediaUrl: 'https://images.unsplash.com/photo-1452587925148-ce544e77e70d?auto=format&fit=crop&w=1920&q=85',
    mediaId: null,
    height: '65vh',
    heading: 'Photo Galleries & Visual Archives',
    subheading: 'Curated High-Resolution Photography',
    description: 'Explore curated photo albums, master galleries, and evocative visual collections.',
    buttonText: 'Browse Collections',
    buttonUrl: '#categories',
    headingFontSize: '3rem',
    subheadingFontSize: '1.2rem',
    descriptionFontSize: '1rem',
    buttonFontSize: '0.95rem',
    alignment: 'left',
    verticalPosition: 'center',
    overlayStrength: 0.35
  };

  await Page.findOneAndUpdate(
    { slug: 'galleries' },
    {
      title: 'Galleries',
      slug: 'galleries',
      template: 'galleries',
      status: 'published',
      order: 2,
      content: '<p>Explore high-resolution visual stories, photography albums, and curated moments.</p>',
      banner: galleriesBannerConfig,
      metaTitle: 'Visual Archives & Photo Galleries',
      metaDescription: 'Explore curated photo albums and fine photography collections.',
      templateConfig: {
        banner: galleriesBannerConfig,
        layout: {
          sidebar: 'with_sidebar'
        },
        categories: {
          heading: 'Photo Gallery Categories',
          subtitle: 'Browse collections by photography theme and parent categories',
          perPage: 6
        },
        sidebar: {
          enabled: true,
          latestGalleriesCount: 5,
          latestVideosCount: 3,
          latestPostsCount: 3,
          categoriesWidgetEnabled: true
        }
      }
    },
    { upsert: true, new: true }
  );
  console.log('✅ Galleries Page restored');

  // 5. ABOUT US PAGE
  await Page.findOneAndUpdate(
    { slug: 'about-us' },
    {
      title: 'About Us',
      slug: 'about-us',
      template: 'default',
      status: 'published',
      order: 3,
      banner: '/uploads/images/indian_hot_girl_in_pink_bra_lying_on_bessy_bed_by_niranjanbara_digr90g-pre-1790485942702-434637203.jpg',
      content: `<h2>Welcome to our Modern Media Portal</h2>\n<p>We are a dedicated multimedia platform curating top-tier videos, rich photo galleries, and compelling editorial stories.</p>\n<p>Our mission is to bring meaningful content, high visual quality, and effortless access to audiences worldwide.</p>`,
      templateConfig: {
        banner: {
          height: '420px',
          heading: 'About Us',
          subheading: 'Discover our mission, stories, and multimedia universe',
          alignment: 'left',
          overlayOpacity: 0.65
        }
      }
    },
    { upsert: true, new: true }
  );
  console.log('✅ About Us Page restored');

  await mongoose.disconnect();
}

restorePages().catch(err => {
  console.error(err);
  process.exit(1);
});

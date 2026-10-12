const Page = require('../models/Page');
const mongoose = require('mongoose');
const slugify = require('slugify');
const { syncToMediaLibrary, getUploadedFileUrl } = require('../utils/mediaHelper');
const { getMonthDateRange, getAvailableDates } = require('../utils/dateHelper');

// @desc    Get all pages
// @route   GET /api/pages
// @access  Public
exports.getPages = async (req, res) => {
  try {
    const { status, search, template, page = 1, limit = 100 } = req.query;

    // Admin management query vs public frontend viewing
    const isManagerQuery = req.query.isAdmin === "true" || ["trash", "draft", "all"].includes(status);

    // Module permission check applies ONLY to admin panel management for editors; frontend is 100% accessible to all logged-in roles
    if (isManagerQuery && req.user && req.user.role === "editor") {
      if (!req.user.permissions?.pages?.view) {
        return res.status(403).json({ success: false, message: "Access denied: You do not have permission to access pages management in admin panel." });
      }
    }
    let query = {};

    if (template) {
      query.template = template;
    }
    if (status === 'trash') {
      query.status = 'trash';
    } else if (status === 'draft') {
      query.status = 'draft';
    } else if (status === 'published') {
      query.status = 'published';
    } else if (status === 'all') {
      query.status = { $ne: 'trash' };
    } else if (!req.user || req.user.role === 'user') {
      query.status = 'published';
    } else {
      query.status = { $ne: 'trash' };
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } }
      ];
    }

    const filterMonth = req.query.date || req.query.month;
    const dateRange = getMonthDateRange(filterMonth);
    if (dateRange) {
      query.createdAt = { $gte: dateRange.startDate, $lt: dateRange.endDate };
    }

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Page.countDocuments(query);

    const pages = await Page.find(query).sort({ order: 1, createdAt: -1 }).skip(skip).limit(Number(limit));

    const [allCount, publishedCount, draftCount, trashCount, availableDates] = await Promise.all([
      Page.countDocuments({ status: { $ne: 'trash' } }),
      Page.countDocuments({ status: 'published' }),
      Page.countDocuments({ status: 'draft' }),
      Page.countDocuments({ status: 'trash' }),
      getAvailableDates(Page)
    ]);

    res.json({
      success: true,
      count: pages.length,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit)) || 1,
      availableDates,
      statusCounts: {
        all: allCount,
        published: publishedCount,
        draft: draftCount,
        trash: trashCount
      },
      pages
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching pages'
    });
  }
};

// @desc    Get page by slug or ID
// @route   GET /api/pages/:slug
// @access  Public
exports.getPageBySlug = async (req, res) => {
  try {
    const isId = mongoose.isValidObjectId(req.params.slug);
    const query = isId ? { _id: req.params.slug } : { slug: req.params.slug };
    let page = await Page.findOne(query);

    if (!page) {
      page = await Page.findOne({ template: req.params.slug });
    }

    if (!page) {
      if (req.params.slug === 'home') {
        return exports.getHomePage(req, res);
      }
      if (req.params.slug === 'videos') {
        return exports.getVideosPage(req, res);
      }
      if (req.params.slug === 'stories' || req.params.slug === 'posts') {
        return exports.getStoriesPage(req, res);
      }
      if (req.params.slug === 'galleries' || req.params.slug === 'gallery') {
        return exports.getGalleriesPage(req, res);
      }
      return res.status(404).json({
        success: false,
        message: 'Page not found'
      });
    }

    res.json({
      success: true,
      page
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching page'
    });
  }
};

// @desc    Create page
// @route   POST /api/pages
// @access  Private (Admin / Editor)
exports.createPage = async (req, res) => {
  try {
    const { title, slug, content, banner, template, status, order, metaTitle, metaDescription, templateConfig } = req.body;
    let parsedTemplateConfig = {};
    if (templateConfig) {
      try {
        parsedTemplateConfig = typeof templateConfig === 'string' ? JSON.parse(templateConfig) : templateConfig;
      } catch (e) {
        parsedTemplateConfig = {};
      }
    }

    const effectiveTitle = (title && title.trim()) ? title.trim() : 'Untitled Page';

    let finalBanner = banner || '';
    if (req.file) {
      finalBanner = getUploadedFileUrl(req.file, 'banners');
      await syncToMediaLibrary({
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
        url: finalBanner,
        mediaType: 'image',
        uploadedBy: req.user ? req.user._id : null
      });
    }

    const isTemplatePage = ['home', 'videos', 'stories', 'galleries', 'gallery', 'search-by-video'].includes(template);
    const hasContent = isTemplatePage || Boolean(
      (content && content.replace(/<[^>]*>/g, '').trim()) ||
      finalBanner ||
      req.file ||
      (templateConfig && Object.keys(parsedTemplateConfig).length > 0)
    );
    const effectiveStatus = hasContent ? (status || 'published') : 'draft';

    const pageData = {
      title: effectiveTitle,
      content: content || '',
      banner: finalBanner,
      template: template || 'default',
      status: effectiveStatus,
      order: order ? Number(order) : 0,
      metaTitle: metaTitle || effectiveTitle,
      metaDescription: metaDescription || '',
      templateConfig: parsedTemplateConfig
    };

    if (slug && slug.trim()) {
      pageData.slug = slugify(slug.trim(), { lower: true, strict: true });
    }

    const page = await Page.create(pageData);

    res.status(201).json({
      success: true,
      message: 'Page created successfully!',
      page
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error creating page'
    });
  }
};

// @desc    Update page
// @route   PUT /api/pages/:id
// @access  Private (Admin / Editor)
exports.updatePage = async (req, res) => {
  try {
    const isId = mongoose.isValidObjectId(req.params.id);
    let page = isId ? await Page.findById(req.params.id) : null;
    if (!page) {
      page = await Page.findOne({ slug: req.params.id });
    }
    if (!page) {
      page = await Page.findOne({ template: req.params.id });
    }
    if (!page) {
      page = new Page({
        title: req.body.title || req.params.id,
        slug: req.body.slug || req.params.id,
        template: req.body.template || (['home', 'videos', 'stories', 'galleries'].includes(req.params.id) ? req.params.id : 'default')
      });
    }

    const { title, slug, content, banner, template, status, order, metaTitle, metaDescription, templateConfig } = req.body;

    if (title) page.title = title;
    if (slug && slug.trim()) {
      page.slug = slugify(slug.trim(), { lower: true, strict: true });
    } else if (title && title !== page.title && !page.slug) {
      page.slug = slugify(title, { lower: true, strict: true });
    }
    if (content !== undefined) page.content = content;
    if (template) page.template = template;
    if (status) page.status = status;
    if (order !== undefined) page.order = Number(order);
    if (metaTitle !== undefined) page.metaTitle = metaTitle;
    if (metaDescription !== undefined) page.metaDescription = metaDescription;
    if (templateConfig !== undefined) {
      try {
        page.templateConfig = typeof templateConfig === 'string' ? JSON.parse(templateConfig) : templateConfig;
      } catch (e) {
        // fallback
      }
    }

    if (req.file) {
      page.banner = getUploadedFileUrl(req.file, 'banners');
      await syncToMediaLibrary({
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
        url: page.banner,
        mediaType: 'image',
        uploadedBy: req.user ? req.user._id : null
      });
    } else if (banner !== undefined) {
      page.banner = banner;
    }

    await page.save();

    res.json({
      success: true,
      message: 'Page updated successfully',
      page
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error updating page'
    });
  }
};

// @desc    Delete or trash page
// @route   DELETE /api/pages/:id
// @access  Private (Admin)
exports.deletePage = async (req, res) => {
  try {
    const page = await Page.findById(req.params.id);
    if (!page) {
      return res.status(404).json({
        success: false,
        message: "Page not found"
      });
    }

    const { force } = req.query;

    if (page.status !== "trash" && force !== "true" && force !== true) {
      page.status = "trash";
      await page.save();
      return res.json({
        success: true,
        message: "Page moved to Trash"
      });
    }

    await page.deleteOne();

    res.json({
      success: true,
      message: "Page permanently deleted"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Error deleting page"
    });
  }
};

// @desc    Get active Home template page
// @route   GET /api/pages/template/home
// @access  Public
exports.getHomePage = async (req, res) => {
  try {
    let page = await Page.findOne({
      template: 'home',
      status: 'published'
    });

    if (!page) {
      page = await Page.findOne({
        slug: 'home',
        status: 'published'
      });
    }

    const defaultConfig = {
      heroSlider: {
        enabled: true,
        mode: 'dynamic',
        slideCount: 5,
        height: '90vh',
        titleFontSize: '3rem',
        alignment: 'left',
        slides: []
      },
      videoSection: {
        enabled: true,
        title: 'Latest Videos',
        subtitle: 'Stream recent videos and explore categories',
        category1Id: null,
        category2Id: null,
        category1CustomImage: '',
        category2CustomImage: ''
      },
      gallerySection: {
        enabled: true,
        title: 'Photo Galleries',
        subtitle: 'High-resolution photo albums and visual collections',
        category1Id: null,
        category2Id: null,
        category1CustomImage: '',
        category2CustomImage: ''
      },
      postsSection: {
        enabled: true,
        title: 'Latest Stories',
        subtitle: 'Read our newest articles and folklore tales',
        count: 3
      },
      membershipSection: {
        enabled: true,
        heading: 'Unlock Exclusive Access',
        subheading: 'Join Our Community',
        content: 'Discover behind-the-scenes stories, high-definition videos, and full photo albums by joining our member community today.',
        buttonText: 'Join Now',
        buttonUrl: '/page/about-us',
        image: ''
      }
    };

    const { getHomeFeaturedBanners, getHomeFeaturedBanner } = require('../utils/homeBannerHelper');
    const [featuredHomeBanners, featuredHomeBanner] = await Promise.all([
      getHomeFeaturedBanners(),
      getHomeFeaturedBanner()
    ]);

    if (!page) {
      return res.json({
        success: true,
        isDefault: true,
        page: {
          title: 'Home',
          slug: 'home',
          template: 'home',
          status: 'published',
          templateConfig: defaultConfig
        },
        featuredHomeBanner,
        featuredHomeBanners
      });
    }

    const rawConfig = page.templateConfig || {};
    const mergedConfig = {
      heroSlider: { ...defaultConfig.heroSlider, ...(rawConfig.heroSlider || {}) },
      videoSection: { ...defaultConfig.videoSection, ...(rawConfig.videoSection || {}) },
      gallerySection: { ...defaultConfig.gallerySection, ...(rawConfig.gallerySection || {}) },
      postsSection: { ...defaultConfig.postsSection, ...(rawConfig.postsSection || {}) },
      membershipSection: { ...defaultConfig.membershipSection, ...(rawConfig.membershipSection || {}) }
    };

    res.json({
      success: true,
      isDefault: false,
      page: {
        ...page.toObject(),
        templateConfig: mergedConfig
      },
      featuredHomeBanner,
      featuredHomeBanners
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching Home template page'
    });
  }
};

// @desc    Get active Videos template page
// @route   GET /api/pages/template/videos
// @access  Public
exports.getVideosPage = async (req, res) => {
  try {
    let page = await Page.findOne({
      slug: 'videos',
      template: 'videos',
      status: 'published'
    });

    if (!page) {
      page = await Page.findOne({
        template: 'videos',
        status: 'published'
      }).sort({ updatedAt: -1 });
    }

    if (!page) {
      page = await Page.findOne({
        slug: 'videos',
        status: 'published'
      });
    }

    if (!page) {
      page = await Page.findOne({
        slug: 'videos',
        template: 'videos'
      });
    }

    if (!page) {
      page = await Page.findOne({
        slug: 'videos'
      });
    }

    const defaultVideosConfig = {
      banner: {
        type: 'video', // 'video' | 'image'
        mediaUrl: '',
        mediaId: null,
        height: '75vh', // '60vh' | '75vh' | '90vh' | custom
        heading: 'Explore Our Video Stories',
        subheading: 'Stories that bring every moment to life',
        description: 'Watch cinematic journeys, folklore tales, and exclusive documentary films.',
        buttonText: 'Explore Videos',
        buttonUrl: '#categories',
        headingFontSize: '2rem',
        subheadingFontSize: '0.72rem',
        descriptionFontSize: '1rem',
        buttonFontSize: '0.95rem',
        alignment: 'left', // 'left' | 'center' | 'right'
        verticalPosition: 'center', // 'top' | 'center' | 'bottom'
        overlayStrength: 0
      },
      layout: {
        sidebar: 'with_sidebar' // 'with_sidebar' | 'without_sidebar'
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
    };

    if (!page) {
      return res.json({
        success: true,
        isDefault: true,
        page: {
          title: 'Videos',
          slug: 'videos',
          template: 'videos',
          status: 'published',
          templateConfig: defaultVideosConfig
        }
      });
    }

    const rawConfig = page.templateConfig || {};
    const mergedConfig = {
      banner: { ...defaultVideosConfig.banner, ...(rawConfig.banner || {}) },
      layout: { ...defaultVideosConfig.layout, ...(rawConfig.layout || {}) },
      categories: { ...defaultVideosConfig.categories, ...(rawConfig.categories || {}) },
      sidebar: { ...defaultVideosConfig.sidebar, ...(rawConfig.sidebar || {}) }
    };

    res.json({
      success: true,
      isDefault: false,
      page: {
        ...page.toObject(),
        templateConfig: mergedConfig
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching Videos template page'
    });
  }
};

// @desc    Get Stories Page with dynamic Template Configuration
// @route   GET /api/pages/template/stories
// @access  Public
exports.getStoriesPage = async (req, res) => {
  try {
    let page = await Page.findOne({
      slug: { $in: ["stories", "posts"] },
      template: { $in: ["stories", "posts"] },
      status: "published"
    });

    if (!page) {
      page = await Page.findOne({
        template: { $in: ["stories", "posts"] },
        status: "published"
      }).sort({ updatedAt: -1 });
    }

    if (!page) {
      page = await Page.findOne({
        slug: { $in: ["stories", "posts"] },
        status: "published"
      });
    }

    if (!page) {
      page = await Page.findOne({
        slug: { $in: ["stories", "posts"] }
      });
    }

    const defaultStoriesConfig = {
      banner: {
        type: "image",
        mediaUrl: "",
        mediaId: null,
        height: "60vh",
        heading: "Stories & Editorial Journal",
        subheading: "Thoughtful Perspectives & Chronicles",
        description: "Explore in-depth investigative reports, cultural essays, narratives, and insightful stories.",
        buttonText: "Explore Topics",
        buttonUrl: "#categories",
        headingFontSize: "2rem",
        subheadingFontSize: "0.72rem",
        descriptionFontSize: "1.05rem",
        buttonFontSize: "0.95rem",
        alignment: "left",
        verticalPosition: "center",
        overlayStrength: 0
      },
      layout: {
        sidebar: "with_sidebar"
      },
      categories: {
        heading: "Editorial Columns & Categories",
        subtitle: "Browse parent story categories to explore in-depth topics",
        perPage: 6
      },
      sidebar: {
        enabled: true,
        latestPostsCount: 5,
        videoCategoriesEnabled: true,
        galleryCategoriesEnabled: true,
        latestVideoEnabled: true
      }
    };

    if (!page) {
      return res.json({
        success: true,
        isDefault: true,
        page: {
          title: "Stories",
          slug: "stories",
          template: "stories",
          status: "published",
          templateConfig: defaultStoriesConfig
        }
      });
    }

    const rawConfig = page.templateConfig || {};
    const mergedConfig = {
      banner: { ...defaultStoriesConfig.banner, ...(rawConfig.banner || {}) },
      layout: { ...defaultStoriesConfig.layout, ...(rawConfig.layout || {}) },
      categories: { ...defaultStoriesConfig.categories, ...(rawConfig.categories || {}) },
      sidebar: { ...defaultStoriesConfig.sidebar, ...(rawConfig.sidebar || {}) }
    };

    res.json({
      success: true,
      isDefault: false,
      page: {
        ...page.toObject(),
        templateConfig: mergedConfig
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Error fetching Stories page template"
    });
  }
};


// @desc    Get Galleries Page with dynamic Template Configuration
// @route   GET /api/pages/template/galleries
// @access  Public
exports.getGalleriesPage = async (req, res) => {
  try {
    let page = await Page.findOne({
      slug: { $in: ["galleries", "gallery", "photos"] },
      template: { $in: ["galleries", "gallery"] },
      status: "published"
    });

    if (!page) {
      page = await Page.findOne({
        template: { $in: ["galleries", "gallery"] },
        status: "published"
      }).sort({ updatedAt: -1 });
    }

    if (!page) {
      page = await Page.findOne({
        slug: { $in: ["galleries", "gallery", "photos"] },
        status: "published"
      });
    }

    if (!page) {
      page = await Page.findOne({
        slug: { $in: ["galleries", "gallery", "photos"] }
      });
    }

    const defaultGalleriesConfig = {
      banner: {
        type: "image",
        mediaUrl: "",
        mediaId: null,
        height: "65vh",
        heading: "Photo Galleries & Visual Archives",
        subheading: "Curated High-Resolution Photography",
        description: "Explore curated photo albums, master galleries, and evocative visual collections.",
        buttonText: "Browse Collections",
        buttonUrl: "#categories",
        headingFontSize: "2rem",
        subheadingFontSize: "0.72rem",
        descriptionFontSize: "1rem",
        buttonFontSize: "0.95rem",
        alignment: "left",
        verticalPosition: "center",
        overlayStrength: 0.35
      },
      layout: {
        sidebar: "with_sidebar"
      },
      categories: {
        heading: "Photo Gallery Categories",
        subtitle: "Browse collections by photography theme and parent categories",
        perPage: 6
      },
      sidebar: {
        enabled: true,
        latestGalleriesCount: 5,
        latestVideosCount: 3,
        latestPostsCount: 3,
        categoriesWidgetEnabled: true
      }
    };

    if (!page) {
      return res.json({
        success: true,
        isDefault: true,
        page: {
          title: "Galleries",
          slug: "galleries",
          template: "galleries",
          status: "published",
          templateConfig: defaultGalleriesConfig
        }
      });
    }

    const rawConfig = page.templateConfig || {};
    const mergedConfig = {
      banner: { ...defaultGalleriesConfig.banner, ...(rawConfig.banner || {}) },
      layout: { ...defaultGalleriesConfig.layout, ...(rawConfig.layout || {}) },
      categories: { ...defaultGalleriesConfig.categories, ...(rawConfig.categories || {}) },
      sidebar: { ...defaultGalleriesConfig.sidebar, ...(rawConfig.sidebar || {}) }
    };

    res.json({
      success: true,
      isDefault: false,
      page: {
        ...page.toObject(),
        templateConfig: mergedConfig
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Error fetching Galleries page template"
    });
  }
};

// @desc    Duplicate page (clone as draft with unique slug)
// @route   POST /api/pages/:id/duplicate
// @access  Private (Admin, Editor)
exports.duplicatePage = async (req, res) => {
  try {
    const original = await Page.findById(req.params.id);
    if (!original) {
      return res.status(404).json({ success: false, message: "Page not found" });
    }

    const pageObj = original.toObject();
    delete pageObj._id;
    delete pageObj.id;
    delete pageObj.createdAt;
    delete pageObj.updatedAt;
    delete pageObj.__v;

    let baseSlug = `${original.slug || slugify(original.title, { lower: true, strict: true })}-copy`;
    let newSlug = baseSlug;
    let counter = 1;
    while (await Page.findOne({ slug: newSlug })) {
      newSlug = `${baseSlug}-${counter}`;
      counter++;
    }

    pageObj.title = `${original.title} (Copy)`;
    pageObj.slug = newSlug;
    pageObj.status = "draft";
    if (req.user) pageObj.author = req.user._id;

    const duplicate = await Page.create(pageObj);

    res.status(201).json({
      success: true,
      message: "Page duplicated successfully as Draft",
      page: duplicate
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || "Error duplicating page" });
  }
};

// @desc    Bulk delete pages
// @route   POST /api/pages/bulk-delete
// @access  Private (Admin, Editor)
exports.bulkDeletePages = async (req, res) => {
  try {
    const { ids, force } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: "Please provide an array of page IDs" });
    }

    if (force === true || force === "true") {
      const result = await Page.deleteMany({ _id: { $in: ids } });
      return res.json({
        success: true,
        message: `${result.deletedCount} page(s) permanently deleted`,
        deletedCount: result.deletedCount
      });
    }

    const pages = await Page.find({ _id: { $in: ids } });
    let trashedCount = 0;
    let deletedCount = 0;

    for (const page of pages) {
      if (page.status !== "trash") {
        page.status = "trash";
        await page.save();
        trashedCount++;
      } else {
        await page.deleteOne();
        deletedCount++;
      }
    }

    res.json({
      success: true,
      message: `${trashedCount + deletedCount} page(s) processed (${trashedCount} moved to trash, ${deletedCount} permanently deleted)`,
      trashedCount,
      deletedCount
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || "Error performing bulk delete" });
  }
};

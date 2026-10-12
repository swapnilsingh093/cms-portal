const Post = require('../models/Post');
const Category = require('../models/Category');
const mongoose = require('mongoose');
const slugify = require('slugify');
const path = require('path');
const {
  syncToMediaLibrary,
  safeDeleteFile,
  getUploadedFileUrl
} = require('../utils/mediaHelper');
const { getMonthDateRange, getAvailableDates } = require('../utils/dateHelper');
const { getAllCategoryDescendantIds, resolveHierarchy } = require('../utils/categoryTreeHelper');

// Helper to resolve category ID from slug or ObjectId
const resolveCategoryId = async (val, type = 'post') => {
  if (!val) return null;
  if (mongoose.Types.ObjectId.isValid(val) && String(new mongoose.Types.ObjectId(val)) === String(val)) {
    return new mongoose.Types.ObjectId(val);
  }
  const query = { slug: val };
  if (type) query.type = type;
  const found = await Category.findOne(query).select('_id');
  return found ? found._id : null;
};

// Helper to extract first image from HTML content if no featured image was provided
const extractFirstImageFromHtml = (html) => {
  if (!html || typeof html !== 'string') return '';
  const match = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  return match ? match[1] : '';
};

// @desc    Get all posts
// @route   GET /api/posts
// @access  Public
exports.getPosts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      category,
      subCategory,
      search,
      status,
      sort
    } = req.query;

    // For category / subcategory story listings, default to ascending chronological order (Part 1, Part 2, Part 3)
    let effectiveSort = sort;
    if (!effectiveSort) {
      if (category || subCategory) {
        effectiveSort = 'createdAt';
      } else {
        effectiveSort = '-createdAt';
      }
    }

    const andConditions = [];

    const isPrivilegedUser = req.user && ['admin', 'editor'].includes(req.user.role);

    // Module permission check applies ONLY to admin panel management for editors
    if (isPrivilegedUser && req.user.role === 'editor' && req.query.isAdmin === 'true') {
      if (!req.user.permissions?.posts?.view) {
        return res.status(403).json({ success: false, message: 'Access denied: You do not have permission to access posts management in admin panel.' });
      }
    }

    if (!isPrivilegedUser) {
      // Public visitors MUST only see published content with displayContent !== false
      andConditions.push({ status: 'published', displayContent: { $ne: false } });
    } else {
      // Privileged admin/editor queries
      if (status === 'trash') {
        andConditions.push({ status: 'trash' });
      } else if (status === 'draft') {
        andConditions.push({ status: 'draft' });
      } else if (status === 'all') {
        andConditions.push({ status: { $ne: 'trash' } });
      } else if (status === 'published') {
        andConditions.push({ status: 'published' });
      } else if (req.query.isAdmin === 'true') {
        andConditions.push({ status: { $ne: 'trash' } });
      } else {
        andConditions.push({ status: 'published' });
      }
    }

    const { childCategory } = req.query;
    if (childCategory) {
      const childCatId = await resolveCategoryId(childCategory, 'post');
      if (childCatId) {
        const allChildCatIds = await getAllCategoryDescendantIds(childCatId, Category);
        andConditions.push({
          $or: [
            { childCategory: { $in: allChildCatIds } },
            { subCategory: { $in: allChildCatIds } },
            { category: { $in: allChildCatIds } },
            { categories: { $in: allChildCatIds } }
          ]
        });
      } else {
        andConditions.push({ _id: null });
      }
    } else if (subCategory) {
      const subCatId = await resolveCategoryId(subCategory, 'post');
      if (subCatId) {
        const allSubCatIds = await getAllCategoryDescendantIds(subCatId, Category);
        andConditions.push({
          $or: [
            { childCategory: { $in: allSubCatIds } },
            { subCategory: { $in: allSubCatIds } },
            { category: { $in: allSubCatIds } },
            { categories: { $in: allSubCatIds } }
          ]
        });
      } else {
        andConditions.push({ _id: null });
      }
    } else if (category) {
      const catId = await resolveCategoryId(category, 'post');
      if (catId) {
        const allCatIds = await getAllCategoryDescendantIds(catId, Category);
        andConditions.push({
          $or: [
            { childCategory: { $in: allCatIds } },
            { category: { $in: allCatIds } },
            { subCategory: { $in: allCatIds } },
            { categories: { $in: allCatIds } }
          ]
        });
      } else {
        andConditions.push({ _id: null });
      }
    }

    if (search && search.trim()) {
      andConditions.push({
        $or: [
          { title: { $regex: search.trim(), $options: 'i' } },
          { excerpt: { $regex: search.trim(), $options: 'i' } },
          { content: { $regex: search.trim(), $options: 'i' } },
          { tags: { $in: [new RegExp(search.trim(), 'i')] } }
        ]
      });
    }

    const filterMonth = req.query.date || req.query.month;
    const dateRange = getMonthDateRange(filterMonth);
    if (dateRange) {
      andConditions.push({ createdAt: { $gte: dateRange.startDate, $lt: dateRange.endDate } });
    }

    const { age, maritalStatus, tags } = req.query;
    if (age) {
      const ageVals = Array.isArray(age) ? age.map(Number) : String(age).split(',').map(s => Number(s.trim())).filter(n => !isNaN(n));
      if (ageVals.length > 0) {
        andConditions.push({ age: { $in: ageVals } });
      }
    }

    if (maritalStatus && maritalStatus !== 'all' && maritalStatus !== '') {
      andConditions.push({ maritalStatus: maritalStatus.trim().toLowerCase() });
    }

    if (tags) {
      const tagList = Array.isArray(tags) ? tags : String(tags).split(',').map(t => t.trim()).filter(Boolean);
      if (tagList.length > 0) {
        andConditions.push({ tags: { $in: tagList } });
      }
    }

    const { author } = req.query;
    if (author) {
      andConditions.push({ author });
    }

    const query = andConditions.length > 0 ? { $and: andConditions } : {};

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Post.countDocuments(query);

    const posts = await Post.find(query)
      .populate({
        path: 'category',
        select: 'name slug thumbnail parentCategory',
        populate: { path: 'parentCategory', select: 'name slug' }
      })
      .populate({
        path: 'subCategory',
        select: 'name slug thumbnail parentCategory',
        populate: { path: 'parentCategory', select: 'name slug' }
      })
      .populate('childCategory', 'name slug thumbnail')
      .populate({
        path: 'categories',
        select: 'name slug parentCategory',
        populate: { path: 'parentCategory', select: 'name slug' }
      })
      .populate('author', 'name email avatar')
      .sort(effectiveSort)
      .skip(skip)
      .limit(Number(limit));

    // Ensure story episodes/parts are in sequential order (Part 1, Part 2, Part 3)
    if ((category || subCategory) && (!sort || sort === 'createdAt' || sort === 'asc')) {
      posts.sort((a, b) => {
        if (a.order !== undefined && b.order !== undefined && a.order !== b.order) {
          return a.order - b.order;
        }
        return (a.title || '').localeCompare(b.title || '', undefined, { numeric: true, sensitivity: 'base' });
      });
    }

    const [allCount, publishedCount, draftCount, trashCount, availableDates] = await Promise.all([
      Post.countDocuments({ status: { $ne: 'trash' } }),
      Post.countDocuments({ status: 'published' }),
      Post.countDocuments({ status: 'draft' }),
      Post.countDocuments({ status: 'trash' }),
      getAvailableDates(Post)
    ]);

    res.json({
      success: true,
      count: posts.length,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)) || 1,
      availableDates,
      statusCounts: {
        all: allCount,
        published: publishedCount,
        draft: draftCount,
        trash: trashCount
      },
      posts
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching posts'
    });
  }
};

// @desc    Get single post by slug or ID
// @route   GET /api/posts/:slug
// @access  Public
exports.getPostBySlug = async (req, res) => {
  try {
    const isId = mongoose.isValidObjectId(req.params.slug);
    const query = isId
      ? { $or: [{ slug: req.params.slug }, { _id: req.params.slug }] }
      : { slug: req.params.slug };

    const post = await Post.findOne(query)
      .populate({
        path: 'category',
        select: 'name slug thumbnail banner parentCategory',
        populate: {
          path: 'parentCategory',
          select: 'name slug thumbnail banner parentCategory',
          populate: { path: 'parentCategory', select: 'name slug' }
        }
      })
      .populate({
        path: 'subCategory',
        select: 'name slug thumbnail banner parentCategory',
        populate: {
          path: 'parentCategory',
          select: 'name slug thumbnail banner parentCategory',
          populate: { path: 'parentCategory', select: 'name slug' }
        }
      })
      .populate({
        path: 'childCategory',
        select: 'name slug thumbnail banner parentCategory',
        populate: { path: 'parentCategory', select: 'name slug' }
      })
      .populate({
        path: 'categories',
        select: 'name slug thumbnail banner parentCategory',
        populate: { path: 'parentCategory', select: 'name slug' }
      })
      .populate('author', 'name avatar bio');

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // Security & WordPress draft behavior:
    // If post is in Draft or Trash, only logged-in Admin or Editor can preview it!
    if (post.status !== 'published') {
      const isPrivileged = req.user && ['admin', 'editor'].includes(req.user.role);
      if (!isPrivileged) {
        return res.status(404).json({
          success: false,
          message: 'Post not found or is currently in draft'
        });
      }
    }

    // Increment views only for published posts viewed by public
    if (!req.query.noCount && post.status === 'published') {
      post.views = (post.views || 0) + 1;
      await post.save();
    }

    res.json({
      success: true,
      post
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching post'
    });
  }
};

// @desc    Create new post / story with rich HTML content & attached video
// @route   POST /api/posts
// @access  Private (Admin / Editor)
exports.createPost = async (req, res) => {
  try {
    const {
      title,
      slug: bodySlug,
      excerpt,
      content,
      category,
      subCategory,
      childCategory,
      tags,
      status,
      isFeatured,
      featuredImage: bodyImage,
      banner: bodyBanner,
      videoUrl: bodyVideoUrl,
      videoType: bodyVideoType
    } = req.body;

    const effectiveTitle = (title && title.trim()) ? title.trim() : 'Untitled Post';

    let finalFeaturedImage = bodyImage || '';
    let finalBanner = bodyBanner || '';
    let finalVideoUrl = bodyVideoUrl || '';
    let finalVideoType = bodyVideoType || (finalVideoUrl ? 'media' : 'none');

    if (req.files) {
      if (req.files.featuredImage && req.files.featuredImage[0]) {
        const file = req.files.featuredImage[0];
        finalFeaturedImage = getUploadedFileUrl(file, 'images');
        await syncToMediaLibrary({
          filename: file.filename,
          originalName: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
          url: finalFeaturedImage,
          mediaType: 'image',
          uploadedBy: req.user ? req.user._id : null
        });
      }
      if (req.files.banner && req.files.banner[0]) {
        const file = req.files.banner[0];
        finalBanner = getUploadedFileUrl(file, 'banners');
        await syncToMediaLibrary({
          filename: file.filename,
          originalName: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
          url: finalBanner,
          mediaType: 'image',
          uploadedBy: req.user ? req.user._id : null
        });
      }
      if (req.files.video && req.files.video[0]) {
        const file = req.files.video[0];
        finalVideoUrl = getUploadedFileUrl(file, 'videos');
        finalVideoType = 'upload';
        await syncToMediaLibrary({
          filename: file.filename,
          originalName: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
          url: finalVideoUrl,
          mediaType: 'video',
          uploadedBy: req.user ? req.user._id : null
        });
      }
    }

    // Auto-generate thumbnail from content image if none uploaded
    if (!finalFeaturedImage) {
      const extractedImg = extractFirstImageFromHtml(content);
      if (extractedImg) {
        finalFeaturedImage = extractedImg;
      }
    }

    const resolvedHierarchy = await resolveHierarchy({ category, subCategory, childCategory, categories: req.body.categories }, Category);

    let processedTags = [];
    if (tags) {
      processedTags = Array.isArray(tags)
        ? tags
        : tags.split(',').map((t) => t.trim()).filter(Boolean);
    }

    // Generate unique slug if needed
    let cleanSlug = bodySlug
      ? slugify(bodySlug, { lower: true, strict: true })
      : slugify(effectiveTitle, { lower: true, strict: true });
    
    // Check if slug exists
    let slugCandidate = cleanSlug || `post-${Date.now()}`;
    let counter = 1;
    while (await Post.findOne({ slug: slugCandidate })) {
      slugCandidate = `${cleanSlug || 'post'}-${counter}`;
      counter++;
    }

    let parsedAge = [];
    if (req.body.age !== undefined) {
      try {
        const p = typeof req.body.age === 'string' ? JSON.parse(req.body.age) : req.body.age;
        parsedAge = Array.isArray(p) ? p.map(Number).filter(n => !isNaN(n)) : [];
      } catch (e) {
        parsedAge = String(req.body.age).split(',').map(s => Number(s.trim())).filter(n => !isNaN(n));
      }
    }
    const parsedMaritalStatus = req.body.maritalStatus !== undefined ? String(req.body.maritalStatus).trim().toLowerCase() : '';

    const hasContent = Boolean(
      (content && content.replace(/<[^>]*>/g, '').trim()) ||
      (excerpt && excerpt.trim()) ||
      (req.body.shortDescription && req.body.shortDescription.trim()) ||
      finalFeaturedImage ||
      finalBanner ||
      finalVideoUrl ||
      (req.files && (req.files.featuredImage || req.files.banner || req.files.video))
    );
    const effectiveStatus = hasContent ? (status || 'published') : 'draft';

    const post = await Post.create({
      title: effectiveTitle,
      slug: slugCandidate,
      excerpt: req.body.shortDescription || excerpt || '',
      shortDescription: req.body.shortDescription || excerpt || '',
      content: content || '',
      featuredImage: finalFeaturedImage,
      banner: finalBanner,
      bannerType: req.body.bannerType || 'image',
      bannerVideo: req.body.bannerVideo || '',
      overlayStrength: req.body.overlayStrength !== undefined ? Number(req.body.overlayStrength) : 0,
      alignment: req.body.alignment || 'left',
      verticalPosition: req.body.verticalPosition || 'center',
      bannerPosition: req.body.bannerPosition || 'center',
      bannerHeight: req.body.bannerHeight || '50vh',
      videoUrl: finalVideoUrl,
      videoType: finalVideoType,
      category: resolvedHierarchy.category,
      subCategory: resolvedHierarchy.subCategory,
      childCategory: resolvedHierarchy.childCategory,
      categories: resolvedHierarchy.categories,
      tags: processedTags,
      age: parsedAge,
      maritalStatus: parsedMaritalStatus,
      status: effectiveStatus,
      isFeatured: isFeatured === 'true' || isFeatured === true,
      featuredOnHomeBanner: req.body.featuredOnHomeBanner === 'true' || req.body.featuredOnHomeBanner === true,
      author: req.body.author || (req.user ? req.user._id : null),
      screenOptions: req.body.screenOptions !== undefined
        ? (typeof req.body.screenOptions === 'string' ? JSON.parse(req.body.screenOptions) : req.body.screenOptions)
        : {},
      layout: req.body.layout || 'default',
      bookPaperColor: req.body.bookPaperColor || '#fcfaf2',
      bookCoverColor: req.body.bookCoverColor || '#18181b',
      bookTextColor: req.body.bookTextColor || '#2c2523',
      bookFontFamily: req.body.bookFontFamily || 'serif',
      bookPaperImage: req.body.bookPaperImage || ''
    });

    // Uncheck previous posts so newest created post automatically takes the spotlight on home banner
    const { setExclusiveHomeBanner } = require('../utils/homeBannerHelper');
    await setExclusiveHomeBanner('post', post._id);
    post.featuredOnHomeBanner = true;
    await post.save();

    const populated = await Post.findById(post._id)
      .populate('category', 'name slug')
      .populate('subCategory', 'name slug')
      .populate('childCategory', 'name slug');

    res.status(201).json({
      success: true,
      message: 'Post created successfully!',
      post: populated
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error creating post'
    });
  }
};

// @desc    Update post (including attached video changes without hanging!)
// @route   PUT /api/posts/:id
// @access  Private (Admin / Editor)
exports.updatePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    const {
      title,
      slug,
      excerpt,
      content,
      category,
      subCategory,
      childCategory,
      tags,
      status,
      isFeatured,
      featuredImage,
      banner,
      videoUrl,
      videoType
    } = req.body;

    if (title) post.title = title;
    if (excerpt !== undefined) post.excerpt = excerpt;
    if (req.body.shortDescription !== undefined) {
      post.shortDescription = req.body.shortDescription;
      if (!excerpt) post.excerpt = req.body.shortDescription;
    }
    if (content !== undefined) post.content = content;
    if (status) post.status = status;
    if (isFeatured !== undefined) post.isFeatured = isFeatured === 'true' || isFeatured === true;
    if (req.body.featuredOnHomeBanner !== undefined) {
      const isHomeFeatured = req.body.featuredOnHomeBanner === 'true' || req.body.featuredOnHomeBanner === true;
      post.featuredOnHomeBanner = isHomeFeatured;
      if (isHomeFeatured) {
        const { setExclusiveHomeBanner } = require('../utils/homeBannerHelper');
        await setExclusiveHomeBanner('post', post._id);
      }
    }
    if (req.body.bannerPosition !== undefined) post.bannerPosition = req.body.bannerPosition;
    if (req.body.bannerHeight !== undefined) post.bannerHeight = req.body.bannerHeight;
    if (req.body.bannerType !== undefined) post.bannerType = req.body.bannerType;
    if (req.body.bannerVideo !== undefined) post.bannerVideo = req.body.bannerVideo;
    if (req.body.overlayStrength !== undefined) post.overlayStrength = Number(req.body.overlayStrength);
    if (req.body.alignment !== undefined) post.alignment = req.body.alignment;
    if (req.body.verticalPosition !== undefined) post.verticalPosition = req.body.verticalPosition;

    // Handle custom slug update
    if (slug !== undefined && slug.trim()) {
      const cleanSlug = slugify(slug, { lower: true, strict: true });
      const duplicate = await Post.findOne({ slug: cleanSlug, _id: { $ne: post._id } });
      if (!duplicate) {
        post.slug = cleanSlug;
      }
    }

    if (category !== undefined || subCategory !== undefined || childCategory !== undefined || req.body.categories !== undefined) {
      const resolvedHierarchy = await resolveHierarchy({
        category: category !== undefined ? category : post.category,
        subCategory: subCategory !== undefined ? subCategory : post.subCategory,
        childCategory: childCategory !== undefined ? childCategory : post.childCategory,
        categories: req.body.categories !== undefined ? req.body.categories : post.categories
      }, Category);
      post.category = resolvedHierarchy.category;
      post.subCategory = resolvedHierarchy.subCategory;
      post.childCategory = resolvedHierarchy.childCategory;
      post.categories = resolvedHierarchy.categories;
    }

    if (tags !== undefined) {
      post.tags = Array.isArray(tags)
        ? tags
        : tags.split(',').map((t) => t.trim()).filter(Boolean);
    }

    if (req.body.age !== undefined) {
      try {
        const p = typeof req.body.age === 'string' ? JSON.parse(req.body.age) : req.body.age;
        post.age = Array.isArray(p) ? p.map(Number).filter(n => !isNaN(n)) : [];
      } catch (e) {
        post.age = String(req.body.age).split(',').map(s => Number(s.trim())).filter(n => !isNaN(n));
      }
    }

    if (req.body.maritalStatus !== undefined) {
      post.maritalStatus = String(req.body.maritalStatus).trim().toLowerCase();
    }

        // Process file uploads
    let bannerFileUpdated = false;
    let featuredImageFileUpdated = false;
    let videoFileUpdated = false;

    if (req.files) {
      if (req.files.featuredImage && req.files.featuredImage[0]) {
        const file = req.files.featuredImage[0];
        post.featuredImage = getUploadedFileUrl(file, 'images');
        await syncToMediaLibrary({ filename: file.filename, originalName: file.originalname, mimeType: file.mimetype, size: file.size, url: post.featuredImage, mediaType: 'image', uploadedBy: req.user ? req.user._id : null });
        featuredImageFileUpdated = true;
      }
      if (req.files.banner && req.files.banner[0]) {
        const file = req.files.banner[0];
        post.banner = getUploadedFileUrl(file, 'banners');
        await syncToMediaLibrary({ filename: file.filename, originalName: file.originalname, mimeType: file.mimetype, size: file.size, url: post.banner, mediaType: 'image', uploadedBy: req.user ? req.user._id : null });
        bannerFileUpdated = true;
      }
      if (req.files.video && req.files.video[0]) {
        const file = req.files.video[0];
        post.videoUrl = getUploadedFileUrl(file, 'videos');
        post.videoType = 'upload';
        await syncToMediaLibrary({ filename: file.filename, originalName: file.originalname, mimeType: file.mimetype, size: file.size, url: post.videoUrl, mediaType: 'video', uploadedBy: req.user ? req.user._id : null });
        videoFileUpdated = true;
      }
    }
    
    if (!featuredImageFileUpdated && featuredImage !== undefined) post.featuredImage = featuredImage;
    if (!bannerFileUpdated && banner !== undefined) post.banner = banner;


    // Handle attached video reference update (e.g. from Media Library or string URL)
    if (videoUrl !== undefined) {
      post.videoUrl = videoUrl;
      post.videoType = videoType || (videoUrl ? 'media' : 'none');
    }

    if (req.body.author !== undefined && req.body.author) {
      post.author = req.body.author;
    }

    if (req.body.displayContent !== undefined) {
      post.displayContent = req.body.displayContent === true || req.body.displayContent === 'true';
    }
    if (req.body.bannerMedia !== undefined) {
      post.bannerMedia = req.body.bannerMedia || null;
    }
    if (req.body.layout !== undefined) {
      post.layout = req.body.layout;
    }
    if (req.body.bookPaperColor !== undefined) {
      post.bookPaperColor = req.body.bookPaperColor;
    }
    if (req.body.bookCoverColor !== undefined) {
      post.bookCoverColor = req.body.bookCoverColor;
    }
    if (req.body.bookTextColor !== undefined) {
      post.bookTextColor = req.body.bookTextColor;
    }
    if (req.body.bookFontFamily !== undefined) {
      post.bookFontFamily = req.body.bookFontFamily;
    }
    if (req.body.bookPaperImage !== undefined) {
      post.bookPaperImage = req.body.bookPaperImage;
    }

    if (req.body.screenOptions !== undefined) {
      try {
        post.screenOptions = typeof req.body.screenOptions === 'string'
          ? JSON.parse(req.body.screenOptions)
          : req.body.screenOptions;
        post.markModified('screenOptions');
      } catch (e) {
        post.screenOptions = req.body.screenOptions;
      }
    }

    // Only fallback if featuredImage wasn't explicitly cleared by user
    if (!post.featuredImage && post.content && featuredImage !== '') {
      const extractedImg = extractFirstImageFromHtml(post.content);
      if (extractedImg) post.featuredImage = extractedImg;
    }

    await post.save();

    const populated = await Post.findById(post._id)
      .populate('category', 'name slug')
      .populate('subCategory', 'name slug')
      .populate('childCategory', 'name slug');

    res.json({
      success: true,
      message: 'Post updated successfully!',
      post: populated
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error updating post'
    });
  }
};

// @desc    Delete post (Trash or Permanent)
// @route   DELETE /api/posts/:id
// @access  Private (Admin / Editor)
exports.deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    const { force } = req.query;

    if (post.status !== 'trash' && force !== 'true') {
      post.status = 'trash';
      await post.save();
      return res.json({
        success: true,
        message: 'Post moved to Trash'
      });
    }

            
    await post.deleteOne();

    res.json({
      success: true,
      message: 'Post permanently deleted'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error deleting post'
    });
  }
};

// @desc    Restore post from Trash
// @route   PUT /api/posts/:id/restore
// @access  Private (Admin / Editor)
exports.restorePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    post.status = 'draft';
    await post.save();

    res.json({
      success: true,
      message: 'Post restored from Trash to Drafts',
      post
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error restoring post'
    });
  }
};

// @desc    Duplicate post (clone as draft with unique slug)
// @route   POST /api/posts/:id/duplicate
// @access  Private (Admin, Editor)
exports.duplicatePost = async (req, res) => {
  try {
    const original = await Post.findById(req.params.id);
    if (!original) {
      return res.status(404).json({ success: false, message: "Post not found" });
    }

    const postObj = original.toObject();
    delete postObj._id;
    delete postObj.id;
    delete postObj.createdAt;
    delete postObj.updatedAt;
    delete postObj.__v;

    let baseSlug = `${original.slug || slugify(original.title, { lower: true, strict: true })}-copy`;
    let newSlug = baseSlug;
    let counter = 1;
    while (await Post.findOne({ slug: newSlug })) {
      newSlug = `${baseSlug}-${counter}`;
      counter++;
    }

    postObj.title = `${original.title} (Copy)`;
    postObj.slug = newSlug;
    postObj.status = "draft";
    postObj.views = 0;
    postObj.likes = 0;
    if (req.user) postObj.author = req.user._id;

    const duplicate = await Post.create(postObj);

    res.status(201).json({
      success: true,
      message: "Post duplicated successfully as Draft",
      post: duplicate
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || "Error duplicating post" });
  }
};

// @desc    Bulk delete posts
// @route   POST /api/posts/bulk-delete
// @access  Private (Admin, Editor)
exports.bulkDeletePosts = async (req, res) => {
  try {
    const { ids, force } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: "Please provide an array of post IDs" });
    }

    if (force === true || force === "true") {
      const result = await Post.deleteMany({ _id: { $in: ids } });
      return res.json({
        success: true,
        message: `${result.deletedCount} posts permanently deleted`,
        deletedCount: result.deletedCount
      });
    }

    const posts = await Post.find({ _id: { $in: ids } });
    let trashedCount = 0;
    let deletedCount = 0;

    for (const post of posts) {
      if (post.status !== "trash") {
        post.status = "trash";
        await post.save();
        trashedCount++;
      } else {
        await post.deleteOne();
        deletedCount++;
      }
    }

    res.json({
      success: true,
      message: `${trashedCount + deletedCount} post(s) processed (${trashedCount} moved to trash, ${deletedCount} permanently deleted)`,
      trashedCount,
      deletedCount
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || "Error performing bulk delete" });
  }
};

// @desc    Import document (.docx or .pages) into Post
// @route   POST /api/posts/import-doc
// @access  Private (Admin, Editor)
exports.importPostDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload a .docx or .pages document' });
    }

    const { autoCreate, status = 'draft', category, subCategory } = req.body;
    const { importDocument } = require('../utils/documentConverter');
    const parsedData = await importDocument(req.file.path, req.file.originalname, req.user);

    if (autoCreate === 'true' || autoCreate === true) {
      let uniqueSlug = slugify(parsedData.title || 'post', { lower: true, strict: true }) || 'story';
      const existing = await Post.findOne({ slug: uniqueSlug });
      if (existing) {
        uniqueSlug = `${uniqueSlug}-${Date.now().toString().slice(-4)}`;
      }

      const newPost = await Post.create({
        title: parsedData.title,
        slug: uniqueSlug,
        content: parsedData.content,
        shortDescription: parsedData.excerpt,
        featuredImage: parsedData.featuredImage || '',
        category: category || null,
        subCategory: subCategory || null,
        status: status || 'draft',
        author: req.user?._id
      });

      return res.status(201).json({
        success: true,
        message: 'Document imported and post created successfully!',
        post: newPost,
        parsedData
      });
    }

    // Return parsed data to populate editor
    res.json({
      success: true,
      message: 'Document parsed successfully with embedded images extracted!',
      parsedData
    });
  } catch (error) {
    console.error('Error importing document:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to import document'
    });
  }
};

// @desc    Export post to .docx or .pages
// @route   GET /api/posts/:id/export
// @access  Public / Protected
exports.exportPostDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const { format = 'docx' } = req.query;

    const post = await Post.findById(id)
      .populate('category', 'name slug')
      .populate('subCategory', 'name slug')
      .populate('author', 'name email');

    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    const { exportDocument } = require('../utils/documentConverter');
    const exportResult = await exportDocument(post, format);

    res.setHeader('Content-Type', exportResult.mimeType);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${encodeURIComponent(exportResult.filename)}"`
    );
    res.send(exportResult.buffer);
  } catch (error) {
    console.error('Error exporting post document:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to export document'
    });
  }
};

// @desc    Export raw editor content to .docx or .pages (direct download from editor)
// @route   POST /api/posts/export-raw
// @access  Private (Admin, Editor)
exports.exportRawPostDocument = async (req, res) => {
  try {
    const { title, content, featuredImage, format = 'docx', categoryName } = req.body;

    const pseudoPost = {
      title: title || 'Untitled Story',
      slug: slugify(title || 'story', { lower: true, strict: true }) || 'story',
      content: content || '',
      featuredImage: featuredImage || '',
      category: { name: categoryName || 'General' },
      author: { name: req.user?.name || 'Editorial Team' },
      createdAt: new Date()
    };

    const { exportDocument } = require('../utils/documentConverter');
    const exportResult = await exportDocument(pseudoPost, format);

    res.setHeader('Content-Type', exportResult.mimeType);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${encodeURIComponent(exportResult.filename)}"`
    );
    res.send(exportResult.buffer);
  } catch (error) {
    console.error('Error exporting raw post document:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to export document'
    });
  }
};

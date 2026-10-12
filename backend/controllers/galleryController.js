const Gallery = require('../models/Gallery');
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
const resolveCategoryId = async (val, type = 'gallery') => {
  if (!val) return null;
  if (mongoose.Types.ObjectId.isValid(val) && String(new mongoose.Types.ObjectId(val)) === String(val)) {
    return new mongoose.Types.ObjectId(val);
  }
  const query = { slug: val };
  if (type) query.type = type;
  const found = await Category.findOne(query).select('_id');
  return found ? found._id : null;
};

// @desc    Get all galleries
// @route   GET /api/galleries
// @access  Public
exports.getGalleries = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      category,
      subCategory,
      search,
      status,
      sort = '-createdAt'
    } = req.query;

    const isPrivilegedUser = req.user && ['admin', 'editor'].includes(req.user.role);

    // Module permission check applies ONLY to admin panel management for editors
    if (isPrivilegedUser && req.user.role === 'editor' && req.query.isAdmin === 'true') {
      if (!req.user.permissions?.galleries?.view) {
        return res.status(403).json({ success: false, message: 'Access denied: You do not have permission to access galleries management in admin panel.' });
      }
    }

    const andConditions = [];

    // Status & Visibility filter
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
      const childCatId = await resolveCategoryId(childCategory, 'gallery');
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
      const subCatId = await resolveCategoryId(subCategory, 'gallery');
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
      const catId = await resolveCategoryId(category, 'gallery');
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
          { description: { $regex: search.trim(), $options: 'i' } },
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
    const total = await Gallery.countDocuments(query);

    const galleries = await Gallery.find(query)
      .populate({
        path: 'category',
        select: 'name slug thumbnail banner parentCategory',
        populate: { path: 'parentCategory', select: 'name slug' }
      })
      .populate({
        path: 'subCategory',
        select: 'name slug thumbnail banner parentCategory',
        populate: { path: 'parentCategory', select: 'name slug' }
      })
      .populate('childCategory', 'name slug thumbnail banner')
      .populate({
        path: 'categories',
        select: 'name slug parentCategory',
        populate: { path: 'parentCategory', select: 'name slug' }
      })
      .populate('author', 'name avatar')
      .sort(sort)
      .skip(skip)
      .limit(Number(limit));

    // Calculate status counts for WordPress-style tabs
    const [allCount, publishedCount, draftCount, trashCount, availableDates] = await Promise.all([
      Gallery.countDocuments({ status: { $ne: 'trash' } }),
      Gallery.countDocuments({ status: 'published' }),
      Gallery.countDocuments({ status: 'draft' }),
      Gallery.countDocuments({ status: 'trash' }),
      getAvailableDates(Gallery)
    ]);

    res.json({
      success: true,
      count: galleries.length,
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
      galleries
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching galleries'
    });
  }
};

// @desc    Get single gallery by slug
// @route   GET /api/galleries/:slug
// @access  Public
exports.getGalleryBySlug = async (req, res) => {
  try {
    const isId = mongoose.isValidObjectId(req.params.slug);
    const query = isId ? { _id: req.params.slug } : { slug: req.params.slug };
    const gallery = await Gallery.findOne(query)
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
      .populate('author', 'name avatar');

    if (!gallery) {
      return res.status(404).json({
        success: false,
        message: 'Gallery not found'
      });
    }

    // Security & WordPress draft behavior:
    // If gallery is in Draft or Trash, only logged-in Admin or Editor can preview it!
    if (gallery.status !== 'published') {
      const isPrivileged = req.user && ['admin', 'editor'].includes(req.user.role);
      if (!isPrivileged) {
        return res.status(404).json({
          success: false,
          message: 'Gallery not found or is currently in draft'
        });
      }
    }

    // Increment views only for published galleries viewed by public
    if (!req.query.noCount && gallery.status === 'published') {
      gallery.views += 1;
      await gallery.save();
    }

    res.json({
      success: true,
      gallery
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching gallery'
    });
  }
};

// @desc    Create new gallery with multi-image drag-and-drop upload
// @route   POST /api/galleries
// @access  Private (Admin / Editor)
exports.createGallery = async (req, res) => {
  try {
    const {
      title,
      slug,
      description,
      category,
      subCategory,
      childCategory,
      tags,
      status,
      isFeatured,
      coverImage: bodyCover
    } = req.body;

    const effectiveTitle = (title && title.trim()) ? title.trim() : 'Untitled Gallery';

    let finalCover = bodyCover || '';
    let finalBanner = req.body.banner || '';
    let finalBannerMedia = req.body.bannerMedia || null;
    let uploadedImages = [];

    // Multi-file upload processing
    if (req.files) {
      // Cover image field
      if (req.files.coverImage && req.files.coverImage[0]) {
        const file = req.files.coverImage[0];
        finalCover = getUploadedFileUrl(file, 'banners');
        await syncToMediaLibrary({
          filename: file.filename,
          originalName: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
          url: finalCover,
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

      // Drag and drop images
      if (req.files.galleryImages) {
        for (let i = 0; i < req.files.galleryImages.length; i++) {
          const file = req.files.galleryImages[i];
          const imgUrl = getUploadedFileUrl(file, 'galleries');
          uploadedImages.push({
            url: imgUrl,
            title: file.originalname,
            caption: '',
            size: file.size,
            order: i
          });
          // Sync each photo to Media Library
          await syncToMediaLibrary({
            filename: file.filename,
            originalName: file.originalname,
            mimeType: file.mimetype,
            size: file.size,
            url: imgUrl,
            mediaType: 'image',
            uploadedBy: req.user ? req.user._id : null
          });
        }
      }
    }

    // Parse any images passed in body (e.g. from Media Library or unified upload)
    let parsedBodyImages = [];
    if (req.body.images) {
      try {
        parsedBodyImages = typeof req.body.images === 'string' ? JSON.parse(req.body.images) : req.body.images;
      } catch (e) {
        console.error('Failed to parse body images:', e.message);
      }
    }

    const allGalleryImages = [...parsedBodyImages, ...uploadedImages];

    // Automatic Gallery Thumbnail Generation:
    // If admin forgets to add a cover/thumbnail, automatically use the first image
    if (!finalCover && allGalleryImages.length > 0) {
      finalCover = allGalleryImages[0].url;
    }

    const resolvedHierarchy = await resolveHierarchy({ category, subCategory, childCategory, categories: req.body.categories }, Category);

    let processedTags = [];
    if (tags) {
      processedTags = Array.isArray(tags)
        ? tags
        : tags.split(',').map((t) => t.trim()).filter(Boolean);
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
      (allGalleryImages && allGalleryImages.length > 0) ||
      finalCover ||
      finalBanner ||
      (description && description.trim()) ||
      (req.body.shortDescription && req.body.shortDescription.trim()) ||
      (req.files && (req.files.galleryImages || req.files.coverImage || req.files.banner))
    );
    const effectiveStatus = hasContent ? (status || 'published') : 'draft';

    const galleryData = {
      title: effectiveTitle,
      description: description || '',
      shortDescription: req.body.shortDescription || '',
      displayContent: req.body.displayContent !== undefined ? (req.body.displayContent === true || req.body.displayContent === 'true') : true,
      banner: finalBanner,
      bannerType: req.body.bannerType || 'image',
      bannerVideo: req.body.bannerVideo || '',
      overlayStrength: req.body.overlayStrength !== undefined ? Number(req.body.overlayStrength) : 0,
      alignment: req.body.alignment || 'left',
      verticalPosition: req.body.verticalPosition || 'center',
      bannerMedia: finalBannerMedia,
      bannerPosition: req.body.bannerPosition || 'center',
      bannerHeight: req.body.bannerHeight || '50vh',
      coverImage: finalCover,
      images: allGalleryImages,
      category: resolvedHierarchy.category,
      subCategory: resolvedHierarchy.subCategory,
      childCategory: resolvedHierarchy.childCategory,
      categories: resolvedHierarchy.categories,
      tags: processedTags,
      age: parsedAge,
      maritalStatus: parsedMaritalStatus,
      status: effectiveStatus,
      layout: req.body.layout === 'without_sidebar' ? 'without_sidebar' : 'with_sidebar',
      showSidebar: req.body.showSidebar !== undefined ? (req.body.showSidebar === true || req.body.showSidebar === 'true') : true,
      isFeatured: isFeatured === 'true' || isFeatured === true,
      featuredOnHomeBanner: req.body.featuredOnHomeBanner === 'true' || req.body.featuredOnHomeBanner === true,
      screenOptions: req.body.screenOptions !== undefined
        ? (typeof req.body.screenOptions === 'string' ? JSON.parse(req.body.screenOptions) : req.body.screenOptions)
        : {},
      author: req.body.author || (req.user ? req.user._id : null)
    };

    if (slug && slug.trim()) {
      galleryData.slug = slugify(slug.trim(), { lower: true, strict: true });
    }

    const gallery = await Gallery.create(galleryData);

    // Uncheck previous galleries so newest created gallery automatically takes the spotlight on home banner
    const { setExclusiveHomeBanner } = require('../utils/homeBannerHelper');
    await setExclusiveHomeBanner('gallery', gallery._id);
    gallery.featuredOnHomeBanner = true;
    await gallery.save();

    const populated = await Gallery.findById(gallery._id)
      .populate('category', 'name slug')
      .populate('subCategory', 'name slug')
      .populate('childCategory', 'name slug');

    res.status(201).json({
      success: true,
      message: 'Photo gallery created successfully!',
      gallery: populated
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error creating gallery'
    });
  }
};

// @desc    Update gallery (add images, reorder, update details)
// @route   PUT /api/galleries/:id
// @access  Private (Admin / Editor)
exports.updateGallery = async (req, res) => {
  try {
    const gallery = await Gallery.findById(req.params.id);
    if (!gallery) {
      return res.status(404).json({
        success: false,
        message: 'Gallery not found'
      });
    }

    const {
      title,
      slug,
      description,
      category,
      subCategory,
      childCategory,
      tags,
      status,
      isFeatured,
      coverImage,
      existingImages
    } = req.body;

    if (title) gallery.title = title;
    if (slug && slug.trim()) {
      gallery.slug = slugify(slug.trim(), { lower: true, strict: true });
    }
    if (description !== undefined) gallery.description = description;
    if (req.body.shortDescription !== undefined) gallery.shortDescription = req.body.shortDescription;
    if (status) gallery.status = status;
    if (isFeatured !== undefined) gallery.isFeatured = isFeatured === 'true' || isFeatured === true;
    if (req.body.featuredOnHomeBanner !== undefined) {
      const isHomeFeatured = req.body.featuredOnHomeBanner === 'true' || req.body.featuredOnHomeBanner === true;
      gallery.featuredOnHomeBanner = isHomeFeatured;
      if (isHomeFeatured) {
        const { setExclusiveHomeBanner } = require('../utils/homeBannerHelper');
        await setExclusiveHomeBanner('gallery', gallery._id);
      }
    }
    if (req.body.layout !== undefined) {
      gallery.layout = req.body.layout === 'without_sidebar' ? 'without_sidebar' : 'with_sidebar';
    }
    if (req.body.showSidebar !== undefined) {
      gallery.showSidebar = req.body.showSidebar === true || req.body.showSidebar === 'true';
    }
    if (req.body.bannerPosition !== undefined) gallery.bannerPosition = req.body.bannerPosition;
    if (req.body.bannerHeight !== undefined) gallery.bannerHeight = req.body.bannerHeight;
    if (req.body.bannerType !== undefined) gallery.bannerType = req.body.bannerType;
    if (req.body.bannerVideo !== undefined) gallery.bannerVideo = req.body.bannerVideo;
    if (req.body.overlayStrength !== undefined) gallery.overlayStrength = Number(req.body.overlayStrength);
    if (req.body.alignment !== undefined) gallery.alignment = req.body.alignment;
    if (req.body.verticalPosition !== undefined) gallery.verticalPosition = req.body.verticalPosition;

    if (category !== undefined || subCategory !== undefined || childCategory !== undefined || req.body.categories !== undefined) {
      const resolvedHierarchy = await resolveHierarchy({
        category: category !== undefined ? category : gallery.category,
        subCategory: subCategory !== undefined ? subCategory : gallery.subCategory,
        childCategory: childCategory !== undefined ? childCategory : gallery.childCategory,
        categories: req.body.categories !== undefined ? req.body.categories : gallery.categories
      }, Category);
      gallery.category = resolvedHierarchy.category;
      gallery.subCategory = resolvedHierarchy.subCategory;
      gallery.childCategory = resolvedHierarchy.childCategory;
      gallery.categories = resolvedHierarchy.categories;
    }

    if (tags !== undefined) {
      gallery.tags = Array.isArray(tags)
        ? tags
        : tags.split(',').map((t) => t.trim()).filter(Boolean);
    }

    if (req.body.author !== undefined && req.body.author) {
      gallery.author = req.body.author;
    }

    if (req.body.age !== undefined) {
      try {
        const p = typeof req.body.age === 'string' ? JSON.parse(req.body.age) : req.body.age;
        gallery.age = Array.isArray(p) ? p.map(Number).filter(n => !isNaN(n)) : [];
      } catch (e) {
        gallery.age = String(req.body.age).split(',').map(s => Number(s.trim())).filter(n => !isNaN(n));
      }
    }

    if (req.body.maritalStatus !== undefined) {
      gallery.maritalStatus = String(req.body.maritalStatus).trim().toLowerCase();
    }

    // Process retained images
    let updatedImages = [];
    const imagesSource = req.body.images || existingImages;
    if (imagesSource) {
      try {
        updatedImages = typeof imagesSource === 'string' ? JSON.parse(imagesSource) : imagesSource;
      } catch (e) {
        console.error('Failed to parse images JSON:', e.message);
      }
    } else {
      updatedImages = gallery.images;
    }

    // Process new uploaded files
    if (req.files) {
      if (req.files.coverImage && req.files.coverImage[0]) {
        const file = req.files.coverImage[0];
        gallery.coverImage = getUploadedFileUrl(file, 'banners');
        await syncToMediaLibrary({
          filename: file.filename,
          originalName: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
          url: gallery.coverImage,
          mediaType: 'image',
          uploadedBy: req.user ? req.user._id : null
        });
      }

      if (req.files.galleryImages) {
        for (let i = 0; i < req.files.galleryImages.length; i++) {
          const file = req.files.galleryImages[i];
          const imgUrl = getUploadedFileUrl(file, 'galleries');
          updatedImages.push({
            url: imgUrl,
            title: file.originalname,
            caption: '',
            size: file.size,
            order: updatedImages.length + i
          });
          await syncToMediaLibrary({
            filename: file.filename,
            originalName: file.originalname,
            mimeType: file.mimetype,
            size: file.size,
            url: imgUrl,
            mediaType: 'image',
            uploadedBy: req.user ? req.user._id : null
          });
        }
      }
    }

    // Persist cover deletion correctly
    if (coverImage !== undefined) {
      gallery.coverImage = coverImage || '';
    }

    if (req.body.displayContent !== undefined) {
      gallery.displayContent = req.body.displayContent === true || req.body.displayContent === 'true';
    }

    if (req.body.banner !== undefined) {
      gallery.banner = req.body.banner || '';
    }
    if (req.body.bannerMedia !== undefined) {
      gallery.bannerMedia = req.body.bannerMedia || null;
    }

    if (req.files && req.files.banner && req.files.banner[0]) {
      const file = req.files.banner[0];
      gallery.banner = `/uploads/banners/${file.filename}`;
      await syncToMediaLibrary({
        filename: file.filename,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        url: gallery.banner,
        mediaType: 'image',
        uploadedBy: req.user ? req.user._id : null
      });
    }

    if (req.body.screenOptions !== undefined) {
      try {
        gallery.screenOptions = typeof req.body.screenOptions === 'string'
          ? JSON.parse(req.body.screenOptions)
          : req.body.screenOptions;
        gallery.markModified('screenOptions');
      } catch (e) {
        gallery.screenOptions = req.body.screenOptions;
      }
    }

    gallery.images = updatedImages;
    await gallery.save();

    const populated = await Gallery.findById(gallery._id)
      .populate('category', 'name slug')
      .populate('subCategory', 'name slug')
      .populate('childCategory', 'name slug');

    res.json({
      success: true,
      message: 'Gallery updated successfully',
      gallery: populated
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error updating gallery'
    });
  }
};

// @desc    Delete gallery (Trash or Permanent)
// @route   DELETE /api/galleries/:id
// @access  Private (Admin / Editor)
exports.deleteGallery = async (req, res) => {
  try {
    const gallery = await Gallery.findById(req.params.id);
    if (!gallery) {
      return res.status(404).json({
        success: false,
        message: 'Gallery not found'
      });
    }

    const { force } = req.query;

    if (gallery.status !== 'trash' && force !== 'true') {
      gallery.status = 'trash';
      await gallery.save();
      return res.json({
        success: true,
        message: 'Gallery moved to Trash'
      });
    }

        if (gallery.images && gallery.images.length > 0) {
      gallery.images.forEach((img) => safeDeleteFile(img.url));
    }

    await gallery.deleteOne();

    res.json({
      success: true,
      message: 'Gallery and images permanently deleted'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error deleting gallery'
    });
  }
};

// @desc    Restore gallery from Trash
// @route   PUT /api/galleries/:id/restore
// @access  Private (Admin / Editor)
exports.restoreGallery = async (req, res) => {
  try {
    const gallery = await Gallery.findById(req.params.id);
    if (!gallery) {
      return res.status(404).json({
        success: false,
        message: 'Gallery not found'
      });
    }

    gallery.status = 'draft';
    await gallery.save();

    res.json({
      success: true,
      message: 'Gallery restored from Trash to Drafts',
      gallery
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error restoring gallery'
    });
  }
};

// @desc    Duplicate gallery (clone as draft with unique slug)
// @route   POST /api/galleries/:id/duplicate
// @access  Private (Admin, Editor)
exports.duplicateGallery = async (req, res) => {
  try {
    const original = await Gallery.findById(req.params.id);
    if (!original) {
      return res.status(404).json({ success: false, message: "Gallery not found" });
    }

    const galObj = original.toObject();
    delete galObj._id;
    delete galObj.id;
    delete galObj.createdAt;
    delete galObj.updatedAt;
    delete galObj.__v;

    let baseSlug = `${original.slug || slugify(original.title, { lower: true, strict: true })}-copy`;
    let newSlug = baseSlug;
    let counter = 1;
    while (await Gallery.findOne({ slug: newSlug })) {
      newSlug = `${baseSlug}-${counter}`;
      counter++;
    }

    galObj.title = `${original.title} (Copy)`;
    galObj.slug = newSlug;
    galObj.status = "draft";
    galObj.views = 0;
    galObj.likes = 0;
    if (req.user) galObj.author = req.user._id;

    const duplicate = await Gallery.create(galObj);

    res.status(201).json({
      success: true,
      message: "Gallery duplicated successfully as Draft",
      gallery: duplicate
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || "Error duplicating gallery" });
  }
};

// @desc    Bulk delete galleries
// @route   POST /api/galleries/bulk-delete
// @access  Private (Admin, Editor)
exports.bulkDeleteGalleries = async (req, res) => {
  try {
    const { ids, force } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: "Please provide an array of gallery IDs" });
    }

    if (force === true || force === "true") {
      const result = await Gallery.deleteMany({ _id: { $in: ids } });
      return res.json({
        success: true,
        message: `${result.deletedCount} gallery(ies) permanently deleted`,
        deletedCount: result.deletedCount
      });
    }

    const galleries = await Gallery.find({ _id: { $in: ids } });
    let trashedCount = 0;
    let deletedCount = 0;

    for (const gal of galleries) {
      if (gal.status !== "trash") {
        gal.status = "trash";
        await gal.save();
        trashedCount++;
      } else {
        await gal.deleteOne();
        deletedCount++;
      }
    }

    res.json({
      success: true,
      message: `${trashedCount + deletedCount} gallery(ies) processed (${trashedCount} moved to trash, ${deletedCount} permanently deleted)`,
      trashedCount,
      deletedCount
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || "Error performing bulk delete" });
  }
};

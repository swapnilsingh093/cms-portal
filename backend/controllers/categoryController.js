const mongoose = require('mongoose');
const Category = require('../models/Category');
const slugify = require('slugify');
const { syncToMediaLibrary, getUploadedFileUrl } = require('../utils/mediaHelper');
const { getAllCategoryDescendantIds } = require('../utils/categoryTreeHelper');

// @desc    Get all categories (flat or filtered)
// @route   GET /api/categories
// @access  Public
exports.getCategories = async (req, res) => {
  try {
    const { type, isRoot, parent, strict, page, limit, search, includeInactive } = req.query;
    let query = {};

    // Filter inactive categories unless explicitly requested by admin
    if (includeInactive !== 'true') {
      query.isActive = { $ne: false };
      query.status = { $ne: 'inactive' };
    }

    if (search && search.trim()) {
      query.$or = [
        { name: { $regex: search.trim(), $options: 'i' } },
        { slug: { $regex: search.trim(), $options: 'i' } },
        { description: { $regex: search.trim(), $options: 'i' } },
        { shortDescription: { $regex: search.trim(), $options: 'i' } }
      ];
    }

    if (type && type !== 'all') {
      if (strict === 'true') {
        query.type = type;
      } else {
        query.type = { $in: [type, 'all'] };
      }
    }

    if (isRoot === 'true') {
      query.parentCategory = null;
    } else if (parent) {
      query.parentCategory = parent;
    }

    const total = await Category.countDocuments(query);

    let queryBuilder = Category.find(query)
      .populate('parentCategory', 'name slug')
      .populate({
        path: 'subCategories',
        match: includeInactive !== 'true' ? { isActive: { $ne: false }, status: { $ne: 'inactive' } } : {},
        select: 'name slug thumbnail description order isActive status'
      })
      .sort({ order: 1, name: 1 });

    const isPaginated = page !== undefined || limit !== undefined;
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || (isPaginated ? 10 : 0);

    if (limitNum > 0) {
      const skip = (pageNum - 1) * limitNum;
      queryBuilder = queryBuilder.skip(skip).limit(limitNum);
    }

    const categories = await queryBuilder;

    // Attach video, post & gallery counts to categories (WordPress style)
    const Video = require('../models/Video');
    const Post = require('../models/Post');
    const Gallery = require('../models/Gallery');
    const { includeDescendants } = req.query;
    const shouldIncludeDescendants = includeDescendants !== 'false';
    const categoriesWithCount = await Promise.all(
      categories.map(async (cat) => {
        const catObj = cat.toObject ? cat.toObject() : cat;
        const cId = cat._id;
        let idStrings = [String(cId)];
        if (shouldIncludeDescendants) {
          const descendantIds = await getAllCategoryDescendantIds(cId, Category);
          idStrings = [...descendantIds, String(cId)];
        }
        const objIds = idStrings
          .filter((id) => mongoose.Types.ObjectId.isValid(id))
          .map((id) => new mongoose.Types.ObjectId(id));
        const allQueryIds = [...objIds, ...idStrings];
        const countFilter = {
          $or: [
            { category: { $in: allQueryIds } },
            { subCategory: { $in: allQueryIds } },
            { childCategory: { $in: allQueryIds } },
            { categories: { $in: allQueryIds } }
          ]
        };
        try {
          const [videoCount, postCount, galleryCount] = await Promise.all([
            Video.countDocuments(countFilter).catch(() => 0),
            Post.countDocuments(countFilter).catch(() => 0),
            Gallery.countDocuments(countFilter).catch(() => 0)
          ]);
          catObj.videoCount = videoCount;
          catObj.postCount = postCount;
          catObj.storyCount = postCount;
          catObj.galleryCount = galleryCount;
          catObj.itemCount =
            catObj.type === 'video'
              ? videoCount
              : catObj.type === 'gallery'
              ? galleryCount
              : catObj.type === 'post'
              ? postCount
              : videoCount + postCount + galleryCount;
        } catch (e) {
          catObj.videoCount = 0;
          catObj.postCount = 0;
          catObj.storyCount = 0;
          catObj.galleryCount = 0;
          catObj.itemCount = 0;
        }
        return catObj;
      })
    );

    const response = {
      success: true,
      count: categoriesWithCount.length,
      total,
      categories: categoriesWithCount
    };

    if (limitNum > 0) {
      response.pagination = {
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum) || 1,
        limit: limitNum
      };
    }

    res.json(response);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching categories'
    });
  }
};

// @desc    Get complete hierarchical Category Tree (Roots -> Subcategories)
// @route   GET /api/categories/tree
// @access  Public
exports.getCategoryTree = async (req, res) => {
  try {
    const { type, strict, includeInactive } = req.query;
    let filter = {};
    if (includeInactive !== 'true') {
      filter.isActive = { $ne: false };
      filter.status = { $ne: 'inactive' };
    }
    if (type && type !== 'all') {
      if (strict === 'true') {
        filter.type = type;
      } else {
        filter.type = { $in: [type, 'all'] };
      }
    }

    const allCategories = await Category.find(filter)
      .sort({ order: 1, name: 1 })
      .lean();

    // Build hierarchical tree in memory
    const categoryMap = {};
    const rootCategories = [];

    allCategories.forEach((cat) => {
      cat.children = [];
      categoryMap[cat._id.toString()] = cat;
    });

    allCategories.forEach((cat) => {
      if (cat.parentCategory) {
        const parentId = cat.parentCategory.toString();
        if (categoryMap[parentId]) {
          categoryMap[parentId].children.push(cat);
        } else {
          rootCategories.push(cat);
        }
      } else {
        rootCategories.push(cat);
      }
    });

    res.json({
      success: true,
      count: rootCategories.length,
      tree: rootCategories
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching category tree'
    });
  }
};

// @desc    Get single category by slug
// @route   GET /api/categories/:slug
// @access  Public
exports.getCategoryBySlug = async (req, res) => {
  try {
    const isId = mongoose.isValidObjectId(req.params.slug);
    let query;
    if (isId) {
      query = { $or: [{ _id: req.params.slug }, { slug: req.params.slug }] };
    } else {
      query = { slug: req.params.slug };
    }

    let type = req.query.type;
    if (!type && req.headers.referer) {
      if (req.headers.referer.includes('/videos')) type = 'video';
      else if (req.headers.referer.includes('/galleries')) type = 'gallery';
      else if (req.headers.referer.includes('/stories') || req.headers.referer.includes('/posts')) type = 'post';
    }

    if (type && type !== 'all') {
      query.type = type;
    }
    const category = await Category.findOne(query)
      .populate({
        path: 'parentCategory',
        select: 'name slug banner thumbnail bannerType bannerVideo bannerImage overlayStrength layout shortDescription description mediaHeight headingFontSize subheadingFontSize descriptionFontSize alignment verticalPosition buttonText buttonUrl buttonFontSize parentCategory',
        populate: {
          path: 'parentCategory',
          select: 'name slug banner thumbnail bannerType bannerVideo bannerImage'
        }
      })
      .populate({
        path: 'subCategories',
        match: req.query.includeInactive !== 'true' ? { isActive: { $ne: false }, status: { $ne: 'inactive' } } : {},
        select: 'name slug thumbnail banner bannerType bannerVideo bannerImage description shortDescription order mediaHeight headingFontSize subheadingFontSize descriptionFontSize alignment verticalPosition buttonText buttonUrl buttonFontSize overlayStrength layout isActive status',
        populate: {
          path: 'subCategories',
          match: req.query.includeInactive !== 'true' ? { isActive: { $ne: false }, status: { $ne: 'inactive' } } : {},
          select: 'name slug thumbnail banner description shortDescription order isActive status'
        }
      });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    const isInactive = (category.isActive === false || category.status === 'inactive');

    const Video = require('../models/Video');
    const Post = require('../models/Post');

    const catObj = category.toObject();

    try {
      const [vCount, pCount] = await Promise.all([
        Video.countDocuments({
          $or: [{ category: category._id }, { subCategory: category._id }, { categories: category._id }],
          status: 'published'
        }).catch(() => 0),
        Post.countDocuments({
          $or: [{ category: category._id }, { subCategory: category._id }, { categories: category._id }],
          status: 'published'
        }).catch(() => 0)
      ]);
      catObj.videoCount = vCount;
      catObj.postCount = pCount;
      catObj.storyCount = pCount;
    } catch {
      catObj.videoCount = 0;
      catObj.postCount = 0;
      catObj.storyCount = 0;
    }

    if (catObj.subCategories && catObj.subCategories.length > 0) {
      catObj.subCategories = await Promise.all(
        catObj.subCategories.map(async (sub) => {
          try {
            const [vCount, pCount] = await Promise.all([
              Video.countDocuments({
                $or: [{ category: sub._id }, { subCategory: sub._id }, { categories: sub._id }],
                status: 'published'
              }).catch(() => 0),
              Post.countDocuments({
                $or: [{ category: sub._id }, { subCategory: sub._id }, { categories: sub._id }],
                status: 'published'
              }).catch(() => 0)
            ]);
            return {
              ...sub,
              videoCount: vCount,
              postCount: pCount,
              storyCount: pCount
            };
          } catch {
            return { ...sub, videoCount: 0, postCount: 0, storyCount: 0 };
          }
        })
      );
    }

    res.json({
      success: true,
      isInactive,
      category: catObj
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching category'
    });
  }
};

// @desc    Get single category by ID
// @route   GET /api/categories/id/:id
// @access  Public
exports.getCategoryById = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({
        success: false,
        message: 'Invalid category ID format'
      });
    }

    const category = await Category.findById(req.params.id)
      .populate('parentCategory', 'name slug')
      .populate('subCategories', 'name slug thumbnail description order');

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    res.json({
      success: true,
      category
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching category'
    });
  }
};

// @desc    Create a new category or sub-category
// @route   POST /api/categories
// @access  Private (Admin / Editor)
exports.createCategory = async (req, res) => {
  try {
    const { name, description, shortDescription, parentCategory, type, order, thumbnail, banner, bannerType, bannerVideo, bannerImage, overlayStrength, bannerPosition, layout, mediaHeight, headingFontSize, subheadingFontSize, descriptionFontSize, alignment, verticalPosition, buttonText, buttonUrl, buttonFontSize } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Category name is required'
      });
    }

    const cleanName = name.trim();
    const parentId = parentCategory && parentCategory !== '' ? parentCategory : null;
    const catType = type || 'all';

    const escapeRegex = (s) => s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');

    // 1. Search if a category or subcategory with this name already exists in the SAME taxonomy type
    const existingName = await Category.findOne({
      type: catType,
      name: { $regex: new RegExp(`^${escapeRegex(cleanName)}$`, 'i') }
    });

    let finalName = cleanName;
    if (existingName) {
      // Name already exists in this taxonomy type, increment like -2, -3, -4 ... same as WordPress
      let nameCounter = 2;
      while (
        await Category.findOne({
          type: catType,
          name: { $regex: new RegExp(`^${escapeRegex(cleanName)}-${nameCounter}$`, 'i') }
        })
      ) {
        nameCounter++;
      }
      finalName = `${cleanName}-${nameCounter}`;
    }

    // 2. Auto-generate clean unique slug for this taxonomy type (-2, -3, -4 only if duplicate within same type)
    let requestedSlug = req.body.slug && typeof req.body.slug === 'string' ? req.body.slug.trim() : '';
    let baseSlug = slugify(requestedSlug || finalName, { lower: true, strict: true });
    const rootSlug = baseSlug.replace(/-\d+$/, '');

    let slug = baseSlug;
    if (await Category.findOne({ slug, type: catType })) {
      let slugCounter = 2;
      while (await Category.findOne({ slug: `${rootSlug}-${slugCounter}`, type: catType })) {
        slugCounter++;
      }
      slug = `${rootSlug}-${slugCounter}`;
    }

    // Handle files if uploaded via multer
    let thumbUrl = (typeof thumbnail === 'string') ? thumbnail : '';
    let bannerUrl = (typeof banner === 'string') ? banner : '';

    if (req.files) {
      if (req.files.thumbnail && req.files.thumbnail[0]) {
        const file = req.files.thumbnail[0];
        const isVideo = file.mimetype && file.mimetype.startsWith('video/');
        thumbUrl = getUploadedFileUrl(file, isVideo ? 'videos' : 'thumbnails');
        await syncToMediaLibrary({
          filename: file.filename,
          originalName: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
          url: thumbUrl,
          mediaType: isVideo ? 'video' : 'image',
          uploadedBy: req.user ? req.user._id : null
        });
      }
      if (req.files.banner && req.files.banner[0]) {
        const file = req.files.banner[0];
        const isVideo = file.mimetype && file.mimetype.startsWith('video/');
        bannerUrl = getUploadedFileUrl(file, isVideo ? 'videos' : 'banners');
        if (isVideo) {
          req.body.bannerVideo = bannerUrl;
          req.body.bannerType = 'video';
        } else {
          req.body.bannerImage = bannerUrl;
        }
        await syncToMediaLibrary({
          filename: file.filename,
          originalName: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
          url: bannerUrl,
          mediaType: isVideo ? 'video' : 'image',
          uploadedBy: req.user ? req.user._id : null
        });
      }
    }

    const determinedBannerType = req.body.bannerType || (type === 'video' && (req.body.bannerVideo || bannerVideo) ? 'video' : 'image');
    const finalBannerImage = req.body.bannerImage || bannerImage || (!bannerVideo ? bannerUrl : '');
    const finalBannerVideo = req.body.bannerVideo || bannerVideo || (bannerUrl && bannerUrl.match(/\.(mp4|webm|mov|mkv)$/i) ? bannerUrl : '');

    const category = await Category.create({
      name: finalName,
      slug,
      description: description || '',
      parentCategory: parentCategory && parentCategory !== '' ? parentCategory : null,
      thumbnail: thumbUrl,
      banner: bannerUrl || finalBannerImage || finalBannerVideo || '',
      type: type || 'all',
      order: order ? Number(order) : 0,
      shortDescription: shortDescription || '',
      bannerType: determinedBannerType,
      bannerVideo: finalBannerVideo,
      bannerImage: finalBannerImage,
      overlayStrength: overlayStrength !== undefined ? Number(overlayStrength) : 0,
      bannerPosition: bannerPosition || 'center',
      layout: layout || 'with_sidebar',
      mediaHeight: mediaHeight || '60vh',
      headingFontSize: headingFontSize || '2.5rem',
      subheadingFontSize: subheadingFontSize || '1.1rem',
      descriptionFontSize: descriptionFontSize || '1rem',
      alignment: alignment || 'left',
      verticalPosition: verticalPosition || 'center',
      buttonText: buttonText || '',
      buttonUrl: buttonUrl || '',
      buttonFontSize: buttonFontSize || '0.95rem',
      isActive: req.body.isActive !== undefined ? (req.body.isActive === true || req.body.isActive === 'true') : true,
      status: req.body.status || (req.body.isActive === false || req.body.isActive === 'false' ? 'inactive' : 'active')
    });

    const populatedCategory = await Category.findById(category._id).populate(
      'parentCategory',
      'name slug'
    );

    res.status(201).json({
      success: true,
      message: category.parentCategory
        ? 'Sub-category created successfully!'
        : 'Parent category created successfully!',
      category: populatedCategory
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error creating category'
    });
  }
};

// @desc    Update category
// @route   PUT /api/categories/:id
// @access  Private (Admin / Editor)
exports.updateCategory = async (req, res) => {
  try {
    const { name, description, shortDescription, parentCategory, type, order, isActive, thumbnail, banner, bannerType, bannerVideo, bannerImage, overlayStrength, bannerPosition, layout, mediaHeight, headingFontSize, subheadingFontSize, descriptionFontSize, alignment, verticalPosition, buttonText, buttonUrl, buttonFontSize } = req.body;

    let category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Prevent setting self as parent
    if (parentCategory && parentCategory.toString() === category._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'A category cannot be its own parent category.'
      });
    }

    if (name && name !== category.name) {
      category.name = name;
      // Only auto-generate slug from name if slug wasn't explicitly provided in the request
      if (!req.body.slug) {
        let autoSlug = slugify(name, { lower: true, strict: true });
        // Ensure slug doesn't conflict with another category of the SAME type
        const slugConflict = await Category.findOne({ slug: autoSlug, type: category.type, _id: { $ne: category._id } });
        if (!slugConflict) {
          category.slug = autoSlug;
        }
        // If conflict, keep existing slug (don't overwrite)
      }
    }
    
    // Explicit slug update
    if (req.body.slug && req.body.slug !== category.slug) {
      const newSlug = slugify(req.body.slug, { lower: true, strict: true });
      // Only update if not taken by another category of the SAME type
      const slugTaken = await Category.findOne({ slug: newSlug, type: category.type, _id: { $ne: category._id } });
      if (!slugTaken) {
        category.slug = newSlug;
      }
    }

    if (description !== undefined) category.description = description;
    if (shortDescription !== undefined) category.shortDescription = shortDescription;
    if (bannerType !== undefined) category.bannerType = bannerType;
    if (bannerVideo !== undefined) category.bannerVideo = bannerVideo;
    if (bannerImage !== undefined) category.bannerImage = bannerImage;
    if (overlayStrength !== undefined) category.overlayStrength = Number(overlayStrength);
    if (bannerPosition !== undefined) category.bannerPosition = bannerPosition;
    if (layout !== undefined) category.layout = layout;
    if (mediaHeight !== undefined) category.mediaHeight = mediaHeight;
    if (headingFontSize !== undefined) category.headingFontSize = headingFontSize;
    if (subheadingFontSize !== undefined) category.subheadingFontSize = subheadingFontSize;
    if (descriptionFontSize !== undefined) category.descriptionFontSize = descriptionFontSize;
    if (alignment !== undefined) category.alignment = alignment;
    if (verticalPosition !== undefined) category.verticalPosition = verticalPosition;
    if (buttonText !== undefined) category.buttonText = buttonText;
    if (buttonUrl !== undefined) category.buttonUrl = buttonUrl;
    if (buttonFontSize !== undefined) category.buttonFontSize = buttonFontSize;
    if (parentCategory !== undefined) {
      category.parentCategory = parentCategory && parentCategory !== '' ? parentCategory : null;
    }
    if (type) category.type = type;
    if (order !== undefined) category.order = Number(order);
    if (isActive !== undefined) {
      const activeBool = isActive === true || isActive === 'true';
      category.isActive = activeBool;
      category.status = activeBool ? 'active' : 'inactive';
    }
    if (req.body.status !== undefined) {
      category.status = req.body.status;
      category.isActive = (req.body.status === 'active' || req.body.status === 'visible');
    }

    // Handle thumbnail & banner (file upload or URL from media library or clear)
    if (req.files && req.files.thumbnail && req.files.thumbnail[0]) {
      const file = req.files.thumbnail[0];
      const isVideo = file.mimetype && file.mimetype.startsWith('video/');
      category.thumbnail = getUploadedFileUrl(file, isVideo ? 'videos' : 'thumbnails');
      await syncToMediaLibrary({
        filename: file.filename,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        url: category.thumbnail,
        mediaType: isVideo ? 'video' : 'image',
        uploadedBy: req.user ? req.user._id : null
      });
    } else if (thumbnail !== undefined) {
      category.thumbnail = (typeof thumbnail === 'string') ? thumbnail : '';
    }

    if (req.files && req.files.banner && req.files.banner[0]) {
      const file = req.files.banner[0];
      const isVideo = file.mimetype && file.mimetype.startsWith('video/');
      const uploadedUrl = getUploadedFileUrl(file, isVideo ? 'videos' : 'banners');
      category.banner = uploadedUrl;
      if (isVideo) {
        category.bannerVideo = uploadedUrl;
        category.bannerType = 'video';
      } else {
        category.bannerImage = uploadedUrl;
      }
      await syncToMediaLibrary({
        filename: file.filename,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        url: uploadedUrl,
        mediaType: isVideo ? 'video' : 'image',
        uploadedBy: req.user ? req.user._id : null
      });
    } else if (banner !== undefined) {
      category.banner = (typeof banner === 'string') ? banner : '';
    }

    // Keep banner field synced if bannerVideo or bannerImage was explicitly updated
    if (category.bannerType === 'video' && category.bannerVideo) {
      category.banner = category.bannerVideo;
    } else if (category.bannerImage) {
      category.banner = category.bannerImage;
    }

    await category.save();

    const updated = await Category.findById(category._id).populate(
      'parentCategory',
      'name slug'
    );

    res.json({
      success: true,
      message: 'Category updated successfully',
      category: updated
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error updating category'
    });
  }
};

// @desc    Delete category
// @route   DELETE /api/categories/:id
// @access  Private (Admin)
exports.deleteCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Promote or clear parentCategory for any direct sub-categories
    await Category.updateMany(
      { parentCategory: category._id },
      { parentCategory: category.parentCategory || null }
    );

    await category.deleteOne();

    res.json({
      success: true,
      message: 'Category removed successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error deleting category'
    });
  }
};

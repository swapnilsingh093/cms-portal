const Video = require('../models/Video');
const Category = require('../models/Category');
const mongoose = require('mongoose');
const slugify = require('slugify');
const fs = require('fs');
const path = require('path');
const {
  syncToMediaLibrary,
  saveBase64Image,
  safeDeleteFile,
  getUploadedFileUrl
} = require('../utils/mediaHelper');
const { getMonthDateRange, getAvailableDates } = require('../utils/dateHelper');
const { getAllCategoryDescendantIds, resolveHierarchy } = require('../utils/categoryTreeHelper');

// Helper to resolve category ID from slug or ObjectId
const resolveCategoryId = async (val, type = 'video') => {
  if (!val) return null;
  if (mongoose.Types.ObjectId.isValid(val) && String(new mongoose.Types.ObjectId(val)) === String(val)) {
    return new mongoose.Types.ObjectId(val);
  }
  const query = { slug: val };
  if (type) query.type = type;
  const found = await Category.findOne(query).select('_id');
  return found ? found._id : null;
};

exports.getVideos = async (req, res) => {
  try {
    let { page = 1, limit = 10, search, category, subCategory, status, sort = '-createdAt' } = req.query;
    page = parseInt(page) || 1;
    limit = parseInt(limit) || 10;
    // Admin management query vs public frontend viewing
    const isManagerQuery = req.query.isAdmin === "true" || ["trash", "draft", "all"].includes(status);

    const isPrivilegedUser = req.user && ['admin', 'editor'].includes(req.user.role);

    // Module permission check applies ONLY to admin panel management for editors
    if (isPrivilegedUser && req.user.role === 'editor' && req.query.isAdmin === 'true') {
      if (!req.user.permissions?.videos?.view) {
        return res.status(403).json({ success: false, message: 'Access denied: You do not have permission to access videos management in admin panel.' });
      }
    }

    const andConditions = [];
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

    const { childCategory } = req.query;
    if (childCategory) {
      const childCatId = await resolveCategoryId(childCategory, 'video');
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
      const subCatId = await resolveCategoryId(subCategory, 'video');
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
      const catId = await resolveCategoryId(category, 'video');
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

    const { age, maritalStatus, tags, choiceCategory, ageGroup } = req.query;
    if (choiceCategory) {
      const choices = Array.isArray(choiceCategory)
        ? choiceCategory
        : String(choiceCategory).split(',').map(c => c.trim()).filter(Boolean);
      if (choices.length > 0) {
        andConditions.push({ choiceCategory: { $in: choices } });
      }
    }

    if (ageGroup && ageGroup !== 'all' && ageGroup !== '') {
      const cleanAge = String(ageGroup).trim();
      const rangeMatch = cleanAge.match(/(\d+)\s*[-–]\s*(\d+)/);
      if (rangeMatch) {
        const [ , low, high ] = rangeMatch;
        const regexStr = `^\\s*${low}\\s*[-–]\\s*${high}(\\s*(yrs|yr|years)?)?\\s*$`;
        andConditions.push({
          $or: [
            { ageGroup: cleanAge },
            { ageGroup: `${low}-${high}` },
            { ageGroup: `${low}-${high} yrs` },
            { ageGroup: `${low}-${high} yr` },
            { ageGroup: `${low}-${high}years` },
            { ageGroup: { $regex: regexStr, $options: 'i' } }
          ]
        });
      } else {
        const escaped = cleanAge.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        andConditions.push({
          $or: [
            { ageGroup: cleanAge },
            { ageGroup: { $regex: `^${escaped}$`, $options: 'i' } }
          ]
        });
      }
    }

    if (maritalStatus && maritalStatus !== 'all' && maritalStatus !== '') {
      andConditions.push({
        $or: [
          { maritalStatus: new RegExp(`^${maritalStatus.trim()}$`, 'i') },
          { maritalStatus: maritalStatus.trim().toLowerCase() }
        ]
      });
    }

    if (age) {
      const ageVals = Array.isArray(age) ? age.map(Number) : String(age).split(',').map(s => Number(s.trim())).filter(n => !isNaN(n));
      if (ageVals.length > 0) {
        andConditions.push({ age: { $in: ageVals } });
      }
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

    // Helper to safely escape regex characters
    const escapeRegex = (str) => String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    // Dynamic Custom Fields Filtering (cf_<key> or customFields query params)
    Object.keys(req.query).forEach((qKey) => {
      if (qKey.startsWith('cf_')) {
        const rawFieldKey = qKey.slice(3).trim();
        const val = req.query[qKey];
        if (val !== undefined && val !== '' && val !== 'all') {
          const vals = String(val).split(',').map((v) => v.trim()).filter(Boolean);
          if (vals.length > 0) {
            // Support keys both with and without 'custom_' prefix, plus exact key
            const keyVariants = Array.from(
              new Set([
                rawFieldKey,
                rawFieldKey.toLowerCase(),
                rawFieldKey.replace(/^custom_/, ''),
                rawFieldKey.replace(/^custom_/, '').toLowerCase(),
                rawFieldKey.startsWith('custom_') ? rawFieldKey : `custom_${rawFieldKey}`
              ])
            ).filter(Boolean);

            const fieldOrConditions = [];
            keyVariants.forEach((k) => {
              vals.forEach((v) => {
                const rx = new RegExp(`^${escapeRegex(v)}$`, 'i');
                fieldOrConditions.push({ [`customFields.${k}`]: rx });
                fieldOrConditions.push({ [`customFields.${k}`]: v });
              });
              fieldOrConditions.push({ [`customFields.${k}`]: { $in: vals } });
            });

            if (fieldOrConditions.length > 0) {
              andConditions.push({ $or: fieldOrConditions });
            }
          }
        }
      }
    });

    const query = andConditions.length > 0 ? { $and: andConditions } : {};

    let sortOptions = { createdAt: -1 };
    if (sort === '-views' || sort === 'views') {
      sortOptions = { views: -1, createdAt: -1 };
    } else if (sort === 'createdAt' || sort === '+createdAt') {
      sortOptions = { createdAt: 1 };
    } else if (sort === '-createdAt') {
      sortOptions = { createdAt: -1 };
    }

    const videos = await Video.find(query)
      .populate({
        path: 'category',
        select: 'name slug parentCategory',
        populate: { path: 'parentCategory', select: 'name slug' }
      })
      .populate({
        path: 'subCategory',
        select: 'name slug parentCategory',
        populate: { path: 'parentCategory', select: 'name slug' }
      })
      .populate('childCategory', 'name slug')
      .populate({
        path: 'categories',
        select: 'name slug parentCategory',
        populate: { path: 'parentCategory', select: 'name slug' }
      })
      .populate('author', 'name avatar')
      .sort(sortOptions)
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await Video.countDocuments(query);
    const [published, draft, trash, allCount, availableDates] = await Promise.all([
      Video.countDocuments({ status: 'published' }),
      Video.countDocuments({ status: 'draft' }),
      Video.countDocuments({ status: 'trash' }),
      Video.countDocuments({ status: { $ne: 'trash' } }),
      getAvailableDates(Video)
    ]);

    const counts = { all: allCount, published, draft, trash };
    res.json({
      success: true,
      videos,
      pagination: { total, page, pages: Math.ceil(total / limit) },
      availableDates,
      counts,
      statusCounts: counts
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Error fetching videos' });
  }
};

exports.getVideoBySlug = async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const isId = mongoose.isValidObjectId(req.params.slug);
    const query = isId
      ? { $or: [{ slug: req.params.slug }, { _id: req.params.slug }] }
      : { slug: req.params.slug };
      
    const video = await Video.findOne(query)
      .populate({
        path: 'category',
        select: 'name slug parentCategory',
        populate: {
          path: 'parentCategory',
          select: 'name slug parentCategory',
          populate: { path: 'parentCategory', select: 'name slug' }
        }
      })
      .populate({
        path: 'subCategory',
        select: 'name slug parentCategory',
        populate: {
          path: 'parentCategory',
          select: 'name slug parentCategory',
          populate: { path: 'parentCategory', select: 'name slug' }
        }
      })
      .populate({
        path: 'childCategory',
        select: 'name slug parentCategory',
        populate: { path: 'parentCategory', select: 'name slug' }
      })
      .populate({
        path: 'categories',
        select: 'name slug parentCategory',
        populate: { path: 'parentCategory', select: 'name slug' }
      })
      .populate('author', 'name avatar bio');
      
    if (!video) return res.status(404).json({ success: false, message: 'Video not found' });
    
    // Security & WordPress draft behavior:
    // If video is in Draft or Trash, only logged-in Admin or Editor can preview it!
    if (video.status !== 'published') {
      const isPrivileged = req.user && ['admin', 'editor'].includes(req.user.role);
      if (!isPrivileged) {
        return res.status(404).json({
          success: false,
          message: 'Video not found or is currently in draft'
        });
      }
    }

    // Increment views only for published videos viewed by public
    if (!req.query.noCount && video.status === 'published') {
      video.views += 1;
      await video.save();
    }
    res.json({ success: true, video });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Error loading video' });
  }
};

exports.createVideo = async (req, res) => {
  try {
    const {
      title, description, videoUrl: bodyVideoUrl, videoType, poster: bodyPoster, thumbnail: bodyThumbnail, banner: bodyBanner, bannerMedia: bodyBannerMedia, displayContent, autoPoster, duration, category, subCategory, childCategory, tags, status, isFeatured, layout, showSidebar, bannerType, bannerVideo, overlayStrength
    } = req.body;

    const effectiveTitle = (title && title.trim()) ? title.trim() : 'Untitled Video';

    let finalVideoUrl = bodyVideoUrl || '';
    let finalPoster = bodyPoster || '';
    let finalThumbnail = bodyThumbnail || '';
    let finalBanner = bodyBanner || '';

    if (req.files) {
      if (req.files.video && req.files.video[0]) {
        const file = req.files.video[0];
        finalVideoUrl = getUploadedFileUrl(file, 'videos');
        await syncToMediaLibrary({ filename: file.filename, originalName: file.originalname, mimeType: file.mimetype, size: file.size, url: finalVideoUrl, mediaType: 'video', uploadedBy: req.user ? req.user._id : null });
      }
      if (req.files.poster && req.files.poster[0]) {
        const file = req.files.poster[0];
        finalPoster = getUploadedFileUrl(file, 'banners');
        await syncToMediaLibrary({ filename: file.filename, originalName: file.originalname, mimeType: file.mimetype, size: file.size, url: finalPoster, mediaType: 'image', uploadedBy: req.user ? req.user._id : null });
      }
      if (req.files.thumbnail && req.files.thumbnail[0]) {
        const file = req.files.thumbnail[0];
        finalThumbnail = getUploadedFileUrl(file, 'thumbnails');
        await syncToMediaLibrary({ filename: file.filename, originalName: file.originalname, mimeType: file.mimetype, size: file.size, url: finalThumbnail, mediaType: 'image', uploadedBy: req.user ? req.user._id : null });
      }
      if (req.files.banner && req.files.banner[0]) {
        const file = req.files.banner[0];
        finalBanner = getUploadedFileUrl(file, 'banners');
        await syncToMediaLibrary({ filename: file.filename, originalName: file.originalname, mimeType: file.mimetype, size: file.size, url: finalBanner, mediaType: 'image', uploadedBy: req.user ? req.user._id : null });
      }
    }

    if (!finalPoster && autoPoster && typeof autoPoster === 'string' && autoPoster.startsWith('data:image/')) {
      const savedFrame = saveBase64Image(autoPoster, 'thumbnails', 'video-poster');
      if (savedFrame) {
        finalPoster = savedFrame.url;
        if (!finalThumbnail) finalThumbnail = savedFrame.url;
        if (!finalBanner || finalBanner.startsWith('data:image/')) {
          finalBanner = savedFrame.url;
        }
        await syncToMediaLibrary({ filename: savedFrame.filename, originalName: `${effectiveTitle.slice(0, 30)}-auto-poster.jpg`, mimeType: savedFrame.mimeType, size: savedFrame.size, url: savedFrame.url, mediaType: 'image', uploadedBy: req.user ? req.user._id : null });
      }
    }

    // Determine if content is provided; if completely empty, auto-save as draft
    const hasContent = Boolean(
      finalVideoUrl ||
      (description && description.trim()) ||
      (req.body.shortDescription && req.body.shortDescription.trim()) ||
      finalPoster ||
      finalBanner ||
      (req.files && (req.files.video || req.files.poster || req.files.thumbnail || req.files.banner))
    );
    const effectiveStatus = hasContent ? (status || 'published') : 'draft';

    const resolvedHierarchy = await resolveHierarchy({ category, subCategory, childCategory, categories: req.body.categories }, Category);

    let parsedChoiceCategory = [];
    if (req.body.choiceCategory !== undefined) {
      try {
        const p = typeof req.body.choiceCategory === 'string' ? JSON.parse(req.body.choiceCategory) : req.body.choiceCategory;
        parsedChoiceCategory = Array.isArray(p) ? p.map(String) : String(p).split(',').map(s => s.trim()).filter(Boolean);
      } catch (e) {
        parsedChoiceCategory = String(req.body.choiceCategory).split(',').map(s => s.trim()).filter(Boolean);
      }
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

    const parsedAgeGroup = req.body.ageGroup ? String(req.body.ageGroup).trim() : '';
    const parsedMaritalStatus = req.body.maritalStatus !== undefined ? String(req.body.maritalStatus).trim() : '';

    let parsedCustomFields = {};
    if (req.body.customFields !== undefined) {
      try {
        parsedCustomFields = typeof req.body.customFields === 'string'
          ? JSON.parse(req.body.customFields)
          : req.body.customFields;
      } catch (e) {
        parsedCustomFields = {};
      }
    }

    const video = await Video.create({
      title: effectiveTitle,
      description: description || '',
      shortDescription: req.body.shortDescription || '',
      descriptionPosition: req.body.descriptionPosition || 'after',
      videoUrl: finalVideoUrl,
      videoType: videoType || (finalVideoUrl.startsWith('/uploads/') ? 'upload' : 'external'),
      displayContent: displayContent !== undefined ? (displayContent === true || displayContent === 'true') : true,
      layout: layout || (showSidebar === false || showSidebar === 'false' ? 'without_sidebar' : 'with_sidebar'),
      showSidebar: showSidebar !== undefined ? (showSidebar === true || showSidebar === 'true') : (layout !== 'without_sidebar'),
      bannerType: bannerType || 'image',
      bannerVideo: bannerVideo || '',
      overlayStrength: overlayStrength !== undefined ? Number(overlayStrength) : 0,
      alignment: req.body.alignment || 'left',
      verticalPosition: req.body.verticalPosition || 'center',
      bannerPosition: req.body.bannerPosition || 'center',
      bannerHeight: req.body.bannerHeight || '50vh',
      banner: finalBanner,
      bannerMedia: bodyBannerMedia || null,
      poster: finalPoster,
      thumbnail: finalThumbnail || finalPoster,
      duration: duration || '',
      category: resolvedHierarchy.category,
      subCategory: resolvedHierarchy.subCategory,
      childCategory: resolvedHierarchy.childCategory,
      categories: resolvedHierarchy.categories,
      tags: tags ? (Array.isArray(tags) ? tags : tags.split(',').map(t => t.trim()).filter(Boolean)) : [],
      choiceCategory: parsedChoiceCategory,
      ageGroup: parsedAgeGroup,
      age: parsedAge,
      maritalStatus: parsedMaritalStatus,
      customFields: parsedCustomFields,
      status: effectiveStatus,
      isFeatured: isFeatured === 'true' || isFeatured === true,
      featuredOnHomeBanner: req.body.featuredOnHomeBanner === 'true' || req.body.featuredOnHomeBanner === true,
      author: req.body.author || (req.user ? req.user._id : null),
      screenOptions: req.body.screenOptions !== undefined
        ? (typeof req.body.screenOptions === 'string' ? JSON.parse(req.body.screenOptions) : req.body.screenOptions)
        : {},
    });

    // Uncheck previous videos so newest created video automatically takes the spotlight on home banner
    const { setExclusiveHomeBanner } = require('../utils/homeBannerHelper');
    await setExclusiveHomeBanner('video', video._id);
    video.featuredOnHomeBanner = true;
    await video.save();

    const populated = await Video.findById(video._id)
      .populate('category', 'name slug')
      .populate('subCategory', 'name slug')
      .populate('childCategory', 'name slug');

    res.status(201).json({ success: true, message: 'Video created successfully', video: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Error creating video' });
  }
};

exports.updateVideo = async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) return res.status(404).json({ success: false, message: 'Video not found' });

    const {
      title, slug, description, tags, status, isFeatured, videoUrl, videoType, poster, thumbnail, banner, bannerMedia, displayContent, autoPoster, duration, category, subCategory, childCategory, layout, showSidebar, bannerType, bannerVideo, overlayStrength
    } = req.body;

    if (title) video.title = title;
    if (description !== undefined) video.description = description;
    if (req.body.shortDescription !== undefined) video.shortDescription = req.body.shortDescription;
    if (req.body.descriptionPosition !== undefined) video.descriptionPosition = req.body.descriptionPosition;
    if (status) video.status = status;
    if (isFeatured !== undefined) video.isFeatured = isFeatured === 'true' || isFeatured === true;
    if (req.body.featuredOnHomeBanner !== undefined) {
      const isHomeFeatured = req.body.featuredOnHomeBanner === 'true' || req.body.featuredOnHomeBanner === true;
      video.featuredOnHomeBanner = isHomeFeatured;
      if (isHomeFeatured) {
        const { setExclusiveHomeBanner } = require('../utils/homeBannerHelper');
        await setExclusiveHomeBanner('video', video._id);
      }
    }
    if (duration !== undefined) video.duration = duration;
    if (layout !== undefined) {
      video.layout = layout;
      video.showSidebar = layout !== 'without_sidebar';
    }
    if (showSidebar !== undefined) {
      video.showSidebar = showSidebar === true || showSidebar === 'true';
      video.layout = video.showSidebar ? 'with_sidebar' : 'without_sidebar';
    }
    if (bannerType !== undefined) video.bannerType = bannerType;
    if (bannerVideo !== undefined) video.bannerVideo = bannerVideo;
    if (overlayStrength !== undefined) video.overlayStrength = Number(overlayStrength);
    if (req.body.alignment !== undefined) video.alignment = req.body.alignment;
    if (req.body.verticalPosition !== undefined) video.verticalPosition = req.body.verticalPosition;
    if (req.body.bannerPosition !== undefined) video.bannerPosition = req.body.bannerPosition;
    if (req.body.bannerHeight !== undefined) video.bannerHeight = req.body.bannerHeight;

    if (slug !== undefined && slug.trim()) {
      const cleanSlug = slugify(slug, { lower: true, strict: true });
      const duplicate = await Video.findOne({ slug: cleanSlug, _id: { $ne: video._id } });
      if (!duplicate) video.slug = cleanSlug;
    }

    if (category !== undefined || subCategory !== undefined || childCategory !== undefined || req.body.categories !== undefined) {
      const resolvedHierarchy = await resolveHierarchy({
        category: category !== undefined ? category : video.category,
        subCategory: subCategory !== undefined ? subCategory : video.subCategory,
        childCategory: childCategory !== undefined ? childCategory : video.childCategory,
        categories: req.body.categories !== undefined ? req.body.categories : video.categories
      }, Category);
      video.category = resolvedHierarchy.category;
      video.subCategory = resolvedHierarchy.subCategory;
      video.childCategory = resolvedHierarchy.childCategory;
      video.categories = resolvedHierarchy.categories;
    }

    if (tags !== undefined) {
      video.tags = Array.isArray(tags) ? tags : tags.split(',').map((t) => t.trim()).filter(Boolean);
    }

    if (req.body.age !== undefined) {
      try {
        const p = typeof req.body.age === 'string' ? JSON.parse(req.body.age) : req.body.age;
        video.age = Array.isArray(p) ? p.map(Number).filter(n => !isNaN(n)) : [];
      } catch (e) {
        video.age = String(req.body.age).split(',').map(s => Number(s.trim())).filter(n => !isNaN(n));
      }
    }

    if (req.body.author !== undefined && req.body.author) {
      video.author = req.body.author;
    }

    if (req.body.choiceCategory !== undefined) {
      try {
        const p = typeof req.body.choiceCategory === 'string' ? JSON.parse(req.body.choiceCategory) : req.body.choiceCategory;
        video.choiceCategory = Array.isArray(p) ? p.map(String) : String(p).split(',').map(s => s.trim()).filter(Boolean);
      } catch (e) {
        video.choiceCategory = String(req.body.choiceCategory).split(',').map(s => s.trim()).filter(Boolean);
      }
    }

    if (req.body.ageGroup !== undefined) {
      video.ageGroup = String(req.body.ageGroup).trim();
    }

    if (req.body.maritalStatus !== undefined) {
      video.maritalStatus = String(req.body.maritalStatus).trim();
    }

    if (req.body.customFields !== undefined) {
      try {
        video.customFields = typeof req.body.customFields === 'string'
          ? JSON.parse(req.body.customFields)
          : req.body.customFields;
        video.markModified('customFields');
      } catch (e) {
        // ignore JSON parse error
      }
    }

    if (videoUrl !== undefined) video.videoUrl = videoUrl;
    if (videoType !== undefined) video.videoType = videoType;

    let posterFileUpdated = false;
    let thumbnailFileUpdated = false;
    let videoFileUpdated = false;

    if (req.files) {
      if (req.files.video && req.files.video[0]) {
        const file = req.files.video[0];
        video.videoUrl = getUploadedFileUrl(file, 'videos');
        video.videoType = 'upload';
        await syncToMediaLibrary({ filename: file.filename, originalName: file.originalname, mimeType: file.mimetype, size: file.size, url: video.videoUrl, mediaType: 'video', uploadedBy: req.user ? req.user._id : null });
        videoFileUpdated = true;
      }
      if (req.files.poster && req.files.poster[0]) {
        const file = req.files.poster[0];
        video.poster = getUploadedFileUrl(file, 'banners');
        await syncToMediaLibrary({ filename: file.filename, originalName: file.originalname, mimeType: file.mimetype, size: file.size, url: video.poster, mediaType: 'image', uploadedBy: req.user ? req.user._id : null });
        posterFileUpdated = true;
      }
      if (req.files.thumbnail && req.files.thumbnail[0]) {
        const file = req.files.thumbnail[0];
        video.thumbnail = getUploadedFileUrl(file, 'thumbnails');
        await syncToMediaLibrary({ filename: file.filename, originalName: file.originalname, mimeType: file.mimetype, size: file.size, url: video.thumbnail, mediaType: 'image', uploadedBy: req.user ? req.user._id : null });
        thumbnailFileUpdated = true;
      }
    }
    
    if (displayContent !== undefined) {
      video.displayContent = displayContent === true || displayContent === 'true';
    }

    if (banner !== undefined) {
      video.banner = banner || '';
    }
    if (bannerMedia !== undefined) {
      video.bannerMedia = bannerMedia ? bannerMedia : null;
    }

    if (req.files && req.files.banner && req.files.banner[0]) {
      const file = req.files.banner[0];
      video.banner = getUploadedFileUrl(file, 'banners');
      await syncToMediaLibrary({
        filename: file.filename, originalName: file.originalname, mimeType: file.mimetype, size: file.size, url: video.banner, mediaType: 'image', uploadedBy: req.user ? req.user._id : null
      });
    }

    // Persist poster deletion correctly (null / empty string)
    if (!posterFileUpdated && poster !== undefined) {
      video.poster = poster || '';
    }
    if (!thumbnailFileUpdated && thumbnail !== undefined) {
      video.thumbnail = thumbnail || '';
    }

    // Auto-poster from frontend frame capture: always apply when explicitly sent
    // (the frontend sends autoPoster only when the user has a freshly captured video frame)
    if (autoPoster && typeof autoPoster === 'string' && autoPoster.startsWith('data:image/')) {
      const savedFrame = saveBase64Image(autoPoster, 'thumbnails', 'video-poster');
      if (savedFrame) {
        video.poster = savedFrame.url;
        video.thumbnail = savedFrame.url;
        await syncToMediaLibrary({
          filename: savedFrame.filename, originalName: `${video.title.slice(0, 30)}-auto-poster.jpg`, mimeType: savedFrame.mimeType, size: savedFrame.size, url: savedFrame.url, mediaType: 'image', uploadedBy: req.user ? req.user._id : null
        });
      }
    }

    // Only fallback thumbnail if thumbnail was not explicitly cleared
    if (!video.thumbnail && video.poster && thumbnail !== '') {
      video.thumbnail = video.poster;
    }

    if (req.body.screenOptions !== undefined) {
      try {
        video.screenOptions = typeof req.body.screenOptions === 'string'
          ? JSON.parse(req.body.screenOptions)
          : req.body.screenOptions;
        video.markModified('screenOptions');
      } catch (e) {
        video.screenOptions = req.body.screenOptions;
      }
    }

    await video.save();

    const updated = await Video.findById(video._id)
      .populate('category', 'name slug')
      .populate('subCategory', 'name slug')
      .populate('childCategory', 'name slug')
      .populate('author', 'name avatar');

    res.json({ success: true, message: 'Video updated successfully', video: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Error updating video' });
  }
};

exports.deleteVideo = async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) return res.status(404).json({ success: false, message: 'Video not found' });
    
    const { force } = req.query;
    if (video.status !== 'trash' && force !== 'true') {
      video.status = 'trash';
      await video.save();
      return res.json({ success: true, message: 'Video moved to trash', video });
    }

                await video.deleteOne();
    res.json({ success: true, message: 'Video permanently deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Error deleting video' });
  }
};

exports.restoreVideo = async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) return res.status(404).json({ success: false, message: 'Video not found' });
    video.status = 'draft';
    await video.save();
    res.json({ success: true, message: 'Video restored from Trash to Drafts', video });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Error restoring video' });
  }
};

// @desc    Duplicate video (clone as draft with unique slug)
// @route   POST /api/videos/:id/duplicate
// @access  Private (Admin, Editor)
exports.duplicateVideo = async (req, res) => {
  try {
    const original = await Video.findById(req.params.id);
    if (!original) {
      return res.status(404).json({ success: false, message: "Video not found" });
    }

    const vidObj = original.toObject();
    delete vidObj._id;
    delete vidObj.id;
    delete vidObj.createdAt;
    delete vidObj.updatedAt;
    delete vidObj.__v;

    let baseSlug = `${original.slug || slugify(original.title, { lower: true, strict: true })}-copy`;
    let newSlug = baseSlug;
    let counter = 1;
    while (await Video.findOne({ slug: newSlug })) {
      newSlug = `${baseSlug}-${counter}`;
      counter++;
    }

    vidObj.title = `${original.title} (Copy)`;
    vidObj.slug = newSlug;
    vidObj.status = "draft";
    vidObj.views = 0;
    vidObj.likes = 0;
    if (req.user) vidObj.author = req.user._id;

    const duplicate = await Video.create(vidObj);

    res.status(201).json({
      success: true,
      message: "Video duplicated successfully as Draft",
      video: duplicate
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || "Error duplicating video" });
  }
};

// @desc    Bulk delete videos
// @route   POST /api/videos/bulk-delete
// @access  Private (Admin, Editor)
exports.bulkDeleteVideos = async (req, res) => {
  try {
    const { ids, force } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: "Please provide an array of video IDs" });
    }

    if (force === true || force === "true") {
      const result = await Video.deleteMany({ _id: { $in: ids } });
      return res.json({
        success: true,
        message: `${result.deletedCount} video(s) permanently deleted`,
        deletedCount: result.deletedCount
      });
    }

    const videos = await Video.find({ _id: { $in: ids } });
    let trashedCount = 0;
    let deletedCount = 0;

    for (const vid of videos) {
      if (vid.status !== "trash") {
        vid.status = "trash";
        await vid.save();
        trashedCount++;
      } else {
        await vid.deleteOne();
        deletedCount++;
      }
    }

    res.json({
      success: true,
      message: `${trashedCount + deletedCount} video(s) processed (${trashedCount} moved to trash, ${deletedCount} permanently deleted)`,
      trashedCount,
      deletedCount
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || "Error performing bulk delete" });
  }
};

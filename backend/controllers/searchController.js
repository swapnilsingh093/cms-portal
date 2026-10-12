const Video = require('../models/Video');
const Gallery = require('../models/Gallery');
const Post = require('../models/Post');
const Category = require('../models/Category');

// @desc    Unified Advanced Search across Videos, Galleries, and Posts
// @route   GET /api/search
// @access  Public
exports.advancedSearch = async (req, res) => {
  try {
    const {
      q,
      search,
      type = 'all',
      category,
      subCategory,
      age,
      maritalStatus,
      tags,
      sort = '-createdAt',
      page = 1,
      limit = 18
    } = req.query;

    const searchTerm = (q || search || '').trim();
    const currentPage = Math.max(1, parseInt(page) || 1);
    const pageLimit = Math.max(1, Math.min(60, parseInt(limit) || 18));
    const skip = (currentPage - 1) * pageLimit;

    // Helper to safely escape user input for RegExp
    const safeRegex = (text) => {
      const escaped = text.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      return new RegExp(escaped, 'i');
    };

    // Build common filter conditions
    const buildConditions = (extraSearchFields = []) => {
      const conditions = [{ status: 'published', displayContent: { $ne: false } }];

      if (searchTerm) {
        const regex = safeRegex(searchTerm);
        const orClauses = [
          { title: { $regex: regex } },
          { slug: { $regex: regex } },
          { tags: { $in: [regex] } }
        ];
        extraSearchFields.forEach((field) => {
          orClauses.push({ [field]: { $regex: regex } });
        });
        conditions.push({ $or: orClauses });
      }

      if (subCategory) {
        conditions.push({
          $or: [
            { subCategory },
            { category: subCategory },
            { categories: subCategory }
          ]
        });
      } else if (category) {
        conditions.push({
          $or: [
            { category },
            { subCategory: category },
            { categories: category }
          ]
        });
      }

      if (age) {
        const ageVals = Array.isArray(age)
          ? age.map(Number)
          : String(age)
              .split(',')
              .map((s) => Number(s.trim()))
              .filter((n) => !isNaN(n));
        if (ageVals.length > 0) {
          conditions.push({ age: { $in: ageVals } });
        }
      }

      if (maritalStatus && maritalStatus !== 'all' && maritalStatus !== 'any' && maritalStatus !== '') {
        conditions.push({ maritalStatus: maritalStatus.trim().toLowerCase() });
      }

      if (tags) {
        const tagList = Array.isArray(tags)
          ? tags
          : String(tags)
              .split(',')
              .map((t) => t.trim())
              .filter(Boolean);
        if (tagList.length > 0) {
          conditions.push({ tags: { $in: tagList } });
        }
      }

      return conditions.length > 0 ? { $and: conditions } : {};
    };

    // Sort order
    let sortOptions = { createdAt: -1 };
    if (sort === 'popular' || sort === '-views' || sort === 'views') {
      sortOptions = { views: -1, createdAt: -1 };
    } else if (sort === 'oldest' || sort === 'createdAt') {
      sortOptions = { createdAt: 1 };
    } else if (sort === 'title') {
      sortOptions = { title: 1 };
    }

    const videoQuery = buildConditions(['description', 'shortDescription']);
    const galleryQuery = buildConditions(['description', 'shortDescription']);
    const postQuery = buildConditions(['excerpt', 'shortDescription', 'content']);

    const queryType = String(type).toLowerCase();
    const shouldFetchVideos = ['all', 'video', 'videos'].includes(queryType);
    const shouldFetchGalleries = ['all', 'gallery', 'galleries'].includes(queryType);
    const shouldFetchPosts = ['all', 'post', 'posts'].includes(queryType);

    // Parallel count & query promises
    const [
      videoTotal,
      galleryTotal,
      postTotal,
      videoList,
      galleryList,
      postList
    ] = await Promise.all([
      shouldFetchVideos ? Video.countDocuments(videoQuery) : Promise.resolve(0),
      shouldFetchGalleries ? Gallery.countDocuments(galleryQuery) : Promise.resolve(0),
      shouldFetchPosts ? Post.countDocuments(postQuery) : Promise.resolve(0),

      shouldFetchVideos
        ? Video.find(videoQuery)
            .populate('category', 'name slug')
            .populate('subCategory', 'name slug')
            .populate('author', 'name avatar')
            .sort(sortOptions)
            .skip(queryType !== 'all' ? skip : 0)
            .limit(queryType !== 'all' ? pageLimit : 100)
            .lean()
        : Promise.resolve([]),

      shouldFetchGalleries
        ? Gallery.find(galleryQuery)
            .populate('category', 'name slug')
            .populate('subCategory', 'name slug')
            .populate('author', 'name avatar')
            .sort(sortOptions)
            .skip(queryType !== 'all' ? skip : 0)
            .limit(queryType !== 'all' ? pageLimit : 100)
            .lean()
        : Promise.resolve([]),

      shouldFetchPosts
        ? Post.find(postQuery)
            .populate('category', 'name slug')
            .populate('subCategory', 'name slug')
            .populate('author', 'name avatar')
            .sort(sortOptions)
            .skip(queryType !== 'all' ? skip : 0)
            .limit(queryType !== 'all' ? pageLimit : 100)
            .lean()
        : Promise.resolve([])
    ]);

    // Map into unified items
    const normalizedVideos = videoList.map((v) => ({
      _id: v._id,
      title: v.title,
      slug: v.slug,
      itemType: 'video',
      thumbnail: v.thumbnail || v.poster || v.banner || '',
      category: v.category,
      subCategory: v.subCategory,
      age: v.age || [],
      maritalStatus: v.maritalStatus || '',
      tags: v.tags || [],
      views: v.views || 0,
      duration: v.duration || '',
      excerpt: v.shortDescription || v.description || '',
      createdAt: v.createdAt
    }));

    const normalizedGalleries = galleryList.map((g) => ({
      _id: g._id,
      title: g.title,
      slug: g.slug,
      itemType: 'gallery',
      thumbnail: g.coverImage || (g.images && g.images[0] ? g.images[0].url : '') || g.banner || '',
      imageCount: g.images ? g.images.length : 0,
      category: g.category,
      subCategory: g.subCategory,
      age: g.age || [],
      maritalStatus: g.maritalStatus || '',
      tags: g.tags || [],
      views: g.views || 0,
      excerpt: g.shortDescription || g.description || '',
      createdAt: g.createdAt
    }));

    const normalizedPosts = postList.map((p) => ({
      _id: p._id,
      title: p.title,
      slug: p.slug,
      itemType: 'post',
      thumbnail: p.featuredImage || p.banner || '',
      category: p.category,
      subCategory: p.subCategory,
      age: p.age || [],
      maritalStatus: p.maritalStatus || '',
      tags: p.tags || [],
      views: p.views || 0,
      excerpt: p.shortDescription || p.excerpt || '',
      createdAt: p.createdAt
    }));

    let allItems = [];
    let grandTotal = 0;

    if (queryType === 'all') {
      allItems = [...normalizedVideos, ...normalizedGalleries, ...normalizedPosts];
      // Sort combined array
      if (sort === 'popular' || sort === '-views' || sort === 'views') {
        allItems.sort((a, b) => (b.views || 0) - (a.views || 0));
      } else if (sort === 'oldest' || sort === 'createdAt') {
        allItems.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      } else if (sort === 'title') {
        allItems.sort((a, b) => a.title.localeCompare(b.title));
      } else {
        allItems.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      }
      grandTotal = videoTotal + galleryTotal + postTotal;
      allItems = allItems.slice(skip, skip + pageLimit);
    } else if (['video', 'videos'].includes(queryType)) {
      allItems = normalizedVideos;
      grandTotal = videoTotal;
    } else if (['gallery', 'galleries'].includes(queryType)) {
      allItems = normalizedGalleries;
      grandTotal = galleryTotal;
    } else {
      allItems = normalizedPosts;
      grandTotal = postTotal;
    }

    // Also fetch top tags across database for filter suggestions
    const [videoTags, galleryTags, postTags] = await Promise.all([
      Video.distinct('tags', { status: 'published' }),
      Gallery.distinct('tags', { status: 'published' }),
      Post.distinct('tags', { status: 'published' })
    ]);
    const availableTags = Array.from(new Set([...videoTags, ...galleryTags, ...postTags]))
      .filter((t) => typeof t === 'string' && t.trim().length > 0)
      .slice(0, 30);

    res.json({
      success: true,
      total: grandTotal,
      items: allItems,
      pagination: {
        total: grandTotal,
        page: currentPage,
        limit: pageLimit,
        pages: Math.ceil(grandTotal / pageLimit) || 1
      },
      counts: {
        all: videoTotal + galleryTotal + postTotal,
        videos: videoTotal,
        galleries: galleryTotal,
        posts: postTotal
      },
      availableTags
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error processing advanced search'
    });
  }
};

const Video = require('../models/Video');
const Gallery = require('../models/Gallery');
const Post = require('../models/Post');
const Category = require('../models/Category');
const User = require('../models/User');
const Page = require('../models/Page');

// @desc    Get dashboard metrics & summary
// @route   GET /api/stats
// @access  Private (Admin / Editor)
exports.getDashboardStats = async (req, res) => {
  try {
    const [
      totalVideos,
      totalGalleries,
      totalPosts,
      totalCategories,
      totalUsers,
      totalPages,
      recentVideos,
      recentPosts
    ] = await Promise.all([
      Video.countDocuments(),
      Gallery.countDocuments(),
      Post.countDocuments(),
      Category.countDocuments(),
      User.countDocuments(),
      Page.countDocuments(),
      Video.find().sort({ createdAt: -1 }).limit(5).select('title slug views createdAt poster thumbnail'),
      Post.find().sort({ createdAt: -1 }).limit(5).select('title slug views createdAt featuredImage status')
    ]);

    // Aggregate total views
    const videoViewsAgg = await Video.aggregate([
      { $group: { _id: null, totalViews: { $sum: '$views' } } }
    ]);
    const postViewsAgg = await Post.aggregate([
      { $group: { _id: null, totalViews: { $sum: '$views' } } }
    ]);

    const totalViews =
      (videoViewsAgg[0]?.totalViews || 0) +
      (postViewsAgg[0]?.totalViews || 0);

    res.json({
      success: true,
      stats: {
        totalVideos,
        totalGalleries,
        totalPosts,
        totalCategories,
        totalUsers,
        totalPages,
        totalViews
      },
      recent: {
        videos: recentVideos,
        posts: recentPosts
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching stats'
    });
  }
};

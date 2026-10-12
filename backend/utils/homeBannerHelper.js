const Video = require('../models/Video');
const Post = require('../models/Post');
const Gallery = require('../models/Gallery');

/**
 * Ensures that only ONE item of the same type has featuredOnHomeBanner: true.
 * For example, featuring a post will only unfeature any other post, leaving featured videos and galleries intact.
 * @param {'video' | 'post' | 'gallery'} currentType - The type of the item being featured
 * @param {string|import('mongoose').Types.ObjectId} currentId - The ID of the item being featured
 */
async function setExclusiveHomeBanner(currentType, currentId) {
  try {
    if (currentType === 'video') {
      await Video.updateMany({ _id: { $ne: currentId } }, { featuredOnHomeBanner: false });
    } else if (currentType === 'post') {
      await Post.updateMany({ _id: { $ne: currentId } }, { featuredOnHomeBanner: false });
    } else if (currentType === 'gallery') {
      await Gallery.updateMany({ _id: { $ne: currentId } }, { featuredOnHomeBanner: false });
    }
  } catch (err) {
    console.error('Error setting exclusive home banner per type:', err.message);
  }
}

/**
 * Fetches the active featured items for each type: video, post, and gallery.
 * If no item is explicitly featured for a type, automatically falls back to the latest published item.
 */
async function getHomeFeaturedBanners() {
  try {
    const [video, post, gallery] = await Promise.all([
      Video.findOne({ featuredOnHomeBanner: true, status: 'published', displayContent: { $ne: false } }).sort({ updatedAt: -1 }).lean(),
      Post.findOne({ featuredOnHomeBanner: true, status: 'published', displayContent: { $ne: false } }).sort({ updatedAt: -1 }).lean(),
      Gallery.findOne({ featuredOnHomeBanner: true, status: 'published', displayContent: { $ne: false } }).sort({ updatedAt: -1 }).lean()
    ]);

    const [fallbackVideo, fallbackPost, fallbackGallery] = await Promise.all([
      !video ? Video.findOne({ status: 'published', displayContent: { $ne: false } }).sort({ createdAt: -1 }).lean() : null,
      !post ? Post.findOne({ status: 'published', displayContent: { $ne: false } }).sort({ createdAt: -1 }).lean() : null,
      !gallery ? Gallery.findOne({ status: 'published', displayContent: { $ne: false } }).sort({ createdAt: -1 }).lean() : null
    ]);

    return {
      featuredVideo: video || fallbackVideo || null,
      featuredPost: post || fallbackPost || null,
      featuredGallery: gallery || fallbackGallery || null
    };
  } catch (err) {
    console.error('Error getting home featured banners:', err.message);
    return { featuredVideo: null, featuredPost: null, featuredGallery: null };
  }
}

/**
 * Backward compatibility helper: returns the first featured item if any.
 */
async function getHomeFeaturedBanner() {
  const banners = await getHomeFeaturedBanners();
  if (banners.featuredVideo) return { type: 'video', item: banners.featuredVideo };
  if (banners.featuredPost) return { type: 'post', item: banners.featuredPost };
  if (banners.featuredGallery) return { type: 'gallery', item: banners.featuredGallery };
  return null;
}

module.exports = {
  setExclusiveHomeBanner,
  getHomeFeaturedBanners,
  getHomeFeaturedBanner
};

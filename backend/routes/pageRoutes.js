const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const { protect, authorizePermission } = require('../middleware/auth');
const {
  getPages,
  getPageBySlug,
  getHomePage,
  getVideosPage,
  getStoriesPage,
  getGalleriesPage,
  createPage,
  updatePage,
  deletePage,
  duplicatePage,
  bulkDeletePages
} = require('../controllers/pageController');

router.get('/', getPages);
router.get('/template/home', getHomePage);
router.get('/template/videos', getVideosPage);
router.get('/template/stories', getStoriesPage);
router.get('/template/galleries', getGalleriesPage);
router.get('/:slug', getPageBySlug);

// Duplicate Page
router.post('/bulk-delete', protect, authorizePermission('pages', 'delete'), bulkDeletePages);
router.post('/:id/duplicate', protect, authorizePermission('pages', 'create'), duplicatePage);

// Bulk Delete Pages

router.post(
  '/',
  protect,
  authorizePermission('pages', 'create'),
  upload.single('banner'),
  createPage
);

router.put(
  '/:id',
  protect,
  authorizePermission('pages', 'edit'),
  upload.single('banner'),
  updatePage
);

router.delete('/:id', protect, authorizePermission('pages', 'delete'), deletePage);

module.exports = router;

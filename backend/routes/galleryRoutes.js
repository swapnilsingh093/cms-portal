const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const { protect, authorize, authorizePermission, optionalAuth } = require('../middleware/auth');
const {
  getGalleries,
  getGalleryBySlug,
  createGallery,
  updateGallery,
  deleteGallery,
  restoreGallery,
  duplicateGallery,
  bulkDeleteGalleries
} = require('../controllers/galleryController');

router.get('/', optionalAuth, getGalleries);
router.get('/:slug', optionalAuth, getGalleryBySlug);

router.post('/bulk-delete', protect, authorizePermission('galleries', 'delete'), bulkDeleteGalleries);
router.post('/:id/duplicate', protect, authorizePermission('galleries', 'create'), duplicateGallery);

router.post(
  '/',
  protect,
  authorizePermission('galleries', 'create'),
  upload.fields([
    { name: 'coverImage', maxCount: 1 },
    { name: 'banner', maxCount: 1 },
    { name: 'galleryImages', maxCount: 50 } // Multi-image batch upload
  ]),
  createGallery
);

router.put(
  '/:id',
  protect,
  authorizePermission('galleries', 'edit'),
  upload.fields([
    { name: 'coverImage', maxCount: 1 },
    { name: 'banner', maxCount: 1 },
    { name: 'galleryImages', maxCount: 50 }
  ]),
  updateGallery
);

router.put('/:id/restore', protect, authorizePermission('galleries', 'edit'), restoreGallery);
router.delete('/:id', protect, authorizePermission('galleries', 'delete'), deleteGallery);

module.exports = router;

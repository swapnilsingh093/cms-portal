const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const { protect, authorizePermission, optionalAuth } = require('../middleware/auth');
const {
  getVideos,
  getVideoBySlug,
  createVideo,
  updateVideo,
  deleteVideo,
  duplicateVideo,
  bulkDeleteVideos
} = require('../controllers/videoController');

router.get('/', optionalAuth, getVideos);
router.get('/:slug', optionalAuth, getVideoBySlug);

// Duplicate Video
router.post('/bulk-delete', protect, authorizePermission('videos', 'delete'), bulkDeleteVideos);
router.post('/:id/duplicate', protect, authorizePermission('videos', 'create'), duplicateVideo);

// Bulk Delete Videos

router.post(
  '/',
  protect,
  authorizePermission('videos', 'create'),
  upload.fields([
    { name: 'video', maxCount: 1 },
    { name: 'poster', maxCount: 1 }
  ]),
  createVideo
);

router.put(
  '/:id',
  protect,
  authorizePermission('videos', 'edit'),
  upload.fields([
    { name: 'video', maxCount: 1 },
    { name: 'poster', maxCount: 1 }
  ]),
  updateVideo
);

router.delete('/:id', protect, authorizePermission('videos', 'delete'), deleteVideo);

module.exports = router;

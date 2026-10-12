const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const { protect, authorize, authorizePermission, optionalAuth } = require('../middleware/auth');
const {
  getPosts,
  getPostBySlug,
  createPost,
  updatePost,
  deletePost,
  restorePost,
  duplicatePost,
  bulkDeletePosts,
  importPostDocument,
  exportPostDocument,
  exportRawPostDocument
} = require('../controllers/postController');

router.get('/', optionalAuth, getPosts);

// Document Import & Export endpoints
router.post('/import-doc', protect, authorizePermission('posts', 'create'), upload.single('document'), importPostDocument);
router.post('/export-raw', protect, exportRawPostDocument);
router.get('/:id/export', optionalAuth, exportPostDocument);

router.get('/:slug', optionalAuth, getPostBySlug);

// Duplicate Post
router.post('/bulk-delete', protect, authorizePermission('posts', 'delete'), bulkDeletePosts);
router.post('/:id/duplicate', protect, authorizePermission('posts', 'create'), duplicatePost);

// Bulk Delete Posts

router.post(
  '/',
  protect,
  authorizePermission('posts', 'create'),
  upload.fields([
    { name: 'featuredImage', maxCount: 1 },
    { name: 'banner', maxCount: 1 },
    { name: 'video', maxCount: 1 }
  ]),
  createPost
);

router.put(
  '/:id',
  protect,
  authorizePermission('posts', 'edit'),
  upload.fields([
    { name: 'featuredImage', maxCount: 1 },
    { name: 'banner', maxCount: 1 },
    { name: 'video', maxCount: 1 }
  ]),
  updatePost
);

router.put('/:id/restore', protect, authorizePermission('posts', 'edit'), restorePost);
router.delete('/:id', protect, authorizePermission('posts', 'delete'), deletePost);

module.exports = router;

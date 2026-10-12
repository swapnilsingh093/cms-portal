const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const { protect, authorize } = require('../middleware/auth');
const {
  getCategories,
  getCategoryTree,
  getCategoryBySlug,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory
} = require('../controllers/categoryController');

// Public routes
router.get('/', getCategories);
router.get('/tree', getCategoryTree); // Hierarchical Tree!
router.get('/id/:id', getCategoryById); // Get by MongoDB ID
router.get('/:slug', getCategoryBySlug);

// Protected routes (Admin & Editor)
router.post(
  '/',
  protect,
  authorize('admin', 'editor'),
  upload.fields([
    { name: 'thumbnail', maxCount: 1 },
    { name: 'banner', maxCount: 1 }
  ]),
  createCategory
);

router.put(
  '/:id',
  protect,
  authorize('admin', 'editor'),
  upload.fields([
    { name: 'thumbnail', maxCount: 1 },
    { name: 'banner', maxCount: 1 }
  ]),
  updateCategory
);

router.delete('/:id', protect, authorize('admin'), deleteCategory);

module.exports = router;

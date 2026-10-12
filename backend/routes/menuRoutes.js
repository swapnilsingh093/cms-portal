const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getMenus,
  getMenuByLocation,
  createMenu,
  updateMenu,
  deleteMenu
} = require('../controllers/menuController');

router.get('/', getMenus);
router.get('/location/:location', getMenuByLocation);

router.post('/', protect, authorize('admin'), createMenu);
router.put('/:id', protect, authorize('admin'), updateMenu);
router.delete('/:id', protect, authorize('admin'), deleteMenu);

module.exports = router;

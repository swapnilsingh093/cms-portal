const express = require('express');
const router = express.Router();
const { protect, authorize, authorizePermission } = require('../middleware/auth');
const {
  getThemeSettings,
  updateThemeSettings
} = require('../controllers/themeController');

// Public read of theme settings (so website front-end and customizer preview can read them)
router.get('/', getThemeSettings);

// Admin-only update
router.put('/', protect, authorizePermission('theme', 'edit'), updateThemeSettings);

module.exports = router;

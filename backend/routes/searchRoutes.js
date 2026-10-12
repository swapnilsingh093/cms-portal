const express = require('express');
const router = express.Router();
const searchController = require('../controllers/searchController');

// @route   GET /api/search
// @desc    Advanced search across Videos, Galleries, and Posts
// @access  Public
router.get('/', searchController.advancedSearch);

module.exports = router;

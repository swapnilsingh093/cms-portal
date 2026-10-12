const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { getDashboardStats } = require('../controllers/statsController');

router.use(protect);
router.use(authorize('admin', 'editor'));

router.get('/', getDashboardStats);

module.exports = router;

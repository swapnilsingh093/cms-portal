const express = require('express');
const router = express.Router();
const { protect, optionalAuth } = require('../middleware/auth');
const {
  getFieldGroups,
  createFieldGroup,
  updateFieldGroup,
  deleteFieldGroup,
  reorderFieldGroups
} = require('../controllers/videoFieldController');

// Public / Authenticated read
router.get('/', optionalAuth, getFieldGroups);

// Admin-only management
router.post('/', protect, createFieldGroup);
router.put('/reorder', protect, reorderFieldGroups);
router.put('/:id', protect, updateFieldGroup);
router.delete('/:id', protect, deleteFieldGroup);

module.exports = router;

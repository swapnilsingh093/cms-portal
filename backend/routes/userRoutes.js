const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getUsers,
  getAuthors,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  approveUser,
  rejectUser,
  toggleSuspendUser
} = require('../controllers/userController');

// Logged-in users can fetch authors for assignment dropdown
router.get('/authors', protect, getAuthors);

// All user management routes require admin role
router.use(protect);
router.use(authorize('admin'));

router.get('/', getUsers);
router.get('/:id', getUserById);
router.post('/', createUser);
router.put('/:id', updateUser);
router.put('/:id/approve', approveUser);
router.put('/:id/reject', rejectUser);
router.put('/:id/suspend', toggleSuspendUser);
router.delete('/:id', deleteUser);

module.exports = router;

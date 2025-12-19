const express = require('express');
const router = express.Router();
const {
  getUsers,
  createUser,
  getUserById,
  updateUser,
  deleteUser,
  getUsersByRole,
  getUserStats
} = require('../controllers/userController');
const { verifyToken, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(verifyToken);

// Routes
router.get('/', getUsers);
router.post('/', authorize('admin'), createUser);
router.get('/stats', authorize('admin'), getUserStats);
router.get('/role/:role', authorize('admin'), getUsersByRole);
router.get('/:id', authorize('admin'), getUserById);
router.put('/:id', authorize('admin'), updateUser);
router.delete('/:id', authorize('admin'), deleteUser);

module.exports = router;

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

// All routes require admin access
router.use(authorize('admin'));

router.get('/', getUsers);
router.post('/', createUser);
router.get('/stats', getUserStats);
router.get('/role/:role', getUsersByRole);
router.get('/:id', getUserById);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);

module.exports = router;

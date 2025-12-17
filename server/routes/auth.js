const express = require('express');
const router = express.Router();
const {
  registerUser,
  loginUser,
  getProfile,
  updateProfile,
  changePassword,
  logoutUser,
  forgotPassword,
  resetPassword
} = require('../controllers/authController');
const { verifyToken } = require('../middleware/auth');

// Public routes
router.post('/login', loginUser);
// router.post('/register', registerUser);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);

// Protected routes
router.use(verifyToken); // All routes below require authentication

router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.put('/change-password', changePassword);
router.post('/logout', logoutUser);

module.exports = router;

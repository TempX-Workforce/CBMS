const express = require('express');
const router = express.Router();
const {
    getSettings,
    getPublicSettings,
    updateSettings,
    resetSettings,
    getSystemInfo
} = require('../controllers/settingsController');
const { verifyToken, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(verifyToken);

// Get public settings (All authenticated users)
router.get('/public', getPublicSettings);

// Get all settings (Admin only)
router.get('/', authorize('admin'), getSettings);

// Get system information (Admin only)
router.get('/system-info', authorize('admin'), getSystemInfo);

// Update settings (Admin only)
router.put('/', authorize('admin'), updateSettings);

// Reset settings to default (Admin only)
router.post('/reset', authorize('admin'), resetSettings);

module.exports = router;

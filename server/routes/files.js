const express = require('express');
const router = express.Router();
const { handleFileUpload, serveFiles } = require('../middleware/fileUpload');
const { uploadFiles, getFileInfo, deleteFileById, getDownloadUrl, cleanupFiles, getFileStats } = require('../controllers/fileController');
const { verifyToken, authorize } = require('../middleware/auth');

// File upload route
router.post('/upload', verifyToken, handleFileUpload, uploadFiles);

// File serving route (public)
router.get('/serve/:departmentId/:filename', serveFiles);

// File management routes (protected)
router.get('/:fileId', verifyToken, getFileInfo);
router.delete('/:fileId', verifyToken, deleteFileById);
router.get('/:fileId/download', verifyToken, getDownloadUrl);

// Admin routes
router.post('/cleanup', verifyToken, authorize('admin'), cleanupFiles);
router.get('/stats', verifyToken, authorize('admin'), getFileStats);

module.exports = router;

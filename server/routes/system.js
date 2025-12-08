const express = require('express');
const router = express.Router();
const { getConcurrencyStatus } = require('../controllers/systemController');
const { verifyToken, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(verifyToken);

// Get system concurrency status (Admin, Office)
router.get('/concurrency-status', authorize('admin', 'office'), getConcurrencyStatus);

module.exports = router;

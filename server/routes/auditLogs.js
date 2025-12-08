const express = require('express');
const router = express.Router();
const {
    getAuditLogs,
    getAuditLogById,
    getAuditLogStats,
    createAuditLog,
    exportAuditLogs
} = require('../controllers/auditLogController');
const { verifyToken, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(verifyToken);

// Get all audit logs (Admin, Office, VP, Principal)
router.get('/', authorize('admin', 'office', 'vice_principal', 'principal'), getAuditLogs);

// Get audit log statistics (Admin, Office, VP, Principal)
router.get('/stats', authorize('admin', 'office', 'vice_principal', 'principal'), getAuditLogStats);

// Export audit logs (Admin, Office, VP, Principal)
router.get('/export', authorize('admin', 'office', 'vice_principal', 'principal'), exportAuditLogs);

// Get audit log by ID (Admin, Office, VP, Principal)
router.get('/:id', authorize('admin', 'office', 'vice_principal', 'principal'), getAuditLogById);

// Create audit log entry (Internal use mainly, but can be triggered manually)
router.post('/', authorize('admin'), createAuditLog);

module.exports = router;

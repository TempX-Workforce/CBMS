const AuditLog = require('../models/AuditLog');

// @desc    Get all audit logs
// @route   GET /api/audit-logs
// @access  Private/Admin/Office/VP/Principal
const getAuditLogs = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 20,
            startDate,
            endDate,
            eventType,
            actor,
            targetEntity
        } = req.query;

        const query = {};

        if (startDate && endDate) {
            query.createdAt = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }

        if (eventType) query.eventType = eventType;
        if (actor) query.actor = actor;
        if (targetEntity) query.targetEntity = targetEntity;

        const logs = await AuditLog.find(query)
            .populate('actor', 'name email role')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await AuditLog.countDocuments(query);

        res.json({
            success: true,
            data: {
                logs,
                pagination: {
                    current: parseInt(page),
                    pages: Math.ceil(total / limit),
                    total
                }
            }
        });
    } catch (error) {
        console.error('Get audit logs error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching audit logs',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// @desc    Get audit log by ID
// @route   GET /api/audit-logs/:id
// @access  Private/Admin/Office/VP/Principal
const getAuditLogById = async (req, res) => {
    try {
        const log = await AuditLog.findById(req.params.id)
            .populate('actor', 'name email role');

        if (!log) {
            return res.status(404).json({
                success: false,
                message: 'Audit log not found'
            });
        }

        res.json({
            success: true,
            data: { log }
        });
    } catch (error) {
        console.error('Get audit log by ID error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching audit log',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// @desc    Get audit log statistics
// @route   GET /api/audit-logs/stats
// @access  Private/Admin/Office/VP/Principal
const getAuditLogStats = async (req, res) => {
    try {
        // Stats for the last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const stats = await AuditLog.aggregate([
            { $match: { createdAt: { $gte: thirtyDaysAgo } } },
            {
                $group: {
                    _id: '$eventType',
                    count: { $sum: 1 }
                }
            },
            { $sort: { count: -1 } }
        ]);

        const logsByRole = await AuditLog.aggregate([
            { $match: { createdAt: { $gte: thirtyDaysAgo } } },
            {
                $group: {
                    _id: '$actorRole',
                    count: { $sum: 1 }
                }
            }
        ]);

        res.json({
            success: true,
            data: {
                stats: {
                    totalLogs: await AuditLog.countDocuments(),
                    recentLogs: await AuditLog.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
                    logsByEventType: stats,
                    logsByActorRole: logsByRole
                }
            }
        });
    } catch (error) {
        console.error('Get audit log stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching audit log stats',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// @desc    Create audit log entry (Internal use)
// @route   POST /api/audit-logs
// @access  Private/Internal
const createAuditLog = async (req, res) => {
    try {
        const {
            eventType,
            actor,
            actorRole,
            targetEntity,
            targetId,
            details,
            previousValues,
            newValues,
            ipAddress,
            userAgent
        } = req.body;

        const log = await AuditLog.create({
            eventType,
            actor,
            actorRole,
            targetEntity,
            targetId,
            details,
            previousValues,
            newValues,
            ipAddress,
            userAgent
        });

        res.status(201).json({
            success: true,
            data: { log }
        });
    } catch (error) {
        console.error('Create audit log error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while creating audit log',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// @desc    Export audit logs
// @route   GET /api/audit-logs/export
// @access  Private/Admin/Office/VP/Principal
const exportAuditLogs = async (req, res) => {
    try {
        // In a real implementation, this would generate a CSV or PDF file
        // For now, we'll just return the data suitable for client-side export

        const {
            startDate,
            endDate,
            eventType
        } = req.query;

        const query = {};

        if (startDate && endDate) {
            query.createdAt = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }

        if (eventType) query.eventType = eventType;

        const logs = await AuditLog.find(query)
            .populate('actor', 'name email')
            .sort({ createdAt: -1 })
            .limit(1000); // Limit export size

        res.json({
            success: true,
            data: { logs }
        });
    } catch (error) {
        console.error('Export audit logs error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while exporting audit logs',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

module.exports = {
    getAuditLogs,
    getAuditLogById,
    getAuditLogStats,
    createAuditLog,
    exportAuditLogs
};

const mongoose = require('mongoose');

// @desc    Get system concurrency status
// @route   GET /api/system/concurrency-status
// @access  Private
const getConcurrencyStatus = async (req, res) => {
    try {
        // Get DB status
        const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';

        // Get basic stats
        const User = require('../models/User');
        const userCount = await User.countDocuments();

        res.json({
            success: true,
            data: {
                status: 'healthy',
                database: dbStatus,
                activeUsers: userCount, // Approximated by total users for now
                serverTime: new Date()
            }
        });
    } catch (error) {
        console.error('Get system status error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while checking system status'
        });
    }
};

module.exports = {
    getConcurrencyStatus
};

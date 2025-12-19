const mongoose = require('mongoose');

const pushSubscriptionSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    endpoint: {
        type: String,
        required: true,
        unique: true
    },
    keys: {
        p256dh: String,
        auth: String
    },
    userAgent: String,
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 60 * 60 * 24 * 30 // Expire after 30 days of inactivity (optional policy)
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('PushSubscription', pushSubscriptionSchema);

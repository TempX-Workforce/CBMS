const express = require('express');
const router = express.Router();
const PushSubscription = require('../models/PushSubscription');
const { publicVapidKey } = require('../services/pushService');
const { verifyToken } = require('../middleware/auth');

// Get VAPID Public Key
router.get('/public-key', (req, res) => {
    res.json({ publicKey: publicVapidKey });
});

// Subscribe to push notifications
router.post('/subscribe', verifyToken, async (req, res) => {
    const subscription = req.body;
    const userAgent = req.headers['user-agent'];

    try {
        // Check if subscription already exists
        const existing = await PushSubscription.findOne({ endpoint: subscription.endpoint });

        if (existing) {
            // Update user association if changed (e.g. logout/login)
            if (existing.user.toString() !== req.user._id.toString()) {
                existing.user = req.user._id;
                await existing.save();
            }
            return res.status(200).json({ message: 'Subscription updated' });
        }

        // Create new subscription
        await PushSubscription.create({
            user: req.user._id,
            endpoint: subscription.endpoint,
            keys: subscription.keys,
            userAgent
        });

        res.status(201).json({ message: 'Subscribed successfully' });
    } catch (error) {
        console.error('Subscription error:', error);
        res.status(500).json({ message: 'Failed to subscribe' });
    }
});

// Unsubscribe
router.post('/unsubscribe', verifyToken, async (req, res) => {
    try {
        await PushSubscription.findOneAndDelete({ endpoint: req.body.endpoint });
        res.status(200).json({ message: 'Unsubscribed successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to unsubscribe' });
    }
});

module.exports = router;

const webpush = require('web-push');

// Configure VAPID keys
// In production, these should be in environment variables
const publicVapidKey = process.env.VAPID_PUBLIC_KEY || 'BDct424twUV9dyvSl-4oRYDkfVO6VRijQIjqyIOM6PEq5Hi9eoHPjY06Vb1HsqPqeSNJbdh8DH5za8gCR5sc2KA';
const privateVapidKey = process.env.VAPID_PRIVATE_KEY || '301OFwF1X6Ddefo4Zw3Svoz0pRSuQX_FlyERfvvHyLw';

webpush.setVapidDetails(
    'mailto:boominathanalagirisamy@gmail.com',
    publicVapidKey,
    privateVapidKey
);

/**
 * Send a push notification to a specific subscription
 * @param {Object} subscription - Push subscription object
 * @param {Object} data - Payload data
 */
const sendPushNotification = async (subscription, data) => {
    try {
        const payload = JSON.stringify(data);
        await webpush.sendNotification(subscription, payload);
        console.log('Push notification sent successfully');
        return true;
    } catch (error) {
        console.error('Error sending push notification:', error);
        return false;
    }
};

module.exports = {
    webpush,
    sendPushNotification,
    publicVapidKey
};

const crypto = require('crypto');

// Get encryption key from environment variable or generate a random one for dev
// In production, this MUST be a stable 32-byte hex string stored in .env
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY
    ? Buffer.from(process.env.ENCRYPTION_KEY, 'hex')
    : crypto.randomBytes(32); // Fallback for dev only - will make old logs unreadable on restart

const IV_LENGTH = 16; // AES block size

/**
 * Encrypts text using AES-256-CBC
 * @param {string|Object} text - Text or Object to encrypt
 * @returns {string} - Encrypted text in format iv:content
 */
const encrypt = (text) => {
    if (!text) return text;

    // Convert object to string if needed
    const textToEncrypt = typeof text === 'object' ? JSON.stringify(text) : String(text);

    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);

    let encrypted = cipher.update(textToEncrypt);
    encrypted = Buffer.concat([encrypted, cipher.final()]);

    return iv.toString('hex') + ':' + encrypted.toString('hex');
};

/**
 * Decrypts text using AES-256-CBC
 * @param {string} text - Encrypted text in format iv:content
 * @returns {string|Object} - Decrypted text or Object (if it was JSON)
 */
const decrypt = (text) => {
    if (!text) return text;

    try {
        const textParts = text.split(':');
        if (textParts.length < 2) return text; // Not encrypted or invalid format

        const iv = Buffer.from(textParts.shift(), 'hex');
        const encryptedText = Buffer.from(textParts.join(':'), 'hex');
        const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);

        let decrypted = decipher.update(encryptedText);
        decrypted = Buffer.concat([decrypted, decipher.final()]);

        const decryptedString = decrypted.toString();

        // Try to parse back to object if it looks like JSON
        try {
            if (decryptedString.startsWith('{') || decryptedString.startsWith('[')) {
                return JSON.parse(decryptedString);
            }
        } catch (e) {
            // Not JSON, return as string
        }

        return decryptedString;
    } catch (error) {
        console.error('Decryption error:', error.message);
        return text; // Return original on error to prevent crashing
    }
};

module.exports = { encrypt, decrypt };

const crypto = require('crypto');

// Encryption configuration - In production, use environment variables
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'your-32-character-encryption-key-here';
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // keep 16 bytes IV for consistency
const AUTH_TAG_LENGTH = 16;

function getKey() {
  // Derive a 32-byte key from the provided string
  return crypto.createHash('sha256').update(ENCRYPTION_KEY).digest().subarray(0, 32);
}

class EncryptionService {
  /**
   * Encrypt sensitive data using AES-256-GCM
   * @param {string} text - Plain text to encrypt
   * @returns {string} - Encrypted data as base64 string
   */
  static encrypt(text) {
    if (!text) return null;
    try {
      const iv = crypto.randomBytes(IV_LENGTH);
      const key = getKey();
      const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
      const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
      const authTag = cipher.getAuthTag();
      const result = Buffer.concat([iv, authTag, encrypted]);
      return result.toString('base64');
    } catch (err) {
      console.error('Encryption failed:', err.message);
      return null;
    }
  }

  /**
   * Decrypt sensitive data
   * @param {string} encryptedText - Base64 encrypted string
   * @returns {string} - Decrypted plain text
   */
  static decrypt(encryptedText) {
    if (!encryptedText) return null;
    try {
      const buffer = Buffer.from(encryptedText, 'base64');
      const iv = buffer.subarray(0, IV_LENGTH);
      const authTag = buffer.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
      const encrypted = buffer.subarray(IV_LENGTH + AUTH_TAG_LENGTH);
      const key = getKey();
      const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
      decipher.setAuthTag(authTag);
      const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
      return decrypted.toString('utf8');
    } catch (error) {
      console.error('Decryption failed:', error.message);
      return null;
    }
  }

  /**
   * Hash sensitive data (one-way) for verification without storing plain text
   * @param {string} text - Text to hash
   * @returns {string} - Hashed string
   */
  static hash(text) {
    if (!text) return null;
    return crypto.createHash('sha256').update(text).digest('hex');
  }

  /**
   * Generate a secure token for payment method references
   * @returns {string} - Secure token
   */
  static generateToken() {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Mask sensitive card information for display
   * @param {string} cardNumber - Full card number
   * @returns {string} - Masked card number (e.g., **** **** **** 1234)
   */
  static maskCardNumber(cardNumber) {
    if (!cardNumber || cardNumber.length < 4) return '**** **** **** ****';

    const lastFour = cardNumber.slice(-4);
    const maskedLength = cardNumber.length - 4;
    const masked = '*'.repeat(maskedLength);

    // Format as **** **** **** 1234
    if (cardNumber.length === 16) {
      return `**** **** **** ${lastFour}`;
    }

    return masked + lastFour;
  }

  /**
   * Validate card number using Luhn algorithm
   * @param {string} cardNumber - Card number to validate
   * @returns {boolean} - True if valid
   */
  static validateCardNumber(cardNumber) {
    if (!cardNumber) return false;

    // Remove spaces and non-digits
    const cleaned = cardNumber.replace(/\D/g, '');

    if (cleaned.length < 13 || cleaned.length > 19) return false;

    let sum = 0;
    let shouldDouble = false;

    // Luhn algorithm
    for (let i = cleaned.length - 1; i >= 0; i--) {
      let digit = parseInt(cleaned.charAt(i), 10);

      if (shouldDouble) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }

      sum += digit;
      shouldDouble = !shouldDouble;
    }

    return sum % 10 === 0;
  }
}

module.exports = EncryptionService;
const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 12;  // 96 bits for GCM
const TAG_LENGTH = 16;

/**
 * Derive a 256-bit key from the deviceKey using PBKDF2.
 * This means raw deviceKey strings are safe — no length requirement.
 */
function deriveKey(deviceKey) {
  const salt = Buffer.from(process.env.ENCRYPTION_SALT || 'neerva-salt-2024', 'utf8');
  return crypto.pbkdf2Sync(deviceKey, salt, 100000, KEY_LENGTH, 'sha256');
}

/**
 * Encrypt a JS object using AES-256-GCM.
 * Returns: "iv:authTag:ciphertext" — all base64.
 */
function encrypt(payload, deviceKey) {
  const key = deriveKey(deviceKey);
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  const json = JSON.stringify(payload);
  const encrypted = Buffer.concat([cipher.update(json, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return [
    iv.toString('base64'),
    authTag.toString('base64'),
    encrypted.toString('base64'),
  ].join(':');
}

/**
 * Decrypt an AES-256-GCM payload string.
 * Returns the original JS object.
 */
function decrypt(encryptedStr, deviceKey) {
  const [ivB64, tagB64, dataB64] = encryptedStr.split(':');
  if (!ivB64 || !tagB64 || !dataB64) throw new Error('Invalid encrypted payload format');

  const key = deriveKey(deviceKey);
  const iv = Buffer.from(ivB64, 'base64');
  const authTag = Buffer.from(tagB64, 'base64');
  const data = Buffer.from(dataB64, 'base64');

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([decipher.update(data), decipher.final()]);
  return JSON.parse(decrypted.toString('utf8'));
}

/**
 * Hash a deviceKey for storage (one-way).
 */
function hashDeviceKey(deviceKey) {
  return crypto.createHmac('sha256', process.env.JWT_SECRET || 'neerva-secret')
    .update(deviceKey)
    .digest('hex');
}

module.exports = { encrypt, decrypt, hashDeviceKey };

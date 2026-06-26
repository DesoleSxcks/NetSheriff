import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import logger from './logger.js';

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET não definido. Defina JWT_SECRET em back/.env ou na configuração de ambiente.');
}

/**
 * Hash a password using scrypt
 * @param {string} password - The password to hash
 * @returns {Promise<string>} - The hashed password with salt
 */
export async function hashPassword(password) {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16);
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) {
        reject(err);
      } else {
        resolve(salt.toString('hex') + ':' + derivedKey.toString('hex'));
      }
    });
  });
}

/**
 * Verify a password against its hash
 * @param {string} password - The password to verify
 * @param {string} hash - The hash to verify against
 * @returns {Promise<boolean>} - Whether the password matches
 */
export async function verifyPassword(password, hash) {
  return new Promise((resolve, reject) => {
    const parts = hash.split(':');
    const salt = Buffer.from(parts[0], 'hex');
    const key = Buffer.from(parts[1], 'hex');
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) {
        reject(err);
      } else {
        resolve(crypto.timingSafeEqual(key, derivedKey));
      }
    });
  });
}

/**
 * Generate a JWT token
 * @param {object} payload - The payload to encode
 * @param {string} expiresIn - Token expiration time (default: 24h)
 * @returns {string} - The JWT token
 */
export function generateToken(payload, expiresIn = '24h') {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

/**
 * Verify a JWT token
 * @param {string} token - The token to verify
 * @returns {object|null} - The decoded payload or null if invalid
 */
export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    logger.warn(`Token verification failed: ${error.message}`);
    return null;
  }
}

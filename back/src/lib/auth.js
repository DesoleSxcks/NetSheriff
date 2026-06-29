import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import logger from './logger.js';

const JWT_SECRET = process.env.JWT_SECRET;
const SCRYPT_KEY_LEN = 64;
const SCRYPT_SALT_LEN = 16;

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
    const salt = crypto.randomBytes(SCRYPT_SALT_LEN);
    crypto.scrypt(password, salt, SCRYPT_KEY_LEN, (err, derivedKey) => {
      if (err) {
        reject(err);
      } else {
        resolve(`${salt.toString('hex')}:${derivedKey.toString('hex')}`);
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
    const [saltHex, keyHex] = hash.split(':');
    if (!saltHex || !keyHex) {
      return resolve(false);
    }

    const salt = Buffer.from(saltHex, 'hex');
    const key = Buffer.from(keyHex, 'hex');

    crypto.scrypt(password, salt, key.length, (err, derivedKey) => {
      if (err) {
        reject(err);
      } else {
        try {
          resolve(crypto.timingSafeEqual(key, derivedKey));
        } catch (compareError) {
          resolve(false);
        }
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

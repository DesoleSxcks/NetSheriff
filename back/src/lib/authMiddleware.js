import { verifyToken } from './auth.js';
import logger from './logger.js';

/**
 * Middleware to protect routes requiring authentication
 * Checks for a valid JWT token in the Authorization header
 */
export function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      logger.warn('Missing authorization header');
      return res.status(401).json({ error: 'Token ausente' });
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      logger.warn('Invalid authorization header format');
      return res.status(401).json({ error: 'Formato de token inválido' });
    }

    const token = parts[1];
    const decoded = verifyToken(token);

    if (!decoded) {
      logger.warn('Invalid or expired token');
      return res.status(401).json({ error: 'Token inválido ou expirado' });
    }

    // Attach user info to request
    req.user = decoded;
    next();
  } catch (error) {
    logger.error(`Auth middleware error: ${error.message}`);
    res.status(500).json({ error: 'Erro na autenticação' });
  }
}

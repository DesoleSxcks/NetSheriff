import express from 'express';
import prisma from '../lib/prisma.js';
import logger from '../lib/logger.js';
import { hashPassword, verifyPassword, generateToken } from '../lib/auth.js';
import { authMiddleware } from '../lib/authMiddleware.js';
import { asyncHandler } from '../lib/errorHandler.js';
import { validateBody } from '../lib/validation.js';

const router = express.Router();

const registerSchema = {
  email: { required: true, type: 'string', minLength: 3 },
  password: { required: true, type: 'string', minLength: 6 },
  name: { required: true, type: 'string', minLength: 2 },
};

const loginSchema = {
  email: { required: true, type: 'string', minLength: 3 },
  password: { required: true, type: 'string', minLength: 6 },
};

/**
 * Register a new user
 * POST /api/auth/register
 */
router.post('/register', validateBody(registerSchema), asyncHandler(async (req, res) => {
  const { email, password, name } = req.body;

  if (!email || !password || !name) {
    return res.status(400).json({ error: 'Email, senha e nome são obrigatórios' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'A senha deve ter pelo menos 6 caracteres' });
  }

  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    logger.warn(`Registration attempted with existing email: ${email}`);
    return res.status(409).json({ error: 'Este email já está registrado' });
  }

  const hashedPassword = await hashPassword(password);

  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      name,
    },
  });

  logger.info(`New user registered: ${email}`);

  const token = generateToken({ id: user.id, email: user.email, name: user.name });

  res.status(201).json({
    message: 'Usuário registrado com sucesso',
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
    },
  });
}));

/**
 * Login user
 * POST /api/auth/login
 */
router.post('/login', validateBody(loginSchema), asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email e senha são obrigatórios' });
  }

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    logger.warn(`Login attempted with non-existent email: ${email}`);
    return res.status(401).json({ error: 'Login ou senha errados' });
  }

  const isPasswordValid = await verifyPassword(password, user.password);

  if (!isPasswordValid) {
    logger.warn(`Failed login attempt for user: ${email}`);
    return res.status(401).json({ error: 'Login ou senha errados' });
  }

  logger.info(`User logged in: ${email}`);

  const token = generateToken({ id: user.id, email: user.email, name: user.name });

  res.json({
    message: 'Login realizado com sucesso',
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
    },
  });
}));

/**
 * Get current user info (protected route)
 * GET /api/auth/me
 */
router.get('/me', authMiddleware, asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    res.json(user);
}));

export default router;

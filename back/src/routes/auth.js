import express from 'express';
import prisma from '../lib/prisma.js';
import logger from '../lib/logger.js';
import { hashPassword, verifyPassword, generateToken } from '../lib/auth.js';
import { authMiddleware } from '../lib/authMiddleware.js';
import { asyncHandler, AppError } from '../lib/errorHandler.js';

const router = express.Router();

/**
 * Register a new user
 * POST /api/auth/register
 */
router.post('/register', asyncHandler(async (req, res) => {
  const { email, password, name } = req.body;

  // Validate input
  if (!email || !password || !name) {
    throw new AppError('Email, senha e nome são obrigatórios', 400);
  }

  if (password.length < 6) {
    throw new AppError('A senha deve ter pelo menos 6 caracteres', 400);
  }

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    logger.warn(`Registration attempted with existing email: ${email}`);
    throw new AppError('Este email já está registrado', 409);
  }

  // Hash password
  const hashedPassword = await hashPassword(password);

  // Create user
  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      name,
    },
  });

  logger.info(`New user registered: ${email}`);

  // Generate token
  const token = generateToken({ id: user.id, email: user.email });

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
router.post('/login', asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Validate input
  if (!email || !password) {
    throw new AppError('Email e senha são obrigatórios', 400);
  }

  // Find user
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    logger.warn(`Login attempted with non-existent email: ${email}`);
    throw new AppError('Email ou senha inválidos', 401);
  }

  // Verify password
  const isPasswordValid = await verifyPassword(password, user.password);

  if (!isPasswordValid) {
    logger.warn(`Failed login attempt for user: ${email}`);
    throw new AppError('Email ou senha inválidos', 401);
  }

  logger.info(`User logged in: ${email}`);

  // Generate token
  const token = generateToken({ id: user.id, email: user.email });

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
    throw new AppError('Usuário não encontrado', 404);
  }

  res.json(user);
}));

export default router;

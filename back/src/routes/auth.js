import express from 'express';
import prisma from '../lib/prisma.js';
import logger from '../lib/logger.js';
import { hashPassword, verifyPassword, generateToken } from '../lib/auth.js';
import { authMiddleware } from '../lib/authMiddleware.js';
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
router.post('/register', validateBody(registerSchema), async (req, res) => {
  try {
    const { email, password, name } = req.body;

    // Validate input
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, senha e nome são obrigatórios' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'A senha deve ter pelo menos 6 caracteres' });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      logger.warn(`Registration attempted with existing email: ${email}`);
      return res.status(409).json({ error: 'Este email já está registrado' });
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
  } catch (error) {
    logger.error(`Registration error: ${error.message}`);
    res.status(500).json({ error: 'Erro ao registrar usuário' });
  }
});

/**
 * Login user
 * POST /api/auth/login
 */
router.post('/login', validateBody(loginSchema), async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ error: 'Email e senha são obrigatórios' });
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      logger.warn(`Login attempted with non-existent email: ${email}`);
      return res.status(401).json({ error: 'Email ou senha inválidos' });
    }

    // Verify password
    const isPasswordValid = await verifyPassword(password, user.password);

    if (!isPasswordValid) {
      logger.warn(`Failed login attempt for user: ${email}`);
      return res.status(401).json({ error: 'Email ou senha inválidos' });
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
  } catch (error) {
    logger.error(`Login error: ${error.message}`);
    res.status(500).json({ error: 'Erro ao fazer login' });
  }
});

/**
 * Get current user info (protected route)
 * GET /api/auth/me
 */
router.get('/me', authMiddleware, async (req, res) => {
  try {
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
  } catch (error) {
    logger.error(`Get user info error: ${error.message}`);
    res.status(500).json({ error: 'Erro ao buscar informações do usuário' });
  }
});

export default router;

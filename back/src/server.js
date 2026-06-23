import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import logger from './lib/logger.js';
import { authMiddleware } from './lib/authMiddleware.js';
import { errorHandler, notFoundHandler } from './lib/errorHandler.js';

import authRouter from './routes/auth.js';
import rulesRouter from './routes/rules.js';
import alertsRouter from './routes/alerts.js';
import logsRouter from './routes/logs.js';
import trafficRouter from './routes/traffic.js';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// Simple request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.originalUrl}`);
  next();
});

// Health endpoint for basic monitoring
app.get('/health', (req, res) => {
  const health = {
    uptime: process.uptime(),
    timestamp: Date.now(),
    memoryUsage: process.memoryUsage()
  };
  res.json(health);
});

// Authentication routes (public)
app.use('/api/auth', authRouter);

// Protected routes
app.use('/api/rules', authMiddleware, rulesRouter);
app.use('/api/alerts', authMiddleware, alertsRouter);
app.use('/api/logs', authMiddleware, logsRouter);
app.use('/api/traffic', authMiddleware, trafficRouter);

// 404 handler deve vir antes do error handler
app.use(notFoundHandler);

// Middleware centralizado de tratamento de erros (DEVE SER POR ÚLTIMO)
app.use(errorHandler);

const port = Number(process.env.PORT ?? 3000);

app.listen(port, () => {
  logger.info(`Server is running on http://localhost:${port}`);
});
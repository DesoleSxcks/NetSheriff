import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import logger from './lib/logger.js';

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

app.use('/api/rules', rulesRouter);
app.use('/api/alerts', alertsRouter);
app.use('/api/logs', logsRouter);
app.use('/api/traffic', trafficRouter);

app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint não encontrado' });
});

const port = Number(process.env.PORT ?? 3000);

app.listen(port, () => {
  logger.info(`Server is running on http://localhost:${port}`);
});
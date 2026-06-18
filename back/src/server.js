import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import rulesRouter from './routes/rules.js';
import alertsRouter from './routes/alerts.js';
import logsRouter from './routes/logs.js';
import trafficRouter from './routes/traffic.js';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/rules', rulesRouter);
app.use('/api/alerts', alertsRouter);
app.use('/api/logs', logsRouter);
app.use('/api/traffic', trafficRouter);

app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint não encontrado' });
});

const port = Number(process.env.PORT ?? 3000);

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
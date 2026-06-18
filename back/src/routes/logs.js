import express from 'express';
import prisma from '../lib/prisma.js';

const router = express.Router();

router.get('/', async (req, res) => {
  const logs = await prisma.log.findMany();
  res.json(logs);
});

router.get('/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) return res.status(400).json({ error: 'ID inválido' });

  const log = await prisma.log.findUnique({ where: { id } });
  if (!log) return res.status(404).json({ error: 'Log não encontrado' });

  res.json(log);
});

router.post('/', async (req, res) => {
  const { timestamp, origin, type, severity, actionType } = req.body;

  const log = await prisma.log.create({
    data: { timestamp, origin, type, severity, actionType }
  });

  res.status(201).json(log);
});

router.delete('/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) return res.status(400).json({ error: 'ID inválido' });

  await prisma.log.delete({ where: { id } });
  res.status(204).end();
});

export default router;

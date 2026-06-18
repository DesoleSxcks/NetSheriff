import express from 'express';
import prisma from '../lib/prisma.js';

const router = express.Router();

router.get('/', async (req, res) => {
  const alerts = await prisma.alert.findMany();
  res.json(alerts);
});

router.get('/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) return res.status(400).json({ error: 'ID inválido' });

  const alert = await prisma.alert.findUnique({ where: { id } });
  if (!alert) return res.status(404).json({ error: 'Alerta não encontrado' });

  res.json(alert);
});

router.post('/', async (req, res) => {
  const { timestamp, type, description, severity, status } = req.body;

  const alert = await prisma.alert.create({
    data: { timestamp, type, description, severity, status }
  });

  res.status(201).json(alert);
});

router.put('/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) return res.status(400).json({ error: 'ID inválido' });

  const { timestamp, type, description, severity, status } = req.body;

  const alert = await prisma.alert.update({
    where: { id },
    data: { timestamp, type, description, severity, status }
  });

  res.json(alert);
});

router.patch('/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) return res.status(400).json({ error: 'ID inválido' });

  const alert = await prisma.alert.update({
    where: { id },
    data: req.body
  });

  res.json(alert);
});

router.delete('/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) return res.status(400).json({ error: 'ID inválido' });

  await prisma.alert.delete({ where: { id } });
  res.status(204).end();
});

export default router;

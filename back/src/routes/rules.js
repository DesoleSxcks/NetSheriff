import express from 'express';
import prisma from '../lib/prisma.js';

const router = express.Router();

router.get('/', async (req, res) => {
  const rules = await prisma.rule.findMany();
  res.json(rules);
});

router.get('/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) return res.status(400).json({ error: 'ID inválido' });

  const rule = await prisma.rule.findUnique({ where: { id } });
  if (!rule) return res.status(404).json({ error: 'Regra não encontrada' });

  res.json(rule);
});

router.post('/', async (req, res) => {
  const { name, condition, action, status } = req.body;

  const rule = await prisma.rule.create({
    data: { name, condition, action, status }
  });

  res.status(201).json(rule);
});

router.put('/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) return res.status(400).json({ error: 'ID inválido' });

  const { name, condition, action, status } = req.body;

  const rule = await prisma.rule.update({
    where: { id },
    data: { name, condition, action, status }
  });

  res.json(rule);
});

router.patch('/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) return res.status(400).json({ error: 'ID inválido' });

  const rule = await prisma.rule.update({
    where: { id },
    data: req.body
  });

  res.json(rule);
});

router.delete('/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) return res.status(400).json({ error: 'ID inválido' });

  await prisma.rule.delete({ where: { id } });
  res.status(204).end();
});

export default router;

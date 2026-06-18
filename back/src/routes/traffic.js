import express from 'express';
import prisma from '../lib/prisma.js';

const router = express.Router();

function formatTraffic(traffic) {
  return {
    id: traffic.id,
    labels: JSON.parse(traffic.labels),
    data: JSON.parse(traffic.data)
  };
}

router.get('/', async (req, res) => {
  const traffic = await prisma.traffic.findFirst();
  if (!traffic) {
    return res.json({ labels: [], data: [] });
  }
  res.json(formatTraffic(traffic));
});

router.put('/', async (req, res) => {
  const { labels, data } = req.body;
  if (!Array.isArray(labels) || !Array.isArray(data)) {
    return res.status(400).json({ error: 'Os campos labels e data devem ser arrays' });
  }

  const existing = await prisma.traffic.findFirst();
  if (existing) {
    const updated = await prisma.traffic.update({
      where: { id: existing.id },
      data: {
        labels: JSON.stringify(labels),
        data: JSON.stringify(data)
      }
    });
    return res.json(formatTraffic(updated));
  }

  const created = await prisma.traffic.create({
    data: {
      labels: JSON.stringify(labels),
      data: JSON.stringify(data)
    }
  });

  res.status(201).json(formatTraffic(created));
});

router.patch('/', async (req, res) => {
  const { labels, data } = req.body;
  if (labels === undefined && data === undefined) {
    return res.status(400).json({ error: 'É necessário informar labels ou data' });
  }

  const existing = await prisma.traffic.findFirst();
  const payload = {};
  if (labels !== undefined) payload.labels = JSON.stringify(labels);
  if (data !== undefined) payload.data = JSON.stringify(data);

  if (existing) {
    const updated = await prisma.traffic.update({
      where: { id: existing.id },
      data: payload
    });
    return res.json(formatTraffic(updated));
  }

  if (payload.labels === undefined || payload.data === undefined) {
    return res.status(400).json({ error: 'É necessário informar labels e data para criar o registro de tráfego' });
  }

  const created = await prisma.traffic.create({ data: payload });
  res.status(201).json(formatTraffic(created));
});

export default router;

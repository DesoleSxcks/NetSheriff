import express from 'express'
import prisma from '../lib/prisma.js'
import logger from '../lib/logger.js'
import { asyncHandler, AppError } from '../lib/errorHandler.js'

const router = express.Router()

function parseTraffic(traffic) {
  if (!traffic) {
    return {
      labels: [],
      data: []
    }
  }

  return {
    id: traffic.id,
    labels: JSON.parse(traffic.labels),
    data: JSON.parse(traffic.data)
  }
}

router.get('/', asyncHandler(async (req, res) => {
  const traffic = await prisma.traffic.findFirst({
    orderBy: { id: 'asc' }
  })

  res.json(parseTraffic(traffic))
}))

router.post('/', asyncHandler(async (req, res) => {
  const { labels, data } = req.body

  if (!labels || !data) {
    throw new AppError('Labels e data são obrigatórios', 400)
  }

  const traffic = await prisma.traffic.create({
    data: {
      labels: JSON.stringify(labels),
      data: JSON.stringify(data)
    }
  })

  res.status(201).json(parseTraffic(traffic))
}))

router.put('/:id', asyncHandler(async (req, res) => {
  const id = Number(req.params.id)
  const { labels, data } = req.body

  if (!labels || !data) {
    throw new AppError('Labels e data são obrigatórios', 400)
  }

  const traffic = await prisma.traffic.update({
    where: { id },
    data: {
      labels: JSON.stringify(labels),
      data: JSON.stringify(data)
    }
  })

  res.json(parseTraffic(traffic))
}))

router.delete('/:id', asyncHandler(async (req, res) => {
  const id = Number(req.params.id)

  await prisma.traffic.delete({
    where: { id }
  })

  res.status(204).send()
}))

export default router
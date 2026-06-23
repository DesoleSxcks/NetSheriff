import express from 'express'
import prisma from '../lib/prisma.js'
import logger from '../lib/logger.js'
import { asyncHandler, AppError } from '../lib/errorHandler.js'

const router = express.Router()

router.get('/', asyncHandler(async (req, res) => {
  const logs = await prisma.log.findMany({
    orderBy: { id: 'asc' }
  })

  res.json(logs)
}))

router.get('/:id', asyncHandler(async (req, res) => {
  const id = Number(req.params.id)

  const log = await prisma.log.findUnique({
    where: { id }
  })

  if (!log) {
    throw new AppError('Log não encontrado', 404)
  }

  res.json(log)
}))

router.post('/', asyncHandler(async (req, res) => {
  const { timestamp, origin, type, severity, actionType } = req.body

  if (!timestamp || !origin || !type || !severity) {
    throw new AppError('Campo obrigatório faltando', 400)
  }

  const log = await prisma.log.create({
    data: {
      timestamp,
      origin,
      type,
      severity,
      actionType
    }
  })

  res.status(201).json(log)
}))

router.put('/:id', asyncHandler(async (req, res) => {
  const id = Number(req.params.id)
  const { timestamp, origin, type, severity, actionType } = req.body

  const log = await prisma.log.update({
    where: { id },
    data: {
      timestamp,
      origin,
      type,
      severity,
      actionType
    }
  })

  res.json(log)
}))

router.delete('/:id', asyncHandler(async (req, res) => {
  const id = Number(req.params.id)

  await prisma.log.delete({
    where: { id }
  })

  res.status(204).send()
}))

export default router
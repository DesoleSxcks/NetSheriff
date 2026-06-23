import express from 'express'
import prisma from '../lib/prisma.js'
import logger from '../lib/logger.js'
import { asyncHandler, AppError } from '../lib/errorHandler.js'

const router = express.Router()

router.get('/', asyncHandler(async (req, res) => {
  const alerts = await prisma.alert.findMany({
    orderBy: { id: 'asc' }
  })

  res.json(alerts)
}))

router.get('/:id', asyncHandler(async (req, res) => {
  const id = Number(req.params.id)

  const alert = await prisma.alert.findUnique({
    where: { id }
  })

  if (!alert) {
    throw new AppError('Alerta não encontrado', 404)
  }

  res.json(alert)
}))

router.post('/', asyncHandler(async (req, res) => {
  const { timestamp, type, description, severity, status } = req.body

  if (!timestamp || !type || !description || !severity) {
    throw new AppError('Campo obrigatório faltando', 400)
  }

  const alert = await prisma.alert.create({
    data: {
      timestamp,
      type,
      description,
      severity,
      status
    }
  })

  res.status(201).json(alert)
}))

router.put('/:id', asyncHandler(async (req, res) => {
  const id = Number(req.params.id)
  const { timestamp, type, description, severity, status } = req.body

  const alert = await prisma.alert.update({
    where: { id },
    data: {
      timestamp,
      type,
      description,
      severity,
      status
    }
  })

  res.json(alert)
}))

router.delete('/:id', asyncHandler(async (req, res) => {
  const id = Number(req.params.id)

  await prisma.alert.delete({
    where: { id }
  })

  res.status(204).send()
}))

export default router
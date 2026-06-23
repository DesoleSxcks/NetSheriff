import express from 'express'
import prisma from '../lib/prisma.js'
import logger from '../lib/logger.js'
import { asyncHandler, AppError } from '../lib/errorHandler.js'

const router = express.Router()

router.get('/', asyncHandler(async (req, res) => {
  const rules = await prisma.rule.findMany({
    orderBy: { id: 'asc' }
  })

  res.json(rules)
}))

router.get('/:id', asyncHandler(async (req, res) => {
  const id = Number(req.params.id)

  const rule = await prisma.rule.findUnique({
    where: { id }
  })

  if (!rule) {
    throw new AppError('Regra não encontrada', 404)
  }

  res.json(rule)
}))

router.post('/', asyncHandler(async (req, res) => {
  const { name, condition, action, status } = req.body

  if (!name || !condition || !action) {
    throw new AppError('Nome, condição e ação são obrigatórios', 400)
  }

  const rule = await prisma.rule.create({
    data: {
      name,
      condition,
      action,
      status
    }
  })

  res.status(201).json(rule)
}))

router.put('/:id', asyncHandler(async (req, res) => {
  const id = Number(req.params.id)
  const { name, condition, action, status } = req.body

  const rule = await prisma.rule.update({
    where: { id },
    data: {
      name,
      condition,
      action,
      status
    }
  })

  res.json(rule)
}))

router.delete('/:id', asyncHandler(async (req, res) => {
  const id = Number(req.params.id)

  await prisma.rule.delete({
    where: { id }
  })

  res.status(204).send()
}))

export default router
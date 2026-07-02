import express from 'express'
import prisma from '../lib/prisma.js'
import { asyncHandler } from '../lib/errorHandler.js'
import { validateBody, validateParams, validatePartialBody } from '../lib/validation.js'

const router = express.Router()

const ruleIdSchema = {
  id: { required: true, type: 'integer', min: 1 }
}

const ruleSchema = {
  name: { required: true, type: 'string', minLength: 2 },
  condition: { required: true, type: 'string', minLength: 2 },
  action: { required: true, type: 'string', minLength: 2 },
  status: { required: true, type: 'string', minLength: 2 }
}

router.get('/', asyncHandler(async (req, res) => {
  const rules = await prisma.rule.findMany({
    orderBy: { id: 'asc' }
  })

  res.json(rules)
}))

router.get('/:id', validateParams(ruleIdSchema), asyncHandler(async (req, res) => {
  const id = Number(req.params.id)

  const rule = await prisma.rule.findUnique({
    where: { id }
  })

  if (!rule) {
    return res.status(404).json({ error: 'Regra não encontrada' })
  }

  res.json(rule)
}))

router.post('/', validateBody(ruleSchema), asyncHandler(async (req, res) => {
  const { name, condition, action, status } = req.body

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

router.put('/:id', validateParams(ruleIdSchema), validateBody(ruleSchema), asyncHandler(async (req, res) => {
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

router.patch('/:id', validateParams(ruleIdSchema), validatePartialBody(ruleSchema), asyncHandler(async (req, res) => {
  const id = Number(req.params.id)
  const updates = req.body

  if (!updates || Object.keys(updates).length === 0) {
    return res.status(400).json({ error: 'Nenhum campo enviado para atualização' })
  }

  const rule = await prisma.rule.update({
    where: { id },
    data: updates
  })

  res.json(rule)
}))

router.delete('/:id', validateParams(ruleIdSchema), asyncHandler(async (req, res) => {
  const id = Number(req.params.id)

  await prisma.rule.delete({
    where: { id }
  })

  res.status(204).send()
}))

export default router
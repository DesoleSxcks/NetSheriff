import express from 'express'
import prisma from '../lib/prisma.js'
import { validateBody, validateParams } from '../lib/validation.js'

const router = express.Router()

const logIdSchema = {
  id: { required: true, type: 'integer', min: 1 }
}

const logSchema = {
  timestamp: { required: true, type: 'string', minLength: 2 },
  origin: { required: true, type: 'string', minLength: 2 },
  type: { required: true, type: 'string', minLength: 2 },
  severity: { required: true, type: 'string', minLength: 2 },
  actionType: { required: true, type: 'string', minLength: 2 }
}

router.get('/', async (req, res) => {
  try {
    const logs = await prisma.log.findMany({
      orderBy: { id: 'asc' }
    })

    res.json(logs)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Erro ao buscar logs' })
  }
})

router.get('/:id', validateParams(logIdSchema), async (req, res) => {
  try {
    const id = Number(req.params.id)

    const log = await prisma.log.findUnique({
      where: { id }
    })

    if (!log) {
      return res.status(404).json({ error: 'Log não encontrado' })
    }

    res.json(log)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Erro ao buscar log' })
  }
})

router.post('/', validateBody(logSchema), async (req, res) => {
  try {
    const { timestamp, origin, type, severity, actionType } = req.body

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
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Erro ao criar log' })
  }
})

router.put('/:id', validateParams(logIdSchema), validateBody(logSchema), async (req, res) => {
  try {
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
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Erro ao atualizar log' })
  }
})

router.delete('/:id', validateParams(logIdSchema), async (req, res) => {
  try {
    const id = Number(req.params.id)

    await prisma.log.delete({
      where: { id }
    })

    res.status(204).send()
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Erro ao remover log' })
  }
})

export default router
import express from 'express'
import prisma from '../lib/prisma.js'
import { validateBody, validateParams } from '../lib/validation.js'

const router = express.Router()

const alertIdSchema = {
  id: { required: true, type: 'integer', min: 1 }
}

const alertSchema = {
  timestamp: { required: true, type: 'string', minLength: 2 },
  type: { required: true, type: 'string', minLength: 2 },
  description: { required: true, type: 'string', minLength: 2 },
  severity: { required: true, type: 'string', minLength: 2 },
  status: { required: true, type: 'string', minLength: 2 }
}

router.get('/', async (req, res) => {
  try {
    const alerts = await prisma.alert.findMany({
      orderBy: { id: 'asc' }
    })

    res.json(alerts)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Erro ao buscar alertas' })
  }
})

router.get('/:id', validateParams(alertIdSchema), async (req, res) => {
  try {
    const id = Number(req.params.id)

    const alert = await prisma.alert.findUnique({
      where: { id }
    })

    if (!alert) {
      return res.status(404).json({ error: 'Alerta não encontrado' })
    }

    res.json(alert)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Erro ao buscar alerta' })
  }
})

router.post('/', validateBody(alertSchema), async (req, res) => {
  try {
    const { timestamp, type, description, severity, status } = req.body

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
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Erro ao criar alerta' })
  }
})

router.put('/:id', validateParams(alertIdSchema), validateBody(alertSchema), async (req, res) => {
  try {
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
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Erro ao atualizar alerta' })
  }
})

router.delete('/:id', validateParams(alertIdSchema), async (req, res) => {
  try {
    const id = Number(req.params.id)

    await prisma.alert.delete({
      where: { id }
    })

    res.status(204).send()
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Erro ao remover alerta' })
  }
})

export default router
import express from 'express'
import prisma from '../lib/prisma.js'

const router = express.Router()

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

router.get('/:id', async (req, res) => {
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

router.post('/', async (req, res) => {
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

router.put('/:id', async (req, res) => {
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

router.delete('/:id', async (req, res) => {
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
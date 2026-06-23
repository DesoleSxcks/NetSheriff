import express from 'express'
import prisma from '../lib/prisma.js'

const router = express.Router()

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

router.get('/:id', async (req, res) => {
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

router.post('/', async (req, res) => {
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

router.put('/:id', async (req, res) => {
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

router.delete('/:id', async (req, res) => {
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
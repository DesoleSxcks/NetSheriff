import express from 'express'
import prisma from '../lib/prisma.js'
import { validateBody, validateParams } from '../lib/validation.js'

const router = express.Router()

const trafficIdSchema = {
  id: { required: true, type: 'integer', min: 1 }
}

const trafficSchema = {
  labels: { required: true, type: 'array' },
  data: { required: true, type: 'array' }
}

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

router.get('/', async (req, res) => {
  try {
    const traffic = await prisma.traffic.findFirst({
      orderBy: { id: 'asc' }
    })

    res.json(parseTraffic(traffic))
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Erro ao buscar tráfego' })
  }
})

router.post('/', validateBody(trafficSchema), async (req, res) => {
  try {
    const { labels, data } = req.body

    const traffic = await prisma.traffic.create({
      data: {
        labels: JSON.stringify(labels),
        data: JSON.stringify(data)
      }
    })

    res.status(201).json(parseTraffic(traffic))
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Erro ao criar tráfego' })
  }
})

router.put('/:id', validateParams(trafficIdSchema), validateBody(trafficSchema), async (req, res) => {
  try {
    const id = Number(req.params.id)
    const { labels, data } = req.body

    const traffic = await prisma.traffic.update({
      where: { id },
      data: {
        labels: JSON.stringify(labels),
        data: JSON.stringify(data)
      }
    })

    res.json(parseTraffic(traffic))
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Erro ao atualizar tráfego' })
  }
})

router.delete('/:id', validateParams(trafficIdSchema), async (req, res) => {
  try {
    const id = Number(req.params.id)

    await prisma.traffic.delete({
      where: { id }
    })

    res.status(204).send()
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Erro ao remover tráfego' })
  }
})

export default router
import express from 'express'
import prisma from '../lib/prisma.js'
import { validateBody, validateParams } from '../lib/validation.js'

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

router.get('/', async (req, res) => {
  try {
    const rules = await prisma.rule.findMany({
      orderBy: { id: 'asc' }
    })

    res.json(rules)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Erro ao buscar regras' })
  }
})

router.get('/:id', validateParams(ruleIdSchema), async (req, res) => {
  try {
    const id = Number(req.params.id)

    const rule = await prisma.rule.findUnique({
      where: { id }
    })

    if (!rule) {
      return res.status(404).json({ error: 'Regra não encontrada' })
    }

    res.json(rule)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Erro ao buscar regra' })
  }
})

router.post('/', validateBody(ruleSchema), async (req, res) => {
  try {
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
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Erro ao criar regra' })
  }
})

router.put('/:id', validateParams(ruleIdSchema), validateBody(ruleSchema), async (req, res) => {
  try {
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
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Erro ao atualizar regra' })
  }
})

router.delete('/:id', validateParams(ruleIdSchema), async (req, res) => {
  try {
    const id = Number(req.params.id)

    await prisma.rule.delete({
      where: { id }
    })

    res.status(204).send()
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Erro ao remover regra' })
  }
})

export default router
import { Router } from 'express'
import { userRepo } from '../repositories/userRepo.js'
import { eventRepo } from '../repositories/eventRepo.js'
import { photoRepo } from '../repositories/photoRepo.js'
import { orderRepo } from '../repositories/orderRepo.js'
import { frameRepo } from '../repositories/frameRepo.js'
import { requireAuth, requireAdmin } from '../middleware/auth.js'
import { validateBody } from '../middleware/validate.js'
import { notFound } from '../lib/errors.js'

const router = Router()
router.use(requireAuth, requireAdmin)

router.get('/users', async (_req, res, next) => {
  try {
    res.json({ students: await userRepo.listStudents() })
  } catch (err) {
    next(err)
  }
})

router.patch('/users/:id', async (req, res, next) => {
  try {
    const student = await userRepo.update(req.params.id, { status: req.body.status, identifier: req.body.identifier })
    if (!student) throw notFound('Student not found', 'student_not_found')
    res.json({ student })
  } catch (err) {
    next(err)
  }
})

router.get('/events', async (_req, res, next) => {
  try {
    res.json({ events: await eventRepo.list() })
  } catch (err) {
    next(err)
  }
})

router.post('/events', validateBody({ name: { type: 'string', required: true, max: 160 } }), async (req, res, next) => {
  try {
    res.status(201).json({ event: await eventRepo.create(req.body) })
  } catch (err) {
    next(err)
  }
})

router.patch('/events/:id', async (req, res, next) => {
  try {
    const event = await eventRepo.update(req.params.id, req.body)
    if (!event) throw notFound('Event not found', 'event_not_found')
    res.json({ event })
  } catch (err) {
    next(err)
  }
})

router.get('/moderation', async (_req, res, next) => {
  try {
    res.json({ photos: await photoRepo.listUnmoderated() })
  } catch (err) {
    next(err)
  }
})

router.get('/reports', async (_req, res, next) => {
  try {
    const [reports, recentOrders, events] = await Promise.all([
      orderRepo.reports(),
      orderRepo.list({ role: 'admin' }),
      eventRepo.list()
    ])
    res.json({ reports, recentOrders: recentOrders.slice(0, 8), events })
  } catch (err) {
    next(err)
  }
})

router.get('/ams', async (_req, res, next) => {
  try {
    res.json(await frameRepo.catalog())
  } catch (err) {
    next(err)
  }
})

export default router

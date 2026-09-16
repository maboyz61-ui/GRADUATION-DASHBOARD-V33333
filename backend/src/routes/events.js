import { Router } from 'express'
import { eventRepo } from '../repositories/eventRepo.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

router.get('/', requireAuth, async (req, res, next) => {
  try {
    const events = req.user.role === 'admin' ? await eventRepo.list() : await eventRepo.listPublished()
    res.json({ events })
  } catch (err) {
    next(err)
  }
})

export default router

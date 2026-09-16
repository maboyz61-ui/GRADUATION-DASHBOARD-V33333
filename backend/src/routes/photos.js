import { Router } from 'express'
import { photoRepo } from '../repositories/photoRepo.js'
import { requireAuth } from '../middleware/auth.js'
import { forbidden, notFound } from '../lib/errors.js'

const router = Router()

router.get('/', requireAuth, async (req, res, next) => {
  try {
    const photos = await photoRepo.list({
      userId: req.user.id,
      role: req.user.role,
      identifier: req.query.identifier,
      eventId: req.query.eventId,
      type: req.query.type,
      location: req.query.location,
      q: req.query.q
    })
    res.json({ photos })
  } catch (err) {
    next(err)
  }
})

router.get('/:id', requireAuth, async (req, res, next) => {
  try {
    const photo = await photoRepo.findById(req.params.id)
    if (!photo) throw notFound('Photo not found', 'photo_not_found')
    if (req.user.role !== 'admin' && photo.studentId !== req.user.id) throw forbidden()
    res.json({ photo })
  } catch (err) {
    next(err)
  }
})

router.patch('/:id', requireAuth, async (req, res, next) => {
  try {
    const existing = await photoRepo.findById(req.params.id)
    if (!existing) throw notFound('Photo not found', 'photo_not_found')
    if (req.user.role !== 'admin' && existing.studentId !== req.user.id) throw forbidden()
    const photo = await photoRepo.updateFlags(req.params.id, {
      favourite: typeof req.body.favourite === 'boolean' ? req.body.favourite : undefined,
      moderated: req.user.role === 'admin' && typeof req.body.moderated === 'boolean' ? req.body.moderated : undefined
    })
    res.json({ photo })
  } catch (err) {
    next(err)
  }
})

export default router

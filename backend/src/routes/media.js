import { Router } from 'express'
import { photoRepo } from '../repositories/photoRepo.js'
import { storage, buildObjectKey } from '../services/storage.js'
import { requireAuth } from '../middleware/auth.js'
import { badRequest, forbidden, notFound } from '../lib/errors.js'

const router = Router()

router.get('/:photoId/url', requireAuth, async (req, res, next) => {
  try {
    const photo = await photoRepo.findById(req.params.photoId)
    if (!photo) throw notFound('Photo not found', 'photo_not_found')
    if (req.user.role !== 'admin' && photo.studentId !== req.user.id) throw forbidden()
    const key = photo.storageKey || photo.s3Key
    if (!key) throw notFound('No stored object for photo', 'media_not_found')
    const ttl = Number(req.query.ttl) || undefined
    res.json({ photoId: photo.id, driver: await storage.driver(), ...(await storage.signedUrl(key, ttl)) })
  } catch (err) {
    next(err)
  }
})

// JSON base64 upload keeps the API dependency-free. Swap for multer/S3 pre-signed
// POST when large files move to direct-to-bucket uploads.
router.post('/', requireAuth, async (req, res, next) => {
  try {
    const { photoId, contentType, dataBase64 } = req.body || {}
    if (!dataBase64) throw badRequest('dataBase64 is required', 'missing_payload')
    const photo = photoId ? await photoRepo.findById(photoId) : null
    if (photo && req.user.role !== 'admin' && photo.studentId !== req.user.id) throw forbidden()
    const buffer = Buffer.from(String(dataBase64), 'base64')
    if (buffer.length > 8 * 1024 * 1024) throw badRequest('Upload exceeds 8MB', 'payload_too_large')
    const key = buildObjectKey({
      eventId: photo?.eventId,
      identifier: photo?.identifier || req.user.identifier,
      photoId: photo?.id
    })
    const stored = await storage.put({ key, buffer, contentType: contentType || 'image/jpeg' })
    res.status(201).json({ stored })
  } catch (err) {
    next(err)
  }
})

export default router

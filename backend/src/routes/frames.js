import { Router } from 'express'
import { frameRepo } from '../repositories/frameRepo.js'

const router = Router()

router.get('/', async (_req, res, next) => {
  try {
    res.json(await frameRepo.catalog())
  } catch (err) {
    next(err)
  }
})

export default router

import { Router } from 'express'
import { authService } from '../services/authService.js'
import { requireAuth } from '../middleware/auth.js'
import { validateBody } from '../middleware/validate.js'

const router = Router()

router.post('/login', validateBody({
  email: { type: 'string', max: 160 },
  role: { type: 'string', enum: ['student', 'admin'] },
  code: { type: 'string', pattern: /^\d{6}$/ }
}), async (req, res, next) => {
  try {
    const { email, role, code } = req.body || {}
    const result = code
      ? await authService.loginWithCode({ code })
      : await authService.loginWithEmail({ email, role })
    res.json(result)
  } catch (err) {
    next(err)
  }
})

router.post('/request-code', validateBody({
  email: { type: 'string', required: true, max: 160 }
}), async (req, res, next) => {
  try {
    res.json(await authService.requestCode({ email: req.body.email }))
  } catch (err) {
    next(err)
  }
})

router.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user })
})

export default router

import config from '../config.js'
import { verifyToken } from '../lib/jwt.js'
import { userRepo } from '../repositories/userRepo.js'
import { unauthorized, forbidden } from '../lib/errors.js'

export async function requireAuth(req, _res, next) {
  try {
    const header = req.headers.authorization || ''
    const token = header.startsWith('Bearer ') ? header.slice(7) : null
    if (!token) throw unauthorized('Missing bearer token', 'missing_token')
    let payload
    try {
      payload = verifyToken(token, { secret: config.auth.jwtSecret })
    } catch (err) {
      throw unauthorized(err.message === 'token expired' ? 'Token expired' : 'Invalid token', 'invalid_token')
    }
    const user = await userRepo.findById(payload.sub)
    if (!user) throw unauthorized('Account no longer exists', 'unknown_account')
    if (user.status === 'pending') throw forbidden('Account pending approval', 'account_pending')
    req.user = user
    next()
  } catch (err) {
    next(err)
  }
}

export function requireAdmin(req, _res, next) {
  if (req.user?.role !== 'admin') return next(forbidden('Admin only', 'admin_only'))
  next()
}

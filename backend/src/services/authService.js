import config from '../config.js'
import { userRepo } from '../repositories/userRepo.js'
import { signToken } from '../lib/jwt.js'
import { hashSecret, verifySecret, generateAccessCode } from '../lib/crypto.js'
import { unauthorized, badRequest, notFound } from '../lib/errors.js'

function issue(user) {
  const token = signToken(
    { sub: user.id, role: user.role, identifier: user.identifier || null },
    { secret: config.auth.jwtSecret, expiresInSeconds: config.auth.jwtExpiresIn }
  )
  return {
    token,
    user,
    issuer: config.auth.oidc.issuer,
    protocol: 'OIDC'
  }
}

export const authService = {
  async loginWithEmail({ email, role }) {
    if (!email) throw badRequest('Email is required', 'email_required')
    const user = await userRepo.findByEmail(email)
    if (!user) throw unauthorized('Unknown account', 'unknown_account')
    if (role && user.role !== role) throw unauthorized('Role mismatch', 'role_mismatch')
    return issue(user)
  },

  async loginWithCode({ code }) {
    if (!code || !/^\d{6}$/.test(String(code))) throw badRequest('A 6-digit code is required', 'invalid_code_format')
    const user = await userRepo.findByPin(String(code))
    if (!user) throw unauthorized('Invalid access code', 'invalid_code')
    await userRepo.consumeAccessCode(user.id)
    return issue(user)
  },

  async requestCode({ email }) {
    const user = await userRepo.findByEmail(email)
    if (!user) throw notFound('No account for that email', 'unknown_account')
    const code = generateAccessCode(6)
    await userRepo.createAccessCode(user.id, hashSecret(code), { ttlSeconds: config.auth.codeTtlSeconds })
    // In production this is delivered by SMS/email. In dev it is returned for the UI.
    const devCode = config.isProduction ? undefined : code
    return { sent: true, expiresInSeconds: config.auth.codeTtlSeconds, devCode }
  },

  verifyPin(pin, stored) {
    return verifySecret(pin, stored)
  }
}

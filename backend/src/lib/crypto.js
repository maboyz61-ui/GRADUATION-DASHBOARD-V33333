import { randomBytes, scryptSync, timingSafeEqual, randomInt } from 'crypto'

export function hashSecret(secret, saltBytes = 16) {
  const salt = randomBytes(saltBytes).toString('hex')
  const hash = scryptSync(String(secret), salt, 32).toString('hex')
  return `scrypt$${salt}$${hash}`
}

export function verifySecret(secret, stored) {
  if (typeof stored !== 'string') return false
  const [scheme, salt, hash] = stored.split('$')
  if (scheme !== 'scrypt' || !salt || !hash) return false
  const candidate = scryptSync(String(secret), salt, 32)
  const expected = Buffer.from(hash, 'hex')
  if (candidate.length !== expected.length) return false
  return timingSafeEqual(candidate, expected)
}

export function generateAccessCode(digits = 6) {
  let out = ''
  for (let i = 0; i < digits; i += 1) out += randomInt(0, 10)
  return out
}

export function randomId(prefix = 'id') {
  return `${prefix}-${randomBytes(8).toString('hex')}`
}

export function newIdentifier(year = new Date().getFullYear()) {
  const n = 100 + randomInt(0, 900)
  const letter = String.fromCharCode(65 + randomInt(0, 26))
  return `UKZN-${year}-${letter}${n}`
}

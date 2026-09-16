import { createHmac, timingSafeEqual } from 'crypto'

function b64url(input) {
  return Buffer.from(input).toString('base64url')
}

function b64urlJson(obj) {
  return b64url(JSON.stringify(obj))
}

function sign(data, secret) {
  return createHmac('sha256', secret).update(data).digest('base64url')
}

export function signToken(payload, { secret, expiresInSeconds, issuedAt = Math.floor(Date.now() / 1000) } = {}) {
  const header = { alg: 'HS256', typ: 'JWT' }
  const body = { ...payload, iat: issuedAt, exp: issuedAt + expiresInSeconds }
  const data = `${b64urlJson(header)}.${b64urlJson(body)}`
  return `${data}.${sign(data, secret)}`
}

export function verifyToken(token, { secret, now = Math.floor(Date.now() / 1000) } = {}) {
  if (typeof token !== 'string') throw new Error('invalid token')
  const parts = token.split('.')
  if (parts.length !== 3) throw new Error('malformed token')
  const [header, body, signature] = parts
  const expected = sign(`${header}.${body}`, secret)
  const a = Buffer.from(signature)
  const b = Buffer.from(expected)
  if (a.length !== b.length || !timingSafeEqual(a, b)) throw new Error('bad signature')
  const parsedHeader = JSON.parse(Buffer.from(header, 'base64url').toString('utf8'))
  if (parsedHeader.alg !== 'HS256') throw new Error('unsupported algorithm')
  const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'))
  if (typeof payload.exp === 'number' && payload.exp <= now) throw new Error('token expired')
  return payload
}

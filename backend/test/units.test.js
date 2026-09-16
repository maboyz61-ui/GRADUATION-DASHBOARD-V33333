import test from 'node:test'
import assert from 'node:assert/strict'
import { signToken, verifyToken } from '../src/lib/jwt.js'
import { hashSecret, verifySecret, generateAccessCode, newIdentifier } from '../src/lib/crypto.js'
import { buildSignature } from '../src/services/payfast.js'

test('JWT round-trips and rejects expiry / tampering', () => {
  const secret = 'unit-test-secret'
  const token = signToken({ sub: 'u1', role: 'student' }, { secret, expiresInSeconds: 60 })
  const decoded = verifyToken(token, { secret })
  assert.equal(decoded.sub, 'u1')
  assert.equal(decoded.role, 'student')

  assert.throws(() => verifyToken(token, { secret: 'wrong' }))
  assert.throws(() => verifyToken(token, { secret, now: Math.floor(Date.now() / 1000) + 120 }))
})

test('scrypt hashing verifies only the correct secret', () => {
  const stored = hashSecret('123456')
  assert.equal(verifySecret('123456', stored), true)
  assert.equal(verifySecret('654321', stored), false)
  assert.equal(verifySecret('123456', 'garbage'), false)
})

test('access codes and identifiers have the expected shape', () => {
  assert.match(generateAccessCode(), /^\d{6}$/)
  assert.match(newIdentifier(2026), /^UKZN-2026-[A-Z]\d{3}$/)
})

test('payfast signature is deterministic and order-sensitive', () => {
  const fields = { merchant_id: '10000100', amount: '1499.00', item_name: 'UKZN order' }
  const a = buildSignature(fields, 'pass')
  const b = buildSignature(fields, 'pass')
  const c = buildSignature(fields, 'other-pass')
  assert.equal(a, b)
  assert.notEqual(a, c)
  assert.match(a, /^[0-9a-f]{32}$/)
})

test('payfast signature carries the passphrase into the digest', () => {
  const fields = { merchant_id: '1', amount: '10.00' }
  assert.notEqual(buildSignature(fields, ''), buildSignature(fields, 'secret'))
})

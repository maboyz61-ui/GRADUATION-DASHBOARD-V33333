import test from 'node:test'
import assert from 'node:assert/strict'
import { bootstrapTestApp, teardownTestApp, request } from '../src/test-helpers.js'

let app

test.before(async () => {
  app = await bootstrapTestApp()
})

test.after(async () => {
  await teardownTestApp()
})

test('PIN login issues a token and user', async () => {
  const res = await request(app, 'POST', '/api/v1/auth/login', { body: { code: '123456' } })
  assert.equal(res.status, 200)
  assert.ok(res.body.token)
  assert.equal(res.body.user.role, 'student')
  assert.equal(res.body.user.identifier, 'UKZN-2026-X898')
})

test('admin PIN resolves to the admin account', async () => {
  const res = await request(app, 'POST', '/api/v1/auth/login', { body: { code: '999999' } })
  assert.equal(res.status, 200)
  assert.equal(res.body.user.role, 'admin')
})

test('invalid PIN is rejected with 401', async () => {
  const res = await request(app, 'POST', '/api/v1/auth/login', { body: { code: '000000' } })
  assert.equal(res.status, 401)
  assert.equal(res.body.code, 'invalid_code')
})

test('malformed code fails validation', async () => {
  const res = await request(app, 'POST', '/api/v1/auth/login', { body: { code: 'abc' } })
  assert.equal(res.status, 400)
  assert.equal(res.body.code, 'validation_failed')
})

test('email login works and rejects unknown accounts', async () => {
  const ok = await request(app, 'POST', '/api/v1/auth/login', { body: { email: 'thandiwe.nkosi@stu.ukzn.ac.za' } })
  assert.equal(ok.status, 200)
  const bad = await request(app, 'POST', '/api/v1/auth/login', { body: { email: 'nobody@example.com' } })
  assert.equal(bad.status, 401)
})

test('protected route requires a valid token', async () => {
  const missing = await request(app, 'GET', '/api/v1/photos')
  assert.equal(missing.status, 401)

  const login = await request(app, 'POST', '/api/v1/auth/login', { body: { code: '123456' } })
  const ok = await request(app, 'GET', '/api/v1/photos', { token: login.body.token })
  assert.equal(ok.status, 200)
  assert.ok(Array.isArray(ok.body.photos))
  assert.ok(ok.body.photos.length >= 6)
})

test('tampered token is rejected', async () => {
  const login = await request(app, 'POST', '/api/v1/auth/login', { body: { code: '123456' } })
  const tampered = `${login.body.token.slice(0, -2)}xx`
  const res = await request(app, 'GET', '/api/v1/auth/me', { token: tampered })
  assert.equal(res.status, 401)
})

test('students cannot reach admin routes', async () => {
  const login = await request(app, 'POST', '/api/v1/auth/login', { body: { code: '123456' } })
  const res = await request(app, 'GET', '/api/v1/admin/users', { token: login.body.token })
  assert.equal(res.status, 403)
})

test('admins can list users and reassign identifiers', async () => {
  const login = await request(app, 'POST', '/api/v1/auth/login', { body: { code: '999999' } })
  const users = await request(app, 'GET', '/api/v1/admin/users', { token: login.body.token })
  assert.equal(users.status, 200)
  assert.ok(users.body.students.length >= 4)

  const target = users.body.students[0]
  const reassigned = await request(app, 'POST', '/api/v1/identifier', {
    token: login.body.token,
    body: { studentId: target.id }
  })
  assert.equal(reassigned.status, 200)
  assert.match(reassigned.body.student.identifier, /^UKZN-\d{4}-[A-Z]\d+$/)
})

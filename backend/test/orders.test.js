import test from 'node:test'
import assert from 'node:assert/strict'
import { bootstrapTestApp, teardownTestApp, request, requestForm } from '../src/test-helpers.js'
import { buildSignature } from '../src/services/payfast.js'

let app
let token

test.before(async () => {
  app = await bootstrapTestApp()
  const login = await request(app, 'POST', '/api/v1/auth/login', { body: { code: '123456' } })
  token = login.body.token
})

test.after(async () => {
  await teardownTestApp()
})

test('frame catalog exposes textures, mats, overlays and sizes', async () => {
  const res = await request(app, 'GET', '/api/v1/frames')
  assert.equal(res.status, 200)
  assert.ok(res.body.textures.length > 0)
  assert.ok(res.body.sizes.some((s) => s.id === '8x10'))
})

test('order total is recomputed server-side, ignoring client price', async () => {
  const res = await request(app, 'POST', '/api/v1/user/orders', {
    token,
    body: {
      total: 1,
      items: [{ photoId: 'pho-101', texture: 'oak', mat: 'ivory', size: '8x10', qty: 1, price: 1 }]
    }
  })
  assert.equal(res.status, 201)
  const photo = 189
  const print = 299
  const size = 1499
  assert.equal(res.body.order.total, photo + print + size)
  assert.equal(res.body.payment.status, 'pending')
  assert.ok(res.body.payment.redirect.action.includes('payfast'))
  assert.ok(res.body.payment.redirect.fields.signature)
})

test('quantity multiplies the unit price', async () => {
  const res = await request(app, 'POST', '/api/v1/user/orders', {
    token,
    body: { items: [{ photoId: 'pho-102', qty: 2 }] }
  })
  assert.equal(res.status, 201)
  assert.equal(res.body.order.total, (149 + 299) * 2)
})

test('unknown photo or option is rejected', async () => {
  const unknownPhoto = await request(app, 'POST', '/api/v1/user/orders', {
    token,
    body: { items: [{ photoId: 'pho-999' }] }
  })
  assert.equal(unknownPhoto.status, 400)
  assert.equal(unknownPhoto.body.code, 'unknown_photo')

  const unknownSize = await request(app, 'POST', '/api/v1/user/orders', {
    token,
    body: { items: [{ photoId: 'pho-101', size: 'huge' }] }
  })
  assert.equal(unknownSize.status, 400)
  assert.equal(unknownSize.body.code, 'unknown_size')
})

test('empty order payload fails validation', async () => {
  const res = await request(app, 'POST', '/api/v1/user/orders', { token, body: { items: [] } })
  assert.equal(res.status, 400)
})

test('valid ITN marks the order paid and is idempotent', async () => {
  const created = await request(app, 'POST', '/api/v1/user/orders', {
    token,
    body: { items: [{ photoId: 'pho-103', texture: 'oak', size: 'a4', qty: 1 }] }
  })
  const order = created.body.order

  const fields = {
    merchant_id: '10000100',
    m_payment_id: order.id,
    pf_payment_id: 'PF-12345',
    payment_status: 'COMPLETE',
    amount_gross: Number(order.total).toFixed(2)
  }
  fields.signature = buildSignature(fields)

  const res = await requestForm(app, '/api/v1/payments/payfast/itn', fields)
  assert.equal(res.status, 200)
  assert.equal(res.body.status, 'paid')

  const repeated = await requestForm(app, '/api/v1/payments/payfast/itn', fields)
  assert.equal(repeated.status, 200)
  assert.equal(repeated.body.idempotent, true)
})

test('tampered ITN signature is rejected', async () => {
  const created = await request(app, 'POST', '/api/v1/user/orders', {
    token,
    body: { items: [{ photoId: 'pho-104', qty: 1 }] }
  })
  const fields = {
    merchant_id: '10000100',
    m_payment_id: created.body.order.id,
    payment_status: 'COMPLETE',
    amount_gross: Number(created.body.order.total).toFixed(2),
    signature: 'deadbeef'
  }
  const res = await requestForm(app, '/api/v1/payments/payfast/itn', fields)
  assert.equal(res.status, 400)
  assert.equal(res.body.code, 'invalid_signature')
})

test('amount mismatch is rejected', async () => {
  const created = await request(app, 'POST', '/api/v1/user/orders', {
    token,
    body: { items: [{ photoId: 'pho-105', qty: 1 }] }
  })
  const fields = {
    merchant_id: '10000100',
    m_payment_id: created.body.order.id,
    payment_status: 'COMPLETE',
    amount_gross: '1.00'
  }
  fields.signature = buildSignature(fields)
  const res = await requestForm(app, '/api/v1/payments/payfast/itn', fields)
  assert.equal(res.status, 400)
  assert.equal(res.body.code, 'amount_mismatch')
})

test('orders are scoped to the owning student', async () => {
  const list = await request(app, 'GET', '/api/v1/user/orders', { token })
  assert.equal(list.status, 200)
  assert.ok(list.body.orders.every((o) => o.studentId === 'stu-001'))

  const other = await request(app, 'POST', '/api/v1/auth/login', { body: { code: '222222' } })
  const otherList = await request(app, 'GET', '/api/v1/user/orders', { token: other.body.token })
  assert.ok(otherList.body.orders.every((o) => o.studentId === 'stu-002'))
})

import { getDb } from '../db/index.js'
import { mapOrder, mapOrderItem } from './mappers.js'
import { randomId } from '../lib/crypto.js'

export const orderRepo = {
  async list({ userId, role } = {}) {
    const db = await getDb()
    const rows = role === 'admin'
      ? await db.query('SELECT * FROM orders ORDER BY created_at DESC')
      : await db.query('SELECT * FROM orders WHERE student_id = ? ORDER BY created_at DESC', [userId])
    const orders = []
    for (const row of rows) {
      const items = await db.query('SELECT * FROM order_items WHERE order_id = ?', [row.id])
      orders.push(mapOrder(row, items.map(mapOrderItem)))
    }
    return orders
  },

  async findById(id) {
    const db = await getDb()
    const rows = await db.query('SELECT * FROM orders WHERE id = ?', [id])
    if (!rows[0]) return null
    const items = await db.query('SELECT * FROM order_items WHERE order_id = ?', [id])
    return mapOrder(rows[0], items.map(mapOrderItem))
  },

  async findByPaymentRef(ref) {
    const db = await getDb()
    const rows = await db.query('SELECT * FROM orders WHERE payment_ref = ?', [ref])
    return rows[0] ? this.findById(rows[0].id) : null
  },

  async create({ studentId, identifier, paymentRef, items, total }) {
    const db = await getDb()
    const orderId = randomId('ord')
    const ts = new Date().toISOString()
    await db.transaction(async (tx) => {
      await tx.execute(
        'INSERT INTO orders (id, student_id, identifier, status, total, payment_ref, gateway, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?)',
        [orderId, studentId, identifier, 'pending', total, paymentRef, 'PayFast', ts, ts]
      )
      for (const item of items) {
        await tx.execute(
          'INSERT INTO order_items (id, order_id, photo_id, title, kind, texture, mat, overlay, size, qty, price) VALUES (?,?,?,?,?,?,?,?,?,?,?)',
          [randomId('itm'), orderId, item.photoId, item.title, item.kind, item.texture ?? null, item.mat ?? null, item.overlay ?? null, item.size ?? null, item.qty ?? 1, item.price]
        )
      }
    })
    return this.findById(orderId)
  },

  async updateStatus(id, status) {
    const db = await getDb()
    await db.execute('UPDATE orders SET status = ?, updated_at = ? WHERE id = ?', [status, new Date().toISOString(), id])
    return this.findById(id)
  },

  async recordPaymentEvent({ orderId, paymentRef, status, amount, raw }) {
    const db = await getDb()
    await db.execute(
      'INSERT INTO payment_events (id, order_id, payment_ref, status, amount, raw, created_at) VALUES (?,?,?,?,?,?,?)',
      [randomId('pay'), orderId, paymentRef ?? null, status, amount, JSON.stringify(raw || {}), new Date().toISOString()]
    )
  },

  async reports() {
    const db = await getDb()
    const paid = await db.query("SELECT total, status FROM orders")
    const revenue = paid.filter((o) => o.status === 'paid').reduce((s, o) => s + Number(o.total), 0)
    const itemCount = await db.query('SELECT COUNT(*) AS count FROM order_items')
    const students = await db.query("SELECT COUNT(*) AS count FROM users WHERE role = 'student'")
    const pending = await db.query("SELECT COUNT(*) AS count FROM orders WHERE status = 'pending'")
    return {
      revenueZar: revenue,
      photosSold: Number(itemCount[0]?.count ?? 0),
      framesSold: Number(itemCount[0]?.count ?? 0),
      activeStudents: Number(students[0]?.count ?? 0),
      pendingModeration: 0,
      conversionRate: paid.length ? Number(((paid.filter((o) => o.status === 'paid').length / paid.length) * 100).toFixed(1)) : 0,
      pendingOrders: Number(pending[0]?.count ?? 0)
    }
  }
}

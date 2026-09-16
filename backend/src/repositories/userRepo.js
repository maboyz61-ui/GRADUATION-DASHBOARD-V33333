import { getDb } from '../db/index.js'
import { mapUser } from './mappers.js'

export const userRepo = {
  async findById(id) {
    const db = await getDb()
    const rows = await db.query('SELECT * FROM users WHERE id = ?', [id])
    return mapUser(rows[0])
  },

  async findByEmail(email) {
    const db = await getDb()
    const rows = await db.query('SELECT * FROM users WHERE lower(email) = lower(?)', [email])
    return mapUser(rows[0])
  },

  async findByAnyAccessCode(code) {
    const db = await getDb()
    const rows = await db.query('SELECT * FROM users WHERE pin_hash IS NOT NULL')
    return rows
  },

  async findByPin(pin) {
    const db = await getDb()
    const rows = await db.query('SELECT * FROM users WHERE pin_hash IS NOT NULL')
    const { verifySecret } = await import('../lib/crypto.js')
    const match = rows.find((r) => verifySecret(pin, r.pin_hash))
    return match ? mapUser(match) : null
  },

  async findByStudentNumber(studentNumber) {
    const db = await getDb()
    const rows = await db.query('SELECT * FROM users WHERE student_number = ?', [studentNumber])
    return mapUser(rows[0])
  },

  async listStudents() {
    const db = await getDb()
    const rows = await db.query("SELECT * FROM users WHERE role = 'student' ORDER BY name")
    return rows.map(mapUser)
  },

  async update(id, patch) {
    const db = await getDb()
    const current = await this.findById(id)
    if (!current) return null
    const status = patch.status ?? current.status
    const identifier = patch.identifier ?? current.identifier
    await db.execute('UPDATE users SET status = ?, identifier = ? WHERE id = ?', [status, identifier, id])
    return this.findById(id)
  },

  async setIdentifier(id, identifier) {
    const db = await getDb()
    await db.execute('UPDATE users SET identifier = ? WHERE id = ?', [identifier, id])
    return this.findById(id)
  },

  async createAccessCode(userId, codeHash, { channel = 'sms', ttlSeconds = 300 } = {}) {
    const db = await getDb()
    const id = `code-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000).toISOString()
    await db.execute(
      'INSERT INTO access_codes (id, user_id, code_hash, channel, expires_at, created_at) VALUES (?,?,?,?,?,?)',
      [id, userId, codeHash, channel, expiresAt, new Date().toISOString()]
    )
    return { id, userId, expiresAt }
  },

  async consumeAccessCode(userId) {
    const db = await getDb()
    await db.execute(
      'UPDATE access_codes SET consumed_at = ? WHERE user_id = ? AND consumed_at IS NULL',
      [new Date().toISOString(), userId]
    )
  }
}

import { getDb } from '../db/index.js'
import { mapPhoto } from './mappers.js'

export const photoRepo = {
  async list({ userId, role, identifier, eventId, type, location, q } = {}) {
    const db = await getDb()
    const clauses = []
    const params = []
    if (role !== 'admin') {
      clauses.push('student_id = ?')
      params.push(userId)
    }
    if (identifier) {
      clauses.push('identifier = ?')
      params.push(identifier)
    }
    if (eventId) {
      clauses.push('event_id = ?')
      params.push(eventId)
    }
    if (type) {
      clauses.push('photo_type = ?')
      params.push(type)
    }
    if (location) {
      clauses.push('location = ?')
      params.push(location)
    }
    if (q) {
      clauses.push('(lower(title) LIKE ? OR lower(identifier) LIKE ?)')
      params.push(`%${String(q).toLowerCase()}%`, `%${String(q).toLowerCase()}%`)
    }
    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : ''
    const rows = await db.query(`SELECT * FROM photos ${where} ORDER BY captured_at DESC`, params)
    return rows.map(mapPhoto)
  },

  async findById(id) {
    const db = await getDb()
    const rows = await db.query('SELECT * FROM photos WHERE id = ?', [id])
    return mapPhoto(rows[0])
  },

  async listUnmoderated() {
    const db = await getDb()
    const rows = await db.query('SELECT * FROM photos WHERE moderated = 0 ORDER BY created_at DESC')
    return rows.map(mapPhoto)
  },

  async updateFlags(id, { favourite, moderated }) {
    const db = await getDb()
    if (typeof favourite === 'boolean') {
      await db.execute('UPDATE photos SET favourite = ? WHERE id = ?', [favourite ? 1 : 0, id])
    }
    if (typeof moderated === 'boolean') {
      await db.execute('UPDATE photos SET moderated = ? WHERE id = ?', [moderated ? 1 : 0, id])
    }
    return this.findById(id)
  },

  async countByIdentifier(identifier) {
    const db = await getDb()
    const rows = await db.query('SELECT COUNT(*) AS count FROM photos WHERE identifier = ?', [identifier])
    return Number(rows[0]?.count ?? 0)
  }
}

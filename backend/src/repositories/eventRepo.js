import { getDb } from '../db/index.js'
import { mapEvent } from './mappers.js'
import { randomId } from '../lib/crypto.js'

export const eventRepo = {
  async list() {
    const db = await getDb()
    const rows = await db.query('SELECT * FROM events ORDER BY event_date DESC')
    return rows.map(mapEvent)
  },

  async listPublished() {
    const db = await getDb()
    const rows = await db.query("SELECT * FROM events WHERE status = 'published' ORDER BY event_date DESC")
    return rows.map(mapEvent)
  },

  async findById(id) {
    const db = await getDb()
    const rows = await db.query('SELECT * FROM events WHERE id = ?', [id])
    return mapEvent(rows[0])
  },

  async create({ name, campus = 'All Campuses', date, photographers = 1, status = 'draft' }) {
    const db = await getDb()
    const event = {
      id: randomId('evt'),
      name: name || 'Untitled Event',
      campus,
      date: date || new Date().toISOString().slice(0, 10),
      status,
      photographers
    }
    await db.execute(
      'INSERT INTO events (id, name, campus, event_date, status, photos, photographers, created_at) VALUES (?,?,?,?,?,?,?,?)',
      [event.id, event.name, event.campus, event.date, event.status, 0, event.photographers, new Date().toISOString()]
    )
    return this.findById(event.id)
  },

  async update(id, patch) {
    const current = await this.findById(id)
    if (!current) return null
    const db = await getDb()
    await db.execute('UPDATE events SET name = ?, campus = ?, event_date = ?, status = ? WHERE id = ?', [
      patch.name ?? current.name,
      patch.campus ?? current.campus,
      patch.date ?? current.date,
      patch.status ?? current.status,
      id
    ])
    return this.findById(id)
  }
}

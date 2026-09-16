import { getDb } from '../db/index.js'
import { mapFrame } from './mappers.js'

export const frameRepo = {
  async catalog() {
    const db = await getDb()
    const [textures, mats, overlays, sizes] = await Promise.all([
      db.query('SELECT * FROM textures'),
      db.query('SELECT * FROM mats'),
      db.query('SELECT * FROM overlays'),
      db.query('SELECT * FROM frame_sizes')
    ])
    return {
      textures: textures.map(mapFrame),
      mats: mats.map(mapFrame),
      overlays: overlays.map(mapFrame),
      sizes: sizes.map(mapFrame)
    }
  },

  async findSize(id) {
    const db = await getDb()
    const rows = await db.query('SELECT * FROM frame_sizes WHERE id = ?', [id])
    return mapFrame(rows[0])
  },

  async findTexture(id) {
    const db = await getDb()
    const rows = await db.query('SELECT * FROM textures WHERE id = ?', [id])
    return mapFrame(rows[0])
  },

  async findMat(id) {
    const db = await getDb()
    const rows = await db.query('SELECT * FROM mats WHERE id = ?', [id])
    return mapFrame(rows[0])
  },

  async findOverlay(id) {
    const db = await getDb()
    const rows = await db.query('SELECT * FROM overlays WHERE id = ?', [id])
    return mapFrame(rows[0])
  }
}

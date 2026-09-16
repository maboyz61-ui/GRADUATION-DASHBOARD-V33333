import { getDb } from './index.js'
import { hashSecret, randomId } from '../lib/crypto.js'
import logger from '../lib/logger.js'

const now = () => new Date().toISOString()

function svgPhoto({ title, subtitle, hue, pattern }) {
  const bg = `hsl(${hue}, 42%, 18%)`
  const acc = `hsl(${hue}, 68%, 52%)`
  const acc2 = `hsl(${(hue + 40) % 360}, 70%, 62%)`
  const overlays = {
    portrait: `<circle cx="400" cy="280" r="92" fill="none" stroke="${acc}" stroke-width="3" opacity="0.55"/>
      <ellipse cx="400" cy="430" rx="110" ry="130" fill="${acc}" opacity="0.22"/>
      <circle cx="400" cy="250" r="58" fill="${acc2}" opacity="0.85"/>`,
    group: `<rect x="140" y="220" width="120" height="260" rx="12" fill="${acc}" opacity="0.35"/>
      <rect x="280" y="190" width="140" height="290" rx="12" fill="${acc2}" opacity="0.45"/>
      <rect x="440" y="230" width="120" height="250" rx="12" fill="${acc}" opacity="0.35"/>`,
    ceremony: `<polygon points="400,120 460,280 340,280" fill="${acc2}" opacity="0.7"/>
      <rect x="250" y="320" width="300" height="180" fill="${acc}" opacity="0.25"/>`,
    campus: `<rect x="120" y="260" width="160" height="220" fill="${acc}" opacity="0.4"/>
      <rect x="300" y="200" width="200" height="280" fill="${acc2}" opacity="0.45"/>`
  }
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1000" viewBox="0 0 800 1000">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%" stop-color="${bg}"/><stop offset="100%" stop-color="#0b1220"/>
  </linearGradient></defs>
  <rect width="800" height="1000" fill="url(#g)"/>
  <rect x="48" y="48" width="704" height="904" fill="none" stroke="${acc}" stroke-width="2" opacity="0.45"/>
  ${overlays[pattern] || overlays.portrait}
  <text x="400" y="760" text-anchor="middle" fill="#f4e4b2" font-family="Georgia, serif" font-size="28">${title}</text>
  <text x="400" y="800" text-anchor="middle" fill="#c9d4e8" font-family="Arial, sans-serif" font-size="16">${subtitle}</text>
</svg>`
  return `data:image/svg+xml;utf8,${encodeURIComponent(xml)}`
}

const USERS = [
  { id: 'stu-001', student_number: '221045678', name: 'Thandiwe Nkosi', email: 'thandiwe.nkosi@stu.ukzn.ac.za', campus: 'Howard College', faculty: 'Humanities', degree: 'BA Honours in Media Studies', identifier: 'UKZN-2026-X898', role: 'student', status: 'active', avatar_hue: 168, pin: '123456' },
  { id: 'stu-002', student_number: '220198432', name: 'Sipho Dlamini', email: 'sipho.dlamini@stu.ukzn.ac.za', campus: 'Westville', faculty: 'Engineering', degree: 'BSc Computer Science', identifier: 'UKZN-2026-K441', role: 'student', status: 'active', avatar_hue: 32, pin: '222222' },
  { id: 'stu-003', student_number: '219876321', name: 'Ayesha Patel', email: 'ayesha.patel@stu.ukzn.ac.za', campus: 'Pietermaritzburg', faculty: 'Health Sciences', degree: 'MBChB', identifier: 'UKZN-2026-M203', role: 'student', status: 'active', avatar_hue: 280, pin: '333333' },
  { id: 'stu-004', student_number: '221334890', name: 'Lerato Mokoena', email: 'lerato.mokoena@stu.ukzn.ac.za', campus: 'Edgewood', faculty: 'Education', degree: 'BEd Foundation Phase', identifier: 'UKZN-2026-E712', role: 'student', status: 'pending', avatar_hue: 12, pin: '444444' },
  { id: 'adm-001', name: 'Nomsa Khumalo', email: 'nomsa.khumalo@ukzn.ac.za', role: 'admin', department: 'UKZN Communications', status: 'active', pin: '999999' }
]

const EVENTS = [
  { id: 'evt-grad-2026', name: 'Graduation Ceremony 2026', campus: 'Howard College & Westville', event_date: '2026-04-16', status: 'published', photos: 18420, photographers: 12 },
  { id: 'evt-campus-2026', name: 'Campus Portrait Day', campus: 'All Campuses', event_date: '2026-03-28', status: 'published', photos: 6204, photographers: 8 },
  { id: 'evt-alumni-2026', name: 'Alumni Reunion Portraits', campus: 'Pietermaritzburg', event_date: '2026-05-09', status: 'draft', photos: 0, photographers: 3 }
]

const TEXTURES = [
  { id: 'oak', name: 'Oak', family: 'wood', hex: '#c08a4a', price: 0 },
  { id: 'mahogany', name: 'Mahogany', family: 'wood', hex: '#6b2b1f', price: 45 },
  { id: 'maple', name: 'Maple', family: 'wood', hex: '#e3c38a', price: 25 },
  { id: 'walnut', name: 'Walnut', family: 'wood', hex: '#4a2f1c', price: 55 },
  { id: 'black-satin', name: 'Black Satin', family: 'modern', hex: '#1a1a1a', price: 35 },
  { id: 'gold-leaf', name: 'Gold Leaf', family: 'ornate', hex: '#c9a227', price: 95 }
]
const MATS = [
  { id: 'ivory', name: 'Ivory', hex: '#f4efe3', price: 0 },
  { id: 'charcoal', name: 'Charcoal', hex: '#2c2c2c', price: 18 },
  { id: 'navy', name: 'UKZN Navy', hex: '#0b1f44', price: 22 },
  { id: 'crimson', name: 'Crimson', hex: '#7a1f2b', price: 22 },
  { id: 'cream', name: 'Museum Cream', hex: '#f7f1de', price: 12 }
]
const OVERLAYS = [
  { id: 'none', name: 'None', price: 0 },
  { id: 'ukzn-crest', name: 'UKZN Crest', price: 40 },
  { id: 'class-2026', name: 'Class of 2026', price: 25 },
  { id: 'latin-motto', name: 'Per Ardua Ad Astra', price: 30 }
]
const SIZES = [
  { id: '8x10', name: '8x10', width: 20.3, height: 25.4, price: 1499 },
  { id: 'a4', name: 'A4', width: 21, height: 29.7, price: 220 },
  { id: '11x14', name: '11x14', width: 27.9, height: 35.6, price: 1890 },
  { id: 'a3', name: 'A3', width: 29.7, height: 42, price: 340 }
]

const STOCK = [
  'https://images.unsplash.com/photo-1523050854058-8df90182cbe1?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1627556592933-ffe99c1cd9eb?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1523580846011-d3a5bc25702b?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1627556592923-582ebd171235?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1531384441138-2736e62e0919?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=900&q=80'
]

const BASE_PHOTOS = [
  ['pho-101', 'Formal Portrait', 'evt-grad-2026', 'Graduation Ceremony 2026', 189, 'portrait', 'Individual', 'Robing'],
  ['pho-102', 'Cap Toss', 'evt-grad-2026', 'Graduation Ceremony 2026', 149, 'ceremony', 'Candid', 'Stage'],
  ['pho-103', 'Family Moment', 'evt-grad-2026', 'Graduation Ceremony 2026', 169, 'group', 'Group', 'Campus'],
  ['pho-104', 'Memorial Tower', 'evt-campus-2026', 'Campus Portrait Day', 129, 'campus', 'Candid', 'Campus'],
  ['pho-105', 'Gown Close-up', 'evt-grad-2026', 'Graduation Ceremony 2026', 99, 'portrait', 'Individual', 'Robing'],
  ['pho-106', 'Procession', 'evt-grad-2026', 'Graduation Ceremony 2026', 149, 'ceremony', 'Candid', 'Stage']
]

const EXTRA_TITLES = ['Stage Walk', 'Family Hug', 'Gown Adjust', 'Quad Portrait', 'Friends Together', 'Diploma Moment', 'Robing Room', 'Campus Lawn', 'Studio Headshot', 'Class Photo']

function buildPhotos() {
  const rows = BASE_PHOTOS.map(([id, title, eventId, eventName, price, pattern, type, location], i) => ({
    id, student_id: 'stu-001', identifier: 'UKZN-2026-X898', title, event_id: eventId, event_name: eventName,
    campus: 'Howard College', captured_at: `2026-04-16T0${8 + i}:20:00Z`, resolution: '6000x7500',
    file_size: `${12 + i}.4 MB`, s3_key: `s3://ukzn-grad-2026/howard/x898/${id}.jpg`,
    storage_key: `events/evt-grad-2026/UKZN-2026-X898/${id}.jpg`, price, tagged: 1, moderated: i !== 4 ? 1 : 0,
    favourite: i % 3 === 0 ? 1 : 0, photo_type: type, location, url: STOCK[i % STOCK.length], thumb_url: STOCK[i % STOCK.length]
  }))
  EXTRA_TITLES.forEach((title, i) => {
    rows.push({
      id: `pho-1${10 + i}`, student_id: 'stu-001', identifier: 'UKZN-2026-X898', title,
      event_id: i % 3 === 0 ? 'evt-campus-2026' : 'evt-grad-2026',
      event_name: i % 3 === 0 ? 'Campus Portrait Day' : 'Graduation Ceremony 2026',
      campus: 'Howard College', captured_at: `2026-04-16T1${i % 8}:1${i % 6}:00Z`, resolution: '6000x4000',
      file_size: `${12 + i}.1 MB`, s3_key: `s3://ukzn-grad-2026/howard/x898/extra-${i}.jpg`,
      storage_key: `events/evt-grad-2026/UKZN-2026-X898/extra-${i}.jpg`, price: 129 + i * 10,
      tagged: 1, moderated: 1, favourite: i % 4 === 0 ? 1 : 0,
      photo_type: i % 3 === 0 ? 'Group' : i % 3 === 1 ? 'Candid' : 'Individual',
      location: i % 3 === 0 ? 'Campus' : i % 3 === 1 ? 'Robing' : 'Stage',
      url: STOCK[(i + 6) % STOCK.length], thumb_url: STOCK[(i + 6) % STOCK.length]
    })
  })
  return rows
}

export async function seed({ force = false } = {}) {
  const db = await getDb()
  const existing = await db.query('SELECT COUNT(*) AS count FROM users')
  const count = Number(existing[0]?.count ?? existing[0]?.COUNT ?? 0)
  if (count > 0 && !force) return { skipped: true }

  await db.transaction(async (tx) => {
    if (force) {
      for (const table of ['order_items', 'orders', 'payment_events', 'access_codes', 'photos', 'events', 'textures', 'mats', 'overlays', 'frame_sizes', 'users']) {
        await tx.execute(`DELETE FROM ${table}`)
      }
    }
    for (const u of USERS) {
      await tx.execute(
        `INSERT INTO users (id, student_number, name, email, campus, faculty, degree, identifier, role, status, department, avatar_hue, pin_hash, created_at)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [u.id, u.student_number ?? null, u.name, u.email, u.campus ?? null, u.faculty ?? null, u.degree ?? null, u.identifier ?? null, u.role, u.status, u.department ?? null, u.avatar_hue ?? null, u.pin ? hashSecret(u.pin) : null, now()]
      )
    }
    for (const e of EVENTS) {
      await tx.execute(
        `INSERT INTO events (id, name, campus, event_date, status, photos, photographers, created_at) VALUES (?,?,?,?,?,?,?,?)`,
        [e.id, e.name, e.campus, e.event_date, e.status, e.photos, e.photographers, now()]
      )
    }
    for (const p of buildPhotos()) {
      await tx.execute(
        `INSERT INTO photos (id, student_id, identifier, title, event_id, event_name, campus, captured_at, resolution, file_size, s3_key, storage_key, price, tagged, moderated, favourite, photo_type, location, url, thumb_url, created_at)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [p.id, p.student_id, p.identifier, p.title, p.event_id, p.event_name, p.campus, p.captured_at, p.resolution, p.file_size, p.s3_key, p.storage_key, p.price, p.tagged, p.moderated, p.favourite, p.photo_type, p.location, p.url, p.thumb_url, now()]
      )
    }
    for (const t of TEXTURES) await tx.execute('INSERT INTO textures (id,name,family,hex,price) VALUES (?,?,?,?,?)', [t.id, t.name, t.family, t.hex, t.price])
    for (const m of MATS) await tx.execute('INSERT INTO mats (id,name,hex,price) VALUES (?,?,?,?)', [m.id, m.name, m.hex, m.price])
    for (const o of OVERLAYS) await tx.execute('INSERT INTO overlays (id,name,price) VALUES (?,?,?)', [o.id, o.name, o.price])
    for (const s of SIZES) await tx.execute('INSERT INTO frame_sizes (id,name,width,height,price) VALUES (?,?,?,?,?)', [s.id, s.name, s.width, s.height, s.price])

    await tx.execute(
      `INSERT INTO orders (id, student_id, identifier, status, total, payment_ref, gateway, created_at, updated_at)
       VALUES (?,?,?,?,?,?,?,?,?)`,
      ['ord-9001', 'stu-001', 'UKZN-2026-X898', 'paid', 574, 'PAYFAST-8F2C11', 'PayFast', '2026-04-18T16:22:00Z', now()]
    )
    await tx.execute(
      `INSERT INTO order_items (id, order_id, photo_id, title, kind, texture, mat, overlay, size, qty, price)
       VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
      [randomId('itm'), 'ord-9001', 'pho-101', 'Formal Portrait', 'print+frame', 'mahogany', 'ivory', 'ukzn-crest', 'a3', 1, 574]
    )
  })

  logger.info('seed complete', { users: USERS.length, photos: BASE_PHOTOS.length + EXTRA_TITLES.length })
  return { skipped: false }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  seed({ force: process.argv.includes('--force') })
    .then(() => process.exit(0))
    .catch((err) => {
      logger.error('seed failed', { message: err.message })
      process.exit(1)
    })
}

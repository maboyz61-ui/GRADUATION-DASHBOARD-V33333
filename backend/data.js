import { randomUUID } from 'crypto'

export const students = [
  {
    id: 'stu-001',
    studentNumber: '221045678',
    name: 'Thandiwe Nkosi',
    email: 'thandiwe.nkosi@stu.ukzn.ac.za',
    campus: 'Howard College',
    faculty: 'Humanities',
    degree: 'BA Honours in Media Studies',
    identifier: 'UKZN-2026-X898',
    role: 'student',
    status: 'active',
    avatarHue: 168
  },
  {
    id: 'stu-002',
    studentNumber: '220198432',
    name: 'Sipho Dlamini',
    email: 'sipho.dlamini@stu.ukzn.ac.za',
    campus: 'Westville',
    faculty: 'Engineering',
    degree: 'BSc Computer Science',
    identifier: 'UKZN-2026-K441',
    role: 'student',
    status: 'active',
    avatarHue: 32
  },
  {
    id: 'stu-003',
    studentNumber: '219876321',
    name: 'Ayesha Patel',
    email: 'ayesha.patel@stu.ukzn.ac.za',
    campus: 'Pietermaritzburg',
    faculty: 'Health Sciences',
    degree: 'MBChB',
    identifier: 'UKZN-2026-M203',
    role: 'student',
    status: 'active',
    avatarHue: 280
  },
  {
    id: 'stu-004',
    studentNumber: '221334890',
    name: 'Lerato Mokoena',
    email: 'lerato.mokoena@stu.ukzn.ac.za',
    campus: 'Edgewood',
    faculty: 'Education',
    degree: 'BEd Foundation Phase',
    identifier: 'UKZN-2026-E712',
    role: 'student',
    status: 'pending',
    avatarHue: 12
  }
]

export const admins = [
  {
    id: 'adm-001',
    name: 'Nomsa Khumalo',
    email: 'nomsa.khumalo@ukzn.ac.za',
    role: 'admin',
    department: 'UKZN Communications'
  }
]

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
      <rect x="440" y="230" width="120" height="250" rx="12" fill="${acc}" opacity="0.35"/>
      <rect x="580" y="250" width="100" height="230" rx="12" fill="${acc2}" opacity="0.3"/>`,
    ceremony: `<polygon points="400,120 460,280 340,280" fill="${acc2}" opacity="0.7"/>
      <rect x="250" y="320" width="300" height="180" fill="${acc}" opacity="0.25"/>
      <circle cx="180" cy="160" r="40" fill="#f4e4b2" opacity="0.55"/>`,
    campus: `<rect x="120" y="260" width="160" height="220" fill="${acc}" opacity="0.4"/>
      <rect x="300" y="200" width="200" height="280" fill="${acc2}" opacity="0.45"/>
      <rect x="520" y="240" width="160" height="240" fill="${acc}" opacity="0.35"/>
      <polygon points="300,200 400,120 500,200" fill="${acc2}" opacity="0.7"/>`
  }
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1000" viewBox="0 0 800 1000">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${bg}"/>
      <stop offset="100%" stop-color="#0b1220"/>
    </linearGradient>
  </defs>
  <rect width="800" height="1000" fill="url(#g)"/>
  <rect x="48" y="48" width="704" height="904" fill="none" stroke="${acc}" stroke-width="2" opacity="0.45"/>
  ${overlays[pattern] || overlays.portrait}
  <text x="400" y="760" text-anchor="middle" fill="#f4e4b2" font-family="Georgia, serif" font-size="28">${title}</text>
  <text x="400" y="800" text-anchor="middle" fill="#c9d4e8" font-family="Arial, sans-serif" font-size="16">${subtitle}</text>
  <text x="400" y="920" text-anchor="middle" fill="#8aa0c4" font-family="Arial, sans-serif" font-size="13">University of KwaZulu-Natal · Graduation 2026</text>
</svg>`
  return `data:image/svg+xml;utf8,${encodeURIComponent(xml)}`
}

export const photos = [
  {
    id: 'pho-101',
    studentId: 'stu-001',
    identifier: 'UKZN-2026-X898',
    title: 'Formal Portrait',
    eventId: 'evt-grad-2026',
    eventName: 'Graduation Ceremony 2026',
    campus: 'Howard College',
    capturedAt: '2026-04-16T09:20:00Z',
    resolution: '6000x7500',
    fileSize: '18.4 MB',
    s3Key: 's3://ukzn-grad-2026/howard/x898/portrait-01.jpg',
    price: 189,
    tagged: true,
    moderated: true,
    favourite: true,
    hue: 168,
    pattern: 'portrait'
  },
  {
    id: 'pho-102',
    studentId: 'stu-001',
    identifier: 'UKZN-2026-X898',
    title: 'Cap Toss',
    eventId: 'evt-grad-2026',
    eventName: 'Graduation Ceremony 2026',
    campus: 'Howard College',
    capturedAt: '2026-04-16T11:05:00Z',
    resolution: '6000x4000',
    fileSize: '14.1 MB',
    s3Key: 's3://ukzn-grad-2026/howard/x898/ceremony-02.jpg',
    price: 149,
    tagged: true,
    moderated: true,
    favourite: false,
    hue: 42,
    pattern: 'ceremony'
  },
  {
    id: 'pho-103',
    studentId: 'stu-001',
    identifier: 'UKZN-2026-X898',
    title: 'Family Moment',
    eventId: 'evt-grad-2026',
    eventName: 'Graduation Ceremony 2026',
    campus: 'Howard College',
    capturedAt: '2026-04-16T12:40:00Z',
    resolution: '5000x6500',
    fileSize: '16.8 MB',
    s3Key: 's3://ukzn-grad-2026/howard/x898/group-03.jpg',
    price: 169,
    tagged: true,
    moderated: true,
    favourite: true,
    hue: 28,
    pattern: 'group'
  },
  {
    id: 'pho-104',
    studentId: 'stu-001',
    identifier: 'UKZN-2026-X898',
    title: 'Memorial Tower',
    eventId: 'evt-campus-2026',
    eventName: 'Campus Portrait Day',
    campus: 'Howard College',
    capturedAt: '2026-03-28T15:10:00Z',
    resolution: '7360x4912',
    fileSize: '22.0 MB',
    s3Key: 's3://ukzn-grad-2026/howard/x898/campus-04.jpg',
    price: 129,
    tagged: true,
    moderated: true,
    favourite: false,
    hue: 210,
    pattern: 'campus'
  },
  {
    id: 'pho-105',
    studentId: 'stu-001',
    identifier: 'UKZN-2026-X898',
    title: 'Gown Close-up',
    eventId: 'evt-grad-2026',
    eventName: 'Graduation Ceremony 2026',
    campus: 'Howard College',
    capturedAt: '2026-04-16T09:35:00Z',
    resolution: '4000x5000',
    fileSize: '11.2 MB',
    s3Key: 's3://ukzn-grad-2026/howard/x898/portrait-05.jpg',
    price: 99,
    tagged: true,
    moderated: false,
    favourite: false,
    hue: 195,
    pattern: 'portrait'
  },
  {
    id: 'pho-106',
    studentId: 'stu-001',
    identifier: 'UKZN-2026-X898',
    title: 'Procession',
    eventId: 'evt-grad-2026',
    eventName: 'Graduation Ceremony 2026',
    campus: 'Howard College',
    capturedAt: '2026-04-16T10:12:00Z',
    resolution: '6000x4000',
    fileSize: '15.6 MB',
    s3Key: 's3://ukzn-grad-2026/howard/x898/ceremony-06.jpg',
    price: 149,
    tagged: true,
    moderated: true,
    favourite: false,
    hue: 12,
    pattern: 'ceremony'
  },
  {
    id: 'pho-201',
    studentId: 'stu-002',
    identifier: 'UKZN-2026-K441',
    title: 'Engineering Portrait',
    eventId: 'evt-grad-2026',
    eventName: 'Graduation Ceremony 2026',
    campus: 'Westville',
    capturedAt: '2026-04-17T08:50:00Z',
    resolution: '6000x7500',
    fileSize: '19.1 MB',
    s3Key: 's3://ukzn-grad-2026/westville/k441/portrait-01.jpg',
    price: 189,
    tagged: true,
    moderated: true,
    favourite: true,
    hue: 32,
    pattern: 'portrait'
  },
  {
    id: 'pho-202',
    studentId: 'stu-002',
    identifier: 'UKZN-2026-K441',
    title: 'Westville Quad',
    eventId: 'evt-campus-2026',
    eventName: 'Campus Portrait Day',
    campus: 'Westville',
    capturedAt: '2026-03-29T14:22:00Z',
    resolution: '7360x4912',
    fileSize: '21.4 MB',
    s3Key: 's3://ukzn-grad-2026/westville/k441/campus-02.jpg',
    price: 129,
    tagged: true,
    moderated: true,
    favourite: false,
    hue: 145,
    pattern: 'campus'
  }
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

const extraTitles = [
  'Stage Walk', 'Family Hug', 'Gown Adjust', 'Quad Portrait', 'Friends Together',
  'Diploma Moment', 'Robing Room', 'Campus Lawn', 'Studio Headshot', 'Class Photo'
]
const extra = extraTitles.map((title, i) => ({
  id: `pho-1${10 + i}`,
  studentId: 'stu-001',
  identifier: 'UKZN-2026-X898',
  title,
  eventId: i % 3 === 0 ? 'evt-campus-2026' : 'evt-grad-2026',
  eventName: i % 3 === 0 ? 'Campus Portrait Day' : 'Graduation Ceremony 2026',
  campus: 'Howard College',
  capturedAt: `2026-04-16T1${i % 8}:1${i % 6}:00Z`,
  resolution: '6000x4000',
  fileSize: `${12 + i}.1 MB`,
  s3Key: `s3://ukzn-grad-2026/howard/x898/extra-${i}.jpg`,
  price: 129 + i * 10,
  tagged: true,
  moderated: true,
  favourite: i % 4 === 0,
  hue: 20 + i * 18,
  pattern: i % 2 ? 'group' : 'portrait',
  type: i % 3 === 0 ? 'Group' : i % 3 === 1 ? 'Candid' : 'Individual',
  location: i % 3 === 0 ? 'Campus' : i % 3 === 1 ? 'Robing' : 'Stage'
}))
photos.push(...extra)

photos.forEach((p, i) => {
  p.type = p.type || (p.pattern === 'group' ? 'Group' : p.pattern === 'campus' ? 'Candid' : 'Individual')
  p.location = p.location || (p.pattern === 'campus' ? 'Campus' : p.pattern === 'ceremony' ? 'Stage' : 'Robing')
  p.url = STOCK[i % STOCK.length]
  p.thumbUrl = p.url
})

export const events = [
  {
    id: 'evt-grad-2026',
    name: 'Graduation Ceremony 2026',
    campus: 'Howard College & Westville',
    date: '2026-04-16',
    status: 'published',
    photos: 18420,
    photographers: 12
  },
  {
    id: 'evt-campus-2026',
    name: 'Campus Portrait Day',
    campus: 'All Campuses',
    date: '2026-03-28',
    status: 'published',
    photos: 6204,
    photographers: 8
  },
  {
    id: 'evt-alumni-2026',
    name: 'Alumni Reunion Portraits',
    campus: 'Pietermaritzburg',
    date: '2026-05-09',
    status: 'draft',
    photos: 0,
    photographers: 3
  }
]

export const textures = [
  { id: 'oak', name: 'Oak', family: 'wood', hex: '#c08a4a', price: 0 },
  { id: 'mahogany', name: 'Mahogany', family: 'wood', hex: '#6b2b1f', price: 45 },
  { id: 'maple', name: 'Maple', family: 'wood', hex: '#e3c38a', price: 25 },
  { id: 'walnut', name: 'Walnut', family: 'wood', hex: '#4a2f1c', price: 55 },
  { id: 'black-satin', name: 'Black Satin', family: 'modern', hex: '#1a1a1a', price: 35 },
  { id: 'gold-leaf', name: 'Gold Leaf', family: 'ornate', hex: '#c9a227', price: 95 }
]

export const mats = [
  { id: 'ivory', name: 'Ivory', hex: '#f4efe3', price: 0 },
  { id: 'charcoal', name: 'Charcoal', hex: '#2c2c2c', price: 18 },
  { id: 'navy', name: 'UKZN Navy', hex: '#0b1f44', price: 22 },
  { id: 'crimson', name: 'Crimson', hex: '#7a1f2b', price: 22 },
  { id: 'cream', name: 'Museum Cream', hex: '#f7f1de', price: 12 }
]

export const overlays = [
  { id: 'none', name: 'None', price: 0 },
  { id: 'ukzn-crest', name: 'UKZN Crest', price: 40 },
  { id: 'class-2026', name: 'Class of 2026', price: 25 },
  { id: 'latin-motto', name: 'Per Ardua Ad Astra', price: 30 }
]

export const frameSizes = [
  { id: '8x10', name: '8x10', width: 20.3, height: 25.4, price: 1499 },
  { id: 'a4', name: 'A4', width: 21, height: 29.7, price: 220 },
  { id: '11x14', name: '11x14', width: 27.9, height: 35.6, price: 1890 },
  { id: 'a3', name: 'A3', width: 29.7, height: 42, price: 340 }
]

export const orders = [
  {
    id: 'ord-9001',
    studentId: 'stu-001',
    identifier: 'UKZN-2026-X898',
    status: 'paid',
    createdAt: '2026-04-18T16:22:00Z',
    total: 574,
    paymentRef: 'PAYFAST-8F2C11',
    items: [
      {
        photoId: 'pho-101',
        title: 'Formal Portrait',
        kind: 'print+frame',
        texture: 'mahogany',
        mat: 'ivory',
        overlay: 'ukzn-crest',
        size: 'a3',
        qty: 1,
        price: 574
      }
    ]
  }
]

export const reports = {
  revenueZar: 1842650,
  photosSold: 4128,
  framesSold: 1964,
  activeStudents: 11842,
  pendingModeration: 37,
  conversionRate: 34.8
}

export function nextIdentifier() {
  const n = 100 + Math.floor(Math.random() * 900)
  const letter = String.fromCharCode(65 + Math.floor(Math.random() * 26))
  return `UKZN-2026-${letter}${n}`
}

export function createOrder(payload) {
  const order = {
    id: `ord-${randomUUID().slice(0, 8)}`,
    studentId: payload.studentId,
    identifier: payload.identifier,
    status: 'paid',
    createdAt: new Date().toISOString(),
    total: payload.total,
    paymentRef: `PAYFAST-${randomUUID().slice(0, 6).toUpperCase()}`,
    items: payload.items
  }
  orders.unshift(order)
  return order
}

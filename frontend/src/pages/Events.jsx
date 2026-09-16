import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, getUser } from '../api'
import { EVENT_COVERS } from '../media.js'

const FALLBACK = [
  { id: 'evt-grad-2026', name: 'UKZN Durban Graduation Day', campus: 'Howard College & Westville', date: 'Saturday, 12 Sep 2026', status: 'published', photos: 78 },
  { id: 'evt-campus-2026', name: 'Campus Portrait Day', campus: 'All Campuses', date: 'Saturday, 28 Mar 2026', status: 'published', photos: 42 },
  { id: 'evt-alumni-2026', name: 'Alumni Reunion Portraits', campus: 'Pietermaritzburg', date: 'Saturday, 9 May 2026', status: 'draft', photos: 0 }
]

export default function Events() {
  const [events, setEvents] = useState(FALLBACK)
  const user = getUser()
  const nav = useNavigate()

  useEffect(() => {
    const load = user?.role === 'admin' ? api.events : api.publicEvents
    load().then((d) => setEvents(d.events || FALLBACK)).catch(() => {})
  }, [user])

  return (
    <div>
      <div className="section-head">
        <div>
          <h3>Events</h3>
          <p>Official sittings and ceremony coverage linked to your identifier.</p>
        </div>
      </div>
      <div className="uni-grid">
        {events.map((ev, i) => (
          <article key={ev.id} className="uni-card" onClick={() => nav('/gallery')}>
            <div className="cover" style={{ backgroundImage: `url(${EVENT_COVERS[i % EVENT_COVERS.length]})` }} />
            <div className="body">
              <span className={`tag ${ev.status === 'published' ? 'ok' : 'warn'}`}>{ev.status}</span>
              <h4 style={{ marginTop: 10 }}>{ev.name.includes('Graduation') ? 'UKZN Durban Graduation Day' : ev.name}</h4>
              <div className="loc">{ev.campus}</div>
              <div className="loc">{ev.date}</div>
              <div className="uni-stats">
                <div><b>{ev.photos || 78}</b><span>Photos</span></div>
                <div><b>1</b><span>Event</span></div>
                <div><b>12</b><span>Designs</span></div>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}

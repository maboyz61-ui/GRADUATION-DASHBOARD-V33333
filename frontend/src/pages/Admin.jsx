import { useEffect, useState } from 'react'
import { api } from '../api'

export default function Admin() {
  const [tab, setTab] = useState('users')
  const [users, setUsers] = useState([])
  const [events, setEvents] = useState([])
  const [queue, setQueue] = useState([])
  const [reports, setReports] = useState(null)
  const [ams, setAms] = useState(null)
  const [eventName, setEventName] = useState('')

  async function load() {
    const [u, e, m, r, a] = await Promise.all([
      api.users(), api.events(), api.moderation(), api.reports(), api.ams()
    ])
    setUsers(u.students || [])
    setEvents(e.events || [])
    setQueue(m.photos || [])
    setReports(r)
    setAms(a)
  }

  useEffect(() => { load().catch(() => {}) }, [])

  return (
    <div>
      <div className="row" style={{ marginBottom: 16 }}>
        {['users', 'events', 'moderation', 'reports', 'ams'].map((t) => (
          <button key={t} className={tab === t ? 'btn' : 'btn ghost'} onClick={() => setTab(t)}>
            {t === 'ams' ? 'Asset Manager' : t}
          </button>
        ))}
      </div>

      {tab === 'users' && (
        <div className="card">
          <h3>User management</h3>
          <table className="table">
            <thead><tr><th>Student</th><th>Identifier</th><th>Campus</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {users.map((s) => (
                <tr key={s.id}>
                  <td>{s.name}<div style={{ color: 'var(--muted)', fontSize: 12 }}>{s.email}</div></td>
                  <td>{s.identifier}</td>
                  <td>{s.campus}</td>
                  <td><span className={`tag ${s.status === 'active' ? 'ok' : 'warn'}`}>{s.status}</span></td>
                  <td className="row">
                    <button className="btn ghost" onClick={async () => {
                      await api.patchUser(s.id, { status: s.status === 'active' ? 'pending' : 'active' })
                      load()
                    }}>Toggle</button>
                    <button className="btn ghost" onClick={async () => {
                      await api.assignIdentifier(s.id)
                      load()
                    }}>New ID</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'events' && (
        <div className="card">
          <h3>Event management</h3>
          <div className="row" style={{ margin: '12px 0 16px' }}>
            <input value={eventName} onChange={(e) => setEventName(e.target.value)} placeholder="New event name" />
            <button className="btn" onClick={async () => {
              if (!eventName) return
              await api.createEvent({ name: eventName, campus: 'Howard College' })
              setEventName('')
              load()
            }}>Create</button>
          </div>
          <table className="table">
            <thead><tr><th>Event</th><th>Date</th><th>Photos</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {events.map((ev) => (
                <tr key={ev.id}>
                  <td>{ev.name}<div style={{ color: 'var(--muted)', fontSize: 12 }}>{ev.campus}</div></td>
                  <td>{ev.date}</td>
                  <td>{ev.photos}</td>
                  <td>{ev.status}</td>
                  <td>
                    <button className="btn ghost" onClick={async () => {
                      await api.patchEvent(ev.id, { status: ev.status === 'published' ? 'draft' : 'published' })
                      load()
                    }}>Toggle publish</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'moderation' && (
        <div className="card">
          <h3>Content moderation</h3>
          <div className="grid photos" style={{ marginTop: 16 }}>
            {queue.map((p) => (
              <article key={p.id} className="card photo-card">
                <img src={p.thumbUrl} alt={p.title} />
                <div className="meta">
                  <h4 className="serif">{p.title}</h4>
                  <p>{p.identifier}</p>
                  <button className="btn" onClick={async () => {
                    await api.patchPhoto(p.id, { moderated: true })
                    load()
                  }}>Approve</button>
                </div>
              </article>
            ))}
            {!queue.length && <p>Queue clear.</p>}
          </div>
        </div>
      )}

      {tab === 'reports' && reports && (
        <div className="grid stats">
          <div className="card"><h3>Revenue</h3><div className="num serif">R {(reports.reports.revenueZar / 1000).toFixed(0)}k</div></div>
          <div className="card"><h3>Photos sold</h3><div className="num serif">{reports.reports.photosSold}</div></div>
          <div className="card"><h3>Frames sold</h3><div className="num serif">{reports.reports.framesSold}</div></div>
          <div className="card"><h3>Conversion</h3><div className="num serif">{reports.reports.conversionRate}%</div></div>
        </div>
      )}

      {tab === 'ams' && ams && (
        <div className="card">
          <h3>Asset management — textures, mats, overlays</h3>
          <table className="table">
            <thead><tr><th>Type</th><th>Name</th><th>Price</th></tr></thead>
            <tbody>
              {ams.textures.map((t) => <tr key={t.id}><td>Texture</td><td>{t.name}</td><td>R {t.price}</td></tr>)}
              {ams.mats.map((t) => <tr key={t.id}><td>Mat</td><td>{t.name}</td><td>R {t.price}</td></tr>)}
              {ams.overlays.map((t) => <tr key={t.id}><td>Overlay</td><td>{t.name}</td><td>R {t.price}</td></tr>)}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

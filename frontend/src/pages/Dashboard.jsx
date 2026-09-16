import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, getUser } from '../api'
import { useCart } from '../cart.jsx'
import { CAMPUS, EVENT_COVERS, GRADES, HEADSHOT } from '../media.js'
import { I } from '../icons.jsx'

export default function Dashboard() {
  const user = getUser()
  const nav = useNavigate()
  const cart = useCart()
  const [photos, setPhotos] = useState([])
  const [events, setEvents] = useState([])

  useEffect(() => {
    api.photos().then((d) => setPhotos(d.photos || [])).catch(() => {})
    api.publicEvents().then((d) => setEvents(d.events || [])).catch(() => {})
  }, [])

  const day = photos.slice(0, 8)
  const ident = user?.identifier || 'UKZN-2026-X898'
  const shortId = ident.split('-').pop()

  return (
    <div>
      <section className="hero-stack">
        <div className="dash-kicker">YOUR GRADUATION JOURNEY</div>
        <h1 className="headline-md" style={{ marginTop: 12 }}>UKZN Durban Graduation Day</h1>
        <p className="body-lg">Access your photo galleries, events, grades and framing mockups — all linked to your dashboard identifier.</p>
        <div className="panel-actions">
          <button className="btn" onClick={() => nav('/gallery')}>View Photos</button>
          <button className="btn outline" onClick={() => nav('/studio')}>Open Framing Mockups</button>
        </div>
      </section>
      <img className="hero-media" src={CAMPUS} alt="UKZN campus" />

      <section className="panel-dark bleed-out" style={{ marginTop: 12 }}>
        <div className="panel-inner" style={{ textAlign: 'center' }}>
          <h2 className="label-md">Your journey matters.</h2>
          <p className="body-lg" style={{ marginTop: 12 }}>Capture · Remember · Share</p>
          <div className="panel-actions">
            <button className="btn light" onClick={() => nav('/events')}>Explore Events</button>
          </div>
        </div>
      </section>

      <div className="bento" style={{ marginTop: 12 }}>
        <div className="bento-item">
          <div className="pad"><h3>My Day Photos</h3></div>
          <div style={{ padding: 32 }}>
            <div className="day-grid">
              {day.slice(0, 2).map((p) => <img key={p.id} src={p.thumbUrl} alt="" onClick={() => nav('/gallery')} />)}
              <img className="hero-shot" src={day[2]?.thumbUrl || CAMPUS} alt="" onClick={() => nav('/gallery')} />
              <img src={day[3]?.thumbUrl || CAMPUS} alt="" onClick={() => nav('/gallery')} />
              {day.slice(4, 8).map((p) => <img key={p.id} src={p.thumbUrl} alt="" onClick={() => nav('/gallery')} />)}
            </div>
            <div className="day-foot">
              <div>Event ID<b>{shortId}</b></div>
              <div>Total Files<b>78</b></div>
              <div>My Selection<b>12</b></div>
              <button className="btn dark sm" style={{ marginLeft: 'auto' }} onClick={() => nav('/gallery')}>View all photos</button>
            </div>
          </div>
        </div>

        <div className="bento-item">
          <div className="pad"><h3>Grades &amp; Designs</h3><p className="body-md">Retouch grades and framed looks.</p></div>
          <div style={{ padding: 32 }}>
            <div className="grade-grid">
              {GRADES.map((g) => (
                <button key={g.id} className={`grade-tile ${g.framed ? 'framed' : ''}`} onClick={() => nav('/designs')}>
                  <img src={g.img} alt="" />
                  <span>{g.name}</span>
                </button>
              ))}
            </div>
            <input className="slider" type="range" defaultValue="60" />
          </div>
        </div>

        <div className="bento-item dark">
          <div className="pad"><h3>3D Frame Mockup</h3><p className="body-md">Premium wooden frames — ~20 designs available.</p></div>
          <div style={{ padding: 32 }}>
            <img src={HEADSHOT} alt="" style={{ width: '60%', margin: '0 auto', border: '14px solid #6b3a1f' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24 }}>
              <div>
                <div style={{ fontSize: 12, color: '#a1a1a6', marginBottom: 8 }}>Material</div>
                <div className="swatches">
                  <button className="swatch on" style={{ background: '#c08a4a' }} />
                  <button className="swatch" style={{ background: '#6b2b1f' }} />
                  <button className="swatch" style={{ background: '#e3c38a' }} />
                </div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: '#a1a1a6', marginBottom: 8 }}>Size</div>
                <div className="swatches">
                  <button className="size-chip on">8x10</button>
                  <button className="size-chip">A4</button>
                  <button className="size-chip">11x14</button>
                </div>
              </div>
            </div>
            <button className="btn light full" style={{ marginTop: 22 }} onClick={() => nav('/studio')}>Customise in 3D</button>
          </div>
        </div>

        <div className="bento-item">
          <div className="pad"><h3>Dashboard Quick Links</h3></div>
          <div style={{ padding: '8px 32px 32px' }}>
            <button className="qlink" onClick={() => nav('/gallery')}>
              <span className="ico">{I.photos}</span>
              <div><b>My Photo Gallery</b><small>{photos.length || 78} photos linked</small></div>
              <span className="chev">{I.chev}</span>
            </button>
            <button className="qlink" onClick={() => nav('/designs')}>
              <span className="ico">{I.designs}</span>
              <div><b>Grades &amp; Designs</b><small>Colour grades and framed looks</small></div>
              <span className="chev">{I.chev}</span>
            </button>
            <button className="qlink" onClick={() => nav('/studio')}>
              <span className="ico">{I.frame}</span>
              <div><b>Framing Mockups</b><small>Real-time 3D texture mapping</small></div>
              <span className="chev">{I.chev}</span>
            </button>
            <button className="qlink" onClick={() => nav('/profile')}>
              <span className="ico">{I.profile}</span>
              <div><b>My Profile</b><small>Identifier {ident}</small></div>
              <span className="chev">{I.chev}</span>
            </button>
            <button className="btn full" style={{ marginTop: 18 }} onClick={() => cart.setOpen(true)}>Add to Cart</button>
          </div>
        </div>
      </div>

      <section style={{ marginTop: 44, marginBottom: 8 }}>
        <div className="rail-head">
          <div>
            <div className="dash-kicker">EVENTS</div>
            <h3 className="label-md" style={{ marginTop: 6 }}>Ceremony coverage</h3>
          </div>
          <button className="link-btn" onClick={() => nav('/events')}>View all events ›</button>
        </div>
        <div className="rail">
          {(events.length ? events : [{ id: 'evt-grad-2026', name: 'UKZN Durban Graduation Day' }]).map((ev, i) => (
            <article key={ev.id || i} className={`tile ${i === 0 ? 'wide' : ''}`} onClick={() => nav('/gallery')}>
              <img src={EVENT_COVERS[i % EVENT_COVERS.length]} alt="" />
              <div className="tile-body">
                <h4>UKZN Durban Graduation Day</h4>
                <p>Saturday, 12 Sep 2026 · {ev.campus || 'Howard College'}</p>
                <span className="btn light sm tile-cta">View gallery</span>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}

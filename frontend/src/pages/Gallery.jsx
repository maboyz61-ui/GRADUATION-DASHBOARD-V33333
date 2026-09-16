import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api'
import { useCart } from '../cart.jsx'

export default function Gallery() {
  const [photos, setPhotos] = useState([])
  const [selected, setSelected] = useState([])
  const [active, setActive] = useState(null)
  const [type, setType] = useState('')
  const [loc, setLoc] = useState('')
  const [page, setPage] = useState(1)
  const nav = useNavigate()
  const cart = useCart()

  useEffect(() => {
    api.photos().then((d) => setPhotos(d.photos || [])).catch(() => {})
  }, [])

  const filtered = useMemo(() => {
    return photos.filter((p) => (!type || p.type === type) && (!loc || p.location === loc))
  }, [photos, type, loc])

  const per = 24
  const pages = Math.max(1, Math.ceil((filtered.length || 78) / per) || 25)
  const shown = filtered.slice(0, per)

  function toggle(id) {
    setSelected((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]))
  }

  function openAt(p) {
    setActive(p)
  }

  const idx = photos.findIndex((p) => p.id === active?.id)

  return (
    <div>
      <div className="card-head" style={{ marginBottom: 12 }}>
        <div>
          <h2 style={{ fontSize: 28 }}>My Complete Photo Gallery: UKZN</h2>
          <p style={{ color: 'var(--muted)' }}>Event: Saturday, 12 Sep 2026</p>
        </div>
        <div className="pills">
          <button className="pill" onClick={() => selected.length && sessionStorage.setItem('studioPhotos', JSON.stringify(selected))}>Select</button>
          <button className="pill">Sort</button>
          <button className="pill">Filter</button>
        </div>
      </div>

      <div className="gallery-wrap">
        <div>
          <div className="grid photos">
            {shown.map((p) => (
              <article key={p.id} className="card photo-card" onClick={() => openAt(p)}>
                <img src={p.thumbUrl} alt={p.title} />
                <div className="hover-acts">
                  <button className="btn sm navy" onClick={(e) => { e.stopPropagation(); toggle(p.id) }}>{selected.includes(p.id) ? 'Selected' : 'Select'}</button>
                  <button className="btn sm ghost" onClick={(e) => { e.stopPropagation(); nav('/studio') }}>Share</button>
                </div>
              </article>
            ))}
          </div>
          <div className="pager">
            <button className="btn navy sm" onClick={() => selected.length && nav('/studio')}>Select</button>
            <div className="row">
              <button className="btn ghost sm" onClick={() => setPage((n) => Math.max(1, n - 1))}>{'<'}</button>
              <span>{page} of 25 pages</span>
              <button className="btn ghost sm" onClick={() => setPage((n) => n + 1)}>Next {'>'}</button>
            </div>
            <span>Total Photos: 78</span>
          </div>
        </div>
        <aside className="card filter-box">
          <h4>Advanced Filters</h4>
          <p style={{ color: 'var(--muted)', fontSize: 12, marginBottom: 6 }}>Portrait Type</p>
          {['Individual', 'Group', 'Candid'].map((t) => (
            <button key={t} className={type === t ? 'on' : ''} onClick={() => setType(type === t ? '' : t)}>{t}</button>
          ))}
          <p style={{ color: 'var(--muted)', fontSize: 12, margin: '12px 0 6px' }}>Location</p>
          {['Stage', 'Robing', 'Campus'].map((t) => (
            <button key={t} className={loc === t ? 'on' : ''} onClick={() => setLoc(loc === t ? '' : t)}>{t}</button>
          ))}
          <p style={{ color: 'var(--muted)', fontSize: 12, margin: '12px 0 6px' }}>Time Block</p>
        </aside>
      </div>

      {active && (
        <div className="modal" onClick={() => setActive(null)}>
          <div className="viewer-card" onClick={(e) => e.stopPropagation()}>
            <div className="viewer-main">
              <img src={active.url} alt={active.title} />
              <button className="nav-round l" onClick={() => setActive(photos[Math.max(0, idx - 1)])}>{'<'}</button>
              <button className="nav-round r" onClick={() => setActive(photos[Math.min(photos.length - 1, idx + 1)])}>{'>'}</button>
              <div className="thumbs">
                {photos.slice(0, 8).map((p) => (
                  <img key={p.id} className={p.id === active.id ? 'on' : ''} src={p.thumbUrl} alt="" onClick={() => setActive(p)} />
                ))}
              </div>
            </div>
            <div className="viewer-side">
              <h4>Quick Actions</h4>
              <p>Event: UKZN Graduation Day</p>
              <p>Date: Saturday, 12 Sep 2026</p>
              <button className="btn full" onClick={() => { cart.add({ photoId: active.id, title: active.title, thumb: active.thumbUrl, price: active.price, frame: 'Print' }); setActive(null) }}>Add to Cart</button>
              <button className="btn ghost2 full" onClick={() => setActive(null)}>View Full Gallery</button>
              <button className="btn ghost2 full" onClick={() => setActive(null)}>Exit Viewer</button>
            </div>
            <div className="viewer-foot">
              <span>Photo {idx + 1} of {photos.length || 10}</span>
              <div className="row">
                <button className="btn ghost sm" onClick={() => window.open(active.url, '_blank')}>Download</button>
                <button className="btn ghost sm">Share</button>
                <button className="btn sm" onClick={() => { sessionStorage.setItem('studioPhotos', JSON.stringify([active.id])); nav('/studio') }}>Add to 3D Frame Mockup</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

import { Canvas } from '@react-three/fiber'
import { OrbitControls, Environment } from '@react-three/drei'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api'
import { useCart } from '../cart.jsx'
import { HEADSHOT } from '../media.js'
import * as THREE from 'three'

function FrameMesh({ texture, mat, photoUrl }) {
  const photoTex = useMemo(() => {
    const loader = new THREE.TextureLoader()
    loader.setCrossOrigin('anonymous')
    const t = loader.load(photoUrl)
    t.colorSpace = THREE.SRGBColorSpace
    return t
  }, [photoUrl])

  const wood = new THREE.Color(texture?.hex || '#6b2b1f')
  const matCol = new THREE.Color(mat?.hex || '#f4efe3')

  return (
    <group>
      <mesh>
        <boxGeometry args={[2.4, 3.05, 0.18]} />
        <meshStandardMaterial color={wood} roughness={0.45} metalness={0.12} />
      </mesh>
      <mesh position={[0, 0, 0.1]}>
        <planeGeometry args={[1.95, 2.55]} />
        <meshStandardMaterial color={matCol} />
      </mesh>
      <mesh position={[0, 0.02, 0.11]}>
        <planeGeometry args={[1.62, 2.15]} />
        <meshStandardMaterial map={photoTex} />
      </mesh>
    </group>
  )
}

export default function Studio() {
  const [photos, setPhotos] = useState([])
  const [catalog, setCatalog] = useState({ textures: [], mats: [], overlays: [], sizes: [] })
  const [photoId, setPhotoId] = useState('')
  const [textureId, setTextureId] = useState('oak')
  const [matId, setMatId] = useState('ivory')
  const [overlayId, setOverlayId] = useState('ukzn-crest')
  const [sizeId, setSizeId] = useState('8x10')
  const [tab, setTab] = useState('details')
  const [msg, setMsg] = useState('')
  const cart = useCart()
  const nav = useNavigate()

  useEffect(() => {
    api.photos().then((d) => {
      const list = d.photos || []
      setPhotos(list)
      const stored = JSON.parse(sessionStorage.getItem('studioPhotos') || '[]')
      setPhotoId(stored[0] || list[0]?.id || '')
    }).catch(() => {})
    api.frames().then(setCatalog).catch(() => {})
  }, [])

  const photo = photos.find((p) => p.id === photoId) || photos[0]
  const texture = catalog.textures.find((t) => t.id === textureId)
  const mat = catalog.mats.find((t) => t.id === matId)
  const overlay = catalog.overlays.find((t) => t.id === overlayId)
  const size = catalog.sizes.find((t) => t.id === sizeId)
  const framePrice = size?.price || 1499
  const printPrice = 299
  const total = framePrice + printPrice

  function addToCart() {
    if (!photo) return
    cart.add({
      photoId: photo.id,
      title: photo.title,
      thumb: photo.thumbUrl || HEADSHOT,
      frame: `1x ${size?.name || '8x10'} Premium ${texture?.name || 'Oak'} Frame @ R${framePrice}.00`,
      print: `1x Print (Matte finish) @ R${printPrice}.00`,
      texture: textureId,
      mat: matId,
      overlay: overlayId,
      size: sizeId,
      price: total
    })
    setMsg('Added to cart')
  }

  const idx = photos.findIndex((p) => p.id === photo?.id)

  return (
    <div>
      <div className="dash-layout">
        <div className="card" style={{ padding: 12 }}>
          <div className="canvas-3d" style={{ position: 'relative' }}>
            {photo && (
              <Canvas camera={{ position: [0, 0, 4.2], fov: 42 }}>
                <ambientLight intensity={0.7} />
                <directionalLight position={[3, 4, 5]} intensity={1.4} />
                <FrameMesh texture={texture} mat={mat} photoUrl={photo.url} />
                <OrbitControls enablePan={false} />
                <Environment preset="city" />
              </Canvas>
            )}
            <button className="nav-round l" style={{ background: '#fff' }} onClick={() => idx > 0 && setPhotoId(photos[idx - 1].id)}>{'<'}</button>
            <button className="nav-round r" style={{ background: '#fff' }} onClick={() => idx < photos.length - 1 && setPhotoId(photos[idx + 1].id)}>{'>'}</button>
          </div>
        </div>

        <div className="card">
          <h3 style={{ marginBottom: 12 }}>Summary & Add to Cart</h3>
          <div className="row" style={{ alignItems: 'flex-start', marginBottom: 12 }}>
            <img src={photo?.thumbUrl || HEADSHOT} alt="" style={{ width: 54, height: 54, objectFit: 'cover', borderRadius: 8, border: '4px solid #6b3a1f' }} />
            <div>
              <b>UKZN Premium {texture?.name || 'Oak'} Frame</b>
              <p style={{ color: 'var(--ok)', fontSize: 12 }}>{photo?.identifier || 'UKZN-2026-X898'}</p>
            </div>
          </div>
          <p style={{ fontSize: 13, marginBottom: 10 }}>{photo?.title || 'Professional Headshot'} · {size?.name || '8x10'}</p>
          <div className="sum-row"><span>Frame:</span><b>R{framePrice}.00</b></div>
          <div className="sum-row"><span>Print:</span><b>R{printPrice}.00</b></div>
          <div className="sum-row total"><span>Total:</span><b>R{total}.00</b></div>
          <button className="btn navy full" style={{ marginTop: 10 }} onClick={addToCart}>Add to Cart</button>
          <div className="row" style={{ marginTop: 10, justifyContent: 'center' }}>
            <button className="btn ghost sm" onClick={() => nav('/designs')}>Save to My Designs</button>
            <button className="btn ghost sm">View 2D Proof</button>
          </div>
          {msg && <p style={{ color: 'var(--ok)', marginTop: 10 }}>{msg}</p>}
        </div>
      </div>

      <div className="card" style={{ marginTop: 16, display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 6 }}>Material</div>
          <div className="swatches">
            {catalog.textures.slice(0, 3).map((t) => (
              <div key={t.id} style={{ textAlign: 'center' }}>
                <button className={`swatch ${t.id === textureId ? 'on' : ''}`} style={{ background: t.hex }} onClick={() => setTextureId(t.id)} />
                <div style={{ fontSize: 11, color: 'var(--muted)' }}>{t.name}</div>
              </div>
            ))}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 6 }}>Size</div>
          <div className="swatches">
            {catalog.sizes.slice(0, 3).map((s) => (
              <button key={s.id} className={`size-chip ${s.id === sizeId ? 'on' : ''}`} onClick={() => setSizeId(s.id)}>{s.name}</button>
            ))}
          </div>
        </div>
        <label className="field" style={{ minWidth: 180 }}>
          Overlay
          <select value={overlayId} onChange={(e) => setOverlayId(e.target.value)}>
            {catalog.overlays.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
          </select>
        </label>
        <label className="field" style={{ minWidth: 180 }}>
          Mat
          <select value={matId} onChange={(e) => setMatId(e.target.value)}>
            {catalog.mats.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </label>
      </div>

      <div className="home-split" style={{ marginTop: 16 }}>
        <div className="card">
          <div className="card-head">
            <h3>My Day Photos</h3>
            <div className="pills"><button className="pill">Sort</button><button className="pill">Filter</button></div>
          </div>
          <div className="day-grid">
            {photos.slice(0, 8).map((p, i) => (
              <img key={p.id} className={i === 2 ? 'hero-shot' : ''} src={p.thumbUrl} alt="" onClick={() => setPhotoId(p.id)} />
            ))}
          </div>
        </div>
        <div className="card">
          <div className="tabs">
            {[['details', 'Details'], ['pricing', 'Pricing & Shipping'], ['reviews', 'Customer Reviews']].map(([id, label]) => (
              <button key={id} className={tab === id ? 'on' : ''} onClick={() => setTab(id)}>{label}</button>
            ))}
          </div>
          {tab === 'details' && <p style={{ color: 'var(--muted)' }}>Drag the 3D canvas to orbit. Real-time wood texture mapping with ivory mat.</p>}
          {tab === 'pricing' && <p>Frame R{framePrice} · Print R{printPrice} · Shipping Free · PayFast checkout.</p>}
          {tab === 'reviews' && <p>Premium oak frames rated 4.8/5 by UKZN graduates.</p>}
        </div>
      </div>
    </div>
  )
}

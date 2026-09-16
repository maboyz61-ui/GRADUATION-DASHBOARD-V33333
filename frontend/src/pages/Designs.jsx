import { useNavigate } from 'react-router-dom'
import { GRADES } from '../media.js'

export default function Designs() {
  const nav = useNavigate()
  return (
    <div>
      <div className="section-head">
        <div>
          <h3>Grades & Designs</h3>
          <p>Colour grades, overlays and frame looks — then open Framing Mockups.</p>
        </div>
        <button className="btn navy" onClick={() => nav('/studio')}>Open framing mockups</button>
      </div>
      <div className="grid photos">
        {GRADES.map((g) => (
          <article key={g.id} className="card photo-card" onClick={() => nav('/studio')}>
            <img src={g.img} alt={g.name} style={g.framed ? { border: '12px solid #6b3a1f', aspectRatio: '1' } : undefined} />
            <div className="meta"><h4>{g.name}</h4><p>Apply in 3D studio</p></div>
          </article>
        ))}
      </div>
    </div>
  )
}

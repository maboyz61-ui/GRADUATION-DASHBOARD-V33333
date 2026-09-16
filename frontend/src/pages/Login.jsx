import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, setSession } from '../api'
import { EVENT_COVERS } from '../media.js'

export default function Login() {
  const [digits, setDigits] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const nav = useNavigate()

  async function submit(code) {
    setBusy(true)
    setError('')
    try {
      const data = await api.login(undefined, undefined, code)
      setSession(data.token, data.user)
      nav(data.user.role === 'admin' ? '/admin' : '/')
    } catch (err) {
      setError(err.message)
      setDigits('')
    } finally {
      setBusy(false)
    }
  }

  function press(n) {
    if (busy) return
    const next = (digits + n).slice(0, 6)
    setDigits(next)
    if (next.length === 6) submit(next)
  }

  return (
    <div className="login-shell">
      <div className="login-bg">
        {[...EVENT_COVERS, ...EVENT_COVERS].slice(0, 9).map((src, i) => <img key={i} src={src} alt="" />)}
      </div>

      <div className="pin-modal">
        <div className="pin-card">
          <button className="pin-x" onClick={() => nav('/')}>×</button>
          <div className="pin-brand">
            <span className="crest-sm" style={{ width: 30, height: 30 }}>UK</span>
            <div style={{ textAlign: 'left' }}><b>UKZN</b><span>Photo Portal</span></div>
          </div>
          <h3>Enter Your 6-Digit Code</h3>
          <p>For your security, please enter the code sent to your registered mobile number.</p>
          <div className="pin-slots">
            {Array.from({ length: 6 }).map((_, i) => <span key={i}>{digits[i] || ''}</span>)}
          </div>
          <div className="pad">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((n) => (
              <button key={n} type="button" onClick={() => press(n)}>{n}</button>
            ))}
            <button type="button" onClick={() => setDigits((d) => d.slice(0, -1))}>⌫</button>
            <button type="button" onClick={() => press('0')}>0</button>
            <button type="button" className="ok" onClick={() => digits.length === 6 && submit(digits)}>✓</button>
          </div>
          {error && <p style={{ color: '#ff6961', marginTop: 12 }}>{error}</p>}
          <p style={{ marginTop: 14, fontSize: 12 }}>Demo student 123456 · admin 999999 · code expires in 02:45</p>
        </div>
      </div>
    </div>
  )
}

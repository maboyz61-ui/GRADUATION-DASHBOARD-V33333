import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, getUser } from '../api'
import { AVATAR } from '../media.js'

export default function Profile() {
  const user = getUser()
  const [tab, setTab] = useState('personal')
  const [orders, setOrders] = useState([])
  const [photos, setPhotos] = useState([])

  useEffect(() => {
    api.orders().then((d) => setOrders(d.orders || [])).catch(() => {})
    api.photos().then((d) => setPhotos(d.photos || [])).catch(() => {})
  }, [])

  const ident = user?.identifier || 'UKZN-2026-X898'
  const shortId = ident.split('-').pop()

  return (
    <div className="dash-layout">
      <div>
        <h3 style={{ fontSize: 26, marginBottom: 14 }}>My Profile & Account Settings</h3>
        <div className="card profile-hero" style={{ marginBottom: 16 }}>
          <img src={AVATAR} alt="" />
          <div style={{ flex: 1 }}>
            <p>Name: <b>{user?.name || 'John Student'}</b></p>
            <p>Student ID: {shortId}</p>
            <p>Email: {user?.email}</p>
            <p>Account Status: <span style={{ color: 'var(--ok)', fontWeight: 700 }}>Verified</span></p>
          </div>
          <button className="btn navy">Edit Profile</button>
        </div>

        <div className="tabs">
          {[['personal', 'Personal Details'], ['academic', 'Academic History'], ['security', 'Security & Login'], ['notify', 'Notification Preferences']].map(([id, label]) => (
            <button key={id} className={tab === id ? 'on' : ''} onClick={() => setTab(id)}>{label}</button>
          ))}
        </div>

        {tab === 'personal' && (
          <div className="card">
            <div className="form-2">
              <label className="field">Preferred Name<input defaultValue={user?.name?.split(' ')[0] || ''} /></label>
              <label className="field">Date of Birth<input defaultValue="23 Juli 2026" /></label>
              <label className="field">Phone Number<input placeholder="Phone Number" /></label>
              <label className="field">Address<textarea rows={3} defaultValue="UKZN Campus Address" /></label>
            </div>
          </div>
        )}
        {tab === 'academic' && (
          <div className="card">
            <p>{user?.degree} · {user?.faculty} · {user?.campus}</p>
          </div>
        )}
        {tab === 'security' && (
          <div className="card">
            <p>OIDC SSO via UKZN. Identifier {ident}</p>
          </div>
        )}
        {tab === 'notify' && (
          <div className="card">
            <label className="field">Email notifications
              <select defaultValue="on"><option value="on">On</option><option value="off">Off</option></select>
            </label>
          </div>
        )}

        <div className="card" style={{ marginTop: 16 }}>
          <h3 style={{ marginBottom: 10 }}>Address Book</h3>
          <p style={{ color: 'var(--muted)', fontSize: 13 }}>Saved</p>
          <p style={{ marginTop: 8 }}><b>UKZN Campus Address</b><br />1224 5 8me, UKZN Campus Address</p>
          <button className="btn ghost sm" style={{ marginTop: 10 }}>+ Saved</button>
        </div>
      </div>

      <aside className="dash-side">
        <div className="card">
          <h3 style={{ marginBottom: 10 }}>Account Overview</h3>
          <div className="side-list">
            <div><span>Total Events Attended</span><b>4</b></div>
            <div><span>Photos in Gallery</span><b>{photos.length || 78}</b></div>
            <div><span>Purchased Prints</span><b>4</b></div>
            <div><span>Pending Orders</span><b>{orders.length || 1}</b></div>
          </div>
        </div>
        <div className="card">
          <h3 style={{ marginBottom: 10 }}>Change Password</h3>
          <button className="btn ghost2 full">Change Password Record (Saved)</button>
        </div>
        <div className="card">
          <h3 style={{ marginBottom: 10 }}>Quick Links</h3>
          <Link className="qlink" to="/designs"><b>View Full Academic Record</b><span className="chev">{'>'}</span></Link>
          <Link className="qlink" to="/purchases"><b>Manage Payment Methods</b><span className="chev">{'>'}</span></Link>
          <Link className="qlink" to="/help"><b>Contact Support</b><span className="chev">{'>'}</span></Link>
        </div>
      </aside>
    </div>
  )
}

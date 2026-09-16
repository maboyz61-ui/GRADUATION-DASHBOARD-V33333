import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { clearSession, getUser } from '../api'
import { I } from '../icons.jsx'
import { useCart } from '../cart.jsx'
import { AVATAR } from '../media.js'
import CartModal from './CartModal.jsx'

const NAV = [
  ['/', 'Home'],
  ['/gallery', 'Photos'],
  ['/events', 'Events'],
  ['/designs', 'Grades & Designs'],
  ['/studio', 'Framing Mockups'],
  ['/profile', 'Profile'],
  ['/settings', 'Settings'],
  ['/help', 'Help & Support']
]

export default function Layout() {
  const user = getUser()
  const nav = useNavigate()
  const isAdmin = user?.role === 'admin'
  const cart = useCart()
  const ident = user?.identifier || 'ADMIN-SSO'
  const links = isAdmin ? [...NAV.slice(0, 6), ['/admin', 'Admin'], ...NAV.slice(6)] : NAV

  return (
    <div className="page">
      <header className="nav-glass">
        <div className="nav-inner">
          <button className="nav-logo" onClick={() => nav('/')} aria-label="UKZN Photo Portal">
            <span className="crest-sm">UK</span>
          </button>
          <nav className="nav-links">
            {links.map(([to, label]) => (
              <NavLink key={to} to={to} end={to === '/'}>{label}</NavLink>
            ))}
          </nav>
          <div className="nav-utils">
            {cart.count > 0 && <button className="nav-cart-chip" onClick={() => cart.setOpen(true)}>{cart.count} item{cart.count > 1 ? 's' : ''}</button>}
            <button className="nav-icon" aria-label="Notifications">{I.bell}<span className="dot" /></button>
            <button className="nav-icon" aria-label="Cart" onClick={() => cart.setOpen(true)}>{I.bag}</button>
            <button className="nav-avatar" onClick={() => nav('/profile')} aria-label="Account"><img className="avatar" style={{ width: 24, height: 24, borderRadius: '50%' }} src={AVATAR} alt="" /></button>
            <button className="nav-signout" onClick={() => { clearSession(); nav('/login') }}>Sign out</button>
          </div>
        </div>
      </header>

      <div className="announce">
        <button onClick={() => nav('/profile')}>Your UKZN identifier <b>{ident}</b> is linked to all ceremony media · Manage</button>
      </div>

      <div className="container">
        <div className="context-bar">
          <div>
            <div className="dash-kicker">MY DASHBOARD</div>
            <div className="context-name">{isAdmin ? 'Admin Portal' : 'UKZN Photo Portal'}</div>
            <div className="ident-sub">{ident}</div>
          </div>
          <div className="stat-band">
            <div className="stat"><span>Ceremony Date</span><b>May 12</b></div>
            <div className="stat"><span>Photos Total</span><b>78</b></div>
            <div className="stat"><span>Purchased</span><b>4</b></div>
            <div className="stat"><span>Wallet</span><b>R2500</b></div>
          </div>
        </div>
      </div>

      <div className="container" style={{ paddingBottom: 40 }}>
        <Outlet />
      </div>

      <footer className="site-footer">
        <div className="foot-inner">
          <div className="foot-cols">
            <div className="foot-col">
              <h5>Photos</h5>
              <NavLink to="/gallery">My gallery</NavLink>
              <NavLink to="/events">Events</NavLink>
              <NavLink to="/designs">Grades & Designs</NavLink>
              <NavLink to="/studio">Framing Mockups</NavLink>
            </div>
            <div className="foot-col">
              <h5>Account</h5>
              <NavLink to="/profile">Profile</NavLink>
              <NavLink to="/purchases">Orders & Payments</NavLink>
              <NavLink to="/settings">Settings</NavLink>
              <NavLink to="/login">Access code login</NavLink>
            </div>
            <div className="foot-col">
              <h5>Support</h5>
              <NavLink to="/help">Help & Support</NavLink>
              <a href="mailto:photo-portal@ukzn.ac.za">photo-portal@ukzn.ac.za</a>
              <a href="https://www.ukzn.ac.za" target="_blank" rel="noreferrer">ukzn.ac.za</a>
            </div>
            <div className="foot-col">
              <h5>Legal</h5>
              <a>Terms of purchase</a>
              <a>Privacy policy</a>
              <a>PayFast secure payments</a>
              <a>OIDC single sign-on</a>
            </div>
          </div>
          <p className="foot-legal">
            Ceremony photographs and framing mockups are provided by UKZN Communications for personal use. Orders are
            processed via PayFast and linked to your dashboard identifier {ident}. Identifier UKZN-2026-X898.
          </p>
          <div className="foot-bottom">
            <span>Copyright © 2026 University of KwaZulu-Natal. All rights reserved.</span>
            <span><a>Privacy</a> · <a>Terms</a> · <a>Cookies</a></span>
          </div>
        </div>
      </footer>

      {cart.open && <CartModal />}
    </div>
  )
}

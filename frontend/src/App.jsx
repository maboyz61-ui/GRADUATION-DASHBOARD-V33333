import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { getUser } from './api'
import Login from './pages/Login.jsx'
import Layout from './components/Layout.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Gallery from './pages/Gallery.jsx'
import Studio from './pages/Studio.jsx'
import Orders from './pages/Orders.jsx'
import Admin from './pages/Admin.jsx'
import Events from './pages/Events.jsx'
import Designs from './pages/Designs.jsx'
import Profile from './pages/Profile.jsx'
import Settings from './pages/Settings.jsx'
import Help from './pages/Help.jsx'

function RequireAuth({ children, admin }) {
  const user = getUser()
  const loc = useLocation()
  if (!user) return <Navigate to="/login" state={{ from: loc }} replace />
  if (admin && user.role !== 'admin') return <Navigate to="/" replace />
  return children
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <RequireAuth>
            <Layout />
          </RequireAuth>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="gallery" element={<Gallery />} />
        <Route path="events" element={<Events />} />
        <Route path="designs" element={<Designs />} />
        <Route path="studio" element={<Studio />} />
        <Route path="purchases" element={<Orders />} />
        <Route path="profile" element={<Profile />} />
        <Route path="settings" element={<Settings />} />
        <Route path="help" element={<Help />} />
        <Route
          path="admin"
          element={
            <RequireAuth admin>
              <Admin />
            </RequireAuth>
          }
        />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

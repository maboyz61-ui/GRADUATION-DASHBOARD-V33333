const TOKEN_KEY = 'ukzn_token'
const USER_KEY = 'ukzn_user'

const API_BASE = (import.meta.env.VITE_API_BASE || '').replace(/\/$/, '')

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function getUser() {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY) || 'null')
  } catch {
    return null
  }
}

export function setSession(token, user) {
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}

let onUnauthorized = null
export function setUnauthorizedHandler(fn) {
  onUnauthorized = fn
}

async function request(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) }
  const token = getToken()
  if (token) headers.Authorization = `Bearer ${token}`

  let res
  try {
    res = await fetch(`${API_BASE}${path}`, { ...options, headers })
  } catch {
    const err = new Error('Network unavailable. Check your connection.')
    err.code = 'network_error'
    throw err
  }

  const data = await res.json().catch(() => ({}))
  if (res.status === 401 && getToken()) {
    clearSession()
    if (onUnauthorized) onUnauthorized()
  }
  if (!res.ok) {
    const err = new Error(data.error || `Request failed (${res.status})`)
    err.code = data.code
    err.status = res.status
    err.details = data.details
    throw err
  }
  return data
}

export const api = {
  login: (email, role, code) => request('/api/v1/auth/login', { method: 'POST', body: JSON.stringify({ email, role, code }) }),
  requestCode: (email) => request('/api/v1/auth/request-code', { method: 'POST', body: JSON.stringify({ email }) }),
  me: () => request('/api/v1/auth/me'),
  health: () => request('/api/health'),
  photos: (params = {}) => {
    const q = new URLSearchParams(params).toString()
    return request(`/api/v1/photos${q ? `?${q}` : ''}`)
  },
  photo: (id) => request(`/api/v1/photos/${id}`),
  patchPhoto: (id, body) => request(`/api/v1/photos/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  frames: () => request('/api/v1/frames'),
  publicEvents: () => request('/api/v1/events'),
  orders: () => request('/api/v1/user/orders'),
  order: (id) => request(`/api/v1/orders/${id}`),
  createOrder: (body) => request('/api/v1/user/orders', { method: 'POST', body: JSON.stringify(body) }),
  identifier: (code) => request(`/api/v1/identifier/${code}`),
  assignIdentifier: (studentId) => request('/api/v1/identifier', { method: 'POST', body: JSON.stringify({ studentId }) }),
  mediaUrl: (photoId, ttl) => request(`/api/v1/media/${photoId}/url${ttl ? `?ttl=${ttl}` : ''}`),
  users: () => request('/api/v1/admin/users'),
  patchUser: (id, body) => request(`/api/v1/admin/users/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  events: () => request('/api/v1/admin/events'),
  createEvent: (body) => request('/api/v1/admin/events', { method: 'POST', body: JSON.stringify(body) }),
  patchEvent: (id, body) => request(`/api/v1/admin/events/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  moderation: () => request('/api/v1/admin/moderation'),
  reports: () => request('/api/v1/admin/reports'),
  ams: () => request('/api/v1/admin/ams')
}

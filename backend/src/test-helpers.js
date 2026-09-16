// Environment must be set before config.js is evaluated, so this module uses
// dynamic imports instead of static ones.

export async function bootstrapTestApp(overrides = {}) {
  process.env.NODE_ENV = 'test'
  process.env.DATABASE_DRIVER = 'sqlite'
  process.env.DATABASE_URL = ':memory:'
  process.env.JWT_SECRET = 'test-secret-test-secret-test-secret'
  process.env.LOG_LEVEL = 'error'
  process.env.PAYFAST_PASSPHRASE = 'test-passphrase'
  Object.assign(process.env, overrides)

  const [{ createApp }, { migrate }, { seed }] = await Promise.all([
    import('./app.js'),
    import('./db/migrate.js'),
    import('./db/seed.js')
  ])
  const app = createApp()
  await migrate()
  await seed({ force: true })
  return app
}

export async function teardownTestApp() {
  const { closeDb } = await import('./db/index.js')
  await closeDb()
}

// Tiny supertest replacement built on node:http so tests stay dependency-free.
export async function request(app, method, path, { token, body, headers = {} } = {}) {
  const { createServer } = await import('http')
  const server = createServer(app)
  await new Promise((resolve) => server.listen(0, resolve))
  const { port } = server.address()

  const res = await fetch(`http://127.0.0.1:${port}${path}`, {
    method,
    headers: {
      'content-type': 'application/json',
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...headers
    },
    body: body === undefined ? undefined : JSON.stringify(body)
  })
  const text = await res.text()
  let json
  try {
    json = JSON.parse(text)
  } catch {
    json = text
  }
  await new Promise((resolve) => server.close(resolve))
  return { status: res.status, body: json }
}

export async function requestForm(app, path, fields) {
  const { createServer } = await import('http')
  const server = createServer(app)
  await new Promise((resolve) => server.listen(0, resolve))
  const { port } = server.address()
  const res = await fetch(`http://127.0.0.1:${port}${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(fields).toString()
  })
  const text = await res.text()
  let json
  try {
    json = JSON.parse(text)
  } catch {
    json = text
  }
  await new Promise((resolve) => server.close(resolve))
  return { status: res.status, body: json }
}

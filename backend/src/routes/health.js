import { Router } from 'express'
import { getDb } from '../db/index.js'
import config from '../config.js'

const router = Router()

router.get('/health', async (_req, res) => {
  const checks = { api: 'ok' }
  try {
    const db = await getDb()
    await db.query('SELECT 1 AS ok')
    checks.database = db.driver
  } catch {
    checks.database = 'error'
  }
  const ok = Object.values(checks).every((v) => v !== 'error')
  res.status(ok ? 200 : 503).json({
    ok,
    service: 'ukzn-photo-platform',
    version: '3.1.0',
    env: config.nodeEnv,
    checks
  })
})

export default router

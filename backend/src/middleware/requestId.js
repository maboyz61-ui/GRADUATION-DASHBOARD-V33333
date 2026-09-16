import { randomUUID } from 'crypto'
import logger from '../lib/logger.js'

export function requestId(req, res, next) {
  req.id = req.headers['x-request-id'] || randomUUID()
  res.setHeader('x-request-id', req.id)
  const started = process.hrtime.bigint()
  res.on('finish', () => {
    const ms = Number(process.hrtime.bigint() - started) / 1e6
    logger.info('request', {
      id: req.id,
      method: req.method,
      path: req.originalUrl,
      status: res.statusCode,
      ms: Number(ms.toFixed(2))
    })
  })
  next()
}

import logger from '../lib/logger.js'
import { AppError } from '../lib/errors.js'

export function notFoundHandler(req, res) {
  res.status(404).json({ error: 'Route not found', code: 'route_not_found', path: req.originalUrl })
}

export function errorHandler(err, req, res, _next) {
  const isApp = err instanceof AppError
  const status = isApp ? err.status : 500
  if (status >= 500) {
    logger.error('unhandled error', { id: req.id, message: err.message, stack: err.stack })
  }
  res.status(status).json({
    error: isApp && err.expose ? err.message : 'Internal server error',
    code: isApp ? err.code : 'internal_error',
    ...(isApp && err.details ? { details: err.details } : {})
  })
}

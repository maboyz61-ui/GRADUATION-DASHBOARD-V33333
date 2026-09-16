import express from 'express'
import cors from 'cors'
import config from './config.js'
import logger from './lib/logger.js'
import { requestId } from './middleware/requestId.js'
import { errorHandler, notFoundHandler } from './middleware/error.js'

import authRoutes from './routes/auth.js'
import photoRoutes from './routes/photos.js'
import eventRoutes from './routes/events.js'
import frameRoutes from './routes/frames.js'
import orderRoutes from './routes/orders.js'
import paymentRoutes from './routes/payments.js'
import identifierRoutes from './routes/identifier.js'
import adminRoutes from './routes/admin.js'
import mediaRoutes from './routes/media.js'
import healthRoutes from './routes/health.js'

export function createApp() {
  const app = express()
  app.disable('x-powered-by')
  app.set('trust proxy', 1)

  app.use(cors({
    origin: config.corsOrigin === '*' ? true : config.corsOrigin.split(',').map((s) => s.trim()),
    credentials: true
  }))
  app.use(express.json({ limit: '10mb' }))
  app.use(express.urlencoded({ extended: false, limit: '1mb' }))
  app.use(requestId)

  if (config.storage.driver === 'local') {
    app.use(config.storage.publicPath, express.static(config.storage.localDir, { maxAge: '1h' }))
  }

  app.use('/api', healthRoutes)
  app.use('/api/v1/auth', authRoutes)
  app.use('/api/v1/photos', photoRoutes)
  app.use('/api/v1/events', eventRoutes)
  app.use('/api/v1/frames', frameRoutes)
  app.use('/api/v1/user/orders', orderRoutes)
  app.use('/api/v1/orders', orderRoutes)
  app.use('/api/v1/payments', paymentRoutes)
  app.use('/api/v1/identifier', identifierRoutes)
  app.use('/api/v1/admin', adminRoutes)
  app.use('/api/v1/media', mediaRoutes)

  app.use(notFoundHandler)
  app.use(errorHandler)

  return app
}

export { logger }

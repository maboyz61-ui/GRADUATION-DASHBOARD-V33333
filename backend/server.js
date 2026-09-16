import { validateConfig } from './src/config.js'
import { createApp } from './src/app.js'
import { migrate } from './src/db/migrate.js'
import { seed } from './src/db/seed.js'
import { getDb } from './src/db/index.js'
import logger from './src/lib/logger.js'

async function main() {
  const config = validateConfig()
  await getDb()
  await migrate()
  await seed()

  const app = createApp()
  const server = app.listen(config.port, () => {
    logger.info('api listening', { port: config.port, env: config.nodeEnv, db: config.database.driver, storage: config.storage.driver })
    if (!config.isProduction) {
      process.stdout.write(`UKZN Photo Platform API listening on ${config.port}\n`)
    }
  })

  const shutdown = (signal) => {
    logger.info('shutting down', { signal })
    server.close(() => process.exit(0))
  }
  process.on('SIGTERM', () => shutdown('SIGTERM'))
  process.on('SIGINT', () => shutdown('SIGINT'))
}

main().catch((err) => {
  logger.error('fatal startup error', { message: err.message, stack: err.stack })
  process.exit(1)
})

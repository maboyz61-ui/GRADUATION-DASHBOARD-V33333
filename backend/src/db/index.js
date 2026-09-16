import config from '../config.js'
import { createSqliteAdapter } from './sqlite.js'
import { createPostgresAdapter } from './postgres.js'
import logger from '../lib/logger.js'

let adapter = null
let ready = null

export async function getDb() {
  if (ready) return ready
  ready = (async () => {
    if (config.database.driver === 'postgres') {
      adapter = await createPostgresAdapter(config.database.url)
    } else {
      adapter = createSqliteAdapter(config.database.url)
    }
    logger.info('database connected', { driver: adapter.driver })
    return adapter
  })()
  return ready
}

export async function closeDb() {
  if (adapter) await adapter.close()
  adapter = null
  ready = null
}

import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { getDb } from './index.js'
import logger from '../lib/logger.js'

const here = dirname(fileURLToPath(import.meta.url))

export async function migrate() {
  const db = await getDb()
  const ddl = readFileSync(join(here, 'schema.sql'), 'utf8')
  const statements = ddl
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean)

  for (const statement of statements) {
    await db.exec(`${statement};`)
  }
  logger.info('schema applied', { statements: statements.length })
  return { statements: statements.length }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  migrate()
    .then(() => process.exit(0))
    .catch((err) => {
      logger.error('migration failed', { message: err.message })
      process.exit(1)
    })
}

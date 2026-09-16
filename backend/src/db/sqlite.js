import { DatabaseSync } from 'node:sqlite'
import { dirname } from 'path'
import { mkdirSync } from 'fs'

export function createSqliteAdapter(url) {
  if (url !== ':memory:') {
    mkdirSync(dirname(url), { recursive: true })
  }
  const db = new DatabaseSync(url)
  db.exec('PRAGMA journal_mode = WAL;')
  db.exec('PRAGMA foreign_keys = ON;')

  function normalize(sql) {
    // node:sqlite accepts named parameters; we standardize on positional "?"
    return sql
  }

  // node:sqlite cannot bind undefined; treat it as SQL NULL.
  function sanitize(params) {
    return params.map((p) => (p === undefined ? null : typeof p === 'boolean' ? (p ? 1 : 0) : p))
  }

  const adapter = {
    driver: 'sqlite',
    async query(sql, params = []) {
      const stmt = db.prepare(normalize(sql))
      return stmt.all(...sanitize(params))
    },
    async execute(sql, params = []) {
      const stmt = db.prepare(normalize(sql))
      const info = stmt.run(...sanitize(params))
      return { changes: info.changes, lastInsertRowid: info.lastInsertRowid }
    },
    async exec(sql) {
      db.exec(sql)
    },
    async transaction(fn) {
      db.exec('BEGIN')
      try {
        const result = await fn(adapter)
        db.exec('COMMIT')
        return result
      } catch (err) {
        db.exec('ROLLBACK')
        throw err
      }
    },
    async close() {
      db.close()
    }
  }
  return adapter
}

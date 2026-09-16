export async function createPostgresAdapter(url) {
  let pg
  try {
    pg = await import('pg')
  } catch {
    const err = new Error("DATABASE_DRIVER=postgres requires the 'pg' package. Run: npm install pg")
    err.name = 'ConfigError'
    throw err
  }

  const pool = new pg.default.Pool({ connectionString: url, max: 10 })

  function toPositional(sql) {
    let i = 0
    return sql.replace(/\?/g, () => `$${(i += 1)}`)
  }

  return {
    driver: 'postgres',
    async query(sql, params = []) {
      const res = await pool.query(toPositional(sql), params)
      return res.rows
    },
    async execute(sql, params = []) {
      const res = await pool.query(toPositional(sql), params)
      return { changes: res.rowCount, lastInsertRowid: null }
    },
    async exec(sql) {
      await pool.query(sql)
    },
    async transaction(fn) {
      const client = await pool.connect()
      try {
        await client.query('BEGIN')
        const scoped = {
          query: async (sql, params = []) => (await client.query(toPositional(sql), params)).rows,
          execute: async (sql, params = []) => {
            const res = await client.query(toPositional(sql), params)
            return { changes: res.rowCount }
          }
        }
        const result = await fn(scoped)
        await client.query('COMMIT')
        return result
      } catch (err) {
        await client.query('ROLLBACK')
        throw err
      } finally {
        client.release()
      }
    },
    async close() {
      await pool.end()
    }
  }
}

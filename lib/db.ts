import { Pool } from 'pg'

const {
  DATABASE_URL,
  DB_HOST = '127.0.0.1',
  DB_PORT = '5432',
  DB_DATABASE = 'top_trends',
  DB_USERNAME = 'postgres',
  DB_PASSWORD = '',
} = process.env

if (!DATABASE_URL && process.env.VERCEL) {
  throw new Error('DATABASE_URL is required on Vercel')
}

const pool = new Pool(
  DATABASE_URL
    ? {
        connectionString: DATABASE_URL,
        ssl: { rejectUnauthorized: false },
      }
    : {
        host: DB_HOST,
        port: Number(DB_PORT),
        database: DB_DATABASE,
        user: DB_USERNAME,
        password: DB_PASSWORD,
      }
)

export async function query<T = unknown>(sql: string, params: unknown[] = []) {
  const result = await pool.query(sql, params)
  return result.rows as T
}

let schemaReady = false

export async function ensureSchema() {
  if (schemaReady) return

  await pool.query(`
    CREATE TABLE IF NOT EXISTS trends (
      id BIGSERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      url VARCHAR(2048) NOT NULL,
      source VARCHAR(32) NOT NULL,
      volume VARCHAR(32),
      timestamp TIMESTAMP NOT NULL,
      country_code VARCHAR(10) NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `)
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_trends_country ON trends (country_code)`)
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_trends_source ON trends (source)`)
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_trends_timestamp ON trends (timestamp)`)

  schemaReady = true
}


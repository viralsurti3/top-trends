import mysql from 'mysql2/promise'

const {
  DB_CONNECTION = 'mysql',
  DB_HOST = '127.0.0.1',
  DB_PORT = '3306',
  DB_DATABASE = 'top_trends',
  DB_USERNAME = 'root',
  DB_PASSWORD = '',
} = process.env

if (DB_CONNECTION !== 'mysql') {
  throw new Error(`Unsupported DB_CONNECTION: ${DB_CONNECTION}`)
}

const pool = mysql.createPool({
  host: DB_HOST,
  port: Number(DB_PORT),
  database: DB_DATABASE,
  user: DB_USERNAME,
  password: DB_PASSWORD,
  connectionLimit: 5,
})

export async function query<T = unknown>(sql: string, params: unknown[] = []) {
  const [rows] = await pool.execute(sql, params)
  return rows as T
}

let schemaReady = false

export async function ensureSchema() {
  if (schemaReady) return

  const connection = await mysql.createConnection({
    host: DB_HOST,
    port: Number(DB_PORT),
    user: DB_USERNAME,
    password: DB_PASSWORD,
  })

  await connection.query(`CREATE DATABASE IF NOT EXISTS \`${DB_DATABASE}\``)
  await connection.query(`
    CREATE TABLE IF NOT EXISTS \`${DB_DATABASE}\`.trends (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      url VARCHAR(2048) NOT NULL,
      source VARCHAR(32) NOT NULL,
      volume VARCHAR(32) DEFAULT NULL,
      timestamp DATETIME NOT NULL,
      country_code VARCHAR(10) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_trends_country (country_code),
      INDEX idx_trends_source (source),
      INDEX idx_trends_timestamp (timestamp)
    )
  `)

  await connection.end()
  schemaReady = true
}


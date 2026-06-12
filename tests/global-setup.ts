import { Pool } from 'pg'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.test', override: true })

// Run once before the entire test suite.
// Establishes a DB connection early so the first integration test
// doesn't pay the cold-start penalty inside a hookTimeout window.
export async function setup() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL!, max: 1 })
  try {
    await pool.query('SELECT 1')
  } finally {
    await pool.end()
  }
}

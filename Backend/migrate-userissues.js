import pg from "pg";
const { Pool } = pg;
import dotenv from "dotenv";
dotenv.config();

const pool = new Pool({
  user: process.env.user,
  host: process.env.host,
  database: process.env.database,
  password: process.env.password,
  port: process.env.port
});

async function migrate() {
  const client = await pool.connect();
  try {
    await client.query(`
      ALTER TABLE UserIssues 
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    `);
    console.log('Migration completed: updated_at column added to UserIssues table');
  } catch (err) {
    console.error('Migration error:', err);
  } finally {
    client.release();
    pool.end();
  }
}

migrate();

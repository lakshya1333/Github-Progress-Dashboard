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

async function testQuery() {
  const client = await pool.connect();
  try {
    const result = await client.query(
      "SELECT name, created_at, updated_at FROM Repositories ORDER BY created_at DESC LIMIT 10"
    );
    console.log('Repositories ordered by created_at DESC:');
    result.rows.forEach((row, idx) => {
      console.log(`${idx + 1}. ${row.name} - Created: ${row.created_at}`);
    });
  } catch (err) {
    console.error('Error:', err);
  } finally {
    client.release();
    pool.end();
  }
}

testQuery();

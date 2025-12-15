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
      CREATE TABLE IF NOT EXISTS UserPullRequests (
        user_id INT PRIMARY KEY REFERENCES Users(user_id),
        total_prs INT NOT NULL,
        fetched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    await client.query(`
      CREATE OR REPLACE TRIGGER update_userpullrequests_timestamp
      BEFORE UPDATE ON UserPullRequests
      FOR EACH ROW EXECUTE FUNCTION update_timestamp();
    `);
    
    console.log('Migration completed: UserPullRequests table created with trigger');
  } catch (err) {
    console.error('Migration error:', err);
  } finally {
    client.release();
    pool.end();
  }
}

migrate();

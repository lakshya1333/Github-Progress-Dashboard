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

async function resetDatabase() {
  const client = await pool.connect();
  try {
    console.log('Dropping all tables...');
    
    // Drop all tables in reverse order of dependencies
    await client.query(`
      DROP TABLE IF EXISTS CodeChanges CASCADE;
      DROP TABLE IF EXISTS Contributors CASCADE;
      DROP TABLE IF EXISTS RepositoryLanguages CASCADE;
      DROP TABLE IF EXISTS UserPullRequests CASCADE;
      DROP TABLE IF EXISTS UserIssues CASCADE;
      DROP TABLE IF EXISTS PullRequestChanges CASCADE;
      DROP TABLE IF EXISTS PullRequests CASCADE;
      DROP TABLE IF EXISTS Milestone_Details CASCADE;
      DROP TABLE IF EXISTS Milestones CASCADE;
      DROP TABLE IF EXISTS Commits CASCADE;
      DROP TABLE IF EXISTS Repositories CASCADE;
      DROP TABLE IF EXISTS Follows CASCADE;
      DROP TABLE IF EXISTS Users CASCADE;
      DROP FUNCTION IF EXISTS update_timestamp() CASCADE;
      DROP FUNCTION IF EXISTS update_contributor_stats() CASCADE;
      DROP FUNCTION IF EXISTS get_user_stats(INT) CASCADE;
      DROP FUNCTION IF EXISTS get_repo_stats(INT) CASCADE;
    `);
    
    console.log('All tables dropped successfully!');
    console.log('Database is now empty and ready for fresh setup.');
    
  } catch (err) {
    console.error('Error resetting database:', err);
  } finally {
    client.release();
    pool.end();
  }
}

resetDatabase();

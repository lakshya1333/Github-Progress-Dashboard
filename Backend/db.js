import pg from "pg";
const { Pool } = pg;
import dotenv from "dotenv";
dotenv.config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.port,
  ssl: { rejectUnauthorized: false }
});


const createTables = async () => {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS Users (
        user_id SERIAL PRIMARY KEY,
        github_id INT UNIQUE NOT NULL,
        username VARCHAR(255) NOT NULL,
        avatar_url VARCHAR(512),
        name VARCHAR(255),
        bio TEXT,
        location VARCHAR(255),
        company VARCHAR(255),
        blog VARCHAR(512),
        public_repos INT,
        followers INT,
        following INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS Repositories (
        repo_id SERIAL PRIMARY KEY,
        user_id INT REFERENCES Users(user_id) ON DELETE CASCADE,
        github_repo_id INT UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        stargazers_count INT,
        forks_count INT,
        open_issues_count INT,
        language VARCHAR(255),
        size INT,
        created_at TIMESTAMP,
        updated_at TIMESTAMP,
        pushed_at TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS Commits (
        commit_id SERIAL PRIMARY KEY,
        repo VARCHAR(512),
        user_id INT REFERENCES Users(user_id) ON DELETE CASCADE,
        message TEXT,
        url VARCHAR(1024),
        datee TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS Milestones (
        milestone_id SERIAL PRIMARY KEY,
        user_id INT REFERENCES Users(user_id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS Milestone_Details (
          detail_id SERIAL PRIMARY KEY,
          milestone_id INT REFERENCES Milestones(milestone_id) ON DELETE CASCADE,
          description TEXT,
          due_date TIMESTAMP,
          state VARCHAR(50),
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS Follows (
          follow_id SERIAL PRIMARY KEY,
          follower_id INT REFERENCES Users(user_id) ON DELETE CASCADE,
          follows_id INT REFERENCES Users(user_id) ON DELETE CASCADE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(follower_id, follows_id)
      );

      CREATE TABLE IF NOT EXISTS PullRequests (
          pr_id SERIAL PRIMARY KEY,
          repo_id INT REFERENCES Repositories(repo_id) ON DELETE CASCADE,
          title VARCHAR(255) NOT NULL,
          description TEXT,
          state VARCHAR(50),
          created_at TIMESTAMP,
          merged_at TIMESTAMP,
          initiator_id INT REFERENCES Users(user_id) ON DELETE SET NULL,
          merger_id INT REFERENCES Users(user_id) ON DELETE SET NULL
      );

      CREATE TABLE IF NOT EXISTS PullRequestChanges (
          change_id SERIAL PRIMARY KEY,
          pr_id INT REFERENCES PullRequests(pr_id) ON DELETE CASCADE,
          file_path VARCHAR(512),
          changes TEXT,
          status VARCHAR(50)
      );

      CREATE TABLE IF NOT EXISTS Issues (
          issue_id SERIAL PRIMARY KEY,
          repo_id INT REFERENCES Repositories(repo_id) ON DELETE CASCADE,
          title VARCHAR(255) NOT NULL,
          description TEXT,
          state VARCHAR(50),
          created_at TIMESTAMP,
          closed_at TIMESTAMP,
          creator_id INT REFERENCES Users(user_id) ON DELETE SET NULL
      );

      CREATE TABLE IF NOT EXISTS RepositoryLanguages (
          repo_language_id SERIAL PRIMARY KEY,
          repo_id INT REFERENCES Repositories(repo_id) ON DELETE CASCADE,
          language VARCHAR(100) NOT NULL,
          percentage FLOAT,
          UNIQUE(repo_id, language)
      );

      CREATE TABLE IF NOT EXISTS Contributors (
          contributor_id SERIAL PRIMARY KEY,
          repo_id INT REFERENCES Repositories(repo_id) ON DELETE CASCADE,
          user_id INT REFERENCES Users(user_id) ON DELETE CASCADE,
          contributions INT DEFAULT 0,
          UNIQUE(repo_id, user_id)
      );

      CREATE TABLE IF NOT EXISTS CodeChanges (
          change_id SERIAL PRIMARY KEY,
          commit_id INT REFERENCES Commits(commit_id) ON DELETE CASCADE,
          file_path VARCHAR(512),
          line_number INT,
          content TEXT,
          change_type VARCHAR(20)
      );
    `);

    console.log("Tables created successfully!");
  } catch (err) {
    console.error("Error creating tables:", err);
  } finally {
    client.release();
  }
};

createTables();

export default pool;

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
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          merged_at TIMESTAMP,
          initiator_id INT REFERENCES Users(user_id) ON DELETE SET NULL,
          merger_id INT REFERENCES Users(user_id) ON DELETE SET NULL
      );

      CREATE TABLE IF NOT EXISTS PullRequestChanges (
          change_id SERIAL PRIMARY KEY,
          pr_id INT REFERENCES PullRequests(pr_id) ON DELETE CASCADE,
          file_path VARCHAR(512),
          changes TEXT,
          status VARCHAR(50),
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS Issues (
          issue_id SERIAL PRIMARY KEY,
          repo_id INT REFERENCES Repositories(repo_id) ON DELETE CASCADE,
          title VARCHAR(255) NOT NULL,
          description TEXT,
          state VARCHAR(50),
          created_at TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          closed_at TIMESTAMP,
          creator_id INT REFERENCES Users(user_id) ON DELETE SET NULL
      );

      CREATE TABLE IF NOT EXISTS RepositoryLanguages (
          repo_language_id SERIAL PRIMARY KEY,
          repo_id INT REFERENCES Repositories(repo_id) ON DELETE CASCADE,
          language VARCHAR(100) NOT NULL,
          percentage FLOAT,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(repo_id, language)
      );

      CREATE TABLE IF NOT EXISTS Contributors (
          contributor_id SERIAL PRIMARY KEY,
          repo_id INT REFERENCES Repositories(repo_id) ON DELETE CASCADE,
          user_id INT REFERENCES Users(user_id) ON DELETE CASCADE,
          contributions INT DEFAULT 0,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(repo_id, user_id)
      );

      CREATE TABLE IF NOT EXISTS CodeChanges (
          change_id SERIAL PRIMARY KEY,
          commit_id INT REFERENCES Commits(commit_id) ON DELETE CASCADE,
          file_path VARCHAR(512),
          line_number INT,
          content TEXT,
          change_type VARCHAR(20),
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Create trigger functions for updating timestamps
      CREATE OR REPLACE FUNCTION update_timestamp()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

      -- Create triggers for each table that needs automatic timestamp updates
      CREATE OR REPLACE TRIGGER update_users_timestamp
      BEFORE UPDATE ON Users
      FOR EACH ROW EXECUTE FUNCTION update_timestamp();

      CREATE OR REPLACE TRIGGER update_repositories_timestamp
      BEFORE UPDATE ON Repositories
      FOR EACH ROW EXECUTE FUNCTION update_timestamp();

      CREATE OR REPLACE TRIGGER update_milestones_timestamp
      BEFORE UPDATE ON Milestones
      FOR EACH ROW EXECUTE FUNCTION update_timestamp();

      CREATE OR REPLACE TRIGGER update_milestone_details_timestamp
      BEFORE UPDATE ON Milestone_Details
      FOR EACH ROW EXECUTE FUNCTION update_timestamp();

      CREATE OR REPLACE TRIGGER update_pullrequests_timestamp
      BEFORE UPDATE ON PullRequests
      FOR EACH ROW EXECUTE FUNCTION update_timestamp();

      CREATE OR REPLACE TRIGGER update_pullrequestchanges_timestamp
      BEFORE UPDATE ON PullRequestChanges
      FOR EACH ROW EXECUTE FUNCTION update_timestamp();

      CREATE OR REPLACE TRIGGER update_issues_timestamp
      BEFORE UPDATE ON Issues
      FOR EACH ROW EXECUTE FUNCTION update_timestamp();

      CREATE OR REPLACE TRIGGER update_repositorylanguages_timestamp
      BEFORE UPDATE ON RepositoryLanguages
      FOR EACH ROW EXECUTE FUNCTION update_timestamp();

      CREATE OR REPLACE TRIGGER update_contributors_timestamp
      BEFORE UPDATE ON Contributors
      FOR EACH ROW EXECUTE FUNCTION update_timestamp();

      CREATE OR REPLACE TRIGGER update_codechanges_timestamp
      BEFORE UPDATE ON CodeChanges
      FOR EACH ROW EXECUTE FUNCTION update_timestamp();

      -- Function to get user statistics with nested subqueries

CREATE OR REPLACE FUNCTION get_user_stats(user_id_param INT)
RETURNS TABLE (
    username VARCHAR,
    repo_count BIGINT,
    total_stars BIGINT,
    total_forks BIGINT,
    user_commit_count BIGINT,
    follower_count BIGINT,
    following_count BIGINT,
    most_used_language VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    WITH user_repos AS (
        SELECT r.repo_id, r.stargazers_count, r.forks_count
        FROM Repositories r
        WHERE r.user_id = user_id_param
    ),
    user_commits AS (
        SELECT COUNT(*) AS commit_count
        FROM Commits
        WHERE user_id = user_id_param
    ),
    user_languages AS (
        SELECT rl.language, SUM(rl.percentage) as total_percentage
        FROM RepositoryLanguages rl
        JOIN Repositories r ON rl.repo_id = r.repo_id
        WHERE r.user_id = user_id_param
        GROUP BY rl.language
        ORDER BY total_percentage DESC
        LIMIT 1
    )
    SELECT 
        u.username,
        (SELECT COUNT(*) FROM user_repos) as repo_count,
        (SELECT COALESCE(SUM(stargazers_count), 0) FROM user_repos) as total_stars,
        (SELECT COALESCE(SUM(forks_count), 0) FROM user_repos) as total_forks,
        (SELECT commit_count FROM user_commits) as user_commit_count,
        (SELECT COUNT(*) FROM Follows f WHERE f.follows_id = user_id_param) as follower_count,
        (SELECT COUNT(*) FROM Follows f WHERE f.follower_id = user_id_param) as following_count,
        (SELECT language FROM user_languages) as most_used_language
    FROM Users u
    WHERE u.user_id = user_id_param;
END;
$$ LANGUAGE plpgsql;

      -- Function to get repository statistics with nested subqueries
      -- In get_repo_stats function, remove the date reference:
CREATE OR REPLACE FUNCTION get_repo_stats(repo_id_param INT)
RETURNS TABLE (
    repo_name VARCHAR,
    owner_username VARCHAR,
    star_count INT,
    fork_count INT,
    open_issue_count INT,
    contributor_count BIGINT,
    languages JSON
    -- REMOVE recent_commits JSON from return type
) AS $$
BEGIN
    RETURN QUERY
    WITH repo_languages AS (
        SELECT json_agg(json_build_object('language', language, 'percentage', percentage)) as lang_data
        FROM RepositoryLanguages
        WHERE repo_id = repo_id_param
    )
    SELECT 
        r.name as repo_name,
        u.username as owner_username,
        r.stargazers_count as star_count,
        r.forks_count as fork_count,
        r.open_issues_count as open_issue_count,
        (SELECT COUNT(*) FROM Contributors WHERE repo_id = repo_id_param) as contributor_count,
        (SELECT lang_data FROM repo_languages) as languages
        -- REMOVE the recent_commits selection
    FROM Repositories r
    JOIN Users u ON r.user_id = u.user_id
    WHERE r.repo_id = repo_id_param;
END;
$$ LANGUAGE plpgsql;

      -- Function to update contributor counts when new commits are added
      CREATE OR REPLACE FUNCTION update_contributor_stats()
      RETURNS TRIGGER AS $$
      BEGIN
          -- Update or insert contributor record
          INSERT INTO Contributors (repo_id, user_id, contributions)
          SELECT 
              r.repo_id, 
              NEW.user_id, 
              1
          FROM Repositories r
          WHERE r.name = NEW.repo
          ON CONFLICT (repo_id, user_id) 
          DO UPDATE SET 
              contributions = Contributors.contributions + 1,
              updated_at = NOW();
          
          RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

      CREATE OR REPLACE TRIGGER after_commit_insert
      AFTER INSERT ON Commits
      FOR EACH ROW EXECUTE FUNCTION update_contributor_stats();
    `);

    console.log("Tables, triggers, and functions created successfully!");
  } catch (err) {
    console.error("Error creating tables, triggers, and functions:", err);
  } finally {
    client.release();
  }
};

let isInitialized = false;

const initializeDB = async () => {
  if (!isInitialized) {
    try {
      await createTables();
      isInitialized = true;
    } catch (err) {
      console.error("Database initialization failed:", err);
      throw err;
    }
  }
  return pool;
};

// Immediately initialize the database when this module is imported
initializeDB().catch(err => {
  console.error("Fatal database initialization error:", err);
  process.exit(1);
});

// Export the pool directly
export default pool;
import express from "express";
import cors from "cors";
import passport from "passport";
import { Strategy as GitHubStrategy } from "passport-github2";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import session from "express-session";
import pool from "./db.js";
import {
  fetchUserDetails,
  fetchUserRepos,
  fetchUserCommits,
  fetchUserIssues,
  fetchUserStarsGiven,
  fetchRepoLanguages,
  fetchUserPullRequests
} from "./scrape.js";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";
dotenv.config();

const app = express();
const port = 3000;
const JWT_SECRET = process.env.JWT_SECRET;
app.use(cookieParser());

app.use(
  cors({
    origin: "http://localhost:3000",  
    credentials: true, // Allow cookies to be sent
  })
);


app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, '../Frontend/dist')));




app.use(session({
  secret: process.env.SESSION_SECRET || 'your-session-secret',
  resave: false, 
  saveUninitialized: false, 
  cookie: { secure: false }
}));


app.use(passport.initialize());
app.use(passport.session());

// Passport serialization/deserialization
passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));



passport.use(
  new GitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: "http://127.0.0.1:3000/auth/github/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const client = await pool.connect();
        let user;

        const userRes = await client.query(
          "SELECT * FROM Users WHERE github_id = $1",
          [profile.id]
        );
        console.log(profile)

        
        const githubUser = await fetchUserDetails(profile.username);

      if (!githubUser) {
        console.error(`GitHub user details not found for username: ${profile.username}`);
        return done(new Error("Failed to fetch GitHub user details"));
      }


        

        if (userRes.rows.length === 0) {
          const newUserRes = await client.query(
            `INSERT INTO Users (
              github_id, username, avatar_url, name, bio, location, 
              company, blog, public_repos, followers, following,created_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`,
            [
              profile.id,
              profile.username,
              profile.photos[0].value,
              profile.displayName || "",
              profile._json.bio || "",
              profile._json.location || "",
              profile._json.company || "",
              profile._json.blog || "",
              profile._json.public_repos,
              profile._json.followers,
              profile._json.following,
              githubUser.created_at
            ]
          );
          user = newUserRes.rows[0];
        } else {
          await client.query(
            `UPDATE Users SET 
              username = $2, avatar_url = $3, name = $4, bio = $5, location = $6, 
              company = $7, blog = $8, public_repos = $9, followers = $10, following = $11,created_at = $12
              WHERE github_id = $1`,
            [
              profile.id,
              profile.username,
              profile.photos[0].value,
              profile.displayName || "",
              profile._json.bio || "",
              profile._json.location || "",
              profile._json.company || "",
              profile._json.blog || "",
              profile._json.public_repos,
              profile._json.followers,
              profile._json.following,
              githubUser.created_at
            ]
          );
          user = userRes.rows[0];
        }

        const repos = await fetchUserRepos(profile.username);
        for (const repo of repos) {
          await client.query(
            `INSERT INTO Repositories (
              user_id, github_repo_id, name, description,
              stargazers_count, forks_count, open_issues_count, language,
              size, created_at, updated_at, pushed_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
            ON CONFLICT (github_repo_id) 
            DO UPDATE SET
              stargazers_count = EXCLUDED.stargazers_count,
              forks_count = EXCLUDED.forks_count,
              open_issues_count = EXCLUDED.open_issues_count,
              language = EXCLUDED.language,
              size = EXCLUDED.size,
              updated_at = EXCLUDED.updated_at,
              pushed_at = EXCLUDED.pushed_at`,
            [
              user.user_id,
              repo.id,
              repo.name,
              repo.description,
              repo.stargazers_count,
              repo.forks_count,
              repo.open_issues_count,
              repo.language,
              repo.size,
              repo.created_at,
              repo.updated_at,
              repo.pushed_at,
            ]
          );
        }
        for (const repo of repos) {
          // First check if the repository exists in your database
          const repoExists = await client.query(
            'SELECT repo_id FROM Repositories WHERE github_repo_id = $1',
            [repo.id]
          );
        
          if (!repoExists.rows.length) {
            console.log(`Repository ${repo.name} not found in database, skipping...`);
            continue;
          }
        
          const repoId = repoExists.rows[0].repo_id;
          const languages = await fetchRepoLanguages(profile.username, repo.name);
          
          const totalBytes = Object.values(languages).reduce((sum, bytes) => sum + bytes, 0);
          
          for (const [language, bytes] of Object.entries(languages)) {
            const percentage = (bytes / totalBytes) * 100;
            
            await client.query(
              `INSERT INTO RepositoryLanguages(repo_id, language, percentage)
               VALUES ($1, $2, $3)
               ON CONFLICT (repo_id, language) 
               DO UPDATE SET 
                 percentage = EXCLUDED.percentage,
                 updated_at = CURRENT_TIMESTAMP`,
              [repoId, language, percentage]  // Use the database repo_id, not GitHub's ID
            );
          }
        }
        

        const commits = await fetchUserCommits(profile.username);

        for (const commit of commits) {  
          await client.query(
            `INSERT INTO Commits (repo, user_id, message, url, datee) 
            VALUES ($1, $2, $3, $4, $5) 
            ON CONFLICT DO NOTHING`,  
            [
              commit.repo,
              user.user_id,
              commit.message,
              commit.url,
              commit.date,  
            ]
          );
        }

        const totalIssues = await fetchUserIssues(profile.username);
        await client.query(
          `INSERT INTO UserIssues (user_id, total_issues)
           VALUES ($1, $2)
           ON CONFLICT (user_id) 
           DO UPDATE SET 
               total_issues = EXCLUDED.total_issues,
               fetched_at = CURRENT_TIMESTAMP`,
          [user.user_id, totalIssues]
      );
         
      const totalPRs = await fetchUserPullRequests(profile.username);
      await client.query(
        `INSERT INTO UserPullRequests (user_id, total_prs)
         VALUES ($1, $2)
         ON CONFLICT (user_id) DO UPDATE SET 
           total_prs = EXCLUDED.total_prs,
           fetched_at = CURRENT_TIMESTAMP`,
        [user.user_id, totalPRs]
      );



        const token = jwt.sign({ userId: user.user_id }, JWT_SECRET);
        client.release();
        return done(null, { token, user });
      } catch (err) {
        return done(err, null);
      }
    }
  )
);



app.get("/auth/github", passport.authenticate("github", { scope: ["user:email"] }));

app.get(
  "/auth/github/callback",
  passport.authenticate("github", { failureRedirect: "/login" }),
  (req, res) => {
    res.cookie("token", req.user.token, {
      httpOnly: true,
      secure: true,
      sameSite: "None",
      path: "/",  
    });
    console.log("Token set in cookie: " + " "+req.user.token)
    res.redirect("http://localhost:3000/dashboard");
  }
);

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/user')) {
    return next();
  }
  res.sendFile(path.join(__dirname, '../Frontend/dist', 'index.html'));
});

app.get("/user/details", async (req, res) => {
  try {
    const token = req.cookies.token; 
    console.log("Token is: " + token);
    
    if (!token) {
      console.log("Error: No token provided");
      return res.status(401).json({ error: "Unauthorized: No token provided" });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      console.error("Token verification failed:", err.message);
      return res.status(401).json({ error: "Unauthorized: Invalid token" });
    }

    const client = await pool.connect();
    try {
      // Get basic user info
      const user = await client.query(
        "SELECT * FROM Users WHERE user_id = $1",
        [decoded.userId]
      );
      
      // Get comprehensive stats using the function
      const stats = await client.query(
        "SELECT * FROM get_user_stats($1)",
        [decoded.userId]
      );

      // Combine results
      const result = {
        ...user.rows[0],
        stats: stats.rows[0]
      };
      
      res.json(result);
    } finally {
      client.release();
    }
  } catch (err) {
    console.error("Error fetching user details:", err.message);
    res.status(500).json({ error: err.message });
  }
});


app.get("/user/repos", async (req, res) => {
  try {
    const token = req.cookies.token; 
    console.log("Token is: " + token);
    
    if (!token) {
      console.log("Error: No token provided");
      return res.status(401).json({ error: "Unauthorized: No token provided" });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      console.error("Token verification failed:", err.message);
      return res.status(401).json({ error: "Unauthorized: Invalid token" });
    }

    const client = await pool.connect();
    try {
      const repos = await client.query(
        "SELECT * FROM Repositories WHERE user_id = $1 ORDER BY created_at DESC",
        [decoded.userId]
      );
      res.json(repos.rows || []);
    } finally {
      client.release();
    }
  } catch (err) {
    console.error("Error fetching repositories:", err.message);
    res.status(500).json({ error: err.message });
  }
});

function getRandomColor() {
  const hue = Math.floor(Math.random() * 360);
  return `hsl(${hue}, 70%, 70%)`;
}

app.get('/user/languages', async (req, res) => {
  const client = await pool.connect();
  try {
    const result = await client.query(`
      SELECT language, COUNT(*) as count
      FROM Repositories
      WHERE language IS NOT NULL
      GROUP BY language
    `);
     
    const rows = result.rows;

    const total = rows.reduce((acc, row) => acc + parseInt(row.count), 0);

    const languages = rows.map(row => ({
      name: row.language,
      percentage: parseFloat(((row.count / total) * 100).toFixed(2)),
      color: getRandomColor()
    }));

    res.json({ languages });
  } catch (err) {
    console.error('Error fetching languages:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


app.get("/user/activity", async (req, res) => {
  try {
    const token = req.cookies.token;
    
    if (!token) {
      return res.status(401).json({ error: "Unauthorized: No token provided" });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ error: "Unauthorized: Invalid token" });
    }

    const client = await pool.connect();
    try {
      // First get the username
      const userRes = await client.query(
        "SELECT username FROM Users WHERE user_id = $1", 
        [decoded.userId]
      );
      
      if (userRes.rows.length === 0) {
        return res.status(404).json({ error: "User not found" });
      }
      
      const username = userRes.rows[0].username;

      // Now use the username for fetching
      const [issuesCreated, starsGiven] = await Promise.all([
        fetchUserIssues(username),
        fetchUserStarsGiven(username),
      ]);

      res.json({ issuesCreated, starsGiven });
    } finally {
      client.release();
    }
  } catch (err) {
    console.error("Error fetching user activity:", err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get("/user/commits", async (req, res) => {
  try {
    const token = req.cookies.token; 
    console.log("Token is: " + token);
    
    if (!token) {
      console.log("Error: No token provided");
      return res.status(401).json({ error: "Unauthorized: No token provided" });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      console.error("Token verification failed:", err.message);
      return res.status(401).json({ error: "Unauthorized: Invalid token" });
    }

    const client = await pool.connect();
    try {
      const commits = await client.query(
        "SELECT * FROM Commits WHERE user_id = $1 ORDER BY datee DESC",
        [decoded.userId]
      );
      res.json(commits.rows || []);
    } finally {
      client.release();
    }
  } catch (err) {
    console.error("Error fetching repositories:", err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get("/user/commitsperday", async (req, res) => {
  try {
    const token = req.cookies.token; 
    console.log("Token is: " + token);
    
    if (!token) {
      console.log("Error: No token provided");
      return res.status(401).json({ error: "Unauthorized: No token provided" });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      console.error("Token verification failed:", err.message);
      return res.status(401).json({ error: "Unauthorized: Invalid token" });
    }

    const client = await pool.connect();
    try {
      const commits = await client.query(
        `SELECT DATE(datee) as commit_date, COUNT(*) as commit_count
         FROM Commits
         WHERE user_id = $1
         GROUP BY commit_date
         ORDER BY commit_date`,
        [decoded.userId]
      );
      res.json(commits.rows || []);
    } finally {
      client.release();
    }
  } catch (err) {
    console.error("Error fetching repositories:", err.message);
    res.status(500).json({ error: err.message });
  }
});

import fs from 'fs';
import { execSync } from "child_process";
import { nanoid } from "nanoid";



app.post('/latex-to-pdf', (req, res) => {
  const outputPath = path.join(__dirname, 'latex_output');
  const id = nanoid();
  const texPath = path.join(__dirname, `${id}.tex`);
  const pdfPath = path.join(outputPath, `${id}.pdf`);
  const latexCode = req.body.latex;

  console.log("==== LATEX FILE CONTENT ====");
  console.log(latexCode);

  fs.writeFileSync(texPath, latexCode);

  // Wrap paths in double quotes to handle spaces
  const quotedOutputPath = `"${outputPath}"`;
  const quotedTexPath = `"${texPath}"`;

  try {
    const command = `"C:\\Program Files\\MiKTeX\\miktex\\bin\\x64\\pdflatex.exe" -output-directory=${quotedOutputPath} ${quotedTexPath}`;
    console.log('Running command:', command);
    execSync(command, { stdio: 'inherit' });

    const pdf = fs.readFileSync(pdfPath);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=github-profile.pdf');
    res.send(pdf);
  } catch (error) {
    console.error('LaTeX compile error:', error.message);
    res.status(500).send('Failed to compile LaTeX.');
  } finally {
    try {
      fs.unlinkSync(texPath);
      fs.unlinkSync(pdfPath);
      fs.unlinkSync(path.join(__dirname, `${id}.log`));
      fs.unlinkSync(path.join(__dirname, `${id}.aux`));
    } catch (_) {}
  }
});




app.get("/logout", (req, res) => {
  res.clearCookie("token");
  res.redirect("http://localhost:3000/login");
});

app.listen(port, () => {
  console.log(`Server running on ${port}`);
  
});


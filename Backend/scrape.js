import { Octokit } from "@octokit/rest";

import dotenv from "dotenv";
dotenv.config();

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN
});

export async function fetchUserRepos(username) {
  try {
    const response = await octokit.rest.repos.listForUser({
      username: username,
      type: 'owner', 
      sort: 'updated',
      direction: 'desc',
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching user repositories:', error);
    return [];
  }
}


export async function fetchUserDetails(username) {
  try {
    const response = await octokit.rest.users.getByUsername({
      username: username,
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching user details:', error);
    return null;
  }
}

export async function fetchUserIssues(username) {
  try {
    const response = await octokit.rest.search.issuesAndPullRequests({
      q: `author:${username} type:issue`,
      per_page: 1,  
    });

    return response.data.total_count;  
  } catch (error) {
    console.error('Error fetching user issues:', error);
    return 0;
  }
}

export async function fetchUserPullRequests(username) {
  try {
    const response = await octokit.rest.search.issuesAndPullRequests({
      q: `author:${username} type:pr`,
      per_page: 1,  
    });

    return response.data.total_count;  
  } catch (error) {
    console.error('Error fetching user pull requests:', error);
    return 0;
  }
}


export async function fetchUserStarsGiven(username) {
  try {
    const response = await octokit.rest.activity.listReposStarredByUser({
      username: username,
      per_page: 1, 
    });

    return response.data.length;  
  } catch (error) {
    console.error('Error fetching stars given by user:', error);
    return 0;
  }
}


export async function fetchUserCommits(username, ncommits=100) { 
  try {
    const response = await octokit.rest.search.commits({
      q: `author:${username}`,
      per_page: ncommits,
    });

    return response.data.items.map(commit => ({
      message: commit.commit.message,
      repo: commit.repository.full_name,
      url: commit.html_url,
      date: commit.commit.author.date,
    }));
  } catch (error) {
    console.error("Error fetching user commits:", error);
    return [];
  }
}

export async function fetchRepoLanguages(owner, repo) {
  try {
    const response = await octokit.rest.repos.listLanguages({
      owner,
      repo,
    });
    return response.data;
  } catch (error) {
    console.error(`Error fetching languages for ${repo}:`, error);
    return {};
  }
}

export async function fetchRepoContributors(owner, repo) {
  try {
    const response = await octokit.rest.repos.listContributors({
      owner,
      repo,
    });
    return response.data;
  } catch (error) {
    console.error(`Error fetching contributors for ${repo}:`, error);
    return [];
  }
}

export async function fetchRepoPullRequests(owner, repo) {
  try {
    const response = await octokit.rest.pulls.list({
      owner,
      repo,
      state: "all",
      per_page: 50,
    });
    return response.data;
  } catch (error) {
    console.error(`Error fetching pull requests for ${repo}:`, error);
    return [];
  }
}

export async function fetchRepoIssues(owner, repo) {
  try {
    const response = await octokit.rest.issues.listForRepo({
      owner,
      repo,
      state: "all",
      per_page: 50,
    });
    return response.data;
  } catch (error) {
    console.error(`Error fetching issues for ${repo}:`, error);
    return [];
  }
}

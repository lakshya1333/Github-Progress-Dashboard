
export interface GithubUser {
  username: string;
  name: string;
  avatar_url: string;
  bio: string;
  location: string;
  company: string;
  blog: string;
  followers: number;
  following: number;
  created_at: string;
}

export interface Repository {
  id: number;
  name: string;
  description: string;
  stargazers_count: number;
  forks_count: number;
  issues: number;
  language: string;
  updated_at: string;
  url: string;
  isPrivate: boolean;
}

export interface ContributionDay {
  date: string;
  count: number;
  level: 0 | 1 | 2 | 3 | 4; 
}

export interface ContributionCalendar {
  weeks: {
    days: ContributionDay[];
  }[];
  totalContributions: number;
}

export interface Contribution {
  date: string;
  repositoryName: string;
  type: "commit" | "issue" | "pr" | "review" | "other";
  count: number;
  title?: string;
  url?: string;
}

export interface LanguageStat {
  name: string;
  percentage: number;
  color: string;
}

export interface GithubStats {
  totalCommits: number;
  totalPRs: number;
  totalIssues: number;
  totalRepos: number;
  starsGiven: number;
  starsReceived: number;
  contributionCalendar: ContributionCalendar;
  topLanguages: LanguageStat[];
  recentActivity: Contribution[];
  popularRepositories: Repository[];
}

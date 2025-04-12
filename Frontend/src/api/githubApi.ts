import axios from "axios";

let API_BASE = "http://127.0.0.1:3000"; // Default backend URL

export const setApiBaseUrl = (url: string) => {
  API_BASE = url;
};

// Ensure cookies are sent with requests
axios.defaults.withCredentials = true;

// Fetch user repositories
export const fetchRepositories = async () => {
  try {
    console.log("Stored cookies:", document.cookie);

    const response = await axios.get(`${API_BASE}/user/repos`);
    console.log("Repositories:", response.data);
    
    return response.data;
  } catch (error) {
    console.error("Error fetching repositories:", error);
    throw error;
  }
};

export async function getUserPullRequests() {
  try {
    const response = await fetch(`${API_BASE}/user/activity`, {
      credentials: "include",
    });
    const data = await response.json();
    return data.issuesCreated;  
  } catch (error) {
    console.error("Error fetching user pull requests:", error);
    return 0;
  }
}

export async function getUserStarsGiven() {
  try {
    const response = await fetch(`${API_BASE}/user/activity`, {
      credentials: "include",
    });
    const data = await response.json();
    return data.starsGiven;
  } catch (error) {
    console.error("Error fetching user stars given:", error);
    return 0;
  }
}


export const fetchUserActivity = async () => {
  try {
    const response = await axios.get(`${API_BASE}/user/activity`);
    // console.log("Repositories:", response.data);
    
    return response.data;
  } catch (error) {
    console.error("Error fetching user activity:", error);
  }
};

// Fetch user commit activity and format it for the chart
export const fetchCommits = async (): Promise<{ date: Date; count: number }[]> => {
  try {
    const response = await fetch(`${API_BASE}/user/commitsperday`, {
      method: "GET",
      credentials: "include",
    });

    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

    const data: { commit_date: string; commit_count: number }[] = await response.json();
    
    return data.map((commit) => ({
      date: new Date(commit.commit_date),
      count: commit.commit_count,
    }));
  } catch (error) {
    console.error("Error fetching commits:", error);
    throw error;
  }
};

export const fetchAllCommits = async (): Promise<Array<{ 
  repo: string;
  user_id: number;
  message: string;
  url: string;
  datee: string;
}>> => {
  try {
    const response = await fetch(`${API_BASE}/user/commits`, {
      method: "GET",
      credentials: "include",
    });

    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

    const commits: Array<{ 
      repo: string;
      user_id: number;
      message: string;
      url: string;
      datee: string;
    }> = await response.json();

    return commits.map(commit => ({
      repo: commit.repo,
      user_id: commit.user_id,
      message: commit.message,
      url: commit.url,
      datee: commit.datee,
    }));
  } catch (error) {
    console.error("Error fetching all commits:", error);
    throw error;
  }
};


// Fetch user details
export const fetchUserDetails = async () => {
  try {
    console.log("Stored cookies:", document.cookie);

    const response = await axios.get(`${API_BASE}/user/details`);
    console.log("User details:", response.data);

    return Array.isArray(response.data) ? response.data[0] : response.data;
  } catch (error) {
    console.error("Error fetching user details:", error);
    throw error;
  }
};

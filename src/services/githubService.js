import { GITHUB_CONFIG } from "../config";

// GitHub API base URL
const GITHUB_API_URL = GITHUB_CONFIG.API_URL;

// Helper function to handle API responses
// const handleResponse = (response) => {
//   if (!response.ok) {
//     // Check for rate limiting
//     if (
//       response.status === 403 &&
//       response.headers.get("x-ratelimit-remaining") === "0"
//     ) {
//       console.warn(
//         "GitHub API rate limit exceeded. Retrying with exponential backoff..."
//       );
//       throw new Error(
//         "GitHub API rate limit exceeded. Please try again later."
//       );
//     }

//     // Handle other errors
//     const errorData = response.json().catch(() => ({}));
//     throw new Error(
//       errorData.message || `HTTP error! Status: ${response.status}`
//     );
//   }

//   return response.json();
// };

// Function to create a request with common options
const createRequest = async (endpoint, options = {}) => {
  const headers = {
    Accept: "application/vnd.github.v3+json",
    "Content-Type": "application/json",
    ...options.headers,
  };

  // Add authorization header if token is available
  if (GITHUB_CONFIG.USE_AUTH && GITHUB_CONFIG.API_TOKEN) {
    headers["Authorization"] = `token ${GITHUB_CONFIG.API_TOKEN}`;
  }

  try {
    const response = await fetch(`${GITHUB_API_URL}${endpoint}`, {
      headers,
      ...options,
    });

    if (!response.ok) {
      if (response.status === 422) {
        throw new Error(
          "Repository statistics are not available. This may happen if the repository is empty or was just created."
        );
      }
      if (response.status === 403) {
        throw new Error(
          "GitHub API rate limit exceeded. Please try again later."
        );
      }
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || `GitHub API error: ${response.status}`
      );
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Error fetching ${endpoint}:`, error);
    throw error;
  }
};

// Function to fetch repository stats (commits, additions, deletions)
export const fetchRepositoryStats = async (owner, repo) => {
  if (!owner || !repo) {
    throw new Error("Repository owner and name are required");
  }

  try {
    // Create promise array for parallel requests
    const statsPromises = [
      // Get commits for the repository
      createRequest(`/repos/${owner}/${repo}/stats/participation`),
      // Get code frequency (additions and deletions)
      createRequest(`/repos/${owner}/${repo}/stats/code_frequency`),
      // Get contributors
      createRequest(`/repos/${owner}/${repo}/stats/contributors`),
    ];

    // Use Promise.allSettled instead of Promise.all to handle partial failures
    const results = await Promise.allSettled(statsPromises);
    const [commitsResponse, codeFrequencyResponse, contributorsResponse] =
      results;

    // Check if all requests failed with 422
    const all422Error = results.every(
      (result) =>
        result.status === "rejected" &&
        result.reason.message.includes(
          "Repository statistics are not available"
        )
    );

    if (all422Error) {
      return {
        error:
          "Repository statistics are not available. This may happen if the repository is empty or was just created.",
        commits: Array(52)
          .fill(0)
          .map((_, i) => ({ x: i, y: 0 })),
        additions: Array(52)
          .fill(0)
          .map((_, i) => ({ x: i, y: 0 })),
        deletions: Array(52)
          .fill(0)
          .map((_, i) => ({ x: i, y: 0 })),
        contributors: [],
      };
    }

    // Process and format the commits data
    let commitsData = [];
    if (
      commitsResponse.status === "fulfilled" &&
      commitsResponse.value &&
      commitsResponse.value.all
    ) {
      commitsData = commitsResponse.value.all;

      // Sometimes GitHub returns 0 for all points, check if data is meaningful
      if (commitsData.every((point) => point === 0)) {
        // Try to get at least some data by using owner commits
        if (
          commitsResponse.value.owner &&
          commitsResponse.value.owner.length > 0
        ) {
          commitsData = commitsResponse.value.owner;
        }
      }

      // Make sure data is in a format Highcharts can use
      commitsData = commitsData.map((value, index) => ({
        x: index,
        y: value,
      }));
    }

    // Process code frequency data
    let additions = [];
    let deletions = [];
    if (
      codeFrequencyResponse.status === "fulfilled" &&
      codeFrequencyResponse.value
    ) {
      const codeFrequency = codeFrequencyResponse.value;

      // Code frequency is an array of arrays [timestamp, additions, deletions]
      if (Array.isArray(codeFrequency) && codeFrequency.length > 0) {
        // Map to format Highcharts can use
        additions = codeFrequency.map((week, index) => ({
          x: index,
          y: week[1] || 0,
        }));

        deletions = codeFrequency.map((week, index) => ({
          x: index,
          y: Math.abs(week[2] || 0), // Make deletions positive
        }));
      }
    }

    // Process contributors data
    let contributorsData = [];
    if (
      contributorsResponse.status === "fulfilled" &&
      contributorsResponse.value
    ) {
      const contributors = contributorsResponse.value;

      if (Array.isArray(contributors) && contributors.length > 0) {
        contributorsData = contributors
          .filter((contributor) => contributor.author != null) // Filter out null authors
          .map((contributor) => ({
            author: contributor.author.login,
            avatarUrl: contributor.author.avatar_url,
            totalCommits: contributor.total,
            weeks: contributor.weeks,
          }));
      }
    }

    // Sometimes GitHub returns a 202 Accepted status but empty data
    // In that case, generate some placeholder data
    if (commitsData.length === 0) {
      commitsData = Array(52)
        .fill(0)
        .map((_, i) => ({ x: i, y: 0 }));
    }

    if (additions.length === 0) {
      additions = Array(52)
        .fill(0)
        .map((_, i) => ({ x: i, y: 0 }));
    }

    if (deletions.length === 0) {
      deletions = Array(52)
        .fill(0)
        .map((_, i) => ({ x: i, y: 0 }));
    }

    return {
      commits: commitsData,
      additions: additions,
      deletions: deletions,
      contributors: contributorsData,
    };
  } catch (error) {
    console.error("Error fetching repository stats:", error);
    // Return a structured error response with empty placeholders
    return {
      error: error.message || "Failed to load repository statistics",
      commits: Array(52)
        .fill(0)
        .map((_, i) => ({ x: i, y: 0 })),
      additions: Array(52)
        .fill(0)
        .map((_, i) => ({ x: i, y: 0 })),
      deletions: Array(52)
        .fill(0)
        .map((_, i) => ({ x: i, y: 0 })),
      contributors: [],
    };
  }
};

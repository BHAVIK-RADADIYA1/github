import { call, put, takeLatest, select } from "redux-saga/effects";
import {
  fetchRepositoriesRequest,
  fetchRepositoriesSuccess,
  fetchRepositoriesFailure,
} from "../slices/repositoriesSlice";
import { GITHUB_CONFIG } from "../../config";

// GitHub API base URL
const GITHUB_API_URL = GITHUB_CONFIG.API_URL;

// Helper function to handle API responses
const handleResponse = async (response) => {
  if (!response.ok) {
    if (
      response.status === 403 &&
      response.headers.get("x-ratelimit-remaining") === "0"
    ) {
      throw new Error(
        "GitHub API rate limit exceeded. Please try again later."
      );
    }

    // Handle other errors
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.message || `HTTP error! Status: ${response.status}`
    );
  }

  return response.json();
};

// Function to fetch data from GitHub API
const fetchFromGitHub = async (endpoint, params = {}) => {
  const queryParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    queryParams.append(key, value);
  });

  const url = `${GITHUB_API_URL}${endpoint}?${queryParams.toString()}`;

  const headers = {
    Accept: "application/vnd.github.v3+json",
  };

// checking if the auth is used and the token is available
  if (
    GITHUB_CONFIG.USE_AUTH &&
    GITHUB_CONFIG.API_TOKEN &&
    GITHUB_CONFIG.API_TOKEN !== "your_github_token_here"
  ) {
    headers["Authorization"] = `token ${GITHUB_CONFIG.API_TOKEN}`;
  }

  const response = await fetch(url, { headers });
  return handleResponse(response);
};

// Helper function to build the query based on time filter
function getTimeQuery(timeFilter) {
  const today = new Date();
  let sinceDate = new Date();

  if (timeFilter === "week") {
    sinceDate.setDate(today.getDate() - 7);
  } else if (timeFilter === "month") {
    sinceDate.setMonth(today.getMonth() - 1);
  } else {
    return "";
  }

  if (timeFilter !== "overall") {
    return `created:>${sinceDate.toISOString().split("T")[0]}`;
  }

  return "";
}

// Worker saga for fetching repositories
function* fetchRepositories() {
  try {
    const timeFilter = yield select((state) => state.repositories.timeFilter);
    const timeQuery = getTimeQuery(timeFilter);
    const page = yield select((state) => state.repositories.page);

    // Build the search query
    const query = `stars:>1000 ${timeQuery} sort:stars`;

    // Fetch repositories from GitHub API with pagination
    const params = {
      q: query,
      per_page: 10,
      page: page,
      sort: "stars",
      order: "desc",
    };

    const response = yield call(
      fetchFromGitHub,
      "/search/repositories",
      params
    );

    // mapping the response to the data we need
    const repositories = response.items.map((repo) => ({
      id: repo.id,
      name: repo.name,
      fullName: repo.full_name,
      description: repo.description,
      url: repo.html_url,
      stars: repo.stargazers_count,
      forks: repo.forks_count,
      language: repo.language,
      owner: {
        login: repo.owner.login,
        avatarUrl: repo.owner.avatar_url,
      },
      createdAt: repo.created_at,
      updatedAt: repo.updated_at,
    }));

    yield put(fetchRepositoriesSuccess(repositories));
  } catch (error) {
    yield put(fetchRepositoriesFailure(error.message));
  }
}

// Watcher saga
export default function* RepositoriesSaga() {
  yield takeLatest(fetchRepositoriesRequest.type, fetchRepositories);
}

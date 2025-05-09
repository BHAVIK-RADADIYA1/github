import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  loading: false,
  topRepositories: [],
  error: null,
  timeFilter: 'overall', 
  selectedRepo: null,
  expandedRepo: null, 
  selectedTab: 'commits', 
  page: 1,
  hasMore: true,
};

export const repositoriesSlice = createSlice({
  name: 'repositories',
  initialState,
  reducers: {
    fetchRepositoriesRequest: (state, action) => {
      state.loading = true;
      state.error = null;
      if (!action.payload?.isLoadMore) {
        state.page = 1;
        state.topRepositories = [];
        state.hasMore = true;
      }
    },

    fetchRepositoriesSuccess: (state, action) => {
      state.loading = false;
      if (state.page > 1) {
        state.topRepositories = [...state.topRepositories, ...action.payload];
      } else {
        state.topRepositories = action.payload;
      }
      state.hasMore = action.payload.length > 0;
      state.error = null;
    },

    fetchRepositoriesFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
      state.hasMore = false;
    },

    setTimeFilter: (state, action) => {
      state.timeFilter = action.payload;
    },

    // selecting the repo for the expanded repo
    selectRepository: (state, action) => {
      state.selectedRepo = action.payload;
    },

    toggleExpandRepository: (state, action) => {
      // If the same repo is clicked, toggle it closed
      if (state.expandedRepo && state.expandedRepo.id === action.payload.id) {
        state.expandedRepo = null;
      } else {
        state.expandedRepo = action.payload;
      }
    },
    // selecting the tab for the expanded repo
    setSelectedTab: (state, action) => {
      state.selectedTab = action.payload;
    },
    // incrementing the page for inifinite scroll
    incrementPage: (state) => {
      state.page += 1;
    },
  },
});

export const {
  fetchRepositoriesRequest,
  fetchRepositoriesSuccess,
  fetchRepositoriesFailure,
  setTimeFilter,
  selectRepository,
  toggleExpandRepository,
  setSelectedTab,
  incrementPage,
} = repositoriesSlice.actions;

export default repositoriesSlice.reducer; 
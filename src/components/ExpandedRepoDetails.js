import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Box,
  Typography,
  Paper,
  Menu,
  MenuItem,
  IconButton,
  Grid,
} from "@mui/material";
import { Refresh, MoreVert } from "@mui/icons-material";
import { setSelectedTab } from "../redux/slices/repositoriesSlice";
import { fetchRepositoryStats } from "../services/githubService";
import RepoStatsChart from "./RepoStatsChart";
import ContributorsChart from "./ContributorsChart";

const ExpandedRepoDetails = ({ repo }) => {
  const dispatch = useDispatch();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const menuOpen = Boolean(menuAnchorEl);

  const fetchStats = async () => {
    if (!repo) return;

    setLoading(true);
    setError(null);

    try {
      const [owner, repoName] = repo.fullName.split("/");
      const statsData = await fetchRepositoryStats(owner, repoName);

      // error handling for the repository stats
      if (statsData.error) {
        setError(statsData.error);
        setStats(statsData);
      } else {
        setStats(statsData);
        setError(null);
      }
    } catch (err) {
      console.error("Error processing repository data:", err);
      setError(err.message || "Failed to load repository statistics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [repo]);

  const handleOpenMenu = (event) => {
    setMenuAnchorEl(event.currentTarget);
  };

  const handleCloseMenu = () => {
    setMenuAnchorEl(null);
  };

  const handleSelectMenuItem = (tab) => {
    dispatch(setSelectedTab(tab));
    handleCloseMenu();
  };

  const handleRetry = () => {
    fetchStats();
  };

  if (!repo) return null;

  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
        <Typography variant="h6" component="h2">
          Repository Statistics
        </Typography>
        <Box>
          <IconButton onClick={handleRetry} disabled={loading}>
            <Refresh />
          </IconButton>
          <IconButton onClick={handleOpenMenu}>
            <MoreVert />
          </IconButton>
        </Box>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper elevation={0} sx={{ p: 2, backgroundColor: "background.default" }}>
            <RepoStatsChart
              data={stats?.commits || []}
              title="Commits"
              loading={loading}
              error={error}
            />
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Paper elevation={0} sx={{ p: 2, backgroundColor: "background.default" }}>
            <ContributorsChart
              contributors={stats?.contributors || []}
              loading={loading}
              error={error}
            />
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper elevation={0} sx={{ p: 2, backgroundColor: "background.default" }}>
            <RepoStatsChart
              data={stats?.additions || []}
              title="Additions"
              colorIndex={1}
              loading={loading}
              error={error}
            />
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper elevation={0} sx={{ p: 2, backgroundColor: "background.default" }}>
            <RepoStatsChart
              data={stats?.deletions || []}
              title="Deletions"
              colorIndex={2}
              loading={loading}
              error={error}
            />
          </Paper>
        </Grid>
      </Grid>

      <Menu
        anchorEl={menuAnchorEl}
        open={menuOpen}
        onClose={handleCloseMenu}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
      >
        <MenuItem onClick={() => handleSelectMenuItem("overview")}>
          Overview
        </MenuItem>
        <MenuItem onClick={() => handleSelectMenuItem("contributors")}>
          Contributors
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default ExpandedRepoDetails;

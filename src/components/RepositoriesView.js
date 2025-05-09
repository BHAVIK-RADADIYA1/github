import React, {
  useEffect,
  useRef,
  useCallback,
  useState,
  Fragment,
} from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Box,
  Paper,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Typography,
  Avatar,
  CircularProgress,
  Divider,
  IconButton,
  Collapse,
  Button,
  Menu,
  MenuItem,
} from "@mui/material";
import {
  ChevronRight,
  ExpandMore,
  Refresh,
  MoreVert,
} from "@mui/icons-material";
import {
  selectRepository,
  fetchRepositoriesRequest,
  incrementPage,
  toggleExpandRepository,
  setSelectedTab,
} from "../redux/slices/repositoriesSlice";
import RepoStatsChart from "./RepoStatsChart";
import { fetchRepositoryStats } from "../services/githubService";

// expanded repo details for the repositories view charts 
const ExpandedRepoDetails = ({ repo }) => {
  const dispatch = useDispatch();
  const { selectedTab } = useSelector((state) => state.repositories);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [contributorData, setContributorData] = useState([]);
  const menuOpen = Boolean(menuAnchorEl);

  const fetchStats = async () => {
    if (!repo) return;

    setLoading(true);
    setError(null);

    try {
      const [owner, repoName] = repo.fullName.split("/");
      const statsData = await fetchRepositoryStats(owner, repoName);

      if (statsData.error) {
        setError(statsData.error);
        // Still set the stats so we can show placeholder charts
        setStats(statsData);
      } else {
        setStats(statsData);

        // Process contributor data for the chart
        if (statsData.contributors && statsData.contributors.length > 0) {
          // Format contributor data for multi-series chart
          const processedData = [];

          // Take top 5 contributors
          const topContributors = statsData.contributors
            .filter((contributor) => contributor && contributor.author) 
            .sort((a, b) => b.totalCommits - a.totalCommits)
            .slice(0, 5);

          // For each contributor, create a series with weekly contributions
          topContributors.forEach((contributor) => {
            if (!contributor.weeks || !contributor.author) return;

            // Map weekly contributions to data points
            const weeklyData = contributor.weeks.map((week, weekIndex) => ({
              x: weekIndex,
              y: week.c || 0, 
            }));

            processedData.push({
              name: contributor.author,
              data: weeklyData,
              totalCommits: contributor.totalCommits,
            });
          });

          setContributorData(processedData);
        }

        setError(null);
      }
    } catch (err) {
      console.error("Error processing contributor data:", err);
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
    <Paper
      sx={{
        p: 2,
        mb: 0,
        borderTopLeftRadius: 0,
        borderTopRightRadius: 0,
        bgcolor: "#f9f9f9",
        boxShadow: "none",
        borderTop: "1px dashed #ddd",
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mb: 2,
        }}
      >
        <Typography variant="subtitle1" fontWeight="medium">
          Repository Activity
        </Typography>
        <Box>
          <Button
            id="chart-menu-button"
            aria-controls={menuOpen ? "chart-menu" : undefined}
            aria-haspopup="true"
            aria-expanded={menuOpen ? "true" : undefined}
            onClick={handleOpenMenu}
            variant="outlined"
            endIcon={<MoreVert />}
            size="small"
          >
            {selectedTab === "commits"
              ? "Commits"
              : selectedTab === "additions"
              ? "Additions"
              : "Deletions"}
          </Button>
          <Menu
            id="chart-menu"
            anchorEl={menuAnchorEl}
            open={menuOpen}
            onClose={handleCloseMenu}
            MenuListProps={{
              "aria-labelledby": "chart-menu-button",
            }}
          >
            <MenuItem
              selected={selectedTab === "commits"}
              onClick={() => handleSelectMenuItem("commits")}
            >
              Commits
            </MenuItem>
            <MenuItem
              selected={selectedTab === "additions"}
              onClick={() => handleSelectMenuItem("additions")}
            >
              Additions
            </MenuItem>
            <MenuItem
              selected={selectedTab === "deletions"}
              onClick={() => handleSelectMenuItem("deletions")}
            >
              Deletions
            </MenuItem>
          </Menu>
        </Box>
      </Box>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Box sx={{ p: 4, textAlign: "center" }}>
          <Typography color="error" gutterBottom>
            Error loading charts
          </Typography>
          <Button
            variant="outlined"
            color="primary"
            onClick={handleRetry}
            startIcon={<Refresh />}
          >
            Retry
          </Button>
        </Box>
      ) : stats ? (
        <Box>
          {selectedTab === "commits" && (
            <RepoStatsChart
              data={stats.commits}
              title=""
              colorIndex={0}
              loading={loading}
              lineColor="#FF5252"
            />
          )}

          {selectedTab === "additions" && (
            <RepoStatsChart
              data={stats.additions}
              title=""
              type="column"
              colorIndex={1}
              loading={loading}
              lineColor="#4CAF50"
            />
          )}

          {selectedTab === "deletions" && (
            <RepoStatsChart
              data={stats.deletions}
              title=""
              type="column"
              colorIndex={2}
              loading={loading}
              lineColor="#F44336"
            />
          )}
        </Box>
      ) : null}

      {/* Contributors chart section */}
      {contributorData.length > 0 && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="subtitle1" fontWeight="medium" sx={{ mb: 2 }}>
            Contributor Activity
          </Typography>

          <RepoStatsChart
            multiSeries={true}
            seriesData={contributorData}
            title=""
            type="line"
            showLegend={true}
            loading={loading}
          />

          {/* Contributor legend */}
          <Box sx={{ mt: 2, display: "flex", flexWrap: "wrap", gap: 2 }}>
            {contributorData.map((contributor, index) => (
              <Box
                key={contributor.name}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  fontSize: "0.875rem",
                }}
              >
                <Box
                  sx={{
                    width: 12,
                    height: 12,
                    borderRadius: "50%",
                    bgcolor: getContributorColor(index),
                    mr: 1,
                  }}
                />
                <Typography variant="caption">
                  {contributor.name} ({contributor.totalCommits} commits)
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>
      )}
    </Paper>
  );
};

// Helper function to get contributor colors
const getContributorColor = (index) => {
  const colors = [
    "#2196f3",
    "#4CAF50",
    "#F44336",
    "#FF9800",
    "#9C27B0",
    "#E91E63",
    "#607D8B",
  ];
  return colors[index % colors.length];
};


// repositories view for the repositories view main component 
const RepositoriesView = () => {
  const dispatch = useDispatch();
  const { topRepositories, loading, hasMore, expandedRepo } = useSelector(
    (state) => state.repositories
  );

  const observer = useRef();
  const loadMoreRef = useRef();

  // observer for infinite scrolling
  const lastRepoElementRef = useCallback(
    (node) => {
      if (loading) return;
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && hasMore && !loading) {
            loadMoreRef.current();
          }
        },
        {
          rootMargin: "100px",
        }
      );

      if (node) observer.current.observe(node);
    },
    [loading, hasMore]
  );

  // Function to load more repositories
  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      dispatch(incrementPage());
      dispatch(fetchRepositoriesRequest({ isLoadMore: true }));
    }
  }, [dispatch, loading, hasMore]);

  // Store the loadMore function in a ref to avoid dependency issues
  useEffect(() => {
    loadMoreRef.current = loadMore;
  }, [loadMore]);

  const handleSelectRepository = (repo) => {
    dispatch(selectRepository(repo));
  };

  const handleToggleExpand = (event, repo) => {
    event.stopPropagation();
    dispatch(toggleExpandRepository(repo));
  };

  if (topRepositories.length === 0 && !loading) {
    return (
      <Box sx={{ mt: 2 }}>
        <Typography variant="body1">No repositories found.</Typography>
      </Box>
    );
  }

  return (
    <Paper sx={{ mb: 3 }}>
      <Typography
        variant="h5"
        component="h2"
        sx={{ p: 2, fontWeight: "medium", textAlign: "center" }}
      >
        Most Starred Repos
      </Typography>

      <List sx={{ width: "100%", bgcolor: "background.paper", p: 0 }}>
        {topRepositories.map((repo, index) => {
          // Set the ref for the last item
          const isLastElement = index === topRepositories.length - 1;
          const isExpanded = expandedRepo?.id === repo.id;
          const expandIcon = isExpanded ? <ExpandMore /> : <ChevronRight />;

          return (
            <Fragment key={repo.id}>
              <ListItem
                alignItems="flex-start"
                ref={isLastElement ? lastRepoElementRef : null}
                sx={{
                  py: 2,
                  px: 2,
                  cursor: "pointer",
                  bgcolor: isExpanded ? "#f5f5f5" : "background.paper",
                  "&:hover": {
                    bgcolor: isExpanded ? "#f5f5f5" : "action.hover",
                  },
                  borderBottom: isExpanded
                    ? "none"
                    : index < topRepositories.length - 1
                    ? "1px solid #f0f0f0"
                    : "none",
                }}
                onClick={() => handleSelectRepository(repo)}
                secondaryAction={
                  <IconButton
                    edge="end"
                    onClick={(e) => handleToggleExpand(e, repo)}
                    color={isExpanded ? "primary" : "default"}
                  >
                    {expandIcon}
                  </IconButton>
                }
              >
                <ListItemAvatar>
                  <Avatar
                    src={repo.owner.avatarUrl}
                    alt={repo.owner.login}
                    variant={"square"}
                    sx={{ width: 100, height: 100 }}
                  />
                </ListItemAvatar>

                <ListItemText
                  primary={
                    <Fragment>
                      <Typography variant="h6" component="div">
                        {repo.name}
                      </Typography>

                      <Typography
                        variant="body2"
                        color="text.secondary"
                        component="div"
                        sx={{
                          mb: 1,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                        }}
                      >
                        {repo.description || "No description available"}
                      </Typography>

                      <Box sx={{ display: "flex", gap: 2 }}>
                        <Box
                          sx={{
                            border: "1px solid #ddd",
                            borderRadius: "16px",
                            px: 1,
                            py: 0.5,
                            display: "inline-flex",
                            alignItems: "center",
                            fontSize: "0.75rem",
                          }}
                        >
                          <Typography variant="caption" component="div">
                            {repo.stars.toLocaleString()} Stars
                          </Typography>
                        </Box>

                        <Box
                          sx={{
                            border: "1px solid #ddd",
                            borderRadius: "16px",
                            px: 1,
                            py: 0.5,
                            display: "inline-flex",
                            alignItems: "center",
                            fontSize: "0.75rem",
                          }}
                        >
                          <Typography variant="caption" component="div">
                            {repo.forks.toLocaleString()} Issues
                          </Typography>
                        </Box>
                      </Box>

                      <Typography
                        variant="caption"
                        display="block"
                        component="div"
                        sx={{ mt: 1 }}
                      >
                        Last pushed{" "}
                        {new Date(repo.updatedAt).toLocaleDateString()} by{" "}
                        {repo.owner.login}
                      </Typography>
                    </Fragment>
                  }
                  sx={{ ml: 2 }}
                />
              </ListItem>

              {/*  expanded repo details for the repositories view charts  */}
              <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                <ExpandedRepoDetails repo={repo} />
              </Collapse>

              {/*  divider for the repositories view  */}
              {!isExpanded && index < topRepositories.length - 1 && (
                <Divider component="li" />
              )}
            </Fragment>
          );
        })}
      </List>

      {loading && (
        <Box sx={{ display: "flex", justifyContent: "center", my: 3 }}>
          <CircularProgress />
        </Box>
      )}

      {!hasMore && topRepositories.length > 0 && (
        <Box sx={{ textAlign: "center", py: 2 }}>
          <Typography variant="body2" color="text.secondary">
            No more repositories to load
          </Typography>
        </Box>
      )}
    </Paper>
  );
};

export default RepositoriesView;

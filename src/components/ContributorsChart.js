import React, { useMemo } from 'react';
import RepoStatsChart from './RepoStatsChart';
import { Box, Typography } from '@mui/material';

const ContributorsChart = ({ contributors, loading, error }) => {
  const processedData = useMemo(() => {
    if (!contributors || !Array.isArray(contributors)) return [];
    //sorting the contributors by total commits in descending order
    return contributors
      .filter(contributor => contributor && contributor.totalCommits > 0)
      .sort((a, b) => b.totalCommits - a.totalCommits)
      .slice(0, 10) // Show top 10 contributors
      .map(contributor => ({
        name: contributor.author || 'Unknown',
        y: contributor.totalCommits
      }));
  }, [contributors]);

  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="h6" gutterBottom>
        Top Contributors
      </Typography>
      <RepoStatsChart
        data={processedData}
        title="Repository Contributors"
        type="column"
        loading={loading}
        error={error}
        showLegend={true}
        isContributorsChart={true}
      />
    </Box>
  );
};

export default ContributorsChart; 
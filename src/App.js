import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Container, Box, Typography, CircularProgress, Paper } from '@mui/material';
import { fetchRepositoriesRequest } from './redux/slices/repositoriesSlice';
import FilterControls from './components/FilterControls';
import RepositoriesView  from './components/RepositoriesView';
import TokenAlert from './components/TokenAlert';

function App() {
  const dispatch = useDispatch();
  const { loading, error, topRepositories } = useSelector(state => state.repositories);

  useEffect(() => {
    // Only fetch on initial load if we don't have any repos yet
    if (topRepositories.length === 0) {
      dispatch(fetchRepositoriesRequest());
    }
  }, [dispatch, topRepositories.length]);

  return (
    <Box sx={{ 
      flexGrow: 1, 
      bgcolor: '#f5f5f5', 
      minHeight: '100vh',
      py: 4
    }}>
      <Container maxWidth="md">
        {error && (
          <Paper sx={{ 
            p: 2, 
            mb: 3, 
            bgcolor: 'error.main', 
            color: 'error.contrastText',
            borderRadius: 1 
          }}>
            <Typography>Error: {error}</Typography>
          </Paper>
        )}
      {/*  token alert for the repositories view  */}
        <TokenAlert />

      {/*  filter controls for the repositories view  */}
        <FilterControls />
      
      {/* loading state for the repositories view  */}
        {loading && topRepositories.length === 0 ? (
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center',
            height: '50vh' 
          }}>
            <CircularProgress />
          </Box>
        ) : (
          <RepositoriesView />
        )}
      </Container>
    </Box>
  );
}

export default App; 
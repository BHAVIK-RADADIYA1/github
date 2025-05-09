import React from 'react';
import { Alert, AlertTitle, Box, Link } from '@mui/material';
import { GITHUB_CONFIG } from '../config';

const TokenAlert = () => {
  // Don't show if the token is configured or auth is disabled
  if (!GITHUB_CONFIG.USE_AUTH || (GITHUB_CONFIG.API_TOKEN && GITHUB_CONFIG.API_TOKEN !== 'your_github_token_here')) {
    return null;
  }

  return (
    <Box sx={{ mb: 3 }}>
      <Alert severity="info" variant="outlined">
        <AlertTitle>GitHub API Token Needed</AlertTitle>
        To avoid rate limiting and get better API access, please add your GitHub personal access token in <strong>src/config.js</strong>
        <Box sx={{ mt: 1 }}>
          <Link 
            href="https://github.com/settings/tokens" 
            target="_blank" 
            rel="noopener noreferrer"
            sx={{ fontWeight: 'medium' }}
          >
            Create a token here
          </Link>
          {' with '}
          <strong>public_repo</strong> and <strong>read:user</strong> scopes.
        </Box>
      </Alert>
    </Box>
  );
};

export default TokenAlert; 
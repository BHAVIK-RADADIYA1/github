import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  Box, 
  FormControl, 
  Select, 
  MenuItem, 
  OutlinedInput
} from '@mui/material';
import { 
  setTimeFilter, 
  fetchRepositoriesRequest 
} from '../redux/slices/repositoriesSlice';

// filter controls for the repositories view 
const FilterControls = () => {
  const dispatch = useDispatch();
  const { timeFilter } = useSelector(state => state.repositories);

  const handleTimeFilterChange = (event) => {
    const value = event.target.value;
    dispatch(setTimeFilter(value));
    // When filter changes, do a fresh search (not load more)
    // The repositories slice will reset page to 1 and clear existing repos
    dispatch(fetchRepositoriesRequest());
  };

  return (
    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
      <FormControl size="small" variant="outlined">
        <Select
          value={timeFilter}
          onChange={handleTimeFilterChange}
          input={<OutlinedInput />}
          displayEmpty
          inputProps={{ 'aria-label': 'Time Period' }}
        >
          <MenuItem value="week">Last Week</MenuItem>
          <MenuItem value="month">Last Month</MenuItem>
          <MenuItem value="overall">Overall</MenuItem>
        </Select>
      </FormControl>
    </Box>
  );
};

export default FilterControls; 



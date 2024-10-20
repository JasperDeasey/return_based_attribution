import React, { useState, useEffect, useCallback } from 'react';
import { Box, TextField, List, ListItem, ListItemText } from '@mui/material';
import debounce from 'lodash.debounce';

const SearchComponent = ({ onSelect }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [benchmarks, setBenchmarks] = useState([]);

  useEffect(() => {
    fetch('/benchmark_metadata_temp.json')
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(data => {
        setBenchmarks(data);
      })
      .catch(error => {
        console.error("Error fetching the benchmarks data:", error);
      });
  }, []);

  const handleSearch = useCallback(debounce((query) => {
    const results = benchmarks
      .filter(benchmark => benchmark.benchmark_name.toLowerCase().includes(query.toLowerCase()))
      .slice(0, 50);
    setSearchResults(results);
  }, 300), [benchmarks]);

  useEffect(() => {
    if (searchQuery) {
      handleSearch(searchQuery);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery, handleSearch]);

  return (
    <Box sx={{ mb: 2 }}>
      <TextField
        label="Search by Name"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        fullWidth
        InputLabelProps={{ shrink: true }}
        sx={{ height: '50px' }}
      />
      {searchResults.length > 0 && (
        <List sx={{ mt: 2, maxHeight: 200, overflowY: 'auto', border: '1px solid #ccc', borderRadius: 1 }}>
          {searchResults.map((result) => (
            <ListItem
              button
              key={result.benchmark_name}
              onClick={() => onSelect(result.benchmark_name)}
            >
              <ListItemText
                primary={`${result.benchmark_name} (${result.min_date} - ${result.max_date})`}
              />
            </ListItem>
          ))}
        </List>
      )}
    </Box>
  );
};

export default SearchComponent;
import React, { useState, useEffect, useCallback } from 'react';
import { Box, TextField, List, ListItem, ListItemText } from '@mui/material';
import debounce from 'lodash.debounce';

const SelectResidual = ({ onSelect, availableDescriptions }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  const handleSearch = useCallback(debounce((query) => {
    const results = availableDescriptions
      .filter(description => description && description.toLowerCase().includes(query.toLowerCase()))
      .slice(0, 50);
    setSearchResults(results);
  }, 300), [availableDescriptions]);

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
        label="Residualize Against"
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
              key={result}
              onClick={() => onSelect(result)}
            >
              <ListItemText
                primary={result}
              />
            </ListItem>
          ))}
        </List>
      )}
    </Box>
  );
};

export default SelectResidual;
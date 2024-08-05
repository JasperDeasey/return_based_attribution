import React, { useState, useEffect } from 'react';
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Box,
  IconButton,
  TextField,
  Chip
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SearchComponent from '../SearchComponent'; // Adjust the import path as needed

const BenchmarkInputs = ({ benchmarkData, handleDescriptionChange, handleStreamChange }) => {
  const [description, setDescription] = useState(benchmarkData.description);
  const [expanded, setExpanded] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(benchmarkData.source || '');

  const handleChange = (event, isExpanded) => {
    setExpanded(isExpanded);
  };

  const handleSelectIndex = (benchmarkName) => {
    setSelectedIndex(benchmarkName);
    handleStreamChange('source', benchmarkName);
  };

  return (
    <Accordion expanded={expanded} onChange={handleChange}>
      <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center' }}>
          <TextField
            label="Description"
            variant="outlined"
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              handleDescriptionChange('description', e.target.value);
            }}
            InputLabelProps={{ shrink: true }}
            sx={{
              width: `${description.length + 2}ch`,
              minWidth: '150px'
            }}
            onClick={(event) => event.stopPropagation()}
          />
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', ml: 2 }}>
            <Typography variant="caption" sx={{ fontWeight: 'bold', mb: 0.5 }}>
            Primary Return Stream
            </Typography>
            <Chip
            label={selectedIndex}
            sx={{ backgroundColor: 'lightblue' }}
            />
        </Box>
        </Box>
      </AccordionSummary>
      <AccordionDetails>
        <Box sx={{ width: '100%' }}>
            <SearchComponent onSelect={handleSelectIndex} />
        </Box>
      </AccordionDetails>
    </Accordion>
  );
};

export default BenchmarkInputs;
import React, { useState, useEffect } from 'react';
import { Accordion, AccordionSummary, AccordionDetails, TextField, Box, IconButton, Typography, Chip } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ReturnStreamPaste from '../ReturnStreamPaste';
import LineChartComponent from '../LineChartComponent';

const FundReturnInput = ({ fund, onDescriptionChange, updateFundReturns, pastedData }) => {
  const [description, setDescription] = useState(fund.description);
  const [expanded, setExpanded] = useState(true);
  const [cumulativeReturn, setCumulativeReturn] = useState(null);
  const [chartData, setChartData] = useState(null);
  const [pastedRows, setPastedRows] = useState(pastedData || []); // Initialize with pastedData

  useEffect(() => {
    // If pastedData changes, update the pastedRows state
    setPastedRows(pastedData || []);
  }, [pastedData]);

  const handleDescriptionChange = (event) => {
    const newDescription = event.target.value;
    setDescription(newDescription);
    onDescriptionChange('description', newDescription);
  };

  const handleClear = () => {
    setChartData(null);
    setCumulativeReturn(null);
    setPastedRows([]); // Clear pasted rows
  };

  const handleSubmit = (rows) => {
    setPastedRows(rows); // Update the pasted rows
    const returns = rows.map(row => parseFloat(row.return || 0));
    const cumulatives = returns.reduce((acc, curr, i) => {
      acc.push((i === 0 ? 1 : acc[i-1]) * (1 + curr));
      return acc;
    }, []).map(value => (value - 1)); // Convert to percentage format
  
    const formattedData = {
      labels: rows.map(row => row.date),
      datasets: [{
        label: 'Cumulative Returns',
        data: cumulatives,
        fill: false,
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1
      }]
    };
  
    setCumulativeReturn((cumulatives[cumulatives.length - 1] / 100).toFixed(4) - 1); // Adjust for base 1
    setChartData(formattedData);
    updateFundReturns(rows); // Updating the state at the parent level
  };

  return (
    <Accordion expanded={expanded} onChange={(e, isExpanded) => setExpanded(isExpanded)}>
      <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center' }}>
          <TextField
            label="Description"
            variant="outlined"
            value={description}
            onChange={handleDescriptionChange}
            sx={{ width: 200 }}
            onClick={(event) => event.stopPropagation()}  // Prevents accordion action
          />
          {cumulativeReturn !== null && (
            <CheckCircleIcon style={{ color: 'green', padding: '5px'}} fontSize='large'/>
          )}
        </Box>
        <IconButton onClick={(e) => {
          e.stopPropagation();
          // Code to handle removal if necessary
        }}>
        </IconButton>
      </AccordionSummary>
      <AccordionDetails>
        <ReturnStreamPaste
          onClear={handleClear}
          onSubmit={handleSubmit}
          initialRows={pastedRows} // Pass the initial rows (pasted data)
        />
        {chartData && <LineChartComponent chartData={chartData} />}
      </AccordionDetails>
    </Accordion>
  );
};

export default FundReturnInput;
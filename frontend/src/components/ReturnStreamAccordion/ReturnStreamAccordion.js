import React, { useState } from 'react';
import { Accordion, AccordionSummary, AccordionDetails, Typography, Box, Button, MenuItem, Select } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import LineChartComponent from './LineChartComponent';
import ReturnStreamUpload from './ReturnStreamUpload';
import './ReturnStreamAccordion.css';

const ReturnStreamAccordion = () => {
  const [selectedOption, setSelectedOption] = useState('');
  const [chartData, setChartData] = useState(null);

  const handleOptionChange = (event) => {
    setSelectedOption(event.target.value);
    setChartData(null); // Reset chart data when changing options
  };

  // Mock function to fetch Fama-French data
  const fetchFamaFrenchData = async (model) => {
    // Implement the logic to fetch data for Fama-French models
    // and set it to chartData
    // This is a placeholder example
    const labels = ["2021-01", "2021-02", "2021-03"];
    const datasets = [
      {
        label: model,
        data: [0.01, 0.02, 0.03],
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 2,
      }
    ];
    setChartData({ labels, datasets });
  };

  const handleUploadData = (data) => {
    // Handle uploaded return stream data
    setChartData(data);
  };

  return (
    <Accordion>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography>Description</Typography>
      </AccordionSummary>
      <AccordionDetails>
        <Box sx={{ width: '100%' }}>
          <Typography variant="body1">Select an option:</Typography>
          <Select
            value={selectedOption}
            onChange={handleOptionChange}
            fullWidth
            displayEmpty
          >
            <MenuItem value="" disabled>
              Select an option
            </MenuItem>
            <MenuItem value="ff3">Fama-French 3 Factor Model</MenuItem>
            <MenuItem value="ff5">Fama-French 5 Factor Model</MenuItem>
            <MenuItem value="commodity">Commodity Factors</MenuItem>
            <MenuItem value="upload">Upload Returns</MenuItem>
          </Select>

          {selectedOption === 'ff3' && (
            <Button
              variant="contained"
              color="primary"
              onClick={() => fetchFamaFrenchData('Fama-French 3 Factor Model')}
              sx={{ mt: 2 }}
            >
              Generate Fama-French 3 Factor Model
            </Button>
          )}

          {selectedOption === 'ff5' && (
            <Button
              variant="contained"
              color="primary"
              onClick={() => fetchFamaFrenchData('Fama-French 5 Factor Model')}
              sx={{ mt: 2 }}
            >
              Generate Fama-French 5 Factor Model
            </Button>
          )}

          {selectedOption === 'commodity' && (
            <Button
              variant="contained"
              color="primary"
              onClick={() => fetchFamaFrenchData('Commodity Factors')}
              sx={{ mt: 2 }}
            >
              Generate Commodity Factors
            </Button>
          )}

          {selectedOption === 'upload' && (
            <ReturnStreamUpload onDataUpload={handleUploadData} />
          )}

          {chartData && (
            <Box sx={{ mt: 3 }}>
              <LineChartComponent chartData={chartData} />
            </Box>
          )}
        </Box>
      </AccordionDetails>
    </Accordion>
  );
};

export default ReturnStreamAccordion;
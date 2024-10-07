// frontend/src/components/RegressionChartSelection/RegressionChartSelection.js

import React, { useState, useEffect } from 'react';
import {
  ToggleButton,
  ToggleButtonGroup,
  Box,
  Grid,
  Typography,
  Tooltip,
} from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import StackedColumnChartComponent from '../StackedColumnChartComponent/StackedColumnChartComponent';
import modelDescriptions from './modelDescriptions';

const RegressionChartSelection = ({ data, metric }) => {
  const [selectedType, setSelectedType] = useState('Absolute');
  const [selectedPeriod, setSelectedPeriod] = useState(36); // Default to 3 years
  const [selectedModel, setSelectedModel] = useState('OLS'); // Default model type
  const [chartData, setChartData] = useState(null);

  // Function to get the chart data based on current selections
  const getChartData = () => {
    try {
      return data[selectedType][selectedPeriod][metric][selectedModel];
    } catch {
      return null;
    }
  };

  useEffect(() => {
    setChartData(getChartData());
  }, [selectedType, selectedPeriod, selectedModel, data]);

  // Handlers for changing selections
  const handleTypeChange = (event, newType) => {
    if (newType) setSelectedType(newType);
  };

  const handlePeriodChange = (event, newPeriod) => {
    if (newPeriod) setSelectedPeriod(newPeriod);
  };

  const handleModelChange = (event, newModel) => {
    if (newModel) setSelectedModel(newModel);
  };

  if (!chartData) {
    return <Typography>No Data Available</Typography>;
  }

  return (
    <Box width="100%">
      <Grid
        container
        spacing={2}
        justifyContent="space-between"
        alignItems="center"
        mb={2}
      >
        {/* Type Selection - Left Aligned */}
        <Grid item xs={12} md={4}>
          <ToggleButtonGroup
            value={selectedType}
            exclusive
            onChange={handleTypeChange}
            aria-label="Select Type"
            fullWidth
          >
            <ToggleButton value="Absolute">Absolute</ToggleButton>
            <ToggleButton value="Active">Active</ToggleButton>
          </ToggleButtonGroup>
        </Grid>

        {/* Model Selection - Centered with Tooltip */}
        <Grid item xs={12} md={4} container direction="column" alignItems="center">
          <ToggleButtonGroup
            value={selectedModel}
            exclusive
            onChange={handleModelChange}
            aria-label="Select Model"
          >
            <Tooltip title={modelDescriptions.OLS} arrow placement="top">
              <ToggleButton value="OLS">OLS</ToggleButton>
            </Tooltip>
            <Tooltip title={modelDescriptions.Ridge} arrow placement="top">
              <ToggleButton value="Ridge">Ridge</ToggleButton>
            </Tooltip>
            <Tooltip title={modelDescriptions.Lasso} arrow placement="top">
              <ToggleButton value="Lasso">Lasso</ToggleButton>
            </Tooltip>
          </ToggleButtonGroup>
        </Grid>

        {/* Period Selection - Right Aligned */}
        <Grid item xs={12} md={4} container justifyContent="flex-end">
          <ToggleButtonGroup
            value={selectedPeriod}
            exclusive
            onChange={handlePeriodChange}
            aria-label="Select Period"
          >
            <ToggleButton value={12}>1 yr</ToggleButton>
            <ToggleButton value={36}>3 yr</ToggleButton>
            <ToggleButton value={60}>5 yr</ToggleButton>
          </ToggleButtonGroup>
        </Grid>
      </Grid>

      {/* Chart Component */}
      <StackedColumnChartComponent chartData={chartData} />
    </Box>
  );
};

export default RegressionChartSelection;

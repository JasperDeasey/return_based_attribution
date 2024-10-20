// frontend/src/components/RegressionChartSelection/RegressionChartSelection.js

import React, { useState, useEffect } from 'react';
import {
  ToggleButton,
  ToggleButtonGroup,
  Box,
  Grid,
  Typography,
  Tooltip,
  Card,
  CardContent,
  CardHeader,
} from '@mui/material';
import StackedColumnChartComponent from '../StackedColumnChartComponent/StackedColumnChartComponent';
import modelDescriptions from './modelDescriptions';
import HeatMapComponent from '../HeatMapComponent/HeatMapComponent';

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

  // Extract factor names from datasets, excluding 'Residuals' and 'Total Return'
  const factorNames = chartData.datasets
    .map((dataset) => dataset.label)
    .filter((label) => label !== 'Residuals' && label !== 'Total Return');

  // Prepare data for heatmaps
  const regressionStats = chartData.regression_stats;
  const dates = Object.keys(regressionStats);

  // Format dates
  const formattedDates = dates.map((date) => {
    const dateObj = new Date(date);
    const options = { month: 'short', year: '2-digit' };
    return dateObj.toLocaleDateString(undefined, options); // e.g., "Aug 23"
  });

  // Initialize data structures
  const betaData = factorNames.map(() => []); // Array of arrays for beta values
  const pValueData = factorNames.map(() => []); // Array of arrays for p-values

  const rSquaredValues = [];
  const adjRSquaredValues = [];
  const bestAlphaValues = [];
  const scoreValues = [];

  dates.forEach((date) => {
    const stats = regressionStats[date];
    factorNames.forEach((_, factorIdx) => {
      const beta = stats.coefficients[factorIdx];
      betaData[factorIdx].push(beta != null ? beta : null);

      const pValue = stats.p_values ? stats.p_values[factorIdx] : null;
      pValueData[factorIdx].push(pValue != null ? pValue : null);
    });

    rSquaredValues.push(stats.r_squared != null ? stats.r_squared : null);
    adjRSquaredValues.push(stats.adj_r_squared != null ? stats.adj_r_squared : null);
    bestAlphaValues.push(stats.best_alpha != null ? stats.best_alpha : null);
    scoreValues.push(stats.score != null ? stats.score : null);
  });

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
      <Card variant="outlined" sx={{ mb: 4 }}>
        <CardContent>
          <StackedColumnChartComponent chartData={chartData} />
        </CardContent>
      </Card>

      {/* Heatmaps */}
      <Box mt={4}>
        {betaData.some((row) => row.some((val) => val != null)) && (
          <Card variant="outlined" sx={{ mb: 4 }}>
            <CardHeader title="Beta Heatmap" />
            <CardContent>
              <HeatMapComponent
                xLabels={formattedDates}
                yLabels={factorNames}
                data={betaData}
                metricType="diverging"
                centerValue={0}
              />
            </CardContent>
          </Card>
        )}
        {pValueData.some((row) => row.some((val) => val != null)) && (
          <Card variant="outlined" sx={{ mb: 4 }}>
            <CardHeader title="P-Value Heatmap" />
            <CardContent>
              <HeatMapComponent
                xLabels={formattedDates}
                yLabels={factorNames}
                data={pValueData}
                metricType="p-value"
                centerValue={0.05}
              />
            </CardContent>
          </Card>
        )}
        {rSquaredValues.some((val) => val != null) && (
          <Card variant="outlined" sx={{ mb: 4 }}>
            <CardHeader title="R² Heatmap" />
            <CardContent>
              <HeatMapComponent
                xLabels={formattedDates}
                yLabels={['R²']}
                data={[rSquaredValues]}
                metricType="sequential"
              />
            </CardContent>
          </Card>
        )}
        {adjRSquaredValues.some((val) => val != null) && (
          <Card variant="outlined" sx={{ mb: 4 }}>
          <CardHeader title="Adjusted R² Heatmap" />
          <CardContent>
          <HeatMapComponent
            xLabels={formattedDates}
            yLabels={['Adjusted R²']}
            data={[adjRSquaredValues]}
            metricType="sequential"
          />
          </CardContent>
          </Card>
        )}
        {bestAlphaValues.some((val) => val != null) && (
          <Card variant="outlined" sx={{ mb: 4 }}>
          <CardHeader title="Best Alpha Heatmap" />
          <CardContent>
          <HeatMapComponent
            xLabels={formattedDates}
            yLabels={['R²']}
            data={[bestAlphaValues]}
            metricType="sequential"
          />
          </CardContent>
          </Card>
        )}
        {scoreValues.some((val) => val != null) && (
          <Card variant="outlined" sx={{ mb: 4 }}>
          <CardHeader title="R² Heatmap" />
          <CardContent>
          <HeatMapComponent
            xLabels={formattedDates}
            yLabels={['R²']}
            data={[scoreValues]}
            metricType="sequential"
          />
          </CardContent>
          </Card>
        )}
        </Box>
    </Box>
  );
};

export default RegressionChartSelection;

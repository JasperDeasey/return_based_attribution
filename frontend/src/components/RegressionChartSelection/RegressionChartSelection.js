import React, { useState, useEffect } from 'react';
import { ToggleButton, ToggleButtonGroup, Box, Grid } from '@mui/material';
import RegressionStatisticCharts_OLS from '../RegressionStatisticCharts_OLS/RegressionStatisticCharts_OLS';
import RegressionStatisticCharts_Ridge from '../RegressionStatisticCharts_Ridge/RegressionStatisticCharts_Ridge';
import RegressionStatisticCharts_Lasso from '../RegressionStatisticCharts_Lasso/RegressionStatisticCharts_Lasso';
import StackedColumnChartComponent from '../StackedColumnChartComponent/StackedColumnChartComponent';

const RegressionChartSelection = ({ data, metric }) => {
  const [selectedType, setSelectedType] = useState('Absolute');
  const [selectedPeriod, setSelectedPeriod] = useState(36); // Default to 3 yr (36 months)
  const [selectedModel, setSelectedModel] = useState('OLS'); // Default model type
  const [chartData, setChartData] = useState({ title: 'No Data', labels: [], datasets: [] });

  const getChartData = () => {
    try {
      return data[selectedType][selectedPeriod][metric][selectedModel];
    } catch {
      return { title: 'No Data', labels: [], datasets: [] };
    }
  };

  useEffect(() => {
    setChartData(getChartData());
  }, [selectedType, selectedPeriod, selectedModel, data]);

  const handleTypeChange = (event, newType) => {
    if (newType !== null) {
      setSelectedType(newType);
    }
  };

  const handlePeriodChange = (event, newPeriod) => {
    if (newPeriod !== null) {
      setSelectedPeriod(newPeriod);
    }
  };

  const handleModelChange = (event, newModel) => {
    if (newModel !== null) {
      setSelectedModel(newModel);
    }
  };

  const renderSelectedChart = () => {
    if (selectedModel === 'OLS') {
      return <RegressionStatisticCharts_OLS chartData={chartData.regression_stats} />;
    } else if (selectedModel === 'Ridge') {
      return <RegressionStatisticCharts_Ridge chartData={chartData.regression_stats} />;
    } else if (selectedModel === 'Lasso') {
      return <RegressionStatisticCharts_Lasso chartData={chartData.regression_stats} />;
    }
  };

  return (
    <Box display="flex" flexDirection="column" alignItems="center" width="100%">
      <Grid container justifyContent="space-between" alignItems="center">
        <Grid item>
          <ToggleButtonGroup
            value={selectedType}
            exclusive
            onChange={handleTypeChange}
            aria-label="Chart Type"
          >
            <ToggleButton value="Absolute" aria-label="Absolute">
              Absolute
            </ToggleButton>
            <ToggleButton value="Active" aria-label="Active">
              Active
            </ToggleButton>
          </ToggleButtonGroup>
        </Grid>

        <Grid item>
          <ToggleButtonGroup
            value={selectedModel}
            exclusive
            onChange={handleModelChange}
            aria-label="Model Type"
          >
            <ToggleButton value="OLS" aria-label="OLS">
              OLS
            </ToggleButton>
            <ToggleButton value="Ridge" aria-label="Ridge">
              Ridge
            </ToggleButton>
            <ToggleButton value="Lasso" aria-label="Lasso">
              Lasso
            </ToggleButton>
          </ToggleButtonGroup>
        </Grid>

        <Grid item>
          <ToggleButtonGroup
            value={selectedPeriod}
            exclusive
            onChange={handlePeriodChange}
            aria-label="Time Period"
          >
            <ToggleButton value={12} aria-label="1 Year">
              1 yr
            </ToggleButton>
            <ToggleButton value={36} aria-label="3 Years">
              3 yr
            </ToggleButton>
            <ToggleButton value={60} aria-label="5 Years">
              5 yr
            </ToggleButton>
          </ToggleButtonGroup>
        </Grid>
      </Grid>

      <Box width="100%" mt={2}>
        <StackedColumnChartComponent chartData={chartData} />
        {renderSelectedChart()}
      </Box>
    </Box>
  );
};

export default RegressionChartSelection;

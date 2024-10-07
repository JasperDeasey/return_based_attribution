import React, { useState } from 'react';
import { ToggleButton, ToggleButtonGroup, Box, Grid } from '@mui/material';
import LineChartComponent from '../LineChartComponent';

const ChartSelection = ({ data, metric }) => {
  const [selectedType, setSelectedType] = useState('Active');
  const [selectedPeriod, setSelectedPeriod] = useState(0); // Default to 1 yr (12 months)

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

  const getChartData = () => {
    if (!data[selectedType] || !data[selectedType][0] || !data[selectedType][0][metric]) {
      return { title: 'No Data', labels: [], datasets: [] };
    }
    return data[selectedType][0][metric];
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
            value={selectedPeriod}
            exclusive
            onChange={handlePeriodChange}
            aria-label="Time Period"
          >
            <ToggleButton value={'Cumulative'} aria-label="Cumulative">
              Cumulative
            </ToggleButton>
          </ToggleButtonGroup>
        </Grid>
      </Grid>

      <Box width="100%" mt={2}>
        <LineChartComponent chartData={getChartData()} />
      </Box>
    </Box>
  );
};

export default ChartSelection;
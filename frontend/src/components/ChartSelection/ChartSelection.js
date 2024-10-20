import React, { useState } from 'react';
import { ToggleButton, ToggleButtonGroup, Box, Grid } from '@mui/material';
import LineChartComponent from '../LineChartComponent';

const ChartSelection = ({ data, metric }) => {
  const [selectedType, setSelectedType] = useState('Absolute');
  const [selectedPeriod, setSelectedPeriod] = useState(12); // Default to 1 yr (12 months)

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
    try {
      return data[selectedType][selectedPeriod][metric];
    } catch {
      return { title: 'No Data', labels: [], datasets: [] };
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
        <LineChartComponent chartData={getChartData()} />
      </Box>
    </Box>
  );
};

export default ChartSelection;
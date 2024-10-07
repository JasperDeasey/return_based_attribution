// frontend/src/screens/AnalysisScreen/AnalysisScreen.js

import React from 'react';
import './AnalysisScreen.css';
import { useLocation } from 'react-router-dom';
import ConeChartSelection from '../../components/ConeChartSelection/ConeChartSelection';
import ChartSelection from '../../components/ChartSelection/ChartSelection';
import RegressionChartSelection from '../../components/RegressionChartSelection/RegressionChartSelection';
import RegressionStatisticsTable from '../../components/RegressionStatisticsTable/RegressionStatisticsTable';
import PValuesHistogram from '../../components/PValuesHistogram/PValuesHistogram';
import { Box, Typography, Divider } from '@mui/material';

const AnalysisScreen = () => {
  const location = useLocation();
  const data = location.state?.data;

  return (
    <Box className="analysis-screen-container" p={2}>
      <Typography variant="h4" gutterBottom>
        Analysis
      </Typography>
      {data && (
        <>
          <Box my={4}>
            <Typography variant="h5">Cone Chart</Typography>
            <ConeChartSelection data={data} metric="cone_chart" />
          </Box>

          <Divider />

          <Box my={4}>
            <Typography variant="h5">Rolling Return</Typography>
            <ChartSelection data={data} metric="rolling_return" />
          </Box>

          <Divider />

          <Box my={4}>
            <Typography variant="h5">Rolling Volatility</Typography>
            <ChartSelection data={data} metric="rolling_volatility" />
          </Box>

          <Divider />

          <Box my={4}>
            <Typography variant="h5">Regression Models</Typography>
            <RegressionChartSelection data={data} metric="regression_metric" />
          </Box>

          <Divider />

          <Box my={4} display="flex" flexDirection={{ xs: 'column', md: 'row' }} gap={4}>
            <Box flex={1}>
              <RegressionStatisticsTable regressionStats={data.regression_stats} />
            </Box>
            <Box flex={1}>
              <PValuesHistogram regressionStats={data.regression_stats} />
            </Box>
          </Box>
        </>
      )}
    </Box>
  );
};

export default AnalysisScreen;

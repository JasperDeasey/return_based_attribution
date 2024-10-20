// frontend/src/screens/AnalysisScreen/AnalysisScreen.js

import React from 'react';
import './AnalysisScreen.css';
import { useLocation } from 'react-router-dom';
import ConeChartSelection from '../../components/ConeChartSelection/ConeChartSelection';
import ChartSelection from '../../components/ChartSelection/ChartSelection';
import RegressionChartSelection from '../../components/RegressionChartSelection/RegressionChartSelection';
import { Box, Typography, Divider, Card, CardContent, CardHeader } from '@mui/material';

const AnalysisScreen = () => {
  const location = useLocation();
  const data = location.state?.data;

  console.log(data);

  return (
    <Box p={2}>
      <Typography variant="h4" gutterBottom>
        Analysis
      </Typography>
      {data && (
        <>
          <Card variant="outlined" sx={{ mb: 4 }}>
            <CardHeader title="Cone Chart" />
            <CardContent>
              <ConeChartSelection data={data} metric="cone_chart" />
            </CardContent>
          </Card>

          <Card variant="outlined" sx={{ mb: 4 }}>
            <CardHeader title="Rolling Return" />
            <CardContent>
              <ChartSelection data={data} metric="rolling_return" />
            </CardContent>
          </Card>

          <Card variant="outlined" sx={{ mb: 4 }}>
            <CardHeader title="Rolling Volatility" />
            <CardContent>
              <ChartSelection data={data} metric="rolling_volatility" />
            </CardContent>
          </Card>

          <Card variant="outlined" sx={{ mb: 4 }}>
            <CardHeader title="Regression Models" />
            <CardContent>
              <RegressionChartSelection data={data} metric="regression_metric" />
            </CardContent>
          </Card>
        </>
      )}
    </Box>
  );
};

export default AnalysisScreen;

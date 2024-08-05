import React, { useState, useEffect } from 'react';
import { Box, Button, Typography } from '@mui/material';
import { LineChart } from '@mui/x-charts/LineChart';
import PropTypes from 'prop-types';
import './ReturnStreamChart.css';

const calculateMonthlyReturns = (data) => {
  let returns = [];
  for (let i = 1; i < data.length; i++) {
    const monthlyReturn = (data[i].close - data[i - 1].close) / data[i - 1].close;
    returns.push(monthlyReturn);
  }
  return returns;
};

const convertToCumulativeReturns = (returns) => {
  let cumulativeReturns = [1];
  for (let i = 0; i < returns.length; i++) {
    cumulativeReturns.push(cumulativeReturns[i] * (1 + returns[i]));
  }
  return cumulativeReturns;
};

const ReturnStreamChart = ({ returnStream, data }) => {
  const [chartData, setChartData] = useState([]);
  const [isCollapsed, setIsCollapsed] = useState(true);

  useEffect(() => {
    const processData = () => {
      const sortedData = data.sort((a, b) => new Date(a.date) - new Date(b.date));
      const returns = calculateMonthlyReturns(sortedData);
      const cumulativeReturns = convertToCumulativeReturns(returns);
      const chartData = sortedData.map((d, i) => ({ date: d.date, value: cumulativeReturns[i] }));
      setChartData(chartData);
    };

    processData();
  }, [data]);

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <Box className="return-stream-chart">
      <Button className="collapse-button" onClick={toggleCollapse} variant="contained">
        {isCollapsed ? 'Expand' : 'Collapse'} Chart
      </Button>
      <Box className="return-stream-summary" sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 }}>
        <Typography>{returnStream.returnStream1}</Typography>
        <Typography>{returnStream.description}</Typography>
      </Box>
      {!isCollapsed && (
        <Box className="chart-container" sx={{ marginTop: 3 }}>
          <LineChart
            xAxis={[{ data: chartData.map(d => d.date), dataKey: 'date' }]}
            series={[
              {
                data: chartData.map(d => d.value),
                dataKey: 'value',
              },
            ]}
            height={400}
            width="100%"
          />
        </Box>
      )}
    </Box>
  );
};

ReturnStreamChart.propTypes = {
  returnStream: PropTypes.shape({
    returnStream1: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
  }).isRequired,
  data: PropTypes.arrayOf(
    PropTypes.shape({
      date: PropTypes.string.isRequired,
      close: PropTypes.number.isRequired,
    })
  ).isRequired,
};

export default ReturnStreamChart;
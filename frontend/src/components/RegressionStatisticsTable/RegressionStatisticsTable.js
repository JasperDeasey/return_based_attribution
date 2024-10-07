// frontend/src/components/RegressionStatisticsTable/RegressionStatisticsTable.js

import React from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Typography, Box,
} from '@mui/material';

const RegressionStatisticsTable = ({ regressionStats }) => {
  if (!regressionStats || Object.keys(regressionStats).length === 0) {
    return <Typography>No Regression Statistics Available</Typography>;
  }

  // Extract data keys
  const dates = Object.keys(regressionStats);
  const factors = regressionStats[dates[0]].coefficients.map((_, index) => `Factor ${index + 1}`);

  return (
    <Box mt={4}>
      <Typography variant="h6" align="center" gutterBottom>
        Regression Statistics
      </Typography>
      <TableContainer component={Paper}>
        <Table aria-label="regression statistics table">
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              {factors.map((factor) => (
                <TableCell key={factor} align="right">{factor} Beta</TableCell>
              ))}
              {factors.map((factor) => (
                <TableCell key={`${factor}-p`} align="right">{factor} P-Value</TableCell>
              ))}
              <TableCell align="right">R²</TableCell>
              <TableCell align="right">Adjusted R²</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {dates.map((date) => {
              const stats = regressionStats[date];
              return (
                <TableRow key={date}>
                  <TableCell component="th" scope="row">
                    {date}
                  </TableCell>
                  {stats.coefficients.map((beta, idx) => (
                    <TableCell key={`beta-${idx}`} align="right">
                      {beta.toFixed(4)}
                    </TableCell>
                  ))}
                  {stats.p_values.map((pValue, idx) => (
                    <TableCell key={`pValue-${idx}`} align="right">
                      {pValue.toFixed(4)}
                    </TableCell>
                  ))}
                  <TableCell align="right">{stats.r_squared.toFixed(4)}</TableCell>
                  <TableCell align="right">{stats.adjusted_r_squared.toFixed(4)}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default RegressionStatisticsTable;

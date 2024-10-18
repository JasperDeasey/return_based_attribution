// frontend/src/components/RegressionStatisticsTable/RegressionStatisticsTable.js

import React from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Typography, Box,
} from '@mui/material';

const RegressionStatisticsTable = ({ regressionStats, factorNames }) => {
  if (!regressionStats || Object.keys(regressionStats).length === 0) {
    return <Typography>No Regression Statistics Available</Typography>;
  }

  const dates = Object.keys(regressionStats);

  const statsExample = regressionStats[dates[0]];

  // Determine available statistics
  const hasPValues = statsExample.p_values && statsExample.p_values.length > 0;
  const hasRSquared = statsExample.r_squared != null;
  const hasAdjustedRSquared = statsExample.adj_r_squared != null;
  const hasBestAlpha = statsExample.best_alpha != null;
  const hasScore = statsExample.score != null;

  // Build the columns
  const columns = [
    { label: 'Date', key: 'date' },
    ...factorNames.map((factor, idx) => ({ label: `${factor} Beta`, key: `beta_${idx}` })),
  ];

  if (hasPValues) {
    columns.push(
      ...factorNames.map((factor, idx) => ({ label: `${factor} P-Value`, key: `pvalue_${idx}` }))
    );
  }

  if (hasRSquared) {
    columns.push({ label: 'R²', key: 'r_squared' });
  }

  if (hasAdjustedRSquared) {
    columns.push({ label: 'Adjusted R²', key: 'adjusted_r_squared' });
  }

  if (hasBestAlpha) {
    columns.push({ label: 'Best Alpha', key: 'best_alpha' });
  }

  if (hasScore) {
    columns.push({ label: 'Score', key: 'score' });
  }

  return (
    <Box mt={4}>
      <Typography variant="h6" align="center" gutterBottom>
        Regression Statistics
      </Typography>
      <TableContainer component={Paper}>
        <Table aria-label="regression statistics table">
          <TableHead>
            <TableRow>
              {columns.map((column) => (
                <TableCell key={column.key} align={column.key === 'date' ? 'left' : 'right'}>
                  {column.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {dates.map((date) => {
              const stats = regressionStats[date];
              return (
                <TableRow key={date}>
                  {columns.map((column) => {
                    let value;
                    if (column.key === 'date') {
                      value = date;
                    } else if (column.key.startsWith('beta_')) {
                      const idx = parseInt(column.key.split('_')[1], 10);
                      const beta = stats.coefficients[idx];
                      value = beta != null ? beta.toFixed(4) : 'N/A';
                    } else if (column.key.startsWith('pvalue_')) {
                      const idx = parseInt(column.key.split('_')[1], 10);
                      const pValue = stats.p_values ? stats.p_values[idx] : null;
                      value = pValue != null ? pValue.toFixed(4) : 'N/A';
                    } else {
                      const statValue = stats[column.key];
                      value = statValue != null ? statValue.toFixed(4) : 'N/A';
                    }
                    return (
                      <TableCell key={column.key} align={column.key === 'date' ? 'left' : 'right'}>
                        {value}
                      </TableCell>
                    );
                  })}
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

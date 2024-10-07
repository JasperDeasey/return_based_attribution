// frontend/src/components/PValuesHistogram/PValuesHistogram.js

import React, { useMemo } from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Title } from 'chart.js';
import { Box, Typography } from '@mui/material';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Title);

const PValuesHistogram = ({ regressionStats }) => {
  const histogramData = useMemo(() => {
    if (!regressionStats || Object.keys(regressionStats).length === 0) return null;

    const allPValues = [];
    Object.values(regressionStats).forEach((stats) => {
      allPValues.push(...stats.p_values);
    });

    // Define bins
    const binSize = 0.05;
    const bins = Array.from({ length: Math.ceil(1 / binSize) }, (_, i) => i * binSize);

    // Count occurrences in each bin
    const counts = bins.map((bin) => {
      return allPValues.filter((p) => p >= bin && p < bin + binSize).length;
    });

    return {
      labels: bins.map((bin) => bin.toFixed(2)),
      datasets: [
        {
          label: 'P-Value Distribution',
          data: counts,
          backgroundColor: 'rgba(54, 162, 235, 0.6)',
        },
      ],
    };
  }, [regressionStats]);

  if (!histogramData) return null;

  const options = {
    responsive: true,
    plugins: {
      title: {
        display: true,
        text: 'P-Values Distribution Histogram',
      },
      tooltip: {
        callbacks: {
          label: (context) => `Count: ${context.parsed.y}`,
        },
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'P-Value Range',
        },
      },
      y: {
        title: {
          display: true,
          text: 'Frequency',
        },
      },
    },
  };

  return (
    <Box mt={4}>
      <Typography variant="h6" align="center" gutterBottom>
        P-Values Distribution
      </Typography>
      <Bar data={histogramData} options={options} />
    </Box>
  );
};

export default PValuesHistogram;

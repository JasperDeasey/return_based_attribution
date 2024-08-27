import React from 'react';
import { Line } from 'react-chartjs-2';

const RegressionStatisticCharts_Ridge = ({ chartData }) => {
  const labels = Object.keys(chartData);
  const bestAlpha = labels.map((date) => chartData[date].best_alpha);
  const scores = labels.map((date) => chartData[date].score);
  const coefficients = labels.map((date) => chartData[date].coefficients);

  const data = {
    labels,
    datasets: [
      {
        label: 'Best Alpha',
        data: bestAlpha,
        borderColor: 'rgba(75,192,192,1)',
        fill: false,
        yAxisID: 'y1',
      },
      {
        label: 'Score',
        data: scores,
        borderColor: 'rgba(153,102,255,1)',
        fill: false,
        yAxisID: 'y1',
      },
      ...coefficients[0].map((_, idx) => ({
        label: `Coefficient ${idx + 1}`,
        data: coefficients.map((coef) => coef[idx]),
        borderColor: `rgba(${Math.floor(Math.random() * 255)},${Math.floor(
          Math.random() * 255
        )},${Math.floor(Math.random() * 255)},1)`,
        fill: false,
        yAxisID: 'y2',
      })),
    ],
  };

  const options = {
    scales: {
      y1: {
        type: 'linear',
        position: 'left',
      },
      y2: {
        type: 'linear',
        position: 'right',
        grid: {
          drawOnChartArea: false,
        },
      },
    },
  };

  return <Line data={data} options={options} />;
};

export default RegressionStatisticCharts_Ridge;

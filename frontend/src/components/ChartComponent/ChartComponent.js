import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import './ChartComponent.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const ChartComponent = ({ benchmarkDescription, returnStreams, labels, data }) => {
  const generateChartData = () => {
    const datasets = [
      {
        label: benchmarkDescription,
        data: data,
        borderColor: 'black',
        borderWidth: 3,
      },
      ...returnStreams
    ];
    return { labels, datasets };
  };

  return <Line data={generateChartData()} />;
};

export default ChartComponent;
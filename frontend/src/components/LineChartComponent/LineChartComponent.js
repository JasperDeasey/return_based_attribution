import React from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, TimeScale } from 'chart.js';
import { Button, IconButton } from '@mui/material';
import { SaveAlt as SaveAltIcon, FileCopy as FileCopyIcon, Image as ImageIcon } from '@mui/icons-material';
import html2canvas from 'html2canvas';
import { saveAs } from 'file-saver';
import 'chartjs-adapter-date-fns';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, TimeScale);

// Define a color palette
const colorPalette = [
  'rgba(75, 192, 192, 1)',
  'rgba(153, 102, 255, 1)',
  'rgba(255, 159, 64, 1)',
  'rgba(255, 99, 132, 1)',
  'rgba(54, 162, 235, 1)',
  'rgba(255, 206, 86, 1)',
  'rgba(75, 192, 192, 1)',
  'rgba(153, 102, 255, 1)',
  'rgba(255, 159, 64, 1)',
  'rgba(255, 99, 132, 1)'
];

const LineChartComponent = ({ chartData }) => {
  const chartRef = React.useRef(null);

  const downloadCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Date," + chartData.datasets.map(dataset => dataset.label).join(",") + "\n";

    chartData.labels.forEach((label, index) => {
      const row = [label, ...chartData.datasets.map(dataset => dataset.data[index])].join(",");
      csvContent += row + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "chart_data.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const copyImage = async () => {
    const canvas = await html2canvas(chartRef.current);
    canvas.toBlob(blob => {
      const item = new ClipboardItem({ "image/png": blob });
      navigator.clipboard.write([item]);
    });
  };

  const downloadImage = async () => {
    const canvas = await html2canvas(chartRef.current);
    canvas.toBlob(blob => {
      saveAs(blob, "chart_image.png");
    });
  };

  const generateChartData = () => {
    const datasetsWithDefaults = chartData.datasets.map((dataset, index) => ({
      ...dataset,
      borderColor: dataset.borderColor || colorPalette[index % colorPalette.length],
    }));

    return {
      ...chartData,
      datasets: datasetsWithDefaults
    };
  };

  const options = {
    scales: {
      x: {
        type: 'time',
        time: {
          unit: 'month',
        },
        title: {
          display: false,
        }
      },
      y: {
        title: {
          display: false,
        }
      }
    },
    plugins: {
      legend: {
        display: true,
      },
      title: {
        display: false,
      }
    }
  };

  return (
    <div style={{ position: "relative" }}>
      <div ref={chartRef}>
        <Line data={generateChartData()} options={options} />
      </div>
      <div style={{ marginTop: "10px", display: "flex", justifyContent: "center" }}>
        <Button variant="contained" color="primary" startIcon={<SaveAltIcon />} onClick={downloadCSV}>
          Download CSV
        </Button>
        <IconButton color="primary" onClick={copyImage}>
          <FileCopyIcon />
        </IconButton>
        <IconButton color="primary" onClick={downloadImage}>
          <ImageIcon />
        </IconButton>
      </div>
    </div>
  );
};

export default LineChartComponent;

import React from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, TimeScale } from 'chart.js';
import { IconButton } from '@mui/material';
import { SaveAlt as SaveAltIcon, FileCopy as FileCopyIcon, Image as ImageIcon } from '@mui/icons-material';
import DownloadIcon from '@mui/icons-material/Download';

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

  const multiplyDataBy100 = (data) => data.map(value => value * 100);

  const downloadCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Date," + chartData.datasets.map(dataset => dataset.label).join(",") + "\n";

    chartData.labels.forEach((label, index) => {
      const row = [label, ...chartData.datasets.map(dataset => dataset.data[index] * 100)].join(","); // Multiply data by 100
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

  const downloadImage = async () => {
    const canvas = await html2canvas(chartRef.current);
    canvas.toBlob(blob => {
      saveAs(blob, "chart_image.png");
    });
  };

  const generateChartData = () => {
    const datasetsWithDefaults = chartData.datasets.map((dataset, index) => ({
      ...dataset,
      data: multiplyDataBy100(dataset.data), // Multiply data by 100
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
        },
        ticks: {
          callback: function(value) {
            return value.toFixed(2) + '%';  // Convert to percentage with 2 decimal places
          }
        },
        grid: {
          drawOnChartArea: true,  // Ensure grid lines are drawn
          color: function(context) {
            if (context.tick.value === 0) {
              return '#000000';  // Highlight zero line with a different color
            }
            return 'rgba(0, 0, 0, 0.1)';
          }
        }
      }
    },
    plugins: {
      legend: {
        display: true,
      },
      title: {
        display: !!chartData.title, 
        text: chartData.title, 
        position: 'top', 
        font: {
          size: 16  // Set font size (optional)
        }
      }
    },
    elements: {
      line: {
        tension: 0.25,
      }, 
      point: { radius: 0 }
    }
  };

  return (
    <div style={{ position: "relative" }}>
      <div ref={chartRef}>
        <Line data={generateChartData()} options={options} />
      </div>
      <div style={{ marginTop: "10px", display: "flex", justifyContent: "center" }}>
        <IconButton color="primary" onClick={downloadCSV}>
          <DownloadIcon />
        </IconButton>

        <IconButton color="primary" onClick={downloadImage}>
          <ImageIcon />
        </IconButton>
      </div>
    </div>
  );
};

export default LineChartComponent;